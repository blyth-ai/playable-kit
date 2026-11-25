/*! Blyth Play Kernel v0.4.1 | Required Notice: Copyright (c) 2026 Blyth AI Inc. (https://blyth.ai) | License: PolyForm Shield 1.0.0 (https://polyformproject.org/licenses/shield/1.0.0) with an additional permission for the games and ads you make: https://www.npmjs.com/package/@blyth/playable-kit */
/*
 * Blyth Play Kernel v0.4.1
 * Single-file playable runtime: layout, input, fixed-step loop, seeded RNG, audio
 * (procedural SFX + styled music), ad-grade UI (intro logo, tutorial hand, HUD counters,
 * progress track, toasts, star end card, near-miss bar, CTA), juice (particles, floating
 * text, rings, flash, shake, slow-mo, confetti), pixel sprites + pixel font, tunable
 * params with skins, i18n, host messaging (window.playable compatible), MRAID gating,
 * levels and test/trailer hooks.
 *
 * A game is ONE object passed to createGame(). The kernel owns everything that is the
 * same in every game; the game owns its rules, world and drawing.
 */
import { PK_FONT_FACES, PK_FONT_FAMILY } from './fonts.js';

const SHARED_PARAMS = {
  difficulty: { label: 'Difficulty', group: 'Difficulty', type: 'enum', def: 'normal', options: ['easy', 'normal', 'hard'], apply: 'restart', marketer: true },
  maxPlayTime: { label: 'Time cap', group: 'Timing', type: 'int', def: 90, min: 15, max: 300, step: 1, unit: 's', apply: 'restart', marketer: true },
  hintDelay: { label: 'Hint after idle', group: 'Timing', type: 'float', def: 3, min: 1, max: 10, step: 0.5, unit: 's', apply: 'live', marketer: true },
  ctaText: { label: 'CTA label', group: 'Branding', type: 'text', def: '', maxLen: 24, apply: 'live', marketer: true },
  storeUrlIos: { label: 'iOS store URL', group: 'Branding', type: 'text', def: '', maxLen: 200, apply: 'live', marketer: true },
  storeUrlAndroid: { label: 'Android store URL', group: 'Branding', type: 'text', def: '', maxLen: 200, apply: 'live', marketer: true },
  endTitle: { label: 'Result title override', group: 'End card', type: 'text', def: '', maxLen: 40, apply: 'live', marketer: true },
  endSub: { label: 'Result subtitle override', group: 'End card', type: 'text', def: '', maxLen: 80, apply: 'live', marketer: true },
  uiSkin: { label: 'Interface skin', group: 'Colors', sub: 'Interface', type: 'enum', def: 'candy', options: ['candy', 'frost', 'classic', 'parchment', 'neon'], apply: 'live', marketer: true },
  uiAccent: { label: 'Interface accent', group: 'Colors', sub: 'Interface', type: 'color', def: '#ff5b22', apply: 'live', marketer: true },
  uiPanel: { label: 'Interface panel colour', group: 'Colors', sub: 'Interface', type: 'color', def: '#1b1638', apply: 'live', marketer: true },
  cameraShake: { label: 'Screen shake', group: 'Camera', sub: 'Motion', type: 'float', def: 1, min: 0, max: 2, step: 0.05, unit: 'x', apply: 'live', marketer: true },
  musicStyle: { label: 'Music style', group: 'Sound', type: 'enum', def: 'upbeat', options: ['upbeat', 'chill', 'epic', 'chiptune', 'funky', 'tropical', 'spooky', 'heroic', 'racing', 'carnival', 'dreamy', 'arcade', 'off'], apply: 'live', marketer: true },
  sfxVolume: { label: 'Sound effects volume', group: 'Sound', type: 'int', def: 60, min: 0, max: 100, step: 1, unit: '%', apply: 'live', marketer: true },
  musicVolume: { label: 'Music volume', group: 'Sound', type: 'int', def: 25, min: 0, max: 100, step: 1, unit: '%', apply: 'live', marketer: true },
  language: { label: 'Language', group: 'Language', type: 'enum', def: 'auto', options: ['auto'], apply: 'live', marketer: true },
  // Ad funnel (HANDOFF §4). Off by default; on by default when meta.mode === 'AD'.
  adMode: { label: 'Ad mode (CTA end card)', group: 'Ad', type: 'bool', def: false, apply: 'restart', marketer: true },
  adFailLevel: { label: 'Forced near-miss from level', group: 'Ad', type: 'int', def: 0, min: 0, max: 5, step: 1, apply: 'restart', marketer: true },
  adFailAt: { label: 'Near-miss progress', group: 'Ad', type: 'float', def: 0.9, min: 0.6, max: 0.98, step: 0.01, apply: 'live', marketer: true },
  adGateLevel: { label: 'Lock levels after', group: 'Ad', type: 'int', def: 0, min: 0, max: 5, step: 1, apply: 'restart', marketer: true },
  maxRetries: { label: 'Retries before CTA only', group: 'Ad', type: 'int', def: 1, min: 0, max: 9, step: 1, apply: 'restart', marketer: true },
};
export const SHARED_PARAM_KEYS = Object.keys(SHARED_PARAMS);

const DEFAULT_STRINGS = {
  en: { 'ui.tap': 'TAP TO PLAY', 'ui.retry': 'PLAY AGAIN', 'ui.next': 'NEXT LEVEL', 'ui.score': 'SCORE', 'ui.best': 'BEST', 'ui.win': 'YOU WIN!', 'ui.lose': 'GAME OVER', 'ui.time': "TIME'S UP", 'ui.loading': 'LOADING', 'ui.close': 'SO CLOSE!', 'ui.level': 'LEVEL {n}', 'ui.hard': 'HARD LEVEL!', 'cta.play': 'PLAY NOW', 'ad.sub': 'Download to finish the level!', 'ad.retry': 'Try again', 'ad.locked': 'LEVEL {n} LOCKED', 'ad.continue': 'Continue in the app', 'ad.fail': 'NOOO!', 'ui.final': 'ALL LEVELS CLEAR!', 'ui.finalSub': 'Download the full game to keep playing!', 'ui.again': 'Play again', 'cta.full': 'DOWNLOAD & PLAY' },
  tr: { 'ui.tap': 'OYNAMAK İÇİN DOKUN', 'ui.retry': 'TEKRAR OYNA', 'ui.next': 'SONRAKİ BÖLÜM', 'ui.score': 'SKOR', 'ui.best': 'EN İYİ', 'ui.win': 'KAZANDIN!', 'ui.lose': 'OYUN BİTTİ', 'ui.time': 'SÜRE DOLDU', 'ui.loading': 'YÜKLENİYOR', 'ui.close': 'ÇOK YAKINDI!', 'ui.level': 'BÖLÜM {n}', 'ui.hard': 'ZOR BÖLÜM!', 'cta.play': 'HEMEN OYNA', 'ad.sub': 'Bölümü bitirmek için indir!', 'ad.retry': 'Tekrar dene', 'ad.locked': 'BÖLÜM {n} KİLİTLİ', 'ad.continue': 'Uygulamada devam et', 'ad.fail': 'HAYIR!', 'ui.final': 'TÜM BÖLÜMLER BİTTİ!', 'ui.finalSub': 'Oynamaya devam etmek için tam oyunu indir!', 'ui.again': 'Tekrar oyna', 'cta.full': 'İNDİR VE OYNA' },
};

const PARAM_TYPES = new Set(['int', 'float', 'enum', 'color', 'text', 'bool']);

function mulberry32(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng = () => next();
  rng.range = (a0, b0) => a0 + (b0 - a0) * next();
  rng.int = (a0, b0) => Math.floor(a0 + (b0 - a0 + 1) * next());
  rng.pick = (arr) => arr[Math.floor(next() * arr.length)];
  rng.chance = (p) => next() < p;
  rng.sign = () => (next() < 0.5 ? -1 : 1);
  rng.shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i -= 1) { const j = Math.floor(next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  return rng;
}

function query() {
  try { return new URL(document.baseURI || location.href).searchParams; } catch { return new URLSearchParams(''); }
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

export const FONT = `"${PK_FONT_FAMILY}", "Arial Rounded MT Bold", "Arial Black", system-ui, sans-serif`;

export const ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  outCubic: (t) => 1 - (1 - t) ** 3,
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t) => { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; },
  outElastic: (t) => (t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  outBounce: (t) => { const n1 = 7.5625; const d1 = 2.75; if (t < 1 / d1) return n1 * t * t; if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75; if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375; return n1 * (t -= 2.625 / d1) * t + 0.984375; },
};

export const math = {
  clamp, lerp,
  /** Frame-rate independent smoothing toward b (lambda ~ 4..20). */
  damp: (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt)),
  approach: (a, b, step) => (a < b ? Math.min(b, a + step) : Math.max(b, a - step)),
  wrap: (v, a, b) => { const r = b - a; return ((((v - a) % r) + r) % r) + a; },
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  angle: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
  hexToRgb: (hex) => { const n = parseInt(String(hex).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; },
  mixColor: (a, b, t) => { const A = math.hexToRgb(a); const B = math.hexToRgb(b); return `#${A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join('')}`; },
  shade: (hex, amt) => (amt >= 0 ? math.mixColor(hex, '#ffffff', amt) : math.mixColor(hex, '#000000', -amt)),
};

function validateSchema(params) {
  const errors = [];
  for (const [key, p] of Object.entries(params)) {
    const at = `params.${key}`;
    if (!p || typeof p !== 'object') { errors.push(`${at}: must be an object`); continue; }
    if (!PARAM_TYPES.has(p.type)) errors.push(`${at}: type must be one of ${[...PARAM_TYPES].join(', ')}`);
    if (!p.label) errors.push(`${at}: label is required`);
    if (!p.group) errors.push(`${at}: group is required`);
    if (!('def' in p)) errors.push(`${at}: def is required`);
    if (p.apply !== 'live' && p.apply !== 'restart') errors.push(`${at}: apply must be "live" or "restart"`);
    if ((p.type === 'int' || p.type === 'float')) {
      if (typeof p.min !== 'number' || typeof p.max !== 'number') errors.push(`${at}: numeric params need min and max`);
      else if (!(p.def >= p.min && p.def <= p.max)) errors.push(`${at}: def must be within min..max`);
    }
    if (p.type === 'enum' && (!Array.isArray(p.options) || !p.options.includes(p.def))) errors.push(`${at}: enum needs options that include def`);
    if (p.type === 'color' && !/^#[0-9a-fA-F]{6}$/.test(String(p.def))) errors.push(`${at}: color def must be #rrggbb`);
  }
  return errors;
}

function coerce(p, raw) {
  if (raw === undefined || raw === null) return p.def;
  switch (p.type) {
    case 'int': { const n = Math.round(Number(raw)); return Number.isFinite(n) ? clamp(n, p.min, p.max) : p.def; }
    case 'float': { const n = Number(raw); return Number.isFinite(n) ? clamp(n, p.min, p.max) : p.def; }
    case 'bool': return raw === true || raw === 'true' || raw === 1 || raw === '1';
    case 'enum': return p.options.includes(raw) ? raw : p.def;
    case 'color': return /^#[0-9a-fA-F]{6}$/.test(String(raw)) ? String(raw).toLowerCase() : p.def;
    case 'text': return String(raw).slice(0, p.maxLen || 120);
    default: return p.def;
  }
}

function b64ToBytes(b64) {
  const s = atob(b64.includes(',') ? b64.split(',').pop() : b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i);
  return out;
}

/* ------------------------------------------------------------------ audio */

/*
 * Procedural music: every style has its own groove (drums, bass line, comping, instruments) and every game
 * gets its own melody — the motif is generated from meta.slug + style, so two games never share a tune.
 */
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], mixo: [0, 2, 4, 5, 7, 9, 10],
  harmonic: [0, 2, 3, 5, 7, 8, 11], penta: [0, 2, 4, 7, 9], minpenta: [0, 3, 5, 7, 10], lydian: [0, 2, 4, 6, 7, 9, 11],
};
// progs: chord roots as scale-degree indexes. rhythms: 16-step melody onsets. bass: [step, degreeOffset]. comp: steps for chords.
const MUSIC_STYLES = {
  upbeat: { bpm: 116, scale: 'major', key: 0, progs: [[0, 4, 5, 3], [0, 5, 3, 4], [3, 4, 0, 5]], rhythms: [[1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0], [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0]],
    lead: 'bell', bass: 'pluck', bassPat: [[0, 0], [6, 0], [8, 0], [11, 4], [14, 0]], comp: 'arp8', compInst: 'keys', drums: { k: [0, 8, 10], s: [4, 12], h: [2, 6, 10, 14], c: [12] }, delay: 0.2 },
  chill: { bpm: 82, scale: 'dorian', key: -3, swing: 0.16, progs: [[0, 3, 1, 4], [0, 5, 3, 4]], rhythms: [[1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0]],
    lead: 'keys', bass: 'sine', bassPat: [[0, 0], [7, 0], [10, 4]], comp: 'pad', compInst: 'pad', drums: { k: [0, 7, 10], s: [8], h: [4, 12], sh: [2, 6, 10, 14] }, delay: 0.26, lofi: true },
  epic: { bpm: 124, scale: 'minor', key: -2, progs: [[0, 5, 2, 6], [0, 3, 5, 4], [0, 6, 5, 6]], rhythms: [[1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0], [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]],
    lead: 'brass', bass: 'saw', bassPat: [[0, 0], [2, 0], [4, 0], [6, 0], [8, 0], [10, 0], [12, 0], [14, 0]], comp: 'pad', compInst: 'strings', drums: { k: [0, 3, 8, 11], s: [4, 12], t: [14, 15], h: [2, 6, 10] }, delay: 0.14 },
  chiptune: { bpm: 144, scale: 'major', key: 2, progs: [[0, 3, 4, 4], [0, 5, 3, 4], [0, 4, 5, 3]], rhythms: [[1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0], [1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0]],
    lead: 'square', bass: 'square8', bassPat: [[0, 0], [2, 7], [4, 0], [6, 7], [8, 0], [10, 7], [12, 0], [14, 7]], comp: 'arp16', compInst: 'chip', drums: { k: [0, 8], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14] }, delay: 0.1 },
  funky: { bpm: 106, scale: 'dorian', key: 0, swing: 0.08, progs: [[0, 0, 3, 3], [0, 3, 0, 4]], rhythms: [[1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0], [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]],
    lead: 'clav', bass: 'slap', bassPat: [[0, 0], [3, 0], [6, 7], [7, 0], [10, 0], [12, 4], [14, 7]], comp: 'stabs', compInst: 'clav', drums: { k: [0, 6, 10], s: [4, 12], gs: [7, 15], h: [0, 2, 4, 6, 8, 10, 12, 14] }, delay: 0.12 },
  tropical: { bpm: 102, scale: 'major', key: 5, progs: [[0, 3, 4, 0], [0, 5, 3, 4]], rhythms: [[1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0], [0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0]],
    lead: 'marimba', bass: 'sine', bassPat: [[0, 0], [3, 0], [8, 4], [11, 4]], comp: 'offbeat', compInst: 'pluck', drums: { k: [0, 8], s: [6, 14], sh: [0, 2, 4, 6, 8, 10, 12, 14], rim: [3, 11] }, delay: 0.22 },
  spooky: { bpm: 90, scale: 'harmonic', key: -4, progs: [[0, 5, 3, 4], [0, 3, 0, 4]], rhythms: [[1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0], [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0]],
    lead: 'bell', bass: 'sine', bassPat: [[0, 0], [8, 0]], comp: 'arp8', compInst: 'bell', drums: { k: [0, 10], t: [12], h: [4, 12] }, delay: 0.3 },
  heroic: { bpm: 112, scale: 'major', key: -5, progs: [[0, 4, 5, 3], [0, 3, 4, 4], [5, 3, 0, 4]], rhythms: [[1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0], [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0]],
    lead: 'flute', bass: 'pluck', bassPat: [[0, 0], [4, 0], [8, 0], [12, 4]], comp: 'march', compInst: 'strings', drums: { k: [0, 8], s: [4, 12, 14], h: [2, 6, 10] }, delay: 0.18 },
  racing: { bpm: 150, scale: 'minor', key: 1, progs: [[0, 5, 6, 4], [0, 0, 5, 6]], rhythms: [[1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0], [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1]],
    lead: 'saw', bass: 'saw', bassPat: [[0, 0], [1, 0], [2, 7], [3, 0], [4, 0], [5, 0], [6, 7], [7, 0], [8, 0], [9, 0], [10, 7], [11, 0], [12, 0], [13, 0], [14, 7], [15, 0]], comp: 'none', compInst: 'saw', drums: { k: [0, 4, 8, 12], s: [4, 12], h: [2, 6, 10, 14], c: [12] }, delay: 0.1 },
  carnival: { bpm: 132, scale: 'major', key: 3, progs: [[0, 4, 4, 0], [0, 3, 4, 0]], rhythms: [[1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0], [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0]],
    lead: 'organ', bass: 'tuba', bassPat: [[0, 0], [8, 4]], comp: 'oompah', compInst: 'organ', drums: { k: [0, 8], s: [4, 12], h: [] }, delay: 0.12 },
  dreamy: { bpm: 90, scale: 'lydian', key: 4, progs: [[0, 1, 0, 4], [0, 5, 1, 4]], rhythms: [[1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]],
    lead: 'bell', bass: 'sine', bassPat: [[0, 0], [10, 4]], comp: 'arp16', compInst: 'bell', drums: { k: [0], sh: [4, 12] }, delay: 0.34, pad: true },
  arcade: { bpm: 128, scale: 'minpenta', key: -1, progs: [[0, 0, 3, 4], [0, 2, 3, 1]], rhythms: [[1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0], [1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0]],
    lead: 'chip', bass: 'square8', bassPat: [[0, 0], [3, 0], [6, 0], [8, 0], [11, 0], [14, 0]], comp: 'arp16', compInst: 'tri', drums: { k: [0, 6, 8], s: [4, 12], h: [2, 6, 10, 14], c: [12] }, delay: 0.16 },
};
const MUSIC_STYLE_NAMES = Object.keys(MUSIC_STYLES);

