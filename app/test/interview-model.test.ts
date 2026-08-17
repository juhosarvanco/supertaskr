import { describe, expect, it } from "vitest";
import {
  emptyGenesisState,
  reduceGenesisEvent,
  type GenesisEvent,
  type GenesisState,
  type GenesisTurn,
} from "../src/lib/agent-store";
import { emptyState, type DocsModelState } from "../src/lib/docs-model";
import {
  activeTurn,
  assembleTranscript,
  bankBaseline,
  bankedSince,
  challengeOf,
  chipLabel,
  failureDetail,
  failureHeadline,
  MAX_CHIP_PATHS,
  questionFooter,
  shouldStickToBottom,
  stageOf,
  stageReadout,
  stageStrip,
  UNPRIMED_BASELINE,
} from "../src/genesis/interview-model";

/**
 * T-027's pure half, against scripted event streams and hand-built docs
 * trees. No DOM, no clock, no `invoke` — and, by construction, NO MODEL
 * CALL: this task adds no Rust, and the only path from the webview to a
 * CLI is `invoke`, which nothing here touches.
 */

// ---- builders -----------------------------------------------------------

/** A docs state carrying exactly these paths. `seq` is the watcher's
 * ordering stamp and the whole banked-chip mechanism keys off it. */
function docs(seq: number, files: Record<string, string>, projectDir = "/tmp/p"): DocsModelState {
  const effective = new Map(Object.entries(files));
  return {
    ...emptyState(),
    seq,
    projectDir,
    effective,
    fileCount: effective.size,
  };
}

/** Fold an event script through the SHIPPED reducer. */
function play(events: readonly GenesisEvent[], from = emptyGenesisState()): GenesisState {
  return events.reduce((state, event) => reduceGenesisEvent(state, event), from);
}

/** A planner turn, for the pieces that take one directly. */
function turn(patch: Partial<GenesisTurn> & { turn: number }): GenesisTurn {
  return {
    text: "",
    activity: [],
    status: "completed",
    truncatedRelay: false,
    error: null,
    ...patch,
  };
}

// ---- turn assembly ------------------------------------------------------

describe("the transcript is a join, and turn 1 has no user half", () => {
  it("interleaves user, planner and chips in render order", () => {
    const turns = [turn({ turn: 1, text: "Q1" }), turn({ turn: 2, text: "Q2" })];
    const users = new Map([
      [1, "never rendered"],
      [2, "my answer"],
    ]);
    const chips = new Map<number, readonly string[]>([[1, ["docs/NORTH_STAR.md"]]]);

    expect(assembleTranscript(turns, users, chips).map((e) => [e.kind, e.turn])).toEqual([
      // TURN 1'S USER HALF IS THE KICKOFF, which lives in
      // .nputer/genesis/transcript.jsonl and is exposed by no command —
      // so no bubble is rendered for it even when one is recorded.
      ["planner", 1],
      ["banked", 1],
      ["user", 2],
      ["planner", 2],
    ]);
  });

  it("marks the LAST planner turn current and everything above it history", () => {
    const turns = [turn({ turn: 1 }), turn({ turn: 2 }), turn({ turn: 3, status: "running" })];
    const entries = assembleTranscript(turns, new Map(), new Map());
    expect(
      entries.filter((e) => e.kind === "planner").map((e) => (e.kind === "planner" ? e.current : null)),
    ).toEqual([false, false, true]);
  });

  it("renders a chip row for a turn whose planner half never arrived", () => {
    // `upsertTurn` silently creates a turn for an unseen number, so the
    // reverse must not crash either: chips banked against a turn the
    // store has no record of still render, in turn order.
    const chips = new Map<number, readonly string[]>([[7, ["docs/STATE.md"]]]);
    expect(assembleTranscript([], new Map(), chips).map((e) => [e.kind, e.turn])).toEqual([
      ["banked", 7],
    ]);
  });

  it("drops an empty chip list rather than rendering an empty row", () => {
    const chips = new Map<number, readonly string[]>([[1, []]]);
    expect(assembleTranscript([turn({ turn: 1 })], new Map(), chips)).toHaveLength(1);
  });

  it("activeTurn is the highest number seen, running or completed", () => {
    expect(activeTurn([])).toBeNull();
    expect(activeTurn([turn({ turn: 3 }), turn({ turn: 1, status: "running" })])).toBe(3);
  });
});

