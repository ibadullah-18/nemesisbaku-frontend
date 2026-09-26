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
  FiHeart,
} from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { apiFetch, getAccessToken } from "../../api/apiFetch";
import { favoritesApi } from "../../api/favoritesApi";
import "./productCard.css";
import StoreCarousel from "../common/StoreCarousel";
import { showUserToast } from "../../utils/userToast";

function unwrapData(res) {
  return res?.data?.data || res?.data || res;
}

function cloudinaryResize(url, width) {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com/") || !url.includes("/upload/")) {
    return url;
  }
  if (/\/upload\/[^/]*w_\d/.test(url)) return url; // artıq ölçülüb
  return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
}
function getImageUrl(x) {
  if (!x) return null;
  if (typeof x === "string") return cloudinaryResize(x, 480);

  const raw =
    x.imageUrl ||
    x.mainImageUrl ||
    x.url ||
    x.fileUrl ||
    x.path ||
    x.secureUrl ||
    x.src ||
    null;

  return cloudinaryResize(raw, 480);
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

  const detailLoadedRef = useRef(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [favorite, setFavorite] = useState(Boolean(product?.isFavorite));
  const [actionLoading, setActionLoading] = useState(false);

  const productId = product?.id;
  const mergedProduct = { ...product, ...detailProduct };

  const images = useMemo(() => {
    const list = [product?.mainImageUrl, product?.imageUrl, ...(product?.images || []),
      ...(detailProduct?.images || [])].map(getImageUrl).filter(Boolean);
    return [...new Set(list)];
  }, [product, detailProduct]);
  const price = Number(mergedProduct?.price || 0);
  const discountPrice = Number(mergedProduct?.discountPrice || 0);
  const hasDiscount = discountPrice > 0 && discountPrice < price;

  const discountPercent = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;
  const brandName = getBrandName(mergedProduct);


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
    if (detailLoadedRef.current || !productId || images.length > 1) return;

    try {
      detailLoadedRef.current = true;

      const res = await apiFetch(`/api/Products/${productId}`);
      setDetailProduct(unwrapData(res));
    } catch {
      detailLoadedRef.current = false;
    }
  }, [productId, images.length]);


  function handleCardClick(event) {
    if (!productId) { event.preventDefault(); return; }
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

  }

  async function handleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!productId || actionLoading) return;

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
    } catch {
      showUserToast("Əməliyyat alınmadı. Yenidən yoxlayın.", "error");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <NavLink
      to={productId ? `/products/${productId}` : "#"}
      state={{
        fromProductList: true,
        fromHome: location.pathname === "/",
        fromSearch: location.pathname === "/search",
        returnTo: `${location.pathname}${location.search}`,
      }}
      onClick={handleCardClick}
      className="nemesis-product-card group block overflow-hidden rounded-[18px] border border-zinc-100 bg-white shadow-[0_8px_28px_rgba(0,0,0,0.035)]"
    >
      <div className="nemesis-product-card__media relative aspect-[5/6] overflow-hidden bg-[#f5f5f5]">
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

        {images.length ? <StoreCarousel key={productId} onIntent={loadDetailOnce}
          items={images.map(src => ({ src, alt: mergedProduct?.name || mergedProduct?.productName }))} />
          : <div className="nb-image__error">Şəkil əlçatan deyil</div>}
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
