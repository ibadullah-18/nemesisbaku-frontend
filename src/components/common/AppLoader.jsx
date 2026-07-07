export default function AppLoader({ text = "nemesisbaku", visible = true }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[999999999] flex h-dvh w-screen items-center justify-center bg-[#fafafa] animate-[loaderPageIn_0.28s_ease_both]">
      <div className="flex -translate-y-[3vh] flex-col items-center gap-5 animate-[loaderContentIn_0.45s_cubic-bezier(0.22,1,0.36,1)_both]">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-[18px] border border-zinc-950/80" />
          <div className="absolute inset-3 animate-[spin_1.8s_linear_infinite_reverse] rounded-[12px] border border-zinc-400" />

          <div className="absolute inset-0 flex items-center justify-center text-xl font-extrabold text-zinc-950">
            n
          </div>
        </div>

        <p className="text-center text-xs font-extrabold tracking-[0.28em] text-zinc-700">
          {text}
        </p>
      </div>

      <style>
        {`
          @keyframes loaderPageIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

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
        `}
      </style>
    </div>
  );
}