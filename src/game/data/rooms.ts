export type Room = {
  id: number;
  days: string;
  title: string;
  subtitle: string;
  mood: string;
  palette: [number, number, number, number];
  accent: string;
  ambience: {
    label: string;
    base: number;
    harmony: number;
    pulse: number;
  };
  /** Rooms without user-provided memory puzzles stay in preview mode. */
  memoryStatus: "playable" | "preparing" | "finale";
};

export const rooms: Room[] = [
  {
    id: 1,
    days: "1-100일",
    title: "풋풋한 시작의 방",
    subtitle: "처음이라 더 환했고, 작은 말에도 설렜던 시간",
    mood: "촛불, 봉인된 편지, 네 개의 액자, 바이올린 진열장",
    palette: [0xffc36f, 0xff6f7c, 0x8fd7ff, 0x2a1c15],
    accent: "#ffcf7c",
    ambience: { label: "warm morning piano pad", base: 261.63, harmony: 329.63, pulse: 0.52 },
    memoryStatus: "playable",
  },
  {
    id: 2,
    days: "101-200일",
    title: "조금 더 가까워진 방",
    subtitle: "익숙해졌지만 더 소중해진 약속들",
    mood: "카페 조명, 두 개의 의자, 함께 익숙해진 일상",
    palette: [0xffa75f, 0x6ee7b7, 0x8dc8ff, 0x17251f],
    accent: "#7ee1bd",
    ambience: { label: "soft cafe marimba loop", base: 293.66, harmony: 392.0, pulse: 0.62 },
    memoryStatus: "preparing",
  },
  {
    id: 3,
    days: "201-300일",
    title: "고난과 화해의 방",
    subtitle: "많이 싸웠지만 끝내 다시 손을 잡았던 날들",
    mood: "비, 갈라진 유리, 깨진 하트, 다시 연결된 리본",
    palette: [0x405b86, 0xff7a72, 0xc8d4ff, 0x101622],
    accent: "#91a8ff",
    ambience: { label: "rainy low strings", base: 196.0, harmony: 246.94, pulse: 0.35 },
    memoryStatus: "preparing",
  },
  {
    id: 4,
    days: "301-400일",
    title: "다사다난한 밤의 방",
    subtitle: "각자의 문제로 지쳤지만 서로를 놓지 않았던 시간",
    mood: "밤 도시, 열린 창문, 흔들리는 불빛, 메모와 다리",
    palette: [0x20384d, 0xffa36c, 0xffd6ad, 0x090d14],
    accent: "#ffb172",
    ambience: { label: "night city heartbeat pad", base: 174.61, harmony: 261.63, pulse: 0.44 },
    memoryStatus: "preparing",
  },
  {
    id: 5,
    days: "401-500일",
    title: "500일의 문",
    subtitle: "구름 위 사진 길을 지나 섬광 속 편지로",
    mood: "하늘, 구름길, 시간순 사진 프레임, 천국 같은 빛",
    palette: [0xf8fbff, 0xffd87a, 0x92c7ff, 0xdfefff],
    accent: "#f9dc8c",
    ambience: { label: "celestial choir shimmer", base: 329.63, harmony: 493.88, pulse: 0.72 },
    memoryStatus: "finale",
  },
];
