import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiImage } from "react-icons/fi";
import ProductCard from "../../components/product/ProductCard";
import AppLoader from "../../components/common/AppLoader";
import { getPromoPage } from "../../api/homeApi";

function unwrap(res) {
  return res?.data?.data ?? res?.data ?? res;
}

export default function PromoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promo, setPromo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadPromo() {
      try {
        setLoading(true);
        setError("");

        const res = await getPromoPage(id);
        if (alive) setPromo(unwrap(res));
      } catch (err) {
        if (alive) setError(err.message || "Promo səhifə yüklənmədi.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadPromo();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <AppLoader text="Promo yüklənir" />;

  if (error || !promo) {
    return (
      <main className="min-h-screen bg-[#fafafa] px-5 py-10">
        <div className="mx-auto max-w-[1180px] rounded-[28px] bg-white p-8 text-center shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
          <p className="text-sm font-extrabold text-red-600">
            {error || "Promo tapılmadı."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-5 rounded-full bg-zinc-950 px-6 py-3 text-sm font-extrabold text-white"
          >
            Ana səhifəyə qayıt
          </button>
        </div>
      </main>
    );
  }

  const products = Array.isArray(promo.products) ? promo.products : [];

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <style>{`
        @keyframes promoPageIn {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes promoHeroIn {
          from { opacity: 0; transform: translateY(24px) scale(.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes promoCardIn {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <section className="mx-auto max-w-[1180px] animate-[promoPageIn_0.42s_cubic-bezier(0.22,1,0.36,1)_both] px-5 py-5 md:px-8 md:py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 flex h-11 items-center gap-2 rounded-[15px] bg-white px-4 text-sm font-extrabold text-zinc-700 shadow-[0_14px_35px_rgba(0,0,0,0.04)] transition active:scale-[0.97]"
        >
          <FiArrowLeft />
          Geri
        </button>

        <div className="relative animate-[promoHeroIn_0.55s_cubic-bezier(0.22,1,0.36,1)_both] overflow-hidden rounded-[32px] bg-zinc-900 shadow-[0_24px_70px_rgba(0,0,0,0.14)]">
          <div className="h-[360px] md:h-[460px]">
            {promo.imageUrl ? (
              <img
                src={promo.imageUrl}
                alt={promo.title || "Promo"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-white/40">
                <FiImage className="text-[48px]" />
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-center text-white md:p-10">
            <p className="mb-2 text-[15px] font-extrabold tracking-[0.17em] text-white/70">
              nemesisbaku
            </p>
            <h1 className="mx-auto max-w-[760px] text-[34px] font-extrabold leading-[1.05] tracking-[-0.045em] md:text-[60px]">
              {promo.title}
            </h1>
            {promo.description && (
              <p className="mx-auto mt-3 max-w-[560px] text-sm font-medium leading-6 text-white/80 md:text-base">
                {promo.description}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] animate-[promoPageIn_0.5s_cubic-bezier(0.22,1,0.36,1)_0.08s_both] px-5 py-7 md:px-8 md:py-10">
        <div className="mb-5 text-center">
          <h2 className="text-[25px] font-extrabold tracking-[-0.035em] text-zinc-950 md:text-[32px]">
            Kampaniya məhsulları
          </h2>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
            {products.length} məhsul
          </p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {products.map((product, index) => (
              <div
                key={product.id || `promo-product-${index}`}
                className="animate-[promoCardIn_0.45s_cubic-bezier(0.22,1,0.36,1)_both]"
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
              Bu kampaniyada məhsul yoxdur.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
