export interface DomainUser {
  id: string;
  email: string;
  username?: string;

  // ✅ в домене Auth
  password: string;
  emailVerified: boolean;

  twoFactorEnabled: boolean;
  twoFactorSecret?: string;

  // ✅ Профильные поля формально могут существовать в общем домене,
  // но Auth-service их НЕ заполняет.
  firstName?: string;
  lastName?: string;
  nickname?: string;
  country?: string;
  birthDate?: Date;

  passwordChangedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}