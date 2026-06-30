import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Backpack,
  Check,
  Delete,
  DoorOpen,
  Expand,
  Heart,
  HelpCircle,
  KeyRound,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnimationEvent, CSSProperties } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

type Phase = "intro" | "game" | "ending";
type PuzzleKind = "code" | "direction" | "symbol" | "memory" | "device" | "final";
type GraphicsQuality = "cinematic" | "balanced" | "performance";
type MovementState = { forward: boolean; back: boolean; left: boolean; right: boolean };
type LookInput = { yawDelta: number; pitchDelta: number; active: boolean; tick: number };
type TouchControlState = MovementState & { yawDelta: number; pitchDelta: number; lookActive: boolean; tick: number };
type HintPenalty = { id: string; label: string; shortLabel: string; detail: string; tone: string };
type IntroThemeStatus = "open" | "locked";
type IntroTheme = {
  id: "love-timeline" | "strange-story" | "hello-kitty";
  number: string;
  status: IntroThemeStatus;
  title: string;
  subtitle: string;
  description: string;
  poster: string;
  posterWidth: number;
  posterHeight: number;
  meta: string[];
};
type PosterCardStyle = CSSProperties & { readonly "--poster-aspect": string };

type Room = {
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
};

type Puzzle = {
  id: number;
  roomId: number;
  kind: PuzzleKind;
  title: string;
  prompt: string;
  answer: string;
  reward: string;
  requires?: number[];
  chainNote: string;
};

type UnlockFeedback = {
  puzzleId: number;
  title: string;
  reward: string;
};

type MemorySlot = {
  id: string;
  dayRange: string;
  title: string;
  caption: string;
  image: string;
};

type ProceduralTextureKind = "wood" | "plaster" | "fabric" | "paper" | "metal";

const proceduralTextureCache = new Map<string, THREE.CanvasTexture>();
const memoryTextureCache = new Map<string, THREE.Texture>();
const cinematicTextureCache = new Map<string, THREE.CanvasTexture>();
const memoryTextureLoader = new THREE.TextureLoader();

const graphicsQualitySettings: Record<
  GraphicsQuality,
  {
    label: string;
    renderScale: number;
    bloomMultiplier: number;
    shadows: boolean;
    dust: boolean;
    atmosphere: boolean;
  }
> = {
  cinematic: { label: "시네마틱", renderScale: 1.65, bloomMultiplier: 1, shadows: true, dust: true, atmosphere: true },
  balanced: { label: "균형", renderScale: 1.25, bloomMultiplier: 0.78, shadows: true, dust: true, atmosphere: true },
  performance: { label: "부드럽게", renderScale: 0.95, bloomMultiplier: 0.48, shadows: false, dust: false, atmosphere: false },
};

const graphicsQualityCycle: GraphicsQuality[] = ["cinematic", "balanced", "performance"];
const playableIntroThemeId: IntroTheme["id"] = "love-timeline";
const introThemes: IntroTheme[] = [
  {
    id: "love-timeline",
    number: "Theme 01",
    status: "open",
    title: "연애 일대기",
    subtitle: "1일부터 500일까지, 우리가 지나온 다섯 개의 방",
    description: "1~100, 101~200, 201~300, 301~400, 401~500일의 기억을 따라가는 메인 테마입니다.",
    poster: "/theme-posters/theme-1-love-timeline.jpg",
    posterWidth: 900,
    posterHeight: 1350,
    meta: ["5 rooms", "10 locks", "500 days"],
  },
  {
    id: "strange-story",
    number: "Theme 02",
    status: "locked",
    title: "현수 하영 커플의 기괴한 이야기",
    subtitle: "가설로 시작된 공포 연애 미스터리",
    description: "왜 현실은 가설보다 더 기괴했는지 추적하는 공포 테마입니다.",
    poster: "/theme-posters/theme-2-strange-story.jpg",
    posterWidth: 900,
    posterHeight: 1272,
    meta: ["horror", "mystery", "coming soon"],
  },
  {
    id: "hello-kitty",
    number: "Theme 03",
    status: "locked",
    title: "긴급사건! 헬로키티가 사라졌다!",
    subtitle: "사라진 헬로키티를 되찾는 초특급 미션",
    description: "마지막 문을 열면 실제 헬로키티 인형이 기다리는 추리 어드벤처 테마입니다.",
    poster: "/theme-posters/theme-3-hello-kitty.jpg",
    posterWidth: 900,
    posterHeight: 1272,
    meta: ["cute case", "reward", "coming soon"],
  },
];
const defaultTouchControls: TouchControlState = {
  forward: false,
  back: false,
  left: false,
  right: false,
  yawDelta: 0,
  pitchDelta: 0,
  lookActive: false,
  tick: 0,
};

let touchDelegationInstalled = false;
let delegatedLookDrag: { pointerId: number | null; x: number; y: number } = { pointerId: null, x: 0, y: 0 };
let delegatedMoveHold: { pointerId: number | null; direction: keyof MovementState | null } = { pointerId: null, direction: null };

function publishDelegatedTouchControls(next: Partial<TouchControlState> = {}) {
  const current = window.hayoungTouchControls ?? defaultTouchControls;
  window.hayoungTouchControls = { ...current, ...next };
  return window.hayoungTouchControls;
}

function installDelegatedTouchControls() {
  if (touchDelegationInstalled || typeof document === "undefined") {
    return;
  }
  touchDelegationInstalled = true;
  publishDelegatedTouchControls();

  const directionFromEvent = (event: PointerEvent) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(".mobile-pad [data-move]");
    return button?.dataset.move as keyof MovementState | undefined;
  };

  document.addEventListener(
    "pointerdown",
    (event) => {
      const direction = directionFromEvent(event);
      if (!direction) {
        return;
      }
      event.preventDefault();
      delegatedMoveHold = { pointerId: event.pointerId, direction };
      publishDelegatedTouchControls({ [direction]: true });
    },
    true,
  );

  document.addEventListener(
    "pointerup",
    (event) => {
      const direction = directionFromEvent(event) ?? (delegatedMoveHold.pointerId === event.pointerId ? delegatedMoveHold.direction : null);
      if (!direction) {
        return;
      }
      publishDelegatedTouchControls({ [direction]: false });
      delegatedMoveHold = { pointerId: null, direction: null };
    },
    true,
  );

  document.addEventListener(
    "pointercancel",
    () => {
      delegatedMoveHold = { pointerId: null, direction: null };
      publishDelegatedTouchControls({ forward: false, back: false, left: false, right: false });
    },
    true,
  );

  document.addEventListener(
    "pointerdown",
    (event) => {
      const lookPad = (event.target as HTMLElement | null)?.closest<HTMLElement>(".look-pad");
      if (!lookPad) {
        return;
      }
      event.preventDefault();
      delegatedLookDrag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      publishDelegatedTouchControls({ yawDelta: 0, pitchDelta: 0, lookActive: true, tick: (window.hayoungTouchControls?.tick ?? 0) + 1 });
    },
    true,
  );

  document.addEventListener(
    "pointermove",
    (event) => {
      if (delegatedLookDrag.pointerId !== event.pointerId) {
        return;
      }
      event.preventDefault();
      const yawDelta = event.clientX - delegatedLookDrag.x;
      const pitchDelta = event.clientY - delegatedLookDrag.y;
      delegatedLookDrag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      if (Math.abs(yawDelta) + Math.abs(pitchDelta) < 0.5) {
        return;
      }
      publishDelegatedTouchControls({ yawDelta, pitchDelta, lookActive: true, tick: (window.hayoungTouchControls?.tick ?? 0) + 1 });
    },
    true,
  );

  const endLook = (event: PointerEvent) => {
    if (delegatedLookDrag.pointerId !== event.pointerId) {
      return;
    }
    delegatedLookDrag = { pointerId: null, x: 0, y: 0 };
    publishDelegatedTouchControls({ yawDelta: 0, pitchDelta: 0, lookActive: false, tick: (window.hayoungTouchControls?.tick ?? 0) + 1 });
  };
  document.addEventListener("pointerup", endLook, true);
  document.addEventListener("pointercancel", endLook, true);
}

declare global {
  interface Window {
    advanceTime?: (ms?: number) => void;
    hayoungCameraState?: { x: number; z: number; yaw: number; pitch: number };
    hayoungDebugSetCameraPose?: (pose: Partial<{ x: number; z: number; yaw: number; pitch: number }>) => void;
    hayoungDebugHoldUnlock?: boolean;
    hayoungDebugSkipRoomTransitions?: boolean;
    hayoungDebugFastUnlock?: boolean;
    hayoungDebugCompleteGame?: () => void;
    hayoungTouchControls?: TouchControlState;
    render_game_to_text?: () => string;
  }
}

const rooms: Room[] = [
  {
    id: 1,
    days: "1-100일",
    title: "풋풋한 시작의 방",
    subtitle: "처음이라 더 환했고, 작은 말에도 설렜던 시간",
    mood: "밝은 햇살, 다이어리, 첫 사진, 작은 자물쇠",
    palette: [0xffc36f, 0xff6f7c, 0x8fd7ff, 0x2a1c15],
    accent: "#ffcf7c",
    ambience: { label: "warm morning piano pad", base: 261.63, harmony: 329.63, pulse: 0.52 },
  },
  {
    id: 2,
    days: "101-200일",
    title: "조금 더 가까워진 방",
    subtitle: "익숙해졌지만 더 소중해진 약속들",
    mood: "카페 조명, 두 개의 의자, 방향 패널, 초록빛 단서",
    palette: [0xffa75f, 0x6ee7b7, 0x8dc8ff, 0x17251f],
    accent: "#7ee1bd",
    ambience: { label: "soft cafe marimba loop", base: 293.66, harmony: 392.0, pulse: 0.62 },
  },
  {
    id: 3,
    days: "201-300일",
    title: "고난과 화해의 방",
    subtitle: "많이 싸웠지만 끝내 다시 손을 잡았던 날들",
    mood: "비, 갈라진 유리, 번개, 이어 붙인 사진",
    palette: [0x405b86, 0xff7a72, 0xc8d4ff, 0x101622],
    accent: "#91a8ff",
    ambience: { label: "rainy low strings", base: 196.0, harmony: 246.94, pulse: 0.35 },
  },
  {
    id: 4,
    days: "301-400일",
    title: "다사다난한 밤의 방",
    subtitle: "각자의 문제로 지쳤지만 서로를 놓지 않았던 시간",
    mood: "밤 도시, 열린 창문, 흔들리는 불빛, 오래 버틴 마음",
    palette: [0x20384d, 0xffa36c, 0xffd6ad, 0x090d14],
    accent: "#ffb172",
    ambience: { label: "night city heartbeat pad", base: 174.61, harmony: 261.63, pulse: 0.44 },
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
  },
];

