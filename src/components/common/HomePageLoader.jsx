export default function HomePageLoader() {
  return (
    <main
      className="relative grid min-h-[calc(100dvh-72px)] place-items-center overflow-hidden bg-[#fafafa]"
      role="status"
      aria-live="polite"
      aria-label="Ana səhifə yüklənir"
    >
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />

      <div className="relative flex items-center gap-2.5 rounded-full bg-white/55 px-5 py-4 shadow-[0_18px_55px_rgba(0,0,0,0.055)] backdrop-blur-md">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-2.5 w-2.5 rounded-full bg-zinc-950 animate-[homeLoadingDot_1.05s_cubic-bezier(.22,1,.36,1)_infinite] motion-reduce:animate-none"
            style={{ animationDelay: `${index * 140}ms` }}
          />
        ))}
      </div>

      <span className="sr-only">Ana səhifə yüklənir</span>

      <style>{`
        @keyframes homeLoadingDot {
          0%, 62%, 100% {
            opacity: .28;
            transform: scale(.72);
          }
          30% {
            opacity: 1;
            transform: scale(1.28);
          }
        }
      `}</style>
    </main>
  );
}