import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiMapPin,
  FiMessageCircle,
  FiPackage,
  FiPhone,
  FiRefreshCw,
  FiSave,
  FiShoppingBag,
  FiTruck,
  FiUser,
} from "react-icons/fi";
import {
  adminCouriersApi,
  adminOrdersApi,
  listAdmin,
  unwrapAdmin,
} from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";
import { useLocation } from "react-router-dom";

const ORDER_STATUSES = [
  { value: 1, label: "Gözləyir" },
  { value: 2, label: "Təsdiqləndi" },
  { value: 3, label: "Hazırlanır" },
  { value: 4, label: "Çatdırılmaya çıxdı" },
  { value: 5, label: "Çatdırıldı" },
  { value: 6, label: "Ləğv edildi" },
  { value: 7, label: "Rədd edildi" },
];

function money(value) {
  return `${Number(value || 0).toFixed(2)} ₼`;
}

function formatDate(value) {
  if (!value) return "—";
  return String(value).replace("T", " ").slice(0, 16);
}

function statusLabel(status) {
  return ORDER_STATUSES.find((x) => Number(x.value) === Number(status))?.label || "—";
}

function deliveryTypeText(value) {
  if (Number(value) === 1) return "Ünvana çatdırılma";
  if (Number(value) === 2) return "Mağazadan götürmə";
  return "—";
}

function paymentMethodText(value) {
  if (Number(value) === 1) return "Nağd ödəniş";
  if (Number(value) === 2) return "Kartla ödəniş";
  return "—";
}

function getWhatsappLink(res) {
  const data = res?.data?.data ?? res?.data ?? res;

  if (typeof data === "string") return data;

  return (
    data?.url ||
    data?.link ||
    data?.whatsappUrl ||
    data?.whatsappLink ||
    data?.data ||
    ""
  );
}

function openWhatsapp(link, setError) {
  if (!link) {
    setError("WhatsApp link gəlmədi.");
    return;
  }

  window.open(link, "_blank", "noopener,noreferrer");
}

