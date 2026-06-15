import { useEffect, useMemo, useState } from "react";
import {
  FiDroplet,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import { adminColorsApi, listAdmin } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

const emptyForm = {
  name: "",
  hexCode: "#000000",
};

export default function AdminColors() {
  const [colors, setColors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadColors();
  }, []);

  async function loadColors() {
    try {
      setError("");
      setLoading(true);

      const res = await adminColorsApi.list();
      setColors(listAdmin(res));
    } catch (err) {
      setError(err.message || "Rənglər yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function addColor(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Rəng adı yazılmalıdır.");
      return;
    }

    try {
      setSaving(true);

      await adminColorsApi.create({
        name: form.name.trim(),
        hexCode: form.hexCode || "#000000",
      });

      setForm(emptyForm);
      setSuccess("Rəng əlavə edildi.");
      await loadColors();
    } catch (err) {
      setError(err.message || "Rəng əlavə edilmədi.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteColor(color) {
    const ok = confirm(`${color.name || "Bu rəng"} silinsin?`);
    if (!ok) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await adminColorsApi.delete(color.id);

      setSuccess("Rəng silindi.");
      await loadColors();
    } catch (err) {
      setError(err.message || "Rəng silinmədi. Bu rəngə bağlı variant ola bilər.");
    } finally {
      setSaving(false);
    }
  }

  const filteredColors = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) return colors;

    return colors.filter((color) =>
      String(color.name || color.colorName || "")
        .toLowerCase()
        .includes(text)
    );
  }, [colors, search]);

  if (loading) return <AppLoader text="Rənglər yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Yadda saxlanılır" />}

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Admin rənglər
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            Rənglər
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Məhsul variantlarında istifadə olunan rəngləri idarə edin.
          </p>
        </div>

        <button
          type="button"
          onClick={loadColors}
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

      <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <h2 className="text-xl font-extrabold tracking-[-0.03em]">
            Yeni rəng
          </h2>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Məsələn: Ağ, Qara, Qırmızı.
          </p>

          <form onSubmit={addColor} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">
                Rəng adı
              </span>

              <div className="flex h-13 items-center gap-3 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 transition focus-within:border-zinc-400">
                <FiDroplet className="text-zinc-400" />

                <input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="Məsələn: Ağ"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">
                Rəng kodu
              </span>

              <div className="flex h-13 items-center gap-3 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 transition focus-within:border-zinc-400">
                <input
                  type="color"
                  value={form.hexCode}
                  onChange={(e) => updateForm("hexCode", e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-lg border-none bg-transparent p-0"
                />

                <input
                  value={form.hexCode}
                  onChange={(e) => updateForm("hexCode", e.target.value)}
                  placeholder="#000000"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400"
                />
              </div>
            </label>

            <div className="flex items-center gap-3 rounded-[20px] bg-zinc-50 p-4">
              <span
                className="h-12 w-12 rounded-[16px] border border-zinc-200"
                style={{ backgroundColor: form.hexCode || "#000000" }}
              />
              <div>
                <p className="text-sm font-extrabold text-zinc-950">
                  {form.name || "Rəng adı"}
                </p>
                <p className="text-xs font-bold text-zinc-400">
                  {form.hexCode || "#000000"}
                </p>
              </div>
            </div>

            <button className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]">
              <FiPlus />
              Rəng əlavə et
            </button>
          </form>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                Rəng siyahısı
              </h2>

              <p className="text-sm font-medium text-zinc-500">
                Cəmi {colors.length} rəng.
              </p>
            </div>

            <div className="flex h-12 items-center gap-3 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 md:w-[290px]">
              <FiSearch className="text-zinc-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rəng axtar"
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {filteredColors.map((color) => {
              const name = color.name || color.colorName || "Adsız rəng";
              const hex =
                color.hexCode ||
                color.colorHex ||
                color.hex ||
                "#000000";

              return (
                <article
                  key={color.id || `${name}-${hex}`}
                  className="rounded-[22px] border border-zinc-100 bg-zinc-50 p-4 text-center transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_42px_rgba(0,0,0,0.04)] active:scale-[0.98]"
                >
                  <div
                    className="mx-auto h-16 w-16 rounded-[22px] border border-zinc-200"
                    style={{ backgroundColor: hex }}
                  />

                  <h3 className="mt-3 text-sm font-extrabold text-zinc-950">
                    {name}
                  </h3>

                  <p className="mt-1 text-xs font-bold text-zinc-400">
                    {hex}
                  </p>

                  <button
                    type="button"
                    onClick={() => deleteColor(color)}
                    className="mt-4 grid h-10 w-full place-items-center rounded-[14px] bg-red-50 text-red-600 transition hover:-translate-y-0.5 active:scale-[0.94]"
                  >
                    <FiTrash2 />
                  </button>
                </article>
              );
            })}

            {filteredColors.length === 0 && (
              <div className="col-span-full rounded-[22px] bg-zinc-50 p-8 text-center text-sm font-extrabold text-zinc-400">
                Rəng tapılmadı.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}