/**
 * C-15 (F-04) — the dispatch surface, TS half (T-110).
 *
 * **THIS FILE IS A MIRROR, AND AFTER T-110's REBUILD IT IS ONLY A
 * MIRROR.** The Rust half (`app/src-tauri/src/dispatch/`) reads the lanes
 * git wrote down and JOINS them against the board; this file types that
 * answer for the webview and hydrates it into the `Map`s ADR-009
 * requires. It makes no decision of its own.
 *
 * **WHY THE JOIN IS NOT HERE ANY MORE — the whole content of this card's
 * rebuild.** T-110's first pass put `classify`, `joinLanes`,
 * `IN_FLIGHT_STATUSES` and `describeRefusal` in this file. They were
 * correct and **nothing tested them**: no file in the repository imports
 * this module, `app/vitest.config.ts` collects `test/**` only, and both
 * that config and `app/test/**` are C-05's `app-shell` — outside T-110's
 * `[app-dispatch]` fence. Four one-side-only producer mutants, measured
 * at `6fea6a1`, ALL SURVIVED `npm run build` and `npm test` at exit 0:
 * swapping the `died` and `stampSkipped` arms; emptying the in-flight
 * set (which makes `died` unreachable — the very fixture the card names);
 * short-circuiting the no-card half of the join; and giving two refusals
 * one sentence. **Exhaustiveness checking is not a substitute and the
 * fourth is the proof: `assertNever` catches a MISSING arm, never a
 * WRONG one.**
 *
 * `app/src-tauri/src/dispatch/**` is C-15's own path, so the same rule
 * written there is inside the fence AND inside a suite. It now lives in
 * `join.rs` with one pin per state. Two copies of one rule with a pin
 * under only one of them is precisely the divergence T-110 exists to
 * remove one layer up, so this file keeps NO second copy.
 *
 * | the card says | git says | state |
 * |---|---|---|
 * | in flight | a lane | `live` |
 * | in flight | nothing | `died` — a lane that died |
 * | anything else | a lane | `stampSkipped` — a dispatch that skipped the stamp |
 * | anything else | nothing | `notDispatched` |
 *
 * **ADR-009 IS A CRITERION HERE, NOT ADVICE.** Task ids, branch names and
 * worktree directory names are strings this project does not author — git
 * writes two of the three — so every collection keyed by one is a `Map`.
 * That is what {@link hydrateJoin} is for: the wire carries rows as an
 * ARRAY (serde has no other honest shape for a list of records) and this
 * file turns it into a `ReadonlyMap`. There is not a plain object literal
 * keyed by file-derived text anywhere below.
 *
 * **THIS FILE IMPORTS ONE THING, DELIBERATELY.** It is C-15's first
 * indexed file, so every import it carries becomes an edge on the
 * architecture map. The board's task records are described by the
 * structural {@link BoardStamp} rather than by importing `TaskRecord`
 * from `@nputer/parser`, which would declare a C-15 → C-06 dependency the
 * component file does not claim, for two fields. The one import is
 * `invoke` — a PACKAGE edge to `@tauri-apps/api` and not a component one,
 * added at `T-112-s1` because a mirror with no door is a mirror of
 * nothing.
 *
 * **WHAT IS STILL NOT HERE, AND IT IS THE JOIN.** No Tauri command
 * delivers a {@link DispatchJoinWire} to this file. That is not a fence
 * problem any more — `T-112-s1` held `app-shell` and could have registered
 * one — it is `T-126-s2`, PARKED: `join_lanes(scan, board)` takes the
 * board's stamps, the board is parsed in TypeScript, and all three shapes
 * a joining command could take are refused today (stamps inbound breaks
 * ADR-012; a second card parser in Rust is the `T-033-s11` divergence;
 * joining here is what T-110 measured four surviving mutants against).
 * That card wants a RULING before it wants a fence, so this lane routed it
 * rather than deciding it. Until it lands, the board root has no
 * {@link DispatchJoin} to hand the drawer and the dispatch block still
 * does not render.
 *
 * **T-112'S BRIEF HAS ITS DOOR SINCE `T-112-s1`.** The assembler is built
 * and proved in `dispatch/brief.rs`, registered as `dispatch_brief` in
 * `app/src-tauri/src/lib.rs`, and reached from here by {@link readBrief}.
 */

import { invoke } from "@tauri-apps/api/core";

