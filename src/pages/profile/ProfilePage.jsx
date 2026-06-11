import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiCheck,
  FiEdit3,
  FiLock,
  FiLogOut,
  FiMail,
  FiPhone,
  FiSave,
  FiShield,
  FiUser,
} from "react-icons/fi";
import AppLoader from "../../components/common/AppLoader";
import { profileApi } from "../../api/profileApi";
import { useLanguage } from "../../i18n/LanguageContext";

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

const emptyPhoneForm = {
  newPhoneNumber: "",
  code: "",
};

const emptyPasswordForm = {
  phoneNumber: "",
  code: "",
  newPassword: "",
  confirmNewPassword: "",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { text } = useLanguage();

  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    dateOfBirth: "",
    loyaltyCardCode: "",
  });

  const [phoneForm, setPhoneForm] = useState(emptyPhoneForm);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);

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
      setError("");

      const res = await profileApi.get();
      const data = unwrap(res);

      setProfile(data);

      setForm({
        fullName: data?.fullName || "",
        email: data?.email || "",
        dateOfBirth: data?.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
        loyaltyCardCode: data?.loyaltyCardCode || "",
      });

      setPasswordForm((prev) => ({
        ...prev,
        phoneNumber: data?.phoneNumber || "",
      }));
    } catch (err) {
      setError(err.message || text.profileLoadError);
    } finally {
      setLoading(false);
    }
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePhoneForm(key, value) {
    setPhoneForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePasswordForm(key, value) {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
  }

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
    localStorage.removeItem("nemesis_access_token");
    localStorage.removeItem("nemesis_refresh_token");

    window.dispatchEvent(new Event("nemesis_auth_changed"));
    navigate("/login");
  }

  async function saveProfile(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      await profileApi.update({
        fullName: form.fullName,
        email: form.email,
        dateOfBirth: form.dateOfBirth
          ? new Date(form.dateOfBirth).toISOString()
          : null,
        loyaltyCardCode: form.loyaltyCardCode || null,
      });

      setMessage(text.profileSaved);
      await loadProfile();
    } catch (err) {
      setError(err.message || text.profileSaveError);
    } finally {
      setSaving(false);
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
      setPhoneForm(emptyPhoneForm);
      await loadProfile();
    } catch (err) {
      setError(err.message || text.phoneVerifyError);
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setError(text.passwordsNotSame);
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      await profileApi.resetPasswordWithOtp({
        phoneNumber: passwordForm.phoneNumber,
        code: passwordForm.code,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmNewPassword,
      });

      setMessage(text.passwordChanged);

      setPasswordForm({
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

  if (loading) return <AppLoader text={text.profileOpening} />;

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-7 md:px-8 md:py-10">
      {saving && <AppLoader text={text.saving} />}

      <div className="mx-auto max-w-[1180px]">
        <div className="mb-7 text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-zinc-400">
            NemesisBaku
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em] text-zinc-950 md:text-[46px]">
            {text.profile}
          </h1>

          <p className="mt-2 text-sm font-medium text-zinc-500">
            {text.profileDesc}
          </p>
        </div>

        {message && (
          <div className="mb-5 rounded-[18px] border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-[18px] bg-zinc-100">
                {profile?.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={profile.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FiUser className="text-[42px] text-zinc-400" />
                )}
              </div>

              <h2 className="mt-4 text-xl font-extrabold tracking-[-0.03em] text-zinc-950">
                {profile?.fullName}
              </h2>

              <p className="mt-1 text-sm font-bold text-zinc-400">
                {profile?.phoneNumber}
              </p>

              <button
                type="button"
                onClick={logout}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-zinc-950 text-sm font-extrabold text-white transition hover:opacity-90 active:scale-[0.98]"
              >
                <FiLogOut />
                {text.logout}
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <InfoRow icon={<FiMail />} label={text.email} value={profile?.email || text.none} />
              <InfoRow icon={<FiCalendar />} label={text.dateOfBirth} value={profile?.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : text.none} />
              <InfoRow icon={<FiShield />} label={text.loyaltyCard} value={profile?.loyaltyCardCode || text.none} />
            </div>
          </aside>

          <section className="space-y-5">
            <form
              onSubmit={saveProfile}
              className="rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6"
            >
              <SectionTitle
                icon={<FiEdit3 />}
                title={text.personalInfo}
                desc={text.personalInfoDesc}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Input icon={<FiUser />} label={text.fullName} value={form.fullName} onChange={(v) => updateForm("fullName", v)} placeholder={text.fullName} />
                <Input icon={<FiMail />} label={text.email} value={form.email} onChange={(v) => updateForm("email", v)} placeholder="email@example.com" />
                <Input icon={<FiCalendar />} label={text.dateOfBirth} type="date" value={form.dateOfBirth} onChange={(v) => updateForm("dateOfBirth", v)} />
                <Input icon={<FiShield />} label={text.loyaltyCardCode} value={form.loyaltyCardCode} onChange={(v) => updateForm("loyaltyCardCode", v)} placeholder={text.loyaltyCardCode} />
              </div>

              <button
                disabled={saving}
                className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[#244989] px-6 text-sm font-extrabold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
              >
                <FiSave />
                {text.save}
              </button>
            </form>

            <div className="grid gap-5 xl:grid-cols-2">
              <div className="rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
                <SectionTitle
                  icon={<FiPhone />}
                  title={text.changePhone}
                  desc={text.changePhoneDesc}
                />

                <div className="space-y-4">
                  <Input icon={<FiPhone />} label={text.newPhone} value={phoneForm.newPhoneNumber} onChange={(v) => updatePhoneForm("newPhoneNumber", v)} placeholder="994501234567" />
                  <Input icon={<FiCheck />} label={text.otpCode} value={phoneForm.code} onChange={(v) => updatePhoneForm("code", v)} placeholder="123456" />

                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={sendPhoneOtp} disabled={saving} className="h-12 rounded-[14px] bg-zinc-100 text-sm font-extrabold text-zinc-950 transition active:scale-[0.98] disabled:opacity-60">
                      {text.sendCode}
                    </button>

                    <button type="button" onClick={verifyPhone} disabled={saving} className="h-12 rounded-[14px] bg-[#244989] text-sm font-extrabold text-white transition active:scale-[0.98] disabled:opacity-60">
                      {text.confirm}
                    </button>
                  </div>
                </div>
              </div>

              <form
                onSubmit={resetPassword}
                className="rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6"
              >
                <SectionTitle
                  icon={<FiLock />}
                  title={text.changePassword}
                  desc={text.changePasswordDesc}
                />

                <div className="space-y-4">
                  <Input icon={<FiPhone />} label={text.phoneNumber} value={passwordForm.phoneNumber} onChange={(v) => updatePasswordForm("phoneNumber", v)} placeholder="994501234567" />
                  <Input icon={<FiCheck />} label={text.otpCode} value={passwordForm.code} onChange={(v) => updatePasswordForm("code", v)} placeholder="123456" />
                  <Input icon={<FiLock />} label={text.newPassword} type="password" value={passwordForm.newPassword} onChange={(v) => updatePasswordForm("newPassword", v)} placeholder={text.newPassword} />
                  <Input icon={<FiLock />} label={text.confirmNewPassword} type="password" value={passwordForm.confirmNewPassword} onChange={(v) => updatePasswordForm("confirmNewPassword", v)} placeholder={text.confirmNewPassword} />

                  <button disabled={saving} className="h-12 w-full rounded-[14px] bg-[#244989] text-sm font-extrabold text-white transition active:scale-[0.98] disabled:opacity-60">
                    {text.updatePassword}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SectionTitle({ icon, title, desc }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-zinc-50 text-zinc-950">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-extrabold tracking-[-0.03em] text-zinc-950">
          {title}
        </h2>
        <p className="text-sm font-medium text-zinc-500">{desc}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-zinc-50 px-4 py-3">
      <div className="text-zinc-500">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-zinc-400">
          {label}
        </p>
        <p className="truncate text-sm font-bold text-zinc-950">{value}</p>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", icon }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-800">
        {label}
      </span>

      <div className="flex h-12 items-center gap-3 rounded-[14px] border border-zinc-100 bg-zinc-50 px-4 transition focus-within:border-zinc-400">
        <span className="text-zinc-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-zinc-950 outline-none placeholder:text-zinc-400"
        />
      </div>
    </label>
  );
}