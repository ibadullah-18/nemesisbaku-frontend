import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiMail,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiUsers,
} from "react-icons/fi";
import { adminEmailAnnouncementsApi, listAdmin } from "../../api/admin/adminApi";
import AdminFloatingActions from "../../components/admin/AdminFloatingActions";
import AppLoader from "../../components/common/AppLoader";
import { useAdminToastState } from "../../utils/adminToast";
import "./adminCommunications.css";

const emptyForm = { title: "", description: "", buttonText: "", buttonUrl: "" };

function formatDate(value) {
  if (!value) return "—";
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

function validWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sendState(item) {
  const total = Number(item.totalRecipients || 0);
  const sent = Number(item.sentCount || 0);
  const failed = Number(item.failedCount || 0);
  const processed = sent + failed;

  if (total === 0) return { label: "Alıcı yoxdur", tone: "is-muted", percent: 0 };
  if (processed >= total) return { label: failed ? "Xətalarla tamamlandı" : "Tamamlandı", tone: failed ? "is-warning" : "is-success", percent: 100 };
  if (processed === 0) return { label: "Növbədə", tone: "is-queue", percent: 0 };
  return { label: "Göndərilir", tone: "is-queue", percent: Math.min(100, Math.round((processed / total) * 100)) };
}

export default function AdminEmailAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [, setError] = useAdminToastState("error");
  const [, setSuccess] = useAdminToastState("success");

  async function loadAnnouncements(showNotice = false) {
    try {
      if (showNotice) setRefreshing(true);
      else setLoading(true);
      const response = await adminEmailAnnouncementsApi.list();
      setAnnouncements(listAdmin(response));
      if (showNotice) setSuccess("Email göndəriş tarixçəsi yeniləndi.");
    } catch (error) {
      setError(error.message || "Email göndəriş tarixçəsi yüklənmədi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendAnnouncement(event) {
    event.preventDefault();
    const hasButtonText = Boolean(form.buttonText.trim());
    const hasButtonUrl = Boolean(form.buttonUrl.trim());

    if (!form.title.trim()) return setError("Email başlığı yazılmalıdır.");
    if (!form.description.trim()) return setError("Email açıqlaması yazılmalıdır.");
    if (hasButtonText !== hasButtonUrl) return setError("Düymə istifadə edilirsə həm yazısı, həm də linki doldurulmalıdır.");
    if (hasButtonUrl && !validWebUrl(form.buttonUrl.trim())) return setError("Düymə linkini https:// ilə başlayan düzgün ünvan kimi yazın.");
    if (!window.confirm("Bu email bütün aktiv və emaili olan istifadəçilərə göndərilsin?")) return;

    try {
      setSending(true);
      await adminEmailAnnouncementsApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        buttonText: hasButtonText ? form.buttonText.trim() : null,
        buttonUrl: hasButtonUrl ? form.buttonUrl.trim() : null,
      });
      setForm(emptyForm);
      setSuccess("Email elan göndəriş növbəsinə əlavə edildi.");
      await loadAnnouncements();
    } catch (error) {
      setError(error.message || "Email elan göndərilmədi.");
    } finally {
      setSending(false);
    }
  }

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return announcements;
    return announcements.filter((item) =>
      `${item.title || ""} ${item.description || ""}`.toLowerCase().includes(value),
    );
  }, [announcements, search]);

  const totals = useMemo(() => announcements.reduce((result, item) => ({
    recipients: result.recipients + Number(item.totalRecipients || 0),
    sent: result.sent + Number(item.sentCount || 0),
    failed: result.failed + Number(item.failedCount || 0),
  }), { recipients: 0, sent: 0, failed: 0 }), [announcements]);

  if (loading) return <AppLoader text="Email göndərişləri yüklənir" />;

  return (
    <main className="nb-comm-page nb-email-page">
      <header className="nb-comm-header">
        <div>
          <p className="nb-comm-eyebrow">nemesisbaku · kommunikasiya</p>
          <h1>Email göndərişləri</h1>
          <p>Aktiv və email ünvanı olan istifadəçilərə toplu elan göndərin.</p>
        </div>
        <div className="nb-comm-header__signal"><FiMail /><span><small>Tarixçədə</small><strong>{announcements.length} göndəriş</strong></span></div>
      </header>

      <section className="nb-comm-stats">
        <Stat icon={<FiUsers />} label="Ümumi alıcı" value={totals.recipients} />
        <Stat icon={<FiCheckCircle />} label="Göndərilib" value={totals.sent} accent />
        <Stat icon={<FiAlertCircle />} label="Uğursuz" value={totals.failed} danger={totals.failed > 0} />
      </section>

      <div className="nb-email-layout">
        <section className="nb-comm-card nb-comm-form-card">
          <div className="nb-comm-card__head"><div><p className="nb-comm-eyebrow">Yeni kampaniya</p><h2>Email hazırla</h2></div><span className="nb-optional-badge">Düymə opsionaldır</span></div>
          <form id="admin-email-form" className="nb-comm-form" onSubmit={sendAnnouncement}>
            <Field label="Başlıq" placeholder="Yeni kolleksiya satışdadır" value={form.title} onChange={(value) => setForm((old) => ({ ...old, title: value }))} />
            <label className="nb-comm-field"><span>Açıqlama</span><textarea rows="7" value={form.description} onChange={(event) => setForm((old) => ({ ...old, description: event.target.value }))} placeholder="İstifadəçilərə göndəriləcək mətn..." /></label>
            <div className="nb-two-fields">
              <Field label="Düymə yazısı · opsional" placeholder="Kolleksiyaya bax" value={form.buttonText} onChange={(value) => setForm((old) => ({ ...old, buttonText: value }))} />
              <Field label="Düymə linki · opsional" placeholder="https://nemesisbaku.az" value={form.buttonUrl} onChange={(value) => setForm((old) => ({ ...old, buttonUrl: value }))} />
            </div>
          </form>

          <div className="nb-email-preview">
            <div className="nb-email-preview__brand">nemesisbaku</div>
            <span>EMAIL ÖNİZLƏMƏSİ</span>
            <h3>{form.title.trim() || "Email başlığı"}</h3>
            <p>{form.description.trim() || "Açıqlama burada görünəcək."}</p>
            {form.buttonText.trim() ? <b>{form.buttonText.trim()}</b> : null}
          </div>
        </section>

        <section className="nb-comm-card">
          <div className="nb-comm-list-head">
            <div><h2>Göndəriş tarixçəsi</h2><p>Worker prosesi üzrə real nəticələr</p></div>
            <label className="nb-comm-search"><FiSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tarixçədə axtar" /></label>
          </div>

          <div className="nb-email-history">
            {filtered.map((item, index) => {
              const state = sendState(item);
              const total = Number(item.totalRecipients || 0);
              const sent = Number(item.sentCount || 0);
              const failed = Number(item.failedCount || 0);

              return (
                <article key={item.id || item.announcementId || index} className="nb-email-item">
                  <div className="nb-email-item__top">
                    <span className="nb-email-item__icon"><FiMail /></span>
                    <div><h3>{item.title || "Başlıqsız email"}</h3><p>{item.description || "Açıqlama yoxdur."}</p></div>
                    <em className={state.tone}>{state.label}</em>
                  </div>
                  <div className="nb-send-progress"><i style={{ width: `${state.percent}%` }} /></div>
                  <div className="nb-email-item__meta">
                    <span><FiClock /> {formatDate(item.createdAt)}</span>
                    <span><FiUsers /> Alıcı: {total}</span>
                    <span><FiCheckCircle /> Göndərilib: {sent}</span>
                    <span className={failed ? "is-failed" : ""}><FiAlertCircle /> Uğursuz: {failed}</span>
                    {item.buttonUrl ? <a href={item.buttonUrl} target="_blank" rel="noreferrer"><FiExternalLink /> Link</a> : null}
                  </div>
                </article>
              );
            })}
            {filtered.length === 0 ? <div className="nb-comm-empty">Email göndərişi tapılmadı.</div> : null}
          </div>
        </section>
      </div>

      <AdminFloatingActions status={sending ? "Email növbəyə əlavə edilir…" : "Yeni email göndərişi"}>
        <button type="button" disabled={refreshing || sending} onClick={() => loadAnnouncements(true)}><FiRefreshCw /> Yenilə</button>
        <button className="is-primary" form="admin-email-form" type="submit" disabled={sending}><FiSend /> {sending ? "Göndərilir…" : "Email göndər"}</button>
      </AdminFloatingActions>
    </main>
  );
}

function Stat({ icon, label, value, accent = false, danger = false }) {
  return <article className={`nb-comm-stat ${accent ? "is-accent" : ""} ${danger ? "is-danger" : ""}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}

function Field({ label, placeholder, value, onChange }) {
  return <label className="nb-comm-field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}
