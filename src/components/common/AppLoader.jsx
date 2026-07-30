import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const GLOBAL_LOCK_KEY = "__nemesisAppLoaderScrollLock";

function createOwnerId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `loader-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getScrollLockState() {
  if (typeof window === "undefined") return null;

  if (!window[GLOBAL_LOCK_KEY]) {
    window[GLOBAL_LOCK_KEY] = {
      owners: new Set(),
      previousStyles: null,
    };
  }

  return window[GLOBAL_LOCK_KEY];
}

function lockPageScroll(ownerId) {
  const state = getScrollLockState();
  if (!state || typeof document === "undefined") return;

  const html = document.documentElement;
  const body = document.body;

  if (
    state.owners.size > 0 &&
    body.dataset.nemesisAppLoading !== "true"
  ) {
    state.owners.clear();
    state.previousStyles = null;
  }

  if (state.owners.size === 0) {
    const staleAdminLock =
      body.dataset.nemesisAdminToastHost === "true" &&
      body.dataset.nemesisAppLoading !== "true";

    state.previousStyles = {
      htmlOverflow:
        staleAdminLock && html.style.overflow === "hidden"
          ? ""
          : html.style.overflow,
      htmlOverscrollBehavior: staleAdminLock
        ? ""
        : html.style.overscrollBehavior,
      htmlTouchAction: staleAdminLock ? "" : html.style.touchAction,
      bodyOverflow:
        staleAdminLock && body.style.overflow === "hidden"
          ? ""
          : body.style.overflow,
      bodyOverscrollBehavior: staleAdminLock
        ? ""
        : body.style.overscrollBehavior,
      bodyTouchAction: staleAdminLock ? "" : body.style.touchAction,
    };
  }

  state.owners.add(ownerId);
  body.dataset.nemesisAppLoading = "true";
  body.dataset.nemesisAppLoaderCount = String(state.owners.size);

  html.style.overflow = "hidden";
  html.style.overscrollBehavior = "none";
  html.style.touchAction = "none";
  body.style.overflow = "hidden";
  body.style.overscrollBehavior = "none";
  body.style.touchAction = "none";
}

function unlockPageScroll(ownerId) {
  const state = getScrollLockState();
  if (!state || typeof document === "undefined") return;

  state.owners.delete(ownerId);

  if (state.owners.size > 0) {
    document.body.dataset.nemesisAppLoaderCount = String(state.owners.size);
    return;
  }

  const html = document.documentElement;
  const body = document.body;
  const previous = state.previousStyles || {};

  html.style.overflow = previous.htmlOverflow || "";
  html.style.overscrollBehavior = previous.htmlOverscrollBehavior || "";
  html.style.touchAction = previous.htmlTouchAction || "";
  body.style.overflow = previous.bodyOverflow || "";
  body.style.overscrollBehavior = previous.bodyOverscrollBehavior || "";
  body.style.touchAction = previous.bodyTouchAction || "";

  delete body.dataset.nemesisAppLoading;
  delete body.dataset.nemesisAppLoaderCount;
  state.previousStyles = null;
}

export default function AppLoader({ text = "nemesisbaku", visible = true }) {
  const ownerIdRef = useRef(null);

  if (!ownerIdRef.current) {
    ownerIdRef.current = createOwnerId();
  }

  useEffect(() => {
    if (!visible || typeof document === "undefined") return undefined;

    const ownerId = ownerIdRef.current;
    lockPageScroll(ownerId);

    return () => {
      unlockPageScroll(ownerId);
    };
  }, [visible]);

  if (!visible || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-label={text}
      className="fixed inset-0 grid h-[100dvh] w-[100vw] place-items-center bg-white"
      style={{
        zIndex: 2147483647,
        backgroundColor: "#ffffff",
        opacity: 1,
        isolation: "isolate",
        touchAction: "none",
        overscrollBehavior: "none",
      }}
    >
      <div className="flex w-full -translate-y-[3vh] flex-col items-center justify-center gap-5 px-6 text-center animate-[loaderContentIn_0.45s_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-[18px] border border-zinc-950/80 animate-[loaderSpin_1s_linear_infinite]" />
          <div className="absolute inset-3 rounded-[12px] border border-zinc-400 animate-[loaderSpinReverse_1.8s_linear_infinite]" />

          <div className="absolute inset-0 flex items-center justify-center text-xl font-extrabold text-zinc-950">
            n
          </div>
        </div>

        <p className="w-full pl-[0.28em] text-center text-xs font-extrabold tracking-[0.28em] text-zinc-700">
          {text}
        </p>
      </div>

      <style>{`
        @keyframes loaderContentIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes loaderSpin {
          to { transform: rotate(360deg); }
        }

        @keyframes loaderSpinReverse {
          to { transform: rotate(-360deg); }
        }
      `}</style>
    </div>,
    document.body,
  );
}
