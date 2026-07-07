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
import { formatDateTime, getOrderStatus, money } from "../../helpers/orderStatus";

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
        Number(a.displayOrder || 999999) - Number(b.displayOrder || 999999)
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

  useEffect(() => {
    loadOrders();
  }, []);

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
      })
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
          .filter(Boolean)
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
      })
    );

    setProductDetails(loaded);
  }

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 z-[9999999999] grid min-h-screen w-screen place-items-center bg-[#fafafa]">
        <AppLoader text={text.loading} />
      </div>,
      document.body
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-7 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1180px]">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-zinc-950 shadow-[0_12px_35px_rgba(0,0,0,0.06)] transition hover:-translate-x-0.5 active:scale-95"
        >
          <FiChevronLeft />
        </button>

        <div className="mb-7 animate-[ordersUp_.42s_cubic-bezier(.22,1,.36,1)_both] text-center">
          <p className="text-[15px] font-medium tracking-[0.17em] text-zinc-400">
            nemesisbaku
          </p>

          <h1 className="mt-2 text-[34px] font-medium tracking-[-0.045em] text-zinc-950 md:text-[46px]">
            {text.myOrders}
          </h1>

          <p className="mx-auto mt-2 max-w-[520px] text-sm font-normal leading-6 text-zinc-500">
            {text.myOrdersDesc}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-[14px] bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="grid min-h-[380px] place-items-center rounded-[18px] bg-white px-5 text-center shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
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
          <section className="grid gap-3">
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

      <style>{`
        @keyframes ordersUp {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes orderCard {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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
      className="group cursor-pointer animate-[orderCard_.42s_cubic-bezier(.22,1,.36,1)_both] rounded-[18px] bg-white p-4 shadow-[0_14px_40px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(0,0,0,0.07)]"
      style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="flex shrink-0 -space-x-4 pt-1">
          {visibleItems.length > 0 ? (
            visibleItems.map((item, itemIndex) => {
              const image = getItemFinalImage(item, productDetails);

              return (
                <div
                  key={item.id || getProductId(item) || itemIndex}
                  className="relative h-16 w-16 overflow-hidden rounded-[16px] bg-zinc-100 ring-2 ring-white"
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
            <div className="grid h-16 w-16 place-items-center rounded-[16px] bg-zinc-100 text-zinc-300 ring-2 ring-white">
              <FiPackage />
            </div>
          )}

          {extraCount > 0 && (
            <div className="relative grid h-16 w-16 place-items-center rounded-[16px] bg-zinc-950 text-sm font-medium text-white ring-2 ring-white">
              +{extraCount}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
            {text.orderNumber}
          </p>

          <h2 className="mt-1 truncate text-lg font-medium tracking-[-0.025em] text-zinc-950">
            {order.orderNumber}
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            {formatDateTime(order.createdAt)}
          </p>

          {items.length > 0 && (
            <p className="mt-2 line-clamp-1 text-sm font-medium text-zinc-500">
              {items.map(getItemName).join(", ")}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <span
            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${status.color}`}
          >
            {status.label}
          </span>

          <p className="mt-3 text-xl font-medium text-zinc-950">
            {money(order.totalPrice)} ₼
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
        <p className="text-sm font-medium text-zinc-400">
          {text.viewOrderDetails}
        </p>

        <FiChevronRight className="text-xl text-zinc-400 transition group-hover:translate-x-1 group-hover:text-zinc-950" />
      </div>
    </article>
  );
}