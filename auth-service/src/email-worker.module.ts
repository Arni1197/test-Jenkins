import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { envValidationSchema } from './config/env.validation';
import { RedisModule } from './modules/redis/redis.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { MailService } from './modules/auth/mail.service';
import { EmailConfirmationService } from './modules/auth/email-confirmation.service';
import { EmailEventsConsumer } from './modules/auth/email-events.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
    }),
    RedisModule,
    PrismaModule,
    UsersModule,
  ],
  providers: [MailService, EmailConfirmationService, EmailEventsConsumer],
})
export class EmailWorkerModule {}