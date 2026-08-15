import SkeletonBlock from "../common/SkeletonBlock";

export default function SearchResultsSkeleton({ count = 6 }) {
  return (
    <div className="space-y-3 pb-12" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 overflow-hidden rounded-[20px] border border-zinc-200/70 bg-white p-3 md:gap-5 md:p-4"
        >
          <SkeletonBlock className="h-[92px] w-[92px] shrink-0 rounded-[16px] md:h-[112px] md:w-[112px]" />

          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-3 w-20 rounded-full" />
            <SkeletonBlock className="mt-3 h-4 w-[72%] max-w-[320px] rounded-full" />
            <SkeletonBlock className="mt-2 h-4 w-[48%] max-w-[210px] rounded-full" />

            <div className="mt-4 flex gap-2">
              <SkeletonBlock className="h-5 w-20 rounded-full" />
              <SkeletonBlock className="h-5 w-14 rounded-full" />
            </div>
          </div>

          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}