const memorySlots: MemorySlot[] = [
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

const puzzles: Puzzle[] = [
  {
    id: 1,
    roomId: 1,
    kind: "code",
    title: "첫 자물쇠",
    prompt: "다이어리의 첫 페이지와 사진 프레임의 숫자를 연결해 네 자리 코드를 만든다는 구조입니다.",
    answer: "0100",
    reward: "첫 설렘 열쇠",
    chainNote: "이 열쇠가 2번 사진 장치의 전원을 켭니다.",
  },
  {
    id: 2,
    roomId: 1,
    kind: "memory",
    title: "첫 사진 프레임",
    prompt: "방 안의 사진 후보 중 가장 먼저 빛나는 프레임을 고르는 기억형 문제입니다.",
    answer: "1",
    reward: "밝은 사진 조각",
    requires: [1],
    chainNote: "사진 조각 뒷면의 색이 2번째 방 방향 패널의 시작 색입니다.",
  },
  {
    id: 3,
    roomId: 2,
    kind: "direction",
    title: "카페 방향 패널",
    prompt: "테이블 위 컵받침, 의자 방향, 벽 조명 순서를 합쳐 방향 자물쇠를 푸는 구조입니다.",
    answer: "URDL",
    reward: "초록 방향 토큰",
    requires: [2],
    chainNote: "방향 토큰을 약속 시계에 끼워 4번 문제를 엽니다.",
  },
  {
    id: 4,
    roomId: 2,
    kind: "symbol",
    title: "약속의 별",
    prompt: "두 사람이 자주 했던 말과 별 모양 장식을 매칭하는 상징 문제입니다.",
    answer: "STAR",
    reward: "약속 배지",
    requires: [3],
    chainNote: "배지의 금속 무늬가 3번째 방의 갈라진 유리 패턴과 이어집니다.",
  },
  {
    id: 5,
    roomId: 3,
    kind: "code",
    title: "비 오는 날의 금고",
    prompt: "싸운 날, 다시 만난 날, 화해 메시지의 순서를 숫자로 바꾸는 코드 문제입니다.",
    answer: "0300",
    reward: "화해의 조각",
    requires: [4],
    chainNote: "조각을 맞추면 깨진 소리 장치의 방향 힌트가 들립니다.",
  },
  {
    id: 6,
    roomId: 3,
    kind: "direction",
    title: "깨진 소리 방향",
    prompt: "비와 번개 소리가 들리는 순서대로 방향 패널을 누르는 장치형 문제입니다.",
    answer: "LURD",
    reward: "이어 붙인 리본",
    requires: [5],
    chainNote: "리본이 4번째 방 창문 장치의 손잡이가 됩니다.",
  },
  {
    id: 7,
    roomId: 4,
    kind: "memory",
    title: "지친 밤의 선택",
    prompt: "힘들었던 날 서로에게 보낸 말 중 가장 오래 남은 선택지를 고르는 기억형 문제입니다.",
    answer: "2",
    reward: "밤 도시 티켓",
    requires: [6],
    chainNote: "티켓 번호가 달빛 신호 장치의 첫 번째 좌표입니다.",
  },
  {
    id: 8,
    roomId: 4,
    kind: "symbol",
    title: "열린 창문의 신호",
    prompt: "창밖 네온, 달, 방 안 촛불의 순서를 조합해 마지막 방의 문양을 만듭니다.",
    answer: "MOON",
    reward: "달빛 실마리",
    requires: [7],
    chainNote: "달빛 실마리가 500일 하늘문에 들어가는 마지막 장치입니다.",
  },
  {
    id: 9,
    roomId: 5,
    kind: "code",
    title: "500일 하늘문",
    prompt: "사진 길의 순서와 하늘문에 새겨진 숫자를 연결하는 최종 코드 문제입니다.",
    answer: "0500",
    reward: "하늘문 열쇠",
    requires: [8],
    chainNote: "하늘문 열쇠가 편지 장치를 열어 마지막 확인을 보여줍니다.",
  },
  {
    id: 10,
    roomId: 5,
    kind: "final",
    title: "편지의 마지막 문장",
    prompt: "500일부터 더 다정하게 같이 걷자는 마음을 담은 최종 확인입니다.",
    answer: "YES",
    reward: "500일 엔딩 편지",
    requires: [9],
    chainNote: "모든 방의 단서가 끝나고 엔딩 편지가 열립니다.",
  },
];

const hintPenalties: HintPenalty[] = [
  {
    id: "banana",
    label: "현수한테 바나나우유 사주기",
    shortLabel: "바나나우유",
    detail: "첫 힌트 영수증",
    tone: "banana",
  },
  {
    id: "bingsu",
    label: "현수한테 설빙 사주기",
    shortLabel: "설빙",
    detail: "두 번째 힌트 계약",
    tone: "bingsu",
  },
  {
    id: "escape",
    label: "현수랑 방탈출 하러가기",
    shortLabel: "방탈출 데이트",
    detail: "최종 벌칙 예약권",
    tone: "escape",
  },
];

function normalizePuzzleAnswer(puzzle: Puzzle, value: string) {
  const compact = value.toUpperCase().replace(/\s+/g, "");

  if (puzzle.kind === "code" || puzzle.kind === "memory") {
    return compact.replace(/\D/g, "").slice(0, puzzle.answer.length);
  }

  if (puzzle.kind === "direction") {
    return compact.replace(/[^UDLR]/g, "").slice(0, puzzle.answer.length);
  }

  if (puzzle.kind === "device") {
    return compact.replace(/[^A-Z0-9]/g, "").slice(0, puzzle.answer.length);
  }

  return compact.replace(/[^A-Z]/g, "").slice(0, puzzle.answer.length);
}

function App() {
  const skipIntroForHarness = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("play") === "1";
  const [phase, setPhase] = useState<Phase>(skipIntroForHarness ? "game" : "intro");
  const [introUnlocked, setIntroUnlocked] = useState(skipIntroForHarness);
  const [introEntering, setIntroEntering] = useState(false);
  const introSecondsRef = useRef(skipIntroForHarness ? 6 : 0);
  const [buttonOffset, setButtonOffset] = useState({ x: 0, y: 0 });
  const [selectedIntroThemeId, setSelectedIntroThemeId] = useState<IntroTheme["id"] | null>(
    skipIntroForHarness ? playableIntroThemeId : null,
  );
  const [roomIndex, setRoomIndex] = useState(0);
  const [solvedIds, setSolvedIds] = useState<number[]>([]);
  const [activePuzzleId, setActivePuzzleId] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [unlockFeedback, setUnlockFeedback] = useState<UnlockFeedback | null>(null);
  const [message, setMessage] = useState(
    skipIntroForHarness ? "하영이가 첫 번째 방에 들어왔어요. 중앙의 잠금 장치가 첫 단서를 기다립니다." : "빛나는 장치가 조용히 반응하고 있어요.",
  );
  const [hintCount, setHintCount] = useState(0);
  const [movement, setMovement] = useState<MovementState>({ forward: false, back: false, left: false, right: false });
  const [lookInput, setLookInput] = useState<LookInput>({ yawDelta: 0, pitchDelta: 0, active: false, tick: 0 });
  const [unlockTick, setUnlockTick] = useState(0);
  const [unlocking, setUnlocking] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [nearInteractable, setNearInteractable] = useState(false);
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>("cinematic");

  const currentRoom = rooms[roomIndex];
  const graphicsQualitySetting = graphicsQualitySettings[graphicsQuality];
  const solvedSet = useMemo(() => new Set(solvedIds), [solvedIds]);
  const currentRoomPuzzles = puzzles.filter((puzzle) => puzzle.roomId === currentRoom.id);
  const availablePuzzle = currentRoomPuzzles.find((puzzle) => {
    if (solvedSet.has(puzzle.id)) {
      return false;
    }
    return (puzzle.requires ?? []).every((id) => solvedSet.has(id));
  });
  const blockedPuzzle = currentRoomPuzzles.find((puzzle) => !solvedSet.has(puzzle.id));
  const nextPuzzle = availablePuzzle ?? blockedPuzzle;
  const activePuzzle = puzzles.find((puzzle) => puzzle.id === activePuzzleId) ?? null;
  const hintsLeft = Math.max(0, 3 - hintCount);
  const activeHintPenalty = hintPenalties[hintCount - 1] ?? null;
  const inventory = puzzles.filter((puzzle) => solvedSet.has(puzzle.id)).map((puzzle) => puzzle.reward);
  const canAdvanceRoom = currentRoomPuzzles.every((puzzle) => solvedSet.has(puzzle.id));
  const roomClearVisible = phase === "game" && canAdvanceRoom && roomIndex < rooms.length - 1 && !activePuzzle;
  const nextRoomTitle = rooms[roomIndex + 1]?.title ?? "엔딩";
  const selectedIntroTheme = introThemes.find((theme) => theme.id === selectedIntroThemeId) ?? null;
  const playableThemeSelected = selectedIntroThemeId === playableIntroThemeId;

  const handleNearObject = useCallback((label: string) => {
    setMessage((current) => (current === label ? current : label));
  }, []);
  const handleInteractFocusChange = useCallback((active: boolean) => {
    setNearInteractable((current) => (current === active ? current : active));
  }, []);

  useRoomAmbience(phase, roomIndex, audioEnabled);

  useEffect(() => {
    window.hayoungDebugCompleteGame = () => {
      setSolvedIds(puzzles.map((puzzle) => puzzle.id));
      setActivePuzzleId(null);
      setUnlockFeedback(null);
      setAnswer("");
      setRoomIndex(rooms.length - 1);
      setPhase("ending");
      setMessage("500일의 모든 단서가 연결됐습니다.");
    };
    return () => {
      window.hayoungDebugCompleteGame = undefined;
    };
  }, []);

  const getIntroButtonBounds = () => {
    if (typeof window === "undefined") {
      return { maxX: 220, maxY: 95 };
    }
    return {
      maxX: Math.max(64, Math.min(220, window.innerWidth * 0.26)),
      maxY: Math.max(14, Math.min(28, window.innerHeight * 0.03)),
    };
  };

  const selectIntroTheme = (theme: IntroTheme) => {
    setSelectedIntroThemeId(theme.id);
    setButtonOffset({ x: 0, y: 0 });
    setIntroEntering(false);
    if (theme.status === "open") {
      introSecondsRef.current = 0;
      setIntroUnlocked(false);
      return;
    }
    setIntroUnlocked(false);
  };

  const resetIntroSelection = () => {
    setSelectedIntroThemeId(null);
    setButtonOffset({ x: 0, y: 0 });
    setIntroUnlocked(false);
    setIntroEntering(false);
    introSecondsRef.current = 0;
  };

  useEffect(() => {
    if (phase !== "intro" || !playableThemeSelected) {
      return;
    }
    const timer = window.setInterval(() => {
      introSecondsRef.current += 1;
      if (introSecondsRef.current >= 6) {
        setIntroUnlocked(true);
        setButtonOffset({ x: 0, y: 0 });
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, playableThemeSelected]);

  useEffect(() => {
    if (phase !== "intro") {
      return;
    }
    const clampButtonToViewport = () => {
      setButtonOffset((offset) => {
        const { maxX, maxY } = getIntroButtonBounds();
        return {
          x: Math.max(-maxX, Math.min(maxX, offset.x)),
          y: Math.max(-maxY, Math.min(maxY, offset.y)),
        };
      });
    };
    window.addEventListener("resize", clampButtonToViewport);
    return () => window.removeEventListener("resize", clampButtonToViewport);
  }, [phase]);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (phase !== "game") {
        return;
      }
      if (event.key.toLowerCase() === "w" || event.key === "ArrowUp") setMovement((v) => ({ ...v, forward: true }));
      if (event.key.toLowerCase() === "s" || event.key === "ArrowDown") setMovement((v) => ({ ...v, back: true }));
      if (event.key.toLowerCase() === "a" || event.key === "ArrowLeft") setMovement((v) => ({ ...v, left: true }));
      if (event.key.toLowerCase() === "d" || event.key === "ArrowRight") setMovement((v) => ({ ...v, right: true }));
      if (event.key.toLowerCase() === "e") openNextPuzzle();
      if (event.key.toLowerCase() === "h") requestHint();
      if (event.key.toLowerCase() === "f") toggleFullscreen();
    };
    const keyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "w" || event.key === "ArrowUp") setMovement((v) => ({ ...v, forward: false }));
      if (event.key.toLowerCase() === "s" || event.key === "ArrowDown") setMovement((v) => ({ ...v, back: false }));
      if (event.key.toLowerCase() === "a" || event.key === "ArrowLeft") setMovement((v) => ({ ...v, left: false }));
      if (event.key.toLowerCase() === "d" || event.key === "ArrowRight") setMovement((v) => ({ ...v, right: false }));
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  });

  useEffect(() => {
    if (phase === "game") {
      installDelegatedTouchControls();
      publishDelegatedTouchControls();
    }
    window.render_game_to_text = () =>
      JSON.stringify({
        phase,
        introThemeSelect: "poster-led three-theme selector: Theme 01 playable, Theme 02 and Theme 03 locked as coming soon",
        selectedIntroTheme: selectedIntroTheme?.title ?? null,
        playableIntroTheme: playableIntroThemeId,
        introRunawayButtonScope: "the moving Yes button appears only after Theme 01 is selected",
        introPosterPresentation: "theme posters are shown uncropped with contain-fit art and separated title metadata below the image",
        introStartConfirmation: playableThemeSelected
          ? "Theme 01 selection transitions to a fullscreen animated 500-day start confirmation before entering the first-person room"
          : "theme selection shows the complete poster gallery before any start prompt appears",
        introEntering,
        room: currentRoom.title,
        roomIndex: roomIndex + 1,
        solvedPuzzles: solvedIds.length,
        totalPuzzles: puzzles.length,
        memorySlots: memorySlots.length,
        hintsLeft,
        penalties: hintPenalties.slice(0, hintCount).map((penalty) => penalty.label),
        hintPenaltyUX: "three-step penalty contract ticket HUD with stamped hint receipts, active obligation highlight, and non-blocking status copy",
        activeHintPenalty: activeHintPenalty?.label ?? null,
        hintPenaltyStage: `${hintCount}/3`,
        nextPuzzle: availablePuzzle?.title ?? (canAdvanceRoom ? "room clear" : blockedPuzzle?.title ?? "none"),
        nextPuzzleRequires: availablePuzzle ? [] : blockedPuzzle?.requires?.filter((id) => !solvedSet.has(id)) ?? [],
        roomClearReady: roomClearVisible,
        nextRoomTitle,
        graphicsQuality,
        graphicsQualityLabel: graphicsQualitySetting.label,
        renderScaleCap: graphicsQualitySetting.renderScale,
        performanceMode: graphicsQuality === "performance",
        cinematicAtmosphere: graphicsQualitySetting.atmosphere
          ? "volumetric light shafts, floor reflections, room-specific rain/city/heaven light layers"
          : "reduced in performance mode",
        cinematicCamera: "dynamic FOV breathing, ACES exposure ramping, movement sway, focus pull, and unlock impact",
        screenPostFx: "soft vignette, fine film grain, scanline texture, and unlock flash overlay",
        cameraMode: "first-person",
        playSurface: "full-viewport first-person Roblox-like room escape surface with keyboard movement, pointer-look, mobile joystick/look pad, and fullscreen request on start",
        embodiedView: "Hayoung first-person hands with flashlight, heart key, hair strands, skirt silhouette, and name charm",
        characterDetail: "camera-attached Hayoung avatar cues: hands, sleeves, hair, skirt hem, H/Y charm, flashlight, and heart key",
        interactableInRange: nearInteractable,
        interactionFocus: "distance-reactive reticle, floor glyph, lock halo, and focus light around the active puzzle console",
        unlockDetail: "animated latch lift, sliding bolts, glowing door seam, hinges, handle, and unlock sparks",
        collisionModel: "room bounds plus solid central puzzle console stop-zone",
        hudBehavior: "calm HUD dims secondary panels while moving and restores clarity near interactables",
        environmentDetail: "lived-in escape room wear: floor scuffs, clue tape, shelf props, wall tags, and room-specific residue",
        transitionVfx: "cinematic room transition veil with letterbox bars, energy slit, and particle sparks",
        objectiveTracker: "case-file HUD shows current lock status, next clue, room solve meter, and puzzle input progress",
        escapeVista: "rear-door escape vista uses themed silhouettes, breadcrumb floor lights, and room-specific portal dressing",
        mobileControls: "touch joystick movement, right-side look pad, and drag-responsive first-person camera",
        endingExperience: "heavenly finale with vow stats, cloud-step memory timeline, photo placeholders, and replay action",
        prologueSetDressing: "cinematic intro splash plus first-room prologue arches, photo garland, and floor light path",
        unrealMcpWebMirror:
          "Room 01 visibly mirrors the UE 5.8 MCP map in the browser: left notice desk, 2x2 memory wall, violin keyring glass case, music cabinet, 3x3 floor puzzle, beef-cuts board, steak vote table, and glowing Room 2 door.",
        roomOneUnrealLandmarks:
          roomIndex === 0
            ? [
                "left notice desk",
                "2x2 memory photo wall",
                "violin keyring glass case",
                "carousel music cabinet",
                "3x3 pyeongsang floor puzzle",
                "beef-cuts board",
                "A/B steak vote table",
                "glowing Room 2 door",
              ]
            : [],
        lockConsoleUX: "two-zone puzzle modal with case file, device readout, answer progress meter, clue chips, tactile lock console, and short unlocked success state",
        unlockFeedbackUX: "correct answers briefly hold the device modal in an OPEN readout state before the 3D latch, sparks, flash, and door motion fire",
        roomDeviceKits: "five room-specific physical puzzle kits on the central console: diary/photo slot, cafe token receipt, rain direction rail, note bridge, and finale prism gate",
        physicalClueNetwork: "in-world evidence boards, pinned clue nodes, glowing string links, and floor cable trails connect room props to the active lock and exit",
        activeUnlockFeedback: unlockFeedback?.reward ?? null,
        mobileLookActive: Boolean(window.hayoungTouchControls?.lookActive),
        ambience: audioEnabled ? currentRoom.ambience.label : "muted",
        message,
        coordinateSystem: "Three.js first-person scene uses x/z floor plane; y is height; five rooms are laid out along +x.",
      });
  }, [
    availablePuzzle,
    activeHintPenalty,
    audioEnabled,
    blockedPuzzle,
    canAdvanceRoom,
    currentRoom.ambience.label,
    currentRoom.title,
    graphicsQuality,
    graphicsQualitySetting.atmosphere,
    graphicsQualitySetting.label,
    graphicsQualitySetting.renderScale,
    hintCount,
    hintsLeft,
    lookInput.active,
    message,
    nearInteractable,
    nextRoomTitle,
    phase,
    playableThemeSelected,
    introEntering,
    selectedIntroTheme,
    roomIndex,
    roomClearVisible,
    solvedIds.length,
    solvedSet,
    unlockFeedback,
  ]);

  const triggerUnlock = (showTransition = false) => {
    setUnlockTick((value) => value + 1);
    setUnlocking(true);
    window.setTimeout(() => setUnlocking(false), 980);
    if (showTransition && !window.hayoungDebugSkipRoomTransitions) {
      setTransitioning(true);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          window.setTimeout(() => setTransitioning(false), 6200);
        });
      });
    }
  };

  const finishUnlockTransition = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    setTransitioning(false);
  };

  const evadeButton = () => {
    if (introUnlocked || !playableThemeSelected) {
      return;
    }
    const direction = Math.random() > 0.5 ? 1 : -1;
    const { maxX, maxY } = getIntroButtonBounds();
    setButtonOffset({
      x: direction * (maxX * (0.58 + Math.random() * 0.42)),
      y: (Math.random() - 0.5) * maxY * 2,
    });
  };

  const startGame = () => {
    if (!playableThemeSelected) {
      setButtonOffset({ x: 0, y: 0 });
      return;
    }
    if (!introUnlocked) {
      evadeButton();
      return;
    }
    setAudioEnabled(true);
    setMessage("하영이가 첫 번째 방에 들어왔어요. 중앙의 잠금 장치가 첫 단서를 기다립니다.");
    setIntroEntering(true);
    document.documentElement.requestFullscreen?.().catch(() => undefined);
    window.setTimeout(() => setPhase("game"), 820);
  };

  function openNextPuzzle() {
    if (phase !== "game") {
      return;
    }
    if (availablePuzzle) {
      setActivePuzzleId(availablePuzzle.id);
      setAnswer("");
      setUnlockFeedback(null);
      setMessage(`${availablePuzzle.title} 장치가 열렸습니다. ${availablePuzzle.chainNote}`);
      return;
    }
    if (blockedPuzzle) {
      const missing = blockedPuzzle.requires?.filter((id) => !solvedSet.has(id)).join(", ") || "앞 단서";
      setMessage(`${blockedPuzzle.title}은 아직 잠겨 있어요. 먼저 ${missing}번 단서를 이어야 합니다.`);
      return;
    }
    if (roomIndex < rooms.length - 1) {
      const nextRoom = rooms[roomIndex + 1];
      setRoomIndex((value) => value + 1);
      triggerUnlock(true);
      setMessage(`${nextRoom.title}으로 문이 열렸습니다. 공기와 음악이 달라졌어요.`);
      return;
    }
    setPhase("ending");
  }

  function submitPuzzle() {
    if (!activePuzzle || unlockFeedback) {
      return;
    }
    const normalizedAnswer = normalizePuzzleAnswer(activePuzzle, answer);
    if (normalizedAnswer !== activePuzzle.answer) {
      setAnswer(normalizedAnswer);
      setUnlockFeedback(null);
      setMessage("아직 맞지 않아요. 단서의 순서와 장치의 형태를 다시 맞춰보세요.");
      return;
    }
    const solvedPuzzle = activePuzzle;
    setAnswer(normalizedAnswer);
    setUnlockFeedback({ puzzleId: solvedPuzzle.id, title: solvedPuzzle.title, reward: solvedPuzzle.reward });
    setMessage(`장치가 열리는 중... ${solvedPuzzle.reward} 회로가 연결됐습니다.`);

    const unlockDelay = window.hayoungDebugFastUnlock ? 1100 : window.hayoungDebugHoldUnlock ? 5200 : 1400;
    window.setTimeout(() => {
      setSolvedIds((ids) => (ids.includes(solvedPuzzle.id) ? ids : [...ids, solvedPuzzle.id]));
      setMessage(`${solvedPuzzle.reward} 획득! ${solvedPuzzle.chainNote}`);
      setActivePuzzleId((current) => (current === solvedPuzzle.id ? null : current));
      setUnlockFeedback((current) => (current?.puzzleId === solvedPuzzle.id ? null : current));
      setAnswer("");
      triggerUnlock(solvedPuzzle.id === 10);

      if (solvedPuzzle.id === 10) {
        window.setTimeout(() => setPhase("ending"), 520);
      }
    }, unlockDelay);
  }

  function requestHint() {
    if (hintCount >= 3) {
      setMessage("힌트 계약서가 모두 찍혔어요. 이제 남은 건 하영이의 추리력입니다.");
      return;
    }
    const penalty = hintPenalties[hintCount];
    setHintCount((count) => count + 1);
    setMessage(`힌트 계약서 ${hintCount + 1}/3 발급: ${penalty.label}. 현재 장치는 ${availablePuzzle?.title ?? "마지막 문"}입니다.`);
  }

  function cycleGraphicsQuality() {
    setGraphicsQuality((value) => graphicsQualityCycle[(graphicsQualityCycle.indexOf(value) + 1) % graphicsQualityCycle.length]);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => undefined);
      return;
    }
    document.exitFullscreen().catch(() => undefined);
  }

  const roomProgress = `${roomIndex + 1}/${rooms.length}`;
  const puzzleProgress = `${solvedIds.length}/${puzzles.length}`;
  const playerIsMoving = movement.forward || movement.back || movement.left || movement.right;
  const activeCasePuzzle = activePuzzle ?? availablePuzzle ?? blockedPuzzle;
  const roomSolvedCount = currentRoomPuzzles.filter((puzzle) => solvedSet.has(puzzle.id)).length;
  const caseStatus = activePuzzle
    ? "잠금 장치 조작 중"
    : roomClearVisible
      ? "방 클리어"
      : availablePuzzle
        ? "다음 장치 감지"
        : blockedPuzzle
          ? "연계 단서 필요"
          : "엔딩 준비";
  const caseTitle = activeCasePuzzle?.title ?? (roomClearVisible ? `${nextRoomTitle}로 이동` : "모든 단서 정리");
  const caseDetail = activePuzzle
    ? activePuzzle.chainNote
    : availablePuzzle
      ? availablePuzzle.prompt
      : blockedPuzzle
        ? `${blockedPuzzle.title}은 앞 단서를 먼저 이어야 열립니다.`
        : canAdvanceRoom
          ? "이 방의 장치가 모두 반응했습니다. 문 앞의 빛을 따라가세요."
          : currentRoom.mood;
  const activePuzzleUnlocked = Boolean(activePuzzle && unlockFeedback?.puzzleId === activePuzzle.id);
  const activePuzzleProgress = activePuzzle ? (activePuzzleUnlocked ? 100 : Math.round((answer.length / activePuzzle.answer.length) * 100)) : 0;
  const activePuzzleRequirementLabel = activePuzzle?.requires?.length ? `연계 ${activePuzzle.requires.length}개` : "첫 단서";
  const activePuzzleReadout = activePuzzle
    ? activePuzzleUnlocked
      ? "OPEN"
      : answer.padEnd(activePuzzle.answer.length, "·")
    : "";

  return (
    <main className="site-shell">
      {transitioning && (
        <div className="transition-veil" aria-hidden="true" onAnimationEnd={finishUnlockTransition}>
          <span />
          <span />
          <span />
        </div>
      )}

      {phase === "intro" && (
        <section
          className={`intro-screen${introUnlocked ? " is-open" : ""}${playableThemeSelected ? " has-playable-theme" : ""}${introEntering ? " is-entering" : ""}`}
        >
          <div className="intro-backdrop" />
          <div className="intro-stage" aria-hidden="true">
            <span className="intro-veil intro-veil-left" />
            <span className="intro-veil intro-veil-right" />
            <span className="intro-door-slit" />
            <span className="intro-floor-path" />
            <span className="intro-threshold" />
            <span className="intro-photo-strip intro-photo-strip-a" />
            <span className="intro-photo-strip intro-photo-strip-b" />
            <span className="intro-memory-lights intro-memory-lights-a" />
            <span className="intro-memory-lights intro-memory-lights-b" />
            <span className="intro-sidewall intro-sidewall-left" />
            <span className="intro-sidewall intro-sidewall-right" />
          </div>
          <div className="intro-copy theme-select-shell">
            <div className="theme-select-heading">
              <p className="couple-mark">HYUNSU × HAYOUNG / 500 DAYS</p>
              <h1>500일 기념 방탈출 테마를 골라주세요</h1>
              <p>오늘 열 수 있는 문은 하나예요. 나머지 사건은 더 귀엽고 무섭게 준비 중입니다.</p>
            </div>

            <div className="theme-grid" aria-label="500일 방탈출 테마 선택">
              {introThemes.map((theme) => {
                const selected = selectedIntroThemeId === theme.id;
                const locked = theme.status === "locked";
                const posterStyle: PosterCardStyle = { "--poster-aspect": `${theme.posterWidth} / ${theme.posterHeight}` };
                return (
                  <button
                    key={theme.id}
                    type="button"
                    className={`theme-card${selected ? " is-selected" : ""}${locked ? " is-locked" : ""}`}
                    style={posterStyle}
                    aria-pressed={selected}
                    aria-label={`${theme.title} ${locked ? "잠금, 곧 출시 예정" : "선택 가능"}`}
                    onClick={() => selectIntroTheme(theme)}
                  >
                    <span className="theme-poster-frame">
                      <img
                        src={theme.poster}
                        alt={`${theme.title} 테마 포스터`}
                        width={theme.posterWidth}
                        height={theme.posterHeight}
                      />
                      {locked && (
                        <span className="theme-lock" aria-hidden="true">
                          <LockKeyhole />
                        </span>
                      )}
                    </span>
                    <span className="theme-card-body">
                      <span className="theme-kicker">
                        <b>{theme.number}</b>
                        <i>{locked ? "곧 출시 예정" : "지금 플레이 가능"}</i>
                      </span>
                      <strong>{theme.title}</strong>
                      <em>{theme.subtitle}</em>
                      <span className="theme-description">{theme.description}</span>
                      <span className="theme-meta">
                        {theme.meta.map((item) => (
                          <small key={item}>{item}</small>
                        ))}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className={`theme-start-panel${selectedIntroTheme?.status === "locked" ? " is-locked" : ""}${playableThemeSelected ? " is-confirming" : ""}`}
              style={
                playableThemeSelected
                  ? {
                      position: "fixed",
                      inset: 0,
                      width: "100vw",
                      maxWidth: "none",
                      height: "100vh",
                      minHeight: "100dvh",
                    }
                  : undefined
              }
            >
              {selectedIntroTheme ? (
                <>
                  <span className="theme-start-eyebrow">{selectedIntroTheme.number}</span>
                  <h2>
                    {selectedIntroTheme.status === "open"
                      ? "500일 기념으로 게임을 시작하시겠습니까?"
                      : "이 테마는 아직 문이 잠겨 있어요"}
                  </h2>
                  <p>
                    {selectedIntroTheme.status === "open"
                      ? "연애 일대기의 첫 문이 열리고 있어요. 잠시 뒤 조명이 켜지면 첫 번째 기억의 방으로 들어갑니다."
                      : `${selectedIntroTheme.title}는 곧 출시 예정입니다. 오늘은 연애 일대기부터 열어볼 수 있어요.`}
                  </p>
                </>
              ) : (
                <>
                  <span className="theme-start-eyebrow">SELECT THEME</span>
                  <h2>먼저 1번 테마를 선택해주세요</h2>
                  <p>테마 포스터를 고르면 입구의 문이 반응합니다.</p>
                </>
              )}

              {playableThemeSelected && (
                <div className="theme-confirm-actions">
                  <button
                    className={`runaway-button${introUnlocked ? " is-ready" : ""}`}
                    style={{ translate: `${buttonOffset.x}px ${buttonOffset.y}px` }}
                    aria-label="네, 500일 방탈출 시작하기"
                    onClick={startGame}
                    onMouseEnter={evadeButton}
                    onMouseMove={evadeButton}
                    onMouseOver={evadeButton}
                    onFocus={evadeButton}
                    onPointerEnter={evadeButton}
                    onPointerMove={evadeButton}
                    onTouchStart={evadeButton}
                    type="button"
                  >
                    <Heart aria-hidden="true" />
                    <span>네</span>
                  </button>
                  <button className="theme-back-button" type="button" onClick={resetIntroSelection}>
                    연애 일대기 포스터 다시 보기
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {(phase === "game" || phase === "ending") && (
        <section
          className={`game-screen${unlocking ? " is-unlocking" : ""}${nearInteractable ? " has-focus-target" : ""}${playerIsMoving ? " is-moving" : ""}${phase === "ending" ? " is-ending" : ""}`}
          aria-label="500일 1인칭 3D 방탈출"
        >
          <AnniversaryScene
            roomIndex={roomIndex}
            phase={phase}
            solvedCount={solvedIds.length}
            movement={movement}
            lookInput={lookInput}
            unlockTick={unlockTick}
            graphicsQuality={graphicsQuality}
            onNearObject={handleNearObject}
            onInteractFocusChange={handleInteractFocusChange}
          />

          {phase === "game" && (
            <>
              <div className={`center-reticle${nearInteractable ? " is-focused" : ""}`} aria-hidden="true" />

              <header className="hud top-hud">
                <div className="hud-cluster brand-chip">
                  <Heart aria-hidden="true" />
                  <span>500일의 방</span>
                </div>
                <div className="hud-cluster progress-chip">
                  <span>Room {roomProgress}</span>
                  <span>Puzzle {puzzleProgress}</span>
                  <span>Hints {hintsLeft}</span>
                </div>
                <div className="hud-cluster icon-actions">
                  <button type="button" onClick={requestHint} title="힌트 사용" aria-label="힌트 사용">
                    <HelpCircle aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => setAudioEnabled((value) => !value)} title="배경음 전환" aria-label="배경음 전환">
                    {audioEnabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    onClick={cycleGraphicsQuality}
                    title={`그래픽 품질: ${graphicsQualitySetting.label}`}
                    aria-label={`그래픽 품질: ${graphicsQualitySetting.label}`}
                    data-quality={graphicsQuality}
                  >
                    <Sparkles aria-hidden="true" />
                  </button>
                  <button type="button" onClick={toggleFullscreen} title="전체화면" aria-label="전체화면">
                    <Expand aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => window.location.reload()} title="처음부터" aria-label="처음부터">
                    <RotateCcw aria-hidden="true" />
                  </button>
                </div>
              </header>

          <aside className="objective-panel">
            <span>{currentRoom.days}</span>
            <h2>{currentRoom.title}</h2>
            <p>{currentRoom.subtitle}</p>
            <small>{currentRoom.mood}</small>
          </aside>

          <div className="room-beads" aria-label="방 진행도">
            {rooms.map((room, index) => (
              <button
                key={room.id}
                type="button"
                className={index === roomIndex ? "is-current" : index < roomIndex ? "is-cleared" : ""}
                disabled={index > roomIndex}
                onClick={() => setRoomIndex(index)}
              >
                {room.id}
              </button>
            ))}
          </div>

          <aside className="case-file-panel" aria-label="현재 사건 파일">
            <div className="case-file-heading">
              <KeyRound aria-hidden="true" />
              <span>{caseStatus}</span>
              <b>
                {roomSolvedCount}/{currentRoomPuzzles.length}
              </b>
            </div>
            <strong>{caseTitle}</strong>
            <p>{caseDetail}</p>
            <div className="case-file-meter" aria-hidden="true">
              {currentRoomPuzzles.map((puzzle) => (
                <span
                  key={puzzle.id}
                  className={solvedSet.has(puzzle.id) ? "is-solved" : activeCasePuzzle?.id === puzzle.id ? "is-current" : ""}
                />
              ))}
            </div>
          </aside>

          <div className="message-strip">
            <Sparkles aria-hidden="true" />
            <span>{message}</span>
          </div>

          <footer className="inventory-dock">
            <div className="dock-title">
              <span className="player-avatar" aria-hidden="true">
                <span />
              </span>
              <span className="player-name">하영</span>
              <Backpack aria-hidden="true" />
            </div>
            <div className="item-slots">
              {Array.from({ length: 10 }).map((_, index) => (
                <div className="item-slot" key={index}>
                  {inventory[index] ? <span>{inventory[index]}</span> : null}
                </div>
              ))}
            </div>
          </footer>

          {phase === "game" && !roomClearVisible && (
            <button className={`interact-button${nearInteractable ? " is-focused" : ""}`} type="button" onClick={openNextPuzzle}>
              {canAdvanceRoom && roomIndex < rooms.length - 1 ? <DoorOpen aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
              {availablePuzzle ? "E 조사하기" : roomIndex < rooms.length - 1 ? "다음 방" : "엔딩 보기"}
            </button>
          )}

          {phase === "game" && (
            <>
              <div className="mobile-pad" aria-label="모바일 이동 패드">
                <span className="mobile-pad-ring" aria-hidden="true" />
                <span className="mobile-pad-core" aria-hidden="true" />
                <button className="move-up" type="button" data-move="forward">
                  <ArrowUp aria-hidden="true" />
                </button>
                <button className="move-left" type="button" data-move="left">
                  <ArrowLeft aria-hidden="true" />
                </button>
                <button className="move-down" type="button" data-move="back">
                  <ArrowDown aria-hidden="true" />
                </button>
                <button className="move-right" type="button" data-move="right">
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>

              <div className={`look-pad${lookInput.active ? " is-active" : ""}`} aria-label="모바일 시점 조작 패드" role="application">
                <span className="look-pad-orbit" aria-hidden="true" />
                <span className="look-pad-dot" aria-hidden="true" />
              </div>
            </>
          )}

              {hintCount > 0 && (
                <aside className={`penalty-card penalty-card--${activeHintPenalty?.tone ?? "banana"}`} aria-label="힌트 벌칙 계약서">
                  <div className="penalty-card-header">
                    <span>Hint Contract</span>
                    <b>{hintCount}/3</b>
                  </div>
                  <div className="penalty-current">
                    <span>{activeHintPenalty?.detail}</span>
                    <strong>{activeHintPenalty?.label}</strong>
                  </div>
                  <div className="penalty-ticket-list" aria-label="힌트 벌칙 단계">
                    {hintPenalties.map((penalty, index) => {
                      const used = index < hintCount;
                      const active = index === hintCount - 1;
                      return (
                        <span
                          className={`penalty-ticket${used ? " is-used" : ""}${active ? " is-active" : ""}`}
                          key={penalty.id}
                        >
                          <i>{index + 1}</i>
                          <b>{penalty.shortLabel}</b>
                        </span>
                      );
                    })}
                  </div>
                </aside>
              )}
            </>
          )}

          {roomClearVisible && (
            <div className="room-clear-layer" aria-live="polite">
              <section className="room-clear-panel" aria-label={`${currentRoom.title} 클리어`}>
                <span className="clear-kicker">Room {roomProgress} Clear</span>
                <h2>{currentRoom.title} 탈출 성공</h2>
                <p>{currentRoom.mood}</p>
                <div className="room-clear-rewards" aria-label="획득한 단서">
                  {currentRoomPuzzles.map((puzzle) => (
                    <span key={puzzle.id}>{puzzle.reward}</span>
                  ))}
                </div>
                <button className="room-clear-button" type="button" onClick={openNextPuzzle}>
                  <DoorOpen aria-hidden="true" />
                  {nextRoomTitle}으로 이동
                </button>
              </section>
            </div>
          )}

          {activePuzzle && (
            <div className="modal-layer">
              <section
                className={`puzzle-modal lock-console-modal${answer ? " has-answer" : ""}${activePuzzleUnlocked ? " is-unlocked" : ""}`}
                role="dialog"
                aria-label={activePuzzle.title}
                aria-live="polite"
                style={{ "--answer-progress": `${activePuzzleProgress}%` } as CSSProperties}
              >
                <button
                  className="close-button"
                  type="button"
                  onClick={() => {
                    if (!activePuzzleUnlocked) {
                      setActivePuzzleId(null);
                      setUnlockFeedback(null);
                    }
                  }}
                  disabled={activePuzzleUnlocked}
                >
                  <X aria-hidden="true" />
                </button>
                <div className="lock-console-grid">
                  <div className="lock-case-file">
                    <span className="lock-kicker">
                      문제 {activePuzzle.id}/10 · {kindLabel(activePuzzle.kind)}
                    </span>
                    <h2>{activePuzzle.title}</h2>
                    <p>{activePuzzle.prompt}</p>
                    <div className="lock-clue-chips" aria-label="잠금 정보">
                      <span>{currentRoom.days}</span>
                      <span>{activePuzzleRequirementLabel}</span>
                      <span>{activePuzzle.reward}</span>
                    </div>
                    <p className="chain-note">{activePuzzle.chainNote}</p>
                  </div>

                  <div className="lock-device-console">
                    <div className="lock-device-topline" aria-hidden="true">
                      <span>{activePuzzleUnlocked ? "UNLOCKED" : "LOCK DEVICE"}</span>
                      <b>{activePuzzleUnlocked ? "OPEN" : `${answer.length}/${activePuzzle.answer.length}`}</b>
                    </div>
                    <div className="device-readout" aria-label="입력 진행 상황">
                      <span>{activePuzzleReadout}</span>
                    </div>
                    {activePuzzleUnlocked && (
                      <div className="unlock-confirmation" role="status">
                        <Check aria-hidden="true" />
                        {unlockFeedback?.reward} 회로 연결
                      </div>
                    )}
                    <div className="lock-status-rail" aria-hidden="true">
                      <span>{activePuzzleUnlocked ? "CLEAR" : activePuzzle.requires?.length ? "CHAIN" : "FIRST"}</span>
                      <b>{activePuzzleUnlocked ? "UNLOCKED" : activePuzzle.kind.toUpperCase()}</b>
                      <span>{activePuzzleProgress}%</span>
                    </div>
                    <LockPreview kind={activePuzzle.kind} answer={activePuzzle.answer} />
                    <PuzzleInputPad puzzle={activePuzzle} answer={answer} setAnswer={setAnswer} disabled={activePuzzleUnlocked} />
                    <div className="answer-row">
                      <input
                        value={answer}
                        onChange={(event) => setAnswer(normalizePuzzleAnswer(activePuzzle, event.target.value))}
                        inputMode={activePuzzle.kind === "code" || activePuzzle.kind === "memory" ? "numeric" : "text"}
                        maxLength={activePuzzle.answer.length}
                        placeholder={`초안 정답: ${activePuzzle.answer}`}
                        autoCapitalize="characters"
                        spellCheck="false"
                        autoFocus
                        disabled={activePuzzleUnlocked}
                      />
                      <button type="button" onClick={submitPuzzle} disabled={activePuzzleUnlocked}>
                        <Check aria-hidden="true" />
                        {activePuzzleUnlocked ? "열림" : "확인"}
                      </button>
                    </div>
                  </div>
                </div>
                {activePuzzleUnlocked && (
                  <div className="lock-success-burst" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                )}
              </section>
            </div>
          )}

          {phase === "ending" && (
            <div className="ending-letter">
              <div className="ending-aura" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="ending-copy">
                <span>500일의 문이 열렸어</span>
                <h2>하영아, 다음 방도 우리 둘이 같이 열자.</h2>
                <p>
                  지나온 날들에는 풋풋함도, 다툼도, 지친 밤도 있었지만 결국 우리는 서로의 편으로 돌아왔어. 500일 이후의 방은 혼자 푸는 문제가 아니라,
                  같이 웃고 같이 쉬면서 천천히 열어가자.
                </p>
                <div className="ending-vows" aria-label="다음 약속">
                  <span>
                    <b>500</b>
                    <small>함께 쌓은 날</small>
                  </span>
                  <span>
                    <b>10</b>
                    <small>풀어낸 단서</small>
                  </span>
                  <span>
                    <b>∞</b>
                    <small>다음 약속</small>
                  </span>
                </div>
              </div>
              <div className="cloud-step-rail" aria-hidden="true">
                {memorySlots.map((slot, index) => (
                  <span key={`${slot.id}-cloud`} style={{ "--step": index } as CSSProperties} />
                ))}
              </div>
              <div className="memory-timeline" aria-label="500일 기억 타임라인">
                {memorySlots.map((slot, index) => (
                  <figure className="memory-card" key={slot.id}>
                    <i aria-hidden="true">{String(index + 1).padStart(2, "0")}</i>
                    <img src={slot.image} alt={`${slot.dayRange} ${slot.title}`} />
                    <figcaption>
                      <b>{slot.dayRange}</b>
                      <strong>{slot.title}</strong>
                      <small>{slot.caption}</small>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <button className="ending-replay" type="button" onClick={() => window.location.reload()}>
                <RotateCcw aria-hidden="true" />
                처음부터 다시 걷기
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function LockPreview({ kind, answer }: { kind: PuzzleKind; answer: string }) {
  if (kind === "direction") {
    return (
      <div className="lock-preview direction-preview" aria-hidden="true">
        <ArrowUp />
        <ArrowLeft />
        <span>{answer}</span>
        <ArrowRight />
        <ArrowDown />
      </div>
    );
  }

  if (kind === "symbol" || kind === "final") {
    return (
      <div className="lock-preview symbol-preview" aria-hidden="true">
        {answer.split("").map((letter, index) => (
          <b key={`${letter}-${index}`}>{letter}</b>
        ))}
      </div>
    );
  }

  return (
    <div className="lock-preview code-preview" aria-hidden="true">
      {answer.split("").map((digit, index) => (
        <b key={`${digit}-${index}`}>{digit}</b>
      ))}
    </div>
  );
}

function PuzzleInputPad({
  puzzle,
  answer,
  setAnswer,
  disabled = false,
}: {
  puzzle: Puzzle;
  answer: string;
  setAnswer: (value: string | ((current: string) => string)) => void;
  disabled?: boolean;
}) {
  const appendValue = (value: string) => {
    if (disabled) {
      return;
    }
    setAnswer((current: string) => normalizePuzzleAnswer(puzzle, current + value));
  };
  const setPreset = (value: string) => {
    if (disabled) {
      return;
    }
    setAnswer(normalizePuzzleAnswer(puzzle, value));
  };
  const removeLast = () => {
    if (disabled) {
      return;
    }
    setAnswer((current: string) => current.slice(0, -1));
  };
  const clearValue = () => {
    if (disabled) {
      return;
    }
    setAnswer("");
  };

  if (puzzle.kind === "direction") {
    return (
      <div className="puzzle-pad direction-pad" aria-label="Direction lock controls" aria-disabled={disabled}>
        <button className="dir-key dir-up" type="button" onClick={() => appendValue("U")} aria-label="Up" disabled={disabled}>
          <ArrowUp aria-hidden="true" />
        </button>
        <button className="dir-key dir-left" type="button" onClick={() => appendValue("L")} aria-label="Left" disabled={disabled}>
          <ArrowLeft aria-hidden="true" />
        </button>
        <button className="pad-utility dir-back" type="button" onClick={removeLast} aria-label="Delete one" title="한 글자 지우기" disabled={disabled}>
          <Delete aria-hidden="true" />
        </button>
        <button className="dir-key dir-right" type="button" onClick={() => appendValue("R")} aria-label="Right" disabled={disabled}>
          <ArrowRight aria-hidden="true" />
        </button>
        <button className="dir-key dir-down" type="button" onClick={() => appendValue("D")} aria-label="Down" disabled={disabled}>
          <ArrowDown aria-hidden="true" />
        </button>
        <button className="pad-utility dir-clear" type="button" onClick={clearValue} aria-label="Clear" title="전체 지우기" disabled={disabled}>
          <RotateCcw aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (puzzle.kind === "code") {
    return (
      <div className="puzzle-pad code-pad" aria-label="Numeric lock controls" aria-disabled={disabled}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((digit) => (
          <button type="button" key={digit} onClick={() => appendValue(digit)} aria-label={`Digit ${digit}`} disabled={disabled}>
            {digit}
          </button>
        ))}
        <button className="pad-utility" type="button" onClick={removeLast} aria-label="Delete one" title="한 글자 지우기" disabled={disabled}>
          <Delete aria-hidden="true" />
        </button>
        <button className="pad-utility" type="button" onClick={clearValue} aria-label="Clear" title="전체 지우기" disabled={disabled}>
          <RotateCcw aria-hidden="true" />
        </button>
      </div>
    );
  }

  const choicesByKind: Partial<Record<PuzzleKind, string[]>> = {
    memory: ["1", "2", "3"],
    symbol: ["STAR", "MOON", "LOVE"],
    device: ["SCAN", "OPEN", "ON"],
    final: ["YES", "NO"],
  };
  const choices = choicesByKind[puzzle.kind] ?? [];

  return (
    <div className="puzzle-pad choice-pad" aria-label="Puzzle choice controls" aria-disabled={disabled}>
      {choices.map((choice) => (
        <button
          className={`choice-key${answer === choice ? " is-active" : ""}`}
          type="button"
          key={choice}
          onClick={() => setPreset(choice)}
          aria-pressed={answer === choice}
          disabled={disabled}
        >
          {choice}
        </button>
      ))}
      <button className="pad-utility" type="button" onClick={removeLast} aria-label="Delete one" title="한 글자 지우기" disabled={disabled}>
        <Delete aria-hidden="true" />
      </button>
      <button className="pad-utility" type="button" onClick={clearValue} aria-label="Clear" title="전체 지우기" disabled={disabled}>
        <RotateCcw aria-hidden="true" />
      </button>
    </div>
  );
}

function kindLabel(kind: PuzzleKind) {
  return {
    code: "숫자 자물쇠",
    direction: "방향 자물쇠",
    symbol: "상징 장치",
    memory: "기억 단서",
    device: "센서 장치",
    final: "마지막 문",
  }[kind];
}

function useRoomAmbience(phase: Phase, roomIndex: number, enabled: boolean) {
  const audioRef = useRef<{
    context: AudioContext;
    master: GainNode;
    oscA: OscillatorNode;
    oscB: OscillatorNode;
    lfo: OscillatorNode;
    lfoGain: GainNode;
  } | null>(null);

  useEffect(() => {
    if (phase !== "game" || !enabled) {
      const audio = audioRef.current;
      if (audio && audio.context.state !== "closed") {
        audio.master.gain.setTargetAtTime(0, audio.context.currentTime, 0.12);
      }
      return;
    }

    if (audioRef.current?.context.state === "closed") {
      audioRef.current = null;
    }

    if (!audioRef.current) {
      const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) {
        return;
      }
      const context = new AudioCtor();
      const master = context.createGain();
      const oscA = context.createOscillator();
      const oscB = context.createOscillator();
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      const filter = context.createBiquadFilter();

      oscA.type = "sine";
      oscB.type = "triangle";
      lfo.type = "sine";
      filter.type = "lowpass";
      filter.frequency.value = 900;
      lfoGain.gain.value = 0.012;
      master.gain.value = 0;

      lfo.connect(lfoGain);
      lfoGain.connect(master.gain);
      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(master);
      master.connect(context.destination);

      oscA.start();
      oscB.start();
      lfo.start();
      audioRef.current = { context, master, oscA, oscB, lfo, lfoGain };
    }

    const audio = audioRef.current;
    if (audio.context.state !== "closed") {
      void audio.context.resume().catch(() => undefined);
    }
    const now = audio.context.currentTime;
    const ambience = rooms[roomIndex].ambience;
    audio.oscA.frequency.setTargetAtTime(ambience.base, now, 0.35);
    audio.oscB.frequency.setTargetAtTime(ambience.harmony, now, 0.35);
    audio.lfo.frequency.setTargetAtTime(ambience.pulse, now, 0.35);
    audio.master.gain.setTargetAtTime(0.035, now, 0.18);
  }, [enabled, phase, roomIndex]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }
      try {
        audio.oscA.stop();
        audio.oscB.stop();
        audio.lfo.stop();
      } catch {
        // The browser can stop oscillator nodes during hot reload cleanup.
      }
      if (audio.context.state !== "closed") {
        void audio.context.close().catch(() => undefined);
      }
      audioRef.current = null;
    };
  }, []);
}

type SceneProps = {
  roomIndex: number;
  phase: Phase;
  solvedCount: number;
  movement: MovementState;
  lookInput: LookInput;
  unlockTick: number;
  graphicsQuality: GraphicsQuality;
  onNearObject: (label: string) => void;
  onInteractFocusChange: (active: boolean) => void;
};

type FirstPersonRig = {
  group: THREE.Group;
  leftHand: THREE.Mesh;
  rightHand: THREE.Mesh;
  flashlight: THREE.Group;
  beam: THREE.Mesh;
  key: THREE.Group;
  light: THREE.SpotLight;
};

function AnniversaryScene({ roomIndex, phase, solvedCount, movement, lookInput, unlockTick, graphicsQuality, onNearObject, onInteractFocusChange }: SceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const movementRef = useRef(movement);
  const lookInputRef = useRef(lookInput);
  const roomIndexRef = useRef(roomIndex);
  const phaseRef = useRef(phase);
  const solvedRef = useRef(solvedCount);
  const unlockTickRef = useRef(unlockTick);
  const graphicsQualityRef = useRef(graphicsQuality);

  useEffect(() => {
    movementRef.current = movement;
  }, [movement]);

  useEffect(() => {
    lookInputRef.current = lookInput;
  }, [lookInput]);

  useEffect(() => {
    roomIndexRef.current = roomIndex;
  }, [roomIndex]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    solvedRef.current = solvedCount;
  }, [solvedCount]);

  useEffect(() => {
    unlockTickRef.current = unlockTick;
  }, [unlockTick]);

  useEffect(() => {
    graphicsQualityRef.current = graphicsQuality;
  }, [graphicsQuality]);

  useEffect(() => {
    if (!mountRef.current) {
      return;
    }

    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x120f12, 0.018);

    const camera = new THREE.PerspectiveCamera(66, mount.clientWidth / mount.clientHeight, 0.08, 260);
    camera.position.set(0, 1.65, 3.25);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.88;
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.14, 0.38, 0.5);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    const root = new THREE.Group();
    scene.add(root);

    const ambient = new THREE.HemisphereLight(0xfff1d2, 0x1e2a44, 0.92);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffd79a, 2.45);
    sun.position.set(-5, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 30;
    scene.add(sun);

    const roomGroups = rooms.map((room, index) => createRoom(room, index));
    roomGroups.forEach((group) => root.add(group));

    const dust = createDustField();
    scene.add(dust);

    const firstPersonRig = createFirstPersonRig();
    camera.add(firstPersonRig.group);

    const player = {
      position: new THREE.Vector3(0, 1.65, 3.25),
      yaw: 0,
      pitch: -0.04,
    };
    let bob = 0;
    let lastFrameTime = performance.now();
    let elapsedTime = 0;
    let animation = 0;
    let lastActiveRoomIndex = roomIndexRef.current;
    let lastUnlockTick = unlockTickRef.current;
    let unlockStartedAt = -99;
    let lastNearPing = 0;
    let lastFocusState = false;
    let activePixelRatio = 0;
    let activeShadowMode: boolean | null = null;
    let activeAtmosphereMode: boolean | null = null;
    let lastLookInputTick = window.hayoungTouchControls?.tick ?? lookInputRef.current.tick;

    const applyGraphicsQuality = (forceSize = false) => {
      const setting = graphicsQualitySettings[graphicsQualityRef.current];
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, setting.renderScale);

      if (forceSize || Math.abs(pixelRatio - activePixelRatio) > 0.01) {
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height);
        composer.setSize(width, height);
        bloomPass.setSize(width, height);
        activePixelRatio = pixelRatio;
      }

      if (activeShadowMode !== setting.shadows) {
        renderer.shadowMap.enabled = setting.shadows;
        sun.castShadow = setting.shadows;
        activeShadowMode = setting.shadows;
      }

      dust.visible = setting.dust;
      if (activeAtmosphereMode !== setting.atmosphere) {
        roomGroups.forEach((group) => {
          group.traverse((object) => {
            if (object.userData.cinematicAtmosphere) {
              object.visible = setting.atmosphere;
            }
          });
        });
        activeAtmosphereMode = setting.atmosphere;
      }
      return setting;
    };

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      const narrowView = width < 700 || width / height < 0.72;
      firstPersonRig.group.userData.baseY = narrowView ? -1.04 : -0.78;
      firstPersonRig.group.userData.baseZ = narrowView ? -1.2 : -1.05;
      firstPersonRig.group.userData.baseScale = narrowView ? 0.34 : 0.58;
      firstPersonRig.beam.visible = !narrowView;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      applyGraphicsQuality(true);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") {
        renderer.domElement.requestPointerLock?.();
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement) {
        return;
      }
      player.yaw -= event.movementX * 0.0022;
      player.pitch = THREE.MathUtils.clamp(player.pitch - event.movementY * 0.0018, -0.78, 0.62);
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("mousemove", onMouseMove);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const step = (delta: number) => {
      const qualitySetting = applyGraphicsQuality();
      elapsedTime += delta;
      const activeRoom = rooms[roomIndexRef.current];
      const targetX = roomIndexRef.current * 24;
      if (roomIndexRef.current !== lastActiveRoomIndex) {
        lastActiveRoomIndex = roomIndexRef.current;
        player.position.set(targetX, 1.66, 3.25);
        player.yaw = 0;
        player.pitch = roomIndexRef.current === 4 ? -0.02 : -0.04;
        bob = 0;
      }
      const move = movementRef.current;
      const touchControls = window.hayoungTouchControls;
      const touchLook = touchControls ?? lookInputRef.current;
      if (touchLook.tick !== lastLookInputTick) {
        player.yaw -= touchLook.yawDelta * 0.0042;
        player.pitch = THREE.MathUtils.clamp(player.pitch - touchLook.pitchDelta * 0.0032, -0.78, 0.62);
        lastLookInputTick = touchLook.tick;
      }
      const speed = 4.4 * delta;
      const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
      const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
      const velocity = new THREE.Vector3();

      if (move.forward || touchControls?.forward) velocity.add(forward);
      if (move.back || touchControls?.back) velocity.sub(forward);
      if (move.right || touchControls?.right) velocity.add(right);
      if (move.left || touchControls?.left) velocity.sub(right);
      if (velocity.lengthSq() > 0) {
        velocity.normalize().multiplyScalar(speed);
        bob += delta * 9;
      } else {
        bob += delta * 2.2;
      }

      let nextPlayerX = THREE.MathUtils.clamp(player.position.x + velocity.x, targetX - 5.95, targetX + 5.95);
      let nextPlayerZ = THREE.MathUtils.clamp(player.position.z + velocity.z, -3.35, 3.85);
      const consoleHalfWidth = 3.38;
      const consoleFrontZ = 0.18;
      const consoleBackZ = -2.62;
      if (Math.abs(nextPlayerX - targetX) < consoleHalfWidth && nextPlayerZ < consoleFrontZ && nextPlayerZ > consoleBackZ) {
        if (player.position.z >= consoleFrontZ) {
          nextPlayerZ = consoleFrontZ;
        } else if (player.position.z <= consoleBackZ) {
          nextPlayerZ = consoleBackZ;
        } else {
          nextPlayerX = player.position.x < targetX ? targetX - consoleHalfWidth : targetX + consoleHalfWidth;
        }
      }
      player.position.x = nextPlayerX;
      player.position.z = nextPlayerZ;
      player.position.y = 1.66 + Math.sin(bob) * (velocity.lengthSq() > 0 ? 0.035 : 0.012);

      const isMoving = velocity.lengthSq() > 0;
      const cameraRoll = Math.sin(bob * 0.74) * (isMoving ? 0.012 : 0.003);
      camera.position.copy(player.position);
      camera.rotation.set(player.pitch, player.yaw, cameraRoll, "YXZ");
      window.hayoungCameraState = {
        x: Number(player.position.x.toFixed(3)),
        z: Number(player.position.z.toFixed(3)),
        yaw: Number(player.yaw.toFixed(4)),
        pitch: Number(player.pitch.toFixed(4)),
      };

      const targetBackground = new THREE.Color(activeRoom.palette[0]).lerp(new THREE.Color(activeRoom.palette[3]), roomIndexRef.current === 4 ? 0.08 : 0.5);
      scene.background = targetBackground;
      scene.fog!.color.copy(targetBackground.clone().lerp(new THREE.Color(0x08090e), 0.45));
      bloomPass.strength = (roomIndexRef.current === 4 || phaseRef.current === "ending" ? 0.24 : 0.14) * qualitySetting.bloomMultiplier;

      if (unlockTickRef.current !== lastUnlockTick) {
        lastUnlockTick = unlockTickRef.current;
        unlockStartedAt = elapsedTime;
      }
      const unlockProgress = THREE.MathUtils.clamp((elapsedTime - unlockStartedAt) / 1.2, 0, 1);
      animateFirstPersonRig(firstPersonRig, elapsedTime, isMoving, unlockProgress, solvedRef.current);

      const puzzlePoint = new THREE.Vector3(targetX, 1.0, -1.35);
      const distance = puzzlePoint.distanceTo(player.position);
      const focusStrength = THREE.MathUtils.clamp(1 - (distance - 1.15) / 2.35, 0, 1);
      const targetFov = 66 + (isMoving ? 1.1 : 0) - focusStrength * 2.45 - unlockProgress * 0.9 + (roomIndexRef.current === 4 ? -1.2 : 0);
      const nextFov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.055);
      if (Math.abs(camera.fov - nextFov) > 0.01) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }
      const roomExposure = roomIndexRef.current === 4 ? 0.98 : roomIndexRef.current === 2 ? 0.82 : 0.88;
      const targetExposure = roomExposure + focusStrength * 0.035 + unlockProgress * 0.075 + (phaseRef.current === "ending" ? 0.045 : 0);
      renderer.toneMappingExposure = THREE.MathUtils.lerp(renderer.toneMappingExposure, targetExposure, 0.045);
      const nextFocusState = distance < 3.1;
      if (nextFocusState !== lastFocusState) {
        onInteractFocusChange(nextFocusState);
        lastFocusState = nextFocusState;
      }

      roomGroups.forEach((group, index) => {
        const visible = Math.abs(index - roomIndexRef.current) <= 1;
        group.visible = visible;
        group.userData.focusStrength = index === roomIndexRef.current ? focusStrength : 0;
        group.position.y = THREE.MathUtils.lerp(group.position.y, index === roomIndexRef.current ? 0 : -0.55, 0.055);
        animateRoom(group, elapsedTime, index === roomIndexRef.current ? unlockProgress : 0, solvedRef.current, phaseRef.current);
      });

      if (qualitySetting.dust) {
        dust.children.forEach((particle, index) => {
          particle.position.y += Math.sin(elapsedTime * 0.7 + index) * 0.0009;
        });
      }

      if (distance < 3.1 && elapsedTime - lastNearPing > 2.5) {
        onNearObject("잠금 장치 내부에서 금속 핀이 움직이는 소리가 납니다.");
        lastNearPing = elapsedTime;
      }

      composer.render();
    };

    const animate = () => {
      animation = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastFrameTime) / 1000, 0.033);
      lastFrameTime = now;
      step(delta);
    };

    window.advanceTime = (ms = 16.67) => {
      const steps = Math.max(1, Math.round(ms / 16.67));
      for (let i = 0; i < steps; i += 1) {
        step(1 / 60);
      }
    };
    window.hayoungDebugSetCameraPose = (pose) => {
      const targetX = roomIndexRef.current * 24;
      if (typeof pose.x === "number") player.position.x = THREE.MathUtils.clamp(pose.x, targetX - 5.95, targetX + 5.95);
      if (typeof pose.z === "number") player.position.z = THREE.MathUtils.clamp(pose.z, -3.35, 3.85);
      if (typeof pose.yaw === "number") player.yaw = pose.yaw;
      if (typeof pose.pitch === "number") player.pitch = THREE.MathUtils.clamp(pose.pitch, -0.78, 0.62);
      step(1 / 60);
    };

    animate();

    return () => {
      cancelAnimationFrame(animation);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("mousemove", onMouseMove);
      onInteractFocusChange(false);
      composer.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      window.advanceTime = undefined;
      window.hayoungCameraState = undefined;
      window.hayoungDebugSetCameraPose = undefined;
    };
  }, [onInteractFocusChange, onNearObject]);

  return <div className="three-mount" ref={mountRef} data-testid="three-scene" />;
}

function createRoom(room: Room, index: number) {
  const group = new THREE.Group();
  group.position.x = index * 24;

  const floorMaterial = mat(room.palette[0], { roughness: 0.72, metalness: 0.04, texture: "wood", textureRepeat: [3.2, 2.2], textureSeed: index * 23 + 1 });
  const wallMaterial = mat(new THREE.Color(room.palette[0]).lerp(new THREE.Color(room.palette[3]), 0.48).getHex(), {
    roughness: 0.86,
    texture: "plaster",
    textureRepeat: [3.8, 1.8],
    textureSeed: index * 29 + 4,
  });
  const trimMaterial = mat(0x2d211b, { roughness: 0.52, metalness: 0.04, texture: "wood", textureRepeat: [1.4, 3.4], textureSeed: index * 31 + 2 });
  const accentMaterial = mat(room.palette[1], { roughness: 0.28, metalness: 0.18, emissive: room.palette[1], emissiveIntensity: 0.16, texture: "metal", textureSeed: index + 12 });
  const glowMaterial = mat(room.palette[2], { roughness: 0.18, metalness: 0.12, emissive: room.palette[2], emissiveIntensity: 0.46 });

  addRoomShell(group, room, floorMaterial, wallMaterial, trimMaterial, index);

  if (index === 0) {
    addUnrealRoomOneMemoryMap(group, room);
    addCinematicAtmosphere(group, room, index);
  } else {
    addPhotoWall(group, room, index);
    addPuzzleDesk(group, room, accentMaterial, glowMaterial);
    addDoorAssembly(group, room, accentMaterial, glowMaterial);
    addEscapeVista(group, room, index);
    addRoomSpecifics(group, room, index);
    addLivedInEscapeRoomDetails(group, room, index);
    addPhysicalClueNetwork(group, room, index);
    addCinematicAtmosphere(group, room, index);
  }

  const keyLight = new THREE.PointLight(index === 0 ? 0xffa768 : room.palette[1], index === 0 ? 1.28 : index === 4 ? 3.6 : 2.15, index === 0 ? 10.6 : 13);
  keyLight.position.set(index === 0 ? -2.2 : -3.7, index === 0 ? 3.45 : 3.15, index === 0 ? 1.35 : -1.6);
  group.add(keyLight);
  group.userData.keyLight = keyLight;

  const portalLight = new THREE.PointLight(index === 0 ? 0xffc17d : room.palette[2], index === 0 ? 0.92 : index === 4 ? 4.2 : 2.1, index === 0 ? 7.2 : 10);
  portalLight.position.set(index === 0 ? 5.2 : 4.85, index === 0 ? 1.86 : 2.3, index === 0 ? -1.72 : -4.05);
  group.add(portalLight);

  return group;
}

type CinematicTextureKind = "shaft" | "reflection" | "streak";

function cinematicMaterial(color: number, opacity: number, textureKind: CinematicTextureKind = "shaft") {
  return new THREE.MeshBasicMaterial({
    color,
    map: createCinematicTexture(textureKind),
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

function createCinematicTexture(kind: CinematicTextureKind) {
  const cached = cinematicTextureCache.get(kind);
  if (cached) {
    return cached;
  }

  const width = 128;
  const height = kind === "reflection" ? 64 : 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Cinematic texture context unavailable.");
  }
  const image = ctx.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const nx = x / (width - 1);
      const ny = y / (height - 1);
      const center = 1 - Math.abs(nx - 0.5) * 2;
      const vertical = kind === "reflection" ? 1 - Math.abs(ny - 0.5) * 2 : Math.sin(ny * Math.PI);
      const streak = kind === "streak" ? Math.pow(center, 8) * (0.65 + Math.sin(ny * Math.PI * 8) * 0.18) : Math.pow(Math.max(0, center), 1.8);
      const alpha = Math.max(0, Math.min(1, (kind === "streak" ? streak : streak * Math.pow(Math.max(0, vertical), 1.15))));
      const offset = (y * width + x) * 4;
      image.data[offset] = 255;
      image.data[offset + 1] = 255;
      image.data[offset + 2] = 255;
      image.data[offset + 3] = Math.round(alpha * 255);
    }
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  cinematicTextureCache.set(kind, texture);
  return texture;
}

function scenePlane(
  width: number,
  height: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  rotation: THREE.Euler | [number, number, number] = new THREE.Euler(),
) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(x, y, z);
  if (Array.isArray(rotation)) {
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  } else {
    mesh.rotation.copy(rotation);
  }
  return mesh;
}

function addCinematicAtmosphere(group: THREE.Group, room: Room, index: number) {
  const warm = new THREE.Color(room.palette[1]);
  const cool = new THREE.Color(room.palette[2]);
  const warmHex = warm.getHex();
  const coolHex = cool.getHex();

  if (index === 0) {
    const hazeMaterial = cinematicMaterial(0xffc885, 0.018, "reflection");
    const backWash = scenePlane(11.8, 1.15, hazeMaterial, 0, 1.05, -4.16, [0, 0, 0]);
    backWash.userData.cinematicAtmosphere = true;
    backWash.userData.roomOnePracticalHaze = true;
    backWash.userData.baseOpacity = hazeMaterial.opacity;
    group.add(backWash);

    return;
  }

  for (let i = 0; i < 4; i += 1) {
    const material = cinematicMaterial(i % 2 ? coolHex : warmHex, index === 4 ? 0.062 : 0.04);
    const shaft = scenePlane(0.58 + i * 0.1, 4.5, material, -4.1 + i * 2.35, 2.72, -1.6 + i * 0.28, [
      -0.08 + i * 0.025,
      -0.26 + i * 0.14,
      0.08 - i * 0.035,
    ]);
    shaft.userData.cinematicAtmosphere = true;
    shaft.userData.lightShaft = true;
    shaft.userData.baseOpacity = material.opacity;
    shaft.userData.shaftSeed = i + index * 7;
    group.add(shaft);
  }

  for (let i = 0; i < 4; i += 1) {
    const material = cinematicMaterial(i % 2 ? coolHex : warmHex, 0.032, "reflection");
    const reflection = scenePlane(1.6 + i * 0.36, 0.22, material, -3.6 + i * 2.25, 0.118, 1.28 + i * 0.2, [-Math.PI / 2, 0, 0.08 - i * 0.04]);
    reflection.userData.cinematicAtmosphere = true;
    reflection.userData.floorReflection = true;
    reflection.userData.baseOpacity = material.opacity;
    reflection.userData.reflectionSeed = i + index * 5;
    group.add(reflection);
  }

  for (let i = 0; i < 5; i += 1) {
    const slatMaterial = cinematicMaterial(i % 2 ? warmHex : coolHex, 0.018 + i * 0.004, "streak");
    const slat = scenePlane(0.08, 2.6, slatMaterial, -5.7 + i * 2.85, 2.75, -4.18, [0, 0, 0]);
    slat.userData.cinematicAtmosphere = true;
    slat.userData.lightShaft = true;
    slat.userData.baseOpacity = slatMaterial.opacity;
    slat.userData.shaftSeed = 20 + i + index * 4;
    group.add(slat);
  }

  if (index === 2) {
    const rainMat = cinematicMaterial(0x9ebcff, 0.065, "streak");
    for (let i = 0; i < 10; i += 1) {
      const rain = scenePlane(0.035, 1.65, rainMat.clone(), -6 + i * 1.28, 2.45 + Math.sin(i) * 0.16, -3.92, [0, 0, -0.24]);
      rain.userData.cinematicAtmosphere = true;
      rain.userData.cinematicRain = true;
      rain.userData.baseY = rain.position.y;
      rain.userData.baseOpacity = 0.1;
      rain.userData.rainSeed = i;
      group.add(rain);
    }
  }

  if (index === 3) {
    for (let i = 0; i < 7; i += 1) {
      const neonMat = cinematicMaterial(i % 2 ? warmHex : coolHex, 0.052, "reflection");
      const neon = scenePlane(0.88, 0.035, neonMat, -5.65 + i * 1.85, 2.15 + (i % 3) * 0.36, -4.06, [0, 0, 0]);
      neon.userData.cinematicAtmosphere = true;
      neon.userData.floorReflection = true;
      neon.userData.baseOpacity = neonMat.opacity;
      neon.userData.reflectionSeed = 50 + i;
      group.add(neon);
    }
  }

  if (index === 4) {
    for (let i = 0; i < 6; i += 1) {
      const gateRayMat = cinematicMaterial(i % 2 ? 0xfff2bd : 0xbddcff, 0.055);
      const ray = scenePlane(0.32 + i * 0.055, 5.2, gateRayMat, -1.8 + i * 0.72, 2.75, -3.62 + i * 0.05, [
        -0.1,
        -0.4 + i * 0.16,
        -0.08 + i * 0.035,
      ]);
      ray.userData.cinematicAtmosphere = true;
      ray.userData.lightShaft = true;
      ray.userData.baseOpacity = gateRayMat.opacity;
      ray.userData.shaftSeed = 80 + i;
      group.add(ray);
    }
  }
}

function addRoomShell(
  group: THREE.Group,
  room: Room,
  floorMaterial: THREE.Material,
  wallMaterial: THREE.Material,
  trimMaterial: THREE.Material,
  index: number,
) {
  const floor = box(14, 0.28, 9.4, floorMaterial, 0, -0.14, 0);
  floor.receiveShadow = true;
  group.add(floor);

  for (let i = 0; i < 14; i += 1) {
    const plank = box(0.9, 0.035, 8.8, trimMaterial, -6.2 + i * 0.95, 0.035, 0);
    plank.material = mat(i % 2 ? 0x765234 : 0x916944, { roughness: 0.78, texture: "wood", textureRepeat: [0.35, 4.8], textureSeed: index * 41 + i });
    plank.receiveShadow = true;
    group.add(plank);
  }

  const backWall = box(14.4, 5.4, 0.32, wallMaterial, 0, 2.55, -4.72);
  const leftWall = box(0.32, 5.4, 9.4, wallMaterial, -7.2, 2.55, 0);
  const rightWall = box(0.32, 5.4, 9.4, wallMaterial, 7.2, 2.55, 0);
  const ceiling = box(14.4, 0.22, 9.4, mat(0x151318, { roughness: 0.82, texture: "plaster", textureRepeat: [3, 2], textureSeed: index + 80 }), 0, 5.18, 0);
  [backWall, leftWall, rightWall, ceiling].forEach((mesh) => {
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    group.add(mesh);
  });

  for (let i = 0; i < 6; i += 1) {
    const beam = box(0.16, 0.22, 9.15, trimMaterial, -6.2 + i * 2.48, 5.0, 0);
    beam.castShadow = true;
    group.add(beam);
  }

  const rug = box(4.8, 0.045, 2.2, mat(index === 2 ? 0x243557 : 0x4f2f2d, { roughness: 0.92, texture: "fabric", textureRepeat: [2.4, 1.2], textureSeed: index + 100 }), -1.4, 0.09, 1.25);
  rug.receiveShadow = true;
  group.add(rug);

  addArchitecturalDetails(group, room, trimMaterial, index);
}

function addArchitecturalDetails(group: THREE.Group, room: Room, trimMaterial: THREE.Material, index: number) {
  const panelMaterial = mat(new THREE.Color(room.palette[0]).lerp(new THREE.Color(room.palette[3]), 0.62).getHex(), {
    roughness: 0.88,
    texture: "plaster",
    textureRepeat: [1.2, 1.4],
    textureSeed: index + 320,
  });
  const edgeGlow = mat(room.palette[1], {
    roughness: 0.5,
    metalness: 0.12,
    emissive: room.palette[1],
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.64,
  });
  const shadowWood = mat(0x21140f, { roughness: 0.7, metalness: 0.04, texture: "wood", textureRepeat: [1.8, 1], textureSeed: index + 340 });

  const baseboards = [
    box(14.1, 0.18, 0.08, trimMaterial, 0, 0.42, -4.36),
    box(0.08, 0.18, 8.6, trimMaterial, -7.02, 0.42, -0.04),
    box(0.08, 0.18, 8.6, trimMaterial, 7.02, 0.42, -0.04),
    box(14.1, 0.14, 0.08, shadowWood, 0, 4.78, -4.36),
    box(0.08, 0.14, 8.6, shadowWood, -7.02, 4.78, -0.04),
    box(0.08, 0.14, 8.6, shadowWood, 7.02, 4.78, -0.04),
  ];
  group.add(...baseboards);

  for (let column = 0; column < 5; column += 1) {
    const x = -5.55 + column * 2.75;
    const panel = box(1.48, 1.58, 0.035, panelMaterial, x, 2.72, -4.34);
    const top = box(1.62, 0.045, 0.055, trimMaterial, x, 3.55, -4.28);
    const bottom = box(1.62, 0.045, 0.055, trimMaterial, x, 1.9, -4.28);
    const left = box(0.045, 1.62, 0.055, trimMaterial, x - 0.82, 2.72, -4.28);
    const right = box(0.045, 1.62, 0.055, trimMaterial, x + 0.82, 2.72, -4.28);
    group.add(panel, top, bottom, left, right);
  }

  if (index !== 0) {
    [-4.8, -1.6, 1.6, 4.8].forEach((x, lightIndex) => {
      const rail = box(0.035, 0.018, 7.5, edgeGlow, x, 0.13, -0.05);
      rail.userData.statusLight = true;
      rail.userData.baseGlow = 0.12 + lightIndex * 0.03;
      group.add(rail);
    });
  }

  for (let i = 0; i < 8; i += 1) {
    const cable = box(0.035, 0.035, 0.95 + (i % 3) * 0.3, shadowWood, -6.1 + i * 1.7, 4.54 + Math.sin(i) * 0.05, -4.18);
    cable.rotation.z = Math.sin(i * 1.3) * 0.08;
    group.add(cable);
  }
}

function addPhotoWall(group: THREE.Group, room: Room, index: number) {
  const frameMaterial = mat(index === 4 ? 0xe9d18d : 0x6f4e32, { roughness: 0.46, metalness: 0.12, texture: "wood", textureRepeat: [0.8, 0.8], textureSeed: index + 140 });
  const photoMaterial = mat(room.palette[2], { roughness: 0.5, emissive: room.palette[2], emissiveIntensity: index === 4 ? 0.35 : 0.08, texture: "paper", textureSeed: index + 160 });
  const count = index === 4 ? 14 : 9;
  for (let i = 0; i < count; i += 1) {
    const width = 0.55 + ((i * 37) % 4) * 0.13;
    const height = 0.42 + ((i * 19) % 3) * 0.14;
    const x = -5.8 + (i % 7) * 1.55 + (index === 4 ? 0.35 : 0);
    const y = 2.05 + Math.floor(i / 7) * 0.82 + Math.sin(i * 1.7) * 0.1;
    const z = -4.49;
    const frame = box(width + 0.16, height + 0.16, 0.08, frameMaterial, x, y, z);
    const photo = box(width, height, 0.09, photoMaterial, x, y, z + 0.045);
    frame.castShadow = true;
    photo.castShadow = true;
    group.add(frame, photo);
  }
}

function addPuzzleDesk(group: THREE.Group, room: Room, accentMaterial: THREE.Material, glowMaterial: THREE.Material) {
  const wood = mat(0x70472c, { roughness: 0.58, metalness: 0.03, emissive: 0x2a160b, emissiveIntensity: 0.05, texture: "wood", textureRepeat: [2.2, 1.4], textureSeed: room.id + 200 });
  const darkWood = mat(0x2d1d16, { roughness: 0.62, metalness: 0.04, texture: "wood", textureRepeat: [1.7, 1.2], textureSeed: room.id + 220 });
  const metal = mat(0x463d37, { roughness: 0.32, metalness: 0.72, texture: "metal", textureSeed: room.id + 230 });
  const brass = mat(0xd5a45f, { roughness: 0.34, metalness: 0.68, emissive: 0xffb35f, emissiveIntensity: 0.04, texture: "metal", textureSeed: room.id + 240 });
  const paper = mat(0xffedd1, { roughness: 0.82, texture: "paper", textureSeed: room.id + 250 });
  const darkGlass = mat(0x0d1118, { roughness: 0.2, metalness: 0.18, emissive: room.palette[3], emissiveIntensity: 0.16 });
  const outlineMaterial = mat(0xffdc91, {
    roughness: 0.18,
    metalness: 0.24,
    emissive: 0xffd07a,
    emissiveIntensity: 0.24,
    transparent: true,
    opacity: 0.34,
  });
  const glyphMaterial = mat(0xfff3cd, {
    roughness: 0.28,
    metalness: 0.08,
    emissive: 0xffe1a6,
    emissiveIntensity: 0.22,
  });
  glyphMaterial.side = THREE.DoubleSide;
  const padMaterial = glowMaterial.clone();
  const signalMaterial = outlineMaterial.clone();

  const desk = box(5.7, 0.3, 1.55, wood, -0.7, 0.72, -0.55);
  const deskBack = box(5.9, 0.32, 0.2, darkWood, -0.7, 0.98, -1.38);
  const deskLip = box(5.85, 0.08, 0.08, brass, -0.7, 0.96, 0.22);
  const deskGlow = box(4.8, 0.026, 0.035, brass, -0.7, 0.97, 0.27);
  const frontPanelMaterial = mat(0x6b4028, { roughness: 0.66, metalness: 0.04, emissive: 0x2a160b, emissiveIntensity: 0.08, texture: "wood", textureRepeat: [2.8, 0.8], textureSeed: room.id + 260 });
  const frontPanel = box(5.45, 0.42, 0.045, frontPanelMaterial, -0.7, 0.5, 0.26);
  const frontTopRail = box(5.55, 0.035, 0.05, brass, -0.7, 0.72, 0.3);
  const frontBottomRail = box(5.55, 0.035, 0.05, darkWood, -0.7, 0.28, 0.3);
  const frontDividers = [-2.55, -0.7, 1.15].map((x) => box(0.035, 0.35, 0.052, darkWood, x, 0.5, 0.31));
  desk.castShadow = true;
  desk.receiveShadow = true;
  group.add(desk, deskBack, deskLip, deskGlow, frontPanel, frontTopRail, frontBottomRail, ...frontDividers);
  [-2.9, 1.45].forEach((x) => {
    const legA = box(0.22, 1.04, 0.22, darkWood, x, 0.14, -1.12);
    const legB = box(0.22, 1.04, 0.22, darkWood, x, 0.14, -0.02);
    group.add(legA, legB);
  });

  const lockBox = box(1.68, 0.9, 0.74, accentMaterial, 0.02, 1.43, -0.82);
  lockBox.castShadow = true;
  lockBox.userData.pulse = true;
  group.add(lockBox);
  group.userData.lockBox = lockBox;

  const consoleBase = box(2.05, 1.12, 0.12, darkWood, 0.02, 1.42, -0.41);
  const panel = box(1.68, 0.72, 0.07, darkGlass, 0.02, 1.43, -0.32);
  const topRail = box(1.82, 0.06, 0.08, brass, 0.02, 1.82, -0.27);
  const bottomRail = box(1.82, 0.06, 0.08, brass, 0.02, 1.04, -0.27);
  const leftRail = box(0.06, 0.78, 0.08, brass, -0.94, 1.43, -0.27);
  const rightRail = box(0.06, 0.78, 0.08, brass, 0.98, 1.43, -0.27);
  group.add(consoleBase, panel, topRail, bottomRail, leftRail, rightRail);

  const outlineSegments = [
    box(1.68, 0.018, 0.032, outlineMaterial, 0.02, 1.8, -0.215),
    box(1.68, 0.018, 0.032, outlineMaterial, 0.02, 1.06, -0.215),
    box(0.018, 0.72, 0.032, outlineMaterial, -0.82, 1.43, -0.215),
    box(0.018, 0.72, 0.032, outlineMaterial, 0.86, 1.43, -0.215),
  ];
  outlineSegments.forEach((segment) => {
    segment.userData.statusLight = true;
    group.add(segment);
  });

  const scanLine = box(1.22, 0.016, 0.032, outlineMaterial, 0.02, 1.43, -0.205);
  scanLine.userData.scanLine = true;
  scanLine.userData.baseY = scanLine.position.y;
  group.add(scanLine);

  const padPositions = [
    [0, 0.18, 0],
    [-0.23, 0, Math.PI / 2],
    [0.23, 0, -Math.PI / 2],
    [0, -0.18, Math.PI],
  ];
  padPositions.forEach(([x, y, angle], index) => {
    const pad = box(0.22, 0.16, 0.06, padMaterial, -0.36 + x, 1.45 + y, -0.2);
    pad.userData.glow = true;
    pad.userData.padGlow = true;
    group.add(pad);

    const arrow = new THREE.Mesh(new THREE.CircleGeometry(0.06, 3), glyphMaterial);
    arrow.position.set(-0.36 + x, 1.45 + y + 0.004, -0.163);
    arrow.rotation.z = angle + Math.PI;
    arrow.userData.padGlyph = index;
    group.add(arrow);
  });

  for (let i = 0; i < 4; i += 1) {
    const x = 0.24 + i * 0.22;
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.09, 32), metal);
    dial.position.set(x, 1.44, -0.19);
    dial.rotation.x = Math.PI / 2;
    dial.castShadow = true;
    dial.userData.dial = true;
    group.add(dial);

    const dialRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 8, 32), brass);
    dialRing.position.set(x, 1.44, -0.14);
    dialRing.userData.dial = true;
    group.add(dialRing);

    const notch = box(0.025, 0.12, 0.025, outlineMaterial, x, 1.5, -0.11);
    notch.userData.statusLight = true;
    group.add(notch);
  }

  [0, 1, 2].forEach((step) => {
    const pip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), step === 0 ? padMaterial.clone() : signalMaterial.clone());
    pip.position.set(-0.72 + step * 0.18, 1.08, -0.18);
    pip.userData.statusLight = true;
    group.add(pip);
  });

  const latch = box(0.34, 0.16, 0.07, brass, 0.02, 1.78, -0.16);
  latch.userData.lockLatch = true;
  latch.userData.baseY = latch.position.y;
  latch.userData.baseZ = latch.position.z;
  const latchRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.014, 10, 36), signalMaterial.clone());
  latchRing.position.set(0.02, 1.73, -0.12);
  latchRing.userData.statusLight = true;
  latchRing.userData.lockShackle = true;
  latchRing.userData.baseY = latchRing.position.y;
  latchRing.userData.baseZ = latchRing.position.z;
  const lockBody = box(0.34, 0.26, 0.08, mat(0xd95f78, { roughness: 0.44, metalness: 0.14, emissive: 0x733447, emissiveIntensity: 0.08 }), 0.02, 1.58, -0.09);
  lockBody.userData.lockBody = true;
  lockBody.userData.baseY = lockBody.position.y;
  lockBody.userData.baseZ = lockBody.position.z;
  const keyhole = box(0.046, 0.12, 0.026, darkGlass, 0.02, 1.56, -0.04);
  keyhole.userData.keyhole = true;
  group.add(latch, latchRing, lockBody, keyhole);
  group.userData.consoleLatch = latch;
  group.userData.consoleShackle = latchRing;
  group.userData.consoleLockBody = lockBody;

  const sparkMaterial = mat(0xffe6a6, {
    roughness: 0.26,
    metalness: 0.1,
    emissive: 0xffd27d,
    emissiveIntensity: 0.65,
    transparent: true,
    opacity: 0.18,
  });
  for (let i = 0; i < 12; i += 1) {
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.024 + (i % 3) * 0.006, 10, 8), sparkMaterial.clone());
    spark.position.set(-0.42 + ((i * 29) % 84) / 100, 1.18 + ((i * 17) % 58) / 100, -0.11 + Math.sin(i) * 0.05);
    spark.userData.unlockSpark = true;
    spark.userData.baseX = spark.position.x;
    spark.userData.baseY = spark.position.y;
    spark.userData.baseZ = spark.position.z;
    spark.userData.sparkSeed = i;
    group.add(spark);
  }

  const diary = box(1.35, 0.08, 0.9, paper, -2.25, 1.01, -0.55);
  diary.rotation.y = -0.22;
  diary.castShadow = true;
  const ribbon = box(1.25, 0.025, 0.08, mat(0xd65f74, { roughness: 0.64, emissive: 0xd65f74, emissiveIntensity: 0.06 }), -2.25, 1.08, -0.55);
  ribbon.rotation.y = -0.22;
  group.add(diary, ribbon);

  const lens = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 10, 38), brass);
  lens.position.set(-1.38, 1.04, -0.24);
  lens.rotation.z = -0.4;
  const lensHandle = box(0.08, 0.45, 0.045, brass, -1.23, 1.02, -0.25);
  lensHandle.rotation.z = -0.72;
  group.add(lens, lensHandle);

  const orbMaterial = mat(room.palette[2], {
    roughness: 0.18,
    metalness: 0.06,
    emissive: room.palette[2],
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.86,
  });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 18), orbMaterial);
  orb.position.set(2.05, 1.17, -0.52);
  orb.castShadow = true;
  orb.userData.orb = true;
  group.add(orb);

  const orbBase = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.39, 0.12, 28), metal);
  orbBase.position.set(2.05, 1.02, -0.52);
  const orbRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.016, 8, 48), signalMaterial.clone());
  orbRing.position.set(2.05, 1.19, -0.52);
  orbRing.rotation.x = Math.PI / 2;
  orbRing.userData.statusLight = true;
  group.add(orbBase, orbRing);

  const lamp = new THREE.PointLight(room.palette[2], 1.25, 4.2);
  lamp.position.set(2.05, 1.6, -0.52);
  group.add(lamp);

  addRoomDeviceKit(group, room, accentMaterial, glowMaterial);
  addInteractionFocus(group, room);
}

