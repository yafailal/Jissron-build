"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CourseCard } from "./CourseCard";
import type { Course } from "@/lib/data/homepage";
import type { Currency } from "@/lib/currency";

interface CourseCarouselProps {
  courses: Course[];
  currency: Currency;
}

export function CourseCarousel({ courses, currency }: CourseCarouselProps) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    if (!ref.current) return;
    const card = ref.current.querySelector("article");
    const cardWidth = card ? card.offsetWidth + 20 : 292;
    ref.current.scrollBy({ left: dir * cardWidth * 2, behavior: "smooth" });
  };

  return (
    <div className="relative mt-7">
      {/* Prev arrow */}
      <button
        onClick={() => scroll(-1)}
        aria-label="Previous"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 rounded-full bg-white border border-line shadow-sm grid place-items-center text-primary hover:bg-bg-hover transition-colors hidden md:grid"
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
      </button>

      {/* Scrollable track */}
      <div
        ref={ref}
        className="flex gap-5 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {courses.map((course, i) => (
          <div key={course.id} className="snap-start shrink-0">
            <CourseCard course={course} index={i} currency={currency} />
          </div>
        ))}
      </div>

      {/* Next arrow */}
      <button
        onClick={() => scroll(1)}
        aria-label="Next"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-10 h-10 rounded-full bg-white border border-line shadow-sm grid place-items-center text-primary hover:bg-bg-hover transition-colors hidden md:grid"
      >
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
