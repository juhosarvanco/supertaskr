import type { DocsModelState } from "@/lib/docs-model";
import type {
  GenesisDenial,
  GenesisTurn,
  SendOutcomePayload,
  StartOutcomePayload,
  TranscriptLinePayload,
  TurnErrorPayload,
} from "@/lib/agent-store";
import { deriveGenesis, EMPTY_CHANGE_LOG } from "./genesis-derive";

/**
 * T-027's pure half: everything the interview decides that does not need
 * a DOM, a clock, or an `invoke`. Same inputs → deep-equal outputs, so
 * every rule below is pinned in `app/test/interview-model.test.ts`
 * without rendering anything.
 *
 * The three rules worth stating up front, because each is a place the
 * screen could easily have lied:
 *
 *  1. A BANKED CHIP IS FILE EVIDENCE, NEVER MODEL OUTPUT. Nothing here
 *     reads a turn's text, its `activity` labels, or the banking map to
 *     decide that something was banked. The only input is the docs tree
 *     the watcher delivered (criterion 3). The consequence is DELIBERATE
 *     and it is true BY CONSTRUCTION: a file a HUMAN writes in a
 *     terminal mid-interview produces an identical chip, because the
 *     chip's claim is "this file changed on disk at this point in the
 *     conversation" and not "this turn caused it". That is ADR-006's
 *     hand-driven mode rendering correctly.
 *
 *     THIS SENTENCE READ "deliberate and tested" UNTIL T-072, AND THE
 *     TEST IT LEANED ON HAD BEEN DELETED (T-057). It is corrected rather
 *     than re-satisfied, because the positive half is not testable from
 *     this module at all: no parameter distinguishes the two writers, so
 *     a body that banks the same tree twice and asserts the chips agree
 *     is `f(x) === f(x)` — which is precisely the tautology T-057
 *     removed. The type-level argument in the paragraph above IS the
 *     evidence, and restoring a deleted test to make an old adjective
 *     true would be evidence of nothing. What a test CAN hold is the
 *     NEGATIVE, and two do: `activity labels and completed text naming
 *     docs paths produce ZERO chips` in
 *     `app/test/interview-model.test.ts`, and its DOM twin `a turn whose
 *     activity labels name docs paths produces ZERO chips` in
 *     `app/test/interview-chat-dom.test.tsx`. Both drive a real event
 *     script whose model output names real docs paths over a disk that
 *     did not move, and both require zero chips.
 *  2. THE CHALLENGE PREFIX IS A RENDERING HINT AND NOTHING ELSE. It is
 *     read by exactly one function (`challengeOf`) whose result reaches
 *     exactly one class list. Criterion 2 says the hint is never
 *     load-bearing; the unit that proves it runs the same event script
 *     with and without the prefix and requires deep-equal state but for
 *     one boolean.
 *  3. MODEL TEXT IS DATA. Nothing here parses, splits, or interprets a
 *     turn's text beyond the one prefix above — no markdown, no links,
 *     no paths harvested out of prose (ADR-009, and the criterion's
 *     no-markdown fence).
 */

// ---- banked chips: the baseline, and the diff over it -------------------

/**
 * What the docs tree looked like the last time chips were taken. Held by
 * the chat and replaced (never mutated) on every observation.
 *
 * `primed` is the whole priming rule in one flag: before the interview
 * has started there is no "since" to diff against, so an unprimed
 * baseline yields no chips at all and stays unprimed. The chat primes it
 * when it first observes `started { turn: 1 }`.
 */
export interface BankBaseline {
  /** The project the baseline describes. A different project is not a
   * banking — it is a different question (see `bankedSince`). */
  projectDir: string;
  /** The `docs.seq` the baseline was taken at; anything at or below it
   * is stale, exactly as `observeDocsChange` treats snapshots. */
  seq: number;
  contents: ReadonlyMap<string, string>;
  primed: boolean;
}

export const UNPRIMED_BASELINE: BankBaseline = {
  projectDir: "",
  seq: 0,
  contents: new Map(),
  primed: false,
};

/** Everything one docs observation can move. Keeping the baseline and
 * accumulated chips together makes their transition one pure rule shared by
 * the shipped chat and its replay tests.
 *
 * THE TWO HALVES HAVE DIFFERENT RENDER COSTS, AND A CALLER THAT IGNORES
 * THAT PAYS FOR IT (T-072 criterion 2, closing T-057-s2). `chipsByTurn`
 * is the render — `assembleTranscript` reads it and a chip row appears.
 * `baseline` is bookkeeping: no render reads it, ever. A quiet snapshot
 * (the seq advances, nothing banked) MUST advance the baseline and
 * cannot avoid allocating a new one, so an observation object is not a
 * safe unit of React state — holding both halves in one `useState` turns
 * every quiet snapshot into a re-render for a value nothing displays.
 *
 * THE CONTRACT THAT MAKES THE SPLIT WORK, and it is pinned rather than
 * assumed (`a quiet snapshot advances the baseline and returns the chip
 * map BY IDENTITY` in `app/test/interview-model.test.ts`):
 * **`observeBanking` returns `previous.chipsByTurn` BY IDENTITY on every
 * path that adds no path to no turn**, and a fresh map on exactly the
 * paths that do. So a caller stores the observation outside React state
 * and sets only `chipsByTurn`; React's `Object.is` bail-out then costs a
 * baseline advance nothing. `InterviewChat` is that caller, and the
 * render count is pinned in `app/test/interview-chat-dom.test.tsx`. */
export interface BankingObservation {
  baseline: BankBaseline;
  chipsByTurn: ReadonlyMap<number, readonly string[]>;
}

export const EMPTY_BANKING_OBSERVATION: BankingObservation = {
  baseline: UNPRIMED_BASELINE,
  chipsByTurn: new Map(),
};

/**
 * Take (or re-take) the baseline from an observed docs state. This is
 * both the priming call and the reset call — the chat runs it once at
 * `started { turn: 1 }` and again after every observation whose chips it
 * has already banked, so "since" always means "since the last time we
 * looked".
 */
