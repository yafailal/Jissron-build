"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight, Sparkles, Target, LayoutGrid, MessageSquare } from "lucide-react";

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
}
interface MenuCourse {
  id: string;
  title: string;
  slug: string;
}
interface Props {
  categories: MenuCategory[];
  featuredCourses: MenuCourse[];
}

const GOALS: { label: string; query: string }[] = [
  { label: "Learn a language", query: "Languages" },
  { label: "Start an online business", query: "E-Commerce" },
  { label: "Switch careers", query: "Career" },
  { label: "Earn a certificate", query: "Certificate" },
  { label: "Master AI tools", query: "Artificial Intelligence" },
  { label: "Sharpen leadership skills", query: "Leadership" },
];

export function CategoriesMenu({ categories, featuredCourses, accent = false }: Props & { accent?: boolean }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  };
  const onEnter = () => {
    cancelClose();
    setOpen(true);
  };

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={scheduleClose}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-[13.5px] font-medium px-3.5 py-2.5 rounded-lg transition-colors ${
          accent
            ? open
              ? "bg-white/15 text-white"
              : "text-white hover:bg-white/10"
            : open
              ? "bg-bg-hover text-primary"
              : "text-primary hover:bg-bg-hover"
        }`}
      >
        Categories
        <ChevronDown
          size={10}
          strokeWidth={2.5}
          className={`opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          // Megamenu panel
          className="absolute left-0 top-full pt-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="bg-white border border-line rounded-xl shadow-2xl w-[720px] max-w-[90vw] overflow-hidden">
            <div className="grid grid-cols-3 gap-6 p-5">
              {/* New & Featured */}
              <Column
                icon={Sparkles}
                title="New & Featured"
                emptyText="No featured items yet."
                items={featuredCourses.map((c) => ({
                  label: c.title,
                  href: `/courses/${c.slug}`,
                }))}
              />

              {/* Goals */}
              <Column
                icon={Target}
                title="Goals"
                items={GOALS.map((g) => ({
                  label: g.label,
                  href: `/search?q=${encodeURIComponent(g.query)}`,
                }))}
              />

              {/* Categories */}
              <Column
                icon={LayoutGrid}
                title="Categories"
                emptyText="No categories yet."
                items={categories.map((c) => ({
                  label: c.name,
                  href: `/courses?category=${c.slug}`,
                }))}
              />
            </div>

            {/* Footer — Submit a request */}
            <Link
              href="/contact"
              className="flex items-center justify-between gap-2 px-5 py-3 bg-bg-soft border-t border-line text-[13px] font-semibold text-primary hover:bg-primary-soft transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Can&apos;t find what you&apos;re looking for? Submit a request
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Column({
  icon: Icon,
  title,
  items,
  emptyText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: { label: string; href: string }[];
  emptyText?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-line">
        <Icon className="w-3.5 h-3.5 text-muted" />
        <p className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted">{title}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-[11.5px] text-muted">{emptyText ?? "Nothing yet."}</p>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 6).map((it) => (
            <li key={it.href + it.label}>
              <Link
                href={it.href}
                className="block text-[12.5px] text-ink hover:text-primary hover:bg-primary-soft/40 -mx-2 px-2 py-1 rounded transition-colors"
              >
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
