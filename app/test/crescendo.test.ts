import { describe, expect, it } from "vitest";
import {
  boardReadiness,
  completionOf,
  crescendo,
  elapsedLabel,
  showsBoard,
  HOUR_FORM_FROM_MINUTES,
  MINUTE_MS,
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
