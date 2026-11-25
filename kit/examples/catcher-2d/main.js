// Fruit Rush — reference 2D playable for the Blyth Play Kernel (Canvas 2D, procedural pixel art).
// Drag the basket, catch fruit, chain combos into FEVER, dodge bombs, fill the basket before time runs out.
// Shows the v0.2 toolkit: pixel sprites, palettes, HUD counters + hearts + progress, tutorial hand,
// juice (bursts, floats, rings, shake, freeze), combo pitch, levels, stars and the near-miss end card,
// plus v0.4 desktop control: def.hoverSteer (a hovering mouse moves the basket, no click needed).
import { createGame } from 'blyth-play-kernel';

const PALETTES = {
  'Sunny Orchard': { skyTop: '#59b8ff', skyBottom: '#c9f0ff', sun: '#fff3b0', hillFar: '#8fd16a', hillNear: '#5bb84a', ground: '#4a9a3c', dirt: '#8a5a32' },
  'Golden Hour': { skyTop: '#ff7eb3', skyBottom: '#ffd08a', sun: '#fff1c4', hillFar: '#e59a6b', hillNear: '#b86b4b', ground: '#7e9a3c', dirt: '#6b4428' },
  'Candy Land': { skyTop: '#b58cff', skyBottom: '#ffd1f0', sun: '#ffffff', hillFar: '#ff9ed2', hillNear: '#ff6fb5', ground: '#7fd6c2', dirt: '#c46aa0' },
  'Night Market': { skyTop: '#141a46', skyBottom: '#4a3f8f', sun: '#e8f0ff', hillFar: '#2b3f7a', hillNear: '#203063', ground: '#2e5a4a', dirt: '#3a2c3f' },
};

// 10×10 pixel art. '.' = transparent.
const ART = {
  apple: { juice: '#ff4d5e', rows: ['....sl....', '....sll...', '.rrrsrrr..', 'rrhrrrrrr.', 'rhhrrrrrrd', 'rhrrrrrrrd', 'rrrrrrrrrd', 'rrrrrrrrdd', '.rrrrrrdd.', '..rrddd...'], pal: { r: '#ff3b4e', d: '#c41f3a', h: '#ffd0d4', s: '#6b4423', l: '#4cc94c' } },
  orange: { juice: '#ffa53d', rows: ['.....l....', '...oolo...', '..ohooooo.', '.ohhoooooO', '.ohooooooO', '.ooooooooO', '.oooooooOO', '..ooooooO.', '...oOOOO..', '..........'], pal: { o: '#ff9a1f', O: '#d9670d', h: '#ffe1a8', l: '#4cc94c' } },
  grapes: { juice: '#b26bff', rows: ['....ss....', '...s.l....', '..phpph...', '.phppPhpp.', '.ppPphppP.', '..phpPpp..', '..pPphpP..', '...ppPp...', '....pP....', '..........'], pal: { p: '#9b4dff', P: '#6a24c9', h: '#e2c8ff', s: '#6b4423', l: '#4cc94c' } },
  melon: { juice: '#ff5f7e', rows: ['gggggggggg', 'wwwwwwwwww', 'rrrrrrrrrr', '.rrkrrkrr.', '.rrrrrrrr.', '..rkrrkr..', '..rrrrrr..', '...rkrr...', '....rr....', '..........'], pal: { g: '#2f9e44', w: '#e9ffd9', r: '#ff4f6d', k: '#2a1a1f' } },
  golden: { juice: '#ffd23f', rows: ['....yy....', '....yy....', '...yyyy...', 'yyyyhhyyyy', '.yyyhyyyy.', '..yyyyyy..', '..yyyyyy..', '.yyy..yyy.', '.yy....yy.', '..........'], pal: { y: '#ffcc1f', h: '#fff7c2' } },
  heart: { juice: '#ff3d6e', rows: ['.hh...hh..', 'hwhh.hhhh.', 'hwhhhhhhh.', 'hhhhhhhhh.', '.hhhhhhh..', '..hhhhh...', '...hhh....', '....h.....', '..........', '..........'], pal: { h: '#ff3d6e', w: '#ffd3df' } },
  bomb: { juice: '#ff8a3d', rows: ['......ff..', '.....f....', '...bbbb...', '..bbbbbb..', '.bBbbbbbb.', '.bBbbbbbb.', '.bbbbbbbb.', '.bbbbbbbb.', '..bbbbbb..', '...bbbb...'], pal: { b: '#22252d', B: '#5a6070', f: '#c9a36b' } },
};
const CLOUD = ['....wwww......', '..wwwwwwww....', '.wwwwwwwwwwww.', 'wwwwwwwwwwwwww', 'bwwwwwwwwwwwwb', '.bbbbbbbbbbbb.'];
const FRUITS = ['apple', 'orange', 'grapes', 'melon'];