function hashString(str) { let h = 2166136261; for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/** Builds the song for a style: chord progression, an 8-bar melody (AABA' shape) and per-step note lengths. */
function buildSong(styleName, seedStr) {
  const st = MUSIC_STYLES[styleName];
  const r = mulberry32(hashString(`${seedStr}|${styleName}`));
  const scale = SCALES[st.scale]; const n = scale.length;
  const key = st.key + Math.floor(r() * 5) - 2;
  const prog = st.progs[Math.floor(r() * st.progs.length)];
  const rhA = st.rhythms[Math.floor(r() * st.rhythms.length)];
  const rhB = st.rhythms[Math.floor(r() * st.rhythms.length)];
  const lo = n; const hi = n * 2 + 3; // melody range in scale degrees (one octave and a bit, above the chords)
  const melody = [];
  let prev = n + prog[0] + 2;
  for (let b = 0; b < 8; b += 1) {
    if (b >= 4 && b < 7) { melody.push(melody[b - 4]); continue; } // A A' repeat → memorable
    const c = prog[b % prog.length];
    const rh = b % 4 < 2 ? rhA : rhB;
    const bar = new Array(16).fill(null);
    for (let s = 0; s < 16; s += 1) {
      if (!rh[s]) continue;
      let d;
      if (s % 4 === 0) {
        const tones = [c, c + 2, c + 4, c + n, c + n + 2, c + n + 4].filter((x) => x >= lo - 1 && x <= hi);
        tones.sort((a, bb) => Math.abs(a - prev) - Math.abs(bb - prev));
        d = tones[r() < 0.7 ? 0 : Math.min(1, tones.length - 1)];
      } else {
        const stepSize = r() < 0.65 ? 1 : 2;
        d = prev + (r() < (prev > (lo + hi) / 2 ? 0.65 : 0.35) ? -stepSize : stepSize);
      }
      d = clamp(d, lo - 1, hi); bar[s] = d; prev = d;
    }
    if (b === 7 || b === 3) { let last = 15; while (last > 0 && bar[last] === null) last -= 1; bar[last] = n + c; prev = n + c; }
    melody.push(bar);
  }
  // note lengths: until the next onset (max one beat)
  const lengths = melody.map((bar, bi) => bar.map((v, s) => { if (v === null) return 0; let k = 1; while (k < 4 && s + k < 16 && bar[s + k] === null) k += 1; return bi >= 0 ? k : 1; }));
  const semi = (d) => scale[((d % n) + n) % n] + 12 * Math.floor(d / n);
  return { st, key, prog, melody, lengths, semi, n };
}

// Loops sit on their own bus, always well under the music (players found fan / hair-dryer beds tiring).
// 'wind' and 'rumble' are silent on purpose: ambience comes from the music, not from noise.
const LOOP_SPECS = {
  spray: { noise: true, filter: 'lowpass', freq: 1500, q: 0.4, gain: 0.55 },
  hiss: { noise: true, filter: 'bandpass', freq: 1900, q: 0.5, gain: 0.35 },
  rumble: { silent: true },
  wind: { silent: true },
  engine: { wave: 'triangle', freq: 78, cutoff: 420, gain: 0.45 },
  hum: { wave: 'sine', freq: 120, cutoff: 600, gain: 0.5 },
};

function createAudio(getParams, getSeed) {
  let ac = null; let master = null; let sfxBus = null; let musicBus = null; let comp = null; let delaySend = null;
  let muted = false; let hostVolume = 1; let loopBus = null; let curBus = null; const loops = new Set(); let musicTimer = null; let noiseBuf = null; let musicStep = 0; let musicNext = 0; let musicStyleName = null; let song = null;
  const decoded = new Map();
  const raw = (window.__ASSETS__ && window.__ASSETS__.snd) || {};
  let lastSfx = new Map();

  function ensure() {
    if (ac) return ac;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ac = new Ctx();
    comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.2; comp.connect(ac.destination);
    master = ac.createGain(); master.connect(comp);
    sfxBus = ac.createGain(); sfxBus.connect(master);
    musicBus = ac.createGain(); musicBus.connect(master);
    loopBus = ac.createGain(); loopBus.connect(master);
    // a soft dotted-eighth echo for leads and bells (the "produced" feel)
    const dl = ac.createDelay(1); const fb = ac.createGain(); const tone2 = ac.createBiquadFilter(); delaySend = ac.createGain();
    dl.delayTime.value = 0.32; fb.gain.value = 0.3; tone2.type = 'lowpass'; tone2.frequency.value = 2400; delaySend.gain.value = 0.2;
    delaySend.connect(dl); dl.connect(tone2); tone2.connect(fb); fb.connect(dl); tone2.connect(musicBus);
    applyVolumes();
    for (const [key, b64] of Object.entries(raw)) {
      const bytes = b64ToBytes(b64);
      ac.decodeAudioData(bytes.buffer.slice(0)).then((buf) => decoded.set(key, buf)).catch(() => {});
    }
    return ac;
  }
  function applyVolumes() {
    if (!ac) return;
    const p = getParams();
    master.gain.value = muted ? 0 : 0.9 * hostVolume;
    const sfx = ((p.sfxVolume ?? 60) / 100) * 0.9; const mus = ((p.musicVolume ?? 25) / 100) * 0.7;
    sfxBus.gain.value = sfx;
    musicBus.gain.value = mus;
    // loops: about a third of the music level (a little bed when the music is off), never above the effects
    loopBus.gain.value = Math.min(sfx * 0.25, Math.max(mus * 0.35, sfx * 0.06));
  }
  function noise() {
    if (noiseBuf) return noiseBuf;
    noiseBuf = ac.createBuffer(1, Math.round(ac.sampleRate * 1.2), ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let s = 1;
    for (let i = 0; i < d.length; i += 1) { s = (s * 16807) % 2147483647; d[i] = (s / 2147483647) * 2 - 1; }
    return noiseBuf;
  }
  /** One oscillator note. filter: { type, freq, to, q } sweeps the cutoff over the note; release: tail after dur. */
  function tone(freq, dur, { type = 'triangle', vol = 0.2, slide = 0, delay = 0, bus, attack = 0.006, release = 0, filter = null, detune = 0, send = 0 } = {}) {
    const t0 = ac.currentTime + Math.max(0, delay); const end = t0 + dur + release;
    const o = ac.createOscillator(); const g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(Math.max(20, freq), t0); if (detune) o.detune.value = detune;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(25, freq * slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + Math.max(0.002, attack));
    if (release) { g.gain.setValueAtTime(Math.max(0.0002, vol), t0 + dur); g.gain.exponentialRampToValueAtTime(0.0001, end); }
    else g.gain.exponentialRampToValueAtTime(0.0001, end);
    let node = o;
    if (filter) {
      const f = ac.createBiquadFilter(); f.type = filter.type || 'lowpass'; f.Q.value = filter.q ?? 0.7;
      f.frequency.setValueAtTime(filter.freq, t0); if (filter.to) f.frequency.exponentialRampToValueAtTime(Math.max(40, filter.to), end);
      o.connect(f); node = f;
    }
    node.connect(g); const out = bus || curBus || sfxBus; g.connect(out);
    if (send && delaySend) { const sg = ac.createGain(); sg.gain.value = send; g.connect(sg); sg.connect(delaySend); }
    o.start(t0); o.stop(end + 0.03);
  }
  /** Filtered noise. freqTo sweeps the filter (whooshes, explosions). */
  function burst(dur, { vol = 0.25, freq = 1200, freqTo = 0, delay = 0, type = 'lowpass', bus, q = 0.8, attack = 0.002 } = {}) {
    const t0 = ac.currentTime + Math.max(0, delay);
    const src = ac.createBufferSource(); src.buffer = noise(); src.loop = dur > 1.1;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
    if (freqTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, freqTo), t0 + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(bus || curBus || sfxBus); src.start(t0, Math.random() * 0.3); src.stop(t0 + dur + 0.03);
  }
  const bell = (f, dur, o = {}) => { tone(f, dur, { type: 'sine', vol: o.vol ?? 0.14, delay: o.delay, bus: o.bus, send: o.send }); tone(f * 2.76, dur * 0.45, { type: 'sine', vol: (o.vol ?? 0.14) * 0.22, delay: o.delay, bus: o.bus }); };
  const P = (pitch) => (f) => f * pitch;
  const PRESETS = {
    tap: (k) => { tone(k(760), 0.05, { type: 'sine', vol: 0.16 }); tone(k(1520), 0.03, { type: 'triangle', vol: 0.04 }); },
    click: (k) => tone(k(1800), 0.022, { type: 'triangle', vol: 0.06 }),
    coin: (k) => { tone(k(1318), 0.06, { type: 'triangle', vol: 0.12 }); tone(k(1760), 0.18, { type: 'triangle', vol: 0.12, delay: 0.055 }); tone(k(3520), 0.08, { type: 'sine', vol: 0.025, delay: 0.055 }); },
    coins: (k) => [1175, 1318, 1568, 1760, 2093].forEach((f, i) => bell(k(f), 0.12, { vol: 0.08, delay: i * 0.045 })),
    gem: (k) => { bell(k(1568), 0.22, { vol: 0.14 }); bell(k(2349), 0.3, { vol: 0.1, delay: 0.07 }); burst(0.18, { vol: 0.03, freq: 7000, type: 'highpass', delay: 0.05 }); },
    jump: (k) => { tone(k(300), 0.16, { type: 'sine', vol: 0.16, slide: 2.3 }); tone(k(600), 0.12, { type: 'triangle', vol: 0.05, slide: 2 }); },
    land: (k) => { burst(0.09, { vol: 0.16, freq: 700, freqTo: 200 }); tone(k(120), 0.1, { type: 'sine', vol: 0.2, slide: 0.55 }); },
    hit: (k) => { burst(0.16, { vol: 0.3, freq: 2200, freqTo: 300 }); tone(k(170), 0.18, { type: 'sine', vol: 0.24, slide: 0.4 }); },
    bad: (k) => { tone(k(330), 0.26, { type: 'triangle', vol: 0.12, slide: 0.66, filter: { freq: 1800, to: 500 } }); tone(k(311), 0.26, { type: 'triangle', vol: 0.09, slide: 0.66 }); },
    pop: (k) => tone(k(560), 0.08, { type: 'sine', vol: 0.2, slide: 2 }),
    whoosh: () => burst(0.3, { vol: 0.14, freq: 500, freqTo: 3200, type: 'bandpass', q: 0.9, attack: 0.08 }),
    swoosh: () => burst(0.16, { vol: 0.12, freq: 1800, freqTo: 6500, type: 'bandpass', q: 0.8, attack: 0.03 }),
    powerup: (k) => { [523, 659, 784, 1047].forEach((f, i) => tone(k(f), 0.12, { type: 'triangle', vol: 0.1, delay: i * 0.055 })); bell(k(2093), 0.3, { vol: 0.06, delay: 0.22 }); },
    gate: (k) => [659, 784, 988, 1319].forEach((f, i) => tone(k(f), 0.1, { type: 'triangle', vol: 0.11, delay: i * 0.035 })),
    combo: (k) => { bell(k(880), 0.12, { vol: 0.1 }); bell(k(1320), 0.2, { vol: 0.1, delay: 0.05 }); },
    unlock: (k) => { [392, 523, 659, 784].forEach((f, i) => bell(k(f), 0.25, { vol: 0.1, delay: i * 0.07 })); burst(0.4, { vol: 0.05, freq: 6000, type: 'highpass', delay: 0.25 }); },
    tick: (k) => tone(k(1400), 0.025, { type: 'sine', vol: 0.07 }),
    step: (k) => burst(0.045, { vol: 0.08, freq: k(900) }),
    slice: (k) => { burst(0.12, { vol: 0.18, freq: 7000, freqTo: 2500, type: 'highpass' }); tone(k(2200), 0.05, { type: 'sine', vol: 0.04 }); },
    splash: () => { burst(0.4, { vol: 0.2, freq: 1600, freqTo: 400, type: 'bandpass', q: 0.5 }); burst(0.15, { vol: 0.08, freq: 5000, type: 'highpass', delay: 0.03 }); },
    explosion: (k) => { burst(0.75, { vol: 0.42, freq: 2400, freqTo: 120 }); tone(k(95), 0.6, { type: 'sine', vol: 0.38, slide: 0.35 }); },
    boss: (k) => { tone(k(98), 0.7, { type: 'sawtooth', vol: 0.14, slide: 0.9, filter: { freq: 900, to: 300 } }); tone(k(104), 0.7, { type: 'sawtooth', vol: 0.1, slide: 0.9, filter: { freq: 900, to: 300 } }); burst(0.5, { vol: 0.18, freq: 400, freqTo: 120 }); },
    cheer: (k) => { burst(1, { vol: 0.12, freq: 2600, type: 'bandpass', q: 0.4, attack: 0.1 }); [523, 659, 784].forEach((f) => bell(k(f), 0.6, { vol: 0.06, delay: 0.05 })); },
    win: (k) => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(k(f), 0.22, { type: 'triangle', vol: 0.13, delay: i * 0.085 })); bell(k(2093), 0.5, { vol: 0.07, delay: 0.42 }); },
    lose: (k) => [392, 330, 262, 196].forEach((f, i) => tone(k(f), 0.28, { type: 'triangle', vol: 0.1, delay: i * 0.13, filter: { freq: 1600, to: 600 } })),
    // extra presets (v0.4)
    bonk: (k) => { tone(k(240), 0.12, { type: 'sine', vol: 0.22, slide: 0.5 }); burst(0.06, { vol: 0.12, freq: 1800 }); },
    boing: (k) => { tone(k(180), 0.35, { type: 'sine', vol: 0.16, slide: 3 }); tone(k(360), 0.25, { type: 'triangle', vol: 0.05, slide: 2.5 }); },
    chime: (k) => { bell(k(1760), 0.5, { vol: 0.12 }); bell(k(2637), 0.6, { vol: 0.07, delay: 0.08 }); },
    ding: (k) => bell(k(1760), 0.4, { vol: 0.13 }),
    thud: (k) => { tone(k(90), 0.2, { type: 'sine', vol: 0.3, slide: 0.45 }); burst(0.12, { vol: 0.14, freq: 500, freqTo: 120 }); },
    zap: (k) => tone(k(1400), 0.14, { type: 'sawtooth', vol: 0.08, slide: 0.15, filter: { freq: 4000, to: 600 } }),
    laser: (k) => tone(k(1800), 0.12, { type: 'square', vol: 0.05, slide: 0.2, filter: { freq: 3000, to: 900 } }),
    shoot: (k) => { burst(0.07, { vol: 0.14, freq: 3500, freqTo: 900, type: 'bandpass' }); tone(k(900), 0.06, { type: 'triangle', vol: 0.06, slide: 0.5 }); },
    punch: (k) => { burst(0.09, { vol: 0.24, freq: 1800, freqTo: 250 }); tone(k(150), 0.1, { type: 'sine', vol: 0.22, slide: 0.4 }); },
    crunch: () => { burst(0.08, { vol: 0.18, freq: 1500, type: 'bandpass', q: 1.2 }); burst(0.1, { vol: 0.14, freq: 900, type: 'bandpass', q: 1.2, delay: 0.05 }); },
    sparkle: (k) => [2093, 2637, 3136].forEach((f, i) => bell(k(f), 0.18, { vol: 0.05, delay: i * 0.05 })),
    spring: (k) => tone(k(260), 0.3, { type: 'triangle', vol: 0.14, slide: 3.4 }),
    honk: (k) => { tone(k(330), 0.22, { type: 'square', vol: 0.05, filter: { freq: 1500 } }); tone(k(349), 0.22, { type: 'square', vol: 0.04, filter: { freq: 1500 } }); },
    whistle: (k) => tone(k(1300), 0.35, { type: 'sine', vol: 0.08, slide: 1.4, attack: 0.04 }),
    score: (k) => PRESETS.coin(k),
    drum: () => tone(150, 0.2, { type: 'sine', vol: 0.3, slide: 0.3 }),
  };

  /* ---- music ---- */
  const mb = () => musicBus;
  const INSTR = {
    bell: (f, d, t, v) => bell(f, Math.max(0.25, d * 1.6), { vol: 0.07 * v, delay: t, bus: mb(), send: 0.5 }),
    keys: (f, d, t, v) => { tone(f, d, { type: 'triangle', vol: 0.05 * v, delay: t, bus: mb(), release: 0.18, send: 0.35 }); tone(f * 2, d, { type: 'sine', vol: 0.018 * v, delay: t, bus: mb(), release: 0.12 }); },
    brass: (f, d, t, v) => tone(f, d, { type: 'sawtooth', vol: 0.035 * v, delay: t, bus: mb(), attack: 0.04, release: 0.1, filter: { freq: 2200, to: 900 }, send: 0.25 }),
    square: (f, d, t, v) => tone(f, d, { type: 'square', vol: 0.022 * v, delay: t, bus: mb(), release: 0.03, filter: { freq: 3500 }, send: 0.2 }),
    chip: (f, d, t, v) => tone(f, d * 0.8, { type: 'square', vol: 0.018 * v, delay: t, bus: mb(), filter: { freq: 2800 }, send: 0.15 }),
    tri: (f, d, t, v) => tone(f, d, { type: 'triangle', vol: 0.04 * v, delay: t, bus: mb(), send: 0.2 }),
    clav: (f, d, t, v) => tone(f, Math.min(d, 0.16), { type: 'square', vol: 0.03 * v, delay: t, bus: mb(), filter: { freq: 3200, to: 700, q: 2 } }),
    marimba: (f, d, t, v) => { tone(f, 0.28, { type: 'sine', vol: 0.08 * v, delay: t, bus: mb(), send: 0.3 }); tone(f * 4, 0.06, { type: 'sine', vol: 0.02 * v, delay: t, bus: mb() }); },
    organ: (f, d, t, v) => { tone(f, d, { type: 'sine', vol: 0.04 * v, delay: t, bus: mb(), attack: 0.01, release: 0.05 }); tone(f * 2, d, { type: 'sine', vol: 0.02 * v, delay: t, bus: mb(), release: 0.05 }); tone(f * 3, d, { type: 'sine', vol: 0.012 * v, delay: t, bus: mb(), release: 0.05 }); },
    flute: (f, d, t, v) => { tone(f, d, { type: 'sine', vol: 0.06 * v, delay: t, bus: mb(), attack: 0.05, release: 0.15, send: 0.35 }); tone(f * 2, d, { type: 'sine', vol: 0.008 * v, delay: t, bus: mb(), attack: 0.05 }); },
    saw: (f, d, t, v) => tone(f, d, { type: 'sawtooth', vol: 0.028 * v, delay: t, bus: mb(), release: 0.04, filter: { freq: 2600, to: 1100 }, send: 0.15 }),
    pluck: (f, d, t, v) => tone(f, Math.min(0.35, d), { type: 'sawtooth', vol: 0.04 * v, delay: t, bus: mb(), filter: { freq: 2600, to: 300 } }),
    pad: (f, d, t, v) => { tone(f, d, { type: 'sawtooth', vol: 0.012 * v, delay: t, bus: mb(), attack: 0.35, release: 0.4, detune: -7, filter: { freq: 900 } }); tone(f, d, { type: 'sawtooth', vol: 0.012 * v, delay: t, bus: mb(), attack: 0.35, release: 0.4, detune: 7, filter: { freq: 900 } }); },
    strings: (f, d, t, v) => tone(f, d, { type: 'sawtooth', vol: 0.016 * v, delay: t, bus: mb(), attack: 0.12, release: 0.25, filter: { freq: 1600 } }),
  };
  const BASS = {
    sine: (f, d, t) => tone(f, d, { type: 'sine', vol: 0.16, delay: t, bus: mb(), release: 0.05 }),
    pluck: (f, d, t) => tone(f, Math.min(d, 0.3), { type: 'sawtooth', vol: 0.07, delay: t, bus: mb(), filter: { freq: 900, to: 160 } }),
    saw: (f, d, t) => tone(f, d * 0.9, { type: 'sawtooth', vol: 0.05, delay: t, bus: mb(), filter: { freq: 650, to: 300 } }),
    square8: (f, d, t) => tone(f, d * 0.8, { type: 'square', vol: 0.04, delay: t, bus: mb(), filter: { freq: 900 } }),
    slap: (f, d, t) => tone(f, Math.min(d, 0.18), { type: 'sawtooth', vol: 0.07, delay: t, bus: mb(), filter: { freq: 1800, to: 220, q: 3 } }),
    tuba: (f, d, t) => tone(f, Math.min(d, 0.3), { type: 'triangle', vol: 0.15, delay: t, bus: mb(), attack: 0.02 }),
  };
  function drums(kit, s, t, lofi) {
    const v = lofi ? 0.7 : 1;
    if (kit.k && kit.k.includes(s)) { tone(150, 0.16, { type: 'sine', vol: 0.42 * v, slide: 0.3, delay: t, bus: mb(), attack: 0.002 }); burst(0.012, { vol: 0.05 * v, freq: 3000, delay: t, bus: mb() }); }
    if (kit.s && kit.s.includes(s)) { burst(lofi ? 0.09 : 0.14, { vol: 0.15 * v, freq: 1900, type: 'bandpass', q: 0.8, delay: t, bus: mb() }); tone(200, 0.07, { type: 'triangle', vol: 0.06 * v, delay: t, bus: mb() }); }
    if (kit.gs && kit.gs.includes(s)) burst(0.05, { vol: 0.04, freq: 2000, type: 'bandpass', delay: t, bus: mb() });
    if (kit.c && kit.c.includes(s)) for (let i = 0; i < 3; i += 1) burst(0.05, { vol: 0.07, freq: 1500, type: 'bandpass', q: 1.2, delay: t + i * 0.011, bus: mb() });
    if (kit.h && kit.h.includes(s)) burst(0.03, { vol: 0.04 * v, freq: 8000, type: 'highpass', delay: t, bus: mb() });
    if (kit.sh && kit.sh.includes(s)) burst(0.05, { vol: 0.025, freq: 6000, type: 'highpass', delay: t, bus: mb(), attack: 0.02 });
    if (kit.rim && kit.rim.includes(s)) tone(1700, 0.02, { type: 'square', vol: 0.025, delay: t, bus: mb(), filter: { freq: 2500 } });
    if (kit.t && kit.t.includes(s)) tone(120, 0.25, { type: 'sine', vol: 0.22, slide: 0.6, delay: t, bus: mb() });
  }
  function scheduleMusic() {
    if (!song) return;
    const { st, key, prog, melody, lengths, semi, n } = song;
    const stepDur = 60 / st.bpm / 4; const root = 130.81 * 2 ** (key / 12); // around C3
    const hz = (d, oct = 0) => root * 2 ** ((semi(d) + oct * 12) / 12);
    while (musicNext < ac.currentTime + 0.35) {
      const s = musicStep % 16; const bar = Math.floor(musicStep / 16) % 8;
      const c = prog[bar % prog.length];
      const t = Math.max(0, musicNext - ac.currentTime) + (s % 2 ? (st.swing || 0) * stepDur : 0);
      const intro = musicStep < 32; // first two bars: drums + bass + comping only
      drums(st.drums, s, t, st.lofi);
      for (const [bs, off] of st.bassPat) if (bs === s) (BASS[st.bass] || BASS.sine)(hz(c + off, -1), stepDur * 1.8, t);
      const ci = INSTR[st.compInst] || INSTR.keys;
      const chord = [c, c + 2, c + 4];
      if (st.comp === 'arp8' && s % 2 === 0) ci(hz(chord[(s / 2) % 3] + (s % 8 >= 6 ? n : 0)), stepDur * 1.6, t, 0.55);
      else if (st.comp === 'arp16') ci(hz(chord[s % 3] + (s % 6 >= 3 ? n : 0)), stepDur * 0.9, t, 0.45);
      else if (st.comp === 'pad' && s === 0) chord.forEach((d) => (INSTR[st.compInst] || INSTR.pad)(hz(d), stepDur * 15, t, 1));
      else if (st.comp === 'offbeat' && s % 4 === 2) chord.forEach((d) => ci(hz(d), stepDur * 1.2, t, 0.5));
      else if (st.comp === 'stabs' && (s === 2 || s === 7 || s === 10)) chord.forEach((d) => ci(hz(d), stepDur, t, 0.6));
      else if (st.comp === 'oompah' && (s === 4 || s === 12)) chord.forEach((d) => ci(hz(d), stepDur * 2, t, 0.55));
      else if (st.comp === 'march' && s % 8 === 0) chord.forEach((d) => ci(hz(d), stepDur * 6, t, 0.8));
      if (st.pad && s === 0) chord.forEach((d) => INSTR.pad(hz(d), stepDur * 15.5, t, 0.8));
      if (!intro) { const m = melody[bar][s]; if (m !== null) (INSTR[st.lead] || INSTR.keys)(hz(m), stepDur * lengths[bar][s] * 0.95, t, 1); }
      musicNext += stepDur; musicStep += 1;
    }
  }
  function startMusic(styleName) {
    if (!ensure()) return;
    const name = styleName || getParams().musicStyle || 'upbeat';
    if (name === 'off' || !MUSIC_STYLES[name]) { stopMusic(); musicStyleName = name; return; }
    if (musicTimer && musicStyleName === name) return;
    musicStyleName = name; song = buildSong(name, String((getSeed && getSeed()) || 'blyth'));
    if (!musicTimer) { musicNext = ac.currentTime + 0.08; musicStep = 0; musicTimer = setInterval(() => { if (ac.state === 'running') scheduleMusic(); }, 60); }
  }
  function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }
  function unlock() { const c = ensure(); if (c && c.state !== 'running' && c.state !== 'closed') c.resume().catch(() => {}); }
  // Browsers start audio only inside an activation-triggering event. On a phone the pointerdown of a touch is not
  // one (its pointerup, touchend and click are), so unlocking on pointerdown alone left phones silent (iOS never
  // started, Android only from the second touch). These listeners also bring the sound back after iOS interrupts it.
  for (const type of ['pointerup', 'touchend', 'click', 'keydown']) window.addEventListener(type, unlock, { capture: true, passive: true });
  return {
    unlock,
    /** sfx(name, { pitch = 1, vol = 1 }). Same sound at most every 30 ms. */
    sfx(name, opts = {}) {
      if (!ac || muted) return;
      const now = ac.currentTime; const prev = lastSfx.get(name) || 0;
      if (now - prev < 0.03) return; lastSfx.set(name, now);
      const vol = typeof opts.vol === 'number' ? clamp(opts.vol, 0, 2) : 1;
      if (vol <= 0) return;
      if (vol !== 1) { curBus = ac.createGain(); curBus.gain.value = vol; curBus.connect(sfxBus); }
      try { (PRESETS[name] || PRESETS.tap)(P(opts.pitch || 1)); } catch { /* ignore */ }
      curBus = null;
    },
    /**
     * Looping procedural sound (spray, engine, wind…). Returns a handle { set({ vol, pitch }), stop(fadeMs) }.
     * Names: spray | hiss | rumble | wind | engine | hum. All loops stop on game end and on restart.
     */
    loop(name, opts = {}) {
      const stub = { set() { return stub; }, stop() {}, get playing() { return false; } };
      if (!ensure()) return stub;
      const spec = LOOP_SPECS[name] || LOOP_SPECS.spray;
      if (spec.silent) return stub;
      const out = ac.createGain(); out.gain.value = 0.0001; out.connect(loopBus);
      const nodes = [];
      let pitchTarget = null;
      if (spec.noise) {
        const src = ac.createBufferSource(); src.buffer = noise(); src.loop = true;
        const f = ac.createBiquadFilter(); f.type = spec.filter; f.frequency.value = spec.freq; f.Q.value = spec.q ?? 0.7;
        src.connect(f); f.connect(out); src.start(); nodes.push(src); pitchTarget = { param: f.frequency, base: spec.freq };
      } else {
        const o = ac.createOscillator(); o.type = spec.wave; o.frequency.value = spec.freq;
        const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = spec.cutoff || 900;
        o.connect(f); f.connect(out); o.start(); nodes.push(o); pitchTarget = { param: o.frequency, base: spec.freq };
        if (spec.sub) { const o2 = ac.createOscillator(); o2.type = 'square'; o2.frequency.value = spec.freq / 2; const g2 = ac.createGain(); g2.gain.value = 0.35; o2.connect(g2); g2.connect(f); o2.start(); nodes.push(o2); pitchTarget.sub = o2.frequency; }
      }
      let alive = true;
      const h = {
        get playing() { return alive; },
        set(o2 = {}) {
          if (!alive) return h; const t0 = ac.currentTime;
          if (typeof o2.vol === 'number') out.gain.setTargetAtTime(Math.max(0.0001, clamp(o2.vol, 0, 1) * (spec.gain ?? 1)), t0, 0.12);
          if (typeof o2.pitch === 'number' && pitchTarget) {
            const f2 = Math.max(20, pitchTarget.base * o2.pitch);
            pitchTarget.param.setTargetAtTime(f2, t0, 0.05); if (pitchTarget.sub) pitchTarget.sub.setTargetAtTime(f2 / 2, t0, 0.05);
          }
          return h;
        },
        stop(fadeMs = 120) {
          if (!alive) return; alive = false; loops.delete(h);
          const t0 = ac.currentTime; const end = t0 + Math.max(0.02, fadeMs / 1000);
          try { out.gain.cancelScheduledValues(t0); out.gain.setValueAtTime(out.gain.value, t0); out.gain.exponentialRampToValueAtTime(0.0001, end); } catch { /* ignore */ }
          for (const n of nodes) { try { n.stop(end + 0.05); } catch { /* ignore */ } }
        },
      };
      loops.add(h);
      h.set({ vol: opts.vol ?? 0.3, pitch: opts.pitch });
      return h;
    },
    /** Stop every running loop (the kernel calls this on game end and restart). */
    stopLoops(fadeMs = 150) { for (const h of [...loops]) h.stop(fadeMs); },
    play(key, { vol = 1, rate = 1, loop = false } = {}) {
      if (!ac || muted) return null;
      const buf = decoded.get(key); if (!buf) return null;
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = loop; src.playbackRate.value = rate;
      const g = ac.createGain(); g.gain.value = vol; src.connect(g); g.connect(loop ? musicBus : sfxBus); src.start();
      return src;
    },
    music(on = true) { if (on) startMusic(); else stopMusic(); },
    setStyle(name) { if (musicTimer || name !== 'off') startMusic(name); },
    setMuted(m) { muted = m; applyVolumes(); },
    /** Host volume 0..1 (the Arcade's sound slider); multiplies every bus. */
    setVolume(v) { hostVolume = clamp(Number(v) || 0, 0, 1); applyVolumes(); },
    get volume() { return hostVolume; },
    suspend() { if (ac && ac.state === 'running') ac.suspend().catch(() => {}); },
    resume() { if (ac && ac.state === 'suspended' && !muted) ac.resume().catch(() => {}); },
    applyVolumes,
    get presets() { return Object.keys(PRESETS); },
    get muted() { return muted; },
    get context() { return ac; },
  };
}

