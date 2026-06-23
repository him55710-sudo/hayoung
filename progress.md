Original prompt: 여자친구와의 기념일 웹 방탈출 게임을 만들고, 400일을 지나 500일 기념 버전으로 긴급 전환한다. 임현수와 정하영의 500일 기념 웹사이트로, 처음에는 도망가는 `네` 버튼을 보여준 뒤 풀스크린 3D 방탈출 게임으로 이어지게 한다. 총 5개 방, 총 10문제, 힌트 3회 제한과 벌칙, 마지막 500일 방은 구름길과 사진, 섬광, 편지 엔딩으로 구성한다. 디자인 퀄리티가 핵심이며, 로블록스처럼 읽기 쉬우면서도 고퀄리티 스팀 게임 느낌의 1인칭 3D 웹 게임을 목표로 한다.

## Progress

- GitHub repository `him55710-sudo/hayoung` is connected and pushed.
- Vercel project `mongben/hyunsu-hayoung-400` is linked.
- Production URL: `https://hyunsu-hayoung-400.vercel.app`.
- Rebuilt the earlier 2D/third-person draft into a fullscreen Three.js first-person escape-game draft.
- Added evasive desktop/mobile `네` button intro.
- Added 5 themed rooms matching 1-100, 101-200, 201-300, 301-400, and 401-500 days.
- Added 10 placeholder puzzles, now with a linear dependency chain from puzzle 1 through puzzle 10.
- Added 3 hint penalties: banana milk, 설빙, real escape room.
- Added procedural per-room Web Audio ambience.
- Added first-person camera, pointer-lock mouse look, desktop/mobile movement, and a center reticle.
- Added a camera-attached Hayoung first-person hands/flashlight/heart-key rig with movement sway, unlock reaction, and mobile-safe beam hiding.
- Added stronger Hayoung identity cues: animated hair strands, skirt silhouette, H/Y name charm, and a compact player avatar chip in the inventory HUD.
- Added a stronger final-room memory corridor with placeholder chronological photo frames, cloud stepping stones, a luminous heaven gate, centered room-transition spawn, and reduced finale bloom clipping.
- Added six replaceable memory image slots under `public/memories` and connected them to both the ending timeline and final-room 3D photo frames.
- Added lock-device modal previews for numeric, direction, symbol, and final locks.
- Added tactile puzzle input pads: numeric keypad, direction pad, memory/symbol/final choice chips, sanitized answer input, and corrected direction preview layout.
- Added room-clear cinematic overlays after each non-final room's two puzzles, with earned clue chips and a next-room CTA.
- Added distance-reactive interaction focus for the central puzzle console: reticle/button focus states, in-world floor glyph, lock halo, and focus light.
- Upgraded unlock motion detail with latch/shackle lift, door seam glow, hinge/handle motion, sliding bolts, faster gears, and unlock sparks.
- Added unlock feedback: ring/bolt/gear/door animation plus screen flash.
- Added richer procedural room geometry: planks, ceiling beams, desk, lockbox, photo wall, cafe table, rain/cracks, city window, cloud path, light beams, particles.
- Added room-specific clue prop clusters for diary/photo, cafe promise, rain repair, note bridge, and future compass themes.
- Upgraded the central lock device into a more tactile control console with direction pads, dial rings, a heart padlock, scanner line, status lights, magnifying-glass prop, diary ribbon, and wood front panels.
- Added cached procedural wood/plaster/fabric/paper/metal textures plus wall panels, baseboards, crown molding, cable detail, and floor light rails.
- Converted the playable anniversary copy, final room, final lock answer, docs, and Unreal project scaffold from 400-day to 500-day framing while preserving the existing Vercel project URL.
- Tuned bloom/exposure and split shared materials so small status lights do not over-brighten the whole room.
- Pulled the first-person start camera slightly back so the room reads more like a playable space.
- Compressed the desktop and mobile HUD, including a mobile grid fix so icon actions no longer overlap the room objective bar.
- Added `scripts/verify-game.mjs` and `npm run verify:game` for repeatable Playwright validation.
- Hardened `scripts/verify-game.mjs` with DOM-click fallback for fixed HUD controls, explicit close handling, optional `DEBUG_GAME_VERIFY=1` file logging, and timeouts for modal transitions.
- Extended `scripts/verify-game.mjs` to assert room-clear overlays and CTAs after every non-final room.
- Added `docs/escape-room-research-and-quality.md`.
- Created global Codex skill `~/.codex/skills/unreal-58-mcp-connect` and validated it with `quick_validate.py`.
- Added HUD graphics quality cycling: cinematic, balanced, and performance modes now tune render pixel ratio, bloom strength, shadows, and dust without recreating the Three.js scene.
- Extended `scripts/verify-game.mjs` to assert graphics quality metadata and verify that performance mode lowers the canvas render buffer.
- Added a develop-web-game skill `node_modules` junction to the local project modules so the installed game harness can resolve Playwright from this workspace.
- Attempted Epic Games Launcher install through `winget`; the MSI downloaded successfully but the Windows Installer process remained stuck under administrator rights.
- Copied the official Epic MSI to `C:\Users\임현수\Downloads\EpicInstaller-20.1.0.msi`.
- Added `scripts/setup-unreal-58.ps1` to inspect Epic/UE state, restart the Epic installer with UAC, open the Launcher, launch `Hayoung500.uproject`, and check the Unreal MCP endpoint.
- Expanded the Unreal MCP Python toolset with `create_cinematic_500_escape_level`, which creates a denser five-room cinematic blockout with lock-motion reference parts, puzzle consoles, memory frames, cloud path, and accent lighting.
- Added web-side cinematic atmosphere layers: soft alpha-textured volumetric light shafts, floor reflection ribbons, room-specific rain/city/heaven layers, and performance-mode atmosphere hiding.
- Added a cinematic camera/post-FX pass: subtle first-person camera roll, focus-distance FOV breathing, room/unlock-aware ACES exposure ramping, soft vignette, fine film grain, and scanline texture.
- Added a solid central puzzle-console stop-zone so players can approach the lock device without walking through it.
- Added calm HUD behavior: secondary panels dim during movement and restore near interactables/hover, keeping the lock device and room art visually dominant while walking.
- Added lived-in room set dressing: floor scuffs, footprints, clue tape, wall tags, shelf props, and room-specific residue across the five rooms.
- Added a cinematic room-transition veil for major room/ending transitions: viewport-level letterbox bars, a bright horizontal energy slit, particle-like sweep lines, and animation-end cleanup so the effect survives heavy Three.js frames without blocking puzzle input.
- Split short puzzle unlock feedback from full room-transition VFX so ordinary lock solves stay responsive while room changes still feel cinematic.
- Hardened `scripts/verify-game.mjs` again: canvas waits now use `attached`, desktop rendering is parked before mobile verification, close timeout logging no longer false-positives, and successful runs write `output/playwright/verify-result.json`.
- Added a case-file objective HUD: current lock status, next clue title/detail, room solve meter, and compact mobile strip so the player always knows what to inspect next.
- Added a lock-status rail inside puzzle modals showing the room date range, lock relationship, and answer progress.
- Extended `scripts/verify-game.mjs` to assert objective tracker metadata.
- Added themed rear-door escape vistas for all five rooms: glowing breadcrumb floor lights, room-specific silhouettes, portal dressing, and a pulsing vista light so the exit direction reads as a real game objective.
- Added child-mounted door face details that rotate with the lock door: recessed panels, metal edges, rivets, and scratches to reduce the flat-card look during unlock animations.
- Extended `scripts/verify-game.mjs` to assert escape-vista metadata.
- Replaced the mobile 4-button movement UI with a translucent gamepad-style touch joystick and added a right-side look pad for drag-responsive first-person camera control.
- Added delegated mobile touch input plumbing via `window.hayoungTouchControls` so touch movement/look is consumed directly by the Three.js loop and can be verified deterministically.
- Extended `scripts/verify-game.mjs` to assert mobile touch controls by rotating the camera and moving the player in the mobile viewport.

