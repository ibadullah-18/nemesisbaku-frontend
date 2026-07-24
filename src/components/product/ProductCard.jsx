import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { apiFetch, getAccessToken } from "../../api/apiFetch";
import { favoritesApi } from "../../api/favoritesApi";

const RESET_IMAGE_DELAY = 5000;
const HIDE_SIZES_DELAY = 2600;
const SWIPE_LIMIT = 45;
const RUBBER_LIMIT = 42;

function unwrapData(res) {
  return res?.data?.data || res?.data || res;
}

function getImageUrl(x) {
  if (!x) return null;
  if (typeof x === "string") return x;

  return (
    x.imageUrl ||
    x.mainImageUrl ||
    x.url ||
    x.fileUrl ||
    x.path ||
    x.secureUrl ||
    x.src ||
    null
  );
}

function getVariantSizeValue(variant) {
  if (!variant) return null;

  return (
    variant.sizeValue ||
    variant.sizeName ||
    variant.size?.value ||
    variant.size?.name ||
    (typeof variant.size === "string" || typeof variant.size === "number"
      ? variant.size
      : null)
  );
}

function getNumericSize(value) {
  const text = String(value ?? "")
    .trim()
    .replace(",", ".");
  const match = text.match(/\d+(?:\.\d+)?/);
  const number = match ? Number(match[0]) : Number.POSITIVE_INFINITY;

  return Number.isFinite(number) ? number : Number.POSITIVE_INFINITY;
}

