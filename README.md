# 500일의 방

임현수와 정하영의 500일을 위한 풀스크린 1인칭 3D 웹 방탈출 게임 프로젝트입니다.

## 빠른 시작

```bash
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:5173`을 열면 게임을 볼 수 있습니다.

## 현재 구현

- 첫 화면: `임현수와의 500일을 함께하실 준비가 되셨나요?`
- 데스크톱: 커서가 가까워지면 `네` 버튼이 피하다가 6초 뒤 클릭 가능
- 모바일: 터치하면 버튼이 미끄러지듯 이동
- 게임: 풀스크린 Three.js 1인칭 3D 방탈출
- 구성: 5개 방, 총 10개 문제, 방마다 2문제
- 퍼즐 흐름: 1번부터 10번까지 단서가 이어지는 선형 의존 구조
- 퍼즐 입력 UX: 숫자패드, 방향패드, 기억/상징/최종 선택 칩이 정답 입력창과 동기화됨
- 힌트: 3회 제한, 사용 횟수별 벌칙 표시
- 배경음: 방마다 다른 절차형 Web Audio 앰비언스
- 잠금 연출: 정답 입력 시 잠금쇠 상승, 볼트 슬라이드, 기어 회전, 문 틈 발광, 힌지/손잡이 반응, 스파크 섬광
- 중앙 장치: 방향키 패널, 다이얼, 하트 자물쇠, 스캔 라인, 상태등이 있는 조작대형 잠금 장치
- 시각 품질: 절차형 목재/벽지/천/종이/금속 텍스처, 벽 패널, 몰딩, 바닥 라이트 레일
- 1인칭 체감: 하영이 시점의 손, 손전등, 하트 열쇠 리그와 이동/해금 반응 애니메이션
- 마지막 방: 시간순 사진 프레임 복도, 구름 발판, 발광 하늘문, 전환 시 중앙 스폰
- 엔딩 타임라인: `public/memories`의 6개 교체형 사진 슬롯이 HTML 엔딩 카드와 3D 최종방 복도에 함께 사용됨
- 모바일 HUD: 상단 상태/아이콘/방 제목이 겹치지 않도록 압축 배치
- 엔딩: 500일 하늘문, 구름길, 편지 오버레이

## 검증

```bash
npm run build
npm run verify:game
npm audit --omit=dev
```

검증 단계가 멈출 때만 디버그 로그를 남기려면:

```bash
$env:DEBUG_GAME_VERIFY="1"; npm run verify:game
```

배포 URL을 검증할 때:

```bash
$env:GAME_URL="https://hyunsu-hayoung-400.vercel.app"; npm run verify:game
```

## 배포

```bash
npm run build
npx vercel deploy
```

프로덕션 배포가 필요할 때만:

```bash
npx vercel deploy --prod
```

## 기획 문서

- [3D UX 기획](docs/game-design-500-3d.md)
- [한국 방탈출 리서치와 품질 하네스](docs/escape-room-research-and-quality.md)
- [Vercel/GitHub 연결](docs/vercel-github-setup.md)

## Unreal MCP

Unreal Engine 5.8에서 MCP 플러그인을 켜면 이 저장소 루트의 `.mcp.json`이 `http://127.0.0.1:8000/mcp`로 연결되도록 준비되어 있습니다.

자세한 절차는 [docs/unreal-mcp-setup.md](docs/unreal-mcp-setup.md)를 확인하세요.
