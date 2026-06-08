import { API_BASE_URL } from "../config";
import { clearAdminAuth, getAdminAccessToken } from "./adminAuth";

export async function adminFetch(endpoint, options = {}) {
  const token = getAdminAccessToken();
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
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
    return;
  }

  if (!res.ok) {
    throw new Error(
      result?.message ||
        result?.error ||
        result?.errors?.[0] ||
        "Admin əməliyyatı uğursuz oldu"
    );
  }

  return result;
}

export const adminDashboardApi = {
  getStats: () => adminFetch("/api/Stats/dashboard"),
};

export const adminProductsApi = {
  list: ({ page = 1, pageSize = 200, search = "" } = {}) => {
    const params = new URLSearchParams();

    params.append("page", page);
    params.append("pageSize", pageSize);
    if (search) params.append("search", search);

    return adminFetch(`/api/AdminProducts?${params.toString()}`);
  },

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
    adminFetch(`/api/AdminProducts/low-stock?threshold=${threshold}`),
};

export const adminProductImagesApi = {
  upload: (productId, file, isMain = false) => {
    const formData = new FormData();
    formData.append("file", file);

    return adminFetch(
      `/api/AdminProducts/${productId}/images?isMain=${isMain}`,
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

export const adminCategoriesApi = {
  list: () => adminFetch("/api/AdminCategories"),

  create: (body) =>
    adminFetch("/api/AdminCategories", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const adminBrandsApi = {
  list: () => adminFetch("/api/AdminBrands"),

  create: (body) =>
    adminFetch("/api/AdminBrands", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const adminSizesApi = {
  list: () => adminFetch("/api/AdminSizes"),

  create: (size) =>
    adminFetch(`/api/AdminSizes?size=${encodeURIComponent(size)}`, {
      method: "POST",
    }),
};

export const adminColorsApi = {
  list: () => adminFetch("/api/AdminColors"),

  create: (body) =>
    adminFetch("/api/AdminColors", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const adminOrdersApi = {
  list: ({ page = 1, pageSize = 20, search = "", status = "" } = {}) => {
    const params = new URLSearchParams();

    params.append("page", page);
    params.append("pageSize", pageSize);
    if (search) params.append("search", search);
    if (status) params.append("status", status);

    return adminFetch(`/api/AdminOrders?${params.toString()}`);
  },

  detail: (id) => adminFetch(`/api/AdminOrders/${id}`),

  updateStatus: (id, body) =>
    adminFetch(`/api/AdminOrders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};