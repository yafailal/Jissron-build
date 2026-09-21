"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { confirmPayment, cancelOrder, saveAdminNote } from "@/lib/actions/orders";

interface OrderActionsProps {
  orderId: string;
  initialNote: string | null;
}

export function OrderActions({ orderId, initialNote }: OrderActionsProps) {
  const router = useRouter();
  const t = useTranslations("AdminOrders");
  const [note, setNote] = useState(initialNote ?? "");
  const [confirmPending, startConfirm] = useTransition();
  const [cancelPending, startCancel] = useTransition();
  const [notePending, startNote] = useTransition();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  function handleConfirm() {
    startConfirm(async () => {
      const result = await confirmPayment(orderId);
      if (result.ok) {
        toast.success(t("toastConfirmed"));
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
        toast.success(t("toastCancelled"));
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
        toast.success(t("toastNoteSaved"));
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Admin note */}
      <div className="bg-white rounded-2xl border border-line p-6">
        <h2 className="text-[13px] font-bold uppercase tracking-[.08em] text-muted mb-3">{t("adminNote")}</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder={t("notePlaceholder")}
          className="w-full px-3 py-2.5 rounded-md border border-line text-[13px] text-ink font-medium resize-none focus:outline-none focus:ring-2 focus-visible:ring-primary-bright/35"
        />
        <button
          onClick={handleSaveNote}
          disabled={notePending}
          className="mt-3 h-9 px-4 rounded-full bg-primary text-white text-[13px] font-bold hover:bg-primary-hover disabled:opacity-60 transition-colors"
        >
          {notePending ? t("saving") : t("saveNote")}
        </button>
      </div>

      {/* Confirm payment */}
      <div className="bg-white rounded-2xl border border-primary-soft p-6">
        <h2 className="text-[13px] font-bold uppercase tracking-[.08em] text-muted mb-2">{t("confirmPaymentTitle")}</h2>
        <p className="text-[13px] text-muted font-medium mb-4 leading-relaxed">
          {t("confirmPaymentDesc")}
        </p>
        <button
          onClick={handleConfirm}
          disabled={confirmPending}
          className="h-10 px-6 rounded-full bg-primary text-white text-[13px] font-bold hover:bg-primary-hover disabled:opacity-60 transition-colors"
        >
          {confirmPending ? t("confirming") : t("confirmPayment")}
        </button>
      </div>

      {/* Cancel order */}
      <div className="bg-white rounded-2xl border border-rose-100 p-6">
        <h2 className="text-[13px] font-bold uppercase tracking-[.08em] text-muted mb-2">{t("cancelOrderTitle")}</h2>
        <p className="text-[13px] text-muted font-medium mb-4 leading-relaxed">
          {t("cancelOrderDesc")}
        </p>

        {!showCancelConfirm ? (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="h-10 px-6 rounded-full border border-rose-300 text-rose-700 text-[13px] font-bold hover:bg-rose-50 transition-colors"
          >
            {t("cancelOrder")}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-red-600">{t("areYouSure")}</span>
            <button
              onClick={handleCancel}
              disabled={cancelPending}
              className="h-9 px-4 rounded-full bg-rose-600 text-white text-[12px] font-bold hover:bg-rose-700 disabled:opacity-60 transition-colors"
            >
              {cancelPending ? t("cancelling") : t("yesCancel")}
            </button>
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="h-9 px-4 rounded-full border border-line text-[12px] font-semibold text-muted hover:text-ink transition-colors"
            >
              {t("goBack")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
