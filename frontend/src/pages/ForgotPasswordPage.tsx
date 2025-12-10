import { useState } from "react";
import { Link } from "react-router-dom";
import PageContainer from "../components/PageContainer";
import { forgotPassword } from "../api/auth";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? "Ошибка отправки письма");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Forgot password"
      subtitle="Мы отправим ссылку для сброса пароля на вашу почту."
    >
      <div className="card-soft" style={{ maxWidth: 520 }}>
        {done ? (
          <>
            <div className="gp-alert-success">
              Если email зарегистрирован, письмо отправлено ✅
            </div>
            <div style={{ marginTop: 12 }}>
              <Link to="/login">
                <button className="btn-soft">Вернуться к логину</button>
              </Link>
            </div>
          </>
        ) : (
          <>
            {error && <div className="gp-alert">{error}</div>}

            <label className="gp-field">
              <span className="gp-label">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
              />
            </label>

            <div className="gp-row" style={{ marginTop: 12 }}>
              <button
                className="btn-primary"
                onClick={submit}
                disabled={loading || !email.trim()}
                type="button"
              >
                {loading ? "Отправляю..." : "Отправить ссылку"}
              </button>
              <Link to="/login">
                <button className="btn-soft" type="button">
                  Отмена
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}

export default ForgotPasswordPage;