/**
 * 실제 추억 데이터.
 * 액자 사진 4장은 사용자가 직접 제공한 실제 사진이다 (public/memories/frame-*.jpeg).
 * 아직 제공되지 않은 자료는 TODO_USER_MEMORY 슬롯으로 남기고, 임의의 커플 사진을 생성해 채우지 않는다.
 */

export type FrameColorKey = "yellow" | "green" | "blue" | "red";

export type MemoryFrame = {
  key: "jatjeol" | "birthday" | "philippines" | "hongdae";
  title: string;
  caption: string;
  order: number;
  colorKey: FrameColorKey;
  colorName: string;
  colorHex: string;
  /** null이면 화면에 TODO_USER_MEMORY 텍스트만 표시한다. */
  image: string | null;
};

export const memoryFrames: MemoryFrame[] = [
  {
    key: "jatjeol",
    title: "잣절공원 고백",
    caption: "벤치와 가로등 아래 첫 마음",
    order: 1,
    colorKey: "yellow",
    colorName: "노랑",
    colorHex: "#ffd36f",
    image: "/memories/frame-jatjeol.jpeg",
  },
  {
    key: "birthday",
    title: "현수 생일",
    caption: "하영이가 준비한 생일 선물",
    order: 2,
    colorKey: "green",
    colorName: "초록",
    colorHex: "#8be883",
    image: "/memories/frame-birthday.jpeg",
  },
  {
    key: "philippines",
    title: "필리핀",
    caption: "함께 본 높은 하늘",
    order: 3,
    colorKey: "blue",
    colorName: "파랑",
    colorHex: "#82cfff",
    image: "/memories/frame-philippines.jpeg",
  },
  {
    key: "hongdae",
    title: "100일 홍대",
    caption: "홍대에서 보낸 100일",
    order: 4,
    colorKey: "red",
    colorName: "빨강",
    colorHex: "#ff748b",
    image: "/memories/frame-hongdae.jpeg",
  },
];

export const frameOrderAnswer = ["jatjeol", "birthday", "philippines", "hongdae"] as const;
export const colorSequenceAnswer: FrameColorKey[] = ["yellow", "green", "blue", "red"];

/** 액자 정렬 퍼즐이 처음 열릴 때 보여줄 뒤섞인 순서 (정답 노출 방지). */
export const shuffledFrameKeys: MemoryFrame["key"][] = ["hongdae", "jatjeol", "philippines", "birthday"];

export type InventoryItem = {
  id: string;
  label: string;
  description: string;
};

export const inventoryItems: Record<string, InventoryItem> = {
  "violin-keyring": {
    id: "violin-keyring",
    label: "바이올린 키링",
    description: "액자 벽이 열리며 나타난 작은 바이올린 열쇠고리.",
  },
  "carousel-model": {
    id: "carousel-model",
    label: "회전목마 모형",
    description: "오르골 위에서 분리된 작은 회전목마.",
  },
};

export type ClueRecord = {
  id: string;
  label: string;
  description: string;
};

export const clueRecords: Record<string, ClueRecord> = {
  "hyunsu-notice": {
    id: "hyunsu-notice",
    label: "현수의 안내문",
    description: "하영아, 방탈출을 풀며 우리의 추억을 잘 떠올려봐!! 힌트는 카톡 또는 전화.",
  },
  "jatjeol-bench": {
    id: "jatjeol-bench",
    label: "잣절공원 벤치",
    description: "가로등 아래 벤치. 잣절공원에서의 고백이 모든 기억의 시작이었다.",
  },
  "guro-pyeongsang": {
    id: "guro-pyeongsang",
    label: "구로평상 단서",
    description:
      "놀이공원의 길이 한 장소를 가리킨다 — 구로평상. 썸 타던 시절 처음 함께 갔던 자리. '구로'평상... 어딘가 숫자처럼 들리지 않아?",
  },
};

export type MemorySlot = {
  id: string;
  dayRange: string;
  title: string;
  caption: string;
  image: string;
};

/** 엔딩 타임라인과 최종방 3D 복도가 함께 쓰는 6개 교체형 사진 슬롯. */
export const memorySlots: MemorySlot[] = [
  {
    id: "memory-01",
    dayRange: "1-100일",
    title: "처음 설렌 날들",
    caption: "밝은 마음으로 서로를 알아가던 시작",
    image: "/memories/memory-01.svg",
  },
  {
    id: "memory-02",
    dayRange: "101-200일",
    title: "조금 더 가까이",
    caption: "약속과 일상이 편안해지던 시간",
    image: "/memories/memory-02.svg",
  },
  {
    id: "memory-03",
    dayRange: "201-300일",
    title: "비 온 뒤의 마음",
    caption: "싸움 뒤에도 다시 서로를 고르던 날들",
    image: "/memories/memory-03.svg",
  },
  {
    id: "memory-04",
    dayRange: "301-400일",
    title: "지친 밤의 편",
    caption: "각자의 문제 속에서도 놓지 않았던 손",
    image: "/memories/memory-04.svg",
  },
  {
    id: "memory-05",
    dayRange: "401-500일",
    title: "구름길",
    caption: "다시 환하게 걸어온 기념의 복도",
    image: "/memories/memory-05.svg",
  },
  {
    id: "memory-06",
    dayRange: "500일 이후",
    title: "다음 방",
    caption: "앞으로 같이 만들 새로운 장면",
    image: "/memories/memory-06.svg",
  },
];