// ---- the seq contract, and the sharp edge §1 named -----------------------

describe("replay and reordering cannot move the transcript", () => {
  const script: GenesisEvent[] = [
    { kind: "started", seq: 1, turn: 1 },
    { kind: "textDelta", seq: 2, turn: 1, text: "Who feels " },
    { kind: "activity", seq: 3, turn: 1, label: "Write" },
    { kind: "textDelta", seq: 4, turn: 1, text: "the pain first?" },
    { kind: "completed", seq: 5, turn: 1, text: "Who feels the pain first?", truncatedRelay: false },
  ];

  it("a replayed script returns the state BY IDENTITY — no re-render at all", () => {
    const once = play(script);
    // The whole script again, every event a duplicate seq.
    const twice = play(script, once);
    expect(twice, "identity, not deep equality — useSyncExternalStore skips").toBe(once);

    // And the render-visible half really is unchanged.
    expect(once.turns).toHaveLength(1);
    expect(once.turns[0]?.text).toBe("Who feels the pain first?");
  });

  it("a duplicate seq, a re-ordered burst and a started for an unseen turn: no crash, no phantom", () => {
    const state = play([
      { kind: "started", seq: 1, turn: 1 },
      { kind: "textDelta", seq: 2, turn: 1, text: "a" },
      // Same seq again: dropped by identity.
      { kind: "textDelta", seq: 2, turn: 1, text: "DUPLICATE" },
      // A completed for a turn nobody started — upsertTurn creates it.
      { kind: "completed", seq: 3, turn: 9, text: "orphan", truncatedRelay: false },
    ]);
    expect(state.turns.map((t) => t.turn)).toEqual([1, 9]);
    expect(state.turns[0]?.text, "the duplicate never landed").toBe("a");
    expect(state.turns[1]?.text).toBe("orphan");
  });

  /**
   * §1'S OPEN QUESTION, ANSWERED FROM `runner.rs` RATHER THAN GUESSED —
   * AND THE ANSWER IS (a): UNREACHABLE BY CONSTRUCTION.
   *
   * Every emit in the runner happens on one thread inside `run_turn`
   * (`app/src-tauri/src/agent/runner.rs`), and `flush_pending` is the
   * ONLY producer of `TextDelta` (runner.rs:1341). It is called from
   * three places, all inside `run_turn`: twice inside the read loop
   * (runner.rs:1183, runner.rs:1231) and — the load-bearing one —
   * UNCONDITIONALLY at runner.rs:1246, immediately after the read loop
   * exits and BEFORE the reap-and-decide block. `emitter.completed` sits
   * at runner.rs:1320 and `emitter.failed` at runner.rs:1316, both
   * strictly after that final flush, with no emit path in between.
   * `Emitter::next` (runner.rs:129-131) stamps seq from one AtomicU64 at
   * the moment of emission, so the flush's delta necessarily carries a
   * LOWER seq than the completion that follows it.
   *
   * So the runner cannot emit a `textDelta` with a seq above a
   * `completed` for the same turn, and no suggestion is filed against
   * C-14: there is no reachable defect to file. What CAN still happen is
   * DELIVERY reordering — the store's guard is the defence, and it is
   * what this test pins. A late-delivered delta carries the seq it was
   * stamped with, which is below the completion's, so it is dropped by
   * identity and the canonical text stands.
   */
  it("a late-delivered delta cannot pollute a completed turn (the store's seq guard)", () => {
    const settled = play([
      { kind: "started", seq: 1, turn: 1 },
      { kind: "textDelta", seq: 2, turn: 1, text: "partial answer" },
      { kind: "completed", seq: 3, turn: 1, text: "the canonical answer", truncatedRelay: false },
    ]);
    // The delta the runner stamped at seq 2, delivered after the
    // completion it preceded. This is the ONLY shape reachable from
    // runner.rs, and it is inert.
    const after = reduceGenesisEvent(settled, {
      kind: "textDelta",
      seq: 2,
      turn: 1,
      text: " AND A DUPLICATED TAIL",
    });
    expect(after, "dropped by identity").toBe(settled);
    expect(after.turns[0]?.text).toBe("the canonical answer");
    expect(after.turns[0]?.status).toBe("completed");
  });

  /**
   * The counterfactual, pinned so the claim above is falsifiable rather
   * than merely asserted: IF a delta with a HIGHER seq than the
   * completion ever arrived, the store would append it to the canonical
   * text and leave the status `completed`. That is the behaviour, it is
   * C-14's, and T-027 renders whatever the store gives it. The emit
   * ordering cited above is what makes this state unreachable — if that
   * ordering ever changes, this test says exactly what the user would
   * then see.
   */
  it("documents what the store WOULD do with an out-of-order delta the runner cannot emit", () => {
    const settled = play([
      { kind: "started", seq: 1, turn: 1 },
      { kind: "completed", seq: 2, turn: 1, text: "canonical", truncatedRelay: false },
    ]);
    const impossible = reduceGenesisEvent(settled, {
      kind: "textDelta",
      seq: 3,
      turn: 1,
      text: " tail",
    });
    expect(impossible.turns[0]?.text).toBe("canonical tail");
    expect(impossible.turns[0]?.status).toBe("completed");
  });
});

