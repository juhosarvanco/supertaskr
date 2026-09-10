import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DISPATCH_STATES,
  IN_FLIGHT_STATUSES,
  classify,
  hydrateJoin,
  joinLanes,
  refusalSentence,
  type BoardStamp,
  type DispatchJoinWire,
  type DispatchRow,
  type LaneRegistration,
  type LaneScan,
  type LaneScanRefusal,
  type NotALaneEntry,
  type WorktreeEntry,
} from "../src/lib/dispatch-store";

/**
 * C-15's first collected body (T-198) — the pin that makes
 * `app/src/lib/dispatch-store.ts` REACHABLE.
 *
 * **WHY THIS FILE EXISTS, AND WHY IT COULD NOT EXIST UNTIL NOW.** T-110
 * measured four one-side-only producer mutants of this module surviving
 * `npm run build` and `npm test` at exit 0, and rebuilt the module down to
 * a mirror because nothing could judge it. T-190 then priced the wall: no
 * location an `[app-dispatch]` fence reaches is collected by any runner —
 * `app/vitest.config.ts` collects `test/**` relative to `app/`, and C-15
 * declared no `app/test/**` path — so the pin had to arrive with the
 * registry line, in a lane holding both. Its blind verifier ran the
 * attack that settles it: with a probe present a gutted `hydrateJoin`
 * reds, and with the probe removed **the same mutant passed the entire app
 * suite and both `tsc` programs at exit 0**. This file is what makes that
 * mutant die.
 *
 * **STRUCTURAL REACHABILITY IS NOT THE BAR AND WAS NEVER THE GAP.** An
 * import alone proves nothing here — T-110's four survivors were all
 * imported, compiled and type-checked. Every body below is therefore
 * written against a MUTANT it kills, and the mutants are named in
 * `T-198`'s notes with their failing-body counts.
 *
 * **WHAT THIS FILE DELIBERATELY DOES NOT DO.** It imports exactly one
 * module, and that module is C-15's own, so this file adds no
 * cross-component edge and `arch cycles` does not move. In particular it
 * does NOT import `board-model.ts` (C-17) to hold `DispatchJoin` against
 * the board's `DispatchReading` — that import is `T-185`'s to make and
 * presupposes an architecture decision no lane may take on its own
 * (`T-190`, and `C-18-board-root.md`'s "the seam is drawn where the code
 * already was"). What this file supplies for `T-185` is the half that IS
 * C-15's: bodies two and three below are the first in this repository to
 * construct a reading with a populated `notLanes` and one with
 * `truncated: true`, which that card's fourth criterion says have never
 * existed here.
 *
 * **THE IMPORT IS RELATIVE, NOT `@/`, AND THAT IS THE TREE'S RULE RATHER
 * THAN A PREFERENCE.** Derived at this lane's ref rather than remembered:
 * of the 49 files under `app/test`, **45 import through `../src/` and ZERO
 * through the `@` alias**, though `app/vitest.config.ts` defines it. A
 * first user of the alias in this directory would be a new convention
 * smuggled in under a card about something else.
 *
 * **AND `T-126-s2` IS WHAT THIS FILE WAS FOR.** `T-198` landed it to make
 * C-15 reachable; the 2026-08-31 architecture sitting had already ruled
 * that the JOIN comes back to TypeScript *"after, and only after, the
 * dispatch view model has a test path"*. This file IS that test path, so
 * the join's bodies live here — appended below the `hydrateJoin` ones
 * rather than mixed into them, because the two make different claims: the
 * originals hold a SHAPE CONVERSION honest, and the new ones hold a
 * DECISION honest. The ordinals the paragraphs above use ("bodies two and
 * three") count from the top and are unmoved by the appendix.
 */

// ---------------------------------------------------------------------
// Fixtures. Every field is spelled because the wire types are `readonly`
// and structural: a helper that filled defaults would be a second opinion
// about what `join.rs` emits, which is the divergence this module was
// rebuilt to remove.
// ---------------------------------------------------------------------

