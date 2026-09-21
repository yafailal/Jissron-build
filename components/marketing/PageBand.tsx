import type { ReactNode } from "react";

interface PageBandProps {
  /** Small uppercase label above the title. */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Buttons / links shown at the end of the band. */
  actions?: ReactNode;
  /** Extra content under the text (search box, tabs, stats…). */
  children?: ReactNode;
  className?: string;
}

/**
 * The page header used across the public site: a full-width green band with a white title,
 * matching the "Unlock your potential" band on the homepage. Content goes below it in `.wrap`.
 */
export function PageBand({ eyebrow, title, description, actions, children, className }: PageBandProps) {
  return (
    <section
      className={`text-white ${className ?? ""}`}
      style={{ background: "linear-gradient(135deg, #064e3b 0%, #0b6b53 62%, #0e7a5a 100%)" }}
    >
      <div className="wrap py-8 sm:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {eyebrow && (
              <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.1em] text-primary-bright">{eyebrow}</div>
            )}
            <h1
              className="font-extrabold leading-[1.1] tracking-[-0.02em] text-white"
              style={{ fontSize: "clamp(26px, 3.4vw, 40px)" }}
            >
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-[640px] text-[15px] font-medium leading-relaxed text-white/85">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
        </div>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
