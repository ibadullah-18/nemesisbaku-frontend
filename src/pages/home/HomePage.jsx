import { useSearchParams } from "react-router-dom";
import HomeSearchResults from "../../components/search/HomeSearchResults";
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  FiArrowUp,
  FiChevronRight,
  FiImage,
  FiPackage,
  FiX,
} from "react-icons/fi";
import ProductDiscoveryBar, {
  preloadProductDiscoveryData,
} from "../../components/product/ProductDiscoveryBar";
import ProductCard from "../../components/product/ProductCard";
import ProductCardSkeleton from "../../components/product/ProductCardSkeleton";
import ProductSection from "../../components/home/ProductSection";
import HomePromoSlider from "../../components/home/HomePromoSlider";
import ShowcaseGroup from "../../components/home/ShowcaseGroup";
import { HOME_PAGE_SIZE, hasNextHomePage, showcaseAfterProduct } from "../../utils/showcase";
import HomeQuickDiscovery from "../../components/home/HomeQuickDiscovery";
import HomePageSkeleton from "../../components/home/HomePageSkeleton";
import {
  getActiveBanners,
  getActiveCampaigns,
  getActiveHomeSections,
  getActiveShowcaseGroups,
  getProducts,
  getPromoPage,
  trackVisit,
} from "../../api/homeApi";
import { useLanguage } from "../../i18n/LanguageContext";
import { showUserToast } from "../../utils/userToast";
import "./homePage.css";

const HOME_VIEW_STATE_KEY = "nemesis_home_view_state_v3";
const HOME_RETURN_PRODUCT_KEY = "nemesis_return_product_id";
const HOME_RETURN_SCROLL_KEY = "nemesis_return_scroll_y";
const HOME_VIEW_MAX_AGE = 30 * 60 * 1000;

const defaultDiscoveryFilters = {
  categoryId: "",
  brandId: "",
  sizeId: "",
  colorId: "",
  minPrice: "",
  maxPrice: "",
  isDiscounted: null,
  sortOrder: "",
  stockOnly: false,
};

const noProductsFallback = {
  az: "Məhsul yoxdur",
  ru: "Товаров нет",
  en: "No products found",
};

let homeViewMemoryCache = null;
function normalizeDiscoveryFilters(filters) {
  return {
    ...defaultDiscoveryFilters,
    ...(filters || {}),
    isDiscounted: filters?.isDiscounted === true ? true : null,
  };
}

function readRestorableHomeState() {
  const hasReturnMarker = Boolean(
    sessionStorage.getItem(HOME_RETURN_PRODUCT_KEY) ||
    sessionStorage.getItem(HOME_RETURN_SCROLL_KEY),
  );

  if (!hasReturnMarker) return null;

  try {
    const stored =
      homeViewMemoryCache ||
      JSON.parse(sessionStorage.getItem(HOME_VIEW_STATE_KEY) || "null");

    if (
      !stored ||
      Date.now() - Number(stored.savedAt || 0) > HOME_VIEW_MAX_AGE
    ) {
      clearHomeViewState();
      return null;
    }

    return {
      ...stored,
      campaigns: Array.isArray(stored.campaigns) ? stored.campaigns : [],
      banners: Array.isArray(stored.banners) ? stored.banners : [],
      homeSections: Array.isArray(stored.homeSections)
        ? stored.homeSections
        : [],
      products: Array.isArray(stored.products) ? stored.products : [],
      discoveryFilters: normalizeDiscoveryFilters(stored.discoveryFilters),
    };
  } catch {
    clearHomeViewState();
    return null;
  }
}

function storeHomeViewState(snapshot) {
  homeViewMemoryCache = snapshot;

  try {
    sessionStorage.setItem(HOME_VIEW_STATE_KEY, JSON.stringify(snapshot));
  } catch {
    // sessionStorage limiti dolsa belə SPA daxilində yaddaş cache-i işləyəcək.
  }
}

