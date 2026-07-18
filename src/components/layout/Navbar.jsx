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
  FiRefreshCw,
} from "react-icons/fi";
import { FaHeart, FaShoppingBag, FaUser } from "react-icons/fa";
import { apiFetch, getAccessToken } from "../../api/apiFetch";
import { useLanguage } from "../../i18n/LanguageContext";
import AppLoader from "../common/AppLoader";
import PageRubberEffect from "../common/PageRubberEffect";

function BrandLogo({ logoUrl, brandName, className = "" }) {
  if (!logoUrl) {
    return (
      <span className={`font-black lowercase tracking-[-0.055em] ${className}`}>
        {brandName}
      </span>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={brandName}
      draggable={false}
      className={`block h-auto object-contain select-none ${className}`}
    />
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const { lang, setLang, text } = useLanguage();

  const [store, setStore] = useState(null);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [pullDistance, setPullDistance] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getAccessToken()));
  const [basketCount, setBasketCount] = useState(0);

  const lastScrollY = useRef(0);
  const navbarRef = useRef(null);
  const menuMountedRef = useRef(false);
  const pullRefreshingRef = useRef(false);
  const pullRefreshTimerRef = useRef(null);
  const suppressClickUntilRef = useRef(0);
  const pullGestureRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    distance: 0,
  });

  useEffect(() => {
    loadStoreInfo();
    checkAuth();
  }, []);

  useEffect(() => {
    menuMountedRef.current = menuMounted;
  }, [menuMounted]);

  useEffect(() => {
    const navbar = navbarRef.current;
    if (!navbar) return undefined;

    const refreshTrigger = 74;

    function resetGesture() {
      pullGestureRef.current = {
        active: false,
        startX: 0,
        startY: 0,
        distance: 0,
      };
    }

    function handleTouchStart(event) {
      if (
        window.innerWidth >= 768 ||
        window.scrollY > 1 ||
        menuMountedRef.current ||
        pullRefreshingRef.current ||
        document.body.dataset.nemesisFilterOpen === "true" ||
        document.body.dataset.nemesisAppLoading === "true"
      ) {
        resetGesture();
        return;
      }

      const touch = event.touches[0];
      if (!touch) return;

      pullGestureRef.current = {
        active: true,
        startX: touch.clientX,
        startY: touch.clientY,
        distance: 0,
      };
    }

    function handleTouchMove(event) {
      const gesture = pullGestureRef.current;
      const touch = event.touches[0];

      if (!gesture.active || !touch) return;

      const deltaX = touch.clientX - gesture.startX;
      const deltaY = touch.clientY - gesture.startY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        resetGesture();
        setPullDistance(0);
        return;
      }

      if (deltaY <= 0) {
        setPullDistance(0);
        return;
      }

      event.preventDefault();

      const resistedDistance = Math.min(
        112,
        deltaY * 0.4 + Math.sqrt(deltaY) * 1.1,
      );

      gesture.distance = resistedDistance;
      setPullDistance(resistedDistance);

      if (resistedDistance > 7) {
        suppressClickUntilRef.current = Date.now() + 550;
      }
    }

    function finishGesture() {
      const shouldRefresh =
        pullGestureRef.current.active &&
        pullGestureRef.current.distance >= refreshTrigger;

      resetGesture();

      if (!shouldRefresh) {
        setPullDistance(0);
        return;
      }

      pullRefreshingRef.current = true;
      setPullDistance(0);
      setPullRefreshing(true);

      pullRefreshTimerRef.current = window.setTimeout(() => {
        sessionStorage.removeItem("nemesis_home_loaded_once");
        window.location.reload();
      }, 360);
    }

    function blockAccidentalClick(event) {
      if (Date.now() < suppressClickUntilRef.current) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    navbar.addEventListener("touchstart", handleTouchStart, { passive: true });
    navbar.addEventListener("touchmove", handleTouchMove, { passive: false });
    navbar.addEventListener("touchend", finishGesture, { passive: true });
    navbar.addEventListener("touchcancel", finishGesture, { passive: true });
    navbar.addEventListener("click", blockAccidentalClick, true);

    return () => {
      navbar.removeEventListener("touchstart", handleTouchStart);
      navbar.removeEventListener("touchmove", handleTouchMove);
      navbar.removeEventListener("touchend", finishGesture);
      navbar.removeEventListener("touchcancel", finishGesture);
      navbar.removeEventListener("click", blockAccidentalClick, true);

      if (pullRefreshTimerRef.current) {
        window.clearTimeout(pullRefreshTimerRef.current);
      }
    };
  }, []);

  function updateNavbarVisibility(value) {
    setNavbarVisible(value);

    window.dispatchEvent(
      new CustomEvent("nemesis_nav_visibility", {
        detail: { visible: value },
      }),
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

  const brandName = store?.storeName || "nemesisbaku";
  const logoUrl = store?.logoUrl || "";

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
  function resetHomeFromLogo() {
    closeMenu();

    window.dispatchEvent(new Event("nemesis_home_reset"));

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }

  return (
    <>
      <PageRubberEffect />

      <AppLoader
        visible={pullRefreshing}
        text={text.loading || "nemesisbaku"}
      />

      {pullDistance > 2 && !pullRefreshing && (
        <div
          className="pointer-events-none fixed inset-x-0 top-[70px] z-[999999] flex justify-center px-4 text-center md:hidden"
          style={{
            opacity: Math.min(1, pullDistance / 28),
            transform: `translateY(${Math.min(24, pullDistance * 0.2)}px)`,
          }}
        >
          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-extrabold text-zinc-700 shadow-[0_14px_40px_rgba(0,0,0,0.14)]">
            <FiRefreshCw
              className="shrink-0 text-[15px]"
              style={{ transform: `rotate(${pullDistance * 4}deg)` }}
            />
            <span className="text-center">
              {pullDistance >= 74
                ? "Burax, yenilə"
                : "Yeniləmək üçün aşağı dart"}
            </span>
          </div>
        </div>
      )}

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
        ref={navbarRef}
        data-nemesis-navbar="true"
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

            <NavLink
              to="/"
              onClick={resetHomeFromLogo}
              className="hidden items-center transition duration-300 hover:opacity-80 md:flex"
              aria-label={brandName}
            >
              <BrandLogo
                logoUrl={logoUrl}
                brandName={brandName}
                className={
                  logoUrl
                    ? "w-[128px] lg:w-[138px]"
                    : "text-[25px] text-zinc-950"
                }
              />
            </NavLink>
          </div>

          <NavLink
            to="/"
            onClick={resetHomeFromLogo}
            className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center transition duration-300 hover:opacity-80 md:hidden"
            aria-label={brandName}
          >
            <BrandLogo
              logoUrl={logoUrl}
              brandName={brandName}
              className={
                logoUrl ? "w-[112px] sm:w-[120px]" : "text-[20px] text-zinc-950"
              }
            />
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
              <NavLink
                to="/"
                onClick={resetHomeFromLogo}
                className="flex items-center transition duration-300 hover:opacity-80"
                aria-label={brandName}
              >
                <BrandLogo
                  logoUrl={logoUrl}
                  brandName={brandName}
                  className={
                    logoUrl ? "w-[122px]" : "text-[24px] text-zinc-950"
                  }
                />
              </NavLink>

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