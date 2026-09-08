import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  boardReadiness,
  coldStartOffer,
  completionOf,
  completionSafely,
  crescendo,
  elapsedLabel,
  flightOf,
  showsBoard,
  splitColdStartAnswer,
  COLD_START_GAPS_HEADING,
  HOUR_FORM_FROM_MINUTES,
  MINUTE_MS,
  type ColdStartPhase,
  type ColdStartReading,
} from "../src/genesis/crescendo";
import type { GenesisTurn } from "../src/lib/agent-store";
import {
  applySnapshot,
  emptyState,
  type DocsFilePayload,
  type DocsModelState,
} from "../src/lib/docs-model";
import {
  openBoardFromGenesis,
  resetDocsForProjectSwitch,
  selectScreen,
  type ShellState,
} from "../src/lib/watcher-store";

/**
 * T-028's pure half, pinned without a DOM: WHEN the right pane becomes
 * the board, WHEN the run is over, what the elapsed slot reads, and what
 * the one CTA does to the shell.
 *
 * Every docs state below is built by the REAL `applySnapshot` over real
 * file bytes — no hand-authored `DocsModelState` literals — so what these
 * assertions describe is the parser's own reading of a tree, which is the
 * only reading the board will ever get.
 */

// ---- trees --------------------------------------------------------------

const NORTH_STAR = `# North star

## Vision
A habit tracker that lives in the terminal.

## Users
One concrete person: the founder who forgets.
`;

const ROADMAP = `# Roadmap

## Backbone
- F-01: Log — record a done habit
- F-02: Week view — see the streak

## Milestones
### Milestone 1
- T-001
`;

/** A real, dispatchable-shaped task file (TASK-FORMAT's required set). */
function taskFile(id: string, title: string, status = "planned"): DocsFilePayload {
  return {
    path: `docs/tasks/${id}-x.md`,
    content: [
      "---",
      `id: ${id}`,
      `title: ${JSON.stringify(title)}`,
      "feature: F-01",
      "milestone: 1",
      "priority: 1",
      "size: S",
      `status: ${status}`,
      "blocked_by: []",
      "---",
      "## Acceptance criteria",
      "- WHEN a habit is done THE store SHALL append one line.",
    ].join("\n"),
  };
}

/** A task file the parser cannot establish a record from: no frontmatter
 * at all, which is exactly what a half-written file looks like on disk
 * between the planner's open and close. */
function tornTaskFile(id: string): DocsFilePayload {
  return { path: `docs/tasks/${id}-x.md`, content: `# ${id}\n\nhalf a thought` };
}

let seq = 0;
function tree(files: DocsFilePayload[], prev?: DocsModelState): DocsModelState {
  seq += 1;
  return applySnapshot(prev ?? emptyState(), {
    seq,
    projectDir: "/tmp/crescendo",
    generatedAtMs: seq,
    files,
  });
}

const SCAFFOLD: DocsFilePayload[] = [
  { path: "docs/NORTH_STAR.md", content: NORTH_STAR },
  { path: "docs/ROADMAP.md", content: ROADMAP },
];

// ---- criterion 1 / 4: is there a board, and is it real? -----------------

