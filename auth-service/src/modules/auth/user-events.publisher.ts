import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

export type UserRegisteredPayload = {
  userId: string;
  email: string;
  username?: string | null;
  sendConfirmationEmail?: boolean;
};

export type UserEmailVerifiedPayload = {
  userId: string;
  email: string;
};

@Injectable()
export class UserEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;

  constructor(private readonly config: ConfigService) {}

  private get queueName(): string {
    return (
      this.config.get<string>('RABBITMQ_USER_REGISTERED_QUEUE') ??
      'user.registered'
    );
  }

  private get rabbitUrl(): string {
    return (
      this.config.get<string>('RABBITMQ_URL') ??
      'amqp://guest:guest@localhost:5672'
    );
  }

  async onModuleInit() {
    this.connection = await amqp.connect(this.rabbitUrl);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queueName, { durable: true });
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }

  async publishUserRegistered(payload: UserRegisteredPayload) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized');
    }

    await this.channel.assertQueue(this.queueName, { durable: true });

    this.channel.sendToQueue(
      this.queueName,
      Buffer.from(
        JSON.stringify({
          ...payload,
          username: payload.username ?? undefined,
          createdAt: new Date().toISOString(),
        }),
      ),
      {
        persistent: true,
        contentType: 'application/json',
      },
    );
  }

  async publishUserEmailVerified(_payload: UserEmailVerifiedPayload) {
    return;
  }
}