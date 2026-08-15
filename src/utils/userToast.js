const SHOW_TOAST_EVENT = "nemesisbaku:user-toast";

const ALLOWED_TYPES = new Set(["error", "success", "info", "warning"]);

function createToastId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function showUserToast(message, type = "error", options = {}) {
  if (typeof window === "undefined") return null;

  const normalizedMessage = String(message || "").trim();

  if (!normalizedMessage) return null;

  const normalizedType = ALLOWED_TYPES.has(type) ? type : "info";
  const duration = Math.max(
    1800,
    Math.min(Number(options.duration) || 4200, 10000),
  );

  const id = createToastId();

  window.dispatchEvent(
    new CustomEvent(SHOW_TOAST_EVENT, {
      detail: {
        id,
        message: normalizedMessage,
        type: normalizedType,
        duration,
      },
    }),
  );

  return id;
}

export function getUserErrorMessage(
  error,
  fallback = "Xəta baş verdi. Yenidən yoxlayın.",
) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.data?.message ||
    error?.data?.error ||
    error?.message ||
    fallback
  );
}

export const userToastEventName = SHOW_TOAST_EVENT;