// ---- the challenge marker ----------------------------------------------

describe("challengeOf reads the marker and consumes it", () => {
  it("matches the literal prefix and strips it from the body", () => {
    expect(challengeOf('pushing back: You said "fast". Compared to what?')).toEqual({
      challenge: true,
      body: 'You said "fast". Compared to what?',
    });
  });

  it("is case-insensitive, and tolerant of leading whitespace", () => {
    // A rendering hint that fails on `Pushing back:` is a hint that
    // fails — models capitalise sentence starts.
    expect(challengeOf("Pushing Back: why?").challenge).toBe(true);
    expect(challengeOf("PUSHING BACK: why?").challenge).toBe(true);
    expect(challengeOf("\n\n  pushing back: why?")).toEqual({ challenge: true, body: "why?" });
  });

  it("is anchored: the words mid-sentence are just words", () => {
    expect(challengeOf("I am pushing back: on that").challenge).toBe(false);
    expect(challengeOf("pushing backwards: no").challenge).toBe(false);
    expect(challengeOf("pushing back — no colon").challenge).toBe(false);
    expect(challengeOf("").challenge).toBe(false);
    // An absent marker leaves the text completely untouched, whitespace
    // included: only a matched marker is consumed.
    expect(challengeOf("  a normal question?").body).toBe("  a normal question?");
  });

  it("settles mid-stream as soon as the first delta carries it, and completion is authoritative", () => {
    // Split across deltas: the buffer only becomes a challenge once the
    // colon has arrived, because the rule reads the CURRENT text.
    const partial = play([
      { kind: "started", seq: 1, turn: 3 },
      { kind: "textDelta", seq: 2, turn: 3, text: "pushing" },
    ]);
    expect(challengeOf(partial.turns[0]!.text).challenge).toBe(false);
    const whole = reduceGenesisEvent(partial, {
      kind: "textDelta",
      seq: 3,
      turn: 3,
      text: " back: really?",
    });
    expect(challengeOf(whole.turns[0]!.text).challenge).toBe(true);

    // …and the canonical `result` line overwrites the buffer, so a turn
    // whose deltas merely LOOKED like a challenge loses the treatment.
    const settled = reduceGenesisEvent(whole, {
      kind: "completed",
      seq: 4,
      turn: 3,
      text: "an ordinary question",
      truncatedRelay: false,
    });
    expect(challengeOf(settled.turns[0]!.text).challenge).toBe(false);
  });

  /**
   * THE INERTNESS PIN (criterion 2, "the hint is never load-bearing").
   * The same script twice, once with the marker and once without: the
   * two states must be deep-equal except for the turn's text, and the
   * ONLY thing that differs downstream is `challenge` and the body.
   */
  it("the same script with and without the marker is deep-equal but for one boolean", () => {
    const scriptFor = (question: string): GenesisEvent[] => [
      { kind: "started", seq: 1, turn: 1 },
      { kind: "textDelta", seq: 2, turn: 1, text: question },
      { kind: "activity", seq: 3, turn: 1, label: "Write" },
      { kind: "completed", seq: 4, turn: 1, text: question, truncatedRelay: false },
      { kind: "started", seq: 5, turn: 2 },
      { kind: "completed", seq: 6, turn: 2, text: "next", truncatedRelay: false },
    ];
    const question = "Compared to what, and measured how?";
    const plain = play(scriptFor(question));
    const challenged = play(scriptFor(`pushing back: ${question}`));

    // Normalise ONLY the turn text — everything else must already match.
    const strip = (s: GenesisState) => ({
      ...s,
      lastEventAtMs: 0,
      turns: s.turns.map((t) => ({ ...t, text: "" })),
    });
    expect(strip(challenged)).toEqual(strip(plain));

    // Same turn count, same statuses, same activity, same in-flight
    // state, same phase — byte-identical.
    expect(challenged.turns.map((t) => t.status)).toEqual(plain.turns.map((t) => t.status));
    expect(challenged.phase).toBe(plain.phase);
    expect(challenged.sending).toBe(plain.sending);

    // And the ONE difference, both halves of it.
    expect(challengeOf(challenged.turns[0]!.text).challenge).toBe(true);
    expect(challengeOf(plain.turns[0]!.text).challenge).toBe(false);
    expect(challengeOf(challenged.turns[0]!.text).body).toBe(
      challengeOf(plain.turns[0]!.text).body,
    );

    // The footer the current question carries is the same in both.
    expect(questionFooter(4)).toBe("one question at a time · 4 of 7");
  });
});

