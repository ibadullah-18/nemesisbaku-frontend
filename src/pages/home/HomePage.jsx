import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FiChevronRight, FiImage, FiX } from "react-icons/fi";
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
  const data = res?.data || res;

  return (
    data?.items ||
    data?.products ||
    data?.result ||
    data?.data ||
    (Array.isArray(data) ? data : [])
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

export default function HomePage() {
  const { text } = useLanguage();

  const [campaigns, setCampaigns] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bannerDetail, setBannerDetail] = useState(null);
  const [homeSections, setHomeSections] = useState([]);
  const [products, setProducts] = useState([]);

  const [showBannerPopup, setShowBannerPopup] = useState(false);
  const [closingBannerPopup, setClosingBannerPopup] = useState(false);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);

  const activeBanner = useMemo(() => {
    return banners.find((banner) => banner?.imageUrl) || null;
  }, [banners]);

  useEffect(() => {
    loadHome();
    trackVisit("/").catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeBanner?.slug) return;

    const alreadyShown = sessionStorage.getItem("nemesis_banner_popup_shown");
    if (alreadyShown === "true") return;

    let alive = true;

    async function loadBannerDetail() {
      try {
        const res = await getPromoPage(activeBanner.slug);
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

  async function loadHome() {
    try {
      setLoading(true);
      setPage(1);

      const [campaignRes, bannerRes, homeSectionsRes, productsRes] =
        await Promise.all([
          getActiveCampaigns().catch(() => []),
          getActiveBanners().catch(() => []),
          getActiveHomeSections().catch(() => []),
          getProducts({ page: 1, pageSize: 6 }).catch(() => []),
        ]);

      setCampaigns(uniqueById(normalizeList(campaignRes)));
      setBanners(uniqueById(normalizeList(bannerRes)));
      setHomeSections(uniqueById(normalizeList(homeSectionsRes)));
      setProducts(uniqueById(normalizeList(productsRes)));
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (moreLoading) return;

    try {
      setMoreLoading(true);

      const nextPage = page + 1;
      const res = await getProducts({ page: nextPage, pageSize: 6 });
      const newProducts = normalizeList(res);

      setProducts((prev) => uniqueById([...prev, ...newProducts]));
      setPage(nextPage);
    } finally {
      setMoreLoading(false);
    }
  }

  function handleFilteredProducts(list) {
    setProducts(uniqueById(list));
    setPage(1);
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
        `}
      </style>

      <div className="animate-[softHomeIn_0.45s_ease_both]">
        <ProductDiscoveryBar onProductsChange={handleFilteredProducts} />
      </div>

      <div className="animate-[softHomeIn_0.55s_ease_both]">
        <HomePromoSlider promos={campaigns} />
      </div>

      <div className="space-y-2">
        {homeSections
          .slice()
          .sort(
            (a, b) =>
              Number(a.displayOrder || 0) - Number(b.displayOrder || 0)
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

      {products.length > 0 && (
        <section className="mx-auto max-w-[1180px] px-5 py-8 md:px-8 md:py-11">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-zinc-500">
                NemesisBaku
              </p>

              <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-zinc-950 md:text-3xl">
                {text.allProducts}
              </h2>

              <p className="mt-2 max-w-[520px] text-sm leading-6 text-zinc-600">
                {text.allProductsDesc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard
                key={product.id || `product-${index}`}
                product={product}
              />
            ))}
          </div>

          {products.length >= 6 && (
            <div className="mt-8 flex justify-center">
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
        </section>
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
    if (!banner?.slug) return;

    onClose();

    setTimeout(() => {
      navigate(`/${banner.slug}`);
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
                NemesisBaku
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