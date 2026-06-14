import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiHome, FiPackage } from "react-icons/fi";
import { useLanguage } from "../../i18n/LanguageContext";

function money(v) {
  return Number(v || 0).toFixed(2).replace(".00", "");
}

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const { text } = useLanguage();

  const order = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("nemesis_last_order") || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#fafafa] px-5 py-8">
      <section className="w-full max-w-[620px] animate-[successIn_.45s_cubic-bezier(.22,1,.36,1)_both] rounded-[26px] bg-white p-6 text-center shadow-[0_26px_90px_rgba(0,0,0,0.08)] md:p-8">
        <div className="mx-auto grid h-24 w-24 animate-[successPop_.7s_cubic-bezier(.22,1,.36,1)_both] place-items-center rounded-full bg-green-50 text-[48px] text-green-600">
          <FiCheck />
        </div>

        <p className="mt-6 text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
          NemesisBaku
        </p>

        <h1 className="mt-2 text-[34px] font-medium tracking-[-0.055em] text-zinc-950 md:text-[46px]">
          {text.orderSuccessTitle}
        </h1>

        <p className="mx-auto mt-3 max-w-[420px] text-sm leading-6 text-zinc-500">
          {text.orderSuccessDesc}
        </p>

        {order && (
          <div className="mt-6 rounded-[18px] bg-zinc-50 p-4 text-left">
            <Row label={text.orderNumber} value={order.orderNumber || "-"} />
            <Row
              label={text.productsTotal}
              value={`${money(order.totalProductPrice)} ₼`}
            />
            <Row label={text.delivery} value={`${money(order.deliveryPrice)} ₼`} />
            <Row
              label={text.promoDiscount}
              value={`-${money(order.promoDiscountAmount)} ₼`}
              danger
            />
            <div className="my-3 h-px bg-zinc-200/70" />
            <Row label={text.total} value={`${money(order.totalPrice)} ₼`} big />
          </div>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <button
            onClick={() => navigate("/orders")}
            className="inline-flex h-13 items-center justify-center gap-2 rounded-[14px] bg-zinc-950 text-sm font-medium text-white transition active:scale-[0.98]"
          >
            <FiPackage />
            {text.myOrders}
          </button>

          <button
            onClick={() => navigate("/")}
            className="inline-flex h-13 items-center justify-center gap-2 rounded-[14px] bg-zinc-50 text-sm font-medium text-zinc-950 transition active:scale-[0.98]"
          >
            <FiHome />
            {text.close}
          </button>
        </div>
      </section>

      <style>{`
        @keyframes successIn {
          from { opacity: 0; transform: translateY(22px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes successPop {
          0% { opacity: 0; transform: scale(.4) rotate(-16deg); }
          65% { transform: scale(1.08) rotate(3deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
      `}</style>
    </main>
  );
}

function Row({ label, value, danger, big }) {
  return (
    <div className="flex items-center justify-between py-2">
      <p className="text-sm text-zinc-500">{label}</p>
      <p
        className={`${big ? "text-xl" : "text-sm"} font-medium ${
          danger ? "text-red-500" : "text-zinc-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}