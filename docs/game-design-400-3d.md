# 400일의 방: 3D Escape UX Draft

## Core Experience

임현수와 정하영의 400일 기념 웹사이트는 웹페이지가 아니라 풀스크린 3D 방탈출 게임처럼 시작한다. 첫 화면에서 사용자는 질문을 받고, `네` 버튼은 잠시 도망가다가 6초 뒤 클릭 가능해진다. 이후 하영이 캐릭터가 5개의 테마 방을 차례로 지나며 총 10개의 문제를 푼다.

## Entry Interaction

- Copy: `임현수와의 400일을 함께하실 준비가 되셨나요?`
- Desktop: 커서가 다가가면 `네` 버튼이 위치를 바꾼다.
- Mobile: 터치가 닿으면 버튼이 미끄러지듯 이동한다.
- 6초 뒤 버튼은 원위치로 돌아오고 클릭 가능해진다.

## Game Structure

총 5개 방, 방당 2문제, 총 10문제.

1. `1-100일`: 풋풋하고 밝은 시작의 방
2. `101-200일`: 조금 성숙하고 밝아진 방
3. `201-300일`: 고난과 화해의 방
4. `301-399일`: 지치고 다사다난하지만 서로 좋은 방
5. `400일`: 구름길, 섬광, 시간순 사진, 편지 엔딩

## HUD

- Top-left: `400일의 방`
- Top-center: `Room 1/5`, `Puzzle 0/10`, `Hints 3`
- Top-right: 힌트, 전체화면, 처음부터
- Left: 현재 방 제목/기간/감정 설명
- Bottom: 10칸 인벤토리
- Bottom-right: `E 조사하기` 또는 `다음 방`
- Mobile: 하단 좌측 방향 버튼, 우측 상호작용 버튼

## Hint Penalties

힌트는 최대 3번.

1. 현수한테 바나나우유 사주기
2. 현수한테 설빙 사주기
3. 현수랑 방탈출 하러가기

## Placeholder Puzzle Answers

정답과 상세 문제는 추후 사용자가 제공한다. 현재 초안의 임시 정답은 코드에 데이터로 분리되어 있다.

- 1번: `0100`
- 2번: `1`
- 3번: `URDL`
- 4번: `STAR`
- 5번: `0300`
- 6번: `LURD`
- 7번: `2`
- 8번: `MOON`
- 9번: `0400`
- 10번: `YES`

## Visual Direction

- Fullscreen Three.js canvas.
- Steam game polish with Roblox-readable proportions.
- No small embedded game frame; the whole viewport is the game.
- Each room has distinct lighting and color mood.
- Final room uses bright heavenly lighting, cloud path, and letter overlay.

## Next Art Pass

When real photos arrive:

- Replace placeholder frames with chronological couple photos.
- Build final 400-day cloud corridor around those photos.
- Add a higher fidelity character model or GLB asset.
- Add postprocessing bloom and better material textures.
