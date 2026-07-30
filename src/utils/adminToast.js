import { useCallback, useRef } from "react";

export const ADMIN_TOAST_EVENT = "nemesis_admin_toast";
export const ADMIN_TOAST_HOST_ATTRIBUTE = "nemesisAdminToastHost";

function normalizeMessage(message) {
  return String(message || "").replace(/\s+/g, " ").trim();
}

export function showAdminToast(message, type = "error") {
  const normalizedMessage = normalizeMessage(message);
  if (!normalizedMessage || typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(ADMIN_TOAST_EVENT, {
      detail: {
        message: normalizedMessage,
        type: type === "success" ? "success" : "error",
      },
    }),
  );
}

export function useAdminToastState(type = "error") {
  const currentMessageRef = useRef("");

  const setMessage = useCallback(
    (nextValue) => {
      const resolvedValue =
        typeof nextValue === "function"
          ? nextValue(currentMessageRef.current)
          : nextValue;
      const normalizedMessage = normalizeMessage(resolvedValue);

      currentMessageRef.current = normalizedMessage;

      if (normalizedMessage) {
        showAdminToast(normalizedMessage, type);
      }
    },
    [type],
  );

  // Köhnə səhifələrdəki yuxarı error/success bannerlərinin render edilməməsi
  // üçün görünən state boş qalır, setter isə mesajı mərkəzi toast-a göndərir.
  return ["", setMessage];
}
