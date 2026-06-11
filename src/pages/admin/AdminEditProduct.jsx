import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiImage,
  FiPlus,
  FiSave,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";
import {
  adminBrandsApi,
  adminCategoriesApi,
  adminColorsApi,
  adminProductImagesApi,
  adminProductsApi,
  adminProductVariantsApi,
  adminSizesApi,
} from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

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

function unwrapData(res) {
  return res?.data?.data || res?.data || res;
}

function listOf(res) {
  const data = unwrapData(res);
  return data?.items || data?.list || data?.result || (Array.isArray(data) ? data : []);
}

function uniqueByNameOrId(list) {
  const map = new Map();

  list.forEach((item) => {
    const key = String(item.id || item.name || item.value || "").toLowerCase();
    if (key && !map.has(key)) map.set(key, item);
  });

  return [...map.values()];
}

function findIdByName(list, name) {
  if (!name) return "";

  const found = list.find(
    (x) => x.name?.toLowerCase() === name?.toLowerCase()
  );

  return found?.id || "";
}

function getImageUrl(image) {
  if (!image) return null;
  if (typeof image === "string") return image;

  return (
    image.imageUrl ||
    image.mainImageUrl ||
    image.url ||
    image.fileUrl ||
    image.path ||
    image.secureUrl ||
    image.src ||
    image.image ||
    image.imagePath ||
    null
  );
}

function getCreatedId(res) {
  return res?.data?.id || res?.data || res?.id || res?.result?.id || res?.result;
}

function normalizeImages(product) {
  const raw =
    product?.images ||
    product?.productImages ||
    product?.imageDtos ||
    product?.productImageDtos ||
    [];

  return (Array.isArray(raw) ? raw : [])
    .map((img, index) => ({
      ...img,
      id: img.id,
      src: getImageUrl(img),
      isMain: Boolean(img.isMain || img.isMainImage),
      displayOrder: img.displayOrder ?? img.order ?? index,
    }))
    .filter((x) => x.src)
    .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));
}

function normalizeVariants(product) {
  const raw =
    product?.variants ||
    product?.productVariants ||
    product?.variantDtos ||
    product?.productVariantDtos ||
    [];

  return (Array.isArray(raw) ? raw : []).map((v) => ({
    id: v.id,
    sizeId: v.sizeId || v.size?.id || "",
    colorId: v.colorId || v.color?.id || "",
    sizeValue: v.sizeValue || v.size?.value || v.sizeName || v.size || "",
    colorName: v.colorName || v.color?.name || v.colorValue || v.color || "",
    colorHex: v.hexCode || v.color?.hexCode || "#000000",
    stockCount: v.stockCount ?? v.stock ?? 0,
    isActive: v.isActive ?? true,
  }));
}

