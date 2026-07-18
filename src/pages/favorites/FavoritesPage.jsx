import { useEffect, useMemo, useState } from "react";
import { FiHeart } from "react-icons/fi";
import ProductCard from "../../components/product/ProductCard";
import AppLoader from "../../components/common/AppLoader";
import { favoritesApi } from "../../api/favoritesApi";
import { useLanguage } from "../../i18n/LanguageContext";

function unwrap(res) {
  return res?.data?.data ?? res?.data ?? res;
}

function normalizeList(res) {
  const data = unwrap(res);
  const nested = data?.data ?? data;

  return (
    data?.items ||
    data?.products ||
    data?.favorites ||
    data?.result ||
    nested?.items ||
    nested?.products ||
    nested?.favorites ||
    (Array.isArray(nested) ? nested : [])
  );
}

function normalizeFavoriteProduct(item) {
  return {
    ...item,
    id: item.productId || item.id,
    name: item.productName || item.name,
    productName: item.productName || item.name,
    productCode: item.productCode,
    price: item.price,
    discountPrice: item.discountPrice,
    isDiscounted: item.isDiscounted,
    mainImageUrl:
      item.mainImageUrl || item.imageUrl || item.images?.[0]?.imageUrl,
    imageUrl: item.imageUrl || item.mainImageUrl || item.images?.[0]?.imageUrl,
    isFavorite: true,
  };
}

export default function FavoritesPage() {
  const { text } = useLanguage();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const products = useMemo(
    () =>
      normalizeList(favorites)
        .map(normalizeFavoriteProduct)
        .filter((item) => item.id),
    [favorites],
  );

  useEffect(() => {
    let alive = true;

    async function load(showLoader = false) {
      try {
        if (showLoader) setLoading(true);
        setError("");

        const res = await favoritesApi.list();
        if (alive) setFavorites(res);
      } catch (err) {
        if (alive) setError(err.message || text.favoritesLoadError);
      } finally {
        if (alive) setLoading(false);
      }
    }

    const refreshFavorites = () => load(false);

    load(true);
    window.addEventListener("favorite_changed", refreshFavorites);
    window.addEventListener("nemesis_auth_changed", refreshFavorites);

    return () => {
      alive = false;
      window.removeEventListener("favorite_changed", refreshFavorites);
      window.removeEventListener("nemesis_auth_changed", refreshFavorites);
    };
  }, [text.favoritesLoadError]);

  if (loading) return <AppLoader text={text.loading} />;

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-7 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-7 animate-[favoritesUp_.42s_cubic-bezier(.22,1,.36,1)_both] text-center">
          <p className="text-[15px] font-medium tracking-[0.17em] text-zinc-400">
            nemesisbaku
          </p>
          <h1 className="mt-2 text-[34px] font-medium tracking-[-0.045em] text-zinc-950 md:text-[46px]">
            {text.favorites}
          </h1>
        </div>

        {error && (
          <div className="mb-5 animate-[favoritesUp_.3s_ease_both] rounded-[14px] bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="grid min-h-[360px] animate-[favoritesUp_.5s_cubic-bezier(.22,1,.36,1)_both] place-items-center rounded-[18px] bg-white px-5 text-center shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
            <div>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-[18px] bg-zinc-50 text-3xl text-zinc-400">
                <FiHeart />
              </div>
              <h2 className="mt-4 text-[24px] font-medium tracking-[-0.035em] text-zinc-950">
                {text.favoritesEmptyTitle}
              </h2>
              <p className="mx-auto mt-2 max-w-[380px] text-sm leading-6 text-zinc-500">
                {text.favoritesEmptyDesc}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid animate-[favoritesUp_.5s_cubic-bezier(.22,1,.36,1)_both] grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="animate-[favoriteCard_.45s_cubic-bezier(.22,1,.36,1)_both]"
                style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes favoritesUp {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes favoriteCard {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
