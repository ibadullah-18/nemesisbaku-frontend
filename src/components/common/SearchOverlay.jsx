import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation, useSearchParams } from "react-router-dom";
import {
  FiArrowUpRight,
  FiClock,
  FiImage,
  FiSearch,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";
import { apiFetch } from "../../api/apiFetch";
import { useLanguage } from "../../i18n/LanguageContext";
import { showUserToast } from "../../utils/userToast";
import SearchResultsSkeleton from "../search/SearchResultsSkeleton";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DELAY = 280;
const RECENT_SEARCHES_KEY = "nemesisbaku_recent_searches";
const MAX_RECENT_SEARCHES = 6;
const popularSearches = ["Nike", "Adidas", "New Balance", "Jordan", "Puma"];

const searchCopies = {
  az: {
    recent: "Son axtarışlar",
    popular: "Populyar axtarışlar",
    clear: "Təmizlə",
    result: "nəticə",
    loadError: "Axtarış zamanı xəta baş verdi.",
  },
  en: {
    recent: "Recent searches",
    popular: "Popular searches",
    clear: "Clear",
    result: "results",
    loadError: "An error occurred while searching.",
  },
  ru: {
    recent: "Недавние поиски",
    popular: "Популярные запросы",
    clear: "Очистить",
    result: "результатов",
    loadError: "При поиске произошла ошибка.",
  },
};

function normalizeProducts(response) {
  const data = response?.data ?? response;
  const nested = data?.data ?? data;
  const products =
    data?.items ||
    data?.products ||
    data?.result ||
    nested?.items ||
    nested?.products ||
    nested?.result ||
    (Array.isArray(nested) ? nested : []);

  return Array.isArray(products) ? products : [];
}

function getProductId(product) {
  return product?.id || product?.productId || "";
}

function getProductImage(product) {
  return (
    product?.mainImageUrl ||
    product?.imageUrl ||
    product?.images?.find((image) => image?.isMain)?.imageUrl ||
    product?.images?.[0]?.imageUrl ||
    product?.images?.[0]?.url ||
    ""
  );
}

function getProductPrices(product) {
  const originalPrice = Number(product?.price || 0);
  const discountPrice = Number(product?.discountPrice || 0);
  const hasDiscount =
    originalPrice > 0 && discountPrice > 0 && discountPrice < originalPrice;

  return {
    originalPrice,
    sellingPrice: hasDiscount ? discountPrice : originalPrice,
    hasDiscount,
    discountPercent: hasDiscount
      ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
      : 0,
  };
}

function money(value) {
  return `${Number(value || 0).toFixed(2)} ₼`;
}

function readRecentSearches() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(RECENT_SEARCHES_KEY) || "[]",
    );

    return Array.isArray(stored)
      ? stored.filter(Boolean).slice(0, MAX_RECENT_SEARCHES)
      : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(searchValue) {
  const value = String(searchValue || "").trim();

  if (value.length < MIN_QUERY_LENGTH) return readRecentSearches();

  const filtered = readRecentSearches().filter(
    (item) => item.toLocaleLowerCase() !== value.toLocaleLowerCase(),
  );
  const next = [value, ...filtered].slice(0, MAX_RECENT_SEARCHES);

  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  return next;
}

