# Escape Room Research And Quality Harness

## What This Project Should Learn From Korean Escape Rooms

- Korean escape-room cafes commonly divide rooms into lock-heavy rooms and device/sensor-heavy rooms. For a first personal web version, keep a visible lock/device mix so the player can understand what kind of answer each clue wants.
- Beginner-friendly rooms benefit from a linear or lightly chained flow. Each solved object should make the next object feel newly relevant instead of leaving the player to brute-force every prop.
- Use clue links that are visible in the room world: color, physical position, lighting, sound, material, shape, or repeated symbol. Avoid random puzzles that do not belong to the room story.
- Keep each puzzle's answer self-validating. If the answer is correct, the lock should visibly move, a bolt should slide, the next clue should light up, and the room should give a small success moment.
- A room should have a clue map before final puzzle writing. For this project, the current dependency chain is `1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10`.

## 2026-06-23 Research Refresh

- Korean beginner guides frame a normal escape-room cafe as a timed room experience where players find keys, passwords, and hints to escape, commonly around a 60-minute session. This web game should therefore make progress pressure readable without making the anniversary feel stressful.
- Korean guide material also notes that first-time players often receive 2-3 hints from staff. The current 3-hint system is directionally right, but it needs to feel intentional; the `Hint Contract` HUD turns hints into a playful promise instead of a hidden counter.
- Booking and price friction show up in Korean cafe guides: players often need to reserve ahead, and the experience is not cheap. The web game should feel generous and polished from the first screen because it is replacing a paid date-like experience.
- Common lock families to support over time: padlock/key, numeric keypad, word lock, directional lock, combination dial, disguised diversion lock, cryptex-style word cylinder, and magnetic/electronic cabinet locks.
- Beginner advice emphasizes scanning the whole room, collecting suspicious objects, rechecking opened containers, and communicating discoveries. For a single-player web game, the UI needs to do the communication work: objective tracker, clue chips, inventory, and room-lighting changes should repeatedly answer "what became relevant now?"
- Digital lock tools tend to expose problem, hint, answer, PIN result, and QR-style entry. This project can borrow the clarity of digital puzzle tooling while keeping the physical romance of 3D locks.

## 2026-06-28 Escape-Cafe Spatial Model

Real escape-room cafe rooms should be treated as clue systems, not decorated boxes. Each room in this project should now include these zones:

- Briefing threshold: the first meter inside the room should announce the emotional beat, current date range, and what kind of lock language the room uses.
- Search wall/shelf zone: the player should see drawers, frames, documents, receipts, notes, tape, residue, and one or two suspicious containers before opening the modal UI.
- Central interaction console: the 3D object that launches puzzle input must look like the lock type, such as keypad, direction rail, word wheel, scanner, or final gate.
- Locked cabinet/drawer: every answer should open a physical target, not only advance a counter.
- Evidence board: clue cards, pins, string links, floor cables, or light trails should show why one object belongs to the next object.
- Hint/reset fixture: a small staff-room cue, intercom, lamp, or receipt printer should make hints feel diegetic rather than shameful.
- Exit door motion rig: bolt, shackle, hinge, seam light, and sound cue should visibly confirm the solve.

Item composition should stay consistent across all five rooms:

- Containers: drawers, cabinets, photo frames, receipt boxes, cloud plinths.
- Locks: numeric keypad, directional rail, choice/magnetic drawer, word/symbol wheel, final vow gate.
- Clue media: diary pages, photos, receipts, rain marks, torn notes, star chart, final letter.
- Feedback devices: bolt slides, scanner glow, lamp stages, string/link brightening, room ambience shift.
- Carry rewards: key, token, heart shard, constellation pin, final letter piece. These should move from room to room conceptually so the five rooms feel chained.

Puzzle composition should use a two-step room loop:

- Puzzle A is search/collection. It makes the player inspect the room and earn a physical carry reward.
- Puzzle B is device/lock execution. It consumes the reward and opens the exit path.
- The reward from room `N` should become the first meaningful prop in room `N+1`.
- The final room should ask the player to combine the four earlier rewards before confirming the 500-day vow.

Unreal MCP generation should therefore start with `HayoungEscapeCafeMasterplanTools.create_escape_cafe_500_masterplan`, then upgrade asset quality in passes: replace blockout cubes with Nanite-ready props, convert lock labels into Blueprint unlock actors, attach ambience trigger volumes, then run lighting/post-process polish.

## Five-Room Puzzle Blueprint

| Room | Emotional beat | Lock feel | Puzzle chain direction | Audio direction |
| --- | --- | --- | --- | --- |
| 1. 풋풋한 시작의 방 | first 100 days, diary/photo discovery | numeric lock, hidden key/photo slot | diary page numbers unlock photo frame, frame reveals next digit/order | warm piano pad, pencil/page sounds |
| 2. 조금 더 가까워진 방 | cafe promise, shared routine | choice lock, cafe token/device | receipt marks choose seat/order, solved token opens promise drawer | cafe room tone, cups, soft bell |
| 3. 비가 오던 고백의 방 | rain, repair, trust | directional lock, broken-heart switch | raindrop trail gives direction sequence, switch restores heart light | rain loop, low strings |
| 4. 서로를 잇는 방 | notes, bridge, memory | symbol/word lock, note bridge | note fragments form symbol order, bridge lights point to word/sigil | night city pad, paper flutter |
| 5. 500일의 문 | future promise and letter | memory lock, final confirmation gate | four room rewards align into final date/vow, final `YES` opens letter | celestial choir shimmer |

## Design Risks To Avoid

