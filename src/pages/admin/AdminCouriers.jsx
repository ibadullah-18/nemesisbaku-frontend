import { useEffect, useMemo, useState } from "react";
import {
  FiEdit3,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiStar,
  FiTrash2,
  FiTruck,
  FiX,
} from "react-icons/fi";
import { adminCouriersApi, listAdmin } from "../../api/admin/adminApi";
import AdminFloatingActions from "../../components/admin/AdminFloatingActions";
import AppLoader from "../../components/common/AppLoader";
import { useAdminToastState } from "../../utils/adminToast";
import "./adminCommunications.css";

const emptyForm = { title: "", phoneNumber: "", isDefault: false };

function courierId(item) {
  return item?.id || item?.courierId || "";
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("994")) return digits;
  return digits.length === 9 ? `994${digits}` : digits;
}

function displayPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 12 || !digits.startsWith("994")) return value || "—";
  return `+994 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
}

export default function AdminCouriers() {
  const [couriers, setCouriers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [, setError] = useAdminToastState("error");
  const [, setSuccess] = useAdminToastState("success");

  async function loadCouriers(showNotice = false) {
    try {
      if (showNotice) setRefreshing(true);
      else setLoading(true);
      const response = await adminCouriersApi.list();
      setCouriers(listAdmin(response));
      if (showNotice) setSuccess("Kuryer siyahısı yeniləndi.");
    } catch (error) {
      setError(error.message || "Kuryerlər yüklənmədi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCouriers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
  }

  function editCourier(item) {
    setEditingId(courierId(item));
    setForm({
      title: item.title || "",
      phoneNumber: item.phoneNumber || "",
      isDefault: Boolean(item.isDefault),
    });
  }

  async function saveCourier(event) {
    event.preventDefault();
    const phoneNumber = normalizePhone(form.phoneNumber);

    if (!form.title.trim()) return setError("Kuryer adı yazılmalıdır.");
    if (!phoneNumber) return setError("Kuryer telefon nömrəsi yazılmalıdır.");
    if (!phoneNumber.startsWith("994") || phoneNumber.length !== 12) {
      return setError("Telefonu 994501112233 formatında yazın.");
    }

    try {
      setSaving(true);
      const body = {
        title: form.title.trim(),
        phoneNumber,
        isDefault: Boolean(form.isDefault),
      };

      if (editingId) {
        await adminCouriersApi.update(editingId, body);
        setSuccess("Kuryer məlumatları yeniləndi.");
      } else {
        await adminCouriersApi.create(body);
        setSuccess("Yeni kuryer əlavə edildi.");
      }

      resetForm();
      await loadCouriers();
    } catch (error) {
      setError(error.message || "Kuryer yadda saxlanılmadı.");
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault(item) {
    const id = courierId(item);
    if (!id) return setError("Kuryer ID-si gəlmədi.");
    if (item.isDefault) return setSuccess("Bu kuryer artıq əsas kuryerdir.");

    try {
      setBusyId(id);
      await adminCouriersApi.setDefault(id);
      setSuccess(`${item.title || "Kuryer"} əsas kuryer seçildi.`);
      await loadCouriers();
    } catch (error) {
      setError(error.message || "Əsas kuryer dəyişdirilmədi.");
    } finally {
      setBusyId("");
    }
  }

  async function deleteCourier(item) {
    const id = courierId(item);
    if (!id) return setError("Kuryer ID-si gəlmədi.");
    if (!window.confirm(`${item.title || "Bu kuryer"} silinsin?`)) return;

    try {
      setBusyId(id);
      await adminCouriersApi.delete(id);
      if (editingId === id) resetForm();
      setSuccess("Kuryer silindi.");
      await loadCouriers();
    } catch (error) {
      setError(error.message || "Kuryer silinmədi.");
    } finally {
      setBusyId("");
    }
  }

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return couriers;
    return couriers.filter((item) =>
      `${item.title || ""} ${item.phoneNumber || ""}`.toLowerCase().includes(value),
    );
  }, [couriers, search]);

  const defaultCourier = couriers.find((item) => item.isDefault);

  if (loading) return <AppLoader text="Kuryerlər yüklənir" />;

  return (
    <main className="nb-comm-page">
      <header className="nb-comm-header">
        <div>
          <p className="nb-comm-eyebrow">nemesisbaku · çatdırılma</p>
          <h1>Kuryerlər</h1>
          <p>Sifarişi WhatsApp ilə düzgün kuryerə yönləndirmək üçün nömrələri idarə edin.</p>
        </div>
        <div className="nb-comm-header__signal"><FiTruck /><span><small>Əsas kuryer</small><strong>{defaultCourier?.title || "Seçilməyib"}</strong></span></div>
      </header>

      <section className="nb-comm-stats">
        <Stat icon={<FiTruck />} label="Kuryer sayı" value={couriers.length} />
        <Stat icon={<FiStar />} label="Əsas kuryer" value={defaultCourier?.title || "Yoxdur"} accent />
        <Stat icon={<FiPhone />} label="Əsas nömrə" value={displayPhone(defaultCourier?.phoneNumber)} />
      </section>

      <div className="nb-comm-layout">
        <section className="nb-comm-card nb-comm-form-card">
          <div className="nb-comm-card__head">
            <div><p className="nb-comm-eyebrow">{editingId ? "Redaktə rejimi" : "Yeni qeyd"}</p><h2>{editingId ? "Kuryeri yenilə" : "Kuryer əlavə et"}</h2></div>
            {editingId ? <button type="button" onClick={resetForm} aria-label="Redaktəni bağla"><FiX /></button> : null}
          </div>

          <form id="admin-courier-form" className="nb-comm-form" onSubmit={saveCourier}>
            <Field icon={<FiTruck />} label="Kuryer adı" placeholder="Əli kuryer" value={form.title} onChange={(value) => setForm((old) => ({ ...old, title: value }))} />
            <Field icon={<FiPhone />} label="Telefon nömrəsi" placeholder="994501112233" value={form.phoneNumber} onChange={(value) => setForm((old) => ({ ...old, phoneNumber: value }))} />
            <button className={`nb-switch-row ${form.isDefault ? "is-on" : ""}`} type="button" onClick={() => setForm((old) => ({ ...old, isDefault: !old.isDefault }))}>
              <span><FiStar /><span><strong>Əsas kuryer olsun</strong><small>Sifariş yönləndirməsində ilkin seçilsin</small></span></span>
              <i><b /></i>
            </button>
          </form>

          <div className="nb-phone-preview">
            <span><FiPhone /></span>
            <div><small>WhatsApp üçün saxlanacaq nömrə</small><strong>{displayPhone(normalizePhone(form.phoneNumber))}</strong></div>
          </div>
        </section>

        <section className="nb-comm-card">
          <div className="nb-comm-list-head">
            <div><h2>Kuryer siyahısı</h2><p>{couriers.length} aktiv qeyd</p></div>
            <label className="nb-comm-search"><FiSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ad və ya nömrə axtar" /></label>
          </div>

          <div className="nb-courier-grid">
            {filtered.map((item) => {
              const id = courierId(item);
              return (
                <article key={id || item.phoneNumber} className={`nb-courier-card ${item.isDefault ? "is-default" : ""}`}>
                  <div className="nb-courier-card__top">
                    <span className="nb-courier-card__icon"><FiTruck /></span>
                    <div><strong>{item.title || "Adsız kuryer"}</strong><a href={`tel:+${item.phoneNumber}`}>{displayPhone(item.phoneNumber)}</a></div>
                    {item.isDefault ? <em><FiStar /> Əsas</em> : null}
                  </div>
                  <div className="nb-courier-card__actions">
                    <button type="button" disabled={busyId === id} onClick={() => editCourier(item)}><FiEdit3 /> Yenilə</button>
                    <button type="button" disabled={busyId === id || item.isDefault} onClick={() => makeDefault(item)}><FiStar /> Əsas et</button>
                    <button className="is-danger" type="button" disabled={busyId === id} onClick={() => deleteCourier(item)}><FiTrash2 /></button>
                  </div>
                </article>
              );
            })}
            {filtered.length === 0 ? <div className="nb-comm-empty">Kuryer tapılmadı.</div> : null}
          </div>
        </section>
      </div>

      <AdminFloatingActions status={editingId ? "Kuryer redaktə edilir" : "Yeni kuryer"}>
        {editingId ? <button type="button" onClick={resetForm}><FiX /> Ləğv et</button> : null}
        <button type="button" disabled={refreshing || saving} onClick={() => loadCouriers(true)}><FiRefreshCw /> Yenilə</button>
        <button className="is-primary" form="admin-courier-form" type="submit" disabled={saving}><FiPlus /> {saving ? "Saxlanılır…" : editingId ? "Yadda saxla" : "Əlavə et"}</button>
      </AdminFloatingActions>
    </main>
  );
}

function Stat({ icon, label, value, accent = false }) {
  return <article className={`nb-comm-stat ${accent ? "is-accent" : ""}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}

function Field({ icon, label, placeholder, value, onChange }) {
  return <label className="nb-comm-field"><span>{label}</span><div>{icon}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></div></label>;
}
