"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRDisplayProps {
  value: string;
}

export function QRDisplay({ value }: QRDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-3 bg-white border border-line rounded-xl shadow-sm">
        <QRCodeSVG value={value} size={160} />
      </div>
      <p className="text-xs text-muted font-500 text-center">
        Scan with your phone to open this checkout on mobile
      </p>
    </div>
  );
}
