
# Phase 6 — Student Side, Payments & Learning Experience

## Overview
Phase 6 transforms JissrON from an admin-only CMS into a working LMS where students can sign up, enroll in courses (free or paid), consume content, track progress, earn certificates, and leave reviews.

This is the largest phase of the project — it's split into sub-passes (6.1 through 6.8) so each can be built, tested, and committed independently.

## Success criteria
By end of Phase 6:
- A new user can sign up via Google, LinkedIn, or email magic link
- They can browse public course detail pages
- They can enroll in free courses with one click
- They can purchase paid courses via bank transfer (MAD) or Lemon Squeezy (USD)
- They can consume lesson content (video, audio, text, PDF, HTML) with progress tracking
- They can resume where they left off
- They earn a PDF certificate on 100% completion
- They can write reviews after completing a course
- They receive transactional emails for key actions
- Admin can review pending bank transfers and confirm enrollments

## Scoping decisions (locked in)

### Authentication
- Google OAuth (already working) + LinkedIn + Email magic link (Resend)
- Email verification required before enrollment
- Existing role system: STUDENT (default for new signups), INSTRUCTOR, ADMIN

### Enrollment
- Free courses: require enrollment click (not auto-unlocked)
- Paid courses: require payment first, then enrollment created on confirmation
- Access model: lifetime after enrollment
- Refund policy: no refunds

### Payments
- **MAD** → Bank transfer to Attijariwafa Bank (personal account for now)
- **USD** → Lemon Squeezy (merchant of record, no Stripe Atlas needed)
- Routing tied to existing currency toggle
- Receipt upload on bank transfer (optional, "fast track" messaging)
- QR code on checkout with bank details in plain-text format
- Admin has "Pending orders" queue to confirm bank transfers
- Auto-expiration after 7 days of no confirmation

### Coupons
- Full system: percentage off, fixed off, expiry dates, usage limits, per-course or site-wide
- Admin CRUD + public "Have a coupon?" field on checkout

### Learning experience
- Progress tracking: granular, same-device (resume exactly where left off)
- Certificates: auto-generated PDF on 100% course completion
- Reviews: after 100% completion only, 1-5 stars + text, one per student per course
- Emails (minimal): enrollment confirmation, payment confirmed, magic link sign-in

### Bookings
- Live Session booking: seat reservation on paid sessions
- Consultant booking: weekday availability slots

## Sub-phase breakdown

### Phase 6.1 — Student authentication
**Goal:** Extend auth to support public signup with multiple providers.

- Add LinkedIn provider to NextAuth v5 config
- Add Email magic link via Resend (free tier: 3000 emails/month)
- Email verification flow: user must click magic link before their first enrollment
- `/signin` and `/signup` public pages with Google + LinkedIn + email options
- Smart redirect after sign-in (STUDENT → /dashboard, INSTRUCTOR → /dashboard, ADMIN → /admin)
- Role defaults to STUDENT for new sign-ups
- Profile completion nudge: after first signin, if name/avatar missing, prompt once

**External dependencies:** LinkedIn Developer app (free, ~15 min setup), Resend account (free tier, ~15 min setup + 2-24h for domain verification if using custom sending domain).

### Phase 6.2 — Public course detail pages
**Goal:** Build the public-facing course pages that visitors see before enrolling.

- Route: `/courses/[slug]`
- Hero section: thumbnail, title, subtitle, instructor, rating (if reviews exist), price in selected currency
- Curriculum preview: module list with lesson titles (preview lessons marked, full content behind enrollment)
- About section: rich text description
- Instructor card: photo, name, bio, other courses by same instructor
- Reviews section: aggregate rating + recent reviews
- FAQ section (if enabled per course)
- Sticky sidebar with enroll/purchase CTA
- SEO: proper meta tags, OG images, structured data (JSON-LD for Course schema)

### Phase 6.2.5 — Per-course FAQ (small addition)
**Goal:** Let admins attach FAQ items to specific courses.

- Add CourseFAQ model: id, courseId (FK cascade), question, answer (Text), order, createdAt
- Admin: new FAQ tab in CourseForm with add/edit/delete/reorder (drag-to-sort like curriculum)
- Public: render FAQ accordion section on /courses/[slug] detail page, between Reviews and Sidebar
- Seed: add 2-3 sample FAQs per seeded course

Time: ~15-25 min Claude Code. Runs immediately after Phase 6.2 before Phase 6.3.

### Phase 6.3 — Enrollment & entitlements
**Goal:** Wire up the enrollment flow for free courses + the data layer for paid.

