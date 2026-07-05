import { apiFetch } from "./apiFetch";

export const profileApi = {
  get: () => apiFetch("/api/Profile"),

  update: (body) => {
    const formData = new FormData();

    formData.append("FullName", body.fullName || "");
    formData.append("PhoneNumber", body.phoneNumber || "");
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

  sendChangeEmailOtp: (newEmail) =>
    apiFetch(
      "/api/Profile/send-change-email-otp",
      {
        method: "POST",
        body: JSON.stringify({ newEmail }),
      },
      false
    ),

  verifyChangeEmail: (newEmail, code) =>
    apiFetch(
      "/api/Profile/verify-change-email",
      {
        method: "POST",
        body: JSON.stringify({ newEmail, code }),
      },
      false
    ),

  sendForgotPasswordOtp: (email) =>
    apiFetch(
      "/api/Auth/send-forgot-password-otp",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
      false
    ),

  resetPasswordWithOtp: (body) =>
    apiFetch(
      "/api/Auth/reset-password-with-otp",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      false
    ),

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
};