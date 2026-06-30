# Hayoung 500 Escape Game Design System

## 1. Atmosphere & Identity

Hayoung 500 feels like a premium romantic escape cafe rendered as a playable first-person memory room. The signature is cinematic warmth: off-black theater darkness, honeyed lock light, tactile brass hardware, paper clues, and personal memories rebuilt as symbolic 3D set pieces rather than raw photo uploads.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/primary | --surface-primary | #FFF8EC | #0E1015 | Fullscreen game shell and intro base |
| Surface/secondary | --surface-secondary | #F6E8D0 | #151116 | HUD glass, modal panels, lower-contrast areas |
| Surface/elevated | --surface-elevated | #FFFFFF | #21161A | Puzzle device faces, active cards |
| Text/primary | --text-primary | #21161A | #FFF8EC | Main copy, HUD titles |
| Text/secondary | --text-secondary | #675B4B | #D9C6A8 | Captions, room context |
| Text/tertiary | --text-tertiary | #8E806C | #9D8E78 | Muted metadata |
| Border/default | --border-default | #E7CDA6 | #5A4633 | Device outlines, HUD dividers |
| Border/subtle | --border-subtle | #F0DEC2 | #2D241D | Quiet separations |
| Accent/primary | --accent-primary | #B83F5C | #FF7D8E | Primary actions, lock energy |
| Accent/secondary | --accent-secondary | #B27A35 | #FFD88A | Memory highlights, brass light |
| Accent/cool | --accent-cool | #427A96 | #8FD7FF | Moonlight, portal accents |
| Status/success | --status-success | #2F7C57 | #6EE7B7 | Correct puzzle feedback |
| Status/warning | --status-warning | #B76A22 | #FFB172 | Hint penalty emphasis |
| Status/error | --status-error | #A93D43 | #FF6F7C | Incorrect answer feedback |
| Status/info | --status-info | #386E99 | #92C7FF | Room metadata and navigation |

### Rules

- The game uses dark mode as the production surface.
- Warm accents carry romance and puzzle reward; cool accents carry Unreal-style portal depth.
- Do not upload personal face photos to the public web build unless the user explicitly asks for public deployment of those assets.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | 64px | 600 | 1.04 | 0 | Intro title |
| H1 | 42px | 700 | 1.12 | 0 | Major game overlays |
| H2 | 28px | 700 | 1.22 | 0 | Puzzle modal headings |
| H3 | 20px | 700 | 1.35 | 0 | HUD and panel titles |
| Body/lg | 17px | 500 | 1.72 | 0 | Intro support copy |
| Body | 15px | 500 | 1.55 | 0 | HUD copy, modal body |
| Body/sm | 13px | 600 | 1.45 | 0 | Status rows |
| Caption | 11px | 800 | 1.35 | 0.04em | Device labels and metadata |

### Font Stack

- Primary: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Display: Georgia, "Times New Roman", serif
- Mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace

### Rules

- Letter spacing remains 0 except small technical captions.
- Game HUD text must stay readable on mobile and never overlap the 3D controls.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a base of 4px.

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Tight icon alignment |
| --space-2 | 8px | Button inner groups |
| --space-3 | 12px | Compact HUD rows |
| --space-4 | 16px | Standard panel padding |
| --space-5 | 20px | Intro copy and puzzle spacing |
| --space-6 | 24px | Modal and HUD card padding |
| --space-8 | 32px | Large panel separation |
| --space-10 | 40px | Major intro spacing |
| --space-12 | 48px | Fullscreen overlay rhythm |

### Grid

- The main gameplay surface is always full viewport.
- HUD panels sit above the WebGL canvas and must not block the center reticle.
- Mobile controls reserve the lower 28dvh for touch input.

### Rules

- Use min-height: 100dvh for app screens when CSS is changed.
- Avoid card nesting; HUD panels are overlays, not page sections.

## 5. Components

### Fullscreen Game Surface
- **Structure**: React shell, WebGL canvas, HUD overlays, mobile controls.
- **Variants**: intro, game, ending.
- **Spacing**: --space-4 to --space-8 around overlays.
- **States**: idle, moving, interactable, unlocking, room transition.
- **Accessibility**: keyboard movement and button controls remain available.
- **Motion**: first-person bob, focus pull, unlock flash, room transition veil.

### Poster Theme Select
- **Structure**: cinematic intro background, three poster cards, one start-confirm panel.
- **Variants**: playable theme, selected theme, locked coming-soon themes.
- **Spacing**: --space-3 to --space-6 inside poster cards; --space-8 around the theme rail on desktop.
- **States**: idle, selected, locked, hover/focus, ready-to-start.
- **Accessibility**: theme cards are real buttons with pressed state and descriptive labels.
- **Motion**: poster scale, card lift, and the evasive Yes button only after Theme 01 is selected.

### Puzzle Device Modal
- **Structure**: case panel, prompt, answer input, device readout, action row.
- **Variants**: locked, active, solved feedback.
- **Spacing**: --space-4 to --space-6.
- **States**: default, focus, incorrect, solved, disabled.
- **Accessibility**: visible focus ring and keyboard-submit support.
- **Motion**: short transform/opacity transitions only.

### Unreal Room Mirror Set
- **Structure**: reference-led Room 01 stations: left notice/desk, 2x2 memory wall, violin glass case, music cabinet, 3x3 floor puzzle, beef board, steak table, and glowing exit door.
- **Variants**: Room 01 UE 5.8 MCP mirror, later room expansions.
- **Spacing**: fixed 3D world units with a clear central first-person path and no generic clutter in the first room.
- **States**: passive, focus glow, unlocked glow.
- **Accessibility**: represented in `window.render_game_to_text` for automated inspection.
- **Motion**: subtle practical-light breathing, lock response, and exit-door glow.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 120ms | ease-out | Button press and focus |
| Standard | 240ms | ease-in-out | HUD state changes |
| Emphasis | 620ms | cubic-bezier(0.16, 1, 0.3, 1) | Unlock and room transition |
| Gameplay | frame-timed | lerp/easeOutCubic | Camera, rig, lights |

### Rules

- Animate transform, opacity, light intensity, material opacity, and camera values.
- Avoid layout animations while the WebGL surface is active.
- Respect reduced motion for CSS-only decorative movement when adding new CSS.

## 7. Depth & Surface

### Strategy

Mixed, because this is a game UI: tonal-shift for HUD glass, cinematic colored glow for locks, and restrained inset shadows for device surfaces.

| Level | Value | Usage |
|-------|-------|-------|
| Subtle glow | 0 0 18px rgba(255, 216, 122, 0.22) | Passive memory cues |
| Device shadow | 0 18px 60px rgba(0, 0, 0, 0.38) | Puzzle modal and intro threshold |
| Unlock glow | 0 0 72px rgba(255, 125, 142, 0.38) | Correct answer and door motion |
