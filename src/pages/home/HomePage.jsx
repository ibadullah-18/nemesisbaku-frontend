import { useEffect, useState } from "react";
import ProductDiscoveryBar from "../../components/product/ProductDiscoveryBar";
import ProductCard from "../../components/product/ProductCard";
import ProductSection from "../../components/home/ProductSection";
import HomePromoSlider from "../../components/home/HomePromoSlider";
import AppLoader from "../../components/common/AppLoader";
import {
  getActiveCampaigns,
  getActiveHomeSections,
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
  const [homeSections, setHomeSections] = useState([]);
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

      const [campaignRes, homeSectionsRes, productsRes] = await Promise.all([
        getActiveCampaigns().catch(() => []),
        getActiveHomeSections().catch(() => []),
        getProducts({ page: 1, pageSize: 6 }).catch(() => []),
      ]);

      setCampaigns(normalizeList(campaignRes));
      setHomeSections(normalizeList(homeSectionsRes));
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

      <HomePromoSlider promos={campaigns} />

      {homeSections
        .slice()
        .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
        .map((section) => (
          <ProductSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            products={section.products || []}
          />
        ))}

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