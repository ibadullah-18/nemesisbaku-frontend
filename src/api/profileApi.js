import { apiFetch } from "./apiFetch";

export const profileApi = {
  get: () => apiFetch("/api/Profile"),

  update: (body) => {
    const formData = new FormData();

    formData.append("FullName", body.fullName || "");
    formData.append("Email", body.email || "");
    formData.append("DateOfBirth", body.dateOfBirth || "");
    formData.append("LoyaltyCardCode", body.loyaltyCardCode || "");

    if (body.profileImage) {
      formData.append("ProfileImage", body.profileImage);
    }

    return apiFetch("/api/Profile", {
      method: "PUT",
      body: formData,
    });
  },

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

  addresses: () => apiFetch("/api/Profile/addresses"),

  createAddress: (body) =>
    apiFetch("/api/Profile/addresses", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateAddress: (id, body) =>
    apiFetch(`/api/Profile/addresses/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteAddress: (id) =>
    apiFetch(`/api/Profile/addresses/${id}`, {
      method: "DELETE",
    }),

  setDefaultAddress: (id) =>
    apiFetch(`/api/Profile/addresses/${id}/default`, {
      method: "PUT",
    }),
    resetPasswordWithOtp: (body) =>
      apiFetch("/api/Auth/reset-password-with-otp", {
        method: "POST",
        body: JSON.stringify(body),
    }),
};