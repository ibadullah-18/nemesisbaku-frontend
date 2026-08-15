import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiX,
} from "react-icons/fi";
import { userToastEventName } from "../../utils/userToast";

const MAX_VISIBLE_TOASTS = 3;

const toastVariants = {
  error: {
    icon: FiAlertCircle,
    className:
      "border-red-500/20 bg-red-600 text-white shadow-[0_20px_60px_rgba(220,38,38,0.28)]",
  },
  success: {
    icon: FiCheckCircle,
    className:
      "border-emerald-500/20 bg-emerald-600 text-white shadow-[0_20px_60px_rgba(5,150,105,0.25)]",
  },
  warning: {
    icon: FiAlertCircle,
    className:
      "border-amber-400/20 bg-amber-500 text-white shadow-[0_20px_60px_rgba(245,158,11,0.25)]",
  },
  info: {
    icon: FiInfo,
    className:
      "border-white/10 bg-zinc-950 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)]",
  },
};

function ToastItem({ toast, onRemove }) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const removeTimerRef = useRef(null);

  const closeToast = useCallback(() => {
    if (closingRef.current) return;

    closingRef.current = true;
    setClosing(true);

    removeTimerRef.current = window.setTimeout(() => {
      onRemove(toast.id);
    }, 280);
  }, [onRemove, toast.id]);

  useEffect(() => {
    const timer = window.setTimeout(closeToast, toast.duration);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(removeTimerRef.current);
    };
  }, [closeToast, toast.duration]);

  const variant = toastVariants[toast.type] || toastVariants.info;
  const Icon = variant.icon;

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className={`nemesis-user-toast pointer-events-auto flex min-h-14 w-full items-center gap-3 rounded-[16px] border px-4 py-3 ${
        variant.className
      } ${closing ? "nemesis-user-toast--closing" : ""}`}
    >
      <Icon className="shrink-0 text-[21px]" aria-hidden="true" />

      <p className="min-w-0 flex-1 text-sm font-semibold leading-5">
        {toast.message}
      </p>

      <button
        type="button"
        onClick={closeToast}
        aria-label="Bildirişi bağla"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg text-white/80 transition hover:bg-white/10 hover:text-white active:scale-95"
      >
        <FiX />
      </button>
    </div>
  );
}

export default function UserToastHost() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    function handleToast(event) {
      const nextToast = event.detail;

      if (!nextToast?.message) return;

      setToasts((current) => {
        const isDuplicate = current.some(
          (toast) =>
            toast.message === nextToast.message &&
            toast.type === nextToast.type,
        );

        if (isDuplicate) return current;

        return [...current, nextToast].slice(-MAX_VISIBLE_TOASTS);
      });
    }

    window.addEventListener(userToastEventName, handleToast);

    return () => {
      window.removeEventListener(userToastEventName, handleToast);
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+18px)] left-4 right-4 z-[2147483000] flex flex-col gap-2.5 md:bottom-6 md:left-6 md:right-auto md:w-[390px]"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>,
    document.body,
  );
}