function addRoomDeviceKit(group: THREE.Group, room: Room, accentMaterial: THREE.Material, glowMaterial: THREE.Material) {
  const roomIndex = room.id - 1;
  const kit = new THREE.Group();
  kit.userData.roomDeviceKit = true;
  kit.userData.deviceKitIndex = roomIndex;

  const metal = mat(0x443b38, { roughness: 0.3, metalness: 0.78, texture: "metal", textureSeed: 420 + room.id });
  const brass = mat(0xd4a45d, { roughness: 0.35, metalness: 0.7, emissive: 0xffbd72, emissiveIntensity: 0.05, texture: "metal", textureSeed: 440 + room.id });
  const paper = mat(0xffebce, { roughness: 0.84, texture: "paper", textureRepeat: [1.2, 1], textureSeed: 460 + room.id });
  const ink = mat(0x2c2231, { roughness: 0.62, metalness: 0.04, emissive: 0x161019, emissiveIntensity: 0.04 });
  const glass = mat(room.palette[2], { roughness: 0.18, metalness: 0.16, emissive: room.palette[2], emissiveIntensity: 0.42, transparent: true, opacity: 0.72 });
  const signal = glowMaterial.clone();
  signal.transparent = true;
  signal.opacity = 0.68;

  const baseRail = box(1.76, 0.035, 0.05, brass, 0.02, 1.02, -0.05);
  const topRail = box(1.76, 0.035, 0.05, brass, 0.02, 1.84, -0.05);
  baseRail.userData.deviceKitGlow = true;
  topRail.userData.deviceKitGlow = true;
  kit.add(baseRail, topRail);

  if (roomIndex === 0) {
    const album = box(0.78, 0.08, 0.5, paper, -0.52, 1.22, -0.03);
    album.rotation.z = -0.08;
    album.userData.deviceKitFloat = true;
    const spine = box(0.055, 0.11, 0.54, accentMaterial, -0.91, 1.23, -0.025);
    spine.rotation.z = -0.08;
    const photoSlot = box(0.58, 0.32, 0.035, glass, 0.48, 1.48, -0.015);
    photoSlot.userData.deviceKitScanner = true;
    const slotRailA = box(0.68, 0.025, 0.04, brass, 0.48, 1.67, 0.005);
    const slotRailB = box(0.68, 0.025, 0.04, brass, 0.48, 1.29, 0.005);
    [slotRailA, slotRailB].forEach((rail) => (rail.userData.deviceKitGlow = true));
    [-0.18, 0, 0.18].forEach((offset, index) => {
      const mark = box(0.12, 0.18, 0.026, index === 1 ? accentMaterial : ink, -0.64 + index * 0.23, 1.25 + offset * 0.05, 0.03);
      mark.rotation.z = -0.08;
      mark.userData.deviceKitGlow = index === 1;
      kit.add(mark);
    });
    kit.add(album, spine, photoSlot, slotRailA, slotRailB);
  } else if (roomIndex === 1) {
    const receipt = box(0.52, 0.62, 0.035, paper, -0.58, 1.43, -0.015);
    receipt.userData.deviceKitScanner = true;
    for (let i = 0; i < 4; i += 1) {
      const line = box(0.36 - i * 0.04, 0.018, 0.022, ink, -0.58, 1.59 - i * 0.095, 0.02);
      kit.add(line);
    }
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.34, 24), accentMaterial);
    cup.position.set(0.28, 1.28, -0.02);
    cup.rotation.z = -0.12;
    cup.userData.deviceKitFloat = true;
    const cupBand = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 8, 28), brass);
    cupBand.position.set(0.28, 1.37, -0.02);
    cupBand.rotation.x = Math.PI / 2;
    cupBand.userData.deviceKitGlow = true;
    [0, 1, 2].forEach((index) => {
      const token = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.024, 24), index === 0 ? signal.clone() : brass);
      token.position.set(0.56 + index * 0.18, 1.18 + index * 0.015, -0.005);
      token.rotation.x = Math.PI / 2;
      token.userData.deviceKitSpin = true;
      token.userData.deviceKitSeed = index;
      kit.add(token);
    });
    kit.add(receipt, cup, cupBand);
  } else if (roomIndex === 2) {
    const rail = box(1.18, 0.045, 0.045, metal, -0.04, 1.54, -0.005);
    rail.userData.deviceKitGlow = true;
    const heartLeft = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 12), accentMaterial);
    heartLeft.position.set(0.48, 1.25, 0.005);
    heartLeft.scale.set(1, 0.76, 0.4);
    const heartRight = heartLeft.clone();
    heartRight.position.x = 0.64;
    const heartTip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.2, 24), accentMaterial);
    heartTip.position.set(0.56, 1.15, 0.005);
    heartTip.rotation.z = Math.PI;
    heartTip.scale.z = 0.42;
    [heartLeft, heartRight, heartTip].forEach((part) => {
      part.userData.deviceKitBeat = true;
      kit.add(part);
    });
    [-0.48, -0.18, 0.12, 0.42].forEach((x, index) => {
      const drop = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 18), glass.clone());
      drop.position.set(x, 1.68 - (index % 2) * 0.07, 0.02);
      drop.rotation.z = Math.PI;
      drop.userData.deviceKitRainDrop = true;
      drop.userData.deviceKitSeed = index;
      kit.add(drop);
    });
    ["U", "R", "D", "L"].forEach((_, index) => {
      const pad = box(0.18, 0.13, 0.05, signal.clone(), -0.46 + index * 0.28, 1.31, 0.01);
      pad.userData.deviceKitGlow = true;
      pad.userData.deviceKitSeed = index;
      kit.add(pad);
    });
    kit.add(rail);
  } else if (roomIndex === 3) {
    const bridgeRail = box(1.32, 0.045, 0.04, brass, 0.02, 1.34, 0.005);
    bridgeRail.userData.deviceKitGlow = true;
    for (let i = 0; i < 5; i += 1) {
      const note = box(0.22, 0.28, 0.026, paper, -0.54 + i * 0.27, 1.54 + Math.sin(i) * 0.035, 0.02);
      note.rotation.z = -0.16 + i * 0.08;
      note.userData.deviceKitFloat = true;
      note.userData.deviceKitSeed = i;
      const pin = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), signal.clone());
      pin.position.set(note.position.x, note.position.y + 0.12, 0.052);
      pin.userData.deviceKitGlow = true;
      kit.add(note, pin);
      if (i < 4) {
        const wire = box(0.24, 0.018, 0.018, signal.clone(), -0.405 + i * 0.27, 1.43 + Math.sin(i + 0.5) * 0.025, 0.04);
        wire.rotation.z = 0.12 - i * 0.06;
        wire.userData.deviceKitGlow = true;
        kit.add(wire);
      }
    }
    kit.add(bridgeRail);
  } else {
    const prism = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), glass.clone());
    prism.position.set(0.02, 1.48, 0.02);
    prism.scale.set(1, 1.18, 0.72);
    prism.userData.deviceKitPrism = true;
    const memoryRail = box(1.28, 0.035, 0.04, brass, 0.02, 1.14, 0.01);
    memoryRail.userData.deviceKitGlow = true;
    [0, 1, 2, 3].forEach((index) => {
      const frame = box(0.18, 0.24, 0.026, index % 2 ? paper : accentMaterial, -0.48 + index * 0.32, 1.18, 0.04);
      frame.userData.deviceKitFloat = true;
      frame.userData.deviceKitSeed = index;
      kit.add(frame);
    });
    [0.38, 0.58, 0.78].forEach((radius, index) => {
      const halo = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.01, 8, 64), signal.clone());
      halo.position.set(0.02, 1.48, 0.04 + index * 0.008);
      halo.userData.deviceKitHalo = true;
      halo.userData.deviceKitSeed = index;
      kit.add(halo);
    });
    kit.add(prism, memoryRail);
  }

  group.add(kit);
  group.userData.roomDeviceKit = kit;
}

