import { isTaskFilePath } from "@nputer/parser/pure";
import type { DocsModelState } from "@/lib/docs-model";
import type { GenesisTurn } from "@/lib/agent-store";

/**
 * T-028's pure half: WHEN the interview's right pane stops being a lens
 * and becomes the board, WHEN the run is over, and what the elapsed slot
 * reads. No React, no Tauri, no IO, no wall clock — time enters only as
 * an argument, so every rule below is deep-equal deterministic and pinned
 * in `app/test/crescendo.test.ts` without rendering anything.
 *
 * THREE RULES WORTH STATING UP FRONT, because each is a place this screen
 * could easily have lied:
 *
 *  1. THE SWITCH IS FILE EVIDENCE, NEVER MODEL OUTPUT. Nothing here reads
 *     a turn's text, its `activity` labels, or the banking map to decide
 *     that decomposition happened. The board appears because TASK FILES
 *     PARSED, and for no other reason — the same discipline T-027 applied
 *     to its banked chips, and ADR-017's "the spawned planner is the
 *     writer; the app renders what lands" applied to the crescendo.
 *  2. AN EMPTY BOARD IS NEVER CELEBRATED. `parseableBoard` counts task
 *     RECORDS the parser established, not files on disk, so a
 *     decomposition that wrote seven unparseable files reads as zero and
 *     the completion state cannot render (criterion 4). Planning theater
 *     is the named failure mode in NORTH_STAR; this is the one line of
 *     code that refuses to stage it.
 *  3. THE ELAPSED CLOCK IS DISPLAY-ONLY AND EPHEMERAL. It is a number
 *     handed in, formatted, and shown. Nothing persists it, nothing sends
 *     it anywhere, and it does not exist in any file — see
 *     `interview-source.ts` for the origin and its re-base rule.
 *
 * WHAT THE CARD CLAIMED AND DISK DID NOT, recorded rather than
 * implemented: criterion 2 cites "T-023's completion signal: planner's
 * closing turn + a parseable board present". THERE IS NO SUCH SIGNAL.
 * `method/roles/planner.md` and `method/interview/plan-interview.md` are
 * the whole of T-023's protocol, and neither defines a closing marker —
 * the only literal marker the method has is "pushing back:", explicitly a
 * rendering hint that nothing may depend on. So "the planner's closing
 * turn" is DERIVED from typed state rather than read out of prose: the
 * last turn the runner delivered has SETTLED (`completed`), nothing is in
 * flight, and the board is on disk. That is an approximation and it is
 * reversible by construction — answer again and the completion state
 * stands down, because a turn is in flight again.
 */

// ---- a parseable board -------------------------------------------------

export interface BoardReadiness {
  /** Task files delivered in the snapshot, by the PARSER's own predicate
   * (`docs/tasks/T-*.md`, flat) — so what counts as a task file here and
   * what the board renders cannot drift apart. */
  taskFiles: number;
  /** Task RECORDS the parser established from those files. This is the
   * number the board's columns are drawn from. */
  parsedTasks: number;
  /** Task files whose CURRENT content fails to parse. A file with a last
   * good parse still contributes a record (the board renders the last
   * valid state and the parse chip says so), so this can be non-zero
   * while `parsedTasks` is healthy. */
  failingTaskFiles: number;
  /** The right half shows the real board. */
  showBoard: boolean;
  /** Task files landed and NOT ONE of them parsed — criterion 4's
   * "all parse-failing", distinguished from "no tasks yet" because the
   * two are different situations and only one of them is a defect. */
  allFailing: boolean;
}

/**
 * Is there a board to show, and is it real?
 *
 * `showBoard` is `parsedTasks > 0` rather than `taskFiles > 0`, and the
 * difference is the whole of criterion 4. Criterion 1 says the pane
 * switches when task files begin landing; criterion 4 says a planner that
 * ends with every task file parse-failing keeps the honest artifacts
 * state and the parse-chip family. Both are satisfied by asking whether a
 * file produced a CARD: a file that produces no card would put nothing on
 * the board, so switching to it would replace the lens with an empty
 * frame — the exact "empty board celebrated" the criterion forbids.
 */
export function boardReadiness(docs: DocsModelState): BoardReadiness {
  let taskFiles = 0;
  for (const path of docs.effective.keys()) if (isTaskFilePath(path)) taskFiles += 1;
  let failingTaskFiles = 0;
  for (const failure of docs.failures) if (isTaskFilePath(failure.path)) failingTaskFiles += 1;
  const parsedTasks = docs.model.tasks.length;
  return {
    taskFiles,
    parsedTasks,
    failingTaskFiles,
    showBoard: parsedTasks > 0,
    allFailing: taskFiles > 0 && parsedTasks === 0,
  };
}

