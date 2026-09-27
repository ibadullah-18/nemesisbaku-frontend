import { useEffect, useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ProductCard from "../product/ProductCard";

export default function ProductSection({ title, products, hasMore = false, moreLoading = false, onLoadMore, moreLabel = "Daha çox", loadingLabel = "Yüklənir..." }) {
  const rowRef = useRef(null);
  const pending = useRef(null);

  useEffect(() => {
    if (pending.current === null || products.length <= pending.current) {
      return;
    }

    const row = rowRef.current;
    const first = row?.querySelectorAll("[data-product-item]")[pending.current];

    pending.current = null;

    if (first) {
      row.scrollTo({
        left:
          row.scrollLeft +
          first.getBoundingClientRect().left -
          row.getBoundingClientRect().left,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth"
      });
    }
  }, [products.length]);

  if (!products || products.length === 0) return null;

  function scrollProducts(direction) {
    const row = rowRef.current;
    if (!row) return;

    const card = row.querySelector("[data-product-item]");
    const cardWidth = card?.getBoundingClientRect().width || 240;
    const styles = window.getComputedStyle(row);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 16;

    row.scrollBy({
      left: direction === "right" ? cardWidth + gap : -(cardWidth + gap),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return (
    <section className="nemesis-home-product-section">
      <div className="nemesis-home-product-section__surface relative px-3 py-6 md:px-5 md:py-8">
        <div className="mb-5 text-center">
          <h2 className="text-[25px] font-extrabold tracking-[-0.035em] text-zinc-950 md:text-[32px]">
            {title}
          </h2>

        </div>

        <button
          type="button"
          onClick={() => scrollProducts("left")}
          className="nb-section-arrow nb-section-arrow--prev"
          aria-label="Sola sürüşdür"
        >
          <FiChevronLeft />
        </button>

        <button
          type="button"
          onClick={() => scrollProducts("right")}
          className="nb-section-arrow nb-section-arrow--next"
          aria-label="Sağa sürüşdür"
        >
          <FiChevronRight />
        </button>

        <div className="overflow-hidden md:overflow-visible">
          <div
            ref={rowRef}
            className="nemesis-home-product-section__rail flex justify-start gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-3 scroll-smooth md:gap-4 [-ms-overflow-style:auto] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-track]:bg-transparent"
            style={{
              touchAction: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                data-product-item
                className="nemesis-home-product-section__card w-[47%] min-w-[47%] shrink-0 sm:w-[210px] sm:min-w-[210px] md:w-[240px] md:min-w-[240px]"
              >
                <ProductCard product={product} />
              </div>
            ))}

            {hasMore && (
              <div className="nb-section-more nemesis-home-product-section__card w-[47%] min-w-[47%] shrink-0 sm:w-[210px] sm:min-w-[210px] md:w-[240px] md:min-w-[240px]">
                <button
                  type="button"
                  disabled={moreLoading}
                  onClick={() => {
                    pending.current = products.length;
                    onLoadMore?.();
                  }}
                >
                  <FiChevronRight aria-hidden="true" />
                  <span>{moreLoading ? loadingLabel : moreLabel}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
