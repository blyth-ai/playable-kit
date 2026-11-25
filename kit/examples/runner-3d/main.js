// Lane Dash — the skill's reference 3D runner (Blyth Play Kernel + three.js primitives, no assets).
// A toy kid races a cocky rival down a festive toy-town street: switch between 3 lanes (mouse, swipe or arrows),
// hop the striped hurdles, grab sparkling coin lines for speed and beat the rival to the finish arch.
//
// What this file shows (search the section headers):
//   GEOMETRY KIT    primitives baked into ONE vertex-coloured geometry per prop (1 draw call), repainted by role
//   CHARACTERS      toy proportions (head : body ≈ 1 : 1.2), eyes = white + pupil + highlight, limbs in pivot
//                   groups, a black inverted-hull outline on the hero, soft blob shadows
//   WORLD           vertex-coloured sky dome, fog = horizon colour, hemisphere + warm key light, instanced props
//                   that are recycled ahead of the runner (matrices are only rewritten on recycle)
//   CONTROLS        hoverSteer: the mouse's x picks the lane (no click); touch drag/swipe; arrows/WASD + Space
//   CAMERA          intro orbit on the faces → swing round behind the hero, FOV kicks, finish punch-in
//   AD FUNNEL       L1 / L2 (oncoming cars) / L3 "HARD LEVEL!" + a scripted boulder near-miss in AD mode (ctx.ad)
import { createGame } from 'blyth-play-kernel';
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Fog, HemisphereLight, DirectionalLight, Vector3, Matrix4, Quaternion, Euler,
  Mesh, Group, InstancedMesh, BufferGeometry, BufferAttribute, DataTexture, RedFormat, NearestFilter,
  BoxGeometry, PlaneGeometry, CylinderGeometry, SphereGeometry, CapsuleGeometry, ConeGeometry, TorusGeometry, IcosahedronGeometry,
  MeshToonMaterial, MeshBasicMaterial, CanvasTexture, RepeatWrapping, SRGBColorSpace, NoToneMapping, BackSide, DoubleSide,
  AdditiveBlending, DynamicDrawUsage,
} from 'three';

/* ================================================================ constants */
const LANE_W = 2.2;
const ROAD_W = LANE_W * 3 + 0.8;            // 7.4 m of road
const CURB_W = 0.45;
const WALK_W = 2.3;                          // sidewalk strip on each side (the crowd stands here)
const WALK_X = ROAD_W / 2 + CURB_W + WALK_W / 2;
const FENCE_X = ROAD_W / 2 + CURB_W + WALK_W + 0.1;
const SPAWN_Z = -80;                         // obstacles appear here, inside the fog
const SPAN = 150;                            // scenery is laid out over this many metres and recycled (≈ fog end + margin)
const BOULDER_R = 3;                         // ad near-miss boulder radius: wide enough to cover all 3 lanes
const AD_CATCH = 0.96;                       // ...and it reaches the runner at this share of the distance
const CAR_V = 4.5;                           // oncoming toy cars (level 2+) drive toward you at this speed
const HALF = { crate: 0.7, car: 1.25, bar: 0.4 }; // collision half-length along the road
const DRAG_STEP = 30;                        // design px of sideways drag for a lane change (touch)…
const DRAG_MORE = 85;                        // …and for a second one in the same direction (a long swipe = 1 lane)
const laneX = (lane) => (lane - 1) * LANE_W;
const R0 = [0, 0, 0];

// Three-plus themes: one enum switches sky, ground, road, props and light at once (art-direction.md).
const WORLDS = {
  'Sunny Park': {
    skyTop: '#3d9cff', skyHor: '#d4f1ff', glow: '#fff8dc', grass: '#8ad65c', grass2: '#7cc94f', road: '#3a8bd8', line: '#ffffff',
    curbA: '#ff4d5e', curbB: '#ffffff', walk: '#ffe4c4', walkLine: '#efc9a0', leaf: '#55c766', leaf2: '#34a653', trunk: '#8a5a32',
    roof: '#ff6b5a', wall: '#fff7ea', window: '#bfe9ff', hill: '#a6dc76', hill2: '#88ca60', fence: '#ffffff', bush: '#45b85a',
    hemiSky: '#eaf6ff', hemiGround: '#8aa867', sun: '#fff0d4', sunI: 2.2, hemiI: 1.1, cloud: '#ffffff',
    flags: ['#ff4d5e', '#ffd23f', '#3dd6ff', '#9b6bff', '#5ee35e'], tints: ['#ffe9e6', '#e3f2ff', '#fff6d6', '#e6ffe8', '#f3eaff'],
  },
  'Desert Sunset': {
    skyTop: '#ff8a5c', skyHor: '#ffe2ab', glow: '#fff3c8', grass: '#f2c77e', grass2: '#e9ba6e', road: '#8b63c9', line: '#fff3d6',
    curbA: '#ff7a3d', curbB: '#fff3e0', walk: '#fbe0b6', walkLine: '#e8c48e', leaf: '#62b552', leaf2: '#4a9a44', trunk: '#7a4a2a',
    roof: '#d9653b', wall: '#ffe9c8', window: '#9fe0ff', hill: '#eeaa6c', hill2: '#dd9558', fence: '#fff3e0', bush: '#86b54f',
    hemiSky: '#fff0dc', hemiGround: '#c49264', sun: '#ffdcae', sunI: 2.2, hemiI: 1.1, cloud: '#fff1e0',
    flags: ['#ff5f3d', '#ffd23f', '#3dd6ff', '#b46bff', '#ff8ac2'], tints: ['#ffffff', '#ffe6d6', '#fff4d0', '#f0e6ff', '#e6f6ff'],
  },
  'Snowy Village': {
    skyTop: '#6fb2ff', skyHor: '#eef7ff', glow: '#ffffff', grass: '#f5f9ff', grass2: '#e9f0fa', road: '#5b7fd1', line: '#ffffff',
    curbA: '#ff4d6d', curbB: '#ffffff', walk: '#dfe8f5', walkLine: '#c7d4e8', leaf: '#2f8a62', leaf2: '#24724f', trunk: '#6b4428',
    roof: '#e14b62', wall: '#ffeccf', window: '#ffe9a8', hill: '#ffffff', hill2: '#e2ebf7', fence: '#c98a4b', bush: '#3a8f68',
    hemiSky: '#f2f8ff', hemiGround: '#aebfd9', sun: '#fff6ea', sunI: 2.0, hemiI: 1.15, cloud: '#ffffff',
    flags: ['#ff4d6d', '#ffd23f', '#3dd6ff', '#5ee35e', '#ffffff'], tints: ['#ffffff', '#ffe6e6', '#e6f0ff', '#fff4dc', '#eaffea'],
  },
  'Neon Night': {
    skyTop: '#0d0830', skyHor: '#4b2b8f', glow: '#ff6ad5', grass: '#2b2066', grass2: '#251b5b', road: '#1d1640', line: '#3dfcff',
    curbA: '#ff3df0', curbB: '#3dfcff', walk: '#3c2e7c', walkLine: '#4b3c95', leaf: '#2de0ff', leaf2: '#1fb0e0', trunk: '#5a3f8f',
    roof: '#ff3df0', wall: '#5444a8', window: '#ffe066', hill: '#3a2a85', hill2: '#2f2272', fence: '#3dfcff', bush: '#8a5cff',
    hemiSky: '#9c8cff', hemiGround: '#2a1f63', sun: '#d6c8ff', sunI: 1.7, hemiI: 1.25, cloud: '#6a5cb5',
    flags: ['#ff3df0', '#3dfcff', '#ffe066', '#7dff6a', '#ff7a3d'], tints: ['#ffffff', '#ffd6fb', '#d6faff', '#fff3c4', '#e0d6ff'],
  },
};
const CAR_COLORS = ['#ff4d5e', '#ffd23f', '#3dd6ff', '#5ee35e', '#ff8a3d', '#b46bff'];
const SUN_DIR = new Vector3(0.45, 0.3, -1).normalize(); // sun glow in the sky dome (ahead, to the right)

// deterministic visual-only PRNG (scenery layout) — gameplay randomness uses ctx.rng
let VS = 0x2545f491;
const vr = () => { VS ^= VS << 13; VS ^= VS >>> 17; VS ^= VS << 5; return (VS >>> 0) / 4294967296; };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, k) => a + (b - a) * k;
const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));

/* ============================================================= GEOMETRY KIT */
// part(): one primitive, moved into place, tagged with a colour role ('shirt', 'leaf'…) or a fixed '#hex'.
// build(): bakes a list of parts into ONE BufferGeometry with vertex colours → one draw call per prop.
// paint(): recolours a baked geometry by role (themes and colour params never rebuild anything).
const _m = new Matrix4(); const _q = new Quaternion(); const _e = new Euler(); const _p = new Vector3(); const _s = new Vector3();
const _c = new Color(); const v3 = new Vector3(); const v3b = new Vector3();
const ZERO = new Matrix4().makeScale(0, 0, 0);
const SPH = (r, w = 14, h = 10) => new SphereGeometry(r, w, h);
const CAPS = (r, len, seg = 10) => new CapsuleGeometry(r, len, 3, seg);
const BOX = (x, y, z) => new BoxGeometry(x, y, z);
const CYL = (r1, r2, h, seg = 12) => new CylinderGeometry(r1, r2, h, seg);
// sound pacing: the same cue at most every `gap` s on the audio clock, so fast repeats stay soft and never drill
const SND_T = {};
function sndGap(ctx, key, gap) {
  const ac = ctx.audio.context; const now = ac ? ac.currentTime : performance.now() / 1000;
  if (now - (SND_T[key] ?? -9) < gap) return false; SND_T[key] = now; return true;
}
const sndJit = (p, a = 0.03) => p * (1 - a + Math.random() * 2 * a); // tiny pitch variation for repeated cues

function part(geo, role, at = R0, rot = R0, scale = 1, outline = true) {
  const g = geo.index ? geo.toNonIndexed() : geo; if (g !== geo) geo.dispose();
  const sc = typeof scale === 'number' ? [scale, scale, scale] : scale;
  g.applyMatrix4(_m.compose(_p.set(at[0], at[1], at[2]), _q.setFromEuler(_e.set(rot[0], rot[1], rot[2])), _s.set(sc[0], sc[1], sc[2])));
  g.userData = { role, outline };
  return g;
}
// merge parts; `grow` pushes every vertex out along its normal (the inverted-hull outline shell)
function merge(parts, grow = 0) {
  let n = 0; for (const g of parts) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3); const nor = new Float32Array(n * 3); const hasUv = parts.every((g) => g.attributes.uv);
  const uv = hasUv ? new Float32Array(n * 2) : null; const roles = []; let o = 0;
  for (const g of parts) {
    const P = g.attributes.position.array; const N = g.attributes.normal.array; const c = P.length / 3;
    for (let i = 0; i < c * 3; i += 1) { pos[o * 3 + i] = P[i] + N[i] * grow; nor[o * 3 + i] = N[i]; }
    if (uv) uv.set(g.attributes.uv.array, o * 2);
    roles.push({ role: g.userData.role, start: o, count: c }); o += c;
  }
  const out = new BufferGeometry();
  out.setAttribute('position', new BufferAttribute(pos, 3)); out.setAttribute('normal', new BufferAttribute(nor, 3));
  out.setAttribute('color', new BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  if (uv) out.setAttribute('uv', new BufferAttribute(uv, 2));
  out.userData.roles = roles; out.computeBoundingSphere(); paint(out, {});
  return out;
}
function build(parts) { const g = merge(parts); for (const p of parts) p.dispose(); return g; }
function paint(geo, colors) {
  const a = geo.attributes.color.array; const n = geo.attributes.normal.array; const bake = geo.userData.bake;
  for (const r of geo.userData.roles) {
    const hex = r.role[0] === '#' ? r.role : colors[r.role]; if (!hex) continue;
    _c.set(hex);
    for (let i = r.start; i < r.start + r.count; i += 1) {
      // baked props (unlit material): a soft light from above, a touch brighter on the faces turned to the road
      const k = bake ? 0.64 + 0.36 * clamp(n[i * 3 + 1], -0.4, 1) + 0.06 * n[i * 3 + 2] : 1;
      a[i * 3] = _c.r * k; a[i * 3 + 1] = _c.g * k; a[i * 3 + 2] = _c.b * k;
    }
  }
  geo.attributes.color.needsUpdate = true;
}
const baked = (geo) => { geo.userData.bake = true; paint(geo, {}); return geo; }
function setInst(im, i, x, y, z, ry = 0, sx = 1, sy = sx, sz = sx, rx = 0, rz = 0) {
  im.setMatrixAt(i, _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz)));
}

