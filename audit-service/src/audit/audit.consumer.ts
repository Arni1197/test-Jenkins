import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { AuditService, AuditEventPayload } from './audit.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class AuditConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditConsumer.name);

  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private consumerTag?: string;

  constructor(
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
    private readonly metricsService: MetricsService,
  ) {}

  private get rabbitUrl(): string {
    return (
      this.config.get<string>('RABBITMQ_URL') ??
      'amqp://guest:guest@localhost:5672'
    );
  }

  private get exchangeName(): string {
    return this.config.get<string>('RABBITMQ_AUDIT_EXCHANGE') ?? 'audit.events';
  }

  private get mainQueue(): string {
    return this.config.get<string>('RABBITMQ_AUDIT_QUEUE') ?? 'audit.log.queue';
  }

  private get retryQueue(): string {
    return (
      this.config.get<string>('RABBITMQ_AUDIT_RETRY_QUEUE') ??
      'audit.log.retry.queue'
    );
  }

  private get dlqQueue(): string {
    return this.config.get<string>('RABBITMQ_AUDIT_DLQ') ?? 'audit.log.dlq';
  }

  private get retryTtlMs(): number {
    return Number(
      this.config.get<string>('RABBITMQ_AUDIT_RETRY_TTL_MS') ?? '5000',
    );
  }

  private get maxRetries(): number {
    return Number(
      this.config.get<string>('RABBITMQ_AUDIT_MAX_RETRIES') ?? '3',
    );
  }

  private getStringHeader(
    headers: amqp.MessagePropertyHeaders,
    key: string,
  ): string | undefined {
    const value = headers[key];

    if (typeof value === 'string') return value;
    if (Buffer.isBuffer(value)) return value.toString('utf8');

    return undefined;
  }

  async onModuleInit() {
    this.connection = await amqp.connect(this.rabbitUrl);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(this.exchangeName, 'topic', {
      durable: true,
    });

    await this.channel.assertQueue(this.dlqQueue, {
      durable: true,
    });

    await this.channel.assertQueue(this.mainQueue, {
      durable: true,
    });

    await this.channel.assertQueue(this.retryQueue, {
      durable: true,
      deadLetterExchange: this.exchangeName,
      deadLetterRoutingKey: 'audit.log',
      messageTtl: this.retryTtlMs,
    });

    await this.channel.bindQueue(this.mainQueue, this.exchangeName, 'catalog.#');
    await this.channel.bindQueue(this.mainQueue, this.exchangeName, 'auth.#');
    await this.channel.bindQueue(this.mainQueue, this.exchangeName, 'audit.#');

    await this.channel.prefetch(10);

    const consumeResult = await this.channel.consume(
      this.mainQueue,
      async (msg) => {
        if (!msg || !this.channel) return;

        let payload: AuditEventPayload | undefined;
        let eventType = 'unknown';

        const processingEnd =
          this.metricsService.auditEventsProcessingDurationSeconds.startTimer({
            service: 'audit-service',
            event: eventType,
            result: 'unknown',
          });

        try {
          const headers = msg.properties.headers ?? {};

          const requestId = this.getStringHeader(headers, 'x-request-id');
          const kongRequestId = this.getStringHeader(
            headers,
            'x-kong-request-id',
          );
          const headerUserId = this.getStringHeader(headers, 'x-user-id');

          const parsedPayload = JSON.parse(
            msg.content.toString(),
          ) as AuditEventPayload;

          const existingMetadata =
            typeof parsedPayload.metadata === 'object' &&
            parsedPayload.metadata !== null
              ? parsedPayload.metadata
              : {};

          payload = {
            ...parsedPayload,
            userId: parsedPayload.userId ?? headerUserId,
            metadata: {
              ...existingMetadata,
              requestId:
                typeof existingMetadata.requestId === 'string'
                  ? existingMetadata.requestId
                  : requestId,
              kongRequestId:
                typeof existingMetadata.kongRequestId === 'string'
                  ? existingMetadata.kongRequestId
                  : kongRequestId,
            },
          };

          eventType =
            typeof payload.eventType === 'string'
              ? payload.eventType
              : 'unknown';

          this.logger.log(
            JSON.stringify({
              type: 'audit_event_received',
              service: 'audit-service',
              eventType,
              requestId: payload.metadata?.requestId,
              kongRequestId: payload.metadata?.kongRequestId,
              userId: payload.userId,
              routingKey: msg.fields.routingKey,
              result: 'received',
            }),
          );

          this.metricsService.auditEventsConsumedTotal.inc({
            service: 'audit-service',
            event: eventType,
            queue: this.mainQueue,
          });

          await this.auditService.saveAuditLog(payload);

          this.channel.ack(msg);

          this.logger.log(
            JSON.stringify({
              type: 'audit_event_consumed',
              service: 'audit-service',
              eventType,
              requestId: payload.metadata?.requestId,
              kongRequestId: payload.metadata?.kongRequestId,
              userId: payload.userId,
              routingKey: msg.fields.routingKey,
              result: 'success',
            }),
          );

          processingEnd({
            service: 'audit-service',
            event: eventType,
            result: 'success',
          });
        } catch (error: any) {
          const headers = msg.properties.headers ?? {};
          const retryCount = Number(headers['x-retry-count'] ?? 0);

          const requestId = this.getStringHeader(headers, 'x-request-id');
          const kongRequestId = this.getStringHeader(
            headers,
            'x-kong-request-id',
          );

          if (payload && typeof payload.eventType === 'string') {
            eventType = payload.eventType;
          }

          this.logger.error(
            JSON.stringify({
              type: 'audit_event_failed',
              service: 'audit-service',
              eventType,
              requestId,
              kongRequestId,
              retryCount,
              routingKey: msg.fields.routingKey,
              error: error?.message ?? String(error),
            }),
            error?.stack,
          );

          this.metricsService.auditEventsProcessingFailedTotal.inc({
            service: 'audit-service',
            event: eventType,
            stage: retryCount >= this.maxRetries ? 'final_failure' : 'consume',
          });

          if (retryCount >= this.maxRetries) {
            this.channel.publish('', this.dlqQueue, msg.content, {
              contentType: msg.properties.contentType ?? 'application/json',
              persistent: true,
              headers: {
                ...headers,
                'x-retry-count': retryCount,
                'x-final-failure-at': new Date().toISOString(),
              },
            });

            this.metricsService.auditEventsSentToDlqTotal.inc({
              service: 'audit-service',
              event: eventType,
              queue: this.dlqQueue,
            });

            this.channel.ack(msg);

            processingEnd({
              service: 'audit-service',
              event: eventType,
              result: 'dlq',
            });

            return;
          }

          this.channel.publish('', this.retryQueue, msg.content, {
            contentType: msg.properties.contentType ?? 'application/json',
            persistent: true,
            headers: {
              ...headers,
              'x-retry-count': retryCount + 1,
            },
          });

          this.metricsService.auditEventsSentToRetryTotal.inc({
            service: 'audit-service',
            event: eventType,
            queue: this.retryQueue,
          });

          this.channel.ack(msg);

          processingEnd({
            service: 'audit-service',
            event: eventType,
            result: 'retry',
          });
        }
      },
      { noAck: false },
    );

    this.consumerTag = consumeResult.consumerTag;

    this.logger.log(
      `Audit consumer started. exchange=${this.exchangeName}, queue=${this.mainQueue}, retry=${this.retryQueue}, dlq=${this.dlqQueue}`,
    );
  }

  async onModuleDestroy() {
    try {
      if (this.channel && this.consumerTag) {
        await this.channel.cancel(this.consumerTag);
      }
    } catch {
      // ignore
    }

    try {
      await this.channel?.close();
    } catch {
      // ignore
    }

    try {
      await this.connection?.close();
    } catch {
      // ignore
    }
  }
}