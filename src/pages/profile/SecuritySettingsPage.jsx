import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiKey, FiPhone, FiSend, FiShield } from "react-icons/fi";
import AppLoader from "../../components/common/AppLoader";
import { profileApi } from "../../api/profileApi";
import { useLanguage } from "../../i18n/LanguageContext";

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

export default function SecuritySettingsPage() {
  const navigate = useNavigate();
  const { text } = useLanguage();

  const [profile, setProfile] = useState(null);
  const [phoneForm, setPhoneForm] = useState({ newPhoneNumber: "", code: "" });
  const [passForm, setPassForm] = useState({
    phoneNumber: "",
    code: "",
    newPassword: "",
    confirmNewPassword: "",
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
      setPassForm((prev) => ({ ...prev, phoneNumber: data?.phoneNumber || "" }));
    } catch (err) {
      setError(err.message || text.profileLoadError);
    } finally {
      setLoading(false);
    }
  }

  async function sendPhoneOtp() {
    if (!phoneForm.newPhoneNumber.trim()) {
      setError(text.newPhoneRequired);
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      await profileApi.sendChangePhoneOtp(phoneForm.newPhoneNumber.trim());
      setMessage(text.otpSent);
    } catch (err) {
      setError(err.message || text.otpSendError);
    } finally {
      setSaving(false);
    }
  }

  async function verifyPhone() {
    if (!phoneForm.newPhoneNumber.trim() || !phoneForm.code.trim()) {
      setError(text.phoneAndOtpRequired);
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      await profileApi.verifyChangePhone(
        phoneForm.newPhoneNumber.trim(),
        phoneForm.code.trim()
      );

      setMessage(text.phoneChanged);
      setPhoneForm({ newPhoneNumber: "", code: "" });
      await loadProfile();
    } catch (err) {
      setError(err.message || text.phoneVerifyError);
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();

    if (passForm.newPassword !== passForm.confirmNewPassword) {
      setError(text.passwordsNotSame);
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      await profileApi.resetPasswordWithOtp({
        phoneNumber: passForm.phoneNumber,
        code: passForm.code,
        newPassword: passForm.newPassword,
        confirmNewPassword: passForm.confirmNewPassword,
      });

      setMessage(text.passwordChanged);
      setPassForm({
        phoneNumber: profile?.phoneNumber || "",
        code: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      setError(err.message || text.passwordChangeError);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppLoader text={text.loading} />;

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-6 md:px-8 md:py-8">
      {saving && <AppLoader text={text.saving} />}

      <div className="mx-auto max-w-[920px]">
        <TopBar title={text.security} onBack={() => navigate("/profile/settings")} />

        <section className="mt-7 animate-[securityUp_.42s_cubic-bezier(.22,1,.36,1)_both] rounded-[24px] bg-zinc-950 p-6 text-white shadow-[0_22px_70px_rgba(0,0,0,0.12)] md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/45">
            NemesisBaku
          </p>
          <h1 className="mt-3 text-[34px] font-medium tracking-[-0.055em] md:text-[52px]">
            {text.security}
          </h1>
          <p className="mt-3 max-w-[560px] text-sm leading-6 text-white/55">
            {text.securityDesc}
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

        <section className="mt-5 grid gap-5">
          <Card icon={<FiPhone />} title={text.changePhoneNumber}>
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <Input
                label={text.newPhoneNumber}
                value={phoneForm.newPhoneNumber}
                onChange={(v) =>
                  setPhoneForm((p) => ({ ...p, newPhoneNumber: v }))
                }
              />
              <button
                type="button"
                onClick={sendPhoneOtp}
                className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-zinc-950 px-5 text-sm font-medium text-white transition active:scale-[0.98]"
              >
                <FiSend />
                {text.sendOtp}
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
              <Input
                label={text.otpCode}
                value={phoneForm.code}
                onChange={(v) => setPhoneForm((p) => ({ ...p, code: v }))}
              />
              <button
                type="button"
                onClick={verifyPhone}
                className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-zinc-950 px-5 text-sm font-medium text-white transition active:scale-[0.98]"
              >
                <FiShield />
                {text.confirm}
              </button>
            </div>
          </Card>

          <Card icon={<FiKey />} title={text.changePassword}>
            <form onSubmit={resetPassword} className="grid gap-4 md:grid-cols-2">
              <Input
                label={text.phoneNumber}
                value={passForm.phoneNumber}
                onChange={(v) => setPassForm((p) => ({ ...p, phoneNumber: v }))}
              />
              <Input
                label={text.otpCode}
                value={passForm.code}
                onChange={(v) => setPassForm((p) => ({ ...p, code: v }))}
              />
              <Input
                label={text.newPassword}
                type="password"
                value={passForm.newPassword}
                onChange={(v) => setPassForm((p) => ({ ...p, newPassword: v }))}
              />
              <Input
                label={text.confirmNewPassword}
                type="password"
                value={passForm.confirmNewPassword}
                onChange={(v) =>
                  setPassForm((p) => ({ ...p, confirmNewPassword: v }))
                }
              />

              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-zinc-950 px-5 text-sm font-medium text-white transition active:scale-[0.98] md:col-span-2 md:w-max">
                <FiShield />
                {text.changePassword}
              </button>
            </form>
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
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-400">
          NemesisBaku
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