/* =============================================================== CHARACTERS */
// A toy runner in 6 meshes (torso, head, 2 arms, 2 legs) hung in pivot groups, so the run cycle is a handful of
// rotations. look = 'hero' (cap + backpack, black inverted-hull outline) or 'rival' (spiky hair, headband, smug brows).
function makeRunner(mats, look) {
  const hero = look === 'hero';
  const torso = [
    part(SPH(0.26), 'pants', [0, 0.06, 0], R0, [1.05, 0.62, 0.92]),                          // shorts
    part(CAPS(0.26, 0.16, 14), 'shirt', [0, 0.3, 0]),
    part(new TorusGeometry(0.14, 0.05, 6, 14), 'trim', [0, 0.56, 0], [Math.PI / 2, 0, 0]),    // collar
  ];
  if (hero) torso.push(part(CAPS(0.17, 0.14), 'pack', [0, 0.34, 0.26], R0, [1.15, 1, 0.75]), part(SPH(0.11, 10, 8), 'trim', [0, 0.24, 0.38], R0, [1.4, 0.8, 0.55]));
  else torso.push(part(BOX(0.34, 0.26, 0.04), '#ffffff', [0, 0.34, 0.265], R0, 1, false), part(BOX(0.2, 0.07, 0.05), 'shirt', [0, 0.34, 0.27], R0, 1, false)); // race bib

  const head = [part(SPH(0.45, 18, 12), 'skin', [0, 0.4, 0])];
  for (const sx of [-1, 1]) {
    head.push(
      part(SPH(0.09, 8, 6), 'skin', [sx * 0.44, 0.38, 0.03], R0, [0.55, 1, 1]),                    // ear
      part(SPH(0.115, 12, 10), '#ffffff', [sx * 0.16, 0.44, -0.37], R0, [0.92, 1.12, 0.55], false), // eye white
      part(SPH(0.07, 10, 8), '#1c1a2e', [sx * 0.16, 0.43, -0.425], R0, [1, 1.12, 0.6], false),       // pupil
      part(SPH(0.028, 6, 4), '#ffffff', [sx * 0.16 - 0.03, 0.475, -0.462], R0, 1, false),           // highlight
      part(SPH(0.07, 8, 6), '#ff8fa3', [sx * 0.27, 0.3, -0.35], R0, [1, 0.6, 0.35], false),          // blush
    );
  }
  head.push(
    part(new TorusGeometry(0.075, 0.024, 4, 10, Math.PI), '#7a2639', [0, 0.27, -0.42], [0, 0, Math.PI], 1, false), // smile
    part(SPH(0.045, 8, 6), 'skin', [0, 0.35, -0.452], R0, 1, false),                                               // nose
    part(new SphereGeometry(0.465, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), 'hair', [0, 0.4, 0.02], [0.5, 0, 0]),
  );
  if (hero) {
    head.push(
      part(new SphereGeometry(0.485, 20, 8, 0, Math.PI * 2, 0, Math.PI * 0.36), 'cap', [0, 0.43, 0.03], [0.22, 0, 0]),
      part(new CylinderGeometry(0.28, 0.28, 0.04, 16, 1, false, Math.PI / 2, Math.PI), 'cap', [0, 0.68, -0.3], [-0.12, 0, 0], [1, 1, 1.05]),
      part(SPH(0.06, 8, 6), 'trim', [0, 0.92, 0.05]),
    );
  } else {
    for (let k = 0; k < 5; k += 1) { const a = -0.9 + k * 0.45; head.push(part(new ConeGeometry(0.13, 0.36, 6), 'hair', [Math.sin(a) * 0.3, 0.78, 0.12 + Math.cos(a) * 0.05], [-0.55, 0, -a * 0.8])); }
    head.push(part(new TorusGeometry(0.452, 0.05, 6, 26), 'band', [0, 0.62, 0.02], [Math.PI / 2 - 0.3, 0, 0]));
    for (const sx of [-1, 1]) head.push(part(CAPS(0.025, 0.1, 4), 'hair', [sx * 0.16, 0.6, -0.385], [0, 0, Math.PI / 2 + sx * 0.4], 1, false)); // cocky brows
  }
  const arm = [
    part(SPH(0.105, 10, 8), 'shirt', [0, -0.03, 0], R0, [1, 1.3, 1]),                         // sleeve
    part(CAPS(0.075, 0.18, 8), 'skin', [0, -0.2, 0]),
    part(SPH(0.095, 10, 8), 'skin', [0, -0.37, 0]),                                            // hand
  ];
  const leg = [
    part(CAPS(0.11, 0.2, 10), 'pants', [0, -0.2, 0]),
    part(CAPS(0.105, 0.14, 10), 'shoe', [0, -0.43, -0.06], [Math.PI / 2, 0, 0], [1, 1, 0.72]),
    part(BOX(0.17, 0.05, 0.12), 'lace', [0, -0.37, -0.12], R0, 1, false),
  ];
  // one coloured geometry per body part (+ an outline shell for the hero)
  const pair = (parts) => { const g = merge(parts); const l = hero ? merge(parts.filter((q) => q.userData.outline), 0.03) : null; for (const q of parts) q.dispose(); return [g, l]; };
  const T = pair(torso); const H = pair(head); const A = pair(arm); const L = pair(leg);
  const attach = (parent, [g, l]) => { parent.add(new Mesh(g, mats.toon)); if (l) parent.add(new Mesh(l, mats.line)); };
  const root = new Group(); const hips = new Group(); hips.position.y = 0.5; root.add(hips);
  const chest = new Group(); hips.add(chest); attach(chest, T);
  const neck = new Group(); neck.position.y = 0.58; chest.add(neck); attach(neck, H);
  const pivot = (parent, x, y, geo) => { const g = new Group(); g.position.set(x, y, 0); parent.add(g); attach(g, geo); return g; };
  const armL = pivot(chest, -0.31, 0.5, A); const armR = pivot(chest, 0.31, 0.5, A);
  const legL = pivot(hips, -0.13, 0, L); const legR = pivot(hips, 0.13, 0, L);
  return { root, hips, chest, neck, armL, armR, legL, legR, geos: [T[0], H[0], A[0], L[0]] };
}

// Poses a runner from a few numbers. mode: 'run' | 'ready' (intro bounce + wave) | 'smug' (arms crossed) | 'cheer' | 'dizzy' | 'flat'.
// air 0..1 blends into the jump tuck; lean tilts into lane changes; t = seconds for idle animations.
function poseRunner(rn, mode, ph, air, lean, t) {
  const s = Math.sin(ph); const k = 1 - air;
  rn.root.rotation.set(0, 0, lean); rn.root.scale.set(1, 1, 1);
  rn.chest.rotation.set(-0.14 * k, s * 0.16 * k, 0); rn.neck.rotation.set(0.06, -s * 0.12 * k, 0);
  rn.hips.position.y = 0.5 + Math.abs(s) * 0.09 * k;
  rn.legL.rotation.set(lerp(s * 0.95, 0.95, air), 0, 0); rn.legR.rotation.set(lerp(-s * 0.95, -0.35, air), 0, 0);
  rn.armL.rotation.set(lerp(-s * 0.95, 2.5, air), 0, lerp(-0.15, -0.45, air)); rn.armR.rotation.set(lerp(s * 0.95, 2.5, air), 0, lerp(0.15, 0.45, air));
  if (mode === 'ready') { // on the start line: bounce on the toes and wave at the camera
    const b = Math.abs(Math.sin(t * 5)); rn.hips.position.y = 0.5 + b * 0.05; rn.chest.rotation.set(0, Math.sin(t * 1.3) * 0.15, 0);
    rn.neck.rotation.set(0.02, 0, Math.sin(t * 2) * 0.1);
    rn.legL.rotation.set(0.1 * b, 0, 0); rn.legR.rotation.set(-0.1 * b, 0, 0);
    rn.armL.rotation.set(0.2, 0, -0.25 - b * 0.1); rn.armR.rotation.set(0.25, 0, 2.5 + Math.sin(t * 9) * 0.35);
  } else if (mode === 'smug') { // the rival on the start line: arms crossed, chin up, tapping a foot
    rn.hips.position.y = 0.5; rn.chest.rotation.set(0.04, -0.15, 0); rn.neck.rotation.set(-0.16, 0.25, Math.sin(t * 1.7) * 0.08);
    rn.legL.rotation.set(0, 0, 0); rn.legR.rotation.set(-Math.max(0, Math.sin(t * 7)) * 0.25, 0, 0);
    rn.armL.rotation.set(1.3, 0, 0.9); rn.armR.rotation.set(1.22, 0, -0.95);
  } else if (mode === 'cheer') { // finish: hop with both arms up
    const b = Math.abs(Math.sin(t * 6.5)); rn.hips.position.y = 0.5;
    rn.chest.rotation.set(0.1, 0, 0); rn.neck.rotation.set(-0.15, 0, Math.sin(t * 6.5) * 0.12);
    rn.legL.rotation.set(0.5 * b, 0, 0); rn.legR.rotation.set(-0.2 * b, 0, 0);
    rn.armL.rotation.set(2.9, 0, -0.55 - b * 0.2); rn.armR.rotation.set(2.9, 0, 0.55 + b * 0.2);
  } else if (mode === 'dizzy') { // after a hit: wobble with flailing arms
    rn.chest.rotation.set(0.1, 0, Math.sin(t * 15) * 0.22); rn.neck.rotation.set(0, 0, Math.sin(t * 11) * 0.3);
    rn.armL.rotation.set(1.2 + Math.sin(t * 17) * 0.6, 0, -0.9); rn.armR.rotation.set(1.2 - Math.sin(t * 17) * 0.6, 0, 0.9);
  } else if (mode === 'flat') rn.root.scale.set(1.5, 0.18, 1.5); // squashed by the boulder
}

/* ========================================================== props (baked) */
function roundTreeGeo() {
  return build([
    part(CYL(0.15, 0.22, 1.3, 7), 'trunk', [0, 0.65, 0]),
    part(new IcosahedronGeometry(1, 1), 'leaf', [0, 2.05, 0], R0, [1.05, 0.95, 1.05]),
    part(new IcosahedronGeometry(1, 0), 'leaf2', [0.55, 1.65, 0.25], R0, 0.62),
    part(new IcosahedronGeometry(1, 0), 'leaf', [-0.5, 1.7, -0.25], R0, 0.66),
  ]);
}
function pineGeo() {
  return build([
    part(CYL(0.14, 0.2, 1.0, 6), 'trunk', [0, 0.5, 0]),
    part(new ConeGeometry(1.15, 1.7, 7), 'leaf2', [0, 1.6, 0]),
    part(new ConeGeometry(0.85, 1.4, 7), 'leaf', [0, 2.45, 0]),
  ]);
}
function houseGeo() { // front (door + windows) faces −z; instances are turned to face the road
  const P = [
    part(BOX(2.8, 2.1, 2.6), 'wall', [0, 1.05, 0]),
    part(new ConeGeometry(2.4, 1.5, 4), 'roof', [0, 2.85, 0], [0, Math.PI / 4, 0], [1, 1, 0.95]),
    part(BOX(0.36, 0.8, 0.36), 'roof', [0.75, 3.1, 0.3]),
    part(BOX(0.66, 1.1, 0.06), '#8a5a32', [0, 0.55, -1.31]),
    part(SPH(0.05, 6, 4), '#ffd23f', [0.2, 0.55, -1.35]),
  ];
  for (const sx of [-1, 1]) P.push(part(BOX(0.66, 0.66, 0.05), '#ffffff', [sx * 0.85, 1.35, -1.31]), part(BOX(0.52, 0.52, 0.06), 'window', [sx * 0.85, 1.35, -1.32]));
  return build(P);
}
function bushGeo() {
  return build([
    part(new IcosahedronGeometry(0.62, 0), 'bush', [0, 0.45, 0], R0, [1.2, 0.85, 1]),
    part(new IcosahedronGeometry(0.45, 0), 'bush', [0.6, 0.35, 0.1], R0, [1, 0.85, 1]),
    part(new IcosahedronGeometry(0.12, 0), '#ff6b8a', [0.2, 0.86, -0.3]), part(new IcosahedronGeometry(0.12, 0), '#ffd23f', [-0.35, 0.78, -0.35]),
    part(new IcosahedronGeometry(0.12, 0), '#ffffff', [0.7, 0.66, -0.25]),
  ]);
}
function buntingGeo() { // two lamp posts + a string of pennants high across the road (above the camera)
  const X = ROAD_W / 2 + CURB_W + 0.35; const Y = 6.6; const P = [];
  for (const sx of [-1, 1]) P.push(part(CYL(0.08, 0.1, Y + 0.3, 8), '#5a6075', [sx * X, (Y + 0.3) / 2, 0]), part(SPH(0.22, 10, 8), '#fff4c2', [sx * X, Y + 0.4, 0]));
  const n = 13;
  for (let k = 0; k < n; k += 1) {
    const u = k / (n - 1); const x = -X + 0.5 + u * (2 * X - 1); const sag = 0.75 * (1 - (2 * u - 1) ** 2);
    P.push(part(new ConeGeometry(0.24, 0.5, 3), `f${k % 5}`, [x, Y - sag - 0.27, 0], [Math.PI, 0, 0], [1, 1, 0.35]));
    if (k < n - 1) { const u2 = (k + 1) / (n - 1); const x2 = -X + 0.5 + u2 * (2 * X - 1); const y2 = Y - 0.75 * (1 - (2 * u2 - 1) ** 2);
      P.push(part(CYL(0.025, 0.025, 1, 4), '#ffffff', [(x + x2) / 2, (Y - sag + y2) / 2, 0], [0, 0, Math.PI / 2 + Math.atan2(y2 - (Y - sag), x2 - x)], [1, Math.hypot(x2 - x, y2 - Y + sag), 1])); }
  }
  return build(P);
}
// spectators: torso + raised arms (tinted per instance) and an untinted head/legs mesh with a face
function fanBodyGeo() {
  return build([
    part(new CapsuleGeometry(0.24, 0.3, 2, 6), '#ffffff', [0, 0.7, 0]),
    part(CYL(0.07, 0.07, 0.42, 4), '#ffffff', [-0.37, 1.18, 0], [0, 0, 0.45]), part(CYL(0.07, 0.07, 0.42, 4), '#ffffff', [0.37, 1.18, 0], [0, 0, -0.45]),
  ]);
}
function fanHeadGeo() {
  const P = [part(SPH(0.28, 9, 6), '#ffd2b0', [0, 1.33, 0]), part(new SphereGeometry(0.295, 9, 3, 0, Math.PI * 2, 0, Math.PI * 0.45), '#4a2c1a', [0, 1.35, 0.03], [0.4, 0, 0])];
  for (const sx of [-1, 1]) P.push(part(new IcosahedronGeometry(0.06, 0), '#1c1a2e', [sx * 0.1, 1.36, -0.255], R0, [1, 1.2, 0.6]),
    part(CYL(0.09, 0.08, 0.5, 4), '#3a3f5c', [sx * 0.11, 0.25, 0]), part(new IcosahedronGeometry(0.085, 0), '#ffd2b0', [sx * 0.47, 1.39, 0]));
  return build(P);
}
function cloudGeo() {
  return build([part(SPH(1, 10, 7), '#ffffff', [0, 0.4, 0], R0, [1.4, 1, 1.1]), part(SPH(1, 8, 6), '#ffffff', [1.3, 0.1, 0], R0, 0.85),
    part(SPH(1, 8, 6), '#ffffff', [-1.3, 0.05, 0.1], R0, 0.8), part(SPH(1, 8, 5), '#e3ecfb', [0, -0.25, 0], R0, [2.3, 0.55, 1.1])]);
}
function hillsGeo() { // a far ring of soft hills; the fog hazes them into the horizon
  const P = [];
  for (let i = 0; i < 30; i += 1) {
    const a = i * 0.2094 + (vr() - 0.5) * 0.06; const R = 92 + vr() * 26;
    P.push(part(new SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), i % 2 ? 'hill' : 'hill2', [Math.sin(a) * R, -3, -Math.cos(a) * R - 12], R0, [13 + vr() * 12, 9 + vr() * 10, 11]));
  }
  return build(P);
}
// obstacles + pickups
function crateGeo() {
  const P = [part(BOX(1.5, 1.5, 1.3), 'wood', [0, 0.75, 0])];
  for (const sx of [-1, 1]) P.push(part(BOX(0.17, 1.54, 1.34), 'wood2', [sx * 0.7, 0.77, 0]));   // side frames
  for (const y of [0.09, 1.45]) P.push(part(BOX(1.54, 0.17, 1.34), 'wood2', [0, y, 0]));         // top + bottom rims
  P.push(part(BOX(1.72, 0.17, 0.06), 'wood2', [0, 0.77, 0.66], [0, 0, Math.PI / 4]), part(BOX(1.72, 0.06, 0.17), 'wood2', [0, 1.55, 0], [0, Math.PI / 4.6, 0]));
  return build(P);
}
function hurdleGeo() {
  const P = [];
  for (const sx of [-1, 1]) P.push(part(BOX(0.13, 0.62, 0.13), '#ffffff', [sx * 0.86, 0.31, 0]), part(BOX(0.18, 0.09, 0.62), '#4a4f63', [sx * 0.86, 0.045, 0]));
  for (let k = 0; k < 6; k += 1) P.push(part(BOX(0.3, 0.3, 0.17), k % 2 ? '#ffffff' : '#ff3b4e', [-0.75 + k * 0.3, 0.6, 0]));
  return build(P);
}
function carBodyGeo() { // tinted per instance; the front (+z) faces the runner
  return build([
    part(new CapsuleGeometry(0.34, 1.6, 2, 10), '#ffffff', [0, 0.56, 0], [Math.PI / 2, 0, 0], [2.2, 1, 0.85]),
    part(new CapsuleGeometry(0.3, 0.5, 2, 10), '#ffffff', [0, 1.0, -0.12], [Math.PI / 2, 0, 0], [1.7, 1, 0.95]),
  ]);
}
function carPartsGeo() {
  const P = [part(BOX(0.82, 0.32, 0.05), '#cfefff', [0, 1.02, 0.43], [-0.5, 0, 0]), part(BOX(1.32, 0.14, 0.12), '#eef2fa', [0, 0.36, 1.16]),
    part(BOX(0.5, 0.18, 0.05), '#ffffff', [0, 0.56, 1.2])];
  for (const sx of [-1, 1]) {
    P.push(part(SPH(0.13, 10, 8), '#fff4a6', [sx * 0.48, 0.62, 1.12], R0, [1, 1, 0.6]), part(BOX(0.05, 0.28, 0.62), '#cfefff', [sx * 0.51, 1.02, -0.12]));
    for (const sz of [-1, 1]) P.push(part(CYL(0.28, 0.28, 0.22, 10), '#2b2d3a', [sx * 0.68, 0.28, sz * 0.72], [0, 0, Math.PI / 2]), part(CYL(0.13, 0.13, 0.24, 6), '#dfe4ee', [sx * 0.69, 0.28, sz * 0.72], [0, 0, Math.PI / 2]));
  }
  return build(P);
}
function coinGeo() { // faces ±z; spins around y
  return build([part(CYL(0.4, 0.4, 0.1, 16), 'gold', R0, [Math.PI / 2, 0, 0]), part(new TorusGeometry(0.36, 0.05, 4, 16), 'gold2'), part(CYL(0.19, 0.19, 0.14, 10), 'gold2', R0, [Math.PI / 2, 0, 0])]);
}
function magnetGeo() {
  return build([part(new TorusGeometry(0.36, 0.13, 8, 18, Math.PI), '#ff3b4e', [0, 0.1, 0], [0, 0, Math.PI]),
    part(BOX(0.27, 0.22, 0.27), '#e9edf5', [-0.36, 0.2, 0]), part(BOX(0.27, 0.22, 0.27), '#e9edf5', [0.36, 0.2, 0])]);
}
function archGeo() { // inflatable finish arch: striped pillars, a puffy beam and balloon bunches
  const X = ROAD_W / 2 + 0.75; const P = [];
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 5; k += 1) P.push(part(CYL(0.52, 0.52, 1.12, 14), k % 2 ? 'archB' : 'archA', [sx * X, 0.56 + k * 1.12, 0]));
    P.push(part(SPH(0.7, 14, 8), 'archA', [sx * X, 0.12, 0], R0, [1, 0.4, 1]));
    for (let j = 0; j < 3; j += 1) P.push(part(SPH(0.4, 12, 10), `f${(j + (sx > 0 ? 2 : 0)) % 5}`, [sx * (X + (j - 1) * 0.5), 7.0 + (j % 2) * 0.45, 0.15], R0, [1, 1.18, 1]));
  }
  P.push(part(CAPS(0.64, X * 2, 18), 'archA', [0, 5.95, 0], [0, 0, Math.PI / 2]));
  for (let k = 0; k < 5; k += 1) P.push(part(CYL(0.66, 0.66, 0.55, 18), 'archB', [-X + 1.2 + k * ((2 * X - 2.4) / 4), 5.95, 0], [0, 0, Math.PI / 2]));
  return build(P);
}
function boulderFaceGeo() { // angry eyes that stay upright while the rock rolls underneath
  const P = [];
  for (const sx of [-1, 1]) {
    P.push(part(SPH(0.55, 14, 10), '#ffffff', [sx * 0.85, 0.5, 0], R0, [1, 1, 0.45]), part(SPH(0.27, 12, 8), '#1c1a2e', [sx * 0.75, 0.42, -0.22], R0, [1, 1, 0.5]));
    P.push(part(BOX(1.05, 0.26, 0.26), '#3b2a22', [sx * 0.85, 1.12, -0.12], [0, 0, sx * 0.38]));
  }
  P.push(part(new TorusGeometry(0.42, 0.09, 6, 12, Math.PI), '#3b2a22', [0, -0.55, -0.12]));
  return build(P);
}

