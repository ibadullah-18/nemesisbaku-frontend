import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiCalendar, FiEdit3, FiImage, FiLayers, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { adminPromoPagesApi, listAdmin } from "../../api/admin/adminApi";
import { getPanelBasePath } from "../../api/admin/adminAuth";
import AdminMediaPreview from "../../components/admin/AdminMediaPreview";
import { useAdminToastState } from "../../utils/adminToast";
import "./adminMerchandising.css";

const promoLabel = (type) => Number(type) === 2 ? "Banner" : "Kampaniya";
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 16) : new Intl.DateTimeFormat("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

export default function AdminCampaigns() {
  const [promos, setPromos] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useAdminToastState("error");
  const [, setSuccess] = useAdminToastState("success");
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = getPanelBasePath();

  useEffect(() => {
    const notice = location.state?.adminNotice;
    if (notice?.message) {
      if (notice.type === "error") setError(notice.message);
      else setSuccess(notice.message);
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [location.pathname, location.search, location.state, navigate, setError, setSuccess]);

  useEffect(() => {
    let active = true;
    adminPromoPagesApi.list().then((result) => {
      if (active) { setPromos(listAdmin(result)); setError(""); }
    }).catch((err) => { if (active) setError(err.message || "Kampaniyalar yüklənmədi."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [setError]);

  async function reload() {
    try {
      setLoading(true);
      setPromos(listAdmin(await adminPromoPagesApi.list()));
      setError("");
    } catch (err) { setError(err.message || "Kampaniyalar yüklənmədi."); }
    finally { setLoading(false); }
  }

  async function removePromo(promo) {
    if (!window.confirm(`${promoLabel(promo.type)} silinsin?`)) return;
    try {
      setBusy(true);
      await adminPromoPagesApi.delete(promo.id);
      await reload();
      setSuccess("Promo silindi.");
    } catch (err) { setError(err.message || "Promo silinmədi."); }
    finally { setBusy(false); }
  }

  const visible = filter ? promos.filter((promo) => Number(promo.type) === Number(filter)) : promos;
  const stats = [
    ["Ümumi", promos.length],
    ["Kampaniya", promos.filter((promo) => Number(promo.type) === 1).length],
    ["Banner", promos.filter((promo) => Number(promo.type) === 2).length],
    ["Aktiv", promos.filter((promo) => promo.isActive).length],
  ];

  return <div className="nb-merch">
    <header className="nb-merch__header">
      <div><p className="nb-merch__eyebrow">nemesisbaku · təqdimat</p><h1>Kampaniya və bannerlər</h1><p>Ana səhifədə göstərilən şəkilləri və onlara bağlı məhsulları idarə edin.</p></div>
      <div className="nb-merch__actions"><button type="button" className="nb-merch__button" onClick={reload} disabled={busy || loading}><FiRefreshCw /> Yenilə</button><NavLink className="nb-merch__button nb-merch__button--primary" to={`${basePath}/campaigns/create`}><FiPlus /> Yeni promo</NavLink></div>
    </header>
    {error && <p className="nb-merch__alert" role="alert">{error}</p>}
    <div className="nb-merch__stats">{stats.map(([label, value]) => <div className="nb-merch__stat" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
    <div className="nb-merch__filters" aria-label="Promo növünə görə filtr">
      {[["", "Hamısı"], ["1", "Kampaniya"], ["2", "Banner"]].map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}
    </div>
    {loading ? <div className="nb-merch__loading" role="status">Kampaniyalar yüklənir…</div> : visible.length ? <div className="nb-merch__grid">
      {visible.map((promo) => <article key={promo.id} className="nb-merch__card">
        <div className="nb-merch__card-images"><AdminMediaPreview src={promo.imageUrl} alt={`${promoLabel(promo.type)} kompüter şəkli`} /><AdminMediaPreview src={promo.mobileImageUrl} alt={`${promoLabel(promo.type)} telefon şəkli`} /></div>
        <div className="nb-merch__card-body">
          <div className="nb-merch__card-heading"><span className="nb-merch__badge">{promoLabel(promo.type)}</span><span className={`nb-merch__badge ${promo.isActive ? "nb-merch__badge--green" : "nb-merch__badge--inactive"}`}>{promo.isActive ? "Aktiv" : "Passiv"}</span></div>
          <h2>{promoLabel(promo.type)}</h2>
          <div className="nb-merch__details"><span><FiCalendar /> {formatDate(promo.startDate)}</span><span><FiLayers /> {(promo.productIds || []).length} məhsul</span></div>
          <div className="nb-merch__card-actions"><NavLink className="nb-merch__button" to={`${basePath}/campaigns/${promo.id}`}><FiEdit3 /> Düzəliş et</NavLink><button type="button" className="nb-merch__button nb-merch__button--danger" onClick={() => removePromo(promo)} disabled={busy}><FiTrash2 /> Sil</button></div>
        </div>
      </article>)}
    </div> : <div className="nb-merch__empty"><FiImage /><span>{filter ? "Bu növdə promo tapılmadı." : "Hələ kampaniya və ya banner əlavə edilməyib."}</span></div>}
  </div>;
}
