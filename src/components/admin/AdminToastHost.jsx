import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi";
import { ADMIN_TOAST_EVENT } from "../../utils/adminToast";

const TOAST_LIFETIME = 8000;
const MAX_TOASTS = 4;

function createToastId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `admin-toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function AdminToastHost() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) window.clearTimeout(timer);
    timersRef.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    const timers = timersRef.current;

    function handleToast(event) {
      const message = String(event.detail?.message || "").trim();
      if (!message) return;

      const toast = {
        id: createToastId(),
        message,
        type: event.detail?.type === "success" ? "success" : "error",
      };

      setToasts((current) => {
        const unique = current.filter(
          (item) => !(item.message === toast.message && item.type === toast.type),
        );
        return [...unique, toast].slice(-MAX_TOASTS);
      });

      const timer = window.setTimeout(() => removeToast(toast.id), TOAST_LIFETIME);
      timers.set(toast.id, timer);
    }

    window.addEventListener(ADMIN_TOAST_EVENT, handleToast);
    return () => {
      window.removeEventListener(ADMIN_TOAST_EVENT, handleToast);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, [removeToast]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="nb-admin-toast-stack" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => {
        const success = toast.type === "success";

        return (
          <div
            className={`nb-admin-toast ${success ? "is-success" : "is-error"}`}
            key={toast.id}
            role={success ? "status" : "alert"}
          >
            <span className="nb-admin-toast__icon">
              {success ? <FiCheckCircle /> : <FiAlertCircle />}
            </span>
            <div className="nb-admin-toast__copy">
              <strong>{success ? "Uğurlu əməliyyat" : "Xəta baş verdi"}</strong>
              <span>{toast.message}</span>
            </div>
            <button type="button" onClick={() => removeToast(toast.id)} aria-label="Mesajı bağla">
              <FiX />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
