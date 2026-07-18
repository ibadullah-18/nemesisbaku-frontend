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
import {
  adminProductsApi,
  listAdmin,
  metaAdmin,
} from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";
import { getPanelBasePath } from "../../api/admin/adminAuth";

function getProductId(product) {
  return product?.id || product?.productId;
}

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
      id: img?.id || img?.imageId || index,
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

function getTotalStock(product) {
  if (product.totalStock !== undefined && product.totalStock !== null) {
    return Number(product.totalStock);
  }

  const variants =
    product.variants ||
    product.productVariants ||
    product.productVariantDtos ||
    [];

  if (!Array.isArray(variants)) return 0;

  return variants.reduce(
    (sum, variant) => sum + Number(variant.stockCount || variant.stock || 0),
    0,
  );
}

function getProductStatus(product) {
  if (product.isDeleted) {
    return {
      label: "Silinib",
      className: "bg-red-50 text-red-600",
    };
  }

  if (product.isActive === false) {
    return {
      label: "Deaktiv",
      className: "bg-orange-50 text-orange-600",
    };
  }

  return {
    label: "Aktiv",
    className: "bg-green-50 text-green-700",
  };
}

function getCategoryName(product) {
  return (
    product.categoryName ||
    product.category?.name ||
    product.categoryTitle ||
    "—"
  );
}

function getBrandName(product) {
  return product.brandName || product.brand?.name || product.brandTitle || "—";
}