export function bankBaseline(docs: DocsModelState): BankBaseline {
  return {
    projectDir: docs.projectDir,
    seq: docs.seq,
    contents: new Map(docs.effective),
    primed: true,
  };
}

/** A docs ARTIFACT, in the sense the method's banking map means: a
 * markdown file under `docs/`. The genesis lens uses the identical
 * predicate (`genesis-derive.ts`), so the chips and the stage strip
 * cannot disagree about what counts as an artifact. */
function isDocsArtifact(path: string): boolean {
  return path.startsWith("docs/") && path.endsWith(".md");
}

/**
 * Which docs artifacts have been ADDED or CHANGED since the baseline.
 *
 * Returns a sorted, deduped path list. Four rules, each a decision:
 *
 *  - A DELETION IS NOT A BANKING. Removing a file is not writing one,
 *    so vanished paths never chip.
 *  - AN UNPRIMED BASELINE YIELDS NOTHING. Before `started { turn: 1 }`
 *    there is no conversation to attribute anything to.
 *  - A STALE OR EMPTY SNAPSHOT YIELDS NOTHING. `docs.seq === 0` means
 *    nothing has been applied; `docs.seq <= baseline.seq` means this is
 *    a snapshot the baseline already saw. Mirrors `observeDocsChange`'s
 *    identity contract rather than inventing a second convention.
 *  - A DIFFERENT PROJECT YIELDS NOTHING. If the open project changed
 *    under the interview, the files in front of us are not answers to
 *    the questions behind us. The chat re-baselines instead of claiming
 *    a whole tree was just banked.
 *
 *    …BUT ONLY WHEN THERE WAS A PROJECT TO DIFFER FROM. `emptyState()`
 *    uses `projectDir: ""` for "no snapshot has been applied", and a
 *    genesis switch that carries no tree resets to exactly that while
 *    KEEPING the seq watermark (`resetDocsForProjectSwitch`). So a
 *    baseline can perfectly well read `{ seq: 10, projectDir: "" }` —
 *    a real ordering stamp over no project at all. Comparing project
 *    dirs there would refuse the first snapshot of the interview and
 *    silently drop every chip it should have produced.
 *
 *    FOUND BY THE LANE, which drives exactly that shape. The guard now
 *    asks "did the baseline know a project?" rather than "has anything
 *    happened?", and the sentinel it tests is `docs-model.ts`'s own.
 */
export function bankedSince(
  baseline: BankBaseline,
  docs: DocsModelState,
): readonly string[] {
  if (!baseline.primed) return [];
  if (docs.seq === 0 || docs.seq <= baseline.seq) return [];
  if (baseline.projectDir !== "" && docs.projectDir !== baseline.projectDir) return [];
  const banked: string[] = [];
  for (const [path, content] of docs.effective) {
    if (!isDocsArtifact(path)) continue;
    const before = baseline.contents.get(path);
    if (before === content) continue; // unchanged
    banked.push(path); // added (before === undefined) or changed
  }
  return banked.sort();
}

/**
 * Observe one docs state for the active turn.
 *
 * This owns the entire banking transition: first-turn priming, advancement
 * after a newer snapshot, unconditional rebaselining when the project
 * changes (even when its watermark is equal or lower), and sorted/deduped
 * accumulation within a turn. A project switch never chips the new tree;
 * the next change in that project is measured from the replacement baseline.
 *
 * TWO IDENTITY GUARANTEES, in decreasing strength, and the second is the
 * one T-072 leans on (see `BankingObservation`):
 *
 *  - When NOTHING moved — a null turn, a repeat, a stale snapshot — the
 *    PREVIOUS OBSERVATION comes back by identity, so a replay and
 *    StrictMode's double-effect are both free.
 *  - When only the BASELINE moved, the object is new but
 *    `chipsByTurn` is `previous.chipsByTurn` by identity. That is the
 *    half a caller puts in React state.
 *
 * A fresh map is returned on exactly one condition: a path was added to a
 * turn. Every early return above `chipsByTurn.set` carries the old map
 * forward, which is what makes "the map moved" and "a chip appeared" the
 * same statement.
 */
export function observeBanking(
  previous: BankingObservation,
  docs: DocsModelState,
  turn: number | null,
): BankingObservation {
  if (turn === null) return previous;
  if (!previous.baseline.primed) {
    return { baseline: bankBaseline(docs), chipsByTurn: previous.chipsByTurn };
  }

  const banked = bankedSince(previous.baseline, docs);
  const shouldRebaseline =
    docs.projectDir !== previous.baseline.projectDir || docs.seq > previous.baseline.seq;
  const baseline = shouldRebaseline ? bankBaseline(docs) : previous.baseline;
  if (banked.length === 0) {
    return baseline === previous.baseline
      ? previous
      : { baseline, chipsByTurn: previous.chipsByTurn };
  }

  const existing = previous.chipsByTurn.get(turn) ?? [];
  const merged = [...new Set([...existing, ...banked])].sort();
  if (merged.length === existing.length) {
    return baseline === previous.baseline
      ? previous
      : { baseline, chipsByTurn: previous.chipsByTurn };
  }
  const chipsByTurn = new Map(previous.chipsByTurn);
  chipsByTurn.set(turn, merged);
  return { baseline, chipsByTurn };
}

/** The UI's cap on one chip row (T-003's cap discipline). The underlying
 * set stays complete; only the rendering is bounded. */
export const MAX_CHIP_PATHS = 4;

/** How one chip row reads. `paths` is the complete set; the tail says so
 * honestly rather than silently dropping the remainder. */
export function chipLabel(paths: readonly string[]): string {
  const shown = paths.slice(0, MAX_CHIP_PATHS);
  const rest = paths.length - shown.length;
  return `banked → ${shown.join(", ")}${rest > 0 ? ` +${rest} more` : ""}`;
}

// ---- the challenge treatment -------------------------------------------

