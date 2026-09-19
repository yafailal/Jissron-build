"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, XCircle, Clock, Award, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing";
import { submitAssignment } from "@/lib/actions/assignment";
import { cn } from "@/lib/utils";

interface Submission {
  id: string;
  fileUrl: string;
  fileName: string;
  submittedAt: Date;
  grade: number | null;
  feedback: string | null;
  status: string;
  gradedAt: Date | null;
}

interface AssignmentLessonProps {
  assignmentId: string;
  title: string;
  instructions: string;
  maxFileSizeMb: number;
  allowedFileTypes: string[];
  passingGrade: number;
  dueOffsetDays: number | null;
  submissions: Submission[];
}

export function AssignmentLesson({
  assignmentId,
  title,
  instructions,
  maxFileSizeMb,
  allowedFileTypes,
  passingGrade,
  submissions,
}: AssignmentLessonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const latest = submissions[0];
  const hasPassed = latest?.status === "PASSED";
  const isPending = latest?.status === "SUBMITTED" && !latest.gradedAt;
  const wasFailed = latest?.status === "FAILED";

  const { startUpload, isUploading } = useUploadThing("assignmentSubmission", {
    onClientUploadComplete: async (res) => {
      if (!res?.[0]) return;
      setIsSubmitting(true);
      try {
        const result = await submitAssignment(
          assignmentId,
          res[0].url,
          res[0].name ?? "submission"
        );
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Assignment submitted — awaiting instructor review.");
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error("Failed to submit.");
      } finally {
        setIsSubmitting(false);
      }
    },
    onUploadError: (err) => {
      toast.error(err.message);
    },
  });

  const accept = allowedFileTypes.length > 0
    ? allowedFileTypes.map((t) => `.${t}`).join(",")
    : undefined;

  const busy = isUploading || isSubmitting;

  return (
    <div className="space-y-4">
      {/* Title & instructions */}
      <div className="p-4 rounded-xl bg-primary-soft border border-primary/20">
        <p className="text-[15px] font-bold text-primary">{title}</p>
        <p className="text-[12px] text-muted mt-2">
          Passing grade: <span className="font-bold">{passingGrade}%</span> · Max file{" "}
          <span className="font-bold">{maxFileSizeMb} MB</span>
          {allowedFileTypes.length > 0 && (
            <>
              {" "}· Allowed: <span className="font-bold">{allowedFileTypes.join(", ")}</span>
            </>
          )}
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-[13.5px] text-ink/90 whitespace-pre-wrap">
        {instructions}
      </div>

      {/* Latest submission status */}
      {latest && (
        <div
          className={cn(
            "p-4 rounded-xl border flex items-start gap-3",
            isPending && "bg-amber-50 border-amber-200",
            hasPassed && "bg-emerald-50 border-emerald-200",
            wasFailed && "bg-rose-50 border-rose-200"
          )}
        >
          {isPending ? (
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : hasPassed ? (
            <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={cn(
                "font-bold text-[14.5px]",
                isPending && "text-amber-800",
                hasPassed && "text-emerald-800",
                wasFailed && "text-rose-800"
              )}
            >
              {isPending && "Submitted — awaiting review"}
              {hasPassed && `Passed — ${latest.grade}%`}
              {wasFailed && `Not passed — ${latest.grade}%`}
            </p>
            <a
              href={latest.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12.5px] text-primary hover:underline mt-1"
            >
              <FileText className="w-3.5 h-3.5" />
              {latest.fileName}
            </a>
            {latest.feedback && (
              <p className="text-[12.5px] text-ink/80 mt-2 italic">
                <span className="font-bold not-italic">Feedback:</span> {latest.feedback}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Upload / re-upload */}
      {!hasPassed && (
        <div className="p-5 rounded-xl border-2 border-dashed border-line bg-bg-soft/40 text-center">
          <p className="text-[13px] font-semibold text-ink mb-1">
            {latest ? "Submit a new version" : "Upload your submission"}
          </p>
          <p className="text-[11.5px] text-muted mb-3">
            {allowedFileTypes.length > 0
              ? `Accepts ${allowedFileTypes.map((t) => `.${t}`).join(", ")}`
              : "Any file type accepted"} up to {maxFileSizeMb}MB
          </p>
          <label
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-[13px] font-semibold cursor-pointer hover:bg-primary-hover transition-colors",
              busy && "opacity-60 pointer-events-none"
            )}
          >
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > maxFileSizeMb * 1024 * 1024) {
                  toast.error(`File exceeds ${maxFileSizeMb}MB`);
                  return;
                }
                startUpload([f]);
              }}
            />
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isUploading ? "Uploading…" : "Submitting…"}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Choose file
              </>
            )}
          </label>
        </div>
      )}

      {/* Submission history */}
      {submissions.length > 1 && (
        <div>
          <p className="text-[12px] font-bold text-muted uppercase tracking-wide mb-2">
            Previous submissions
          </p>
          <div className="space-y-1.5">
            {submissions.slice(1).map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-md border border-line bg-white"
              >
                {s.status === "PASSED" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : s.status === "FAILED" ? (
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
                <a
                  href={s.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-primary hover:underline truncate"
                >
                  {s.fileName}
                </a>
                <span className="text-muted text-[11px]">
                  {new Date(s.submittedAt).toLocaleDateString("en-GB")}
                </span>
                {s.grade !== null && (
                  <span className="text-[11px] font-bold">{s.grade}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
