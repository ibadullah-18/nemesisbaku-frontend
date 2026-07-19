import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FiArrowUp, FiChevronRight, FiImage, FiX } from "react-icons/fi";
import ProductDiscoveryBar from "../../components/product/ProductDiscoveryBar";
import ProductCard from "../../components/product/ProductCard";
import ProductSection from "../../components/home/ProductSection";
import HomePromoSlider from "../../components/home/HomePromoSlider";
import AppLoader from "../../components/common/AppLoader";
import {
  getActiveBanners,
  getActiveCampaigns,
  getActiveHomeSections,
  getProducts,
  getPromoPage,
  trackVisit,
} from "../../api/homeApi";
import { useLanguage } from "../../i18n/LanguageContext";

function normalizeList(res) {
  const data = res?.data ?? res;
  const nestedData = data?.data ?? data;

  return (
    data?.items ||
    data?.products ||
    data?.result ||
    nestedData?.items ||
    nestedData?.products ||
    nestedData?.result ||
    (Array.isArray(nestedData) ? nestedData : [])
  );
}

function unwrap(res) {
  return res?.data?.data ?? res?.data ?? res;
}

function uniqueById(list) {
  const map = new Map();

  (list || []).forEach((item) => {
    if (item?.id) map.set(item.id, item);
  });

  return [...map.values()];
}

function getErrorMessage(err, fallback = "Xəta baş verdi. Yenidən yoxlayın.") {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestWithRetry(request, attempts = 3) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await request();
    } catch (err) {
      lastError = err;

      if (attempt < attempts - 1) {
        await wait(250 * (attempt + 1));
      }
    }
  }

  throw lastError;
}