const lane = (taskId: string, name: string): LaneRegistration => ({
  kind: "lane",
  name,
  taskId,
  branch: `task/${taskId}-slug`,
  worktreePath: `/Users/x/Projects/supertaskr-${taskId}`,
  existsOnDisk: true,
});

const row = (
  taskId: string,
  state: DispatchRow["state"],
  lanes: readonly LaneRegistration[] = [],
): DispatchRow => ({
  taskId,
  state,
  card: { id: taskId, status: state === "live" ? "building" : "planned" },
  lanes,
});

/** A worktree that is not a lane — the thing `notLanes` carries whole. */
const notALane: NotALaneEntry = {
  kind: "notALane",
  name: "arch-verify",
  branch: "refs/heads/claude/adoring-nash",
  worktreePath: "/Users/x/Projects/arch-verify",
  existsOnDisk: true,
  reason: { kind: "branchIsNotLaneShaped" },
};

const joined = (
  rows: readonly DispatchRow[],
  notLanes: readonly NotALaneEntry[] = [],
  truncated = false,
): DispatchJoinWire => ({ kind: "joined", rows, notLanes, truncated });

describe("hydrateJoin: the wire's array becomes the Map ADR-009 requires", () => {
  it("keys every row by its OWN task id — the one thing this module does", () => {
    // THE CANONICAL MUTANT LIVES HERE: deleting `rows.set(row.taskId, row)`
    // leaves an always-empty Map, which is the exact gutting T-190's
    // verifier proved survives the whole app suite and both `tsc`
    // programs when no collected body imports this module.
    const join = hydrateJoin(joined([row("T-100", "live", [lane("T-100", "supertaskr-T-100")]), row("T-200", "died")]));

    expect(join.kind).toBe("joined");
    if (join.kind !== "joined") return;

    // `.size` and `.get` are asserted rather than `instanceof Map`: the
    // return TYPE already guarantees Map-ness, so an `instanceof` here
    // would be a restatement of the compiler (poison shape SIX) while
    // these two are facts about what the loop actually did.
    expect(join.rows.size).toBe(2);
    expect(join.rows.get("T-100")?.state).toBe("live");
    expect(join.rows.get("T-200")?.state).toBe("died");
    // The row is carried WHOLE, not rebuilt: `lanes` is the field whose
    // own doc comment forbids dropping a second lane for one id.
    expect(join.rows.get("T-100")?.lanes.map((l) => l.name)).toEqual(["supertaskr-T-100"]);
    // A key this module never invents. The states are carried across from
    // `join.rs` verbatim, so a Map keyed by anything else would be a
    // classification, which this file's header says it does not do.
    expect([...join.rows.keys()]).toEqual(["T-100", "T-200"]);
  });

  it("a DUPLICATE task id: the LAST row wins, which the module states and nothing held", () => {
    // {@link hydrateJoin}'s doc comment says a duplicate id "would be a
    // defect in the producer … and the last one would win here. That is
    // stated rather than guarded". Stated-and-unheld is how a doc comment
    // becomes false; this body holds it.
    //
    // IT IS NOT A DUPLICATE OF THE BODY ABOVE, IN EITHER DIRECTION, and
    // that is measured rather than argued: a first-wins mutant reds this
    // body alone, and a mutant storing the LAST row under every key reds
    // the body above alone (this fixture's expectation IS the last row).
    const join = hydrateJoin(joined([row("T-300", "live"), row("T-300", "died")]));

    expect(join.kind).toBe("joined");
    if (join.kind !== "joined") return;

    expect(join.rows.size).toBe(1);
    expect(join.rows.get("T-300")?.state).toBe("died");
  });
});

