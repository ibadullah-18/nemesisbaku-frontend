
import { useEffect, useRef, useState } from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import { FiArrowRight, FiSearch, FiX } from "react-icons/fi";
import { useLanguage } from "../../i18n/LanguageContext";
import { fold, searchCatalog } from "../../utils/smartSearch";
import { showUserToast } from "../../utils/userToast";
import "../search/smartSearch.css";

export default function SearchPage() {
  const { text, lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const [query, setQuery] = useState(
    (params.get("q") || "").slice(0, 80)
  );

  const [brands, setBrands] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(
    Boolean(fold(params.get("q") || ""))
  );
  const [partial, setPartial] = useState(false);
  const [failed, setFailed] = useState(false);
  const [closing, setClosing] = useState(false);

  const exitTimer = useRef(null);
  const leaving = useRef(false);
  const input = useRef(null);

  const copies = {
    az: [
      "Axtar",
      "Bütün nəticələr",
      "Məhsulu olan brendlər",
      "Brend, model və ya məhsul kodu",
      "Bağla",
      "Yüklənmiş kataloq üzrə nəticələrdir; siyahı tam olmaya bilər.",
      "Axtarış alınmadı. Yenidən yoxlayın."
    ],
    ru: [
      "Поиск",
      "Все результаты",
      "Бренды с товарами",
      "Бренд, модель или артикул",
      "Закрыть",
      "Результаты по загруженной части каталога могут быть неполными.",
      "Не удалось выполнить поиск. Повторите попытку."
    ],
    en: [
      "Search",
      "All results",
      "Brands with products",
      "Brand, model or product code",
      "Close",
      "Results cover the loaded catalog and may be incomplete.",
      "Search failed. Please try again."
    ]
  };

  const t = copies[lang] || copies.az;

  useEffect(() => {
    let alive = true;

    searchCatalog("")
      .then(data => {
        if (!alive) return;

        const counts = new Map();

        for (const product of data.items) {
          const name = String(
            product.brandName || product.brand?.name || ""
          ).trim();

          if (name) counts.set(name, (counts.get(name) || 0) + 1);
        }

        setBrands(
          [...counts]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name]) => name)
        );
      })
      .catch(() => {
        // Do not suggest brands when their products cannot be verified.
      });

    return () => {
      alive = false;
      clearTimeout(exitTimer.current);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const value = query.trim();

    if (!fold(value)) return;

    const timer = setTimeout(() => {
      searchCatalog(value)
        .then(data => {
          if (alive) {
            setResults(data.items);
            setPartial(data.partial);
          }
        })
        .catch(err => {
          if (alive) {
            setFailed(true);
            showUserToast(err.message, "error");
          }
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, 280);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  function changeQuery(value) {
    setQuery(value);
    setLoading(Boolean(fold(value)));
    setFailed(false);
    setPartial(false);
    setResults([]);
  }

  const restoredSearch = useRef(false);

 useEffect(() => {
  const y = location.state?.restoreSearchY;

  if (
   restoredSearch.current ||
   loading ||
   failed ||
   !Number.isFinite(y)
  ) return;

  const frame = requestAnimationFrame(() => {
   window.scrollTo({
    top: y,
    left: 0,
    behavior: "instant"
   });
   restoredSearch.current = true;
  });

  return () => cancelAnimationFrame(frame);
 }, [loading, failed, results.length, location.state]);

 function leave(destination, state) {
  if (leaving.current) return;

  leaving.current = true;
  setClosing(true);

  const fromSearch = state?.fromSearch === true;
  const returnState = {
   ...location.state,
   restoreSearchY: window.scrollY
  };

  if (fromSearch) {
   navigate("/search?q=" + encodeURIComponent(query), {
    replace: true,
    state: returnState
   });
  }

  exitTimer.current = setTimeout(() => {
   navigate(destination, {
    replace: !fromSearch,
    state: fromSearch
     ? {
        ...state,
        searchHistoryEntry: true,
        searchReturnState: returnState
       }
     : state
   });
  }, 0);
 }

  function close() {
    const back = location.state?.searchReturnTo;

    leave(
      typeof back === "string" &&
      back.startsWith("/") &&
      !back.startsWith("//") &&
      !back.startsWith("/search")
        ? back
        : "/"
    );
  }

  function submit() {
    if (fold(query)) {
      leave("/?q=" + encodeURIComponent(query.trim()));
    }
  }

  return (
    <main
      className="nb-top-search"
      data-closing={closing}
      onKeyDown={event => {
        if (event.key === "Escape") close();
      }}
    >
      <section className="nb-top-search__panel">
        <header>
          <h1>{t[0]}</h1>

          <button
            type="button"
            className="nb-top-search__icon"
            onClick={close}
            aria-label={t[4]}
          >
            <FiX />
          </button>
        </header>

        <form
          role="search"
          onSubmit={event => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="nb-search-input">
            <FiSearch aria-hidden="true" />

            <input
              ref={input}
              autoFocus={!Number.isFinite(location.state?.restoreSearchY)}
              value={query}
              maxLength={80}
              onChange={event => changeQuery(event.target.value)}
              placeholder={t[3]}
              aria-label={t[3]}
              autoComplete="off"
              enterKeyHint="search"
            />

            {query && (
              <button
                type="button"
                aria-label={text.clear || "Təmizlə"}
                onClick={() => {
                  changeQuery("");
                  input.current?.focus();
                }}
              >
                <FiX />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="nb-search-submit"
            disabled={!fold(query)}
          >
            {t[0]}
            <FiArrowRight />
          </button>
        </form>

        {!fold(query) && brands.length > 0 && (
          <div className="nb-top-search__brands">
            <h2>{t[2]}</h2>

            <div className="nb-search-chips">
              {brands.map(name => (
                <button
                  type="button"
                  key={name}
                  onClick={() => {
                    changeQuery(name);
                    input.current?.focus();
                  }}
                >
                  {name}
                  <FiArrowRight />
                </button>
              ))}
            </div>
          </div>
        )}

        {fold(query) && (
          <div className="nb-top-search__results" aria-busy={loading}>
            <p role="status">
              {loading
                ? text.loading
                : failed
                  ? t[6]
                  : results.length === 0
                    ? text.searchNotFound
                    : t[1] + " · " + results.length}
            </p>

            {partial && !loading && (
              <p className="nb-search-notice">{t[5]}</p>
            )}

            {!loading && results.slice(0, 6).map(product => {
              const image = product.mainImageUrl || product.imageUrl;

              const name =
                product.name ||
                product.productName ||
                product.model ||
                product.productCode;

              const price =
                Number(product.discountPrice) > 0 &&
                Number(product.discountPrice) < Number(product.price)
                  ? product.discountPrice
                  : product.price;

              return (
                <button
                  key={product.id}
                  type="button"
                  className="nb-top-search__result"
                  onClick={() => leave(
                    "/products/" + product.id,
                    {
                      fromProductList: true,
                      fromSearch: true,
                      returnTo: "/search?q=" + encodeURIComponent(query)
                    }
                  )}
                >
                  <span className="nb-top-search__photo">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    ) : <FiSearch />}
                  </span>

                  <span>
                    <small>
                      {product.brandName || product.brand?.name}
                    </small>
                    <strong>{name}</strong>

                    {price != null && (
                      <span>{Number(price).toLocaleString("az-AZ")} ₼</span>
                    )}
                  </span>

                  <FiArrowRight />
                </button>
              );
            })}

            {!loading && !failed && results.length > 0 && (
              <button
                type="button"
                className="nb-top-search__all"
                onClick={submit}
              >
                {t[1]}
                <FiArrowRight />
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
