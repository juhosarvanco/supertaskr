/**
 * C-15 (F-04) — the dispatch surface, TS half (T-110).
 *
 * The Rust reader (`app/src-tauri/src/dispatch/lanes.rs`) enumerates the
 * lanes git wrote down; this file mirrors that typed answer and JOINS it
 * against the board.
 *
 * **THE JOIN'S PRODUCT IS THE DISAGREEMENT, and that is the whole point
 * of the card.** `docs/design/dispatch-technical-plan.md`'s D4 argued
 * the in-flight set must come from lanes and never from `status:`,
 * because `status: building` had allegedly never been used. That was a
 * grep of the CURRENT tree, which cannot see a transient state — 77
 * commits moved the field and T-089 ruled the pre-cut stamp back into
 * the method. So this file reads BOTH and reports where they disagree:
 *
 * | the card says | git says | state |
 * |---|---|---|
 * | in flight | a lane | `live` |
 * | in flight | nothing | `died` — a lane that died |
 * | anything else | a lane | `stampSkipped` — a dispatch that skipped the stamp |
 * | anything else | nothing | `notDispatched` |
 *
 * A board that shows only one of the two sources can report neither
 * failure.
 *
 * **ADR-009 IS A CRITERION HERE, NOT ADVICE.** Task ids, branch names
 * and worktree directory names are strings this project does not author
 * — git writes two of the three — so every collection keyed by one is a
 * `Map`. There is not a plain object literal keyed by file-derived text
 * anywhere in this file.
 *
 * **THIS FILE IMPORTS NOTHING, DELIBERATELY.** It is C-15's first
 * indexed file, so every import it carries becomes a component edge on
 * the architecture map. The board's task records are described by the
 * structural {@link BoardStamp} below rather than by importing
 * `TaskRecord` from `@nputer/parser`, which would declare a C-15 → C-06
 * dependency the component file does not claim, on a type this join
 * needs three fields of.
 *
 * **WHAT IS NOT HERE, AND WHERE IT WENT.** Nothing calls
 * {@link joinLanes} yet and no Tauri command delivers a {@link LaneScan}
 * to it: registering one edits `app/src-tauri/src/lib.rs`, which is
 * C-05's `app-shell` — outside T-110's `[app-dispatch]` fence and held
 * by a live lane at that dispatch (`T-110-s1` carries it). The vitest
 * pins for this file are `T-110-s3`: `app/vitest.config.ts` includes
 * `test/**` only, and `app/test/**` is also `app-shell`, so a test file
 * for this store cannot be written inside this card's fence. Until that
 * suggestion lands, the guarantees this file has are the two `tsc`
 * programs `npm run build` gates on — every union below is exhaustive
 * and {@link assertNever} makes a missing arm a compile error, not a
 * runtime surprise.
 */

// ---------------------------------------------------------------------
// The Rust reader's answer, mirrored.
//
// THE AUTHORITY IS THE RUST ENUM, NEVER THIS FILE: `LaneScan`,
// `WorktreeEntry`, `EntryDefect` and `BranchRejection` in
// `app/src-tauri/src/dispatch/lanes.rs`, serialized by serde with
// `tag = "kind"` and camelCase fields. Nothing pins the two vocabularies
// equal today — `T-110-s3` carries that too.
// ---------------------------------------------------------------------

/** A lane: a worktree whose branch matches `task/T-NNN-<slug>`. */
export interface LaneRegistration {
  readonly kind: "lane";
  /** The `.git/worktrees/<name>` directory name — not the branch. */
  readonly name: string;
  readonly taskId: string;
  readonly branch: string;
  readonly worktreePath: string;
  /**
   * The worktree directory is still there. `false` is a lane registered
   * but pruned-but-not-removed, which is NOT folded into `died` below —
   * see {@link DispatchRow.lanes}.
   */
  readonly existsOnDisk: boolean;
}

/** A worktree whose branch is not lane-shaped. Reported, never dropped. */
export interface NotALaneEntry {
  readonly kind: "notALane";
  readonly name: string;
  readonly branch: string;
  readonly worktreePath: string;
  readonly existsOnDisk: boolean;
  readonly reason: { readonly kind: string };
}

/** A worktree on a detached HEAD — every poison drill makes one. */
export interface DetachedEntry {
  readonly kind: "detached";
  readonly name: string;
  readonly worktreePath: string;
  readonly existsOnDisk: boolean;
}

