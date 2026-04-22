import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

// ─── Auth config ─────────────────────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    // JWT strategy: role lives in the token so middleware never needs a DB round-trip.
    // PrismaAdapter still handles VerificationToken rows for magic links.
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? "noreply@jissron.com",
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // ── Initial sign-in ──────────────────────────────────────────────────
      // `account` is only present on the very first sign-in event.
      // We always do a DB lookup here because OAuth adapters (PrismaAdapter)
      // return an AdapterUser type that strips custom columns at the type level,
      // meaning `user.role` can silently be `undefined` even if the column exists.
      if (account && user?.id) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true },
        });
        token.id = dbUser?.id ?? user.id;
        token.role = dbUser?.role ?? "STUDENT";
        return token;
      }

      // ── Subsequent token refreshes ───────────────────────────────────────
      // Role is already cached in the JWT — no DB hit needed.
      // Safety net: if role is missing (e.g. old session from before this fix),
      // re-hydrate from DB once using the token subject (user id).
      if (!token.role && token.sub) {
        const dbUser = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "STUDENT";
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
});
