"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable, selectionColumn, type BulkAction } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { deleteConsultant, bulkDeleteConsultants } from "./actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ConsultantRow = {
  id: string;
  ratePerSession: number;
  durationMins: number;
  avgRating: number;
  totalSessions: number;
  acceptsNew: boolean;
  isFeatured: boolean;
  skills: string[];
  user: { name: string | null; email: string; image: string | null };
  _count: { bookings: number };
};

interface Props {
  consultants: ConsultantRow[];
}

export function ConsultantsTable({ consultants }: Props) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [availFilter, setAvailFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return consultants.filter((c) => {
      if (availFilter === "OPEN" && !c.acceptsNew) return false;
      if (availFilter === "CLOSED" && c.acceptsNew) return false;
      return true;
    });
  }, [consultants, availFilter]);

  const columns: ColumnDef<ConsultantRow>[] = useMemo(
    () => [
      selectionColumn<ConsultantRow>(),
      {
        id: "name",
        accessorFn: (row) => row.user.name ?? row.user.email,
        header: "Consultant",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 shrink-0">
              {row.original.user.image ? (
                <Image src={row.original.user.image} alt="" width={32} height={32} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary font-semibold text-[13px]">
                  {(row.original.user.name ?? row.original.user.email).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-ink text-[13px]">{row.original.user.name ?? "—"}</p>
              <p className="text-[11px] text-muted truncate">{row.original.user.email}</p>
            </div>
            {row.original.isFeatured && (
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />
            )}
          </div>
        ),
      },
      {
        id: "skills",
        header: "Skills",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {row.original.skills.slice(0, 3).map((s) => (
              <span key={s} className="inline-flex items-center px-1.5 py-0.5 bg-bg-soft border border-line rounded text-[10px] text-muted">
                {s}
              </span>
            ))}
            {row.original.skills.length > 3 && (
              <span className="text-[10px] text-muted">+{row.original.skills.length - 3}</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "ratePerSession",
        header: "Rate",
        cell: ({ row }) => (
          <span className="text-[12px]">${(row.original.ratePerSession / 100).toFixed(0)}/session</span>
        ),
      },
      {
        id: "availability",
        header: "Bookings",
        cell: ({ row }) => (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
            row.original.acceptsNew ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {row.original.acceptsNew ? "Open" : "Closed"}
          </span>
        ),
      },
      {
        accessorKey: "avgRating",
        header: "Rating",
        cell: ({ row }) => (
          <span className="text-[12px] text-muted">
            {row.original.avgRating > 0 ? `${row.original.avgRating.toFixed(1)}★` : "—"}
          </span>
        ),
      },
      {
        accessorKey: "totalSessions",
        header: "Sessions",
        cell: ({ row }) => (
          <span className="text-[12px] text-muted">{row.original.totalSessions}</span>
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
              <DropdownMenuItem onClick={() => router.push(`/admin/consultants/${row.original.id}`)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteId(row.original.id)}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router]
  );

  const bulkActions: BulkAction<ConsultantRow>[] = [
    {
      label: "Delete selected",
      variant: "destructive",
      action: async (rows) => {
        const ids = rows.map((r) => r.id);
        const result = await bulkDeleteConsultants(ids);
        if (result.ok) {
          toast.success(`${ids.length} consultant(s) deleted`);
          router.refresh();
        } else {
          toast.error(result.error);
        }
      },
    },
  ];

  const filterControls = (
    <select
      value={availFilter}
      onChange={(e) => setAvailFilter(e.target.value)}
      className="h-8 rounded-lg border border-line bg-white px-2.5 text-[12px] text-ink focus:outline-none"
    >
      <option value="ALL">All availability</option>
      <option value="OPEN">Open for bookings</option>
      <option value="CLOSED">Closed</option>
    </select>
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search consultants…"
        filterControls={filterControls}
        bulkActions={bulkActions}
        emptyState={
          <div className="space-y-1">
            <p className="text-[14px] font-medium text-ink">No consultants yet</p>
            <p className="text-[12px] text-muted">
              <Link href="/admin/consultants/new" className="text-primary hover:underline">
                Add your first consultant →
              </Link>
            </p>
          </div>
        }
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete consultant?"
        description="This will remove the consultant profile. The user account is kept."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleteId) return;
          const result = await deleteConsultant(deleteId);
          if (result.ok) {
            toast.success("Consultant deleted");
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
