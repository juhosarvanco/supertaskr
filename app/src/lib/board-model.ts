import type {
  ComponentRecord,
  ParseIssue,
  ProjectParseResult,
  ReviewMode,
  TaskRecord,
  TaskSize,
  TaskStatus,
} from "@nputer/parser/pure";
import { rejectedVerdictCount } from "./verdicts";

/**
 * Story map board model (T-004): a pure function of the T-003 store's
 * DocsModel. No React, no Tauri, no IO — `selectBoard(model)` derives
 * everything the board renders, so grouping, ordering, slice-line
 * placement, unmapped routing, ghost/parked partition, and badge
 * derivation are unit-testable without a DOM. Components stay thin
 * views over this result.
 *
 * Rendering semantics per the T-004 implementation plan
 * (docs/tasks/T-004-story-map-board.md) and docs/design/dashboard.md.
 *
 * ADR-009: collections keyed by file-derived strings (feature ids) are
 * Maps, never plain object literals.
 */

/** The six statuses that render as real cards, each with its own
 * `--status-<token>-bg/fg` pair in tokens.css. `suggested` (ghost) and
 * `parked` (collapsed row) render differently and have no pair. */
export type StatusToken =
  | "planned"
  | "building"
  | "verifying"
  | "rejected"
  | "done"
  | "merging";

export interface StatusVisual {
  /** Which token pair colors the card. */
  token: StatusToken;
  /** True for verifying and merging: the card pulses (motion-safe). */
  pulse: boolean;
}

/**
 * Status → visual treatment. planned gray · building amber · verifying
 * amber + pulse · rejected red · done teal · merging teal + pulse (the
 * plan's decision for the sixth status the criterion doesn't name).
 * Total over TaskStatus so a stray call cannot throw; suggested/parked
 * fall back to the planned pair but are never rendered as real cards.
 */
export function statusVisual(status: TaskStatus): StatusVisual {
  switch (status) {
    case "planned":
      return { token: "planned", pulse: false };
    case "building":
      return { token: "building", pulse: false };
    case "verifying":
      return { token: "verifying", pulse: true };
    case "rejected":
      return { token: "rejected", pulse: false };
    case "done":
      return { token: "done", pulse: false };
    case "merging":
      return { token: "merging", pulse: true };
    case "suggested":
    case "parked":
      return { token: "planned", pulse: false };
  }
}

/**
 * Short display name for the model badge: `claude-fable-5` → `fable`,
 * `codex` → `codex`, `codex/gpt-5.2` → `codex` (stamped combo shows the
 * agent-CLI part). Heuristic: take the segment before any `/`, drop a
 * trailing version tail (`-5`, `-5.2`, `-v2`), then drop a leading
 * `claude` vendor prefix. Falls back to the input when stripping would
 * leave nothing. The full raw value stays available for hover.
 */
export function shortModelName(model: string): string {
  const trimmed = model.trim();
  const base = (trimmed.split("/")[0] ?? trimmed).trim();
  if (base === "") return trimmed;
  const segments = base.split("-");
  while (segments.length > 1 && /^v?\d+(\.\d+)*$/i.test(segments[segments.length - 1] ?? "")) {
    segments.pop();
  }
  if (segments.length > 1 && (segments[0] ?? "").toLowerCase() === "claude") {
    segments.shift();
  }
  const short = segments.join("-");
  return short === "" ? base : short;
}

/** Model badge content, or undefined when the card shows none. */
export interface ModelBadgeInfo {
  /** Short display name, e.g. `fable`. */
  short: string;
  /** Full raw model[@session] value, for hover. */
  full: string;
}

/** One renderable card (real or ghost). Everything the card face needs,
 * derived once here so components stay logic-free. */
export interface BoardCard {
  /** Stable render key: the source file path (unique per snapshot). */
  key: string;
  id?: string;
  title: string;
  status: TaskStatus;
  size?: TaskSize;
  priority?: number;
  milestone?: number;
  visual: StatusVisual;
  /** Model badge: builder pre-done, built_by once done/merging (with
   * fallback to whichever is set). Absent when neither is. */
  model?: ModelBadgeInfo;
  /** Verification badge; present only on done cards with review: set. */
  review?: ReviewMode;
  /** Ghost provenance line (T-006): who suggested a suggested task. */
  suggestedBy?: string;
  /** How many REJECTED entries the task's `## Verdicts` history carries
   * (T-006-s3), derived here from the panel's own verdict classifier —
   * no parser change, and face/panel can never disagree. Present only
   * when > 0: zero verdicts (or zero rejections) is ABSENCE, never ×0.
   * The face renders it as the design's `rejected ×N` status word. */
  rejectedCount?: number;
  /**
   * The parser's own sentences about THIS card's file (T-019-s1), in
   * issue order — the soft issues that flag a record without withholding
   * it (a dangling `blocked_by`, a `feature` outside the backbone, a
   * malformed optional field). The face wears a mark; the detail panel
   * lists them verbatim.
   *
   * ABSENT, never `[]`, on a clean card — the same absence discipline
   * `rejectedCount` and `BoardColumn.aliasedWith` take (T-017), so a
   * consumer asking `card.issues !== undefined` is asking exactly "does
   * this card have something to disclose".
   */
  issues?: string[];
  file: string;
}

export interface BoardColumn {
  /** Stable render key: feature id, or "unmapped". */
  key: string;
  /** Backbone feature id (F-NN); absent for the unmapped column. */
  featureId?: string;
  /** Header text: feature name, or "unmapped". */
  name: string;
  description: string;
  /**
   * The OTHER backbone spellings that occupy this column's numeric slot
   * (T-097): `F-1`'s column carries `["F-01"]` and vice versa. Present
   * only on a column the parser named in an `aliased-id` issue —
   * ABSENT, never `[]`, when the id is unaliased (T-017: absence is not
   * a count of zero).
   *
   * This is the board's DISCLOSURE of a defect it deliberately does not
   * repair; the reason it does not is at the routing site in
   * `selectBoard`. It exists so the split is visible AT the column
   * rather than only in the issue list on the other side of the screen.
   */
  aliasedWith?: string[];
  /** Real cards (not suggested/parked) in display order: milestone-1
   * block first, then later; priority asc within each block. */
  cards: BoardCard[];
  /** Index into `cards` where the milestone slice line renders:
   * cards[0..sliceIndex) are milestone 1, the rest are later. */
  sliceIndex: number;
  /** Suggested tasks, rendered as dashed ghosts below all real cards. */
  ghosts: BoardCard[];
  /** Parked tasks, collapsed into one "N parked" row at the bottom that
   * expands in place (T-005-s1): the row surfaces the entries themselves
   * — id-ordered like ghosts — so the one population the board could
   * not inspect opens in the detail panel via cardRef like everything
   * else. Parked tasks always carry ids (TASK-FORMAT requiredness), so
   * their refs resolve by id. */
  parked: BoardCard[];
}

