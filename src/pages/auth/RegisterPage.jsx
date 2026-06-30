import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiGift,
  FiImage,
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
  FiX,
  FiClock,
} from "react-icons/fi";
import { apiFetch } from "../../api/apiFetch";
import { useLanguage } from "../../i18n/LanguageContext";
import AppLoader from "../../components/common/AppLoader";
import AnimatedInput from "../../components/common/AnimatedInput";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { text } = useLanguage();
  const fileRef = useRef(null);

  const [store, setStore] = useState(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState("next");
  const [toastError, setToastError] = useState("");
  const [toastClosing, setToastClosing] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    loyaltyCardCode: "",
    code: "000000",
    profileImage: null,
  });

  useEffect(() => {
    loadStoreInfo();
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

  const brandName = store?.storeName || "nemesisbaku";

  const steps = useMemo(
    () => [
      {
        title: text.registerStepNameTitle || "Ad soyad",
        short: text.registerStepNameShort || "Ad soyad",
        desc:
          text.registerStepNameDesc ||
          "Premium hesabınızı yaratmaq üçün ad və soyadınızı daxil edin.",
      },
      {
        title: text.registerStepBirthTitle || "Doğum tarixi",
        short: text.registerStepBirthShort || "Doğum tarixi",
        desc:
          text.registerStepBirthDesc ||
          "Doğum tarixiniz profil məlumatlarında istifadə olunacaq.",
      },
      {
        title: text.registerStepPhoneTitle || "Telefon",
        short: text.registerStepPhoneShort || "Telefon",
        desc:
          text.registerStepPhoneDesc ||
          "Hesabınıza giriş üçün istifadə edəcəyiniz nömrəni yazın.",
      },
      {
        title: text.registerStepEmailTitle || "Email",
        short: text.registerStepEmailShort || "Email",
        desc:
          text.registerStepEmailDesc ||
          "Sifariş və hesab bildirişləri üçün email ünvanınızı daxil edin.",
      },
      {
        title: text.registerStepPasswordTitle || "Şifrə",
        short: text.registerStepPasswordShort || "Şifrə",
        desc:
          text.registerStepPasswordDesc ||
          "Təhlükəsiz hesab üçün güclü şifrə yaradın.",
      },
      {
        title: text.registerStepFinishTitle || "Son toxunuş",
        short: text.registerStepFinishShort || "Son toxunuş",
        desc:
          text.registerStepFinishDesc ||
          "Profil şəkli və loyalty kod istəyə bağlıdır.",
      },
    ],
    [text]
  );

  function BrandLogo({ variant = "main" }) {
    const sizes =
      variant === "left"
        ? "h-[108px] w-[365px] max-w-full px-8 rounded-[20px] shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
        : "h-[82px] w-[290px] max-w-full px-6 rounded-[18px]";

    return (
      <div
        className={`flex items-center justify-center overflow-hidden bg-white ${sizes}`}
      >
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

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handlePhoneChange(e) {
    updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 9));
  }

  function showToast(message) {
    setToastClosing(false);
    setToastError(message);

    window.clearTimeout(showToast.closeTimer);
    window.clearTimeout(showToast.hideTimer);

    showToast.closeTimer = window.setTimeout(() => setToastClosing(true), 2800);
    showToast.hideTimer = window.setTimeout(() => {
      setToastError("");
      setToastClosing(false);
    }, 3150);
  }

  function validateCurrentStep() {
    if (step === 0 && form.fullName.trim().length < 3) {
      showToast(text.fullNameRequired || "Ad soyad daxil edilməlidir.");
      return false;
    }

    if (step === 1 && !form.dateOfBirth) {
      showToast(text.dateOfBirthRequired || "Doğum tarixi seçilməlidir.");
      return false;
    }

    if (step === 2 && form.phone.length !== 9) {
      showToast(text.phoneError || "Telefon nömrəsi 9 rəqəm olmalıdır.");
      return false;
    }

    if (step === 3) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
      if (!emailOk) {
        showToast(text.emailRequired || "Düzgün email daxil edilməlidir.");
        return false;
      }
    }

    if (step === 4) {
      if (form.password.trim().length < 6) {
        showToast(text.passwordMinError || "Şifrə minimum 6 simvol olmalıdır.");
        return false;
      }

      if (form.password !== form.confirmPassword) {
        showToast(text.passwordsNotSame || "Şifrələr eyni deyil.");
        return false;
      }
    }

    return true;
  }

  function nextStep() {
    if (!validateCurrentStep()) return;
    if (step < steps.length - 1) {
      setDirection("next");
      setStep((prev) => prev + 1);
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
    if (!validateCurrentStep()) return;

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("FullName", form.fullName.trim());
      fd.append("PhoneNumber", `994${form.phone}`);
      fd.append("Email", form.email.trim());
      fd.append("DateOfBirth", new Date(form.dateOfBirth).toISOString());
      fd.append("Password", form.password);
      fd.append("ConfirmPassword", form.confirmPassword);
      fd.append("LoyaltyCardCode", form.loyaltyCardCode.trim());
      fd.append("Code", form.code || "000000");

      if (form.profileImage) fd.append("ProfileImage", form.profileImage);

      await apiFetch("/api/Auth/verify-register-otp", {
        method: "POST",
        body: fd,
      });

      navigate("/login", { replace: true });
    } catch (err) {
      showToast(
        err.message || text.registerError || "Qeydiyyat zamanı xəta baş verdi."
      );
    } finally {
      setLoading(false);
    }
  }

  function removeImage() {
    updateField("profileImage", null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const imagePreview = form.profileImage
    ? URL.createObjectURL(form.profileImage)
    : null;

  return (
    <>
      <style>
        {`
          @keyframes registerToastIn {
            from { opacity: 0; transform: translateY(18px) scale(.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes registerToastOut {
            from { opacity: 1; transform: translateY(0) scale(1); }
            to { opacity: 0; transform: translateY(18px) scale(.98); }
          }

          @keyframes registerStepNext {
            from { opacity: 0; transform: translateX(24px) scale(.985); filter: blur(4px); }
            to { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
          }

          @keyframes registerStepPrev {
            from { opacity: 0; transform: translateX(-24px) scale(.985); filter: blur(4px); }
            to { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
          }

          @keyframes registerCardIn {
            from { opacity: 0; transform: translateY(18px) scale(.985); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes registerHeroIn {
            from { opacity: 0; transform: translateY(18px); filter: blur(4px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
          }
        `}
      </style>

      <main className="min-h-screen bg-[#f5f3f5] px-4 py-6 md:px-6 lg:flex lg:items-center lg:justify-center">
        {(loading || storeLoading) && (
          <AppLoader
            text={
              loading
                ? text.registering || "Qeydiyyat yaradılır"
                : text.loading
            }
          />
        )}

        {toastError &&
          createPortal(
            <div
              className={`fixed bottom-5 left-5 z-[999999] w-[calc(100vw-40px)] max-w-[380px] rounded-[14px] bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-[0_16px_50px_rgba(220,38,38,0.28)] md:bottom-6 md:left-6 md:w-auto md:min-w-[300px] ${
                toastClosing
                  ? "animate-[registerToastOut_.28s_cubic-bezier(.22,1,.36,1)_both]"
                  : "animate-[registerToastIn_.32s_cubic-bezier(.22,1,.36,1)_both]"
              }`}
            >
              {toastError}
            </div>,
            document.body
          )}

        <section className="mx-auto flex w-full max-w-[1180px] overflow-hidden rounded-[24px] bg-white shadow-[0_20px_70px_rgba(0,0,0,0.07)] sm:rounded-[30px] lg:min-h-[650px] animate-[registerCardIn_.45s_cubic-bezier(.22,1,.36,1)_both]">
          <div className="hidden flex-1 bg-[#f5f3f5] p-8 md:flex md:flex-col md:justify-between lg:p-11">
            <div>


              <div className="animate-[registerHeroIn_.45s_cubic-bezier(.22,1,.36,1)_both]">
                <h1 className="max-w-[470px] text-[42px] font-extrabold leading-[1.05] tracking-[-0.045em] text-zinc-950 lg:text-[56px]">
                  {text.premiumTitle || "Addımlarınızda premium stil."}
                </h1>

                <p className="mt-6 max-w-[430px] text-[15px] leading-7 text-zinc-600">
                  {text.premiumDesc ||
                    "Premium sneaker kolleksiyaları, minimalist seçim və nemesisbaku keyfiyyəti."}
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

              <div className="mb-9">
                <div className="flex items-start justify-between gap-2">
                  {steps.map((item, index) => {
                    const active = index === step;
                    const done = index < step;

                    return (
                      <div
                        key={item.short}
                        className="flex min-w-0 flex-1 flex-col items-center"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (index <= step) {
                              setDirection(index < step ? "prev" : "next");
                              setStep(index);
                            }
                          }}
                          className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold transition-all duration-300 ${
                            active
                              ? "bg-black text-white shadow-[0_14px_28px_rgba(0,0,0,0.16)]"
                              : done
                              ? "bg-zinc-900 text-white"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {done ? <FiCheck /> : index + 1}
                        </button>

                        <span
                          className={`mt-3 hidden max-w-[82px] truncate text-center text-[11px] font-semibold sm:block ${
                            active ? "text-zinc-950" : "text-zinc-500"
                          }`}
                        >
                          {item.short}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div
                  key={step}
                  className={`min-h-[265px] ${
                    direction === "next"
                      ? "animate-[registerStepNext_.38s_cubic-bezier(.22,1,.36,1)_both]"
                      : "animate-[registerStepPrev_.38s_cubic-bezier(.22,1,.36,1)_both]"
                  }`}
                >
                  <div className="mb-6">
                    <h2 className="text-[28px] font-extrabold tracking-[-0.045em] text-zinc-950">
                      {steps[step].title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-zinc-500">
                      {steps[step].desc}
                    </p>
                  </div>

                  {step === 0 && (
                    <AnimatedInput
                      label={text.customerFullName || "Ad soyad"}
                      icon={<FiUser />}
                      value={form.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      placeholder={
                        text.fullNamePlaceholder ||
                        "Məsələn: İbadulla Hüseynzadə"
                      }
                    />
                  )}

                  {step === 1 && (
                    <AnimatedInput
                      label={text.dateOfBirth || "Doğum tarixi"}
                      icon={<FiCalendar />}
                      value={form.dateOfBirth}
                      onChange={(e) =>
                        updateField("dateOfBirth", e.target.value)
                      }
                      type="date"
                    />
                  )}

                  {step === 2 && (
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-zinc-800">
                        {text.phoneNumber}
                      </span>

                      <div className="flex h-14 items-center rounded-[14px] border-[1.5px] border-zinc-300 bg-white transition-all duration-300 focus-within:border-zinc-950 focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.07)]">
                        <div className="flex h-full items-center gap-2 border-r border-zinc-100 px-4 text-sm font-bold text-zinc-900">
                          <FiPhone />
                          +994
                        </div>

                        <input
                          value={form.phone}
                          onChange={handlePhoneChange}
                          inputMode="numeric"
                          maxLength={9}
                          placeholder={text.phonePlaceholder || "50 123 45 67"}
                          className="h-full min-w-0 flex-1 bg-transparent px-4 text-[15px] font-medium outline-none placeholder:text-zinc-400"
                        />
                      </div>
                    </label>
                  )}

                  {step === 3 && (
                    <AnimatedInput
                      label={text.email || "Email"}
                      icon={<FiMail />}
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      type="email"
                      placeholder={text.emailPlaceholder || "example@mail.com"}
                    />
                  )}

                  {step === 4 && (
                    <div className="space-y-4">
                      <AnimatedInput
                        label={text.password || "Şifrə"}
                        icon={<FiLock />}
                        value={form.password}
                        onChange={(e) =>
                          updateField("password", e.target.value)
                        }
                        type={showPass ? "text" : "password"}
                        placeholder={
                          text.passwordPlaceholder || "Şifrənizi daxil edin"
                        }
                        rightElement={
                          form.password.length > 0 ? (
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
                        label={text.confirmPassword || "Şifrə təkrar"}
                        icon={<FiShield />}
                        value={form.confirmPassword}
                        onChange={(e) =>
                          updateField("confirmPassword", e.target.value)
                        }
                        type={showConfirmPass ? "text" : "password"}
                        placeholder={
                          text.confirmPasswordPlaceholder ||
                          "Şifrənizi təkrar daxil edin"
                        }
                        rightElement={
                          form.confirmPassword.length > 0 ? (
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
                  )}

                  {step === 5 && (
                    <div className="space-y-4">
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-zinc-800">
                          {text.profileImage || "Profil şəkli"}
                        </span>

                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            updateField(
                              "profileImage",
                              e.target.files?.[0] || null
                            )
                          }
                        />

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="flex h-16 flex-1 items-center gap-3 rounded-[16px] border-[1.5px] border-dashed border-zinc-300 bg-zinc-50 px-4 text-left transition hover:border-zinc-950 hover:bg-white"
                          >
                            <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-white text-xl text-zinc-950 shadow-sm">
                              <FiImage />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold text-zinc-950">
                                {form.profileImage
                                  ? form.profileImage.name
                                  : text.chooseImage || "Şəkil seç"}
                              </span>
                              <span className="block truncate text-xs text-zinc-500">
                                {text.optional || "İstəyə bağlı"}
                              </span>
                            </span>
                          </button>

                          {imagePreview && (
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] border border-zinc-100 bg-zinc-50">
                              <img
                                src={imagePreview}
                                alt="profile"
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={removeImage}
                                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black text-white"
                              >
                                <FiX size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </label>

                      <AnimatedInput
                        label={text.loyaltyCard || "Loyalty kart"}
                        icon={<FiGift />}
                        value={form.loyaltyCardCode}
                        onChange={(e) =>
                          updateField("loyaltyCardCode", e.target.value)
                        }
                        placeholder={
                          text.loyaltyPlaceholder || "Kod varsa daxil edin"
                        }
                      />

                      <div className="rounded-[16px] border border-zinc-100 bg-zinc-50 p-4 text-sm leading-6 text-zinc-500">
                        {text.otpTemporaryInfo ||
                          "OTP sistemi hazırda aktiv deyil. Hesab yaradıldıqdan sonra login səhifəsinə yönləndiriləcəksiniz."}
                      </div>
                    </div>
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

                  {step < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={loading}
                      className="flex h-14 flex-1 items-center justify-center gap-3 rounded-[14px] bg-black text-[16px] font-bold text-white transition-all duration-300 hover:translate-y-[-1px] hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
                    >
                      {text.next || "İrəli"}
                      <FiArrowRight className="text-xl" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-14 flex-1 items-center justify-center gap-3 rounded-[14px] bg-black text-[16px] font-bold text-white transition-all duration-300 hover:translate-y-[-1px] hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
                    >
                      {loading
                        ? text.registering || "Yaradılır..."
                        : text.createAccount || "Hesab yarat"}
                      <FiCheck className="text-xl" />
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="border-t border-zinc-100 px-5 py-5 text-center text-sm text-zinc-500 sm:px-8">
              {text.haveAccount || "Artıq hesabınız var?"}{" "}
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