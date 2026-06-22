# 500일의 방

여자친구와의 500일을 위한 웹 방탈출 게임 프로젝트입니다.

현재 저장소는 Vercel 배포가 가능한 React + Vite 앱과 Unreal Engine 5.8 MCP 연결 준비 파일을 함께 담고 있습니다.

## 빠른 시작

```bash
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:5173`을 열면 게임 첫 화면을 볼 수 있습니다.

## 배포

```bash
npm run build
npx vercel deploy
```

Vercel 프로덕션 배포는 명시적으로 원할 때만 `npx vercel deploy --prod`를 사용하세요.

## Unreal MCP

Unreal Engine 5.8에서 MCP 플러그인을 켜면 이 저장소 루트의 `.mcp.json`이 `http://127.0.0.1:8000/mcp`로 연결되도록 준비되어 있습니다.

자세한 절차는 [docs/unreal-mcp-setup.md](docs/unreal-mcp-setup.md)를 확인하세요.
