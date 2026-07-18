import { useEffect, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDatabase,
  FiEye,
  FiGlobe,
  FiHash,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiX,
} from "react-icons/fi";
import {
  adminAuditLogsApi,
  adminBrandsApi,
  adminCampaignsApi,
  adminCategoriesApi,
  adminOrdersApi,
  adminProductsApi,
} from "../../api/admin/adminApi";
import AppLoader from "../../components/common/AppLoader";

function unwrap(res) {
  return res?.data?.data || res?.data || res;
}

function listOf(res) {
  const data = unwrap(res);

  return (
    data?.items ||
    data?.logs ||
    data?.products ||
    data?.orders ||
    data?.result ||
    (Array.isArray(data) ? data : [])
  );
}

function metaOf(res) {
  const data = unwrap(res);

  return {
    page: data?.page || 1,
    pageSize: data?.pageSize || 20,
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 1,
    hasNextPage: Boolean(data?.hasNextPage),
    hasPreviousPage: Boolean(data?.hasPreviousPage),
  };
}

function formatDate(value) {
  if (!value) return "—";
  return String(value).replace("T", " ").slice(0, 19);
}

function extractOrderNumber(description = "") {
  const match = description.match(/OrderNumber:\s*([A-Z0-9-]+)/i);
  return match?.[1] || "";
}

function actionClass(action) {
  const value = String(action || "").toLowerCase();

  if (value.includes("delete")) return "bg-red-50 text-red-600";
  if (value.includes("create")) return "bg-green-50 text-green-700";
  if (value.includes("status")) return "bg-orange-50 text-orange-600";
  if (value.includes("update")) return "bg-[#244989]/8 text-[#244989]";

  return "bg-zinc-50 text-zinc-700";
}

function entityLabel(entityName) {
  const value = String(entityName || "").toLowerCase();

  if (value === "order") return "Sifariş";
  if (value === "product") return "Məhsul";
  if (value === "productvariant") return "Məhsul variantı";
  if (value === "productimage") return "Məhsul şəkli";
  if (value === "campaign") return "Kampaniya";
  if (value === "banner") return "Banner";
  if (value === "brand") return "Brend";
  if (value === "category") return "Kateqoriya";
  if (value === "user") return "İstifadəçi";

  return entityName || "—";
}

function shortId(id) {
  if (!id) return "—";
  return String(id).slice(0, 8);
}

function buildResolvedTitle(log, resolved) {
  const entity = String(log.entityName || "").toLowerCase();
  const orderNumber = extractOrderNumber(log.description);

  if (entity === "order") {
    return resolved?.orderNumber || orderNumber || "Sifariş";
  }

  if (entity === "product") {
    return resolved?.name || resolved?.productName || "Məhsul";
  }

  if (entity === "campaign") {
    return resolved?.title || "Kampaniya";
  }

  if (entity === "brand") {
    return resolved?.name || "Brend";
  }

  if (entity === "category") {
    return resolved?.name || "Kateqoriya";
  }

  return (
    orderNumber ||
    resolved?.name ||
    resolved?.title ||
    resolved?.orderNumber ||
    ""
  );
}

