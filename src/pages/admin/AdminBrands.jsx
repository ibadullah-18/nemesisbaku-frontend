import { useEffect, useState } from "react";
import { FiEdit3, FiImage, FiPlus, FiRefreshCw, FiSave, FiTrash2, FiX } from "react-icons/fi";
import { adminBrandsApi } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

function listOf(res) {
  const data = unwrap(res);
  return data?.items || data?.result || (Array.isArray(data) ? data : []);
}

export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({ name: "", image: null, preview: "" });
  const [editingBrand, setEditingBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBrands();
  }, []);

  async function loadBrands() {
    try {
      setLoading(true);
      const res = await adminBrandsApi.list();
      setBrands(listOf(res));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ name: "", image: null, preview: "" });
    setEditingBrand(null);
  }

  function selectImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      image: file,
      preview: URL.createObjectURL(file),
    }));

    e.target.value = "";
  }

  function startEdit(brand) {
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
    if (!form.name.trim()) return alert("Brend adı yazılmalıdır.");

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

      resetForm();
      await loadBrands();
    } finally {
      setSaving(false);
    }
  }

  async function deleteBrand(id) {
    if (!confirm("Bu brend silinsin?")) return;

    try {
      setSaving(true);
      await adminBrandsApi.delete(id);
      await loadBrands();
      if (editingBrand?.id === id) resetForm();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppLoader text="Brendlər yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Yadda saxlanılır" />}

      <div className="mb-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
          Admin brendlər
        </p>
        <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
          Brendlər
        </h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                {editingBrand ? "Brendi yenilə" : "Yeni brend"}
              </h2>
              <p className="text-sm font-medium text-zinc-500">
                Məsələn: Nike, Adidas, Puma.
              </p>
            </div>

            {editingBrand && (
              <button
                type="button"
                onClick={resetForm}
                className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50"
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
              onChange={(v) => setForm((p) => ({ ...p, name: v }))}
            />

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">
                Brend şəkli
              </span>

              <div className="flex cursor-pointer items-center justify-center gap-3 rounded-[18px] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm font-extrabold text-zinc-600">
                <FiImage />
                {form.image ? form.image.name : "Şəkil seç"}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={selectImage}
                className="hidden"
              />
            </label>

            {form.preview && (
              <div className="grid h-36 place-items-center overflow-hidden rounded-[22px] border border-zinc-100 bg-zinc-50">
                <img
                  src={form.preview}
                  alt={form.name}
                  className="h-full w-full object-contain p-4"
                />
              </div>
            )}

            <button className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white">
              {editingBrand ? <FiSave /> : <FiPlus />}
              {editingBrand ? "Yenilə" : "Brend əlavə et"}
            </button>
          </form>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                Brend siyahısı
              </h2>
              <p className="text-sm font-medium text-zinc-500">
                Məhsul əlavə edəndə bu siyahıdan seçiləcək.
              </p>
            </div>

            <button
              type="button"
              onClick={loadBrands}
              className="grid h-11 w-11 place-items-center rounded-full bg-zinc-50"
            >
              <FiRefreshCw />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {brands.map((brand) => (
              <article
                key={brand.id}
                className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-4 text-center transition hover:bg-white"
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

                <h3 className="mt-4 text-sm font-extrabold text-zinc-950">
                  {brand.name}
                </h3>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(brand)}
                    className="grid h-10 flex-1 place-items-center rounded-[14px] bg-white text-zinc-700"
                  >
                    <FiEdit3 />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteBrand(brand.id)}
                    className="grid h-10 flex-1 place-items-center rounded-[14px] bg-red-50 text-red-600"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </article>
            ))}
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