describe("boardReadiness — the switch is file evidence, and an empty board is never one", () => {
  it("a scaffolded tree with no tasks yet is not a board", () => {
    const readiness = boardReadiness(tree(SCAFFOLD));
    expect(readiness.taskFiles).toBe(0);
    expect(readiness.parsedTasks).toBe(0);
    expect(readiness.showBoard).toBe(false);
    expect(readiness.allFailing, "no tasks is not the same failure as bad tasks").toBe(false);
  });

  it("one parsed task file IS a board — the pane switches on the first card", () => {
    const readiness = boardReadiness(tree([...SCAFFOLD, taskFile("T-001", "Store and done")]));
    expect(readiness.taskFiles).toBe(1);
    expect(readiness.parsedTasks).toBe(1);
    expect(readiness.showBoard).toBe(true);
    expect(readiness.failingTaskFiles).toBe(0);
  });

  it("cards accumulate as files land, one snapshot at a time", () => {
    let docs = tree(SCAFFOLD);
    expect(boardReadiness(docs).parsedTasks).toBe(0);
    docs = tree([...SCAFFOLD, taskFile("T-001", "Store and done")], docs);
    expect(boardReadiness(docs).parsedTasks).toBe(1);
    docs = tree(
      [...SCAFFOLD, taskFile("T-001", "Store and done"), taskFile("T-002", "Week view")],
      docs,
    );
    expect(boardReadiness(docs).parsedTasks).toBe(2);
  });

  it("ALL task files parse-failing is a board of zero cards — criterion 4's own case", () => {
    const docs = tree([...SCAFFOLD, tornTaskFile("T-001"), tornTaskFile("T-002")]);
    const readiness = boardReadiness(docs);
    expect(readiness.taskFiles, "the files are there").toBe(2);
    expect(readiness.failingTaskFiles).toBe(2);
    expect(readiness.parsedTasks, "and not one of them is a card").toBe(0);
    expect(readiness.showBoard, "so the lens stays and the board is never shown").toBe(false);
    expect(readiness.allFailing, "…and it is distinguishable from an empty docs/tasks/").toBe(true);
  });

  it("one good file beside a torn one is still a board, and says how many are torn", () => {
    const readiness = boardReadiness(
      tree([...SCAFFOLD, taskFile("T-001", "Store and done"), tornTaskFile("T-002")]),
    );
    expect(readiness.taskFiles).toBe(2);
    expect(readiness.parsedTasks).toBe(1);
    expect(readiness.failingTaskFiles).toBe(1);
    expect(readiness.showBoard).toBe(true);
  });

  it("a torn file that ONCE parsed keeps its card (the last-good contract)", () => {
    const good = tree([...SCAFFOLD, taskFile("T-001", "Store and done")]);
    const torn = tree([...SCAFFOLD, tornTaskFile("T-001")], good);
    const readiness = boardReadiness(torn);
    expect(readiness.failingTaskFiles, "the chip family reports it").toBe(1);
    expect(readiness.parsedTasks, "and the board keeps rendering the last valid state").toBe(1);
    expect(readiness.showBoard).toBe(true);
  });

  it("only flat docs/tasks/T-*.md counts — the parser's own predicate, not a second one", () => {
    const docs = tree([
      ...SCAFFOLD,
      // A triaged rejection: nested, and deliberately not a model input.
      { path: "docs/tasks/rejected/T-999-nope.md", content: taskFile("T-999", "no").content },
      // Not a T- file: notes beside the board are not cards.
      { path: "docs/tasks/NOTES.md", content: "# scratch" },
      // Not under docs/tasks/ at all.
      { path: "docs/decisions/001-stack.md", content: "# stack" },
    ]);
    const readiness = boardReadiness(docs);
    expect(readiness.taskFiles).toBe(0);
    expect(readiness.showBoard).toBe(false);
  });
});

describe("showsBoard — the decision cannot take the screen down", () => {
  it("agrees with boardReadiness on a readable tree", () => {
    expect(showsBoard(tree(SCAFFOLD))).toBe(false);
    expect(showsBoard(tree([...SCAFFOLD, taskFile("T-001", "Store and done")]))).toBe(true);
  });

  it("a tree that throws on every read degrades to the lens instead of throwing", () => {
    const boom = new Proxy(new Map<string, string>(), {
      get() {
        throw new Error("T-028 PROBE: the tree exploded while being read");
      },
    });
    const hostile: DocsModelState = {
      ...tree([...SCAFFOLD, taskFile("T-001", "Store and done")]),
      effective: boom as ReadonlyMap<string, string>,
    };
    // The unguarded call is the defect; the guarded one is the fix.
    expect(() => boardReadiness(hostile)).toThrow();
    expect(showsBoard(hostile)).toBe(false);
  });
});

// ---- criterion 2 / 4: the completion signal ------------------------------

function turn(n: number, status: GenesisTurn["status"]): GenesisTurn {
  return {
    turn: n,
    text: `turn ${n}`,
    activity: [],
    // T-081 added this field to `GenesisTurn`; nothing in the crescendo
    // reads it, and an empty list is what a turn with no refusals has.
    denials: [],
    status,
    truncatedRelay: false,
    error: null,
  };
}

