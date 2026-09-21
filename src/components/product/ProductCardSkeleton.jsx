import SkeletonBlock from "../common/SkeletonBlock";
import "./productCard.css";

export default function ProductCardSkeleton() {
  return (
    <article
      className="nemesis-product-card-skeleton block overflow-hidden rounded-[18px] border border-zinc-100 bg-white shadow-[0_8px_28px_rgba(0,0,0,0.035)]"
      aria-hidden="true"
    >
      <div className="relative aspect-[5/6] overflow-hidden bg-[#f5f5f5]">
        <SkeletonBlock className="h-full w-full" />

        <div className="absolute right-3 top-3">
          <SkeletonBlock className="h-9 w-9 rounded-full bg-zinc-300" />
        </div>

        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
          <SkeletonBlock className="h-1.5 w-6 rounded-full bg-zinc-300" />
          <SkeletonBlock className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
          <SkeletonBlock className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
        </div>
      </div>

      <div className="min-h-[118px] p-3 pt-3.5 sm:p-4 sm:pt-3.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <SkeletonBlock className="h-2.5 w-16 rounded-md bg-zinc-200" />
          <SkeletonBlock className="h-7 w-7 rounded-full bg-zinc-200" />
        </div>

        <div className="min-h-[38px] space-y-2">
          <SkeletonBlock className="h-4 w-[88%] rounded-md" />
          <SkeletonBlock className="h-4 w-[58%] rounded-md bg-zinc-200" />
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-zinc-100 pt-2.5">
          <SkeletonBlock className="h-5 w-16 rounded-md bg-zinc-300" />
          <SkeletonBlock className="h-4 w-12 rounded-md bg-zinc-200" />
        </div>
      </div>
    </article>
  );
}
