import { ExternalLink, AlertCircle } from "lucide-react";

interface PdfLessonProps {
  pdfUrl: string | null;
}

export function PdfLesson({ pdfUrl }: PdfLessonProps) {
  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <AlertCircle size={32} className="text-muted/40" />
        <p className="text-[14px] font-600 text-ink">PDF not yet available</p>
        <p className="text-[13px] text-muted font-500">Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="w-full rounded-xl overflow-hidden border border-line" style={{ height: "70vh", minHeight: "400px" }}>
        <iframe
          src={pdfUrl}
          className="w-full h-full"
          title="PDF lesson"
        />
      </div>
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="inline-flex items-center gap-1.5 text-[13px] font-600 text-primary hover:underline"
      >
        <ExternalLink size={13} />
        Download PDF
      </a>
    </div>
  );
}
