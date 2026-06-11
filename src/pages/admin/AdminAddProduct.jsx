import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiImage, FiPlus, FiTrash2, FiUploadCloud } from "react-icons/fi";
import {
  adminBrandsApi,
  adminCategoriesApi,
  adminColorsApi,
  adminProductImagesApi,
  adminProductsApi,
  adminSizesApi,
} from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

const emptyForm = {
  name: "",
  description: "",
  productCode: "",
  model: "",
  price: "",
  discountPrice: "",
  isDiscounted: false,
  discountBadgeText: "Endirimli məhsullar",
  isFeatured: false,
  featuredBadgeText: "Önə çıxan məhsullar",
  isNew: false,
  newBadgeText: "Yeni məhsullar",
  categoryId: "",
  brandId: "",
};

const emptyVariant = {
  sizeValue: "42",
  colorName: "Qara",
  colorHex: "#000000",
  stockCount: "",
};

const defaultSizeValues = Array.from({ length: 9 }, (_, i) => String(i + 34));

const defaultColors = [
  { name: "Qara", hexCode: "#000000" },
  { name: "Ağ", hexCode: "#FFFFFF" },
  { name: "Boz", hexCode: "#808080" },
  { name: "Qırmızı", hexCode: "#DC2626" },
  { name: "Mavi", hexCode: "#2563EB" },
  { name: "Yaşıl", hexCode: "#16A34A" },
  { name: "Sarı", hexCode: "#FACC15" },
  { name: "Narıncı", hexCode: "#F97316" },
  { name: "Bənövşəyi", hexCode: "#7C3AED" },
  { name: "Çəhrayı", hexCode: "#EC4899" },
  { name: "Qəhvəyi", hexCode: "#92400E" },
  { name: "Bej", hexCode: "#D6C3A5" },
  { name: "Krem", hexCode: "#F5EBDD" },
];

function listOf(res) {
  const data = res?.data || res;
  return data?.items || data?.list || data?.result || (Array.isArray(data) ? data : []);
}

function getCreatedId(res) {
  return res?.data?.id || res?.data || res?.id || res?.result?.id || res?.result;
}

