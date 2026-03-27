import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class CatalogEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CatalogEventsPublisher.name);

  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;

  constructor(private readonly config: ConfigService) {}

  private get rabbitUrl(): string {
    return this.config.get<string>('RABBITMQ_URL') ?? 'amqp://guest:guest@localhost:5672';
  }

  private get exchangeName(): string {
    return this.config.get<string>('RABBITMQ_AUDIT_EXCHANGE') ?? 'audit.events';
  }

  async onModuleInit() {
    this.connection = await amqp.connect(this.rabbitUrl);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(this.exchangeName, 'topic', {
      durable: true,
    });

    this.logger.log(`RabbitMQ publisher connected. exchange=${this.exchangeName}`);
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }

  publish(routingKey: string, payload: Record<string, unknown>): void {
    if (!this.channel) {
      this.logger.warn(`Publish skipped. Channel is not ready. routingKey=${routingKey}`);
      return;
    }

    const message = Buffer.from(
      JSON.stringify({
        ...payload,
        emittedAt: new Date().toISOString(),
      }),
    );

    const ok = this.channel.publish(this.exchangeName, routingKey, message, {
      contentType: 'application/json',
      persistent: true,
    });

    if (!ok) {
      this.logger.warn(`RabbitMQ publish returned false. routingKey=${routingKey}`);
    }
  }
}