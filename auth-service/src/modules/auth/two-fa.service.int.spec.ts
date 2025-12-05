// src/modules/auth/two-fa.service.int.spec.ts
import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as speakeasy from 'speakeasy';

import { TwoFaService } from './two-fa.service';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';

const hasDatabaseUrl = !!process.env.DATABASE_URL;

// если нет DATABASE_URL — просто скипаем этот suite
(hasDatabaseUrl ? describe : describe.skip)(
  'TwoFaService (integration, Prisma)',
  () => {
    let moduleRef: TestingModule;
    let twoFaService: TwoFaService;
    let usersService: UsersService;
    let prisma: PrismaService;

    beforeAll(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [PrismaModule, UsersModule],
        providers: [TwoFaService],
      }).compile();

      twoFaService = moduleRef.get<TwoFaService>(TwoFaService);
      usersService = moduleRef.get<UsersService>(UsersService);
      prisma = moduleRef.get<PrismaService>(PrismaService);

      // чистим таблицу пользователей
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
      const user = await usersService.createUser({
        email: 'twofa-int@test.com',
        username: 'twofa-int-user',
        password: 'hashed-password', // 👈 ВАЖНО: ИМЕННО password
      });

      const result = await twoFaService.generateSecretForUser(user.id);

      expect(result.secret).toBeDefined();
      expect(result.otpauthUrl).toBeDefined();

      const updatedUser = await usersService.findById(user.id);

      expect(updatedUser).not.toBeNull();
      expect(updatedUser!.twoFactorSecret).toBe(result.secret);
      expect(updatedUser!.twoFactorEnabled).toBe(false);
    });

    it('должен успешно включать 2FA при корректном коде', async () => {
      const user = await usersService.createUser({
        email: 'enable-twofa@test.com',
        username: 'enable-twofa-user',
        password: 'hashed-password', // 👈 ТОЖЕ password
      });

      const { secret } = await twoFaService.generateSecretForUser(user.id);

      const code = speakeasy.totp({
        secret,
        encoding: 'base32',
      });

      await twoFaService.enableTwoFa(user.id, code);

      const updatedUser = await usersService.findById(user.id);

      expect(updatedUser).not.toBeNull();
      expect(updatedUser!.twoFactorEnabled).toBe(true);
      expect(updatedUser!.twoFactorSecret).toBe(secret);
    });
  },
);