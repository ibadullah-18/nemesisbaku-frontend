import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiBarChart2,
  FiBox,
  FiCheckCircle,
  FiEdit3,
  FiEye,
  FiImage,
  FiPackage,
  FiRefreshCw,
  FiTag,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import { adminProductsApi, unwrapAdmin } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

function money(value) {
  return `${Number(value || 0).toFixed(2)} ₼`;
}

function getImageUrl(image) {
  if (!image) return null;
  if (typeof image === "string") return image;

  return (
    image.imageUrl ||
    image.mainImageUrl ||
    image.url ||
    image.fileUrl ||
    image.path ||
    image.secureUrl ||
    image.src ||
    null
  );
}

function getProductImages(product) {
  const raw =
    product.images ||
    product.productImages ||
    product.imageDtos ||
    product.productImageDtos ||
    product.imageUrls ||
    [];

  const list = Array.isArray(raw) ? raw : [];

  const images = list
    .map((img, index) => ({
      id: img?.id || index,
      isMain: Boolean(img?.isMain || img?.isMainImage),
      displayOrder: img?.displayOrder ?? img?.order ?? index,
      src: getImageUrl(img),
    }))
    .filter((img) => img.src)
    .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));

  const mainFromProduct =
    product.mainImageUrl ||
    product.imageUrl ||
    product.image ||
    product.photoUrl ||
    product.coverImageUrl;

  if (mainFromProduct && !images.some((x) => x.src === mainFromProduct)) {
    images.unshift({
      id: "main",
      isMain: true,
      displayOrder: -1,
      src: mainFromProduct,
    });
  }

  return images;
}

function getVariants(product) {
  const variants =
    product.variants ||
    product.productVariants ||
    product.productVariantDtos ||
    [];

  return Array.isArray(variants) ? variants : [];
}

function getTotalStock(product) {
  return getVariants(product).reduce(
    (sum, variant) => sum + Number(variant.stockCount || variant.stock || 0),
    0
  );
}

function getVariantSize(variant) {
  return (
    variant.sizeValue ||
    variant.size ||
    variant.sizeName ||
    variant.size?.value ||
    variant.size?.name ||
    "—"
  );
}

function getVariantColor(variant) {
  return variant.colorName || variant.color || variant.color?.name || "—";
}

function getVariantHex(variant) {
  return (
    variant.colorHex ||
    variant.hexCode ||
    variant.hex ||
    variant.color?.hexCode ||
    variant.color?.hex ||
    ""
  );
}

function isBrokenVariant(variant) {
  return (
    !getVariantSize(variant) ||
    getVariantSize(variant) === "—" ||
    !getVariantColor(variant) ||
    getVariantColor(variant) === "—"
  );
}

function getStatusInfo(product) {
  if (product.isDeleted) {
    return {
      label: "Silinib",
      className: "bg-red-50 text-red-600",
      icon: <FiTrash2 />,
    };
  }

  if (product.isActive === false) {
    return {
      label: "Deaktiv",
      className: "bg-orange-50 text-orange-600",
      icon: <FiXCircle />,
    };
  }

  return {
    label: "Aktiv",
    className: "bg-green-50 text-green-700",
    icon: <FiCheckCircle />,
  };
}

function yesNo(value) {
  return value ? "Bəli" : "Xeyr";
}

