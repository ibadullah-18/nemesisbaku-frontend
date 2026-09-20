import { useEffect, useMemo, useState } from "react";
import {
  FiMaximize2,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";
import { adminSizesApi, listAdmin } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

function getSizeId(size) {
  return size?.id || size?.sizeId;
}

function getSizeLabel(size) {
  return size?.value || size?.size || size?.name || size?.sizeValue || "—";
}

export default function AdminSizes() {
  const [sizes, setSizes] = useState([]);
  const [size, setSize] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSizes();
  }, []);

  async function loadSizes() {
    try {
      setError("");
      setLoading(true);

      const res = await adminSizesApi.list();
      setSizes(listAdmin(res));
    } catch (err) {
      setError(err.message || "Ölçülər yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  async function addSize(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!size.trim()) {
      setError("Ölçü yazılmalıdır.");
      return;
    }

    try {
      setSaving(true);

      await adminSizesApi.create(size.trim());

      setSize("");
      setSuccess("Ölçü əlavə edildi.");
      await loadSizes();
    } catch (err) {
      setError(err.message || "Ölçü əlavə edilmədi.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSize(item) {
    const sizeId = getSizeId(item);
    const label = getSizeLabel(item);

    if (!sizeId) {
      setError("Bu ölçü üçün ID gəlmədi. Silmək mümkün deyil.");
      return;
    }

    const ok = confirm(`${label} silinsin?`);
    if (!ok) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await adminSizesApi.delete(sizeId);

      setSizes((prev) => prev.filter((x) => getSizeId(x) !== sizeId));
      setSuccess("Ölçü silindi.");
    } catch (err) {
      setError(
        err.message || "Ölçü silinmədi. Bu ölçüyə bağlı variant ola bilər."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredSizes = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) return sizes;

    return sizes.filter((item) =>
      getSizeLabel(item).toLowerCase().includes(text)
    );
  }, [sizes, search]);

  if (loading) return <AppLoader text="Ölçülər yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Yadda saxlanılır" />}

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Admin ölçülər
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            Ölçülər
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Məhsul variantlarında istifadə olunan ayaqqabı ölçüləri.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSizes}
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
            Yeni ölçü
          </h2>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Məsələn: 39, 40, 41, 42.
          </p>

          <form onSubmit={addSize} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">
                Ölçü
              </span>

              <div className="flex h-13 items-center gap-3 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 transition focus-within:border-zinc-400">
                <FiMaximize2 className="text-zinc-400" />

                <input
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="Məsələn: 42"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400"
                />
              </div>
            </label>

            <button className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]">
              <FiPlus />
              Ölçü əlavə et
            </button>
          </form>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                Ölçü siyahısı
              </h2>

              <p className="text-sm font-medium text-zinc-500">
                Cəmi {sizes.length} ölçü.
              </p>
            </div>

            <div className="flex h-12 items-center gap-3 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 md:w-[290px]">
              <FiSearch className="text-zinc-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ölçü axtar"
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            {filteredSizes.map((item) => {
              const sizeId = getSizeId(item);
              const label = getSizeLabel(item);

              return (
                <article
                  key={sizeId || label}
                  className="rounded-[22px] border border-zinc-100 bg-zinc-50 p-4 text-center transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_42px_rgba(0,0,0,0.04)] active:scale-[0.98]"
                >
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-white text-[#244989]">
                    <FiMaximize2 />
                  </div>

                  <h3 className="mt-3 text-lg font-extrabold text-zinc-950">
                    {label}
                  </h3>

                  <button
                    type="button"
                    onClick={() => deleteSize(item)}
                    className="mt-4 grid h-10 w-full place-items-center rounded-[14px] bg-red-50 text-red-600 transition hover:-translate-y-0.5 active:scale-[0.94]"
                  >
                    <FiTrash2 />
                  </button>
                </article>
              );
            })}

            {filteredSizes.length === 0 && (
              <div className="col-span-full rounded-[22px] bg-zinc-50 p-8 text-center text-sm font-extrabold text-zinc-400">
                Ölçü tapılmadı.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}