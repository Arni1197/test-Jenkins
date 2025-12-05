// src/pages/HomePage.tsx
import { Link } from "react-router-dom";
import PageContainer from "../components/PageContainer";

function HomePage() {
  return (
    <PageContainer
      title="Welcome to Game Project"
      subtitle="Microservices • Kubernetes • DevOps playground"
    >
      <div
        style={{
          display: "grid",
          gap: 18,
        }}
      >
        <div
          style={{
            padding: 16,
            borderRadius: 18,
            background: "var(--accent-soft)",
            border: "1px solid rgba(129,140,248,0.5)",
          }}
        >
          <div style={{ fontSize: 14, marginBottom: 6 }}>
            Тренируешься: Auth, User, Catalog, Order, K8s, ArgoCD.
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 10,
            }}
          >
            Этот фронт — просто аккуратная витрина, чтобы удобно ходить по
            микросервисам.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link to="/catalog">
              <button className="button-primary">Открыть каталог</button>
            </Link>
            <Link to="/profile">
              <button className="button-ghost">Личный кабинет</button>
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default HomePage;