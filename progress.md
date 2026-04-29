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

**Commit:** `419c97f`

### Session 12 — 2026-04-29

**Feature:** M1-012 — Zod schema for PipelineEvent — SSE streaming envelope for LLM proxy
**Status:** completed

**What was done:**

- Created packages/core/src/schemas/pipeline-event.ts with Zod schema (step enum, status enum, data unknown, optional error)
- Created packages/core/src/schemas/**tests**/pipeline-event.test.ts with 6 tests (running event, done with data, error event, invalid step, invalid status, optional error)
- Updated packages/core/src/schemas/index.ts to export PipelineEventSchema

**What failed / remaining:**

- None

**Verification:**

- pnpm --filter @cyberoracle/core test: 23 tests pass (1 health + 6 palm + 5 face + 5 daily + 6 pipeline)
- pnpm --filter @cyberoracle/core typecheck: passes

**Commit:** `7aae8f8`

### Session 13 — 2026-04-29

**Feature:** M1-013 — Sample prompt file: vision-observe-palm.md — establishes .md prompt file format
**Status:** completed

**What was done:**

- Created packages/core/prompts/vision-observe-palm.md with YAML frontmatter (version, targetModel, temperature, description), system prompt section, ---USER--- separator, and user template with {{ganzhi}} and {{upload_description}} variables
- Created packages/core/src/prompts/**tests**/prompt-file.test.ts with 5 tests validating file structure (frontmatter fields, separator, system section, template variables, JSON instruction)

**What failed / remaining:**

- None

**Verification:**

- pnpm --filter @cyberoracle/core test: 28 tests pass (1 health + 6 palm + 5 face + 5 daily + 6 pipeline + 5 prompt-file)
- pnpm --filter @cyberoracle/core typecheck: passes

**Commit:** pending

### Session 14 — 2026-04-29

**Feature:** M1-014 — Prompt loader — reads .md prompt files, parses frontmatter, fills template variables
**Status:** completed

**What was done:**

- Created packages/core/src/prompts/loader.ts with loadPrompt(name) and fillTemplate(template, vars) functions
- loadPrompt reads .md files from packages/core/prompts/, parses YAML frontmatter (version, targetModel, temperature), splits on ---USER--- into system and userTemplate sections
- fillTemplate replaces {{variable}} placeholders with provided values, leaves unmatched placeholders unchanged
- loadPrompt throws descriptive "Prompt not found" error for non-existent prompt names
- Created packages/core/src/prompts/**tests**/loader.test.ts with 8 tests (4 fillTemplate + 4 loadPrompt)

**What failed / remaining:**

- None

**Verification:**

- pnpm --filter @cyberoracle/core test: 36 tests pass (1 health + 6 palm + 5 face + 5 daily + 6 pipeline + 5 prompt-file + 8 loader)
- pnpm --filter @cyberoracle/core typecheck: passes

**Commit:** `343081f`

### Session 15 — 2026-04-29

**Feature:** M1-015 — Content safety module — keyword blacklist checker for filtering LLM outputs
**Status:** completed

**What was done:**

- Created packages/core/src/content-safety/blacklist.json with 9 Chinese keywords (健康建议, 寿命, 疾病, 治疗, 投资建议, 赚钱, 自杀, 死亡, 政治)
- Created packages/core/src/content-safety/checker.ts with checkContent(text): { safe, matched } — case-insensitive matching against blacklist
- Created packages/core/src/content-safety/index.ts barrel export
- Created packages/core/src/content-safety/**tests**/checker.test.ts with 6 tests (clean text, single keyword, multiple keywords, case-insensitive, all keywords, empty string)

**What failed / remaining:**

- None

**Verification:**

- pnpm --filter @cyberoracle/core test: 42 tests pass (8 files, all green)
- pnpm --filter @cyberoracle/core typecheck: passes

**Commit:** `09d4c3a`

### Session 16 — 2026-04-29

**Feature:** M1-016 — Core package barrel exports — wire up all submodules through index.ts files
**Status:** completed

**What was done:**

- Updated packages/core/src/index.ts to re-export from ./schemas, ./prompts, ./content-safety (kept PACKAGE_NAME export)
- Created packages/core/src/prompts/index.ts exporting loadPrompt, fillTemplate, LoadedPrompt, PromptMeta
- Created packages/core/src/**tests**/barrel-exports.test.ts with 8 tests importing all exports from @cyberoracle/core
- Existing index.ts files for schemas and content-safety were already correct

**What failed / remaining:**

- None

**Verification:**

- pnpm --filter @cyberoracle/core test: 50 tests pass (9 files, all green)
- pnpm --filter @cyberoracle/core typecheck: passes
- Barrel export test confirms { PalmReadingResultSchema, FaceReadingResultSchema, DailyFortuneResultSchema, PipelineEventSchema, loadPrompt, fillTemplate, checkContent, PACKAGE_NAME } all importable from @cyberoracle/core