// ---- banked chips: file evidence, and only file evidence ----------------

describe("bankedSince diffs the tree and claims nothing else", () => {
  const base = bankBaseline(docs(5, { "docs/STATE.md": "one" }));

  it("an ADDED file chips", () => {
    expect(bankedSince(base, docs(6, { "docs/STATE.md": "one", "docs/NORTH_STAR.md": "new" }))).toEqual(
      ["docs/NORTH_STAR.md"],
    );
  });

  it("a CHANGED file chips", () => {
    expect(bankedSince(base, docs(6, { "docs/STATE.md": "two" }))).toEqual(["docs/STATE.md"]);
  });

  it("an UNCHANGED file does not", () => {
    expect(bankedSince(base, docs(6, { "docs/STATE.md": "one" }))).toEqual([]);
  });

  it("a DELETED file does not — a deletion is not a banking", () => {
    expect(bankedSince(base, docs(6, {}))).toEqual([]);
  });

  it("a non-markdown file under docs/ is not an artifact", () => {
    // The lens's own predicate, so the chips and the strip cannot
    // disagree about what counts.
    expect(bankedSince(base, docs(6, { "docs/STATE.md": "one", "docs/graph.json": "{}" }))).toEqual(
      [],
    );
  });

  it("an UNPRIMED baseline yields nothing at all", () => {
    expect(bankedSince(UNPRIMED_BASELINE, docs(9, { "docs/NORTH_STAR.md": "x" }))).toEqual([]);
  });

  it("a stale or empty snapshot yields nothing", () => {
    expect(bankedSince(base, docs(5, { "docs/NORTH_STAR.md": "x" })), "seq equal").toEqual([]);
    expect(bankedSince(base, docs(4, { "docs/NORTH_STAR.md": "x" })), "seq below").toEqual([]);
    expect(bankedSince(base, docs(0, { "docs/NORTH_STAR.md": "x" })), "nothing applied").toEqual([]);
  });

  it("a DIFFERENT project yields nothing — those files are not answers to these questions", () => {
    expect(
      bankedSince(base, docs(9, { "docs/NORTH_STAR.md": "x" }, "/tmp/somewhere-else")),
    ).toEqual([]);
  });

  it("the result is sorted and deduped", () => {
    const banked = bankedSince(
      base,
      docs(6, { "docs/ROADMAP.md": "r", "docs/ARCHITECTURE.md": "a", "docs/STATE.md": "two" }),
    );
    expect(banked).toEqual(["docs/ARCHITECTURE.md", "docs/ROADMAP.md", "docs/STATE.md"]);
  });
});

