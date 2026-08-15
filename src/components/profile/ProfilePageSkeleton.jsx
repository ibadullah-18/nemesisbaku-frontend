import SkeletonBlock from "../common/SkeletonBlock";

const actionItems = Array.from({ length: 4 });

export default function ProfilePageSkeleton() {
  return (
    <main
      className="min-h-screen bg-[#fafafa] px-5 py-7 md:px-8 md:py-10"
      role="status"
      aria-live="polite"
      aria-label="Profil hazırlanır"
    >
      <div className="mx-auto max-w-[1180px]">
        <section className="overflow-hidden rounded-[22px] bg-[#111] shadow-[0_22px_70px_rgba(0,0,0,0.12)]">
          <div className="p-5 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <SkeletonBlock
                dark
                className="h-4 w-28 rounded-md"
              />

              <SkeletonBlock
                dark
                className="h-9 w-28 rounded-full"
              />
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-[auto_1fr] md:items-end">
              <SkeletonBlock
                dark
                className="mx-auto h-[132px] w-[132px] rounded-[30px] md:mx-0"
              />

              <div className="text-center md:text-left">
                <SkeletonBlock
                  dark
                  className="mx-auto h-12 w-[72%] max-w-[440px] rounded-xl md:mx-0"
                />

                <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                  <SkeletonBlock
                    dark
                    className="h-9 w-36 rounded-full"
                  />
                  <SkeletonBlock
                    dark
                    className="h-9 w-48 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid border-t border-white/10 bg-white/[0.04] md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="border-b border-white/10 px-5 py-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <SkeletonBlock
                  dark
                  className="h-3 w-20 rounded-md"
                />
                <SkeletonBlock
                  dark
                  className="mt-3 h-5 w-40 max-w-full rounded-md"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-2">
          {actionItems.map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-[18px] bg-white px-5 py-5 shadow-[0_14px_40px_rgba(0,0,0,0.04)]"
            >
              <SkeletonBlock className="h-12 w-12 shrink-0 rounded-[15px]" />

              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-5 w-36 rounded-md" />
                <SkeletonBlock className="mt-2 h-4 w-[78%] rounded-md bg-zinc-200" />
              </div>

              <SkeletonBlock className="h-7 w-7 shrink-0 rounded-full bg-zinc-200" />
            </div>
          ))}
        </section>

        <section className="mt-5 flex items-start gap-4 rounded-[18px] bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
          <SkeletonBlock className="h-12 w-12 shrink-0 rounded-[15px]" />

          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-5 w-36 rounded-md" />
            <SkeletonBlock className="mt-3 h-4 w-[88%] rounded-md bg-zinc-200" />
            <SkeletonBlock className="mt-2 h-4 w-[60%] rounded-md bg-zinc-200" />
          </div>
        </section>
      </div>
    </main>
  );
}