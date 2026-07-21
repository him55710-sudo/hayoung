import { computeAvailablePuzzleIds, isRoom1Complete, room1Stations } from "../data/room1Puzzles";

/**
 * React 상태와 Three.js 애니메이션 루프가 공유하는 Room 1 시각 상태.
 * 매 프레임 재생성되는 것을 피하려고 모듈 레벨 가변 객체를 사용한다.
 */

export type Room1VisualState = {
  solved: Set<string>;
  /** 지금 상호작용 가능한 스테이션 집합 (링 표시용). */
  availableStationIds: Set<string>;
  /** 현재 레티클이 집중하고 있는 스테이션. */
  focusStationId: string | null;
  /** 바이올린 인형이 연주 중인지 (키링 장착 이후). */
  violinPlaying: boolean;
  /** 오르골 회전목마가 아직 캐비닛 위에 있는지. */
  carouselOnCabinet: boolean;
  /** 회전목마 모형이 그림에 끼워졌는지. */
  carouselInPainting: boolean;
  /** Room 2 문이 열렸는지. */
  doorOpen: boolean;
  /** 스테이크 오답으로 촛불이 꺼져 있는 동안의 만료 시각(ms, performance.now 기준). */
  candleOutUntil: number;
  /** 마지막 정답 해제 연출 시각. */
  lastSolveAt: number;
};

export const room1Visual: Room1VisualState = {
  solved: new Set(),
  availableStationIds: new Set(),
  focusStationId: null,
  violinPlaying: false,
  carouselOnCabinet: true,
  carouselInPainting: false,
  doorOpen: false,
  candleOutUntil: 0,
  lastSolveAt: -99,
};

export function syncRoom1Visual(completedPuzzleIds: string[]) {
  room1Visual.solved = new Set(completedPuzzleIds);
  const availablePuzzles = new Set(computeAvailablePuzzleIds(completedPuzzleIds));
  const complete = isRoom1Complete(completedPuzzleIds);
  room1Visual.availableStationIds = new Set(
    room1Stations
      .filter((station) =>
        station.id === "station-exit-door"
          ? complete
          : station.puzzleId
            ? availablePuzzles.has(station.puzzleId)
            : true,
      )
      .map((station) => station.id),
  );
  room1Visual.violinPlaying = room1Visual.solved.has("room1-violin-keyring");
  room1Visual.carouselOnCabinet = !room1Visual.solved.has("room1-merry-go-round-song");
  room1Visual.carouselInPainting = room1Visual.solved.has("room1-carousel-painting");
  room1Visual.doorOpen = room1Visual.solved.has("room1-hyunsu-steak");
}

export function resetRoom1Visual() {
  syncRoom1Visual([]);
  room1Visual.focusStationId = null;
  room1Visual.candleOutUntil = 0;
  room1Visual.lastSolveAt = -99;
}

syncRoom1Visual([]);
