import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDatabase,
  FiEye,
  FiFilter,
  FiGlobe,
  FiHash,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiX,
} from "react-icons/fi";
import { adminAuditLogsApi, listAdmin, metaAdmin } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";
import { useAdminToastState } from "../../utils/adminToast";
import "./adminInsights.css";

const entityOptions = [
  { value: "", label: "Bütün obyektlər" },
  { value: "Product", label: "Məhsul" },
  { value: "Order", label: "Sifariş" },
  { value: "User", label: "İstifadəçi" },
  { value: "Category", label: "Kateqoriya" },
  { value: "Brand", label: "Brend" },
  { value: "Campaign", label: "Kampaniya" },
];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).replace("T", " ").slice(0, 19);
  return date.toLocaleString("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function actionTone(action) {
  const value = String(action || "").toLowerCase();
  if (value.includes("delete")) return "is-delete";
  if (value.includes("create")) return "is-create";
  if (value.includes("update") || value.includes("status")) return "is-update";
  return "";
}

function entityLabel(value) {
  const labels = {
    product: "Məhsul",
    productvariant: "Məhsul variantı",
    productimage: "Məhsul şəkli",
    order: "Sifariş",
    user: "İstifadəçi",
    category: "Kateqoriya",
    brand: "Brend",
    campaign: "Kampaniya",
    banner: "Banner",
  };
  return labels[String(value || "").toLowerCase()] || value || "—";
}