const scene = { t: 0, clouds: [], tufts: [], sprites: null };

createGame({
  renderer: '2d',
  config: {
    meta: { title: 'Fruit Rush', slug: 'fruit-rush', version: 'v02', genre: 'arcade', dimension: '2d', orientation: 'portrait', mode: 'GAME', seed: 7 },
    params: {
      basketWidth: { label: 'Basket width', group: 'Player', sub: 'Size', type: 'int', def: 118, min: 70, max: 200, step: 2, unit: 'px', apply: 'live', marketer: true, dir: 'high' },
      followSpeed: { label: 'Basket follow speed', group: 'Player', sub: 'Movement', type: 'float', def: 22, min: 6, max: 60, step: 1, apply: 'live' },
      lives: { label: 'Hearts', group: 'Player', type: 'int', def: 3, min: 1, max: 6, step: 1, apply: 'restart', marketer: true, dir: 'high' },
      fallSpeed: { label: 'Fall speed', group: 'Difficulty', type: 'float', def: 250, min: 120, max: 600, step: 10, unit: 'px/s', apply: 'live', marketer: true, dir: 'low' },
      speedGrowth: { label: 'Speed growth', group: 'Difficulty', type: 'float', def: 0.45, min: 0, max: 1.5, step: 0.05, unit: 'x/30s', apply: 'live' },
      spawnRate: { label: 'Items per second', group: 'Difficulty', type: 'float', def: 1.7, min: 0.5, max: 4, step: 0.1, apply: 'live', marketer: true },
      levelSpeedUp: { label: 'Speed-up per level', group: 'Difficulty', type: 'float', def: 0.15, min: 0, max: 0.5, step: 0.05, apply: 'restart' },
      waveEvery: { label: 'Fruit wave every', group: 'Difficulty', type: 'float', def: 7, min: 3, max: 20, step: 0.5, unit: 's', apply: 'live' },
      bombChance: { label: 'Bomb chance', group: 'Enemies', type: 'float', def: 0.2, min: 0, max: 0.6, step: 0.01, apply: 'live', marketer: true, dir: 'low' },
      fruitValue: { label: 'Points per fruit', group: 'Economy', type: 'int', def: 10, min: 1, max: 50, step: 1, apply: 'live', marketer: true },
      goldenChance: { label: 'Golden star chance', group: 'Economy', type: 'float', def: 0.06, min: 0, max: 0.3, step: 0.01, apply: 'live', marketer: true },
      goldenValue: { label: 'Golden star points', group: 'Economy', type: 'int', def: 50, min: 10, max: 300, step: 5, apply: 'live' },
      comboStep: { label: 'Combo bonus every', group: 'Economy', type: 'int', def: 5, min: 2, max: 15, step: 1, apply: 'live' },
      feverAt: { label: 'Fever at combo', group: 'Economy', type: 'int', def: 12, min: 4, max: 40, step: 1, apply: 'live', marketer: true },
      feverSeconds: { label: 'Fever duration', group: 'Economy', type: 'float', def: 5, min: 2, max: 12, step: 0.5, unit: 's', apply: 'live' },
      feverMultiplier: { label: 'Fever multiplier', group: 'Economy', type: 'int', def: 2, min: 2, max: 5, step: 1, apply: 'live', marketer: true },
      heartChance: { label: 'Heart drop chance', group: 'Economy', type: 'float', def: 0.03, min: 0, max: 0.2, step: 0.01, apply: 'live' },
      targetScore: { label: 'Target score', group: 'Timing', type: 'int', def: 450, min: 100, max: 3000, step: 50, apply: 'restart', marketer: true, dir: 'low' },
      missCostsLife: { label: 'Missed fruit costs a heart', group: 'Timing', type: 'bool', def: false, apply: 'restart' },
      background: { label: 'Background', group: 'Colors', sub: 'Background colors', type: 'enum', options: Object.keys(PALETTES), def: 'Sunny Orchard', apply: 'live', marketer: true },
      basketColor: { label: 'Basket colour', group: 'Colors', sub: 'Interface', type: 'color', def: '#c27a3a', apply: 'live', marketer: true },
      fruitScale: { label: 'Fruit size', group: 'Characters', type: 'float', def: 1, min: 0.7, max: 1.6, step: 0.05, apply: 'live', marketer: true },
      sunRays: { label: 'Sun rays', group: 'Animation', type: 'bool', def: true, apply: 'live' },
    },
    difficultyOverrides: { easy: { bombChance: 0.1, lives: 5, fallSpeed: 210 }, hard: { bombChance: 0.32, lives: 2, fallSpeed: 300 } },
    sharedDefaults: { uiSkin: 'candy', uiAccent: '#ff3d6e', musicStyle: 'tropical', maxPlayTime: 45 },
    trailer: { spawnRate: 2.6, feverAt: 6, bombChance: 0.16, goldenChance: 0.12, waveEvery: 4, autoNext: true },
  },
  strings: {
    en: {
      'title.name': 'FRUIT RUSH', 'title.tag': 'CATCH THE FRUIT · DODGE THE BOMBS', 'hint.drag': 'DRAG TO MOVE', 'hint.mouse': 'MOVE THE MOUSE', 'obj': 'Reach {n} points!',
      'toast.combo': 'COMBO x{n}!', 'toast.fever': 'FEVER x{n}!', 'toast.ouch': 'OUCH!', 'toast.golden': 'GOLDEN!', 'toast.heart': '+1 LIFE',
      'toast.wave': 'FRUIT RAIN!', 'toast.last': 'LAST 5 SECONDS!', 'end.win': 'BASKET FULL!', 'end.sub': 'Level {n} cleared',
      'toast.bombrain': 'BOMB RAIN!', 'ad.left': 'Only {n} more points!',
    },
    tr: {
      'title.name': 'MEYVE AKINI', 'title.tag': 'MEYVELERİ YAKALA · BOMBALARDAN KAÇ', 'hint.drag': 'SÜRÜKLE VE YAKALA', 'hint.mouse': 'FAREYİ OYNAT', 'obj': '{n} puana ulaş!',
      'toast.combo': 'KOMBO x{n}!', 'toast.fever': 'ÇILGINLIK x{n}!', 'toast.ouch': 'AH!', 'toast.golden': 'ALTIN!', 'toast.heart': '+1 CAN',
      'toast.wave': 'MEYVE YAĞMURU!', 'toast.last': 'SON 5 SANİYE!', 'end.win': 'SEPET DOLDU!', 'end.sub': '{n}. seviye tamam',
      'toast.bombrain': 'BOMBA YAĞMURU!', 'ad.left': 'Sadece {n} puan kaldı!',
    },
  },
  titleKey: 'title.name',
  taglineKey: 'title.tag',
  hintKey: 'hint.drag',
  tutorial: { gesture: 'drag-h', x: 195, y: 712, span: 90, labelKey: 'hint.drag' },
  hoverSteer: true, // desktop: a hovering mouse counts as a held drag → the basket follows the cursor without a click

  init(ctx) {
    const s = ctx.sprites; scene.sprites = {};
    for (const [k, a] of Object.entries(ART)) scene.sprites[k] = s.outline(s.pixel(a.rows, a.pal, { scale: 4 }), '#1c1a2e', 4);
    scene.sprites.cloud = s.pixel(CLOUD, { w: '#ffffff', b: '#d6ecff' }, { scale: 6 });
    for (let i = 0; i < 4; i += 1) scene.clouds.push({ x: ctx.rng.range(-60, 420), y: 70 + i * 62 + ctx.rng.range(-10, 10), v: ctx.rng.range(8, 20), s: ctx.rng.range(0.7, 1.15) });
    for (let i = 0; i < 26; i += 1) scene.tufts.push({ x: ctx.rng.range(-120, 510), y: ctx.rng.range(4, 80), c: ctx.rng.pick(['#ffffff', '#ffd23f', '#ff7eb3', null, null]) });
  },

  setup(ctx) {
    const p = ctx.params; const lvl = ctx.level;
    Object.assign(ctx.data, {
      x: 195, items: [], spawnT: 0.5, waveT: p.waveEvery * 0.6, lives: p.lives, combo: 0, best: 0,
      fever: 0, feverLevel: 0, squash: 0, pile: [], lastTick: 99, objT: 3.2, adFail: false,
      target: Math.round(p.targetScore * (1 + 0.5 * (lvl - 1)) / 10) * 10,
      speedMul: 1 + p.levelSpeedUp * (lvl - 1),
    });
    ctx.ui.progress(null); hud(ctx);
    ctx.ui.objective(ctx.t('obj', { n: ctx.data.target }));
  },

  start(ctx) {
    hud(ctx);
    if (ctx.level > 1) ctx.ui.toast(ctx.t('ui.level', { n: ctx.level }), { size: 'xl', color: '#ffd23f' });
    if (ctx.level >= 3) { ctx.ui.banner(ctx.t('ui.hard'), 1600); ctx.audio.sfx('boss', { pitch: 1.4 }); }
  },

  update(ctx, dt) {
    const d = ctx.data; const p = ctx.params; const inp = ctx.input; const M = ctx.math;
    const W = 390; const by = rimY(ctx);
    scene.t += dt;
    for (const c of scene.clouds) c.x = c.x > 470 ? -110 : c.x + c.v * dt;

    // move: finger / mouse x with a little smoothing; arrow keys nudge the target and win until the pointer moves again
    if (inp.axisX) { d.keys = true; d.tx = (d.tx ?? d.x) + inp.axisX * 560 * dt; }
    else if (inp.down && (inp.dx || !d.keys)) { d.keys = false; d.tx = inp.x; }
    if (inp.pointerType) this.tutorial.labelKey = inp.pointerType === 'mouse' ? 'hint.mouse' : 'hint.drag'; // idle hint names the device
    if (d.tx !== undefined) d.tx = M.clamp(d.tx, p.basketWidth / 2, W - p.basketWidth / 2);
    d.x = M.damp(d.x, d.tx ?? d.x, p.followSpeed, dt);
    d.squash = Math.max(0, d.squash - dt * 4);
    if (d.objT > 0 && (d.objT -= dt) <= 0) ctx.ui.objective(null);

    // spawning: steady trickle + periodic fruit waves (the "so many!" moment)
    d.spawnT -= dt; d.waveT -= dt;
    // ad funnel: in the forced near-miss level a wall of bombs covers the whole width once the basket is ~90% full
    if (!d.adFail && ctx.ad.check(ctx.score / d.target)) startBombRain(ctx);
    if (d.spawnT <= 0 && !d.adFail) { d.spawnT = (1 / p.spawnRate) * ctx.rng.range(0.6, 1.3) / (d.fever > 0 ? 1.6 : 1); spawn(ctx, pickKind(ctx), ctx.rng.range(34, W - 34), -30); }
    if (d.waveT <= 0 && !d.adFail) {
      d.waveT = p.waveEvery; const n = 5; const dir = ctx.rng.sign(); const x0 = ctx.rng.range(60, 150);
      for (let i = 0; i < n; i += 1) spawn(ctx, ctx.rng.pick(FRUITS), dir > 0 ? x0 + i * 52 : W - x0 - i * 52, -30 - i * 46);
      ctx.ui.banner(ctx.t('toast.wave'), 900); ctx.audio.sfx('whoosh');
    }

    // items
    const speed = p.fallSpeed * d.speedMul * (1 + p.speedGrowth * (ctx.time / 30));
    for (const it of d.items) {
      it.y += speed * it.vy * dt; it.x += it.vx * dt; it.rot += it.vr * dt;
      if (it.x < 24 || it.x > W - 24) it.vx *= -1;
      const reach = p.basketWidth / 2 - 6 + 10 * p.fruitScale;
      if (!it.done && it.y >= by - 8 && it.y <= by + 26 && Math.abs(it.x - d.x) < reach) { it.done = true; catchItem(ctx, it); if (ctx.state !== 'play') return; }
      if (!it.done && it.y > groundY() + 6) { it.done = true; missItem(ctx, it); if (ctx.state !== 'play') return; }
    }
    d.items = d.items.filter((it) => !it.done);

    // fever countdown
    if (d.fever > 0) { d.fever -= dt; if (d.fever <= 0) { d.fever = 0; ctx.emit('fever-end', {}); } }

    // last five seconds: tick + callout (urgency)
    const left = Math.ceil(p.maxPlayTime - ctx.time);
    if (left <= 5 && left !== d.lastTick && left > 0) { d.lastTick = left; ctx.audio.sfx('tick', { pitch: 1 + (5 - left) * 0.08 }); if (left === 5) ctx.ui.toast(ctx.t('toast.last'), { color: '#ffd23f' }); }

    if (ctx.score >= d.target && !d.adFail) { win(ctx); return; }
    hud(ctx);
  },

  idle(ctx, dt) { scene.t += dt; for (const c of scene.clouds) c.x = c.x > 470 ? -110 : c.x + c.v * dt; },

  onTimeUp(ctx) {
    const d = ctx.data;
    if (ctx.score >= d.target) win(ctx);
    else ctx.end({ win: false, reason: 'time', progress: ctx.score / d.target });
  },

  render(ctx) {
    const g = ctx.g; const d = ctx.data; const p = ctx.params; const v = ctx.view; const D = ctx.draw;
    const pal = PALETTES[p.background] || PALETTES['Sunny Orchard'];
    const L = v.left; const R = v.right; const Wd = R - L; const gy = groundY();

    // sky + sun + rays
    const sky = g.createLinearGradient(0, v.top, 0, gy);
    sky.addColorStop(0, pal.skyTop); sky.addColorStop(1, pal.skyBottom);
    g.fillStyle = sky; g.fillRect(L, v.top, Wd, gy - v.top);
    const sx = 300; const sy = 150;
    if (p.sunRays || d.fever > 0) {
      g.save(); g.translate(sx, sy); g.rotate(scene.t * (d.fever > 0 ? 0.9 : 0.12));
      g.globalAlpha = d.fever > 0 ? 0.28 + 0.1 * Math.sin(scene.t * 10) : 0.14; g.fillStyle = d.fever > 0 ? '#fff6a8' : pal.sun;
      for (let i = 0; i < 12; i += 1) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(900, -70); g.lineTo(900, 70); g.closePath(); g.fill(); }
      g.restore();
    }
    const glow = g.createRadialGradient(sx, sy, 10, sx, sy, 120); glow.addColorStop(0, pal.sun); glow.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = glow; g.fillRect(sx - 120, sy - 120, 240, 240);
    g.fillStyle = pal.sun; g.beginPath(); g.arc(sx, sy, 38, 0, Math.PI * 2); g.fill();
    for (const c of scene.clouds) D.sprite(g, scene.sprites?.cloud, c.x, c.y, { scale: c.s, alpha: 0.95 });

    // hills (two parallax layers) + ground
    hill(g, L, R, v.bottom, gy - 150, 26, 0.012, scene.t * 0.05, pal.hillFar);
    hill(g, L, R, v.bottom, gy - 70, 20, 0.018, 1.7 + scene.t * 0.1, pal.hillNear);
    g.fillStyle = pal.ground; g.fillRect(L, gy, Wd, v.bottom - gy);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(L, gy, Wd, 6);
    g.fillStyle = pal.dirt; g.fillRect(L, gy + 60, Wd, v.bottom - gy - 60);
    for (const t of scene.tufts) {
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(t.x, gy + t.y, 8, 4); g.fillRect(t.x + 2, gy + t.y - 4, 4, 4);
      if (t.c) { g.fillStyle = t.c; g.fillRect(t.x + 2, gy + t.y - 8, 4, 4); }
    }

    // falling items: ground shadow grows as they approach, sprite on top
    const sc = 0.9 * p.fruitScale;
    for (const it of d.items || []) {
      const k = Math.max(0, Math.min(1, it.y / gy));
      D.shadow(g, it.x, gy + 8, 6 + 14 * k * sc, 3 + 4 * k, 0.12 + 0.18 * k);
    }
    for (const it of d.items || []) {
      const spr = scene.sprites?.[it.kind];
      D.sprite(g, spr, it.x, it.y, { scale: sc * (it.kind === 'golden' ? 1.15 + 0.08 * Math.sin(scene.t * 12) : 1), rot: it.kind === 'bomb' ? Math.sin(scene.t * 9 + it.x) * 0.15 : it.rot, ay: 0.5 });
      if (it.kind === 'bomb') { // fuse spark
        const f = 4 + 3 * Math.abs(Math.sin(scene.t * 30 + it.y));
        g.fillStyle = '#ffd23f'; g.beginPath(); g.arc(it.x + 13 * sc, it.y - 24 * sc, f, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#ff6a2b'; g.beginPath(); g.arc(it.x + 13 * sc, it.y - 24 * sc, f * 0.5, 0, Math.PI * 2); g.fill();
      }
    }

    // basket: shadow, pile peeking over the rim, woven body, rim
    const by = rimY(ctx); const bw = p.basketWidth; const bh = 54; const sq = d.squash || 0;
    const x = d.x ?? 195; const w = bw * (1 + sq * 0.12); const h = bh * (1 - sq * 0.15); const top = by + bh - h;
    D.shadow(g, x, gy + 10, w * 0.55, 10, 0.25);
    if (d.fever > 0) { g.save(); g.globalAlpha = 0.45 + 0.25 * Math.sin(scene.t * 14); D.roundRect(g, x - w / 2 - 10, top - 14, w + 20, h + 22, 22, '#fff27a'); g.restore(); }
    (d.pile || []).forEach((kind, i) => D.sprite(g, scene.sprites?.[kind], x - w / 2 + 22 + ((i * 37) % Math.max(1, w - 44)), top - 4 - (i % 2) * 6, { scale: 0.62, ay: 0.5, rot: (i % 3 - 1) * 0.3 }));
    const base = p.basketColor; const dark = ctx.math.shade(base, -0.28); const light = ctx.math.shade(base, 0.22);
    g.fillStyle = base; g.beginPath(); g.moveTo(x - w / 2, top); g.lineTo(x + w / 2, top); g.lineTo(x + w / 2 - 14, top + h); g.lineTo(x - w / 2 + 14, top + h); g.closePath(); g.fill();
    g.save(); g.clip();
    g.fillStyle = dark; for (let r = 0; r < 4; r += 1) for (let c = -1; c < w / 16 + 1; c += 1) if ((r + c) % 2 === 0) g.fillRect(x - w / 2 + c * 16, top + 8 + r * 12, 16, 6);
    g.restore();
    g.lineWidth = 4; g.strokeStyle = '#1c1a2e'; g.beginPath(); g.moveTo(x - w / 2, top); g.lineTo(x + w / 2, top); g.lineTo(x + w / 2 - 14, top + h); g.lineTo(x - w / 2 + 14, top + h); g.closePath(); g.stroke();
    D.roundRect(g, x - w / 2 - 6, top - 6, w + 12, 14, 7, light, '#1c1a2e', 4);
  },

  bot(ctx) {
    const d = ctx.data; const p = ctx.params; const by = rimY(ctx);
    const items = d.items || [];
    const danger = items.filter((it) => it.kind === 'bomb' && it.y > by - 200 && it.y < by + 10);
    const good = items.filter((it) => it.kind !== 'bomb' && it.y < by + 4).sort((a, b) => (b.y + (b.kind === 'golden' ? 120 : 0)) - (a.y + (a.kind === 'golden' ? 120 : 0)));
    let tx = good[0] ? good[0].x : 195;
    for (const b of danger) if (Math.abs(b.x - tx) < p.basketWidth * 0.75) tx = b.x > tx ? b.x - p.basketWidth : b.x + p.basketWidth;
    return { pointer: { down: true, x: ctx.math.clamp(tx, 40, 350), y: by + 30 } };
  },
});

