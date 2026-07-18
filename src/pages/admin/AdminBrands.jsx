import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiEdit3,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { adminBrandsApi, listAdmin } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";
import {
  IMAGE_ACCEPT,
  prepareImageFile,
  revokeImagePreview,
} from "../../utils/imageFile";

const emptyForm = {
  name: "",
  image: null,
  preview: "",
};

export default function AdminBrands() {
  const previewRef = useRef("");
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingBrand, setEditingBrand] = useState(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    previewRef.current = form.preview;
  }, [form.preview]);

  useEffect(() => {
    return () => revokeImagePreview(previewRef.current);
  }, []);

  async function loadBrands() {
    try {
      setError("");
      setLoading(true);

      const res = await adminBrandsApi.list();
      setBrands(listAdmin(res));
    } catch (err) {
      setError(err.message || "Brendlər yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    revokeImagePreview(form.preview);

    setForm(emptyForm);
    setEditingBrand(null);
    setError("");
    setSuccess("");
  }

  async function selectImage(e) {
    const input = e.currentTarget;
    const selectedFile = input.files?.[0];
    input.value = "";

    if (!selectedFile) return;

    try {
      setError("");
      const file = await prepareImageFile(selectedFile);

      revokeImagePreview(form.preview);

      setForm((prev) => ({
        ...prev,
        image: file,
        preview: URL.createObjectURL(file),
      }));
    } catch (err) {
      setError(err.message || "Şəkil hazırlana bilmədi.");
    }
  }

  function removeSelectedImage() {
    revokeImagePreview(form.preview);

    setForm((prev) => ({
      ...prev,
      image: null,
      preview: editingBrand?.imageUrl || "",
    }));
  }

  function startEdit(brand) {
    revokeImagePreview(form.preview);

    setEditingBrand(brand);

    setForm({
      name: brand.name || "",
      image: null,
      preview: brand.imageUrl || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveBrand(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Brend adı yazılmalıdır.");
      return;
    }

    try {
      setSaving(true);

      if (editingBrand) {
        await adminBrandsApi.update(editingBrand.id, {
          name: form.name.trim(),
          image: form.image,
        });
      } else {
        await adminBrandsApi.create({
          name: form.name.trim(),
          image: form.image,
        });
      }

      const successMessage = editingBrand
        ? "Brend yeniləndi."
        : "Brend əlavə edildi.";
      resetForm();
      setSuccess(successMessage);
      await loadBrands();
    } catch (err) {
      setError(err.message || "Brend yadda saxlanmadı.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBrand(brand) {
    const ok = confirm(`${brand.name || "Bu brend"} silinsin?`);
    if (!ok) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await adminBrandsApi.delete(brand.id);

      if (editingBrand?.id === brand.id) resetForm();

      setSuccess("Brend silindi.");
      await loadBrands();
    } catch (err) {
      setError(
        err.message || "Brend silinmədi. Bu brendə bağlı məhsul ola bilər.",
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredBrands = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) return brands;

    return brands.filter((brand) =>
      String(brand.name || "")
        .toLowerCase()
        .includes(text),
    );
  }, [brands, search]);

  if (loading) return <AppLoader text="Brendlər yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Yadda saxlanılır" />}

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Admin brendlər
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            Brendlər
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Məhsul əlavə edərkən seçilən brendləri idarə edin.
          </p>
        </div>

        <button
          type="button"
          onClick={loadBrands}
          className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-zinc-950 px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <FiRefreshCw />
          Yenilə
        </button>
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

      <div className="grid gap-5 xl:grid-cols-[410px_1fr]">
        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                {editingBrand ? "Brendi yenilə" : "Yeni brend"}
              </h2>

              <p className="mt-1 text-sm font-medium text-zinc-500">
                Məsələn: Nike, Adidas, New Balance.
              </p>
            </div>

            {editingBrand && (
              <button
                type="button"
                onClick={resetForm}
                className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.94]"
              >
                <FiX />
              </button>
            )}
          </div>

          <form onSubmit={saveBrand} className="space-y-4">
            <AdminInput
              label="Brend adı"
              placeholder="Məsələn: Nike"
              value={form.name}
              onChange={(v) => updateForm("name", v)}
            />

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">
                Brend şəkli
              </span>

              <div className="flex cursor-pointer items-center justify-center gap-3 rounded-[18px] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm font-extrabold text-zinc-600 transition hover:border-zinc-400">
                <FiUploadCloud />
                {form.image ? form.image.name : "Şəkil seç"}
              </div>

              <input
                type="file"
                accept={IMAGE_ACCEPT}
                onChange={selectImage}
                className="hidden"
              />
            </label>

            {form.preview ? (
              <div className="relative grid h-36 place-items-center overflow-hidden rounded-[22px] border border-zinc-100 bg-zinc-50">
                <img
                  src={form.preview}
                  alt={form.name || "Brend"}
                  className="h-full w-full object-contain p-4"
                />

                {form.image && (
                  <button
                    type="button"
                    onClick={removeSelectedImage}
                    className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-red-600 shadow-[0_10px_28px_rgba(0,0,0,0.08)]"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            ) : (
              <div className="grid h-36 place-items-center rounded-[22px] border border-dashed border-zinc-200 bg-zinc-50 text-zinc-300">
                <FiImage className="text-[34px]" />
              </div>
            )}

            <button className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]">
              {editingBrand ? <FiSave /> : <FiPlus />}
              {editingBrand ? "Brendi yenilə" : "Brend əlavə et"}
            </button>
          </form>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                Brend siyahısı
              </h2>

              <p className="text-sm font-medium text-zinc-500">
                Cəmi {brands.length} brend.
              </p>
            </div>

            <div className="flex h-12 items-center gap-3 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 md:w-[290px]">
              <FiSearch className="text-zinc-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Brend axtar"
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {filteredBrands.map((brand) => (
              <article
                key={brand.id}
                className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-4 text-center transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_42px_rgba(0,0,0,0.04)] active:scale-[0.98]"
              >
                <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-white">
                  {brand.imageUrl ? (
                    <img
                      src={brand.imageUrl}
                      alt={brand.name}
                      className="h-full w-full object-contain p-3"
                    />
                  ) : (
                    <FiImage className="text-[28px] text-zinc-300" />
                  )}
                </div>

                <h3 className="mt-4 min-h-[38px] text-sm font-extrabold text-zinc-950">
                  {brand.name || "Adsız brend"}
                </h3>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(brand)}
                    className="grid h-10 flex-1 place-items-center rounded-[14px] bg-white text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.94]"
                  >
                    <FiEdit3 />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteBrand(brand)}
                    className="grid h-10 flex-1 place-items-center rounded-[14px] bg-red-50 text-red-600 transition hover:-translate-y-0.5 active:scale-[0.94]"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </article>
            ))}

            {filteredBrands.length === 0 && (
              <div className="col-span-full rounded-[22px] bg-zinc-50 p-8 text-center text-sm font-extrabold text-zinc-400">
                Brend tapılmadı.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminInput({ label, placeholder, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-800">
        {label}
      </span>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-13 w-full rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold outline-none transition focus:border-zinc-400"
      />
    </label>
  );
}
