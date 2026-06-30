import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCamera, FiSave, FiUser } from "react-icons/fi";
import AppLoader from "../../components/common/AppLoader";
import { profileApi } from "../../api/profileApi";
import { useLanguage } from "../../i18n/LanguageContext";

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { text } = useLanguage();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    dateOfBirth: "",
    loyaltyCardCode: "",
    profileImage: null,
    preview: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const res = await profileApi.get();
      const data = unwrap(res);
      setProfile(data);

      setForm({
        fullName: data?.fullName || "",
        email: data?.email || "",
        dateOfBirth: data?.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
        loyaltyCardCode: data?.loyaltyCardCode || "",
        profileImage: null,
        preview: data?.profileImageUrl || "",
      });
    } catch (err) {
      setError(err.message || text.profileLoadError);
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

    update("profileImage", file);
    update("preview", URL.createObjectURL(file));
  }

  async function save(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await profileApi.update({
        fullName: form.fullName,
        email: form.email,
        dateOfBirth: form.dateOfBirth
          ? new Date(form.dateOfBirth).toISOString()
          : "",
        loyaltyCardCode: form.loyaltyCardCode,
        profileImage: form.profileImage,
      });

      setMessage(text.profileSaved);
      await loadProfile();
      window.dispatchEvent(new Event("nemesis_auth_changed"));
    } catch (err) {
      setError(err.message || text.profileSaveError);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppLoader text={text.loading} />;

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-6 md:px-8 md:py-8">
      {saving && <AppLoader text={text.saving} />}

      <div className="mx-auto max-w-[920px]">
        <TopBar title={text.accountInfo} onBack={() => navigate("/profile/settings")} />

        <section className="mt-7 animate-[accountUp_.42s_cubic-bezier(.22,1,.36,1)_both] rounded-[24px] bg-zinc-950 p-6 text-white shadow-[0_22px_70px_rgba(0,0,0,0.12)] md:p-8">
          <p className="text-[15px] font-medium tracking-[0.17em] text-white/45">
            nemesisbaku
          </p>
          <h1 className="mt-3 text-[34px] font-medium tracking-[-0.055em] md:text-[52px]">
            {text.accountInfo}
          </h1>
          <p className="mt-3 max-w-[560px] text-sm leading-6 text-white/55">
            {text.accountInfoDesc}
          </p>
        </section>

        {message && (
          <div className="mt-5 rounded-[16px] bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-[16px] bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <form
          onSubmit={save}
          className="mt-5 rounded-[22px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6"
        >
          <div className="flex flex-col items-center gap-4 border-b border-zinc-100 pb-6 text-center">
            <div className="relative">
              <div className="grid h-32 w-32 place-items-center overflow-hidden rounded-[28px] bg-zinc-100">
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

              <input
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
            <Input
              label={text.email}
              value={form.email}
              onChange={(v) => update("email", v)}
            />
            <Input
              label={text.dateOfBirth}
              type="date"
              value={form.dateOfBirth}
              onChange={(v) => update("dateOfBirth", v)}
            />
            <Input
              label={text.loyaltyCard}
              value={form.loyaltyCardCode}
              onChange={(v) => update("loyaltyCardCode", v)}
            />
          </div>

          <button className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-[14px] bg-zinc-950 text-sm font-medium text-white transition active:scale-[0.98] md:w-auto md:px-7">
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
        <p className="text-[15px] font-medium uppercase tracking-[0.17em] text-zinc-400">
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