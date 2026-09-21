import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiActivity, FiBox, FiChevronDown, FiChevronRight, FiGrid,
  FiHome, FiImage, FiLayers, FiLogOut, FiMail, FiMenu,
  FiPackage, FiPercent, FiPlusCircle, FiShoppingBag, FiTag,
  FiTruck, FiUsers, FiX, FiMaximize2, FiExternalLink, FiMapPin,
} from "react-icons/fi";
import { clearPanelAuth, getPanelFromPath, getPanelLoginPath } from "../../api/admin/adminAuth";
import AdminToastHost from "./AdminToastHost";
import "./adminWorkspace.css";

const GROUPS = [
  { name: "Ümumi baxış", items: [
    { path: "dashboard", label: "İdarəetmə", icon: FiHome, panels: ["super"] },
    { path: "orders", label: "Sifarişlər", icon: FiShoppingBag },
    { path: "products", label: "Məhsullar", icon: FiPackage },
    { path: "add-product", label: "Məhsul əlavə et", icon: FiPlusCircle },
  ] },
  { name: "Kataloq", items: [
    { path: "categories", label: "Kateqoriyalar", icon: FiGrid },
    { path: "brands", label: "Brendlər", icon: FiTag },
    { path: "sizes", label: "Ölçülər", icon: FiMaximize2 },
    { path: "colors", label: "Rənglər", icon: FiLayers },
  ] },
  { name: "Mağaza", items: [
    { path: "store-info", label: "Mağaza məlumatları", icon: FiMapPin },
    { path: "campaigns", label: "Kampaniyalar", icon: FiImage },
    { path: "home-sections", label: "Ana səhifə bölmələri", icon: FiBox },
    { path: "promo-codes", label: "Promo kodlar", icon: FiPercent },
    { path: "email-announcements", label: "Email göndərişləri", icon: FiMail },
    { path: "couriers", label: "Kuryerlər", icon: FiTruck },
  ] },
  { name: "Nəzarət", items: [
    { path: "users", label: "İstifadəçilər", icon: FiUsers, panels: ["super"] },
    { path: "audit-logs", label: "Audit qeydləri", icon: FiActivity, panels: ["super"] },
  ] },
];

export default function AdminLayout({ basePath, panel: panelProp }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const panel = panelProp || getPanelFromPath(location.pathname);
  const visibleGroups = useMemo(() => GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.panels || item.panels.includes(panel)),
  })).filter((group) => group.items.length), [panel]);

  const currentItem = visibleGroups.flatMap((group) => group.items)
    .filter((item) => location.pathname.toLowerCase().startsWith((basePath + "/" + item.path).toLowerCase()))
    .sort((a, b) => b.path.length - a.path.length)[0];

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  function logout() {
    clearPanelAuth(panel);
    navigate(getPanelLoginPath(panel), { replace: true });
  }

  return (
    <div className="nb-admin">
      <AdminToastHost />
      {menuOpen && (
        <button type="button" className="nb-admin__scrim" aria-label="Menyunu bağla"
          onClick={() => setMenuOpen(false)} />
      )}
      <aside className={"nb-admin__sidebar " + (menuOpen ? "is-open" : "")} aria-label="Admin naviqasiyası">
        <div className="nb-admin__identity">
          <div className="nb-admin__identity-mark" aria-hidden="true">n.</div>
          <div className="nb-admin__identity-copy">
            <span className="nb-admin__wordmark">nemesisbaku</span>
            <span className="nb-admin__identity-caption">İDARƏETMƏ PANELİ</span>
          </div>
          <button type="button" className="nb-admin__close" aria-label="Menyunu bağla"
            onClick={() => setMenuOpen(false)}><FiX /></button>
        </div>
        <div className="nb-admin__role"><span className="nb-admin__role-light" />
          {panel === "super" ? "SuperAdmin" : "Admin"} hesabı
        </div>
        <nav className="nb-admin__navigation">
          {visibleGroups.map((group) => (
            <div className="nb-admin__group" key={group.name}>
              <p className="nb-admin__group-name">{group.name}</p>
              {group.items.map(({ path, label, icon: Icon }) => (
                <NavLink key={path} to={basePath + "/" + path}
                  onClick={() => setMenuOpen(false)}
                  end={path === "dashboard" || path === "add-product"}
                  className={({ isActive }) => "nb-admin__link " + (isActive ? "is-active" : "")}>
                  <Icon aria-hidden="true" /> <span>{label}</span><FiChevronRight className="nb-admin__link-arrow" aria-hidden="true" />
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="nb-admin__sidebar-bottom">
          <NavLink to="/" onClick={() => setMenuOpen(false)} className="nb-admin__bottom-link"><FiExternalLink aria-hidden="true" /> Mağazaya bax</NavLink>
          <button type="button" onClick={logout} className="nb-admin__bottom-link nb-admin__logout">
            <FiLogOut aria-hidden="true" /> Çıxış et
          </button>
        </div>
      </aside>
      <div className="nb-admin__workspace">
        <header className="nb-admin__topbar">
          <div className="nb-admin__top-left">
            <button type="button" className="nb-admin__menu-button" aria-label="Menyunu aç"
              aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><FiMenu /></button>
            <div className="nb-admin__breadcrumb"><span>Panel</span><FiChevronRight aria-hidden="true" />
              <strong>{currentItem?.label || "İdarəetmə"}</strong></div>
          </div>
          <div className="nb-admin__top-right">
            <span className="nb-admin__system">İdarəetmə rejimi</span>
            <div className="nb-admin__avatar" aria-label={panel === "super" ? "SuperAdmin" : "Admin"}>
              {panel === "super" ? "SA" : "A"}
            </div>
            <FiChevronDown className="nb-admin__top-chevron" aria-hidden="true" />
          </div>
        </header>
        <main className="nb-admin__content" id="admin-content"><Outlet /></main>
      </div>
    </div>
  );
}
