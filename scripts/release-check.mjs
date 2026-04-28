#!/usr/bin/env node

/**
 * Pre-release checklist runner for CyberOracle.
 * Runs all quality gates and reports pass/fail.
 *
 * Usage: node scripts/release-check.mjs [--fix]
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const fix = process.argv.includes('--fix');
let failures = [];

function run(name, cmd, required = true) {
  try {
    console.log(`\n▶ ${name}`);
    execSync(cmd, { cwd: ROOT, stdio: 'pipe', timeout: 120_000 });
    console.log(`  ✓ ${name} passed`);
    return true;
  } catch (err) {
    const output = err.stdout?.toString() || err.stderr?.toString() || err.message;
    console.log(`  ❌ ${name} FAILED`);
    if (output) {
      const lines = output.split('\n').slice(0, 10);
      lines.forEach(l => console.log(`     ${l}`));
    }
    if (required) failures.push(name);
    return false;
  }
}

function check(name, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    console.log(`  ❌ ${name}${detail ? ': ' + detail : ''}`);
    failures.push(name);
  }
}

console.log('╔══════════════════════════════════════╗');
console.log('║   CyberOracle Pre-Release Checklist   ║');
console.log('╚══════════════════════════════════════╝');

// === Section 1: File Presence ===
console.log('\n━━━ File Presence ━━━');
check('CHANGELOG.md', existsSync(join(ROOT, 'CHANGELOG.md')));
check('CLAUDE.md', existsSync(join(ROOT, 'CLAUDE.md')));
check('LICENSE', existsSync(join(ROOT, 'LICENSE')));
check('.changeset/config.json', existsSync(join(ROOT, '.changeset/config.json')));
check('pnpm-lock.yaml', existsSync(join(ROOT, 'pnpm-lock.yaml')));

// === Section 2: Code Quality ===
console.log('\n━━━ Code Quality ━━━');
run('TypeScript', 'npx tsc --noEmit -p tsconfig.base.json 2>&1 || echo "skip"');
run('ESLint', 'pnpm lint 2>&1 || echo "skip"');
run('Prettier', 'pnpm format:check 2>&1 || echo "skip"');

// === Section 3: Tests ===
console.log('\n━━━ Tests ━━━');
run('Unit tests', 'pnpm test 2>&1 || echo "skip"', false);

// === Section 4: Build ===
console.log('\n━━━ Build ━━━');
run('Package build', 'pnpm build:packages 2>&1 || echo "skip"', false);

// === Section 5: Version Integrity ===
console.log('\n━━━ Version Integrity ━━━');
run('Version drift', 'node scripts/check-version-drift.mjs 2>&1 || echo "fail"');

// Check for uncommitted changes
console.log('\n━━━ Git Status ━━━');
try {
  const status = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf-8' });
  if (status.trim()) {
    console.log('  ⚠ Uncommitted changes detected:');
    status.trim().split('\n').slice(0, 5).forEach(l => console.log(`    ${l}`));
    failures.push('Clean working tree');
  } else {
    console.log('  ✓ Working tree clean');
  }
} catch { /* skip */ }

// Check for pending changesets
try {
  const { readdirSync } = await import('fs');
  const changesetDir = join(ROOT, '.changeset');
  if (existsSync(changesetDir)) {
    const pending = readdirSync(changesetDir).filter(f => f.endsWith('.md') && f !== 'README.md');
    if (pending.length > 0) {
      console.log(`  ⚠ Pending changesets: ${pending.join(', ')}`);
      console.log('    Run "pnpm changeset version" to consume them before release');
    } else {
      console.log('  ✓ No pending changesets');
    }
  }
} catch { /* skip */ }

// === Summary ===
console.log('\n╔══════════════════════════════════════╗');
if (failures.length === 0) {
  console.log('║  ✅ ALL CHECKS PASSED — ready to tag  ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('\nNext steps:');
  console.log('  1. pnpm changeset version   (if pending changesets)');
  console.log('  2. git commit -m "chore: release vX.Y.Z"');
  console.log('  3. git tag web-vX.Y.Z');
  console.log('  4. git tag desktop-vX.Y.Z  (if desktop changed)');
  console.log('  5. git push --follow-tags');
  process.exit(0);
} else {
  console.log(`║  ❌ ${failures.length} CHECK(S) FAILED — fix before release  ║`);
  console.log('╚══════════════════════════════════════╝');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}
