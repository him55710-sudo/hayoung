/**
 * Room 1 (1~100일) — 실제 추억 퍼즐 체인.
 *
 * 흐름 (순서 변경 금지):
 * 0. VITA500 편지
 * 1. 액자 4개 시간순 정렬 (노랑 → 초록 → 파랑 → 빨강)
 * 2. 바이올린 키링 획득 및 장착
 * 3. 인생의 회전목마 음악 맞히기
 * 4. 회전목마를 놀이공원 그림에 삽입
 * 5. 구로평상 기억과 9번 칸
 * 6. 소고기 부위 문제 — 살치살
 * 7. 현수의 스테이크 선택
 * → Room 2 문 개방
 */

export type PuzzleStatus = "locked" | "available" | "in_progress" | "solved";

export type PuzzleType =
  | "word"
  | "sequence"
  | "inventory_use"
  | "audio"
  | "placement"
  | "floor_choice"
  | "spatial"
  | "final_choice";

export interface PuzzleDefinition {
  id: string;
  roomId: number;
  order: number;
  title: string;
  type: PuzzleType;
  prompt: string;
  acceptedAnswers?: string[];
  prerequisiteIds: string[];
  requiredItems?: string[];
  consumedItems?: string[];
  rewardItems?: string[];
  rewardClueIds?: string[];
  rewardLabel: string;
  unlockTargets: string[];
  successNote: string;
  hints: [string, string, string];
  stationId: string;
}

/** 정답 비교용 정규화: 대소문자/공백/문장부호 무시. */
export function normalizeMemoryAnswer(value: string) {
  return value
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\s\-_.,·!?'"“”‘’()\[\]]/g, "");
}

export function matchesAnswer(puzzle: PuzzleDefinition, value: string) {
  const normalized = normalizeMemoryAnswer(value);
  if (!normalized) {
    return false;
  }
  return (puzzle.acceptedAnswers ?? []).some((answer) => normalizeMemoryAnswer(answer) === normalized);
}

export const FLOOR_ANSWER_CELL = 9;
export const STEAK_ANSWER: "alpero" | "hyunsu" = "hyunsu";

/**
 * TODO_USER_MEMORY: 구로평상과 9번 칸의 정확한 연결 근거.
 * 근거 자료가 도착하기 전까지 이유를 임의로 만들지 않는다.
 */
export const GURO_NINE_REASON_TODO = "TODO_USER_MEMORY: 구로평상과 9번 칸의 정확한 연결 근거";

