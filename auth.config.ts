import type { NextAuthConfig } from "next-auth";

// Edge-safe auth config — no Prisma, no Node.js-only providers.
// Used by middleware to verify JWTs without importing the full auth stack.
// lib/auth.ts spreads this and adds the adapter, providers, and jwt callback.
export const authConfig = {
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/signin",
    verifyRequest: "/verify-request",
    error: "/error",
  },
  callbacks: {
    session({ session, token }) {
      // Role and id were written into the JWT by lib/auth.ts at sign-in.
      // Casts are safe: jwt callback always sets both fields.
      session.user.id = token.id as string;
      session.user.role = token.role as typeof session.user.role;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
