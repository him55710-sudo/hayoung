import { computeAvailablePuzzleIds, getPuzzleById } from "../data/room1Puzzles";
import type { GamePhase, GameState, GraphicsQuality, SteakChoice } from "./gameState";
import { createInitialGameState } from "./gameState";

export type GameAction =
  | { type: "LOAD_STATE"; state: GameState }
  | { type: "RESET" }
  | { type: "SET_PHASE"; phase: GamePhase }
  | { type: "SELECT_THEME"; themeId: string | null }
  | { type: "ENTER_ROOM"; roomId: number }
  | { type: "SOLVE_PUZZLE"; puzzleId: string }
  | { type: "SET_FRAME_ORDER"; order: string[] }
  | { type: "SET_COLOR_SEQUENCE"; colors: string[] }
  | { type: "SELECT_FLOOR_CELL"; cell: number | null }
  | { type: "SELECT_STEAK"; steak: SteakChoice | null }
  | { type: "INSPECT_CLUE"; clueId: string }
  | { type: "USE_HINT"; puzzleId: string; stage: number }
  | { type: "SET_AUDIO"; enabled: boolean }
  | { type: "SET_GRAPHICS"; quality: GraphicsQuality };

function withUnique(list: string[], value: string) {
  return list.includes(value) ? list : [...list, value];
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "LOAD_STATE":
      return action.state;
    case "RESET":
      return createInitialGameState({
        audioEnabled: state.audioEnabled,
        graphicsQuality: state.graphicsQuality,
      });
    case "SET_PHASE":
      return { ...state, phase: action.phase };
    case "SELECT_THEME":
      return { ...state, selectedTheme: action.themeId };
    case "ENTER_ROOM":
      return { ...state, currentRoomId: action.roomId };
    case "SOLVE_PUZZLE": {
      const puzzle = getPuzzleById(action.puzzleId);
      if (!puzzle || state.completedPuzzleIds.includes(puzzle.id)) {
        return state;
      }
      const prerequisitesMet = puzzle.prerequisiteIds.every((id) => state.completedPuzzleIds.includes(id));
      const itemsHeld = (puzzle.requiredItems ?? []).every((id) => state.inventoryItemIds.includes(id));
      if (!prerequisitesMet || !itemsHeld) {
        return state;
      }
      const completedPuzzleIds = [...state.completedPuzzleIds, puzzle.id];
      const consumed = new Set(puzzle.consumedItems ?? []);
      let inventoryItemIds = state.inventoryItemIds.filter((id) => !consumed.has(id));
      for (const rewardId of puzzle.rewardItems ?? []) {
        inventoryItemIds = withUnique(inventoryItemIds, rewardId);
      }
      let inspectedClueIds = state.inspectedClueIds;
      for (const clueId of puzzle.rewardClueIds ?? []) {
        inspectedClueIds = withUnique(inspectedClueIds, clueId);
      }
      return {
        ...state,
        completedPuzzleIds,
        availablePuzzleIds: computeAvailablePuzzleIds(completedPuzzleIds),
        inventoryItemIds,
        inspectedClueIds,
      };
    }
    case "SET_FRAME_ORDER":
      return { ...state, frameOrder: action.order };
    case "SET_COLOR_SEQUENCE":
      return { ...state, colorSequence: action.colors };
    case "SELECT_FLOOR_CELL":
      return { ...state, selectedFloorCell: action.cell };
    case "SELECT_STEAK":
      return { ...state, selectedSteak: action.steak };
    case "INSPECT_CLUE":
      return { ...state, inspectedClueIds: withUnique(state.inspectedClueIds, action.clueId) };
    case "USE_HINT": {
      if (state.hintsUsed >= 3) {
        return state;
      }
      return {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        hintContracts: [...state.hintContracts, `${action.puzzleId}|${action.stage}`],
      };
    }
    case "SET_AUDIO":
      return { ...state, audioEnabled: action.enabled };
    case "SET_GRAPHICS":
      return { ...state, graphicsQuality: action.quality };
    default:
      return state;
  }
}
