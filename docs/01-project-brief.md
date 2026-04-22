# 01 — Project Brief

## What JissrON is

JissrON is an LMS (Learning Management System) / EdTech platform. Think Udemy's structure with Apple's design polish.

It has three distinct offerings, each with equal weight:

| Offering | What it is | Example |
|---|---|---|
| **Courses** | Self-paced video courses | "Python for Everybody — 40 hrs" |
| **Live sessions** | Scheduled group events | "AMA with ex-OpenAI engineer" |
| **Consults** | 1-on-1 bookable calls | "30 min with a senior designer" |

## Who uses it

- **Students** — browse, enroll, attend, book, track progress
- **Instructors** — create and manage their own courses/sessions/consult slots
- **Admins** — control everything: content, site settings, users, payouts

## What the platform does

### Public marketing site
- Homepage (exact match to the reference design)
- Category pages (e.g. `/courses/design`)
- Course detail page with curriculum, reviews, preview video
- Live sessions calendar
- Consultants directory with profiles
- Teacher-landing page, business page, about, blog, etc. (later)

### Student dashboard (logged in)
- "My Courses" with progress tracking
- "My Bookings" for live + consults
- Certificates earned
- Profile / billing / notifications

### Instructor portal
- Create/edit courses, upload lessons
- Manage live session schedule
- Manage consult slots
- View earnings dashboard

### Admin panel (this is the big feature)
- **Full CMS** for every piece of content on the public site
- Users management (promote, suspend)
- Course moderation
- Payment / payout management
- Analytics dashboard
- SEO controls (per-page meta, sitemap)
- Site-wide settings (colors, logos, footer links, announce bar, etc.)

## Build phases (in order)

### Phase 1 — Foundation
- Next.js 15 scaffold with TypeScript, Tailwind, shadcn/ui
- Prisma + PostgreSQL schema (see `docs/03-data-model.md`)
- NextAuth.js with email + Google
- Role-based middleware
- Basic layout: root layout, marketing layout, dashboard layout, admin layout

### Phase 2 — Public homepage
- Build the homepage from `reference/homepage-reference.html` as Next.js components
- Every text/image/color pulls from the database (`SiteSettings` table + content tables)
- Seed the database with the current reference content so the page looks identical on first load
- All sections must be responsive

### Phase 3 — Admin panel v1 (site content)
- Admin layout with sidebar nav
- Site Settings page: hero text, colors, logos, footer, announce bar, SEO defaults
- Courses admin: full CRUD with rich text editor + thumbnail upload
- Live sessions admin: full CRUD with datetime picker + seat limit
- Consultants admin: full CRUD with availability slots
- Live preview after save

### Phase 4 — Student side
- Signup / login / email verification
- Student dashboard
- Course enrollment flow (Stripe checkout)
- Video player with progress tracking
- Live session booking
- Consult booking with calendar

### Phase 5 — Instructor portal
- Instructor onboarding
- Course creator
- Earnings dashboard

### Phase 6 — Polish
- Full SEO (sitemap, robots, OpenGraph, structured data)
- Analytics (Plausible or PostHog)
- Email notifications (Resend)
- Performance optimization
- Accessibility audit

## Technical constraints

- **Must work on mobile** — responsive from 375px up
- **Fast by default** — server components where possible, images optimized
- **Accessible** — semantic HTML, keyboard nav, ARIA where needed, visible focus rings
- **Type-safe** — strict TypeScript, Zod for runtime validation
- **Internationalization-ready** — all user-facing strings go through an i18n layer (even if we only ship English initially), because the site is for a global audience
- **No lock-in** — prefer open standards over proprietary vendors

## Out of scope for v1

- Mobile native app
- Live streaming (we use Zoom/Meet links for now)
- Forum / community features
- Quizzes/assignments (courses are video-only at first)
- Affiliate program
- Multi-currency (USD only to start)
