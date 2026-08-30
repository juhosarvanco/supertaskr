import { useCallback, useMemo, useState } from "react";
import type { ProjectParseResult } from "@nputer/parser/pure";
import { selectBoard, type DispatchReading } from "@/lib/board-model";
import type { BriefOutcomeView, TaskRef } from "@/lib/task-detail";
import { FeatureColumn } from "./FeatureColumn";
import { TaskDetailPanel } from "./TaskDetailPanel";

/** Density rule (T-006, card-states tab): past 40 cards the meta row
 * drops the model badge first; id and title never shrink. */
const DENSE_CARD_THRESHOLD = 40;

/**
 * Story map board (T-004, read-only): thin layout over selectBoard.
 * Columns in backbone order (+ trailing unmapped when needed); the
 * whole board is a pure function of the live DocsModel, so T-003's
 * push updates it in place. The full friendly empty state is T-007's;
 * an empty model renders one minimal line.
 *
 * T-006: columns share the row width equally with a 320px floor —
 * below that the board scrolls sideways instead of compressing.
 *
 * T-005: clicking a card opens the detail panel, which derives from the
 * same live model (selectTaskDetail) — the open ref is ephemeral view
 * state only. The panel outlives an emptied board (its "no longer
 * present" state covers the ref) and re-targets when a blocker link or
 * another card is clicked.
 *
 * T-112: the composition root is also where the DISPATCH channel enters,
 * because it is the one file on the board side that reaches the drawer.
 * Both props are optional and are threaded VERBATIM — this file makes no
 * decision about them; `selectBriefPanel` in `task-detail.ts` does, where
 * a suite can reach it. Absent, the drawer's dispatch block does not
 * render at all, so a board with no lane channel is byte-for-byte what it
 * was. The `invoke` that fills them is `app-shell`'s and is routed
 * (`T-112-s1`).
 */
export function Board({
  model,
  dispatch,
  brief,
}: {
  model: ProjectParseResult;
  dispatch?: DispatchReading;
  brief?: BriefOutcomeView;
}) {
  const board = useMemo(() => selectBoard(model), [model]);
  const [openRef, setOpenRef] = useState<TaskRef | undefined>(undefined);
  const close = useCallback(() => setOpenRef(undefined), []);
  const cardCount = board.columns.reduce((sum, column) => sum + column.cards.length, 0);
  const dense = cardCount > DENSE_CARD_THRESHOLD;
  return (
    <>
      {board.empty ? (
        <p data-testid="board-empty" className="text-sm text-muted-foreground">
          no features found
        </p>
      ) : (
        <div data-testid="board" className="flex items-start gap-3.5 overflow-x-auto pb-2">
          {board.columns.map((column, index) => (
            <FeatureColumn
              key={column.key}
              column={column}
              labelSlice={index === 0}
              dense={dense}
              onOpen={setOpenRef}
            />
          ))}
        </div>
      )}
      {openRef !== undefined && (
        <TaskDetailPanel
          model={model}
          taskRef={openRef}
          onOpen={setOpenRef}
          onClose={close}
          dispatch={dispatch}
          brief={brief}
        />
      )}
    </>
  );
}