// The street as ONE vertex-coloured mesh (no textures to sample): lawns with mowed stripes, sidewalks with paving
// joints, red/white curbs, the road with a lighter middle lane and dashed lane lines. Every pattern repeats every
// 8 m, so the mesh only ever slides back and forth by up to 8 m (see recycleScenery): an endless street, 1 draw call.
function streetGeo() {
  const P = []; const Z0 = 20; const N = 34; // 34 × 8 m from z = +20 to −252
  const quad = (x0, x1, za, zb, y, role) => P.push(part(new PlaneGeometry(x1 - x0, za - zb).rotateX(-Math.PI / 2), role, [(x0 + x1) / 2, y, (za + zb) / 2]));
  const side = (x, za, zb, h, face, role) => P.push(part(new PlaneGeometry(za - zb, h), role, [x, h / 2, (za + zb) / 2], [0, face * Math.PI / 2, 0]));
  const R = ROAD_W / 2; const C = R + CURB_W; const zEnd = Z0 - N * 8;
  quad(-R, -LANE_W / 2, Z0, zEnd, 0, 'road'); quad(-LANE_W / 2, LANE_W / 2, Z0, zEnd, 0, 'roadMid'); quad(LANE_W / 2, R, Z0, zEnd, 0, 'road'); // no overdraw
  for (const sx of [-1, 1]) {
    quad(sx > 0 ? R - 0.42 : -R + 0.24, sx > 0 ? R - 0.24 : -R + 0.42, Z0, zEnd, 0.006, 'line');                  // edge line
    quad(sx > 0 ? C : -FENCE_X - 0.02, sx > 0 ? FENCE_X + 0.02 : -C, Z0, zEnd, 0.14, 'walk');                    // sidewalk
    quad(sx > 0 ? FENCE_X - 0.12 : -FENCE_X - 0.02, sx > 0 ? FENCE_X + 0.02 : -FENCE_X + 0.12, Z0, zEnd, 0.145, 'walkLine');
  }
  for (let k = 0; k < N; k += 1) {
    const z = Z0 - k * 8;
    for (const lx of [-LANE_W / 2, LANE_W / 2]) quad(lx - 0.13, lx + 0.13, z - 2, z - 6, 0.008, 'line');            // lane dashes
    for (const sx of [-1, 1]) {
      quad(sx > 0 ? FENCE_X : -120, sx > 0 ? 120 : -FENCE_X, z, z - 4, -0.02, 'grass2');                       // lawn: mowed stripes,
      quad(sx > 0 ? FENCE_X : -120, sx > 0 ? 120 : -FENCE_X, z - 4, z - 8, -0.02, 'grass');                    // side by side (no overdraw)
      for (let j = 0; j < 4; j += 1) {
        const za = z - j * 2; const x0 = sx > 0 ? R : -C; const x1 = sx > 0 ? C : -R;
        quad(x0, x1, za, za - 1, 0.26, 'curbA'); quad(x0, x1, za - 1, za - 2, 0.26, 'curbB');                    // curb tops
        side(sx * R, za, za - 1, 0.26, sx > 0 ? -1 : 1, 'curbA2'); side(sx * R, za - 1, za - 2, 0.26, sx > 0 ? -1 : 1, 'curbB2');
        quad(sx > 0 ? C : -FENCE_X, sx > 0 ? FENCE_X : -C, za - 0.03, za - 0.12, 0.145, 'walkLine');             // paving joint
      }
    }
  }
  return build(P);
}

/* ================================================================ textures */
function tex(canvas, rx = 1, ry = 1) { const t = new CanvasTexture(canvas); t.colorSpace = SRGBColorSpace; t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(rx, ry); return t; }
function drawGround(d, w) { // the street mesh takes the theme by role; the picket fence is an alpha-tested strip
  const sh = (hex, k) => _c.set(hex).multiplyScalar(k).getHexString();
  paint(d.streetG, { road: w.road, roadMid: `#${_c.set(w.road).lerp(new Color('#ffffff'), 0.07).getHexString()}`, line: w.line, walk: w.walk, walkLine: w.walkLine,
    grass: w.grass, grass2: w.grass2, curbA: w.curbA, curbB: w.curbB, curbA2: `#${sh(w.curbA, 0.8)}`, curbB2: `#${sh(w.curbB, 0.8)}` });
  const g = d.tx.fence.image.getContext('2d'); g.clearRect(0, 0, 64, 32); g.fillStyle = w.fence;
  g.fillRect(0, 10, 64, 4); g.fillRect(0, 22, 64, 4);
  for (let k = 0; k < 3; k += 1) { const x = 4 + k * 21; g.beginPath(); g.moveTo(x, 32); g.lineTo(x, 6); g.lineTo(x + 6, 1); g.lineTo(x + 12, 6); g.lineTo(x + 12, 32); g.fill(); }
  d.tx.fence.needsUpdate = true;
}
function drawBanner(ctx, t, text) {
  const c = t.image; const g = c.getContext('2d'); const W = c.width; const H = c.height;
  g.fillStyle = '#ff3d6e'; g.fillRect(0, 0, W, H);
  for (let x = 0; x < W / 16; x += 1) for (let y = 0; y < 2; y += 1) { g.fillStyle = (x + y) % 2 ? '#1c1a2e' : '#ffffff'; g.fillRect(x * 16, y * 8, 16, 8); g.fillRect(x * 16, H - 16 + y * 8, 16, 8); }
  let size = 72; g.font = `800 ${size}px ${ctx.font}`; while (g.measureText(text).width > W - 40 && size > 30) { size -= 4; g.font = `800 ${size}px ${ctx.font}`; }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = '#1c1a2e';
  g.strokeText(text, W / 2, H / 2 + 4); g.fillStyle = '#ffffff'; g.fillText(text, W / 2, H / 2 + 4); t.needsUpdate = true;
}

