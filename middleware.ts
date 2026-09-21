import NextAuth from "next-auth";
import createIntlMiddleware from "next-intl/middleware";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createIntlMiddleware(routing);

// /dashboard with an optional language prefix (/fr/dashboard, /ar/dashboard/orders, …)
const LOCALE_PREFIX = `(?:/(?:${routing.locales.join("|")}))?`;
const DASHBOARD = new RegExp(`^${LOCALE_PREFIX}/dashboard(?:/|$)`);
const ADMIN = /^\/admin(?:\/|$)/;

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // /dashboard/* — must be authenticated
  if (DASHBOARD.test(pathname) && !req.auth) {
    const signIn = new URL("/signin", req.url);
    signIn.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signIn);
  }

  // /admin/* — auth handled by the admin layout itself so unauthed users
  // can see the styled in-page sign-in instead of being redirected to a full
  // /signin page. Admin is not language-prefixed (yet).
  if (ADMIN.test(pathname)) return NextResponse.next();

  // Everything else: language detection / prefixing.
  return intlMiddleware(req);
});

export const config = {
  // Skip API routes, Next.js internals, payment/certificate/instructor areas and static files.
  matcher: ["/((?!api|_next|_vercel|certificates|checkout/cmi|instructor|.*\\..*).*)"],
};
