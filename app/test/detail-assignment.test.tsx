// @vitest-environment jsdom
// THE PANEL'S ASSIGNMENT ROW (T-169, D5) — moved here from
// review-badge.test.tsx at the T-169 integration: that file is C-08's,
// TaskDetailPanel is C-09's, and the import was the undeclared
// C-08 -> C-09 edge `arch drift` flagged the moment the graph was
// regenerated — the placement debt the lane's own T-169-s1 confessed,
// caught mechanically. This file is declared in C-09's paths.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseProjectFromFiles, type ProjectParseResult } from "@supertaskr/parser/pure";
import type { DispatchReading } from "../src/lib/board-model";
import type { BriefOutcomeView } from "../src/lib/task-detail";
import { TaskDetailPanel } from "../src/components/board/TaskDetailPanel";

// T-112-s5's bodies drive an ASYNC effect (the drawer asking the
// assembler for its own card), and `await act(async () => …)` only
// flushes it with this flag set — the repo's own idiom, taken verbatim
// from review-badge.test.tsx rather than invented here.
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const ROADMAP_SRC = ["# R", "", "## Backbone", "- F-01: Method — the convention", ""].join("\n");

function panelModel(extras: string): ProjectParseResult {
  return parseProjectFromFiles([
    { path: "docs/ROADMAP.md", content: ROADMAP_SRC },
    {
      path: "docs/tasks/T-950-fixture.md",
      content:
        "---\nid: T-950\ntitle: Fixture\nfeature: F-01\nmilestone: 1\npriority: 1\n" +
        `size: S\nstatus: done\nreview: independent\n${extras}---\n\nbody\n`,
    },
  ]);
}

function renderPanel(model: ProjectParseResult): HTMLElement {
  act(() =>
    root.render(
      <TaskDetailPanel
        model={model}
        taskRef={{ kind: "id", id: "T-950" }}
        onOpen={() => {}}
        onClose={() => {}}
      />,
    ),
  );
  return container;
}

describe("the assignment flag in the provenance block (T-169, D5)", () => {
  it("shows BOTH values, names both fields, and says only that they disagree", () => {
    const dom = renderPanel(
      panelModel("builder: claude-opus-5@subagent\nbuilt_by: codex/gpt-5.2 @S3\n"),
    );
    const row = dom.querySelector('[data-testid="stamp-assignment"]');
    if (!(row instanceof HTMLElement)) throw new Error("assignment row did not render");
    expect(row.dataset.assignmentRole).toBe("builder");
    expect(row.querySelector('[data-testid="assignment-assigned"]')?.textContent).toBe(
      "claude-opus-5@subagent",
    );
    expect(row.querySelector('[data-testid="assignment-executed"]')?.textContent).toBe(
      "codex/gpt-5.2 @S3",
    );
    expect(row.textContent).toContain("disagree");
    // The stamp the board ALREADY showed is still there, so the row adds
    // the assignment beside it rather than replacing what was on screen.
    expect(dom.querySelector('[data-testid="stamp-built-by"]')?.textContent).toBe(
      "codex/gpt-5.2 @S3",
    );
    // And the parser's own sentence is in the verbatim issues section —
    // the flag reaches the reader the way a parse error does.
    expect(dom.querySelector('[data-testid="detail-issues"]')?.textContent).toContain(
      "the fields disagree",
    );
  });

  it("renders NO row on an honoured pair — a notice on every card stops being read", () => {
    const dom = renderPanel(
      panelModel("builder: claude-opus-5@subagent\nbuilt_by: claude-opus-5 @T-950\n"),
    );
    expect(dom.querySelector('[data-testid="stamp-assignment"]')).toBeNull();
    expect(dom.querySelector('[data-testid="detail-issues"]')).toBeNull();
    expect(dom.querySelector('[data-testid="stamp-built-by"]')?.textContent).toBe(
      "claude-opus-5 @T-950",
    );
  });
});

// ---- the dispatch brief block (T-112) --------------------------------
//
// **THE APP-SIDE DOM TEST THE CARD'S VERIFICATION LINE ASKS FOR**: the
// copyable block, and its ABSENCE on a card whose fence a live lane
// holds. This file is C-09's and mounts `TaskDetailPanel` directly, which
// is why the bodies live here rather than in a new file — a new
// `app/test/**` path would need a component-registry edit outside this
// card's fence.

const BOARD_ROADMAP = [
  "# R",
  "",
  "## Backbone",
  "- F-01: Method — the convention",
  "- F-02: App — shell and board",
  "",
].join("\n");