Data model additions:
- `Enrollment` model (already exists) — enhance with: enrolledAt, method (FREE | BANK_TRANSFER | LEMON_SQUEEZY), status (ACTIVE | REVOKED | EXPIRED)
- `Order` model (new) — unified order record for both payment methods, stores: user, course, amount (MAD + USD), currency, method, status, reference, createdAt, confirmedAt

Flows:
- Free course: student clicks "Enroll free" → check auth + email verified → create Enrollment → redirect to course
- Paid course (user not logged in): "Enroll" → redirect to signin → return to course page
- Paid course (logged in): "Enroll" → creates Order → redirects to appropriate checkout page (bank or Lemon Squeezy based on currency)

Access gating:
- Course content (lessons) only accessible to enrolled users
- Server-side check via middleware or server action guard
- Preview lessons bypass this check (isPreview flag)

### Phase 6.4 — Bank transfer flow (MAD)
**Goal:** Build the bank transfer payment flow for Moroccan customers.

- Site Settings: add "Bank details" section (RIB, bank name, account holder, IBAN optional, SWIFT optional)
- Checkout page `/checkout/bank/[orderId]`:
  - Display bank details + QR code (generated from RIB + amount + reference in plain-text format)
  - Display unique reference code (e.g., JISS-2026-00042)
  - Optional receipt upload (UploadThing: PDFs + images, 5MB max)
  - "Fast track" UX messaging (upload → 4h access) vs "Standard" (no upload → 24-48h)
  - "I've completed the transfer" button → changes order status to SUBMITTED
- Admin panel `/admin/orders`:
  - Pending orders queue
  - Each order shows: student, amount, reference, receipt thumbnail (if uploaded), timestamp
  - Actions: Confirm (creates Enrollment), Reject (asks for new transfer), Ask student for info (email)
  - Bulk actions for multiple confirmations
- Auto-expiration: orders not confirmed within 7 days → status EXPIRED, student can retry
- QR code library: `qrcode` npm package, plain-text encoded for maximum compatibility

### Phase 6.5 — Lemon Squeezy flow (USD)
**Goal:** Build the Lemon Squeezy checkout flow for international customers.

- Admin config: Lemon Squeezy API key stored server-side in env vars
- Admin panel: link each paid course to its Lemon Squeezy product (one-time per course)
- Checkout page `/checkout/ls/[orderId]`:
  - Creates Lemon Squeezy checkout session via their API
  - Redirects student to Lemon Squeezy hosted checkout
  - On success, student returns to JissrON success page
- Webhook handler `/api/webhooks/lemon-squeezy`:
  - Validates Lemon Squeezy signature
  - On `order_created`: creates Enrollment, sends confirmation email
  - On `subscription_payment_failed` / `refund`: revokes access
- Test mode first (Lemon Squeezy has test keys), live mode after verification

**External dependencies:** Lemon Squeezy account (~15 min to sign up, **1-2 days for KYC verification**). Dev work can start with test keys immediately — verification blocks only the production switch.

### Phase 6.6 — Lesson viewer & progress tracking
**Goal:** The actual learning experience — consuming lessons with progress saved.

Lesson viewer route: `/learn/[courseSlug]/[lessonId]`
- Left sidebar: curriculum navigation (modules → lessons, current highlighted)
- Main area: content-type-aware renderer:
  - VIDEO: Bunny Stream iframe embed with Token Authentication signed URL
  - AUDIO: custom HTML5 audio player
  - TEXT: rendered HTML from Tiptap
  - PDF: embedded viewer (react-pdf or similar)
  - HTML: sandboxed iframe for admin-provided HTML embeds
- Progress tracking:
  - VIDEO: timestamp saved every 10 seconds via debounced API call
  - AUDIO: same pattern
  - TEXT/PDF/HTML: "Mark complete" button
- Resume feature: on page load, if lesson has saved progress, seek to that point
- Next/Previous lesson navigation
- Course completion detection: when all lessons marked complete, trigger certificate generation

Data model:
- `LessonProgress` model (already exists) — enhance with: watchedSeconds, lastWatchedAt, completedAt

**External dependencies:** Bunny Stream account + library + Token Authentication enabled (~30 min setup). Can be deferred — initial work can use placeholder URLs.

### Phase 6.7 — Student dashboard
**Goal:** "My Courses" + profile for the student.

Route: `/dashboard` (already protected for STUDENT role via middleware)
- My Courses: grid of enrolled courses with progress bar per course
- Continue learning: resume last lesson across all courses
- Certificates: list of earned certificates with download links
- Profile: name, avatar, email, preferred currency (link to toggle)
- Account settings: email preferences, language

### Phase 6.8 — Certificates + reviews + emails + bookings + coupons
**Goal:** The final layer of polish before launch.

