import SiteSelect from "../../components/common/SiteSelect";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowDown, FiArrowUp, FiPlus, FiSave, FiTrash2 } from "react-icons/fi";
import { adminProductsApi, adminShowcaseApi, listAdmin, unwrapAdmin } from "../../api/admin/adminApi";
import { getPanelBasePath } from "../../api/admin/adminAuth";
import { IMAGE_ACCEPT, prepareImageFile } from "../../utils/imageFile";
import { SHOWCASE_SHAPES, toShowcaseFormData } from "../../utils/showcase";
import { generateId } from "../../utils/generateId";
import ShowcaseGroup from "../../components/home/ShowcaseGroup";
import "./adminMerchandising.css";
import "./adminShowcase.css";

const newBlock = () => ({ key: generateId(), shape: "square", targetType: "none", slug: "", externalUrl: "", imageUrl: "", mobileImageUrl: "", imageAlt: "", title: "", subtitle: "", description: "", afterProductsDescription: "", productIds: [] });
const newForm = () => ({ name: "", displayOrder: 1, isActive: true, blocks: [newBlock()] });
const move = (items, from, to) => {
  const copy = [...items];
  if (to < 0 || to >= copy.length) return copy;
  const [item] = copy.splice(from, 1); copy.splice(to, 0, item); return copy;
};