/** The method's literal marker for a challenge turn
 * (`method/roles/planner.md`: a challenge turn opens with the literal
 * prefix "pushing back:"). */
const CHALLENGE_PREFIX = "pushing back:";

export interface ChallengeReading {
  challenge: boolean;
  /** The turn's text with the marker and the whitespace after it
   * removed. The LABEL carries the semantics, and the planner contract
   * is explicit that the transcript is not the record, so stripping it
   * loses nothing. */
  body: string;
}

/**
 * Read the challenge marker off a turn's CURRENT text — the streaming
 * buffer while the turn runs, the canonical `completed` text after it
 * lands. One rule for both halves: mid-stream the treatment settles as
 * soon as the first delta carries the marker, and the `result` line
 * overwrites the buffer at completion, so a turn whose deltas merely
 * LOOKED like a challenge loses the treatment and a turn whose deltas
 * were dropped still gets it.
 *
 * The match is CASE-INSENSITIVE, which is a deliberate widening of the
 * method's "literal prefix" with a stated reason: models capitalise
 * sentence starts, and a rendering hint that fails on `Pushing back:` is
 * a hint that fails. It is anchored at the start (after leading
 * whitespace) so the words appearing mid-sentence are just words.
 */
export function challengeOf(text: string): ChallengeReading {
  const lead = text.replace(/^\s+/, "");
  if (lead.slice(0, CHALLENGE_PREFIX.length).toLowerCase() !== CHALLENGE_PREFIX) {
    return { challenge: false, body: text };
  }
  return {
    challenge: true,
    body: lead.slice(CHALLENGE_PREFIX.length).replace(/^\s+/, ""),
  };
}

// ---- the stage strip ---------------------------------------------------

/** What the strip needs from the lens's derivation, and a flag saying
 * whether the derivation survived reading the tree. */
export interface StageReading {
  approxStage: number | null;
  stageStep: string | null;
  /** True when `deriveGenesis` threw on this docs tree. */
  failed: boolean;
}

/**
 * The stage, derived from the SAME function the lens uses — and never
 * able to take the conversation down with it.
 *
 * THE REASON THIS IS NOT A PLAIN CALL, found by a test rather than
 * guessed at: T-037 wrapped the lens in an error boundary precisely
 * because "a throw inside the pane would otherwise unmount the whole
 * React tree and leave the user a blank window with their interview in
 * it". The chat then started calling `deriveGenesis` over the same docs
 * tree, from OUTSIDE that boundary — so a tree torn badly enough to
 * break the lens would have taken the interview with it, reintroducing
 * the exact failure the boundary exists to prevent, one layer up.
 *
 * The conversation is the load-bearing half of this screen and the stage
 * strip is derived decoration over a file tree the app does not control.
 * So the strip degrades and the chat stands: an unreadable tree reads
 * `stage —`, all segments future, and says so in the DOM
 * (`data-stage-derivation="failed"`) rather than silently looking like a
 * brand-new interview.
 */
export function stageOf(docs: DocsModelState): StageReading {
  try {
    const model = deriveGenesis(docs, EMPTY_CHANGE_LOG, 0);
    return { approxStage: model.approxStage, stageStep: model.stageStep, failed: false };
  } catch {
    return { approxStage: null, stageStep: null, failed: true };
  }
}

export type StageSegmentState = "done" | "current" | "future";

/** The seven segments the design draws — interview stages 1…7. */
export const INTERVIEW_STAGES = 7;

/**
 * The strip, from the lens's own `approxStage`.
 *
 * The two ends need saying because the design draws neither. The
 * derivation's scale is 0…8 (0 = the scaffold, 8 = decomposition) while
 * the strip is the seven QUESTIONS, so stage 0 renders all-future — the
 * scaffold is not a question — and stage 8 renders all-done, because
 * every question has been asked by the time cards are being written.
 */
export function stageStrip(approxStage: number | null): readonly StageSegmentState[] {
  const at = approxStage ?? 0;
  const segments: StageSegmentState[] = [];
  for (let stage = 1; stage <= INTERVIEW_STAGES; stage += 1) {
    segments.push(at > stage ? "done" : at === stage ? "current" : "future");
  }
  return segments;
}

/**
 * The header's right-hand readout, in the design's own word order
 * ("stage 4 of 7 · constraints").
 *
 * Deliberately phrased differently from the lens's `stage ~8 ·
 * decomposition`: the lens is describing which artifacts exist and marks
 * that with a tilde, while the strip is describing where the
 * CONVERSATION is and counts to seven. Both are approximations of the
 * same thing and the two halves of the split say so in different words —
 * flagged for @human rather than silently unified.
 */
export function stageReadout(approxStage: number | null, stageStep: string | null): string {
  if (approxStage === null) return "stage —";
  if (approxStage <= 0) return "scaffold";
  const at = Math.min(approxStage, INTERVIEW_STAGES);
  return `stage ${at} of ${INTERVIEW_STAGES}${stageStep === null ? "" : ` · ${stageStep}`}`;
}

/**
 * THE INPUT ROW'S HINT SLOT — three states, and "planner is thinking…" is
 * not one of the resting ones (T-171).
 *
 * IT USED TO BE TWO, WRITTEN INLINE AS A TERNARY ON ONE BOOLEAN: thinking
 * or not. That boolean was `interviewBusy`, which could strand true, so
 * the slot's ONLY other state was unreachable and the screen rested on a
 * claim that a turn was running when none was — the defect this card
 * exists for. The states are named here, as a function of a reading
 * rather than of a flag, so each is drivable and none is the absence of
 * another.
 *
 * THE THIRD STATE IS THE ENDING. An interview whose plan is on disk and
 * whose last turn has settled is finished, and a hint slot still
 * advertising "⏎ send" as though nothing had happened is the screen
 * failing to say so. It says the ending AND how to carry on, because
 * `completionOf` is not a latch and answering again is legitimate — the
 * conversation is not closed, it is complete.
 */
