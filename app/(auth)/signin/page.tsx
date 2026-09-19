import { redirect } from "next/navigation";

// The dedicated /signin page has been removed in favor of the popup-style modal.
// We keep this route alive as a redirect so that:
//   - middleware-driven redirects ("/signin?callbackUrl=…") still work
//   - NextAuth's default unauthenticated redirect (pages.signIn = "/signin") still works
// The user lands on / with `?signin=1` which makes the marketing layout auto-open the modal.
// The original callbackUrl is preserved so OAuth returns to the right place after sign-in.

export default async function SignInRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "";
  const params = new URLSearchParams({ signin: "1" });
  if (callbackUrl) params.set("callbackUrl", callbackUrl);
  redirect(`/?${params.toString()}`);
}
