import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiHash,
  FiHome,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiRefreshCw,
  FiShoppingBag,
  FiTruck,
  FiUser,
  FiXCircle,
} from "react-icons/fi";
import { adminOrdersApi, unwrapAdmin } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

const ORDER_STATUS = {
  Pending: 1,
  Confirmed: 2,
  Preparing: 3,
  OnDelivery: 4,
  Delivered: 5,
  Cancelled: 6,
  Rejected: 7,
};

const statusOptions = [
  { value: 1, label: "Yeni sifariş" },
  { value: 2, label: "Qəbul olundu" },
  { value: 3, label: "Hazırlanır" },
  { value: 4, label: "Çatdırılmaya çıxıb" },
  { value: 5, label: "Çatdırıldı" },
  { value: 6, label: "Ləğv edildi" },
  { value: 7, label: "Rədd edildi" },
];

function getStatusInfo(status) {
  switch (Number(status)) {
    case 1:
      return { label: "Yeni sifariş", className: "bg-orange-50 text-orange-600" };
    case 2:
      return { label: "Qəbul olundu", className: "bg-blue-50 text-[#244989]" };
    case 3:
      return { label: "Hazırlanır", className: "bg-purple-50 text-purple-600" };
    case 4:
      return { label: "Çatdırılmaya çıxıb", className: "bg-cyan-50 text-cyan-700" };
    case 5:
      return { label: "Çatdırıldı", className: "bg-green-50 text-green-700" };
    case 6:
      return { label: "Ləğv edildi", className: "bg-red-50 text-red-600" };
    case 7:
      return { label: "Rədd edildi", className: "bg-zinc-100 text-zinc-700" };
    default:
      return { label: "Naməlum", className: "bg-zinc-50 text-zinc-500" };
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

function paymentMethodText(value) {
  if (Number(value) === 1) return "Qapıda ödəniş";
  if (Number(value) === 2) return "Kartla ödəniş";
  return "—";
}

function getOrderItems(order) {
  return order?.items || order?.orderItems || [];
}

function getItemProductName(item) {
  return item?.productName || item?.name || item?.product?.name || "";
}

function getItemImage(item) {
  return (
    item?.imageUrl ||
    item?.productImageUrl ||
    item?.mainImageUrl ||
    item?.product?.imageUrl ||
    item?.product?.mainImageUrl ||
    null
  );
}

function getItemSize(item) {
  return (
    item?.sizeValue ||
    item?.size ||
    item?.variant?.sizeValue ||
    item?.productVariant?.sizeValue ||
    ""
  );
}

function getItemColor(item) {
  return (
    item?.colorName ||
    item?.color ||
    item?.variant?.colorName ||
    item?.productVariant?.colorName ||
    ""
  );
}

function getItemQuantity(item) {
  return Number(item?.quantity || item?.count || 0);
}

function getItemUnitPrice(item) {
  return Number(item?.unitPrice || item?.price || item?.productPrice || 0);
}

function getItemTotal(item) {
  return Number(item?.totalPrice || item?.total || getItemUnitPrice(item) * getItemQuantity(item));
}

function isBrokenItem(item) {
  return !getItemProductName(item) || !getItemSize(item) || !getItemColor(item);
}

export default function AdminOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadOrder() {
    try {
      setError("");
      setLoading(true);

      const res = await adminOrdersApi.detail(id);
      const data = unwrapAdmin(res);

      setOrder(data);
      setSelectedStatus(String(data?.status || ""));
    } catch (err) {
      setError(err.message || "Sifariş detalları yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(newStatus, note) {
    try {
      setSaving(true);
      setError("");

      await adminOrdersApi.updateStatus(id, {
        newStatus: Number(newStatus),
        note: note || getStatusInfo(newStatus).label,
      });

      await loadOrder();
    } catch (err) {
      setError(err.message || "Status dəyişdirilmədi.");
    } finally {
      setSaving(false);
    }
  }

  const items = getOrderItems(order);
  const statusInfo = getStatusInfo(order?.status);

  const warnings = useMemo(() => {
    return items
      .filter(isBrokenItem)
      .map((item, index) => {
        const name = getItemProductName(item) || `Məhsul #${index + 1}`;
        return `${name} məhsulunda variant məlumatı tapılmadı.`;
      });
  }, [items]);

  const quickActions = useMemo(() => {
    const current = Number(order?.status);

    if (current === ORDER_STATUS.Pending) {
      return [
        { label: "Təsdiqlə", icon: <FiCheckCircle />, status: ORDER_STATUS.Confirmed, className: "bg-[#244989] text-white" },
        { label: "Rədd et", icon: <FiXCircle />, status: ORDER_STATUS.Rejected, className: "bg-zinc-950 text-white" },
        { label: "Ləğv et", icon: <FiAlertTriangle />, status: ORDER_STATUS.Cancelled, className: "bg-red-50 text-red-600" },
      ];
    }

    if (current === ORDER_STATUS.Confirmed) {
      return [
        { label: "Hazırlanır", icon: <FiPackage />, status: ORDER_STATUS.Preparing, className: "bg-purple-50 text-purple-600" },
        { label: "Ləğv et", icon: <FiAlertTriangle />, status: ORDER_STATUS.Cancelled, className: "bg-red-50 text-red-600" },
      ];
    }

    if (current === ORDER_STATUS.Preparing) {
      return [
        { label: "Çatdırılmada", icon: <FiTruck />, status: ORDER_STATUS.OnDelivery, className: "bg-cyan-50 text-cyan-700" },
        { label: "Ləğv et", icon: <FiAlertTriangle />, status: ORDER_STATUS.Cancelled, className: "bg-red-50 text-red-600" },
      ];
    }

    if (current === ORDER_STATUS.OnDelivery) {
      return [
        { label: "Təhvil verildi", icon: <FiCheckCircle />, status: ORDER_STATUS.Delivered, className: "bg-green-50 text-green-700" },
      ];
    }

    return [];
  }, [order]);

  if (loading) return <AppLoader text="Sifariş açılır" />;

  if (!order) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-8">
        <div className="rounded-[24px] bg-red-50 p-5 text-sm font-extrabold text-red-600">
          Sifariş tapılmadı.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Status yenilənir" />}

      <button
        type="button"
        onClick={() => navigate("/SuperAdmin/orders")}
        className="mb-5 flex h-11 items-center gap-2 rounded-[15px] bg-white px-4 text-sm font-extrabold text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.97]"
      >
        <FiArrowLeft />
        Sifarişlərə qayıt
      </button>

      <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Admin sifariş detalları
          </p>

          <h1 className="mt-2 text-[30px] font-extrabold tracking-[-0.045em] md:text-[44px]">
            {order.orderNumber || "Sifariş"}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${statusInfo.className}`}>
              {statusInfo.label}
            </span>

            <span className="rounded-full bg-zinc-50 px-3 py-1 text-xs font-extrabold text-zinc-500">
              {formatDate(order.createdAt)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={loadOrder}
          className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-zinc-950 px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]"
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

      {warnings.length > 0 && (
        <div className="mb-5 rounded-[24px] border border-orange-100 bg-orange-50 p-5">
          <div className="flex items-center gap-3 text-orange-700">
            <FiAlertTriangle />
            <h2 className="font-extrabold">Sistem xəbərdarlığı</h2>
          </div>

          <div className="mt-3 space-y-2">
            {warnings.map((warning, index) => (
              <p key={index} className="text-sm font-bold text-orange-700">
                {warning}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <main className="space-y-5">
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard icon={<FiUser />} label="Müştəri" value={order.customerFullName || "—"} />
            <InfoCard icon={<FiPhone />} label="Telefon" value={order.customerPhoneNumber || "—"} />
            <InfoCard icon={<FiTruck />} label="Çatdırılma tipi" value={deliveryTypeText(order.deliveryType)} />
            <InfoCard icon={<FiCreditCard />} label="Ödəniş" value={paymentMethodText(order.paymentMethod)} />
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#244989]/8 text-[#244989]">
                <FiMapPin />
              </div>

              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                  Müştəri və ünvan məlumatları
                </h2>
                <p className="text-sm font-bold text-zinc-500">
                  Admin üçün lazımlı bütün çatdırılma detalları.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <MiniInfo icon={<FiMapPin />} label="Ünvan" value={order.addressText || order.address || "—"} />
              <MiniInfo icon={<FiHome />} label="Bina" value={order.buildingNumber || "—"} />
              <MiniInfo icon={<FiHash />} label="Mərtəbə" value={order.floor || "—"} />
              <MiniInfo icon={<FiHash />} label="Mənzil" value={order.apartment || "—"} />
              <MiniInfo icon={<FiClock />} label="Çatdırılma tarixi" value={formatDate(order.deliveryDate)} />
              <MiniInfo icon={<FiClock />} label="Saat aralığı" value={order.deliveryTimeRange || "—"} />
              <MiniInfo icon={<FiAlertTriangle />} label="Qeyd" value={order.note || "—"} />
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#244989]/8 text-[#244989]">
                <FiShoppingBag />
              </div>

              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                  Məhsullar
                </h2>
                <p className="text-sm font-bold text-zinc-500">
                  Şəkil, məhsul adı, ölçü, rəng, say və qiymət.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-[20px] bg-zinc-50 p-5 text-sm font-extrabold text-zinc-500">
                  Bu sifarişdə məhsul məlumatı gəlmədi.
                </div>
              ) : (
                items.map((item, index) => (
                  <ProductRow key={item.id || index} item={item} index={index} />
                ))
              )}
            </div>
          </section>
        </main>

        <aside className="space-y-5">
          <section className="rounded-[28px] bg-zinc-950 p-5 text-white">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">
              Ödəniş xülasəsi
            </h2>

            <div className="mt-5 space-y-3 text-sm font-bold">
              <PriceRow label="Məhsullar cəmi" value={money(order.itemsTotalPrice || order.subTotal || order.productsTotal)} />
              <PriceRow label="Promo endirim" value={`-${money(order.promoDiscount || order.discountAmount)}`} />
              <PriceRow label="Çatdırılma" value={money(order.deliveryPrice)} />
              <div className="h-px bg-white/10" />
              <PriceRow label="Yekun məbləğ" value={money(order.totalPrice)} big />
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">
              Status dəyiş
            </h2>

            <p className="mt-1 text-sm font-bold text-zinc-500">
              İstəsən select ilə, istəsən bir klik düymələrlə dəyiş.
            </p>

            <div className="mt-4 grid gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-13 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-bold outline-none focus:border-zinc-400"
              >
                {statusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => changeStatus(selectedStatus)}
                className="flex h-13 items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]"
              >
                <FiCheckCircle />
                Yadda saxla
              </button>
            </div>

            <div className="mt-5 grid gap-2">
              {quickActions.length === 0 ? (
                <div className="rounded-[18px] bg-zinc-50 p-4 text-sm font-extrabold text-zinc-500">
                  Bu sifariş artıq yekun statusdadır.
                </div>
              ) : (
                quickActions.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    onClick={() => changeStatus(action.status, action.label)}
                    className={`flex h-12 items-center justify-center gap-2 rounded-[16px] text-sm font-extrabold transition hover:-translate-y-0.5 active:scale-[0.96] ${action.className}`}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">
              Status timeline
            </h2>

            <div className="mt-5 space-y-4">
              <TimelineItem title="Sifariş yaradıldı" date={order.createdAt} />
              {Array.isArray(order.statusHistories || order.statusHistory) &&
                (order.statusHistories || order.statusHistory).map((item, index) => (
                  <TimelineItem
                    key={item.id || index}
                    title={item.note || getStatusInfo(item.status || item.newStatus).label}
                    date={item.createdAt}
                  />
                ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ProductRow({ item, index }) {
  const broken = isBrokenItem(item);
  const image = getItemImage(item);

  if (broken) {
    return (
      <div className="rounded-[22px] border border-orange-100 bg-orange-50 p-4">
        <div className="flex gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-white text-orange-600">
            <FiAlertTriangle />
          </div>

          <div>
            <p className="font-extrabold text-orange-700">
              Variant məlumatı tapılmadı
            </p>
            <p className="mt-1 text-sm font-bold text-orange-700/80">
              Məhsul #{index + 1}: variant silinib, əlaqə pozulub və ya backend ölçü/rəng məlumatını qaytarmır.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-4 transition hover:bg-white hover:shadow-[0_16px_40px_rgba(0,0,0,0.04)] active:scale-[0.99]">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="h-28 w-full overflow-hidden rounded-[22px] bg-white md:w-28 md:shrink-0">
          {image ? (
            <img src={image} alt={getItemProductName(item)} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-2xl font-extrabold text-zinc-300">
              N
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-extrabold tracking-[-0.03em] text-zinc-950">
            {getItemProductName(item)}
          </h3>

          <p className="mt-1 text-xs font-bold text-zinc-400">
            Kod: {item.productCode || item.product?.productCode || "—"}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-extrabold">
            <span className="rounded-full bg-white px-3 py-1 text-zinc-600">
              Ölçü: {getItemSize(item)}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-zinc-600">
              Rəng: {getItemColor(item)}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-zinc-600">
              Say: {getItemQuantity(item)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm font-extrabold">
            <span className="text-zinc-500">Qiymət: {money(getItemUnitPrice(item))}</span>
            <span className="text-[#244989]">Cəmi: {money(getItemTotal(item))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_14px_42px_rgba(0,0,0,0.035)] transition hover:-translate-y-1 active:scale-[0.98]">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-[16px] bg-[#244989]/8 text-[#244989]">
        {icon}
      </div>
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-extrabold text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function MiniInfo({ icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-[18px] bg-zinc-50 p-4">
      <div className="mt-0.5 text-[#244989]">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-extrabold text-zinc-400">{label}</p>
        <p className="break-words text-sm font-extrabold text-zinc-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function PriceRow({ label, value, big = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={big ? "text-base text-white" : "text-white/60"}>
        {label}
      </span>
      <span className={big ? "text-2xl font-extrabold" : "text-white"}>
        {value}
      </span>
    </div>
  );
}

function TimelineItem({ title, date }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#244989]" />
      <div>
        <p className="text-sm font-extrabold text-zinc-950">{title}</p>
        <p className="text-xs font-bold text-zinc-400">{formatDate(date)}</p>
      </div>
    </div>
  );
}