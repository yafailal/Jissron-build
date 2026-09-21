import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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
import { ReviewWriteCard } from "@/components/marketing/ReviewWriteCard";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Translator = Awaited<ReturnType<typeof getTranslations>>;

function fmtDuration(seconds: number, t: Translator) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return m > 0 ? t("duration.hm", { h, m }) : t("duration.h", { h });
  return t("duration.m", { m });
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
const PLACEHOLDER_LEARNING_OBJECTIVES = ["o1", "o2", "o3", "o4", "o5", "o6"];

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
  const t = await getTranslations("CourseDetail");

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

  // Review-write eligibility: must be signed in, ACTIVE-enrolled, completedAt set.
  const reviewSession = await auth();
  let reviewWriteState: "eligible" | "not-enrolled" | "not-completed" | "signed-out";
  let myExistingReview: { id: string; rating: number; comment: string | null } | null = null;
  if (!reviewSession) {
    reviewWriteState = "signed-out";
  } else {
    const myEnrollment = await db.enrollment.findFirst({
      where: { userId: reviewSession.user.id, courseId: resolvedCourse.id, status: "ACTIVE" },
      select: { completedAt: true },
    });
    if (!myEnrollment) {
      reviewWriteState = "not-enrolled";
    } else if (!myEnrollment.completedAt) {
      reviewWriteState = "not-completed";
    } else {
      reviewWriteState = "eligible";
      myExistingReview = await db.review.findUnique({
        where: { userId_courseId: { userId: reviewSession.user.id, courseId: resolvedCourse.id } },
        select: { id: true, rating: true, comment: true },
      });
    }
  }

  const isFree = resolvedCourse.priceMadCents === 0 && resolvedCourse.priceUsdCents === 0;
  const price = isFree ? t("free") : `${formatMadCompact(resolvedCourse.priceMadCents)} MAD`;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: resolvedCourse.title,
    description:
      resolvedCourse.subtitle ??
      resolvedCourse.description.replace(/<[^>]+>/g, "").slice(0, 200),
    provider: { "@type": "Organization", name: "AILearn" },
    instructor: { "@type": "Person", name: resolvedCourse.instructor.name },
    courseMode: "online",
    dateModified: new Date(resolvedCourse.updatedAt).toISOString(), // cached data holds ISO strings
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
        <div className="w-full py-5" style={{ background: "linear-gradient(135deg, #064e3b 0%, #0b6b53 62%, #0e7a5a 100%)" }}>
          <section className="grid lg:grid-cols-[2.5fr_1fr] gap-5 lg:gap-6 items-stretch max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10">
            {/* LEFT — trailer/thumbnail (wider, fixed height, aligned with text below) */}
            <div className="relative h-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-hover border border-white/15 lg:-ms-[100px]">
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
              {/* AILearn watermark */}
              <div className="absolute top-3 start-3 text-white text-[9px] tracking-[0.3em] font-bold">AILEARN</div>
              {/* Play button — centered */}
              <button
                type="button"
                className="absolute top-1/2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 grid place-items-center hover:bg-white transition-colors shadow-lg"
                aria-label={t("hero.playTrailer")}
              >
                <Play size={16} className="text-primary fill-primary ms-0.5" />
              </button>
              {/* Bottom info */}
              <div className="absolute start-3 end-3 bottom-3 text-white">
                <p className="text-[9px] tracking-[0.25em] font-bold text-white/70 mb-1">
                  {t("hero.trailerLabel")}
                </p>
                <p className="text-[13px] font-bold leading-tight line-clamp-2">
                  {resolvedCourse.title}
                </p>
                <div className="flex items-center justify-between mt-2 text-[9px] tracking-[0.2em] font-semibold text-white/60">
                  <span>EN · FR</span>
                  <span>02:14</span>
                </div>
              </div>
            </div>

            {/* RIGHT — title card on top, instructor card below; right edge aligned with strip below */}
            <div className="flex flex-col gap-3 lg:-me-[100px]">

            {/* Title card — over the instructor card */}
            <div className="bg-white border border-line rounded-2xl px-4 py-3 flex items-baseline flex-wrap gap-x-3 gap-y-1">
              {resolvedCourse.subtitle && (
                <p className="text-[12px] text-body-text font-semibold leading-snug">
                  {resolvedCourse.subtitle}
                </p>
              )}
              <h1 className="text-[16px] font-extrabold tracking-[-0.02em] text-ink leading-tight">
                {resolvedCourse.title}
              </h1>
            </div>

            <div className="flex flex-col items-center text-center bg-white rounded-2xl p-4 border border-line flex-1">
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-primary-mid mb-2">{t("hero.meetInstructor")}</p>

              {/* Name */}
              <p className="font-bold text-ink text-[16px] leading-tight mb-1">
                {resolvedCourse.instructor.name}
              </p>
              <p className="text-[11.5px] text-muted font-medium mb-3">
                {/* TODO: instructor tagline */}
                {t("categoryExpert", { category: resolvedCourse.category.name })}
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
                <div className="w-[120px] h-[120px] rounded-full bg-primary text-white grid place-items-center text-3xl font-bold mb-3 shrink-0">
                  {(resolvedCourse.instructor.name ?? "I")[0]}
                </div>
              )}

              {/* Bio */}
              {resolvedCourse.instructor.bio && (
                <p className="text-[12px] text-ink/80 leading-snug mb-3 line-clamp-4 text-start w-full">
                  {resolvedCourse.instructor.bio}
                </p>
              )}

              {/* Stats */}
              <div className="mt-auto grid grid-cols-3 gap-2 pt-3 border-t border-line w-full">
                <div>
                  <p className="text-[14px] font-bold text-ink leading-none">{instructorCourseCount}</p>
                  <p className="text-[10px] text-muted mt-1 leading-tight">
                    {t("hero.coursesLabel", { count: instructorCourseCount })}
                  </p>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-ink leading-none">
                    {instructorStudentCount >= 1000
                      ? `${(instructorStudentCount / 1000).toFixed(1)}k`
                      : instructorStudentCount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted mt-1 leading-tight">{t("hero.students")}</p>
                </div>
                {avgRating !== null ? (
                  <div>
                    <p className="text-[14px] font-bold text-ink leading-none flex items-center justify-center gap-0.5">
                      {avgRating.toFixed(1)} <Star size={11} className="fill-primary text-primary" />
                    </p>
                    <p className="text-[10px] text-muted mt-1 leading-tight">{t("hero.rating")}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[14px] font-bold text-ink leading-none">—</p>
                    <p className="text-[10px] text-muted mt-1 leading-tight">{t("hero.rating")}</p>
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
          <nav aria-label={t("breadcrumb.label")} className="flex items-center gap-1.5 text-[11px] text-muted pt-4 pb-3 flex-wrap">
            <Link href="/courses" className="hover:text-ink transition-colors">{resolvedCourse.category.name}</Link>
            <ChevronRight size={11} />
            <Link
              href={`/courses?category=${resolvedCourse.category.slug}`}
              className="hover:text-ink transition-colors"
            >
              {t("breadcrumb.appliedAi")}
            </Link>
            <ChevronRight size={11} />
            <span className="text-ink/70 line-clamp-1">{resolvedCourse.title}</span>
          </nav>

          {/* ─── Stats bar — thinner, sticky under the global nav ─── */}
          <section className="sticky top-[72px] z-30 grid grid-cols-2 lg:grid-cols-4 gap-0 bg-primary text-white rounded-2xl py-3 mb-3">
            {/* Column 1 — Category */}
            <div className="px-4 lg:px-5 border-e border-white/15 last:border-0 flex flex-col justify-center">
              <p className="text-[10px] tracking-[0.2em] font-bold text-white/60 mb-0.5">{t("stats.category")}</p>
              <p className="text-[15px] font-bold leading-tight">{resolvedCourse.category.name}</p>
            </div>
            {/* Column 2 — Hours of video */}
            <div className="px-4 lg:px-5 border-e border-white/15 last:border-0 flex flex-col justify-center">
              <p className="text-[10px] tracking-[0.2em] font-bold text-white/60 mb-0.5">{t("stats.hoursOfVideo")}</p>
              <p className="text-[15px] font-bold leading-tight">
                {totalSeconds > 0 ? fmtDuration(totalSeconds, t) : "—"}
              </p>
            </div>
            {/* Column 3 — Price */}
            <div className="px-4 lg:px-5 border-e border-white/15 last:border-0 flex flex-col justify-center">
              <p className="text-[10px] tracking-[0.2em] font-bold text-white/60 mb-0.5">{t("stats.price")}</p>
              <p className="text-[18px] font-extrabold leading-none">{price}</p>
              {!isFree && resolvedCourse.priceMadCents > 0 && (
                <p className="text-[10.5px] text-white/60 mt-0.5">
                  {t("stats.installments", { amount: formatMadCompact(Math.round(resolvedCourse.priceMadCents / 3)) })}
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
        <div className="w-full bg-bg-soft">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-3">

          {/* ─── Section tab strip — centered, navy bold ─── */}
          <nav className="py-3 mb-6 flex items-center justify-center gap-2 overflow-x-auto">
            <a href="#overview" className="shrink-0 inline-flex items-center h-8 rounded-full px-3.5 text-[13px] font-semibold bg-primary-softer text-ink border border-primary-soft hover:border-primary-mid transition-colors">{t("tabs.overview")}</a>
            <a href="#curriculum" className="shrink-0 inline-flex items-center h-8 rounded-full px-3.5 text-[13px] font-semibold bg-primary-softer text-ink border border-primary-soft hover:border-primary-mid transition-colors">{t("tabs.curriculum")}</a>
            <a href="#instructor" className="shrink-0 inline-flex items-center h-8 rounded-full px-3.5 text-[13px] font-semibold bg-primary-softer text-ink border border-primary-soft hover:border-primary-mid transition-colors">{t("tabs.instructor")}</a>
            <a href="#reviews" className="shrink-0 inline-flex items-center h-8 rounded-full px-3.5 text-[13px] font-semibold bg-primary-softer text-ink border border-primary-soft hover:border-primary-mid transition-colors">{t("tabs.reviews")}</a>
            {resolvedCourse.faqs.length > 0 && (
              <a href="#faq" className="shrink-0 inline-flex items-center h-8 rounded-full px-3.5 text-[13px] font-semibold bg-primary-softer text-ink border border-primary-soft hover:border-primary-mid transition-colors">{t("tabs.faq")}</a>
            )}
          </nav>

          {/* ─── Overview ─── */}
          <section id="overview" className="scroll-mt-20 mb-10">
            <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4 lg:gap-10 items-baseline mb-6">
              <h2 className="text-[22px] lg:text-[26px] font-extrabold tracking-[-0.02em] text-ink leading-[1.15]">
                {t("overview.title")}
              </h2>
              <p className="text-[14px] text-body-text font-medium leading-snug">
                {t.rich("overview.subtitle", { em: (c) => <span>{c}</span> })}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PLACEHOLDER_LEARNING_OBJECTIVES.map((obj, i) => (
                <div key={i} className="bg-white border border-line rounded-2xl p-4">
                  <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-primary-mid mb-1">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="text-[14px] font-bold text-ink mb-0.5">{t(`objectives.${obj}.title`)}</h3>
                  <p className="text-[12.5px] text-muted leading-snug">{t(`objectives.${obj}.body`)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ─── Curriculum ─── */}
          <section id="curriculum" className="scroll-mt-20 mb-10 pt-6 border-t border-line">
            <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4 lg:gap-10 items-baseline mb-6">
              <h2 className="text-[22px] lg:text-[26px] font-extrabold tracking-[-0.02em] text-ink leading-[1.15]">
                {t("curriculum.title")}
              </h2>
              <p className="text-[14px] text-body-text font-medium leading-snug">
                {t.rich("curriculum.subtitle", {
                  count: resolvedCourse.modules.length || t("curriculum.eightFallback"),
                  em: (c) => <span>{c}</span>,
                })}
              </p>
            </div>
            {resolvedCourse.modules.length === 0 ? (
              <p className="text-muted">{t("curriculum.comingSoon")}</p>
            ) : (
              <ol className="relative ps-8 sm:ps-10 space-y-4">
                <span aria-hidden className="absolute start-2 sm:start-3 top-2 bottom-2 w-px bg-line" />
                {resolvedCourse.modules.map((mod, i) => {
                  const modSeconds = mod.lessons.reduce((s, l) => s + l.durationSeconds, 0);
                  const isFirst = i === 0;
                  return (
                    <li key={mod.id} className="relative">
                      <span
                        aria-hidden
                        className={`absolute -start-[26px] sm:-start-[30px] top-1 w-2.5 h-2.5 rounded-full border ${
                          isFirst ? "bg-primary border-primary" : "bg-white border-line"
                        }`}
                      />
                      <div className="flex items-baseline justify-between gap-4 flex-wrap pb-3 border-b border-line/60">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10.5px] tracking-[0.2em] font-bold text-muted mb-0.5">
                            {String(i + 1).padStart(2, "0")} · {mod.title.toUpperCase()}
                          </p>
                          <h3 className="text-[14.5px] font-bold text-ink mb-0.5">
                            {mod.lessons[0]?.title ?? mod.title}
                          </h3>
                          {mod.lessons.length > 1 && (
                            <p className="text-[11.5px] text-muted">
                              {mod.lessons.slice(0, 4).map((l) => l.title).join(" · ")}
                              {mod.lessons.length > 4 && ` · ${t("curriculum.more", { count: mod.lessons.length - 4 })}`}
                            </p>
                          )}
                        </div>
                        <div className="text-end shrink-0">
                          <p className="text-[12.5px] font-bold text-ink">
                            {modSeconds > 0 ? fmtDuration(modSeconds, t) : t("curriculum.lessonsCount", { count: mod.lessons.length })}
                          </p>
                          <p className="text-[10px] tracking-[0.2em] font-bold text-muted mt-0.5">
                            {t("curriculum.lessonsUpper", { count: mod.lessons.length })}
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
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-hover">
                {resolvedCourse.instructor.image ? (
                  <Image
                    src={resolvedCourse.instructor.image}
                    alt={resolvedCourse.instructor.name ?? t("instructor.fallbackAlt")}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="text-[100px] font-bold text-white/15 leading-none">
                      {(resolvedCourse.instructor.name ?? "I")[0]}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-primary-mid mb-2">{t("hero.meetInstructor")}</p>
                <h2 className="text-[22px] lg:text-[26px] font-extrabold tracking-[-0.02em] text-ink mb-1 leading-tight">
                  {resolvedCourse.instructor.name}
                </h2>
                <p className="text-[12.5px] text-muted font-medium mb-4">
                  {t("categoryExpert", { category: resolvedCourse.category.name })}
                </p>
                {resolvedCourse.instructor.bio && (
                  <p className="text-[13px] text-ink/80 leading-snug mb-4">
                    {resolvedCourse.instructor.bio}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {[resolvedCourse.category.name, resolvedCourse.language.toUpperCase()].map((tag) => (
                    <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-softer border border-primary-soft text-[11px] font-semibold text-ink">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-line max-w-[480px]">
                  <div>
                    <p className="text-lg font-bold text-ink leading-none">{instructorCourseCount}</p>
                    <p className="text-[10.5px] text-muted mt-1">
                      {t("instructor.coursesOnSite", { count: instructorCourseCount })}
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-ink leading-none">{instructorStudentCount.toLocaleString()}</p>
                    <p className="text-[10.5px] text-muted mt-1">{t("instructor.studentsAcross")}</p>
                  </div>
                  {avgRating !== null && (
                    <div>
                      <p className="text-lg font-bold text-ink leading-none">{t("instructor.avg", { value: avgRating.toFixed(1) })}</p>
                      <p className="text-[10.5px] text-muted mt-1">
                        {t("instructor.reviewsCount", { count: resolvedCourse.reviews.length })}
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
              <h2 className="text-[22px] lg:text-[26px] font-extrabold tracking-[-0.02em] text-ink leading-[1.15]">
                {t("reviews.title")}
              </h2>
              <p className="text-[14px] text-body-text font-medium leading-snug">
                {t.rich("reviews.subtitle", { em: (c) => <span>{c}</span> })}
              </p>
            </div>
            {/* Write-side: visible to enrolled-and-completed users; hint otherwise */}
            <div className="mb-5">
              <ReviewWriteCard
                courseId={resolvedCourse.id}
                courseSlug={resolvedCourse.slug}
                state={reviewWriteState}
                existing={myExistingReview}
              />
            </div>

            {resolvedCourse.reviews.length === 0 ? (
              <p className="text-muted">{t("reviews.empty")}</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {resolvedCourse.reviews.slice(0, 6).map((review) => (
                  <article key={review.id} className="bg-white border border-line rounded-2xl p-3">
                    <div className="flex items-center gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={11}
                          className={i < review.rating ? "text-primary fill-primary" : "text-line"}
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
                          alt={review.user.name ?? t("reviews.student")}
                          width={28}
                          height={28}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary text-white grid place-items-center text-[10px] font-bold">
                          {(review.user.name ?? "S")[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-[12px] font-bold text-ink leading-none">
                          {review.user.name ?? t("reviews.student")}
                        </p>
                        <p className="text-[11px] text-muted mt-1">{t("reviews.student")}</p>
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
                <h2 className="text-[22px] lg:text-[26px] font-extrabold tracking-[-0.02em] text-ink leading-[1.15]">
                  {t("faq.title")}
                </h2>
                <p className="text-[14px] text-body-text font-medium leading-snug">
                  {t("faq.subtitle")}
                </p>
              </div>
              <CourseFAQAccordion faqs={resolvedCourse.faqs} />
            </section>
          )}
          </div>
        </div>

        {/* ─── Final CTA ─── */}
        <section className="text-white" style={{ background: "linear-gradient(135deg, #064e3b 0%, #0b6b53 62%, #0e7a5a 100%)" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[1.2fr_1fr] gap-5 lg:gap-8 items-center">
            <div>
              {/* TODO: Course.cohortStartDate field */}
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-white/70 mb-2">
                {t("cta.joinCohort")}
              </p>
              <h2 className="text-[22px] lg:text-[26px] font-extrabold tracking-[-0.02em] leading-tight mb-2">
                {t.rich("cta.title", { em: (c) => <span>{c}</span> })}
              </h2>
              <p className="text-[13px] text-white/70 max-w-[440px] leading-snug">
                {resolvedCourse.subtitle ??
                  t("cta.fallbackSubtitle")}
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
                href="/consultants"
                className="flex items-center justify-center w-full h-11 px-6 rounded-full border-[1.5px] border-white/70 text-white font-bold text-[13px] hover:bg-white hover:text-primary transition-colors"
              >
                {t("cta.advisor")}
              </Link>
              <p className="text-[11px] text-white/70 text-center pt-1">
                {t("cta.certificateAwarded")} <span className="mx-1">·</span> {t("cta.langSupport", { lang: resolvedCourse.language.toUpperCase() })}
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
