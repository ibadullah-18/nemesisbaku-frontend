import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiEdit3,
  FiGrid,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";
import { adminHomeSectionsApi } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

function unwrapData(res) {
  return res?.data?.data ?? res?.data ?? res;
}

function listOf(res) {
  const data = unwrapData(res);
  return data?.items || data?.list || data?.result || (Array.isArray(data) ? data : []);
}

export default function AdminHomeSections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSections();
  }, []);

  async function loadSections() {
    try {
      setLoading(true);
      setError("");

      const res = await adminHomeSectionsApi.list();
      setSections(listOf(res));
    } catch (err) {
      setError(err.message || "Home section-lar yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSection(section) {
    const ok = confirm(`${section.title || "Bu section"} silinsin?`);
    if (!ok) return;

    try {
      setSaving(true);
      setError("");

      await adminHomeSectionsApi.delete(section.id);
      await loadSections();
    } catch (err) {
      setError(err.message || "Section silinmədi.");
    } finally {
      setSaving(false);
    }
  }

  const counters = useMemo(() => {
    return {
      total: sections.length,
      active: sections.filter((x) => x.isActive).length,
      passive: sections.filter((x) => !x.isActive).length,
      products: sections.reduce(
        (sum, section) => sum + Number((section.productIds || []).length),
        0
      ),
    };
  }, [sections]);

  if (loading) return <AppLoader text="Home section-lar yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Əməliyyat icra olunur" />}

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Homepage containers
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            Home Sections
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Homepage məhsul konteynerlərini admin paneldən idarə et.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <NavLink
            to="/SuperAdmin/home-sections/create"
            className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#244989] px-5 text-sm font-extrabold text-white transition active:scale-[0.97]"
          >
            <FiPlus />
            Section yarat
          </NavLink>

          <button
            type="button"
            onClick={loadSections}
            className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-zinc-950 px-5 text-sm font-extrabold text-white transition active:scale-[0.97]"
          >
            <FiRefreshCw />
            Yenilə
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CounterCard label="Hamısı" value={counters.total} />
        <CounterCard label="Aktiv" value={counters.active} />
        <CounterCard label="Passiv" value={counters.passive} />
        <CounterCard label="Məhsul bağlantısı" value={counters.products} />
      </div>

      {sections.length === 0 ? (
        <div className="rounded-[28px] bg-white p-10 text-center shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
          <FiGrid className="mx-auto text-[42px] text-zinc-300" />

          <p className="mt-3 text-sm font-extrabold text-zinc-400">
            Hələ section yoxdur.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sections
            .slice()
            .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
            .map((section) => (
              <article
                key={section.id}
                className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)]"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                        section.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {section.isActive ? "Aktiv" : "Passiv"}
                    </span>

                    <h3 className="mt-3 line-clamp-1 text-xl font-extrabold tracking-[-0.03em] text-zinc-950">
                      {section.title || "Adsız section"}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-zinc-500">
                      {section.subtitle || "Alt başlıq yoxdur"}
                    </p>
                  </div>

                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-zinc-50 text-lg font-extrabold text-zinc-700">
                    {section.displayOrder || 0}
                  </div>
                </div>

                <div className="rounded-[20px] bg-zinc-50 p-4 text-xs font-bold text-zinc-500">
                  <p>
                    Tarix: {String(section.startDate || "").slice(0, 10) || "—"} —{" "}
                    {String(section.endDate || "").slice(0, 10) || "—"}
                  </p>

                  <p className="mt-1">
                    Məhsul sayı: {(section.productIds || []).length}
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  <NavLink
                    to={`/SuperAdmin/home-sections/${section.id}`}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[16px] bg-white text-sm font-extrabold text-zinc-800 ring-1 ring-zinc-100 transition active:scale-[0.97]"
                  >
                    <FiEdit3 />
                    Edit
                  </NavLink>

                  <button
                    type="button"
                    onClick={() => deleteSection(section)}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[16px] bg-red-50 text-sm font-extrabold text-red-600 transition active:scale-[0.97]"
                  >
                    <FiTrash2 />
                    Sil
                  </button>
                </div>
              </article>
            ))}
        </div>
      )}
    </div>
  );
}

function CounterCard({ label, value }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-extrabold tracking-[-0.05em]">
        {value}
      </p>
    </div>
  );
}