/* ------------------------------------------------------------ pixel font */

// 5x7 glyphs, rows top→bottom, 5 bits each (MSB = left). Accented Turkish letters map to their base.
const FONT5 = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16], G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14], J: [7, 2, 2, 2, 2, 18, 12], K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 17, 25, 21, 19, 17, 17], O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17], S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31], 3: [31, 2, 4, 2, 1, 17, 14],
  4: [2, 6, 10, 18, 31, 2, 2], 5: [31, 16, 30, 1, 1, 17, 14], 6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8],
  8: [14, 17, 17, 14, 17, 17, 14], 9: [14, 17, 17, 15, 1, 2, 12],
  ' ': [0, 0, 0, 0, 0, 0, 0], '!': [4, 4, 4, 4, 4, 0, 4], '?': [14, 17, 1, 2, 4, 0, 4], '.': [0, 0, 0, 0, 0, 12, 12], ',': [0, 0, 0, 0, 12, 4, 8],
  ':': [0, 12, 12, 0, 12, 12, 0], '-': [0, 0, 0, 31, 0, 0, 0], '+': [0, 4, 4, 31, 4, 4, 0], 'x': [0, 0, 17, 10, 4, 10, 17], '/': [1, 1, 2, 4, 8, 16, 16],
  '%': [24, 25, 2, 4, 8, 19, 3], "'": [4, 4, 8, 0, 0, 0, 0], '♥': [0, 10, 31, 31, 14, 4, 0], '★': [4, 4, 31, 14, 14, 27, 17],
};
FONT5['÷'] = [0, 4, 0, 31, 0, 4, 0];
const FONT_MAP = { 'İ': 'I', 'Ş': 'S', 'Ğ': 'G', 'Ü': 'U', 'Ö': 'O', 'Ç': 'C', 'Â': 'A', 'É': 'E', '×': 'x' };

/* --------------------------------------------------------------------- UI */

const ICONS = {
  coin: '<circle cx="12" cy="12" r="9" fill="#ffd23f" stroke="#a5670c" stroke-width="2"/><path d="M12 7v10M9.5 9.5h4a1.6 1.6 0 010 3.2h-3a1.6 1.6 0 000 3.2h4" stroke="#a5670c" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  heart: '<path d="M12 21s-7.5-4.6-9.3-9.2C1.4 8.4 3.4 5 6.8 5c2 0 3.6 1.2 5.2 3 1.6-1.8 3.2-3 5.2-3 3.4 0 5.4 3.4 4.1 6.8C19.5 16.4 12 21 12 21z" fill="#ff3d6e" stroke="#7a1030" stroke-width="1.6"/>',
  gem: '<path d="M6 3h12l4 6-10 12L2 9z" fill="#3dd6ff" stroke="#0b5b7a" stroke-width="1.6"/><path d="M2 9h20M8 3l4 18M16 3l-4 18" stroke="#0b5b7a" stroke-width="1" fill="none" opacity=".6"/>',
  star: '<path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.5l1.3-6.6L2.5 9.3l6.6-.8z" fill="#ffd23f" stroke="#a5670c" stroke-width="1.6" stroke-linejoin="round"/>',
  clock: '<circle cx="12" cy="13" r="8.5" fill="#fff" stroke="#283048" stroke-width="2"/><path d="M12 8.5V13l3 2" stroke="#283048" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M9 2.5h6" stroke="#283048" stroke-width="2.2" stroke-linecap="round"/>',
  skull: '<path d="M12 3c-4.6 0-8 3.2-8 7.6 0 2.6 1.3 4.4 3 5.4V19h2v-1.5h2V19h2v-1.5h2V19h2v-3c1.7-1 3-2.8 3-5.4C20 6.2 16.6 3 12 3z" fill="#eef1f5" stroke="#283048" stroke-width="1.6"/><circle cx="9" cy="11" r="2" fill="#283048"/><circle cx="15" cy="11" r="2" fill="#283048"/>',
  crowd: '<circle cx="8" cy="8" r="3.2" fill="#5ec8ff" stroke="#123" stroke-width="1.4"/><circle cx="16" cy="8" r="3.2" fill="#5ec8ff" stroke="#123" stroke-width="1.4"/><path d="M2.5 20c.4-4 2.6-6 5.5-6s5.1 2 5.5 6zM10.5 20c.4-4 2.6-6 5.5-6s5.1 2 5.5 6z" fill="#3a8ee6" stroke="#123" stroke-width="1.4"/>',
  flag: '<path d="M5 21V3" stroke="#283048" stroke-width="2.2" stroke-linecap="round"/><path d="M6 4h12l-3 4 3 4H6z" fill="#ff3d6e" stroke="#7a1030" stroke-width="1.4" stroke-linejoin="round"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="#ffd23f" stroke="#a5670c" stroke-width="1.6" stroke-linejoin="round"/>',
  sword: '<path d="M14.5 3H21v6.5L10 20.5 3.5 14z" fill="#dfe6ef" stroke="#283048" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 21l3-3M6.5 13.5l4 4" stroke="#283048" stroke-width="2.2" stroke-linecap="round"/>',
  egg: '<path d="M12 3c3.6 0 6.5 6 6.5 10.2A6.5 6.5 0 0112 20a6.5 6.5 0 01-6.5-6.8C5.5 9 8.4 3 12 3z" fill="#fff7e6" stroke="#8a6a3a" stroke-width="1.6"/>',
  trophy: '<path d="M7 3h10v5a5 5 0 01-10 0z" fill="#ffd23f" stroke="#a5670c" stroke-width="1.6"/><path d="M7 5H3.5a3.5 3.5 0 004 4M17 5h3.5a3.5 3.5 0 01-4 4M12 13v4M8 21h8l-1-4H9z" stroke="#a5670c" stroke-width="1.6" fill="#ffd23f"/>',
  pin: '<path d="M12 22s7-7.1 7-12.2A7 7 0 005 9.8C5 14.9 12 22 12 22z" fill="#ff5b22" stroke="#7a2a10" stroke-width="1.6"/><circle cx="12" cy="10" r="2.6" fill="#fff"/>',
  lock: '<path d="M7.5 10.5V7.8a4.5 4.5 0 019 0v2.7" fill="none" stroke="#dfe6ef" stroke-width="2.6" stroke-linecap="round"/><path d="M7.5 10.5V7.8a4.5 4.5 0 019 0v2.7" fill="none" stroke="#283048" stroke-width="1" stroke-linecap="round" opacity=".5"/><rect x="4.5" y="10.2" width="15" height="11" rx="3" fill="#ffd23f" stroke="#a5670c" stroke-width="1.6"/><circle cx="12" cy="15" r="1.7" fill="#a5670c"/><path d="M12 15.5v2.6" stroke="#a5670c" stroke-width="1.8" stroke-linecap="round"/>',
};
function iconSvg(name, size = 22) {
  const body = ICONS[name];
  if (!body) return `<span style="font-size:${Math.round(size * 0.9)}px;line-height:1">${String(name).slice(0, 2)}</span>`;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
}

