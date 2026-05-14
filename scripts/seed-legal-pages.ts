// One-off seeder for the privacy + terms legal pages. Safe to re-run — it
// uses upsert on the unique slug and only writes if the page doesn't exist.
//
// Run with:  npx tsx scripts/seed-legal-pages.ts

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const PRIVACY_CONTENT = `
<p><strong>Effective date:</strong> Edit this date from /admin/pages.</p>

<h2>Who we are</h2>
<p>JissrON is an online learning platform offering courses, live sessions, and 1-on-1 consultations. This page explains what personal data we collect and how we use it.</p>

<h2>What we collect</h2>
<ul>
  <li><strong>Account information</strong> — your name, email address, and (optionally) profile picture, provided when you sign up.</li>
  <li><strong>Authentication identifiers</strong> from third-party providers if you sign in with Google or LinkedIn.</li>
  <li><strong>Activity data</strong> — courses you've viewed, lessons you've completed, quiz/assignment submissions, reviews you've written.</li>
  <li><strong>Payment data</strong> — handled by our payment processors (Stripe and CMI). We never store your card number; we keep only the order reference, amount, and status.</li>
  <li><strong>Technical logs</strong> — basic request metadata (IP address, user agent, timestamps) used for security and abuse prevention.</li>
</ul>

<h2>How we use it</h2>
<ul>
  <li>To provide and operate the service you signed up for.</li>
  <li>To send transactional emails (order confirmations, password resets, live-session reminders).</li>
  <li>To improve the platform — we look at anonymized aggregates, never individual sessions for marketing.</li>
  <li>To detect abuse, fraud, and security incidents.</li>
</ul>

<h2>Sharing</h2>
<p>We do not sell your data. We share it with a small set of vetted processors who need it to deliver the service:</p>
<ul>
  <li>Payment: Stripe (international) and CMI (Morocco).</li>
  <li>Email delivery: Resend.</li>
  <li>File hosting: UploadThing.</li>
  <li>Database hosting: Supabase.</li>
</ul>

<h2>Your rights</h2>
<p>You can request a copy of the data we hold about you, ask us to correct it, or ask us to delete your account, by emailing the address listed in the footer. We honour these requests within 30 days.</p>

<h2>Cookies</h2>
<p>We use a small number of strictly-necessary cookies to keep you signed in and remember your currency preference. We do not use third-party analytics or advertising cookies.</p>

<h2>Contact</h2>
<p>Questions? Reach out at the email listed in the site footer.</p>
`.trim();

const TERMS_CONTENT = `
<p><strong>Effective date:</strong> Edit this date from /admin/pages.</p>

<h2>Acceptance of terms</h2>
<p>By creating an account or making a purchase on JissrON, you agree to these terms. If you don't agree, please don't use the service.</p>

<h2>Accounts</h2>
<ul>
  <li>You're responsible for keeping your sign-in credentials secure.</li>
  <li>Accounts are personal and non-transferable.</li>
  <li>One person — one account. We may suspend accounts that appear to be shared.</li>
</ul>

<h2>Purchases and payments</h2>
<ul>
  <li>Prices are shown in MAD or USD depending on your currency preference and the offering. Taxes, if any, are included.</li>
  <li>Payment is processed by Stripe or CMI. JissrON receives only the transaction reference.</li>
  <li>For bank-transfer orders, your enrollment is activated after we receive and verify the transfer (usually within 1–2 business days).</li>
</ul>

<h2>Refunds</h2>
<ul>
  <li><strong>Courses</strong>: full refund within 14 days of purchase, provided you have completed less than 25% of the course content.</li>
  <li><strong>Live sessions</strong>: full refund if you cancel at least 24 hours before the session starts.</li>
  <li><strong>1-on-1 consultations</strong>: full refund if you cancel at least 24 hours before the scheduled time.</li>
  <li>No refunds for sessions or consults that have already started.</li>
</ul>

<h2>Acceptable use</h2>
<p>You agree not to:</p>
<ul>
  <li>Share, redistribute, or publicly post course content you've accessed.</li>
  <li>Use automated tools to scrape or download content.</li>
  <li>Use the service to harass instructors, consultants, or other students.</li>
  <li>Attempt to bypass payment or access controls.</li>
</ul>
<p>We reserve the right to suspend accounts that violate these rules without refund.</p>

<h2>Content ownership</h2>
<p>Course content, live sessions, and consultations are the intellectual property of the respective instructors and consultants. Your enrollment grants you a personal, non-transferable license to access the content — not to redistribute it.</p>

<h2>Disclaimers</h2>
<p>The service is provided "as is". We work hard to keep it running smoothly but don't guarantee uninterrupted availability. Educational content is for informational purposes and does not constitute professional advice (legal, medical, financial).</p>

<h2>Limitation of liability</h2>
<p>To the maximum extent permitted by law, JissrON's total liability for any claim arising from your use of the service is limited to the amount you paid us in the 12 months preceding the claim.</p>

<h2>Changes to these terms</h2>
<p>We may update these terms occasionally. We'll notify you of material changes by email or via a notice on the site. Continued use of the service after a change means you accept the new terms.</p>

<h2>Governing law</h2>
<p>These terms are governed by the laws of Morocco. Disputes will be resolved in the courts of Casablanca unless local consumer protection law gives you the right to use a different forum.</p>

<h2>Contact</h2>
<p>Reach out at the email listed in the site footer for any questions.</p>
`.trim();

async function main() {
  const pages = [
    {
      slug: "privacy",
      title: "Privacy Policy",
      content: PRIVACY_CONTENT,
      metaTitle: "Privacy Policy — JissrON",
      metaDescription:
        "How JissrON collects, uses, and protects your personal data.",
      published: true,
    },
    {
      slug: "terms",
      title: "Terms of Service",
      content: TERMS_CONTENT,
      metaTitle: "Terms of Service — JissrON",
      metaDescription:
        "The rules and policies for using the JissrON learning platform.",
      published: true,
    },
  ];

  for (const p of pages) {
    const existing = await db.page.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`✓ ${p.slug} already exists — skipping (edit via /admin/pages)`);
      continue;
    }
    await db.page.create({ data: p });
    console.log(`+ created ${p.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