describe("completionOf — four conditions, none of them read out of prose", () => {
  const board = (): DocsModelState =>
    tree([...SCAFFOLD, taskFile("T-001", "Store and done"), taskFile("T-002", "Week view")]);

  it("completes when the last turn settled, nothing is in flight, and a board is on disk", () => {
    expect(completionOf(board(), [turn(1, "completed"), turn(2, "completed")], false)).toEqual({
      complete: true,
      turns: 2,
    });
  });

  it("does NOT complete while a turn is in flight", () => {
    expect(completionOf(board(), [turn(1, "completed")], true)).toEqual({
      complete: false,
      blocker: "turnInFlight",
    });
  });

  it("does NOT complete before the planner has said anything", () => {
    expect(completionOf(board(), [], false)).toEqual({ complete: false, blocker: "noTurns" });
  });

  it("does NOT complete on a failed or cancelled tail — a crash is not a closing turn", () => {
    for (const status of ["failed", "cancelled", "running"] as const) {
      expect(
        completionOf(board(), [turn(1, "completed"), turn(2, status)], false),
        `a ${status} last turn must not read as complete`,
      ).toEqual({ complete: false, blocker: "lastTurnUnsettled" });
    }
  });

  it("does NOT complete without a parseable board — planning theater, refused", () => {
    expect(completionOf(tree(SCAFFOLD), [turn(1, "completed")], false)).toEqual({
      complete: false,
      blocker: "noBoard",
    });
    expect(
      completionOf(tree([...SCAFFOLD, tornTaskFile("T-001")]), [turn(1, "completed")], false),
      "seven unparseable files are not a plan",
    ).toEqual({ complete: false, blocker: "noBoard" });
  });

  it("reads the HIGHEST turn number, not the last array slot", () => {
    // The store appends by arrival, and `upsertTurn` can update in place;
    // ordering by number is what makes this a claim about the interview
    // rather than about an array.
    const outOfOrder = [turn(2, "completed"), turn(1, "failed")];
    expect(completionOf(board(), outOfOrder, false)).toEqual({ complete: true, turns: 2 });
    const inverted = [turn(1, "completed"), turn(2, "failed")];
    expect(completionOf(board(), inverted, false)).toEqual({
      complete: false,
      blocker: "lastTurnUnsettled",
    });
  });

  it("is NOT a latch: answering again stands the completion state back down", () => {
    const docs = board();
    const turns = [turn(1, "completed")];
    expect(completionOf(docs, turns, false).complete).toBe(true);
    expect(completionOf(docs, turns, true).complete, "the user is still talking").toBe(false);
  });
});

// ---- T-171: is a turn ACTUALLY in flight? --------------------------------

