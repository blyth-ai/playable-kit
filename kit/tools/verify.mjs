#!/usr/bin/env node
/*
 * Blyth Play verify: loads a built playable in headless Chromium and checks that it
 * really works. Writes report.json + screenshots next to the HTML (or --out dir).
 *
 *   node tools/verify.mjs <dist/index.html> [--seconds 20] [--out <dir>]
 *
 * Exit code 0 = every required check passed.
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
  try { playwright = require(require.resolve('playwright', { paths })); } catch {
    console.error('verify: playwright is not installed (npm i -D playwright, or use the sandbox copy)'); process.exit(2);
  }
}

const args = process.argv.slice(2);
const htmlPath = path.resolve(args.find((a) => !a.startsWith('--')) || 'dist/index.html');
const opt = (name, d) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : d; };
const seconds = Number(opt('seconds', '20'));
const outDir = path.resolve(opt('out', path.dirname(htmlPath)));
fs.mkdirSync(outDir, { recursive: true });
if (!fs.existsSync(htmlPath)) { console.error(`verify: ${htmlPath} not found`); process.exit(2); }
const html = fs.readFileSync(htmlPath);

const server = http.createServer((req, res) => {
  if (req.url.split('?')[0] === '/' || req.url.startsWith('/index.html')) { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html); return; }
  res.writeHead(404); res.end('not found');
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

// Kernel-provided params (kernel.js SHARED_PARAMS); everything else counts as a game param.
const SHARED_KEYS = ['difficulty', 'maxPlayTime', 'hintDelay', 'ctaText', 'storeUrlIos', 'storeUrlAndroid', 'endTitle', 'endSub', 'uiSkin', 'uiAccent', 'uiPanel', 'cameraShake', 'musicStyle', 'sfxVolume', 'musicVolume', 'language', 'adMode', 'adFailLevel', 'adFailAt', 'adGateLevel', 'maxRetries'];
const checks = [];
const check = (name, ok, detail = '', required = true) => { checks.push({ name, ok: !!ok, required, detail }); };

// Headless Chromium already renders WebGL with SwiftShader; forcing ANGLE onto SwiftShader also moves page
// compositing there, which makes screenshots time out on a busy machine.
const browser = await playwright.chromium.launch({
  headless: true,
  args: ['--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const shotWarnings = [];
async function shot(page, file) {
  try { await page.screenshot({ path: path.join(outDir, file), timeout: 45000 }); }
  catch (err) { shotWarnings.push(`${file}: ${String(err && err.message || err).split('\n')[0]}`); }
}

async function openPage(width, height, qs) {
  // deviceScaleFactor 1 keeps software WebGL (SwiftShader) fast enough for a fair fps reading
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const consoleErrors = []; const external = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(base) && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u); });
  await page.goto(`${base}?${qs}`, { waitUntil: 'load' });
  return { page, context, consoleErrors, external };
}
const state = (page) => page.evaluate(() => {
  const p = window.__playable; if (!p) return null;
  return { ready: p.ready, state: p.state, score: p.score, time: p.time, frames: p.frames, fps: p.fps, errors: p.errors.slice(0, 10), errorCount: p.errors.length, schemaErrors: p.schemaErrors, events: p.events.slice(-30), meta: p.meta, paramCount: Object.keys(p.schema || {}).length, schema: p.schema };
});

const sizeBytes = html.length;
check('size ≤ 5 MB', sizeBytes <= 5 * 1024 * 1024, `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`);
const htmlText = html.toString('utf8');
check('game scripts an ad near-miss (ctx.ad.check / ctx.ad.fail)', /\.ad\.(check|fail)\(/.test(htmlText), '', false);

let summary = {};
try {
  // ---------- portrait run
  const P = await openPage(390, 844, 'test&seed=1');
  let s = null;
  for (let i = 0; i < 60; i += 1) { s = await state(P.page); if (s && s.ready) break; await P.page.waitForTimeout(250); }
  check('kernel ready within 15 s', s && s.ready, s ? `state=${s.state}` : 'window.__playable missing');
  check('params schema valid', s && s.schemaErrors.length === 0, s ? s.schemaErrors.join(' | ') : '');
  const gameParams = s ? Object.entries(s.schema).filter(([k]) => !SHARED_KEYS.includes(k)) : [];
  check('at least 6 game params', gameParams.length >= 6, `${gameParams.length} game params`);
  check('at least 3 marketer params', gameParams.filter(([, p]) => p.marketer).length >= 3, `${gameParams.filter(([, p]) => p.marketer).length} marketer`);
  await shot(P.page, 'shot-intro.png');

  await P.page.waitForTimeout(1500);
  s = await state(P.page);
  check('auto-starts play in test mode', s && (s.state === 'play' || s.state === 'end'), `state=${s && s.state}`);

  const f0 = s ? s.frames : 0; const t0 = Date.now();
  let midShot = false; let maxScore = s ? s.score : 0; let ended = false;
  while (Date.now() - t0 < seconds * 1000) {
    await P.page.waitForTimeout(1000);
    s = await state(P.page);
    if (!s) break;
    maxScore = Math.max(maxScore, s.score);
    if (!midShot && Date.now() - t0 > Math.min(6000, seconds * 400)) { await shot(P.page, 'poster.png'); midShot = true; }
    if (s.state === 'end') { ended = true; break; }
  }
  if (!midShot) await shot(P.page, 'poster.png');
  const elapsed = (Date.now() - t0) / 1000;
  const fps = s ? (s.frames - f0) / Math.max(elapsed, 0.001) : 0;
  check('renders frames (≥ 10 fps headless)', fps >= 10, `${fps.toFixed(1)} fps`);
  check('bot interacts / score changes', maxScore > 0 || (s && s.events.some((e) => e.type === 'end')), `max score ${maxScore}`, false);
  if (ended) await shot(P.page, 'shot-end.png');

  // live param change
  const live = gameParams.find(([, p]) => p.apply === 'live' && (p.type === 'float' || p.type === 'int'));
  if (live) {
    const [k, p] = live;
    await P.page.evaluate(([key, v]) => window.__playable.setParams({ [key]: v }), [k, p.max]);
    await P.page.waitForTimeout(800);
    const s2 = await state(P.page);
    check(`live param update (${k})`, s2 && s2.errorCount === (s ? s.errorCount : 0), s2 && s2.errorCount ? s2.errors.slice(-1).join('') : '');
  } else check('has a live numeric param', false, 'no live int/float game param');

  // restart
  await P.page.evaluate(() => window.__playable.restart());
  await P.page.waitForTimeout(800);
  const s3 = await state(P.page);
  check('restart resets the run', s3 && s3.state === 'play' && s3.time < 3, s3 ? `state=${s3.state} time=${s3.time.toFixed(2)}` : '');

  // end card
  await P.page.evaluate(() => window.__playable.forceEnd(true));
  await P.page.waitForTimeout(400);
  const endVisible = await P.page.evaluate(() => { const e = document.querySelector('#pk-ui .pk-card'); return !!e && e.offsetParent !== null; });
  const s4 = await state(P.page);
  check('end card shows + gameEnd event', endVisible && s4 && s4.events.some((e) => e.type === 'end'), `visible=${endVisible}`);
  await shot(P.page, 'shot-endcard.png');

  // ad mode: CTA end card and the scripted near-miss (ctx.ad.fail → SO CLOSE card)
  await P.page.evaluate(() => window.__playable.setParams({ adMode: true }));
  await P.page.waitForTimeout(500);
  await P.page.evaluate(() => window.__playable.ad.fail({ progress: 0.9 }));
  await P.page.waitForTimeout(1800);
  const adCard = await P.page.evaluate(() => {
    const vis = (sel) => { const e = document.querySelector(sel); return !!e && e.offsetParent !== null && !e.classList.contains('pk-hidden'); };
    const p = window.__playable;
    return { state: p.state, cta: vis('#pk-ui .pk-cta'), near: vis('#pk-ui .pk-near'), title: (document.querySelector('#pk-ui .pk-title') || {}).textContent || '', adFail: p.events.some((e) => e.type === 'end' && e.data && e.data.reason === 'ad-fail') };
  });
  check('ad mode near-miss card (SO CLOSE + CTA)', adCard.state === 'end' && adCard.cta && adCard.near && adCard.adFail, `state=${adCard.state} cta=${adCard.cta} near=${adCard.near} title=${adCard.title}`);
  await shot(P.page, 'shot-adcard.png');
  await P.page.evaluate(() => window.__playable.setParams({ adMode: false }));
  await P.page.waitForTimeout(300);

  const allErrors = [...P.consoleErrors, ...((s4 && s4.errors) || [])];
  check('no runtime / console errors', allErrors.length === 0, allErrors.slice(0, 5).join(' | '));
  check('no external network requests', P.external.length === 0, P.external.slice(0, 5).join(' | '));
  summary = { meta: s4 && s4.meta, paramCount: s4 && s4.paramCount, gameParams: gameParams.map(([k]) => k), fps: Math.round(fps), maxScore, ended };
  await P.context.close();

  // ---------- landscape smoke
  const L = await openPage(844, 390, 'test&seed=2');
  await L.page.waitForTimeout(3500);
  const sl = await state(L.page);
  await shot(L.page, 'shot-landscape.png');
  const lErr = [...L.consoleErrors, ...((sl && sl.errors) || [])];
  check('landscape loads without errors', sl && sl.ready && lErr.length === 0, lErr.slice(0, 3).join(' | '), false);
  await L.context.close();
} catch (err) {
  check('verify crashed', false, String(err && err.stack || err));
} finally {
  await browser.close();
  server.close();
}

check('screenshots captured', shotWarnings.length === 0, shotWarnings.join(' | '), false);
const pass = checks.filter((c) => c.required).every((c) => c.ok);
const report = { pass, file: path.basename(htmlPath), sizeBytes, seconds, checks, summary, verifiedAt: new Date().toISOString() };
fs.writeFileSync(path.join(outDir, 'verify.json'), JSON.stringify(report, null, 2));
for (const c of checks) console.log(`${c.ok ? 'PASS' : c.required ? 'FAIL' : 'WARN'}  ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
console.log(pass ? 'RESULT: PASS' : 'RESULT: FAIL');
process.exit(pass ? 0 : 1);
