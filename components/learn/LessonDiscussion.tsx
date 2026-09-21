"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { Send, Check, Trash2, Shield, GraduationCap, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS, fr, ar, es } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  postLessonQuestion,
  postLessonQuestionReply,
  deleteLessonQuestion,
  deleteLessonQuestionReply,
  toggleLessonQuestionResolved,
} from "@/lib/actions/lesson-questions";
import { cn } from "@/lib/utils";

interface Author {
  id: string;
  name: string | null;
  image: string | null;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}

interface Reply {
  id: string;
  body: string;
  createdAt: Date;
  user: Author;
}

interface Question {
  id: string;
  body: string;
  resolved: boolean;
  createdAt: Date;
  user: Author;
  replies: Reply[];
}

interface CurrentUser {
  id: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
}

interface LessonDiscussionProps {
  lessonId: string;
  questions: Question[];
  currentUser: CurrentUser;
  courseInstructorId: string;
}

const DATE_LOCALES = { en: enUS, fr, ar, es } as const;

function useDateLocale() {
  const locale = useLocale();
  return DATE_LOCALES[locale as keyof typeof DATE_LOCALES] ?? enUS;
}

function isAuthority(role: Author["role"]) {
  return role === "INSTRUCTOR" || role === "ADMIN";
}

function Avatar({ user }: { user: Author }) {
  const t = useTranslations("Learn");
  if (user.image) {
    return (
      <Image
        src={user.image}
        alt={user.name ?? t("discussion.user")}
        width={24}
        height={24}
        className="rounded-full w-6 h-6 object-cover shrink-0"
      />
    );
  }
  const initial = (user.name ?? "?")[0]?.toUpperCase() ?? "?";
  return (
    <div className="w-6 h-6 rounded-full bg-primary text-white grid place-items-center text-[10.5px] font-bold shrink-0">
      {initial}
    </div>
  );
}

function RoleBadge({ role }: { role: Author["role"] }) {
  const t = useTranslations("Learn");
  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-200">
        <Shield className="w-2.5 h-2.5" /> {t("discussion.admin")}
      </span>
    );
  }
  if (role === "INSTRUCTOR") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wide bg-primary-soft text-primary border border-primary/20">
        <GraduationCap className="w-2.5 h-2.5" /> {t("discussion.instructor")}
      </span>
    );
  }
  return null;
}

function ReplyItem({
  reply,
  currentUser,
  courseInstructorId,
  onDelete,
}: {
  reply: Reply;
  currentUser: CurrentUser;
  courseInstructorId: string;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations("Learn");
  const dateLocale = useDateLocale();
  const canDelete =
    currentUser.role === "ADMIN" ||
    reply.user.id === currentUser.id ||
    currentUser.id === courseInstructorId;

  return (
    <div className="flex gap-2 ps-8">
      <Avatar user={reply.user} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[12px] font-bold text-ink">
            {reply.user.name ?? t("discussion.anonymous")}
          </span>
          <RoleBadge role={reply.user.role} />
          <span className="text-[10.5px] text-muted">
            {formatDistanceToNow(reply.createdAt, { addSuffix: true, locale: dateLocale })}
          </span>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(reply.id)}
              className="ms-auto text-muted/60 hover:text-rose-500"
              aria-label={t("discussion.deleteReply")}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-[12.5px] text-ink whitespace-pre-wrap mt-0.5">{reply.body}</p>
      </div>
    </div>
  );
}

