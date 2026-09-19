"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Undo2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { markInstructorPaidOut, undoInstructorPayout } from "./actions";
import type { InstructorPayoutRow } from "./data";

function fmtMad(cents: number) {
  return `${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })} MAD`;
}

export function PayoutRow({ row }: { row: InstructorPayoutRow }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [confirmMark, setConfirmMark] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);

  const doMark = () => {
    startTransition(async () => {
      const res = await markInstructorPaidOut(row.instructorId);
      if (res.ok) {
        toast.success(`Marked ${res.data?.count ?? 0} order${res.data?.count === 1 ? "" : "s"} as paid out`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
      setConfirmMark(false);
    });
  };

  const doUndo = () => {
    startTransition(async () => {
      const res = await undoInstructorPayout(row.instructorId);
      if (res.ok) {
        toast.success(`Reset ${res.data?.count ?? 0} order${res.data?.count === 1 ? "" : "s"} back to pending`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
      setConfirmUndo(false);
    });
  };

  const hasPending = row.pending.orders > 0;

  return (
    <>
      <tr className="border-b border-line last:border-0 hover:bg-bg-soft/40 transition-colors">
        <td className="px-4 py-3">
          <Link href={`/admin/users/${row.instructorId}`} className="block group">
            <p className="font-semibold text-ink group-hover:text-primary transition-colors">{row.name}</p>
            <p className="text-[11.5px] text-muted">{row.email}</p>
          </Link>
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-primary-soft text-primary">
            {row.platformCutPercent}% platform
          </span>
          <span className="text-[10.5px] text-muted block mt-0.5">
            {100 - row.platformCutPercent}% to instructor
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          {hasPending ? (
            <>
              <span className="text-[15px] font-extrabold text-orange-600">
                {fmtMad(row.pending.instructorOwedCents)}
              </span>
              <p className="text-[10.5px] text-muted mt-0.5">
                {row.pending.orders} order{row.pending.orders === 1 ? "" : "s"}
              </p>
            </>
          ) : (
            <span className="text-[12px] text-muted">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-right text-[13px] font-semibold text-ink">
          {fmtMad(row.totals.instructorEarnedCents)}
          <p className="text-[10.5px] text-muted mt-0.5">
            {row.totals.orders} order{row.totals.orders === 1 ? "" : "s"}
          </p>
        </td>
        <td className="px-4 py-3 text-right">
          {row.paidOut.orders > 0 ? (
            <>
              <span className="text-[13px] font-semibold text-emerald-700">
                {fmtMad(row.paidOut.instructorPaidCents)}
              </span>
              <p className="text-[10.5px] text-muted mt-0.5">
                {row.paidOut.orders} order{row.paidOut.orders === 1 ? "" : "s"}
              </p>
            </>
          ) : (
            <span className="text-[12px] text-muted">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-right text-[13px] font-semibold text-ink">
          {fmtMad(row.totals.platformEarnedCents)}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="inline-flex items-center gap-1">
            {hasPending && (
              <button
                type="button"
                onClick={() => setConfirmMark(true)}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-primary text-white text-[11.5px] font-bold hover:bg-primary-hover transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" />
                Mark paid
              </button>
            )}
            {row.paidOut.orders > 0 && (
              <button
                type="button"
                onClick={() => setConfirmUndo(true)}
                className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-line text-[11.5px] font-semibold text-muted hover:text-ink hover:bg-bg-soft transition-colors"
                title="Reset payouts to pending"
              >
                <Undo2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </td>
      </tr>

      <ConfirmDialog
        open={confirmMark}
        onOpenChange={(o) => !o && setConfirmMark(false)}
        title={`Mark ${fmtMad(row.pending.instructorOwedCents)} as paid out?`}
        description={`This records that you've transferred the pending share for "${row.name}" (${row.pending.orders} order${row.pending.orders === 1 ? "" : "s"}). It will move out of "Pending" into "Already paid".`}
        confirmLabel="Yes, mark as paid"
        onConfirm={doMark}
      />
      <ConfirmDialog
        open={confirmUndo}
        onOpenChange={(o) => !o && setConfirmUndo(false)}
        title={`Reset all of ${row.name}'s payouts to pending?`}
        description="This undoes every prior payout for this instructor — useful for correcting mistakes. They'll all reappear under Pending."
        confirmLabel="Yes, reset"
        destructive
        onConfirm={doUndo}
      />
    </>
  );
}
