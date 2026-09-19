"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";

interface HomeSearchStripProps {
  /** One short line above the search box (e.g. the site tagline, or a greeting when logged in). */
  headline: string;
  placeholder: string;
  categories: { name: string; slug: string }[];
}

/** Slim, catalog-first replacement for the old hero: one line, a search box, category chips. */
export function HomeSearchStrip({ headline, placeholder, categories }: HomeSearchStripProps) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <section className="bg-bg-soft border-b border-line">
      <div className="wrap py-7 sm:py-9">
        <h1 className="text-[22px] sm:text-[30px] font-extrabold tracking-[-0.02em] text-ink leading-tight">
          {headline}
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) router.push(`/courses?search=${encodeURIComponent(q.trim())}`);
          }}
          className="mt-4 flex items-center h-[52px] bg-white border-2 border-line-strong rounded-full pl-5 pr-1.5 gap-3 max-w-[720px] transition-all duration-200 focus-within:border-primary-bright focus-within:ring-[3px] focus-within:ring-[rgba(164,230,53,0.35)]"
        >
          <Search size={20} className="text-muted shrink-0" aria-hidden="true" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            aria-label="Search courses"
            className="flex-1 min-w-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            className="h-10 px-6 bg-primary text-white text-sm font-bold rounded-full hover:bg-primary-hover transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {categories.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/courses?category=${c.slug}`}
                className="shrink-0 px-4 py-2 text-[13px] font-semibold text-primary bg-white border border-line rounded-full whitespace-nowrap hover:border-primary hover:bg-primary hover:text-white transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
