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

// ---- is a turn actually in flight? --------------------------------------

/**
 * WHY THE SCREEN BELIEVES A TURN IS OR IS NOT RUNNING (T-171).
 *
 * Named for the same reason `CompletionBlocker` is named: a reading that
 * says only `true`/`false` is testable as an absence, and the whole defect
 * this type exists for is a `true` that nobody could interrogate.
 */
export type FlightReading =
  /** A turn the runner OPENED has not settled. The strongest evidence
   * there is, and the only one that earns "planner is thinking…". */
  | { inFlight: true; because: "running" }
  /** This side issued a command and no answer has come back. A turn is in
   * flight as far as anything here can know. */
  | { inFlight: true; because: "latched" }
  /** A start or send was ACCEPTED for a turn whose `started` event has not
   * arrived yet — the gap between the command's answer and the first
   * event, which is real and is milliseconds wide. */
  | { inFlight: true; because: "unlanded" }
  /** The store claims flight and nothing has landed that could contradict
   * it: the mount-time status pull over a session this webview has seen
   * no events for. */
  | { inFlight: true; because: "claimed" }
  /** The store claims flight and the turn evidence CONTRADICTS it — the
   * turn the claim is about has landed and settled. This is the state the
   * screen used to render as "planner is thinking…", indefinitely. */
  | { inFlight: false; because: "stranded" }
  /** Nothing claims flight and nothing is running. */
  | { inFlight: false; because: "idle" };

/**
 * IS A TURN IN FLIGHT — from the turn's own status, with the flags as
 * CLAIMS that turn evidence is allowed to outlive (T-171).
 *
 * THE DEFECT THIS REPLACES, stated exactly, because the shape of the fix
 * only makes sense against it. `interviewBusy` was
 * `ui.busy || state.sending || state.phase === "running"` — three flags,
 * not one of which is a fact about a turn, and every one of which can
 * survive the turn it describes: the store's `phase` returns to `idle`
 * only on a `completed`/`failed` event, and `applyGenesisStatus` re-arms
 * it from a status pull with no seq guard at all. That boolean was the
 * SINGLE source for the footer hint, for every `disabled` on the screen,
 * and for `completionOf`'s `inFlight` — so when it stranded, the footer
 * claimed a turn nobody was running, the answer box refused input, and a
 * finished genesis could not be celebrated, all from one flag. @human's
 * 2026-08-30 walk ended in exactly that state: ten turns banked, the
 * board on disk, and *"planner is thinking… · ⌘. to stop"* with a
 * disabled button, indefinitely (T-171's card).
 *
 * THE RULE IS THE ONE `rehydrate` ALREADY STATES ONE LAYER OVER — "a
 * rehydrated planner turn is `completed`, never `running`… giving it a
 * live status would put a pulse dot on a turn nothing is generating". A
 * flag is a claim; the turn's `status` is what the runner actually
 * measured. Where they disagree, the measurement wins.
 *
 * WHY THE CLAIMS ARE NOT SIMPLY DROPPED — each of the three `true` cases
 * below covers a window where a turn genuinely is in flight and no turn
 * evidence exists yet, and dropping it would flicker the footer to
 * "⏎ send" and re-enable the answer box for a frame after every single
 * answer. `latched` covers the command's own round trip; `unlanded`
 * covers the gap between an accepted answer and its `started` event (the
 * runner spawns the turn on a THREAD, so that event races the command's
 * return); `claimed` covers a webview that arrived after the turn did,
 * which is the mount-time status pull's whole purpose.
 *
 * WHAT IT CANNOT DO, said rather than left to be discovered: a command
 * that never answers leaves `latched` true forever, and this function
 * will keep saying a turn is in flight — correctly, because nothing here
 * can know otherwise. That is a runner-side liveness question and it is
 * outside this fence (`app-agent`); it is routed rather than guessed at.
 *
 * Pure: no clock, no store read, no IO. Every input is handed in.
 */
export function flightOf(
  turns: readonly GenesisTurn[],
  /** A start or send is latched from THIS side (`InterviewUiState.busy`). */
  latched: boolean,
  /** The turn number of the last start/send this side had ACCEPTED, or
   * null when none has been. */
  awaiting: number | null,
  /** The store's own claim (`isTurnInFlight`): `sending` or `phase`. */
  claimed: boolean,
): FlightReading {
  for (const turn of turns) {
    if (turn.status === "running") return { inFlight: true, because: "running" };
  }
  if (latched) return { inFlight: true, because: "latched" };
  if (awaiting !== null) {
    const landed = turns.find((turn) => turn.turn === awaiting);
    // Accepted, and its first event has not arrived. `landed` being
    // present and settled falls THROUGH — that is the whole point: an
    // accepted turn that has since completed is not a reason to believe a
    // claim about it.
    if (landed === undefined) return { inFlight: true, because: "unlanded" };
  }
  if (claimed) {
    // An empty turn list contradicts nothing: there is no measurement to
    // set against the claim, so the claim stands.
    if (turns.length === 0) return { inFlight: true, because: "claimed" };
    return { inFlight: false, because: "stranded" };
  }
  return { inFlight: false, because: "idle" };
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
  | "noBoard"
  /** The docs tree could not be read at all — `completionSafely`'s
   * degradation, kept distinguishable from `noBoard` because "there is no
   * plan" and "we cannot see whether there is a plan" are different
   * situations and only one of them is about the project. */
  | "unreadable";

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

/**
 * `completionOf`, and it CANNOT TAKE THE CONVERSATION DOWN (T-171).
 *
 * The exact sibling of `showsBoard` above, and it exists for the exact
 * reason `stageOf` exists: the CHAT reads this, and the chat renders
 * OUTSIDE T-037's error boundary — the boundary wraps the right half's
 * contents, not the left half. `completionOf` reaches `boardReadiness`,
 * which walks `docs.effective`, and a docs tree torn badly enough to
 * throw on a read (T-037's probe builds exactly that) would otherwise
 * take the whole React tree down and leave the user a blank window with
 * their interview in it.
 *
 * An unreadable tree degrades to NOT COMPLETE, deliberately and in the
 * same direction `showsBoard` degrades: a tree we cannot read is not a
 * tree we can claim has a finished plan on it. The blocker says which,
 * so the honest state is distinguishable from `noBoard` rather than
 * collapsing into it.
 */
export function completionSafely(
  docs: DocsModelState,
  turns: readonly GenesisTurn[],
  inFlight: boolean,
): CompletionReading {
  try {
    return completionOf(docs, turns, inFlight);
  } catch {
    return { complete: false, blocker: "unreadable" };
  }
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
