# CyberOracle Development Harness Skill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Claude Code skill that orchestrates incremental, milestone-by-milestone development of the CyberOracle monorepo using Anthropic's harness patterns.

**Architecture:** 2-agent harness (initializer + coder) invoked per-milestone via `/cyberoracle-harness M2`. The initializer generates a feature list from existing project docs; the coding agent implements one feature per session with TDD for core/poster packages and Playwright for web/desktop apps. Runtime patterns from Managed Agents article are included as a reference section.

**Tech Stack:** Claude Code skill (Markdown + frontmatter), JSON for feature lists, Bash for init scripts.

---

## File Structure

```
.claude/skills/cyberoracle-harness/
├── skill.md                        # Main skill: frontmatter + initializer + coder prompts
├── templates/
│   ├── feature-list.json           # JSON schema + sample M2 feature list (15 features)
│   ├── init-sh.sh                  # Template: per-milestone dev server launcher
│   └── progress.md                 # Template: session log format
└── references/
    └── runtime-patterns.md         # Managed Agents patterns adapted for CyberOracle pipelines
```

Each file has one clear responsibility:

- `skill.md` — Agent prompts, discipline rules, evaluation criteria, all orchestration logic
- `templates/feature-list.json` — The JSON schema contract + a working example for M2
- `templates/init-sh.sh` — Shell script template the initializer customizes per milestone
- `templates/progress.md` — Markdown template for cross-session context handoff
- `references/runtime-patterns.md` — Implementation patterns the coder reads when building pipelines

---

### Task 1: Create skill directory structure

**Files:**

- Create: `.claude/skills/cyberoracle-harness/` (directory)
- Create: `.claude/skills/cyberoracle-harness/templates/` (directory)
- Create: `.claude/skills/cyberoracle-harness/references/` (directory)

- [ ] **Step 1: Create directories**

```bash
mkdir -p .claude/skills/cyberoracle-harness/templates
mkdir -p .claude/skills/cyberoracle-harness/references
```

- [ ] **Step 2: Verify structure**

```bash
find .claude/skills/cyberoracle-harness -type d
```

Expected:

```
.claude/skills/cyberoracle-harness
.claude/skills/cyberoracle-harness/templates
.claude/skills/cyberoracle-harness/references
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/cyberoracle-harness/
git commit -m "chore: scaffold cyberoracle-harness skill directory structure"
```

---

### Task 2: Write the runtime patterns reference

**Files:**

- Create: `.claude/skills/cyberoracle-harness/references/runtime-patterns.md`

This task comes first because the main skill references this file — writing it first means no forward references.

- [ ] **Step 1: Create runtime-patterns.md**

Write the following content to `.claude/skills/cyberoracle-harness/references/runtime-patterns.md`:

```markdown
# Runtime Pipeline Patterns for CyberOracle

Patterns derived from Anthropic's "Managed Agents: Decoupling the Brain from the Hands" article, adapted for CyberOracle's LLM pipeline architecture. The coding agent reads this reference when implementing SSE endpoints, LLM proxy routes, and desktop command handlers.

---

## Pattern 1: Session as Append-Only Log

Each multi-step LLM pipeline (palm reading, face reading, daily fortune, quick ask) writes progress to a status file as it executes. This file acts as an append-only session log.

**Implementation:**
```

/results/{id}.status ← Server-side status log

````

Status file format (one JSON object per line, appended after each step):

```json
{"step":"upload","status":"done","ts":"2026-04-28T10:00:00Z","data":{"imageId":"abc123"}}
{"step":"vlm_observe","status":"running","ts":"2026-04-28T10:00:05Z"}
{"step":"vlm_observe","status":"done","ts":"2026-04-28T10:00:12Z","data":{"observation":"..."}}
{"step":"llm_interpret","status":"running","ts":"2026-04-28T10:00:13Z"}
````

**Recovery:** If the pipeline crashes mid-step, the recovery logic reads the last line with `status:"running"` and retries that step. No step runs twice with `status:"done"`.

**Where to apply:**

- `apps/server/app/api/analyze/route.ts` — SSE streaming endpoint
- `apps/desktop/src-tauri/src/commands/analyze_stream.rs` — Rust-side LLM orchestration
- `apps/server/app/api/quick-ask/route.ts` — Quick ask SSE endpoint

---

## Pattern 2: Brain/Hand Separation for LLM Calls

Decouple the orchestration logic ("brain") from individual LLM API calls ("hands"). Each LLM call is a named operation with typed input/output. The orchestrator handles retry, timeout, and error propagation.

**Implementation pattern (TypeScript, server-side):**

```typescript
type Step<I, O> = {
  name: string;
  execute: (input: I) => Promise<O>;
  timeout: number; // ms
  retries: number;
};

