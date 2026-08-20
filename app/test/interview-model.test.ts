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
  EMPTY_BANKING_OBSERVATION,
  failureAction,
  failureDetail,
  failureHeadline,
  listOf,
  MAX_CHIP_PATHS,
  mergeRehydrated,
  observeBanking,
  questionFooter,
  rehydrate,
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
    // T-081's new `GenesisTurn` field. Overridable through `patch` like
    // every other default here.
    denials: [],
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

  it("…but a baseline that knows NO project is not a switch, however high its seq", () => {
    // FOUND BY THE LANE, not by reasoning, and the shape is specific:
    // `resetDocsForProjectSwitch` returns `{ ...emptyState(), seq }`, so
    // a genesis switch that carries no tree leaves the docs state at a
    // real ordering stamp over `projectDir: ""` — no project at all. A
    // guard keyed on "has anything happened" refuses the first snapshot
    // of the whole interview and silently drops every chip it should
    // have produced. The guard asks "did the baseline KNOW a project?"
    // instead, testing docs-model.ts's own sentinel.
    const noProjectYet = bankBaseline({ ...docs(10, {}, ""), seq: 10 });
    expect(noProjectYet.seq, "a real watermark…").toBe(10);
    expect(noProjectYet.projectDir, "…over no project").toBe("");
    expect(
      bankedSince(noProjectYet, docs(11, { "docs/NORTH_STAR.md": "x" }, "/e2e/streak")),
    ).toEqual(["docs/NORTH_STAR.md"]);

    // …and once there IS a project on the baseline, a switch still
    // yields nothing. Both halves, so neither can be loosened alone.
    const settled = bankBaseline(docs(11, { "docs/NORTH_STAR.md": "x" }, "/e2e/streak"));
    expect(bankedSince(settled, docs(12, { "docs/ROADMAP.md": "r" }, "/e2e/elsewhere"))).toEqual(
      [],
    );
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
  ): ReadonlyMap<number, readonly string[]> {
    const primed = observeBanking(EMPTY_BANKING_OBSERVATION, primeAt, 1);
    return steps.reduce(
      (observation, step) => observeBanking(observation, docs(step.seq, step.files), step.at),
      primed,
    ).chipsByTurn;
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
   * T-072 CRITERION 1. What stood here was `a docs snapshot during an
   * active turn produces a chip` — T-057's replacement for the
   * `f(x) === f(x)` tautology it deleted, and character-identical to `a
   * file that lands AFTER completed still belongs to that turn` three
   * cases above once its one inert content string (`"written"` against
   * `"v1"`) was rewritten. It red under an expected-value poison and
   * killed no mutant of its own: POISON SHAPE SIX, and the criterion
   * that asked for it is what built it.
   *
   * THE SHAPE THE SUITE DID NOT DRIVE is a second banking INTO A TURN
   * THAT ALREADY HAS ONE. Every other `bank()` body in this file banks
   * once per turn, or banks the same path twice (`a file that changes
   * TWICE`, where the union is a no-op by cardinality and the early
   * return above it takes the call) — so nothing reached
   * `observeBanking`'s union with anything to add, and the ORDER it puts
   * that union in was pinned nowhere. `bankedSince` sorts its OWN
   * answer, which is a different sort in a different function and is
   * already pinned by `the result is sorted and deduped`; the row a
   * reader sees is the ACCUMULATED set, and the planner writes in
   * whatever order it writes. So a path banked SECOND that sorts FIRST
   * has to move to the front of the row, not to the end of it.
   */
  it("a second banking in the same turn merges in PATH order, not arrival order", () => {
    const chips = bank(
      [
        { seq: 2, files: { "docs/ROADMAP.md": "r" }, at: 1 },
        { seq: 3, files: { "docs/ROADMAP.md": "r", "docs/ARCHITECTURE.md": "a" }, at: 1 },
      ],
      docs(1, {}),
    );
    // Arrival order is ROADMAP then ARCHITECTURE; the row reads the
    // other way round. Two entries, so this also says the first chip
    // SURVIVED the second observation rather than being replaced by it.
    expect(chips.get(1)).toEqual(["docs/ARCHITECTURE.md", "docs/ROADMAP.md"]);
  });

  /**
   * T-072 CRITERIA 2-3, the model half of the render pin. The DOM half —
   * that this identity really does cost React nothing — is `a quiet
   * snapshot costs the conversation NO extra render` in
   * `app/test/interview-chat-dom.test.tsx`; this one pins the property
   * that half depends on, at the only place it can be stated exactly.
   *
   * A QUIET SNAPSHOT IS THE ORDINARY CASE, not an edge one: the watcher
   * debounces at 250 ms and emits on any change under the watch root, so
   * most snapshots during an interview move the seq and no docs
   * artifact. The baseline MUST advance for those; the chip map must
   * not, and the two facts are asserted together because either alone
   * can be satisfied by a transition that is simply broken.
   */
  it("a quiet snapshot advances the baseline and returns the chip map BY IDENTITY", () => {
    const tree = { "docs/STATE.md": "s", "docs/NORTH_STAR.md": "n" };
    const primed = observeBanking(EMPTY_BANKING_OBSERVATION, docs(1, { "docs/STATE.md": "s" }), 1);
    const banked = observeBanking(primed, docs(2, tree), 1);
    // The positive control, and it comes FIRST so that a transition
    // which reuses the caller's map reds here rather than three lines
    // later on the pollution that reuse causes: the map DOES move when
    // something is banked, so the identity assertions below are claims
    // about this transition and not about a map that never changes.
    expect(banked.chipsByTurn, "a banking allocates a NEW map…").not.toBe(primed.chipsByTurn);
    expect(banked.chipsByTurn.get(1), "…carrying the path").toEqual(["docs/NORTH_STAR.md"]);

    const quiet = observeBanking(banked, docs(3, tree), 1);
    expect(quiet.baseline.seq, "the baseline still advances…").toBe(3);
    expect(quiet.chipsByTurn, "…and the render half does not move").toBe(banked.chipsByTurn);

    // A REPEAT is the stronger guarantee, and it is what makes the
    // chat's effect safe under StrictMode's double-invoke: nothing
    // moved, so the WHOLE observation comes back by identity.
    expect(observeBanking(quiet, docs(3, tree), 1), "a repeat moves nothing at all").toBe(quiet);
  });

  /**
   * T-072 CRITERION 5 — WHICH GUARD HOLDS WHICH ARM, WRITTEN DOWN
   * BECAUSE THE NAME OF THIS TEST DOES NOT SAY. Read the `switched:
   * undefined` half at `equal` and `lower` as proof of the
   * different-project guard and you have read more than it proves:
   * MEASURED, deleting `bankedSince`'s project clause reds exactly two
   * OTHER bodies (`a DIFFERENT project yields nothing` and the second
   * half of `…but a baseline that knows NO project is not a switch`) and
   * leaves this one GREEN at every arm below except `higher`. At an
   * EQUAL or LOWER switch seq it is the STALE-SNAPSHOT guard —
   * `docs.seq <= baseline.seq`, one line up — that returns the empty
   * list, and the project clause is never reached.
   *
   * THAT IS A TENSION, NOT A MISTAKE, and the two arms are unchanged
   * because it is the point of them: an equal or lower watermark is
   * exactly what leaves the `changed` half alone with the REBASELINING
   * clause in `observeBanking`, which fires on a project change even
   * when the seq alone would refuse it. Take the equal/lower arms away
   * and nothing pins that clause.
   *
   * (The UNINFLECTED form of the verb that sentence wants is avoided
   * deliberately, here and in the inline notes below, where the
   * inflected forms are harmless: that one spelling is also a Tailwind
   * utility name, and everything under `app/test` is scanned for
   * candidates without being parsed, so writing it in a COMMENT adds 27
   * bytes of dead CSS to the SHIPPED stylesheet. Measured, both
   * directions; `T-072-s5` carries the close.)
   *
   * `higher` closes the gap by ADDING an arm rather than by loosening
   * one: at a switch seq ABOVE the baseline the stale guard passes, so
   * `switched: undefined` there can only be the project clause — and it
   * is the arm that reds under the mutation described above.
   */
  it("rebaselines a project switch before banking the next change", () => {
    const switchAt = (seq: number) => {
      const projectA = observeBanking(
        EMPTY_BANKING_OBSERVATION,
        docs(8, { "docs/STATE.md": "A" }, "/tmp/a"),
        1,
      );
      const switched = observeBanking(
        projectA,
        docs(seq, { "docs/STATE.md": "B" }, "/tmp/b"),
        1,
      );
      const changed = observeBanking(
        switched,
        docs(seq + 1, { "docs/STATE.md": "B2" }, "/tmp/b"),
        1,
      );
      return { switched: switched.chipsByTurn.get(1), changed: changed.chipsByTurn.get(1) };
    };
    expect({ equal: switchAt(8), lower: switchAt(3), higher: switchAt(9) }).toEqual({
      // Held by the stale-snapshot guard; the `changed` half is what
      // isolates the rebaselining clause. See the note above.
      equal: { switched: undefined, changed: ["docs/STATE.md"] },
      lower: { switched: undefined, changed: ["docs/STATE.md"] },
      // Held by the different-project guard, and by nothing else: seq 9
      // is above the baseline's 8, so the stale guard passes it through.
      higher: { switched: undefined, changed: ["docs/STATE.md"] },
    });
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

// ---- T-029: the typed failures, and the action each one earns ------------

describe("a typed failure carries the ONE action that helps (T-029)", () => {
  it("names the login and REFUSES the retry, because the retry cannot work", () => {
    const error = {
      kind: "authFailed",
      status: 401,
      message: "Failed to authenticate. API Error: 401 OAuth access token has been revoked.",
    } as const;
    expect(failureHeadline(error)).toBe("your CLI's login has expired");
    const action = failureAction(error)!;
    // T-082: EXACT, and exactly this. `claude login` is not a command —
    // the CLI parses an unrecognised leading word as the PROMPT — so this
    // pin is written as equality against the corrected literal rather
    // than as a substring, which `claude login` would still satisfy.
    expect(action.command).toBe("claude auth login");
    // THE DISCRIMINATING PROPERTY of the whole criterion. Nothing about
    // an expired login changes between two presses of Try again, so
    // offering it is offering the one thing that cannot work.
    expect(action.retry).toBe(false);
    expect(action.fallback).toBe(true);
    // The CLI's own words survive as the detail — evidence, not a
    // diagnosis, and dropping them would trade one silence for another.
    expect(failureDetail(error)).toContain("401");
  });

  /**
   * T-082 criterion 4 — THE ADVICE IS THE APP'S OWN AND IS NEVER
   * ASSEMBLED FROM WHAT THE CLI SAID.
   *
   * The defect this card fixes is a command nobody ran. An app that
   * lifted its recovery command out of the CLI's own error text would
   * inherit that class forever: whatever the CLI printed would become
   * what the user is told to type. So the fixture below is an auth
   * failure whose words name a DIFFERENT command entirely, and the
   * property is that the app's value does not move.
   *
   * THE SECOND ASSERTION IS THE POSITIVE CONTROL, and without it the
   * first one is satisfied equally by "insulated" and by "the message
   * never arrived" (CONVENTIONS: a negative assertion needs a positive
   * control). `failureDetail` proves the hostile text really did reach
   * the app and really is rendered — as EVIDENCE — while `command`
   * stayed the app's own literal.
   */
  it("keeps its own recovery command when the CLI's words name a different one", () => {
    const error = {
      kind: "authFailed",
      status: 401,
      message:
        "Failed to authenticate. API Error: 401 credentials expired, please run `frobnicate --relogin` to continue.",
    } as const;
    const action = failureAction(error)!;
    expect(action.command).toBe("claude auth login");
    expect(action.command).not.toContain("frobnicate");
    expect(action.hint).not.toContain("frobnicate");
    // The control: the CLI's text DID arrive, and is rendered as detail.
    expect(failureDetail(error)).toContain("frobnicate --relogin");
  });

  it("names the denied tools, and KEEPS the retry, because a denial may not repeat", () => {
    const error = {
      kind: "toolDenied",
      denials: ["Bash", "WebFetch"],
      terminalReason: "refusal",
    } as const;
    expect(failureHeadline(error)).toBe("the planner was refused a tool it needed");
    const action = failureAction(error)!;
    expect(action.hint).toContain("Bash and WebFetch");
    expect(action.retry).toBe(true);
    expect(action.command).toBeNull();
  });

  it("routes a refused session id to 'start fresh' rather than to a generic toast", () => {
    const error = { kind: "rejectedSessionId", why: "refusing to resume: it begins with '-'" } as const;
    expect(failureHeadline(error)).toBe("the saved session id is unusable");
    const action = failureAction(error)!;
    expect(action.retry).toBe(false);
    expect(action.fallback).toBe(false);
    expect(failureDetail(error)).toContain("begins with '-'");
  });

  it("leaves the pre-existing variants exactly as they were", () => {
    // The residual class keeps its generic Try again — for these the
    // retry genuinely is the right and only offer.
    for (const error of [
      { kind: "spawnFailed", os: "No such file" },
      { kind: "startTimeout" },
      { kind: "stall" },
      { kind: "exitNonZero", code: 1, stderrTail: "boom" },
      { kind: "malformedStream", why: "no session init line in the stream" },
    ] as const) {
      expect(failureAction(error), error.kind).toBeNull();
    }
    expect(failureHeadline({ kind: "exitNonZero", code: 1, stderrTail: "" })).toBe(
      "the planner exited with code 1",
    );
  });

  it("lists names the way a sentence does", () => {
    expect(listOf([])).toBe("a tool");
    expect(listOf(["Bash"])).toBe("Bash");
    expect(listOf(["Bash", "WebFetch"])).toBe("Bash and WebFetch");
    expect(listOf(["Bash", "WebFetch", "Write"])).toBe("Bash, WebFetch and Write");
  });
});

// ---- T-029: the rehydration ---------------------------------------------

describe("the conversation is where you left it (T-029 criteria 1-2)", () => {
  const at = (turn: number) => 1_700_000_000_000 + turn;

  it("folds a banked transcript into the two shapes the chat renders", () => {
    const { turns, userHalves } = rehydrate([
      { turn: 1, role: "user", text: "You are the planner. KIT ROOT: /k", atMs: at(1), machine: true },
      { turn: 1, role: "planner", text: "who is it for?", atMs: at(1) },
      { turn: 2, role: "user", text: "solo founders", atMs: at(2) },
      { turn: 2, role: "planner", text: "what is observable?", atMs: at(2) },
    ]);
    expect(turns.map((t) => t.turn)).toEqual([1, 2]);
    // ON DISK MEANS FINISHED. A rehydrated turn is never `running`: a
    // pulse dot over a turn nothing is generating would be the screen
    // claiming work is happening.
    expect(turns.every((t) => t.status === "completed")).toBe(true);
    expect(turns.every((t) => t.error === null && t.activity.length === 0)).toBe(true);
    // THE APP-ASSEMBLED HALF IS DROPPED ON THE TYPED FLAG. Recognising
    // machine text by READING it is the classify-by-string this project
    // bans everywhere else.
    expect([...userHalves.keys()]).toEqual([2]);
    expect(userHalves.get(2)).toBe("solo founders");
  });

  it("keeps a pre-T-029 transcript readable — `machine` absent is not `machine` true", () => {
    const { userHalves } = rehydrate([
      { turn: 2, role: "user", text: "an older build wrote this", atMs: at(2) },
    ]);
    expect(userHalves.get(2)).toBe("an older build wrote this");
  });

  it("skips a line whose turn number is not a number at all", () => {
    const { turns, userHalves } = rehydrate([
      { turn: Number.NaN, role: "planner", text: "junk", atMs: 0 },
      { turn: 3, role: "planner", text: "real", atMs: at(3) },
    ]);
    expect(turns.map((t) => t.text)).toEqual(["real"]);
    expect(userHalves.size).toBe(0);
  });

  it("LIVE STATE WINS: a memory of a turn never overwrites the turn", () => {
    const banked = [
      { turn: 1, role: "planner" as const, text: "banked turn 1", atMs: at(1) },
      { turn: 2, role: "planner" as const, text: "the stale copy on disk", atMs: at(2) },
    ];
    const live: GenesisTurn[] = [
      {
        turn: 2,
        text: "the live turn, mid-stream",
        activity: ["Write"],
        // T-081's new `GenesisTurn` field; this case is about which COPY
        // of a turn wins, not about denials.
        denials: [],
        status: "running",
        truncatedRelay: false,
        error: null,
      },
    ];
    const merged = mergeRehydrated(
      banked,
      live,
      new Map([[2, "my live answer"]]),
    );
    expect(merged.turns.map((t) => [t.turn, t.text, t.status])).toEqual([
      [1, "banked turn 1", "completed"],
      [2, "the live turn, mid-stream", "running"],
    ]);
    expect(merged.userHalves.get(2)).toBe("my live answer");

    const streamed = mergeRehydrated(
      banked,
      [{ ...live[0]!, text: `${live[0]!.text}!` }],
      new Map([[2, "my live answer"]]),
    );
    expect(Object.is(streamed.turns[0], merged.turns[0])).toBe(true);
    expect(Object.is(streamed.turns[1], merged.turns[1])).toBe(false);
  });

  it("returns the live arguments BY IDENTITY when there is nothing banked", () => {
    const turns: GenesisTurn[] = [];
    const halves = new Map<number, string>();
    const merged = mergeRehydrated([], turns, halves);
    // The ordinary in-session render allocates nothing, so the store's
    // identity discipline reaches all the way to this join.
    expect(merged.turns).toBe(turns);
    expect(merged.userHalves).toBe(halves);
  });

  it("renders end to end: a rehydrated conversation assembles in order", () => {
    const merged = mergeRehydrated(
      [
        { turn: 1, role: "user", text: "KICKOFF", atMs: at(1), machine: true },
        { turn: 1, role: "planner", text: "q1", atMs: at(1) },
        { turn: 2, role: "user", text: "a1", atMs: at(2) },
        { turn: 2, role: "planner", text: "q2", atMs: at(2) },
      ],
      [],
      new Map(),
    );
    const entries = assembleTranscript(merged.turns, merged.userHalves, new Map());
    expect(entries.map((e) => `${e.kind}:${e.turn}`)).toEqual([
      "planner:1",
      "user:2",
      "planner:2",
    ]);
    // The last planner turn is the current question, as ever.
    expect(entries.filter((e) => e.kind === "planner" && e.current)).toHaveLength(1);
  });
});
