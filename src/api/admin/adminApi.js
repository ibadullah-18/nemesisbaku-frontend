import { API_BASE_URL } from "../config";
import {
  clearPanelAuth,
  getPanelAccessToken,
  getPanelFromPath,
  getPanelLoginPath,
  refreshPanelAccessToken,
} from "./adminAuth";

function redirectToPanelLogin(panel) {
  const loginPath = getPanelLoginPath(panel);

  if (window.location.pathname.toLowerCase() !== loginPath.toLowerCase()) {
    window.location.assign(loginPath);
  }
}

export async function adminFetch(endpoint, options = {}, retry = true) {
  const { panel: requestedPanel, ...fetchOptions } = options;
  const panel = requestedPanel || getPanelFromPath();

  if (!panel) {
    throw new Error(
      "Admin sorğusunun hansı panelə aid olduğu müəyyən edilmədi.",
    );
  }

  const token = getPanelAccessToken(panel);
  const isFormData =
    typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

  let res;

  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...fetchOptions.headers,
      },
    });
  } catch {
    throw new Error("Serverlə əlaqə qurulmadı.");
  }

  if (res.status === 401 && retry) {
    const newToken = await refreshPanelAccessToken(panel);

    if (!newToken) {
      clearPanelAuth(panel);
      redirectToPanelLogin(panel);
      throw new Error("Sessiyanın vaxtı bitib. Yenidən daxil olun.");
    }

    return adminFetch(endpoint, { ...fetchOptions, panel }, false);
  }

  let result = null;
  const text = await res.text();

  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    result = text;
  }

  if (res.status === 401) {
    clearPanelAuth(panel);
    redirectToPanelLogin(panel);
    throw new Error("Sessiyanın vaxtı bitib. Yenidən daxil olun.");
  }

  if (res.status === 403) {
    throw new Error(
      result?.message || "Bu əməliyyat üçün səlahiyyətiniz yoxdur.",
    );
  }

  if (!res.ok || result?.success === false) {
    console.error("ADMIN API ERROR:", {
      endpoint,
      status: res.status,
      response: result,
    });

    const validationErrors =
      result?.errors && typeof result.errors === "object"
        ? Object.entries(result.errors)
            .map(
              ([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
            )
            .join(" | ")
        : "";

    throw new Error(
      validationErrors ||
        result?.message ||
        result?.title ||
        result?.error ||
        "Admin əməliyyatı uğursuz oldu",
    );
  }

  return result;
}

export function unwrapAdmin(res) {
  return res?.data?.data ?? res?.data ?? res;
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

export function getCreatedEntityId(res) {
  const data = unwrapAdmin(res);

  if (typeof data === "string") return data;

  return (
    data?.id ||
    data?.productId ||
    res?.id ||
    res?.productId ||
    res?.data?.id ||
    res?.data?.productId ||
    res?.data?.data?.id ||
    res?.data?.data?.productId ||
    null
  );
}

export const adminDashboardApi = {
  getStats: () => adminFetch("/api/Stats/dashboard"),
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
      },
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
      `/api/AdminOrders${buildQuery({ page, pageSize, search, status })}`,
    ),

  detail: (id) => adminFetch(`/api/AdminOrders/${id}`),

  updateStatus: (id, body) =>
    adminFetch(`/api/AdminOrders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  statusWhatsappLink: (id, status) =>
    adminFetch(`/api/AdminOrders/${id}/status-whatsapp-link?status=${status}`),

  courierWhatsappLink: (id, courierPhoneNumber) =>
    adminFetch(
      `/api/AdminOrders/${id}/courier-whatsapp-link?courierPhoneNumber=${encodeURIComponent(
        courierPhoneNumber,
      )}`,
    ),
};

export const adminUsersApi = {
  list: ({ page = 1, pageSize = 20, search = "", role = "" } = {}) =>
    adminFetch(
      `/api/AdminUsers${buildQuery({ page, pageSize, search, role })}`,
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

export const adminAuditLogsApi = {
  list: ({ page = 1, pageSize = 20, search = "" } = {}) =>
    adminFetch(`/api/AdminAuditLogs${buildQuery({ page, pageSize, search })}`),
};

export const adminPromoPagesApi = {
  list: (type) => {
    const query = type ? `?type=${type}` : "";
    return adminFetch(`/api/AdminPromoPages${query}`);
  },

  detail: async (id) => {
    return adminFetch(`/api/AdminPromoPages/${id}`);
  },

  create: (body) => {
    const formData = new FormData();

    formData.append("Type", String(Number(body.type || 1)));
    formData.append("StartDate", body.startDate || "");
    formData.append("IsActive", String(Boolean(body.isActive)));

    if (body.file instanceof File) {
      formData.append("File", body.file);
    }

    if (body.mobileFile instanceof File) {
      formData.append("MobileFile", body.mobileFile);
    }

    (body.productIds || []).forEach((id) => {
      if (id) formData.append("ProductIds", id);
    });

    return adminFetch("/api/AdminPromoPages", {
      method: "POST",
      body: formData,
    });
  },

  update: (id, body) => {
    const formData = new FormData();

    formData.append("StartDate", body.startDate || "");
    formData.append("IsActive", String(Boolean(body.isActive)));

    if (body.file instanceof File) {
      formData.append("File", body.file);
    }

    if (body.mobileFile instanceof File) {
      formData.append("MobileFile", body.mobileFile);
    }

    (body.productIds || []).forEach((productId) => {
      if (productId) formData.append("ProductIds", productId);
    });

    return adminFetch(`/api/AdminPromoPages/${id}`, {
      method: "PUT",
      body: formData,
    });
  },

  delete: (id) =>
    adminFetch(`/api/AdminPromoPages/${id}`, {
      method: "DELETE",
    }),
};

export const adminHomeSectionsApi = {
  list: () => {
    return adminFetch("/api/AdminHomeSections");
  },

  detail: (id) => {
    return adminFetch(`/api/AdminHomeSections/${id}`);
  },

  create: (body) => {
    return adminFetch("/api/AdminHomeSections", {
      method: "POST",
      body: JSON.stringify({
        title: body.title || "",
        subtitle: body.subtitle || "",
        displayOrder: Number(body.displayOrder || 1),
        startDate: body.startDate || null,
        endDate: body.endDate || null,
        isActive: Boolean(body.isActive),
        productIds: body.productIds || [],
      }),
    });
  },

  update: (id, body) => {
    return adminFetch(`/api/AdminHomeSections/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: body.title || "",
        subtitle: body.subtitle || "",
        displayOrder: Number(body.displayOrder || 1),
        startDate: body.startDate || null,
        endDate: body.endDate || null,
        isActive: Boolean(body.isActive),
        productIds: body.productIds || [],
      }),
    });
  },

  delete: (id) => {
    return adminFetch(`/api/AdminHomeSections/${id}`, {
      method: "DELETE",
    });
  },
};
export const adminCampaignsApi = {
  list: () => adminPromoPagesApi.list(),

  create: (body) => adminPromoPagesApi.create(body),

  update: (id, body) => adminPromoPagesApi.update(id, body),

  delete: (id) => adminPromoPagesApi.delete(id),
};

export const adminPromoCodesApi = {
  list: () => adminFetch("/api/AdminPromoCodes"),

  create: (body) =>
    adminFetch("/api/AdminPromoCodes", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  delete: (id) =>
    adminFetch(`/api/AdminPromoCodes/${id}`, {
      method: "DELETE",
    }),
};

export const adminEmailAnnouncementsApi = {
  list: () => adminFetch("/api/AdminEmailAnnouncements"),

  create: (body) =>
    adminFetch("/api/AdminEmailAnnouncements", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const adminCouriersApi = {
  list: () => adminFetch("/api/AdminCouriers"),

  create: (body) =>
    adminFetch("/api/AdminCouriers", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id, body) =>
    adminFetch(`/api/AdminCouriers/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  setDefault: (id) =>
    adminFetch(`/api/AdminCouriers/${id}/default`, {
      method: "PUT",
    }),

  delete: (id) =>
    adminFetch(`/api/AdminCouriers/${id}`, {
      method: "DELETE",
    }),
};
