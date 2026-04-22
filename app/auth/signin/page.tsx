import { signIn } from "@/lib/auth";
import { AuthCard } from "@/components/auth/AuthCard";

// ─── Server actions ──────────────────────────────────────────────────────────

async function emailSignIn(formData: FormData) {
  "use server";
  await signIn("resend", {
    email: formData.get("email") as string,
    redirectTo: "/auth/redirect",
  });
}

async function googleSignIn() {
  "use server";
  await signIn("google", { redirectTo: "/auth/redirect" });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export const metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen grid place-items-center bg-bg-soft px-4 py-16"
    >
      <AuthCard
        emailAction={emailSignIn}
        googleAction={googleSignIn}
      />
    </main>
  );
}
