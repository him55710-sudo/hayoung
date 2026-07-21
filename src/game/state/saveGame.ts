import { computeAvailablePuzzleIds, room1PuzzleIds } from "../data/room1Puzzles";
import type { GameState } from "./gameState";
import { createInitialGameState } from "./gameState";

const SAVE_KEY = "hayoung-500-room-save-v1";
const SAVE_VERSION = 1;

type SavePayload = {
  version: number;
  savedAt: number;
  state: GameState;
};

export function saveGame(state: GameState) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const payload: SavePayload = { version: SAVE_VERSION, savedAt: Date.now(), state };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {
    // Private-mode/quota errors must never break gameplay.
  }
}

export function loadSavedGame(): GameState | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return null;
    }
    const payload = JSON.parse(raw) as SavePayload;
    if (payload.version !== SAVE_VERSION || !payload.state) {
      return null;
    }
    const base = createInitialGameState();
    const completedPuzzleIds = (payload.state.completedPuzzleIds ?? []).filter((id) => room1PuzzleIds.includes(id));
    const state: GameState = {
      ...base,
      ...payload.state,
      completedPuzzleIds,
      availablePuzzleIds: computeAvailablePuzzleIds(completedPuzzleIds),
    };
    if (state.phase === "intro") {
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

export function hasSavedGame() {
  return loadSavedGame() !== null;
}

export function clearSavedGame() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
