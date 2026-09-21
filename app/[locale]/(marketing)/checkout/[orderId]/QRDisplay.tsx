"use client";

import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "next-intl";

interface QRDisplayProps {
  value: string;
}

export function QRDisplay({ value }: QRDisplayProps) {
  const t = useTranslations("Checkout");
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-3 bg-white border border-line rounded-2xl">
        <QRCodeSVG value={value} size={160} />
      </div>
      <p className="text-xs text-muted font-medium text-center">
        {t("qrScan")}
      </p>
    </div>
  );
}