async function runPipeline<T>(
  steps: Step<any, any>[],
  initialInput: T,
): Promise<T> {
  let current = initialInput;
  for (const step of steps) {
    current = await withRetry(() => step.execute(current), {
      timeout: step.timeout,
      retries: step.retries,
      stepName: step.name,
    });
  }
  return current;
}
```

**Where to apply:**

- Two-phase prompt pipeline: VLM observation → LLM interpretation
- Daily fortune pipeline: date calculation → LLM generation → safety check
- Desktop companion greeting: personality selection → LLM generation → TTS dispatch

---

## Pattern 3: Progress Event Emission

Both server (SSE to browser) and desktop (Tauri events to webview) emit structured progress events so the frontend can display pipeline stage transitions.

**Event schema:**

```typescript
type PipelineEvent = {
  step:
    | 'vlm_observe'
    | 'llm_interpret'
    | 'poster_render'
    | 'safety_check'
    | 'complete';
  status: 'running' | 'done' | 'error';
  data?: unknown;
  error?: string;
};
```

**Server-side (SSE):**

```typescript
// Each chunk sent to the client includes step context
res.write(
  `data: ${JSON.stringify({ step: 'vlm_observe', status: 'running' })}\n\n`,
);
```

**Desktop-side (Tauri):**

```rust
window.emit("analyze:chunk", PipelineEvent { step: "vlm_observe", status: "running", ..Default::default() })?;
```

**Where to apply:**

- `apps/server` — All SSE endpoints
- `apps/desktop/src-tauri/src/commands/analyze_stream.rs` — Window emit calls
- Frontend components that render pipeline progress (StreamingPoster, CrystalBall animations)

---

## Pattern 4: Retry with Degraded Fallback

LLM calls follow a primary → fallback → ultimate fallback chain. Each retry is logged to the status file. The pipeline never hard-fails on a single LLM provider outage.

**Fallback chain (from PRD §4.4):**

```
Primary:   通义千问 VL-Max (vision), DeepSeek V3 (text)
Fallback:  GLM-4V (vision), GLM-4 (text)
Ultimate:  GPT-4o (vision), GPT-4o-mini (text)
```

**Implementation pattern:**

```typescript
async function callLLMWithFallback(
  providers: LLMProvider[],
  prompt: string,
  options: LLMOptions,
): Promise<LLMResponse> {
  let lastError: Error | null = null;
  for (const provider of providers) {
    try {
      const result = await provider.call(prompt, options);
      logStatus(`llm_${provider.name}`, 'done', { provider: provider.name });
      return result;
    } catch (err) {
      lastError = err as Error;
      logStatus(`llm_${provider.name}`, 'error', { error: String(err) });
    }
  }
  throw lastError;
}
```

**Where to apply:**

- `apps/server` LLM proxy layer — all `/api/analyze`, `/api/daily`, `/api/quick-ask` routes
- Client-side error handling — display "service degraded" when fallback is active

````

- [ ] **Step 2: Verify file is readable**

```bash
wc -l .claude/skills/cyberoracle-harness/references/runtime-patterns.md
````

