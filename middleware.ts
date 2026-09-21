import NextAuth from "next-auth";
import createIntlMiddleware from "next-intl/middleware";
import { authConfig } from "@/auth.config";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createIntlMiddleware(routing);

// /dashboard with an optional language prefix (/fr/dashboard, /ar/dashboard/orders, …)
const LOCALE_PREFIX = `(?:/(?:${routing.locales.join("|")}))?`;
const DASHBOARD = new RegExp(`^${LOCALE_PREFIX}/dashboard(?:/|$)`);

// Auth check only. Auth.js rewrites the request URL to the AUTH_URL / NEXTAUTH_URL host, so its
// request object must not be handed to the language middleware (rewrites would then be proxied
// to that host — this broke preview deployments and other hostnames). We only use it to decide
// whether to redirect to sign-in.
//
// /admin/* — auth is handled by the admin layout itself so unauthed users can see the styled
// in-page sign-in instead of being redirected to a full /signin page.
const dashboardGate = auth((req) => {
  if (!req.auth) {
    const signIn = new URL("/signin", req.url);
    signIn.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
});

export default async function middleware(req: NextRequest, event: Parameters<typeof dashboardGate>[1]) {
  let gateResponse: Response | undefined;

  if (DASHBOARD.test(req.nextUrl.pathname)) {
    gateResponse = (await dashboardGate(req, event)) as Response | undefined;
    // Not signed in: pass the redirect straight through.
    if (gateResponse?.headers.get("location")) return gateResponse;
  }

  // Everything else: language detection / prefixing, on the original request.
  const response = intlMiddleware(req);

  // Keep any cookies the auth layer wanted to set (session refresh).
  gateResponse?.headers.getSetCookie().forEach((c) => response.headers.append("set-cookie", c));
  return response;
}

export const config = {
  // Skip API routes, Next.js internals, payment/certificate/instructor areas and static files.
  matcher: ["/((?!api|_next|_vercel|certificates|checkout/cmi|instructor|.*\\..*).*)"],
};
