// src/api/auth.ts
import { apiFetch } from "./client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export type LoginResponse =
  | {
      need2fa: true;
      twoFaToken: string;
    }
  | {
      need2fa?: false;
      userId: string;
      email: string;
      username?: string;
    };

export interface AuthResponse {
  userId: string;
  email: string;
  username?: string;
}

// -------------------- Auth basic --------------------
export async function register(payload: RegisterPayload) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function login(payload: LoginPayload) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function logout() {
  return apiFetch<{ message: string }>("/auth/logout", {
    method: "POST",
  });
}

export async function me() {
  return apiFetch<any>("/auth/me");
}

// -------------------- Password reset --------------------
export async function forgotPassword(email: string) {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword(token: string, password: string) {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: { token, password },
  });
}

// -------------------- 2FA --------------------
export interface TwoFaSetupResponse {
  otpauthUrl: string;
  secret: string;
}

export async function twoFaSetup() {
  return apiFetch<TwoFaSetupResponse>("/auth/2fa/setup", {
    method: "POST",
  });
}

export async function twoFaEnable(code: string) {
  return apiFetch<{ message: string }>("/auth/2fa/enable", {
    method: "POST",
    body: { code },
  });
}

export async function twoFaDisable(code: string) {
  return apiFetch<{ message: string }>("/auth/2fa/disable", {
    method: "POST",
    body: { code },
  });
}

export async function twoFaLogin(twoFaToken: string, code: string) {
  return apiFetch<{ userId: string; email: string; username?: string }>(
    "/auth/2fa/login",
    {
      method: "POST",
      body: { twoFaToken, code },
    }
  );
}