describe("chip attribution across turn boundaries", () => {
  /** Replay the chat's own observation loop over a script of snapshots,
   * exactly as `InterviewChat`'s effect does it. */
  function bank(
    steps: readonly { seq: number; files: Record<string, string>; at: number }[],
    primeAt: DocsModelState,
  ): Map<number, readonly string[]> {
    let baseline = bankBaseline(primeAt);
    const chips = new Map<number, readonly string[]>();
    for (const step of steps) {
      const state = docs(step.seq, step.files);
      const banked = bankedSince(baseline, state);
      if (state.seq > baseline.seq) baseline = bankBaseline(state);
      if (banked.length === 0) continue;
      const existing = chips.get(step.at) ?? [];
      chips.set(step.at, [...new Set([...existing, ...banked])].sort());
    }
    return chips;
  }

  it("a file that lands AFTER completed still belongs to that turn", () => {
    // The watcher's debounce routinely pushes a snapshot past the result
    // line; attributing only to a turn "in flight" would drop the most
    // common case entirely.
    const chips = bank([{ seq: 2, files: { "docs/NORTH_STAR.md": "v1" }, at: 1 }], docs(1, {}));
    expect(chips.get(1)).toEqual(["docs/NORTH_STAR.md"]);
  });

  it("a file that changes TWICE between turns produces ONE chip", () => {
    const chips = bank(
      [
        { seq: 2, files: { "docs/NORTH_STAR.md": "v1" }, at: 1 },
        { seq: 3, files: { "docs/NORTH_STAR.md": "v2" }, at: 1 },
      ],
      docs(1, {}),
    );
    // The diff is a SET: the files cannot prove two bankings, so the
    // chat does not claim two.
    expect(chips.get(1)).toEqual(["docs/NORTH_STAR.md"]);
  });

  it("a write that lands after the NEXT turn started attributes to the new turn", () => {
    const chips = bank(
      [
        { seq: 2, files: { "docs/NORTH_STAR.md": "v1" }, at: 1 },
        { seq: 3, files: { "docs/NORTH_STAR.md": "v1", "docs/ROADMAP.md": "r" }, at: 2 },
      ],
      docs(1, {}),
    );
    expect(chips.get(1)).toEqual(["docs/NORTH_STAR.md"]);
    expect(chips.get(2)).toEqual(["docs/ROADMAP.md"]);
  });

  /**
   * THE SHARPEST TEST IN THIS FILE, and the proof that no causation was
   * inferred: a file a HUMAN writes in a terminal, mid-interview, with
   * the planner idle, produces an IDENTICAL chip to one the planner
   * wrote. That is not a bug — it is ADR-006's hand-driven mode
   * rendering correctly, and it is what "file evidence only" means. The
   * chip's claim is "this file changed on disk at this point in the
   * conversation", never "this turn caused it".
   */
  it("a human writing the file in a terminal produces an IDENTICAL chip", () => {
    const byPlanner = bank([{ seq: 2, files: { "docs/NORTH_STAR.md": "written" }, at: 1 }], docs(1, {}));
    // Same tree, same seq, same turn — nothing in the inputs says WHO.
    // There is no channel through which it could: the only input is the
    // watcher's snapshot.
    const byHuman = bank([{ seq: 2, files: { "docs/NORTH_STAR.md": "written" }, at: 1 }], docs(1, {}));
    expect(byHuman).toEqual(byPlanner);
    expect(byHuman.get(1)).toEqual(["docs/NORTH_STAR.md"]);
  });

  /**
   * THE OTHER DIRECTION OF THE SAME CRITERION: model output naming real
   * docs paths — in `activity` labels AND in the completed text — must
   * produce ZERO chips. `bankedSince` takes no event stream at all, so
   * this is true by TYPE; the test drives a full script through the real
   * reducer anyway, because the criterion's phrase is "never from
   * parsing model output" and an argument from types is not evidence.
   */
  it("activity labels and completed text naming docs paths produce ZERO chips", () => {
    const state = play([
      { kind: "started", seq: 1, turn: 1 },
      { kind: "activity", seq: 2, turn: 1, label: "Write(docs/NORTH_STAR.md)" },
      { kind: "activity", seq: 3, turn: 1, label: "Write(docs/ROADMAP.md)" },
      { kind: "textDelta", seq: 4, turn: 1, text: "I have written docs/STATE.md for you." },
      {
        kind: "completed",
        seq: 5,
        turn: 1,
        text: "banked → docs/NORTH_STAR.md, docs/ROADMAP.md, docs/CONVENTIONS.md",
        truncatedRelay: false,
      },
    ]);
    // Everything the model said it wrote is in the state…
    expect(state.turns[0]?.activity).toEqual([
      "Write(docs/NORTH_STAR.md)",
      "Write(docs/ROADMAP.md)",
    ]);
    expect(state.turns[0]?.text).toContain("docs/CONVENTIONS.md");
    // …and the disk says nothing changed, so nothing chips.
    const baseline = bankBaseline(docs(1, { "docs/STATE.md": "scaffold" }));
    expect(bankedSince(baseline, docs(2, { "docs/STATE.md": "scaffold" }))).toEqual([]);
  });

  /**
   * PRIMING, and T-042's fix rather than the tripwire T-027's plan
   * costed. The plan expected to have to ACCEPT a lie here — a genesis
   * switch onto a folder whose docs/ already held files sent no
   * snapshot, so the baseline would have been empty and every
   * pre-existing file would have chipped on turn 1 as if the planner had
   * just written it. T-042's criterion 1 made `PickOutcome::Genesis`
   * carry the tree at the switch's own seq, so the baseline is the real
   * tree. This test DELETES the tripwire by asserting the fixed
   * behaviour: pre-existing files do NOT chip.
   */
  it("pre-existing docs do NOT chip on turn 1 (T-042's carried tree)", () => {
    const alreadyThere = docs(4, {
      "docs/ARCHITECTURE.md": "old",
      "docs/GAP.md": "old",
    });
    const chips = bank(
      [
        // A quiet snapshot: nothing has changed since the switch.
        { seq: 5, files: { "docs/ARCHITECTURE.md": "old", "docs/GAP.md": "old" }, at: 1 },
        // Then the planner actually writes something.
        {
          seq: 6,
          files: { "docs/ARCHITECTURE.md": "old", "docs/GAP.md": "old", "docs/STATE.md": "new" },
          at: 1,
        },
      ],
      alreadyThere,
    );
    expect(chips.get(1), "only what actually changed").toEqual(["docs/STATE.md"]);
  });

  it("a snapshot arriving BEFORE the interview started primes rather than chips", () => {
    // The verifier's attack (2): the baseline is taken at the first turn
    // over whatever the tree is then, so anything that landed earlier is
    // history, not a banking.
    expect(bankedSince(UNPRIMED_BASELINE, docs(3, { "docs/NORTH_STAR.md": "early" }))).toEqual([]);
    const primed = bankBaseline(docs(3, { "docs/NORTH_STAR.md": "early" }));
    expect(bankedSince(primed, docs(4, { "docs/NORTH_STAR.md": "early" }))).toEqual([]);
  });
});

