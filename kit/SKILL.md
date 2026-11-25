---
name: blyth-playable
description: Build a playable HTML5 mobile game (and playable-ad-ready build) from a short prompt using the Blyth Play Kernel. Use when asked to make, build, recreate or change a mobile mini game, hyper-casual game, playable ad, runner, shooter, puzzle, pull-the-pin, eat-and-grow, crowd, racing, strategy, maze, simulation, arcade, party, action or adventure game. Produces one self-contained index.html under 5 MB with tunable params, verified in headless Chromium.
---

# Blyth Playable

You turn a game idea into ONE self-contained `index.html` (≤ 5 MB, no network) that runs on
phones and desktops, exposes tunable parameters for marketers, and passes the automated
verification. You work in three phases (plus a fourth, Publish to Explore, inside the Blyth repo).
Each phase closes before the next one starts.

**This skill's folder** (the directory containing this SKILL.md) holds:

| Path | What |
|---|---|
| `references/kernel-api.md` | The kernel contract. **Read fully before writing code.** |
| `references/game-design.md` | How to plan a game that is fun in the first 5 seconds. Read in PLAN. |
| `references/genres.md` | Core loop, controls, camera, params and bot strategy per genre. Read the section for your genre. |
| `references/verify.md` | What verification checks and how to fix failures. |
| `references/ad-funnel.md` | The L1 → L2 → L3 level skeleton, the scripted near-miss (`ctx.ad`) per genre, the ad end cards. Read in PLAN. |
| `references/art-direction.md` | The toy-like "expensive" look: palette, light, characters, camera moments, poster. Read in PLAN. |
| `references/showcase.md` | Which finished Blyth game to study for your genre, and the HUD / bot / juice patterns worth copying. |
| `kernel/kernel.js` | The runtime. **Never edit it.** |
| `tools/build.mjs`, `tools/verify.mjs`, `tools/ad-check.mjs` | Build to one HTML; verify in headless Chromium; check the ad near-miss. |
| `examples/runner-3d/main.js` | Reference 3D game (three.js, lanes, pools, bot). |
| `examples/catcher-2d/main.js` | Reference 2D game (Canvas 2D, drag control, bot). |
| `package.json` | Pinned build deps (esbuild, three). |

## Phase 1 — PLAN (no game code yet)

1. Read `references/game-design.md`, your genre in `references/genres.md`, `references/ad-funnel.md`,
   `references/art-direction.md` and `references/kernel-api.md`. Skim the game `references/showcase.md` names for your genre.
2. Decide in your reasoning: experience formula, core loop, controls (touch AND keyboard),
   win and lose conditions, the 3 levels (L1 teach-and-win, L2 harder win, L3 "HARD LEVEL!" trap),
   the near-miss (what "progress" means and what visibly goes wrong at ~90 %), 2D or 3D, orientation,
   palette (main, accent, neutral, sky/ground) and the poster moment.
3. Write **`design/plan.json`** (the only planning file). Shape:
   ```json
   { "title": "", "slug": "", "genre": "runner", "dimension": "3d", "orientation": "portrait",
     "experience": "The player feels ___ because the game constantly ___.",
     "coreLoop": "", "controls": { "touch": "", "keyboard": "" },
     "win": "", "lose": "", "difficulty": "",
     "levels": [ { "goal": "", "duration": "20 s", "twist": "" }, { "goal": "", "duration": "25 s", "twist": "" }, { "goal": "", "duration": "25 s", "twist": "HARD LEVEL!" } ],
     "nearMiss": { "level": 3, "progress": "what 0..1 measures", "how": "what visibly goes wrong at ~90 %" },
     "posterMoment": "",
     "params": [ { "key": "", "label": "", "group": "", "type": "float", "def": 0, "min": 0, "max": 1, "apply": "live", "marketer": true } ],
     "strings": ["title.hook", "hint.x"], "palette": { "role": "#rrggbb" },
     "assets": [] }
   ```
   `assets` stays empty in graybox builds (primitives + procedural sound). If reference images
   were uploaded to `/mnt/session/uploads/`, list the ones you will use as sprites.

## Phase 2 — BUILD

Pick the working folder once:
- Claude Managed Agents / cloud sandbox (`/mnt/session` exists): `LAB=/workspace/lab`.
- Anywhere else (Claude Code, Claude Desktop): `LAB=./playable-work/<slug>` inside the current project.

Set up once (one shell call):
```bash
SK="<this skill folder>"; LAB="<working folder>"; mkdir -p "$LAB" && cd "$LAB" \
 && cp -r "$SK/kernel" "$SK/tools" "$SK/package.json" . && cp -r "$SK/examples" ./examples \
 && npm install --silent --no-audit --no-fund && mkdir -p game design
```
No skill folder but the **Blyth connector** is connected? Read the kit with `get_playable_kit` (or the
`blyth://playable/…` resources) and write the files into the working folder, then `npm install`.
Verification needs Chromium: `npx playwright install chromium` once.

