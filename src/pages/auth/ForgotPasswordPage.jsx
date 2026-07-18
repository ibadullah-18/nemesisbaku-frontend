import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiClock,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";
import { apiFetch } from "../../api/apiFetch";
import { useLanguage } from "../../i18n/LanguageContext";
import AppLoader from "../../components/common/AppLoader";
import AnimatedInput from "../../components/common/AnimatedInput";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { text } = useLanguage();

  const [store, setStore] = useState(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState("next");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [resendSeconds, setResendSeconds] = useState(0);

  const [toastError, setToastError] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const toastTimerRef = useRef(null);
  const toastCloseTimerRef = useRef(null);
  const toastStartTimerRef = useRef(null);

  useEffect(() => {
    loadStoreInfo();

    return () => {
      clearTimeout(toastTimerRef.current);
      clearTimeout(toastCloseTimerRef.current);
      clearTimeout(toastStartTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = setInterval(() => {
      setResendSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendSeconds]);

  async function loadStoreInfo() {
    try {
      setStoreLoading(true);
      const res = await apiFetch("/api/StoreInfo");
      setStore(res?.data || null);
    } catch {
      setStore(null);
    } finally {
      setStoreLoading(false);
    }
  }

  function showToast(message) {
    clearTimeout(toastTimerRef.current);
    clearTimeout(toastCloseTimerRef.current);
    clearTimeout(toastStartTimerRef.current);

    setToastVisible(false);
    setToastError(message);

    toastStartTimerRef.current = setTimeout(() => {
      setToastVisible(true);
    }, 20);

    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);

      toastCloseTimerRef.current = setTimeout(() => {
        setToastError("");
      }, 300);
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
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  async function sendOtp() {
    if (!isValidEmail(email)) {
      showToast(text.emailRequired || "Düzgün email daxil edilməlidir.");
      return false;
    }

    try {
      setLoading(true);

      await apiFetch(
        "/api/Auth/send-forgot-password-otp",
        {
          method: "POST",
          body: JSON.stringify({
            email: email.trim(),
          }),
        },
        false,
      );

      setResendSeconds(60);
      return true;
    } catch (err) {
      showToast(
        getCleanError(
          err,
          text.forgotEmailNotFound ||
            "Bu email ilə qeydiyyatdan keçmiş hesab tapılmadı.",
        ),
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (resendSeconds > 0 || loading) return;
    await sendOtp();
  }

  async function nextStep() {
    if (step === 0) {
      const sent = await sendOtp();
      if (!sent) return;

      setDirection("next");
      setStep(1);
      return;
    }

    if (step === 1) {
      if (code.trim().length !== 6) {
        showToast(text.otpRequired || "6 rəqəmli OTP kodunu daxil edin.");
        return;
      }

      setDirection("next");
      setStep(2);
    }
  }

  function prevStep() {
    if (step > 0) {
      setDirection("prev");
      setStep((prev) => prev - 1);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (newPassword.trim().length < 6) {
      showToast(text.passwordMinError || "Şifrə minimum 6 simvol olmalıdır.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast(text.passwordsNotSame || "Şifrələr eyni deyil.");
      return;
    }

    if (code.trim().length !== 6) {
      showToast(text.otpRequired || "6 rəqəmli OTP kodunu daxil edin.");
      setStep(1);
      return;
    }

    try {
      setLoading(true);

      await apiFetch(
        "/api/Auth/reset-password-with-otp",
        {
          method: "POST",
          body: JSON.stringify({
            email: email.trim(),
            code: code.trim(),
            newPassword,
            confirmNewPassword,
          }),
        },
        false,
      );

      navigate("/login", { replace: true });
    } catch (err) {
      showToast(
        getCleanError(
          err,
          text.resetPasswordError ||
            "Şifrə yenilənərkən xəta baş verdi. OTP kodunu yoxlayın.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  const brandName = store?.storeName || "nemesisbaku";

  function BrandLogo() {
    return (
      <div className="flex h-[82px] w-[290px] max-w-full items-center justify-center overflow-hidden rounded-[18px] bg-white px-6">
        {store?.logoUrl ? (
          <img
            src={store.logoUrl}
            alt={brandName}
            className="block h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <span className="text-[34px] font-black tracking-[-0.06em] text-zinc-950">
            nemesisbaku
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes forgotStepNext {
            from { opacity: 0; transform: translateX(24px) scale(.985); filter: blur(4px); }
            to { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
          }

          @keyframes forgotStepPrev {
            from { opacity: 0; transform: translateX(-24px) scale(.985); filter: blur(4px); }
            to { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
          }

          @keyframes forgotCardIn {
            from { opacity: 0; transform: translateY(18px) scale(.985); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes forgotHeroIn {
            from { opacity: 0; transform: translateY(18px); filter: blur(4px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
          }
        `}
      </style>

      <main className="min-h-screen bg-[#f5f3f5] px-4 py-6 md:px-6 lg:flex lg:items-center lg:justify-center">
        {(loading || storeLoading) && (
          <AppLoader
            text={
              loading ? text.loading || "Yüklənir" : text.loading || "Yüklənir"
            }
          />
        )}

        {toastError &&
          createPortal(
            <div
              className={`fixed bottom-5 left-5 z-[999999] w-[calc(100vw-40px)] max-w-[380px] rounded-[14px] bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-[0_16px_50px_rgba(220,38,38,0.28)] transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] md:bottom-6 md:left-6 md:w-auto md:min-w-[300px] ${
                toastVisible
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-5 scale-95 opacity-0"
              }`}
            >
              {toastError}
            </div>,
            document.body,
          )}

        <section className="mx-auto flex w-full max-w-[1180px] overflow-hidden rounded-[24px] bg-white shadow-[0_20px_70px_rgba(0,0,0,0.07)] sm:rounded-[30px] lg:min-h-[650px] animate-[forgotCardIn_.45s_cubic-bezier(.22,1,.36,1)_both]">
          <div className="hidden flex-1 bg-[#f5f3f5] p-8 md:flex md:flex-col md:justify-between lg:p-11">
            <div>
              <div className="animate-[forgotHeroIn_.45s_cubic-bezier(.22,1,.36,1)_both]">
                <h1 className="max-w-[470px] text-[42px] font-extrabold leading-[1.05] tracking-[-0.045em] text-zinc-950 lg:text-[56px]">
                  {text.forgotHeroTitle || "Hesabınızı təhlükəsiz bərpa edin."}
                </h1>

                <p className="mt-6 max-w-[430px] text-[15px] leading-7 text-zinc-600">
                  {text.forgotHeroDesc ||
                    "Email təsdiqi ilə şifrənizi yeniləyin və hesabınıza yenidən daxil olun."}
                </p>
              </div>
            </div>

            <div className="flex max-w-[360px] items-start gap-4 rounded-[20px] bg-white/80 p-5 backdrop-blur">
              <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-zinc-200 text-zinc-950">
                <FiClock />
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  {store?.workingHours || "Hər gün | 10:00 – 21:00"}
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  {store?.address || "Səməd Vurğun 34, Bakı"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col justify-between bg-white md:w-[560px] lg:w-[610px]">
            <div className="px-5 pb-8 pt-8 sm:px-8 md:px-10 lg:px-12">
              <div className="mb-9 flex justify-center rounded-[24px]">
                <BrandLogo />
              </div>

              <form onSubmit={handleSubmit}>
                <div
                  key={step}
                  className={`min-h-[330px] ${
                    direction === "next"
                      ? "animate-[forgotStepNext_.38s_cubic-bezier(.22,1,.36,1)_both]"
                      : "animate-[forgotStepPrev_.38s_cubic-bezier(.22,1,.36,1)_both]"
                  }`}
                >
                  {step === 0 && (
                    <>
                      <div className="mb-6">
                        <h2 className="text-[28px] font-extrabold tracking-[-0.045em] text-zinc-950">
                          {text.forgotTitle || "Şifrəni bərpa et"}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-zinc-500">
                          {text.forgotDesc ||
                            "Qeydiyyatdan keçdiyiniz email ünvanını daxil edin. Hesab tapılarsa OTP kod göndəriləcək."}
                        </p>
                      </div>

                      <AnimatedInput
                        label={text.email || "Email"}
                        icon={<FiMail />}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder={
                          text.emailPlaceholder || "example@mail.com"
                        }
                      />
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <div className="mb-6">
                        <h2 className="text-[28px] font-extrabold tracking-[-0.045em] text-zinc-950">
                          {text.forgotOtpTitle || "Email təsdiqi"}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-zinc-500">
                          {text.forgotOtpDesc ||
                            "Email ünvanınıza göndərilən 6 rəqəmli kodu daxil edin."}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <AnimatedInput
                          label={text.otpCode || "OTP kodu"}
                          icon={<FiShield />}
                          value={code}
                          onChange={(e) =>
                            setCode(
                              e.target.value.replace(/\D/g, "").slice(0, 6),
                            )
                          }
                          inputMode="numeric"
                          maxLength={6}
                          placeholder={text.otpPlaceholder || "6 rəqəmli kod"}
                        />

                        <div className="rounded-[16px] border border-zinc-100 bg-zinc-50 p-4 text-sm leading-6 text-zinc-500">
                          {text.otpSentInfo ||
                            "Təsdiq kodu email ünvanınıza göndərildi."}{" "}
                          <span className="font-bold text-zinc-950">
                            {email}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={resendOtp}
                          disabled={resendSeconds > 0 || loading}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-zinc-200 bg-white text-sm font-bold text-zinc-950 transition hover:border-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiRefreshCw />
                          {resendSeconds > 0
                            ? `${
                                text.resendOtpIn || "Yenidən göndər"
                              } (${resendSeconds}s)`
                            : text.resendOtp || "OTP-ni yenidən göndər"}
                        </button>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="mb-6">
                        <h2 className="text-[28px] font-extrabold tracking-[-0.045em] text-zinc-950">
                          {text.newPasswordTitle || "Yeni şifrə"}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-zinc-500">
                          {text.newPasswordDesc ||
                            "Hesabınız üçün yeni və təhlükəsiz şifrə yaradın."}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <AnimatedInput
                          label={text.newPassword || "Yeni şifrə"}
                          icon={<FiLock />}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          type={showPass ? "text" : "password"}
                          placeholder={
                            text.passwordPlaceholder || "Şifrənizi daxil edin"
                          }
                          rightElement={
                            newPassword.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="shrink-0 text-xl text-zinc-500 transition hover:text-zinc-950"
                              >
                                {showPass ? <FiEyeOff /> : <FiEye />}
                              </button>
                            ) : null
                          }
                        />

                        <AnimatedInput
                          label={text.confirmNewPassword || "Yeni şifrə təkrar"}
                          icon={<FiShield />}
                          value={confirmNewPassword}
                          onChange={(e) =>
                            setConfirmNewPassword(e.target.value)
                          }
                          type={showConfirmPass ? "text" : "password"}
                          placeholder={
                            text.confirmPasswordPlaceholder ||
                            "Şifrənizi təkrar daxil edin"
                          }
                          rightElement={
                            confirmNewPassword.length > 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowConfirmPass(!showConfirmPass)
                                }
                                className="shrink-0 text-xl text-zinc-500 transition hover:text-zinc-950"
                              >
                                {showConfirmPass ? <FiEyeOff /> : <FiEye />}
                              </button>
                            ) : null
                          }
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-7 flex gap-3">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={loading}
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-[14px] border border-zinc-200 bg-white text-xl text-zinc-950 transition hover:border-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FiArrowLeft />
                    </button>
                  )}

                  {step < 2 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={loading}
                      className="flex h-14 flex-1 items-center justify-center gap-3 rounded-[14px] bg-black text-[16px] font-bold text-white transition-all duration-300 hover:translate-y-[-1px] hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
                    >
                      {step === 0
                        ? text.sendOtp || "OTP göndər"
                        : text.next || "İrəli"}
                      <FiArrowRight className="text-xl" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-14 flex-1 items-center justify-center gap-3 rounded-[14px] bg-black text-[16px] font-bold text-white transition-all duration-300 hover:translate-y-[-1px] hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
                    >
                      {loading
                        ? text.saving || "Yadda saxlanılır..."
                        : text.savePassword || "Şifrəni yenilə"}
                      <FiCheck className="text-xl" />
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="border-t border-zinc-100 px-5 py-5 text-center text-sm text-zinc-500 sm:px-8">
              {text.rememberPassword || "Şifrənizi xatırladınız?"}{" "}
              <Link
                to="/login"
                className="font-bold text-zinc-950 hover:underline"
              >
                {text.login || "Daxil ol"}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
