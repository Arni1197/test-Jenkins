import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageContainer from "../components/PageContainer";
import { resetPassword } from "../api/auth";

function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") ?? "", [params]);

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    token && password.trim().length >= 6 && password === password2;

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? "Ошибка сброса пароля");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Reset password"
      subtitle="Введите новый пароль для вашей учётной записи."
    >
      <div className="card-soft" style={{ maxWidth: 520 }}>
        {!token && (
          <div className="gp-alert">
            Нет токена. Откройте ссылку из письма.
          </div>
        )}

        {done ? (
          <>
            <div className="gp-alert-success">
              Пароль успешно обновлён ✅
            </div>
            <div style={{ marginTop: 12 }}>
              <Link to="/login">
                <button className="btn-primary">Войти</button>
              </Link>
            </div>
          </>
        ) : (
          <>
            {error && <div className="gp-alert">{error}</div>}

            <label className="gp-field">
              <span className="gp-label">Новый пароль</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Минимум 6 символов"
              />
            </label>

            <label className="gp-field">
              <span className="gp-label">Повторите пароль</span>
              <input
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                type="password"
              />
            </label>

            <div className="gp-row" style={{ marginTop: 12 }}>
              <button
                className="btn-primary"
                onClick={submit}
                disabled={!valid || loading}
                type="button"
              >
                {loading ? "Сохраняю..." : "Сбросить пароль"}
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

export default ResetPasswordPage;