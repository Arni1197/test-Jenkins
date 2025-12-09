// src/pages/ProfilePage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import PageContainer from "../components/PageContainer";

// Тип под твой UserProfile из user-service
type UserProfile = {
  id: string;
  authUserId: string; // либо userId — если ты переименовал (см. ниже)
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  language?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

// DTO для PATCH
type UpdateUserProfileDto = {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  language?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
};

function ProfilePage() {
  // ✅ База API через Gateway
  // Если CRA: REACT_APP_API_BASE_URL
  // Пример: REACT_APP_API_BASE_URL=http://localhost:8081/api
  const apiBase = useMemo(() => {
    const envBase =
      (process.env.REACT_APP_API_BASE_URL as string | undefined) ?? "";
    return envBase.trim() || "http://localhost:8081/api";
  }, []);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<UpdateUserProfileDto>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // --- helpers ---
  function normalize(v: any) {
    // Чтобы инпуты не ловили undefined
    return v ?? "";
  }

  function hydrateForm(p: UserProfile) {
    setForm({
      displayName: p.displayName ?? null,
      firstName: (p as any).firstName ?? null,
      lastName: (p as any).lastName ?? null,
      language: (p as any).language ?? null,
      bio: (p as any).bio ?? null,
      avatarUrl: p.avatarUrl ?? null,
      country: p.country ?? null,
    });
  }

  async function loadProfile() {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${apiBase}/users/me`, {
        method: "GET",
        credentials: "include",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `Не удалось загрузить профиль (${res.status}). ${txt}`
        );
      }

      const data = (await res.json()) as UserProfile;

      // ✅ Если у тебя поле называется userId, а не authUserId
      // можешь оставить это как мягкую совместимость:
      if (!(data as any).authUserId && (data as any).userId) {
        (data as any).authUserId = (data as any).userId;
      }

      setProfile(data);
      hydrateForm(data);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message ?? "Ошибка загрузки профиля");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 💡 отправляем только те поля, которые реально есть в форме
      const payload: UpdateUserProfileDto = {
        displayName: form.displayName ?? null,
        firstName: form.firstName ?? null,
        lastName: form.lastName ?? null,
        language: form.language ?? null,
        bio: form.bio ?? null,
        avatarUrl: form.avatarUrl ?? null,
        country: form.country ?? null,
      };

      const res = await fetch(`${apiBase}/users/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `Не удалось сохранить профиль (${res.status}). ${txt}`
        );
      }

      const updated = (await res.json()) as UserProfile;

      if (!(updated as any).authUserId && (updated as any).userId) {
        (updated as any).authUserId = (updated as any).userId;
      }

      setProfile(updated);
      hydrateForm(updated);
      setSuccessMsg("Профиль обновлён ✅");
    } catch (e: any) {
      setError(e?.message ?? "Ошибка сохранения профиля");
    } finally {
      setSaving(false);
    }
  }

  function resetChanges() {
    if (!profile) return;
    hydrateForm(profile);
    setSuccessMsg(null);
    setError(null);
  }

  useEffect(() => {
    loadProfile();

    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  // --- UI ---
  return (
    <PageContainer
      title="Profile"
      subtitle="Данные берутся из user-service через API Gateway."
    >
      <div className="card-soft" style={{ display: "grid", gap: 14 }}>
        {/* Статусы */}
        {loading && (
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
            Загружаю профиль...
          </p>
        )}

        {error && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255,0,0,0.06)",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(0,128,0,0.08)",
              fontSize: 13,
            }}
          >
            {successMsg}
          </div>
        )}

        {/* Кнопка перезагрузки */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="btn-soft"
            onClick={loadProfile}
            disabled={loading || saving}
            type="button"
          >
            Обновить
          </button>

          <button
            className="btn-soft"
            onClick={resetChanges}
            disabled={!profile || loading || saving}
            type="button"
          >
            Сбросить изменения
          </button>
        </div>

        {/* Форма */}
        {!loading && profile && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 16,
            }}
          >
            {/* Блок идентификации */}
            <div className="card-soft">
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                Техническая информация
              </p>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                <div>
                  <b>Profile id:</b> {profile.id}
                </div>
                <div>
                  <b>Auth user id:</b> {(profile as any).authUserId}
                </div>
              </div>
            </div>

            {/* Основные поля */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Display name
                </span>
                <input
                  value={normalize(form.displayName)}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, displayName: e.target.value }))
                  }
                  placeholder="Как тебя показывать в UI"
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Country
                </span>
                <input
                  value={normalize(form.country)}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, country: e.target.value }))
                  }
                  placeholder="RU, FI, US..."
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  First name
                </span>
                <input
                  value={normalize(form.firstName)}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, firstName: e.target.value }))
                  }
                  placeholder="Имя"
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Last name
                </span>
                <input
                  value={normalize(form.lastName)}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, lastName: e.target.value }))
                  }
                  placeholder="Фамилия"
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Language
                </span>
                <input
                  value={normalize(form.language)}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, language: e.target.value }))
                  }
                  placeholder="ru, en..."
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Avatar URL
                </span>
                <input
                  value={normalize(form.avatarUrl)}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, avatarUrl: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </label>
            </div>

            {/* Bio */}
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Bio
              </span>
              <textarea
                value={normalize(form.bio)}
                onChange={(e) =>
                  setForm((s) => ({ ...s, bio: e.target.value }))
                }
                placeholder="Коротко о себе"
                rows={4}
              />
            </label>

            {/* Preview */}
            <div className="card-soft">
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                Preview
              </p>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.06)",
                    overflow: "hidden",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 10,
                    color: "var(--text-muted)",
                  }}
                >
                  {form.avatarUrl ? (
                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                    <img
                      src={form.avatarUrl}
                      alt="avatar"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  ) : (
                    "no avatar"
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {normalize(form.displayName) ||
                      normalize(form.firstName) ||
                      "Unnamed user"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {[
                      normalize(form.firstName),
                      normalize(form.lastName),
                    ].filter(Boolean).join(" ") || "—"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {normalize(form.country) || "—"} •{" "}
                    {normalize(form.language) || "—"}
                  </div>
                </div>
              </div>

              {form.bio && (
                <p style={{ margin: "10px 0 0 0", fontSize: 12 }}>
                  {form.bio}
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn-primary"
                onClick={saveProfile}
                disabled={saving || loading}
                type="button"
              >
                {saving ? "Сохраняю..." : "Сохранить"}
              </button>
            </div>
          </div>
        )}

        {/* Если профиль не пришёл */}
        {!loading && !profile && !error && (
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
            Профиль ещё не создан или нет доступа. Проверь логин и cookie.
          </p>
        )}
      </div>
    </PageContainer>
  );
}

export default ProfilePage;