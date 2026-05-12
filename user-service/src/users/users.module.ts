// user-service/src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserEventsConsumer } from './user-events.consumer';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [UsersController],
  providers: [UsersService, UserEventsConsumer],
  exports: [UsersService],
})
export class UsersModule {}