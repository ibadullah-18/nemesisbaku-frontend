import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiChevronDown,
  FiChevronUp,
  FiSliders,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { getFilterOptions, getProducts } from "../../api/productApi";
import { useLanguage } from "../../i18n/LanguageContext";
import AppLoader from "../common/AppLoader";

const emptyFilters = {
  categoryId: "",
  brandId: "",
  sizeId: "",
  colorId: "",
  minPrice: "",
  maxPrice: "",
  isDiscounted: false,
};

const FILTER_SIZE = window.innerWidth < 768 ? 46 : 54;

function normalizeProducts(res) {
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

function pickOptionList(...candidates) {
  const nonEmptyList = candidates.find(
    (candidate) => Array.isArray(candidate) && candidate.length > 0,
  );

  if (nonEmptyList) return nonEmptyList;

  return candidates.find(Array.isArray) || [];
}

function uniqueOptions(list) {
  const map = new Map();

  (list || []).forEach((item) => {
    const id =
      item?.id ??
      item?.brandId ??
      item?.categoryId ??
      item?.sizeId ??
      item?.colorId ??
      item?.value;
    if (id === undefined || id === null || id === "") return;

    map.set(String(id), {
      ...item,
      id,
      name:
        item?.name ||
        item?.brandName ||
        item?.categoryName ||
        item?.sizeValue ||
        item?.colorName ||
        item?.label ||
        item?.title ||
        item?.text ||
        "",
    });
  });

  return [...map.values()];
}

function normalizeFilterOptions(res) {
  const data = res?.data ?? res;
  const nestedData = data?.data ?? data;
  const filterOptions =
    nestedData?.filterOptions || data?.filterOptions || nestedData;

  return {
    categories: uniqueOptions(
      pickOptionList(
        nestedData?.categories,
        nestedData?.categoryOptions,
        filterOptions?.categories,
        data?.categories,
        data?.categoryOptions,
      ),
    ),
    brands: uniqueOptions(
      pickOptionList(
        nestedData?.brands,
        nestedData?.brandOptions,
        filterOptions?.brands,
        data?.brands,
        data?.brandOptions,
      ),
    ),
    sizes: uniqueOptions(
      pickOptionList(
        nestedData?.sizes,
        nestedData?.sizeOptions,
        filterOptions?.sizes,
        data?.sizes,
        data?.sizeOptions,
      ),
    ),
    colors: uniqueOptions(
      pickOptionList(
        nestedData?.colors,
        nestedData?.colorOptions,
        filterOptions?.colors,
        data?.colors,
        data?.colorOptions,
      ),
    ),
  };
}

export default function ProductDiscoveryBar({
  onProductsChange,
  onBrandChange,
}) {
  const { text } = useLanguage();

  const filterButtonRef = useRef(null);
  const openedAtRef = useRef(0);
  const productsRequestIdRef = useRef(0);

  const dragData = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    moved: false,
  });

  const [navVisible, setNavVisible] = useState(true);

  const [brandMounted, setBrandMounted] = useState(false);
  const [brandClosing, setBrandClosing] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterClosing, setFilterClosing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);

  const [filters, setFilters] = useState(emptyFilters);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);

  const [filterPos, setFilterPos] = useState(() => ({
    x: window.innerWidth - (window.innerWidth < 768 ? 58 : 63),
    y: 90,
  }));

  useEffect(() => {
    setPortalReady(true);
    loadInitialData();
  }, []);

  useEffect(() => {
    function resetDiscoveryFromLogo() {
      productsRequestIdRef.current += 1;
      setFilters({ ...emptyFilters });
      setDraftFilters({ ...emptyFilters });
      setBrandMounted(false);
      setBrandClosing(false);
      setFilterOpen(false);
      setFilterClosing(false);
      setLoading(false);
    }

    window.addEventListener("nemesis_home_reset", resetDiscoveryFromLogo);

    return () => {
      window.removeEventListener("nemesis_home_reset", resetDiscoveryFromLogo);
    };
  }, []);

  useEffect(() => {
    function handleNavVisibility(e) {
      setNavVisible(Boolean(e.detail?.visible));
    }

    window.addEventListener("nemesis_nav_visibility", handleNavVisibility);

    return () => {
      window.removeEventListener("nemesis_nav_visibility", handleNavVisibility);
    };
  }, []);

  useEffect(() => {
    function refreshWhenPageBecomesActive() {
      if (document.visibilityState === "visible") {
        refreshFilterOptions().catch(() => {});
      }
    }

    window.addEventListener("focus", refreshWhenPageBecomesActive);
    document.addEventListener("visibilitychange", refreshWhenPageBecomesActive);

    return () => {
      window.removeEventListener("focus", refreshWhenPageBecomesActive);
      document.removeEventListener(
        "visibilitychange",
        refreshWhenPageBecomesActive,
      );
    };
  }, []);

  useEffect(() => {
    function keepInsideScreen() {
      setFilterPos((prev) => ({
        x: Math.min(Math.max(prev.x, 12), window.innerWidth - FILTER_SIZE - 12),
        y: Math.min(
          Math.max(prev.y, 82),
          window.innerHeight - FILTER_SIZE - 14,
        ),
      }));
    }

    window.addEventListener("resize", keepInsideScreen);
    return () => window.removeEventListener("resize", keepInsideScreen);
  }, []);

  useEffect(() => {
    if (!filterOpen) return;

    const body = document.body;
    const root = document.documentElement;
    const savedScrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - root.clientWidth;

    const previousBodyStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      overscrollBehaviorY: body.style.overscrollBehaviorY,
      paddingRight: body.style.paddingRight,
    };

    const previousRootStyles = {
      overflow: root.style.overflow,
      overscrollBehaviorY: root.style.overscrollBehaviorY,
    };

    const previousFilterOpenFlag = body.dataset.nemesisFilterOpen;

    body.dataset.nemesisFilterOpen = "true";
    body.style.position = "fixed";
    body.style.top = `-${savedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    body.style.overscrollBehaviorY = "none";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    root.style.overflow = "hidden";
    root.style.overscrollBehaviorY = "none";

    function blockBackgroundScroll(event) {
      const target = event.target;
      const isInsideFilter =
        target instanceof Element &&
        Boolean(target.closest('[data-filter-scroll-area="true"]'));

      if (!isInsideFilter) {
        event.preventDefault();
      }
    }

    document.addEventListener("wheel", blockBackgroundScroll, {
      passive: false,
    });
    document.addEventListener("touchmove", blockBackgroundScroll, {
      passive: false,
    });

    return () => {
      document.removeEventListener("wheel", blockBackgroundScroll);
      document.removeEventListener("touchmove", blockBackgroundScroll);

      body.style.position = previousBodyStyles.position;
      body.style.top = previousBodyStyles.top;
      body.style.left = previousBodyStyles.left;
      body.style.right = previousBodyStyles.right;
      body.style.width = previousBodyStyles.width;
      body.style.overflow = previousBodyStyles.overflow;
      body.style.overscrollBehaviorY = previousBodyStyles.overscrollBehaviorY;
      body.style.paddingRight = previousBodyStyles.paddingRight;

      root.style.overflow = previousRootStyles.overflow;
      root.style.overscrollBehaviorY = previousRootStyles.overscrollBehaviorY;

      if (previousFilterOpenFlag === undefined) {
        delete body.dataset.nemesisFilterOpen;
      } else {
        body.dataset.nemesisFilterOpen = previousFilterOpenFlag;
      }

      window.scrollTo({ top: savedScrollY, left: 0, behavior: "auto" });
    };
  }, [filterOpen]);

  function applyFilterOptions(options) {
    setCategories(options.categories);
    setBrands(options.brands);
    setSizes(options.sizes);
    setColors(options.colors);
  }

  async function refreshFilterOptions() {
    const optionsRes = await getFilterOptions();
    const options = normalizeFilterOptions(optionsRes);

    applyFilterOptions(options);
    return options;
  }

  async function loadInitialData() {
    try {
      setLoading(true);
      const optionsRes = await getFilterOptions();
      const options = normalizeFilterOptions(optionsRes);

      applyFilterOptions(options);
    } catch (err) {
      console.error("Filter seçimləri yüklənmədi:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts(nextFilters) {
    const requestId = ++productsRequestIdRef.current;

    try {
      setLoading(true);
      const res = await getProducts({
        ...nextFilters,
        page: 1,
        pageSize: 500,
      });

      if (requestId !== productsRequestIdRef.current) return;

      onProductsChange?.(normalizeProducts(res), {
        active: true,
        filters: nextFilters,
      });
    } catch (err) {
      if (requestId === productsRequestIdRef.current) {
        console.error("Məhsullar filterlə yüklənmədi:", err);
      }
    } finally {
      if (requestId === productsRequestIdRef.current) {
        setLoading(false);
      }
    }
  }

  function openBrands() {
    refreshFilterOptions().catch(() => {});
    setBrandClosing(false);
    setBrandMounted(true);
  }

  function closeBrands() {
    setBrandClosing(true);

    setTimeout(() => {
      setBrandMounted(false);
      setBrandClosing(false);
    }, 340);
  }

  function toggleBrands() {
    if (brandMounted) closeBrands();
    else openBrands();
  }

  function selectBrand(brandId) {
    const next = {
      ...emptyFilters,
      brandId,
    };

    setFilters(next);
    setDraftFilters(next);

    if (onBrandChange) {
      onBrandChange(brandId);
    } else {
      loadProducts(next);
    }

    closeBrands();
  }

  function openFilter() {
    refreshFilterOptions().catch(() => {});
    openedAtRef.current = Date.now();
    setDraftFilters(filters);
    setFilterClosing(false);
    setFilterOpen(true);
  }

  function closeFilter() {
    const justOpened = Date.now() - openedAtRef.current < 450;
    if (justOpened) return;

    setFilterClosing(true);

    setTimeout(() => {
      setFilterOpen(false);
      setFilterClosing(false);
    }, 300);
  }

  function forceCloseFilter() {
    setFilterClosing(true);

    setTimeout(() => {
      setFilterOpen(false);
      setFilterClosing(false);
    }, 300);
  }

  function applyFilter() {
    setFilters(draftFilters);
    loadProducts(draftFilters);
    forceCloseFilter();
  }

  function resetFilter() {
    setFilters(emptyFilters);
    setDraftFilters(emptyFilters);
    loadProducts(emptyFilters);
    forceCloseFilter();
  }

  function handleFilterPointerDown(e) {
    if (filterOpen) return;

    e.preventDefault();
    e.stopPropagation();

    const button = filterButtonRef.current;
    if (!button) return;

    dragData.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: filterPos.x,
      startTop: filterPos.y,
      moved: false,
    };

    setIsDragging(true);

    try {
      button.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  function handleFilterPointerMove(e) {
    const data = dragData.current;
    if (data.pointerId !== e.pointerId) return;

    e.preventDefault();
    e.stopPropagation();

    const diffX = e.clientX - data.startX;
    const diffY = e.clientY - data.startY;
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);

    if (distance < 8 && !data.moved) return;

    data.moved = true;

    const nextX = Math.min(
      Math.max(data.startLeft + diffX, 12),
      window.innerWidth - FILTER_SIZE - 12,
    );

    const nextY = Math.min(
      Math.max(data.startTop + diffY, 82),
      window.innerHeight - FILTER_SIZE - 14,
    );

    setFilterPos({ x: nextX, y: nextY });
  }

  function handleFilterPointerUp(e) {
    const data = dragData.current;
    if (data.pointerId !== e.pointerId) return;

    e.preventDefault();
    e.stopPropagation();

    try {
      filterButtonRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    setIsDragging(false);

    const shouldOpen = !data.moved;

    dragData.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      startLeft: 0,
      startTop: 0,
      moved: false,
    };

    if (shouldOpen) {
      setTimeout(() => {
        openFilter();
      }, 80);
    }
  }

  function handleFilterPointerCancel(e) {
    const data = dragData.current;
    if (data.pointerId !== e.pointerId) return;

    e.preventDefault();
    e.stopPropagation();

    try {
      filterButtonRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    setIsDragging(false);

    dragData.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      startLeft: 0,
      startTop: 0,
      moved: false,
    };
  }

  const activeBrandName =
    brands.find((x) => String(x.id) === String(filters.brandId))?.name || "";

  const filterPortal =
    portalReady &&
    createPortal(
      <>
        <button
          ref={filterButtonRef}
          type="button"
          onPointerDown={handleFilterPointerDown}
          onPointerMove={handleFilterPointerMove}
          onPointerUp={handleFilterPointerUp}
          onPointerCancel={handleFilterPointerCancel}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragStart={(e) => e.preventDefault()}
          style={{
            position: "fixed",
            left: `${filterPos.x}px`,
            top: `${filterPos.y}px`,
            touchAction: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
          className={`z-[70] grid h-[46px] w-[46px] place-items-center rounded-full border border-zinc-100 bg-white text-[21px] text-zinc-950 shadow-[0_12px_30px_rgba(0,0,0,0.14)] transition-all duration-300 md:h-[54px] md:w-[54px] md:text-[25px] md:shadow-[0_14px_38px_rgba(0,0,0,0.16)] ${
            filterOpen
              ? "scale-[1.14] bg-black text-white shadow-[0_18px_48px_rgba(36,73,137,0.28)]"
              : ""
          } ${isDragging ? "cursor-grabbing scale-105" : "cursor-grab"}`}
          aria-label="Filter"
        >
          <FiSliders className="pointer-events-none" />
        </button>

        {filterOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-5">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeFilter();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className={`absolute inset-0 bg-black/20 backdrop-blur-[2px] ${
                filterClosing
                  ? "animate-[fadeOut_0.28s_ease_both]"
                  : "animate-[fadeIn_0.28s_ease_both]"
              }`}
            />

            <div
              data-filter-scroll-area="true"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                WebkitOverflowScrolling: "touch",
                overscrollBehaviorY: "contain",
              }}
              className={`relative z-[91] max-h-[calc(100vh-40px)] w-full max-w-[430px] overflow-y-auto rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] ${
                filterClosing
                  ? "animate-[filterClose_0.30s_ease_both]"
                  : "animate-[filterOpen_0.42s_cubic-bezier(0.22,1,0.36,1)_both]"
              }`}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[26px] font-extrabold tracking-[-0.035em] text-zinc-950">
                    {text.filters}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    {text.filterDescription}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={forceCloseFilter}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-50 text-[20px] text-zinc-800"
                >
                  <FiX />
                </button>
              </div>

              <div className="space-y-4">
                <FilterSelect
                  label={text.category}
                  value={draftFilters.categoryId}
                  items={categories}
                  onChange={(value) =>
                    setDraftFilters((prev) => ({ ...prev, categoryId: value }))
                  }
                />

                <FilterSelect
                  label={text.size}
                  value={draftFilters.sizeId}
                  items={sizes}
                  onChange={(value) =>
                    setDraftFilters((prev) => ({ ...prev, sizeId: value }))
                  }
                />

                <FilterSelect
                  label={text.color}
                  value={draftFilters.colorId}
                  items={colors}
                  onChange={(value) =>
                    setDraftFilters((prev) => ({ ...prev, colorId: value }))
                  }
                />

                <div>
                  <p className="mb-2 text-sm font-bold text-zinc-800">
                    {text.price}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={draftFilters.minPrice}
                      onChange={(e) =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          minPrice: e.target.value.replace(/[^\d.]/g, ""),
                        }))
                      }
                      placeholder={text.minPrice}
                      inputMode="decimal"
                      className="h-12 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold outline-none transition focus:border-zinc-300"
                    />

                    <input
                      value={draftFilters.maxPrice}
                      onChange={(e) =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          maxPrice: e.target.value.replace(/[^\d.]/g, ""),
                        }))
                      }
                      placeholder={text.maxPrice}
                      inputMode="decimal"
                      className="h-12 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold outline-none transition focus:border-zinc-300"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      isDiscounted: !prev.isDiscounted,
                    }))
                  }
                  className={`flex h-12 w-full items-center justify-between rounded-[16px] border px-4 text-sm font-bold transition ${
                    draftFilters.isDiscounted
                      ? "border-black bg-black/8 text-black"
                      : "border-zinc-100 bg-zinc-50 text-zinc-700"
                  }`}
                >
                  {text.discounted}
                  {draftFilters.isDiscounted && <FiCheck />}
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={resetFilter}
                  className="h-[52px] rounded-[16px] border border-zinc-100 bg-zinc-50 text-sm font-extrabold text-zinc-800 transition hover:bg-zinc-100"
                >
                  {text.resetFilter}
                </button>

                <button
                  type="button"
                  onClick={applyFilter}
                  className="h-[52px] rounded-[16px] bg-black text-sm font-extrabold text-white transition hover:opacity-95 active:scale-[0.98]"
                >
                  {text.applyFilter}
                </button>
              </div>
            </div>
          </div>
        )}
      </>,
      document.body,
    );

  return (
    <>
      <style>
        {`
          @keyframes brandBubbleOpen {
            0% {
              opacity: 0;
              transform: translateY(-18px) scale(0.94);
              filter: blur(4px);
            }

            60% {
              opacity: 1;
              transform: translateY(4px) scale(1.015);
              filter: blur(0);
            }

            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
          }

          @keyframes brandBubbleClose {
            0% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }

            100% {
              opacity: 0;
              transform: translateY(-18px) scale(0.94);
              filter: blur(4px);
            }
          }

          @keyframes filterOpen {
            0% {
              opacity: 0;
              transform: translateY(-18px) scale(0.94);
              filter: blur(5px);
            }

            65% {
              opacity: 1;
              transform: translateY(5px) scale(1.015);
              filter: blur(0);
            }

            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
          }

          @keyframes filterClose {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }

            to {
              opacity: 0;
              transform: translateY(-18px) scale(0.94);
              filter: blur(5px);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          @keyframes fadeOut {
            from {
              opacity: 1;
            }

            to {
              opacity: 0;
            }
          }
        `}
      </style>

      {loading && <AppLoader text={text.loading} />}

      <section
        style={{
          top: navVisible ? (window.innerWidth >= 768 ? 72 : 62) : 0,
        }}
        className="sticky z-30 border-b border-zinc-100 bg-white/95 backdrop-blur-xl transition-all duration-500"
      >
        <div className="relative mx-auto max-w-[1180px] px-4 py-3 md:px-6">
          <button
            type="button"
            onClick={toggleBrands}
            className={`mx-auto flex items-center gap-2 rounded-full bg-white px-4 py-2 text-zinc-950 transition duration-300 hover:bg-zinc-50 active:scale-[0.98] ${
              brandMounted ? "shadow-[0_10px_30px_rgba(0,0,0,0.06)]" : ""
            }`}
          >
            <span className="text-[15px] font-bold tracking-[0.08em]">
              {text.brands}
            </span>

            <span
              className={`text-[18px] transition-transform duration-300 ${
                brandMounted ? "rotate-180" : "rotate-0"
              }`}
            >
              {brandMounted ? <FiChevronUp /> : <FiChevronDown />}
            </span>
          </button>

          {activeBrandName && (
            <p className="mt-1 text-center text-xs font-semibold text-zinc-400">
              {activeBrandName}
            </p>
          )}

          {brandMounted && (
            <div
              className={`absolute left-4 right-4 top-[72px] z-40 rounded-[28px] border border-zinc-100 bg-white/96 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.10)] backdrop-blur-xl md:left-6 md:right-6 ${
                brandClosing
                  ? "animate-[brandBubbleClose_0.34s_ease_both]"
                  : "animate-[brandBubbleOpen_0.46s_cubic-bezier(0.22,1,0.36,1)_both]"
              }`}
            >
              <div className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {brands.map((brand) => (
                  <BrandButton
                    key={brand.id}
                    active={String(filters.brandId) === String(brand.id)}
                    name={brand.name}
                    image={
                      brand.logoUrl ||
                      brand.imageUrl ||
                      brand.iconUrl ||
                      brand.photoUrl
                    }
                    onClick={() => selectBrand(brand.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {filterPortal}
    </>
  );
}

function BrandButton({ active, name, image, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex shrink-0 flex-col items-center gap-2"
    >
      <span
        className={`grid h-[62px] w-[62px] place-items-center overflow-hidden rounded-full border p-[9px] transition duration-300 group-hover:-translate-y-0.5 group-active:scale-95 ${
          active
            ? "border-[#244989] bg-[#244989]/8 shadow-[0_10px_25px_rgba(36,73,137,0.14)]"
            : "border-zinc-100 bg-white shadow-[0_8px_22px_rgba(0,0,0,0.05)]"
        }`}
      >
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            draggable="false"
            className="block h-full w-full select-none object-contain object-center transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-lg font-extrabold text-zinc-400">
            {name?.charAt(0)}
          </span>
        )}
      </span>

      <span
        className={`max-w-[72px] truncate text-center text-xs font-bold transition ${
          active ? "text-[#244989]" : "text-zinc-600"
        }`}
      >
        {name}
      </span>
    </button>
  );
}

function FilterSelect({ label, value, items, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-800">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold text-zinc-800 outline-none transition focus:border-zinc-300"
      >
        <option value="">—</option>

        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}