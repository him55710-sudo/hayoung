# Hayoung 500 Escape Game Project Rules

## Product Goal

- This is a 500-day anniversary escape-room game for 임현수 and 정하영. Do not regress copy, puzzles, docs, or Unreal files back to 400-day framing even though the Vercel project slug still contains `400`.
- The first screen should feel like a premium game intro, then enter a playable first-person 3D escape room. Avoid turning the app into a landing page.
- The game has five rooms, ten chained puzzles, three hints with escalating real-world penalties, room-specific ambience, and a heavenly 500-day ending.

## Quality Bar

- Prefer real gameplay improvements over static mockups. Every visual upgrade should survive desktop and mobile Playwright verification.
- Keep the web version high-quality even before Unreal is installed: cinematic lighting, tactile lock feedback, clear HUD, readable mobile controls, and nonblank WebGL canvas.
- Preserve the current low-friction performance strategy: procedural geometry/textures, capped render scale, graphics quality modes, and no large uncompressed assets.
- Any UI work should use Lazyweb first for references, then leave a short report under `.lazyweb/`.

## Verification

Run these before deploy after meaningful changes:

```powershell
npm run build
npm run verify:game
npm audit --omit=dev
```

For visual/gameplay spot checks, also run:

```powershell
node C:\Users\임현수\.codex\skills\develop-web-game\scripts\web_game_playwright_client.js --url http://127.0.0.1:5173/ --actions-file C:\Users\임현수\.codex\skills\develop-web-game\references\action_payloads.json --iterations 1 --pause-ms 300 --screenshot-dir output\web-game-current
```

## Unreal / MCP State

- Unreal project scaffold lives at `unreal/Hayoung500.uproject`.
- `scripts/setup-unreal-58.ps1` checks Epic Games Launcher, Unreal Editor, the `.uproject`, and the MCP endpoint.
- As of 2026-06-23, Epic installer MSI exists at `C:\Users\임현수\Downloads\EpicInstaller-20.1.0.msi`, but Unreal Editor is not installed. Windows UAC approval is required; do not approve UAC prompts on behalf of the user.
- Use the `unreal-58-mcp-connect` skill before changing Unreal MCP setup.

## Deployment

- GitHub repo: `him55710-sudo/hayoung`.
- Vercel project: `mongben/hyunsu-hayoung-400`.
- Production URL: `https://hyunsu-hayoung-400.vercel.app`.
- Use production deploy only when changes should go live.
