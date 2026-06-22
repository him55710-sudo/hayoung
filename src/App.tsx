import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Backpack,
  Check,
  DoorOpen,
  Expand,
  Heart,
  HelpCircle,
  KeyRound,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Phase = "intro" | "game" | "ending";
type PuzzleKind = "code" | "direction" | "symbol" | "memory" | "final";

type Room = {
  id: number;
  days: string;
  title: string;
  subtitle: string;
  mood: string;
  palette: [number, number, number];
  accent: string;
};

type Puzzle = {
  id: number;
  roomId: number;
  kind: PuzzleKind;
  title: string;
  prompt: string;
  answer: string;
  reward: string;
};

const rooms: Room[] = [
  {
    id: 1,
    days: "1-100",
    title: "풋풋한 시작의 방",
    subtitle: "처음이라 더 환했고, 작은 말에도 설렜던 시간",
    mood: "밝은 햇살, 다이어리, 첫 사진, 작은 자물쇠",
    palette: [0xffc36f, 0xff6f7c, 0x70c9ff],
    accent: "#ffcf7c",
  },
  {
    id: 2,
    days: "101-200",
    title: "조금 더 가까워진 방",
    subtitle: "익숙해졌지만 더 소중해진 약속들",
    mood: "카페 조명, 두 개의 의자, 방향키 패널",
    palette: [0xffa75f, 0x6ee7b7, 0x8dc8ff],
    accent: "#7ee1bd",
  },
  {
    id: 3,
    days: "201-300",
    title: "고난과 화해의 방",
    subtitle: "많이 싸웠지만 끝내 다시 손을 잡았던 날들",
    mood: "비, 갈라진 유리, 번개, 이어 붙인 사진",
    palette: [0x4f6d9a, 0xff7a72, 0xd6d9ff],
    accent: "#91a8ff",
  },
  {
    id: 4,
    days: "301-399",
    title: "다사다난한 밤의 방",
    subtitle: "각자의 문제로 지쳤지만 서로를 놓지 않았던 시간",
    mood: "밤 도시, 흐린 창문, 따뜻한 실내 불빛",
    palette: [0x1e4057, 0xffa36c, 0xffd6ad],
    accent: "#ffb172",
  },
  {
    id: 5,
    days: "400",
    title: "400일의 문",
    subtitle: "구름 위 사진 길을 지나 섬광 속 편지로",
    mood: "하늘, 구름길, 시간순 사진 프레임, 천국 같은 빛",
    palette: [0xf8fbff, 0xffd87a, 0x92c7ff],
    accent: "#f9dc8c",
  },
];

const puzzles: Puzzle[] = [
  {
    id: 1,
    roomId: 1,
    kind: "code",
    title: "첫 자물쇠",
    prompt: "다이어리에 적힌 첫 날짜의 숫자를 입력하는 자리입니다. 정답은 나중에 바꿀 수 있어요.",
    answer: "0100",
    reward: "첫 설렘 열쇠",
  },
  {
    id: 2,
    roomId: 1,
    kind: "memory",
    title: "처음 웃은 사진",
    prompt: "사진 프레임 3개 중 가장 먼저 밝아지는 프레임의 번호를 고르는 문제입니다.",
    answer: "1",
    reward: "밝은 사진 조각",
  },
  {
    id: 3,
    roomId: 2,
    kind: "direction",
    title: "카페 방향키",
    prompt: "바닥에 빛나는 방향 순서를 입력하세요.",
    answer: "URDL",
    reward: "초록 방향 토큰",
  },
  {
    id: 4,
    roomId: 2,
    kind: "symbol",
    title: "약속의 심볼",
    prompt: "컵, 별, 하트, 달 심볼 순서 문제입니다.",
    answer: "STAR",
    reward: "약속 배지",
  },
  {
    id: 5,
    roomId: 3,
    kind: "code",
    title: "비 오는 날의 금고",
    prompt: "싸운 뒤 다시 만난 날을 암호로 쓰는 문제입니다.",
    answer: "0300",
    reward: "화해의 조각",
  },
  {
    id: 6,
    roomId: 3,
    kind: "direction",
    title: "깨진 유리 방향",
    prompt: "갈라진 유리 조각이 가리키는 방향을 순서대로 입력하세요.",
    answer: "LURD",
    reward: "이어 붙인 리본",
  },
  {
    id: 7,
    roomId: 4,
    kind: "memory",
    title: "지친 밤의 선택",
    prompt: "힘들었던 날에도 서로에게 보낸 말 중 가장 따뜻한 말을 고르는 문제입니다.",
    answer: "2",
    reward: "밤 도시 티켓",
  },
  {
    id: 8,
    roomId: 4,
    kind: "symbol",
    title: "흐린 창문의 신호",
    prompt: "창문에 맺힌 불빛 심볼을 순서대로 맞추세요.",
    answer: "MOON",
    reward: "달빛 실마리",
  },
  {
    id: 9,
    roomId: 5,
    kind: "code",
    title: "400일 하늘문",
    prompt: "마지막 문에 새겨진 숫자를 입력하세요.",
    answer: "0400",
    reward: "하늘문 열쇠",
  },
  {
    id: 10,
    roomId: 5,
    kind: "final",
    title: "편지의 마지막 문장",
    prompt: "400일부터 더 잘 만나자는 마음을 담은 최종 확인입니다.",
    answer: "YES",
    reward: "400일 엔딩 편지",
  },
];