## Current QA

- `npm run build` passes.
- `npm run verify:game` passes locally.
- `npm audit --omit=dev` passes with 0 vulnerabilities.
- Latest graphics quality QA screenshots inspected: `output/playwright/500-graphics-quality-desktop.png` and `output/playwright/500-graphics-quality-mobile.png`.
- `develop-web-game` Playwright harness ran successfully after resolving local Playwright; its default run captures the intro state, while gameplay flow is covered by `npm run verify:game`.
- Latest visual QA screenshots inspected: `output/playwright/500-room-clear-desktop-final.png`, `output/playwright/500-room-clear-mobile-final.png`, `output/playwright/500-focus-system-desktop-polished.png`, `output/playwright/500-focus-system-mobile-polished.png`, `output/playwright/500-player-chip-desktop.png`, `output/playwright/500-player-chip-mobile.png`, `output/playwright/500-ending-memory-timeline-polished.png`, `output/playwright/500-memory-slots-corridor.png`, and `output/playwright/500-unlock-motion-detail.png` (ignored artifacts).
- Unreal Python toolset compiles with `python -m py_compile`.
- `powershell -ExecutionPolicy Bypass -File .\scripts\setup-unreal-58.ps1` reports the Epic installer MSI exists, Unreal Editor is absent, and one elevated `msiexec` process is still active.
- Latest cinematic atmosphere screenshots inspected: `output/playwright/500-cinematic-atmosphere-room1-soft.png`, `output/playwright/500-cinematic-atmosphere-room3-rain-soft.png`, `output/playwright/500-cinematic-atmosphere-room5-heaven-soft.png`, and `output/playwright/500-cinematic-atmosphere-mobile-soft.png`.
- Latest post-FX/collision screenshots inspected: `output/playwright/500-postfx-collision-establishing.png`, `output/playwright/500-postfx-collision-focus-live.png`, and `output/playwright/500-postfx-mobile.png`.
- Latest calm HUD screenshots inspected: `output/playwright/500-calm-hud-moving-desktop.png` and `output/playwright/500-calm-hud-moving-mobile.png`.
- Latest lived-in detail screenshots inspected: `output/playwright/500-lived-in-details-room1-confirmed.png` and `output/playwright/500-lived-in-details-room5-confirmed.png`.
- Latest transition VFX screenshot inspected: `output/playwright/500-transition-vfx-immediate.png`.
- Latest case-file HUD screenshots inspected: `output/playwright/500-case-file-hud-desktop.png`, `output/playwright/500-case-file-puzzle-modal.png`, and `output/playwright/500-case-file-hud-mobile.png`.
- `develop-web-game` Playwright client ran successfully for the intro fallback capture at `output/web-game-case-file/shot-0.png`; gameplay-specific coverage remains in `npm run verify:game`.
- `npm run verify:game` passed after the transition split; it solved all 10 desktop puzzles, reached the ending, checked graphics quality modes, and verified mobile canvas pixels. Result file: `output/playwright/verify-result.json`.
- Latest escape-vista screenshot inspected: `output/playwright/500-escape-vista-door-detail.png`.
- `develop-web-game` Playwright client ran successfully again for the current intro fallback capture at `output/web-game-escape-vista/shot-0.png`.
- `npm run verify:game` passed after the escape-vista pass; it solved all 10 desktop puzzles, reached the ending, checked graphics quality modes, asserted escape-vista metadata, and verified mobile canvas pixels.
- Latest mobile touch-control screenshot inspected: `output/playwright/500-mobile-touch-controls.png`.
- Mobile input verification passed: the look pad changed yaw from `0` to `-0.3192`, and the move pad changed camera position from `(0, 3.25)` to `(-1.379, 0.18)`.
- `develop-web-game` Playwright client ran successfully again for the current intro fallback capture at `output/web-game-mobile-controls/shot-0.png`.
- `npm run verify:game` passed after the mobile-control pass; it now checks 10 desktop puzzle solves, ending, graphics quality, mobile canvas pixels, mobile-control metadata, look-pad rotation, and touch movement.
- Windows Computer Use detected a UAC consent window titled `Epic Games Launcher이(가) 사용자 권한을 요청하고 있습니다.` The installer cannot continue until the user manually approves that Windows security prompt.