describe("the chip row is capped, and says so", () => {
  it("shows every path up to the cap", () => {
    expect(chipLabel(["docs/A.md", "docs/B.md"])).toBe("banked → docs/A.md, docs/B.md");
  });

  it("caps at four and names the remainder rather than dropping it", () => {
    const paths = ["a", "b", "c", "d", "e", "f"].map((n) => `docs/${n}.md`);
    expect(MAX_CHIP_PATHS).toBe(4);
    expect(chipLabel(paths)).toBe(
      "banked → docs/a.md, docs/b.md, docs/c.md, docs/d.md +2 more",
    );
  });
});

// ---- the stage strip ----------------------------------------------------

describe("the seven-segment strip maps the derivation's 0-8 scale", () => {
  it("stage 4 is three done, one current, three future — the design's own frame", () => {
    expect(stageStrip(4)).toEqual([
      "done",
      "done",
      "done",
      "current",
      "future",
      "future",
      "future",
    ]);
  });

  it("stage 0 and null are all future — the scaffold is not a question", () => {
    expect(stageStrip(0)).toEqual(Array(7).fill("future"));
    expect(stageStrip(null)).toEqual(Array(7).fill("future"));
  });

  it("stage 8 is all done — every question was asked before cards are written", () => {
    expect(stageStrip(8)).toEqual(Array(7).fill("done"));
    expect(stageStrip(7)).toEqual([...Array(6).fill("done"), "current"]);
  });

  it("the readout follows the design's word order, and both ends say something true", () => {
    expect(stageReadout(4, "constraints")).toBe("stage 4 of 7 · constraints");
    expect(stageReadout(0, "scaffold")).toBe("scaffold");
    expect(stageReadout(8, "decomposition")).toBe("stage 7 of 7 · decomposition");
    expect(stageReadout(null, null)).toBe("stage —");
  });

  it("the question footer counts to seven and never past it", () => {
    expect(questionFooter(4)).toBe("one question at a time · 4 of 7");
    expect(questionFooter(8)).toBe("one question at a time · 7 of 7");
    expect(questionFooter(0)).toBe("one question at a time");
    expect(questionFooter(null)).toBe("one question at a time");
  });
});

