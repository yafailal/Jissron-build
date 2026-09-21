import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthCard } from "@/components/auth/AuthCard";

// ─── Server actions ───────────────────────────────────────────────────────────

async function emailSignUp(formData: FormData) {
  "use server";
  await signIn("resend", {
    email: formData.get("email") as string,
    redirectTo: "/redirect",
  });
}

async function googleSignUp() {
  "use server";
  await signIn("google", { redirectTo: "/redirect" });
}

async function linkedInSignUp() {
  "use server";
  await signIn("linkedin", { redirectTo: "/redirect" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: t("signUpTitle") };
}

export default async function SignUpPage() {
  const t = await getTranslations("Auth");
  const session = await auth();
  if (session) redirect("/redirect");

  const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const hasLinkedIn = !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
  const hasEmail = !!process.env.RESEND_API_KEY;

  return (
    <main
      id="main-content"
      className="min-h-screen grid place-items-center bg-bg-soft px-4 py-16"
    >
      <AuthCard
        heading={t("signUpHeading")}
        subheading={t("signUpSubheading")}
        googleAction={hasGoogle ? googleSignUp : undefined}
        linkedInAction={hasLinkedIn ? linkedInSignUp : undefined}
        emailAction={hasEmail ? emailSignUp : undefined}
        switchText={t("haveAccount")}
        switchHref="/signin"
        switchLabel={t("signIn")}
      />
    </main>
  );
}
