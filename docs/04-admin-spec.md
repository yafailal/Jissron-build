# 04 — Admin Panel Specification

The admin panel is under `/admin/*`. Protected by middleware — only users with `role = ADMIN` can access.

## Layout

```
┌────────────────────────────────────────────────────────┐
│ JissrON Admin         [ search ]    [ user menu ]      │
├──────────┬─────────────────────────────────────────────┤
│ Dashboard│                                              │
│ Site     │                                              │
│ Courses  │          Main content area                   │
│ Live     │                                              │
│ Consult  │                                              │
│ Users    │                                              │
│ Pages    │                                              │
│ Settings │                                              │
└──────────┴─────────────────────────────────────────────┘
```

- Sidebar: 240px wide, collapsible on mobile
- Top bar: 60px, with breadcrumbs + search + user menu
- Admin uses a DIFFERENT visual treatment than the public site — cleaner, more utilitarian. Still Montserrat and the same brand colors, but denser, more tabular.

## Pages required (admin-side)

### 1. `/admin` — Dashboard
- Welcome message
- 4 stat cards: total users, total courses, revenue this month, sessions this week
- Recent activity (last 20 ActivityLog entries)
- Top-performing courses this week (bar chart)

### 2. `/admin/site` — Site content
A multi-tab editor for `SiteSettings`. Tabs:

- **Brand** — site name, tagline, logo uploads, favicon, 4 brand color pickers
- **Hero** — kicker, 3 title lines, subtitle, search placeholder, popular search terms (tag input)
- **Urgency banner** — toggle, tag, message, countdown end date, CTA label + URL
- **Trust strip** — label + repeatable list of (name, logo image upload)
- **Mid-CTA banner** — title, description, 2 CTAs, repeatable stats list
- **Final CTA** — title, description
- **Footer** — repeatable columns (heading + links), social links, copyright
- **SEO defaults** — title template, description, OG image

Every change shows a "Save" button at the top. After save, show a "View live" button that opens the public homepage in a new tab.

### 3. `/admin/courses` — Courses CRUD
- **List view**: searchable, filterable by category/status, sortable columns (title, instructor, status, enrollments, updated)
- **Create/edit view**: multi-step form with tabs
  - Basics: title, slug, subtitle, category, level, thumbnail upload, preview video
  - Description: rich text editor (Tiptap)
  - Curriculum: nested list of modules → lessons, drag-to-reorder
  - Pricing: price, old price (for discount display), sale toggle
  - Badges: bestseller, new, featured toggles
  - SEO: per-course title/description
  - Publish: draft / published / archived with confirmation

### 4. `/admin/live` — Live sessions CRUD
- List view with upcoming/past filter
- Create/edit form:
  - Title, description, kind (AMA/Workshop/Seminar/Cohort)
  - Host (picker from instructor users)
  - Start date/time (timezone-aware), duration
  - Total seats
  - Free toggle or price
  - Meeting URL (Zoom/Meet link)
  - Featured toggle

### 5. `/admin/consultants` — Consultants CRUD
- List view
- Create/edit form:
  - User (link to existing user or create new)
  - Tagline, bio (rich text)
  - Rate per session (USD)
  - Duration (default 30 min)
  - Skills (tag input)
  - Availability editor (day-of-week + time slots)
  - Accepts new bookings toggle
  - Featured toggle

### 6. `/admin/users` — Users management
- List view with role filter, search
- Row actions: view profile, change role, suspend, delete
- Click a row → detail view with their enrollments, bookings, activity log

### 7. `/admin/pages` — Static pages (About, Terms, etc.)
- List all CMS pages
- Create/edit with a rich text editor
- Slug field (auto-generated from title)
- Meta title / description
- Published toggle

### 8. `/admin/settings` — Platform settings
- Platform fee % (for instructor payouts)
- Email templates (welcome, enrollment confirmation, etc.)
- Feature flags
- Danger zone: purge cache, re-seed database (dev only)

## UX requirements

1. **Every list is paginated** (25 items per page default) with URL-based state so links are shareable
2. **Every form** uses Zod for validation, displays inline error messages
3. **Every destructive action** (delete, suspend, publish/unpublish) asks for confirmation via a modal
4. **Every successful save** shows a toast notification
5. **Optimistic UI** where safe — no full page reloads after edits
6. **Autosave drafts** for long forms (course create, page create)
7. **Image uploads** use UploadThing; show a preview immediately; store the URL in the DB
8. **Rich text editor**: use Tiptap with these marks — bold, italic, underline, h2, h3, bullet list, numbered list, link, blockquote, code
9. **Keyboard shortcuts**: `Cmd/Ctrl+S` saves forms; `Cmd/Ctrl+K` opens global search
10. **Activity log**: every admin mutation writes an `ActivityLog` row with `userId`, `action`, `entity`, `entityId`, and a JSON `metadata` snapshot of changed fields

## Components to build for the admin

Under `components/admin/`:

- `AdminLayout.tsx` — sidebar + topbar shell
- `AdminSidebar.tsx`
- `PageHeader.tsx` — title + breadcrumb + action buttons
- `DataTable.tsx` — generic table with sort/filter/paginate (build on top of Tanstack Table)
- `FormField.tsx`, `TextInput.tsx`, `TextareaInput.tsx`, `SelectInput.tsx`, `CheckboxInput.tsx`, `ColorInput.tsx`, `ImageUploadInput.tsx`, `RichTextEditor.tsx`, `DateTimeInput.tsx`, `TagInput.tsx`
- `ConfirmDialog.tsx`
- `StatCard.tsx`
- `ActivityFeed.tsx`
- `Toast.tsx` (use shadcn/ui sonner)

## Permissions matrix

| Action | STUDENT | INSTRUCTOR | ADMIN |
|---|---|---|---|
| View public site | ✓ | ✓ | ✓ |
| Enroll in courses | ✓ | ✓ | ✓ |
| Create/edit own courses | ✗ | ✓ | ✓ |
| Edit any course | ✗ | ✗ | ✓ |
| Edit site settings | ✗ | ✗ | ✓ |
| Manage users | ✗ | ✗ | ✓ |
| View earnings (own) | ✗ | ✓ | ✓ |
| View earnings (all) | ✗ | ✗ | ✓ |

Enforce in middleware AND at the server action level (defense in depth).
