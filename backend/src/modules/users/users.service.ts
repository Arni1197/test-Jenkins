// src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DomainUser } from '../types/user.types';
import { User } from 'generated/prisma';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================
  // ВСПОМОГАТЕЛЬНЫЙ МАППЕР
  // ==========================
  // Переводим объект из Prisma (PrismaUser)
  // в доменного пользователя (DomainUser),
  // с которым работает AuthService и остальная логика.
  private toDomain(user: User | null): DomainUser | null {
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username ?? undefined,

      // В БД поле называется passwordHash,
      // в домене мы называем его просто password (хэш уже там)
      password: user.passwordHash,

      emailVerified: user.isEmailConfirmed,

      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorSecret: user.twoFactorSecret ?? undefined,

      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      nickname: user.nickname ?? undefined,
      country: user.country ?? undefined,
      birthDate: user.birthDate ?? undefined,

      passwordChangedAt: user.passwordChangedAt ?? undefined,

      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // ==========================
  // НАЙТИ ПОЛЬЗОВАТЕЛЯ ПО EMAIL
  // ==========================
  async findByEmail(email: string): Promise<DomainUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return this.toDomain(user);
  }

  // ==========================
  // НАЙТИ ПОЛЬЗОВАТЕЛЯ ПО ID
  // ==========================
  async findById(userId: string): Promise<DomainUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    return this.toDomain(user);
  }

  // ==========================
  // СОЗДАТЬ НОВОГО ПОЛЬЗОВАТЕЛЯ
  // ==========================
  // dto: email, username, password (уже ЗАХЭШИРОВАННЫЙ)
  async createUser(data: {
    email: string;
    username: string;
    password: string; // захэшированный пароль
    firstName?: string;
    lastName?: string;
    nickname?: string;
    country?: string;
    birthDate?: Date;
  }): Promise<DomainUser> {
    const created = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash: data.password,

        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        nickname: data.nickname ?? null,
        country: data.country ?? null,
        birthDate: data.birthDate ?? null,

        isEmailConfirmed: false,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return this.toDomain(created)!;
  }

  // ==========================
  // ОБНОВИТЬ ПОЛЯ ПОЛЬЗОВАТЕЛЯ ПО ID
  // (аналог твоего updateById с Partial<User>)
  // ==========================
  async updateById(
    userId: string,
    update: Partial<{
      email: string;
      username: string;
      firstName: string;
      lastName: string;
      nickname: string;
      country: string;
      birthDate: Date;
      isEmailConfirmed: boolean;
      twoFactorEnabled: boolean;
      twoFactorSecret: string | null;
    }>,
  ): Promise<DomainUser | null> {
    // маппим только те поля, которые реально есть в Prisma-модели
    const data: any = {};

    if (update.email !== undefined) data.email = update.email;
    if (update.username !== undefined) data.username = update.username;
    if (update.firstName !== undefined) data.firstName = update.firstName;
    if (update.lastName !== undefined) data.lastName = update.lastName;
    if (update.nickname !== undefined) data.nickname = update.nickname;
    if (update.country !== undefined) data.country = update.country;
    if (update.birthDate !== undefined) data.birthDate = update.birthDate;
    if (update.isEmailConfirmed !== undefined) {
      data.isEmailConfirmed = update.isEmailConfirmed;
    }
    if (update.twoFactorEnabled !== undefined) {
      data.twoFactorEnabled = update.twoFactorEnabled;
    }
    if (update.twoFactorSecret !== undefined) {
      data.twoFactorSecret = update.twoFactorSecret;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.toDomain(user);
  }

  // ==========================
  // ОБНОВИТЬ ПАРОЛЬ
  // ==========================
  async updatePassword(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(), // заодно инвалидируем старые токены
      },
    });
  }

  // ==========================
  // ОТДЕЛЬНО ОБНОВИТЬ passwordChangedAt
  // (если хочешь сохранять текущую логику)
  // ==========================
  async updatePasswordChangedAt(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordChangedAt: new Date(),
      },
    });
  }
}