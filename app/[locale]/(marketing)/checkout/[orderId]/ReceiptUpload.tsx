"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { UploadButton } from "@uploadthing/react";
import { FileText, X } from "lucide-react";
import { saveReceiptUrl } from "@/lib/actions/orders";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

interface ReceiptUploadProps {
  orderId: string;
  existingUrl: string | null;
}

export function ReceiptUpload({ orderId, existingUrl }: ReceiptUploadProps) {
  const t = useTranslations("Checkout.receipt");
  const router = useRouter();
  const [uploaded, setUploaded] = useState<string | null>(existingUrl);
  const [saving, setSaving] = useState(false);

  async function handleUploadComplete(res: { url: string }[]) {
    if (!res[0]) return;
    setSaving(true);
    await saveReceiptUrl(orderId, res[0].url);
    setUploaded(res[0].url);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[15px] font-bold text-ink mb-1">
          {t("title")}
        </h3>
        <p className="text-[13px] text-muted font-medium">
          {t("optional")}
        </p>
      </div>

      {uploaded ? (
        <div className="flex items-center gap-3 p-3 bg-primary-softer border border-primary-soft rounded-2xl">
          <FileText size={16} className="text-primary shrink-0" />
          <span className="text-[13px] font-semibold text-primary flex-1 truncate">{t("uploaded")}</span>
          <button
            onClick={() => setUploaded(null)}
            className="text-primary hover:text-primary-hover"
            title={t("replace")}
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <UploadButton<OurFileRouter, "receiptUploader">
          endpoint="receiptUploader"
          onClientUploadComplete={handleUploadComplete}
          onUploadError={(err) => console.error("Upload error:", err)}
          appearance={{
            button: "bg-primary text-white font-bold text-sm h-9 px-4 rounded-full hover:bg-primary-hover transition-colors",
            allowedContent: "text-muted text-xs mt-1",
          }}
        />
      )}

      {saving && (
        <p className="text-xs text-muted animate-pulse">{t("saving")}</p>
      )}
    </div>
  );
}
