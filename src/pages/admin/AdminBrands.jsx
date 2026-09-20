import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiEdit3, FiPlus, FiRefreshCw, FiSearch, FiTag, FiTrash2, FiUploadCloud, FiX,
} from "react-icons/fi";
import { adminBrandsApi, listAdmin } from "../../api/admin/adminApi";
import AdminCatalogImage from "../../components/admin/AdminCatalogImage";
import { IMAGE_ACCEPT, prepareImageFile, revokeImagePreview } from "../../utils/imageFile";
import { useAdminToastState } from "../../utils/adminToast";
import "./adminCatalog.css";

const MAX_IMAGE_INPUT = 25 * 1024 * 1024;

export default function AdminBrands() {
  const previewRef = useRef("");
  const selectionRef = useRef(0);
  const [brands, setBrands] = useState([]);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useAdminToastState("error");
  const [success, setSuccess] = useAdminToastState("success");
  const busy = preparing || saving;

  useEffect(() => () => {
    selectionRef.current += 1;
    revokeImagePreview(previewRef.current);
  }, []);

  async function loadBrands() {
    try {
      setLoading(true);
      setError("");
      const response = await adminBrandsApi.list();
      setBrands(listAdmin(response));
    } catch (err) {
      setError(err?.message || "Brendlər yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadBrands, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function discardPreview() {
    selectionRef.current += 1;
    revokeImagePreview(previewRef.current);
    previewRef.current = "";
    setImage(null);
    setPreview(editing?.imageUrl || "");
    setPreparing(false);
  }

  function resetForm() {
    selectionRef.current += 1;
    revokeImagePreview(previewRef.current);
    previewRef.current = "";
    setEditing(null);
    setName("");
    setImage(null);
    setPreview("");
    setPreparing(false);
  }

  function startEdit(brand) {
    selectionRef.current += 1;
    revokeImagePreview(previewRef.current);
    previewRef.current = "";
    setEditing(brand);
    setName(brand.name || "");
    setImage(null);
    setPreview(brand.imageUrl || "");
    setPreparing(false);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function selectImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const selectionId = ++selectionRef.current;
    try {
      setPreparing(true);
      setError("");
      const prepared = await prepareImageFile(file, {
        maxInputBytes: MAX_IMAGE_INPUT,
        maxHeicInputBytes: MAX_IMAGE_INPUT,
      });
      if (selectionId !== selectionRef.current) return;
      revokeImagePreview(previewRef.current);
      previewRef.current = URL.createObjectURL(prepared);
      setPreview(previewRef.current);
      setImage(prepared);
    } catch (err) {
      if (selectionId === selectionRef.current) setError(err?.message || "Şəkil hazırlana bilmədi.");
    } finally {
      if (selectionId === selectionRef.current) setPreparing(false);
    }
  }

  async function saveBrand(event) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || busy) { if (!cleanName) setError("Brend adını daxil edin."); return; }
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      if (editing) await adminBrandsApi.update(editing.id, { name: cleanName, image });
      else await adminBrandsApi.create({ name: cleanName, image });
      const message = editing ? "Brend yeniləndi." : "Brend əlavə edildi.";
      resetForm();
      setSuccess(message);
      await loadBrands();
    } catch (err) {
      setError(err?.message || "Brend yadda saxlanmadı.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBrand(brand) {
    if (!window.confirm(`“${brand.name}” brendi silinsin? Bu brendə bağlı məhsulların görünməsinə təsir edə bilər.`)) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await adminBrandsApi.delete(brand.id);
      if (editing?.id === brand.id) resetForm();
      setBrands((current) => current.filter((item) => item.id !== brand.id));
      setSuccess("Brend silindi.");
    } catch (err) {
      setError(err?.message || "Brend silinmədi.");
    } finally {
      setSaving(false);
    }
  }

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("az-AZ");
    return brands.filter((brand) => String(brand.name || "")
      .toLocaleLowerCase("az-AZ").includes(query));
  }, [brands, search]);

  return <div className="nb-catalog">
    <header className="nb-catalog__header">
      <div><p className="nb-catalog__eyebrow">nemesisbaku / kataloq</p><h1>Brendlər</h1>
        <p>Məhsul kartlarında göstərilən brendlər və onların loqoları.</p></div>
      <button type="button" className="nb-catalog__reload" disabled={loading || busy} onClick={loadBrands}>
        <FiRefreshCw aria-hidden="true" /> Yenilə
      </button>
    </header>

    {error && <div className="nb-catalog__alert nb-catalog__alert--error" role="alert">{error}
      <button type="button" onClick={loadBrands}>Yenidən yoxla</button></div>}
    {success && <div className="nb-catalog__alert nb-catalog__alert--success" role="status">{success}</div>}

    <div className="nb-catalog__layout">
      <section className="nb-catalog__panel nb-catalog__editor" aria-labelledby="brand-form-title">
        <div className="nb-catalog__panel-head">
          <div className="nb-catalog__panel-icon"><FiTag aria-hidden="true" /></div>
          <h2 id="brand-form-title">{editing ? "Brendi redaktə et" : "Yeni brend"}</h2>
          <p>{editing ? "Adı və ya şəkli dəyişin." : "Brend əlavə edin; loqo seçimi istəyə bağlıdır."}</p>
        </div>
        <form onSubmit={saveBrand} className="nb-catalog__form">
          <label className="nb-catalog__field">Brend adı <span>*</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120}
              placeholder="Brend adı" disabled={busy} />
          </label>
          <div className="nb-catalog__field">
            <span>Brend şəkli</span>
            <label className="nb-catalog__upload"><FiUploadCloud aria-hidden="true" />
              <span>{preparing ? "Şəkil hazırlanır..." : image?.name || "Şəkil seç"}</span>
              <input type="file" accept={IMAGE_ACCEPT} onChange={selectImage} disabled={busy} />
            </label>
            <small>{editing ? "Yeni şəkil seçilməsə mövcud şəkil saxlanılır." : "JPG, PNG, WEBP və ya HEIC faylı."}</small>
          </div>
          <div className="nb-catalog__brand-preview">
            <AdminCatalogImage key={preview || "empty"} src={preview} alt={name || "Brend şəkli"} />
            {image && <button type="button" className="nb-catalog__discard" disabled={busy}
              onClick={discardPreview}><FiX aria-hidden="true" /> Seçimi ləğv et</button>}
          </div>
          <button type="submit" className="nb-catalog__primary" disabled={busy}>
            {editing ? <FiEdit3 aria-hidden="true" /> : <FiPlus aria-hidden="true" />}
            {saving ? "Saxlanılır..." : editing ? "Dəyişiklikləri saxla" : "Brend əlavə et"}
          </button>
          {editing && <button type="button" className="nb-catalog__cancel" disabled={busy}
            onClick={resetForm}>Redaktədən çıx</button>}
        </form>
      </section>

      <section className="nb-catalog__panel nb-catalog__results" aria-labelledby="brand-list-title" aria-busy={loading}>
        <div className="nb-catalog__results-head">
          <div><p className="nb-catalog__section-label">BRENDLƏR</p>
            <h2 id="brand-list-title">Siyahı <span>{brands.length}</span></h2></div>
          <label className="nb-catalog__search"><FiSearch aria-hidden="true" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Brend axtar" aria-label="Brend axtar" /></label>
        </div>
        {loading ? <div className="nb-catalog__empty" role="status">Brendlər yüklənir...</div>
          : visible.length ? <div className="nb-catalog__grid">
            {visible.map((brand) => <article className="nb-catalog__tile" key={brand.id}>
              <AdminCatalogImage key={brand.imageUrl || "empty"} src={brand.imageUrl}
                alt={brand.name || "Brend"} />
              <h3>{brand.name || "Adsız brend"}</h3>
              <div className="nb-catalog__tile-actions">
                <button type="button" className="nb-catalog__tile-action" disabled={busy}
                  onClick={() => startEdit(brand)}><FiEdit3 aria-hidden="true" /> Redaktə et</button>
                <button type="button" className="nb-catalog__tile-action nb-catalog__tile-action--delete" disabled={busy}
                  onClick={() => deleteBrand(brand)} aria-label={`${brand.name} brendini sil`}><FiTrash2 aria-hidden="true" /> Sil</button>
              </div>
            </article>)}
          </div> : <div className="nb-catalog__empty">Brend tapılmadı.</div>}
      </section>
    </div>
  </div>;
}
