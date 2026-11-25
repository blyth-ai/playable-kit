# Genre playbook (14 genres)

Each entry: core loop · controls · dimension/camera · win/lose · key params · bot · pitfalls.
Start from `examples/runner-3d` for lane/3D games and `examples/catcher-2d` for 2D arcade games.
Near-miss recipes per genre (the L3 trap in AD mode): `references/ad-funnel.md` §2. Finished games to study: `references/showcase.md`.

## Runner
Loop: auto-run forward, switch lanes / jump to dodge, collect coins. · Controls: swipe L/R/up, tap screen halves, arrows/Space. · 3D chase cam behind hero (or 2D side view). · Win: reach finish distance; lose: hearts gone. · Params: runSpeed, speedGrowth, lives, obstacleRate, coinRate, coinValue, goalDistance, colours, cameraHeight. · Bot: look ahead in lane, move to a free lane, jump low hurdles. · Pitfalls: never block all lanes in one row; spawn far enough ahead.

## Shooter
Loop: aim/auto-fire at waves of enemies, upgrade fire rate, survive to the boss. · Controls: drag to move (auto-fire) or tap to shoot; arrows + Space. · 2D top-down vertical or 3D third person. · Win: clear N waves/boss; lose: HP 0 or enemy reaches base. · Params: fireRate, bulletDamage, enemyHp, enemySpeed, waveCount, spawnRate, powerupChance, colours. · Bot: track nearest enemy x, dodge projectiles. · Pitfalls: bullet pools; cap enemies on screen; readable projectiles.

## Crowd (gate runner)
Loop: run with a crowd, pass through math gates (+10, x2, −5), fight the crowd at the end. · Controls: drag horizontally. · 3D chase cam, crowd as InstancedMesh. · Win: crowd > boss army at the end; lose: crowd reaches 0. · Params: startCount, gateValues range, badGateChance, runSpeed, bossCount, unitColour, enemyColour. · Bot: choose the better gate (compare values). · Pitfalls: instancing for 100+ units; clamp count.

## Racing
Loop: steer a car around/along a track, overtake rivals, boost pads. · Controls: drag/tilt-like horizontal drag, arrows. · 3D chase cam or 2D top-down. · Win: finish 1st / before timer; lose: time out or crash limit. · Params: topSpeed, acceleration, rivalSkill, boostPower, laps/length, trafficRate, carColour, roadColour. · Bot: follow track centre, avoid traffic. · Pitfalls: frame-rate independent physics; keep track procedural (spline or segments).

## Party (obstacle course / elimination)
Loop: race through moving obstacles (spinners, pushers, falling tiles) to qualify. · Controls: virtual joystick drag + jump tap. · 3D third person, bright colours. · Win: reach the goal within top N; lose: time out / fall limit. · Params: obstacleSpeed, rivalCount, qualifyCount, jumpPower, playerSpeed, colours. · Bot: path along centre, jump at gaps. · Pitfalls: forgiving collisions; respawn at checkpoint.

## Adventure
Loop: explore a small level, collect keys/items, open the exit, avoid traps. · Controls: drag-joystick or on-screen arrows; keys. · 2D platformer side view or top-down. · Win: reach exit with key; lose: HP 0. · Params: moveSpeed, jumpPower, gravity, enemySpeed, trapCount, lives, collectibleValue, colours. · Bot: scripted waypoint follower over the generated level. · Pitfalls: generate level deterministically from ctx.rng; keep it one screen or a short scroll.

## Action
Loop: dash/slash enemies in short bursts, chain combos, defeat a mini-boss. · Controls: tap enemy / swipe direction to dash. · 2D or 3D arena, top-down. · Win: clear waves; lose: HP 0. · Params: dashSpeed, dashCooldown, enemyHp, enemyCount, comboWindow, damage, colours. · Bot: dash toward nearest enemy when cooldown ready. · Pitfalls: hit-stop and screen shake for juice; telegraph enemy attacks.

## Strategy (lane / tower defense)
Loop: place or upgrade units with a resource that ticks up; stop waves reaching the base. · Controls: tap a slot to build / upgrade. · 2D top-down board. · Win: survive N waves; lose: base HP 0. · Params: startGold, goldPerSec, towerCost, towerDamage, towerRange, enemyHp, enemySpeed, waveCount, colours. · Bot: build in the slot closest to the path entrance when affordable. · Pitfalls: show costs on slots; first wave trivially winnable.

## Maze
Loop: guide a ball/character through a maze to the exit, collect gems, avoid patrols. · Controls: swipe to move until wall, or drag joystick; arrows. · 2D top-down grid (or tilt-style 3D). · Win: reach exit; lose: caught / time out. · Params: mazeSize, moveSpeed, patrolCount, patrolSpeed, gemValue, colours. · Bot: BFS path to exit (grid). · Pitfalls: guarantee solvability (generate with DFS/backtracker from ctx.rng).

## Puzzle (sort / slide / match)
Loop: make moves that clear or sort pieces; limited moves or time. · Controls: tap to select/move, drag to slide. · 2D board. · Win: board solved; lose: out of moves. · Params: boardSize, colourCount, moveLimit, shuffleDepth, scorePerClear, colours. · Bot: greedy valid move (or solver for small boards). · Pitfalls: generate solvable states by scrambling a solved one.

## Pull the pin
Loop: pull pins in the right order so good stuff (balls, coins) flows to the goal and bad stuff (lava, enemies) doesn't. · Controls: tap/drag a pin to pull it. · 2D side view with simple physics (circles under gravity, segment colliders). · Win: enough good balls reach the goal; lose: hazard mixes in / reaches hero. · Params: ballCount, gravity, pinCount, hazardCount, levelCount, goalTarget, colours. · Bot: try pins in a precomputed safe order. · Pitfalls: write a tiny verlet/circle physics; cap ball count (≤ 200) and use pooling.

## Simulation (idle / tycoon / merge)
Loop: tap to produce, buy upgrades, watch numbers grow, reach a goal. · Controls: tap buttons / drag to merge. · 2D UI-forward scene. · Win: reach target money/level; lose: usually none → time cap ends with result. · Params: tapValue, upgradeCostGrowth, autoIncome, goalAmount, mergeLevels, colours. · Bot: buy the cheapest upgrade, tap repeatedly. · Pitfalls: big readable numbers; first upgrade within 5 s.

## Eat & Grow (hole.io / agar)
Loop: move around, swallow things smaller than you, grow, beat rivals before time runs out. · Controls: drag joystick. · 3D top-down (or 2D). · Win: biggest when time ends / eat target; lose: eaten by bigger rival. · Params: startSize, growthPerItem, itemCount, rivalCount, rivalSpeed, mapSize, timeLimit, colours. · Bot: chase nearest smaller item, flee bigger rivals. · Pitfalls: instanced props; sizes clearly comparable.

## Arcade (one-tap)
Loop: a single timing verb (stack, hop, flap, helix drop) with rising difficulty. · Controls: tap / Space. · 2D or simple 3D. · Win: reach target score; lose: one mistake (or lives). · Params: speed, speedGrowth, gapSize, perfectWindow, targetScore, colours. · Bot: act when the timing condition is met (compute from state). · Pitfalls: crisp timing window; "PERFECT!" feedback.
