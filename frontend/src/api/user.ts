// src/api/user.ts
import { apiFetch } from "./client";

export interface UserProfile {
  id: number;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getMe(accessToken: string): Promise<UserProfile> {
  // В реальности токен мы будем доставать из хранилища (context/localStorage),
  // сейчас просто оставим параметром.
  return apiFetch<UserProfile>("/users/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export interface UpdateProfilePayload {
  displayName?: string;
  avatarUrl?: string;
  country?: string;
}

export async function updateMe(
  accessToken: string,
  payload: UpdateProfilePayload
): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}