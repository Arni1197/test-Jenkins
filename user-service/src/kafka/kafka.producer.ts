import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class KafkaProducer implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(KafkaProducer.name);
  private producer: Producer;

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    const brokers = this.configService
      .get<string>('KAFKA_BROKERS', '192.168.0.16:9092')
      .split(',')
      .map((broker) => broker.trim());

    const username = this.configService.get<string>('KAFKA_USERNAME');
    const password = this.configService.get<string>('KAFKA_PASSWORD');

    const kafka = new Kafka({
      clientId: this.configService.get<string>(
        'KAFKA_CLIENT_ID',
        'user-service',
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
    });

    this.producer = kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async emit(topic: string, message: unknown, key?: string) {
    const event = this.resolveEventName(message);

    const labels = {
      source: 'user-service',
      service: 'user-service',
      event,
      topic,
    };

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key,
            value: JSON.stringify(message),
          },
        ],
      });

      this.metricsService.userEventsPublishedTotal.inc(labels);
    } catch (error) {
      this.metricsService.userEventsPublishFailedTotal.inc(labels);

      this.logger.error(
        `Failed to publish Kafka event. topic=${topic}, event=${event}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw error;
    }
  }

  async onApplicationShutdown() {
    await this.producer.disconnect();
    this.logger.log('Kafka producer disconnected');
  }

  private resolveEventName(message: unknown): string {
    if (
      message &&
      typeof message === 'object' &&
      'eventType' in message &&
      typeof (message as { eventType?: unknown }).eventType === 'string'
    ) {
      return (message as { eventType: string }).eventType;
    }

    if (
      message &&
      typeof message === 'object' &&
      'event' in message &&
      typeof (message as { event?: unknown }).event === 'string'
    ) {
      return (message as { event: string }).event;
    }

    if (
      message &&
      typeof message === 'object' &&
      'type' in message &&
      typeof (message as { type?: unknown }).type === 'string'
    ) {
      return (message as { type: string }).type;
    }

    return 'unknown';
  }
}