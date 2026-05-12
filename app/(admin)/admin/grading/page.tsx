import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { ClipboardCheck, Clock, FileText, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { GradeAssignmentForm } from "./GradeAssignmentForm";
import { GradeQuizForm } from "./GradeQuizForm";

export const metadata = { title: "Grading — JissrON Admin" };

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

const TABS = [
  { value: "assignments", label: "Assignments" },
  { value: "quizzes", label: "Quizzes" },
] as const;

export default async function GradingPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const activeTab = TABS.find((t) => t.value === tab)?.value ?? "assignments";

  const [pendingAssignments, pendingQuizAttempts] = await Promise.all([
    db.assignmentSubmission.findMany({
      where: { status: "SUBMITTED", gradedAt: null },
      orderBy: { submittedAt: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        assignment: {
          include: {
            lesson: {
              include: {
                module: {
                  include: {
                    course: { select: { id: true, slug: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.quizAttempt.findMany({
      where: { completedAt: null },
      orderBy: { startedAt: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        quiz: {
          include: {
            questions: { orderBy: { order: "asc" } },
            lesson: {
              include: {
                module: {
                  include: {
                    course: { select: { id: true, slug: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Grading"
        description={`${pendingAssignments.length} assignment${pendingAssignments.length !== 1 ? "s" : ""} and ${pendingQuizAttempts.length} quiz attempt${pendingQuizAttempts.length !== 1 ? "s" : ""} awaiting review.`}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/grading?tab=${t.value}`}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-bold border-b-2 -mb-px transition-colors ${
              activeTab === t.value
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.value === "assignments" ? (
              <FileText className="w-3.5 h-3.5" />
            ) : (
              <HelpCircle className="w-3.5 h-3.5" />
            )}
            {t.label}
            <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold bg-bg-soft text-muted">
              {t.value === "assignments" ? pendingAssignments.length : pendingQuizAttempts.length}
            </span>
          </Link>
        ))}
      </div>

      {/* ASSIGNMENTS */}
      {activeTab === "assignments" && (
        <div className="space-y-3">
          {pendingAssignments.length === 0 ? (
            <div className="bg-bg-soft border border-line rounded-lg p-10 text-center">
              <ClipboardCheck className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-[14px] font-bold text-ink">No pending assignments</p>
              <p className="text-[12.5px] text-muted mt-1">
                Student submissions will appear here once they upload.
              </p>
            </div>
          ) : (
            pendingAssignments.map((sub) => {
              const course = sub.assignment.lesson?.module.course;
              return (
                <div
                  key={sub.id}
                  className="bg-white border border-line rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                        <span className="text-[11px] text-muted">
                          {formatDistanceToNow(sub.submittedAt, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="font-bold text-[14.5px] text-ink">
                        {sub.assignment.title}
                      </p>
                      <p className="text-[12px] text-muted">
                        {course?.title ?? "—"} · {sub.user.name ?? sub.user.email}
                      </p>
                    </div>
                    <a
                      href={sub.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line text-[12px] font-semibold text-ink hover:bg-bg-soft"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {sub.fileName}
                    </a>
                  </div>
                  <GradeAssignmentForm
                    submissionId={sub.id}
                    passingGrade={sub.assignment.passingGrade}
                  />
                </div>
              );
            })
          )}
        </div>
      )}

      {/* QUIZZES */}
      {activeTab === "quizzes" && (
        <div className="space-y-3">
          {pendingQuizAttempts.length === 0 ? (
            <div className="bg-bg-soft border border-line rounded-lg p-10 text-center">
              <HelpCircle className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-[14px] font-bold text-ink">No pending quiz attempts</p>
              <p className="text-[12.5px] text-muted mt-1">
                Quizzes with short-answer questions will appear here once submitted.
              </p>
            </div>
          ) : (
            pendingQuizAttempts.map((attempt) => {
              const course = attempt.quiz.lesson?.module.course;
              const answers =
                (attempt.answers as unknown as Array<{
                  questionId: string;
                  answer: string;
                  isCorrect: boolean | null;
                  pointsEarned: number;
                }>) ?? [];
              const pendingQuestionIds = answers
                .filter((a) => a.isCorrect === null)
                .map((a) => a.questionId);
              const pendingQuestions = attempt.quiz.questions.filter((q) =>
                pendingQuestionIds.includes(q.id)
              );
              return (
                <div
                  key={attempt.id}
                  className="bg-white border border-line rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          <Clock className="w-3 h-3" /> Awaiting review
                        </span>
                        <span className="text-[11px] text-muted">
                          {formatDistanceToNow(attempt.startedAt, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="font-bold text-[14.5px] text-ink">
                        {attempt.quiz.title}
                      </p>
                      <p className="text-[12px] text-muted">
                        {course?.title ?? "—"} · {attempt.user.name ?? attempt.user.email}
                      </p>
                    </div>
                  </div>
                  <GradeQuizForm
                    attemptId={attempt.id}
                    pendingQuestions={pendingQuestions.map((q) => {
                      const submitted = answers.find((a) => a.questionId === q.id);
                      return {
                        id: q.id,
                        prompt: q.prompt,
                        points: q.points,
                        expectedAnswer: q.correctAnswer,
                        studentAnswer: submitted?.answer ?? "",
                      };
                    })}
                  />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
