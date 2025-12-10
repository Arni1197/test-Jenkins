// src/modules/auth/email-confirmation.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { MailService } from './mail.service';
import { REDIS } from '../redis/redis.constants';
import { DomainUser } from '../types/user.types'; // ⬅️ доменный пользователь

@Injectable()
export class EmailConfirmationService {
  constructor(
    @Inject(REDIS) private readonly redisClient: Redis,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  // 🔑 Генерация токена + запись в Redis + отправка письма
  async sendEmailConfirmation(user: DomainUser) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const ttlMinutes = this.config.get<number>('EMAIL_CONFIRM_TTL_MINUTES', 60);
    const ttlSeconds = ttlMinutes * 60;

    await this.redisClient.set(
      `email_confirm:${tokenHash}`,
      String(user.id),
      'EX',
      ttlSeconds,
    );

    const gatewayUrl = this.config.get<string>('GATEWAY_PUBLIC_URL');
    const confirmUrl = `${gatewayUrl}/auth/confirm-email?token=${rawToken}`;

    const usernameOrEmail = user.username ?? user.email;

    const html = `
      <p>Привет, ${usernameOrEmail}!</p>
      <p>Спасибо за регистрацию в нашем сервисе.</p>
      <p>Чтобы подтвердить email, перейдите по ссылке:</p>
      <a href="${confirmUrl}">${confirmUrl}</a>
      <p>Если вы не регистрировались — просто проигнорируйте это письмо.</p>
    `;

    await this.mailService.sendMail(
      user.email,
      'Подтверждение регистрации',
      html,
    );
  }

  // ✅ Подтверждение email по токену
  async confirmEmail(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const userId = await this.redisClient.get(`email_confirm:${tokenHash}`);

    if (!userId) {
      throw new BadRequestException('Invalid or expired token');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      await this.redisClient.del(`email_confirm:${tokenHash}`);
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      // уже подтверждён → просто чистим токен
      await this.redisClient.del(`email_confirm:${tokenHash}`);
      return;
    }

    // обновляем флаг подтверждения email через UsersService (Prisma)
    await this.usersService.updateById(user.id, {
      emailVerified: true,
    });

    await this.redisClient.del(`email_confirm:${tokenHash}`);
  }

  // 🔁 Повторная отправка письма
  async resendEmailConfirmation(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Не палим, что юзера нет
      return;
    }

    if (user.emailVerified) {
      return;
    }

    await this.sendEmailConfirmation(user);
  }

  // 🛡️ Утилита: проверка, что email подтверждён
  async ensureEmailVerified(email: string): Promise<DomainUser> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.emailVerified) {
      throw new UnauthorizedException('Email is not verified');
    }
    return user;
  }
}