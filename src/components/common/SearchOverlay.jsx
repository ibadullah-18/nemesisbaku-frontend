import { useEffect, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import { apiFetch } from "../../api/apiFetch";
import { useLanguage } from "../../i18n/LanguageContext";
import AppLoader from "../../components/common/AppLoader";

export default function SearchPage() {
  const { text } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const cleanQuery = query.trim();

      if (cleanQuery.length >= 2) {
        setSearchParams({ q: cleanQuery });
        searchProducts(cleanQuery);
      } else {
        setSearchParams({});
        setResults([]);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  async function searchProducts(searchValue) {
    try {
      setLoading(true);

      const res = await apiFetch(
        `/api/Products?search=${encodeURIComponent(searchValue)}`
      );

      const data = res?.data || res;

      const list =
        data?.items ||
        data?.products ||
        data?.result ||
        data?.data ||
        (Array.isArray(data) ? data : []);

      setResults(Array.isArray(list) ? list : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setResults([]);
    setSearchParams({});
  }

  return (
    <main className="min-h-screen bg-white px-4 py-5 md:px-6 md:py-8">
      {loading && <AppLoader text={text.loading} />}

      <section className="mx-auto max-w-[1180px]">
        <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-5">
          <div className="flex h-13 flex-1 items-center gap-3 rounded-[18px] border border-zinc-100 bg-zinc-50 px-4 md:h-14">
            <FiSearch className="shrink-0 text-[20px] text-zinc-500" />

            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={text.searchPlaceholder}
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] font-medium outline-none placeholder:text-zinc-400 md:text-[18px]"
            />
          </div>

          {query.length > 0 && (
            <button
              type="button"
              onClick={clearSearch}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-zinc-50 text-[22px] text-zinc-800 transition hover:bg-zinc-100 active:scale-95"
            >
              <FiX />
            </button>
          )}
        </div>

        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-[25px] font-extrabold tracking-[-0.035em] text-zinc-950 md:text-[32px]">
            {text.searchResults}
          </h1>

          {query.trim().length >= 2 && (
            <p className="text-sm font-semibold text-zinc-400">
              {results.length} nəticə
            </p>
          )}
        </div>

        {query.trim().length < 2 && (
          <div className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-6 text-sm font-medium text-zinc-500">
            {text.searchEmpty}
          </div>
        )}

        {query.trim().length >= 2 && !loading && results.length === 0 && (
          <div className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-6 text-sm font-medium text-zinc-500">
            {text.searchNotFound}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pb-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {results.map((item) => {
            const image =
              item.mainImageUrl ||
              item.imageUrl ||
              item.images?.[0]?.imageUrl ||
              item.images?.[0]?.url;

            const name = item.name || item.productName || "Məhsul";
            const price = item.discountPrice || item.price;

            return (
              <NavLink
                key={item.id}
                to={`/products/${item.id}`}
                className="group overflow-hidden rounded-[22px] border border-zinc-100 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.08)]"
              >
                <div className="aspect-square overflow-hidden bg-zinc-50">
                  {image ? (
                    <img
                      src={image}
                      alt={name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm font-bold text-zinc-300">
                      nemesisbaku
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-bold leading-5 text-zinc-950">
                    {name}
                  </h3>

                  {price ? (
                    <p className="mt-2 text-sm font-extrabold text-[#244989]">
                      {price} ₼
                    </p>
                  ) : null}
                </div>
              </NavLink>
            );
          })}
        </div>
      </section>
    </main>
  );
}