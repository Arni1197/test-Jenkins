import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { EmailConfirmationService } from './email-confirmation.service';
import { UsersService } from '../users/users.service';

type UserRegisteredEvent = {
  userId: string;
  email: string;
  username?: string;
  sendConfirmationEmail?: boolean;
  createdAt?: string;
};

@Injectable()
export class EmailEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailEventsConsumer.name);

  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private consumerTag?: string;

  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly emailConfirmationService: EmailConfirmationService,
  ) {}

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
    await this.channel.prefetch(10);

    const consumeResult = await this.channel.consume(
      this.queueName,
      async (msg) => {
        if (!msg) return;

        try {
          const payload = JSON.parse(
            msg.content.toString(),
          ) as UserRegisteredEvent;

          if (!payload.sendConfirmationEmail) {
            this.channel?.ack(msg);
            return;
          }

          const user = await this.usersService.findById(payload.userId);
          if (!user) {
            this.logger.warn(
              `User not found for confirmation email: ${payload.userId}`,
            );
            this.channel?.ack(msg);
            return;
          }

          await this.emailConfirmationService.sendEmailConfirmation(user);

          this.logger.log(
            `Confirmation email sent for userId=${payload.userId}, email=${payload.email}`,
          );

          this.channel?.ack(msg);
        } catch (error: any) {
          this.logger.error(
            `Failed to process user.registered event: ${error?.message ?? error}`,
            error?.stack,
          );

          // MVP: не уходим в бесконечный requeue loop
          this.channel?.nack(msg, false, false);
        }
      },
      { noAck: false },
    );

    this.consumerTag = consumeResult.consumerTag;
    this.logger.log(`RabbitMQ consumer started. queue=${this.queueName}`);
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