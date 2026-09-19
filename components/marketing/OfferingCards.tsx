/** Large top-of-page section with three equal placeholder cards. Content is placeholder for now. */
export function OfferingCards() {
  return (
    <section className="bg-bg-soft border-b border-line">
      <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 py-10 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="aspect-[3/2] md:min-h-[420px] lg:min-h-[520px] grid place-items-center bg-white border border-line rounded-3xl p-8"
            >
              <h2 className="text-[30px] sm:text-[40px] lg:text-[48px] font-extrabold tracking-[-0.02em] text-ink">
                Placeholder {n}
              </h2>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
