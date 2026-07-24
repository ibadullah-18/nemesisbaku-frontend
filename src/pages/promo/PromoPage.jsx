import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiImage } from "react-icons/fi";
import { getPromoPage } from "../../api/homeApi";
import AppLoader from "../../components/common/AppLoader";
import ProductCard from "../../components/product/ProductCard";
import { useLanguage } from "../../i18n/LanguageContext";

const copy = {
  az: {
    loading: "Promo yüklənir",
    loadError: "Promo yüklənmədi.",
    notFound: "Promo tapılmadı.",
    back: "Geri",
    home: "Ana səhifəyə qayıt",
    products: "Kampaniya məhsulları",
    productCount: "məhsul",
    empty: "Bu kampaniyada məhsul yoxdur.",
  },
  en: {
    loading: "Loading promotion",
    loadError: "Promotion could not be loaded.",
    notFound: "Promotion not found.",
    back: "Back",
    home: "Return to homepage",
    products: "Promotion products",
    productCount: "products",
    empty: "There are no products in this promotion.",
  },
  ru: {
    loading: "Загрузка акции",
    loadError: "Не удалось загрузить акцию.",
    notFound: "Акция не найдена.",
    back: "Назад",
    home: "Вернуться на главную",
    products: "Товары акции",
    productCount: "товаров",
    empty: "В этой акции пока нет товаров.",
  },
};

function unwrap(res) {
  return res?.data?.data ?? res?.data ?? res;
}

export default function PromoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = copy[lang] || copy.az;

  const [promo, setPromo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPromo() {
      try {
        setLoading(true);
        setError("");
        const result = unwrap(await getPromoPage(id));
        if (active) setPromo(result);
      } catch (err) {
        if (active) setError(err.message || t.loadError);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPromo();

    return () => {
      active = false;
    };
  }, [id, t.loadError]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fafafa]">
        <AppLoader text={t.loading} />
      </main>
    );
  }

  if (error || !promo) {
    return (
      <main className="min-h-screen bg-[#fafafa] px-5 py-10">
        <div className="mx-auto max-w-[1180px] rounded-[28px] bg-white p-8 text-center shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
          <p className="text-sm font-extrabold text-red-600">
            {error || t.notFound}
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-5 rounded-full bg-zinc-950 px-6 py-3 text-sm font-extrabold text-white"
          >
            {t.home}
          </button>
        </div>
      </main>
    );
  }

  const products = Array.isArray(promo.products) ? promo.products : [];
  const hasDedicatedMobileImage =
    Boolean(promo.mobileImageUrl) &&
    promo.mobileImageUrl !== promo.imageUrl;

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <section className="mx-auto max-w-[1180px] animate-[promoPageIn_.42s_cubic-bezier(.22,1,.36,1)_both] px-4 py-5 md:px-8 md:py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 flex h-11 items-center gap-2 rounded-[15px] bg-white px-4 text-sm font-extrabold text-zinc-700 shadow-[0_14px_35px_rgba(0,0,0,0.04)] transition active:scale-[0.97]"
        >
          <FiArrowLeft />
          {t.back}
        </button>

        <div className="aspect-[2/3] overflow-hidden rounded-[20px] bg-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:aspect-[2/1] md:rounded-[32px]">
          {promo.imageUrl ? (
            <picture className="block h-full w-full">
              <source
                media="(max-width: 639px)"
                srcSet={promo.mobileImageUrl || promo.imageUrl}
              />
              <img
                src={promo.imageUrl}
                alt="Kampaniya şəkli"
                className={`h-full w-full ${
                  hasDedicatedMobileImage
                    ? "object-cover"
                    : "object-contain sm:object-cover"
                }`}
              />
            </picture>
          ) : (
            <div className="grid h-full w-full place-items-center text-zinc-300">
              <FiImage className="text-[44px]" />
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-7 md:px-8 md:py-10">
        <div className="mb-5 text-center">
          <h1 className="text-[25px] font-extrabold tracking-[-0.035em] text-zinc-950 md:text-[32px]">
            {t.products}
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
            {products.length} {t.productCount}
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {products.map((product, index) => (
              <div
                key={product.id || index}
                className="animate-[promoCardIn_.45s_cubic-bezier(.22,1,.36,1)_both]"
                style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] bg-white p-10 text-center shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
            <FiImage className="mx-auto text-[42px] text-zinc-300" />
            <p className="mt-3 text-sm font-extrabold text-zinc-400">
              {t.empty}
            </p>
          </div>
        )}
      </section>

      <style>{`
        @keyframes promoPageIn {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes promoCardIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
