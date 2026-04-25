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

  // /admin/* — must be authenticated AND have ADMIN role
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const signIn = new URL("/signin", req.url);
      signIn.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(signIn);
    }
    if (session.user?.role !== "ADMIN") {
      // Authenticated but not admin — redirect to their dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  // Only run middleware on dashboard and admin routes.
  // Exclude static assets and Next.js internals.
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
