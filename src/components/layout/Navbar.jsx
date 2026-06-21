import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHeart,
  FiShoppingBag,
  FiUser,
  FiSearch,
  FiX,
  FiMenu,
  FiLogIn,
  FiChevronDown,
} from "react-icons/fi";
import { FaHeart, FaShoppingBag, FaUser } from "react-icons/fa";
import { apiFetch, getAccessToken } from "../../api/apiFetch";
import { useLanguage } from "../../i18n/LanguageContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { lang, setLang, text } = useLanguage();

  const [store, setStore] = useState(null);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);

  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getAccessToken()));
  const [basketCount, setBasketCount] = useState(0);

  const lastScrollY = useRef(0);

  useEffect(() => {
    loadStoreInfo();
    checkAuth();
  }, []);

  function updateNavbarVisibility(value) {
    setNavbarVisible(value);

    window.dispatchEvent(
      new CustomEvent("nemesis_nav_visibility", {
        detail: { visible: value },
      })
    );
  }

  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;

      if (currentY < 20) {
        updateNavbarVisibility(true);
      } else if (currentY > lastScrollY.current && currentY > 90) {
        updateNavbarVisibility(false);
      } else if (currentY < lastScrollY.current) {
        updateNavbarVisibility(true);
      }

      lastScrollY.current = currentY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadBasketCount();
    } else {
      setBasketCount(0);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const onFocus = () => checkAuth();
    const onStorage = () => checkAuth();
    const onAuthChanged = () => checkAuth();

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    window.addEventListener("nemesis_auth_changed", onAuthChanged);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("nemesis_auth_changed", onAuthChanged);
    };
  }, []);

  function checkAuth() {
    setIsLoggedIn(Boolean(getAccessToken()));
  }

  async function loadStoreInfo() {
    try {
      const res = await apiFetch("/api/StoreInfo");
      setStore(res?.data || null);
    } catch {
      setStore(null);
    }
  }

  async function loadBasketCount() {
    try {
      const res = await apiFetch("/api/Basket");
      const data = res?.data || res;

      const items =
        data?.items ||
        data?.basketItems ||
        data?.products ||
        (Array.isArray(data) ? data : []);

      const count = Array.isArray(items)
        ? items.reduce((sum, item) => sum + (item.quantity || 1), 0)
        : 0;

      setBasketCount(count);
    } catch {
      setBasketCount(0);
    }
  }

  function openMenu() {
    setMenuClosing(false);
    setMenuMounted(true);
  }

  function closeMenu() {
    setMenuClosing(true);

    setTimeout(() => {
      setMenuMounted(false);
      setMenuClosing(false);
    }, 280);
  }

  function goLogin() {
    closeMenu();
    navigate("/login");
  }

  const brandName = store?.storeName || "NemesisBaku";

  const logoStyle = {
    fontFamily: '"League Spartan", sans-serif',
  };

  const authIcons = useMemo(() => {
    if (!isLoggedIn) {
      return [
        {
          to: "/login",
          label: "Login",
          emptyIcon: <FiLogIn />,
          filledIcon: <FiLogIn />,
        },
      ];
    }

    return [
      {
        to: "/favorites",
        label: "Favorites",
        emptyIcon: <FiHeart />,
        filledIcon: <FaHeart />,
      },
      {
        to: "/basket",
        label: "Basket",
        emptyIcon: <FiShoppingBag />,
        filledIcon: <FaShoppingBag />,
        count: basketCount,
      },
      {
        to: "/profile",
        label: "Profile",
        emptyIcon: <FiUser />,
        filledIcon: <FaUser />,
        desktopOnly: true,
      },
    ];
  }, [isLoggedIn, basketCount]);

  return (
    <>
      <style>
        {`
          @keyframes menuOpen {
            from {
              opacity: 0;
              transform: translateX(-34px);
            }

            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes menuClose {
            from {
              opacity: 1;
              transform: translateX(0);
            }

            to {
              opacity: 0;
              transform: translateX(-34px);
            }
          }

          @keyframes overlayFadeIn {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          @keyframes overlayFadeOut {
            from {
              opacity: 1;
            }

            to {
              opacity: 0;
            }
          }
        `}
      </style>

      <header
        className={`sticky top-0 z-40 border-b border-zinc-100 bg-white/92 backdrop-blur-xl transition-all duration-500 ${
          navbarVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }`}
      >
        <div className="relative mx-auto flex h-[62px] max-w-[1180px] items-center justify-between px-4 md:h-[72px] md:px-6">
          <div className="flex min-w-0 items-center gap-1.5 md:gap-3">
            <button
              type="button"
              onClick={openMenu}
              className="grid h-9 w-9 place-items-center rounded-full text-[21px] text-zinc-900 transition hover:bg-zinc-50 active:scale-95 md:hidden"
              aria-label="Menu"
            >
              <FiMenu />
            </button>

            <NavLink
              to="/search"
              className={({ isActive }) =>
                `grid h-9 w-9 place-items-center rounded-full text-[18px] transition hover:bg-zinc-50 active:scale-95 md:hidden ${
                  isActive ? "bg-black/5 text-black" : "text-zinc-800"
                }`
              }
              aria-label="Search"
            >
              <FiSearch />
            </NavLink>

            <NavLink to="/" className="hidden items-center gap-3 md:flex">
              <div className="h-11 w-11 overflow-hidden rounded-[14px] border border-zinc-100 bg-zinc-50 shadow-sm">
                {store?.logoUrl ? (
                  <img
                    src={store.logoUrl}
                    alt={brandName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="grid h-full w-full place-items-center text-lg font-black"
                    style={logoStyle}
                  >
                    n
                  </div>
                )}
              </div>

              <span
                className="text-[25px] font-black tracking-[-0.055em] text-zinc-950"
                style={logoStyle}
              >
                {brandName}
              </span>
            </NavLink>
          </div>

          <NavLink
            to="/"
            className="absolute left-1/2 max-w-[170px] -translate-x-1/2 truncate text-center text-[25px] font-black leading-none tracking-[-0.06em] text-zinc-950 md:hidden"
            style={logoStyle}
          >
            {brandName}
          </NavLink>

          <div className="flex items-center gap-1.5 md:gap-2.5">
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `hidden h-9 w-9 place-items-center rounded-full text-[18px] transition hover:bg-zinc-50 active:scale-95 md:grid md:h-10 md:w-10 md:text-[17px] ${
                  isActive ? "bg-black/5 text-black" : "text-zinc-800"
                }`
              }
              aria-label="Search"
            >
              <FiSearch />
            </NavLink>

            {authIcons.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className={({ isActive }) =>
                  `relative h-9 w-9 place-items-center rounded-full text-[18px] transition-all duration-300 active:scale-95 md:h-10 md:w-10 md:text-[17px] ${
                    item.desktopOnly ? "hidden md:grid" : "grid"
                  } ${
                    isActive
                      ? "bg-black/5 text-black"
                      : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="transition-transform duration-300 hover:scale-110">
                      {isActive ? item.filledIcon : item.emptyIcon}
                    </span>

                    {item.count > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-black px-1 text-[10px] font-extrabold leading-none text-white">
                        {item.count > 99 ? "99+" : item.count}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}

            <div className="relative hidden md:block">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="h-10 appearance-none rounded-full border border-zinc-100 bg-white px-3.5 pr-8 text-xs font-bold text-zinc-700 outline-none transition hover:bg-zinc-50 focus:border-zinc-300"
              >
                <option value="az">AZ</option>
                <option value="ru">RU</option>
                <option value="en">EN</option>
              </select>

              <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-zinc-500" />
            </div>
          </div>
        </div>
      </header>

      {menuMounted && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            onClick={closeMenu}
            className={`absolute inset-0 bg-black/25 backdrop-blur-[2px] ${
              menuClosing
                ? "animate-[overlayFadeOut_0.25s_ease_both]"
                : "animate-[overlayFadeIn_0.25s_ease_both]"
            }`}
          />

          <aside
            className={`absolute left-0 top-0 h-full w-[78%] max-w-[305px] bg-white px-5 py-5 shadow-[20px_0_60px_rgba(0,0,0,0.12)] ${
              menuClosing
                ? "animate-[menuClose_0.28s_ease_both]"
                : "animate-[menuOpen_0.38s_cubic-bezier(0.22,1,0.36,1)_both]"
            }`}
          >
            <div className="mb-7 flex items-center justify-between">
              <h2
                className="text-[24px] font-black tracking-[-0.055em] text-zinc-950"
                style={logoStyle}
              >
                {brandName}
              </h2>

              <button
                type="button"
                onClick={closeMenu}
                className="grid h-9 w-9 place-items-center rounded-full bg-zinc-50 text-[19px] text-zinc-800"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-2">
              {!isLoggedIn ? (
                <button
                  type="button"
                  onClick={goLogin}
                  className="flex w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                >
                  <FiLogIn />
                  Login
                </button>
              ) : (
                <NavLink
                  to="/profile"
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-[16px] px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "bg-black/5 text-black"
                        : "text-zinc-800 hover:bg-zinc-50"
                    }`
                  }
                >
                  <FaUser />
                  {text.profile}
                </NavLink>
              )}

              <div className="pt-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                  {text.language}
                </label>

                <div className="relative">
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="h-12 w-full appearance-none rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 pr-10 text-sm font-bold text-zinc-800 outline-none transition focus:border-zinc-300"
                  >
                    <option value="az">Azərbaycan</option>
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>

                  <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}