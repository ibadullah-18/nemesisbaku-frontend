import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
  FiTruck,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import {
  adminDashboardApi,
  adminProductsApi,
  unwrapAdmin,
  listAdmin,
} from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

function money(value) {
  return `${Number(value || 0).toFixed(2)} ₼`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setRefreshing(true);

      const [statsRes, lowStockRes] = await Promise.all([
        adminDashboardApi.getStats(),
        adminProductsApi.lowStock(2).catch(() => null),
      ]);

      setStats(unwrapAdmin(statsRes));
      setLowStock(listAdmin(lowStockRes));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const orderCards = useMemo(
    () => [
      {
        label: "Yeni sifariş",
        value: stats?.pendingOrders,
        icon: <FiClock />,
        tone: "bg-orange-50 text-orange-600",
      },
      {
        label: "Qəbul olundu",
        value: stats?.confirmedOrders,
        icon: <FiCheckCircle />,
        tone: "bg-blue-50 text-[#244989]",
      },
      {
        label: "Hazırlanır / çatdırılır",
        value:
          Number(stats?.preparingOrders || 0) +
          Number(stats?.onDeliveryOrders || 0),
        icon: <FiTruck />,
        tone: "bg-purple-50 text-purple-600",
      },
      {
        label: "Tamamlandı",
        value: stats?.deliveredOrders,
        icon: <FiCheckCircle />,
        tone: "bg-green-50 text-green-700",
      },
      {
        label: "Ləğv edildi",
        value: stats?.cancelledOrders,
        icon: <FiXCircle />,
        tone: "bg-red-50 text-red-600",
      },
    ],
    [stats]
  );

  if (loading) return <AppLoader text="Dashboard yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {refreshing && <AppLoader text="Məlumat yenilənir" />}

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            NemesisBaku idarəetmə
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em] md:text-[46px]">
            Dashboard
          </h1>

          <p className="mt-2 text-sm font-medium text-zinc-500">
            Satış, sifariş, istifadəçi, stok və ziyarət göstəriciləri.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#244989] px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <FiRefreshCw />
          Yenilə
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={<FiUsers />} label="Ümumi istifadəçi" value={stats?.totalUsers} />
        <StatCard icon={<FiShoppingBag />} label="Ümumi sifariş" value={stats?.totalOrders} />
        <StatCard icon={<FiBarChart2 />} label="Ümumi gəlir" value={money(stats?.totalRevenue)} />
        <StatCard icon={<FiPackage />} label="Aktiv məhsul" value={stats?.activeProducts} />
        <StatCard icon={<FiAlertTriangle />} label="Az stok" value={stats?.lowStockProducts} danger />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <InfoCard icon={<FiEye />} title="Səhifə baxışı" value={stats?.totalPageViews} />
        <InfoCard icon={<FiActivity />} title="Unikal ziyarətçi" value={stats?.uniqueVisitors} />
        <InfoCard icon={<FiBarChart2 />} title="WhatsApp klikləri" value={stats?.totalWhatsAppClicks} />
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <h2 className="text-xl font-extrabold tracking-[-0.03em]">
            Sifariş statusları
          </h2>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Admin sifarişləri bu statuslara görə idarə edəcək.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {orderCards.map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-4 transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_40px_rgba(0,0,0,0.05)] active:scale-[0.98]"
              >
                <div className={`mb-4 grid h-11 w-11 place-items-center rounded-[16px] text-xl ${item.tone}`}>
                  {item.icon}
                </div>

                <p className="text-sm font-bold text-zinc-500">{item.label}</p>
                <h3 className="mt-1 text-[30px] font-extrabold tracking-[-0.04em]">
                  {item.value ?? 0}
                </h3>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
          <h2 className="text-xl font-extrabold tracking-[-0.03em]">
            Stoku azalan məhsullar
          </h2>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            2 və daha az stok qalan variantlar.
          </p>

          <div className="mt-5 space-y-3">
            {lowStock.length === 0 ? (
              <div className="rounded-[20px] bg-green-50 p-5 text-sm font-extrabold text-green-700">
                Hazırda kritik stok yoxdur.
              </div>
            ) : (
              lowStock.slice(0, 8).map((item, index) => (
                <div
                  key={item.id || index}
                  className="rounded-[20px] border border-zinc-100 bg-zinc-50 p-4"
                >
                  <p className="font-extrabold text-zinc-950">
                    {item.productName || item.name || "Məhsul adı gəlmədi"}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-extrabold">
                    <span className="rounded-full bg-white px-3 py-1 text-zinc-600">
                      Ölçü: {item.sizeValue || item.size || "—"}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-zinc-600">
                      Rəng: {item.colorName || item.color || "—"}
                    </span>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-red-600">
                      Stok: {item.stockCount ?? item.stock ?? 0}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, danger = false }) {
  return (
    <div className="rounded-[26px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] transition hover:-translate-y-1 active:scale-[0.98]">
      <div
        className={`mb-5 grid h-12 w-12 place-items-center rounded-[18px] text-[22px] ${
          danger ? "bg-red-50 text-red-600" : "bg-[#244989]/8 text-[#244989]"
        }`}
      >
        {icon}
      </div>

      <p className="text-sm font-bold text-zinc-400">{label}</p>
      <h3 className="mt-1 text-[28px] font-extrabold tracking-[-0.04em]">
        {value ?? 0}
      </h3>
    </div>
  );
}

function InfoCard({ icon, title, value }) {
  return (
    <div className="flex items-center gap-4 rounded-[24px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] transition hover:-translate-y-1 active:scale-[0.98]">
      <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-zinc-50 text-xl text-zinc-700">
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold text-zinc-400">{title}</p>
        <h3 className="text-[26px] font-extrabold tracking-[-0.04em]">
          {value ?? 0}
        </h3>
      </div>
    </div>
  );
}