export interface BoardModel {
  /** Backbone order, plus a trailing unmapped column only when needed. */
  columns: BoardColumn[];
  /** True when there is nothing to render at all (no backbone features
   * and no tasks): the board shows a minimal "no features found" line. */
  empty: boolean;
}

/**
 * The parser's issues indexed by the ONE file each names (T-019-s1).
 *
 * A pure lens, and the only join between `model.issues` and a card. It
 * is the board's answer to the gap T-019 left: a flagged record still
 * renders, so a task whose `blocked_by` dangles looked identical to a
 * clean one and the reader had to go hunting. `App.tsx`'s aggregate
 * count and T-077's strip are UNCHANGED and stay the whole-model view —
 * this is the same facts, one level closer to where the eye already is.
 *
 * READ THE FIELD, NEVER THE KIND (the discipline `issueFiles` in
 * docs-model.ts already states for the strip): `ParseIssue` carries
 * paths in two shapes, and this lens joins on the SINGULAR `file` — the
 * issues that are ABOUT one record. The cross-file kinds (`duplicate-id`,
 * `aliased-id`, `dependency-cycle`, `ambiguous-mapping`) carry `files`
 * and are deliberately NOT joined here: they are statements about a
 * RELATION between records, they already have their own surfaces (the
 * column's `aliasedWith` for a padding-aliased backbone, T-097; T-077's
 * strip for all of them), and marking two cards with a sentence about
 * their pair would say something neither card's file is wrong. Widening
 * to `files` is a separate decision with its own design question, filed
 * rather than taken (T-031-s2).
 *
 * ADR-009: keyed by a path read off disk — a Map, never an object
 * literal. Messages are the parser's own, VERBATIM: the board is a
 * reading surface, never a summary (T-005).
 */
export function issuesByFile(issues: readonly ParseIssue[]): Map<string, string[]> {
  const byFile = new Map<string, string[]>();
  for (const issue of issues) {
    // `in` narrows the union structurally, so a kind added tomorrow that
    // carries `file` joins the day it lands — no list to remember.
    const file = "file" in issue ? issue.file : undefined;
    if (file === undefined) continue;
    const existing = byFile.get(file);
    if (existing === undefined) byFile.set(file, [issue.message]);
    else existing.push(issue.message);
  }
  return byFile;
}

/** `{ issues }` when the file has any, `{}` when it does not — the
 * `spreadAlias` shape, so a clean card never grows the key at all. */
function spreadIssues(issues: string[] | undefined): { issues?: string[] } {
  return issues === undefined || issues.length === 0 ? {} : { issues };
}

const isDoneish = (status: TaskStatus): boolean => status === "done" || status === "merging";

function modelBadge(task: TaskRecord): ModelBadgeInfo | undefined {
  const chosen = isDoneish(task.status)
    ? (task.builtBy ?? task.builder)
    : (task.builder ?? task.builtBy);
  if (chosen === undefined) return undefined;
  return { short: shortModelName(chosen.model), full: chosen.raw };
}

function toCard(task: TaskRecord, issues: Map<string, string[]>): BoardCard {
  const rejections = rejectedVerdictCount(task.sections.verdicts);
  return {
    ...spreadIssues(issues.get(task.file)),
    key: task.file,
    id: task.id,
    title: task.title,
    status: task.status,
    size: task.size,
    priority: task.priority,
    milestone: task.milestone,
    visual: statusVisual(task.status),
    model: modelBadge(task),
    // Plan: the verification badge renders on done cards, from review:.
    review: task.status === "done" ? task.review : undefined,
    suggestedBy: task.suggestedBy,
    // Absence, not 0 (T-017): no verdicts — or none rejected — is no count.
    rejectedCount: rejections > 0 ? rejections : undefined,
    file: task.file,
  };
}

/** Deterministic id/file ordering; numeric-aware so T-9 < T-10. */
const byText = (a: string, b: string): number => a.localeCompare(b, "en", { numeric: true });

/** priority asc (missing last) → id asc (missing last) → file asc. */
function byPriority(a: BoardCard, b: BoardCard): number {
  const pa = a.priority ?? Number.POSITIVE_INFINITY;
  const pb = b.priority ?? Number.POSITIVE_INFINITY;
  if (pa !== pb) return pa - pb;
  if (a.id !== undefined && b.id !== undefined && a.id !== b.id) return byText(a.id, b.id);
  if ((a.id === undefined) !== (b.id === undefined)) return a.id === undefined ? 1 : -1;
  return byText(a.file, b.file);
}

/** Ghost order: id asc (missing last) → file asc (no priority on ghosts). */
function byIdThenFile(a: BoardCard, b: BoardCard): number {
  if (a.id !== undefined && b.id !== undefined && a.id !== b.id) return byText(a.id, b.id);
  if ((a.id === undefined) !== (b.id === undefined)) return a.id === undefined ? 1 : -1;
  return byText(a.file, b.file);
}

interface MutableColumn {
  key: string;
  featureId?: string;
  name: string;
  description: string;
  aliasedWith?: string[];
  real: BoardCard[];
  ghosts: BoardCard[];
  parked: BoardCard[];
}

/**
 * Feature id -> the OTHER spellings sharing its numeric slot, read
 * STRAIGHT OFF the parser's `aliased-id` issues (T-097).
 *
 * The board does NOT re-derive the slot rule. `idSlotKey` lives in
 * `lib/parser/src/id-slot.ts` and is not exported from the package,
 * and T-057 is explicit that one rule with two implementations is two
 * chances to disagree — so this reads the parser's ANSWER instead of
 * asking the same question again. The consequence is worth naming: if
 * the parser ever stops reporting a feature alias, these columns stop
 * disclosing it, which is the correct coupling. One source of truth
 * about what aliases what.
 *
 * `space: 'feature'` is the filter that matters — the same kind is
 * emitted for component and task ids, and a component alias must not
 * mark a board column.
 */
