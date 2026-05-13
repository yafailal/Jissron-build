import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Award, ShieldCheck, ShieldAlert, Printer, ExternalLink } from "lucide-react";

interface PageProps {
  params: Promise<{ serial: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { serial } = await params;
  const cert = await db.certificate.findUnique({
    where: { serialNumber: serial.toUpperCase() },
    select: { studentName: true, courseTitle: true },
  });
  if (!cert) return { title: "Certificate not found" };
  return {
    title: `Certificate — ${cert.studentName} · ${cert.courseTitle}`,
    description: `Verified completion of "${cert.courseTitle}" on JissrON.`,
  };
}

export default async function CertificatePage({ params }: PageProps) {
  const { serial } = await params;

  const cert = await db.certificate.findUnique({
    where: { serialNumber: serial.toUpperCase() },
    include: {
      course: { select: { slug: true } },
    },
  });

  if (!cert) notFound();

  const issuedDate = cert.issuedAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-bg-soft py-8 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 print:px-0">
        {/* Verification banner — hidden on print */}
        <div
          className={`mb-5 px-4 py-3 rounded-lg border flex items-center gap-2 text-[13px] font-600 print:hidden ${
            cert.revoked
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {cert.revoked ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          {cert.revoked ? (
            <>
              <strong className="font-700">This certificate has been revoked.</strong>
              {cert.revokedReason && <span className="font-500">— {cert.revokedReason}</span>}
            </>
          ) : (
            <span>
              Verified authentic — issued by JissrON on{" "}
              <strong className="font-700">{issuedDate}</strong>
            </span>
          )}
        </div>

        {/* Certificate body */}
        <div className="relative bg-white border border-line rounded-lg shadow-card overflow-hidden print:shadow-none print:border-0 print:rounded-none">
          {/* Top accent band */}
          <div className="h-2 bg-gradient-to-r from-primary via-primary-bright to-primary" />

          <div className="px-8 sm:px-12 py-10 sm:py-14 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-soft border border-primary/20 mb-4">
              <Award className="w-8 h-8 text-primary" />
            </div>

            <p className="text-[11px] tracking-[0.4em] font-700 text-muted uppercase mb-1">
              Certificate of Completion
            </p>
            <p className="text-[11px] tracking-[0.3em] text-muted mb-8">
              JissrON · Online Learning Platform
            </p>

            <p className="text-[13px] text-muted font-500 mb-3">This certifies that</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-700 text-ink mb-6 leading-tight">
              {cert.studentName}
            </h1>

            <p className="text-[13px] text-muted font-500 mb-2">has successfully completed</p>
            <p className="font-serif text-xl sm:text-2xl text-ink italic mb-6 leading-snug">
              {cert.courseTitle}
            </p>

            <p className="text-[13px] text-muted font-500 mb-1">taught by</p>
            <p className="text-[15px] font-700 text-ink mb-10">{cert.instructorName}</p>

            {/* Footer details */}
            <div className="border-t border-line pt-6 grid grid-cols-2 gap-6 max-w-md mx-auto text-left">
              <div>
                <p className="text-[10px] tracking-[0.2em] font-700 text-muted uppercase mb-1">
                  Issued
                </p>
                <p className="text-[13px] font-700 text-ink">{issuedDate}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] font-700 text-muted uppercase mb-1">
                  Serial Number
                </p>
                <p className="text-[13px] font-700 text-ink font-mono">{cert.serialNumber}</p>
              </div>
            </div>

            <p className="text-[10.5px] text-muted mt-6">
              Verify this certificate at{" "}
              <span className="font-mono font-700">
                jissron.com/certificates/{cert.serialNumber}
              </span>
            </p>
          </div>

          {/* Bottom accent band */}
          <div className="h-2 bg-gradient-to-r from-primary via-primary-bright to-primary" />
        </div>

        {/* Actions — hidden on print */}
        <div className="mt-5 flex items-center justify-center gap-2 print:hidden">
          <PrintButton />
          <Link
            href={`/courses/${cert.course.slug}`}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-line text-[12px] font-600 text-ink hover:bg-bg-soft transition-colors"
          >
            View course <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </main>
  );
}

function PrintButton() {
  // Client-side print trigger
  return (
    <form action="javascript:window.print()" className="contents">
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-white text-[12px] font-700 hover:bg-primary-hover transition-colors"
      >
        <Printer className="w-3.5 h-3.5" />
        Print / Save as PDF
      </button>
    </form>
  );
}
