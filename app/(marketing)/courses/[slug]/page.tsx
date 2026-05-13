import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Play,
  Star,
  ArrowRight,
} from "lucide-react";
import { getCourseBySlug, getEnrollmentStatus } from "@/lib/data/courses";
import { getCurrentCurrency } from "@/lib/currency-server";
import { isStripeConfigured } from "@/lib/stripe";
import { isCmiConfiguredServer } from "@/lib/cmi";
import { CourseFAQAccordion } from "@/components/marketing/CourseFAQAccordion";
import { CourseEnrollButton } from "@/components/marketing/CourseEnrollButton";
import { db } from "@/lib/db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m > 0 ? `${m}min` : ""}`.trim();
  return `${m}min`;
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

function formatMadCompact(cents: number) {
  return Math.round(cents / 100).toLocaleString("fr-MA");
}

// TODO: when we add Course.learningObjectives Json[] field, swap this out.
const PLACEHOLDER_LEARNING_OBJECTIVES = [
  { title: "Master the fundamentals", body: "Build a strong base in the core concepts that drive this course." },
  { title: "Apply tools in practice", body: "Use the techniques you learn on real tasks and workflows from day one." },
  { title: "Design for outcomes", body: "Plan and structure work so each lesson leads to a measurable result." },
  { title: "Avoid common pitfalls", body: "Recognise the failure modes that trip up beginners and how to side-step them." },
  { title: "Ship with confidence", body: "Take what you build through evaluation, polish, and delivery." },
  { title: "Lead and teach others", body: "Communicate what you've learned to a team and help them adopt it." },
];

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

  const [resolvedCourse, currency, stripeConfigured, cmiConfigured] = await Promise.all([
    getCourseBySlug(slug),
    getCurrentCurrency(),
    isStripeConfigured(),
    isCmiConfiguredServer(),
  ]);

  if (!resolvedCourse) notFound();

  const enrollmentResult = await getEnrollmentStatus(resolvedCourse.id);

  // Aggregate stats
  const allLessons = resolvedCourse.modules.flatMap((m) => m.lessons);
  const totalSeconds = allLessons.reduce((s, l) => s + l.durationSeconds, 0);
  const lessonCount = allLessons.length;
  const avgRating =
    resolvedCourse.reviews.length
      ? resolvedCourse.reviews.reduce((s, r) => s + r.rating, 0) / resolvedCourse.reviews.length
      : null;

  // Instructor stats — what we can compute from DB
  const [instructorCourseCount, instructorStudentCount] = await Promise.all([
    db.course.count({ where: { instructorId: resolvedCourse.instructorId, status: "PUBLISHED" } }),
    db.enrollment.count({ where: { course: { instructorId: resolvedCourse.instructorId } } }),
  ]);

  const isFree = resolvedCourse.priceMadCents === 0 && resolvedCourse.priceUsdCents === 0;
  const price = isFree ? "Free" : `${formatMadCompact(resolvedCourse.priceMadCents)} MAD`;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: resolvedCourse.title,
    description:
      resolvedCourse.subtitle ??
      resolvedCourse.description.replace(/<[^>]+>/g, "").slice(0, 200),
    provider: { "@type": "Organization", name: "JissrON" },
    instructor: { "@type": "Person", name: resolvedCourse.instructor.name },
    courseMode: "online",
    dateModified: resolvedCourse.updatedAt.toISOString(),
    image: resolvedCourse.thumbnailUrl ?? undefined,
  };

  // Split the title to italicize the second half (editorial feel)
  const titleWords = resolvedCourse.title.split(" ");
  const titleHead = titleWords.slice(0, Math.ceil(titleWords.length / 2)).join(" ");
  const titleTail = titleWords.slice(Math.ceil(titleWords.length / 2)).join(" ");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main id="main-content" className="bg-white">

        {/* ─── Hero — 2 columns: wider video (2.5/1) + instructor; video height locked ─── */}
        <div className="w-full bg-[#326977]/15 py-4">
          <section className="grid lg:grid-cols-[2.5fr_1fr] gap-5 lg:gap-6 items-stretch max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10">
            {/* LEFT — trailer/thumbnail (wider, fixed height, aligned with text below) */}
            <div className="relative h-[400px] rounded-[20px] overflow-hidden bg-gradient-to-br from-[#0d2742] via-[#103354] to-[#16456f] shadow-card lg:-ml-[100px]">
              {resolvedCourse.thumbnailUrl && (
                <Image
                  src={resolvedCourse.thumbnailUrl}
                  alt={resolvedCourse.title}
                  fill
                  sizes="(min-width: 1024px) 600px, 100vw"
                  className="object-cover opacity-40"
                  priority
                />
              )}
              {/* JISSRON watermark */}
              <div className="absolute top-3 left-3 text-white text-[9px] tracking-[0.3em] font-700">JISSRON</div>
              {/* Play button — centered */}
              <button
                type="button"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 grid place-items-center hover:bg-white transition-colors shadow-lg"
                aria-label="Play trailer"
              >
                <Play size={16} className="text-ink fill-ink ml-0.5" />
              </button>
              {/* Bottom info */}
              <div className="absolute left-3 right-3 bottom-3 text-white">
                <p className="text-[9px] tracking-[0.25em] font-700 text-white/70 mb-1">
                  COURSE TRAILER · 2 MIN
                </p>
                <p className="text-[13px] font-700 leading-tight line-clamp-2">
                  {resolvedCourse.title}
                </p>
                <div className="flex items-center justify-between mt-2 text-[9px] tracking-[0.2em] font-600 text-white/60">
                  <span>EN · FR</span>
                  <span>02:14</span>
                </div>
              </div>
            </div>

            {/* RIGHT — title card on top, instructor card below; right edge aligned with strip below */}
            <div className="flex flex-col gap-3 lg:-mr-[100px]">

            {/* Title card — over the instructor card */}
            <div className="bg-[#326977] text-white rounded-[20px] shadow-sm px-4 py-3 flex items-baseline flex-wrap gap-x-3 gap-y-1">
              {resolvedCourse.subtitle && (
                <p className="text-[12px] text-white/85 font-black leading-snug">
                  {resolvedCourse.subtitle}
                </p>
              )}
              <h1 className="text-[15px] font-black text-white leading-tight">
                {resolvedCourse.title}
              </h1>
            </div>

            <div className="flex flex-col items-center text-center bg-white rounded-[20px] p-4 border border-line shadow-sm flex-1">
              <p className="text-[10px] tracking-[0.25em] font-700 text-muted mb-2">MEET YOUR INSTRUCTOR</p>

              {/* Name */}
              <p className="font-700 text-ink text-[16px] leading-tight mb-1">
                {resolvedCourse.instructor.name}
              </p>
              <p className="text-[11.5px] text-muted font-500 mb-3">
                {/* TODO: instructor tagline */}
                {resolvedCourse.category.name} expert
              </p>

              {/* Avatar */}
              {resolvedCourse.instructor.image ? (
                <Image
                  src={resolvedCourse.instructor.image}
                  alt={resolvedCourse.instructor.name ?? ""}
                  width={120}
                  height={120}
                  className="w-[120px] h-[120px] rounded-full object-cover mb-3 shrink-0"
                />
              ) : (
                <div className="w-[120px] h-[120px] rounded-full bg-primary text-white grid place-items-center text-3xl font-700 mb-3 shrink-0">
                  {(resolvedCourse.instructor.name ?? "I")[0]}
                </div>
              )}

              {/* Bio */}
              {resolvedCourse.instructor.bio && (
                <p className="text-[12px] text-ink/80 leading-snug mb-3 line-clamp-4 text-left w-full">
                  {resolvedCourse.instructor.bio}
                </p>
              )}

              {/* Stats */}
              <div className="mt-auto grid grid-cols-3 gap-2 pt-3 border-t border-line w-full">
                <div>
                  <p className="text-[14px] font-700 text-ink leading-none">{instructorCourseCount}</p>
                  <p className="text-[10px] text-muted mt-1 leading-tight">
                    course{instructorCourseCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-[14px] font-700 text-ink leading-none">
                    {instructorStudentCount >= 1000
                      ? `${(instructorStudentCount / 1000).toFixed(1)}k`
                      : instructorStudentCount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted mt-1 leading-tight">students</p>
                </div>
                {avgRating !== null ? (
                  <div>
                    <p className="text-[14px] font-700 text-ink leading-none flex items-center justify-center gap-0.5">
                      {avgRating.toFixed(1)} <Star size={11} className="fill-ink text-ink" />
                    </p>
                    <p className="text-[10px] text-muted mt-1 leading-tight">rating</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[14px] font-700 text-ink leading-none">—</p>
                    <p className="text-[10px] text-muted mt-1 leading-tight">rating</p>
                  </div>
                )}
              </div>
            </div>
            </div>
          </section>
        </div>

        {/* ─── Title + Stats + tabs + sections ─── */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">

          {/* ─── Breadcrumb (title + subtitle now live inside the hero, under instructor card) ─── */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-muted pt-4 pb-3 flex-wrap">
            <Link href="/courses" className="hover:text-ink transition-colors">{resolvedCourse.category.name}</Link>
            <ChevronRight size={11} />
            <Link
              href={`/courses?category=${resolvedCourse.category.slug}`}
              className="hover:text-ink transition-colors"
            >
              Applied AI
            </Link>
            <ChevronRight size={11} />
            <span className="text-ink/70 line-clamp-1">{resolvedCourse.title}</span>
          </nav>

          {/* ─── Stats bar — thinner, sticky under the global nav ─── */}
          <section className="sticky top-[72px] z-30 grid grid-cols-2 lg:grid-cols-4 gap-0 bg-[#1E2A49] text-white rounded-[20px] py-3 mb-3 shadow-lg">
            {/* Column 1 — Category */}
            <div className="px-4 lg:px-5 border-r border-white/15 last:border-0 flex flex-col justify-center">
              <p className="text-[10px] tracking-[0.2em] font-700 text-white/60 mb-0.5">CATEGORY</p>
              <p className="text-[15px] font-700 leading-tight">{resolvedCourse.category.name}</p>
            </div>
            {/* Column 2 — Hours of video */}
            <div className="px-4 lg:px-5 border-r border-white/15 last:border-0 flex flex-col justify-center">
              <p className="text-[10px] tracking-[0.2em] font-700 text-white/60 mb-0.5">HOURS OF VIDEO</p>
              <p className="text-[15px] font-700 leading-tight">
                {totalSeconds > 0 ? fmtDuration(totalSeconds) : "—"}
              </p>
            </div>
            {/* Column 3 — Price */}
            <div className="px-4 lg:px-5 border-r border-white/15 last:border-0 flex flex-col justify-center">
              <p className="text-[10px] tracking-[0.2em] font-700 text-white/60 mb-0.5">PRICE</p>
              <p className="text-[18px] font-800 leading-none">{price}</p>
              {!isFree && resolvedCourse.priceMadCents > 0 && (
                <p className="text-[10.5px] text-white/60 mt-0.5">
                  Or 3 × {formatMadCompact(Math.round(resolvedCourse.priceMadCents / 3))} MAD
                </p>
              )}
            </div>
            {/* Column 4 — CTA */}
            <div className="px-4 lg:px-5 flex items-center justify-center">
              <CourseEnrollButton
                variant="dark"
                course={{
                  id: resolvedCourse.id,
                  slug: resolvedCourse.slug,
                  priceMadCents: resolvedCourse.priceMadCents,
                  priceUsdCents: resolvedCourse.priceUsdCents,
                  stripePriceId: resolvedCourse.stripePriceId ?? null,
                }}
                currency={currency}
                enrollmentStatus={enrollmentResult.status}
                progressPct={enrollmentResult.progressPct}
                stripeConfigured={stripeConfigured}
                cmiConfigured={cmiConfigured}
              />
            </div>
          </section>
        </div>

        {/* ─── Sections band — accent color background ─── */}
        <div className="w-full bg-primary-bright/10">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-3">

          {/* ─── Section tab strip — centered, navy bold ─── */}
          <nav className="border-y border-line/60 py-3 mb-6 flex items-center justify-center gap-4 lg:gap-8 text-[14px] font-700 tracking-wide uppercase overflow-x-auto">
            <a href="#overview" className="shrink-0 px-2 py-1 text-primary hover:text-primary-bright transition-colors">Overview</a>
            <a href="#curriculum" className="shrink-0 px-2 py-1 text-primary hover:text-primary-bright transition-colors">Curriculum</a>
            <a href="#instructor" className="shrink-0 px-2 py-1 text-primary hover:text-primary-bright transition-colors">Instructor</a>
            <a href="#reviews" className="shrink-0 px-2 py-1 text-primary hover:text-primary-bright transition-colors">Reviews</a>
            {resolvedCourse.faqs.length > 0 && (
              <a href="#faq" className="shrink-0 px-2 py-1 text-primary hover:text-primary-bright transition-colors">FAQ</a>
            )}
          </nav>

          {/* ─── Overview ─── */}
          <section id="overview" className="scroll-mt-20 mb-10">
            <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4 lg:gap-10 items-baseline mb-6">
              <h2 className="text-[28px] lg:text-[34px] font-800 text-primary leading-[1.1]">
                What you&apos;ll learn
              </h2>
              <p className="text-[15px] text-ink/80 font-500 leading-snug">
                Six <em className="italic">concrete capabilities</em> you&apos;ll walk away with.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
              {PLACEHOLDER_LEARNING_OBJECTIVES.map((obj, i) => (
                <div key={i}>
                  <p className="text-[10.5px] tracking-[0.2em] font-700 text-muted mb-1">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="text-[14px] font-700 text-ink mb-0.5">{obj.title}</h3>
                  <p className="text-[12.5px] text-muted leading-snug">{obj.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ─── Curriculum ─── */}
          <section id="curriculum" className="scroll-mt-20 mb-10 pt-6 border-t border-line">
            <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4 lg:gap-10 items-baseline mb-6">
              <h2 className="text-[28px] lg:text-[34px] font-800 text-primary leading-[1.1]">
                Curriculum
              </h2>
              <p className="text-[15px] text-ink/80 font-500 leading-snug">
                An <em className="italic">{resolvedCourse.modules.length || "eight"}-module journey</em>, structured for working professionals.
              </p>
            </div>
            {resolvedCourse.modules.length === 0 ? (
              <p className="text-muted">Curriculum coming soon.</p>
            ) : (
              <ol className="relative pl-8 sm:pl-10 space-y-4">
                <span aria-hidden className="absolute left-2 sm:left-3 top-2 bottom-2 w-px bg-line" />
                {resolvedCourse.modules.map((mod, i) => {
                  const modSeconds = mod.lessons.reduce((s, l) => s + l.durationSeconds, 0);
                  const isFirst = i === 0;
                  return (
                    <li key={mod.id} className="relative">
                      <span
                        aria-hidden
                        className={`absolute -left-[26px] sm:-left-[30px] top-1 w-2.5 h-2.5 rounded-full border ${
                          isFirst ? "bg-ink border-ink" : "bg-white border-line"
                        }`}
                      />
                      <div className="flex items-baseline justify-between gap-4 flex-wrap pb-3 border-b border-line/60">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10.5px] tracking-[0.2em] font-700 text-muted mb-0.5">
                            {String(i + 1).padStart(2, "0")} · {mod.title.toUpperCase()}
                          </p>
                          <h3 className="text-[14.5px] font-700 text-ink mb-0.5">
                            {mod.lessons[0]?.title ?? mod.title}
                          </h3>
                          {mod.lessons.length > 1 && (
                            <p className="text-[11.5px] text-muted">
                              {mod.lessons.slice(0, 4).map((l) => l.title).join(" · ")}
                              {mod.lessons.length > 4 && ` · +${mod.lessons.length - 4} more`}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[12.5px] font-700 text-ink">
                            {modSeconds > 0 ? fmtDuration(modSeconds) : `${mod.lessons.length} lesson${mod.lessons.length !== 1 ? "s" : ""}`}
                          </p>
                          <p className="text-[10px] tracking-[0.2em] font-700 text-muted mt-0.5">
                            {mod.lessons.length} LESSON{mod.lessons.length !== 1 ? "S" : ""}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* ─── Instructor ─── */}
          <section id="instructor" className="scroll-mt-20 mb-10 pt-6 border-t border-line">
            <div className="grid sm:grid-cols-[200px_1fr] gap-5">
              <div className="relative aspect-square rounded-md overflow-hidden bg-gradient-to-br from-[#0d2742] via-[#103354] to-[#16456f]">
                {resolvedCourse.instructor.image ? (
                  <Image
                    src={resolvedCourse.instructor.image}
                    alt={resolvedCourse.instructor.name ?? "Instructor"}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="text-[100px] font-700 text-white/15 leading-none">
                      {(resolvedCourse.instructor.name ?? "I")[0]}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] tracking-[0.25em] font-700 text-muted mb-2">MEET YOUR INSTRUCTOR</p>
                <h2 className="text-xl lg:text-2xl font-700 text-ink mb-1 leading-tight">
                  {resolvedCourse.instructor.name}
                </h2>
                <p className="text-[12.5px] text-muted font-500 mb-4">
                  {resolvedCourse.category.name} expert
                </p>
                {resolvedCourse.instructor.bio && (
                  <p className="text-[13px] text-ink/80 leading-snug mb-4">
                    {resolvedCourse.instructor.bio}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {[resolvedCourse.category.name, resolvedCourse.language.toUpperCase()].map((t) => (
                    <span key={t} className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-bg-soft text-[10.5px] font-600 text-ink/70">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-line max-w-[480px]">
                  <div>
                    <p className="text-lg font-700 text-ink leading-none">{instructorCourseCount}</p>
                    <p className="text-[10.5px] text-muted mt-1">
                      course{instructorCourseCount !== 1 ? "s" : ""} on JissrON
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-700 text-ink leading-none">{instructorStudentCount.toLocaleString()}</p>
                    <p className="text-[10.5px] text-muted mt-1">students across courses</p>
                  </div>
                  {avgRating !== null && (
                    <div>
                      <p className="text-lg font-700 text-ink leading-none">{avgRating.toFixed(1)} avg</p>
                      <p className="text-[10.5px] text-muted mt-1">
                        {resolvedCourse.reviews.length.toLocaleString()} review{resolvedCourse.reviews.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ─── Reviews ─── */}
          <section id="reviews" className="scroll-mt-20 mb-10 pt-6 border-t border-line">
            <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4 lg:gap-10 items-baseline mb-6">
              <h2 className="text-[28px] lg:text-[34px] font-800 text-primary leading-[1.1]">
                Student reviews
              </h2>
              <p className="text-[15px] text-ink/80 font-500 leading-snug">
                What learners say after <em className="italic">finishing the course</em>.
              </p>
            </div>
            {resolvedCourse.reviews.length === 0 ? (
              <p className="text-muted">No reviews yet — be the first after completing this course.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {resolvedCourse.reviews.slice(0, 6).map((review) => (
                  <article key={review.id} className="bg-bg-soft border border-line rounded-md p-3">
                    <div className="flex items-center gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={11}
                          className={i < review.rating ? "text-ink fill-ink" : "text-line"}
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-[12.5px] text-ink/80 leading-snug mb-2.5">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-line">
                      {review.user.image ? (
                        <Image
                          src={review.user.image}
                          alt={review.user.name ?? "Student"}
                          width={28}
                          height={28}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary text-white grid place-items-center text-[10px] font-700">
                          {(review.user.name ?? "S")[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-[12px] font-700 text-ink leading-none">
                          {review.user.name ?? "Student"}
                        </p>
                        <p className="text-[11px] text-muted mt-1">Student</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* ─── FAQ (conditional) ─── */}
          {resolvedCourse.faqs.length > 0 && (
            <section id="faq" className="scroll-mt-20 mb-10 pt-6 border-t border-line">
              <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4 lg:gap-10 items-baseline mb-5">
                <h2 className="text-[28px] lg:text-[34px] font-800 text-primary leading-[1.1]">
                  FAQ
                </h2>
                <p className="text-[15px] text-ink/80 font-500 leading-snug">
                  Frequently asked questions about this course.
                </p>
              </div>
              <CourseFAQAccordion faqs={resolvedCourse.faqs} />
            </section>
          )}
          </div>
        </div>

        {/* ─── Final CTA ─── */}
        <section className="bg-ink text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[1.2fr_1fr] gap-5 lg:gap-8 items-center">
            <div>
              {/* TODO: Course.cohortStartDate field */}
              <p className="text-[10px] tracking-[0.25em] font-700 text-white/50 mb-2">
                — JOIN THE NEXT COHORT
              </p>
              <h2 className="text-xl lg:text-2xl font-700 leading-tight mb-2">
                Cross the <em className="italic font-400 text-white/80">luminous bridge</em> with this course.
              </h2>
              <p className="text-[13px] text-white/70 max-w-[440px] leading-snug">
                {resolvedCourse.subtitle ??
                  "Real projects. Practical skills. Join the professionals already learning on JissrON."}
              </p>
            </div>
            <div className="space-y-2 lg:justify-self-end w-full lg:max-w-[340px]">
              <CourseEnrollButton
                variant="dark"
                course={{
                  id: resolvedCourse.id,
                  slug: resolvedCourse.slug,
                  priceMadCents: resolvedCourse.priceMadCents,
                  priceUsdCents: resolvedCourse.priceUsdCents,
                  stripePriceId: resolvedCourse.stripePriceId ?? null,
                }}
                currency={currency}
                enrollmentStatus={enrollmentResult.status}
                progressPct={enrollmentResult.progressPct}
                stripeConfigured={stripeConfigured}
                cmiConfigured={cmiConfigured}
              />
              <Link
                href="/consults"
                className="block w-full text-center h-12 leading-[3rem] rounded-full border border-white/40 text-white font-700 text-[12px] tracking-wider uppercase hover:bg-white/10 transition-colors"
              >
                Talk to an advisor
              </Link>
              <p className="text-[11px] text-white/50 text-center pt-1">
                14-day refund <span className="mx-1">·</span> Certificate awarded <span className="mx-1">·</span> {resolvedCourse.language.toUpperCase()} support
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
