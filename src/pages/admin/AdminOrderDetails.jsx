import { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import {
  FiArrowLeft, FiMessageCircle, FiPackage, FiRefreshCw, FiTruck,
} from "react-icons/fi";
import {
  adminCouriersApi, adminOrdersApi, listAdmin, unwrapAdmin,
} from "../../api/admin/adminApi";
import { getPanelBasePath } from "../../api/admin/adminAuth";
import { useAdminToastState } from "../../utils/adminToast";
import {
  availableOrderStatuses, formatOrderDate, getOrderStatus,
  orderDeliveryType, orderMoney,
} from "./adminOrderUtils";
import "./adminOrders.css";

function paymentMethodText(value) {
  if (Number(value) === 1) return "Çatdırılmada nağd";
  if (Number(value) === 2) return "Mağazada ödəniş";
  return "—";
}

function OrderImage({ src }) {
  const [failed, setFailed] = useState(false);
  return <div className="nb-orders__item-picture">
    {src && !failed ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      : <FiPackage aria-label="Şəkil mövcud deyil" />}
  </div>;
}

function DetailValue({ label, children }) {
  return <div><span>{label}</span><strong>{children ?? "—"}</strong></div>;
}

function openPendingWindow() {
  const popup = window.open("about:blank", "_blank");
  if (popup) popup.opener = null;
  return popup;
}

export default function AdminOrderDetails() {
  const { id } = useParams();
  const basePath = getPanelBasePath();
  const [order, setOrder] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useAdminToastState("error");
  const [success, setSuccess] = useAdminToastState("success");

  async function loadOrder() {
    if (!id) { setError("Sifariş ID tapılmadı."); setLoading(false); return; }
    try {
      setLoading(true);
      setError("");
      const [response, courierResponse] = await Promise.all([
        adminOrdersApi.detail(id),
        adminCouriersApi.list().catch(() => null),
      ]);
      const nextOrder = unwrapAdmin(response);
      const courierList = courierResponse ? listAdmin(courierResponse) : [];
      setOrder(nextOrder);
      setCouriers(courierList);
      setNewStatus(String(availableOrderStatuses(nextOrder?.status)[0]?.value || ""));
      setCourierPhone((previous) =>
        courierList.some((x) => x.phoneNumber === previous)
          ? previous
          : courierList.find((x) => x.isDefault)?.phoneNumber || courierList[0]?.phoneNumber || "",
      );
    } catch (err) {
      setError(err?.message || "Sifariş yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Keep the current order visible while a manual refresh is in progress.
    const timer = window.setTimeout(() => { loadOrder(); }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function updateStatus() {
    if (saving || !availableOrderStatuses(order?.status).some((x) => x.value === Number(newStatus))) {
      setError("Bu sifariş üçün seçilən status keçidi mümkün deyil.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await adminOrdersApi.updateStatus(id, { newStatus: Number(newStatus), note: note.trim() });
      setNote("");
      await loadOrder();
      setSuccess("Status yeniləndi.");
    } catch (err) {
      setError(err?.message || "Status yenilənmədi. Sifarişi yeniləyin.");
    } finally {
      setSaving(false);
    }
  }

  async function openWhatsapp(type) {
    if (saving) return;
    if (type === "courier" && !courierPhone) {
      setError("Kuryer seçilməlidir.");
      return;
    }
    const popup = openPendingWindow();
    if (!popup) { setError("Brauzerdə yeni pəncərəyə icazə verin."); return; }
    try {
      setSaving(true);
      setError("");
      const response = type === "courier"
        ? await adminOrdersApi.courierWhatsappLink(id, courierPhone)
        : await adminOrdersApi.statusWhatsappLink(id, Number(order.status));
      const data = unwrapAdmin(response);
      const link = typeof data === "string" ? data : data?.url;
      if (!link || !link.startsWith("https://wa.me/")) throw new Error("WhatsApp linki gəlmədi.");
      popup.location.replace(link);
    } catch (err) {
      popup.close();
      setError(err?.message || "WhatsApp linki açıla bilmədi.");
    } finally {
      setSaving(false);
    }
  }

  if (!order) {
    return <div className="nb-orders">
      <NavLink className="nb-orders__back" to={`${basePath}/orders`}><FiArrowLeft /> Sifarişlərə qayıt</NavLink>
      {loading ? <div className="nb-orders__message" role="status">Sifariş açılır...</div>
        : <div className="nb-orders__error" role="alert">{error || "Sifariş tapılmadı."}
          <button type="button" onClick={loadOrder}>Yenidən yoxla</button></div>}
    </div>;
  }

  const state = getOrderStatus(order.status);
  const allowed = availableOrderStatuses(order.status);
  const isDelivery = Number(order.deliveryType) === 1;
  const canPrepareMessage = Number(order.status) >= 2 && Number(order.status) <= 7;

  return <div className="nb-orders nb-orders-detail" aria-busy={loading || saving}>
    <NavLink className="nb-orders__back" to={`${basePath}/orders`}><FiArrowLeft aria-hidden="true" /> Sifarişlərə qayıt</NavLink>
    <header className="nb-orders__heading">
      <div>
        <p className="nb-orders__eyebrow">nemesisbaku / sifariş detalı</p>
        <h1>{order.orderNumber || "Sifariş"}</h1>
        <span className={`nb-orders__badge nb-orders__badge--${state.tone}`}>{state.label}</span>
        <span className="nb-orders__note" style={{ marginLeft: 12 }}>{formatOrderDate(order.createdAt)}</span>
      </div>
      <button type="button" className="nb-orders__refresh" disabled={loading || saving} onClick={loadOrder}>
        <FiRefreshCw aria-hidden="true" /> {loading ? "Yenilənir..." : "Yenilə"}
      </button>
    </header>
    {error && <div className="nb-orders__error" role="alert">{error}
      <button type="button" onClick={loadOrder}>Yenilə</button></div>}
    {success && <div className="nb-orders__success" role="status">{success}</div>}

    <div className="nb-orders__detail-grid">
      <main className="nb-orders__detail-main">
        <section className="nb-orders__detail-card">
          <h2>Müştəri və sifariş</h2>
          <div className="nb-orders__key-values">
            <DetailValue label="Müştəri">{order.customerFullName || "—"}</DetailValue>
            <DetailValue label="Telefon">{order.customerPhoneNumber || "—"}</DetailValue>
            <DetailValue label="Çatdırılma növü">{orderDeliveryType(order.deliveryType)}</DetailValue>
            <DetailValue label="Ödəniş üsulu">{paymentMethodText(order.paymentMethod)}</DetailValue>
          </div>
        </section>
        <section className="nb-orders__detail-card">
          <h2>Məhsullar ({order.items?.length || 0})</h2>
          {(order.items || []).map((item, index) => <article className="nb-orders__item" key={`${item.productVariantId || item.productId}-${index}`}>
            <OrderImage key={item.productImageUrl || "no-image"} src={item.productImageUrl} />
            <div className="nb-orders__item-data">
              <strong>{item.productName || "Məhsul"}</strong>
              <small>{[item.productCode, item.sizeValue && `Ölçü: ${item.sizeValue}`, item.colorName].filter(Boolean).join(" · ")}</small>
              <small>{item.quantity} ədəd × {orderMoney(item.unitPrice)}</small>
              {item.productLink && <a className="nb-orders__back" style={{ margin: "8px 0 0" }}
                href={item.productLink} target="_blank" rel="noreferrer">Məhsula bax</a>}
            </div>
            <span className="nb-orders__item-price">{orderMoney(item.totalPrice)}</span>
          </article>)}
          {!order.items?.length && <p className="nb-orders__note">Məhsul məlumatı yoxdur.</p>}
        </section>
        {isDelivery && <section className="nb-orders__detail-card">
          <h2>Çatdırılma ünvanı</h2>
          <div className="nb-orders__key-values">
            <DetailValue label="Ünvan">{order.addressText || "—"}</DetailValue>
            <DetailValue label="Bina">{order.buildingNumber || "—"}</DetailValue>
            <DetailValue label="Mərtəbə">{order.floor || "—"}</DetailValue>
            <DetailValue label="Mənzil">{order.apartment || "—"}</DetailValue>
            <DetailValue label="Çatdırılma tarixi">{formatOrderDate(order.deliveryDate)}</DetailValue>
            <DetailValue label="Saat aralığı">{order.deliveryTimeRange || "—"}</DetailValue>
            <DetailValue label="Məsafə">{order.deliveryDistanceKm == null ? "—" : `${order.deliveryDistanceKm} km`}</DetailValue>
          </div>
          {order.note && <p className="nb-orders__note nb-orders__note--box">Qeyd: {order.note}</p>}
          {order.latitude != null && order.longitude != null && <a className="nb-orders__back" style={{ margin: "18px 0 0" }}
            href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`} target="_blank" rel="noreferrer">Ünvanı xəritədə aç</a>}
        </section>}
        {!isDelivery && order.note && <section className="nb-orders__detail-card">
          <h2>Sifariş qeydi</h2><p className="nb-orders__note">{order.note}</p>
        </section>}
      </main>
      <aside className="nb-orders__detail-side">
        <section className="nb-orders__detail-card nb-orders__totals">
          <h2>Məbləğ</h2>
          <div className="nb-orders__total-row"><span>Məhsullar</span><strong>{orderMoney(order.totalProductPrice)}</strong></div>
          <div className="nb-orders__total-row"><span>Endirim</span><strong>− {orderMoney(order.promoDiscountAmount)}</strong></div>
          <div className="nb-orders__total-row"><span>Çatdırılma</span><strong>{orderMoney(order.deliveryPrice)}</strong></div>
          <div className="nb-orders__total-row is-final"><span>Yekun</span><strong>{orderMoney(order.totalPrice)}</strong></div>
        </section>
        <section className="nb-orders__detail-card">
          <h2>Status idarəetməsi</h2>
          <p className="nb-orders__note">Hazırkı status: <strong>{state.label}</strong></p>
          {allowed.length ? <>
            <label className="nb-orders__field">Növbəti status
              <select value={newStatus} onChange={(event) => setNewStatus(event.target.value)} disabled={saving || loading}>
                {allowed.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="nb-orders__field">Qeyd (istəyə bağlı)
              <textarea rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)}
                placeholder="Status dəyişikliyi üçün qeyd" disabled={saving || loading} />
            </label>
            <button type="button" className="nb-orders__primary" disabled={saving || loading || !newStatus} onClick={updateStatus}>
              {saving ? "İcra olunur..." : "Statusu yenilə"}
            </button>
          </> : <p className="nb-orders__note nb-orders__note--box">Bu sifarişin statusu tamamlanıb. Əlavə status keçidi yoxdur.</p>}
          {canPrepareMessage && <>
            <button type="button" className="nb-orders__secondary" disabled={saving || loading}
              onClick={() => openWhatsapp("customer")}><FiMessageCircle aria-hidden="true" /> Müştəri üçün WhatsApp aç</button>
            <p className="nb-orders__note">Mesaj WhatsApp-da hazırlanır; göndərmək üçün orada təsdiqləyin.</p>
          </>}
        </section>
        {isDelivery && <section className="nb-orders__detail-card">
          <h2>Kuryerə göndər</h2>
          {couriers.length ? <>
            <label className="nb-orders__field">Kuryer
              <select value={courierPhone} onChange={(event) => setCourierPhone(event.target.value)} disabled={saving || loading}>
                {couriers.map((courier) => <option key={courier.id || courier.phoneNumber} value={courier.phoneNumber}>{courier.title || "Kuryer"} · {courier.phoneNumber}</option>)}
              </select>
            </label>
            <button type="button" className="nb-orders__secondary" disabled={saving || loading || !courierPhone}
              onClick={() => openWhatsapp("courier")}><FiTruck aria-hidden="true" /> Kuryer üçün WhatsApp aç</button>
          </> : <p className="nb-orders__note">Kuryer nömrəsi əlavə edilməyib.</p>}
        </section>}
        <section className="nb-orders__detail-card">
          <h2>Sistem məlumatı</h2>
          <div className="nb-orders__key-values">
            <DetailValue label="Sifariş ID">{order.id || "—"}</DetailValue>
            <DetailValue label="Yaradılma tarixi">{formatOrderDate(order.createdAt)}</DetailValue>
            <DetailValue label="WhatsApp bildirişi">{order.isWhatsappMessageSent ? "Göndərilib" : "Göndərilməyib"}</DetailValue>
            <DetailValue label="Bildiriş tarixi">{formatOrderDate(order.whatsappMessageSentAt)}</DetailValue>
          </div>
        </section>
      </aside>
    </div>
  </div>;
}
