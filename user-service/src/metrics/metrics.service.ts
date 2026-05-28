import { Injectable } from '@nestjs/common';
import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;

  readonly httpRequestsTotal: Counter<string>;
  readonly httpRequestDurationSeconds: Histogram<string>;

  readonly userDbWriteSuccessTotal: Counter<string>;
  readonly userDbWriteFailedTotal: Counter<string>;

  readonly userEventsPublishedTotal: Counter<string>;
  readonly userEventsPublishFailedTotal: Counter<string>;

  readonly userEventsPublishAttemptTotal: Counter<string>;
  readonly userEventsPublishRetryTotal: Counter<string>;
  readonly userEventsPublishRetrySuccessTotal: Counter<string>;
  readonly userEventsPublishFinalFailedTotal: Counter<string>;

  constructor() {
    this.registry = new Registry();

    collectDefaultMetrics({
      register: this.registry,
      prefix: 'user_service_',
    });

    this.httpRequestsTotal = new Counter({
      name: 'user_service_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDurationSeconds = new Histogram({
      name: 'user_service_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.userDbWriteSuccessTotal = new Counter({
      name: 'user_db_write_success_total',
      help: 'Total successful user-service DB write operations',
      labelNames: ['source', 'service', 'operation'],
      registers: [this.registry],
    });

    this.userDbWriteFailedTotal = new Counter({
      name: 'user_db_write_failed_total',
      help: 'Total failed user-service DB write operations',
      labelNames: ['source', 'service', 'operation'],
      registers: [this.registry],
    });

    this.userEventsPublishedTotal = new Counter({
      name: 'user_events_published_total',
      help: 'Total successfully published user events to Kafka',
      labelNames: ['source', 'service', 'event', 'topic'],
      registers: [this.registry],
    });

    this.userEventsPublishFailedTotal = new Counter({
      name: 'user_events_publish_failed_total',
      help: 'Total failed user event publish attempts to Kafka',
      labelNames: ['source', 'service', 'event', 'topic'],
      registers: [this.registry],
    });

    this.userEventsPublishAttemptTotal = new Counter({
      name: 'user_events_publish_attempt_total',
      help: 'Total user event publish attempts to Kafka including first attempt and retries',
      labelNames: ['source', 'service', 'event', 'topic'],
      registers: [this.registry],
    });

    this.userEventsPublishRetryTotal = new Counter({
      name: 'user_events_publish_retry_total',
      help: 'Total user event publish retry attempts to Kafka',
      labelNames: ['source', 'service', 'event', 'topic'],
      registers: [this.registry],
    });

    this.userEventsPublishRetrySuccessTotal = new Counter({
      name: 'user_events_publish_retry_success_total',
      help: 'Total user events successfully published to Kafka after retry',
      labelNames: ['source', 'service', 'event', 'topic'],
      registers: [this.registry],
    });

    this.userEventsPublishFinalFailedTotal = new Counter({
      name: 'user_events_publish_final_failed_total',
      help: 'Total user events that failed to publish to Kafka after all retries',
      labelNames: ['source', 'service', 'event', 'topic'],
      registers: [this.registry],
    });
  }

  getRegistry(): Registry {
    return this.registry;
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  startHttpRequestTimer(labels: {
    method: string;
    route: string;
    status?: string;
  }) {
    return this.httpRequestDurationSeconds.startTimer(labels);
  }
}