Expected: ~130 lines

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/cyberoracle-harness/references/runtime-patterns.md
git commit -m "feat(harness): add runtime pipeline patterns reference"
```

---

### Task 3: Write the templates (feature-list, init-sh, progress)

**Files:**

- Create: `.claude/skills/cyberoracle-harness/templates/feature-list.json`
- Create: `.claude/skills/cyberoracle-harness/templates/init-sh.sh`
- Create: `.claude/skills/cyberoracle-harness/templates/progress.md`

- [ ] **Step 1: Create feature-list.json template with M2 sample**

Write the following content to `.claude/skills/cyberoracle-harness/templates/feature-list.json`:

```json
{
  "_comment": "Feature list template. The initializer agent generates this per-milestone by reading the relevant docs/*.md sections. Categories: core|poster|web|desktop|server. testStrategy: unit (TDD for packages/core,packages/poster) | playwright (E2E for apps/web,apps/desktop) | manual (human review). priority: lower = higher priority. dependsOn: feature IDs that must pass first.",
  "milestone": "M2",
  "milestoneTitle": "Web 端 MVP",
  "sourceDocs": [
    "docs/PRD.md §4.1 (Web tech stack)",
    "docs/PRD.md §7 (Prompt engineering)",
    "docs/PRD.md §8 (Poster templates)",
    "docs/PRD.md §9 (API specs)",
    "docs/5完整Prompt文件.md (Prompt file library)",
    "docs/2satori长图组件.md (Poster rendering)"
  ],
  "features": [
    {
      "id": "M2-001",
      "category": "core",
      "description": "Zod schema for PalmReadingResult — defines the structured output contract for palm reading VLM+LLM pipeline",
      "testStrategy": "unit",
      "acceptanceSteps": [
        "Create packages/core/src/schemas/palm-reading.ts with Zod schema",
        "Schema validates a sample PalmReadingResult JSON without errors",
        "Schema rejects a malformed JSON (missing required field) with descriptive error",
        "Export schema from packages/core/src/schemas/index.ts"
      ],
      "priority": 1,
      "dependsOn": [],
      "passes": false
    },
    {
      "id": "M2-002",
      "category": "core",
      "description": "Zod schema for FaceReadingResult — defines the structured output contract for face reading pipeline",
      "testStrategy": "unit",
      "acceptanceSteps": [
        "Create packages/core/src/schemas/face-reading.ts with Zod schema",
        "Schema validates a sample FaceReadingResult JSON without errors",
        "Schema rejects a malformed JSON with descriptive error",
        "Export schema from packages/core/src/schemas/index.ts"
      ],
      "priority": 2,
      "dependsOn": [],
      "passes": false
    },
    {
      "id": "M2-003",
      "category": "core",
      "description": "Prompt loader — reads .md files from packages/core/prompts/, parses frontmatter, injects variables",
      "testStrategy": "unit",
      "acceptanceSteps": [
        "loadPrompt('vision-observe-palm') returns { meta, system, userTemplate }",
        "fillTemplate(template, { ganzhi: '甲子' }) replaces {{ganzhi}} with '甲子'",
        "Missing variable leaves {{key}} unchanged in template",
        "Frontmatter fields (version, targetModel, temperature) parse correctly"
      ],
      "priority": 3,
      "dependsOn": [],
      "passes": false
    },
    {
      "id": "M2-004",
      "category": "core",
      "description": "Content safety module — keyword blacklist for filtering LLM outputs",
      "testStrategy": "unit",
      "acceptanceSteps": [
        "checkContent('safe text') returns { safe: true }",
        "checkContent('text with 健康建议 keyword') returns { safe: false, matched: ['健康建议'] }",
        "Blacklist loaded from packages/core/src/content-safety/blacklist.json",
        "Export from packages/core/src/content-safety/index.ts"
      ],
      "priority": 4,
      "dependsOn": [],
      "passes": false
    },
    {
      "id": "M2-005",
      "category": "poster",
      "description": "PalmReadingPoster React component — JSX template for hand reading long image",
      "testStrategy": "unit",
      "acceptanceSteps": [
        "Component renders without errors given sample PalmReadingResult data",
        "Snapshot test: rendered output matches golden image (pixel diff < 1%)",
        "Template includes sections: personality, career, love, health summaries",
        "Right-bottom watermark area is present"
      ],
      "priority": 5,
      "dependsOn": ["M2-001"],
      "passes": false
    },
    {
      "id": "M2-006",
      "category": "poster",
      "description": "FaceReadingPoster React component — JSX template for face reading long image",
      "testStrategy": "unit",
      "acceptanceSteps": [
        "Component renders without errors given sample FaceReadingResult data",
        "Snapshot test: rendered output matches golden image (pixel diff < 1%)",
        "Template includes sections matching face reading categories",
        "Right-bottom watermark area is present"
      ],
      "priority": 6,
      "dependsOn": ["M2-002"],
      "passes": false
    },
    {
      "id": "M2-007",
      "category": "poster",
      "description": "Server-side render pipeline — satori + resvg-js to convert JSX templates to PNG",
      "testStrategy": "unit",
      "acceptanceSteps": [
        "renderToPng(PalmReadingPoster, sampleData) returns a Buffer of valid PNG",
        "Output PNG width matches design spec (1080px)",
        "Chinese text renders correctly (思源宋体 subset loaded)",
        "Error on missing font file is caught with descriptive message"
      ],
      "priority": 7,
      "dependsOn": ["M2-005", "M2-006"],
      "passes": false
    },
    {
      "id": "M2-008",
      "category": "server",
      "description": "POST /api/upload — accepts image upload, validates type/size, saves to disk, returns id",
      "testStrategy": "playwright",
      "acceptanceSteps": [
        "POST with valid image (WebP, <8MB) returns { id: string }",
        "POST with oversized image returns 413",
        "POST with non-image returns 415",
        "File saved to /storage/uploads/{id}.webp",
        "Metadata saved to /storage/uploads/{id}.meta.json"
      ],
      "priority": 8,
      "dependsOn": [],
      "passes": false
    },
    {
      "id": "M2-009",
      "category": "server",
      "description": "GET /api/analyze (SSE) — streams VLM observation + LLM interpretation chunks",
      "testStrategy": "playwright",
      "acceptanceSteps": [
        "SSE connection established, first chunk arrives within 5s",
        "Chunks arrive in order: vlm_observe → llm_interpret → complete",
        "Each chunk has valid PipelineEvent schema { step, status, data }",
        "Connection survives 30+ seconds without timeout",
        "Result JSON saved to /storage/results/{id}.json"
      ],
      "priority": 9,
      "dependsOn": ["M2-001", "M2-003", "M2-004", "M2-008"],
      "passes": false
    },
    {
      "id": "M2-010",
      "category": "server",
      "description": "POST /api/render-image — generates long image PNG from result JSON",
      "testStrategy": "playwright",
      "acceptanceSteps": [
        "POST with valid result id returns PNG response",
        "POST with nonexistent id returns 404",
        "PNG file saved to /storage/results/{id}.png",
        "GET /api/result/:id returns the JSON result",
        "GET /api/result/:id/image returns the PNG file"
      ],
      "priority": 10,
      "dependsOn": ["M2-007", "M2-009"],
      "passes": false
    },
    {
      "id": "M2-011",
      "category": "web",
      "description": "Home page with crystal ball interaction — 3D scene with upload entry point",
      "testStrategy": "playwright",
      "acceptanceSteps": [
        "Page loads with LCP ≤ 2.5s",
        "Crystal ball renders (react-three-fiber canvas present in DOM)",
        "Upload trigger visible and clickable after crystal ball animation",
        "Page is responsive: mobile 375px, desktop 1440px"
      ],
      "priority": 11,
      "dependsOn": [],
      "passes": false
    },
    {
      "id": "M2-012",
      "category": "web",
      "description": "Image upload page — drag-and-drop + file picker for palm/face photos",
      "testStrategy": "playwright",
      "acceptanceSteps": [
        "Drag-and-drop zone accepts image files",
        "File picker opens on click",
        "Preview of selected image shown before upload",
        "Upload button triggers POST /api/upload",
        "Redirect to /result/:id after successful upload"
      ],
      "priority": 12,
      "dependsOn": ["M2-008", "M2-011"],
      "passes": false
    },
    {
      "id": "M2-013",
      "category": "web",
      "description": "Result page — streaming result display with poster preview and export",
      "testStrategy": "playwright",
      "acceptanceSteps": [
        "SSE connection to /api/analyze streams progress updates",
        "Loading animation plays during streaming (crystal ball + progress bar)",
        "Result sections appear incrementally as chunks arrive",
        "Poster preview renders after analysis completes",
        "Export button downloads PNG file"
      ],
      "priority": 13,
      "dependsOn": ["M2-009", "M2-010", "M2-011"],
      "passes": false
    },
    {
      "id": "M2-014",
      "category": "web",
      "description": "History page — displays recent readings stored in IndexedDB (max 20)",
      "testStrategy": "playwright",
      "acceptanceSteps": [
        "Page shows list of past readings with date, type, and thumbnail",
        "Click on a reading navigates to /result/:id",
        "Empty state shows helpful message",
        "IndexedDB stores reading metadata via Dexie.js"
      ],
      "priority": 14,
      "dependsOn": ["M2-013"],
      "passes": false
    },
    {
      "id": "M2-015",
      "category": "web",
      "description": "End-to-end flow: upload → analyze → render → export — full user journey",
      "testStrategy": "playwright",
      "acceptanceSteps": [
        "Navigate to home page",
        "Click upload entry point",
        "Upload a sample palm image",
        "Wait for analysis to complete (SSE streaming visible)",
        "View result on result page",
        "Click export to download PNG",
        "Navigate to history, verify reading appears in list"
      ],
      "priority": 15,
      "dependsOn": ["M2-011", "M2-012", "M2-013", "M2-014"],
      "passes": false
    }
  ]
}
```

- [ ] **Step 2: Create init-sh.sh template**

Write the following content to `.claude/skills/cyberoracle-harness/templates/init-sh.sh`:

```bash
#!/usr/bin/env bash
# init.sh — Starts dev servers for the current milestone.
# Generated by cyberoracle-harness initializer. Customize per-milestone.
set -e