Then write `game/main.js` **once, complete**, starting from the closest example's structure.
Optional sprites/sounds go in `game/assets/img|snd|models/` and are inlined by the build.

Hard rules:
- Import the kernel as `import { createGame } from 'blyth-play-kernel'`. For 3D use **named**
  imports from `three` (tree-shaking keeps the file small).
- Randomness only through `ctx.rng`; time only through `dt` / `ctx.time`. Never `Math.random`, `Date.now`.
- No network, CDN, fonts or external URLs. Everything is inside the HTML.
- Touch AND keyboard (`event.code` names like `ArrowLeft`, `Space`). One-thumb play on phones.
- **Params:** ≥ 8 game params, ≥ 5 with `marketer: true`, spread across groups (Player, Enemies,
  Economy, Difficulty, Timing, Colors, Camera). Every colour the game draws is a param. Every
  param must visibly change the game. Live params are applied in `onParams`.
- **Strings:** every visible word comes from `strings.en` (games open in English by default). Add other languages (e.g. `tr`) only when the user asks; the `language` param then lets the marketer switch.
- The game is winnable and losable and calls `ctx.end({ win })` well inside `maxPlayTime`.
- Implement `bot(ctx)` so `?test` autoplay can play: it must score and survive for a while, and in
  `?trailer` win L1 at least (set `config.trailer.autoNext: true` so the trailer rolls into the next level).
- **Ad funnel:** 3 levels; `ctx.ui.banner(ctx.t('ui.hard'), 1600)` when L3 starts; in update call
  `ctx.ad.check(progress)` and on `true` stage a visible, genre-fitting failure, stop progress, then
  `ctx.ad.fail({ progress, nearText })` (see `references/ad-funnel.md`). Nothing changes in GAME mode.
- Feedback on every action: sound (`ctx.audio.sfx`), motion, banner or particles.
- Performance: object pools, no allocation inside `update`, instancing or pooling for many objects,
  no shadows/post-processing by default, low-poly primitives.

## Phase 3 — VERIFY and DELIVER

```bash
cd "$LAB" && node tools/build.mjs game && node tools/verify.mjs game/dist/index.html --seconds 20 \
  && node tools/ad-check.mjs game/dist/index.html
```
- Fix every `FAIL` and rebuild (`AD-CHECK: FAIL` too: the near-miss must fire in ≥ 2 of 3 seeds at 80–97 %). At most **3** fix rounds; if still failing, deliver anyway and say
  exactly which check fails and why.
- Look at `game/dist/poster.png`, `shot-endcard.png` and one `ad-s<seed>-0.png` once to judge readability.
- Quality list (fix what is missing before you deliver):
  - a satisfying moment in the first 3 seconds (burst, coins, growth on the first touch);
  - L1 easy win with 3 stars, L2 harder win, L3 starts with the "HARD LEVEL!" banner;
  - AD mode: `ctx.ad.check` drives a near-miss the player can *see* (`?trailer&adfail=3` plays the funnel);
  - the poster shows the most exciting moment (big crowd, boss, near-miss), not the intro;
  - the `?trailer` video shows a win or an "almost" within its first 8 seconds;
  - every visible word is English and comes from `strings.en`.
- Deliver:
  - **Blyth MCP connected** (`publish_playable` exists), then give the user the editor link:
    - Through the connector (claude.ai, Claude Desktop, any HTTP connection): `publish_playable { title, genre,
      prompt, game_js: <the contents of game/main.js>, assets: { img, snd, models }, verify: <verify.json> }`.
      Blyth builds the same page as `tools/build.mjs` on the server in under a second. Never send the built
      `index.html` as `html`: it is 5–30× larger than main.js and takes many minutes to send. No shell at all?
      Write main.js straight into `game_js`; build errors come back with line numbers. A later small fix to that
      game: `publish_playable { playable_id, title, game_js_edits: [{ old, new }] }` (exact snippets of the stored
      main.js) instead of the whole file. Images are shrunk to ≤ 512 px (sprites) / ≤ 1024 px automatically.
    - Local stdio server (it accepts `dist_dir`): `publish_playable { title, genre, prompt,
      dist_dir: "<LAB>/game/dist", plan_path: "<LAB>/design/plan.json" }`.
  - **Managed Agents** (one shell call):
    ```bash
    mkdir -p /mnt/session/outputs && cp game/dist/index.html game/dist/poster.png game/dist/verify.json \
      game/main.js design/plan.json /mnt/session/outputs/
    ```
    and write `/mnt/session/outputs/summary.md`: title, one-paragraph pitch, controls, win/lose,
    the marketer params, verify result, known issues.
  - Otherwise: tell the user where `game/dist/index.html` is (it opens in any browser).
- Final chat reply: 3–5 plain sentences for a non-technical user. No file paths, no tooling words.

## Phase 4 — PUBLISH TO EXPLORE (only inside the Blyth repo, `~/Desktop/blythtr`)
Explore cards live in `public/playable-presets/<slug>/` and `src/lib/playable-presets.ts`.
1. Poster and preview (pick `--at` so the poster lands on the most exciting second):
   ```bash
   cd playable-lab && node tools/capture-preset.mjs showcase/<slug>/dist/index.html ../public/playable-presets/<slug> --seconds 8 --at <s>
   ```
   This writes `game.html`, `poster.jpg`, `poster-portrait.jpg` and `preview.webm`. Look at both posters.
