import { useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ProductCard from "../product/ProductCard";

export default function ProductSection({ title, products }) {
  const rowRef = useRef(null);

  if (!products || products.length === 0) return null;

  function scrollProducts(direction) {
    const row = rowRef.current;
    if (!row) return;

    const card = row.querySelector("[data-product-item]");
    const cardWidth = card?.clientWidth || 240;
    const gap = 16;

    row.scrollBy({
      left: direction === "right" ? cardWidth + gap : -(cardWidth + gap),
      behavior: "smooth",
    });
  }

  return (
    <section className="mx-auto max-w-[1180px] px-5 py-7 md:px-8 md:py-10">
      <div className="relative rounded-[18px] bg-white/70 px-3 py-6 shadow-[0_18px_55px_rgba(0,0,0,0.035)] md:px-5 md:py-8">
        <div className="mb-5 text-center">
          <h2 className="text-[25px] font-extrabold tracking-[-0.035em] text-zinc-950 md:text-[32px]">
            {title}
          </h2>

          <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
            sürüşdür
          </p>
        </div>

        <button
          type="button"
          onClick={() => scrollProducts("left")}
          className="absolute -left-10 top-1/2 z-20 hidden h-[150px] w-9 -translate-y-1/2 place-items-center text-3xl font-light text-zinc-900 transition hover:-translate-x-1 md:grid"
          aria-label="Sola sürüşdür"
        >
          <FiChevronLeft />
        </button>

        <button
          type="button"
          onClick={() => scrollProducts("right")}
          className="absolute -right-10 top-1/2 z-20 hidden h-[150px] w-9 -translate-y-1/2 place-items-center text-3xl font-light text-zinc-900 transition hover:translate-x-1 md:grid"
          aria-label="Sağa sürüşdür"
        >
          <FiChevronRight />
        </button>

        <div className="overflow-hidden">
          <div
            ref={rowRef}
            className="flex touch-pan-x justify-start gap-3 overflow-x-auto overscroll-x-contain pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] md:gap-4 [&::-webkit-scrollbar]:hidden"
          >
            {products.map((product) => (
              <div
                key={product.id}
                data-product-item
                className="w-[47%] min-w-[47%] sm:w-[210px] sm:min-w-[210px] md:w-[240px] md:min-w-[240px]"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}