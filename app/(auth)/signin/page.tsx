import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";

// ─── Server actions ───────────────────────────────────────────────────────────

async function emailSignIn(formData: FormData) {
  "use server";
  await signIn("resend", {
    email: formData.get("email") as string,
    redirectTo: "/redirect",
  });
}

async function googleSignIn() {
  "use server";
  await signIn("google", { redirectTo: "/redirect" });
}

async function linkedInSignIn() {
  "use server";
  await signIn("linkedin", { redirectTo: "/redirect" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
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
        heading="Welcome back."
        subheading="Sign in to your JissrON account."
        googleAction={hasGoogle ? googleSignIn : undefined}
        linkedInAction={hasLinkedIn ? linkedInSignIn : undefined}
        emailAction={hasEmail ? emailSignIn : undefined}
        switchText="Don't have an account?"
        switchHref="/signup"
        switchLabel="Sign up"
      />
    </main>
  );
}