Certificates:
- PDF generation via @react-pdf/renderer or pdfmake
- Template: JissrON logo, student name, course title, instructor name, completion date, unique certificate ID
- Storage: generated on-demand, optionally cached in Supabase storage
- Download URL accessible from student dashboard

Reviews:
- Form: 1-5 stars + text
- Only visible after student completes course (100% progress)
- Display on course detail page (aggregate + recent reviews)
- One review per student per course
- Instructor can respond to reviews (optional, nice-to-have)

Transactional emails via Resend:
- Enrollment confirmation (free course)
- Payment received (bank transfer confirmed by admin)
- Payment confirmed (Lemon Squeezy success)
- Magic link sign-in (already needed for auth)
- Course completion with certificate download link

Bookings:
- Live Session booking: "Reserve seat" CTA, seat count tracking, confirmation email with calendar ICS
- Consultant booking: pick available weekday slot, confirmation email, calendar ICS

Coupons:
- Admin CRUD: `/admin/coupons` (percentage, fixed, expiry, usage limit, per-course or site-wide)
- Public: "Have a coupon?" field on checkout for both bank transfer and Lemon Squeezy
- Validation on apply, redemption tracking per user

## Build order with rationale

| Pass | Deliverable | Why this order |
|---|---|---|
| 6.1 | Auth | Can't do anything else without students |
| 6.2 | Course detail pages | Need a page to enroll from |
| 6.3 | Enrollment + free course flow | Proves end-to-end works before payments |
| 6.4 | Bank transfer flow | Moroccan customers first (primary market) |
| 6.5 | Lemon Squeezy | International customers second |
| 6.6 | Lesson viewer + progress | Enables content consumption |
| 6.7 | Student dashboard | Ties everything together |
| 6.8 | Polish layer | Final details before launch |

## Realistic time estimates

Based on actual Claude Code cadence from Phases 1-5 of this project.

| Pass | Claude Code build | User setup | External wait |
|---|---|---|---|
| 6.1 | 15-25 min | 30 min (LinkedIn + Resend signup) | 0-24h for Resend domain (optional) |
| 6.2 | 20-30 min | — | — |
| 6.3 | 15-25 min | — | — |
| 6.4 | 25-40 min | 10 min (enter bank details in admin) | — |
| 6.5 | 20-30 min | 30 min (Lemon Squeezy signup) | 1-2 days for KYC verification |
| 6.6 | 30-45 min | 30 min (Bunny Stream setup) | — |
| 6.7 | 15-25 min | — | — |
| 6.8 | 45-60 min | — | — |

**Claude Code build time: ~3-4 hours across 8 sub-passes.**
**User setup work: ~2 hours total, spread across different days.**
**Calendar wait time: 1-2 days for Lemon Squeezy verification (parallelizable with other work).**

Realistic elapsed time: 3-7 calendar days if working part-time, 1-2 focused days if dedicated.

## External services user must set up

### Before Phase 6.1
- **LinkedIn Developer app** at developer.linkedin.com
  - Create app, enable "Sign In with LinkedIn using OpenID Connect"
  - Add redirect URI: http://localhost:3000/api/auth/callback/linkedin
  - Get Client ID + Client Secret → .env.local as LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
- **Resend account** at resend.com
  - Free tier: 3000 emails/month
  - Get API key → .env.local as RESEND_API_KEY
  - Can use resend.dev test domain initially; verify custom domain later

### Before Phase 6.5
- **Lemon Squeezy account** at lemonsqueezy.com
  - Sign up as individual or Moroccan business
  - Verify identity (ID + selfie), bank account (Moroccan IBAN), tax form (W-8BEN for non-US)
  - Get test API key → .env.local as LEMON_SQUEEZY_API_KEY
  - Wait 1-2 days for verification before going live

### Before Phase 6.6
- **Bunny Stream account** at bunny.net
  - Create video library
  - Enable Token Authentication
  - Note the library ID + signing key → .env.local

### Before launch (Phase 7)
- Proper sending domain in Resend (verify DNS)
- Production Lemon Squeezy keys (after verification)
- Production Bunny Stream settings (proper CDN region if needed)

## Out of scope for Phase 6 (deferred to Phase 7 or later)

- Quiz taker UI (DB tables exist from Phase 5, UI comes later)
- Assignment submission UI (DB tables exist, UI comes later)
- Advanced analytics dashboard
- Multiple bank accounts
- Cross-device progress sync
- Drip email campaigns / marketing emails
- Facebook social login
- Certificate public verification URL
- Course bundles / learning paths
- Affiliate / referral program
- Multi-language UI (i18n) — Phase 7 polish