describe("hydrateJoin: the two facts the board's own type cannot hold (T-185)", () => {
  it("carries `notLanes` WHOLE — the field whose doc comment says it is never dropped", () => {
    // FIRST CONSTRUCTION OF A POPULATED `notLanes` IN THIS REPOSITORY.
    // `T-185` measured that no test anywhere had ever built one, which is
    // precisely why three Rust layers preserving it can be undone at this
    // boundary with every gate green. This body does not decide `T-185`
    // — whether the board grows the field or the producer loses it is
    // that card's — it makes the producer's half assertable.
    const join = hydrateJoin(joined([row("T-100", "live")], [notALane]));

    expect(join.kind).toBe("joined");
    if (join.kind !== "joined") return;

    expect(join.notLanes).toEqual([notALane]);
  });

  it("carries `truncated` — the flag that says the lane list is a FLOOR, not a count", () => {
    // FIRST CONSTRUCTION OF `truncated: true` IN THIS REPOSITORY, same
    // reason as above. `lanes.rs` argues at length that a bounded answer
    // must announce itself rather than silently shrink; this is the last
    // boundary at which that argument is still expressible.
    const join = hydrateJoin(joined([row("T-100", "live")], [], true));

    expect(join.kind).toBe("joined");
    if (join.kind !== "joined") return;

    expect(join.truncated).toBe(true);
  });
});

describe("hydrateJoin: the refusal arm is handed back whole", () => {
  it("keeps BOTH the refusal and its sentence, for every LaneScanRefusal arm", () => {
    // THE SWEEP IS OVER ALL FOUR ARMS AND IS ONE BODY ON PURPOSE: the
    // claim is that this module is OPAQUE to the refusal — it re-emits
    // whatever crossed the wire — and four near-identical bodies would be
    // four restatements of one fact (poison shape SIX).
    //
    // **THIS IS NOT `T-195`'s PIN.** That card is about the sentence's
    // post-em-dash half — the reason-bearing WORDING. What this body pins
    // is narrower and is the half that IS C-15's: the reason-bearing
    // field cannot be DROPPED in transit without a red.
    //
    // **THE FILE THIS COMMENT USED TO NAME WAS THE WRONG ONE.** It said
    // the wording is authored in `lanes.rs`'s `LaneScanRefusal::sentence`.
    // Measured at `40c9b8b`: `lanes.rs` holds no `fn sentence`, no
    // `&'static str` return and no `-> String`, and no em dash outside
    // comments in `lanes.rs`, `join.rs`, `fixtures.rs` or `mod.rs` — 0
    // lines in each. **NOT "anywhere in `dispatch/*.rs`", which is how
    // this comment first put it and is false: `brief.rs` carries NINE
    // such lines, including `brief.rs:1517`'s `tail.find(" — ")`, code
    // that searches for one.** The narrower claim is the one the
    // conclusion needs and the one that is true.
    //
    // The enum and its four sentences live in `join.rs`; the sentence
    // T-195 is named for is authored wholly in `task-detail.ts`. The same
    // wrong file is asserted in
    // `docs/architecture/components/C-15-dispatch.md`, which no lane
    // fence reaches — ROUTED there rather than fixed here.
    //
    // `T-195` is now closed and both halves are pinned: the four wire
    // sentences by `join.rs`'s
    // `every_refusal_sentence_is_pinned_whole_rather_than_by_a_fragment`,
    // and the presentation sentence by `select-task-detail.test.ts`. Both
    // assert WHOLE strings, because a `contains` fragment is satisfied by
    // any superstring — measured, not assumed.
    const refusals: readonly LaneScanRefusal[] = [
      { kind: "notAGitRepository" },
      { kind: "gitIsAFile" },
      { kind: "noWorktreesDirectory" },
      { kind: "worktreesUnreadable" },
    ];

    // Asserted non-empty before the loop is trusted: a corpus that came
    // back empty would make every iteration below vacuously agree
    // (poison shape TEN, whose remedy is exactly this line).
    expect(refusals).toHaveLength(4);

    for (const because of refusals) {
      const sentence = `the scan refused — ${because.kind} is why`;
      const join = hydrateJoin({ kind: "unavailable", because, sentence });

      expect(join.kind).toBe("unavailable");
      if (join.kind !== "unavailable") continue;

      expect(join.because).toEqual(because);
      expect(join.sentence).toBe(sentence);
    }
  });
});