function addInteractionFocus(group: THREE.Group, room: Room) {
  const haloMaterial = mat(room.palette[2], {
    roughness: 0.18,
    metalness: 0.12,
    emissive: room.palette[2],
    emissiveIntensity: 0.42,
    transparent: true,
    opacity: 0.08,
  });
  haloMaterial.depthWrite = false;
  haloMaterial.side = THREE.DoubleSide;

  const floorMaterial = mat(room.palette[1], {
    roughness: 0.28,
    metalness: 0.08,
    emissive: room.palette[1],
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.18,
  });
  floorMaterial.depthWrite = false;

  const beamMaterial = mat(0xfff0bd, {
    roughness: 0.42,
    metalness: 0.02,
    emissive: 0xffd98b,
    emissiveIntensity: 0.18,
    transparent: true,
    opacity: 0.024,
  });
  beamMaterial.depthWrite = false;
  beamMaterial.side = THREE.DoubleSide;

  const consoleHalo = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.01, 10, 72), haloMaterial.clone());
  consoleHalo.position.set(0.02, 1.43, -0.145);
  consoleHalo.userData.interactHalo = true;
  consoleHalo.userData.focusResponsive = true;
  consoleHalo.userData.baseOpacity = 0.035;
  group.add(consoleHalo);

  const innerHalo = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.007, 8, 56), haloMaterial.clone());
  innerHalo.position.set(0.02, 1.43, -0.138);
  innerHalo.rotation.z = Math.PI / 4;
  innerHalo.userData.interactHalo = true;
  innerHalo.userData.focusResponsive = true;
  innerHalo.userData.baseOpacity = 0.03;
  group.add(innerHalo);

  const floorGlyph = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.014, 8, 96), floorMaterial.clone());
  floorGlyph.position.set(0.02, 0.16, -0.7);
  floorGlyph.rotation.x = Math.PI / 2;
  floorGlyph.scale.z = 0.42;
  floorGlyph.userData.focusFloor = true;
  floorGlyph.userData.focusResponsive = true;
  floorGlyph.userData.baseOpacity = 0.035;
  group.add(floorGlyph);

  const innerFloorGlyph = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.008, 8, 64), floorMaterial.clone());
  innerFloorGlyph.position.set(0.02, 0.165, -0.7);
  innerFloorGlyph.rotation.x = Math.PI / 2;
  innerFloorGlyph.scale.z = 0.48;
  innerFloorGlyph.userData.focusFloor = true;
  innerFloorGlyph.userData.focusResponsive = true;
  innerFloorGlyph.userData.baseOpacity = 0.025;
  group.add(innerFloorGlyph);

  const focusBeam = new THREE.Mesh(new THREE.ConeGeometry(0.36, 2.55, 36, 1, true), beamMaterial);
  focusBeam.position.set(0.02, 2.62, -0.68);
  focusBeam.userData.focusBeam = true;
  focusBeam.userData.focusResponsive = true;
  focusBeam.userData.baseOpacity = 0.018;
  group.add(focusBeam);

  for (let i = 0; i < 4; i += 1) {
    const pip = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), haloMaterial.clone());
    const angle = i * (Math.PI / 2) + Math.PI / 4;
    pip.position.set(Math.cos(angle) * 0.9 + 0.02, 1.47 + (i % 2) * 0.12, -0.18 + Math.sin(angle) * 0.08);
    pip.userData.focusPip = true;
    pip.userData.focusResponsive = true;
    pip.userData.pipSeed = i;
    pip.userData.baseY = pip.position.y;
    group.add(pip);
  }

  const focusLight = new THREE.PointLight(room.palette[2], 0.25, 4.4);
  focusLight.position.set(0.02, 1.6, -0.32);
  focusLight.userData.focusLight = true;
  group.add(focusLight);
  group.userData.focusLight = focusLight;
}

function addDoorAssembly(group: THREE.Group, room: Room, accentMaterial: THREE.Material, glowMaterial: THREE.Material) {
  const doorMaterial = mat(new THREE.Color(room.palette[1]).lerp(new THREE.Color(0x2d221b), 0.2).getHex(), {
    roughness: 0.42,
    metalness: 0.18,
    emissive: room.palette[1],
    emissiveIntensity: 0.12,
  });
  const metal = mat(0x3f3936, { roughness: 0.28, metalness: 0.8 });
  const door = box(2.2, 3.25, 0.26, doorMaterial, 4.95, 1.66, -4.45);
  door.castShadow = true;
  group.add(door);
  group.userData.door = door;

  const insetMaterial = mat(new THREE.Color(room.palette[3]).lerp(new THREE.Color(0x0d0a0a), 0.36).getHex(), {
    roughness: 0.48,
    metalness: 0.28,
    emissive: room.palette[3],
    emissiveIntensity: 0.08,
    texture: "metal",
    textureRepeat: [1.1, 1.1],
    textureSeed: 1180,
  });
  const rivetMaterial = mat(room.palette[2], { roughness: 0.3, metalness: 0.72, emissive: room.palette[2], emissiveIntensity: 0.22 });
  [-0.78, 0.02, 0.82].forEach((localY, panelIndex) => {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.5, 0.045), insetMaterial);
    panel.position.set(0, localY, 0.155);
    panel.userData.doorFaceDetail = true;
    door.add(panel);

    const edgeTop = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.035, 0.055), rivetMaterial);
    edgeTop.position.set(0, localY + 0.28, 0.18);
    const edgeBottom = edgeTop.clone();
    edgeBottom.position.y = localY - 0.28;
    edgeTop.userData.doorFaceDetail = true;
    edgeBottom.userData.doorFaceDetail = true;
    door.add(edgeTop, edgeBottom);

    [-0.82, 0.82].forEach((localX, rivetIndex) => {
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), rivetMaterial);
      rivet.position.set(localX, localY + (rivetIndex === 0 ? 0.18 : -0.18), 0.2);
      rivet.scale.set(1, 1, 0.46);
      rivet.userData.doorFaceDetail = true;
      door.add(rivet);
    });

    if (panelIndex === 1) {
      const scratch = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.026, 0.052), rivetMaterial);
      scratch.position.set(-0.08, localY - 0.03, 0.205);
      scratch.rotation.z = -0.22;
      scratch.userData.doorFaceDetail = true;
      door.add(scratch);
    }
  });

  const frame = box(2.62, 3.55, 0.12, mat(0x2a211f, { roughness: 0.55, metalness: 0.1 }), 4.95, 1.72, -4.61);
  group.add(frame);

  const sealMaterial = mat(room.palette[2], {
    roughness: 0.22,
    metalness: 0.12,
    emissive: room.palette[2],
    emissiveIntensity: 0.52,
    transparent: true,
    opacity: 0.34,
  });
  const doorSeals = [
    box(0.045, 3.08, 0.035, sealMaterial.clone(), 3.86, 1.66, -4.2),
    box(0.045, 3.08, 0.035, sealMaterial.clone(), 6.04, 1.66, -4.2),
    box(2.18, 0.045, 0.035, sealMaterial.clone(), 4.95, 3.2, -4.2),
    box(2.18, 0.045, 0.035, sealMaterial.clone(), 4.95, 0.12, -4.2),
  ];
  doorSeals.forEach((seal, index) => {
    seal.userData.doorSeal = true;
    seal.userData.baseScaleX = seal.scale.x;
    seal.userData.baseScaleY = seal.scale.y;
    seal.userData.sealIndex = index;
    group.add(seal);
  });
  group.userData.doorSeals = doorSeals;

  const hingeMaterial = mat(0x5a514c, { roughness: 0.3, metalness: 0.82, emissive: 0x171313, emissiveIntensity: 0.05 });
  const hinges: THREE.Mesh[] = [];
  [0.68, 1.72, 2.76].forEach((y, index) => {
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.52, 18), hingeMaterial);
    hinge.position.set(3.78, y, -4.2);
    hinge.rotation.z = Math.PI / 2;
    hinge.castShadow = true;
    hinge.userData.hinge = true;
    hinge.userData.hingeIndex = index;
    hinges.push(hinge);
    group.add(hinge);
  });
  group.userData.hinges = hinges;

  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 10, 32), metal);
  handle.position.set(5.55, 1.58, -4.12);
  handle.rotation.y = Math.PI / 2;
  handle.userData.doorHandle = true;
  group.add(handle);
  group.userData.doorHandle = handle;

  const bolts: THREE.Mesh[] = [];
  [-0.52, 0.52].forEach((x) => {
    const bolt = box(0.78, 0.12, 0.12, metal, 4.95 + x, 2.25, -4.22);
    bolt.userData.baseX = bolt.position.x;
    bolts.push(bolt);
    group.add(bolt);
  });
  group.userData.bolts = bolts;

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.055, 12, 60), glowMaterial);
  ring.position.set(4.95, 2.15, -4.22);
  ring.rotation.x = Math.PI / 2;
  ring.userData.ring = true;
  group.add(ring);
  group.userData.ring = ring;

  const gears: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i += 1) {
    const gear = new THREE.Mesh(new THREE.TorusGeometry(0.22 + i * 0.06, 0.025, 8, 26), metal);
    gear.position.set(4.35 + i * 0.28, 1.15, -4.22);
    gear.rotation.x = Math.PI / 2;
    gear.userData.gear = true;
    gears.push(gear);
    group.add(gear);
  }
  group.userData.gears = gears;

  const sparkMaterial = mat(room.palette[2], {
    roughness: 0.18,
    metalness: 0.12,
    emissive: room.palette[2],
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.18,
  });
  for (let i = 0; i < 14; i += 1) {
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.028 + (i % 2) * 0.008, 10, 8), sparkMaterial.clone());
    spark.position.set(4.25 + ((i * 37) % 140) / 100, 0.7 + ((i * 19) % 230) / 100, -4.08 + Math.sin(i * 1.2) * 0.04);
    spark.userData.unlockSpark = true;
    spark.userData.baseX = spark.position.x;
    spark.userData.baseY = spark.position.y;
    spark.userData.baseZ = spark.position.z;
    spark.userData.sparkSeed = i + 40;
    group.add(spark);
  }
}

function markEscapeGlow(mesh: THREE.Mesh, seed: number) {
  mesh.userData.escapeVistaGlow = true;
  mesh.userData.vistaSeed = seed;
  mesh.userData.baseY = mesh.position.y;
  mesh.userData.baseScaleX = mesh.scale.x;
  mesh.userData.baseScaleY = mesh.scale.y;
  mesh.userData.baseScaleZ = mesh.scale.z;
  mesh.userData.baseOpacity = (mesh.material as THREE.Material).opacity;
  return mesh;
}

function addEscapeVista(group: THREE.Group, room: Room, index: number) {
  const vista = new THREE.Group();
  vista.userData.escapeVistaRig = true;
  vista.userData.vistaSeed = 70 + index * 19;

  const archMaterial = mat(new THREE.Color(room.palette[3]).lerp(new THREE.Color(0x120e0d), 0.4).getHex(), {
    roughness: 0.58,
    metalness: 0.22,
    emissive: room.palette[3],
    emissiveIntensity: 0.08,
    texture: "metal",
    textureRepeat: [0.8, 2.6],
    textureSeed: 1210 + index,
  });
  const glowMaterial = mat(room.palette[2], {
    roughness: 0.22,
    metalness: 0.18,
    emissive: room.palette[2],
    emissiveIntensity: 0.48,
    transparent: true,
    opacity: index === 4 ? 0.66 : 0.46,
  });
  const accentMaterial = mat(room.palette[1], {
    roughness: 0.36,
    metalness: 0.2,
    emissive: room.palette[1],
    emissiveIntensity: 0.18,
    texture: "metal",
    textureSeed: 1220 + index,
  });
  const paperMaterial = mat(0xffedcf, { roughness: 0.82, texture: "paper", textureSeed: 1230 + index });

  const portalPanel = scenePlane(
    1.44,
    2.56,
    cinematicMaterial(room.palette[2], index === 4 ? 0.095 : 0.045, "reflection"),
    4.95,
    1.82,
    -4.18,
  );
  portalPanel.userData.escapeVistaPanel = true;
  portalPanel.userData.baseOpacity = (portalPanel.material as THREE.MeshBasicMaterial).opacity;
  portalPanel.userData.vistaSeed = index * 9 + 2;
  vista.add(portalPanel);

  const archParts = [
    box(0.18, 2.84, 0.18, archMaterial, 3.54, 1.7, -4.02),
    box(0.18, 2.84, 0.18, archMaterial, 6.36, 1.7, -4.02),
    box(3.0, 0.18, 0.18, archMaterial, 4.95, 3.08, -4.02),
    box(3.28, 0.08, 0.12, glowMaterial.clone(), 4.95, 0.32, -4.0),
  ];
  archParts.forEach((part, partIndex) => {
    part.userData.escapeVistaSolid = true;
    if (partIndex === 3) markEscapeGlow(part, partIndex + index * 11);
    vista.add(part);
  });

  for (let i = 0; i < 8; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const rail = box(0.05, 0.38 + (i % 3) * 0.08, 0.055, glowMaterial.clone(), 4.95 + side * 1.23, 0.78 + Math.floor(i / 2) * 0.47, -3.91);
    rail.rotation.z = side * (0.08 + i * 0.012);
    markEscapeGlow(rail, 18 + i + index * 13);
    vista.add(rail);
  }

  for (let i = 0; i < 9; i += 1) {
    const t = (i + 1) / 9;
    const breadcrumb = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.16, 0.024, 28), glowMaterial.clone());
    breadcrumb.position.set(0.72 + t * 4.05 + Math.sin(index + i * 0.8) * 0.1, 0.17, 2.14 - t * 5.58);
    breadcrumb.scale.set(1.24 - t * 0.24, 1, 0.58 + t * 0.34);
    breadcrumb.rotation.y = -0.63 + Math.sin(i) * 0.04;
    breadcrumb.userData.escapeBreadcrumb = true;
    breadcrumb.userData.trailIndex = i;
    breadcrumb.userData.baseY = breadcrumb.position.y;
    breadcrumb.userData.baseScaleX = breadcrumb.scale.x;
    breadcrumb.userData.baseScaleY = breadcrumb.scale.y;
    breadcrumb.userData.baseScaleZ = breadcrumb.scale.z;
    breadcrumb.userData.baseOpacity = (breadcrumb.material as THREE.Material).opacity;
    vista.add(breadcrumb);
  }

  if (index === 0) {
    const sun = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.018, 10, 56), glowMaterial.clone());
    sun.position.set(5.38, 2.5, -3.82);
    markEscapeGlow(sun, 42);
    vista.add(sun);

    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const ray = box(0.18, 0.018, 0.03, glowMaterial.clone(), 5.38 + Math.cos(angle) * 0.42, 2.5 + Math.sin(angle) * 0.42, -3.8);
      ray.rotation.z = angle;
      markEscapeGlow(ray, 44 + i);
      vista.add(ray);
    }

    [-0.66, 0.66].forEach((offset, frameIndex) => {
      const photo = box(0.42, 0.56, 0.055, paperMaterial, 4.95 + offset, 1.88 + frameIndex * 0.18, -3.84);
      const ribbon = box(0.5, 0.035, 0.06, accentMaterial, 4.95 + offset, photo.position.y - 0.36, -3.79);
      photo.rotation.z = offset * 0.22;
      ribbon.rotation.z = photo.rotation.z;
      vista.add(photo, markEscapeGlow(ribbon, 50 + frameIndex));
    });

    for (let i = 0; i < 10; i += 1) {
      const vine = box(0.035, 0.42, 0.035, accentMaterial, 3.72 + (i % 2) * 2.46 + Math.sin(i) * 0.05, 0.78 + i * 0.22, -3.82);
      vine.rotation.z = (i % 2 ? -1 : 1) * (0.18 + Math.sin(i) * 0.12);
      vista.add(vine);
    }
  } else if (index === 1) {
    const saucer = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.026, 8, 58), accentMaterial);
    saucer.position.set(4.95, 1.18, -3.84);
    saucer.rotation.x = Math.PI / 2;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.48, 28), paperMaterial);
    cup.position.set(4.95, 1.38, -3.86);
    vista.add(saucer, cup);

    for (let i = 0; i < 5; i += 1) {
      const steam = box(0.035, 0.5 + i * 0.035, 0.035, glowMaterial.clone(), 4.65 + i * 0.15, 1.9 + Math.sin(i) * 0.06, -3.78);
      steam.rotation.z = -0.28 + i * 0.14;
      markEscapeGlow(steam, 64 + i);
      vista.add(steam);
    }
  } else if (index === 2) {
    const shield = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.026, 10, 72), glowMaterial.clone());
    shield.position.set(4.95, 2.0, -3.84);
    shield.scale.set(0.92, 1.22, 1);
    markEscapeGlow(shield, 75);
    vista.add(shield);

    for (let i = 0; i < 5; i += 1) {
      const bolt = box(0.055, 0.56, 0.055, accentMaterial, 4.76 + i * 0.12, 2.46 - i * 0.25, -3.78);
      bolt.rotation.z = i % 2 === 0 ? -0.55 : 0.42;
      markEscapeGlow(bolt, 82 + i);
      vista.add(bolt);
    }

    for (let i = 0; i < 14; i += 1) {
      const rain = box(0.018, 0.36 + (i % 4) * 0.08, 0.018, glowMaterial.clone(), 3.82 + (i % 7) * 0.36, 0.88 + Math.floor(i / 7) * 1.22 + Math.sin(i) * 0.08, -3.76);
      rain.rotation.z = -0.26;
      markEscapeGlow(rain, 92 + i);
      vista.add(rain);
    }
  } else if (index === 3) {
    for (let i = 0; i < 9; i += 1) {
      const tower = box(0.18 + (i % 3) * 0.08, 0.45 + (i % 4) * 0.18, 0.09, i % 2 ? archMaterial : accentMaterial, 3.82 + i * 0.28, 1.05 + (i % 4) * 0.09, -3.84);
      vista.add(tower);
      const light = box(0.06, 0.06, 0.04, glowMaterial.clone(), tower.position.x, tower.position.y + 0.12, -3.77);
      markEscapeGlow(light, 110 + i);
      vista.add(light);
    }

    const bridge = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.024, 8, 64, Math.PI), glowMaterial.clone());
    bridge.position.set(4.95, 1.58, -3.75);
    bridge.rotation.z = Math.PI;
    markEscapeGlow(bridge, 124);
    vista.add(bridge);
  } else {
    for (let i = 0; i < 3; i += 1) {
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.78 + i * 0.22, 0.022, 10, 86), glowMaterial.clone());
      halo.position.set(4.95, 2.05, -3.78 + i * 0.018);
      halo.rotation.z = i * 0.2;
      markEscapeGlow(halo, 140 + i);
      vista.add(halo);
    }

    for (let i = 0; i < 7; i += 1) {
      const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.24 + (i % 3) * 0.04, 18, 10), paperMaterial);
      cloud.position.set(3.88 + i * 0.36, 0.54 + Math.sin(i) * 0.05, -3.64 + Math.cos(i) * 0.08);
      cloud.scale.set(1.55, 0.36, 0.82);
      cloud.userData.cloud = true;
      vista.add(cloud);
    }

    const vowKey = box(0.82, 0.055, 0.055, accentMaterial, 4.95, 2.92, -3.72);
    const vowBit = box(0.16, 0.16, 0.05, accentMaterial, 5.34, 2.92, -3.7);
    const vowRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 8, 38), glowMaterial.clone());
    vowRing.position.set(4.52, 2.92, -3.68);
    markEscapeGlow(vowRing, 151);
    vista.add(vowKey, vowBit, vowRing);
  }

  const vistaLight = new THREE.PointLight(room.palette[2], index === 4 ? 1.52 : 0.92, index === 4 ? 7 : 5.6);
  vistaLight.position.set(4.95, 2.1, -3.1);
  vistaLight.userData.escapeVistaLight = true;
  group.userData.escapeVistaLight = vistaLight;

  group.add(vista, vistaLight);
}

function addRoomSpecifics(group: THREE.Group, room: Room, index: number) {
  addThemedClueCluster(group, room, index);

  if (index === 0) {
    addCurtainWindow(group, room, -5.45, 2.55, -4.35);
    addVines(group, room, -4.2, 3.7, -4.38, 18);
    addHeartParticles(group, room, 18);
    addPrologueMemoryStage(group, room);
    addUnrealRoomOneMemoryMap(group, room);
  }

  if (index === 1) {
    addCafeTable(group, room);
    addPendantLights(group, room, 3);
  }

  if (index === 2) {
    addCracks(group, room);
    addRainStreaks(group, room, 38);
  }

  if (index === 3) {
    addCityWindow(group, room);
    addPaperTrail(group, 22);
  }

  if (index === 4) {
    addHeavenPath(group, room);
    addFinalMemoryCorridor(group, room);
    addLightBeams(group, room);
  }
}

