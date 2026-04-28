---
name: release-checklist
description: Run pre-release quality gates for CyberOracle. Checks version drift, code quality, tests, build, security, and git state. Reports pass/fail with actionable fixes.
---

# CyberOracle Release Checklist Skill

You are the release quality gate for the CyberOracle project. Your job is to systematically verify that the project is ready for a release tag. You run every check, report results, and fix issues when possible.

## Invocation

`/release-checklist` — runs all checks
`/release-checklist --fix` — runs checks and attempts automatic fixes

## Checklist Categories

Run these checks IN ORDER. Stop and report if a critical check fails.

---

### Category 1: File Presence (critical)

Verify these files exist:
- [ ] `CHANGELOG.md` — has at least one version entry
- [ ] `CLAUDE.md` — project instructions present
- [ ] `LICENSE` — Apache-2.0 license file
- [ ] `.changeset/config.json` — changeset configured
- [ ] `pnpm-lock.yaml` — lockfile present and not stale
- [ ] `.env.example` in `apps/server/` and `apps/web/`
- [ ] `CLAUDE.md` in project root

**If any missing:** Report which files are missing and suggest `pnpm changeset init` or manual creation.

### Category 2: Version Integrity (critical)

Run: `node scripts/check-version-drift.mjs`

This checks:
- [ ] All workspace:* dependencies resolve to local packages
- [ ] Root package.json has license field
- [ ] CHANGELOG.md has version entries
- [ ] Desktop Cargo.toml version matches package.json (if src-tauri exists)
- [ ] No orphan version numbers across packages

**If drift detected:** Report the specific mismatches. Suggest `pnpm changeset version` to sync.

### Category 3: Code Quality (critical)

Run these commands in sequence:

```bash
pnpm typecheck    # TypeScript strict mode — zero errors
pnpm lint         # ESLint — zero warnings
pnpm format:check # Prettier — zero changes needed
```

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes with zero warnings
- [ ] `pnpm format:check` passes

**If `--fix`:** Run `pnpm lint:fix && pnpm format` to auto-fix formatting and lint issues.

### Category 4: Tests (critical for packages, advisory for apps)

```bash
pnpm test         # All unit tests pass
```

- [ ] `packages/core` tests pass (Zod schemas, prompt loader, safety)
- [ ] `packages/poster` tests pass (snapshot tests, render pipeline)
- [ ] `apps/server` tests pass (API route tests)
- [ ] `apps/web` and `apps/desktop` — advisory only (Playwright may need dev server)

### Category 5: Build (critical)

```bash
pnpm build:packages  # All shared packages build
pnpm build:web       # Web app builds (if applicable)
```

- [ ] `pnpm build:packages` succeeds
- [ ] `pnpm build:web` succeeds (for web releases)
- [ ] `pnpm build:desktop` or `cargo build` succeeds (for desktop releases)

### Category 6: Git State (critical)

```bash
git status --porcelain     # Should be empty
git log --oneline -5       # Verify recent commits
git tag -l "web-v*"        # Check existing web tags
git tag -l "desktop-v*"    # Check existing desktop tags
```

- [ ] Working tree is clean (no uncommitted changes)
- [ ] No pending changeset files in `.changeset/` (or they're intentional)
- [ ] Current branch is `main`
- [ ] No existing tag with the planned version number

**IMPORTANT:** Category 6 MUST be run AFTER all fixes from Categories 1-5 are committed. If any category applies fixes, re-run `git status --porcelain` to confirm the tree is truly clean before proceeding.

### Category 7: Security (advisory)

```bash
pnpm audit --prod          # Check for known vulnerabilities
```

- [ ] No critical or high-severity vulnerabilities in production dependencies
- [ ] No `.env` files tracked in git
- [ ] No `*.key`, `*.pem`, `*.p12` files in git history

### Category 8: Documentation (advisory)

- [ ] `CHANGELOG.md` has entry for the version being released
- [ ] `README.md` setup instructions are current
- [ ] `docs/` references match current code structure

---

## Release Flow (after all checks pass)

**The release flow MUST follow this exact sequence. Do NOT tag until the working tree is confirmed clean.**

1. **Commit any pending fixes** from the checklist categories above.
2. **Re-verify clean tree:** `git status --porcelain` must return empty output. If it doesn't, commit the remaining changes and re-verify.
3. `pnpm changeset version` — Consume changesets, bump versions, update CHANGELOG
4. `git add -A && git commit -m "chore: release vX.Y.Z"`
5. **Final clean tree check:** `git status --porcelain` must be empty.
6. `git tag web-vX.Y.Z` — For web release
7. `git tag desktop-vX.Y.Z` — For desktop release (if desktop changed)
8. `git push origin main --follow-tags`
9. Create GitHub Release: `gh release create <tag> --title "<title>" --notes-file CHANGELOG.md --target main`
10. Monitor CI: `.github/workflows/release-web.yml` or release-desktop.yml
11. Verify GitHub Release draft, then publish
```

## Report Format

End with a summary table:

```
Category          | Status   | Details
------------------|----------|--------
File Presence     | ✅ Pass  | All 7 files present
Version Integrity | ✅ Pass  | No drift
Code Quality      | ❌ Fail  | 3 lint warnings in packages/core
Tests             | ✅ Pass  | 42/42 passing
Build             | ✅ Pass  | Web + packages built
Git State         | ✅ Pass  | Clean tree on main
Security          | ✅ Pass  | No vulnerabilities
Documentation     | ⚠ Advise | CHANGELOG needs v0.1.0 entry
```

If any critical check fails, output:

> **BLOCKED: Fix the issues above before tagging a release.**

If all pass:

> **READY: All checks passed. Follow the release flow steps to tag and deploy.**