function getProductImage(entity) {
  const images =
    entity?.images ||
    entity?.productImages ||
    entity?.imageDtos ||
    entity?.productImageDtos ||
    [];

  const mainFromImages = Array.isArray(images)
    ? images.find((x) => x.isMain || x.isMainImage) || images[0]
    : null;

  return (
    entity?.mainImageUrl ||
    entity?.imageUrl ||
    entity?.productImageUrl ||
    entity?.coverImageUrl ||
    entity?.photoUrl ||
    mainFromImages?.imageUrl ||
    mainFromImages?.url ||
    mainFromImages?.fileUrl ||
    mainFromImages?.path ||
    mainFromImages?.secureUrl ||
    mainFromImages?.src ||
    null
  );
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [resolvedEntity, setResolvedEntity] = useState(null);
  const [resolveLoading, setResolveLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLogs(1);
  }, []);

  async function loadLogs(page = 1) {
    try {
      setLoading(true);
      setError("");

      const res = await adminAuditLogsApi.list({
        page,
        pageSize: 20,
        search,
      });

      setLogs(listOf(res));
      setMeta(metaOf(res));
    } catch (err) {
      setLogs([]);
      setError(err.message || "Audit loglar yüklənmədi.");
    } finally {
      setLoading(false);
    }
  }

  async function openLog(log) {
    setSelectedLog(log);
    setResolvedEntity(null);

    try {
      setResolveLoading(true);

      const entity = String(log.entityName || "").toLowerCase();

      if (entity === "order") {
        const res = await adminOrdersApi.detail(log.entityId);
        setResolvedEntity(unwrap(res));
        return;
      }

      if (entity === "product") {
        const res = await adminProductsApi.detail(log.entityId);
        setResolvedEntity(unwrap(res));
        return;
      }

      if (entity === "campaign") {
        const res = await adminCampaignsApi.list();
        const found = listOf(res).find(
          (x) => String(x.id) === String(log.entityId),
        );
        setResolvedEntity(found || null);
        return;
      }

      if (entity === "brand") {
        const res = await adminBrandsApi.list();
        const found = listOf(res).find(
          (x) => String(x.id) === String(log.entityId),
        );
        setResolvedEntity(found || null);
        return;
      }

      if (entity === "category") {
        const res = await adminCategoriesApi.list();
        const found = listOf(res).find(
          (x) => String(x.id) === String(log.entityId),
        );
        setResolvedEntity(found || null);
        return;
      }
    } catch {
      setResolvedEntity(null);
    } finally {
      setResolveLoading(false);
    }
  }

  if (loading) return <AppLoader text="Audit loglar yüklənir" />;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      {resolveLoading && <AppLoader text="Məlumat açılır" />}

      <div className="mb-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#244989]">
          SuperAdmin nəzarəti
        </p>

        <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.045em]">
          Audit Loglar
        </h1>

        <p className="mt-1 text-sm font-medium text-zinc-500">
          ID əvəzinə mümkün olduqda sifariş nömrəsi, məhsul adı, kampaniya adı
          və digər real məlumatlar göstərilir.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_130px]">
        <div className="flex h-13 items-center gap-3 rounded-[16px] border border-zinc-100 bg-white px-4">
          <FiSearch className="text-zinc-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadLogs(1);
            }}
            placeholder="Admin adı, action, entity, order number ilə axtar"
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-zinc-400"
          />
        </div>

        <button
          type="button"
          onClick={() => loadLogs(1)}
          className="flex h-13 items-center justify-center gap-2 rounded-[16px] bg-[#244989] text-sm font-extrabold text-white"
        >
          <FiRefreshCw />
          Axtar
        </button>
      </div>

      <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-[0.14em] text-zinc-400">
                <th className="px-5 py-4">Admin</th>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">Obyekt</th>
                <th className="px-5 py-4">Məlumat</th>
                <th className="px-5 py-4">Tarix</th>
                <th className="px-5 py-4 text-right">Bax</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => {
                const orderNumber = extractOrderNumber(log.description);
                const visibleEntity =
                  orderNumber ||
                  `${entityLabel(log.entityName)} #${shortId(log.entityId)}`;

                return (
                  <tr
                    key={log.id}
                    onClick={() => openLog(log)}
                    className="cursor-pointer border-b border-zinc-50 transition hover:bg-zinc-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-extrabold text-zinc-950">
                        {log.userFullName || "Admin"}
                      </p>

                      <p className="text-xs font-bold text-zinc-400">
                        {log.ipAddress || "IP yoxdur"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold ${actionClass(
                          log.action,
                        )}`}
                      >
                        {log.action || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-extrabold text-zinc-900">
                        {entityLabel(log.entityName)}
                      </p>

                      <p className="max-w-[230px] truncate text-xs font-extrabold text-[#244989]">
                        {visibleEntity}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="line-clamp-2 max-w-[390px] text-sm font-bold leading-6 text-zinc-600">
                        {log.description || "Açıqlama yoxdur"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-zinc-500">
                      {formatDate(log.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openLog(log);
                          }}
                          className="grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-700"
                        >
                          <FiEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-10 text-center text-sm font-bold text-zinc-400"
                  >
                    Audit log tapılmadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-zinc-400">
            Cəmi: {meta.totalCount} / Səhifə: {meta.page} / {meta.totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!meta.hasPreviousPage}
              onClick={() => loadLogs(meta.page - 1)}
              className="flex h-10 items-center gap-2 rounded-[14px] bg-zinc-50 px-4 text-sm font-extrabold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiChevronLeft />
              Əvvəlki
            </button>

            <button
              type="button"
              disabled={!meta.hasNextPage}
              onClick={() => loadLogs(meta.page + 1)}
              className="flex h-10 items-center gap-2 rounded-[14px] bg-zinc-50 px-4 text-sm font-extrabold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Növbəti
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {selectedLog && (
        <AuditLogModal
          log={selectedLog}
          resolvedEntity={resolvedEntity}
          onClose={() => {
            setSelectedLog(null);
            setResolvedEntity(null);
          }}
        />
      )}
    </div>
  );
}

function AuditLogModal({ log, resolvedEntity, onClose }) {
  const orderNumber = extractOrderNumber(log.description);
  const resolvedTitle = buildResolvedTitle(log, resolvedEntity);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/25 px-4 py-5 backdrop-blur-[2px]">
      <div className="relative max-h-[calc(100vh-40px)] w-full max-w-[900px] overflow-y-auto rounded-[34px] bg-white p-5 shadow-[0_30px_100px_rgba(0,0,0,0.18)] md:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full bg-zinc-50 text-zinc-800"
        >
          <FiX />
        </button>

        <div className="mb-6 pr-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#244989]">
            Audit detail
          </p>

          <h2 className="mt-2 text-[32px] font-extrabold tracking-[-0.045em] text-zinc-950 md:text-[42px]">
            {resolvedTitle || entityLabel(log.entityName)}
          </h2>

          <p className="mt-2 text-sm font-bold text-zinc-400">
            {log.action} / {formatDate(log.createdAt)}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Info icon={<FiUser />} label="Admin" value={log.userFullName} />
          <Info icon={<FiShield />} label="Action" value={log.action} />
          <Info
            icon={<FiDatabase />}
            label="Obyekt tipi"
            value={entityLabel(log.entityName)}
          />
          <Info
            icon={<FiHash />}
            label="Obyekt"
            value={resolvedTitle || `#${shortId(log.entityId)}`}
          />
          <Info icon={<FiGlobe />} label="IP Address" value={log.ipAddress} />
          <Info
            icon={<FiClock />}
            label="Tarix"
            value={formatDate(log.createdAt)}
          />

          {orderNumber && (
            <Info
              icon={<FiHash />}
              label="Sifariş nömrəsi"
              value={orderNumber}
            />
          )}
        </div>

        {resolvedEntity && (
          <ResolvedEntityBox log={log} entity={resolvedEntity} />
        )}

        <div className="mt-4 rounded-[22px] bg-zinc-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
            Description
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm font-extrabold leading-7 text-zinc-800">
            {log.description || "—"}
          </p>
        </div>

        <div className="mt-4 rounded-[22px] bg-zinc-50 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
            User Agent
          </p>

          <p className="mt-2 break-words text-xs font-bold leading-6 text-zinc-600">
            {log.userAgent || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ResolvedEntityBox({ log, entity }) {
  const type = String(log.entityName || "").toLowerCase();

  if (type === "order") {
    return (
      <div className="mt-4 rounded-[22px] bg-[#244989]/5 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#244989]">
          Sifariş məlumatı
        </p>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Info label="Sifariş nömrəsi" value={entity.orderNumber} />
          <Info label="Müştəri" value={entity.customerFullName} />
          <Info label="Telefon" value={entity.customerPhoneNumber} />
          <Info label="Məbləğ" value={`${entity.totalPrice || 0} ₼`} />
          <Info label="Ünvan" value={entity.addressText} />
          <Info label="Status" value={entity.status} />
        </div>
      </div>
    );
  }

  if (type === "product") {
    const image = getProductImage(entity);

    return (
      <div className="mt-4 rounded-[22px] bg-[#244989]/5 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#244989]">
          Məhsul məlumatı
        </p>

        <div className="mt-3 grid gap-3 md:grid-cols-[90px_1fr_1fr]">
          <div className="h-[90px] overflow-hidden rounded-[18px] bg-white">
            {image ? (
              <img
                src={image}
                alt={entity.name || "Məhsul"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs font-bold text-zinc-300">
                N
              </div>
            )}
          </div>

          <Info label="Məhsul" value={entity.name || entity.productName} />
          <Info label="Kod" value={entity.productCode} />
          <Info label="Model" value={entity.model} />
          <Info label="Qiymət" value={`${entity.price || 0} ₼`} />
          <Info
            label="Endirim"
            value={entity.discountPrice ? `${entity.discountPrice} ₼` : "—"}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-[22px] bg-[#244989]/5 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#244989]">
        Obyekt məlumatı
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Info
          label="Ad / Başlıq"
          value={entity.name || entity.title || entity.storeName}
        />
        <Info
          label="Status"
          value={entity.isActive === false ? "Passiv" : "Aktiv"}
        />
      </div>
    </div>
  );
}

function Info({ icon, label, value }) {
  return (
    <div className="rounded-[20px] bg-zinc-50 p-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-[#244989]">{icon}</span>}
        <p className="text-xs font-bold text-zinc-400">{label}</p>
      </div>

      <p className="mt-2 break-words text-sm font-extrabold text-zinc-800">
        {value || "—"}
      </p>
    </div>
  );
}
