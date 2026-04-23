# Instructor Portal — Design Reference

## Status
Reserved for Phase 6.5 (after student side is built). Not part of Phase 5 admin work.

## Design inspiration
Udemy's Instructor Panel. Key characteristics:

- Dark purple (~#6A1B9A) left sidebar, icon + label nav
- Sidebar items: Courses, Communication, Performance, Tools, Resources
- Main content area: light, spacious, generous whitespace
- Top tabs: Courses / Course bundles / Course cloning
- Search + sort controls above the list
- Large primary "+ New course" button in top-right
- Course list rows: small illustrated thumbnail, title, DRAFT/PUBLIC status, "Finish your course" completion progress bar
- Informational banners for new features
- Helper resources cards below the course list

## Differences from JissrON admin
Admin (what's in /admin/*) is for PLATFORM administrators — can manage everyone's content.
Instructor portal (future, /instructor/*) is for COURSE CREATORS — only sees and manages their own content.

## When to build
After Phase 6 (student side + payments) is complete. An instructor can't meaningfully test their course until students can consume it.

## Permissions (already in place)
- STUDENT → /dashboard/*
- INSTRUCTOR → /dashboard/* + future /instructor/*
- ADMIN → all of the above + /admin/*

Middleware in middleware.ts already routes by role; when /instructor/* is built, update the matcher.
