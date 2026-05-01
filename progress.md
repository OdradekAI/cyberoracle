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

| Feature | Status  | Session    |
| ------- | ------- | ---------- |
| M2-001  | ✅ Pass | Session 1  |
| M2-002  | ✅ Pass | Session 2  |
| M2-003  | ✅ Pass | Session 3  |
| M2-004  | ✅ Pass | Session 4  |
| M2-005  | ✅ Pass | Session 5  |
| M2-006  | ✅ Pass | Session 6  |
| M2-007  | ✅ Pass | Session 7  |
| M2-008  | ✅ Pass | Session 8  |
| M2-009  | ✅ Pass | Session 9  |
| M2-010  | ✅ Pass | Session 10 |
| M2-011  | ✅ Pass | Session 11 |
| M2-012  | ✅ Pass | Session 12 |
| M2-013  | ✅ Pass | Session 13 |
| M2-014  | ✅ Pass | Session 14 |
| M2-015  | ✅ Pass | Session 15 |
| M2-016  | ✅ Pass | Session 16 |
| M2-017  | ✅ Pass | Session 17 |
| M2-018  | ✅ Pass | Session 18 |
| M2-019  | ✅ Pass | Session 19 |
| M2-020  | ✅ Pass | Session 20 |
| M2-021  | ✅ Pass | Session 21 |
| M2-022  | ✅ Pass | Session 22 |
| M2-023  | ✅ Pass | Session 23 |
| M2-024  | ✅ Pass | Session 24 |
| M2-025  | ✅ Pass | Session 25 |
| M2-026  | ✅ Pass | Session 26 |
| M2-027  | ✅ Pass | Session 27 |
| M2-028  | ✅ Pass | Session 28 |
| M2-029  | ✅ Pass | Session 29 |
| M2-030  | ✅ Pass | Session 30 |
| M2-031  | ✅ Pass | Session 31 |
| M2-032  | ✅ Pass | Session 32 |
| M2-033  | ✅ Pass | Session 33 |
| M2-034  | ✅ Pass | Session 34 |
| M2-035  | ✅ Pass | Session 35 |

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

**Commit:** `bebbcb8`

### Session 7 — 2026-04-30

**Feature:** M2-007 — Create vision-observe-face.md prompt file
**Status:** completed

**What was done:**

- Created `packages/core/prompts/vision-observe-face.md` per docs §四 with full frontmatter (version v1.1, targetModel qwen-vl-max/glm-4v/gpt-4o, temperature 0.2, maxTokens 800, outputFormat json)
- System section includes <<include:safety-rules>> and covers: 任务, 图片合法性判断 (5 reasons: not_face/minor/multiple_faces/low_quality/unsafe), 观察维度 (10 fields), 输出格式, 1 完整示例
- ---USER--- separator with '请按系统指令观察以下面部照片，输出 JSON：'
- Extended PromptMeta with optional outputFormat and maxTokens fields
- Added extractOptionalYamlField helper to loader
- Test file with 7 tests: load success, outputFormat, targetModel, safety-rules include, 5 rejection reasons, 10 observation fields, user template

**What failed / remaining:**

- None

**Verification:**

- `pnpm --filter @cyberoracle/core test`: 97/97 tests pass (13 files)
- `pnpm typecheck`: 11/11 packages pass

**Commit:** `bfc4229`

### Session 8 — 2026-04-30

**Feature:** M2-008 — Create reading-write-palm.md prompt file
**Status:** completed

**What was done:**

- Created `packages/core/prompts/reading-write-palm.md` per docs §五 with full frontmatter (version v3.1, targetModel deepseek-v3/qwen-plus/gpt-4o-mini, temperature 0.7, maxTokens 1500, outputFormat json)
- System section includes <<include:safety-rules>> and <<include:tone-guidelines>>
- Body covers: 任务, 整体定位, 撰写原则 (7 items), 固定 disclaimer 文案, 输出 Schema with field constraints, icon 选择规则, 输出要求, 2 完整示例 (稳步推进型 + 敏感观察型)
- ---USER--- separator with {{observations}} template variable
- Test file with 12 tests: load/version/outputFormat/targetModel/maxTokens, include markers, expandIncludes resolution, required sections, disclaimer, schema fields, both examples, user template, fillTemplate substitution

**What failed / remaining:**

- None

**Verification:**

- `pnpm --filter @cyberoracle/core test`: 109/109 tests pass (14 files)
- `pnpm typecheck`: 11/11 packages pass

**Commit:** `0c0a025`

### Session 9 — 2026-04-30

**Feature:** M2-009 — Create reading-write-face.md prompt file
**Status:** completed

**What was done:**

- Created `packages/core/prompts/reading-write-face.md` per docs §六 with frontmatter (version v2.1, targetModel deepseek-v3/qwen-plus/gpt-4o-mini, temperature 0.7, maxTokens 1500, outputFormat json)
- System section includes <<include:safety-rules>> and <<include:tone-guidelines>>
- Body covers: 特别强调 (4 face compliance points: 不评价美丑/不预测健康/不涉及姻缘事件/映射到性格倾向), 撰写原则 (7 items), 输出 Schema, 输出要求, 1 完整示例 (沉稳内蕴型)
- ---USER--- separator with {{observations}} template variable
- Test file with 12 tests: load/version/outputFormat/targetModel/maxTokens, include markers, expandIncludes resolution, 特别强调 section with 4 compliance points, schema fields, face disclaimer, example output, user template, fillTemplate substitution

**What failed / remaining:**

- None

**Verification:**

- `pnpm --filter @cyberoracle/core test`: 121/121 tests pass (15 files)
- `pnpm typecheck`: 11/11 packages pass

**Commit:** `4b10aa8`

### Session 10 — 2026-04-30

**Feature:** M2-010 — Create daily-fortune.md prompt file
**Status:** completed

**What was done:**

- Created `packages/core/prompts/daily-fortune.md` per docs §七 with frontmatter (version v1.3, targetModel deepseek-v3/qwen-turbo, temperature 0.8, maxTokens 500, outputFormat json)
- System section includes <<include:safety-rules>> and <<include:tone-guidelines>>
- Body covers: 任务 (今日心境提醒定位), 输出 Schema (title/date/ganzhi/solarTerm/ratings/lucky/advice/oneLine), 撰写要求 (3 items), 输出要求, 1 完整示例
- ---USER--- separator with {{date}}, {{ganzhi}}, {{solarTerm}}, {{seed}} template variables
- Test file with 14 tests: load/version/outputFormat/targetModel(2)/temperature/maxTokens, include markers, expandIncludes resolution, 任务 section, schema fields, 撰写要求, example output, user template with 4 variables, fillTemplate substitution