// ---------------------------------------------------------------------
// The Rust reader's answer, mirrored.
//
// THE AUTHORITY IS THE RUST ENUM, NEVER THIS FILE: `LaneScan`,
// `WorktreeEntry`, `EntryDefect` and `BranchRejection` in
// `app/src-tauri/src/dispatch/lanes.rs`, serialized by serde with
// `tag = "kind"` and camelCase fields. Nothing pins the two VOCABULARIES
// equal across the language boundary — `T-110-s3` carries that — but the
// two Rust spellings of a lane registration ARE pinned equal, by
// serializing both (`a_row_carries_the_readers_five_lane_fields_and_the_same_json`).
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
   * but pruned-but-not-removed, which is NOT folded into `died` — see
   * {@link DispatchRow.lanes}.
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
  | LaneScanRefusal;

/**
 * The four refusals — a scan that produced no list. Its own type in Rust
 * too (`join::LaneScanRefusal`), so `unavailable` below cannot be handed
 * a successful scan.
 */
export type LaneScanRefusal =
  | { readonly kind: "notAGitRepository" }
  | { readonly kind: "gitIsAFile" }
  | { readonly kind: "noWorktreesDirectory" }
  | { readonly kind: "worktreesUnreadable" };

// ---------------------------------------------------------------------
// The board's half, and the join's answer — both mirrored from
// `app/src-tauri/src/dispatch/join.rs`.
// ---------------------------------------------------------------------

/**
 * One card, as much of it as the join reads. Structural on purpose:
 * `TaskRecord` from `@nputer/parser` satisfies it, and so does a fixture.
 *
 * The statuses that COUNT as in flight are `join.rs`'s
 * `IN_FLIGHT_STATUSES` — `building`, `verifying` and `merging`, spelled
 * once, over there, with a pin under them. This file deliberately holds
 * no copy: a second list is a second answer.
 */
export interface BoardStamp {
  readonly id: string;
  /** The card's `status:` frontmatter field, verbatim. */
  readonly status: string;
}

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

/**
 * Every state, so a renderer can enumerate them without a switch.
 *
 * `satisfies Record<DispatchState, true>` is what makes this list keep up
 * with the union: adding a state to {@link DispatchState} without a line
 * here is a compile error in both `tsc` programs. A bare array literal
 * would not be — which is the same class of gap that made the first pass
 * untested, one size smaller.
 */
const DISPATCH_STATE_KEYS = {
  live: true,
  died: true,
  stampSkipped: true,
  notDispatched: true,
} satisfies Record<DispatchState, true>;

export const DISPATCH_STATES: readonly DispatchState[] = Object.keys(
  DISPATCH_STATE_KEYS,
) as DispatchState[];

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
 * **THE WIRE FORM, exactly as serde emits it** — rows as an ARRAY,
 * sorted by task id on the Rust side. Named separately from
 * {@link DispatchJoin} so the difference between "what crossed the
 * boundary" and "what this app holds" is a type rather than a habit.
 */
export type DispatchJoinWire =
  | {
      readonly kind: "joined";
      readonly rows: readonly DispatchRow[];
      readonly notLanes: readonly WorktreeEntry[];
      readonly truncated: boolean;
    }
  | {
      readonly kind: "unavailable";
      readonly because: LaneScanRefusal;
      /**
       * One sentence naming which case it hit, from
       * `LaneScanRefusal::sentence` — the ONE spelling of these four
       * sentences, and it travels on the wire precisely so this file does
       * not hold a second copy. The first pass kept the `switch` here,
       * where a mutant giving two refusals one sentence survived both
       * `tsc` programs.
       */
      readonly sentence: string;
    };

/**
 * The join's result, as this app holds it.
 *
 * **`unavailable` IS THE POINT OF THIS BEING A UNION.** When the scan
 * refused — no `.git`, a `.git` FILE, no `worktrees/` — the app knows
 * NOTHING about lanes. Rendering every card as `notDispatched` would be
 * the same lie one layer up that "an empty list meaning two different
 * things" is one layer down, so the join refuses to classify and names
 * the case it hit.
 */
