import { apiFetch } from "./apiFetch";

export const promoApi = {
  check: ({ code, orderAmount }) =>
    apiFetch("/api/PromoCodes/check", {
      method: "POST",
      body: JSON.stringify({ code, orderAmount }),
    }),
};