import SkeletonBlock from "../common/SkeletonBlock";
import ProductCardSkeleton from "../product/ProductCardSkeleton";

const brandItems = Array.from({ length: 10 });
const productItems = Array.from({ length: 12 });

export default function HomePageSkeleton() {
  return (
    <main
      className="min-h-screen bg-[#fafafa] text-zinc-950"
      role="status"
      aria-live="polite"
      aria-label="Ana səhifə hazırlanır"
    >
      <section className="mx-auto max-w-[1180px] px-5 py-5 md:px-8 md:py-6">
        <div className="flex items-center justify-center">
          <SkeletonBlock className="h-5 w-28 rounded-full" />
        </div>

        <div className="mt-5 flex gap-3 overflow-hidden md:justify-center md:gap-4">
          {brandItems.map((_, index) => (
            <div
              key={index}
              className={index >= 6 ? "hidden md:block" : ""}
            >
              <SkeletonBlock className="h-[46px] w-[46px] shrink-0 rounded-full md:h-[54px] md:w-[54px]" />
            </div>
          ))}
        </div>
      </section>

      <section className="w-full">
        <SkeletonBlock className="aspect-[2/3] w-full md:aspect-[2/1]" />
      </section>

      <section className="mx-auto max-w-[1180px] px-5 py-8 md:px-8 md:py-11">
        <div className="mb-6">
          <SkeletonBlock className="h-4 w-28 rounded-md" />
          <SkeletonBlock className="mt-3 h-8 w-52 rounded-lg" />
          <SkeletonBlock className="mt-3 h-4 w-full max-w-[520px] rounded-md bg-zinc-200" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {productItems.map((_, index) => (
            <div
              key={index}
              className={index >= 6 ? "hidden md:block" : ""}
            >
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </section>

      <span className="sr-only">
        Ana səhifənin məlumatları yüklənir
      </span>
    </main>
  );
}