const HAND_SVG = '<svg viewBox="0 0 64 72" width="64" height="72" aria-hidden="true"><g fill="#1c1a2e" stroke="#1c1a2e" stroke-width="7" stroke-linejoin="round"><rect x="21" y="4" width="13" height="36" rx="6.5"/><rect x="13" y="30" width="38" height="32" rx="13"/><rect x="33" y="26" width="11" height="20" rx="5.5"/><rect x="42" y="30" width="10" height="18" rx="5"/><rect x="5" y="36" width="20" height="11" rx="5.5" transform="rotate(35 15 41)"/></g><g fill="#ffffff"><rect x="21" y="4" width="13" height="36" rx="6.5"/><rect x="13" y="30" width="38" height="32" rx="13"/><rect x="33" y="26" width="11" height="20" rx="5.5"/><rect x="42" y="30" width="10" height="18" rx="5"/><rect x="5" y="36" width="20" height="11" rx="5.5" transform="rotate(35 15 41)"/></g><path d="M24 12h7" stroke="#cfd6e4" stroke-width="2.5" stroke-linecap="round"/></svg>';

const UI_CSS = `
:root{--pk-accent:#ff5b22;--pk-panel:rgba(27,22,56,.84);--pk-edge:rgba(255,255,255,.9);--pk-ink:#fff;--pk-ink2:rgba(255,255,255,.78);--pk-rad:18px;--pk-shadow:0 4px 0 rgba(0,0,0,.28);--pk-font:"PK Display","Arial Rounded MT Bold","Arial Black","Avenir Next Heavy","Segoe UI Black",Impact,system-ui,sans-serif;--pk-text-stroke:#1c1a2e}
html[data-pk-skin=frost]{--pk-edge:rgba(225,240,255,.6);--pk-rad:16px;--pk-shadow:0 6px 18px rgba(20,30,60,.3);--pk-text-stroke:#14223f}
html[data-pk-skin=classic]{--pk-edge:rgba(255,255,255,.28);--pk-rad:10px;--pk-shadow:0 3px 10px rgba(0,0,0,.35);--pk-text-stroke:#000}
html[data-pk-skin=parchment]{--pk-ink:#3b2a14;--pk-ink2:#6b5332;--pk-edge:#a6844f;--pk-rad:6px;--pk-shadow:0 3px 0 rgba(80,50,20,.35);--pk-font:Georgia,"Times New Roman",serif;--pk-text-stroke:#f6e7c4}
html[data-pk-skin=neon]{--pk-edge:var(--pk-accent);--pk-rad:12px;--pk-shadow:0 0 14px var(--pk-accent);--pk-text-stroke:#06030f}
html,body{margin:0;height:100%;overflow:hidden;background:#0d0f14;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;overscroll-behavior:none}
#pk-canvas{position:fixed;inset:0;width:100vw;height:100vh;display:block;will-change:transform}
#pk-fx{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none}
#pk-ui{position:fixed;inset:0;pointer-events:none;font-family:var(--pk-font);font-weight:800;color:var(--pk-ink);--s:1;line-height:1.1}
#pk-ui .pk-stroke{-webkit-text-stroke:5px var(--pk-text-stroke);paint-order:stroke fill;text-shadow:0 4px 0 var(--pk-text-stroke)}
#pk-ui .pk-hud{position:absolute;top:calc(max(8px,env(safe-area-inset-top)) + 4px);left:10px;right:10px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
#pk-ui .pk-col{display:flex;flex-direction:column;gap:6px;align-items:flex-start}
#pk-ui .pk-col.pk-r{align-items:flex-end}
#pk-ui .pk-pill{display:inline-flex;align-items:center;gap:6px;background:var(--pk-panel);border:2px solid var(--pk-edge);border-radius:999px;padding:calc(5px*var(--s)) calc(13px*var(--s)) calc(5px*var(--s)) calc(7px*var(--s));font-size:calc(17px*var(--s));letter-spacing:.3px;min-width:44px;box-shadow:var(--pk-shadow);color:var(--pk-ink);white-space:nowrap}
#pk-ui .pk-pill.pk-noicon{padding-left:calc(13px*var(--s))}
#pk-ui .pk-pill svg{width:calc(22px*var(--s));height:calc(22px*var(--s));flex:none}
#pk-ui .pk-bump{animation:pk-bump .32s ease-out}
#pk-ui .pk-hearts{display:flex;gap:3px}
#pk-ui .pk-hearts svg{width:calc(24px*var(--s));height:calc(24px*var(--s));filter:drop-shadow(0 2px 0 rgba(0,0,0,.3))}
#pk-ui .pk-hearts .off{opacity:.25;filter:grayscale(1)}
#pk-ui .pk-shake{animation:pk-shake .4s}
#pk-ui .pk-prog{position:absolute;left:50%;transform:translateX(-50%);top:calc(max(8px,env(safe-area-inset-top)) + 8px);width:min(58%,420px)}
#pk-ui .pk-prog-track{position:relative;height:calc(12px*var(--s));border-radius:99px;background:rgba(0,0,0,.35);border:2px solid var(--pk-edge);box-shadow:var(--pk-shadow);overflow:visible}
#pk-ui .pk-prog-fill{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:linear-gradient(90deg,var(--pk-accent),#ffd23f);width:0}
#pk-ui .pk-prog-dot{position:absolute;top:50%;width:calc(16px*var(--s));height:calc(16px*var(--s));margin:calc(-8px*var(--s)) 0 0 calc(-8px*var(--s));border-radius:50%;border:2px solid #fff;box-shadow:0 2px 0 rgba(0,0,0,.35);transition:left .12s linear}
#pk-ui .pk-prog-dot.me{width:calc(22px*var(--s));height:calc(22px*var(--s));margin:calc(-11px*var(--s)) 0 0 calc(-11px*var(--s));z-index:2}
#pk-ui .pk-prog-flag{position:absolute;right:calc(-14px*var(--s));top:calc(-16px*var(--s))}
#pk-ui .pk-prog-label{text-align:center;font-size:calc(12px*var(--s));margin-top:4px;opacity:.9}
#pk-ui .pk-obj{position:absolute;left:50%;transform:translateX(-50%);top:calc(max(8px,env(safe-area-inset-top)) + 54px);font-size:calc(15px*var(--s));padding:calc(6px*var(--s)) calc(14px*var(--s));background:var(--pk-panel);border:2px solid var(--pk-edge);border-radius:12px;box-shadow:var(--pk-shadow);white-space:nowrap;transition:opacity .25s}
#pk-ui .pk-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:24px}
#pk-ui .pk-intro{justify-content:flex-start;padding-top:12vh}
#pk-ui .pk-logo{font-size:clamp(34px,11vw,72px);line-height:.95;letter-spacing:1px;color:#fff;transform:rotate(-3deg);animation:pk-logo .7s cubic-bezier(.2,1.6,.4,1) both}
#pk-ui .pk-logo span{display:block}
#pk-ui .pk-logo span:nth-child(2){color:var(--pk-accent)}
#pk-ui .pk-tagline{font-size:clamp(14px,4vw,20px);background:var(--pk-panel);border:2px solid var(--pk-edge);border-radius:999px;padding:6px 14px;box-shadow:var(--pk-shadow);animation:pk-pop .5s .25s both}
#pk-ui .pk-title{font-size:clamp(30px,9vw,56px);line-height:1;max-width:92%}
#pk-ui .pk-sub{font-size:clamp(14px,4vw,19px);color:var(--pk-ink2);max-width:86%}
#pk-ui .pk-tap{font-size:clamp(15px,4.4vw,22px);padding:10px 18px;border-radius:999px;background:var(--pk-panel);border:2px solid var(--pk-edge);animation:pk-pulse 1.1s ease-in-out infinite;margin-top:auto;margin-bottom:16vh}
#pk-ui .pk-end{background:radial-gradient(ellipse at center,rgba(0,0,0,.35),rgba(0,0,0,.65))}
#pk-ui .pk-end .pk-card{zoom:var(--pk-z,1)}
@media (max-height:520px){#pk-ui .pk-end .pk-card{margin-top:28px}}
#pk-ui .pk-card{background:var(--pk-panel);border:2px solid var(--pk-edge);border-radius:calc(var(--pk-rad) + 8px);padding:22px 22px 18px;min-width:250px;max-width:88%;display:flex;flex-direction:column;align-items:center;gap:10px;pointer-events:auto;box-shadow:0 10px 0 rgba(0,0,0,.25),0 20px 50px rgba(0,0,0,.4);animation:pk-pop .45s cubic-bezier(.2,1.5,.4,1) both}
#pk-ui .pk-stars{display:flex;gap:4px;margin-top:-52px;margin-bottom:2px}
#pk-ui .pk-stars svg{width:58px;height:58px;filter:drop-shadow(0 4px 0 rgba(0,0,0,.3));opacity:0;transform:scale(.2)}
#pk-ui .pk-stars svg:nth-child(2){width:72px;height:72px;margin-top:-14px}
#pk-ui .pk-stars svg.on{animation:pk-star .5s cubic-bezier(.2,1.8,.4,1) forwards}
#pk-ui .pk-stars svg.off{animation:pk-star .4s forwards;filter:grayscale(1) brightness(.6)}
#pk-ui .pk-score{font-size:clamp(36px,11vw,62px)}
#pk-ui .pk-near{width:100%;max-width:240px}
#pk-ui .pk-near-track{height:14px;border-radius:99px;background:rgba(0,0,0,.4);border:2px solid var(--pk-edge);overflow:hidden}
#pk-ui .pk-near-fill{height:100%;width:0;background:linear-gradient(90deg,#ff3d6e,#ffd23f);transition:width 1.1s cubic-bezier(.2,.9,.3,1)}
#pk-ui .pk-near-label{font-size:15px;margin-bottom:5px}
#pk-ui .pk-near-note{font-size:15px;margin-top:6px;color:var(--pk-note,#ffd23f)}
#pk-ui .pk-end.pk-adlose .pk-near{max-width:270px}
#pk-ui .pk-end.pk-adlose .pk-near-track{height:22px}
#pk-ui .pk-end.pk-adlose .pk-near-label{font-size:clamp(26px,8vw,40px);margin-bottom:6px}
#pk-ui .pk-end.pk-adlose .pk-title{color:#ff5a6e}
#pk-ui .pk-end.pk-ctamain .pk-btn.pk-cta{font-size:20px;padding:12px 24px;min-width:210px}
#pk-ui .pk-lock{display:inline-block;vertical-align:-.12em;margin-right:.15em}
#pk-ui .pk-lock svg{width:1em;height:1em;filter:drop-shadow(0 3px 0 rgba(0,0,0,.3))}
#pk-overlay{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none}
#pk-ui .pk-btn{pointer-events:auto;white-space:nowrap;font-family:var(--pk-font);font-size:19px;border:3px solid rgba(255,255,255,.9);border-radius:999px;padding:12px 28px;color:#fff;background:var(--pk-accent);cursor:pointer;box-shadow:0 5px 0 rgba(0,0,0,.3);min-width:210px;letter-spacing:.5px}
#pk-ui .pk-btn:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.3)}
#pk-ui .pk-btn.pk-cta{background:linear-gradient(180deg,#5ee35e,#22a83a);animation:pk-pulse 1s ease-in-out infinite}
#pk-ui .pk-btn.pk-ghost{background:var(--pk-ghost-bg,rgba(255,255,255,.14));border-color:var(--pk-ghost-edge,rgba(255,255,255,.5));color:var(--pk-ghost-ink,#fff);font-size:16px;padding:9px 22px}
#pk-ui .pk-banner{position:absolute;top:22%;left:50%;transform:translateX(-50%);font-size:clamp(20px,6vw,34px);padding:8px 18px;border-radius:14px;background:var(--pk-accent);border:3px solid #fff;box-shadow:var(--pk-shadow);opacity:0;transition:opacity .2s,transform .2s;white-space:nowrap}
#pk-ui .pk-banner.pk-show{opacity:1;transform:translateX(-50%) scale(1.04)}
#pk-ui .pk-toasts{position:absolute;left:0;right:0;top:34%;display:flex;flex-direction:column;align-items:center;gap:4px}
#pk-ui .pk-toast{font-size:clamp(28px,9vw,54px);line-height:1;animation:pk-toast var(--pk-ms,900ms) cubic-bezier(.2,1.4,.4,1) forwards;white-space:nowrap}
#pk-ui .pk-toast.m{font-size:clamp(20px,6vw,34px)}
#pk-ui .pk-toast.xl{font-size:clamp(40px,13vw,80px)}
#pk-ui .pk-hint{position:absolute;bottom:16%;left:50%;transform:translateX(-50%);font-size:clamp(15px,4.4vw,22px);padding:9px 16px;border-radius:999px;background:var(--pk-panel);border:2px solid var(--pk-edge);opacity:0;transition:opacity .25s;white-space:nowrap}
#pk-ui .pk-hint.pk-show{opacity:1}
#pk-ui .pk-hand{position:absolute;width:0;height:0;opacity:0;transition:opacity .25s}
#pk-ui .pk-hand.pk-show{opacity:1}
#pk-ui .pk-hand-move{position:absolute;left:-12px;top:-4px;animation:var(--pk-gesture) 1.6s ease-in-out infinite}
#pk-ui .pk-hand-move svg{width:calc(56px*var(--s));height:calc(63px*var(--s));filter:drop-shadow(0 6px 4px rgba(0,0,0,.35))}
#pk-ui .pk-hand-ring{position:absolute;left:-22px;top:-22px;width:44px;height:44px;border-radius:50%;border:4px solid rgba(255,255,255,.9);opacity:0;animation:pk-ring 1.6s ease-out infinite}
#pk-ui .pk-hand-label{position:absolute;left:50%;top:calc(76px*var(--s));transform:translateX(-50%);font-size:calc(16px*var(--s));padding:6px 14px;background:var(--pk-panel);border:2px solid var(--pk-edge);border-radius:10px;box-shadow:var(--pk-shadow);white-space:nowrap;letter-spacing:.6px}
#pk-ui .pk-hidden{display:none!important}
#pk-ui .pk-debug{position:absolute;left:8px;bottom:8px;font:12px monospace;color:#9f9;background:rgba(0,0,0,.5);padding:3px 6px;border-radius:4px}
#pk-ui .pk-pill,#pk-ui .pk-obj,#pk-ui .pk-tagline,#pk-ui .pk-tap,#pk-ui .pk-card,#pk-ui .pk-hint,#pk-ui .pk-hand-label{color:var(--pk-panel-ink,var(--pk-ink))}
#pk-ui .pk-card .pk-sub{color:var(--pk-panel-ink2,var(--pk-ink2))}
html[data-pk-skin=parchment] #pk-ui .pk-btn.pk-stroke{-webkit-text-stroke-color:#1c1a2e;text-shadow:0 4px 0 #1c1a2e}
#pk-ui .pk-tap,#pk-ui .pk-hint,#pk-ui .pk-hand-label,#pk-ui .pk-card .pk-title,#pk-ui .pk-card .pk-score,#pk-ui .pk-card .pk-near-label,#pk-ui .pk-card .pk-near-note{-webkit-text-stroke-color:var(--pk-panel-stroke,var(--pk-text-stroke));text-shadow:0 4px 0 var(--pk-panel-stroke,var(--pk-text-stroke))}
@keyframes pk-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@keyframes pk-bump{0%{transform:scale(1)}40%{transform:scale(1.25)}100%{transform:scale(1)}}
@keyframes pk-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
@keyframes pk-pop{0%{opacity:0;transform:scale(.4)}100%{opacity:1;transform:scale(1)}}
@keyframes pk-logo{0%{opacity:0;transform:rotate(-3deg) scale(.3)}100%{opacity:1;transform:rotate(-3deg) scale(1)}}
@keyframes pk-star{to{opacity:1;transform:scale(1)}}
@keyframes pk-toast{0%{opacity:0;transform:scale(.3) translateY(10px)}18%{opacity:1;transform:scale(1.18)}30%{transform:scale(1)}75%{opacity:1;transform:translateY(-6px)}100%{opacity:0;transform:translateY(-34px)}}
@keyframes pk-ring{0%{opacity:0;transform:scale(.3)}10%{opacity:.9}60%{opacity:0;transform:scale(1.6)}100%{opacity:0}}
@keyframes pk-g-tap{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(0,6px) scale(.86)}55%{transform:translate(0,0) scale(1)}}
@keyframes pk-g-drag-h{0%,100%{transform:translateX(calc(var(--pk-span)*-1))}50%{transform:translateX(var(--pk-span))}}
@keyframes pk-g-drag-v{0%,100%{transform:translateY(calc(var(--pk-span)*-1))}50%{transform:translateY(var(--pk-span))}}
@keyframes pk-g-swipe-up{0%{opacity:0;transform:translateY(var(--pk-span))}15%{opacity:1}70%{opacity:1;transform:translateY(calc(var(--pk-span)*-1))}100%{opacity:0;transform:translateY(calc(var(--pk-span)*-1))}}
@keyframes pk-g-swipe-left{0%{opacity:0;transform:translateX(var(--pk-span))}15%{opacity:1}70%{opacity:1;transform:translateX(calc(var(--pk-span)*-1))}100%{opacity:0}}
@keyframes pk-g-swipe-right{0%{opacity:0;transform:translateX(calc(var(--pk-span)*-1))}15%{opacity:1}70%{opacity:1;transform:translateX(var(--pk-span))}100%{opacity:0}}
@keyframes pk-g-circle{0%,100%{transform:translate(var(--pk-span),0)}25%{transform:translate(0,var(--pk-span))}50%{transform:translate(calc(var(--pk-span)*-1),0)}75%{transform:translate(0,calc(var(--pk-span)*-1))}}
@keyframes pk-g-hold{0%,100%{transform:scale(1)}30%,80%{transform:translateY(5px) scale(.88)}}
`;