function featureAliasIndex(issues: readonly ParseIssue[]): Map<string, string[]> {
  // ADR-009: keys are feature ids read from files — a Map, never a literal.
  const others = new Map<string, string[]>();
  for (const issue of issues) {
    if (issue.kind !== "aliased-id" || issue.space !== "feature") continue;
    for (const id of issue.ids) {
      const rest = issue.ids.filter((other) => other !== id);
      if (rest.length > 0) others.set(id, rest);
    }
  }
  return others;
}

/** `{ aliasedWith }` when there is one, `{}` when there is not — so an
 * unaliased column never grows the key (T-017's absence discipline). */
function spreadAlias(alias: string[] | undefined): { aliasedWith?: string[] } {
  return alias === undefined ? {} : { aliasedWith: alias };
}

/** Column key/name for the trailing catch-all column. */
export const UNMAPPED_KEY = "unmapped";

/**
 * Derive the board from a parsed project model.
 *
 * - Columns = backbone features in ROADMAP order (duplicate backbone ids
 *   collapse into the first occurrence — the parser already flags the
 *   duplicate as an issue; a second identical column adds nothing).
 * - A task routes to its feature's column BY EXACT STRING; tasks whose
 *   feature is unset or not in the backbone land in the trailing
 *   "unmapped" column (criterion 4 — nothing is ever dropped), which
 *   appears only when non-empty. Feature-less suggestions land there
 *   too. A padding-aliased backbone (`F-1` beside `F-01`) is DISCLOSED
 *   on both columns and deliberately NOT normalised — the ruling and
 *   its three reasons are at the routing site below (T-097).
 * - Within a column: parked → the collapsed row's entries (id-ordered,
 *   T-005-s1), suggested → ghosts, the rest → real cards ordered
 *   milestone-1 block first (slice line between the blocks stays a
 *   single boundary even if priorities interleave across milestones),
 *   priority asc / id asc / file asc within each block. Status never
 *   affects position: done cards keep their slot.
 */
export function selectBoard(model: ProjectParseResult): BoardModel {
  // ADR-009: feature ids come from files — keyed collection is a Map.
  const byFeature = new Map<string, MutableColumn>();
  const featureColumns: MutableColumn[] = [];
  const aliasedWith = featureAliasIndex(model.issues);
  // T-019-s1: one pass over the issues, joined to cards below by file.
  const issuesByPath = issuesByFile(model.issues);

  for (const feature of model.features) {
    if (byFeature.has(feature.id)) continue; // duplicate backbone id: first wins, issue already flagged
    const column: MutableColumn = {
      key: feature.id,
      featureId: feature.id,
      name: feature.name,
      description: feature.description,
      // Spread, not `aliasedWith: undefined`: an unaliased column does
      // not carry the key at all, so `toStrictEqual` and `in` agree
      // with the doc comment's "ABSENT, never []".
      ...spreadAlias(aliasedWith.get(feature.id)),
      real: [],
      ghosts: [],
      parked: [],
    };
    byFeature.set(feature.id, column);
    featureColumns.push(column);
  }

  const unmapped: MutableColumn = {
    key: UNMAPPED_KEY,
    name: UNMAPPED_KEY,
    description: "tasks whose feature is not in the backbone",
    real: [],
    ghosts: [],
    parked: [],
  };

  for (const task of model.tasks) {
    // T-097 — THE RULING: routing stays EXACT-STRING, and a
    // padding-aliased backbone is DISCLOSED rather than repaired.
    //
    // `F-1` beside `F-01` is one numeric slot spelled twice; the parser
    // reports it (`aliased-id`, space `feature`) and it is tempting to
    // read that issue here and route both spellings to one canonical
    // column, "repairing" the alias the way the skip above appears to
    // repair a duplicate. REFUSED, for three reasons the duplicate case
    // does not share:
    //
    // 1. THERE IS NO CANONICAL COLUMN TO ROUTE TO. The two bullets are
    //    two DECLARATIONS, each with its own name and description;
    //    nothing in the roadmap says which one the slot means. Choosing
    //    — first-declared, or the shorter spelling — would make the
    //    board pick an arbitrary winner nobody declared, which is the
    //    precise defect `aliased-id` exists to report (T-030, T-053).
    //    The board would commit the bug it is displaying the warning
    //    for, and it would do so silently, under a heading naming one
    //    of the two descriptions.
    // 2. THE DUPLICATE-ID SKIP IS NOT A PRECEDENT FOR NORMALISING.
    //    Two bullets both spelled `F-01` carry ONE id string, so a Map
    //    keyed by that string cannot hold two columns for them: the
    //    skip is a consequence of KEYING, not a policy of repairing
    //    defects. An alias has two distinct strings and keys two
    //    distinct columns with no help from anyone.
    // 3. A TASK IS NEVER FILED AGAINST TEXT IT DOES NOT CARRY. Today
    //    `feature: F-01` lands under the bullet spelled `F-01` — what
    //    the file says, verifiable by reading two files. Slot routing
    //    would file it under a heading its own frontmatter never names.
    //
    // What the board owes instead is DISCLOSURE WHERE THE HARM IS: both
    // columns carry `aliasedWith`, and FeatureColumn renders it in the
    // header, so the one-slot-two-columns split is visible at the
    // columns rather than only as an advisory issue elsewhere on the
    // screen. Pinned in `app/test/select-board.test.ts`, describe "a
    // padding-aliased backbone slot (T-097)", and in the DOM by
    // `app/test/board-truth.test.tsx`.
    const column =
      (task.feature !== undefined ? byFeature.get(task.feature) : undefined) ?? unmapped;
    const card = toCard(task, issuesByPath);
    if (task.status === "parked") {
      column.parked.push(card);
    } else if (task.status === "suggested") {
      column.ghosts.push(card);
    } else {
      column.real.push(card);
    }
  }

  const hasContent =
    unmapped.real.length > 0 || unmapped.ghosts.length > 0 || unmapped.parked.length > 0;
  const all = hasContent ? [...featureColumns, unmapped] : featureColumns;

  const columns: BoardColumn[] = all.map((column) => {
    const milestone1 = column.real.filter((c) => c.milestone === 1).sort(byPriority);
    const later = column.real.filter((c) => c.milestone !== 1).sort(byPriority);
    return {
      key: column.key,
      featureId: column.featureId,
      name: column.name,
      description: column.description,
      ...spreadAlias(column.aliasedWith),
      cards: [...milestone1, ...later],
      sliceIndex: milestone1.length,
      ghosts: [...column.ghosts].sort(byIdThenFile),
      parked: [...column.parked].sort(byIdThenFile),
    };
  });

  return { columns, empty: columns.length === 0 };
}

