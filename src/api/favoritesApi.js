import { apiFetch } from "./apiFetch";

export const favoritesApi = {
  list: () => apiFetch("/api/Favorites"),

  add: (productId) =>
    apiFetch(`/api/Favorites/${productId}`, {
      method: "POST",
    }),

  remove: (productId) =>
    apiFetch(`/api/Favorites/${productId}`, {
      method: "DELETE",
    }),

  check: (productId) => apiFetch(`/api/Favorites/check/${productId}`),
};