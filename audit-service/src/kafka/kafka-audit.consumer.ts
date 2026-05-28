import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka, logLevel, Producer } from 'kafkajs';
import { AuditService, AuditEventPayload } from '../audit/audit.service';
import { MetricsService } from '../metrics/metrics.service';

type HeaderValue = Buffer | string | Array<Buffer | string> | undefined;
type KafkaHeaders = Record<string, HeaderValue>;
@Injectable()
export class KafkaAuditConsumer
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(KafkaAuditConsumer.name);

  private consumer: Consumer;
  private producer: Producer;

  private readonly mainTopic: string;
  private readonly retryTopic: string;
  private readonly dlqTopic: string;
  private readonly maxRetries: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly metricsService: MetricsService,
  ) {
    const brokers = this.configService
      .get<string>('KAFKA_BROKERS', '192.168.0.16:9092')
      .split(',')
      .map((broker) => broker.trim());

    const username = this.configService.get<string>('KAFKA_USERNAME') ?? '';
    const password = this.configService.get<string>('KAFKA_PASSWORD') ?? '';

    this.mainTopic = this.configService.get<string>(
      'KAFKA_AUDIT_TOPIC',
      'audit.events',
    );

    this.retryTopic = this.configService.get<string>(
      'KAFKA_AUDIT_RETRY_TOPIC',
      `${this.mainTopic}.retry`,
    );

    this.dlqTopic = this.configService.get<string>(
      'KAFKA_AUDIT_DLQ_TOPIC',
      `${this.mainTopic}.dlq`,
    );

    this.maxRetries = Number(
      this.configService.get<string>('KAFKA_AUDIT_MAX_RETRIES', '5'),
    );

    const kafka = new Kafka({
      clientId: this.configService.get<string>(
        'KAFKA_CLIENT_ID',
        'audit-service',
      ),
      brokers,
      ssl: false,
      sasl:
        username && password
          ? {
              mechanism: 'scram-sha-512',
              username,
              password,
            }
          : undefined,
      connectionTimeout: 10000,
      authenticationTimeout: 10000,
      retry: {
        initialRetryTime: 1000,
        retries: 8,
      },
      logLevel: logLevel.INFO,
    });

    this.consumer = kafka.consumer({
      groupId: this.configService.get<string>(
        'KAFKA_AUDIT_GROUP_ID',
        'audit.events-group',
      ),
    });

    this.producer = kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    await this.consumer.connect();

    this.logger.log('Connected to Kafka');

    await this.consumer.subscribe({
      topic: this.mainTopic,
      fromBeginning: false,
    });

    await this.consumer.subscribe({
      topic: this.retryTopic,
      fromBeginning: false,
    });

    this.logger.log(
      `Subscribed to Kafka topics main=${this.mainTopic}, retry=${this.retryTopic}`,
    );

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const startedAt = Date.now();
        const rawValue = message.value?.toString('utf8');

        if (!rawValue) return;

        let payload: AuditEventPayload | undefined;
        let eventType = 'unknown';
        let sourceService = 'user-service';

        try {
          const parsed = JSON.parse(rawValue) as AuditEventPayload;

          eventType =
            typeof parsed.eventType === 'string' ? parsed.eventType : 'unknown';

          sourceService = parsed.sourceService ?? 'user-service';

          payload = {
            ...parsed,
            sourceService,
            sourceTransport: parsed.sourceTransport ?? 'kafka',
            topic,
            metadata: {
              ...(typeof parsed.metadata === 'object' && parsed.metadata !== null
                ? parsed.metadata
                : {}),
              kafkaTopic: topic,
              kafkaPartition: partition,
              kafkaOffset: message.offset,
              kafkaKey: message.key?.toString('utf8'),
              retryCount: this.getRetryCount(message.headers),
            },
          };

          const labels = this.getLabels({
            sourceService,
            eventType,
            topic,
          });

          this.metricsService.auditEventsReceivedTotal.inc(labels);
          this.metricsService.auditEventsConsumedTotal.inc(labels);
          this.metricsService.auditEventsProcessingStartedTotal.inc(labels);

          this.logger.log(
            JSON.stringify({
              type: 'kafka_audit_event_received',
              service: 'audit-service',
              eventType,
              eventId: payload.eventId,
              topic,
              partition,
              offset: message.offset,
              userId: payload.userId,
              retryCount: this.getRetryCount(message.headers),
              result: 'received',
            }),
          );

          await this.auditService.saveAuditLog(payload);

          this.metricsService.auditEventsProcessingFinishedTotal.inc({
            ...labels,
            result: 'success',
          });

          this.metricsService.auditEventsAckTotal.inc(labels);

          this.metricsService.auditEventsProcessingDurationSeconds.observe(
            {
              ...labels,
              result: 'success',
            },
            (Date.now() - startedAt) / 1000,
          );

          this.logger.log(
            JSON.stringify({
              type: 'kafka_audit_event_consumed',
              service: 'audit-service',
              eventType,
              eventId: payload.eventId,
              topic,
              partition,
              offset: message.offset,
              userId: payload.userId,
              result: 'success',
            }),
          );
        } catch (error) {
          const retryCount = this.getRetryCount(message.headers);
          const labels = this.getLabels({
            sourceService,
            eventType,
            topic,
          });

          this.metricsService.auditEventsProcessingFailedTotal.inc({
            ...labels,
            stage: retryCount >= this.maxRetries ? 'final_failure' : 'consume',
          });

          this.metricsService.auditEventsProcessingFinishedTotal.inc({
            ...labels,
            result: 'failed',
          });

          this.metricsService.auditEventsProcessingDurationSeconds.observe(
            {
              ...labels,
              result: 'failed',
            },
            (Date.now() - startedAt) / 1000,
          );

          this.logger.error(
            JSON.stringify({
              type: 'kafka_audit_event_failed',
              service: 'audit-service',
              eventType,
              eventId: payload?.eventId,
              topic,
              partition,
              offset: message.offset,
              retryCount,
              maxRetries: this.maxRetries,
              error: error instanceof Error ? error.message : String(error),
            }),
            error instanceof Error ? error.stack : undefined,
          );

          if (retryCount >= this.maxRetries) {
            await this.sendToDlq({
              originalTopic: topic,
              partition,
              offset: message.offset,
              key: message.key?.toString('utf8'),
              rawValue,
              headers: message.headers ?? {},
              error,
              eventType,
              sourceService,
            });

            return;
          }

          await this.sendToRetry({
            originalTopic: topic,
            partition,
            offset: message.offset,
            key: message.key?.toString('utf8'),
            rawValue,
            headers: message.headers ?? {},
            retryCount,
            error,
            eventType,
            sourceService,
          });
        }
      },
    });

    this.logger.log(
      `Kafka audit consumer started. main=${this.mainTopic}, retry=${this.retryTopic}, dlq=${this.dlqTopic}`,
    );
  }

  async onApplicationShutdown() {
    await this.consumer.disconnect();
    await this.producer.disconnect();
    this.logger.log('Kafka audit consumer disconnected');
  }

  private async sendToRetry(params: {
    originalTopic: string;
    partition: number;
    offset: string;
    key?: string;
    rawValue: string;
    headers: KafkaHeaders;
    retryCount: number;
    error: unknown;
    eventType: string;
    sourceService: string;
  }) {
    const nextRetryCount = params.retryCount + 1;

    await this.producer.send({
      topic: this.retryTopic,
      messages: [
        {
          key: params.key,
          value: params.rawValue,
          headers: {
            ...params.headers,
            retryCount: String(nextRetryCount),
            originalTopic: params.originalTopic,
            originalPartition: String(params.partition),
            originalOffset: params.offset,
            lastError:
              params.error instanceof Error
                ? params.error.message
                : String(params.error),
            failedAt: new Date().toISOString(),
          },
        },
      ],
    });

    const labels = this.getLabels({
      sourceService: params.sourceService,
      eventType: params.eventType,
      topic: this.retryTopic,
    });

    this.metricsService.auditEventsSentToRetryTotal.inc(labels);

    this.logger.warn(
      JSON.stringify({
        type: 'kafka_audit_event_sent_to_retry',
        service: 'audit-service',
        eventType: params.eventType,
        retryTopic: this.retryTopic,
        retryCount: nextRetryCount,
        originalTopic: params.originalTopic,
        originalPartition: params.partition,
        originalOffset: params.offset,
      }),
    );
  }

  private async sendToDlq(params: {
    originalTopic: string;
    partition: number;
    offset: string;
    key?: string;
    rawValue: string;
    headers: KafkaHeaders;
    error: unknown;
    eventType: string;
    sourceService: string;
  }) {
    await this.producer.send({
      topic: this.dlqTopic,
      messages: [
        {
          key: params.key,
          value: params.rawValue,
          headers: {
            ...params.headers,
            originalTopic: params.originalTopic,
            originalPartition: String(params.partition),
            originalOffset: params.offset,
            finalError:
              params.error instanceof Error
                ? params.error.message
                : String(params.error),
            finalFailureAt: new Date().toISOString(),
          },
        },
      ],
    });

    const labels = this.getLabels({
      sourceService: params.sourceService,
      eventType: params.eventType,
      topic: this.dlqTopic,
    });

    this.metricsService.auditEventsSentToDlqTotal.inc(labels);

    this.logger.error(
      JSON.stringify({
        type: 'kafka_audit_event_sent_to_dlq',
        service: 'audit-service',
        eventType: params.eventType,
        dlqTopic: this.dlqTopic,
        originalTopic: params.originalTopic,
        originalPartition: params.partition,
        originalOffset: params.offset,
      }),
    );
  }

  private getRetryCount(headers?: KafkaHeaders): number {
    const value = headers?.retryCount ?? headers?.['x-retry-count'];
  
    const normalized = this.headerToString(value);
    const parsed = Number(normalized ?? 0);
  
    return Number.isFinite(parsed) ? parsed : 0;
  }
  
  private headerToString(value: HeaderValue): string | undefined {
    if (Array.isArray(value)) {
      return this.headerToString(value[0]);
    }
  
    if (Buffer.isBuffer(value)) {
      return value.toString('utf8');
    }
  
    if (typeof value === 'string') {
      return value;
    }
  
    return undefined;
  }
  private getLabels(params: {
    sourceService: string;
    eventType: string;
    topic: string;
  }) {
    return {
      source: params.sourceService,
      source_service: params.sourceService,
      event: params.eventType,
      transport: 'kafka',
      queue: params.topic,
      topic: params.topic,
    };
  }
}