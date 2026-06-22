Original prompt: 여자친구랑 400일 기념일이야. 임현수와 정하영의 400일 기념 웹사이트를 만들고, 처음에는 도망가는 `네` 버튼을 보여준 뒤 풀스크린 3D 방탈출 게임으로 이어지게 한다. 총 5개 방, 총 10문제, 힌트 3회 제한과 벌칙, 마지막 400일 방은 구름길과 사진, 섬광, 편지 엔딩으로 구성한다.

## Progress

- GitHub repository `him55710-sudo/hayoung` is connected and pushed.
- Vercel project `mongben/hyunsu-hayoung-400` is linked.
- Replaced the earlier 2D starter with a 400-day fullscreen Three.js escape-game draft.
- Added evasive desktop/mobile `네` button intro.
- Added 5 themed rooms matching 1-100, 101-200, 201-300, 301-399, and 400 days.
- Added 10 placeholder puzzles, 3 hint penalties, inventory, mobile controls, fullscreen action, and ending letter.
- Added `docs/game-design-400-3d.md`.
- Build currently passes with `npm run build`.

## Next TODOs

- Replace placeholder puzzle prompts and answers with user-provided real puzzle content.
- Replace placeholder photo frames with actual couple photos when the user sends them.
- Add higher fidelity GLB character/props or Unreal-exported assets.
- Add bloom/postprocessing pass and richer materials for a stronger Steam-like finish.
- Verify latest build visually in desktop and mobile browsers before each deploy.
