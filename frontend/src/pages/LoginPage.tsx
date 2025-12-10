// src/pages/LoginPage.tsx
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageContainer from "../components/PageContainer";
import { login, twoFaLogin } from "../api/auth";
import { useAuth } from "../api/AuthContext";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [twoFaToken, setTwoFaToken] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { refreshAuth } = useAuth(); // чтобы сразу обновить navbar/стейт

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login({ email, password });

      // ✅ 2FA flow
      if ("need2fa" in result && result.need2fa) {
        setTwoFaToken(result.twoFaToken);
        setCode("");
        return;
      }

      // ✅ обычный flow
      await refreshAuth();
      navigate("/profile");
    } catch (err: any) {
      setError(err?.message ?? "Не удалось войти. Проверь email/пароль.");
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFa = async (e: FormEvent) => {
    e.preventDefault();
    if (!twoFaToken) return;

    setError(null);
    setLoading(true);

    try {
      await twoFaLogin(twoFaToken, code.trim());
      setTwoFaToken(null);
      setCode("");

      await refreshAuth();
      navigate("/profile");
    } catch (err: any) {
      setError(err?.message ?? "Неверный код 2FA.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Если есть twoFaToken — показываем второй шаг
  if (twoFaToken) {
    return (
      <PageContainer
        title="Two-Factor Sign in"
        subtitle="Введи 6-значный код из Authenticator."
      >
        <form
          onSubmit={handleTwoFa}
          style={{ display: "grid", gap: 12, maxWidth: 360 }}
        >
          <label style={{ fontSize: 13 }}>
            2FA code
            <input
              className="input"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
            />
          </label>

          {error && (
            <p style={{ color: "var(--danger)", fontSize: 12, margin: "4px 0" }}>
              {error}
            </p>
          )}

          <button type="submit" className="button-primary" disabled={loading}>
            {loading ? "Проверяю..." : "Confirm"}
          </button>

          <button
            type="button"
            className="button-ghost"
            onClick={() => setTwoFaToken(null)}
            disabled={loading}
          >
            Назад
          </button>
        </form>
      </PageContainer>
    );
  }

  // ✅ Обычный логин
  return (
    <PageContainer
      title="Sign in"
      subtitle="Подключим это к твоему Auth сервису через API Gateway."
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: 12, maxWidth: 360 }}
      >
        <label style={{ fontSize: 13 }}>
          Email
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label style={{ fontSize: 13 }}>
          Password
          <input
            className="input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error && (
          <p style={{ color: "var(--danger)", fontSize: 12, margin: "4px 0" }}>
            {error}
          </p>
        )}

        <button type="submit" className="button-primary" disabled={loading}>
          {loading ? "Входим..." : "Sign in"}
        </button>
      </form>

      <p
        style={{
          marginTop: 12,
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        Нет аккаунта?{" "}
        <Link to="/register" style={{ color: "var(--accent)" }}>
          Зарегистрироваться
        </Link>
      </p>

      <Link to="/forgot-password" className="gp-muted" style={{ fontSize: 12 }}>
        Forgot password?
      </Link>
    </PageContainer>
  );
}

export default LoginPage;