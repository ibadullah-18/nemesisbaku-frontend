import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiKey,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiSend,
  FiShield,
} from "react-icons/fi";
import AppLoader from "../../components/common/AppLoader";
import { profileApi } from "../../api/profileApi";
import { useLanguage } from "../../i18n/LanguageContext";
import { createPortal } from "react-dom";

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

export default function SecuritySettingsPage() {
  const navigate = useNavigate();
  const { text } = useLanguage();

  const [profile, setProfile] = useState(null);

  const [emailStep, setEmailStep] = useState(0);
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    code: "",
  });
  const [emailResendSeconds, setEmailResendSeconds] = useState(0);

  const [passStep, setPassStep] = useState(0);
  const [passForm, setPassForm] = useState({
    code: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passResendSeconds, setPassResendSeconds] = useState(0);

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("error");
  const [toastVisible, setToastVisible] = useState(false);

  const toastTimer = useRef(null);
  const toastCloseTimer = useRef(null);
  const toastStartTimer = useRef(null);

  useEffect(() => {
    loadProfile();

    return () => {
      clearTimeout(toastTimer.current);
      clearTimeout(toastCloseTimer.current);
      clearTimeout(toastStartTimer.current);
    };
  }, []);

  useEffect(() => {
    if (emailResendSeconds <= 0) return;

    const timer = setInterval(() => {
      setEmailResendSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [emailResendSeconds]);

  useEffect(() => {
    if (passResendSeconds <= 0) return;

    const timer = setInterval(() => {
      setPassResendSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [passResendSeconds]);

  function showToast(message, type = "error") {
    clearTimeout(toastTimer.current);
    clearTimeout(toastCloseTimer.current);
    clearTimeout(toastStartTimer.current);

    setToastVisible(false);
    setToastType(type);
    setToast(message);

    toastStartTimer.current = setTimeout(() => setToastVisible(true), 20);

    toastTimer.current = setTimeout(() => {
      setToastVisible(false);
      toastCloseTimer.current = setTimeout(() => setToast(""), 300);
    }, 5000);
  }

  function getCleanError(err, fallback) {
    const message = err?.message;

    if (
      !message ||
      message === "Əməliyyat uğursuz oldu" ||
      message === "Unauthorized" ||
      message === "Unauthorized." ||
      message === "Serverlə əlaqə qurulmadı."
    ) {
      return fallback;
    }

    return message;
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  async function loadProfile() {
    try {
      setLoading(true);
      const res = await profileApi.get();
      const data = unwrap(res);
      setProfile(data);
    } catch (err) {
      showToast(err.message || text.profileLoadError || "Profil yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  async function sendChangeEmailOtp() {
    if (!isValidEmail(emailForm.newEmail)) {
      showToast(text.emailRequired || "Düzgün email daxil edilməlidir.");
      return;
    }

    try {
      setSaving(true);

      await profileApi.sendChangeEmailOtp(emailForm.newEmail.trim());

      setEmailStep(1);
      setEmailResendSeconds(60);
      showToast(
        text.otpSent || "Təsdiq kodu email ünvanınıza göndərildi.",
        "success"
      );
    } catch (err) {
      showToast(
        getCleanError(
          err,
          text.otpSendError || "OTP kodu göndərilərkən xəta baş verdi."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function resendEmailOtp() {
    if (emailResendSeconds > 0 || saving) return;
    await sendChangeEmailOtp();
  }

  async function verifyChangeEmail() {
    if (!isValidEmail(emailForm.newEmail) || emailForm.code.trim().length !== 6) {
      showToast(text.otpRequired || "6 rəqəmli OTP kodunu daxil edin.");
      return;
    }

    try {
      setSaving(true);

      await profileApi.verifyChangeEmail(
        emailForm.newEmail.trim(),
        emailForm.code.trim()
      );

      showToast(text.emailChanged || "Email uğurla dəyişdirildi.", "success");

      setEmailForm({ newEmail: "", code: "" });
      setEmailStep(0);
      setEmailResendSeconds(0);

      await loadProfile();
      window.dispatchEvent(new Event("nemesis_auth_changed"));
    } catch (err) {
      showToast(
        getCleanError(
          err,
          text.emailVerifyError || "Email təsdiqi zamanı xəta baş verdi."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function sendPasswordOtp() {
    if (!profile?.email) {
      showToast(text.emailNotFound || "Profil emaili tapılmadı.");
      return;
    }

    try {
      setSaving(true);

      await profileApi.sendForgotPasswordOtp(profile.email);

      setPassStep(1);
      setPassResendSeconds(60);
      showToast(
        text.otpSent || "Təsdiq kodu email ünvanınıza göndərildi.",
        "success"
      );
    } catch (err) {
      showToast(
        getCleanError(
          err,
          text.otpSendError || "OTP kodu göndərilərkən xəta baş verdi."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function resendPasswordOtp() {
    if (passResendSeconds > 0 || saving) return;
    await sendPasswordOtp();
  }

  async function resetPassword(e) {
    e.preventDefault();

    if (passForm.code.trim().length !== 6) {
      showToast(text.otpRequired || "6 rəqəmli OTP kodunu daxil edin.");
      return;
    }

    if (passForm.newPassword.trim().length < 6) {
      showToast(text.passwordMinError || "Şifrə minimum 6 simvol olmalıdır.");
      return;
    }

    if (passForm.newPassword !== passForm.confirmNewPassword) {
      showToast(text.passwordsNotSame || "Şifrələr eyni deyil.");
      return;
    }

    try {
      setSaving(true);

      await profileApi.resetPasswordWithOtp({
        email: profile?.email,
        code: passForm.code.trim(),
        newPassword: passForm.newPassword,
        confirmNewPassword: passForm.confirmNewPassword,
      });

      showToast(text.passwordChanged || "Şifrə uğurla dəyişdirildi.", "success");

      setPassForm({
        code: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setPassStep(0);
      setPassResendSeconds(0);
    } catch (err) {
      showToast(
        getCleanError(
          err,
          text.passwordChangeError || "Şifrə dəyişdirilərkən xəta baş verdi."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppLoader text={text.loading} />;

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-6 md:px-8 md:py-8">
      {saving && <AppLoader text={text.saving} />}

{toast &&
  createPortal(
    <div
      className={`fixed bottom-5 left-5 z-[999999] w-[calc(100vw-40px)] max-w-[380px] rounded-[14px] px-4 py-3 text-sm font-medium text-white shadow-[0_16px_50px_rgba(0,0,0,0.18)] transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] md:bottom-6 md:left-6 md:w-auto md:min-w-[300px] ${
        toastType === "success" ? "bg-green-600" : "bg-red-600"
      } ${
        toastVisible
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-5 scale-95 opacity-0"
      }`}
    >
      {toast}
    </div>,
    document.body
  )}

      <div className="mx-auto max-w-[920px]">
        <TopBar
          title={text.security}
          onBack={() => navigate("/profile/settings")}
        />

        <section className="mt-7 animate-[securityUp_.42s_cubic-bezier(.22,1,.36,1)_both] rounded-[24px] bg-zinc-950 p-6 text-white shadow-[0_22px_70px_rgba(0,0,0,0.12)] md:p-8">
          <p className="text-[15px] font-medium tracking-[0.17em] text-white/45">
            nemesisbaku
          </p>
          <h1 className="mt-3 text-[34px] font-medium tracking-[-0.055em] md:text-[52px]">
            {text.security}
          </h1>
          <p className="mt-3 max-w-[560px] text-sm leading-6 text-white/55">
            {text.securityDesc}
          </p>
        </section>

        <section className="mt-5 grid gap-5">
          <Card icon={<FiMail />} title={text.changeEmail || "Email dəyiş"}>
            <div className="mb-4 rounded-[16px] border border-zinc-100 bg-zinc-50 p-4 text-sm leading-6 text-zinc-500">
              {text.currentEmail || "Hazırki email"}:{" "}
              <span className="font-bold text-zinc-950">
                {profile?.email || "-"}
              </span>
            </div>

            {emailStep === 0 ? (
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <Input
                  label={text.newEmail || "Yeni email"}
                  value={emailForm.newEmail}
                  onChange={(v) =>
                    setEmailForm((p) => ({ ...p, newEmail: v }))
                  }
                  type="email"
                />

                <button
                  type="button"
                  onClick={sendChangeEmailOtp}
                  className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-zinc-950 px-5 text-sm font-medium text-white transition active:scale-[0.98]"
                >
                  <FiSend />
                  {text.sendOtp || "OTP göndər"}
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                <Input
                  label={text.otpCode || "OTP kodu"}
                  value={emailForm.code}
                  onChange={(v) =>
                    setEmailForm((p) => ({
                      ...p,
                      code: v.replace(/\D/g, "").slice(0, 6),
                    }))
                  }
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={resendEmailOtp}
                    disabled={emailResendSeconds > 0 || saving}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-950 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiRefreshCw />
                    {emailResendSeconds > 0
                      ? `${text.resendOtpIn || "Yenidən göndər"} (${emailResendSeconds}s)`
                      : text.resendOtp || "OTP-ni yenidən göndər"}
                  </button>

                  <button
                    type="button"
                    onClick={verifyChangeEmail}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-zinc-950 px-5 text-sm font-medium text-white transition active:scale-[0.98]"
                  >
                    <FiCheck />
                    {text.confirm || "Təsdiqlə"}
                  </button>
                </div>
              </div>
            )}
          </Card>

          <Card icon={<FiKey />} title={text.changePassword}>
            <div className="mb-4 rounded-[16px] border border-zinc-100 bg-zinc-50 p-4 text-sm leading-6 text-zinc-500">
              {text.passwordOtpInfo ||
                "Şifrəni dəyişmək üçün profil emailinizə OTP kod göndəriləcək."}{" "}
              <span className="font-bold text-zinc-950">
                {profile?.email || "-"}
              </span>
            </div>

            {passStep === 0 ? (
              <button
                type="button"
                onClick={sendPasswordOtp}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-zinc-950 px-5 text-sm font-medium text-white transition active:scale-[0.98]"
              >
                <FiSend />
                {text.sendOtp || "OTP göndər"}
              </button>
            ) : (
              <form onSubmit={resetPassword} className="grid gap-4 md:grid-cols-2">
                <Input
                  label={text.otpCode || "OTP kodu"}
                  value={passForm.code}
                  onChange={(v) =>
                    setPassForm((p) => ({
                      ...p,
                      code: v.replace(/\D/g, "").slice(0, 6),
                    }))
                  }
                />

                <button
                  type="button"
                  onClick={resendPasswordOtp}
                  disabled={passResendSeconds > 0 || saving}
                  className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-[14px] border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-950 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiRefreshCw />
                  {passResendSeconds > 0
                    ? `${text.resendOtpIn || "Yenidən göndər"} (${passResendSeconds}s)`
                    : text.resendOtp || "OTP-ni yenidən göndər"}
                </button>

                <PasswordInput
                  label={text.newPassword}
                  value={passForm.newPassword}
                  onChange={(v) =>
                    setPassForm((p) => ({ ...p, newPassword: v }))
                  }
                  show={showPass}
                  onToggle={() => setShowPass((p) => !p)}
                />

                <PasswordInput
                  label={text.confirmNewPassword}
                  value={passForm.confirmNewPassword}
                  onChange={(v) =>
                    setPassForm((p) => ({
                      ...p,
                      confirmNewPassword: v,
                    }))
                  }
                  show={showConfirmPass}
                  onToggle={() => setShowConfirmPass((p) => !p)}
                />

                <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-zinc-950 px-5 text-sm font-medium text-white transition active:scale-[0.98] md:col-span-2 md:w-max">
                  <FiShield />
                  {text.changePassword}
                </button>
              </form>
            )}
          </Card>
        </section>
      </div>

      <style>{`
        @keyframes securityUp {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </main>
  );
}

function TopBar({ title, onBack }) {
  return (
    <header className="grid grid-cols-[44px_1fr_44px] items-center">
      <button
        type="button"
        onClick={onBack}
        className="grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950 shadow-sm transition active:scale-95"
      >
        <FiArrowLeft />
      </button>
      <div className="text-center">
        <p className="text-[15px] font-medium tracking-[0.17em] text-zinc-400">
          nemesisbaku
        </p>
        <h1 className="mt-1 text-lg font-medium tracking-[-0.025em] text-zinc-950">
          {title}
        </h1>
      </div>
      <div />
    </header>
  );
}

function Card({ icon, title, children }) {
  return (
    <section className="rounded-[22px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-[15px] bg-zinc-50 text-xl text-zinc-950">
          {icon}
        </div>
        <h2 className="text-xl font-medium tracking-[-0.03em] text-zinc-950">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-800">
        {label}
      </span>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-[15px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 outline-none transition focus:border-zinc-400"
      />
    </label>
  );
}

function PasswordInput({ label, value, onChange, show, onToggle }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-800">
        {label}
      </span>

      <div className="flex h-12 items-center rounded-[15px] border border-zinc-100 bg-zinc-50 px-4 transition focus-within:border-zinc-400">
        <FiLock className="mr-3 shrink-0 text-zinc-400" />
        <input
          type={show ? "text" : "password"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-zinc-950 outline-none"
        />

        {value?.length > 0 && (
          <button
            type="button"
            onClick={onToggle}
            className="ml-3 shrink-0 text-lg text-zinc-500 transition hover:text-zinc-950"
          >
            {show ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>
    </label>
  );
}