/* ------------------------------------------------------------------ helpers */
// sound pacing: the same cue at most every `gap` s on the audio clock, so fast repeats stay soft and never drill
const SND_T = {};
function sndGap(ctx, key, gap) {
  const ac = ctx.audio.context; const now = ac ? ac.currentTime : performance.now() / 1000;
  if (now - (SND_T[key] ?? -9) < gap) return false; SND_T[key] = now; return true;
}
const sndJit = (p, a = 0.03) => p * (1 - a + Math.random() * 2 * a); // tiny pitch variation for repeated cues

function groundY() { return 748; }
function rimY() { return groundY() - 76; }

function pickKind(ctx) {
  const p = ctx.params; const d = ctx.data; const r = ctx.rng();
  if (d.lives < p.lives && r < p.heartChance) return 'heart';
  if (r < p.heartChance + p.goldenChance) return 'golden';
  // the scripted near-miss level eases bombs so the player gets close before the bomb rain
  if (d.fever <= 0 && ctx.rng.chance(p.bombChance * (ctx.ad.forceFail ? 0.5 : 1))) return 'bomb';
  return ctx.rng.pick(FRUITS);
}

function spawn(ctx, kind, x, y) {
  ctx.data.items.push({ kind, x, y, vy: kind === 'bomb' ? 1.08 : ctx.rng.range(0.9, 1.1), vx: ctx.rng.range(-18, 18), rot: ctx.rng.range(-0.3, 0.3), vr: ctx.rng.range(-2, 2) });
}