function sortSizesAscending(values) {
  return [...values].sort((a, b) => {
    const aValue = getNumericSize(a);
    const bValue = getNumericSize(b);

    if (aValue !== bValue) return aValue - bValue;

    return String(a).localeCompare(String(b), "az", {
      numeric: true,
      sensitivity: "base",
    });
  });
}

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const cardRef = useRef(null);
  const resetTimerRef = useRef(null);
  const hideSizesTimerRef = useRef(null);
  const pointerStartXRef = useRef(null);
  const pointerStartYRef = useRef(null);
  const detailLoadedRef = useRef(false);

  const [detailProduct, setDetailProduct] = useState(null);

  const [activeImage, setActiveImage] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [didSwipe, setDidSwipe] = useState(false);

  const [showSizes, setShowSizes] = useState(false);
  const [favorite, setFavorite] = useState(Boolean(product?.isFavorite));
  const [actionLoading, setActionLoading] = useState(false);

  const productId = product?.id;
  const mergedProduct = detailProduct || product;

  const images = useMemo(() => {
    const rawImages = mergedProduct?.images || [];
    const list = rawImages.map(getImageUrl).filter(Boolean);

    if (
      mergedProduct?.mainImageUrl &&
      !list.includes(mergedProduct.mainImageUrl)
    ) {
      list.unshift(mergedProduct.mainImageUrl);
    }

    if (mergedProduct?.imageUrl && !list.includes(mergedProduct.imageUrl)) {
      list.unshift(mergedProduct.imageUrl);
    }

    return [...new Set(list)];
  }, [mergedProduct]);

  const visibleDotIndexes = useMemo(() => {
    const maximumDots = 6;

    if (images.length <= maximumDots) {
      return images.map((_, index) => index);
    }

    const start = Math.min(
      Math.max(activeImage - 2, 0),
      images.length - maximumDots,
    );

    return Array.from(
      { length: maximumDots },
      (_, index) => start + index,
    );
  }, [activeImage, images]);

  const sizes = useMemo(() => {
    const variants = mergedProduct?.variants || [];

    const result = variants
      .filter((x) => Number(x.stockCount ?? x.stock ?? 0) > 0)
      .map(getVariantSizeValue)
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map(String);

    return sortSizesAscending(new Set(result));
  }, [mergedProduct]);

  const price = Number(mergedProduct?.price || 0);
  const discountPrice = Number(mergedProduct?.discountPrice || 0);
  const hasDiscount = discountPrice > 0 && discountPrice < price;

  const discountPercent = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  useEffect(() => {
    return () => {
      window.clearTimeout(resetTimerRef.current);
      window.clearTimeout(hideSizesTimerRef.current);
    };
  }, []);

  useEffect(() => {
    async function checkFavoriteStatus() {
      if (!productId || !getAccessToken()) {
        setFavorite(Boolean(product?.isFavorite));
        return;
      }

      try {
        const res = await favoritesApi.check(productId);
        const result = res?.data?.data ?? res?.data ?? res;

        setFavorite(Boolean(result));
      } catch {
        setFavorite(Boolean(product?.isFavorite));
      }
    }

    checkFavoriteStatus();

    function syncFavorite(e) {
      if (e.detail?.productId !== productId) return;
      setFavorite(Boolean(e.detail?.isFavorite));
    }

    window.addEventListener("favorite_changed", syncFavorite);

    return () => {
      window.removeEventListener("favorite_changed", syncFavorite);
    };
  }, [productId, product?.isFavorite]);

  const loadDetailOnce = useCallback(async () => {
    if (detailLoadedRef.current || !productId) return;

    try {
      detailLoadedRef.current = true;

      const res = await apiFetch(`/api/Products/${productId}`);
      setDetailProduct(unwrapData(res));
    } catch {
      detailLoadedRef.current = false;
    }
  }, [productId]);

  useEffect(() => {
    const card = cardRef.current;

    if (!card || !productId) return undefined;

    if (!("IntersectionObserver" in window)) {
      loadDetailOnce();
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        loadDetailOnce();
        observer.disconnect();
      },
      {
        rootMargin: "240px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(card);

    return () => observer.disconnect();
  }, [loadDetailOnce, productId]);

  useEffect(() => {
    if (activeImage < images.length) return;

    setActiveImage(0);
    setDragX(0);
  }, [activeImage, images.length]);

  function startResetTimer(nextIndex) {
    window.clearTimeout(resetTimerRef.current);

    if (nextIndex === 0) return;

    resetTimerRef.current = window.setTimeout(() => {
      setActiveImage(0);
      setDragX(0);
    }, RESET_IMAGE_DELAY);
  }

  function showSizesNow() {
    window.clearTimeout(hideSizesTimerRef.current);
    setShowSizes(true);
    loadDetailOnce();
  }

  function hideSizesLater() {
    window.clearTimeout(hideSizesTimerRef.current);

    hideSizesTimerRef.current = window.setTimeout(() => {
      setShowSizes(false);
    }, HIDE_SIZES_DELAY);
  }

  function hideSizesNow() {
    window.clearTimeout(hideSizesTimerRef.current);
    setShowSizes(false);
  }

  function changeImage(direction) {
    if (images.length <= 1) return;

    setShowSizes(false);

    setActiveImage((prev) => {
      let next = prev;

      if (direction === "next") {
        next = (prev + 1) % images.length;
      } else {
        next = (prev - 1 + images.length) % images.length;
      }

      startResetTimer(next);
      return next;
    });
  }

  function goToImage(index) {
    if (index < 0 || index >= images.length || index === activeImage) return;

    setShowSizes(false);
    setActiveImage(index);
    setDragX(0);
    startResetTimer(index);
  }

  function stopImageControlEvent(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleImageControlClick(e, action) {
    stopImageControlEvent(e);

    if (typeof action === "number") {
      goToImage(action);
      return;
    }

    changeImage(action);
  }

  function handleMouseEnter() {
    showSizesNow();
  }

  function handleMouseLeave() {
    hideSizesNow();
    setDragX(0);
    setIsDragging(false);
  }

  function handlePointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    pointerStartXRef.current = e.clientX;
    pointerStartYRef.current = e.clientY;

    setIsDragging(true);
    setDidSwipe(false);
    showSizesNow();

    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!isDragging || pointerStartXRef.current === null) return;

    const diffX = e.clientX - pointerStartXRef.current;
    const diffY = e.clientY - pointerStartYRef.current;

    if (Math.abs(diffY) > Math.abs(diffX)) return;

    e.preventDefault();

    if (Math.abs(diffX) > 8) {
      setDidSwipe(true);
      setShowSizes(false);
    }

    const isFirst = activeImage === 0;
    const isLast = activeImage === images.length - 1;

    if ((isFirst && diffX > 0) || (isLast && diffX < 0)) {
      setDragX(Math.max(-RUBBER_LIMIT, Math.min(RUBBER_LIMIT, diffX * 0.28)));
    } else {
      setDragX(Math.max(-95, Math.min(95, diffX)));
    }
  }

  function handlePointerUp(e) {
    if (!isDragging) return;

    const startX = pointerStartXRef.current;
    if (startX === null) return;

    const endX = e.clientX;
    const diffX = endX - startX;

    pointerStartXRef.current = null;
    pointerStartYRef.current = null;
    setIsDragging(false);

    if (Math.abs(diffX) > SWIPE_LIMIT) {
      if (diffX < 0) changeImage("next");
      if (diffX > 0) changeImage("prev");
    } else {
      hideSizesLater();
    }

    setDragX(0);
  }

  function handleCardClick(e) {
    if (!productId || didSwipe) {
      e.preventDefault();
      e.stopPropagation();
      window.setTimeout(() => setDidSwipe(false), 80);
      return;
    }

    sessionStorage.setItem("nemesis_return_product_id", String(productId));
    sessionStorage.setItem("nemesis_return_scroll_y", String(window.scrollY));

    window.setTimeout(() => setDidSwipe(false), 80);
  }

  async function handleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!productId) return;

    if (!getAccessToken()) {
      navigate("/login", {
        state: {
          returnUrl: window.location.pathname,
        },
      });
      return;
    }

    try {
      setActionLoading(true);

      const nextFavorite = !favorite;

      if (favorite) {
        await favoritesApi.remove(productId);
      } else {
        await favoritesApi.add(productId);
      }

      setFavorite(nextFavorite);

      window.dispatchEvent(
        new CustomEvent("favorite_changed", {
          detail: {
            productId,
            isFavorite: nextFavorite,
          },
        }),
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <NavLink
      ref={cardRef}
      to={productId ? `/products/${productId}` : "#"}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group block overflow-hidden rounded-[16px] border border-zinc-100 bg-white shadow-[0_8px_28px_rgba(0,0,0,0.035)] transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-200 hover:shadow-[0_16px_42px_rgba(0,0,0,0.07)]"
    >
      <div
        className="relative aspect-[5/6] touch-pan-y overflow-hidden bg-[#f5f5f5]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          pointerStartXRef.current = null;
          pointerStartYRef.current = null;
          setIsDragging(false);
          setDragX(0);
          hideSizesLater();
        }}
      >
        <button
          type="button"
          onClick={handleFavorite}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          disabled={actionLoading}
          className="absolute right-3 top-3 z-30 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[18px] text-zinc-950 shadow-sm backdrop-blur transition active:scale-90"
          aria-label={
            favorite ? "Favoritlərdən çıxar" : "Favoritlərə əlavə et"
          }
        >
          {favorite ? <FaHeart className="text-red-500" /> : <FiHeart />}
        </button>

        <div className="h-full w-full overflow-hidden">
          {images.length ? (
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(calc(${-activeImage * 100}% + ${dragX}px))`,
                transitionDuration: isDragging ? "0ms" : "300ms",
              }}
            >
              {images.map((img, index) => (
                <div
                  key={`${img}-${index}`}
                  className="h-full min-w-full overflow-hidden"
                >
                  <img
                    src={img}
                    alt={mergedProduct?.name || mergedProduct?.productName}
                    draggable="false"
                    onDragStart={(e) => e.preventDefault()}
                    className="h-full w-full select-none object-cover transition duration-500 group-hover:scale-[1.025]"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid h-full min-w-full place-items-center text-sm font-bold text-zinc-300">
              nemesisbaku
            </div>
          )}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onPointerDown={stopImageControlEvent}
              onClick={(e) => handleImageControlClick(e, "prev")}
              className="absolute left-2.5 top-1/2 z-30 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-black/5 bg-white/90 text-xl text-zinc-950 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition duration-200 hover:scale-105 group-hover:opacity-100 focus-visible:opacity-100 md:grid"
              aria-label="Əvvəlki şəkil"
            >
              <FiChevronLeft />
            </button>

            <button
              type="button"
              onPointerDown={stopImageControlEvent}
              onClick={(e) => handleImageControlClick(e, "next")}
              className="absolute right-2.5 top-1/2 z-30 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-black/5 bg-white/90 text-xl text-zinc-950 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition duration-200 hover:scale-105 group-hover:opacity-100 focus-visible:opacity-100 md:grid"
              aria-label="Növbəti şəkil"
            >
              <FiChevronRight />
            </button>

          </>
        )}

        {sizes.length > 0 && (
          <div
            className={`absolute bottom-10 left-1/2 z-20 max-w-[88%] -translate-x-1/2 transition-all duration-200 ease-out ${
              showSizes
                ? "translate-y-0 opacity-100"
                : "translate-y-5 opacity-0 pointer-events-none"
            }`}
          >
            <div className="max-w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max overflow-hidden border border-zinc-200 bg-white/95 shadow-sm backdrop-blur">
                {sizes.map((size) => (
                  <span
                    key={size}
                    className="grid h-6 min-w-7 place-items-center border-r border-zinc-200 px-2 text-[10px] font-extrabold text-zinc-950 last:border-r-0"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {images.length > 1 && (
          <div
            className="absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5"
            onPointerDown={stopImageControlEvent}
          >
            {visibleDotIndexes.map((imageIndex) => (
              <button
                type="button"
                aria-label={`${imageIndex + 1}-ci şəkli göstər`}
                onClick={(e) => handleImageControlClick(e, imageIndex)}
                key={imageIndex}
                className="relative grid h-3 w-3 place-items-center"
              >
                <span
                  className={`h-1 rounded-full bg-zinc-950 transition-all duration-300 ${
                    activeImage === imageIndex
                      ? "w-2.5 opacity-100"
                      : "w-1 opacity-55"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 pt-2.5">
        <h3 className="line-clamp-2 min-h-[38px] text-[15px] font-normal leading-5 tracking-[-0.01em] text-black">
          {mergedProduct?.name || mergedProduct?.productName}
        </h3>

        <div className="mt-2.5 flex items-center gap-2 text-[16px] leading-none tracking-[-0.01em]">
          <span className="font-normal text-black">
            {hasDiscount ? discountPrice : price}₼
          </span>

          {hasDiscount && (
            <>
              <span className="font-normal text-zinc-400 line-through">
                {price}₼
              </span>

              <span className="font-normal text-red-600">
                -{discountPercent}%
              </span>
            </>
          )}
        </div>
      </div>
    </NavLink>
  );
}
