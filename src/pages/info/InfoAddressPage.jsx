import { useEffect, useState } from "react";
import {
  FiClock,
  FiExternalLink,
  FiMail,
  FiMapPin,
  FiNavigation,
  FiPhone,
} from "react-icons/fi";
import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { API_BASE_URL } from "../../api/config";
import { useLanguage } from "../../i18n/LanguageContext";

const pageText = {
  az: {
    badge: "ƏLAQƏ & MAĞAZA",
    title: "Əlaqələr və mağazamız",
    desc: "nemesisbaku ilə əlaqə saxlayın, mağaza məlumatlarına baxın və ünvanı xəritədə görüntüləyin.",
    contacts: "Əlaqələr",
    store: "Mağazamız",
    phone: "Telefon",
    whatsapp: "WhatsApp",
    email: "E-mail",
    instagram: "Instagram",
    tiktok: "TikTok",
    address: "Ünvan",
    workHours: "İş saatları",
    mapTitle: "Xəritədə mağaza ünvanı",
    openMap: "Xəritədə aç",
    notAdded: "Əlavə edilməyib",
  },
  en: {
    badge: "CONTACT & STORE",
    title: "Contacts and our store",
    desc: "Contact nemesisbaku, view store information and see the address on the map.",
    contacts: "Contacts",
    store: "Our store",
    phone: "Phone",
    whatsapp: "WhatsApp",
    email: "E-mail",
    instagram: "Instagram",
    tiktok: "TikTok",
    address: "Address",
    workHours: "Working hours",
    mapTitle: "Store address on map",
    openMap: "Open in map",
    notAdded: "Not added",
  },
  ru: {
    badge: "КОНТАКТЫ И МАГАЗИН",
    title: "Контакты и наш магазин",
    desc: "Свяжитесь с nemesisbaku, посмотрите информацию о магазине и адрес на карте.",
    contacts: "Контакты",
    store: "Наш магазин",
    phone: "Телефон",
    whatsapp: "WhatsApp",
    email: "E-mail",
    instagram: "Instagram",
    tiktok: "TikTok",
    address: "Адрес",
    workHours: "Часы работы",
    mapTitle: "Адрес магазина на карте",
    openMap: "Открыть карту",
    notAdded: "Не добавлено",
  },
};

function cleanValue(value) {
  const v = String(value || "").trim();
  if (!v || v.toLowerCase() === "string") return "";
  return v;
}

function DetailRow({ icon, label, value, href }) {
  const inner = (
    <div className="group flex min-w-0 items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-[0_12px_35px_rgba(15,15,15,0.045)] transition duration-500 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,15,15,0.08)] sm:gap-4 sm:rounded-3xl sm:p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3eee7] text-base text-zinc-950 transition duration-500 group-hover:scale-105 sm:h-11 sm:w-11 sm:rounded-2xl sm:text-lg">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-zinc-500 sm:text-[10px] sm:tracking-[0.22em]">
          {label}
        </p>

        <p className="mt-1 max-w-full overflow-hidden break-words text-[13px] font-bold leading-5 text-zinc-950 sm:text-sm sm:leading-6">
          {value}
        </p>
      </div>

      {href && (
        <FiExternalLink className="mt-1 hidden shrink-0 text-zinc-400 transition duration-300 group-hover:text-zinc-950 sm:block" />
      )}
    </div>
  );

  if (!href) return inner;

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="block min-w-0"
    >
      {inner}
    </a>
  );
}

