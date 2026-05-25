// user-service/src/audit/audit.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { KafkaModule } from '../kafka/kafka.module';
import { MetricsModule } from '../metrics/metrics.module';

import { AuditEventsService } from './audit-events.service';

@Module({
  imports: [
    ConfigModule,
    KafkaModule,
    MetricsModule,
  ],
  providers: [AuditEventsService],
  exports: [AuditEventsService],
})
export class AuditModule {}