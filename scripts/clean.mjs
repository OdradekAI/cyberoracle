#!/usr/bin/env node

import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const cacheOnly = process.argv.includes('--cache-only');

const CACHE_DIRS = ['.turbo', 'node_modules/.cache'];
const BUILD_DIRS = ['dist', '.next', '.vite', 'out', 'build', 'coverage'];
const RUST_TARGET = join('apps', 'desktop', 'src-tauri', 'target');

function rm(dir) {
  const full = join(ROOT, dir);
  if (existsSync(full)) {
    rmSync(full, { recursive: true, force: true });
    console.log(`  removed ${dir}`);
  }
}

console.log('\u25b6 Cleaning turbo cache...');
rm('.turbo');

try {
  execSync('pnpm -r exec node -e "const fs=require(\'fs\');[\'.turbo\'].forEach(d=>{try{fs.rmSync(d,{recursive:true,force:true})}catch{}})"', {
    cwd: ROOT,
    stdio: 'ignore',
  });
} catch {}

if (!cacheOnly) {
  console.log('\u25b6 Cleaning build outputs...');
  for (const dir of BUILD_DIRS) {
    try {
      execSync(`pnpm -r exec node -e "const fs=require('fs');try{fs.rmSync('${dir}',{recursive:true,force:true})}catch{}"`, {
        cwd: ROOT,
        stdio: 'ignore',
      });
    } catch {}
  }

  console.log('\u25b6 Cleaning Rust target (keeping cargo registry)...');
  rm(RUST_TARGET);
}

console.log('\u2713 Clean complete');
if (cacheOnly) {
  console.log('  (cache only — build outputs preserved)');
} else {
  console.log('  (node_modules preserved — run "pnpm install" if needed)');
}
