import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import Resend from "next-auth/providers/resend";
import { Resend as ResendClient } from "resend";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

// ─── Magic link email template ────────────────────────────────────────────────

function magicLinkHtml(url: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Sign in to JissrON</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f7fa;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr>
            <td style="padding:40px 40px 28px;text-align:center;">
              <p style="margin:0 0 28px;font-size:26px;font-weight:800;letter-spacing:-0.5px;line-height:1;">
                <span style="color:#003d80;">J</span><span style="color:#0071e3;">issrO</span><span style="color:#003d80;">N</span>
              </p>
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#081a36;line-height:1.3;">Sign in to JissrON</h1>
              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
                Click the button below to sign in. This link expires in 15&nbsp;minutes.<br/>
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 36px;text-align:center;">
              <a href="${url}" target="_blank" style="display:inline-block;background-color:#003d80;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;padding:14px 36px;">Sign in</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 36px;">
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">Or paste this link into your browser:</p>
              <p style="margin:0;font-size:11px;color:#64748b;word-break:break-all;">${url}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">JissrON — Professional learning made accessible.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Providers ────────────────────────────────────────────────────────────────
// Only register providers whose env vars are present — app runs with any subset.

function buildProviders() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list: any[] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    list.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    );
  } else {
    console.warn("[auth] Google provider disabled — GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing");
  }

  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    list.push(
      LinkedIn({
        clientId: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      })
    );
  }

  if (process.env.RESEND_API_KEY) {
    const from = process.env.EMAIL_FROM ?? "JissrON <onboarding@resend.dev>";
    list.push(
      Resend({
        apiKey: process.env.RESEND_API_KEY,
        from,
        maxAge: 900, // 15 minutes
        sendVerificationRequest: async ({ identifier: email, url }) => {
          const client = new ResendClient(process.env.RESEND_API_KEY!);
          const { error } = await client.emails.send({
            from,
            to: email,
            subject: "Your JissrON sign-in link",
            html: magicLinkHtml(url),
          });
          if (error) throw new Error(`Magic link send failed: ${error.message}`);
        },
      })
    );
  } else {
    console.warn("[auth] Resend provider disabled — RESEND_API_KEY missing");
  }

  return list;
}

// ─── Auth config ─────────────────────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    // JWT strategy: role lives in the token so middleware never needs a DB round-trip.
    strategy: "jwt",
  },
  providers: buildProviders(),
  callbacks: {
    async signIn({ user, account }) {
      // OAuth providers (Google, LinkedIn) return verified emails — mark immediately.
      // PrismaAdapter creates the user before this callback, so user.id is available.
      if (account?.type === "oauth" && user?.id) {
        await db.user.updateMany({
          where: { id: user.id, emailVerified: null },
          data: { emailVerified: new Date() },
        });
      }
      return true;
    },

    async jwt({ token, user, account }) {
      // ── Initial sign-in ──────────────────────────────────────────────────
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
    signIn: "/signin",
    verifyRequest: "/verify-request",
    error: "/error",
  },
});
