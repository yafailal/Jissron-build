"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
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
  const t = useTranslations("AdminPayouts");
  const [, startTransition] = useTransition();
  const [confirmMark, setConfirmMark] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);

  const doMark = () => {
    startTransition(async () => {
      const res = await markInstructorPaidOut(row.instructorId);
      if (res.ok) {
        toast.success(t("toastMarked", { count: res.data?.count ?? 0 }));
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
        toast.success(t("toastReset", { count: res.data?.count ?? 0 }));
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-primary-soft text-primary">
            {t("cutPlatform", { percent: row.platformCutPercent })}
          </span>
          <span className="text-[10.5px] text-muted block mt-0.5">
            {t("cutInstructor", { percent: 100 - row.platformCutPercent })}
          </span>
        </td>
        <td className="px-4 py-3 text-end">
          {hasPending ? (
            <>
              <span className="text-[15px] font-extrabold text-amber-700">
                {fmtMad(row.pending.instructorOwedCents)}
              </span>
              <p className="text-[10.5px] text-muted mt-0.5">
                {t("orders", { count: row.pending.orders })}
              </p>
            </>
          ) : (
            <span className="text-[12px] text-muted">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-end text-[13px] font-semibold text-ink">
          {fmtMad(row.totals.instructorEarnedCents)}
          <p className="text-[10.5px] text-muted mt-0.5">
            {t("orders", { count: row.totals.orders })}
          </p>
        </td>
        <td className="px-4 py-3 text-end">
          {row.paidOut.orders > 0 ? (
            <>
              <span className="text-[13px] font-semibold text-primary-mid">
                {fmtMad(row.paidOut.instructorPaidCents)}
              </span>
              <p className="text-[10.5px] text-muted mt-0.5">
                {t("orders", { count: row.paidOut.orders })}
              </p>
            </>
          ) : (
            <span className="text-[12px] text-muted">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-end text-[13px] font-semibold text-ink">
          {fmtMad(row.totals.platformEarnedCents)}
        </td>
        <td className="px-4 py-3 text-end">
          <div className="inline-flex items-center gap-1">
            {hasPending && (
              <button
                type="button"
                onClick={() => setConfirmMark(true)}
                className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-primary text-white text-[11.5px] font-bold hover:bg-primary-hover transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" />
                {t("markPaid")}
              </button>
            )}
            {row.paidOut.orders > 0 && (
              <button
                type="button"
                onClick={() => setConfirmUndo(true)}
                className="inline-flex items-center gap-1 h-7 px-3 rounded-full border border-line text-[11.5px] font-semibold text-muted hover:text-ink hover:bg-bg-soft transition-colors"
                title={t("resetTitle")}
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
        title={t("confirmMarkTitle", { amount: fmtMad(row.pending.instructorOwedCents) })}
        description={t("confirmMarkDesc", { name: row.name, count: row.pending.orders })}
        confirmLabel={t("confirmMarkLabel")}
        onConfirm={doMark}
      />
      <ConfirmDialog
        open={confirmUndo}
        onOpenChange={(o) => !o && setConfirmUndo(false)}
        title={t("confirmUndoTitle", { name: row.name })}
        description={t("confirmUndoDesc")}
        confirmLabel={t("confirmUndoLabel")}
        destructive
        onConfirm={doUndo}
      />
    </>
  );
}
