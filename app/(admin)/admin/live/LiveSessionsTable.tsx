"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable, selectionColumn, type BulkAction } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteLiveSession, bulkDeleteLiveSessions } from "./actions";
import { format, isPast } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SessionRow = {
  id: string;
  title: string;
  slug: string;
  kind: string;
  status: string;
  startsAt: Date;
  durationMins: number;
  seatsTotal: number;
  priceCents: number;
  isFree: boolean;
  isFeatured: boolean;
  host: { name: string | null };
  _count: { bookings: number };
};

const KIND_COLORS: Record<string, string> = {
  AMA: "bg-purple-100 text-purple-700",
  WORKSHOP: "bg-blue-100 text-blue-700",
  SEMINAR: "bg-teal-100 text-teal-700",
  COHORT: "bg-orange-100 text-orange-700",
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-yellow-100 text-yellow-700",
  LIVE: "bg-green-100 text-green-700",
  ENDED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-100 text-red-600",
};

interface Props {
  sessions: SessionRow[];
  hosts: { id: string; name: string | null; email: string }[];
}

export function LiveSessionsTable({ sessions, hosts: _hosts }: Props) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<"ALL" | "UPCOMING" | "PAST">("ALL");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (timeFilter === "UPCOMING" && isPast(new Date(s.startsAt))) return false;
      if (timeFilter === "PAST" && !isPast(new Date(s.startsAt))) return false;
      if (kindFilter !== "ALL" && s.kind !== kindFilter) return false;
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      return true;
    });
  }, [sessions, timeFilter, kindFilter, statusFilter]);

  const columns: ColumnDef<SessionRow>[] = useMemo(
    () => [
      selectionColumn<SessionRow>(),
      {
        accessorKey: "title",
        header: "Session",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-ink">{row.original.title}</p>
            <p className="text-[11px] text-muted">{row.original.slug}</p>
          </div>
        ),
      },
      {
        accessorKey: "kind",
        header: "Kind",
        cell: ({ row }) => (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${KIND_COLORS[row.original.kind] ?? ""}`}>
            {row.original.kind}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLORS[row.original.status] ?? ""}`}>
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "startsAt",
        header: "Starts at",
        cell: ({ row }) => (
          <span className="text-[12px]">
            {format(new Date(row.original.startsAt), "MMM d, yyyy · HH:mm")}
          </span>
        ),
      },
      {
        accessorKey: "host.name",
        header: "Host",
        cell: ({ row }) => (
          <span className="text-[12px] text-muted">{row.original.host.name ?? "—"}</span>
        ),
      },
      {
        id: "seats",
        header: "Seats",
        cell: ({ row }) => (
          <span className="text-[12px] text-muted">
            {row.original._count.bookings} / {row.original.seatsTotal}
          </span>
        ),
      },
      {
        id: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className="text-[12px]">
            {row.original.isFree ? "Free" : `$${(row.original.priceCents / 100).toFixed(2)}`}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 40,
        cell: ({ row }) => {
          const isPastSession = isPast(new Date(row.original.startsAt));
          return (
            <DropdownMenu>
              <DropdownMenuTrigger render={<button className="inline-flex items-center justify-center rounded-md p-1 hover:bg-bg-hover transition-colors" />}>
                <MoreHorizontal className="w-4 h-4 text-muted" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-[13px]">
                <DropdownMenuItem onClick={() => router.push(`/admin/live/${row.original.id}`)}>
                  <Pencil className="w-3.5 h-3.5" />
                  {isPastSession ? "View / Edit recording" : "Edit"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteId(row.original.id)}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router]
  );

  const bulkActions: BulkAction<SessionRow>[] = [
    {
      label: "Delete selected",
      variant: "destructive",
      action: async (rows) => {
        const ids = rows.map((r) => r.id);
        const result = await bulkDeleteLiveSessions(ids);
        if (result.ok) {
          toast.success(`${ids.length} session(s) deleted`);
          router.refresh();
        } else {
          toast.error(result.error);
        }
      },
    },
  ];

  const filterControls = (
    <div className="flex items-center gap-2">
      {(["ALL", "UPCOMING", "PAST"] as const).map((v) => (
        <button
          key={v}
          onClick={() => setTimeFilter(v)}
          className={`h-8 px-3 text-[12px] rounded-lg border transition-colors ${
            timeFilter === v ? "border-primary bg-primary/5 text-primary font-medium" : "border-line text-muted hover:text-ink"
          }`}
        >
          {v === "ALL" ? "All" : v === "UPCOMING" ? "Upcoming" : "Past"}
        </button>
      ))}
      <select
        value={kindFilter}
        onChange={(e) => setKindFilter(e.target.value)}
        className="h-8 rounded-lg border border-line bg-white px-2.5 text-[12px] text-ink focus:outline-none"
      >
        <option value="ALL">All kinds</option>
        {["AMA", "WORKSHOP", "SEMINAR", "COHORT"].map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="h-8 rounded-lg border border-line bg-white px-2.5 text-[12px] text-ink focus:outline-none"
      >
        <option value="ALL">All statuses</option>
        {["SCHEDULED", "LIVE", "ENDED", "CANCELLED"].map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search sessions…"
        filterControls={filterControls}
        bulkActions={bulkActions}
        emptyState={
          <div className="space-y-1">
            <p className="text-[14px] font-medium text-ink">No sessions yet</p>
            <p className="text-[12px] text-muted">
              <Link href="/admin/live/new" className="text-primary hover:underline">
                Schedule your first live session →
              </Link>
            </p>
          </div>
        }
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete session?"
        description="This will permanently delete the session and all its bookings."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleteId) return;
          const result = await deleteLiveSession(deleteId);
          if (result.ok) {
            toast.success("Session deleted");
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