const COMPONENT = [
  "---",
  "id: C-90",
  "name: C-90",
  "layer: app",
  "paths:",
  "  - app/src/components/board/**",
  "depends_on: []",
  "decisions: []",
  "status: auto",
  "touch_slugs: [app-board]",
  "---",
  "",
  "A component.",
  "",
].join("\n");

const card = (id: string, status: string, feature: string): string =>
  `---\nid: ${id}\ntitle: ${id} title\nfeature: ${feature}\nmilestone: 1\npriority: 1\n` +
  `size: M\nstatus: ${status}\ntouches: [app-board]\n---\n\nbody\n`;

/** A board with one planned card, and optionally a lane-holding sibling. */
function briefModel(withLane: boolean): ProjectParseResult {
  const files = [
    { path: "docs/ROADMAP.md", content: BOARD_ROADMAP },
    { path: "docs/architecture/components/C-90-x.md", content: COMPONENT },
    { path: "docs/tasks/T-960-fixture.md", content: card("T-960", "planned", "F-01") },
  ];
  if (withLane) {
    files.push({
      path: "docs/tasks/T-961-lane.md",
      content: card("T-961", "building", "F-02"),
    });
  }
  return parseProjectFromFiles(files);
}

// A scanned repository whose lane list is a COUNT and which holds no
// worktree that is not a lane. Both fields are SPELLED rather than
// defaulted by a helper (T-185): `truncated: false` is a claim this
// fixture makes, and a default would put "the scan was complete" and
// "this fixture forgot" back into one value — the exact silence the field
// was added to remove.
const NO_LANES: DispatchReading = {
  kind: "joined",
  rows: new Map(),
  notLanes: [],
  truncated: false,
};

const HELD: DispatchReading = {
  kind: "joined",
  notLanes: [],
  truncated: false,
  rows: new Map([
    [
      "T-961",
      {
        taskId: "T-961",
        state: "live" as const,
        lanes: [
          {
            taskId: "T-961",
            branch: "task/T-961-lane",
            worktreePath: "/tmp/nputer-T-961",
            existsOnDisk: true,
          },
        ],
      },
    ],
  ]),
};

const BRIEF: BriefOutcomeView = {
  kind: "assembled",
  brief: {
    role: "executor",
    roleFile: "method/roles/executor.md",
    taskId: "T-960",
    cardPath: "docs/tasks/T-960-fixture.md",
    rows: [
      {
        number: 1,
        carries: "**Role**",
        assembledFrom: "`roles/<role>.md`",
        ifAbsent: "the session invents its own obligations",
        lines: [
          {
            label: "one line",
            text: "You build exactly one task, then you end.",
            provenance: { kind: "tree", source: "method/roles/executor.md" },
          },
        ],
        residual: null,
      },
    ],
    marker: null,
  },
};

function renderBriefPanel(
  model: ProjectParseResult,
  dispatch: DispatchReading | undefined,
  brief: BriefOutcomeView | undefined,
): HTMLElement {
  act(() =>
    root.render(
      <TaskDetailPanel
        model={model}
        taskRef={{ kind: "id", id: "T-960" }}
        onOpen={() => {}}
        onClose={() => {}}
        dispatch={dispatch}
        brief={brief}
      />,
    ),
  );
  return container;
}

