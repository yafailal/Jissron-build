"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gradeAssignmentSubmission } from "@/lib/actions/assignment";

interface Props {
  submissionId: string;
  passingGrade: number;
}

export function GradeAssignmentForm({ submissionId, passingGrade }: Props) {
  const router = useRouter();
  const t = useTranslations("AdminGrading");
  const [grade, setGrade] = useState<number>(passingGrade);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await gradeAssignmentSubmission(submissionId, grade, feedback);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(grade >= passingGrade ? t("gradedPassed") : t("gradedFailed"));
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(t("gradeError"));
    } finally {
      setSubmitting(false);
    }
  }

  const willPass = grade >= passingGrade;

  return (
    <form onSubmit={handleSubmit} className="border-t border-line pt-3 mt-2 space-y-3">
      <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-muted block mb-1">
            {t("gradeLabel")}
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            value={grade}
            onChange={(e) =>
              setGrade(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
            }
            className="h-9 text-[13px]"
          />
          <p className={`text-[10.5px] mt-1 font-semibold ${willPass ? "text-primary-mid" : "text-rose-600"}`}>
            {willPass ? t("pass") : t("fail", { grade: passingGrade })}
          </p>
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-muted block mb-1">
            {t("feedbackLabel")}
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder={t("feedbackPlaceholder")}
            className="w-full text-[12.5px] border border-line rounded-2xl px-2.5 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35 resize-y"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? t("submitting") : t("submitGrade")}
        </Button>
      </div>
    </form>
  );
}
