import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiImage, FiPlus, FiTrash2, FiUploadCloud, FiX } from "react-icons/fi";
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
  sizeId: "",
  colorId: "",
  stockCount: "",
};

function unwrapData(res) {
  return res?.data?.data || res?.data || res;
}

function listOf(res) {
  const data = unwrapData(res);
  return data?.items || data?.list || data?.result || (Array.isArray(data) ? data : []);
}

function getCreatedId(res) {
  return res?.data?.id || res?.data?.data?.id || res?.id || res?.result?.id || res?.result;
}

function uniqueById(list) {
  const map = new Map();

  list.forEach((item) => {
    if (item?.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  });

  return [...map.values()];
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

  const [optionsModal, setOptionsModal] = useState(null);
  const [newSize, setNewSize] = useState("");
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");

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

      setCategories(uniqueById(listOf(catRes)));
      setBrands(uniqueById(listOf(brandRes)));
      setSizes(uniqueById(listOf(sizeRes)));
      setColors(uniqueById(listOf(colorRes)));
    } catch (err) {
      setError(err.message || "Məlumatlar yüklənmədi.");
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
      (v) => v.sizeId && v.colorId && v.stockCount !== ""
    );

    if (validVariants.length === 0) {
      return setError("Ən azı 1 variant əlavə edin.");
    }

    try {
      setSaving(true);

      const preparedVariants = validVariants.map((variant) => ({
        sizeId: variant.sizeId,
        colorId: variant.colorId,
        stockCount: Number(variant.stockCount),
      }));

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
          Məhsul məlumatı, şəkillər və hazır razmer/rəng variantları.
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
              <AdminInput label="Məhsul adı" placeholder="Adidas Gazelle Green" value={form.name} onChange={(v) => updateForm("name", v)} />
              <AdminInput label="Məhsul kodu" placeholder="AD-GZL-GRN" value={form.productCode} onChange={(v) => updateForm("productCode", v)} />
              <AdminInput label="Model" placeholder="Gazelle" value={form.model} onChange={(v) => updateForm("model", v)} />
              <AdminInput label="Qiymət" placeholder="100" type="number" value={form.price} onChange={(v) => updateForm("price", v)} />
              <AdminInput label="Endirim qiyməti" placeholder="90" type="number" value={form.discountPrice} onChange={(v) => updateForm("discountPrice", v)} />

              <NativeSelect
                label="Kateqoriya"
                value={form.categoryId}
                onChange={(v) => updateForm("categoryId", v)}
                items={categories.map((x) => ({ id: x.id, name: x.name }))}
                placeholder="Kateqoriya seç"
              />

              <NativeSelect
                label="Brend"
                value={form.brandId}
                onChange={(v) => updateForm("brandId", v)}
                items={brands.map((x) => ({ id: x.id, name: x.name }))}
                placeholder="Brend seç"
              />
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">Açıqlama</span>
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Məhsul haqqında qısa məlumat yazın."
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
                <p className="text-sm font-medium text-zinc-500">
                  Ən soldakı şəkil əsas şəkil olacaq.
                </p>
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
                  <p className="mt-1 text-xs font-medium text-zinc-400">
                    PNG, JPG, WEBP — bir neçə şəkil seçə bilərsiniz.
                  </p>
                </div>
                <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
              </label>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {images.map((img, index) => (
                  <div
                    key={img.id}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleImageDrop(index)}
                    className="group relative aspect-square cursor-grab overflow-hidden rounded-[22px] border border-zinc-100 bg-zinc-50 active:cursor-grabbing"
                  >
                    <img src={img.preview} alt="" className="h-full w-full object-cover" />
                    <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-zinc-900 shadow-sm">
                      {index === 0 ? "MAIN" : `${index + 1}`}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
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
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">Variantlar</h2>
              <p className="text-sm font-medium text-zinc-500">
                Hazır razmer və rəng seçilir. Yoxdursa əlavə edə və ya silə bilərsiniz.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setOptionsModal("sizes")}
                  className="rounded-full bg-green-50 px-3 py-2 text-xs font-extrabold text-green-700"
                >
                  Yeni razmer +
                </button>

                <button
                  type="button"
                  onClick={() => setOptionsModal("colors")}
                  className="rounded-full bg-green-50 px-3 py-2 text-xs font-extrabold text-green-700"
                >
                  Yeni rəng +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={addVariant}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#244989] text-white"
            >
              <FiPlus />
            </button>
          </div>

          <div className="space-y-3">
            {variants.map((variant, index) => (
              <div key={index} className="rounded-[22px] border border-zinc-100 bg-zinc-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-extrabold text-zinc-900">Variant #{index + 1}</p>

                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-600"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>

                <div className="grid gap-3">
                  <NativeSelect
                    label="Razmer"
                    value={variant.sizeId}
                    onChange={(v) => updateVariant(index, "sizeId", v)}
                    items={sizes.map((size) => ({
                      id: size.id,
                      name: size.value || size.size || size.name,
                    }))}
                    placeholder="Razmer seç"
                  />

                  <NativeSelect
                    label="Rəng"
                    value={variant.colorId}
                    onChange={(v) => updateVariant(index, "colorId", v)}
                    items={colors.map((color) => ({
                      id: color.id,
                      name: color.name,
                      hexCode: color.hexCode,
                    }))}
                    placeholder="Rəng seç"
                  />

                  <AdminInput
                    label="Stok sayı"
                    placeholder="5"
                    type="number"
                    value={variant.stockCount}
                    onChange={(v) => updateVariant(index, "stockCount", v)}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            disabled={saving}
            className="mt-5 h-14 w-full rounded-[18px] bg-[#244989] text-sm font-extrabold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "Yaradılır..." : "Məhsulu yarat"}
          </button>
        </section>
      </form>

      {optionsModal && (
        <OptionsModal
          type={optionsModal}
          sizes={sizes}
          colors={colors}
          newSize={newSize}
          setNewSize={setNewSize}
          newColorName={newColorName}
          setNewColorName={setNewColorName}
          newColorHex={newColorHex}
          setNewColorHex={setNewColorHex}
          onClose={() => setOptionsModal(null)}
          onReload={loadOptions}
        />
      )}
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

function OptionsModal({
  type,
  sizes,
  colors,
  newSize,
  setNewSize,
  newColorName,
  setNewColorName,
  newColorHex,
  setNewColorHex,
  onClose,
  onReload,
}) {
  const [busy, setBusy] = useState(false);
  const isSizes = type === "sizes";
  const list = isSizes ? sizes : colors;

  async function createItem() {
    try {
      setBusy(true);

      if (isSizes) {
        if (!newSize.trim()) return alert("Razmer yazın");
        await adminSizesApi.create(newSize.trim());
        setNewSize("");
      } else {
        if (!newColorName.trim()) return alert("Rəng adı yazın");

        await adminColorsApi.create({
          name: newColorName.trim(),
          hexCode: newColorHex || "#000000",
        });

        setNewColorName("");
        setNewColorHex("#000000");
      }

      await onReload();
    } catch (err) {
      alert(err.message || "Yaratmaq mümkün olmadı.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(id) {
    const ok = confirm("Silinsin?");
    if (!ok) return;

    try {
      setBusy(true);

      if (isSizes) {
        await adminSizesApi.delete(id);
      } else {
        await adminColorsApi.delete(id);
      }

      await onReload();
    } catch (err) {
      alert(err.message || "Silmək mümkün olmadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] grid place-items-center bg-black/35 px-4">
      <div className="w-full max-w-[520px] rounded-[28px] bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-extrabold">
            {isSizes ? "Razmerlər" : "Rənglər"}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-700"
          >
            <FiX />
          </button>
        </div>

        <div className="mb-5 grid gap-3">
          {isSizes ? (
            <AdminInput
              label="Yeni razmer"
              placeholder="Məsələn: 43"
              value={newSize}
              onChange={setNewSize}
            />
          ) : (
            <>
              <AdminInput
                label="Rəng adı"
                placeholder="Məsələn: Bej"
                value={newColorName}
                onChange={setNewColorName}
              />

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-zinc-800">
                  Rəng kodu
                </span>
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="h-13 w-full rounded-[16px] border border-zinc-100 bg-zinc-50 px-2"
                />
              </label>
            </>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={createItem}
            className="h-12 rounded-[16px] bg-green-600 text-sm font-extrabold text-white disabled:opacity-60"
          >
            {busy ? "Gözlə..." : "Yarat +"}
          </button>
        </div>

        <div className="max-h-[320px] space-y-2 overflow-auto">
          {list.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-[16px] bg-zinc-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {!isSizes && (
                  <span
                    className="h-6 w-6 rounded-full border border-zinc-200"
                    style={{ backgroundColor: item.hexCode || "#000000" }}
                  />
                )}

                <span className="text-sm font-extrabold">
                  {isSizes ? item.value || item.size || item.name : item.name}
                </span>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => deleteItem(item.id)}
                className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-600 disabled:opacity-60"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}