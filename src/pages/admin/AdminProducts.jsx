import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiEye,
  FiImage,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTag,
  FiTrash2,
} from "react-icons/fi";
import { adminProductsApi, listAdmin } from "../../api/admin/adminApi";
import { getPanelBasePath } from "../../api/admin/adminAuth";
import AdminFloatingActions from "../../components/admin/AdminFloatingActions";
import AdminMediaPreview from "../../components/admin/AdminMediaPreview";
import AppLoader from "../../components/common/AppLoader";
import { useAdminToastState } from "../../utils/adminToast";
import { getDiscountInfo } from "../../utils/productPricing";
import "./adminProducts.css";

const pageSize = 20;

function productId(product) {
  return product?.id || product?.productId || "";
}

function money(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(2)} ₼` : "—";
}

function imageUrl(image) {
  if (typeof image === "string") return image;
  return image?.imageUrl || image?.url || "";
}

function mainImage(product) {
  if (product?.mainImageUrl) return product.mainImageUrl;
  const images = Array.isArray(product?.images) ? product.images : [];
  const selected = images.find((item) => item?.isMain) || images[0];
  return imageUrl(selected);
}

function stockOf(product) {
  if (product?.totalStock != null) return Number(product.totalStock || 0);
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return variants.reduce((total, item) => total + Number(item?.stockCount || 0), 0);
}

function categoryOf(product) {
  return product?.categoryName || product?.category?.name || "—";
}

function brandOf(product) {
  return product?.brandName || product?.brand?.name || "—";
}

export default function AdminProducts() {
  const navigate = useNavigate();
  const basePath = getPanelBasePath();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [, setError] = useAdminToastState("error");
  const [, setSuccess] = useAdminToastState("success");

  async function loadProducts(showNotice = false) {
    try {
      if (showNotice) setRefreshing(true);
      else setLoading(true);
      const response = await adminProductsApi.list();
      setProducts(listAdmin(response));
      if (showNotice) setSuccess("Məhsul siyahısı yeniləndi.");
    } catch (error) {
      setError(error.message || "Məhsullar yüklənmədi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openProduct(product) {
    const id = productId(product);
    if (!id) return setError("Məhsul ID-si gəlmədi.");
    navigate(`${basePath}/products/details/${id}`);
  }

  async function deleteProduct(product) {
    const id = productId(product);
    if (!id) return setError("Məhsul ID-si gəlmədi.");
    if (!window.confirm(`${product.name || "Bu məhsul"} silinsin?`)) return;

    try {
      setDeletingId(id);
      await adminProductsApi.delete(id);
      setProducts((items) => items.filter((item) => productId(item) !== id));
      setSuccess("Məhsul silindi.");
    } catch (error) {
      setError(error.message || "Məhsul silinmədi.");
    } finally {
      setDeletingId("");
    }
  }

  const counters = useMemo(() => ({
    total: products.length,
    images: products.filter((item) => Boolean(mainImage(item))).length,
    discounted: products.filter((item) => getDiscountInfo(item.price, item.discountPrice).valid).length,
    lowStock: products.filter((item) => stockOf(item) <= 2).length,
  }), [products]);

  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("az");
    if (!value) return products;
    return products.filter((item) => [item.name, item.productCode, item.model, categoryOf(item), brandOf(item)].some((field) => String(field || "").toLocaleLowerCase("az").includes(value)));
  }, [products, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function applySearch() {
    setQuery(search);
    setPage(1);
  }

  if (loading) return <AppLoader text="Məhsullar yüklənir" />;

  return (
    <main className="nb-products-page">
      <header className="nb-products-header">
        <div>
          <p className="nb-products-eyebrow">nemesisbaku · kataloq</p>
          <h1>Məhsullar</h1>
          <p>Məhsulları, qiymətləri, şəkilləri və stok vəziyyətini bir yerdə idarə edin.</p>
        </div>
        <div className="nb-products-header__signal"><FiPackage /><span><small>Kataloqda</small><strong>{products.length} məhsul</strong></span></div>
      </header>

      <section className="nb-products-stats">
        <ProductStat icon={<FiPackage />} label="Bütün məhsullar" value={counters.total} />
        <ProductStat icon={<FiImage />} label="Şəkli olan" value={counters.images} accent />
        <ProductStat icon={<FiTag />} label="Endirimli" value={counters.discounted} accent />
        <ProductStat icon={<FiAlertTriangle />} label="Az stok" value={counters.lowStock} danger={counters.lowStock > 0} />
      </section>

      <section className="nb-products-card">
        <div className="nb-products-toolbar">
          <div><h2>Məhsul siyahısı</h2><p>{filtered.length} nəticə · səhifə {currentPage}/{totalPages}</p></div>
          <div className="nb-products-search">
            <label><FiSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && applySearch()} placeholder="Ad, kod, model, brend axtar" /></label>
            <button type="button" onClick={applySearch}>Axtar</button>
          </div>
        </div>

        <div className="nb-products-table-wrap">
          <table className="nb-products-table">
            <thead><tr><th>Məhsul</th><th>Kateqoriya</th><th>Brend</th><th>Qiymət</th><th>Stok</th><th>Əməliyyat</th></tr></thead>
            <tbody>
              {visible.map((product, index) => {
                const id = productId(product);
                const image = mainImage(product);
                const stock = stockOf(product);
                const discount = getDiscountInfo(product.price, product.discountPrice);

                return (
                  <tr key={id || index} onClick={() => openProduct(product)}>
                    <td>
                      <div className="nb-product-cell">
                        <AdminMediaPreview src={image} alt={product.name || "Məhsul"} className="nb-product-cell__image" />
                        <div><strong>{product.name || "Adsız məhsul"}</strong><span>Kod: {product.productCode || "—"} · Model: {product.model || "—"}</span>{!id ? <em>Məhsul ID-si gəlmədi</em> : null}</div>
                      </div>
                    </td>
                    <td>{categoryOf(product)}</td>
                    <td>{brandOf(product)}</td>
                    <td>
                      <div className="nb-product-price">
                        <strong>{money(discount.valid ? discount.discountPrice : product.price)}</strong>
                        {discount.valid ? <span><s>{money(product.price)}</s> · -{discount.percent}%</span> : <span>Standart qiymət</span>}
                      </div>
                    </td>
                    <td><span className={`nb-stock-pill ${stock <= 2 ? "is-low" : ""}`}>{stock} ədəd</span></td>
                    <td>
                      <div className="nb-products-row-actions">
                        <button type="button" title="Detallar" onClick={(event) => { event.stopPropagation(); openProduct(product); }}><FiEye /></button>
                        <NavLink title="Redaktə et" onClick={(event) => event.stopPropagation()} to={id ? `${basePath}/products/${id}` : `${basePath}/products`}><FiEdit3 /></NavLink>
                        <button className="is-danger" type="button" title="Sil" disabled={deletingId === id} onClick={(event) => { event.stopPropagation(); deleteProduct(product); }}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 ? <tr><td colSpan="6" className="nb-products-empty">Məhsul tapılmadı.</td></tr> : null}
            </tbody>
          </table>
        </div>

        <div className="nb-products-pagination">
          <p>Cəmi {filtered.length} məhsul göstərilir.</p>
          <div><button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><FiChevronLeft /> Əvvəlki</button><button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Növbəti <FiChevronRight /></button></div>
        </div>
      </section>

      <AdminFloatingActions status={refreshing ? "Məhsullar yenilənir…" : `${filtered.length} məhsul`}>
        <button type="button" disabled={refreshing} onClick={() => loadProducts(true)}><FiRefreshCw /> Yenilə</button>
        <NavLink className="is-primary" to={`${basePath}/add-product`}><FiPlus /> Məhsul əlavə et</NavLink>
      </AdminFloatingActions>
    </main>
  );
}

function ProductStat({ icon, label, value, accent = false, danger = false }) {
  return <article className={`nb-products-stat ${accent ? "is-accent" : ""} ${danger ? "is-danger" : ""}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}
