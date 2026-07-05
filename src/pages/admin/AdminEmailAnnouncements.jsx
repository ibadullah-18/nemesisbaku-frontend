import { useEffect, useMemo, useState } from "react";
import {
  FiClock,
  FiExternalLink,
  FiMail,
  FiRefreshCw,
  FiSend,
  FiUsers,
} from "react-icons/fi";
import {
  adminEmailAnnouncementsApi,
  listAdmin,
} from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

const emptyForm = {
  title: "",
  description: "",
  buttonText: "",
  buttonUrl: "",
};

function formatDate(value) {
  if (!value) return "—";
  return String(value).replace("T", " ").slice(0, 16);
}

function getId(item, index) {
  return item?.id || item?.announcementId || index;
}

export default function AdminEmailAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      setError("");
      setLoading(true);

      const res = await adminEmailAnnouncementsApi.list();
      setAnnouncements(listAdmin(res));
    } catch (err) {
      setError(err.message || "Email elan tarixçəsi yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function sendAnnouncement(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim()) return setError("Başlıq yazılmalıdır.");
    if (!form.description.trim()) return setError("Açıqlama yazılmalıdır.");
    if (!form.buttonText.trim()) return setError("Button yazısı yazılmalıdır.");
    if (!form.buttonUrl.trim()) return setError("Button linki yazılmalıdır.");

    try {
      setSending(true);

      await adminEmailAnnouncementsApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        buttonText: form.buttonText.trim(),
        buttonUrl: form.buttonUrl.trim(),
      });

      setForm(emptyForm);
      setSuccess("Email elan bütün aktiv istifadəçilərə göndərildi.");
      await loadAnnouncements();
    } catch (err) {
      setError(err.message || "Email elan göndərilmədi.");
    } finally {
      setSending(false);
    }
  }

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return announcements;

    return announcements.filter((item) =>
      `${item.title || ""} ${item.description || ""}`
        .toLowerCase()
        .includes(text)
    );
  }, [announcements, search]);

  if (loading) return <AppLoader text="Email elanlar yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {sending && <AppLoader text="Email göndərilir" />}

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Email announcement
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            Email elanlar
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Bütün aktiv istifadəçilərə logo, banner, button və sosial linklərlə
            email göndərin.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAnnouncements}
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

      <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-[#244989]/8 text-[#244989]">
              <FiSend />
            </div>

            <div>
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                Yeni email elan
              </h2>

              <p className="text-sm font-medium text-zinc-500">
                Aktiv istifadəçilərə göndəriləcək.
              </p>
            </div>
          </div>

          <form onSubmit={sendAnnouncement} className="space-y-4">
            <AdminInput
              label="Başlıq"
              placeholder="Yeni kolleksiya artıq satışdadır"
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
                placeholder="Müştərilərə göndəriləcək email açıqlaması..."
                rows={6}
                className="w-full resize-none rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-zinc-400"
              />
            </label>

            <AdminInput
              label="Button yazısı"
              placeholder="Kolleksiyaya bax"
              value={form.buttonText}
              onChange={(v) => updateForm("buttonText", v)}
            />

            <AdminInput
              label="Button linki"
              placeholder="https://nemesisbaku.az/products"
              value={form.buttonUrl}
              onChange={(v) => updateForm("buttonUrl", v)}
            />

            <button className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]">
              <FiMail />
              Email göndər
            </button>
          </form>
        </section>

        <section className="space-y-5">
          <div className="rounded-[28px] bg-zinc-950 p-5 text-white">
            <div className="flex items-center gap-3">
              <FiUsers className="text-xl" />

              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                  Email dizaynında olanlar
                </h2>

                <p className="mt-1 text-sm font-semibold text-white/55">
                  Backend avtomatik email template daxilində bunları əlavə edir.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {[
                "Logo",
                "Banner",
                "Başlıq",
                "Açıqlama",
                "Button",
                "Instagram",
                "TikTok",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-extrabold text-white/80"
                >
                  ✅ {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                  Göndərilmiş elanlar
                </h2>

                <p className="text-sm font-medium text-zinc-500">
                  Cəmi {announcements.length} email elan.
                </p>
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tarixçədə axtar"
                className="h-12 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 text-sm font-bold outline-none md:w-[290px]"
              />
            </div>

            <div className="grid gap-3">
              {filtered.map((item, index) => (
                <article
                  key={getId(item, index)}
                  className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-4 transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_42px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-extrabold text-zinc-950">
                        {item.title || "Başlıq yoxdur"}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-zinc-500">
                        {item.description || "Açıqlama yoxdur"}
                      </p>
                    </div>

                    {item.buttonUrl && (
                      <a
                        href={item.buttonUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[#244989] px-4 text-xs font-extrabold text-white"
                      >
                        <FiExternalLink />
                        Link
                      </a>
                    )}
                  </div>

                  <div className="mt-4 grid gap-2 text-xs font-bold text-zinc-500 md:grid-cols-3">
                    <Info
                      icon={<FiClock />}
                      label="Göndərilmə tarixi"
                      value={formatDate(
                        item.createdAt || item.sentAt || item.createdDate
                      )}
                    />

                    <Info
                      icon={<FiUsers />}
                      label="Göndərilən istifadəçi"
                      value={
                        item.sentCount ||
                        item.userCount ||
                        item.activeUserCount ||
                        "—"
                      }
                    />

                    <Info
                      icon={<FiMail />}
                      label="Button"
                      value={item.buttonText || "—"}
                    />
                  </div>
                </article>
              ))}

              {filtered.length === 0 && (
                <div className="rounded-[22px] bg-zinc-50 p-8 text-center text-sm font-extrabold text-zinc-400">
                  Email elan tapılmadı.
                </div>
              )}
            </div>
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