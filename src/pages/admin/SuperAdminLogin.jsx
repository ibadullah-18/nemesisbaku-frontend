import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLock, FiPhone } from "react-icons/fi";
import { adminLogin } from "../../api/admin/adminAuth";
import AppLoader from "../../components/common/AppLoader";

export default function SuperAdminLogin() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handlePhoneChange(e) {
    const onlyNumbers = e.target.value.replace(/\D/g, "").slice(0, 9);
    setPhone(onlyNumbers);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (phone.length !== 9) {
      setError("Telefon nömrəsi 9 rəqəm olmalıdır");
      return;
    }

    if (!password.trim()) {
      setError("Şifrə daxil edilməlidir");
      return;
    }

    try {
      setLoading(true);

      await adminLogin(`994${phone}`, password);

      navigate("/SuperAdmin/dashboard");
    } catch (err) {
      setError(err.message || "Giriş zamanı xəta baş verdi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f1ec] px-4 py-6 lg:flex lg:items-center lg:justify-center">
      {loading && <AppLoader text="Admin yoxlanılır" />}

      <section className="mx-auto grid w-full max-w-[1040px] overflow-hidden rounded-[34px] bg-white shadow-[0_28px_90px_rgba(0,0,0,0.08)] lg:grid-cols-[1fr_440px]">
        <div className="hidden bg-zinc-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-white/45">
              NemesisBaku Admin
            </p>

            <h1 className="mt-6 max-w-[460px] text-[56px] font-extrabold leading-[0.95] tracking-[-0.055em]">
              Mağazanı rahat idarə et.
            </h1>

            <p className="mt-5 max-w-[420px] text-sm leading-7 text-white/60">
              Məhsullar, stoklar, sifarişlər, kampaniyalar və mağaza ayarları
              üçün SuperAdmin panel.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold text-white/70">
              Yalnız SuperAdmin rolu olan hesab daxil ola bilər.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mb-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
              /SuperAdmin
            </p>

            <h2 className="mt-3 text-[34px] font-extrabold tracking-[-0.045em] text-zinc-950">
              Admin giriş
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Panelə daxil olmaq üçün SuperAdmin nömrəsi və şifrəsini yazın.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">
                Telefon nömrəsi
              </span>

              <div className="flex h-14 items-center rounded-[16px] border border-zinc-200 bg-zinc-50 transition focus-within:border-zinc-950">
                <div className="flex h-full items-center gap-2 border-r border-zinc-200 px-4 text-sm font-extrabold text-zinc-900">
                  <FiPhone />
                  +994
                </div>

                <input
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="50 615 13 45"
                  inputMode="numeric"
                  maxLength={9}
                  className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-bold outline-none placeholder:text-zinc-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">
                Şifrə
              </span>

              <div className="flex h-14 items-center gap-3 rounded-[16px] border border-zinc-200 bg-zinc-50 px-4 transition focus-within:border-zinc-950">
                <FiLock className="text-zinc-500" />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Məsələn: Ibo!2007"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400"
                />
              </div>
            </label>

            <button
              disabled={loading}
              className="h-14 w-full rounded-[16px] bg-[#244989] text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
            >
              Panelə daxil ol
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}