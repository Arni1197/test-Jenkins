// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { TokenService } from './token.service';
import { MailService } from './mail.service';
import { EmailConfirmationService } from './email-confirmation.service';
import { TwoFaService } from './two-fa.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserEventsPublisher } from './user-events.publisher';

import { EmailVerifiedGuard } from 'src/common/guards/email-verified.guard';

// ✅ ВАЖНО:
// Если AuthService использует UsersService и REDIS-инжект,
// эти модули должны быть доступны в контексте AuthModule.
// Ты убрал UsersModule из AppModule (и это правильно для “чистого” AppModule),
// значит добавляем его сюда.
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    UsersModule,
    RedisModule,

    JwtModule.register({
      secret: 'secretKey',
      signOptions: { expiresIn: '1d' },
    }),

    // ✅ очередь событий пользователей
    BullModule.registerQueue({ name: 'user-events' }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TwoFaService,
    EmailVerifiedGuard,
    JwtStrategy,
    TokenService,
    MailService,
    EmailConfirmationService,

    // ✅ publisher
    UserEventsPublisher,
  ],
  exports: [AuthService, EmailConfirmationService],
})
export class AuthModule {}