export function inputHint(inFlight: boolean, complete: boolean): string {
  if (inFlight) return "planner is thinking… · ⌘. to stop";
  if (complete) return "interview complete · ⏎ send to keep going";
  return "⏎ send · ⇧⏎ newline";
}

/* THE PER-MESSAGE FOOTER USED TO LIVE HERE — `questionFooter`, the
 * design's constant phrase plus the count, rendered under every current
 * question and every challenge. @human retired it at the 2026-08-30
 * genesis walk, verbatim: *"this is unnecessary -> one question at a
 * time · 6 of 7"* (T-172). The stage is already carried TWICE by the
 * header — `stageReadout` above and `stageStrip` above that — so the
 * line was chrome restating chrome. Recorded here rather than deleted
 * silently, because the next reader of `stageReadout`'s comment will
 * wonder where its sibling went. */

// ---- the transcript ----------------------------------------------------

/**
 * One rendered row. The transcript is a JOIN: planner halves come from
 * the store (which owns the `genesis-turn` channel), user halves are
 * recorded by the chat when `genesis_send_turn` answers `accepted`, and
 * chips come from the docs tree. Nothing here invents a half it did not
 * see.
 */
export type TranscriptEntry =
  | { kind: "user"; turn: number; text: string }
  | { kind: "planner"; turn: number; planner: GenesisTurn; current: boolean }
  | { kind: "banked"; turn: number; paths: readonly string[] };

/** The turn a newly observed docs change is attributed to: the highest
 * turn number seen so far, running or completed.
 *
 * Consequences, all deliberate and all tested: an artifact that lands
 * AFTER `completed` still belongs to that turn (the watcher's debounce
 * routinely pushes a snapshot past the result line, so attributing only
 * to a turn "in flight" would drop the most common case); and a write
 * that lands after the NEXT turn has started attributes to the new turn,
 * which is what the file evidence supports. */
export function activeTurn(turns: readonly GenesisTurn[]): number | null {
  let highest: number | null = null;
  for (const turn of turns) {
    if (highest === null || turn.turn > highest) highest = turn.turn;
  }
  return highest;
}

/**
 * REHYDRATION (T-029 criteria 1–2): the banked transcript, folded into
 * the two shapes the chat already renders.
 *
 * WHAT THIS FIXES, stated because it is invisible from the outside:
 * `refreshGenesisStatus` rebuilds `phase`/`turn`/`nativeSessionId` but
 * never `turns`, and the user's half lives only in
 * `interview-source.ts`'s module state — so an app restart or a remount
 * mid-interview showed an EMPTY CHAT over a live session. The conversation
 * was not where you left it, and nothing said so.
 *
 * THREE RULES, each one a place this could have lied:
 *
 *  1. **Live turns WIN.** A rehydrated turn is a memory of a completed
 *     exchange; a live turn is the exchange. Where both exist for the
 *     same number, the store's is kept — so a resumed turn streaming
 *     right now is never overwritten by the copy of it that was on disk.
 *  2. **App-assembled halves are dropped, on a TYPED FLAG.** The kickoff
 *     and the resume nudge ride `role: "user"` because they are the user
 *     half of the protocol, but the human did not type them, and
 *     rendering "You are the planner. KIT ROOT: …" in their own bubble
 *     would be the chat claiming they said it. Recognising machine text
 *     by READING it is the classify-by-string this project bans; the
 *     runner marks it instead (`TranscriptLine.machine`).
 *  3. **A rehydrated planner turn is `completed`, never `running`.** It
 *     is on disk, so it finished; giving it a live status would put a
 *     pulse dot on a turn nothing is generating.
 */
export function rehydrate(lines: readonly TranscriptLinePayload[]): {
  turns: readonly GenesisTurn[];
  userHalves: ReadonlyMap<number, string>;
} {
  const turns = new Map<number, GenesisTurn>();
  const userHalves = new Map<number, string>();
  for (const line of lines) {
    if (!Number.isFinite(line.turn)) continue;
    if (line.role === "planner") {
      turns.set(line.turn, {
        turn: line.turn,
        text: line.text,
        activity: [],
        // T-081's new `GenesisTurn` field, and EMPTY here is a statement
        // rather than a placeholder: `.supertaskr/genesis/transcript.jsonl`
        // banks the planner's text and nothing else, so a turn rebuilt
        // off disk genuinely has no record of what it was refused —
        // exactly as it has no record of `activity` above. Losable by the
        // same charter; `T-081-s3` records the gap.
        denials: [],
        status: "completed",
        truncatedRelay: false,
        error: null,
      });
    } else if (line.role === "user" && line.machine !== true) {
      userHalves.set(line.turn, line.text);
    }
  }
  return {
    turns: [...turns.values()].sort((a, b) => a.turn - b.turn),
    userHalves,
  };
}

type RehydratedTranscript = ReturnType<typeof rehydrate>;

/**
 * A transcript pull is an immutable snapshot in `GenesisState`. Keep its
 * projection for exactly as long as that payload object stays alive, so a
 * live delta does not manufacture six new historical `GenesisTurn`s while
 * changing only the seventh. A refreshed pull has a new array identity and
 * therefore earns a fresh projection.
 */
const rehydratedByPayload = new WeakMap<
  readonly TranscriptLinePayload[],
  RehydratedTranscript
>();

function rehydrateByPayload(
  lines: readonly TranscriptLinePayload[],
): RehydratedTranscript {
  const existing = rehydratedByPayload.get(lines);
  if (existing !== undefined) return existing;
  const hydrated = rehydrate(lines);
  rehydratedByPayload.set(lines, hydrated);
  return hydrated;
}

/** Live state over rehydrated state, per rule 1 above. Returns the live
 * arguments BY IDENTITY when there is nothing banked to add, so the
 * ordinary in-session render allocates nothing. */
