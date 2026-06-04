import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLock, FiPhone } from "react-icons/fi";
import { apiFetch, saveTokens } from "../../api/apiFetch";
import { useLanguage } from "../../i18n/LanguageContext";
import AppLoader from "../../components/common/AppLoader";
import AnimatedInput from "../../components/common/AnimatedInput";

export default function LoginPage() {
  const navigate = useNavigate();
  const { text } = useLanguage();

  const [store, setStore] = useState(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storeLoading, setStoreLoading] = useState(true);
  const [error, setError] = useState("");

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

  function handlePhoneChange(e) {
    const onlyNumbers = e.target.value.replace(/\D/g, "").slice(0, 9);
    setPhone(onlyNumbers);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (phone.length !== 9) {
      setError(text.phoneError);
      return;
    }

    if (!password.trim()) {
      setError(text.passwordError);
      return;
    }

    try {
      setLoading(true);

      const res = await apiFetch("/api/Auth/login", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber: `994${phone}`,
          password,
        }),
      });

      const accessToken =
        res?.accessToken || res?.token || res?.data?.accessToken || res?.data?.token;

      const refreshToken = res?.refreshToken || res?.data?.refreshToken;

      if (!accessToken) {
        throw new Error(text.tokenError);
      }

      saveTokens(accessToken, refreshToken);
      navigate("/");
    } catch (err) {
      setError(err.message || text.loginError);
    } finally {
      setLoading(false);
    }
  }

  const brandName = store?.storeName || "NemesisBaku";
  const slogan = store?.slogan || "Addımlarınızda premium stil";

  return (
    <main className="min-h-screen bg-[#f5f3f5] px-4 py-6 md:px-6 lg:flex lg:items-center lg:justify-center">
      {(loading || storeLoading) && <AppLoader text={loading ? text.loggingIn : text.loading} />}

      <section className="mx-auto flex w-full max-w-[1120px] overflow-hidden rounded-[24px] bg-white shadow-[0_20px_70px_rgba(0,0,0,0.07)] sm:rounded-[30px] lg:min-h-[650px]">
        <div className="hidden flex-1 bg-[#f5f3f5] p-8 md:flex md:flex-col md:justify-between lg:p-11">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-[16px] bg-white shadow-sm">
                {store?.logoUrl ? (
                  <img
                    src={store.logoUrl}
                    alt={brandName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center font-semibold">
                    N
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold tracking-[-0.035em] text-zinc-950">
                  {brandName}
                </h2>
                <p className="text-sm text-zinc-500">{slogan}</p>
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
            <div className="mb-8 flex items-center gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[18px] border border-zinc-100 bg-zinc-50 shadow-sm">
                {store?.logoUrl ? (
                  <img
                    src={store.logoUrl}
                    alt={brandName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xl font-semibold">
                    N
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-[22px] font-semibold tracking-[-0.035em] text-zinc-950">
                  {brandName}
                </h1>
                <p className="truncate text-sm text-zinc-500">{slogan}</p>
              </div>
            </div>

            <div className="mb-7">
              <h2 className="text-[34px] font-extrabold tracking-[-0.045em] text-zinc-950">
                {text.loginTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {text.loginDesc}
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-[16px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-800">
                  {text.phoneNumber}
                </span>

                <div className="flex h-14 items-center rounded-[14px] border-[1.5px] border-zinc-300 bg-white transition-all duration-300 focus-within:border-zinc-950 focus-within:shadow-[0_0_0_4px_rgba(36,73,137,0.08)]">
                  <div className="flex h-full items-center gap-2 border-r border-zinc-100 px-4 text-sm font-bold text-zinc-900">
                    <FiPhone />
                    +994
                  </div>

                  <input
                    value={phone}
                    onChange={handlePhoneChange}
                    inputMode="numeric"
                    maxLength={9}
                    placeholder={text.phonePlaceholder}
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-[15px] font-medium outline-none placeholder:text-zinc-400"
                  />
                </div>
              </label>

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
                className="h-14 w-full rounded-[14px] bg-[#244989] text-[18px] font-bold text-white transition-all duration-300 hover:translate-y-[-1px] hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
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