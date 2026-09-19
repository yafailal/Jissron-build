"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Placeholder slides — swap for real content later. */
const SLIDES = [
  { title: "Placeholder 1", tone: "bg-primary text-white" },
  { title: "Placeholder 2", tone: "bg-primary-soft text-ink" },
  { title: "Placeholder 3", tone: "bg-primary-mid text-white" },
  { title: "Placeholder 4", tone: "bg-white text-ink border border-line" },
];

const AUTOPLAY_MS = 5000;

/**
 * Large, auto-moving carousel at the top of the homepage: 4 slides, 2 visible on
 * desktop (1 on mobile), with a gap between cards. Pauses on hover/focus and does
 * not autoplay for users who prefer reduced motion.
 */
export function TopCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState(SLIDES.length);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // One step = width of a slide + the gap between slides.
  const step = useCallback(() => {
    const track = trackRef.current;
    const first = track?.children[0] as HTMLElement | undefined;
    const second = track?.children[1] as HTMLElement | undefined;
    if (!first) return 0;
    return second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
  }, []);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const s = step();
    if (!track || !s) return;
    setPositions(Math.max(1, Math.round((track.scrollWidth - track.clientWidth) / s) + 1));
    setActive(Math.min(Math.round(track.scrollLeft / s), Math.round((track.scrollWidth - track.clientWidth) / s)));
  }, [step]);

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      track.scrollTo({ left: index * step(), behavior: "smooth" });
    },
    [step]
  );

  const next = useCallback(() => goTo(active + 1 >= positions ? 0 : active + 1), [goTo, active, positions]);
  const prev = useCallback(() => goTo(active - 1 < 0 ? positions - 1 : active - 1), [goTo, active, positions]);

  useEffect(() => {
    measure();
    const track = trackRef.current;
    track?.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      track?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, next]);

  return (
    <section
      className="bg-white"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6 pt-5 sm:pt-7 pb-6 sm:pb-8">
        <div
          ref={trackRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={slide.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}`}
              className={`snap-start shrink-0 basis-[85%] md:basis-[calc((100%-3rem)/2.5)] aspect-[16/10] md:aspect-[2/1] md:min-h-[260px] lg:min-h-[320px] grid place-items-center rounded-3xl p-8 ${slide.tone}`}
            >
              <h2 className="text-[30px] sm:text-[40px] lg:text-[48px] font-extrabold tracking-[-0.02em]">
                {slide.title}
              </h2>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2" role="tablist" aria-label="Choose slide">
            {Array.from({ length: positions }).map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === active ? "w-8 bg-primary" : "w-2.5 bg-line-strong hover:bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous"
              className="w-10 h-10 rounded-full bg-white border border-line grid place-items-center text-primary hover:bg-bg-hover transition-colors"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next"
              className="w-10 h-10 rounded-full bg-white border border-line grid place-items-center text-primary hover:bg-bg-hover transition-colors"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
