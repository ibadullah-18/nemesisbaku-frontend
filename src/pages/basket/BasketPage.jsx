import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheck,
  FiChevronRight,
  FiHeart,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiTrash2,
} from "react-icons/fi";
import { FaHeart, FaWhatsapp } from "react-icons/fa";
import AppLoader from "../../components/common/AppLoader";
import { basketApi } from "../../api/basketApi";
import { promoApi } from "../../api/promoApi";
import { favoritesApi } from "../../api/favoritesApi";
import { getProducts } from "../../api/homeApi";
import { apiFetch, getAccessToken } from "../../api/apiFetch";
import { useLanguage } from "../../i18n/LanguageContext";

const STORE_WHATSAPP_NUMBER = "994514349829";
const SWIPE_LIMIT = 45;
const RUBBER_LIMIT = 42;
const RESET_IMAGE_DELAY = 5000;
const RELATED_PAGE_SIZE = 6;

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

function money(value) {
  return Number(value || 0).toFixed(2).replace(".00", "");
}

function getImageUrl(x) {
  if (!x) return null;
  if (typeof x === "string") return x;
  return x.imageUrl || x.mainImageUrl || x.url || x.src || x.path || null;
}

function getProductImages(product, fallbackImage) {
  const raw = product?.images || [];
  const list = raw.map(getImageUrl).filter(Boolean);

  if (product?.mainImageUrl && !list.includes(product.mainImageUrl)) {
    list.unshift(product.mainImageUrl);
  }

  if (product?.imageUrl && !list.includes(product.imageUrl)) {
    list.unshift(product.imageUrl);
  }

  if (fallbackImage && !list.includes(fallbackImage)) {
    list.unshift(fallbackImage);
  }

  return [...new Set(list)];
}

function getProductSizes(product) {
  const variants = product?.variants || [];

  return [
    ...new Set(
      variants
        .filter((x) => Number(x.stockCount || 0) > 0)
        .map((x) => x.sizeValue || x.sizeName || x.size || x.size?.value)
        .filter(Boolean)
    ),
  ];
}

