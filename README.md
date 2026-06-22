# 400일의 방

임현수와 정하영의 400일을 위한 풀스크린 1인칭 3D 웹 방탈출 게임 프로젝트입니다.

## 빠른 시작

```bash
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:5173`을 열면 게임을 볼 수 있습니다.

## 현재 구현

- 첫 화면: `임현수와의 400일을 함께하실 준비가 되셨나요?`
- 데스크톱: 커서가 가까워지면 `네` 버튼이 피하다가 6초 뒤 클릭 가능
- 모바일: 터치하면 버튼이 미끄러지듯 이동
- 게임: 풀스크린 Three.js 1인칭 3D 방탈출
- 구성: 5개 방, 총 10개 문제, 방마다 2문제
- 퍼즐 흐름: 1번부터 10번까지 단서가 이어지는 선형 의존 구조
- 힌트: 3회 제한, 사용 횟수별 벌칙 표시
- 배경음: 방마다 다른 절차형 Web Audio 앰비언스
- 잠금 연출: 정답 입력 시 링/볼트/기어/문 애니메이션과 섬광
- 엔딩: 400일 하늘문, 구름길, 편지 오버레이

## 검증

```bash
npm run build
npm run verify:game
npm audit --omit=dev
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

- [3D UX 기획](docs/game-design-400-3d.md)
- [한국 방탈출 리서치와 품질 하네스](docs/escape-room-research-and-quality.md)
- [Vercel/GitHub 연결](docs/vercel-github-setup.md)

## Unreal MCP

Unreal Engine 5.8에서 MCP 플러그인을 켜면 이 저장소 루트의 `.mcp.json`이 `http://127.0.0.1:8000/mcp`로 연결되도록 준비되어 있습니다.

자세한 절차는 [docs/unreal-mcp-setup.md](docs/unreal-mcp-setup.md)를 확인하세요.

