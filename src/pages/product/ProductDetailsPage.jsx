import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
import { createPortal } from "react-dom";
import { favoritesApi } from "../../api/favoritesApi";

const LOW_STOCK_LIMIT = 3;
const RELATED_DESKTOP_BATCH = 12;
const RELATED_PHONE_BATCH = 6;
const STORE_WHATSAPP_NUMBER = "994514349829";

function getRelatedBatchSize() {
  return window.innerWidth < 768 ? RELATED_PHONE_BATCH : RELATED_DESKTOP_BATCH;
}

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

function normalizeList(res) {
  const data = res?.data ?? res;
  const nestedData = data?.data ?? data;

  return (
    data?.items ||
    data?.products ||
    data?.result ||
    nestedData?.items ||
    nestedData?.products ||
    nestedData?.result ||
    (Array.isArray(nestedData) ? nestedData : [])
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

function getFavoriteCache() {
  try {
    return JSON.parse(
      localStorage.getItem("nemesis_favorite_products") || "[]",
    );
  } catch {
    return [];
  }
}

function setFavoriteCache(productId, value) {
  const list = getFavoriteCache();
  const next = value
    ? [...new Set([...list, productId])]
    : list.filter((x) => x !== productId);

  localStorage.setItem("nemesis_favorite_products", JSON.stringify(next));
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { text } = useLanguage();

  const relatedRef = useRef(null);
  const toastTimerRef = useRef(null);
  const toastCloseTimerRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [activeImage, setActiveImage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [favorite, setFavorite] = useState(false);
  const [basketSuccess, setBasketSuccess] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedPage, setRelatedPage] = useState(1);
  const [relatedHasMore, setRelatedHasMore] = useState(true);

  const [error, setError] = useState("");
  const [toastError, setToastError] = useState("");
  const [toastClosing, setToastClosing] = useState(false);

  const modalStartXRef = useRef(null);
  const modalStartYRef = useRef(null);
  const [modalDragX, setModalDragX] = useState(0);
  const [modalDragging, setModalDragging] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    loadPage();
  }, [id]);

  useEffect(() => {
    return () => {
      window.clearTimeout(toastTimerRef.current);
      window.clearTimeout(toastCloseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!modalOpen) return;

    const oldOverflow = document.body.style.overflow;
    const oldTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = oldOverflow;
      document.body.style.touchAction = oldTouchAction;
    };
  }, [modalOpen]);

  function hideToastAnimated() {
    setToastClosing(true);

    window.clearTimeout(toastCloseTimerRef.current);
    toastCloseTimerRef.current = window.setTimeout(() => {
      setToastError("");
      setToastClosing(false);
    }, 280);
  }

  function showToast(message) {
    window.clearTimeout(toastTimerRef.current);
    window.clearTimeout(toastCloseTimerRef.current);

    setToastClosing(false);
    setToastError(message);

    toastTimerRef.current = window.setTimeout(() => {
      hideToastAnimated();
    }, 5000);
  }

  async function loadPage() {
    try {
      setLoading(true);
      setError("");
      setToastError("");
      setToastClosing(false);
      setBasketSuccess(false);
      setModalOpen(false);
      setActiveImage(0);
      setDescriptionOpen(false);
      setRelatedProducts([]);
      setRelatedPage(1);
      setRelatedHasMore(true);

      const res = await apiFetch(`/api/Products/${id}`);
      const data = unwrap(res);

      setProduct(data);
      await loadFavoriteStatus();

      setSelectedVariantId("");
      setSelectedColor("");
      setSelectedSize("");
      setQuantity(1);

      await loadRelated(data, 1);
    } catch (err) {
      setError(err.message || text.productLoadError);
    } finally {
      setLoading(false);
    }
  }

  async function loadFavoriteStatus() {
    if (!getAccessToken()) {
      setFavorite(false);
      return;
    }

    try {
      const res = await favoritesApi.check(id);
      const result = res?.data?.data ?? res?.data ?? res;
      setFavorite(Boolean(result));
    } catch {
      setFavorite(false);
    }
  }

  async function loadFreshProduct() {
    const res = await apiFetch(`/api/Products/${id}`);
    const data = unwrap(res);
    setProduct(data);
    return data;
  }

  async function loadRelated(
    currentProduct = product,
    batchPage = relatedPage + 1,
  ) {
    if (relatedLoading) return;

    try {
      setRelatedLoading(true);

      const batchSize = getRelatedBatchSize();
      const targetCount = batchSize * batchPage;

      // Həmişə birinci səhifədən lazım olan ümumi sayı götürürük.
      // Beləliklə cari məhsul siyahıdan çıxarılanda və ya dublikat gələndə
      // hər "Daha çox" basışında dəqiq 6/12 yeni məhsul əlavə olunur.
      const res = await getProducts({
        page: 1,
        pageSize: targetCount + 2,
      });

      const sortedList = normalizeList(res)
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

      const uniqueMap = new Map();

      sortedList.forEach((item) => {
        if (item?.id) uniqueMap.set(item.id, item);
      });

      const uniqueList = [...uniqueMap.values()];

      setRelatedProducts(uniqueList.slice(0, targetCount));
      setRelatedHasMore(uniqueList.length > targetCount);
      setRelatedPage(batchPage);
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

    (product?.variants || [])
      .filter((v) => Number(v.stockCount || 0) > 0)
      .forEach((v) => {
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
      .filter((v) => {
        if (colors.length > 0 && selectedColor)
          return v.colorName === selectedColor;
        return true;
      })
      .filter((v) => Number(v.stockCount || 0) > 0)
      .map((v) => ({
        size: v.sizeValue,
        stock: Number(v.stockCount || 0),
        variantId: v.id,
        colorName: v.colorName || "",
      }))
      .filter((x) => x.size)
      .sort((a, b) => Number(a.size) - Number(b.size));
  }, [product, selectedColor, colors.length]);

  const selectedVariant = useMemo(() => {
    return (product?.variants || []).find((v) => v.id === selectedVariantId);
  }, [product, selectedVariantId]);

  const stock = Number(selectedVariant?.stockCount || 0);
  const price = Number(product?.price || 0);
  const discountPrice = Number(product?.discountPrice || 0);
  const hasDiscount = discountPrice > 0 && discountPrice < price;
  const description = product?.description || "";
  const shouldClampDescription = description.length > 155;

  function chooseColor(colorName) {
    setSelectedColor(colorName);
    setSelectedVariantId("");
    setSelectedSize("");
    setQuantity(1);
    setToastError("");
    setToastClosing(false);
  }

  function chooseSize(item) {
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(item.colorName || "");
    }

    setSelectedVariantId(item.variantId);
    setSelectedSize(item.size);
    setQuantity(1);
    setToastError("");
    setToastClosing(false);
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

  function handleBack() {
    if (location.state?.fromSearch) {
      navigate(-1);
      return;
    }

    navigate("/");
  }

  function modalPrev() {
    setActiveImage((prev) => (prev <= 0 ? images.length - 1 : prev - 1));
  }

  function modalNext() {
    setActiveImage((prev) => (prev >= images.length - 1 ? 0 : prev + 1));
  }

  async function toggleFavorite() {
    if (!getAccessToken()) {
      navigate("/login");
      return;
    }

    if (!id) return;

    try {
      setActionLoading(true);

      if (favorite) {
        await favoritesApi.remove(id);
        setFavorite(false);
        setFavoriteCache(id, false);
      } else {
        await favoritesApi.add(id);
        setFavorite(true);
        setFavoriteCache(id, true);
      }

      window.dispatchEvent(new Event("nemesis_auth_changed"));
    } finally {
      setActionLoading(false);
    }
  }

  async function addBasket() {
    if (!getAccessToken()) {
      navigate("/login");
      return;
    }

    if (colors.length > 0 && !selectedColor && !selectedVariantId) {
      showToast(text.selectColorSizeError || "Rəng və razmer seçilməlidir.");
      return;
    }

    if (colors.length > 0 && !selectedColor) {
      showToast(text.selectColorError || "Rəng seçilməlidir.");
      return;
    }

    if (!selectedVariantId) {
      showToast(text.selectSizeError || "Razmer seçilməlidir.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setToastError("");
      setToastClosing(false);

      const freshProduct = await loadFreshProduct();

      const freshVariant = (freshProduct?.variants || []).find(
        (v) =>
          v.id === selectedVariantId &&
          Number(v.stockCount || 0) > 0 &&
          (!selectedColor || v.colorName === selectedColor),
      );

      if (!freshVariant?.id) {
        showToast(
          text.variantUnavailable || "Seçilən variant artıq mövcud deyil.",
        );
        return;
      }

      await apiFetch("/api/Basket", {
        method: "POST",
        body: JSON.stringify({
          productId: freshProduct.id,
          productVariantId: freshVariant.id,
          quantity: Math.max(1, quantity),
        }),
      });

      setBasketSuccess(true);
      window.dispatchEvent(new Event("nemesis_auth_changed"));

      window.setTimeout(() => {
        setBasketSuccess(false);
      }, 3000);
    } catch (err) {
      showToast(err.message || text.basketAddError);
    } finally {
      setActionLoading(false);
    }
  }

  function buildWhatsappFallback() {
    const message = `Salam, bu məhsul haqqında məlumat almaq istəyirəm:\n${
      product?.name || ""
    }\nKod: ${product?.productCode || ""}\nLink: https://nemesisbaku.az/products/${id}`;

    return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
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

      const validUrl =
        typeof url === "string" &&
        url.startsWith("http") &&
        !url.includes("/string") &&
        !url.includes("not_found=1");

      window.open(
        validUrl ? url : buildWhatsappFallback(),
        "_blank",
        "noopener,noreferrer",
      );
    } catch {
      window.open(buildWhatsappFallback(), "_blank", "noopener,noreferrer");
    }
  }

  function handleModalPointerDown(e) {
    modalStartXRef.current = e.clientX;
    modalStartYRef.current = e.clientY;
    setModalDragging(true);
    setModalDragX(0);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handleModalPointerMove(e) {
    if (!modalDragging || modalStartXRef.current === null) return;

    const diffX = e.clientX - modalStartXRef.current;
    const diffY = e.clientY - modalStartYRef.current;

    if (Math.abs(diffY) > Math.abs(diffX)) return;

    e.preventDefault();
    setModalDragX(Math.max(-120, Math.min(120, diffX)));
  }

  function handleModalPointerUp(e) {
    if (!modalDragging) return;

    const diffX = e.clientX - modalStartXRef.current;

    if (Math.abs(diffX) > 55) {
      if (diffX < 0) modalNext();
      if (diffX > 0) modalPrev();
    }

    modalStartXRef.current = null;
    modalStartYRef.current = null;
    setModalDragging(false);
    setModalDragX(0);
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100dvh-72px)] bg-[#fafafa]">
        <AppLoader text={text.loading} />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#fafafa] px-5 py-10 text-center">
        <p className="font-medium text-zinc-500">
          {error || text.productNotFound}
        </p>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[#fafafa] px-5 py-7 md:px-8 md:py-10">
        <div className="mx-auto max-w-[1180px]">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back"
            className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 hover:text-black active:scale-95"
          >
            <FiChevronLeft className="text-[24px]" />
          </button>
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
                          ? "border-zinc-950 opacity-100"
                          : "border-zinc-100 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  onMouseMove={handleZoomMove}
                  onMouseEnter={() => setZoom((p) => ({ ...p, active: true }))}
                  onMouseLeave={() => setZoom((p) => ({ ...p, active: false }))}
                  className="relative order-1 aspect-[4/4.75] max-h-[620px] w-full overflow-hidden rounded-[18px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.045)] md:order-2"
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
                      nemesisbaku
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div className="animate-[detailsUp_.62s_cubic-bezier(.22,1,.36,1)_both] rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-[30px] font-medium leading-[1.08] tracking-[-0.035em] text-zinc-950 md:text-[40px]">
                  {product.name}
                </h1>

                <button
                  type="button"
                  onClick={toggleFavorite}
                  disabled={actionLoading}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-zinc-50 text-xl text-zinc-950 transition duration-300 hover:bg-zinc-100 hover:scale-105 active:scale-95"
                >
                  {favorite ? (
                    <FaHeart className="text-red-600" />
                  ) : (
                    <FiHeart />
                  )}
                </button>
              </div>

              {description && (
                <div className="mt-4">
                  {!descriptionOpen ? (
                    <div
                      className={`relative overflow-hidden ${
                        shouldClampDescription ? "max-h-[84px]" : ""
                      }`}
                    >
                      <p className="text-[15px] font-normal leading-7 text-zinc-500">
                        {description}
                      </p>

                      {shouldClampDescription && (
                        <div className="absolute bottom-0 right-0 flex h-7 w-[42%] items-center justify-end bg-gradient-to-l from-white via-white/95 to-transparent">
                          <button
                            type="button"
                            onClick={() => setDescriptionOpen(true)}
                            className="bg-white pl-2 text-[15px] font-medium text-zinc-950"
                          >
                            {text.showMore || "Daha çox"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-[15px] font-normal leading-7 text-zinc-500">
                        {description}
                      </p>

                      <button
                        type="button"
                        onClick={() => setDescriptionOpen(false)}
                        className="mt-1 text-[15px] font-medium text-zinc-950"
                      >
                        {text.showLess || "Daha az"}
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="mt-5 flex items-end gap-3">
                <p
                  className={`text-[30px] font-medium ${
                    hasDiscount ? "text-red-600" : "text-zinc-950"
                  }`}
                >
                  {hasDiscount ? discountPrice : price} ₼
                </p>

                {hasDiscount && (
                  <p className="pb-1 text-base font-normal text-zinc-400 line-through">
                    {price} ₼
                  </p>
                )}
              </div>

              {colors.length > 0 && (
                <div className="mt-6">
                  <div className="flex min-h-[44px] flex-wrap items-center gap-2">
                    {colors.map((color) => {
                      const active = selectedColor === color.name;

                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => chooseColor(color.name)}
                          title={color.name}
                          className="grid h-11 w-11 place-items-center rounded-full transition"
                        >
                          <span
                            className={`rounded-full border border-black/10 transition-all duration-300 ${
                              active
                                ? "h-[33px] w-[33px] shadow-[0_0_0_4px_rgba(0,0,0,0.06)]"
                                : "h-7 w-7 hover:scale-105"
                            }`}
                            style={{ backgroundColor: color.hex }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <div className="flex min-h-[52px] flex-wrap items-center gap-2">
                  {availableSizes.map((item) => {
                    const active = selectedVariantId === item.variantId;
                    const lowStock =
                      item.stock > 0 && item.stock <= LOW_STOCK_LIMIT;

                    return (
                      <button
                        key={item.variantId}
                        type="button"
                        onClick={() => chooseSize(item)}
                        className={`relative h-12 min-w-12 rounded-[12px] border px-4 text-sm transition-all duration-300 ${
                          active
                            ? "border-zinc-950 bg-white font-semibold text-zinc-950 shadow-[0_0_0_1px_rgba(9,9,11,1)]"
                            : "border-zinc-200 bg-white font-normal text-zinc-700 hover:border-zinc-500"
                        }`}
                      >
                        {lowStock && (
                          <span className="absolute -right-2 -top-2 z-10 flex h-6 min-w-6 animate-[stockPulse_1.15s_ease-in-out_infinite] items-center justify-center gap-0.5 rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-[0_0_0_4px_rgba(220,38,38,0.12)]">
                            <FiZap className="fill-white text-[10px]" />
                            {item.stock}
                          </span>
                        )}

                        {item.size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <div className="inline-flex h-12 overflow-hidden rounded-[12px] border border-zinc-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="grid w-12 place-items-center text-zinc-950 transition hover:bg-zinc-50 active:scale-95"
                  >
                    <FiMinus />
                  </button>

                  <div className="grid w-14 place-items-center text-sm font-medium">
                    {quantity}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.min(stock || 99, q + 1))
                    }
                    className="grid w-12 place-items-center text-zinc-950 transition hover:bg-zinc-50 active:scale-95"
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={addBasket}
                disabled={actionLoading}
                className={`group relative mt-7 inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-[14px] text-sm font-medium text-white transition duration-300 active:scale-[0.98] disabled:opacity-50 ${
                  basketSuccess
                    ? "bg-emerald-600"
                    : "bg-zinc-950 hover:bg-zinc-800"
                }`}
              >
                <span
                  className={`absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-zinc-950 transition-all duration-500 ${
                    basketSuccess
                      ? "scale-[9] opacity-100"
                      : "scale-0 opacity-0"
                  }`}
                />

                <span
                  className={`relative z-10 flex items-center gap-2 transition-all duration-500 ${
                    basketSuccess ? "scale-105 text-zinc-950" : "text-white"
                  }`}
                >
                  {basketSuccess ? (
                    <>
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-zinc-950 text-white">
                        ✓
                      </span>
                      {text.addedToBasket}
                    </>
                  ) : (
                    <>
                      <FiShoppingBag />
                      {text.addToBasket}
                    </>
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={openWhatsapp}
                className="mt-3 inline-flex h-13 w-full items-center justify-center gap-2 rounded-[14px] bg-[#1fbd5a] text-sm font-medium text-white transition duration-300 hover:opacity-95 active:scale-[0.98]"
              >
                <FaWhatsapp className="text-xl" />
                {text.askWhatsapp}
              </button>
            </div>
          </section>

          {relatedProducts.length > 0 && (
            <section className="mt-10 animate-[detailsUp_.72s_cubic-bezier(.22,1,.36,1)_both]">
              <div className="relative px-0 py-6 md:px-5 md:py-8">
                <div className="mb-5 text-center">
                  <h2 className="text-[25px] font-medium tracking-[-0.035em] text-zinc-950 md:text-[32px]">
                    {text.selectedForYou}
                  </h2>

                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                    {text.swipe}
                  </p>
                </div>

                <div className="overflow-hidden">
                  <div
                    ref={relatedRef}
                    className="flex justify-start gap-3 overflow-x-auto pb-3 scroll-smooth md:gap-4"
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

                    {relatedHasMore && (
                      <div className="grid w-[47%] min-w-[47%] place-items-center sm:w-[210px] sm:min-w-[210px] md:w-[240px] md:min-w-[240px]">
                        <button
                          type="button"
                          onClick={() => loadRelated(product, relatedPage + 1)}
                          disabled={relatedLoading}
                          className="h-14 rounded-[14px] bg-zinc-950 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60"
                        >
                          {relatedLoading ? text.loading : text.more}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {toastError &&
        createPortal(
          <div
            className={`fixed bottom-5 left-5 z-[999999] w-[calc(100vw-40px)] max-w-[380px] rounded-[14px] bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-[0_16px_50px_rgba(220,38,38,0.28)] md:bottom-6 md:left-6 md:w-auto md:min-w-[300px] ${
              toastClosing
                ? "animate-[toastOut_.28s_cubic-bezier(.22,1,.36,1)_both]"
                : "animate-[toastIn_.32s_cubic-bezier(.22,1,.36,1)_both]"
            }`}
          >
            {toastError}
          </div>,
          document.body,
        )}

      {modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex h-dvh w-screen touch-none items-center justify-center overflow-hidden bg-black/95 p-2 md:p-8">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="fixed right-4 top-4 z-[100002] text-[34px] text-white transition hover:scale-110 active:scale-95 md:right-7 md:top-7"
            >
              <FiX />
            </button>

            <img
              key={images[activeImage]}
              src={images[activeImage]}
              alt={product.name}
              draggable="false"
              onPointerDown={handleModalPointerDown}
              onPointerMove={handleModalPointerMove}
              onPointerUp={handleModalPointerUp}
              onPointerCancel={() => {
                setModalDragging(false);
                setModalDragX(0);
              }}
              className="block max-h-[98dvh] max-w-[98vw] select-none animate-[modalImage_.28s_cubic-bezier(.22,1,.36,1)_both] rounded-[14px] object-contain"
              style={{
                transform: `translateX(${modalDragX}px)`,
                transition: modalDragging ? "none" : "transform 260ms ease-out",
                touchAction: "none",
              }}
            />
          </div>,
          document.body,
        )}

      <style>{`
        @keyframes detailsUp {
          from { opacity: 0; transform: translateY(22px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes modalImage {
          from { opacity: 0; transform: scale(.94); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-18px) translateY(18px) scale(.96); }
          to { opacity: 1; transform: translateX(0) translateY(0) scale(1); }
        }

        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0) translateY(0) scale(1); }
          to { opacity: 0; transform: translateX(-18px) translateY(18px) scale(.96); }
        }

        @keyframes stockPulse {
          0% { box-shadow: 0 0 0 0 rgba(220,38,38,.35); transform: scale(1); }
          70% { box-shadow: 0 0 0 8px rgba(220,38,38,0); transform: scale(1.04); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); transform: scale(1); }
        }
      `}</style>
    </>
  );
}