describe("the dispatch brief block (T-112)", () => {
  it("renders the brief in a copyable block for a dispatchable card", () => {
    const dom = renderBriefPanel(briefModel(false), NO_LANES, BRIEF);
    const block = dom.querySelector('[data-testid="detail-brief-copyable"]');
    if (!(block instanceof HTMLElement)) throw new Error("the copyable block did not render");
    expect(block.dataset.taskId).toBe("T-960");
    // The block carries the brief's own text, row and provenance intact —
    // what a human selects is what the assembler produced.
    expect(block.textContent).toContain("ROW 1 —");
    expect(block.textContent).toContain("You build exactly one task, then you end.");
    expect(block.textContent).toContain("<- method/roles/executor.md");
    // PREFORMATTED, not broken: breaking a verbatim quote is editing, so
    // the block scrolls inside itself the way the verdict blocks do.
    expect(block.className).toContain("overflow-x-auto");
    expect(dom.querySelector('[data-testid="detail-brief-copy"]')).not.toBeNull();
    // And the withheld/unavailable faces are NOT on screen at the same
    // time — three answers, one shown.
    expect(dom.querySelector('[data-testid="detail-brief-withheld"]')).toBeNull();
    expect(dom.querySelector('[data-testid="detail-brief-unavailable"]')).toBeNull();
  });

  it("shows the disposition's reason and NO copyable block for a fenced card", () => {
    const dom = renderBriefPanel(briefModel(true), HELD, BRIEF);
    expect(dom.querySelector('[data-testid="detail-brief-copyable"]')).toBeNull();
    const withheld = dom.querySelector('[data-testid="detail-brief-withheld"]');
    if (!(withheld instanceof HTMLElement)) throw new Error("no withheld reason rendered");
    expect(withheld.dataset.disposition).toBe("fenced");
    expect(withheld.textContent).toContain("T-961");
    expect(withheld.textContent).toContain("app-board");
  });

  it("puts the FLOOR note on screen beside a brief read off a truncated scan (T-185)", () => {
    // THE ON-SCREEN HALF of the card's second criterion. `App.tsx` has
    // rendered `docs truncated · showing first N files` since T-018, so
    // this repository already ruled that a truncated read must SAY so; the
    // dispatch scan was the one truncation whose fact stopped at a type
    // with no field for it. This body is the note actually rendering.
    //
    // MUTANT: delete the `panel.floor !== null &&` block in
    // `TaskDetailPanel`'s `BriefBlock` — the model still carries the note
    // and nothing else in this repository reds.
    const dom = renderBriefPanel(
      briefModel(false),
      { kind: "joined", rows: new Map(), notLanes: [], truncated: true },
      BRIEF,
    );
    const note = dom.querySelector('[data-testid="detail-brief-floor"]');
    if (!(note instanceof HTMLElement)) throw new Error("the floor note did not render");
    expect(note.textContent).toContain("lane list truncated");
    expect(note.textContent).toContain("FLOOR, not a count");
    // Muted and factual, the shell's own idiom for this — never a chip.
    expect(note.className).toContain("text-muted-foreground");
    // And the brief is still there: the note qualifies the invitation
    // rather than replacing it.
    expect(dom.querySelector('[data-testid="detail-brief-copyable"]')).not.toBeNull();
  });

  it("and shows NO floor note when the lane list is a count — absence, not an empty note", () => {
    // THE POSITIVE CONTROL for the body above, and the reason it is a
    // separate body rather than two lines inside one: a note that renders
    // on every open is a note nobody reads, which is the same absence
    // discipline the docs truncation note keeps. `NO_LANES` is the only
    // thing that differs from the fixture above.
    const dom = renderBriefPanel(briefModel(false), NO_LANES, BRIEF);
    expect(dom.querySelector('[data-testid="detail-brief-copyable"]')).not.toBeNull();
    expect(dom.querySelector('[data-testid="detail-brief-floor"]')).toBeNull();
  });

  it("renders no dispatch block at all when the app has no lane channel", () => {
    // Absence is the honest answer while the `invoke` is routed: a strip
    // that says nothing on every open is a strip nobody reads.
    const dom = renderBriefPanel(briefModel(false), undefined, undefined);
    expect(dom.querySelector('[data-testid="detail-brief"]')).toBeNull();
    // The positive control: the panel itself did render, so the absence
    // above is the block's and not a failed mount.
    expect(dom.querySelector('[data-testid="task-detail-panel"]')).not.toBeNull();
  });
});

// ---- the drawer ASKS for the brief (T-112-s5) -------------------------
//
// **THE PROP HAD NO FILLER AND THE REASON WAS STRUCTURAL, NOT MISSING
// WIRING.** `dispatch_brief` has been registered since `T-112-s1`, but
// `readBrief(taskId, role)` needs the id of the card the user just
// opened, and that ref is `Board.tsx`'s own `useState` — so `App.tsx`,
// which mounts the board, can compute a `DispatchReading` (a fact about
// the whole repository) and can never compute a `BriefOutcomeView` (a
// fact about ONE card). Ruled at the architecture sitting of 2026-08-31:
// shape 3, the drawer asks, because the drawer is what knows.
//
// **THE BODIES LIVE HERE FOR THE REASON THE T-112 BODIES ABOVE DO** —
// this file is C-09's and mounts `TaskDetailPanel` directly, and a new
// `app/test/**` path would be a registry edit plus a file-count move at
// the integrator's graph regen, for bodies that already have a home.
//
// **THE RUNTIME IS THE SEAM AND IT IS THE APP'S OWN.** `invoke` is
// `window.__TAURI_INTERNALS__.invoke`, which a dozen files in this suite
// already flip; installing a recording stub is what lets these bodies
// assert WHICH card was asked for, and its absence is what the browser
// bundle actually is.

interface InvokeCall {
  readonly cmd: string;
  readonly taskId: unknown;
  readonly role: unknown;
}

