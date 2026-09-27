
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import { useLanguage } from "../../i18n/LanguageContext";
import { searchCatalog } from "../../utils/smartSearch";
import { showUserToast } from "../../utils/userToast";
import ProductDiscoveryBar from "../product/ProductDiscoveryBar";
import ProductCard from "../product/ProductCard";
import ProductCardSkeleton from "../product/ProductCardSkeleton";
import HomeQuickDiscovery from "../home/HomeQuickDiscovery";
import "./smartSearch.css";

export default function HomeSearchResults({ query }) {
  const { text, lang } = useLanguage();

  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [partial, setPartial] = useState(false);
  const [error, setError] = useState(false);
  const [count, setCount] = useState(12);
  const version = useRef(0);

  const notice = {
    az: "Kataloqun yalnız yüklənmiş hissəsində axtarış aparıldı. Bütün nəticələr göstərilməyə bilər.",
    ru: "Поиск выполнен по загруженной части каталога. Показаны не все возможные результаты.",
    en: "Only the loaded portion of the catalog was searched. Some results may be missing."
  }[lang];

  useEffect(() => {
    const ticket = ++version.current;
    let active = true;

    searchCatalog(query)
      .then(data => {
        if (active && ticket === version.current) {
          setItems(data.items);
          setPartial(data.partial);
          setLoading(false);
        }
      })
      .catch(err => {
        if (active && ticket === version.current) {
          setLoading(false);
          setError(true);
          showUserToast(err.message, "error");
        }
      });

    return () => {
      active = false;
      version.current++;
    };
  }, [query]);

  const loader = useCallback(async params => {
    version.current++;

    const data = await searchCatalog(query, params);

    return {
      items: data.items,
      searchPartial: data.partial
    };
  }, [query]);

  function changed(list, meta = {}) {
    version.current++;
    setError(false);
    setLoading(false);
    setFilters(meta.filters || {});
    setCount(12);

    if (meta.reset) {
      const ticket = version.current;
      setLoading(true);

      searchCatalog(query)
        .then(data => {
          if (ticket === version.current) {
            setItems(data.items);
            setPartial(data.partial);
          }
        })
        .catch(err => {
          if (ticket === version.current) {
            setError(true);
            showUserToast(err.message, "error");
          }
        })
        .finally(() => {
          if (ticket === version.current) setLoading(false);
        });
    } else {
      setItems(list);
      setPartial(Boolean(meta.searchPartial));
    }
  }

  return (
    <main className="nb-search-results">
      <ProductDiscoveryBar
        productLoader={loader}
        onProductsChange={changed}
        onLoadingChange={setLoading}
      />

      <header className="nb-search-results__heading">
        <div>
          <p>{text.searchResults}</p>
          <h1>“{query}”</h1>
        </div>

        <div>
          <Link
            to={"/search?q=" + encodeURIComponent(query)}
            state={{ searchReturnTo: "/?q=" + encodeURIComponent(query) }}
            aria-label={text.searchPlaceholder}
          >
            <FiSearch />
          </Link>

          <Link to="/" aria-label={text.close || "Bağla"}>
            <FiX />
          </Link>
        </div>
      </header>

      <HomeQuickDiscovery lang={lang} activeFilters={filters} />

      <section className="nb-search-results__body" aria-busy={loading}>
        {partial && !loading && (
          <p role="status" className="nb-search-notice">{notice}</p>
        )}

        <p className="nb-search-result-count" role="status">
          {loading
            ? text.loading
            : error
              ? ""
              : items.length + " " + (
                  lang === "ru"
                    ? "товаров"
                    : lang === "en"
                      ? "products"
                      : "məhsul"
                )}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {loading
            ? Array.from({ length: 8 }, (_, index) => (
                <ProductCardSkeleton key={index} />
              ))
            : items.slice(0, count).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>

        {!loading && !error && items.length === 0 && (
          <p className="nb-search-empty">{text.searchNotFound}</p>
        )}

        {!loading && count < items.length && (
          <button
            type="button"
            className="nemesis-home-load-more nb-search-more"
            onClick={() => setCount(value => value + 12)}
          >
            {text.loadMore || text.more}
          </button>
        )}

        {error && (
          <button
            type="button"
            className="nb-search-more"
            onClick={() => window.location.reload()}
          >
            {lang === "az"
              ? "Yenidən yoxla"
              : lang === "ru"
                ? "Повторить"
                : "Retry"}
          </button>
        )}
      </section>
    </main>
  );
}