// ---------------------------------------------------------------------
// THE DISPATCH FRONTIER (T-111): what is dispatchable, and WHY the rest
// are not.
//
// `method/roles/orchestrator.md` step 4 is the whole rule: *among the
// topmost undone tasks of each feature column, pick the highest-priority
// one that is unblocked AND whose `touches:` don't overlap any task
// currently building. Ceiling: 3-5 concurrent.* Everything below derives
// one sentence per card from that step, the parsed model, and the lane
// reader's answer.
//
// **THE FIELD IS A DECLARATION AND IT IS ACCURATE; WHAT IS DERIVED IS
// WHETHER IT STILL BINDS.** `blocked_by: [T-104]` on a card whose T-104
// has landed is not stale — it is *historically accurate*, and it is the
// only record of why this work was sequenced the way it was. Nothing
// about it needs clearing, and clearing it destroys lineage.
//
// **THAT SENTENCE IS A RULING AND IT COST A REJECTED CARD TO REACH.**
// `T-136` proposed a gate failing any planned card whose `blocked_by`
// named a `done` id, on the argument that the field "decays"; it was
// rejected on main hours after it was filed, and four declarations
// cleared under that argument were restored byte-identical. **The defect
// was never in the data.** It was in a QUERY — a shell loop that read a
// non-empty `blocked_by` as "blocked" without resolving the ids. So the
// thing worth building is not a cleaner field; it is a derivation that
// never asks the field for a verdict it does not hold. That is this one.
//
// **AND THE PANEL HAS RESOLVED THESE IDS ALL ALONG.**
// `selectTaskDetail` in `./task-detail.ts` (C-09) already turns each
// entry into a `BlockerLink` carrying `resolved`, the target's `status`
// and its visual, and `TaskDetailPanel.tsx` renders a done blocker in its
// status colour with a tick. **This module adds the JUDGEMENT that layer
// deliberately does not make** — *does it still bind* — and does not
// consume `BlockerLink` to get there, for a structural reason rather than
// a preference: `task-detail.ts` imports `BoardCard` and `statusVisual`
// FROM this file, so C-09 -> C-08 already exists and an import back would
// close a component CYCLE. If the two are ever merged, the shared half
// moves in THIS direction and never the other.
//
// **THREE BINDINGS, NEVER FOLDED INTO ONE.** A blocker still open, a
// blocker that names no card at all, and a blocker that is PARKED are
// three different sentences to a reader: the first is a wait with an end,
// the second is a defect in THIS card rather than a reason to wait, and
// the third is a wait nobody has scheduled an end for. `task-waves.ts`'s
// `readSchedule` folds the second into "blocked" by construction and says
// so in its own header — it is C-12's, outside this card's fence, so the
// divergence is recorded here rather than repaired (`T-111-s7`).
//
// **THE LANE LIST OUTRANKS THE STAMP.** `method/roles/executor.md` row 5
// rules the live worktree list authoritative over the board's `status:`
// whenever the two disagree, and both disagreements are real: a stamp
// with no worktree, and a worktree with no stamp. This derivation
// therefore takes the JOIN's answer rather than a status field, and it
// TAKES it rather than recomputing it — the four states are
// `app/src-tauri/src/dispatch/join.rs`'s, with a pin under each since
// T-110's rebuild, and a second spelling of that rule here is exactly the
// divergence T-110 exists to remove (T-111-s2 item 2).
//
// **AND IT NAMES THE DISAGREEMENT WITHOUT NAMING A CAUSE.** A card
// stamped in flight beside no worktree has meant "somebody forgot" nearly
// every time it has appeared in this project's record — and at the commit
// this was written it did NOT mean that: `T-135` is deliberately
// merged-but-open pending a human ruling and `docs/STATE.md` carries a
// whole heading saying so. A derivation cannot read intent, so it reports
// the two facts and stops. "Lapsed", "forgotten" and "dead" are words for
// the reader to reach, never for this file to assert.
// ---------------------------------------------------------------------

/**
 * The four states `join.rs` names, mirrored STRUCTURALLY so this module
 * declares no dependency on C-15 for two fields — the shape
 * `dispatch-store.ts`'s own `BoardStamp` already uses, for the same
 * reason: an import here would be an undeclared C-08 -> C-15 component
 * edge bought for a type alias.
 *
 * The AUTHORITY is the Rust enum. Nothing in this repository pins the two
 * vocabularies equal across the language boundary; `T-110-s3` carries
 * that, and pinning it needs exactly the import this comment explains
 * away.
 */
export type LaneJoinState = "live" | "died" | "stampSkipped" | "notDispatched";

/** One worktree registration git wrote down, as much of it as the
 * frontier reads. Structurally satisfied by `LaneRegistration`. */
export interface LaneHold {
  readonly taskId: string;
  readonly branch: string;
  readonly worktreePath: string;
  /** The worktree directory is still there. A registration whose
   * directory is gone is NOT a live lane and holds no fence. */
  readonly existsOnDisk: boolean;
}

/** One task id, and what the card and the disk together say about it.
 * Structurally satisfied by `DispatchRow`. */
export interface DispatchStamp {
  readonly taskId: string;
  readonly state: LaneJoinState;
  readonly lanes: readonly LaneHold[];
}

/**
 * What the lane reader had to say, as the frontier consumes it.
 * Structurally satisfied by `DispatchJoin`.
 *
 * **`unavailable` IS WHY THIS IS A UNION, one layer up from where
 * `dispatch-store.ts` makes the same argument.** When the scan refused,
 * the app knows NOTHING about lanes — and every card would then read
 * `dispatchable`, because an empty lane set is indistinguishable from a
 * quiet repository. That is the failure direction this card exists to
 * close, so the frontier refuses to answer instead of answering freely.
 */
export type DispatchReading =
  | { readonly kind: "joined"; readonly rows: ReadonlyMap<string, DispatchStamp> }
  | { readonly kind: "unavailable"; readonly sentence: string };

/**
 * `orchestrator.md` step 4's *"Ceiling: 3-5 concurrent."*, as a constant.
 *
 * A RANGE, because the step states one: below `min` the board is
 * under-parallel, at `max` it is full. Only `max` refuses a dispatch, and
 * `min` is carried rather than dropped so the constant says what the step
 * says. Asserted against the live `method/roles/orchestrator.md` in
 * `app/test/select-board.test.ts` with both bounds HARDCODED in the body
 * — never parametrised by this object, which is the shape that let
 * `BRANCH_MAX_LEN` survive T-110's first drill.
 */
