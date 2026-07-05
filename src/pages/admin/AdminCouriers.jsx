import { useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiEdit3,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiStar,
  FiTrash2,
  FiTruck,
  FiX,
} from "react-icons/fi";
import { adminCouriersApi, listAdmin } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

const emptyForm = {
  title: "",
  phoneNumber: "",
  isDefault: false,
};

function getCourierId(item) {
  return item?.id || item?.courierId;
}

function cleanPhone(value) {
  return String(value || "").replace(/[^\d+]/g, "");
}

export default function AdminCouriers() {
  const [couriers, setCouriers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCouriers();
  }, []);

  async function loadCouriers() {
    try {
      setError("");
      setLoading(true);

      const res = await adminCouriersApi.list();
      setCouriers(listAdmin(res));
    } catch (err) {
      setError(err.message || "Kuryerlər yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditing(null);
  }

  function startEdit(item) {
    setEditing(item);
    setForm({
      title: item.title || "",
      phoneNumber: item.phoneNumber || "",
      isDefault: Boolean(item.isDefault),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveCourier(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim()) return setError("Kuryer adı yazılmalıdır.");
    if (!form.phoneNumber.trim()) return setError("Kuryer nömrəsi yazılmalıdır.");

    try {
      setSaving(true);

      const body = {
        title: form.title.trim(),
        phoneNumber: cleanPhone(form.phoneNumber),
        isDefault: Boolean(form.isDefault),
      };

      if (editing) {
        const id = getCourierId(editing);
        if (!id) throw new Error("Kuryer ID gəlmədi.");

        await adminCouriersApi.update(id, body);
        setSuccess("Kuryer yeniləndi.");
      } else {
        await adminCouriersApi.create(body);
        setSuccess("Kuryer əlavə edildi.");
      }

      resetForm();
      await loadCouriers();
    } catch (err) {
      setError(err.message || "Əməliyyat uğursuz oldu.");
    } finally {
      setSaving(false);
    }
  }

  async function setDefaultCourier(item) {
    const id = getCourierId(item);

    if (!id) {
      setError("Bu kuryer üçün ID gəlmədi.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await adminCouriersApi.setDefault(id);
      setSuccess("Default kuryer dəyişdirildi.");
      await loadCouriers();
    } catch (err) {
      setError(err.message || "Default kuryer dəyişdirilmədi.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCourier(item) {
    const id = getCourierId(item);

    if (!id) {
      setError("Bu kuryer üçün ID gəlmədi.");
      return;
    }

    const ok = confirm(`${item.title || "Kuryer"} silinsin?`);
    if (!ok) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await adminCouriersApi.delete(id);
      setSuccess("Kuryer silindi.");
      await loadCouriers();

      if (editing && getCourierId(editing) === id) resetForm();
    } catch (err) {
      setError(err.message || "Kuryer silinmədi.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return couriers;

    return couriers.filter((item) =>
      `${item.title || ""} ${item.phoneNumber || ""}`
        .toLowerCase()
        .includes(text)
    );
  }, [couriers, search]);

  if (loading) return <AppLoader text="Kuryerlər yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Yadda saxlanılır" />}

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Admin kuryerlər
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            Kuryerlər
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Sifarişləri kuryerə WhatsApp ilə yönləndirmək üçün kuryerləri idarə edin.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCouriers}
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
        <div className="mb-5 flex items-center gap-2 rounded-[18px] border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          <FiCheckCircle />
          {success}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[410px_1fr]">
        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                {editing ? "Kuryeri yenilə" : "Yeni kuryer"}
              </h2>

              <p className="mt-1 text-sm font-medium text-zinc-500">
                Məsələn: Əli kuryer, 994501112233.
              </p>
            </div>

            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-700"
              >
                <FiX />
              </button>
            )}
          </div>

          <form onSubmit={saveCourier} className="space-y-4">
            <AdminInput
              icon={<FiTruck />}
              label="Kuryer adı"
              placeholder="Əli kuryer"
              value={form.title}
              onChange={(v) => updateForm("title", v)}
            />

            <AdminInput
              icon={<FiPhone />}
              label="Telefon nömrəsi"
              placeholder="994501112233"
              value={form.phoneNumber}
              onChange={(v) => updateForm("phoneNumber", v)}
            />

            <button
              type="button"
              onClick={() => updateForm("isDefault", !form.isDefault)}
              className={`flex w-full items-center justify-between rounded-[18px] border p-4 text-left transition ${
                form.isDefault
                  ? "border-[#244989] bg-[#244989]/8"
                  : "border-zinc-100 bg-zinc-50"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-extrabold text-zinc-900">
                <FiStar />
                Default kuryer olsun
              </span>

              <span
                className={`h-6 w-11 rounded-full p-1 transition ${
                  form.isDefault ? "bg-[#244989]" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white transition ${
                    form.isDefault ? "translate-x-5" : ""
                  }`}
                />
              </span>
            </button>

            <button className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]">
              <FiPlus />
              {editing ? "Kuryeri yenilə" : "Kuryer əlavə et"}
            </button>
          </form>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                Kuryer siyahısı
              </h2>

              <p className="text-sm font-medium text-zinc-500">
                Cəmi {couriers.length} kuryer.
              </p>
            </div>

            <div className="flex h-12 items-center gap-3 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 md:w-[300px]">
              <FiSearch className="text-zinc-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kuryer axtar"
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((item) => {
              const id = getCourierId(item);

              return (
                <article
                  key={id || item.phoneNumber}
                  className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-4 transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_42px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#244989]/8 text-[#244989]">
                        <FiTruck />
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold text-zinc-950">
                          {item.title || "Adsız kuryer"}
                        </h3>

                        <p className="mt-1 text-sm font-bold text-zinc-500">
                          {item.phoneNumber || "Nömrə yoxdur"}
                        </p>
                      </div>
                    </div>

                    {item.isDefault && (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold text-green-700">
                        Default
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="grid h-10 place-items-center rounded-[14px] bg-white text-zinc-700"
                    >
                      <FiEdit3 />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDefaultCourier(item)}
                      className="grid h-10 place-items-center rounded-[14px] bg-white text-[#244989]"
                    >
                      <FiStar />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteCourier(item)}
                      className="grid h-10 place-items-center rounded-[14px] bg-red-50 text-red-600"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </article>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-full rounded-[22px] bg-zinc-50 p-8 text-center text-sm font-extrabold text-zinc-400">
                Kuryer tapılmadı.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminInput({ icon, label, placeholder, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-800">
        {label}
      </span>

      <div className="flex h-13 items-center gap-3 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 transition focus-within:border-zinc-400">
        <span className="text-zinc-400">{icon}</span>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-zinc-400"
        />
      </div>
    </label>
  );
}