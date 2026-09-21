import { useEffect, useRef, useState } from "react";
import {
  FiCheck, FiClock, FiExternalLink, FiImage, FiMapPin, FiRefreshCw, FiSave,
  FiUploadCloud,
} from "react-icons/fi";
import { adminStoreInfoApi, unwrapAdmin } from "../../api/admin/adminApi";
import AdminFloatingActions from "../../components/admin/AdminFloatingActions";
import { useAdminToastState } from "../../utils/adminToast";
import "./adminStoreInfo.css";

const SECTIONS = [
  {
    id: "identity", label: "Mağaza və loqo", description: "Saytda görünən mağaza adı və qısa təqdimat.",
    fields: [
      { name: "storeName", label: "Mağaza adı", required: true, hint: "Həmişə kiçik hərflə, bitişik: nemesisbaku" },
      { name: "slogan", label: "Sloqan" },
    ],
  },
  {
    id: "contact", label: "Əlaqə və sosial şəbəkələr", description: "Müştərilərin əlaqə saxlamaq üçün istifadə etdiyi məlumatlar.",
    fields: [
      { name: "phoneNumber", label: "Telefon nömrəsi", type: "tel" },
      { name: "whatsAppNumber", label: "WhatsApp nömrəsi", type: "tel" },
      { name: "email", label: "E-poçt", type: "email" },
      { name: "workingHours", label: "İş saatları" },
      { name: "instagramUrl", label: "Instagram ünvanı", type: "url" },
      { name: "tikTokUrl", label: "TikTok ünvanı", type: "url" },
      { name: "facebookUrl", label: "Facebook ünvanı", type: "url" },
    ],
  },
  {
    id: "address", label: "Ünvan və xəritə", description: "Mağazanın fiziki ünvanı və xəritə koordinatları.",
    fields: [
      { name: "address", label: "Mağazanın ünvanı", wide: true },
      { name: "latitude", label: "Enlik (latitude)", type: "number", min: -90, max: 90 },
      { name: "longitude", label: "Uzunluq (longitude)", type: "number", min: -180, max: 180 },
    ],
  },
  {
    id: "about", label: "Haqqımızda", description: "Mağazanı tanıdan mətnlər.",
    fields: [
      { name: "aboutTitle", label: "Başlıq" },
      { name: "aboutContent", label: "Haqqımızda mətni", multiline: true },
      { name: "missionContent", label: "Missiyamız", multiline: true },
      { name: "visionContent", label: "Vizyonumuz", multiline: true },
      { name: "whyChooseUsContent", label: "Niyə bizi seçməlisiniz", multiline: true },
    ],
  },
  {
    id: "delivery", label: "Çatdırılma", description: "Çatdırılma səhifəsində göstərilən mətnlər.",
    fields: [
      { name: "deliveryTitle", label: "Başlıq" },
      { name: "deliveryContent", label: "Ümumi məlumat", multiline: true },
      { name: "deliveryBakuText", label: "Bakı üzrə çatdırılma", multiline: true },
      { name: "deliveryAbsheronSumgaitText", label: "Abşeron və Sumqayıt üzrə çatdırılma", multiline: true },
      { name: "deliveryRegionsText", label: "Bölgələr üzrə çatdırılma", multiline: true },
      { name: "paymentAndCheckText", label: "Ödəniş və yoxlama", multiline: true },
    ],
  },
  {
    id: "returns", label: "Qaytarma və dəyişdirmə", description: "Qaytarma siyasətinin saytda göstərilən bölmələri.",
    fields: [
      { name: "returnPolicyTitle", label: "Başlıq" },
      { name: "returnPolicyContent", label: "Qaytarma qaydaları", multiline: true },
      { name: "exchangePolicyContent", label: "Dəyişdirmə qaydaları", multiline: true },
      { name: "returnExceptionsContent", label: "İstisnalar", multiline: true },
      { name: "returnProcessContent", label: "Qaytarma prosesi", multiline: true },
    ],
  },
];

const ALL_FIELDS = SECTIONS.flatMap((section) => section.fields.map((field) => field.name));
const EMPTY_FIELDS = Object.fromEntries(ALL_FIELDS.map((name) => [name, ""]));

function fromStore(store) {
  return Object.fromEntries(ALL_FIELDS.map((name) => [name, store?.[name] == null ? "" : String(store[name])]));
}

