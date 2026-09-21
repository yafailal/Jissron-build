import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  // First-login nudge: if name or avatar is missing, collect it once.
  if (!session.user.name || !session.user.image) {
    redirect("/welcome");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/dashboard");
}