function shortId(value) {
  return value ? String(value).slice(0, 8) : "—";
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filters, setFilters] = useState({ search: "", action: "", entityName: "", fromDate: "", toDate: "" });
  const [meta, setMeta] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setError] = useAdminToastState("error");
  const [, setSuccess] = useAdminToastState("success");

  async function loadLogs(page = 1, showNotice = false) {
    try {
      if (showNotice) setRefreshing(true);
      else setLoading(true);
      const response = await adminAuditLogsApi.list({ page, pageSize: 20, ...filters });
      setLogs(listAdmin(response));
      setMeta(metaAdmin(response));
      if (showNotice) setSuccess("Audit qeydləri yeniləndi.");
    } catch (error) {
      setLogs([]);
      setError(error.message || "Audit qeydləri yüklənmədi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => ({
    create: logs.filter((log) => String(log.action || "").toLowerCase().includes("create")).length,
    update: logs.filter((log) => /update|status/i.test(String(log.action || ""))).length,
    delete: logs.filter((log) => String(log.action || "").toLowerCase().includes("delete")).length,
  }), [logs]);

  const actionOptions = useMemo(() => {
    const unique = [...new Set(logs.map((log) => log.action).filter(Boolean))].sort();
    return unique;
  }, [logs]);

  if (loading) return <AppLoader text="Audit qeydləri yüklənir" />;

  return (
    <main className="nb-insight-page nb-audit-page">
      <header className="nb-insight-header">
        <div>
          <p className="nb-insight-eyebrow">nemesisbaku · sistem nəzarəti</p>
          <h1>Audit qeydləri</h1>
          <p>SuperAdmin əməliyyatlarının vaxtını, obyektini və texniki izini yoxlayın.</p>
        </div>
        <div className="nb-header-actions">
          <button type="button" disabled={refreshing} onClick={() => loadLogs(meta.page, true)}><FiRefreshCw /> {refreshing ? "Yenilənir…" : "Yenilə"}</button>
        </div>
      </header>

      <section className="nb-insight-stats">
        <AuditStat icon={<FiActivity />} label="Bu səhifədə" value={logs.length} />
        <AuditStat icon={<FiDatabase />} label="Yaratma" value={counts.create} tone="green" />
        <AuditStat icon={<FiShield />} label="Yeniləmə" value={counts.update} tone="blue" />
        <AuditStat icon={<FiX />} label="Silmə" value={counts.delete} tone="red" />
      </section>

      <section className="nb-list-card">
        <div className="nb-audit-filters">
          <label className="nb-search-field"><FiSearch /><input value={filters.search} onChange={(event) => setFilters((old) => ({ ...old, search: event.target.value }))} onKeyDown={(event) => event.key === "Enter" && loadLogs(1)} placeholder="İstifadəçi, açıqlama və ya IP axtar" /></label>
          <select value={filters.action} onChange={(event) => setFilters((old) => ({ ...old, action: event.target.value }))}><option value="">Bütün əməliyyatlar</option>{actionOptions.map((action) => <option key={action} value={action}>{action}</option>)}</select>
          <select value={filters.entityName} onChange={(event) => setFilters((old) => ({ ...old, entityName: event.target.value }))}>{entityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
          <label className="nb-date-field"><span>Başlanğıc</span><input type="date" value={filters.fromDate} onChange={(event) => setFilters((old) => ({ ...old, fromDate: event.target.value }))} /></label>
          <label className="nb-date-field"><span>Son</span><input type="date" value={filters.toDate} onChange={(event) => setFilters((old) => ({ ...old, toDate: event.target.value }))} /></label>
          <button type="button" onClick={() => loadLogs(1)}><FiFilter /> Tətbiq et</button>
        </div>

        <div className="nb-table-scroll">
          <table className="nb-admin-table nb-audit-table">
            <thead><tr><th>Tarix</th><th>İstifadəçi</th><th>Əməliyyat</th><th>Obyekt</th><th>Açıqlama</th><th>IP</th><th></th></tr></thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} onClick={() => setSelectedLog(log)}>
                  <td>{formatDate(log.createdAt)}</td>
                  <td><strong>{log.userFullName || "Sistem"}</strong></td>
                  <td><span className={`nb-action-pill ${actionTone(log.action)}`}>{log.action || "—"}</span></td>
                  <td>{entityLabel(log.entityName)} <small>#{shortId(log.entityId)}</small></td>
                  <td className="nb-audit-description">{log.description || "—"}</td>
                  <td>{log.ipAddress || "—"}</td>
                  <td><button className="nb-open-row" type="button" onClick={(event) => { event.stopPropagation(); setSelectedLog(log); }}><FiEye /></button></td>
                </tr>
              ))}
              {logs.length === 0 ? <tr><td colSpan="7" className="nb-table-empty">Audit qeydi tapılmadı.</td></tr> : null}
            </tbody>
          </table>
        </div>

        <div className="nb-pagination">
          <p>Cəmi {meta.totalCount} qeyd · Səhifə {meta.page} / {meta.totalPages}</p>
          <div><button type="button" disabled={!meta.hasPreviousPage} onClick={() => loadLogs(meta.page - 1)}><FiChevronLeft /> Əvvəlki</button><button type="button" disabled={!meta.hasNextPage} onClick={() => loadLogs(meta.page + 1)}>Növbəti <FiChevronRight /></button></div>
        </div>
      </section>

      {selectedLog ? (
        <div className="nb-modal-backdrop" role="presentation" onMouseDown={() => setSelectedLog(null)}>
          <section className="nb-admin-modal nb-audit-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="nb-admin-modal__head"><div><p className="nb-insight-eyebrow">Audit qeydinin detalları</p><h2>{selectedLog.action || "Əməliyyat"}</h2></div><button type="button" onClick={() => setSelectedLog(null)}><FiX /></button></div>
            <div className="nb-audit-detail-grid">
              <AuditInfo icon={<FiClock />} label="Tarix" value={formatDate(selectedLog.createdAt)} />
              <AuditInfo icon={<FiUser />} label="İstifadəçi" value={selectedLog.userFullName || "Sistem"} />
              <AuditInfo icon={<FiDatabase />} label="Obyekt" value={entityLabel(selectedLog.entityName)} />
              <AuditInfo icon={<FiHash />} label="Obyekt ID" value={selectedLog.entityId || "—"} />
              <AuditInfo icon={<FiGlobe />} label="IP ünvan" value={selectedLog.ipAddress || "—"} />
              <AuditInfo icon={<FiShield />} label="Əməliyyat" value={selectedLog.action || "—"} />
            </div>
            <div className="nb-audit-copy"><span>Açıqlama</span><p>{selectedLog.description || "Açıqlama yoxdur."}</p></div>
            <div className="nb-audit-copy"><span>İstifadəçi agenti</span><p>{selectedLog.userAgent || "Məlumat yoxdur."}</p></div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function AuditStat({ icon, label, value, tone = "" }) {
  return <article className={`nb-insight-stat ${tone ? `is-${tone}` : ""}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}

function AuditInfo({ icon, label, value }) {
  return <div><span>{icon}</span><small>{label}</small><strong>{value}</strong></div>;
}
