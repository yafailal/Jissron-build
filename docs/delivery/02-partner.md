<div class="cover">
<p class="wordmark">Jissr<span class="accent">ON</span></p>
<p class="subtitle">Learning Management System</p>
<p class="doc-title">Platform Overview</p>
<p class="doc-meta">For partners · May 2026</p>
</div>

# What JissrON is

JissrON is a web-based learning platform. It hosts three kinds of products that customers can purchase and consume:

1. **On-demand courses** — pre-recorded video lessons organized into modules.
2. **Live sessions** — scheduled group sessions on Zoom or Google Meet.
3. **1-on-1 consultations** — private 30-minute calls with an expert.

The site is bilingual in interface (English / French) and supports content in any language including Arabic. Prices are displayed in either Moroccan dirhams (MAD) or US dollars (USD); users choose their currency at the top of every page.

The platform runs at **jissron.com**.

# Who uses it

Three groups of people interact with the system, each with their own area:

- **Students** — anyone who creates an account. They browse, pay, and consume content.
- **Instructors / Consultants** — people who deliver content. They appear publicly on the site.
- **Administrators** — operate the platform. They have full access to a private admin panel at `/admin`.

A single account can hold multiple roles. For instance, an administrator can also be a student in someone else's course.

# The student journey

This section walks through what happens when a person discovers JissrON, signs up, and uses the platform.

## Discovery and signup

A new visitor lands on the homepage. They see featured courses, the next few upcoming live sessions, and featured consultants. They can browse:

- **Courses** at `/courses` — a filterable catalog (by category, price, language, level, duration, rating).
- **Live sessions** at `/live` — a timeline of upcoming and recent recordings.
- **Consultants** at `/consultants` — a directory of available experts.

To purchase anything, they sign up. Three sign-up paths are supported:

- Email magic link — they enter their email, receive a one-click sign-in link.
- Google account.
- LinkedIn account.

All three resolve to the same account if the email matches.

## Purchase

Courses, paid live sessions, and consultations are all purchased through the same checkout. Three payment methods are available, configurable per market:

- **CMI** — Moroccan card processor. Used for MAD payments. Cards are entered on CMI's hosted page; we never see card data.
- **Stripe** — international card processor. Used for USD payments. Cards are entered on Stripe's hosted page.
- **Bank transfer** — a manual option for MAD. The student is given account details and a unique order reference; an administrator confirms the payment after the transfer is received (typically 1–2 business days).

After payment, the student is automatically enrolled. They receive an email receipt.

## Consuming a course

Courses are organized as **modules**, each containing **lessons**. A single course can mix lesson types:

- **Video** — hosted on Bunny.net, embedded with progress tracking.
- **Audio** — for podcast-style content.
- **PDF** — viewable inside the browser.
- **HTML** — rich-text articles.
- **Text** — plain text.
- **Quiz** — questions auto-graded by the system. Configurable passing threshold and retry limit.
- **Assignment** — student uploads a file; an instructor or admin grades it manually.

The lesson viewer shows the student's progress through the course. When they reach 100% completion, they receive a **certificate** with a unique serial number, viewable at `/certificates/[serial]` by anyone (public verification).

A discussion thread is attached to every lesson, where students ask questions and the instructor replies.

After completion, students can leave a star rating and written review, shown on the course's public page.

## Attending a live session

The student picks a session, reserves a seat (free) or pays for one (Stripe / CMI). The session has a limited capacity defined by the instructor.

The meeting link (Zoom or Meet) is hidden from public view. It becomes visible to confirmed attendees **15 minutes before** the session starts and remains visible until the session ends.

One hour before each session, every confirmed attendee receives a reminder email. After the session ends, if the instructor adds a recording URL, attendees can access it from the same page.

## Booking a consultation

The student picks a consultant from the directory. The consultant's profile shows their bio, skills, rating, and a 14-day calendar of available 30-minute slots.

The student picks a slot, optionally adds a note explaining what they want to discuss, and pays via Stripe or CMI. Once paid, the booking is confirmed and both sides are notified. The consultant arranges the meeting link directly with the student.

# What administrators see

Administrators have a separate area at `/admin` covering ten sections:

| Section | What it does |
|---|---|
| **Site** | Edit every public-site string and image — brand name, logo, hero copy, footer columns, SEO, payment credentials, support contact details. |
| **Courses** | Create, edit, delete courses. Manage modules, lessons, pricing, status (draft/published/archived). |
| **Live sessions** | Schedule sessions, set capacity and price, post meeting and recording URLs. |
| **Consultants** | Add or edit consultant profiles, set their hourly rate and weekly availability. |
| **Users** | Search users, change roles (student/instructor/admin), force sign-out, bulk delete. |
| **Orders** | Full ledger of every paid transaction. Confirm bank transfers. Issue refunds (Stripe is automatic; CMI and bank transfer require a manual side-action). |
| **Grading** | Queue of student submissions awaiting manual grading (assignments + quiz attempts). |
| **Payouts** | Per-instructor revenue split — how much each instructor has earned, what's been paid out, what's outstanding. |
| **Analytics** | Revenue and enrollment metrics, exportable as CSV. |
| **Pages** | Edit static CMS pages (privacy policy, terms of service, and any other custom page). |