export default function HomePage() {
  const { text } = useLanguage();

  const allProductsRef = useRef(null);
  const errorTimerRef = useRef(null);
  const homeRequestIdRef = useRef(0);
  const brandRequestIdRef = useRef(0);

  const [campaigns, setCampaigns] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bannerDetail, setBannerDetail] = useState(null);
  const [homeSections, setHomeSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsAnimationVersion, setProductsAnimationVersion] = useState(0);
  const [filterActive, setFilterActive] = useState(false);

  const [allProductsVisible, setAllProductsVisible] = useState(false);

  const [showBannerPopup, setShowBannerPopup] = useState(false);
  const [closingBannerPopup, setClosingBannerPopup] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(
    !sessionStorage.getItem("nemesis_home_loaded_once"),
  );
  const [filterLoading, setFilterLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);

  const [showScrollTop, setShowScrollTop] = useState(false);

  const [toast, setToast] = useState("");
  const [toastClosing, setToastClosing] = useState(false);
  const activeBanner = useMemo(() => {
    return banners.find((banner) => banner?.imageUrl) || null;
  }, [banners]);

  const sliderCampaigns = campaigns;

  const descHasText = Boolean(text.allProductsDesc);
  const HOME_LOADED_KEY = "nemesis_home_loaded_once";
  const MIN_LOADER_TIME = 750;

  useEffect(() => {
    // Fast Refresh və ya əvvəlki versiyadan qalan inline scroll kilidini təmizlə.
    releaseBannerScroll();
  }, []);

  useEffect(() => {
    loadHome();
    trackVisit("/").catch(() => {});
  }, []);

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 520);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!activeBanner?.id) return;

    const alreadyShown = sessionStorage.getItem("nemesis_banner_popup_shown");
    if (alreadyShown === "true") return;

    let alive = true;

    async function loadBannerDetail() {
      try {
        const res = await getPromoPage(activeBanner.id);
        if (!alive) return;

        setBannerDetail(unwrap(res));
        setShowBannerPopup(true);
        setClosingBannerPopup(false);
        sessionStorage.setItem("nemesis_banner_popup_shown", "true");
      } catch {
        if (!alive) return;

        setBannerDetail(activeBanner);
        setShowBannerPopup(true);
        setClosingBannerPopup(false);
        sessionStorage.setItem("nemesis_banner_popup_shown", "true");
      }
    }

    loadBannerDetail();

    return () => {
      alive = false;
    };
  }, [activeBanner]);

  useEffect(() => {
    // Banner qlobal body/html scroll stilinə toxunmur. Hər state dəyişikliyində
    // əvvəlki versiyadan qala biləcək kilidi yalnız təmizləyirik.
    releaseBannerScroll();
  }, [showBannerPopup]);

  useEffect(() => {
    if (products.length === 0 || allProductsVisible) return undefined;

    // Kartların görünməsi IntersectionObserver-dən asılı qalmır. Bəzi mobil
    // brauzerlərdə observer gecikəndə link yaranır, amma kart opacity: 0 qalırdı.
    const revealTimer = window.setTimeout(() => {
      setAllProductsVisible(true);
    }, 40);

    return () => window.clearTimeout(revealTimer);
  }, [products.length, allProductsVisible]);

  useEffect(() => {
    function resetHomeFilters() {
      brandRequestIdRef.current += 1;
      setFilterLoading(false);
      setFilterActive(false);
      loadHome();

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }

    window.addEventListener("nemesis_home_reset", resetHomeFilters);

    return () => {
      window.removeEventListener("nemesis_home_reset", resetHomeFilters);
    };
  }, []);
  useEffect(() => {
    if (loading || products.length === 0) return;

    const productId = sessionStorage.getItem("nemesis_return_product_id");
    const scrollY = sessionStorage.getItem("nemesis_return_scroll_y");

    if (!productId && !scrollY) return;

    const timer = window.setTimeout(() => {
      const card = productId
        ? document.querySelector(`[data-home-product-id="${productId}"]`)
        : null;

      if (card) {
        card.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else if (scrollY) {
        window.scrollTo({
          top: Number(scrollY),
          left: 0,
          behavior: "smooth",
        });
      }

      sessionStorage.removeItem("nemesis_return_product_id");
      sessionStorage.removeItem("nemesis_return_scroll_y");
    }, 900);

    return () => window.clearTimeout(timer);
  }, [loading, products.length]);

  function showError(message) {
    clearTimeout(errorTimerRef.current);

    setToast(message);
    setToastClosing(false);

    errorTimerRef.current = setTimeout(() => {
      setToastClosing(true);

      setTimeout(() => {
        setToast("");
        setToastClosing(false);
      }, 320);
    }, 4200);
  }

  async function loadHome() {
    const requestId = ++homeRequestIdRef.current;
    const shouldShowLoader =
      products.length === 0 || !sessionStorage.getItem(HOME_LOADED_KEY);
    const startedAt = Date.now();
    const standardPageSize = getProductPageSize();
    const restoringProduct = Boolean(
      sessionStorage.getItem("nemesis_return_product_id"),
    );
    const initialPageSize = restoringProduct ? 60 : standardPageSize;

    try {
      if (shouldShowLoader) {
        setLoading(true);
      }

      setFilterActive(false);

      const [campaignResult, bannerResult, homeSectionsResult, productsResult] =
        await Promise.allSettled([
          requestWithRetry(() => getActiveCampaigns()),
          requestWithRetry(() => getActiveBanners()),
          requestWithRetry(() => getActiveHomeSections()),
          requestWithRetry(() =>
            getProducts({
              page: 1,
              pageSize: initialPageSize,
            }),
          ),
        ]);

      if (requestId !== homeRequestIdRef.current) return;

      if (campaignResult.status === "fulfilled") {
        setCampaigns(uniqueById(normalizeList(campaignResult.value)));
      }

      if (bannerResult.status === "fulfilled") {
        setBanners(uniqueById(normalizeList(bannerResult.value)));
      }

      if (homeSectionsResult.status === "fulfilled") {
        setHomeSections(uniqueById(normalizeList(homeSectionsResult.value)));
      }

      if (productsResult.status === "fulfilled") {
        const initialProducts = uniqueById(normalizeList(productsResult.value));

        setAllProductsVisible(false);
        setProducts(initialProducts);
        setProductsAnimationVersion((prev) => prev + 1);
        setPage(
          restoringProduct
            ? Math.max(1, Math.ceil(initialProducts.length / standardPageSize))
            : 1,
        );
        setHasMore(initialProducts.length >= initialPageSize);
        sessionStorage.setItem(HOME_LOADED_KEY, "true");
      }

      const failedResult = [
        campaignResult,
        bannerResult,
        homeSectionsResult,
        productsResult,
      ].find((result) => result.status === "rejected");

      if (failedResult) {
        showError(
          getErrorMessage(
            failedResult.reason,
            "Bəzi məlumatlar yüklənmədi. Yenidən yoxlayın.",
          ),
        );
      }

      if (shouldShowLoader) {
        const elapsed = Date.now() - startedAt;
        const wait = Math.max(0, MIN_LOADER_TIME - elapsed);

        if (wait > 0) {
          await new Promise((resolve) => setTimeout(resolve, wait));
        }
      }
    } catch (err) {
      showError(getErrorMessage(err, "Ana səhifə yüklənmədi."));
    } finally {
      if (requestId === homeRequestIdRef.current) {
        setLoading(false);
      }
    }
  }

  async function loadMore() {
    if (moreLoading) return;

    try {
      setMoreLoading(true);

      const nextPage = page + 1;
      const pageSize = getProductPageSize();
      const res = await getProducts({
        page: nextPage,
        pageSize,
      });
      const newProducts = normalizeList(res);

      setProducts((prev) => uniqueById([...prev, ...newProducts]));
      setPage(nextPage);
      setHasMore(newProducts.length >= pageSize);

      setTimeout(() => {
        setAllProductsVisible(true);
      }, 40);
    } catch (err) {
      showError(getErrorMessage(err, "Məhsullar yüklənmədi."));
    } finally {
      setMoreLoading(false);
    }
  }

  function handleFilteredProducts(list) {
    // Filter nəticəsi gəldikdən sonra gecikmiş ana səhifə sorğusu bu siyahının
    // üstünə yaza bilməsin.
    homeRequestIdRef.current += 1;
    brandRequestIdRef.current += 1;
    setLoading(false);
    setFilterLoading(false);
    setFilterActive(true);
    setProducts(uniqueById(list));
    setProductsAnimationVersion((prev) => prev + 1);
    setPage(1);
    setHasMore(false);
    setAllProductsVisible(false);

    setTimeout(() => {
      setAllProductsVisible(true);

      allProductsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  async function handleBrandChange(brandId) {
    if (!brandId) return;

    const requestId = ++brandRequestIdRef.current;

    // Ana səhifənin gecikmiş cavabı brend nəticəsini əvəz etməsin.
    homeRequestIdRef.current += 1;
    setLoading(false);
    setFilterActive(true);
    setFilterLoading(true);

    try {
      const res = await requestWithRetry(() =>
        getProducts({
          brandId,
          page: 1,
          pageSize: 100,
        }),
      );

      if (requestId !== brandRequestIdRef.current) return;

      const brandProducts = uniqueById(normalizeList(res));

      setProducts(brandProducts);
      setProductsAnimationVersion((prev) => prev + 1);
      setPage(1);
      setHasMore(false);
      setAllProductsVisible(false);

      window.setTimeout(() => {
        if (requestId !== brandRequestIdRef.current) return;

        setAllProductsVisible(true);
        allProductsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    } catch (err) {
      if (requestId === brandRequestIdRef.current) {
        showError(getErrorMessage(err, "Brend məhsulları yüklənmədi."));
      }
    } finally {
      if (requestId === brandRequestIdRef.current) {
        setFilterLoading(false);
      }
    }
  }
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function getProductPageSize() {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return 6; // telefon: 3 sıra x 2 məhsul
    }

    return 12; // komputer/planset: 3 sıra x 4 məhsul
  }

  function releaseBannerScroll() {
    const body = document.body;
    const root = document.documentElement;
    const storedScrollY = Number(body.dataset.nemesisBannerScrollY);
    const lockedTop = Math.abs(Number.parseFloat(body.style.top || "0"));
    const savedScrollY = Number.isFinite(storedScrollY)
      ? storedScrollY
      : lockedTop || window.scrollY;

    // Köhnə dəyəri geri yazmırıq: o dəyər də `hidden/fixed` qala bilər.
    // Banner və əvvəlki versiyaların yarada biləcəyi bütün inline kilidləri silirik.
    [
      "position",
      "top",
      "left",
      "right",
      "width",
      "height",
      "max-height",
      "overflow",
      "overflow-y",
      "overscroll-behavior",
      "overscroll-behavior-y",
      "touch-action",
      "padding-right",
    ].forEach((property) => body.style.removeProperty(property));

    [
      "position",
      "height",
      "max-height",
      "overflow",
      "overflow-y",
      "overscroll-behavior",
      "overscroll-behavior-y",
      "touch-action",
    ].forEach((property) => root.style.removeProperty(property));

    body.classList.remove("overflow-hidden", "fixed", "inset-0", "w-full");
    root.classList.remove("overflow-hidden");

    delete body.dataset.nemesisBannerOpen;
    delete body.dataset.nemesisBannerScrollY;

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: savedScrollY, left: 0, behavior: "auto" });
    });
  }

  function closeBannerPopup() {
    setClosingBannerPopup(true);

    setTimeout(() => {
      // Effektin cleanup-u brauzerdə geciksə belə səhifə kilidli qalmasın.
      releaseBannerScroll();
      setShowBannerPopup(false);
      setClosingBannerPopup(false);
    }, 320);
  }

  if (loading) return <AppLoader text={text.loading} />;

  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-950">
      <style>
        {`
          @keyframes bannerBackdropIn {
            from { opacity: 0; backdrop-filter: blur(0px); }
            to { opacity: 1; backdrop-filter: blur(7px); }
          }

          @keyframes bannerBackdropOut {
            from { opacity: 1; backdrop-filter: blur(7px); }
            to { opacity: 0; backdrop-filter: blur(0px); }
          }

          @keyframes bannerPopupIn {
            0% { opacity: 0; transform: translateY(22px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes bannerPopupOut {
            from { opacity: 1; transform: translateY(0) scale(1); }
            to { opacity: 0; transform: translateY(18px) scale(0.97); }
          }

          @keyframes softHomeIn {
            from {
              opacity: 0;
              transform: translateY(14px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes homeProductReveal {
            from {
              opacity: 0;
              transform: translateY(22px) scale(0.985);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes filteredProductsIn {
            from {
              opacity: 0;
              transform: translateY(18px);
              filter: blur(5px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
              filter: blur(0);
            }
          }

          @keyframes toastIn {
            from {
              opacity: 0;
              transform: translateY(22px) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes toastOut {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            to {
              opacity: 0;
              transform: translateY(18px) scale(0.97);
            }
          }

          @keyframes scrollTopIn {
            from {
              opacity: 0;
              transform: translateY(18px) scale(0.9);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes scrollTopArrow {
            0%, 100% { transform: translateY(2px); }
            50% { transform: translateY(-3px); }
          }
        `}
      </style>

      <div className="relative min-h-screen bg-[#fafafa]">
        <div className="relative z-30 animate-[softHomeIn_0.45s_ease_both]">
          <ProductDiscoveryBar
            onProductsChange={handleFilteredProducts}
            onBrandChange={handleBrandChange}
          />
        </div>

        {!filterActive && (
          <>
            <div className="relative z-10 animate-[softHomeIn_0.55s_ease_both]">
              <HomePromoSlider promos={sliderCampaigns} />
            </div>

            <div className="space-y-2">
              {homeSections
                .slice()
                .sort(
                  (a, b) =>
                    Number(a.displayOrder || 0) - Number(b.displayOrder || 0),
                )
                .map((section, index) => (
                  <div
                    key={section.id || `section-wrap-${index}`}
                    style={{
                      animation: `softHomeIn 0.55s ease ${index * 0.06}s both`,
                    }}
                  >
                    <ProductSection
                      title={section.title}
                      subtitle={section.subtitle}
                      products={uniqueById(section.products || [])}
                    />
                  </div>
                ))}
            </div>
          </>
        )}

        {products.length > 0 && (
          <section
            ref={allProductsRef}
            className={`mx-auto max-w-[1180px] px-5 py-8 transition-all duration-300 md:px-8 md:py-11 ${
              filterLoading
                ? "pointer-events-none translate-y-1 opacity-35"
                : "translate-y-0 opacity-100"
            }`}
          >
            <div
              className="mb-5 flex items-end justify-between gap-4"
              style={{
                opacity: 1,
                visibility: "visible",
                animation:
                  "homeProductReveal 0.6s cubic-bezier(0.22,1,0.36,1) both",
              }}
            >
              <div className="w-full">
                <p className="text-[16px] font-extrabold tracking-[0.22em] text-zinc-500">
                  nemesisbaku
                </p>

                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-zinc-950 md:text-3xl">
                  {text.allProducts}
                </h2>

                {descHasText && (
                  <div className="mt-2 max-w-[620px]">
                    <div className="relative overflow-hidden">
                      <p className="text-sm leading-6 text-zinc-600">
                        {text.allProductsDesc}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              key={`products-grid-${productsAnimationVersion}`}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
              style={{
                animation:
                  "filteredProductsIn 0.5s cubic-bezier(0.22,1,0.36,1) both",
              }}
            >
              {products.map((product, index) => {
                const delay = Math.min(index, 11) * 0.045;

                return (
                  <div
                    key={product.id || `product-wrap-${index}`}
                    data-home-product-id={product.id}
                    style={{
                      opacity: 1,
                      visibility: "visible",
                      backfaceVisibility: "hidden",
                      animation: `homeProductReveal 0.58s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
                    }}
                  >
                    <ProductCard product={product} />
                  </div>
                );
              })}
            </div>

            {!filterActive && hasMore && (
              <div
                className="mt-8 flex justify-center"
                style={{
                  opacity: 1,
                  visibility: "visible",
                  animation:
                    "homeProductReveal 0.6s cubic-bezier(0.22,1,0.36,1) 0.3s both",
                }}
              >
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={moreLoading}
                  className="rounded-full bg-[#120d09] px-8 py-4 text-sm font-extrabold text-white shadow-[0_16px_42px_rgba(15,15,15,0.16)] transition duration-300 hover:-translate-y-1 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60"
                >
                  {moreLoading ? text.loading : text.loadMore}
                </button>
              </div>
            )}

            {showScrollTop && (
              <div className="mt-9 flex justify-center pb-2">
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-zinc-200 bg-white p-2 pr-5 text-left text-zinc-950 shadow-[0_16px_45px_rgba(0,0,0,0.08)] transition duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_22px_55px_rgba(0,0,0,0.12)] active:scale-[0.97]"
                  style={{
                    animation:
                      "scrollTopIn 0.42s cubic-bezier(0.22,1,0.36,1) both",
                  }}
                  aria-label={text.backToTop || "Yuxarı qalx"}
                >
                  <span className="pointer-events-none absolute inset-0 translate-y-full bg-gradient-to-t from-zinc-100 to-transparent transition-transform duration-500 group-hover:translate-y-0" />

                  <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-zinc-950 text-white shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
                    <FiArrowUp className="text-xl animate-[scrollTopArrow_1.7s_ease-in-out_infinite]" />
                  </span>

                  <span className="relative flex flex-col">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-zinc-400">
                      nemesisbaku
                    </span>
                    <span className="mt-0.5 text-sm font-extrabold">
                      {text.backToTop || "Yuxarı qalx"}
                    </span>
                  </span>
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-5 left-1/2 z-[999999] w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white shadow-[0_24px_70px_rgba(0,0,0,0.28)] md:left-6 md:-translate-x-0 ${
            toastClosing
              ? "animate-[toastOut_0.32s_ease_both]"
              : "animate-[toastIn_0.38s_cubic-bezier(0.22,1,0.36,1)_both]"
          }`}
        >
          {toast}
        </div>
      )}

      {showBannerPopup && bannerDetail && (
        <BannerPopup
          banner={bannerDetail}
          closing={closingBannerPopup}
          onClose={closeBannerPopup}
        />
      )}
    </main>
  );
}

function BannerPopup({ banner, closing, onClose }) {
  const navigate = useNavigate();

  function openBanner() {
    if (!banner?.id) return;

    onClose();

    setTimeout(() => {
      navigate(`/promo/${banner.id}`);
    }, 260);
  }

  const popup = (
    <div
      style={{ touchAction: "none", overscrollBehavior: "contain" }}
      className={`fixed inset-0 z-[999999] flex h-dvh w-screen items-center justify-center bg-black/55 p-3 md:p-6 ${
        closing
          ? "animate-[bannerBackdropOut_0.32s_ease_both]"
          : "animate-[bannerBackdropIn_0.38s_ease_both]"
      }`}
    >
      <div
        className={`relative w-full max-w-[440px] overflow-hidden rounded-[18px] bg-[#f4f1ec] shadow-[0_30px_90px_rgba(0,0,0,0.32)] md:max-w-[960px] md:rounded-[22px] ${
          closing
            ? "animate-[bannerPopupOut_0.32s_ease_both]"
            : "animate-[bannerPopupIn_0.48s_cubic-bezier(0.22,1,0.36,1)_both]"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-40 grid h-9 w-9 place-items-center rounded-full bg-black/85 text-white transition hover:rotate-90 active:scale-[0.94] md:right-4 md:top-4 md:h-10 md:w-10"
          aria-label="Bağla"
        >
          <FiX />
        </button>

        <div className="relative grid max-h-[86dvh] min-h-[220px] place-items-center overflow-hidden bg-[#f4f1ec]">
          {banner.imageUrl ? (
            <img
              src={banner.imageUrl}
              alt={banner.title || "nemesisbaku banner"}
              className="block h-auto max-h-[86dvh] w-full object-contain"
              draggable="false"
            />
          ) : (
            <div className="grid h-[320px] w-full place-items-center text-zinc-400 md:h-[460px]">
              <FiImage className="text-[54px]" />
            </div>
          )}

          <button
            type="button"
            onClick={openBanner}
            className="absolute bottom-3 left-3 z-20 inline-flex h-9 items-center gap-2 rounded-full border border-white/80 bg-white/92 py-1 pl-4 pr-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-zinc-950 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white active:scale-[0.97] md:bottom-5 md:left-5 md:h-11 md:pl-5 md:pr-2 md:text-[10px]"
          >
            Kəşf et
            <span className="grid h-6 w-6 place-items-center rounded-full bg-zinc-950 text-[13px] text-white md:h-8 md:w-8 md:text-base">
              <FiChevronRight />
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(popup, document.body);
}