<p align="center">
  <strong>CyberOracle · 赛博玄学馆</strong>
</p>

<p align="center">
  AI-powered fortune telling — palm reading, face reading & desktop companion
</p>

<p align="center">
  <a href="./README.zh.md">中文文档</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#project-structure">Structure</a> ·
  <a href="#license">License</a>
</p>

---

## About

**CyberOracle** blends traditional Chinese fortune-telling aesthetics with modern AI
to create an entertaining, personality-insight experience.

Upload a palm or face photo, receive a beautifully rendered reading card powered by
vision + language models — all wrapped in a minimal, high-end visual style.

The project ships as both a **web app** and a **desktop companion** featuring a
Live2D fortune-telling character named "Xingzi" (星子).

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web | Next.js 14 (React 18) |
| Desktop | Tauri 2.0 + Vite + React 18 |
| API Server | Next.js Route Handlers (standalone Docker) |
| AI Pipeline | VLM (vision) → LLM (writing), streamed JSON |
| Poster Rendering | satori + resvg (JSX → SVG → PNG) |
| Desktop Companion | PixiJS 6 + pixi-live2d-display |
| Styling | Tailwind CSS v3 + design tokens |
| Language | TypeScript 5.7+, Rust 1.82+ |

## Project Structure

```
cyberoracle/
├── apps/
│   ├── web/             # Next.js web app
│   ├── server/          # API server (Next.js Route Handlers)
│   └── desktop/         # Tauri desktop client (Vite + React)
├── packages/
│   ├── core/            # Prompts, schemas, business logic
│   ├── poster/          # satori poster templates
│   ├── ui/              # Shared React components
│   └── tokens/          # Design tokens
├── docs/                # Architecture documentation
├── scripts/             # Build & dev utilities
└── .github/             # CI workflows & templates
```

## Getting Started

### Prerequisites

- **Node.js** 22+ (recommended: [nvm](https://github.com/nvm-sh/nvm) or [volta](https://volta.sh))
- **pnpm** 9+ (`corepack enable && corepack prepare pnpm@9.12.0 --activate`)
- **Rust** 1.82+ (desktop builds only, [install guide](https://rustup.rs))

### Installation

```bash
git clone https://github.com/OdradekAI/cyberoracle.git
cd cyberoracle
nvm use               # switch to Node 22
pnpm install          # install all dependencies
```

### Environment Variables

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/server/.env.example apps/server/.env.local
```

### Common Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps |
| `pnpm dev:web` | Web + server only |
| `pnpm dev:desktop` | Desktop + server only |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run all tests |
| `pnpm format` | Format code with Prettier |
| `pnpm clean` | Clean build outputs & caches |

## Documentation

Detailed architecture docs are in the [`docs/`](./docs) directory (Chinese).

## Contributing

Before contributing, please open an issue to discuss the proposed change.

## License

Copyright 2026 OdradekAI

Licensed under the [Apache License, Version 2.0](./LICENSE).
See [LICENSE](./LICENSE) for the full text.

---

<p align="center">
  <sub>Built with care by <a href="https://github.com/OdradekAI">OdradekAI</a></sub>
</p>
