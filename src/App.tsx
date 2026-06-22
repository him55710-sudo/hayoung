import {
  Box,
  Cloud,
  DoorClosed,
  Gamepad2,
  Github,
  Heart,
  KeyRound,
  Lightbulb,
  Lock,
  Moon,
  NotebookTabs,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Mode = "title" | "playing" | "complete";
type InventoryItem = "gold_key" | "heart_piece" | "promise_note";
type ClueId = "desk" | "notebook" | "window" | "box" | "door";

const inventoryLabels: Record<InventoryItem, string> = {
  gold_key: "작은 금색 열쇠",
  heart_piece: "하트 조각",
  promise_note: "약속 노트",
};

const clueText: Record<ClueId, string> = {
  desk: "책상 위 열쇠가 따뜻하다. 첫 번째 문은 마음으로 열린다.",
  notebook: "약속 노트에 0, 5, 0, 0 네 숫자가 동그라미 쳐져 있다.",
  window: "창밖 달빛이 문 위의 별, 하트, 달, 다이아 순서를 비춘다.",
  box: "상자는 열쇠를 기다리고 있다. 안쪽에는 하트 조각이 숨겨져 있다.",
  door: "문 손잡이가 잠겨 있다. 500일의 암호와 하트 조각이 필요하다.",
};

function App() {
  const [mode, setMode] = useState<Mode>("title");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [visited, setVisited] = useState<ClueId[]>([]);
  const [message, setMessage] = useState("방 안의 단서를 찾아 500일의 문을 열어보자.");
  const [code, setCode] = useState("");

  const inventorySet = useMemo(() => new Set(inventory), [inventory]);
  const visitedSet = useMemo(() => new Set(visited), [visited]);
  const canOpenDoor = code === "0500" && inventorySet.has("heart_piece");

  useEffect(() => {
    if (mode !== "playing") {
      return;
    }
    const timer = window.setInterval(() => setElapsedMs((value) => value + 1000), 1000);
    return () => window.clearInterval(timer);
  }, [mode]);

  useEffect(() => {
    window.advanceTime = (ms: number) => {
      setElapsedMs((value) => value + Math.max(0, ms));
    };
    window.render_game_to_text = () =>
      JSON.stringify({
        mode,
        elapsedSeconds: Math.floor(elapsedMs / 1000),
        inventory: inventory.map((item) => inventoryLabels[item]),
        visited,
        currentMessage: message,
        code,
        objective:
          mode === "complete"
            ? "문이 열렸다."
            : "단서를 모아 암호 0500을 입력하고 하트 조각으로 문을 연다.",
        coordinateSystem:
          "DOM hotspots are positioned as percentages over the room image; origin is top-left.",
      });
  }, [code, elapsedMs, inventory, message, mode, visited]);

  const addInventory = (item: InventoryItem) => {
    setInventory((items) => (items.includes(item) ? items : [...items, item]));
  };

  const visit = (id: ClueId) => {
    setVisited((items) => (items.includes(id) ? items : [...items, id]));
    setMessage(clueText[id]);

    if (id === "desk") {
      addInventory("gold_key");
    }

    if (id === "notebook") {
      addInventory("promise_note");
    }

    if (id === "box") {
      if (inventorySet.has("gold_key")) {
        addInventory("heart_piece");
        setMessage("열쇠가 상자를 열었다. 안쪽에서 하트 조각을 찾았다.");
      } else {
        setMessage("상자에는 작은 자물쇠가 있다. 먼저 열쇠를 찾아야 한다.");
      }
    }

    if (id === "door") {
      if (canOpenDoor) {
        setMode("complete");
        setMessage("문이 열렸다. 다음 방으로 가는 길에 하영이를 위한 편지가 놓여 있다.");
      } else if (code !== "0500") {
        setMessage("문 위 패널이 반짝인다. 네 자리 암호가 필요하다.");
      } else {
        setMessage("암호는 맞았다. 문 중앙의 빈 하트 자리에 조각을 끼워야 한다.");
      }
    }
  };

  const checkCode = () => {
    if (code === "0500") {
      setMessage("암호가 맞았다. 이제 하트 조각을 찾아 문에 끼우자.");
      return;
    }
    setMessage("패널이 잠깐 붉게 빛났다. 숫자를 다시 살펴보자.");
  };

  const reset = () => {
    setMode("title");
    setElapsedMs(0);
    setInventory([]);
    setVisited([]);
    setCode("");
    setMessage("방 안의 단서를 찾아 500일의 문을 열어보자.");
  };

  const start = () => {
    setMode("playing");
    setMessage("하영이를 위한 500일의 방. 가장 가까운 단서부터 눌러보자.");
  };

  const elapsed = new Date(elapsedMs).toISOString().slice(14, 19);

  return (
    <main className="app-shell">
      <section className="game-frame" aria-label="500일 기념 방탈출 게임">
        <img className="room-art" src="/images/anniversary-room.png" alt="" />
        <div className="room-vignette" />

        <header className="top-bar">
          <div className="brand">
            <Heart aria-hidden="true" />
            <span>500일의 방</span>
          </div>
          <div className="status-strip">
            <span>{elapsed}</span>
            <span>{visited.length}/5 clues</span>
          </div>
          <div className="tool-links" aria-label="프로젝트 연결 상태">
            <span title="GitHub 저장소 준비됨">
              <Github aria-hidden="true" />
            </span>
            <span title="Vercel 배포 준비됨">
              <Cloud aria-hidden="true" />
            </span>
            <span title="Unreal MCP 설정 파일 포함">
              <Gamepad2 aria-hidden="true" />
            </span>
          </div>
        </header>

        {mode === "title" && (
          <div className="title-layer">
            <h1>500일의 방</h1>
            <p>우리의 약속을 단서로 잠긴 문을 열어보자.</p>
            <button className="primary-action" type="button" onClick={start}>
              <Sparkles aria-hidden="true" />
              START
            </button>
          </div>
        )}

        {mode !== "title" && (
          <>
            <Hotspot
              id="desk"
              active={visitedSet.has("desk")}
              label="책상 위 열쇠"
              icon={<KeyRound aria-hidden="true" />}
              style={{ left: "47%", top: "70%" }}
              onClick={() => visit("desk")}
            />
            <Hotspot
              id="notebook"
              active={visitedSet.has("notebook")}
              label="약속 노트"
              icon={<NotebookTabs aria-hidden="true" />}
              style={{ left: "20%", top: "66%" }}
              onClick={() => visit("notebook")}
            />
            <Hotspot
              id="window"
              active={visitedSet.has("window")}
              label="창가 달빛"
              icon={<Moon aria-hidden="true" />}
              style={{ left: "78%", top: "23%" }}
              onClick={() => visit("window")}
            />
            <Hotspot
              id="box"
              active={visitedSet.has("box")}
              label="오른쪽 상자"
              icon={<Box aria-hidden="true" />}
              style={{ left: "86%", top: "58%" }}
              onClick={() => visit("box")}
            />
            <Hotspot
              id="door"
              active={mode === "complete"}
              label="잠긴 문"
              icon={mode === "complete" ? <DoorClosed aria-hidden="true" /> : <Lock aria-hidden="true" />}
              style={{ left: "43%", top: "34%" }}
              onClick={() => visit("door")}
            />
            {mode === "playing" && (
              <div className="room-goal-panel" aria-label="문 패널 상태">
                <span>LOCKED</span>
                <strong>0500</strong>
                <small>별 · 하트 · 달 · 다이아</small>
              </div>
            )}
          </>
        )}

        {mode !== "title" && (
          <>
            <aside className="side-panel" aria-label="단서와 암호">
              <div className="message-row">
                <Lightbulb aria-hidden="true" />
                <p>{message}</p>
              </div>

              <div className="code-panel">
                <label htmlFor="door-code">문 암호</label>
                <div className="code-controls">
                  <input
                    id="door-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="0000"
                    disabled={mode === "complete"}
                  />
                  <button type="button" onClick={checkCode} disabled={mode === "complete"}>
                    확인
                  </button>
                </div>
              </div>
            </aside>

            <footer className="inventory-bar" aria-label="인벤토리">
              <span className="inventory-label">INVENTORY</span>
              <div className="slots">
                {Array.from({ length: 6 }).map((_, index) => {
                  const item = inventory[index];
                  return (
                    <div className="slot" key={index}>
                      {item === "gold_key" && <KeyRound aria-label={inventoryLabels[item]} />}
                      {item === "heart_piece" && <Heart aria-label={inventoryLabels[item]} />}
                      {item === "promise_note" && <NotebookTabs aria-label={inventoryLabels[item]} />}
                    </div>
                  );
                })}
              </div>
            </footer>
          </>
        )}

        {mode === "complete" && (
          <div className="complete-layer" role="dialog" aria-label="탈출 성공">
            <h2>문이 열렸어.</h2>
            <p>500일 동안 쌓인 작은 단서들이 다음 추억으로 이어진다.</p>
            <button className="primary-action" type="button" onClick={reset}>
              다시 시작
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

type HotspotProps = {
  id: ClueId;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  style: React.CSSProperties;
};

function Hotspot({ active, icon, label, onClick, style }: HotspotProps) {
  return (
    <button className={`hotspot${active ? " is-active" : ""}`} style={style} type="button" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default App;