/** An entry whose own bookkeeping could not be read. */
export interface UnreadableEntry {
  readonly kind: "unreadable";
  readonly name: string;
  readonly defect: { readonly kind: string };
}

export type WorktreeEntry =
  | LaneRegistration
  | NotALaneEntry
  | DetachedEntry
  | UnreadableEntry;

/**
 * What `<repo>/.git/worktrees` had to say. FIVE answers, and no two of
 * them are the same empty list: `scanned` with no entries is a fact
 * about a repository, and the four refusals are facts about a folder.
 */
export type LaneScan =
  | { readonly kind: "scanned"; readonly entries: readonly WorktreeEntry[]; readonly truncated: boolean }
  | { readonly kind: "notAGitRepository" }
  | { readonly kind: "gitIsAFile" }
  | { readonly kind: "noWorktreesDirectory" }
  | { readonly kind: "worktreesUnreadable" };

/** The four refusals, as their own type — a scan that produced no list. */
export type LaneScanRefusal = Exclude<LaneScan, { kind: "scanned" }>;

// ---------------------------------------------------------------------
// The board's half.
// ---------------------------------------------------------------------

/**
 * One card, as much of it as this join reads. Structural on purpose:
 * `TaskRecord` from `@nputer/parser` satisfies it, and so does a fixture.
 */
export interface BoardStamp {
  readonly id: string;
  /** The card's `status:` frontmatter field, verbatim. */
  readonly status: string;
  /** The card's `builder:` field, when it carries one. */
  readonly builder?: string | null;
}

/**
 * The statuses that SAY A LANE EXISTS.
 *
 * `building` is the dispatch stamp itself — `method/tasks/TASK-FORMAT.md`
 * owns the field and T-089 ruled the practice back in: the architect
 * stamps it on the integration branch BEFORE the cut, so the lane
 * inherits it and never writes that line.
 *
 * **`verifying` AND `merging` ARE INCLUDED, AND THAT IS A JUDGEMENT THE
 * CARD DID NOT MAKE.** T-110's four rows are written against `building`
 * alone, but `method/lane-protocol.md` keeps the worktree alive past the
 * handoff: the executor stamps `verifying` and STOPS, and the integrator
 * removes the worktree only after the merge. A live worktree under a
 * `verifying` card is therefore the ORDINARY state of this repository
 * between handoff and merge — treating it as a skipped stamp would make
 * the board cry wolf on its own healthiest lane. The membership is a
 * constant so it can be argued with rather than reverse-engineered.
 */
export const IN_FLIGHT_STATUSES: readonly string[] = ["building", "verifying", "merging"];

/** Does this card claim a lane exists? */
export function isInFlight(status: string): boolean {
  return IN_FLIGHT_STATUSES.includes(status);
}

// ---------------------------------------------------------------------
// The four states.
// ---------------------------------------------------------------------

/**
 * The disagreement, by name. Each is a different failure or a different
 * kind of health, and a board that renders one string for two of them
 * can report neither.
 */
export type DispatchState =
  /** Stamped in flight, and git has the lane. */
  | "live"
  /** Stamped in flight, and there is no lane: a lane that died. */
  | "died"
  /** A lane, and no card claiming it: a dispatch that skipped the stamp. */
  | "stampSkipped"
  /** Neither. The ordinary state of every card on the board. */
  | "notDispatched";

/** Every state, so a renderer can enumerate them without a switch. */
export const DISPATCH_STATES: readonly DispatchState[] = [
  "live",
  "died",
  "stampSkipped",
  "notDispatched",
];

/** One task id, and what the card and the disk together say about it. */
export interface DispatchRow {
  readonly taskId: string;
  readonly state: DispatchState;
  /** The card, when the board has one. `null` is a lane for no card. */
  readonly card: BoardStamp | null;
  /**
   * Every lane registration carrying this task id — a list, not one
   * lane, for two reasons. Two branches can carry one id
   * (`task/T-110-a`, `task/T-110-b`), and dropping the second to fit a
   * single field would be exactly the silent loss ADR-009 exists to
   * prevent. And `existsOnDisk` stays HERE rather than folding into
   * {@link DispatchState}: a pruned-but-not-removed lane is a
   * registration whose directory is gone, which is not the same fact as
   * a card whose lane was never registered, and the card forbids two
   * facts sharing one answer.
   */
  readonly lanes: readonly LaneRegistration[];
}

