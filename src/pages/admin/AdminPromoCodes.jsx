import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiHash,
  FiPercent,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTag,
  FiTrash2,
} from "react-icons/fi";
import { adminPromoCodesApi, listAdmin } from "../../api/admin/adminApi";
import AdminFloatingActions from "../../components/admin/AdminFloatingActions";
import AppLoader from "../../components/common/AppLoader";
import { isEndAfterStart, localDateTimeToIso } from "../../utils/dataTime";
import { useAdminToastState } from "../../utils/adminToast";
import "./adminCommunications.css";

const emptyForm = {
  code: "",
  discountType: "1",
  discountValue: "",
  usageLimit: "",
  minOrderAmount: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

function formatDate(value) {
  if (!value) return "Limitsiz";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).replace("T", " ").slice(0, 16);
  return date.toLocaleString("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function discountText(item) {
  const value = Number(item.discountValue || 0);
  return Number(item.discountType) === 1 ? `${value}%` : `${value.toFixed(2)} ₼`;
}

function promoState(item) {
  const now = Date.now();
  const start = item.startDate ? new Date(item.startDate).getTime() : 0;
  const end = item.endDate ? new Date(item.endDate).getTime() : null;
  const limit = item.usageLimit == null ? null : Number(item.usageLimit);
  const used = Number(item.usedCount || 0);

  if (!item.isActive) return { label: "Deaktiv", tone: "is-inactive" };
  if (limit !== null && used >= limit) return { label: "Limit bitib", tone: "is-warning" };
  if (start > now) return { label: "Planlanıb", tone: "is-planned" };
  if (end !== null && end < now) return { label: "Vaxtı bitib", tone: "is-inactive" };
  return { label: "Aktiv", tone: "is-active" };
}

export default function AdminPromoCodes() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [, setError] = useAdminToastState("error");
  const [, setSuccess] = useAdminToastState("success");

  async function loadPromoCodes(showNotice = false) {
    try {
      if (showNotice) setRefreshing(true);
      else setLoading(true);
      const response = await adminPromoCodesApi.list();
      setPromoCodes(listAdmin(response));
      if (showNotice) setSuccess("Promo kod siyahısı yeniləndi.");
    } catch (error) {
      setError(error.message || "Promo kodlar yüklənmədi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPromoCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createPromoCode(event) {
    event.preventDefault();
    const discountValue = Number(form.discountValue);
    const usageLimit = form.usageLimit === "" ? null : Number(form.usageLimit);
    const minOrderAmount = form.minOrderAmount === "" ? null : Number(form.minOrderAmount);

    if (!form.code.trim()) return setError("Promo kod yazılmalıdır.");
    if (!Number.isFinite(discountValue) || discountValue <= 0) return setError("Endirim dəyəri 0-dan böyük olmalıdır.");
    if (Number(form.discountType) === 1 && discountValue > 100) return setError("Faiz endirimi 100-dən böyük ola bilməz.");
    if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit <= 0)) return setError("İstifadə limiti müsbət tam ədəd olmalıdır.");
    if (minOrderAmount !== null && (!Number.isFinite(minOrderAmount) || minOrderAmount < 0)) return setError("Minimum sifariş məbləği 0 və ya daha böyük olmalıdır.");
    if (!form.startDate) return setError("Başlama tarixi seçilməlidir.");

    let startDate;
    let endDate = null;
    try {
      startDate = localDateTimeToIso(form.startDate);
      if (form.endDate) endDate = localDateTimeToIso(form.endDate);
    } catch (error) {
      return setError(error.message || "Tarix formatı düzgün deyil.");
    }

    if (endDate && !isEndAfterStart(startDate, endDate)) return setError("Bitmə tarixi başlama tarixindən sonra olmalıdır.");

    try {
      setSaving(true);
      await adminPromoCodesApi.create({
        code: form.code.trim().toUpperCase(),
        discountType: Number(form.discountType),
        discountValue,
        usageLimit,
        minOrderAmount,
        startDate,
        endDate,
        isActive: Boolean(form.isActive),
      });
      setForm(emptyForm);
      setSuccess("Promo kod əlavə edildi.");
      await loadPromoCodes();
    } catch (error) {
      setError(error.message || "Promo kod əlavə edilmədi.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePromoCode(item) {
    const id = item.id || item.promoCodeId;
    if (!id) return setError("Promo kod ID-si gəlmədi.");
    if (!window.confirm(`${item.code || "Bu promo kod"} silinsin?`)) return;

    try {
      setDeletingId(id);
      await adminPromoCodesApi.delete(id);
      setPromoCodes((items) => items.filter((promo) => (promo.id || promo.promoCodeId) !== id));
      setSuccess("Promo kod silindi.");
    } catch (error) {
      setError(error.message || "Promo kod silinmədi.");
    } finally {
      setDeletingId("");
    }
  }

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return promoCodes;
    return promoCodes.filter((item) => String(item.code || "").toLowerCase().includes(value));
  }, [promoCodes, search]);

  const activeCount = promoCodes.filter((item) => promoState(item).tone === "is-active").length;
  const totalUsed = promoCodes.reduce((total, item) => total + Number(item.usedCount || 0), 0);

  if (loading) return <AppLoader text="Promo kodlar yüklənir" />;

  return (
    <main className="nb-comm-page nb-promo-page">
      <header className="nb-comm-header">
        <div>
          <p className="nb-comm-eyebrow">nemesisbaku · satış alətləri</p>
          <h1>Promo kodlar</h1>
          <p>Faiz və ya məbləğ endirimi yaradın, istifadə limitini və tarix aralığını idarə edin.</p>
        </div>
        <div className="nb-comm-header__signal"><FiTag /><span><small>Hazırda aktiv</small><strong>{activeCount} promo kod</strong></span></div>
      </header>

      <section className="nb-comm-stats">
        <Stat icon={<FiHash />} label="Bütün kodlar" value={promoCodes.length} />
        <Stat icon={<FiPercent />} label="Aktiv kodlar" value={activeCount} accent />
        <Stat icon={<FiTag />} label="Ümumi istifadə" value={totalUsed} />
      </section>

      <div className="nb-promo-layout">
        <section className="nb-comm-card nb-comm-form-card">
          <div className="nb-comm-card__head"><div><p className="nb-comm-eyebrow">Yeni endirim</p><h2>Promo kod yarat</h2></div><span className="nb-optional-badge">Limit və bitmə opsionaldır</span></div>
          <form id="admin-promo-form" className="nb-comm-form" onSubmit={createPromoCode}>
            <Field label="Promo kod" placeholder="NEMESIS20" value={form.code} onChange={(value) => setForm((old) => ({ ...old, code: value.toUpperCase().replace(/\s/g, "") }))} />
            <div className="nb-two-fields">
              <label className="nb-comm-field"><span>Endirim tipi</span><select value={form.discountType} onChange={(event) => setForm((old) => ({ ...old, discountType: event.target.value }))}><option value="1">Faizlə endirim</option><option value="2">Məbləğlə endirim</option></select></label>
              <Field type="number" label={Number(form.discountType) === 1 ? "Endirim faizi" : "Endirim məbləği"} placeholder={Number(form.discountType) === 1 ? "20" : "10"} value={form.discountValue} onChange={(value) => setForm((old) => ({ ...old, discountValue: value }))} />
            </div>
            <div className="nb-two-fields">
              <Field type="number" label="İstifadə limiti · opsional" placeholder="Limitsiz" value={form.usageLimit} onChange={(value) => setForm((old) => ({ ...old, usageLimit: value }))} />
              <Field type="number" label="Minimum sifariş · opsional" placeholder="Məhdudiyyət yoxdur" value={form.minOrderAmount} onChange={(value) => setForm((old) => ({ ...old, minOrderAmount: value }))} />
            </div>
            <div className="nb-two-fields">
              <Field type="datetime-local" label="Başlama tarixi" value={form.startDate} onChange={(value) => setForm((old) => ({ ...old, startDate: value }))} />
              <Field type="datetime-local" label="Bitmə tarixi · opsional" value={form.endDate} onChange={(value) => setForm((old) => ({ ...old, endDate: value }))} />
            </div>
            <button className={`nb-switch-row ${form.isActive ? "is-on" : ""}`} type="button" onClick={() => setForm((old) => ({ ...old, isActive: !old.isActive }))}>
              <span><FiClock /><span><strong>Promo kod aktiv olsun</strong><small>Tarix aralığında istifadə edilə bilsin</small></span></span><i><b /></i>
            </button>
          </form>

          <div className="nb-promo-preview">
            <span>CANLI ÖNİZLƏMƏ</span>
            <strong>{form.code || "NEMESIS"}</strong>
            <b>{form.discountValue ? (Number(form.discountType) === 1 ? `${form.discountValue}%` : `${form.discountValue} ₼`) : "—"}</b>
            <small>{form.usageLimit ? `${form.usageLimit} istifadə limiti` : "Limitsiz istifadə"}</small>
          </div>
        </section>

        <section className="nb-comm-card">
          <div className="nb-comm-list-head">
            <div><h2>Promo kod siyahısı</h2><p>{promoCodes.length} kod · {totalUsed} istifadə</p></div>
            <label className="nb-comm-search"><FiSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Promo kod axtar" /></label>
          </div>

          <div className="nb-promo-grid">
            {filtered.map((item) => {
              const id = item.id || item.promoCodeId;
              const status = promoState(item);
              const limit = item.usageLimit == null ? null : Number(item.usageLimit);
              const used = Number(item.usedCount || 0);
              const usagePercent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

              return (
                <article key={id || item.code} className="nb-promo-card">
                  <div className="nb-promo-card__top">
                    <span className="nb-promo-card__value">{discountText(item)}</span>
                    <em className={status.tone}>{status.label}</em>
                    <button type="button" disabled={deletingId === id} onClick={() => deletePromoCode(item)} aria-label="Promo kodu sil"><FiTrash2 /></button>
                  </div>
                  <h3>{item.code || "—"}</h3>
                  <p>Minimum sifariş: {item.minOrderAmount == null ? "Yoxdur" : `${Number(item.minOrderAmount).toFixed(2)} ₼`}</p>
                  <div className="nb-usage-row"><span>İstifadə</span><strong>{used} / {limit ?? "∞"}</strong></div>
                  {limit ? <div className="nb-send-progress"><i style={{ width: `${usagePercent}%` }} /></div> : null}
                  <div className="nb-promo-card__dates"><span><FiCalendar /> {formatDate(item.startDate)}</span><span><FiCalendar /> {formatDate(item.endDate)}</span></div>
                </article>
              );
            })}
            {filtered.length === 0 ? <div className="nb-comm-empty">Promo kod tapılmadı.</div> : null}
          </div>
        </section>
      </div>

      <AdminFloatingActions status={saving ? "Promo kod yaradılır…" : "Yeni promo kod"}>
        <button type="button" disabled={refreshing || saving} onClick={() => loadPromoCodes(true)}><FiRefreshCw /> Yenilə</button>
        <button className="is-primary" form="admin-promo-form" type="submit" disabled={saving}><FiPlus /> {saving ? "Yaradılır…" : "Promo kod yarat"}</button>
      </AdminFloatingActions>
    </main>
  );
}

function Stat({ icon, label, value, accent = false }) {
  return <article className={`nb-comm-stat ${accent ? "is-accent" : ""}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}

function Field({ label, placeholder = "", value, onChange, type = "text" }) {
  return <label className="nb-comm-field"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}
