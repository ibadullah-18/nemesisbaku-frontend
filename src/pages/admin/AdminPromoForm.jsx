import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiCheckCircle,
  FiImage,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import {
  adminProductsApi,
  adminPromoPagesApi,
  listAdmin,
  unwrapAdmin,
} from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

const emptyForm = {
  title: "",
  description: "",
  type: 1,
  startDate: "",
  endDate: "",
  isActive: true,
  file: null,
  previewUrl: "",
  productIds: [],
};

function toInputDate(value) {
  if (!value) return "";
  return String(value).slice(0, 16);
}

function getProductId(product) {
  return product?.id || product?.productId || "";
}

function getProductImage(product) {
  if (product?.mainImageUrl) return product.mainImageUrl;
  if (product?.imageUrl) return product.imageUrl;
  if (product?.image) return product.image;

  const images =
    product?.images ||
    product?.productImages ||
    product?.imageDtos ||
    product?.productImageDtos ||
    [];

  if (!Array.isArray(images) || images.length === 0) return "";

  const first = images[0];

  if (typeof first === "string") return first;

  return (
    first?.imageUrl ||
    first?.mainImageUrl ||
    first?.url ||
    first?.secureUrl ||
    first?.src ||
    ""
  );
}

function money(value) {
  return `${Number(value || 0).toFixed(2)} ₼`;
}

