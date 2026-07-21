import { Check, Music, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { clueRecords, inventoryItems, memoryFrames, shuffledFrameKeys, colorSequenceAnswer, frameOrderAnswer } from "../game/data/memories";
import { vita500LetterLines, steakWrongLine } from "../game/data/dialogue";
import { FLOOR_ANSWER_CELL, matchesAnswer, room1Puzzles } from "../game/data/room1Puzzles";
import type { PuzzleDefinition } from "../game/data/room1Puzzles";
import type { GameAction } from "../game/state/gameReducer";
import type { GameState } from "../game/state/gameState";
import { audioManager } from "../game/systems/AudioManager";
import { room1Visual } from "../game/scenes/room1SceneState";

type Room1PuzzleModalProps = {
  puzzle: PuzzleDefinition;
  state: GameState;
  dispatch: (action: GameAction) => void;
  onSolve: (puzzle: PuzzleDefinition) => void;
  onClose: () => void;
  onMessage: (text: string) => void;
};

const SOLVE_HOLD_MS = 1150;

export function Room1PuzzleModal({ puzzle, state, dispatch, onSolve, onClose, onMessage }: Room1PuzzleModalProps) {
  const [justSolved, setJustSolved] = useState(false);
  const [errorTick, setErrorTick] = useState(0);
  const [errorText, setErrorText] = useState<string | null>(null);
  const solveTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (solveTimer.current) {
        window.clearTimeout(solveTimer.current);
      }
    };
  }, []);

  const puzzleIndex = room1Puzzles.findIndex((entry) => entry.id === puzzle.id);

  const failFeedback = (text: string) => {
    setErrorText(text);
    setErrorTick((tick) => tick + 1);
    onMessage(text);
  };

  const succeed = () => {
    if (justSolved) {
      return;
    }
    setErrorText(null);
    setJustSolved(true);
    solveTimer.current = window.setTimeout(() => {
      onSolve(puzzle);
    }, SOLVE_HOLD_MS);
  };

  return (
    <div className="modal-layer memory-modal-layer">
      <section
        className={`memory-modal memory-modal--${puzzle.type}${justSolved ? " is-solved" : ""}`}
        role="dialog"
        aria-label={puzzle.title}
        aria-live="polite"
        data-puzzle={puzzle.id}
        data-error-tick={errorTick}
      >
        <button
          className="close-button"
          type="button"
          aria-label="닫기"
          onClick={() => {
            if (!justSolved) {
              onClose();
            }
          }}
          disabled={justSolved}
        >
          <X aria-hidden="true" />
        </button>

        <header className="memory-modal-head">
          <span className="memory-kicker">
            기억 {puzzleIndex + 1}/8 · {typeLabel(puzzle.type)}
          </span>
          <h2>{puzzle.title}</h2>
          <p>{puzzle.prompt}</p>
        </header>

        {puzzle.type === "word" && puzzle.id === "room1-vita500" && (
          <VitaLetterPuzzle puzzle={puzzle} onFail={failFeedback} onSuccess={succeed} solved={justSolved} />
        )}
        {puzzle.type === "sequence" && (
          <FrameSequencePuzzle dispatch={dispatch} onFail={failFeedback} onSuccess={succeed} solved={justSolved} />
        )}
        {puzzle.type === "inventory_use" && (
          <KeyringPuzzle state={state} onFail={failFeedback} onSuccess={succeed} solved={justSolved} />
        )}
        {puzzle.type === "audio" && (
          <SongPuzzle puzzle={puzzle} onFail={failFeedback} onSuccess={succeed} solved={justSolved} />
        )}
        {puzzle.type === "placement" && (
          <PaintingPuzzle state={state} onFail={failFeedback} onSuccess={succeed} solved={justSolved} />
        )}
        {puzzle.type === "floor_choice" && (
          <FloorNinePuzzle dispatch={dispatch} onFail={failFeedback} onSuccess={succeed} solved={justSolved} />
        )}
        {puzzle.type === "spatial" && (
          <BeefCutPuzzle puzzle={puzzle} onFail={failFeedback} onSuccess={succeed} solved={justSolved} />
        )}
        {puzzle.type === "final_choice" && (
          <SteakChoicePuzzle dispatch={dispatch} onFail={failFeedback} onSuccess={succeed} solved={justSolved} />
        )}

        {errorText && !justSolved && (
          <p className="memory-error" role="status">
            {errorText}
          </p>
        )}

        {justSolved && (
          <div className="memory-solved-banner" role="status">
            <Check aria-hidden="true" />
            <span>{puzzle.successNote}</span>
          </div>
        )}

        {justSolved && (
          <div className="lock-success-burst" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}
      </section>
    </div>
  );
}

