# Planning a playable that works in 5 seconds

Adapted for mobile playables and ads. Parts of the structure (one lean pipeline, a single
planning artifact, a shared style contract) are inspired by Higgsfield's open-source game
skills (MIT License, © 2026 Higgsfield AI); the text here is Blyth's own.

## 1. Experience formula (one sentence, no genre words)
"The player feels **___** because the game constantly **___**."
Every later decision is judged against it. Example: "The player feels unstoppable because
the game keeps throwing obstacles they can barely dodge and rewards each dodge with coins."

## 2. Profile — decide one point on each axis
Time (real-time / turn-based) · Space (2D / 3D, lanes / free) · Agency (one hero / squad /
hand) · Conflict (vs system / vs self) · Outcome (win-lose / endless with goal) ·
Session (30–90 s for a playable) · Engagement source (execution, calculation, discovery,
accumulation — pick 1–2).

## 3. The first 5 seconds
- Second 0–1: the intro shows the hook title + one-line control hint. One tap starts.
- Second 1–3: the first success happens without skill (a coin, a pop, a merge).
- Second 3–10: the first threat appears and is easy to avoid.
- Then escalate: one new pattern at a time (new obstacle type, faster speed, combo).
- Peak near the end (boss wave, final gate, last 10 s), then a clear win or lose card.

## 4. Verbs and controls
Few strong verbs beat many weak ones. Map each verb to the cheapest gesture:
tap, drag (follow finger), swipe (4 directions), hold. Every verb also gets a key
(`ArrowLeft`/`ArrowRight`/`ArrowUp`/`Space`, WASD). No hover-only interactions.
The player's hitbox is a bit smaller than it looks; enemies' are honest.

## 5. Loops and fairness
- Every action: immediate feedback (sound + motion) and a later echo (score, combo, banner).
- Randomness lands before decisions, never after. Never spawn an impossible pattern
  (e.g. all lanes blocked). Soften streaks.
- Difficulty grows smoothly (speed growth param) with a comeback chance.
- Economy: every resource has a source and a sink.

## 6. Params (what marketers tune)
Pick numbers a marketer would want to A/B: speed, spawn rate, hazard chance, lives, target
score/distance, reward value, colours of hero/enemies/rewards/background, camera height.
8–20 params, ≥ 5 `marketer: true`, human labels, sensible min/max that never break the game.
Every param must visibly matter. Colours are params; nothing is hard-coded.

## 7. Readability (graybox looks matter)
- Strong silhouettes: hero, hazards and rewards differ in shape AND colour.
- Contrast: game elements vs background; warning colour (red/orange) only for danger.
- Big, simple shapes; nothing important smaller than ~24 design px on a phone.
- Portrait first; keep the action in the middle 70 % of the screen; HUD at the top.

## 8. Style (for when real art arrives)
When images are generated later, ONE style paragraph (60–90 words: rendering style, shape
language, palette by role, light/mood, readability + perspective word) is added byte-for-byte
to every asset prompt so all assets look like one game. In graybox builds, express the same
idea as the `palette` in `design/plan.json` (role → colour) and use those colours as params.

## 9. Ad-ready extras
- `meta.mode: 'AD'` shows a CTA button on the end card; set `ctaText` param default if needed.
- Keep total play under ~60 s by default (`maxPlayTime`), with a satisfying end in 30–45 s.
- The end card must show a result, score and a strong next action.

## 10. The playable-ad hook formula (what makes people keep playing and tap the CTA)
Study real mobile ad playables: they are short, loud, generous and always one step from "just one more".
1. **Instant clarity (0–2 s):** logo + one-line tagline + animated hand showing the exact gesture
   (`def.tutorial`). The scene is already alive behind the logo (`idle` animates it). No menus.
2. **Power fantasy with numbers:** the player's thing visibly grows — army count, money pile, hole
   size, speed, combo. Show it big in the HUD (`ui.counter`) and as floating "+10 / x2" (`fx.float`).
3. **Choice every 2–3 seconds:** gates (+10 / x2 / −15 / ÷2), lanes, pins, upgrades. Make the
   tempting choice risky. Let the bad choice hurt *visibly* (numbers drop red, `fx.flash('#ff3d6e')`).
4. **Juice on every action:** sound (pitch rising with combos), particles, ring, squash, shake on
   impacts, toast on milestones ("PERFECT!", "x2!", "MEGA!"). Silence and stillness kill retention.
5. **Escalation and a boss:** waves grow, speed creeps up, then a big rival/boss/wall at the end with
   its own health bar or a count-vs-count clash. Slow-mo (`fx.slowmo`) on the decisive moment.
6. **Near-miss curiosity:** losses happen *close* to the goal. Always pass `progress` to `ctx.end` so
   the card says "SO CLOSE! 87%". Wins give 1–3 stars and NEXT LEVEL (`next: true`).
7. **Short levels that escalate (2–3):** level 1 is easy and winnable in ~20–30 s, level 2 adds a new
   twist (new enemy, new gate type, new upgrade), level 3 is the "impossible" tease.
8. **Rival pressure:** a visible competitor (racers on the progress track, an enemy hole, a rival
   army) creates urgency. Show their position (`ui.progress` dots) and overtakes ("1ST!").
9. **Economy loop (idle / tycoon games):** collect → carry (visible stack on the back) → deliver →
   cash pile → spend on a glowing "unlock" tile with a price that counts down as money flows in.
   Each unlock adds a new station/worker that visibly automates something.
10. **Readable at thumb size:** chunky silhouettes, outlines on sprites (`sprites.outline`), big
    numbers on gates, contrasting floor vs. hazards, a soft shadow under everything that moves.
