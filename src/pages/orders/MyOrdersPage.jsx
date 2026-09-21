import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiImage,
  FiPackage,
} from "react-icons/fi";
import AppLoader from "../../components/common/AppLoader";
import { ordersApi } from "../../api/ordersApi";
import { apiFetch } from "../../api/apiFetch";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  formatDateTime,
  getOrderStatus,
  money,
} from "../../helpers/orderStatus";
import "./myOrdersPage.css";

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

function getOrderItems(order) {
  return order?.items || order?.orderItems || [];
}

function getProductId(item) {
  return (
    item?.productId ||
    item?.product?.id ||
    item?.productDto?.id ||
    item?.productDetail?.id ||
    ""
  );
}

function getItemName(item) {
  return item?.productName || item?.name || item?.product?.name || "Məhsul";
}

function getDirectItemImage(item) {
  return (
    item?.mainImageUrl ||
    item?.productMainImageUrl ||
    item?.productImageUrl ||
    item?.imageUrl ||
    item?.image ||
    item?.photoUrl ||
    item?.product?.mainImageUrl ||
    item?.product?.imageUrl ||
    ""
  );
}

function getProductMainImage(product) {
  if (!product) return "";

  const images = Array.isArray(product.images) ? product.images : [];

  const mainImage = images.find((img) => img?.isMain && img?.imageUrl);
  if (mainImage?.imageUrl) return mainImage.imageUrl;

  const firstImage = images
    .filter((img) => img?.imageUrl)
    .sort(
      (a, b) =>
        Number(a.displayOrder || 999999) - Number(b.displayOrder || 999999),
    )[0];

  return (
    firstImage?.imageUrl ||
    product?.mainImageUrl ||
    product?.imageUrl ||
    product?.image ||
    ""
  );
}

function getItemFinalImage(item, productDetails) {
  const direct = getDirectItemImage(item);
  if (direct) return direct;

  const productId = getProductId(item);
  if (!productId) return "";

  return getProductMainImage(productDetails[productId]);
}

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const { text } = useLanguage();

  const [orders, setOrders] = useState([]);
  const [productDetails, setProductDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const res = await ordersApi.my();
      const data = unwrap(res);
      const list = Array.isArray(data) ? data : [];

      const detailedOrders = await Promise.all(
        list.map(async (order) => {
          try {
            const detailRes = await ordersApi.detail(order.id);
            const detail = unwrap(detailRes);

            return {
              ...order,
              ...detail,
              items:
                detail?.items ||
                detail?.orderItems ||
                order?.items ||
                order?.orderItems ||
                [],
            };
          } catch {
            return order;
          }
        }),
      );

      setOrders(detailedOrders);
      await loadProductsForOrders(detailedOrders);
    } catch (err) {
      setError(err.message || text.ordersLoadError);
    } finally {
      setLoading(false);
    }
  }

  async function loadProductsForOrders(nextOrders) {
    const productIds = [
      ...new Set(
        nextOrders
          .flatMap((order) => getOrderItems(order))
          .map((item) => getProductId(item))
          .filter(Boolean),
      ),
    ];

    const loaded = {};

    await Promise.all(
      productIds.map(async (productId) => {
        try {
          const res = await apiFetch(`/api/Products/${productId}`);
          loaded[productId] = unwrap(res);
        } catch {
          loaded[productId] = null;
        }
      }),
    );

    setProductDetails(loaded);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders();
    // The initial request intentionally runs once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 z-[9999999999] grid h-dvh w-full place-items-center overflow-hidden bg-[#fafafa]">
        <AppLoader text={text.loading} />
      </div>,
      document.body,
    );
  }

  return (
    <main className="orders-page min-h-dvh w-full overflow-x-clip bg-[#fafafa] px-3 py-5 sm:px-5 sm:py-7 md:px-8 md:py-10">
      <div className="orders-page__shell mx-auto w-full min-w-0 max-w-[1180px]">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="orders-page__back mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-zinc-950 shadow-[0_12px_35px_rgba(0,0,0,0.06)] transition active:scale-95"
        >
          <FiChevronLeft />
        </button>

        <div className="orders-page__header mb-7 text-center">
          <p className="text-[15px] font-medium tracking-[0.17em] text-zinc-400">
            nemesisbaku
          </p>

          <h1 className="mt-2 text-[34px] font-medium tracking-[-0.045em] text-zinc-950 md:text-[46px]">
            {text.myOrders}
          </h1>

          <p className="mx-auto mt-2 max-w-[520px] text-sm font-normal leading-6 text-zinc-500">
            {text.myOrdersDesc}
          </p>

          {orders.length > 0 && (
            <span className="orders-page__count mt-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600">
              <FiPackage />
              {orders.length}
            </span>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="orders-page__error rounded-[14px] bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
          >
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="orders-page__empty grid min-h-[380px] place-items-center rounded-[18px] bg-white px-5 text-center shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
            <div>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-[18px] bg-zinc-50 text-3xl text-zinc-400">
                <FiPackage />
              </div>

              <h2 className="mt-4 text-[24px] font-medium tracking-[-0.035em] text-zinc-950">
                {text.ordersEmptyTitle}
              </h2>

              <p className="mx-auto mt-2 max-w-[380px] text-sm leading-6 text-zinc-500">
                {text.ordersEmptyDesc}
              </p>
            </div>
          </div>
        ) : (
          <section className="orders-page__list grid min-w-0 gap-3">
            {orders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                index={index}
                text={text}
                productDetails={productDetails}
                onOpen={() => navigate(`/orders/${order.id}`)}
              />
            ))}
          </section>
        )}
      </div>

    </main>
  );
}

