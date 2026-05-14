"use server";

import { Resend } from "resend";
import { db } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "JissrON <onboarding@resend.dev>";

type Result = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactMessage(form: {
  name: string;
  email: string;
  subject: string;
  message: string;
  // Honeypot — bots fill this; humans don't see it
  website?: string;
}): Promise<Result> {
  if (form.website && form.website.trim() !== "") {
    // Silent success so bots don't probe
    return { ok: true };
  }

  const name = form.name.trim();
  const email = form.email.trim();
  const subject = form.subject.trim();
  const message = form.message.trim();

  if (!name) return { ok: false, error: "Name is required" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email" };
  if (subject.length < 3) return { ok: false, error: "Subject is too short" };
  if (message.length < 10) return { ok: false, error: "Message is too short" };
  if (message.length > 5000) return { ok: false, error: "Message is too long (max 5000 chars)" };

  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
    select: { supportEmail: true },
  });
  const to = settings?.supportEmail?.trim();
  if (!to) {
    return {
      ok: false,
      error: "The support email isn't configured yet. Reach out via social or try again later.",
    };
  }

  const safe = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  try {
    await resend.emails.send({
      from: FROM,
      to,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html: `<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#081a36">
  <h2 style="color:#003d80;margin:0 0 16px">New contact message</h2>
  <p style="margin:0 0 8px"><strong>From:</strong> ${safe(name)} &lt;${safe(email)}&gt;</p>
  <p style="margin:0 0 16px"><strong>Subject:</strong> ${safe(subject)}</p>
  <hr style="border:0;border-top:1px solid #e2e8f0;margin:16px 0">
  <p style="white-space:pre-wrap;line-height:1.6">${safe(message)}</p>
  <hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0">
  <p style="font-size:11px;color:#9ca3af">Reply directly to this email — it'll go to ${safe(email)}.</p>
</body></html>`,
    });
  } catch (err) {
    console.error("[contact] resend failed:", err);
    return { ok: false, error: "Couldn't send right now — try again in a moment." };
  }

  return { ok: true };
}
