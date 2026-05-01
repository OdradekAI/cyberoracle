# Changelog

All notable changes to this project will be documented in this file. See [.changeset/](./.changeset/) for change records.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - 2026-05-01

M2 Web 端 MVP (Web MVP) milestone.

### Added

**Core Infrastructure:**

- **Vision observation schemas** (`packages/core`): `VisionObservationSchema` with discriminated union for palm/face validation, 11 tests covering reason enums and observation fields (M2-004)
- **Rich reading schemas** (`packages/core`): Enhanced `PalmReadingResult` with overview/mainLines/summary objects (9 tests), `FaceReadingResult` with 3-4 mainLines + 5 face icons (9 tests), `DailyFortuneResult` with ratings 1-5 and lucky number 0-9 validation (10 tests) (M2-001, M2-002, M2-003)
- **Prompt include system** (`packages/core`): `expandIncludes` function supporting `<<include:foo>>` tokens with nested resolution and error handling (4 tests) (M2-005)
- **Shared prompt modules** (`packages/core`): `_shared/safety-rules.md` and `_shared/tone-guidelines.md` with 13 tests for section existence and include expansion (M2-006)
- **Vision prompts** (`packages/core`): `vision-observe-palm.md` (7 tests) and `vision-observe-face.md` (7 tests) with structured observation instructions (M2-007)
- **Reading prompts** (`packages/core`): `reading-write-palm.md` (12 tests with 2 complete examples and icon selection rules) and `reading-write-face.md` (12 tests with 4 compliance checkpoints) (M2-008, M2-009)
- **Daily fortune prompt** (`packages/core`): `daily-fortune.md` with 4 template variables and 14 tests (M2-010)
- **Fallback system** (`packages/core`): Soft fallback content with 15 tests for palm/face/daily scenarios (M2-014)

**Server APIs:**

- **VLM client** (`apps/server`): Multi-provider vision model client with Qwen→GLM→GPT-4o fallback chain, API key redaction in logs, 403 fallback handling (9 tests) (M2-011)
- **LLM streaming client** (`apps/server`): DeepSeek→Qwen-Plus→GPT-4o-mini streaming chain with 0-chunk silent failover and mid-stream error propagation (8 tests) (M2-012)
- **Reading service** (`apps/server`): 3-stage pipeline orchestration (VLM observe → LLM interpret → result assembly) with status tracking and chunk streaming (11 tests) (M2-013)
- **Upload API** (`/api/upload`): Image upload with sharp processing, webp conversion, nanoid ID generation, and metadata storage (M2-020)
- **Analyze API** (`/api/analyze`): SSE-based reading pipeline with `PipelineEventSchema` validation and real-time progress events (M2-021)
- **Render API** (`/api/render-image`): Satori + resvg-js poster generation with automatic palm/face template selection and `@resvg/resvg-js` externalization (M2-022)
- **Result API** (`/api/result/[id]`): Result retrieval with 404/410 handling, 7-day expiry, and cache headers; `/image` endpoint for poster download (M2-023)
- **Daily fortune API** (`/api/daily`): Date-based fortune generation with cache, `generateDaily` orchestration, and fallback support (M2-024)

**Poster Components:**

- **Poster primitives** (`packages/poster`): `Box`, `Text`, `Card`, `SectionNumber`, `Divider`, `Tag` components with 20 tests and undefined style defense (M2-015)
- **Poster icons** (`packages/poster`): 12+ icons including HeartLine, BrainLine, LeafLine, Signpost, Wave, Mountain, River, Cloud, Lotus, CornerOrnament, Watermark, PalmDiagram, plus 5 face icons (18 tests) (M2-016)
- **Palm reading poster** (`packages/poster`): `PalmReadingPoster` with 6-module layout, watermark, QR code, and 4 illustrations (8 tests) (M2-017)
- **Face reading poster** (`packages/poster`): `FaceReadingPoster` with 5 face icons and 4 mainLines rendering (9 tests) (M2-018)
- **Daily fortune card** (`packages/poster`): `DailyFortuneCard` with ratings, lucky numbers, advice, and one-line summary (6 tests) (M2-019)

**Canvas System:**

