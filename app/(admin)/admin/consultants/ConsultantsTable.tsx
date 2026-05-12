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
  Star,
  ChevronDown,
  Check,
  CircleCheck,
  CircleSlash,
  DoorOpen,
  DoorClosed,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { deleteConsultant, bulkDeleteConsultants, setConsultantAvailability } from "./actions";
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
  ratePerSessionMadCents: number;
  ratePerSessionUsdCents: number;
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
  const [, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [availFilter, setAvailFilter] = useState("ALL");
  const [currency, setCurrency] = useState<"MAD" | "USD">("MAD");

  const filtered = useMemo(() => {
    return consultants.filter((c) => {
      if (availFilter === "OPEN" && !c.acceptsNew) return false;
      if (availFilter === "CLOSED" && c.acceptsNew) return false;
      return true;
    });
  }, [consultants, availFilter]);

  const openCount = useMemo(() => filtered.filter((c) => c.acceptsNew).length, [filtered]);
  const closedCount = useMemo(() => filtered.filter((c) => !c.acceptsNew).length, [filtered]);

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
              <Star className="w-3 h-3 text-primary-bright fill-primary-bright shrink-0" />
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
        cell: ({ row }) => {
          const cents = currency === "MAD" ? row.original.ratePerSessionMadCents : row.original.ratePerSessionUsdCents;
          if (cents === 0) return <span className="text-[12px] text-muted">—</span>;
          const v = cents / 100;
          return (
            <span className="text-[12px]">
              {currency === "MAD"
                ? `${v.toLocaleString("en-US", { maximumFractionDigits: 0 })} MAD/session`
                : `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}/session`}
            </span>
          );
        },
      },
      {
        id: "availability",
        header: "Bookings",
        cell: ({ row }) => {
          const open = row.original.acceptsNew;
          const setAvail = (next: boolean) => {
            if (next === open) return;
            startTransition(async () => {
              const res = await setConsultantAvailability(row.original.id, next);
              if (res.ok) {
                toast.success(next ? "Open for new bookings" : "Closed to new bookings");
                router.refresh();
              } else {
                toast.error(res.error ?? "Failed to update availability");
              }
            });
          };
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    title="Click to change availability"
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium hover:opacity-80 transition-opacity cursor-pointer ${
                      open ? "bg-green-100 text-green-700" : "bg-bg-soft text-muted border border-line"
                    }`}
                  />
                }
              >
                {open ? "Open" : "Closed"}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="text-[13px]">
                <DropdownMenuItem disabled={open} onClick={() => setAvail(true)}>
                  {open ? <Check className="w-3.5 h-3.5" /> : <DoorOpen className="w-3.5 h-3.5" />}
                  Open for bookings
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!open} onClick={() => setAvail(false)}>
                  {!open ? <Check className="w-3.5 h-3.5" /> : <DoorClosed className="w-3.5 h-3.5" />}
                  Closed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
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
    [router, currency, startTransition]
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
    <div className="flex items-center gap-2">
      <select
        value={availFilter}
        onChange={(e) => setAvailFilter(e.target.value)}
        className="h-8 rounded-lg border border-line bg-white px-2.5 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="ALL">All availability</option>
        <option value="OPEN">Open for bookings</option>
        <option value="CLOSED">Closed</option>
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
          <CircleCheck size={16} />
        </div>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-muted leading-tight">
            Open
          </p>
          <p className="text-[22px] font-extrabold text-ink tracking-[-0.01em] leading-none mt-0.5">
            {openCount}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-line px-3.5 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-rose-500 text-white grid place-items-center shrink-0">
          <CircleSlash size={16} />
        </div>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-muted leading-tight">
            Closed
          </p>
          <p className="text-[22px] font-extrabold text-ink tracking-[-0.01em] leading-none mt-0.5">
            {closedCount}
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
        searchPlaceholder="Search consultants…"
        filterControls={filterControls}
        belowFilters={statCards}
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
