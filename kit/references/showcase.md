# Showcase — finished Blyth games to learn from

Skim the game for your genre before you build. Don't read it whole: search for the named functions.
Every game here passes `verify` and `ad-check`. Paths are relative to `playable-lab/` in the Blyth repo.

## Which game to study
Folders are `showcase/<slug>`; Lane Dash and Fruit Rush live in `examples/`.

| Genre | Study | Shows |
|---|---|---|
| Runner (3D lanes) | `examples/runner-3d` (Lane Dash) | Lanes, pools, time-to-impact bot, chasing boulder near-miss |
| Runner (marble / sky track) | `marble-rush` | Hover-steer marble, hammers and sweepers, smashable cube walls, mega-ramp x1–x10 finish |
| Runner (pile / shape) | `ball-run`, `jelly-shift` | 360 instanced balls snaking behind you + tower finale; squash-to-fit walls with a hover-height meter |
| Crowd (gate runner) | `legion-rush` (2D), `mob-blast` (3D) | Pixel art in a low-res buffer, math gates, boss enrage; cannon stream through gates, pooled units + grid clashes |
| Crowd (city) | `crowd-snatch` | 3D stick-led crowd, rival AI reused as the bot, MEGA rage |
| Shooter (bank shots) | `ricochet-tanks` | Cursor aim with a 2-bounce laser, shells ricochet, shielded boss |
| Shooter (bubble) | `bubble-pop` | Cursor-aim bubble shooter with a bounce preview, chain pops, falling clusters, caged birds |
| Shooter | `star-swarm` (2D), `dead-lane` (3D runner-shooter) | Look-ahead dodging bot, boss HP track; 3D gates + horde + boss, canvas-texture labels in 3D |
| Racing (3D) | `peak-dash`, `bumper-carnival` | Rivals on the progress track, scripted photo finish; 3-lap loop with curvature drift and bumps |
| Racing (one-button drift) | `drift-dash` | Hold = drift, release = straighten; switch points on the racing line, NITRO, rival bump near-miss |
| Racing (bridge race) | `stair-race` | 3D brick-stack race on stairs, `ctx.input.stick` hero, rivals that steal steps |
| Racing (2D traffic) | `traffic-rush` | Hover weaving, near-miss combos, police chases, pincer near-miss |
| Adventure (swing) | `vine-swing` | Hold = vine to the nearest hook, release = fly; release arc preview, PERFECT window |
| Adventure (platformer) | `pixel-quest` | Auto-run pixel knight, tap to jump, rising lava, seeded tower generator |
| Adventure (jumper) | `sky-hop` | Reach-based platform generator, wrap-around steering, storm near-miss |
| Action (hose rescue) | `fire-rescue` (2D) | Hover-to-spray water arc (each drop flies its own ballistic arc), spreading fires, trampoline pet rescue, helicopter finale |
| Action | `blade-bloom` (3D survivor), `sling-siege` (2D slingshot), `slice-frenzy` (2D swipe slicing) | Stick hero, upgrade cards, world-anchored HP bars; typed-array block physics, simulated-shot bot |
| Puzzle (sort / parking) | `liquid-sort`, `parking-panic` | A* solver bot and hint, move limit; 3D grid puzzle, ray-check bot, rival pace dot |
| Puzzle (hex stacks) | `hexa-sort` | Place hex stacks (drag or click-click with a ghost), colour runs flip over, 10 bursts |
| Puzzle (triple match) | `match-pile` | 3D pile of toys, hover outline + click, 7-slot shelf, locked crate near-miss |
| Puzzle (screws) | `screw-jam` | Tap-to-unscrew, colour boxes + holding tray, swinging plates, solver-checked levels |
| Puzzle (draw to protect) | `save-the-pup` | One drawn line becomes a physics shield, bees bounce off, the gap near-miss |
| Puzzle (draw) | `draw-bridge` | Drawn line becomes a verlet bridge, ink stars, snapping-joint near-miss |
| Pull the pin | `pin-heist`, `hero-rescue`, `pin-pour` | Particle physics (typed arrays + hash grid), scripted pin-order bot; a hero who walks on his own; grey balls painted by coloured ones, timed cup lid |
| Strategy (merge) | `merge-kingdom` (2D), `car-merge` (3D) | Drag-merge board + auto-battle; merge garage + tap-nitro race |
| Strategy (defense / capture) | `archer-defense`, `tower-takeover` | Aim-and-shoot wall defense with upgrade cards; tower capture, AI planner reused as the bot |
| Maze (chase) | `berry-maze` | Walk to the cursor tile through hedges, fox AI (chaser / ambusher / flanker), dizzy power-up |
| Maze (tilt board) | `tilt-maze` | Board tilts toward the cursor, rolling ball physics, holes and bridges, magnet-hole near-miss |
| Maze | `lantern-ruins` | Lantern light map with line of sight, Dijkstra bot, minimap |
| Simulation (tycoon) | `cluck-tycoon` (3D), `idle-miner` (2D) | Collect → carry → deliver → unlock with a guide arrow; tap-to-dig idle chain, rubber-band clock |
| Simulation (time management) | `sushi-cat` | Recipe taps, serve the most impatient customer, late-dish near-miss |
| Simulation (fishing) | `hook-dive` | Hover-steer lure, dodge down / catch up, fling into coins, upgrade shop |
| Simulation (cleaning) | `power-wash` (2D), `rug-rescue` (3D) | Hover-to-spray dirt mask, pressure sound; one RGBA mask texture read by a shader |
| Party | `knockout-party` (3D), `tug-of-war` (2D), `putt-party` (3D mini golf) | Obstacle course with instanced beans; multi-touch tap duel on a beat; cursor-aim + hold-for-power putts racing rival balls |
| Party (hide & seek) | `hide-seek` (3D) | Walk-to-cursor seeker, flashlight cone clipped by furniture (line-of-sight catch), sneaky hiders on a BFS grid, lights-out level |
| Eat & grow (3D) | `hole-feast` | City of instanced props, live leaderboard, rival AI |
| Eat & grow (territory) | `paint-claim` | Trail + loop flood fill on a grid, rivals cut trails, King boss |
| Eat & grow (2D) | `fish-feast`, `snake-party` | Size tiers, threat-avoiding bot, frenzy; io snake with grid collisions and a King boss |
| Arcade (timing) | `stack-tower`, `knife-master` | One-tap timing, slicing, spin patterns, boss target |
| Arcade (aim / flick) | `hoop-shot` | 3D ball physics drawn in 2D, rim rattle, buzzer-beater near-miss |
| Arcade (tower drop) | `helix-drop` | Hover-rotated helix tower, instanced ring wedges, FIREBALL streak, landing-simulating bot |
| Arcade (coin pusher) | `coin-cascade` | 2.5D disc-stack physics in typed arrays, pusher + prizes, slot that follows the cursor, rubber-band near-miss |
| Arcade (catcher) | `examples/catcher-2d` (Fruit Rush) | Hover-steer basket, combo pitch, fever, bomb-rain near-miss |

## Controls on desktop
Many players use a mouse or a trackpad; every game also plays with arrows/WASD + Space (`kernel-api.md` → Input).
Copy the pattern for your verb:

