import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiImage,
  FiPlus,
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
  adminSizesApi,
} from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";
import { isSuperAdmin } from "../../api/admin/adminAuth";
import { generateId } from "../../utils/generateId";

const emptyForm = {
  name: "",
  description: "",
  productCode: "",
  model: "",
  price: "",
  discountPrice: "",
  isDiscounted: false,
  isFeatured: false,
  categoryId: "",
  brandId: "",
};

const emptyVariant = {
  sizeId: "",
  colorId: "",
  stockCount: "",
};

function unwrapData(res) {
  return res?.data?.data ?? res?.data ?? res;
}

function listOf(res) {
  const data = unwrapData(res);

  return (
    data?.items ||
    data?.list ||
    data?.result ||
    data?.products ||
    data?.brands ||
    data?.categories ||
    (Array.isArray(data) ? data : [])
  );
}

function getCreatedId(res) {
  const data = unwrapData(res);

  if (typeof data === "string") return data;

  return (
    data?.id ||
    data?.productId ||
    res?.id ||
    res?.productId ||
    res?.data?.id ||
    res?.data?.productId ||
    res?.data?.data?.id ||
    res?.data?.data?.productId ||
    null
  );
}

function uniqueById(list) {
  const map = new Map();

  list.forEach((item) => {
    const id =
      item?.id ||
      item?.sizeId ||
      item?.colorId ||
      item?.brandId ||
      item?.categoryId;

    if (id && !map.has(String(id))) {
      map.set(String(id), item);
    }
  });

  return [...map.values()];
}

function getOptionId(item) {
  return (
    item?.id ||
    item?.sizeId ||
    item?.colorId ||
    item?.brandId ||
    item?.categoryId ||
    ""
  );
}

function getSizeText(item) {
  return item?.value || item?.size || item?.sizeValue || item?.name || "—";
}

function getColorText(item) {
  return item?.name || item?.colorName || "—";
}