export default function AdminAddProduct() {
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [variants, setVariants] = useState([{ ...emptyVariant }]);
  const [images, setImages] = useState([]);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);

  const [dragIndex, setDragIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sizeOptions = useMemo(() => {
    const apiSizes = sizes
      .map((x) => String(x.value || x.size || x.name || ""))
      .filter(Boolean);

    return [...new Set([...defaultSizeValues, ...apiSizes])].sort(
      (a, b) => Number(a) - Number(b)
    );
  }, [sizes]);

  const colorOptions = useMemo(() => {
    const apiColors = colors.map((x) => ({
      name: x.name,
      hexCode: x.hexCode || "#000000",
    }));

    const map = new Map();

    [...defaultColors, ...apiColors].forEach((c) => {
      if (c.name) map.set(c.name.toLowerCase(), c);
    });

    return [...map.values()];
  }, [colors]);

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    try {
      setLoading(true);

      const [catRes, brandRes, sizeRes, colorRes] = await Promise.all([
        adminCategoriesApi.list(),
        adminBrandsApi.list(),
        adminSizesApi.list(),
        adminColorsApi.list(),
      ]);

      setCategories(listOf(catRes));
      setBrands(listOf(brandRes));
      setSizes(listOf(sizeRes));
      setColors(listOf(colorRes));
    } finally {
      setLoading(false);
    }
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateVariant(index, key, value) {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [key]: value } : variant
      )
    );
  }

  function updateVariantColor(index, colorName) {
    const selected = colorOptions.find((c) => c.name === colorName);

    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index
          ? {
              ...variant,
              colorName,
              colorHex: selected?.hexCode || variant.colorHex || "#000000",
            }
          : variant
      )
    );
  }

  function addVariant() {
    setVariants((prev) => [...prev, { ...emptyVariant }]);
  }

  function removeVariant(index) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function handleImages(e) {
    const files = Array.from(e.target.files || []);

    const mapped = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...mapped]);
    e.target.value = "";
  }

  function removeImage(id) {
    setImages((prev) => prev.filter((x) => x.id !== id));
  }

  function moveImage(from, to) {
    if (from === to || from === null || to === null) return;

    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function handleImageDrop(index) {
    moveImage(dragIndex, index);
    setDragIndex(null);
  }

  async function ensureSizeId(sizeValue) {
    const found = sizes.find(
      (s) => String(s.value || s.size || s.name) === String(sizeValue)
    );

    if (found) return found.id;

    const res = await adminSizesApi.create(sizeValue);
    const id = getCreatedId(res);

    setSizes((prev) => [...prev, { id, value: sizeValue }]);

    return id;
  }

  async function ensureColorId(colorName, colorHex) {
    const found = colors.find(
      (c) => c.name?.toLowerCase() === colorName?.toLowerCase()
    );

    if (found) return found.id;

    const res = await adminColorsApi.create({
      name: colorName,
      hexCode: colorHex || "#000000",
    });

    const id = getCreatedId(res);

    setColors((prev) => [
      ...prev,
      { id, name: colorName, hexCode: colorHex || "#000000" },
    ]);

    return id;
  }

  async function uploadImages(productId) {
    for (let i = 0; i < images.length; i++) {
      await adminProductImagesApi.upload(productId, images[i].file, i === 0);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Məhsul adı yazılmalıdır.");
    if (!form.price) return setError("Qiymət yazılmalıdır.");
    if (!form.categoryId) return setError("Kateqoriya seçilməlidir.");
    if (!form.brandId) return setError("Brend seçilməlidir.");

    const validVariants = variants.filter(
      (v) => v.sizeValue && v.colorName && v.stockCount !== ""
    );

    if (validVariants.length === 0) {
      return setError("Ən azı 1 variant əlavə edin.");
    }

    try {
      setSaving(true);

      const preparedVariants = [];

      for (const variant of validVariants) {
        const sizeId = await ensureSizeId(variant.sizeValue);
        const colorId = await ensureColorId(variant.colorName, variant.colorHex);

        preparedVariants.push({
          sizeId,
          colorId,
          stockCount: Number(variant.stockCount),
        });
      }

      const productRes = await adminProductsApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
        productCode: form.productCode.trim(),
        model: form.model.trim(),
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        isDiscounted: form.isDiscounted,
        discountBadgeText: form.isDiscounted ? form.discountBadgeText.trim() : "",
        isFeatured: form.isFeatured,
        featuredBadgeText: form.isFeatured ? form.featuredBadgeText.trim() : "",
        isNew: form.isNew,
        newBadgeText: form.isNew ? form.newBadgeText.trim() : "",
        categoryId: form.categoryId,
        brandId: form.brandId,
        variants: preparedVariants,
      });

      const productId = getCreatedId(productRes);

      if (productId && images.length > 0) {
        await uploadImages(productId);
      }

      navigate("/SuperAdmin/products");
    } catch (err) {
      setError(err.message || "Məhsul yaradılmadı.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppLoader text="Form hazırlanır" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      <div className="mb-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
          Yeni məhsul
        </p>
        <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
          Məhsul əlavə et
        </h1>
        <p className="mt-1 text-sm font-medium text-zinc-500">
          Məhsul məlumatı, şəkillər, razmer/rəng/stok variantları bir yerdə.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[1fr_440px]">
        <section className="space-y-5">
          <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <h2 className="mb-5 text-xl font-extrabold tracking-[-0.03em]">
              Əsas məlumatlar
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminInput label="Məhsul adı" placeholder="Məsələn: Nike Air Max 270" value={form.name} onChange={(v) => updateForm("name", v)} />
              <AdminInput label="Məhsul kodu" placeholder="Məsələn: NK-AM270-001" value={form.productCode} onChange={(v) => updateForm("productCode", v)} />
              <AdminInput label="Model" placeholder="Məsələn: Air Max 270" value={form.model} onChange={(v) => updateForm("model", v)} />
              <AdminInput label="Qiymət" placeholder="Məsələn: 289" type="number" value={form.price} onChange={(v) => updateForm("price", v)} />
              <AdminInput label="Endirim qiyməti" placeholder="Məsələn: 249" type="number" value={form.discountPrice} onChange={(v) => updateForm("discountPrice", v)} />
              <AdminSelect label="Kateqoriya" value={form.categoryId} onChange={(v) => updateForm("categoryId", v)} items={categories} placeholder="Kateqoriya seç" />
              <AdminSelect label="Brend" value={form.brandId} onChange={(v) => updateForm("brandId", v)} items={brands} placeholder="Brend seç" />
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">Açıqlama</span>
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Məsələn: Premium sneaker, gündəlik istifadə üçün rahat model."
                rows={5}
                className="w-full resize-none rounded-[18px] border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-zinc-400"
              />
            </label>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Toggle label="Endirimli məhsuldur" checked={form.isDiscounted} onClick={() => updateForm("isDiscounted", !form.isDiscounted)} />
              <Toggle label="Önə çıxan məhsuldur" checked={form.isFeatured} onClick={() => updateForm("isFeatured", !form.isFeatured)} />
              <Toggle label="Yeni məhsuldur" checked={form.isNew} onClick={() => updateForm("isNew", !form.isNew)} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {form.isDiscounted && <AdminInput label="Endirim bölmə yazısı" placeholder="Qurban endirimi məhsulları" value={form.discountBadgeText} onChange={(v) => updateForm("discountBadgeText", v)} />}
              {form.isFeatured && <AdminInput label="Önə çıxan bölmə yazısı" placeholder="Premium seçimlər" value={form.featuredBadgeText} onChange={(v) => updateForm("featuredBadgeText", v)} />}
              {form.isNew && <AdminInput label="Yeni məhsul bölmə yazısı" placeholder="Yeni kolleksiya" value={form.newBadgeText} onChange={(v) => updateForm("newBadgeText", v)} />}
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">Şəkillər</h2>
                <p className="text-sm font-medium text-zinc-500">Ən soldakı şəkil avtomatik əsas şəkil olacaq. Sürüşdürərək sıralaya bilərsiniz.</p>
              </div>

              <label className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-[#244989] text-white">
                <FiUploadCloud />
                <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
              </label>
            </div>

            {images.length === 0 ? (
              <label className="grid min-h-[220px] cursor-pointer place-items-center rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
                <div>
                  <FiImage className="mx-auto mb-3 text-[38px] text-zinc-300" />
                  <p className="text-sm font-extrabold text-zinc-700">Şəkil seç</p>
                  <p className="mt-1 text-xs font-medium text-zinc-400">PNG, JPG, WEBP — bir neçə şəkil seçə bilərsiniz.</p>
                </div>
                <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
              </label>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {images.map((img, index) => (
                  <div key={img.id} draggable onDragStart={() => setDragIndex(index)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleImageDrop(index)} className="group relative aspect-square cursor-grab overflow-hidden rounded-[22px] border border-zinc-100 bg-zinc-50 active:cursor-grabbing">
                    <img src={img.preview} alt="" className="h-full w-full object-cover" />
                    <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-zinc-900 shadow-sm">{index === 0 ? "MAIN" : `${index + 1}`}</div>
                    <button type="button" onClick={() => removeImage(img.id)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-red-600 opacity-100 shadow-sm md:opacity-0 md:transition md:group-hover:opacity-100"><FiTrash2 /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">Variantlar</h2>
              <p className="text-sm font-medium text-zinc-500">Razmer 34–42 select olacaq. Rəng də hazır siyahıdan seçilir.</p>
            </div>

            <button type="button" onClick={addVariant} className="grid h-11 w-11 place-items-center rounded-full bg-[#244989] text-white"><FiPlus /></button>
          </div>

          <div className="space-y-3">
            {variants.map((variant, index) => (
              <div key={index} className="rounded-[22px] border border-zinc-100 bg-zinc-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-extrabold text-zinc-900">Variant #{index + 1}</p>
                  {variants.length > 1 && <button type="button" onClick={() => removeVariant(index)} className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-600"><FiTrash2 /></button>}
                </div>

                <div className="grid gap-3">
                  <NativeSelect label="Razmer" value={variant.sizeValue} onChange={(v) => updateVariant(index, "sizeValue", v)} items={sizeOptions.map((size) => ({ id: size, name: size }))} placeholder="Razmer seç" />
                  <NativeSelect label="Rəng" value={variant.colorName} onChange={(v) => updateVariantColor(index, v)} items={colorOptions.map((color) => ({ id: color.name, name: color.name }))} placeholder="Rəng seç" />
                  <AdminInput label="Stok sayı" placeholder="Məsələn: 5" type="number" value={variant.stockCount} onChange={(v) => updateVariant(index, "stockCount", v)} />
                </div>
              </div>
            ))}
          </div>

          <button disabled={saving} className="mt-5 h-14 w-full rounded-[18px] bg-[#244989] text-sm font-extrabold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60">
            {saving ? "Yaradılır..." : "Məhsulu yarat"}
          </button>
        </section>
      </form>
    </div>
  );
}

function AdminInput({ label, placeholder, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-800">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-13 w-full rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold outline-none transition focus:border-zinc-400" />
    </label>
  );
}

function AdminSelect({ label, placeholder, value, onChange, items }) {
  return <NativeSelect label={label} placeholder={placeholder} value={value} onChange={onChange} items={items} />;
}

function NativeSelect({ label, placeholder, value, onChange, items }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-800">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-13 w-full rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold outline-none transition focus:border-zinc-400">
        <option value="">{placeholder}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>{item.name || item.value}</option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`flex h-13 items-center justify-between rounded-[16px] border px-4 text-sm font-extrabold transition ${checked ? "border-[#244989] bg-[#244989]/8 text-[#244989]" : "border-zinc-100 bg-zinc-50 text-zinc-700"}`}>
      {label}
      <span className={`h-5 w-5 rounded-full border transition ${checked ? "border-[#244989] bg-[#244989]" : "border-zinc-300 bg-white"}`} />
    </button>
  );
}