/* ================================================================ the game */
createGame({
  renderer: 'three',
  config: {
    meta: { title: 'Lane Dash', slug: 'lane-dash', version: 'v03', genre: 'runner', dimension: '3d', orientation: 'both', mode: 'GAME', seed: 20261031 },
    params: {
      runSpeed: { label: 'Run speed', group: 'Player', sub: 'Movement', type: 'float', def: 13, min: 6, max: 22, step: 0.5, unit: 'u/s', apply: 'live', marketer: true },
      jumpPower: { label: 'Jump height', group: 'Player', sub: 'Movement', type: 'float', def: 8, min: 5, max: 11, step: 0.5, apply: 'live' },
      laneSwitch: { label: 'Lane switch speed', group: 'Player', sub: 'Movement', type: 'float', def: 16, min: 6, max: 30, step: 1, apply: 'live' },
      lives: { label: 'Hearts', group: 'Player', type: 'int', def: 3, min: 1, max: 6, step: 1, apply: 'restart', marketer: true, dir: 'high' },
      speedGrowth: { label: 'Speed growth over time', group: 'Difficulty', type: 'float', def: 0.3, min: 0, max: 1.2, step: 0.05, unit: 'x/30s', apply: 'live' },
      levelSpeedUp: { label: 'Speed-up per level', group: 'Difficulty', type: 'float', def: 0.12, min: 0, max: 0.4, step: 0.02, apply: 'restart' },
      obstacleRate: { label: 'Obstacles per second', group: 'Enemies', type: 'float', def: 1.05, min: 0.3, max: 2.6, step: 0.05, apply: 'live', marketer: true, dir: 'low' },
      hurdleShare: { label: 'Share of jumpable hurdles', group: 'Enemies', type: 'float', def: 0.35, min: 0, max: 1, step: 0.05, apply: 'live' },
      doubleChance: { label: 'Double-block chance', group: 'Enemies', type: 'float', def: 0.3, min: 0, max: 0.8, step: 0.05, apply: 'live' },
      carChance: { label: 'Oncoming cars (level 2+)', group: 'Enemies', type: 'float', def: 0.35, min: 0, max: 1, step: 0.05, apply: 'live', marketer: true, dir: 'low' },
      rivalPace: { label: 'Rival pace', group: 'Enemies', type: 'float', def: 1.04, min: 0.8, max: 1.3, step: 0.01, unit: 'x', apply: 'live', marketer: true, dir: 'low' },
      coinRate: { label: 'Coin lines per second', group: 'Economy', type: 'float', def: 0.85, min: 0.2, max: 2.5, step: 0.05, apply: 'live', marketer: true },
      coinValue: { label: 'Points per coin', group: 'Economy', type: 'int', def: 10, min: 1, max: 50, step: 1, apply: 'live', marketer: true },
      coinBoost: { label: 'Speed boost per coin', group: 'Economy', type: 'float', def: 0.012, min: 0, max: 0.05, step: 0.002, apply: 'live' },
      magnetChance: { label: 'Magnet chance', group: 'Economy', type: 'float', def: 0.12, min: 0, max: 0.5, step: 0.01, apply: 'live', marketer: true },
      magnetSeconds: { label: 'Magnet duration', group: 'Economy', type: 'float', def: 5, min: 2, max: 12, step: 0.5, unit: 's', apply: 'live' },
      dodgeBonus: { label: 'Close-dodge bonus', group: 'Economy', type: 'int', def: 25, min: 0, max: 200, step: 5, apply: 'live' },
      goalDistance: { label: 'Finish distance', group: 'Timing', type: 'int', def: 500, min: 200, max: 3000, step: 50, unit: 'm', apply: 'restart', marketer: true, dir: 'low' },
      world: { label: 'World', group: 'Colors', sub: 'Background colors', type: 'enum', options: Object.keys(WORLDS), def: 'Sunny Park', apply: 'live', marketer: true },
      coinColor: { label: 'Coin colour', group: 'Colors', sub: 'Interface', type: 'color', def: '#ffcc1f', apply: 'live', marketer: true },
      crateColor: { label: 'Crate colour', group: 'Colors', type: 'color', def: '#d99a5b', apply: 'live' },
      boulderColor: { label: 'Boulder colour (ad near-miss)', group: 'Colors', type: 'color', def: '#9a8a7c', apply: 'live' },
      shirtColor: { label: 'Runner shirt', group: 'Characters', type: 'color', def: '#ff5b22', apply: 'live', marketer: true },
      pantsColor: { label: 'Runner shorts', group: 'Characters', type: 'color', def: '#2b59c3', apply: 'live' },
      capColor: { label: 'Runner cap', group: 'Characters', type: 'color', def: '#ffd23f', apply: 'live', marketer: true },
      rivalColor: { label: 'Rival shirt', group: 'Characters', type: 'color', def: '#b04dff', apply: 'live', marketer: true },
      crowdSize: { label: 'Cheering fans', group: 'Animation', type: 'int', def: 24, min: 0, max: 40, step: 2, apply: 'live', marketer: true },
      cameraHeight: { label: 'Camera height', group: 'Camera', sub: 'Position', type: 'float', def: 5.2, min: 2.5, max: 9, step: 0.1, apply: 'live', marketer: true },
      cameraDistance: { label: 'Camera distance', group: 'Camera', sub: 'Position', type: 'float', def: 8.2, min: 4, max: 13, step: 0.1, apply: 'live' },
      cameraFov: { label: 'Field of view', group: 'Camera', sub: 'Position', type: 'float', def: 62, min: 45, max: 80, step: 1, unit: '°', apply: 'live' },
      introOrbit: { label: 'Intro orbit', group: 'Camera', sub: 'Moments', type: 'bool', def: true, apply: 'live' },
      finishPunch: { label: 'Finish punch-in', group: 'Camera', sub: 'Moments', type: 'bool', def: true, apply: 'live' },
    },
    difficultyOverrides: { easy: { obstacleRate: 0.75, lives: 5, rivalPace: 0.98, carChance: 0.2 }, hard: { obstacleRate: 1.6, lives: 2, rivalPace: 1.1, carChance: 0.5 } },
    sharedDefaults: { uiSkin: 'candy', uiAccent: '#ff5b22', musicStyle: 'carnival', maxPlayTime: 90 },
    trailer: { obstacleRate: 1.3, coinRate: 1.4, magnetChance: 0.35, rivalPace: 1.0, goalDistance: 450, autoNext: true },
  },
  strings: {
    en: {
      'title.name': 'LANE DASH', 'title.tag': 'BEAT THE RIVAL TO THE FINISH', 'hint.swipe': 'SWIPE TO DODGE', 'hint.mouse': 'MOVE THE MOUSE TO DODGE',
      'obj.race': 'Beat the rival to the finish!', 'obj.cars': 'Dodge the oncoming cars!', 'obj.hard': 'Faster rival, more traffic!',
      'go': 'GO!', 'half': 'HALFWAY!', 'sprint': 'FINAL SPRINT!', 'dodge': 'CLOSE CALL!', 'ouch': 'OUCH!', 'magnet': 'MAGNET!', 'cars': 'CARS!',
      'pass': 'YOU PASSED THE RIVAL!', 'ahead': 'RIVAL AHEAD!', 'win': 'FINISH!', 'winRival': 'YOU WON THE RACE!', 'sub': 'Level {n} cleared',
      'lose': 'WIPEOUT!', 'sign.finish': 'FINISH', 'boulder': 'BOULDER!', 'run': 'RUN!', 'crushed': 'CRUSHED!', 'ad.left': 'Only {n} m to go!',
    },
  },
  titleKey: 'title.name',
  taglineKey: 'title.tag',
  hintKey: 'hint.swipe',
  tutorial: { gesture: 'drag-h', x: 195, y: 640, span: 80, labelKey: 'hint.swipe' },
  hoverSteer: true, // a hovering mouse counts as a held drag: its x position picks the lane (see readControls)

  async init(ctx) {
    const d = ctx.data; const soft = ctx.softwareGL;
    const r = new WebGLRenderer({ canvas: ctx.canvas, antialias: !soft, powerPreference: 'high-performance' });
    r.outputColorSpace = SRGBColorSpace; r.toneMapping = NoToneMapping; // no ACES: the fog meets the sky without a seam
    const scene = new Scene(); scene.fog = new Fog(0xffffff, 38, 125);
    const camera = new PerspectiveCamera(62, 1, 0.3, 420);
    const hemi = new HemisphereLight(0xffffff, 0x88aa66, 1.1); scene.add(hemi);
    const sun = new DirectionalLight(0xffffff, 2.2); scene.add(sun, sun.target); // follows the camera (see render)

    // materials: ONE toon material for every vertex-coloured model, plus a few flat/special ones
    const grad = new DataTexture(new Uint8Array([110, 190, 255]), 3, 1, RedFormat); grad.minFilter = grad.magFilter = NearestFilter; grad.needsUpdate = true;
    const S = ctx.sprites;
    d.tx = { fence: tex(S.canvas(64, 32), 130, 1) };
    const blob = new CanvasTexture(S.canvas(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(20,24,60,0.55)'); gr.addColorStop(0.6, 'rgba(20,24,60,0.3)'); gr.addColorStop(1, 'rgba(20,24,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }));
    const star = new CanvasTexture(S.canvas(64, 64, (g) => {
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,250,200,0.55)'); gr.addColorStop(1, 'rgba(255,240,160,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.fillStyle = '#ffffff';
      for (const [w, h] of [[3, 30], [30, 3]]) { g.beginPath(); g.ellipse(32, 32, w, h, 0, 0, Math.PI * 2); g.fill(); }
    }));
    const checker = tex(S.canvas(128, 16, (g) => { for (let x = 0; x < 16; x += 1) for (let y = 0; y < 2; y += 1) { g.fillStyle = (x + y) % 2 ? '#1c1a2e' : '#ffffff'; g.fillRect(x * 8, y * 8, 8, 8); } }), 1, 1);
    const bannerTex = new CanvasTexture(S.canvas(512, 128)); bannerTex.colorSpace = SRGBColorSpace;
    const mats = {
      toon: new MeshToonMaterial({ vertexColors: true, gradientMap: grad }),
      coin: new MeshToonMaterial({ vertexColors: true, gradientMap: grad, emissive: 0x6a4200 }),
      boulder: new MeshToonMaterial({ gradientMap: grad, flatShading: true }),
      line: new MeshBasicMaterial({ color: 0x1c1a2e, side: BackSide }),
      sky: new MeshBasicMaterial({ vertexColors: true, side: BackSide, fog: false, depthWrite: false }),
      cloud: new MeshBasicMaterial({ vertexColors: true, fog: false }),
      flat: new MeshBasicMaterial({ vertexColors: true }), // the street and the background props (lighting baked into the colours)
      fence: new MeshBasicMaterial({ map: d.tx.fence, alphaTest: 0.5, side: DoubleSide }),
      shadow: new MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false }),
      glint: new MeshBasicMaterial({ map: star, transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide }),
      checker: new MeshBasicMaterial({ map: checker }), banner: new MeshBasicMaterial({ map: bannerTex }),
    };

    /* ----- WORLD: sky dome, hills, clouds, the street */
    const skyGeo = new SphereGeometry(300, 24, 12); skyGeo.setAttribute('color', new BufferAttribute(new Float32Array(skyGeo.attributes.position.count * 3), 3));
    // drawn LAST among the opaque objects: the depth test then skips every pixel the world already covers
    const sky = new Mesh(skyGeo, mats.sky); sky.renderOrder = 10; sky.frustumCulled = false; scene.add(sky);
    const hillsG = baked(hillsGeo()); scene.add(new Mesh(hillsG, mats.flat));
    const cloudIM = new InstancedMesh(cloudGeo(), mats.cloud, 8); cloudIM.frustumCulled = false; scene.add(cloudIM);
    const clouds = Array.from({ length: 8 }, (_, i) => ({ x: (i % 2 ? 1 : -1) * (12 + vr() * 45), y: 24 + vr() * 16, z: i < 2 ? 70 + i * 40 : -50 - i * 24 - vr() * 10, s: 2.6 + vr() * 2 }));
    const streetG = streetGeo(); const street = new Mesh(streetG, mats.flat); scene.add(street);
    for (const sx of [-1, 1]) { // picket fences: one alpha-tested strip each (z = +20 … −240), scrolled by texture offset
      const fence = new Mesh(new PlaneGeometry(260, 0.95).rotateY(Math.PI / 2), mats.fence); fence.position.set(sx * FENCE_X, 0.5, -110); scene.add(fence);
    }

    // scenery strips: instanced props laid out over SPAN metres inside a group that scrolls with the run
    const scenery = new Group(); scene.add(scenery);
    const IM = (geo, n, parent = scenery, mat = mats.flat) => { const im = new InstancedMesh(baked(geo), mat, n); im.frustumCulled = false; parent.add(im); return im; };
    const strips = {
      tree: { im: IM(roundTreeGeo(), 24), place: placeTree }, pine: { im: IM(pineGeo(), 14), place: placeTree },
      house: { im: IM(houseGeo(), 14), place: placeHouse }, bush: { im: IM(bushGeo(), 20), place: placeBush },
      bunting: { im: IM(buntingGeo(), 6), place: placeBunting },
    };
    for (const st of Object.values(strips)) { st.n = st.im.count; st.s = new Float32Array(st.n); st.rnd = new Float32Array(st.n); }
    const fans = { body: IM(fanBodyGeo(), 40, scene), head: IM(fanHeadGeo(), 40, scene), n: 40, s: new Float32Array(40), x: new Float32Array(40), ph: new Float32Array(40), sc: new Float32Array(40) };
    fans.body.instanceMatrix.setUsage(DynamicDrawUsage); fans.head.instanceMatrix.setUsage(DynamicDrawUsage);
    for (let i = 0; i < 40; i += 1) { fans.body.setColorAt(i, _c.set(CAR_COLORS[(i * 7) % CAR_COLORS.length])); fans.head.setColorAt(i, _c.set(['#ffffff', '#f3d9c6', '#d9ac8a', '#ffe6d6'][i % 4])); }

    /* ----- CHARACTERS */
    const hero = makeRunner(mats, 'hero'); const rival = makeRunner(mats, 'rival'); scene.add(hero.root, rival.root);
    const shadowGeo = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const shadow = (s) => { const m = new Mesh(shadowGeo, mats.shadow); m.scale.setScalar(s); m.position.y = 0.03; m.renderOrder = 1; scene.add(m); return m; };
    const heroShadow = shadow(1.5); const rivalShadow = shadow(1.5);

    /* ----- obstacles + pickups: one InstancedMesh each, slots handed out by a free list */
    const pool = (geo, n, mat = mats.toon) => { const im = new InstancedMesh(geo, mat, n); im.frustumCulled = false; im.instanceMatrix.setUsage(DynamicDrawUsage); scene.add(im); return { im, n, free: [] }; };
    const pools = {
      crate: pool(crateGeo(), 24), bar: pool(hurdleGeo(), 14), car: pool(carBodyGeo(), 10), coin: pool(coinGeo(), 70, mats.coin), magnet: pool(magnetGeo(), 3),
    };
    const carParts = new InstancedMesh(carPartsGeo(), mats.toon, 10); carParts.frustumCulled = false; carParts.instanceMatrix.setUsage(DynamicDrawUsage); scene.add(carParts);
    for (let i = 0; i < 10; i += 1) pools.car.im.setColorAt(i, _c.set(CAR_COLORS[i % CAR_COLORS.length]));
    const glints = new InstancedMesh(new PlaneGeometry(1, 1), mats.glint, 70); glints.frustumCulled = false; glints.instanceMatrix.setUsage(DynamicDrawUsage); glints.renderOrder = 2; scene.add(glints);

    /* ----- finish arch, start/finish lines, the near-miss boulder */
    const arch = new Group(); const archG = archGeo(); arch.add(new Mesh(archG, mats.toon));
    for (const ry of [0, Math.PI]) { const b = new Mesh(new PlaneGeometry(ROAD_W - 0.5, 1.25), mats.banner); b.position.set(0, 4.65, ry ? -0.03 : 0.03); b.rotation.y = ry; arch.add(b); } // readable from both sides
    const finishLine = new Mesh(new PlaneGeometry(ROAD_W, 1.0).rotateX(-Math.PI / 2), mats.checker); finishLine.position.y = 0.02; arch.add(finishLine);
    scene.add(arch);
    const startLine = new Mesh(finishLine.geometry, mats.checker); startLine.position.y = 0.02; scene.add(startLine);
    const boulder = new Mesh(new IcosahedronGeometry(BOULDER_R, 1), mats.boulder); scene.add(boulder);
    const boulderFace = new Mesh(boulderFaceGeo(), mats.toon); scene.add(boulderFace);
    const boulderShadow = shadow(BOULDER_R * 2.4);

    Object.assign(d, {
      r, scene, camera, hemi, sun, mats, sky, skyGeo, hillsG, street, streetG, cloudIM, clouds, scenery, strips, fans, hero, rival, heroShadow, rivalShadow,
      pools, carParts, glints, arch, archG, bannerTex, startLine, boulder, boulderFace, boulderShadow,
      def: this, hi: { coin: 0, magnet: 0, car: 0, crate: 0, bar: 0 }, botCrate: [99, 99, 99], botBar: [99, 99, 99], animT: 0, roll: 0, objs: []
    });
    applyLook(ctx); drawBanner(ctx, bannerTex, ctx.t('sign.finish'));
    layoutScenery(ctx, 0);
    this.resize(ctx);
    // warm-up: compile every program and upload every texture now, not on the first frame of the race
    camera.position.set(0, 4, 9); camera.lookAt(0, 1, -10); camera.updateMatrixWorld();
    for (const t of [...Object.values(d.tx), blob, star, checker, bannerTex]) r.initTexture(t);
    try { await r.compileAsync(scene, camera); } catch (e) { r.compile(scene, camera); }
  },

  resize(ctx) {
    const v = ctx.view;
    this.tutorial.x = v.designW / 2; this.tutorial.y = v.portrait ? 640 : 300; // re-read every time the hand shows
    const d = ctx.data; if (!d.r) return;
    d.r.setPixelRatio(ctx.softwareGL ? 1 : Math.min(2, v.dpr)); d.r.setSize(v.w, v.h, false);
    d.camera.aspect = v.w / v.h; d.camera.updateProjectionMatrix();
  },

  setup(ctx) {
    const d = ctx.data; if (!d.r) return;
    const p = ctx.params;
    for (const o of d.objs) release(d, o);
    Object.assign(d, {
      lane: 1, prevLane: 1, laneT: 9, x: 0, vx: 0, y: 0, vy: 0, dist: 0, rivalDist: 0, lives: p.lives, invuln: 0, stun: 0, boost: 0, magnet: 0,
      obsT: 1.2, coinT: 0.3, objs: [], streak: 0, streakT: 0, coinCount: 0, phase: 0, camIn: 0, camA0: 0, halfShown: false, sprintShown: false,
      passed: false, finishT: -1, goal: Math.round(p.goalDistance * (1 + 0.35 * (ctx.level - 1)) / 50) * 50, levelMul: 1 + p.levelSpeedUp * (ctx.level - 1),
      botCool: 0, speed: 0, squash: 0, air: 0, fovKick: 0, cheer: 0, bump: 0, hudN: 0, carShown: false, objT: 0, loseT: -1, outro: null, rivalV: 0,
      dragX: 0, dragY: 0, dragDir: 0, dragUsed: false, dragJump: false, hoverX: -1,
      rivalLane: 2, rivalX: laneX(2), rivalY: 0, rivalVy: 0, rivalThink: 0,
      // ad near-miss state (see startBoulder): boulder distance along the road, height, speeds, roll angle
      adFail: false, caught: false, adCam: 0, bossDist: 0, bossX: 0, bossY: 0, bossVx: 0, bossVy: 0, bossV: 0, bossRoll: 0, dustT: 0,
    });
    for (const k of Object.keys(d.pools)) { const pl = d.pools[k]; pl.free.length = 0; for (let i = pl.n - 1; i >= 0; i -= 1) { pl.free.push(i); pl.im.setMatrixAt(i, ZERO); } pl.im.instanceMatrix.needsUpdate = true; }
    for (let i = 0; i < 10; i += 1) d.carParts.setMatrixAt(i, ZERO); d.carParts.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < 70; i += 1) d.glints.setMatrixAt(i, ZERO); d.glints.instanceMatrix.needsUpdate = true;
    d.boulder.visible = false; d.boulderFace.visible = false; d.boulderShadow.visible = false;
    layoutScenery(ctx, 0);
    for (let i = 0; i < 8; i += 1) { const o = spawn(d, 'coin', 1, -12 - i * 2.2); if (o) o.i = i; } // first coins within a second of GO
    ctx.ui.progress(null); ctx.ui.objective(null); hud(ctx, true);
    ipKeep(d, 0);
  },

  start(ctx) {
    const d = ctx.data;
    d.camA0 = introAngle(ctx); hud(ctx, true);
    ctx.ui.toast(ctx.level > 1 ? ctx.t('ui.level', { n: ctx.level }) : ctx.t('go'), { size: 'xl', color: '#ffd23f', ms: 800 });
    ctx.audio.sfx('whistle'); ctx.audio.sfx('whoosh', { pitch: 1.1 });
    ctx.ui.objective(ctx.t(ctx.level >= 3 ? 'obj.hard' : ctx.level === 2 ? 'obj.cars' : 'obj.race')); d.objT = 3.5;
    if (ctx.level >= 3) { ctx.ui.banner(ctx.t('ui.hard'), 1600); ctx.audio.sfx('boss', { pitch: 1.4 }); } // L3: "Can you beat it?"
  },

  update(ctx, dt) {
    const d = ctx.data; const p = ctx.params; const fx = ctx.fx;
    ipKeep(d, dt);
    d.animT += dt; d.camIn = Math.min(1, d.camIn + dt / 1.25);
    if (d.outro) { playOutro(ctx, dt); return; } // finish line crossed / out of hearts: a short beat before the card
    const base = p.runSpeed * d.levelMul * (1 + p.speedGrowth * (ctx.time / 30));
    const speed = d.caught ? 0 : base * (1 + d.boost) * (d.stun > 0 ? 0.45 : 1);
    d.speed = speed; // read by bot()
    d.rivalV = base * p.rivalPace; d.rivalDist += d.rivalV * dt;
    // ad funnel: true once at ~90 % in the near-miss level of AD mode (always false in GAME mode)
    if (!d.adFail && ctx.ad.check(d.dist / d.goal)) startBoulder(ctx);
    if (d.adFail) updateBoulder(ctx, dt, base * (1 + d.boost));

    // 1. controls → lane change / jump
    const c = readControls(ctx);
    if (!d.caught) {
      let want = c.lane >= 0 ? c.lane : d.lane + c.move;
      if (want < 0 || want > 2) { d.bump = Math.sign(want - 1) * 1; ctx.audio.sfx('bonk', { vol: 0.35, pitch: 1.4 }); } // nudge at the road edge
      want = clamp(want, 0, 2);
      if (want !== d.lane) switchLane(ctx, want);
      if (c.jump && d.y <= 0.001) { d.vy = p.jumpPower; d.squash = -0.6; ctx.audio.sfx('spring', { pitch: 1.05 + ctx.rng() * 0.1 }); ctx.emit('jump', {}); }
    }
    // 2. motion: ease into the lane (lean follows the sideways speed), jump arc, landing squash
    d.laneT += dt; const px = d.x; d.x = damp(d.x, laneX(d.lane), p.laneSwitch, dt); d.vx = (d.x - px) / dt;
    const wasAir = d.y > 0; d.vy -= 24 * dt; d.y = Math.max(0, d.y + d.vy * dt);
    if (d.y === 0) {
      d.vy = Math.max(0, d.vy);
      if (wasAir) { d.squash = 1; const s = proj(ctx, d.x, 0.1, 0); fx.burst(s.x, s.y, { count: 10, colors: ['#ffffff', '#e8dccb'], speed: 140, size: 7, lift: 60, life: 0.45 }); ctx.audio.sfx('thud', { vol: 0.7 }); }
    }
    d.air = damp(d.air, d.y > 0.15 ? 1 : 0, 14, dt); d.squash = damp(d.squash, 0, 9, dt); d.bump = damp(d.bump, 0, 10, dt);
    d.dist += speed * dt; d.invuln = Math.max(0, d.invuln - dt); d.stun = Math.max(0, d.stun - dt);
    d.boost = Math.max(0, d.boost - 0.03 * dt); d.magnet = Math.max(0, d.magnet - dt); d.fovKick = damp(d.fovKick, 0, 3, dt); d.cheer = Math.max(0, d.cheer - dt * 0.5);
    d.streakT -= dt; if (d.streakT <= 0) d.streak = 0;
    d.phase += speed * dt * 0.95;
    if (d.objT > 0) { d.objT -= dt; if (d.objT <= 0) ctx.ui.objective(null); }

    // 3. spawning (stop near the finish so the arch is clear, and once the boulder chase starts)
    const near = d.goal - d.dist < 40 || d.adFail;
    d.obsT -= dt;
    if (d.obsT <= 0 && !near) {
      const ease = ctx.ad.forceFail ? 0.7 : 1; // near-miss level: a kinder road so the runner really reaches ~90 %
      d.obsT = 1 / (p.obstacleRate * ease) * ctx.rng.range(0.7, 1.3);
      const hurdle = ctx.rng.chance(p.hurdleShare); const lanes = [0, 1, 2];
      const n = hurdle ? 1 : ctx.rng.chance(p.doubleChance * ease * ease) ? 2 : 1;
      const carP = ctx.level >= 2 ? p.carChance * (ctx.level >= 3 ? 1.25 : 1) : 0;
      for (let i = 0; i < n; i += 1) {
        const lane = lanes.splice(ctx.rng.int(0, lanes.length - 1), 1)[0];
        if (hurdle) { spawn(d, 'bar', lane, SPAWN_Z); if (ctx.rng.chance(0.55)) coinArc(d, lane); continue; }
        // a car drives toward you: spawn it farther out so it arrives exactly when a parked crate would
        if (ctx.rng.chance(carP)) { const o = spawn(d, 'car', lane, SPAWN_Z * (1 + CAR_V / Math.max(6, speed))); if (o) o.v = CAR_V; if (!d.carShown) { d.carShown = true; ctx.ui.toast(ctx.t('cars'), { color: '#ffd23f' }); } }
        else spawn(d, 'crate', lane, SPAWN_Z);
        clearCoins(d, lane, SPAWN_Z, 3);
      }
    }
    d.coinT -= dt;
    if (d.coinT <= 0 && !near) {
      d.coinT = 1 / p.coinRate * ctx.rng.range(0.8, 1.2);
      let lane = ctx.rng.int(0, 2); if (laneBlocked(d, lane)) lane = (lane + 1 + ctx.rng.int(0, 1)) % 3;
      if (!laneBlocked(d, lane)) {
        if (ctx.rng.chance(p.magnetChance) && d.magnet <= 0) spawn(d, 'magnet', lane, SPAWN_Z - 4);
        else for (let i = 0; i < 6; i += 1) { const o = spawn(d, 'coin', lane, SPAWN_Z - i * 2.2); if (o) o.i = i; }
      }
    }

    // 4. move + collide
    for (const o of d.objs) {
      const z0 = o.z; o.z += (speed + o.v) * dt;
      if (o.dead) continue;
      if (o.kind === 'coin' && d.magnet > 0 && o.z > -15 && o.z < 1) { // magnet: coins fly in
        o.lx = damp(o.lx ?? laneX(o.lane), d.x, 9, dt); o.y = damp(o.y, d.y + 1.1, 9, dt);
        if (Math.abs(o.z) < 1.2) { collectCoin(ctx, o); continue; }
      }
      if (o.kind === 'car' && !o.honked && o.lane === d.lane && o.z > -18) { o.honked = true; ctx.audio.sfx('honk', { vol: 0.6 }); }
      const blocker = o.kind === 'crate' || o.kind === 'car';
      if (blocker && z0 < 0 && o.z >= 0 && o.lane === d.prevLane && o.lane !== d.lane && d.laneT < 0.55 && p.dodgeBonus > 0) { // last-moment dodge
        ctx.score += p.dodgeBonus; ctx.ui.toast(ctx.t('dodge'), { color: '#3dfcff' }); const s = proj(ctx, d.x, 1.8, 0);
        fx.float(`+${p.dodgeBonus}`, s.x, s.y, { color: '#3dfcff' }); ctx.audio.sfx('zap', { pitch: 1.3 }); ctx.emit('dodge', {});
      }
      if (o.lane !== d.lane || Math.abs(o.z) > (HALF[o.kind] || 0.7)) continue;
      if (o.kind === 'coin') { if (Math.abs(o.y - (d.y + 1)) < 1.25) collectCoin(ctx, o); }
      else if (o.kind === 'magnet') grabMagnet(ctx, o);
      else if (d.invuln <= 0 && !(o.kind === 'bar' && d.y > 0.55)) { hitObstacle(ctx, o); if (d.outro) return; }
    }
    sweep(d);

    // 5. race moments
    const ahead = d.dist > d.rivalDist;
    if (ahead && !d.passed && ctx.time > 2) {
      d.passed = true; d.cheer = 1; d.fovKick = 6; ctx.ui.toast(ctx.t('pass'), { color: '#5ee35e' }); ctx.audio.sfx('cheer'); ctx.audio.sfx('whistle', { pitch: 1.2, vol: 0.6 });
      const s = proj(ctx, d.x, 1.4, 0); fx.burst(s.x, s.y, { count: 22, colors: ['#5ee35e', '#ffd23f', '#ffffff'], shape: 'confetti', speed: 320, size: 9, gravity: 400 }); ctx.emit('pass', {});
    } else if (!ahead && d.passed) { d.passed = false; ctx.ui.banner(ctx.t('ahead'), 900); ctx.audio.sfx('bad', { vol: 0.5 }); }
    if (!d.halfShown && d.dist >= d.goal / 2) { d.halfShown = true; ctx.ui.banner(ctx.t('half')); ctx.audio.sfx('ding'); }
    if (!d.sprintShown && d.goal - d.dist <= 90 && !d.adFail) { d.sprintShown = true; d.cheer = 1; d.fovKick = 5; ctx.ui.toast(ctx.t('sprint'), { color: '#ffd23f' }); ctx.audio.sfx('drum'); ctx.audio.sfx('cheer', { vol: 0.7 }); }
    if (d.dist >= d.goal && !d.adFail) {
      const beat = d.dist >= d.rivalDist; const stars = 1 + (beat ? 1 : 0) + (d.lives >= p.lives ? 1 : 0);
      ctx.score += d.lives * 50; d.finishT = 0; d.cheer = 1; d.invuln = 0; fx.slowmo(0.35, 700); ctx.audio.sfx('score'); ctx.audio.sfx('cheer');
      const s = proj(ctx, d.x, 1.6, 0); fx.burst(s.x, s.y, { count: 40, colors: ['#ffd23f', '#ffffff', '#3dd6ff', '#ff5b22', '#5ee35e'], shape: 'confetti', speed: 460, size: 12, gravity: 500, life: 1.2 });
      d.outro = { win: true, title: ctx.t(beat ? 'winRival' : 'win'), sub: ctx.t('sub', { n: ctx.level }), stars, next: ctx.level < 3 };
      return;
    }
    updateRival(ctx, dt);
    hud(ctx, false);
    recycleScenery(ctx, dt);
  },

  idle(ctx, dt) {
    const d = ctx.data; if (d.ip) ipKeep(d, dt);
    d.animT = (d.animT || 0) + dt;
    if (ctx.state === 'end' && d.finishT >= 0) d.finishT += dt;
    if (ctx.state === 'end') { d.cheer = Math.max(0, d.cheer - dt * 0.3); d.squash = damp(d.squash || 0, 0, 9, dt); if (d.loseT >= 0) d.loseT += dt; }
    if (d.r) recycleScenery(ctx, dt);
  },

  onParams(ctx) { applyLook(ctx); hud(ctx, true); },

  onTimeUp(ctx) { const d = ctx.data; ctx.end(d.outro || { win: false, reason: 'time', progress: clamp(d.dist / d.goal, 0, 0.99) }); },

  // render interpolation: the fixed 60 Hz steps would land 2-3-2-3 frames apart on a 90/120/144 Hz screen (the road
  // judders). render() draws the moment `alpha` (the kernel's leftover fraction of a step) between the last two steps:
  // ipSwap puts the in-between run state in place for drawing, ipRestore puts the real one back.
  render(ctx, alpha) {
    const d = ctx.data; if (!d.r || !d.ip) return;
    ipSwap(d, ipAlpha(d, alpha));
    try { drawFrame(ctx); } finally { ipRestore(d); }
  },

  // autoplay for ?test / ?trailer: jump hurdles just in time, dodge to the lane whose next block is farthest,
  // drift to coins and magnets in safe neighbouring lanes. Timings scale with the run speed (no allocations).
  bot(ctx) {
    const d = ctx.data; if (!d.objs || d.caught) return {};
    d.botCool = Math.max(0, (d.botCool || 0) - 1 / 60);
    const v = Math.max(6, d.speed || 10);
    // per lane: metres (at our speed) to the next block — a car closes faster — and to the next hurdle
    const crate = d.botCrate; const bar = d.botBar;
    for (let l = 0; l < 3; l += 1) { crate[l] = 99; bar[l] = 99; }
    for (const o of d.objs) {
      if (o.dead) continue;
      if (o.kind === 'crate' || o.kind === 'car') {
        const h = HALF[o.kind] - HALF.crate; if (o.z - h > 1.2 || o.z + h < -45) continue;
        const m = -(o.z + h); crate[o.lane] = Math.min(crate[o.lane], m > 0 ? m * v / (v + o.v) : m);
      } else if (o.kind === 'bar' && o.z < 0.8 && o.z > -45) bar[o.lane] = Math.min(bar[o.lane], -o.z);
    }
    if (bar[d.lane] < v * 0.2 && d.y === 0) return { swipe: 'up' }; // ~0.2 s before impact: clears it at any speed
    if (d.botCool > 0) return {};
    const late = v * 0.12 + 1.5; // a hurdle this close in another lane can't be jumped in time after switching
    const danger = v * 0.55 + 4;
    if (crate[d.lane] < danger) {
      let best = d.lane;
      for (let l = 0; l < 3; l += 1) if (l !== d.lane && botLaneOk(d, l, late) && crate[l] > crate[best] + 0.5) best = l;
      if (best !== d.lane) { d.botCool = 0.12; return { swipe: best < d.lane ? 'left' : 'right' }; }
      return {};
    }
    for (const o of d.objs) {
      if (o.dead || (o.kind !== 'coin' && o.kind !== 'magnet') || o.z < -16 || o.z > -3 || Math.abs(o.lane - d.lane) !== 1) continue;
      if (crate[o.lane] > danger + 12 && botLaneOk(d, o.lane, late)) { d.botCool = 0.25; return { swipe: o.lane < d.lane ? 'left' : 'right' }; }
      break;
    }
    return {};
  },
});

