import { useEffect, useState } from "react";
import {
  FiBarChart2,
  FiEye,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { adminDashboardApi, adminProductsApi } from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

function getData(res) {
  return res?.data || res || {};
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      const [statsRes, lowStockRes] = await Promise.all([
        adminDashboardApi.getStats(),
        adminProductsApi.lowStock(2).catch(() => []),
      ]);

      setStats(getData(statsRes));
      setLowStock(Array.isArray(getData(lowStockRes)) ? getData(lowStockRes) : []);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <AppLoader text="Dashboard yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      <div className="mb-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
          NemesisBaku
        </p>
        <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em] md:text-[46px]">
          Dashboard
        </h1>
        <p className="mt-2 text-sm font-medium text-zinc-500">
          Satış, sifariş, istifadəçi və stok vəziyyətini buradan izləyin.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={<FiUsers />} label="İstifadəçilər" value={stats?.totalUsers} />
        <StatCard icon={<FiShoppingBag />} label="Sifarişlər" value={stats?.totalOrders} />
        <StatCard icon={<FiTrendingUp />} label="Gəlir" value={`${stats?.totalRevenue || 0} ₼`} />
        <StatCard icon={<FiEye />} label="Unique visitor" value={stats?.uniqueVisitors} />
        <StatCard icon={<FiBarChart2 />} label="WhatsApp klik" value={stats?.totalWhatsAppClicks} />
      </div>

      <div className="mt-8 rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">
              Stoku azalan məhsullar
            </h2>
            <p className="text-sm font-medium text-zinc-500">
              2 və daha az stok qalan variantlar.
            </p>
          </div>
        </div>

        {lowStock.length === 0 ? (
          <div className="rounded-[20px] bg-zinc-50 p-5 text-sm font-bold text-zinc-500">
            Hazırda kritik stok yoxdur.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-[0.14em] text-zinc-400">
                  <th className="py-3">Məhsul</th>
                  <th className="py-3">Ölçü</th>
                  <th className="py-3">Rəng</th>
                  <th className="py-3">Stok</th>
                </tr>
              </thead>

              <tbody>
                {lowStock.map((item, index) => (
                  <tr key={index} className="border-b border-zinc-50 text-sm font-bold">
                    <td className="py-4">{item.productName}</td>
                    <td className="py-4">{item.sizeValue}</td>
                    <td className="py-4">{item.colorName}</td>
                    <td className="py-4 text-red-600">{item.stockCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-[26px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-[18px] bg-[#244989]/8 text-[22px] text-[#244989]">
        {icon}
      </div>

      <p className="text-sm font-bold text-zinc-400">{label}</p>
      <h3 className="mt-1 text-[28px] font-extrabold tracking-[-0.04em]">
        {value ?? 0}
      </h3>
    </div>
  );
}