function catchItem(ctx, it) {
  const d = ctx.data; const p = ctx.params; const fx = ctx.fx; const by = rimY();
  const juice = ART[it.kind].juice;
  d.squash = 1;
  if (it.kind === 'bomb') {
    d.lives -= 1; d.combo = 0; d.fever = 0;
    fx.burst(it.x, by, { count: 36, colors: ['#ffd23f', '#ff6a2b', '#22252d', '#ffffff'], speed: 420, size: 10, shape: 'square' });
    fx.ring(it.x, by, { color: '#ff6a2b', radius: 120, width: 10 }); fx.flash('#ff2a2a', 0.45, 220); fx.shake(14, 380); fx.freeze(90); fx.haptic(60);
    ctx.audio.sfx('explosion'); ctx.emit('hit', { lives: d.lives });
    if (d.adFail) { // the bomb rain wipes the basket: scripted near-miss
      d.lives = 0; hud(ctx);
      const left = Math.max(1, Math.ceil((d.target - ctx.score) / 10) * 10);
      ctx.ad.fail({ progress: Math.min(0.97, ctx.score / d.target), nearText: ctx.t('ad.left', { n: left }) });
      return;
    }
    ctx.ui.toast(ctx.t('toast.ouch'), { color: '#ff5a5a' });
    hud(ctx);
    if (d.lives <= 0) ctx.end({ win: false, reason: 'bombs', progress: ctx.score / d.target });
    return;
  }
  if (it.kind === 'heart') {
    d.lives = Math.min(p.lives, d.lives + 1); ctx.audio.sfx('chime'); ctx.ui.toast(ctx.t('toast.heart'), { color: '#ff7aa2' });
    fx.burst(it.x, by, { count: 18, colors: [juice, '#fff'], shape: 'star' }); hud(ctx); return;
  }
  d.combo += 1; d.best = Math.max(d.best, d.combo);
  const mult = d.fever > 0 ? p.feverMultiplier : 1;
  let pts = (it.kind === 'golden' ? p.goldenValue : p.fruitValue) * mult;
  if (d.combo % p.comboStep === 0) {
    pts += p.fruitValue * 3 * mult; ctx.audio.sfx('combo', { pitch: 1 + Math.min(d.combo, 30) * 0.02 });
    ctx.ui.toast(ctx.t('toast.combo', { n: d.combo }), { color: '#ffd23f' }); fx.ring(d.x, by, { color: '#ffd23f', radius: 110 });
  }
  ctx.score += pts;
  if (it.kind === 'golden' || sndGap(ctx, 'coin', 0.065)) ctx.audio.sfx(it.kind === 'golden' ? 'sparkle' : 'coin', { pitch: sndJit(1 + Math.min(d.combo, 16) * 0.05), vol: it.kind === 'golden' ? 1 : 0.6 });
  if (it.kind === 'golden') ctx.audio.sfx('gem');
  fx.burst(it.x, by + 4, { count: it.kind === 'golden' ? 30 : 14, colors: [juice, '#ffffff', ctx.math.shade(juice, -0.2)], speed: 260, size: 8, lift: 160, shape: it.kind === 'golden' ? 'star' : 'circle' });
  fx.float(`+${pts}`, it.x, by - 30, { color: mult > 1 ? '#fff27a' : '#ffffff', size: it.kind === 'golden' ? 40 : 30 });
  if (it.kind === 'golden') { ctx.ui.toast(ctx.t('toast.golden'), { color: '#ffd23f' }); fx.flash('#fff6c2', 0.35, 160); fx.freeze(50); }
  d.pile.push(it.kind); if (d.pile.length > 6) d.pile.shift();
  if (d.fever <= 0 && d.combo >= p.feverAt && d.combo % p.feverAt === 0) {
    d.fever = p.feverSeconds; d.feverLevel += 1;
    ctx.ui.toast(ctx.t('toast.fever', { n: p.feverMultiplier }), { size: 'xl', color: '#fff27a', ms: 1300 });
    ctx.audio.sfx('powerup'); ctx.audio.sfx('whistle', { pitch: 1.2 }); fx.flash('#ffffff', 0.5, 200); fx.confetti(60); fx.slowmo(0.5, 350); ctx.emit('fever', { combo: d.combo });
  }
  ctx.emit('catch', { kind: it.kind, combo: d.combo });
}

