// src/pages/LoginPage.tsx
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import PageContainer from "../components/PageContainer";
import { login } from "../api/auth";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login({ email, password });
      // TODO: сохранить токены (localStorage / context)
      console.log("Logged in:", result);
    } catch (err) {
      setError("Не удалось войти. Проверь email/пароль.");
    } finally {
      setLoading(false);
    }
  };

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
    </PageContainer>
  );
}

export default LoginPage;