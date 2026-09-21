import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiArrowUpRight, FiChevronLeft, FiChevronRight, FiRefreshCw,
  FiSearch, FiShoppingBag, FiX,
} from "react-icons/fi";
import { adminOrdersApi, listAdmin, metaAdmin } from "../../api/admin/adminApi";
import { getPanelBasePath } from "../../api/admin/adminAuth";
import { useAdminToastState } from "../../utils/adminToast";
import {
  ORDER_STATUSES, formatOrderDate, getOrderStatus,
  orderDeliveryType, orderMoney,
} from "./adminOrderUtils";
import "./adminOrders.css";

const PAGE_SIZE = 20;

export default function AdminOrders() {
  const basePath = getPanelBasePath();
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalCount: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useAdminToastState("error");

  useEffect(() => {
    let active = true;
    adminOrdersApi.list({ page, pageSize: PAGE_SIZE, search: appliedSearch, status })
      .then((response) => {
        if (!active) return;
        setOrders(listAdmin(response));
        setMeta(metaAdmin(response));
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setOrders([]);
        setMeta({ page, totalCount: 0, totalPages: 0 });
        setError(err?.message || "Sifarişlər yüklənmədi.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
    // The request is driven only by applied filters, page, and refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, appliedSearch, status, refresh]);

  function chooseStatus(nextStatus) {
    if (status === nextStatus) return;
    setLoading(true);
    setPage(1);
    setStatus(nextStatus);
  }

  function applySearch(event) {
    event.preventDefault();
    setLoading(true);
    setPage(1);
    setAppliedSearch(search.trim());
    if (search.trim() === appliedSearch && page === 1) setRefresh((x) => x + 1);
  }

  function changePage(nextPage) {
    setLoading(true);
    setPage(nextPage);
  }

  const currentStatus = status ? getOrderStatus(status).label : "Bütün sifarişlər";
  const pageCount = meta.totalPages || 1;

  return (
    <div className="nb-orders nb-orders-list">
      <div className="nb-orders__heading">
        <div>
          <p className="nb-orders__eyebrow">nemesisbaku / sifarişlər</p>
          <h1>Sifarişlər</h1>
          <p>Gələn sifarişləri izləyin və idarə edin.</p>
        </div>
        <button type="button" className="nb-orders__refresh" disabled={loading}
          onClick={() => { setLoading(true); setRefresh((x) => x + 1); }}>
          <FiRefreshCw aria-hidden="true" /> Yenilə
        </button>
      </div>

      <div className="nb-orders__overview" aria-live="polite">
        <div className="nb-orders__overview-main">
          <span><FiShoppingBag aria-hidden="true" /> {currentStatus}</span>
          <strong>{loading ? "…" : meta.totalCount}</strong>
          <small>{appliedSearch ? `“${appliedSearch}” üzrə nəticə` : "Seçilmiş filtr üzrə sifariş"}</small>
        </div>
        <div><span>Bu səhifədə</span><strong>{loading ? "…" : orders.length}</strong><small>sifariş</small></div>
        <div><span>Səhifə</span><strong>{meta.page} / {pageCount}</strong><small>hər səhifədə {PAGE_SIZE} sifariş</small></div>
      </div>

      <form className="nb-orders__filters" onSubmit={applySearch} role="search">
        <div className="nb-orders__search">
          <FiSearch aria-hidden="true" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Nömrə, müştəri və ya telefon" aria-label="Sifariş axtarışı" />
          {search && <button type="button" aria-label="Axtarışı təmizlə"
            onClick={() => { setSearch(""); setAppliedSearch(""); setPage(1); setLoading(true); if (!appliedSearch && page === 1) setRefresh((x) => x + 1); }}><FiX /></button>}
        </div>
        <button type="submit" className="nb-orders__search-button">Axtar</button>
      </form>

      <div className="nb-orders__tabs" aria-label="Sifariş statusları">
        {[{ value: "", label: "Hamısı" }, ...ORDER_STATUSES].map((option) => (
          <button key={option.value} type="button" aria-pressed={status === String(option.value)}
            className={status === String(option.value) ? "is-active" : ""}
            onClick={() => chooseStatus(String(option.value))}>{option.label}</button>
        ))}
      </div>

      {error && <div className="nb-orders__error" role="alert">
        {error} <button type="button" onClick={() => { setLoading(true); setRefresh((x) => x + 1); }}>Yenidən yoxla</button>
      </div>}

      <section className="nb-orders__list" aria-label="Sifariş siyahısı" aria-busy={loading}>
        <div className="nb-orders__table-scroll">
          <table className="nb-orders__table">
            <thead><tr><th>Sifariş</th><th>Müştəri</th><th>Çatdırılma</th><th>Məbləğ</th><th>Status</th><th><span className="sr-only">Detallar</span></th></tr></thead>
            <tbody>
              {!loading && orders.map((order) => {
                const state = getOrderStatus(order.status);
                return <tr key={order.id}>
                  <td><NavLink className="nb-orders__order-link" to={`${basePath}/orders/${order.id}`}>
                    {order.orderNumber || "Sifariş"}<small>{formatOrderDate(order.createdAt)}</small>
                  </NavLink></td>
                  <td><span className="nb-orders__customer">{order.customerFullName || "—"}</span><small>{order.customerPhoneNumber || "—"}</small></td>
                  <td>{orderDeliveryType(order.deliveryType)}</td>
                  <td className="nb-orders__amount">{orderMoney(order.totalPrice)}</td>
                  <td><span className={`nb-orders__badge nb-orders__badge--${state.tone}`}>{state.label}</span></td>
                  <td><NavLink className="nb-orders__open" to={`${basePath}/orders/${order.id}`} aria-label={`${order.orderNumber || "Sifariş"} detallarına bax`}><FiArrowUpRight aria-hidden="true" /></NavLink></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        {loading && <div className="nb-orders__message" role="status">Sifarişlər yüklənir...</div>}
        {!loading && !error && orders.length === 0 && <div className="nb-orders__message">
          <FiShoppingBag aria-hidden="true" /><strong>Sifariş tapılmadı</strong><span>Filtri və ya axtarış sözünü dəyişin.</span>
        </div>}
        <div className="nb-orders__pagination">
          <span>{loading ? "Yüklənir..." : `${meta.totalCount} sifariş · Səhifə ${meta.page} / ${pageCount}`}</span>
          <div>
            <button type="button" disabled={loading || page <= 1} onClick={() => changePage(page - 1)}><FiChevronLeft aria-hidden="true" /> Əvvəlki</button>
            <button type="button" disabled={loading || page >= pageCount} onClick={() => changePage(page + 1)}>Növbəti <FiChevronRight aria-hidden="true" /></button>
          </div>
        </div>
      </section>
    </div>
  );
}
