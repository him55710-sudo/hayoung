import { Stamp, X } from "lucide-react";
import { hintPenalties, hintStageLabels } from "../game/data/hints";
import { getPuzzleById } from "../game/data/room1Puzzles";
import type { PuzzleDefinition } from "../game/data/room1Puzzles";
import type { GameState } from "../game/state/gameState";

type HintSheetProps = {
  state: GameState;
  /** 힌트가 향할 퍼즐 (열려 있는 퍼즐 또는 다음 진행 퍼즐). */
  targetPuzzle: PuzzleDefinition | null;
  onIssueHint: (puzzle: PuzzleDefinition, stage: number) => void;
  onClose: () => void;
};

export function HintSheet({ state, targetPuzzle, onIssueHint, onClose }: HintSheetProps) {
  const nextStage = state.hintsUsed + 1;
  const nextPenalty = hintPenalties[state.hintsUsed] ?? null;
  const revealed = state.hintContracts
    .map((contract, index) => {
      const [puzzleId, stageText] = contract.split("|");
      const puzzle = getPuzzleById(puzzleId);
      const stage = Number.parseInt(stageText, 10);
      if (!puzzle || !Number.isFinite(stage)) {
        return null;
      }
      return {
        key: `${contract}-${index}`,
        puzzleTitle: puzzle.title,
        stage,
        text: puzzle.hints[Math.min(2, Math.max(0, stage - 1))],
        penalty: hintPenalties[index] ?? null,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return (
    <div className="modal-layer hint-sheet-layer">
      <section className="hint-sheet" role="dialog" aria-label="힌트 계약서">
        <button className="close-button" type="button" aria-label="닫기" onClick={onClose}>
          <X aria-hidden="true" />
        </button>
        <header className="hint-sheet-head">
          <span className="memory-kicker">HINT CONTRACT · {state.hintsUsed}/3</span>
          <h2>힌트 계약서</h2>
          <p>힌트 한 번마다 벌칙 계약이 도장으로 찍힌다. 기록은 엔딩까지 남는다.</p>
        </header>

        <ol className="hint-penalty-ledger" aria-label="벌칙 목록">
          {hintPenalties.map((penalty, index) => {
            const used = index < state.hintsUsed;
            return (
              <li key={penalty.id} className={used ? "is-stamped" : ""}>
                <b>{index + 1}</b>
                <span>{penalty.label}</span>
                {used && <i className="hint-stamp-mark">계약</i>}
              </li>
            );
          })}
        </ol>

        {revealed.length > 0 && (
          <div className="hint-revealed-list" aria-label="발급된 힌트">
            {revealed.map((entry) => (
              <article key={entry.key} className="hint-receipt">
                <header>
                  <b>
                    힌트 {entry.stage}/3 · {hintStageLabels[Math.min(2, entry.stage - 1)]}
                  </b>
                  <span>{entry.puzzleTitle}</span>
                </header>
                <p>{entry.text}</p>
                {entry.penalty && <footer>벌칙: {entry.penalty.label}</footer>}
              </article>
            ))}
          </div>
        )}

        <div className="hint-sheet-actions">
          {state.hintsUsed >= 3 ? (
            <p className="hint-exhausted">계약서 세 장이 모두 찍혔다. 이제 남은 건 하영이의 추리력.</p>
          ) : targetPuzzle ? (
            <button
              className="hint-issue-button"
              type="button"
              onClick={() => onIssueHint(targetPuzzle, nextStage)}
            >
              <Stamp aria-hidden="true" />
              <span>
                힌트 {nextStage}/3 발급 — {hintStageLabels[nextStage - 1]}
              </span>
              {nextPenalty && <em>벌칙: {nextPenalty.label}</em>}
            </button>
          ) : (
            <p className="hint-exhausted">지금은 힌트가 필요한 장치가 없다.</p>
          )}
        </div>
      </section>
    </div>
  );
}