export default function AdminProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadProduct() {
    try {
      setError("");
      setLoading(true);

      const res = await adminProductsApi.detail(id);
      const data = unwrapAdmin(res);

      setProduct(data);

      const images = getProductImages(data);
      setSelectedImage(images[0]?.src || "");
    } catch (err) {
      setError(err.message || "Məhsul detalları yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct() {
    const ok = confirm(`${product?.name || "Bu məhsul"} silinsin?`);
    if (!ok) return;

    try {
      setSaving(true);
      await adminProductsApi.delete(id);
      navigate("/SuperAdmin/products");
    } catch (err) {
      setError(err.message || "Məhsul silinmədi.");
    } finally {
      setSaving(false);
    }
  }

  const images = useMemo(() => getProductImages(product || {}), [product]);
  const variants = useMemo(() => getVariants(product || {}), [product]);
  const status = product ? getStatusInfo(product) : null;

  const warnings = useMemo(() => {
    const result = [];

    if (!product?.categoryId && !product?.categoryName && !product?.category?.name) {
      result.push("Məhsulun kateqoriya məlumatı gəlmədi.");
    }

    if (!product?.brandId && !product?.brandName && !product?.brand?.name) {
      result.push("Məhsulun brend məlumatı gəlmədi.");
    }

    variants.forEach((variant, index) => {
      if (isBrokenVariant(variant)) {
        result.push(`Variant #${index + 1} üçün ölçü və ya rəng məlumatı tapılmadı.`);
      }
    });

    if (variants.length === 0) {
      result.push("Bu məhsulda heç bir variant yoxdur.");
    }

    if (images.length === 0) {
      result.push("Bu məhsulda şəkil yoxdur.");
    }

    return result;
  }, [product, variants, images]);

  if (loading) return <AppLoader text="Məhsul açılır" />;

  if (!product) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-8">
        <div className="rounded-[24px] bg-red-50 p-5 text-sm font-extrabold text-red-600">
          Məhsul tapılmadı.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Əməliyyat icra olunur" />}

      <button
        type="button"
        onClick={() => navigate("/SuperAdmin/products")}
        className="mb-5 flex h-11 items-center gap-2 rounded-[15px] bg-white px-4 text-sm font-extrabold text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.97]"
      >
        <FiArrowLeft />
        Məhsullara qayıt
      </button>

      <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Admin məhsul detalları
          </p>

          <h1 className="mt-2 text-[30px] font-extrabold tracking-[-0.045em] md:text-[44px]">
            {product.name || "Məhsul"}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold ${status.className}`}>
              {status.icon}
              {status.label}
            </span>

            {product.isDiscounted || product.discountPrice ? (
              <span className="rounded-full bg-[#244989]/8 px-3 py-1 text-xs font-extrabold text-[#244989]">
                Endirim bölməsində görünür
              </span>
            ) : null}

            {product.isFeatured ? (
              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-extrabold text-purple-600">
                Önə çıxan məhsuldur
              </span>
            ) : null}

            {product.isNew ? (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold text-green-700">
                Yeni məhsuldur
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={loadProduct}
            className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-zinc-950 px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <FiRefreshCw />
            Yenilə
          </button>

          <NavLink
            to={`/SuperAdmin/products/${product.id}`}
            className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#244989] px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <FiEdit3 />
            Redaktə et
          </NavLink>

          <button
            type="button"
            onClick={deleteProduct}
            className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-red-50 px-5 text-sm font-extrabold text-red-600 transition hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <FiTrash2 />
            Sil
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mb-5 rounded-[24px] border border-orange-100 bg-orange-50 p-5">
          <div className="flex items-center gap-3 text-orange-700">
            <FiAlertTriangle />
            <h2 className="font-extrabold">Sistem xəbərdarlığı</h2>
          </div>

          <div className="mt-3 space-y-2">
            {warnings.map((warning, index) => (
              <p key={index} className="text-sm font-bold text-orange-700">
                {warning}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <main className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard icon={<FiTag />} label="Qiymət" value={money(product.price)} />
            <InfoCard icon={<FiTag />} label="Endirim qiyməti" value={product.discountPrice ? money(product.discountPrice) : "Yoxdur"} />
            <InfoCard icon={<FiPackage />} label="Ümumi stok" value={getTotalStock(product)} />
            <InfoCard icon={<FiEye />} label="Baxış sayı" value={product.viewCount ?? product.viewsCount ?? product.views ?? 0} />
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#244989]/8 text-[#244989]">
                <FiImage />
              </div>

              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                  Şəkillər
                </h2>
                <p className="text-sm font-bold text-zinc-500">
                  Məhsulun əsas və əlavə şəkillərinə baxış.
                </p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
              <div className="grid min-h-[360px] place-items-center overflow-hidden rounded-[28px] bg-zinc-50">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="h-full max-h-[520px] w-full object-contain p-4"
                  />
                ) : (
                  <div className="grid h-full min-h-[360px] w-full place-items-center text-zinc-300">
                    <FiImage className="text-[44px]" />
                  </div>
                )}
              </div>

              <div className="grid max-h-[520px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImage(image.src)}
                    className={`overflow-hidden rounded-[22px] border bg-zinc-50 p-2 transition hover:-translate-y-0.5 active:scale-[0.98] ${
                      selectedImage === image.src
                        ? "border-[#244989]"
                        : "border-zinc-100"
                    }`}
                  >
                    <div className="h-28 w-full overflow-hidden rounded-[18px] bg-white">
                      <img
                        src={image.src}
                        alt={`${product.name || "Məhsul"} şəkil ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <p className="mt-2 text-left text-xs font-extrabold text-zinc-500">
                      {image.isMain || index === 0 ? "Əsas şəkil" : `Əlavə şəkil ${index + 1}`}
                    </p>
                  </button>
                ))}

                {images.length === 0 && (
                  <div className="rounded-[20px] bg-zinc-50 p-5 text-sm font-extrabold text-zinc-400">
                    Şəkil yoxdur.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#244989]/8 text-[#244989]">
                <FiBox />
              </div>

              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                  Variantlar
                </h2>
                <p className="text-sm font-bold text-zinc-500">
                  Ölçü, rəng və stok məlumatlarına baxış.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {variants.map((variant, index) => {
                const broken = isBrokenVariant(variant);
                const hex = getVariantHex(variant);

                return (
                  <div
                    key={variant.id || index}
                    className={`rounded-[24px] border p-4 ${
                      broken
                        ? "border-orange-100 bg-orange-50"
                        : "border-zinc-100 bg-zinc-50"
                    }`}
                  >
                    {broken ? (
                      <div className="mb-3 flex items-center gap-2 text-orange-700">
                        <FiAlertTriangle />
                        <p className="text-sm font-extrabold">
                          Variant məlumatı tam deyil
                        </p>
                      </div>
                    ) : null}

                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-zinc-400">
                      Variant #{index + 1}
                    </p>

                    <h3 className="mt-1 text-lg font-extrabold text-zinc-950">
                      {getVariantSize(variant)} · {getVariantColor(variant)}
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-extrabold">
                      <span className="rounded-full bg-white px-3 py-1 text-zinc-600">
                        Ölçü: {getVariantSize(variant)}
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-zinc-600">
                        {hex ? (
                          <span
                            className="h-3 w-3 rounded-full border border-zinc-200"
                            style={{ backgroundColor: hex }}
                          />
                        ) : null}
                        Rəng: {getVariantColor(variant)}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 ${
                          Number(variant.stockCount || variant.stock || 0) <= 2
                            ? "bg-red-50 text-red-600"
                            : "bg-white text-zinc-600"
                        }`}
                      >
                        Stok: {variant.stockCount ?? variant.stock ?? 0}
                      </span>
                    </div>
                  </div>
                );
              })}

              {variants.length === 0 && (
                <div className="rounded-[20px] bg-zinc-50 p-5 text-sm font-extrabold text-zinc-400">
                  Variant yoxdur.
                </div>
              )}
            </div>
          </section>
        </main>

        <aside className="space-y-5">
          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">
              Əsas məlumat
            </h2>

            <div className="mt-5 space-y-3">
              <MiniInfo label="Məhsul kodu" value={product.productCode || "Yoxdur"} />
              <MiniInfo label="Model" value={product.model || "Yoxdur"} />
              <MiniInfo label="Kateqoriya" value={product.categoryName || product.category?.name || "Yoxdur"} />
              <MiniInfo label="Brend" value={product.brandName || product.brand?.name || "Yoxdur"} />
              <MiniInfo label="Endirim bölməsində görünsün" value={yesNo(product.isDiscounted || product.discountPrice)} />
              <MiniInfo label="Önə çıxan məhsuldur" value={yesNo(product.isFeatured)} />
              <MiniInfo label="Yeni məhsuldur" value={yesNo(product.isNew)} />
            </div>
          </section>

          <section className="rounded-[28px] bg-zinc-950 p-5 text-white">
            <div className="flex items-center gap-3">
              <FiBarChart2 className="text-xl" />
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                Satış görünüşü
              </h2>
            </div>

            <div className="mt-5 space-y-3 text-sm font-bold">
              <SideRow label="Normal qiymət" value={money(product.price)} />
              <SideRow label="Endirim qiyməti" value={product.discountPrice ? money(product.discountPrice) : "Yoxdur"} />
              <SideRow label="Stok" value={getTotalStock(product)} />
              <SideRow label="Baxış sayı" value={product.viewCount ?? product.viewsCount ?? product.views ?? 0} />
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">
              Açıqlama
            </h2>

            <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-zinc-600">
              {product.description || "Açıqlama yoxdur."}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_14px_42px_rgba(0,0,0,0.035)] transition hover:-translate-y-1 active:scale-[0.98]">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-[16px] bg-[#244989]/8 text-[#244989]">
        {icon}
      </div>

      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-extrabold text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-[18px] bg-zinc-50 p-4">
      <p className="text-xs font-extrabold text-zinc-400">{label}</p>
      <p className="mt-1 break-words text-sm font-extrabold text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function SideRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/60">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}