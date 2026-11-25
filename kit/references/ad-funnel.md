# The ad funnel and the scripted near-miss

Real playable ads all follow the same shape. The player gets a taste of winning. Then they *almost*
lose, and the end card sends them to the store to finish the level. Build this into every game as a
**parameter-driven system**:
- In Blyth Explore (GAME mode) the player can win everything.
- In an ad export (AD mode) the marketer can make a chosen level end in a dramatic near-miss.

## 1. Level skeleton (every game follows it)

| Beat | Time | What happens |
|---|---|---|
| Hook | 0–3 s | Logo, tutorial hand, and something satisfying on the very first touch (burst, coins, growth). |
| L1 — teach and win | 15–25 s | One mechanic, easy. Always winnable; 3 stars, confetti, NEXT LEVEL. |
| L2 — escalation | 20–30 s | A new obstacle or rival. Hard but winnable. |
| L3 — the trap ("Can you beat it?") | 20–30 s | A "HARD LEVEL!" banner (`ctx.ui.banner(ctx.t('ui.hard'), 1600)`). In AD mode this is the **scripted near-miss**: the player reaches 85–95 %, then loses dramatically at the last moment (slow-mo, red flash). |
| End card | — | "SO CLOSE! 92 %" bar fills, a line like "Only 3 more!", a big pulsing CTA (`ctaText`: "PLAY NOW" / "INSTALL") and a small, limited "Try again". |

## 2. Near-miss recipes by genre
Make it read as **the game's real hard part**, never as a cheat. The player must see *why* they lost.

| Genre | Recipe |
|---|---|
| Runner / crowd (Legion Rush, Dead Lane) | The L3 boss enrages at ~10 % HP and wipes the last soldiers ("ENRAGED!"). Or its HP is just higher than the best army can deal. |
| Puzzle (Liquid Sort, Pin Heist, Parking Panic) | The move limit is one short of the optimum; or the last pin releases lava a square before the treasure. It must look solvable and fail on the last move. |
| Shooter / survivor (Star Swarm, Blade Bloom) | With the boss at 8–12 % HP the last wave floods the screen and takes the last heart. |
| Race (Peak Dash, Lane Dash) | The rival boosts in the last 50 m and crosses the line 0.3 s ahead ("2ND! SO CLOSE"). |
| Tycoon / simulation (Cluck Tycoon, Power Wash) | The goal is a bit more than the best play can reach in time; the timer runs out at 94 %. |
| io / eat-and-grow (Hole Feast, Fish Feast) | In the last 10 s a rival swallows something big and passes you at 97 %. |
| Catcher / arcade (Fruit Rush) | At ~90 % a full-width "BOMB RAIN!" wall falls; the fruit pops away so the score can't grow. |

## 3. Kernel parameters (the shared **Ad** group — don't redefine them)

| Param | Default | Meaning |
|---|---|---|
| `adMode` | off (on when `meta.mode === 'AD'`) | Ad end cards: the CTA leads, limited retries. |
| `adFailLevel` | 0 = off | The scripted near-miss happens from this level on. |
| `adFailAt` | 0.9 | Progress (0.6–0.98) at which the failure starts. |
| `adGateLevel` | 0 = off | After winning this level: "🔒 LEVEL N LOCKED — Continue in the app" + CTA instead of NEXT LEVEL. |
| `maxRetries` | 1 | "Try again" presses before only the CTA remains. |

Keep them off in `config.sharedDefaults`: the near-miss is the marketer's decision.

## 4. `ctx.ad` in the game
```js
update(ctx, dt) {
  const d = ctx.data;
  const progress = d.bossDamage / d.bossHp;          // 0..1, whatever "how close" means in this game
  if (!d.adFail && ctx.ad.check(progress)) startDramaticFail(ctx);
  if (d.adFail) { /* keep animating, but nothing may raise progress or win now */ }
}
function startDramaticFail(ctx) {
  const d = ctx.data; d.adFail = true;
  // 1. SHOW the cause: boss enrage wipes the army, bomb wall, rival boost, last pin wrong, timer.
  // 2. Stop progress: no more points / damage / moves; the win check is skipped while d.adFail.
  // 3. End: slow-mo + red flash + "NOOO!" toast, then the SO CLOSE card after `delay` ms.
  ctx.ad.fail({ progress: current(ctx), nearText: ctx.t('ad.left', { n: remaining(ctx) }), delay: 1200 });
}
```
- `ctx.ad.check(progress)` is `true` **once per run**, only when `adMode` is on, `ctx.level >= adFailLevel`
  and `progress >= adFailAt`. In GAME mode it is always `false`, so the game plays exactly as before.
- `ctx.ad.fail(opts)` is the standard dramatic ending: `{ progress, nearText, delay = 1100, toast = 'NOOO!', title, sub, flash, slowmo }`.
  While it is pending, other `ctx.end()` calls are ignored, so a stray win can't slip through.
  You can also call it when the visible cause lands (first bomb hits the basket, rival crosses the line).
- `ctx.ad.forceFail` is `true` for the whole near-miss level. Use it to ease that level's road (fewer
  hazards, a boss sized to the army) so players really arrive at ~90 %. The trap is the ending, not the road.
- Add the strings you use (`'ad.left': 'Only {n} more!'`, `'toast.enrage': 'ENRAGED!'`) to `strings.en`.
- `bot()` must play the trap level well, so `?trailer` and the poster show the "almost" moment.
- `config.trailer.autoNext: true` lets `?trailer` roll L1 → L2 → L3 by itself.

## 5. Checking it
```bash
node tools/ad-check.mjs game/dist/index.html          # AD-CHECK: PASS = ≥ 2 of 3 seeds end in the near-miss, GAME mode clean
```
- It plays `?test&adfail=3&level=3&seed=N` (N = 1, 2, 3); each run must end with `reason: 'ad-fail'`
  at 80–97 % progress. Then it plays `?test&level=3` and checks nothing scripted happens.
- Look at `ad-s<seed>-0.png` / `-1.png` (the moment it fails) and `-card.png`. The cause must be obvious at phone size.
- By hand: `?trailer&adfail=3` plays the whole funnel; `?ad` alone shows the ad end cards.

## 6. Policy note
Meta, Google, AppLovin, Unity and Apple require a playable ad to reflect the real app. "Fake gameplay"
ads are rejected or penalised.
- Present the scripted difficulty as the advertised game's real hard levels ("Can you beat it?").
- It must not look like cheating: the player sees why they lost.
- The setting belongs to the marketer and is **off by default**.