/* ================================================================= CONTROLS */
// One place reads every input device and returns { move: −1/0/1, lane: 0..2 or −1, jump }.
//  · mouse / trackpad (def.hoverSteer): the cursor's horizontal third of the screen IS the lane — no click needed;
//    a click jumps. Only applied when the cursor moved, so the arrow keys still work with a resting mouse.
//  · touch: DRAG_STEP px of sideways drag switches a lane at once (no need to lift the finger; a second lane the
//    same way needs DRAG_MORE px, so one long swipe is still one lane), an upward drag jumps; a tap jumps.
//  · keys: ←/→ or A/D, ↑/W/Space. The bot sends swipes.
const CTL = { move: 0, lane: -1, jump: false };
function readControls(ctx) {
  const d = ctx.data; const inp = ctx.input; const mouse = inp.pointerType === 'mouse' && !inp.bot;
  CTL.move = 0; CTL.lane = -1; CTL.jump = false;
  if (inp.pressed.has('ArrowLeft') || inp.pressed.has('KeyA')) CTL.move -= 1;
  if (inp.pressed.has('ArrowRight') || inp.pressed.has('KeyD')) CTL.move += 1;
  if (inp.pressed.has('ArrowUp') || inp.pressed.has('KeyW') || inp.pressed.has('Space')) CTL.jump = true;
  if (inp.taps.length && ctx.time > 0.3) CTL.jump = true; // (the tap that started the run doesn't jump)
  if (mouse) {
    if (inp.hover.active && inp.hover.x !== d.hoverX) { d.hoverX = inp.hover.x; CTL.lane = laneFromScreen(ctx, inp.hover.x); }
    for (const s of inp.swipes) if (s === 'up') CTL.jump = true;
  } else {
    if (inp.down) {
      d.dragX += inp.dx; d.dragY += inp.dy;
      const dir = Math.sign(d.dragX);
      if (Math.abs(d.dragX) >= (dir === d.dragDir ? DRAG_MORE : DRAG_STEP)) { CTL.move += dir; d.dragDir = dir; d.dragX = 0; d.dragY = 0; d.dragUsed = true; }
      if (d.dragY < -DRAG_STEP * 1.3 && !d.dragJump) { CTL.jump = true; d.dragJump = true; d.dragUsed = true; }
    }
    if (!d.dragUsed) for (const s of inp.swipes) { if (s === 'left') CTL.move -= 1; else if (s === 'right') CTL.move += 1; else if (s === 'up') CTL.jump = true; }
    if (inp.released || !inp.down) { d.dragX = 0; d.dragY = 0; d.dragDir = 0; d.dragUsed = false; d.dragJump = false; }
  }
  CTL.move = clamp(CTL.move, -1, 1);
  // the idle hint names the device the player actually uses
  if (inp.pointerType) d.def.tutorial.labelKey = mouse ? 'hint.mouse' : 'hint.swipe';
  return CTL;
}
// screen thirds → lanes, with a little hysteresis so the border never flickers between two lanes
function laneFromScreen(ctx, x) {
  const v = ctx.view; const f = clamp((x - v.left) / Math.max(1, v.right - v.left), 0, 0.999) * 3; const cur = ctx.data.lane;
  const lane = Math.floor(f);
  return lane !== cur && Math.abs(lane - cur) === 1 && Math.abs(f - Math.round(f)) < 0.08 ? cur : lane;
}
function switchLane(ctx, lane) {
  const d = ctx.data;
  d.prevLane = d.lane; d.lane = lane; d.laneT = 0; d.squash = -0.25;
  ctx.audio.sfx('swoosh', { pitch: 0.95 + ctx.rng() * 0.2, vol: 0.8 });
  const s = proj(ctx, d.x, 0.1, 0.2); ctx.fx.burst(s.x, s.y, { count: 5, colors: ['#ffffff', '#e8dccb'], speed: 110, size: 6, lift: 40, life: 0.35 });
}

