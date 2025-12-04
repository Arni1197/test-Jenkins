import { Injectable } from '@nestjs/common';
import { Counter, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  readonly userProfileRequestsTotal: Counter;

  constructor() {
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry });

    this.userProfileRequestsTotal = new Counter({
      name: 'user_profile_requests_total',
      help: 'Total number of user profile requests',
      labelNames: ['method', 'route'],
      registers: [this.registry],
    });
  }

  getRegistry() {
    return this.registry;
  }
}