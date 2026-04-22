import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class CatalogEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CatalogEventsPublisher.name);

  private connection?: amqp.ChannelModel;
  private channel?: amqp.ConfirmChannel;

  constructor(
    private readonly config: ConfigService,
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

  async onModuleInit() {
    this.connection = await amqp.connect(this.rabbitUrl);
    this.channel = await this.connection.createConfirmChannel();

    await this.channel.assertExchange(this.exchangeName, 'topic', {
      durable: true,
    });

    this.logger.log(
      `RabbitMQ publisher connected. exchange=${this.exchangeName}`,
    );
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }

  async publish(
    routingKey: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const eventType =
      typeof payload.eventType === 'string' ? payload.eventType : routingKey;

    if (!this.channel) {
      this.metricsService.catalogEventPublishFailedTotal.inc({
        service: 'catalog-service',
        event: eventType,
        routing_key: routingKey,
      });

      this.logger.warn(
        `Publish skipped. Channel is not ready. routingKey=${routingKey}`,
      );
      throw new Error(`RabbitMQ channel is not ready. routingKey=${routingKey}`);
    }

    const message = Buffer.from(
      JSON.stringify({
        ...payload,
        emittedAt: new Date().toISOString(),
      }),
    );

    try {
      await new Promise<void>((resolve, reject) => {
        this.channel!.publish(
          this.exchangeName,
          routingKey,
          message,
          {
            contentType: 'application/json',
            persistent: true,
          },
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          },
        );
      });

      this.metricsService.catalogEventPublishSuccessTotal.inc({
        service: 'catalog-service',
        event: eventType,
        routing_key: routingKey,
      });
    } catch (error) {
      this.metricsService.catalogEventPublishFailedTotal.inc({
        service: 'catalog-service',
        event: eventType,
        routing_key: routingKey,
      });

      this.logger.error(
        `Failed to publish event ${eventType}. routingKey=${routingKey}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw error;
    }
  }
}