## Known Limitations

- Visual quality is improved but still not final paid-game quality. It is now a richer procedural prototype, not a real asset-authored Unreal/Steam-level scene.
- Real couple photos are not inserted yet; replace the six `public/memories/memory-*.svg` placeholders when photos arrive.
- Puzzle prompts and answers are placeholders awaiting user-provided content.
- BGM is procedural oscillator ambience; replace with authored or open-licensed loops later if desired.
- High-end GLB room props, hand/flashlight model, compressed textures, and better collision are still future art/tech passes.
- LazyCodex was researched but not blindly installed because it modifies global Codex config. The safe equivalent added here is a local verification harness and persistent project docs.

## Next TODOs

- Replace placeholder puzzle prompts and answers with user-provided real puzzle content.
- Replace placeholder photo frames with actual couple photos when the user sends them.
- Add authored GLB assets and use Draco/KTX2 compression for high detail without heavy load.
- Finish Epic Games Launcher installation after approving or clearing the elevated Windows Installer process, then install UE 5.8 and run `ModelContextProtocol.GenerateClientConfig Codex`.
- Consider `howler` if real music loops replace Web Audio ambience.
- Consider `three-mesh-bvh` if raycasting/collision with imported rooms becomes heavy.
- Run `npm run build`, `npm run verify:game`, and deployed `GAME_URL` verification before each production deploy.
