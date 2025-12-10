// src/api/user.ts
import { apiFetch } from "./client";
import { getAccessToken } from "./auth";

export interface UserProfile {
  id: string;
  authUserId: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  language?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfilePayload {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  language?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
}

// ✅ ключевой фикс
function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me", {
    headers: authHeaders(),
  });
}

export async function updateMe(
  payload: UpdateProfilePayload
): Promise<UserProfile> {
  return apiFetch<UserProfile>("/users/me", {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}