import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";
import ProductDiscoveryBar from "../../components/product/ProductDiscoveryBar";
import ProductCard from "../../components/product/ProductCard";
import ProductSection from "../../components/home/ProductSection";
import AppLoader from "../../components/common/AppLoader";
import {
  getActiveCampaigns,
  getProducts,
  trackVisit,
} from "../../api/homeApi";
import { useLanguage } from "../../i18n/LanguageContext";

function normalizeList(res) {
  const data = res?.data || res;
  return (
    data?.items ||
    data?.products ||
    data?.result ||
    data?.data ||
    (Array.isArray(data) ? data : [])
  );
}

export default function HomePage() {
  const { text } = useLanguage();

  const [campaigns, setCampaigns] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [discountProducts, setDiscountProducts] = useState([]);
  const [products, setProducts] = useState([]);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);

  useEffect(() => {
    loadHome();
    trackVisit("/").catch(() => {});
  }, []);

  async function loadHome() {
    try {
      setLoading(true);

      const [campaignRes, featuredRes, newRes, discountRes, productsRes] =
        await Promise.all([
          getActiveCampaigns().catch(() => []),
          getProducts({ isFeatured: true, page: 1, pageSize: 8 }).catch(
            () => []
          ),
          getProducts({ page: 1, pageSize: 8 }).catch(() => []),
          getProducts({ isDiscounted: true, page: 1, pageSize: 8 }).catch(
            () => []
          ),
          getProducts({ page: 1, pageSize: 6 }).catch(() => []),
        ]);

      setCampaigns(normalizeList(campaignRes));
      setFeaturedProducts(normalizeList(featuredRes));
      setNewProducts(normalizeList(newRes));
      setDiscountProducts(normalizeList(discountRes));
      setProducts(normalizeList(productsRes));
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    try {
      setMoreLoading(true);

      const nextPage = page + 1;
      const res = await getProducts({ page: nextPage, pageSize: 6 });

      setProducts((prev) => [...prev, ...normalizeList(res)]);
      setPage(nextPage);
    } finally {
      setMoreLoading(false);
    }
  }

  function handleFilteredProducts(list) {
    setProducts(list);
    setPage(1);
  }

  if (loading) {
    return <AppLoader text={text.loading} />;
  }

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <ProductDiscoveryBar onProductsChange={handleFilteredProducts} />

      {campaigns.length > 0 && (
        <section className="mx-auto max-w-[1180px] px-5 py-5 md:px-8 md:py-8">
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {campaigns.map((campaign) => (
              <NavLink
                key={campaign.id}
                to={campaign.redirectUrl || "/"}
                className="group relative h-[360px] min-w-full snap-center overflow-hidden rounded-[32px] bg-zinc-900 md:h-[460px]"
              >
                {campaign.imageUrl && (
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 text-center text-white md:p-9">
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-white/70">
                    NemesisBaku
                  </p>

                  <h1 className="mx-auto max-w-[660px] text-[34px] font-extrabold leading-[1.05] tracking-[-0.045em] md:text-[60px]">
                    {campaign.title}
                  </h1>

                  {campaign.description && (
                    <p className="mx-auto mt-3 max-w-[480px] text-sm font-medium leading-6 text-white/80 md:text-base">
                      {campaign.description}
                    </p>
                  )}

                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-zinc-950 transition group-hover:gap-3">
                    {text.discover}
                    <FiChevronRight />
                  </div>
                </div>
              </NavLink>
            ))}
          </div>
        </section>
      )}

      <ProductSection title={text.featuredProducts} products={featuredProducts} />
      <ProductSection title={text.newProducts} products={newProducts} />
      <ProductSection title={text.discountProducts} products={discountProducts} />

      {products.length > 0 && (
        <section className="mx-auto max-w-[1180px] px-5 py-7 md:px-8 md:py-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {products.length >= 6 && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={moreLoading}
                className="rounded-full bg-[#244989] px-7 py-4 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
              >
                {moreLoading ? text.loading : text.loadMore}
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}