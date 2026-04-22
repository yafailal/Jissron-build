# 05 — First Prompts (paste these into Claude Code)

Use these in order. Don't skip ahead. After each one, let Claude Code finish, verify it works, commit to git, then move on.

---

## PROMPT 1 — Scaffold

> Read `CLAUDE.md`, `docs/01-project-brief.md`, `docs/02-design-system.md`, `docs/03-data-model.md`, and `reference/homepage-reference.html`. Then scaffold the Next.js 15 project.
>
> Specifically:
> 1. Create a new Next.js 15 app with TypeScript, Tailwind, the App Router, and `src/` directory **disabled** (use root `app/`). Use pnpm.
> 2. Install and configure: Tailwind, shadcn/ui (with `slate` base theme — we'll override with our Atlas Blue colors), Prisma with PostgreSQL, NextAuth.js v5, Zod, Tanstack Query, Sonner for toasts, Lucide icons, `next/font` with Montserrat.
> 3. Set up the Prisma schema exactly as specified in `docs/03-data-model.md`.
> 4. Create a `.env.example` with all required env vars and a `.env.local` with a placeholder DATABASE_URL (I'll fill in real values).
> 5. Implement the color system from `docs/02-design-system.md`: add CSS variables to `app/globals.css` and extend `tailwind.config.ts` so we can use `bg-primary`, `text-primary`, `text-ink` etc.
> 6. Create 4 empty layout routes: `app/(marketing)/layout.tsx`, `app/(dashboard)/layout.tsx`, `app/(admin)/layout.tsx`, and the root `app/layout.tsx` (which loads Montserrat and global styles).
> 7. Create middleware at `middleware.ts` that protects `/dashboard/*` (any logged-in user) and `/admin/*` (ADMIN role only). Redirect unauthenticated users to `/auth/signin`.
> 8. Create `prisma/seed.ts` that seeds a default `SiteSettings` row plus sample courses, live sessions, consultants, and categories matching the reference HTML.
>
> When done, show me the file tree and the key commands to run (`pnpm install`, `pnpm prisma db push`, `pnpm prisma db seed`, `pnpm dev`). Don't build the homepage yet.

---

## PROMPT 2 — Homepage (public)

> Now build the public homepage at `app/(marketing)/page.tsx`.
>
> Requirements:
> - Match `reference/homepage-reference.html` pixel-for-pixel at desktop width. Rebuild every section as a proper Next.js Server Component.
> - Pull ALL content from the database: `SiteSettings` (hero text, colors, banner, footer) plus the course/live/consultant tables. No hardcoded copy.
> - Break it into these component files under `components/marketing/`:
>   - `UrgencyBanner.tsx`, `MarketingNav.tsx`, `Hero.tsx`, `TrustStrip.tsx`, `CoursesSection.tsx`, `CourseCard.tsx`, `CourseCarousel.tsx`, `MidCtaBanner.tsx`, `LiveSessionsSection.tsx`, `LiveSessionRow.tsx`, `ConsultantsSection.tsx`, `ConsultantCard.tsx`, `FinalCta.tsx`, `MarketingFooter.tsx`
> - The CTA for search should take the query and navigate to `/search?q=...` (that page can be empty for now).
> - The carousel prev/next buttons should work (use a small client component that scrolls the container).
> - Tabs in sections should be client components; actually filter the displayed items.
> - Use `next/image` for all images.
> - Every section responsive to 375px.
>
> When done, run `pnpm dev` and walk me through what was built, in order, top to bottom.

---

## PROMPT 3 — Auth

> Implement NextAuth.js v5 with:
> - Email magic link (using Resend for the email sender — read key from env)
> - Google OAuth
> - Prisma adapter
>
> Build these routes/pages:
> - `app/auth/signin/page.tsx` — email form + "Continue with Google" button
> - `app/auth/verify-request/page.tsx` — after magic link sent
> - `app/api/auth/[...nextauth]/route.ts` — the NextAuth handler
> - `lib/auth.ts` — the config export
>
> Make new users default to `role = STUDENT`. Seed one user with `role = ADMIN` and email I'll specify (ask me before seeding).
>
> Also implement `components/marketing/UserMenu.tsx` that shows Sign in / Sign up when logged out, and an avatar dropdown with Dashboard / Admin (if admin) / Sign out when logged in.

---

## PROMPT 4 — Admin v1 (Site Settings)

> Read `docs/04-admin-spec.md`. Build the admin shell and the Site Settings section.
>
> 1. `app/(admin)/layout.tsx` — sidebar + topbar shell. Sidebar items: Dashboard, Site, Courses, Live, Consultants, Users, Pages, Settings.
> 2. `app/(admin)/admin/page.tsx` — dashboard with 4 StatCards (placeholder counts) and ActivityFeed.
> 3. `app/(admin)/admin/site/page.tsx` — the multi-tab Site Settings editor.
> 4. Build shared admin components under `components/admin/` as listed in `docs/04-admin-spec.md`.
> 5. Server Actions for all mutations. Every successful save:
>    - Writes an `ActivityLog` entry
>    - Triggers `revalidatePath("/")` so the homepage updates
>    - Shows a success toast
>
> The Site Settings tabs must cover: Brand, Hero, Urgency banner, Trust strip, Mid-CTA, Final CTA, Footer, SEO defaults — all fields listed in `docs/03-data-model.md`.
>
> Use react-hook-form + Zod for every form.

---

## PROMPT 5 — Admin v2 (Courses, Live, Consultants)

> Build the Courses, Live, and Consultants CRUD interfaces as specified in `docs/04-admin-spec.md`.
>
> For each:
> - List page with search + filter + pagination (DataTable component using Tanstack Table)
> - Create page (`/new`)
> - Edit page (`/[id]`)
> - Delete confirmation modal
>
> For the course curriculum editor, use `@dnd-kit/core` for drag-to-reorder modules and lessons.
>
> For rich text, use Tiptap with the extensions listed in `docs/04-admin-spec.md`.
>
> For image uploads, set up UploadThing.
>
> Wire every save to also `revalidatePath("/")` and the relevant detail page path.

---

## PROMPT 6 — Student side

> Build the student experience:
> - `/dashboard` — overview: continue learning cards, upcoming sessions, recent activity
> - `/dashboard/courses` — enrolled courses list
> - `/dashboard/bookings` — live sessions + consult bookings
> - `/dashboard/certificates` — earned certificates
> - `/dashboard/settings` — profile + notification prefs
> - `/courses/[slug]` — public course detail page with curriculum, reviews, enroll button
> - `/courses/[slug]/learn/[lessonId]` — video player with progress tracking
> - `/live/[slug]` — live session detail with Reserve button
> - `/consultants/[id]` — consultant profile with availability picker + Book button
>
> Enrollment flow:
> - Click Enroll → Stripe Checkout → webhook creates Enrollment → redirect to `/dashboard/courses`
>
> Skip actual video hosting for now — just accept a URL in the Lesson model and use a plain `<video>` tag.

---

## PROMPT 7 — Polish & deploy prep

> Final pass:
> 1. Add SEO — `generateMetadata` on every public page pulling from `SiteSettings` and per-entity metadata
> 2. Build `app/sitemap.ts` and `app/robots.ts`
> 3. Add a cookie consent banner (toggleable via SiteSettings)
> 4. Add `prefers-reduced-motion` support
> 5. Accessibility audit: run through with a screen reader, fix any issues
> 6. Add email templates via Resend for: enrollment confirmation, booking confirmation, password reset
> 7. Create a `README.md` at the project root with setup + deployment instructions for Vercel + Supabase
> 8. Add a `CONTRIBUTING.md` with coding conventions

---

## Tips while using Claude Code

- **Commit often.** After each prompt, review the diff, commit to git if it looks good. If it doesn't, say "revert" or describe what to fix before accepting.
- **Don't let it run away.** If Claude Code proposes installing 15 libraries or restructuring the whole project, say "stop — stick to the plan in CLAUDE.md."
- **Use `/resume`** if you close the terminal and come back later. All context is preserved.
- **Use planning mode** for big prompts: say "Plan this first before coding" and Claude Code will lay out the steps, then you approve.
- **When you hit limits**, the usage limits on Claude Pro reset every 5 hours. Build in chunks.

Good luck. You have the brief. Go build.