function QuestionItem({
  question,
  currentUser,
  courseInstructorId,
}: {
  question: Question;
  currentUser: CurrentUser;
  courseInstructorId: string;
}) {
  const t = useTranslations("Learn");
  const dateLocale = useDateLocale();
  const router = useRouter();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const canManage =
    currentUser.role === "ADMIN" ||
    question.user.id === currentUser.id ||
    currentUser.id === courseInstructorId;

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await postLessonQuestionReply(question.id, replyBody);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setReplyBody("");
      setReplyOpen(false);
      startTransition(() => router.refresh());
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteQuestion() {
    if (!confirm(t("discussion.confirmDeleteQuestion"))) return;
    const result = await deleteLessonQuestion(question.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  async function handleDeleteReply(replyId: string) {
    if (!confirm(t("discussion.confirmDeleteReply"))) return;
    const result = await deleteLessonQuestionReply(replyId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  async function handleToggleResolved() {
    const result = await toggleLessonQuestionResolved(question.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.data?.resolved ? t("discussion.markedResolved") : t("discussion.reopened"));
    startTransition(() => router.refresh());
  }

  return (
    <div
      className={cn(
        "rounded-2xl border p-3 space-y-1.5",
        question.resolved ? "border-primary-mid bg-primary-softer" : "border-line bg-white"
      )}
    >
      <div className="flex gap-2">
        <Avatar user={question.user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[12px] font-bold text-ink">
              {question.user.name ?? t("discussion.anonymous")}
            </span>
            <RoleBadge role={question.user.role} />
            <span className="text-[10.5px] text-muted">
              {formatDistanceToNow(question.createdAt, { addSuffix: true, locale: dateLocale })}
            </span>
            {question.resolved && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wide bg-primary-soft text-primary">
                <Check className="w-2.5 h-2.5" /> {t("discussion.resolved")}
              </span>
            )}
            {canManage && (
              <div className="ms-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleToggleResolved}
                  className="text-[11px] text-muted hover:text-ink font-semibold"
                >
                  {question.resolved ? t("discussion.reopen") : t("discussion.markResolved")}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteQuestion}
                  className="text-muted/60 hover:text-rose-500"
                  aria-label={t("discussion.deleteQuestion")}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <p className="text-[12.5px] text-ink whitespace-pre-wrap mt-0.5">{question.body}</p>
        </div>
      </div>

      {question.replies.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-line/60">
          {question.replies.map((r) => (
            <ReplyItem
              key={r.id}
              reply={r}
              currentUser={currentUser}
              courseInstructorId={courseInstructorId}
              onDelete={handleDeleteReply}
            />
          ))}
        </div>
      )}

      <div className="ps-10">
        {!replyOpen ? (
          <button
            type="button"
            onClick={() => setReplyOpen(true)}
            className="text-[12px] font-semibold text-primary hover:underline"
          >
            {t("discussion.reply")}
          </button>
        ) : (
          <form onSubmit={handleReply} className="space-y-1.5">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={2}
              placeholder={t("discussion.replyPlaceholder")}
              className="w-full text-[13px] border border-line rounded-2xl px-2.5 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35 resize-y"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={isSubmitting || !replyBody.trim()}>
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                {t("discussion.reply")}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setReplyOpen(false);
                  setReplyBody("");
                }}
                className="text-[12px] text-muted hover:text-ink"
              >
                {t("discussion.cancel")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function LessonDiscussion({
  lessonId,
  questions,
  currentUser,
  courseInstructorId,
}: LessonDiscussionProps) {
  const t = useTranslations("Learn");
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await postLessonQuestion(lessonId, body);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setBody("");
      toast.success(t("discussion.posted"));
      startTransition(() => router.refresh());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-5 border-t border-line pt-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Composer on the left */}
        <form
          onSubmit={handleSubmit}
          className="md:w-72 shrink-0 border border-line rounded-2xl p-2.5 bg-white self-start"
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder={t("discussion.askPlaceholder")}
            className="w-full text-[12.5px] border border-line rounded-2xl px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bright/35 resize-y"
          />
          <div className="flex items-center justify-between mt-1.5 gap-2">
            <p className="text-[10.5px] text-muted">
              {isAuthority(currentUser.role)
                ? t("discussion.postingAsInstructor")
                : t("discussion.visibleTo")}
            </p>
            <Button type="submit" size="sm" className="h-9 px-4 text-[13px]" disabled={isSubmitting || !body.trim()}>
              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              {t("discussion.post")}
            </Button>
          </div>
        </form>

        {/* Thread in the center */}
        <div className="flex-1 min-w-0 max-w-2xl mx-auto">
          {questions.length === 0 ? (
            <div className="text-center py-5 text-muted text-[12px]">
              {t("discussion.empty")}
            </div>
          ) : (
            <div className="space-y-2">
              {questions.map((q) => (
                <QuestionItem
                  key={q.id}
                  question={q}
                  currentUser={currentUser}
                  courseInstructorId={courseInstructorId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
