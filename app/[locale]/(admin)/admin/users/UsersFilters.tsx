"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface UsersFiltersProps {
  categories?: { id: string; name: string }[];
}

export function UsersFilters({ categories = [] }: UsersFiltersProps) {
  const t = useTranslations("AdminUsers");
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(sp.get("q") ?? "");

  // Debounce search input → URL update
  useEffect(() => {
    const handle = setTimeout(() => {
      const current = sp.get("q") ?? "";
      if (search === current) return;
      const next = new URLSearchParams(sp.toString());
      if (search) next.set("q", search);
      else next.delete("q");
      startTransition(() => router.push(`${pathname}?${next.toString()}`));
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(sp.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  };

  const reset = () => {
    setSearch("");
    startTransition(() => router.push(pathname));
  };

  const hasFilters =
    !!search ||
    !!sp.get("role") ||
    !!sp.get("status") ||
    !!sp.get("featured") ||
    !!sp.get("verified") ||
    !!sp.get("categoryId");

  return (
    <div className="bg-white rounded-lg border border-line p-3 mb-3">
      <div className="flex flex-wrap items-end gap-2.5">
        <Field label={t("filters.search")} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("filters.searchPlaceholder")}
              className="w-full h-8 rounded-md border border-line bg-white pl-7 pr-7 text-[12.5px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                aria-label={t("filters.clearSearch")}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </Field>
        <Field label={t("filters.role")}>
          <select
            value={sp.get("role") ?? "all"}
            onChange={(e) => set("role", e.target.value)}
            className="h-8 rounded-md border border-line bg-white px-2 text-[12.5px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">{t("filters.allRoles")}</option>
            <option value="STUDENT">{t("roles.STUDENT")}</option>
            <option value="INSTRUCTOR">{t("roles.INSTRUCTOR")}</option>
            <option value="ADMIN">{t("roles.ADMIN")}</option>
          </select>
        </Field>
        <Field label={t("filters.status")}>
          <select
            value={sp.get("status") ?? "all"}
            onChange={(e) => set("status", e.target.value)}
            className="h-8 rounded-md border border-line bg-white px-2 text-[12.5px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">{t("filters.allStatuses")}</option>
            <option value="ACTIVE">{t("statuses.ACTIVE")}</option>
            <option value="SUSPENDED">{t("statuses.SUSPENDED")}</option>
          </select>
        </Field>
        <Field label={t("filters.verifiedEmail")}>
          <select
            value={sp.get("verified") ?? "all"}
            onChange={(e) => set("verified", e.target.value)}
            className="h-8 rounded-md border border-line bg-white px-2 text-[12.5px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">{t("filters.all")}</option>
            <option value="yes">{t("filters.verified")}</option>
            <option value="no">{t("filters.pending")}</option>
          </select>
        </Field>
        <Field label={t("filters.featured")}>
          <select
            value={sp.get("featured") ?? "all"}
            onChange={(e) => set("featured", e.target.value)}
            className="h-8 rounded-md border border-line bg-white px-2 text-[12.5px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">{t("filters.any")}</option>
            <option value="yes">{t("filters.featuredOnly")}</option>
          </select>
        </Field>
        <Field label={t("filters.category")}>
          <select
            value={sp.get("categoryId") ?? "all"}
            onChange={(e) => set("categoryId", e.target.value)}
            className="h-8 rounded-md border border-line bg-white px-2 text-[12.5px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[180px]"
            title={t("filters.categoryTitle")}
          >
            <option value="all">{t("filters.allCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className="h-8 px-3 rounded-md border border-line bg-bg-soft text-[12px] font-semibold text-muted hover:bg-bg-hover hover:text-ink transition-colors"
          >
            {t("filters.reset")}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-0.5 ${className ?? ""}`}>
      <span className="text-[10.5px] font-bold uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}
