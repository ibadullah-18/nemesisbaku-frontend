import { FiChevronLeft } from "react-icons/fi";
import SkeletonBlock from "../common/SkeletonBlock";

export default function ProductDetailsSkeleton({ onBack }) {
  return (
    <main
      className="nb-product-detail-page min-h-screen px-4 py-5 sm:px-6 md:px-8 md:py-8"
      role="status"
      aria-live="polite"
      aria-label="Məhsul məlumatları hazırlanır"
    >
      <div className="nb-product-detail mx-auto max-w-[1320px]">
        <header className="nb-product-detail__nav">
          <button
            type="button"
            onClick={onBack}
            aria-label="Geri"
            className="nb-product-detail__back"
          >
            <FiChevronLeft />
          </button>

          <div className="nb-product-detail__crumbs">
            <span>nemesisbaku</span>
            <i />
            <SkeletonBlock className="h-3 w-24 rounded-full" />
          </div>
        </header>

        <section className="nb-product-detail__layout">
          <div className="nb-product-gallery">
            <SkeletonBlock className="nb-product-gallery__stage min-h-[570px] w-full" />

            <div className="mt-3 flex gap-2 overflow-hidden">
              {[0, 1, 2, 3, 4].map((item) => (
                <SkeletonBlock
                  key={item}
                  className="aspect-[1.22] w-1/5 shrink-0 rounded-[15px]"
                />
              ))}
            </div>
          </div>

          <div className="nb-product-info">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-28 rounded-full" />
                <SkeletonBlock className="h-2.5 w-20 rounded-full" />
              </div>
              <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full" />
            </div>

            <div className="mt-5 space-y-3">
              <SkeletonBlock className="h-12 w-[88%] rounded-xl" />
              <SkeletonBlock className="h-12 w-[62%] rounded-xl" />
            </div>

            <div className="mt-6 flex items-center gap-3">
              <SkeletonBlock className="h-9 w-32 rounded-lg" />
              <SkeletonBlock className="h-5 w-16 rounded-full" />
            </div>

            <div className="mt-6 space-y-2.5">
              <SkeletonBlock className="h-3.5 w-full rounded-md" />
              <SkeletonBlock className="h-3.5 w-[94%] rounded-md" />
              <SkeletonBlock className="h-3.5 w-[68%] rounded-md" />
            </div>

            <div className="my-7 h-px bg-black/10" />

            <SkeletonBlock className="mb-3 h-3 w-20 rounded-full" />
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((item) => (
                <SkeletonBlock key={item} className="h-10 w-10 rounded-full" />
              ))}
            </div>

            <SkeletonBlock className="mb-3 mt-7 h-3 w-20 rounded-full" />
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4].map((item) => (
                <SkeletonBlock
                  key={item}
                  className="h-12 w-14 rounded-[13px]"
                />
              ))}
            </div>

            <SkeletonBlock className="mt-7 h-14 w-full rounded-[15px]" />
          </div>
        </section>

        <section className="nb-product-assurances" aria-hidden="true">
          {[0, 1, 2].map((item) => (
            <SkeletonBlock
              key={item}
              className="h-[154px] w-full rounded-[20px]"
            />
          ))}
        </section>

        <div className="nb-product-buy-dock" aria-hidden="true">
          <SkeletonBlock className="h-14 w-full rounded-[15px]" />
          <SkeletonBlock className="h-14 w-full rounded-[15px] bg-zinc-300" />
        </div>
      </div>
    </main>
  );
}
