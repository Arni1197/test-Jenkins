import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { MetricsService } from '../metrics/metrics.service';

type KafkaHeaders = Record<string, string>;

@Injectable()
export class KafkaProducer implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(KafkaProducer.name);
  private readonly maxPublishRetries: number;
  private readonly retryDelayMs: number;
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

    this.maxPublishRetries = Number(
      this.configService.get<string>('KAFKA_PUBLISH_RETRIES', '5'),
    );

    this.retryDelayMs = Number(
      this.configService.get<string>('KAFKA_PUBLISH_RETRY_DELAY_MS', '500'),
    );

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
      retry: {
        retries: 8,
        initialRetryTime: 300,
        maxRetryTime: 30000,
      },
    });

    this.producer = kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async emit(
    topic: string,
    message: unknown,
    key?: string,
    headers: KafkaHeaders = {},
  ) {
    const event = this.resolveEventName(message);

    const labels = {
      source: 'user-service',
      service: 'user-service',
      event,
      topic,
    };

    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxPublishRetries + 1; attempt++) {
      const isRetry = attempt > 1;

      this.metricsService.userEventsPublishAttemptTotal.inc(labels);

      if (isRetry) {
        this.metricsService.userEventsPublishRetryTotal.inc(labels);
      }

      try {
        await this.producer.send({
          topic,
          messages: [
            {
              key,
              value: JSON.stringify(message),
              headers: {
                ...headers,
                retryAttempt: String(attempt - 1),
                sourceService: 'user-service',
                eventType: event,
              },
            },
          ],
        });

        this.metricsService.userEventsPublishedTotal.inc(labels);

        if (isRetry) {
          this.metricsService.userEventsPublishRetrySuccessTotal.inc(labels);
        }

        if (isRetry) {
          this.logger.warn(
            JSON.stringify({
              type: 'kafka_publish_retry_success',
              service: 'user-service',
              topic,
              event,
              key,
              attempt,
              retryAttempt: attempt - 1,
            }),
          );
        }

        return;
      } catch (error) {
        lastError = error;
        this.metricsService.userEventsPublishFailedTotal.inc(labels);

        this.logger.warn(
          JSON.stringify({
            type: 'kafka_publish_attempt_failed',
            service: 'user-service',
            topic,
            event,
            key,
            attempt,
            retryAttempt: attempt - 1,
            maxRetries: this.maxPublishRetries,
            error: error instanceof Error ? error.message : String(error),
          }),
        );

        if (attempt <= this.maxPublishRetries) {
          await this.sleep(this.retryDelayMs * attempt);
          continue;
        }
      }
    }

    this.metricsService.userEventsPublishFinalFailedTotal.inc(labels);

    this.logger.error(
      JSON.stringify({
        type: 'kafka_publish_final_failed',
        service: 'user-service',
        topic,
        event,
        key,
        maxRetries: this.maxPublishRetries,
        error: lastError instanceof Error ? lastError.message : String(lastError),
      }),
      lastError instanceof Error ? lastError.stack : undefined,
    );

    throw lastError;
  }

  async onApplicationShutdown() {
    await this.producer.disconnect();
    this.logger.log('Kafka producer disconnected');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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