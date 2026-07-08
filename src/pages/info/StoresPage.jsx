import { useEffect, useState } from "react";
import {
  FiClock,
  FiExternalLink,
  FiMapPin,
  FiNavigation,
  FiPhone,
} from "react-icons/fi";
import { API_BASE_URL } from "../../api/config";

const text = {
  az: {
    badge: "MAĞAZAMIZ",
    title: "nemesisbaku mağazası",
    desc: "Mağazamızın ünvanı, iş saatları və xəritədə dəqiq yeri.",
    mainStore: "Əsas mağaza",
    address: "Ünvan",
    phone: "Telefon",
    workHours: "İş saatları",
    map: "Xəritə",
    openMap: "Google Maps-də aç",
    notAdded: "Əlavə edilməyib",
  },
  en: {
    badge: "OUR STORE",
    title: "nemesisbaku store",
    desc: "Store address, working hours and exact location on the map.",
    mainStore: "Main store",
    address: "Address",
    phone: "Phone",
    workHours: "Working hours",
    map: "Map",
    openMap: "Open in Google Maps",
    notAdded: "Not added",
  },
  ru: {
    badge: "МАГАЗИН",
    title: "Магазин nemesisbaku",
    desc: "Адрес магазина, часы работы и точное местоположение на карте.",
    mainStore: "Основной магазин",
    address: "Адрес",
    phone: "Телефон",
    workHours: "Часы работы",
    map: "Карта",
    openMap: "Открыть в Google Maps",
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

function StoreInfoRow({ icon, label, value, href }) {
  const content = (
    <div className="group flex items-start gap-4 rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_16px_45px_rgba(15,15,15,0.05)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,15,15,0.09)]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f3eee7] text-lg">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-zinc-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-bold leading-6 text-zinc-950">
          {value}
        </p>
      </div>

      {href && (
        <FiExternalLink className="mt-1 shrink-0 text-zinc-400 transition duration-300 group-hover:text-zinc-950" />
      )}
    </div>
  );

  if (!href) return content;

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
    >
      {content}
    </a>
  );
}

export default function StoresPage() {
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
        console.error("Stores StoreInfo error:", err);
      }
    }

    loadStoreInfo();

    return () => {
      alive = false;
    };
  }, []);

  const lat = Number(store?.latitude || 40.376504);
  const lng = Number(store?.longitude || 49.841709);
  const addressIsValid = store?.address && store.address !== "string";

  const openMapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const mapUrl = `https://www.google.com/maps?q=${lat},${lng}&z=17&output=embed`;

  return (
    <section className="min-h-screen bg-[#fafafa] px-4 py-10 text-zinc-950 sm:px-6 md:py-14 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="mx-auto max-w-[820px] text-center">
          <span className="inline-flex rounded-full border border-zinc-300 bg-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.28em] text-zinc-600">
            {t.badge}
          </span>

          <h1 className="mt-5 text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[48px] lg:text-[62px]">
            {t.title}
          </h1>

          <p className="mx-auto mt-5 max-w-[620px] text-sm leading-7 text-zinc-600 sm:text-base">
            {t.desc}
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div
            className="rounded-[36px] border border-zinc-200 bg-white p-6 shadow-[0_24px_75px_rgba(15,15,15,0.08)]"
            style={{ animation: "storesFade 0.65s ease both" }}
          >
            <div className="relative overflow-hidden rounded-[30px] bg-[#120d09] p-6 text-white">
              <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/20 blur-3xl" />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                  <FiMapPin />
                </div>

                <p className="mt-6 text-[15px] font-extrabold tracking-[0.17em] text-white/60">
                  nemesisbaku
                </p>

                <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.05em]">
                  {t.mainStore}
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <StoreInfoRow
                icon={<FiMapPin />}
                label={t.address}
                value={addressIsValid ? store.address : `${lat}, ${lng}`}
                href={openMapUrl}
              />

              <StoreInfoRow
                icon={<FiClock />}
                label={t.workHours}
                value={store?.workingHours || t.notAdded}
              />

              <StoreInfoRow
                icon={<FiPhone />}
                label={t.phone}
                value={store?.phoneNumber || t.notAdded}
                href={store?.phoneNumber ? `tel:${store.phoneNumber}` : null}
              />

              <a
                href={openMapUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#120d09] px-6 py-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white transition duration-300 hover:-translate-y-1 hover:bg-zinc-800"
              >
                <FiNavigation />
                {t.openMap}
              </a>
            </div>
          </div>

          <div
            className="overflow-hidden rounded-[36px] border border-zinc-200 bg-white p-2 shadow-[0_24px_75px_rgba(15,15,15,0.08)]"
            style={{ animation: "storesFade 0.75s ease 0.12s both" }}
          >
            <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.2em]">
                {t.map}
              </h2>

              <span className="text-[11px] font-bold text-zinc-500">
                {lat}, {lng}
              </span>
            </div>

            <iframe
              title="nemesisbaku store map"
              src={mapUrl}
              className="h-[430px] w-full rounded-[30px] border-0 sm:h-[500px] lg:h-[620px]"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes storesFade {
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