| Verb | Copy from | Pattern |
|---|---|---|
| Drag-steer (runner, racer, catcher, cannon) | `ball-run`, `traffic-rush`, `examples/catcher-2d` | `def.hoverSteer = true`; a `mouseSteer()` helper is true while the mouse moves (keys win until it moves again); the cursor's x is the target (damped, speed-capped); touch stays a relative drag |
| Rotate the world | `helix-drop` | hoverSteer: the cursor x is the tower angle (one screen width = one turn), anchored where the mouse takes over so it never jumps; eased with a speed cap |
| Drop from a slot | `coin-cascade` | a ghost coin follows the cursor along the slot (nothing to click to aim); click drops, hold streams; touch: tap = aim + drop |
| Shape by height | `jelly-shift` | hoverSteer on y; `drawMeter()` spans exactly the cursor range |
| Free-moving hero to a spot | `stair-race`, `cluck-tycoon`, `blade-bloom`, `hide-seek` | mouse: walk to the ground point under the cursor (`groundPoint()` in stair-race, `groundAt()` in cluck-tycoon), finish onto it, stop when the cursor rests on the hero; camera leads by velocity; `stairAssist()` snaps onto a stair lane; a faint ground ring shows the target |
| Grid walk to a tile | `lantern-ruins` | `mousePath()`: shortest maze path to the tile under the cursor |
| Free-moving hero | `crowd-snatch`, `cluck-tycoon`, `snake-party`, `knockout-party` | `ctx.input.stick({ x, y })` at the hero's projected screen position: mouse = head toward the cursor and stop on it, touch = floating joystick (draw the ring only when `mode === 'touch'`); the bot returns a joystick `pointer` |
| Grid walk | `lantern-ruins` | `stick()` main axis = step, other axis = queued turn; mouse dead zone > half a tile; quick swipe = auto-walk |
| Aim and shoot | `hoop-shot`, `archer-defense`, `bubble-pop` | Mouse: the cursor is the aim point (no drag), click shoots, held = auto-fire; touch: drag to aim, release to shoot |
| One button hold / release | `drift-dash`, `vine-swing`, `putt-party` (charge) | hold = drift / grab a vine / charge power, release = straighten / fly / putt; hovering does nothing |
| Swipe without a click | `slice-frenzy` | read `ctx.input.hover`; a slice needs cursor speed above a threshold (slow hover only glows), a held button slices at any speed |
| Tap mashing | `tug-of-war` (also `idle-miner`) | `onPointer()`: a capture-phase `pointerdown` listener queues every finger (two-thumb mashing); `passStartTap: false` |
| Draw | `draw-bridge` | Drag draws; a mouse click without a drag starts click-move-click drawing |
| Drag-merge | `car-merge` | Drag onto the twin, or click a car then its twin; hover lifts the car and `setCursor()` shows pointer / grabbing |
| Clean / spray | `power-wash`, `rug-rescue`, `fire-rescue` | hoverSteer: hovering sprays / cleans with no click; hide the cursor while cleaning; `hintDevice()` swaps the hint text per device |

Tap games (tug-of-war, idle-miner, screw-jam, match-pile, pixel-quest, stack-tower, knife-master, pin-pour) never set `hoverSteer`: hovering must not act (match-pile and pin-pour only highlight). Auto-run + one action (`pixel-quest`) is the easiest platformer control on a trackpad.

Sound: no noise beds anywhere (the kernel silences `wind`/`rumble`); speed and ambience come from music, visuals and short `swoosh`es. `rug-rescue` (soft brush ticks paced by stroke length) and `marble-rush` (rolling = `tap` ticks spaced by distance, pitched by speed) show how to make continuous actions sound good without loops.

3D runners and racers draw **between fixed steps**: the kernel updates at 60 Hz and passes `alpha` to `render(ctx, alpha)`;
on 120/144 Hz screens a game that ignores it judders. Copy `ipAlpha()` / `ipDraw()` from `ball-run` (save the state at the
start of each step, draw at `alpha`, hold during a hit-freeze, snap on a level start or a big jump). Never let two surfaces
share a plane (stripes, floor tiles, decals, trims): build them edge to edge or lift them a few mm — `marble-rush` and
`knockout-party` show the fixed versions.

## Patterns worth copying (controls · HUD · bot · juice · perf)

### Lane Dash (runner, 3D) — `examples/runner-3d`
- **HUD:** `hud()` puts rival, boss and player dots on the progress track with a live "m" label; the boss dot exists only while the threat is active.
- **bot:** time-to-impact thresholds (`v * 0.2`) with reused per-lane distance arrays (`botCrate`, `botBar`), and `botLaneOk()` so it never switches into a barrier it can't jump.
- **juice:** a camera moment layered after the normal camera (`mixCam(cam, lb, …d.adCam)` with a look-back pose `lb`); `updateBoulder()` re-solves the chaser's speed every step so it lands the hit at a chosen progress.

### Marble Rush (runner, 3D)
- **controls:** `control()`: hoverSteer — the cursor x is the target track position (damped, no overshoot); rolling by default, a held click / Space brakes, leaving the window brakes.
- **track:** `buildLevel()` / `buildTrack()` bake the static track into one mesh per level (`baked()`, `merge()`); hazards `hamPos()`/`hamHit()`, `sweepHit()`, `smashWall()` + `stepCubes()` for shattering cube walls.
- **juice:** speed lines as 3D streaks (`stepLines()`), `drawSwirl()` marble texture, `startFinish()` mega ramp into x1–x10 hoops.
- **bot / near-miss:** `botPlan()` brakes before hammers; `startDoom()` / `doomSweep()` / `doomKnock()` knock the marble off the last beam.

### Ball Run (runner, 3D)
- **controls:** `steer()`: a hovering mouse maps the cursor's offset from the screen centre to a track x (`mouseSpan`); touch = relative drag; keys win.
- **bot:** `botPick()` scores lateral positions with `gateGain()` (the gate op applied to the pile count) and ball groups; `futureCi()` / `bestPaint()` predict the pile colour after PAINT gates.
- **perf:** up to 360 balls in one InstancedMesh with instance colours (`drawBalls()`); each ball springs to a hex-packed slot (`buildSlots()`) laid along the scoop's trail ring buffer (`writeTrail()`, `trailX()`), so the pile snakes; `flushJuice()` batches +N / -N floats.
- **near-miss:** `startTower()` sizes the forced tower so the pile runs out at `failAt + 3.5 %`, just under the x10 ring, while `runRival()` fills the tower next door.

### Jelly Shift (runner, 3D)
- **controls:** `control()`: the cursor's height sets the shape (top = tall), touch = relative vertical drag; `drawMeter()` on `ctx.overlay` spans exactly that cursor range (`meterRange()`) and shows the next hole's fit band (`fitRange()`).
- **bot:** `botGoal()` aims the shape at the middle of the next wall's fit band; the drag `dy` is capped per step so it looks human.
- **juice:** volume-preserving squash, `jiggle()` damped springs for the wobble; the hole frame glows green while you fit and pulses red before a splat; `flingQ()` turns the speed you kept into the x1–x10 finish.
- **near-miss:** `startClosing()` shrinks the next wall's hole below any possible shape.