export default function AdminEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);

  const [dragIndex, setDragIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    loadPage();
  }, [id]);

  async function loadPage() {
    try {
      setLoading(true);

      const [productRes, catRes, brandRes, sizeRes, colorRes] =
        await Promise.all([
          adminProductsApi.detail(id),
          adminCategoriesApi.list(),
          adminBrandsApi.list(),
          adminSizesApi.list(),
          adminColorsApi.list(),
        ]);

      const product = unwrapData(productRes);

      const cleanCategories = uniqueByNameOrId(listOf(catRes));
      const cleanBrands = uniqueByNameOrId(listOf(brandRes));
      const cleanSizes = uniqueByNameOrId(listOf(sizeRes));
      const cleanColors = uniqueByNameOrId(listOf(colorRes));

      const categoryId =
        product.categoryId ||
        product.category?.id ||
        findIdByName(cleanCategories, product.categoryName || product.category?.name);

      const brandId =
        product.brandId ||
        product.brand?.id ||
        findIdByName(cleanBrands, product.brandName || product.brand?.name);

      setCategories(cleanCategories);
      setBrands(cleanBrands);
      setSizes(cleanSizes);
      setColors(cleanColors);

      setForm({
        name: product.name || "",
        description: product.description || "",
        productCode: product.productCode || "",
        model: product.model || "",
        price: product.price ?? "",
        discountPrice: product.discountPrice ?? "",
        isDiscounted: Boolean(product.isDiscounted),
        discountBadgeText:
          product.discountBadgeText || product.discountText || "Endirimli məhsullar",
        isFeatured: Boolean(product.isFeatured),
        featuredBadgeText:
          product.featuredBadgeText || product.featuredText || "Önə çıxan məhsullar",
        isNew: Boolean(product.isNew),
        newBadgeText: product.newBadgeText || product.newText || "Yeni məhsullar",
        isActive: product.isActive ?? true,
        categoryId,
        brandId,
      });

      setImages(normalizeImages(product));
      setVariants(normalizeVariants(product));
    } finally {
      setLoading(false);
    }
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveMainInfo() {
    if (!form.name.trim()) throw new Error("Məhsul adı boş ola bilməz.");
    if (!form.price) throw new Error("Qiymət yazılmalıdır.");
    if (!form.categoryId) throw new Error("Kateqoriya seçilməlidir.");
    if (!form.brandId) throw new Error("Brend seçilməlidir.");

    await adminProductsApi.update(id, {
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
      isActive: form.isActive,
      categoryId: form.categoryId,
      brandId: form.brandId,
    });
  }

  async function saveEverything() {
    setError("");
    setSuccess("");

    try {
      setSaving(true);

      await saveMainInfo();

      for (const variant of variants) {
        if (!variant.sizeValue || !variant.colorName) continue;

        const sizeId = await ensureSizeId(variant.sizeValue);
        const colorId = await ensureColorId(variant.colorName, variant.colorHex);

        const body = {
          sizeId,
          colorId,
          stockCount: Number(variant.stockCount || 0),
          isActive: variant.isActive,
        };

        if (variant.id) {
          await adminProductVariantsApi.update(variant.id, body);
        } else {
          await adminProductVariantsApi.create(id, body);
        }
      }

      for (let i = 0; i < images.length; i++) {
        if (images[i].id) {
          await adminProductImagesApi.updateOrder(images[i].id, i + 1);
        }
      }

      if (images[0]?.id) {
        await adminProductImagesApi.setMain(images[0].id);
      }

      await loadPage();
      setSuccess("Bütün dəyişikliklər yadda saxlanıldı.");
    } catch (err) {
      setError(err.message || "Yadda saxlama zamanı xəta baş verdi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadImages(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setSaving(true);

      const hasMain = images.some((x) => x.isMain);

      for (let i = 0; i < files.length; i++) {
        await adminProductImagesApi.upload(id, files[i], !hasMain && i === 0);
      }

      await loadPage();
    } catch (err) {
      setError(err.message || "Şəkil yüklənmədi.");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  }

  async function deleteImage(imageId) {
    const ok = confirm("Bu şəkil silinsin?");
    if (!ok) return;

    try {
      setSaving(true);
      await adminProductImagesApi.delete(imageId);
      await loadPage();
    } finally {
      setSaving(false);
    }
  }

  async function setMainImage(imageId) {
    try {
      setSaving(true);
      await adminProductImagesApi.setMain(imageId);
      await loadPage();
    } finally {
      setSaving(false);
    }
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

  async function ensureSizeId(sizeValue) {
    const found = sizes.find(
      (s) => String(s.value || s.size || s.name) === String(sizeValue)
    );

    if (found) return found.id;

    const res = await adminSizesApi.create(sizeValue);
    const newId = getCreatedId(res);

    setSizes((prev) => [...prev, { id: newId, value: sizeValue }]);

    return newId;
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

    const newId = getCreatedId(res);

    setColors((prev) => [
      ...prev,
      { id: newId, name: colorName, hexCode: colorHex || "#000000" },
    ]);

    return newId;
  }

  function updateVariant(index, key, value) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [key]: value } : v))
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

  function addVariantRow() {
    setVariants((prev) => [
      ...prev,
      {
        id: null,
        sizeValue: "42",
        colorName: "Qara",
        colorHex: "#000000",
        stockCount: 1,
        isActive: true,
      },
    ]);
  }

  async function deleteVariant(variantId, index) {
    if (!variantId) {
      setVariants((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    const ok = confirm("Bu variant silinsin?");
    if (!ok) return;

    try {
      setSaving(true);
      await adminProductVariantsApi.delete(variantId);
      await loadPage();
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) return <AppLoader text="Məhsul açılır" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Yadda saxlanılır" />}

      <button
        type="button"
        onClick={() => navigate("/SuperAdmin/products")}
        className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-zinc-700 shadow-sm"
      >
        <FiArrowLeft />
        Məhsullara qayıt
      </button>

      <div className="mb-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
          Product edit
        </p>
        <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
          {form.name || "Məhsul"}
        </h1>
        <p className="mt-1 text-sm font-medium text-zinc-500">
          Məhsul məlumatı, şəkillər və variantlar.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-[18px] border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          {success}
        </div>
      )}

      <button
        type="button"
        onClick={saveEverything}
        disabled={saving}
        className="mb-6 inline-flex h-13 items-center justify-center gap-2 rounded-[16px] bg-[#244989] px-6 text-sm font-extrabold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
      >
        <FiSave />
        Hamısını yadda saxla
      </button>

      <div className="grid gap-5 xl:grid-cols-[1fr_440px]">
        <section className="space-y-5">
          <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <h2 className="mb-5 text-xl font-extrabold tracking-[-0.03em]">
              Əsas məlumatlar
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminInput label="Məhsul adı" placeholder="Nike Air Max 270" value={form.name} onChange={(v) => updateForm("name", v)} />
              <AdminInput label="Məhsul kodu" placeholder="NK-AM270-001" value={form.productCode} onChange={(v) => updateForm("productCode", v)} />
              <AdminInput label="Model" placeholder="Air Max 270" value={form.model} onChange={(v) => updateForm("model", v)} />
              <AdminInput label="Qiymət" type="number" placeholder="289" value={form.price} onChange={(v) => updateForm("price", v)} />
              <AdminInput label="Endirim qiyməti" type="number" placeholder="249" value={form.discountPrice} onChange={(v) => updateForm("discountPrice", v)} />
              <AdminSelect label="Kateqoriya" value={form.categoryId} onChange={(v) => updateForm("categoryId", v)} items={categories} placeholder="Sneakers" />
              <AdminSelect label="Brend" value={form.brandId} onChange={(v) => updateForm("brandId", v)} items={brands} placeholder="Nike" />
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">
                Açıqlama
              </span>
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Məhsul haqqında qısa məlumat yazın."
                rows={5}
                className="w-full resize-none rounded-[18px] border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-zinc-400"
              />
            </label>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <Toggle label="Endirimli" checked={form.isDiscounted} onClick={() => updateForm("isDiscounted", !form.isDiscounted)} />
              <Toggle label="Önə çıxan" checked={form.isFeatured} onClick={() => updateForm("isFeatured", !form.isFeatured)} />
              <Toggle label="Yeni məhsul" checked={form.isNew} onClick={() => updateForm("isNew", !form.isNew)} />
              <Toggle label="Aktivdir" checked={form.isActive} onClick={() => updateForm("isActive", !form.isActive)} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {form.isDiscounted && (
                <AdminInput
                  label="Endirim bölmə yazısı"
                  placeholder="Qurban endirimi məhsulları"
                  value={form.discountBadgeText}
                  onChange={(v) => updateForm("discountBadgeText", v)}
                />
              )}

              {form.isFeatured && (
                <AdminInput
                  label="Önə çıxan bölmə yazısı"
                  placeholder="Premium seçimlər"
                  value={form.featuredBadgeText}
                  onChange={(v) => updateForm("featuredBadgeText", v)}
                />
              )}

              {form.isNew && (
                <AdminInput
                  label="Yeni məhsul bölmə yazısı"
                  placeholder="Yeni kolleksiya"
                  value={form.newBadgeText}
                  onChange={(v) => updateForm("newBadgeText", v)}
                />
              )}
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                  Şəkillər
                </h2>
                <p className="text-sm font-medium text-zinc-500">
                  Ən soldakı şəkil main olacaq.
                </p>
              </div>

              <label className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-[#244989] text-white">
                <FiUploadCloud />
                <input type="file" accept="image/*" multiple onChange={handleUploadImages} className="hidden" />
              </label>
            </div>

            {images.length === 0 ? (
              <div className="grid min-h-[180px] place-items-center rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50 text-center">
                <div>
                  <FiImage className="mx-auto mb-3 text-[36px] text-zinc-300" />
                  <p className="text-sm font-extrabold text-zinc-500">
                    Şəkil yoxdur
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {images.map((img, index) => (
                  <div
                    key={img.id || index}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      moveImage(dragIndex, index);
                      setDragIndex(null);
                    }}
                    className="group relative aspect-square cursor-grab overflow-hidden rounded-[22px] border border-zinc-100 bg-zinc-50 active:cursor-grabbing"
                  >
                    <img src={img.src} alt="" className="h-full w-full object-cover" />

                    <button
                      type="button"
                      onClick={() => setMainImage(img.id)}
                      className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-sm ${
                        index === 0 || img.isMain
                          ? "bg-[#244989] text-white"
                          : "bg-white/90 text-zinc-900"
                      }`}
                    >
                      {index === 0 || img.isMain ? "MAIN" : "Main et"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteImage(img.id)}
                      className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-red-600 shadow-sm"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                Variantlar
              </h2>
              <p className="text-sm font-medium text-zinc-500">
                Razmer, rəng, stok və aktivlik.
              </p>
            </div>

            <button
              type="button"
              onClick={addVariantRow}
              className="grid h-11 w-11 place-items-center rounded-full bg-[#244989] text-white"
            >
              <FiPlus />
            </button>
          </div>

          <div className="space-y-3">
            {variants.map((variant, index) => (
              <div key={variant.id || index} className="rounded-[22px] border border-zinc-100 bg-zinc-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-extrabold text-zinc-900">
                    Variant #{index + 1}
                  </p>

                  <button
                    type="button"
                    onClick={() => deleteVariant(variant.id, index)}
                    className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-600"
                  >
                    <FiTrash2 />
                  </button>
                </div>

                <div className="grid gap-3">
                  <NativeSelect
                    label="Razmer"
                    value={variant.sizeValue}
                    onChange={(v) => updateVariant(index, "sizeValue", v)}
                    items={sizeOptions.map((size) => ({ id: size, name: size }))}
                    placeholder="Razmer seç"
                  />

                  <NativeSelect
                    label="Rəng"
                    value={variant.colorName}
                    onChange={(v) => updateVariantColor(index, v)}
                    items={colorOptions.map((color) => ({ id: color.name, name: color.name }))}
                    placeholder="Rəng seç"
                  />

                  <AdminInput
                    label="Stok"
                    type="number"
                    placeholder="5"
                    value={variant.stockCount}
                    onChange={(v) => updateVariant(index, "stockCount", v)}
                  />

                  <Toggle
                    label="Aktivdir"
                    checked={variant.isActive}
                    onClick={() => updateVariant(index, "isActive", !variant.isActive)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}

function AdminInput({ label, placeholder, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-800">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-13 w-full rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold outline-none transition focus:border-zinc-400"
      />
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-13 w-full rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold outline-none transition focus:border-zinc-400"
      >
        <option value="">{placeholder}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name || item.value}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-13 items-center justify-between rounded-[16px] border px-4 text-sm font-extrabold transition ${
        checked
          ? "border-[#244989] bg-[#244989]/8 text-[#244989]"
          : "border-zinc-100 bg-zinc-50 text-zinc-700"
      }`}
    >
      {label}
      <span
        className={`h-5 w-5 rounded-full border transition ${
          checked ? "border-[#244989] bg-[#244989]" : "border-zinc-300 bg-white"
        }`}
      />
    </button>
  );
}