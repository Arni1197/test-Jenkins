// src/api/user.ts
import { apiFetch } from "./client";

// Тип профиля под твою Prisma-модель UserProfile
export interface UserProfile {
  id: string;
  authUserId: string;

  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  language?: string | null;

  displayName?: string | null;
  avatarUrl?: string | null;
  country?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

// DTO payload, который ты шлёшь в PATCH
export interface UpdateProfilePayload {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  language?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
}

// Нормализация строк: "" -> null, "  a  " -> "a"
const toNull = (v?: string | null) => {
  const s = typeof v === "string" ? v.trim() : v;
  return s ? s : null;
};

// ✅ GET /users/me
// Токен НЕ передаем вручную — он приходит как httpOnly cookie в gateway
export async function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me");
}

// ✅ PATCH /users/me
export async function updateMe(
  payload: UpdateProfilePayload
): Promise<UserProfile> {
  const cleaned: UpdateProfilePayload = {
    displayName: toNull(payload.displayName),
    firstName: toNull(payload.firstName),
    lastName: toNull(payload.lastName),
    language: toNull(payload.language),
    bio: toNull(payload.bio),
    avatarUrl: toNull(payload.avatarUrl),
    country: toNull(payload.country),
  };

  return apiFetch<UserProfile>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(cleaned),
  });
}