// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { UsersModule } from '../users/users.module';
import { TokenService } from './token.service';
import { MailService } from './mail.service';
import { EmailConfirmationService } from './email-confirmation.service';
import { EmailVerifiedGuard } from 'src/common/guards/email-verified.guard';
import { TwoFaService } from './two-fa.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      // можешь временно оставить так,
      // главное, что Mongoose отрезали
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
  ],
  exports: [AuthService, EmailConfirmationService],
})
export class AuthModule {}