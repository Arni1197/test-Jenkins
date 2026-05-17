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

  readonly userProfileRequestsTotal: Counter<string>;
  readonly httpRequestDurationSeconds: Histogram<string>;

  // Kafka publish metrics
  readonly userEventsPublishedTotal: Counter<string>;
  readonly userEventsPublishFailedTotal: Counter<string>;

  constructor() {
    this.registry = new Registry();

    collectDefaultMetrics({
      register: this.registry,
    });

    this.userProfileRequestsTotal = new Counter({
      name: 'user_profile_requests_total',
      help: 'Total number of user profile requests',
      labelNames: ['method', 'route'],
      registers: [this.registry],
    });

    this.httpRequestDurationSeconds = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    // Successful Kafka publishes
    this.userEventsPublishedTotal = new Counter({
      name: 'user_events_published_total',
      help: 'Total successfully published user Kafka events',
      labelNames: ['event', 'topic'],
      registers: [this.registry],
    });

    // Failed Kafka publishes
    this.userEventsPublishFailedTotal = new Counter({
      name: 'user_events_publish_failed_total',
      help: 'Total failed published user Kafka events',
      labelNames: ['event', 'topic'],
      registers: [this.registry],
    });
  }

  getRegistry(): Registry {
    return this.registry;
  }

  startHttpRequestTimer(labels: { method: string; route: string }) {
    return this.httpRequestDurationSeconds.startTimer(labels);
  }
}