export const CONCURRENCY_CEILING: { readonly min: number; readonly max: number } = Object.freeze({
  min: 3,
  max: 5,
});

/** The six dispositions, closed. */
export const DISPOSITIONS = [
  "dispatchable",
  "blocked",
  "fenced",
  "not-topmost",
  "at-ceiling",
  "not-applicable",
] as const;

export type Disposition = (typeof DISPOSITIONS)[number];

/**
 * Why one declared blocker is still unmet — three values, deliberately
 * NOT folded (T-111-s4's trap).
 *
 * - `open`    — the blocker exists and is not done. An ordinary wait.
 * - `missing` — no live card declares that id. A defect in THIS card, not
 *   a reason to wait: the parser already says so as a
 *   `dangling-reference` issue carrying a near-miss hint, and the
 *   frontier consumes that sentence rather than re-deriving it (T-057).
 * - `parked`  — the blocker is shelved, so the wait has no scheduled end.
 */
export type BlockerBinding = "open" | "missing" | "parked";

export interface UnmetBlocker {
  readonly id: string;
  readonly binding: BlockerBinding;
  /** The blocker's own status; absent exactly when `binding` is `missing`. */
  readonly status?: TaskStatus;
  /** The parser's own sentence about this reference, verbatim, when it
   * emitted one. Present only for `missing`, and QUOTED INTO THE RENDERED
   * REASON rather than merely carried here — see {@link blockedReason}. A
   * near-miss hint that stops at this field has been computed and thrown
   * away. */
  readonly parserSaid?: string;
}

/** A fence overlap, named on both faces and through the component that
 * carries it — never as two slug STRINGS (T-111-s1). */
export interface FenceClash {
  /** This card's `touches:` entry. */
  readonly token: string;
  /** The live lane's `touches:` entry it collides with. */
  readonly laneToken: string;
  readonly laneTaskId: string;
  readonly laneBranch: string;
  /** The expanded paths both entries reserve, deduped and sorted. */
  readonly sharedPaths: readonly string[];
  /** Component ids both entries expand through; empty when the collision
   * is between two literal path tokens rather than through the registry.
   * NON-EMPTY IS THE COARSE-FENCE TELL a human overrides on. */
  readonly viaComponents: readonly string[];
}

/** One card's answer. */
export interface CardDisposition {
  readonly taskId: string;
  readonly file: string;
  readonly disposition: Disposition;
  /**
   * The reason, as a SENTENCE. A disposition with no reason is not done
   * being computed (criterion 4) — with one exception, which is the
   * criterion beside it: a `done`, `merging` or `parked` card carries no
   * reason at all, because progress must not acquire a scolding.
   */
  readonly reason?: string;
  /** Present exactly when `disposition` is `blocked`. */
  readonly unmet?: readonly UnmetBlocker[];
  /** Present exactly when `disposition` is `fenced`. */
  readonly clash?: FenceClash;
  /** Present exactly when `disposition` is `not-topmost` and the card
   * above carries an id. */
  readonly behind?: string;
}

/** One live lane, as the ceiling counts it. */
export interface InFlightLane {
  readonly taskId: string;
  readonly branch: string;
  readonly worktreePath: string;
  /** The card's `touches:` verbatim; empty when no card claims the lane. */
  readonly touches: readonly string[];
  /** True when the board and the worktree list disagree about this id —
   * a lane whose card is not stamped in flight. */
  readonly disagrees: boolean;
  /**
   * A card on the board claims this lane's task id, so its fence could be
   * READ. False is a worktree on a `task/` branch that no card declares:
   * its fence is not empty, it is UNKNOWN, and the two are not the same
   * fact. Nothing can be certified disjoint from an unknown fence, so a
   * `dispatchable` reason says so out loud rather than quietly counting
   * the lane as reserving nothing.
   */
  readonly fenceKnown: boolean;
}

export type DispositionModel =
  | {
      readonly kind: "derived";
      /** Task id -> answer. A Map: ids are read from files (ADR-009). */
      readonly cards: ReadonlyMap<string, CardDisposition>;
      readonly inFlight: readonly InFlightLane[];
      readonly ceilingReached: boolean;
      /**
       * The board's one-line answer. Criterion 5 asks for DIFFERENT
       * SENTENCES for "nothing is dispatchable" and "the ceiling is
       * reached", because they are different situations wanting different
       * responses: one wants a card unblocked, the other wants a lane to
       * land.
       */
      readonly headline: string;
    }
  | { readonly kind: "undecidable"; readonly sentence: string };

// ---------------------------------------------------------------------
// Normalisation — ONE function, and it states its own ceiling.
// ---------------------------------------------------------------------

/**
 * The canonical spelling of one `touches:` entry.
 *
 * Trailing slashes and a trailing glob tail are noise: `tools/e2e` and
 * `tools/e2e/` are one fence spelled twice, and a component's
 * `app/src/styles/**` and a card's `app/src/styles` are one directory.
 * Interior separators collapse so `docs//tasks` cannot pass for a
 * different token.
 *
 * **THE CEILING, STATED SO A READER DOES NOT CONCLUDE THE VOCABULARY IS
 * RECONCILED (T-111-s3).** Three collision families exist on this board
 * and this rule reaches ONE of them alone:
 *
 * - REACHED HERE: `tools/e2e` beside `tools/e2e/`, `method` beside
 *   `method/`.
 * - REACHED BY {@link touchTokensOverlap}'s containment rule and NOT by
 *   this function: a bare `docs` beside `docs/CONVENTIONS.md`, and
 *   `method/` beside `method/lane-protocol.md`. Two DIFFERENT canonical
 *   strings, one containing the other. Containment is overlap, so the
 *   COMPARISON is where that is answered and never the spelling.
 * - REACHED BY NEITHER, and this is the honest hole: `ci` against
 *   `.github/`. They name one thing and share no substring at all. No
 *   string rule can close it and this one does not pretend to — a token
 *   resolving to no component slug is treated as a literal path, so `ci`
 *   is reported disjoint from `.github/` and that is KNOWN-WRONG rather
 *   than unknown. The repair is upstream: a `touches:` entry resolving to
 *   neither a slug nor an existing path is a parser-level issue kind
 *   (`T-111-s3`, C-06), and the board has no filesystem to settle it
 *   with.
 */
