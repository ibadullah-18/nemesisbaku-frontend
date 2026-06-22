import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCcw,
  FiShield,
} from "react-icons/fi";
import { API_BASE_URL } from "../../Api/config";

const text = {
  az: {
    badge: "QAYTARILMA",
    title: "Qaytarılma və dəyişdirilmə qaydaları",
    desc: "Məhsulun qaytarılması, dəyişdirilməsi və yoxlanılması ilə bağlı əsas şərtlər.",
    returnRule: "Qaytarılma",
    exchangeRule: "Dəyişdirilmə",
    exceptions: "İstisnalar",
    process: "Proses",
    notAdded: "Əlavə edilməyib",
  },
  en: {
    badge: "RETURNS",
    title: "Return and exchange policy",
    desc: "Main terms for returning, exchanging and checking products.",
    returnRule: "Return",
    exchangeRule: "Exchange",
    exceptions: "Exceptions",
    process: "Process",
    notAdded: "Not added",
  },
  ru: {
    badge: "ВОЗВРАТ",
    title: "Правила возврата и обмена",
    desc: "Основные условия возврата, обмена и проверки товара.",
    returnRule: "Возврат",
    exchangeRule: "Обмен",
    exceptions: "Исключения",
    process: "Процесс",
    notAdded: "Не добавлено",
  },
};

function getLang() {
  return (
    localStorage.getItem("language") ||
    localStorage.getItem("lang") ||
    localStorage.getItem("nemesis_lang") ||
    "az"
  );
}

function PolicyCard({ icon, title, content, delay }) {
  return (
    <div
      className="rounded-[30px] border border-zinc-200 bg-white p-6 shadow-[0_20px_55px_rgba(15,15,15,0.06)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(15,15,15,0.1)]"
      style={{
        animation: `returnFade 0.65s ease ${delay}s both`,
      }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3eee7] text-xl">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-extrabold tracking-[-0.03em]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-zinc-600">{content}</p>
    </div>
  );
}

export default function ReturnPolicyPage() {
  const [store, setStore] = useState(null);
  const [lang, setLang] = useState(getLang);

  const t = text[lang] || text.az;

  useEffect(() => {
    const syncLang = () => setLang(getLang());

    window.addEventListener("storage", syncLang);
    window.addEventListener("languageChanged", syncLang);

    const interval = setInterval(syncLang, 700);

    return () => {
      window.removeEventListener("storage", syncLang);
      window.removeEventListener("languageChanged", syncLang);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadStoreInfo() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/StoreInfo`);
        const json = await res.json();

        if (alive && json?.success) {
          setStore(json.data);
        }
      } catch (err) {
        console.error("ReturnPolicy StoreInfo error:", err);
      }
    }

    loadStoreInfo();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="min-h-screen bg-[#f8f5f0] px-4 py-10 text-zinc-950 sm:px-6 md:py-14 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="mx-auto max-w-[820px] text-center">
          <span className="inline-flex rounded-full border border-zinc-300 bg-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.28em] text-zinc-600">
            {t.badge}
          </span>

          <h1 className="mt-5 text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[48px] lg:text-[62px]">
            {store?.returnPolicyTitle || t.title}
          </h1>

          <p className="mt-5 text-sm leading-7 text-zinc-600 sm:text-base">
            {t.desc}
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <PolicyCard
            icon={<FiRefreshCcw />}
            title={t.returnRule}
            content={store?.returnPolicyContent || t.notAdded}
            delay={0.05}
          />

          <PolicyCard
            icon={<FiCheckCircle />}
            title={t.exchangeRule}
            content={store?.exchangePolicyContent || t.notAdded}
            delay={0.15}
          />

          <PolicyCard
            icon={<FiAlertCircle />}
            title={t.exceptions}
            content={store?.returnExceptionsContent || t.notAdded}
            delay={0.25}
          />

          <PolicyCard
            icon={<FiShield />}
            title={t.process}
            content={store?.returnProcessContent || t.notAdded}
            delay={0.35}
          />
        </div>
      </div>

      <style>
        {`
          @keyframes returnFade {
            from {
              opacity: 0;
              transform: translateY(18px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </section>
  );
}