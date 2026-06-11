import { useEffect, useState } from "react";
import { FiEdit3, FiPlus, FiSave, FiTrash2, FiUploadCloud, FiX } from "react-icons/fi";
import { adminCampaignsApi } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

const emptyForm = {
  title: "",
  description: "",
  redirectUrl: "/",
  startDate: "",
  endDate: "",
  isActive: true,
  file: null,
  previewUrl: "",
};

function unwrapData(res) {
  return res?.data?.data || res?.data || res;
}

function listOf(res) {
  const data = unwrapData(res);
  return data?.items || data?.list || data?.result || (Array.isArray(data) ? data : []);
}

function toInputDate(value) {
  if (!value) return "";
  return String(value).slice(0, 16);
}

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      setLoading(true);
      const res = await adminCampaignsApi.list();
      setCampaigns(listOf(res));
    } finally {
      setLoading(false);
    }
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    if (form.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(form.previewUrl);
    }

    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  function startEdit(campaign) {
    if (form.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(form.previewUrl);
    }

    setEditingId(campaign.id);

    setForm({
      title: campaign.title || "",
      description: campaign.description || "",
      redirectUrl: campaign.redirectUrl || "/",
      startDate: toInputDate(campaign.startDate),
      endDate: toInputDate(campaign.endDate),
      isActive: campaign.isActive ?? true,
      file: null,
      previewUrl: campaign.imageUrl || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (form.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(form.previewUrl);
    }

    updateForm("file", file);
    updateForm("previewUrl", URL.createObjectURL(file));

    e.target.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim()) return setError("Başlıq yazılmalıdır.");
    if (!editingId && !form.file) return setError("Banner şəkli seçilməlidir.");
    if (!form.startDate) return setError("Başlama tarixi seçilməlidir.");
    if (!form.endDate) return setError("Bitmə tarixi seçilməlidir.");

    try {
      setSaving(true);

      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        redirectUrl: form.redirectUrl.trim() || "/",
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
        file: form.file,
      };

      if (editingId) {
        await adminCampaignsApi.update(editingId, body);
        setSuccess("Kampaniya yeniləndi.");
      } else {
        await adminCampaignsApi.create(body);
        setSuccess("Kampaniya yaradıldı.");
      }

      resetForm();
      await loadCampaigns();
    } catch (err) {
      setError(err.message || "Kampaniya yadda saxlanmadı.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCampaign(id) {
    const ok = confirm("Bu kampaniya silinsin?");
    if (!ok) return;

    try {
      setSaving(true);
      await adminCampaignsApi.delete(id);
      await loadCampaigns();

      if (editingId === id) resetForm();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppLoader text="Kampaniyalar yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Yadda saxlanılır" />}

      <div className="mb-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
          Homepage banner
        </p>

        <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
          Kampaniyalar
        </h1>

        <p className="mt-1 text-sm font-medium text-zinc-500">
          Ana səhifədə görünən banner və kampaniya slayderlərini idarə edin.
        </p>
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

      <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                {editingId ? "Kampaniyanı yenilə" : "Yeni kampaniya"}
              </h2>

              <p className="text-sm font-medium text-zinc-500">
                Başlıq, şəkil, link və tarix aralığı yazın.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-800"
              >
                <FiX />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AdminInput
              label="Başlıq"
              placeholder="Məsələn: Summer Sale"
              value={form.title}
              onChange={(v) => updateForm("title", v)}
            />

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">
                Açıqlama
              </span>

              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Məsələn: 50% endirim kampaniyası başladı."
                rows={4}
                className="w-full resize-none rounded-[18px] border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-zinc-400"
              />
            </label>

            <AdminInput
              label="Yönləndirmə linki"
              placeholder="Məsələn: /products və ya /"
              value={form.redirectUrl}
              onChange={(v) => updateForm("redirectUrl", v)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
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

            <Toggle
              label="Aktiv kampaniyadır"
              checked={form.isActive}
              onClick={() => updateForm("isActive", !form.isActive)}
            />

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-800">
                Banner şəkli
              </span>

              <div className="flex cursor-pointer items-center justify-center gap-3 rounded-[18px] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm font-extrabold text-zinc-600 transition hover:bg-zinc-100">
                <FiUploadCloud className="text-[22px]" />
                {form.file ? form.file.name : "Şəkil seç"}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {form.previewUrl && (
              <div className="overflow-hidden rounded-[22px] border border-zinc-100 bg-zinc-50">
                <img
                  src={form.previewUrl}
                  alt="Campaign preview"
                  className="h-44 w-full object-cover"
                />
              </div>
            )}

            <button
              disabled={saving}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
            >
              {editingId ? <FiSave /> : <FiPlus />}
              {editingId ? "Yenilə" : "Kampaniya yarat"}
            </button>
          </form>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">
              Kampaniya siyahısı
            </h2>

            <p className="text-sm font-medium text-zinc-500">
              Aktiv olanlar homepage banner hissəsində görünəcək.
            </p>
          </div>

          {campaigns.length === 0 ? (
            <div className="rounded-[24px] bg-zinc-50 p-8 text-center text-sm font-bold text-zinc-400">
              Hələ kampaniya yoxdur.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {campaigns.map((campaign) => (
                <article
                  key={campaign.id}
                  className="overflow-hidden rounded-[26px] border border-zinc-100 bg-zinc-50"
                >
                  <div className="relative h-48 bg-zinc-100">
                    {campaign.imageUrl ? (
                      <img
                        src={campaign.imageUrl}
                        alt={campaign.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-sm font-bold text-zinc-300">
                        Banner yoxdur
                      </div>
                    )}

                    <span
                      className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold ${
                        campaign.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {campaign.isActive ? "Aktiv" : "Passiv"}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="line-clamp-1 text-lg font-extrabold text-zinc-950">
                      {campaign.title}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-zinc-500">
                      {campaign.description || "Açıqlama yoxdur"}
                    </p>

                    <div className="mt-3 rounded-[18px] bg-white p-3 text-xs font-bold text-zinc-500">
                      <p>Link: {campaign.redirectUrl || "/"}</p>
                      <p className="mt-1">
                        Tarix: {String(campaign.startDate || "").slice(0, 10)} —{" "}
                        {String(campaign.endDate || "").slice(0, 10)}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(campaign)}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[16px] bg-white text-sm font-extrabold text-zinc-800"
                      >
                        <FiEdit3 />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteCampaign(campaign.id)}
                        className="grid h-11 w-11 place-items-center rounded-[16px] bg-red-50 text-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
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

function Toggle({ label, checked, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-13 w-full items-center justify-between rounded-[16px] border px-4 text-sm font-extrabold transition ${
        checked
          ? "border-[#244989] bg-[#244989]/8 text-[#244989]"
          : "border-zinc-100 bg-zinc-50 text-zinc-700"
      }`}
    >
      {label}

      <span
        className={`h-5 w-5 rounded-full border transition ${
          checked ? "border-[#244989] bg-[#244989]" : "border-zinc-300 bg-white"
        }`}
      />
    </button>
  );
}