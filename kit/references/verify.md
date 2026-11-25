# Verification

`node tools/verify.mjs game/dist/index.html --seconds 20` opens the build in headless Chromium
(390×844 portrait, then 844×390 landscape) with `?test&seed=1` and writes `verify.json`,
`poster.png`, `shot-intro.png`, `shot-endcard.png`, `shot-landscape.png` next to the HTML.

| Check | Required | How to fix |
|---|---|---|
| size ≤ 5 MB | yes | Named three.js imports, compress/downscale images (≤ 512 px), mono low-bitrate audio. |
| kernel ready within 15 s | yes | `init` threw or hung → see `errors`; guard `resize` before `init` created the renderer. |
| params schema valid | yes | Every param needs label, group, type, def, apply; numeric min/max around def; enum options include def; colours `#rrggbb`. |
| ≥ 6 game params / ≥ 3 marketer | yes | Add meaningful tunables (see game-design.md §6). |
| auto-starts play in test mode | yes | Don't block `start`; intro auto-advances in `?test`. |
| renders frames (≥ 10 fps headless) | yes | Software WebGL is slow: pool objects, avoid per-frame allocations, lower geometry, no shadows. |
| bot interacts / score changes | warn | Implement `bot(ctx)` that collects rewards. |
| live param update | yes | `onParams` must not throw; read live params from `ctx.params` each frame. |
| restart resets the run | yes | `setup` must reset every run field in `ctx.data` (positions, arrays, timers, lives). |
| end card + gameEnd | yes | Use `ctx.end(...)` only; don't build your own end screen DOM. |
| ad mode near-miss card (SO CLOSE + CTA) | yes | The kernel's ad card must show after `ctx.ad.fail()`; don't hide `#pk-ui` or call `ctx.end` while it is pending. |
| game scripts an ad near-miss | warn | Call `ctx.ad.check(progress)` in update and `ctx.ad.fail()` (see ad-funnel.md). |
| no runtime / console errors | yes | Read the messages; `undefined` access in update/render is the usual cause. |
| no external network requests | yes | Remove URLs, fonts, CDNs, fetch() calls. |
| landscape loads | warn | Use `ctx.view` bounds; don't assume 390×844. |

## Ad funnel check
`node tools/ad-check.mjs game/dist/index.html [--level 3] [--seeds 1,2,3]` plays the scripted near-miss
level (`?test&adfail=3&level=3&seed=N`) and GAME mode (`?test&level=3`).

| Check | How to fix |
|---|---|
| seed N: end reason=ad-fail, near 0.80–0.97 (≥ 2 of 3 seeds) | `ad.check never fired` → the bot doesn't get to `adFailAt`: ease the level when `ctx.ad.forceFail` (fewer hazards, boss sized to the army) or improve the bot. `reason=win` → progress is not 0..1 or the win check runs while the failure is pending. |
| GAME mode clean | Only start the failure from `ctx.ad.check()`; never from `ctx.level` alone. |

It saves `ad-s<seed>-0.png` (trigger), `-1.png` (a moment later) and `-card.png`. The cause of the loss must be visible.

A PASS means the game is technically sound. It does not judge fun: look at `poster.png` and
the end card yourself and make sure hero, hazards and rewards read clearly at phone size.
