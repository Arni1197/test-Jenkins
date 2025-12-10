import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageContainer from "../components/PageContainer";
import { getMe, UserProfile } from "../api/user";

function ProfileSavedPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMe();
      setProfile(data);
    } catch (e: any) {
      setProfile(null);
      setError(e?.message ?? "Не удалось загрузить сохранённый профиль");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageContainer
      title="Profile saved"
      subtitle="Это состояние из базы данных после сохранения."
    >
      <div className="card-soft" style={{ display: "grid", gap: 12 }}>
        {loading && <div className="gp-muted">Загружаю...</div>}
        {error && <div className="gp-alert">{error}</div>}

        {!loading && profile && (
          <div className="card-soft">
            <div className="gp-muted" style={{ marginBottom: 8 }}>
              Данные из БД
            </div>

            <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
              <div><b>Profile id:</b> {profile.id}</div>
              <div><b>Auth user id:</b> {profile.authUserId}</div>
              <div><b>Display name:</b> {profile.displayName ?? "—"}</div>
              <div><b>First name:</b> {profile.firstName ?? "—"}</div>
              <div><b>Last name:</b> {profile.lastName ?? "—"}</div>
              <div><b>Language:</b> {profile.language ?? "—"}</div>
              <div><b>Country:</b> {profile.country ?? "—"}</div>
              <div><b>Avatar URL:</b> {profile.avatarUrl ?? "—"}</div>
              <div><b>Bio:</b> {profile.bio ?? "—"}</div>
              <div><b>Created at:</b> {profile.createdAt ?? "—"}</div>
              <div><b>Updated at:</b> {profile.updatedAt ?? "—"}</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn-soft" onClick={load} type="button">
            Обновить из БД
          </button>
          <Link to="/profile">
            <button className="btn-soft" type="button">
              Редактировать
            </button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}

export default ProfileSavedPage;