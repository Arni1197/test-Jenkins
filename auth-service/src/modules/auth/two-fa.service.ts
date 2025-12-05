// src/modules/auth/two-fa.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import { UsersService } from '../users/users.service';

@Injectable()
export class TwoFaService {
  constructor(private readonly usersService: UsersService) {}

  // Генерация секрета для пользователя
  async generateSecretForUser(userId: string) {
    const secret = speakeasy.generateSecret({
      length: 20,
      name: 'Game Project',
      issuer: 'Game Project',
    });

    // сохраняем секрет в БД через UsersService (Prisma)
    await this.usersService.updateById(userId, {
      twoFactorSecret: secret.base32,
      twoFactorEnabled: false,
    });

    return {
      otpauthUrl: secret.otpauth_url,
      secret: secret.base32, // можно и не отдавать, достаточно otpauthUrl
    };
  }

  // Включение 2FA (после ввода правильного кода)
  async enableTwoFa(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user?.twoFactorSecret) {
      throw new UnauthorizedException('2FA secret is not set');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new UnauthorizedException('Неверный 2FA код');
    }

    // включаем 2FA через UsersService
    await this.usersService.updateById(userId, {
      twoFactorEnabled: true,
    });
  }

  // Отключение 2FA
  async disableTwoFa(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user?.twoFactorSecret || !user.twoFactorEnabled) {
      throw new UnauthorizedException('2FA не включена');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new UnauthorizedException('Неверный 2FA код');
    }

    // выключаем 2FA и чистим секрет
    await this.usersService.updateById(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
  }

  // Проверка 2FA-кода при логине
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user?.twoFactorSecret || !user.twoFactorEnabled) {
      throw new UnauthorizedException('2FA не включена');
    }

    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
  }
}