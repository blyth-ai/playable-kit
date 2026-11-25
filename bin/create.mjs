#!/usr/bin/env node
// npx @blyth/playable-kit [folder]: writes the Blyth Playable kit into a new (or empty) folder.
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const kit = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'kit');
const arg = process.argv[2];
if (arg === '--help' || arg === '-h') {
  console.log('Usage: npx @blyth/playable-kit [folder]   (default: blyth-game)');
  process.exit(0);
}
const target = path.resolve(arg || 'blyth-game');
if (existsSync(target) && readdirSync(target).length) {
  console.error(`${target} is not empty. Pick a new folder.`);
  process.exit(1);
}
mkdirSync(target, { recursive: true });
cpSync(kit, target, { recursive: true });
const rel = path.relative(process.cwd(), target) || '.';
console.log(`Blyth Playable kit 0.1.2 written to ${rel}

Next:
  cd ${rel}
  npm install
  read SKILL.md, write game/main.js, then:
  node tools/build.mjs game
  node tools/verify.mjs game/dist/index.html`);
