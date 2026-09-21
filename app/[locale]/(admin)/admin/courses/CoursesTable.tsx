"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable, selectionColumn, type BulkAction } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Eye, BookOpen, FileEdit, Check, CircleDot, Archive, ChevronDown } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { deleteCourse, bulkDeleteCourses, bulkForceDeleteCourses, setCourseStatus } from "./actions";
import { formatDistanceToNow } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { dateFnsLocale } from "@/components/admin/dateLocale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CourseRow = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  level: string;
  priceCents: number;
  priceMadCents: number;
  priceUsdCents: number;
  updatedAt: Date;
  thumbnailUrl: string | null;
  category: { name: string };
  instructor: { id: string; name: string | null };
  _count: { enrollments: number };
};

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  DRAFT: "bg-primary-soft text-primary",
  ARCHIVED: "bg-bg-soft text-muted border border-line",
};

function PriceCell({ cents, currency }: { cents: number; currency: "MAD" | "USD" }) {
  const t = useTranslations("AdminCourses");
  if (cents === 0) return <span className="text-muted text-[12px]">{t("free")}</span>;
  const v = cents / 100;
  if (currency === "MAD") {
    return <span>{v.toLocaleString("en-US", { maximumFractionDigits: 0 })} MAD</span>;
  }
  return <span>${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>;
}

interface Props {
  courses: CourseRow[];
  categories: { id: string; name: string }[];
}

export function CoursesTable({ courses, categories }: Props) {
  const t = useTranslations("AdminCourses");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [instructorFilter, setInstructorFilter] = useState("ALL");
  const [currency, setCurrency] = useState<"MAD" | "USD">("MAD");

  // Unique instructors derived from the loaded courses (deduped by id).
  const instructors = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courses) {
      if (!map.has(c.instructor.id)) {
        map.set(c.instructor.id, c.instructor.name ?? t("unnamed"));
      }
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [courses, t]);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && c.category.name !== categoryFilter) return false;
      if (instructorFilter !== "ALL" && c.instructor.id !== instructorFilter) return false;
      return true;
    });
  }, [courses, statusFilter, categoryFilter, instructorFilter]);

  const publishedCount = useMemo(
    () => filtered.filter((c) => c.status === "PUBLISHED").length,
    [filtered]
  );
  const draftCount = useMemo(
    () => filtered.filter((c) => c.status === "DRAFT").length,
    [filtered]
  );

  const columns: ColumnDef<CourseRow>[] = useMemo(
    () => [
      selectionColumn<CourseRow>(),
      {
        id: "title",
        accessorKey: "title",
        header: t("colCourse"),
        cell: ({ row }) => (
          <Link href={`/admin/courses/${row.original.id}`} className="flex items-center gap-3 group">
            <div className="w-10 h-7 rounded overflow-hidden bg-bg-soft shrink-0">
              {row.original.thumbnailUrl ? (
                <Image
                  src={row.original.thumbnailUrl}
                  alt=""
                  width={40}
                  height={28}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-primary/10" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-ink truncate max-w-[240px] group-hover:text-primary transition-colors">{row.original.title}</p>
              <p className="text-[11px] text-muted">{row.original.slug}</p>
            </div>
          </Link>
        ),
      },
      {
        accessorKey: "category.name",
        header: t("colCategory"),
        cell: ({ row }) => (
          <span className="text-[12px] text-muted">{row.original.category.name}</span>
        ),
      },
      {
        accessorKey: "instructor.name",
        header: t("colInstructor"),
        cell: ({ row }) => (
          <span className="text-[12px]">{row.original.instructor.name ?? "—"}</span>
        ),
      },
      {
        accessorKey: "status",
        header: t("colStatus"),
        cell: ({ row }) => {
          const current = row.original.status;
          const setStatus = (next: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
            if (next === current) return;
            startTransition(async () => {
              const res = await setCourseStatus(row.original.id, next);
              if (res.ok) {
                toast.success(t("statusSet", { status: t(`statusLower.${next}`) }));
                router.refresh();
              } else {
                toast.error(res.error ?? t("statusUpdateFailed"));
              }
            });
          };
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    title={t("changeStatusTitle")}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLORS[current]} hover:opacity-80 transition-opacity cursor-pointer`}
                  />
                }
              >
                {t(`statusBadge.${current}`)}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="text-[13px]">
                <DropdownMenuItem disabled={current === "PUBLISHED"} onClick={() => setStatus("PUBLISHED")}>
                  {current === "PUBLISHED" ? <Check className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {t("statusPublished")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={current === "DRAFT"} onClick={() => setStatus("DRAFT")}>
                  {current === "DRAFT" ? <Check className="w-3.5 h-3.5" /> : <CircleDot className="w-3.5 h-3.5" />}
                  {t("statusDraft")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled={current === "ARCHIVED"} onClick={() => setStatus("ARCHIVED")}>
                  {current === "ARCHIVED" ? <Check className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                  {t("statusArchived")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
      {
        accessorKey: "priceCents",
        header: t("colPrice"),
        cell: ({ row }) => (
          <PriceCell
            cents={currency === "MAD" ? row.original.priceMadCents : row.original.priceUsdCents}
            currency={currency}
          />
        ),
      },
      {
        accessorKey: "_count.enrollments",
        header: t("colEnrolled"),
        cell: ({ row }) => (
          <span className="text-[12px] text-muted">{row.original._count.enrollments}</span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: t("colUpdated"),
        cell: ({ row }) => (
          <span className="text-[12px] text-muted">
            {formatDistanceToNow(new Date(row.original.updatedAt), { addSuffix: true, locale: dateFnsLocale(locale) })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 40,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger render={<button className="inline-flex items-center justify-center rounded-md p-1 hover:bg-bg-hover transition-colors" />}>
              <MoreHorizontal className="w-4 h-4 text-muted" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-[13px]">
              <DropdownMenuItem onClick={() => router.push(`/admin/courses/${row.original.id}`)}>
                <Pencil className="w-3.5 h-3.5" /> {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/courses/${row.original.slug}`, "_blank")}>
                <Eye className="w-3.5 h-3.5" /> {t("viewLive")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteId(row.original.id)}
              >
                <Trash2 className="w-3.5 h-3.5" /> {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [currency, router, t, locale]
  );

  const bulkActions: BulkAction<CourseRow>[] = [
    {
      label: t("deleteSelected"),
      variant: "destructive",
      action: async (rows) => {
        const ids = rows.map((r) => r.id);
        const result = await bulkDeleteCourses(ids);
        if (result.ok) {
          toast.success(t("bulkDeleted", { count: ids.length }));
          router.refresh();
        } else {
          toast.error(result.error);
        }
      },
    },
    {
      label: t("forceDelete"),
      variant: "destructive",
      action: async (rows) => {
        const ids = rows.map((r) => r.id);
        const titles = rows.map((r) => `“${r.title}”`).join(", ");
        const confirmed = window.confirm(
          t("forceConfirm", { count: ids.length, titles })
        );
        if (!confirmed) return;
        const second = window.prompt(t("forcePrompt", { count: ids.length }));
        if (second !== "DELETE") {
          toast.error(t("forceCancelled"));
          return;
        }
        const result = await bulkForceDeleteCourses(ids);
        if (result.ok) {
          const c = result.data?.counts;
          toast.success(
            t("forceDeleted", { count: c?.courses ?? ids.length }) +
              (c
                ? t("forceDeletedExtra", {
                    lessons: c.lessons,
                    quizzes: c.quizzes,
                    assignments: c.assignments,
                  })
                : "")
          );
          router.refresh();
        } else {
          toast.error(result.error);
        }
      },
    },
  ];

  const filterControls = (
    <div className="flex items-center gap-2">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="h-8 rounded-lg border border-line bg-white px-2.5 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="ALL">{t("allStatuses")}</option>
        <option value="PUBLISHED">{t("statusPublished")}</option>
        <option value="DRAFT">{t("statusDraft")}</option>
        <option value="ARCHIVED">{t("statusArchived")}</option>
      </select>
      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="h-8 rounded-lg border border-line bg-white px-2.5 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="ALL">{t("allCategories")}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.name}>{c.name}</option>
        ))}
      </select>
      <select
        value={instructorFilter}
        onChange={(e) => setInstructorFilter(e.target.value)}
        className="h-8 rounded-lg border border-line bg-white px-2.5 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[180px]"
      >
        <option value="ALL">{t("allInstructors")}</option>
        {instructors.map((i) => (
          <option key={i.id} value={i.id}>{i.name}</option>
        ))}
      </select>
      <div className="inline-flex h-8 rounded-lg border border-line bg-white overflow-hidden text-[11.5px] font-bold">
        <button
          type="button"
          onClick={() => setCurrency("MAD")}
          className={`px-3 transition-colors ${
            currency === "MAD" ? "bg-primary text-white" : "text-muted hover:text-ink"
          }`}
        >
          MAD
        </button>
        <button
          type="button"
          onClick={() => setCurrency("USD")}
          className={`px-3 transition-colors border-l border-line ${
            currency === "USD" ? "bg-primary text-white" : "text-muted hover:text-ink"
          }`}
        >
          USD
        </button>
      </div>
    </div>
  );

  const statCards = (
    <div className="grid grid-cols-2 gap-3 max-w-[480px]">
      <div className="bg-white rounded-lg border border-line px-3.5 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-emerald-500 text-white grid place-items-center shrink-0">
          <BookOpen size={16} />
        </div>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-muted leading-tight">
            {t("statusPublished")}
          </p>
          <p className="text-[22px] font-extrabold text-ink tracking-[-0.01em] leading-none mt-0.5">
            {publishedCount}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-line px-3.5 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-orange-500 text-white grid place-items-center shrink-0">
          <FileEdit size={16} />
        </div>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-muted leading-tight">
            {t("pending")}
          </p>
          <p className="text-[22px] font-extrabold text-ink tracking-[-0.01em] leading-none mt-0.5">
            {draftCount}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder={t("searchPlaceholder")}
        filterControls={filterControls}
        belowFilters={statCards}
        bulkActions={bulkActions}
        emptyState={
          <div className="space-y-2">
            <p className="text-[14px] font-medium text-ink">{t("emptyTitle")}</p>
            <p className="text-[12px] text-muted">
              <Link href="/admin/courses/new" className="text-primary hover:underline">
                {t("emptyCreate")}
              </Link>
            </p>
          </div>
        }
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmLabel={t("delete")}
        destructive
        onConfirm={async () => {
          if (!deleteId) return;
          const result = await deleteCourse(deleteId);
          if (result.ok) {
            toast.success(t("deleted"));
            router.refresh();
          } else {
            toast.error(result.error);
          }
          setDeleteId(null);
        }}
      />
    </>
  );
}
