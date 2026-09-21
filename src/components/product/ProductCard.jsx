import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowUpRight,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
} from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { apiFetch, getAccessToken } from "../../api/apiFetch";
import { favoritesApi } from "../../api/favoritesApi";
import "./productCard.css";

const RESET_IMAGE_DELAY = 5000;
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

function getBrandName(product) {
  return (
    product?.brandName ||
    product?.brand?.name ||
    product?.brandTitle ||
    "nemesisbaku"
  );
}

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const location = useLocation();

  const cardRef = useRef(null);
  const resetTimerRef = useRef(null);
  const pointerStartXRef = useRef(null);
  const pointerStartYRef = useRef(null);
  const detailLoadedRef = useRef(false);

  const [detailProduct, setDetailProduct] = useState(null);
  const [failedImages, setFailedImages] = useState([]);

  const [activeImage, setActiveImage] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [didSwipe, setDidSwipe] = useState(false);

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

    return [...new Set(list)].filter((url) => !failedImages.includes(url));
  }, [mergedProduct, failedImages]);

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

  const price = Number(mergedProduct?.price || 0);
  const discountPrice = Number(mergedProduct?.discountPrice || 0);
  const hasDiscount = discountPrice > 0 && discountPrice < price;

  const discountPercent = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;
  const brandName = getBrandName(mergedProduct);

  useEffect(() => {
    return () => {
      window.clearTimeout(resetTimerRef.current);
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
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) loadDetailOnce();
      });
      return () => { cancelled = true; };
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
    if (activeImage < images.length) return undefined;
    const timer = window.setTimeout(() => {
      setActiveImage(0);
      setDragX(0);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeImage, images.length]);

  function startResetTimer(nextIndex) {
    window.clearTimeout(resetTimerRef.current);

    if (nextIndex === 0) return;

    resetTimerRef.current = window.setTimeout(() => {
      setActiveImage(0);
      setDragX(0);
    }, RESET_IMAGE_DELAY);
  }

  function changeImage(direction) {
    if (images.length <= 1) return;

    setActiveImage((prev) => {
      const next = direction === "next"
        ? (prev + 1) % images.length
        : (prev - 1 + images.length) % images.length;

      startResetTimer(next);
      return next;
    });
  }

  function goToImage(index) {
    if (index < 0 || index >= images.length || index === activeImage) return;

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

  function handleMouseLeave() {
    setDragX(0);
    setIsDragging(false);
  }

  function handlePointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    pointerStartXRef.current = e.clientX;
    pointerStartYRef.current = e.clientY;

    setIsDragging(true);
    setDidSwipe(false);

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
    }

    setDragX(0);
  }

  function handleCardClick(event) {
    if (!productId || didSwipe) {
      event.preventDefault();
      event.stopPropagation();
      window.setTimeout(() => setDidSwipe(false), 80);
      return;
    }

    if (location.pathname === "/") {
      sessionStorage.setItem(
        "nemesis_return_product_id",
        String(productId),
      );
      sessionStorage.setItem(
        "nemesis_return_scroll_y",
        String(window.scrollY),
      );
    }

    if (location.pathname === "/search") {
      sessionStorage.setItem(
        "nemesis_search_scroll_y",
        String(window.scrollY),
      );
    }

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
      state={{
        fromProductList: true,
        fromHome: location.pathname === "/",
        fromSearch: location.pathname === "/search",
        returnTo: `${location.pathname}${location.search}`,
      }}
      onClick={handleCardClick}
      onMouseLeave={handleMouseLeave}
      className="nemesis-product-card group block overflow-hidden rounded-[18px] border border-zinc-100 bg-white shadow-[0_8px_28px_rgba(0,0,0,0.035)]"
    >
      <div
        className="nemesis-product-card__media relative aspect-[5/6] touch-pan-y overflow-hidden bg-[#f5f5f5]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          pointerStartXRef.current = null;
          pointerStartYRef.current = null;
          setIsDragging(false);
          setDragX(0);
        }}
      >
        <div className="nemesis-product-card__media-frame" aria-hidden="true" />

        {hasDiscount && (
          <span className="nemesis-product-card__discount absolute left-3 top-3 z-30 inline-flex min-h-8 items-center rounded-full border border-red-100 bg-red-50 px-3 text-[11px] font-semibold text-red-600 shadow-[0_8px_22px_rgba(127,29,29,0.10)]">
            -{discountPercent}%
          </span>
        )}

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
          className={`nemesis-product-card__favorite absolute right-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-full border text-[18px] shadow-sm backdrop-blur transition active:scale-90 ${
            favorite
              ? "border-red-100 bg-white text-red-500"
              : "border-white/70 bg-white/90 text-zinc-950"
          }`}
          aria-label={
            favorite ? "Favoritlərdən çıxar" : "Favoritlərə əlavə et"
          }
        >
          {favorite ? <FaHeart className="text-red-500" /> : <FiHeart />}
        </button>

        <div className="nemesis-product-card__viewport h-full w-full overflow-hidden">
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
  loading="lazy"
  decoding="async"
                    alt={mergedProduct?.name || mergedProduct?.productName}
                    draggable="false"
                    onDragStart={(e) => e.preventDefault()}
                    onError={() =>
                      setFailedImages((current) =>
                        current.includes(img) ? current : [...current, img],
                      )
                    }
                    className="nemesis-product-card__image h-full w-full select-none object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid h-full min-w-full place-items-center text-sm font-bold text-zinc-400">
              Şəkil əlçatan deyil
            </div>
          )}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onPointerDown={stopImageControlEvent}
              onClick={(e) => handleImageControlClick(e, "prev")}
              className="nemesis-product-card__arrow absolute left-2.5 top-1/2 z-30 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-black/5 bg-white/90 text-xl text-zinc-950 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition duration-200 hover:scale-105 group-hover:opacity-100 focus-visible:opacity-100 md:grid"
              aria-label="Əvvəlki şəkil"
            >
              <FiChevronLeft />
            </button>

            <button
              type="button"
              onPointerDown={stopImageControlEvent}
              onClick={(e) => handleImageControlClick(e, "next")}
              className="nemesis-product-card__arrow absolute right-2.5 top-1/2 z-30 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-black/5 bg-white/90 text-xl text-zinc-950 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition duration-200 hover:scale-105 group-hover:opacity-100 focus-visible:opacity-100 md:grid"
              aria-label="Növbəti şəkil"
            >
              <FiChevronRight />
            </button>

          </>
        )}

        {images.length > 1 && (
          <div
            className="nemesis-product-card__dots absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-white/70 px-1.5 py-0.5 shadow-sm backdrop-blur"
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

      <div className="nemesis-product-card__body p-3 pt-3.5 sm:p-4 sm:pt-3.5">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 sm:text-[11px]">
            {brandName}
          </p>

          <span className="nemesis-product-card__open grid h-7 w-7 shrink-0 place-items-center rounded-full bg-zinc-50 text-sm text-zinc-500">
            <FiArrowUpRight />
          </span>
        </div>

        <h3 className="mt-1.5 line-clamp-2 min-h-[40px] text-[14px] font-medium leading-5 tracking-[-0.015em] text-zinc-950 sm:text-[15px]">
          {mergedProduct?.name || mergedProduct?.productName}
        </h3>

        <div className="nemesis-product-card__price mt-3 flex min-h-7 flex-wrap items-center gap-x-2 gap-y-1 text-[15px] leading-none tracking-[-0.01em] sm:text-[16px]">
          <span
            className={`font-semibold ${
              hasDiscount ? "text-red-600" : "text-zinc-950"
            }`}
          >
            {hasDiscount ? discountPrice : price}₼
          </span>

          {hasDiscount && (
            <span className="text-[12px] font-medium text-zinc-400 line-through sm:text-[13px]">
              {price}₼
            </span>
          )}
        </div>
      </div>
    </NavLink>
  );
}