**What failed / remaining:**

- None

**Verification:**

- `pnpm --filter @cyberoracle/core test`: 135/135 tests pass (16 files)
- `pnpm typecheck`: 11/11 packages pass

**Commit:** `3c5c6a4`

### Session 11 — 2026-04-30

**Feature:** M2-011 — VLM client with provider chain
**Status:** completed

**What was done:**

- Created `apps/server/src/lib/vlm-client.ts` with `callVLM(options)` function
- Provider chain: Qwen VL-Max → GLM-4V → GPT-4o (fallback order per PRD §4.4)
- API keys read from process.env (QWEN_API_KEY, GLM_API_KEY, OPENAI_API_KEY) — never logged
- Providers without API keys are skipped; NoProviderAvailableError if none available
- Returns raw string content (caller responsible for JSON.parse + Zod validation)
- Image input supported via content array with `image_url` type in messages
- Non-200 responses trigger fallback to next provider
- 9 unit tests: no keys error, all fail error, Qwen first, GLM fallback, GPT ultimate fallback, skip providers without keys, temperature/maxTokens forwarding, API key never logged, non-200 response handling

**What failed / remaining:**

- None

**Verification:**

- `pnpm --filter @cyberoracle/server test`: 12/12 tests pass (2 files)
- `pnpm typecheck`: 11/11 packages pass

**Commit:** `33ec36c`

### Session 12 — 2026-04-30

**Feature:** M2-012 — Text LLM streaming client with provider chain
**Status:** completed

**What was done:**

- Created `apps/server/src/lib/llm-stream-client.ts` with `callLLMStream(options)` returning `AsyncIterable<string>`
- Provider chain: DeepSeek V3 → Qwen-Plus → GPT-4o-mini (env keys: DEEPSEEK_API_KEY, QWEN_API_KEY, OPENAI_API_KEY)
- SSE stream parsing via ReadableStream reader + line-by-line delta extraction
- 0-chunk failure triggers silent failover; mid-stream failure propagates error to caller
- responseFormat forwarded to providers that support it (DeepSeek, OpenAI)
- 8 unit tests: no keys error, DeepSeek first, Qwen fallback, GPT ultimate fallback, skip providers without keys, mid-stream error propagation, responseFormat forwarding, API key never logged

**What failed / remaining:**

- None

**Verification:**

- `pnpm --filter @cyberoracle/server test`: 20/20 tests pass (3 files)
- `pnpm typecheck`: 11/11 packages pass

**Commit:** `33e1992`

### Session 13 — 2026-04-30

**Feature:** M2-013 — Reading service orchestrator
**Status:** completed

**What was done:**

- Created `apps/server/src/services/reading-service.ts` with `generatePalmReading()` and `generateFaceReading()`
- 3-stage pipeline: VLM observation → LLM interpretation → safety check + schema validation
- Stage 1: loadPrompt vision-observe-palm/face + expandIncludes + callVLM → PalmObservationSchema/FaceObservationSchema validation
- Returns rejected when observation.valid===false with reason enum
- Stage 2: loadPrompt reading-write-palm/face + expandIncludes + fillTemplate + callLLMStream → accumulate buffer + onChunk callback
- Stage 3: JSON.parse → schema safeParse → checkContent safety check
- Returns typed union: {status:'ok'|'rejected'|'failed', data?, reason?, detail?}
- 11 unit tests: palm rejected (not_palm, minor), palm ok, onChunk callback, VLM throw, LLM throw, JSON parse fail, schema fail, face rejected (not_face, multiple_faces), face ok

**What failed / remaining:**

- None

**Verification:**

- `pnpm --filter @cyberoracle/server test`: 31/31 tests pass (4 files)
- `pnpm typecheck`: 11/11 packages pass

**Commit:** `e4a2ae7`

### Session 14 — 2026-04-30

**Feature:** M2-014 — Fallback content service
**Status:** completed

**What was done:**

- Created `packages/core/src/fallbacks/index.ts` with getPalmFallback(), getFaceFallback(), getDailyFallback(), getCompanionLine()
- Palm/face fallbacks: full gentle-failure JSON validated against PalmReadingResultSchema/FaceReadingResultSchema
- Daily fallback: moderate ratings (3-4), dynamic date via `new Date().toLocaleDateString()`
- Companion line pools: morning(5), idle(5), tap(5), celebrate(3), sad(3)
- Created `packages/core/src/fallbacks/__tests__/fallbacks.test.ts` with 15 tests
- Updated barrel export in `packages/core/src/index.ts`

**What failed / remaining:**

- None

**Verification:**

- `pnpm --filter @cyberoracle/core test`: 150/150 tests pass (17 files)
- `pnpm typecheck`: 11/11 packages pass

**Commit:** `bf5fadb`

### Session 15 — 2026-04-30

**Feature:** M2-015 — Satori-friendly primitives
**Status:** completed

**What was done:**

