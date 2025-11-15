import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import { UsersService } from '../users/users.service';

@Injectable()
export class TwoFaService {
  constructor(private readonly usersService: UsersService) {}

  async generateSecretForUser(userId: string) {
    const secret = speakeasy.generateSecret({
      length: 20,
      name: 'Game Project',
      issuer: 'Game Project',
    });

    await this.usersService.updateById(userId, {
      twoFactorSecret: secret.base32,
      twoFactorEnabled: false,
    });

    return {
      otpauthUrl: secret.otpauth_url,
      secret: secret.base32, // можно и не отдавать, достаточно otpauthUrl
    };
  }

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

    user.twoFactorEnabled = true;
    await user.save();
  }

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

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();
  }

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