export default function AdminProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [meta, setMeta] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const basePath = getPanelBasePath();

  useEffect(() => {
    loadProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProducts(page = 1) {
    try {
      setError("");
      setLoading(true);

      const res = await adminProductsApi.list({
        page,
        pageSize: 20,
        search,
      });

      setProducts(listAdmin(res));
      setMeta(metaAdmin(res));
    } catch (err) {
      setError(err.message || "Məhsullar yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  function openProduct(product) {
    const productId = getProductId(product);

    if (!productId) {
      setError("Bu məhsul üçün ID gəlmədi. Detail səhifəsi açıla bilməz.");
      return;
    }

    navigate(`${basePath}/products/details/${productId}`);
  }

  async function deleteProduct(product) {
    const productId = getProductId(product);

    if (!productId) {
      setError("Bu məhsul üçün ID gəlmədi. Silmək mümkün deyil.");
      return;
    }

    const ok = confirm(`${product.name || "Bu məhsul"} silinsin?`);
    if (!ok) return;

    try {
      setSaving(true);
      setError("");

      await adminProductsApi.delete(productId);

      setProducts((prev) => prev.filter((x) => getProductId(x) !== productId));
    } catch (err) {
      setError(err.message || "Məhsul silinmədi.");
    } finally {
      setSaving(false);
    }
  }

  const counters = useMemo(() => {
    const total = products.length;
    const active = products.filter(
      (p) => p.isActive !== false && !p.isDeleted,
    ).length;
    const discounted = products.filter(
      (p) => p.isDiscounted || p.discountPrice,
    ).length;
    const lowStock = products.filter((p) => getTotalStock(p) <= 2).length;

    return { total, active, discounted, lowStock };
  }, [products]);

  if (loading) return <AppLoader text="Məhsullar yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Əməliyyat icra olunur" />}

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Admin məhsullar
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            Məhsullar
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Məhsula kliklə, tam detalları ayrıca səhifədə aç.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <NavLink
            to={`${basePath}/add-product`}
            className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#244989] px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <FiPlus />
            Məhsul əlavə et
          </NavLink>

          <button
            type="button"
            onClick={() => loadProducts(meta.page)}
            className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-zinc-950 px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <FiRefreshCw />
            Yenilə
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CounterCard
          icon={<FiPackage />}
          label="Bu səhifədə"
          value={counters.total}
        />
        <CounterCard
          icon={<FiPackage />}
          label="Aktiv"
          value={counters.active}
          green
        />
        <CounterCard
          icon={<FiTag />}
          label="Endirimli"
          value={counters.discounted}
          blue
        />
        <CounterCard
          icon={<FiAlertTriangle />}
          label="Az stok"
          value={counters.lowStock}
          red
        />
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_130px]">
        <div className="flex h-13 items-center gap-3 rounded-[16px] border border-zinc-100 bg-white px-4">
          <FiSearch className="text-zinc-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadProducts(1);
            }}
            placeholder="Məhsul adı, kodu və ya model ilə axtar"
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400"
          />
        </div>

        <button
          type="button"
          onClick={() => loadProducts(1)}
          className="flex h-13 items-center justify-center gap-2 rounded-[16px] bg-zinc-950 text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <FiSearch />
          Axtar
        </button>
      </div>

      <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-[0.14em] text-zinc-400">
                <th className="px-5 py-4">Məhsul</th>
                <th className="px-5 py-4">Kateqoriya</th>
                <th className="px-5 py-4">Brend</th>
                <th className="px-5 py-4">Qiymət</th>
                <th className="px-5 py-4">Stok</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Əməliyyat</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product, index) => {
                const productId = getProductId(product);
                const images = getProductImages(product);
                const image = images[0]?.src;
                const status = getProductStatus(product);
                const stock = getTotalStock(product);

                return (
                  <tr
                    key={productId || index}
                    onClick={() => openProduct(product)}
                    className="cursor-pointer border-b border-zinc-50 transition hover:bg-zinc-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-[20px] bg-zinc-50">
                          {image ? (
                            <img
                              src={image}
                              alt={product.name || "Məhsul"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-zinc-300">
                              <FiImage />
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-extrabold text-zinc-950">
                            {product.name || "Məhsul adı yoxdur"}
                          </p>

                          <p className="text-xs font-bold text-zinc-400">
                            Kod: {product.productCode || "—"} · Model:{" "}
                            {product.model || "—"}
                          </p>

                          {!productId && (
                            <p className="mt-1 text-xs font-extrabold text-red-600">
                              Sistem xətası: məhsul ID gəlmədi
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-bold">
                      {getCategoryName(product)}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold">
                      {getBrandName(product)}
                    </td>

                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-extrabold text-zinc-950">
                          {money(product.price)}
                        </p>

                        {product.discountPrice ? (
                          <p className="text-xs font-extrabold text-[#244989]">
                            Endirim: {money(product.discountPrice)}
                          </p>
                        ) : (
                          <p className="text-xs font-bold text-zinc-400">
                            Endirim yoxdur
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                          stock <= 2
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {stock}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openProduct(product);
                          }}
                          className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.94]"
                        >
                          <FiEye />
                        </button>

                        <NavLink
                          onClick={(e) => e.stopPropagation()}
                          to={
                            productId
                              ? `${basePath}/products/${productId}`
                              : `${basePath}/products`
                          }
                          className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.94]"
                        >
                          <FiEdit3 />
                        </NavLink>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProduct(product);
                          }}
                          className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600 transition hover:-translate-y-0.5 active:scale-[0.94]"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-sm font-bold text-zinc-400"
                  >
                    Məhsul tapılmadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-bold text-zinc-500">
            Cəmi: {meta.totalCount} məhsul · Səhifə {meta.page} /{" "}
            {meta.totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!meta.hasPreviousPage}
              onClick={() => loadProducts(meta.page - 1)}
              className="flex h-10 items-center gap-2 rounded-[14px] bg-zinc-50 px-4 text-sm font-extrabold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiChevronLeft />
              Əvvəlki
            </button>

            <button
              type="button"
              disabled={!meta.hasNextPage}
              onClick={() => loadProducts(meta.page + 1)}
              className="flex h-10 items-center gap-2 rounded-[14px] bg-zinc-50 px-4 text-sm font-extrabold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Növbəti
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CounterCard({
  icon,
  label,
  value,
  green = false,
  red = false,
  blue = false,
}) {
  let tone = "bg-zinc-50 text-zinc-700";

  if (green) tone = "bg-green-50 text-green-700";
  if (red) tone = "bg-red-50 text-red-600";
  if (blue) tone = "bg-[#244989]/8 text-[#244989]";

  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_14px_42px_rgba(0,0,0,0.035)] transition hover:-translate-y-1 active:scale-[0.98]">
      <div
        className={`mb-4 grid h-11 w-11 place-items-center rounded-[16px] text-xl ${tone}`}
      >
        {icon}
      </div>

      <p className="text-sm font-bold text-zinc-400">{label}</p>
      <h3 className="mt-1 text-[28px] font-extrabold tracking-[-0.04em]">
        {value ?? 0}
      </h3>
    </div>
  );
}
