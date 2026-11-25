#!/usr/bin/env node
/*
 * Blyth Play build: bundles a game folder into ONE self-contained index.html.
 *
 *   node tools/build.mjs <gameDir> [--out <file>] [--orientation portrait|landscape]
 *
 * <gameDir>/main.js        entry; imports the kernel as 'blyth-play-kernel'
 * <gameDir>/assets/img/*   png|jpg|webp|svg  -> window.__ASSETS__.img[name]
 * <gameDir>/assets/snd/*   mp3|ogg|wav       -> window.__ASSETS__.snd[name]
 * <gameDir>/assets/models/* glb              -> window.__ASSETS__.models[name]
 * <gameDir>/assets/json/*  json              -> window.__ASSETS__.json[name]
 *
 * Output: <gameDir>/dist/index.html (+ dist/build.json). Fails above 5 MB.
 */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleGame, PLAYABLE_LIMIT_BYTES, playableHtml, playableTitleFromSource } from './build-lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const KERNEL = path.resolve(here, '../kernel/kernel.js');
const LIMIT = PLAYABLE_LIMIT_BYTES;

const args = process.argv.slice(2);
const gameDir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const opt = (name, d) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : d; };
const outFile = path.resolve(opt('out', path.join(gameDir, 'dist', 'index.html')));
const orientationOverride = opt('orientation', null);

const entry = path.join(gameDir, 'main.js');
if (!fs.existsSync(entry)) { console.error(`build: ${entry} not found`); process.exit(2); }

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', gif: 'image/gif' };
function readAssets() {
  const root = path.join(gameDir, 'assets');
  const out = { img: {}, snd: {}, models: {}, json: {} };
  if (!fs.existsSync(root)) return out;
  for (const kind of Object.keys(out)) {
    const dir = path.join(root, kind);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (!fs.statSync(full).isFile()) continue;
      const ext = f.split('.').pop().toLowerCase();
      const key = f.replace(/\.[^.]+$/, '');
      const buf = fs.readFileSync(full);
      if (kind === 'img') out.img[key] = `data:${MIME[ext] || 'application/octet-stream'};base64,${buf.toString('base64')}`;
      else if (kind === 'json') out.json[key] = JSON.parse(buf.toString('utf8'));
      else out[kind][key] = buf.toString('base64');
    }
  }
  return out;
}

const js = await bundleGame({
  esbuild,
  entry: { file: entry },
  kernelPath: KERNEL,
  nodePaths: [path.resolve(here, '../node_modules'), path.join(gameDir, 'node_modules')],
  orientation: orientationOverride,
});
const assets = readAssets();
const title = playableTitleFromSource(fs.readFileSync(entry, 'utf8'));
const html = playableHtml({ title, js, assets });

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html);
const size = Buffer.byteLength(html);
const report = {
  out: path.relative(process.cwd(), outFile),
  sizeBytes: size,
  sizeMB: Math.round((size / 1024 / 1024) * 100) / 100,
  assets: Object.fromEntries(Object.entries(assets).map(([k, v]) => [k, Object.keys(v).length])),
  underLimit: size <= LIMIT,
  builtAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(path.dirname(outFile), 'build.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
if (!report.underLimit) { console.error(`build: ${report.sizeMB} MB is over the 5 MB playable limit`); process.exit(1); }
