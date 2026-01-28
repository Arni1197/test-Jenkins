// src/pages/RegisterPage.tsx
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import PageContainer from "../components/PageContainer";
import { register } from "../api/auth";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(""); // ✅ состояние username
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null); // ✅ новое инфо-сообщение
  const [loading, setLoading] = useState(false);

  const validatePassword = (value: string) => {
    if (value.length < 8) return "Пароль должен быть минимум 8 символов.";
    if (!/[a-z]/.test(value)) return "Добавьте хотя бы одну строчную букву.!";
    if (!/[A-Z]/.test(value)) return "Добавьте хотя бы одну заглавную букву.";
    if (!/[0-9]/.test(value)) return "Добавьте хотя бы одну цифру.";
    if (!/[^A-Za-z0-9]/.test(value)) return "Добавьте хотя бы один спецсимвол.";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!username.trim()) {
      setError("Username обязателен.");
      return;
    }

    const passError = validatePassword(password);
    if (passError) {
      setError(passError);
      return;
    }

    if (password !== passwordRepeat) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ создаём пользователя (бэкенд шлёт письмо с подтверждением)
      await register({ email, username, password });

      // 2️⃣ показываем уведомление, что письмо отправлено
      setInfo(
        `Мы отправили письмо с подтверждением на ${email}. ` +
          "Перейди по ссылке в письме, чтобы активировать аккаунт, а затем войди."
      );

      // 3️⃣ можно очистить форму, чтобы не висели значения
      setPassword("");
      setPasswordRepeat("");
      // email / username можно оставить, чтобы юзер видел, куда ушло письмо
      // если хочешь — раскомментируй:
      // setEmail("");
      // setUsername("");
    } catch (err: any) {
      // аккуратно разбираем ошибку, чтобы не показывать сырое JSON
      let msg =
        "Не удалось зарегистрироваться. Проверь email/username и сложность пароля.";

      if (typeof err?.message === "string") {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed?.message) {
            msg = parsed.message;
          }
        } catch {
          // сообщение было не JSON — просто оставляем дефолтное
        }
      }

      setError(msg);
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
          Username
          <input
            className="input"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="arnold"
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
            placeholder="Минимум 8 символов, A-z, 0-9, спецсимвол"
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

        {info && (
          <p
            style={{
              color: "var(--accent)",
              fontSize: 12,
              margin: "4px 0",
              whiteSpace: "pre-line",
            }}
          >
            {info}
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