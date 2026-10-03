import { useEffect, useRef, useState } from "react";
import { adminMetroStationsApi, listAdmin, unwrapAdmin } from "../../api/admin/adminApi";
import "./adminMerchandising.css";
import "./adminShowcase.css";

const empty = { name: "", latitude: "", longitude: "", address: "", isActive: true };

export default function AdminMetroStations() {
  const [stations, setStations] = useState([]);
  const [form, setForm] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const lock = useRef(false);

  useEffect(() => {
    let alive = true;
    adminMetroStationsApi.list().then(res => { if (alive) { setStations(listAdmin(res)); setError(""); } })
      .catch(err => { if (alive) setError(err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [revision]);

  async function save(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setSaving(true); setError(""); setNotice("");
    try {
      const station = unwrapAdmin(await adminMetroStationsApi.save(form.id, {
        ...form, name: form.name.trim(), latitude: Number(form.latitude), longitude: Number(form.longitude),
      }));
      setStations(prev => [...prev.filter(s => s.id !== station.id), station].sort((a, b) => a.name.localeCompare(b.name, "az")));
      setForm(null); setNotice("Metro məlumatı saxlanıldı. Yeni hesablamalarda tətbiq olunacaq.");
    } catch (err) { setError(err.message); }
    finally { lock.current = false; setSaving(false); }
  }

  return <div className="nb-merch nb-showcase-admin">
    <header className="nb-showcase-admin__header"><div><h1>Metro stansiyaları</h1><p>Ünvana çatdırılma üçün ən yaxın aktiv metro avtomatik seçilir.</p></div><button type="button" className="nb-merch__button nb-merch__button--primary" disabled={saving} onClick={() => { setForm({ ...empty }); setNotice(""); }}>Yeni metro</button></header>
    {error && <div role="alert" className="nb-showcase-admin__error">{error} <button type="button" disabled={saving} onClick={() => { setLoading(true); setRevision(v => v + 1); }}>Siyahını yenilə</button></div>}
    {notice && <p role="status">{notice}</p>}
    <div className="nb-showcase-admin__card"><p>Metroda təhvil: <strong>4 AZN</strong>. Metrodan 1 km-dək: <strong>6 AZN</strong>. 1–2 km: <strong>7 AZN</strong>. 2 km-dən uzaqda mövcud mağaza tarifi.</p><p>İlkin 27 nöqtə rəsmi siyahıdakı 1-ci çıxışlardır. Məsafə düz xətt üzrə ölçülür. Deaktiv metro hesablamada və müştərinin təhvil seçimində görünmür.</p><a href="https://opendata.az/@baki-metropoliteni/metro-cixislari-uzre-koordinatlar" target="_blank" rel="noreferrer" className="underline">Koordinatların rəsmi mənbəyi</a></div>
    {form && <form className="nb-showcase-admin__card" onSubmit={save}><h2>{form.id ? "Metro məlumatını düzəlt" : "Yeni metro"}</h2><fieldset disabled={saving}>
      <label>Metro adı<input required maxLength={120} value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} /></label>
      <div className="nb-showcase-admin__fields"><label>Enlik (Latitude)<input required type="number" step="0.000001" min="-90" max="90" value={form.latitude} onChange={e => setForm(v => ({ ...v, latitude: e.target.value }))} /></label><label>Uzunluq (Longitude)<input required type="number" step="0.000001" min="-180" max="180" value={form.longitude} onChange={e => setForm(v => ({ ...v, longitude: e.target.value }))} /></label></div>
      <label>Ünvan / çıxış qeydi<input maxLength={300} value={form.address || ""} onChange={e => setForm(v => ({ ...v, address: e.target.value }))} /></label>
      <label className="nb-showcase-admin__check"><input type="checkbox" checked={form.isActive} onChange={e => setForm(v => ({ ...v, isActive: e.target.checked }))} /> Aktiv</label>
      <div className="nb-showcase-admin__actions"><button className="nb-merch__button nb-merch__button--primary" type="submit">{saving ? "Saxlanılır…" : "Saxla"}</button><button className="nb-merch__button" type="button" onClick={() => setForm(null)}>Ləğv et</button></div>
    </fieldset></form>}
    <label>Metro axtar<input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label>
    {loading ? <p role="status">Yüklənir…</p> : <div className="nb-merch__grid">{stations.filter(s => s.name.toLocaleLowerCase("az").includes(search.toLocaleLowerCase("az"))).map(s => <article key={s.id} className="nb-showcase-admin__card"><h2>{s.name}</h2><p>{s.address}</p><p>{s.latitude}, {s.longitude}</p><span className="nb-merch__badge">{s.isActive ? "Aktiv" : "Deaktiv"}</span><div className="nb-showcase-admin__actions"><button className="nb-merch__button" type="button" disabled={saving} onClick={() => { setForm({ ...s }); setNotice(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Düzəliş et</button><a className="nb-merch__button" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`}>Xəritədə bax</a></div></article>)}</div>}
  </div>;
}
