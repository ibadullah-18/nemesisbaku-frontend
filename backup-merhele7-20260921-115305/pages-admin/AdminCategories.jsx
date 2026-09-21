import { useEffect, useMemo, useState } from "react";
import { FiGrid, FiPlus, FiRefreshCw, FiSearch, FiTrash2 } from "react-icons/fi";
import { adminCategoriesApi, listAdmin } from "../../api/admin/adminApi";
import AdminCatalogImage from "../../components/admin/AdminCatalogImage";
import { useAdminToastState } from "../../utils/adminToast";
import "./adminCatalog.css";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useAdminToastState("error");
  const [success, setSuccess] = useAdminToastState("success");

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");
      const response = await adminCategoriesApi.list();
      setCategories(listAdmin(response));
    } catch (err) {
      setError(err?.message || "Kateqoriyalar yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadCategories, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createCategory(event) {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanUrl = iconUrl.trim();
    if (!cleanName) { setError("Kateqoriya adını daxil edin."); return; }
    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
      setError("Şəkil bağlantısı http:// və ya https:// ilə başlamalıdır.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await adminCategoriesApi.create({ name: cleanName, iconUrl: cleanUrl || null });
      setName("");
      setIconUrl("");
      setPreviewUrl("");
      setSuccess("Kateqoriya əlavə edildi.");
      await loadCategories();
    } catch (err) {
      setError(err?.message || "Kateqoriya əlavə edilmədi.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category) {
    if (!window.confirm(`“${category.name}” kateqoriyası silinsin?`)) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await adminCategoriesApi.delete(category.id);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setSuccess("Kateqoriya silindi.");
    } catch (err) {
      setError(err?.message || "Kateqoriya silinmədi.");
    } finally {
      setSaving(false);
    }
  }

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("az-AZ");
    return categories.filter((category) =>
      String(category.name || "").toLocaleLowerCase("az-AZ").includes(query));
  }, [categories, search]);

  return <div className="nb-catalog">
    <header className="nb-catalog__header">
      <div><p className="nb-catalog__eyebrow">nemesisbaku / kataloq</p><h1>Kateqoriyalar</h1>
        <p>Məhsulları qruplaşdırmaq üçün kateqoriyalar.</p></div>
      <button type="button" className="nb-catalog__reload" disabled={loading || saving} onClick={loadCategories}>
        <FiRefreshCw aria-hidden="true" /> Yenilə
      </button>
    </header>

    {error && <div className="nb-catalog__alert nb-catalog__alert--error" role="alert">{error}
      <button type="button" onClick={loadCategories}>Yenidən yoxla</button></div>}
    {success && <div className="nb-catalog__alert nb-catalog__alert--success" role="status">{success}</div>}

    <div className="nb-catalog__layout">
      <section className="nb-catalog__panel nb-catalog__editor" aria-labelledby="category-new-title">
        <div className="nb-catalog__panel-head"><div className="nb-catalog__panel-icon"><FiGrid aria-hidden="true" /></div>
          <h2 id="category-new-title">Yeni kateqoriya</h2>
          <p>Ad daxil edin, istəsəniz ikon bağlantısı əlavə edin.</p></div>
        <form onSubmit={createCategory} className="nb-catalog__form">
          <label className="nb-catalog__field">Kateqoriya adı <span>*</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120}
              placeholder="Kateqoriya adı" disabled={saving} />
          </label>
          <label className="nb-catalog__field">İkon şəkil bağlantısı
            <input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} type="url"
              onBlur={() => setPreviewUrl(iconUrl.trim())}
              placeholder="https://..." disabled={saving} />
            <small>Bu sahə şəkil faylı deyil, mövcud şəklin URL-idir.</small>
          </label>
          {previewUrl && <AdminCatalogImage key={previewUrl} src={previewUrl}
            alt={name || "Kateqoriya ikonu"} className="nb-catalog__preview" />}
          <button type="submit" className="nb-catalog__primary" disabled={saving}>
            <FiPlus aria-hidden="true" /> {saving ? "Əlavə olunur..." : "Kateqoriya əlavə et"}
          </button>
        </form>
      </section>

      <section className="nb-catalog__panel nb-catalog__results" aria-labelledby="category-list-title" aria-busy={loading}>
        <div className="nb-catalog__results-head">
          <div><p className="nb-catalog__section-label">KATEQORİYALAR</p>
            <h2 id="category-list-title">Siyahı <span>{categories.length}</span></h2></div>
          <label className="nb-catalog__search"><FiSearch aria-hidden="true" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Kateqoriya axtar" aria-label="Kateqoriya axtar" /></label>
        </div>
        {loading ? <div className="nb-catalog__empty" role="status">Kateqoriyalar yüklənir...</div>
          : visible.length ? <div className="nb-catalog__grid">
            {visible.map((category) => <article className="nb-catalog__tile" key={category.id}>
              <AdminCatalogImage key={category.iconUrl || "empty"} src={category.iconUrl}
                alt={category.name || "Kateqoriya"} />
              <h3>{category.name || "Adsız kateqoriya"}</h3>
              <button type="button" className="nb-catalog__tile-action nb-catalog__tile-action--delete"
                disabled={saving} onClick={() => deleteCategory(category)}
                aria-label={`${category.name} kateqoriyasını sil`}><FiTrash2 aria-hidden="true" /> Sil</button>
            </article>)}
          </div> : <div className="nb-catalog__empty">Kateqoriya tapılmadı.</div>}
      </section>
    </div>
  </div>;
}
