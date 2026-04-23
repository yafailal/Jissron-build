import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { WelcomeForm } from "@/components/auth/WelcomeForm";

// ─── Server action ────────────────────────────────────────────────────────────

async function saveProfile(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session) redirect("/signin");

  const name = (formData.get("name") as string | null)?.trim();
  const image = (formData.get("image") as string | null)?.trim() || null;
  const currency = formData.get("currency") as string | null;

  if (name) {
    await db.user.update({
      where: { id: session.user.id },
      data: { name, ...(image ? { image } : {}) },
    });
  }

  if (currency === "MAD" || currency === "USD") {
    const cookieStore = await cookies();
    cookieStore.set("jissron_currency", currency, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: "lax",
    });
  }

  redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const metadata = { title: "Welcome to JissrON" };

export default async function WelcomePage() {
  const session = await auth();
  if (!session) redirect("/signin");

  // If the user already has name + image, skip this page
  if (session.user.name && session.user.image) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <main
      id="main-content"
      className="min-h-screen grid place-items-center bg-bg-soft px-4 py-16"
    >
      <div className="bg-white rounded-2xl border border-line shadow-card w-full max-w-sm p-8">
        {/* Wordmark */}
        <div className="flex items-center gap-2 mb-7">
          <svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true" className="shrink-0">
            <path
              d="M 7 9 Q 7 7 9 7 L 13 7 Q 22 7 22 16 L 22 28 L 16 28 L 16 16 Q 16 13 13 13 L 9 13 L 9 28 L 7 28 Z"
              fill="#003d80"
            />
            <circle cx="26" cy="26" r="3" fill="#0058b8" />
          </svg>
          <span className="text-2xl font-700 tracking-tight leading-none">
            <span className="text-primary">J</span>
            <span className="text-primary-bright">issrO</span>
            <span className="text-primary">N</span>
          </span>
        </div>

        <h1 className="text-[22px] font-800 text-ink leading-snug mb-1">
          You&apos;re in. Let&apos;s set up your profile.
        </h1>
        <p className="text-sm text-muted font-500 mb-6">
          Takes 30 seconds — you can always update this later.
        </p>

        <WelcomeForm saveProfileAction={saveProfile} />
      </div>
    </main>
  );
}
