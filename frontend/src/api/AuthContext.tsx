// src/context/AuthContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authApi from "../api/auth";

/**
 * 1) Не считаем 401 "ошибкой" — это нормальный кейс "гость".
 * 2) Разделяем "первую загрузку приложения" и "тихий refresh", чтобы UI не мигал.
 * 3) Избегаем двойного вызова в React.StrictMode (dev) — ставим флаг.
 */

export type AuthUser = {
  userId?: string;
  email?: string;
  username?: string;
  twoFactorEnabled?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;          // только первичная загрузка (bootstrap)
  refreshing: boolean;       // тихий refresh (например, после логина)
  refreshAuth: (opts?: { silent?: boolean }) => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  clearAuthLocal: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getHttpStatus(err: any): number | undefined {
  // Под axios:
  if (err?.response?.status) return err.response.status;

  // Под fetch-обёртку, если ты кидаешь { status, ... }:
  if (typeof err?.status === "number") return err.status;

  // Если ты кидаешь Error("...") — статуса не будет:
  return undefined;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // bootstrap loading: только при старте приложения
  const [loading, setLoading] = useState(true);

  // refresh loading: для ручных обновлений (не ломает UI на старте)
  const [refreshing, setRefreshing] = useState(false);

  const refreshAuth = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;

    // silent=true → не трогаем общий loading, чтобы интерфейс не "мигал"
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const me = await authApi.me();
      setUser(me ?? null);
    } catch (err: any) {
      const status = getHttpStatus(err);

      // 401/403 — НЕ ошибка, это просто "не залогинен / нет прав"
      if (status === 401 || status === 403 || status === undefined) {
        // status === undefined оставляем сюда, если твой apiFetch кидает просто Error
        // Тогда мы всё равно считаем пользователя гостем — это ок.
        setUser(null);
      } else {
        // другие статусы уже реально интересны (можешь сюда добавить toast/лог)
        setUser(null);
        // console.error("Auth refresh failed:", err);
      }
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  const clearAuthLocal = useCallback(() => {
    setUser(null);
  }, []);

  // Чтобы в dev-режиме React.StrictMode не делал двойной refresh (и не спамил 401)
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (bootstrapped) return;
    setBootstrapped(true);

    // первая инициализация — НЕ silent (показываем нормальный loading при старте)
    refreshAuth({ silent: false });
  }, [bootstrapped, refreshAuth]);

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshing,
      refreshAuth,
      setUser,
      clearAuthLocal,
    }),
    [user, loading, refreshing, refreshAuth, clearAuthLocal]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}