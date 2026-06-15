import { API_BASE_URL } from "../config";
import { clearAdminAuth, getAdminAccessToken } from "./adminAuth";

export async function adminFetch(endpoint, options = {}) {
  const token = getAdminAccessToken();
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "*/*",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let result = null;

  try {
    result = await res.json();
  } catch {
    result = null;
  }

  if (res.status === 401 || res.status === 403) {
    clearAdminAuth();
    window.location.href = "/SuperAdmin";
    return null;
  }

  if (!res.ok || result?.success === false) {
    const message =
      result?.message ||
      result?.error ||
      result?.errors?.[0] ||
      "Admin əməliyyatı uğursuz oldu";

    throw new Error(message);
  }

  return result;
}

export function unwrapAdmin(res) {
  return res?.data?.data || res?.data || res;
}

export function listAdmin(res) {
  const data = unwrapAdmin(res);

  return (
    data?.items ||
    data?.list ||
    data?.result ||
    data?.products ||
    data?.orders ||
    data?.logs ||
    (Array.isArray(data) ? data : [])
  );
}

export function metaAdmin(res) {
  const data = unwrapAdmin(res);

  return {
    page: data?.page || 1,
    pageSize: data?.pageSize || 20,
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 1,
    hasNextPage: Boolean(data?.hasNextPage),
    hasPreviousPage: Boolean(data?.hasPreviousPage),
  };
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const text = query.toString();
  return text ? `?${text}` : "";
}

export const adminDashboardApi = {
  getStats: () => adminFetch("/api/Stats/dashboard"),
};