export function normaliseTouchToken(token: string): string {
  const trimmed = token.trim();
  const noGlob = trimmed.replace(/\/\*+$/, "");
  const collapsed = noGlob.replace(/\/{2,}/g, "/");
  return collapsed.replace(/\/+$/, "");
}

/**
 * Do two `touches:` entries reserve overlapping ground?
 *
 * Equality after normalisation, OR containment: `docs` contains
 * `docs/tasks`, and a card fenced to the parent reserves the child. The
 * containment test is anchored on a separator so `app/src` does not
 * "contain" `app/src-tauri`, which is the off-by-one a bare `startsWith`
 * produces on this repository's own path vocabulary.
 */
export function touchTokensOverlap(a: string, b: string): boolean {
  const na = normaliseTouchToken(a);
  const nb = normaliseTouchToken(b);
  if (na === "" || nb === "") return false;
  if (na === nb) return true;
  return na.startsWith(nb + "/") || nb.startsWith(na + "/");
}

/** What one `touches:` entry turns out to be. */
export interface TouchExpansion {
  readonly token: string;
  readonly kind: "slug" | "path";
  /** Component ids the slug names; empty for a path entry. */
  readonly componentIds: readonly string[];
  /** Normalised paths the entry reserves. For a path entry, itself. */
  readonly paths: readonly string[];
}

/**
 * Expand one `touches:` entry to the paths it reserves.
 *
 * **THE DISJOINTNESS TEST IS OVER EXPANDED PATHS, NEVER OVER SLUG
 * STRINGS**, and that is the finding this card was dispatched beside
 * rather than a refinement of it. `C-11-design-tokens.md` carries
 * `touch_slugs: [app-shell, app-board]` — the only double-claimed
 * component in the registry — so `[app-board]` and `[app-shell]` are two
 * different strings naming one shared component, and a string-equality
 * fence calls them disjoint. It did, for a whole lane (`T-111-s1`).
 *
 * The map is read from each component file's own `touch_slugs:` FIELD,
 * which `roles/executor.md` row 5 rules authoritative over
 * `docs/ARCHITECTURE.md`'s prose block — "because the block is prose that
 * goes stale the day a component is added".
 */
export function expandTouch(
  token: string,
  components: readonly ComponentRecord[],
): TouchExpansion {
  const canonical = normaliseTouchToken(token);
  const owners = components.filter((c) => c.touchSlugs.includes(canonical));
  if (owners.length === 0) {
    return { token, kind: "path", componentIds: [], paths: [canonical] };
  }
  const paths = new Set<string>();
  for (const owner of owners) {
    for (const p of owner.paths) paths.add(normaliseTouchToken(p));
  }
  return {
    token,
    kind: "slug",
    componentIds: owners.map((c) => c.id).sort(byText),
    paths: [...paths].sort(byText),
  };
}

/**
 * Every way two fences collide, named on both faces.
 *
 * An empty result is the whole claim "these two are disjoint", and it is
 * a claim about PATH SETS: `docs/ARCHITECTURE.md` settles that "overlap"
 * ranges over paths and that slugs are a naming layer on top of
 * components.
 */
export function fenceClashes(
  mine: { readonly taskId: string; readonly touches: readonly string[] },
  lane: InFlightLane,
  components: readonly ComponentRecord[],
): FenceClash[] {
  const found: FenceClash[] = [];
  for (const token of mine.touches) {
    const a = expandTouch(token, components);
    for (const laneToken of lane.touches) {
      const b = expandTouch(laneToken, components);
      const shared = new Set<string>();
      for (const pa of a.paths) {
        for (const pb of b.paths) {
          if (!touchTokensOverlap(pa, pb)) continue;
          // The NARROWER of the two is the ground actually shared: a
          // parent fence reserves the child, not the other way round.
          shared.add(pa.length >= pb.length ? pa : pb);
        }
      }
      if (shared.size === 0) continue;
      found.push({
        token,
        laneToken,
        laneTaskId: lane.taskId,
        laneBranch: lane.branch,
        sharedPaths: [...shared].sort(byText),
        viaComponents: [...new Set([...a.componentIds, ...b.componentIds])].sort(byText),
      });
    }
  }
  return found;
}

// ---------------------------------------------------------------------
// The derivation.
// ---------------------------------------------------------------------

/** The statuses that carry no disposition reason at all — criterion 7's
 * two, plus `merging`, which is `done`'s last mile. */
const NO_REASON_AT_ALL = new Set<TaskStatus>(["done", "merging", "parked"]);

/** A blocker is met when its card is `done` — the ONE rule, and the
 * reason the stored field never has to be cleared for the board to be
 * right. `merging` is deliberately NOT met: the work has not landed. */
function bindingOf(blockerStatus: TaskStatus | undefined): BlockerBinding | undefined {
  if (blockerStatus === undefined) return "missing";
  if (blockerStatus === "done") return undefined;
  if (blockerStatus === "parked") return "parked";
  return "open";
}

/** The parser's own sentence about a dangling `blocked_by`, keyed by the
 * file it is about and the id it names. Consumed, never re-derived. */
function danglingBlockerSentences(issues: readonly ParseIssue[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const issue of issues) {
    if (issue.kind !== "dangling-reference") continue;
    if (issue.field !== "blocked_by") continue;
    out.set(issue.file + " " + issue.id, issue.message);
  }
  return out;
}

const joinIds = (ids: readonly string[]): string => ids.join(", ");

/**
 * The sentence for one unmet blocker set — one clause per BINDING, so
 * the three never arrive as one word.
 *
 * **THE PARSER'S SENTENCE IS QUOTED, NOT SUMMARISED, AND THIS WAS A
 * REJECTION.** Criterion 6 says consume `dangling-reference` rather than
 * re-deriving it (T-057), and the first pass consumed it into a FIELD
 * (`UnmetBlocker.parserSaid`) and then rendered a second sentence of its
 * own instead — so `'T-001' is declared and differs only in zero padding`
 * was computed, carried, and dropped one layer short of the reader.
 * Probed at the verdict: `REASON_CONTAINS_PARSERSAID = false`. That
 * re-creates T-076's own failure — sending the author hunting a task that
 * does not exist rather than at the padding one line away — one layer
 * above the code T-076 wrote to fix it.
 *
 * The message is quoted VERBATIM, file prefix and all, and the redundancy
 * is the price of not re-deriving: the moment this file reformats the
 * parser's sentence it owns a second copy of it. `nearMiss` is the
 * structured half and composing a clause from it would be exactly that
 * second copy, so the whole message is attributed instead.
 */