/**
 * `boardReadiness(docs).showBoard`, and it CANNOT TAKE THE SCREEN DOWN.
 *
 * FOUND BY A TEST RATHER THAN BY REVIEW, and it is T-027's `stageOf`
 * defect one layer over: `GenesisScreen` calls this from its render body,
 * which is OUTSIDE T-037's error boundary — the boundary wraps the right
 * half's contents, not the decision about which contents to render. A
 * docs tree torn badly enough to throw on `effective` (T-037's own probe
 * builds exactly that: a Proxy that explodes on any read) would therefore
 * have taken the WHOLE React tree down and left the user a blank window
 * with their interview in it. That is the precise failure the boundary
 * exists to prevent, reintroduced by the code that chooses the renderer.
 *
 * An unreadable tree degrades to the LENS, deliberately: a tree we cannot
 * read is not a tree we can claim has a board on it, and the lens sits
 * inside the boundary, so its own fallback renders and says so honestly.
 */
export function showsBoard(docs: DocsModelState): boolean {
  try {
    return boardReadiness(docs).showBoard;
  } catch {
    return false;
  }
}

// ---- the completion signal ---------------------------------------------

/** Why the completion state is NOT rendering. Rendered nowhere and
 * asserted everywhere: naming the blocker is what makes criterion 4
 * testable as a positive claim rather than as an absence. */
export type CompletionBlocker =
  /** The planner has not spoken yet. */
  | "noTurns"
  /** A turn is running, or a send is latched from this side. */
  | "turnInFlight"
  /** The last turn failed or was cancelled — the run did not close, and
   * the failure block is on screen with its own way forward. */
  | "lastTurnUnsettled"
  /** No parseable board on disk (no tasks, or all parse-failing). */
  | "noBoard";

export type CompletionReading =
  | { complete: true; turns: number }
  | { complete: false; blocker: CompletionBlocker };

/**
 * Has the interview finished?
 *
 * Four conditions, in the order a reader would ask them, and every one of
 * them is typed state or file evidence:
 *
 *  - at least one planner turn exists;
 *  - nothing is in flight (`inFlight` is the caller's `interviewBusy`,
 *    which is the store's own flag OR the UI's synchronous latch — both
 *    are needed, see `interviewBusy`);
 *  - the HIGHEST-numbered turn SETTLED as `completed` (a `failed` or
 *    `cancelled` tail is not a closing turn);
 *  - a parseable board is present.
 *
 * Not a latch. If the user answers again the reading reverts to
 * `turnInFlight` and the completion state stands down, which is correct:
 * the interview is a conversation and nothing here may claim it is over
 * while the user is still talking.
 */
export function completionOf(
  docs: DocsModelState,
  turns: readonly GenesisTurn[],
  inFlight: boolean,
): CompletionReading {
  if (turns.length === 0) return { complete: false, blocker: "noTurns" };
  if (inFlight) return { complete: false, blocker: "turnInFlight" };
  let last: GenesisTurn | undefined;
  for (const turn of turns) if (last === undefined || turn.turn > last.turn) last = turn;
  if (last === undefined || last.status !== "completed") {
    return { complete: false, blocker: "lastTurnUnsettled" };
  }
  if (!boardReadiness(docs).showBoard) return { complete: false, blocker: "noBoard" };
  return { complete: true, turns: turns.length };
}

// ---- the whole right-half decision --------------------------------------

export type RightHalf = "lens" | "board";

export interface CrescendoModel {
  readiness: BoardReadiness;
  completion: CompletionReading;
  /** Which renderer the right half shows. `complete` implies `board` —
   * the completion state is the board PLUS its panel, never a screen that
   * replaces the thing it is celebrating. */
  half: RightHalf;
}

export function crescendo(
  docs: DocsModelState,
  turns: readonly GenesisTurn[],
  inFlight: boolean,
): CrescendoModel {
  const readiness = boardReadiness(docs);
  return {
    readiness,
    completion: completionOf(docs, turns, inFlight),
    half: readiness.showBoard ? "board" : "lens",
  };
}

// ---- the elapsed slot ---------------------------------------------------

/** One minute, in ms — the unit the product's own success criterion is
 * written in ("idea → dispatchable board in ≤ 30 minutes"). */
export const MINUTE_MS = 60_000;
/** Above this the label switches to hours; below it, plain minutes. */
export const HOUR_FORM_FROM_MINUTES = 120;

/**
 * The design's `~9 min elapsed` slot, as a label.
 *
 * Three forms and no more: under a minute says so rather than rounding to
 * a zero the user would read as broken; minutes up to two hours, which is
 * the unit NORTH_STAR's timed criterion is written in; hours beyond that,
 * because "~745 min elapsed" is a number nobody reads. The tilde is the
 * design's own and it is honest here for a second reason — the origin is
 * when THIS app session first saw the interview, not when the planner
 * started (see `interview-source.ts`).
 *
 * `null` in, `null` out: no clock has started, so there is nothing to
 * show and the slot renders nothing at all rather than "~0 min".
 */
export function elapsedLabel(ms: number | null): string | null {
  if (ms === null) return null;
  const minutes = Math.floor(Math.max(ms, 0) / MINUTE_MS);
  if (minutes < 1) return "<1 min";
  if (minutes < HOUR_FORM_FROM_MINUTES) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `~${hours}h` : `~${hours}h ${rest}m`;
}
