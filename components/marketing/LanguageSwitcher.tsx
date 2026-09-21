"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LOCALES } from "@/i18n/routing";

/** Globe button + menu listing the four languages. Keeps the current page (path and query). */
export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Language");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("label")}
        className="inline-flex items-center gap-2 px-3.5 py-2 border border-white/25 rounded-md text-[12.5px] font-semibold text-white hover:border-primary-bright hover:text-primary-bright transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
        {t(locale as (typeof LOCALES)[number])}
      </button>
      {open && (
        <ul className="absolute bottom-full end-0 z-30 mb-2 w-40 rounded-xl border border-line bg-white p-1.5 shadow-card">
          {LOCALES.map((l) => (
            <li key={l}>
              <Link
                href={pathname}
                locale={l}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-[13px] font-medium hover:bg-primary-softer ${
                  l === locale ? "bg-primary-soft text-primary" : "text-ink"
                }`}
                lang={l}
              >
                {t(l)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
