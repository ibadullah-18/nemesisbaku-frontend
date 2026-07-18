import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function AppLoader({ text = "nemesisbaku", visible = true }) {
  useEffect(() => {
    if (!visible || typeof document === "undefined") return undefined;

    const html = document.documentElement;
    const body = document.body;
    const previousStyles = {
      htmlOverflow: html.style.overflow,
      htmlOverscrollBehavior: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyOverscrollBehavior: body.style.overscrollBehavior,
    };

    body.dataset.nemesisAppLoading = "true";
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    return () => {
      delete body.dataset.nemesisAppLoading;
      html.style.overflow = previousStyles.htmlOverflow;
      html.style.overscrollBehavior = previousStyles.htmlOverscrollBehavior;
      body.style.overflow = previousStyles.bodyOverflow;
      body.style.overscrollBehavior = previousStyles.bodyOverscrollBehavior;
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

      <style>
        {`
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
        `}
      </style>
    </div>,
    document.body,
  );
}