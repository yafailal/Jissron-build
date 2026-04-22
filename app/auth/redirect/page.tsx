import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AuthRedirectPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/dashboard");
}