// ---------------------------------------------------------------------
// THE JOIN (`T-126-s2`).
//
// **THESE BODIES ARE THE PRICE THE ARCHITECTURE RULING NAMED.** The
// 2026-08-31 sitting refused shape 3 — join in TypeScript — on TEST
// REACHABILITY alone, and refused the other two shapes on properties no
// measurement can revive. An objection with a remedy beside two without
// is one option and a price; `T-190` priced it, `T-198` paid it by
// landing this file, and what follows is the coverage that was owed.
//
// **EVERY BODY DRIVES `joinLanes` END TO END OVER A `LaneScan`**, never
// `classify` in isolation, because the four surviving mutants T-110
// measured were all inside the join rather than inside the classifier.
// `classify` is exercised directly exactly once, in the body that pins
// its table shape, and that body is a different claim from the four
// state bodies rather than a duplicate of them: it asserts the FUNCTION
// is total over its two booleans, where they assert the JOIN reaches the
// right row of it.
// ---------------------------------------------------------------------

/** A card, as much of it as the join reads. */
const stamp = (id: string, status: string): BoardStamp => ({ id, status });

/** A scan that produced a list. `truncated` spelled at every call site:
 * a default would be this file holding an opinion about the reader. */
const scanned = (entries: readonly WorktreeEntry[], truncated: boolean): LaneScan => ({
  kind: "scanned",
  entries,
  truncated,
});

describe("joinLanes: the four states, one body each", () => {
  it("`live` — the card is stamped in flight and git has the lane", () => {
    const join = joinLanes(scanned([lane("T-100", "supertaskr-T-100")], false), [
      stamp("T-100", "building"),
    ]);

    expect(join.kind).toBe("joined");
    if (join.kind !== "joined") return;
    expect(join.rows.get("T-100")?.state).toBe("live");
    // The card is carried, not just its id: a row that lost its stamp
    // could not tell a reader WHICH status put it in flight.
    expect(join.rows.get("T-100")?.card).toEqual({ id: "T-100", status: "building" });
    expect(join.rows.get("T-100")?.lanes.map((l) => l.name)).toEqual(["supertaskr-T-100"]);
  });

  it("`died` — the card is stamped in flight and there is NO lane", () => {
    // The state T-110's second mutant made unreachable by emptying the
    // in-flight set. It is the one row of the table that reports a
    // failure nobody wrote down anywhere else.
    const join = joinLanes(scanned([], false), [stamp("T-200", "verifying")]);

    expect(join.kind).toBe("joined");
    if (join.kind !== "joined") return;
    expect(join.rows.get("T-200")?.state).toBe("died");
    expect(join.rows.get("T-200")?.lanes).toEqual([]);
  });

  it("`stampSkipped` — git has a lane and the card is NOT stamped in flight", () => {
    const join = joinLanes(scanned([lane("T-300", "supertaskr-T-300")], false), [
      stamp("T-300", "planned"),
    ]);

    expect(join.kind).toBe("joined");
    if (join.kind !== "joined") return;
    expect(join.rows.get("T-300")?.state).toBe("stampSkipped");
    expect(join.rows.get("T-300")?.card).toEqual({ id: "T-300", status: "planned" });
  });

  it("`notDispatched` — neither, which is the ordinary state of every card", () => {
    const join = joinLanes(scanned([], false), [stamp("T-400", "done")]);

    expect(join.kind).toBe("joined");
    if (join.kind !== "joined") return;
    expect(join.rows.get("T-400")?.state).toBe("notDispatched");
  });
});

