import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiX,
  FiZap,
} from "react-icons/fi";
import { FaHeart, FaWhatsapp } from "react-icons/fa";
import AppLoader from "../../components/common/AppLoader";
import ProductCard from "../../components/product/ProductCard";
import { apiFetch, getAccessToken } from "../../api/apiFetch";
import { getProducts } from "../../api/homeApi";
import { useLanguage } from "../../i18n/LanguageContext";

const LOW_STOCK_LIMIT = 3;

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

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

function getImageUrl(x) {
  if (!x) return null;
  if (typeof x === "string") return x;

  return (
    x.imageUrl ||
    x.url ||
    x.mainImageUrl ||
    x.secureUrl ||
    x.src ||
    x.path ||
    null
  );
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { text } = useLanguage();

  const relatedRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [activeImage, setActiveImage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedPage, setRelatedPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPage();
  }, [id]);

  async function loadPage() {
    try {
      setLoading(true);
      setError("");

      const res = await apiFetch(`/api/Products/${id}`);
      const data = unwrap(res);

      setProduct(data);
      setFavorite(Boolean(data?.isFavorite));

      const firstColor = data?.variants?.[0]?.colorName || "";
      const firstSize =
        data?.variants?.find(
          (v) => v.colorName === firstColor && Number(v.stockCount || 0) > 0
        )?.sizeValue || "";

      setSelectedColor(firstColor);
      setSelectedSize(firstSize);
      setQuantity(1);

      await loadRelated(data, 1, true);
    } catch (err) {
      setError(err.message || text.productLoadError);
    } finally {
      setLoading(false);
    }
  }

  async function loadRelated(currentProduct = product, page = relatedPage + 1, replace = false) {
    try {
      setRelatedLoading(true);

      const res = await getProducts({ page, pageSize: 15 });
      const list = normalizeList(res)
        .filter((x) => x.id !== id)
        .sort((a, b) => {
          const aScore =
            Number(a.brandName === currentProduct?.brandName) +
            Number(a.categoryName === currentProduct?.categoryName);
          const bScore =
            Number(b.brandName === currentProduct?.brandName) +
            Number(b.categoryName === currentProduct?.categoryName);

          return bScore - aScore;
        });

      setRelatedProducts((prev) => (replace ? list : [...prev, ...list]));
      setRelatedPage(page);
    } finally {
      setRelatedLoading(false);
    }
  }

  const images = useMemo(() => {
    const list = product?.images?.map(getImageUrl).filter(Boolean) || [];

    if (product?.mainImageUrl && !list.includes(product.mainImageUrl)) {
      list.unshift(product.mainImageUrl);
    }

    if (product?.imageUrl && !list.includes(product.imageUrl)) {
      list.unshift(product.imageUrl);
    }

    return [...new Set(list)];
  }, [product]);

  const colors = useMemo(() => {
    const map = new Map();

    (product?.variants || []).forEach((v) => {
      if (!v.colorName) return;

      map.set(v.colorName, {
        name: v.colorName,
        hex: v.colorHexCode || v.colorHex || "#111111",
      });
    });

    return [...map.values()];
  }, [product]);

  const availableSizes = useMemo(() => {
    return (product?.variants || [])
      .filter((v) => v.colorName === selectedColor)
      .filter((v) => Number(v.stockCount || 0) > 0)
      .map((v) => ({
        size: v.sizeValue,
        stock: Number(v.stockCount || 0),
        variantId: v.id,
      }));
  }, [product, selectedColor]);

  const selectedVariant = useMemo(() => {
    return (product?.variants || []).find(
      (v) => v.colorName === selectedColor && v.sizeValue === selectedSize
    );
  }, [product, selectedColor, selectedSize]);

  const stock = Number(selectedVariant?.stockCount || 0);
  const price = Number(product?.price || 0);
  const discountPrice = Number(product?.discountPrice || 0);
  const hasDiscount = discountPrice > 0 && discountPrice < price;

  function chooseColor(colorName) {
    setSelectedColor(colorName);

    const firstSize =
      (product?.variants || []).find(
        (v) => v.colorName === colorName && Number(v.stockCount || 0) > 0
      )?.sizeValue || "";

    setSelectedSize(firstSize);
    setQuantity(1);
  }

  function handleZoomMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();

    setZoom({
      active: true,
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }

  function scrollRelated(direction) {
    const row = relatedRef.current;
    if (!row) return;

    const card = row.querySelector("[data-related-card]");
    const cardWidth = card?.clientWidth || 240;

    row.scrollBy({
      left: direction === "right" ? cardWidth + 16 : -(cardWidth + 16),
      behavior: "smooth",
    });
  }

  async function toggleFavorite() {
    if (!getAccessToken()) {
      navigate("/login");
      return;
    }

    try {
      setActionLoading(true);
      await apiFetch(`/api/Favorites/${id}`, { method: "POST" });
      setFavorite((prev) => !prev);
    } finally {
      setActionLoading(false);
    }
  }

  async function addBasket() {
    if (!getAccessToken()) {
      navigate("/login");
      return;
    }

    if (!selectedVariant) {
      setError(text.selectSizeError);
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await apiFetch("/api/Basket", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant.id,
          quantity,
        }),
      });

      window.dispatchEvent(new Event("nemesis_auth_changed"));
    } catch (err) {
      setError(err.message || text.basketAddError);
    } finally {
      setActionLoading(false);
    }
  }

  async function openWhatsapp() {
    try {
      const res = await apiFetch(`/api/WhatsApp/product-inquiry/${id}`);
      const data = unwrap(res);

      const url =
        data?.url ||
        data?.link ||
        data?.whatsappUrl ||
        data?.redirectUrl ||
        data;

      if (typeof url === "string") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(err.message || text.whatsappError);
    }
  }

  if (loading) return <AppLoader text={text.loading} />;

  if (!product) {
    return (
      <main className="min-h-screen bg-[#fafafa] px-5 py-10 text-center">
        <p className="font-medium text-zinc-500">{error || text.productNotFound}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-7 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1180px]">
        <section className="grid gap-7 lg:grid-cols-[minmax(0,650px)_1fr]">
          <div className="animate-[detailsUp_.5s_cubic-bezier(.22,1,.36,1)_both]">
            <div className="grid gap-3 md:grid-cols-[76px_minmax(0,1fr)]">
              <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col md:overflow-visible">
                {images.map((img, index) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[14px] border bg-white transition duration-300 ${
                      activeImage === index
                        ? "border-zinc-950"
                        : "border-zinc-100 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                onMouseMove={handleZoomMove}
                onMouseEnter={() => setZoom((p) => ({ ...p, active: true }))}
                onMouseLeave={() => setZoom((p) => ({ ...p, active: false }))}
                className="order-1 relative aspect-[4/4.75] max-h-[620px] overflow-hidden rounded-[18px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.045)] md:order-2"
              >
                {images[activeImage] ? (
                  <img
                    src={images[activeImage]}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300"
                    style={{
                      transform: zoom.active ? "scale(1.55)" : "scale(1)",
                      transformOrigin: `${zoom.x}% ${zoom.y}%`,
                    }}
                  />
                ) : (
                  <div className="grid h-full place-items-center text-zinc-300">
                    NemesisBaku
                  </div>
                )}
              </button>
            </div>
          </div>

          <div className="animate-[detailsUp_.62s_cubic-bezier(.22,1,.36,1)_both] rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                  {product.brandName || "NemesisBaku"}
                </p>

                <h1 className="mt-2 text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-zinc-950 md:text-[40px]">
                  {product.name}
                </h1>
              </div>

              <button
                type="button"
                onClick={toggleFavorite}
                disabled={actionLoading}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-zinc-50 text-xl text-zinc-950 transition hover:bg-zinc-100 active:scale-[0.96]"
              >
                {favorite ? <FaHeart className="text-red-600" /> : <FiHeart />}
              </button>
            </div>

            <p className="mt-4 text-[15px] font-normal leading-7 text-zinc-500">
              {product.description}
            </p>

            <div className="mt-5 flex items-end gap-3">
              <p
                className={`text-[30px] font-semibold ${
                  hasDiscount ? "text-red-600" : "text-zinc-950"
                }`}
              >
                {hasDiscount ? discountPrice : price} ₼
              </p>

              {hasDiscount && (
                <p className="pb-1 text-base font-medium text-zinc-400 line-through">
                  {price} ₼
                </p>
              )}
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold text-zinc-950">
                {text.color}
              </p>

              <div className="flex flex-wrap gap-3">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => chooseColor(color.name)}
                    title={color.name}
                    className={`grid h-10 w-10 place-items-center rounded-full border transition duration-300 ${
                      selectedColor === color.name
                        ? "border-zinc-950"
                        : "border-zinc-200 hover:border-zinc-500"
                    }`}
                  >
                    <span
                      className="h-7 w-7 rounded-full border border-black/10"
                      style={{ backgroundColor: color.hex }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold text-zinc-950">
                {text.size}
              </p>

              <div className="flex flex-wrap gap-2">
                {availableSizes.map((item) => {
                  const lowStock =
                    item.stock > 0 && item.stock <= LOW_STOCK_LIMIT;

                  return (
                    <button
                      key={item.variantId}
                      type="button"
                      onClick={() => {
                        setSelectedSize(item.size);
                        setQuantity(1);
                      }}
                      className={`relative h-11 min-w-12 rounded-[12px] border px-4 text-sm font-semibold transition duration-300 ${
                        selectedSize === item.size
                          ? "border-zinc-950 bg-white text-zinc-950 ring-1 ring-zinc-950"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-500"
                      }`}
                    >
                      {lowStock && (
                        <span className="absolute -right-2 -top-2 z-10 flex h-6 min-w-6 animate-[stockPulse_1.15s_ease-in-out_infinite] items-center justify-center gap-0.5 rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-[0_0_0_4px_rgba(220,38,38,0.12)]">
                          <FiZap className="text-[10px]" />
                          {item.stock}
                        </span>
                      )}

                      {item.size}
                    </button>
                  );
                })}
              </div>

              {stock > 0 && stock <= LOW_STOCK_LIMIT && (
                <p className="mt-3 text-sm font-semibold text-red-600">
                  {text.onlyLeft.replace("{count}", stock)}
                </p>
              )}
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold text-zinc-950">
                {text.quantity}
              </p>

              <div className="inline-flex h-12 overflow-hidden rounded-[12px] border border-zinc-200 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="grid w-12 place-items-center text-zinc-950 transition hover:bg-zinc-50"
                >
                  <FiMinus />
                </button>

                <div className="grid w-14 place-items-center text-sm font-semibold">
                  {quantity}
                </div>

                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(stock || 1, q + 1))}
                  className="grid w-12 place-items-center text-zinc-950 transition hover:bg-zinc-50"
                >
                  <FiPlus />
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-[14px] bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={addBasket}
              disabled={actionLoading || !selectedVariant}
              className="mt-7 inline-flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50"
            >
              <FiShoppingBag />
              {text.addToBasket}
            </button>

            <button
              type="button"
              onClick={openWhatsapp}
              className="mt-3 inline-flex h-13 w-full items-center justify-center gap-2 rounded-[14px] bg-[#1fbd5a] text-sm font-semibold text-white transition hover:opacity-95 active:scale-[0.98]"
            >
              <FaWhatsapp className="text-xl" />
              {text.askWhatsapp}
            </button>
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="mt-10 animate-[detailsUp_.72s_cubic-bezier(.22,1,.36,1)_both]">
            <div className="relative rounded-[18px] bg-white/70 px-3 py-6 shadow-[0_18px_55px_rgba(0,0,0,0.035)] md:px-5 md:py-8">
              <div className="mb-5 text-center">
                <h2 className="text-[25px] font-semibold tracking-[-0.035em] text-zinc-950 md:text-[32px]">
                  {text.selectedForYou}
                </h2>

                <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                  {text.swipe}
                </p>
              </div>

              <button
                type="button"
                onClick={() => scrollRelated("left")}
                className="absolute -left-10 top-1/2 z-20 hidden h-[150px] w-9 -translate-y-1/2 place-items-center text-3xl font-light text-zinc-900 transition hover:-translate-x-1 md:grid"
                aria-label="left"
              >
                <FiChevronLeft />
              </button>

              <button
                type="button"
                onClick={() => scrollRelated("right")}
                className="absolute -right-10 top-1/2 z-20 hidden h-[150px] w-9 -translate-y-1/2 place-items-center text-3xl font-light text-zinc-900 transition hover:translate-x-1 md:grid"
                aria-label="right"
              >
                <FiChevronRight />
              </button>

              <div className="overflow-hidden">
                <div
                  ref={relatedRef}
                  className="flex touch-pan-x justify-start gap-3 overflow-x-auto overscroll-x-contain pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] md:gap-4 [&::-webkit-scrollbar]:hidden"
                >
                  {relatedProducts.map((item) => (
                    <div
                      key={item.id}
                      data-related-card
                      className="w-[47%] min-w-[47%] sm:w-[210px] sm:min-w-[210px] md:w-[240px] md:min-w-[240px]"
                    >
                      <ProductCard product={item} />
                    </div>
                  ))}

                  <div className="grid w-[47%] min-w-[47%] place-items-center sm:w-[210px] sm:min-w-[210px] md:w-[240px] md:min-w-[240px]">
                    <button
                      type="button"
                      onClick={() => loadRelated(product)}
                      disabled={relatedLoading}
                      className="h-14 rounded-[14px] bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60"
                    >
                      {relatedLoading ? text.loading : text.more}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[300] animate-[fadeIn_.22s_ease_both] bg-black/85 p-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="absolute right-5 top-5 z-10 grid h-11 w-11 place-items-center rounded-full bg-white text-zinc-950"
          >
            <FiX />
          </button>

          <div className="grid h-full place-items-center">
            <img
              src={images[activeImage]}
              alt={product.name}
              className="max-h-[88vh] max-w-[92vw] animate-[modalImage_.28s_cubic-bezier(.22,1,.36,1)_both] rounded-[18px] object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes detailsUp {
          from { opacity: 0; transform: translateY(22px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalImage {
          from { opacity: 0; transform: scale(.94); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes stockPulse {
          0% { box-shadow: 0 0 0 0 rgba(220,38,38,.35); transform: scale(1); }
          70% { box-shadow: 0 0 0 8px rgba(220,38,38,0); transform: scale(1.04); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); transform: scale(1); }
        }
      `}</style>
    </main>
  );
}