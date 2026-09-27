import "../profile/accountUI.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronRight,
  FiCreditCard,
  FiHome,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiSettings,
  FiUser,
} from "react-icons/fi";
import ProfilePageSkeleton from "../../components/profile/ProfilePageSkeleton";
import { profileApi } from "../../api/profileApi";
import { useLanguage } from "../../i18n/LanguageContext";
import { showUserToast } from "../../utils/userToast";
import "./profilePage.css";

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("az-AZ");
}

const loyaltyText = {
  az: {
    notAdded: "Əlavə edilməyib",
    add: "Loyallıq kartı əlavə et",
    desc: "Hər alışda 5% cashback qazan və kartını Apple Wallet və ya Google Wallet-a əlavə et.",
    open: "Kart sisteminə bax",
  },
  en: {
    notAdded: "Not added",
    add: "Add loyalty card",
    desc: "Earn 5% cashback on every purchase and add your card to Apple Wallet or Google Wallet.",
    open: "Explore the card system",
  },
  ru: {
    notAdded: "Не добавлена",
    add: "Добавить карту лояльности",
    desc: "Получайте 5% кешбэка с каждой покупки и добавьте карту в Apple Wallet или Google Wallet.",
    open: "Подробнее о карте",
  },
};


function normalizeLoyaltyCode(value) {
  const code = String(value || "").trim();

  return code && code.toLowerCase() !== "string" ? code : "";
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { text, lang: language } = useLanguage();

  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addressError, setAddressError] = useState(false);

  const loyalty = loyaltyText[language] || loyaltyText.az;



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

        showUserToast(
          text.addressesUnavailable || "Ünvan məlumatları yüklənmədi.",
          "error",
        );
      }
    } catch (err) {
      setProfile(null);

      showUserToast(
        err.message ||
          text.profileLoadError ||
          "Profil məlumatları yüklənmədi.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPage();
    // Profile data is loaded once; language switching is handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
    localStorage.removeItem("nemesis_access_token");
    localStorage.removeItem("nemesis_refresh_token");

    window.dispatchEvent(new Event("nemesis_auth_changed"));
    navigate("/login");
  }

  if (loading) {
    return <ProfilePageSkeleton />;
  }

  const defaultAddress =
    addresses.find((x) => x.isDefault) || addresses[0] || null;
  const loyaltyCardCode = normalizeLoyaltyCode(profile?.loyaltyCardCode);

  return (
    <main className="nb-account nb-dashboard">
      <div className="nb-account-shell">
        <header className="nb-profile-head">
          <div className="nb-profile-photo">
            {profile?.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={profile.fullName || text.profile}
              />
            ) : <FiUser />}
          </div>

          <div className="nb-profile-title">
            <p>{text.profile}</p>
            <h1>{profile?.fullName || text.profile}</h1>

            <div className="nb-profile-contact">
              <span><FiMail />{profile?.email || text.none}</span>
              <span><FiPhone />{profile?.phoneNumber || text.none}</span>
            </div>
          </div>

          <button
            type="button"
            className="nb-neutral"
            onClick={() => navigate("/profile/settings/account")}
          >
            <FiSettings />{text.edit}
          </button>
        </header>

        <div className="nb-account-grid">
          <nav className="nb-account-menu" aria-label={text.profile}>
            {[
              [FiPackage, text.myOrders, text.myOrdersDesc, "/orders"],
              [FiMapPin, text.myAddresses, text.addressesSettingsDesc, "/profile/settings/addresses"],
              [FiUser, text.accountInfo, text.accountInfoDesc, "/profile/settings/account"],
              [FiSettings, text.security, text.securityDesc, "/profile/settings/security"]
            ].map(([Icon, title, desc, url]) => (
              <button
                key={url}
                type="button"
                onClick={() => navigate(url)}
              >
                <Icon aria-hidden="true" />
                <span>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </span>
                <FiChevronRight aria-hidden="true" />
              </button>
            ))}

            <button type="button" onClick={logout}>
              <FiLogOut aria-hidden="true" />
              <span>
                <strong>{text.logout}</strong>
                <small>{text.logoutDesc}</small>
              </span>
              <FiChevronRight aria-hidden="true" />
            </button>
          </nav>

          <div className="nb-account-panels">
            <section className="nb-account-panel">
              <h2>
                <FiCreditCard aria-hidden="true" />
                {text.loyaltyCard}
              </h2>

              <p className="nb-card-code">
                {loyaltyCardCode || loyalty.notAdded}
              </p>

              <div className="nb-panel-actions">
                <button
                  type="button"
                  className="nb-neutral"
                  onClick={() => navigate("/profile/settings/account#loyalty-card")}
                >
                  {loyaltyCardCode ? text.edit : loyalty.add}
                  <FiChevronRight />
                </button>

                <button
                  type="button"
                  className="nb-text-link"
                  onClick={() => navigate("/profile/loyalty-card")}
                >
                  {loyalty.open}
                </button>
              </div>
            </section>

            <section className="nb-account-panel">
              <h2>
                <FiHome aria-hidden="true" />
                {text.defaultAddress}
              </h2>

              <p>
                {defaultAddress?.addressText ||
                  (addressError
                    ? text.addressesUnavailable
                    : text.addressesEmptyDesc)}
              </p>

              <button
                type="button"
                className="nb-neutral"
                onClick={() => navigate("/profile/settings/addresses")}
              >
                {defaultAddress ? text.edit : text.add}
                <FiChevronRight />
              </button>
            </section>

            <section className="nb-account-panel nb-account-birthday">
              <span>{text.dateOfBirth}</span>
              <strong>{formatDate(profile?.dateOfBirth)}</strong>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
