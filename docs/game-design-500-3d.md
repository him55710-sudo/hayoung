# 500일의 방: 3D 5-Room Escape UX Plan

## Goal

`500일의 방`은 로블록스처럼 바로 움직이고 탐색하는 3D 방탈출 게임으로 확장한다. 핵심은 거대한 오픈월드가 아니라, 5개의 밀도 있는 방을 순서대로 풀면서 여자친구와의 기억을 하나씩 여는 짧고 완성도 높은 경험이다.

## Design Principles

- Camera first: 중앙 시야는 방과 오브젝트를 보는 공간으로 비운다.
- UI second: HUD는 화면 가장자리로 밀고, 퍼즐 입력 순간에만 작은 패널을 띄운다.
- Every room teaches one mechanic: 한 방에 한 가지 핵심 상호작용만 새로 배운다.
- Romantic, not childish: 하트/장미를 쓰되 과한 분홍 테마가 아니라 따뜻한 조명, 사진, 편지, 달빛으로 감정선을 만든다.
- Fail softly: 틀려도 처벌하지 않고 빛/소리/진동 피드백으로 다시 시도하게 한다.

## Core Controls

Desktop:

- Move: `WASD`
- Camera: mouse
- Jump: `Space`
- Interact: `E`
- Inventory: `I`
- Hint: `H`
- Pause/settings: `Esc`

Mobile:

- Move: left virtual joystick
- Camera: right drag
- Jump: bottom-right icon button
- Interact: contextual bottom-right button
- Inventory: bottom drawer
- Hint: top-right lightbulb

## HUD Layout

Top-left: current room and objective

```text
Room 2/5 · 방향의 복도
달빛이 가리키는 방향 순서를 입력하자
```

Top-center: progress beads

```text
[♥] [→] [☾] [◆] [🔐]
```

Top-right: hint, settings, audio

Bottom-center: inventory quick slots, 5 slots maximum

Bottom-right: contextual action

```text
E 조사하기
E 열기
E 끼우기
```

Center: small reticle only. Avoid permanent text in the middle.

## Puzzle Overlay Rules

Puzzle panels appear only when the player intentionally interacts with a device.

- Lock panel: four large digits, clear backspace, confirm button.
- Direction panel: four arrow buttons plus entered sequence preview.
- Light panel: tappable symbols with glow feedback.
- Object combine panel: drag item from inventory to socket.
- Final panel: all collected tokens arranged into one clean confirmation scene.

Panels should be 8px radius, dark translucent glass, warm border, no nested card stacks.

## Five-Room Flow

### Room 1: 기억의 로비

Purpose: teach movement, interact, inventory, and numeric lock.

Scene:

- Warm room with desk, calendar, photos, locked door.
- Main clue: `D+500`.

Puzzle:

- Find `작은 금색 열쇠`.
- Inspect notebook to learn the code `0500`.
- Enter `0500` on a door lock.

Reward:

- `기억 토큰: 첫 만남`.

UX note:

- First interact target gets a soft pulsing outline.
- Objective text fades after 5 seconds, then returns only on hint.

### Room 2: 방향의 복도

Purpose: teach directional input puzzle.

Scene:

- Narrow gallery corridor with framed photos.
- Four wall signs: star, heart, moon, diamond.

Puzzle:

- Look at photo order and floor arrows.
- Input sequence using arrow keys or on-screen arrows.
- Example solution: `↑ → ← ↓`.

Reward:

- `방향 토큰: 같이 걸은 길`.

UX note:

- Wrong input gently resets the sequence with a low chime.
- Correct input lights the corridor in order.

### Room 3: 빛의 작업실

Purpose: teach environmental observation and symbol order.

Scene:

- Desk lamp, moon window, mirror, candle, rose dome.

Puzzle:

- Toggle lights in the correct order.
- Reflections reveal symbol order.
- Player must stand in marked positions to see hidden symbols.

Reward:

- `빛 토큰: 서로를 비춘 순간`.

UX note:

- This room should use spatial audio and light changes instead of long text.

### Room 4: 추억의 도시

Purpose: add Roblox-like movement skill without becoming frustrating.

Scene:

- Miniature night city representing date places.
- Small rooftops/platforms, glowing signs, safe jump gaps.

Puzzle:

- Collect three memory stamps by moving through a short 3D route.
- Each stamp opens a city gate.

Reward:

- `도시 토큰: 함께 간 곳들`.

UX note:

- No death pits. If the player falls, respawn immediately at the last checkpoint.
- Jump path must be readable through color and lighting.

### Room 5: 마지막 금고

Purpose: final emotional payoff.

Scene:

- Quiet vault room with a central heart lock and five token sockets.

Puzzle:

- Place the four prior tokens plus the final key into sockets.
- Final lock opens a letter/video/photo gallery.

Reward:

- Ending scene: `500일 동안 고마웠어. 다음 방은 우리 둘이 같이 만들자.`

UX note:

- The final room should slow down. No timer pressure, no noise, only a clear action path.

## Art Direction

Visual target:

- Roblox-like readable shape language, but with Unreal lighting polish.
- Warm amber interiors, cool moonlit accents, rose red for success states.
- Props are slightly oversized so important objects are readable at distance.

Room identity:

- Room 1: wood, paper, lamp, calendar
- Room 2: hallway, frames, arrows, brass plates
- Room 3: glass, mirror, moonlight, lamps
- Room 4: miniature city, blue night, warm shop windows
- Room 5: velvet dark, gold lock, soft rose glow

## UI Components

- `WBP_GameHUD`: room title, objective, progress beads, hint icon, inventory strip.
- `WBP_InteractPrompt`: contextual action near bottom-right.
- `WBP_LockPanel`: numeric lock.
- `WBP_DirectionPanel`: arrow input puzzle.
- `WBP_SymbolPanel`: sequence symbols for lights/mirrors.
- `WBP_EndingPanel`: final message and restart/continue buttons.

## Interaction States

Every interactive object should support:

- Idle: no outline.
- In range: thin warm outline.
- Focused: icon + short action prompt.
- Solved: rose-gold glow, no longer distracts.
- Locked: small lock icon and soft error sound.

## MCP Build Prompts

Once Unreal MCP is running, use prompts like:

```text
Create the five-room escape blockout for 500일의 방. Use Room_01 through Room_05, connect them left-to-right, place a puzzle device and reward pedestal in each room, and set warm romantic lighting.
```

```text
In Room_02_Direction_Gallery, add four arrow input plates on the wall and label the solution order. Make the path readable for a Roblox-like third-person player.
```

```text
Set up WBP_GameHUD concept: top-left room objective, top-center 5 progress beads, top-right hint/settings, bottom inventory strip, bottom-right interact prompt.
```

## Implementation Milestones

1. Unreal install and MCP connection.
2. Third-person character controller with interact trace.
3. Five-room blockout via MCP toolset.
4. HUD widgets and interaction prompts.
5. Puzzle blueprints for numeric lock, direction lock, light order, token sockets.
6. Art pass for props and lighting.
7. Ending scene and deployment/video capture.