/** Install a recording `invoke`, and hand back the log it writes to. */
function installTauri(answer: (taskId: string) => Promise<unknown>): InvokeCall[] {
  const calls: InvokeCall[] = [];
  (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {
    invoke: (cmd: string, args: Record<string, unknown>) => {
      calls.push({ cmd, taskId: args?.taskId, role: args?.role });
      return answer(String(args?.taskId));
    },
  };
  return calls;
}

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
});

/** One assembled brief whose single line is unique to the card it names,
 * so an assertion proves the RIGHT card's answer arrived and not merely
 * that some brief did. */
const briefFor = (taskId: string, line: string): BriefOutcomeView => ({
  kind: "assembled",
  brief: {
    role: "executor",
    roleFile: "method/roles/executor.md",
    taskId,
    cardPath: `docs/tasks/${taskId}-fixture.md`,
    rows: [
      {
        number: 1,
        carries: "**Role**",
        assembledFrom: "`roles/<role>.md`",
        ifAbsent: "the session invents its own obligations",
        lines: [{ label: "one line", text: line, provenance: { kind: "tree", source: "method/roles/executor.md" } }],
        residual: null,
      },
    ],
    marker: null,
  },
});

/** Two dispatchable cards in DIFFERENT columns — the frontier answers
 * per column's topmost card, so a second card in F-01 would not be
 * dispatchable and the re-target body would prove nothing. */
function twoCardModel(): ProjectParseResult {
  return parseProjectFromFiles([
    { path: "docs/ROADMAP.md", content: BOARD_ROADMAP },
    { path: "docs/architecture/components/C-90-x.md", content: COMPONENT },
    { path: "docs/tasks/T-960-fixture.md", content: card("T-960", "planned", "F-01") },
    { path: "docs/tasks/T-962-fixture.md", content: card("T-962", "planned", "F-02") },
  ]);
}

async function renderSettled(
  model: ProjectParseResult,
  taskId: string,
  dispatch: DispatchReading | undefined,
  brief: BriefOutcomeView | undefined,
): Promise<HTMLElement> {
  await act(async () => {
    root.render(
      <TaskDetailPanel
        model={model}
        taskRef={{ kind: "id", id: taskId }}
        onOpen={() => {}}
        onClose={() => {}}
        dispatch={dispatch}
        brief={brief}
      />,
    );
  });
  return container;
}

const copyable = (dom: HTMLElement): HTMLElement | null =>
  dom.querySelector('[data-testid="detail-brief-copyable"]');
const unavailable = (dom: HTMLElement): HTMLElement | null =>
  dom.querySelector('[data-testid="detail-brief-unavailable"]');