- Random-code puzzles: every code should be visible in the room art before the player opens the modal.
- Samey locks: numeric, direction, memory, symbol, and final confirmation should feel mechanically different in both 3D object and modal UI.
- Hint shame: the hint system should feel like a funny couple contract, not a failure message.
- Overdecorated mobile HUD: mobile controls must stay reachable; any new panel must have a deterministic position and avoid the joystick/look pad.
- Static beauty shots: screenshots should resemble the actual playable scene. When visual targets improve, verify through WebGL screenshots, not only generated references.

## Current Game Decisions

- Camera: first-person, eye-height camera with optional pointer-lock mouse look.
- Embodiment: desktop first-person hands, flashlight, heart-key, hair strands, skirt silhouette, and H/Y name charm; mobile keeps the avatar cue small and hides the flashlight beam to protect controls.
- Room clue props: each room now has a readable clue shelf, including diary/photo, cafe chairs/ring, broken-heart/rain, notes/bridge, and compass/future-ribbon clusters.
- Final room: centered spawn, photo corridor, cloud stepping stones, and luminous gate to make the finale read immediately after room transition.
- Memory assets: six replaceable files in `public/memories` feed both the HTML ending timeline and final-room Three.js photo frames.
- Puzzle count: 10 total, 2 per room.
- Puzzle forms: numeric lock, direction lock, memory/photo choice, symbol lock, final confirmation.
- Puzzle input: modal locks now use tactile numeric pads, direction pads, and choice chips while keeping the keyboard input for accessibility and automation.
- Physical device kits: each room now adds a distinct 3D console kit so the puzzle surface changes from diary/photo slot to cafe tokens, rain-direction rail, note bridge, and finale prism gate.
- Room clear moment: after each non-final room's two puzzles, a centered completion overlay shows the earned clue rewards and next room CTA.
- Hint system: 3 uses, escalating real-world penalties, now presented as a stamped `Hint Contract` ticket HUD on desktop and mobile.
- Room audio: procedural Web Audio ambience per room, so the game has room-specific BGM without shipping large audio files yet.
- Graphics quality: top-right HUD cycles cinematic, balanced, and performance modes. The modes cap render pixel ratio and tune bloom, shadows, and dust so high-end machines keep the richer image while weaker devices can lower GPU cost.
- Cinematic atmosphere: each room now has soft alpha-textured light shafts, floor reflection ribbons, and room-specific rain, night-city, or heaven-gate light layers. Performance mode disables this atmosphere layer.
- Cinematic camera: the first-person camera now has subtle movement roll, FOV breathing near interactables, and room/unlock-aware ACES exposure ramping.
- Screen post-FX: the playfield has a soft vignette, fine film grain, scanline texture, and a separate unlock flash layer below the HUD.
- Calm HUD: secondary HUD panels dim while the player is moving, then restore clarity near interactables or on hover so the room art and lock device stay dominant.
- Interaction focus: the active puzzle console has distance-reactive reticle/button styling plus a restrained in-world floor glyph, lock halo, and focus light.
- Unlock feedback: correct answers trigger latch lift, door seam glow, sliding bolts, hinge/handle motion, gear/dial motion, unlock sparks, and a screen flash.
- Collision: room bounds now include a solid stop-zone around the central puzzle console so the player can approach it without walking through the device.
- Lived-in set dressing: rooms include floor scuffs, footprints, clue tape, wall tags, shelf props, and room-specific residue so they read less like empty blockouts.
- Performance: procedural geometry, cached procedural material textures, shared simple materials, pixel ratio capped by graphics mode, bloom strength kept moderate.

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
- graphics quality metadata is exposed through `render_game_to_text`
- graphics quality cycling lowers the canvas render buffer in performance mode
- cinematic atmosphere metadata is exposed through `render_game_to_text`
- cinematic camera, screen post-FX, and central console collision metadata are exposed through `render_game_to_text`
- calm HUD metadata is exposed through `render_game_to_text`
- lived-in environment detail metadata is exposed through `render_game_to_text`
- room-clear overlays appear after every non-final room's second solved puzzle
- all 10 placeholder puzzles still solve after room-transition spawn reset
- WebGL canvas is not blank on desktop and mobile
- all 10 placeholder puzzles can be solved
- ending state is reached
- desktop and mobile hint use creates the contract ticket HUD, exposes active penalty metadata, and keeps the used penalty through the ending state
- room-specific physical device-kit metadata is exposed so the five-room console variation remains testable

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
- Korean beginner guide on 60-minute rooms, 2-3 hints, reservation, and cost expectations: https://chocoff.tistory.com/499
- Escape Roomers guide to common lock types including padlocks, numeric locks, word locks, directional locks, combination locks, diversion locks, cryptex locks, and magnetic cabinet locks: https://www.escapetheroomers.com/post/pro-tips-on-how-to-unlock-any-lock-in-an-escape-room
- Escape Lock digital puzzle toolkit article on problem, hint, answer, and PIN-style lock construction: https://h1guitar.tistory.com/373
- Big Escape Rooms guide on clue maps and flow: https://www.bigescaperooms.com/design-an-escape-room-game/
- Red Door guide on setting, clue discovery, and gameflow: https://reddoorescape.com/blog/blog-the-process-of-designing-an-escape-room/
- LazyCodex / Oh My OpenAgent repository: https://github.com/code-yeongyu/oh-my-openagent
- LazyCodex repository and install notes: https://github.com/code-yeongyu/lazycodex
- LazyCodex configuration notes on model routing, hooks, skills, agents, and doctor diagnostics: https://github.com/code-yeongyu/lazycodex/blob/main/packages/web/content/docs/configuration.md
- Three.js postprocessing docs: https://threejs.org/docs/#manual/en/introduction/How-to-use-post-processing
- Three.js UnrealBloomPass docs: https://threejs.org/docs/#examples/en/postprocessing/UnrealBloomPass
