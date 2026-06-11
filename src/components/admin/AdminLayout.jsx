import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiBox,
  FiGrid,
  FiHome,
  FiImage,
  FiLogOut,
  FiPackage,
  FiSettings,
  FiShoppingBag,
  FiTag,
  FiUsers,
} from "react-icons/fi";
import { clearAdminAuth } from "../../api/admin/adminAuth";
import { FiShield } from "react-icons/fi";

const links = [
  { to: "/SuperAdmin/dashboard", label: "Dashboard", icon: <FiGrid /> },
  { to: "/SuperAdmin/products", label: "Məhsullar", icon: <FiPackage /> },
  { to: "/SuperAdmin/add-product", label: "Məhsul əlavə et", icon: <FiBox /> },
  { to: "/SuperAdmin/orders", label: "Sifarişlər", icon: <FiShoppingBag /> },
  { to: "/SuperAdmin/brands", label: "Brendlər", icon: <FiTag /> },
  { to: "/SuperAdmin/categories", label: "Kateqoriyalar", icon: <FiTag /> },
  { to: "/SuperAdmin/campaigns", label: "Kampaniyalar", icon: <FiImage /> },
  { to: "/SuperAdmin/users", label: "İstifadəçilər", icon: <FiUsers /> },
  { to: "/SuperAdmin/audit-logs",label: "Audit Loglar",icon: <FiShield />,},
  { to: "/SuperAdmin/store", label: "Mağaza ayarları", icon: <FiSettings /> },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  function logout() {
    clearAdminAuth();
    navigate("/SuperAdmin");
  }

  return (
    <main className="min-h-screen bg-[#f5f3ef] text-zinc-950 lg:flex">
      <aside className="sticky top-0 z-40 border-b border-zinc-100 bg-white/95 px-4 py-4 backdrop-blur-xl lg:h-screen lg:w-[285px] lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="mb-5 flex items-center justify-between gap-3 lg:mb-8">
          <NavLink to="/SuperAdmin/dashboard">
            <h1 className="text-[23px] font-extrabold tracking-[-0.045em]">
              NemesisAdmin
            </h1>
            <p className="text-xs font-bold text-zinc-400">SuperAdmin Panel</p>
          </NavLink>

          <NavLink
            to="/"
            className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-700"
          >
            <FiHome />
          </NavLink>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-[16px] px-4 py-3 text-sm font-extrabold transition ${
                  isActive
                    ? "bg-[#244989] text-white shadow-[0_14px_34px_rgba(36,73,137,0.22)]"
                    : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 lg:bg-transparent"
                }`
              }
            >
              <span className="text-[18px]">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="mt-5 hidden w-full items-center justify-center gap-2 rounded-[16px] bg-red-50 px-4 py-3 text-sm font-extrabold text-red-600 transition hover:bg-red-100 lg:flex"
        >
          <FiLogOut />
          Çıxış et
        </button>
      </aside>

      <section className="min-w-0 flex-1">
        <Outlet />
      </section>
    </main>
  );
}