- **Canvas stage** (`apps/web`): 4-layer architecture with OffscreenCanvas, background layer, main rAF loop, and HTML overlay; DPR-aware scaling (M2-025)
- **Hit detection** (`apps/web`): `HitRegistry` class with bbox collision detection, cursor callbacks, and performance optimization (1000 elements × 20 checks ≈ 1ms) (M2-026)
- **Crystal ball** (`apps/web`): `CrystalBall` class with idle/hover states and 4-act animation sequence (setup/buildup/climax/resolution) (M2-027, M2-028)
- **Tarot group** (`apps/web`): `TarotGroup` with 5-card idle float, hover 3D transform, click flip animation, and sibling dimming (M2-029)
- **Neon signs** (`apps/web`): `NeonSigns` with 4 signs, pre-rendered glow sprites, 8-12s random glitch effects, and reduced-motion fallback (M2-030)
- **Background layer** (`apps/web`): `BackgroundLayer0` with code rain, 40 data particles, 4 distant halos, and 0.2px parallax (M2-031)
- **Bagua diagram** (`apps/web`): `BaguaDiagram` with HTML overlay panel for 年/月/日/时 inputs, Escape/outside-click dismissal (M2-032)
- **Palm diagram** (`apps/web`): `PalmDiagram` with 3-line cycling animation, scan line effect, and click navigation to `/upload?kind=palm` (M2-033)
- **Fortune sticks** (`apps/web`): `FortuneSticks` with 3-container shake animation, spring physics, character reveal, and 8-fortune pool (M2-034)
- **Cyber cat** (`apps/web`): `CyberCat` with idle tail/eye/LED animations and click trigger for fortune stick draw (M2-035)
- **Oracle girl** (`apps/web`): `OracleGirl` with speech bubble HTML overlay and 3s auto-dismiss (M2-036)
- **Poetry scroll** (`apps/web`): `PoetryScroll` with 5-state machine (idle→hover→expanding→typing→complete) and 4 hardcoded poems (M2-037)
- **Ambient particles** (`apps/web`): 150-particle pool with performance tier-aware count and reduced-motion → 0 fallback (M2-038)
- **Particle burst** (`apps/web`): 300-particle pool with buildup (200 purple) and resolution (50 gold) phases, lifecycle recycling (M2-039)
- **Performance tier** (`apps/web`): WebGL renderer detection, deviceMemory/hwConcurrency thresholds, reduced-motion forced low tier, `window.__tierConfig` debug channel (M2-040)
- **Easter eggs** (`apps/web`): Midnight color temperature filter (hue-rotate 20deg, saturate 0.85), 10-tap belly button trigger, dev-only rhythm layer validation (13 elements across L0-L5) (M2-041)

**Web Pages:**

- **Result page** (`/result/[id]`): EventSource SSE listener, progress bar, poster preview, export button, and section rendering (M2-042)
- **History system** (`apps/web`): Dexie IndexedDB integration with auto-pruning (20-item limit), `/history` page with empty/save/clear states (4 Playwright tests) (M2-043)
- **Share page** (`/share/[id]`): Sticky CTA bar with iframe embed; `/download` page with 3-platform buttons (disabled, "即将上线" state); SEO metadata (M2-044)
- **E2E tests** (`apps/web`): 4 Playwright specs covering full journey, history operations, share/download pages, and smoke tests (M2-045)

### Changed

- Upgraded `@cyberoracle/core` schemas to rich nested objects (overview/mainLines/summary with heading/body structure)
- Enhanced prompt system with include resolution and shared modules
- Refactored server to use multi-provider fallback chains for VLM and LLM
- Improved poster templates with comprehensive icon library and layout modules
- Expanded canvas system from basic stage to full interactive scene with 17 elements

### Fixed

- Schema validation now covers all edge cases (ratings 1-5, lucky numbers 0-9, reason enums)
- VLM client properly redacts API keys from logs
- LLM streaming handles 0-chunk and mid-stream errors gracefully
- Result API returns proper 410 status for expired readings (>7 days)
- Canvas hit detection optimized for 1000+ interactive elements

### Known Issues

- Result page schema field mapping uses `label/content` instead of `name/body`, causing real SSE data to fall back to stub content (high severity, blocks real data display)
- SSE `vlm_observe:done` intermediate event missing, frontend cannot access stage-1 structured observations (medium severity)
- Result page stub timer and SSE path run in parallel without mutual exclusion, stub may overwrite real data if SSE completes before T+3500ms (medium severity)
- Fallback content implemented as TypeScript module instead of `fallback-soft.md` prompt file (medium severity, breaks prompt file convention)
- Daily fortune API uses placeholder `ganzhi` (dateStr) instead of real lunar calendar calculation (medium severity)
- Multiple `catch {}` blocks silently swallow errors without logging (medium severity, affects observability)
- `pnpm build:server` still blocked by Windows symlink EPERM in standalone output (carryover from M1, requires Linux/Docker verification)

## [0.1.0] - 2026-04-29

M1 共享基建 (Shared Infrastructure) milestone.

