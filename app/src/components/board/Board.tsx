import { useMemo } from "react";
import type { ProjectParseResult } from "@nputer/parser/pure";
import { selectBoard } from "@/lib/board-model";
import { FeatureColumn } from "./FeatureColumn";

/**
 * Story map board (T-004, read-only): thin layout over selectBoard.
 * Columns in backbone order (+ trailing unmapped when needed); the
 * whole board is a pure function of the live DocsModel, so T-003's
 * push updates it in place. The full friendly empty state is T-007's;
 * an empty model renders one minimal line.
 */
export function Board({ model }: { model: ProjectParseResult }) {
  const board = useMemo(() => selectBoard(model), [model]);
  if (board.empty) {
    return (
      <p data-testid="board-empty" className="text-sm text-muted-foreground">
        no features found
      </p>
    );
  }
  return (
    <div data-testid="board" className="flex items-start gap-4 overflow-x-auto pb-2">
      {board.columns.map((column, index) => (
        <FeatureColumn key={column.key} column={column} labelSlice={index === 0} />
      ))}
    </div>
  );
}
