// audit-service/src/kafka/kafka-audit.consumer.ts

import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka, logLevel } from 'kafkajs';
import { AuditService, AuditEventPayload } from '../audit/audit.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class KafkaAuditConsumer
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(KafkaAuditConsumer.name);

  private consumer: Consumer;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly metricsService: MetricsService,
  ) {
    const brokers = this.configService
      .get<string>('KAFKA_BROKERS', '192.168.0.16:9092')
      .split(',')
      .map((broker) => broker.trim());

    const username =
      this.configService.get<string>('KAFKA_USERNAME') ?? '';

    const password =
      this.configService.get<string>('KAFKA_PASSWORD') ?? '';

    const kafka = new Kafka({
      clientId: this.configService.get<string>(
        'KAFKA_CLIENT_ID',
        'audit-service',
      ),

      brokers,

      ssl: false,

      sasl: {
        mechanism: 'scram-sha-512',
        username,
        password,
      },

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
        'audit-service-group',
      ),
    });
  }

  async onModuleInit() {
    const topic = this.configService.get<string>(
      'KAFKA_AUDIT_TOPIC',
      'audit.events',
    );

    await this.consumer.connect();

    this.logger.log(`Connected to Kafka`);

    await this.consumer.subscribe({
      topic,
      fromBeginning: false,
    });

    this.logger.log(`Subscribed to Kafka topic=${topic}`);

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const rawValue = message.value?.toString('utf8');

        if (!rawValue) return;

        let payload: AuditEventPayload;
        let eventType = 'unknown';

        try {
          const parsed = JSON.parse(rawValue) as AuditEventPayload;

          eventType =
            typeof parsed.eventType === 'string'
              ? parsed.eventType
              : 'unknown';

          payload = {
            ...parsed,

            metadata: {
              ...(typeof parsed.metadata === 'object' &&
              parsed.metadata !== null
                ? parsed.metadata
                : {}),

              kafkaTopic: topic,
              kafkaPartition: partition,
              kafkaOffset: message.offset,
              kafkaKey: message.key?.toString('utf8'),
            },
          };

          this.logger.log(
            JSON.stringify({
              type: 'kafka_audit_event_received',
              service: 'audit-service',
              eventType,
              topic,
              partition,
              offset: message.offset,
              userId: payload.userId,
              result: 'received',
            }),
          );

          this.metricsService.auditEventsConsumedTotal.inc({
            service: 'audit-service',
            event: eventType,
            queue: topic,
          });

          await this.auditService.saveAuditLog(payload);

          this.logger.log(
            JSON.stringify({
              type: 'kafka_audit_event_consumed',
              service: 'audit-service',
              eventType,
              topic,
              partition,
              offset: message.offset,
              userId: payload.userId,
              result: 'success',
            }),
          );
        } catch (error) {
          this.metricsService.auditEventsProcessingFailedTotal.inc({
            service: 'audit-service',
            event: eventType,
            stage: 'kafka_consume',
          });

          this.logger.error(
            JSON.stringify({
              type: 'kafka_audit_event_failed',
              service: 'audit-service',
              eventType,
              topic,
              partition,
              offset: message.offset,
              error: error instanceof Error ? error.message : String(error),
              rawValue,
            }),
            error instanceof Error ? error.stack : undefined,
          );
        }
      },
    });

    this.logger.log(`Kafka audit consumer started. topic=${topic}`);
  }

  async onApplicationShutdown() {
    await this.consumer.disconnect();

    this.logger.log('Kafka audit consumer disconnected');
  }
}