function OrderCard({ order, index, text, productDetails, onOpen }) {
  const status = getOrderStatus(order.status, text);

  const items = useMemo(() => getOrderItems(order), [order]);
  const visibleItems = items.slice(0, 4);
  const extraCount = Math.max(0, items.length - visibleItems.length);

  return (
    <article
      onClick={onOpen}
      className="order-card group w-full min-w-0 cursor-pointer overflow-hidden rounded-[18px] bg-white p-3 shadow-[0_14px_40px_rgba(0,0,0,0.04)] sm:p-4"
      style={{ "--order-delay": `${Math.min(index * 45, 360)}ms` }}
    >
      <div className="grid min-w-0 gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start sm:gap-4">
        <div className="order-2 flex max-w-full min-w-0 shrink-0 -space-x-3 overflow-hidden py-1 sm:order-1 sm:-space-x-4 sm:pt-1">
          {visibleItems.length > 0 ? (
            visibleItems.map((item, itemIndex) => {
              const image = getItemFinalImage(item, productDetails);

              return (
                <div
                  key={item.id || getProductId(item) || itemIndex}
                  className="order-card__image relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-zinc-100 ring-2 ring-white sm:h-16 sm:w-16 sm:rounded-[16px]"
                  title={getItemName(item)}
                >
                  {image ? (
                    <img
                      src={image}
                      alt={getItemName(item)}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      draggable="false"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-zinc-300">
                      <FiImage />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[14px] bg-zinc-100 text-zinc-300 ring-2 ring-white sm:h-16 sm:w-16 sm:rounded-[16px]">
              <FiPackage />
            </div>
          )}

          {extraCount > 0 && (
            <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-[14px] bg-zinc-950 text-xs font-medium text-white ring-2 ring-white sm:h-16 sm:w-16 sm:rounded-[16px] sm:text-sm">
              +{extraCount}
            </div>
          )}
        </div>

        <div className="order-1 min-w-0 sm:order-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
            {text.orderNumber}
          </p>

          <h2 className="mt-1 truncate text-base font-medium tracking-[-0.025em] text-zinc-950 sm:text-lg">
            {order.orderNumber}
          </h2>

          <p className="mt-1.5 text-xs text-zinc-500 sm:mt-2 sm:text-sm">
            {formatDateTime(order.createdAt)}
          </p>

          {items.length > 0 && (
            <p className="mt-2 line-clamp-2 break-words text-xs font-medium leading-5 text-zinc-500 sm:line-clamp-1 sm:text-sm">
              {items.map(getItemName).join(", ")}
            </p>
          )}
        </div>

        <div className="order-3 flex min-w-0 items-center justify-between gap-3 border-t border-zinc-100 pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right">
          <span
            className={`inline-flex max-w-[58%] items-center justify-center rounded-full border px-2.5 py-1.5 text-center text-[11px] font-medium leading-4 sm:max-w-none sm:px-3 sm:text-xs ${status.color}`}
          >
            {status.label}
          </span>

          <p className="shrink-0 whitespace-nowrap text-lg font-medium text-zinc-950 sm:mt-3 sm:text-xl">
            {money(order.totalPrice)} ₼
          </p>
        </div>
      </div>

      <div className="order-card__footer mt-3 flex min-w-0 items-center justify-between gap-3 border-t border-zinc-100 pt-3 sm:mt-4 sm:pt-4">
        <p className="min-w-0 truncate text-xs font-medium text-zinc-400 sm:text-sm">
          {text.viewOrderDetails}
        </p>

        <FiChevronRight className="text-xl text-zinc-400 transition group-hover:translate-x-1 group-hover:text-zinc-950" />
      </div>
    </article>
  );
}