### Legion Rush (crowd, 2D pixel)
- **HUD:** the army counter only updates when the count changes (`hudCount`); boss HP becomes a right-side skull counter once the boss is announced.
- **bot:** `bot()` simulates both sides of the next gate with `applyOp` and picks the larger; then it scores lateral positions against hazards (spikes, logs, swinging axes with predicted phase).
- **juice:** `killBoss()` stacks slow-mo, freeze, flash, shake, ring, star burst and confetti. Near-miss: `adBossHp()` sizes the boss to the legion, `enrage()` wipes it.

### Mob Blast (crowd, 3D)
- **controls:** `stepCannon()`: with `hoverSteer` the cannon goes to the cursor's x; touch slides it by relative drag; fire is automatic.
- **bot:** `botPick()` first aims at reds close to the cannon, otherwise scores 19 columns by the product of the gate ops the stream will cross, predicting sliding gates at arrival time.
- **perf:** units are struct-of-arrays pools (`makePool()`, `compact()`); blue-vs-red `clashes()` use a uniform grid (`buildGrid()`, `forBlueNear()`); `writeUnits()` writes `instanceMatrix.array` directly.
- **juice:** `damageCastle()` cracks the gate and flings chunks (`popChunks()`). Near-miss: `startNearMiss()` drops the Red Giant, `giantStomp()` clears the stream, the clock is cut to ~5 s.

### Crowd Snatch (crowd, 3D)
- **controls:** `ctx.input.stick()` at the leader's projected position (`scr()`), rotated into world axes by the camera yaw; the joystick ring is drawn only in touch mode (`d.joyOn`).
- **bot:** reuses the rival AI: `aiThink()` scores grid cells (walkers from `recountCells()`, danger from `threatK()`), `aiSteer()` drives, and `bot()` returns the exact inverse of the stick as a joystick pointer.
- **perf:** every person is one instance (`writePeople()` writes `instanceMatrix.array`); `softwareGL()` lowers quality on software rendering; `transfer()` moves people one by one from the losing crowd's tail.
- **near-miss:** `startRage()` + `megaSteer()`: MEGA aims ahead of the player, charges at 2–3× and absorbs the crowd.

### Dead Lane (runner-shooter, 3D)
- **HUD:** `drawLabel()` / `drawBar()` draw canvas-texture sprites in the 3D scene (squad bubble, boss HP bar) and redraw only when the value changes (`lblN`, `barDirty`).
- **bot:** `bot()` evaluates both sides of the next gate with `evalSide()`, lines up on crates, otherwise aims at the horde's average x.
- **juice:** `bossKill()` stacks freeze, slow-mo, two rings, a fireball, confetti, pops every zombie and mixes in a punch-in camera (`bossPunchIn` in `camTarget()`). Enrage = pulsing red emissive + 1.18× scale.

### Ricochet Tanks (shooter, 2D)
- **controls:** `aimAt()`: the cursor is the aim point, `trace()` draws the 2-bounce laser and `aimHits()` locks on; click fires.
- **shells:** `stepShell()` / `reflect()` bounce off walls and mirrors; `hitTank()`, `fireball()`, `scorch()` juice; `planShot()` / `evalAngle()` bot.
- **near-miss:** `startTrap()` + `deflect()`: the last perfect shot glances off the boss shield.

### Bubble Pop (shooter, 2D)
- **controls:** `handleInput()`: the cursor is the aim point (`angleTo()`), `trace()` previews one wall bounce + the landing cell; click shoots, `onSwap()` swaps.
- **rules:** `snapCell()` / `flood()` / `popCell()`; `attached()` + `dropFloating()` rain loose clusters into the coin tray; `releaseBird()` / `stepFlyers()` fly chicks to the nest.
- **near-miss:** `startTrap()` withholds the cage colour; `startNearMiss()` + `setupGhost()` show the shot that would have won ("1 SHOT SHORT!").

### Star Swarm (shooter, 2D pixel)
- **HUD:** one top track switches from the stage timer to the boss's HP ("BOSS 37%") when the boss arrives; throttled (`progT`) and only changed counters are sent.
- **bot:** `bot()` scores a 9×5 grid of positions against predicted bullets and enemies at 5 look-ahead times, in a preallocated array (no allocation).
- **juice:** `bossDown()` turns every enemy bullet into a coin. Near-miss: an unkillable full-width `P_FLOOD` wall, then hearts drained one by one.

### Peak Dash (racing, 3D)
- **HUD:** `drawRivalAlert()` draws a "RIVAL 12 m" pill with chevrons on `ctx.overlay` for a threat still behind the 3D camera.
- **bot:** `bot()` scores 15 lateral columns against every item within a speed-scaled horizon (crystals and gates add, rocks subtract) and predicts where the rolling snowball will be.
- **juice:** `adRivalPace()` drives a scripted opponent by a gap curve, so the overtake lands at a chosen moment at any player speed; a fire trail from a per-racer emit accumulator.

### Bumper Carnival (racing, 3D)
- **controls:** `mouseSteer()`: the cursor's x across the screen is the lane to drive to (damped); touch = follow-the-finger drag; corners push the car outward by track curvature (`kAt()`).
- **bot:** `bot()` scores lateral columns against coins, boost rings, ramps, tire stacks and rivals within a speed-scaled horizon, plus a curvature bias for the inside line.
- **perf/juice:** scenery is merged vertex-coloured geometry (`merge()`, `paint()`); `bonk()` spins rivals out. The near-miss reuses Peak Dash: `adRivalPace()`, `drawRivalAlert()`, `photoFinishLost()`.

### Stair Race (racing, 3D)
- **controls:** `ctx.input.stick` at the hero's screen position (`scr()`); mouse heads to `groundPoint()` under the cursor and stops on the hero; touch joystick.
- **rules:** `buildStep()` spends one brick per step and repaints a rival's step (steal); `canKnock()` / `knock()` / `scatter()` let a bigger stack bump a smaller one into grey bricks.
- **bot/AI:** `aiThink()` → `pickBrick()` / `chooseStair()` / `routeStair()`; `rivalSpeed()` rubber-bands; the same AI drives the bot.
- **perf:** bricks, steps and characters are instanced (`writeBricks()`, `writeSteps()`, `writeChars()`); `softwareGL()` drops resolution under load.
- **near-miss:** `startTrap()` sends Ruby up behind you; `trapBump()` knocks you down one step from the crown.

### Drift Dash (racing, 3D)
- **controls:** `readHeld()`: hold = drift, release = straighten; `onSwitch()` grades the switch inside the bend's DRIFT zone (PERFECT / GOOD / miss) and `completeBend()` eases a good switch back onto the line.
- **track:** the course is the car's own path through switch points (`buildLevel()`, `curvedAt()`); `fireNitro()` after 4 perfects; `startFall()` / `respawn()` before the missed bend.
- **near-miss:** `startNearMiss()` + `adRivalPace()` + `bump()`: the rival nitros level on the last hairpin and bumps you off.

