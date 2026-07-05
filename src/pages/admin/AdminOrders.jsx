import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTruck,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import {
  adminOrdersApi,
  listAdmin,
  metaAdmin,
} from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";
import { useLocation } from "react-router-dom";

const statusFilters = [
  { value: "", label: "Hamısı" },
  { value: "1", label: "Yeni sifariş" },
  { value: "2", label: "Qəbul olundu" },
  { value: "3", label: "Hazırlanır" },
  { value: "4", label: "Çatdırılmaya çıxıb" },
  { value: "5", label: "Çatdırıldı" },
  { value: "6", label: "Ləğv edildi" },
  { value: "7", label: "Rədd edildi" },
];

function getStatusInfo(status) {
  switch (Number(status)) {
    case 1:
      return {
        label: "Yeni sifariş",
        className: "bg-orange-50 text-orange-600",
        dot: "bg-orange-500",
      };
    case 2:
      return {
        label: "Qəbul olundu",
        className: "bg-blue-50 text-[#244989]",
        dot: "bg-[#244989]",
      };
    case 3:
      return {
        label: "Hazırlanır",
        className: "bg-purple-50 text-purple-600",
        dot: "bg-purple-500",
      };
    case 4:
      return {
        label: "Çatdırılmaya çıxıb",
        className: "bg-cyan-50 text-cyan-700",
        dot: "bg-cyan-500",
      };
    case 5:
      return {
        label: "Çatdırıldı",
        className: "bg-green-50 text-green-700",
        dot: "bg-green-600",
      };
    case 6:
      return {
        label: "Ləğv edildi",
        className: "bg-red-50 text-red-600",
        dot: "bg-red-500",
      };
    case 7:
      return {
        label: "Rədd edildi",
        className: "bg-zinc-100 text-zinc-700",
        dot: "bg-zinc-500",
      };
    default:
      return {
        label: "Naməlum",
        className: "bg-zinc-50 text-zinc-500",
        dot: "bg-zinc-400",
      };
  }
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).replace("T", " ").slice(0, 16);
  }

  return date.toLocaleString("az-AZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(value) {
  return `${Number(value || 0).toFixed(2)} ₼`;
}

function deliveryTypeText(value) {
  if (Number(value) === 1) return "Ünvana çatdırılma";
  if (Number(value) === 2) return "Mağazadan götürmə";
  return "—";
}

export default function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [meta, setMeta] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();

  const basePath = location.pathname.startsWith("/Admin")
      ? "/Admin"
      : "/SuperAdmin";

  useEffect(() => {
    loadOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function loadOrders(page = 1) {
    try {
      setError("");
      setLoading(true);

      const res = await adminOrdersApi.list({
        page,
        pageSize: 20,
        search,
        status,
      });

      setOrders(listAdmin(res));
      setMeta(metaAdmin(res));
    } catch (err) {
      setError(err.message || "Sifarişlər yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  function openOrder(orderId) {
    navigate(`${basePath}/orders/${orderId}`);
  }

  const counters = useMemo(() => {
    return statusFilters
      .filter((x) => x.value)
      .map((x) => ({
        ...x,
        count: orders.filter((order) => String(order.status) === x.value)
          .length,
        info: getStatusInfo(x.value),
      }));
  }, [orders]);

  if (loading) return <AppLoader text="Sifarişlər yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Admin sifarişlər
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            Sifarişlər
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Sifarişə kliklə, bütün detalları ayrıca səhifədə aç.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadOrders(meta.page)}
          className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#244989] px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <FiRefreshCw />
          Yenilə
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_230px_130px]">
        <div className="flex h-13 items-center gap-3 rounded-[16px] border border-zinc-100 bg-white px-4">
          <FiSearch className="text-zinc-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadOrders(1);
            }}
            placeholder="Sifariş nömrəsi, müştəri adı və ya telefon ilə axtar"
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-13 rounded-[16px] border border-zinc-100 bg-white px-4 text-sm font-bold outline-none focus:border-zinc-400"
        >
          {statusFilters.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => loadOrders(1)}
          className="flex h-13 items-center justify-center gap-2 rounded-[16px] bg-zinc-950 text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <FiSearch />
          Axtar
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {counters.map((item) => (
          <div
            key={item.value}
            className="rounded-[22px] bg-white p-4 shadow-[0_14px_42px_rgba(0,0,0,0.035)] transition hover:-translate-y-1 active:scale-[0.98]"
          >
            <div className={`mb-3 h-2 w-2 rounded-full ${item.info.dot}`} />
            <p className="text-xs font-extrabold text-zinc-400">
              {item.label}
            </p>
            <h3 className="mt-1 text-[26px] font-extrabold tracking-[-0.04em]">
              {item.count}
            </h3>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-[0.14em] text-zinc-400">
                <th className="px-5 py-4">Sifariş</th>
                <th className="px-5 py-4">Müştəri</th>
                <th className="px-5 py-4">Telefon</th>
                <th className="px-5 py-4">Çatdırılma</th>
                <th className="px-5 py-4">Məbləğ</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Bax</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);

                return (
                  <tr
                    key={order.id}
                    onClick={() => openOrder(order.id)}
                    className="cursor-pointer border-b border-zinc-50 transition hover:bg-zinc-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#244989]/8 text-[#244989]">
                          <FiShoppingBag />
                        </div>

                        <div>
                          <p className="font-extrabold text-zinc-950">
                            {order.orderNumber || "Sifariş nömrəsi yoxdur"}
                          </p>
                          <p className="text-xs font-bold text-zinc-400">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-bold">
                      <div className="flex items-center gap-2">
                        <FiUsers className="text-zinc-400" />
                        {order.customerFullName || "Müştəri adı yoxdur"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-bold">
                      {order.customerPhoneNumber || "—"}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold">
                      <div className="flex items-center gap-2">
                        <FiTruck className="text-zinc-400" />
                        {deliveryTypeText(order.deliveryType)}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-extrabold text-[#244989]">
                      {money(order.totalPrice)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openOrder(order.id);
                          }}
                          className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.94]"
                        >
                          <FiEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-sm font-bold text-zinc-400"
                  >
                    Sifariş tapılmadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-bold text-zinc-500">
            Cəmi: {meta.totalCount} sifariş · Səhifə {meta.page} /{" "}
            {meta.totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!meta.hasPreviousPage}
              onClick={() => loadOrders(meta.page - 1)}
              className="flex h-10 items-center gap-2 rounded-[14px] bg-zinc-50 px-4 text-sm font-extrabold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiChevronLeft />
              Əvvəlki
            </button>

            <button
              type="button"
              disabled={!meta.hasNextPage}
              onClick={() => loadOrders(meta.page + 1)}
              className="flex h-10 items-center gap-2 rounded-[14px] bg-zinc-50 px-4 text-sm font-extrabold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Növbəti
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}