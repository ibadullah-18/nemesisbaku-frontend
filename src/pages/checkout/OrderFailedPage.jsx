import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiX } from "react-icons/fi";
import { useLanguage } from "../../i18n/LanguageContext";

export default function OrderFailedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { text } = useLanguage();

  const reason = useMemo(() => {
    if (location.state?.reason) return location.state.reason;

    try {
      return (
        JSON.parse(localStorage.getItem("nemesis_order_failed") || "{}")
          ?.reason || text.orderFailedDefaultReason
      );
    } catch {
      return text.orderFailedDefaultReason;
    }
  }, [location.state, text.orderFailedDefaultReason]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#fafafa] px-5 py-8 md:px-8">
      <section className="w-full max-w-[640px] animate-[failedIn_.45s_cubic-bezier(.22,1,.36,1)_both] rounded-[26px] bg-white p-6 text-center shadow-[0_26px_90px_rgba(0,0,0,0.08)] md:p-8">
        <div className="mx-auto grid h-24 w-24 animate-[failedPop_.75s_cubic-bezier(.22,1,.36,1)_both] place-items-center rounded-full bg-red-50 text-[50px] text-red-600">
          <FiX />
        </div>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
          NemesisBaku
        </p>

        <h1 className="mt-2 text-[34px] font-medium tracking-[-0.055em] text-zinc-950 md:text-[46px]">
          {text.orderFailedTitle}
        </h1>

        <div className="mt-5 rounded-[18px] bg-red-50 px-4 py-4 text-left text-sm font-medium leading-6 text-red-600">
          {reason}
        </div>

        <button
          type="button"
          onClick={() => navigate("/checkout")}
          className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-[14px] bg-zinc-950 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98]"
        >
          <FiArrowLeft />
          {text.backToCheckout}
        </button>
      </section>

      <style>{`
        @keyframes failedIn {
          from { opacity: 0; transform: translateY(22px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes failedPop {
          0% { opacity: 0; transform: scale(.35) rotate(18deg); }
          65% { transform: scale(1.08) rotate(-3deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
      `}</style>
    </main>
  );
}