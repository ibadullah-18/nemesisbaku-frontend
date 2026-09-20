import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiBox,
  FiChevronRight,
  FiGrid,
  FiHome,
  FiImage,
  FiLayers,
  FiLogOut,
  FiMail,
  FiMenu,
  FiPackage,
  FiPercent,
  FiPlusCircle,
  FiMaximize2,
  FiShoppingBag,
  FiTag,
  FiTruck,
  FiUsers,
  FiX,
} from "react-icons/fi";
import {
  clearPanelAuth,
  getPanelFromPath,
  getPanelLoginPath,
} from "../../api/admin/adminAuth";

const MENU_ITEMS = [
  {
    path: "dashboard",
    label: "Dashboard",
    icon: FiHome,
    panels: ["super"],
  },
  {
    path: "orders",
    label: "Sifarişlər",
    icon: FiShoppingBag,
    panels: ["super", "admin"],
  },
  {
    path: "products",
    label: "Məhsullar",
    icon: FiPackage,
    panels: ["super", "admin"],
  },
  {
    path: "add-product",
    label: "Məhsul əlavə et",
    icon: FiPlusCircle,
    panels: ["super", "admin"],
  },
  {
    path: "categories",
    label: "Kateqoriyalar",
    icon: FiGrid,
    panels: ["super", "admin"],
  },
  {
    path: "brands",
    label: "Brendlər",
    icon: FiTag,
    panels: ["super", "admin"],
  },
  {
    path: "sizes",
    label: "Ölçülər",
    icon: FiMaximize2,
    panels: ["super", "admin"],
  },
  {
    path: "colors",
    label: "Rənglər",
    icon: FiLayers,
    panels: ["super", "admin"],
  },
  {
    path: "campaigns",
    label: "Kampaniyalar",
    icon: FiImage,
    panels: ["super", "admin"],
  },
  {
    path: "home-sections",
    label: "Home sections",
    icon: FiBox,
    panels: ["super", "admin"],
  },
  {
    path: "promo-codes",
    label: "Promo kodlar",
    icon: FiPercent,
    panels: ["super", "admin"],
  },
  {
    path: "email-announcements",
    label: "Email göndərişləri",
    icon: FiMail,
    panels: ["super", "admin"],
  },
  {
    path: "couriers",
    label: "Kuryerlər",
    icon: FiTruck,
    panels: ["super", "admin"],
  },
  {
    path: "users",
    label: "İstifadəçilər",
    icon: FiUsers,
    panels: ["super"],
  },
  {
    path: "audit-logs",
    label: "Audit loglar",
    icon: FiActivity,
    panels: ["super"],
  },
];

export default function AdminLayout({
  basePath,
  panel: panelProp,
  panelTitle,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const panel = panelProp || getPanelFromPath(location.pathname);

  const menuItems = useMemo(
    () => MENU_ITEMS.filter((item) => item.panels.includes(panel)),
    [panel],
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  function logout() {
    clearPanelAuth(panel);
    navigate(getPanelLoginPath(panel), { replace: true });
  }

  return (
    <div className="min-h-dvh bg-[#f6f7f9] text-zinc-950">
      {menuOpen && (
        <button
          type="button"
          aria-label="Menyunu bağla"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-[70] bg-zinc-950/35 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[80] flex w-[286px] flex-col border-r border-zinc-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-zinc-100 px-5">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#244989]">
              nemesisbaku
            </p>
            <h1 className="mt-1 text-lg font-extrabold tracking-[-0.03em]">
              {panel === "super" ? "SuperAdmin" : "Admin"}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-xl lg:hidden"
          >
            <FiX />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">
            İdarəetmə
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={`${basePath}/${item.path}`}
                  className={({ isActive }) =>
                    `group flex min-h-12 items-center gap-3 rounded-[15px] px-3 text-sm font-bold transition ${
                      isActive
                        ? "bg-[#244989] text-white shadow-[0_12px_30px_rgba(36,73,137,0.2)]"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-[12px] text-lg transition ${
                          isActive
                            ? "bg-white/12"
                            : "bg-zinc-50 group-hover:bg-white"
                        }`}
                      >
                        <Icon />
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      <FiChevronRight
                        className={`shrink-0 transition ${
                          isActive
                            ? "text-white/60"
                            : "text-zinc-300 group-hover:translate-x-0.5"
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-zinc-100 p-3">
          <div className="mb-2 rounded-[16px] bg-zinc-50 px-4 py-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-zinc-400">
              Aktiv panel
            </p>
            <p className="mt-1 text-sm font-extrabold text-zinc-800">
              {panelTitle ||
                (panel === "super" ? "Super Admin Panel" : "Admin Panel")}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[15px] bg-red-50 text-sm font-extrabold text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
          >
            <FiLogOut />
            Çıxış et
          </button>
        </div>
      </aside>

      <div className="min-h-dvh lg:pl-[286px]">
        <header className="sticky top-0 z-[60] flex h-[68px] items-center justify-between border-b border-zinc-200/80 bg-white/90 px-4 backdrop-blur-xl md:px-7 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-[14px] bg-zinc-50 text-xl lg:hidden"
            >
              <FiMenu />
            </button>

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-zinc-400">
                nemesisbaku idarəetmə
              </p>
              <p className="mt-0.5 text-sm font-extrabold text-zinc-900">
                {panelTitle ||
                  (panel === "super" ? "Super Admin Panel" : "Admin Panel")}
              </p>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] ${
              panel === "super"
                ? "bg-purple-50 text-purple-700"
                : "bg-blue-50 text-[#244989]"
            }`}
          >
            {panel === "super" ? "SuperAdmin" : "Admin"}
          </span>
        </header>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}