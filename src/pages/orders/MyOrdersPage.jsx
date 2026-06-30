import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronRight, FiPackage } from "react-icons/fi";
import AppLoader from "../../components/common/AppLoader";
import { ordersApi } from "../../api/ordersApi";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatDateTime, getOrderStatus, money } from "../../helpers/orderStatus";

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const { text } = useLanguage();

  const [orders, setOrders] = useState([]);
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

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || text.ordersLoadError);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <AppLoader text={text.loading} />;

  return (
    <main className="min-h-screen bg-[#fafafa] px-5 py-7 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-7 animate-[ordersUp_.42s_cubic-bezier(.22,1,.36,1)_both] text-center">
          <p className="text-[15px] font-medium  tracking-[0.17em] text-zinc-400">
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
            {orders.map((order, index) => {
              const status = getOrderStatus(order.status, text);

              return (
                <article
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="group cursor-pointer animate-[orderCard_.42s_cubic-bezier(.22,1,.36,1)_both] rounded-[18px] bg-white p-4 shadow-[0_14px_40px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(0,0,0,0.07)]"
                  style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                        {text.orderNumber}
                      </p>

                      <h2 className="mt-1 truncate text-lg font-medium tracking-[-0.025em] text-zinc-950">
                        {order.orderNumber}
                      </h2>

                      <p className="mt-2 text-sm text-zinc-500">
                        {formatDateTime(order.createdAt)}
                      </p>
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
            })}
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