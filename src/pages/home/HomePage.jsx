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

function getProductImage(product) {
  return product?.mainImageUrl || product?.imageUrl || product?.image || "";
}

function money(value) {
  return `${Number(value || 0).toFixed(2)} ₼`;
}

function getErrorMessage(err, fallback = "Xəta baş verdi. Yenidən yoxlayın.") {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}

export default function HomePage() {
  const { text } = useLanguage();

  const allProductsRef = useRef(null);
  const errorTimerRef = useRef(null);
  const ignoreDiscoveryChangesRef = useRef(true);

  const [campaigns, setCampaigns] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bannerDetail, setBannerDetail] = useState(null);
  const [homeSections, setHomeSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [filterActive, setFilterActive] = useState(false);

  const [allProductsVisible, setAllProductsVisible] = useState(false);

  const [showBannerPopup, setShowBannerPopup] = useState(false);
  const [closingBannerPopup, setClosingBannerPopup] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(
    !sessionStorage.getItem("nemesis_home_loaded_once"),
  );
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
    if (!showBannerPopup) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = oldOverflow;
    };
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
      setFilterActive(false);
      ignoreDiscoveryChangesRef.current = true;
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
    const shouldShowLoader = !sessionStorage.getItem(HOME_LOADED_KEY);
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

      setPage(1);
      setAllProductsVisible(false);

      const [campaignRes, bannerRes, homeSectionsRes, productsRes] =
        await Promise.all([
          getActiveCampaigns().catch(() => []),
          getActiveBanners().catch(() => []),
          getActiveHomeSections().catch(() => []),
          getProducts({
            page: 1,
            pageSize: initialPageSize,
          }).catch(() => []),
        ]);

      const initialProducts = uniqueById(normalizeList(productsRes));

      setCampaigns(uniqueById(normalizeList(campaignRes)));
      setBanners(uniqueById(normalizeList(bannerRes)));
      setHomeSections(uniqueById(normalizeList(homeSectionsRes)));
      setProducts(initialProducts);
      setPage(
        restoringProduct
          ? Math.max(1, Math.ceil(initialProducts.length / standardPageSize))
          : 1,
      );
      setHasMore(initialProducts.length >= initialPageSize);
      setFilterActive(false);
      ignoreDiscoveryChangesRef.current = true;

      setTimeout(() => {
        ignoreDiscoveryChangesRef.current = false;
      }, 1200);
      sessionStorage.setItem(HOME_LOADED_KEY, "true");

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
      setLoading(false);
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
    if (ignoreDiscoveryChangesRef.current) {
      return;
    }

    setFilterActive(true);
    setProducts(uniqueById(list));
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

  function closeBannerPopup() {
    setClosingBannerPopup(true);

    setTimeout(() => {
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
          <ProductDiscoveryBar onProductsChange={handleFilteredProducts} />
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
            className="mx-auto max-w-[1180px] px-5 py-8 md:px-8 md:py-11"
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

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
  const products = uniqueById(banner?.products || []).slice(0, 4);

  function openBanner() {
    if (!banner?.id) return;

    onClose();

    setTimeout(() => {
      navigate(`/promo/${banner.id}`);
    }, 260);
  }

  const popup = (
    <div
      className={`fixed left-0 top-0 z-[999999] flex h-screen w-screen items-center justify-center bg-black/50 px-3 ${
        closing
          ? "animate-[bannerBackdropOut_0.32s_ease_both]"
          : "animate-[bannerBackdropIn_0.38s_ease_both]"
      }`}
    >
      <div
        className={`relative w-full max-w-[430px] overflow-hidden rounded-[30px] bg-[#efe7da] shadow-[0_34px_100px_rgba(0,0,0,0.34)] md:max-w-[920px] ${
          closing
            ? "animate-[bannerPopupOut_0.32s_ease_both]"
            : "animate-[bannerPopupIn_0.48s_cubic-bezier(0.22,1,0.36,1)_both]"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-40 grid h-8 w-8 place-items-center rounded-full bg-black/85 text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur-md transition active:scale-[0.94] md:right-4 md:top-4 md:h-10 md:w-10"
          aria-label="Bağla"
        >
          <FiX />
        </button>

        <div className="relative min-h-[560px] overflow-hidden md:min-h-[560px]">
          {banner.imageUrl ? (
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="absolute inset-0 h-full w-full object-cover opacity-85"
              draggable="false"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-zinc-400">
              <FiImage className="text-[54px]" />
            </div>
          )}

          <div className="absolute inset-0 bg-[#efe7da]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#efe7da]/95 via-[#efe7da]/50 to-transparent" />

          <div className="relative z-10 flex min-h-[560px] flex-col justify-end p-4 md:p-8">
            <div className="max-w-[270px] text-left md:max-w-[430px]">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.34em] text-zinc-700 md:text-xs">
                nemesisbaku
              </p>

              <h2 className="text-[42px] font-extrabold leading-[0.92] tracking-[-0.065em] text-zinc-950 md:text-[72px]">
                {banner.title}
              </h2>

              {banner.description && (
                <p className="mt-3 max-w-[360px] text-xs font-semibold leading-5 text-zinc-700 md:text-sm md:leading-6">
                  {banner.description}
                </p>
              )}

              <button
                type="button"
                onClick={openBanner}
                className="mt-5 inline-flex h-11 items-center gap-4 rounded-[10px] bg-zinc-950 px-6 text-xs font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition hover:gap-6 active:scale-[0.97] md:h-14 md:rounded-[14px] md:px-8 md:text-sm"
              >
                Kəşf et
                <FiChevronRight className="text-lg md:text-xl" />
              </button>
            </div>

            {products.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
                {products.map((product, index) => (
                  <button
                    key={product.id || `banner-product-${index}`}
                    type="button"
                    onClick={openBanner}
                    className={`group overflow-hidden rounded-[14px] bg-white/92 text-left shadow-[0_16px_42px_rgba(0,0,0,0.13)] transition active:scale-[0.97] md:rounded-[18px] ${
                      index > 1 ? "hidden md:block" : ""
                    }`}
                  >
                    <div className="h-20 bg-zinc-100 md:h-28">
                      {getProductImage(product) ? (
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          draggable="false"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-zinc-300">
                          <FiImage />
                        </div>
                      )}
                    </div>

                    <div className="p-2 md:p-3">
                      <p className="line-clamp-1 text-[11px] font-extrabold text-zinc-950 md:text-xs">
                        {product.name || "Məhsul"}
                      </p>

                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-[11px] font-extrabold text-zinc-950 md:text-xs">
                          {money(product.discountPrice || product.price)}
                        </span>

                        {product.discountPrice ? (
                          <span className="text-[9px] font-bold text-zinc-400 line-through md:text-[10px]">
                            {money(product.price)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(popup, document.body);
}