export default function AdminPromoForm({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = mode === "edit";

  const [form, setForm] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadAll();

    return () => {
      if (form.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(form.previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mode]);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const productRes = await adminProductsApi.list({
        page: 1,
        pageSize: 500,
        search: "",
      });

      const loadedProducts = listAdmin(productRes);
      setProducts(loadedProducts);

      if (isEdit) {
        const promoRes = await adminPromoPagesApi.detail(id);
        const promo = unwrapAdmin(promoRes);

        setForm({
          title: promo?.title || "",
          description: promo?.description || "",
          type: Number(promo?.type || 1),
          startDate: toInputDate(promo?.startDate),
          endDate: toInputDate(promo?.endDate),
          isActive: promo?.isActive ?? true,
          file: null,
          previewUrl: promo?.imageUrl || "",
          productIds: promo?.productIds || [],
        });
      } else {
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err.message || "Məlumatlar yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (form.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(form.previewUrl);
    }

    setForm((prev) => ({
      ...prev,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    e.target.value = "";
  }

  function toggleProduct(productId) {
    if (!productId) return;

    setForm((prev) => {
      const exists = prev.productIds.includes(productId);

      return {
        ...prev,
        productIds: exists
          ? prev.productIds.filter((id) => id !== productId)
          : [...prev.productIds, productId],
      };
    });
  }

  function removeSelectedProduct(productId) {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.filter((id) => id !== productId),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) return setError("Başlıq yazılmalıdır.");
    if (!form.startDate) return setError("Başlama tarixi seçilməlidir.");
    if (!form.endDate) return setError("Bitmə tarixi seçilməlidir.");
    if (!isEdit && !form.file) return setError("Şəkil seçilməlidir.");
    if (form.productIds.length === 0) {
      return setError("Ən azı 1 məhsul seçilməlidir.");
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: Number(form.type),
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: Boolean(form.isActive),
      file: form.file,
      productIds: form.productIds,
    };

    try {
      setSaving(true);

      if (isEdit) {
        await adminPromoPagesApi.update(id, payload);
        setSuccess("Promo səhifə yeniləndi.");
      } else {
        await adminPromoPagesApi.create(payload);
        navigate("/SuperAdmin/campaigns");
      }
    } catch (err) {
      setError(err.message || "Promo yadda saxlanmadı.");
    } finally {
      setSaving(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return products;

    return products.filter((product) => {
      const text = [
        product?.name,
        product?.productCode,
        product?.model,
        product?.brandName,
        product?.categoryName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [products, search]);

  const selectedProducts = useMemo(() => {
    return form.productIds
      .map((productId) =>
        products.find((product) => String(getProductId(product)) === String(productId))
      )
      .filter(Boolean);
  }, [form.productIds, products]);

  if (loading) return <AppLoader text="Promo form hazırlanır" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Yadda saxlanılır" />}

      <button
        type="button"
        onClick={() => navigate("/SuperAdmin/campaigns")}
        className="mb-5 flex h-11 items-center gap-2 rounded-[15px] bg-white px-4 text-sm font-extrabold text-zinc-700 transition active:scale-[0.97]"
      >
        <FiArrowLeft />
        Kampaniyalara qayıt
      </button>

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Promo pages
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            {isEdit ? "Promo yenilə" : "Promo yarat"}
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Campaign və Banner üçün şəkil, tarix və məhsul seçimi.
          </p>
        </div>

        {isEdit && (
          <button
            type="button"
            onClick={loadAll}
            className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-zinc-950 px-5 text-sm font-extrabold text-white"
          >
            <FiRefreshCw />
            Yenilə
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-center gap-2 rounded-[18px] border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          <FiCheckCircle />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <main className="space-y-5">
          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <h2 className="mb-5 text-xl font-extrabold tracking-[-0.03em]">
              Əsas məlumatlar
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminInput
                label="Başlıq"
                placeholder="Yay Endirimi"
                value={form.title}
                onChange={(v) => updateForm("title", v)}
              />

              <AdminSelect
                label="Promo tipi"
                value={form.type}
                onChange={(v) => updateForm("type", Number(v))}
                disabled={isEdit}
              >
                <option value={1}>Campaign</option>
                <option value={2}>Banner</option>
              </AdminSelect>

              <AdminInput
                label="Başlama tarixi"
                type="datetime-local"
                value={form.startDate}
                onChange={(v) => updateForm("startDate", v)}
              />

              <AdminInput
                label="Bitmə tarixi"
                type="datetime-local"
                value={form.endDate}
                onChange={(v) => updateForm("endDate", v)}
              />
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">
                Açıqlama
              </span>

              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Promo haqqında qısa açıqlama..."
                rows={5}
                className="w-full resize-none rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-zinc-400"
              />
            </label>

            <div className="mt-4">
              <ToggleRow
                title="Aktiv promo"
                subtitle="Aktiv olduqda public homepage-də görünə bilər."
                checked={form.isActive}
                onChange={() => updateForm("isActive", !form.isActive)}
              />
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <h2 className="mb-5 text-xl font-extrabold tracking-[-0.03em]">
              Promo şəkli
            </h2>

            <label className="block cursor-pointer rounded-[22px] border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center transition hover:border-zinc-400">
              <FiUploadCloud className="mx-auto text-[34px] text-zinc-400" />

              <p className="mt-3 text-sm font-extrabold text-zinc-700">
                Şəkil seç
              </p>

              <p className="mt-1 text-xs font-bold text-zinc-400">
                Campaign və Banner üçün əsas görünən şəkil.
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {form.previewUrl && (
              <div className="mt-4 overflow-hidden rounded-[24px] border border-zinc-100 bg-zinc-50">
                <img
                  src={form.previewUrl}
                  alt="Promo preview"
                  className="h-64 w-full object-cover"
                />
              </div>
            )}
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                  Məhsul seçimi
                </h2>

                <p className="text-sm font-medium text-zinc-500">
                  Promo səhifədə görünəcək məhsulları seç.
                </p>
              </div>

              <div className="flex h-12 items-center gap-3 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 md:w-[320px]">
                <FiSearch className="text-zinc-400" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Məhsul axtar"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const productId = getProductId(product);
                const selected = form.productIds.includes(productId);

                return (
                  <ProductCard
                    key={productId}
                    product={product}
                    selected={selected}
                    onClick={() => toggleProduct(productId)}
                  />
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="rounded-[22px] bg-zinc-50 p-8 text-center text-sm font-bold text-zinc-400">
                Məhsul tapılmadı.
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-5">
          <section className="sticky top-5 rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">
              Seçilmiş məhsullar
            </h2>

            <p className="mt-1 text-sm font-medium text-zinc-500">
              {selectedProducts.length} məhsul seçilib.
            </p>

            <div className="mt-5 space-y-3">
              {selectedProducts.map((product) => {
                const productId = getProductId(product);

                return (
                  <div
                    key={productId}
                    className="flex items-center gap-3 rounded-[20px] bg-zinc-50 p-3"
                  >
                    <div className="h-14 w-14 overflow-hidden rounded-[16px] bg-white">
                      {getProductImage(product) ? (
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-zinc-300">
                          <FiImage />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-extrabold text-zinc-950">
                        {product.name || "Məhsul"}
                      </p>

                      <p className="text-xs font-bold text-zinc-400">
                        {product.productCode || "Kod yoxdur"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSelectedProduct(productId)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-600"
                    >
                      <FiX />
                    </button>
                  </div>
                );
              })}

              {selectedProducts.length === 0 && (
                <div className="rounded-[22px] bg-zinc-50 p-6 text-center text-sm font-bold text-zinc-400">
                  Hələ məhsul seçilməyib.
                </div>
              )}
            </div>

            <button
              disabled={saving}
              className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              <FiSave />
              {isEdit ? "Promo yenilə" : "Promo yarat"}
            </button>
          </section>
        </aside>
      </form>
    </div>
  );
}

function ProductCard({ product, selected, onClick }) {
  const image = getProductImage(product);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group overflow-hidden rounded-[24px] border text-left transition active:scale-[0.98] ${
        selected
          ? "border-[#244989] bg-[#f3f6ff]"
          : "border-zinc-100 bg-zinc-50 hover:border-zinc-300"
      }`}
    >
      <div className="relative h-40 bg-white">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-zinc-300">
            <FiImage className="text-[32px]" />
          </div>
        )}

        <span
          className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-sm ${
            selected
              ? "bg-[#244989] text-white"
              : "bg-white text-zinc-600"
          }`}
        >
          {selected ? <FiCheck /> : "+"}
        </span>
      </div>

      <div className="p-4">
        <p className="line-clamp-1 text-sm font-extrabold text-zinc-950">
          {product.name || "Məhsul adı yoxdur"}
        </p>

        <p className="mt-1 text-xs font-bold text-zinc-400">
          Kod: {product.productCode || "—"}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm font-extrabold text-zinc-950">
            {money(product.discountPrice || product.price)}
          </span>

          {product.discountPrice ? (
            <span className="text-xs font-bold text-zinc-400 line-through">
              {money(product.price)}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function AdminInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-800">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-13 w-full rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold outline-none transition focus:border-zinc-400"
      />
    </label>
  );
}

function AdminSelect({ label, value, onChange, children, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-800">
        {label}
      </span>

      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-13 w-full rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold outline-none transition focus:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>
    </label>
  );
}

function ToggleRow({ title, subtitle, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center justify-between gap-4 rounded-[20px] bg-zinc-50 p-4 text-left"
    >
      <span>
        <span className="block text-sm font-extrabold text-zinc-950">
          {title}
        </span>

        {subtitle && (
          <span className="mt-1 block text-xs font-bold text-zinc-400">
            {subtitle}
          </span>
        )}
      </span>

      <span
        className={`flex h-8 w-14 items-center rounded-full p-1 transition ${
          checked ? "bg-[#244989]" : "bg-zinc-300"
        }`}
      >
        <span
          className={`h-6 w-6 rounded-full bg-white transition ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}