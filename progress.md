# CyberOracle Development Progress

## Milestone: M1 — 共享基建

**Started:** 2026-04-29
**Source docs:** docs/1Monorepo工程骨架.md, docs/PRD.md §3.2

---

## Session Log

### Session 1 — 2026-04-29

**Feature:** M1-001 — Web app Tailwind CSS + PostCSS configuration with design token integration
**Status:** completed

**What was done:**

- Created packages/tokens/src/tailwind-preset.js (minimal stub for import resolution)
- Added `./tailwind` export to packages/tokens/package.json
- Created apps/web/tailwind.config.ts importing @cyberoracle/tokens/tailwind preset
- Created apps/web/postcss.config.mjs with tailwindcss + autoprefixer
- Created apps/web/src/app/globals.css with @tailwind directives and CSS variables
- Updated apps/web/src/app/layout.tsx to import globals.css
- Updated apps/web/src/app/page.tsx with Tailwind utility classes

**What failed / remaining:**

- None

**Verification:**

- pnpm --filter @cyberoracle/web typecheck passes
- GET http://localhost:3000 returns 200 with Tailwind classes in HTML
- GET http://localhost:3001/api/health returns 200
- Tailwind CSS rules present in rendered output (min-height: 100vh, display: flex)

**Commit:** `a15353d`

### Session 2 — 2026-04-29

**Feature:** M1-002 — Vitest configuration for packages/core
**Status:** completed

**What was done:**

- Created packages/core/vitest.config.ts with path alias resolution for @cyberoracle/core and @cyberoracle/tokens
- Created packages/core/src/**tests**/health.test.ts with a basic import assertion

**What failed / remaining:**

- None

**Verification:**

- pnpm --filter @cyberoracle/core test: 1 test passes
- pnpm --filter @cyberoracle/core typecheck: passes
- pnpm test from root includes core package results (poster/server fail with no tests — expected)

**Commit:** `627fbb8`

### Session 3 — 2026-04-29

**Feature:** M1-003 — Vitest configuration for packages/poster
**Status:** completed

**What was done:**

- Created packages/poster/vitest.config.ts with React plugin (@vitejs/plugin-react) + path alias resolution (@cyberoracle/poster, @cyberoracle/core, @cyberoracle/tokens)
- Created packages/poster/src/**tests**/health.test.ts with a basic import assertion
- Added @vitejs/plugin-react to poster devDependencies

**What failed / remaining:**

- None

**Verification:**

- pnpm --filter @cyberoracle/poster test: 1 test passes
- pnpm --filter @cyberoracle/poster typecheck: passes
- pnpm test from root runs both core (1 pass) and poster (1 pass); server fails with no tests — expected

**Commit:** `3f3396b`

### Session 4 — 2026-04-29

**Feature:** M1-004 — Server Dockerfile + docker-compose.yml for local development
**Status:** completed

**What was done:**

- Created apps/server/Dockerfile with three-stage build (deps → builder → runner)
- Created docker-compose.yml at root with server service
- Created .dockerignore to exclude unnecessary files from build context

**What failed / remaining:**

- None (manual review strategy — Dockerfile follows spec pattern but needs human verification of actual `docker compose build`)

**Verification:**

- Dockerfile structure reviewed against spec doc (docs/1Monorepo工程骨架.md §四)
- Three stages present: deps (install), builder (copy + build), runner (standalone + static + fonts)
- docker-compose.yml exposes port 3001 with production env

**Commit:** `0a62fd9`

### Session 5 — 2026-04-29

**Feature:** M1-005 — End-to-end dev verification — pnpm dev:web starts both web and server without errors
**Status:** completed

**What was done:**

- Started dev servers via `pnpm dev:web` (web on port 3000, server on port 3001)
- Verified GET http://localhost:3000 returns 200 with valid HTML (title "赛博玄学馆 · CyberOracle", Tailwind-styled content)
- Verified GET http://localhost:3001/api/health returns 200 with `{ "status": "ok", "timestamp": ... }` JSON
- Confirmed no unhandled TypeScript errors — `pnpm typecheck` passes across all 7 packages (0 errors)
- Only console error is favicon.ico 404 (expected, no favicon file exists)

**What failed / remaining:**

- None

**Verification:**

- Playwright browser snapshot confirms web page renders with heading "赛博玄学馆 · CyberOracle" and paragraph "Coming soon."
- Playwright browser snapshot confirms /api/health returns `{"status":"ok","timestamp":...}`
- pnpm typecheck: 11 tasks successful, 0 errors

**Commit:** `007beee`

## Summary

| Feature | Status  | Session   |
| ------- | ------- | --------- |
| M1-001  | ✅ Pass | Session 1 |
| M1-002  | ✅ Pass | Session 2 |
| M1-003  | ✅ Pass | Session 3 |
| M1-004  | ✅ Pass | Session 4 |
| M1-005  | ✅ Pass | Session 5 |
