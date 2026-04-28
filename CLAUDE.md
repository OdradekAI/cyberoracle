# CLAUDE.md — CyberOracle Project Instructions

## Project Overview

赛博玄学馆 (CyberOracle) — AI-powered fortune telling companion. Monorepo with Web (Next.js) + Desktop (Tauri 2.0) + shared cloud API.

## Directory Structure

```
cyberoracle/
├── apps/web/           # Next.js 14 (SSR + SEO, port 3000)
├── apps/server/        # Next.js Route Handlers (LLM proxy, port 3001)
├── apps/desktop/       # Tauri 2.0 + Vite + React (port 1420)
│   └── src-tauri/      # Rust backend
├── packages/core/      # Prompts, Zod schemas, content safety
├── packages/poster/    # Satori long image templates (React JSX)
├── packages/ui/        # Cross-platform React components (CrystalBall, Live2D)
├── packages/tokens/    # Design tokens (colors, fonts, spacing)
├── scripts/            # Build utilities (check-versions, clean, prepare-fonts)
└── docs/               # PRD, technical specs, harness plans
```

## Development Commands

```bash
pnpm dev              # Start all apps
pnpm dev:web          # Web + Server only
pnpm dev:desktop      # Desktop + Server only
pnpm build            # Build all
pnpm lint             # ESLint across all packages
pnpm typecheck        # TypeScript check across all packages
pnpm test             # Vitest across all packages
pnpm clean            # Clean all build artifacts
pnpm fonts:prepare    # Subset Noto Serif SC fonts
```

## Engineering Conventions

### Packages are NOT pre-compiled

All `packages/*` export TypeScript source directly (`main: "./src/index.ts"`). Consumers (Next.js transpilePackages, Vite resolve.alias) compile on the fly. Never add a `build` script that runs `tsc` to packages.

### React 18 is locked

`pnpm.overrides` and `pnpm.catalog` both pin React 18. Never upgrade to React 19 without explicit team decision. This is because R3F, pixi-live2d-display, and satori are all sensitive to React version.

### pnpm catalog for shared deps

Use `catalog:` for dependency versions in sub-packages:

```json
{ "react": "catalog:", "zod": "catalog:", "typescript": "catalog:" }
```

### TypeScript strict mode

`tsconfig.base.json` enables `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`. All `arr[i]` returns `T | undefined` — always check bounds.

### Rust conventions (Tauri 2.0)

- Indent: 4 spaces (not 2)
- Tauri commands are in `src-tauri/src/commands/`
- Use `tauri::command` macro, return `Result<T, String>`
- Emit events via `window.emit()`, not direct IPC

### Prompt engineering

Prompts are `.md` files in `packages/core/prompts/` with YAML frontmatter. Loaded by `loader.ts` which parses frontmatter and splits on `---USER---`. Never inline prompts as TS string constants.

## Testing Strategy

- **`packages/core` + `packages/poster`**: Unit tests with Vitest, TDD discipline (write test first)
- **`apps/web` + `apps/desktop`**: E2E verification with Playwright after implementation
- **`apps/server`**: API tests via Playwright or curl against running dev server

## Prohibitions

- Never run `npm install` or `yarn install` — use `pnpm install` only
- Never add a `tsc --build` step to `packages/*`
- Never upgrade React past 18.x without explicit discussion
- Never commit `.env`, `.env.local`, `*.key`, `*.pem`, `*.p12` files
- Never bypass `only-allow pnpm` preinstall check

## LLM Integration Patterns

Two-phase prompt pipeline: VLM observation → LLM text interpretation. All LLM output validated against Zod schemas. Content safety check (keyword blacklist) before returning to frontend. Fallback chain: 通义千问 → GLM-4V → GPT-4o.

## Key Design Decisions

- **satori for poster generation**: React JSX → SVG → PNG, shared template code across web and desktop
- **LLM API keys on server only**: Desktop client calls cloud proxy, never handles API keys directly
- **Device JWT for auth**: No user accounts, device fingerprint + JWT for desktop clients
- **AES-256-GCM encryption**: Desktop history encrypted with key stored in OS keychain