describe("flightOf — a flag is a claim, the turn's own status is the measurement", () => {
  it("A RUNNING TURN IS THE STRONGEST READING, whatever the flags say", () => {
    // Every flag off, one running turn: the runner opened it and has not
    // closed it, which is the only evidence that earns "planner is
    // thinking…".
    expect(flightOf([turn(1, "running")], false, null, false)).toEqual({
      inFlight: true,
      because: "running",
    });
    // …and it is read over the whole list, not off the tail: a retry of
    // turn 1 runs UNDER settled later turns, and the pulse dot the chat
    // draws per turn reads the same field.
    expect(flightOf([turn(1, "running"), turn(2, "completed")], false, null, false)).toEqual({
      inFlight: true,
      because: "running",
    });
  });

  it("THE STRANDED CLAIM IS REFUSED — @human's walk, in one call", () => {
    // The 2026-08-30 genesis walk's terminal state, reconstructed from
    // what its own `.supertaskr/` recorded: ten turns, the last one COMPLETED
    // (its planner line is on disk, which the runner writes only when the
    // turn produced text), the registry `idle`, a board of cards — and a
    // store still claiming flight. The screen rested on "planner is
    // thinking… · ⌘. to stop" with a disabled button, indefinitely.
    const settled = [turn(9, "completed"), turn(10, "completed")];
    expect(flightOf(settled, false, 10, true)).toEqual({
      inFlight: false,
      because: "stranded",
    });
    // The claim is refused whether or not this side remembers which turn
    // it was about: what contradicts it is that nothing is running.
    expect(flightOf(settled, false, null, true)).toEqual({
      inFlight: false,
      because: "stranded",
    });
  });

  it("the latch covers the command's own round trip", () => {
    // Between the keypress and the command's answer there is no turn to
    // read — dropping this is a footer that flickers to "⏎ send" after
    // every single answer.
    expect(flightOf([turn(1, "completed")], true, 1, false)).toEqual({
      inFlight: true,
      because: "latched",
    });
  });

  it("an ACCEPTED turn with no event yet is in flight — the `started` race", () => {
    // The runner spawns the turn on a thread, so `started` races the
    // command's return. `awaiting` is the outcome's own turn number, and
    // a turn that has not arrived cannot have settled.
    expect(flightOf([turn(1, "completed")], false, 2, true)).toEqual({
      inFlight: true,
      because: "unlanded",
    });
    // The same shape at the very first turn, where the list is empty.
    expect(flightOf([], false, 1, true)).toEqual({ inFlight: true, because: "unlanded" });
  });

  it("an empty turn list contradicts nothing, so the store's claim stands", () => {
    // A webview that arrived after the turn did — the mount-time status
    // pull's whole purpose. There is no measurement to set against it.
    expect(flightOf([], false, null, true)).toEqual({ inFlight: true, because: "claimed" });
    // …and with nothing claiming anything, nothing is in flight.
    expect(flightOf([], false, null, false)).toEqual({ inFlight: false, because: "idle" });
  });

  it("a settled tail with no claim at all is idle, not stranded", () => {
    // The ordinary between-questions state. `stranded` is reserved for a
    // claim that was CONTRADICTED, so that the defect stays nameable
    // rather than collapsing into the healthy case.
    expect(flightOf([turn(1, "completed")], false, 1, false)).toEqual({
      inFlight: false,
      because: "idle",
    });
    for (const status of ["failed", "cancelled"] as const) {
      expect(
        flightOf([turn(1, status)], false, 1, false),
        `a ${status} turn is not in flight`,
      ).toEqual({ inFlight: false, because: "idle" });
    }
  });
});

describe("completionSafely — the ending cannot take the conversation down", () => {
  const safeBoard = (): DocsModelState =>
    tree([...SCAFFOLD, taskFile("T-001", "Store and done"), taskFile("T-002", "Week view")]);

  it("agrees with completionOf on a readable tree, complete and not", () => {
    // The positive control: this wrapper is a guard, so it has to be shown
    // passing the real reading through before its degradation means
    // anything.
    expect(completionSafely(safeBoard(), [turn(1, "completed")], false)).toEqual({
      complete: true,
      turns: 1,
    });
    expect(completionSafely(tree(SCAFFOLD), [turn(1, "completed")], false)).toEqual({
      complete: false,
      blocker: "noBoard",
    });
  });

  it("a tree that throws on every read degrades to `unreadable`, not to a crash", () => {
    const boom = new Proxy(new Map<string, string>(), {
      get() {
        throw new Error("T-171 PROBE: the tree exploded while being read");
      },
    });
    const hostile: DocsModelState = {
      ...safeBoard(),
      effective: boom as ReadonlyMap<string, string>,
    };
    // The unguarded call is the defect the chat would have inherited from
    // OUTSIDE T-037's error boundary; the guarded one is the fix.
    expect(() => completionOf(hostile, [turn(1, "completed")], false)).toThrow();
    expect(completionSafely(hostile, [turn(1, "completed")], false)).toEqual({
      complete: false,
      blocker: "unreadable",
    });
  });
});

describe("crescendo — the whole right-half decision in one call", () => {
  it("completion implies the board: the panel never replaces what it celebrates", () => {
    const model = crescendo(
      tree([...SCAFFOLD, taskFile("T-001", "Store and done")]),
      [turn(1, "completed")],
      false,
    );
    expect(model.half).toBe("board");
    expect(model.completion.complete).toBe(true);
  });

  it("no board means the lens, whatever the conversation has done", () => {
    const model = crescendo(tree(SCAFFOLD), [turn(1, "completed")], false);
    expect(model.half).toBe("lens");
    expect(model.completion).toEqual({ complete: false, blocker: "noBoard" });
  });
});

