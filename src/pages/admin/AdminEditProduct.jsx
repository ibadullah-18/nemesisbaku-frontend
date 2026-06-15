import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiImage,
  FiPlus,
  FiSave,
  FiTrash2,
  FiUploadCloud,
  FiX,
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

function unwrapData(res) {
  return res?.data?.data || res?.data || res;
}

function listOf(res) {
  const data = unwrapData(res);
  return data?.items || data?.list || data?.result || (Array.isArray(data) ? data : []);
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
    id: v.id || null,
    sizeId: v.sizeId || v.size?.id || "",
    colorId: v.colorId || v.color?.id || "",
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

  const [optionsModal, setOptionsModal] = useState(null);
  const [newSize, setNewSize] = useState("");
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");

  useEffect(() => {
    loadPage();
  }, [id]);

  async function loadPage() {
    try {
      setLoading(true);
      setError("");

      const [productRes, catRes, brandRes, sizeRes, colorRes] =
        await Promise.all([
          adminProductsApi.detail(id),
          adminCategoriesApi.list(),
          adminBrandsApi.list(),
          adminSizesApi.list(),
          adminColorsApi.list(),
        ]);

      const product = unwrapData(productRes);

      const cleanCategories = uniqueById(listOf(catRes));
      const cleanBrands = uniqueById(listOf(brandRes));
      const cleanSizes = uniqueById(listOf(sizeRes));
      const cleanColors = uniqueById(listOf(colorRes));

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
    } catch (err) {
      setError(err.message || "Məhsul açılmadı.");
    } finally {
      setLoading(false);
    }
  }

  async function reloadOptionsOnly() {
    const [sizeRes, colorRes] = await Promise.all([
      adminSizesApi.list(),
      adminColorsApi.list(),
    ]);

    setSizes(uniqueById(listOf(sizeRes)));
    setColors(uniqueById(listOf(colorRes)));
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateVariant(index, key, value) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [key]: value } : v))
    );
  }

  function addVariantRow() {
    setVariants((prev) => [
      ...prev,
      {
        id: null,
        sizeId: "",
        colorId: "",
        stockCount: 1,
        isActive: true,
      },
    ]);
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
        if (!variant.sizeId || !variant.colorId) continue;

        const body = {
          sizeId: variant.sizeId,
          colorId: variant.colorId,
          stockCount: Number(variant.stockCount || 0),
          isActive: variant.isActive,
        };

        if (variant.id) {
          await adminProductVariantsApi.update(variant.id, body);
        } else {
          await adminProductVariantsApi.create(id, {
            sizeId: body.sizeId,
            colorId: body.colorId,
            stockCount: body.stockCount,
          });
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
      setError("");

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
    } catch (err) {
      setError(err.message || "Şəkil silinmədi.");
    } finally {
      setSaving(false);
    }
  }

  async function setMainImage(imageId) {
    try {
      setSaving(true);
      await adminProductImagesApi.setMain(imageId);
      await loadPage();
    } catch (err) {
      setError(err.message || "Main şəkil dəyişmədi.");
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
    } catch (err) {
      setError(err.message || "Variant silinmədi.");
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
          Məhsul məlumatı, şəkillər və hazır variantlar.
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

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <Toggle label="Endirimli" checked={form.isDiscounted} onClick={() => updateForm("isDiscounted", !form.isDiscounted)} />
              <Toggle label="Önə çıxan" checked={form.isFeatured} onClick={() => updateForm("isFeatured", !form.isFeatured)} />
              <Toggle label="Yeni məhsul" checked={form.isNew} onClick={() => updateForm("isNew", !form.isNew)} />
              <Toggle label="Aktivdir" checked={form.isActive} onClick={() => updateForm("isActive", !form.isActive)} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {form.isDiscounted && <AdminInput label="Endirim bölmə yazısı" placeholder="Qurban endirimi məhsulları" value={form.discountBadgeText} onChange={(v) => updateForm("discountBadgeText", v)} />}
              {form.isFeatured && <AdminInput label="Önə çıxan bölmə yazısı" placeholder="Premium seçimlər" value={form.featuredBadgeText} onChange={(v) => updateForm("featuredBadgeText", v)} />}
              {form.isNew && <AdminInput label="Yeni məhsul bölmə yazısı" placeholder="Yeni kolleksiya" value={form.newBadgeText} onChange={(v) => updateForm("newBadgeText", v)} />}
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">Şəkillər</h2>
                <p className="text-sm font-medium text-zinc-500">Ən soldakı şəkil main olacaq.</p>
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
                  <p className="text-sm font-extrabold text-zinc-500">Şəkil yoxdur</p>
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
              onClick={addVariantRow}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#244989] text-white"
            >
              <FiPlus />
            </button>
          </div>

          <div className="space-y-3">
            {variants.map((variant, index) => (
              <div key={variant.id || index} className="rounded-[22px] border border-zinc-100 bg-zinc-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-extrabold text-zinc-900">Variant #{index + 1}</p>

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
          onReload={reloadOptionsOnly}
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