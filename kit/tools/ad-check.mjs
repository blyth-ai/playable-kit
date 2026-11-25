#!/usr/bin/env node
/*
 * Blyth Play ad-funnel check: plays the scripted near-miss level in headless Chromium.
 *
 *   node tools/ad-check.mjs <dist/index.html> [--level 3] [--seeds 1,2,3] [--speed 3] [--out <dir>] [--timeout 400]
 *
 * For every seed (one after another) it opens `?test&adfail=<level>&level=<level>&seed=<seed>&speed=<speed>`
 * (speed = fixed steps per frame-time, so runs finish faster than real time) and waits for the end card:
 *   PASS when the run ends with reason 'ad-fail' and a near-miss progress of 0.80–0.97.
 * Then it opens `?test&level=<level>` (GAME mode) and checks that no scripted failure happens.
 * Screenshots of each seed's failure moment go to <out> (default: next to the HTML):
 *   ad-s<seed>-0.png (at the trigger), ad-s<seed>-1.png (a moment later), ad-s<seed>-card.png (end card).
 * Exit code 0 = at least 2 of the seeds (or all, when fewer than 3) end in the near-miss AND GAME mode is clean.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch {
  const paths = ['/usr/lib/node_modules', '/usr/local/lib/node_modules', process.cwd()];
  try { paths.unshift(String((await import('node:child_process')).execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] })).trim()); } catch { /* ignore */ }
  try { playwright = require(require.resolve('playwright', { paths })); } catch { console.error('ad-check: playwright is not installed'); process.exit(2); }
}

const args = process.argv.slice(2);
const htmlPath = path.resolve(args.find((a) => !a.startsWith('--')) || 'dist/index.html');
const opt = (name, d) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : d; };
const level = Number(opt('level', '3'));
const seeds = String(opt('seeds', '1,2,3')).split(',').map((s) => Number(s.trim())).filter(Number.isFinite);
const timeoutS = Number(opt('timeout', '400'));
const speed = Number(opt('speed', '3'));
const outDir = path.resolve(opt('out', path.dirname(htmlPath)));
fs.mkdirSync(outDir, { recursive: true });
if (!fs.existsSync(htmlPath)) { console.error(`ad-check: ${htmlPath} not found`); process.exit(2); }
const html = fs.readFileSync(htmlPath);

const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await playwright.chromium.launch({ headless: true, args: ['--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });

async function run(qs, { shots = null } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${base}?${qs}&events=5000&speed=${speed}`, { waitUntil: 'load' });
  const t0 = Date.now(); let failAt = null; let end = null; let shot = 0;
  while (Date.now() - t0 < timeoutS * 1000) {
    await page.waitForTimeout(shots && failAt !== null && shot < 2 ? 120 : 250);
    const s = await page.evaluate(() => {
      const p = window.__playable; if (!p) return null;
      const ev = p.events;
      const fail = ev.find((e) => e.type === 'ad-fail');
      const e2 = ev.find((e) => e.type === 'end');
      return { t: p.time, state: p.state, fail: fail ? { t: fail.t, data: fail.data } : null, end: e2 ? e2.data : null, errors: p.errors.slice(0, 3) };
    });
    if (!s) continue;
    if (s.fail && failAt === null) failAt = s.fail;
    if (shots && failAt !== null && shot < 2) { await page.screenshot({ path: path.join(outDir, `ad-s${shots}-${shot}.png`) }).catch(() => {}); shot += 1; if (shot === 1) await page.waitForTimeout(Math.round(900 / speed)); }
    if (s.end) { end = s.end; if (s.errors.length) errors.push(...s.errors); break; }
  }
  if (shots && end && failAt) { await page.waitForTimeout(1500); await page.screenshot({ path: path.join(outDir, `ad-s${shots}-card.png`) }).catch(() => {}); }
  await context.close();
  return { failAt, end, errors, seconds: (Date.now() - t0) / 1000 };
}

const lines = []; let nearMisses = 0;
try {
  const results = [];
  for (const seed of seeds) results.push(await run(`test&adfail=${level}&level=${level}&seed=${seed}`, { shots: seed }));
  results.forEach((r, i) => {
    const prog = r.end && r.end.ad ? r.end.ad.near : null;
    const ok = !!r.end && r.end.reason === 'ad-fail' && typeof prog === 'number' && prog >= 0.8 && prog <= 0.97;
    if (ok) nearMisses += 1;
    lines.push(`${ok ? 'PASS' : 'FAIL'}  seed ${seeds[i]}: ${r.end ? `end reason=${r.end.reason} win=${r.end.win} near=${prog == null ? '-' : prog.toFixed(3)}` : 'no end within timeout'}${r.failAt ? ` · ad-fail at ${r.failAt.t.toFixed(1)} s (progress ${r.failAt.data && r.failAt.data.progress})` : ' · ad.check never fired'}${r.errors.length ? ` · errors: ${r.errors.slice(0, 2).join(' | ')}` : ''}`);
  });
  const g = await run(`test&level=${level}&seed=${seeds[0] || 1}`);
  const gameClean = !g.failAt && !(g.end && g.end.reason === 'ad-fail') && g.errors.length === 0;
  lines.push(`${gameClean ? 'PASS' : 'FAIL'}  GAME mode (adMode off): ${g.end ? `end reason=${g.end.reason} win=${g.end.win}` : 'still playing at timeout'}${g.failAt ? ' · ad-fail fired in GAME mode!' : ''}${g.errors.length ? ` · errors: ${g.errors.slice(0, 2).join(' | ')}` : ''}`);
  const need = seeds.length >= 3 ? 2 : seeds.length;
  const pass = nearMisses >= need && gameClean;
  for (const l of lines) console.log(l);
  console.log(`screenshots: ${path.join(outDir, 'ad-s<seed>-0.png')} (trigger), -1.png (a moment later), -card.png (end card)`);
  console.log(pass ? 'AD-CHECK: PASS' : 'AD-CHECK: FAIL');
  process.exitCode = pass ? 0 : 1;
} finally {
  await browser.close(); server.close();
}
