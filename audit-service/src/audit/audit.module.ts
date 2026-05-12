// audit-service/src/audit/audit.module.ts
import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditConsumer } from './audit.consumer';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  providers: [AuditService, AuditConsumer],
  exports: [AuditService],
})
export class AuditModule {}