### Traffic Rush (racing, 2D)
- **controls:** `mouseSteer()` + `hoverSteer`: the car weaves to the cursor's x; touch = relative drag (the finger never covers the car); `hintDevice()` names the device in the hint.
- **bot:** `bot()` scores every lane (±13 offsets) against nearby vehicles at several look-ahead times (`BOT_T`), modelling a cop's wind-up and straight ram.
- **juice:** `nearMiss()` pays a rising-pitch combo (CLOSE CALL doubles it); `tryLaneChange()` blinks indicators first; `copCrash()` when a cop is led into traffic. Vehicles live in a fixed pool (`alloc()`).
- **near-miss:** `startPincer()`: two cruisers box the car in, a truck swerves into its lane and brakes.

### Vine Swing (adventure, 2D)
- **controls:** hold → `findTarget()` grabs the nearest hook ahead, release flies; `simRelease()` draws the release arc and the PERFECT window.
- **level:** `genLevel()` builds a seeded course and simulates the bot through it so every gap is crossable (`planRelease()`).
- **near-miss:** `startDoom()` + `snapHook()`: the last branch snaps just before the temple.

### Pixel Quest (adventure, 2D pixel)
- **controls:** auto-run that turns at walls; tap / click / Space = `launch()` jump (hold = higher, double jump from L2); arrows flip direction. Hover does nothing.
- **level:** `genLevel()` builds a seeded tower of one-way ledges (`tileAt()`, `standable()`), `updateCrumbs()`, `updateEnemies()`, `stomp()` with `puff()` particles.
- **look:** low-res buffer + `layoutBuffer()` crisp scaling, `buildVignette()` torch light.
- **near-miss:** `startSurge()` raises the lava and a geyser (`drawGeyser()`) catches the knight one jump below the open door.

### Sky Hop (adventure, 2D)
- **controls:** `mouseSteer()` + `hoverSteer`: the bird drifts toward the cursor's x (damped, speed-capped); touch = relative drag; the screen wraps (`wrapX()`, `wrapD()`).
- **bot:** `botTarget()` picks the next platform reachable in the remaining fall (analytic apex with a safety margin), stomps crows only cleanly and accepts more risk when stuck.
- **level gen:** `genNext()` spaces platforms by `reach()` (jump height from bounce power and gravity) so every gap is reachable; crumbling wood is always an extra step, never the only way up.
- **near-miss:** `startStorm()` → `stormCharge()` → `strike()`; the zapped bird spins down (`updateZapped()`).

### Blade Bloom (survivor, 3D `ctx.input.stick`)
- **HUD:** `drawOverlay()` draws world-anchored bars through `proj()` on a 2D overlay: per-boss HP with a white lag trail, the hero's HP pill; it skips clearing when nothing is shown.
- **bot:** `bot()` blends steering vectors (enemy repulsion, gem pull, escape from slam telegraphs, circling the boss, kiting), smooths them, and picks upgrade cards with `choiceScore()`.
- **juice:** `startLevelUp()`: slow-mo 0.2, flash, ring and star burst as the cards open. `adCap()` clips any hit that would cross the near-miss mark so the trap can't be skipped.

### Slice Frenzy (action, 2D)
- **controls:** `control()` + `cutCheck()`: a slice needs cursor speed above a threshold (no click); a held button slices at any speed; touch = swipe.
- **juice:** `sliceItem()` halves + `addSplat()`, `resolveCombo()` rising pitch, `startFrenzy()`; `stepBoss()` swings the piñata.
- **near-miss:** `startRage()` / `rageClip()`: a ring of shield bombs, the last slice clips one.

### Fire Rescue (action, 2D)
- **controls:** `hoverSteer` + `mouseSteer()`: a hovering mouse aims and sprays (no click); touch = drag; `readAim()`; `hintDevice()` swaps the hint per device.
- **stream:** `stepStream()` fires drops that each fly their own ballistic arc to the aim point (bent by wind), drawn as ONE tapered outlined hose (`drawStream()`), so the water whips when you swing.
- **loop:** `stepFires()` / `spreadFrom()` grow and spread fires, `douse()` frees the pet → `launchPet()` → `stepTramp()` bounce → hearts; L3 `explode()` relights windows, `heliRescue()` ends it.
- **sound:** `sprayAudio()` is one soft low-passed hiss only while water flows and the hose moves (vol ≤ 0.28), never a bed.
- **near-miss:** `startFlare()`: the last fire flares and the tank runs dry.

### Sling Siege (action, 2D)
- **controls:** drag anywhere to pull back; `clampPull()` / `pullToLaunch()` are the one launch model shared by the shot, the `drawPreview()` arc and the bot's `simShot()`.
- **bot:** `planScores()` weights each block by the goblins standing on it; `botPlanStep()` spreads an angle × power grid of `simShot()` runs over several steps, picks a shot whose neighbours also score, then drags through the real input path and taps abilities at the right flight age.
- **physics/juice:** blocks on typed arrays; `supportPass()` settles columns and tips planks; `queueBlast()` chains TNT with a delay; `punch()` camera punch-in on big hits.
- **near-miss:** `kingStagger()` shoves the King to the edge of his beam, `bigTeeter()` makes him wobble and recover.

### Hexa Sort (puzzle, 3D)
- **controls:** `handleInput()`: drag a tray stack or `press()` it then a cell; `ghostCell()` previews the drop, matching neighbours glow.
- **rules:** `pickTransfer()` / `simulate()` flip top runs between neighbours (`startMove()`, `stepFly()`), `canBurst()` → `startBurst()` at 10.
- **near-miss:** `startTrap()` + `rockLand()` seal the cells around the best stack: BOARD FULL one burst short.

### Match Pile (puzzle, 3D)
- **controls:** `pickAt()` ray-picks the visible toy (`computeVis()`, `rayFirst()`), `setOutline()` highlights it on hover, click / tap → `pickItem()`; keys walk `nearestVisible()`.
- **rules:** `insertShelf()` groups twins on the 7-slot shelf, `hasTriple()` → `mergeBurst()`; `settleAndArrange()` / `physStep()` let the pile slump; boosters `magnet()`, `shuffle()`, `undo()`.
- **perf:** one InstancedMesh per kind (`writeItems()`), no shadows, resolution drops under load.
- **near-miss:** `armTrap()` keeps the crate one match short; `startJam()` = SHELF FULL with the locked twins glowing.

### Liquid Sort (puzzle)
- **HUD:** `drawMoves()` is a canvas MOVES badge that bumps on change and pulses red at ≤ 3; the objective text changes with the state ("Only N moves left!", "Last move!").
- **bot:** `bot()` replans with A* (`solveRT`: exact first, weighted fallback) only when the board changes (`stateVer`); `computeHint()` reuses the solver for the idle hint arrow.
- **juice:** `corkLanded()` bounces the cork, then burst + ring + "+1"; completion pitch rises; toasts climb NICE → GREAT → AMAZING; the last tube gets PERFECT with slow-mo and freeze.

