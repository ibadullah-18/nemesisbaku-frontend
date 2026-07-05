import { API_BASE_URL } from "../config";

const SUPER_TOKEN = "nemesis_superadmin_access_token";
const SUPER_REFRESH = "nemesis_superadmin_refresh_token";
const SUPER_ROLES = "nemesis_superadmin_roles";

const ADMIN_TOKEN = "nemesis_admin_access_token";
const ADMIN_REFRESH = "nemesis_admin_refresh_token";
const ADMIN_ROLES = "nemesis_admin_roles";

function readRoles(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function savePanelAuth(panel, accessToken, refreshToken, roles = []) {
  if (panel === "super") {
    localStorage.setItem(SUPER_TOKEN, accessToken);
    if (refreshToken) localStorage.setItem(SUPER_REFRESH, refreshToken);
    localStorage.setItem(SUPER_ROLES, JSON.stringify(roles));
    return;
  }

  localStorage.setItem(ADMIN_TOKEN, accessToken);
  if (refreshToken) localStorage.setItem(ADMIN_REFRESH, refreshToken);
  localStorage.setItem(ADMIN_ROLES, JSON.stringify(roles));
}

export function getSuperAdminAccessToken() {
  return localStorage.getItem(SUPER_TOKEN);
}

export function getAdminAccessToken() {
  return localStorage.getItem(ADMIN_TOKEN);
}

export function getCurrentAccessToken() {
  return (
    getSuperAdminAccessToken() ||
    getAdminAccessToken() ||
    null
  );
}

export function getSuperAdminRefreshToken() {
  return localStorage.getItem(SUPER_REFRESH);
}

export function getAdminRefreshToken() {
  return localStorage.getItem(ADMIN_REFRESH);
}

export function getSuperAdminRoles() {
  return readRoles(SUPER_ROLES);
}

export function getAdminRoles() {
  return readRoles(ADMIN_ROLES);
}

export function isSuperAdmin() {
  return getSuperAdminRoles().includes("SuperAdmin");
}

export function isAdmin() {
  return getAdminRoles().includes("Admin");
}

export function clearSuperAdminAuth() {
  localStorage.removeItem(SUPER_TOKEN);
  localStorage.removeItem(SUPER_REFRESH);
  localStorage.removeItem(SUPER_ROLES);
}

export function clearAdminAuth() {
  localStorage.removeItem(ADMIN_TOKEN);
  localStorage.removeItem(ADMIN_REFRESH);
  localStorage.removeItem(ADMIN_ROLES);
}

export function clearAllAdminAuth() {
  clearSuperAdminAuth();
  clearAdminAuth();
}

export async function loginForPanel(emailOrPhoneNumber, password, panel) {
  const res = await fetch(`${API_BASE_URL}/api/Auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      emailOrPhoneNumber,
      password,
    }),
  });

  const result = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(result?.message || "Giriş uğursuz oldu");
  }

  const data = result?.data || result;

  const accessToken = data.accessToken || data.token;
  const refreshToken = data.refreshToken;
  const roles =
  data.roles ||
  (data.role ? [data.role] : []);

  if (!accessToken) {
    throw new Error("Access token gəlmədi");
  }

  if (panel === "super") {
    if (!roles.includes("SuperAdmin")) {
      throw new Error("Bu panelə yalnız SuperAdmin daxil ola bilər");
    }

    clearAdminAuth();
    savePanelAuth("super", accessToken, refreshToken, roles);
    return data;
  }

  if (panel === "admin") {
    if (!roles.includes("Admin")) {
      throw new Error("Bu panelə yalnız Admin daxil ola bilər");
    }

    clearSuperAdminAuth();
    savePanelAuth("admin", accessToken, refreshToken, roles);
    return data;
  }

  throw new Error("Panel tipi yanlışdır");
}

/* Köhnə kodlarda import error olmasın deyə saxlayırıq */
export async function adminLogin(emailOrPhoneNumber, password) {
  return loginForPanel(emailOrPhoneNumber, password, "super");
}

export function saveAdminAuth(accessToken, refreshToken, roles = []) {
  savePanelAuth("admin", accessToken, refreshToken, roles);
}

