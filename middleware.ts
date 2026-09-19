import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // /dashboard/* — must be authenticated
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const signIn = new URL("/signin", req.url);
      signIn.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(signIn);
    }
  }

  // /admin/* — auth handled by the admin layout itself so unauthed users
  // can see the styled in-page sign-in (navy background + SignInModal popup)
  // instead of being redirected to a full /signin page.
  // Non-admins still get bounced to /dashboard by the layout.

  return NextResponse.next();
});

export const config = {
  // Only run middleware on dashboard and admin routes.
  // Exclude static assets and Next.js internals.
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
