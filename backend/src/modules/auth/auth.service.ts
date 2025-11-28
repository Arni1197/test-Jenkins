// src/modules/auth/auth.service.ts
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

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// ⬇️ вместо Mongo-документа импортируем доменного пользователя
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
  ) {}

  // -------------------------
  // Регистрация
  // -------------------------
  async register(dto: {
    email: string;
    username: string;
    password: string;
  }): Promise<DomainUser> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.createUser({
      email: dto.email,
      username: dto.username,
      password: hashedPassword, // захэшированный пароль кладём в password → passwordHash в БД
    });

    // 📨 Отправляем письмо подтверждения
    await this.emailConfirmationService.sendEmailConfirmation(user);

    return user;
  }

  // -------------------------
  // Логин
  // -------------------------
  async login(dto: { email: string; password: string }) {
    const maxAttempts = 5;
    const blockTimeSeconds = 60 * 15;
    const attemptsKey = ` The login_attempts:${dto.email}`;

    const attempts = await this.redisClient.get(attemptsKey);
    if (attempts && Number(attempts) >= maxAttempts) {
      throw new UnauthorizedException(
       'Too many login attempts',
      );
    }

    const user = await this.usersService.findByEmail(dto.email);

    // если пользователя нет — считаем это неуспешной попыткой
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

    // пароль ок → обнуляем счётчик
    await this.redisClient.del(attemptsKey);

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Email к великому сожалению не подтверждён',
      );
    }

    // 2FA включена → не выдаём токены, отдаём только twoFaToken
    if (user.twoFactorEnabled) {
      const twoFaToken = this.tokenService.generateTwoFaToken(user.id);
      return {
        need2fa: true,
        twoFaToken,
      };
    }

    // 2FA не включена → обычный flow
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

  // -------------------------
  // Завершение 2FA логина
  // -------------------------
  async completeTwoFaLogin(dto: { twoFaToken: string; code: string }) {
    // 1) проверяем twoFaToken
    const payload = this.tokenService.verifyTwoFaToken(dto.twoFaToken);
    if (payload.type !== '2fa') {
      throw new UnauthorizedException('Неверный 2FA токен');
    }

    const userId = payload.sub;

    // 2) проверяем 2FA-код
    const isValid = await this.twoFaService.verifyCode(userId, dto.code);
    if (!isValid) {
      throw new UnauthorizedException('Неверный 2FA код');
    }

    // 3) достаём пользователя
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Увы, Пользователь не найден');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('К сожалению, Email не подтверждён');
    }

    // 4) генерируем обычные токены
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

  // -------------------------
  // Обновление access token через refresh token
  // -------------------------
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

  // -------------------------
  // Сброс пароля — запрос
  // -------------------------
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

  // -------------------------
  // Сброс пароля — подтверждение
  // -------------------------
  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const userId = await this.redisClient.get(`reset:${tokenHash}`);
    if (!userId) throw new BadRequestException('Invalid or expired token');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, hashedPassword);
    await this.redisClient.del(`reset:${tokenHash}`);
  }
}