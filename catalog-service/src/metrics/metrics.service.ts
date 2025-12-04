import { Injectable } from '@nestjs/common';
import { Counter, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;

  // Метрика для запросов к каталогу
  readonly catalogItemsRequestsTotal: Counter;

  constructor() {
    this.registry = new Registry();

    // Собираем стандартные NodeJS-метрики
    collectDefaultMetrics({ register: this.registry });

    this.catalogItemsRequestsTotal = new Counter({
      name: 'catalog_items_requests_total',
      help: 'Total number of catalog items requests',
      labelNames: ['method', 'route'],
      registers: [this.registry],
    });
  }

  getRegistry() {
    return this.registry;
  }
}