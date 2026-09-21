import { Link } from "@/i18n/navigation";

export function SuggestCourseCTA() {
  return (
    <section
      className="mt-8"
      style={{
        background: "linear-gradient(135deg, #033a2c 0%, #064e3b 60%, #0b6b53 100%)",
        borderRadius: "20px",
        padding: "56px 48px",
      }}
    >
      <div className="max-w-[640px]">
        <p className="text-[11px] font-700 uppercase tracking-[0.14em] mb-3" style={{ color: "#10b981" }}>
          Shape the curriculum
        </p>
        <h2
          className="font-400 leading-[1.15] mb-4"
          style={{
            fontSize: "clamp(26px, 2.8vw, 34px)",
            color: "#ffffff",
          }}
        >
          Can&apos;t find what you&apos;re looking for?{" "}
          <em style={{ color: "#d9dcd6", fontStyle: "italic" }}>
            Tell us what to build next.
          </em>
        </h2>
        <p className="text-[15px] mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
          Suggest a course topic, a guest instructor, or a skill you need — our editorial team
          reviews every request and prioritises the most-wanted content.
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href="/suggest"
            className="inline-flex items-center font-700 rounded-xl transition-all duration-200 hover:-translate-y-px"
            style={{
              background: "#ffffff",
              color: "#064e3b",
              padding: "14px 32px",
              fontSize: "14px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}
          >
            Suggest a course
          </Link>
          <Link
            href="/teach"
            className="inline-flex items-center font-600 transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px" }}
          >
            Teach on AILearn →
          </Link>
        </div>
      </div>
    </section>
  );
}