// ---- criterion 2 / 3: the elapsed slot ----------------------------------

describe("elapsedLabel — three forms, and no clock of its own", () => {
  it("no clock started reads as nothing at all, never as zero", () => {
    expect(elapsedLabel(null)).toBeNull();
  });

  it("under a minute says so rather than rounding to a zero", () => {
    expect(elapsedLabel(0)).toBe("<1 min");
    expect(elapsedLabel(MINUTE_MS - 1)).toBe("<1 min");
  });

  it("minutes, in the unit the product's own timed criterion is written in", () => {
    expect(elapsedLabel(MINUTE_MS)).toBe("~1 min");
    expect(elapsedLabel(9 * MINUTE_MS)).toBe("~9 min");
    expect(elapsedLabel(30 * MINUTE_MS), "the NORTH_STAR target, read off the slot").toBe(
      "~30 min",
    );
    expect(elapsedLabel((HOUR_FORM_FROM_MINUTES - 1) * MINUTE_MS)).toBe("~119 min");
  });

  it("hours past two, because nobody reads ~745 min", () => {
    expect(elapsedLabel(HOUR_FORM_FROM_MINUTES * MINUTE_MS)).toBe("~2h");
    expect(elapsedLabel(125 * MINUTE_MS)).toBe("~2h 5m");
  });

  it("a clock that reads backwards is floored, never negative", () => {
    expect(elapsedLabel(-1)).toBe("<1 min");
    expect(elapsedLabel(-9 * MINUTE_MS)).toBe("<1 min");
  });
});

// ---- criterion 2: the CTA's effect on the shell -------------------------

function shellWith(patch: Partial<ShellState>): ShellState {
  return {
    phase: "genesis",
    resolvedDir: null,
    resolvedProbe: null,
    genesisDir: "/tmp/crescendo",
    rejectedPick: null,
    picking: false,
    starting: false,
    startupFailure: null,
    watcherLive: false,
    indexing: false,
    indexOutcome: null,
    docs: tree([...SCAFFOLD, taskFile("T-001", "Store and done")]),
    ...patch,
  };
}

describe("openBoardFromGenesis — a screen change, not a project change", () => {
  it("lands the interview's own project on the board, with the rail restored", () => {
    const before = shellWith({});
    const after = openBoardFromGenesis(before);
    expect(after.phase).toBe("open");
    expect(selectScreen(after).screen, "which is the screen the rail renders on").toBe("board");
    expect(after.genesisDir, "the interview is over; the folder is just the project now").toBeNull();
    // THE PROJECT ITSELF IS UNTOUCHED — same model, same seq, same
    // parsed tasks. Nothing was re-opened, re-armed or re-read, which is
    // the whole reason this needs no command.
    expect(after.docs, "the docs model is the same object").toBe(before.docs);
    expect(after.docs.model.tasks.map((t) => t.id)).toEqual(["T-001"]);
  });

  it("returns prev BY IDENTITY when there is no interview to hand over", () => {
    const open = shellWith({ phase: "open" });
    expect(openBoardFromGenesis(open)).toBe(open);
    const loading = shellWith({ phase: "loading" });
    expect(openBoardFromGenesis(loading)).toBe(loading);
  });

  it("refuses a genesis project no snapshot was ever applied for", () => {
    // The shape `reducePickOutcome` produces for a folder with no docs/:
    // a real seq watermark over no project at all. There is no board
    // behind that, so the handoff would land on an empty one.
    const noSnapshot = shellWith({ docs: { ...resetDocsForProjectSwitch(emptyState()), seq: 7 } });
    expect(openBoardFromGenesis(noSnapshot)).toBe(noSnapshot);
  });

  it("clears a rejected pick so the front door's card does not follow the user across", () => {
    const withRejection = shellWith({
      rejectedPick: { path: "/tmp/elsewhere", message: null, probe: null },
    });
    expect(openBoardFromGenesis(withRejection).rejectedPick).toBeNull();
    expect(selectScreen(openBoardFromGenesis(withRejection)).screen).toBe("board");
  });
});

// ---- T-175: the cold-start test, offered and never gating ---------------