function LogoPreview({ url, label }) {
  const [failed, setFailed] = useState(false);
  return <div className="nb-store__logo-frame">
    {url && !failed ? <img src={url} alt={label} onError={() => setFailed(true)} />
      : <div className="nb-store__logo-empty"><FiImage aria-hidden="true" /><span>{url ? "Loqo açılmır" : "Loqo əlavə edilməyib"}</span></div>}
  </div>;
}

export default function AdminStoreInfo() {
  const [form, setForm] = useState(EMPTY_FIELDS);
  const [saved, setSaved] = useState(EMPTY_FIELDS);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const logoPreviewRef = useRef("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useAdminToastState("error");
  const [success, setSuccess] = useAdminToastState("success");
  const dirty = Boolean(logoFile) || ALL_FIELDS.some((name) => form[name] !== saved[name]);

  function clearLogoSelection() {
    if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current);
    logoPreviewRef.current = "";
    setLogoPreview("");
    setLogoFile(null);
  }

  async function loadInfo() {
    try {
      setLoading(true);
      setError("");
      const response = await adminStoreInfoApi.get();
      const info = unwrapAdmin(response);
      const values = fromStore(info);
      setForm(values);
      setSaved(values);
      setLogoUrl(info?.logoUrl || "");
      clearLogoSelection();
      setReady(true);
    } catch (err) {
      if (String(err?.message || "").includes("Store məlumatı tapılmadı")) {
        setForm(EMPTY_FIELDS);
        setSaved(EMPTY_FIELDS);
        setLogoUrl("");
        setReady(true);
        setError("");
      } else {
        setError(err?.message || "Mağaza məlumatları yüklənmədi.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { loadInfo(); }, 0);
    return () => {
      window.clearTimeout(timer);
      if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(name, value) {
    const next = name === "storeName" ? value.toLowerCase().replace(/\s+/g, "") : value;
    setForm((previous) => ({ ...previous, [name]: next }));
    setSuccess("");
  }

  function selectLogo(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    const maxSize = ["heic", "heif"].includes(extension) ? 50 : 25;
    if (!["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(extension) || file.size > maxSize * 1024 * 1024) {
      setError(`JPG, PNG, WEBP (25 MB-a qədər) və ya HEIC/HEIF (50 MB-a qədər) şəkil seçin.`);
      return;
    }
    if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current);
    const preview = URL.createObjectURL(file);
    logoPreviewRef.current = preview;
    setLogoPreview(preview);
    setLogoFile(file);
    setError("");
    setSuccess("");
  }

  async function saveInfo(event) {
    event.preventDefault();
    if (!ready || saving || !dirty) return;
    if (form.storeName.trim() !== "nemesisbaku") {
      setError("Mağaza adı yalnız nemesisbaku olmalıdır.");
      return;
    }
    if (Boolean(form.latitude) !== Boolean(form.longitude)) {
      setError("Xəritə üçün enlik və uzunluğu birlikdə daxil edin.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const response = await adminStoreInfoApi.update(form, logoFile);
      const info = unwrapAdmin(response);
      const values = fromStore(info);
      setForm(values);
      setSaved(values);
      setLogoUrl(info?.logoUrl || "");
      clearLogoSelection();
      setSuccess("Mağaza məlumatları yadda saxlanıldı.");
    } catch (err) {
      setError(err?.message || "Mağaza məlumatları saxlanılmadı.");
    } finally {
      setSaving(false);
    }
  }

  const coordinates = form.latitude !== "" && form.longitude !== "";
  const mapUrl = coordinates
    ? `https://www.google.com/maps?q=${encodeURIComponent(form.latitude)},${encodeURIComponent(form.longitude)}`
    : "";

  return <div className="nb-store pb-32">
    <div className="nb-store__header">
      <div>
        <p className="nb-store__eyebrow">nemesisbaku / mağaza</p>
        <h1>Mağaza məlumatları</h1>
        <p>Saytda göstərilən məlumatları buradan redaktə edin.</p>
      </div>
    </div>
    {loading && !ready ? <div className="nb-store__loading" role="status">Mağaza məlumatları yüklənir...</div> : <>
      {error && <div className="nb-store__alert nb-store__alert--error" role="alert">{error}
        {!ready && <button type="button" onClick={loadInfo}>Yenidən yoxla</button>}
      </div>}
      {success && <div className="nb-store__alert nb-store__alert--success" role="status"><FiCheck aria-hidden="true" /> {success}</div>}
      <div className="nb-store__layout">
        <nav className="nb-store__navigation" aria-label="Məlumat bölmələri">
          <strong>Bölmələr</strong>
          {SECTIONS.map((section, index) => <a key={section.id} href={`#${section.id}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>{section.label}
          </a>)}
        </nav>
        <form id="store-info-form" className="nb-store__form" onSubmit={saveInfo}>
          {SECTIONS.map((section) => <section className="nb-store__section" id={section.id} key={section.id}>
            <div className="nb-store__section-heading"><h2>{section.label}</h2><p>{section.description}</p></div>
            {section.id === "identity" && <div className="nb-store__logo-editor">
              <LogoPreview key={logoPreview || logoUrl} url={logoPreview || logoUrl} label="Mağaza loqosu" />
              <div><strong>Mağaza loqosu</strong>
                <p>{logoFile ? logoFile.name : "Yeni şəkil seçilməsə mövcud loqo saxlanılır."}</p>
                <label className="nb-store__upload"><FiUploadCloud aria-hidden="true" /> Loqo seç
                  <input type="file" accept=".jpg,.jpeg,.png,.webp,.heic,.heif" onChange={selectLogo} disabled={!ready || loading || saving} />
                </label>
                {logoFile && <button className="nb-store__discard-logo" type="button" onClick={clearLogoSelection}>Seçimi ləğv et</button>}
              </div>
            </div>}
            <div className="nb-store__fields">
              {section.fields.map((field) => <label key={field.name}
                className={`nb-store__field ${field.wide || field.multiline ? "is-wide" : ""}`}>
                <span>{field.label}{field.required && <em> *</em>}</span>
                {field.multiline
                  ? <textarea name={field.name} rows={4} value={form[field.name]} disabled={!ready || loading || saving}
                    onChange={(event) => updateField(field.name, event.target.value)} />
                  : <input name={field.name} type={field.type || "text"} value={form[field.name]}
                    required={field.required} min={field.min} max={field.max} step={field.type === "number" ? "any" : undefined}
                    disabled={!ready || loading || saving} onChange={(event) => updateField(field.name, event.target.value)} />}
                {field.hint && <small>{field.hint}</small>}
              </label>)}
            </div>
            {section.id === "address" && <div className="nb-store__map">
              <FiMapPin aria-hidden="true" />
              {mapUrl ? <a href={mapUrl} target="_blank" rel="noreferrer">Koordinatları xəritədə yoxla <FiExternalLink aria-hidden="true" /></a>
                : <span>Xəritə üçün enlik və uzunluğu daxil edin.</span>}
            </div>}
          </section>)}
          <AdminFloatingActions status={saving ? "Mağaza məlumatları yadda saxlanılır…" : dirty ? "Yadda saxlanmamış dəyişikliklər var" : "Məlumatlar yadda saxlanılıb"}>
            <button type="button" disabled={loading || saving} onClick={() => { if (!dirty || window.confirm("Yadda saxlanmamış dəyişikliklər silinsin?")) loadInfo(); }}><FiRefreshCw aria-hidden="true" /> {loading ? "Yenilənir…" : "Yenilə"}</button>
            <button className="is-primary" type="submit" disabled={!ready || loading || saving || !dirty}><FiSave aria-hidden="true" /> {saving ? "Saxlanılır…" : "Yadda saxla"}</button>
          </AdminFloatingActions>
        </form>
        <aside className="nb-store__summary">
          <p className="nb-store__summary-label">MAĞAZA GÖRÜNÜŞÜ</p>
          <LogoPreview key={`summary-${logoPreview || logoUrl}`} url={logoPreview || logoUrl} label="Mağaza loqosu" />
          <h2>{form.storeName || "nemesisbaku"}</h2>
          {form.slogan && <p>{form.slogan}</p>}
          <div className="nb-store__summary-line"><FiClock aria-hidden="true" /><span>{form.workingHours || "İş saatı daxil edilməyib"}</span></div>
          <div className="nb-store__summary-line"><FiMapPin aria-hidden="true" /><span>{form.address || "Ünvan daxil edilməyib"}</span></div>
        </aside>
      </div>
    </>}
  </div>;
}
