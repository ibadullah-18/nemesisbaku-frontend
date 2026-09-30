import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../api/apiFetch";
import ProductCard from "../../components/product/ProductCard";
import AppLoader from "../../components/common/AppLoader";
import { ShowcaseImage } from "../../components/home/ShowcaseGroup";
import NotFoundPage from "../error/NotFoundPage";

export default function ShowcasePage() {
  const { slug } = useParams();
  const [state, setState] = useState({ slug: null, data: null, error: null });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    apiFetch(`/api/Showcase/pages/${encodeURIComponent(slug)}`)
      .then(res => { if (active) setState({ slug, data: res?.data ?? res, error: null }); })
      .catch(error => { if (active) setState({ slug, data: null, error }); });
    return () => { active = false; };
  }, [slug, retry]);
  if (state.slug !== slug) return <AppLoader />;
  if (state.error) {
    if (state.error.status === 404) return <NotFoundPage />;
    return <main className="nb-showcase-page" role="alert"><p>Səhifə yüklənmədi.</p><button type="button" onClick={() => { setState({ slug: null }); setRetry(v => v + 1); }}>Yenidən yoxla</button></main>;
  }
  const data = state.data;
  if (!data) return <NotFoundPage />;
  return <main className="nb-showcase-page">
    {data.imageUrl && <div className={`nb-showcase-page__image nb-showcase-page__image--${data.shape}`}><ShowcaseImage block={data} eager /></div>}
    {data.title && <h1 className="nb-showcase-page__copy">{data.title}</h1>}
    {data.subtitle && <p className="nb-showcase-page__copy nb-showcase-page__subtitle">{data.subtitle}</p>}
    {data.description && <div className="nb-showcase-page__copy">{data.description}</div>}
    {data.products?.length > 0 && <div className="nb-showcase-page__products">{data.products.map(product => <ProductCard key={product.id} product={product} />)}</div>}
    {data.afterProductsDescription && <div className="nb-showcase-page__copy">{data.afterProductsDescription}</div>}
  </main>;
}
