import { apiFetch } from "./apiFetch";

export const ordersApi = {
  create: (body) =>
    apiFetch("/api/Orders", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  my: () => apiFetch("/api/Orders/my"),

  detail: (id) => apiFetch(`/api/Orders/${id}`),
};