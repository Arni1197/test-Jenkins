// src/pages/RegisterPage.tsx
import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageContainer from "../components/PageContainer";
import { register } from "../api/auth";

function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordRepeat) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    try {
      const result = await register({ email, password });

      // TODO: положить токены в localStorage / context
      console.log("Registered:", result);

      // Вариант A: сразу отправляем на /login
      navigate("/login");
      // Вариант B (потом): сразу логинить и вести на /profile
    } catch (err) {
      setError("Не удалось зарегистрироваться. Возможно, email уже занят.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Sign up"
      subtitle="Создай аккаунт, а дальше всё — через твой Auth / User / Catalog сервисы."
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: 12, maxWidth: 380 }}
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
          Пароль
          <input
            className="input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 8 символов"
          />
        </label>

        <label style={{ fontSize: 13 }}>
          Повтор пароля
          <input
            className="input"
            type="password"
            required
            value={passwordRepeat}
            onChange={(e) => setPasswordRepeat(e.target.value)}
            placeholder="Ещё раз пароль"
          />
        </label>

        {error && (
          <p style={{ color: "var(--danger)", fontSize: 12, margin: "4px 0" }}>
            {error}
          </p>
        )}

        <button type="submit" className="button-primary" disabled={loading}>
          {loading ? "Регистрируем..." : "Create account"}
        </button>
      </form>

      <p
        style={{
          marginTop: 12,
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        Уже есть аккаунт?{" "}
        <Link to="/login" style={{ color: "var(--accent)" }}>
          Войти
        </Link>
      </p>
    </PageContainer>
  );
}

export default RegisterPage;