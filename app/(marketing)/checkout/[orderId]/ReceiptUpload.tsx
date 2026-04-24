"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "@uploadthing/react";
import { FileText, X } from "lucide-react";
import { saveReceiptUrl } from "@/lib/actions/orders";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

interface ReceiptUploadProps {
  orderId: string;
  existingUrl: string | null;
}

export function ReceiptUpload({ orderId, existingUrl }: ReceiptUploadProps) {
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
        <h3 className="text-[15px] font-700 text-ink mb-1">
          Got your receipt? Upload it to fast-track processing
        </h3>
        <p className="text-[13px] text-muted font-500">
          Not required — but speeds up verification
        </p>
      </div>

      {uploaded ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <FileText size={16} className="text-green-600 shrink-0" />
          <span className="text-[13px] font-600 text-green-700 flex-1 truncate">Receipt uploaded</span>
          <button
            onClick={() => setUploaded(null)}
            className="text-green-600 hover:text-green-800"
            title="Replace"
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
            button: "bg-primary text-white font-700 text-sm h-10 px-5 rounded-lg hover:bg-primary-hover transition-colors",
            allowedContent: "text-muted text-xs mt-1",
          }}
        />
      )}

      {saving && (
        <p className="text-xs text-muted animate-pulse">Saving receipt…</p>
      )}
    </div>
  );
}