function addLivedInEscapeRoomDetails(group: THREE.Group, room: Room, index: number) {
  const scuffMaterial = mat(0x15100e, { roughness: 0.92, transparent: true, opacity: index === 4 ? 0.18 : 0.34 });
  const chalkMaterial = mat(room.palette[2], {
    roughness: 0.72,
    emissive: room.palette[2],
    emissiveIntensity: index === 4 ? 0.32 : 0.13,
    transparent: true,
    opacity: index === 4 ? 0.42 : 0.3,
  });
  const tapeMaterial = mat(room.palette[1], {
    roughness: 0.74,
    emissive: room.palette[1],
    emissiveIntensity: 0.08,
    transparent: true,
    opacity: 0.74,
  });
  const paperMaterial = mat(0xffeed2, { roughness: 0.86, texture: "paper", textureSeed: 1160 + index });
  const shelfMaterial = mat(0x4b3023, { roughness: 0.68, metalness: 0.04, texture: "wood", textureRepeat: [1.4, 0.7], textureSeed: 1170 + index });
  const accentMaterial = mat(room.palette[1], { roughness: 0.42, metalness: 0.12, emissive: room.palette[1], emissiveIntensity: 0.18 });

  for (let i = 0; i < 20; i += 1) {
    const scratch = box(0.38 + (i % 5) * 0.15, 0.01, 0.025 + (i % 3) * 0.012, scuffMaterial, -6.1 + ((i * 43) % 122) / 10, 0.126, -3.05 + ((i * 29) % 66) / 10);
    scratch.rotation.y = Math.sin(index * 1.7 + i * 0.91) * 1.45;
    scratch.userData.livedInDetail = true;
    group.add(scratch);
  }

  for (let i = 0; i < 9; i += 1) {
    const footprint = new THREE.Mesh(new THREE.CircleGeometry(0.105 + (i % 2) * 0.025, 16), scuffMaterial.clone());
    footprint.position.set(-3.4 + i * 0.72, 0.136, 2.05 - i * 0.28 + Math.sin(i) * 0.1);
    footprint.scale.set(0.62, 1.0, 1);
    footprint.rotation.set(-Math.PI / 2, 0, -0.34 + i * 0.08);
    footprint.userData.livedInDetail = true;
    group.add(footprint);
  }

  for (let i = 0; i < 8; i += 1) {
    const mark = box(0.42 + (i % 3) * 0.18, 0.028, 0.026, chalkMaterial, -5.8 + i * 1.34, 1.62 + (i % 4) * 0.44, -4.205);
    mark.rotation.z = -0.32 + Math.sin(i * 1.2) * 0.3;
    mark.userData.livedInDetail = true;
    group.add(mark);

    const tape = box(0.22, 0.045, 0.028, tapeMaterial, mark.position.x - 0.22, mark.position.y + 0.12, -4.18);
    tape.rotation.z = 0.18 + Math.sin(i) * 0.25;
    tape.userData.livedInDetail = true;
    group.add(tape);
  }

  [-5.62, 5.78].forEach((x, sideIndex) => {
    const shelf = box(1.62, 0.08, 0.42, shelfMaterial, x, 1.48 + sideIndex * 0.55, -3.24 + sideIndex * 0.12);
    shelf.rotation.y = sideIndex === 0 ? 0.48 : -0.48;
    shelf.userData.livedInDetail = true;
    group.add(shelf);

    for (let i = 0; i < 4; i += 1) {
      const prop = box(0.18 + (i % 2) * 0.08, 0.16 + (i % 3) * 0.08, 0.16, i % 2 ? paperMaterial : accentMaterial, x + (sideIndex === 0 ? 0.14 + i * 0.27 : -0.14 - i * 0.27), shelf.position.y + 0.15, shelf.position.z + 0.05);
      prop.rotation.y = shelf.rotation.y + Math.sin(i) * 0.2;
      prop.userData.livedInDetail = true;
      prop.userData.statusLight = i === 3;
      group.add(prop);
    }
  });

  const residueMaterial = mat(index === 4 ? 0xfff5c7 : room.palette[2], {
    roughness: 0.5,
    emissive: index === 4 ? 0xffe4a5 : room.palette[2],
    emissiveIntensity: index === 4 ? 0.38 : 0.18,
    transparent: true,
    opacity: index === 4 ? 0.52 : 0.38,
  });

  for (let i = 0; i < 12; i += 1) {
    const shape = index === 2 ? new THREE.CylinderGeometry(0.12 + (i % 3) * 0.05, 0.16 + (i % 3) * 0.06, 0.012, 18) : new THREE.BoxGeometry(0.16 + (i % 4) * 0.08, 0.012, 0.06 + (i % 3) * 0.035);
    const residue = new THREE.Mesh(shape, residueMaterial.clone());
    residue.position.set(-5.25 + ((i * 47) % 105) / 10, 0.148, -2.8 + ((i * 31) % 58) / 10);
    residue.rotation.y = Math.sin(i * 1.7 + index) * 1.7;
    residue.userData.livedInDetail = true;
    if (index === 4) residue.userData.statusLight = true;
    group.add(residue);
  }
}

function addPhysicalClueNetwork(group: THREE.Group, room: Room, index: number) {
  const boardMaterial = mat(0x2a211c, {
    roughness: 0.74,
    metalness: 0.05,
    emissive: room.palette[3],
    emissiveIntensity: 0.05,
    texture: "wood",
    textureRepeat: [1.3, 0.8],
    textureSeed: 1500 + index,
  });
  const paperMaterial = mat(0xffebcf, {
    roughness: 0.86,
    emissive: room.palette[1],
    emissiveIntensity: 0.04,
    transparent: true,
    opacity: 0.92,
    texture: "paper",
    textureSeed: 1520 + index,
  });
  const photoMaterial = mat(room.palette[2], {
    roughness: 0.5,
    emissive: room.palette[2],
    emissiveIntensity: 0.16,
    transparent: true,
    opacity: 0.82,
    texture: "paper",
    textureSeed: 1540 + index,
  });
  const linkMaterial = mat(room.palette[2], {
    roughness: 0.42,
    metalness: 0.08,
    emissive: room.palette[2],
    emissiveIntensity: 0.42,
    transparent: true,
    opacity: 0.48,
  });
  const pinMaterial = mat(room.palette[1], {
    roughness: 0.32,
    metalness: 0.18,
    emissive: room.palette[1],
    emissiveIntensity: 0.26,
  });

  const boardX = index === 4 ? -5.0 : -5.35;
  const boardY = 2.55;
  const boardZ = -4.17;
  const roomStart = index * 2;
  const board = box(2.35, 1.36, 0.06, boardMaterial, boardX, boardY, boardZ);
  board.userData.physicalClueNetwork = true;
  group.add(board);

  const nodePositions: Array<[number, number, number]> = [
    [boardX - 0.58, boardY + 0.26, 0],
    [boardX + 0.08, boardY - 0.12, 1],
    [boardX + 0.68, boardY + 0.2, 2],
  ];

  nodePositions.forEach(([x, y, stage], nodeIndex) => {
    const cardMaterial = nodeIndex === 1 ? photoMaterial.clone() : paperMaterial.clone();
    const card = box(0.48 + nodeIndex * 0.04, 0.38, 0.035, cardMaterial, x, y, boardZ + 0.055);
    card.rotation.z = -0.12 + nodeIndex * 0.11;
    card.userData.physicalClueNetwork = true;
    card.userData.clueNode = true;
    card.userData.clueStage = stage;
    card.userData.clueRoomStart = roomStart;
    card.userData.baseY = card.position.y;
    card.userData.baseRotationZ = card.rotation.z;
    group.add(card);

    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), pinMaterial.clone());
    pin.position.set(x - 0.14 + nodeIndex * 0.07, y + 0.17, boardZ + 0.095);
    pin.scale.set(1, 1, 0.55);
    pin.userData.physicalClueNetwork = true;
    pin.userData.clueNode = true;
    pin.userData.clueStage = stage;
    pin.userData.clueRoomStart = roomStart;
    group.add(pin);

    const stamp = box(0.18, 0.025, 0.026, linkMaterial.clone(), x + 0.04, y - 0.11, boardZ + 0.09);
    stamp.rotation.z = card.rotation.z + 0.08;
    stamp.userData.physicalClueNetwork = true;
    stamp.userData.clueLink = true;
    stamp.userData.clueStage = stage;
    stamp.userData.clueRoomStart = roomStart;
    group.add(stamp);
  });

  for (let i = 0; i < nodePositions.length - 1; i += 1) {
    const [x1, y1] = nodePositions[i];
    const [x2, y2] = nodePositions[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const link = box(Math.hypot(dx, dy), 0.018, 0.026, linkMaterial.clone(), (x1 + x2) / 2, (y1 + y2) / 2, boardZ + 0.1);
    link.rotation.z = Math.atan2(dy, dx);
    link.userData.physicalClueNetwork = true;
    link.userData.clueLink = true;
    link.userData.clueStage = i + 1;
    link.userData.clueRoomStart = roomStart;
    group.add(link);
  }

  const kitAnchor = box(0.18, 0.18, 0.034, linkMaterial.clone(), -1.35, 1.12, -0.2);
  kitAnchor.rotation.z = Math.PI / 4;
  kitAnchor.userData.physicalClueNetwork = true;
  kitAnchor.userData.clueLink = true;
  kitAnchor.userData.clueStage = 1;
  kitAnchor.userData.clueRoomStart = roomStart;
  group.add(kitAnchor);

  const floorPoints: Array<[number, number, number]> = [
    [-5.42, -3.86, 0],
    [-3.75, -2.65, 0],
    [-2.1, -1.42, 1],
    [-0.54, -0.46, 1],
    [1.15, -1.25, 2],
    [3.18, -2.86, 2],
    [4.72, -3.78, 2],
  ];

  for (let i = 0; i < floorPoints.length - 1; i += 1) {
    const [x1, z1, stageA] = floorPoints[i];
    const [x2, z2, stageB] = floorPoints[i + 1];
    const dx = x2 - x1;
    const dz = z2 - z1;
    const trail = box(Math.hypot(dx, dz), 0.024, 0.052, linkMaterial.clone(), (x1 + x2) / 2, 0.164, (z1 + z2) / 2);
    trail.rotation.y = -Math.atan2(dz, dx);
    trail.userData.physicalClueNetwork = true;
    trail.userData.clueFloorTrail = true;
    trail.userData.clueStage = Math.max(stageA, stageB);
    trail.userData.clueRoomStart = roomStart;
    trail.userData.baseY = trail.position.y;
    trail.userData.baseScaleX = trail.scale.x;
    trail.userData.baseScaleY = trail.scale.y;
    trail.userData.baseScaleZ = trail.scale.z;
    group.add(trail);
  }

  [0, 1, 2].forEach((stage) => {
    const seal = new THREE.Mesh(new THREE.TorusGeometry(0.18 + stage * 0.045, 0.011, 8, 46), linkMaterial.clone());
    seal.position.set(-0.55 + stage * 0.55, 0.19, -0.66 - stage * 0.26);
    seal.rotation.x = Math.PI / 2;
    seal.userData.physicalClueNetwork = true;
    seal.userData.clueSeal = true;
    seal.userData.clueStage = stage;
    seal.userData.clueRoomStart = roomStart;
    group.add(seal);
  });
}

function addThemedClueCluster(group: THREE.Group, room: Room, index: number) {
  const wood = mat(0x5a3827, { roughness: 0.62, metalness: 0.04, texture: "wood", textureRepeat: [1.2, 0.8], textureSeed: 940 + index });
  const accent = mat(room.palette[1], { roughness: 0.36, metalness: 0.16, emissive: room.palette[1], emissiveIntensity: 0.18 });
  const glow = mat(room.palette[2], { roughness: 0.24, metalness: 0.08, emissive: room.palette[2], emissiveIntensity: 0.36 });
  const paper = mat(0xffedcf, { roughness: 0.82, texture: "paper", textureSeed: 950 + index });
  const shadow = mat(room.palette[3], { roughness: 0.78, metalness: 0.02, emissive: room.palette[3], emissiveIntensity: 0.04 });

  const shelf = box(2.55, 0.08, 0.42, wood, -3.85, 1.2, 2.42);
  shelf.rotation.y = 0.08;
  group.add(shelf);

  if (index === 0) {
    const diary = box(0.76, 0.1, 0.5, paper, -4.55, 1.34, 2.42);
    const ribbon = box(0.68, 0.025, 0.055, accent, -4.55, 1.41, 2.42);
    const firstPhoto = box(0.48, 0.34, 0.05, glow, -3.78, 1.48, 2.35);
    firstPhoto.rotation.x = -0.18;
    firstPhoto.userData.statusLight = true;
    for (let i = 0; i < 4; i += 1) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), i % 2 ? accent : glow);
      bead.position.set(-3.2 + i * 0.16, 1.36 + Math.sin(i) * 0.035, 2.48);
      bead.userData.statusLight = true;
      group.add(bead);
    }
    group.add(diary, ribbon, firstPhoto);
    return;
  }

  if (index === 1) {
    [-0.28, 0.28].forEach((offset, i) => {
      const chair = box(0.28, 0.34, 0.16, accent, -4.18 + offset, 1.39, 2.4);
      const back = box(0.28, 0.32, 0.045, accent, -4.18 + offset, 1.58, 2.28);
      back.rotation.x = -0.12;
      group.add(chair, back);
      for (let s = 0; s < 2; s += 1) {
        const steam = box(0.025, 0.26, 0.025, glow, -4.18 + offset + s * 0.06, 1.76 + s * 0.04, 2.43);
        steam.rotation.z = (i ? -1 : 1) * (0.22 + s * 0.16);
        steam.userData.statusLight = true;
        group.add(steam);
      }
    });
    const promiseBand = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.018, 8, 42), glow);
    promiseBand.position.set(-3.36, 1.42, 2.4);
    promiseBand.rotation.x = Math.PI / 2;
    promiseBand.userData.statusLight = true;
    group.add(promiseBand);
    return;
  }

  if (index === 2) {
    const heartA = box(0.28, 0.28, 0.055, accent, -4.32, 1.46, 2.42);
    const heartB = box(0.28, 0.28, 0.055, accent, -4.03, 1.4, 2.42);
    heartA.rotation.z = Math.PI / 4;
    heartB.rotation.z = Math.PI / 4;
    heartA.userData.statusLight = true;
    heartB.userData.statusLight = true;
    group.add(heartA, heartB);
    for (let i = 0; i < 7; i += 1) {
      const rain = box(0.018, 0.42, 0.018, glow, -3.6 + i * 0.16, 1.34 + (i % 3) * 0.12, 2.46);
      rain.rotation.z = -0.24;
      rain.userData.statusLight = true;
      group.add(rain);
    }
    const repairThread = box(0.86, 0.026, 0.026, paper, -4.18, 1.68, 2.49);
    repairThread.rotation.z = 0.18;
    group.add(repairThread);
    return;
  }

  if (index === 3) {
    for (let i = 0; i < 6; i += 1) {
      const note = box(0.36, 0.025, 0.26, i % 2 ? paper : shadow, -4.68 + i * 0.32, 1.32 + Math.sin(i) * 0.04, 2.42 + Math.cos(i) * 0.04);
      note.rotation.y = Math.sin(i) * 0.7;
      note.rotation.z = Math.cos(i * 1.4) * 0.18;
      group.add(note);
    }
    const bridge = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.02, 8, 44, Math.PI), glow);
    bridge.position.set(-3.6, 1.48, 2.42);
    bridge.rotation.set(0, 0, Math.PI);
    bridge.userData.statusLight = true;
    group.add(bridge);
    return;
  }

  const compassBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.065, 40), accent);
  compassBase.position.set(-4.2, 1.36, 2.42);
  compassBase.rotation.x = Math.PI / 2;
  const compassNeedle = box(0.72, 0.04, 0.04, glow, -4.2, 1.39, 2.36);
  compassNeedle.rotation.z = -0.42;
  compassNeedle.userData.statusLight = true;
  const futureRibbon = box(1.0, 0.04, 0.04, paper, -3.32, 1.54, 2.42);
  futureRibbon.rotation.z = 0.2;
  futureRibbon.userData.statusLight = true;
  group.add(compassBase, compassNeedle, futureRibbon);
}

function addCurtainWindow(group: THREE.Group, room: Room, x: number, y: number, z: number) {
  const glass = mat(0xfff8dc, { roughness: 0.12, metalness: 0.02, emissive: 0xffddaa, emissiveIntensity: 0.18, transparent: true, opacity: 0.58 });
  const windowPanel = box(1.55, 1.9, 0.08, glass, x, y, z);
  const curtain = box(0.18, 2.25, 0.06, mat(0xffd3c9, { roughness: 0.88, transparent: true, opacity: 0.75 }), x - 0.92, y, z + 0.08);
  const curtain2 = curtain.clone();
  curtain2.position.x = x + 0.92;
  group.add(windowPanel, curtain, curtain2);
  const light = new THREE.PointLight(room.palette[0], 1.55, 7);
  light.position.set(x, y + 0.25, z + 0.9);
  group.add(light);
}

function addVines(group: THREE.Group, room: Room, x: number, y: number, z: number, count: number) {
  const stemMat = mat(0x38573a, { roughness: 0.8 });
  const leafMat = mat(room.palette[2], { roughness: 0.78 });
  for (let i = 0; i < count; i += 1) {
    const stem = box(0.035, 0.55, 0.035, stemMat, x + Math.sin(i) * 0.35, y - i * 0.11, z);
    stem.rotation.z = Math.sin(i * 1.4) * 0.45;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 6), leafMat);
    leaf.scale.set(1.4, 0.45, 0.8);
    leaf.position.set(stem.position.x + 0.08, stem.position.y - 0.12, z + 0.04);
    group.add(stem, leaf);
  }
}

function addHeartParticles(group: THREE.Group, room: Room, count: number) {
  const material = mat(room.palette[1], { roughness: 0.4, emissive: room.palette[1], emissiveIntensity: 0.45 });
  for (let i = 0; i < count; i += 1) {
    const heart = box(0.08, 0.08, 0.025, material, -5 + ((i * 41) % 95) / 10, 1.1 + ((i * 17) % 28) / 10, -3.7 + Math.sin(i) * 0.3);
    heart.rotation.z = Math.PI / 4;
    heart.userData.float = true;
    group.add(heart);
  }
}

function addPrologueMemoryStage(group: THREE.Group, room: Room) {
  const warmWood = mat(0x7a4f32, {
    roughness: 0.58,
    metalness: 0.06,
    emissive: 0x2a170d,
    emissiveIntensity: 0.05,
    texture: "wood",
    textureRepeat: [1.2, 2.4],
    textureSeed: 1310,
  });
  const brass = mat(0xf0b86d, {
    roughness: 0.34,
    metalness: 0.54,
    emissive: 0xffb86d,
    emissiveIntensity: 0.12,
    texture: "metal",
    textureSeed: 1311,
  });
  const photoPaper = mat(0xffecd5, {
    roughness: 0.82,
    emissive: 0xffd7a0,
    emissiveIntensity: 0.08,
    texture: "paper",
    textureSeed: 1312,
  });
  const ribbon = mat(room.palette[1], {
    roughness: 0.66,
    emissive: room.palette[1],
    emissiveIntensity: 0.22,
    transparent: true,
    opacity: 0.86,
  });
  const glow = mat(room.palette[2], {
    roughness: 0.28,
    metalness: 0.08,
    emissive: room.palette[2],
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.62,
  });

  for (let i = 0; i < 4; i += 1) {
    const z = -3.15 + i * 1.28;
    const scale = 1 - i * 0.06;
    const leftPost = box(0.09, 2.7 * scale, 0.11, warmWood, -5.9 + i * 0.42, 2.14, z);
    const rightPost = box(0.09, 2.7 * scale, 0.11, warmWood, 5.9 - i * 0.42, 2.14, z);
    const lintel = box(11.4 - i * 0.84, 0.09, 0.11, warmWood, 0, 3.54 - i * 0.08, z);
    [leftPost, rightPost, lintel].forEach((part) => {
      part.castShadow = true;
      part.userData.prologueSetDressing = true;
      group.add(part);
    });
  }

  for (let i = 0; i < 12; i += 1) {
    const t = i / 11;
    const x = -4.8 + t * 9.6;
    const y = 3.02 + Math.sin(t * Math.PI) * 0.28;
    const hanger = box(0.035, 0.42 + (i % 3) * 0.08, 0.035, brass, x, y - 0.2, -3.62);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07 + (i % 2) * 0.015, 12, 8), glow.clone());
    bulb.position.set(x, y - 0.46, -3.58);
    bulb.userData.statusLight = true;
    bulb.userData.prologueSetDressing = true;
    hanger.userData.prologueSetDressing = true;
    group.add(hanger, bulb);
  }

  for (let i = 0; i < 7; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    const x = side * (2.2 + row * 0.66);
    const y = 1.72 + (i % 3) * 0.2;
    const z = -2.85 + row * 0.62;
    const frame = box(0.58, 0.72, 0.06, brass, x, y, z);
    const photo = box(0.46, 0.58, 0.065, photoPaper, x, y, z + 0.04);
    const tag = box(0.3, 0.035, 0.07, ribbon, x, y - 0.44, z + 0.06);
    frame.rotation.y = side < 0 ? 0.42 : -0.42;
    photo.rotation.copy(frame.rotation);
    tag.rotation.copy(frame.rotation);
    [frame, photo, tag].forEach((mesh) => {
      mesh.castShadow = true;
      mesh.userData.prologueSetDressing = true;
      group.add(mesh);
    });
  }

  for (let i = 0; i < 11; i += 1) {
    const t = i / 10;
    const step = new THREE.Mesh(new THREE.CylinderGeometry(0.16 + t * 0.05, 0.23 + t * 0.06, 0.026, 30), glow.clone());
    step.position.set(-3.75 + t * 7.5, 0.16, 2.22 - t * 5.4);
    step.scale.set(1.65 - t * 0.28, 1, 0.52 + t * 0.18);
    step.rotation.y = -0.7 + Math.sin(i * 0.9) * 0.08;
    step.userData.prologueSetDressing = true;
    group.add(step);
  }

  const stageLight = new THREE.PointLight(room.palette[1], 1.25, 6.4);
  stageLight.position.set(0, 2.9, -2.3);
  group.add(stageLight);
}

function addUnrealRoomOneMemoryMap(group: THREE.Group, room: Room) {
  group.userData.unrealRoomOneMirror = true;
  addRoomOneReferenceArchitecture(group, room);
  addRoomOneReferenceEntryDesk(group, room);
  addRoomOneReferenceMemoryWall(group, room);
  addRoomOneReferenceMusicCabinet(group, room);
  addRoomOneReferenceFloorPuzzle(group, room);
  addRoomOneReferenceBeefAndSteak(group, room);
  addRoomOneReferenceExitDoor(group, room);
  addRoomOneUnrealMarkerLights(group, room);
}

function addRoomOneReferenceArchitecture(group: THREE.Group, room: Room) {
  const floorInset = mat(0x4a2d1f, { roughness: 0.62, metalness: 0.04, texture: "wood", textureRepeat: [6.2, 4.6], textureSeed: 5601 });
  const redPlaster = mat(0x8f4638, { roughness: 0.9, texture: "plaster", textureRepeat: [4.8, 2.4], textureSeed: 5602 });
  const stone = mat(0x766454, { roughness: 0.86, metalness: 0.02, texture: "plaster", textureRepeat: [1.2, 1.6], textureSeed: 5603 });
  const darkWood = mat(0x3a2116, { roughness: 0.58, texture: "wood", textureRepeat: [2.4, 1.4], textureSeed: 5604 });
  const carvedWood = mat(0x5b3521, { roughness: 0.52, metalness: 0.03, texture: "wood", textureRepeat: [1.3, 1.2], textureSeed: 5605 });
  const velvet = mat(0x5f2328, { roughness: 0.74, emissive: 0x1d0709, emissiveIntensity: 0.06, texture: "fabric", textureRepeat: [1.5, 0.9], textureSeed: 5606 });
  const candleWax = mat(0xffead4, { roughness: 0.72, emissive: 0xffc785, emissiveIntensity: 0.08 });
  const flame = mat(0xffbf6f, { roughness: 0.2, metalness: 0.04, emissive: 0xffa13c, emissiveIntensity: 0.85, transparent: true, opacity: 0.88 });
  const brass = mat(0xc3914d, { roughness: 0.28, metalness: 0.58, emissive: 0xffaa51, emissiveIntensity: 0.1, texture: "metal", textureSeed: 5607 });
  const shadowWood = mat(0x17100c, { roughness: 0.7, texture: "wood", textureRepeat: [0.4, 4.8], textureSeed: 5608 });
  const rugMaterial = mat(0x55201d, { roughness: 0.86, emissive: 0x160505, emissiveIntensity: 0.05, texture: "fabric", textureRepeat: [2.6, 1.4], textureSeed: 5609 });

  const floor = box(12.7, 0.042, 7.65, floorInset, 0, 0.05, -0.22);
  floor.receiveShadow = true;
  group.add(floor);

  for (let i = 0; i < 11; i += 1) {
    const seam = box(0.018, 0.012, 7.45, shadowWood, -5.55 + i * 1.1, 0.08, -0.22);
    seam.receiveShadow = true;
    group.add(seam);
  }

  for (let i = 0; i < 7; i += 1) {
    const crossSeam = box(12.2, 0.01, 0.014, shadowWood, 0, 0.082, -3.6 + i * 1.08);
    crossSeam.receiveShadow = true;
    group.add(crossSeam);
  }

  const rug = box(4.95, 0.026, 2.18, rugMaterial, 0.06, 0.095, 0.62);
  [rug].forEach((part) => {
    part.receiveShadow = true;
    part.userData.roomOneUnrealMirror = true;
    group.add(part);
  });

  group.add(box(12.75, 3.55, 0.08, redPlaster, 0, 2.06, -4.5));
  group.add(box(12.78, 0.92, 0.11, darkWood, 0, 0.58, -4.38));
  group.add(box(12.78, 0.18, 0.12, carvedWood, 0, 3.82, -4.34));
  group.add(box(12.78, 0.16, 0.12, carvedWood, 0, 4.35, -4.34));
  group.add(box(12.62, 0.09, 0.12, brass, 0, 1.05, -4.0));

  for (let i = 0; i < 7; i += 1) {
    const x = -5.8 + i * 1.94;
    const pilaster = box(0.18, 3.45, 0.16, stone, x, 2.15, -4.18);
    const base = box(0.38, 0.18, 0.2, carvedWood, x, 0.75, -4.08);
    const capital = box(0.44, 0.16, 0.18, brass, x, 3.72, -4.06);
    pilaster.castShadow = true;
    group.add(pilaster, base, capital);
  }

  [-4.6, -1.75, 1.75, 4.6].forEach((x, alcoveIndex) => {
    const back = box(1.64, 1.86, 0.05, mat(alcoveIndex % 2 ? 0x6f332b : 0x81513a, { roughness: 0.9, texture: "plaster", textureRepeat: [1.2, 1.1], textureSeed: 5680 + alcoveIndex }), x, 2.32, -4.08);
    const left = box(0.12, 2.0, 0.16, stone, x - 0.9, 2.26, -3.98);
    const right = box(0.12, 2.0, 0.16, stone, x + 0.9, 2.26, -3.98);
    const top = box(1.88, 0.14, 0.16, stone, x, 3.24, -3.98);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.055, 8, 40, Math.PI), stone);
    arch.position.set(x, 3.2, -3.98);
    arch.rotation.z = Math.PI;
    arch.scale.y = 0.48;
    [back, left, right, top, arch].forEach((part) => {
      part.userData.roomOneUnrealMirror = true;
      group.add(part);
    });
  });

  [-6.55, 6.55].forEach((x, sideIndex) => {
    const sideRotation = sideIndex === 0 ? Math.PI / 2 : -Math.PI / 2;
    const bench = box(1.62, 0.32, 0.58, velvet, x, 0.72, -1.9);
    bench.rotation.y = sideRotation;
    const rail = box(1.76, 0.16, 0.08, carvedWood, x, 1.0, -1.9);
    rail.rotation.y = sideRotation;
    const wallPanelA = box(0.07, 1.8, 1.42, redPlaster, x, 2.2, -1.2);
    const wallPanelB = box(0.07, 1.8, 1.42, redPlaster, x, 2.2, 1.08);
    const trimA = box(0.09, 0.08, 1.56, carvedWood, x, 3.14, -1.2);
    const trimB = box(0.09, 0.08, 1.56, carvedWood, x, 3.14, 1.08);
    const footRail = box(0.09, 0.08, 1.56, brass, x, 1.23, sideIndex === 0 ? 1.08 : -1.2);
    group.add(bench, rail, wallPanelA, wallPanelB, trimA, trimB, footRail);
  });

  const chandelier = new THREE.Group();
  chandelier.position.set(-0.2, 4.25, -0.35);
  chandelier.userData.roomOneUnrealMirror = true;
  chandelier.add(new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.025, 8, 60), brass));
  chandelier.add(box(0.035, 0.78, 0.035, brass, 0, 0.34, 0));
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const chain = box(0.026, 0.84, 0.026, brass, Math.cos(angle) * 0.46, 0.36, Math.sin(angle) * 0.46);
    chain.rotation.z = Math.cos(angle) * 0.08;
    chain.rotation.x = Math.sin(angle) * 0.08;
    chandelier.add(chain);
  }
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 0.78;
    const z = Math.sin(angle) * 0.78;
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.34, 14), candleWax);
    candle.position.set(x, -0.02, z);
    const wick = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), flame);
    wick.position.set(x, 0.18, z);
    chandelier.add(candle, wick);
  }
  group.add(chandelier);

  for (let i = 0; i < 6; i += 1) {
    const x = -5.15 + i * 2.05;
    const sconceBase = box(0.18, 0.42, 0.08, brass, x, 2.92, -4.02);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, 0.1, 16), brass);
    cup.position.set(x, 2.68, -3.93);
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.34, 14), candleWax);
    candle.position.set(x, 2.82, -3.9);
    const wick = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), flame.clone());
    wick.position.set(x, 3.02, -3.9);
    const lamp = new THREE.PointLight(0xffb46e, 0.56, 2.8);
    lamp.position.set(x, 2.95, -3.6);
    group.add(sconceBase, cup, candle, wick, lamp);
  }

  const addCandleCluster = (x: number, z: number, seed: number) => {
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.31, 0.045, 28), brass);
    tray.position.set(x, 0.18, z);
    tray.userData.roomOneUnrealMirror = true;
    group.add(tray);

    for (let i = 0; i < 3; i += 1) {
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.28 + i * 0.06, 14), candleWax);
      const angle = seed + i * 2.05;
      candle.position.set(x + Math.cos(angle) * 0.13, 0.34 + i * 0.028, z + Math.sin(angle) * 0.11);
      const wick = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), flame.clone());
      wick.position.set(candle.position.x, candle.position.y + 0.18 + i * 0.03, candle.position.z);
      candle.userData.roomOneUnrealMirror = true;
      wick.userData.statusLight = true;
      group.add(candle, wick);
    }

    const glow = new THREE.PointLight(0xffa35b, 0.28, 1.6);
    glow.position.set(x, 0.68, z);
    group.add(glow);
  };

  addCandleCluster(-5.62, 2.6, 0.4);
  addCandleCluster(5.72, 2.48, 1.7);
  addCandleCluster(-5.85, -3.2, 2.4);
  addCandleCluster(5.82, -3.34, 3.1);

  const chandelierLight = new THREE.PointLight(0xffb16a, 2.15, 7.6);
  chandelierLight.position.set(-0.2, 3.74, -0.35);
  chandelierLight.userData.roomOneUnrealMirror = true;
  group.add(chandelierLight);

  const fillLight = new THREE.PointLight(0xad7048, 1.08, 8.7);
  fillLight.position.set(3.7, 2.3, 1.9);
  group.add(fillLight);

  const deskSideFill = new THREE.PointLight(0xffb47a, 0.68, 6.8);
  deskSideFill.position.set(-4.9, 2.05, 2.15);
  group.add(deskSideFill);
}

