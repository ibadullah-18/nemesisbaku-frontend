import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiImage,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiX,
} from "react-icons/fi";
import {
  adminHomeSectionsApi,
  normalizeAdminGuidList,
  unwrapAdmin,
} from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";
import { getPanelBasePath } from "../../api/admin/adminAuth";
import { showAdminToast } from "../../utils/adminToast";
import {
  isEndAfterStart,
  localDateTimeToIso,
  toLocalDateTimeInput,
} from "../../utils/dataTime";

const emptyForm = {
  title: "",
  subtitle: "",
  displayOrder: 1,
  startDate: "",
  endDate: "",
  isActive: true,
  productIds: [],
};

function getProductId(product) {
  return normalizeAdminGuidList([product])[0] || "";
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

export default function AdminHomeSectionForm({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = mode === "edit";

  const [form, setForm] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const basePath = getPanelBasePath();

  const showToast = useCallback((message, type = "error") => {
    showAdminToast(message, type);
  }, []);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mode]);

  async function loadAll() {
    try {
      setLoading(true);
      const availableProducts =
        await adminHomeSectionsApi.availableProducts();
      const activeProducts = Array.isArray(availableProducts)
        ? availableProducts
        : [];
      const activeProductIds = new Set(
        activeProducts.map(getProductId).filter(Boolean),
      );

      setProducts(activeProducts);

      if (isEdit) {
        const sectionRes = await adminHomeSectionsApi.detail(id);
        const section = unwrapAdmin(sectionRes);
        const savedProductIds = normalizeAdminGuidList(
          section?.productIds || section?.products,
        );
        const availableProductIds = savedProductIds.filter((productId) =>
          activeProductIds.has(productId),
        );

        setForm({
          title: section?.title || "",
          subtitle: section?.subtitle || "",
          displayOrder: section?.displayOrder || 1,
          startDate: toLocalDateTimeInput(section?.startDate),
          endDate: toLocalDateTimeInput(section?.endDate),
          isActive: section?.isActive ?? true,
          productIds: availableProductIds,
        });

        if (savedProductIds.length !== availableProductIds.length) {
          showToast(
            "Artıq aktiv olmayan məhsul seçimdən avtomatik çıxarıldı.",
          );
        }
      } else {
        setForm(emptyForm);
      }
    } catch (err) {
      showToast(err.message || "Section məlumatları yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleProduct(productId) {
    const normalizedProductId = normalizeAdminGuidList([productId])[0];
    if (!normalizedProductId) return;

    setForm((prev) => {
      const currentIds = normalizeAdminGuidList(prev.productIds);
      const exists = currentIds.includes(normalizedProductId);

      return {
        ...prev,
        productIds: exists
          ? currentIds.filter((id) => id !== normalizedProductId)
          : [...currentIds, normalizedProductId],
      };
    });
  }

  function removeSelectedProduct(productId) {
    const normalizedProductId = normalizeAdminGuidList([productId])[0];

    setForm((prev) => ({
      ...prev,
      productIds: normalizeAdminGuidList(prev.productIds).filter(
        (id) => id !== normalizedProductId,
      ),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      return showToast("Section başlığı yazılmalıdır.");
    }

    if (!form.displayOrder || Number(form.displayOrder) <= 0) {
      return showToast("Sıra nömrəsi 0-dan böyük olmalıdır.");
    }

    if (!form.startDate) return showToast("Başlama tarixi seçilməlidir.");
    if (!form.endDate) return showToast("Bitmə tarixi seçilməlidir.");

    const selectedProductIds = normalizeAdminGuidList(form.productIds);
    const activeProductIdSet = new Set(
      products.map(getProductId).filter(Boolean),
    );
    const availableProductIds = selectedProductIds.filter((productId) =>
      activeProductIdSet.has(productId),
    );

    if (availableProductIds.length === 0) {
      return showToast("Ən azı 1 aktiv məhsul seçilməlidir.");
    }

    if (selectedProductIds.length !== availableProductIds.length) {
      setForm((prev) => ({ ...prev, productIds: availableProductIds }));
      return showToast(
        "Seçilmiş məhsullardan biri artıq aktiv deyil. Siyahı yeniləndi, yenidən yoxlayın.",
      );
    }

    let startDate;
    let endDate;

    try {
      startDate = localDateTimeToIso(form.startDate);
      endDate = localDateTimeToIso(form.endDate);
    } catch (err) {
      return showToast(err.message);
    }

    if (!isEndAfterStart(startDate, endDate)) {
      return showToast("Bitmə tarixi başlama tarixindən sonra olmalıdır.");
    }

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      displayOrder: Number(form.displayOrder),
      startDate,
      endDate,
      isActive: Boolean(form.isActive),
      productIds: availableProductIds,
    };

    try {
      setSaving(true);

      if (isEdit) {
        await adminHomeSectionsApi.update(id, payload);
        showToast("Home section yeniləndi.", "success");
      } else {
        await adminHomeSectionsApi.create(payload);
        navigate(`${basePath}/home-sections`);
      }
    } catch (err) {
      showToast(err.message || "Section yadda saxlanmadı.");
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
    return normalizeAdminGuidList(form.productIds)
      .map((productId) =>
        products.find((product) => getProductId(product) === productId),
      )
      .filter(Boolean);
  }, [form.productIds, products]);

  const selectedProductIdSet = useMemo(
    () => new Set(normalizeAdminGuidList(form.productIds)),
    [form.productIds],
  );

  if (loading) return <AppLoader text="Section form hazırlanır" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Yadda saxlanılır" />}

      <button
        type="button"
        onClick={() => navigate(`${basePath}/home-sections`)}
        className="mb-5 flex h-11 items-center gap-2 rounded-[15px] bg-white px-4 text-sm font-extrabold text-zinc-700 transition active:scale-[0.97]"
      >
        <FiArrowLeft />
        Home sections-a qayıt
      </button>

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Homepage containers
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            {isEdit ? "Section yenilə" : "Section yarat"}
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Homepage məhsul konteyneri üçün başlıq, sıra və məhsul seçimi.
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

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 xl:grid-cols-[1fr_420px]"
      >
        <main className="space-y-5">
          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <h2 className="mb-5 text-xl font-extrabold tracking-[-0.03em]">
              Əsas məlumatlar
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminInput
                label="Section başlığı"
                placeholder="Yeni Gələnlər"
                value={form.title}
                onChange={(v) => updateForm("title", v)}
              />

              <AdminInput
                label="Sıra nömrəsi"
                type="number"
                placeholder="1"
                value={form.displayOrder}
                onChange={(v) => updateForm("displayOrder", v)}
              />

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
                Alt başlıq
              </span>

              <textarea
                value={form.subtitle}
                onChange={(e) => updateForm("subtitle", e.target.value)}
                placeholder="Bu həftənin seçilənləri..."
                rows={4}
                className="w-full resize-none rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-zinc-400"
              />
            </label>

            <div className="mt-4">
              <ToggleRow
                title="Aktiv section"
                subtitle="Aktiv olduqda homepage-də görünəcək."
                checked={form.isActive}
                onChange={() => updateForm("isActive", !form.isActive)}
              />
            </div>
          </section>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                  Məhsul seçimi
                </h2>

                <p className="text-sm font-medium text-zinc-500">
                  Bu konteynerdə görünəcək məhsulları seç.
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
                const selected = selectedProductIdSet.has(productId);

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
              {isEdit ? "Section yenilə" : "Section yarat"}
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
            selected ? "bg-[#244989] text-white" : "bg-white text-zinc-600"
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