/* ================================================================ gameplay */
// The last beat before the end card: past the line the hero slows down and cheers under the arch while the camera
// punches in; out of hearts he wobbles to a stop. Timed in real seconds, so the finish slow-mo doesn't stretch it.
function playOutro(ctx, dt) {
  const d = ctx.data; const real = dt / Math.max(0.05, ctx.fx.timeScale); const win = d.finishT >= 0;
  if (win) d.finishT += real; else d.loseT += real;
  const t = win ? d.finishT : d.loseT;
  const v = d.speed * Math.max(0, 1 - t * (win ? 1.1 : 2.5));
  d.dist += v * dt; d.phase += v * dt * 0.95; for (const o of d.objs) o.z += (v + o.v) * dt; sweep(d);
  d.vy -= 24 * dt; d.y = Math.max(0, d.y + d.vy * dt); d.air = damp(d.air, 0, 14, dt); d.squash = damp(d.squash, 0, 9, dt); d.stun = Math.max(0, d.stun - dt);
  d.rivalDist += d.rivalV * dt; updateRival(ctx, dt); recycleScenery(ctx, dt);
  if (t > (win ? 1.5 : 1.0)) { const r = d.outro; d.outro = null; ctx.end(r); }
}
function spawn(d, kind, lane, z) {
  const pl = d.pools[kind]; const slot = pl.free.pop(); if (slot === undefined) return null;
  const o = { kind, lane, z, y: 1, v: 0, slot, dead: false, i: 0, lx: null, honked: false, seed: vr() * 6.28 };
  d.objs.push(o); return o;
}
function hide(d, o) {
  d.pools[o.kind].im.setMatrixAt(o.slot, ZERO);
  if (o.kind === 'car') d.carParts.setMatrixAt(o.slot, ZERO);
  if (o.kind === 'coin') d.glints.setMatrixAt(o.slot, ZERO);
}
function release(d, o) { hide(d, o); d.pools[o.kind].free.push(o.slot); }
// drop collected / passed objects (swap-remove, no allocation)
function sweep(d) { for (let i = d.objs.length - 1; i >= 0; i -= 1) { const o = d.objs[i]; if (o.z > 8 || o.dead) { release(d, o); d.objs[i] = d.objs[d.objs.length - 1]; d.objs.pop(); } } }
// a coin arc over a hurdle: the jump that clears the hurdle collects the top coins
function coinArc(d, lane) {
  for (let k = -2; k <= 2; k += 1) { const o = spawn(d, 'coin', lane, SPAWN_Z + k * 1.6); if (o) { o.y = 1 + 1.45 * (1 - (k / 2.4) ** 2); o.i = k + 2; } }
}
function clearCoins(d, lane, z, r) { for (const o of d.objs) if (o.kind === 'coin' && o.lane === lane && Math.abs(o.z - z) < r) o.dead = true; }
function laneBlocked(d, lane) { for (const o of d.objs) if (!o.dead && o.lane === lane && o.kind !== 'coin' && o.z < SPAWN_Z + 6 && o.z > SPAWN_Z - 30) return true; return false; }

function collectCoin(ctx, o) {
  const d = ctx.data; const p = ctx.params;
  o.dead = true; d.coinCount += 1; d.streak += 1; d.streakT = 1.1; d.boost = Math.min(0.35, d.boost + p.coinBoost);
  ctx.score += p.coinValue;
  if (sndGap(ctx, 'coin', 0.065)) ctx.audio.sfx('coin', { pitch: sndJit(1 + (d.streak % 12) * 0.05), vol: 0.6 });
  const s = proj(ctx, o.lx ?? laneX(o.lane), o.y, Math.min(0, o.z));
  ctx.fx.burst(s.x, s.y, { count: 7, colors: [p.coinColor, '#ffffff', '#fff3a0'], speed: 170, size: 7, shape: 'star', gravity: 300 });
  if (d.streak % 6 === 0) { ctx.fx.float(`x${d.streak}`, s.x, s.y - 30, { color: p.coinColor, size: 34 }); ctx.fx.ring(s.x, s.y, { color: '#fff3a0', radius: 70, width: 6 }); ctx.audio.sfx('chime', { pitch: 1 + Math.min(4, d.streak / 6 - 1) * 0.1 }); d.fovKick = Math.max(d.fovKick, 3); }
  ctx.emit('coin', { streak: d.streak });
}
function grabMagnet(ctx, o) {
  const d = ctx.data; o.dead = true; d.magnet = ctx.params.magnetSeconds; d.fovKick = 7;
  ctx.ui.toast(ctx.t('magnet'), { color: '#ff5a5a' }); ctx.audio.sfx('powerup'); ctx.audio.sfx('sparkle'); ctx.fx.flash('#ffffff', 0.35, 150);
  const s = proj(ctx, d.x, 1.2, 0); ctx.fx.ring(s.x, s.y, { color: '#ff5a5a', radius: 120 }); ctx.emit('magnet', {});
}
function hitObstacle(ctx, o) {
  const d = ctx.data; const fx = ctx.fx;
  o.dead = true; d.lives -= 1; d.invuln = 1.3; d.stun = 0.7; d.boost = 0; d.streak = 0;
  const s = proj(ctx, d.x, 1, 0);
  fx.burst(s.x, s.y, { count: 26, colors: o.kind === 'car' ? ['#ffffff', '#ffd23f', '#9aa3b8'] : o.kind === 'bar' ? ['#ffffff', '#ff3b4e'] : ['#ffffff', '#ffd23f', ctx.params.crateColor], speed: 380, size: 9, shape: 'square' });
  const h = proj(ctx, d.x, 2.2, 0); fx.burst(h.x, h.y, { count: 6, colors: ['#ffd23f'], shape: 'star', speed: 90, size: 12, gravity: -40, life: 0.8 }); // dizzy stars
  fx.flash('#ff2a2a', 0.4, 220); fx.shake(12, 380); fx.freeze(80); fx.haptic(50);
  ctx.audio.sfx(o.kind === 'car' ? 'crunch' : o.kind === 'bar' ? 'punch' : 'bonk'); ctx.audio.sfx('hit', { vol: 0.6 });
  ctx.ui.toast(ctx.t('ouch'), { color: '#ff5a5a' }); ctx.emit('hit', { lives: d.lives, kind: o.kind });
  hud(ctx, true);
  if (d.lives <= 0 && !d.adFail) { // out of hearts (during the trap the boulder ends the run instead)
    for (const q of d.objs) if (q.kind !== 'coin' && q.z > -10) q.dead = true; // clear the view for the wipe-out shot
    d.loseT = 0; d.outro = { win: false, reason: 'crashed', title: ctx.t('lose'), progress: d.dist / d.goal };
  }
}
// cosmetic rival: picks a lane free of blocks (and out of yours when it is close), hops its hurdles
function updateRival(ctx, dt) {
  const d = ctx.data; const rz = d.dist - d.rivalDist;
  d.rivalThink -= dt;
  if (d.rivalThink <= 0) {
    d.rivalThink = 0.2; let best = d.rivalLane; let bestS = -1e9;
    for (let l = 0; l < 3; l += 1) {
      let sc = l === d.rivalLane ? 1 : 0; if (l === d.lane && Math.abs(rz) < 12) sc -= 50; // never share your lane up close
      for (const o of d.objs) if (!o.dead && o.lane === l && (o.kind === 'crate' || o.kind === 'car') && o.z > rz - 16 && o.z < rz + 1.5) sc -= 10;
      if (sc > bestS) { bestS = sc; best = l; }
    }
    d.rivalLane = best;
  }
  d.rivalX = damp(d.rivalX, laneX(d.rivalLane), 9, dt);
  if (d.rivalY <= 0) for (const o of d.objs) if (o.kind === 'bar' && !o.dead && o.lane === d.rivalLane && o.z > rz - 2.6 && o.z < rz - 0.8) { d.rivalVy = 7.6; break; }
  d.rivalVy -= 24 * dt; d.rivalY = Math.max(0, d.rivalY + d.rivalVy * dt); if (d.rivalY === 0) d.rivalVy = Math.max(0, d.rivalVy);
}

