import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

const VISIBLE_TIME_MS = 7000;
const EXIT_TIME_MS = 320;

export default function AdminActionToast({
  message,
  type = "error",
  onClose,
}) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!message) return undefined;

    setClosing(false);

    const exitTimer = window.setTimeout(() => {
      setClosing(true);
    }, VISIBLE_TIME_MS);

    const closeTimer = window.setTimeout(() => {
      onClose?.();
    }, VISIBLE_TIME_MS + EXIT_TIME_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(closeTimer);
    };
  }, [message, type, onClose]);

  if (!message || typeof document === "undefined") return null;

  const success = type === "success";

  return createPortal(
    <div
      className="fixed bottom-5 left-1/2 z-[999999] w-[calc(100vw-32px)] max-w-[440px] -translate-x-1/2 md:bottom-6 md:left-6 md:w-auto md:min-w-[340px] md:translate-x-0"
    >
      <div
        className={`flex w-full items-start gap-3 rounded-[16px] px-4 py-3.5 text-sm font-bold text-white shadow-[0_20px_60px_rgba(0,0,0,0.22)] ${
          success ? "bg-green-600" : "bg-red-600"
        } ${
          closing
            ? "animate-[adminToastOut_.32s_ease_both]"
            : "animate-[adminToastIn_.38s_cubic-bezier(.22,1,.36,1)_both]"
        }`}
        role={success ? "status" : "alert"}
        aria-live={success ? "polite" : "assertive"}
      >
        {success ? (
          <FiCheckCircle className="mt-0.5 shrink-0 text-lg" />
        ) : (
          <FiXCircle className="mt-0.5 shrink-0 text-lg" />
        )}

        <span className="min-w-0 flex-1 leading-6">{message}</span>
      </div>

      <style>{`
        @keyframes adminToastIn {
          from { opacity: 0; transform: translateY(22px) scale(.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes adminToastOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(18px) scale(.97); }
        }
      `}</style>
    </div>,
    document.body,
  );
}