describe("splitColdStartAnswer — the GAPS are the output, and 'none' is not zero", () => {
  const ANSWER = [
    "This is a habit tracker for one founder who forgets.",
    "Milestone 1 ships the log and the week view.",
    "",
    "GAPS:",
    "- ARCHITECTURE says the tool hands the process over; ADR-002 says it exits with the editor's status.",
    "- B-1 is referenced and no such file exists.",
  ].join("\n");

  it("splits the explain-back from the gaps the reader named", () => {
    const split = splitColdStartAnswer(ANSWER);
    expect(split.gapsNamed).toBe(true);
    expect(split.gaps).toHaveLength(2);
    expect(split.gaps[0]).toContain("ADR-002");
    expect(split.gaps[1]).toBe("B-1 is referenced and no such file exists.");
    // The explain-back is the prose ABOVE the heading, and the heading
    // itself is not in it.
    expect(split.explainBack).toContain("habit tracker");
    expect(split.explainBack).toContain("Milestone 1");
    expect(split.explainBack).not.toContain("GAPS:");
    expect(split.explainBack).not.toContain("B-1");
  });

  it("an answer with NO gaps section keeps the whole text and says the section is missing", () => {
    const split = splitColdStartAnswer("A habit tracker. I ran out of room to say more.");
    // THE POSITIVE FIRST: the words are all still there, so this is a
    // degradation and not a loss.
    expect(split.explainBack).toBe("A habit tracker. I ran out of room to say more.");
    expect(split.gapsNamed, "a missing section is never 'no gaps'").toBe(false);
    expect(split.gaps).toEqual([]);
  });

  it("'- none' is an ANSWER to the second half, not a gap", () => {
    const split = splitColdStartAnswer("Whole and clear.\n\nGAPS:\n- none\n");
    expect(split.gapsNamed, "the reader answered the second half").toBe(true);
    expect(split.gaps).toEqual([]);
    expect(split.explainBack).toBe("Whole and clear.");
  });

  it("the heading is matched EXACTLY and on its own line — the two near misses", () => {
    // (a) THE SINGULAR. The prompt's own wording says "one '- ' bullet
    // per GAP:", so a containment matcher on "GAP" splits here and loses
    // half the explain-back.
    // WHAT EACH NEAR MISS ASSERTS IS THAT NOTHING WAS TRUNCATED. That
    // `gapsNamed` is false here is the previous body's subject and is
    // deliberately not restated: both redded on one mutant when it was.
    const singular = splitColdStartAnswer("I found one GAP: the roadmap.\n- not a bullet list");
    expect(singular.explainBack).toContain("I found one GAP: the roadmap.");
    expect(singular.explainBack).toContain("- not a bullet list");

    // (b) THE HEADING QUOTED IN PROSE. The method's own sentence carries
    // it, and a reader may quote the instruction it was given.
    const quoted = splitColdStartAnswer(
      "The docs told me GAPS: are gaps in the docs, so here goes.\nIt is a tracker.",
    );
    expect(quoted.explainBack).toContain("The docs told me GAPS:");
    expect(quoted.explainBack).toContain("It is a tracker.");

    // …and the real thing, on its own line, still splits — without which
    // the two assertions above would be satisfied by a parser that never
    // matches anything.
    const real = splitColdStartAnswer("It is a tracker.\nGAPS:\n- the roadmap has no dates");
    expect(real.gapsNamed).toBe(true);
    expect(real.gaps).toEqual(["the roadmap has no dates"]);
  });

  it("the LAST heading wins, so a reader that quotes itself still splits at what it wrote", () => {
    const split = splitColdStartAnswer(
      ["I will end with GAPS:", "GAPS:", "- the first one", "GAPS:", "- the real one"].join("\n"),
    );
    expect(split.gaps).toEqual(["the real one"]);
    expect(split.explainBack).toContain("the first one");
  });

  it("blank lines and stray prose between bullets are skipped, never swallowed as gaps", () => {
    const split = splitColdStartAnswer(
      ["Prose.", "GAPS:", "", "- one", "some trailing sentence", "  - two  ", ""].join("\n"),
    );
    expect(split.gaps).toEqual(["one", "two"]);
  });
});

