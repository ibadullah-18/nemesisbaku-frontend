import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiAward,
  FiArrowUpRight,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiMaximize2,
  FiMinus,
  FiPlus,
  FiRefreshCcw,
  FiShoppingBag,
  FiTruck,
  FiX,
  FiZap,
} from "react-icons/fi";
import { FaHeart, FaWhatsapp } from "react-icons/fa";
import ProductDetailsSkeleton from "../../components/product/ProductDetailsSkeleton";
import ProductCard from "../../components/product/ProductCard";
import { apiFetch, getAccessToken } from "../../api/apiFetch";
import { getProducts, getStoreInfo } from "../../api/homeApi";
import { useLanguage } from "../../i18n/LanguageContext";
import { createPortal } from "react-dom";
import { favoritesApi } from "../../api/favoritesApi";
import { showUserToast } from "../../utils/userToast";
import "./productDetails.css";

const LOW_STOCK_LIMIT = 3;
const RELATED_DESKTOP_BATCH = 12;
const RELATED_PHONE_BATCH = 6;
const STORE_WHATSAPP_NUMBER = "994514349829";

const PRODUCT_SERVICE_TEXT = {
  az: {
    qualityTitle: "Məhsul keyfiyyəti",
    qualityBody:
      "Məhsul keyfiyyəti və nemesisbaku yanaşması haqqında ətraflı məlumat.",
    deliveryTitle: "Çatdırılma şərtləri",
    deliveryBaku: "Bakı daxilində 24 saat",
    deliveryNearby: "Abşeron və Sumqayıta 48–72 saat",
    deliveryRegions: "Bölgələrə 3–5 iş günü",
    returnTitle: "Geri qaytarma qaydaları",
    returnBody:
      "İstifadə olunmamış, təmiz və qutusu zədələnməmiş məhsulu 14 təqvim günü ərzində qaytara və ya dəyişə bilərsiniz.",
  },
  en: {
    qualityTitle: "Product quality",
    qualityBody:
      "Learn more about product quality and the nemesisbaku approach.",
    deliveryTitle: "Delivery terms",
    deliveryBaku: "Delivery within Baku in 24 hours",
    deliveryNearby: "Absheron and Sumgait in 48–72 hours",
    deliveryRegions: "Regions in 3–5 business days",
    returnTitle: "Return policy",
    returnBody:
      "Unused and clean products with an undamaged original box can be returned or exchanged within 14 calendar days.",
  },
  ru: {
    qualityTitle: "Качество товара",
    qualityBody: "Подробнее о качестве товаров и подходе nemesisbaku.",
    deliveryTitle: "Условия доставки",
    deliveryBaku: "Доставка по Баку в течение 24 часов",
    deliveryNearby: "Абшерон и Сумгаит — 48–72 часа",
    deliveryRegions: "Регионы — 3–5 рабочих дней",
    returnTitle: "Правила возврата",
    returnBody:
      "Неиспользованный чистый товар в неповреждённой оригинальной коробке можно вернуть или обменять в течение 14 календарных дней.",
  },
};

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
  const { text, lang } = useLanguage();

  const relatedRef = useRef(null);
  const galleryStageRef = useRef(null);
  const basketSuccessTimerRef = useRef(null);
  const galleryFrameRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [activeImage, setActiveImage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });

  const [selectedColor, setSelectedColor] = useState("");
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

  const modalStartXRef = useRef(null);
  const modalStartYRef = useRef(null);
  const [modalDragX, setModalDragX] = useState(0);
  const [modalDragging, setModalDragging] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    loadPage();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      window.clearTimeout(basketSuccessTimerRef.current);
      window.cancelAnimationFrame(galleryFrameRef.current);
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

  function showToast(message) {
    showUserToast(message, "error");
  }

  async function loadPage() {
    try {
      setLoading(true);
      setError("");
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
      void loadFavoriteStatus();
      void loadStoreDetails();

      setSelectedVariantId("");
      setSelectedColor("");
      setQuantity(1);

      void loadRelated(data, 1);
    } catch (err) {
      setError(err.message || text.productLoadError);
    } finally {
      setLoading(false);
    }
  }

  async function loadStoreDetails() {
    try {
      const res = await getStoreInfo();
      setStoreInfo(unwrap(res));
    } catch {
      setStoreInfo(null);
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
  const discountPercent = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;
  const description = String(product?.description || "").replace(
    /\r\n?/g,
    "\n",
  );
  const descriptionLineCount = description.split("\n").length;
  const shouldClampDescription =
    description.length > 155 || descriptionLineCount > 3;
  const serviceText = PRODUCT_SERVICE_TEXT[lang] || PRODUCT_SERVICE_TEXT.az;
  const deliverySummary = [
    storeInfo?.deliveryBakuText || serviceText.deliveryBaku,
    storeInfo?.deliveryAbsheronSumgaitText || serviceText.deliveryNearby,
    storeInfo?.deliveryRegionsText || serviceText.deliveryRegions,
  ]
    .filter(Boolean)
    .join(" · ");
  const returnSummary =
    storeInfo?.returnPolicyContent || serviceText.returnBody;
  const qualitySummary = storeInfo?.aboutContent || serviceText.qualityBody;

  function chooseColor(colorName) {
    setSelectedColor(colorName);
    setSelectedVariantId("");
    setQuantity(1);
  }

  function chooseSize(item) {
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(item.colorName || "");
    }

    setSelectedVariantId(item.variantId);
    setQuantity(1);
  }

  function handleZoomMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    window.cancelAnimationFrame(galleryFrameRef.current);
    galleryFrameRef.current = window.requestAnimationFrame(() => {
      setZoom({ active: true, x, y });

      const stage = galleryStageRef.current;
      if (!stage) return;

      stage.style.setProperty("--gallery-rx", `${(50 - y) * 0.055}deg`);
      stage.style.setProperty("--gallery-ry", `${(x - 50) * 0.065}deg`);
      stage.style.setProperty("--gallery-light-x", `${x}%`);
      stage.style.setProperty("--gallery-light-y", `${y}%`);
    });
  }

  function resetGalleryMotion() {
    setZoom((current) => ({ ...current, active: false }));

    const stage = galleryStageRef.current;
    if (!stage) return;

    stage.style.setProperty("--gallery-rx", "0deg");
    stage.style.setProperty("--gallery-ry", "0deg");
    stage.style.setProperty("--gallery-light-x", "50%");
    stage.style.setProperty("--gallery-light-y", "42%");
  }

  function handleBack() {
    const returnTo = location.state?.returnTo;
    const cameFromWebsite =
      location.state?.fromProductList ||
      location.state?.fromHome ||
      location.state?.fromSearch;

    if (cameFromWebsite) {
      navigate(-1);
      return;
    }

    navigate(returnTo || "/", { replace: true });
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

      window.dispatchEvent(
        new CustomEvent("favorite_changed", {
          detail: { productId: id, isFavorite: !favorite },
        }),
      );
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

      window.clearTimeout(basketSuccessTimerRef.current);
      basketSuccessTimerRef.current = window.setTimeout(() => {
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
    return <ProductDetailsSkeleton onBack={handleBack} />;
  }

  if (!product) {
    return (
      <main className="nb-product-detail-page grid min-h-[60vh] place-items-center px-5 py-10 text-center">
        <p className="font-medium text-zinc-500">
          {error || text.productNotFound}
        </p>
      </main>
    );
  }

  return (
    <>
      <main className="nb-product-detail-page min-h-screen px-4 py-5 sm:px-6 md:px-8 md:py-8">
        <div className="nb-product-detail mx-auto max-w-[1320px]">
          <header className="nb-product-detail__nav">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Geri"
              className="nb-product-detail__back"
            >
              <FiChevronLeft />
            </button>

            <div className="nb-product-detail__crumbs" aria-label="Məhsul yolu">
              <span>nemesisbaku</span>
              <i />
              <strong>
                {product.categoryName || product.brandName || product.name}
              </strong>
            </div>
          </header>

          <section className="nb-product-detail__layout">
            <div className="nb-product-gallery">
              <div ref={galleryStageRef} className="nb-product-gallery__stage">
                <span className="nb-product-gallery__orb nb-product-gallery__orb--one" />
                <span className="nb-product-gallery__orb nb-product-gallery__orb--two" />
                <span className="nb-product-gallery__word" aria-hidden="true">
                  nemesisbaku
                </span>

                {hasDiscount && (
                  <span className="nb-product-gallery__sale">
                    −{discountPercent}%
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => images.length && setModalOpen(true)}
                  onMouseMove={handleZoomMove}
                  onMouseEnter={() =>
                    setZoom((current) => ({ ...current, active: true }))
                  }
                  onMouseLeave={resetGalleryMotion}
                  className="nb-product-gallery__image-button"
                  aria-label="Şəkli böyüt"
                >
                  {images[activeImage] ? (
                    <img
                      key={images[activeImage]}
                      src={images[activeImage]}
                      alt={product.name}
                      className="nb-product-gallery__image"
                      style={{
                        transform: zoom.active ? "scale(1.34)" : "scale(1)",
                        transformOrigin: `${zoom.x}% ${zoom.y}%`,
                      }}
                    />
                  ) : (
                    <span className="nb-product-gallery__empty">
                      nemesisbaku
                    </span>
                  )}
                </button>

                <div className="nb-product-gallery__foot">
                  <span>
                    {String(activeImage + 1).padStart(2, "0")} /{" "}
                    {String(Math.max(images.length, 1)).padStart(2, "0")}
                  </span>
                  {images.length > 0 && (
                    <button type="button" onClick={() => setModalOpen(true)}>
                      <FiMaximize2 />
                      <span>Yaxından bax</span>
                    </button>
                  )}
                </div>
              </div>

              {images.length > 1 && (
                <div
                  className="nb-product-gallery__thumbs"
                  aria-label="Məhsul şəkilləri"
                >
                  {images.map((img, index) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => {
                        setActiveImage(index);
                        resetGalleryMotion();
                      }}
                      className={activeImage === index ? "is-active" : ""}
                      aria-label={`${index + 1}-ci şəkil`}
                    >
                      <img src={img} alt="" />
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <aside className="nb-product-info">
              <div className="nb-product-info__topline">
                <div>
                  <p>{product.brandName || "nemesisbaku"}</p>
                  {product.productCode && <span>#{product.productCode}</span>}
                </div>

                <button
                  type="button"
                  onClick={toggleFavorite}
                  disabled={actionLoading}
                  className={`nb-product-info__favorite ${favorite ? "is-active" : ""}`}
                  aria-label={
                    favorite ? "Seçilmişlərdən çıxar" : "Seçilmişlərə əlavə et"
                  }
                >
                  {favorite ? <FaHeart /> : <FiHeart />}
                </button>
              </div>

              <h1>{product.name}</h1>

              <div className="nb-product-info__price">
                <strong>{hasDiscount ? discountPrice : price} ₼</strong>
                {hasDiscount && (
                  <>
                    <del>{price} ₼</del>
                    <span>−{discountPercent}%</span>
                  </>
                )}
              </div>

              {description && (
                <div className="nb-product-info__description">
                  <div
                    className={
                      !descriptionOpen && shouldClampDescription
                        ? "is-clamped"
                        : ""
                    }
                  >
                    {description}
                  </div>

                  {shouldClampDescription && (
                    <button
                      type="button"
                      onClick={() => setDescriptionOpen((current) => !current)}
                    >
                      {descriptionOpen
                        ? text.showLess || "Daha az"
                        : text.showMore || "Daha çox"}
                    </button>
                  )}
                </div>
              )}

              <div className="nb-product-info__rule" />

              {colors.length > 0 && (
                <div className="nb-product-option">
                  <div className="nb-product-option__head">
                    <span>{text.color || "Rəng"}</span>
                    <strong>{selectedColor || "—"}</strong>
                  </div>

                  <div className="nb-product-colors">
                    {colors.map((color) => {
                      const active = selectedColor === color.name;

                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => chooseColor(color.name)}
                          title={color.name}
                          className={active ? "is-active" : ""}
                          aria-label={color.name}
                        >
                          <span style={{ backgroundColor: color.hex }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="nb-product-option">
                <div className="nb-product-option__head">
                  <span>{text.size || "Ölçü"}</span>
                  {selectedVariant && (
                    <strong>
                      {selectedVariant.sizeValue} · {stock} ədəd
                    </strong>
                  )}
                </div>

                <div className="nb-product-sizes">
                  {availableSizes.map((item) => {
                    const active = selectedVariantId === item.variantId;
                    const lowStock =
                      item.stock > 0 && item.stock <= LOW_STOCK_LIMIT;

                    return (
                      <button
                        key={item.variantId}
                        type="button"
                        onClick={() => chooseSize(item)}
                        className={active ? "is-active" : ""}
                      >
                        {item.size}
                        {lowStock && (
                          <small>
                            <FiZap /> {item.stock}
                          </small>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={openWhatsapp}
                className="nb-product-whatsapp"
              >
                <span>
                  <FaWhatsapp />
                  {text.askWhatsapp}
                </span>
                <FiArrowUpRight />
              </button>

              <div className="nb-product-info__signature">
                <span>nemesisbaku</span>
                <i />
                <small>
                  {product.categoryName || product.brandName || "nemesisbaku"}
                </small>
              </div>
            </aside>
          </section>

          <section
            className="nb-product-assurances"
            aria-label="Məhsul məlumatları"
          >
            <button type="button" onClick={() => navigate("/about")}>
              <span className="nb-product-assurances__number">01</span>
              <span className="nb-product-assurances__icon">
                <FiAward />
              </span>
              <span className="nb-product-assurances__copy">
                <strong>{serviceText.qualityTitle}</strong>
                <small>{qualitySummary}</small>
              </span>
              <FiArrowUpRight className="nb-product-assurances__arrow" />
            </button>

            <button type="button" onClick={() => navigate("/delivery")}>
              <span className="nb-product-assurances__number">02</span>
              <span className="nb-product-assurances__icon">
                <FiTruck />
              </span>
              <span className="nb-product-assurances__copy">
                <strong>{serviceText.deliveryTitle}</strong>
                <small>{deliverySummary}</small>
              </span>
              <FiArrowUpRight className="nb-product-assurances__arrow" />
            </button>

            <button type="button" onClick={() => navigate("/return-policy")}>
              <span className="nb-product-assurances__number">03</span>
              <span className="nb-product-assurances__icon">
                <FiRefreshCcw />
              </span>
              <span className="nb-product-assurances__copy">
                <strong>{serviceText.returnTitle}</strong>
                <small>{returnSummary}</small>
              </span>
              <FiArrowUpRight className="nb-product-assurances__arrow" />
            </button>
          </section>

          {createPortal(
            <div className="nb-product-buy-dock">
              <div
                className="nb-product-quantity"
                aria-label={text.quantity || "Say"}
              >
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                  aria-label="Azalt"
                >
                  <FiMinus />
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) => Math.min(stock || 99, current + 1))
                  }
                  aria-label="Artır"
                >
                  <FiPlus />
                </button>
              </div>

              <button
                type="button"
                onClick={addBasket}
                disabled={actionLoading}
                className={`nb-product-add ${basketSuccess ? "is-success" : ""}`}
              >
                <span>
                  {basketSuccess ? "✓" : <FiShoppingBag />}
                  {basketSuccess ? text.addedToBasket : text.addToBasket}
                </span>
                {!basketSuccess && <FiArrowUpRight />}
              </button>
            </div>,
            document.body,
          )}

          {relatedProducts.length > 0 && (
            <section className="nb-product-related">
              <div className="nb-product-related__head">
                <div>
                  <span>nemesisbaku</span>
                  <h2>{text.selectedForYou}</h2>
                </div>
                <p>{text.swipe}</p>
              </div>

              <div ref={relatedRef} className="nb-product-related__track">
                {relatedProducts.map((item) => (
                  <div
                    key={item.id}
                    data-related-card
                    className="nb-product-related__card"
                  >
                    <ProductCard product={item} />
                  </div>
                ))}

                {relatedHasMore && (
                  <div className="nb-product-related__more-wrap">
                    <button
                      type="button"
                      onClick={() => loadRelated(product, relatedPage + 1)}
                      disabled={relatedLoading}
                    >
                      {relatedLoading ? text.loading : text.more}
                      <FiArrowUpRight />
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {modalOpen &&
        createPortal(
          <div className="nb-product-modal">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="nb-product-modal__close"
              aria-label="Bağla"
            >
              <FiX />
            </button>

            {images.length > 1 && (
              <button
                type="button"
                onClick={modalPrev}
                className="nb-product-modal__arrow nb-product-modal__arrow--prev"
                aria-label="Əvvəlki şəkil"
              >
                <FiChevronLeft />
              </button>
            )}

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
              className="nb-product-modal__image"
              style={{
                transform: `translateX(${modalDragX}px)`,
                transition: modalDragging ? "none" : "transform 260ms ease-out",
                touchAction: "none",
              }}
            />

            {images.length > 1 && (
              <button
                type="button"
                onClick={modalNext}
                className="nb-product-modal__arrow nb-product-modal__arrow--next"
                aria-label="Növbəti şəkil"
              >
                <FiChevronRight />
              </button>
            )}

            <div className="nb-product-modal__counter">
              {activeImage + 1} / {images.length}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
