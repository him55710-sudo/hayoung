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
- Added lock-device modal previews for numeric, direction, symbol, and final locks.
- Added unlock feedback: ring/bolt/gear/door animation plus screen flash.
- Added richer procedural room geometry: planks, ceiling beams, desk, lockbox, photo wall, cafe table, rain/cracks, city window, cloud path, light beams, particles.
- Upgraded the central lock device into a more tactile control console with direction pads, dial rings, a heart padlock, scanner line, status lights, magnifying-glass prop, diary ribbon, and wood front panels.
- Added cached procedural wood/plaster/fabric/paper/metal textures plus wall panels, baseboards, crown molding, cable detail, and floor light rails.
- Converted the playable anniversary copy, final room, final lock answer, docs, and Unreal project scaffold from 400-day to 500-day framing while preserving the existing Vercel project URL.
- Tuned bloom/exposure and split shared materials so small status lights do not over-brighten the whole room.
- Pulled the first-person start camera slightly back so the room reads more like a playable space.
- Compressed the desktop and mobile HUD, including a mobile grid fix so icon actions no longer overlap the room objective bar.
- Added `scripts/verify-game.mjs` and `npm run verify:game` for repeatable Playwright validation.
- Hardened `scripts/verify-game.mjs` with DOM-click fallback for fixed HUD controls, explicit close handling, optional `DEBUG_GAME_VERIFY=1` file logging, and timeouts for modal transitions.
- Added `docs/escape-room-research-and-quality.md`.
- Created global Codex skill `~/.codex/skills/unreal-58-mcp-connect` and validated it with `quick_validate.py`.

## Current QA

- `npm run build` passes.
- `npm run verify:game` passes locally.
- `npm audit --omit=dev` passes with 0 vulnerabilities.
- Latest visual QA screenshots inspected: `output/playwright/500-fpv-hands-desktop-tuned.png` and `output/playwright/500-fpv-hands-mobile-clean.png` (ignored artifacts).
- Unreal Python toolset compiles with `python -m py_compile`.

## Known Limitations

- Visual quality is improved but still not final paid-game quality. It is now a richer procedural prototype, not a real asset-authored Unreal/Steam-level scene.
- Real couple photos are not inserted yet.
- Puzzle prompts and answers are placeholders awaiting user-provided content.
- BGM is procedural oscillator ambience; replace with authored or open-licensed loops later if desired.
- High-end GLB room props, hand/flashlight model, compressed textures, and better collision are still future art/tech passes.
- LazyCodex was researched but not blindly installed because it modifies global Codex config. The safe equivalent added here is a local verification harness and persistent project docs.

## Next TODOs

- Replace placeholder puzzle prompts and answers with user-provided real puzzle content.
- Replace placeholder photo frames with actual couple photos when the user sends them.
- Add authored GLB assets and use Draco/KTX2 compression for high detail without heavy load.
- Consider `howler` if real music loops replace Web Audio ambience.
- Consider `three-mesh-bvh` if raycasting/collision with imported rooms becomes heavy.
- Run `npm run build`, `npm run verify:game`, and deployed `GAME_URL` verification before each production deploy.
