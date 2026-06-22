# Escape Room Research And Quality Harness

## What This Project Should Learn From Korean Escape Rooms

- Korean escape-room cafes commonly divide rooms into lock-heavy rooms and device/sensor-heavy rooms. For a first personal web version, keep a visible lock/device mix so the player can understand what kind of answer each clue wants.
- Beginner-friendly rooms benefit from a linear or lightly chained flow. Each solved object should make the next object feel newly relevant instead of leaving the player to brute-force every prop.
- Use clue links that are visible in the room world: color, physical position, lighting, sound, material, shape, or repeated symbol. Avoid random puzzles that do not belong to the room story.
- Keep each puzzle's answer self-validating. If the answer is correct, the lock should visibly move, a bolt should slide, the next clue should light up, and the room should give a small success moment.
- A room should have a clue map before final puzzle writing. For this project, the current dependency chain is `1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10`.

## Current Game Decisions

- Camera: first-person, eye-height camera with optional pointer-lock mouse look.
- Embodiment: desktop first-person hands, flashlight, heart-key, hair strands, skirt silhouette, and H/Y name charm; mobile keeps the avatar cue small and hides the flashlight beam to protect controls.
- Room clue props: each room now has a readable clue shelf, including diary/photo, cafe chairs/ring, broken-heart/rain, notes/bridge, and compass/future-ribbon clusters.
- Final room: centered spawn, photo corridor, cloud stepping stones, and luminous gate to make the finale read immediately after room transition.
- Memory assets: six replaceable files in `public/memories` feed both the HTML ending timeline and final-room Three.js photo frames.
- Puzzle count: 10 total, 2 per room.
- Puzzle forms: numeric lock, direction lock, memory/photo choice, symbol lock, final confirmation.
- Puzzle input: modal locks now use tactile numeric pads, direction pads, and choice chips while keeping the keyboard input for accessibility and automation.
- Hint system: 3 uses, escalating real-world penalties.
- Room audio: procedural Web Audio ambience per room, so the game has room-specific BGM without shipping large audio files yet.
- Interaction focus: the active puzzle console has distance-reactive reticle/button styling plus a restrained in-world floor glyph, lock halo, and focus light.
- Unlock feedback: correct answers trigger latch lift, door seam glow, sliding bolts, hinge/handle motion, gear/dial motion, unlock sparks, and a screen flash.
- Performance: procedural geometry, cached procedural material textures, shared simple materials, pixel ratio capped, bloom strength kept moderate.

## Open-Source Usage

Already used:

- React and Vite for the app shell.
- Three.js for WebGL rendering.
- Three.js postprocessing `EffectComposer`, `RenderPass`, and `UnrealBloomPass`.
- Three.js `CanvasTexture` for lightweight wood, plaster, fabric, paper, and metal surface detail.
- Three.js primitive geometry for the current first-person hands, flashlight, heart-key, and beam placeholder before GLB assets arrive.
- Lucide React for HUD icons.
- Playwright for the verification harness.

Good future candidates:

- `@react-three/fiber` and `@react-three/drei` if the scene outgrows direct Three.js lifecycle management.
- `three-mesh-bvh` if collision, raycasting, or high-poly GLB room assets become heavy.
- `howler` if real music loops replace the current procedural ambience.
- `@dimforge/rapier3d-compat` if the game needs physics-driven drawers, objects, or puzzle props.
- Draco-compressed GLB assets and KTX2/Basis textures for high-quality rooms without huge network downloads.

## Quality Harness

Run these before deploy:

```powershell
npm run build
npm run verify:game
npm audit --omit=dev
```

`npm run verify:game` checks:

- intro copy appears
- runaway button actually moves
- app enters first-person game mode
- first-person embodied state is exposed through `render_game_to_text`
- interaction focus metadata is exposed through `render_game_to_text`
- all 10 placeholder puzzles still solve after room-transition spawn reset
- WebGL canvas is not blank on desktop and mobile
- all 10 placeholder puzzles can be solved
- ending state is reached

For deployed verification:

```powershell
$env:GAME_URL="https://hyunsu-hayoung-400.vercel.app"; npm run verify:game
```

## References Used

- Korean room-escape lock/device style and beginner-friendly linear flow note: https://brunch.co.kr/@angiethinks/13
- Korean room-escape device/lock ratio note: https://realitat32.tistory.com/6
- Korean room-escape cafe wiki on common locks/devices: https://escroom.fandom.com/ko/wiki/자물쇠_및_일반적인_장치의_종류
- The Codex escape-room design rules: https://thecodex.ca/13-rules-for-escape-room-puzzle-design/
- Escape-room beginner advice on searching the room and identifying locks/clues: https://www.reddit.com/r/escaperooms/comments/115jwnc/escape_rooms_tips_tricks_for_beginners/?tl=ko
- Big Escape Rooms guide on clue maps and flow: https://www.bigescaperooms.com/design-an-escape-room-game/
- Red Door guide on setting, clue discovery, and gameflow: https://reddoorescape.com/blog/blog-the-process-of-designing-an-escape-room/
- LazyCodex / Oh My OpenAgent repository: https://github.com/code-yeongyu/oh-my-openagent
- Three.js postprocessing docs: https://threejs.org/docs/#manual/en/introduction/How-to-use-post-processing
- Three.js UnrealBloomPass docs: https://threejs.org/docs/#examples/en/postprocessing/UnrealBloomPass