export const room1Puzzles: PuzzleDefinition[] = [
  {
    id: "room1-vita500",
    roomId: 1,
    order: 0,
    title: "봉인된 편지",
    type: "word",
    prompt: "생일 선물 테이블 위 봉인된 편지. 500일을 시작하려면 정확한 이름을 기억해야 한다.",
    acceptedAnswers: ["VITA500", "비타500"],
    prerequisiteIds: [],
    rewardLabel: "기억의 액자 벽 활성화",
    unlockTargets: ["station-memory-wall"],
    successNote: "밀랍 봉인이 빛나며 편지가 열렸다. 기억의 액자 벽 조명이 켜진다.",
    hints: [
      "생일 선물 테이블 위, 밀랍으로 봉인된 편지를 다시 천천히 읽어봐.",
      "현수가 장난스럽게 틀린 이름을 하나 말했지? 오로나민 C 말고, 진짜 그 이름.",
      "노란 병에 든 그 비타민 음료. 이름 뒤에 숫자 500이 붙어 있어.",
    ],
    stationId: "station-gift-table",
  },
  {
    id: "room1-memory-frames",
    roomId: 1,
    order: 1,
    title: "액자 네 개 시간순 정렬",
    type: "sequence",
    prompt: "잣절공원 고백, 현수 생일, 필리핀, 100일 홍대. 네 개의 액자를 시간순으로 되돌리고 색을 입력하라.",
    prerequisiteIds: ["room1-vita500"],
    rewardItems: ["violin-keyring"],
    rewardLabel: "바이올린 키링",
    unlockTargets: ["station-violin-case"],
    successNote: "액자가 순서대로 점등되고 황동 선이 이어졌다. 유리 진열장의 잠금이 풀리며 바이올린 키링이 나왔다.",
    hints: [
      "네 개의 액자를 시간순으로 봐야 해. 가장 먼저 있었던 일이 무엇이었는지 떠올려.",
      "고백이 시작, 100일이 끝. 정렬이 끝나면 액자 아래 켜지는 색 순서를 그대로 눌러.",
      "노랑이 처음이고 빨강이 마지막이야. 가운데 둘은 점등된 액자를 왼쪽부터 따라가.",
    ],
    stationId: "station-memory-wall",
  },
  {
    id: "room1-violin-keyring",
    roomId: 1,
    order: 2,
    title: "바이올린 키링 장착",
    type: "inventory_use",
    prompt: "유리 진열장 안 바이올린 인형에게 비어 있는 고리가 있다. 키링이 있어야 할 자리를 찾아라.",
    prerequisiteIds: ["room1-memory-frames"],
    requiredItems: ["violin-keyring"],
    consumedItems: ["violin-keyring"],
    rewardLabel: "바이올린 인형의 연주",
    unlockTargets: ["station-music-cabinet"],
    successNote: "인형이 천천히 고개를 들고 활이 움직인다. 음악이 시작됐다.",
    hints: [
      "액자 벽이 열리며 준 작은 선물을 인벤토리에서 확인해봐.",
      "유리 진열장 안, 바이올린을 든 인형에게 비어 있는 고리가 있어.",
      "키링은 바이올린 인형의 빈 고리에만 맞아. 다른 곳엔 걸리지 않아.",
    ],
    stationId: "station-violin-case",
  },
  {
    id: "room1-merry-go-round-song",
    roomId: 1,
    order: 3,
    title: "바이올린 인형의 연주곡",
    type: "audio",
    prompt: "바이올린 인형이 연주하는 곡. 이 곡의 이름은 무엇일까요?",
    acceptedAnswers: ["인생의 회전목마", "인생의회전목마", "Merry Go Round of Life", "Merry-Go-Round of Life"],
    prerequisiteIds: ["room1-violin-keyring"],
    rewardItems: ["carousel-model"],
    rewardLabel: "회전목마 모형",
    unlockTargets: ["station-carousel-painting"],
    successNote: "오르골 위 회전목마가 돌기 시작하더니, 모형이 분리되어 손에 들어왔다.",
    hints: [
      "바이올린 인형이 연주하는 멜로디를 끝까지 들어봐.",
      "회전목마가 도는 그 애니메이션 영화의 왈츠야.",
      "제목은 '인생의 ○○○○'. 오르골 위 장식이 곧 답이야.",
    ],
    stationId: "station-music-cabinet",
  },
  {
    id: "room1-carousel-painting",
    roomId: 1,
    order: 4,
    title: "놀이공원 그림",
    type: "placement",
    prompt: "벽의 놀이공원 그림에는 회전목마 자리만 비어 있다. 빈자리를 채워라.",
    prerequisiteIds: ["room1-merry-go-round-song"],
    requiredItems: ["carousel-model"],
    consumedItems: ["carousel-model"],
    rewardClueIds: ["guro-pyeongsang"],
    rewardLabel: "구로평상 단서",
    unlockTargets: ["station-floor-grid"],
    successNote: "그림에 불이 하나씩 켜진다. 놀이공원의 길이 한 장소를 가리킨다 — 구로평상.",
    hints: [
      "소고기 벽 위쪽, 놀이공원 그림에 비어 있는 자리가 있어.",
      "오르골에서 분리된 모형, 크기가 꼭 맞는 자리가 그림 안에 있어.",
      "회전목마 모형을 그림의 빈자리에 끼워 넣어.",
    ],
    stationId: "station-carousel-painting",
  },
  {
    id: "room1-guro-pyeongsang-nine",
    roomId: 1,
    order: 5,
    title: "구로평상과 바닥 타일",
    type: "floor_choice",
    prompt: "바닥의 아홉 칸 타일. 구로평상의 기억이 가리키는 칸을 밟아라.",
    prerequisiteIds: ["room1-carousel-painting"],
    rewardLabel: "숨겨진 소고기 조각",
    unlockTargets: ["station-beef-wall"],
    successNote: "9번 타일이 황금빛으로 빛나며 아래로 내려갔다. 숨어 있던 소고기 부위 조각이 나타났다.",
    hints: [
      "놀이공원 그림이 가리킨 장소의 단서를 먼저 확인해.",
      "구로평상 — 썸 타던 시절 처음 함께 갔던 곳. 바닥의 아홉 칸 중 하나만 반응해.",
      "앞줄도 가운데 줄도 아니야. 마지막 줄의 끝을 봐.",
    ],
    stationId: "station-floor-grid",
  },
  {
    id: "room1-salchisal",
    roomId: 1,
    order: 6,
    title: "소고기 부위 맞히기",
    type: "spatial",
    prompt: "100일의 기억은 윗등 쪽, 목심과 등심 사이에 있다. 조각을 올바른 부위에 놓고 이름을 답하라.",
    acceptedAnswers: ["살치살"],
    prerequisiteIds: ["room1-guro-pyeongsang-nine"],
    rewardLabel: "스테이크 테이블 개방",
    unlockTargets: ["station-steak-table"],
    successNote: "살치살 자리가 붉게 빛난다. 100일 홍대의 음식 기억이 떠오르고, 스테이크 테이블의 촛불이 켜졌다.",
    hints: [
      "소 그림 옆의 힌트 문구를 읽어봐. '윗등 쪽'이래.",
      "목심과 등심 사이, 소의 어깨 위쪽 부위야.",
      "세 글자. '살'로 시작해서 '살'로 끝나.",
    ],
    stationId: "station-beef-wall",
  },
  {
    id: "room1-hyunsu-steak",
    roomId: 1,
    order: 7,
    title: "두 스테이크 중 선택",
    type: "final_choice",
    prompt: "촛불 테이블 위 두 접시. 하영이가 마지막으로 선택해야 하는 스테이크는?",
    prerequisiteIds: ["room1-salchisal"],
    rewardLabel: "Room 2 문 개방",
    unlockTargets: ["station-exit-door"],
    successNote: "촛불이 환해지고 방의 기억들이 순서대로 점등된다. 출구의 볼트가 풀리며 황금빛이 새어 나온다.",
    hints: [
      "촛불 테이블 위 두 접시 중 하나만 정답이야.",
      "홍대에서 먹었던 것도 맛있었지만, 현수가 기다리는 답은 따로 있어.",
      "현수의 이름이 붙은 접시를 골라.",
    ],
    stationId: "station-steak-table",
  },
];

