#!/usr/bin/env node

import { execSync } from 'node:child_process';

const NODE_REQ = '22.0.0';
const PNPM_REQ = '9.0.0';

function versionGte(current, required) {
  const c = current.split('.').map(Number);
  const r = required.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((c[i] ?? 0) > (r[i] ?? 0)) return true;
    if ((c[i] ?? 0) < (r[i] ?? 0)) return false;
  }
  return true;
}

function getVersion(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim().replace(/^v/, '');
  } catch {
    return '0.0.0';
  }
}

const nodeVer = getVersion('node -v');
const pnpmVer = getVersion('pnpm -v');

let ok = true;

if (!versionGte(nodeVer, NODE_REQ)) {
  console.error(`\u274c Node ${NODE_REQ}+ required, found ${nodeVer}`);
  console.error('   Install: nvm install 22 && nvm use 22');
  ok = false;
}

if (!versionGte(pnpmVer, PNPM_REQ)) {
  console.error(`\u274c pnpm ${PNPM_REQ}+ required, found ${pnpmVer}`);
  console.error('   Install: corepack enable && corepack prepare pnpm@9.12.0 --activate');
  ok = false;
}

if (!ok) process.exit(1);

const rustVer = getVersion('rustc -V');
if (rustVer === '0.0.0') {
  console.log(`\u26a0 Rust not installed, desktop builds will not work`);
  console.log(`  Install: https://rustup.rs`);
  console.log(`\u2713 Node ${nodeVer} \u00b7 pnpm ${pnpmVer}`);
} else {
  const ver = rustVer.split(' ')[0] ?? rustVer;
  console.log(`\u2713 Node ${nodeVer} \u00b7 pnpm ${pnpmVer} \u00b7 Rust ${ver}`);
}
