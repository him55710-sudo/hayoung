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
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

type Phase = "intro" | "game" | "ending";
type PuzzleKind = "code" | "direction" | "symbol" | "memory" | "device" | "final";
type GraphicsQuality = "cinematic" | "balanced" | "performance";

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

declare global {
  interface Window {
    advanceTime?: (ms?: number) => void;
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

const hintPenalties = ["현수한테 바나나우유 사주기", "현수한테 설빙 사주기", "현수랑 방탈출 하러가기"];

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
  const [phase, setPhase] = useState<Phase>("intro");
  const [introUnlocked, setIntroUnlocked] = useState(false);
  const [introSeconds, setIntroSeconds] = useState(0);
  const [buttonOffset, setButtonOffset] = useState({ x: 0, y: 0 });
  const [roomIndex, setRoomIndex] = useState(0);
  const [solvedIds, setSolvedIds] = useState<number[]>([]);
  const [activePuzzleId, setActivePuzzleId] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("빛나는 장치가 조용히 반응하고 있어요.");
  const [hintCount, setHintCount] = useState(0);
  const [movement, setMovement] = useState({ forward: false, back: false, left: false, right: false });
  const [unlockTick, setUnlockTick] = useState(0);
  const [unlocking, setUnlocking] = useState(false);
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
  const inventory = puzzles.filter((puzzle) => solvedSet.has(puzzle.id)).map((puzzle) => puzzle.reward);
  const canAdvanceRoom = currentRoomPuzzles.every((puzzle) => solvedSet.has(puzzle.id));
  const roomClearVisible = phase === "game" && canAdvanceRoom && roomIndex < rooms.length - 1 && !activePuzzle;
  const nextRoomTitle = rooms[roomIndex + 1]?.title ?? "엔딩";

  const handleNearObject = useCallback((label: string) => {
    setMessage((current) => (current === label ? current : label));
  }, []);
  const handleInteractFocusChange = useCallback((active: boolean) => {
    setNearInteractable((current) => (current === active ? current : active));
  }, []);

  useRoomAmbience(phase, roomIndex, audioEnabled);

  useEffect(() => {
    if (phase !== "intro") {
      return;
    }
    const timer = window.setInterval(() => {
      setIntroSeconds((value) => {
        const next = value + 1;
        if (next >= 6) {
          setIntroUnlocked(true);
          setButtonOffset({ x: 0, y: 0 });
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
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
      if (event.key.toLowerCase() === "h") useHint();
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
    window.render_game_to_text = () =>
      JSON.stringify({
        phase,
        room: currentRoom.title,
        roomIndex: roomIndex + 1,
        solvedPuzzles: solvedIds.length,
        totalPuzzles: puzzles.length,
        memorySlots: memorySlots.length,
        hintsLeft,
        penalties: hintPenalties.slice(0, hintCount),
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
        embodiedView: "Hayoung first-person hands with flashlight, heart key, hair strands, skirt silhouette, and name charm",
        characterDetail: "camera-attached Hayoung avatar cues: hands, sleeves, hair, skirt hem, H/Y charm, flashlight, and heart key",
        interactableInRange: nearInteractable,
        interactionFocus: "distance-reactive reticle, floor glyph, lock halo, and focus light around the active puzzle console",
        unlockDetail: "animated latch lift, sliding bolts, glowing door seam, hinges, handle, and unlock sparks",
        collisionModel: "room bounds plus solid central puzzle console stop-zone",
        ambience: audioEnabled ? currentRoom.ambience.label : "muted",
        message,
        coordinateSystem: "Three.js first-person scene uses x/z floor plane; y is height; five rooms are laid out along +x.",
      });
  }, [
    availablePuzzle,
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
    message,
    nearInteractable,
    nextRoomTitle,
    phase,
    roomIndex,
    roomClearVisible,
    solvedIds.length,
    solvedSet,
  ]);

  const triggerUnlock = () => {
    setUnlockTick((value) => value + 1);
    setUnlocking(true);
    window.setTimeout(() => setUnlocking(false), 880);
  };

  const evadeButton = () => {
    if (introUnlocked) {
      return;
    }
    const direction = Math.random() > 0.5 ? 1 : -1;
    setButtonOffset({
      x: direction * (90 + Math.random() * 130),
      y: (Math.random() - 0.5) * 95,
    });
  };

  const startGame = () => {
    if (!introUnlocked) {
      evadeButton();
      return;
    }
    setPhase("game");
    setAudioEnabled(true);
    setMessage("하영이가 첫 번째 방에 들어왔어요. 중앙의 잠금 장치가 첫 단서를 기다립니다.");
  };

  function openNextPuzzle() {
    if (phase !== "game") {
      return;
    }
    if (availablePuzzle) {
      setActivePuzzleId(availablePuzzle.id);
      setAnswer("");
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
      triggerUnlock();
      setMessage(`${nextRoom.title}으로 문이 열렸습니다. 공기와 음악이 달라졌어요.`);
      return;
    }
    setPhase("ending");
  }

  function submitPuzzle() {
    if (!activePuzzle) {
      return;
    }
    const normalizedAnswer = normalizePuzzleAnswer(activePuzzle, answer);
    if (normalizedAnswer !== activePuzzle.answer) {
      setAnswer(normalizedAnswer);
      setMessage("아직 맞지 않아요. 단서의 순서와 장치의 형태를 다시 맞춰보세요.");
      return;
    }
    setSolvedIds((ids) => (ids.includes(activePuzzle.id) ? ids : [...ids, activePuzzle.id]));
    setMessage(`${activePuzzle.reward} 획득! ${activePuzzle.chainNote}`);
    setActivePuzzleId(null);
    setAnswer("");
    triggerUnlock();

    if (activePuzzle.id === 10) {
      window.setTimeout(() => setPhase("ending"), 520);
    }
  }

  function useHint() {
    if (hintCount >= 3) {
      setMessage("힌트 3번을 모두 썼어요. 이제 하영이의 감으로 가야 합니다.");
      return;
    }
    const penalty = hintPenalties[hintCount];
    setHintCount((count) => count + 1);
    setMessage(`힌트 사용! 벌칙: ${penalty}. 지금 문제는 ${availablePuzzle?.kind ?? "마지막"} 장치입니다.`);
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

  return (
    <main className="site-shell">
      {phase === "intro" && (
        <section className="intro-screen">
          <div className="intro-backdrop" />
          <div className="intro-copy">
            <p className="couple-mark">임현수 × 정하영</p>
            <h1>임현수와의 500일을 함께하실 준비가 되셨나요?</h1>
            <p>버튼은 잠시 망설이다가 마음이 열리면 멈춰요.</p>
            <button
              className={`runaway-button${introUnlocked ? " is-ready" : ""}`}
              style={{ translate: `${buttonOffset.x}px ${buttonOffset.y}px` }}
              onClick={startGame}
              onMouseEnter={evadeButton}
              onMouseMove={evadeButton}
              onMouseOver={evadeButton}
              onPointerEnter={evadeButton}
              onPointerMove={evadeButton}
              onTouchStart={evadeButton}
              type="button"
            >
              <Heart aria-hidden="true" />
              네
            </button>
            <span className="unlock-timer">{introUnlocked ? "이제 클릭할 수 있어요." : `${Math.max(0, 6 - introSeconds)}초 뒤에 멈춰요`}</span>
          </div>
        </section>
      )}

      {(phase === "game" || phase === "ending") && (
        <section className={`game-screen${unlocking ? " is-unlocking" : ""}${nearInteractable ? " has-focus-target" : ""}`} aria-label="500일 1인칭 3D 방탈출">
          <AnniversaryScene
            roomIndex={roomIndex}
            phase={phase}
            solvedCount={solvedIds.length}
            movement={movement}
            unlockTick={unlockTick}
            graphicsQuality={graphicsQuality}
            onNearObject={handleNearObject}
            onInteractFocusChange={handleInteractFocusChange}
          />

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
              <button type="button" onClick={useHint} title="힌트 사용" aria-label="힌트 사용">
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

          {!roomClearVisible && (
            <button className={`interact-button${nearInteractable ? " is-focused" : ""}`} type="button" onClick={openNextPuzzle}>
              {canAdvanceRoom && roomIndex < rooms.length - 1 ? <DoorOpen aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
              {availablePuzzle ? "E 조사하기" : roomIndex < rooms.length - 1 ? "다음 방" : "엔딩 보기"}
            </button>
          )}

          <div className="mobile-pad" aria-label="모바일 이동 패드">
            <button type="button" onPointerDown={() => setMovement((v) => ({ ...v, forward: true }))} onPointerUp={() => setMovement((v) => ({ ...v, forward: false }))}>
              <ArrowUp aria-hidden="true" />
            </button>
            <button type="button" onPointerDown={() => setMovement((v) => ({ ...v, left: true }))} onPointerUp={() => setMovement((v) => ({ ...v, left: false }))}>
              <ArrowLeft aria-hidden="true" />
            </button>
            <button type="button" onPointerDown={() => setMovement((v) => ({ ...v, back: true }))} onPointerUp={() => setMovement((v) => ({ ...v, back: false }))}>
              <ArrowDown aria-hidden="true" />
            </button>
            <button type="button" onPointerDown={() => setMovement((v) => ({ ...v, right: true }))} onPointerUp={() => setMovement((v) => ({ ...v, right: false }))}>
              <ArrowRight aria-hidden="true" />
            </button>
          </div>

          {hintCount > 0 && (
            <aside className="penalty-card">
              <strong>힌트 벌칙</strong>
              {hintPenalties.slice(0, hintCount).map((penalty) => (
                <span key={penalty}>{penalty}</span>
              ))}
            </aside>
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
              <section className="puzzle-modal" role="dialog" aria-label={activePuzzle.title}>
                <button className="close-button" type="button" onClick={() => setActivePuzzleId(null)}>
                  <X aria-hidden="true" />
                </button>
                <span>
                  문제 {activePuzzle.id}/10 · {kindLabel(activePuzzle.kind)}
                </span>
                <h2>{activePuzzle.title}</h2>
                <p>{activePuzzle.prompt}</p>
                <LockPreview kind={activePuzzle.kind} answer={activePuzzle.answer} />
                <PuzzleInputPad puzzle={activePuzzle} answer={answer} setAnswer={setAnswer} />
                <p className="chain-note">{activePuzzle.chainNote}</p>
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
                  />
                  <button type="button" onClick={submitPuzzle}>
                    <Check aria-hidden="true" />
                    확인
                  </button>
                </div>
              </section>
            </div>
          )}

          {phase === "ending" && (
            <div className="ending-letter">
              <div className="ending-copy">
                <span>500일의 문이 열렸어</span>
                <h2>하영아, 500일부터는 더 다정하게 같이 걷자.</h2>
                <p>
                  지나온 날들에는 풋풋함도, 다툼도, 지친 밤도 있었지만 결국 우리는 서로의 편으로 돌아왔어. 앞으로의 방은 혼자 푸는 문제가 아니라,
                  둘이 같이 만드는 추억이면 좋겠어.
                </p>
              </div>
              <div className="memory-timeline" aria-label="500일 기억 타임라인">
                {memorySlots.map((slot) => (
                  <figure className="memory-card" key={slot.id}>
                    <img src={slot.image} alt={`${slot.dayRange} ${slot.title}`} />
                    <figcaption>
                      <b>{slot.dayRange}</b>
                      <strong>{slot.title}</strong>
                      <small>{slot.caption}</small>
                    </figcaption>
                  </figure>
                ))}
              </div>
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
        {answer.split("").map((letter) => (
          <b key={letter}>{letter}</b>
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
}: {
  puzzle: Puzzle;
  answer: string;
  setAnswer: (value: string | ((current: string) => string)) => void;
}) {
  const appendValue = (value: string) => {
    setAnswer((current: string) => normalizePuzzleAnswer(puzzle, current + value));
  };
  const setPreset = (value: string) => {
    setAnswer(normalizePuzzleAnswer(puzzle, value));
  };
  const removeLast = () => {
    setAnswer((current: string) => current.slice(0, -1));
  };
  const clearValue = () => {
    setAnswer("");
  };

  if (puzzle.kind === "direction") {
    return (
      <div className="puzzle-pad direction-pad" aria-label="Direction lock controls">
        <button className="dir-key dir-up" type="button" onClick={() => appendValue("U")} aria-label="Up">
          <ArrowUp aria-hidden="true" />
        </button>
        <button className="dir-key dir-left" type="button" onClick={() => appendValue("L")} aria-label="Left">
          <ArrowLeft aria-hidden="true" />
        </button>
        <button className="pad-utility dir-back" type="button" onClick={removeLast} aria-label="Delete one" title="한 글자 지우기">
          <Delete aria-hidden="true" />
        </button>
        <button className="dir-key dir-right" type="button" onClick={() => appendValue("R")} aria-label="Right">
          <ArrowRight aria-hidden="true" />
        </button>
        <button className="dir-key dir-down" type="button" onClick={() => appendValue("D")} aria-label="Down">
          <ArrowDown aria-hidden="true" />
        </button>
        <button className="pad-utility dir-clear" type="button" onClick={clearValue} aria-label="Clear" title="전체 지우기">
          <RotateCcw aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (puzzle.kind === "code") {
    return (
      <div className="puzzle-pad code-pad" aria-label="Numeric lock controls">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((digit) => (
          <button type="button" key={digit} onClick={() => appendValue(digit)} aria-label={`Digit ${digit}`}>
            {digit}
          </button>
        ))}
        <button className="pad-utility" type="button" onClick={removeLast} aria-label="Delete one" title="한 글자 지우기">
          <Delete aria-hidden="true" />
        </button>
        <button className="pad-utility" type="button" onClick={clearValue} aria-label="Clear" title="전체 지우기">
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
    <div className="puzzle-pad choice-pad" aria-label="Puzzle choice controls">
      {choices.map((choice) => (
        <button
          className={`choice-key${answer === choice ? " is-active" : ""}`}
          type="button"
          key={choice}
          onClick={() => setPreset(choice)}
          aria-pressed={answer === choice}
        >
          {choice}
        </button>
      ))}
      <button className="pad-utility" type="button" onClick={removeLast} aria-label="Delete one" title="한 글자 지우기">
        <Delete aria-hidden="true" />
      </button>
      <button className="pad-utility" type="button" onClick={clearValue} aria-label="Clear" title="전체 지우기">
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
  movement: { forward: boolean; back: boolean; left: boolean; right: boolean };
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

function AnniversaryScene({ roomIndex, phase, solvedCount, movement, unlockTick, graphicsQuality, onNearObject, onInteractFocusChange }: SceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const movementRef = useRef(movement);
  const roomIndexRef = useRef(roomIndex);
  const phaseRef = useRef(phase);
  const solvedRef = useRef(solvedCount);
  const unlockTickRef = useRef(unlockTick);
  const graphicsQualityRef = useRef(graphicsQuality);

  useEffect(() => {
    movementRef.current = movement;
  }, [movement]);

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

    const onPointerDown = () => {
      renderer.domElement.requestPointerLock?.();
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
      const speed = 4.4 * delta;
      const forward = new THREE.Vector3(Math.sin(player.yaw), 0, -Math.cos(player.yaw));
      const right = new THREE.Vector3(Math.cos(player.yaw), 0, Math.sin(player.yaw));
      const velocity = new THREE.Vector3();

      if (move.forward) velocity.add(forward);
      if (move.back) velocity.sub(forward);
      if (move.right) velocity.add(right);
      if (move.left) velocity.sub(right);
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
  addPhotoWall(group, room, index);
  addPuzzleDesk(group, room, accentMaterial, glowMaterial);
  addDoorAssembly(group, room, accentMaterial, glowMaterial);
  addRoomSpecifics(group, room, index);
  addCinematicAtmosphere(group, room, index);

  const keyLight = new THREE.PointLight(room.palette[1], index === 4 ? 3.6 : 2.15, 13);
  keyLight.position.set(-3.7, 3.15, -1.6);
  group.add(keyLight);
  group.userData.keyLight = keyLight;

  const portalLight = new THREE.PointLight(room.palette[2], index === 4 ? 4.2 : 2.1, 10);
  portalLight.position.set(4.85, 2.3, -4.05);
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

  [-4.8, -1.6, 1.6, 4.8].forEach((x, lightIndex) => {
    const rail = box(0.035, 0.018, 7.5, edgeGlow, x, 0.13, -0.05);
    rail.userData.statusLight = true;
    rail.userData.baseGlow = 0.12 + lightIndex * 0.03;
    group.add(rail);
  });

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

  addInteractionFocus(group, room);
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

function addRoomSpecifics(group: THREE.Group, room: Room, index: number) {
  addThemedClueCluster(group, room, index);

  if (index === 0) {
    addCurtainWindow(group, room, -5.45, 2.55, -4.35);
    addVines(group, room, -4.2, 3.7, -4.38, 18);
    addHeartParticles(group, room, 18);
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
    color: 0xffe8b3,
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.55, 32, 1, true), beamMaterial);
  beam.position.set(0.26, -0.2, -1.5);
  beam.rotation.x = -Math.PI / 2;
  beam.userData.flashlightBeam = true;

  const light = new THREE.SpotLight(0xffe0aa, 0.62, 7.2, 0.4, 0.72, 1.1);
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

  group.traverse((object) => {
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