function addRoomOneReferenceEntryDesk(group: THREE.Group, room: Room) {
  const wood = mat(0x704224, { roughness: 0.5, metalness: 0.04, texture: "wood", textureRepeat: [1.6, 1], textureSeed: 5611 });
  const darkWood = mat(0x24140d, { roughness: 0.64, texture: "wood", textureRepeat: [0.9, 1.4], textureSeed: 5612 });
  const paper = mat(0xf2d9b6, { roughness: 0.86, emissive: 0xffca8f, emissiveIntensity: 0.04, texture: "paper", textureSeed: 5613 });
  const greenMetal = mat(0x27594f, { roughness: 0.36, metalness: 0.2, emissive: 0x0e2b26, emissiveIntensity: 0.16, texture: "metal", textureSeed: 5614 });
  const brass = mat(0xd0a35a, { roughness: 0.26, metalness: 0.58, emissive: 0xff9d3d, emissiveIntensity: 0.12, texture: "metal", textureSeed: 5615 });
  const ink = mat(0x19100c, { roughness: 0.78, texture: "paper", textureSeed: 5616 });
  const velvet = mat(0x612327, { roughness: 0.72, texture: "fabric", textureSeed: 5617 });

  addTexturedWallPanel(group, "room1-message-board", "하영아,", "방탈출을 풀며 우리의 추억을 잘 떠올려봐!!", -5.05, 2.3, -4.1, 1.32, 0.92, 0xffc899, "memory");
  addTexturedWallPanel(group, "room1-rule-board", "규칙 안내", "힌트는 카톡 또는 전화 · 추억을 먼저 관찰하기", -5.05, 1.26, -4.1, 1.18, 0.58, 0xffdd9a, "memory");

  const desk = new THREE.Group();
  desk.position.set(-4.55, 0.76, 1.22);
  desk.rotation.y = -0.08;
  desk.userData.roomOneUnrealMirror = true;
  desk.add(box(2.08, 0.18, 0.88, wood, 0, 0, 0));
  desk.add(box(2.0, 0.08, 0.92, darkWood, 0, -0.13, 0));
  desk.add(box(0.1, 0.82, 0.1, darkWood, -0.86, -0.46, -0.3));
  desk.add(box(0.1, 0.82, 0.1, darkWood, 0.86, -0.46, -0.3));
  desk.add(box(0.1, 0.82, 0.1, darkWood, -0.86, -0.46, 0.3));
  desk.add(box(0.1, 0.82, 0.1, darkWood, 0.86, -0.46, 0.3));

  [-0.48, 0, 0.48].forEach((x) => {
    const drawer = box(0.38, 0.16, 0.08, darkWood, x, -0.02, -0.46);
    const handle = box(0.16, 0.028, 0.035, brass, x, -0.02, -0.51);
    desk.add(drawer, handle);
  });

  const letter = box(0.86, 0.024, 0.56, paper, -0.26, 0.13, -0.04);
  letter.rotation.y = -0.14;
  const foldedNote = box(0.44, 0.018, 0.32, paper, 0.3, 0.15, 0.2);
  foldedNote.rotation.y = 0.34;
  const waxSeal = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.018, 24), mat(0x9e1f22, { roughness: 0.42, emissive: 0x330405, emissiveIntensity: 0.12 }));
  waxSeal.position.set(0.48, 0.18, 0.19);
  waxSeal.rotation.x = Math.PI / 2;
  const pen = box(0.54, 0.018, 0.018, ink, -0.62, 0.18, 0.18);
  pen.rotation.y = -0.62;
  const lock = box(0.4, 0.16, 0.28, brass, 0.7, 0.2, -0.08);
  desk.add(letter, foldedNote, waxSeal, pen, lock);
  group.add(desk);

  const chair = new THREE.Group();
  chair.position.set(-4.52, 0.48, 2.02);
  chair.rotation.y = Math.PI - 0.08;
  chair.add(box(0.78, 0.14, 0.68, darkWood, 0, 0, 0));
  chair.add(box(0.66, 0.12, 0.14, velvet, 0, 0.08, 0.03));
  chair.add(box(0.82, 0.84, 0.12, darkWood, 0, 0.56, 0.36));
  [-0.3, 0.3].forEach((x) => {
    [-0.22, 0.26].forEach((z) => chair.add(box(0.08, 0.54, 0.08, darkWood, x, -0.28, z)));
  });
  group.add(chair);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.3, 20), brass);
  base.position.set(-5.2, 0.96, 1.08);
  const arm = box(0.08, 0.52, 0.08, brass, -5.14, 1.23, 1.08);
  arm.rotation.z = -0.2;
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.3, 28), greenMetal);
  shade.position.set(-5.03, 1.52, 1.02);
  shade.rotation.z = -0.08;
  group.add(shade, base, arm);

  const deskLight = new THREE.PointLight(0xffba70, 1.08, 3.15);
  deskLight.position.set(-5.02, 1.58, 1.02);
  group.add(deskLight);
}

function addRoomOneReferenceMemoryWall(group: THREE.Group, room: Room) {
  const rail = mat(0xc79858, { roughness: 0.3, metalness: 0.5, emissive: 0xff9e43, emissiveIntensity: 0.08, texture: "metal", textureSeed: 5628 });
  const consoleWood = mat(0x4b2a19, { roughness: 0.58, texture: "wood", textureRepeat: [1.3, 0.8], textureSeed: 5629 });
  const velvet = mat(0x26120f, { roughness: 0.76, texture: "fabric", textureSeed: 5630 });
  const exhibits = [
    { key: "jatjeol", title: "첫 고백", caption: "잣절 공원 벤치", color: 0xffd37e, x: -2.86, y: 2.58 },
    { key: "birthday", title: "현수 생일", caption: "하영이가 준 선물", color: 0x9be88a, x: -1.6, y: 2.58 },
    { key: "philippines", title: "필리핀 여행", caption: "함께 본 높은 하늘", color: 0x91d8ff, x: -2.86, y: 1.58 },
    { key: "hundred-day", title: "100일 네 컷", caption: "홍대의 네 장면", color: 0xff92a6, x: -1.6, y: 1.58 },
  ];

  const titlePlate = box(2.82, 0.08, 0.06, rail, -2.23, 3.22, -4.02);
  const lowerRail = box(2.82, 0.06, 0.06, rail, -2.23, 0.98, -4.02);
  group.add(titlePlate, lowerRail);

  exhibits.forEach((exhibit) => {
    addTexturedWallPanel(group, `room1-${exhibit.key}`, exhibit.title, exhibit.caption, exhibit.x, exhibit.y, -4.08, 0.98, 0.66, exhibit.color, exhibit.key === "hundred-day" ? "photoStrip" : "memory");
  });

  const console = new THREE.Group();
  console.position.set(-2.24, 0.62, -2.98);
  console.userData.roomOneUnrealMirror = true;
  console.add(box(2.44, 0.22, 0.68, consoleWood, 0, 0, 0));
  console.add(box(2.32, 0.06, 0.58, velvet, 0, 0.16, 0));
  console.add(box(2.5, 0.08, 0.08, rail, 0, 0.22, -0.35));
  [-0.96, -0.32, 0.32, 0.96].forEach((x) => {
    console.add(box(0.08, 0.54, 0.08, consoleWood, x, -0.34, -0.22));
    console.add(box(0.08, 0.54, 0.08, consoleWood, x, -0.34, 0.22));
  });

  const buttonColors = [0xffd36f, 0x8be883, 0x82cfff, 0xff748b];
  buttonColors.forEach((color, index) => {
    const material = mat(color, { roughness: 0.28, metalness: 0.18, emissive: color, emissiveIntensity: 0.22 });
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.04, 30), rail);
    socket.position.set(-0.66 + index * 0.44, 0.24, 0.02);
    const button = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.072, 30), material);
    button.position.set(socket.position.x, 0.3, socket.position.z);
    button.userData.roomOneUnrealMirror = true;
    button.userData.memoryButton = index;
    console.add(socket, button);
  });

  group.add(console);
}

function addRoomOneReferenceMusicCabinet(group: THREE.Group, room: Room) {
  const wood = mat(0x57321f, { roughness: 0.54, texture: "wood", textureRepeat: [1.1, 0.9], textureSeed: 5621 });
  const glass = mat(0xaee6ff, { roughness: 0.08, metalness: 0.02, emissive: 0x72c9ff, emissiveIntensity: 0.12, transparent: true, opacity: 0.34 });
  const brass = mat(0xd4a459, { roughness: 0.28, metalness: 0.58, emissive: 0xffaa44, emissiveIntensity: 0.16, texture: "metal", textureSeed: 5622 });
  const velvet = mat(0x301215, { roughness: 0.76, emissive: 0x100204, emissiveIntensity: 0.06, texture: "fabric", textureSeed: 5623 });

  const caseGroup = new THREE.Group();
  caseGroup.position.set(0.08, 2.1, -4.05);
  caseGroup.userData.roomOneUnrealMirror = true;
  caseGroup.add(box(0.92, 1.32, 0.1, wood, 0, 0, -0.05));
  caseGroup.add(box(0.74, 1.08, 0.04, velvet, 0, 0, 0));
  caseGroup.add(box(0.66, 0.98, 0.028, glass, 0, 0, 0.055));
  caseGroup.add(box(0.84, 0.06, 0.08, brass, 0, 0.72, 0.02));
  caseGroup.add(box(0.84, 0.06, 0.08, brass, 0, -0.72, 0.02));
  [-0.42, 0.42].forEach((x) => caseGroup.add(box(0.055, 1.42, 0.08, brass, x, 0, 0.02)));
  group.add(caseGroup);
  addMiniViolin(group, 0.04, 2.08, -3.93, 0.86);

  const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 8, 36), brass);
  keyRing.position.set(0.34, 2.53, -3.89);
  keyRing.rotation.z = 0.1;
  const keyStem = box(0.32, 0.025, 0.025, brass, 0.34, 2.31, -3.88);
  keyStem.rotation.z = Math.PI / 2;
  const keyBit = box(0.13, 0.08, 0.025, brass, 0.34, 2.13, -3.88);
  group.add(keyRing, keyStem, keyBit);

  const cabinet = new THREE.Group();
  cabinet.position.set(1.42, 0.7, -2.76);
  cabinet.userData.roomOneUnrealMirror = true;
  cabinet.add(box(1.3, 0.82, 0.64, wood, 0, 0, 0));
  cabinet.add(box(1.18, 0.1, 0.68, brass, 0, 0.5, 0));
  cabinet.add(box(1.14, 0.08, 0.58, velvet, 0, 0.58, 0));
  [-0.36, 0.36].forEach((x) => {
    cabinet.add(box(0.34, 0.24, 0.06, wood, x, 0.04, -0.36));
    cabinet.add(box(0.1, 0.03, 0.035, brass, x, 0.04, -0.41));
  });
  const musicBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.12, 36), brass);
  musicBase.position.set(0, 0.72, -0.02);
  const carousel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.3, 30), mat(0xffb77a, { roughness: 0.34, metalness: 0.06, emissive: 0xff8a3b, emissiveIntensity: 0.16 }));
  carousel.position.set(0, 0.94, -0.02);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.24, 32), brass);
  cap.position.set(0, 1.18, -0.02);
  cabinet.add(musicBase, carousel, cap);
  group.add(cabinet);

  const exhibitLight = new THREE.PointLight(0xffbd7a, 0.42, 2.2);
  exhibitLight.position.set(0.18, 2.62, -3.54);
  group.add(exhibitLight);
}

function addRoomOneReferenceFloorPuzzle(group: THREE.Group, room: Room) {
  const brass = mat(0xc99858, { roughness: 0.34, metalness: 0.48, emissive: 0xff9f3a, emissiveIntensity: 0.08, texture: "metal", textureSeed: 5631 });
  const stoneBase = mat(0x2f2520, { roughness: 0.78, texture: "plaster", textureRepeat: [1.2, 1.2], textureSeed: 5632 });
  const recess = box(2.86, 0.026, 2.86, stoneBase, 0, 0.076, 0.08);
  recess.receiveShadow = true;
  group.add(recess);

  for (let cell = 1; cell <= 9; cell += 1) {
    const row = Math.floor((cell - 1) / 3);
    const col = (cell - 1) % 3;
    const tileMaterial = new THREE.MeshStandardMaterial({
      map: createRoomOneFloorTileTexture(cell, cell === 9),
      roughness: 0.76,
      metalness: 0.04,
      emissive: cell === 9 ? 0x5a260d : 0x080504,
      emissiveIntensity: cell === 9 ? 0.13 : 0.03,
    });
    const tile = box(0.82, 0.032, 0.82, tileMaterial, -0.86 + col * 0.86, 0.108, -0.78 + row * 0.86);
    tile.userData.roomOneUnrealMirror = true;
    tile.userData.floorPuzzleCell = cell;
    const bevel = box(0.86, 0.014, 0.036, brass, tile.position.x, 0.135, tile.position.z - 0.43);
    const bevelB = box(0.86, 0.014, 0.036, brass, tile.position.x, 0.135, tile.position.z + 0.43);
    const bevelL = box(0.036, 0.014, 0.86, brass, tile.position.x - 0.43, 0.135, tile.position.z);
    const bevelR = box(0.036, 0.014, 0.86, brass, tile.position.x + 0.43, 0.135, tile.position.z);
    group.add(tile);
    group.add(bevel, bevelB, bevelL, bevelR);
  }

  const benchWood = mat(0x744422, { roughness: 0.5, texture: "wood", textureSeed: 5633 });
  const paper = mat(0xe8cfaa, { roughness: 0.86, texture: "paper", textureSeed: 5634 });
  const bench = new THREE.Group();
  bench.position.set(0.05, 0.42, 2.08);
  bench.userData.roomOneUnrealMirror = true;
  bench.add(box(1.74, 0.16, 0.62, benchWood, 0, 0, 0));
  bench.add(box(1.58, 0.05, 0.5, brass, 0, 0.1, 0));
  bench.add(box(0.12, 0.5, 0.12, benchWood, -0.66, -0.32, -0.2));
  bench.add(box(0.12, 0.5, 0.12, benchWood, 0.66, -0.32, -0.2));
  bench.add(box(0.12, 0.5, 0.12, benchWood, -0.66, -0.32, 0.2));
  bench.add(box(0.12, 0.5, 0.12, benchWood, 0.66, -0.32, 0.2));
  const clue = box(0.62, 0.022, 0.38, paper, -0.28, 0.14, -0.05);
  clue.rotation.y = -0.2;
  const brassDial = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 32), brass);
  brassDial.position.set(0.48, 0.16, 0.02);
  bench.add(clue, brassDial);
  group.add(bench);
}

function createRoomOneFloorTileTexture(cell: number, active: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Room one floor tile texture context unavailable.");

  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, active ? "#4a2717" : "#c2a780");
  gradient.addColorStop(0.52, active ? "#2b1a12" : "#9f8765");
  gradient.addColorStop(1, active ? "#705034" : "#d4bc91");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 18; i += 1) {
    ctx.strokeStyle = i % 2 ? "#3a2419" : "#fff0c7";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo((i * 37) % 256, 0);
    ctx.lineTo(((i * 37) % 256) - 90, 256);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = active ? "#e4a457" : "#6f4c2c";
  ctx.lineWidth = 14;
  ctx.strokeRect(16, 16, 224, 224);
  ctx.strokeStyle = active ? "#f4d496" : "#e9d3a6";
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, 200, 200);

  ctx.fillStyle = active ? "#ffd48b" : "#3c2a1d";
  ctx.font = "bold 112px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(cell), 128, 136);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function addRoomOneReferenceBeefAndSteak(group: THREE.Group, room: Room) {
  addTexturedWallPanel(group, "room1-amusement-park", "우리의 추억 여행", "다음 방으로 이어지는 놀이공원 그림", 3.92, 2.82, -4.08, 2.42, 0.82, 0xffc276, "vista");
  addTexturedWallPanel(group, "room1-beef-puzzle", "소의 부위 퍼즐", "고기 조각을 올바른 위치에", 3.82, 1.58, -4.06, 2.52, 1.16, 0xffbd7b, "beef");

  const wood = mat(0x563119, { roughness: 0.55, texture: "wood", textureRepeat: [1.3, 0.9], textureSeed: 5641 });
  const darkWood = mat(0x20120c, { roughness: 0.68, texture: "wood", textureSeed: 5642 });
  const plate = mat(0xf2e1c8, { roughness: 0.58, metalness: 0.08 });
  const meat = mat(0xa94232, { roughness: 0.42, emissive: 0x47130d, emissiveIntensity: 0.12, texture: "fabric", textureSeed: 5643 });
  const brass = mat(0xd4a05b, { roughness: 0.28, metalness: 0.56, emissive: 0xffa13c, emissiveIntensity: 0.12, texture: "metal", textureSeed: 5644 });

  const shelf = new THREE.Group();
  shelf.position.set(3.82, 0.66, -3.72);
  shelf.userData.roomOneUnrealMirror = true;
  shelf.add(box(2.58, 0.16, 0.38, wood, 0, 0, 0));
  shelf.add(box(2.46, 0.06, 0.42, brass, 0, 0.14, 0));
  [-0.84, 0, 0.84].forEach((x) => {
    const slot = box(0.54, 0.04, 0.26, darkWood, x, 0.2, 0.02);
    const chunk = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 10), meat.clone());
    chunk.scale.set(1.35, 0.35, 0.8);
    chunk.position.set(x, 0.26, 0.02);
    chunk.rotation.y = x * 0.5;
    shelf.add(slot, chunk);
  });
  group.add(shelf);

  const table = new THREE.Group();
  table.position.set(3.58, 0.56, 1.38);
  table.rotation.y = 0.04;
  table.userData.roomOneUnrealMirror = true;
  table.add(box(2.05, 0.16, 0.92, wood, 0, 0, 0));
  table.add(box(1.94, 0.05, 0.82, brass, 0, 0.11, 0));
  [-0.72, 0.72].forEach((x) => {
    [-0.28, 0.28].forEach((z) => table.add(box(0.1, 0.66, 0.1, wood, x, -0.38, z)));
  });
  [-0.46, 0.46].forEach((x, index) => {
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.29, 0.035, 32), plate);
    dish.position.set(x, 0.14, 0);
    const steak = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 10), meat);
    steak.scale.set(1.25, 0.26, 0.72);
    steak.position.set(x, 0.2, 0.02);
    const flagPole = box(0.026, 0.28, 0.026, brass, x - 0.09, 0.38, -0.2);
    const flag = box(0.18, 0.16, 0.03, brass, x, 0.48, -0.2);
    flag.userData.steakVote = index === 0 ? "A" : "B";
    const knife = box(0.42, 0.018, 0.026, brass, x + (index === 0 ? -0.28 : 0.28), 0.18, 0.33);
    knife.rotation.y = index === 0 ? 0.28 : -0.28;
    table.add(dish, steak, flagPole, flag, knife);
  });
  const smallCandle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.28, 14), mat(0xffead5, { roughness: 0.72, emissive: 0xffb46e, emissiveIntensity: 0.06 }));
  smallCandle.position.set(0, 0.3, -0.32);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), mat(0xffb35d, { emissive: 0xff9a2f, emissiveIntensity: 0.9, transparent: true, opacity: 0.9 }));
  flame.position.set(0, 0.48, -0.32);
  table.add(smallCandle, flame);
  group.add(table);

  const tableLight = new THREE.PointLight(0xff9d54, 0.34, 2);
  tableLight.position.set(3.56, 1.05, 1.02);
  group.add(tableLight);
}

function addRoomOneReferenceExitDoor(group: THREE.Group, room: Room) {
  const doorMat = mat(0x4a2919, { roughness: 0.54, metalness: 0.06, texture: "wood", textureRepeat: [1.1, 2.2], textureSeed: 5651 });
  const darkWood = mat(0x1e120c, { roughness: 0.72, texture: "wood", textureSeed: 5652 });
  const stone = mat(0x605247, { roughness: 0.86, metalness: 0.02, texture: "plaster", textureRepeat: [1.1, 1.5], textureSeed: 5653 });
  const brass = mat(0xd2a15a, { roughness: 0.3, metalness: 0.55, emissive: 0xffa344, emissiveIntensity: 0.1, texture: "metal", textureSeed: 5654 });
  const warmEdge = mat(0xffbd73, { roughness: 0.3, metalness: 0.18, emissive: 0xff9f32, emissiveIntensity: 0.24, transparent: true, opacity: 0.72 });

  const doorGroup = new THREE.Group();
  doorGroup.userData.roomOneUnrealMirror = true;
  const door = box(0.12, 1.86, 1.04, doorMat, 6.33, 1.16, -1.94);
  door.castShadow = true;
  doorGroup.add(door);

  [-0.34, 0, 0.34].forEach((offset) => {
    doorGroup.add(box(0.135, 1.72, 0.035, darkWood, 6.25, 1.15, -1.94 + offset));
  });
  doorGroup.add(box(0.15, 0.08, 0.94, brass, 6.24, 1.86, -1.94));
  doorGroup.add(box(0.15, 0.08, 0.94, brass, 6.24, 0.54, -1.94));

  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), brass);
  handle.position.set(6.18, 1.12, -1.56);
  doorGroup.add(handle);

  const leftJamb = box(0.22, 2.04, 0.18, stone, 6.22, 1.25, -2.58);
  const rightJamb = box(0.22, 2.04, 0.18, stone, 6.22, 1.25, -1.3);
  const lintel = box(0.22, 0.18, 1.45, stone, 6.22, 2.25, -1.94);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.052, 8, 44, Math.PI), stone);
  arch.position.set(6.2, 2.22, -1.94);
  arch.rotation.set(0, Math.PI / 2, Math.PI);
  doorGroup.add(leftJamb, rightJamb, lintel, arch);

  const seamLight = box(0.024, 1.54, 0.04, warmEdge, 6.14, 1.16, -1.36);
  seamLight.userData.statusLight = true;
  doorGroup.add(seamLight);
  group.add(doorGroup);

  const exitLight = new THREE.PointLight(0xffae6e, 0.58, 3.1);
  exitLight.position.set(5.9, 1.9, -1.9);
  group.add(exitLight);
}

function addTexturedWallPanel(
  group: THREE.Group,
  key: string,
  title: string,
  caption: string,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  accent: number,
  kind: "memory" | "beef" | "vista" | "photoStrip",
) {
  const frameMaterial = mat(0x49301f, { roughness: 0.5, metalness: 0.08, texture: "wood", textureSeed: width * 100 + height * 10 });
  const texture = createRoomOneMemoryTexture(key, title, caption, accent, kind);
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.72, metalness: 0.02, emissive: accent, emissiveIntensity: 0.06 });
  const frame = box(width + 0.14, height + 0.14, 0.08, frameMaterial, x, y, z - 0.04);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  plane.position.set(x, y, z + 0.015);
  plane.userData.roomOneUnrealMirror = true;
  frame.userData.roomOneUnrealMirror = true;
  group.add(frame, plane);
}

function addMiniViolin(group: THREE.Group, x: number, y: number, z: number, scale: number) {
  const body = mat(0xa65a2e, { roughness: 0.34, metalness: 0.08, emissive: 0x3a150a, emissiveIntensity: 0.1, texture: "wood", textureSeed: 5661 });
  const dark = mat(0x12100e, { roughness: 0.42, metalness: 0.32 });
  const stringMaterial = mat(0xead6a5, { roughness: 0.2, metalness: 0.58, emissive: 0xffc56f, emissiveIntensity: 0.12 });
  const violin = new THREE.Group();
  violin.position.set(x, y, z);
  violin.scale.setScalar(scale);
  violin.rotation.z = -0.12;
  violin.userData.roomOneUnrealMirror = true;
  const lower = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 10), body);
  lower.scale.set(1.15, 0.7, 0.26);
  const upper = lower.clone();
  upper.scale.set(0.9, 0.55, 0.22);
  upper.position.y = 0.22;
  violin.add(lower, upper, box(0.08, 0.52, 0.045, dark, 0, 0.52, 0.02), box(0.22, 0.035, 0.035, stringMaterial, 0, 0.12, 0.07));
  for (let i = 0; i < 4; i += 1) {
    violin.add(box(0.01, 0.78, 0.01, stringMaterial, -0.036 + i * 0.024, 0.24, 0.09));
  }
  group.add(violin);
}

function addRoomOneParkConfessionSet(group: THREE.Group, room: Room) {
  const bark = mat(0x5d3928, { roughness: 0.72, texture: "wood", textureRepeat: [1, 2.6], textureSeed: 5101 });
  const leaf = mat(0x365b38, { roughness: 0.82, emissive: 0x122614, emissiveIntensity: 0.08, texture: "fabric", textureSeed: 5102 });
  const benchWood = mat(0x5a3625, { roughness: 0.58, metalness: 0.04, texture: "wood", textureRepeat: [1.2, 1], textureSeed: 5103 });
  const benchIron = mat(0x171719, { roughness: 0.42, metalness: 0.45, emissive: 0x24170f, emissiveIntensity: 0.08, texture: "metal", textureSeed: 5104 });
  const warmHalo = mat(room.palette[1], { roughness: 0.2, metalness: 0.05, emissive: room.palette[1], emissiveIntensity: 0.45, transparent: true, opacity: 0.34 });

  const hedge = box(2.65, 0.92, 0.32, leaf, -4.52, 0.86, -3.92);
  hedge.userData.roomOneUnrealMirror = true;
  group.add(hedge);

  for (let i = 0; i < 3; i += 1) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 + i * 0.015, 0.13 + i * 0.02, 1.65 + i * 0.18, 10), bark);
    trunk.position.set(-5.44 + i * 0.72, 1.0 + i * 0.05, -3.83 - i * 0.08);
    trunk.rotation.z = -0.08 + i * 0.07;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    trunk.userData.roomOneUnrealMirror = true;

    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.46 + i * 0.06, 18, 12), leaf);
    crown.position.set(trunk.position.x + 0.06, trunk.position.y + 0.95, trunk.position.z + 0.02);
    crown.scale.set(1.18, 0.74, 0.52);
    crown.castShadow = true;
    crown.userData.roomOneUnrealMirror = true;
    group.add(trunk, crown);
  }

  const bench = new THREE.Group();
  bench.position.set(-4.28, 0.58, -2.68);
  bench.rotation.y = 0.18;
  bench.userData.roomOneUnrealMirror = true;
  const seat = box(1.75, 0.14, 0.42, benchWood, 0, 0, 0);
  const back = box(1.82, 0.12, 0.38, benchWood, 0, 0.46, -0.22);
  back.rotation.x = -0.18;
  const leftArm = box(0.08, 0.45, 0.48, benchIron, -0.98, 0.18, -0.02);
  const rightArm = box(0.08, 0.45, 0.48, benchIron, 0.98, 0.18, -0.02);
  const leftLeg = box(0.08, 0.46, 0.08, benchIron, -0.72, -0.28, 0.08);
  const rightLeg = box(0.08, 0.46, 0.08, benchIron, 0.72, -0.28, 0.08);
  bench.add(seat, back, leftArm, rightArm, leftLeg, rightLeg);
  group.add(bench);

  const memoryGlow = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.64, 0.018, 48), warmHalo);
  memoryGlow.position.set(-4.2, 0.18, -2.68);
  memoryGlow.scale.set(1, 1, 0.62);
  memoryGlow.userData.roomOneUnrealMirror = true;
  group.add(memoryGlow);

  const lamp = new THREE.PointLight(room.palette[1], 1.9, 4.6);
  lamp.position.set(-4.12, 2.25, -2.46);
  lamp.userData.roomOneUnrealMirror = true;
  group.add(lamp);
}

function addRoomOneBirthdayGiftTable(group: THREE.Group, room: Room) {
  const wood = mat(0x815332, { roughness: 0.48, metalness: 0.08, texture: "wood", textureRepeat: [1.5, 0.8], textureSeed: 5201 });
  const bag = mat(0xe9f4ff, { roughness: 0.64, emissive: 0x9bd8ff, emissiveIntensity: 0.06, texture: "paper", textureSeed: 5202 });
  const greenWrap = mat(0x77c747, { roughness: 0.58, emissive: 0x275d22, emissiveIntensity: 0.06, texture: "paper", textureSeed: 5203 });
  const pinkWrap = mat(0xe898c8, { roughness: 0.56, emissive: 0x5d2446, emissiveIntensity: 0.08, texture: "paper", textureSeed: 5204 });
  const ribbon = mat(room.palette[2], { roughness: 0.3, metalness: 0.12, emissive: room.palette[2], emissiveIntensity: 0.28 });
  const envelope = mat(0xfff3df, { roughness: 0.82, emissive: 0xffd8a1, emissiveIntensity: 0.06, texture: "paper", textureSeed: 5205 });
  const blackBox = mat(0x161413, { roughness: 0.36, metalness: 0.08, emissive: 0x2b1d14, emissiveIntensity: 0.1, texture: "metal", textureSeed: 5206 });

  const table = new THREE.Group();
  table.position.set(-2.76, 0.72, 1.24);
  table.rotation.y = 0.14;
  table.userData.roomOneUnrealMirror = true;
  table.add(box(2.52, 0.16, 1.08, wood, 0, 0, 0));
  table.add(box(0.1, 0.8, 0.1, wood, -1.06, -0.46, -0.36));
  table.add(box(0.1, 0.8, 0.1, wood, 1.06, -0.46, -0.36));
  table.add(box(0.1, 0.8, 0.1, wood, -1.06, -0.46, 0.36));
  table.add(box(0.1, 0.8, 0.1, wood, 1.06, -0.46, 0.36));

  const giftBag = box(0.62, 0.58, 0.16, bag, 0.62, 0.38, -0.12);
  const bagHandleLeft = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 8, 28), ribbon);
  const bagHandleRight = bagHandleLeft.clone();
  bagHandleLeft.position.set(0.48, 0.71, -0.03);
  bagHandleRight.position.set(0.76, 0.71, -0.03);
  bagHandleLeft.scale.set(0.78, 1.08, 1);
  bagHandleRight.scale.set(0.78, 1.08, 1);

  const greenGift = box(0.48, 0.46, 0.46, greenWrap, -0.56, 0.34, -0.12);
  const pinkGift = box(0.72, 0.34, 0.44, pinkWrap, -0.1, 0.28, 0.22);
  const blackCase = box(1.16, 0.16, 0.2, blackBox, 0.12, 0.16, -0.42);
  const letter = box(0.76, 0.035, 0.48, envelope, -0.72, 0.13, 0.32);
  letter.rotation.y = 0.14;
  const waxSeal = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.018, 24), ribbon);
  waxSeal.position.set(-0.64, 0.165, 0.36);
  waxSeal.rotation.x = Math.PI / 2;
  table.add(giftBag, bagHandleLeft, bagHandleRight, greenGift, pinkGift, blackCase, letter, waxSeal);
  group.add(table);

  const giftLight = new THREE.PointLight(room.palette[2], 1.35, 3.6);
  giftLight.position.set(-0.1, 1.72, 1.15);
  giftLight.userData.roomOneUnrealMirror = true;
  group.add(giftLight);
}

function addRoomOneViolinKeyring(group: THREE.Group, room: Room) {
  const bodyMaterial = mat(0xa75b2a, { roughness: 0.34, metalness: 0.12, emissive: 0x4f210f, emissiveIntensity: 0.12, texture: "wood", textureSeed: 5301 });
  const black = mat(0x101010, { roughness: 0.36, metalness: 0.32, texture: "metal", textureSeed: 5302 });
  const stringMaterial = mat(0xe9d7b8, { roughness: 0.18, metalness: 0.62, emissive: room.palette[1], emissiveIntensity: 0.12 });
  const brass = mat(0xb89442, { roughness: 0.28, metalness: 0.66, emissive: room.palette[1], emissiveIntensity: 0.18, texture: "metal", textureSeed: 5303 });

  const violin = new THREE.Group();
  violin.position.set(-2.48, 1.04, 0.9);
  violin.rotation.set(-0.55, -0.52, 0.08);
  violin.scale.setScalar(0.9);
  violin.userData.roomOneUnrealMirror = true;

  const lowerBody = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 12), bodyMaterial);
  lowerBody.scale.set(1.18, 0.64, 0.28);
  lowerBody.position.set(0, 0, 0);
  const upperBody = lowerBody.clone();
  upperBody.scale.set(0.92, 0.48, 0.24);
  upperBody.position.set(0, 0.28, 0);
  const waist = box(0.19, 0.24, 0.045, bodyMaterial, 0, 0.13, 0.012);
  const neck = box(0.08, 0.56, 0.05, black, 0, 0.64, 0.018);
  const bridge = box(0.26, 0.035, 0.04, stringMaterial, 0, 0.18, 0.055);
  const tail = box(0.17, 0.12, 0.055, black, 0, -0.18, 0.04);
  violin.add(lowerBody, upperBody, waist, neck, bridge, tail);

  for (let i = 0; i < 4; i += 1) {
    const string = box(0.012, 0.92, 0.012, stringMaterial, -0.045 + i * 0.03, 0.28, 0.078);
    string.rotation.z = -0.025 + i * 0.016;
    violin.add(string);
  }

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.015, 8, 36), brass);
  ring.position.set(-0.42, 0.28, 0);
  ring.rotation.z = Math.PI / 2.2;
  const chain = box(0.28, 0.018, 0.018, brass, -0.24, 0.2, 0.01);
  chain.rotation.z = -0.45;
  const note = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.01, 8, 22), brass);
  note.position.set(-0.27, -0.05, 0.02);
  note.scale.set(0.8, 1.35, 1);
  const noteStem = box(0.018, 0.18, 0.018, brass, -0.22, 0.045, 0.02);
  violin.add(ring, chain, note, noteStem);
  group.add(violin);
}

