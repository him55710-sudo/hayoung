import { computeAvailablePuzzleIds } from "../data/room1Puzzles";

export type GamePhase = "intro" | "game" | "ending";
export type GraphicsQuality = "cinematic" | "balanced" | "performance";
export type SteakChoice = "alpero" | "hyunsu";

export interface GameState {
  phase: GamePhase;
  selectedTheme: string | null;
  currentRoomId: number;
  completedPuzzleIds: string[];
  availablePuzzleIds: string[];
  inventoryItemIds: string[];
  inspectedClueIds: string[];
  frameOrder: string[];
  colorSequence: string[];
  selectedFloorCell: number | null;
  selectedSteak: SteakChoice | null;
  hintsUsed: number;
  /** "<puzzleId>|<stage>" 형태로 발급된 힌트 계약 기록. */
  hintContracts: string[];
  audioEnabled: boolean;
  graphicsQuality: GraphicsQuality;
}

export function createInitialGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: "intro",
    selectedTheme: null,
    currentRoomId: 1,
    completedPuzzleIds: [],
    availablePuzzleIds: computeAvailablePuzzleIds([]),
    inventoryItemIds: [],
    inspectedClueIds: [],
    frameOrder: [],
    colorSequence: [],
    selectedFloorCell: null,
    selectedSteak: null,
    hintsUsed: 0,
    hintContracts: [],
    audioEnabled: true,
    graphicsQuality: "cinematic",
    ...overrides,
  };
}
