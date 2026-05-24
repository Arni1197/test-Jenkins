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

  readonly userEventsPublishedTotal: Counter<string>;
  readonly userEventsPublishFailedTotal: Counter<string>;

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

  startHttpRequestTimer(labels: { method: string; route: string; status?: string }) {
    return this.httpRequestDurationSeconds.startTimer(labels);
  }
}