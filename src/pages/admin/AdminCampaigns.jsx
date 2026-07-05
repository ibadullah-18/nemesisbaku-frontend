import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  FiEdit3,
  FiImage,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";
import { adminPromoPagesApi } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

function unwrapData(res) {
  return res?.data?.data ?? res?.data ?? res;
}

function listOf(res) {
  const data = unwrapData(res);
  return data?.items || data?.list || data?.result || (Array.isArray(data) ? data : []);
}

function promoTypeText(type) {
  return Number(type) === 2 ? "Banner" : "Campaign";
}

function promoTypeClass(type) {
  return Number(type) === 2
    ? "bg-orange-50 text-orange-700"
    : "bg-[#eef3ff] text-[#244989]";
}

export default function AdminCampaigns() {
  const [promos, setPromos] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const location = useLocation();

  const basePath = location.pathname.startsWith("/Admin")
    ? "/Admin"
    : "/SuperAdmin";

  useEffect(() => {
    loadPromos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  async function loadPromos() {
    try {
      setLoading(true);
      setError("");

      const res = await adminPromoPagesApi.list(filterType || undefined);
      setPromos(listOf(res));
    } catch (err) {
      setError(err.message || "Promo səhifələr yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  async function deletePromo(promo) {
    const ok = confirm(`${promo.title || "Bu promo"} silinsin?`);
    if (!ok) return;

    try {
      setSaving(true);
      await adminPromoPagesApi.delete(promo.id);
      await loadPromos();
    } catch (err) {
      setError(err.message || "Promo silinmədi.");
    } finally {
      setSaving(false);
    }
  }

  const counters = useMemo(() => {
    return {
      total: promos.length,
      campaigns: promos.filter((x) => Number(x.type) === 1).length,
      banners: promos.filter((x) => Number(x.type) === 2).length,
      active: promos.filter((x) => x.isActive).length,
    };
  }, [promos]);

  if (loading) return <AppLoader text="Promolar yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {saving && <AppLoader text="Əməliyyat icra olunur" />}

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Promo pages
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            Kampaniya və Bannerlər
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Homepage-də görünən campaign və banner slotlarını idarə edin.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <NavLink
            to={`${basePath}/campaigns/create`}
            className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#244989] px-5 text-sm font-extrabold text-white transition active:scale-[0.97]"
          >
            <FiPlus />
            Promo yarat
          </NavLink>

          <button
            type="button"
            onClick={loadPromos}
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
        <CounterCard label="Campaign" value={counters.campaigns} />
        <CounterCard label="Banner" value={counters.banners} />
        <CounterCard label="Aktiv" value={counters.active} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2 rounded-[22px] bg-white p-2 shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
        <FilterButton active={filterType === ""} onClick={() => setFilterType("")}>
          Hamısı
        </FilterButton>

        <FilterButton active={filterType === "1"} onClick={() => setFilterType("1")}>
          Campaign
        </FilterButton>

        <FilterButton active={filterType === "2"} onClick={() => setFilterType("2")}>
          Banner
        </FilterButton>
      </div>

      {promos.length === 0 ? (
        <div className="rounded-[28px] bg-white p-10 text-center shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
          <FiImage className="mx-auto text-[42px] text-zinc-300" />
          <p className="mt-3 text-sm font-extrabold text-zinc-400">
            Hələ promo yoxdur.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {promos.map((promo) => (
            <article
              key={promo.id}
              className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.04)]"
            >
              <div className="relative h-52 bg-zinc-50">
                {promo.imageUrl ? (
                  <img
                    src={promo.imageUrl}
                    alt={promo.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-zinc-300">
                    <FiImage className="text-[36px]" />
                  </div>
                )}

                <div className="absolute left-3 top-3 flex gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${promoTypeClass(
                      promo.type
                    )}`}
                  >
                    {promoTypeText(promo.type)}
                  </span>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-zinc-700">
                    Slot {promo.slotNumber || "—"}
                  </span>
                </div>

                <span
                  className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold ${
                    promo.isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {promo.isActive ? "Aktiv" : "Passiv"}
                </span>
              </div>

              <div className="p-5">
                <h3 className="line-clamp-1 text-lg font-extrabold text-zinc-950">
                  {promo.title}
                </h3>

                <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-zinc-500">
                  {promo.description || "Açıqlama yoxdur"}
                </p>

                <div className="mt-4 rounded-[20px] bg-zinc-50 p-3 text-xs font-bold text-zinc-500">
                  <p>Slug: {promo.slug || "—"}</p>
                  <p className="mt-1">
                    Tarix: {String(promo.startDate || "").slice(0, 10)} —{" "}
                    {String(promo.endDate || "").slice(0, 10)}
                  </p>
                  <p className="mt-1">
                    Məhsul sayı: {(promo.productIds || []).length}
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  <NavLink
                    to={`${basePath}/campaigns/${promo.id}`}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[16px] bg-white text-sm font-extrabold text-zinc-800 ring-1 ring-zinc-100 transition active:scale-[0.97]"
                  >
                    <FiEdit3 />
                    Edit
                  </NavLink>

                  <button
                    type="button"
                    onClick={() => deletePromo(promo)}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[16px] bg-red-50 text-sm font-extrabold text-red-600 transition active:scale-[0.97]"
                  >
                    <FiTrash2 />
                    Sil
                  </button>
                </div>
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

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 rounded-[15px] px-5 text-sm font-extrabold transition active:scale-[0.97] ${
        active ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-600"
      }`}
    >
      {children}
    </button>
  );
}