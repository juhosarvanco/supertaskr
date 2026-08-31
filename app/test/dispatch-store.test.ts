import { describe, expect, it } from "vitest";
import {
  hydrateJoin,
  type DispatchJoinWire,
  type DispatchRow,
  type LaneRegistration,
  type LaneScanRefusal,
  type NotALaneEntry,
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
  worktreePath: `/Users/x/Projects/nputer-${taskId}`,
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
    const join = hydrateJoin(joined([row("T-100", "live", [lane("T-100", "nputer-T-100")]), row("T-200", "died")]));

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
    expect(join.rows.get("T-100")?.lanes.map((l) => l.name)).toEqual(["nputer-T-100"]);
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
    // `&'static str` return and no `-> String`, and no em dash appears
    // outside comments anywhere in `app/src-tauri/src/dispatch/*.rs`. The
    // enum and its four sentences live in `join.rs`; the sentence T-195
    // is named for is authored wholly in `task-detail.ts`. The same wrong
    // file is asserted in `docs/architecture/components/C-15-dispatch.md`,
    // which no lane fence reaches — ROUTED there rather than fixed here.
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
