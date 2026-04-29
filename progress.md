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

**Commit:** `735159b`

### Session 6 — 2026-04-29

**Feature:** M1-006 — Design tokens: color palette with brand colors + poster palette + semantic aliases
**Status:** completed

**What was done:**

- Added vitest devDependency and vitest.config.ts to packages/tokens
- Created packages/tokens/src/colors.ts with brandColors, darkColors, posterColors, semanticColors, allColors (all `as const`)
- Created packages/tokens/src/**tests**/colors.test.ts with 18 tests covering exact values and hex validity
- Updated packages/tokens/src/index.ts to re-export all color modules
- pnpm install to resolve new vitest dependency

**What failed / remaining:**

- None

**Verification:**

- pnpm --filter @cyberoracle/tokens test: 18 tests pass
- pnpm --filter @cyberoracle/tokens typecheck: passes
- pnpm test from root: tokens (18 pass), core (1 pass), poster (1 pass); server no tests — expected

**Commit:** `3e0d718`

### Session 7 — 2026-04-29

**Feature:** M1-007 — Design tokens: typography scale, font families, spacing, border radius, animation curves
**Status:** completed

**What was done:**

- Created packages/tokens/src/typography.ts with fontFamilies (notoSerifSC, orbitron) and typeScale (xs–5xl with lineHeight)
- Created packages/tokens/src/spacing.ts with spacing scale (0–96 step values)
- Created packages/tokens/src/borders.ts with borderRadius (card 16px, button 12px, input 10px)
- Created packages/tokens/src/animations.ts with easing and durations (enter 360ms, exit 220ms)
- Created packages/tokens/src/**tests**/tokens.test.ts with 9 unit tests
- Updated packages/tokens/src/index.ts to re-export all new token modules

**What failed / remaining:**

- None

**Verification:**

- pnpm --filter @cyberoracle/tokens typecheck: passes
- pnpm --filter @cyberoracle/tokens test: 27 tests pass (18 colors + 9 tokens)

**Commit:** `c4d7982`

### Session 8 — 2026-04-29

**Feature:** M1-008 — Tailwind preset from design tokens — maps all tokens to Tailwind theme extensions
**Status:** completed

**What was done:**

- Replaced stub tailwind-preset with full implementation importing all token modules
- Renamed tailwind-preset.js → tailwind-preset.ts for TypeScript type safety
- Preset maps colors (brand, dark, poster, semantic), fontFamily, borderRadius, transitionTimingFunction, transitionDuration
- Updated package.json export path from .js to .ts
- Created packages/tokens/src/**tests**/tailwind-preset.test.ts with 8 unit tests

**What failed / remaining:**

- None

**Verification:**

- pnpm --filter @cyberoracle/tokens typecheck: passes
- pnpm --filter @cyberoracle/tokens test: 35 tests pass (18 colors + 8 preset + 9 tokens)
- pnpm --filter @cyberoracle/web typecheck: passes (web app imports updated preset correctly)

**Commit:** `7175626`

### Session 9 — 2026-04-29

**Feature:** M1-009 — Zod schema for PalmReadingResult — structured output contract for palm reading pipeline
**Status:** completed

**What was done:**

- Created packages/core/src/schemas/palm-reading.ts with Zod schema (id uuid, type 'palm', personality/career/love/health sections with title+content+score, overallScore 1-100, summary, createdAt)
- Created packages/core/src/schemas/**tests**/palm-reading.test.ts with 6 tests (valid parse, missing field rejection, wrong type, out-of-range score, invalid UUID, inferred type)
- Created packages/core/src/schemas/index.ts barrel export

**What failed / remaining:**

- None

**Verification:**

- pnpm --filter @cyberoracle/core test: 7 tests pass (1 health + 6 palm-reading)
- pnpm --filter @cyberoracle/core typecheck: passes

**Commit:** `dcc6df9`

### Session 10 — 2026-04-29

**Feature:** M1-010 — Zod schema for FaceReadingResult — structured output contract for face reading pipeline
**Status:** completed

**What was done:**

- Created packages/core/src/schemas/face-reading.ts with Zod schema (id uuid, type 'face', fortune/career/relationship/wisdom sections with title+content+score, overallScore 1-100, summary, createdAt)
- Created packages/core/src/schemas/**tests**/face-reading.test.ts with 5 tests (valid parse, missing field, wrong type, out-of-range score, invalid UUID)
- Updated packages/core/src/schemas/index.ts to export FaceReadingResultSchema

**What failed / remaining:**

- None

**Verification:**

- pnpm --filter @cyberoracle/core test: 12 tests pass (1 health + 6 palm + 5 face)
- pnpm --filter @cyberoracle/core typecheck: passes

**Commit:** `36317a1`

### Session 11 — 2026-04-29

**Feature:** M1-011 — Zod schema for DailyFortuneResult — structured output for daily fortune feature
**Status:** completed

**What was done:**

- Created packages/core/src/schemas/daily-fortune.ts with strict Zod schema (date, overall/love/career/wealth with score 1-100 + text, luckyNumber, luckyColor, summary)
- Created packages/core/src/schemas/**tests**/daily-fortune.test.ts with 5 tests (valid parse, missing field, out-of-range score, non-integer luckyNumber, strict mode rejects extra fields)
- Updated packages/core/src/schemas/index.ts to export DailyFortuneResultSchema

**What failed / remaining:**

- None

**Verification:**

- pnpm --filter @cyberoracle/core test: 17 tests pass (1 health + 6 palm + 5 face + 5 daily)
- pnpm --filter @cyberoracle/core typecheck: passes

**Commit:** pending

## Summary

| Feature | Status  | Session    |
| ------- | ------- | ---------- |
| M1-001  | ✅ Pass | Session 1  |
| M1-002  | ✅ Pass | Session 2  |
| M1-003  | ✅ Pass | Session 3  |
| M1-004  | ✅ Pass | Session 4  |
| M1-005  | ✅ Pass | Session 5  |
| M1-006  | ✅ Pass | Session 6  |
| M1-007  | ✅ Pass | Session 7  |
| M1-008  | ✅ Pass | Session 8  |
| M1-009  | ✅ Pass | Session 9  |
| M1-010  | ✅ Pass | Session 10 |
| M1-011  | ✅ Pass | Session 11 |
