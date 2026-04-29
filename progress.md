# CyberOracle Development Progress

## Milestone: M2 — Web 端 MVP

**Started:** 2026-04-30
**Source docs:** docs/PRD.md §4.1 / §7 / §8 / §9, docs/5完整Prompt文件.md, docs/2satori长图组件.md, docs/6canvas动态化交互设计spec.md

**Builds on:** M1 (Shared Infrastructure, v0.1.0) — see `progress.M1.md` and `feature_list.M1.json`. M1 delivered: monorepo + Tailwind + design tokens + base Zod schemas + basic prompt loader + content safety + satori render pipeline + base PosterLayout.

**Key M2 deltas vs M1:**

- Schemas: M1 used simple structure (personality/career/love/health). M2 replaces with rich prompt-spec output (meta/overview/mainLines/auxiliary/temperament/summary/disclaimer).
- Prompt loader: M1 had basic loadPrompt + fillTemplate. M2 adds expandIncludes() for `<<include:safety-rules>>` references.
- Prompts: M1 only had `vision-observe-palm.md` as a sample. M2 adds 9 more prompt files (face observe, palm/face/daily reading, fallback, plus \_shared).
- Posters: M1 had `PosterLayout` base. M2 adds full PalmReadingPoster + FaceReadingPoster + DailyFortuneCard.
- Server: M1 had `/api/health`. M2 adds /api/upload, /api/analyze (SSE), /api/render-image, /api/result/:id, /api/daily.
- Canvas: M1 had a static page. M2 builds the full dynamic interaction system (4-layer architecture, 9 interaction entries, 4-act dramatic sequence, particles, perf tiers, easter eggs).

---

## Session Log

<!-- Append new sessions below this line. Each session follows this format:

### Session {N} — {date}

**Feature:** {feature_id} — {feature_description}
**Status:** {completed|partial|blocked}

**What was done:**
- {bulleted list of changes}

**What failed / remaining:**
- {if partial, describe what's left}

**Verification:**
- {test results or playwright findings}

**Commit:** `{commit_hash}`

-->

## Summary

| Feature | Status  | Session   |
| ------- | ------- | --------- |
| M2-001  | ✅ Pass | Session 1 |
| M2-002  | ✅ Pass | Session 2 |

### Session 1 — 2026-04-30

**Feature:** M2-001 — Replace PalmReadingResult schema with rich prompt-spec structure
**Status:** completed

**What was done:**

- Replaced `packages/core/src/schemas/palm-reading.ts` with new Zod schema matching docs/5完整Prompt文件.md §五
- New schema: meta{title,subtitle} → overview{heading,body} → mainLines[{name,icon,body}]×3 (icons: heart/brain/leaf) → auxiliary[{icon,label,body}]×2-3 (icons: signpost/wave) → temperament{heading,body} → summary{heading,body,illustration} → disclaimer{label,body}
- Updated test file with 9 tests: validates standard answer JSON from docs, rejects missing fields/invalid icons/invalid illustration/empty mainLines, validates 3 auxiliary items, type-level check
- Removed old M1 structure (id/type/personality/career/love/health/overallScore/summary/createdAt)

**What failed / remaining:**

- None

**Verification:**

- `pnpm --filter @cyberoracle/core test`: 53/53 tests pass (9 files)
- `pnpm typecheck`: 11/11 packages pass
- Barrel exports test confirms `PalmReadingResultSchema` still importable from `@cyberoracle/core`

**Commit:** `a643cd6`

### Session 2 — 2026-04-30

**Feature:** M2-002 — Replace FaceReadingResult schema with rich prompt-spec structure
**Status:** completed

**What was done:**

- Replaced `packages/core/src/schemas/face-reading.ts` with new Zod schema matching docs/5完整Prompt文件.md §六
- New schema: meta{title,subtitle} → overview{heading,body} → mainLines[{name,icon,body}]×3-4 (icons: eyebrow/eye/nose/mouth/face) → auxiliary[{icon,label,body}]×2-3 → temperament{heading,body} → summary{heading,body,illustration} → disclaimer{label,body}
- Updated test file with 9 tests: validates standard answer JSON, accepts 3 and 4 mainLines, rejects <3 and >4, rejects invalid icons/illustration, type-level check
- Removed old M1 structure (id/type/fortune/career/relationship/wisdom/overallScore/summary/createdAt)

**What failed / remaining:**

- None

**Verification:**

- `pnpm --filter @cyberoracle/core test`: 57/57 tests pass (9 files)
- `pnpm typecheck`: 11/11 packages pass
- Barrel exports test confirms `FaceReadingResultSchema` still importable from `@cyberoracle/core`

**Commit:** (pending)