echo "▶ Starting CyberOracle dev environment..."

# Kill any existing processes on our ports
kill_port() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
  elif command -v netstat >/dev/null 2>&1; then
    pid=$(netstat -ano 2>/dev/null | grep ":$port " | grep LISTENING | awk '{print $5}' | head -1)
    [ -n "$pid" ] && taskkill //F //PID "$pid" 2>/dev/null || true
  fi
}

# --- Milestone-specific servers ---
# Uncomment/modify based on current milestone:

# M1, M2, M3: Web + Server
# kill_port 3000; kill_port 3001
# echo "▶ Starting web (port 3000) + server (port 3001)..."
# pnpm dev:web &

# M4, M5: Desktop + Server
# kill_port 3001; kill_port 1420
# echo "▶ Starting server (port 3001) + desktop (port 1420)..."
# pnpm dev:server &
# sleep 3
# pnpm --filter @cyberoracle/desktop tauri:dev &

echo "✓ Dev environment ready. Press Ctrl+C to stop all servers."
wait
```

- [ ] **Step 3: Create progress.md template**

Write the following content to `.claude/skills/cyberoracle-harness/templates/progress.md`:

```markdown
# CyberOracle Development Progress

## Milestone: {milestone_id} — {milestone_title}

**Started:** {date}
**Source docs:** {source_docs_list}

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

