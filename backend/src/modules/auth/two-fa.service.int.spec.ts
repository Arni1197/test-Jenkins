// src/modules/auth/two-fa.service.int-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import * as speakeasy from 'speakeasy';

import { TwoFaService } from './two-fa.service';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';

describe('TwoFaService (integration, Prisma)', () => {
  let moduleRef: TestingModule;
  let twoFaService: TwoFaService;
  let usersService: UsersService;
  let prisma: PrismaService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        PrismaModule, // даёт PrismaService
        UsersModule,  // твой UsersService, который теперь работает через Prisma
      ],
      providers: [TwoFaService],
    }).compile();

    twoFaService = moduleRef.get<TwoFaService>(TwoFaService);
    usersService = moduleRef.get<UsersService>(UsersService);
    prisma = moduleRef.get<PrismaService>(PrismaService);

    // 🧹 На всякий случай чистим таблицу пользователей перед тестами
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('должен сгенерировать 2FA секрет и сохранить его пользователю', async () => {
    // 1. Создаём пользователя в тестовой БД через UsersService
    const user = await usersService.createUser({
      email: 'twofa-int@test.com',
      username: 'twofa-int-user',
      password: 'hashed-password', // 👈 поле под Prisma-схему (passwordHash)
    });

    // 2. Вызываем реальный TwoFaService.generateSecretForUser
    const result = await twoFaService.generateSecretForUser(user.id);

    expect(result.secret).toBeDefined();
    expect(result.otpauthUrl).toBeDefined();

    // 3. Достаём пользователя из БД и проверяем, что секрет записан
    const updatedUser = await usersService.findById(user.id);

    expect(updatedUser).not.toBeNull();
    expect(updatedUser!.twoFactorSecret).toBe(result.secret);
    expect(updatedUser!.twoFactorEnabled).toBe(false);
  });

  it('должен успешно включать 2FA при корректном коде', async () => {
    // 1. Создаём пользователя без 2FA
    const user = await usersService.createUser({
      email: 'enable-twofa@test.com',
      username: 'enable-twofa-user',
      password: 'hashed-password',
    });

    // 2. Генерируем секрет для этого пользователя
    const { secret } = await twoFaService.generateSecretForUser(user.id);

    // 3. Генерируем корректный TOTP-код через speakeasy по этому секрету
    const code = speakeasy.totp({
      secret,
      encoding: 'base32',
    });

    // 4. Вызываем реальный enableTwoFa
    await twoFaService.enableTwoFa(user.id, code);

    // 5. Проверяем, что в БД 2FA включена
    const updatedUser = await usersService.findById(user.id);

    expect(updatedUser).not.toBeNull();
    expect(updatedUser!.twoFactorEnabled).toBe(true);
    expect(updatedUser!.twoFactorSecret).toBe(secret);
  });
});