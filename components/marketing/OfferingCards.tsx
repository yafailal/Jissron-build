/** Three equal, large cards at the top of the homepage. Content is placeholder for now. */
export function OfferingCards() {
  return (
    <section className="bg-bg-soft border-b border-line">
      <div className="wrap py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="aspect-[16/9] grid place-items-center bg-white border border-line rounded-2xl p-8"
            >
              <h2 className="text-[26px] sm:text-[32px] font-extrabold tracking-[-0.02em] text-ink">
                Placeholder {n}
              </h2>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
