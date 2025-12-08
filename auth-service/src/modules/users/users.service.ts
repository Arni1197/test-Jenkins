import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DomainUser } from '../types/user.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================
  // МАППЕР В ДОМЕН
  // ==========================
  private toDomain(user: any | null): DomainUser | null {
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username ?? undefined,

      password: user.passwordHash,
      emailVerified: user.emailVerified,

      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorSecret: user.twoFactorSecret ?? undefined,

      // профили тут не живут
      firstName: undefined,
      lastName: undefined,
      nickname: undefined,
      country: undefined,
      birthDate: undefined,

      passwordChangedAt: user.passwordChangedAt ?? undefined,

      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // ==========================
  // READ
  // ==========================
  async findByEmail(email: string): Promise<DomainUser | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return this.toDomain(user);
  }

  async findById(userId: string): Promise<DomainUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return this.toDomain(user);
  }

  // ==========================
  // CREATE (минимальный user)
  // ==========================
  async createUser(data: {
    email: string;
    username?: string;
    password: string; // уже hashed
  }): Promise<DomainUser> {
    try {
      const created = await this.prisma.user.create({
        data: {
          email: data.email,
          username: data.username ?? null,
          passwordHash: data.password,

          // ✅ emailVerified НЕ трогаем — берём default(false)
          // ✅ 2FA тоже default(false)
          twoFactorSecret: null,
          passwordChangedAt: null,
        },
      });

      return this.toDomain(created)!;
    } catch (e: any) {
      throw new ConflictException('User already exists');
    }
  }

  // ==========================
  // UPDATE auth-полей
  // ==========================
  async updateById(
    userId: string,
    update: Partial<{
      email: string;
      username: string;
      emailVerified: boolean;
      twoFactorEnabled: boolean;
      twoFactorSecret: string | null;
    }>,
  ): Promise<DomainUser | null> {
    const data: any = {};

    if (update.email !== undefined) data.email = update.email;
    if (update.username !== undefined) data.username = update.username;
    if (update.emailVerified !== undefined)
      data.emailVerified = update.emailVerified;

    if (update.twoFactorEnabled !== undefined)
      data.twoFactorEnabled = update.twoFactorEnabled;

    if (update.twoFactorSecret !== undefined)
      data.twoFactorSecret = update.twoFactorSecret;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.toDomain(user);
  }

  // ==========================
  // EMAIL VERIFIED helper
  // ==========================
  async markEmailVerified(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  }

  // ==========================
  // PASSWORD
  // ==========================
  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });
  }
}