describe("joinLanes: the halves that are not one row of the table", () => {
  it("a lane whose task id is on NO card still gets a row, with `card: null`", () => {
    // **THE HALF T-110's THIRD MUTANT SHORT-CIRCUITED.** A dispatch that
    // cut a worktree and never wrote the card leaves exactly this, and a
    // join that iterates only the board cannot see it — the board cannot
    // report what it drops. Note the board here is NOT empty: an empty
    // one would be satisfied by a join that emits a row for every lane
    // unconditionally, which is a different function.
    const join = joinLanes(
      scanned([lane("T-500", "supertaskr-T-500")], false),
      [stamp("T-100", "done")],
    );

    expect(join.kind).toBe("joined");
    if (join.kind !== "joined") return;
    expect([...join.rows.keys()]).toEqual(["T-100", "T-500"]);
    expect(join.rows.get("T-500")?.state).toBe("stampSkipped");
    expect(join.rows.get("T-500")?.card).toBeNull();
    expect(join.rows.get("T-500")?.lanes.map((l) => l.name)).toEqual(["supertaskr-T-500"]);
    // And the carded row is untouched by the second pass.
    expect(join.rows.get("T-100")?.state).toBe("notDispatched");
  });

  it("TWO branches carrying one task id both survive — a list, never one lane", () => {
    // `DispatchRow.lanes` is a list precisely so this cannot be dropped
    // to fit a single field, and no fixture in this repository had ever
    // built the case. Both `existsOnDisk` values are TRUE here, so the
    // body is about MULTIPLICITY and nothing else.
    const join = joinLanes(
      scanned([lane("T-600", "supertaskr-T-600-a"), lane("T-600", "supertaskr-T-600-b")], false),
      [stamp("T-600", "merging")],
    );

    expect(join.kind).toBe("joined");
    if (join.kind !== "joined") return;
    expect(join.rows.get("T-600")?.lanes.map((l) => l.name)).toEqual([
      "supertaskr-T-600-a",
      "supertaskr-T-600-b",
    ]);
    expect(join.rows.get("T-600")?.state).toBe("live");
  });

  it("rows come out sorted by task id in ASCII order, whatever order the board was in", () => {
    // A `Map` keeps INSERTION order, so an unsorted join hands a renderer
    // the order the filesystem and the board happened to be in. The
    // fixture is deliberately in neither ASCII nor numeric order, and
    // `T-110` before `T-9` is the ASCII promise stated rather than the
    // numeric one nobody made.
    const join = joinLanes(scanned([lane("T-9", "supertaskr-T-9")], false), [
      stamp("T-9", "building"),
      stamp("T-300", "done"),
      stamp("T-110", "done"),
    ]);

    expect(join.kind).toBe("joined");
    if (join.kind !== "joined") return;
    expect([...join.rows.keys()]).toEqual(["T-110", "T-300", "T-9"]);
  });

  it("a DUPLICATE board id leaves ONE row and it is the LAST — the `Vec`/`Map` difference, stated", () => {
    // `join.rs` would emit two rows here because its rows are a `Vec`;
    // ADR-009 requires a `Map` on this side and one key holds one value.
    // The module's header states which row survives; this holds it, and
    // it agrees with `hydrateJoin`'s own documented last-wins above.
    const join = joinLanes(scanned([], false), [
      stamp("T-700", "building"),
      stamp("T-700", "done"),
    ]);

    expect(join.kind).toBe("joined");
    if (join.kind !== "joined") return;
    expect(join.rows.size).toBe(1);
    expect(join.rows.get("T-700")?.state).toBe("notDispatched");
    expect(join.rows.get("T-700")?.card).toEqual({ id: "T-700", status: "done" });
  });

  it("non-lane worktrees are carried into `notLanes` and OUT of the rows", () => {
    // Two claims and they are not the same one: the entry must arrive in
    // `notLanes` WHOLE, and it must not have been mistaken for a lane —
    // a join that pushed it into `lanesByTask` would satisfy the first
    // assertion below and fail the second.
    const join = joinLanes(scanned([notALane, lane("T-800", "supertaskr-T-800")], false), [
      stamp("T-800", "building"),
    ]);

    expect(join.kind).toBe("joined");
    if (join.kind !== "joined") return;
    expect(join.notLanes).toEqual([notALane]);
    expect([...join.rows.keys()]).toEqual(["T-800"]);
  });

  it("`truncated` is the SCAN's, carried across rather than re-decided", () => {
    const floor = joinLanes(scanned([], true), [stamp("T-100", "done")]);
    expect(floor.kind).toBe("joined");
    if (floor.kind !== "joined") return;
    expect(floor.truncated).toBe(true);

    // THE CONTROL, and it is what makes the line above evidence: a join
    // hardcoding `true` passes the assertion above and fails this one.
    const whole = joinLanes(scanned([], false), [stamp("T-100", "done")]);
    expect(whole.kind).toBe("joined");
    if (whole.kind !== "joined") return;
    expect(whole.truncated).toBe(false);
  });
});

