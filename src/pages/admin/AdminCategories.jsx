import { useEffect, useState } from "react";
import { FiImage, FiPlus, FiRefreshCw } from "react-icons/fi";
import { adminCategoriesApi } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

function listOf(res) {
  const data = unwrap(res);
  return data?.items || data?.result || (Array.isArray(data) ? data : []);
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", iconUrl: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const res = await adminCategoriesApi.list();
      setCategories(listOf(res));
    } finally {
      setLoading(false);
    }
  }

  async function saveCategory(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Kateqoriya adı yazılmalıdır.");
      return;
    }

    try {
      setSaving(true);

      await adminCategoriesApi.create({
        name: form.name.trim(),
        iconUrl: form.iconUrl.trim(),
      });

      setForm({ name: "", iconUrl: "" });
      await loadCategories();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppLoader text="Kateqoriyalar yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Yadda saxlanılır" />}

      <div className="mb-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
          Admin kateqoriyalar
        </p>

        <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
          Kateqoriyalar
        </h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <h2 className="text-xl font-extrabold tracking-[-0.03em]">
            Yeni kateqoriya
          </h2>

          <p className="mb-5 mt-1 text-sm font-medium text-zinc-500">
            Məsələn: Sneakers, Boots, Accessories.
          </p>

          <form onSubmit={saveCategory} className="space-y-4">
            <AdminInput
              label="Kateqoriya adı"
              placeholder="Məsələn: Sneakers"
              value={form.name}
              onChange={(v) => setForm((p) => ({ ...p, name: v }))}
            />

            <AdminInput
              label="Icon / şəkil URL"
              placeholder="Məsələn: https://res.cloudinary.com/..."
              value={form.iconUrl}
              onChange={(v) => setForm((p) => ({ ...p, iconUrl: v }))}
            />

            {form.iconUrl && (
              <div className="grid h-32 place-items-center overflow-hidden rounded-[22px] border border-zinc-100 bg-zinc-50">
                <img
                  src={form.iconUrl}
                  alt={form.name}
                  className="h-full w-full object-contain p-4"
                />
              </div>
            )}

            <button className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white">
              <FiPlus />
              Kateqoriya əlavə et
            </button>
          </form>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                Kateqoriya siyahısı
              </h2>

              <p className="text-sm font-medium text-zinc-500">
                Məhsul əlavə edəndə bu siyahıdan seçiləcək.
              </p>
            </div>

            <button
              type="button"
              onClick={loadCategories}
              className="grid h-11 w-11 place-items-center rounded-full bg-zinc-50"
            >
              <FiRefreshCw />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <article
                key={category.id}
                className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-4 text-center transition hover:bg-white"
              >
                <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-white">
                  {category.iconUrl ? (
                    <img
                      src={category.iconUrl}
                      alt={category.name}
                      className="h-full w-full object-contain p-3"
                    />
                  ) : (
                    <FiImage className="text-[28px] text-zinc-300" />
                  )}
                </div>

                <h3 className="mt-4 text-sm font-extrabold text-zinc-950">
                  {category.name}
                </h3>
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