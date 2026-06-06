import { apiFetch } from "./apiFetch";

export function getActiveCampaigns() {
  return apiFetch("/api/Campaigns/active");
}

export function getProducts(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const queryString = query.toString();

  return apiFetch(`/api/Products${queryString ? `?${queryString}` : ""}`);
}

export function getStoreInfo() {
  return apiFetch("/api/StoreInfo");
}

export function trackVisit(pageUrl = "/") {
  let visitorId = localStorage.getItem("nemesis_visitor_id");

  if (!visitorId) {
    visitorId = crypto.randomUUID();
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