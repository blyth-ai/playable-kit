# Blyth Play Kernel — API contract (v0.4)

A game is one object passed to `createGame(def)`. The kernel owns layout, input, the fixed-step
loop, seeded randomness, audio (procedural SFX + styled music), the ad-grade UI (intro logo,
tutorial hand, HUD counters, progress track, toasts, star end card, near-miss bar, CTA), juice
(particles, floating text, rings, flash, shake, slow-mo, confetti), pixel sprites + pixel font,
params with skins, strings, levels, host messaging and test hooks. The game owns rules, world
and drawing. Lean on the kernel: it is what makes a game *feel* like a playable ad.

```js
import { createGame } from 'blyth-play-kernel';

createGame({
  renderer: '2d',            // '2d' → ctx.g is a CanvasRenderingContext2D in design units
                             // 'three' → create your own WebGLRenderer on ctx.canvas in init()
  config: {
    meta: { title, slug, version: 'v01', genre, dimension: '2d'|'3d', orientation: 'portrait'|'landscape'|'both', mode: 'GAME'|'AD', seed },
    params: { key: ParamSpec, ... },
    difficultyOverrides: { easy: { key: value }, hard: { key: value } },
    sharedDefaults: { uiSkin: 'frost', uiAccent: '#3dfcff', musicStyle: 'epic' }, // defaults for kernel params
    trailer: { key: value, autoNext: true }, // overrides used in ?trailer (video capture) — make it action-packed;
                              // autoNext: after a win with `next`, go to the next level 2.5 s later (autoNextMs)
    eventLimit: 200,          // optional: size of the window.__playable.events log (also ?events=N)
  },
  strings: { en: { 'title.hook': '...', ... } },   // English is the default language; add tr/de/… only if asked
  titleKey: 'title.name',    // intro LOGO text (2 lines: first half white, second half accent)
  taglineKey: 'title.tag',   // small pill under the logo ("RACE TO THE TOP")
  hintKey: 'hint.drag',      // fallback hint text
  tutorial: { gesture: 'drag-h', x: 195, y: 640, span: 70, labelKey: 'hint.drag' },
                             // animated hand on the intro + whenever the player idles (hintDelay)
  music: true,               // procedural music in the `musicStyle` param (false = none)
  hoverSteer: true,          // optional: a MOUSE hovering over the game counts as a held drag (no click needed on
                             // trackpads) — for drag-to-steer games (lanes, crowds, catchers). Never for hold-to-act games.
  passStartTap: false,       // optional: the touch/key that starts play is NOT passed to the game
                             // (default: passed — drag games keep the finger; tap-to-act games set false)

  init(ctx) {},              // once: create renderer, scene, pools, sprites, materials (may be async)
  resize(ctx) {},            // on every layout change (also before init → guard for missing renderer)
  setup(ctx) {},             // every run: reset ALL per-run fields in ctx.data (read ctx.level)
  start(ctx) {},             // when play begins (first input / autoplay)
  update(ctx, dt) {},        // fixed 1/60 s steps while state === 'play' (dt shrinks during slow-mo)
  render(ctx, alpha) {},     // every frame (all states). In 2D the transform is already set.
  idle(ctx, dt) {},          // optional: animate the scene on the intro / end screens
  onParams(ctx, changedKeys) {}, // a live param changed → re-apply colours, speeds, camera
  onTimeUp(ctx) {},          // optional; default ends with reason 'time'
  onEnd(ctx, { win, score, stars }) {},
  bot(ctx) { return {}; },   // autoplay input in ?test / ?trailer (see below)
});
```

## ParamSpec
```js
{ label: 'Run speed', group: 'Player', sub: 'Movement', type: 'float', def: 11, min: 6, max: 22, step: 0.5,
  unit: 'u/s', apply: 'live' | 'restart', marketer: true, dir: 'high' | 'low' }
```
- `type`: `int` | `float` | `enum` (needs `options`) | `color` (`#rrggbb`) | `text` (`maxLen`) | `bool`.
- `apply: 'live'` → `onParams` is called; `'restart'` → the run restarts with the new value.
- `marketer: true` → shown in the Blyth editor's "Marketer" tab. Use human labels; groups:
  `Player`, `Enemies`, `Economy`, `Difficulty`, `Timing`, `Physics`, `Camera` (subs `Position`,
  `Motion`, `Moments`), `Colors` (subs `Background colors`, `Sky colors`, `Interface`), `Characters`,
  `Animation`, `End card`, `Branding`. Aim for 20–40 params: every colour, speed, count, camera
  offset and reward amount a marketer could want to A/B test.
