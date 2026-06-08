import { useEffect, useState } from "react";
import { FiEdit3, FiEye, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { adminProductsApi } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

function unwrapData(res) {
  return res?.data?.data || res?.data || res;
}

function dataOf(res) {
  const data = unwrapData(res);
  return data?.items || data?.products || data?.result || (Array.isArray(data) ? data : []);
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
    image.image ||
    image.imagePath ||
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
    product.imagesUrl ||
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

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

async function loadProducts() {
  try {
    setLoading(true);
    const res = await adminProductsApi.list({ page: 1, pageSize: 200 });
    setProducts(dataOf(res));
  } finally {
    setLoading(false);
  }
}

  async function openProduct(productId) {
    try {
      setDetailLoading(true);

      const res = await adminProductsApi.detail(productId);
      const product = unwrapData(res);

      console.log("ADMIN PRODUCT DETAIL:", product);

      setSelectedProduct(product);
    } finally {
      setDetailLoading(false);
    }
  }

  async function deleteProduct(id) {
    const ok = confirm("Bu məhsul silinsin?");
    if (!ok) return;

    await adminProductsApi.delete(id);
    setProducts((prev) => prev.filter((x) => x.id !== id));
  }

  if (loading) return <AppLoader text="Məhsullar yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {detailLoading && <AppLoader text="Məhsul açılır" />}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Admin məhsullar
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            Məhsullar
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Məhsula klikləyin, detail pəncərəsi açılacaq.
          </p>
        </div>

        <NavLink
          to="/SuperAdmin/add-product"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#244989] px-5 text-sm font-extrabold text-white"
        >
          <FiPlus />
          Məhsul əlavə et
        </NavLink>
      </div>

      <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-[0.14em] text-zinc-400">
                <th className="px-5 py-4">Məhsul</th>
                <th className="px-5 py-4">Qiymət</th>
                <th className="px-5 py-4">Endirim</th>
                <th className="px-5 py-4">Stok</th>
                <th className="px-5 py-4 text-right">Əməliyyat</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => {
                const tableImages = getProductImages(product);
                const tableImage = tableImages[0]?.src;

                return (
                  <tr
                    key={product.id}
                    onClick={() => openProduct(product.id)}
                    className="cursor-pointer border-b border-zinc-50 transition hover:bg-zinc-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 overflow-hidden rounded-[18px] bg-zinc-50">
                          {tableImage ? (
                            <img
                              src={tableImage}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-xs font-bold text-zinc-300">
                              N
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-extrabold text-zinc-950">
                            {product.name}
                          </p>
                          <p className="text-xs font-bold text-zinc-400">
                            {product.productCode || "Kod yoxdur"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-extrabold">
                      {product.price} ₼
                    </td>

                    <td className="px-5 py-4 text-sm font-extrabold text-[#244989]">
                      {product.discountPrice ? `${product.discountPrice} ₼` : "—"}
                    </td>

                    <td className="px-5 py-4 text-sm font-extrabold">
                      {product.totalStock ?? 0}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openProduct(product.id);
                          }}
                          className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-700"
                        >
                          <FiEye />
                        </button>

                        <NavLink
                          onClick={(e) => e.stopPropagation()}
                          to={`/SuperAdmin/products/${product.id}`}
                          className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-700"
                        >
                          <FiEdit3 />
                        </NavLink>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProduct(product.id);
                          }}
                          className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600"
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
                    colSpan="5"
                    className="px-5 py-10 text-center text-sm font-bold text-zinc-400"
                  >
                    Hələ məhsul yoxdur.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

function ProductDetailModal({ product, onClose }) {
  const images = getProductImages(product);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const mainImage =
    images[activeImageIndex]?.src ||
    images.find((x) => x.isMain)?.src ||
    images[0]?.src ||
    product.mainImageUrl ||
    product.imageUrl ||
    null;

  const variants =
    product.variants ||
    product.productVariants ||
    product.variantDtos ||
    product.productVariantDtos ||
    [];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/25 px-4 py-5 backdrop-blur-[2px]">
      <div className="relative max-h-[calc(100vh-40px)] w-full max-w-[980px] overflow-y-auto rounded-[34px] bg-white p-5 shadow-[0_30px_100px_rgba(0,0,0,0.18)] md:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-800"
        >
          <FiX />
        </button>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="aspect-square overflow-hidden rounded-[28px] bg-zinc-50">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-500"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm font-bold text-zinc-300">
                  Şəkil yoxdur
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {images.map((img, index) => (
                  <button
                    type="button"
                    key={img.id || index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-[18px] border bg-zinc-50 transition ${
                      activeImageIndex === index
                        ? "border-[#244989] ring-2 ring-[#244989]/20"
                        : "border-zinc-100"
                    }`}
                  >
                    <img
                      src={img.src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pr-0 md:pr-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#244989]">
              {product.brandName || product.brand?.name || "NemesisBaku"}
            </p>

            <h2 className="mt-2 text-[32px] font-extrabold leading-[1.05] tracking-[-0.045em] text-zinc-950 md:text-[44px]">
              {product.name}
            </h2>

            <p className="mt-3 text-sm font-bold text-zinc-400">
              Kod: {product.productCode || "—"} / Model: {product.model || "—"}
            </p>

            <div className="mt-5 flex items-end gap-3">
              <p className="text-[28px] font-extrabold text-[#244989]">
                {product.discountPrice || product.price} ₼
              </p>

              {product.discountPrice && (
                <p className="text-sm font-bold text-zinc-400 line-through">
                  {product.price} ₼
                </p>
              )}
            </div>

            {product.description && (
              <p className="mt-5 text-sm font-medium leading-7 text-zinc-600">
                {product.description}
              </p>
            )}

            <div className="mt-6">
              <h3 className="mb-3 text-sm font-extrabold text-zinc-950">
                Variantlar
              </h3>

              <div className="grid gap-2 sm:grid-cols-2">
                {variants.map((variant, index) => (
                  <div
                    key={variant.id || index}
                    className="rounded-[18px] border border-zinc-100 bg-zinc-50 p-3"
                  >
                    <p className="text-sm font-extrabold text-zinc-950">
                      Razmer:{" "}
                      {variant.sizeValue ||
                        variant.size?.value ||
                        variant.sizeName ||
                        variant.size ||
                        "—"}
                    </p>

                    <p className="mt-1 text-sm font-bold text-zinc-500">
                      Rəng:{" "}
                      {variant.colorName ||
                        variant.color?.name ||
                        variant.colorValue ||
                        variant.color ||
                        "—"}
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#244989]">
                      Stok: {variant.stockCount ?? variant.stock ?? 0}
                    </p>
                  </div>
                ))}

                {variants.length === 0 && (
                  <div className="rounded-[18px] bg-zinc-50 p-4 text-sm font-bold text-zinc-400">
                    Variant yoxdur.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-[20px] bg-zinc-50 p-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-zinc-400">
                Debug
              </p>
              <p className="mt-2 text-sm font-bold text-zinc-600">
                Şəkil sayı: {images.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}