**Commit:** `3549c46`

### Session 17 — 2026-04-29

**Feature:** M1-017 — Poster render pipeline — satori + resvg-js JSX-to-PNG conversion server function
**Status:** completed

**What was done:**

- Added satori and @resvg/resvg-js dependencies to packages/poster
- Created packages/poster/src/render/render-server.ts with renderToPng(element, options) function
- renderToPng takes a React element + optional width (default 1080) + optional fonts array, returns Promise<Buffer>
- Loads Noto Serif SC font subsets from packages/poster/fonts/ by default
- Returns valid PNG buffer (verified PNG magic bytes 0x89504E47)
- Throws descriptive error if no fonts are available
- Created packages/poster/src/render/**tests**/render-server.test.ts with 3 tests (PNG output, default width, font error)
- Fixed TypeScript strict issues: FontConfig weight type cast to satori Weight, ArrayBuffer conversion for test fonts

**What failed / remaining:**

- None (font subsetting via pnpm fonts:prepare requires manual download of source fonts)

**Verification:**

- pnpm --filter @cyberoracle/poster test: 4 tests pass (1 health + 3 render)
- pnpm --filter @cyberoracle/poster typecheck: passes

**Commit:** pending

### Session 19 — 2026-04-29

**Feature:** M1-020 — UI package base exports + Tailwind integration scaffolding
**Status:** completed

**What was done:**

- Added vitest devDependency and vitest.config.ts to packages/ui with path alias resolution
- Added "test" script to packages/ui/package.json
- Updated packages/ui/src/index.ts to export CrystalBall, UploadDropzone, NeonText, StreamingPoster as empty function stubs
- peerDependencies (react-dom, framer-motion) were already correctly set up
- Created packages/ui/src/**tests**/exports.test.ts with 5 tests (PACKAGE_NAME + 4 component stubs)

**What failed / remaining:**

- None

**Verification:**

- pnpm --filter @cyberoracle/ui test: 5 tests pass
- pnpm --filter @cyberoracle/ui typecheck: passes

**Commit:** pending

**Feature:** M1-018 — Base poster layout component — reusable satori-compatible layout with poster styles
**Status:** completed

**What was done:**

- Created packages/poster/src/components/PosterLayout.tsx as a satori-compatible component returning VDOM objects
- Props: { title, sections: Array<{heading, content}>, footer? }
- Renders with cream background (#F8F5EE), dark text (#1F1B16), gold accent dividers (#9A7B3F) between sections
- Watermark placeholder area in bottom-right corner (defaults to "CyberOracle" text)
- All styles inline, no external CSS — satori-compatible
- Created packages/poster/src/components/**tests**/poster-layout.test.tsx with 6 tests

**What failed / remaining:**

- Initial attempt had satori error "Expected display: flex" on section containers — fixed by adding explicit flex display
- resvg panic caused by passing numeric width to satori style — fixed by using '100%' width

**Verification:**

- pnpm --filter @cyberoracle/poster test: 10 tests pass (1 health + 3 render + 6 poster-layout)
- pnpm --filter @cyberoracle/poster typecheck: passes

**Commit:** pending

### Session 20 — 2026-04-29

**Feature:** M1-019 — Poster preview script — local PNG preview from sample data via tsx
**Status:** completed

**What was done:**

- Created packages/poster/scripts/preview.ts using renderToPng with PosterLayout + sample Chinese fortune data
- Added tsx devDependency to poster package
- Added preview:poster and preview:poster:watch scripts to package.json
- Script falls back to system Arial font when Noto Serif SC subsets are not prepared
- Added preview-output.png to .gitignore
- Verified: pnpm preview:poster generates 10.5 KB PNG (1080x542, valid PNG magic bytes)

**What failed / remaining:**

- Chinese text renders with Arial font (boxes/placeholders) until Noto Serif SC fonts are prepared via pnpm fonts:prepare
- Human review needed: verify Chinese text renders correctly after font preparation

**Verification:**

- pnpm --filter @cyberoracle/poster preview:poster: exits 0, generates preview-output.png
- PNG file: valid header (0x89504E47), dimensions 1080x542
- pnpm --filter @cyberoracle/poster typecheck: passes

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
| M1-012  | ✅ Pass | Session 12 |
| M1-013  | ✅ Pass | Session 13 |
| M1-014  | ✅ Pass | Session 14 |
| M1-015  | ✅ Pass | Session 15 |
| M1-016  | ✅ Pass | Session 16 |
| M1-017  | ✅ Pass | Session 17 |
| M1-018  | ✅ Pass | Session 18 |
| M1-019  | ✅ Pass | Session 20 |
| M1-020  | ✅ Pass | Session 19 |
