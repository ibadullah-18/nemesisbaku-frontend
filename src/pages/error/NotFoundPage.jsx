import { useLocation, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiHome } from "react-icons/fi";
import { useLanguage } from "../../i18n/LanguageContext";

const translations = {
  az: {
    badge: "SƏHİFƏ TAPILMADI",
    title: "Axtardığınız səhifə mövcud deyil.",
    description:
      "Səhifə silinmiş, köçürülmüş və ya daxil etdiyiniz ünvan yanlış ola bilər.",
    home: "Əsas səhifəyə qayıt",
    back: "Geri qayıt",
    path: "Tapılmayan ünvan",
  },
  en: {
    badge: "PAGE NOT FOUND",
    title: "The page you requested does not exist.",
    description:
      "The page may have been removed, moved, or the address may be incorrect.",
    home: "Return to homepage",
    back: "Go back",
    path: "Missing address",
  },
  ru: {
    badge: "СТРАНИЦА НЕ НАЙДЕНА",
    title: "Запрашиваемая страница не существует.",
    description:
      "Страница могла быть удалена, перемещена или адрес указан неверно.",
    home: "Вернуться на главную",
    back: "Назад",
    path: "Неизвестный адрес",
  },
};

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const text = translations[lang] || translations.az;

  const missingPath =
    typeof location.state?.from === "string" ? location.state.from : "";

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/", { replace: true });
  }

  return (
    <main className="relative isolate min-h-[calc(100dvh-72px)] overflow-hidden bg-[#f6f5f2] px-5 py-8 text-zinc-950 md:px-8 md:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,1)_0%,rgba(246,245,242,.72)_46%,rgba(234,232,227,.75)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/15 to-transparent" />

      <section className="relative mx-auto flex min-h-[calc(100dvh-150px)] max-w-[1180px] flex-col items-center justify-center text-center">
        <div className="animate-[notFoundTopIn_.55s_cubic-bezier(.22,1,.36,1)_both]">
          <p className="text-[15px] font-extrabold tracking-[0.2em] text-zinc-400">
            nemesisbaku
          </p>

          <span className="mt-4 inline-flex rounded-full border border-black/10 bg-white/70 px-4 py-2 text-[10px] font-bold tracking-[0.22em] text-zinc-600 shadow-[0_10px_30px_rgba(0,0,0,0.035)] backdrop-blur">
            {text.badge}
          </span>
        </div>

        <div
          className="not-found-number relative my-3 flex select-none items-center justify-center overflow-visible"
          aria-hidden="true"
        >
          <span className="not-found-outline pointer-events-none absolute inset-0 flex items-center justify-center text-transparent">
            404
          </span>

          {["4", "0", "4"].map((number, index) => (
            <span
              key={`${number}-${index}`}
              className="not-found-digit inline-block bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-600 bg-clip-text text-transparent"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {number}
            </span>
          ))}

          <span className="not-found-scan pointer-events-none absolute left-[4%] right-[4%] top-1/2 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_18px_rgba(239,68,68,.55)]" />
        </div>

        <div className="relative z-10 -mt-3 animate-[notFoundContentIn_.65s_cubic-bezier(.22,1,.36,1)_.24s_both] sm:-mt-7">
          <h1 className="mx-auto max-w-[760px] text-[30px] font-semibold leading-[1.04] tracking-[-0.05em] sm:text-[42px] md:text-[50px]">
            {text.title}
          </h1>

          <p className="mx-auto mt-4 max-w-[600px] text-sm leading-7 text-zinc-500 sm:text-base">
            {text.description}
          </p>

          {missingPath && (
            <div className="mx-auto mt-5 max-w-[540px] rounded-[14px] border border-black/5 bg-white/65 px-4 py-3 backdrop-blur">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                {text.path}
              </p>
              <p className="mt-1 truncate font-mono text-xs font-medium text-zinc-600">
                {missingPath}
              </p>
            </div>
          )}

          <div className="mx-auto mt-7 flex max-w-[560px] flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/", { replace: true })}
              className="group inline-flex h-14 items-center justify-center gap-3 rounded-[16px] bg-zinc-950 px-7 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(0,0,0,0.16)] transition duration-300 hover:-translate-y-1 hover:bg-zinc-800 active:scale-[0.98]"
            >
              <FiHome />
              {text.home}
              <FiArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-[16px] border border-black/10 bg-white/75 px-7 text-sm font-semibold text-zinc-800 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-black/20 hover:bg-white active:scale-[0.98]"
            >
              <FiArrowLeft />
              {text.back}
            </button>
          </div>
        </div>
      </section>

      <style>{`
        .not-found-number {
          font-size: clamp(9.5rem, 27vw, 22rem);
          font-weight: 900;
          line-height: .82;
          letter-spacing: -.115em;
          padding-right: .115em;
        }

        .not-found-outline {
          -webkit-text-stroke: 1px rgba(24, 24, 27, .11);
          transform: scale(1.045);
          letter-spacing: -.115em;
          padding-right: .115em;
          animation: notFoundOutline 4s ease-in-out infinite;
        }

        .not-found-digit {
          animation: notFoundDigitIn .8s cubic-bezier(.22,1,.36,1) both;
          filter: drop-shadow(0 24px 28px rgba(0,0,0,.12));
        }

        .not-found-scan {
          animation: notFoundScan 3.8s cubic-bezier(.45,0,.55,1) infinite;
        }

        @keyframes notFoundTopIn {
          from { opacity: 0; transform: translateY(-14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes notFoundDigitIn {
          from { opacity: 0; transform: translateY(55px) scale(.86); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0) drop-shadow(0 24px 28px rgba(0,0,0,.12)); }
        }

        @keyframes notFoundContentIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes notFoundOutline {
          0%, 100% { opacity: .55; transform: scale(1.035); }
          50% { opacity: 1; transform: scale(1.055); }
        }

        @keyframes notFoundScan {
          0%, 100% { opacity: 0; transform: translateY(-55px) scaleX(.4); }
          22%, 78% { opacity: .8; }
          50% { opacity: 1; transform: translateY(55px) scaleX(1); }
        }

        @media (orientation: landscape) and (max-height: 760px) {
          .not-found-number { font-size: clamp(8rem, 24vh, 13rem); margin-block: .6rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .not-found-digit,
          .not-found-outline,
          .not-found-scan,
          main * {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </main>
  );
}