# 02 — Design System

## Brand

**Name:** JissrON
**Tagline:** Learning Management System | EdTech Platform
**Logo:** two-tone wordmark — "J" and "N" in primary color, "issrO" in primary-bright. Optional `r.` SVG mark next to it.

## Color palette

Register these as CSS variables in `app/globals.css` and as Tailwind theme tokens in `tailwind.config.ts`.

```css
:root {
  /* Brand (Atlas Blue, dark) */
  --primary: #003d80;           /* main brand color */
  --primary-hover: #0058b8;     /* hover state */
  --primary-bright: #0071e3;    /* small accents */
  --primary-dark: #002a5a;      /* pressed state */
  --primary-soft: #e8eff8;      /* light tinted bg */
  --primary-softer: #f3f6fb;    /* extra light tint */

  /* Neutrals */
  --bg: #ffffff;
  --bg-soft: #f6f9fd;
  --bg-hover: #edf2f9;
  --ink: #081a36;               /* primary text */
  --text: #2a3a54;              /* secondary text */
  --muted: #6a7890;             /* tertiary text, placeholders */
  --line: #e4e9ef;              /* subtle borders */
  --line-strong: #cfd7e1;       /* emphasized borders, dividers */

  /* Functional */
  --red: #e53e3e;               /* urgency / sale / live-now */
  --red-soft: #fff1f1;
  --green: #16a34a;             /* available / success */
  --green-soft: #ecfdf5;
  --star: #b4754a;              /* rating stars (muted warm brown, NOT yellow) */
  --ring: rgba(0, 88, 184, 0.25);
}
```

### Critical rules about color

- **No amber, no yellow, no gold anywhere.** The brand is mono-blue.
- Star ratings use the muted warm brown `--star`, not yellow.
- Primary CTAs are always solid `--primary` background with `#fff` text.
- On dark blue backgrounds, primary CTAs switch to white background with `--primary` text.
- Urgency signals (sale %, "Live" tag, "almost full") use `--red`. Nothing else.

## Typography

**Single font family for everything: Montserrat** from Google Fonts.

```tsx
// app/layout.tsx
import { Montserrat } from 'next/font/google';
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
});
```

### Weight usage

| Weight | Use |
|---|---|
| 400 | Body text, captions |
| 500 | Emphasis, nav links, labels |
| 600 | Subheadings, secondary buttons |
| 700 | Headings (h3, h4), primary buttons, bold emphasis |
| 800 | Display headings (h1, h2), price tags, hero titles |

### Type scale

| Element | Size | Weight | Letter-spacing |
|---|---|---|---|
| Hero H1 | clamp(42px, 5.2vw, 64px) | 800 | -0.02em |
| Section H2 | clamp(28px, 3.2vw, 38px) | 800 | -0.02em |
| Card H3/H4 | 18-22px | 700 | -0.01em |
| Body | 15-17px | 400 | normal |
| Small/meta | 12-13px | 500 | normal |
| Eyebrow | 11-12px | 700 | 0.08-0.12em uppercase |
| CTA button | 13-15px | 700-800 | 0.02-0.08em |

## Components

### Buttons

All buttons use `border-radius: 10px` (except circular/pill variants which are 999px).

| Variant | Background | Text | Use case |
|---|---|---|---|
| Primary | `--primary` | `#fff` | Main CTAs |
| Primary on-dark | `#fff` | `--primary` | CTAs inside dark-blue banners |
| Outline | transparent + 1.5px `--primary` border | `--primary` | Secondary actions |
| Ghost | transparent | `--primary` | Nav items, tertiary |

Hover: `translateY(-1px)` + subtle shadow. 200ms transition.

### Inputs

- Height: 44-52px
- Border: 1.5px `--line-strong`
- Focus: border `--primary`, 3px ring `--ring`
- Border radius: 999px for search/email, 10px for form fields

### Cards (courses)

- Background: `#fff`
- Border: 1px `--line`
- Border radius: 12px
- Hover: `translateY(-3px)`, shadow `0 12px 28px -12px rgba(0,61,128,0.2)`, border `--primary`
- **Arched bottom-right corner** on thumbnail: `border-radius: 0 0 60px 0 / 0 0 40px 0`
- "Continue Learning" CTA: full-width solid primary, uppercase, letter-spacing 0.08em

### Course card structure (reference)

```
┌─────────────────┐
│  [thumbnail]    │  ← arched bottom-right corner
│   [BESTSELLER]  │  ← white badge, top-left
│      ▶          │  ← white play button on hover
└─────────────────┘
 Product Strategy    ← eyebrow, uppercase, primary-bright, 10.5px
 Course Title         ← 15px, 700, --ink
 Instructor name      ← 12px, muted
 ★ 4.9 ★★★★★ (5k)    ← stars in --star color
 32 hours · 12 mod    ← meta, muted
 $9.99  ̶$̶8̶9̶.̶9̶9̶       ← 18px bold price, struck-through old
 [BESTSELLER tag]
 [CONTINUE LEARNING]  ← full-width primary button
```

### Navigation

- Sticky top bar with white background + 1px `--line` bottom border
- On scroll: subtle shadow
- Height: 72px
- Search bar: pill-shaped input, centered, max-width 560px

### Urgency banner

- Dark `--primary` background
- Small sale tag (`--primary-bright` bg), message text (white), countdown timer
- 48px total height

### Section eyebrow

Use above every section title:
```
┌─────────────────────────────
│ ——— ON-DEMAND COURSES         ← 12px, 700, --primary-hover, uppercase
│ This season's reading list    ← section title
```

## Layout

- Max-width container: 1340px
- Horizontal padding: 32px (24px on mobile)
- Section vertical padding: 80px (48px on mobile)
- Grid gaps: 20-24px

## Motion

Keep it subtle — Apple-style, not flashy.

- All transitions: 200-300ms, ease or cubic-bezier(0.2, 0.7, 0.1, 1)
- Hover effects: `translateY(-1px or -3px)`, shadow increase
- Entrance animations: fade up with staggered delays, 1s duration, only on hero
- No parallax, no auto-playing video, no scroll-jacking

## Breakpoints

| Name | Width |
|---|---|
| Mobile | < 640px |
| Tablet | 640-1024px |
| Desktop | 1024-1340px |
| Wide | > 1340px |

## Accessibility requirements

- All interactive elements keyboard-accessible
- Visible focus rings (`outline` or ring utilities)
- Color contrast AA minimum (AAA for body text where possible)
- ARIA labels on icon-only buttons
- Skip-to-content link
- `prefers-reduced-motion` respected
