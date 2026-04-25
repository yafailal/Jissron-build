import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { ContinueLearningData } from "@/lib/data/dashboard";

const THUMB_GRADIENTS = [
  "linear-gradient(135deg,#003d80 0%,#0071e3 100%)",
  "linear-gradient(135deg,#0a2f5c 0%,#1a6ec9 100%)",
  "linear-gradient(135deg,#002a5a 0%,#0058b8 100%)",
  "linear-gradient(135deg,#003d80 0%,#66b5ff 100%)",
  "linear-gradient(135deg,#001f40 0%,#0071e3 100%)",
];

interface ContinueLearningCardProps {
  data: ContinueLearningData;
}

export function ContinueLearningCard({ data }: ContinueLearningCardProps) {
  const gradient =
    THUMB_GRADIENTS[data.courseSlug.charCodeAt(0) % THUMB_GRADIENTS.length];
  const href = `/courses/${data.courseSlug}/learn?lessonId=${data.lessonId}`;

  return (
    <div className="mb-8 bg-white border border-line rounded-2xl overflow-hidden shadow-sm">
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail — full height on desktop, fixed height on mobile */}
        <div
          className="relative h-48 sm:h-auto sm:w-[38%] shrink-0"
          style={{ background: data.thumbnailUrl ? undefined : gradient }}
        >
          {data.thumbnailUrl && (
            <Image
              src={data.thumbnailUrl}
              alt={data.courseTitle}
              fill
              className="object-cover"
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
          <div>
            <p className="text-[11px] font-700 text-muted uppercase tracking-[.08em] mb-2">
              Pick up where you left off
            </p>
            <h2
              className="text-2xl sm:text-3xl font-700 text-ink leading-snug mb-2 line-clamp-2"
              style={{ fontFamily: "var(--font-crimson), Georgia, serif" }}
            >
              {data.courseTitle}
            </h2>
            <p className="text-[12px] text-muted font-500 mb-0.5">
              Module {data.moduleOrder} — {data.moduleTitle}
            </p>
            <p className="text-sm font-600 text-ink mb-5 line-clamp-1">
              {data.lessonTitle}
            </p>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${data.progressPct}%` }}
                />
              </div>
              <span className="text-[12px] font-600 text-muted shrink-0">
                {data.progressPct}%
              </span>
            </div>
          </div>
          <Link
            href={href}
            className="self-start inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-primary text-white text-sm font-700 hover:bg-primary-hover transition-colors"
          >
            Continue learning
            <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}
