import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { adminUsersApi, listAdmin, metaAdmin } from "../../api/admin/adminApi";
import { getPanelBasePath } from "../../api/admin/adminAuth";
import AppLoader from "../../components/common/AppLoader";
import { useAdminToastState } from "../../utils/adminToast";
import "./adminInsights.css";

const emptyAdmin = {
  fullName: "",
  phoneNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const roles = [
  { value: "", label: "Bütün rollar" },
  { value: "User", label: "Müştəri" },
  { value: "Admin", label: "Admin" },
  { value: "SuperAdmin", label: "SuperAdmin" },
];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).replace("T", " ").slice(0, 16);
  return date.toLocaleString("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function userRoles(user) {
  return Array.isArray(user?.roles) && user.roles.length ? user.roles : ["User"];
}

function phoneForApi(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("994")) return digits;
  return digits.length === 9 ? `994${digits}` : digits;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const basePath = getPanelBasePath();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [meta, setMeta] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [form, setForm] = useState(emptyAdmin);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [creating, setCreating] = useState(false);
  const [, setError] = useAdminToastState("error");
  const [, setSuccess] = useAdminToastState("success");

  async function loadUsers(page = 1, showNotice = false) {
    try {
      if (showNotice) setRefreshing(true);
      else setLoading(true);

      const response = await adminUsersApi.list({ page, pageSize: 20, search, role });
      setUsers(listAdmin(response));
      setMeta(metaAdmin(response));
      if (showNotice) setSuccess("İstifadəçi siyahısı yeniləndi.");
    } catch (error) {
      setError(error.message || "İstifadəçilər yüklənmədi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  async function toggleStatus(user) {
    const active = Boolean(user.isActive);
    const question = active
      ? "Bu istifadəçi deaktiv edilsin?"
      : "Bu istifadəçi aktiv edilsin?";
    if (!window.confirm(question)) return;

    try {
      setBusyId(user.id);
      if (active) await adminUsersApi.deactivate(user.id);
      else await adminUsersApi.activate(user.id);
      setSuccess(active ? "İstifadəçi deaktiv edildi." : "İstifadəçi aktiv edildi.");
      await loadUsers(meta.page);
    } catch (error) {
      setError(error.message || "İstifadəçi statusu dəyişdirilmədi.");
    } finally {
      setBusyId("");
    }
  }

  async function deleteUser(user) {
    if (!window.confirm(`${user.fullName || "Bu istifadəçi"} silinsin?`)) return;

    try {
      setBusyId(user.id);
      await adminUsersApi.delete(user.id);
      setSuccess("İstifadəçi silindi.");
      await loadUsers(meta.page);
    } catch (error) {
      setError(error.message || "İstifadəçi silinmədi.");
    } finally {
      setBusyId("");
    }
  }

  async function createAdmin(event) {
    event.preventDefault();
    if (!form.fullName.trim()) return setError("Admin adı yazılmalıdır.");
    if (!form.phoneNumber.trim()) return setError("Telefon yazılmalıdır.");
    if (!form.email.trim()) return setError("Email yazılmalıdır.");
    if (!form.password) return setError("Şifrə yazılmalıdır.");
    if (form.password !== form.confirmPassword) return setError("Şifrələr eyni deyil.");

    try {
      setCreating(true);
      await adminUsersApi.createAdmin({
        fullName: form.fullName.trim(),
        phoneNumber: phoneForApi(form.phoneNumber),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setForm(emptyAdmin);
      setShowCreate(false);
      setSuccess("Yeni admin hesabı yaradıldı.");
      await loadUsers(1);
    } catch (error) {
      setError(error.message || "Admin yaradılmadı.");
    } finally {
      setCreating(false);
    }
  }

  const counters = useMemo(
    () => ({
      page: users.length,
      active: users.filter((user) => user.isActive).length,
      inactive: users.filter((user) => !user.isActive).length,
      admins: users.filter((user) => userRoles(user).some((item) => item.includes("Admin"))).length,
    }),
    [users],
  );

  if (loading) return <AppLoader text="İstifadəçilər yüklənir" />;

  return (
    <main className="nb-insight-page nb-users-page">
      <header className="nb-insight-header">
        <div>
          <p className="nb-insight-eyebrow">nemesisbaku · SuperAdmin</p>
          <h1>İstifadəçilər</h1>
          <p>Müştəri və admin hesablarını ayrıca detal səhifəsində idarə edin.</p>
        </div>
        <div className="nb-header-actions">
          <button type="button" onClick={() => setShowCreate(true)}><FiPlus /> Admin yarat</button>
          <button type="button" disabled={refreshing} onClick={() => loadUsers(meta.page, true)}>
            <FiRefreshCw /> {refreshing ? "Yenilənir…" : "Yenilə"}
          </button>
        </div>
      </header>

      <section className="nb-insight-stats">
        <UserStat icon={<FiUsers />} label="Bu səhifədə" value={counters.page} />
        <UserStat icon={<FiCheckCircle />} label="Aktiv" value={counters.active} tone="green" />
        <UserStat icon={<FiXCircle />} label="Deaktiv" value={counters.inactive} tone="red" />
        <UserStat icon={<FiShield />} label="Admin rollu" value={counters.admins} tone="blue" />
      </section>

      <section className="nb-list-card">
        <div className="nb-filter-bar">
          <label>
            <FiSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && loadUsers(1)}
              placeholder="Ad, telefon və ya email ilə axtar"
            />
          </label>
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            {roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <button type="button" onClick={() => loadUsers(1)}><FiSearch /> Axtar</button>
        </div>

        <div className="nb-table-scroll">
          <table className="nb-admin-table">
            <thead>
              <tr>
                <th>İstifadəçi</th>
                <th>Telefon</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Status</th>
                <th>Qeydiyyat</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} onClick={() => navigate(`${basePath}/users/${user.id}`)}>
                  <td>
                    <div className="nb-user-cell">
                      <span><FiUser /></span>
                      <div><strong>{user.fullName || "Adsız istifadəçi"}</strong><small>Son giriş: {formatDate(user.lastLoginAt)}</small></div>
                    </div>
                  </td>
                  <td>{user.phoneNumber || "—"}</td>
                  <td>{user.email || "—"}</td>
                  <td><span className="nb-role-pill">{userRoles(user).join(", ")}</span></td>
                  <td><span className={`nb-status-pill ${user.isActive ? "is-active" : "is-inactive"}`}>{user.isActive ? "Aktiv" : "Deaktiv"}</span></td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="nb-row-actions">
                      <button title="Detallar" type="button" onClick={(event) => { event.stopPropagation(); navigate(`${basePath}/users/${user.id}`); }}><FiEye /></button>
                      <button title={user.isActive ? "Deaktiv et" : "Aktiv et"} disabled={busyId === user.id} type="button" onClick={(event) => { event.stopPropagation(); toggleStatus(user); }}>{user.isActive ? <FiXCircle /> : <FiCheckCircle />}</button>
                      <button className="is-danger" title="Sil" disabled={busyId === user.id} type="button" onClick={(event) => { event.stopPropagation(); deleteUser(user); }}><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 ? <tr><td colSpan="7" className="nb-table-empty">İstifadəçi tapılmadı.</td></tr> : null}
            </tbody>
          </table>
        </div>

        <div className="nb-pagination">
          <p>Cəmi {meta.totalCount} istifadəçi · Səhifə {meta.page} / {meta.totalPages}</p>
          <div>
            <button type="button" disabled={!meta.hasPreviousPage} onClick={() => loadUsers(meta.page - 1)}><FiChevronLeft /> Əvvəlki</button>
            <button type="button" disabled={!meta.hasNextPage} onClick={() => loadUsers(meta.page + 1)}>Növbəti <FiChevronRight /></button>
          </div>
        </div>
      </section>

      {showCreate ? (
        <div className="nb-modal-backdrop" role="presentation" onMouseDown={() => !creating && setShowCreate(false)}>
          <form className="nb-admin-modal" onSubmit={createAdmin} onMouseDown={(event) => event.stopPropagation()}>
            <div className="nb-admin-modal__head">
              <div><p className="nb-insight-eyebrow">nemesisbaku</p><h2>Yeni admin hesabı</h2></div>
              <button type="button" disabled={creating} onClick={() => setShowCreate(false)}><FiX /></button>
            </div>
            <div className="nb-form-grid">
              <ModalInput label="Ad və soyad" value={form.fullName} onChange={(value) => setForm((old) => ({ ...old, fullName: value }))} />
              <ModalInput label="Telefon" value={form.phoneNumber} onChange={(value) => setForm((old) => ({ ...old, phoneNumber: value }))} />
              <ModalInput label="Email" type="email" value={form.email} onChange={(value) => setForm((old) => ({ ...old, email: value }))} />
              <ModalInput label="Şifrə" type="password" value={form.password} onChange={(value) => setForm((old) => ({ ...old, password: value }))} />
              <ModalInput label="Şifrə təkrarı" type="password" value={form.confirmPassword} onChange={(value) => setForm((old) => ({ ...old, confirmPassword: value }))} />
            </div>
            <div className="nb-admin-modal__actions">
              <button type="button" disabled={creating} onClick={() => setShowCreate(false)}>Bağla</button>
              <button className="is-primary" type="submit" disabled={creating}>{creating ? "Yaradılır…" : "Admin yarat"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function UserStat({ icon, label, value, tone = "" }) {
  return <article className={`nb-insight-stat ${tone ? `is-${tone}` : ""}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}

function ModalInput({ label, value, onChange, type = "text" }) {
  return <label><span>{label}</span><input required type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