export default function AdminAddProduct() {
  const navigate = useNavigate();

  const basePath = isSuperAdmin() ? "/SuperAdmin" : "/Admin";
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

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    try {
      setLoading(true);
      setError("");

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
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...mapped]);
    e.target.value = "";
  }

  function removeImage(id) {
    setImages((prev) => {
      const target = prev.find((x) => x.id === id);

      if (target?.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(target.preview);
      }

      return prev.filter((x) => x.id !== id);
    });
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
    if (!productId) {
      throw new Error("Məhsul yaradıldı, amma şəkil üçün productId gəlmədi.");
    }

    for (let i = 0; i < images.length; i++) {
      await adminProductImagesApi.upload(productId, images[i].file, i === 0);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Məhsul adı yazılmalıdır.");
    if (!form.productCode.trim()) return setError("Məhsul kodu yazılmalıdır.");
    if (!form.model.trim()) return setError("Model yazılmalıdır.");
    if (!form.price || Number(form.price) <= 0) {
      return setError("Qiymət 0-dan böyük olmalıdır.");
    }
    if (!form.categoryId) return setError("Kateqoriya seçilməlidir.");
    if (!form.brandId) return setError("Brend seçilməlidir.");

    const validVariants = variants.filter(
      (v) => v.sizeId && v.colorId && v.stockCount !== ""
    );

    if (validVariants.length === 0) {
      return setError("Ən azı 1 variant əlavə edilməlidir.");
    }

    const preparedVariants = validVariants.map((variant) => ({
      sizeId: variant.sizeId,
      colorId: variant.colorId,
      stockCount: Number(variant.stockCount),
    }));

    const hasInvalidStock = preparedVariants.some(
      (v) => Number.isNaN(v.stockCount) || v.stockCount < 0
    );

    if (hasInvalidStock) {
      return setError("Stok sayı düzgün yazılmalıdır.");
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      productCode: form.productCode.trim(),
      model: form.model.trim(),
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : 0,
      isDiscounted: Boolean(form.isDiscounted),
      isFeatured: Boolean(form.isFeatured),
      categoryId: form.categoryId,
      brandId: form.brandId,
      variants: preparedVariants,
    };

    try {
      setSaving(true);

      console.log("CREATE PRODUCT PAYLOAD:", payload);

      const productRes = await adminProductsApi.create(payload);

      console.log("CREATED PRODUCT RESPONSE:", productRes);

      const productId = getCreatedId(productRes);

      if (!productId) {
        throw new Error("Məhsul yaradıldı, amma productId gəlmədi.");
      }

      if (images.length > 0) {
        await uploadImages(productId);
      }

      navigate(`${basePath}/products`);
    } catch (err) {
      setError(err.message || "Məhsul yaradılmadı.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppLoader text="Form hazırlanır" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Məhsul yaradılır" />}

      <div className="mb-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
          Yeni məhsul
        </p>

        <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
          Məhsul əlavə et
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

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 xl:grid-cols-[1fr_440px]"
      >
        <section className="space-y-5">
          <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <h2 className="mb-5 text-xl font-extrabold tracking-[-0.03em]">
              Əsas məlumatlar
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminInput
                label="Məhsul adı"
                placeholder="Adidas Gazelle Green"
                value={form.name}
                onChange={(v) => updateForm("name", v)}
              />

              <AdminInput
                label="Məhsul kodu"
                placeholder="AD-GZL-GRN"
                value={form.productCode}
                onChange={(v) => updateForm("productCode", v)}
              />

              <AdminInput
                label="Model"
                placeholder="Gazelle"
                value={form.model}
                onChange={(v) => updateForm("model", v)}
              />

              <AdminInput
                label="Qiymət"
                type="number"
                placeholder="100"
                value={form.price}
                onChange={(v) => updateForm("price", v)}
              />

              <AdminInput
                label="Endirim qiyməti"
                type="number"
                placeholder="90"
                value={form.discountPrice}
                onChange={(v) => updateForm("discountPrice", v)}
              />

              <AdminSelect
                label="Kateqoriya"
                value={form.categoryId}
                onChange={(v) => updateForm("categoryId", v)}
              >
                <option value="">Kateqoriya seç</option>
                {categories.map((category) => (
                  <option key={getOptionId(category)} value={getOptionId(category)}>
                    {category.name || "Adsız kateqoriya"}
                  </option>
                ))}
              </AdminSelect>

              <AdminSelect
                label="Brend"
                value={form.brandId}
                onChange={(v) => updateForm("brandId", v)}
              >
                <option value="">Brend seç</option>
                {brands.map((brand) => (
                  <option key={getOptionId(brand)} value={getOptionId(brand)}>
                    {brand.name || "Adsız brend"}
                  </option>
                ))}
              </AdminSelect>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">
                Açıqlama
              </span>

              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Məhsul haqqında məlumat..."
                rows={5}
                className="w-full resize-none rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-zinc-400"
              />
            </label>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <h2 className="mb-5 text-xl font-extrabold tracking-[-0.03em]">
              Görünmə
            </h2>

            <div className="space-y-4">
              <ToggleRow
                title="Endirimli məhsul"
                checked={form.isDiscounted}
                onChange={() => updateForm("isDiscounted", !form.isDiscounted)}
              />

              <ToggleRow
                title="Önə çıxan məhsul"
                checked={form.isFeatured}
                onChange={() => updateForm("isFeatured", !form.isFeatured)}
              />
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                  Variantlar
                </h2>

                <p className="text-sm font-medium text-zinc-500">
                  Ölçü, rəng və stok əlaqələri.
                </p>
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="flex h-11 items-center gap-2 rounded-[15px] bg-[#244989] px-4 text-sm font-extrabold text-white"
              >
                <FiPlus />
                Variant
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="rounded-[22px] border border-zinc-100 bg-zinc-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-extrabold text-zinc-950">
                      Variant #{index + 1}
                    </h3>

                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <AdminSelect
                      label="Ölçü"
                      value={variant.sizeId}
                      onChange={(v) => updateVariant(index, "sizeId", v)}
                    >
                      <option value="">Ölçü seç</option>
                      {sizes.map((size) => (
                        <option key={getOptionId(size)} value={getOptionId(size)}>
                          {getSizeText(size)}
                        </option>
                      ))}
                    </AdminSelect>

                    <AdminSelect
                      label="Rəng"
                      value={variant.colorId}
                      onChange={(v) => updateVariant(index, "colorId", v)}
                    >
                      <option value="">Rəng seç</option>
                      {colors.map((color) => (
                        <option key={getOptionId(color)} value={getOptionId(color)}>
                          {getColorText(color)}
                        </option>
                      ))}
                    </AdminSelect>

                    <AdminInput
                      label="Stok"
                      type="number"
                      placeholder="10"
                      value={variant.stockCount}
                      onChange={(v) => updateVariant(index, "stockCount", v)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <h2 className="mb-5 text-xl font-extrabold tracking-[-0.03em]">
              Şəkillər
            </h2>

            <label className="block cursor-pointer rounded-[22px] border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center transition hover:border-zinc-400">
              <FiUploadCloud className="mx-auto text-[34px] text-zinc-400" />

              <p className="mt-3 text-sm font-extrabold text-zinc-700">
                Məhsul şəkillərini seç
              </p>

              <p className="mt-1 text-xs font-bold text-zinc-400">
                İlk şəkil əsas şəkil olacaq.
              </p>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImages}
                className="hidden"
              />
            </label>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleImageDrop(index)}
                  className="relative overflow-hidden rounded-[20px] bg-zinc-50"
                >
                  <img
                    src={image.preview}
                    alt="Məhsul şəkli"
                    className="h-36 w-full object-cover"
                  />

                  <div className="absolute left-2 top-2 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-zinc-700">
                    {index === 0 ? "Əsas" : index + 1}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-red-600"
                  >
                    <FiX />
                  </button>
                </div>
              ))}

              {images.length === 0 && (
                <div className="col-span-full grid h-36 place-items-center rounded-[20px] bg-zinc-50 text-zinc-300">
                  <FiImage className="text-[34px]" />
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[28px] bg-zinc-950 p-5 text-white">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">
              Məhsul xülasəsi
            </h2>

            <div className="mt-5 space-y-3 text-sm font-bold">
              <SideRow label="Ad" value={form.name || "—"} />
              <SideRow label="Kod" value={form.productCode || "—"} />
              <SideRow label="Model" value={form.model || "—"} />
              <SideRow label="Qiymət" value={form.price ? `${form.price} ₼` : "—"} />
              <SideRow
                label="Endirim"
                value={form.discountPrice ? `${form.discountPrice} ₼` : "Yoxdur"}
              />
              <SideRow label="Variant sayı" value={variants.length} />
              <SideRow label="Şəkil sayı" value={images.length} />
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-[#244989] text-sm font-extrabold text-white disabled:opacity-60"
          >
            <FiPlus />
            Məhsulu yarat
          </button>
        </aside>
      </form>
    </div>
  );
}

function AdminInput({ label, placeholder, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-800">
        {label}
      </span>

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

function AdminSelect({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-800">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-13 w-full rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold outline-none transition focus:border-zinc-400"
      >
        {children}
      </select>
    </label>
  );
}

function ToggleRow({ title, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex w-full items-center justify-between rounded-[18px] border p-4 text-left transition ${
        checked
          ? "border-[#244989] bg-[#244989]/8"
          : "border-zinc-100 bg-zinc-50"
      }`}
    >
      <span className="text-sm font-extrabold text-zinc-900">{title}</span>

      <span
        className={`h-6 w-11 rounded-full p-1 transition ${
          checked ? "bg-[#244989]" : "bg-zinc-300"
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white transition ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
    </button>
  );
}

function SideRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/60">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}