import { useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiHeart, FiShoppingBag } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { apiFetch, getAccessToken } from "../../api/apiFetch";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const imageScrollRef = useRef(null);

  const [activeImage, setActiveImage] = useState(0);
  const [favorite, setFavorite] = useState(Boolean(product?.isFavorite));
  const [actionLoading, setActionLoading] = useState(false);

  const images = useMemo(() => {
    const list =
      product?.images?.map((x) => x.imageUrl || x.url).filter(Boolean) || [];

    if (product?.mainImageUrl && !list.includes(product.mainImageUrl)) {
      list.unshift(product.mainImageUrl);
    }

    if (product?.imageUrl && !list.includes(product.imageUrl)) {
      list.unshift(product.imageUrl);
    }

    return list.length ? list : [];
  }, [product]);

  const sizes = useMemo(() => {
    const variants = product?.variants || [];

    const result = variants
      .map((x) => x.sizeName || x.size || x.sizeValue || x.size?.name)
      .filter(Boolean);

    return [...new Set(result)].slice(0, 5);
  }, [product]);

  const price = product?.price;
  const discountPrice = product?.discountPrice;
  const hasDiscount = discountPrice && discountPrice < price;

  function handleImageScroll() {
    const el = imageScrollRef.current;
    if (!el) return;

    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveImage(index);
  }

  async function handleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!getAccessToken()) {
      navigate("/login");
      return;
    }

    try {
      setActionLoading(true);
      await apiFetch(`/api/Favorites/${product.id}`, { method: "POST" });
      setFavorite((prev) => !prev);
    } catch {
      setFavorite((prev) => !prev);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBasket(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!getAccessToken()) {
      navigate("/login");
      return;
    }

    const firstVariant = product?.variants?.[0];

    try {
      setActionLoading(true);

      await apiFetch("/api/Basket", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          variantId: firstVariant?.id || null,
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
      to={`/products/${product.id}`}
      className="group block overflow-hidden rounded-[24px] border border-zinc-100 bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(0,0,0,0.08)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f7f7f7]">
        {hasDiscount && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-[#244989] px-3 py-1 text-[11px] font-extrabold text-white">
            SALE
          </span>
        )}

        <button
          type="button"
          onClick={handleFavorite}
          disabled={actionLoading}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[18px] text-zinc-950 shadow-sm backdrop-blur transition active:scale-90"
        >
          {favorite ? <FaHeart className="text-[#244989]" /> : <FiHeart />}
        </button>

        <div
          ref={imageScrollRef}
          onScroll={handleImageScroll}
          className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.length ? (
            images.map((img, index) => (
              <div key={index} className="h-full min-w-full snap-center">
                <img
                  src={img}
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                />
              </div>
            ))
          ) : (
            <div className="grid h-full min-w-full place-items-center text-sm font-bold text-zinc-300">
              NemesisBaku
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/80 px-2 py-1 backdrop-blur">
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
            {product.brandName || product.brand?.name || "Nemesis"}
          </p>

          <button
            type="button"
            onClick={handleBasket}
            disabled={actionLoading}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-50 text-[17px] text-zinc-900 transition hover:bg-zinc-100 active:scale-90"
          >
            <FiShoppingBag />
          </button>
        </div>

        <h3 className="line-clamp-2 min-h-[40px] text-[14px] font-bold leading-5 text-zinc-950">
          {product.name || product.productName}
        </h3>

        {sizes.length > 0 && (
          <div className="mt-2 flex gap-1.5 overflow-hidden">
            {sizes.map((size) => (
              <span
                key={size}
                className="rounded-full bg-zinc-50 px-2 py-1 text-[10px] font-bold text-zinc-500"
              >
                {size}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-end gap-2">
          <p className="text-[16px] font-extrabold text-[#244989]">
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