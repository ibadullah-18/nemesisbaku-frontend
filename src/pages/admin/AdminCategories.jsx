import { useEffect, useMemo, useState } from "react";
import {
  FiEdit3,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import {
  adminCategoriesApi,
  listAdmin,
} from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

const emptyForm = {
  name: "",
  iconUrl: "",
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingCategory, setEditingCategory] = useState(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setError("");
      setLoading(true);

      const res = await adminCategoriesApi.list();
      setCategories(listAdmin(res));
    } catch (err) {
      setError(err.message || "Kateqoriyalar yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingCategory(null);
    setError("");
    setSuccess("");
  }

  function startEdit(category) {
    setEditingCategory(category);
    setForm({
      name: category.name || "",
      iconUrl: category.iconUrl || category.imageUrl || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveCategory(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Kateqoriya adı yazılmalıdır.");
      return;
    }

    try {
      setSaving(true);

      const body = {
        name: form.name.trim(),
        iconUrl: form.iconUrl.trim(),
      };

      if (editingCategory) {
        await adminCategoriesApi.update(editingCategory.id, body);
        setSuccess("Kateqoriya yeniləndi.");
      } else {
        await adminCategoriesApi.create(body);
        setSuccess("Kateqoriya əlavə edildi.");
      }

      resetForm();
      await loadCategories();
    } catch (err) {
      setError(err.message || "Kateqoriya yadda saxlanmadı.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category) {
    const ok = confirm(`${category.name || "Bu kateqoriya"} silinsin?`);
    if (!ok) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await adminCategoriesApi.delete(category.id);

      if (editingCategory?.id === category.id) resetForm();

      setSuccess("Kateqoriya silindi.");
      await loadCategories();
    } catch (err) {
      setError(
        err.message ||
          "Kateqoriya silinmədi. Bu kateqoriyaya bağlı məhsul ola bilər."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredCategories = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) return categories;

    return categories.filter((category) =>
      String(category.name || "").toLowerCase().includes(text)
    );
  }, [categories, search]);

  if (loading) return <AppLoader text="Kateqoriyalar yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Yadda saxlanılır" />}

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Admin kateqoriyalar
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            Kateqoriyalar
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Məhsul əlavə edərkən seçilən kateqoriyaları idarə edin.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCategories}
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
                {editingCategory ? "Kateqoriyanı yenilə" : "Yeni kateqoriya"}
              </h2>

              <p className="mt-1 text-sm font-medium text-zinc-500">
                Məsələn: Sneakers, Boots, Accessories.
              </p>
            </div>

            {editingCategory && (
              <button
                type="button"
                onClick={resetForm}
                className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.94]"
              >
                <FiX />
              </button>
            )}
          </div>

          <form onSubmit={saveCategory} className="space-y-4">
            <AdminInput
              label="Kateqoriya adı"
              placeholder="Məsələn: Sneakers"
              value={form.name}
              onChange={(v) => updateForm("name", v)}
            />

            <AdminInput
              label="Icon / şəkil URL"
              placeholder="https://res.cloudinary.com/..."
              value={form.iconUrl}
              onChange={(v) => updateForm("iconUrl", v)}
            />

            {form.iconUrl ? (
              <div className="grid h-36 place-items-center overflow-hidden rounded-[22px] border border-zinc-100 bg-zinc-50">
                <img
                  src={form.iconUrl}
                  alt={form.name || "Kateqoriya"}
                  className="h-full w-full object-contain p-4"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="grid h-36 place-items-center rounded-[22px] border border-dashed border-zinc-200 bg-zinc-50 text-zinc-300">
                <FiImage className="text-[34px]" />
              </div>
            )}

            <button className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]">
              {editingCategory ? <FiSave /> : <FiPlus />}
              {editingCategory ? "Kateqoriyanı yenilə" : "Kateqoriya əlavə et"}
            </button>
          </form>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                Kateqoriya siyahısı
              </h2>

              <p className="text-sm font-medium text-zinc-500">
                Cəmi {categories.length} kateqoriya.
              </p>
            </div>

            <div className="flex h-12 items-center gap-3 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 md:w-[290px]">
              <FiSearch className="text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kateqoriya axtar"
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map((category) => {
              const image = category.iconUrl || category.imageUrl;

              return (
                <article
                  key={category.id}
                  className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-4 text-center transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_42px_rgba(0,0,0,0.04)] active:scale-[0.98]"
                >
                  <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-white">
                    {image ? (
                      <img
                        src={image}
                        alt={category.name}
                        className="h-full w-full object-contain p-3"
                      />
                    ) : (
                      <FiImage className="text-[28px] text-zinc-300" />
                    )}
                  </div>

                  <h3 className="mt-4 min-h-[38px] text-sm font-extrabold text-zinc-950">
                    {category.name || "Adsız kateqoriya"}
                  </h3>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(category)}
                      className="grid h-10 flex-1 place-items-center rounded-[14px] bg-white text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.94]"
                    >
                      <FiEdit3 />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteCategory(category)}
                      className="grid h-10 flex-1 place-items-center rounded-[14px] bg-red-50 text-red-600 transition hover:-translate-y-0.5 active:scale-[0.94]"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </article>
              );
            })}

            {filteredCategories.length === 0 && (
              <div className="col-span-full rounded-[22px] bg-zinc-50 p-8 text-center text-sm font-extrabold text-zinc-400">
                Kateqoriya tapılmadı.
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