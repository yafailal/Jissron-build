"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "@uploadthing/react";
import { generateClientDropzoneAccept, generatePermittedFileTypes } from "uploadthing/client";
import { useUploadThing } from "@/lib/uploadthing";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { cn } from "@/lib/utils";
import { X, Upload, Loader2 } from "lucide-react";
import Image from "next/image";

// Next/Image throws "Failed to construct 'URL': Invalid URL" on malformed values.
// Only treat a value as renderable if it looks like a real URL/path.
function isRenderableImageSrc(v: string | undefined | null): v is string {
  if (!v) return false;
  return /^(https?:\/\/|\/|data:|blob:)/.test(v);
}

interface ImageUploadFieldProps {
  endpoint: keyof OurFileRouter;
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImageUploadField({
  endpoint,
  value,
  onChange,
  label,
  className,
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startUpload, routeConfig } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.ufsUrl) {
        onChange(res[0].ufsUrl);
      }
      setIsUploading(false);
      setError(null);
    },
    onUploadError: (err) => {
      setError(err.message);
      setIsUploading(false);
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      setIsUploading(true);
      setError(null);
      startUpload(acceptedFiles);
    },
    [startUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: generateClientDropzoneAccept(
      generatePermittedFileTypes(routeConfig).fileTypes
    ),
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <p className="text-[13px] font-medium text-ink">{label}</p>
      )}

      {isRenderableImageSrc(value) ? (
        <div className="relative inline-block">
          <div className="relative w-48 h-24 rounded-lg overflow-hidden border border-line bg-bg-soft">
            <Image src={value} alt="Upload preview" fill className="object-contain p-1.5" />
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 bg-white border border-line rounded-full p-0.5 shadow-sm hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted hover:text-red-500" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-line hover:border-primary/50 hover:bg-bg-soft",
            isUploading && "opacity-60 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-muted" />
          )}
          <p className="text-[12px] text-muted text-center">
            {isUploading
              ? "Uploading…"
              : isDragActive
              ? "Drop here"
              : "Drag & drop or click to upload"}
          </p>
        </div>
      )}

      {error && (
        <p className="text-[12px] text-red-500">{error}</p>
      )}
    </div>
  );
}
