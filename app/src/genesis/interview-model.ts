import type { DocsModelState } from "@/lib/docs-model";
import type { GenesisTurn, TurnErrorPayload } from "@/lib/agent-store";

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
 *     the watcher delivered (criterion 3). The consequence is deliberate
 *     and tested: a file a HUMAN writes in a terminal mid-interview
 *     produces an identical chip, because the chip's claim is "this file
 *     changed on disk at this point in the conversation" and not "this
 *     turn caused it". That is ADR-006's hand-driven mode rendering
 *     correctly.
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
 */
export function bankedSince(
  baseline: BankBaseline,
  docs: DocsModelState,
): readonly string[] {
  if (!baseline.primed) return [];
  if (docs.seq === 0 || docs.seq <= baseline.seq) return [];
  if (docs.projectDir !== baseline.projectDir) return [];
  const banked: string[] = [];
  for (const [path, content] of docs.effective) {
    if (!isDocsArtifact(path)) continue;
    const before = baseline.contents.get(path);
    if (before === content) continue; // unchanged
    banked.push(path); // added (before === undefined) or changed
  }
  return banked.sort();
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

/** The footer under the current question. The design's constant phrase
 * plus the count, and just the phrase before there is a count to give. */
export function questionFooter(approxStage: number | null): string {
  if (approxStage === null || approxStage <= 0) return "one question at a time";
  return `one question at a time · ${Math.min(approxStage, INTERVIEW_STAGES)} of ${INTERVIEW_STAGES}`;
}

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
 * Interleave the three sources into render order: for turn N, the user
 * bubble (N ≥ 2) comes first, then the planner's turn, then the chips
 * banked against it.
 *
 * TURN 1 HAS NO USER HALF BY DESIGN. Its user half is the kickoff, which
 * lives in `.nputer/genesis/transcript.jsonl` and is exposed by no
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
 * vocabulary. NOTHING here parses an error's text to classify it —
 * auth-vs-anything-else is T-029's, and `exitNonZero` is relayed
 * verbatim precisely because the CLI reports authentication failure
 * in-band (T-025's smoke). */
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
  }
}

/** The variant's own words, capped, or `null` when the variant carries
 * none. Never interpreted — only bounded. */
export function failureDetail(error: TurnErrorPayload): string | null {
  const raw =
    error.kind === "spawnFailed"
      ? error.os
      : error.kind === "exitNonZero"
        ? error.stderrTail
        : error.kind === "malformedStream"
          ? error.why
          : "";
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed.length > MAX_ERROR_CHARS
    ? `${trimmed.slice(0, MAX_ERROR_CHARS)}…`
    : trimmed;
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