function softwareRenderer() {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) return true;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch { return false; }
}
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

/* ------------------------------------------------------------- createGame */

export function createGame(def) {
  if (!def || typeof def !== 'object') throw new Error('createGame: definition object required');
  const q = query();
  const testMode = q.has('test');
  const trailerMode = q.has('trailer');
  const autoplay = testMode || trailerMode;
  const debug = q.has('debug');
  const cfg = def.config || {};
  const meta = { title: 'Untitled', slug: 'untitled', version: 'v01', genre: 'arcade', dimension: '2d', orientation: 'portrait', mode: 'GAME', storeUrl: { ios: '', android: '' }, seed: 1, ...(cfg.meta || {}) };

  // strings + language options
  const strings = {};
  for (const src of [DEFAULT_STRINGS, def.strings || {}]) {
    for (const [lang, table] of Object.entries(src)) strings[lang] = { ...(strings[lang] || {}), ...table };
  }
  const langs = Object.keys(def.strings || { en: {} });
  const sharedDefaults = cfg.sharedDefaults || {};
  const shared = {};
  for (const [k, p] of Object.entries(SHARED_PARAMS)) shared[k] = k in sharedDefaults ? { ...p, def: coerce(p, sharedDefaults[k]) } : p;
  if (meta.mode === 'AD' && !('adMode' in sharedDefaults)) shared.adMode = { ...shared.adMode, def: true };
  // English by default (the marketer can pick another language, or 'auto' to follow the device).
  const langDef = sharedDefaults.language && ['auto', ...langs].includes(sharedDefaults.language) ? sharedDefaults.language : (langs.includes('en') ? 'en' : 'auto');
  const schema = { ...shared, language: { ...shared.language, def: langDef, options: ['auto', ...langs] }, ...(cfg.params || {}) };
  const schemaErrors = validateSchema(schema);
  const values = {};
  for (const [k, p] of Object.entries(schema)) values[k] = p.def;
  function applyDifficulty() {
    const o = (cfg.difficultyOverrides || {})[values.difficulty];
    if (o) for (const [k, v] of Object.entries(o)) if (schema[k]) values[k] = coerce(schema[k], v);
  }
  applyDifficulty();
  // values baked in by the Blyth editor on export (window.__PLAYABLE_VALUES__) win over defaults and difficulty presets
  const baked = window.__PLAYABLE_VALUES__ && typeof window.__PLAYABLE_VALUES__ === 'object' ? window.__PLAYABLE_VALUES__ : null;
  if (baked) {
    if (baked.difficulty !== undefined) { values.difficulty = coerce(schema.difficulty, baked.difficulty); applyDifficulty(); }
    for (const [k, v] of Object.entries(baked)) if (schema[k] && k !== 'difficulty') values[k] = coerce(schema[k], v);
  }
  if (trailerMode && cfg.trailer) for (const [k, v] of Object.entries(cfg.trailer)) if (schema[k]) values[k] = coerce(schema[k], v);
  // test hooks: ?ad (ad mode), ?adfail=N (forced near-miss from level N), ?level=N (start at level N)
  if (q.has('ad') || q.has('adfail')) values.adMode = true;
  if (q.has('adfail')) values.adFailLevel = coerce(schema.adFailLevel, q.get('adfail') || 3);
  const startLevel = clamp(parseInt(q.get('level') || '1', 10) || 1, 1, 9);
  const eventLimitQ = parseInt(q.get('events') || '', 10);
  // ?speed=N (autoplay only): run N fixed steps per frame-time for fast automated checks
  const simSpeed = autoplay ? clamp(parseFloat(q.get('speed') || '1') || 1, 1, 8) : 1;

  const T = {
    ready: false, _state: 'loading', score: 0, best: 0, time: 0, frames: 0, fps: 0, level: startLevel,
    eventLimit: Number.isFinite(eventLimitQ) && eventLimitQ > 0 ? eventLimitQ : (Number(cfg.eventLimit) > 0 ? Number(cfg.eventLimit) : 200),
    errors: [], events: [], schemaErrors, meta, schema, params: values,
    get state() { return this._state; },
    set state(v) { this._state = v; },
  };
  window.addEventListener('error', (e) => T.errors.push(String(e.message || e.error || e)));
  window.addEventListener('unhandledrejection', (e) => T.errors.push(`unhandledrejection: ${String(e.reason && e.reason.message || e.reason)}`));
  if (schemaErrors.length) schemaErrors.forEach((m) => console.error(`[playable] schema: ${m}`));

  function lang() {
    const forced = q.get('lang'); if (forced && strings[forced]) return forced;
    if (values.language && values.language !== 'auto') return values.language;
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return strings[nav] && langs.includes(nav) ? nav : (langs[0] || 'en');
  }
  function t(key, vars) {
    const L = lang();
    let s = (strings[L] && strings[L][key]) ?? (strings.en && strings.en[key]) ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    return s;
  }

  // seed
  let seed = parseInt(q.get('seed') || '', 10);
  if (!Number.isFinite(seed)) {
    if (autoplay) seed = meta.seed;
    else { try { seed = crypto.getRandomValues(new Uint32Array(1))[0]; } catch { seed = Date.now() >>> 0; } }
  }

  // DOM
  const fontCss = PK_FONT_FACES.map((f) => `@font-face{font-family:'${PK_FONT_FAMILY}';font-style:normal;font-weight:400 900;font-display:block;src:url(${f.src}) format('woff2');unicode-range:${f.range}}`).join('');
  const style = el('style'); style.textContent = fontCss + UI_CSS; document.head.appendChild(style);
  const fontsReady = (document.fonts && document.fonts.load) ? Promise.race([Promise.all(['800 20px "PK Display"', '800 20px "PK Display"'].map((f) => document.fonts.load(f, 'AaĞş0'))), new Promise((r) => setTimeout(r, 1200))]).catch(() => {}) : Promise.resolve();
  const canvas = document.getElementById('pk-canvas') || (() => { const c = el('canvas'); c.id = 'pk-canvas'; document.body.appendChild(c); return c; })();
  const fxCanvas = el('canvas'); fxCanvas.id = 'pk-fx'; canvas.after(fxCanvas);
  // Without a GPU (software WebGL, headless capture), a CPU-backed 2D canvas is far faster than emulated GPU raster.
  const softwareGL = softwareRenderer();
  const cpu2d = q.has('cpu2d') || softwareGL;
  const ctx2dOpts = cpu2d ? { willReadFrequently: true } : undefined;
  const fxg = fxCanvas.getContext('2d', ctx2dOpts);
  const ui = el('div'); ui.id = 'pk-ui'; document.body.appendChild(ui);
  const hud = el('div', 'pk-hud'); const colL = el('div', 'pk-col'); const colR = el('div', 'pk-col pk-r');
  const hudL = el('div', 'pk-pill pk-noicon'); const hudR = el('div', 'pk-pill pk-noicon pk-hidden');
  colL.append(hudL); colR.append(hudR); hud.append(colL, colR);
  const prog = el('div', 'pk-prog pk-hidden'); const progTrack = el('div', 'pk-prog-track'); const progFill = el('div', 'pk-prog-fill');
  const progFlag = el('div', 'pk-prog-flag'); progFlag.innerHTML = iconSvg('flag', 26); const progLabel = el('div', 'pk-prog-label pk-stroke pk-hidden');
  progTrack.append(progFill, progFlag); prog.append(progTrack, progLabel);
  const obj = el('div', 'pk-obj pk-hidden');
  const intro = el('div', 'pk-center pk-intro'); const introLogo = el('div', 'pk-logo pk-stroke'); const introSub = el('div', 'pk-tagline pk-hidden'); const introTap = el('div', 'pk-tap pk-stroke');
  intro.append(introLogo, introSub, introTap);
  const end = el('div', 'pk-center pk-end pk-hidden'); const card = el('div', 'pk-card');
  const endStars = el('div', 'pk-stars pk-hidden'); endStars.innerHTML = iconSvg('star', 58).repeat(3);
  const endTitle = el('div', 'pk-title pk-stroke'); const endSub = el('div', 'pk-sub'); const endScore = el('div', 'pk-score pk-stroke');
  const endNear = el('div', 'pk-near pk-hidden'); const endNearLabel = el('div', 'pk-near-label pk-stroke'); const endNearTrack = el('div', 'pk-near-track'); const endNearFill = el('div', 'pk-near-fill');
  const endNearNote = el('div', 'pk-near-note pk-stroke pk-hidden');
  endNearTrack.append(endNearFill); endNear.append(endNearLabel, endNearTrack, endNearNote);
  const endBest = el('div', 'pk-sub');
  const ctaBtn = el('button', 'pk-btn pk-cta pk-stroke'); const nextBtn = el('button', 'pk-btn pk-stroke pk-hidden'); const retryBtn = el('button', 'pk-btn pk-ghost');
  card.append(endStars, endTitle, endSub, endScore, endNear, endBest, ctaBtn, nextBtn, retryBtn); end.append(card);
  const banner = el('div', 'pk-banner pk-stroke'); const hint = el('div', 'pk-hint pk-stroke'); const dbg = el('div', 'pk-debug pk-hidden');
  const toasts = el('div', 'pk-toasts');
  const hand = el('div', 'pk-hand'); const handMove = el('div', 'pk-hand-move'); handMove.innerHTML = HAND_SVG; const handRing = el('div', 'pk-hand-ring'); const handLabel = el('div', 'pk-hand-label pk-stroke pk-hidden');
  hand.append(handRing, handMove, handLabel);
  ui.append(hud, prog, obj, toasts, intro, banner, hint, hand, end, dbg);
  if (debug) dbg.classList.remove('pk-hidden');

  // the pixel ratio the game is drawn at: the screen's, capped at 2; adaptResolution() lowers it when frames run slow
  let dprCap = 2;

  // layout
  const view = { w: 0, h: 0, dpr: 1, designW: 390, designH: 844, scale: 1, ox: 0, oy: 0, left: 0, top: 0, right: 390, bottom: 844, portrait: true };
  view.toScreen = (x, y) => ({ x: view.ox + x * view.scale, y: view.oy + y * view.scale });
  view.toDesign = (sx, sy) => ({ x: (sx - view.ox) / view.scale, y: (sy - view.oy) / view.scale });
  /** NDC (-1..1, y up, e.g. from THREE Vector3.project) → design coordinates. */
  view.ndcToDesign = (nx, ny) => view.toDesign((nx + 1) / 2 * view.w, (1 - ny) / 2 * view.h);
  function layout() {
    const w = window.innerWidth || 390; const h = window.innerHeight || 844;
    const portrait = meta.orientation === 'portrait' ? true : meta.orientation === 'landscape' ? false : h >= w;
    const dw = portrait ? 390 : 844; const dh = portrait ? 844 : 390;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    fxCanvas.width = Math.round(w * dpr); fxCanvas.height = Math.round(h * dpr);
    if (overlayCanvas) { overlayCanvas.width = Math.round(w * dpr); overlayCanvas.height = Math.round(h * dpr); }
    const scale = Math.min(w / dw, h / dh);
    const ox = (w - dw * scale) / 2; const oy = (h - dh * scale) / 2;
    Object.assign(view, { w, h, dpr, designW: dw, designH: dh, scale, ox, oy, portrait,
      left: -ox / scale, top: -oy / scale, right: dw + ox / scale, bottom: dh + oy / scale });
    ui.style.setProperty('--s', String(clamp(Math.min(w / 390, h / 700), 0.72, 1.35)));
    // end card zoom: the whole card shrinks on narrow or short screens (small phones, editor previews, landscape)
    ui.style.setProperty('--pk-z', String(clamp(Math.min(w / 430, (h - 60) / 440), 0.5, 1)));
    placeHand();
    if (def.resize) safeCall(() => def.resize(ctx));
  }

  // input
  const input = { down: false, x: 0, y: 0, px: 0, py: 0, startX: 0, startY: 0, dx: 0, dy: 0, taps: [], swipes: [], keys: new Set(), pressed: new Set(), axisX: 0, axisY: 0, action: false, idle: 0, bot: false, released: false, pointerType: '', hover: { active: false, x: 0, y: 0, t: 0 }, hoverSteer: false };
  let hoverDown = false; // def.hoverSteer: a mouse hovering over the game counts as a held drag
  let lastPointer = null; let swallowPointer = false;
  function toDesign(cx, cy) { return view.toDesign(cx, cy); }
  function onDown(e) {
    audio.unlock();
    const p = toDesign(e.clientX, e.clientY);
    input.pointerType = e.pointerType || 'mouse'; hoverDown = false;
    input.x = p.x; input.y = p.y; input.px = e.clientX; input.py = e.clientY;
    input.idle = 0; hideHint(); hideHandIfHint();
    // def.passStartTap === false: the touch that starts the game is not passed to it (no tap / drag / release)
    if (T.state === 'intro' && def.passStartTap === false) { swallowPointer = true; startPlay(); return; }
    swallowPointer = false;
    input.down = true; input.startX = p.x; input.startY = p.y; lastPointer = { x: p.x, y: p.y, t: performance.now() };
    if (T.state === 'intro') startPlay();
  }
  function onMove(e) {
    const p = toDesign(e.clientX, e.clientY);
    if (e.pointerType) input.pointerType = e.pointerType;
    const mouse = (e.pointerType || 'mouse') === 'mouse';
    if (mouse) { input.hover.active = true; input.hover.x = p.x; input.hover.y = p.y; input.hover.t = T.time; }
    // def.hoverSteer: moving the mouse over the game steers like a held drag (no click needed on trackpads)
    if (mouse && def.hoverSteer && !input.down && T.state === 'play') {
      hoverDown = true; input.down = true; input.startX = p.x; input.startY = p.y; lastPointer = { x: p.x, y: p.y, t: performance.now() };
    }
    if (input.down && lastPointer) { input.dx += p.x - lastPointer.x; input.dy += p.y - lastPointer.y; lastPointer.x = p.x; lastPointer.y = p.y; }
    input.x = p.x; input.y = p.y; input.px = e.clientX; input.py = e.clientY;
    if (input.down || mouse) input.idle = 0;
  }
  /**
   * Analog stick for movement games: { x, y } in -1..1 (y down), mag 0..1, mode 'keys' | 'touch' | 'mouse' | 'none'.
   * - keyboard (arrows / WASD) wins when pressed;
   * - touch (and the bot): a floating joystick from where the finger went down (radius in design px);
   * - mouse / trackpad: no click needed — pass the hero's on-screen design position as { x, y } and the hero
   *   heads toward the cursor (it stops when the cursor rests on the hero); a held click works too.
   */
  const stickMem = { moving: false, hx: 0, hy: 0, t: 0 };
  input.stick = (o = {}) => {
    const out = { x: 0, y: 0, mag: 0, mode: 'none', active: false };
    if (input.axisX || input.axisY) { const m = Math.hypot(input.axisX, input.axisY) || 1; out.x = input.axisX / m; out.y = input.axisY / m; out.mag = 1; out.mode = 'keys'; out.active = true; return out; }
    const dead = o.dead ?? 0.12;
    const mouse = !input.bot && input.pointerType === 'mouse' && o.x != null && o.y != null;
    if (mouse) {
      if (!input.hover.active && !input.down) { stickMem.moving = false; return out; }
      const px = input.down ? input.x : input.hover.x; const py = input.down ? input.y : input.hover.y;
      const dx = px - o.x; const dy = py - o.y; const d = Math.hypot(dx, dy);
      // Forgiving by default: the hero stops when the cursor is anywhere on it (≥ 30 px), starts again a little
      // further out (no stutter at the edge), and eases up to full speed over a wide ring.
      const R0 = o.mouseRadius ?? 120; const R = Math.max(R0, 130);
      const stopPx = Math.max(30, dead * R0); const startPx = stopPx + 12;
      if (stickMem.moving ? d < stopPx : d < startPx) { stickMem.moving = false; out.mode = 'mouse'; return out; }
      stickMem.moving = true;
      const u = clamp((d - stopPx) / (R - stopPx), 0, 1); const k = 0.35 + 0.65 * u * u * (3 - 2 * u);
      // smooth the heading a little so tiny cursor wobbles don't jerk the hero around
      let hx = dx / d; let hy = dy / d;
      const now = T.time; const sdt = clamp(now - stickMem.t, 0, 0.1); stickMem.t = now;
      // (a turn of more than 90° snaps: lerping through an exact reversal would stall at zero)
      if ((stickMem.hx || stickMem.hy) && stickMem.hx * hx + stickMem.hy * hy > 0) { const a = 1 - Math.exp(-sdt * 18); hx = stickMem.hx + (hx - stickMem.hx) * a; hy = stickMem.hy + (hy - stickMem.hy) * a; const l = Math.hypot(hx, hy) || 1; hx /= l; hy /= l; }
      stickMem.hx = hx; stickMem.hy = hy;
      out.x = hx * k; out.y = hy * k;
      out.mag = k; out.mode = 'mouse'; out.active = true; return out;
    }
    if (!input.down) return out;
    const R = o.radius ?? 70;
    let dx = input.x - input.startX; let dy = input.y - input.startY; const d = Math.hypot(dx, dy);
    if (d > R && o.follow !== false && !input.bot) { input.startX = input.x - (dx / d) * R; input.startY = input.y - (dy / d) * R; dx = input.x - input.startX; dy = input.y - input.startY; }
    const k = clamp((Math.min(d, R) / R - dead) / (1 - dead), 0, 1);
    if (d > 1e-3) { out.x = (dx / d) * k; out.y = (dy / d) * k; }
    out.mag = k; out.mode = 'touch'; out.active = true; return out;
  };
  function onLeave() { input.hover.active = false; if (hoverDown) { hoverDown = false; input.down = false; input.released = true; lastPointer = null; } }
  function onUp(e) {
    if (swallowPointer) { swallowPointer = false; return; }
    if (!input.down || hoverDown) return;
    const p = toDesign(e.clientX, e.clientY);
    const ddx = p.x - input.startX; const ddy = p.y - input.startY; const dist = Math.hypot(ddx, ddy);
    const dt = performance.now() - (lastPointer ? lastPointer.t : 0);
    if (dist < 14 && dt < 400) input.taps.push({ x: p.x, y: p.y });
    else if (dist > 30) input.swipes.push(Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up'));
    input.down = false; input.released = true; lastPointer = null;
  }
  canvas.addEventListener('pointerdown', onDown);
  fxCanvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  document.documentElement.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);
  window.addEventListener('keydown', (e) => {
    audio.unlock();
    const startKey = T.state === 'intro' && (e.code === 'Space' || e.code === 'Enter' || e.code.startsWith('Arrow'));
    if (!input.keys.has(e.code) && !(startKey && def.passStartTap === false)) input.pressed.add(e.code);
    input.keys.add(e.code); input.idle = 0; hideHint(); hideHandIfHint();
    if (startKey) startPlay();
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => input.keys.delete(e.code));
  window.addEventListener('blur', () => { input.keys.clear(); input.down = false; });

  function computeAxes() {
    const k = input.keys;
    const ax = (k.has('ArrowRight') || k.has('KeyD') ? 1 : 0) - (k.has('ArrowLeft') || k.has('KeyA') ? 1 : 0);
    const ay = (k.has('ArrowDown') || k.has('KeyS') ? 1 : 0) - (k.has('ArrowUp') || k.has('KeyW') ? 1 : 0);
    input.axisX = ax; input.axisY = ay;
    input.action = input.pressed.has('Space') || input.pressed.has('Enter') || input.taps.length > 0;
  }
  function applyBot() {
    if (!autoplay || !def.bot || T.state !== 'play') return;
    const b = safeCall(() => def.bot(ctx)) || {};
    input.bot = true;
    if (typeof b.axisX === 'number') input.axisX = clamp(b.axisX, -1, 1);
    if (typeof b.axisY === 'number') input.axisY = clamp(b.axisY, -1, 1);
    if (b.tap) { input.taps.push(b.tap); input.action = true; }
    if (b.swipe) input.swipes.push(b.swipe);
    if (b.action) input.action = true;
    if (b.drag) { input.down = true; input.dx += b.drag.dx || 0; input.dy += b.drag.dy || 0; if (b.drag.x != null) input.x = b.drag.x; if (b.drag.y != null) input.y = b.drag.y; }
    if (b.pointer) {
      input.down = !!b.pointer.down; if (b.pointer.x != null) input.x = b.pointer.x; if (b.pointer.y != null) input.y = b.pointer.y;
      if (b.pointer.startX != null) input.startX = b.pointer.startX; if (b.pointer.startY != null) input.startY = b.pointer.startY;
      if (b.pointer.released) input.released = true;
    }
    if (b.released) input.released = true;
  }
  function clearFrameInput() { input.taps.length = 0; input.swipes.length = 0; input.pressed.clear(); input.dx = 0; input.dy = 0; input.action = false; input.released = false; if (input.bot) { input.down = false; input.bot = false; } }

  // audio
  const audio = createAudio(() => values, () => meta.slug);

  // host messaging
  function post(msg) { try { if (window.parent && window.parent !== window) window.parent.postMessage(msg, '*'); } catch { /* ignore */ } }
  function emit(type, data) { T.events.push({ type, data, t: Math.round(T.time * 1000) / 1000 }); while (T.events.length > T.eventLimit) T.events.shift(); }

  function setParams(next, from = 'host') {
    if (!next || typeof next !== 'object') return [];
    const changed = [];
    let needRestart = false;
    for (const [k, v] of Object.entries(next)) {
      const p = schema[k]; if (!p) continue;
      const nv = coerce(p, v);
      if (nv !== values[k]) { values[k] = nv; changed.push(k); if (p.apply === 'restart') needRestart = true; }
    }
    if (!changed.length) return changed;
    emit('params', { changed, from });
    applyStyleParams(); audio.applyVolumes(); refreshTexts();
    if (changed.includes('musicStyle') && T.state === 'play') audio.setStyle(values.musicStyle);
    if (changed.includes('difficulty')) applyDifficulty();
    if (needRestart) restart(T.state === 'play' || T.state === 'end');
    else if (def.onParams) safeCall(() => def.onParams(ctx, changed));
    return changed;
  }
  window.addEventListener('message', (event) => {
    const m = event.data;
    if (!m || typeof m !== 'object' || event.source !== window.parent) return;
    if (m.type === 'playable:update') setParams(m.params || m.values || {});
    else if (m.type === 'playable:command') command(m.name, m.value);
  });
  function command(name, value) {
    if (name === 'volume') { audio.setVolume(value); if (Number(value) > 0 && audio.muted) audio.setMuted(false); }
    else if (name === 'pause') paused = true;
    else if (name === 'resume') paused = false;
    else if (name === 'mute') audio.setMuted(true);
    else if (name === 'unmute') audio.setMuted(false);
    else if (name === 'restart') restart(true);
    else if (name === 'snapshot') post({ type: 'playable:snapshot', image: snapshot(value), state: T.state, time: T.time, level: T.level });
    emit('command', { name });
  }
  // compatibility with hosts that inject window.playable before the game
  const host = window.playable && typeof window.playable === 'object' ? window.playable : null;
  if (host) {
    host.onUpdate = (u) => setParams((u && (u.params || u.values)) || {});
    host.onCommand = (n) => command(n);
  }

  function storeUrl() {
    const ios = values.storeUrlIos || meta.storeUrl.ios; const android = values.storeUrlAndroid || meta.storeUrl.android;
    return /android/i.test(navigator.userAgent) ? (android || ios) : (ios || android);
  }
  function cta() {
    emit('cta', {}); post({ type: 'playable:cta' });
    if (host && typeof host.cta === 'function') { try { host.cta(); } catch { /* ignore */ } }
    const store = storeUrl();
    try {
      if (window.mraid && typeof window.mraid.open === 'function') window.mraid.open(store || '');
      else if (window.FbPlayableAd && typeof window.FbPlayableAd.onCTAClick === 'function') window.FbPlayableAd.onCTAClick();
      else if (window.ExitApi && typeof window.ExitApi.exit === 'function') window.ExitApi.exit();
      else if (typeof window.install === 'function') window.install();
    } catch { /* ignore */ }
  }

  function hexAlpha(hex, a) { const [r, g, b] = math.hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
  function luminance(hex) {
    const lin = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const [r, g, b] = math.hexToRgb(hex); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }
  const DEFAULT_PANEL = '#1b1638';
  const PARCHMENT_PANEL = '#ecdcb4';
  function applyStyleParams() {
    const root = document.documentElement; const skin = values.uiSkin || 'candy';
    root.style.setProperty('--pk-accent', values.uiAccent || '#ff5b22');
    // parchment is dark ink on paper: with the untouched (dark) default panel it gets paper; a chosen panel colour is kept
    const custom = values.uiPanel && String(values.uiPanel).toLowerCase() !== DEFAULT_PANEL;
    const panel = custom ? values.uiPanel : skin === 'parchment' ? PARCHMENT_PANEL : DEFAULT_PANEL;
    root.style.setProperty('--pk-panel', hexAlpha(panel, skin === 'parchment' ? 0.95 : 0.84));
    // text on panels follows the panel's brightness, so every skin and panel colour stays readable
    const light = luminance(panel) > 0.4;
    root.style.setProperty('--pk-panel-ink', light ? (skin === 'parchment' ? '#3b2a14' : '#1c1a2e') : '#ffffff');
    root.style.setProperty('--pk-panel-ink2', light ? (skin === 'parchment' ? '#6b5332' : 'rgba(28,26,46,.72)') : 'rgba(255,255,255,.78)');
    root.style.setProperty('--pk-note', light ? '#b3261e' : '#ffd23f');
    if (light) root.style.setProperty('--pk-panel-stroke', skin === 'parchment' ? '#f6e7c4' : '#ffffff');
    else if (skin === 'parchment') root.style.setProperty('--pk-panel-stroke', '#2a1c0c');
    else root.style.removeProperty('--pk-panel-stroke');
    // the ghost button (Try again) sits on the panel too
    for (const [k, v] of [['--pk-ghost-bg', 'rgba(0,0,0,.06)'], ['--pk-ghost-edge', 'rgba(0,0,0,.28)'], ['--pk-ghost-ink', skin === 'parchment' ? '#3b2a14' : '#1c1a2e']]) { if (light) root.style.setProperty(k, v); else root.style.removeProperty(k); }
    root.setAttribute('data-pk-skin', skin);
  }
  function refreshTexts() {
    const title = def.titleKey ? t(def.titleKey) : meta.title;
    const words = String(title).split(' ');
    const split = words.length > 1 ? Math.ceil(words.length / 2) : 1;
    introLogo.innerHTML = '';
    introLogo.append(el('span', null, words.slice(0, split).join(' ')));
    if (words.length > 1) introLogo.append(el('span', null, words.slice(split).join(' ')));
    const tagline = def.taglineKey ? t(def.taglineKey) : '';
    introSub.textContent = tagline; introSub.classList.toggle('pk-hidden', !tagline);
    introTap.textContent = def.hintKey ? t(def.hintKey) : t('ui.tap');
    introTap.classList.toggle('pk-hidden', !!def.tutorial);
    retryBtn.textContent = values.adMode ? t('ad.retry') : t('ui.retry');
    nextBtn.textContent = t('ui.next');
    ctaBtn.textContent = values.ctaText || t('cta.play');
    ctaBtn.classList.toggle('pk-hidden', !values.adMode && meta.mode !== 'AD' && !storeUrl());
    if (handState.labelKey) handLabel.textContent = t(handState.labelKey);
  }
  ctaBtn.addEventListener('click', (e) => { e.stopPropagation(); cta(); });
  retryBtn.addEventListener('click', (e) => {
    e.stopPropagation(); audio.unlock();
    if (retryBtn.dataset.fromStart) { T.level = 1; emit('level', { level: 1, again: true }); restart(true); return; }
    if (values.adMode) { ad.retries += 1; emit('retry', { retries: ad.retries }); }
    restart(true);
  });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); audio.unlock(); goNextLevel(); });

  // hint + banner + hand
  let hintShown = false; let bannerTimer = null;
  const handState = { visible: false, x: 195, y: 600, gesture: 'tap', span: 70, labelKey: null, label: null, fromHint: false };
  function placeHand() {
    const p = view.toScreen(handState.x, handState.y);
    hand.style.left = `${p.x}px`; hand.style.top = `${p.y}px`;
    hand.style.setProperty('--pk-span', `${Math.round(handState.span * view.scale)}px`);
  }
  function showHand(opts = {}) {
    Object.assign(handState, { x: opts.x ?? handState.x, y: opts.y ?? handState.y, gesture: opts.gesture || handState.gesture || 'tap', span: opts.span ?? handState.span, fromHint: !!opts.fromHint });
    const label = opts.labelKey ? t(opts.labelKey) : opts.label;
    handState.labelKey = opts.labelKey || null;
    handLabel.textContent = label || ''; handLabel.classList.toggle('pk-hidden', !label);
    handMove.style.setProperty('--pk-gesture', `pk-g-${handState.gesture}`);
    handRing.classList.toggle('pk-hidden', !['tap', 'hold'].includes(handState.gesture));
    placeHand(); hand.classList.add('pk-show'); handState.visible = true;
  }
  function hideHand() { hand.classList.remove('pk-show'); handState.visible = false; }
  function hideHandIfHint() { if (handState.visible && (handState.fromHint || T.state === 'play')) hideHand(); }
  function showHint(text) {
    if (def.tutorial && !text) { showHand({ ...def.tutorial, fromHint: true }); hintShown = true; return; }
    hint.textContent = text || (def.hintKey ? t(def.hintKey) : t('ui.tap')); hint.classList.add('pk-show'); hintShown = true;
  }
  function hideHint() { if (hintShown) { hint.classList.remove('pk-show'); if (handState.fromHint) hideHand(); hintShown = false; } }

  // HUD counters
  const counters = new Map();
  function counter(id, value, opts = {}) {
    let c = counters.get(id);
    if (value === null || value === undefined) { if (c) { c.el.remove(); counters.delete(id); queueObjLayout(); } return; }
    if (!c) {
      const pill = el('div', `pk-pill${opts.icon ? '' : ' pk-noicon'}`);
      const iconEl = el('span'); if (opts.icon) iconEl.innerHTML = iconSvg(opts.icon); const txt = el('span', 'pk-stroke');
      txt.style.setProperty('-webkit-text-stroke', 'calc(3px*var(--s)) var(--pk-panel-stroke,var(--pk-text-stroke))');
      pill.append(iconEl, txt);
      (opts.side === 'right' ? colR : colL).append(pill);
      c = { el: pill, txt, iconEl, icon: opts.icon || null, value: null }; counters.set(id, c); queueObjLayout();
    }
    if (opts.icon && opts.icon !== c.icon) { c.icon = opts.icon; c.iconEl.innerHTML = iconSvg(opts.icon); c.el.classList.remove('pk-noicon'); }
    if (opts.color) c.txt.style.color = opts.color;
    const text = String(value);
    if (c.value !== text) { c.txt.textContent = text; if (c.value !== null && opts.bump !== false) { c.el.classList.remove('pk-bump'); void c.el.offsetWidth; c.el.classList.add('pk-bump'); } c.value = text; }
  }
  let heartsEl = null; let heartsLast = -1;
  function hearts(current, max) {
    if (current === null) { if (heartsEl) { heartsEl.remove(); heartsEl = null; } return; }
    if (!heartsEl) { heartsEl = el('div', 'pk-hearts'); colL.append(heartsEl); queueObjLayout(); }
    const n = Math.max(0, Math.round(current)); const m = Math.max(n, Math.round(max ?? n));
    if (n === heartsLast && heartsEl.childElementCount === m) return;
    heartsEl.innerHTML = Array.from({ length: m }, (_, i) => `<span class="${i < n ? '' : 'off'}">${iconSvg('heart', 24)}</span>`).join('');
    if (heartsLast >= 0 && n < heartsLast) { heartsEl.classList.remove('pk-shake'); void heartsEl.offsetWidth; heartsEl.classList.add('pk-shake'); }
    heartsLast = n;
  }
  const progDots = new Map(); let progWanted = false;
  // The objective pill sits centred under the first HUD row; push it below any side pill it would overlap.
  let objLayoutQueued = false;
  function queueObjLayout() { if (objLayoutQueued) return; objLayoutQueued = true; requestAnimationFrame(layoutObj); }
  function layoutObj() {
    objLayoutQueued = false; obj.style.top = '';
    fitProgress();
    if (obj.classList.contains('pk-hidden') || !obj.textContent) return;
    const o = obj.getBoundingClientRect(); let bottom = 0;
    for (const child of [...colL.children, ...colR.children]) {
      const r = child.getBoundingClientRect();
      if (!r.width || r.top >= o.bottom || r.bottom <= o.top || r.right <= o.left - 6 || r.left >= o.right + 6) continue;
      bottom = Math.max(bottom, r.bottom);
    }
    if (bottom) obj.style.top = `${Math.round(bottom - (ui.getBoundingClientRect().top || 0) + 6)}px`;
  }
  window.addEventListener('resize', queueObjLayout);
  // The progress track sits between the first HUD row's side pills (its flag must not touch them).
  function fitProgress() {
    prog.style.width = '';
    if (hud.classList.contains('pk-hidden')) return;
    const u = ui.getBoundingClientRect(); if (!u.width) return;
    const firstVisible = (col) => [...col.children].find((c) => !c.classList.contains('pk-hidden') && c.getBoundingClientRect().width > 0);
    const l = firstVisible(colL); const r = firstVisible(colR);
    const left = l ? l.getBoundingClientRect().right - u.left : 0; const right = r ? u.right - r.getBoundingClientRect().left : 0;
    const flag = 18 * (parseFloat(getComputedStyle(ui).getPropertyValue('--s')) || 1); const free = u.width - 2 * (Math.max(left, right) + 8 + flag);
    const max = Math.min(u.width * 0.58, 420);
    prog.style.width = `${Math.round(Math.max(Math.min(max, free), Math.min(max, 110)))}px`;
  }
  let scoreLen = 1;
  function progress(value, opts = {}) {
    if (value === null) { progWanted = false; prog.classList.add('pk-hidden'); return; }
    progWanted = true; if (T.state !== 'intro') prog.classList.remove('pk-hidden');
    progFill.style.width = `${clamp(value, 0, 1) * 100}%`;
    if (opts.label !== undefined) { progLabel.textContent = opts.label; progLabel.classList.toggle('pk-hidden', !opts.label); }
    if (opts.dots) {
      const seen = new Set();
      for (const d of opts.dots) {
        seen.add(d.id);
        let dot = progDots.get(d.id);
        if (!dot) { dot = el('div', `pk-prog-dot${d.me ? ' me' : ''}`); progTrack.append(dot); progDots.set(d.id, dot); }
        dot.classList.toggle('me', !!d.me); dot.style.left = `${clamp(d.at, 0, 1) * 100}%`; dot.style.background = d.color || '#fff';
      }
      for (const [id, dot] of progDots) if (!seen.has(id)) { dot.remove(); progDots.delete(id); }
    }
  }
  function toast(text, opts = {}) {
    const e = el('div', `pk-toast pk-stroke ${opts.size || ''}`, text);
    e.style.color = opts.color || '#fff';
    const ms = opts.ms || 900; e.style.setProperty('--pk-ms', `${ms}ms`);
    toasts.append(e); while (toasts.childElementCount > 3) toasts.firstChild.remove();
    setTimeout(() => e.remove(), ms + 50);
  }

  /* ------------------------------------------------------------ juice / fx */
  const fx = {
    parts: [], texts: [], rings: [], confetti: [],
    flashA: 0, flashColor: '#fff', flashDecay: 8,
    shakeT: 0, shakeDur: 0, shakeAmp: 0, offset: { x: 0, y: 0 },
    timeScale: 1, slowT: 0, freezeT: 0,
  };
  function toScreenOpt(x, y, space) { return space === 'screen' ? { x, y } : view.toScreen(x, y); }
  const fxApi = {
    /** Particle burst at design (x, y). shape: circle | square | star | spark | confetti */
    burst(x, y, o = {}) {
      const p = toScreenOpt(x, y, o.space); const n = Math.min(o.count ?? 14, 80);
      const colors = o.colors || [o.color || values.uiAccent || '#ffd23f'];
      const sp = (o.speed ?? 240) * view.scale; const size = (o.size ?? 7) * view.scale;
      for (let i = 0; i < n; i += 1) {
        const a = (o.angle ?? 0) + (o.spread ?? Math.PI * 2) * (Math.random() - (o.spread ? 0.5 : 0));
        const v = sp * (0.45 + Math.random() * 0.75);
        fx.parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.lift ?? 0) * view.scale, g: (o.gravity ?? 700) * view.scale, life: (o.life ?? 0.7) * (0.6 + Math.random() * 0.6), t: 0, size: size * (0.6 + Math.random() * 0.7), color: colors[i % colors.length], shape: o.shape || 'circle', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, drag: o.drag ?? 1.5 });
      }
      if (fx.parts.length > 600) fx.parts.splice(0, fx.parts.length - 600);
    },
    /** Floating text that rises and fades (e.g. "+10", "x2", "PERFECT"). */
    float(text, x, y, o = {}) {
      const p = toScreenOpt(x, y, o.space);
      fx.texts.push({ text: String(text), x: p.x, y: p.y, t: 0, life: o.life ?? 0.9, rise: (o.rise ?? 70) * view.scale, size: (o.size ?? 30) * view.scale, color: o.color || '#fff', stroke: o.stroke || '#1c1a2e' });
      if (fx.texts.length > 40) fx.texts.shift();
    },
    ring(x, y, o = {}) { const p = toScreenOpt(x, y, o.space); fx.rings.push({ x: p.x, y: p.y, t: 0, life: o.life ?? 0.45, r: (o.radius ?? 90) * view.scale, w: (o.width ?? 6) * view.scale, color: o.color || '#fff' }); },
    flash(color = '#ffffff', alpha = 0.55, ms = 140) { fx.flashColor = color; fx.flashA = alpha; fx.flashDecay = alpha / Math.max(0.03, ms / 1000); },
    shake(intensity = 8, ms = 260) { const amp = intensity * (values.cameraShake ?? 1); if (amp <= 0) return; fx.shakeAmp = Math.max(fx.shakeAmp * (fx.shakeT / Math.max(fx.shakeDur, 0.001)), amp); fx.shakeDur = ms / 1000; fx.shakeT = fx.shakeDur; },
    slowmo(factor = 0.35, ms = 600) { fx.timeScale = factor; fx.slowT = ms / 1000; },
    freeze(ms = 60) { fx.freezeT = Math.max(fx.freezeT, ms / 1000); },
    confetti(count = 140) {
      const colors = ['#ff3d6e', '#ffd23f', '#3dd6ff', '#5ee35e', '#b07cff', '#ff8a3d'];
      for (let i = 0; i < count; i += 1) fx.confetti.push({ x: Math.random() * view.w, y: -20 - Math.random() * view.h * 0.6, vx: (Math.random() - 0.5) * 80, vy: 120 + Math.random() * 160, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, w: 6 + Math.random() * 6, h: 10 + Math.random() * 8, color: colors[i % colors.length], t: 0, life: 3.5 });
    },
    haptic(ms = 15) { try { if (autoplay || !navigator.vibrate || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return; navigator.vibrate(ms); } catch { /* ignore */ } },
    get offset() { return fx.offset; },
    get timeScale() { return fx.timeScale; },
    clear() { fx.parts.length = 0; fx.texts.length = 0; fx.rings.length = 0; fx.confetti.length = 0; fx.flashA = 0; },
  };
  function updateFx(dt) {
    for (const p of fx.parts) { p.t += dt; p.vx *= 1 - Math.min(1, p.drag * dt); p.vy = p.vy * (1 - Math.min(1, p.drag * dt)) + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; }
    fx.parts = fx.parts.filter((p) => p.t < p.life);
    for (const tx of fx.texts) tx.t += dt; fx.texts = fx.texts.filter((tx) => tx.t < tx.life);
    for (const r of fx.rings) r.t += dt; fx.rings = fx.rings.filter((r) => r.t < r.life);
    for (const c of fx.confetti) { c.t += dt; c.x += (c.vx + Math.sin(c.t * 3 + c.rot) * 40) * dt; c.y += c.vy * dt; c.rot += c.vr * dt; }
    fx.confetti = fx.confetti.filter((c) => c.t < c.life && c.y < view.h + 30);
    fx.flashA = Math.max(0, fx.flashA - fx.flashDecay * dt);
    if (fx.shakeT > 0) {
      fx.shakeT -= dt; const k = Math.max(0, fx.shakeT / fx.shakeDur); const a = fx.shakeAmp * k * k;
      fx.offset.x = (Math.random() * 2 - 1) * a; fx.offset.y = (Math.random() * 2 - 1) * a;
      canvas.style.transform = `translate(${(fx.offset.x * view.scale).toFixed(1)}px,${(fx.offset.y * view.scale).toFixed(1)}px) scale(1.025)`;
      if (fx.shakeT <= 0) { fx.offset.x = 0; fx.offset.y = 0; fx.shakeAmp = 0; canvas.style.transform = ''; }
    }
    if (fx.slowT > 0) { fx.slowT -= dt; if (fx.slowT <= 0) fx.timeScale = 1; }
  }
  function renderFx() {
    const g = fxg; const d = view.dpr;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    if (!fx.parts.length && !fx.texts.length && !fx.rings.length && !fx.confetti.length && fx.flashA <= 0) return;
    g.setTransform(d, 0, 0, d, 0, 0);
    for (const r of fx.rings) { const k = r.t / r.life; g.globalAlpha = 1 - k; g.strokeStyle = r.color; g.lineWidth = r.w * (1 - k * 0.7); g.beginPath(); g.arc(r.x, r.y, r.r * ease.outCubic(k), 0, Math.PI * 2); g.stroke(); }
    for (const p of fx.parts) {
      const k = p.t / p.life; g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; g.fillStyle = p.color;
      const s = p.size * (p.shape === 'spark' ? 1 : 1 - k * 0.5);
      if (p.shape === 'square' || p.shape === 'confetti') { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-s / 2, -s / (p.shape === 'confetti' ? 4 : 2), s, p.shape === 'confetti' ? s / 2 : s); g.restore(); }
      else if (p.shape === 'star') { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.beginPath(); for (let i = 0; i < 10; i += 1) { const rr = i % 2 ? s * 0.45 : s; const aa = (i / 10) * Math.PI * 2; g.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } g.closePath(); g.fill(); g.restore(); }
      else if (p.shape === 'spark') { g.strokeStyle = p.color; g.lineWidth = Math.max(1, s * 0.35); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); g.stroke(); }
      else { g.beginPath(); g.arc(p.x, p.y, s / 2, 0, Math.PI * 2); g.fill(); }
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const tx of fx.texts) {
      const k = tx.t / tx.life; const pop = k < 0.15 ? ease.outBack(k / 0.15) : 1;
      g.globalAlpha = k > 0.65 ? (1 - k) / 0.35 : 1;
      g.font = `800 ${Math.round(tx.size * pop)}px ${FONT}`;
      const y = tx.y - tx.rise * ease.outCubic(k);
      g.lineJoin = 'round'; g.lineWidth = Math.max(3, tx.size * 0.18); g.strokeStyle = tx.stroke; g.strokeText(tx.text, tx.x, y); g.fillStyle = tx.color; g.fillText(tx.text, tx.x, y);
    }
    for (const c of fx.confetti) { g.globalAlpha = c.t > c.life - 0.5 ? (c.life - c.t) / 0.5 : 1; g.save(); g.translate(c.x, c.y); g.rotate(c.rot); g.scale(1, Math.cos(c.t * 6 + c.rot)); g.fillStyle = c.color; g.fillRect(-c.w / 2, -c.h / 2, c.w, c.h); g.restore(); }
    if (fx.flashA > 0) { g.globalAlpha = fx.flashA; g.fillStyle = fx.flashColor; g.fillRect(0, 0, view.w, view.h); }
    g.globalAlpha = 1;
  }

  /* ------------------------------------------------------ sprites + drawing */
  const sprites = {
    /** Offscreen canvas of w×h drawn by fn(g). Use for procedural textures (also THREE.CanvasTexture). */
    canvas(w, h, fn) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); const g = c.getContext('2d'); if (fn) fn(g, c); return c; },
    /** Pixel art from rows of characters; palette maps a char to a colour ('.' or ' ' = transparent). */
    pixel(rows, palette, opts = {}) {
      const scale = Math.max(1, Math.round(opts.scale || 1)); const h = rows.length; const w = Math.max(...rows.map((r) => r.length));
      return sprites.canvas(w * scale, h * scale, (g) => {
        for (let y = 0; y < h; y += 1) for (let x = 0; x < rows[y].length; x += 1) {
          const ch = rows[y][x]; const col = palette[ch]; if (!col || ch === '.' || ch === ' ') continue;
          g.fillStyle = col; g.fillRect(x * scale, y * scale, scale, scale);
        }
      });
    },
    /** Frames for an animation: array of row arrays sharing one palette. */
    frames(list, palette, opts = {}) { return list.map((rows) => sprites.pixel(rows, palette, opts)); },
    /** Copy with a 1px (×scale) outline around opaque pixels. */
    outline(src, color = '#1c1a2e', px = 1) {
      return sprites.canvas(src.width + px * 2, src.height + px * 2, (g) => {
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) g.drawImage(src, px + dx * px, px + dy * px);
        g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, src.width + px * 2, src.height + px * 2);
        g.globalCompositeOperation = 'source-over'; g.drawImage(src, px, px);
      });
    },
    /** Copy recoloured with a flat colour (hit flash, silhouettes, team colours via multiply). */
    tint(src, color, mode = 'source-atop', alpha = 1) {
      return sprites.canvas(src.width, src.height, (g) => { g.drawImage(src, 0, 0); g.globalCompositeOperation = mode; g.globalAlpha = alpha; g.fillStyle = color; g.fillRect(0, 0, src.width, src.height); });
    },
    /** Swap palette colours: map { '#from': '#to' } (exact match). */
    recolor(src, map) {
      const out = sprites.canvas(src.width, src.height, (g) => g.drawImage(src, 0, 0)); const g = out.getContext('2d');
      const img = g.getImageData(0, 0, out.width, out.height); const d = img.data;
      const pairs = Object.entries(map).map(([a, b]) => [math.hexToRgb(a), math.hexToRgb(b)]);
      for (let i = 0; i < d.length; i += 4) for (const [A, B] of pairs) if (d[i] === A[0] && d[i + 1] === A[1] && d[i + 2] === A[2]) { d[i] = B[0]; d[i + 1] = B[1]; d[i + 2] = B[2]; break; }
      g.putImageData(img, 0, 0); return out;
    },
  };
  const draw = {
    /** Ad-style text with a thick outline. */
    text(g, str, x, y, o = {}) {
      const size = o.size ?? 28;
      g.save(); g.font = `${o.weight || 800} ${size}px ${o.font || FONT}`; g.textAlign = o.align || 'center'; g.textBaseline = o.baseline || 'middle';
      if (o.alpha !== undefined) g.globalAlpha = o.alpha;
      if (o.stroke !== false) { g.lineJoin = 'round'; g.lineWidth = o.strokeW ?? Math.max(2, size * 0.2); g.strokeStyle = o.stroke || '#1c1a2e'; if (o.shadow !== false) { g.fillStyle = o.stroke || '#1c1a2e'; g.fillText(str, x, y + size * 0.1); g.strokeText(str, x, y + size * 0.1); } g.strokeText(str, x, y); }
      g.fillStyle = o.color || '#fff'; g.fillText(str, x, y); g.restore();
    },
    /** Crisp 5×7 pixel font. size = pixels per font pixel. Returns the drawn width. */
    pixelText(g, str, x, y, o = {}) {
      const s = o.size ?? 3; const text = String(str).toUpperCase(); const adv = 6 * s;
      const w = text.length * adv - s; let cx = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2; const cy = y - (o.baseline === 'top' ? 0 : 3.5 * s);
      g.save(); if (o.alpha !== undefined) g.globalAlpha = o.alpha;
      const passes = [];
      if (o.shadow !== false) passes.push([o.shadow || 'rgba(0,0,0,.45)', s, s]);
      if (o.outline) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) passes.push([o.outline, dx * s, dy * s]);
      passes.push([o.color || '#fff', 0, 0]);
      for (const [col, ox, oy] of passes) {
        g.fillStyle = col; let px = cx;
        for (const chRaw of text) {
          const ch = FONT_MAP[chRaw] || chRaw; const glyph = FONT5[ch] || FONT5[ch.toUpperCase()] || FONT5['?'];
          for (let row = 0; row < 7; row += 1) { const bits = glyph[row]; for (let col2 = 0; col2 < 5; col2 += 1) if (bits & (16 >> col2)) g.fillRect(px + col2 * s + ox, cy + row * s + oy, s, s); }
          px += adv;
        }
      }
      g.restore(); cx += 0; return w;
    },
    roundRect(g, x, y, w, h, r, fill, stroke, lineWidth = 3) {
      g.beginPath(); const rr = Math.min(r, w / 2, h / 2);
      g.moveTo(x + rr, y); g.arcTo(x + w, y, x + w, y + h, rr); g.arcTo(x + w, y + h, x, y + h, rr); g.arcTo(x, y + h, x, y, rr); g.arcTo(x, y, x + w, y, rr); g.closePath();
      if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lineWidth; g.stroke(); }
    },
    shadow(g, x, y, rx, ry, alpha = 0.25) { g.save(); g.globalAlpha = alpha; g.fillStyle = '#000'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.restore(); },
    /** Draw a sprite canvas anchored at (x, y) (default bottom-centre). */
    sprite(g, img, x, y, o = {}) {
      if (!img) return; const s = o.scale ?? 1; const w = img.width * s; const h = img.height * s;
      g.save(); g.translate(Math.round(x), Math.round(y)); if (o.rot) g.rotate(o.rot); if (o.flip) g.scale(-1, 1); if (o.alpha !== undefined) g.globalAlpha = o.alpha;
      g.imageSmoothingEnabled = o.smooth ?? false;
      g.drawImage(img, -w * (o.ax ?? 0.5), -h * (o.ay ?? 1), w, h); g.restore();
    },
  };

  // state
  let paused = false; let hidden = false; const gameState = {};
  let clockPaused = false; let runId = 0;

  // ad funnel (HANDOFF §4): forced near-miss, CTA end card, level gate, limited retries
  const ad = { fired: false, pending: null, retries: 0 };
  const adApi = {
    /** adMode param: the CTA end card is on. */
    get on() { return !!values.adMode; },
    /** A scripted near-miss should happen in this level (adMode && adFailLevel > 0 && level >= adFailLevel). */
    get forceFail() { return !!values.adMode && values.adFailLevel > 0 && T.level >= values.adFailLevel; },
    /** Progress (0..1) at which the scripted failure starts. */
    get failAt() { return values.adFailAt; },
    /** check() already fired in this run. */
    get fired() { return ad.fired; },
    /** Levels after this one are locked (adGateLevel). */
    get gated() { return !!values.adMode && values.adGateLevel > 0 && T.level >= values.adGateLevel; },
    get retriesLeft() { return values.adMode ? Math.max(0, values.maxRetries - ad.retries) : Infinity; },
    /** true ONCE per run when the scripted failure should start now. */
    check(progress) {
      if (!adApi.forceFail || ad.fired || !(progress >= values.adFailAt)) return false;
      ad.fired = true; emit('ad-fail', { level: T.level, progress: Math.round(progress * 1000) / 1000 });
      return true;
    },
    /**
     * Standard dramatic loss: slow-mo, red flash, "NOOO!" toast, then the SO CLOSE end card after `delay` ms
     * (real time). Other ctx.end() calls are ignored meanwhile. opts: { progress, delay, toast, title, sub, nearText, flash, slowmo }.
     */
    fail(o = {}) {
      if (T.state !== 'play' || ad.pending) return;
      if (!ad.fired) { ad.fired = true; emit('ad-fail', { level: T.level, progress: o.progress ?? null }); }
      const prog = clamp(typeof o.progress === 'number' ? o.progress : values.adFailAt, 0.01, 0.97);
      if (o.slowmo !== false) fxApi.slowmo(typeof o.slowmo === 'number' ? o.slowmo : 0.3, 900);
      fxApi.flash(o.flash || '#ff2a2a', 0.4, 300); fxApi.shake(10, 420); fxApi.haptic(80);
      if (o.toast !== false) toast(o.toast || t('ad.fail'), { color: '#ff5a5a', size: 'xl', ms: 1100 });
      audio.sfx('bad');
      ad.pending = { t: (o.delay ?? 1100) / 1000, result: { win: false, progress: prog, reason: 'ad-fail', title: o.title, sub: o.sub, nearText: o.nearText, score: o.score } };
    },
  };
  function goNextLevel() {
    if (adApi.gated) { emit('ad-gate', { level: T.level, blocked: true }); return false; }
    T.level += 1; emit('level', { level: T.level }); restart(true); return true;
  }

  // 2D overlay canvas above the game canvas (joystick, cards, boss bars on WebGL games). Created on first use;
  // cleared every frame and set to design space before render(), like ctx.g.
  let overlayCanvas = null; let overlayG = null;
  function getOverlay() {
    if (overlayG) return overlayG;
    overlayCanvas = el('canvas'); overlayCanvas.id = 'pk-overlay'; canvas.after(overlayCanvas);
    overlayCanvas.width = Math.round(view.w * view.dpr); overlayCanvas.height = Math.round(view.h * view.dpr);
    overlayG = overlayCanvas.getContext('2d', ctx2dOpts);
    const s0 = view.scale * view.dpr; overlayG.setTransform(s0, 0, 0, s0, view.ox * view.dpr, view.oy * view.dpr);
    return overlayG;
  }
  const rng = mulberry32(seed);
  const ctx = {
    canvas, view, input, audio, rng, t, meta, emit, ease, math, sprites, draw, font: FONT, softwareGL,
    fx: fxApi,
    get params() { return values; },
    get time() { return T.time; },
    get state() { return T.state; },
    get level() { return T.level; },
    get score() { return T.score; },
    set score(v) { const prev = T.score; T.score = v; hudL.textContent = String(Math.floor(v)); if (hudL.textContent.length !== scoreLen) { scoreLen = hudL.textContent.length; queueObjLayout(); } if (Math.floor(v) > Math.floor(prev)) { hudL.classList.remove('pk-bump'); void hudL.offsetWidth; hudL.classList.add('pk-bump'); } },
    get autoplay() { return autoplay; },
    get g() { return g2d; },
    assets: {
      image(key) { return images.get(key) || null; },
      bytes(key) { const m = window.__ASSETS__ && (window.__ASSETS__.models?.[key] || window.__ASSETS__.bin?.[key]); return m ? b64ToBytes(m) : null; },
      arrayBuffer(key) { const b = ctx.assets.bytes(key); return b ? b.buffer : null; },
      json(key) { return window.__ASSETS__?.json?.[key] ?? null; },
      has(kind, key) { return !!(window.__ASSETS__ && window.__ASSETS__[kind] && window.__ASSETS__[kind][key]); },
    },
    data: gameState,
    ui: {
      setScore(v) { ctx.score = v; },
      setRight(text) { hudR.textContent = text; hudR.classList.toggle('pk-hidden', !text && text !== 0); },
      hideScore(h = true) { hudL.classList.toggle('pk-hidden', h); },
      banner(text, ms = 1100) { banner.textContent = text; banner.classList.add('pk-show'); clearTimeout(bannerTimer); bannerTimer = setTimeout(() => banner.classList.remove('pk-show'), ms); },
      hint: showHint,
      hideHint,
      hideHud(h = true) { hud.classList.toggle('pk-hidden', h); prog.classList.toggle('pk-hidden', h || !progFill.style.width); },
      /** HUD pill with an icon: counter('coins', 120, { icon: 'coin', side: 'left' }). null removes it. */
      counter,
      hearts,
      /** Top progress track 0..1 with optional racer dots [{ id, at, color, me }] and label. */
      progress,
      /** Big pop text in the middle: toast('PERFECT!', { color, size: 'm' | 'xl', ms }). */
      toast,
      /** Short objective under the HUD ("Drag to lead your army"). null hides it. */
      objective(text) { obj.textContent = text || ''; obj.classList.toggle('pk-hidden', !text); queueObjLayout(); },
      /** Tutorial hand at design (x, y): gesture tap | hold | drag-h | drag-v | swipe-up | swipe-left | swipe-right | circle. */
      hand(opts) { showHand(opts); },
      hideHand,
      icon: iconSvg,
    },
    /** End the run: { win, title, sub, score, stars (0..3), progress (0..1, near-miss bar on a loss), next (show NEXT LEVEL), reason }. */
    end(result = {}) { finish(result); },
    /** Go to the next level (returns false when the ad gate locks it). */
    nextLevel() { return goNextLevel(); },
    restart() { restart(true); },
    /** Ad funnel helpers: on, forceFail, failAt, fired, gated, retriesLeft, check(progress), fail(opts). */
    ad: adApi,
    /** 2D context of a canvas above the game canvas, in design coordinates (cleared every frame). */
    get overlay() { return getOverlay(); },
    /** Stop / resume the run clock (ctx.time and the maxPlayTime cap), e.g. while an upgrade card is open. */
    clock: {
      pause() { clockPaused = true; },
      resume() { clockPaused = false; },
      get paused() { return clockPaused; },
    },
  };

  const g2d = (def.renderer || '2d') === '2d' ? canvas.getContext('2d', ctx2dOpts) : null;
  const images = new Map();

  function safeCall(fn) {
    try { return fn(); } catch (err) {
      T.errors.push(String(err && err.stack || err)); console.error('[playable]', err);
      return undefined;
    }
  }

  function resetRun() {
    // ctx.data lives as long as the game (renderers, pools, meshes made in init stay);
    // setup() is responsible for resetting per-run fields.
    T.score = 0; T.time = 0; hudL.textContent = '0'; input.idle = 0; hideHint(); hideHand();
    fx.timeScale = 1; fx.slowT = 0; fx.freezeT = 0; toasts.innerHTML = '';
    clockPaused = false; ad.fired = false; ad.pending = null; runId += 1; audio.stopLoops(80);
    safeCall(() => def.setup && def.setup(ctx));
  }
  function showIntro() {
    T.state = 'intro'; intro.classList.remove('pk-hidden'); end.classList.add('pk-hidden'); hud.classList.add('pk-hidden'); obj.classList.add('pk-hidden'); prog.classList.add('pk-hidden');
    if (def.tutorial) showHand(def.tutorial);
    emit('state', { state: 'intro' }); post({ type: 'playable:state', state: 'intro' });
    if (autoplay) setTimeout(() => { if (T.state === 'intro') startPlay(); }, 500);
  }
  function startPlay() {
    if (T.state === 'play') return;
    T.state = 'play'; intro.classList.add('pk-hidden'); end.classList.add('pk-hidden'); hud.classList.remove('pk-hidden');
    if (obj.textContent) obj.classList.remove('pk-hidden');
    queueObjLayout();
    if (progWanted) prog.classList.remove('pk-hidden');
    hideHand();
    emit('state', { state: 'play' }); post({ type: 'playable:state', state: 'play' });
    audio.unlock(); if (def.music !== false) audio.music(true);
    safeCall(() => def.start && def.start(ctx));
  }
  function finish(result) {
    if (T.state !== 'play' || ad.pending) return;
    T.state = 'end';
    audio.stopLoops(200);
    const win = !!result.win;
    const adOn = !!values.adMode;
    const adLose = adOn && !win;
    const gate = adOn && win && values.adGateLevel > 0 && T.level >= values.adGateLevel;
    // the last level is won: "download the full game" card with the CTA + Play again (from level 1)
    const isFinal = win && !result.next && !gate && result.final !== false;
    const score = result.score ?? T.score;
    if (score > T.best) T.best = score;
    const prog = typeof result.progress === 'number' ? clamp(result.progress, 0, 1) : null;
    const near = !win && prog !== null && prog > 0;
    // title + subtitle
    let title = result.title || (result.reason === 'time' && !win ? t('ui.time') : win ? t('ui.win') : t('ui.lose'));
    if (adLose) title = result.reason === 'ad-fail' ? (result.title || t('ui.close')) : (prog !== null && prog >= 0.5 ? t('ui.close') : title);
    if (gate) title = t('ad.locked', { n: T.level + 1 });
    if (isFinal) title = t('ui.final');
    endTitle.textContent = values.endTitle || title;
    if (gate && !values.endTitle) { const lock = el('span', 'pk-lock'); lock.innerHTML = iconSvg('lock', 40); endTitle.prepend(lock); }
    const sub = values.endSub || (gate ? t('ad.continue') : isFinal ? t('ui.finalSub') : adLose ? ((result.reason === 'ad-fail' && result.sub) || t('ad.sub')) : (result.sub || ''));
    endSub.textContent = sub; endSub.classList.toggle('pk-hidden', !sub);
    // stars
    const stars = typeof result.stars === 'number' ? clamp(Math.round(result.stars), 0, 3) : null;
    endStars.classList.toggle('pk-hidden', stars === null);
    if (stars !== null) [...endStars.children].forEach((s, i) => { s.classList.remove('on', 'off'); void s.getBoundingClientRect(); s.style.animationDelay = `${0.25 + i * 0.18}s`; s.classList.add(i < stars ? 'on' : 'off'); });
    // score count-up
    const target = Math.floor(score); const t0 = performance.now();
    const countUp = (now) => { const k = clamp((now - t0) / 700, 0, 1); endScore.textContent = String(Math.round(target * ease.outCubic(k))); if (k < 1 && T.state === 'end') requestAnimationFrame(countUp); };
    endScore.textContent = '0'; requestAnimationFrame(countUp);
    endScore.classList.toggle('pk-hidden', result.hideScore === true || adLose);
    // near miss bar (AD loss: big animated percentage; otherwise "SO CLOSE! 87%")
    endNear.classList.toggle('pk-hidden', !near);
    endNearNote.textContent = near && result.nearText ? String(result.nearText) : ''; endNearNote.classList.toggle('pk-hidden', !endNearNote.textContent);
    if (near) {
      const pct = Math.round(prog * 100);
      endNearLabel.textContent = adLose ? '0%' : `${t('ui.close')} ${pct}%`;
      endNearFill.style.transition = 'none'; endNearFill.style.width = '0'; void endNearFill.offsetWidth; endNearFill.style.transition = '';
      setTimeout(() => { endNearFill.style.width = `${prog * 100}%`; }, 80);
      if (adLose) {
        const n0 = performance.now() + 80;
        const countPct = (now) => { const k = clamp((now - n0) / 1100, 0, 1); endNearLabel.textContent = `${Math.round(pct * ease.outCubic(k))}%`; if (k < 1 && T.state === 'end') requestAnimationFrame(countPct); };
        requestAnimationFrame(countPct);
      }
    }
    endBest.textContent = `${t('ui.best')}: ${Math.floor(T.best)}`;
    endBest.classList.toggle('pk-hidden', adOn);
    // buttons: NEXT LEVEL first on a win with a next level, otherwise the CTA leads
    const showCta = adOn || meta.mode === 'AD' || !!storeUrl() || isFinal;
    const showNext = win && !!result.next && !gate;
    const showRetry = isFinal || (!gate && !(adOn && ad.retries >= values.maxRetries));
    ctaBtn.classList.toggle('pk-hidden', !showCta);
    ctaBtn.textContent = values.ctaText || (isFinal ? t('cta.full') : t('cta.play'));
    nextBtn.classList.toggle('pk-hidden', !showNext);
    retryBtn.classList.toggle('pk-hidden', !showRetry);
    retryBtn.textContent = isFinal ? t('ui.again') : adOn ? t('ad.retry') : t('ui.retry');
    retryBtn.dataset.fromStart = isFinal ? '1' : '';
    retryBtn.classList.toggle('pk-ghost', showNext || showCta);
    nextBtn.style.order = showNext ? '1' : '3'; ctaBtn.style.order = '2'; retryBtn.style.order = '4';
    for (const e2 of [endStars, endTitle, endSub, endScore, endNear, endBest]) e2.style.order = '0';
    if (adLose) { endSub.style.order = '1'; } // AD loss: title, bar, subtitle, CTA
    end.classList.toggle('pk-adlose', adLose);
    end.classList.toggle('pk-ctamain', showCta && !showNext);
    end.classList.remove('pk-hidden'); hideHint(); hideHand(); obj.classList.add('pk-hidden');
    audio.sfx(win ? (gate ? 'unlock' : 'win') : 'lose');
    if (win) { fxApi.confetti(); setTimeout(() => audio.sfx('cheer'), 250); } else fxApi.shake(6, 300);
    const reason = result.reason || (win ? 'win' : 'lose');
    emit('end', { win, score, stars, reason, level: T.level, final: isFinal, ad: adOn ? { gate, near: prog, retriesLeft: Math.max(0, values.maxRetries - ad.retries) } : undefined });
    if (gate) emit('ad-gate', { level: T.level });
    post({ type: 'playable:gameEnd', win, score });
    post({ type: 'playable:state', state: 'end' });
    try { if (typeof window.gameEnd === 'function') window.gameEnd(); } catch { /* ignore */ }
    try { if (host && typeof host.gameEnd === 'function') host.gameEnd({ win, score }); } catch { /* ignore */ }
    safeCall(() => def.onEnd && def.onEnd(ctx, { win, score, stars, reason, gate }));
    // trailer: config.trailer.autoNext moves on to the next level after a win
    if (trailerMode && showNext && cfg.trailer && cfg.trailer.autoNext) {
      const rid = runId;
      setTimeout(() => { if (T.state === 'end' && runId === rid) goNextLevel(); }, Number(cfg.trailer.autoNextMs) > 0 ? Number(cfg.trailer.autoNextMs) : 2500);
    }
  }
  function restart(direct) {
    resetRun();
    if (direct) { T.state = 'intro'; startPlay(); } else showIntro();
    emit('restart', {});
  }

  // loop
  const STEP = 1 / 60; let acc = 0; let last = 0; let fpsCount = 0; let fpsT = 0;
  /*
   * Smooth play first. When the game draws under 45 fps for 2 s in a row (after its first 3 s on screen), it is drawn
   * at a lower pixel ratio (0.75x per step, never under 1). If the next 2 s are not clearly faster, the frame rate was
   * not limited by drawing (a 30 fps browser cap, a busy CPU): the sharp pixel ratio comes back and the check stops.
   * Test and trailer runs and ?hq keep the full pixel ratio.
   */
  const adaptive = !autoplay && !q.has('hq');
  let shownT = 0; let slowWindows = 0; let slowSum = 0; let trial = null; let adaptLocked = false;
  function adaptResolution(fps) {
    if (!adaptive || adaptLocked || shownT < 3 || !fps) return;
    if (trial) {
      trial.sum += fps; trial.n += 1;
      if (trial.n < 4) return;
      if (trial.sum / trial.n < trial.before * 1.15) { dprCap = trial.prev; adaptLocked = true; layout(); }
      trial = null; return;
    }
    if (view.dpr <= 1) return;
    if (fps >= 45) { slowWindows = 0; slowSum = 0; return; }
    slowWindows += 1; slowSum += fps;
    if (slowWindows < 4) return;
    trial = { prev: dprCap, before: slowSum / slowWindows, sum: 0, n: 0 };
    slowWindows = 0; slowSum = 0;
    dprCap = Math.max(1, Math.round(view.dpr * 0.75 * 100) / 100);
    layout();
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const dtReal = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    if (paused || hidden) return;
    fpsCount += 1; fpsT += dtReal; shownT += dtReal;
    if (fpsT >= 0.5) {
      T.fps = Math.round(fpsCount / fpsT); fpsCount = 0; fpsT = 0;
      adaptResolution(T.fps); T.dpr = view.dpr;
      if (debug) dbg.textContent = `${T.fps} fps · ${view.dpr}x · ${T.state} · L${T.level}`;
    }
    acc += dtReal * simSpeed; let steps = 0; const maxSteps = Math.ceil(5 * simSpeed);
    while (acc >= STEP && steps < maxSteps) {
      // during fx.freeze the game is not updated: the bot waits and one-shot input (taps, swipes, drag deltas) is kept for later
      const frozen = T.state === 'play' && fx.freezeT > 0;
      computeAxes(); if (!frozen) applyBot();
      if (T.state === 'play') {
        if (!clockPaused) T.time += STEP;
        input.idle += STEP;
        if (frozen) fx.freezeT -= STEP;
        else safeCall(() => def.update && def.update(ctx, STEP * fx.timeScale));
        if (ad.pending && T.state === 'play') { ad.pending.t -= STEP; if (ad.pending.t <= 0) { const r = ad.pending.result; ad.pending = null; finish(r); } }
        if (T.state === 'play' && !hintShown && input.idle > values.hintDelay && !autoplay) showHint();
        if (T.state === 'play' && !ad.pending && !clockPaused && T.time >= values.maxPlayTime) {
          if (def.onTimeUp) safeCall(() => def.onTimeUp(ctx)); else finish({ reason: 'time', win: false });
        }
      } else if (def.idle) safeCall(() => def.idle(ctx, STEP));
      updateFx(STEP);
      if (!frozen) clearFrameInput();
      acc -= STEP; steps += 1;
    }
    if (steps >= maxSteps) acc = 0;
    drawFrame(acc / STEP);
    T.frames += 1;
  }

  function drawFrame(alpha) {
    if (g2d) {
      g2d.setTransform(1, 0, 0, 1, 0, 0);
      g2d.clearRect(0, 0, canvas.width, canvas.height);
      const s = view.scale * view.dpr;
      g2d.setTransform(s, 0, 0, s, view.ox * view.dpr, view.oy * view.dpr);
    }
    if (overlayG) {
      overlayG.setTransform(1, 0, 0, 1, 0, 0); overlayG.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      const s2 = view.scale * view.dpr; overlayG.setTransform(s2, 0, 0, s2, view.ox * view.dpr, view.oy * view.dpr);
    }
    safeCall(() => def.render && def.render(ctx, alpha));
    renderFx();
  }

  // A still of the running game for the host's poster: the game canvas, the overlay and the effects (not the DOM
  // HUD), drawn and read in the same task so WebGL games need no preserveDrawingBuffer. JPEG data URL or null.
  function snapshot(maxSize) {
    try {
      if (!T.ready) return null;
      drawFrame(0);
      const W = canvas.width; const H = canvas.height; if (!W || !H) return null;
      const k = Math.min(1, clamp(Number(maxSize) || 960, 240, 1600) / Math.max(W, H));
      const out = document.createElement('canvas'); out.width = Math.max(1, Math.round(W * k)); out.height = Math.max(1, Math.round(H * k));
      const g = out.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, out.width, out.height);
      for (const c of [canvas, overlayCanvas, fxCanvas]) if (c && c.width && c.height) g.drawImage(c, 0, 0, out.width, out.height);
      let q = 0.86; let url = out.toDataURL('image/jpeg', q);
      while (url.length > 480000 && q > 0.4) { q -= 0.12; url = out.toDataURL('image/jpeg', q); }
      return url.length <= 480000 ? url : null;
    } catch { return null; }
  }

  document.addEventListener('visibilitychange', () => { hidden = document.hidden; if (hidden) audio.suspend(); else { audio.resume(); last = 0; } });
  window.addEventListener('resize', layout);

  // test API (always present; harmless in production)
  T.restart = () => restart(true);
  T.setParams = (p) => setParams(p, 'test');
  T.command = command;
  T.snapshot = (maxSize) => snapshot(maxSize);
  T.forceEnd = (win = false) => finish({ win, reason: 'forced', stars: win ? 3 : 0 });
  T.start = () => startPlay();
  T.fx = fx;
  T.ad = adApi;
  T.audio = audio;
  T.nextLevel = () => goNextLevel();
  window.__playable = T;

  async function preload() {
    const imgs = (window.__ASSETS__ && window.__ASSETS__.img) || {};
    await Promise.all(Object.entries(imgs).map(([key, src]) => new Promise((res) => {
      const im = new Image(); im.onload = () => { images.set(key, im); res(); }; im.onerror = () => { T.errors.push(`image failed: ${key}`); res(); };
      im.src = src.startsWith('data:') ? src : `data:image/png;base64,${src}`;
    })));
  }

  async function boot() {
    layout(); applyStyleParams(); refreshTexts();
    await Promise.all([preload(), fontsReady]);
    if (def.init) await Promise.resolve(safeCall(() => def.init(ctx)));
    resetRun(); showIntro();
    const bootEl = document.getElementById('pk-boot');
    if (bootEl) { bootEl.style.opacity = '0'; setTimeout(() => bootEl.remove(), 380); }
    T.ready = true; emit('ready', {});
    const msg = { type: 'playable:ready', commands: true, version: 2, snapshot: true, meta: { title: meta.title, slug: meta.slug, genre: meta.genre, dimension: meta.dimension } };
    post(msg);
    post({ type: 'playable:schema', params: schema, values: { ...values } });
    if (host && typeof host.ready === 'function') { try { host.ready(); } catch { /* ignore */ } }
    requestAnimationFrame(frame);
  }

  const mraid = window.mraid;
  if (mraid && typeof mraid.getState === 'function' && mraid.getState() === 'loading') {
    mraid.addEventListener('ready', () => {
      if (typeof mraid.isViewable === 'function' && !mraid.isViewable()) {
        const onView = (v) => { if (v) { mraid.removeEventListener('viewableChange', onView); boot(); } };
        mraid.addEventListener('viewableChange', onView);
      } else boot();
    });
  } else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  return ctx;
}

export default createGame;
