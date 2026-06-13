import { apiFetch } from "./apiFetch";

export const basketApi = {
  get: () => apiFetch("/api/Basket"),

  update: (basketItemId, quantity) =>
    apiFetch(`/api/Basket/${basketItemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),

  remove: (basketItemId) =>
    apiFetch(`/api/Basket/${basketItemId}`, {
      method: "DELETE",
    }),

  clear: () =>
    apiFetch("/api/Basket/clear", {
      method: "DELETE",
    }),
};