function addRoomOneMemoryInstallations(group: THREE.Group, room: Room) {
  const frame = mat(0x6b4934, { roughness: 0.42, metalness: 0.14, texture: "wood", textureSeed: 5401 });
  const brass = mat(room.palette[1], { roughness: 0.28, metalness: 0.42, emissive: room.palette[1], emissiveIntensity: 0.18, texture: "metal", textureSeed: 5402 });
  const exhibits = [
    { key: "park", title: "잣절공원 고백", caption: "벤치와 가로등 아래 첫 마음", color: 0xffd88a, x: -2.72, y: 2.48, z: -4.38, width: 1.18, height: 0.78 },
    { key: "philippines", title: "필리핀 전망", caption: "하늘과 능선, 장난스러운 손길", color: 0x8fd7ff, x: -1.16, y: 2.48, z: -4.38, width: 1.18, height: 0.78 },
    { key: "photo-strip", title: "100일 네 컷", caption: "검은 프레임 속 네 번의 표정", color: 0xff8ea4, x: 0.4, y: 2.48, z: -4.38, width: 1.18, height: 0.78 },
  ];

  exhibits.forEach((exhibit, exhibitIndex) => {
    const frameMesh = box(exhibit.width + 0.16, exhibit.height + 0.16, 0.07, frame, exhibit.x, exhibit.y, exhibit.z - 0.018);
    const texture = createRoomOneMemoryTexture(exhibit.key, exhibit.title, exhibit.caption, exhibit.color, exhibit.key === "photo-strip" ? "photoStrip" : "memory");
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.78,
      metalness: 0.02,
      emissive: exhibit.color,
      emissiveIntensity: 0.08,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(exhibit.width, exhibit.height), material);
    plane.position.set(exhibit.x, exhibit.y, exhibit.z + 0.035);
    plane.castShadow = true;
    plane.userData.roomOneUnrealMirror = true;
    frameMesh.userData.roomOneUnrealMirror = true;
    group.add(frameMesh, plane);

    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 8), brass);
    pin.position.set(exhibit.x - 0.42 + exhibitIndex * 0.06, exhibit.y + 0.32, exhibit.z + 0.075);
    pin.userData.roomOneUnrealMirror = true;
    group.add(pin);
  });

  const vistaTexture = createRoomOneMemoryTexture("philippines-large-vista", "필리핀의 높은 하늘", "창밖으로 이어지는 다음 단서", 0x8fd7ff, "vista");
  const vistaMaterial = new THREE.MeshStandardMaterial({ map: vistaTexture, roughness: 0.72, emissive: 0x427a96, emissiveIntensity: 0.12 });
  const vista = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 0.9), vistaMaterial);
  vista.position.set(5.88, 2.32, -2.24);
  vista.rotation.y = -Math.PI / 2;
  vista.userData.roomOneUnrealMirror = true;
  group.add(vista);
}

function addRoomOneBeefPuzzleWall(group: THREE.Group, room: Room) {
  const boardMaterial = mat(0x2f2218, { roughness: 0.72, metalness: 0.08, emissive: 0x1a100a, emissiveIntensity: 0.08, texture: "wood", textureRepeat: [1.2, 0.8], textureSeed: 5501 });
  const trimMaterial = mat(room.palette[1], { roughness: 0.32, metalness: 0.48, emissive: room.palette[1], emissiveIntensity: 0.18, texture: "metal", textureSeed: 5502 });
  const magnetMaterial = mat(0xff7d8e, { roughness: 0.36, metalness: 0.18, emissive: 0xff7d8e, emissiveIntensity: 0.24 });
  const texture = createRoomOneMemoryTexture("beef-cuts-wall", "고기 부위 맞추기", "힌트: 100일의 기억은 윗등 쪽, 목심과 등심 사이", 0xffc36f, "beef");
  const puzzleMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.76, metalness: 0.02, emissive: 0xffc36f, emissiveIntensity: 0.07 });

  const board = box(3.36, 2.24, 0.08, boardMaterial, 2.92, 2.22, -4.37);
  board.userData.roomOneUnrealMirror = true;
  const puzzle = new THREE.Mesh(new THREE.PlaneGeometry(3.06, 1.94), puzzleMaterial);
  puzzle.position.set(2.92, 2.24, -4.315);
  puzzle.userData.roomOneUnrealMirror = true;
  group.add(board, puzzle);

  const topTrim = box(3.48, 0.045, 0.1, trimMaterial, 2.92, 3.38, -4.3);
  const bottomTrim = box(3.48, 0.045, 0.1, trimMaterial, 2.92, 1.06, -4.3);
  const leftTrim = box(0.045, 2.28, 0.1, trimMaterial, 1.16, 2.22, -4.3);
  const rightTrim = box(0.045, 2.28, 0.1, trimMaterial, 4.68, 2.22, -4.3);
  [topTrim, bottomTrim, leftTrim, rightTrim].forEach((trim) => {
    trim.userData.roomOneUnrealMirror = true;
    group.add(trim);
  });

  const slots = [
    [1.82, 1.21],
    [2.22, 1.14],
    [2.62, 1.18],
    [3.02, 1.12],
    [3.42, 1.2],
    [3.82, 1.15],
  ];
  slots.forEach(([x, y], slotIndex) => {
    const magnet = box(0.23, 0.12, 0.045, magnetMaterial.clone(), x, y, -4.24);
    magnet.rotation.z = -0.08 + slotIndex * 0.035;
    magnet.userData.roomOneUnrealMirror = true;
    magnet.userData.beefPuzzlePiece = true;
    group.add(magnet);
  });

  const focusLight = new THREE.PointLight(0xffc36f, 1.95, 5.4);
  focusLight.position.set(2.92, 2.66, -3.18);
  focusLight.userData.roomOneUnrealMirror = true;
  group.add(focusLight);
}

function addRoomOneUnrealMarkerLights(group: THREE.Group, room: Room) {
  const markerMaterial = mat(0xc99858, { roughness: 0.32, metalness: 0.52, emissive: 0xffa13c, emissiveIntensity: 0.1, transparent: true, opacity: 0.76, texture: "metal", textureSeed: 5671 });
  const emberMaterial = mat(0xffb36a, { roughness: 0.26, metalness: 0.08, emissive: 0xff8a2f, emissiveIntensity: 0.62, transparent: true, opacity: 0.8 });
  const labels = [
    [-4.2, -2.68],
    [-0.12, 1.05],
    [2.92, -3.18],
    [5.78, -2.24],
  ];
  labels.forEach(([x, z], index) => {
    const plaque = new THREE.Mesh(new THREE.CylinderGeometry(0.16 + index * 0.006, 0.17 + index * 0.006, 0.022, 36), markerMaterial.clone());
    plaque.position.set(x, 0.145, z);
    plaque.scale.set(1.24, 0.7, 1);
    plaque.userData.roomOneUnrealMirror = true;

    const inset = new THREE.Mesh(new THREE.TorusGeometry(0.12 + index * 0.004, 0.008, 8, 36), markerMaterial.clone());
    inset.position.set(x, 0.163, z);
    inset.rotation.x = Math.PI / 2;
    inset.scale.set(1.2, 0.7, 1);
    inset.userData.roomOneUnrealMirror = true;

    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), emberMaterial.clone());
    ember.position.set(x, 0.22, z);
    ember.userData.statusLight = true;
    ember.userData.roomOneUnrealMirror = true;
    group.add(plaque, inset, ember);
  });
}

function createRoomOneMemoryTexture(key: string, title: string, caption: string, accent: number, kind: "memory" | "beef" | "vista" | "photoStrip") {
  const cacheKey = `room-one-${key}-${kind}`;
  const cached = memoryTextureCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.Texture();
  }

  const accentColor = new THREE.Color(accent);
  const accentStyle = `#${accentColor.getHexString()}`;
  const baseGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  baseGradient.addColorStop(0, "#fff8ec");
  baseGradient.addColorStop(0.54, "#f2dcc2");
  baseGradient.addColorStop(1, "#30241c");
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(26, 16, 10, 0.12)";
  for (let i = 0; i < 34; i += 1) {
    const x = (i * 97) % canvas.width;
    const y = (i * 53) % canvas.height;
    ctx.fillRect(x, y, 2 + (i % 5), 18 + (i % 7) * 8);
  }

  if (kind === "beef") {
    drawBeefPuzzleTexture(ctx, accentStyle);
  } else if (kind === "vista") {
    drawVistaTexture(ctx, accentStyle);
  } else if (kind === "photoStrip") {
    drawPhotoStripTexture(ctx, accentStyle);
  } else {
    drawMemoryPosterTexture(ctx, accentStyle, key);
  }

  ctx.fillStyle = "rgba(34, 23, 18, 0.9)";
  ctx.font = "700 56px system-ui, sans-serif";
  ctx.fillText(title, 70, 550);
  ctx.font = "500 31px system-ui, sans-serif";
  ctx.fillStyle = "rgba(34, 23, 18, 0.72)";
  ctx.fillText(caption, 72, 596);
  ctx.fillStyle = accentStyle;
  ctx.fillRect(70, 496, 260, 7);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  memoryTextureCache.set(cacheKey, texture);
  return texture;
}

function drawMemoryPosterTexture(ctx: CanvasRenderingContext2D, accentStyle: string, key: string) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  ctx.fillRect(70, 58, 884, 382);
  ctx.strokeStyle = "rgba(86, 55, 35, 0.72)";
  ctx.lineWidth = 10;
  ctx.strokeRect(70, 58, 884, 382);
  ctx.fillStyle = accentStyle;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(86, 74, 852, 350);
  ctx.globalAlpha = 1;

  if (key === "park") {
    ctx.fillStyle = "#355334";
    ctx.fillRect(84, 292, 856, 132);
    ctx.fillStyle = "#5b3928";
    ctx.fillRect(280, 256, 360, 34);
    ctx.fillRect(314, 290, 34, 86);
    ctx.fillRect(572, 290, 34, 86);
    ctx.fillStyle = "rgba(255, 221, 164, 0.78)";
    ctx.beginPath();
    ctx.arc(712, 124, 45, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "rgba(35, 54, 75, 0.72)";
    ctx.beginPath();
    ctx.moveTo(90, 352);
    ctx.lineTo(240, 210);
    ctx.lineTo(390, 352);
    ctx.lineTo(520, 236);
    ctx.lineTo(820, 352);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
    ctx.beginPath();
    ctx.arc(250, 132, 36, 0, Math.PI * 2);
    ctx.arc(296, 134, 26, 0, Math.PI * 2);
    ctx.arc(336, 126, 32, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawVistaTexture(ctx: CanvasRenderingContext2D, accentStyle: string) {
  const sky = ctx.createLinearGradient(0, 50, 0, 430);
  sky.addColorStop(0, "#a9ddff");
  sky.addColorStop(0.6, "#f7fbff");
  sky.addColorStop(1, "#8ebf72");
  ctx.fillStyle = sky;
  ctx.fillRect(70, 58, 884, 382);
  ctx.fillStyle = "rgba(255, 255, 255, 0.84)";
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.ellipse(210 + i * 108, 134 + (i % 2) * 24, 70, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(38, 97, 74, 0.72)";
  ctx.beginPath();
  ctx.moveTo(70, 408);
  ctx.lineTo(180, 284);
  ctx.lineTo(340, 402);
  ctx.lineTo(510, 252);
  ctx.lineTo(750, 404);
  ctx.lineTo(954, 312);
  ctx.lineTo(954, 440);
  ctx.lineTo(70, 440);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = accentStyle;
  ctx.lineWidth = 7;
  ctx.strokeRect(70, 58, 884, 382);
}

function drawPhotoStripTexture(ctx: CanvasRenderingContext2D, accentStyle: string) {
  ctx.fillStyle = "#101010";
  ctx.fillRect(134, 58, 756, 382);
  ctx.fillStyle = "#f8f3e8";
  const cells = [
    [164, 88],
    [520, 88],
    [164, 260],
    [520, 260],
  ];
  cells.forEach(([x, y], index) => {
    ctx.fillRect(x, y, 300, 132);
    ctx.fillStyle = index % 2 === 0 ? "rgba(255, 126, 145, 0.26)" : "rgba(143, 215, 255, 0.28)";
    ctx.fillRect(x + 16, y + 16, 268, 100);
    ctx.fillStyle = "#f8f3e8";
  });
  ctx.fillStyle = accentStyle;
  ctx.font = "700 36px Georgia, serif";
  ctx.fillText("Mono mansion", 360, 50);
}

function drawBeefPuzzleTexture(ctx: CanvasRenderingContext2D, accentStyle: string) {
  ctx.fillStyle = "rgba(255, 250, 242, 0.82)";
  ctx.fillRect(60, 48, 904, 410);
  ctx.strokeStyle = "#8c5d2a";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.ellipse(514, 260, 300, 126, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(236, 220, 90, 65, -0.18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(792, 268);
  ctx.lineTo(930, 346);
  ctx.lineTo(816, 358);
  ctx.closePath();
  ctx.stroke();

  const segmentColors = ["#f0a7a7", "#f7c689", "#c8d7f7", "#ceb2e8", "#a7dddf", "#f5e58c", "#b6d7a8", "#ffb39c"];
  segmentColors.forEach((color, index) => {
    const x = 330 + (index % 4) * 126;
    const y = 164 + Math.floor(index / 4) * 88;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 104, 64);
    ctx.strokeStyle = "rgba(255,255,255,0.82)";
    ctx.lineWidth = 5;
    ctx.strokeRect(x, y, 104, 64);
  });

  ctx.fillStyle = accentStyle;
  ctx.font = "800 30px system-ui, sans-serif";
  ctx.fillText("윗등 쪽", 390, 146);
  ctx.fillText("목심", 244, 314);
  ctx.fillText("등심", 516, 314);
}

function addCafeTable(group: THREE.Group, room: Room) {
  const tableMat = mat(0x5e432f, { roughness: 0.58 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.12, 36), tableMat);
  top.position.set(-3.7, 0.78, 1.0);
  top.castShadow = true;
  group.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 18), tableMat);
  leg.position.set(-3.7, 0.2, 1.0);
  group.add(leg);
  [-0.38, 0.38].forEach((x) => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.26, 20), mat(room.palette[2], { roughness: 0.32, metalness: 0.04 }));
    cup.position.set(-3.7 + x, 0.97, 1.0);
    cup.castShadow = true;
    group.add(cup);
  });
}

function addPendantLights(group: THREE.Group, room: Room, count: number) {
  for (let i = 0; i < count; i += 1) {
    const x = -2 + i * 2;
    const cord = box(0.025, 1.3, 0.025, mat(0x171717, { roughness: 0.5 }), x, 4.35, -0.2);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.52, 0.35, 24), mat(room.palette[1], { roughness: 0.44, emissive: room.palette[1], emissiveIntensity: 0.25 }));
    shade.position.set(x, 3.55, -0.2);
    const light = new THREE.PointLight(room.palette[1], 1.3, 5);
    light.position.set(x, 3.38, -0.2);
    group.add(cord, shade, light);
  }
}

function addCracks(group: THREE.Group, room: Room) {
  const crackMat = mat(0x101014, { roughness: 0.9, emissive: room.palette[2], emissiveIntensity: 0.12 });
  for (let i = 0; i < 16; i += 1) {
    const crack = box(0.035, 0.9 + (i % 4) * 0.18, 0.035, crackMat, -5.8 + i * 0.72, 2.9 + Math.sin(i) * 0.7, -4.26);
    crack.rotation.z = Math.sin(i * 2.3) * 0.9;
    group.add(crack);
  }
}

function addRainStreaks(group: THREE.Group, room: Room, count: number) {
  const rainMaterial = mat(room.palette[2], { roughness: 0.4, emissive: 0x5c88ff, emissiveIntensity: 0.48, transparent: true, opacity: 0.7 });
  for (let i = 0; i < count; i += 1) {
    const drop = box(0.018, 0.65 + (i % 5) * 0.08, 0.018, rainMaterial, -6.6 + ((i * 31) % 130) / 10, 1.1 + ((i * 13) % 38) / 10, -4.12);
    drop.rotation.z = -0.18;
    group.add(drop);
  }
}

function addCityWindow(group: THREE.Group, room: Room) {
  const glass = mat(0x101827, { roughness: 0.16, metalness: 0.2, emissive: 0x172846, emissiveIntensity: 0.4 });
  const panel = box(2.6, 1.65, 0.08, glass, -4.95, 2.75, -4.35);
  group.add(panel);
  for (let i = 0; i < 14; i += 1) {
    const light = box(0.08, 0.18, 0.04, mat(i % 2 ? room.palette[1] : room.palette[2], { emissive: i % 2 ? room.palette[1] : room.palette[2], emissiveIntensity: 1.1 }), -6.0 + (i % 7) * 0.34, 2.35 + Math.floor(i / 7) * 0.55, -4.27);
    group.add(light);
  }
}

function addPaperTrail(group: THREE.Group, count: number) {
  const paper = mat(0xf3e1c2, { roughness: 0.9 });
  for (let i = 0; i < count; i += 1) {
    const sheet = box(0.38, 0.02, 0.28, paper, -5.4 + ((i * 29) % 104) / 10, 0.12, -3.2 + ((i * 43) % 66) / 10);
    sheet.rotation.y = Math.sin(i) * 1.4;
    sheet.rotation.z = Math.cos(i * 1.7) * 0.2;
    group.add(sheet);
  }
}

function addHeavenPath(group: THREE.Group, room: Room) {
  const cloudMat = mat(0xffffff, { roughness: 0.82, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 28; i += 1) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.55 + ((i * 17) % 9) / 30, 18, 12), cloudMat);
    cloud.position.set(-5.8 + ((i * 23) % 116) / 10, 0.16 + Math.sin(i) * 0.08, -3.45 + i * 0.23);
    cloud.scale.set(1.8, 0.34, 0.86);
    cloud.userData.cloud = true;
    group.add(cloud);
  }
  addCurtainWindow(group, room, 0, 3.0, -4.34);
}

function addFinalMemoryCorridor(group: THREE.Group, room: Room) {
  const gold = mat(0xecc77a, { roughness: 0.28, metalness: 0.62, emissive: 0xffcf7c, emissiveIntensity: 0.16, texture: "metal", textureSeed: 840 });
  const pearl = mat(0xfaf8ee, { roughness: 0.5, metalness: 0.08, emissive: 0xfff0c4, emissiveIntensity: 0.22, texture: "paper", textureSeed: 841 });
  const glass = mat(0x8fc7ff, { roughness: 0.18, metalness: 0.12, emissive: 0xbcdcff, emissiveIntensity: 0.24, transparent: true, opacity: 0.58 });
  const labelMat = mat(0xfff1cf, { roughness: 0.38, emissive: 0xffda8d, emissiveIntensity: 0.26 });
  const cloudMat = mat(0xffffff, { roughness: 0.86, transparent: true, opacity: 0.84 });

  for (let i = 0; i < 10; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const pairIndex = Math.floor(i / 2);
    const z = -2.9 + pairIndex * 1.12;
    const x = side * (3.25 + (pairIndex % 2) * 0.24);
    const y = 1.75 + (i % 3) * 0.12;
    const frame = box(0.92, 0.68, 0.08, gold, x, y, z);
    const slot = memorySlots[i % memorySlots.length];
    const photo = box(0.76, 0.52, 0.09, createMemoryPhotoMaterial(slot, i), x, y, z + 0.055);
    const shine = box(0.72, 0.04, 0.095, labelMat, x, y - 0.35, z + 0.065);
    frame.rotation.y = side < 0 ? 0.38 : -0.38;
    photo.rotation.copy(frame.rotation);
    shine.rotation.copy(frame.rotation);
    photo.userData.statusLight = true;
    group.add(frame, photo, shine);
  }

  for (let i = 0; i < 9; i += 1) {
    const pad = new THREE.Mesh(new THREE.SphereGeometry(0.42 + (i % 3) * 0.08, 18, 12), cloudMat);
    pad.position.set(-2.6 + i * 0.65, 0.18 + Math.sin(i) * 0.04, -2.9 + i * 0.58);
    pad.scale.set(1.65, 0.28, 0.72);
    pad.userData.cloud = true;
    group.add(pad);
  }

  const gateLeft = box(0.16, 2.6, 0.12, gold, -1.18, 2.02, -4.05);
  const gateRight = box(0.16, 2.6, 0.12, gold, 1.18, 2.02, -4.05);
  const gateTop = box(2.54, 0.16, 0.12, gold, 0, 3.28, -4.05);
  const gateCore = box(1.86, 2.08, 0.08, glass, 0, 2.1, -4.0);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.035, 10, 76), labelMat);
  halo.position.set(0, 2.36, -3.92);
  halo.rotation.x = Math.PI / 2;
  halo.userData.statusLight = true;
  const title = box(1.35, 0.055, 0.06, labelMat, 0, 3.58, -3.85);
  title.userData.statusLight = true;
  group.add(gateLeft, gateRight, gateTop, gateCore, halo, title);

  const heavenlyKeyLight = new THREE.PointLight(room.palette[1], 1.8, 8.5);
  heavenlyKeyLight.position.set(0, 2.45, -3.1);
  group.add(heavenlyKeyLight);
}

function createMemoryPhotoMaterial(slot: MemorySlot, index: number) {
  const texture = getMemoryTexture(slot.image);
  const accent = index % 2 === 0 ? 0xffc36f : 0x92c7ff;
  return new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.02,
    emissive: accent,
    emissiveIntensity: 0.1,
  });
}

function getMemoryTexture(path: string) {
  const cached = memoryTextureCache.get(path);
  if (cached) {
    return cached;
  }

  const texture = memoryTextureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  memoryTextureCache.set(path, texture);
  return texture;
}

function addLightBeams(group: THREE.Group, room: Room) {
  const beamMat = mat(room.palette[1], { emissive: room.palette[1], emissiveIntensity: 0.55, transparent: true, opacity: 0.18, roughness: 1 });
  for (let i = 0; i < 5; i += 1) {
    const beam = box(0.32, 4.8, 0.025, beamMat, -4 + i * 2.0, 2.5, -2.0 + Math.sin(i) * 0.8);
    beam.rotation.z = -0.22 + i * 0.08;
    beam.rotation.y = 0.18;
    group.add(beam);
  }
}

function createDustField() {
  const group = new THREE.Group();
  const material = mat(0xfff1cf, { roughness: 0.5, emissive: 0xffdca5, emissiveIntensity: 0.45, transparent: true, opacity: 0.55 });
  for (let i = 0; i < 160; i += 1) {
    const particle = new THREE.Mesh(new THREE.SphereGeometry(0.012 + (i % 5) * 0.003, 6, 4), material);
    particle.position.set(-8 + ((i * 97) % 160) / 10, 0.8 + ((i * 53) % 42) / 10, -4.2 + ((i * 31) % 84) / 10);
    particle.position.x += Math.floor(i / 32) * 24;
    group.add(particle);
  }
  return group;
}

function createFirstPersonRig(): FirstPersonRig {
  const group = new THREE.Group();
  group.name = "Hayoung_FirstPerson_Rig";
  group.position.set(0, -0.78, -1.05);
  group.scale.setScalar(0.58);
  group.userData.baseY = -0.78;
  group.userData.baseZ = -1.05;
  group.userData.baseScale = 0.58;

  const skin = mat(0xffc7a8, { roughness: 0.76, metalness: 0.02 });
  const sleeve = mat(0xf17088, { roughness: 0.86, texture: "fabric", textureRepeat: [1.4, 1.4], textureSeed: 701 });
  const cuff = mat(0xffe0b5, { roughness: 0.62, metalness: 0.05 });
  const darkMetal = mat(0x20242c, { roughness: 0.28, metalness: 0.78, texture: "metal", textureSeed: 702 });
  const brass = mat(0xd8ab66, { roughness: 0.35, metalness: 0.74, emissive: 0xf7be6d, emissiveIntensity: 0.08, texture: "metal", textureSeed: 703 });
  const glow = mat(0xffedbd, { roughness: 0.16, metalness: 0.12, emissive: 0xffe7a8, emissiveIntensity: 0.8 });
  const hairMat = mat(0x241716, { roughness: 0.72, metalness: 0.02, texture: "fabric", textureRepeat: [1.8, 1.2], textureSeed: 704 });
  const skirtMat = mat(0x31213a, { roughness: 0.8, metalness: 0.02, emissive: 0x211526, emissiveIntensity: 0.05, texture: "fabric", textureRepeat: [1.2, 1.2], textureSeed: 705 });
  const nameTagMat = mat(0xfff3cf, { roughness: 0.36, metalness: 0.18, emissive: 0xffd28c, emissiveIntensity: 0.18 });

  for (let i = 0; i < 5; i += 1) {
    const strand = new THREE.Mesh(new THREE.CapsuleGeometry(0.018 + i * 0.002, 0.28 + i * 0.018, 5, 8), hairMat);
    strand.position.set(-0.46 + i * 0.09, -0.48 + Math.sin(i) * 0.025, -0.42 - i * 0.018);
    strand.rotation.set(0.3 + i * 0.035, -0.16 + i * 0.08, -0.18 + i * 0.12);
    strand.userData.hairStrand = true;
    strand.userData.baseX = strand.position.x;
    strand.userData.baseY = strand.position.y;
    strand.userData.baseZ = strand.position.z;
    strand.userData.baseRotationZ = strand.rotation.z;
    strand.userData.seed = i;
    group.add(strand);
  }

  const skirtHem = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.72, 0.22, 5, 1, true), skirtMat);
  skirtHem.position.set(0, -0.64, -0.22);
  skirtHem.rotation.set(0.14, 0, Math.PI / 5);
  skirtHem.scale.set(1, 0.55, 0.7);
  skirtHem.userData.skirtHem = true;
  group.add(skirtHem);

  const nameCharm = new THREE.Group();
  nameCharm.position.set(0.02, -0.47, -0.62);
  nameCharm.rotation.set(0.08, 0.04, -0.03);
  nameCharm.userData.nameCharm = true;
  const charmPlate = box(0.31, 0.095, 0.022, nameTagMat, 0, 0, 0);
  const charmLeft = box(0.035, 0.052, 0.025, brass, -0.062, 0, 0.02);
  const charmRight = box(0.035, 0.052, 0.025, brass, 0.062, 0, 0.02);
  const charmCenter = box(0.022, 0.07, 0.025, glow, 0, 0, 0.024);
  nameCharm.add(charmPlate, charmLeft, charmRight, charmCenter);
  group.add(nameCharm);

  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.105, 0.58, 18), sleeve);
  leftForearm.position.set(-0.36, -0.24, -0.28);
  leftForearm.rotation.set(0.34, 0.16, -0.68);
  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.11, 0.62, 18), sleeve);
  rightForearm.position.set(0.37, -0.25, -0.3);
  rightForearm.rotation.set(0.3, -0.1, 0.62);

  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 12), skin);
  leftHand.scale.set(1.26, 0.72, 0.78);
  leftHand.position.set(-0.25, -0.17, -0.55);
  leftHand.rotation.set(0.1, 0.14, -0.24);
  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 12), skin);
  rightHand.scale.set(1.18, 0.74, 0.82);
  rightHand.position.set(0.28, -0.18, -0.55);
  rightHand.rotation.set(0.1, -0.08, 0.18);

  [-0.08, -0.025, 0.03].forEach((offset, index) => {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.11, 4, 8), skin);
    finger.position.set(-0.24 + offset, -0.18 - index * 0.003, -0.68);
    finger.rotation.set(1.04, 0.02, -0.12 + index * 0.1);
    group.add(finger);
  });

  const leftCuff = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.012, 8, 24), cuff);
  leftCuff.position.set(-0.34, -0.2, -0.42);
  leftCuff.rotation.set(0.28, 0.22, 0.9);
  const rightCuff = leftCuff.clone();
  rightCuff.position.set(0.35, -0.2, -0.43);
  rightCuff.rotation.set(0.28, -0.2, -0.9);

  const flashlight = new THREE.Group();
  flashlight.position.set(0.26, -0.19, -0.58);
  flashlight.rotation.set(0.02, -0.08, -0.06);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.094, 0.58, 28), darkMetal);
  barrel.rotation.x = Math.PI / 2;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.34, 20), darkMetal);
  grip.position.set(0.02, -0.11, 0.02);
  grip.rotation.z = -0.18;
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.045, 28), glow);
  lens.position.set(0, 0, -0.32);
  lens.rotation.x = Math.PI / 2;
  flashlight.add(barrel, grip, lens);

  const beamMaterial = new THREE.MeshBasicMaterial({
    color: 0xffc078,
    transparent: true,
    opacity: 0.012,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.55, 32, 1, true), beamMaterial);
  beam.position.set(0.26, -0.2, -1.5);
  beam.rotation.x = -Math.PI / 2;
  beam.userData.flashlightBeam = true;

  const light = new THREE.SpotLight(0xffd0a0, 0.78, 7.2, 0.42, 0.76, 1.1);
  light.position.set(0.26, -0.18, -0.86);
  light.target.position.set(0.02, -0.12, -3.0);
  light.castShadow = false;

  const key = new THREE.Group();
  key.position.set(-0.28, -0.14, -0.62);
  key.rotation.set(0.2, 0.22, -0.3);
  const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 10, 34), brass);
  keyRing.rotation.y = Math.PI / 2;
  const keyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.26, 12), brass);
  keyStem.position.set(0.13, 0, 0);
  keyStem.rotation.z = Math.PI / 2;
  const keyToothA = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.03, 0.018), brass);
  keyToothA.position.set(0.27, -0.022, 0);
  const keyToothB = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.052, 0.018), brass);
  keyToothB.position.set(0.31, 0.026, 0);
  const heartLeft = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 8), glow);
  heartLeft.position.set(-0.03, 0.048, 0.012);
  const heartRight = heartLeft.clone();
  heartRight.position.x = 0.015;
  const heartTip = new THREE.Mesh(new THREE.ConeGeometry(0.044, 0.062, 18), glow);
  heartTip.position.set(-0.008, 0.008, 0.012);
  heartTip.rotation.z = Math.PI;
  key.add(keyRing, keyStem, keyToothA, keyToothB, heartLeft, heartRight, heartTip);

  group.add(leftForearm, rightForearm, leftHand, rightHand, leftCuff, rightCuff, flashlight, beam, light, light.target, key);

  return { group, leftHand, rightHand, flashlight, beam, key, light };
}