Everything that appears on the public site is editable from this panel. The platform deliberately has no hard-coded marketing copy — every piece of text, every image, every link can be changed without code changes.

# What instructors see

Instructors (who are not administrators) get a read-only dashboard at `/instructor` showing:

- Their total students across all courses.
- Their earnings to date (with the platform's cut applied).
- Pending payout amount.
- Number of quiz attempts and assignment submissions awaiting grading.
- A list of their courses with per-course stats.
- Recent enrollments.

Content editing (creating courses, posting lessons, grading) is currently performed by administrators on the instructor's behalf. This keeps editorial oversight in one place.

# Revenue model

A platform-wide revenue split is configurable per instructor (`platformCutPercent`). For example, if it's set to 30%, the instructor receives 70% of every paid enrollment in their courses.

Orders carry an `instructorPayoutAt` timestamp. Administrators mark payouts as complete in `/admin/payouts` after transferring the instructor's share through their own banking process. JissrON tracks who has been paid and who hasn't — the actual money movement is outside the system.

# Communications

The platform sends transactional email through Resend. Five email types currently exist:

- **Order received** — when a bank-transfer order is created. Includes instructions and the order reference.
- **Payment confirmed** — when an order transitions to paid. Includes a link to start learning.
- **Order expired** — when a pending order times out (7 days for bank transfer, 24h for Stripe, 1h for CMI).
- **Course completed** — sent on 100% completion. Encourages leaving a review and browsing other courses.
- **Live session reminder** — sent one hour before each live session to all confirmed attendees.

Email senders are configurable per environment (`EMAIL_FROM`).

# Languages and currencies

The interface supports French and English. Content (course titles, descriptions, lesson text) can be written in any language by the instructor — the platform does not auto-translate.

Two currencies are supported:

- **MAD** (Moroccan dirhams) — default. Paid via CMI or bank transfer.
- **USD** — paid via Stripe.

Every priced item has both prices stored separately, set by an administrator. Visitors toggle currency at the top of every page; the toggle persists across sessions.

# Privacy and compliance

The platform has placeholder privacy and terms pages at `/privacy` and `/terms`. They cover:

- What data is collected (account information, activity, payment references).
- Who it's shared with (Stripe, CMI, Resend, UploadThing, Supabase).
- The user's right to access, correct, or delete their data.

These pages are CMS-editable; administrators should review and tailor them before high-traffic launch.

**Card data is never stored on JissrON's servers** — both Stripe and CMI use hosted payment pages. This places the platform in the lightest PCI compliance scope (SAQ A).

# Reliability

The site is hosted on Vercel's edge network with the database on Supabase. The latest production deployment is built directly from the `main` branch of the source code repository.

Errors that occur during page rendering on the public side are caught by an error boundary and shown as a friendly message — a single bad row in the database cannot take down the entire site. This was added after an incident on May 14, 2026 where a malformed consultant record caused a homepage outage.

# What the platform deliberately does not do (yet)

To be transparent about the scope:

- **No mobile app.** The site is responsive and works on phones, but there is no iOS or Android app.
- **No in-app notifications.** Communication is email-only.
- **No automatic translations.** Instructors write content in one language; the interface shell can be in another.
- **No course downloads.** Video content is streaming-only to protect copyright.
- **No instructor-side content editing.** Course CRUD is centralized in the admin panel.
- **No live chat / DM.** Lesson Q&A is asynchronous threaded.

These are scope decisions, not technical blockers — any of them can be added later.

# What's editable without a code change

- All marketing copy on the homepage (hero, mid-CTA, final CTA, taglines).
- Brand name, logo, primary colors.
- Footer columns (any custom links you want to add).
- SEO metadata.
- Bank account details for transfers.
- Stripe and CMI credentials.
- Contact details (email, phone, WhatsApp, address).
- Privacy and terms text.
- Course content, pricing, status.
- Live sessions, consultant profiles, FAQ entries.

# What requires a code change

- Adding a new payment method.
- Changing the database schema (adding fields, relations).
- Adding a new offering type (beyond courses / live / consults).
- Adding a new lesson type (beyond the existing seven).
- Changing the role hierarchy.
- Adding a new email template type.

# Summary

JissrON is a complete platform for selling and delivering three types of learning products. It handles the entire flow from discovery through purchase, consumption, certification, and review. Content management is centralized in an admin panel; the customer-facing experience is responsive and bilingual. Payments work in both Morocco and internationally without storing any card data.

The system is in production and serving real traffic at jissron.com.
