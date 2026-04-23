import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Clock,
  BookOpen,
  Award,
  Globe,
  BarChart2,
  Play,
  Headphones,
  FileText,
  FileCode,
  Lock,
  Star,
  Calendar,
} from "lucide-react";
import { getCourseBySlug, getEnrollmentStatus } from "@/lib/data/courses";
import { getCurrentCurrency } from "@/lib/currency-server";
import { CourseSidebar } from "@/components/marketing/CourseSidebar";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
  return `${m}m`;
}

function fmtHours(minutes: number) {
  const h = Math.round(minutes / 60);
  return `${h} hour${h !== 1 ? "s" : ""}`;
}

function levelLabel(level: string) {
  const map: Record<string, string> = {
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
    ALL_LEVELS: "All levels",
  };
  return map[level] ?? level;
}

function LessonIcon({ type }: { type: string }) {
  const cls = "shrink-0 text-muted";
  const sz = 14;
  switch (type) {
    case "VIDEO": return <Play size={sz} className={cls} />;
    case "AUDIO": return <Headphones size={sz} className={cls} />;
    case "TEXT": return <FileText size={sz} className={cls} />;
    case "PDF": return <FileText size={sz} className={cls} />;
    case "HTML": return <FileCode size={sz} className={cls} />;
    default: return <FileText size={sz} className={cls} />;
  }
}