function missItem(ctx, it) {
  const d = ctx.data; const p = ctx.params; const gy = groundY();
  if (it.kind === 'bomb') { ctx.fx.burst(it.x, gy, { count: 10, colors: ['#9a8a7a', '#c9b8a6'], speed: 120, size: 6, lift: 80 }); return; }
  if (it.kind === 'heart') return;
  ctx.fx.burst(it.x, gy, { count: 10, colors: [ART[it.kind].juice], speed: 160, size: 7, lift: 60, gravity: 900 });
  ctx.audio.sfx('thud', { vol: 0.35, pitch: 1.3 });
  if (d.combo >= 3) ctx.fx.float('MISS', it.x, gy - 30, { color: '#ff9a9a', size: 22 });
  d.combo = 0;
  if (p.missCostsLife) {
    d.lives -= 1; ctx.audio.sfx('bad'); hud(ctx);
    if (d.lives <= 0) ctx.end({ win: false, reason: 'missed', progress: ctx.score / d.target });
  }
}

function startBombRain(ctx) {
  const d = ctx.data; d.adFail = true; d.fever = 0;
  for (const it of d.items) if (it.kind !== 'bomb' && !it.done) { it.done = true; ctx.fx.burst(it.x, it.y, { count: 8, colors: [ART[it.kind].juice, '#ffffff'], speed: 180, size: 6 }); }
  d.items = d.items.filter((it) => !it.done);
  for (let i = 0; i < 10; i += 1) spawn(ctx, 'bomb', 30 + i * 36.6, -40 - (i % 2) * 34);
  for (const it of d.items.slice(-10)) { it.vx = 0; it.vy = 1.15; }
  ctx.ui.banner(ctx.t('toast.bombrain'), 1400); ctx.ui.toast('!!!', { color: '#ff5a5a', size: 'xl' });
  ctx.audio.sfx('boss'); ctx.fx.flash('#ff2a2a', 0.25, 200); ctx.fx.shake(8, 300);
}

