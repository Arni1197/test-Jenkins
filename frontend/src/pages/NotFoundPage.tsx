// src/pages/NotFoundPage.tsx
import { Link, useLocation } from "react-router-dom";
import PageContainer from "../components/PageContainer";

function NotFoundPage() {
  const location = useLocation();

  return (
    <PageContainer
      title="404"
      subtitle="Страница не найдена. Возможно, сервис ещё в пути 🙂"
    >
      {/* декоративный блок */}
      <div
        className="card-soft"
        style={{
          display: "grid",
          gap: 14,
          padding: 18,
          borderRadius: 16,
          background:
            "linear-gradient(120deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {/* бейдж */}
          <span
            style={{
              fontSize: 11,
              letterSpacing: 0.4,
              padding: "4px 8px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              color: "var(--text-muted)",
            }}
          >
            Route not found
          </span>

          {/* текущий путь */}
          <span
            style={{
              fontSize: 11,
              padding: "4px 8px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.06)",
              color: "var(--text-muted)",
              wordBreak: "break-all",
            }}
            title={location.pathname}
          >
            {location.pathname}
          </span>
        </div>

        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          Похоже, ты попал на маршрут, которого нет в приложении.  
          Иногда это просто опечатка, а иногда — микросервис ещё не задеплоен
          в текущем окружении.
        </p>

        {/* быстрые подсказки */}
        <div
          style={{
            display: "grid",
            gap: 8,
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          <div>• Проверь адрес и регистр символов.</div>
          <div>• Убедись, что нужный сервис включён локально.</div>
          <div>• Если это staging — возможно, деплой ещё не завершён.</div>
        </div>

        {/* кнопки */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link to="/">
            <button className="btn-primary">На главную</button>
          </Link>

          <Link to="/catalog">
            <button className="btn-soft">Каталог</button>
          </Link>

          <Link to="/profile">
            <button className="btn-soft">Профиль</button>
          </Link>
        </div>
      </div>

      {/* маленький "инженерный" юмор */}
      <div
        style={{
          marginTop: 14,
          fontSize: 11,
          color: "var(--text-muted)",
          opacity: 0.9,
        }}
      >
        Если это должно существовать — возможно, ArgoCD ещё не успел сказать своё
        слово 😄
      </div>
    </PageContainer>
  );
}

export default NotFoundPage;