### Parking Panic (puzzle, 3D)
- **HUD:** a "pro rival" pace dot next to the player's on the progress track, with a "PRO IS AHEAD!" banner; `hud()` builds a key string and only touches the DOM when it changes.
- **bot:** `bot()` uses grid ray checks (`scanPath`) to pick cars with a clear path, scored by how many cars each one unblocks (`pathHits`); in `?trailer` it adds one deliberate bump on L2 for drama.
- **juice:** `enterRoad()` raises the whoosh/coin pitch with each car in a streak and floats "+pts" / "xN" at the car's projected 3D position; `contact()` = BONK burst, ring, shake, freeze, "!" bubble.

### Screw Jam (puzzle, 2D)
- **controls:** `handleInput()` + `tapAt()`: tap/click a screw; hover highlights it with `setCursor()`; Space jumps to the next playable screw.
- **rules:** `tapScrew()` → `startFly()` / `flyTarget()` into the colour box or the tray; `closeBox()` slams a full box; `startSwing()` / `startFall()` hang a plate on its last screw, then drop it.
- **solver:** `mSolve()` checks every level and drives the bot and `computeHint()`.
- **near-miss:** `armNearMiss()` swaps in a box order that dead-ends at 27/30; `startStuck()` plays NO SPACE → TRAY FULL.

### Save the Pup (puzzle, 2D)
- **controls:** like Draw Bridge — drag draws, or click-move-click; `startStroke()` / `strokeTo()` / `commitLine()` turn the stroke into a physics body (nailed on rocks, floats on water).
- **swarm:** `startSwarm()`, `collideBee()` bounces bees off the line; `sting()` costs a heart.
- **near-miss:** `startNearMiss()` snaps the line tip ("A GAP!") at 90 % of the timer.

### Draw Bridge (puzzle, 2D)
- **controls:** `handleInput()`: drag draws; a mouse click without a drag starts click-move-click drawing (the line follows the cursor); `startStroke()` / `strokeTo()` / `commitLine()` turn the stroke into a verlet chain nailed where it touches a cliff.
- **bot:** replays the level's handmade `sol` polyline with a small human wobble at a steady pen speed, then taps GO.
- **juice:** `strain()` glows overloaded links red; the pencil meter drops stars live as ink runs out (`starCheck()`); `outOfInk()` ends the stroke with a shake.
- **near-miss:** `startNearMiss()` lands the rock behind the car and `snapLink()` picks the far-edge joint to break.

### Pin Heist (pull the pin)
- **HUD:** `hud()` throttled to 0.09 s; celebration toasts never stack (`toastStage` + minimum gap): NICE 30 %, GREAT 65 %, JACKPOT at the goal.
- **bot:** `bot()` follows a per-level `order` script with `wait` / `until` guards (sealed, noBombs, lavaInPit) and re-taps every 0.25 s until the pin moves, because hit-stop can swallow a tap.
- **juice:** particle physics on typed arrays with a spatial hash grid, no per-step allocation; coins reaching the sack are batched into one "+N" every 0.11 s with a rising, cooldown-gated coin sound.

### Pin Pour (pull the pin, 2D)
- **controls:** `handleInput()` → `findPin()` / `pullPin()`: click a pin (hover only highlights it and shows its slide arrow via `setCursor()`); touch = tap or swipe; Space pulls `nextPin()`.
- **physics:** typed-array balls + hash grid (`buildGrid()`, `substep()`); `paintBall()` spreads colour on contact; `dynamicSegs()` adds the sliding pins as walls.
- **perf:** the static glass is pre-rendered (`buildBack()`, `buildFront()`), balls are blitted sprites (`ballSprite()`).
- **near-miss:** `stepLid()` closes the cup lid at ~adFailAt; `startNearMiss()` sends the last batch onto the bomb ledges (`explode()`).

### Hero Rescue (pull the pin, 2D)
- **controls:** tap or swipe a pin; `findPin()` measures to the pin shaft and its ring; `updateTutorial()` points the hand at the next correct pin with a swipe in the pin's direction.
- **bot:** a per-level `steps` script with `until` guards (heroIdle, calm, orcDead…) that re-taps `grabPoint()` every 0.3 s.
- **juice:** the knight acts on his own: `heroThink()` walks to settled gold and to the princess once `pathOpen()`; `smashRocks()` breaks over-high cooled lava so a right order always wins.
- **near-miss:** `trapLevel()` grafts a lava cup and a second gate onto the forced level; `rescueProgress()` = 72 % pins in order + 28 % distance walked.

### Tower Takeover (strategy)
- **HUD:** team dots on the progress track, re-sent only when the team-count key changes.
- **bot:** `bot()` reuses the enemy AI planner (`defendPlan || plan || dumpPlan`) and turns the plan into an eased multi-point drag, so it plays through the real input path.
- **juice:** `startCounter()` sends pooled off-map reinforcements through the normal squad system with a pulsing red edge; `dominance()` (strength share) is a progress measure that must pass 90 % before a win.

### Merge Kingdom (strategy, 2D)
- **HUD:** the VS bar compares `armyPower()` (√(HP × DPS)) of both armies; `flushDmg()` batches damage into one float per fighter.
- **bot:** merges the pair from `findPair()` when it helps, buys to complete pairs (~3 knights per 2 archers), then taps FIGHT, all as eased pointer drags through `press()` / `release()`.
- **juice:** fighters come from a fixed pool (`allocF()`, `resetF()`). Near-miss: `startRage()` slams and `knockOut()` flings each unit off spinning.

### Car Merge (strategy, 3D)
- **controls:** `press()` / `dragMove()` / `release()`: `groundHit()` raycasts onto the garage floor, `bayAt()` finds the bay; a click without moving selects a car and the next click drops it on its twin; hover lifts the car under the cursor and `setCursor()` shows pointer / grabbing; in the race every tap is `nitro()`.
- **bot:** `findPair()` (lowest pair first) → eased drag; buys, taps RACE once the best car matches the rival, taps nitro every few steps.
- **perf:** one InstancedMesh per car tier (`pushCar()`, `carMatrix()`), wheels and shadows in shared instance buffers; a coin bonus fires when the garage is stuck (no pair, no money).
- **near-miss:** `startTrap()`: RIVAL NITRO, a low photo-finish camera, lost by 0.20 s.

### Archer Defense (strategy, 2D)
- **controls:** `handleInput()`: the mouse aims with no click (`setAim()`), a click shoots, holding keeps shooting; touch drags to aim and releases to shoot (a quick tap shoots at the tap); `findLock()` locks the arrow onto the enemy under the aim.
- **bot:** `botTarget()` picks the most urgent enemy, `botAimAt()` leads it by iterating `flightTime()` three times; upgrade cards via `bestChoice()` / `choiceScore()` (wall repair first when the wall is low).
- **juice:** a pseudo-3D valley from a depth `z` (`zy()`, `zs()`), enemies depth-sorted in place (`sortEnemies()`); `stickArrow()` keeps arrows stuck in bodies; headshots CRIT with hit-stop.
- **near-miss:** `startNearMiss()`: the Warlord's last charge, `adImpact()` breaks the wall.

### Berry Maze (maze, 2D)
- **controls:** the hedgehog walks the shortest path to the tile under the cursor (`bfs()`, `pathDir()`, `beginMove()`); keys queue turns, touch swipes.
- **foxes:** `foxChoose()` gives each fox a role (chaser, ambusher, flanker), `stepFoxes()`; the golden acorn makes them dizzy.
- **near-miss:** `startAmbush()`: two foxes leap the hedges and pincer the last corridor.

