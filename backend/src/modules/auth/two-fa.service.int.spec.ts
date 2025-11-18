// src/modules/auth/two-fa.service.int-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as speakeasy from 'speakeasy';

import { TwoFaService } from './two-fa.service';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../../schemas/user.schema';

describe('TwoFaService (integration)', () => {
  let moduleRef: TestingModule;
  let twoFaService: TwoFaService;
  let usersService: UsersService;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // 1. Поднимаем in-memory Mongo
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // 2. Собираем настоящий Nest-модуль с Mongoose и UsersModule
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        UsersModule, // здесь уже подключён UserSchema и UsersService
      ],
      providers: [TwoFaService],
    }).compile();

    twoFaService = moduleRef.get<TwoFaService>(TwoFaService);
    usersService = moduleRef.get<UsersService>(UsersService);
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('должен сгенерировать 2FA секрет и сохранить его пользователю', async () => {
    // 1. Создаём пользователя в тестовой Mongo
    const user = await usersService.createUser({
      email: 'twofa-int@test.com',
      username: 'twofa-int-user',
      password: 'hashed-password',
    } as Partial<UserDocument>);

    // 2. Вызываем реальный TwoFaService.generateSecretForUser
    const result = await twoFaService.generateSecretForUser(String(user._id));

    // 3. Проверяем, что вернулись данные
    expect(result.secret).toBeDefined();
    expect(result.otpauthUrl).toBeDefined();

    // 4. Достаём пользователя из БД и проверяем, что секрет записан
    const updatedUser = await usersService.findById(String(user._id));

    expect(updatedUser).not.toBeNull();
    expect(updatedUser.twoFactorSecret).toBe(result.secret);
    expect(updatedUser.twoFactorEnabled).toBe(false);
  });

  it('должен успешно включать 2FA при корректном коде', async () => {
    // 1. Создаём пользователя без 2FA
    const user = await usersService.createUser({
      email: 'enable-twofa@test.com',
      username: 'enable-twofa-user',
      password: 'hashed-password',
    } as Partial<UserDocument>);

    // 2. Генерируем секрет для этого пользователя
    const { secret } = await twoFaService.generateSecretForUser(String(user._id));

    // 3. Генерируем корректный TOTP-код через speakeasy по этому secret
    const code = speakeasy.totp({
      secret,
      encoding: 'base32',
    });

    // 4. Вызываем реальный enableTwoFa
    await twoFaService.enableTwoFa(String(user._id), code);

    // 5. Проверяем, что в БД 2FA включена
    const updatedUser = await usersService.findById(String(user._id));

    expect(updatedUser).not.toBeNull();
    expect(updatedUser.twoFactorEnabled).toBe(true);
    expect(updatedUser.twoFactorSecret).toBe(secret);
  });
});