describe("the drawer asks the assembler for its OWN card (T-112-s5)", () => {
  it("asks NOTHING when the dispatch prop is absent, because the block will not render", async () => {
    // THE VERIFIER'S ASSIGNED CORRECTION 1 (T-112-s5 at cbc24d4): useAssembledBrief's
    // design note says it asks only when the block will render, and mutant A-M8
    // (the gate deleted) survived all 1170 bodies. The first body of this describe
    // is the positive control: the same fixture and recorder WITH `dispatch`,
    // asserting exactly one call — so an empty log here is a fact about the gate.
    const calls = installTauri(async (taskId) =>
      ({ kind: "answered", outcome: briefFor(taskId, "a brief nobody asked for") }));
    const dom = await renderSettled(briefModel(false), "T-960", undefined, undefined);
    expect(calls).toEqual([]);
    expect(dom.querySelector('[data-testid="detail-brief"]')).toBeNull();
  });

  it("asks dispatch_brief for the open card's id and renders the answer, with no `brief` prop in sight", async () => {
    // THE CARD'S WHOLE CLAIM. `undefined` is passed for the prop
    // deliberately: before this card that argument was the only filler
    // there was, and every body above supplies one.
    const calls = installTauri(async (taskId) =>
      ({ kind: "answered", outcome: briefFor(taskId, "You build exactly one task, then you end.") }));
    const dom = await renderSettled(briefModel(false), "T-960", NO_LANES, undefined);

    // WHICH CARD was asked for is the assertion, not that a call happened:
    // an implementation that asked for the first card on the board, or for
    // a constant, would satisfy "a brief rendered".
    expect(calls).toEqual([{ cmd: "dispatch_brief", taskId: "T-960", role: "executor" }]);

    const block = copyable(dom);
    if (block === null) throw new Error("the copyable block did not render");
    expect(block.getAttribute("data-task-id")).toBe("T-960");
    expect(block.textContent).toContain("You build exactly one task, then you end.");
    expect(unavailable(dom)).toBeNull();
  });

  it("a supplied `brief` prop is answered with itself, and NO question is asked", async () => {
    // THE SEAM THE CARD'S RULING KEEPS ALIVE, pinned from inside
    // `[app-board]`. `app/test/board-truth.test.tsx` drives the same
    // property through `Board`, and it is C-05's — no board fence reaches
    // it, so this file is where an `app-board` lane finds out it broke it.
    const calls = installTauri(async () => {
      throw new Error("the panel asked for a brief it was handed");
    });
    const dom = await renderSettled(
      briefModel(false),
      "T-960",
      NO_LANES,
      briefFor("T-960", "the prop's own sentence, and nothing else produces it"),
    );
    expect(calls).toEqual([]);
    expect(copyable(dom)?.textContent).toContain("the prop's own sentence");
  });

  it("with no Tauri runtime it asks nothing, and the sentence on screen is the one that is already true", async () => {
    // The browser bundle has no assembler to ask — the brief is read
    // Rust-side — so the pre-T-112-s5 sentence is the WHOLE truth there
    // and this card must not replace it with a failure. The positive
    // control is the first body: the same fixture, WITH a runtime,
    // renders the brief.
    const dom = await renderSettled(briefModel(false), "T-960", NO_LANES, undefined);
    expect(copyable(dom)).toBeNull();
    expect(unavailable(dom)?.textContent).toContain(
      "the assembler has not answered for this card yet",
    );
  });

  it("`noProject` reaches the reader as ITS OWN fact, never as 'not answered yet'", async () => {
    // The door's wrapper exists because `noProject` is a fact about the
    // APP and every assembler arm is a fact about a PROJECT. A caller
    // that met it and passed `undefined` would promise an answer that is
    // never coming.
    installTauri(async () => ({ kind: "noProject" }));
    const dom = await renderSettled(briefModel(false), "T-960", NO_LANES, undefined);
    expect(copyable(dom)).toBeNull();
    const sentence = unavailable(dom)?.textContent;
    expect(sentence).toBe(
      "no project is open, so the assembler has no files to read — this is a fact about the app and not about this card",
    );
    // And it is NOT the pending sentence — the near neighbour this arm
    // exists to be distinguishable from.
    expect(sentence).not.toContain("has not answered for this card yet");
  });

  it("a REJECTED invoke reaches the reader as the app's own boundary failing", async () => {
    // `readBrief`'s doc says the boundary rejects rather than answering
    // when it fails, and that callers own that path. This is owning it.
    installTauri(async () => {
      throw new Error("dispatch_brief is not registered");
    });
    const dom = await renderSettled(briefModel(false), "T-960", NO_LANES, undefined);
    expect(copyable(dom)).toBeNull();
    expect(unavailable(dom)?.textContent).toBe(
      "the request for this brief never reached the assembler: dispatch_brief is not registered — the app's own boundary failed, so nothing here is an answer about the card",
    );
  });

  it("a re-targeted drawer never shows the PREVIOUS card's brief", async () => {
    // The drawer re-targets in place on a blocker click. An answer that
    // outlived its question would put one card's brief under another
    // card's heading — the worst possible failure for a block whose whole
    // purpose is to be pasted somewhere.
    let releaseSecond: ((value: unknown) => void) | undefined;
    const calls = installTauri((taskId) =>
      taskId === "T-960"
        ? Promise.resolve({ kind: "answered", outcome: briefFor("T-960", "FIRST CARD ONLY") })
        : new Promise((resolve) => {
            releaseSecond = resolve;
          }),
    );
    const model = twoCardModel();
    const dom = await renderSettled(model, "T-960", NO_LANES, undefined);
    expect(copyable(dom)?.textContent).toContain("FIRST CARD ONLY");

    await renderSettled(model, "T-962", NO_LANES, undefined);
    expect(calls.map((c) => c.taskId)).toEqual(["T-960", "T-962"]);
    // Still in flight for T-962 — and the first card's answer is GONE
    // rather than standing in for it.
    expect(dom.textContent).not.toContain("FIRST CARD ONLY");
    expect(unavailable(dom)?.textContent).toContain("has not answered for this card yet");

    await act(async () => {
      releaseSecond?.({ kind: "answered", outcome: briefFor("T-962", "SECOND CARD ONLY") });
    });
    expect(copyable(dom)?.getAttribute("data-task-id")).toBe("T-962");
    expect(copyable(dom)?.textContent).toContain("SECOND CARD ONLY");
  });
});
