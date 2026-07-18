import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCreditCard,
  FiExternalLink,
  FiGift,
  FiShield,
  FiSmartphone,
} from "react-icons/fi";
import loyaltyIntroImage from "../../assets/loyalli3.png";
import loyaltyRegistrationImage from "../../assets/loyalliq1.png";
import loyaltyWalletImage from "../../assets/loyalliq4.png";
import { useLanguage } from "../../i18n/LanguageContext";

const WALLET_PLUS_URL = "https://nemesisbaku.walletplus.az/";

const loyaltyTranslations = {
  az: {
    back: "Profilə qayıt",
    badge: "nemesisbaku loyallıq",
    title: "Hər alışda 5% cashback qazan.",
    description:
      "nemesisbaku loyallıq kartını yaradın, alışlardan cashback toplayın və rəqəmsal kartınızı telefonunuzda saxlayın.",
    benefits: [
      "Hər məhsul alışında 5% cashback",
      "Apple Wallet və Google Wallet dəstəyi",
      "Kart və cashback məlumatlarına rahat çıxış",
    ],
    howTitle: "Kartı necə əlavə etməli?",
    howDescription: "WalletPlus qeydiyyatı bir neçə sadə mərhələdən ibarətdir.",
    process: [
      "WalletPlus səhifəsinə keçin",
      "WhatsApp nömrənizi yazıb şərtləri qəbul edin",
      "Ad, doğum tarixi və digər məlumatları tamamlayın",
      "Yaradılan kartı telefonunuzun Wallet tətbiqinə əlavə edin",
    ],
    steps: [
      {
        eyebrow: "ÜSTÜNLÜKLƏR",
        title: "Yeni loyallıq və cashback sistemi",
        description:
          "Kartla hər məhsul alışında 5% cashback əldə edə bilərsiniz. Rəqəmsal kart Apple Wallet və Google Wallet ilə işləyir.",
      },
      {
        eyebrow: "QEYDİYYAT",
        title: "Əlaqə nömrənizlə karta qoşulun",
        description:
          "Açılan WalletPlus səhifəsində WhatsApp nömrənizi daxil edin, qayda və şərtləri qəbul edin. Sonra şəxsi məlumatlarınızı tamamlayıb karta qoşulun.",
      },
      {
        eyebrow: "WALLET",
        title: "Kartı telefonunuza əlavə edin",
        description:
          "Kart yaradıldıqdan sonra onu Apple Wallet və ya Google Wallet-a əlavə edin. Beləliklə kart və QR məlumatınız həmişə telefonunuzda olacaq.",
      },
    ],
    privacyTitle: "Təhlükəsiz keçid",
    privacyText:
      "Qeydiyyat nemesisbaku üçün yaradılmış WalletPlus səhifəsində aparılır. Davam etməzdən əvvəl göstərilən qayda və şərtləri oxuyun.",
    ctaBadge: "5% CASHBACK",
    ctaTitle: "Loyallıq kartınızı yaratmağa hazırsınız?",
    ctaDescription:
      "WalletPlus səhifəsinə keçin, məlumatlarınızı tamamlayın və kartı telefonunuza əlavə edin.",
    cta: "Loyallıq kartı əlavə et",
    external: "Xarici WalletPlus səhifəsində açılacaq",
    imageAlt: "nemesisbaku loyallıq kartı təlimatı",
  },
  en: {
    back: "Back to profile",
    badge: "nemesisbaku loyalty",
    title: "Earn 5% cashback on every purchase.",
    description:
      "Create your nemesisbaku loyalty card, collect cashback from purchases and keep the digital card on your phone.",
    benefits: [
      "5% cashback on every product purchase",
      "Apple Wallet and Google Wallet support",
      "Easy access to card and cashback information",
    ],
    howTitle: "How do I add the card?",
    howDescription: "WalletPlus registration takes only a few simple steps.",
    process: [
      "Open the WalletPlus page",
      "Enter your WhatsApp number and accept the terms",
      "Complete your name, birth date and other information",
      "Add the generated card to your phone's Wallet app",
    ],
    steps: [
      {
        eyebrow: "BENEFITS",
        title: "A new loyalty and cashback system",
        description:
          "Earn 5% cashback on every product purchase. The digital card works with Apple Wallet and Google Wallet.",
      },
      {
        eyebrow: "REGISTRATION",
        title: "Join with your contact number",
        description:
          "On the WalletPlus page, enter your WhatsApp number and accept the terms. Then complete your personal details and join the card.",
      },
      {
        eyebrow: "WALLET",
        title: "Add the card to your phone",
        description:
          "Once the card is created, add it to Apple Wallet or Google Wallet so your card and QR information are always on your phone.",
      },
    ],
    privacyTitle: "Secure handoff",
    privacyText:
      "Registration takes place on the WalletPlus page created for nemesisbaku. Read the displayed terms before continuing.",
    ctaBadge: "5% CASHBACK",
    ctaTitle: "Ready to create your loyalty card?",
    ctaDescription:
      "Open WalletPlus, complete your information and add the card to your phone.",
    cta: "Add loyalty card",
    external: "Opens on the external WalletPlus page",
    imageAlt: "nemesisbaku loyalty card guide",
  },
  ru: {
    back: "Вернуться в профиль",
    badge: "программа лояльности nemesisbaku",
    title: "Получайте 5% кешбэка с каждой покупки.",
    description:
      "Создайте карту лояльности nemesisbaku, накапливайте кешбэк и храните цифровую карту в телефоне.",
    benefits: [
      "5% кешбэка с каждой покупки товара",
      "Поддержка Apple Wallet и Google Wallet",
      "Удобный доступ к карте и данным о кешбэке",
    ],
    howTitle: "Как добавить карту?",
    howDescription:
      "Регистрация в WalletPlus состоит из нескольких простых шагов.",
    process: [
      "Перейдите на страницу WalletPlus",
      "Введите номер WhatsApp и примите условия",
      "Заполните имя, дату рождения и остальные данные",
      "Добавьте созданную карту в Wallet на телефоне",
    ],
    steps: [
      {
        eyebrow: "ПРЕИМУЩЕСТВА",
        title: "Новая система лояльности и кешбэка",
        description:
          "Получайте 5% кешбэка с каждой покупки товара. Цифровая карта работает с Apple Wallet и Google Wallet.",
      },
      {
        eyebrow: "РЕГИСТРАЦИЯ",
        title: "Подключитесь по номеру телефона",
        description:
          "На странице WalletPlus введите номер WhatsApp и примите условия. Затем заполните личные данные и подключитесь к карте.",
      },
      {
        eyebrow: "WALLET",
        title: "Добавьте карту в телефон",
        description:
          "После создания добавьте карту в Apple Wallet или Google Wallet — карта и QR-код всегда будут в вашем телефоне.",
      },
    ],
    privacyTitle: "Безопасный переход",
    privacyText:
      "Регистрация проходит на странице WalletPlus, созданной для nemesisbaku. Перед продолжением ознакомьтесь с условиями.",
    ctaBadge: "5% КЕШБЭК",
    ctaTitle: "Готовы создать карту лояльности?",
    ctaDescription:
      "Откройте WalletPlus, заполните данные и добавьте карту в телефон.",
    cta: "Добавить карту лояльности",
    external: "Откроется на внешней странице WalletPlus",
    imageAlt: "Инструкция по карте лояльности nemesisbaku",
  },
};

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node || !("IntersectionObserver" in window)) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -6%" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`${className} transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-8 scale-[0.985] opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