describe("joinLanes: a refused scan is not an empty one", () => {
  it("every refusal arm becomes `unavailable`, carries its own kind, and gets its OWN sentence", () => {
    // **T-110's FOURTH MUTANT GAVE TWO REFUSALS ONE SENTENCE AND BOTH
    // `tsc` PROGRAMS AGREED WITH IT** — `assertNever` catches a MISSING
    // arm, never a WRONG one, and `satisfies Record<…>` is the same
    // guarantee about shape. The pairwise-distinct assertion at the end
    // is the half that kills it; the per-arm assertions are the half
    // that says WHICH sentence belongs to which case.
    //
    // WHOLE STRINGS, never a fragment: a `contains` check is satisfied
    // by any superstring, which is how a sentence that says two things
    // passes for one that says one.
    const expected: ReadonlyMap<LaneScanRefusal["kind"], string> = new Map([
      ["notAGitRepository", "this folder is not a git repository, so it has no lanes to read"],
      [
        "gitIsAFile",
        "this folder is itself a git worktree (its .git is a file), so its lanes live in the repository it was cut from",
      ],
      ["noWorktreesDirectory", "this repository has never registered a worktree"],
      ["worktreesUnreadable", "this repository's .git/worktrees could not be read"],
    ]);

    // Asserted non-empty before the loop is trusted (poison shape TEN).
    expect(expected.size).toBe(4);

    // A NON-EMPTY BOARD, so the fixture would otherwise have produced
    // rows: "expected no rows, got no rows" is satisfied equally by a
    // refusal and by an empty board, and only the first is the property.
    const board = [stamp("T-100", "building")];
    const sentences: string[] = [];
    for (const [kind, sentence] of expected) {
      const because = { kind } as LaneScanRefusal;
      const join = joinLanes(because, board);

      expect(join.kind).toBe("unavailable");
      if (join.kind !== "unavailable") continue;
      expect(join.because).toEqual(because);
      expect(join.sentence).toBe(sentence);
      // The exported helper answers the same way the join does — it is
      // the one `task-detail.ts` would reach for, and a second spelling
      // of these strings inside `joinLanes` would pass every assertion
      // above.
      expect(refusalSentence(because)).toBe(sentence);
      sentences.push(join.sentence);
    }

    expect(sentences).toHaveLength(4);
    expect(new Set(sentences).size).toBe(4);
  });

  it("the CONTROL: the same board over a SCANNED empty repository classifies rather than refusing", () => {
    // A refusal and a repository with no worktrees are not the same
    // fact, and this is the body that makes the four assertions above
    // mean something: the identical board comes back JOINED here.
    const join = joinLanes(scanned([], false), [stamp("T-100", "building")]);

    expect(join.kind).toBe("joined");
    if (join.kind !== "joined") return;
    expect(join.rows.get("T-100")?.state).toBe("died");
  });
});

