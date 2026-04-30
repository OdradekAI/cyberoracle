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

**Commit:** `{pending}`