describe("coldStartOffer — offered at completion, and gating nothing in either direction", () => {
  const board = (): DocsModelState =>
    tree([...SCAFFOLD, taskFile("T-001", "Store and done"), taskFile("T-002", "Week view")]);
  const cold = (phase: ColdStartPhase, over: Partial<ColdStartReading> = {}): ColdStartReading => ({
    phase,
    answer: null,
    error: null,
    ...over,
  });

  it("a finished interview STAYS finished through every cold-start phase", () => {
    // THE RULING, AS A MEASUREMENT. Triage: "completion is at the last
    // bank; the cold-start test is an offered next action." One docs
    // tree, one turn list, one `inFlight` — and the completion reading is
    // deep-equal across all four phases, because the cold-start state is
    // not one of its inputs and this body is what would red if somebody
    // made it one.
    const docs = board();
    const turns = [turn(1, "completed")];
    const completion = completionOf(docs, turns, false);
    expect(completion).toEqual({ complete: true, turns: 1 });
    for (const phase of ["idle", "running", "done", "failed"] as const) {
      // Reading the offer is the act that could have moved completion, so
      // it happens BETWEEN the two readings rather than beside them.
      // What each phase renders as is the next body's subject and is
      // deliberately not restated here.
      coldStartOffer(completion, cold(phase, { answer: "an answer" }));
      expect(
        completionOf(docs, turns, false),
        `completion after reading the offer at ${phase}`,
      ).toEqual({ complete: true, turns: 1 });
    }
  });

  it("offers nothing before the last bank — including when a cold answer exists", () => {
    // THE REVERSE DIRECTION, which is the half a reader would not think
    // to check: an explain-back over a tree the planner is still writing
    // must not be rendered beside a half-built board.
    const midFlight = completionOf(board(), [turn(1, "running")], true);
    expect(midFlight).toEqual({ complete: false, blocker: "turnInFlight" });
    expect(coldStartOffer(midFlight, cold("done", { answer: "a stale reading" }))).toEqual({
      offered: false,
      because: "notComplete",
    });
    const noBoard = completionOf(tree(SCAFFOLD), [turn(1, "completed")], false);
    expect(noBoard).toEqual({ complete: false, blocker: "noBoard" });
    expect(coldStartOffer(noBoard, cold("idle")).offered).toBe(false);
  });

  // THE FAILED ARM IS THE NEXT BODY'S AND IS NOT REPEATED HERE. Both
  // bodies redded on one mutant when this one covered all four phases,
  // which is two descriptions of one rule rather than two rules.
  it("idle, running and answered each render as themselves", () => {
    const completion = completionOf(board(), [turn(1, "completed")], false);
    expect(coldStartOffer(completion, cold("idle"))).toEqual({
      offered: true,
      state: "available",
    });
    expect(coldStartOffer(completion, cold("running"))).toEqual({
      offered: true,
      state: "running",
    });
    const answered = coldStartOffer(
      completion,
      cold("done", { answer: "It is a tracker.\nGAPS:\n- no dates" }),
    );
    expect(answered).toMatchObject({ offered: true, state: "answered" });
    if (answered.offered && answered.state === "answered") {
      expect(answered.answer.gaps).toEqual(["no dates"]);
      expect(answered.answer.explainBack).toBe("It is a tracker.");
    }
  });

  it("a failed cold read leaves the offer standing, named, and shows no score of any kind", () => {
    const completion = completionOf(board(), [turn(1, "completed")], false);
    expect(
      coldStartOffer(completion, cold("failed", { error: { kind: "exitNonZero" } })),
      "the typed reason travels so the pane can say what happened",
    ).toEqual({ offered: true, state: "failed", kind: "exitNonZero" });
    const failed = coldStartOffer(completion, cold("failed", { error: { kind: "startTimeout" } }));
    expect(failed.offered, "a failed cold read is not a failed project").toBe(true);
    // The whole offer, serialized: nothing in it is a number, a
    // percentage or a grade. Criterion 3 says the gaps are the output
    // "not a score", and this is that sentence as an assertion.
    expect(JSON.stringify(failed)).not.toMatch(/\d/);
  });

  it("a `done` with no text renders as the offer, never as an empty answer panel", () => {
    const completion = completionOf(board(), [turn(1, "completed")], false);
    expect(coldStartOffer(completion, cold("done", { answer: null }))).toEqual({
      offered: true,
      state: "available",
    });
  });
});