// bot helper: may we switch into lane l now? (no hurdle too close to jump after the switch, no blocked middle lane on a 2-lane move)
function botLaneOk(d, l, late) { return d.botBar[l] > late && (Math.abs(l - d.lane) < 2 || (d.botCrate[1] > 3 && d.botBar[1] > late)); }

function proj(ctx, x, y, z) { v3.set(x, y, z).project(ctx.data.camera); return ctx.view.ndcToDesign(v3.x, v3.y); }

/* ===================================================== drawing the moving bits */
// InstancedMesh.count is trimmed to the highest live slot each frame: hidden slots would still cost vertex work
function drawObjects(ctx, t) {
  const d = ctx.data; const P = d.pools; const hi = d.hi;
  for (const k in hi) hi[k] = 0;
  for (const o of d.objs) {
    hi[o.kind] = Math.max(hi[o.kind], o.slot + 1);
    if (o.z - (HALF[o.kind] || 0) > 1.5) { hide(d, o); continue; } // already passed: keep the camera's view clear
    const x = o.lx ?? laneX(o.lane);
    switch (o.kind) {
      case 'coin': {
        const y = o.y + Math.sin(t * 4 + o.i) * 0.1;
        setInst(P.coin.im, o.slot, x, y, o.z, t * 4 + o.i * 0.5);
        const tw = Math.max(0, Math.sin(t * 3.1 + o.seed)) ** 6; // each coin twinkles on its own beat
        setInst(d.glints, o.slot, x + 0.18, y + 0.2, o.z + 0.3, 0, 0.3 + tw * 0.75, 0.3 + tw * 0.75, 1, 0, t * 2 + o.seed);
        break;
      }
      case 'magnet': setInst(P.magnet.im, o.slot, x, 1.1 + Math.sin(t * 5) * 0.15, o.z, t * 3, 1.2); break;
      case 'car': { const b = Math.sin(t * 20 + o.seed) * 0.03; setInst(P.car.im, o.slot, x, b, o.z); setInst(d.carParts, o.slot, x, b, o.z); break; }
      case 'crate': setInst(P.crate.im, o.slot, x, 0, o.z); break;
      default: setInst(P.bar.im, o.slot, x, 0, o.z);
    }
  }
  for (const k in hi) { P[k].im.count = hi[k]; P[k].im.instanceMatrix.needsUpdate = true; }
  d.carParts.count = hi.car; d.carParts.instanceMatrix.needsUpdate = true; d.glints.count = hi.coin; d.glints.instanceMatrix.needsUpdate = true;
}
function drawFans(ctx, t) { // the crowd jumps; harder when something exciting happens (d.cheer)
  const d = ctx.data; const F = d.fans; const n = Math.min(F.n, ctx.params.crowdSize | 0); const amp = 0.12 + (d.cheer || 0) * 0.35;
  F.body.count = n; F.head.count = n;
  for (let i = 0; i < n; i += 1) {
    const z = d.dist - F.s[i];
    if (z > 12 || z < -130) { F.body.setMatrixAt(i, ZERO); F.head.setMatrixAt(i, ZERO); continue; }
    const y = Math.max(0, Math.sin(t * (6 + (i % 3)) + F.ph[i])) * amp; const ry = F.x[i] > 0 ? Math.PI / 2 : -Math.PI / 2;
    setInst(F.body, i, F.x[i], 0.14 + y, z, ry, F.sc[i]); setInst(F.head, i, F.x[i], 0.14 + y, z, ry, F.sc[i]);
  }
  F.body.instanceMatrix.needsUpdate = true; F.head.instanceMatrix.needsUpdate = true;
}

function drawFrame(ctx) { // (render: draws the interpolated state put in place by ipSwap)
  const d = ctx.data; const p = ctx.params; const t = d.animT; const intro = ctx.state === 'intro'; const ended = ctx.state === 'end';
  // hero: run cycle, jump tuck, lean into lane changes, celebrate / wobble / get flattened at the end
  const lean = clamp(-d.vx * 0.022, -0.35, 0.35) + d.bump * 0.12;
  const mode = intro ? 'ready' : d.caught ? 'flat' : d.finishT >= 0 ? 'cheer' : d.stun > 0 || d.loseT >= 0 ? 'dizzy' : 'run';
  poseRunner(d.hero, mode, d.phase, d.air, lean, t);
  d.hero.root.position.set(d.x + d.bump * 0.2, d.y, 0);
  if (mode === 'cheer') d.hero.root.position.y += Math.abs(Math.sin(t * 6.5)) * 0.35;
  if (mode !== 'flat') { const sq = d.squash; d.hero.root.scale.set(1 + sq * 0.12, 1 - sq * 0.16, 1 + sq * 0.12); }
  d.hero.root.visible = d.invuln <= 0 || d.outro !== null || ended || Math.floor(t * 14) % 2 === 0; // blink while invulnerable
  d.heroShadow.position.x = d.x; d.heroShadow.scale.setScalar(1.5 * (1 - Math.min(0.5, d.y * 0.18)));
  // rival: its distance is a pace number; lane + hops are cosmetic (it stays out of your lane when close)
  const rz = d.dist - d.rivalDist;
  const rv = intro || (rz < 2.5 && rz > -75); // hidden once it falls behind you (it would fill the chase camera's lens)
  d.rival.root.visible = rv; d.rivalShadow.visible = rv;
  if (rv) {
    poseRunner(d.rival, intro ? 'smug' : ended && rz < 0 ? 'cheer' : 'run', d.phase * 1.02 + 1.3, d.rivalY > 0.15 ? 1 : 0, 0, t + 0.7);
    d.rival.root.position.set(d.rivalX, d.rivalY + (ended && rz < 0 ? Math.abs(Math.sin(t * 6.5 + 1)) * 0.3 : 0), intro ? 0.4 : rz);
    d.rivalShadow.position.set(d.rivalX, 0.03, intro ? 0.4 : rz);
  }
  drawObjects(ctx, t);
  // finish arch + start line ride the road
  const az = d.dist - d.goal; d.arch.visible = az > -130 && az < 12; d.arch.position.z = az;
  d.startLine.position.z = d.dist; d.startLine.visible = d.dist < 14;
  // ad near-miss boulder: rolls along the road centre, z = how far behind the runner it is; the face stays upright
  if (d.boulder.visible) {
    const bz = d.dist - d.bossDist;
    d.boulder.position.set(d.bossX, d.bossY, bz); d.boulder.rotation.set(-d.bossRoll, Math.atan2(-d.bossVx, d.bossV + 0.01), 0, 'YXZ');
    d.boulderFace.visible = true; d.boulderFace.position.set(d.bossX, d.bossY + 0.4, bz - BOULDER_R * 0.86);
    d.boulderShadow.visible = true; d.boulderShadow.position.set(d.bossX, 0.04, bz); d.boulderShadow.scale.setScalar(BOULDER_R * 2.4 * Math.max(0.3, 1 - (d.bossY - BOULDER_R) * 0.06));
  }
  drawFans(ctx, t);
  d.scenery.position.z = d.dist;
  for (let i = 0; i < d.clouds.length; i += 1) { const c = d.clouds[i]; setInst(d.cloudIM, i, c.x, c.y, c.z, 0, c.s, c.s * 0.8, c.s); }
  d.cloudIM.instanceMatrix.needsUpdate = true;
  d.street.position.z = d.dist % 8; d.tx.fence.offset.x = (d.dist / 2) % 1; // the ground slides with the drawn run
  placeCamera(ctx);
  d.r.render(d.scene, d.camera);
}

// render interpolation (see render): the run state at the START of the last fixed step, swapped in for drawing.
// A step that passes without update/idle (a hit-freeze) shows as alpha falling back with no new step: then hold;
// a reset (setup) or a jump > 6 m snaps.
const IP_KEYS = ['dist', 'x', 'y', 'bump', 'rivalDist', 'rivalX', 'rivalY', 'animT', 'phase', 'camIn', 'bossDist', 'bossX', 'bossY', 'bossRoll'];
function ipKeep(d, dt) {
  const ip = d.ip || (d.ip = { v: {}, cur: {}, n: 0, rn: -1, ra: 0, dt: 0 });
  for (const k of IP_KEYS) ip.v[k] = d[k];
  for (const o of d.objs) { o.pz = o.z; o.py = o.y; o.plx = o.lx; }
  ip.dt = dt; ip.n += 1;
}
function ipAlpha(d, alpha) {
  const ip = d.ip; let a = Number.isFinite(alpha) ? clamp(alpha, 0, 1) : 1;
  if ((ip.n === ip.rn && a < ip.ra) || Math.abs(d.dist - ip.v.dist) > 6) ipKeep(d, 0);
  if (ip.dt === 0) a = 1; // (just snapped: the current state as is)
  ip.rn = ip.n; ip.ra = a; return a;
}
function ipSwap(d, a) {
  const ip = d.ip; const cur = ip.cur;
  for (const k of IP_KEYS) { cur[k] = d[k]; d[k] = lerp(ip.v[k], d[k], a); }
  for (const o of d.objs) {
    o.cz = o.z; o.cy = o.y; o.clx = o.lx;
    if (o.pz !== undefined) { o.z = lerp(o.pz, o.z, a); o.y = lerp(o.py, o.y, a); if (o.lx != null && o.plx != null) o.lx = lerp(o.plx, o.lx, a); }
  }
}
function ipRestore(d) {
  const cur = d.ip.cur; for (const k of IP_KEYS) d[k] = cur[k];
  for (const o of d.objs) { o.z = o.cz; o.y = o.cy; o.lx = o.clx; }
}

/* ================================================================== CAMERA */
// Spherical rig around the hero: angle 0 = in front (looking at the face), π = the chase view behind.
// intro: slow swing around the front → play: swing round the hero's right (away from the rival) into the chase view
// → follow with damping, FOV kicks on magnet / pass / sprint, a slight roll into lane changes
// → finish: punch-in to the front of the cheering hero; AD near-miss: look back at the boulder.
const CAM = { x: 0, y: 0, z: 0, lx: 0, ly: 0, lz: 0 }; const CAM2 = { ...CAM }; const CAM3 = { ...CAM };
function introAngle(ctx) { return ctx.params.introOrbit ? Math.sin(ctx.data.animT * 0.45) * 0.55 : 0.35; }
function orbit(out, hx, a, R, H, shift, ly) {
  out.x = hx + Math.sin(a) * R; out.y = H; out.z = -Math.cos(a) * R;
  out.lx = hx + shift * Math.cos(a); out.ly = ly; out.lz = shift * Math.sin(a); return out;
}
function mixCam(a, b, k) { for (const key of ['x', 'y', 'z', 'lx', 'ly', 'lz']) a[key] += (b[key] - a[key]) * k; return a; }
function placeCamera(ctx) {
  const d = ctx.data; const p = ctx.params; const hx = d.x; const land = !ctx.view.portrait;
  const follow = CAM; follow.x = hx * 0.55; follow.y = p.cameraHeight + d.y * 0.3; follow.z = p.cameraDistance; follow.lx = hx * 0.45; follow.ly = 1.1 + d.y * 0.5; follow.lz = -8;
  let cam = follow;
  if (ctx.state === 'intro') cam = orbit(CAM2, hx, introAngle(ctx), land ? 8 : 6.4, 2.1, land ? 6.2 : 1.1, land ? 1.35 : 1.7); // both racers; beside the logo in landscape
  else if (ctx.state === 'play' && d.camIn < 1) {
    const k = ctx.ease.inOutSine(d.camIn); // swing from the intro angle round the +x side to π
    cam = mixCam(orbit(CAM2, hx, lerp(d.camA0, -Math.PI, k), lerp(land ? 8 : 6.4, p.cameraDistance, k), lerp(2.1, p.cameraHeight, k), lerp(land ? 6.2 : 1.1, 0, k), 1.4), follow, k * k);
  } else if (d.finishT >= 0 && p.finishPunch) {
    const k = ctx.ease.outCubic(Math.min(1, d.finishT * 1.2));
    cam = mixCam(follow, orbit(CAM2, hx, hx < 0 ? 0.6 : -0.6, land ? 4.6 : 5.0, 2.3, land ? 1.8 * Math.sign(hx || 1) : 0, 1.45), k); // front quarter, on the road side
  } else if (d.loseT >= 0) { // out of hearts: drift round to the dizzy hero's side
    cam = mixCam(follow, orbit(CAM2, hx, hx < 0 ? 0.75 : -0.75, 5.2, 3.0, 0, 1.2), ctx.ease.outCubic(Math.min(1, d.loseT * 1.1)));
  }
  // ad near-miss: swing round to a front-quarter look-back so the runner and the boulder behind him share the shot
  if (d.adFail) { const lb = CAM3; lb.x = hx * 0.4 + 2.2; lb.y = 4.4; lb.z = -9; lb.lx = hx * 0.6; lb.ly = 1.6; lb.lz = 3.5; cam = mixCam(cam, lb, ctx.ease.inOutSine(Math.min(1, d.adCam))); } // stays over the road
  const off = ctx.fx.offset;
  d.camera.position.set(cam.x + off.x * 0.01, cam.y + off.y * 0.01, cam.z);
  d.camera.lookAt(cam.lx, cam.ly, cam.lz);
  d.roll = damp(d.roll, ctx.state === 'play' ? clamp(-d.vx * 0.004, -0.05, 0.05) : 0, 8, 1 / 60); d.camera.rotateZ(d.roll);
  const fov = (land ? p.cameraFov * 0.8 : p.cameraFov) + d.fovKick + d.boost * 14 + (d.magnet > 0 ? 3 : 0);
  if (Math.abs(fov - d.camera.fov) > 0.05) { d.camera.fov = fov; d.camera.updateProjectionMatrix(); }
  // the key light rides with the camera (upper right, slightly behind it), so the side you see is always lit
  d.camera.updateMatrixWorld(); const e = d.camera.matrixWorld.elements;
  d.sun.position.set(cam.lx + e[0] * 5 + e[8] * 6, cam.ly + 9, cam.lz + e[2] * 5 + e[10] * 6); d.sun.target.position.set(cam.lx, cam.ly, cam.lz); d.sun.target.updateMatrixWorld();
  d.sky.position.copy(d.camera.position);
}

