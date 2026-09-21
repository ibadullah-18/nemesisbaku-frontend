import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiCalendar, FiEdit3, FiGrid, FiLayers, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { adminHomeSectionsApi, listAdmin } from "../../api/admin/adminApi";
import { getPanelBasePath } from "../../api/admin/adminAuth";
import { useAdminToastState } from "../../utils/adminToast";
import "./adminMerchandising.css";

const formatDate = (value) => value ? String(value).slice(0, 10) : "—";

export default function AdminHomeSections() {
  const [sections, setSections] = useState([]);
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
    adminHomeSectionsApi.list().then((result) => {
      if (active) { setSections(listAdmin(result)); setError(""); }
    }).catch((err) => { if (active) setError(err.message || "Bölmələr yüklənmədi."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [setError]);

  async function reload() {
    try { setLoading(true); setSections(listAdmin(await adminHomeSectionsApi.list())); setError(""); }
    catch (err) { setError(err.message || "Bölmələr yüklənmədi."); }
    finally { setLoading(false); }
  }

  async function removeSection(section) {
    if (!window.confirm(`“${section.title || "Bölmə"}” silinsin?`)) return;
    try {
      setBusy(true);
      await adminHomeSectionsApi.delete(section.id);
      await reload();
      setSuccess("Bölmə silindi.");
    } catch (err) { setError(err.message || "Bölmə silinmədi."); }
    finally { setBusy(false); }
  }

  const stats = [["Ümumi", sections.length], ["Aktiv", sections.filter((section) => section.isActive).length], ["Passiv", sections.filter((section) => !section.isActive).length], ["Məhsul əlaqəsi", sections.reduce((sum, section) => sum + (section.productIds || []).length, 0)]];
  const sorted = [...sections].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));

  return <div className="nb-merch">
    <header className="nb-merch__header">
      <div><p className="nb-merch__eyebrow">nemesisbaku · ana səhifə</p><h1>Ana səhifə bölmələri</h1><p>Məhsul bölmələrinin sırasını, tarixini və aktivliyini idarə edin.</p></div>
      <div className="nb-merch__actions"><button type="button" className="nb-merch__button" onClick={reload} disabled={busy || loading}><FiRefreshCw /> Yenilə</button><NavLink className="nb-merch__button nb-merch__button--primary" to={`${basePath}/home-sections/create`}><FiPlus /> Yeni bölmə</NavLink></div>
    </header>
    {error && <p className="nb-merch__alert" role="alert">{error}</p>}
    <div className="nb-merch__stats">{stats.map(([label, value]) => <div className="nb-merch__stat" key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
    {loading ? <div className="nb-merch__loading" role="status">Bölmələr yüklənir…</div> : sorted.length ? <div className="nb-merch__grid">
      {sorted.map((section) => <article key={section.id} className="nb-merch__card">
        <div className="nb-merch__card-body">
          <div className="nb-merch__card-heading"><span className="nb-merch__section-mark" aria-label={`Sıra ${section.displayOrder}`}>{section.displayOrder}</span><span className={`nb-merch__badge ${section.isActive ? "nb-merch__badge--green" : "nb-merch__badge--inactive"}`}>{section.isActive ? "Aktiv" : "Passiv"}</span></div>
          <h2>{section.title || "Adsız bölmə"}</h2><p>{section.subtitle || "Alt başlıq yoxdur"}</p>
          <div className="nb-merch__details"><span><FiCalendar /> {formatDate(section.startDate)} – {formatDate(section.endDate)}</span><span><FiLayers /> {(section.productIds || []).length} məhsul</span></div>
          <div className="nb-merch__card-actions"><NavLink className="nb-merch__button" to={`${basePath}/home-sections/${section.id}`}><FiEdit3 /> Düzəliş et</NavLink><button type="button" className="nb-merch__button nb-merch__button--danger" onClick={() => removeSection(section)} disabled={busy}><FiTrash2 /> Sil</button></div>
        </div>
      </article>)}
    </div> : <div className="nb-merch__empty"><FiGrid /><span>Hələ ana səhifə bölməsi əlavə edilməyib.</span></div>}
  </div>;
}
