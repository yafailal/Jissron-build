# JissrON — Project Kickoff Package

This folder contains everything Claude Code needs to build JissrON from scratch.

## What you have here

```
jissron-build/
├── README.md                     ← you are here
├── SETUP.md                      ← how to install Claude Code
├── CLAUDE.md                     ← project instructions (Claude Code reads this automatically)
├── docs/
│   ├── 01-project-brief.md       ← complete spec for Claude Code
│   ├── 02-design-system.md       ← colors, typography, component specs
│   ├── 03-data-model.md          ← database schema and all editable fields
│   ├── 04-admin-spec.md          ← admin panel requirements
│   └── 05-first-prompts.md       ← exact prompts to paste into Claude Code
└── reference/
    └── homepage-reference.html   ← the Atlas Blue design we built together
```

## Recommended order

1. **Install Claude Code** → follow `SETUP.md`
2. **Read `docs/01-project-brief.md`** once, end to end — this is the big picture
3. **Open a terminal in this folder** and run `claude`
4. **Paste the first prompt** from `docs/05-first-prompts.md`
5. Claude Code will scaffold the project. From there, follow the subsequent prompts in order.

## Important

- Do not move `CLAUDE.md` — Claude Code automatically reads it at the root of any project folder it's run in.
- The `reference/homepage-reference.html` file is the exact design target. Claude Code should match it pixel-for-pixel, but rebuilt properly in Next.js + React components.
- If Claude Code gets stuck, paste the relevant doc from `/docs/` into the chat and say "use this as your reference."