function win(ctx) {
  const d = ctx.data; const p = ctx.params;
  const stars = d.lives >= p.lives ? 3 : d.lives >= Math.ceil(p.lives / 2) ? 2 : 1;
  ctx.fx.slowmo(0.35, 500);
  ctx.end({ win: true, title: ctx.t('end.win'), sub: ctx.t('end.sub', { n: ctx.level }), stars, next: ctx.level < 3 });
}

function hud(ctx) {
  const d = ctx.data; const p = ctx.params;
  ctx.ui.hearts(Math.max(0, d.lives), p.lives);
  ctx.ui.counter('time', `${Math.max(0, Math.ceil(p.maxPlayTime - ctx.time))}s`, { icon: 'clock', side: 'right', bump: false });
  ctx.ui.counter('combo', d.combo >= 3 ? `x${d.combo}` : null, { icon: 'bolt', side: 'right', color: d.fever > 0 ? '#fff27a' : undefined });
  if (ctx.state === 'play') ctx.ui.progress(Math.min(1, ctx.score / d.target), { label: `${Math.floor(ctx.score)} / ${d.target}` });
}

function hill(g, L, R, bottom, baseY, amp, freq, phase, color) {
  g.fillStyle = color; g.beginPath(); g.moveTo(L, bottom);
  for (let x = L; x <= R + 8; x += 8) g.lineTo(x, baseY + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase * 1.7) * amp * 0.4);
  g.lineTo(R, bottom); g.closePath(); g.fill();
}
