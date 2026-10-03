import SiteInput from "../../components/common/SiteInput";
import { showUserToast as showToast } from "../../utils/userToast";
import "../profile/accountUI.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCamera,
  FiChevronRight,
  FiCreditCard,
  FiSave,
  FiUser,
} from "react-icons/fi";
import AppLoader from "../../components/common/AppLoader";
import { profileApi } from "../../api/profileApi";
import { useLanguage } from "../../i18n/LanguageContext";

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

function normalizePhone(value) {
  let digits = String(value || "").replace(/\D/g, "");

  if (digits.startsWith("994")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);

  return digits.slice(0, 9);
}

const loyaltyText = {
  az: {
    notAdded: "Əlavə edilməyib",
    active: "Yadda saxlanılmış kart nömrəsi",
    add: "Yeni loyallıq kartı yarat",
    codeLabel: "Loyallıq kartının kodu",
    codePlaceholder: "Məsələn: 2331221",
    desc: "Mövcud kartının nömrəsini yaz və aşağıdakı yadda saxla düyməsinə bas.",
  },
  en: {
    notAdded: "Not added",
    active: "Saved card number",
    add: "Create a new loyalty card",
    codeLabel: "Loyalty card code",
    codePlaceholder: "For example: 2331221",
    desc: "Enter your existing card number, then save your changes.",
  },
  ru: {
    notAdded: "Не добавлена",
    active: "Сохранённый номер карты",
    add: "Создать новую карту лояльности",
    codeLabel: "Код карты лояльности",
    codePlaceholder: "Например: 2331221",
    desc: "Введите номер существующей карты и сохраните изменения.",
  },
};

function getStoredLanguage() {
  return (
    localStorage.getItem("language") ||
    localStorage.getItem("lang") ||
    localStorage.getItem("nemesis_lang") ||
    "az"
  );
}

function normalizeLoyaltyCode(value) {
  const code = String(value || "").trim();

  return code && code.toLowerCase() !== "string" ? code : "";
}

