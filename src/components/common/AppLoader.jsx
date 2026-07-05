export default function AppLoader({ text = "nemesisbaku" }) {
  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-[#fafafa]/90 backdrop-blur-md">
      <div className="flex -translate-y-[3vh] flex-col items-center gap-5">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-[18px] border border-zinc-950/80" />
          <div className="absolute inset-3 animate-[spin_1.8s_linear_infinite_reverse] rounded-[12px] border border-zinc-400" />
          <div className="absolute inset-0 flex items-center justify-center text-xl font-extrabold text-zinc-950 [font-family:'Stack_Sans_Headline',Inter,sans-serif]">
            n
          </div>
        </div>

        <p className="text-center text-xs font-extrabold tracking-[0.28em] text-zinc-700 [font-family:]">
          {text}
        </p>
      </div>
    </div>
  );
}