export default function BasketPage() {
  const navigate = useNavigate();
  const { text } = useLanguage();

  const [basket, setBasket] = useState({
    items: [],
    totalQuantity: 0,
    originalTotalPrice: 0,
    totalDiscountAmount: 0,
    totalPrice: 0,
  });

  const [productDetails, setProductDetails] = useState({});
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedPage, setRelatedPage] = useState(1);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [hasMoreRelated, setHasMoreRelated] = useState(true);

  const [selectedIds, setSelectedIds] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [error, setError] = useState("");

  const items = basket.items || [];

  const selectedItems = useMemo(
    () => items.filter((x) => selectedIds.includes(x.id)),
    [items, selectedIds]
  );

  const allSelected = items.length > 0 && selectedIds.length === items.length;

  const selectedOriginalTotal = selectedItems.reduce(
    (sum, item) =>
      sum +
      Number(
        item.originalTotalPrice ??
          Number(item.originalPrice || item.unitPrice || 0) *
            Number(item.quantity || 0)
      ),
    0
  );

  const selectedDiscountTotal = selectedItems.reduce(
    (sum, item) =>
      sum + Number(item.discountAmount || 0) * Number(item.quantity || 0),
    0
  );

  const selectedFinalTotal = selectedItems.reduce(
    (sum, item) => sum + Number(item.totalPrice || 0),
    0
  );

  const payableTotal = Math.max(0, selectedFinalTotal - promoDiscount);
  const hasAnyDiscount = selectedDiscountTotal > 0 || promoDiscount > 0;

  useEffect(() => {
    loadBasket();
    loadRelatedProducts(1, true);
  }, []);

  async function loadBasket() {
    try {
      setLoading(true);
      setError("");

      const res = await basketApi.get();
      const data = unwrap(res);
      const nextItems = data?.items || [];

      setBasket({
        items: nextItems,
        totalQuantity: data?.totalQuantity || 0,
        originalTotalPrice: data?.originalTotalPrice || 0,
        totalDiscountAmount: data?.totalDiscountAmount || 0,
        totalPrice: data?.totalPrice || 0,
      });

      setSelectedIds((prev) => {
        const validIds = nextItems.map((x) => x.id);
        const filtered = prev.filter((id) => validIds.includes(id));
        return filtered.length ? filtered : validIds;
      });

      loadProductDetails(nextItems);
    } catch (err) {
      setError(err.message || text.basketLoadError);
    } finally {
      setLoading(false);
    }
  }

  async function loadProductDetails(nextItems) {
    const uniqueProductIds = [...new Set(nextItems.map((x) => x.productId))];
    const loaded = {};

    await Promise.all(
      uniqueProductIds.map(async (productId) => {
        try {
          const res = await apiFetch(`/api/Products/${productId}`);
          loaded[productId] = unwrap(res);
        } catch {
          loaded[productId] = null;
        }
      })
    );

    setProductDetails((prev) => ({ ...prev, ...loaded }));
  }

  async function loadRelatedProducts(page = 1, replace = true) {
    try {
      setRelatedLoading(true);

      const res = await getProducts({ page, pageSize: RELATED_PAGE_SIZE });
      const list = normalizeList(res);

      setRelatedProducts((prev) => {
        const merged = replace ? list : [...prev, ...list];
        const map = new Map();

        merged.forEach((item) => {
          if (item?.id) map.set(item.id, item);
        });

        return [...map.values()];
      });

      setRelatedPage(page);
      setHasMoreRelated(list.length >= RELATED_PAGE_SIZE);
    } catch {
      setHasMoreRelated(false);
    } finally {
      setRelatedLoading(false);
    }
  }

  function toggleItem(id) {
    setPromoDiscount(0);
    setPromoMessage("");
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    setPromoDiscount(0);
    setPromoMessage("");
    setSelectedIds(allSelected ? [] : items.map((x) => x.id));
  }

  async function updateQuantity(item, nextQuantity) {
    const quantity = Math.max(
      1,
      Math.min(Number(item.stockCount || 1), nextQuantity)
    );

    const oldBasket = basket;

    setActionId(item.id);
    setPromoDiscount(0);
    setPromoMessage("");

    setBasket((prev) => ({
      ...prev,
      items: prev.items.map((x) => {
        if (x.id !== item.id) return x;

        const discountAmount = Number(x.discountAmount || 0);
        const unitPrice = Number(x.unitPrice || 0);
        const originalPrice = Number(
          x.originalPrice || unitPrice + discountAmount
        );

        return {
          ...x,
          quantity,
          originalTotalPrice: originalPrice * quantity,
          totalPrice: unitPrice * quantity,
        };
      }),
    }));

    try {
      await basketApi.update(item.id, quantity);
      window.dispatchEvent(new Event("nemesis_auth_changed"));
    } catch (err) {
      setBasket(oldBasket);
      setError(err.message || text.basketUpdateError);
    } finally {
      setActionId("");
    }
  }

  async function removeItem(id) {
    const oldBasket = basket;

    setActionId(id);
    setPromoDiscount(0);
    setPromoMessage("");

    setBasket((prev) => ({
      ...prev,
      items: prev.items.filter((x) => x.id !== id),
    }));

    setSelectedIds((prev) => prev.filter((x) => x !== id));

    try {
      await basketApi.remove(id);
      window.dispatchEvent(new Event("nemesis_auth_changed"));
    } catch (err) {
      setBasket(oldBasket);
      setError(err.message || text.basketRemoveError);
    } finally {
      setActionId("");
    }
  }

  async function checkPromo() {
    if (!promoCode.trim()) return;

    try {
      setPromoLoading(true);
      setError("");
      setPromoMessage("");

      const res = await promoApi.check({
        code: promoCode.trim(),
        orderAmount: selectedFinalTotal,
      });

      const data = unwrap(res);

      const discount =
        Number(data?.discountAmount) ||
        Number(data?.promoDiscountAmount) ||
        Number(data?.discount) ||
        0;

      setPromoDiscount(discount);
      setPromoMessage(text.promoApplied);
    } catch (err) {
      setPromoDiscount(0);
      setPromoMessage("");
      setError(err.message || text.promoError);
    } finally {
      setPromoLoading(false);
    }
  }

  function goCheckout() {
    if (selectedItems.length === 0) {
      setError(text.selectBasketItems);
      return;
    }

    localStorage.setItem(
      "nemesis_checkout_items",
      JSON.stringify(selectedItems.map((x) => x.id))
    );

    localStorage.setItem(
      "nemesis_checkout_promo",
      JSON.stringify({
        code: promoCode.trim(),
        discountAmount: promoDiscount,
      })
    );

    navigate("/checkout");
  }

  function orderWithWhatsapp() {
    if (selectedItems.length === 0) {
      setError(text.selectBasketItems);
      return;
    }

    const lines = selectedItems
      .map(
        (x, index) =>
          `${index + 1}. ${x.productName}\nKod: ${x.productCode}\nRazmer: ${
            x.sizeValue
          }\nRəng: ${x.colorName}\nSay: ${x.quantity}\nQiymət: ${money(
            x.totalPrice
          )} ₼`
      )
      .join("\n\n");

    const message = `Salam, bu məhsulları sifariş etmək istəyirəm:\n\n${lines}\n\nYekun: ${money(
      payableTotal
    )} ₼`;

    window.open(
      `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
        message
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  if (loading) return <AppLoader text={text.loading} />;

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-7 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-7 animate-[basketUp_.42s_cubic-bezier(.22,1,.36,1)_both] text-center">
          <p className="text-[15px] font-medium  tracking-[0.17em] text-zinc-400">
            nemesisbaku
          </p>

          <h1 className="mt-2 text-[34px] font-medium tracking-[-0.045em] text-zinc-950 md:text-[46px]">
            {text.basket}
          </h1>

        </div>

        {error && (
          <div className="mb-5 animate-[basketUp_.3s_ease_both] rounded-[14px] bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="grid min-h-[380px] place-items-center rounded-[18px] bg-white px-5 text-center shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
            <div>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-[18px] bg-zinc-50 text-3xl text-zinc-400">
                <FiShoppingBag />
              </div>

              <h2 className="mt-4 text-[24px] font-medium tracking-[-0.035em] text-zinc-950">
                {text.basketEmptyTitle}
              </h2>

              <p className="mx-auto mt-2 max-w-[380px] text-sm leading-6 text-zinc-500">
                {text.basketEmptyDesc}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_370px]">
            <section className="order-1 space-y-3">
              <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-4 shadow-[0_12px_35px_rgba(0,0,0,0.035)]">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="inline-flex items-center gap-3 text-sm font-medium text-zinc-950"
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-[8px] border transition ${
                      allSelected
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    {allSelected && <FiCheck />}
                  </span>
                  {text.selectAll}
                </button>

                <p className="text-sm font-medium text-zinc-400">
                  {selectedItems.length}/{items.length}
                </p>
              </div>

              {items.map((item, index) => {
                const selected = selectedIds.includes(item.id);
                const busy = actionId === item.id;
                const detail = productDetails[item.productId];
                const images = getProductImages(detail, item.productImageUrl);

                const itemHasDiscount =
                  Boolean(item.hasDiscount) ||
                  Number(item.discountAmount || 0) > 0 ||
                  Number(item.originalTotalPrice || 0) >
                    Number(item.totalPrice || 0);

                return (
                  <article
                    key={item.id}
                    onClick={() => navigate(`/products/${item.productId}`)}
                    className="cursor-pointer animate-[basketCard_.42s_cubic-bezier(.22,1,.36,1)_both] rounded-[18px] bg-white p-3 shadow-[0_14px_40px_rgba(0,0,0,0.04)] transition hover:shadow-[0_20px_55px_rgba(0,0,0,0.07)] md:p-4"
                    style={{ animationDelay: `${Math.min(index * 45, 300)}ms` }}
                  >
                    <div className="flex gap-3 md:gap-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItem(item.id);
                        }}
                        className={`mt-2 grid h-6 w-6 shrink-0 place-items-center rounded-[8px] border transition ${
                          selected
                            ? "border-zinc-950 bg-zinc-950 text-white"
                            : "border-zinc-200 bg-white"
                        }`}
                      >
                        {selected && <FiCheck />}
                      </button>

                      <SwipeImage
                        images={images}
                        name={item.productName}
                        className="h-[112px] w-[92px] md:h-[132px] md:w-[108px]"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="line-clamp-2 text-[15px] font-medium leading-5 text-zinc-950 md:text-[17px]">
                              {item.productName}
                            </h2>

                            <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
                              {item.productCode}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.id);
                            }}
                            disabled={busy}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-zinc-50 text-red-500 transition hover:bg-red-50 active:scale-95 disabled:opacity-50"
                          >
                            <FiTrash2 />
                          </button>
                        </div>

                        <div className="mt-3 flex flex-col items-start gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700">
                            <span
                              className="h-4 w-4 rounded-full border border-black/10"
                              style={{ backgroundColor: item.colorHexCode }}
                            />
                            {item.colorName}
                          </span>

                          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700">
                            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-zinc-950 shadow-sm">
                              {item.sizeValue}
                            </span>
                            {text.size}
                          </span>
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex h-10 overflow-hidden rounded-[12px] border border-zinc-200 bg-white"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item, item.quantity - 1)
                              }
                              disabled={busy || item.quantity <= 1}
                              className="grid w-10 place-items-center transition hover:bg-zinc-50 disabled:opacity-40"
                            >
                              <FiMinus />
                            </button>

                            <div className="grid w-12 place-items-center text-sm font-medium">
                              {item.quantity}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item, item.quantity + 1)
                              }
                              disabled={busy || item.quantity >= item.stockCount}
                              className="grid w-10 place-items-center transition hover:bg-zinc-50 disabled:opacity-40"
                            >
                              <FiPlus />
                            </button>
                          </div>

                          <div className="text-right">
                            {itemHasDiscount && (
                              <p className="text-xs font-medium text-zinc-400 line-through">
                                {money(item.originalTotalPrice)} ₼
                              </p>
                            )}

                            <p
                              className={`text-lg font-medium ${
                                itemHasDiscount
                                  ? "text-red-600"
                                  : "text-zinc-950"
                              }`}
                            >
                              {money(item.totalPrice)} ₼
                            </p>

                            <p className="text-xs text-zinc-400">
                              {money(item.unitPrice)} ₼ × {item.quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="order-2 h-max rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] lg:sticky lg:top-24">
              <h2 className="text-xl font-medium tracking-[-0.03em] text-zinc-950">
                {text.orderSummary}
              </h2>

              <div className="mt-5 space-y-3">
                <SummaryRow
                  label={text.selectedProducts}
                  value={selectedItems.length}
                />

                <SummaryRow
                  label={text.productsTotal}
                  value={`${money(selectedOriginalTotal)} ₼`}
                />

                <SummaryRow
                  label={text.discount}
                  value={`-${money(selectedDiscountTotal)} ₼`}
                  valueClass="text-red-500"
                />

                <SummaryRow
                  label={text.promoCode}
                  value={`-${money(promoDiscount)} ₼`}
                  valueClass="text-red-500"
                />
              </div>

              <div className="mt-5 flex gap-2">
                <input
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setPromoDiscount(0);
                    setPromoMessage("");
                  }}
                  placeholder={text.promoCode}
                  className="h-12 min-w-0 flex-1 rounded-[14px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-medium text-zinc-950 outline-none transition focus:border-zinc-400"
                />

                <button
                  type="button"
                  onClick={checkPromo}
                  disabled={promoLoading || selectedItems.length === 0}
                  className="h-12 rounded-[14px] bg-zinc-950 px-4 text-sm font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
                >
                  {promoLoading ? "..." : text.apply}
                </button>
              </div>

              {promoMessage && (
                <p className="mt-2 text-sm font-medium text-green-600">
                  {promoMessage}
                </p>
              )}

              <div className="my-5 h-px bg-zinc-100" />

              <div className="flex items-end justify-between">
                <p className="text-sm font-medium text-zinc-500">
                  {text.total}
                </p>

                <div className="text-right">
                  {hasAnyDiscount && (
                    <p className="text-sm font-medium text-zinc-400 line-through">
                      {money(selectedOriginalTotal)} ₼
                    </p>
                  )}

                  <p
                    className={`text-[30px] font-medium ${
                      hasAnyDiscount ? "text-red-600" : "text-zinc-950"
                    }`}
                  >
                    {money(payableTotal)} ₼
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={goCheckout}
                className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-zinc-950 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98]"
              >
                {text.completeOrder}
                <FiChevronRight />
              </button>

              <button
                type="button"
                onClick={orderWithWhatsapp}
                className="mt-3 inline-flex h-13 w-full items-center justify-center gap-2 rounded-[14px] bg-[#1fbd5a] text-sm font-medium text-white transition hover:opacity-95 active:scale-[0.98]"
              >
                <FaWhatsapp className="text-xl" />
                {text.orderWithWhatsapp}
              </button>
            </aside>

            {relatedProducts.length > 0 && (
              <section className="order-3 lg:col-span-1">
                <div className="mt-2 divide-y divide-zinc-200/70 border-t border-zinc-200/70">
                  {relatedProducts.map((product, index) => (
                    <RelatedProductRow
                      key={product.id || index}
                      product={product}
                      index={index}
                      text={text}
                    />
                  ))}
                </div>

                {hasMoreRelated && (
                  <div className="mt-5 flex justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        loadRelatedProducts(relatedPage + 1, false)
                      }
                      disabled={relatedLoading}
                      className="h-12 rounded-[14px] bg-zinc-950 px-7 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60"
                    >
                      {relatedLoading ? text.loading : text.more}
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes basketUp {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes basketCard {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

function SwipeImage({ images, name, className }) {
  const [activeImage, setActiveImage] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const resetTimerRef = useRef(null);
  const startXRef = useRef(null);
  const startYRef = useRef(null);

  useEffect(() => {
    return () => window.clearTimeout(resetTimerRef.current);
  }, []);

  function resetLater(nextIndex) {
    window.clearTimeout(resetTimerRef.current);

    if (nextIndex === 0) return;

    resetTimerRef.current = window.setTimeout(() => {
      setActiveImage(0);
      setDragX(0);
    }, RESET_IMAGE_DELAY);
  }

  function down(e) {
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function move(e) {
    if (!dragging || startXRef.current === null) return;

    const diffX = e.clientX - startXRef.current;
    const diffY = e.clientY - startYRef.current;

    if (Math.abs(diffY) > Math.abs(diffX)) return;
    e.preventDefault();

    const isFirst = activeImage === 0;
    const isLast = activeImage === images.length - 1;

    if ((isFirst && diffX > 0) || (isLast && diffX < 0)) {
      setDragX(Math.max(-RUBBER_LIMIT, Math.min(RUBBER_LIMIT, diffX * 0.25)));
    } else {
      setDragX(Math.max(-95, Math.min(95, diffX)));
    }
  }

  function up(e) {
    if (!dragging) return;

    const diffX = e.clientX - startXRef.current;

    if (Math.abs(diffX) > SWIPE_LIMIT && images.length > 1) {
      setActiveImage((prev) => {
        let next = prev;

        if (diffX < 0) next = Math.min(images.length - 1, prev + 1);
        else next = Math.max(0, prev - 1);

        resetLater(next);
        return next;
      });
    }

    setDragging(false);
    setDragX(0);
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => {
        setDragging(false);
        setDragX(0);
      }}
      className={`${className} shrink-0 touch-pan-y overflow-hidden rounded-[16px] bg-zinc-100`}
    >
      <div
        className="flex h-full transition-transform duration-300"
        style={{
          transform: `translateX(calc(${-activeImage * 100}% + ${dragX}px))`,
          transitionDuration: dragging ? "0ms" : "300ms",
        }}
      >
        {(images.length ? images : [null]).map((img, index) =>
          img ? (
            <img
              key={`${img}-${index}`}
              src={img}
              alt={name}
              draggable="false"
              className="h-full min-w-full select-none object-cover"
            />
          ) : (
            <div
              key={index}
              className="grid h-full min-w-full place-items-center text-xs font-medium text-zinc-300"
            >
              nemesisbaku
            </div>
          )
        )}
      </div>
    </div>
  );
}

function RelatedProductRow({ product, index, text }) {
  const navigate = useNavigate();
  const [favorite, setFavorite] = useState(Boolean(product?.isFavorite));
  const [actionLoading, setActionLoading] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);

  const productId = product?.id;
  const mergedProduct = detailProduct || product;

  const images = useMemo(
    () =>
      getProductImages(
        mergedProduct,
        mergedProduct?.mainImageUrl || mergedProduct?.imageUrl
      ),
    [mergedProduct]
  );

  const sizes = useMemo(() => getProductSizes(mergedProduct), [mergedProduct]);

  const price = Number(mergedProduct?.price || 0);
  const discountPrice = Number(mergedProduct?.discountPrice || 0);
  const hasDiscount = discountPrice > 0 && discountPrice < price;

  useEffect(() => {
    async function init() {
      if (!productId) return;

      try {
        const [favRes, detailRes] = await Promise.all([
          getAccessToken()
            ? favoritesApi.check(productId).catch(() => false)
            : false,
          apiFetch(`/api/Products/${productId}`).catch(() => null),
        ]);

        const favResult = favRes?.data?.data ?? favRes?.data ?? favRes;
        setFavorite(Boolean(favResult));

        if (detailRes) setDetailProduct(unwrap(detailRes));
      } catch {}
    }

    init();

    function syncFavorite(e) {
      if (e.detail?.productId !== productId) return;
      setFavorite(Boolean(e.detail?.isFavorite));
    }

    window.addEventListener("favorite_changed", syncFavorite);
    return () => window.removeEventListener("favorite_changed", syncFavorite);
  }, [productId]);

  async function toggleFavorite(e) {
    e.stopPropagation();

    if (!productId) return;

    if (!getAccessToken()) {
      navigate("/login");
      return;
    }

    try {
      setActionLoading(true);
      const next = !favorite;

      if (favorite) await favoritesApi.remove(productId);
      else await favoritesApi.add(productId);

      setFavorite(next);

      window.dispatchEvent(
        new CustomEvent("favorite_changed", {
          detail: { productId, isFavorite: next },
        })
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <article
      onClick={() => navigate(`/products/${productId}`)}
      className="grid cursor-pointer grid-cols-[92px_1fr_auto] gap-3 py-4 transition hover:bg-white md:grid-cols-[108px_1fr_auto]"
      style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
    >
      <SwipeImage
        images={images}
        name={mergedProduct?.name || mergedProduct?.productName}
        className="h-[112px] w-[92px] md:h-[132px] md:w-[108px]"
      />

      <div className="min-w-0">
        <h3 className="line-clamp-2 text-[15px] font-medium leading-5 text-zinc-950">
          {mergedProduct?.name || mergedProduct?.productName}
        </h3>

        {mergedProduct?.model && (
          <p className="mt-1 text-xs font-medium text-zinc-400">
            {mergedProduct.model}
          </p>
        )}

        {sizes.length > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <span className="flex -space-x-1">
              {sizes.slice(0, 3).map((size) => (
                <span
                  key={size}
                  className="grid h-5 min-w-5 place-items-center rounded-full border border-white bg-zinc-100 px-1 text-[9px] font-bold text-zinc-950 shadow-sm"
                >
                  {size}
                </span>
              ))}
            </span>
            {sizes.length} {text.sizeOptions || "ölçü seçimi"}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          {hasDiscount ? (
            <>
              <p className="text-sm font-medium text-red-600">
                {money(discountPrice)} ₼
              </p>
              <p className="text-xs font-medium text-zinc-400 line-through">
                {money(price)} ₼
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-zinc-950">
              {money(price)} ₼
            </p>
          )}
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={toggleFavorite}
          disabled={actionLoading}
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-[18px] text-zinc-950 shadow-sm transition active:scale-90"
        >
          {favorite ? <FaHeart className="text-red-500" /> : <FiHeart />}
        </button>
      </div>
    </article>
  );
}

function SummaryRow({ label, value, valueClass = "text-zinc-950" }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <p className="font-normal text-zinc-500">{label}</p>
      <p className={`font-medium ${valueClass}`}>{value}</p>
    </div>
  );
}