export default function LoyaltyCardInfoPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = loyaltyTranslations[lang] || loyaltyTranslations.az;

  const stepImages = [
    loyaltyIntroImage,
    loyaltyRegistrationImage,
    loyaltyWalletImage,
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f7f5] text-zinc-950">
      <section className="loyalty-hero relative border-b border-black/5 px-5 pb-16 pt-6 md:px-8 md:pb-24 md:pt-8">
        <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-red-500/10 blur-[100px]" />
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-zinc-950/10 blur-[120px]" />

        <div className="relative mx-auto max-w-[1180px]">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="inline-flex h-11 min-w-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-zinc-800 shadow-[0_12px_35px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 active:scale-95"
          >
            <FiArrowLeft className="shrink-0" />
            <span className="truncate">{t.back}</span>
          </button>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
            <div className="animate-[loyaltyHeroIn_.65s_cubic-bezier(.22,1,.36,1)_both]">
              <span className="inline-flex rounded-full bg-zinc-950 px-4 py-2 text-[10px] font-bold tracking-[0.24em] text-white">
                {t.badge}
              </span>

              <h1 className="mt-6 max-w-[780px] text-[42px] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-[58px] lg:text-[76px]">
                {t.title}
              </h1>

              <p className="mt-6 max-w-[650px] text-[15px] leading-7 text-zinc-500 md:text-base">
                {t.description}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {t.benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-3 rounded-[18px] border border-black/5 bg-white/80 p-4 shadow-[0_16px_45px_rgba(0,0,0,0.04)] backdrop-blur"
                  >
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-zinc-950 text-xs text-white">
                      <FiCheck />
                    </span>
                    <p className="text-sm font-medium leading-6">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[460px] animate-[loyaltyCardIn_.8s_cubic-bezier(.22,1,.36,1)_both] lg:max-w-none">
              <div className="absolute inset-10 rotate-6 rounded-[40px] bg-red-500/15 blur-2xl" />
              <div className="relative overflow-hidden rounded-[34px] border border-black/5 bg-white p-3 shadow-[0_35px_100px_rgba(0,0,0,0.12)]">
                <img
                  src={loyaltyIntroImage}
                  alt={t.imageAlt}
                  className="loyalty-step-image h-auto w-full rounded-[26px] object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="mx-auto max-w-[760px] text-center">
            <p className="text-xs font-bold tracking-[0.22em] text-red-500">
              nemesisbaku × WalletPlus
            </p>
            <h2 className="mt-4 text-[34px] font-semibold tracking-[-0.05em] md:text-[52px]">
              {t.howTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-500 md:text-base">
              {t.howDescription}
            </p>
          </Reveal>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {t.process.map((item, index) => (
              <Reveal key={item} delay={index * 80}>
                <div className="h-full rounded-[22px] border border-black/5 bg-white p-5 shadow-[0_16px_45px_rgba(0,0,0,0.035)]">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-950 text-xs font-bold text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-5 text-sm font-semibold leading-6">{item}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 md:px-8 md:pb-24">
        <div className="mx-auto max-w-[1180px] space-y-8 md:space-y-12">
          {t.steps.map((step, index) => (
            <Reveal key={step.title} delay={80}>
              <article className="loyalty-step grid overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-[0_22px_70px_rgba(0,0,0,0.055)] lg:grid-cols-2 lg:items-center">
                <div
                  className={`p-6 sm:p-8 lg:p-12 ${
                    index % 2 === 1 ? "lg:order-2" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-zinc-950 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-500">
                      {step.eyebrow}
                    </p>
                  </div>

                  <h3 className="mt-6 text-[30px] font-semibold leading-[1.04] tracking-[-0.045em] md:text-[42px]">
                    {step.title}
                  </h3>
                  <p className="mt-5 text-sm leading-7 text-zinc-500 md:text-[15px]">
                    {step.description}
                  </p>

                  <div className="mt-7 flex items-center gap-3 text-sm font-semibold text-zinc-800">
                    {index === 0 && <FiGift className="text-xl" />}
                    {index === 1 && <FiCreditCard className="text-xl" />}
                    {index === 2 && <FiSmartphone className="text-xl" />}
                    <span>
                      {index + 1} / {t.steps.length}
                    </span>
                  </div>
                </div>

                <div
                  className={`bg-[#f2f2f0] p-3 sm:p-5 ${
                    index % 2 === 1 ? "lg:order-1" : ""
                  }`}
                >
                  <img
                    src={stepImages[index]}
                    alt={`${t.imageAlt} ${index + 1}`}
                    loading={index === 0 ? "eager" : "lazy"}
                    className="loyalty-step-image mx-auto max-h-[820px] w-full rounded-[22px] object-contain"
                  />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-5 pb-6 md:px-8 md:pb-8">
        <Reveal className="mx-auto max-w-[1180px]">
          <div className="flex flex-col gap-4 rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_16px_45px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:p-6">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-zinc-950 text-xl text-white">
              <FiShield />
            </div>
            <div>
              <h3 className="font-semibold">{t.privacyTitle}</h3>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                {t.privacyText}
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="px-5 pb-16 pt-6 md:px-8 md:pb-24">
        <Reveal className="mx-auto max-w-[1180px]">
          <div className="relative overflow-hidden rounded-[34px] bg-zinc-950 px-6 py-10 text-center text-white shadow-[0_30px_90px_rgba(0,0,0,0.18)] sm:px-10 md:py-14">
            <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-red-500/20 blur-[90px]" />
            <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-white/10 blur-[100px]" />

            <div className="relative mx-auto max-w-[760px]">
              <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-bold tracking-[0.2em] text-white/75">
                {t.ctaBadge}
              </span>
              <h2 className="mt-5 text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] md:text-[54px]">
                {t.ctaTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-[600px] text-sm leading-7 text-white/55 md:text-base">
                {t.ctaDescription}
              </p>

              <a
                href={WALLET_PLUS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group mx-auto mt-8 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-[18px] bg-white px-6 py-4 text-sm font-bold text-zinc-950 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(255,255,255,0.16)] active:scale-[0.98] sm:w-auto"
              >
                {t.cta}
                <FiArrowRight className="text-lg transition group-hover:translate-x-1" />
                <FiExternalLink className="text-sm text-zinc-400" />
              </a>

              <p className="mt-3 text-[11px] text-white/35">{t.external}</p>
            </div>
          </div>
        </Reveal>
      </section>

      <style>{`
        @keyframes loyaltyHeroIn {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes loyaltyCardIn {
          from { opacity: 0; transform: translateY(35px) rotate(2deg) scale(.97); }
          to { opacity: 1; transform: translateY(0) rotate(0) scale(1); }
        }

        @media (orientation: landscape) and (max-height: 760px) {
          .loyalty-hero { padding-top: 1.25rem; padding-bottom: 3rem; }
          .loyalty-step-image { max-height: 78vh; }
          .loyalty-step { grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); }
        }

        @media (prefers-reduced-motion: reduce) {
          .loyalty-hero *, .loyalty-step * {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </main>
  );
}