export default function SearchPage() {
  const { text, lang } = useLanguage();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const copy =
    searchCopies[String(lang || "az").toLowerCase()] || searchCopies.az;

  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);
  const debounceRef = useRef(null);
  const restoreDoneRef = useRef(false);

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [recentSearches, setRecentSearches] = useState(readRecentSearches);

  const cleanQuery = query.trim();
  const searchIsReady = cleanQuery.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    controllerRef.current?.abort();

    if (!searchIsReady) {
      requestIdRef.current += 1;
      setSearchParams({}, { replace: true });
      setResults([]);
      setLoading(false);
      setSearchCompleted(false);
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      startSearch(cleanQuery);
    }, SEARCH_DELAY);

    return () => window.clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      controllerRef.current?.abort();
      window.clearTimeout(debounceRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (restoreDoneRef.current || loading || results.length === 0) return;

    const savedY = Number(
      location.state?.restoreSearchScrollY ??
        sessionStorage.getItem("nemesis_search_scroll_y"),
    );

    if (!Number.isFinite(savedY) || savedY < 0) return;

    restoreDoneRef.current = true;

    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    const restore = () => {
      window.scrollTo({ top: savedY, left: 0, behavior: "auto" });
    };

    restore();
    let secondFrame;

    const firstFrame = window.requestAnimationFrame(() => {
      restore();
      secondFrame = window.requestAnimationFrame(() => {
        restore();
        root.style.scrollBehavior = previousBehavior;
        sessionStorage.removeItem("nemesis_search_scroll_y");
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
      root.style.scrollBehavior = previousBehavior;
    };
  }, [loading, results.length, location.state]);

  async function startSearch(value) {
    const normalizedValue = value.trim();
    if (normalizedValue.length < MIN_QUERY_LENGTH) return;

    controllerRef.current?.abort();

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    controllerRef.current = controller;

    setSearchParams({ q: normalizedValue }, { replace: true });

    try {
      setLoading(true);
      setSearchCompleted(false);

      const response = await apiFetch(
        `/api/Products?search=${encodeURIComponent(normalizedValue)}`,
        { signal: controller.signal },
      );

      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      setResults(normalizeProducts(response));
      setSearchCompleted(true);
    } catch (error) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      setResults([]);
      setSearchCompleted(true);
      showUserToast(error?.message || copy.loadError, "error");
    } finally {
      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  function submitSearch(event) {
    event.preventDefault();
    if (!searchIsReady) return;

    window.clearTimeout(debounceRef.current);
    setRecentSearches(saveRecentSearch(cleanQuery));
    startSearch(cleanQuery);
  }

  function chooseKeyword(value) {
    setQuery(value);
    setRecentSearches(saveRecentSearch(value));
  }

  function clearSearch() {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
    window.clearTimeout(debounceRef.current);
    sessionStorage.removeItem("nemesis_search_scroll_y");
    setQuery("");
    setResults([]);
    setLoading(false);
    setSearchCompleted(false);
    setSearchParams({}, { replace: true });
  }

  function clearRecentSearches() {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  }

  function handleProductOpen() {
    setRecentSearches(saveRecentSearch(cleanQuery));
    sessionStorage.setItem("nemesis_search_scroll_y", String(window.scrollY));
  }

  function renderKeywords(title, Icon, values, canClear = false) {
    if (values.length === 0) return null;

    return (
      <div>
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-sm font-bold text-zinc-800">
            <Icon className="text-zinc-400" />
            {title}
          </p>

          {canClear && (
            <button
              type="button"
              onClick={clearRecentSearches}
              className="text-xs font-bold text-zinc-400 transition-colors duration-200 hover:text-zinc-950"
            >
              {copy.clear}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {values.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => chooseKeyword(item)}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-700 transition duration-200 hover:border-zinc-950 hover:bg-zinc-950 hover:text-white active:scale-95"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fafafa] px-4 py-5 text-zinc-950 md:px-6 md:py-8">
      <section className="mx-auto max-w-[900px]">
        <form
          onSubmit={submitSearch}
          className="mb-7 flex items-center gap-3 border-b border-zinc-200/70 pb-5"
        >
          <div className="group flex h-[54px] flex-1 items-center gap-3 rounded-[19px] border border-zinc-200/80 bg-white px-4 shadow-[0_10px_32px_rgba(0,0,0,0.045)] transition duration-200 focus-within:border-zinc-400 focus-within:shadow-[0_16px_40px_rgba(0,0,0,0.07)] md:h-[60px] md:rounded-[22px] md:px-5">
            <FiSearch className="shrink-0 text-[20px] text-zinc-500 transition-colors duration-200 group-focus-within:text-zinc-950 md:text-[22px]" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={text.searchPlaceholder}
              autoComplete="off"
              enterKeyHint="search"
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] font-semibold outline-none placeholder:font-medium placeholder:text-zinc-400 md:text-[18px]"
            />
          </div>

          {query.length > 0 && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Axtarışı təmizlə"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-zinc-950 text-[21px] text-white shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition duration-200 hover:bg-zinc-800 active:scale-95 md:h-13 md:w-13"
            >
              <FiX />
            </button>
          )}
        </form>

        <div className="mb-5 flex min-h-10 items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.28em] text-zinc-400">
              nemesisbaku
            </p>
            <h1 className="text-[25px] font-extrabold tracking-[-0.04em] text-zinc-950 md:text-[34px]">
              {text.searchResults}
            </h1>
          </div>

          {searchIsReady && !loading && searchCompleted && (
            <p className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-500 shadow-[0_8px_24px_rgba(0,0,0,0.05)] ring-1 ring-zinc-100 md:text-sm">
              {results.length} {copy.result}
            </p>
          )}
        </div>

        {!searchIsReady && (
          <div className="space-y-5 rounded-[22px] border border-zinc-200/70 bg-white p-5 shadow-[0_12px_34px_rgba(0,0,0,0.035)] md:p-6">
            {renderKeywords(copy.recent, FiClock, recentSearches, true)}
            {renderKeywords(copy.popular, FiTrendingUp, popularSearches)}
          </div>
        )}

        {searchIsReady && loading && <SearchResultsSkeleton count={6} />}

        {searchIsReady &&
          !loading &&
          searchCompleted &&
          results.length === 0 && (
            <div className="rounded-[22px] border border-zinc-200/70 bg-white p-6 text-sm font-semibold text-zinc-500 shadow-[0_12px_34px_rgba(0,0,0,0.035)]">
              {text.searchNotFound}
            </div>
          )}

        {searchIsReady && !loading && results.length > 0 && (
          <div className="space-y-3 pb-12">
            {results.map((product) => {
              const productId = getProductId(product);
              if (!productId) return null;

              const image = getProductImage(product);
              const name =
                product.name || product.productName || product.model || "Məhsul";
              const meta =
                product.brandName ||
                product.model ||
                product.productCode ||
                product.categoryName ||
                "nemesisbaku";
              const prices = getProductPrices(product);

              return (
                <NavLink
                  key={productId}
                  to={`/products/${productId}`}
                  state={{
                    fromProductList: true,
                    fromSearch: true,
                    returnTo: `${location.pathname}${location.search}`,
                  }}
                  onClick={handleProductOpen}
                  className="search-result-row group flex items-center gap-4 overflow-hidden rounded-[20px] border border-zinc-200/70 bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,0.035)] transition duration-200 hover:border-zinc-300 hover:shadow-[0_18px_45px_rgba(0,0,0,0.075)] active:scale-[0.99] md:gap-5 md:p-4"
                >
                  <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[16px] bg-zinc-100 md:h-[112px] md:w-[112px]">
                    {image ? (
                      <img
                        src={image}
                        alt={name}
                        loading="lazy"
                        decoding="async"
                        draggable="false"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-zinc-300">
                        <FiImage className="text-[28px]" />
                      </div>
                    )}

                    {prices.hasDiscount && (
                      <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-[9px] font-extrabold text-white">
                        -{prices.discountPercent}%
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.15em] text-zinc-400 md:text-[11px]">
                      {meta}
                    </p>
                    <h2 className="mt-1 line-clamp-2 text-[14px] font-extrabold leading-5 text-zinc-950 md:text-[16px] md:leading-6">
                      {name}
                    </h2>

                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                      {prices.sellingPrice > 0 && (
                        <p
                          className={`text-[15px] font-extrabold ${
                            prices.hasDiscount ? "text-red-600" : "text-zinc-950"
                          }`}
                        >
                          {money(prices.sellingPrice)}
                        </p>
                      )}
                      {prices.hasDiscount && (
                        <p className="text-xs font-bold text-zinc-400 line-through">
                          {money(prices.originalPrice)}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-100 text-lg text-zinc-800 transition-colors duration-200 group-hover:bg-zinc-950 group-hover:text-white">
                    <FiArrowUpRight />
                  </span>
                </NavLink>
              );
            })}
          </div>
        )}
      </section>

      <style>{`
        @keyframes searchResultIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .search-result-row {
          animation: searchResultIn 220ms ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .search-result-row {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}