export const room1PuzzleIds = room1Puzzles.map((puzzle) => puzzle.id);

export function getPuzzleById(id: string | null | undefined) {
  if (!id) {
    return null;
  }
  return room1Puzzles.find((puzzle) => puzzle.id === id) ?? null;
}

export function computeAvailablePuzzleIds(completedPuzzleIds: string[]) {
  const completed = new Set(completedPuzzleIds);
  return room1Puzzles
    .filter((puzzle) => !completed.has(puzzle.id) && puzzle.prerequisiteIds.every((id) => completed.has(id)))
    .map((puzzle) => puzzle.id);
}

export function isRoom1Complete(completedPuzzleIds: string[]) {
  const completed = new Set(completedPuzzleIds);
  return room1Puzzles.every((puzzle) => completed.has(puzzle.id));
}

/**
 * Room 1 상호작용 스테이션 (방 로컬 좌표: x/z 바닥 평면).
 * 3D 씬의 실제 오브젝트 배치와 일치해야 한다.
 */
export interface Room1Station {
  id: string;
  puzzleId: string | null;
  clueId?: string;
  label: string;
  zone: string;
  focusLine: string;
  x: number;
  z: number;
  radius: number;
}

export const room1Stations: Room1Station[] = [
  {
    id: "station-entry-desk",
    puzzleId: null,
    clueId: "hyunsu-notice",
    label: "현수의 안내 책상",
    zone: "A 시작 지점",
    focusLine: "책상 위에 현수가 남긴 안내문과 규칙판이 있다.",
    x: -4.55,
    z: 1.22,
    radius: 1.35,
  },
  {
    id: "station-park-bench",
    puzzleId: null,
    clueId: "jatjeol-bench",
    label: "잣절공원 벤치",
    zone: "B 왼쪽 후면",
    focusLine: "가로등 아래 벤치. 잣절공원의 그 밤이 재현되어 있다.",
    x: -4.28,
    z: -2.68,
    radius: 1.45,
  },
  {
    id: "station-gift-table",
    puzzleId: "room1-vita500",
    label: "생일 선물 테이블",
    zone: "A 시작 지점",
    focusLine: "종이봉투, 선물 상자들 사이에 밀랍으로 봉인된 편지가 놓여 있다.",
    x: -2.76,
    z: 1.24,
    radius: 1.7,
  },
  {
    id: "station-memory-wall",
    puzzleId: "room1-memory-frames",
    label: "기억의 액자 벽",
    zone: "C 후면 벽",
    focusLine: "네 개의 액자와 색상 버튼 콘솔. 시간의 순서를 기다리고 있다.",
    x: -2.24,
    z: -2.98,
    radius: 1.8,
  },
  {
    id: "station-violin-case",
    puzzleId: "room1-violin-keyring",
    label: "바이올린 유리 진열장",
    zone: "D 후면 중앙",
    focusLine: "유리장 안 바이올린 인형. 비어 있는 키링 고리가 보인다.",
    x: 0.08,
    z: -3.15,
    radius: 1.5,
  },
  {
    id: "station-music-cabinet",
    puzzleId: "room1-merry-go-round-song",
    label: "오르골 캐비닛",
    zone: "D 후면 중앙",
    focusLine: "황동 오르골 위에 작은 회전목마 장식이 얹혀 있다.",
    x: 1.42,
    z: -2.76,
    radius: 1.4,
  },
  {
    id: "station-carousel-painting",
    puzzleId: "room1-carousel-painting",
    label: "놀이공원 그림",
    zone: "F 오른쪽 후면",
    focusLine: "그림 속 놀이공원. 회전목마가 있어야 할 자리만 비어 있다.",
    x: 3.92,
    z: -3.15,
    radius: 1.45,
  },
  {
    id: "station-floor-grid",
    puzzleId: "room1-guro-pyeongsang-nine",
    label: "아홉 칸 바닥 타일",
    zone: "E 중앙 바닥",
    focusLine: "1부터 9까지 새겨진 바닥 타일. 한 칸만 눌릴 것 같다.",
    x: 0,
    z: 0.4,
    radius: 1.9,
  },
  {
    id: "station-beef-wall",
    puzzleId: "room1-salchisal",
    label: "소고기 부위 문제판",
    zone: "F 오른쪽 후면",
    focusLine: "부위별로 나뉜 소 그림과 자석 조각 선반이 있다.",
    x: 2.6,
    z: -3.15,
    radius: 1.35,
  },
  {
    id: "station-steak-table",
    puzzleId: "room1-hyunsu-steak",
    label: "촛불 스테이크 테이블",
    zone: "G 오른쪽 전면",
    focusLine: "두 접시의 스테이크와 A/B 깃발. 촛불이 흔들린다.",
    x: 3.58,
    z: 1.38,
    radius: 1.7,
  },
  {
    id: "station-exit-door",
    puzzleId: null,
    label: "Room 2 출구 문",
    zone: "H 출구",
    focusLine: "무거운 목재 문과 황동 볼트. 문틈에서 옅은 빛이 샌다.",
    x: 5.9,
    z: -1.94,
    radius: 1.9,
  },
];

export function getStationById(id: string | null | undefined) {
  if (!id) {
    return null;
  }
  return room1Stations.find((station) => station.id === id) ?? null;
}
