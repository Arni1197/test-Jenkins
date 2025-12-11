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

export type AuthUser = {
  userId?: string;
  email?: string;
  username?: string;
  twoFactorEnabled?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  clearAuthLocal: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    try {
      const me = await authApi.me();
      setUser(me ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAuthLocal = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const value = useMemo(
    () => ({ user, loading, refreshAuth, setUser, clearAuthLocal }),
    [user, loading, refreshAuth, clearAuthLocal]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}