### Tilt Maze (maze, 3D)
- **controls:** `control()` / `boardPoint()`: the board leans so the ball rolls toward the cursor and rests on it (no click); touch = tilt pad.
- **physics:** `rollStep()`, `collide()`, `stepHazards()` (`bladeHit()`, `gateOpenAt()`), `startFall()` / `respawn()` at checkpoints.
- **near-miss:** `startDoom()` / `doomStep()` turn the last hole into a magnet one tile before the cup.

### Lantern Ruins (maze, 2D)
- **controls:** `stepHero()`: `ctx.input.stick()` → 4-way steps (main axis = step, other axis = queued turn, `chooseDir()`); a quick swipe auto-walks to the next junction; the mouse dead zone is over half a tile so the explorer settles under the cursor.
- **bot:** `bot()` runs `dijkstra()` over a cost grid (ghosts that can bite, spikes); goal ladder: oil when low → nearby gems / chests → current key → vault; `tileSafe()` checks spike timing.
- **juice:** `updateLight()` builds a low-res light map with wall occlusion (`blocksLight()`, `los()`) and flicker; seen tiles stay dim and feed a dirty-flagged `drawMinimap()`; `genLevel()` transposes the maze for landscape.
- **near-miss:** `progressNow()` = 75 % keys + 25 % vault approach; `startTrap()` blows the lantern out and raises the Guardian.

### Hole Feast (eat & grow, 3D)
- **HUD:** `hudStep()` builds a live leaderboard from right-side counters (hole colour, trophy on 1st, `bump: false`) every 6 steps from an in-place sorted `ranks()` array; one progress dot per hole; "TOOK 1ST!" toasts.
- **bot:** `bot()` reuses the rival AI (`steer(ctx, d, me, 1, dt)` at skill 1): grid-cell food scoring (`pickTarget`) and steering away from holes that can eat you.
- **juice:** `award()` sets the pop pitch from prop size × combo and bursts debris at the hole's projected screen position (`holeScreenR()`); shake, ring and explosion scale with prop size.

### Fish Feast (eat & grow, 2D)
- **HUD:** `hudProgress()` shows a size bar with a dot per remaining size tier; `drawBadges()` puts a number on every bigger fish; `drawScreen()` adds an arrow to an off-screen shark.
- **bot:** `bot()` flees each threat with a range that grows while the threat chases; threats cached in a flat `Float32Array`; prey inside a threat zone is penalised.
- **juice:** `eat()` raises the pop pitch with the eating streak and scales ring, shake and hit-stop with fish tier; FRENZY when a ring buffer holds N eats inside a time window.

### Paint Claim (eat & grow, 2D)
- **controls:** `ctx.input.stick` — the blob always rolls and turns toward the cursor; touch joystick; keys.
- **rules:** grid trail + `closeLoop()` → `floodOutside()` flood fill (typed arrays); `potentialGain()` shows the live "+%"; rival AI `makePlan()`.
- **near-miss:** `startCharge()`: the sleeping King wakes and cuts your winning loop.

### Snake Party (eat & grow, 2D)
- **controls:** `playerInput()`: `ctx.input.stick()` from the head's screen position sets the heading; boost = mouse button held, touch double-tap-and-hold, or Space.
- **bot:** reuses the rival AI (`aiThink()`, `aiSteer()`) and returns a joystick pointer.
- **perf/juice:** bodies follow a recorded path (`pushPath()`, `computeSegs()`); collisions through a uniform grid (`buildGrid()`, `probe()`); per-colour segment sprites are cached (`snakeSprites()`); `zoomTarget()` zooms out as you grow; `burstOrbs()` on every kill.
- **near-miss:** `startCoil()` / `coilStep()`; until then `bouncePlayer()` bounces your head off bodies so the scripted level stays fair.

### Cluck Tycoon (tycoon, 3D)
- **HUD:** `hud()` caches each pill's last string and only calls `ui.counter` / `ui.progress` on change; the clock turns red at ≤ 10 s with a tick each second and a one-time "HURRY UP!".
- **bot:** `botInput()` follows the same priority ladder as the on-screen `guide()` arrow (affordable tile → stock → drop eggs → cash → collect) and routes around walls with `navTarget()`.
- **juice:** `drawCountdown()` draws a pulsing overlay number with a cached vignette; the late truck gets a grey "+$N" and a red "TOO LATE!". `runClock()` is a rubber-band clock that lands the near-miss with ~4.5 s left.

### Idle Miner (tycoon, 2D)
- **controls:** taps only, with the same multi-touch `onPointer()` queue as Tug of War; `tapRow()` builds a per-shaft tap combo.
- **bot:** buys whatever the guide arrow points at (`recommend()` / `prio()`, drawn by `drawGuide()`) once affordable, otherwise taps the most valuable open shaft (`rowVal()`) at ~6.5 taps/s.
- **juice:** `credit()` counts money only when the coins land in the HUD (`fly()`); `loopSet()` touches audio loops only when volume or pitch really change.
- **near-miss:** `startNearMiss()` runs the rest of the shift down in 3–5 s (`runClock()`, `truckEta()`) so the whistle catches the last truck on the road.

### Sushi Cat (time management, 2D)
- **controls:** taps: `trayPress()` adds an ingredient (`validNext()` rejects a wrong step, the next tray glows), `tapServe()` sends the dish to the most impatient matching customer (`urgentFor()`); dragging a dish onto a customer also works.
- **bot:** `botInput()` → `planNext()` counts the open order needs of seated customers and picks serve / tray / discard per board.
- **near-miss:** `ffClock()` rubber-bands the shift clock in the forced level so ~90 % lands with a few seconds left; `launchLate()` turns the dish in the air into the late one (grey +N, TOO LATE!).

### Hook Dive (simulation, 2D)
- **controls:** hoverSteer: `mouseSteer()` / `steer()` move the lure to the cursor x (smoothed, capped).
- **loop:** `stepDrop()` → first bite → `startReel()` / `catchFish()` builds the bunch → `startFling()` pops it into coins; upgrades in `shopLayout()`.
- **near-miss:** `whaleBite()` + `cutLine()`: a shark bites the line just above the golden whale.

### Power Wash (cleaning, 2D)
- **controls:** `mouseSteer()` + `hoverSteer`: hovering sprays with no click (the cursor hides while spraying); touch = drag; `hintDevice()` names the device in the hint.
- **bot:** `bot()` washes in rows with `nextDirtyInBand()`, then hunts `nearestDirty()` cells; slow over dirt, fast over clean.
- **juice:** `drawGun()` draws a chunky toy pressure gun that drifts toward the aim and mirrors when aiming left; the jet's width and alpha follow pressure; `pressureSound()` drives the spray hiss + pump loops from pressure (darker on grime, brighter on clean paint).
- **near-miss:** `drawTank()` (forced level only) is a canvas water gauge (ticks, red blink when low); `startBurst()` bursts the hose at ~90 % and a leak hiss loop drains it.