| Feature            | Status | Session |
| ------------------ | ------ | ------- | --------- | --- |
| <!-- Auto-updated: | M2-001 | ✅ Pass | Session 1 | --> |
```

- [ ] **Step 4: Verify all templates exist**

```bash
ls -la .claude/skills/cyberoracle-harness/templates/
```

Expected: 3 files — `feature-list.json`, `init-sh.sh`, `progress.md`

- [ ] **Step 5: Validate feature-list.json is valid JSON**

```bash
node -e "const f=require('./.claude/skills/cyberoracle-harness/templates/feature-list.json'); console.log('Milestone:', f.milestone, '| Features:', f.features.length)"
```

Expected: `Milestone: M2 | Features: 15`

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/cyberoracle-harness/templates/
git commit -m "feat(harness): add templates — feature list schema, init.sh, progress.md"
```

---

### Task 4: Write the main skill.md

**Files:**

- Create: `.claude/skills/cyberoracle-harness/skill.md`

This is the core of the harness. It contains the frontmatter, initializer prompt, coding agent prompt, evaluation criteria, and discipline rules.

- [ ] **Step 1: Create skill.md**

Write the following content to `.claude/skills/cyberoracle-harness/skill.md`:

```markdown
---
name: cyberoracle-harness
description: Drive incremental development of CyberOracle milestones M1-M7. Invoked per-milestone with a milestone ID (e.g. /cyberoracle-harness M2). Sets up feature lists, progress tracking, and implements features one at a time with built-in verification.
---

# CyberOracle Development Harness

You are the CyberOracle development harness — an agent system that drives incremental, milestone-by-milestone development of the CyberOracle monorepo (赛博玄学馆). You follow Anthropic's proven harness patterns for long-running autonomous coding.

## Invocation

The user invokes this skill with a milestone ID as argument: `/cyberoracle-harness M1` through `/cyberoracle-harness M7`.

**Routing logic:**

1. Check if `feature_list.json` exists in the project root
2. If it does NOT exist → run the **Initializer** workflow
3. If it DOES exist → run the **Coding Agent** workflow

---

## PART A: Initializer Agent

You are the initializer agent. Your job is to read the project's existing documentation, decompose the milestone into a structured feature list, and generate supporting artifacts. You write NO application code.

### Step 1: Identify milestone scope

Read the argument to determine which milestone. Map it to source documents:

| Milestone                     | Source Documents                                                             |
| ----------------------------- | ---------------------------------------------------------------------------- |
| M1 共享基建                   | `docs/1Monorepo工程骨架.md` + PRD §3.2                                       |
| M2 Web 端 MVP                 | PRD §4.1, §7, §8, §9 + `docs/5完整Prompt文件.md` + `docs/2satori长图组件.md` |
| M3 云端代理 + 鉴权            | PRD §4.4, §9, §13                                                            |
| M4 Tauri 客户端骨架           | `docs/4Tauri项目骨架.md` + PRD §5                                            |
| M5 桌面伙伴 Live2D            | PRD §5.2 + `docs/3Live2D集成完整示例.md`                                     |
| M6 加密 + 自动更新 + 打包签名 | PRD §5.4, §13.2                                                              |
| M7 转化漏斗 + 灰度            | PRD §6                                                                       |

PRD is at `docs/PRD.md`.

### Step 2: Read the source documents

Read each listed document section carefully. You need to understand:

- What features the milestone requires
- What technical components are involved
- What dependencies exist between components
- What the acceptance criteria are (from the spec)

### Step 3: Generate feature_list.json

Read the template at `.claude/skills/cyberoracle-harness/templates/feature-list.json` for the schema.

Generate a feature list following these rules:

**Feature decomposition principles:**

- Each feature is a single, testable unit of work
- Features should take 5-30 minutes for a skilled developer to implement
- Features have clear dependencies (what must be done first)
- Categories: `core` (packages/core), `poster` (packages/poster), `server` (apps/server), `web` (apps/web), `desktop` (apps/desktop)
- testStrategy: `unit` for core/poster features, `playwright` for web/desktop/server features, `manual` only when neither applies

**Priority ordering:**

- Priority 1-5: Foundation features (schemas, loaders, safety modules)
- Priority 6-10: Core features (prompt files, poster templates, render pipeline)
- Priority 11-15: Integration features (API endpoints, pages, flows)
- Priority 16+: Polish features (performance, edge cases, error handling)

**Acceptance steps must be specific and verifiable:**

- For `unit` strategy: name the test file, describe the assertion
- For `playwright` strategy: describe exact user actions and expected outcomes
- Never write vague steps like "verify it works"

**CRITICAL CONSTRAINT:** You are the initializer. You NEVER write application code. You only generate these three files:

1. `feature_list.json` — The feature decomposition
2. `init.sh` — Dev server launcher for this milestone
3. `progress.md` — Initial progress tracking file

### Step 4: Generate init.sh

Read the template at `.claude/skills/cyberoracle-harness/templates/init-sh.sh`.

Customize it for this milestone:

- M1, M2, M3: Uncomment the web+server block (ports 3000+3001)
- M4, M5: Uncomment the desktop+server block (ports 3001+1420)
- M6, M7: Use web+server block (testing packaging and deployment)

### Step 5: Generate progress.md

Read the template at `.claude/skills/cyberoracle-harness/templates/progress.md`.

Fill in:

- `{milestone_id}` → e.g. "M2"
- `{milestone_title}` → e.g. "Web 端 MVP"
- `{date}` → today's date
- `{source_docs_list}` → the source documents for this milestone

### Step 6: Write the three files

Write `feature_list.json`, `init.sh`, and `progress.md` to the project root.

### Step 7: Summary

Report to the user:

- How many features were generated
- The dependency chain (which features depend on which)
- Suggested invocation: "Run `/cyberoracle-harness M2` again to start the coding agent"

---

## PART B: Coding Agent

You are the coding agent. Your job is to make incremental progress on one feature per session, leaving the environment in a clean, committable state.

### Session Startup (EVERY session, in this exact order)

You MUST perform these steps before writing any code:

1. **`pwd`** — Confirm you are in the project root directory.
2. **Read `progress.md`** — Understand what happened in prior sessions.
3. **Read `feature_list.json`** — Find the highest-priority feature where `passes: false` and all `dependsOn` features have `passes: true`.
4. **Run `bash init.sh`** in the background — Start dev servers for this milestone.
5. **Smoke test** — If this is M2+, open the browser to `http://localhost:3000` and verify the app loads. If it doesn't, fix the basic environment before implementing new features.