export default function AdminShowcase({ mode = "list" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const base = `${getPanelBasePath()}/showcase`;
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState(newForm);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [productError, setProductError] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [search, setSearch] = useState("");
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const previews = useRef(new Set());
  const generation = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    let active = true;
    const generationRef = generation;
    generationRef.current++;
    const load = async () => {
      setLoading(true); setReady(false); setError(""); setDirty(false); setProductError(false);
      try {
        if (mode === "list") {
          const res = await adminShowcaseApi.list();
          if (active) setGroups(listAdmin(res));
        } else {
          const [details, catalog] = await Promise.allSettled([
            mode === "edit" ? adminShowcaseApi.detail(id) : adminShowcaseApi.list(),
            adminProductsApi.list(),
          ]);
          if (!active) return;
          if (details.status === "rejected") throw details.reason;
          if (mode === "edit") {
            const data = unwrapAdmin(details.value);
            setForm({ ...data, blocks: data.blocks.map(b => ({ ...newBlock(), ...b })) });
          } else {
            const items = listAdmin(details.value);
            setForm({ ...newForm(), displayOrder: Math.max(0, ...items.map(g => g.displayOrder)) + 1 });
          }
          setProducts(catalog.status === "fulfilled" ? listAdmin(catalog.value) : []);
          setProductError(catalog.status === "rejected");
        }
        if (active) setReady(true);
      } catch (err) { if (active) setError(err.message || "Məlumatlar yüklənmədi."); }
      finally { if (active) setLoading(false); }
    };
    load();
    const urls = previews.current;
    return () => {
      active = false;
      generationRef.current++;
      urls.forEach(url => URL.revokeObjectURL(url)); urls.clear();
    };
  }, [mode, id, revision]);

  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(key, value) { setDirty(true); setForm(prev => ({ ...prev, [key]: value })); }
  function updateBlock(key, field, value) {
    setDirty(true);
    setForm(prev => ({ ...prev, blocks: prev.blocks.map(b => b.key === key ? { ...b, [field]: value } : b) }));
  }
  async function selectImage(event, block, mobile) {
    const selected = event.target.files?.[0]; event.target.value = "";
    if (!selected || busyRef.current) return;
    const currentGeneration = generation.current;
    busyRef.current = true; setProcessing(true); setError("");
    try {
      const file = await prepareImageFile(selected);
      if (generation.current !== currentGeneration) return;
      const url = URL.createObjectURL(file); previews.current.add(url);
      const imageKey = mobile ? "mobileImageUrl" : "imageUrl";
      const fileKey = mobile ? "mobileFile" : "file";
      const oldUrl = block[imageKey];
      if (previews.current.delete(oldUrl)) URL.revokeObjectURL(oldUrl);
      setDirty(true);
      setForm(prev => ({ ...prev, blocks: prev.blocks.map(b => b.key === block.key ? { ...b, [imageKey]: url, [fileKey]: file } : b) }));
    } catch (err) { if (generation.current === currentGeneration) setError(err.message); }
    finally { busyRef.current = false; setProcessing(false); }
  }

  async function save(event) {
    event.preventDefault();
    if (busyRef.current) return;
    if (form.blocks.some(b => !b.imageUrl || !b.mobileImageUrl)) { setError("Hər blok üçün kompüter və telefon şəklini seçin."); return; }
    busyRef.current = true; setBusy(true); setError("");
    try {
      await adminShowcaseApi.save(mode === "edit" ? id : null, toShowcaseFormData(form));
      setDirty(false); navigate(base);
    } catch (err) { setError(err.message); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function remove(group) {
    if (busyRef.current || !window.confirm(`“${group.name}” qrupu və ona bağlı səhifələr silinsin?`)) return;
    busyRef.current = true; setBusy(true); setError("");
    try { await adminShowcaseApi.delete(group.id, group.version); setGroups(prev => prev.filter(g => g.id !== group.id)); }
    catch (err) { setError(err.message); }
    finally { busyRef.current = false; setBusy(false); }
  }

  async function reorder(from, to) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try { setGroups(listAdmin(await adminShowcaseApi.reorder(move(groups, from, to)))); }
    catch (err) { setError(err.message); }
    finally { busyRef.current = false; setBusy(false); }
  }

  const leave = event => { if (dirty && !window.confirm("Saxlanılmamış dəyişikliklər itəcək. Çıxmaq istəyirsiniz?")) event.preventDefault(); };
  const candidates = products.filter(p => `${p.name} ${p.productCode || ""}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())).slice(0, 60);

  return <div className="nb-merch nb-showcase-admin">
    <header className="nb-showcase-admin__header">
      <div><h1>{mode === "list" ? "Tanıtım blokları" : mode === "edit" ? "Tanıtım qrupunu düzəlt" : "Yeni tanıtım qrupu"}</h1><p>Bir qrupda 1–3 şəkil. Kompüterdə yan-yana, telefonda alt-alta.</p></div>
      {mode === "list" ? <Link className="nb-merch__button nb-merch__button--primary" to={`${base}/create`}><FiPlus /> Yeni qrup</Link> : <Link className="nb-merch__button" to={base} onClick={leave}>Siyahıya qayıt</Link>}
    </header>
    {error && <div className="nb-showcase-admin__error" role="alert">{error}</div>}
    {loading ? <p role="status">Yüklənir…</p> : !ready ? <button type="button" className="nb-merch__button" onClick={() => setRevision(v => v + 1)}>Yenidən yoxla</button> : mode === "list" ? <>
      <p className="nb-showcase-admin__hint">Aktiv qruplar sıralamaya görə 15-ci, 30-cu, 45-ci… məhsuldan sonra görünür. İlk açılışda 40 məhsul göstərilir. Qrupun adı yalnız admin panelində görünür.</p>
      <button className="nb-merch__button" type="button" disabled={busy} onClick={() => setRevision(v => v + 1)}>Yenilə</button>
      <div className="nb-showcase-admin__groups">{groups.map((group, index) => <article className="nb-showcase-admin__card" key={group.id}>
        <div className="nb-showcase-admin__header"><h2>{group.displayOrder}. {group.name}</h2><span className="nb-merch__badge">{group.isActive ? "Aktiv" : "Gizli"} · {group.blocks.length} şəkil</span></div>
        <ShowcaseGroup group={group} preview />
        <div className="nb-showcase-admin__actions"><Link className="nb-merch__button" to={`${base}/${group.id}`}>Düzəliş et</Link><button type="button" className="nb-merch__button" disabled={busy || index === 0} onClick={() => reorder(index, index - 1)}><FiArrowUp /> Əvvələ</button><button type="button" className="nb-merch__button" disabled={busy || index === groups.length - 1} onClick={() => reorder(index, index + 1)}><FiArrowDown /> Sonraya</button><button type="button" className="nb-merch__button nb-merch__button--danger" disabled={busy} onClick={() => remove(group)}><FiTrash2 /> Sil</button></div>
      </article>)}</div>
      {!groups.length && !error && <div className="nb-showcase-admin__empty">Hələ tanıtım qrupu yoxdur. “Yeni qrup” ilə ilk şəkilləri əlavə edin.</div>}
    </> : <form onSubmit={save}>
      <fieldset disabled={busy || processing}>
        <section className="nb-showcase-admin__card">
          <div className="nb-showcase-admin__fields">
            <label>Qrupun daxili adı<input required maxLength={120} value={form.name} onChange={e => update("name", e.target.value)} placeholder="Məsələn: Ödəniş imkanları" /></label>
            <label>Sıralama<input required type="number" min="1" max="10000" value={form.displayOrder} onChange={e => update("displayOrder", e.target.value)} /><small>Kiçik rəqəm əvvəl görünür. Qrup bütöv yerləşdirilir.</small></label>
          </div>
          <label className="nb-showcase-admin__check"><input type="checkbox" checked={form.isActive} onChange={e => update("isActive", e.target.checked)} /> Ana səhifədə və daxili səhifə ünvanında aktiv olsun</label>
        </section>
        {form.blocks.map((block, index) => <section className="nb-showcase-admin__card" key={block.key}>
          <div className="nb-showcase-admin__header"><h2>{index + 1}. Tanıtım bloku</h2><div className="nb-showcase-admin__actions">
            <button type="button" className="nb-merch__button" disabled={index === 0} aria-label="Bloku əvvələ keçir" onClick={() => update("blocks", move(form.blocks, index, index - 1))}><FiArrowUp /></button>
            <button type="button" className="nb-merch__button" disabled={index === form.blocks.length - 1} aria-label="Bloku sonraya keçir" onClick={() => update("blocks", move(form.blocks, index, index + 1))}><FiArrowDown /></button>
            <button type="button" className="nb-merch__button" disabled={form.blocks.length === 1} onClick={() => { if (window.confirm("Bu blok qrupdan çıxarılsın? Saxladıqdan sonra onun səhifəsi də silinəcək.")) update("blocks", form.blocks.filter(b => b.key !== block.key)); }}><FiTrash2 /> Çıxar</button>
          </div></div>
          <div className="nb-showcase-admin__fields">
            <label>Şəklin forması<SiteSelect value={block.shape} onChange={e => updateBlock(block.key, "shape", e.target.value)}>{Object.entries(SHOWCASE_SHAPES).map(([value, option]) => <option value={value} key={value}>{option.label}</option>)}</SiteSelect></label>
            <label>Şəklin təsviri (istəyə bağlı)<input maxLength={200} value={block.imageAlt || ""} onChange={e => updateBlock(block.key, "imageAlt", e.target.value)} /><small>Ekran oxuyucusu üçün. Şəkil üzərində mətn kimi göstərilmir.</small></label>
          </div>
          <div className="nb-showcase-admin__uploads">{[false, true].map(mobile => <label key={String(mobile)} className="nb-showcase-admin__upload">
            <strong>{mobile ? "Telefon şəkli" : "Kompüter şəkli"}</strong><small>Tövsiyə: {SHOWCASE_SHAPES[block.shape][mobile ? "mobile" : "desktop"]} px · {SHOWCASE_SHAPES[block.shape].ratio.replace(" / ", ":")}</small>
            {block[mobile ? "mobileImageUrl" : "imageUrl"] && <img src={block[mobile ? "mobileImageUrl" : "imageUrl"]} alt={mobile ? "Telefon önizləməsi" : "Kompüter önizləməsi"} />}
            <input type="file" accept={IMAGE_ACCEPT} onChange={e => selectImage(e, block, mobile)} />
            <small>JPG, PNG, WebP, HEIC/HEIF. Fərqli piksel ölçüləri qəbul edilir; seçilən formaya sığdırmaq üçün kənarlar kəsilə bilər. Yükləmə üçün 9 MB-a qədər optimallaşdırılır.</small>
          </label>)}</div>
          <label>Klik zamanı<SiteSelect value={block.targetType} onChange={e => updateBlock(block.key, "targetType", e.target.value)}><option value="none">Heç nə — yalnız şəkil</option><option value="internal">Daxili məzmun səhifəsi</option><option value="external">Xarici keçid</option></SiteSelect></label>
          {block.targetType === "external" && <label>Keçid ünvanı<input required type="url" maxLength={2048} value={block.externalUrl || ""} placeholder="https://…" onChange={e => updateBlock(block.key, "externalUrl", e.target.value)} /></label>}
          {block.targetType === "internal" && <div className="nb-showcase-admin__content">
            <h3>Daxili səhifənin məzmunu</h3>
            <label>Səhifə ünvanı<input required maxLength={101} pattern="/?[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*" value={block.slug || ""} placeholder="/birbankodeniskecidi" onChange={e => updateBlock(block.key, "slug", e.target.value)} /><small>nemesisbaku.az/{(block.slug || "").replace(/^\//, "").toLowerCase()} · Latın hərfləri, rəqəm və tire. Ünvanı dəyişdikdə köhnə keçid işləməyəcək.</small></label>
            <p className="nb-showcase-admin__hint">Yuxarıdakı şəkillər səhifədə də göstərilir. Aşağıdakı hissələr bu ardıcıllıqla görünür; boş saxlanılan hissələr göstərilmir.</p>
            <label>1. Başlıq<input maxLength={200} value={block.title || ""} onChange={e => updateBlock(block.key, "title", e.target.value)} /></label>
            <label>2. Alt mətn<textarea rows={2} maxLength={500} value={block.subtitle || ""} onChange={e => updateBlock(block.key, "subtitle", e.target.value)} /></label>
            <label>3. Açıqlama<textarea rows={5} maxLength={20000} value={block.description || ""} onChange={e => updateBlock(block.key, "description", e.target.value)} /></label>
            <div><h3>4. Məhsullar (istəyə bağlı)</h3>
              {productError && <p role="alert">Məhsullar yüklənmədi. Mövcud seçimlər saxlanılır.</p>}
              <ol className="nb-showcase-admin__selected">{block.productIds.map((pid, p) => <li key={pid}><span>{products.find(item => item.id === pid)?.name || pid}</span><button type="button" disabled={p === 0} aria-label="Məhsulu əvvələ keçir" onClick={() => updateBlock(block.key, "productIds", move(block.productIds, p, p - 1))}>↑</button><button type="button" disabled={p === block.productIds.length - 1} aria-label="Məhsulu sonraya keçir" onClick={() => updateBlock(block.key, "productIds", move(block.productIds, p, p + 1))}>↓</button><button type="button" aria-label="Məhsulu çıxar" onClick={() => updateBlock(block.key, "productIds", block.productIds.filter(x => x !== pid))}>×</button></li>)}</ol>
              <label>Məhsul axtar<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ad və ya məhsul kodu" /></label>
              <div className="nb-showcase-admin__products">{candidates.map(product => <label className="nb-showcase-admin__check" key={product.id}><input type="checkbox" checked={block.productIds.includes(product.id)} disabled={!block.productIds.includes(product.id) && block.productIds.length >= 200} onChange={e => updateBlock(block.key, "productIds", e.target.checked ? [...block.productIds, product.id] : block.productIds.filter(x => x !== product.id))} />{product.mainImageUrl && <img src={product.mainImageUrl} alt="" loading="lazy" />}<span>{product.name}<small>{product.productCode}</small></span></label>)}</div>
              <small>{block.productIds.length}/200 seçilib. Axtarışda ilk 60 uyğun məhsul göstərilir.</small>
            </div>
            <label>5. Məhsullardan sonrakı açıqlama<textarea rows={5} maxLength={20000} value={block.afterProductsDescription || ""} onChange={e => updateBlock(block.key, "afterProductsDescription", e.target.value)} /></label>
          </div>}
        </section>)}
        {form.blocks.length < 3 && <button type="button" className="nb-merch__button" onClick={() => update("blocks", [...form.blocks, newBlock()])}><FiPlus /> Qrupa şəkil əlavə et</button>}
        <section className="nb-showcase-admin__card">
          <div className="nb-showcase-admin__header"><h2>Ana səhifə önizləməsi</h2><div className="nb-showcase-admin__actions"><button type="button" className="nb-merch__button" aria-pressed={!mobilePreview} onClick={() => setMobilePreview(false)}>Kompüter</button><button type="button" className="nb-merch__button" aria-pressed={mobilePreview} onClick={() => setMobilePreview(true)}>Telefon</button></div></div>
          <div className={mobilePreview ? "nb-showcase-admin__preview nb-showcase-admin__preview--mobile" : "nb-showcase-admin__preview"}><ShowcaseGroup group={{ ...form, blocks: form.blocks.map(b => mobilePreview ? { ...b, imageUrl: b.mobileImageUrl || b.imageUrl } : b) }} preview /></div>
        </section>
      </fieldset>
      <div className="nb-showcase-admin__save"><span role="status">{processing ? "Şəkil hazırlanır…" : busy ? "Saxlanılır…" : dirty ? "Saxlanılmamış dəyişikliklər var" : ""}</span><button type="submit" className="nb-merch__button nb-merch__button--primary" disabled={busy || processing}><FiSave /> Saxla</button></div>
    </form>}
  </div>;
}