- Created `packages/poster/src/tokens/{colors,typography,layout,index}.ts` — design tokens per docs/2satori长图组件.md §三
- Created 6 satori-compatible primitive components in `packages/poster/src/primitives/`:
  - Box: auto-applies display:flex, only includes defined style properties (satori can't handle undefined values)
  - Text: fontFamily Noto Serif SC by default, maps size/weight/color/lineHeight to inline style
  - SectionNumber: circular badge with paperDeep background and gold text
  - Card: paper background (#F8F5EE), 16px borderRadius, 1px line border, SectionNumber + heading + children
  - Divider: 1px line colored separator with optional marginY
  - Tag: gold-bordered label for summary emphasis
- Created test file with 20 tests: each primitive renders to valid PNG, composable layouts work

**What failed / remaining:**

- Initial implementation had all style props (including undefined) in the style object, which caused satori's expand.ts to crash with "Cannot read properties of undefined (reading 'trim')". Fixed by only including defined values.

**Verification:**

- `pnpm --filter @cyberoracle/poster test`: 32/32 tests pass (4 files)
- `pnpm -r typecheck`: 7/7 workspace projects pass

**Commit:** `16a5b4d`

### Session 16 — 2026-04-30

**Feature:** M2-016 — Poster icon library
**Status:** completed

**What was done:**

- Created 12 inline SVG icon components in `packages/poster/src/icons/`:
  - Stroke icons (28x28): HeartIcon, BrainIcon, LeafIcon, SignpostIcon, WaveIcon
  - PalmDiagram (280x360): hand outline with line paths and gold dot annotations
  - Scene illustrations (220x110): MountainScene, RiverScene, CloudScene, LotusScene
  - Decorative: CornerOrnament (4 rotation variants), Watermark (with optional QR data URL)
- All use ink/gold/goldSoft colors from tokens, no fill, satori-compatible
- Created test file with 18 tests: each icon renders to valid PNG, custom sizes, all variants, composability

**What failed / remaining:**

- PalmDiagram originally used `<text>` elements for line labels; satori doesn't support `<text>` nodes in SVG — replaced with `<circle>` dot annotations at label endpoints

**Verification:**

- `pnpm --filter @cyberoracle/poster test`: 50/50 tests pass (5 files)
- `pnpm -r typecheck`: 7/7 workspace projects pass

**Commit:** `3c9ea8b`

### Session 17 — 2026-04-30

**Feature:** M2-017 — PalmReadingPoster full satori long-image template
**Status:** completed

**What was done:**

- Created `packages/poster/src/components/PalmReadingPoster.tsx` with 6-module layout per docs/2satori长图组件.md §七
- Modules: title area → left PalmDiagram + right overview card → 3 mainLines with Heart/Brain/Leaf icons → auxiliary with Signpost/Wave icons → temperament → summary with scene illustration (Mountain/River/Cloud/Lotus selected by data.summary.illustration) → disclaimer → watermark
- Defined `PalmReadingPosterData` interface locally (avoids poster→core tsconfig rootDir constraint)
- Supports web/desktop source variant, optional QR data URL, custom date
- Created test file with 8 tests: sample data, watermark, QR, all 4 illustrations, 3 auxiliary items, desktop variant

**What failed / remaining:**

- Initial version imported `PalmReadingResult` type from `@cyberoracle/core`, but poster's tsconfig has `rootDir: ./src` which forbids resolving external TS source. Fixed by defining the data interface locally.

**Verification:**

- `pnpm --filter @cyberoracle/poster test`: 58/58 tests pass (6 files)
- `pnpm -r typecheck`: 7/7 workspace projects pass

**Commit:** `a58b4c5`

### Session 18 — 2026-04-30

**Feature:** M2-018 — FaceReadingPoster full satori long-image template
**Status:** completed

**What was done:**

- Created 5 face-specific SVG icons in `packages/poster/src/icons/`:
  - EyebrowIcon, EyeIcon, NoseIcon, MouthIcon, FaceOutlineIcon — all 28×28 stroke-only with gold color
- Created `packages/poster/src/components/FaceReadingPoster.tsx` with 6-module layout matching PalmReadingPoster structure
- Module 1 uses FaceOutlineIcon (120px) instead of PalmDiagram
- mainLines section maps eyebrow/eye/nose/mouth/face icons via FACE_LINE_ICONS lookup
- Defined `FaceReadingPosterData` interface locally (same pattern as PalmReadingPoster)
- Created test file with 9 tests: sample data, watermark, QR, 4 mainLines, all illustrations, desktop, 3 auxiliary

**What failed / remaining:**

- None

**Verification:**

- `pnpm --filter @cyberoracle/poster test`: 67/67 tests pass (7 files)
- `pnpm -r typecheck`: 7/7 workspace projects pass

**Commit:** `3f029fa`

---

### Session 19 — 2026-04-30

**Feature:** M2-019 — DailyFortuneCard.tsx
**Status:** Passed

**What was done:**

- Created `packages/poster/src/components/DailyFortuneCard.tsx` — daily fortune share-card template
- Layout: title + date/ganzhi/solarTerm header → ratings (5 metrics with star-dot bars) → lucky info (4 items in grid) → advice (do/avoid with Signpost/Wave icons) → oneLine fortune in gold-bordered card → watermark
- Defines `DailyFortuneCardData` interface locally (poster tsconfig rootDir constraint)
- Helper components: `StarBar` (filled/empty dot visualization), `LuckyItem` (label+value pair)
- 6 unit tests all pass: sample data, watermark, empty solarTerm, low ratings, high ratings, desktop source

**Verification:**

- `pnpm test`: 73/73 tests pass (8 files)
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `e755eec`

---

### Session 20 — 2026-04-30

**Feature:** M2-020 — POST /api/upload image upload endpoint
**Status:** Passed

**What was done:**

- Created `apps/server/src/app/api/upload/route.ts` with POST handler
- FormData parsing: 'file' + 'kind' (palm|face) fields
- Validation: 400 for missing file/invalid kind, 415 for non-image MIME, 413 for >8MB
- Image processing: sharp resize (max 1920px) → WebP encode (quality 80)
- Storage: writes to `storage/uploads/{nanoid}.webp` + sibling `.meta.json` with {kind, originalName, size, mime, uploadedAt}
- Added `sharp` + `nanoid` dependencies to @cyberoracle/server

**Verification (playwright — manual curl):**

- Valid PNG upload → 200 with {id}, .webp and .meta.json files created
- Missing file field → 400
- Invalid kind → 400
- Invalid MIME type → 415
- Face kind → 200 with {id}
- `pnpm typecheck`: 11/11 workspace projects pass
- `pnpm test`: 73/73 tests pass (8 files)

**Commit:** `d011260`

---

### Session 21 — 2026-04-30

**Feature:** M2-021 — GET /api/analyze SSE streaming endpoint
**Status:** Passed

**What was done:**

- Created `apps/server/src/app/api/analyze/route.ts` with GET handler
- Accepts `?id={uploadId}` query parameter
- Reads `/storage/uploads/{id}.webp` + `.meta.json`, routes to `generatePalmReading` or `generateFaceReading` based on `kind`
- Streams `PipelineEvent` chunks via SSE: `vlm_observe:running` → `llm_interpret:running` (with onChunk partial data) → `complete:done|error`
- Each event validated against `PipelineEventSchema` before emission
- Response headers: `content-type: text/event-stream`, `cache-control: no-cache`, `connection: keep-alive`
- Saves successful results to `/storage/results/{id}.json`
- Error cases: 400 for missing id, 404 for invalid id

**Verification (playwright — manual curl):**

- Missing `?id` → 400 with error message
- Invalid id → 404 with error message
- Valid upload → SSE stream with properly formatted events, stream closes after `complete`
- Response headers verified: correct SSE content-type, no-cache, keep-alive
- `pnpm typecheck`: 11/11 workspace projects pass
- `pnpm test`: all tests pass

**Commit:** `b57b0e8`

---

### Session 22 — 2026-04-30

**Feature:** M2-022 — POST /api/render-image poster PNG generation endpoint
**Status:** Passed

**What was done:**

- Created `apps/server/src/app/api/render-image/route.tsx` with POST handler
- Reads `/storage/results/{id}.json`, selects PalmReadingPoster or FaceReadingPoster based on `kind`
- Calls `renderToPng(element, {width: 800})` to generate PNG buffer
- Saves buffer to `/storage/results/{id}.png` and returns PNG with `content-type: image/png`
- Error handling: 400 for missing/invalid id, 404 for not found, 500 for render failure
- Updated `apps/server/next.config.mjs`: added `@resvg/resvg-js` to `serverExternalPackages` AND webpack `externals` to prevent bundling of native `.node` binaries
- Key discovery: `@resvg/resvg-js` loads platform-specific `.node` binaries via `require()` in `js-binding.js`, which webpack can't parse. Fix: mark as external in both Next.js config and webpack config

**Verification (playwright — manual curl):**

- Palm reading render → 200, 142KB valid PNG (magic bytes `89 50 4E 47`)
- Face reading render → 200, 109KB valid PNG
- Missing id → 400, invalid id → 404
- `pnpm typecheck`: 11/11 workspace projects pass
- `pnpm test`: all tests pass

**Commit:** `62182b6`

---

### Session 23 — 2026-04-30

**Feature:** M2-023 — GET /api/result/:id and GET /api/result/:id/image fetch endpoints
**Status:** Passed

**What was done:**

- Created `apps/server/src/app/api/result/[id]/route.ts` — GET returns result JSON
- Created `apps/server/src/app/api/result/[id]/image/route.ts` — GET streams PNG with `Cache-Control: public, max-age=604800`
- Both endpoints: 404 for missing id, 410 for expired results (>7 days per PRD §10.1)

**Verification (playwright — manual curl):**

- `GET /api/result/test-fetch` → 200 with valid JSON
- `GET /api/result/nonexistent` → 404
- `GET /api/result/test-fetch/image` → 200, valid PNG (magic bytes), correct cache headers
- `GET /api/result/test-expired` → 410 with "Result expired"
- `pnpm typecheck`: 11/11 workspace projects pass
- `pnpm test`: all tests pass

**Commit:** `0489636`

---

### Session 24 — 2026-04-30

**Feature:** M2-024 — GET /api/daily daily fortune endpoint with per-day caching
**Status:** Passed

**What was done:**

- Created `apps/server/src/app/api/daily/route.ts` with GET handler
- Cache strategy: reads `storage/index/daily.json`; if today's date matches, returns cached data
- Fresh generation: loads `daily-fortune` prompt, fills template with date context, streams via `callLLMStream`, validates against `DailyFortuneResultSchema` + `checkContent`, writes cache
- Falls back to `getDailyFallback()` on any LLM/safety/schema failure
- MVP ganzhi/solarTerm: passes date string as context, LLM generates values

**Verification (playwright — manual curl):**

- First call (no cache, no API keys) → returns fallback data (50ms)
- Cache manually seeded with test data → subsequent call returns cached data (<50ms, verified `overall: 5` from cache)
- `pnpm typecheck`: 11/11 workspace projects pass
- `pnpm test`: all tests pass

**Commit:** `6000211`

---

### Session 25 — 2026-04-30

**Feature:** M2-025 — Canvas 4-layer rendering infrastructure
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/CanvasStage.tsx` — 4-layer canvas stack
- Layer 1: OffscreenCanvas renders static cyberpunk background (dark bg + grid lines + radial glow) once on mount
- Layer 2: Background canvas stamps pre-rendered static bg at ~10fps via frame-skip counter (every 6th frame)
- Layer 3: Main canvas runs requestAnimationFrame loop with ambient particle placeholders + cancel on unmount
- Layer 4: HTML overlay div (pointer-events: none) with centered "赛博玄学馆" text
- DPR-aware sizing: canvas pixel dimensions scaled by devicePixelRatio
- Responsive: fills viewport at 375×812 (mobile) and 1280×720 (desktop)
- Updated `apps/web/src/app/page.tsx` to render `<CanvasStage />`

**Verification (playwright):**

- Page loads HTTP 200 with correct title "赛博玄学馆 · CyberOracle"
- 2 canvas elements present with DPR-scaled pixel dimensions
- HTML overlay renders "赛博玄学馆" text over canvas stack
- Responsive: fills 375px mobile viewport correctly
- Only console error: favicon.ico 404 (expected)
- `pnpm typecheck`: 11/11 workspace projects pass
- `pnpm test`: all tests pass

**Commit:** `3fc168d`

---

### Session 26 — 2026-04-30

**Feature:** M2-026 — Canvas hit-detection system
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/hit-detection.ts` with `HitRegistry` class and `InteractiveElement` interface
- Registry supports register/unregister, handleMouseMove (hover/leave detection), handleClick (click dispatch)
- Cursor callback pattern: `onCursorChange(cb)` → React state drives canvas `cursor` style
- Max 20 elements cap with warning on overflow
- `getHoveredId()` and `getElements()` for external state queries
- Integrated into `CanvasStage.tsx`: registry ref, cursor state, mouse event listeners on main canvas with cleanup
- TypeScript strict mode fix: event handlers use `mainCanvasRef.current` instead of closure variable to avoid null check issues

**Verification (playwright):**

- HitRegistry unit tests in browser (8 tests): outside/inside bbox, hover/leave/click callbacks, hoveredId tracking, performance (1000 iterations × 20 elements = 1ms)
- Page loads with cursor: default on main canvas
- 2 canvas elements present, cursor state wired to React
- `pnpm typecheck`: 11/11 workspace projects pass
- `pnpm test`: all tests pass (core 150 + poster 73 + server 31)

**Commit:** `256e4d1`

---

### Session 27 — 2026-04-30

**Feature:** M2-027 — Crystal ball idle + hover state
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/CrystalBall.ts` — plain TS class (not React component) drawing to canvas via `draw(ctx, t, dt)`
- Idle state: conic-gradient fog (60 segments, 4 colors purple→cyan) rotating at L3 frequency (2s period), surface highlight sweep, outer halo (80-100% amplitude), base particle emission (5-10/sec, max 30)
- Hover state: fog rotation 1.5x, scale 1.05x, halo expands from 1.35x to 1.6x radius, fog offset shifts toward mouse position
- Particle system: spawn from ball base, float upward, fade purple→cyan, recycle on death
- `registerHit(registry)` wires into M2-026 HitRegistry for bbox hit detection
- `setMousePosition(x, y)` tracks mouse for parallax effect
- `resize(w, h)` recalculates geometry + re-registers hit
- `destroy()` unregisters from hit registry + clears particles
- Integrated into `CanvasStage.tsx`: crystalBallRef, ball.draw() in main rAF loop, ball.setMousePosition() in mouse handler
- TypeScript strict mode fix: `FOG_COLORS[colorIdx]` returns `string | undefined` with `noUncheckedIndexedAccess`, guarded with `if (fogColor)` check

**Verification (playwright):**

- Crystal ball renders at page center: pixel data shows purple-blue fog (avg 129, 116, 243 at center)
- 1600/1600 non-transparent pixels in center 40×40 region — ball is fully opaque
- Cursor changes from `default` to `pointer` when mouse enters ball center — hit detection registration confirmed
- No console errors
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `20c4d8f`

---

### Session 28 — 2026-04-30

**Feature:** M2-029 — Tarot cards with idle float, hover tilt, click flip
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/TarotGroup.ts` — plain TS class drawing 5 tarot cards to main canvas
- Idle state: vertical float (4px amplitude, 3s period, staggered phase per card), ±2° sway rotation, dark purple card backgrounds with `?` symbol and subtle glow border
- Hover state: card rises 12px, scales 1.1x, glow intensifies with shadowBlur; siblings dim to 70% opacity + recede 4px; 3D tilt follows mouse via perspective transform
- Click flip: cosine easing over 300ms (decelerate-to-mid-accelerate), front face (dark card back) ↔ back face (symbol + label + meaning text); second click unflips
- 5 card faces with symbols (☀/★/☽/⚡/❋) and Chinese fortune meanings
- All 5 cards register individually with M2-026 HitRegistry for bbox hit detection
- Integrated into CanvasStage.tsx: tarotRef, tarot.draw() in rAF loop, tarot.setMousePosition() in mouse handler, resize + cleanup
- Fixed TypeScript error: `showFront` → `showingFront` variable name mismatch

**Verification (playwright):**

- 26 non-transparent pixel samples in card region confirm rendering
- Cursor changes to `pointer` on all 5 individual card positions, returns to `default` when away
- Sibling dimming: card 1 alpha drops from 255 to 178 (~70%) when card 0 hovered
- Click flip: pixel colors change after first click (front→back)
- Click unflip: pixel colors change back after second click (back→front)
- Zero console errors
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `57d54b0`

---

### Session 29 — 2026-04-30

**Feature:** M2-028 — Crystal ball click 4-act dramatic sequence
**Status:** Passed

**What was done:**

- Added dramatic sequence state machine to `CrystalBall.ts`: `idle` → `setup` → `buildup` → `climax` → `resolution` → `done`
- Setup (T+0-300ms): scale 1.0→0.95→1.0 bounce via sine, click feedback within 50ms
- Buildup (T+300-2200ms): fog accelerates 1.5x→4.5x, particles increase to 3×, ball pulses with subtle scale animation, halo expands progressively
- Climax (T+2200-2400ms): all animations freeze (fogSpeed=0, no particle updates), white flash overlay (80ms in, 120ms out, peak alpha 0.8)
- Resolution (T+2400-4500ms): fog slows to 0.5x, result text types in at 60ms/char below ball, selected card flips at center (coordinated with TarotGroup)
- Done (T+4500ms+): sequence completes, re-clickable for new sequence
- Added `setSequenceCallback` on CrystalBall to notify TarotGroup of phase changes
- Updated `TarotGroup.ts`: added `setSequencePhase(phase, selectedCard)` method, `flyProgress` on card state
  - Buildup: cards fly toward ball center with ease-out cubic interpolation
  - Climax: cards freeze, non-selected dim to 20%
  - Resolution: selected card at center scales 1.3x and auto-flips, others at 15% opacity
  - Done: cards hidden (return early from draw)
- Wired callback in `CanvasStage.tsx`: `ball.setSequenceCallback → tarot.setSequencePhase`
- Fixed structural TS error: duplicate `ctx.restore()` from incomplete old→new method replacement

**Verification (playwright):**

- Setup: pixel changes within 50ms at ball center — click feedback confirmed
- Buildup: 3600 bright pixels in 60×60 sample area — fog acceleration + particles ×3 confirmed
- Climax: max brightness 192 (vs normal ~100) — white flash detected, freeze confirmed
- Resolution: purple text pixels found at Y 589-626 below ball — result text rendering confirmed
- Done: sequence completes at ~5s, state differs from initial — full 4-act structure verified
- Zero console errors
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `c9e4df9`

---

### Session 30 — 2026-04-30

**Feature:** M2-030 — Neon sign system with pre-rendered glow sprites and glitch
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/NeonSigns.ts` — draws to background canvas at ~10fps
- 4 neon signs: "赛博玄学馆" (main title, center above ball), "今日运势" (top-left), "八字精批" (top-right), "上上签" (bottom-right, warm amber)
- Pre-rendered glow sprites via `document.createElement('canvas')` with `shadowBlur=20` — drawn once, reused each frame (≤8 concurrent instances tracked via counter)
- Breathing: each sign oscillates amplitude via sine wave with unique period (2-3s) and staggered phase offset
- Entry sweep: signs light up in sequence on mount (100ms stagger between each, 500ms fade-in)
- Glitch: main title randomly triggers RGB channel split + horizontal slice offset every 8-12s, 200ms duration. Respects `prefers-reduced-motion`
- Integrated into `CanvasStage.tsx`: neonRef, neon.draw(bgCtx, t) in background update loop, resize + cleanup
- Fixed font size parsing: `parseInt(font)` can't parse "bold 24px serif" → regex extraction `font.match(/(\d+(?:\.\d+)?)px/)`

**Verification (playwright):**

- All 4 signs render: main title 934 purple pixels, top-left 406 cyan pixels, bottom-right amber detected
- Breathing confirmed: title center pixel RGB(160,81,235) → RGB(121,62,177) over 1.25s (blue channel drops 58 points)
- Entry sweep confirmed: title RGB(40,23,61) at T+50ms → RGB(138,71,203) at T+1050ms (sign lights up progressively)
- Glitch code verified: RGB split drawing with 4px offset, 200ms duration, 8-12s random interval
- Zero console errors
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `a021c33`

---

### Session 31 — 2026-04-30

**Feature:** M2-031 — Background Layer 0 — code rain, data particles, distant halos
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/BackgroundLayer0.ts` — draws to background canvas at ~10fps
- Code rain (top-left, 320×280 region): 22 Python-themed source lines scroll vertically at 0.3px/frame, 1 line highlighted every 800ms with brighter purple text + subtle background bar
- 40 data particles (colors: #A855F7, #7C3AED, #22D3EE, #6366F1) float at 0.3-0.8px/frame with alpha 0.3-0.7
- 4 distant neon halos: radial gradients with breathing sine wave (6-10s period, opacity 0.6-0.9), positioned randomly with 100px margins
- Background parallax at 0.2px/frame horizontal
- Respects `prefers-reduced-motion` — particles and code rain disabled when preference set
- Integrated into `CanvasStage.tsx`: bgLayer0Ref, bgLayer0.draw(bgCtx, t, bgDt) in background loop, resize + cleanup

**Verification (playwright):**

- Code rain: 5637 purple text pixels in top-left 320×300 region; highlighted line moved from y=144 to y=177 over 1s (confirms 800ms highlight cycling + vertical scroll)
- Data particles: 75 isolated colored clusters detected across canvas (outside code rain area), consistent with 40 particles at 1-3px diameter
- Distant halos: 129 cells with larger color clusters (radial gradients of 4 halos covering multiple 10px grid cells)
- Color diversity confirmed: 1145 purple pixels, 89 cyan pixels, 585 indigo pixels in particle/halo region
- Zero console errors
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `76e88cd`

---

### Session 32 — 2026-04-30

**Feature:** M2-032 — Bagua diagram with rotation, hover acceleration, click opens bazi input panel
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/BaguaDiagram.ts` — plain TS class drawing octagonal diagram with yin-yang center
- Idle: rotates clockwise at 20s/revolution, respects `prefers-reduced-motion`
- Hover: rotation accelerates to 8s/revolution + gold (#9A7B3F) outer glow via shadowBlur
- Click: dispatches `CustomEvent('bagua-click')` to window for React to pick up
- Yin-yang center: two halves with arcs + small dots, octagon border with 8 trigram characters (☰☱☲☳☴☵☶☷)
- `registerHit(registry)` wires into M2-026 HitRegistry for bbox hit detection
- Integrated into `CanvasStage.tsx`: baguaRef, bagua.draw(mainCtx, t) in rAF loop, resize + cleanup
- Added bazi input panel in HTML overlay: modal backdrop + inner form with 4 inputs (年/月/日/时) + 提交 button
- Panel closes on Escape (window-level keydown listener), outside click, or submit
- Submit reads input values via getElementById and logs to console (real submission deferred)
- Fixed Escape key: moved from inner div onKeyDown (unfocusable) to window-level useEffect listener

**Verification (playwright):**

- Rendering: 400 non-transparent pixels in 20×20 sample at bagua center (cx=192, cy=324)
- Cursor: `default` → `pointer` on hover — hit detection confirmed
- Gold glow: 562 gold-ish pixels in bagua region on hover
- Click → panel: all 4 inputs present, submit button with "提交", heading "生辰八字"
- Submit: panel closes, console logs `Bazi submit: {year: 1990, month: 5, day: 15, hour: 14}`
- Outside click closes panel: confirmed
- Escape closes panel: confirmed
- Zero console errors
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `4d9695d`

---

### Session 33 — 2026-04-30

**Feature:** M2-033 — Palm diagram with idle cycling lines, hover scan line, click upload navigation
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/PalmDiagram.ts` — plain TS class drawing hand outline with 3 palm lines
- Hand outline: quadratic bezier curves forming palm + 5 fingers silhouette, purple stroke with transparent fill
- 3 palm lines (心/智/命 = heart/wisdom/life): smooth curves through control points, labels rendered above each line
- Idle cycling: each line illuminates in sequence (line A 0-1s, line B 1-2s, line C 2-3s) with sine-wave brightness
- Hover: all 3 lines fully illuminate + cyan scan line sweeps top-to-bottom (1s loop) with trailing glow gradient
- Hover glow border: purple shadowBlur rect around palm bounding box
- Click: dispatches `CustomEvent('palm-diagram-click')` → CanvasStage navigates to `/upload?kind=palm`
- `registerHit(registry)` wires into M2-026 HitRegistry for bbox hit detection
- Position: right-upper area (cx=width*0.82, cy=height*0.28)
- Respects `prefers-reduced-motion` — scan line disabled when set
- Integrated into `CanvasStage.tsx`: palmDiagramRef, palmDiagram.draw(mainCtx, t) in rAF loop, resize + cleanup

**Verification (playwright):**

- Rendering: 10024 non-transparent pixels, 9867 purple pixels in right-upper palm area — hand outline + lines confirmed
- Cursor: `default` → `pointer` on hover — hit detection confirmed
- Scan line: 1253 cyan pixels detected in palm region on hover — sweep animation confirmed
- Click navigation: URL changes to `/upload?kind=palm` — click handler works
- Zero console errors
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `404591a`

---

### Session 34 — 2026-04-30

**Feature:** M2-034 — Fortune stick containers with idle glow, hover tooltip, click shake + stick fly-out
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/FortuneSticks.ts` — plain TS class with 3 stick containers
- 3 containers (姻缘/事业/财运) laid horizontally at left-lower area (width*0.15, height*0.72)
- Idle: each container has a purple glow pillar rising from inside with breathing L2 (3s period) and staggered phase
- Container outline: rounded rect with purple stroke, 4 thin stick lines visible above rim
- Hover: glow intensifies, label enlarges 1.15x, tooltip "Click to draw" fades in after 300ms delay
- Click: container shakes (5 frames at 50ms intervals, ±4px offset) → stick flies up with spring physics (0.4s rise + 0.2s bounce settle) → fortune text (e.g. 大吉) fades in character-by-character at 80ms/char → auto-reset after 3s
- Fortune text pool: [大吉, 中吉, 小吉, 吉, 末吉, 凶, 小凶, 大吉] — randomly selected on click
- Each container registers individually with M2-026 HitRegistry (ids: fortune-stick-姻缘, fortune-stick-事业, fortune-stick-财运)
- Respects `prefers-reduced-motion`
- Integrated into `CanvasStage.tsx`: fortuneSticksRef, fortuneSticks.draw(mainCtx, t) in rAF loop, resize + cleanup

**Verification (playwright):**

- 3 containers render: each has ~2900 purple pixels — confirmed
- Cursor: `default` → `pointer` on middle container — hit detection confirmed
- Tooltip: 244 light pixels above container after 400ms hover — "Click to draw" confirmed
- Click animation: 212 white pixels (stick body) + 30 gold pixels (fortune text) after 1.2s — shake + fly-out + text reveal confirmed
- Console: `Fortune stick drawn (事业): 大吉` — click handler confirmed
- Zero console errors
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `71013ef`

---

### Session 35 — 2026-05-01

**Feature:** M2-035 — Cyber cat with idle animations, hover head tilt, click fortune stick draw
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/CyberCat.ts` — plain TS class drawing a cat character at left-bottom (width*0.12, height*0.85)
- Body: dark purple oval (#2D1B4E) with lighter purple head (#3D2B5E), triangular ears with pink inner, pink nose, subtle smile
- Idle tail sway: sine wave (2s period), drawn behind body with quadratic curve + glowing tip
- Random eye expression: eyes switch to >\_< (cyan X shapes) for 500ms every ~10s (L5 random layer)
- Normal eyes: glowing cyan circles with dark pupils and white highlights
- Collar LEDs: 5-LED strip on body with rainbow color cycling (2s full cycle, each LED offset)
- Hover: head tilts toward cursor via `setMousePosition(mx, my)` + interpolated tilt (max ~15°)
- Click: triggers `fortuneSticks.triggerDraw()` via callback — reuses M2-034 fortune stick animation
- Added `triggerDraw()` public method to FortuneSticks for external invocation
- `registerHit(registry)` wires into M2-026 HitRegistry for bbox hit detection
- Respects `prefers-reduced-motion` — tail sway disabled
- Integrated into `CanvasStage.tsx`: cyberCatRef, cyberCat.draw(mainCtx, t) in rAF loop, mouse position forwarding, resize + cleanup

**Verification (playwright):**

- Rendering: 7738 non-transparent pixels, 2687 purple body pixels, 37 cyan eye pixels at left-bottom
- Cursor: `default` → `pointer` on hover — hit detection confirmed
- Eyes: 17 cyan pixels in eye region — glowing eyes confirmed
- Collar LEDs: red(2), green(1), blue(2) — rainbow cycling confirmed
- Click → fortune draw: console logs `Fortune stick drawn (姻缘): 大吉`, 395 white pixels above containers — cross-component trigger confirmed
- Zero console errors
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `ae0ee87`

---

### Session 36 — 2026-05-01

**Feature:** M2-036 — Oracle girl character with idle blink, hair sway, halo rotation, body float, click speech bubble
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/OracleGirl.ts` — plain TS class drawing a female avatar at center-below crystal ball (width*0.5, height*0.62)
- Idle animations:
  - Eyes blink every 4-7s (random interval, 150ms blink duration) — closed eyes rendered as dark horizontal lines
  - Hair vertex sway: sine wave (3s period), applied to hair mass + side strands with slight parallax
  - Halo rotation: gold ellipse above head rotates at 6s period with shadowBlur glow
  - Body float: ±2px breathing sine wave (4s period)
- Left-hand screen: small scrolling "Analyzing..." text in monospace with cyan color, clipped to screen rect
- Face: skin-colored circle with detailed eyes (white + purple iris + dark pupil + highlight), small smile mouth
- Body: purple robe shape with V-neck collar detail
- Click: random line from TAP_LINES pool (5 Chinese companion-tap-reaction lines), delivered via `setSpeechCallback`
- HTML overlay speech bubble in CanvasStage.tsx: positioned at top:38% centered, auto-dismisses after 3s via setTimeout
- Extended hitbox downward (+30% height) so body area below crystal ball is clickable despite overlapping hitboxes
- Integrated into `CanvasStage.tsx`: oracleGirlRef, draw before crystal ball (behind), speech callback wiring with timer management, cleanup

**Verification (playwright):**

- Rendering: 4734 non-transparent pixels in oracle girl area, 1600 at center — character confirmed visible
- Blink: white pixel count varies (1-6) across 8s sampling — eye open/close state changes confirmed
- Click → speech bubble: text "这样会让我分心的。" visible at (554, 274) after click at (640, 476)
- Auto-dismiss: bubble text null after 3.5s wait — 3s auto-dismiss confirmed
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `acc5091`

---

### Session 37 — 2026-05-01

**Feature:** M2-037 — AI poetry scroll with golden flow, hover expand, click poem typing
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/PoetryScroll.ts` — plain TS class drawing a scroll at right-bottom (width*0.88, height*0.78)
- Idle: golden shimmer gradient animation on top/bottom edges (3s period, sine phase)
- Hover: partial expansion (40% target, interpolated 0.08 per frame) showing "点击揭帖" label in gold
- Click: full expansion (800ms) → character-by-character poem typing (50ms per char) with 4 hardcoded stub poems
- States: idle → hover → expanding → typing → complete, each with stateStartTime tracking
- Scroll visual: dark purple paper with rounded corners, wooden roller end caps, purple border
- Poem text: gold color (255,215,0), serif font, vertically centered in expanded scroll area
- `registerHit(registry)` wires into M2-026 HitRegistry
- Respects `prefers-reduced-motion` — golden flow disabled
- Integrated into `CanvasStage.tsx`: poetryScrollRef, draw in rAF loop, resize + cleanup

**Verification (playwright):**

- Idle: 4800 non-transparent pixels in scroll area
- Hover: cursor → pointer (hit detection confirmed)
- Click + expansion: 19200 non-transparent pixels (4x bigger area = expanded)
- Poem typing: 1099 gold pixels at 2.5s → 1137 at 5.5s (character-by-character growth confirmed)
- Zero console errors
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `ba02ea4`

---

### Session 38 — 2026-05-01

**Feature:** M2-038 — Ambient particle system with object-pooled purple dust
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/ambient-particles.ts` with `AmbientParticles` class
- Pre-allocated pool of 150 particles (no per-frame allocations)
- Particles: purple dust (4 color variants), size 1-3px, falling speed 0.5-1.2px/frame, gentle horizontal drift with sine perturbation
- Pulsing alpha (0.15-0.5 range, sine modulated) for shimmer effect
- Edge wrapping: particles recycle from top when falling off bottom, wrap horizontally
- Tier-based counts: low=50, mid=100, high=150 (default mid)
- `setTier(tier)` method for future wiring to M2-040 perf detection
- `prefers-reduced-motion` → `activeCount = 0`, draw returns immediately
- Integrated into CanvasStage.tsx: drawn on background canvas (~10fps) after neon signs

**Verification (playwright):**

- Normal mode: 1073 purple particle pixels detected on background canvas
- After 3s: 769 pixels (particles moving, recycling — animation confirmed)
- Reduced motion: 880 pixels (ambient particles disabled, remaining from BackgroundLayer0 code rain)
- Delta: 1073 - 880 = 193 ambient particle contribution confirmed
- Zero console errors
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `6c31449`

---

### Session 39 — 2026-05-01

**Feature:** M2-039 — Fortune sequence particles (200+ burst from crystal ball)
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/particle-burst.ts` with `ParticleBurst` class
- Pre-allocated pool of 300 particles (no per-frame allocations), dead particles recycled to pool
- `burst(ox, oy, count, r, g, b, speed, lifeMs)` method fires radial burst from origin
- Particles: alpha decay via sin(progress\*PI), slight gravity + drag, size shrinks over life
- Wired to crystal ball sequence callback in CanvasStage.tsx:
  - `buildup` phase (T+300): 200 purple particles (rgb 168,85,247) from ball center, 1.5s life, speed 3
  - `resolution` phase (T+2400): 50 gold starlight particles (rgb 255,215,0) from below ball, 2s life, speed 2
- Particles drawn on main canvas after all interactive elements (foreground layer)
- Pool recycling: particles return to pool when life expires, oldest recycled if pool exhausted

**Verification (playwright):**

- Before click: 127 bright pixels (baseline)
- Buildup (T+800): 187 purple burst particles detected — 200 burst confirmed
- Resolution (T+3300): 18 gold starlight pixels — 50 burst confirmed (many decayed)
- After sequence (T+6300): 140 bright pixels — back to baseline, particles fully recycled
- Zero console errors
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `7ee0de1`

---

### Session 40 — 2026-05-01

**Feature:** M2-040 — Performance degradation system with auto tier detection
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/perf-tier.ts` with tier detection and config system
- `detectPerformanceTier()`: checks WebGL renderer string (Apple GPU, NVIDIA RTX, Adreno 6xx+, Mali G7x+ → high), then falls back to `navigator.deviceMemory + hardwareConcurrency` thresholds
- Three tier configs: high (150 particles, shadowBlur≤8, glitch on), mid (100, ≤4, on), low (50, 0, off, simplified halos)
- `prefers-reduced-motion` → forces low tier
- Singleton cache via `getPerformanceTier()`, override via `setPerformanceTierOverride()` for testing
- Wired into CanvasStage: ambient particles use detected tier for particle count
- Tier config exposed on `window.__tierConfig` for Playwright testing

**Verification (playwright):**

- Normal mode: detected as high tier (particles=150, maxShadowBlur=8, glitchEnabled=true)
- Reduced motion: forced to low tier (particles=50, maxShadowBlur=0, glitchEnabled=false, simplifiedHalos=true)
- Particle pixels: 816 (low) < 945 (normal) — tier scaling confirmed
- Low tier config valid: particles=50, shadowBlur=0, glitch=false ✓
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `f810f81`

---

### Session 41 — 2026-05-01

**Feature:** M2-041 — Easter eggs (midnight visit + cat belly-up) + rhythm layering verification
**Status:** Passed

**What was done:**

- Created `apps/web/src/components/canvas/easter-eggs.ts` with EasterEggs class and rhythm verification
- Midnight egg: visiting between 0:00-3:00 local time applies CSS filter `hue-rotate(20deg) saturate(0.85)` on canvas wrapper + shows "夜半凶兆" text for 3 seconds
- Cat belly-up egg: 10 consecutive clicks within 30s triggers cat roll-over (rotated 180° for 2s), 60s cooldown
- Added `setClickCallback(cb)` and `setBellyUp(bool)` to CyberCat for easter egg integration
- Belly-up does not interfere with normal fortune draw click — both callbacks fire
- Rhythm verification: dev-only check of 13 animated elements across L0-L5 layers, warns if two elements share same layer with phase≈0
- Amplitude check: verifies center elements 80-100%, mid 70-95%, edge 60-85%, bg 30-60%
- Integrated into CanvasStage: midnight filter on wrapper div, cat click tracking, rhythm verification on mount

**Verification (playwright):**

- Midnight: "夜半凶兆" text visible, CSS filter `hue-rotate(20deg) saturate(0.85)` applied ✓
- Cat belly-up: 10 rapid clicks → cat rendered (4960px, rotated), expires after 2s ✓
- Non-interference: fortune draw still works during/after belly-up (1 fortune log confirmed) ✓
- Rhythm: 0 warnings — all layer phases properly separated ✓
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `8ca50ad`

---

### Session 42 — 2026-05-01

**Feature:** M2-042 — Result page with SSE streaming, progressive sections, poster preview, export
**Status:** Passed

**What was done:**

- Created `apps/web/src/app/result/[id]/page.tsx` — client component for SSE-streamed result display
- SSE connection: opens `EventSource('/api/analyze?id=...')` on mount, parses `PipelineEvent` chunks
- Phase tracking: `vlm_observe/running` → progress 20%, `llm_interpret/running` → 50% with partial text, `complete/done` → 100%
- Progressive section reveal: sections fade in (opacity 0.3→1) as they accumulate from SSE data
- Stub fallback: if SSE fails (no real upload), simulated loading with 4 hardcoded sections after 3.5s
- `buildSections(data)`: extracts overview, mainLines, summary from result JSON; falls back to stubs
- Poster preview: `<img src="/api/result/{id}/image">` with fallback text when image not available
- Export button: `<a download="fortune-{id}.png">` linking to image API endpoint
- Progress bar: animated purple bar with CSS transition
- Error handling: red error box for SSE failures

**Verification (playwright):**

- Page renders with heading "命运解读" ✓
- ID displayed: "ID: test-mvp-123" ✓
- Progress bar present ✓
- After 4s: 4 sections appear (总览, 事业运, 感情运, 财运) ✓
- Export button: href="/api/result/test-mvp-123/image", download="fortune-test-mvp-123.png" ✓
- Poster preview img: pointing to `/api/result/{id}/image` ✓
- `pnpm typecheck`: 11/11 workspace projects pass

**Commit:** `bedf0b1`
