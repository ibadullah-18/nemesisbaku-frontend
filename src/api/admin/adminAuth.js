import { API_BASE_URL } from "../config";

const ADMIN_ACCESS_TOKEN_KEY = "nemesis_admin_access_token";
const ADMIN_REFRESH_TOKEN_KEY = "nemesis_admin_refresh_token";
const ADMIN_ROLES_KEY = "nemesis_admin_roles";

export function saveAdminAuth(accessToken, refreshToken, roles = []) {
  localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(ADMIN_ROLES_KEY, JSON.stringify(roles));
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

export function isSuperAdmin() {
  return getAdminRoles().includes("SuperAdmin");
}

export function clearAdminAuth() {
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_ROLES_KEY);
}

export async function adminLogin(phoneNumber, password) {
  const res = await fetch(`${API_BASE_URL}/api/Auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phoneNumber, password }),
  });

  const result = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(result?.message || "Giriş uğursuz oldu");
  }

  const data = result?.data || result;

  const accessToken = data.accessToken || data.token;
  const refreshToken = data.refreshToken;
  const roles = data.roles || [];

  if (!accessToken) {
    throw new Error("Access token gəlmədi");
  }

  if (!roles.includes("SuperAdmin")) {
    throw new Error("Bu panelə yalnız SuperAdmin daxil ola bilər");
  }

  saveAdminAuth(accessToken, refreshToken, roles);

  return data;
}