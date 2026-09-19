"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, Loader2, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { submitReview, deleteMyReview } from "@/lib/actions/reviews";

interface ExistingReview {
  id: string;
  rating: number;
  comment: string | null;
}

interface Props {
  courseId: string;
  courseSlug: string;
  /**
   * "eligible": user is enrolled and finished the course → show the form.
   * "not-enrolled" | "not-completed" | "signed-out": render a hint instead.
   */
  state: "eligible" | "not-enrolled" | "not-completed" | "signed-out";
  existing: ExistingReview | null;
}

export function ReviewWriteCard({ courseId, courseSlug, state, existing }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [editing, setEditing] = useState(!existing);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existing?.comment ?? "");

  // Auto-open the form when ?review=open is in the URL (the completion email
  // links here). Only fires once; user can still close via Cancel.
  useEffect(() => {
    if (state === "eligible" && searchParams.get("review") === "open") {
      setEditing(true);
      // Scroll the section into view
      const el = document.getElementById("reviews");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams, state]);

  if (state === "signed-out") {
    return (
      <div className="bg-bg-soft border border-line rounded-md p-4 text-[13px] text-muted">
        Sign in and finish the course to leave a review.
      </div>
    );
  }
  if (state === "not-enrolled") {
    return (
      <div className="bg-bg-soft border border-line rounded-md p-4 text-[13px] text-muted">
        Enroll and complete the course to share your experience.
      </div>
    );
  }
  if (state === "not-completed") {
    return (
      <div className="bg-bg-soft border border-line rounded-md p-4 text-[13px] text-muted">
        Reviews open once you finish the course — keep going!
      </div>
    );
  }

  // state === "eligible"
  if (!editing && existing) {
    return (
      <div className="bg-primary-soft border border-primary/20 rounded-md p-4">
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              className={i < existing.rating ? "text-primary fill-primary" : "text-line"}
            />
          ))}
          <span className="ml-2 text-[12px] text-ink font-700">Your review</span>
        </div>
        {existing.comment && (
          <p className="text-[13px] text-ink/85 leading-snug mb-3 italic">
            &ldquo;{existing.comment}&rdquo;
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-line text-[12px] font-600 text-ink hover:bg-white transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm("Delete your review?")) return;
              startTransition(async () => {
                const r = await deleteMyReview({ courseId, courseSlug });
                if (r.ok) {
                  toast.success("Review deleted");
                  router.refresh();
                } else {
                  toast.error(r.error ?? "Couldn't delete");
                }
              });
            }}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-line text-[12px] font-600 text-muted hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    );
  }

  const displayRating = hoverRating || rating;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (rating < 1) {
          toast.error("Pick a star rating first");
          return;
        }
        startTransition(async () => {
          const r = await submitReview({ courseId, courseSlug, rating, comment });
          if (r.ok) {
            toast.success(existing ? "Review updated — thanks!" : "Thanks for your review!");
            setEditing(false);
            router.refresh();
          } else {
            toast.error(r.error);
          }
        });
      }}
      className="bg-white border border-primary/30 rounded-md p-4"
    >
      <p className="text-[12px] uppercase tracking-wider font-700 text-primary mb-3">
        {existing ? "Edit your review" : "Leave a review"}
      </p>

      <div className="flex items-center gap-1 mb-3" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            onMouseEnter={() => setHoverRating(i)}
            className="p-0.5 rounded transition-transform hover:scale-110"
            aria-label={`${i} star${i !== 1 ? "s" : ""}`}
          >
            <Star
              size={22}
              className={
                i <= displayRating ? "text-primary fill-primary" : "text-line hover:text-primary/40"
              }
            />
          </button>
        ))}
        <span className="ml-2 text-[12px] text-muted">
          {displayRating ? `${displayRating}/5` : "Tap a star"}
        </span>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Share what worked for you (optional)…"
        className="w-full text-[13px] text-ink p-3 rounded-md border border-line bg-bg-soft focus:bg-white focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-colors resize-y"
      />
      <p className="text-[10.5px] text-muted mt-1 text-right">
        {comment.length}/2000
      </p>

      <div className="flex gap-2 mt-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-white text-[12.5px] font-700 hover:bg-primary-hover transition-colors disabled:opacity-60"
        >
          {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {existing ? "Save changes" : "Post review"}
        </button>
        {existing && (
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setRating(existing.rating);
              setComment(existing.comment ?? "");
            }}
            className="inline-flex items-center h-9 px-4 rounded-md border border-line text-[12.5px] font-600 text-muted hover:text-ink transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
