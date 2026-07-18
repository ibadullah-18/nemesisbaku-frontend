import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiChevronRight,
  FiLock,
  FiMapPin,
  FiPackage,
  FiUser,
} from "react-icons/fi";
import { useLanguage } from "../../i18n/LanguageContext";

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { text } = useLanguage();

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-[980px]">
        <header className="grid grid-cols-[44px_1fr_44px] items-center">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950 shadow-sm transition active:scale-95"
            aria-label={text.back || "Geri"}
          >
            <FiArrowLeft />
          </button>

          <div className="text-center">
            <p className="text-[15px] font-medium tracking-[0.17em] text-zinc-400">
              nemesisbaku
            </p>
            <h1 className="mt-1 text-lg font-medium tracking-[-0.025em] text-zinc-950">
              {text.profileSettings}
            </h1>
          </div>
          <div />
        </header>

        <section className="mt-7 animate-[settingsUp_.42s_cubic-bezier(.22,1,.36,1)_both] rounded-[24px] bg-zinc-950 p-6 text-white shadow-[0_22px_70px_rgba(0,0,0,0.12)] md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/45">
            Account
          </p>
          <h2 className="mt-3 text-[34px] font-medium tracking-[-0.055em] md:text-[52px]">
            {text.profileSettings}
          </h2>
          <p className="mt-3 max-w-[560px] text-sm leading-6 text-white/55">
            {text.profileSettingsPageDesc}
          </p>
        </section>

        <section className="mt-5 overflow-hidden rounded-[22px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.045)]">
          <SettingsRow
            icon={<FiUser />}
            title={text.accountInfo}
            desc={text.accountInfoDesc}
            onClick={() => navigate("/profile/settings/account")}
          />
          <SettingsRow
            icon={<FiLock />}
            title={text.security}
            desc={text.securityDesc}
            onClick={() => navigate("/profile/settings/security")}
          />
          <SettingsRow
            icon={<FiMapPin />}
            title={text.myAddresses}
            desc={text.addressesSettingsDesc}
            onClick={() => navigate("/profile/settings/addresses")}
          />
          <SettingsRow
            icon={<FiPackage />}
            title={text.myOrders}
            desc={text.myOrdersDesc}
            onClick={() => navigate("/orders")}
          />
        </section>
      </div>

      <style>{`
        @keyframes settingsUp {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </main>
  );
}

function SettingsRow({ icon, title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-4 border-b border-zinc-100 px-5 py-5 text-left transition hover:bg-zinc-50 last:border-b-0 active:scale-[0.995] md:px-6"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] bg-zinc-50 text-xl text-zinc-950 transition group-hover:bg-white">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-medium text-zinc-950">{title}</h3>
          <p className="mt-1 line-clamp-1 text-sm text-zinc-400">{desc}</p>
        </div>
      </div>
      <FiChevronRight className="shrink-0 text-xl text-zinc-300 transition group-hover:translate-x-1 group-hover:text-zinc-950" />
    </button>
  );
}