export const adminUsersApi = {
  list: ({ page = 1, pageSize = 20, search = "", role = "" } = {}) =>
    adminFetch(
      `/api/AdminUsers${buildQuery({ page, pageSize, search, role })}`
    ),

  detail: (id) => adminFetch(`/api/AdminUsers/${id}`),

  createAdmin: (body) =>
    adminFetch("/api/AdminUsers/create-admin", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deactivate: (id) =>
    adminFetch(`/api/AdminUsers/${id}/deactivate`, {
      method: "PUT",
    }),

  activate: (id) =>
    adminFetch(`/api/AdminUsers/${id}/activate`, {
      method: "PUT",
    }),

  delete: (id) =>
    adminFetch(`/api/AdminUsers/${id}`, {
      method: "DELETE",
    }),
};

export const adminProductsApi = {
  list: ({ page = 1, pageSize = 200, search = "" } = {}) =>
    adminFetch(`/api/AdminProducts${buildQuery({ page, pageSize, search })}`),

  detail: (id) => adminFetch(`/api/AdminProducts/${id}`),

  create: (body) =>
    adminFetch("/api/AdminProducts", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id, body) =>
    adminFetch(`/api/AdminProducts/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (id) =>
    adminFetch(`/api/AdminProducts/${id}`, {
      method: "DELETE",
    }),

  lowStock: (threshold = 2) =>
    adminFetch(`/api/AdminProducts/low-stock${buildQuery({ threshold })}`),
};

export const adminProductImagesApi = {
  upload: (productId, file, isMain = false) => {
    const formData = new FormData();
    formData.append("file", file);

    return adminFetch(
      `/api/AdminProducts/${productId}/images${buildQuery({ isMain })}`,
      {
        method: "POST",
        body: formData,
      }
    );
  },

  delete: (imageId) =>
    adminFetch(`/api/AdminProducts/images/${imageId}`, {
      method: "DELETE",
    }),

  setMain: (imageId) =>
    adminFetch(`/api/AdminProducts/images/${imageId}/set-main`, {
      method: "PUT",
    }),

  updateOrder: (imageId, order) =>
    adminFetch(`/api/AdminProducts/images/${imageId}/order`, {
      method: "PUT",
      body: JSON.stringify({ order }),
    }),
};

export const adminProductVariantsApi = {
  create: (productId, body) =>
    adminFetch(`/api/AdminProducts/${productId}/variants`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (variantId, body) =>
    adminFetch(`/api/AdminProducts/variants/${variantId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (variantId) =>
    adminFetch(`/api/AdminProducts/variants/${variantId}`, {
      method: "DELETE",
    }),
};

export const adminBrandsApi = {
  list: () => adminFetch("/api/AdminBrands"),

  create: ({ name, image }) => {
    const formData = new FormData();
    formData.append("Name", name);
    if (image) formData.append("Image", image);

    return adminFetch("/api/AdminBrands", {
      method: "POST",
      body: formData,
    });
  },

  update: (id, { name, image }) => {
    const formData = new FormData();
    formData.append("Name", name);
    if (image) formData.append("Image", image);

    return adminFetch(`/api/AdminBrands/${id}`, {
      method: "PUT",
      body: formData,
    });
  },

  delete: (id) =>
    adminFetch(`/api/AdminBrands/${id}`, {
      method: "DELETE",
    }),
};

export const adminCategoriesApi = {
  list: () => adminFetch("/api/AdminCategories"),

  create: (body) =>
    adminFetch("/api/AdminCategories", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id, body) =>
    adminFetch(`/api/AdminCategories/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (id) =>
    adminFetch(`/api/AdminCategories/${id}`, {
      method: "DELETE",
    }),
};

export const adminSizesApi = {
  list: () => adminFetch("/api/AdminSizes"),

  create: (size) =>
    adminFetch(`/api/AdminSizes${buildQuery({ size })}`, {
      method: "POST",
    }),

  delete: (id) =>
    adminFetch(`/api/AdminSizes/${id}`, {
      method: "DELETE",
    }),
};

export const adminColorsApi = {
  list: () => adminFetch("/api/AdminColors"),

  create: (body) =>
    adminFetch("/api/AdminColors", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  delete: (id) =>
    adminFetch(`/api/AdminColors/${id}`, {
      method: "DELETE",
    }),
};

export const adminOrdersApi = {
  list: ({ page = 1, pageSize = 20, search = "", status = "" } = {}) =>
    adminFetch(
      `/api/AdminOrders${buildQuery({ page, pageSize, search, status })}`
    ),

  detail: (id) => adminFetch(`/api/AdminOrders/${id}`),

  updateStatus: (id, body) =>
    adminFetch(`/api/AdminOrders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};

export const adminCampaignsApi = {
  list: () => adminFetch("/api/AdminCampaigns"),

  create: (body) => {
    const formData = new FormData();

    formData.append("Title", body.title);
    formData.append("Description", body.description || "");
    formData.append("RedirectUrl", body.redirectUrl || "/");
    formData.append("StartDate", body.startDate);
    formData.append("EndDate", body.endDate);
    formData.append("IsActive", body.isActive);

    if (body.file) formData.append("File", body.file);

    return adminFetch("/api/AdminCampaigns", {
      method: "POST",
      body: formData,
    });
  },

  update: (id, body) => {
    const formData = new FormData();

    formData.append("Title", body.title);
    formData.append("Description", body.description || "");
    formData.append("RedirectUrl", body.redirectUrl || "/");
    formData.append("StartDate", body.startDate);
    formData.append("EndDate", body.endDate);
    formData.append("IsActive", body.isActive);

    if (body.file) formData.append("File", body.file);

    return adminFetch(`/api/AdminCampaigns/${id}`, {
      method: "PUT",
      body: formData,
    });
  },

  delete: (id) =>
    adminFetch(`/api/AdminCampaigns/${id}`, {
      method: "DELETE",
    }),
};

export const adminBannersApi = {
  list: () => adminFetch("/api/AdminBanners"),

  create: (body) => {
    const formData = new FormData();

    formData.append("Title", body.title || "");
    formData.append("Description", body.description || "");
    formData.append("ButtonText", body.buttonText || "");
    formData.append("ButtonUrl", body.buttonUrl || "/");
    formData.append("SortOrder", body.sortOrder || 0);

    if (body.file) formData.append("File", body.file);

    return adminFetch("/api/AdminBanners", {
      method: "POST",
      body: formData,
    });
  },

  update: (id, body) => {
    const formData = new FormData();

    formData.append("Title", body.title || "");
    formData.append("Description", body.description || "");
    formData.append("ButtonText", body.buttonText || "");
    formData.append("ButtonUrl", body.buttonUrl || "/");
    formData.append("SortOrder", body.sortOrder || 0);

    if (body.file) formData.append("File", body.file);

    return adminFetch(`/api/AdminBanners/${id}`, {
      method: "PUT",
      body: formData,
    });
  },

  delete: (id) =>
    adminFetch(`/api/AdminBanners/${id}`, {
      method: "DELETE",
    }),
};

export const adminAuditLogsApi = {
  list: ({ page = 1, pageSize = 20, search = "" } = {}) =>
    adminFetch(
      `/api/AdminAuditLogs${buildQuery({ page, pageSize, search })}`
    ),
};

export const adminStoreInfoApi = {
  get: () => adminFetch("/api/StoreInfo"),

  update: (body) =>
    adminFetch("/api/StoreInfo", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

export const adminPromoCodesApi = {
  check: (body) =>
    adminFetch("/api/PromoCodes/check", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};