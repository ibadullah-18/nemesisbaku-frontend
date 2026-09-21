import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiBox,
  FiEdit3,
  FiImage,
  FiLayers,
  FiPackage,
  FiPercent,
  FiRefreshCw,
  FiTag,
  FiTrash2,
} from "react-icons/fi";
import { adminProductsApi, unwrapAdmin } from "../../api/admin/adminApi";
import { getPanelBasePath } from "../../api/admin/adminAuth";
import AdminFloatingActions from "../../components/admin/AdminFloatingActions";
import AdminMediaPreview from "../../components/admin/AdminMediaPreview";
import AppLoader from "../../components/common/AppLoader";
import { useAdminToastState } from "../../utils/adminToast";
import { getDiscountInfo } from "../../utils/productPricing";
import "./adminInsights.css";

function money(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(2)} ₼` : "—";
}

function imageUrl(image) {
  if (typeof image === "string") return image;
  return image?.imageUrl || image?.url || "";
}

function productImages(product) {
  const raw = Array.isArray(product?.images) ? product.images : [];

  return raw
    .map((image, index) => ({
      id: image?.id || `image-${index}`,
      src: imageUrl(image),
      isMain: Boolean(image?.isMain),
      order: Number(image?.displayOrder ?? index),
    }))
    .filter((image) => image.src)
    .sort((a, b) => a.order - b.order);
}

function variantsOf(product) {
  return Array.isArray(product?.variants) ? product.variants : [];
}

function totalStock(variants) {
  return variants.reduce(
    (total, variant) => total + Number(variant?.stockCount || 0),
    0,
  );
}

export default function AdminProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const basePath = getPanelBasePath();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [, setError] = useAdminToastState("error");
  const [, setSuccess] = useAdminToastState("success");

  async function loadProduct(showNotice = false) {
    try {
      if (showNotice) setRefreshing(true);
      else setLoading(true);

      const response = await adminProductsApi.detail(id);
      const data = unwrapAdmin(response);
      const images = productImages(data);

      setProduct(data || null);
      setSelectedImage((current) =>
        images.some((image) => image.src === current)
          ? current
          : images.find((image) => image.isMain)?.src || images[0]?.src || "",
      );

      if (showNotice) setSuccess("Məhsul məlumatları yeniləndi.");
    } catch (error) {
      setError(error.message || "Məhsul detalları yüklənmədi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function deleteProduct() {
    if (!window.confirm(`${product?.name || "Bu məhsul"} silinsin?`)) return;

    try {
      setDeleting(true);
      await adminProductsApi.delete(id);
      setSuccess("Məhsul uğurla silindi.");
      navigate(`${basePath}/products`);
    } catch (error) {
      setError(error.message || "Məhsul silinmədi.");
    } finally {
      setDeleting(false);
    }
  }

  const images = useMemo(() => productImages(product), [product]);
  const variants = useMemo(() => variantsOf(product), [product]);
  const discount = getDiscountInfo(product?.price, product?.discountPrice);
  const stock = totalStock(variants);

  if (loading) return <AppLoader text="Məhsul açılır" />;

  if (!product) {
    return (
      <main className="nb-insight-page">
        <section className="nb-insight-empty">
          <FiPackage />
          <h1>Məhsul tapılmadı</h1>
          <button type="button" onClick={() => navigate(`${basePath}/products`)}>
            Siyahıya qayıt
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="nb-insight-page nb-product-detail">
      <header className="nb-insight-header">
        <div>
          <p className="nb-insight-eyebrow">nemesisbaku · məhsul detalları</p>
          <h1>{product.name || "Adsız məhsul"}</h1>
          <p>
            {product.brandName || "Brend göstərilməyib"} · {product.model || "Model göstərilməyib"}
          </p>
        </div>

        <span className={`nb-insight-badge ${discount.valid ? "is-discount" : ""}`}>
          {discount.valid ? `${discount.percent}% endirim` : "Standart qiymət"}
        </span>
      </header>

      <section className="nb-insight-stats">
        <StatCard icon={<FiTag />} label="Əsas qiymət" value={money(product.price)} />
        <StatCard
          icon={<FiPercent />}
          label="Endirimli qiymət"
          value={discount.valid ? money(discount.discountPrice) : "Endirim yoxdur"}
          accent={discount.valid}
        />
        <StatCard
          icon={<FiLayers />}
          label="Qənaət"
          value={discount.valid ? `${money(discount.amount)} · ${discount.percent}%` : "0.00 ₼"}
        />
        <StatCard icon={<FiBox />} label="Ümumi stok" value={`${stock} ədəd`} />
      </section>

      <div className="nb-insight-layout">
        <section className="nb-insight-main">
          <article className="nb-insight-card">
            <div className="nb-insight-card__heading">
              <span><FiImage /></span>
              <div>
                <h2>Şəkil qalereyası</h2>
                <p>{images.length} şəkil · silinmiş linklər təhlükəsiz əvəzlənir</p>
              </div>
            </div>

            <div className="nb-product-gallery">
              <AdminMediaPreview
                src={selectedImage}
                alt={product.name || "Məhsul"}
                className="nb-product-gallery__main"
              />

              <div className="nb-product-gallery__thumbs">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    className={selectedImage === image.src ? "is-selected" : ""}
                    onClick={() => setSelectedImage(image.src)}
                  >
                    <AdminMediaPreview
                      src={image.src}
                      alt={`${product.name || "Məhsul"} ${index + 1}`}
                    />
                    <small>{image.isMain ? "Əsas" : `${index + 1}`}</small>
                  </button>
                ))}

                {images.length === 0 ? (
                  <div className="nb-insight-note">Bu məhsula şəkil əlavə edilməyib.</div>
                ) : null}
              </div>
            </div>
          </article>

          <article className="nb-insight-card">
            <div className="nb-insight-card__heading">
              <span><FiBox /></span>
              <div>
                <h2>Ölçü və rəng variantları</h2>
                <p>{variants.length} variant · {stock} ədəd ümumi stok</p>
              </div>
            </div>

            <div className="nb-variant-grid">
              {variants.map((variant, index) => {
                const hex = variant.colorHexCode || "";
                const count = Number(variant.stockCount || 0);

                return (
                  <div className="nb-variant-card" key={variant.id || index}>
                    <div>
                      <small>VARİANT {index + 1}</small>
                      <strong>{variant.sizeValue || "Ölçü yoxdur"}</strong>
                    </div>
                    <div className="nb-variant-card__color">
                      {hex ? <i style={{ backgroundColor: hex }} /> : null}
                      <span>{variant.colorName || "Rəng yoxdur"}</span>
                    </div>
                    <b className={count <= 2 ? "is-low" : ""}>{count} stok</b>
                  </div>
                );
              })}

              {variants.length === 0 ? (
                <div className="nb-insight-note">Bu məhsulda variant yoxdur.</div>
              ) : null}
            </div>
          </article>
        </section>

        <aside className="nb-insight-side">
          <article className="nb-insight-card">
            <h2>Məhsul məlumatı</h2>
            <div className="nb-info-list">
              <InfoRow label="Məhsul kodu" value={product.productCode || "—"} />
              <InfoRow label="Model" value={product.model || "—"} />
              <InfoRow label="Kateqoriya" value={product.categoryName || "—"} />
              <InfoRow label="Brend" value={product.brandName || "—"} />
              <InfoRow label="Önə çıxan" value={product.isFeatured ? "Bəli" : "Xeyr"} />
              <InfoRow label="Şəkil sayı" value={images.length} />
              <InfoRow label="Variant sayı" value={variants.length} />
            </div>
          </article>

          <article className="nb-insight-card nb-price-card">
            <p>Satış qiyməti</p>
            <strong>{money(discount.valid ? discount.discountPrice : product.price)}</strong>
            {discount.valid ? (
              <div>
                <s>{money(product.price)}</s>
                <span>{money(discount.amount)} qənaət</span>
              </div>
            ) : (
              <small>Bu məhsulda endirim yoxdur.</small>
            )}
          </article>

          <article className="nb-insight-card">
            <h2>Açıqlama</h2>
            <p className="nb-description">{product.description || "Açıqlama yoxdur."}</p>
          </article>
        </aside>
      </div>

      <AdminFloatingActions status={refreshing ? "Məlumat yenilənir…" : "Məhsul detalları"}>
        <button type="button" onClick={() => navigate(`${basePath}/products`)}>
          <FiArrowLeft /> Geri
        </button>
        <button type="button" disabled={refreshing} onClick={() => loadProduct(true)}>
          <FiRefreshCw /> Yenilə
        </button>
        <NavLink className="is-primary" to={`${basePath}/products/${id}`}>
          <FiEdit3 /> Redaktə et
        </NavLink>
        <button className="is-danger" type="button" disabled={deleting} onClick={deleteProduct}>
          <FiTrash2 /> {deleting ? "Silinir…" : "Sil"}
        </button>
      </AdminFloatingActions>
    </main>
  );
}

function StatCard({ icon, label, value, accent = false }) {
  return (
    <article className={`nb-insight-stat ${accent ? "is-accent" : ""}`}>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