function typeLabel(type: PuzzleDefinition["type"]) {
  return {
    word: "단어 자물쇠",
    sequence: "시간순 정렬",
    inventory_use: "소지품 사용",
    audio: "음악 단서",
    placement: "장치 삽입",
    floor_choice: "바닥 타일",
    spatial: "부위 배치",
    final_choice: "마지막 선택",
  }[type];
}

function AnswerRow({
  placeholder,
  inputMode,
  disabled,
  onSubmit,
  submitLabel = "확인",
  testId,
}: {
  placeholder: string;
  inputMode?: "text" | "numeric";
  disabled: boolean;
  onSubmit: (value: string) => void;
  submitLabel?: string;
  testId: string;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      className="memory-answer-row"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled) {
          onSubmit(value);
        }
      }}
    >
      <input
        className="memory-answer-input"
        data-testid={testId}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode ?? "text"}
        maxLength={24}
        autoCapitalize="characters"
        spellCheck={false}
        autoFocus
        disabled={disabled}
      />
      <button className="memory-answer-submit" type="submit" disabled={disabled}>
        <Check aria-hidden="true" />
        {submitLabel}
      </button>
    </form>
  );
}

function VitaLetterPuzzle({
  puzzle,
  onFail,
  onSuccess,
  solved,
}: {
  puzzle: PuzzleDefinition;
  onFail: (text: string) => void;
  onSuccess: () => void;
  solved: boolean;
}) {
  return (
    <div className="memory-body vita-letter-body">
      <div className="vita-letter" aria-label="봉인된 편지">
        <span className="vita-wax-seal" aria-hidden="true" />
        {vita500LetterLines.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
      <AnswerRow
        placeholder="정확한 이름을 입력"
        disabled={solved}
        testId="vita-answer-input"
        onSubmit={(value) => {
          if (matchesAnswer(puzzle, value)) {
            audioManager.play("seal-open");
            onSuccess();
            return;
          }
          audioManager.play("wrong-answer");
          onFail("밀랍 봉인이 움직이지 않는다. 편지를 다시 읽어보자.");
        }}
      />
    </div>
  );
}

function FrameSequencePuzzle({
  dispatch,
  onFail,
  onSuccess,
  solved,
}: {
  dispatch: (action: GameAction) => void;
  onFail: (text: string) => void;
  onSuccess: () => void;
  solved: boolean;
}) {
  const [step, setStep] = useState<"arrange" | "colors">("arrange");
  const [pendingOrder, setPendingOrder] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState<string[]>([]);
  const framesByKey = useMemo(() => new Map(memoryFrames.map((frame) => [frame.key, frame])), []);

  const toggleFrame = (key: string) => {
    if (solved || step !== "arrange") {
      return;
    }
    audioManager.play("frame-move");
    setPendingOrder((order) => (order.includes(key) ? order.filter((entry) => entry !== key) : [...order, key]));
  };

  const checkOrder = () => {
    if (pendingOrder.length !== 4) {
      onFail("네 개의 액자를 모두 순서에 올려야 한다.");
      return;
    }
    const correct = frameOrderAnswer.every((key, index) => pendingOrder[index] === key);
    if (!correct) {
      audioManager.play("wrong-answer");
      setPendingOrder([]);
      onFail("액자 사이의 황동 선이 이어지지 않는다. 순서가 맞지 않는 것 같다.");
      return;
    }
    dispatch({ type: "SET_FRAME_ORDER", order: pendingOrder });
    audioManager.play("unlock");
    setStep("colors");
  };

  const pressColor = (colorKey: string) => {
    if (solved || step !== "colors") {
      return;
    }
    audioManager.play("color-button");
    const next = [...colorInput, colorKey];
    setColorInput(next);
    if (next.length < 4) {
      return;
    }
    const correct = colorSequenceAnswer.every((key, index) => next[index] === key);
    if (!correct) {
      audioManager.play("wrong-answer");
      setColorInput([]);
      onFail("색 버튼이 낮게 울리며 되돌아온다. 점등된 색의 순서를 다시 봐야 한다.");
      return;
    }
    dispatch({ type: "SET_COLOR_SEQUENCE", colors: next });
    audioManager.play("pickup");
    onSuccess();
  };

  return (
    <div className="memory-body frame-sequence-body" data-step={step}>
      <div className="frame-rail" aria-label="기억의 액자들">
        {shuffledFrameKeys.map((key) => {
          const frame = framesByKey.get(key)!;
          const slot = pendingOrder.indexOf(key);
          const lit = step === "colors";
          return (
            <button
              key={key}
              type="button"
              className={`frame-card${slot >= 0 ? " is-picked" : ""}${lit ? " is-lit" : ""}`}
              data-frame={key}
              style={lit ? ({ "--frame-color": frame.colorHex } as React.CSSProperties) : undefined}
              onClick={() => toggleFrame(key)}
              disabled={solved || step === "colors"}
            >
              <span className="frame-photo" aria-hidden="true">
                {frame.image ? <img src={frame.image} alt="" /> : <i className="frame-todo">TODO_USER_MEMORY</i>}
              </span>
              <strong>{frame.title}</strong>
              <em>{frame.caption}</em>
              {slot >= 0 && <b className="frame-slot-badge">{slot + 1}</b>}
              {lit && <span className="frame-color-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {step === "arrange" ? (
        <div className="frame-actions">
          <p className="frame-guide">액자를 시간 순서대로 눌러 1번부터 4번까지 배치하라.</p>
          <div className="frame-buttons">
            <button className="frame-reset-button" type="button" onClick={() => setPendingOrder([])} disabled={solved}>
              <RotateCcw aria-hidden="true" />
              다시 놓기
            </button>
            <button className="frame-check-button" type="button" onClick={checkOrder} disabled={solved || pendingOrder.length !== 4}>
              <Check aria-hidden="true" />
              액자 점등
            </button>
          </div>
        </div>
      ) : (
        <div className="frame-actions">
          <p className="frame-guide">액자 아래 점등된 색을 순서대로 입력하라.</p>
          <div className="color-console" aria-label="색상 버튼 콘솔">
            {memoryFrames.map((frame) => (
              <button
                key={frame.colorKey}
                type="button"
                className="color-key"
                data-color={frame.colorKey}
                style={{ "--key-color": frame.colorHex } as React.CSSProperties}
                aria-label={`${frame.colorName} 버튼`}
                onClick={() => pressColor(frame.colorKey)}
                disabled={solved}
              />
            ))}
          </div>
          <div className="color-readout" aria-label="입력한 색 순서">
            {Array.from({ length: 4 }).map((_, index) => {
              const key = colorInput[index];
              const frame = memoryFrames.find((entry) => entry.colorKey === key);
              return (
                <span
                  key={index}
                  className={key ? "is-filled" : ""}
                  style={frame ? ({ "--key-color": frame.colorHex } as React.CSSProperties) : undefined}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const keyringTargets = [
  { id: "violin-doll", label: "바이올린 인형의 빈 고리", correct: true },
  { id: "music-box", label: "오르골 태엽", correct: false },
  { id: "desk-lock", label: "책상 서랍 자물쇠", correct: false },
  { id: "gift-ribbon", label: "선물 상자 리본", correct: false },
];

function KeyringPuzzle({
  state,
  onFail,
  onSuccess,
  solved,
}: {
  state: GameState;
  onFail: (text: string) => void;
  onSuccess: () => void;
  solved: boolean;
}) {
  const [selectedItem, setSelectedItem] = useState<string | null>(
    state.inventoryItemIds.includes("violin-keyring") ? "violin-keyring" : null,
  );

  return (
    <div className="memory-body keyring-body">
      <div className="keyring-inventory" aria-label="소지품">
        <span className="keyring-guide">사용할 물건</span>
        {state.inventoryItemIds.length === 0 && <em className="keyring-empty">가진 물건이 없다.</em>}
        {state.inventoryItemIds.map((itemId) => (
          <button
            key={itemId}
            type="button"
            className={`keyring-item${selectedItem === itemId ? " is-selected" : ""}`}
            data-item={itemId}
            onClick={() => setSelectedItem(itemId)}
            disabled={solved}
          >
            {inventoryItems[itemId]?.label ?? itemId}
          </button>
        ))}
      </div>
      <div className="keyring-targets" aria-label="장착할 위치">
        <span className="keyring-guide">어디에 사용할까?</span>
        <div className="keyring-target-grid">
          {keyringTargets.map((target) => (
            <button
              key={target.id}
              type="button"
              className="keyring-target"
              data-target={target.id}
              onClick={() => {
                if (solved) {
                  return;
                }
                if (!selectedItem) {
                  onFail("먼저 사용할 물건을 골라야 한다.");
                  return;
                }
                if (selectedItem === "violin-keyring" && target.correct) {
                  audioManager.play("keyring-attach");
                  room1Visual.violinPlaying = true;
                  window.setTimeout(() => audioManager.playCarouselWaltz(), 450);
                  onSuccess();
                  return;
                }
                audioManager.play("wrong-answer");
                onFail("키링이 걸리지 않는다. 여기는 아닌 것 같다.");
              }}
              disabled={solved}
            >
              {target.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SongPuzzle({
  puzzle,
  onFail,
  onSuccess,
  solved,
}: {
  puzzle: PuzzleDefinition;
  onFail: (text: string) => void;
  onSuccess: () => void;
  solved: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const playTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (playTimer.current) {
        window.clearTimeout(playTimer.current);
      }
      audioManager.stopMelody();
    };
  }, []);

  return (
    <div className="memory-body song-body">
      <button
        className={`song-play-button${playing ? " is-playing" : ""}`}
        type="button"
        onClick={() => {
          audioManager.playCarouselWaltz();
          setPlaying(true);
          if (playTimer.current) {
            window.clearTimeout(playTimer.current);
          }
          playTimer.current = window.setTimeout(() => setPlaying(false), audioManager.carouselWaltzDuration * 1000);
        }}
        disabled={solved}
      >
        <Music aria-hidden="true" />
        {playing ? "연주 중..." : "바이올린 연주 다시 듣기"}
      </button>
      <p className="song-placeholder-note">임시 자체 연주 버전입니다. 실제 연주 음원은 추후 교체 (TODO_USER_MEMORY)</p>
      <AnswerRow
        placeholder="곡의 제목을 입력"
        disabled={solved}
        testId="song-answer-input"
        onSubmit={(value) => {
          if (matchesAnswer(puzzle, value)) {
            audioManager.play("carousel-detach");
            onSuccess();
            return;
          }
          audioManager.play("wrong-answer");
          onFail("오르골이 잠시 멈칫한다. 그 제목이 아니다.");
        }}
      />
    </div>
  );
}

function PaintingPuzzle({
  state,
  onFail,
  onSuccess,
  solved,
}: {
  state: GameState;
  onFail: (text: string) => void;
  onSuccess: () => void;
  solved: boolean;
}) {
  const [selectedItem, setSelectedItem] = useState<string | null>(
    state.inventoryItemIds.includes("carousel-model") ? "carousel-model" : null,
  );

  return (
    <div className="memory-body painting-body">
      <div className="painting-canvas" aria-label="놀이공원 그림">
        <span className="painting-sky" aria-hidden="true" />
        <span className="painting-wheel" aria-hidden="true" />
        <span className="painting-path" aria-hidden="true" />
        <button
          className={`painting-slot${solved ? " is-filled" : ""}`}
          type="button"
          aria-label="회전목마 빈자리"
          onClick={() => {
            if (solved) {
              return;
            }
            if (selectedItem !== "carousel-model") {
              onFail("빈자리에 끼울 것을 먼저 골라야 한다.");
              return;
            }
            audioManager.play("painting-engage");
            room1Visual.carouselInPainting = true;
            onSuccess();
          }}
          disabled={solved}
        >
          {solved ? "회전목마" : "빈자리"}
        </button>
      </div>
      <div className="keyring-inventory" aria-label="소지품">
        <span className="keyring-guide">사용할 물건</span>
        {state.inventoryItemIds.length === 0 && <em className="keyring-empty">가진 물건이 없다.</em>}
        {state.inventoryItemIds.map((itemId) => (
          <button
            key={itemId}
            type="button"
            className={`keyring-item${selectedItem === itemId ? " is-selected" : ""}`}
            data-item={itemId}
            onClick={() => setSelectedItem(itemId)}
            disabled={solved}
          >
            {inventoryItems[itemId]?.label ?? itemId}
          </button>
        ))}
      </div>
    </div>
  );
}

function FloorNinePuzzle({
  dispatch,
  onFail,
  onSuccess,
  solved,
}: {
  dispatch: (action: GameAction) => void;
  onFail: (text: string) => void;
  onSuccess: () => void;
  solved: boolean;
}) {
  const clue = clueRecords["guro-pyeongsang"];
  return (
    <div className="memory-body floor-body">
      <div className="floor-clue-card">
        <b>{clue.label}</b>
        <p>{clue.description}</p>
      </div>
      <div className={`pyeongsang-piece${solved ? " is-placed" : ""}`} aria-label="구로평상 모형">
        <span className="pyeongsang-top" aria-hidden="true" />
        <b>구로평상</b>
        <em>{solved ? "제자리를 찾았다" : "올려놓을 칸을 골라라"}</em>
      </div>
      <div className="floor-grid" aria-label="아홉 칸 바닥 타일">
        {Array.from({ length: 9 }).map((_, index) => {
          const cell = index + 1;
          const isAnswer = cell === FLOOR_ANSWER_CELL;
          return (
            <button
              key={cell}
              type="button"
              className={`floor-cell${solved && isAnswer ? " is-sunk has-pyeongsang" : ""}`}
              data-cell={cell}
              onClick={() => {
                if (solved) {
                  return;
                }
                dispatch({ type: "SELECT_FLOOR_CELL", cell });
                if (isAnswer) {
                  audioManager.play("tile-press");
                  onSuccess();
                  return;
                }
                audioManager.play("tile-wrong");
                onFail("평상이 이 칸에는 맞지 않는다.");
              }}
              disabled={solved}
            >
              {solved && isAnswer ? "평상" : cell}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const beefRegions = [
  { id: "moksim", label: "목심", left: 24, top: 26 },
  { id: "salchisal", label: "살치살", left: 36.5, top: 21 },
  { id: "deungsim", label: "등심", left: 50, top: 24 },
  { id: "chaekkeut", label: "채끝", left: 64, top: 27 },
  { id: "ansim", label: "안심", left: 58, top: 42 },
  { id: "galbi", label: "갈비", left: 42, top: 47 },
  { id: "yangji", label: "양지", left: 27, top: 56 },
  { id: "udun", label: "우둔", left: 78, top: 34 },
];

function BeefCutPuzzle({
  puzzle,
  onFail,
  onSuccess,
  solved,
}: {
  puzzle: PuzzleDefinition;
  onFail: (text: string) => void;
  onSuccess: () => void;
  solved: boolean;
}) {
  const [placed, setPlaced] = useState(false);

  return (
    <div className="memory-body beef-body" data-placed={placed}>
      <p className="beef-hint">“100일의 기억은 윗등 쪽, 목심과 등심 사이에 있다.”</p>
      <div className="beef-diagram" aria-label="소 부위 그림">
        <svg viewBox="0 0 100 62" aria-hidden="true" focusable="false">
          <path
            d="M14 30 C13 20 22 13 34 12 C48 10 66 11 76 15 C84 18 90 23 90 30 C90 34 87 37 83 38 L83 50 L77 50 L76 40 C68 43 52 44 42 42 L41 52 L35 52 L34 41 C26 40 18 38 16 34 Z"
            className="beef-cow-body"
          />
          <circle cx="12" cy="24" r="7" className="beef-cow-head" />
        </svg>
        {beefRegions.map((region) => (
          <button
            key={region.id}
            type="button"
            className={`beef-region${placed && region.id === "salchisal" ? " is-placed" : ""}`}
            data-region={region.id}
            style={{ left: `${region.left}%`, top: `${region.top}%` }}
            onClick={() => {
              if (solved || placed) {
                return;
              }
              if (region.id === "salchisal") {
                audioManager.play("magnet-snap");
                setPlaced(true);
                return;
              }
              audioManager.play("wrong-answer");
              onFail("자석 조각이 붙지 않는다. 여기가 아닌 것 같다.");
            }}
            disabled={solved || (placed && region.id !== "salchisal")}
          >
            {placed && region.id === "salchisal" ? "조각" : ""}
          </button>
        ))}
      </div>
      {placed ? (
        <>
          <p className="beef-step-guide">조각이 붙었다. 이 부위의 이름은?</p>
          <AnswerRow
            placeholder="부위 이름을 입력"
            disabled={solved}
            testId="beef-answer-input"
            onSubmit={(value) => {
              if (matchesAnswer(puzzle, value)) {
                audioManager.play("unlock");
                onSuccess();
                return;
              }
              audioManager.play("wrong-answer");
              onFail("이름이 맞지 않는다. 붙은 자리의 부위를 떠올려보자.");
            }}
          />
        </>
      ) : (
        <p className="beef-step-guide">먼저 소 그림에서 힌트가 가리키는 위치에 조각을 붙여라.</p>
      )}
    </div>
  );
}

function SteakChoicePuzzle({
  dispatch,
  onFail,
  onSuccess,
  solved,
}: {
  dispatch: (action: GameAction) => void;
  onFail: (text: string) => void;
  onSuccess: () => void;
  solved: boolean;
}) {
  const [candleOut, setCandleOut] = useState(false);

  return (
    <div className={`memory-body steak-body${candleOut ? " is-candle-out" : ""}`}>
      <p className="steak-question">하영이가 마지막으로 선택해야 하는 스테이크는?</p>
      <div className="steak-plates">
        <button
          type="button"
          className="steak-card"
          data-steak="alpero"
          onClick={() => {
            if (solved) {
              return;
            }
            dispatch({ type: "SELECT_STEAK", steak: "alpero" });
            audioManager.play("steak-wrong");
            room1Visual.candleOutUntil = performance.now() + 1500;
            setCandleOut(true);
            window.setTimeout(() => setCandleOut(false), 1500);
            onFail(steakWrongLine);
          }}
          disabled={solved}
        >
          <span className="steak-flag">A</span>
          <span className="steak-plate" aria-hidden="true" />
          <strong>홍대 알페로 스테이크</strong>
          <em>100일 홍대의 그 접시</em>
        </button>
        <button
          type="button"
          className="steak-card"
          data-steak="hyunsu"
          onClick={() => {
            if (solved) {
              return;
            }
            dispatch({ type: "SELECT_STEAK", steak: "hyunsu" });
            audioManager.play("steak-right");
            onSuccess();
          }}
          disabled={solved}
        >
          <span className="steak-flag">B</span>
          <span className="steak-plate" aria-hidden="true" />
          <strong>현수의 스테이크</strong>
          <em>현수가 기다린 답</em>
        </button>
      </div>
      <span className="steak-candle" aria-hidden="true" />
    </div>
  );
}
