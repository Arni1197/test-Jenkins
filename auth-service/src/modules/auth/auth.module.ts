import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { TokenService } from './token.service';
import { MailService } from './mail.service';
import { EmailConfirmationService } from './email-confirmation.service';
import { TwoFaService } from './two-fa.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserEventsPublisher } from './user-events.publisher';

import { EmailVerifiedGuard } from 'src/common/guards/email-verified.guard';
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
    UserEventsPublisher,
  ],
  exports: [AuthService, EmailConfirmationService],
})
export class AuthModule {}