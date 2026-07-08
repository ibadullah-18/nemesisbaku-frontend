import { useEffect, useState } from "react";
import { FiCheckCircle, FiClock, FiCreditCard, FiMapPin, FiTruck } from "react-icons/fi";
import { API_BASE_URL } from "../../api/config";

const text = {
  az: {
    badge: "ÇATDIRILMA",
    title: "Çatdırılma qaydaları",
    desc: "Sifarişləriniz təhlükəsiz və vaxtında çatdırılır.",
    baku: "Bakı",
    absheron: "Abşeron & Sumqayıt",
    regions: "Rayonlar",
    payment: "Ödəniş və yoxlama",
    mainInfo: "Əsas məlumat",
    notAdded: "Əlavə edilməyib",
  },
  en: {
    badge: "DELIVERY",
    title: "Delivery policy",
    desc: "Your orders are delivered safely and on time.",
    baku: "Baku",
    absheron: "Absheron & Sumgait",
    regions: "Regions",
    payment: "Payment and check",
    mainInfo: "Main information",
    notAdded: "Not added",
  },
  ru: {
    badge: "ДОСТАВКА",
    title: "Правила доставки",
    desc: "Ваши заказы доставляются безопасно и вовремя.",
    baku: "Баку",
    absheron: "Абшерон и Сумгаит",
    regions: "Регионы",
    payment: "Оплата и проверка",
    mainInfo: "Основная информация",
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

function DeliveryCard({ icon, title, text, delay }) {
  return (
    <div
      className="rounded-[30px] border border-zinc-200 bg-white p-6 shadow-[0_20px_55px_rgba(15,15,15,0.06)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(15,15,15,0.1)]"
      style={{
        animation: `deliveryFade 0.65s ease ${delay}s both`,
      }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3eee7] text-xl">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-extrabold tracking-[-0.03em]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-zinc-600">{text}</p>
    </div>
  );
}

export default function DeliveryPage() {
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
        console.error("Delivery StoreInfo error:", err);
      }
    }

    loadStoreInfo();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="min-h-screen bg-[#fafafa] px-4 py-10 text-zinc-950 sm:px-6 md:py-14 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="mx-auto max-w-[790px] text-center">
          <span className="inline-flex rounded-full border border-zinc-300 bg-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.28em] text-zinc-600">
            {t.badge}
          </span>

          <h1 className="mt-5 text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[48px] lg:text-[62px]">
            {store?.deliveryTitle || t.title}
          </h1>

          <p className="mt-5 text-sm leading-7 text-zinc-600 sm:text-base">
            {store?.deliveryContent || t.desc}
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <DeliveryCard
            icon={<FiMapPin />}
            title={t.baku}
            text={store?.deliveryBakuText || t.notAdded}
            delay={0.05}
          />

          <DeliveryCard
            icon={<FiTruck />}
            title={t.absheron}
            text={store?.deliveryAbsheronSumgaitText || t.notAdded}
            delay={0.15}
          />

          <DeliveryCard
            icon={<FiClock />}
            title={t.regions}
            text={store?.deliveryRegionsText || t.notAdded}
            delay={0.25}
          />

          <DeliveryCard
            icon={<FiCreditCard />}
            title={t.payment}
            text={store?.paymentAndCheckText || t.notAdded}
            delay={0.35}
          />
        </div>

        <div className="mt-8 rounded-[34px] border border-zinc-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,15,15,0.07)] sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[0.55fr_1fr] lg:items-center">
            <div>
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#f3eee7] text-2xl">
                <FiCheckCircle />
              </div>

              <h2 className="mt-5 text-2xl font-extrabold tracking-[-0.03em]">
                {t.mainInfo}
              </h2>
            </div>

            <p className="text-sm leading-7 text-zinc-600 sm:text-base">
              {store?.deliveryContent || t.desc}
            </p>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes deliveryFade {
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