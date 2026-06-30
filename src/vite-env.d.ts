/// <reference types="vite/client" />

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
    hayoungDebugSetCameraPose?: (pose: Partial<{ x: number; z: number; yaw: number; pitch: number }>) => void;
  }
}

export {};
