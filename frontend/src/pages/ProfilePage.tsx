import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../components/PageContainer";
import {
  getMe,
  updateMe,
  UserProfile,
  UpdateProfilePayload,
} from "../api/user";
import TwoFaPanel from "../components/TwoFaPanel";

type FormState = UpdateProfilePayload;

const FIELDS: Array<{
  key: keyof FormState;
  label: string;
  placeholder?: string;
  type?: "text" | "url";
  span?: 1 | 2;
}> = [
  { key: "displayName", label: "Display name", placeholder: "Как тебя показывать" },
  { key: "country", label: "Country", placeholder: "RU, FI, US..." },
  { key: "firstName", label: "First name", placeholder: "Имя" },
  { key: "lastName", label: "Last name", placeholder: "Фамилия" },
  { key: "language", label: "Language", placeholder: "ru, en..." },
  { key: "avatarUrl", label: "Avatar URL", placeholder: "https://...", type: "url" },
];

function ProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const normalize = (v: any) => v ?? "";

  const hydrateForm = useCallback((p: UserProfile) => {
    setForm({
      displayName: p.displayName ?? null,
      firstName: p.firstName ?? null,
      lastName: p.lastName ?? null,
      language: p.language ?? null,
      bio: p.bio ?? null,
      avatarUrl: p.avatarUrl ?? null,
      country: p.country ?? null,
    });
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data = await getMe();
      if (controller.signal.aborted) return;

      setProfile(data);
      hydrateForm(data);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setProfile(null);
      setError(e?.message ?? "Ошибка загрузки профиля");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [hydrateForm]);

  const resetChanges = useCallback(() => {
    if (profile) hydrateForm(profile);
    setError(null);
  }, [profile, hydrateForm]);

  const saveProfile = useCallback(async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);

    try {
      const payload: FormState = {
        displayName: form.displayName ?? null,
        firstName: form.firstName ?? null,
        lastName: form.lastName ?? null,
        language: form.language ?? null,
        bio: form.bio ?? null,
        avatarUrl: form.avatarUrl ?? null,
        country: form.country ?? null,
      };

      await updateMe(payload);

      // Перезагрузим профиль из API, чтобы показать именно "сохранённое"
      await loadProfile();

      // И отправим на read-only экран
      navigate("/profile/saved");
    } catch (e: any) {
      setError(e?.message ?? "Ошибка сохранения профиля");
    } finally {
      setSaving(false);
    }
  }, [profile, form, loadProfile, navigate]);

  useEffect(() => {
    loadProfile();
    return () => abortRef.current?.abort();
  }, [loadProfile]);

  const previewName = useMemo(
    () =>
      normalize(form.displayName) ||
      normalize(form.firstName) ||
      "Unnamed user",
    [form.displayName, form.firstName]
  );

  return (
    <div>

    
    <TwoFaPanel />
    <PageContainer
      title="Profile"
      subtitle="Данные берутся из user-service через API Gateway."
    >
      <div className="card-soft gp-panel">
        {/* STATUS */}
        {loading && <p className="gp-muted">Загружаю профиль...</p>}

        {error && <div className="gp-alert">{error}</div>}

        {/* ACTIONS */}
        <div className="gp-row">
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

        {/* CONTENT */}
        {!loading && profile && (
          <div className="gp-stack">
            <div className="card-soft gp-tech">
              <div className="gp-muted" style={{ marginBottom: 6 }}>
                Техническая информация
              </div>
              <div className="gp-tech-grid">
                <div><b>Profile id:</b> {profile.id}</div>
                <div><b>Auth user id:</b> {profile.authUserId}</div>
              </div>
            </div>

            <div className="gp-form-grid">
              {FIELDS.map((f) => (
                <label key={String(f.key)} className="gp-field">
                  <span className="gp-label">{f.label}</span>
                  <input
                    type={f.type ?? "text"}
                    value={normalize((form as any)[f.key])}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, [f.key]: e.target.value }))
                    }
                    placeholder={f.placeholder}
                  />
                </label>
              ))}
            </div>

            <label className="gp-field">
              <span className="gp-label">Bio</span>
              <textarea
                value={normalize(form.bio)}
                onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))}
                placeholder="Коротко о себе"
                rows={4}
              />
            </label>

            {/* PREVIEW */}
            <div className="card-soft gp-preview">
              <div className="gp-muted" style={{ marginBottom: 8 }}>
                Preview
              </div>
              <div className="gp-preview-row">
                <div className="gp-avatar">
                  {form.avatarUrl ? (
                    <img
                      src={form.avatarUrl}
                      alt="avatar"
                      onError={(e) =>
                        ((e.currentTarget as HTMLImageElement).style.display =
                          "none")
                      }
                    />
                  ) : (
                    <span>no avatar</span>
                  )}
                </div>

                <div>
                  <div className="gp-name">{previewName}</div>
                  <div className="gp-muted">
                    {[normalize(form.firstName), normalize(form.lastName)]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </div>
                  <div className="gp-muted">
                    {normalize(form.country) || "—"} •{" "}
                    {normalize(form.language) || "—"}
                  </div>
                </div>
              </div>

              {form.bio && <p className="gp-bio">{form.bio}</p>}
            </div>

            <div className="gp-row">
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

        {!loading && !profile && !error && (
          <p className="gp-muted">
            Профиль ещё не создан или нет доступа. Проверь логин.
          </p>
        )}
      </div>
    </PageContainer>
    </div>
  );
}

export default ProfilePage;