function StarRating({ rating, count }: { rating: number; count?: number }) {
  const full = Math.round(rating);
  return (
    <span className="flex items-center gap-1">
      <span className="text-amber-400 tracking-tight" aria-hidden="true">
        {"★".repeat(full)}{"☆".repeat(5 - full)}
      </span>
      <span className="font-700 text-ink text-sm">{rating.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-muted text-sm">({count.toLocaleString()} review{count !== 1 ? "s" : ""})</span>
      )}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return {};

  const description =
    course.subtitle ??
    course.description.replace(/<[^>]+>/g, "").slice(0, 160);

  return {
    title: course.seoTitle ?? course.title,
    description: course.seoDescription ?? description,
    openGraph: {
      title: course.title,
      description,
      type: "website",
      images: course.thumbnailUrl ? [{ url: course.thumbnailUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: course.title,
      description,
      images: course.thumbnailUrl ? [course.thumbnailUrl] : [],
    },
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const [resolvedCourse, currency] = await Promise.all([
    getCourseBySlug(slug),
    getCurrentCurrency(),
  ]);

  if (!resolvedCourse) notFound();

  const actualEnrollmentStatus = await getEnrollmentStatus(resolvedCourse.id);

  // Aggregate stats
  const allLessons = resolvedCourse.modules.flatMap((m) => m.lessons);
  const totalSeconds = allLessons.reduce((s, l) => s + l.durationSeconds, 0);
  const lessonCount = allLessons.length;
  const avgRating =
    resolvedCourse.reviews.length
      ? resolvedCourse.reviews.reduce((s, r) => s + r.rating, 0) / resolvedCourse.reviews.length
      : null;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: resolvedCourse.title,
    description:
      resolvedCourse.subtitle ??
      resolvedCourse.description.replace(/<[^>]+>/g, "").slice(0, 200),
    provider: {
      "@type": "Organization",
      name: "JissrON",
    },
    instructor: {
      "@type": "Person",
      name: resolvedCourse.instructor.name,
    },
    courseMode: "online",
    dateModified: resolvedCourse.updatedAt.toISOString(),
    image: resolvedCourse.thumbnailUrl ?? undefined,
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main id="main-content" className="min-h-screen bg-white">
        {/* ─── Hero band ──────────────────────────────────────────────── */}
        <div className="bg-ink text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
            <div className="lg:max-w-[65%]">
              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-white/60 mb-5 flex-wrap">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <ChevronRight size={12} />
                <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
                <ChevronRight size={12} />
                <Link
                  href={`/courses?category=${resolvedCourse.category.slug}`}
                  className="hover:text-white transition-colors"
                >
                  {resolvedCourse.category.name}
                </Link>
                <ChevronRight size={12} />
                <span className="text-white/40 line-clamp-1">{resolvedCourse.title}</span>
              </nav>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-800 leading-snug mb-3">
                {resolvedCourse.title}
              </h1>

              {/* Subtitle */}
              {resolvedCourse.subtitle && (
                <p className="text-lg text-white/80 font-500 leading-snug mb-4">
                  {resolvedCourse.subtitle}
                </p>
              )}

              {/* Rating */}
              {avgRating !== null && (
                <div className="flex items-center gap-2 mb-4">
                  <StarRating rating={avgRating} count={resolvedCourse.reviews.length} />
                </div>
              )}

              {/* Instructor line */}
              <div className="flex items-center gap-2 mb-5 text-sm text-white/70">
                {resolvedCourse.instructor.image && (
                  <Image
                    src={resolvedCourse.instructor.image}
                    alt={resolvedCourse.instructor.name ?? ""}
                    width={24}
                    height={24}
                    className="rounded-full shrink-0"
                  />
                )}
                <span>
                  Created by{" "}
                  <span className="text-white font-600">{resolvedCourse.instructor.name}</span>
                </span>
              </div>

              {/* Meta badges */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  Updated {resolvedCourse.updatedAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1">
                  <Globe size={12} />
                  {resolvedCourse.language.toUpperCase()}
                </span>
                <span className="flex items-center gap-1">
                  <BarChart2 size={12} />
                  {levelLabel(resolvedCourse.level)}
                </span>
              </div>

              {/* Stats bar */}
              {lessonCount > 0 && (
                <div className="flex flex-wrap gap-4 mt-5 text-sm text-white/80 font-500 border-t border-white/10 pt-5">
                  {totalSeconds > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-white/50" />
                      {fmtHours(resolvedCourse.durationMinutes)} of content
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={14} className="text-white/50" />
                    {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award size={14} className="text-white/50" />
                    Certificate included
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Two-column body ─────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="lg:flex lg:gap-12">

            {/* LEFT — main content */}
            <div className="flex-1 min-w-0 space-y-12">

              {/* Mobile sidebar — above content */}
              <div className="lg:hidden">
                <CourseSidebar
                  course={resolvedCourse}
                  currency={currency}
                  enrollmentStatus={actualEnrollmentStatus}
                />
              </div>

              {/* ── About ─────────────────────────────────────────────── */}
              <section aria-labelledby="about-heading">
                <h2 id="about-heading" className="text-xl font-800 text-ink mb-4">
                  About this course
                </h2>
                {resolvedCourse.description ? (
                  <div
                    className="prose prose-sm sm:prose max-w-none text-body-text
                      prose-headings:text-ink prose-headings:font-700
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-ink prose-strong:font-700
                      prose-ul:list-disc prose-ol:list-decimal"
                    dangerouslySetInnerHTML={{ __html: resolvedCourse.description }}
                  />
                ) : (
                  <p className="text-muted font-500">This course content is being prepared.</p>
                )}
              </section>

              {/* ── Curriculum ────────────────────────────────────────── */}
              {resolvedCourse.modules.length > 0 && (
                <section aria-labelledby="curriculum-heading">
                  <div className="flex items-baseline justify-between mb-4 gap-4 flex-wrap">
                    <h2 id="curriculum-heading" className="text-xl font-800 text-ink">
                      Curriculum
                    </h2>
                    <span className="text-sm text-muted font-500 shrink-0">
                      {resolvedCourse.modules.length} module{resolvedCourse.modules.length !== 1 ? "s" : ""} ·{" "}
                      {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
                      {totalSeconds > 0 && ` · ${fmtDuration(totalSeconds)} total`}
                    </span>
                  </div>

                  <div className="border border-line rounded-xl divide-y divide-line overflow-hidden">
                    {resolvedCourse.modules.map((mod) => {
                      const modSeconds = mod.lessons.reduce((s, l) => s + l.durationSeconds, 0);
                      return (
                        <details key={mod.id} className="group">
                          <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none hover:bg-bg-soft transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <ChevronRight
                                size={16}
                                className="text-muted shrink-0 transition-transform group-open:rotate-90"
                              />
                              <span className="font-700 text-ink text-sm truncate">{mod.title}</span>
                            </div>
                            <span className="text-xs text-muted font-500 shrink-0">
                              {mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}
                              {modSeconds > 0 && ` · ${fmtDuration(modSeconds)}`}
                            </span>
                          </summary>

                          <ul className="border-t border-line divide-y divide-line">
                            {mod.lessons.map((lesson) => (
                              <li
                                key={lesson.id}
                                className="flex items-center justify-between gap-3 px-5 py-3 bg-bg-soft/50"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <LessonIcon type={lesson.type} />
                                  <span className="text-sm text-ink truncate">{lesson.title}</span>
                                  {lesson.isPreview && (
                                    <span className="shrink-0 text-[10px] font-700 text-primary-bright border border-primary-bright px-1.5 py-0.5 rounded uppercase tracking-wide">
                                      Preview
                                    </span>
                                  )}
                                  {!lesson.isPreview && actualEnrollmentStatus !== "enrolled" && (
                                    <Lock size={12} className="text-muted shrink-0" aria-label="Locked" />
                                  )}
                                </div>
                                {lesson.durationSeconds > 0 && (
                                  <span className="text-xs text-muted shrink-0 font-500">
                                    {fmtDuration(lesson.durationSeconds)}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </details>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── Instructor ────────────────────────────────────────── */}
              <section aria-labelledby="instructor-heading">
                <h2 id="instructor-heading" className="text-xl font-800 text-ink mb-5">
                  Your instructor
                </h2>
                <div className="flex items-start gap-4">
                  {resolvedCourse.instructor.image ? (
                    <Image
                      src={resolvedCourse.instructor.image}
                      alt={resolvedCourse.instructor.name ?? "Instructor"}
                      width={72}
                      height={72}
                      className="rounded-full shrink-0 border-2 border-line"
                    />
                  ) : (
                    <div className="w-[72px] h-[72px] rounded-full bg-primary/10 grid place-items-center shrink-0">
                      <span className="text-2xl font-800 text-primary">
                        {(resolvedCourse.instructor.name ?? "I")[0]}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-lg font-700 text-ink">{resolvedCourse.instructor.name}</h3>
                    {resolvedCourse.instructor.bio && (
                      <p className="text-sm text-muted font-500 mt-1 leading-relaxed line-clamp-4">
                        {resolvedCourse.instructor.bio}
                      </p>
                    )}
                    {resolvedCourse.instructor.consultant && (
                      <Link
                        href={`/consults`}
                        className="inline-flex items-center gap-1.5 mt-3 text-sm font-600 text-primary hover:underline"
                      >
                        Book a 1-on-1 consultation →
                      </Link>
                    )}
                  </div>
                </div>
              </section>

              {/* ── Reviews ───────────────────────────────────────────── */}
              <section aria-labelledby="reviews-heading">
                <h2 id="reviews-heading" className="text-xl font-800 text-ink mb-5">
                  Student reviews
                </h2>

                {resolvedCourse.reviews.length === 0 ? (
                  <p className="text-muted font-500">
                    No reviews yet. Be the first to review after completing this course!
                  </p>
                ) : (
                  <>
                    {/* Aggregate */}
                    {avgRating !== null && (
                      <div className="flex items-center gap-3 mb-6 p-4 bg-bg-soft rounded-xl border border-line">
                        <span className="text-5xl font-800 text-ink leading-none">
                          {avgRating.toFixed(1)}
                        </span>
                        <div>
                          <StarRating rating={avgRating} />
                          <p className="text-xs text-muted font-500 mt-1">
                            Based on {resolvedCourse.reviews.length} review{resolvedCourse.reviews.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Review list */}
                    <ul className="space-y-5">
                      {resolvedCourse.reviews.map((review) => (
                        <li
                          key={review.id}
                          className="border-b border-line pb-5 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {review.user.image ? (
                              <Image
                                src={review.user.image}
                                alt={review.user.name ?? "Student"}
                                width={36}
                                height={36}
                                className="rounded-full shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-primary/10 grid place-items-center shrink-0">
                                <span className="text-sm font-700 text-primary">
                                  {(review.user.name ?? "S")[0]}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-700 text-ink leading-none">
                                {review.user.name ?? "Student"}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    size={12}
                                    className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-line"}
                                    aria-hidden="true"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-body-text leading-relaxed">
                              {review.comment}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            </div>

            {/* RIGHT — sticky sidebar (desktop only) */}
            <aside className="hidden lg:block w-[340px] xl:w-[360px] shrink-0">
              <div className="sticky top-6">
                <CourseSidebar
                  course={resolvedCourse}
                  currency={currency}
                  enrollmentStatus={actualEnrollmentStatus}
                />
              </div>
            </aside>

          </div>
        </div>
      </main>
    </>
  );
}
