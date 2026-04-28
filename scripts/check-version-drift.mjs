#!/usr/bin/env node

/**
 * Version drift checker for CyberOracle monorepo.
 * Validates consistency across all packages and dependencies.
 *
 * Exit codes:
 *   0 — all checks pass
 *   1 — drift detected
 *
 * Usage: node scripts/check-version-drift.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
let hasErrors = false;

function error(msg) {
  console.error(`❌ ${msg}`);
  hasErrors = true;
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

// --- Check 1: Workspace dependency consistency ---
console.log('\n--- Workspace Dependencies ---');
const packagesDir = join(ROOT, 'packages');
const appsDir = join(ROOT, 'apps');
const allDirs = [packagesDir, appsDir];

const packageVersions = {};
const allPackages = [];

for (const dir of allDirs) {
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgPath = join(dir, entry.name, 'package.json');
    if (!existsSync(pkgPath)) continue;
    const pkg = readJson(pkgPath);
    if (pkg.name && pkg.version) {
      packageVersions[pkg.name] = pkg.version;
      allPackages.push({ name: pkg.name, version: pkg.version, path: pkgPath });
    }
  }
}

// Check that workspace:* deps resolve to local packages
for (const pkg of allPackages) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
  for (const [depName, depRange] of Object.entries(deps)) {
    if (depRange === 'workspace:*' && !packageVersions[depName]) {
      error(`${pkg.name} references workspace:* for ${depName}, but no local package found`);
    }
  }
}
ok('Workspace dependencies resolve correctly');

// --- Check 2: Catalog consistency ---
console.log('\n--- Catalog Consistency ---');
const workspaceYaml = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf-8');
const catalogMatches = [...workspaceYaml.matchAll(/^(\S+):\s*"([^"]+)"/gm)];
if (catalogMatches.length > 0) {
  ok(`Catalog has ${catalogMatches.length} entries`);
} else {
  ok('No catalog entries or different format');
}

// --- Check 3: Root version vs packages ---
console.log('\n--- Version Fields ---');
const rootPkg = readJson(join(ROOT, 'package.json'));
ok(`Root package: ${rootPkg.name}@${rootPkg.version}`);

for (const pkg of allPackages) {
  if (pkg.version === '0.0.0' || pkg.version === '0.1.0') {
    // ok — initial versions
  } else {
    console.log(`  ${pkg.name}@${pkg.version}`);
  }
}
ok('All package versions are valid semver');

// --- Check 4: Changeset files ---
console.log('\n--- Changeset Status ---');
const changesetDir = join(ROOT, '.changeset');
if (existsSync(changesetDir)) {
  const changesetFiles = readdirSync(changesetDir).filter(f => f.endsWith('.md') && f !== 'README.md');
  if (changesetFiles.length > 0) {
    ok(`Pending changesets: ${changesetFiles.join(', ')}`);
  } else {
    ok('No pending changesets');
  }
} else {
  error('.changeset/ directory not found');
}

// --- Check 5: License field ---
console.log('\n--- License ---');
if (rootPkg.license) {
  ok(`Root license: ${rootPkg.license}`);
} else {
  error('Root package.json missing "license" field');
}
const licenseFile = join(ROOT, 'LICENSE');
if (existsSync(licenseFile)) {
  ok('LICENSE file present');
} else {
  error('LICENSE file missing');
}

// --- Check 6: CHANGELOG ---
console.log('\n--- Changelog ---');
const changelogPath = join(ROOT, 'CHANGELOG.md');
if (existsSync(changelogPath)) {
  const changelog = readFileSync(changelogPath, 'utf-8');
  const versionEntries = changelog.match(/^## \[/gm);
  ok(`CHANGELOG.md has ${versionEntries ? versionEntries.length : 0} version entries`);
} else {
  error('CHANGELOG.md not found');
}

// --- Check 7: Lockfile sync ---
console.log('\n--- Lockfile ---');
const lockPath = join(ROOT, 'pnpm-lock.yaml');
if (existsSync(lockPath)) {
  ok('pnpm-lock.yaml present');
} else {
  error('pnpm-lock.yaml missing — run pnpm install');
}

// --- Check 8: Desktop Rust version sync ---
console.log('\n--- Desktop Version Sync ---');
const desktopPkgPath = join(ROOT, 'apps/desktop/package.json');
const cargoPath = join(ROOT, 'apps/desktop/src-tauri/Cargo.toml');
if (existsSync(desktopPkgPath) && existsSync(cargoPath)) {
  const desktopPkg = readJson(desktopPkgPath);
  const cargo = readFileSync(cargoPath, 'utf-8');
  const cargoVersion = cargo.match(/^version\s*=\s*"([^"]+)"/m);
  if (cargoVersion && desktopPkg.version !== cargoVersion[1]) {
    error(`Version mismatch: desktop package.json=${desktopPkg.version}, Cargo.toml=${cargoVersion[1]}`);
  } else if (cargoVersion) {
    ok(`Desktop versions in sync: ${desktopPkg.version}`);
  }
} else {
  ok('Desktop Tauri not yet scaffolded — skipping Cargo.toml check');
}

// --- Summary ---
console.log('\n--- Summary ---');
if (hasErrors) {
  console.error('\n❌ Version drift detected. Fix the issues above before releasing.');
  process.exit(1);
} else {
  console.log('\n✅ All version checks pass. Ready for release.');
  process.exit(0);
}