/* =================================================================== WORLD */
// scenery strips: every instance sits at a course distance s[i] inside d.scenery (which scrolls with the run);
// when one falls behind the camera it jumps SPAN metres ahead and gets new random looks (only then is a matrix written)
function placeTree(st, i) {
  const side = i % 2 ? 1 : -1; const far = st.rnd[i] < 0.5; const sc = (far ? 1.1 : 0.8) + vr() * 0.45;
  const x = side * (far ? 16 + vr() * 20 : FENCE_X + 1.3 + vr() * 1.6);
  setInst(st.im, i, x, 0, -st.s[i], vr() * 6.3, sc, sc * (0.9 + vr() * 0.25), sc);
}
function placeHouse(st, i) {
  const side = i % 2 ? 1 : -1; const sc = 0.95 + vr() * 0.25;
  setInst(st.im, i, side * (11.6 + vr() * 1.6), 0, -st.s[i], side * Math.PI / 2 + (vr() - 0.5) * 0.2, sc, sc * (0.9 + vr() * 0.35), sc);
  st.im.setColorAt(i, _c.set(st.tints[(i * 3 + Math.floor(st.s[i])) % st.tints.length]));
}
function placeBush(st, i) { const sc = 0.8 + vr() * 0.5; setInst(st.im, i, (i % 2 ? 1 : -1) * (FENCE_X + 0.9 + vr() * 3), 0, -st.s[i], vr() * 6.3, sc); }
function placeBunting(st, i) { setInst(st.im, i, 0, 0, -st.s[i]); }
function layoutScenery(ctx, s0) {
  const d = ctx.data; const w = WORLDS[ctx.params.world] || WORLDS['Sunny Park'];
  for (const [key, st] of Object.entries(d.strips)) {
    st.tints = w.tints;
    for (let i = 0; i < st.n; i += 1) {
      const lane = key === 'bunting' ? 22 + i * (SPAN / st.n) : (i + vr() * 0.8) * (SPAN / st.n);
      st.s[i] = s0 - 40 + lane; st.rnd[i] = vr(); st.place(st, i);
    }
    st.im.instanceMatrix.needsUpdate = true; if (st.im.instanceColor) st.im.instanceColor.needsUpdate = true;
  }
  const F = d.fans; // fans stand in little groups on both sidewalks
  for (let i = 0; i < F.n; i += 1) {
    const g = ((i >> 2) * 7) % 10; const side = g % 2 ? 1 : -1; const k = i % 4; // group order 0,7,4,1,8…: any crowdSize spreads out
    F.s[i] = s0 + 10 + g * (SPAN / 10) + (k - 1.5) * 0.9 + vr() * 0.3; F.x[i] = side * (WALK_X + (k % 2 ? 0.45 : -0.2) + vr() * 0.2); F.ph[i] = vr() * 6.3; F.sc[i] = 0.9 + vr() * 0.25;
  }
  F.body.instanceColor.needsUpdate = true; F.head.instanceColor.needsUpdate = true;
}
function recycleScenery(ctx, dt) {
  const d = ctx.data; const behind = d.dist - (ctx.state === 'intro' ? 60 : 14);
  for (const st of Object.values(d.strips)) {
    let dirty = false;
    for (let i = 0; i < st.n; i += 1) if (st.s[i] < behind) { st.s[i] += SPAN; st.rnd[i] = vr(); st.place(st, i); dirty = true; }
    if (dirty) { st.im.instanceMatrix.needsUpdate = true; if (st.im.instanceColor) st.im.instanceColor.needsUpdate = true; }
  }
  for (let i = 0; i < d.fans.n; i += 1) if (d.fans.s[i] < behind) d.fans.s[i] += SPAN;
  for (const c of d.clouds) { c.x += dt * 0.7; if (c.x > 70) c.x = -70; }
  // ground textures scroll with the distance run (tile lengths: grass 10 m, road 8 m, curb + sidewalk 2 m)
  d.street.position.z = d.dist % 8; d.tx.fence.offset.x = (d.dist / 2) % 1; // the street slides within one 8 m period
}

/* ============================================= ad funnel: the scripted boulder near-miss */
// AD mode, near-miss level only (ctx.ad.check is always false in GAME mode). At ~90 % of the distance a giant
// angry boulder crashes onto the road just behind the runner, the camera swings round to a look-back shot, and it
// rolls a bit faster than you can run: it flattens the runner just before the finish arch ("Only 30 m to go!").
// Its pace is re-solved every step so the hit lands when the runner reaches AD_CATCH of the goal; a stumble
// (hit → stun) lets it catch up sooner, exactly like a real chaser.
function startBoulder(ctx) {
  const d = ctx.data;
  d.adFail = true; d.adCam = 0;
  d.bossDist = d.dist - 9; d.bossX = 0; d.bossY = 13; d.bossVx = 0; d.bossVy = 0; d.bossV = 0; d.bossRoll = 0; d.dustT = 0;
  d.boulder.visible = true;
  for (const o of d.objs) o.dead = true; // the road clears: the chase is the whole show now
  ctx.ui.banner(ctx.t('boulder'), 1700); ctx.ui.toast(ctx.t('run'), { size: 'xl', color: '#ff5a5a', ms: 1300 });
  ctx.audio.sfx('boss', { pitch: 0.8 }); ctx.audio.sfx('whoosh', { pitch: 0.6 }); ctx.fx.flash('#ff2a2a', 0.2, 200);
  ctx.emit('boulder', { progress: Math.round((d.dist / d.goal) * 1000) / 1000 });
}

function updateBoulder(ctx, dt, runSpeed) {
  const d = ctx.data; const fx = ctx.fx; const reach = BOULDER_R + 0.3; // centre-to-runner gap at contact
  d.adCam += dt * 1.6;
  // 1. it drops in from above, then rolls
  if (d.bossY > BOULDER_R) {
    d.bossVy -= 40 * dt; d.bossY += d.bossVy * dt;
    if (d.bossY <= BOULDER_R) {
      d.bossY = BOULDER_R;
      const s = proj(ctx, 0, 0.2, d.dist - d.bossDist);
      fx.burst(s.x, s.y, { count: 30, colors: ['#d9d0c0', '#9a8a7c', '#ffffff'], speed: 380, size: 10, shape: 'square', lift: 120 });
      fx.ring(s.x, s.y, { color: '#ffffff', radius: 160, width: 10 }); fx.shake(16, 450); fx.haptic(40);
      ctx.audio.sfx('explosion', { pitch: 0.6 }); ctx.audio.sfx('thud');
    }
  }
  // 2. pace: close the remaining gap by the time the runner reaches AD_CATCH; after the hit it veers off the
  //    road on the side away from the look-back camera and slows down in the grass
  const gap = d.dist - d.bossDist;
  if (!d.caught) {
    const tLeft = Math.max(0.5, d.goal * AD_CATCH - d.dist) / Math.max(4, runSpeed);
    d.bossV = runSpeed + Math.max(0, gap - reach + 0.5) / Math.max(0.25, tLeft);
  } else { d.bossV *= Math.max(0, 1 - dt * 1.6); d.bossVx *= Math.max(0, 1 - dt * 0.6); }
  d.bossDist += d.bossV * dt; d.bossX += d.bossVx * dt; d.bossRoll += (d.bossV * dt) / BOULDER_R;
  if (!d.caught && d.bossY <= BOULDER_R && d.dist - d.bossDist <= reach) crushRunner(ctx);
  // 3. dust + a shake that grows as it closes in (no rumble bed)
  const rolling = d.bossY <= BOULDER_R && d.bossV > 1;
  d.dustT -= dt;
  if (rolling && d.dustT <= 0) {
    d.dustT = 0.07; const bz = d.dist - d.bossDist;
    for (let sx = -1; sx <= 1; sx += 2) { const s = proj(ctx, d.bossX + sx * BOULDER_R * 0.7, 0.2, bz + 0.5); fx.burst(s.x, s.y, { count: 3, colors: ['#e8dfd2', '#b9ab9b'], speed: 140, size: 9, lift: 70, life: 0.5 }); }
    if (!d.caught) fx.shake(3 + 7 * Math.max(0, 1 - bz / 9), 90);
  }
}

function crushRunner(ctx) {
  const d = ctx.data; const fx = ctx.fx;
  d.caught = true; d.bossVx = -0.8 * d.bossV;
  const s = proj(ctx, d.x, 0.6, 0);
  fx.burst(s.x, s.y, { count: 36, colors: ['#9a8a7c', '#e8dfd2', ctx.params.shirtColor, '#ffffff'], speed: 440, size: 10, shape: 'square' });
  fx.ring(s.x, s.y, { color: '#ff5a5a', radius: 150, width: 12 }); fx.shake(18, 520);
  ctx.audio.sfx('explosion', { pitch: 0.75 }); ctx.audio.sfx('crunch');
  d.lives = 0; // the HUD hearts empty with the hit
  ctx.ad.fail({ progress: d.dist / d.goal, toast: ctx.t('crushed'), nearText: ctx.t('ad.left', { n: Math.max(1, Math.ceil(d.goal - d.dist)) }), delay: 1400 });
}

/* ===================================================================== HUD */
// hearts, a coin pill and the race track (you, the rival — and the boulder while the trap runs); sent every
// 3rd step or when forced, the kernel only touches the DOM when something changed
function hud(ctx, force) {
  const d = ctx.data; const p = ctx.params; if (d.goal === undefined) return;
  d.hudN = (d.hudN || 0) + 1; if (!force && d.hudN % 3) return;
  ctx.ui.hearts(Math.max(0, d.lives ?? p.lives), p.lives);
  ctx.ui.counter('coins', d.coinCount || 0, { icon: 'coin', side: 'right' });
  if (ctx.state !== 'play') return;
  const dots = [{ id: 'rival', at: Math.min(1, (d.rivalDist || 0) / d.goal), color: p.rivalColor }, { id: 'me', at: Math.min(1, (d.dist || 0) / d.goal), color: p.shirtColor, me: true }];
  if (d.adFail) dots.splice(1, 0, { id: 'boulder', at: Math.max(0, d.bossDist / d.goal), color: '#ff3b3b' }); // ad near-miss: the boulder closing in
  ctx.ui.progress(Math.min(1, (d.dist || 0) / d.goal), { label: `${Math.min(d.goal, Math.floor(d.dist || 0))} m`, dots });
}

/* ============================================================ look & feel */
function applyLook(ctx) {
  const d = ctx.data; const p = ctx.params; if (!d.mats) return;
  const w = WORLDS[p.world] || WORLDS['Sunny Park'];
  // sky dome: horizon → zenith gradient with a warm glow toward the sun; the fog uses the horizon colour
  const pos = d.skyGeo.attributes.position.array; const col = d.skyGeo.attributes.color.array; const top = new Color(w.skyTop); const hor = new Color(w.skyHor); const glow = new Color(w.glow);
  for (let i = 0; i < pos.length / 3; i += 1) {
    v3.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).normalize();
    _c.copy(hor).lerp(top, Math.pow(clamp(v3.y / 0.75, 0, 1), 0.75)).lerp(glow, Math.pow(Math.max(0, v3.dot(SUN_DIR)), 8) * 0.8);
    col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b;
  }
  d.skyGeo.attributes.color.needsUpdate = true;
  d.scene.fog.color.set(w.skyHor); d.r.setClearColor(w.skyHor);
  d.hemi.color.set(w.hemiSky); d.hemi.groundColor.set(w.hemiGround); d.hemi.intensity = w.hemiI; d.sun.color.set(w.sun); d.sun.intensity = w.sunI;
  drawGround(d, w);
  const flags = { f0: w.flags[0], f1: w.flags[1], f2: w.flags[2], f3: w.flags[3], f4: w.flags[4] };
  const S = d.strips;
  paint(S.tree.im.geometry, { trunk: w.trunk, leaf: w.leaf, leaf2: w.leaf2 }); paint(S.pine.im.geometry, { trunk: w.trunk, leaf: w.leaf, leaf2: w.leaf2 });
  paint(S.house.im.geometry, { wall: w.wall, roof: w.roof, window: w.window });
  paint(S.bush.im.geometry, { bush: w.bush }); paint(S.bunting.im.geometry, flags); paint(d.hillsG, { hill: w.hill, hill2: w.hill2 });
  paint(d.archG, { archA: '#ff3d6e', archB: '#ffffff', ...flags });
  d.mats.cloud.color.set(w.cloud);
  for (const st of Object.values(S)) st.tints = w.tints;
  // characters
  const skin = '#ffd2b0';
  for (const g of d.hero.geos) paint(g, { shirt: p.shirtColor, pants: p.pantsColor, cap: p.capColor, pack: '#25c6b0', trim: '#ffffff', skin, hair: '#6b3b1f', shoe: '#ffffff', lace: p.capColor });
  for (const g of d.rival.geos) paint(g, { shirt: p.rivalColor, pants: '#2f2a4a', band: '#ffffff', trim: '#ffffff', skin: '#f1c29a', hair: '#1f1a2e', shoe: '#2f2a4a', lace: p.rivalColor });
  // obstacles + pickups
  paint(d.pools.coin.im.geometry, { gold: p.coinColor, gold2: ctx.math.shade(p.coinColor, 0.25) });
  paint(d.pools.crate.im.geometry, { wood: p.crateColor, wood2: ctx.math.shade(p.crateColor, -0.3) });
  d.mats.boulder.color.set(p.boulderColor);
}