2. `showcase/<slug>/preset.json`: `{ "title", "slug", "category", "game_type", "dimension", "tagline", "prompt" }`.
   `prompt` is a rich 90–140-word English prompt a user could paste to recreate the game; `tagline` is short, sentence case.
3. Add an entry to `PLAYABLE_PRESETS` in `src/lib/playable-presets.ts` (before `lane-dash`):
   ```ts
   { slug: 'sky-hop', title: 'Sky Hop', category: 'adventure', gameType: 'adventure', dimension: '2d', priority: 18,
     tagline: 'Bounce to the stars', prompt: '<preset.json prompt>', files: files('sky-hop') },
   ```
   `category` ∈ shooters | runners | adventure | puzzles | strategy | maze | simulation | action | crowd |
   racing | party | pull-the-pin | eat-grow | arcade. A smaller `priority` shows first.
4. `npx tsc --noEmit` and `npx eslint src/lib/playable-presets.ts`, then open `/playable` and try the card,
   the viewer and Customize (the Ad group must be there).
5. When the kernel changes, rebuild every game and copy `showcase/<slug>/dist/index.html` to
   `public/playable-presets/<slug>/game.html` (the HTML carries the kernel).

## Art and sound with Blyth (optional, spends the user's credits)
Shapes, colours, pixel sprites drawn in code and the kernel's procedural sound cost nothing and are the
default. Use Blyth models only when the user wants real art, real sound, a brand look or 3D characters.
You pick the models (the user does not have to); you never spend credits without telling the user first.

1. **Plan the smallest set that makes the game look finished**: the hero, one or two enemies, one pickup,
   one background; three to five sound effects (the main action, hit, pickup, win) and one music loop.
2. **Price it**: `get_account` (balance) and `estimate_cost` with that list. Then send one short message with
   two or three options and wait for the answer, for example:
   - *Free*: shapes and the kernel's sound, 0 credits.
   - *Blyth art and sound*: for example 5 images, 4 sound effects and 1 music loop, N credits.
   - *With a 3D hero*: the same plus a rigged, animated 3D character, N credits.
   Use the numbers estimate_cost returns, never guesses, and show the balance. A rigged 3D character costs
   about as much as a dozen sprites, so offer it only when 3D matters to the game.
   If the user already chose (for example "use Blyth art, up to 60 credits"), stay inside that and don't ask.
3. **Models** (`list_models { kind: "guide" }` marks which are on; take the next pick when one is off):
   - 2D sprites: `generate_image` with `gpt-image-2.5-flare`, `settings: { background: "transparent" }`, 1:1,
     one centered subject, no text, no ground shadow.
   - Backgrounds: `nano-banana-2.1` (or `seedream-v5-lite`), 9:16 portrait / 16:9 landscape, calm play area.
   - Seamless tiles: `ideogram-v4-tiling`. UI icons and logos: `recraft-v4` / `recraft-v4-vector` (SVG).
   - Same character, new pose or colour: `nano-banana-2.1-edit` with the first sprite as reference.
   - 3D characters only when asked (the most expensive asset): a front-view A-pose reference image, then
     `generate_3d_model` with `meshy-v7-image-to-3d`, `rig: true`, an animation, `options: { face_limit: 6000 }`.
     3D props: `tripo-h31-text-to-3d` with `options: { face_limit: 3000 }`.
   - Sound effects: `generate_sound_effect` (Stable Audio, cheap). One sound per prompt, 0.5–3 s, end the
     prompt with "isolated, no music, no voice".
   - Music: `generate_music`, one instrumental loop, 20–30 s, mood + tempo + instruments + "no vocals".
     Then set `musicStyle: 'off'` and play it with `ctx.audio.play('music', { loop: true, vol: 0.35 })`.
4. Pass `max_credits` on every image, start the jobs together and tell the user how many credits you used. Getting the
   files into the game: locally, `save_asset` / `save_to` into `game/assets/img|snd|models/`; through the Claude
   connector, don't download or paste anything: pass the image/GLB URLs and the `audio_asset_id`s to
   `publish_playable` as `assets: { img, snd, models }` (by the name the game uses) and Blyth embeds them.
   Paid calls are retry-safe: if one times out or comes back `pending`, poll `get_job` / `get_sound` or check
   `recent_jobs`; never generate the same asset again just because the answer was slow. Keep each image ≤ 512 px,
   each model ≤ 1.5 MB, each sound short (mono, ≤ 128 kbps); the whole build must stay under 5 MB.
5. Mix: sound effects around 60 %, music around 25–35 %. The game must still work with sound off.

## Turn economy
Write each file once, complete. Batch shell commands. Don't re-read files you just wrote.
Don't edit `kernel/` or `tools/`; if you find a kernel bug, work around it and mention it in summary.md.
