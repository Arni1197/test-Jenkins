// audit-service/src/kafka/kafka.module.ts
import { Module } from '@nestjs/common';
import { KafkaAuditConsumer } from './kafka-audit.consumer';

@Module({
  providers: [KafkaAuditConsumer],
})
export class KafkaModule {}