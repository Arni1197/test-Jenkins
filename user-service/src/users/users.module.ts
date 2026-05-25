// user-service/src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserEventsConsumer } from './user-events.consumer';
import { AuditModule } from '../audit/audit.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [AuditModule, MetricsModule],
  controllers: [UsersController],
  providers: [UsersService, UserEventsConsumer],
  exports: [UsersService],
})
export class UsersModule {}