# Changelog

All notable changes to this project will be documented in this file. See [.changeset/](./.changeset/) for change records.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