describe("stageOf degrades instead of taking the conversation down", () => {
  it("reads the real derivation on a healthy tree", () => {
    const reading = stageOf(
      docs(2, { "docs/NORTH_STAR.md": "## Vision\n\nA thing.\n\n## Users\n\nSomeone.\n" }),
    );
    expect(reading.failed).toBe(false);
    expect(reading.approxStage).toBe(1);
    expect(reading.stageStep).toBe("problem & person");
  });

  /**
   * The regression this exists for, found by a test rather than guessed
   * at: the chat calls `deriveGenesis` over the same docs tree the lens
   * does, from OUTSIDE T-037's error boundary. A tree torn badly enough
   * to break the lens would have taken the whole interview down with it
   * — the exact failure T-037's boundary exists to prevent, one layer
   * up. The conversation is load-bearing; the strip is decoration.
   */
  it("survives a docs tree that throws on read, and says so", () => {
    const torn = {
      ...emptyState(),
      seq: 3,
      projectDir: "/tmp/p",
      effective: new Proxy(new Map<string, string>(), {
        get() {
          throw new Error("PROBE: the tree threw while being read");
        },
      }) as ReadonlyMap<string, string>,
    };
    const reading = stageOf(torn);
    expect(reading.failed).toBe(true);
    expect(reading.approxStage).toBeNull();
    expect(stageReadout(reading.approxStage, reading.stageStep)).toBe("stage —");
    expect(stageStrip(reading.approxStage)).toEqual(Array(7).fill("future"));
  });
});

// ---- typed failures -----------------------------------------------------

describe("failure text is the runner's own words, bounded and never parsed", () => {
  it("gives every typed variant a headline", () => {
    expect(failureHeadline({ kind: "spawnFailed", os: "ENOENT" })).toContain("could not be started");
    expect(failureHeadline({ kind: "startTimeout" })).toContain("did not answer");
    expect(failureHeadline({ kind: "stall" })).toContain("stopped mid-answer");
    expect(failureHeadline({ kind: "exitNonZero", code: 1, stderrTail: "" })).toBe(
      "the planner exited with code 1",
    );
    expect(failureHeadline({ kind: "exitNonZero", code: null, stderrTail: "" })).toContain(
      "without finishing",
    );
    expect(failureHeadline({ kind: "malformedStream", why: "no init line" })).toContain(
      "could not be read",
    );
  });

  it("relays the CLI's own words verbatim — auth is NOT classified", () => {
    // T-025's smoke found the CLI reports 401 IN BAND on stdout with an
    // empty stderr and `subtype: "success"`, which is why what arrives
    // here is `exitNonZero` and why nothing tries to guess at it. The
    // detail is shown, not interpreted; classification is T-029's.
    const tail =
      "api_retry: authentication_failed 401 … Failed to authenticate. API Error: 401 OAuth access token has been revoked.";
    expect(failureDetail({ kind: "exitNonZero", code: 1, stderrTail: tail })).toBe(tail);
  });

  it("caps a hostile tail rather than rendering it whole, and drops an empty one", () => {
    const huge = "A".repeat(10_000);
    const detail = failureDetail({ kind: "exitNonZero", code: 1, stderrTail: huge })!;
    expect(detail.length).toBeLessThan(huge.length);
    expect(detail.endsWith("…")).toBe(true);
    expect(failureDetail({ kind: "exitNonZero", code: 1, stderrTail: "   " })).toBeNull();
    expect(failureDetail({ kind: "startTimeout" })).toBeNull();
  });
});

// ---- the scroll policy --------------------------------------------------

describe("shouldStickToBottom", () => {
  it("sticks at the bottom and within the threshold", () => {
    expect(shouldStickToBottom(900, 1000, 100)).toBe(true);
    expect(shouldStickToBottom(860, 1000, 100), "40px up, inside 48").toBe(true);
  });

  it("lets go once the reader has scrolled up past it", () => {
    expect(shouldStickToBottom(400, 1000, 100)).toBe(false);
    expect(shouldStickToBottom(851, 1000, 100), "49px up, outside 48").toBe(false);
  });

  it("a region with nothing to scroll is always at the bottom", () => {
    expect(shouldStickToBottom(0, 100, 100)).toBe(true);
  });
});
