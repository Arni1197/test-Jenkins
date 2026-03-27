import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { AuditService, AuditEventPayload } from './audit.service';

@Injectable()
export class AuditConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditConsumer.name);

  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private consumerTag?: string;

  constructor(
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  private get rabbitUrl(): string {
    return this.config.get<string>('RABBITMQ_URL') ?? 'amqp://guest:guest@localhost:5672';
  }

  private get exchangeName(): string {
    return this.config.get<string>('RABBITMQ_AUDIT_EXCHANGE') ?? 'audit.events';
  }

  private get mainQueue(): string {
    return this.config.get<string>('RABBITMQ_AUDIT_QUEUE') ?? 'audit.log.queue';
  }

  private get retryQueue(): string {
    return this.config.get<string>('RABBITMQ_AUDIT_RETRY_QUEUE') ?? 'audit.log.retry.queue';
  }

  private get dlqQueue(): string {
    return this.config.get<string>('RABBITMQ_AUDIT_DLQ') ?? 'audit.log.dlq';
  }

  private get retryTtlMs(): number {
    return Number(this.config.get<string>('RABBITMQ_AUDIT_RETRY_TTL_MS') ?? '5000');
  }

  private get maxRetries(): number {
    return Number(this.config.get<string>('RABBITMQ_AUDIT_MAX_RETRIES') ?? '3');
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

        try {
          const payload = JSON.parse(msg.content.toString()) as AuditEventPayload;

          await this.auditService.saveAuditLog(payload);

          this.channel.ack(msg);
        } catch (error: any) {
          const headers = msg.properties.headers ?? {};
          const retryCount = Number(headers['x-retry-count'] ?? 0);

          this.logger.error(
            `Failed to process audit event. retry=${retryCount}. error=${error?.message ?? error}`,
            error?.stack,
          );

          if (retryCount >= this.maxRetries) {
            this.channel.publish(
              '',
              this.dlqQueue,
              msg.content,
              {
                contentType: msg.properties.contentType ?? 'application/json',
                persistent: true,
                headers: {
                  ...headers,
                  'x-retry-count': retryCount,
                  'x-final-failure-at': new Date().toISOString(),
                },
              },
            );

            this.channel.ack(msg);
            return;
          }

          this.channel.publish(
            '',
            this.retryQueue,
            msg.content,
            {
              contentType: msg.properties.contentType ?? 'application/json',
              persistent: true,
              headers: {
                ...headers,
                'x-retry-count': retryCount + 1,
              },
            },
          );

          this.channel.ack(msg);
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

    await this.channel?.close();
    await this.connection?.close();
  }
}