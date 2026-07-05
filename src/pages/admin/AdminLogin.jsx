import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { FiEye, FiEyeOff, FiLock, FiPhone } from "react-icons/fi";
import { loginForPanel } from "../../api/admin/adminAuth";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [emailOrPhoneNumber, setEmailOrPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("error");
  const [toastVisible, setToastVisible] = useState(false);

  function showToast(message, type = "error") {
    setToast(message);
    setToastType(type);
    setToastVisible(true);

    setTimeout(() => {
      setToastVisible(false);
    }, 2600);

    setTimeout(() => {
      setToast("");
    }, 3000);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!emailOrPhoneNumber.trim() || !password.trim()) {
      showToast("Email/telefon və şifrə daxil et");
      return;
    }

    try {
      setLoading(true);

      await loginForPanel(emailOrPhoneNumber.trim(), password, "admin");

      showToast("Giriş uğurludur", "success");

      setTimeout(() => {
        navigate("/Admin/orders", { replace: true });
      }, 500);
    } catch (err) {
      showToast(err?.message || "Giriş uğursuz oldu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f4f0] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1180px] items-center justify-center">
        <div className="w-full max-w-[430px] rounded-[32px] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-8">
          <div className="mb-8 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#244989]">
              NemesisBaku
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-zinc-950">
              Admin giriş
            </h1>

            <p className="mt-2 text-sm font-medium text-zinc-500">
              Panelə daxil olmaq üçün məlumatları yaz
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-zinc-500">
                Email və ya telefon
              </span>

              <div className="flex h-14 items-center gap-3 rounded-[18px] border border-zinc-200 bg-zinc-50 px-4 focus-within:border-[#244989] focus-within:bg-white">
                <FiPhone className="text-lg text-zinc-400" />

                <input
                  value={emailOrPhoneNumber}
                  onChange={(e) => setEmailOrPhoneNumber(e.target.value)}
                  placeholder="admin@gmail.com və ya 994..."
                  className="h-full flex-1 bg-transparent text-sm font-bold text-zinc-950 outline-none placeholder:text-zinc-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-zinc-500">
                Şifrə
              </span>

              <div className="flex h-14 items-center gap-3 rounded-[18px] border border-zinc-200 bg-zinc-50 px-4 focus-within:border-[#244989] focus-within:bg-white">
                <FiLock className="text-lg text-zinc-400" />

                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPass ? "text" : "password"}
                  placeholder="Şifrən"
                  className="h-full flex-1 bg-transparent text-sm font-bold text-zinc-950 outline-none placeholder:text-zinc-400"
                />

                {password && (
                  <button
                    type="button"
                    onClick={() => setShowPass((prev) => !prev)}
                    className="grid h-9 w-9 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100"
                  >
                    {showPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                )}
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-14 w-full rounded-[18px] bg-zinc-950 text-sm font-extrabold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Yoxlanılır..." : "Daxil ol"}
            </button>
          </form>
        </div>
      </div>

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
    </div>
  );
}