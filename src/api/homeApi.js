import { apiFetch } from "./apiFetch";

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export async function getActiveCampaigns() {
  try {
    return await apiFetch("/api/PromoPages/active?type=1");
  } catch {
    return [];
  }
}

export async function getActiveBanners() {
  try {
    return await apiFetch("/api/PromoPages/active?type=2");
  } catch {
    return [];
  }
}

export async function getPromoPage(slug) {
  return apiFetch(`/api/PromoPages/${slug}`);
}

export async function getActiveHomeSections() {
  try {
    return await apiFetch("/api/HomeSections/active");
  } catch {
    return [];
  }
}

export function getProducts(params = {}) {
  return apiFetch(`/api/Products${buildQuery(params)}`);
}

export function getStoreInfo() {
  return apiFetch("/api/StoreInfo");
}
function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function trackVisit(pageUrl = "/") {
  let visitorId = localStorage.getItem("nemesis_visitor_id");

  if (!visitorId) {
    visitorId = generateId();
    localStorage.setItem("nemesis_visitor_id", visitorId);
  }

  return apiFetch("/api/Stats/track-visit", {
    method: "POST",
    body: JSON.stringify({
      visitorId,
      pageUrl,
    }),
  });
}
