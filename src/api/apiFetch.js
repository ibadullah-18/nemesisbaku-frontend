import { API_BASE_URL } from "./config";

const ACCESS_TOKEN_KEY = "nemesis_access_token";
const REFRESH_TOKEN_KEY = "nemesis_refresh_token";

export function saveTokens(accessToken, refreshToken) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  window.dispatchEvent(new Event("nemesis_auth_changed"));
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);

  window.dispatchEvent(new Event("nemesis_auth_changed"));
}

let refreshRequest = null;
function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = performTokenRefresh().finally(() => {
      refreshRequest = null;
    });
  }
  return refreshRequest;
}
async function performTokenRefresh() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearTokens();
    return null;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/Auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const result = await res.json();

    const accessToken =
      result?.accessToken ||
      result?.token ||
      result?.data?.accessToken ||
      result?.data?.token;

    const newRefreshToken =
      result?.refreshToken ||
      result?.data?.refreshToken ||
      refreshToken;

    if (!accessToken) {
      clearTokens();
      return null;
    }

    saveTokens(accessToken, newRefreshToken);
    return accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

export async function apiFetch(endpoint, options = {}, retry = true) {
  const token = getAccessToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;

  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Serverlə əlaqə qurulmadı.");
  }

  if (res.status === 401 && retry && (token || getRefreshToken())) {
    const currentToken = getAccessToken();
    const newToken = currentToken && currentToken !== token
      ? currentToken : await refreshAccessToken();

    if (newToken) return apiFetch(endpoint, options, false);

    // Public GET requests may work without the expired session.
    if (token && (options.method || "GET").toUpperCase() === "GET") {
      return apiFetch(endpoint, options, false);
    }
  }

  let result;

  try {
    result = await res.json();
  } catch {
    result = null;
  }

  if (!res.ok) {
    const validationMessages =
      result?.errors && typeof result.errors === "object"
        ? Object.values(result.errors)
            .flat()
            .filter(value => typeof value === "string")
        : [];

    const message = [
      result?.message,
      result?.error,
      validationMessages.join(" "),
      result?.title
    ].find(value => typeof value === "string" && value.trim())
      || "Əməliyyat uğursuz oldu";

    const error = new Error(message);
    error.status = res.status;
    error.retryAfter = Number(res.headers.get("Retry-After")) || 0;
    throw error;
  }

  if (/^\/api\/Basket(?:\/|$)/i.test(endpoint) && (options.method || "GET").toUpperCase() !== "GET") {
    window.dispatchEvent(new Event("nemesis_basket_changed"));
  }
  return result;
}