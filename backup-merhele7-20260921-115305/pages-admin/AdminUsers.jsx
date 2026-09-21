import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiLock,
  FiMail,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiShoppingBag,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import {
  adminUsersApi,
  listAdmin,
  metaAdmin,
  unwrapAdmin,
} from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

const emptyAdminForm = {
  fullName: "",
  phoneNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const roleFilters = [
  { value: "", label: "Hamısı" },
  { value: "User", label: "Müştərilər" },
  { value: "Admin", label: "Adminlər" },
  { value: "SuperAdmin", label: "SuperAdmin" },
];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).replace("T", " ").slice(0, 16);
  }

  return date.toLocaleString("az-AZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleText(roles = []) {
  if (!Array.isArray(roles) || roles.length === 0) return "Rol yoxdur";
  return roles.join(", ");
}

function getRoleClass(roles = []) {
  if (roles.includes("SuperAdmin")) return "bg-zinc-950 text-white";
  if (roles.includes("Admin")) return "bg-[#244989] text-white";
  return "bg-zinc-50 text-zinc-700";
}

function phoneToBackend(value) {
  const only = String(value || "").replace(/\D/g, "");

  if (only.startsWith("994")) return only;
  if (only.length === 9) return `994${only}`;

  return only;
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

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

  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  async function loadUsers(page = 1) {
    try {
      setError("");
      setLoading(true);

      const res = await adminUsersApi.list({
        page,
        pageSize: 20,
        search,
        role,
      });

      setUsers(listAdmin(res));
      setMeta(metaAdmin(res));
    } catch (err) {
      setError(err.message || "İstifadəçilər yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  async function openUser(id) {
    try {
      setError("");
      setDetailLoading(true);

      const res = await adminUsersApi.detail(id);
      setSelectedUser(unwrapAdmin(res));
    } catch (err) {
      setError(err.message || "İstifadəçi detalları açılmadı.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function toggleUserStatus(user) {
    const isActive = Boolean(user.isActive);

    const ok = confirm(
      isActive
        ? "Bu istifadəçi deaktiv edilsin?"
        : "Bu istifadəçi aktiv edilsin?"
    );

    if (!ok) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (isActive) {
        await adminUsersApi.deactivate(user.id);
        setSuccess("İstifadəçi deaktiv edildi.");
      } else {
        await adminUsersApi.activate(user.id);
        setSuccess("İstifadəçi aktiv edildi.");
      }

      await loadUsers(meta.page);

      if (selectedUser?.id === user.id) {
        const detail = await adminUsersApi.detail(user.id);
        setSelectedUser(unwrapAdmin(detail));
      }
    } catch (err) {
      setError(err.message || "Status dəyişdirilmədi.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(user) {
    const ok = confirm("Bu istifadəçi silinsin?");

    if (!ok) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await adminUsersApi.delete(user.id);

      setSuccess("İstifadəçi silindi.");
      setSelectedUser(null);
      await loadUsers(meta.page);
    } catch (err) {
      setError(err.message || "İstifadəçi silinmədi.");
    } finally {
      setSaving(false);
    }
  }

  function updateAdminForm(key, value) {
    setAdminForm((prev) => ({ ...prev, [key]: value }));
  }

  async function createAdmin(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!adminForm.fullName.trim()) return setError("Admin adı yazılmalıdır.");
    if (!adminForm.phoneNumber.trim()) return setError("Telefon yazılmalıdır.");
    if (!adminForm.email.trim()) return setError("Email yazılmalıdır.");
    if (!adminForm.password.trim()) return setError("Şifrə yazılmalıdır.");

    if (adminForm.password !== adminForm.confirmPassword) {
      return setError("Şifrə və təkrar şifrə eyni deyil.");
    }

    try {
      setSaving(true);

      await adminUsersApi.createAdmin({
        fullName: adminForm.fullName.trim(),
        phoneNumber: phoneToBackend(adminForm.phoneNumber),
        email: adminForm.email.trim(),
        password: adminForm.password,
        confirmPassword: adminForm.confirmPassword,
      });

      setAdminForm(emptyAdminForm);
      setShowCreateAdmin(false);
      setSuccess("Yeni admin yaradıldı.");

      await loadUsers(1);
    } catch (err) {
      setError(err.message || "Admin yaradılmadı.");
    } finally {
      setSaving(false);
    }
  }

  const counters = useMemo(() => {
    const total = users.length;
    const active = users.filter((x) => x.isActive).length;
    const inactive = users.filter((x) => !x.isActive).length;
    const admins = users.filter((x) =>
      Array.isArray(x.roles) ? x.roles.some((r) => r.includes("Admin")) : false
    ).length;

    return { total, active, inactive, admins };
  }, [users]);

  if (loading) return <AppLoader text="İstifadəçilər yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {(detailLoading || saving) && <AppLoader text="Yüklənir" />}

      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            SuperAdmin istifadəçilər
          </p>

          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
            İstifadəçilər
          </h1>

          <p className="mt-1 text-sm font-medium text-zinc-500">
            Müştəriləri və admin hesablarını idarə edin.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setShowCreateAdmin(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#244989] px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]"
          >
            <FiPlus />
            Admin yarat
          </button>

          <button
            type="button"
            onClick={() => loadUsers(meta.page)}
            className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-zinc-950 px-5 text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]"
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

      {success && (
        <div className="mb-5 rounded-[18px] border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          {success}
        </div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CounterCard icon={<FiUsers />} label="Bu səhifədə" value={counters.total} />
        <CounterCard icon={<FiCheckCircle />} label="Aktiv" value={counters.active} green />
        <CounterCard icon={<FiXCircle />} label="Deaktiv" value={counters.inactive} red />
        <CounterCard icon={<FiShield />} label="Admin rollu" value={counters.admins} blue />
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_130px]">
        <div className="flex h-13 items-center gap-3 rounded-[16px] border border-zinc-100 bg-white px-4">
          <FiSearch className="text-zinc-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadUsers(1);
            }}
            placeholder="Ad, telefon və ya email ilə axtar"
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400"
          />
        </div>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-13 rounded-[16px] border border-zinc-100 bg-white px-4 text-sm font-bold outline-none focus:border-zinc-400"
        >
          {roleFilters.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => loadUsers(1)}
          className="flex h-13 items-center justify-center gap-2 rounded-[16px] bg-zinc-950 text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]"
        >
          <FiSearch />
          Axtar
        </button>
      </div>

      <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-[0.14em] text-zinc-400">
                <th className="px-5 py-4">İstifadəçi</th>
                <th className="px-5 py-4">Telefon</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Rol</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Qeydiyyat</th>
                <th className="px-5 py-4 text-right">Əməliyyat</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => openUser(user.id)}
                  className="cursor-pointer border-b border-zinc-50 transition hover:bg-zinc-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-zinc-50 text-zinc-700">
                        <FiUser />
                      </div>

                      <div>
                        <p className="font-extrabold text-zinc-950">
                          {user.fullName || "Adsız istifadəçi"}
                        </p>
                        <p className="text-xs font-bold text-zinc-400">
                          Son giriş: {formatDate(user.lastLoginAt)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm font-bold">
                    {user.phoneNumber || "—"}
                  </td>

                  <td className="px-5 py-4 text-sm font-bold">
                    {user.email || "—"}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-extrabold ${getRoleClass(
                        user.roles
                      )}`}
                    >
                      {roleText(user.roles)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {user.isActive ? (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold text-green-700">
                        Aktiv
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-extrabold text-red-600">
                        Deaktiv
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-zinc-500">
                    {formatDate(user.createdAt)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openUser(user.id);
                        }}
                        className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.94]"
                      >
                        <FiEye />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUserStatus(user);
                        }}
                        className={`grid h-10 w-10 place-items-center rounded-full transition hover:-translate-y-0.5 active:scale-[0.94] ${
                          user.isActive
                            ? "bg-orange-50 text-orange-600"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {user.isActive ? <FiXCircle /> : <FiCheckCircle />}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteUser(user);
                        }}
                        className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600 transition hover:-translate-y-0.5 active:scale-[0.94]"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-sm font-bold text-zinc-400"
                  >
                    İstifadəçi tapılmadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-bold text-zinc-500">
            Cəmi: {meta.totalCount} istifadəçi · Səhifə {meta.page} /{" "}
            {meta.totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!meta.hasPreviousPage}
              onClick={() => loadUsers(meta.page - 1)}
              className="flex h-10 items-center gap-2 rounded-[14px] bg-zinc-50 px-4 text-sm font-extrabold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiChevronLeft />
              Əvvəlki
            </button>

            <button
              type="button"
              disabled={!meta.hasNextPage}
              onClick={() => loadUsers(meta.page + 1)}
              className="flex h-10 items-center gap-2 rounded-[14px] bg-zinc-50 px-4 text-sm font-extrabold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Növbəti
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onToggleStatus={toggleUserStatus}
          onDelete={deleteUser}
        />
      )}

      {showCreateAdmin && (
        <CreateAdminModal
          form={adminForm}
          onChange={updateAdminForm}
          onSubmit={createAdmin}
          onClose={() => {
            setShowCreateAdmin(false);
            setAdminForm(emptyAdminForm);
          }}
        />
      )}
    </div>
  );
}