function blockedReason(taskId: string, unmet: readonly UnmetBlocker[]): string {
  const parts: string[] = [];
  const open = unmet.filter((u) => u.binding === "open");
  const parked = unmet.filter((u) => u.binding === "parked");
  const missing = unmet.filter((u) => u.binding === "missing");
  if (open.length > 0) {
    parts.push("waits on " + joinIds(open.map((u) => u.id + " (" + (u.status ?? "?") + ")")));
  }
  if (parked.length > 0) {
    parts.push(
      "waits on " +
        joinIds(parked.map((u) => u.id)) +
        ", which is PARKED — a wait with no scheduled end",
    );
  }
  if (missing.length > 0) {
    parts.push(
      "names " +
        joinIds(missing.map((u) => u.id)) +
        " as a blocker and no card declares that id — that is a defect in this card, " +
        "not a reason to wait",
    );
  }
  const sentence = taskId + " " + parts.join("; ") + ".";
  const said = missing
    .map((u) => u.parserSaid)
    .filter((s): s is string => s !== undefined && s !== "");
  if (said.length === 0) return sentence;
  return sentence + ' The parser says: "' + said.join('" and "') + '".';
}

/**
 * The one card ABOVE another in its own column — as much of it as the
 * frontier reads. Structural rather than a {@link BoardCard} on purpose:
 * see {@link topmostUndoneByColumn}.
 */
export interface TopmostCard {
  readonly id?: string;
  readonly file: string;
  readonly status: TaskStatus;
}

/**
 * Task id -> the topmost UNDONE card in that id's own column.
 *
 * **THIS IS THE ONLY BOARD-SHAPED INPUT THE FRONTIER TAKES, AND IT IS
 * ISOLATED HERE ON PURPOSE.** `orchestrator.md` step 4 dispatches "among
 * the topmost undone tasks of each feature column", so the frontier needs
 * a column ORDER — and this repository already has exactly one, in
 * {@link selectBoard}. Re-spelling it would be T-057 at the layer whose
 * whole subject is T-057, and it would let the frontier and the render
 * disagree about which card is above which.
 *
 * **AND IT IS THE ONE THING THAT HAS TO MOVE SEPARATELY WHEN THE
 * DERIVATION DOES.** {@link selectDispositions} is otherwise a pure
 * function of the parsed model and the lane reader's answer — no React,
 * no DOM, no IO, and no import outside this module and the parser's
 * types. It belongs somewhere a terminal session can import it as well as
 * a webview, and it is here only because the shared home is `lib-parser`,
 * which is outside this card's fence and held by a live lane. The routing
 * carries the move checklist, and this function is item one on it: a
 * consumer with its own ordering passes its own map, and the default
 * below is the board's.
 */
export function topmostUndoneByColumn(model: ProjectParseResult): ReadonlyMap<string, TopmostCard> {
  const out = new Map<string, TopmostCard>();
  for (const column of selectBoard(model).columns) {
    const head = column.cards.find((c) => !isDoneish(c.status));
    if (head === undefined) continue;
    const entry: TopmostCard = {
      ...(head.id === undefined ? {} : { id: head.id }),
      file: head.file,
      status: head.status,
    };
    for (const c of column.cards) {
      if (c.id !== undefined) out.set(c.id, entry);
    }
  }
  return out;
}

/**
 * Derive one disposition per card.
 *
 * PURE: a function of the parsed model, the lane reader's answer and a
 * column order. It writes nothing and stores nothing — the whole point is
 * that the live answer is cheaper to derive than to remember (T-057).
 *
 * **THE ORDER OF THE TESTS IS THE SHAPE OF THE ANSWER, and it is pinned.**
 * `not-applicable` (this card is not a candidate) -> `blocked` (its own
 * declaration still binds) -> `fenced` (a live lane holds its ground) ->
 * `not-topmost` (its column has a card above it) -> `at-ceiling` (nothing
 * is wrong with it and there is no room) -> `dispatchable`. Card-specific
 * reasons come FIRST because a blocked card told "the ceiling is reached"
 * has been told the least useful true thing about itself.
 *
 * `topmost` defaults to {@link topmostUndoneByColumn}, which is the only
 * line in this function that knows a board exists.
 */