/**
 * The join's result.
 *
 * **`unavailable` IS THE POINT OF THIS BEING A UNION.** When the scan
 * refused — no `.git`, a `.git` FILE, no `worktrees/` — the app knows
 * NOTHING about lanes. Rendering every card as `notDispatched` would be
 * the same lie one layer up that "an empty list meaning two things" is
 * one layer down, so the join refuses to classify and names the case it
 * hit.
 */
export type DispatchJoin =
  | {
      readonly kind: "joined";
      /** Task id → row. A Map: ids are read from files (ADR-009). */
      readonly rows: ReadonlyMap<string, DispatchRow>;
      /** Worktrees that are not lanes: reported, never dropped. */
      readonly notLanes: readonly WorktreeEntry[];
      /** The reader hit its entry ceiling: the answer is a floor. */
      readonly truncated: boolean;
    }
  | { readonly kind: "unavailable"; readonly because: LaneScanRefusal };

/**
 * Join the lane list against the board.
 *
 * Every task id on the board gets a row, and so does every lane whose id
 * is on no card — that second half is the `stampSkipped` case with
 * `card: null`, and it is the shape a dispatch that skipped the stamp
 * leaves when nobody has written the card yet either.
 */
export function joinLanes(scan: LaneScan, board: Iterable<BoardStamp>): DispatchJoin {
  if (scan.kind !== "scanned") {
    return { kind: "unavailable", because: scan };
  }

  // Task id → its lane registrations. Keyed by a string git wrote, so a
  // Map (ADR-009) — and one that keeps every registration.
  const lanesByTask = new Map<string, LaneRegistration[]>();
  const notLanes: WorktreeEntry[] = [];
  for (const entry of scan.entries) {
    if (entry.kind === "lane") {
      const existing = lanesByTask.get(entry.taskId);
      if (existing === undefined) {
        lanesByTask.set(entry.taskId, [entry]);
      } else {
        existing.push(entry);
      }
    } else {
      notLanes.push(entry);
    }
  }

  const rows = new Map<string, DispatchRow>();
  for (const card of board) {
    const lanes = lanesByTask.get(card.id) ?? [];
    rows.set(card.id, {
      taskId: card.id,
      state: classify(isInFlight(card.status), lanes.length > 0),
      card,
      lanes,
    });
  }
  // A lane whose task id is on no card. Reported for the same reason a
  // non-lane worktree is: the board cannot report what it drops.
  for (const [taskId, lanes] of lanesByTask) {
    if (rows.has(taskId)) continue;
    rows.set(taskId, {
      taskId,
      state: classify(false, lanes.length > 0),
      card: null,
      lanes,
    });
  }

  return { kind: "joined", rows, notLanes, truncated: scan.truncated };
}

/** The whole disagreement, as one total function of two booleans. */
export function classify(inFlight: boolean, hasLane: boolean): DispatchState {
  if (inFlight) return hasLane ? "live" : "died";
  return hasLane ? "stampSkipped" : "notDispatched";
}

/**
 * Count the rows in each state. A Map keyed by a DispatchState — an
 * authored vocabulary, so a plain object would be legal here; it is a
 * Map anyway so that one lookup shape covers this file.
 */
export function countByState(join: DispatchJoin): ReadonlyMap<DispatchState, number> {
  const counts = new Map<DispatchState, number>(DISPATCH_STATES.map((state) => [state, 0]));
  if (join.kind === "unavailable") return counts;
  for (const row of join.rows.values()) {
    counts.set(row.state, (counts.get(row.state) ?? 0) + 1);
  }
  return counts;
}

/**
 * One sentence naming why the lane list is unavailable. The board needs
 * to say WHICH case it hit; this is the only place that spelling lives.
 */
export function describeRefusal(refusal: LaneScanRefusal): string {
  switch (refusal.kind) {
    case "notAGitRepository":
      return "this folder is not a git repository, so it has no lanes to read";
    case "gitIsAFile":
      return "this folder is itself a git worktree (its .git is a file), so its lanes live in the repository it was cut from";
    case "noWorktreesDirectory":
      return "this repository has never registered a worktree";
    case "worktreesUnreadable":
      return "this repository's .git/worktrees could not be read";
    default:
      return assertNever(refusal);
  }
}

/**
 * The exhaustiveness check. With no vitest file reachable inside this
 * card's fence, the type checker is the pin this file has: adding a
 * refusal to {@link LaneScan} without answering it here fails
 * `npm run build` at `tsc`, in both programs.
 */
function assertNever(value: never): never {
  throw new Error(`unhandled variant: ${JSON.stringify(value)}`);
}
