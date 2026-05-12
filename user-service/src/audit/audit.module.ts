// user-service/src/audit/audit.module.ts
import { Module } from '@nestjs/common';
import { KafkaModule } from '../kafka/kafka.module';
import { AuditEventsService } from './audit-events.service';

@Module({
  imports: [KafkaModule],
  providers: [AuditEventsService],
  exports: [AuditEventsService],
})
export class AuditModule {}