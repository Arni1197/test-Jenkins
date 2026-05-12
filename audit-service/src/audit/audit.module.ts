import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditConsumer } from './audit.consumer';
import { KafkaAuditConsumer } from '../kafka/kafka-audit.consumer';

@Module({
  providers: [AuditService, AuditConsumer, KafkaAuditConsumer],
  exports: [AuditService],
})
export class AuditModule {}