import { useCallback, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

// ⚠️ Подстрой импорт под твой проект:
// если у тебя уже есть общий клиент — используй его.
import { apiFetch } from "../api/client";

type TwoFaSetupResponse = {
  otpauthUrl: string;
  secret: string;
};

export default function TwoFaPanel() {
  const [setupData, setSetupData] = useState<TwoFaSetupResponse | null>(null);
  const [code, setCode] = useState("");
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [loadingEnable, setLoadingEnable] = useState(false);
  const [loadingDisable, setLoadingDisable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const codeIsValid = useMemo(() => /^\d{6}$/.test(code.trim()), [code]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSetup = useCallback(async () => {
    clearMessages();
    setLoadingSetup(true);

    try {
      const data = await apiFetch<TwoFaSetupResponse>("/auth/2fa/setup", {
        method: "POST",
      });

      setSetupData(data);
      setSuccess("Секрет создан ✅ Сканируй QR в Authenticator.");
      setCode("");
    } catch (e: any) {
      setError(e?.message ?? "Ошибка при создании 2FA секрета");
    } finally {
      setLoadingSetup(false);
    }
  }, []);

  const handleEnable = useCallback(async () => {
    clearMessages();

    if (!codeIsValid) {
      setError("Код должен быть 6 цифр");
      return;
    }

    setLoadingEnable(true);

    try {
        await apiFetch("/auth/2fa/enable", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code: code.trim() }),
          });

      setSuccess("2FA включена ✅ Теперь при логине нужен код.");
      // логично оставить setupData, но можно очистить:
      // setSetupData(null);
      setCode("");
    } catch (e: any) {
      setError(e?.message ?? "Ошибка включения 2FA");
    } finally {
      setLoadingEnable(false);
    }
  }, [code, codeIsValid]);

  const handleDisable = useCallback(async () => {
    clearMessages();

    if (!codeIsValid) {
      setError("Код должен быть 6 цифр");
      return;
    }

    setLoadingDisable(true);

    try {
        await apiFetch("/auth/2fa/disable", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code: code.trim() }),
          });

      setSuccess("2FA отключена ✅");
      setSetupData(null);
      setCode("");
    } catch (e: any) {
      setError(e?.message ?? "Ошибка отключения 2FA");
    } finally {
      setLoadingDisable(false);
    }
  }, [code, codeIsValid]);

  return (
    <div className="card-soft" style={{ display: "grid", gap: 12 }}>
      {/* Header */}
      <div
        className="gp-row"
        style={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <div>
          <div style={{ fontWeight: 600 }}>Two-Factor Auth</div>
          <div className="gp-muted">TOTP через Authenticator-приложение.</div>
        </div>

        <button
          className="btn-soft"
          onClick={handleSetup}
          disabled={loadingSetup || loadingEnable || loadingDisable}
          type="button"
        >
          {loadingSetup ? "Creating..." : "Setup"}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.22)",
            fontSize: 12,
          }}
        >
          {success}
        </div>
      )}

      {/* Setup data block */}
      {setupData && (
        <div className="card-soft" style={{ display: "grid", gap: 10 }}>
          <div className="gp-muted">
            Секрет создан. Отсканируй QR или вставь ключ вручную.
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Белая подложка для читаемости QR на тёмной теме */}
            <div
              style={{
                background: "white",
                padding: 10,
                borderRadius: 12,
              }}
            >
              <QRCodeCanvas
                value={setupData.otpauthUrl}
                size={160}
                includeMargin
              />
            </div>

            <div style={{ fontSize: 12, maxWidth: 520 }}>
              <div className="gp-muted" style={{ marginBottom: 6 }}>
                otpauthUrl
              </div>
              <div style={{ wordBreak: "break-all", opacity: 0.9 }}>
                {setupData.otpauthUrl}
              </div>

              <div className="gp-muted" style={{ margin: "10px 0 6px" }}>
                Secret (если вводишь вручную)
              </div>
              <div style={{ fontWeight: 600, wordBreak: "break-all" }}>
                {setupData.secret}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code input */}
      <label style={{ display: "grid", gap: 6 }}>
        <span className="gp-muted">Code from Authenticator</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          inputMode="numeric"
          maxLength={6}
          style={{
            letterSpacing: "0.12em",
          }}
        />
      </label>

      {/* Actions */}
      <div className="gp-row">
        <button
          className="btn-primary"
          onClick={handleEnable}
          disabled={!codeIsValid || loadingEnable || loadingSetup || loadingDisable}
          type="button"
        >
          {loadingEnable ? "Enabling..." : "Enable"}
        </button>

        <button
          className="btn-soft"
          onClick={handleDisable}
          disabled={!codeIsValid || loadingDisable || loadingSetup || loadingEnable}
          type="button"
        >
          {loadingDisable ? "Disabling..." : "Disable"}
        </button>
      </div>
    </div>
  );
}