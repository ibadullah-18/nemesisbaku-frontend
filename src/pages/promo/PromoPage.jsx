import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiImage } from "react-icons/fi";
import ProductCard from "../../components/product/ProductCard";
import AppLoader from "../../components/common/AppLoader";
import { getPromoPage } from "../../api/homeApi";

function unwrap(res) {
  return res?.data?.data ?? res?.data ?? res;
}

export default function PromoPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [promo, setPromo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isPromoSlug = useMemo(() => {
    return /^nemesisbaku(comp|ban)\d+$/i.test(slug || "");
  }, [slug]);

  useEffect(() => {
    loadPromo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function loadPromo() {
    if (!isPromoSlug) {
      navigate("/", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await getPromoPage(slug);
      setPromo(unwrap(res));
    } catch (err) {
      setError(err.message || "Promo səhifə yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

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

  const products = promo.products || [];

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <section className="mx-auto max-w-[1180px] px-5 py-5 md:px-8 md:py-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 flex h-11 items-center gap-2 rounded-[15px] bg-white px-4 text-sm font-extrabold text-zinc-700 shadow-[0_14px_35px_rgba(0,0,0,0.04)] transition active:scale-[0.97]"
        >
          <FiArrowLeft />
          Geri
        </button>

        <div className="relative overflow-hidden rounded-[32px] bg-zinc-900 shadow-[0_24px_70px_rgba(0,0,0,0.14)]">
          <div className="h-[360px] md:h-[460px]">
            {promo.imageUrl ? (
              <img
                src={promo.imageUrl}
                alt={promo.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-white/40">
                <FiImage className="text-[48px]" />
              </div>
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 text-center text-white md:p-10">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.22em] text-white/70">
              NemesisBaku
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

      <section className="mx-auto max-w-[1180px] px-5 py-7 md:px-8 md:py-10">
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
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
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