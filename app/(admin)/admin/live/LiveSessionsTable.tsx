"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable, selectionColumn, type BulkAction } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  CalendarClock,
  History,
  ChevronDown,
  Check,
  Radio,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { deleteLiveSession, bulkDeleteLiveSessions, setLiveSessionStatus } from "./actions";
import { format, isPast } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type LiveStatus = "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";

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
  priceMadCents: number;
  priceUsdCents: number;
  isFree: boolean;
  isFeatured: boolean;
  host: { id: string; name: string | null };
  _count: { bookings: number };
};

const KIND_COLORS: Record<string, string> = {
  AMA: "bg-purple-100 text-purple-700",
  WORKSHOP: "bg-blue-100 text-blue-700",
  SEMINAR: "bg-teal-100 text-teal-700",
  COHORT: "bg-orange-100 text-orange-700",
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-primary-soft text-primary",
  LIVE: "bg-green-100 text-green-700",
  ENDED: "bg-bg-soft text-muted border border-line",
  CANCELLED: "bg-red-100 text-red-600",
};

interface Props {
  sessions: SessionRow[];
  hosts: { id: string; name: string | null; email: string }[];
}

export function LiveSessionsTable({ sessions, hosts }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<"ALL" | "UPCOMING" | "PAST">("ALL");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [hostFilter, setHostFilter] = useState("ALL");
  const [currency, setCurrency] = useState<"MAD" | "USD">("MAD");

  // Build instructor list from hosts who actually have sessions (deduped).
  // Falls back to the prop list if it's larger (covers hosts with zero sessions too).
  const hostOptions = useMemo(() => {
    const fromSessions = new Map<string, string>();
    for (const s of sessions) {
      if (!fromSessions.has(s.host.id)) {
        fromSessions.set(s.host.id, s.host.name ?? "Unnamed");
      }
    }
    const merged = new Map(fromSessions);
    for (const h of hosts) {
      if (!merged.has(h.id)) merged.set(h.id, h.name ?? h.email);
    }
    return Array.from(merged, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [sessions, hosts]);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (timeFilter === "UPCOMING" && isPast(new Date(s.startsAt))) return false;
      if (timeFilter === "PAST" && !isPast(new Date(s.startsAt))) return false;
      if (kindFilter !== "ALL" && s.kind !== kindFilter) return false;
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (hostFilter !== "ALL" && s.host.id !== hostFilter) return false;
      return true;
    });
  }, [sessions, timeFilter, kindFilter, statusFilter, hostFilter]);

  const upcomingCount = useMemo(
    () => filtered.filter((s) => !isPast(new Date(s.startsAt))).length,
    [filtered]
  );
  const pastCount = useMemo(
    () => filtered.filter((s) => isPast(new Date(s.startsAt))).length,
    [filtered]
  );

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
        cell: ({ row }) => {
          const current = row.original.status as LiveStatus;
          const setStatus = (next: LiveStatus) => {
            if (next === current) return;
            startTransition(async () => {
              const res = await setLiveSessionStatus(row.original.id, next);
              if (res.ok) {
                toast.success(`Session set to ${next.toLowerCase()}`);
                router.refresh();
              } else {
                toast.error(res.error ?? "Failed to update status");
              }
            });
          };
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    title="Click to change status"
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLORS[current] ?? ""} hover:opacity-80 transition-opacity cursor-pointer`}
                  />
                }
              >
                {current}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="text-[13px]">
                <DropdownMenuItem disabled={current === "SCHEDULED"} onClick={() => setStatus("SCHEDULED")}>
                  {current === "SCHEDULED" ? <Check className="w-3.5 h-3.5" /> : <CalendarClock className="w-3.5 h-3.5" />}
                  Scheduled
                </DropdownMenuItem>
                <DropdownMenuItem disabled={current === "LIVE"} onClick={() => setStatus("LIVE")}>
                  {current === "LIVE" ? <Check className="w-3.5 h-3.5" /> : <Radio className="w-3.5 h-3.5" />}
                  Live
                </DropdownMenuItem>
                <DropdownMenuItem disabled={current === "ENDED"} onClick={() => setStatus("ENDED")}>
                  {current === "ENDED" ? <Check className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Ended
                </DropdownMenuItem>
                <DropdownMenuItem disabled={current === "CANCELLED"} onClick={() => setStatus("CANCELLED")}>
                  {current === "CANCELLED" ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  Cancelled
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
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
        cell: ({ row }) => {
          if (row.original.isFree) return <span className="text-[12px] text-muted">Free</span>;
          const cents = currency === "MAD" ? row.original.priceMadCents : row.original.priceUsdCents;
          const v = cents / 100;
          return (
            <span className="text-[12px]">
              {currency === "MAD"
                ? `${v.toLocaleString("en-US", { maximumFractionDigits: 0 })} MAD`
                : `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
            </span>
          );
        },
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
    [router, currency, startTransition]
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
      <select
        value={hostFilter}
        onChange={(e) => setHostFilter(e.target.value)}
        className="h-8 rounded-lg border border-line bg-white px-2.5 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[180px]"
      >
        <option value="ALL">All instructors</option>
        {hostOptions.map((h) => (
          <option key={h.id} value={h.id}>{h.name}</option>
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
        <div className="w-9 h-9 rounded-md bg-violet-500 text-white grid place-items-center shrink-0">
          <CalendarClock size={16} />
        </div>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-muted leading-tight">
            Upcoming
          </p>
          <p className="text-[22px] font-extrabold text-ink tracking-[-0.01em] leading-none mt-0.5">
            {upcomingCount}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-line px-3.5 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-slate-400 text-white grid place-items-center shrink-0">
          <History size={16} />
        </div>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-muted leading-tight">
            Past
          </p>
          <p className="text-[22px] font-extrabold text-ink tracking-[-0.01em] leading-none mt-0.5">
            {pastCount}
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
        searchPlaceholder="Search sessions…"
        filterControls={filterControls}
        belowFilters={statCards}
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