export function selectDispositions(
  model: ProjectParseResult,
  dispatch: DispatchReading,
  topmost: ReadonlyMap<string, TopmostCard> = topmostUndoneByColumn(model),
): DispositionModel {
  if (dispatch.kind === "unavailable") {
    return {
      kind: "undecidable",
      sentence:
        "the lane reader could not answer, so no card can be called dispatchable: " +
        dispatch.sentence +
        " An empty lane set and an unread one are not the same fact, and reporting every card " +
        "as free is the failure direction this frontier exists to close.",
    };
  }

  const components = model.components ?? [];
  const byId = new Map<string, TaskRecord>();
  for (const task of model.tasks) {
    if (task.id !== undefined) byId.set(task.id, task);
  }

  // THE IN-FLIGHT SET: the worktree list, which row 5 rules authoritative
  // over the board's `status:`. A registration whose directory is gone is
  // not a live lane and holds no fence.
  const inFlight: InFlightLane[] = [];
  for (const row of dispatch.rows.values()) {
    for (const lane of row.lanes) {
      if (!lane.existsOnDisk) continue;
      const card = byId.get(row.taskId);
      inFlight.push({
        taskId: row.taskId,
        branch: lane.branch,
        worktreePath: lane.worktreePath,
        touches: card?.touches ?? [],
        disagrees: row.state !== "live",
        fenceKnown: card !== undefined,
      });
    }
  }
  inFlight.sort((a, b) => byText(a.taskId, b.taskId) || byText(a.branch, b.branch));

  // The refusal is narrow ON PURPOSE: it fires only when a fence is
  // actually in play and cannot be expanded. A registry-less model whose
  // live lanes reserve nothing has nothing to compare, so answering it is
  // not a guess.
  if (components.length === 0 && inFlight.some((l) => l.touches.length > 0)) {
    return {
      kind: "undecidable",
      sentence:
        "the component registry is absent, so a fence naming a slug cannot be expanded to the " +
        "paths it reserves — and comparing slug STRINGS is the exact defect this frontier " +
        "exists to remove (T-111-s1: app-board and app-shell are different strings claiming " +
        "one component).",
    };
  }
  const blindLanes = inFlight.filter((l) => !l.fenceKnown);

  const dangling = danglingBlockerSentences(model.issues);
  const ceilingReached = inFlight.length >= CONCURRENCY_CEILING.max;
  const cards = new Map<string, CardDisposition>();
  let readyCount = 0;
  let heldByCeiling = 0;

  for (const task of model.tasks) {
    const id = task.id;
    if (id === undefined) continue;
    const base = { taskId: id, file: task.file };
    const row = dispatch.rows.get(id);
    const held = inFlight.find((l) => l.taskId === id);

    // 1. NOT A CANDIDATE — and the two disagreements are named here.
    if (held !== undefined) {
      cards.set(id, {
        ...base,
        disposition: "not-applicable",
        reason:
          row?.state === "live"
            ? id +
              " is in flight: stamped " +
              task.status +
              " and a worktree is live at " +
              held.worktreePath +
              " (" +
              held.branch +
              ")."
            : id +
              " reads " +
              task.status +
              " on the board and a worktree is live at " +
              held.worktreePath +
              " (" +
              held.branch +
              "). The worktree list outranks the stamp (executor.md row 5), so this fence " +
              "IS held.",
      });
      continue;
    }
    if (NO_REASON_AT_ALL.has(task.status)) {
      // Criterion 7: no reason at all. Progress must not acquire a scolding.
      cards.set(id, { ...base, disposition: "not-applicable" });
      continue;
    }
    if (task.status !== "planned") {
      cards.set(id, {
        ...base,
        disposition: "not-applicable",
        reason:
          row?.state === "died"
            ? id +
              " is stamped " +
              task.status +
              " and no worktree is registered for it. The board and the worktree list " +
              "disagree; the worktree list outranks the stamp (executor.md row 5), so this " +
              "fence is NOT held. WHY they disagree is not a fact on disk — read the card."
            : id + " is " + task.status + ", which is not a status a dispatch picks from.",
      });
      continue;
    }

    // 2. BLOCKED — derived from the declaration, never trusted as one.
    const unmet: UnmetBlocker[] = [];
    const seen = new Set<string>();
    for (const rawId of task.blockedBy) {
      if (rawId === id || seen.has(rawId)) continue;
      seen.add(rawId);
      const blocker = byId.get(rawId);
      const binding = bindingOf(blocker?.status);
      if (binding === undefined) continue;
      const said = dangling.get(task.file + " " + rawId);
      unmet.push({
        id: rawId,
        binding,
        ...(blocker === undefined ? {} : { status: blocker.status }),
        ...(said === undefined ? {} : { parserSaid: said }),
      });
    }
    if (unmet.length > 0) {
      cards.set(id, {
        ...base,
        disposition: "blocked",
        reason: blockedReason(id, unmet),
        unmet,
      });
      continue;
    }

    // 3. FENCED — over expanded components, never over slug strings.
    let clash: FenceClash | undefined;
    for (const lane of inFlight) {
      const first = fenceClashes({ taskId: id, touches: task.touches }, lane, components)[0];
      if (first !== undefined) {
        clash = first;
        break;
      }
    }
    if (clash !== undefined) {
      const via =
        clash.viaComponents.length === 0
          ? ""
          : " — both expand through " +
            joinIds(clash.viaComponents) +
            ", so this may be the COARSE fence rather than a real overlap, and a human can " +
            "override it deliberately";
      cards.set(id, {
        ...base,
        disposition: "fenced",
        reason:
          id +
          " reserves " +
          clash.token +
          " and lane " +
          clash.laneTaskId +
          " (" +
          clash.laneBranch +
          ") holds " +
          clash.laneToken +
          "; they share " +
          joinIds(clash.sharedPaths) +
          via +
          ".",
        clash,
      });
      continue;
    }

    // 4. NOT TOPMOST.
    const head = topmost.get(id);
    if (head !== undefined && head.id !== id) {
      cards.set(id, {
        ...base,
        disposition: "not-topmost",
        reason:
          id +
          " is not the topmost undone card in its column: " +
          (head.id ?? head.file) +
          " (" +
          head.status +
          ") sits above it.",
        ...(head.id === undefined ? {} : { behind: head.id }),
      });
      continue;
    }

    // 5. AT CEILING — nothing is wrong with this card; there is no room.
    if (ceilingReached) {
      heldByCeiling += 1;
      cards.set(id, {
        ...base,
        disposition: "at-ceiling",
        reason:
          id +
          " is ready and there is no room: " +
          inFlight.length +
          " lanes are live and orchestrator.md step 4 caps concurrency at " +
          CONCURRENCY_CEILING.max +
          ". Nothing is wrong with this card — a lane has to land.",
      });
      continue;
    }

    // 6. DISPATCHABLE — with the one caveat that cannot be computed away.
    readyCount += 1;
    cards.set(id, {
      ...base,
      disposition: "dispatchable",
      reason:
        id +
        " is dispatchable: no declared blocker still binds, its touches clear all " +
        inFlight.length +
        " live lane" +
        (inFlight.length === 1 ? "" : "s") +
        ", it is the topmost undone card in its column, and " +
        inFlight.length +
        " of " +
        CONCURRENCY_CEILING.max +
        " lanes are in flight." +
        (blindLanes.length === 0
          ? ""
          : " CAVEAT: " +
            blindLanes.length +
            " of those lanes (" +
            joinIds(blindLanes.map((l) => l.branch)) +
            ") is claimed by no card, so its fence could not be READ — unknown is not empty."),
    });
  }

  const headline = ceilingReached
    ? "THE CEILING IS REACHED: " +
      inFlight.length +
      " lanes are live against a cap of " +
      CONCURRENCY_CEILING.max +
      ", and " +
      heldByCeiling +
      (heldByCeiling === 1 ? " card is" : " cards are") +
      " ready behind it. A lane has to land."
    : readyCount === 0
      ? "NOTHING IS DISPATCHABLE: " +
        inFlight.length +
        " of " +
        CONCURRENCY_CEILING.max +
        " lanes are live, so there is room — no card qualifies. Read the reasons."
      : readyCount +
        (readyCount === 1 ? " card is" : " cards are") +
        " dispatchable, with " +
        inFlight.length +
        " of " +
        CONCURRENCY_CEILING.max +
        " lanes live.";

  return { kind: "derived", cards, inFlight, ceilingReached, headline };
}
