import { API_BASE_URL } from "../config";

const PANEL_CONFIG = {
  super: {
    accessTokenKey: "nemesis_superadmin_access_token",
    refreshTokenKey: "nemesis_superadmin_refresh_token",
    rolesKey: "nemesis_superadmin_roles",
    requiredRole: "SuperAdmin",
    loginPath: "/SuperAdmin/login",
  },
  admin: {
    accessTokenKey: "nemesis_admin_access_token",
    refreshTokenKey: "nemesis_admin_refresh_token",
    rolesKey: "nemesis_admin_roles",
    requiredRole: "Admin",
    loginPath: "/Admin/login",
  },
};

const refreshRequests = {
  super: null,
  admin: null,
};

function getConfig(panel) {
  const config = PANEL_CONFIG[panel];

  if (!config) {
    throw new Error("Admin panel tipi yanlışdır");
  }

  return config;
}

function readRoles(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function emitAuthChanged(panel) {
  window.dispatchEvent(
    new CustomEvent("nemesis_admin_auth_changed", {
      detail: { panel },
    }),
  );
}

function unwrapAuthResponse(result) {
  return result?.data?.data || result?.data || result || {};
}

export function getPanelFromPath(pathname = window.location.pathname) {
  if (/^\/superadmin(?:\/|$)/i.test(pathname)) return "super";
  if (/^\/admin(?:\/|$)/i.test(pathname)) return "admin";
  return null;
}

export function getPanelLoginPath(panel) {
  return getConfig(panel).loginPath;
}

export function getPanelBasePath(panel = getPanelFromPath()) {
  if (panel === "super") return "/SuperAdmin";
  if (panel === "admin") return "/Admin";
  throw new Error("Admin panel yolu müəyyən edilmədi");
}

export function getPanelAccessToken(panel) {
  return localStorage.getItem(getConfig(panel).accessTokenKey);
}

export function getPanelRefreshToken(panel) {
  return localStorage.getItem(getConfig(panel).refreshTokenKey);
}

export function getPanelRoles(panel) {
  return readRoles(getConfig(panel).rolesKey);
}

export function savePanelAuth(panel, accessToken, refreshToken, roles = []) {
  const config = getConfig(panel);

  if (!accessToken) {
    throw new Error("Access token gəlmədi");
  }

  localStorage.setItem(config.accessTokenKey, accessToken);

  if (refreshToken) {
    localStorage.setItem(config.refreshTokenKey, refreshToken);
  } else {
    localStorage.removeItem(config.refreshTokenKey);
  }

  localStorage.setItem(
    config.rolesKey,
    JSON.stringify(Array.isArray(roles) ? roles : []),
  );

  emitAuthChanged(panel);
}

export function clearPanelAuth(panel) {
  const config = getConfig(panel);

  localStorage.removeItem(config.accessTokenKey);
  localStorage.removeItem(config.refreshTokenKey);
  localStorage.removeItem(config.rolesKey);
  emitAuthChanged(panel);
}

export function clearAllAdminAuth() {
  clearPanelAuth("super");
  clearPanelAuth("admin");
}

export function isPanelAuthenticated(panel) {
  const config = getConfig(panel);
  return Boolean(
    getPanelAccessToken(panel) &&
    getPanelRoles(panel).includes(config.requiredRole),
  );
}

export function getCurrentAccessToken(panel = getPanelFromPath()) {
  return panel ? getPanelAccessToken(panel) : null;
}

export function getSuperAdminAccessToken() {
  return getPanelAccessToken("super");
}

export function getAdminAccessToken() {
  return getPanelAccessToken("admin");
}

export function getSuperAdminRefreshToken() {
  return getPanelRefreshToken("super");
}

export function getAdminRefreshToken() {
  return getPanelRefreshToken("admin");
}

export function getSuperAdminRoles() {
  return getPanelRoles("super");
}

export function getAdminRoles() {
  return getPanelRoles("admin");
}

export function isSuperAdmin() {
  return isPanelAuthenticated("super");
}

export function isAdmin() {
  return isPanelAuthenticated("admin");
}

export function clearSuperAdminAuth() {
  clearPanelAuth("super");
}

export function clearAdminAuth() {
  clearPanelAuth("admin");
}

export async function loginForPanel(emailOrPhoneNumber, password, panel) {
  const config = getConfig(panel);
  const res = await fetch(`${API_BASE_URL}/api/Auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrPhoneNumber, password }),
  });

  const result = await res.json().catch(() => null);

  if (!res.ok || result?.success === false) {
    throw new Error(result?.message || result?.title || "Giriş uğursuz oldu");
  }

  const data = unwrapAuthResponse(result);
  const accessToken = data.accessToken || data.token;
  const refreshToken = data.refreshToken;
  const roles = Array.isArray(data.roles)
    ? data.roles
    : data.role
      ? [data.role]
      : [];

  if (!roles.includes(config.requiredRole)) {
    throw new Error(
      `Bu panelə yalnız ${config.requiredRole} rolu olan hesab daxil ola bilər`,
    );
  }

  // Digər panelin sessiyasına toxunmuruq. Hər panel öz açarı ilə yaşayır.
  savePanelAuth(panel, accessToken, refreshToken, roles);
  return data;
}

export async function refreshPanelAccessToken(panel) {
  getConfig(panel);

  if (refreshRequests[panel]) {
    return refreshRequests[panel];
  }

  refreshRequests[panel] = (async () => {
    const refreshToken = getPanelRefreshToken(panel);

    if (!refreshToken) {
      clearPanelAuth(panel);
      return null;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/Auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || result?.success === false) {
        clearPanelAuth(panel);
        return null;
      }

      const data = unwrapAuthResponse(result);
      const accessToken = data.accessToken || data.token;
      const newRefreshToken = data.refreshToken || refreshToken;
      const roles = Array.isArray(data.roles)
        ? data.roles
        : getPanelRoles(panel);

      if (!accessToken || !roles.includes(getConfig(panel).requiredRole)) {
        clearPanelAuth(panel);
        return null;
      }

      savePanelAuth(panel, accessToken, newRefreshToken, roles);
      return accessToken;
    } catch {
      clearPanelAuth(panel);
      return null;
    } finally {
      refreshRequests[panel] = null;
    }
  })();

  return refreshRequests[panel];
}

// Köhnə importlar üçün uyğunluq saxlanılır.
export function saveAdminAuth(accessToken, refreshToken, roles = []) {
  savePanelAuth("admin", accessToken, refreshToken, roles);
}

export function saveSuperAdminAuth(accessToken, refreshToken, roles = []) {
  savePanelAuth("super", accessToken, refreshToken, roles);
}

export async function adminLogin(emailOrPhoneNumber, password) {
  return loginForPanel(emailOrPhoneNumber, password, "admin");
}
