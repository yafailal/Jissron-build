"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Clock, RotateCw, AlertCircle, Award } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { submitQuizAttempt } from "@/lib/actions/quiz";
import { cn } from "@/lib/utils";

type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";

interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  order: number;
  options: string[];
  correctAnswer: string | null;
  explanation: string | null;
}

interface PriorAttempt {
  id: string;
  score: number | null;
  passed: boolean | null;
  completedAt: Date | null;
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean | null;
    pointsEarned: number;
  }>;
}

interface QuizLessonProps {
  quizId: string;
  title: string;
  description: string | null;
  passThreshold: number;
  maxRetries: number;
  showCorrectAnswers: boolean;
  shuffleQuestions: boolean;
  questions: Question[];
  attempts: PriorAttempt[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QuizLesson({
  quizId,
  title,
  description,
  passThreshold,
  maxRetries,
  showCorrectAnswers,
  shuffleQuestions,
  questions,
  attempts,
}: QuizLessonProps) {
  const router = useRouter();
  const sorted = useMemo(
    () => (shuffleQuestions ? shuffle(questions) : [...questions].sort((a, b) => a.order - b.order)),
    [questions, shuffleQuestions]
  );

  const passedAttempt = attempts.find((a) => a.passed === true);
  const lastAttempt = attempts[0]; // newest first from server
  const attemptCount = attempts.length;
  const remainingRetries = maxRetries > 0 ? Math.max(0, maxRetries + 1 - attemptCount) : Infinity;
  const lockedOut = remainingRetries === 0;

  // Show review of last attempt by default if there's one (passed or graded-failed)
  const [mode, setMode] = useState<"review" | "taking">(
    passedAttempt || lastAttempt?.completedAt ? "review" : "taking"
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleAnswerChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    const unanswered = sorted.filter((q) => !answers[q.id]?.trim()).length;
    if (unanswered > 0) {
      toast.error(`Answer all ${sorted.length} questions before submitting (${unanswered} left).`);
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));
      const result = await submitQuizAttempt(quizId, payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { passed, pending, score } = result.data!;
      if (pending) {
        toast.success("Submitted! Some answers need instructor review.");
      } else if (passed) {
        toast.success(`Passed with ${score}% — lesson marked complete.`);
      } else {
        toast.error(`Scored ${score}%. Threshold is ${passThreshold}%.`);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Could not submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startRetry() {
    setAnswers({});
    setMode("taking");
  }

  // ─── REVIEW MODE ─────────────────────────────────────────────────────
  if (mode === "review" && lastAttempt) {
    const isPending = lastAttempt.completedAt === null;
    const answersByQid = new Map(lastAttempt.answers.map((a) => [a.questionId, a]));

    return (
      <div className="space-y-4">
        {/* Result banner */}
        <div
          className={cn(
            "p-4 rounded-xl border flex items-start gap-3",
            isPending
              ? "bg-amber-50 border-amber-200"
              : lastAttempt.passed
              ? "bg-emerald-50 border-emerald-200"
              : "bg-rose-50 border-rose-200"
          )}
        >
          {isPending ? (
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : lastAttempt.passed ? (
            <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={cn(
                "font-bold text-[15px]",
                isPending ? "text-amber-800" : lastAttempt.passed ? "text-emerald-800" : "text-rose-800"
              )}
            >
              {isPending
                ? "Waiting for instructor review"
                : lastAttempt.passed
                ? `Passed — ${lastAttempt.score}%`
                : `Not passed — ${lastAttempt.score}% (need ${passThreshold}%)`}
            </p>
            <p className="text-[12.5px] text-muted mt-0.5">
              {isPending
                ? "Your short-answer responses have been submitted for grading."
                : lastAttempt.passed
                ? "This lesson has been marked complete."
                : remainingRetries === Infinity
                ? "You can retake the quiz."
                : `${remainingRetries} attempt${remainingRetries !== 1 ? "s" : ""} remaining.`}
            </p>
          </div>
          {!lastAttempt.passed && !isPending && !lockedOut && (
            <Button onClick={startRetry} variant="outline" size="sm">
              <RotateCw className="w-3.5 h-3.5 mr-1" />
              Retry
            </Button>
          )}
        </div>

        {/* Show answers if allowed */}
        {showCorrectAnswers && !isPending && (
          <div className="space-y-3">
            {sorted.map((q, i) => {
              const submitted = answersByQid.get(q.id);
              const userAnswer = submitted?.answer ?? "";
              const isCorrect = submitted?.isCorrect;
              return (
                <div
                  key={q.id}
                  className={cn(
                    "p-3 rounded-lg border bg-white",
                    isCorrect === true && "border-emerald-200",
                    isCorrect === false && "border-rose-200",
                    isCorrect === null && "border-amber-200"
                  )}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect === true ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : isCorrect === false ? (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <p className="font-semibold text-[13.5px] text-ink flex-1">
                      {i + 1}. {q.prompt}
                    </p>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wide">
                      {q.points} pt{q.points !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="pl-6 text-[12.5px]">
                    <p className="text-muted">
                      Your answer: <span className="text-ink font-medium">{userAnswer || "—"}</span>
                    </p>
                    {q.correctAnswer && isCorrect !== null && (
                      <p className="text-muted mt-0.5">
                        Correct answer: <span className="text-ink font-medium">{q.correctAnswer}</span>
                      </p>
                    )}
                    {q.explanation && (
                      <p className="text-muted italic mt-1">{q.explanation}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── TAKING MODE ─────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-primary-soft border border-primary/20">
        <p className="text-[15px] font-bold text-primary">{title}</p>
        {description && <p className="text-[13px] text-ink/80 mt-1">{description}</p>}
        <p className="text-[12px] text-muted mt-2">
          Pass threshold: <span className="font-bold">{passThreshold}%</span> · Attempt{" "}
          <span className="font-bold">{attemptCount + 1}</span>
          {maxRetries > 0 && (
            <>
              {" "}
              of <span className="font-bold">{maxRetries + 1}</span>
            </>
          )}
        </p>
      </div>

      {sorted.map((q, i) => (
        <div key={q.id} className="p-4 rounded-lg border border-line bg-white">
          <div className="flex items-start gap-2 mb-3">
            <p className="font-semibold text-[14px] text-ink flex-1">
              {i + 1}. {q.prompt}
            </p>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wide">
              {q.points} pt{q.points !== 1 ? "s" : ""}
            </span>
          </div>

          {q.type === "MULTIPLE_CHOICE" && (
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-colors",
                    answers[q.id] === opt
                      ? "border-primary bg-primary-soft"
                      : "border-line hover:border-primary/30 hover:bg-bg-soft"
                  )}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    className="text-primary"
                  />
                  <span className="text-[13px] text-ink">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "TRUE_FALSE" && (
            <div className="grid grid-cols-2 gap-2">
              {["true", "false"].map((v) => (
                <label
                  key={v}
                  className={cn(
                    "flex items-center justify-center gap-2 p-2.5 rounded-md border cursor-pointer transition-colors",
                    answers[q.id] === v
                      ? "border-primary bg-primary-soft"
                      : "border-line hover:border-primary/30 hover:bg-bg-soft"
                  )}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={v}
                    checked={answers[q.id] === v}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    className="text-primary"
                  />
                  <span className="text-[13px] text-ink capitalize font-semibold">{v}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "SHORT_ANSWER" && (
            <textarea
              value={answers[q.id] ?? ""}
              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              rows={3}
              placeholder="Write your answer…"
              className="w-full text-[13px] border border-line rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
            />
          )}
        </div>
      ))}

      {sorted.length === 0 ? (
        <div className="p-6 text-center bg-bg-soft rounded-lg text-muted text-[13px]">
          This quiz has no questions yet.
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 sticky bottom-0 bg-white border-t border-line py-3 -mx-2 px-2">
          <p className="text-[12px] text-muted">
            {Object.keys(answers).length} of {sorted.length} answered
          </p>
          <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
            {isSubmitting ? "Submitting…" : "Submit quiz"}
          </Button>
        </div>
      )}
    </div>
  );
}