function animateFirstPersonRig(rig: FirstPersonRig, elapsedTime: number, moving: boolean, unlockProgress: number, solvedCount: number) {
  const walkRate = moving ? 8.2 : 1.8;
  const sway = Math.sin(elapsedTime * walkRate);
  const lift = Math.cos(elapsedTime * walkRate * 0.5);
  const unlockKick = easeOutCubic(unlockProgress);
  const baseY = (rig.group.userData.baseY as number | undefined) ?? -0.78;
  const baseZ = (rig.group.userData.baseZ as number | undefined) ?? -1.05;
  const baseScale = (rig.group.userData.baseScale as number | undefined) ?? 0.58;

  rig.group.position.set(
    sway * (moving ? 0.018 : 0.006),
    baseY + lift * (moving ? 0.02 : 0.007) + unlockKick * 0.014,
    baseZ + Math.sin(elapsedTime * 1.1) * 0.008,
  );
  rig.group.scale.setScalar(baseScale + unlockKick * 0.025);
  rig.group.rotation.set(
    -0.025 + lift * 0.008,
    sway * (moving ? 0.025 : 0.01),
    sway * (moving ? 0.028 : 0.012) + unlockKick * 0.035,
  );

  rig.leftHand.rotation.z = -0.2 + sway * 0.04 - unlockKick * 0.08;
  rig.rightHand.rotation.z = 0.18 - sway * 0.035 + unlockKick * 0.05;
  rig.flashlight.rotation.y = -0.08 + sway * 0.018;
  rig.flashlight.rotation.x = 0.02 + lift * 0.012;

  const beamMaterial = rig.beam.material as THREE.MeshBasicMaterial;
  beamMaterial.opacity = 0.035 + Math.sin(elapsedTime * 3.4) * 0.012 + unlockKick * 0.045;
  rig.light.intensity = 0.52 + Math.sin(elapsedTime * 2.6) * 0.06 + unlockKick * 0.55;

  rig.key.rotation.y = 0.22 + Math.sin(elapsedTime * 2.4) * 0.16 + solvedCount * 0.02;
  rig.key.rotation.z = -0.3 + Math.sin(elapsedTime * 1.8) * 0.08;
  rig.key.position.y = -0.14 + Math.sin(elapsedTime * 2.1) * 0.018 + unlockKick * 0.035;
  rig.key.scale.setScalar(1 + solvedCount * 0.006 + unlockKick * 0.08);

  rig.group.traverse((object) => {
    if (object instanceof THREE.Mesh && object.userData.hairStrand) {
      const seed = (object.userData.seed as number | undefined) ?? object.id;
      const baseX = (object.userData.baseX as number | undefined) ?? object.position.x;
      const baseY = (object.userData.baseY as number | undefined) ?? object.position.y;
      const baseZ = (object.userData.baseZ as number | undefined) ?? object.position.z;
      const baseRotationZ = (object.userData.baseRotationZ as number | undefined) ?? object.rotation.z;
      object.position.x = baseX + Math.sin(elapsedTime * 2.1 + seed) * 0.006 + sway * 0.004;
      object.position.y = baseY + Math.cos(elapsedTime * 1.7 + seed) * 0.006 + unlockKick * 0.012;
      object.position.z = baseZ + Math.sin(elapsedTime * 1.3 + seed) * 0.004;
      object.rotation.z = baseRotationZ + Math.sin(elapsedTime * 2 + seed) * 0.022 + sway * 0.012;
    }
    if (object instanceof THREE.Mesh && object.userData.skirtHem) {
      object.rotation.y = Math.sin(elapsedTime * 1.6) * 0.025 + sway * 0.012;
      object.scale.y = 0.55 + lift * 0.012 + unlockKick * 0.02;
    }
  });

  const charm = rig.group.children.find((child) => child.userData.nameCharm);
  if (charm) {
    charm.rotation.z = -0.03 + Math.sin(elapsedTime * 2.2) * 0.035 + unlockKick * 0.06;
    charm.position.y = -0.47 + lift * 0.01 + unlockKick * 0.018;
  }
}

function animateRoom(group: THREE.Group, elapsedTime: number, unlockProgress: number, solvedCount: number, phase: Phase) {
  const eased = easeOutCubic(unlockProgress);
  const door = group.userData.door as THREE.Mesh | undefined;
  const ring = group.userData.ring as THREE.Mesh | undefined;
  const lockBox = group.userData.lockBox as THREE.Mesh | undefined;
  const bolts = group.userData.bolts as THREE.Mesh[] | undefined;
  const gears = group.userData.gears as THREE.Mesh[] | undefined;
  const keyLight = group.userData.keyLight as THREE.PointLight | undefined;
  const doorHandle = group.userData.doorHandle as THREE.Mesh | undefined;
  const hinges = group.userData.hinges as THREE.Mesh[] | undefined;
  const consoleLatch = group.userData.consoleLatch as THREE.Mesh | undefined;
  const consoleShackle = group.userData.consoleShackle as THREE.Mesh | undefined;
  const consoleLockBody = group.userData.consoleLockBody as THREE.Mesh | undefined;
  const focusStrength = (group.userData.focusStrength as number | undefined) ?? 0;
  const focusLight = group.userData.focusLight as THREE.PointLight | undefined;
  const escapeVistaLight = group.userData.escapeVistaLight as THREE.PointLight | undefined;

  if (door) {
    door.rotation.y = -0.38 * eased;
    door.position.x = 4.95 - eased * 0.14;
    door.position.z = -4.45 + eased * 0.14;
  }
  if (ring) {
    ring.rotation.z = elapsedTime * 0.55 + eased * Math.PI * 3.2;
    ring.scale.setScalar(1 + Math.sin(elapsedTime * 2.2) * 0.018 + eased * 0.16);
  }
  if (lockBox) {
    lockBox.scale.set(1 + eased * 0.05, 1 + Math.sin(elapsedTime * 2.1) * 0.01 + eased * 0.035, 1 + eased * 0.035);
  }
  if (doorHandle) {
    doorHandle.rotation.z = -0.5 * eased + Math.sin(elapsedTime * 5.8) * 0.03 * unlockProgress;
    doorHandle.scale.setScalar(1 + eased * 0.08);
  }
  hinges?.forEach((hinge, index) => {
    hinge.rotation.x = eased * (1.1 + index * 0.08);
    hinge.rotation.z = Math.PI / 2;
  });
  if (consoleLatch) {
    const baseY = (consoleLatch.userData.baseY as number | undefined) ?? consoleLatch.position.y;
    const baseZ = (consoleLatch.userData.baseZ as number | undefined) ?? consoleLatch.position.z;
    consoleLatch.position.y = baseY + eased * 0.18 + Math.sin(elapsedTime * 8) * 0.006 * unlockProgress;
    consoleLatch.position.z = baseZ + eased * 0.055;
    consoleLatch.rotation.x = eased * 0.08;
  }
  if (consoleShackle) {
    const baseY = (consoleShackle.userData.baseY as number | undefined) ?? consoleShackle.position.y;
    const baseZ = (consoleShackle.userData.baseZ as number | undefined) ?? consoleShackle.position.z;
    consoleShackle.position.y = baseY + eased * 0.2;
    consoleShackle.position.z = baseZ + eased * 0.07;
    consoleShackle.rotation.z = -eased * 0.72 + Math.sin(elapsedTime * 4.2) * 0.03;
    consoleShackle.scale.setScalar(1 + eased * 0.1);
  }
  if (consoleLockBody) {
    const baseY = (consoleLockBody.userData.baseY as number | undefined) ?? consoleLockBody.position.y;
    const baseZ = (consoleLockBody.userData.baseZ as number | undefined) ?? consoleLockBody.position.z;
    consoleLockBody.position.y = baseY - Math.sin(eased * Math.PI) * 0.035;
    consoleLockBody.position.z = baseZ + eased * 0.035;
    consoleLockBody.rotation.z = Math.sin(eased * Math.PI) * -0.08;
  }
  bolts?.forEach((bolt, index) => {
    const baseX = bolt.userData.baseX as number;
    bolt.position.x = baseX + (index === 0 ? -0.72 : 0.72) * eased;
    bolt.rotation.z = (index === 0 ? -0.16 : 0.16) * eased;
  });
  gears?.forEach((gear, index) => {
    gear.rotation.z += 0.012 + unlockProgress * (0.1 + index * 0.018);
  });
  if (keyLight) {
    keyLight.intensity = 2.1 + Math.sin(elapsedTime * 2.4) * 0.24 + unlockProgress * 1.6 + (phase === "ending" ? 1.1 : 0);
  }
  if (focusLight) {
    focusLight.intensity = 0.22 + focusStrength * 0.95 + unlockProgress * 0.85;
  }
  if (escapeVistaLight) {
    escapeVistaLight.intensity = 1.05 + Math.sin(elapsedTime * 1.6) * 0.16 + unlockProgress * 2.1 + focusStrength * 0.36;
  }

  group.traverse((object) => {
    if (object.userData.escapeVistaRig) {
      const seed = (object.userData.vistaSeed as number | undefined) ?? object.id;
      object.rotation.y = Math.sin(elapsedTime * 0.28 + seed) * 0.012 + unlockProgress * 0.025;
      object.position.z = Math.sin(elapsedTime * 0.42 + seed) * 0.015 - unlockProgress * 0.035;
    }
    if (object instanceof THREE.Mesh && object.userData.orb) {
      object.position.y = 1.18 + Math.sin(elapsedTime * 1.8) * 0.045;
    }
    if (object instanceof THREE.Mesh && object.userData.interactHalo) {
      const pulse = 1 + Math.sin(elapsedTime * 2.4 + object.id) * 0.028 + unlockProgress * 0.1 + focusStrength * 0.13;
      object.scale.setScalar(pulse);
      const material = object.material as THREE.MeshStandardMaterial;
      const baseOpacity = (object.userData.baseOpacity as number | undefined) ?? 0.28;
      material.opacity = baseOpacity + Math.sin(elapsedTime * 1.8 + object.id) * 0.02 + unlockProgress * 0.12 + focusStrength * 0.18;
      material.emissiveIntensity = 0.24 + focusStrength * 0.44 + unlockProgress * 0.3;
    }
    if (object instanceof THREE.Mesh && object.userData.focusFloor) {
      if (typeof object.userData.baseScaleX !== "number") {
        object.userData.baseScaleX = object.scale.x;
        object.userData.baseScaleY = object.scale.y;
        object.userData.baseScaleZ = object.scale.z;
      }
      const material = object.material as THREE.MeshStandardMaterial;
      const breath = Math.sin(elapsedTime * 1.9 + object.id) * 0.025;
      const baseX = object.userData.baseScaleX as number;
      const baseY = object.userData.baseScaleY as number;
      const baseZ = object.userData.baseScaleZ as number;
      object.rotation.z = elapsedTime * 0.18 + focusStrength * 0.65;
      object.scale.set(baseX * (1 + breath + focusStrength * 0.16), baseY * (1 + breath + focusStrength * 0.16), baseZ);
      material.opacity = ((object.userData.baseOpacity as number | undefined) ?? 0.03) + focusStrength * 0.18 + unlockProgress * 0.08;
      material.emissiveIntensity = 0.28 + focusStrength * 0.58 + unlockProgress * 0.3;
    }
    if (object instanceof THREE.Mesh && object.userData.focusBeam) {
      const material = object.material as THREE.MeshStandardMaterial;
      const scale = 1 + focusStrength * 0.05 + Math.sin(elapsedTime * 1.1) * 0.008;
      object.scale.set(scale, 1 + focusStrength * 0.04, scale);
      material.opacity = ((object.userData.baseOpacity as number | undefined) ?? 0.018) + focusStrength * 0.035 + unlockProgress * 0.035;
      material.emissiveIntensity = 0.18 + focusStrength * 0.26 + unlockProgress * 0.18;
    }
    if (object instanceof THREE.Mesh && object.userData.focusPip) {
      const material = object.material as THREE.MeshStandardMaterial;
      const seed = (object.userData.pipSeed as number | undefined) ?? object.id;
      const baseY = (object.userData.baseY as number | undefined) ?? object.position.y;
      object.position.y = baseY + Math.sin(elapsedTime * 2.2 + seed) * 0.035 + focusStrength * 0.045;
      object.rotation.y = elapsedTime * (0.7 + seed * 0.05);
      object.rotation.z = elapsedTime * (0.5 + seed * 0.04);
      object.scale.setScalar(0.92 + Math.sin(elapsedTime * 2 + seed) * 0.08 + focusStrength * 0.34 + unlockProgress * 0.18);
      material.opacity = 0.18 + focusStrength * 0.52 + unlockProgress * 0.18;
      material.emissiveIntensity = 0.45 + focusStrength * 1.1 + unlockProgress * 0.5;
    }
    if (object instanceof THREE.Mesh && object.userData.escapeVistaPanel) {
      const material = object.material as THREE.MeshBasicMaterial;
      const seed = (object.userData.vistaSeed as number | undefined) ?? object.id;
      const baseOpacity = (object.userData.baseOpacity as number | undefined) ?? 0.08;
      material.opacity = baseOpacity + Math.sin(elapsedTime * 0.9 + seed) * 0.024 + unlockProgress * 0.075 + focusStrength * 0.025;
      object.scale.x = 1 + Math.sin(elapsedTime * 0.52 + seed) * 0.018 + unlockProgress * 0.035;
      object.scale.y = 1 + Math.sin(elapsedTime * 0.62 + seed) * 0.012 + unlockProgress * 0.025;
    }
    if (object instanceof THREE.Mesh && object.userData.escapeBreadcrumb) {
      const material = object.material as THREE.MeshStandardMaterial;
      const trailIndex = (object.userData.trailIndex as number | undefined) ?? 0;
      const baseY = (object.userData.baseY as number | undefined) ?? object.position.y;
      const baseScaleX = (object.userData.baseScaleX as number | undefined) ?? object.scale.x;
      const baseScaleY = (object.userData.baseScaleY as number | undefined) ?? object.scale.y;
      const baseScaleZ = (object.userData.baseScaleZ as number | undefined) ?? object.scale.z;
      const chase = Math.max(0, Math.sin(elapsedTime * 2.35 - trailIndex * 0.48));
      const unlockPulse = Math.sin(unlockProgress * Math.PI);
      object.position.y = baseY + chase * 0.018 + unlockPulse * 0.035;
      object.scale.set(baseScaleX * (1 + chase * 0.055 + unlockProgress * 0.08), baseScaleY, baseScaleZ * (1 + chase * 0.08 + unlockProgress * 0.1));
      material.opacity = 0.38 + chase * 0.18 + unlockProgress * 0.28 + focusStrength * 0.06;
      material.emissiveIntensity = 0.48 + chase * 0.5 + unlockProgress * 1.05 + focusStrength * 0.22;
    }
    if (object instanceof THREE.Mesh && object.userData.escapeVistaGlow) {
      const material = object.material as THREE.MeshStandardMaterial;
      const seed = (object.userData.vistaSeed as number | undefined) ?? object.id;
      const baseY = (object.userData.baseY as number | undefined) ?? object.position.y;
      const baseScaleX = (object.userData.baseScaleX as number | undefined) ?? object.scale.x;
      const baseScaleY = (object.userData.baseScaleY as number | undefined) ?? object.scale.y;
      const baseScaleZ = (object.userData.baseScaleZ as number | undefined) ?? object.scale.z;
      const pulse = Math.sin(elapsedTime * 1.85 + seed) * 0.04 + unlockProgress * 0.11 + focusStrength * 0.035;
      object.position.y = baseY + Math.sin(elapsedTime * 0.9 + seed) * 0.008 + unlockProgress * 0.022;
      object.scale.set(baseScaleX * (1 + pulse), baseScaleY * (1 + pulse * 0.55), baseScaleZ * (1 + pulse));
      material.opacity = Math.min(0.96, ((object.userData.baseOpacity as number | undefined) ?? 0.62) + unlockProgress * 0.22 + focusStrength * 0.04);
      material.emissiveIntensity = 0.46 + Math.sin(elapsedTime * 2.4 + seed) * 0.18 + unlockProgress * 1.0 + focusStrength * 0.22;
    }
    if (object instanceof THREE.Mesh && object.userData.lightShaft) {
      const material = object.material as THREE.MeshBasicMaterial;
      const seed = (object.userData.shaftSeed as number | undefined) ?? object.id;
      const baseOpacity = (object.userData.baseOpacity as number | undefined) ?? 0.08;
      const shimmer = Math.sin(elapsedTime * 0.72 + seed) * 0.018;
      material.opacity = baseOpacity + shimmer + unlockProgress * 0.035 + focusStrength * 0.018;
      object.rotation.z += Math.sin(elapsedTime * 0.35 + seed) * 0.00025;
      object.scale.x = 1 + Math.sin(elapsedTime * 0.58 + seed) * 0.025;
    }
    if (object instanceof THREE.Mesh && object.userData.floorReflection) {
      const material = object.material as THREE.MeshBasicMaterial;
      const seed = (object.userData.reflectionSeed as number | undefined) ?? object.id;
      const baseOpacity = (object.userData.baseOpacity as number | undefined) ?? 0.05;
      material.opacity = baseOpacity + Math.sin(elapsedTime * 1.1 + seed) * 0.016 + unlockProgress * 0.025;
      object.scale.x = 1 + Math.sin(elapsedTime * 0.9 + seed) * 0.035;
    }
    if (object instanceof THREE.Mesh && object.userData.cinematicRain) {
      const material = object.material as THREE.MeshBasicMaterial;
      const seed = (object.userData.rainSeed as number | undefined) ?? object.id;
      const baseY = (object.userData.baseY as number | undefined) ?? object.position.y;
      object.position.y = baseY - ((elapsedTime * 0.42 + seed * 0.17) % 0.72);
      material.opacity = ((object.userData.baseOpacity as number | undefined) ?? 0.1) + Math.sin(elapsedTime * 2.1 + seed) * 0.025;
    }
    if (object instanceof THREE.Mesh && object.userData.scanLine) {
      const baseY = (object.userData.baseY as number | undefined) ?? object.position.y;
      object.position.y = baseY + Math.sin(elapsedTime * 1.7 + object.id) * 0.14;
      const material = object.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.42 + Math.sin(elapsedTime * 3.1 + object.id) * 0.12 + unlockProgress * 0.28;
    }
    if (object instanceof THREE.Mesh && object.userData.statusLight) {
      const material = object.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.24 + Math.sin(elapsedTime * 3 + object.id) * 0.18 + unlockProgress * 0.7;
      object.scale.setScalar(1 + Math.sin(elapsedTime * 2.2 + object.id) * 0.035 + unlockProgress * 0.12);
    }
    if (object instanceof THREE.Mesh && object.userData.doorSeal) {
      const material = object.material as THREE.MeshStandardMaterial;
      const sealIndex = (object.userData.sealIndex as number | undefined) ?? 0;
      material.opacity = 0.18 + Math.sin(elapsedTime * 3.2 + sealIndex) * 0.05 + unlockProgress * 0.42;
      material.emissiveIntensity = 0.38 + Math.sin(elapsedTime * 4.1 + sealIndex) * 0.1 + unlockProgress * 1.05;
      object.scale.setScalar(1 + unlockProgress * 0.14 + Math.sin(elapsedTime * 4 + object.id) * 0.018);
    }
    if (object instanceof THREE.Mesh && object.userData.unlockSpark) {
      const material = object.material as THREE.MeshStandardMaterial;
      const seed = (object.userData.sparkSeed as number | undefined) ?? object.id;
      const baseX = (object.userData.baseX as number | undefined) ?? object.position.x;
      const baseY = (object.userData.baseY as number | undefined) ?? object.position.y;
      const baseZ = (object.userData.baseZ as number | undefined) ?? object.position.z;
      object.position.x = baseX + Math.sin(seed * 1.7) * unlockProgress * 0.16;
      object.position.y = baseY + Math.sin(elapsedTime * 5.2 + seed) * 0.018 + unlockProgress * (0.1 + (seed % 5) * 0.018);
      object.position.z = baseZ + Math.cos(seed * 1.3) * unlockProgress * 0.09;
      object.scale.setScalar(0.45 + unlockProgress * (1.35 + Math.sin(elapsedTime * 8 + seed) * 0.28));
      material.opacity = 0.05 + unlockProgress * (0.32 + Math.sin(elapsedTime * 7 + seed) * 0.08);
      material.emissiveIntensity = 0.4 + unlockProgress * 1.25;
    }
    if (object instanceof THREE.Mesh && object.userData.keyhole) {
      const material = object.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.1 + unlockProgress * 0.82;
      object.scale.set(1 + unlockProgress * 0.28, 1 + unlockProgress * 0.08, 1);
    }
    if (object instanceof THREE.Mesh && object.userData.padGlow) {
      const material = object.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.34 + Math.sin(elapsedTime * 2.8 + object.id) * 0.12 + unlockProgress * 0.46;
    }
    if (object instanceof THREE.Mesh && object.userData.deviceKitFloat) {
      if (typeof object.userData.baseY !== "number") object.userData.baseY = object.position.y;
      if (typeof object.userData.baseRotationZ !== "number") object.userData.baseRotationZ = object.rotation.z;
      const seed = (object.userData.deviceKitSeed as number | undefined) ?? object.id;
      object.position.y = (object.userData.baseY as number) + Math.sin(elapsedTime * 1.4 + seed) * 0.018 + unlockProgress * 0.032;
      object.rotation.z = (object.userData.baseRotationZ as number) + Math.sin(elapsedTime * 0.8 + seed) * 0.018 + unlockProgress * 0.028;
    }
    if (object instanceof THREE.Mesh && object.userData.deviceKitGlow) {
      const material = object.material as THREE.MeshStandardMaterial;
      const seed = (object.userData.deviceKitSeed as number | undefined) ?? object.id;
      material.emissiveIntensity = 0.22 + Math.sin(elapsedTime * 2.7 + seed) * 0.12 + focusStrength * 0.26 + unlockProgress * 0.58;
      if (material.transparent) {
        material.opacity = Math.min(0.94, 0.46 + focusStrength * 0.22 + unlockProgress * 0.28);
      }
    }
    if (object instanceof THREE.Mesh && object.userData.deviceKitScanner) {
      const material = object.material as THREE.MeshStandardMaterial;
      const scan = Math.max(0, Math.sin(elapsedTime * 2.1 + object.id));
      object.scale.x = 1 + scan * 0.025 + focusStrength * 0.035 + unlockProgress * 0.06;
      material.emissiveIntensity = 0.08 + scan * 0.18 + focusStrength * 0.22 + unlockProgress * 0.48;
      if (material.transparent) {
        material.opacity = Math.min(0.9, 0.62 + scan * 0.08 + unlockProgress * 0.18);
      }
    }
    if (object instanceof THREE.Mesh && object.userData.deviceKitSpin) {
      if (typeof object.userData.baseY !== "number") object.userData.baseY = object.position.y;
      const seed = (object.userData.deviceKitSeed as number | undefined) ?? object.id;
      object.rotation.z = elapsedTime * (0.65 + seed * 0.08) + unlockProgress * Math.PI * 1.6;
      object.position.y = (object.userData.baseY as number) + Math.sin(elapsedTime * 2.2 + seed) * 0.014 + unlockProgress * 0.032;
    }
    if (object instanceof THREE.Mesh && object.userData.deviceKitRainDrop) {
      if (typeof object.userData.baseY !== "number") object.userData.baseY = object.position.y;
      const seed = (object.userData.deviceKitSeed as number | undefined) ?? object.id;
      object.position.y = (object.userData.baseY as number) - ((elapsedTime * 0.18 + seed * 0.07) % 0.18) + unlockProgress * 0.055;
      const material = object.material as THREE.MeshStandardMaterial;
      material.opacity = 0.58 + Math.sin(elapsedTime * 3.1 + seed) * 0.12 + unlockProgress * 0.12;
      material.emissiveIntensity = 0.36 + focusStrength * 0.26 + unlockProgress * 0.55;
    }
    if (object instanceof THREE.Mesh && object.userData.deviceKitBeat) {
      const beat = 1 + Math.max(0, Math.sin(elapsedTime * 2.6)) * 0.035 + unlockProgress * 0.08;
      object.scale.x = beat;
      object.scale.y = beat * 0.8;
      const material = object.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.08 + focusStrength * 0.2 + unlockProgress * 0.42;
    }
    if (object instanceof THREE.Mesh && object.userData.deviceKitPrism) {
      object.rotation.x = elapsedTime * 0.22 + unlockProgress * 0.8;
      object.rotation.y = elapsedTime * 0.42 + unlockProgress * 1.4;
      object.scale.set(1 + focusStrength * 0.08 + unlockProgress * 0.18, 1.18 + unlockProgress * 0.16, 0.72 + focusStrength * 0.04);
      const material = object.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.58 + Math.sin(elapsedTime * 2.2) * 0.16 + focusStrength * 0.42 + unlockProgress * 1.1;
      material.opacity = 0.68 + Math.sin(elapsedTime * 1.6) * 0.05;
    }
    if (object instanceof THREE.Mesh && object.userData.deviceKitHalo) {
      const seed = (object.userData.deviceKitSeed as number | undefined) ?? object.id;
      object.rotation.z = elapsedTime * (0.28 + seed * 0.08) + unlockProgress * Math.PI;
      object.scale.setScalar(1 + Math.sin(elapsedTime * 1.8 + seed) * 0.035 + focusStrength * 0.08 + unlockProgress * 0.16);
      const material = object.material as THREE.MeshStandardMaterial;
      material.opacity = 0.38 + Math.sin(elapsedTime * 2.1 + seed) * 0.08 + unlockProgress * 0.26;
      material.emissiveIntensity = 0.5 + focusStrength * 0.36 + unlockProgress * 0.9;
    }
    if (object instanceof THREE.Mesh && object.userData.physicalClueNetwork) {
      const material = object.material as THREE.MeshStandardMaterial;
      const stage = (object.userData.clueStage as number | undefined) ?? 0;
      const roomStart = (object.userData.clueRoomStart as number | undefined) ?? 0;
      const stageActive = solvedCount >= roomStart + stage;
      const stageLit = stageActive ? 1 : 0.32;
      const seed = object.id + stage * 11;
      if (object.userData.clueNode) {
        if (typeof object.userData.baseY !== "number") object.userData.baseY = object.position.y;
        if (typeof object.userData.baseRotationZ !== "number") object.userData.baseRotationZ = object.rotation.z;
        object.position.y = (object.userData.baseY as number) + Math.sin(elapsedTime * 1.45 + seed) * 0.006 * stageLit + unlockProgress * 0.012;
        object.rotation.z = (object.userData.baseRotationZ as number) + Math.sin(elapsedTime * 0.9 + seed) * 0.006 * stageLit;
        material.emissiveIntensity = 0.04 + stageLit * 0.22 + focusStrength * 0.08 + unlockProgress * 0.2;
        if (material.transparent) material.opacity = Math.min(0.96, 0.5 + stageLit * 0.34 + unlockProgress * 0.1);
      }
      if (object.userData.clueLink || object.userData.clueFloorTrail || object.userData.clueSeal) {
        const pulse = Math.max(0, Math.sin(elapsedTime * 2.25 + seed));
        material.emissiveIntensity = 0.12 + stageLit * (0.34 + pulse * 0.18) + focusStrength * 0.14 + unlockProgress * 0.34;
        if (material.transparent) material.opacity = Math.min(0.88, 0.18 + stageLit * 0.42 + pulse * 0.08 + unlockProgress * 0.14);
      }
      if (object.userData.clueFloorTrail) {
        if (typeof object.userData.baseY !== "number") object.userData.baseY = object.position.y;
        const chase = Math.max(0, Math.sin(elapsedTime * 2.15 - stage * 0.65));
        object.position.y = (object.userData.baseY as number) + chase * 0.006 * stageLit + unlockProgress * 0.014;
      }
      if (object.userData.clueSeal) {
        object.rotation.z = elapsedTime * (0.18 + stage * 0.08) + unlockProgress * Math.PI;
        object.scale.setScalar(1 + Math.sin(elapsedTime * 1.8 + seed) * 0.025 * stageLit + unlockProgress * 0.08);
      }
    }
    if (object instanceof THREE.Mesh && object.userData.float) {
      object.position.y += Math.sin(elapsedTime + object.id) * 0.0008;
    }
    if (object instanceof THREE.Mesh && object.userData.cloud) {
      object.position.y += Math.sin(elapsedTime * 1.1 + object.id) * 0.0012;
    }
    if (object instanceof THREE.Mesh && object.userData.dial) {
      object.rotation.z = elapsedTime * 0.3 + solvedCount * 0.08;
    }
  });
}

function box(width: number, height: number, depth: number, material: THREE.Material, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function mat(
  color: number,
  options: {
    roughness?: number;
    metalness?: number;
    emissive?: number;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;
    texture?: ProceduralTextureKind;
    textureRepeat?: [number, number];
    textureSeed?: number;
  } = {},
) {
  const materialOptions: THREE.MeshStandardMaterialParameters = {
    color,
    roughness: options.roughness ?? 0.55,
    metalness: options.metalness ?? 0.06,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  };
  if (options.texture) {
    const texture = createProceduralTexture(options.texture, color, options.textureSeed ?? 0, options.textureRepeat ?? [1, 1]);
    materialOptions.map = texture;
    materialOptions.bumpMap = texture;
    materialOptions.bumpScale = options.texture === "metal" ? 0.008 : 0.025;
  }
  if (typeof options.transparent === "boolean") {
    materialOptions.transparent = options.transparent;
  }
  if (typeof options.opacity === "number") {
    materialOptions.opacity = options.opacity;
  }
  return new THREE.MeshStandardMaterial(materialOptions);
}

function createProceduralTexture(kind: ProceduralTextureKind, baseColor: number, seed: number, repeat: [number, number]) {
  const cacheKey = `${kind}:${baseColor}:${seed}:${repeat[0]}:${repeat[1]}`;
  const cached = proceduralTextureCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas texture context unavailable.");
  }

  const base = new THREE.Color(baseColor);
  const random = seededRandom(seed + baseColor * 0.000001);
  const color = (shade = 0, alpha = 1) => {
    const c = base.clone().offsetHSL(0, 0, shade);
    return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;
  };

  ctx.fillStyle = color(0);
  ctx.fillRect(0, 0, size, size);

  if (kind === "wood") {
    for (let y = 0; y < size; y += 5) {
      const wobble = Math.sin(y * 0.11 + seed) * 8;
      ctx.strokeStyle = color(random() * 0.16 - 0.08, 0.34);
      ctx.lineWidth = 1 + random() * 2;
      ctx.beginPath();
      for (let x = -6; x <= size + 6; x += 8) {
        const nextY = y + Math.sin(x * 0.075 + seed * 0.7) * 4 + wobble * 0.18;
        if (x === -6) ctx.moveTo(x, nextY);
        else ctx.lineTo(x, nextY);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 12; i += 1) {
      const x = random() * size;
      const y = random() * size;
      ctx.strokeStyle = color(-0.1, 0.18);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, y, 8 + random() * 12, 2 + random() * 4, random() * Math.PI, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  if (kind === "plaster") {
    for (let i = 0; i < 360; i += 1) {
      const x = random() * size;
      const y = random() * size;
      const radius = 0.5 + random() * 2.2;
      ctx.fillStyle = color(random() * 0.18 - 0.09, 0.08 + random() * 0.12);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 12; i += 1) {
      ctx.strokeStyle = color(random() * 0.12 - 0.06, 0.08);
      ctx.lineWidth = 2 + random() * 5;
      ctx.beginPath();
      ctx.moveTo(random() * size, random() * size);
      ctx.bezierCurveTo(random() * size, random() * size, random() * size, random() * size, random() * size, random() * size);
      ctx.stroke();
    }
  }

  if (kind === "fabric") {
    for (let i = 0; i < size; i += 6) {
      ctx.strokeStyle = color(i % 12 === 0 ? 0.1 : -0.06, 0.24);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }
    for (let i = 0; i < 180; i += 1) {
      ctx.fillStyle = color(random() * 0.12 - 0.06, 0.12);
      ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1);
    }
  }

  if (kind === "paper") {
    for (let i = 0; i < 160; i += 1) {
      ctx.strokeStyle = color(random() * 0.1 - 0.05, 0.12);
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      const y = random() * size;
      ctx.moveTo(random() * size, y);
      ctx.lineTo(random() * size, y + random() * 10 - 5);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(0, 0, size, size);
  }

  if (kind === "metal") {
    for (let i = 0; i < 120; i += 1) {
      const y = random() * size;
      ctx.strokeStyle = color(random() * 0.12 - 0.08, 0.12);
      ctx.lineWidth = random() > 0.8 ? 1.4 : 0.6;
      ctx.beginPath();
      ctx.moveTo(random() * size, y);
      ctx.lineTo(size, y + random() * 12 - 6);
      ctx.stroke();
    }
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, "rgba(255,255,255,0.08)");
    gradient.addColorStop(0.5, "rgba(0,0,0,0.08)");
    gradient.addColorStop(1, "rgba(255,255,255,0.04)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 4;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  proceduralTextureCache.set(cacheKey, texture);
  return texture;
}

function seededRandom(seed: number) {
  let value = Math.floor(seed * 1000) || 1;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

export default App;
