"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { confirmPayment, cancelOrder, saveAdminNote } from "@/lib/actions/orders";

interface OrderActionsProps {
  orderId: string;
  initialNote: string | null;
}

export function OrderActions({ orderId, initialNote }: OrderActionsProps) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote ?? "");
  const [confirmPending, startConfirm] = useTransition();
  const [cancelPending, startCancel] = useTransition();
  const [notePending, startNote] = useTransition();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  function handleConfirm() {
    startConfirm(async () => {
      const result = await confirmPayment(orderId);
      if (result.ok) {
        toast.success("Payment confirmed — student enrolled.");
        router.push("/admin/orders");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleCancel() {
    startCancel(async () => {
      const result = await cancelOrder(orderId);
      if (result.ok) {
        toast.success("Order cancelled.");
        router.push("/admin/orders");
      } else {
        toast.error(result.error);
        setShowCancelConfirm(false);
      }
    });
  }

  function handleSaveNote() {
    startNote(async () => {
      const result = await saveAdminNote(orderId, note);
      if (result.ok) {
        toast.success("Note saved.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Admin note */}
      <div className="bg-white rounded-2xl border border-line p-6">
        <h2 className="text-[13px] font-700 uppercase tracking-[.08em] text-muted mb-3">Admin note</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Internal notes — not visible to the student"
          className="w-full px-3 py-2.5 rounded-lg border border-line text-[13px] text-ink font-500 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          onClick={handleSaveNote}
          disabled={notePending}
          className="mt-3 h-9 px-4 rounded-lg bg-primary text-white text-[13px] font-700 hover:bg-primary-hover disabled:opacity-60 transition-colors"
        >
          {notePending ? "Saving…" : "Save note"}
        </button>
      </div>

      {/* Confirm payment */}
      <div className="bg-white rounded-2xl border border-green-200 p-6">
        <h2 className="text-[13px] font-700 uppercase tracking-[.08em] text-muted mb-2">Confirm payment</h2>
        <p className="text-[13px] text-muted font-500 mb-4 leading-relaxed">
          Marks the order as paid and immediately enrolls the student in the course. An email notification is sent automatically.
        </p>
        <button
          onClick={handleConfirm}
          disabled={confirmPending}
          className="h-10 px-6 rounded-lg bg-green-600 text-white text-[13px] font-700 hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          {confirmPending ? "Confirming…" : "Confirm payment"}
        </button>
      </div>

      {/* Cancel order */}
      <div className="bg-white rounded-2xl border border-red-100 p-6">
        <h2 className="text-[13px] font-700 uppercase tracking-[.08em] text-muted mb-2">Cancel order</h2>
        <p className="text-[13px] text-muted font-500 mb-4 leading-relaxed">
          Marks the order as cancelled. No email is sent. This action cannot be undone.
        </p>

        {!showCancelConfirm ? (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="h-10 px-6 rounded-lg border border-red-300 text-red-600 text-[13px] font-700 hover:bg-red-50 transition-colors"
          >
            Cancel order
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-600 text-red-600">Are you sure?</span>
            <button
              onClick={handleCancel}
              disabled={cancelPending}
              className="h-9 px-4 rounded-lg bg-red-600 text-white text-[12px] font-700 hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {cancelPending ? "Cancelling…" : "Yes, cancel"}
            </button>
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="h-9 px-4 rounded-lg border border-line text-[12px] font-600 text-muted hover:text-ink transition-colors"
            >
              Go back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
