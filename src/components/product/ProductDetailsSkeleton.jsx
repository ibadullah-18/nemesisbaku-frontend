import { FiChevronLeft } from "react-icons/fi";
import SkeletonBlock from "../common/SkeletonBlock";

export default function ProductDetailsSkeleton({ onBack }) {
  return (
    <main
      className="min-h-screen bg-[#fafafa] px-5 py-7 md:px-8 md:py-10"
      role="status"
      aria-live="polite"
      aria-label="Məhsul məlumatları hazırlanır"
    >
      <div className="mx-auto max-w-[1180px]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Geri"
          className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 transition hover:bg-zinc-100 active:scale-95"
        >
          <FiChevronLeft className="text-[24px]" />
        </button>

        <section className="grid gap-7 lg:grid-cols-[minmax(0,650px)_1fr]">
          <div className="grid gap-3 md:grid-cols-[76px_minmax(0,1fr)]">
            <div className="order-2 flex gap-2 overflow-hidden md:order-1 md:flex-col">
              {[0, 1, 2, 3].map((item) => (
                <SkeletonBlock
                  key={item}
                  className="h-[72px] w-[72px] shrink-0 rounded-[14px]"
                />
              ))}
            </div>

            <SkeletonBlock className="order-1 aspect-[4/4.75] max-h-[620px] w-full rounded-[18px] md:order-2" />
          </div>

          <div className="rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.04)] md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="w-full space-y-3">
                <SkeletonBlock className="h-9 w-[88%] rounded-lg" />
                <SkeletonBlock className="h-9 w-[58%] rounded-lg" />
              </div>

              <SkeletonBlock className="h-12 w-12 shrink-0 rounded-[14px]" />
            </div>

            <div className="mt-5 space-y-3">
              <SkeletonBlock className="h-4 w-full rounded-md bg-zinc-200" />
              <SkeletonBlock className="h-4 w-[92%] rounded-md bg-zinc-200" />
              <SkeletonBlock className="h-4 w-[68%] rounded-md bg-zinc-200" />
            </div>

            <div className="mt-6 flex gap-3">
              <SkeletonBlock className="h-9 w-28 rounded-lg" />
              <SkeletonBlock className="h-6 w-20 rounded-md bg-zinc-200" />
            </div>

            <div className="mt-7 flex gap-3">
              {[0, 1, 2, 3].map((item) => (
                <SkeletonBlock
                  key={item}
                  className="h-10 w-10 rounded-full"
                />
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4].map((item) => (
                <SkeletonBlock
                  key={item}
                  className="h-12 w-14 rounded-[12px]"
                />
              ))}
            </div>

            <div className="mt-7 flex items-center gap-3">
              <SkeletonBlock className="h-12 w-32 rounded-[12px]" />
              <SkeletonBlock className="h-12 flex-1 rounded-[12px]" />
            </div>

            <SkeletonBlock className="mt-6 h-14 w-full rounded-[14px] bg-zinc-300" />
            <SkeletonBlock className="mt-3 h-13 w-full rounded-[14px] bg-zinc-200" />
          </div>
        </section>
      </div>
    </main>
  );
}