function normalizeLoyaltyInput(value) {
  return String(value || "")
    .replace(/[^0-9]/g, "")
    .slice(0, 32);
}

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { text, lang: language } = useLanguage();
  const fileRef = useRef(null);
  const previewUrlRef = useRef("");

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
    loyaltyCardCode: "",
    profileImage: null,
    preview: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  const loyalty = loyaltyText[language] || loyaltyText.az;


  useEffect(() => {
    loadProfile();

    return () => {

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  

  

  useEffect(() => {
    if (!loading && window.location.hash === "#loyalty-card") {
      document.getElementById("loyalty-card")?.scrollIntoView({
        block: "center",
        behavior: "auto"
      });
    }
  }, [loading]);

  async function loadProfile() {
    try {
      setLoading(true);
      const res = await profileApi.get();
      const data = unwrap(res);
      setProfile(data);

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }

      setForm({
        fullName: data?.fullName || "",
        phoneNumber: normalizePhone(data?.phoneNumber || ""),
        email: data?.email || "",
        dateOfBirth: data?.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
        loyaltyCardCode: data?.loyaltyCardCode || "",
        profileImage: null,
        preview: data?.profileImageUrl || "",
      });
    } catch (err) {
      showToast(err.message || text.profileLoadError || "Profil yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function chooseImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;

    update("profileImage", file);
    update("preview", previewUrl);
  }

  async function save(e) {
    e.preventDefault();
    if (saving || !profile) return;

    const phone = normalizePhone(form.phoneNumber);
    const loyaltyCardCode = normalizeLoyaltyCode(form.loyaltyCardCode);

    if (phone.length !== 9) {
      showToast(text.phoneError || "Telefon nömrəsi 9 rəqəm olmalıdır.");
      return;
    }

    try {
      setSaving(true);

      await profileApi.update({
        fullName: form.fullName,
        phoneNumber: `994${phone}`,
        dateOfBirth: form.dateOfBirth
          ? new Date(form.dateOfBirth).toISOString()
          : "",
        loyaltyCardCode,
        profileImage: form.profileImage,
      });

      showToast(
        text.profileSaved || "Profil məlumatları yadda saxlanıldı.",
        "success",
      );
      await loadProfile();
      window.dispatchEvent(new Event("nemesis_auth_changed"));
    } catch (err) {
      showToast(
        err.message || text.profileSaveError || "Profil yadda saxlanmadı.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="nb-account min-h-[calc(100dvh-72px)] bg-[#fafafa]">
        <AppLoader text={text.loading} />
      </main>
    );
  }

  return (
    <main className="nb-account min-h-screen bg-[#fafafa] px-5 py-6 md:px-8 md:py-8">
      {saving && <AppLoader text={text.saving} />}

      <div className="mx-auto max-w-[920px]">
        <TopBar
          title={text.accountInfo}
          onBack={() => navigate("/profile/settings")}
        />

        <section className="mt-7 animate-[accountUp_.42s_cubic-bezier(.22,1,.36,1)_both] rounded-[8px] bg-zinc-950 p-6 text-white shadow-[0_22px_70px_rgba(0,0,0,0.12)] md:p-8">
          
          <h1 className="mt-3 text-[34px] font-medium tracking-[-0.055em] md:text-[52px]">
            {text.accountInfo}
          </h1>
          <p className="mt-3 max-w-[560px] text-sm leading-6 text-white/55">
            {text.accountInfoDesc}
          </p>
        </section>

        <form
          onSubmit={save}
          className="mt-5 rounded-[8px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6"
        >
          <div className="flex flex-col items-center gap-4 border-b border-zinc-100 pb-6 text-center">
            <div className="relative">
              <div className="grid h-32 w-32 place-items-center overflow-hidden rounded-[8px] bg-zinc-100">
                {form.preview ? (
                  <img
                    src={form.preview}
                    alt={profile?.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FiUser className="text-[46px] text-zinc-400" />
                )}
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-2 -right-2 grid h-11 w-11 place-items-center rounded-full bg-zinc-950 text-white shadow-lg transition active:scale-95"
              >
                <FiCamera />
              </button>

              <SiteInput
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={chooseImage}
              />
            </div>

            <p className="text-sm text-zinc-400">{text.changeProfileImage}</p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Input
              label={text.customerFullName}
              value={form.fullName}
              onChange={(v) => update("fullName", v)}
            />

            <PhoneInput
              label={text.phoneNumber}
              value={form.phoneNumber}
              onChange={(v) => update("phoneNumber", normalizePhone(v))}
            />

            <ReadOnlyInput
              label={text.email}
              value={form.email}
              hint={
                text.emailChangeOnlySecurity ||
                "Email yalnız təhlükəsizlik bölməsindən OTP ilə dəyişir."
              }
            />

            <Input
              label={text.dateOfBirth}
              type="date"
              value={form.dateOfBirth}
              onChange={(v) => update("dateOfBirth", v)}
            />

            <LoyaltyCardField
              label={text.loyaltyCard}
              savedCode={normalizeLoyaltyCode(profile?.loyaltyCardCode)}
              value={form.loyaltyCardCode}
              onChange={(value) =>
                update("loyaltyCardCode", normalizeLoyaltyInput(value))
              }
              copy={loyalty}
              onAdd={() => navigate("/profile/loyalty-card")}
            />
          </div>

          <button className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-[8px] bg-zinc-950 text-sm font-medium text-white transition active:scale-[0.98] md:w-auto md:px-7">
            <FiSave />
            {text.saveChanges}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes accountUp {
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
        
        <h1 className="mt-1 text-lg font-medium tracking-[-0.025em] text-zinc-950">
          {title}
        </h1>
      </div>
      <div />
    </header>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-800">
        {label}
      </span>
      <SiteInput
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-[8px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 outline-none transition focus:border-zinc-400"
      />
    </label>
  );
}

function PhoneInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-800">
        {label}
      </span>
      <div className="flex h-12 items-center rounded-[8px] border border-zinc-100 bg-zinc-50 transition focus-within:border-zinc-400">
        <span className="border-r border-zinc-200 px-4 text-sm font-bold text-zinc-950">
          +994
        </span>
        <SiteInput
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
          maxLength={9}
          placeholder="50 123 45 67"
          className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-medium text-zinc-950 outline-none placeholder:text-zinc-400"
        />
      </div>
    </label>
  );
}

function ReadOnlyInput({ label, value, hint }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-800">
        {label}
      </span>
      <SiteInput
        value={value || ""}
        readOnly
        className="h-12 w-full cursor-not-allowed rounded-[8px] border border-zinc-100 bg-zinc-100 px-4 text-sm font-medium text-zinc-500 outline-none"
      />
      {hint && <p className="mt-2 text-xs leading-5 text-zinc-400">{hint}</p>}
    </label>
  );
}

function LoyaltyCardField({
  label,
  savedCode,
  value,
  onChange,
  copy,
  onAdd,
}) {
  return (
    <div id="loyalty-card" className="nb-card-field rounded-[8px] border border-zinc-100 bg-zinc-50 p-4 md:col-span-2">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] bg-white text-xl text-zinc-950 shadow-sm">
          <FiCreditCard />
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-800">{label}</p>
            <p
              className={`mt-1 truncate text-sm ${
                savedCode
                  ? "font-semibold text-zinc-950"
                  : "text-zinc-400"
              }`}
            >
              {savedCode || copy.notAdded}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              {savedCode ? copy.active : copy.desc}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`mt-4 grid gap-3 sm:items-end ${
          savedCode ? "" : "sm:grid-cols-[minmax(0,1fr)_auto]"
        }`}
      >
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-zinc-600">
            {copy.codeLabel}
          </span>

          <SiteInput
            type="text"
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={32}
            placeholder={copy.codePlaceholder}
            className="h-11 w-full rounded-[8px] border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950"
          />
        </label>

        {!savedCode && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] bg-zinc-950 px-4 text-xs font-semibold text-white transition hover:-translate-y-0.5 active:scale-[0.97]"
          >
            {copy.add}
            <FiChevronRight />
          </button>
        )}
      </div>
    </div>
  );
}