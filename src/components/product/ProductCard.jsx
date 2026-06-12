import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiHeart, FiShoppingBag } from "react-icons/fi";
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

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const resetTimerRef = useRef(null);
  const hideSizesTimerRef = useRef(null);
  const pointerStartXRef = useRef(null);
  const pointerStartYRef = useRef(null);
  const detailLoadedRef = useRef(false);

  const [detailProduct, setDetailProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

    if (mergedProduct?.mainImageUrl && !list.includes(mergedProduct.mainImageUrl)) {
      list.unshift(mergedProduct.mainImageUrl);
    }

    if (mergedProduct?.imageUrl && !list.includes(mergedProduct.imageUrl)) {
      list.unshift(mergedProduct.imageUrl);
    }

    return [...new Set(list)];
  }, [mergedProduct]);

  const sizes = useMemo(() => {
    const variants = mergedProduct?.variants || [];

    const result = variants
      .filter((x) => Number(x.stockCount ?? x.stock ?? 0) > 0)
      .map(
        (x) =>
          x.sizeValue ||
          x.sizeName ||
          x.size ||
          x.size?.value ||
          x.size?.name
      )
      .filter(Boolean);

    return [...new Set(result)];
  }, [mergedProduct]);

  const price = Number(mergedProduct?.price || 0);
  const discountPrice = Number(mergedProduct?.discountPrice || 0);
  const hasDiscount = discountPrice > 0 && discountPrice < price;

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

  async function loadDetailOnce() {
    if (detailLoadedRef.current || detailLoading || !productId) return;

    try {
      detailLoadedRef.current = true;
      setDetailLoading(true);

      const res = await apiFetch(`/api/Products/${productId}`);
      setDetailProduct(unwrapData(res));
    } catch {
      detailLoadedRef.current = false;
    } finally {
      setDetailLoading(false);
    }
  }

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
        next = prev >= images.length - 1 ? prev : prev + 1;
      } else {
        next = prev <= 0 ? prev : prev - 1;
      }

      startResetTimer(next);
      return next;
    });
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
    }

    window.setTimeout(() => setDidSwipe(false), 80);
  }

  async function handleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!productId) return;

    if (!getAccessToken()) {
      navigate("/login");
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
        })
      );

      window.dispatchEvent(new Event("nemesis_auth_changed"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBasket(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!productId) return;

    if (!getAccessToken()) {
      navigate("/login");
      return;
    }

    await loadDetailOnce();

    const variants = detailProduct?.variants || mergedProduct?.variants || [];
    const firstVariant = variants.find((x) => Number(x.stockCount ?? x.stock ?? 0) > 0) || variants[0];

    if (!firstVariant?.id) return;

    try {
      setActionLoading(true);

      await apiFetch("/api/Basket", {
        method: "POST",
        body: JSON.stringify({
          productId,
          productVariantId: firstVariant.id,
          quantity: 1,
        }),
      });

      window.dispatchEvent(new Event("nemesis_auth_changed"));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <NavLink
      to={productId ? `/products/${productId}` : "#"}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group block overflow-hidden rounded-[18px] border border-zinc-100 bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(0,0,0,0.08)]"
    >
      <div
        className="relative aspect-[3/4] touch-pan-y overflow-hidden bg-[#f7f7f7]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          setIsDragging(false);
          setDragX(0);
          hideSizesLater();
        }}
      >
        {hasDiscount && (
          <span className="absolute left-3 top-3 z-20 rounded-full bg-red-600 px-3 py-1 text-[11px] font-extrabold text-white">
            SALE
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
          className="absolute right-3 top-3 z-30 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[18px] text-zinc-950 shadow-sm backdrop-blur transition active:scale-90"
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
                    className="h-full w-full select-none object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid h-full min-w-full place-items-center text-sm font-bold text-zinc-300">
              NemesisBaku
            </div>
          )}
        </div>

        {sizes.length > 0 && (
          <div
            className={`absolute bottom-3 left-1/2 z-20 max-w-[88%] -translate-x-1/2 transition-all duration-300 ease-out ${
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
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/80 px-2 py-1 backdrop-blur">
            {images.slice(0, 5).map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeImage === index ? "w-4 bg-zinc-950" : "w-1.5 bg-zinc-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">
            {mergedProduct?.brandName || mergedProduct?.brand?.name || "Nemesis"}
          </p>

          <button
            type="button"
            onClick={handleBasket}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            disabled={actionLoading}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-50 text-[17px] text-zinc-900 transition hover:bg-zinc-100 active:scale-90"
          >
            <FiShoppingBag />
          </button>
        </div>

        <h3 className="line-clamp-2 min-h-[40px] text-[14px] font-bold leading-5 text-zinc-950">
          {mergedProduct?.name || mergedProduct?.productName}
        </h3>

        <div className="mt-3 flex items-end gap-2">
          <p
            className={`text-[16px] font-extrabold ${
              hasDiscount ? "text-red-600" : "text-zinc-950"
            }`}
          >
            {hasDiscount ? discountPrice : price} ₼
          </p>

          {hasDiscount && (
            <p className="text-xs font-bold text-zinc-400 line-through">
              {price} ₼
            </p>
          )}
        </div>
      </div>
    </NavLink>
  );
}