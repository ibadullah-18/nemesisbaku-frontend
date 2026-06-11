import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiEye,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiTruck,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { adminOrdersApi } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

const statuses = [
  { value: "", label: "Hamısı" },
  { value: "1", label: "Yeni sifariş" },
  { value: "2", label: "Qəbul olundu" },
  { value: "3", label: "Çatdırılmaya çıxdı" },
  { value: "4", label: "Tamamlandı" },
  { value: "5", label: "Ləğv edildi" },
];

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

function listOf(res) {
  const data = unwrap(res);

  return (
    data?.items ||
    data?.orders ||
    data?.result ||
    (Array.isArray(data) ? data : [])
  );
}

function statusText(status) {
  return statuses.find((x) => x.value === String(status))?.label || "Naməlum";
}

function deliveryTypeText(value) {
  if (value === 1) return "Çatdırılma";
  if (value === 2) return "Mağazadan götürmə";
  return "—";
}

function paymentMethodText(value) {
  if (value === 1) return "Nağd / qapıda ödəniş";
  if (value === 2) return "Kart";
  return "—";
}

function formatDate(value) {
  if (!value) return "—";
  return String(value).replace("T", " ").slice(0, 16);
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [status]);

  async function loadOrders() {
    try {
      setLoading(true);

      const res = await adminOrdersApi.list({
        page: 1,
        pageSize: 50,
        search,
        status,
      });

      setOrders(listOf(res));
    } finally {
      setLoading(false);
    }
  }

  async function openOrder(id) {
    try {
      setDetailLoading(true);
      const res = await adminOrdersApi.detail(id);
      setSelectedOrder(unwrap(res));
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      setSaving(true);

      await adminOrdersApi.updateStatus(orderId, {
        newStatus: Number(newStatus),
        note: statusText(newStatus),
      });

      await loadOrders();

      const detail = await adminOrdersApi.detail(orderId);
      setSelectedOrder(unwrap(detail));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppLoader text="Sifarişlər yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {(detailLoading || saving) && <AppLoader text="Yüklənir" />}

      <div className="mb-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
          Admin sifarişlər
        </p>

        <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
          Sifarişlər
        </h1>

        <p className="mt-1 text-sm font-medium text-zinc-500">
          Müştəri sifarişlərini görün, məhsullara baxın və statusu dəyişin.
        </p>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_120px]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sifariş nömrəsi və ya müştəri adı ilə axtar"
          className="h-13 rounded-[16px] border border-zinc-100 bg-white px-4 text-sm font-bold outline-none focus:border-zinc-400"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-13 rounded-[16px] border border-zinc-100 bg-white px-4 text-sm font-bold outline-none focus:border-zinc-400"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={loadOrders}
          className="flex h-13 items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white"
        >
          <FiRefreshCw />
          Axtar
        </button>
      </div>

      <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-[0.14em] text-zinc-400">
                <th className="px-5 py-4">Sifariş</th>
                <th className="px-5 py-4">Müştəri</th>
                <th className="px-5 py-4">Telefon</th>
                <th className="px-5 py-4">Məbləğ</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Bax</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => openOrder(order.id)}
                  className="cursor-pointer border-b border-zinc-50 transition hover:bg-zinc-50"
                >
                  <td className="px-5 py-4">
                    <p className="font-extrabold text-zinc-950">
                      {order.orderNumber || "—"}
                    </p>
                    <p className="text-xs font-bold text-zinc-400">
                      {formatDate(order.createdAt)}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm font-bold">
                    {order.customerFullName || "Müştəri"}
                  </td>

                  <td className="px-5 py-4 text-sm font-bold">
                    {order.customerPhoneNumber || "—"}
                  </td>

                  <td className="px-5 py-4 text-sm font-extrabold text-[#244989]">
                    {order.totalPrice || 0} ₼
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-zinc-50 px-3 py-1 text-xs font-extrabold text-zinc-700">
                      {statusText(order.status)}
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
                        className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-700"
                      >
                        <FiEye />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-10 text-center text-sm font-bold text-zinc-400"
                  >
                    Sifariş tapılmadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={updateOrderStatus}
        />
      )}
    </div>
  );
}

