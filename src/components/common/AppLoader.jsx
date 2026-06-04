export default function AppLoader({ text = "NemesisBaku" }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-[20px] border border-zinc-950/80 animate-spin" />
          <div className="absolute inset-3 rounded-[14px] border border-zinc-400 animate-[spin_1.8s_linear_infinite_reverse]" />
          <div className="absolute inset-0 flex items-center justify-center text-xl font-extrabold tracking-[-0.04em] text-zinc-950">
            N
          </div>
        </div>

        <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-zinc-700">
          {text}
        </p>
      </div>
    </div>
  );
}