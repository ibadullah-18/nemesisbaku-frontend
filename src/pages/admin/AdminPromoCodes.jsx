import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiPercent,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTag,
  FiTrash2,
} from "react-icons/fi";
import { adminPromoCodesApi, listAdmin } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";
import {
  isEndAfterStart,
  localDateTimeToIso,
  toLocalDateTimeInput,
} from "../../utils/dataTime";

const emptyForm = {
  code: "",
  discountType: 1,
  discountValue: "",
  usageLimit: "",
  minOrderAmount: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

function formatDate(value) {
  if (!value) return "—";
  return String(value).replace("T", " ").slice(0, 16);
}

function discountText(item) {
  if (Number(item.discountType) === 1) return `${item.discountValue || 0}%`;
  return `${item.discountValue || 0} ₼`;
}

export default function AdminPromoCodes() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadPromoCodes();
  }, []);

  async function loadPromoCodes() {
    try {
      setError("");
      setLoading(true);

      const res = await adminPromoCodesApi.list();
      setPromoCodes(listAdmin(res));
    } catch (err) {
      setError(err.message || "Promo kodlar yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function createPromoCode(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.code.trim()) return setError("Promo kod yazılmalıdır.");
    if (!form.discountValue || Number(form.discountValue) <= 0) {
      return setError("Endirim dəyəri 0-dan böyük olmalıdır.");
    }
    if (!form.usageLimit || Number(form.usageLimit) <= 0) {
      return setError("İstifadə limiti 0-dan böyük olmalıdır.");
    }
    if (!Number.isInteger(Number(form.usageLimit))) {
      return setError("İstifadə limiti tam ədəd olmalıdır.");
    }
    if (Number(form.discountType) === 1 && Number(form.discountValue) > 100) {
      return setError("Faiz endirimi 100-dən böyük ola bilməz.");
    }
    if (!form.startDate) return setError("Başlama tarixi seçilməlidir.");
    if (!form.endDate) return setError("Bitmə tarixi seçilməlidir.");

    let startDate;
    let endDate;

    try {
      startDate = localDateTimeToIso(form.startDate);
      endDate = localDateTimeToIso(form.endDate);
    } catch (err) {
      return setError(err.message);
    }

    if (!isEndAfterStart(startDate, endDate)) {
      return setError("Bitmə tarixi başlama tarixindən sonra olmalıdır.");
    }

    try {
      setSaving(true);

      await adminPromoCodesApi.create({
        code: form.code.trim().toUpperCase(),
        discountType: Number(form.discountType),
        discountValue: Number(form.discountValue),
        usageLimit: Number(form.usageLimit),
        minOrderAmount: Number(form.minOrderAmount || 0),
        startDate,
        endDate,
        isActive: Boolean(form.isActive),
      });

      setForm(emptyForm);
      setSuccess("Promo kod əlavə edildi.");
      await loadPromoCodes();
    } catch (err) {
      setError(err.message || "Promo kod əlavə edilmədi.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePromoCode(item) {
    const id = item.id || item.promoCodeId;

    if (!id) {
      setError("Bu promo kod üçün ID gəlmədi. Silmək mümkün deyil.");
      return;
    }

    const ok = confirm(`${item.code || "Promo kod"} silinsin?`);
    if (!ok) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await adminPromoCodesApi.delete(id);
      setPromoCodes((prev) =>
        prev.filter((x) => (x.id || x.promoCodeId) !== id),
      );
      setSuccess("Promo kod silindi.");
    } catch (err) {
      setError(err.message || "Promo kod silinmədi.");
    } finally {
      setSaving(false);
    }
  }

  const filteredPromoCodes = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return promoCodes;

    return promoCodes.filter((item) =>
      String(item.code || "")
        .toLowerCase()
        .includes(text),
    );
  }, [promoCodes, search]);

  if (loading) return <AppLoader text="Promo kodlar yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Yadda saxlanılır" />}

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Admin promo kodlar
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            Promo kodlar
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Endirim kodlarını yaradın, aktiv edin və silin.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPromoCodes}
          className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-zinc-950 px-5 text-sm font-extrabold text-white"
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

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <h2 className="text-xl font-extrabold tracking-[-0.03em]">
            Yeni promo kod
          </h2>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Məsələn: NEMESIS20, SUMMER10.
          </p>

          <form onSubmit={createPromoCode} className="mt-5 space-y-4">
            <AdminInput
              label="Kod"
              placeholder="NEMESIS20"
              value={form.code}
              onChange={(v) => updateForm("code", v)}
            />

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">
                Endirim tipi
              </span>

              <select
                value={form.discountType}
                onChange={(e) => updateForm("discountType", e.target.value)}
                className="h-13 w-full rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold outline-none"
              >
                <option value={1}>Faizlə endirim</option>
                <option value={2}>Məbləğlə endirim</option>
              </select>
            </label>

            <AdminInput
              label="Endirim dəyəri"
              type="number"
              placeholder={Number(form.discountType) === 1 ? "20" : "10"}
              value={form.discountValue}
              onChange={(v) => updateForm("discountValue", v)}
            />

            <AdminInput
              label="İstifadə limiti"
              type="number"
              placeholder="100"
              value={form.usageLimit}
              onChange={(v) => updateForm("usageLimit", v)}
            />

            <AdminInput
              label="Minimum sifariş məbləği"
              type="number"
              placeholder="0"
              value={form.minOrderAmount}
              onChange={(v) => updateForm("minOrderAmount", v)}
            />

            <AdminInput
              label="Başlama tarixi"
              type="datetime-local"
              value={toLocalDateTimeInput(form.startDate)}
              onChange={(v) => updateForm("startDate", v)}
            />

            <AdminInput
              label="Bitmə tarixi"
              type="datetime-local"
              value={toLocalDateTimeInput(form.endDate)}
              onChange={(v) => updateForm("endDate", v)}
            />

            <button
              type="button"
              onClick={() => updateForm("isActive", !form.isActive)}
              className={`flex w-full items-center justify-between rounded-[18px] border p-4 text-left ${
                form.isActive
                  ? "border-[#244989] bg-[#244989]/8"
                  : "border-zinc-100 bg-zinc-50"
              }`}
            >
              <span className="text-sm font-extrabold text-zinc-900">
                Aktiv promo kod
              </span>

              <span
                className={`h-6 w-11 rounded-full p-1 ${
                  form.isActive ? "bg-[#244989]" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white transition ${
                    form.isActive ? "translate-x-5" : ""
                  }`}
                />
              </span>
            </button>

            <button className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white">
              <FiPlus />
              Promo kod əlavə et
            </button>
          </form>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                Promo kod siyahısı
              </h2>

              <p className="text-sm font-medium text-zinc-500">
                Cəmi {promoCodes.length} promo kod.
              </p>
            </div>

            <div className="flex h-12 items-center gap-3 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 md:w-[300px]">
              <FiSearch className="text-zinc-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kod axtar"
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
              />
            </div>
          </div>

          <div className="grid gap-3">
            {filteredPromoCodes.map((item) => {
              const id = item.id || item.promoCodeId;

              return (
                <article
                  key={id || item.code}
                  className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-4 transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_42px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#244989]/8 text-[#244989]">
                        {Number(item.discountType) === 1 ? (
                          <FiPercent />
                        ) : (
                          <FiTag />
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-extrabold text-zinc-950">
                          {item.code || "—"}
                        </h3>

                        <p className="text-sm font-bold text-zinc-500">
                          Endirim: {discountText(item)} · Minimum sifariş:{" "}
                          {item.minOrderAmount || 0} ₼
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                          item.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {item.isActive ? "Aktiv" : "Deaktiv"}
                      </span>

                      <button
                        type="button"
                        onClick={() => deletePromoCode(item)}
                        className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs font-bold text-zinc-500 md:grid-cols-3">
                    <Info
                      icon={<FiCalendar />}
                      label="Başlama"
                      value={formatDate(item.startDate)}
                    />
                    <Info
                      icon={<FiCalendar />}
                      label="Bitmə"
                      value={formatDate(item.endDate)}
                    />
                    <Info
                      icon={<FiTag />}
                      label="Limit"
                      value={`${item.usedCount || item.usageCount || 0} / ${
                        item.usageLimit || 0
                      }`}
                    />
                  </div>
                </article>
              );
            })}

            {filteredPromoCodes.length === 0 && (
              <div className="rounded-[22px] bg-zinc-50 p-8 text-center text-sm font-extrabold text-zinc-400">
                Promo kod tapılmadı.
              </div>
            )}
          </div>
        </section>
      </div>
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

function Info({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-[14px] bg-white px-3 py-2">
      <span className="text-[#244989]">{icon}</span>
      <span>
        {label}: {value}
      </span>
    </div>
  );
}