### Feature Implementation

Once you've completed the startup sequence, implement ONE feature following its testStrategy:

**If testStrategy is `"unit"` (TDD — for packages/core, packages/poster):**

1. Write a failing test that exercises the acceptance steps
2. Run the test to confirm it fails
3. Write the minimum implementation to make it pass
4. Run the test suite to confirm it passes
5. Refactor if needed
6. Run the full test suite one final time

**If testStrategy is `"playwright"` (E2E — for apps/web, apps/desktop, apps/server):**

1. Implement the feature
2. Ensure dev server is running
3. Use Playwright browser tools to verify each acceptance step
4. Fix any failures found during verification
5. Re-verify after fixes

**If testStrategy is `"manual"`:**

1. Implement the feature
2. Document what was done and what needs human review

### Session End (EVERY session)

After implementing (or attempting) a feature:

1. **If verification passed:** Update `feature_list.json` — set the feature's `passes` to `true`
2. **If verification failed or feature was too large:** Keep `passes` as `false`. Note what was accomplished and what remains in `progress.md`
3. **Commit** with message format: `[M{X}-{id}] {description}`
4. **Update `progress.md`** — Append a session entry with: date, feature id, what was done, what failed, verification results
5. **STOP.** Do NOT start the next feature. One feature per session.

### Discipline Rules (NEVER violate these)