export function mergeRehydrated(
  banked: readonly TranscriptLinePayload[],
  liveTurns: readonly GenesisTurn[],
  liveUserHalves: ReadonlyMap<number, string>,
): {
  turns: readonly GenesisTurn[];
  userHalves: ReadonlyMap<number, string>;
} {
  if (banked.length === 0) return { turns: liveTurns, userHalves: liveUserHalves };
  const old = rehydrateByPayload(banked);
  const turns = new Map<number, GenesisTurn>();
  for (const turn of old.turns) turns.set(turn.turn, turn);
  for (const turn of liveTurns) turns.set(turn.turn, turn);
  const userHalves = new Map(old.userHalves);
  for (const [number, text] of liveUserHalves) userHalves.set(number, text);
  return {
    turns: [...turns.values()].sort((a, b) => a.turn - b.turn),
    userHalves,
  };
}

/**
 * Interleave the three sources into render order: for turn N, the user
 * bubble (N ≥ 2) comes first, then the planner's turn, then the chips
 * banked against it.
 *
 * TURN 1 HAS NO USER HALF BY DESIGN. Its user half is the kickoff, which
 * lives in `.supertaskr/genesis/transcript.jsonl` and is exposed by no
 * command — so the chat renders no bubble for it rather than inventing
 * one.
 *
 * The LAST planner turn is the current question; everything above it is
 * history. Both maps are keyed by turn NUMBER and the chip payload is an
 * array of strings — no plain object is ever keyed by a path or by any
 * other string this app did not author (ADR-009).
 */
export function assembleTranscript(
  turns: readonly GenesisTurn[],
  userHalves: ReadonlyMap<number, string>,
  chipsByTurn: ReadonlyMap<number, readonly string[]>,
): readonly TranscriptEntry[] {
  const numbers = new Set<number>();
  for (const turn of turns) numbers.add(turn.turn);
  for (const number of userHalves.keys()) numbers.add(number);
  for (const number of chipsByTurn.keys()) numbers.add(number);

  const ordered = [...numbers].sort((a, b) => a - b);
  const lastPlanner = activeTurn(turns);
  const entries: TranscriptEntry[] = [];
  for (const number of ordered) {
    const user = userHalves.get(number);
    if (user !== undefined && number >= 2) {
      entries.push({ kind: "user", turn: number, text: user });
    }
    const planner = turns.find((t) => t.turn === number);
    if (planner !== undefined) {
      entries.push({
        kind: "planner",
        turn: number,
        planner,
        current: number === lastPlanner,
      });
    }
    const paths = chipsByTurn.get(number);
    if (paths !== undefined && paths.length > 0) {
      entries.push({ kind: "banked", turn: number, paths });
    }
  }
  return entries;
}

// ---- failure text ------------------------------------------------------

/** The UI's cap on a relayed error string. Rust already ran the tail
 * through `sanitize_for_log`; this is the second, independent bound, and
 * the tail is rendered as a text node either way. */
export const MAX_ERROR_CHARS = 2000;

/** One calm sentence per typed failure variant, in the runner's own
 * vocabulary. NOTHING here parses an error's text to classify it — that
 * was true before T-029 and it is MORE true now: the two failures that
 * used to be indistinguishable inside `exitNonZero` are told apart in
 * Rust, off typed stream fields, and arrive here already named. */
export function failureHeadline(error: TurnErrorPayload): string {
  switch (error.kind) {
    case "spawnFailed":
      return "the planner could not be started";
    case "startTimeout":
      return "the planner did not answer in time";
    case "stall":
      return "the planner stopped mid-answer";
    case "exitNonZero":
      return error.code === null
        ? "the planner exited without finishing"
        : `the planner exited with code ${error.code}`;
    case "malformedStream":
      return "the planner's output could not be read";
    case "authFailed":
      return "your CLI's login has expired";
    case "toolDenied":
      return "the planner was refused a tool it needed";
    case "rejectedSessionId":
      return "the saved session id is unusable";
  }
}

/**
 * THE ONE ACTION THAT HELPS, per typed failure — or `null` when the
 * generic "Try again" is genuinely the right and only offer.
 *
 * THIS IS THE WHOLE POINT OF THE CLASSIFICATION, and it is worth saying
 * why rather than leaving it to be inferred. Before T-029 an expired
 * login reached this screen as `exitNonZero { code: 1 }` with the CLI's
 * own words underneath and **Try again** below them — and Try again is
 * the one thing that cannot work, because nothing about the login has
 * changed between the two presses. A retry affordance over a failure that
 * is deterministic is not a courtesy; it is a lie with a button on it.
 *
 * `retry` says whether the existing Try again button stands. `hint` is
 * the sentence, `command` the literal the user runs, and `fallback`
 * whether the hand-driven route (which needs no login and no CLI at all)
 * is worth offering right there.
 */
export interface FailureAction {
  hint: string;
  command: string | null;
  retry: boolean;
  fallback: boolean;
}

export function failureAction(error: TurnErrorPayload): FailureAction | null {
  switch (error.kind) {
    case "authFailed":
      return {
        hint: "Log in to your agent CLI and the interview carries on from here — nothing is lost. Or drive it by hand right now, which needs no login at all.",
        // T-082: THIS SHIPPED AS `claude login`, WHICH IS NOT A COMMAND.
        // `claude [options] [command] [prompt]` parses an unrecognised
        // leading word as the PROMPT, so a user whose credentials really
        // had expired — following the app's own advice — started a
        // session that sent the word "login" to a model they could not
        // reach. Checked against the installed CLI 2.1.226 by reading its
        // own command surface, which spawns no turn and calls no model:
        // `claude --help` lists `auth  Manage authentication` and no bare
        // `login`; `claude auth --help` lists `login`/`logout`/`status`;
        // `claude auth login --help` prints that subcommand's own usage
        // (`--claudeai`, `--console`, `--email`, `--sso`).
        //
        // THE LITERAL IS THE APP'S OWN AND IS NEVER ASSEMBLED FROM
        // `error.message`. Nothing in this switch reads the CLI's text —
        // that text reaches the screen through `failureDetail` as
        // EVIDENCE and never as an instruction, so the app cannot inherit
        // a bad command from a CLI that prints one. Pinned by the T-082
        // bodies in app/test/interview-model.test.ts and
        // app/test/interview-resume-dom.test.tsx, which drive an auth
        // failure whose own words name a different command entirely.
        command: "claude auth login",
        // Deterministic until the login changes. Offering a retry would
        // be offering the one thing that cannot work.
        retry: false,
        fallback: true,
      };
    case "toolDenied":
      return {
        hint: `The planner asked for ${listOf(error.denials)} and supertaskr's allowlist does not carry it. Driving the interview by hand runs under your own CLI's permissions instead.`,
        command: null,
        // A denial is not deterministic across turns: the planner may
        // reach for something narrower next time.
        retry: true,
        fallback: true,
      };
    case "rejectedSessionId":
      return {
        hint: "The saved session in .supertaskr/ cannot be resumed. That file is runtime state — starting a fresh session loses nothing about the project, because docs/ is the record.",
        command: null,
        retry: false,
        fallback: false,
      };
    default:
      return null;
  }
}