function CounterCard({ icon, label, value, green = false, red = false, blue = false }) {
  let tone = "bg-zinc-50 text-zinc-700";

  if (green) tone = "bg-green-50 text-green-700";
  if (red) tone = "bg-red-50 text-red-600";
  if (blue) tone = "bg-[#244989]/8 text-[#244989]";

  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_14px_42px_rgba(0,0,0,0.035)] transition hover:-translate-y-1 active:scale-[0.98]">
      <div className={`mb-4 grid h-11 w-11 place-items-center rounded-[16px] text-xl ${tone}`}>
        {icon}
      </div>

      <p className="text-sm font-bold text-zinc-400">{label}</p>
      <h3 className="mt-1 text-[28px] font-extrabold tracking-[-0.04em]">
        {value ?? 0}
      </h3>
    </div>
  );
}

function UserDetailModal({ user, onClose, onToggleStatus, onDelete }) {
  const orders = Array.isArray(user.orders) ? user.orders : [];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/25 px-4 py-5 backdrop-blur-[3px]">
      <div className="relative max-h-[calc(100vh-40px)] w-full max-w-[1120px] overflow-y-auto rounded-[34px] bg-white p-5 shadow-[0_30px_100px_rgba(0,0,0,0.18)] md:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-zinc-50 text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.94]"
        >
          <FiX />
        </button>

        <div className="pr-14">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            İstifadəçi detalları
          </p>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="h-24 w-24 overflow-hidden rounded-[30px] bg-zinc-50">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-[32px] text-zinc-300">
                  <FiUser />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-[28px] font-extrabold tracking-[-0.045em] md:text-[38px]">
                {user.fullName || "Adsız istifadəçi"}
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${getRoleClass(user.roles)}`}>
                  {roleText(user.roles)}
                </span>

                {user.isActive ? (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold text-green-700">
                    Aktiv
                  </span>
                ) : (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-extrabold text-red-600">
                    Deaktiv
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DetailCard icon={<FiPhone />} label="Telefon" value={user.phoneNumber || "—"} />
          <DetailCard icon={<FiMail />} label="Email" value={user.email || "—"} />
          <DetailCard icon={<FiShoppingBag />} label="Sifariş sayı" value={user.orderCount ?? 0} />
          <DetailCard icon={<FiCheckCircle />} label="Son giriş" value={formatDate(user.lastLoginAt)} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <DetailCard icon={<FiUser />} label="Doğum tarixi" value={formatDate(user.dateOfBirth)} />
          <DetailCard icon={<FiShoppingBag />} label="Səbət məhsulu" value={user.basketItemCount ?? 0} />
          <DetailCard icon={<FiCheckCircle />} label="Favori sayı" value={user.favoriteCount ?? 0} />
        </div>

        <div className="mt-5 rounded-[28px] bg-zinc-50 p-5">
          <h3 className="text-lg font-extrabold tracking-[-0.03em]">
            Sifariş tarixçəsi
          </h3>

          <p className="mt-1 text-sm font-bold text-zinc-500">
            Bu istifadəçinin son sifarişləri.
          </p>

          <div className="mt-4 space-y-3">
            {orders.length === 0 ? (
              <div className="rounded-[18px] bg-white p-4 text-sm font-extrabold text-zinc-500">
                Bu istifadəçinin sifarişi yoxdur.
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-[20px] bg-white p-4 shadow-[0_14px_32px_rgba(0,0,0,0.025)]"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-extrabold text-zinc-950">
                        {order.orderNumber || "Sifariş"}
                      </p>
                      <p className="text-xs font-bold text-zinc-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#244989]/8 px-3 py-1 text-xs font-extrabold text-[#244989]">
                        {Number(order.totalPrice || 0).toFixed(2)} ₼
                      </span>

                      <span className="rounded-full bg-zinc-50 px-3 py-1 text-xs font-extrabold text-zinc-700">
                        Status: {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => onToggleStatus(user)}
            className={`flex h-12 items-center justify-center gap-2 rounded-[16px] px-5 text-sm font-extrabold transition hover:-translate-y-0.5 active:scale-[0.96] ${
              user.isActive
                ? "bg-orange-50 text-orange-600"
                : "bg-green-50 text-green-700"
            }`}
          >
            {user.isActive ? <FiXCircle /> : <FiCheckCircle />}
            {user.isActive ? "Deaktiv et" : "Aktiv et"}
          </button>

          <button
            type="button"
            onClick={() => onDelete(user)}
            className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-red-50 px-5 text-sm font-extrabold text-red-600 transition hover:-translate-y-0.5 active:scale-[0.96]"
          >
            <FiTrash2 />
            Sil
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateAdminModal({ form, onChange, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/25 px-4 py-5 backdrop-blur-[3px]">
      <div className="relative w-full max-w-[560px] rounded-[34px] bg-white p-5 shadow-[0_30px_100px_rgba(0,0,0,0.18)] md:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-zinc-50 text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.94]"
        >
          <FiX />
        </button>

        <div className="pr-14">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
            Yeni admin
          </p>

          <h2 className="mt-2 text-[30px] font-extrabold tracking-[-0.045em]">
            Admin hesabı yarat
          </h2>

          <p className="mt-1 text-sm font-bold text-zinc-500">
            Bu hesab admin panelinə daxil ola biləcək.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <AdminInput
            icon={<FiUser />}
            label="Ad soyad"
            placeholder="Məsələn: Nemesis Admin"
            value={form.fullName}
            onChange={(v) => onChange("fullName", v)}
          />

          <AdminInput
            icon={<FiPhone />}
            label="Telefon"
            placeholder="506151345 və ya 994506151345"
            value={form.phoneNumber}
            onChange={(v) => onChange("phoneNumber", v)}
          />

          <AdminInput
            icon={<FiMail />}
            label="Email"
            placeholder="admin@nemesisbaku.az"
            value={form.email}
            onChange={(v) => onChange("email", v)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput
              icon={<FiLock />}
              label="Şifrə"
              type="password"
              placeholder="Şifrə"
              value={form.password}
              onChange={(v) => onChange("password", v)}
            />

            <AdminInput
              icon={<FiLock />}
              label="Təkrar şifrə"
              type="password"
              placeholder="Təkrar şifrə"
              value={form.confirmPassword}
              onChange={(v) => onChange("confirmPassword", v)}
            />
          </div>

          <button className="flex h-13 w-full items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.97]">
            <FiPlus />
            Admin yarat
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminInput({ icon, label, placeholder, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-800">
        {label}
      </span>

      <div className="flex h-13 items-center gap-3 rounded-[16px] border border-zinc-100 bg-zinc-50 px-4 transition focus-within:border-zinc-400">
        <span className="text-zinc-400">{icon}</span>

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400"
        />
      </div>
    </label>
  );
}

function DetailCard({ icon, label, value }) {
  return (
    <div className="rounded-[24px] bg-zinc-50 p-4 transition hover:-translate-y-1 active:scale-[0.98]">
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-[16px] bg-white text-[#244989]">
        {icon}
      </div>

      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-extrabold text-zinc-950">
        {value}
      </p>
    </div>
  );
}