1. **One feature per session.** Stop after implementing and verifying one feature. This prevents the "try to do too much at once" failure mode.
2. **Never remove or edit features.** You can ONLY change `passes` from `false` to `true`. It is UNACCEPTABLE to remove features, edit descriptions, or modify acceptance steps. This prevents declaring victory by deleting work.
3. **Leave environment clean.** Every session ends with a clean git state — no half-implemented features left in working tree. If you get stuck, `git checkout` to revert to last good commit and note the failure in `progress.md`.
4. **JSON for feature list.** Do not convert `feature_list.json` to another format. JSON is used because models are less likely to inappropriately edit structured JSON.
5. **Oversized features.** If a feature is too large to complete in one session, commit partial progress, keep `passes: false`, and document remaining work in `progress.md`. The next session will continue.

### Evaluation Criteria

When verifying features, apply these project-specific checks:

| Criterion            | Applies to      | Threshold                                   |
| -------------------- | --------------- | ------------------------------------------- |
| Schema compliance    | packages/core   | Zod validation passes on all sample outputs |
| Content safety       | packages/core   | No output triggers keyword blacklist        |
| Render correctness   | packages/poster | Snapshot matches golden (pixel diff < 1%)   |
| SSE streaming        | apps/server     | Chunks ordered, connection survives 30s+    |
| Performance budget   | apps/web        | LCP ≤ 2.5s, JS gzip ≤ 220KB                 |
| Type safety          | All             | `pnpm typecheck` passes with zero errors    |
| Cross-platform build | apps/desktop    | `cargo build` succeeds on all 4 targets     |

### Runtime Patterns

When implementing SSE endpoints, LLM proxy routes, or desktop command handlers, read `.claude/skills/cyberoracle-harness/references/runtime-patterns.md` and apply its patterns:

- Session as append-only log
- Brain/hand separation for LLM calls
- Progress event emission
- Retry with degraded fallback

### Context Management

- Use Claude Code's built-in compaction for within-session context growth
- `progress.md` + `feature_list.json` + `git log` provide full cross-session recovery
- No explicit context resets needed
```

- [ ] **Step 2: Verify skill.md is readable and well-formed**

```bash
head -5 .claude/skills/cyberoracle-harness/skill.md
wc -l .claude/skills/cyberoracle-harness/skill.md
```

Expected: Frontmatter starts with `---`, total ~200 lines

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/cyberoracle-harness/skill.md
git commit -m "feat(harness): add main skill.md with initializer + coding agent prompts"
```

---

### Task 5: Register the skill in project settings

**Files:**

- Modify: `.claude/settings.local.json`

The skill needs to be discoverable by Claude Code. We register it in the project's local settings.

- [ ] **Step 1: Read current settings**

Read `.claude/settings.local.json` to understand the current structure.

- [ ] **Step 2: Add skill registration**

Add a `skills` entry pointing to the harness skill directory. Add this to the settings:

```json
{
  "permissions": { "...": "..." },
  "skills": {
    "cyberoracle-harness": {
      "path": ".claude/skills/cyberoracle-harness/skill.md"
    }
  }
}
```

Note: If Claude Code doesn't support a `skills` key in settings, the skill can be invoked by its file path directly. The key registration is optional — the skill file itself is the authoritative source.

- [ ] **Step 3: Verify settings is valid JSON**

```bash
node -e "const s=require('./.claude/settings.local.json'); console.log('Valid JSON. Permissions:', Object.keys(s.permissions).length, 'entries')"
```

