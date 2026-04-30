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
| M2-003  | ✅ Pass | Session 3 |
| M2-004  | ✅ Pass | Session 4 |
| M2-005  | ✅ Pass | Session 5 |
| M2-006  | ✅ Pass | Session 6 |

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

**Commit:** `3ee43da`

### Session 3 — 2026-04-30

**Feature:** M2-003 — Replace DailyFortuneResult schema with rich prompt-spec structure
**Status:** completed

**What was done:**

- Replaced `packages/core/src/schemas/daily-fortune.ts` with new Zod schema matching docs/5完整Prompt文件.md §七
- New schema: title(literal '今日心境速写') → date → ganzhi → solarTerm → ratings{overall,work,relationship,creative,rest} (each 1-5 int) → lucky{color,direction,number(0-9 int),moment} → advice{do,avoid} → oneLine
- Updated test file with 10 tests: validates standard answer from docs, accepts empty solarTerm, rejects ratings out of range (0, 6), rejects lucky.number=10, accepts lucky.number boundary values (0, 9), type-level check
- Removed old M1 structure (date/overall/love/career/wealth/luckyNumber/luckyColor/summary)

**What failed / remaining:**

- None

**Verification:**

- `pnpm --filter @cyberoracle/core test`: 62/62 tests pass (9 files)
- `pnpm typecheck`: 11/11 packages pass
- Barrel exports test confirms `DailyFortuneResultSchema` still importable from `@cyberoracle/core`

**Commit:** `9f71f09`

### Session 4 — 2026-04-30

**Feature:** M2-004 — Add VisionObservation schemas (VLM stage-1 output)
**Status:** completed

**What was done:**

- Created `packages/core/src/schemas/vision-observation.ts` with PalmObservationSchema and FaceObservationSchema
- Both use `z.discriminatedUnion('valid', [...])` — valid:true yields observations object, valid:false yields reason enum
- PalmObservations: 10 fields (hand_shape, finger, palm_proportion, heart_line, head_line, life_line, fate_line, minor_lines, skin_texture, image_quality)
- FaceObservations: 10 fields (face_shape, forehead, eyebrow, eye, nose, mouth, chin, skin_texture, expression_impression, image_quality)
- Palm rejection reasons: not_palm, minor, low_quality, unsafe
- Face rejection reasons: not_face, minor, multiple_faces, low_quality, unsafe
- Added test file with 11 tests covering valid/invalid cases for both schemas
- Exported both schemas + types from schemas/index.ts barrel

**What failed / remaining:**

- None

**Verification:**

- `pnpm --filter @cyberoracle/core test`: 73/73 tests pass (10 files)
- `pnpm typecheck`: 11/11 packages pass

**Commit:** `fc60caa`

### Session 5 — 2026-04-30

**Feature:** M2-005 — Extend prompt loader with expandIncludes()
**Status:** completed

**What was done:**

- Added `expandIncludes(text: string): Promise<string>` to `packages/core/src/prompts/loader.ts`
- Resolves `<<include:NAME>>` markers by reading `packages/core/prompts/_shared/NAME.md` and inlining trimmed content
- Throws `Include not found: _shared/NAME.md` when referenced file doesn't exist
- Multiple includes in one text are all replaced
- Created `packages/core/prompts/_shared/safety-rules.md` and `tone-guidelines.md` per docs §二
- Added test file with 4 cases (single include, multiple includes, no include, missing include)
- Exported `expandIncludes` from prompts/index.ts barrel

**What failed / remaining:**

- None

**Verification:**

- `pnpm --filter @cyberoracle/core test`: 77/77 tests pass (11 files)
- `pnpm typecheck`: 11/11 packages pass

**Commit:** `1d7cd7e`

### Session 6 — 2026-04-30

**Feature:** M2-006 — Create shared prompt segments with verification tests
**Status:** completed

**What was done:**

- Shared segment files already created in M2-005; this session adds the dedicated test
- Created `packages/core/src/prompts/__tests__/shared-segments.test.ts` with 13 tests
- safety-rules.md: verifies existence, non-empty, 10-point checklist phrases, 措辞要求 section, 遇到无法处理的输入 section, expandIncludes resolution
- tone-guidelines.md: verifies existence, non-empty, 整体定位 section, 风格关键词 section, 具体写作要求 section, 中文表达细节 section, expandIncludes resolution

**What failed / remaining:**

- None

**Verification:**

- `pnpm --filter @cyberoracle/core test`: 90/90 tests pass (12 files)
- `pnpm typecheck`: passes

**Commit:** (pending)
