import { Injectable } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
} from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;

  readonly httpRequestsTotal: Counter<string>;
  readonly httpRequestDurationSeconds: Histogram<string>;

  readonly catalogFavoritesAddSuccessTotal: Counter<string>;
  readonly catalogFavoritesRemoveSuccessTotal: Counter<string>;
  readonly catalogCartAddSuccessTotal: Counter<string>;
  readonly catalogCartUpdateSuccessTotal: Counter<string>;

  readonly catalogDbWriteSuccessTotal: Counter<string>;
  readonly catalogDbWriteFailedTotal: Counter<string>;

  readonly catalogEventPublishSuccessTotal: Counter<string>;
  readonly catalogEventPublishFailedTotal: Counter<string>;

  constructor() {
    this.registry = new Registry();

    collectDefaultMetrics({
      register: this.registry,
      prefix: 'catalog_service_',
    });

    this.httpRequestsTotal = new Counter({
      name: 'catalog_service_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDurationSeconds = new Histogram({
      name: 'catalog_service_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.catalogFavoritesAddSuccessTotal = new Counter({
      name: 'catalog_favorites_add_success_total',
      help: 'Total successful add-to-favorites operations',
      labelNames: ['service'],
      registers: [this.registry],
    });

    this.catalogFavoritesRemoveSuccessTotal = new Counter({
      name: 'catalog_favorites_remove_success_total',
      help: 'Total successful remove-from-favorites operations',
      labelNames: ['service'],
      registers: [this.registry],
    });

    this.catalogCartAddSuccessTotal = new Counter({
      name: 'catalog_cart_add_success_total',
      help: 'Total successful add-to-cart operations',
      labelNames: ['service'],
      registers: [this.registry],
    });

    this.catalogCartUpdateSuccessTotal = new Counter({
      name: 'catalog_cart_update_success_total',
      help: 'Total successful cart update operations',
      labelNames: ['service'],
      registers: [this.registry],
    });

    this.catalogDbWriteSuccessTotal = new Counter({
      name: 'catalog_db_write_success_total',
      help: 'Total successful catalog DB write operations',
      labelNames: ['service', 'operation'],
      registers: [this.registry],
    });

    this.catalogDbWriteFailedTotal = new Counter({
      name: 'catalog_db_write_failed_total',
      help: 'Total failed catalog DB write operations',
      labelNames: ['service', 'operation'],
      registers: [this.registry],
    });

    this.catalogEventPublishSuccessTotal = new Counter({
      name: 'catalog_event_publish_success_total',
      help: 'Total successful catalog event publish operations',
      labelNames: ['service', 'event', 'routing_key'],
      registers: [this.registry],
    });

    this.catalogEventPublishFailedTotal = new Counter({
      name: 'catalog_event_publish_failed_total',
      help: 'Total failed catalog event publish operations',
      labelNames: ['service', 'event', 'routing_key'],
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