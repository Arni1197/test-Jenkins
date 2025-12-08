import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserEventsConsumer } from './user-events.consumer';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserEventsConsumer],
  exports: [UsersService],
})
export class UsersModule {}