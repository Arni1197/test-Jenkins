import { Injectable } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
} from 'prom-client';

type AuditMetricLabels = {
  source: string;
  source_service: string;
  event: string;
  transport: string;
  queue: string;
  topic: string;
};

@Injectable()
export class MetricsService {
  private readonly registry: Registry;

  readonly httpRequestsTotal: Counter<string>;
  readonly httpRequestDurationSeconds: Histogram<string>;

  readonly auditEventsReceivedTotal: Counter<string>;
  readonly auditEventsProcessingStartedTotal: Counter<string>;
  readonly auditEventsProcessingFinishedTotal: Counter<string>;
  readonly auditEventsAckTotal: Counter<string>;

  readonly auditEventsConsumedTotal: Counter<string>;
  readonly auditEventsPersistSuccessTotal: Counter<string>;
  readonly auditEventsPersistFailedTotal: Counter<string>;
  readonly auditEventsProcessingFailedTotal: Counter<string>;
  readonly auditEventsSentToRetryTotal: Counter<string>;
  readonly auditEventsSentToDlqTotal: Counter<string>;
  readonly auditEventsDuplicateTotal: Counter<string>;

  readonly auditEventsProcessingDurationSeconds: Histogram<string>;

  constructor() {
    this.registry = new Registry();

    collectDefaultMetrics({
      register: this.registry,
      prefix: 'audit_service_',
    });

    this.httpRequestsTotal = new Counter({
      name: 'audit_service_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDurationSeconds = new Histogram({
      name: 'audit_service_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.auditEventsReceivedTotal = new Counter({
      name: 'audit_events_received_total',
      help: 'Total audit events received from broker',
      labelNames: ['source', 'source_service', 'event', 'transport', 'queue', 'topic'],
      registers: [this.registry],
    });

    this.auditEventsProcessingStartedTotal = new Counter({
      name: 'audit_events_processing_started_total',
      help: 'Total audit events processing started',
      labelNames: ['source', 'source_service', 'event', 'transport', 'queue', 'topic'],
      registers: [this.registry],
    });

    this.auditEventsProcessingFinishedTotal = new Counter({
      name: 'audit_events_processing_finished_total',
      help: 'Total audit events processing finished',
      labelNames: ['source', 'source_service', 'event', 'transport', 'queue', 'topic', 'result'],
      registers: [this.registry],
    });

    this.auditEventsAckTotal = new Counter({
      name: 'audit_events_ack_total',
      help: 'Total audit events acknowledged to broker',
      labelNames: ['source', 'source_service', 'event', 'transport', 'queue', 'topic'],
      registers: [this.registry],
    });

    this.auditEventsConsumedTotal = new Counter({
      name: 'audit_events_consumed_total',
      help: 'Total consumed audit events',
      labelNames: ['source', 'source_service', 'event', 'transport', 'queue', 'topic'],
      registers: [this.registry],
    });

    this.auditEventsPersistSuccessTotal = new Counter({
      name: 'audit_events_persist_success_total',
      help: 'Total successfully persisted audit events',
      labelNames: ['source', 'source_service', 'event', 'transport', 'queue', 'topic'],
      registers: [this.registry],
    });

    this.auditEventsPersistFailedTotal = new Counter({
      name: 'audit_events_persist_failed_total',
      help: 'Total failed audit event persistence operations',
      labelNames: ['source', 'source_service', 'event', 'transport', 'queue', 'topic'],
      registers: [this.registry],
    });

    this.auditEventsProcessingFailedTotal = new Counter({
      name: 'audit_events_processing_failed_total',
      help: 'Total failed audit event processing operations',
      labelNames: ['source', 'source_service', 'event', 'transport', 'queue', 'topic', 'stage'],
      registers: [this.registry],
    });

    this.auditEventsSentToRetryTotal = new Counter({
      name: 'audit_events_sent_to_retry_total',
      help: 'Total audit events sent to retry topic or queue',
      labelNames: ['source', 'source_service', 'event', 'transport', 'queue', 'topic'],
      registers: [this.registry],
    });

    this.auditEventsSentToDlqTotal = new Counter({
      name: 'audit_events_sent_to_dlq_total',
      help: 'Total audit events sent to dead letter topic or queue',
      labelNames: ['source', 'source_service', 'event', 'transport', 'queue', 'topic'],
      registers: [this.registry],
    });

    this.auditEventsDuplicateTotal = new Counter({
      name: 'audit_events_duplicate_total',
      help: 'Total duplicate audit events ignored by eventId idempotency',
      labelNames: ['source', 'source_service', 'event', 'transport', 'queue', 'topic'],
      registers: [this.registry],
    });

    this.auditEventsProcessingDurationSeconds = new Histogram({
      name: 'audit_events_processing_duration_seconds',
      help: 'Audit event processing duration in seconds',
      labelNames: ['source', 'source_service', 'event', 'transport', 'queue', 'topic', 'result'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
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
}