function OrderDetailModal({ order, onClose, onStatusChange }) {
  const items = order.items || order.orderItems || [];
  const currentStatus = Number(order.status);

  const canAccept = currentStatus < 2;
  const canOutForDelivery = currentStatus < 3 && currentStatus !== 5;
  const canComplete = currentStatus < 4 && currentStatus !== 5;
  const canCancel = currentStatus !== 4 && currentStatus !== 5;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/25 px-4 py-5 backdrop-blur-[2px]">
      <div className="relative max-h-[calc(100vh-40px)] w-full max-w-[1120px] overflow-y-auto rounded-[34px] bg-white p-5 shadow-[0_30px_100px_rgba(0,0,0,0.18)] md:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-800"
        >
          <FiX />
        </button>

        <div className="mb-6 pr-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#244989]">
            Sifariş detalları
          </p>

          <h2 className="mt-2 text-[30px] font-extrabold tracking-[-0.045em] text-zinc-950 md:text-[42px]">
            {order.orderNumber || "Sifariş"}
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>{statusText(order.status)}</Badge>
            <Badge>{deliveryTypeText(order.deliveryType)}</Badge>
            <Badge>{paymentMethodText(order.paymentMethod)}</Badge>
            {order.isWhatsappMessageSent && <Badge>WhatsApp göndərilib</Badge>}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_370px]">
          <section className="space-y-4">
            <div className="rounded-[24px] bg-zinc-50 p-4">
              <h3 className="mb-3 text-sm font-extrabold text-zinc-950">
                Məhsullar
              </h3>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.productVariantId || item.id || index}
                    className="grid gap-3 rounded-[20px] bg-white p-3 sm:grid-cols-[84px_1fr_auto]"
                  >
                    <div className="h-24 w-24 overflow-hidden rounded-[18px] bg-zinc-50 sm:h-[84px] sm:w-[84px]">
                      {item.productImageUrl ? (
                        <img
                          src={item.productImageUrl}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs font-bold text-zinc-300">
                          N
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-base font-extrabold text-zinc-950">
                        {item.productName || "Məhsul"}
                      </p>

                      <p className="mt-1 text-xs font-bold text-zinc-400">
                        Kod: {item.productCode || "—"}
                      </p>

                      <p className="mt-2 text-sm font-bold text-zinc-600">
                        Razmer: {item.sizeValue || "—"} / Rəng:{" "}
                        {item.colorName || "—"}
                      </p>

                      {item.productLink && (
                        <a
                          href={item.productLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-xs font-extrabold text-[#244989]"
                        >
                          Məhsula bax
                        </a>
                      )}
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-sm font-extrabold text-[#244989]">
                        {item.totalPrice || 0} ₼
                      </p>
                      <p className="mt-1 text-xs font-bold text-zinc-400">
                        {item.unitPrice || 0} ₼ x {item.quantity || 1}
                      </p>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="text-sm font-bold text-zinc-400">
                    Məhsul məlumatı yoxdur.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[24px] bg-zinc-50 p-4">
              <h3 className="mb-3 text-sm font-extrabold text-zinc-950">
                Ünvan və çatdırılma
              </h3>

              <div className="grid gap-3 md:grid-cols-2">
                <Info
                  icon={<FiMapPin />}
                  label="Ünvan"
                  value={order.addressText}
                />
                <Info label="Bina" value={order.buildingNumber} />
                <Info label="Mərtəbə" value={order.floor} />
                <Info label="Mənzil" value={order.apartment} />
                <Info label="Məsafə" value={order.deliveryDistanceKm ? `${order.deliveryDistanceKm} km` : "—"} />
                <Info label="Çatdırılma qiyməti" value={`${order.deliveryPrice || 0} ₼`} />
                <Info label="Çatdırılma tarixi" value={formatDate(order.deliveryDate)} />
                <Info label="Saat aralığı" value={order.deliveryTimeRange} />
              </div>

              {(order.latitude || order.longitude) && (
                <a
                  href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex h-11 items-center justify-center rounded-[16px] bg-white px-4 text-sm font-extrabold text-[#244989]"
                >
                  Xəritədə aç
                </a>
              )}

              {order.note && (
                <div className="mt-3 rounded-[18px] bg-white p-3">
                  <p className="text-xs font-bold text-zinc-400">Qeyd</p>
                  <p className="mt-1 text-sm font-extrabold text-zinc-800">
                    {order.note}
                  </p>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[24px] bg-zinc-50 p-4">
              <h3 className="mb-4 text-sm font-extrabold text-zinc-950">
                Müştəri
              </h3>

              <Info label="Ad Soyad" value={order.customerFullName} />
              <Info icon={<FiPhone />} label="Telefon" value={order.customerPhoneNumber} />
              <Info label="Yaradılma tarixi" value={formatDate(order.createdAt)} />
              <Info label="WhatsApp status" value={order.isWhatsappMessageSent ? `Göndərilib ${formatDate(order.whatsappMessageSentAt)}` : "Göndərilməyib"} />
            </div>

            <div className="rounded-[24px] bg-zinc-50 p-4">
              <h3 className="mb-4 text-sm font-extrabold text-zinc-950">
                Qiymət
              </h3>

              <Info label="Məhsullar" value={`${order.totalProductPrice || 0} ₼`} />
              <Info label="Promo endirim" value={`${order.promoDiscountAmount || 0} ₼`} />
              <Info label="Çatdırılma" value={`${order.deliveryPrice || 0} ₼`} />

              <div className="rounded-[18px] bg-white p-3">
                <p className="text-xs font-bold text-zinc-400">Yekun</p>
                <p className="mt-1 text-[26px] font-extrabold text-[#244989]">
                  {order.totalPrice || 0} ₼
                </p>
              </div>
            </div>

            <div className="rounded-[24px] bg-zinc-50 p-4">
              <h3 className="mb-4 text-sm font-extrabold text-zinc-950">
                Status dəyiş
              </h3>

              <div className="space-y-2">
                <StatusButton
                  disabled={!canAccept}
                  icon={<FiCheckCircle />}
                  text="Sifariş qəbul olundu"
                  onClick={() => onStatusChange(order.id, 2)}
                />

                <StatusButton
                  disabled={!canOutForDelivery}
                  icon={<FiTruck />}
                  text="Çatdırılmaya çıxdı"
                  dark
                  onClick={() => onStatusChange(order.id, 3)}
                />

                <StatusButton
                  disabled={!canComplete}
                  icon={<FiClock />}
                  text="Tamamlandı"
                  green
                  onClick={() => onStatusChange(order.id, 4)}
                />

                <StatusButton
                  disabled={!canCancel}
                  icon={<FiXCircle />}
                  text="Ləğv et"
                  red
                  onClick={() => onStatusChange(order.id, 5)}
                />
              </div>

              <p className="mt-3 text-xs font-bold leading-5 text-zinc-400">
                Qeyd: Əgər status dəyişdi, amma WhatsApp mesajı getmədisə,
                problem frontend-də deyil. Backend-in status update endpointində
                WhatsApp göndərmə logunu yoxlamaq lazımdır.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="rounded-full bg-zinc-50 px-3 py-1 text-xs font-extrabold text-zinc-700">
      {children}
    </span>
  );
}

function Info({ icon, label, value }) {
  return (
    <div className="rounded-[18px] bg-white p-3">
      <div className="flex items-center gap-2">
        {icon && <span className="text-[#244989]">{icon}</span>}
        <p className="text-xs font-bold text-zinc-400">{label}</p>
      </div>

      <p className="mt-1 text-sm font-extrabold text-zinc-800">
        {value || "—"}
      </p>
    </div>
  );
}

function StatusButton({ text, icon, onClick, disabled, dark, green, red }) {
  let cls = "bg-[#244989] text-white";

  if (dark) cls = "bg-zinc-950 text-white";
  if (green) cls = "bg-green-600 text-white";
  if (red) cls = "bg-red-50 text-red-600";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-[16px] text-sm font-extrabold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 ${cls}`}
    >
      {icon}
      {text}
    </button>
  );
}