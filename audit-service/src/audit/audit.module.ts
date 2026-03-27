import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditConsumer } from './audit.consumer';

@Module({
  providers: [AuditService, AuditConsumer],
})
export class AuditModule {}