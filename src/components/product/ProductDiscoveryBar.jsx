import { useEffect, useRef, useState } from "react";
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

function normalizeProducts(res) {
  const data = res?.data || res;

  return (
    data?.items ||
    data?.products ||
    data?.result ||
    data?.data ||
    (Array.isArray(data) ? data : [])
  );
}

function normalizeFilterOptions(res) {
  const data = res?.data || res;

  return {
    categories:
      data?.categories ||
      data?.categoryOptions ||
      data?.filterOptions?.categories ||
      [],
    brands:
      data?.brands ||
      data?.brandOptions ||
      data?.filterOptions?.brands ||
      [],
    sizes:
      data?.sizes ||
      data?.sizeOptions ||
      data?.filterOptions?.sizes ||
      [],
    colors:
      data?.colors ||
      data?.colorOptions ||
      data?.filterOptions?.colors ||
      [],
  };
}

export default function ProductDiscoveryBar({ onProductsChange }) {
  const { text } = useLanguage();

  const filterButtonRef = useRef(null);
  const pointerStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const [brandOpen, setBrandOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterClosing, setFilterClosing] = useState(false);

  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);

  const [filters, setFilters] = useState(emptyFilters);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);

  const [filterPos, setFilterPos] = useState({
    x: window.innerWidth - 76,
    y: 138,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);

      const [optionsRes, productsRes] = await Promise.all([
        getFilterOptions(),
        getProducts(emptyFilters),
      ]);

      const options = normalizeFilterOptions(optionsRes);

      setCategories(options.categories);
      setBrands(options.brands);
      setSizes(options.sizes);
      setColors(options.colors);

      onProductsChange?.(normalizeProducts(productsRes));
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts(nextFilters) {
    try {
      setLoading(true);
      const res = await getProducts(nextFilters);
      onProductsChange?.(normalizeProducts(res));
    } finally {
      setLoading(false);
    }
  }

  function selectBrand(brandId) {
    const next = {
      ...filters,
      brandId,
    };

    setFilters(next);
    setDraftFilters(next);
    loadProducts(next);
  }

  function openFilter() {
    setDraftFilters(filters);
    setFilterClosing(false);
    setFilterOpen(true);
  }

  function closeFilter() {
    setFilterClosing(true);

    setTimeout(() => {
      setFilterOpen(false);
      setFilterClosing(false);
    }, 260);
  }

  function applyFilter() {
    setFilters(draftFilters);
    loadProducts(draftFilters);
    closeFilter();
  }

  function resetFilter() {
    setFilters(emptyFilters);
    setDraftFilters(emptyFilters);
    loadProducts(emptyFilters);
    closeFilter();
  }

  function handlePointerDown(e) {
    const rect = filterButtonRef.current.getBoundingClientRect();

    hasMoved.current = false;

    pointerStart.current = {
      x: e.clientX,
      y: e.clientY,
    };

    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    filterButtonRef.current.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!filterButtonRef.current?.hasPointerCapture(e.pointerId)) return;

    const moveX = Math.abs(e.clientX - pointerStart.current.x);
    const moveY = Math.abs(e.clientY - pointerStart.current.y);

    if (moveX > 4 || moveY > 4) {
      hasMoved.current = true;
    }

    if (!hasMoved.current) return;

    e.preventDefault();

    const size = 54;

    const nextX = Math.min(
      Math.max(e.clientX - dragOffset.current.x, 12),
      window.innerWidth - size - 12
    );

    const nextY = Math.min(
      Math.max(e.clientY - dragOffset.current.y, 82),
      window.innerHeight - size - 14
    );

    setFilterPos({
      x: nextX,
      y: nextY,
    });
  }

  function handlePointerUp(e) {
    if (filterButtonRef.current?.hasPointerCapture(e.pointerId)) {
      filterButtonRef.current.releasePointerCapture(e.pointerId);
    }

    if (!hasMoved.current) {
      openFilter();
    }
  }

  const activeBrandName =
    brands.find((x) => x.id === filters.brandId)?.name || text.allBrands;

  return (
    <>
      <style>
        {`
          @keyframes brandPanelOpen {
            from {
              opacity: 0;
              transform: translateY(-14px);
              max-height: 0;
            }

            to {
              opacity: 1;
              transform: translateY(0);
              max-height: 178px;
            }
          }

          @keyframes filterOpen {
            from {
              opacity: 0;
              transform: translateY(-14px) scale(0.97);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes filterClose {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
            }

            to {
              opacity: 0;
              transform: translateY(-14px) scale(0.97);
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

      <section className="sticky top-[62px] z-30 border-b border-zinc-100 bg-white/95 backdrop-blur-xl transition-all duration-300 md:top-[72px]">
        <div className="mx-auto max-w-[1180px] px-4 py-3 md:px-6">
          <button
            type="button"
            onClick={() => setBrandOpen((prev) => !prev)}
            className="mx-auto flex items-center gap-2 rounded-full bg-white px-4 py-2 text-zinc-950 transition duration-300 hover:bg-zinc-50 active:scale-[0.98]"
          >
            <span className="text-[15px] font-bold tracking-[0.08em]">
              {text.brands}
            </span>

            <span className="text-[18px]">
              {brandOpen ? <FiChevronUp /> : <FiChevronDown />}
            </span>
          </button>

          <p className="mt-1 text-center text-xs font-semibold text-zinc-400">
            {activeBrandName}
          </p>

          {brandOpen && (
            <div className="animate-[brandPanelOpen_0.38s_cubic-bezier(0.22,1,0.36,1)_both] overflow-hidden">
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <BrandButton
                  active={!filters.brandId}
                  name={text.allBrands}
                  onClick={() => selectBrand("")}
                />

                {brands.map((brand) => (
                  <BrandButton
                    key={brand.id}
                    active={filters.brandId === brand.id}
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

      <button
        ref={filterButtonRef}
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          left: `${filterPos.x}px`,
          top: `${filterPos.y}px`,
          touchAction: "none",
          userSelect: "none",
        }}
        className="fixed z-40 grid h-[54px] w-[54px] cursor-grab place-items-center rounded-full border border-zinc-100 bg-white text-[25px] text-zinc-950 shadow-[0_14px_38px_rgba(0,0,0,0.16)] transition duration-200 active:cursor-grabbing active:scale-95"
        aria-label="Filter"
      >
        <FiSliders />
      </button>

      {filterOpen && (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            onClick={closeFilter}
            className={`absolute inset-0 bg-black/20 backdrop-blur-[2px] ${
              filterClosing
                ? "animate-[fadeOut_0.24s_ease_both]"
                : "animate-[fadeIn_0.24s_ease_both]"
            }`}
          />

          <div
            className={`absolute left-1/2 top-[92px] max-h-[calc(100vh-112px)] w-[calc(100%-28px)] max-w-[430px] -translate-x-1/2 overflow-y-auto rounded-[28px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] ${
              filterClosing
                ? "animate-[filterClose_0.26s_ease_both]"
                : "animate-[filterOpen_0.36s_cubic-bezier(0.22,1,0.36,1)_both]"
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
                onClick={closeFilter}
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
                    ? "border-[#244989] bg-[#244989]/8 text-[#244989]"
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
                className="h-13 rounded-[16px] border border-zinc-100 bg-zinc-50 text-sm font-extrabold text-zinc-800 transition hover:bg-zinc-100"
              >
                {text.resetFilter}
              </button>

              <button
                type="button"
                onClick={applyFilter}
                className="h-13 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white transition hover:opacity-95 active:scale-[0.98]"
              >
                {text.applyFilter}
              </button>
            </div>
          </div>
        </div>
      )}
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
        className={`grid h-[58px] w-[58px] place-items-center overflow-hidden rounded-full border transition duration-300 ${
          active
            ? "border-[#244989] bg-[#244989]/8 shadow-[0_10px_25px_rgba(36,73,137,0.14)]"
            : "border-zinc-100 bg-white shadow-[0_8px_22px_rgba(0,0,0,0.05)]"
        }`}
      >
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-extrabold text-zinc-400">
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