function clearHomeViewState() {
  homeViewMemoryCache = null;
  sessionStorage.removeItem(HOME_VIEW_STATE_KEY);
  sessionStorage.removeItem(HOME_RETURN_PRODUCT_KEY);
  sessionStorage.removeItem(HOME_RETURN_SCROLL_KEY);
}

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
  const [params] = useSearchParams();
  const query = (params.get("q") || "").trim().slice(0, 80);

  return query
    ? <HomeSearchResults key={query} query={query} />
    : <HomeLandingPage />;
}

function HomeLandingPage() {
  const { text, lang } = useLanguage();
  const [restoredHomeState] = useState(readRestorableHomeState);
  const restoredFromDetails = Boolean(restoredHomeState);

  const allProductsRef = useRef(null);
  const homeRequestIdRef = useRef(0);
  const morePendingRef = useRef(false);
  const latestHomeStateRef = useRef(null);
  const productNavigationSavedRef = useRef(false);

  const [campaigns, setCampaigns] = useState(
    () => restoredHomeState?.campaigns || [],
  );
  const [banners, setBanners] = useState(
    () => restoredHomeState?.banners || [],
  );
  const [bannerDetail, setBannerDetail] = useState(null);
  const [showcaseGroups, setShowcaseGroups] = useState(() => restoredHomeState?.showcaseGroups || []);
  const [homeSections, setHomeSections] = useState(
    () => restoredHomeState?.homeSections || [],
  );
  const [products, setProducts] = useState(
    () => restoredHomeState?.products || [],
  );
  const [productsAnimationVersion, setProductsAnimationVersion] = useState(0);
  const [resultAnimationsEnabled, setResultAnimationsEnabled] =
    useState(!restoredFromDetails);
  const [filterActive, setFilterActive] = useState(
    () => restoredHomeState?.filterActive === true,
  );
  const [discoveryFilters, setDiscoveryFilters] = useState(() =>
    normalizeDiscoveryFilters(restoredHomeState?.discoveryFilters),
  );

  const [allProductsVisible, setAllProductsVisible] =
    useState(restoredFromDetails);

  const [showBannerPopup, setShowBannerPopup] = useState(false);
  const [closingBannerPopup, setClosingBannerPopup] = useState(false);

  const [page, setPage] = useState(() => restoredHomeState?.page || 1);
  const [hasMore, setHasMore] = useState(
    () => restoredHomeState?.hasMore ?? true,
  );
  const [loading, setLoading] = useState(!restoredFromDetails);
  const [filterLoading, setFilterLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);

  const [showScrollTop, setShowScrollTop] = useState(false);

  const activeBanner = useMemo(() => {
    return banners.find((banner) => banner?.imageUrl) || null;
  }, [banners]);

  const sliderCampaigns = campaigns;

  const descHasText = Boolean(text.allProductsDesc);
  const noProductsText =
    text.noProducts || noProductsFallback[lang] || noProductsFallback.az;
  latestHomeStateRef.current = {
    showcaseGroups,
    campaigns,
    banners,
    homeSections,
    products,
    page,
    hasMore,
    filterActive,
    discoveryFilters,
  };

  useEffect(() => {
    // Fast Refresh və ya əvvəlki versiyadan qalan inline scroll kilidini təmizlə.
    releaseBannerScroll();
  }, []);

  useEffect(() => {
    // Loader görünərkən brand/category məlumatlarını da paralel hazırla.
    // ProductDiscoveryBar açıldıqda eyni request təkrarlanmır, module cache işləyir.
    preloadProductDiscoveryData().catch(() => {});

    if (!restoredFromDetails) {
      loadHome();
    }

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
      clearHomeViewState();
      setFilterLoading(false);
      setFilterActive(false);
      setDiscoveryFilters({ ...defaultDiscoveryFilters });
      setResultAnimationsEnabled(true);
      loadHome({ showInitialLoader: false });

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

  useLayoutEffect(() => {
    if (!restoredFromDetails) return undefined;

    const storedScrollY = Number(
      restoredHomeState?.scrollY ??
        sessionStorage.getItem(HOME_RETURN_SCROLL_KEY) ??
        0,
    );
    const safeScrollY = Number.isFinite(storedScrollY)
      ? Math.max(0, storedScrollY)
      : 0;

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    const restoreScroll = () => {
      window.scrollTo({ top: safeScrollY, left: 0, behavior: "auto" });
    };

    restoreScroll();

    let secondFrame;
    const firstFrame = window.requestAnimationFrame(() => {
      restoreScroll();

      secondFrame = window.requestAnimationFrame(() => {
        restoreScroll();
        root.style.scrollBehavior = previousScrollBehavior;
        sessionStorage.removeItem(HOME_RETURN_PRODUCT_KEY);
        sessionStorage.removeItem(HOME_RETURN_SCROLL_KEY);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);

      if (secondFrame) {
        window.cancelAnimationFrame(secondFrame);
      }

      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, [restoredFromDetails, restoredHomeState]);

  useEffect(() => {
    return () => {
      if (
        !productNavigationSavedRef.current &&
        (sessionStorage.getItem(HOME_RETURN_PRODUCT_KEY) ||
          sessionStorage.getItem(HOME_RETURN_SCROLL_KEY))
      ) {
        persistCurrentHomeView();
      }
    };
  }, []);

  function persistCurrentHomeView(productId = "") {
    const scrollY = Math.max(0, window.scrollY || 0);
    const snapshot = {
      ...latestHomeStateRef.current,
      scrollY,
      productId,
      savedAt: Date.now(),
    };

    storeHomeViewState(snapshot);
    sessionStorage.setItem(HOME_RETURN_SCROLL_KEY, String(scrollY));

    if (productId) {
      sessionStorage.setItem(HOME_RETURN_PRODUCT_KEY, productId);
    }
  }

  function rememberHomeBeforeProductOpen(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest('a[href*="/products/"]');
    if (!link) return;

    try {
      const url = new URL(link.href, window.location.origin);
      const match = url.pathname.match(/^\/products\/([^/]+)\/?$/i);
      if (!match) return;

      productNavigationSavedRef.current = true;
      persistCurrentHomeView(decodeURIComponent(match[1]));
    } catch {
      // Etibarlı məhsul linki deyilsə keçidi dəyişmirik.
    }
  }

  function showError(message) {
    showUserToast(message, "error");
  }

  async function loadHome({ showInitialLoader = true } = {}) {
    const requestId = ++homeRequestIdRef.current;
    const shouldShowLoader = showInitialLoader && products.length === 0;
    const standardPageSize = getProductPageSize();
    const initialPageSize = standardPageSize;

    try {
      if (shouldShowLoader) {
        setLoading(true);
      }

      setFilterActive(false);

      const [campaignResult, bannerResult, homeSectionsResult, productsResult, showcaseResult] =
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
          requestWithRetry(() => getActiveShowcaseGroups()),
        ]);

      if (requestId !== homeRequestIdRef.current) return;
      if (showcaseResult.status === "fulfilled") {
        setShowcaseGroups(normalizeList(showcaseResult.value));
      }

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
        setPage(1);
        setHasMore(hasNextHomePage(productsResult.value, initialProducts.length, 1));
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
    } catch (err) {
      showError(getErrorMessage(err, "Ana səhifə yüklənmədi."));
    } finally {
      if (requestId === homeRequestIdRef.current) {
        setLoading(false);
      }
    }
  }

  async function loadMore() {
    if (morePendingRef.current || moreLoading || filterActive || !hasMore) return;
    morePendingRef.current = true;
    const requestId = homeRequestIdRef.current;

    try {
      setMoreLoading(true);

      const nextPage = page + 1;
      const pageSize = getProductPageSize();
      const res = await getProducts({
        page: nextPage,
        pageSize,
      });
      const newProducts = normalizeList(res);
      if (requestId !== homeRequestIdRef.current) return;

      setProducts((prev) => uniqueById([...prev, ...newProducts]));
      setPage(nextPage);
      setHasMore(hasNextHomePage(res, newProducts.length, nextPage));

      setTimeout(() => {
        setAllProductsVisible(true);
      }, 40);
    } catch (err) {
      if (requestId === homeRequestIdRef.current) showError(getErrorMessage(err, "Məhsullar yüklənmədi."));
    } finally {
      morePendingRef.current = false;
      setMoreLoading(false);
    }
  }

  function handleFilteredProducts(list, meta = {}) {
    if (meta.reset || meta.active === false) {
      setFilterLoading(false);
      setFilterActive(false);
      setDiscoveryFilters({ ...defaultDiscoveryFilters });
      setResultAnimationsEnabled(true);
      loadHome({ showInitialLoader: false });
      return;
    }

    // Filter nəticəsi gəldikdən sonra gecikmiş ana səhifə sorğusu bu siyahının
    // üstünə yaza bilməsin.
    homeRequestIdRef.current += 1;
    setLoading(false);
    setFilterLoading(false);
    setFilterActive(meta.active ?? true);
    setDiscoveryFilters(normalizeDiscoveryFilters(meta.filters));
    setResultAnimationsEnabled(true);
    setProducts(uniqueById(list));
    setProductsAnimationVersion((prev) => prev + 1);
    setPage(1);
    setHasMore(false);
    setAllProductsVisible(false);

    setTimeout(() => {
      setAllProductsVisible(true);

      if (meta.source === "quick-discovery") {
        allProductsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 80);
  }
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function getProductPageSize() {
    return HOME_PAGE_SIZE;
  }

  function releaseBannerScroll() {
    const body = document.body;
    const root = document.documentElement;

    // Filter modalı açıqdırsa onun scroll qaydalarına toxunma.
    if (body.dataset.nemesisFilterOpen === "true") return;

    const storedScrollY = Number(body.dataset.nemesisBannerScrollY);
    const lockedTop = Math.abs(Number.parseFloat(body.style.top || "0"));
    const returnScrollY = Number(
      sessionStorage.getItem(HOME_RETURN_SCROLL_KEY),
    );
    const hasReturnScroll =
      sessionStorage.getItem(HOME_RETURN_SCROLL_KEY) !== null &&
      Number.isFinite(returnScrollY);
    const savedScrollY = hasReturnScroll
      ? returnScrollY
      : Number.isFinite(storedScrollY)
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

  if (loading) return <HomePageSkeleton />;

  return (
    <main
      onClickCapture={rememberHomeBeforeProductOpen}
      className="nemesis-home-page min-h-screen bg-[#fafafa] text-zinc-950"
    >
      <style>
        {`
          @keyframes bannerBackdropIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes bannerBackdropOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }

          @keyframes bannerPopupIn {
            0% { opacity: 0; transform: translateY(10px) scale(0.985); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes bannerPopupOut {
            from { opacity: 1; transform: translateY(0) scale(1); }
            to { opacity: 0; transform: translateY(8px) scale(0.99); }
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
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes filteredProductsIn {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes emptyProductsIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
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

      <div className="nemesis-home-canvas relative min-h-screen">
        <div
          className={
            restoredFromDetails
              ? "nemesis-home-discovery relative z-30"
              : "nemesis-home-discovery relative z-30 animate-[softHomeIn_0.22s_ease-out_both]"
          }
        >
          <ProductDiscoveryBar
            onProductsChange={handleFilteredProducts}
            onLoadingChange={setFilterLoading}
            initialFilters={discoveryFilters}
          />
        </div>

        {!filterActive && (
          <>
            <div
              className={
                restoredFromDetails
                  ? "nemesis-home-feature relative z-10"
                  : "nemesis-home-feature relative z-10 animate-[softHomeIn_0.22s_ease-out_both]"
              }
            >
              <HomePromoSlider promos={sliderCampaigns} />
            </div>

            <div className="nemesis-home-sections space-y-2">
              {homeSections
                .slice()
                .sort(
                  (a, b) =>
                    Number(a.displayOrder || 0) - Number(b.displayOrder || 0),
                )
                .map((section, index) => (
                  <div
                    key={section.id || `section-wrap-${index}`}
                    style={
                      restoredFromDetails
                        ? undefined
                        : {
                            animation: "softHomeIn 0.22s ease-out both",
                          }
                    }
                  >
                    <ProductSection
                      title={section.title}
                      products={uniqueById(section.products || [])}
                    />
                  </div>
                ))}
            </div>

          </>
        )}

        <HomeQuickDiscovery lang={lang} activeFilters={discoveryFilters} />

        {(products.length > 0 || filterLoading) && (
          <section
            ref={allProductsRef}
            className="nemesis-home-catalog mx-auto max-w-[1240px] px-5 py-8 md:px-8 md:py-12"
          >
            <div
              className="nemesis-home-catalog__heading mb-6 flex items-end justify-between gap-4"
              style={{
                opacity: 1,
                visibility: "visible",
                animation: !resultAnimationsEnabled
                  ? "none"
                  : "homeProductReveal 0.22s ease-out both",
              }}
            >
              <div className="w-full">
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
              className="nemesis-home-product-grid grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
              style={{
                animation: !resultAnimationsEnabled
                  ? "none"
                  : "filteredProductsIn 0.22s ease-out both",
              }}
            >
              {filterLoading
                ? Array.from({ length: getProductPageSize() }).map(
                    (_, index) => (
                      <ProductCardSkeleton key={`filter-skeleton-${index}`} />
                    ),
                  )
                : products.map((product, index) => {
                    const showcase = !filterActive && showcaseAfterProduct(showcaseGroups, index + 1);
                    return (
                      <Fragment key={product.id || `product-wrap-${index}`}>
                      <div
                        data-home-product-id={product.id}
                        style={{
                          opacity: 1,
                          visibility: "visible",
                          backfaceVisibility: "hidden",
                          transformOrigin: "center bottom",
                          willChange: "transform",
                          animation: !resultAnimationsEnabled
                            ? "none"
                            : "homeProductReveal 0.22s ease-out both",
                        }}
                      >
                        <ProductCard product={product} />
                      </div>
                      {showcase && <div className="nb-showcase-slot"><ShowcaseGroup group={showcase} /></div>}
                      </Fragment>
                    );
                  })}

              {moreLoading &&
                Array.from({ length: getProductPageSize() }).map((_, index) => (
                  <ProductCardSkeleton key={`more-skeleton-${index}`} />
                ))}
            </div>

            {!filterActive && hasMore && (
              <div
                className="mt-8 flex justify-center"
                style={{
                  opacity: 1,
                  visibility: "visible",
                  animation: "homeProductReveal 0.22s ease-out both",
                }}
              >
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={moreLoading}
                  className="nemesis-home-load-more rounded-full bg-[#120d09] px-8 py-4 text-sm font-extrabold text-white shadow-[0_16px_42px_rgba(15,15,15,0.16)] transition duration-300 hover:-translate-y-1 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60"
                >
                  {text.loadMore}
                </button>
              </div>
            )}

            {showScrollTop && page >= 3 && !filterActive && (
              <div className="nb-back-top-wrap">
                <button
                  type="button"
                  className="nb-back-top"
                  onClick={scrollToTop}
                  aria-label={text.backToTop || "Yuxarı qalx"}
                >
                  <FiArrowUp aria-hidden="true" />
                </button>
              </div>
            )}
          </section>
        )}

        {filterActive && !filterLoading && products.length === 0 && (
          <section
            key={`empty-products-${productsAnimationVersion}`}
            className="mx-auto grid min-h-[calc(100dvh-190px)] max-w-[1180px] place-items-center px-5 py-12 md:px-8"
          >
            <div
              className="text-center"
              style={{
                transformOrigin: "center",
                animation: resultAnimationsEnabled
                  ? "emptyProductsIn 0.22s ease-out both"
                  : "none",
              }}
            >
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-zinc-200 bg-white text-[27px] text-zinc-400 md:h-[72px] md:w-[72px] md:text-[30px]">
                <FiPackage />
              </div>

              <p className="mt-5 text-[20px] font-extrabold tracking-[-0.025em] text-zinc-950 md:text-[24px]">
                {noProductsText}
              </p>
            </div>
          </section>
        )}
      </div>

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
            <picture className="block w-full">
              <source
                media="(max-width: 639px)"
                srcSet={banner.mobileImageUrl || banner.imageUrl}
              />
              <img
                src={banner.imageUrl}
                alt={banner.title || "nemesisbaku banner"}
                className="block h-auto max-h-[86dvh] w-full object-contain"
                draggable="false"
              />
            </picture>
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
