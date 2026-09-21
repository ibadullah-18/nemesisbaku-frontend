import { useEffect, useMemo, useState } from "react";
import { FiDroplet, FiPlus, FiRefreshCw, FiSearch, FiTrash2 } from "react-icons/fi";
import { adminColorsApi, listAdmin } from "../../api/admin/adminApi";
import "./adminCatalog.css";
import "./adminMerchandising.css";

const emptyForm = { name: "", hexCode: "#244989" };
const isHex = (value) => /^#[0-9a-f]{6}$/i.test(value.trim());

export default function AdminColors() {
  const [colors, setColors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { void loadColors(); }, []);

  async function loadColors() {
    try {
      setLoading(true);
      setError("");
      setColors(listAdmin(await adminColorsApi.list()));
    } catch (err) {
      setError(err.message || "Rənglər yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  async function addColor(event) {
    event.preventDefault();
    const name = form.name.trim();
    const hexCode = form.hexCode.trim().toUpperCase();
    setError("");
    setSuccess("");
    if (!name) return setError("Rəngin adını yazın.");
    if (!isHex(hexCode)) return setError("HEX kodu #RRGGBB formasında yazın.");
    try {
      setBusy(true);
      await adminColorsApi.create({ name, hexCode });
      setForm(emptyForm);
      await loadColors();
      setSuccess("Rəng əlavə edildi.");
    } catch (err) {
      setError(err.message || "Rəng əlavə edilmədi.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteColor(color) {
    if (!window.confirm(`“${color.name || "Rəng"}” silinsin?`)) return;
    try {
      setBusy(true);
      setError("");
      setSuccess("");
      await adminColorsApi.delete(color.id);
      await loadColors();
      setSuccess("Rəng silindi.");
    } catch (err) {
      setError(err.message || "Rəng silinmədi. Məhsul variantlarında istifadə edilə bilər.");
    } finally {
      setBusy(false);
    }
  }

  const filteredColors = useMemo(() => {
    const text = search.trim().toLocaleLowerCase("az");
    return colors.filter((color) =>
      `${color.name || ""} ${color.hexCode || ""}`.toLocaleLowerCase("az").includes(text),
    );
  }, [colors, search]);

  return (
    <div className="nb-catalog">
      <header className="nb-catalog__header">
        <div>
          <p className="nb-catalog__eyebrow">nemesisbaku · kataloq</p>
          <h1>Rənglər</h1>
          <p>Məhsul variantları üçün rəng adları və kodları.</p>
        </div>
        <button type="button" className="nb-catalog__reload" disabled={loading || busy} onClick={loadColors}>
          <FiRefreshCw aria-hidden="true" /> Yenilə
        </button>
      </header>
      {error && <div role="alert" className="nb-catalog__alert nb-catalog__alert--error">{error}<button type="button" onClick={() => setError("")}>Bağla</button></div>}
      {success && <div role="status" className="nb-catalog__alert nb-catalog__alert--success">{success}<button type="button" onClick={() => setSuccess("")}>Bağla</button></div>}
      <div className="nb-catalog__layout">
        <section className="nb-catalog__panel nb-catalog__editor">
          <div className="nb-catalog__panel-head">
            <span className="nb-catalog__panel-icon"><FiDroplet aria-hidden="true" /></span>
            <h2>Yeni rəng</h2>
            <p>Rəngi əlavə etdikdən sonra məhsul variantında seçə bilərsiniz.</p>
          </div>
          <form className="nb-catalog__form" onSubmit={addColor}>
            <label className="nb-catalog__field"><span>Rəngin adı</span>
              <input maxLength={100} value={form.name} placeholder="Məsələn: Tünd göy" onChange={(event) => setForm((old) => ({ ...old, name: event.target.value }))} />
            </label>
            <label className="nb-catalog__field"><span>HEX kodu</span>
              <div className="nb-color-input">
                <input type="color" aria-label="Rəng seç" value={isHex(form.hexCode) ? form.hexCode : "#244989"} onChange={(event) => setForm((old) => ({ ...old, hexCode: event.target.value }))} />
                <input value={form.hexCode} maxLength={7} placeholder="#244989" onChange={(event) => setForm((old) => ({ ...old, hexCode: event.target.value }))} />
              </div>
              <small>6 rəqəmli kod, məsələn #244989.</small>
            </label>
            <div className="nb-color-sample">
              <span className="nb-color-sample__swatch" style={{ background: isHex(form.hexCode) ? form.hexCode : "#244989" }} />
              <div><strong>{form.name || "Rəng nümunəsi"}</strong><small>{form.hexCode}</small></div>
            </div>
            <button type="submit" className="nb-catalog__primary" disabled={busy || loading}>
              <FiPlus aria-hidden="true" /> {busy ? "Əlavə olunur…" : "Rəng əlavə et"}
            </button>
          </form>
        </section>
        <section className="nb-catalog__panel">
          <div className="nb-catalog__results-head">
            <div><p className="nb-catalog__section-label">KATALOQ</p><h2>Rənglər <span>{colors.length}</span></h2></div>
            <label className="nb-catalog__search"><FiSearch aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ad və ya kod axtar" aria-label="Rəng axtar" /></label>
          </div>
          {loading ? <div className="nb-catalog__empty" role="status">Rənglər yüklənir…</div> : filteredColors.length ? (
            <div className="nb-catalog__grid nb-color-grid">
              {filteredColors.map((color) => (
                <article className="nb-catalog__tile nb-color-tile" key={color.id}>
                  <span className="nb-color-tile__swatch" style={{ background: isHex(color.hexCode || "") ? color.hexCode : "#f0f2f5" }} />
                  <h3>{color.name || "Adsız rəng"}</h3>
                  <small>{color.hexCode || "Kod yoxdur"}</small>
                  <button type="button" className="nb-catalog__tile-action nb-catalog__tile-action--delete" disabled={busy} onClick={() => deleteColor(color)} aria-label={`${color.name || "Rəng"} sil`}><FiTrash2 aria-hidden="true" /> Sil</button>
                </article>
              ))}
            </div>
          ) : <div className="nb-catalog__empty">{search ? "Axtarışa uyğun rəng tapılmadı." : "Rəng siyahısı boşdur."}</div>}
        </section>
      </div>
    </div>
  );
}
