# Escape Cafe Masterplan Lazyweb Note

## Query Attempted

- `escape room game menu`
- Platform: desktop
- Purpose: ground the next web/game composition pass in real product UI references before changing the user-facing escape-game flow.

## Result

Lazyweb returned a locked search because the local skill pack is out of date.

Locked preview:

https://www.lazyweb.com/report/v2/search-locked/?q=escape%20room%20game%20menu&t=cfa1d339-f595-4c92-ac44-dce18ee2e4e8

Suggested update command from Lazyweb:

```bash
"$HOME/.lazyweb/bin/lazyweb-update" --host all
```

## Design Decision Kept

Because the locked result could not be used as a reference corpus, this pass focused on escape-room cafe structure instead of visual imitation:

- Room as clue system, not a decorative box.
- Each room has briefing threshold, search wall, central console, locked storage, evidence board, hint/reset fixture, and exit motion rig.
- Each room has two puzzle phases: search/collection, then device unlock.
- Carry rewards chain room `N` into room `N+1`.
- Unreal MCP generation starts from a labeled blockout that can later be replaced by licensed high-quality assets.
