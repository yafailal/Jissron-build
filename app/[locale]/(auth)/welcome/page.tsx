import Image from "next/image";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
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
    cookieStore.set("ailearn_currency", currency, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: "lax",
    });
  }

  redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("welcomeTitle") };
}

export default async function WelcomePage() {
  const t = await getTranslations("Auth");
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
        {/* Logo */}
        <div className="mb-7">
          <Image src="/logo.png" alt="AILearn" width={160} height={45} className="h-9 w-auto" priority />
        </div>

        <h1 className="text-[22px] font-800 text-ink leading-snug mb-1">
          {t("welcomeHeading")}
        </h1>
        <p className="text-sm text-muted font-500 mb-6">
          {t("welcomeSub")}
        </p>

        <WelcomeForm saveProfileAction={saveProfile} />
      </div>
    </main>
  );
}
