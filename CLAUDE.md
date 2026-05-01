# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

赛博玄学馆 (CyberOracle) — AI-powered fortune telling companion. Monorepo with Web (Next.js) + Desktop (Tauri 2.0) + shared cloud API.

## Required Tooling

- Node ≥ 22, pnpm ≥ 9, Rust ≥ 1.82 (desktop only). Enforced by `scripts/check-versions.mjs` (runs on `postinstall`) and `engines` in root `package.json`.
- `preinstall` blocks `npm` / `yarn` via `only-allow pnpm`.

## Directory Structure

```
cyberoracle/
├── apps/web/              # Next.js 14 (port 3000)
├── apps/server/           # Next.js Route Handlers (port 3001), source under src/
├── apps/desktop/          # Tauri 2.0 + Vite + React (port 1420)
│   └── src-tauri/         # Rust backend
├── packages/core/         # Prompts, Zod schemas, content safety, fallbacks
├── packages/poster/       # Satori long-image templates (React JSX → SVG → PNG)
├── packages/ui/           # Cross-platform React components (CrystalBall, Live2D)
├── packages/tokens/       # Design tokens (+ Tailwind preset)
└── docs/                  # PRD, technical specs, milestone snapshots
```

## Development Commands

```bash
pnpm dev              # All apps (turbo, concurrency 20)
pnpm dev:web          # Web + Server
pnpm dev:desktop      # Desktop + Server
pnpm dev:server       # Server only
pnpm build            # Build all
pnpm lint             # ESLint across packages
pnpm typecheck        # tsc --noEmit across packages
pnpm test             # Vitest (core, poster, ui, tokens, server)
pnpm test:e2e         # Playwright (web)
pnpm format           # Prettier write
pnpm clean            # Remove build artifacts
pnpm fonts:prepare    # Subset Noto Serif SC fonts
```

### Running a single test

- Vitest (any package with `test`): `pnpm --filter @cyberoracle/core test -- path/to/file.test.ts -t "case name"` (use `--run` for one-shot, `--watch` for TDD).
- Playwright (web): `pnpm --filter @cyberoracle/web test:e2e -- --grep "title substring"` or pass a spec path.

## Engineering Conventions

### Packages are NOT pre-compiled

`packages/*` export TypeScript source directly (`main: "./src/index.ts"`). Consumers compile on the fly:

- `apps/web` and `apps/server`: Next.js `transpilePackages` (`apps/web/next.config.mjs`).
- `apps/desktop`: Vite `resolve.alias` pointing at `packages/*/src` (`apps/desktop/vite.config.ts`).
- TS itself: `paths` in `tsconfig.base.json`.

Never add a `build` step running `tsc` to `packages/*`. The no-op `build:dev` script in each package exists so Turbo can sequence non-persistent tasks via `^build:dev` (see `turbo.json`); leave it alone.

### React 18 is locked

`pnpm.overrides` and the workspace catalog both pin React 18. Do not upgrade to 19 without explicit team decision — R3F, pixi-live2d-display, and satori are all React-version sensitive.

### pnpm catalog for shared deps

Use `catalog:` for shared versions in sub-packages (see `pnpm-workspace.yaml`):

```json
{ "react": "catalog:", "zod": "catalog:", "typescript": "catalog:" }
```

### TypeScript strict mode

`tsconfig.base.json` enables `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`. `arr[i]` is `T | undefined` — always check.

### Rust conventions (Tauri 2.0)

- Indent: 4 spaces.
- Commands live in `src-tauri/src/commands/`, use `#[tauri::command]`, return `Result<T, String>`.
- Emit events via `window.emit()`, not direct IPC.

### Prompt engineering

Prompts live in `packages/core/prompts/*.md` with YAML frontmatter, body split on `---USER---`. Loaded by `packages/core/src/prompts/loader.ts`:

- `loadPrompt(name)` → `{ meta, system, userTemplate }`; use `fillTemplate(tpl, vars)` for `{{var}}` substitution.
- `expandIncludes(text)` resolves `<<include:foo>>` tokens against `prompts/_shared/foo.md`.
- `loadJsonPrompt(name)` parses `## key` + fenced ```json blocks (used for `fallback-soft.md`).

Never inline prompts as TS string constants.

## Server Architecture (`apps/server/src/`)

Route handlers under `app/api/{upload,analyze,result/[id],result/[id]/image,daily,health}/route.ts`. Reading flow is orchestrated by `services/reading-service.ts`: two-phase **VLM observation → streaming LLM interpretation**, both validated against Zod schemas from `@cyberoracle/core`, content-safety check before returning. VLM and LLM provider wiring lives in `lib/vlm-client.ts` and `lib/llm-stream-client.ts` — check those for the active model chain rather than assuming.

## Testing Strategy

- `packages/core` + `packages/poster`: Vitest, TDD discipline (write the test first).
- `apps/server`: Vitest (`pnpm --filter @cyberoracle/server test`).
- `apps/web`: Playwright E2E after implementation.
- `apps/desktop`: no test runner; verify via `pnpm tauri:dev` / manual run.

## Prohibitions

- Never run `npm install` or `yarn install` — `pnpm` only.
- Never add a `tsc --build` step to `packages/*`.
- Never upgrade React past 18.x without explicit discussion.
- Never commit `.env`, `.env.local`, `*.key`, `*.pem`, `*.p12`.
- Never bypass the `only-allow pnpm` preinstall check.

## Key Design Decisions

- **satori for posters**: shared JSX templates render to SVG → PNG on both web and desktop.
- **LLM keys server-side only**: desktop calls the cloud proxy; never embeds API keys.
- **Device JWT for auth**: no user accounts; device fingerprint + JWT for desktop clients.
- **AES-256-GCM**: desktop history encrypted with a key stored in the OS keychain.
