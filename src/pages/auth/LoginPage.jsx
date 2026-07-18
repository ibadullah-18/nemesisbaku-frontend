import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLock, FiUser } from "react-icons/fi";
import { apiFetch, saveTokens } from "../../api/apiFetch";
import { useLanguage } from "../../i18n/LanguageContext";
import AppLoader from "../../components/common/AppLoader";
import AnimatedInput from "../../components/common/AnimatedInput";

function BrandLogo({ logoUrl, brandName }) {
  if (!logoUrl) {
    return (
      <span className="text-[22px] font-extrabold lowercase tracking-[-0.05em] text-zinc-950">
        {brandName}
      </span>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={brandName}
      draggable={false}
      className="block h-auto w-[118px] object-contain select-none sm:w-[128px] md:w-[138px]"
    />
  );
}

function normalizeEmailOrPhone(value) {
  const raw = value.trim();

  if (raw.includes("@")) return raw.toLowerCase();

  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("994")) return digits;

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return `994${digits}`;
}

function isValidEmailOrPhone(value) {
  const raw = value.trim();

  if (!raw) return false;

  if (raw.includes("@")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
  }

  return /^994\d{9}$/.test(normalizeEmailOrPhone(raw));
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { text } = useLanguage();

  const [store, setStore] = useState(null);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storeLoading, setStoreLoading] = useState(true);

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

  function getLoginErrorMessage(err) {
    const message = err?.message;

    if (
      !message ||
      message === "Əməliyyat uğursuz oldu" ||
      message === "Unauthorized" ||
      message === "Unauthorized." ||
      message === "Serverlə əlaqə qurulmadı."
    ) {
      return text.loginError || "Email, telefon və ya şifrə yanlışdır.";
    }

    return message;
  }

  async function handleLogin(e) {
    e.preventDefault();

    if (!isValidEmailOrPhone(emailOrPhone)) {
      showToast(
        text.emailOrPhoneError ||
          "Email və ya telefon nömrəsini düzgün daxil edin.",
      );
      return;
    }

    if (!password.trim()) {
      showToast(text.passwordError || "Şifrə daxil edin.");
      return;
    }

    try {
      setLoading(true);

      const res = await apiFetch(
        "/api/Auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            emailOrPhoneNumber: normalizeEmailOrPhone(emailOrPhone),
            password,
          }),
        },
        false,
      );

      const accessToken =
        res?.accessToken ||
        res?.token ||
        res?.data?.accessToken ||
        res?.data?.token;

      const refreshToken = res?.refreshToken || res?.data?.refreshToken;

      if (!accessToken) {
        throw new Error(
          text.loginError || "Email, telefon və ya şifrə yanlışdır.",
        );
      }

      saveTokens(accessToken, refreshToken);
      navigate("/");
    } catch (err) {
      showToast(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const brandName = store?.storeName || "NemesisBaku";
  const slogan = store?.slogan || "Addımlarınızda premium stil";

  return (
    <main className="min-h-screen bg-[#f5f3f5] px-4 py-6 md:px-6 lg:flex lg:items-center lg:justify-center">
      {(loading || storeLoading) && (
        <AppLoader text={loading ? text.loggingIn : text.loading} />
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

      <section className="mx-auto flex w-full max-w-[1120px] overflow-hidden rounded-[24px] bg-white shadow-[0_20px_70px_rgba(0,0,0,0.07)] sm:rounded-[30px] lg:min-h-[650px]">
        <div className="hidden flex-1 bg-[#f5f3f5] p-8 md:flex md:flex-col md:justify-between lg:p-11">
          <div>
            <div className="mb-10 flex items-center gap-4">
              <Link
                to="/"
                className="flex shrink-0 items-center overflow-hidden rounded-[12px] transition duration-300 hover:opacity-80"
              >
                <BrandLogo logoUrl={store?.logoUrl} brandName={brandName} />
              </Link>

              <div className="min-w-0">
                <p className="max-w-[240px] truncate text-sm text-zinc-500">
                  {slogan}
                </p>
              </div>
            </div>

            <h1 className="max-w-[460px] text-[42px] font-extrabold leading-[1.05] tracking-[-0.045em] text-zinc-950 lg:text-[56px]">
              {text.premiumTitle}
            </h1>

            <p className="mt-5 max-w-[430px] text-[15px] leading-7 text-zinc-600">
              {text.premiumDesc}
            </p>
          </div>

          <div className="rounded-[20px] bg-white/80 p-5 backdrop-blur">
            <p className="text-sm font-semibold text-zinc-900">
              {store?.address || "AF Mall, Bakı"}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {store?.workingHours || "Hər gün | 10:00 – 21:00"}
            </p>
          </div>
        </div>

        <div className="flex w-full items-center justify-center px-5 py-9 sm:px-8 sm:py-10 md:w-[500px] lg:w-[480px]">
          <div className="w-full max-w-[390px]">
            <div className="mb-7">
              <h2 className="text-[34px] font-extrabold tracking-[-0.045em] text-zinc-950">
                {text.loginTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {text.loginDesc}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <AnimatedInput
                label={text.emailOrPhone || "Email və ya telefon"}
                icon={<FiUser />}
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                type="text"
                placeholder={
                  text.emailOrPhonePlaceholder ||
                  "Email və ya telefon daxil edin"
                }
              />

              <AnimatedInput
                label={text.password}
                icon={<FiLock />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPass ? "text" : "password"}
                placeholder={text.passwordPlaceholder}
                rightElement={
                  password.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="shrink-0 text-xl text-zinc-500 transition hover:text-zinc-950"
                      aria-label="Şifrəni göstər"
                    >
                      {showPass ? <FiEyeOff /> : <FiEye />}
                    </button>
                  ) : null
                }
              />

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-zinc-950 hover:underline"
                >
                  {text.forgotPassword}
                </Link>
              </div>

              <button
                disabled={loading}
                className="h-14 w-full rounded-[14px] bg-black text-[18px] font-bold text-white transition-all duration-300 hover:translate-y-[-1px] hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? text.loggingIn : text.login}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-zinc-500">
              {text.noAccount}{" "}
              <Link
                to="/register"
                className="font-bold text-zinc-950 hover:underline"
              >
                {text.register}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
