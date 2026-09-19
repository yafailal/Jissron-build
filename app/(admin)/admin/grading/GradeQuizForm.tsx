"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gradeQuizAttempt } from "@/lib/actions/quiz";
import { cn } from "@/lib/utils";

interface PendingQuestion {
  id: string;
  prompt: string;
  points: number;
  expectedAnswer: string | null;
  studentAnswer: string;
}

interface Props {
  attemptId: string;
  pendingQuestions: PendingQuestion[];
}

export function GradeQuizForm({ attemptId, pendingQuestions }: Props) {
  const router = useRouter();
  const [grades, setGrades] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  function setGrade(qid: string, value: boolean) {
    setGrades((prev) => ({ ...prev, [qid]: value }));
  }

  async function handleSubmit() {
    if (Object.keys(grades).length < pendingQuestions.length) {
      toast.error("Grade every short-answer response before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = Object.entries(grades).map(([questionId, isCorrect]) => ({
        questionId,
        isCorrect,
      }));
      const result = await gradeQuizAttempt(attemptId, payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Grades submitted.");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Could not submit grades.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t border-line pt-3 mt-2 space-y-3">
      {pendingQuestions.map((q) => {
        const selected = grades[q.id];
        return (
          <div key={q.id} className="bg-bg-soft/40 border border-line rounded-md p-3">
            <p className="font-semibold text-[13px] text-ink mb-2">
              {q.prompt}{" "}
              <span className="text-[10px] font-bold text-muted uppercase tracking-wide">
                · {q.points} pt{q.points !== 1 ? "s" : ""}
              </span>
            </p>
            {q.expectedAnswer && (
              <p className="text-[11.5px] text-muted mb-1">
                Expected: <span className="text-ink font-medium">{q.expectedAnswer}</span>
              </p>
            )}
            <div className="bg-white border border-line rounded-md p-2.5 text-[12.5px] text-ink mb-2 whitespace-pre-wrap">
              {q.studentAnswer || <span className="italic text-muted">— no answer —</span>}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGrade(q.id, true)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[12px] font-semibold transition-colors",
                  selected === true
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-line text-muted hover:border-emerald-300 hover:text-emerald-700"
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Correct
              </button>
              <button
                type="button"
                onClick={() => setGrade(q.id, false)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[12px] font-semibold transition-colors",
                  selected === false
                    ? "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-line text-muted hover:border-rose-300 hover:text-rose-700"
                )}
              >
                <XCircle className="w-3.5 h-3.5" />
                Incorrect
              </button>
            </div>
          </div>
        );
      })}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} size="sm" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit grades"}
        </Button>
      </div>
    </div>
  );
}
