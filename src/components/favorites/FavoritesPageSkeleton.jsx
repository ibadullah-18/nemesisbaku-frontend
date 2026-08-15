import SkeletonBlock from "../common/SkeletonBlock";
import ProductCardSkeleton from "../product/ProductCardSkeleton";

const favoriteItems = Array.from({ length: 12 });

export default function FavoritesPageSkeleton() {
  return (
    <main
      className="min-h-screen bg-[#fafafa] px-5 py-7 md:px-8 md:py-10"
      role="status"
      aria-live="polite"
      aria-label="Favoritlər hazırlanır"
    >
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-7 text-center">
          <SkeletonBlock className="mx-auto h-4 w-28 rounded-md" />
          <SkeletonBlock className="mx-auto mt-3 h-11 w-48 rounded-xl" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {favoriteItems.map((_, index) => (
            <div
              key={index}
              className={index >= 6 ? "hidden md:block" : ""}
            >
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}