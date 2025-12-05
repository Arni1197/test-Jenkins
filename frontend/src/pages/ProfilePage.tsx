// src/pages/ProfilePage.tsx
import PageContainer from "../components/PageContainer";

function ProfilePage() {
  // TODO: подтягивать данные из user-service (/users/me)
  return (
    <PageContainer
      title="Profile"
      subtitle="Здесь будут данные из user-service."
    >
      <div className="card-soft">
        <p style={{ fontSize: 13, margin: 0, color: "var(--text-muted)" }}>
          Пока профиль заглушка. Следующий шаг — сделать запрос к твоему
          user-service по `/users/me` через API Gateway с токеном.
        </p>
      </div>
    </PageContainer>
  );
}

export default ProfilePage;