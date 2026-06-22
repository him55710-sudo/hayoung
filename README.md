# 400일의 방

임현수와 정하영의 400일을 위한 풀스크린 3D 웹 방탈출 게임 프로젝트입니다.

## 빠른 시작

```bash
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:5173`을 열면 초안 게임을 볼 수 있습니다.

## 현재 구현

- 첫 화면: `임현수와의 400일을 함께하실 준비가 되셨나요?`
- 데스크톱: 커서가 가까워지면 `네` 버튼이 도망가다가 6초 뒤 클릭 가능
- 모바일: 터치하면 버튼이 미끄러지는 느낌으로 이동
- 게임: 풀스크린 Three.js 3D 방탈출
- 구성: 5개 방, 총 10개 문제, 방당 2문제
- 힌트: 3회 제한, 사용 횟수별 벌칙 표시
- 엔딩: 400일 하늘문, 구름길, 편지 오버레이

## 배포

```bash
npm run build
npx vercel deploy
```

프로덕션 배포는 명시적으로 원할 때만 `npx vercel deploy --prod`를 사용하세요.

## 3D 5개 방 기획

로블록스처럼 움직이는 3D 방탈출 버전의 UX/퍼즐/방 구성은 [docs/game-design-400-3d.md](docs/game-design-400-3d.md)에 정리되어 있습니다.

## Unreal MCP

Unreal Engine 5.8에서 MCP 플러그인을 켜면 이 저장소 루트의 `.mcp.json`이 `http://127.0.0.1:8000/mcp`로 연결되도록 준비되어 있습니다.

자세한 절차는 [docs/unreal-mcp-setup.md](docs/unreal-mcp-setup.md)를 확인하세요.