export default function AdminOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [couriers, setCouriers] = useState([]);

  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [selectedCourierPhone, setSelectedCourierPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const location = useLocation();

  const basePath = location.pathname.startsWith("/Admin")
      ? "/Admin"
      : "/SuperAdmin";

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadAll() {
    if (!id || id === "undefined" || id === "null") {
      setError("Sifariş ID gəlmədi.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      setLoading(true);

      const [orderRes, courierRes] = await Promise.all([
        adminOrdersApi.detail(id),
        adminCouriersApi.list().catch(() => ({ data: [] })),
      ]);

      const loadedOrder = unwrapAdmin(orderRes);
      const loadedCouriers = listAdmin(courierRes);

      setOrder(loadedOrder);
      setCouriers(loadedCouriers);

      setNewStatus(loadedOrder?.status || "");
      setSelectedCourierPhone(
        loadedCouriers.find((x) => x.isDefault)?.phoneNumber ||
          loadedCouriers[0]?.phoneNumber ||
          ""
      );
    } catch (err) {
      setError(err.message || "Sifariş məlumatları yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus() {
    if (!newStatus) {
      setError("Status seçilməlidir.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await adminOrdersApi.updateStatus(id, {
        newStatus: Number(newStatus),
        note: statusNote || "",
      });

      setSuccess("Sifariş statusu yeniləndi.");
      await loadAll();
    } catch (err) {
      setError(err.message || "Status yenilənmədi.");
    } finally {
      setSaving(false);
    }
  }

  async function sendStatusWhatsapp(status) {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await adminOrdersApi.statusWhatsappLink(id, Number(status));
      openWhatsapp(getWhatsappLink(res), setError);
    } catch (err) {
      setError(err.message || "Müştəri WhatsApp mesajı açıla bilmədi.");
    } finally {
      setSaving(false);
    }
  }

  async function sendCourierWhatsapp() {
    if (!selectedCourierPhone) {
      setError("Əvvəl kuryer seçilməlidir.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await adminOrdersApi.courierWhatsappLink(
        id,
        selectedCourierPhone
      );

      openWhatsapp(getWhatsappLink(res), setError);
    } catch (err) {
      setError(err.message || "Kuryer WhatsApp mesajı açıla bilmədi.");
    } finally {
      setSaving(false);
    }
  }

  const items = useMemo(() => {
    return Array.isArray(order?.items) ? order.items : [];
  }, [order]);

  if (loading) return <AppLoader text="Sifariş açılır" />;

  if (!order) {
    return (
      <div className="px-4 py-5 md:px-8 md:py-8">
        <button
          type="button"
          onClick={() => navigate(`${basePath}/orders`)}
          className="mb-5 flex h-11 items-center gap-2 rounded-[15px] bg-white px-4 text-sm font-extrabold text-zinc-700"
        >
          <FiArrowLeft />
          Sifarişlərə qayıt
        </button>

        <div className="rounded-[22px] bg-red-50 p-5 text-sm font-extrabold text-red-700">
          {error || "Sifariş tapılmadı."}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Əməliyyat icra olunur" />}

      <button
        type="button"
        onClick={() => navigate(`${basePath}/orders`)}
        className="mb-5 flex h-11 items-center gap-2 rounded-[15px] bg-white px-4 text-sm font-extrabold text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.97]"
      >
        <FiArrowLeft />
        Sifarişlərə qayıt
      </button>

      <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Sifariş detalları
          </p>

          <h1 className="mt-2 text-[30px] font-extrabold tracking-[-0.045em] md:text-[44px]">
            {order.orderNumber || "Sifariş"}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>{statusLabel(order.status)}</Badge>
            <Badge>{formatDate(order.createdAt)}</Badge>
            <Badge>{money(order.totalPrice)}</Badge>
            <Badge>
              WhatsApp: {order.isWhatsappMessageSent ? "Göndərilib" : "Göndərilməyib"}
            </Badge>
          </div>
        </div>

        <button
          type="button"
          onClick={loadAll}
          className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-zinc-950 px-5 text-sm font-extrabold text-white"
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

      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-[18px] border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          <FiCheckCircle />
          {success}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <main className="space-y-5">
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard icon={<FiUser />} label="Müştəri" value={order.customerFullName || "—"} />
            <InfoCard icon={<FiPhone />} label="Telefon" value={order.customerPhoneNumber || "—"} />
            <InfoCard icon={<FiTruck />} label="Çatdırılma" value={deliveryTypeText(order.deliveryType)} />
            <InfoCard icon={<FiCreditCard />} label="Ödəniş" value={paymentMethodText(order.paymentMethod)} />
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
                  Sifarişdə olan bütün məhsullar.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <article
                  key={item.productVariantId || item.productId || index}
                  className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-4"
                >
                  <div className="flex gap-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[20px] bg-white">
                      {item.productImageUrl ? (
                        <img
                          src={item.productImageUrl}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-zinc-300">
                          <FiPackage />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-zinc-950">
                        {item.productName || "Məhsul"}
                      </h3>

                      <p className="mt-1 text-xs font-bold text-zinc-400">
                        Kod: {item.productCode || "—"} · Ölçü:{" "}
                        {item.sizeValue || "—"} · Rəng: {item.colorName || "—"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-extrabold">
                        <span className="rounded-full bg-white px-3 py-1 text-zinc-600">
                          Say: {item.quantity || 0}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-zinc-600">
                          Bir ədəd: {money(item.unitPrice)}
                        </span>
                        <span className="rounded-full bg-[#244989]/8 px-3 py-1 text-[#244989]">
                          Cəmi: {money(item.totalPrice)}
                        </span>
                      </div>

                      {item.productLink && (
                        <a
                          href={item.productLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex text-xs font-extrabold text-[#244989]"
                        >
                          Məhsul linkinə bax
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}

              {items.length === 0 && (
                <div className="rounded-[20px] bg-zinc-50 p-5 text-sm font-extrabold text-zinc-400">
                  Məhsul yoxdur.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#244989]/8 text-[#244989]">
                <FiMapPin />
              </div>

              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                  Ünvan və çatdırılma
                </h2>
                <p className="text-sm font-bold text-zinc-500">
                  Çatdırılma üçün lazım olan bütün məlumatlar.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <MiniInfo label="Ünvan" value={order.addressText || "—"} />
              <MiniInfo label="Bina" value={order.buildingNumber || "—"} />
              <MiniInfo label="Mərtəbə" value={order.floor || "—"} />
              <MiniInfo label="Mənzil" value={order.apartment || "—"} />
              <MiniInfo label="Məsafə" value={`${order.deliveryDistanceKm || 0} km`} />
              <MiniInfo label="Çatdırılma qiyməti" value={money(order.deliveryPrice)} />
              <MiniInfo label="Çatdırılma tarixi" value={formatDate(order.deliveryDate)} />
              <MiniInfo label="Saat aralığı" value={order.deliveryTimeRange || "—"} />
              <MiniInfo label="Latitude" value={order.latitude ?? "—"} />
              <MiniInfo label="Longitude" value={order.longitude ?? "—"} />
            </div>

            {order.note && (
              <div className="mt-3 rounded-[20px] bg-zinc-50 p-4">
                <p className="text-xs font-extrabold text-zinc-400">Qeyd</p>
                <p className="mt-1 text-sm font-bold text-zinc-700">{order.note}</p>
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-5">
          <section className="rounded-[28px] bg-zinc-950 p-5 text-white">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">
              Ödəniş xülasəsi
            </h2>

            <div className="mt-5 space-y-3 text-sm font-bold">
              <SideRow label="Məhsullar" value={money(order.totalProductPrice)} />
              <SideRow label="Promo endirim" value={money(order.promoDiscountAmount)} />
              <SideRow label="Çatdırılma" value={money(order.deliveryPrice)} />
              <SideRow label="Yekun" value={money(order.totalPrice)} />
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">
              Status idarəetməsi
            </h2>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-800">
                  Yeni status
                </span>

                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="h-13 w-full rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-bold outline-none"
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-800">
                  Status qeydi
                </span>

                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  placeholder="İstəyə bağlı qeyd..."
                  className="w-full resize-none rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-semibold outline-none"
                />
              </label>

              <button
                type="button"
                onClick={updateStatus}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white"
              >
                <FiSave />
                Statusu yenilə
              </button>

              <button
                type="button"
                onClick={() => sendStatusWhatsapp(newStatus || order.status)}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-green-600 text-sm font-extrabold text-white"
              >
                <FiMessageCircle />
                Müştəriyə WhatsApp aç
              </button>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">
              Kuryerə göndər
            </h2>

            <p className="mt-1 text-sm font-bold text-zinc-500">
              Çatdırılmaya çıxan sifariş üçün kuryeri seç və WhatsApp mesajını aç.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-800">
                  Kuryer
                </span>

                <select
                  value={selectedCourierPhone}
                  onChange={(e) => setSelectedCourierPhone(e.target.value)}
                  className="h-13 w-full rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-bold outline-none"
                >
                  <option value="">Kuryer seç</option>
                  {couriers.map((courier) => (
                    <option
                      key={courier.id || courier.courierId || courier.phoneNumber}
                      value={courier.phoneNumber}
                    >
                      {courier.title} — {courier.phoneNumber}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={sendCourierWhatsapp}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-zinc-950 text-sm font-extrabold text-white"
              >
                <FiTruck />
                Kuryerə WhatsApp aç
              </button>
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">
              Sistem məlumatı
            </h2>

            <div className="mt-5 space-y-3">
              <MiniInfo label="Sifariş ID" value={order.id} />
              <MiniInfo label="Yaradılma tarixi" value={formatDate(order.createdAt)} />
              <MiniInfo
                label="WhatsApp göndərilmə tarixi"
                value={formatDate(order.whatsappMessageSentAt)}
              />
              <MiniInfo
                label="Hazırkı status"
                value={statusLabel(order.status)}
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-zinc-600 shadow-[0_10px_25px_rgba(0,0,0,0.04)]">
      {children}
    </span>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_14px_42px_rgba(0,0,0,0.035)]">
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

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-[18px] bg-zinc-50 p-4">
      <p className="text-xs font-extrabold text-zinc-400">{label}</p>
      <p className="mt-1 break-words text-sm font-extrabold text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function SideRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/60">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}