### Rug Rescue (cleaning, 3D)
- **controls:** `hoverSteer`: a hovering mouse cleans with no click and the cursor hides; `readInput()` raycasts the pointer onto the rug grid (`rayToGrid()`); touch holds the tool `TOUCH_OFF` above the finger; `hintDevice()` names the device.
- **perf:** dirt, stain, foam and sheen grids are packed into ONE RGBA `DataTexture` (`ensureMask()`, `writeMask()` only when dirty) read by the rug's shader; `stampScrub()` / `stampSquee()` stamp the tool; `snapZone()` auto-finishes a zone at the clean target.
- **bot:** `botStep()` cleans in rows (`nextDirtyInBand()`), then hunts `nearestDirty()` / `nearestFoam()`.
- **juice:** `toolSound()` scrub / motor / suction loops follow tool speed. Near-miss: `startDying()` drains the battery (`drawBattery()`) until `killBattery()`.

### Knockout Party (party, 3D)
- **controls:** `playerInput()`: `ctx.input.stick()` at the bean's settled screen position (`scrSettled()`, so camera lag doesn't move the mouse target), mapped onto the ground by `groundAxes()`; tap / mouse press / Space = jump, again in the air = dive; `drawOverlay()` draws the joystick only in touch mode.
- **bot:** `botCourse()` / `botPlan()` predict obstacles with `willHit()` and wait, jump or go; `botPointer()` turns the wanted direction into a joystick pointer.
- **perf:** all 12 beans share one set of InstancedMeshes (`renderBeans()`); the static course is baked into merged vertex-coloured geometry (`bake()`, `mergeParts()`); Tile Drop hides fallen hexes with a zero matrix (`hexTileMatrix()`).
- **near-miss:** `startNearMiss()` → `frenzyHit()` launches the hero into the water; `scriptedRival()` jumps the arm and grabs the crown.

### Putt Party (party, 3D)
- **controls:** `control()`: the cursor is the aim point (`groundPoint()`), hold charges a swinging power ring, release → `putt()`; touch = drag back and release.
- **physics:** `stepBall()` on a baked course (`buildCourse()`), windmill (`millAngle()`), loops and a sliding bridge (`bridgeX()`); rival balls race as ghosts.
- **near-miss:** `nearMissCheck()` → `startLip()`: the winning putt lips out while the last rival drops in.

### Tug of War (party, 2D)
- **controls:** every finger counts: `onPointer()` is a capture-phase `pointerdown` listener that queues each press, so two-thumb mashing isn't merged into one tap; `handleInput()` drains the queue; `passStartTap: false`.
- **bot:** pops recruit bubbles, taps on the beat (`beatOff()`, `beatId()`) with a small error and occasional skips, otherwise mashes at a randomised human rate.
- **juice:** `tapMult()` = streak × frenzy × helpers; `punch()` holds a camera punch-in; `crowdWave()` ripples the bleachers.
- **near-miss:** the forced level softens the foxes (`rivalRate()`), then `startMighty()`: the champion's MIGHTY HEAVE yanks the bears into the mud.

### Hide & Seek (party, 3D)
- **controls:** `seekerInput()` / `mouseRun()`: walk to the floor point under the cursor (`groundPoint()`), rest the cursor on the kid to stop; touch = floating joystick; the flashlight always points where you walk.
- **light:** `updateFan()` clips FAN_A floor rays at furniture (`rayClip()`), and `inLight()` + `clearLOS()` use the same rule, so what you see lit is what catches; `writeBeam()` adds a faint additive volume.
- **hiders:** `genLevel()` seeds spots, `bfs()` / `makePath()` route them; `trySneak()` bolts when `lightComing()`; `giggle()` wiggles the prop; `boxNext()` walks the L3 cardboard box.
- **render:** `ipKeep()` / `ipAlpha()` draw between fixed steps; instanced props and critters (`writeProps()`, `writeHiders()`).
- **near-miss:** `startBatteryDeath()` → `stepAdFail()`: LOW BATTERY flicker, the torch dies, the last hider giggles and runs.

### Stack Tower (arcade timing, 3D)
- **HUD:** the objective counts down ("5 floors to go!", "Last floor!"); a per-level "best" dot on the progress track.
- **bot:** `bot()` picks an aim error per slab (mostly within ±0.35 × tolerance, a scripted slice every 6th drop) and taps on the zero-crossing of `off - aim`, one step ahead.
- **juice:** `windStreak()` sends screen-space sparks along the projected world wind; `render()` leans the InstancedMesh tower about a pivot so it wobbles without rewriting instance matrices.

### Knife Master (arcade timing, 2D)
- **HUD:** `hud(ctx, force)` caches values so `ui.counter` / `ui.progress` fire only on change; stage dots (done / current / boss); a knives-left column that pulses on the next knife.
- **bot:** `botPredict()` simulates the spin pattern and the knife flight 120 steps ahead with a widened hitbox, throws only on a predicted stick and prefers apple slices.
- **juice:** `breakTarget()` splits the target into clipped pie chunks and flings every stuck knife outward with freeze, slow-mo, shake, white flash, double ring and bursts; `stick()` raises the pitch with the combo.

### Hoop Shot (arcade aim, 2D)
- **controls:** `handleInput()`: the mouse cursor is the aim point on the hoop plane (`unproj()`), a click shoots; touch swipes (direction aims, length = power) through the same `unproj()`; `drawGuide()` previews the arc.
- **bot:** `botPick()` rolls swish / rim / miss from the level's mix; `botAim()` leads the moving hoop and the wind, then swipes through the real input path.
- **juice:** a small 3D court in metres drawn through `proj()`; ball vs torus rim (`rimCollide()`) and backboard banks; `punch()` camera on big shots.
- **near-miss:** `doomCheck()` marks the shot that would tie or win in the final seconds; `startRattle()` rolls it around the rim through the buzzer and out.

### Helix Drop (arcade, 3D)
- **controls:** `control()`: hoverSteer, the cursor x is the tower angle (one screen width = one turn, anchored where the mouse takes over), touch = relative drag, ←/→; the tower eases with a speed cap.
- **perf:** ring wedges are one InstancedMesh (`wedgeGeo()`, `writeRing()`); debris, splats and trail are pooled; `keepPrev()` + `camStep()` interpolate with `alpha`.
- **bot:** `botPlan()` simulates the landing through the real follow lag (`timeToLand()`, `simTh()`), prefers gaps that line up with the ring below (FIREBALL chains), never lands on red.
- **near-miss:** `adCheck()` → `armDoom()` / `doomSpin()`: the last ring above the golden base turns red and spins under the ball in slow motion → `doomSplat()`.

### Coin Cascade (arcade, 3D)
- **controls:** `handleInput()` + `aimFromScreen()`: a ghost coin follows the cursor along the slot, click drops, hold streams 5/s; touch tap = aim + drop; ←/→ + Space.
- **physics:** a 2.5D disc stack in typed arrays (`physStep()`, `resolve()`, `stepFalls()`), the pusher moves the pile rigidly; `fallFront()` wins, `fallSide()` loses; WALL / SHAKE in `stepPowers()`.
- **perf:** coins, gems and gifts are instanced (`writeBodies()`); the cabinet is baked into vertex-coloured geometry (`merge()`, `cabinetGeo()`).
- **near-miss:** `rubberBand()` ties the crown to the coins dropped; `startTrap()` / `stepTrap()` catch it on the lip, `failTrap()` → OUT OF COINS.

