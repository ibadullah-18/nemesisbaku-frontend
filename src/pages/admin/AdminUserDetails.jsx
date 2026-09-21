import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiHeart,
  FiMail,
  FiMapPin,
  FiRefreshCw,
  FiShoppingBag,
  FiShoppingCart,
  FiTrash2,
  FiUser,
  FiXCircle,
} from "react-icons/fi";
import { adminUsersApi, unwrapAdmin } from "../../api/admin/adminApi";
import { getPanelBasePath } from "../../api/admin/adminAuth";
import AdminFloatingActions from "../../components/admin/AdminFloatingActions";
import AdminMediaPreview from "../../components/admin/AdminMediaPreview";
import AppLoader from "../../components/common/AppLoader";
import { useAdminToastState } from "../../utils/adminToast";
import "./adminInsights.css";

function formatDate(value, withTime = true) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).replace("T", " ").slice(0, withTime ? 16 : 10);
  return date.toLocaleString("az-AZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function money(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(2)} ₼` : "—";
}

function orderStatus(value) {
  const labels = {
    Pending: "Gözləyir",
    Confirmed: "Təsdiqləndi",
    Preparing: "Hazırlanır",
    Shipped: "Kuryerdədir",
    Delivered: "Çatdırıldı",
    Cancelled: "Ləğv edildi",
  };
  return labels[value] || value || "—";
}

export default function AdminUserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const basePath = getPanelBasePath();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, setError] = useAdminToastState("error");
  const [, setSuccess] = useAdminToastState("success");

  async function loadUser(showNotice = false) {
    try {
      if (showNotice) setRefreshing(true);
      else setLoading(true);
      const response = await adminUsersApi.detail(id);
      setUser(unwrapAdmin(response) || null);
      if (showNotice) setSuccess("İstifadəçi məlumatları yeniləndi.");
    } catch (error) {
      setError(error.message || "İstifadəçi detalları yüklənmədi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleStatus() {
    const active = Boolean(user?.isActive);
    if (!window.confirm(active ? "İstifadəçi deaktiv edilsin?" : "İstifadəçi aktiv edilsin?")) return;

    try {
      setSaving(true);
      if (active) await adminUsersApi.deactivate(id);
      else await adminUsersApi.activate(id);
      setSuccess(active ? "İstifadəçi deaktiv edildi." : "İstifadəçi aktiv edildi.");
      await loadUser();
    } catch (error) {
      setError(error.message || "Status dəyişdirilmədi.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser() {
    if (!window.confirm(`${user?.fullName || "Bu istifadəçi"} silinsin?`)) return;

    try {
      setSaving(true);
      await adminUsersApi.delete(id);
      setSuccess("İstifadəçi silindi.");
      navigate(`${basePath}/users`);
    } catch (error) {
      setError(error.message || "İstifadəçi silinmədi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppLoader text="İstifadəçi açılır" />;

  if (!user) {
    return (
      <main className="nb-insight-page">
        <section className="nb-insight-empty"><FiUser /><h1>İstifadəçi tapılmadı</h1><button type="button" onClick={() => navigate(`${basePath}/users`)}>Siyahıya qayıt</button></section>
      </main>
    );
  }

  const orders = Array.isArray(user.orders) ? user.orders : [];

  return (
    <main className="nb-insight-page nb-user-detail">
      <header className="nb-user-hero">
        <AdminMediaPreview src={user.profileImageUrl} alt={user.fullName || "İstifadəçi"} className="nb-user-hero__avatar" />
        <div className="nb-user-hero__copy">
          <p className="nb-insight-eyebrow">nemesisbaku · istifadəçi detalları</p>
          <h1>{user.fullName || "Adsız istifadəçi"}</h1>
          <p>{user.email || "Email yoxdur"} · {user.phoneNumber || "Telefon yoxdur"}</p>
        </div>
        <span className={`nb-insight-badge ${user.isActive ? "is-active" : "is-inactive"}`}>{user.isActive ? "Aktiv hesab" : "Deaktiv hesab"}</span>
      </header>

      <section className="nb-insight-stats">
        <DetailStat icon={<FiShoppingCart />} label="Səbətdə" value={user.basketItemCount ?? 0} />
        <DetailStat icon={<FiHeart />} label="Seçilmiş" value={user.favoriteCount ?? 0} />
        <DetailStat icon={<FiShoppingBag />} label="Sifariş" value={user.orderCount ?? 0} />
        <DetailStat icon={<FiClock />} label="Son giriş" value={formatDate(user.lastLoginAt)} />
      </section>

      <div className="nb-insight-layout">
        <section className="nb-insight-main">
          <article className="nb-insight-card">
            <div className="nb-insight-card__heading">
              <span><FiShoppingBag /></span>
              <div><h2>Son sifarişlər</h2><p>Backend tərəfindən qaytarılan son {orders.length} sifariş</p></div>
            </div>
            <div className="nb-table-scroll">
              <table className="nb-admin-table nb-orders-table">
                <thead><tr><th>Sifariş</th><th>Tarix</th><th>Status</th><th>Məbləğ</th><th></th></tr></thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} onClick={() => navigate(`${basePath}/orders/${order.id}`)}>
                      <td><strong>{order.orderNumber || "—"}</strong></td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td><span className="nb-status-pill">{orderStatus(order.status)}</span></td>
                      <td><strong>{money(order.totalPrice)}</strong></td>
                      <td><button className="nb-open-row" type="button">Aç</button></td>
                    </tr>
                  ))}
                  {orders.length === 0 ? <tr><td colSpan="5" className="nb-table-empty">Bu istifadəçinin sifarişi yoxdur.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <aside className="nb-insight-side">
          <article className="nb-insight-card">
            <h2>Şəxsi məlumatlar</h2>
            <div className="nb-info-list">
              <InfoRow icon={<FiUser />} label="Ad və soyad" value={user.fullName || "—"} />
              <InfoRow icon={<FiMail />} label="Email" value={user.email || "—"} />
              <InfoRow icon={<FiMapPin />} label="Telefon" value={user.phoneNumber || "—"} />
              <InfoRow icon={<FiClock />} label="Doğum tarixi" value={formatDate(user.dateOfBirth, false)} />
              <InfoRow icon={<FiShoppingBag />} label="Loyallıq kodu" value={user.loyaltyCardCode || "—"} />
              <InfoRow icon={<FiClock />} label="Qeydiyyat" value={formatDate(user.createdAt)} />
            </div>
          </article>
        </aside>
      </div>

      <AdminFloatingActions status={refreshing ? "Məlumat yenilənir…" : "İstifadəçi detalları"}>
        <button type="button" onClick={() => navigate(`${basePath}/users`)}><FiArrowLeft /> Geri</button>
        <button type="button" disabled={refreshing || saving} onClick={() => loadUser(true)}><FiRefreshCw /> Yenilə</button>
        <button className="is-primary" type="button" disabled={saving} onClick={toggleStatus}>{user.isActive ? <FiXCircle /> : <FiCheckCircle />} {user.isActive ? "Deaktiv et" : "Aktiv et"}</button>
        <button className="is-danger" type="button" disabled={saving} onClick={deleteUser}><FiTrash2 /> Sil</button>
      </AdminFloatingActions>
    </main>
  );
}

function DetailStat({ icon, label, value }) {
  return <article className="nb-insight-stat"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}

function InfoRow({ icon, label, value }) {
  return <div><span>{icon} {label}</span><strong>{value}</strong></div>;
}
