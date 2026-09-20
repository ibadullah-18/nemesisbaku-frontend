import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiActivity, FiArrowUpRight, FiBox, FiEye, FiPackage,
  FiRefreshCw, FiShoppingBag, FiTrendingUp, FiUsers,
} from "react-icons/fi";
import { adminDashboardApi, adminProductsApi, unwrapAdmin, listAdmin } from "../../api/admin/adminApi";
import { getPanelBasePath } from "../../api/admin/adminAuth";
import "./adminDashboard.css";

const ORDER_STATES = [
  { label: "Yeni sifariş", key: "pendingOrders" },
  { label: "Qəbul olundu", key: "confirmedOrders" },
  { label: "Hazırlanır", key: "preparingOrders" },
  { label: "Çatdırılmada", key: "onDeliveryOrders" },
  { label: "Çatdırıldı", key: "deliveredOrders" },
  { label: "Ləğv / rədd", key: "cancelledOrders" },
];

const number = (value) => new Intl.NumberFormat("az-AZ").format(Number(value) || 0);
const money = (value) => new Intl.NumberFormat("az-AZ", {
  style: "currency", currency: "AZN",
}).format(Number(value) || 0);

export default function AdminDashboard() {
  const basePath = getPanelBasePath();
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [stockError, setStockError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const requestRunning = useRef(false);
  const mounted = useRef(true);

  const loadDashboard = useCallback(async (initial = false) => {
    if (requestRunning.current) return;
    requestRunning.current = true;
    if (!initial) setRefreshing(true);
    setError("");
    try {
      const [statsResult, stockResult] = await Promise.allSettled([
        adminDashboardApi.getStats(), adminProductsApi.lowStock(2),
      ]);
      if (!mounted.current) return;
      if (statsResult.status === "rejected") throw statsResult.reason;
      setStats(unwrapAdmin(statsResult.value));
      setLowStock(stockResult.status === "fulfilled" ? listAdmin(stockResult.value) : []);
      setStockError(stockResult.status === "rejected");
    } catch (err) {
      if (mounted.current) setError(err?.message || "Göstəricilər yüklənmədi.");
    } finally {
      requestRunning.current = false;
      if (mounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const timer = window.setTimeout(() => loadDashboard(true), 0);
    return () => { mounted.current = false; window.clearTimeout(timer); };
  }, [loadDashboard]);

  const statCards = [
    { label: "Sifarişlər", value: stats?.totalOrders, icon: FiShoppingBag, to: "orders" },
    { label: "Çatdırılmış satış", value: money(stats?.totalRevenue), icon: FiTrendingUp },
    { label: "Aktiv məhsullar", value: stats?.activeProducts, icon: FiPackage, to: "products" },
    { label: "İstifadəçilər", value: stats?.totalUsers, icon: FiUsers, to: "users" },
  ];
  const knownOrders = ["pendingOrders", "confirmedOrders", "onDeliveryOrders", "deliveredOrders", "cancelledOrders"]
    .reduce((sum, key) => sum + (Number(stats?.[key]) || 0), 0);
  const orderCounts = {
    ...stats,
    preparingOrders: Math.max(0, (Number(stats?.totalOrders) || 0) - knownOrders),
  };
  const maxState = Math.max(1, ...ORDER_STATES.map(({ key }) => Number(orderCounts[key]) || 0));

  return (
    <div className="nb-dashboard">
      <div className="nb-dashboard__heading">
        <div>
          <p className="nb-dashboard__eyebrow">nemesisbaku / SuperAdmin</p>
          <h1>İdarəetmə</h1>
          <p className="nb-dashboard__subtitle">Mağazanın ümumi göstəriciləri</p>
        </div>
        <button type="button" className="nb-dashboard__refresh"
          disabled={loading || refreshing} onClick={() => loadDashboard()}>
          <FiRefreshCw className={refreshing ? "is-spinning" : ""} aria-hidden="true" />
          {refreshing ? "Yenilənir..." : "Yenilə"}
        </button>
      </div>

      {error && <div className="nb-dashboard__error" role="alert">{error}{" "}
        <button type="button" onClick={() => loadDashboard()}>Yenidən yoxla</button>
      </div>}

      {loading && !stats ? (
        <div className="nb-dashboard__loading" role="status">Göstəricilər yüklənir...</div>
      ) : stats ? (
        <>
          <div className="nb-dashboard__stats">
            {statCards.map(({ label, value, icon: Icon, to }, index) => {
              const content = (
                <>
                  <div className="nb-dashboard__stat-head"><Icon aria-hidden="true" />
                    {to && <FiArrowUpRight aria-hidden="true" />}</div>
                  <div><p>{label}</p><strong>{typeof value === "number" ? number(value) : value}</strong></div>
                  <small>{index === 1 ? "Yalnız çatdırılmış sifarişlər" : "Ümumi göstərici"}</small>
                </>
              );
              return to ? <NavLink key={label} className="nb-dashboard__stat" to={basePath + "/" + to}>{content}</NavLink>
                : <div key={label} className="nb-dashboard__stat">{content}</div>;
            })}
          </div>

          <div className="nb-dashboard__columns">
            <section className="nb-dashboard__panel" aria-labelledby="order-states-title">
              <div className="nb-dashboard__panel-head">
                <div><p className="nb-dashboard__panel-kicker">SİFARİŞLƏR</p>
                  <h2 id="order-states-title">Statuslara baxış</h2></div>
                <NavLink to={basePath + "/orders"}>Hamısına bax <FiArrowUpRight aria-hidden="true" /></NavLink>
              </div>
              <div className="nb-dashboard__bars">
                {ORDER_STATES.map(({ key, label }) => {
                  const count = Number(orderCounts[key]) || 0;
                  return <div className="nb-dashboard__bar-row" key={key}>
                    <div><span>{label}</span><strong>{number(count)}</strong></div>
                    <div className="nb-dashboard__track" aria-label={label + ": " + count}>
                      <span style={{ width: (count / maxState * 100) + "%" }} />
                    </div>
                  </div>;
                })}
              </div>
            </section>

            <section className="nb-dashboard__panel" aria-labelledby="stock-title">
              <div className="nb-dashboard__panel-head">
                <div><p className="nb-dashboard__panel-kicker">MƏHSULLAR</p>
                  <h2 id="stock-title">Stok nəzarəti</h2></div>
                <FiBox aria-hidden="true" />
              </div>
              <div className="nb-dashboard__stock-total">
                <strong>{number(stats.lowStockProducts)}</strong>
                <span>az stoklu məhsul</span>
              </div>
              {stockError ? <p className="nb-dashboard__stock-note">Stok siyahısı yüklənmədi. Yeniləyib təkrar yoxla.</p>
                : lowStock.length ? <div className="nb-dashboard__stock-list">
                  {lowStock.slice(0, 5).map((item, index) => (
                    <div key={item.variantId || index}>
                      <span>{item.productName || item.name || "Məhsul"}</span>
                      <strong>{number(item.stockCount ?? item.stock)} ədəd</strong>
                    </div>
                  ))}
                </div> : <p className="nb-dashboard__stock-note">2 və daha az stok qalan aktiv variant yoxdur.</p>}
              <NavLink className="nb-dashboard__stock-link" to={basePath + "/products"}>Məhsullara keç <FiArrowUpRight aria-hidden="true" /></NavLink>
            </section>
          </div>

          <section className="nb-dashboard__traffic" aria-label="Mağaza fəaliyyəti">
            <div><FiEye aria-hidden="true" /><span>Səhifə baxışı</span><strong>{number(stats.totalPageViews)}</strong></div>
            <div><FiUsers aria-hidden="true" /><span>Unikal ziyarətçi</span><strong>{number(stats.uniqueVisitors)}</strong></div>
            <div><FiActivity aria-hidden="true" /><span>WhatsApp klikləri</span><strong>{number(stats.totalWhatsAppClicks)}</strong></div>
          </section>
        </>
      ) : null}
    </div>
  );
}
