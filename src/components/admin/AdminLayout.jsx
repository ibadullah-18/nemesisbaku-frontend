import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiBox,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiImage,
  FiLayers,
  FiLogOut,
  FiMaximize2,
  FiMenu,
  FiPackage,
  FiShoppingBag,
  FiTag,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { clearAdminAuth } from "../../api/admin/adminAuth";

const navItems = [
  {
    title: "Əsas",
    items: [
      { label: "Dashboard", to: "/SuperAdmin/dashboard", icon: <FiGrid /> },
      { label: "Sifarişlər", to: "/SuperAdmin/orders", icon: <FiShoppingBag /> },
      { label: "İstifadəçilər", to: "/SuperAdmin/users", icon: <FiUsers /> },
    ],
  },
  {
    title: "Məhsul idarəsi",
    items: [
      { label: "Məhsullar", to: "/SuperAdmin/products", icon: <FiPackage /> },
      { label: "Məhsul əlavə et", to: "/SuperAdmin/add-product", icon: <FiBox /> },
      { label: "Kateqoriyalar", to: "/SuperAdmin/categories", icon: <FiLayers /> },
      { label: "Brendlər", to: "/SuperAdmin/brands", icon: <FiTag /> },
      { label: "Ölçülər", to: "/SuperAdmin/sizes", icon: <FiMaximize2 /> },
      { label: "Rənglər", to: "/SuperAdmin/colors", icon: <FiImage /> },
    ],
  },
  {
    title: "Marketinq",
    items: [
      {
        label: "Promo Pages",
        to: "/SuperAdmin/campaigns",
        icon: <FiImage />,
      },
      {
        label: "Home Sections",
        to: "/SuperAdmin/home-sections",
        icon: <FiGrid />,
      },
      { label: "Promo kodlar", to: "/SuperAdmin/promo-codes", icon: <FiTag /> },
    ],
  },
  {
    title: "Nəzarət",
    items: [
      { label: "Audit loglar", to: "/SuperAdmin/audit-logs", icon: <FiActivity /> },
    ],
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  function logout() {
    clearAdminAuth();
    navigate("/SuperAdmin", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#f6f4f0]">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-[80] grid h-12 w-12 place-items-center rounded-full bg-zinc-950 text-white shadow-[0_18px_45px_rgba(0,0,0,0.18)] lg:hidden"
      >
        <FiMenu />
      </button>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-[100] h-screen bg-white shadow-[24px_0_70px_rgba(0,0,0,0.06)] transition-all duration-300 ${
          collapsed ? "lg:w-[92px]" : "lg:w-[286px]"
        } ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } w-[286px]`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center justify-between border-b border-zinc-100 px-5">
            <div className={collapsed ? "lg:hidden" : ""}>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#244989]">
                NemesisBaku
              </p>
              <h1 className="mt-1 text-xl font-extrabold tracking-[-0.04em] text-zinc-950">
                Admin Panel
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-700 lg:hidden"
            >
              <FiX />
            </button>

            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="hidden h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.94] lg:grid"
            >
              {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-5">
            <div className="space-y-6">
              {navItems.map((group) => (
                <div key={group.title}>
                  <p
                    className={`mb-2 px-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-zinc-400 ${
                      collapsed ? "lg:hidden" : ""
                    }`}
                  >
                    {group.title}
                  </p>

                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `group flex h-12 items-center gap-3 rounded-[16px] px-3 text-sm font-extrabold transition hover:-translate-y-0.5 active:scale-[0.97] ${
                            isActive
                              ? "bg-[#244989] text-white shadow-[0_14px_34px_rgba(36,73,137,0.22)]"
                              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                          } ${collapsed ? "lg:justify-center lg:px-0" : ""}`
                        }
                      >
                        <span className="text-[20px]">{item.icon}</span>

                        <span className={collapsed ? "lg:hidden" : ""}>
                          {item.label}
                        </span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="border-t border-zinc-100 p-4">
            <button
              type="button"
              onClick={logout}
              className={`flex h-12 w-full items-center gap-3 rounded-[16px] bg-red-50 px-3 text-sm font-extrabold text-red-600 transition hover:-translate-y-0.5 active:scale-[0.97] ${
                collapsed ? "lg:justify-center lg:px-0" : ""
              }`}
            >
              <FiLogOut className="text-[20px]" />

              <span className={collapsed ? "lg:hidden" : ""}>
                Çıxış et
              </span>
            </button>
          </div>
        </div>
      </aside>

      <main
        className={`min-h-screen transition-all duration-300 ${
          collapsed ? "lg:pl-[92px]" : "lg:pl-[286px]"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}