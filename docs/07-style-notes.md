---

# Style & UX Notes — for Phase 7 polish pass

Running list of visual, UX, and micro-interaction tweaks to address when we do the dedicated design polish phase (Phase 7). Free-form notes — add anytime without worrying about organization.

## How to use this file
- Add a bullet under "Open items" when you notice something
- Move completed items to "Resolved" at the bottom
- Prefix with page/section for clarity: `/admin/courses — thumbnail aspect ratio stretched`

## Open items

- `/learn` **Sidebar status doesn't refresh live during playback** — students see updated lesson status (checkmark, progress ring) only after page navigation or a manual refresh. Could call `router.refresh()` on the auto-complete event inside `BunnyProgressTracker` to revalidate server data without a full reload.

- `/learn` **Resume video playback position on page reload** — `initialWatchedSecs` is passed to `BunnyProgressTracker` but Bunny needs a `ready→setCurrentTime` handshake to seek on load. Protocol: after "ready" fires and subscriptions are sent, immediately post `{ method: "setCurrentTime", value: initialWatchedSecs }` if `initialWatchedSecs > 0`.

## Referenced design inspirations
- **Homepage aesthetic:** `/mnt/user-data/outputs/homepage-jissron-dark.html` (Atlas Blue mono-blue final)
- **Admin aesthetic:** dark sidebar (#081a36) + light main area, Atlas Blue (#003d80) accents, Montserrat font
- **Instructor portal future design:** Udemy panel — see `docs/06-future-instructor-portal.md`
- **Brand palette:**
  - `--primary` #003d80 (Atlas Blue)
  - `--primary-hover` #0058b8
  - `--primary-bright` #0071e3
  - `--primary-dark` #002a5a
  - `--ink` #081a36
  - `--muted` #6a7890
  - `--red` #e53e3e (urgency)
  - `--green` #16a34a (success)
  - `--star` #b4754a (ratings)

## Resolved
- (items get moved here when fixed)

## Design decisions (intentional)

- Course form uses 7 tabs + persistent right sidebar for Core Details (title, slug, subtitle, category, level, instructor). The sidebar stays visible across all tabs for quick reference. Original spec called for 8 tabs with "Basics" as a dedicated tab — the sidebar pattern is the chosen alternative.

- Courses page (/courses) layout — final design locked through 6 iterations:
  - 2-column hero on desktop: editorial title + lead text on left, search bar + autocomplete + popular tags on right
  - Search bar top-aligned (NOT vertically centered) so it sits near the top of the viewport
  - Hero padding compressed to 32px top to push content higher
  - Breadcrumb dropped on desktop AND mobile (nav already shows current page)
  - Mobile: promo bar hidden, search comes BEFORE editorial title in hero (search-first intent)
  - Smart autocomplete dropdown: 3 categorized sections (Courses, Instructors, Topics) with highlighted matches
  - Popular search tags below the bar (Python, AI, Marketing, ChatGPT, Design)
  - JissrON-specific: 🇲🇦 "New for Morocco" badges with flag-color gradients, bank transfer indicators, multilingual badges (FR/EN/Darija/عربي)
  - Reference mockup at: docs/design-references/courses-page-final.html

---
