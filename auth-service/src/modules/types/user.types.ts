// src/modules/types/user.types.ts
export interface DomainUser {
  id: string;
  email: string;
  username?: string | null;

  // пароль в домене — это то, что AuthService сравнивает через bcrypt
  // фактически он берётся из passwordHash в базе
  password: string;

  emailVerified: boolean;

  twoFactorEnabled: boolean;
  twoFactorSecret?: string | null;

  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  country?: string | null;
  birthDate?: Date | null;
  passwordChangedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}