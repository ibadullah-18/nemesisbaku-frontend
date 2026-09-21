import { useEffect, useMemo, useState } from "react";
import { FiMaximize2, FiPlus, FiRefreshCw, FiSearch, FiTrash2 } from "react-icons/fi";
import { adminSizesApi, listAdmin } from "../../api/admin/adminApi";
import { useAdminToastState } from "../../utils/adminToast";
import "./adminCatalog.css";

const sizeCollator = new Intl.Collator("az-AZ", { numeric: true, sensitivity: "base" });

export default function AdminSizes() {
  const [sizes, setSizes] = useState([]);
  const [sizeValue, setSizeValue] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useAdminToastState("error");
  const [success, setSuccess] = useAdminToastState("success");

  async function loadSizes() {
    try {
      setLoading(true);
      setError("");
      const response = await adminSizesApi.list();
      setSizes(listAdmin(response));
    } catch (err) {
      setError(err?.message || "Ölçülər yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadSizes, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addSize(event) {
    event.preventDefault();
    const value = sizeValue.trim();
    if (!value) { setError("Ölçü dəyərini daxil edin."); return; }
    if (sizes.some((item) => sizeCollator.compare(String(item.value || ""), value) === 0)) {
      setError("Bu ölçü artıq siyahıdadır.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await adminSizesApi.create(value);
      setSizeValue("");
      setSuccess("Ölçü əlavə edildi.");
      await loadSizes();
    } catch (err) {
      setError((err?.message || "Ölçü əlavə edilmədi.").replace(/razmer/gi, "ölçü"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteSize(item) {
    if (!window.confirm(`“${item.value}” ölçüsü silinsin?`)) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await adminSizesApi.delete(item.id);
      setSizes((current) => current.filter((entry) => entry.id !== item.id));
      setSuccess("Ölçü silindi.");
    } catch (err) {
      setError((err?.message || "Ölçü silinmədi.").replace(/razmer/gi, "ölçü"));
    } finally {
      setSaving(false);
    }
  }

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("az-AZ");
    return sizes.filter((item) => String(item.value || "")
      .toLocaleLowerCase("az-AZ").includes(query))
      .sort((a, b) => sizeCollator.compare(String(a.value || ""), String(b.value || "")));
  }, [sizes, search]);

  return <div className="nb-catalog">
    <header className="nb-catalog__header">
      <div><p className="nb-catalog__eyebrow">nemesisbaku / kataloq</p><h1>Ölçülər</h1>
        <p>Məhsul variantlarında seçilən ayaqqabı ölçüləri.</p></div>
      <button type="button" className="nb-catalog__reload" disabled={loading || saving} onClick={loadSizes}>
        <FiRefreshCw aria-hidden="true" /> Yenilə
      </button>
    </header>

    {error && <div className="nb-catalog__alert nb-catalog__alert--error" role="alert">{error}
      <button type="button" onClick={loadSizes}>Yenidən yoxla</button></div>}
    {success && <div className="nb-catalog__alert nb-catalog__alert--success" role="status">{success}</div>}

    <div className="nb-catalog__layout">
      <section className="nb-catalog__panel nb-catalog__editor" aria-labelledby="size-new-title">
        <div className="nb-catalog__panel-head">
          <div className="nb-catalog__panel-icon"><FiMaximize2 aria-hidden="true" /></div>
          <h2 id="size-new-title">Yeni ölçü</h2>
          <p>Məhsullarda seçilə bilən ölçünü əlavə edin.</p>
        </div>
        <form className="nb-catalog__form" onSubmit={addSize}>
          <label className="nb-catalog__field">Ölçü <span>*</span>
            <input value={sizeValue} onChange={(e) => setSizeValue(e.target.value)}
              placeholder="Məsələn, 42" required maxLength={25} disabled={saving} />
          </label>
          <button type="submit" className="nb-catalog__primary" disabled={saving}>
            <FiPlus aria-hidden="true" /> {saving ? "Əlavə olunur..." : "Ölçü əlavə et"}
          </button>
        </form>
      </section>

      <section className="nb-catalog__panel nb-catalog__results" aria-labelledby="size-list-title" aria-busy={loading}>
        <div className="nb-catalog__results-head">
          <div><p className="nb-catalog__section-label">ÖLÇÜLƏR</p>
            <h2 id="size-list-title">Siyahı <span>{sizes.length}</span></h2></div>
          <label className="nb-catalog__search"><FiSearch aria-hidden="true" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Ölçü axtar" aria-label="Ölçü axtar" /></label>
        </div>
        {loading ? <div className="nb-catalog__empty" role="status">Ölçülər yüklənir...</div>
          : visible.length ? <div className="nb-catalog__grid nb-catalog__grid--sizes">
            {visible.map((item) => <article className="nb-catalog__tile nb-catalog__tile--size" key={item.id}>
              <span className="nb-catalog__size-value">{item.value || "—"}</span>
              <button type="button" className="nb-catalog__tile-action nb-catalog__tile-action--delete"
                disabled={saving} onClick={() => deleteSize(item)}
                aria-label={`${item.value} ölçüsünü sil`}><FiTrash2 aria-hidden="true" /> Sil</button>
            </article>)}
          </div> : <div className="nb-catalog__empty">Ölçü tapılmadı.</div>}
      </section>
    </div>
  </div>;
}