// ---- T-175: the keeper for the heading's two declarations ---------------

describe("the cold reader's heading is ONE string with two declarations", () => {
  /**
   * **THE SURVIVOR THIS BODY EXISTS FOR, MEASURED BEFORE IT WAS WRITTEN.**
   * `COLD_START_GAPS_HEADING` is declared twice: in
   * `app/src-tauri/src/agent/kit.rs`, which is AUTHORITATIVE because the
   * cold-start prompt is assembled from it, and again in
   * `src/genesis/crescendo.ts`, which is the MIRROR the parser matches
   * against. Mutating the Rust producer alone — sha256-landed,
   * sha256-restored — left `cargo test` at exit 0 AND `npm test` at exit
   * 0 over 1130 bodies, while the shipped parser turned
   * `gaps: [2 items], gapsNamed: true` into `gaps: [], gapsNamed: false`.
   * Criterion 3's actionable output stops working and nothing anywhere
   * goes red. Two copies of one fact, with no keeper.
   *
   * **THE JOIN IS OUT OF FENCE AND THE KEEPER IS NOT, WHICH IS THE WHOLE
   * POINT.** Making the two into one string means carrying it across the
   * IPC boundary, and that boundary is `app-shell` (`T-175-s1`). Reading
   * the producer OFF THE TREE needs nothing but a file read, and this
   * suite's C-13 siblings — `architecture-dogfood`, `map-dogfood-render`
   * — already do exactly that.
   *
   * **IT IS DELIBERATELY NOT PARAMETRISED BY THE THING IT CHECKS**
   * (T-063's vacuity, which the first Rust-side body walked into): the
   * value is EXTRACTED from Rust source and then used to drive the real
   * parser, so agreement is measured rather than assumed in either
   * direction.
   */
  const KIT_RS = resolve("src-tauri/src/agent/kit.rs");

  /** The Rust producer's own value, read off the tree. */
  function rustHeading(): string {
    const source = readFileSync(KIT_RS, "utf8");
    const declaration = /pub const COLD_START_GAPS_HEADING: &str = "([^"]*)";/.exec(source);
    // LOUD, never a skip: a renamed constant or a moved file must fail
    // here rather than quietly stop comparing anything.
    expect(
      declaration,
      `no COLD_START_GAPS_HEADING declaration found in ${KIT_RS} — if it was renamed or moved, ` +
        "this keeper must be re-pointed, not deleted: it is the only thing joining the prompt " +
        "the Rust side writes to the parser the pane runs",
    ).not.toBeNull();
    return declaration![1]!;
  }

  // ONE BODY, TWO ASSERTIONS, AND IT WAS TWO BODIES FOR ONE DRILL. The
  // string comparison and the end-to-end split both red on every drift in
  // either direction, so as separate bodies they were two descriptions of
  // one rule — the shape this project refuses. The comparison stays as
  // the LEGIBLE half (it names the two spellings in the failure message)
  // and the split stays as the PROPERTY half; neither is a body of its own.
  it("an answer written to the PRODUCER's heading is split by the SHIPPED parser", () => {
    expect(
      rustHeading(),
      "kit.rs assembles the cold-start prompt from its own constant and crescendo.ts matches " +
        "against this one; when they differ the reader is asked for a section the pane cannot find",
    ).toBe(COLD_START_GAPS_HEADING);

    // The property rather than the string: build the fixture out of what
    // Rust actually asks for, then run the real parser over it. This reds
    // in BOTH drift directions — a producer that moves and a mirror that
    // moves — because only one of the two is used on each side.
    const answer = [
      "A habit tracker for one founder who forgets.",
      "",
      rustHeading(),
      "- ARCHITECTURE and ADR-002 disagree about who exits.",
      "- B-1 is referenced and no such file exists.",
    ].join("\n");
    const split = splitColdStartAnswer(answer);
    expect(split.gapsNamed, "the parser found the section the prompt asked for").toBe(true);
    expect(split.gaps).toHaveLength(2);
    expect(split.explainBack).toBe("A habit tracker for one founder who forgets.");
  });
});
