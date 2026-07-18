import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiPackage,
  FiTruck,
  FiX,
} from "react-icons/fi";
import AppLoader from "../../components/common/AppLoader";
import { ordersApi } from "../../api/ordersApi";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  formatDate,
  formatDateTime,
  getOrderStatus,
  money,
} from "../../helpers/orderStatus";

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

const timeline = [
  { status: 1, icon: FiClock, key: "pending" },
  { status: 2, icon: FiCheck, key: "confirmed" },
  { status: 3, icon: FiPackage, key: "preparing" },
  { status: 4, icon: FiTruck, key: "onDelivery" },
  { status: 5, icon: FiCheck, key: "delivered" },
];

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { text } = useLanguage();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const status = useMemo(
    () => getOrderStatus(order?.status, text),
    [order?.status, text],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    loadOrder();
  }, [id]);

  async function loadOrder() {
    try {
      setLoading(true);
      setError("");

      const res = await ordersApi.detail(id);
      setOrder(unwrap(res));
    } catch (err) {
      setError(err.message || text.orderDetailLoadError);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100dvh-72px)] bg-[#fafafa]">
        <AppLoader text={text.loading} />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-[#fafafa] px-5 py-10 text-center">
        <p className="font-medium text-red-600">
          {error || text.orderNotFound}
        </p>
      </main>
    );
  }

  const isBadStatus = Number(order.status) === 6 || Number(order.status) === 7;

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-7 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1180px]">
        <button
          type="button"
          onClick={() => navigate("/orders")}
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:-translate-x-0.5 active:scale-[0.98]"
        >
          <FiArrowLeft />
          {text.backToOrders}
        </button>

        <section className="grid gap-5 lg:grid-cols-[1fr_370px]">
          <div className="space-y-5">
            <div className="animate-[detailsUp_.42s_cubic-bezier(.22,1,.36,1)_both] rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                    {text.orderNumber}
                  </p>

                  <h1 className="mt-2 text-[28px] font-medium tracking-[-0.045em] text-zinc-950 md:text-[40px]">
                    {order.orderNumber}
                  </h1>

                  <p className="mt-2 text-sm text-zinc-500">
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${status.color}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="mt-7">
                {isBadStatus ? (
                  <div className="flex items-center gap-3 rounded-[16px] bg-red-50 px-4 py-4 text-red-700">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-red-600 text-white">
                      <FiX />
                    </span>
                    <div>
                      <p className="font-medium">{status.label}</p>
                      <p className="text-sm text-red-600/80">
                        {text.orderStoppedDesc}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Desktop / Tablet */}
                    <div className="hidden items-center gap-2 md:flex">
                      {timeline.map((step, index) => {
                        const active = Number(order.status) >= step.status;
                        const current = Number(order.status) === step.status;
                        const Icon = step.icon;

                        return (
                          <div
                            key={step.status}
                            className="flex flex-1 items-center"
                          >
                            <div
                              className={`flex min-h-[112px] flex-1 flex-col items-center justify-center rounded-[16px] border px-3 py-4 text-center transition-all duration-300 ${
                                active
                                  ? "border-zinc-950 bg-zinc-950 text-white shadow-[0_16px_35px_rgba(0,0,0,0.12)]"
                                  : "border-zinc-100 bg-zinc-50 text-zinc-400"
                              } ${current ? "scale-[1.03]" : ""}`}
                            >
                              <span
                                className={`grid h-10 w-10 place-items-center rounded-full ${
                                  active ? "bg-white text-zinc-950" : "bg-white"
                                }`}
                              >
                                <Icon />
                              </span>

                              <p className="mt-3 text-xs font-medium leading-4">
                                {text.orderStatuses?.[step.key]}
                              </p>
                            </div>

                            {index !== timeline.length - 1 && (
                              <div
                                className={`mx-2 text-2xl transition ${
                                  Number(order.status) > step.status
                                    ? "text-zinc-950"
                                    : "text-zinc-300"
                                }`}
                              >
                                →
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden">
                      {timeline.map((step, index) => {
                        const active = Number(order.status) >= step.status;
                        const current = Number(order.status) === step.status;
                        const Icon = step.icon;

                        return (
                          <div
                            key={step.status}
                            className="relative flex gap-3 pb-5 last:pb-0"
                          >
                            {index !== timeline.length - 1 && (
                              <div
                                className={`absolute left-[17px] top-9 h-full w-px ${
                                  Number(order.status) > step.status
                                    ? "bg-zinc-950"
                                    : "bg-zinc-200"
                                }`}
                              />
                            )}

                            <div
                              className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border transition ${
                                active
                                  ? "border-zinc-950 bg-zinc-950 text-white"
                                  : "border-zinc-200 bg-white text-zinc-400"
                              } ${current ? "scale-110" : ""}`}
                            >
                              <Icon className="text-[15px]" />
                            </div>

                            <div
                              className={`flex-1 rounded-[14px] border px-4 py-3 transition ${
                                current
                                  ? "border-zinc-950 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.06)]"
                                  : "border-zinc-100 bg-white/70"
                              }`}
                            >
                              <p
                                className={`text-sm font-medium ${
                                  active ? "text-zinc-950" : "text-zinc-400"
                                }`}
                              >
                                {text.orderStatuses?.[step.key]}
                              </p>

                              {current && (
                                <p className="mt-1 text-xs text-zinc-400">
                                  {text.currentStep}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="animate-[detailsUp_.5s_cubic-bezier(.22,1,.36,1)_both] rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
              <h2 className="text-xl font-medium tracking-[-0.03em] text-zinc-950">
                {text.orderedProducts}
              </h2>

              <div className="mt-5 divide-y divide-zinc-100">
                {(order.items || []).map((item, index) => (
                  <article
                    key={`${item.productId}-${item.productVariantId}-${index}`}
                    onClick={() => navigate(`/products/${item.productId}`)}
                    className="grid cursor-pointer grid-cols-[86px_1fr] gap-3 py-4 transition hover:bg-zinc-50 md:grid-cols-[104px_1fr_auto]"
                  >
                    <img
                      src={item.productImageUrl}
                      alt={item.productName}
                      className="h-[104px] w-[86px] rounded-[16px] object-cover md:h-[124px] md:w-[104px]"
                    />

                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-[15px] font-medium leading-5 text-zinc-950 md:text-[17px]">
                        {item.productName}
                      </h3>

                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-zinc-400">
                        {item.productCode}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700">
                          {text.size}: {item.sizeValue}
                        </span>

                        <span className="rounded-full bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700">
                          {item.colorName}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2 text-right md:col-span-1">
                      <p className="text-lg font-medium text-zinc-950">
                        {money(item.totalPrice)} ₼
                      </p>
                      <p className="text-xs text-zinc-400">
                        {money(item.unitPrice)} ₼ × {item.quantity}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="animate-[detailsUp_.58s_cubic-bezier(.22,1,.36,1)_both] rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
              <h2 className="text-xl font-medium tracking-[-0.03em] text-zinc-950">
                {text.deliveryInfo}
              </h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Info
                  label={text.customerFullName}
                  value={order.customerFullName}
                />
                <Info
                  label={text.customerPhoneNumber}
                  value={order.customerPhoneNumber}
                />
                <Info
                  label={text.deliveryDate}
                  value={formatDate(order.deliveryDate)}
                />
                <Info
                  label={text.deliveryTimeRange}
                  value={order.deliveryTimeRange}
                />
                <Info label={text.address} value={order.addressText} wide />
                <Info
                  label={text.buildingNumber}
                  value={order.buildingNumber}
                />
                <Info label={text.floor} value={order.floor} />
                <Info label={text.apartment} value={order.apartment} />
                <Info label={text.note} value={order.note || "-"} wide />
              </div>
            </div>
          </div>

          <aside className="h-max rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] lg:sticky lg:top-24">
            <h2 className="text-xl font-medium tracking-[-0.03em] text-zinc-950">
              {text.receipt}
            </h2>

            <div className="mt-5 space-y-3">
              <SummaryRow
                label={text.productsTotal}
                value={`${money(order.totalProductPrice)} ₼`}
              />

              <SummaryRow
                label={text.delivery}
                value={`${money(order.deliveryPrice)} ₼`}
              />

              {Number(order.promoDiscountAmount || 0) > 0 && (
                <SummaryRow
                  label={text.promoDiscount}
                  value={`-${money(order.promoDiscountAmount)} ₼`}
                  valueClass="text-red-500"
                />
              )}

              {order.deliveryDistanceKm ? (
                <SummaryRow
                  label={text.deliveryDistance}
                  value={`${money(order.deliveryDistanceKm)} km`}
                />
              ) : null}
            </div>

            <div className="my-5 h-px bg-zinc-100" />

            <div className="flex items-end justify-between">
              <p className="text-sm font-medium text-zinc-500">{text.total}</p>

              <p className="text-[30px] font-medium text-zinc-950">
                {money(order.totalPrice)} ₼
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-5 h-13 w-full rounded-[14px] bg-zinc-950 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98]"
            >
              {text.close}
            </button>
          </aside>
        </section>
      </div>

      <style>{`
        @keyframes detailsUp {
          from { opacity: 0; transform: translateY(18px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes timelineIn {
          from { opacity: 0; transform: translateY(10px) scale(.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </main>
  );
}

function Info({ label, value, wide }) {
  return (
    <div
      className={`rounded-[14px] bg-zinc-50 px-4 py-3 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-zinc-950">{value || "-"}</p>
    </div>
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
