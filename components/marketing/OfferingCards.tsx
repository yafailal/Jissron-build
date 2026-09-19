import Link from "next/link";
import { BookOpen, Video, Headphones, ArrowRight } from "lucide-react";

interface OfferingCardsProps {
  counts: { courses: number; liveSessions: number; consultants: number };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Three equal cards for the three offerings, shown at the top of the homepage. */
export function OfferingCards({ counts }: OfferingCardsProps) {
  const cards = [
    {
      href: "/courses",
      icon: BookOpen,
      title: "On-demand courses",
      text: "Learn at your own pace with video lessons, quizzes and certificates.",
      meta: plural(counts.courses, "course", "courses"),
      cta: "Browse courses",
    },
    {
      href: "/live",
      icon: Video,
      title: "Live sessions",
      text: "Join workshops, AMAs and seminars with experts, in real time.",
      meta: plural(counts.liveSessions, "upcoming session", "upcoming sessions"),
      cta: "See live sessions",
    },
    {
      href: "/consults",
      icon: Headphones,
      title: "1-on-1 consults",
      text: "Book a 30-minute call with an expert for advice on your goals.",
      meta: plural(counts.consultants, "expert available", "experts available"),
      cta: "Find an expert",
    },
  ];

  return (
    <section className="bg-bg-soft border-b border-line">
      <div className="wrap py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map(({ href, icon: Icon, title, text, meta, cta }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col bg-white border border-line rounded-2xl p-6 transition-all duration-200 hover:-translate-y-[3px] hover:border-primary hover:shadow-card"
            >
              <span className="w-12 h-12 rounded-full bg-primary-soft text-primary-mid grid place-items-center mb-5">
                <Icon size={22} strokeWidth={2} aria-hidden="true" />
              </span>
              <h2 className="text-[20px] font-extrabold tracking-[-0.01em] text-ink">{title}</h2>
              <p className="mt-2 text-[14px] text-body-text font-medium leading-relaxed flex-1">{text}</p>
              <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-line">
                <span className="text-[12.5px] font-semibold text-muted">{meta}</span>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-primary group-hover:text-primary-mid transition-colors">
                  {cta}
                  <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
