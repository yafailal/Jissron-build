"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { SiteSettings } from "@/lib/data/homepage";

function Countdown({ endsAt }: { endsAt: Date | null }) {
  const [display, setDisplay] = useState("--:--:--");

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const diff = Math.max(0, endsAt.getTime() - Date.now());
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setDisplay(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return <span className="font-bold tabular text-primary-bright">{display}</span>;
}

function BannerItem({
  settings,
  endsAt,
  ariaHidden,
}: {
  settings: SiteSettings;
  endsAt: Date | null;
  ariaHidden?: boolean;
}) {
  return (
    <div
      aria-hidden={ariaHidden}
      className="flex items-center gap-3 px-6 leading-none whitespace-nowrap shrink-0"
    >
      <span className="bg-primary-bright text-primary text-[11.5px] font-bold tracking-[0.04em] uppercase px-2.5 py-1 rounded-[4px] leading-none">
        {settings.urgencyTag}
      </span>
      <span>
        {settings.urgencyMessage}
        {endsAt && (
          <>
            {" · Ends in "}
            <Countdown endsAt={endsAt} />
          </>
        )}
      </span>
      <Link
        href={settings.urgencyCtaUrl}
        tabIndex={ariaHidden ? -1 : undefined}
        className="border-b border-white/40 pb-px font-semibold hover:border-primary-bright transition-colors"
      >
        {settings.urgencyCtaLabel}
      </Link>
    </div>
  );
}

export function UrgencyBanner({ settings }: { settings: SiteSettings }) {
  if (!settings.urgencyEnabled) return null;

  const endsAt = settings.urgencyEndsAt ? new Date(settings.urgencyEndsAt) : null;

  return (
    <div className="bg-primary text-white text-[13.5px] font-medium py-3 marquee">
      <div className="marquee-track">
        <BannerItem settings={settings} endsAt={endsAt} />
        <BannerItem settings={settings} endsAt={endsAt} ariaHidden />
      </div>
    </div>
  );
}