- Palettes: an `enum` param (e.g. `background: ['Golden Hour','Polar Night',…]`) that switches a set
  of colours at once is a great marketer control.
- **Kernel shared params (don't redefine):** `difficulty`, `maxPlayTime`, `hintDelay`, `ctaText`,
  `storeUrlIos`, `storeUrlAndroid`, `endTitle`, `endSub`, `uiSkin` (candy | frost | classic |
  parchment | neon), `uiAccent`, `uiPanel`, `cameraShake` (scales `ctx.fx.shake`), `musicStyle`
  (upbeat | chill | epic | chiptune | off), `sfxVolume`, `musicVolume`, `language` (defaults to `en`; `auto` follows the device),
  and the **Ad** group: `adMode` (CTA end card; on by default when `meta.mode === 'AD'`), `adFailLevel`
  (0 = off; scripted near-miss from this level on), `adFailAt` (0.6–0.98, default 0.9), `adGateLevel`
  (0 = off; levels after this one are locked), `maxRetries` (Try-again presses before only the CTA remains).
  Change their defaults with `config.sharedDefaults` (keep the Ad group off by default — it is the marketer's call).
- Read values from `ctx.params.key` every frame (never cache them at setup if they are live).
- Invalid schemas are reported in `window.__playable.schemaErrors` and fail verification.

## ctx
| Member | Meaning |
|---|---|
| `ctx.canvas` | The full-screen game canvas. |
| `ctx.g` | 2D context (renderer `'2d'` only). Draw in **design units**: 390×844 portrait / 844×390 landscape. |
| `ctx.view` | `{ w, h, dpr, designW, designH, scale, left, top, right, bottom, portrait }` + `toScreen(x,y)`, `toDesign(sx,sy)`, `ndcToDesign(nx,ny)`. `left..right`/`top..bottom` are the visible bounds in design units — paint backgrounds over them. |
| `ctx.input` | See Input. |
| `ctx.params` | Current param values. |
| `ctx.data` | Your game's state object. Lives for the whole game; reset run fields in `setup`. |
| `ctx.rng()` | Seeded random 0..1. Also `range(a,b)`, `int(a,b)`, `pick(arr)`, `chance(p)`, `sign()`, `shuffle(arr)`. |
| `ctx.time` / `ctx.level` | Seconds of play in this run / current level (starts at 1). |
| `ctx.score` | Get/set; the HUD left pill shows it and bumps when it grows. |
| `ctx.state` | `'loading' | 'intro' | 'play' | 'end'`. |
| `ctx.t(key, vars)` | Localised string; `{n}` placeholders from `vars`. |
| `ctx.ease` / `ctx.math` | `ease.outBack/outElastic/outBounce/outCubic/inOutSine…`; `math.damp(a,b,λ,dt)`, `lerp`, `clamp`, `approach`, `wrap`, `mixColor`, `shade(hex, ±amt)`, `hexToRgb`. |
| `ctx.font` | CSS font stack of the embedded display font (Baloo 2 ExtraBold, full Turkish) for canvas text. |
| `ctx.emit(type, data)` | Record a gameplay event (shows up in verification). |
| `ctx.end(result)` | Finish the run → end card. See End card. |
| `ctx.nextLevel()` / `ctx.restart()` | Next level (ctx.level+1, new run; returns `false` when the ad gate locks it) / same level again. |
| `ctx.ad` | Ad funnel: `on`, `forceFail` (this level must end in the scripted near-miss), `failAt`, `fired`, `gated`, `retriesLeft`, `check(progress)` → `true` once when the near-miss should start, `fail(opts)` → standard dramatic loss. See "Ad funnel". |
| `ctx.overlay` | 2D context of a canvas above the game canvas (below fx and DOM UI). Created on first use, cleared every frame and set to design units before `render` — for joysticks, cards and boss bars on WebGL games. |
| `ctx.clock` | `pause()` / `resume()` / `paused`: stops `ctx.time` and the `maxPlayTime` cap (e.g. while an upgrade card is open). Resets on every run. |
| `ctx.autoplay` | True in `?test` / `?trailer`. |
| `ctx.softwareGL` | True when WebGL is CPU-emulated (SwiftShader, headless capture, GPU-less devices). 3D games: then skip `antialias`, anisotropy and big repeat textures; keep pixel ratio ≤ 1. |

### Audio
- `ctx.audio.sfx(name, { pitch, vol })` — `tap click coin coins gem jump land hit bad pop whoosh swoosh
  powerup gate combo unlock tick step slice splash explosion boss cheer win lose` and (v0.4) `bonk boing chime ding thud
  zap laser shoot punch crunch sparkle spring honk whistle score drum`. Pick sounds that fit the game's world; vary them. Raise `pitch`
  with a combo counter (1, 1.12, 1.25…) — instantly addictive. `vol` 0..2 scales one call (rapid fire: 0.2–0.5).
- `ctx.audio.loop(name, { vol, pitch })` → handle `{ set({ vol, pitch }), stop(fadeMs), playing }` for continuous
  sounds: `spray hiss engine hum` (soft, low-passed, on a bus that always sits under the music). `wind` and `rumble` are
  silent: players found fan / hair-dryer / rumble beds tiring, so never build ambience or speed feel from noise — use the
  music, short sfx (`swoosh` on a boost) and visuals. Use a loop only while the player acts (spraying, scrubbing, an engine
  they control) and keep `vol` ≤ 0.5. The kernel stops all loops on game end and restart (`ctx.audio.stopLoops()`).
- Music plays automatically in the `musicStyle` param: `upbeat chill epic chiptune funky tropical spooky heroic racing
  carnival dreamy arcade off`. Each game gets its own melody (generated from `meta.slug`), so pick the style that fits the
  theme in `config.sharedDefaults.musicStyle` — don't default every game to `upbeat`. Defaults: sfx 60 %, music 25 %; keep them.
  `ctx.audio.play(key, {vol, rate, loop})` plays an inlined sound.

### UI (`ctx.ui`) — all DOM, crisp, skinned by `uiSkin`/`uiAccent`/`uiPanel`
| Call | Use |
|---|---|
| `counter(id, value, { icon, side: 'left'|'right', color, bump })` | HUD pill with an icon. Icons: `coin heart gem star clock skull crowd flag bolt sword egg trophy pin`. `null` removes. Bumps on change (`bump: false` for timers); passing a different `icon` swaps it (leaderboards). |
| `hearts(current, max)` | Heart row under the score; shakes when one is lost. |
| `progress(0..1, { label, dots: [{ id, at, color, me }] })` | Top track with a finish flag; dots show racers / the boss. `null` hides. |
| `objective(text)` | Short goal pill under the HUD ("Drag to lead your legion"); it moves down by itself if a side pill would overlap it. Change the text as the goal changes. |
| `toast(text, { color, size: 'm'|'xl', ms })` | Big pop-in callout: "PERFECT!", "x2!", "BOSS!", "LEVEL 2". |
| `banner(text, ms)` | Accent banner near the top. |
| `hand({ x, y, gesture, span, label | labelKey })` / `hideHand()` | Tutorial hand. Gestures: `tap hold drag-h drag-v swipe-up swipe-left swipe-right circle`. Prefer `def.tutorial` (shown on the intro and on idle automatically); it is read each time it is shown, so update `def.tutorial.x/y` in `resize` (orientation) or when the next target changes (pull-the-pin). |
| `hint(text)` / `hideHint()` | Text hint (used when there is no `def.tutorial`). |
| `setScore(v)`, `hideScore()`, `setRight(text)`, `hideHud()` | Classic HUD pills. |

### Juice (`ctx.fx`) — drawn on an overlay above the game, works for 2D and 3D
Coordinates are **design units** (pass `{ space: 'screen' }` for CSS pixels; for 3D use
`ctx.view.ndcToDesign(v.x, v.y)` after `vector.project(camera)`).
| Call | Use |
|---|---|
| `burst(x, y, { count, colors, speed, size, life, gravity, shape: circle|square|star|spark|confetti, spread, angle, lift })` | Particles: pickups, hits, explosions, dust. |
| `float(text, x, y, { color, size, rise, life })` | "+10", "x2", "-5" rising text. |
| `ring(x, y, { color, radius, width, life })` | Shockwave on impacts / gate passes. |
| `flash(color, alpha, ms)` | Screen flash (hit = red, power-up = white). |
| `shake(intensity, ms)` | Camera shake (scaled by the `cameraShake` param); shakes the whole game canvas. 3D games may also read `ctx.fx.offset`. |
| `slowmo(factor, ms)` / `freeze(ms)` | Dramatic slow motion on the final hit / hit-stop on big impacts. |
| `confetti(count)` | Celebration (the kernel already fires it on a win). |
| `haptic(ms)` | Vibration where supported (silently skipped in autoplay and before the first tap). |

### Sprites & drawing (`ctx.sprites`, `ctx.draw`) — free, procedural art
- `sprites.pixel(rows, palette, { scale })` → canvas from strings, e.g.
  `['..aa..', '.abba.', 'abbbba']` with `{ a: '#1c1a2e', b: '#ffd23f' }` (`.` = transparent).
  `sprites.frames(listOfRows, palette)` for animations, `sprites.outline(c, color)`,
  `sprites.tint(c, color)` (hit flash), `sprites.recolor(c, { '#from': '#to' })` (team colours),
  `sprites.canvas(w, h, g => …)` for procedural textures (also `new CanvasTexture(canvas)` in 3D).
- `draw.text(g, str, x, y, { size, color, stroke, align })` ad-style outlined text;
  `draw.pixelText(g, str, x, y, { size, color, outline })` crisp 5×7 pixel font (Turkish, + - × ÷ / : ok);
  `draw.roundRect(g, x, y, w, h, r, fill, stroke)`, `draw.shadow(g, x, y, rx, ry)`,
  `draw.sprite(g, canvas, x, y, { scale, flip, rot, ax, ay })` (pixel-perfect, bottom-centre anchor).

## End card — `ctx.end(result)`
`{ win, title?, sub?, score?, stars?: 0..3, progress?: 0..1, next?: bool, reason?, hideScore? }`
- `stars` animates 3 stars (give 1–3 for a win based on performance, e.g. army size / time / no hits).
- `progress` on a **loss** shows "SO CLOSE! 87%" with a filling bar — the curiosity hook that makes
  people retry or install. Always pass it when you can measure progress.
- `next: true` on a win shows NEXT LEVEL (→ `ctx.level + 1`). Build 2–3 levels that escalate.
- `nearText` on a loss adds a short line under the bar ("Only 3 more!").
- **Last level won** (`win: true` without `next`): the kernel shows "ALL LEVELS CLEAR! — Download the full game to keep
  playing!" with the CTA (`ctaText`, default "DOWNLOAD & PLAY") and a "Play again" button that restarts from level 1.
  Pass `final: false` to opt out. The host gets `playable:cta` when the CTA is pressed.
- `adMode` (or `meta.mode: 'AD'`, or a store URL param) shows the pulsing green CTA (`ctaText`).
- The kernel plays win/lose sounds, confetti on a win and a shake on a loss.
- **Ad mode end cards** (`adMode` on):
  - Loss → "SO CLOSE!" (for `reason: 'ad-fail'` or progress ≥ 50%), a big counting bar, `endSub` (default
    "Download to finish the level!"), the CTA as the main button and a small "Try again" that disappears after `maxRetries`.
  - Win → stars + NEXT LEVEL first, the CTA under it. When `adGateLevel` is reached: "🔒 LEVEL N LOCKED —
    Continue in the app" with the CTA instead of NEXT LEVEL.

## Ad funnel — `ctx.ad` (HANDOFF §4, `references/ad-funnel.md`)
L1 teach-and-win, L2 harder win, L3 "HARD LEVEL!" trap. When the marketer sets `adFailLevel`, that level
must end in a visible, dramatic near-miss at about `adFailAt` progress. In GAME mode nothing changes.
```js
update(ctx, dt) {
  const progress = d.bossDamage / d.bossHp;            // 0..1, whatever "how close" means here
  if (ctx.ad.check(progress)) startDramaticFail(ctx);  // boss enrage / last pin wrong / rival boost / timer
}
function startDramaticFail(ctx) {
  // show WHY it fails (boss wipes the army, bomb rain, rival boost…), stop progress from growing, then:
  ctx.ad.fail({ progress: current(), nearText: 'Only 3 more!' }); // slow-mo + red flash + "NOOO!" → SO CLOSE card
}
```
- `check()` is true once per run; while `fail()` is pending other `ctx.end()` calls are ignored.
- `ctx.ad.forceFail` may also ease the road of that level (fewer hazards) so players really arrive at ~90%.

## Input (`ctx.input`) — refreshed every fixed step
- `down`, `x`, `y` (design units), `startX`, `startY` (where the current touch began — virtual joysticks), `dx`, `dy` (drag delta this step), `released` (finger lifted this step)
- `taps: [{x,y}]`, `swipes: ['left'|'right'|'up'|'down']`
- `pointerType` (`'mouse' | 'touch' | 'pen'`), `hover: { active, x, y }` (mouse position without a click)
- `stick({ x, y, radius = 70, mouseRadius = 120, dead = 0.12 })` → `{ x, y, mag, mode, active }` (-1..1, y down): the movement
  stick for free-moving heroes. Keys win; touch = floating joystick from where the finger went down; **mouse/trackpad = the hero
  heads toward the cursor without clicking** — pass the hero's on-screen design position as `x, y`. Mouse mode is forgiving by
  design: the hero stops while the cursor is within ~30 px of it (and restarts ~12 px further out), moves at ≥ 35 % speed as
  soon as it moves, eases to full speed by `max(mouseRadius, 130)` px, and the heading is smoothed. Pass the hero's body centre
  (not its feet) so "cursor on the hero = stop" feels right. Draw the joystick ring only when `mode === 'touch'`.
- `keys: Set<code>` held, `pressed: Set<code>` this step, `axisX`, `axisY` (arrows/WASD), `action` (tap/Space/Enter)
- `idle` seconds since last input (the kernel shows the tutorial hand after `hintDelay`)

**Desktop controls matter:** many players use a mouse or a trackpad. Drag-to-steer games set `def.hoverSteer = true`;
free-moving games use `ctx.input.stick()`; every game also works with arrows/WASD + Space.

The intro starts play on the first touch / key (passed to the game unless `def.passStartTap === false`).
Audio unlocks on that gesture. During `fx.freeze` the game is not updated and one-shot input (taps,
swipes, drag deltas, release) is kept until the freeze ends; the bot is not called meanwhile.

## bot(ctx) → autoplay input (only in ?test / ?trailer)
Return any of: `{ axisX, axisY, tap: {x,y}, swipe: 'left', action: true, pointer: { down, x, y, startX, startY, released }, drag: { dx, dy }, released: true }`.
`pointer.startX/startY` place the touch origin (virtual joysticks); `released` lifts the finger this step.
Keep it competent: avoid hazards, collect rewards, reach the goal so posters and trailers look good.

## Host protocol (Blyth editor, ad networks)
- Kernel → parent: `playable:ready {commands:true, meta}`, `playable:schema {params, values}`,
  `playable:state {state}`, `playable:gameEnd {win, score}`, `playable:cta`.
- Parent → kernel: `playable:update {params:{key:value}}`, `playable:command {name, value}` with
  `pause | resume | mute | unmute | restart | volume` (`value` 0..1, the host's volume slider; multiplies every bus).
  `snapshot` (`value` = longest side in px, default 960) answers `playable:snapshot {image}`: a JPEG data URL of the
  game canvas, overlay and effects without the DOM HUD (Blyth makes the poster of a build that came without one).
  Kernels that support it send `snapshot: true` in `playable:ready`.
- Baked values: an export may set `window.__PLAYABLE_VALUES__ = {key: value}` before the game script;
  the kernel applies them over defaults and difficulty presets. Never read params any other way.
- MRAID: the kernel waits for `mraid` ready/viewable. CTA calls `mraid.open(store URL)`,
  `FbPlayableAd.onCTAClick`, `ExitApi.exit` or `install()` when present.

## 3D (three.js) checklist
- `init`: `new WebGLRenderer({ canvas: ctx.canvas, antialias: true })`, `outputColorSpace = SRGBColorSpace`,
  `toneMapping = ACESFilmicToneMapping`, scene fog matching the sky, hemisphere + directional light,
  pools of meshes created once. Toy look: `MeshToonMaterial` or `MeshStandardMaterial` with
  `flatShading`, rounded primitives (capsule, sphere, rounded boxes), bright palette, soft blob shadows
  (a dark transparent circle under each character) instead of real shadows.
- Characters from primitives: body capsule + head sphere + eyes + limbs in a `Group`; animate limbs
  with `sin(time * speed)` for running, squash/stretch on land.
- `resize`: `setPixelRatio(ctx.view.dpr)`, `setSize(ctx.view.w, ctx.view.h, false)`, update camera aspect/fov
  (wider FOV in portrait).
- `render`: position meshes from `ctx.data`, camera follow with `math.damp`, intro pull-in and payoff
  punch-in "camera moments", `renderer.render(scene, camera)`.
- Use `InstancedMesh` for > 50 identical objects. No real-time shadows by default.
- GLB models (Blyth art): `new GLTFLoader().parse(ctx.assets.arrayBuffer('hero'), '', onLoad)` in `init`.

## Test hooks
`window.__playable` exposes `ready, state, score, time, level, frames, fps, errors, events, schema,
schemaErrors, params, restart(), setParams(obj), command(name), forceEnd(win), start(), nextLevel(), ad`.
URL flags: `?test` (autoplay + deterministic seed), `?trailer` (autoplay for video capture),
`?seed=N`, `?lang=tr`, `?debug` (fps overlay), `?level=N` (start at level N), `?ad` (ad mode),
`?adfail=N` (ad mode + scripted near-miss from level N), `?events=N` (event log size),
`?speed=N` (autoplay only: N× simulation speed for fast automated checks).
Check the funnel: `?test&adfail=3&level=3` must end with an `end` event whose `reason` is `ad-fail`.
