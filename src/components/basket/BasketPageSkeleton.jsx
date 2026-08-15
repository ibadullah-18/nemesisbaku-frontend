import SkeletonBlock from "../common/SkeletonBlock";

const basketItems = Array.from({ length: 3 });

export default function BasketPageSkeleton() {
  return (
    <main
      className="min-h-screen bg-[#fafafa] px-5 py-7 md:px-8 md:py-10"
      role="status"
      aria-live="polite"
      aria-label="Səbət hazırlanır"
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-7 text-center">
          <SkeletonBlock className="mx-auto h-4 w-28 rounded-md" />
          <SkeletonBlock className="mx-auto mt-3 h-11 w-44 rounded-xl" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_370px]">
          <section className="space-y-3">
            <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-4 shadow-[0_12px_35px_rgba(0,0,0,0.035)]">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-6 w-6 rounded-[8px]" />
                <SkeletonBlock className="h-4 w-24 rounded-md" />
              </div>

              <SkeletonBlock className="h-4 w-10 rounded-md bg-zinc-200" />
            </div>

            {basketItems.map((_, index) => (
              <article
                key={index}
                className="rounded-[18px] bg-white p-3 shadow-[0_14px_40px_rgba(0,0,0,0.04)] md:p-4"
              >
                <div className="flex gap-3 md:gap-4">
                  <SkeletonBlock className="mt-2 h-6 w-6 shrink-0 rounded-[8px]" />

                  <SkeletonBlock className="h-[112px] w-[92px] shrink-0 rounded-[14px] md:h-[132px] md:w-[108px]" />

                  <div className="min-w-0 flex-1">
                    <SkeletonBlock className="h-5 w-[82%] rounded-md" />
                    <SkeletonBlock className="mt-2 h-4 w-[45%] rounded-md bg-zinc-200" />

                    <div className="mt-4 flex gap-2">
                      <SkeletonBlock className="h-7 w-16 rounded-md" />
                      <SkeletonBlock className="h-7 w-14 rounded-md bg-zinc-200" />
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <SkeletonBlock className="h-9 w-24 rounded-[10px]" />
                      <SkeletonBlock className="h-5 w-20 rounded-md" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="h-fit rounded-[18px] bg-white p-5 shadow-[0_16px_48px_rgba(0,0,0,0.045)]">
            <SkeletonBlock className="h-6 w-36 rounded-lg" />

            <div className="mt-6 space-y-4">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between"
                >
                  <SkeletonBlock className="h-4 w-28 rounded-md bg-zinc-200" />
                  <SkeletonBlock className="h-4 w-20 rounded-md" />
                </div>
              ))}
            </div>

            <div className="my-5 h-px bg-zinc-100" />

            <div className="flex items-end justify-between">
              <SkeletonBlock className="h-4 w-20 rounded-md" />
              <SkeletonBlock className="h-9 w-28 rounded-lg" />
            </div>

            <SkeletonBlock className="mt-5 h-14 w-full rounded-[14px] bg-zinc-300" />
            <SkeletonBlock className="mt-3 h-13 w-full rounded-[14px] bg-zinc-200" />
          </aside>
        </div>
      </div>
    </main>
  );
}