import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

import { UsersService } from '../users/users.service';
import { REDIS } from '../redis/redis.constants';
import { TokenService } from './token.service';
import { MailService } from './mail.service';
import { EmailConfirmationService } from './email-confirmation.service';
import { TwoFaService } from './two-fa.service';
import { UserEventsPublisher } from './user-events.publisher';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { DomainUser } from '../types/user.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @Inject(REDIS) private readonly redisClient: Redis,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    private readonly twoFaService: TwoFaService,
    private readonly emailConfirmationService: EmailConfirmationService,
    private readonly userEventsPublisher: UserEventsPublisher,
  ) {}

  private isEmailConfirmationRequired(): boolean {
    const raw = this.config.get<string | boolean>(
      'EMAIL_CONFIRMATION_REQUIRED',
      'true',
    );

    if (typeof raw === 'boolean') return raw;
    return String(raw).trim().toLowerCase() === 'true';
  }

  async register(dto: {
    email: string;
    username: string;
    password: string;
  }): Promise<DomainUser> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const emailConfirmationRequired = this.isEmailConfirmationRequired();

    const user = await this.usersService.createUser({
      email: dto.email,
      username: dto.username,
      password: hashedPassword,
      emailVerified: !emailConfirmationRequired,
    });

    if (emailConfirmationRequired) {
      await this.userEventsPublisher.publishUserRegistered({
        userId: user.id,
        email: user.email,
        username: user.username ?? undefined,
        sendConfirmationEmail: true,
      });
    }

    return user;
  }

  async login(dto: { email: string; password: string }) {
    const maxAttempts = 5;
    const blockTimeSeconds = 60 * 15;

    const attemptsKey = `login_attempts:${dto.email}`;

    const attempts = await this.redisClient.get(attemptsKey);
    if (attempts && Number(attempts) >= maxAttempts) {
      throw new UnauthorizedException('Too many login attempts');
    }

    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      await this.redisClient.incr(attemptsKey);
      await this.redisClient.expire(attemptsKey, blockTimeSeconds);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      await this.redisClient.incr(attemptsKey);
      await this.redisClient.expire(attemptsKey, blockTimeSeconds);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.redisClient.del(attemptsKey);

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Email к великому сожалению не подтверждён',
      );
    }

    if (user.twoFactorEnabled) {
      const twoFaToken = this.tokenService.generateTwoFaToken(user.id);
      return {
        need2fa: true,
        twoFaToken,
      };
    }

    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.email,
    );
    const refreshToken = this.tokenService.generateRefreshToken(user.id);

    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      accessToken,
      refreshToken,
    };
  }

  async completeTwoFaLogin(dto: { twoFaToken: string; code: string }) {
    const payload = this.tokenService.verifyTwoFaToken(dto.twoFaToken);
    if (payload.type !== '2fa') {
      throw new UnauthorizedException('Неверный 2FA токен');
    }

    const userId = payload.sub;

    const isValid = await this.twoFaService.verifyCode(userId, dto.code);
    if (!isValid) {
      throw new UnauthorizedException('Неверный 2FA код');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Увы, Пользователь не найден');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('К сожалению, Email не подтверждён');
    }

    const accessToken = this.tokenService.generateAccessToken(
      user.id,
      user.email,
    );
    const refreshToken = this.tokenService.generateRefreshToken(user.id);

    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.tokenService.verifyRefreshToken(token) as {
        sub: string;
      };

      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException();

      const accessToken = this.tokenService.generateAccessToken(
        user.id,
        user.email,
      );
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const ttlSeconds =
      Number(this.config.get<number>('PASSWORD_RESET_TTL_MINUTES', 60)) * 60;

    await this.redisClient.set(`reset:${tokenHash}`, user.id, 'EX', ttlSeconds);

    const resetUrl = `${this.config.get<string>(
      'FRONTEND_URL',
    )}/reset-password?token=${rawToken}`;

    const html = `<p>Привет, ${user.username}!</p>
                  <p>Чтобы сбросить пароль, перейдите по ссылке:</p>
                  <a href="${resetUrl}">${resetUrl}</a>
                  <p>Если вы не запрашивали сброс — проигнорируйте это письмо.</p>`;

    await this.mailService.sendMail(user.email, 'Сброс пароля', html);
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const userId = await this.redisClient.get(`reset:${tokenHash}`);
    if (!userId) throw new BadRequestException('Invalid or expired token');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, hashedPassword);
    await this.redisClient.del(`reset:${tokenHash}`);
  }
}