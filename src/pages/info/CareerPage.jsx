import {
  FiArrowRight,
  FiBriefcase,
  FiHeart,
  FiMail,
  FiUsers,
} from "react-icons/fi";
import { useLanguage } from "../../i18n/LanguageContext";

const pageText = {
  az: {
    badge: "KARYERA",
    title: "nemesisbaku komandamıza qoşul",
    desc: "Premium sneaker mədəniyyətini sevən, detallara önəm verən və müştəri təcrübəsini yüksəltmək istəyən insanlarla işləməyə açığıq.",
    culture: "Komanda mədəniyyəti",
    cultureText:
      "Minimalist düşüncə, məsuliyyətli yanaşma və premium xidmət standartı.",
    growth: "İnkişaf imkanı",
    growthText:
      "Satış, stil məsləhəti, kontent və e-commerce sahəsində real təcrübə.",
    people: "İnsan yönümlü iş",
    peopleText:
      "Müştəri ilə düzgün ünsiyyət və fərdi yanaşma bizim üçün əsasdır.",
    applyTitle: "Müraciət etmək istəyirsiniz?",
    applyText:
      "CV və ya qısa məlumatınızı bizə e-mail və ya WhatsApp vasitəsilə göndərin.",
    apply: "Müraciət et",
    note: "Aktiv vakansiya olmasa belə, uyğun profillər gələcək üçün saxlanılır.",
  },
  en: {
    badge: "CAREER",
    title: "Join the nemesisbaku team",
    desc: "We are open to people who love premium sneaker culture, care about details and want to improve customer experience.",
    culture: "Team culture",
    cultureText:
      "Minimal thinking, responsible approach and premium service standards.",
    growth: "Growth opportunity",
    growthText:
      "Real experience in sales, style consulting, content and e-commerce.",
    people: "People-focused work",
    peopleText:
      "Clear communication and personal approach are essential for us.",
    applyTitle: "Want to apply?",
    applyText: "Send us your CV or short information by e-mail or WhatsApp.",
    apply: "Apply now",
    note: "Even if there is no active vacancy, suitable profiles are saved for the future.",
  },
  ru: {
    badge: "КАРЬЕРА",
    title: "Присоединяйтесь к команде nemesisbaku",
    desc: "Мы открыты для людей, которые любят premium sneaker-культуру, ценят детали и хотят улучшать клиентский опыт.",
    culture: "Командная культура",
    cultureText:
      "Минималистичное мышление, ответственность и высокий стандарт сервиса.",
    growth: "Возможность роста",
    growthText:
      "Реальный опыт в продажах, style consulting, контенте и e-commerce.",
    people: "Работа с людьми",
    peopleText:
      "Правильная коммуникация и индивидуальный подход для нас важны.",
    applyTitle: "Хотите подать заявку?",
    applyText: "Отправьте CV или краткую информацию по e-mail или WhatsApp.",
    apply: "Подать заявку",
    note: "Даже если активной вакансии нет, подходящие профили сохраняются на будущее.",
  },
};

function CareerCard({ icon, title, desc, delay }) {
  return (
    <div
      className="rounded-[30px] border border-zinc-200 bg-white p-6 shadow-[0_20px_55px_rgba(15,15,15,0.06)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(15,15,15,0.1)]"
      style={{ animation: `careerFade 0.65s ease ${delay}s both` }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3eee7] text-xl">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-extrabold tracking-[-0.03em]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-zinc-600">{desc}</p>
    </div>
  );
}

export default function CareerPage() {
  const { lang } = useLanguage();
  const t = pageText[lang] || pageText.az;

  return (
    <section className="min-h-screen bg-[#fafafa] px-4 py-10 text-zinc-950 sm:px-6 md:py-14 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
          <div className="animate-[careerFade_0.55s_ease_both]">
            <span className="inline-flex rounded-full border border-zinc-300 bg-white px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.28em] text-zinc-600">
              {t.badge}
            </span>
            <h1 className="mt-5 max-w-[760px] text-[36px] font-extrabold leading-[1.04] tracking-[-0.05em] sm:text-[50px] lg:text-[66px]">
              {t.title}
            </h1>
            <p className="mt-5 max-w-[620px] text-sm leading-7 text-zinc-600 sm:text-base">
              {t.desc}
            </p>
          </div>

          <div className="animate-[careerFade_0.7s_ease_both] rounded-[34px] bg-[#120d09] p-7 text-white shadow-[0_24px_70px_rgba(15,15,15,0.18)] sm:p-8">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/10 text-2xl">
              <FiBriefcase />
            </div>
            <h2 className="mt-6 text-2xl font-extrabold tracking-[-0.03em]">
              {t.applyTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              {t.applyText}
            </p>
            <a
              href="mailto:nemesisbaku@gmail.com"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-zinc-950 transition duration-300 hover:-translate-y-1"
            >
              <FiMail />
              {t.apply}
              <FiArrowRight />
            </a>
          </div>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          <CareerCard
            icon={<FiHeart />}
            title={t.culture}
            desc={t.cultureText}
            delay={0.1}
          />
          <CareerCard
            icon={<FiBriefcase />}
            title={t.growth}
            desc={t.growthText}
            delay={0.2}
          />
          <CareerCard
            icon={<FiUsers />}
            title={t.people}
            desc={t.peopleText}
            delay={0.3}
          />
        </div>

        <div
          className="mt-8 rounded-[30px] border border-zinc-200 bg-white p-6 text-center shadow-[0_18px_45px_rgba(15,15,15,0.06)]"
          style={{ animation: "careerFade 0.7s ease 0.4s both" }}
        >
          <p className="text-sm font-semibold leading-7 text-zinc-600">
            {t.note}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes careerFade {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