export type DispatchJoin =
  | {
      readonly kind: "joined";
      /** Task id → row. A Map: ids are read from files (ADR-009). */
      readonly rows: ReadonlyMap<string, DispatchRow>;
      /**
       * Worktrees that are not lanes: reported, never dropped.
       *
       * **AND SINCE T-185 THERE IS SOMETHING TO REPORT THEM TO.** This
       * comment said "never dropped" for four merges while the board's own
       * `DispatchReading` had no field for it, so the fact reached the last
       * boundary and stopped. `board-model.ts`'s `NotLaneHold` is where it
       * lands now, and `selectDispositions` states what it means: these
       * hold no fence and count against no ceiling, which is precisely why
       * a reader who cannot see them mistakes a LANE census for a WORKTREE
       * census.
       */
      readonly notLanes: readonly WorktreeEntry[];
      /**
       * The reader hit its entry ceiling: the answer is a floor.
       *
       * **AND THE FLOOR NOW REACHES A SCREEN (T-185).** `lanes.rs` argues
       * this flag into existence — it REFUSES to truncate before the sort,
       * because that *"trades a deterministic answer for a smaller `Vec`"*,
       * so that a bounded answer can still be an HONEST one — and until
       * T-185 the last boundary discarded the result. It is carried by
       * `DispatchReading.truncated`, consumed by `selectDispositions`
       * (which qualifies every "there is room" sentence and no "there is
       * none"), and rendered beside the copyable brief as the dispatch half
       * of T-018's docs truncation note.
       */
      readonly truncated: boolean;
    }
  | {
      readonly kind: "unavailable";
      readonly because: LaneScanRefusal;
      readonly sentence: string;
    };

/**
 * Turn the wire form into the shape ADR-009 requires.
 *
 * This is the ONE thing this file does. It classifies nothing: the state
 * on every row was decided by `join.rs` and is carried across verbatim.
 * The rows arrive as an array and become a `Map` keyed by task id,
 * because a task id is a string this project reads out of a file name and
 * a branch ref, and ADR-009 forbids such a key on a plain object.
 *
 * A duplicate task id on the wire would be a defect in the producer —
 * `join_lanes` emits one row per id — and the last one would win here.
 * That is stated rather than guarded, because a guard would be a second
 * opinion about the producer's invariant with no test on this side of the
 * boundary to keep it honest.
 */
export function hydrateJoin(wire: DispatchJoinWire): DispatchJoin {
  switch (wire.kind) {
    case "joined": {
      const rows = new Map<string, DispatchRow>();
      for (const row of wire.rows) {
        rows.set(row.taskId, row);
      }
      return {
        kind: "joined",
        rows,
        notLanes: wire.notLanes,
        truncated: wire.truncated,
      };
    }
    case "unavailable":
      return wire;
    default:
      return assertNever(wire);
  }
}

// ---------------------------------------------------------------------
// The dispatch brief's wire form (T-112), mirrored.
//
// THE AUTHORITY IS THE RUST TYPE, NEVER THIS FILE: `BriefOutcome`,
// `Brief`, `BriefRow`, `BriefLine` and `Provenance` in
// `app/src-tauri/src/dispatch/brief.rs`, serialized by serde with
// `tag = "kind"` and camelCase fields — and the shape below is pinned
// against that serialization by
// `the_wire_form_is_tagged_and_camel_cased_the_way_the_ts_mirror_expects`
// in that module, which is the cross-language keeper this side cannot
// hold on its own.
//
// **TYPES AND ONE DOOR, AND THE DISTINCTION IS T-110's WHOLE LESSON.** A
// DERIVATION here would reach no suite that judges it: the brief's
// presentation lives in `task-detail.ts`, which
// `app/test/select-task-detail.test.ts` drives. What `T-112-s1` adds is
// not a derivation — {@link readBrief} chooses nothing, classifies
// nothing and hands the wire back unchanged, and its one claim (that the
// command it names exists at both ends) is pinned by the IPC census in
// `app/test/crescendo-dom.test.tsx`, which reads this call site and the
// Rust handler list and requires them to agree.
//
// ROWS ARE AN ARRAY AND NOT A `Map`, and that is ADR-009 obeyed rather
// than skipped: the key would be the contract's own row NUMBER, which is
// an integer read off a table this project authors, not a file-derived
// string. The order is the document's and an array is the only shape
// that keeps it.
// ---------------------------------------------------------------------

/** Where one line came from. A TREE fact names its file; a LIVE fact is
 * re-read at dispatch; a COMPOSED one names every part it was built
 * from. */
export type BriefProvenanceWire =
  | { readonly kind: "tree"; readonly source: string }
  | { readonly kind: "live"; readonly source: string }
  | { readonly kind: "composed"; readonly from: readonly string[] };

export interface BriefLineWire {
  readonly label: string;
  readonly text: string;
  readonly provenance: BriefProvenanceWire;
}

/** One row of the contract, with the three columns the document spells
 * and the content assembled from the source column three names. */
export interface BriefRowWire {
  readonly number: number;
  readonly carries: string;
  readonly assembledFrom: string;
  readonly ifAbsent: string;
  readonly lines: readonly BriefLineWire[];
  /** Something open about this row's own source column, surfaced rather
   * than papered over. `null` on a row with nothing open. */
  readonly residual: string | null;
}

