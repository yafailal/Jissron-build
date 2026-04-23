"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable, selectionColumn, type BulkAction } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { deleteCourse, bulkDeleteCourses } from "./actions";
import { formatDistanceToNow } from "date-fns";
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
  updatedAt: Date;
  thumbnailUrl: string | null;
  category: { name: string };
  instructor: { name: string | null };
  _count: { enrollments: number };
};

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

function PriceCell({ cents }: { cents: number }) {
  if (cents === 0) return <span className="text-muted text-[12px]">Free</span>;
  return <span>${(cents / 100).toFixed(2)}</span>;
}

interface Props {
  courses: CourseRow[];
  categories: { id: string; name: string }[];
}

export function CoursesTable({ courses, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && c.category.name !== categoryFilter) return false;
      return true;
    });
  }, [courses, statusFilter, categoryFilter]);

  const columns: ColumnDef<CourseRow>[] = useMemo(
    () => [
      selectionColumn<CourseRow>(),
      {
        id: "title",
        accessorKey: "title",
        header: "Course",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
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
              <p className="font-medium text-ink truncate max-w-[240px]">{row.original.title}</p>
              <p className="text-[11px] text-muted">{row.original.slug}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "category.name",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-[12px] text-muted">{row.original.category.name}</span>
        ),
      },
      {
        accessorKey: "instructor.name",
        header: "Instructor",
        cell: ({ row }) => (
          <span className="text-[12px]">{row.original.instructor.name ?? "—"}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLORS[row.original.status]}`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "priceCents",
        header: "Price",
        cell: ({ row }) => <PriceCell cents={row.original.priceCents} />,
      },
      {
        accessorKey: "_count.enrollments",
        header: "Enrolled",
        cell: ({ row }) => (
          <span className="text-[12px] text-muted">{row.original._count.enrollments}</span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => (
          <span className="text-[12px] text-muted">
            {formatDistanceToNow(new Date(row.original.updatedAt), { addSuffix: true })}
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
                <Pencil className="w-3.5 h-3.5" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/courses/${row.original.slug}`, "_blank")}>
                <Eye className="w-3.5 h-3.5" /> View live
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteId(row.original.id)}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  const bulkActions: BulkAction<CourseRow>[] = [
    {
      label: "Delete selected",
      variant: "destructive",
      action: async (rows) => {
        const ids = rows.map((r) => r.id);
        const result = await bulkDeleteCourses(ids);
        if (result.ok) {
          toast.success(`${ids.length} course(s) deleted`);
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
        <option value="ALL">All statuses</option>
        <option value="PUBLISHED">Published</option>
        <option value="DRAFT">Draft</option>
        <option value="ARCHIVED">Archived</option>
      </select>
      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="h-8 rounded-lg border border-line bg-white px-2.5 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="ALL">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.name}>{c.name}</option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search courses…"
        filterControls={filterControls}
        bulkActions={bulkActions}
        emptyState={
          <div className="space-y-2">
            <p className="text-[14px] font-medium text-ink">No courses yet</p>
            <p className="text-[12px] text-muted">
              <Link href="/admin/courses/new" className="text-primary hover:underline">
                Create your first course →
              </Link>
            </p>
          </div>
        }
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete course?"
        description="This will permanently delete the course and all its modules and lessons. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleteId) return;
          const result = await deleteCourse(deleteId);
          if (result.ok) {
            toast.success("Course deleted");
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
