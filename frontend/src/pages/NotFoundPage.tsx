// src/pages/NotFoundPage.tsx
import { Link } from "react-router-dom";
import PageContainer from "../components/PageContainer";

function NotFoundPage() {
  return (
    <PageContainer
      title="404"
      subtitle="Страница не найдена. Возможно, микросервис ещё не задеплоен 🙂"
    >
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
        Проверь URL или вернись на главную.
      </p>
      <Link to="/">
        <button className="button-primary">На главную</button>
      </Link>
    </PageContainer>
  );
}

export default NotFoundPage;