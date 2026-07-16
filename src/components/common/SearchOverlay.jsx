import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useSearchParams } from "react-router-dom";
import { FiArrowUpRight, FiImage, FiSearch, FiX } from "react-icons/fi";
import { apiFetch } from "../../api/apiFetch";
import { useLanguage } from "../../i18n/LanguageContext";
import AppLoader from "../../components/common/AppLoader";

const MIN_QUERY_LENGTH = 2;

function normalizeProducts(res) {
  const data = res?.data ?? res;
  const nestedData = data?.data ?? data;

  const list =
    data?.items ||
    data?.products ||
    data?.result ||
    nestedData?.items ||
    nestedData?.products ||
    nestedData?.result ||
    (Array.isArray(nestedData) ? nestedData : []);

  return Array.isArray(list) ? list : [];
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

export default function SearchPage() {
  const { text } = useLanguage();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get("q") || "";

  const requestIdRef = useRef(0);
  const resultsTimerRef = useRef(null);
  const resultsRef = useRef([]);
  const restoreScrollDoneRef = useRef(false);

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [resultsLeaving, setResultsLeaving] = useState(false);
  const [resultsVersion, setResultsVersion] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cleanQuery = query.trim();
    const requestId = ++requestIdRef.current;

    if (resultsTimerRef.current) {
      window.clearTimeout(resultsTimerRef.current);
      resultsTimerRef.current = null;
      setResultsLeaving(false);
    }

    if (cleanQuery.length < MIN_QUERY_LENGTH) {
      setSearchParams({}, { replace: true });
      setLoading(false);
      transitionResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      setSearchParams({ q: cleanQuery }, { replace: true });
      searchProducts(cleanQuery, requestId);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      window.clearTimeout(resultsTimerRef.current);
    };
  }, []);

  function commitResults(nextResults) {
    resultsTimerRef.current = null;
    resultsRef.current = nextResults;
    setResults(nextResults);
    setResultsLeaving(false);
    setResultsVersion((prev) => prev + 1);
  }

  function transitionResults(nextResults) {
    window.clearTimeout(resultsTimerRef.current);

    if (resultsRef.current.length === 0) {
      commitResults(nextResults);
      return;
    }

    setResultsLeaving(true);

    resultsTimerRef.current = window.setTimeout(() => {
      commitResults(nextResults);
    }, 190);
  }

  async function searchProducts(searchValue, requestId) {
    try {
      setLoading(true);

      const res = await apiFetch(
        `/api/Products?search=${encodeURIComponent(searchValue)}`,
      );

      if (requestId !== requestIdRef.current) return;

      transitionResults(normalizeProducts(res));
    } catch {
      if (requestId !== requestIdRef.current) return;
      transitionResults([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  function clearSearch() {
    requestIdRef.current += 1;
    sessionStorage.removeItem("nemesis_search_scroll_y");
    setLoading(false);
    setQuery("");
    setSearchParams({}, { replace: true });
  }

  const cleanQuery = query.trim();
  const searchIsReady = cleanQuery.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (
      restoreScrollDoneRef.current ||
      loading ||
      resultsLeaving ||
      results.length === 0
    ) {
      return;
    }

    const savedScrollY = Number(
      location.state?.restoreSearchScrollY ??
        sessionStorage.getItem("nemesis_search_scroll_y"),
    );

    if (!Number.isFinite(savedScrollY) || savedScrollY < 0) return;

    restoreScrollDoneRef.current = true;

    const timer = window.setTimeout(() => {
      window.scrollTo({ top: savedScrollY, left: 0, behavior: "auto" });
      sessionStorage.removeItem("nemesis_search_scroll_y");
    }, 80);

    return () => window.clearTimeout(timer);
  }, [loading, resultsLeaving, results.length, location.state]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fafafa] px-4 py-5 text-zinc-950 md:px-6 md:py-8">
      <style>
        {`
          @keyframes searchPageIn {
            from {
              opacity: 0;
              transform: translateY(16px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes searchBarIn {
            0% {
              opacity: 0;
              transform: translateY(-14px) scale(0.985);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes resultCardIn {
            0% {
              opacity: 0;
              transform: translateY(24px) scale(0.965);
              filter: blur(4px);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
          }

          @keyframes resultsOut {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            to {
              opacity: 0;
              transform: translateY(12px) scale(0.985);
            }
          }

          @keyframes emptyStateIn {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes clearButtonIn {
            from {
              opacity: 0;
              transform: rotate(-35deg) scale(0.75);
            }
            to {
              opacity: 1;
              transform: rotate(0) scale(1);
            }
          }

          @keyframes countIn {
            from {
              opacity: 0;
              transform: translateX(8px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .search-motion {
              animation: none !important;
              transition: none !important;
            }
          }
        `}
      </style>

      {loading && <AppLoader text={text.loading} />}

      <section className="search-motion mx-auto max-w-[1180px] animate-[searchPageIn_0.5s_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="search-motion mb-7 flex items-center gap-3 border-b border-zinc-200/70 pb-5 animate-[searchBarIn_0.55s_cubic-bezier(0.22,1,0.36,1)_both]">
          <div className="group flex h-[54px] flex-1 items-center gap-3 rounded-[19px] border border-zinc-200/80 bg-white px-4 shadow-[0_10px_32px_rgba(0,0,0,0.045)] transition duration-300 focus-within:-translate-y-0.5 focus-within:border-zinc-400 focus-within:shadow-[0_16px_40px_rgba(0,0,0,0.08)] md:h-[60px] md:rounded-[22px] md:px-5">
            <FiSearch className="shrink-0 text-[20px] text-zinc-500 transition duration-300 group-focus-within:scale-110 group-focus-within:text-zinc-950 md:text-[22px]" />

            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={text.searchPlaceholder}
              autoComplete="off"
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] font-semibold outline-none placeholder:font-medium placeholder:text-zinc-400 md:text-[18px]"
            />
          </div>

          {query.length > 0 && (
            <button
              type="button"
              onClick={clearSearch}
              className="search-motion grid h-12 w-12 shrink-0 animate-[clearButtonIn_0.32s_cubic-bezier(0.22,1,0.36,1)_both] place-items-center rounded-full bg-zinc-950 text-[21px] text-white shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition duration-300 hover:-translate-y-0.5 hover:bg-zinc-800 active:scale-90 md:h-13 md:w-13"
              aria-label="Axtarışı təmizlə"
            >
              <FiX />
            </button>
          )}
        </div>

        <div className="mb-5 flex min-h-10 items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.28em] text-zinc-400">
              nemesisbaku
            </p>

            <h1 className="text-[25px] font-extrabold tracking-[-0.04em] text-zinc-950 md:text-[34px]">
              {text.searchResults}
            </h1>
          </div>

          {searchIsReady && (
            <p
              key={`${cleanQuery}-${results.length}`}
              className="search-motion animate-[countIn_0.35s_ease_both] rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-500 shadow-[0_8px_24px_rgba(0,0,0,0.05)] ring-1 ring-zinc-100 md:text-sm"
            >
              {results.length} nəticə
            </p>
          )}
        </div>

        {!searchIsReady && (
          <div className="search-motion animate-[emptyStateIn_0.4s_ease_both] rounded-[24px] border border-zinc-200/70 bg-white p-6 text-sm font-semibold text-zinc-500 shadow-[0_12px_34px_rgba(0,0,0,0.035)]">
            {text.searchEmpty}
          </div>
        )}

        {searchIsReady &&
          !loading &&
          !resultsLeaving &&
          results.length === 0 && (
            <div className="search-motion animate-[emptyStateIn_0.4s_ease_both] rounded-[24px] border border-zinc-200/70 bg-white p-6 text-sm font-semibold text-zinc-500 shadow-[0_12px_34px_rgba(0,0,0,0.035)]">
              {text.searchNotFound}
            </div>
          )}

        {results.length > 0 && (
          <div
            key={resultsVersion}
            className={`grid grid-cols-2 gap-3 pb-12 sm:grid-cols-3 md:grid-cols-4 md:gap-4 xl:grid-cols-5 ${
              resultsLeaving
                ? "search-motion animate-[resultsOut_0.19s_ease_both]"
                : ""
            }`}
          >
            {results.map((item, index) => {
              const image = getProductImage(item);
              const name = item.name || item.productName || "Məhsul";
              const meta =
                item.brandName ||
                item.categoryName ||
                item.model ||
                "nemesisbaku";
              const {
                originalPrice,
                sellingPrice,
                hasDiscount,
                discountPercent,
              } = getProductPrices(item);

              return (
                <NavLink
                  key={item.id || `${name}-${index}`}
                  to={`/products/${item.id}`}
                  state={{
                    fromSearch: true,
                    returnTo: `${location.pathname}${location.search}`,
                  }}
                  onClick={() => {
                    sessionStorage.setItem(
                      "nemesis_search_scroll_y",
                      String(window.scrollY),
                    );
                  }}
                  className="search-motion group relative overflow-hidden rounded-[24px] border border-zinc-200/70 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition duration-300 hover:-translate-y-1.5 hover:border-zinc-300 hover:shadow-[0_22px_55px_rgba(0,0,0,0.11)] active:scale-[0.985] md:rounded-[27px]"
                  style={{
                    animation: `resultCardIn 0.56s cubic-bezier(0.22,1,0.36,1) ${
                      Math.min(index, 14) * 0.045
                    }s both`,
                  }}
                >
                  <div className="relative aspect-[1/1.08] overflow-hidden bg-[#f4f4f3]">
                    {image ? (
                      <img
                        src={image}
                        alt={name}
                        className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
                        loading="lazy"
                        draggable="false"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-zinc-300">
                        <FiImage className="text-[34px]" />
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/12 to-transparent" />

                    {hasDiscount && (
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-red-600 px-2.5 py-1.5 text-[10px] font-extrabold tracking-[0.04em] text-white shadow-[0_8px_24px_rgba(220,38,38,0.28)] md:left-3 md:top-3 md:text-[11px]">
                        -{discountPercent}%
                      </span>
                    )}

                    <span className="absolute bottom-2.5 right-2.5 grid h-9 w-9 place-items-center rounded-full bg-white/92 text-[17px] text-zinc-950 shadow-[0_8px_25px_rgba(0,0,0,0.13)] backdrop-blur-md transition duration-300 group-hover:rotate-12 group-hover:scale-110 md:bottom-3 md:right-3 md:h-10 md:w-10">
                      <FiArrowUpRight />
                    </span>
                  </div>

                  <div className="p-3.5 md:p-4">
                    <p className="mb-1.5 truncate text-[10px] font-extrabold uppercase tracking-[0.16em] text-zinc-400">
                      {meta}
                    </p>

                    <h3 className="line-clamp-2 min-h-10 text-[13px] font-extrabold leading-5 text-zinc-950 md:text-sm">
                      {name}
                    </h3>

                    <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
                      {sellingPrice > 0 && (
                        <p
                          className={`text-[15px] font-extrabold tracking-[-0.02em] md:text-base ${
                            hasDiscount ? "text-red-600" : "text-zinc-950"
                          }`}
                        >
                          {money(sellingPrice)}
                        </p>
                      )}

                      {hasDiscount && (
                        <p className="pb-0.5 text-[11px] font-bold text-zinc-400 line-through md:text-xs">
                          {money(originalPrice)}
                        </p>
                      )}
                    </div>
                  </div>
                </NavLink>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}