"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  categories: Option[];
  languages: Option[];
  instructors: Option[];
  students: Option[];
}

export function AnalyticsFilters({ categories, languages, instructors, students }: Props) {
  const router = useRouter();
  const t = useTranslations("AdminAnalytics");
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(sp.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    if (key === "period" && value !== "custom") {
      next.delete("from");
      next.delete("to");
    }
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  };

  const reset = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const v = (k: string) => sp.get(k) ?? "";
  const period = v("period") || "thisMonth";

  return (
    <div className="bg-white rounded-2xl border border-line p-3 mb-2 relative">
      {isPending && (
        <div className="absolute top-2 end-2 text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}
      <div className="flex flex-wrap items-end gap-2.5">
        <Field label={t("filterPeriod")}>
          <select
            value={period}
            onChange={(e) => set("period", e.target.value)}
            className="h-8 rounded-full border border-line bg-white px-3 text-[12.5px] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35"
          >
            <option value="today">{t("period.today")}</option>
            <option value="thisWeek">{t("period.thisWeek")}</option>
            <option value="thisMonth">{t("period.thisMonth")}</option>
            <option value="lastMonth">{t("period.lastMonth")}</option>
            <option value="all">{t("period.all")}</option>
            <option value="custom">{t("period.customShort")}</option>
          </select>
        </Field>
        {period === "custom" && (
          <>
            <Field label={t("filterFrom")}>
              <input
                type="date"
                value={v("from")}
                onChange={(e) => set("from", e.target.value || null)}
                className="h-8 rounded-full border border-line bg-white px-3 text-[12.5px] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35"
              />
            </Field>
            <Field label={t("filterTo")}>
              <input
                type="date"
                value={v("to")}
                onChange={(e) => set("to", e.target.value || null)}
                className="h-8 rounded-full border border-line bg-white px-3 text-[12.5px] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35"
              />
            </Field>
          </>
        )}
        <Field label={t("filterType")}>
          <select
            value={v("type") || "all"}
            onChange={(e) => set("type", e.target.value)}
            className="h-8 rounded-full border border-line bg-white px-3 text-[12.5px] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35"
          >
            <option value="all">{t("all")}</option>
            <option value="course">{t("type.course")}</option>
            <option value="live">{t("typeLive")}</option>
            <option value="consult">{t("type.consult")}</option>
          </select>
        </Field>
        <Field label={t("filterCategory")}>
          <select
            value={v("categoryId") || "all"}
            onChange={(e) => set("categoryId", e.target.value)}
            className="h-8 rounded-full border border-line bg-white px-3 text-[12.5px] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35 max-w-[160px]"
          >
            <option value="all">{t("all")}</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("filterLanguage")}>
          <select
            value={v("language") || "all"}
            onChange={(e) => set("language", e.target.value)}
            className="h-8 rounded-full border border-line bg-white px-3 text-[12.5px] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35"
          >
            <option value="all">{t("all")}</option>
            {languages.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("filterTeacher")}>
          <select
            value={v("instructorId") || "all"}
            onChange={(e) => set("instructorId", e.target.value)}
            className="h-8 rounded-full border border-line bg-white px-3 text-[12.5px] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35 max-w-[180px]"
          >
            <option value="all">{t("all")}</option>
            {instructors.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("filterStudent")}>
          <select
            value={v("studentId") || "all"}
            onChange={(e) => set("studentId", e.target.value)}
            className="h-8 rounded-full border border-line bg-white px-3 text-[12.5px] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35 max-w-[180px]"
          >
            <option value="all">{t("all")}</option>
            {students.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <button
          onClick={reset}
          className="h-8 rounded-full border border-line bg-bg-soft px-3.5 text-[12px] font-semibold text-muted hover:bg-bg-hover hover:text-ink transition-colors"
        >
          {t("reset")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10.5px] font-bold uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}
