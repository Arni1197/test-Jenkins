import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { twoFaDisable, twoFaEnable, twoFaSetup } from "../api/auth";
import { useAuth } from "../api/AuthContext";
import "./TwoFaPanel.css";

type TwoFaSetupResponse = {
  otpauthUrl: string;
  secret: string;
};

export default function TwoFaPanel() {
  const { user, refreshAuth } = useAuth();

  const [twoFaEnabled, setTwoFaEnabled] = useState<boolean>(
    !!user?.twoFactorEnabled
  );

  const [setupData, setSetupData] = useState<TwoFaSetupResponse | null>(null);
  const [code, setCode] = useState("");

  const [loadingSetup, setLoadingSetup] = useState(false);
  const [loadingEnable, setLoadingEnable] = useState(false);
  const [loadingDisable, setLoadingDisable] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // синхронизируем локальный статус при изменении user
  useEffect(() => {
    if (typeof user?.twoFactorEnabled === "boolean") {
      setTwoFaEnabled(user.twoFactorEnabled);
    }
  }, [user?.twoFactorEnabled]);

  const codeIsValid = useMemo(() => /^\d{6}$/.test(code.trim()), [code]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSetup = useCallback(async () => {
    clearMessages();
    setLoadingSetup(true);

    try {
      const data = await twoFaSetup();
      setSetupData(data);
      setSuccess("Секрет создан ✅ Отсканируй QR в Authenticator.");
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
      await twoFaEnable(code.trim());

      // ✅ оптимистично
      setTwoFaEnabled(true);
      setSuccess("2FA включена ✅ Теперь при логине нужен код.");
      setCode("");

      await refreshAuth().catch(() => {});
    } catch (e: any) {
      setError(e?.message ?? "Ошибка включения 2FA");
    } finally {
      setLoadingEnable(false);
    }
  }, [code, codeIsValid, refreshAuth]);

  const handleDisable = useCallback(async () => {
    clearMessages();

    if (!codeIsValid) {
      setError("Код должен быть 6 цифр");
      return;
    }

    setLoadingDisable(true);

    try {
      await twoFaDisable(code.trim());

      // ✅ оптимистично
      setTwoFaEnabled(false);
      setSuccess("2FA отключена ✅");
      setSetupData(null);
      setCode("");

      await refreshAuth().catch(() => {});
    } catch (e: any) {
      setError(e?.message ?? "Ошибка отключения 2FA");
    } finally {
      setLoadingDisable(false);
    }
  }, [code, codeIsValid, refreshAuth]);

  const isBusy = loadingSetup || loadingEnable || loadingDisable;

  return (
    <section className="card-soft twofa">
      {/* Header */}
      <div className="twofa__header">
        <div className="twofa__titleBlock">
          <div className="twofa__title">Two-Factor Authentication</div>
          <div className="gp-muted twofa__subtitle">
            TOTP через Authenticator (Google Authenticator, Authy и т.д.).
          </div>
        </div>

        <div className="twofa__actions">
          <span className={`pill twofa__pill ${twoFaEnabled ? "is-on" : "is-off"}`}>
            {twoFaEnabled ? "2FA ON ✅" : "2FA OFF"}
          </span>

          <button
            className="btn-soft twofa__btn"
            onClick={handleSetup}
            disabled={isBusy}
            type="button"
            title="Create new secret"
          >
            {loadingSetup ? "Creating secret..." : setupData ? "Recreate secret" : "Create secret"}
          </button>
        </div>
      </div>

      {/* Info line */}
      <div className="gp-muted twofa__info">
        {twoFaEnabled
          ? "2FA активна. При следующем логине потребуется код."
          : "2FA выключена. Создай секрет и подтверди кодом, чтобы включить защиту."}
      </div>

      {/* Alerts */}
      {error && <div className="twofa__alert twofa__alert--error">{error}</div>}
      {success && <div className="twofa__alert twofa__alert--success">{success}</div>}

      {/* Setup data block */}
      {setupData && (
        <div className="card-soft twofa__setup">
          <div className="gp-muted twofa__setupHint">
            Секрет создан. Отсканируй QR или введи ключ вручную.
          </div>

          <div className="twofa__setupGrid">
            {/* QR */}
            <div className="twofa__qrWrap" aria-label="QR code">
              <QRCodeCanvas value={setupData.otpauthUrl} size={160} includeMargin />
            </div>

            {/* Text */}
            <div className="twofa__setupText">
              <div className="twofa__monoLabel">otpauthUrl</div>
              <div className="twofa__monoValue">{setupData.otpauthUrl}</div>

              <div className="twofa__monoLabel" style={{ marginTop: 10 }}>
                Secret (manual entry)
              </div>
              <div className="twofa__secret">{setupData.secret}</div>
            </div>
          </div>
        </div>
      )}

      {/* Code input */}
      <label className="twofa__code">
        <span className="gp-muted twofa__codeLabel">Authenticator code</span>
        <input
          className="input twofa__codeInput"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          inputMode="numeric"
          maxLength={6}
        />
      </label>

      {/* Actions */}
      <div className="twofa__footer">
        <button
          className="btn-primary twofa__btn"
          onClick={handleEnable}
          disabled={!codeIsValid || isBusy || twoFaEnabled}
          type="button"
        >
          {loadingEnable ? "Turning on..." : "Turn on 2FA"}
        </button>

        <button
          className="btn-soft twofa__btn"
          onClick={handleDisable}
          disabled={!codeIsValid || isBusy || !twoFaEnabled}
          type="button"
        >
          {loadingDisable ? "Turning off..." : "Turn off 2FA"}
        </button>
      </div>
    </section>
  );
}