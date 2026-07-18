import { useEffect, useState } from "react";
import {
  FiAward,
  FiCheckCircle,
  FiEye,
  FiShield,
  FiTarget,
  FiTruck,
} from "react-icons/fi";
import { API_BASE_URL } from "../../api/config";
import { useLanguage } from "../../i18n/LanguageContext";

const pageText = {
  az: {
    badge: "HAQQIMIZDA",
    title: "nemesisbaku haqqında",
    desc: "Premium sneaker mədəniyyəti, minimalist seçim və yüksək xidmət standartı.",
    mission: "Missiyamız",
    vision: "Vizyonumuz",
    why: "Niyə nemesisbaku?",
    premium: "Premium kolleksiya",
    original: "Seçilmiş məhsullar",
    delivery: "Sürətli çatdırılma",
    support: "Fərdi yanaşma",
    notAdded: "Əlavə edilməyib",
  },
  en: {
    badge: "ABOUT US",
    title: "About nemesisbaku",
    desc: "Premium sneaker culture, minimalist selection and high service standards.",
    mission: "Our Mission",
    vision: "Our Vision",
    why: "Why nemesisbaku?",
    premium: "Premium collection",
    original: "Selected products",
    delivery: "Fast delivery",
    support: "Personal approach",
    notAdded: "Not added",
  },
  ru: {
    badge: "О НАС",
    title: "О nemesisbaku",
    desc: "Премиальная sneaker-культура, минималистичный выбор и высокий уровень сервиса.",
    mission: "Наша миссия",
    vision: "Наше видение",
    why: "Почему nemesisbaku?",
    premium: "Премиальная коллекция",
    original: "Избранные товары",
    delivery: "Быстрая доставка",
    support: "Индивидуальный подход",
    notAdded: "Не добавлено",
  },
};

function BigInfoCard({ icon, title, content, delay }) {
  return (
    <div
      className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,15,15,0.06)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,15,15,0.1)] sm:p-7"
      style={{ animation: `aboutFade 0.65s ease ${delay}s both` }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fafafa] text-xl">
        {icon}
      </div>
      <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.04em]">
        {title}
      </h3>
      <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-[15px]">
        {content}
      </p>
    </div>
  );
}

function MiniItem({ icon, label, delay }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(15,15,15,0.05)]"
      style={{ animation: `aboutFade 0.65s ease ${delay}s both` }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3eee7] text-lg">
        {icon}
      </div>
      <span className="text-sm font-extrabold text-zinc-950">{label}</span>
    </div>
  );
}

export default function AboutPage() {
  const [store, setStore] = useState(null);
  const { lang } = useLanguage();
  const t = pageText[lang] || pageText.az;

  useEffect(() => {
    const controller = new AbortController();

    async function loadStoreInfo() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/StoreInfo`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`StoreInfo HTTP ${res.status}`);

        const json = await res.json();
        if (!controller.signal.aborted && json?.success) setStore(json.data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("About StoreInfo error:", err);
        }
      }
    }

    loadStoreInfo();
    return () => controller.abort();
  }, []);

  return (
    <section className="min-h-screen bg-[#fafafa] px-4 py-10 text-zinc-950 sm:px-6 md:py-14 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="animate-[aboutFade_0.55s_ease_both]">
            <span className="inline-flex rounded-full border border-zinc-300 bg-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.28em] text-zinc-600">
              {t.badge}
            </span>
            <h1 className="mt-5 max-w-[760px] text-[34px] font-extrabold leading-[1.04] tracking-[-0.05em] sm:text-[48px] lg:text-[64px]">
              {store?.aboutTitle || t.title}
            </h1>
          </div>

          <div className="animate-[aboutFade_0.7s_ease_both] rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,15,15,0.06)]">
            <p className="text-sm leading-7 text-zinc-600 sm:text-[15px]">
              {store?.aboutContent || t.desc}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <BigInfoCard
            icon={<FiTarget />}
            title={t.mission}
            content={store?.missionContent || t.notAdded}
            delay={0.1}
          />
          <BigInfoCard
            icon={<FiEye />}
            title={t.vision}
            content={store?.visionContent || t.notAdded}
            delay={0.2}
          />
        </div>

        <div
          className="mt-8 overflow-hidden rounded-[36px] border border-zinc-200 bg-white shadow-[0_26px_75px_rgba(15,15,15,0.08)]"
          style={{ animation: "aboutFade 0.75s ease 0.25s both" }}
        >
          <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="bg-[#120d09] p-7 text-white sm:p-9">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                <FiAward />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
                {t.why}
              </h2>
              <p className="mt-5 text-sm leading-7 text-white/70">
                {store?.whyChooseUsContent || t.notAdded}
              </p>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
              <MiniItem icon={<FiAward />} label={t.premium} delay={0.35} />
              <MiniItem icon={<FiShield />} label={t.original} delay={0.45} />
              <MiniItem icon={<FiTruck />} label={t.delivery} delay={0.55} />
              <MiniItem
                icon={<FiCheckCircle />}
                label={t.support}
                delay={0.65}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes aboutFade {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
