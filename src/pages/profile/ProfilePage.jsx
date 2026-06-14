import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronRight,
  FiHome,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiSettings,
  FiShield,
  FiUser,
} from "react-icons/fi";
import AppLoader from "../../components/common/AppLoader";
import { profileApi } from "../../api/profileApi";
import { useLanguage } from "../../i18n/LanguageContext";

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("az-AZ");
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { text } = useLanguage();

  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addressError, setAddressError] = useState(false);

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    try {
      setLoading(true);

      const profileRes = await profileApi.get();
      setProfile(unwrap(profileRes));

      try {
        const addressRes = await profileApi.addresses();
        const addressData = unwrap(addressRes);
        setAddresses(Array.isArray(addressData) ? addressData : []);
      } catch {
        setAddressError(true);
      }
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
    localStorage.removeItem("nemesis_access_token");
    localStorage.removeItem("nemesis_refresh_token");

    window.dispatchEvent(new Event("nemesis_auth_changed"));
    navigate("/login");
  }

  if (loading) return <AppLoader text={text.profileOpening} />;

  const defaultAddress =
    addresses.find((x) => x.isDefault) || addresses[0] || null;

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-7 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1180px]">
        <section className="relative animate-[profileUp_.42s_cubic-bezier(.22,1,.36,1)_both] overflow-hidden rounded-[22px] bg-[#111] shadow-[0_22px_70px_rgba(0,0,0,0.12)]">
          <div className="absolute inset-0 opacity-80">
            <div className="absolute -left-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 right-0 h-64 w-64 rounded-full bg-[#d8c8aa]/20 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </div>

          <div className="relative p-5 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/45">
                NemesisBaku
              </p>

              <button
                type="button"
                onClick={() => navigate("/profile/settings")}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur transition hover:bg-white/15 active:scale-[0.98]"
              >
                {text.profileSettings}
              </button>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-[auto_1fr] md:items-end">
              <div className="relative mx-auto md:mx-0">
                <div className="h-[132px] w-[132px] overflow-hidden rounded-[30px] bg-white/10 p-1 ring-1 ring-white/15">
                  <div className="h-full w-full overflow-hidden rounded-[26px] bg-zinc-900">
                    {profile?.profileImageUrl ? (
                      <img
                        src={profile.profileImageUrl}
                        alt={profile.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center">
                        <FiUser className="text-[48px] text-white/40" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute -bottom-2 -right-2 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-zinc-950 shadow-lg">
                  Profile
                </div>
              </div>

              <div className="text-center md:text-left">
                <h1 className="mx-auto max-w-[620px] text-[30px] font-medium leading-[1.05] tracking-[-0.05em] text-white md:mx-0 md:text-[50px]">
                  {profile?.fullName || text.profile}
                </h1>

                <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-white/75 backdrop-blur">
                    <FiPhone />
                    {profile?.phoneNumber || text.none}
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-white/75 backdrop-blur">
                    <FiMail />
                    {profile?.email || text.none}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative grid border-t border-white/10 bg-white/[0.04] md:grid-cols-3">
            <ProfileMiniStat
              label={text.email}
              value={profile?.email || text.none}
            />

            <ProfileMiniStat
              label={text.loyaltyCard}
              value={profile?.loyaltyCardCode || text.none}
            />

            <ProfileMiniStat
              label={text.dateOfBirth}
              value={formatDate(profile?.dateOfBirth)}
            />
          </div>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-2">
          <ActionCard
            icon={<FiPackage />}
            title={text.myOrders}
            desc={text.myOrdersDesc}
            onClick={() => navigate("/orders")}
          />

          <ActionCard
            icon={<FiMapPin />}
            title={text.myAddresses}
            desc={
              defaultAddress
                ? defaultAddress.addressText
                : addressError
                ? text.addressesUnavailable
                : text.addressesEmptyShort
            }
            onClick={() => navigate("/profile/settings/addresses")}
          />

          <ActionCard
            icon={<FiSettings />}
            title={text.profileSettings}
            desc={text.profileSettingsDesc}
            onClick={() => navigate("/profile/settings")}
          />

          <button
            type="button"
            onClick={logout}
            className="group flex items-center justify-between rounded-[18px] bg-white px-5 py-5 text-left shadow-[0_14px_40px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(0,0,0,0.07)] active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-[15px] bg-red-50 text-xl text-red-500">
                <FiLogOut />
              </div>

              <div>
                <h2 className="text-base font-medium text-zinc-950">
                  {text.logout}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {text.logoutDesc}
                </p>
              </div>
            </div>

            <FiChevronRight className="text-xl text-zinc-300 transition group-hover:translate-x-1 group-hover:text-red-500" />
          </button>
        </section>

        <section className="mt-5 animate-[profileUp_.5s_cubic-bezier(.22,1,.36,1)_both] rounded-[18px] bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] bg-zinc-50 text-xl text-zinc-950">
              <FiHome />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-medium text-zinc-950">
                {text.defaultAddress}
              </h2>

              {defaultAddress ? (
                <>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    {defaultAddress.addressText}
                  </p>

                  <p className="mt-2 text-xs font-medium text-zinc-400">
                    {[
                      defaultAddress.buildingNumber,
                      defaultAddress.floor,
                      defaultAddress.apartment,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  {addressError
                    ? text.addressesUnavailable
                    : text.addressesEmptyDesc}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate("/profile/settings/addresses")}
              className="rounded-[12px] bg-zinc-950 px-4 py-2 text-xs font-medium text-white transition active:scale-[0.98]"
            >
              {defaultAddress ? text.edit : text.add}
            </button>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes profileUp {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </main>
  );
}

function ProfileMiniStat({ label, value }) {
  return (
    <div className="border-t border-white/10 px-5 py-4 md:border-l md:border-t-0 first:md:border-l-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-medium text-white/85">
        {value}
      </p>
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center justify-between rounded-[18px] bg-white px-5 py-5 text-left shadow-[0_14px_40px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(0,0,0,0.07)] active:scale-[0.98]"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] bg-zinc-50 text-xl text-zinc-950">
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-medium text-zinc-950">{title}</h2>
          <p className="mt-1 line-clamp-1 text-sm text-zinc-400">{desc}</p>
        </div>
      </div>

      <FiChevronRight className="text-xl text-zinc-300 transition group-hover:translate-x-1 group-hover:text-zinc-950" />
    </button>
  );
}