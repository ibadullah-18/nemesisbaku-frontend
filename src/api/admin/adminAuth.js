import { API_BASE_URL } from "../config";

const ADMIN_ACCESS_TOKEN_KEY = "nemesis_admin_access_token";
const ADMIN_REFRESH_TOKEN_KEY = "nemesis_admin_refresh_token";
const ADMIN_ROLES_KEY = "nemesis_admin_roles";
const ADMIN_USER_KEY = "nemesis_admin_user";

export function saveAdminAuth(accessToken, refreshToken, roles = [], user = null) {
  localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken);

  if (refreshToken) {
    localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken);
  }

  localStorage.setItem(ADMIN_ROLES_KEY, JSON.stringify(roles));
  if (user) localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

export function getAdminAccessToken() {
  return localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
}

export function getAdminRefreshToken() {
  return localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
}

export function getAdminRoles() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_ROLES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function isSuperAdmin() {
  return getAdminRoles().includes("SuperAdmin");
}

export function clearAdminAuth() {
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_ROLES_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

export async function adminLogin(phoneNumber, password) {
  const res = await fetch(`${API_BASE_URL}/api/Auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify({ phoneNumber, password }),
  });

  const result = await res.json().catch(() => null);

  if (!res.ok || result?.success === false) {
    throw new Error(result?.message || "Giriş uğursuz oldu");
  }

  const data = result?.data || result || {};

  const accessToken = data.accessToken || data.token;
  const refreshToken = data.refreshToken || "";
  const roles = data.roles || data.user?.roles || [];

  if (!accessToken) {
    throw new Error("Access token gəlmədi");
  }

  if (!roles.includes("SuperAdmin")) {
    throw new Error("Bu panelə yalnız SuperAdmin daxil ola bilər");
  }

  saveAdminAuth(accessToken, refreshToken, roles, data.user || null);

  return data;
}