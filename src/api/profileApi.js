import { apiFetch } from "./apiFetch";

export const profileApi = {
  get: () => apiFetch("/api/Profile"),

  update: (body) =>
    apiFetch("/api/Profile", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  sendChangePhoneOtp: (newPhoneNumber) =>
    apiFetch("/api/Profile/send-change-phone-otp", {
      method: "POST",
      body: JSON.stringify({ newPhoneNumber }),
    }),

  verifyChangePhone: (newPhoneNumber, code) =>
    apiFetch("/api/Profile/verify-change-phone", {
      method: "POST",
      body: JSON.stringify({ newPhoneNumber, code }),
    }),

  resetPasswordWithOtp: (body) =>
    apiFetch("/api/Auth/reset-password-with-otp", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};