### Fruit Rush (arcade catcher, 2D) — `examples/catcher-2d`
- **HUD:** hearts + a right-side clock pill (`bump: false`) + a combo pill that only appears from x3; the target score lives on the progress track label.
- **bot:** `bot()` chases the lowest good item (golden weighted up) and shifts a basket-width away from bombs about to land.
- **juice:** combo pitch on `coin`, FEVER with slow-mo + confetti; near-miss: `startBombRain()` pops the fruit and drops a full-width bomb wall.

## Near-miss scenes in the showcase (for ideas)
| Game | Progress | What visibly goes wrong |
|---|---|---|
| Lane Dash | distance | A boulder drops behind the runner, look-back camera, CRUSHED at 96 % |
| Berry Maze | berries eaten | FOX AMBUSH: two foxes pincer the last corridor |
| Tilt Maze | route distance | MAGNET HOLE one tile before the cup pulls the ball off the last bridge |
| Marble Rush | distance | GIANT SWEEPER spins up and knocks the marble off the last beam, finish arch in view |
| Ball Run | balls in the tower | OUT OF BALLS: the column stops under the x10 ring, the rival tower pops its crown |
| Jelly Shift | distance | FINAL WALL: the hole closes below any shape, the jelly pancakes on it |
| Legion Rush | boss damage | Boss ENRAGED at 10 % HP, shockwave wipes the legion |
| Mob Blast | castle damage | GIANT RAGE: shockwave + full-width red wall, the clock hits 0:00 |
| Crowd Snatch | your size / MEGA's | MEGA RAGE: the boss crowd charges and absorbs yours |
| Dead Lane | boss damage | Boss enrages, final horde + smash wipe the squad |
| Ricochet Tanks | tanks destroyed | The last two-bounce shot glances off the boss shield: OUT OF SHELLS |
| Bubble Pop | birds freed | Out of shots with the last caged bird one match away; a ghost shot shows the winner |
| Star Swarm | boss damage | Shielded boss + unkillable SWARM FLOOD wall drains the hearts |
| Peak Dash | distance | Rival turbo, crosses the line 0.3 s ahead: "2ND! SO CLOSE" |
| Bumper Carnival | race distance | RIVAL TURBO, finish-line camera: rival 0.3 s ahead under the arch |
| Stair Race | tower climbed | RUBY RUSHES IN: the rival steals your last stair and bumps you down one step from the crown |
| Drift Dash | distance | RIVAL NITRO on the last hairpin, a bump sends the car off the edge, finish arch in view |
| Traffic Rush | distance | POLICE PINCER boxes the car in, a truck swerves in and brakes; crash with the finish in sight |
| Hook Dive | depth | A shark bites the line just above the golden whale-fish |
| Vine Swing | distance | The last branch snaps just before the temple steps |
| Pixel Quest | tower height | LAVA SURGE: a geyser catches the knight one jump below the open door |
| Sky Hop | height | STORM cloud parks above the bird, lightning zaps it and its platform |
| Blade Bloom | twin-boss damage | SWARM SURGE rings close in, hearts go one by one |
| Fire Rescue | pets saved | The last fire flares up and the water tank runs dry |
| Slice Frenzy | piñata slices | BOMB SHIELD ring around the piñata, the last slice clips a bomb |
| Sling Siege | goblins popped | KING'S LAST STAND: reinforced tower, the King teeters, recovers and laughs; out of vikings |
| Liquid Sort | merges done | Move limit one short: OUT OF MOVES, arrow shows the missing pour |
| Parking Panic | cars out | A delivery truck blocks the exit with 2 cars left |
| Screw Jam | screws removed | Tray full of greens, the last bar dangles on a green screw: NO SPACE, "needs 1 more slot" |
| Hexa Sort | bursts | ROCKSLIDE seals the cells around the best stack: BOARD FULL at 8/10 |
| Match Pile | toys cleared | Shelf fills with pairs while their twins sit in the locked crate: SHELF FULL |
| Save the Pup | time survived | The shield tip snaps (A GAP!) at 9 s, bees squeeze through |
| Draw Bridge | car progress | The rock lands behind the car, the far-edge joint snaps (CRACK!), the car falls |
| Pin Heist | gold collected | Last pin's lava pocket reaches the sack first, coins turn to stone |
| Pin Pour | coloured balls in the cup | The cup lid slams on the last batch, it rolls onto bomb ledges: one row short of FULL |
| Hero Rescue | pins in order + walk | The last gate pin drains a lava cup in front of the princess; the hero runs into it |
| Tower Takeover | strength share | COUNTER-ATTACK retakes the towers one by one |
| Merge Kingdom | boss damage | TROLL RAGE slam: a shockwave knocks out every unit one by one |
| Car Merge | race distance | RIVAL NITRO, photo-finish camera: lost by 0.20 s |
| Archer Defense | Warlord damage | LAST CHARGE: a rage aura blows arrows away, the Warlord breaks the wall |
| Lantern Ruins | route to the vault | COLD WIND: the lantern goes out, the Guardian rises between hero and vault |
| Hole Feast | round / size | Rival hole swallows the tower and takes 1st |
| Fish Feast | growth | SHARK FRENZY eats your target fish, then you |
| Paint Claim | land / goal | The sleeping King wakes and cuts your winning loop |
| Snake Party | length / King's | KING'S COIL: the King circles you in a tightening spiral |
| Cluck Tycoon | money earned | Time runs out, the delivery truck arrives 1 s late |
| Idle Miner | cash earned | LAST TRUCK: the shift whistle blows with the truck short of the bank |
| Sushi Cat | coins / goal | CLOSED sign drops, the last dish lands 1 s late: grey +N, TOO LATE! |
| Power Wash | clean % | HOSE BURST, the water gauge drains to empty |
| Rug Rescue | clean % | LOW BATTERY: the brush sputters and dies with one strip left |
| Knockout Party | course distance | SPINNER FRENZY bonks the hero into the water, a rival grabs the crown |
| Putt Party | route to the cup | LIP OUT: the winning putt curls round the cup while the last rival drops in |
| Hide & Seek | hiders found (+ catch meter) | LOW BATTERY: the torch flickers and dies, the last hider giggles and runs |
| Tug of War | rope share | CHAMPION'S MIGHTY HEAVE drags the bears into the mud |
| Stack Tower | floors | WIND GUST, the slab skids off and the top floors fall |
| Knife Master | boss knives | BOSS RAGE: the log reverses, the last knife hits a stuck one |
| Hoop Shot | score vs rival | LAST SHOT rattles around the rim through the buzzer and rolls out |
| Helix Drop | floors passed | The last ring above the golden base turns red and spins under the ball: splat |
| Coin Cascade | crown push to the lip | CAUGHT ON THE EDGE: the crown tips and catches while the last coins pour past |
| Fruit Rush | score | BOMB RAIN wall across the whole width |