export default function InfoAddressPage() {
  const [store, setStore] = useState(null);
  const { lang } = useLanguage();

  const t = pageText[lang] || pageText.az;

  useEffect(() => {
    let alive = true;

    async function loadStoreInfo() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/StoreInfo`);
        if (!res.ok) throw new Error(`StoreInfo HTTP ${res.status}`);
        const json = await res.json();

        if (alive && json?.success) {
          setStore(json.data);
        }
      } catch (err) {
        console.error("InfoAddress StoreInfo error:", err);
      }
    }

    loadStoreInfo();

    return () => {
      alive = false;
    };
  }, []);

  const parsedLat = Number(store?.latitude);
  const parsedLng = Number(store?.longitude);
  const lat = Number.isFinite(parsedLat) ? parsedLat : 40.376504;
  const lng = Number.isFinite(parsedLng) ? parsedLng : 49.841709;

  const phoneNumber = cleanValue(store?.phoneNumber);
  const whatsAppNumber = cleanValue(store?.whatsAppNumber);
  const email = cleanValue(store?.email);
  const address = cleanValue(store?.address) || t.notAdded;
  const workingHours = cleanValue(store?.workingHours) || t.notAdded;
  const instagramUrl = cleanValue(store?.instagramUrl);
  const tikTokUrl = cleanValue(store?.tikTokUrl);

  const cleanWhatsapp = whatsAppNumber.replace(/\D/g, "");

  const mapUrl = `https://www.google.com/maps?q=${lat},${lng}&z=17&output=embed`;
  const openMapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <section className="min-h-screen overflow-hidden bg-[#fafafa] px-3 py-8 text-zinc-950 sm:px-5 sm:py-10 md:px-7 md:py-12 lg:px-10 lg:py-14">
      <div className="mx-auto max-w-[1320px]">
        <div className="mx-auto max-w-[860px] text-center">
          <span className="inline-flex max-w-full rounded-full border border-zinc-300 bg-white px-3 py-2 text-center text-[9px] font-extrabold uppercase tracking-[0.22em] text-zinc-600 sm:px-4 sm:text-[10px] sm:tracking-[0.28em]">
            {t.badge}
          </span>

          <h1 className="mx-auto mt-4 max-w-[720px] text-[30px] font-extrabold leading-[1.06] tracking-[-0.045em] sm:mt-5 sm:text-[42px] md:text-[52px] lg:text-[62px]">
            {t.title}
          </h1>

          <p className="mx-auto mt-4 max-w-[650px] text-[13px] leading-6 text-zinc-600 sm:mt-5 sm:text-sm sm:leading-7 md:text-base">
            {t.desc}
          </p>
        </div>

        <div className="mt-8 grid min-w-0 gap-4 md:mt-10 md:gap-5 lg:grid-cols-2 lg:gap-6">
          <div
            className="min-w-0 rounded-[28px] border border-zinc-200 bg-[#ffffffcc] p-4 shadow-[0_18px_55px_rgba(15,15,15,0.06)] backdrop-blur-md sm:rounded-[34px] sm:p-5 md:p-6"
            style={{ animation: "infoFade 0.65s ease 0.05s both" }}
          >
            <h2 className="mb-4 text-xl font-extrabold tracking-[-0.04em] sm:mb-5 sm:text-2xl">
              {t.contacts}
            </h2>

            <div className="grid min-w-0 gap-2.5 sm:gap-3">
              <DetailRow
                icon={<FiPhone />}
                label={t.phone}
                value={phoneNumber || t.notAdded}
                href={phoneNumber ? `tel:${phoneNumber}` : null}
              />

              <DetailRow
                icon={<FaWhatsapp />}
                label={t.whatsapp}
                value={whatsAppNumber || t.notAdded}
                href={cleanWhatsapp ? `https://wa.me/${cleanWhatsapp}` : null}
              />

              <DetailRow
                icon={<FiMail />}
                label={t.email}
                value={email || t.notAdded}
                href={email ? `mailto:${email}` : null}
              />

              <DetailRow
                icon={<FaInstagram />}
                label={t.instagram}
                value={instagramUrl || t.notAdded}
                href={instagramUrl || null}
              />

              <DetailRow
                icon={<FaTiktok />}
                label={t.tiktok}
                value={tikTokUrl || t.notAdded}
                href={tikTokUrl || null}
              />
            </div>
          </div>

          <div
            className="min-w-0 rounded-[28px] border border-zinc-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,15,15,0.06)] sm:rounded-[34px] sm:p-5 md:p-6"
            style={{ animation: "infoFade 0.65s ease 0.15s both" }}
          >
            <h2 className="mb-4 text-xl font-extrabold tracking-[-0.04em] sm:mb-5 sm:text-2xl">
              {t.store}
            </h2>

            <div className="grid min-w-0 gap-2.5 sm:gap-3">
              <DetailRow
                icon={<FiMapPin />}
                label={t.address}
                value={address}
                href={openMapUrl}
              />

              <DetailRow
                icon={<FiClock />}
                label={t.workHours}
                value={workingHours}
              />

              <div className="relative mt-1 min-w-0 overflow-hidden rounded-[24px] bg-[#f3eee7] p-4 sm:mt-2 sm:rounded-[30px] sm:p-5">
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/70 blur-2xl" />

                <div className="relative min-w-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-[0_14px_35px_rgba(15,15,15,0.08)] sm:h-13 sm:w-13 sm:text-2xl">
                    <FiNavigation />
                  </div>

                  <h3 className="mt-4 text-lg font-extrabold tracking-[-0.03em] sm:mt-5 sm:text-xl">
                    {t.mapTitle}
                  </h3>

                  <p className="mt-2 break-words text-[13px] font-semibold leading-6 text-zinc-600 sm:text-sm">
                    {address}
                  </p>

                  <a
                    href={openMapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex rounded-2xl bg-[#120d09] px-4 py-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-white transition duration-300 hover:-translate-y-1 hover:bg-zinc-800 sm:mt-5 sm:px-5 sm:text-[10px] sm:tracking-[0.18em]"
                  >
                    {t.openMap}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-5 overflow-hidden rounded-[28px] border border-zinc-200 bg-white p-1.5 shadow-[0_18px_60px_rgba(15,15,15,0.07)] sm:mt-7 sm:rounded-[36px] sm:p-2"
          style={{ animation: "infoFade 0.75s ease 0.25s both" }}
        >
          <div className="px-3 py-3 sm:px-4 sm:py-4">
            <h2 className="text-[11px] font-extrabold uppercase tracking-[0.16em] sm:text-sm sm:tracking-[0.2em]">
              {t.mapTitle}
            </h2>
          </div>

          <iframe
            title="NemesisBaku store map"
            src={mapUrl}
            className="h-[320px] w-full rounded-[24px] border-0 sm:h-[400px] sm:rounded-[30px] md:h-[460px] lg:h-[560px]"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      <style>
        {`
          @keyframes infoFade {
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
