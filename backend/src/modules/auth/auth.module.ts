import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { TokenService } from './token.service';
import { MailService } from './mail.service';
import { EmailConfirmationService } from './email-confirmation.service';
import { EmailVerifiedGuard } from 'src/common/guards/email-verified.guard';
import { TwoFaService } from './two-fa.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UsersModule,
    JwtModule.register({
      secret: 'secretKey',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TwoFaService, EmailVerifiedGuard, JwtStrategy, TokenService, MailService, EmailConfirmationService],
  exports: [AuthService, EmailConfirmationService],
})
export class AuthModule {}