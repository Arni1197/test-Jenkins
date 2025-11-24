// src/modules/auth/two-fa.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { TwoFaService } from './two-fa.service';
import { UsersService } from '../users/users.service';
import * as speakeasy from 'speakeasy';

// Мокаем speakeasy
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(),
  totp: {
    verify: jest.fn(),
  },
}));

describe('TwoFaService', () => {
  let service: TwoFaService;
  let usersService: {
    updateById: jest.Mock;
    findById: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      updateById: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFaService,
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    service = module.get<TwoFaService>(TwoFaService);

    (speakeasy.generateSecret as jest.Mock).mockReset();
    (speakeasy.totp.verify as jest.Mock).mockReset();
  });

  // 1. generateSecretForUser
  it('generateSecretForUser — должен генерировать секрет и сохранить его в пользователе', async () => {
    const fakeSecret = {
      base32: 'BASE32SECRET',
      otpauth_url: 'otpauth://totp/Game%20Project?secret=BASE32SECRET',
    };

    (speakeasy.generateSecret as jest.Mock).mockReturnValue(fakeSecret);

    const userId = 'user-id-123';

    const result = await service.generateSecretForUser(userId);

    expect(speakeasy.generateSecret).toHaveBeenCalledWith({
      length: 20,
      name: 'Game Project',
      issuer: 'Game Project',
    });

    expect(usersService.updateById).toHaveBeenCalledWith(userId, {
      twoFactorSecret: fakeSecret.base32,
      twoFactorEnabled: false,
    });

    expect(result).toEqual({
      otpauthUrl: fakeSecret.otpauth_url,
      secret: fakeSecret.base32,
    });
  });

  // 2. enableTwoFa — нет пользователя / нет секрета
  it('enableTwoFa — должен кидать ошибку, если секрет не установлен', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      service.enableTwoFa('user-id', '123456'),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      service.enableTwoFa('user-id', '123456'),
    ).rejects.toThrow('2FA secret is not set');

    expect(usersService.updateById).not.toHaveBeenCalled();
  });

  // 3. enableTwoFa — неверный код
  it('enableTwoFa — должен кидать ошибку при неверном 2FA коде', async () => {
    const fakeUser: any = {
      id: 'user-id',
      twoFactorSecret: 'BASE32SECRET',
      twoFactorEnabled: false,
    };

    usersService.findById.mockResolvedValue(fakeUser);
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

    await expect(
      service.enableTwoFa('user-id', 'wrong-code'),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      service.enableTwoFa('user-id', 'wrong-code'),
    ).rejects.toThrow('Неверный 2FA код');

    expect(usersService.updateById).not.toHaveBeenCalled();
  });

  // 4. enableTwoFa — успешный сценарий
  it('enableTwoFa — должен включать 2FA при корректном коде', async () => {
    const fakeUser: any = {
      id: 'user-id',
      twoFactorSecret: 'BASE32SECRET',
      twoFactorEnabled: false,
    };

    usersService.findById.mockResolvedValue(fakeUser);
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

    await service.enableTwoFa('user-id', '123456');

    expect(speakeasy.totp.verify).toHaveBeenCalledWith({
      secret: 'BASE32SECRET',
      encoding: 'base32',
      token: '123456',
      window: 1,
    });

    expect(usersService.updateById).toHaveBeenCalledWith('user-id', {
      twoFactorEnabled: true,
    });
  });

  // 5. disableTwoFa — 2FA не включена
  it('disableTwoFa — должен кидать ошибку, если 2FA не включена', async () => {
    const fakeUser: any = {
      id: 'user-id',
      twoFactorSecret: null,
      twoFactorEnabled: false,
    };

    usersService.findById.mockResolvedValue(fakeUser);

    await expect(
      service.disableTwoFa('user-id', '123456'),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      service.disableTwoFa('user-id', '123456'),
    ).rejects.toThrow('2FA не включена');

    expect(usersService.updateById).not.toHaveBeenCalled();
  });

  // 6. disableTwoFa — неверный код
  it('disableTwoFa — должен кидать ошибку при неверном 2FA коде', async () => {
    const fakeUser: any = {
      id: 'user-id',
      twoFactorSecret: 'BASE32SECRET',
      twoFactorEnabled: true,
    };

    usersService.findById.mockResolvedValue(fakeUser);
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

    await expect(
      service.disableTwoFa('user-id', 'wrong-code'),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      service.disableTwoFa('user-id', 'wrong-code'),
    ).rejects.toThrow('Неверный 2FA код');

    expect(usersService.updateById).not.toHaveBeenCalled();
  });

  // 7. disableTwoFa — успешный сценарий
  it('disableTwoFa — должен отключать 2FA при корректном коде', async () => {
    const fakeUser: any = {
      id: 'user-id',
      twoFactorSecret: 'BASE32SECRET',
      twoFactorEnabled: true,
    };

    usersService.findById.mockResolvedValue(fakeUser);
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

    const originalSecret = fakeUser.twoFactorSecret;

    await service.disableTwoFa('user-id', '123456');

    expect(speakeasy.totp.verify).toHaveBeenCalledWith({
      secret: originalSecret,
      encoding: 'base32',
      token: '123456',
      window: 1,
    });

    expect(usersService.updateById).toHaveBeenCalledWith('user-id', {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
  });

  // 8. verifyCode — 2FA не включена
  it('verifyCode — должен кидать ошибку, если 2FA не включена', async () => {
    const fakeUser: any = {
      id: 'user-id',
      twoFactorSecret: null,
      twoFactorEnabled: false,
    };

    usersService.findById.mockResolvedValue(fakeUser);

    await expect(
      service.verifyCode('user-id', '123456'),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      service.verifyCode('user-id', '123456'),
    ).rejects.toThrow('2FA не включена');
  });

  // 9. verifyCode — успешная верификация
  it('verifyCode — должен возвращать результат speakeasy.totp.verify, если 2FA включена', async () => {
    const fakeUser: any = {
      id: 'user-id',
      twoFactorSecret: 'BASE32SECRET',
      twoFactorEnabled: true,
    };

    usersService.findById.mockResolvedValue(fakeUser);
    (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

    const result = await service.verifyCode('user-id', '123456');

    expect(speakeasy.totp.verify).toHaveBeenCalledWith({
      secret: 'BASE32SECRET',
      encoding: 'base32',
      token: '123456',
      window: 1,
    });

    expect(result).toBe(true);
  });
});