export interface BriefWire {
  readonly role: "executor" | "verifier";
  readonly roleFile: string;
  readonly taskId: string;
  readonly cardPath: string;
  readonly rows: readonly BriefRowWire[];
  /**
   * The line a verifier's brief is split at, and `null` for an
   * executor's. Everything the executor produced belongs BELOW it — and
   * the assembler puts nothing there, which is the guarantee rather than
   * an oversight.
   */
  readonly marker: string | null;
}

/** A row that could not be assembled: WHICH ROW and WHICH SOURCE. */
export interface MissingBriefRowWire {
  readonly number: number;
  readonly source: string;
  readonly path: string;
  readonly because: { readonly kind: string };
}

/**
 * The assembler's typed answer.
 *
 * **NEVER A PARTIAL BRIEF.** A row that could not be assembled takes the
 * whole answer to `unassemblable` rather than shortening the output: a
 * brief with a silently missing gate list is worse than no brief, and
 * this repository has paid for three of them.
 */
export type BriefOutcomeWire =
  | { readonly kind: "assembled"; readonly brief: BriefWire }
  | {
      readonly kind: "contractUnreadable";
      readonly source: string;
      readonly defect: { readonly kind: string };
    }
  | {
      readonly kind: "contractMissing";
      readonly source: string;
      readonly because: { readonly kind: string };
    }
  | { readonly kind: "unassemblable"; readonly rows: readonly MissingBriefRowWire[] }
  | { readonly kind: "noSuchCard"; readonly taskId: string };

/**
 * The exhaustiveness check.
 *
 * **IT IS A GUARANTEE ABOUT SHAPE AND NOTHING ELSE, and T-110's rebuild
 * is the record of why that distinction matters.** Adding an arm to
 * {@link DispatchJoinWire} without answering it here fails `npm run
 * build` at `tsc`, in both programs. It has never been able to catch a
 * WRONG answer, and the four mutants that survived this file's first pass
 * were all wrong answers with every arm present.
 */
function assertNever(value: never): never {
  throw new Error(`unhandled variant: ${JSON.stringify(value)}`);
}

// ---------------------------------------------------------------------
// The door (T-112-s1).
// ---------------------------------------------------------------------

/**
 * What `dispatch_brief` answers with — the assembler's outcome, plus the
 * one fact it cannot express about itself.
 *
 * **THE WRAPPER IS MIRRORED IN THE COMMIT THAT ADDS IT, WHICH IS
 * `T-126-s1` APPLIED RATHER THAN REPEATED.** That finding exists because
 * `dispatch_lanes` grew exactly this wrapper — `NoProject` beside the
 * reader's own answers — in a lane whose fence did not reach this file, so
 * the mirror never learned about it and still has not. `T-112-s1` held
 * both `app-shell` and `app-dispatch`, so this type is written beside the
 * Rust enum instead of being routed after it.
 *
 * **`noProject` IS A FACT ABOUT THE APP** and every {@link BriefOutcomeWire}
 * arm is a fact about a PROJECT. Collapsing them would tell a user with no
 * project open that their card does not exist.
 *
 * The authority is `DispatchBriefOutcome` in `app/src-tauri/src/lib.rs`,
 * serialized by serde with `tag = "kind"` and camelCase fields, and
 * `the_wrapper_serializes_as_the_tagged_camel_cased_shape_the_ts_mirror_expects`
 * is the keeper this side cannot hold on its own.
 */
export type DispatchBriefWire =
  | { readonly kind: "noProject" }
  | { readonly kind: "answered"; readonly outcome: BriefOutcomeWire };

/**
 * Ask the assembler for one card's brief.
 *
 * **TWO ARGUMENTS AND NEITHER IS A PATH** (ADR-012). The task id is a key
 * into the `docs/tasks` listing the command itself takes, and the role is
 * one of two spellings serde refuses anything else for; the project root
 * is `WatchState`'s, never this side's. Nothing about the answer is
 * decided here — the wire comes back as it arrived, because a second
 * opinion about the assembler's outcome is the divergence this file was
 * rebuilt to remove.
 *
 * `invoke` REJECTS rather than returning a typed refusal when the boundary
 * itself fails (no Tauri runtime, a malformed argument), so callers own
 * that path the way every other store in this app does.
 */
export function readBrief(
  taskId: string,
  role: "executor" | "verifier",
): Promise<DispatchBriefWire> {
  return invoke<DispatchBriefWire>("dispatch_brief", { taskId, role });
}