### Added

- **Design tokens** (`packages/tokens`): color palette (brand/dark/poster/semantic), typography scale, spacing, border radius, animation curves, Tailwind preset
- **Zod schemas** (`packages/core`): `PalmReadingResult`, `FaceReadingResult`, `DailyFortuneResult`, `PipelineEvent` — with full validation tests
- **Prompt system** (`packages/core`): `.md` prompt files with YAML frontmatter + `---USER---` separator, `loadPrompt`/`fillTemplate` loader
- **Content safety** (`packages/core`): keyword blacklist checker for Chinese content filtering
- **Core barrel exports**: all submodules re-exported through `@cyberoracle/core`
- **Poster render pipeline** (`packages/poster`): satori + resvg-js JSX-to-PNG conversion, `PosterLayout` component with cream/gold styling
- **Poster preview script**: `pnpm preview:poster` generates local PNG from sample data
- **UI component stubs** (`packages/ui`): `CrystalBall`, `UploadDropzone`, `NeonText`, `StreamingPoster`
- **Web Tailwind integration**: `apps/web` Tailwind config + PostCSS + token preset import
- **Server Dockerfile**: multi-stage build (deps → builder → runner) + `docker-compose.yml`
- **Server health test**: `apps/server/src/__tests__/health.test.ts` (3 tests)
- **Vitest configs**: for `packages/core`, `packages/poster`, `packages/ui`, `apps/server`
- **E2E scaffolding**: Playwright config + smoke test for `apps/web`
- **M1 audit report**: `docs/m1-audit-report.md`

### Changed

- Removed legacy `.eslintrc.json` from `apps/web` and `apps/server` (now using flat config)
- Updated `next.config.mjs` for web and server apps
- Pinned `pnpm.overrides` and `pnpm.catalog` for React 18
- Reformatted all files with Prettier

### Known Issues

- Next.js 14.2.35 has 2 high-severity DoS CVEs (GHSA-h25m-26qc-wcjf, GHSA-q4gf-8mx6-v5v3); cannot upgrade to Next 15 due to React 18 constraint
- `packages/poster/fonts/` directory empty — poster rendering falls back to system fonts
- Docker build not verified on Windows; standalone output requires symlink permissions

## [0.0.1] - 2026-04-28

### Added

- `CLAUDE.md` — project instructions, conventions, and prohibitions
- `CHANGELOG.md` — version tracking
- `.changeset/config.json` — changeset-based version management (fixed versioning)
- `scripts/check-version-drift.mjs` — monorepo version consistency validator
- `scripts/release-check.mjs` — pre-release quality gate runner
- `.github/workflows/release-web.yml` — Docker build + VPS deploy on `web-v*` tags
- `.github/workflows/release-desktop.yml` — 3-platform Tauri build on `desktop-v*` tags
- `.github/dependabot.yml` — weekly npm/cargo updates, monthly Actions updates
- `.lintstagedrc.json` + `.husky/pre-commit` — lint-staged via husky
- `.claude/skills/release-checklist/` — release checklist skill (8 categories)
- `.claude/skills/cyberoracle-harness/` — updated session startup to read CLAUDE.md + version drift check
- `.eslintrc.json` for `apps/web` and `apps/server` (next/core-web-vitals)

### Changed

- Upgraded Next.js 14.2.5 → 14.2.35 (fixes critical + 6 high-severity security vulnerabilities)
- Upgraded `eslint-config-next` to match
- Switched `apps/web` and `apps/server` from `next lint` to `eslint .` for ESLint 9 compatibility
- Added `license: Apache-2.0` to root `package.json`
- Added scripts: `changeset`, `changeset:version`, `version:check`, `release:check`, `prepare`
- Added devDependencies: `@changesets/cli`, `husky`, `lint-staged`
- Formatted all files with Prettier

## [0.0.0] - 2026-04-28

### Added

- Monorepo scaffold with pnpm + Turborepo
- Next.js 14 web app (`apps/web`)
- Next.js API server (`apps/server`)
- Tauri 2.0 desktop app shell (`apps/desktop`)
- Shared packages: `core`, `poster`, `ui`, `tokens`
- TypeScript strict configuration with path aliases
- ESLint flat config + Prettier + EditorConfig
- CI workflow (lint, typecheck, test, build)
- Environment variable templates (`.env.example`)
- Development scripts (`check-versions`, `clean`, `prepare-fonts`)
- Bilingual README (English + Chinese)
- Comprehensive PRD and technical documentation
- CyberOracle development harness skill (`.claude/skills/`)
- Design spec and implementation plan for harness
