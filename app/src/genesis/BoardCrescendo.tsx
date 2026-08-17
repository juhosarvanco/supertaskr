import { Board } from "@/components/board/Board";
import { Button } from "@/components/ui/button";
import type { DocsModelState } from "@/lib/docs-model";
import { crescendo, elapsedLabel } from "./crescendo";
import {
  interviewBusy,
  useGenesisElapsedMs,
  useGenesisState,
  useInterviewUi,
} from "./interview-source";
import { BankedMark } from "./interview-turns";

/**
 * THE DECOMPOSITION CRESCENDO — the right half, once the plan has become
 * cards (T-028).
 *
 * COMPOSITION ONLY, and it is the whole point of the task rather than a
 * constraint on it. Every card, column, slice line, ghost, parked row and
 * detail panel below is T-004/T-005/T-006/T-017's board, mounted exactly
 * as the board pane mounts it and fed the same live `ProjectParseResult`
 * the watcher already delivers. NOT ONE FILE under
 * `src/components/board/` changes in this task. The board has rendered
 * live task files for free since T-003; what was missing was a screen
 * that showed it while the plan was still being written.
 *
 * WHY THIS COMPONENT EXISTS AT ALL, given the screen could have called
 * `<Board>` directly: the completion state needs the interview's own
 * state — whether a turn is in flight and whether the last one settled —
 * and `GenesisScreen.tsx` is contractually free of subscriptions, clocks
 * and IPC (its own header says so, and `genesis-mount.test.tsx` sweeps
 * its source text for the ten names that would break it). So the screen
 * decides lens-or-board from `docs` alone, through one pure call, and
 * everything that needs a store lives here, below the seam, exactly where
 * T-027 put the rest of the conversation half.
 *
 * THE RAIN IS A CSS RULE, NOT A PROP. `motion-safe:board-rain` (defined
 * in `index.css`) gives every `task-card` descendant ONE entrance
 * transition. React mints a fresh element per newly parsed task, so a
 * card that lands ten seconds after the first plays its own entrance
 * then — cards rain in AS FILES LAND, which is what the design asks for,
 * without a single line inside the board. Reduced motion drops it with no
 * second mechanism: the `motion-safe:` variant IS criterion 5.
 *
 * NO DISPATCH AFFORDANCE. F-04 is fenced, so the completion state
 * proposes nothing, runs nothing and offers no way to start a task. It
 * says the board is ready and it opens the board. `crescendo-dom` greps
 * this file for the vocabulary, so the fence is mechanical rather than
 * remembered.
 */
export function BoardCrescendo({
  docs,
  onOpenBoard,
}: {
  docs: DocsModelState;
  /** The one CTA's handler — the shell's own genesis→board handoff,
   * passed down from `App` so this file (like the screen above it) needs
   * no shell import of its own. It is a SCREEN change and not a project
   * change: the interview's folder is already the watched project, so
   * nothing is re-opened, re-armed or re-read and no command is issued. */
  onOpenBoard: () => void;
}) {
  const genesis = useGenesisState();
  const ui = useInterviewUi();
  const model = crescendo(docs, genesis.turns, interviewBusy(genesis, ui));
  const elapsed = elapsedLabel(useGenesisElapsedMs());
  const { parsedTasks, taskFiles, failingTaskFiles } = model.readiness;
  const complete = model.completion.complete;

  return (
    <section
      data-testid="genesis-board"
      data-complete={complete ? "true" : "false"}
      data-cards={parsedTasks}
      data-task-files={taskFiles}
      // The lens's own frame, kept byte-for-byte so the two halves of the
      // split do not disagree about what the right half IS: same ground,
      // same header rule, same bounded scroll region. Swapping the
      // renderer must not move the furniture.
      className="flex min-h-0 min-w-0 flex-1 flex-col bg-sidebar"
    >
      <header className="flex items-center justify-between gap-4 border-b border-hairline px-6.5 pt-5 pb-4">
        <span className="font-mono text-xs tracking-overline text-muted-foreground uppercase">
          the board, so far
        </span>
        <span
          data-testid="genesis-board-count"
          className="font-mono text-xs text-muted-foreground"
        >
          {parsedTasks} card{parsedTasks === 1 ? "" : "s"} · {taskFiles} task file
          {taskFiles === 1 ? "" : "s"}
          {failingTaskFiles > 0 ? ` · ${failingTaskFiles} not parsing` : ""}
        </span>
      </header>

      {complete && (
        <div
          data-testid="genesis-complete"
          className="mx-6.5 mt-5 flex flex-col gap-2.5 rounded-lg border border-status-done-border bg-status-done px-5 py-4.5"
        >
          <span className="flex items-center gap-2">
            <BankedMark />
            <span className="font-mono text-xs tracking-overline text-status-done-foreground uppercase">
              interview complete
            </span>
          </span>
          <span className="text-xl font-semibold tracking-title text-status-done-title">
            The board is ready.
          </span>
          <span data-testid="genesis-complete-detail" className="text-sm text-secondary-foreground">
            {parsedTasks} card{parsedTasks === 1 ? "" : "s"} written as plain markdown under{" "}
            <span className="rounded-sm bg-muted px-1.5 font-mono text-sm">docs/tasks/</span> — the
            plan is on disk, not in this window.
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button data-testid="genesis-open-board" onClick={onOpenBoard}>
              Open the board
            </Button>
            {elapsed !== null && (
              <span
                data-testid="genesis-complete-elapsed"
                className="font-mono text-xs text-muted-foreground"
              >
                {elapsed} elapsed
              </span>
            )}
          </div>
        </div>
      )}

      {/* The board's own bounded region — T-048's chain, continued: the
          screen and the split above carry `min-h-0`, so this is the link
          that lets the board scroll instead of growing the page. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6.5 py-5.5">
        <div data-testid="genesis-board-rain" className="motion-safe:board-rain">
          <Board model={docs.model} />
        </div>
      </div>
    </section>
  );
}
