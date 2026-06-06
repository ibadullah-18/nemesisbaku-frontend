import ProductCard from "../product/ProductCard";

export default function ProductSection({ title, products }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1180px] px-5 py-7 md:px-8 md:py-10">
      <div className="rounded-[34px] bg-white/70 px-3 py-6 shadow-[0_18px_55px_rgba(0,0,0,0.035)] md:px-5 md:py-8">
        <div className="mb-5 text-center">
          <h2 className="text-[25px] font-extrabold tracking-[-0.035em] text-zinc-950 md:text-[32px]">
            {title}
          </h2>

          <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
            sürüşdür
          </p>
        </div>

        <div className="flex justify-start gap-3 overflow-x-auto pb-2 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] md:gap-4 [&::-webkit-scrollbar]:hidden">
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[47%] min-w-[47%] sm:w-[210px] sm:min-w-[210px] md:w-[240px] md:min-w-[240px]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}