const hintPenalties = ["현수한테 바나나우유 사주기", "현수한테 설빙 사주기", "현수랑 방탈출 하러가기"];

function App() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [introUnlocked, setIntroUnlocked] = useState(false);
  const [introSeconds, setIntroSeconds] = useState(0);
  const [buttonOffset, setButtonOffset] = useState({ x: 0, y: 0 });
  const [roomIndex, setRoomIndex] = useState(0);
  const [solvedIds, setSolvedIds] = useState<number[]>([]);
  const [activePuzzleId, setActivePuzzleId] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("WASD로 움직이고 E로 조사하세요. 모바일은 화면 버튼을 사용하면 됩니다.");
  const [hintCount, setHintCount] = useState(0);
  const [movement, setMovement] = useState({ forward: false, back: false, left: false, right: false });

  const currentRoom = rooms[roomIndex];
  const solvedSet = useMemo(() => new Set(solvedIds), [solvedIds]);
  const currentRoomPuzzles = puzzles.filter((puzzle) => puzzle.roomId === currentRoom.id);
  const nextPuzzle = currentRoomPuzzles.find((puzzle) => !solvedSet.has(puzzle.id));
  const activePuzzle = puzzles.find((puzzle) => puzzle.id === activePuzzleId) ?? null;
  const hintsLeft = Math.max(0, 3 - hintCount);
  const inventory = puzzles.filter((puzzle) => solvedSet.has(puzzle.id)).map((puzzle) => puzzle.reward);
  const canAdvanceRoom = currentRoomPuzzles.every((puzzle) => solvedSet.has(puzzle.id));
  const handleNearObject = useCallback((label: string) => {
    setMessage((current) => (current === label ? current : label));
  }, []);

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
    window.advanceTime = () => undefined;
    window.render_game_to_text = () =>
      JSON.stringify({
        phase,
        room: currentRoom.title,
        roomIndex: roomIndex + 1,
        solvedPuzzles: solvedIds.length,
        totalPuzzles: puzzles.length,
        hintsLeft,
        penalties: hintPenalties.slice(0, hintCount),
        nextPuzzle: nextPuzzle?.title ?? "room clear",
        message,
        coordinateSystem: "Three.js scene uses x/z floor plane; player moves through five themed rooms.",
      });
  }, [currentRoom.title, hintCount, hintsLeft, message, nextPuzzle?.title, phase, roomIndex, solvedIds.length]);

  const evadeButton = () => {
    if (introUnlocked) {
      return;
    }
    const direction = Math.random() > 0.5 ? 1 : -1;
    setButtonOffset({
      x: direction * (90 + Math.random() * 120),
      y: (Math.random() - 0.5) * 90,
    });
  };

  const startGame = () => {
    if (!introUnlocked) {
      evadeButton();
      return;
    }
    setPhase("game");
    setMessage("하영이가 첫 번째 방에 들어왔어요. 빛나는 장치를 조사해 첫 문제를 열어보세요.");
  };

  function openNextPuzzle() {
    if (phase !== "game") {
      return;
    }
    if (nextPuzzle) {
      setActivePuzzleId(nextPuzzle.id);
      setAnswer("");
      setMessage(`${nextPuzzle.title}을 열었습니다.`);
      return;
    }
    if (roomIndex < rooms.length - 1) {
      const nextRoom = rooms[roomIndex + 1];
      setRoomIndex((value) => value + 1);
      setMessage(`${nextRoom.title}으로 이동했습니다. 분위기가 달라졌어요.`);
      return;
    }
    setPhase("ending");
  }

  function submitPuzzle() {
    if (!activePuzzle) {
      return;
    }
    if (answer.trim().toUpperCase() !== activePuzzle.answer) {
      setMessage("아직 맞지 않아요. 지금은 초안이라 정답은 패널 안 예시를 참고해도 됩니다.");
      return;
    }
    setSolvedIds((ids) => (ids.includes(activePuzzle.id) ? ids : [...ids, activePuzzle.id]));
    setMessage(`${activePuzzle.reward} 획득! 다음 기억으로 이어집니다.`);
    setActivePuzzleId(null);
    setAnswer("");

    if (activePuzzle.id === 10) {
      window.setTimeout(() => setPhase("ending"), 400);
    }
  }

  function useHint() {
    if (hintCount >= 3) {
      setMessage("힌트 3번을 모두 썼어요. 이제 하영이의 감으로 가야 합니다.");
      return;
    }
    const penalty = hintPenalties[hintCount];
    setHintCount((count) => count + 1);
    setMessage(`힌트 사용! 벌칙: ${penalty}. 다음 문제 정답 형식은 ${nextPuzzle?.kind ?? "final"}입니다.`);
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
            <h1>임현수와의 400일을 함께하실 준비가 되셨나요?</h1>
            <p>버튼은 조금 부끄러워서 도망갑니다. 잠깐만 기다리면 마음을 열어요.</p>
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
        <section className="game-screen" aria-label="400일 3D 방탈출">
          <AnniversaryScene
            roomIndex={roomIndex}
            phase={phase}
            solvedCount={solvedIds.length}
            movement={movement}
            onNearObject={handleNearObject}
          />

          <header className="hud top-hud">
            <div className="hud-cluster brand-chip">
              <Heart aria-hidden="true" />
              <span>400일의 방</span>
            </div>
            <div className="hud-cluster progress-chip">
              <span>Room {roomProgress}</span>
              <span>Puzzle {puzzleProgress}</span>
              <span>Hints {hintsLeft}</span>
            </div>
            <div className="hud-cluster icon-actions">
              <button type="button" onClick={useHint} title="힌트 사용">
                <HelpCircle aria-hidden="true" />
              </button>
              <button type="button" onClick={toggleFullscreen} title="전체화면">
                <Expand aria-hidden="true" />
              </button>
              <button type="button" onClick={() => window.location.reload()} title="처음부터">
                <RotateCcw aria-hidden="true" />
              </button>
            </div>
          </header>

          <aside className="objective-panel">
            <span>{currentRoom.days}일</span>
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
              <Backpack aria-hidden="true" />
              Inventory
            </div>
            <div className="item-slots">
              {Array.from({ length: 10 }).map((_, index) => (
                <div className="item-slot" key={index}>
                  {inventory[index] ? <span>{inventory[index]}</span> : null}
                </div>
              ))}
            </div>
          </footer>

          <button className="interact-button" type="button" onClick={openNextPuzzle}>
            {canAdvanceRoom && roomIndex < rooms.length - 1 ? <DoorOpen aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
            {nextPuzzle ? "E 조사하기" : roomIndex < rooms.length - 1 ? "다음 방" : "엔딩 보기"}
          </button>

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

          {activePuzzle && (
            <div className="modal-layer">
              <section className="puzzle-modal" role="dialog" aria-label={activePuzzle.title}>
                <button className="close-button" type="button" onClick={() => setActivePuzzleId(null)}>
                  <X aria-hidden="true" />
                </button>
                <span>문제 {activePuzzle.id}/10 · {kindLabel(activePuzzle.kind)}</span>
                <h2>{activePuzzle.title}</h2>
                <p>{activePuzzle.prompt}</p>
                <div className="answer-row">
                  <input
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder={`초안 정답: ${activePuzzle.answer}`}
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
              <span>400일의 문이 열렸어</span>
              <h2>하영아, 400일부터는 더 다정하게 같이 걷자.</h2>
              <p>
                지나온 날들에는 풋풋함도, 다툼도, 지친 밤도 있었지만 결국 우리는 서로의 편으로
                돌아왔어. 앞으로의 방은 혼자 푸는 문제가 아니라, 둘이 같이 만드는 추억이면 좋겠어.
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function kindLabel(kind: PuzzleKind) {
  return {
    code: "자물쇠",
    direction: "방향키",
    symbol: "심볼",
    memory: "추억",
    final: "마지막 문",
  }[kind];
}

type SceneProps = {
  roomIndex: number;
  phase: Phase;
  solvedCount: number;
  movement: { forward: boolean; back: boolean; left: boolean; right: boolean };
  onNearObject: (label: string) => void;
};

function AnniversaryScene({ roomIndex, phase, solvedCount, movement, onNearObject }: SceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const movementRef = useRef(movement);
  const roomIndexRef = useRef(roomIndex);
  const phaseRef = useRef(phase);
  const solvedRef = useRef(solvedCount);

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
    if (!mountRef.current) {
      return;
    }

    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x120f12, 0.016);

    const camera = new THREE.PerspectiveCamera(58, mount.clientWidth / mount.clientHeight, 0.1, 260);
    camera.position.set(0, 4.8, 8.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const ambient = new THREE.HemisphereLight(0xfff1d2, 0x25314d, 1.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffd79a, 3.8);
    sun.position.set(-5, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    const fill = new THREE.PointLight(0x7bc7ff, 2.2, 60);
    fill.position.set(6, 5, 4);
    scene.add(fill);

    const player = makeGirlCharacter();
    player.position.set(0, 0.05, 2.3);
    scene.add(player);

    const reticleLight = new THREE.PointLight(0xffffff, 1.2, 7);
    scene.add(reticleLight);

    const roomGroups = rooms.map((room, index) => createRoom(room, index));
    roomGroups.forEach((group) => root.add(group));

    const clouds = createCloudPath();
    clouds.visible = false;
    root.add(clouds);

    let lastFrameTime = performance.now();
    let elapsedTime = 0;
    let animation = 0;
    const playerVelocity = new THREE.Vector3();

    const resize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    const animate = () => {
      animation = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastFrameTime) / 1000, 0.033);
      lastFrameTime = now;
      elapsedTime += delta;
      const activeRoom = rooms[roomIndexRef.current];
      const targetX = roomIndexRef.current * 22;
      const move = movementRef.current;
      const speed = 5.2 * delta;

      playerVelocity.set(0, 0, 0);
      if (move.forward) playerVelocity.z -= speed;
      if (move.back) playerVelocity.z += speed;
      if (move.left) playerVelocity.x -= speed;
      if (move.right) playerVelocity.x += speed;

      player.position.x = THREE.MathUtils.clamp(player.position.x + playerVelocity.x, targetX - 6.2, targetX + 6.2);
      player.position.z = THREE.MathUtils.clamp(player.position.z + playerVelocity.z, -3.2, 3.7);
      player.position.y = 0.05 + Math.sin(elapsedTime * 5.8) * (playerVelocity.length() > 0 ? 0.045 : 0.018);

      const targetCamera = new THREE.Vector3(player.position.x + 0.15, 4.9, player.position.z + 7.5);
      camera.position.lerp(targetCamera, 0.055);
      camera.lookAt(player.position.x, 1.45, player.position.z - 2.2);

      roomGroups.forEach((group, index) => {
        const visible = Math.abs(index - roomIndexRef.current) <= 1;
        group.visible = visible;
        group.position.y = THREE.MathUtils.lerp(group.position.y, index === roomIndexRef.current ? 0 : -0.6, 0.05);
      });

      clouds.visible = phaseRef.current === "ending" || roomIndexRef.current === 4;
      clouds.children.forEach((cloud, index) => {
        cloud.position.y = 0.15 + Math.sin(elapsedTime * 1.3 + index) * 0.08;
      });

      reticleLight.position.set(player.position.x, 2.2, player.position.z - 2.5);
      reticleLight.color.setHex(activeRoom.palette[1]);
      scene.background = new THREE.Color(activeRoom.palette[0]).lerp(new THREE.Color(0x101018), roomIndexRef.current === 4 ? 0.18 : 0.58);

      const nearPuzzle = Math.abs(player.position.z - 0.2) < 1.2;
      if (nearPuzzle && Math.floor(elapsedTime) % 5 === 0) {
        onNearObject("빛나는 장치 근처입니다. E 또는 조사하기 버튼으로 문제를 열 수 있어요.");
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animation);
      resizeObserver.disconnect();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [onNearObject]);

  return <div className="three-mount" ref={mountRef} data-testid="three-scene" />;
}

function createRoom(room: Room, index: number) {
  const group = new THREE.Group();
  group.position.x = index * 22;

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: room.palette[0],
    roughness: 0.58,
    metalness: 0.08,
  });
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(room.palette[0]).lerp(new THREE.Color(0x1a1720), 0.38),
    roughness: 0.7,
    metalness: 0.03,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: room.palette[1],
    emissive: room.palette[1],
    emissiveIntensity: 0.28,
    roughness: 0.28,
  });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.35, 9), floorMaterial);
  floor.position.y = -0.18;
  floor.receiveShadow = true;
  group.add(floor);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(14, 5, 0.3), wallMaterial);
  backWall.position.set(0, 2.3, -4.6);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5, 9), wallMaterial);
  leftWall.position.set(-7.1, 2.3, 0);
  leftWall.receiveShadow = true;
  group.add(leftWall);

  const rightWall = leftWall.clone();
  rightWall.position.x = 7.1;
  group.add(rightWall);

  const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.1, 0.24), accentMaterial);
  door.position.set(4.8, 1.5, -4.42);
  door.castShadow = true;
  group.add(door);

  const device = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1, 0.7), accentMaterial);
  device.position.set(0, 0.65, -1.35);
  device.castShadow = true;
  group.add(device);

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 1.1, 24), accentMaterial);
  pedestal.position.set(-3.2, 0.55, -1);
  pedestal.castShadow = true;
  group.add(pedestal);

  for (let i = 0; i < 6; i += 1) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.62, 0.08),
      new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? room.palette[2] : 0xfff0d4,
        roughness: 0.5,
        emissive: i % 2 === 0 ? room.palette[2] : 0x000000,
        emissiveIntensity: i % 2 === 0 ? 0.1 : 0,
      }),
    );
    frame.position.set(-5.6 + i * 1.35, 2.3 + Math.sin(i) * 0.4, -4.25);
    frame.castShadow = true;
    group.add(frame);
  }

  const portalRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.35, 0.06, 12, 52),
    new THREE.MeshStandardMaterial({
      color: room.palette[2],
      emissive: room.palette[2],
      emissiveIntensity: 1.6,
      roughness: 0.2,
    }),
  );
  portalRing.position.set(4.8, 2.05, -4.25);
  portalRing.rotation.x = Math.PI / 2;
  group.add(portalRing);

  const lamp = new THREE.PointLight(room.palette[1], 3.8, 12);
  lamp.position.set(-3.2, 3.2, -0.8);
  group.add(lamp);

  if (index === 2 || index === 3) {
    const rainMaterial = new THREE.MeshStandardMaterial({ color: 0xa7c5ff, emissive: 0x5c88ff, emissiveIntensity: 0.4 });
    for (let i = 0; i < 30; i += 1) {
      const drop = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.7, 0.025), rainMaterial);
      drop.position.set(-6 + Math.random() * 12, 1 + Math.random() * 4, -4.1 + Math.random() * 0.2);
      group.add(drop);
    }
  }

  if (index === 4) {
    const glow = new THREE.PointLight(0xffffff, 8, 20);
    glow.position.set(0, 5, -2);
    group.add(glow);
  }

  return group;
}