describe("joinLanes: the rule is spelled twice and the two spellings are held equal", () => {
  it("in-flight is exactly THREE statuses, named here as literals", () => {
    // Named as literals rather than derived from the constant: a test
    // parametrised by the thing it checks cannot pin it (T-063). The
    // membership of `verifying` and `merging` is a JUDGEMENT — the lane
    // protocol keeps a worktree alive past the handoff — and this is
    // where that judgement has to be argued with in the open.
    expect([...IN_FLIGHT_STATUSES]).toEqual(["building", "verifying", "merging"]);
    expect(DISPATCH_STATES).toEqual(["live", "died", "stampSkipped", "notDispatched"]);
  });

  it("classify is TOTAL over its two booleans and no two inputs share an answer", () => {
    // The table's shape rather than the join's reach: four inputs, four
    // distinct outputs, and every one of them a member of the union the
    // renderer enumerates. A swapped pair is still four distinct
    // outputs, which is why the four bodies above exist as well.
    const table = [
      [true, true, "live"],
      [true, false, "died"],
      [false, true, "stampSkipped"],
      [false, false, "notDispatched"],
    ] as const;

    expect(table).toHaveLength(4);
    for (const [inFlight, hasLane, state] of table) {
      expect(classify(inFlight, hasLane)).toBe(state);
    }
    expect(new Set(table.map(([, , state]) => state)).size).toBe(4);
    for (const [, , state] of table) {
      expect(DISPATCH_STATES).toContain(state);
    }
  });

  it("the_rust_join_and_this_one_spell_one_rule — `join.rs`'s source is read and required to agree", () => {
    // **THIS IS THE PIN THAT MAKES TWO COPIES SURVIVABLE.** T-110's
    // indictment is *"two copies of one rule with a pin under only one
    // of them"*, and after `T-126-s2` there are two: `join.rs`'s
    // `join_lanes`, still compiled and still driven by `cargo test`, and
    // `joinLanes` here, which is what the webview will reach. Deleting
    // the Rust one is a second architecture decision the ruling did not
    // take (routed as `T-126-s8`), so the drift is closed by measurement
    // instead: this body reads the Rust source and requires the three
    // constants a renderer can SEE to be byte-identical across the
    // boundary.
    //
    // Reading a Rust file from an app body is this directory's existing
    // practice, not a new one — `crescendo-dom.test.tsx` reads
    // `src-tauri/src/lib.rs`, `agent-store.test.ts` reads
    // `agent/runner.rs`, `crescendo.test.ts` reads `agent/kit.rs`. It
    // buys NO component edge: a path string is not an import, and
    // `arch cycles` does not move.
    //
    // WHAT IT DOES NOT CLAIM: that the two implementations AGREE, only
    // that their vocabularies do. A `classify` whose Rust arms are
    // swapped is invisible here and is `cargo test`'s to catch — which
    // it does, one pin per state. `T-110-s3` still carries the general
    // cross-language vocabulary question.
    const joinRs = readFileSync(resolve("src-tauri/src/dispatch/join.rs"), "utf8");
    // The read is shown capable of failing rather than assumed: a path
    // typo would return "" from nothing, and every `includes` below
    // would then be a silent false.
    expect(joinRs.length).toBeGreaterThan(1000);

    // 1. The in-flight set, parsed out of the Rust literal.
    const inFlight = /pub const IN_FLIGHT_STATUSES: \[&str; \d+\] = \[([^\]]*)\];/.exec(joinRs);
    expect(inFlight, "join.rs must still declare IN_FLIGHT_STATUSES").not.toBeNull();
    const rustStatuses = [...inFlight![1]!.matchAll(/"([^"]*)"/g)].map((m) => m[1]!);
    expect(rustStatuses).toHaveLength(3);
    expect(rustStatuses).toEqual([...IN_FLIGHT_STATUSES]);

    // 2. The four state names, camelCased the way serde renames them.
    const states = /pub const DISPATCH_STATES: \[DispatchState; \d+\] = \[([^\]]*)\];/.exec(joinRs);
    expect(states, "join.rs must still declare DISPATCH_STATES").not.toBeNull();
    const rustStates = [...states![1]!.matchAll(/DispatchState::(\w+)/g)].map(
      (m) => m[1]!.charAt(0).toLowerCase() + m[1]!.slice(1),
    );
    expect(rustStates).toHaveLength(4);
    expect(rustStates).toEqual([...DISPATCH_STATES]);

    // 3. The four refusal sentences, each as a WHOLE quoted literal.
    const refusals: readonly LaneScanRefusal[] = [
      { kind: "notAGitRepository" },
      { kind: "gitIsAFile" },
      { kind: "noWorktreesDirectory" },
      { kind: "worktreesUnreadable" },
    ];
    expect(refusals).toHaveLength(4);
    for (const because of refusals) {
      expect(
        joinRs.includes(JSON.stringify(refusalSentence(because))),
        `join.rs must carry ${because.kind}'s sentence verbatim`,
      ).toBe(true);
    }
    // THE CONTROL FOR THE SWEEP ABOVE, and it is what stops a green here
    // from meaning "the file was searched for nothing": a sentence this
    // module does NOT author must be absent, so the search is shown able
    // to answer both ways within the body that relies on it.
    expect(joinRs.includes(JSON.stringify("this repository has never registered a lane"))).toBe(
      false,
    );
  });
});