Expected: Valid JSON with no errors

- [ ] **Step 4: Commit**

```bash
git add .claude/settings.local.json
git commit -m "chore(harness): register cyberoracle-harness skill in project settings"
```

---

### Task 6: Validate the harness end-to-end

**Files:**

- No new files — validation only

- [ ] **Step 1: Verify skill files are all present**

```bash
find .claude/skills/cyberoracle-harness -type f | sort
```

Expected output:

```
.claude/skills/cyberoracle-harness/references/runtime-patterns.md
.claude/skills/cyberoracle-harness/skill.md
.claude/skills/cyberoracle-harness/templates/feature-list.json
.claude/skills/cyberoracle-harness/templates/init-sh.sh
.claude/skills/cyberoracle-harness/templates/progress.md
```

- [ ] **Step 2: Validate feature-list.json structure**

```bash
node -e "
const f = require('./.claude/skills/cyberoracle-harness/templates/feature-list.json');
const required = ['milestone','milestoneTitle','sourceDocs','features'];
const missing = required.filter(k => !f[k]);
if (missing.length) { console.error('Missing:', missing); process.exit(1); }
const featureFields = ['id','category','description','testStrategy','acceptanceSteps','priority','dependsOn','passes'];
const badFeatures = f.features.filter(ft => {
  const fm = featureFields.filter(k => ft[k] === undefined);
  return fm.length > 0;
});
if (badFeatures.length) { console.error('Bad features:', badFeatures.map(f=>f.id)); process.exit(1); }
console.log('✓', f.features.length, 'features for', f.milestone, '- all valid');
"
```

Expected: `✓ 15 features for M2 - all valid`

- [ ] **Step 3: Validate init.sh is executable syntax**

```bash
bash -n .claude/skills/cyberoracle-harness/templates/init-sh.sh && echo "✓ init.sh syntax OK"
```

Expected: `✓ init.sh syntax OK`

- [ ] **Step 4: Validate progress.md has required sections**

```bash
grep -c "## Session Log" .claude/skills/cyberoracle-harness/templates/progress.md && grep -c "## Summary" .claude/skills/cyberoracle-harness/templates/progress.md
```

Expected: Both return `1`

- [ ] **Step 5: Verify runtime-patterns.md covers all 4 patterns**

```bash
grep -c "## Pattern" .claude/skills/cyberoracle-harness/references/runtime-patterns.md
```

Expected: `4`

- [ ] **Step 6: Verify skill.md has both agent prompts**

```bash
grep -c "PART A: Initializer Agent" .claude/skills/cyberoracle-harness/skill.md && grep -c "PART B: Coding Agent" .claude/skills/cyberoracle-harness/skill.md
```

Expected: Both return `1`

---

## Self-Review

**1. Spec coverage:**

- §2.1 File Layout → Task 1 (dirs) + Tasks 2-4 (all 5 files) ✓
- §2.2 Project-Local Artifacts → Templates in Task 3 (feature-list.json, init.sh, progress.md) ✓
- §2.3 Invocation → Skill.md routing logic in Task 4 ✓
- §3 Initializer Agent → Part A of skill.md in Task 4 ✓
- §3.1 Milestone-to-Doc Mapping → Skill.md Step 1 ✓
- §3.2 Feature List Schema → Template in Task 3 ✓
- §3.3 Constraint (no code) → Skill.md critical constraint ✓
- §4 Coding Agent → Part B of skill.md in Task 4 ✓
- §4.1 Session Startup → Skill.md startup sequence ✓
- §4.2 Feature Implementation Loop → Skill.md implementation section ✓
- §4.3 Discipline Rules → Skill.md discipline rules ✓
- §4.4 Session End Artifacts → Skill.md session end section ✓
- §4.5 Context Management → Skill.md context management section ✓
- §5 Evaluation Criteria → Skill.md evaluation criteria table ✓
- §6 Runtime Patterns → Task 2 (runtime-patterns.md) ✓
- §7 Phased Build → Phase 1 is this plan ✓
- §8 Failure Modes → Discipline rules in Task 4 ✓

**2. Placeholder scan:** No TBD/TODO found. All code blocks contain complete content.

**3. Type consistency:** Feature list schema fields (id, category, testStrategy, acceptanceSteps, priority, dependsOn, passes) are used consistently across the template (Task 3), skill.md prompts (Task 4), and validation script (Task 6).