function createCloudPath() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.82,
    transparent: true,
    opacity: 0.88,
  });
  for (let i = 0; i < 18; i += 1) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.55 + Math.random() * 0.45, 18, 12), material);
    cloud.position.set(88 + (Math.random() - 0.5) * 8, 0.1 + Math.random() * 0.4, -3 + i * 0.42);
    cloud.scale.set(1.7, 0.36, 0.9);
    group.add(cloud);
  }
  return group;
}

function makeGirlCharacter() {
  const group = new THREE.Group();
  const dress = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.42, 1.0, 8, 18),
    new THREE.MeshStandardMaterial({ color: 0xff7d8e, roughness: 0.48, metalness: 0.02 }),
  );
  dress.position.y = 0.95;
  dress.castShadow = true;
  group.add(dress);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0xffd7bd, roughness: 0.5 }),
  );
  head.position.y = 1.78;
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.74),
    new THREE.MeshStandardMaterial({ color: 0x2b1715, roughness: 0.72 }),
  );
  hair.position.set(0, 1.86, -0.03);
  hair.castShadow = true;
  group.add(hair);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.018, 8, 42),
    new THREE.MeshStandardMaterial({ color: 0xfff2a8, emissive: 0xffd978, emissiveIntensity: 1.1 }),
  );
  halo.position.y = 2.16;
  halo.rotation.x = Math.PI / 2;
  group.add(halo);

  return group;
}

export default App;
