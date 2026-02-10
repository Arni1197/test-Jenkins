import { Module } from '@nestjs/common';
import { Registry, collectDefaultMetrics } from 'prom-client';
import { PromController } from './prom.controller';

const registry = new Registry();

// базовые метрики процесса/nodejs (CPU, memory, event loop и т.д.)
collectDefaultMetrics({
  register: registry,
  // можно раскомментировать, если хочешь чаще/реже:
  // gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

@Module({
  controllers: [PromController],
  providers: [
    {
      provide: Registry,
      useValue: registry,
    },
  ],
  exports: [Registry],
})
export class MetricsModule {}