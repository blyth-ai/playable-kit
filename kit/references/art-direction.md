# Art direction — the "expensive" playable-ad look

Higgsfield-grade playables look expensive because of models, light and camera, not because of
detail. Match that with code-drawn art: toy-like shapes, disciplined colour, warm light and camera moments.

## General
- Bright, toy-like, high contrast.
- Per game: 1 main colour, 1 accent, 1 neutral, plus a sky/ground pair. An `enum` palette param
  switches between 3 themes at once.
- Keep the middle of the screen clean. UI lives at the edges.

## 3D recipe (three.js)
- **Materials:** `MeshStandardMaterial({ flatShading: true, roughness: 0.8 })` or a 3-step `MeshToonMaterial`.
  Use few materials (merge them) and vertex colours.
- **Light:** `HemisphereLight(skyColour, groundColour, 1.1)` plus a warm `DirectionalLight` (~2.0) from the
  upper right, in front.
- **Fog and sky:** fog colour = horizon colour. The sky is a vertex-coloured sphere (top → horizon gradient).
- **Tone mapping:** if ACES shows a seam between fog and sky, use `NoToneMapping`.
- **Shadows:** no shadow maps. A soft, transparent blob shadow under each character.
- **Characters:**
  - Head : body ≈ 1 : 1.2 (cute proportions).
  - Eyes = white + black pupil + a small white highlight.
  - Limbs in pivot groups; run with `sin(t * k)`, squash and stretch on jumps.
  - Hero outline by inverted hull: a 4 % larger copy, black, back faces only.
- **Camera moments:** intro orbit or a drop-in from above → gameplay camera (follow with `damp`) →
  punch-in on the reward moment → pull-out or orbit on the end.
- **Performance:**
  - ≤ 60 draw calls, ≤ 60 k triangles.
  - `InstancedMesh` for repeated props.
  - `await renderer.compileAsync(scene, camera)` in `init`.
  - `ctx.softwareGL` → `antialias: false`, pixel ratio 1, no anisotropy.

## 2D recipe
- 2–3 px dark outline (`#1c1a2e`), a highlight at the top left, a shadow band at the bottom, a soft
  ellipse shadow on the ground.
- Draw sprites once to offscreen canvases (`ctx.sprites.canvas` / `pixel` / `outline`).
- 3 parallax layers (far silhouette, middle, front), light shafts, particles.
- Pixel art: draw into a low-resolution buffer and scale it up (`imageSmoothingEnabled = false`). See Legion Rush.

## UI
- Kernel skins (candy / frost / classic / parchment / neon) and a `uiAccent` that suits the game.
- Big numbers. Short toasts: "PERFECT!", "x3!", "BOSS!", "HARD LEVEL!".

## The poster
The card in Explore is what gets the click. The poster must show the most exciting moment: the
biggest crowd, the boss fight, the near-miss. Pick it with `capture-preset --at <seconds>` and look at
both `poster.jpg` and `poster-portrait.jpg`.

## Generated assets (optional, SPENDS CREDITS, needs the user's approval)
- With the Blyth MCP: `generate_3d_model { rig: true }` for the hero and boss, `generate_image` for a background.
- At most 3–4 assets per game. Ask the user for a credit ceiling first.
- The kernel supports `new GLTFLoader().parse(ctx.assets.arrayBuffer('hero'), '', onLoad)`; `tools/build.mjs`
  inlines the `assets/` folder.
