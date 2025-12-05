// src/api/auth.ts
import { apiFetch } from "./client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  // TODO: путь под твой gateway: /auth/login или /api/auth/login
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 🔽 НОВОЕ: регистрация
export interface RegisterPayload {
  email: string;
  password: string;
  // при желании можно добавить username, nickname и т.п.
}

export async function register(
  payload: RegisterPayload
): Promise<AuthResponse> {
  // TODO: подстрой под свой backend: /auth/register или /auth/signup
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function refreshToken(
  refreshTokenValue: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
}