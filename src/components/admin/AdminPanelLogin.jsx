import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPackage,
  FiPhone,
  FiShield,
  FiShoppingBag,
  FiXCircle,
} from "react-icons/fi";
import { loginForPanel } from "../../api/admin/adminAuth";
import "./adminLogin.css";

const loginContent = {
  admin: {
    role: "Admin",
    eyebrow: "Gündəlik idarəetmə",
    title: "Sifariş və kataloq nəzarəti.",
    description: "Sifarişləri, məhsulları, kampaniyaları və mağaza məlumatlarını sürətli idarə edin.",
    destination: "/Admin/orders",
    features: [
      { icon: FiShoppingBag, label: "Sifarişlər" },
      { icon: FiPackage, label: "Məhsullar" },
      { icon: FiActivity, label: "Canlı idarəetmə" },
    ],
  },
  super: {
    role: "SuperAdmin",
    eyebrow: "Tam sistem nəzarəti",
    title: "Mağazanı bir mərkəzdən idarə et.",
    description: "İstifadəçilər, audit qeydləri, satış və bütün mağaza funksiyaları üçün tam səlahiyyətli panel.",
    destination: "/SuperAdmin/dashboard",
    features: [
      { icon: FiActivity, label: "Audit qeydləri" },
      { icon: FiShield, label: "İstifadəçilər" },
      { icon: FiPackage, label: "Tam kataloq" },
    ],
  },
};

function normalizeLogin(value) {
  const text = value.trim();
  if (text.includes("@")) return text;
  const digits = text.replace(/\D/g, "");
  if (digits.startsWith("994")) return digits;
  return digits.length === 9 ? `994${digits}` : digits;
}

export default function AdminPanelLogin({ panel }) {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const content = loginContent[panel];
  const [emailOrPhoneNumber, setEmailOrPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function showNotice(message, type = "error") {
    setNotice({ message, type });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    const loginValue = normalizeLogin(emailOrPhoneNumber);
    if (!loginValue) return showNotice("Email və ya telefon nömrəsi daxil edilməlidir.");
    if (!emailOrPhoneNumber.includes("@") && (!loginValue.startsWith("994") || loginValue.length !== 12)) {
      return showNotice("Telefonu 994501112233 formatında yazın.");
    }
    if (!password.trim()) return showNotice("Şifrə daxil edilməlidir.");

    try {
      setLoading(true);
      setNotice(null);
      await loginForPanel(loginValue, password, panel);
      showNotice("Giriş uğurludur. Panel açılır…", "success");
      timerRef.current = window.setTimeout(() => {
        navigate(content.destination, { replace: true });
      }, 350);
    } catch (error) {
      showNotice(error?.message || "Giriş zamanı xəta baş verdi.");
      setLoading(false);
    }
  }

  const isEmail = emailOrPhoneNumber.includes("@");

  return (
    <main className={`nb-login ${panel === "super" ? "is-super" : "is-admin"}`}>
      <section className="nb-login__shell">
        <div className="nb-login__visual">
          <div className="nb-login__brand"><span>n.</span><strong>nemesisbaku</strong></div>
          <div className="nb-login__hero-copy">
            <p>{content.eyebrow}</p>
            <h1>{content.title}</h1>
            <span>{content.description}</span>
          </div>

          <div className="nb-login__scene" aria-hidden="true">
            <div className="nb-login__orb" />
            <div className="nb-login__scene-card">
              <small>İDARƏETMƏ REJİMİ</small>
              <strong>{content.role}</strong>
              <span><i /> Sistem aktivdir</span>
            </div>
          </div>

          <div className="nb-login__features">
            {content.features.map(({ icon: Icon, label }) => <div key={label}><Icon /><span>{label}</span></div>)}
          </div>
        </div>

        <div className="nb-login__form-side">
          <div className="nb-login__mobile-brand"><span>n.</span><strong>nemesisbaku</strong></div>
          <span className="nb-login__role"><FiShield /> {content.role} girişi</span>
          <h2>Panelə daxil ol</h2>
          <p>Hesab məlumatlarınızı daxil edin.</p>

          <form onSubmit={handleSubmit}>
            <label className="nb-login__field">
              <span>Email və ya telefon</span>
              <div>
                {isEmail ? <FiMail /> : <FiPhone />}
                <input
                  autoFocus
                  autoComplete="username"
                  value={emailOrPhoneNumber}
                  onChange={(event) => setEmailOrPhoneNumber(event.target.value)}
                  placeholder="email@nemesisbaku.az və ya 994..."
                />
              </div>
            </label>

            <label className="nb-login__field">
              <span>Şifrə</span>
              <div>
                <FiLock />
                <input
                  autoComplete="current-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Şifrənizi yazın"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Şifrəni gizlət" : "Şifrəni göstər"}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            <button className="nb-login__submit" type="submit" disabled={loading}>
              <span>{loading ? "Yoxlanılır…" : "Daxil ol"}</span>
              <FiArrowRight />
            </button>
          </form>

          <div className="nb-login__secure"><FiLock /><span><strong>Təhlükəsiz giriş</strong><small>Bu səhifə yalnız səlahiyyətli hesablar üçündür.</small></span></div>
        </div>
      </section>

      {notice ? (
        <div className={`nb-login-toast ${notice.type === "success" ? "is-success" : "is-error"}`} role="alert">
          {notice.type === "success" ? <FiCheckCircle /> : <FiXCircle />}
          <div><strong>{notice.type === "success" ? "Uğurlu" : "Xəta"}</strong><span>{notice.message}</span></div>
          <button type="button" onClick={() => setNotice(null)}>×</button>
        </div>
      ) : null}
    </main>
  );
}
