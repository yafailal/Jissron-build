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
    description: `Verified completion of "${cert.courseTitle}" on AILearn.`,
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
          className={`mb-5 px-4 py-3 rounded-2xl border flex items-center gap-2 text-[13px] font-semibold print:hidden ${
            cert.revoked
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-primary-softer border-primary-soft text-primary"
          }`}
        >
          {cert.revoked ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          {cert.revoked ? (
            <>
              <strong className="font-bold">This certificate has been revoked.</strong>
              {cert.revokedReason && <span className="font-medium">— {cert.revokedReason}</span>}
            </>
          ) : (
            <span>
              Verified authentic — issued by AILearn on{" "}
              <strong className="font-bold">{issuedDate}</strong>
            </span>
          )}
        </div>

        {/* Certificate body */}
        <div className="relative bg-white border border-line rounded-2xl overflow-hidden print:shadow-none print:border-0 print:rounded-none">
          {/* Top accent band */}
          <div className="h-2 bg-gradient-to-r from-primary via-primary-bright to-primary" />

          <div className="px-8 sm:px-12 py-10 sm:py-14 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-soft border border-primary/20 mb-4">
              <Award className="w-8 h-8 text-primary" />
            </div>

            <p className="text-[11px] tracking-[0.1em] font-bold text-primary-mid uppercase mb-1">
              Certificate of Completion
            </p>
            <p className="text-[11px] tracking-[0.3em] text-muted mb-8">
              AILearn · Online Learning Platform
            </p>

            <p className="text-[13px] text-muted font-medium mb-3">This certifies that</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-ink mb-6 leading-tight">
              {cert.studentName}
            </h1>

            <p className="text-[13px] text-muted font-medium mb-2">has successfully completed</p>
            <p className="text-xl sm:text-2xl font-bold text-primary mb-6 leading-snug">
              {cert.courseTitle}
            </p>

            <p className="text-[13px] text-muted font-medium mb-1">taught by</p>
            <p className="text-[15px] font-bold text-ink mb-10">{cert.instructorName}</p>

            {/* Footer details */}
            <div className="border-t border-line pt-6 grid grid-cols-2 gap-6 max-w-md mx-auto text-start">
              <div>
                <p className="text-[10px] tracking-[0.2em] font-bold text-muted uppercase mb-1">
                  Issued
                </p>
                <p className="text-[13px] font-bold text-ink">{issuedDate}</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] font-bold text-muted uppercase mb-1">
                  Serial Number
                </p>
                <p className="text-[13px] font-bold text-ink font-mono">{cert.serialNumber}</p>
              </div>
            </div>

            <p className="text-[10.5px] text-muted mt-6">
              Verify this certificate at{" "}
              <span className="font-mono font-bold">
                ailearn.com/certificates/{cert.serialNumber}
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
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border-[1.5px] border-primary text-[13px] font-bold text-primary hover:bg-primary hover:text-white transition-colors"
          >
            View course <ExternalLink className="w-3 h-3 rtl:-scale-x-100" />
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
        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary text-white text-[13px] font-bold hover:bg-primary-hover transition-colors"
      >
        <Printer className="w-3.5 h-3.5" />
        Print / Save as PDF
      </button>
    </form>
  );
}
