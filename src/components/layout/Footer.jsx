import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiFacebook,
  FiInstagram,
  FiMail,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";
import { FaTiktok, FaWhatsapp } from "react-icons/fa";
import { API_BASE_URL } from "../../Api/config";

const footerText = {
  az: {
    customer: "MÜŞTƏRİ",
    company: "ŞİRKƏT",
    subscribeTitle: "Yeniliklərdən Xəbərdar Ol",
    subscribeText: "Ən son kolleksiya və endirimlər üçün abunə olun.",
    emailPlaceholder: "E-mail ünvanınız",
    subscribe: "ABUNƏ OL",
    contact: "Əlaqə & Ünvanlar",
    delivery: "Çatdırılma",
    returns: "Qaytarılma",
    about: "Haqqımızda",
    career: "Karyera",
    stores: "Mağazalarımız",
    rights: "Bütün hüquqlar qorunur.",
    siteBy: "SITE BY HÜSEYNZADƏ",
  },
  en: {
    customer: "CUSTOMER",
    company: "COMPANY",
    subscribeTitle: "Stay Updated",
    subscribeText: "Subscribe for latest collections and discounts.",
    emailPlaceholder: "Your e-mail address",
    subscribe: "SUBSCRIBE",
    contact: "Contact & Addresses",
    delivery: "Delivery",
    returns: "Returns",
    about: "About Us",
    career: "Career",
    stores: "Our Stores",
    rights: "All rights reserved.",
    siteBy: "SITE BY HUSEYNZADE",
  },
  ru: {
    customer: "КЛИЕНТ",
    company: "КОМПАНИЯ",
    subscribeTitle: "Будьте в курсе новостей",
    subscribeText: "Подпишитесь на новые коллекции и скидки.",
    emailPlaceholder: "Ваш e-mail",
    subscribe: "ПОДПИСАТЬСЯ",
    contact: "Контакты и адреса",
    delivery: "Доставка",
    returns: "Возврат",
    about: "О нас",
    career: "Карьера",
    stores: "Наши магазины",
    rights: "Все права защищены.",
    siteBy: "SITE BY HUSEYNZADE",
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

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group relative w-fit text-[13px] text-zinc-300 transition duration-300 hover:translate-x-1 hover:text-white"
    >
      {children}
      <span className="absolute -bottom-1 left-0 h-px w-0 bg-white transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

export default function Footer() {
  const [store, setStore] = useState(null);
  const [lang, setLang] = useState(getLang);
  const [email, setEmail] = useState("");

  const t = footerText[lang] || footerText.az;

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
        console.error("Footer StoreInfo error:", err);
      }
    }

    loadStoreInfo();

    return () => {
      alive = false;
    };
  }, []);

  const storeName = store?.storeName || "nemesisbaku";

  const socials = useMemo(
    () => [
      {
        icon: <FiInstagram />,
        url: store?.instagramUrl,
        label: "Instagram",
      },
      {
        icon: <FaTiktok />,
        url: store?.tikTokUrl,
        label: "TikTok",
      },
      {
        icon: <FiFacebook />,
        url: store?.facebookUrl,
        label: "Facebook",
      },
      {
        icon: <FaWhatsapp />,
        url: store?.whatsAppNumber
          ? `https://wa.me/${store.whatsAppNumber.replace(/\D/g, "")}`
          : null,
        label: "WhatsApp",
      },
    ],
    [store]
  );

  function handleSubscribe(e) {
    e.preventDefault();
    setEmail("");
  }

  return (
    <footer className="mt-10 border-t border-white/10 bg-[#050505] text-white">
      <div className="mx-auto max-w-[1420px] px-5 py-9 sm:px-7 md:py-11 lg:px-10">
        <div className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-[1.15fr_0.65fr_0.65fr_1.2fr] lg:gap-12">
          <div className="animate-[footerFade_0.55s_ease_both] text-center md:text-left">
            <Link
              to="/"
              className="mx-auto inline-flex items-center md:mx-0"
            >
              {store?.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={storeName}
                draggable={false}
                className="
                  block
                  h-auto
                  w-[112px]
                  sm:w-[120px]
                  md:w-[128px]
                  lg:w-[135px]
                  object-contain
                  rounded-[10px]
                  select-none
                  transition-all
                  duration-300
                  hover:scale-[1.02]
                "
              />
              ) : (
                <span className="text-base font-extrabold tracking-[0.08em] text-zinc-950">
                  {storeName}
                </span>
              )}
            </Link>

            <p className="mx-auto mt-5 max-w-[360px] text-[13px] leading-6 text-zinc-300 md:mx-0">
              {store?.aboutContent ||
                "Premium sneaker kolleksiyaları və minimalist seçim təcrübəsi."}
            </p>

            <div className="mt-6 flex items-center justify-center gap-5 text-[19px] text-white md:justify-start">
              {socials
                .filter((x) => x.url)
                .map((item) => (
                  <a
                    key={item.label}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className="text-white transition duration-300 hover:-translate-y-1 hover:text-zinc-300"
                  >
                    {item.icon}
                  </a>
                ))}
            </div>

            <div className="mt-5 space-y-2 text-[13px] text-zinc-300">
              {store?.phoneNumber && (
                <a
                  href={`tel:${store.phoneNumber}`}
                  className="flex items-center justify-center gap-2 transition duration-300 hover:text-white md:justify-start"
                >
                  <FiPhone className="text-white" /> {store.phoneNumber}
                </a>
              )}

              {store?.email && (
                <a
                  href={`mailto:${store.email}`}
                  className="flex items-center justify-center gap-2 transition duration-300 hover:text-white md:justify-start"
                >
                  <FiMail className="text-white" /> {store.email}
                </a>
              )}

              {store?.address && store.address !== "string" && (
                <div className="flex items-center justify-center gap-2 md:justify-start">
                  <FiMapPin className="text-white" /> {store.address}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:contents">
            <div className="animate-[footerFade_0.65s_ease_both]">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.04em] text-white">
                {t.customer}
              </h3>

              <nav className="mt-5 flex flex-col gap-3">
                <FooterLink to="/infoAddress">{t.contact}</FooterLink>
                <FooterLink to="/delivery">{t.delivery}</FooterLink>
                <FooterLink to="/return-policy">{t.returns}</FooterLink>
              </nav>
            </div>

            <div className="animate-[footerFade_0.75s_ease_both]">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.04em] text-white">
                {t.company}
              </h3>

              <nav className="mt-5 flex flex-col gap-3">
                <FooterLink to="/about">{t.about}</FooterLink>
                <FooterLink to="/career">{t.career}</FooterLink>
                <FooterLink to="/stores">{t.stores}</FooterLink>
              </nav>
            </div>
          </div>

          <div className="animate-[footerFade_0.85s_ease_both]">
            <h3 className="text-sm font-extrabold text-white md:text-base">
              {t.subscribeTitle}
            </h3>

            <p className="mt-5 text-[13px] leading-6 text-zinc-300">
              {t.subscribeText}
            </p>

            <form
              onSubmit={handleSubscribe}
              className="mt-4 flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/10 p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur"
            >
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder={t.emailPlaceholder}
                className="h-11 min-w-0 flex-1 bg-transparent px-3 text-[13px] text-white outline-none placeholder:text-zinc-400"
              />

              <button
                type="submit"
                className="h-11 shrink-0 rounded-xl bg-white px-4 text-[10px] font-extrabold uppercase leading-4 text-zinc-950 transition duration-300 hover:-translate-y-0.5 hover:bg-zinc-200 sm:px-6"
              >
                {t.subscribe}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-9 border-t border-white/10 pt-6 text-center">
          <p className="text-[12px] text-zinc-300">
            © 2026 {storeName}. {t.rights}
          </p>

          <a
            href="https://www.linkedin.com/in/ibadulla-huseynzade/"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-[9px] font-extrabold uppercase tracking-[0.26em] text-zinc-400 transition duration-300 hover:text-white"
          >
            {t.siteBy}
          </a>
        </div>
      </div>

      <style>
        {`
          @keyframes footerFade {
            from {
              opacity: 0;
              transform: translateY(14px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </footer>
  );
}