/** "Bash", "Bash and WebFetch", "Bash, WebFetch and Write". */
export function listOf(names: readonly string[]): string {
  if (names.length === 0) return "a tool";
  if (names.length === 1) return names[0]!;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]!}`;
}

/** The variant's own words, capped, or `null` when the variant carries
 * none. Never interpreted — only bounded. */
export function failureDetail(error: TurnErrorPayload): string | null {
  const raw =
    error.kind === "spawnFailed"
      ? error.os
      : error.kind === "exitNonZero"
        ? error.stderrTail
        : error.kind === "malformedStream" || error.kind === "rejectedSessionId"
          ? error.why
          : error.kind === "authFailed"
            ? error.message
            : error.kind === "toolDenied"
              ? error.denials.join(", ")
              : "";
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed.length > MAX_ERROR_CHARS
    ? `${trimmed.slice(0, MAX_ERROR_CHARS)}…`
    : trimmed;
}

// ---- the OTHER family's next step --------------------------------------

/**
 * WHICH TYPED OUTCOMES THE NOTICE FAMILY ROUTES TO THE HAND-DRIVEN MODE
 * (T-107) — and, because the switch below is EXHAUSTIVE OVER THE UNION,
 * the standing ruling on every other arm beside the arm it rules on.
 *
 * **WHY THIS EXISTS AT ALL.** Two families of "this went wrong" reach
 * this screen and only one of them could ever carry an action.
 * `TurnError` goes through `failureAction` to `FailureBlock` and gets a
 * `hint`/`command`/`retry`/`fallback`. `StartOutcome`/`SendOutcome` go to
 * `OutcomeNotice`, which had no action slot at all — so
 * `unsupportedVersion` rendered a correct, typed, verified diagnosis and
 * offered the user nothing to do about it. **The app knew exactly what
 * was wrong, the user could fix it, and the screen did not say how.**
 *
 * **AND THE FIX DELIBERATELY DOES NOT GIVE THIS FAMILY A SECOND
 * `hint`/`command` PAIR** (criterion 4, read as the conditional it is: a
 * pair in two families that drift apart is the defect this card fixes,
 * arrived at from the other side). What the notice gains is a BOOLEAN
 * over the one affordance both families already share — the hand-driven
 * route, which is `FailureAction.fallback` under the other renderer. One
 * notion of an action, in two places, still one shape.
 *
 * **WHY A BOOLEAN AND NOT A STRING.** The command a too-old CLI needs is
 * `claude install`, `claude update`, `brew upgrade`, `npm i -g`, or
 * something this project has never seen, and it depends entirely on how
 * the user installed. **`UnsupportedVersion { found }` carries the
 * `--version` line and nothing else** — not the resolved path, not a
 * manager, not a channel — so this side cannot even see that the observed
 * binary was `/opt/homebrew/bin/claude`. Criterion 2 makes the burden
 * explicit: if a command is rendered, the card must state how the app
 * KNOWS it is the right one for this installation. **It cannot know, so
 * the refusal is recorded rather than guessed** — here and again at the
 * renderer, which is the screen a person actually reads. T-082 is the
 * precedent one layer down: the app shipped `claude login`, which is not
 * a command, and a user following the app's own advice sent the word
 * "login" to a model they could not reach.
 *
 * **THE MINIMUM VERSION IS NOT NAMED, AND THAT IS CRITERION 3 SATISFIED
 * RATHER THAN DODGED.** `CLAUDE_V1.min_major` in
 * `app/src-tauri/src/agent/adapter.rs` is the authority, and it reaches
 * this side through NOTHING: `unsupportedVersion` carries only `found`,
 * `GenesisStatusPayload` carries `cliVersion` and no floor, and no other
 * payload mentions it. Writing "2" here would be a second implementation
 * of a number owned in Rust (T-057), so the sentence says what this side
 * can actually derive — that the reported version is below what the app
 * drives — and the plumbing that would let the notice NAME the floor is
 * routed as `T-107-s1`, outside `[app-interview]`.
 *
 * **THE ENUMERATION IS THE COMPILER'S, NOT A READING OF A SWITCH**
 * (criterion 6). The `never` guard means an arm added to either union
 * fails `tsc` until somebody rules on it, so "an arm added later must not
 * escape the ruling" is enforced rather than asked for. THIRTEEN kinds
 * across the two unions at this commit — `started`, `busy`, `noProject`,
 * `alreadyPlanned`, `resumeAvailable`, `cliNotFound`,
 * `unsupportedVersion`, `sessionIdRejected`, `nothingToResume`, `error`
 * from `StartOutcome`; `accepted`, `noSession`, `staleProject` from
 * `SendOutcome`; `busy`, `cliNotFound` and `error` are in both.
 * `noticeSentence`'s ten arms are a SUBSET of that and are deliberately
 * not the enumeration.
 */
export function noticeRoutesToHandDriven(
  outcome: StartOutcomePayload | SendOutcomePayload,
): boolean {
  switch (outcome.kind) {
    // ---- routed: the agent CLI is the thing that is wrong -------------
    case "cliNotFound":
      // T-029's card, and the shape this arm copies: no usable binary at
      // all, so the ONE route that needs no binary is the offer.
      return true;
    case "unsupportedVersion":
      // T-107. From the user's side of the screen a binary the app
      // refuses to drive is a binary the app does not have — the same
      // situation as `cliNotFound` with a different cause, so it gets the
      // same route rather than a second kind of answer.
      return true;

    // ---- DELIBERATELY ACTIONLESS (criterion 7) -------------------------
    case "busy":
      // Transient and self-clearing: a turn is running and this one was
      // not sent. Nothing is broken, so nothing is offered — routing here
      // would offer an escape hatch from a working interview.
      return false;
    case "error":
      // UNTYPED BY CONSTRUCTION. `message` is whatever went wrong that
      // the runner could not name, so the app has no ground to stand on
      // for a next step and inventing one is exactly the guess this card
      // refuses. Try again is not offered either: this family has no
      // retry.
      return false;

    // ---- a next step exists and is ALREADY ON THIS SCREEN --------------
    case "resumeAvailable":
      // Its own block, with two buttons (pick it up / start fresh). The
      // notice is not even rendered for it.
      return false;
    case "sessionIdRejected":
      // Its own block, with "Start a fresh session". Same.
      return false;
    case "nothingToResume":
      // The resume raced the registry. `notStarted` is necessarily true
      // on this path — nothing started, no turns — so the "Start the
      // interview" block is on screen beside this notice, and a second
      // button for the same action would be two ways to do one thing.
      return false;

    // ---- fixable, but NOT by the route this function governs -----------
    case "noProject":
      // The fix is a folder, which is the SHELL's affordance (⌘O and the
      // front door), not this pane's. The hand-driven prompt is assembled
      // against a project directory, so routing here would offer a mode
      // that cannot run either. A notice growing its own front door is
      // the duplication T-049 spent a card removing.
      return false;
    case "alreadyPlanned":
      // Not a fault: the folder is DONE, not broken. The right half
      // already becomes the board the moment a task file parses
      // (T-028's `showsBoard`), so the next step is the screen the user
      // is already looking at.
      return false;

    // ---- ENUMERATED, RULED, AND FILED: a fix exists and is NOT offered --
    case "noSession":
      // "start the interview first" is stated in words and the button is
      // only conditionally beside it — `notStarted` requires
      // `phase === "idle"`, and a send can be refused with the phase at
      // `failed`. NOT ROUTED HERE: the hand-driven mode is the wrong
      // answer to "your session went away" when the CLI is fine. Filed as
      // `T-107-s2` rather than built, because giving this arm the right
      // affordance is a second product decision and this card is the
      // enumeration that found it (T-082's criterion 5, applied).
      return false;
    case "staleProject":
      // Names the other project and offers neither way out — reopen that
      // folder, or start a fresh session here. Same ruling and the same
      // reason as `noSession`, filed as `T-107-s3`. Not routed: the CLI
      // is not what is wrong.
      return false;

    // ---- successes, which never reach a notice at all ------------------
    case "started":
    case "accepted":
      // Derived rather than assumed: `reduceGenesisOutcome` sets
      // `lastOutcome: null` on exactly these two, and every
      // `interview-source.ts` caller sets `ui.notice` only on a
      // non-success answer. So both are unreachable here — and they are
      // ruled on anyway, because an unreachable arm silently omitted is
      // indistinguishable from an arm nobody thought about.
      return false;

    default: {
      // Criterion 6's teeth. A new arm in either union lands here, is not
      // assignable to `never`, and fails the build until it is ruled on
      // above. This is why the enumeration is the union's and not a
      // reading of `noticeSentence`, whose own `default` deliberately
      // degrades to the bare kind rather than crashing a screen.
      const unruled: never = outcome;
      return unruled;
    }
  }
}

// ---- a refusal is not a failure ----------------------------------------

/**
 * ONE REFUSED TOOL, AS A SENTENCE A HUMAN CAN READ (T-101).
 *
 * THIS SITS BELOW THE FAILURE SECTION AND SHARES NOTHING WITH IT, which
 * is the whole point rather than a filing decision. `TurnError`'s
 * `toolDenied` is a VERDICT — the turn died because a tool it needed was
 * refused. A `GenesisDenial` is not a verdict about anything: the
 * measured 2.1.226 turn carried two of them and ended `is_error: false`,
 * `terminal_reason: "completed"`, because the planner decomposed the
 * refused command and carried on
 * (docs/research/captures/real-planner-turn-2026-08-19.jsonl, lines 17,
 * 19 and 27). So this produces a neutral line and never a headline, and
 * nothing here reaches for `failureHeadline` or `failureAction`.
 *
 * EVERY FIELD MAY BE MISSING AND NONE OF THEM MAY PRINT AS ONE.
 * `toolName` is `string | null` and `message` may be empty or blank — a
 * refusal recovered from the cumulative `result` line arrives with no
 * message at all — so a template interpolating either straight would put
 * the word "null" on the screen this card exists to make trustworthy.
 * Both degrade to words instead, and the DOM suite asserts that neither
 * "null" nor "undefined" appears anywhere in the rendered subtree.
 *
 * The CLI's own text is BOUNDED and never interpreted. Rust already
 * capped it (`MAX_DENIAL_MESSAGE_BYTES`, 768); `MAX_ERROR_CHARS` is this
 * side's own second, independent ceiling on any relayed CLI string, and
 * it is deliberately the SAME constant `failureDetail` applies rather
 * than a second number that can drift away from it. What differs between
 * the two is the treatment, not the bound.
 */
export function denialLine(denial: GenesisDenial): string {
  const tool = denialToolName(denial) ?? "a tool";
  const raw = denial.message.trim();
  if (raw.length === 0) return `refused: ${tool} — the CLI gave no reason`;
  const why =
    raw.length > MAX_ERROR_CHARS ? `${raw.slice(0, MAX_ERROR_CHARS)}…` : raw;
  return `refused: ${tool} — ${why}`;
}

/**
 * THE NAME THIS REFUSAL IS KNOWN BY, WITH EXACTLY ONE OWNER.
 *
 * Two callers need it and they must not disagree: `denialLine` PRINTS it,
 * and `visibleDenials` below decides whether the terminal failure block
 * already said it. If those two computed the name differently, a refusal
 * could be suppressed under one spelling and displayed under another —
 * criterion 7's "the same refusal" would stop being one thing.
 *
 * `null` means "the CLI did not name a tool". T-101-s2's first half is
 * closed here rather than at the template: `toolName` is typed
 * `string | null`, which PERMITS `""` and `"   "`, and `??` catches
 * neither, so the row rendered `refused:  — <message>` with the tool name
 * silently missing. The invariant that made that unreachable
 * (`denial_field`'s `.map(str::trim).filter(|s| !s.is_empty())`) lives in
 * Rust, in another fence, and nothing on this side recorded the
 * dependency. Now nothing depends on it. **The message half of that
 * finding is NOT closed here** and stays filed: a message of only U+200B
 * survives `.trim()`, because the zero-width space is not ECMAScript
 * `WhiteSpace`, and widening the blank test to cover it is a different
 * decision about what "the CLI gave no reason" means.
 */
export function denialToolName(denial: GenesisDenial): string | null {
  const named = denial.toolName?.trim();
  return named === undefined || named.length === 0 ? null : named;
}

/**
 * WHICH REFUSALS THE LIVE NOTICE STILL OWES THE USER (T-101, rebuilt).
 *
 * Criterion 7 — *if the denial notice and the terminal `toolDenied` error
 * can both be on screen at once then the same refusal SHALL NOT read as
 * two different events* — licenses hiding **the same refusal**. It does
 * not license hiding a DIFFERENT one, and the first build's gate
 * (`planner.error?.kind !== "toolDenied"`, dropping the whole notice) did
 * exactly that.
 *
 * **THE OVER-SUPPRESSION WAS A SILENCE, WHICH IS THE DEFECT THIS CARD
 * EXISTS TO FIX, ONE LAYER UP.** `TurnError::ToolDenied` carries
 * `denials: Vec<String>` built by `denial_names`, which is
 * `filter_map(|d| d.tool_name.clone())` — an entry the CLI wrote without
 * a readable tool name contributes NOTHING to it, while still existing as
 * a `GenesisDenial` and still reaching this list. One mixed `result` line
 * produces both halves at once: the store holds two refusals, the failure
 * block names one, and a whole-notice gate put the other on no surface at
 * all. The runner's own comment at that partition reads *"a repeat is a
 * nuisance, a silence is the defect this card exists to fix"*.
 *
 * **SO THE KEY IS WHAT THE FAILURE BLOCK ACTUALLY RENDERED, NEVER THE
 * ERROR'S KIND.** On `toolDenied`, `FailureBlock` restates the refusals
 * BY NAME twice — `failureAction`'s hint (`listOf(error.denials)`) and
 * `failureDetail` (`error.denials.join(", ")`) — so a denial whose name is
 * in that array is genuinely on screen already and is dropped here. Every
 * other denial stands, including every nameless one, and including one
 * the CLI announced in band that the cumulative `result` line never
 * listed.
 *
 * **WHAT THIS COULD NOT REACH — CLOSED BY T-113, IN THE RUNNER, WHERE IT
 * BELONGED.** This paragraph used to describe a LIVE defect: the
 * `exitNonZero` path double-reported, because its failure block renders
 * `stderrTail`, an UNTYPED blob, into which `runner.rs` pushed
 * `permission_denials: <names>` for the same `unannounced` vector it
 * emits live `Denied` events from — so one result-only refusal reached
 * the screen as a notice row AND as a name in the tail. **No rule on this
 * side could honestly have stopped it**, and that is still the useful
 * half: keying suppression on that text would mean this module owning a
 * copy of a runner format string (T-057: a rule with two implementations
 * is two chances to disagree), against a tail that is a bounded RING and
 * may hold the note only in part. **T-113 deleted the ring note for the
 * set the runner already emits** — see `denial_names` and the T-113
 * comment at the `unannounced` partition in
 * `app/src-tauri/src/agent/runner.rs`, which record that the live events
 * are strictly more than the note was. So the double report is closed,
 * and the fix was the runner's exactly as this comment predicted.
 *
 * **THE ROUTING SENTENCE THAT USED TO END THIS PARAGRAPH IS GONE, NOT
 * MOVED** (T-107, taking T-113's own last criterion). It routed the fix
 * to `T-101-s1`, a file the seventh triage removed when T-113 absorbed
 * it — so it named a closed defect AND an unreachable target, which is
 * two stale claims and not one. `app/src/genesis/**` was outside T-113's
 * `[app-agent]` fence, so it routed the one-line correction here rather
 * than widening its own; this is that correction.
 */
export function visibleDenials(
  denials: readonly GenesisDenial[],
  error: TurnErrorPayload | null,
): readonly GenesisDenial[] {
  if (error === null || error.kind !== "toolDenied") return denials;
  const restated = error.denials;
  return denials.filter((denial) => {
    const name = denialToolName(denial);
    return name === null || !restated.includes(name);
  });
}

// ---- scroll policy -----------------------------------------------------

/** How close to the bottom still counts as "at the bottom", in px. */
export const STICK_THRESHOLD_PX = 48;

/**
 * Should a new turn scroll the transcript down?
 *
 * Only if the reader is already at the bottom — a chat that yanks the
 * view while someone is reading back through their own answers is worse
 * than one that never scrolls at all. Pure, because jsdom has no layout:
 * the POLICY is pinned in vitest and the BEHAVIOUR in the lane, where
 * there is a real scroll region and a real wheel (T-048's precedent).
 */
export function shouldStickToBottom(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  threshold: number = STICK_THRESHOLD_PX,
): boolean {
  return scrollHeight - scrollTop - clientHeight <= threshold;
}
