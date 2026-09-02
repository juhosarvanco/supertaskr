// @vitest-environment jsdom
// C-18's OWN PIN ON THE COMPOSITION ROOT'S DISPATCH THREADING (T-112-s6).
//
// **WHY THIS FILE EXISTS AT ALL, WHEN `app/test/board-truth.test.tsx`
// ALREADY PINS THE SAME TWO LINES.** That file is C-05's. The pin it
// carries is real and stays (T-112-s6's fourth criterion forbids deleting
// it from outside `[app-shell]`, and this lane does not) — what it cannot
// be is a pin an `[app-board]` card may EDIT. The next board card that
// changes `Board.tsx`'s threading meets a red in a file its fence does not
// reach, which is placement debt with a working pin rather than a coverage
// gap. This file is that debt paid: it is declared in `C-18-board-root.md`'s
// own `paths:`, so the fence that may change the threading is the fence
// that may change its pin.
//
// **EVERY EDGE THIS FILE NEEDS IS ALREADY DECLARED, WHICH IS WHY IT COULD
// BE A NEW FILE RATHER THAN A MOVE.** C-18 declares `[C-06, C-08, C-09,
// C-17]`, so `@nputer/parser/pure` (C-06) and the two prop types out of
// `board-model.ts` / `task-detail.ts` (C-17) are all confirmed edges. It
// imports NOTHING of C-05's — no `App`, nothing under
// `app/src/components/shell/` — because `C-05 -> C-18` is declared and the
// reverse edge cycles (`C-05 -> C-18 -> C-05`).
//
// **AND THAT IS WHY THE PROP FIXTURES BELOW ARE IMPORTED TYPES RATHER THAN
// STRUCTURAL LITERALS.** `board-truth.test.tsx` reaches these two types
// through `ComponentProps<typeof Board>` because C-05 does not declare
// C-17 and importing them there would buy an undeclared edge (T-214).
// C-18 does declare C-17, so this file names them directly — an annotated
// declaration is a fresh literal, so excess-property checking runs and a
// stale key reds at the declaration under `npm run build`, exactly as
// T-214 arranged one file over, and with no contortion.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseProjectFromFiles, type ProjectParseResult } from "@nputer/parser/pure";
import type { DispatchReading } from "../src/lib/board-model";
import type { BriefOutcomeView } from "../src/lib/task-detail";
import { Board } from "../src/components/board/Board";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ROADMAP = ["# R", "", "## Backbone", "- F-01: Method — the convention", ""].join("\n");

const CARD = [
  "---",
  "id: T-400",
  "title: T-400 title",
  "feature: F-01",
  "milestone: 1",
  "priority: 1",
  "size: M",
  "status: planned",
  "---",
  "",
].join("\n");

const MODEL: ProjectParseResult = parseProjectFromFiles([
  { path: "docs/ROADMAP.md", content: ROADMAP },
  { path: "docs/tasks/T-400.md", content: CARD },
]);

/** A scanned repository holding no lane — the quiet state, and the one
 * that leaves T-400 dispatchable. */
const NO_LANES: DispatchReading = {
  kind: "joined",
  rows: new Map(),
  notLanes: [],
  truncated: false,
};

/** The same reading with the scan declared a FLOOR. Only `truncated`
 * differs, which is what makes the body below a statement about the
 * ROOT's threading rather than about the drawer. */
const TRUNCATED_SCAN: DispatchReading = {
  kind: "joined",
  rows: new Map(),
  notLanes: [],
  truncated: true,
};

/** One assembled brief, carrying a sentence nothing else in the rendered
 * tree produces, so an assertion on it proves the brief's VALUE arrived
 * and not merely that some brief did. */
const ASSEMBLED: BriefOutcomeView = {
  kind: "assembled",
  brief: {
    role: "executor",
    roleFile: "method/roles/executor.md",
    taskId: "T-400",
    cardPath: "docs/tasks/T-400.md",
    rows: [
      {
        number: 1,
        carries: "Role",
        assembledFrom: "roles/<role>.md",
        ifAbsent: "the session guesses which seat it is in",
        lines: [
          {
            label: "one line",
            text: "you build exactly one task, then you end",
            provenance: { kind: "tree", source: "method/roles/executor.md" },
          },
        ],
        residual: null,
      },
    ],
    marker: null,
  },
};

let container: HTMLDivElement;
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

function render(element: React.ReactElement): void {
  act(() => root.render(element));
}

/** A full press the way real input delivers it: pointerdown, then click. */
function press(el: Element): void {
  act(() => {
    el.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

const q = (selector: string): Element | null => container.querySelector(selector);

/** Open T-400's drawer off a rendered board. */
function openT400(): void {
  press(q('[data-testid="task-card"][data-task-id="T-400"] button') as Element);
}

describe("the board root threads the dispatch channel into the drawer (T-112-s6, C-18's own pin)", () => {
  it("a card opened with both props renders the drawer's COPYABLE brief", () => {
    // MUTANT: delete either `dispatch={dispatch}` or `brief={brief}` from
    // `Board.tsx` and this body reds — the first because the block stops
    // rendering at all, the second because `selectBriefPanel` answers
    // `unavailable` and the copyable arm disappears.
    render(<Board model={MODEL} dispatch={NO_LANES} brief={ASSEMBLED} />);
    openT400();

    expect(q('[data-testid="detail-brief"]'), "the dispatch block did not render").not.toBeNull();
    const copyable = q('[data-testid="detail-brief-copyable"]');
    expect(copyable, "the brief prop did not reach selectBriefPanel").not.toBeNull();
    expect(copyable?.getAttribute("data-task-id")).toBe("T-400");
    // The VALUE travelled, not merely the shape.
    expect(copyable?.textContent).toContain("you build exactly one task, then you end");
    expect(copyable?.textContent).toContain("method/roles/executor.md");
    expect(q('[data-testid="detail-brief-copy"]')).not.toBeNull();
  });

  it("with both props absent the block does not render at all", () => {
    // THE POSITIVE CONTROL for the body above: without this half, "the
    // block rendered" is satisfied by a block that renders
    // unconditionally, and the drawer's own promise is that an app with
    // no lane channel shows nothing rather than an empty section.
    render(<Board model={MODEL} />);
    openT400();
    expect(q('[data-testid="task-detail-panel"]'), "the drawer must still open").not.toBeNull();
    expect(q('[data-testid="detail-brief"]')).toBeNull();
  });

  it("the dispatch prop alone renders the block as the UNAVAILABLE arm", () => {
    // What separates the two threading lines from each other: `dispatch`
    // decides whether the block exists and `brief` decides which arm it
    // takes. A pin asserting only "the block appeared" would survive the
    // `brief` line being deleted.
    render(<Board model={MODEL} dispatch={NO_LANES} />);
    openT400();
    expect(q('[data-testid="detail-brief"]')).not.toBeNull();
    expect(q('[data-testid="detail-brief-copyable"]')).toBeNull();
    expect(q('[data-testid="detail-brief-unavailable"]')?.textContent).toContain(
      "the assembler has not answered for this card yet",
    );
  });

  it("threads the reading VERBATIM — a truncated scan reaches the drawer as a FLOOR note", () => {
    // **THE HOLE `board-truth.test.tsx` NAMES AND CANNOT CLOSE.** Its own
    // header records that no body in that suite can tell `truncated` from
    // its opposite, so a root that THREADED the props while quietly
    // normalising a field would pass every existing body. `Board.tsx`'s
    // header claims the props are threaded VERBATIM and that the file
    // makes no decision about them; this is that sentence measured.
    //
    // The drawer's own half is C-09's (`detail-assignment.test.tsx` drives
    // `TaskDetailPanel` directly), so what is new here is the ROUTE: the
    // field survives the composition root.
    render(<Board model={MODEL} dispatch={TRUNCATED_SCAN} brief={ASSEMBLED} />);
    openT400();
    const note = q('[data-testid="detail-brief-floor"]');
    expect(note, "the floor note did not reach the drawer").not.toBeNull();
    expect(note?.textContent).toContain("lane list truncated");
    expect(note?.textContent).toContain("FLOOR, not a count");
    // The brief is still there: the note qualifies the invitation to copy
    // rather than replacing it.
    expect(q('[data-testid="detail-brief-copyable"]')).not.toBeNull();
  });

  it("and shows NO floor note when the same reading says the scan was a count", () => {
    // THE POSITIVE CONTROL for the body above, and the discriminating half
    // of the verbatim claim: `NO_LANES` differs from `TRUNCATED_SCAN` in
    // exactly one boolean, so a root that dropped or rewrote the field
    // would make these two bodies agree.
    render(<Board model={MODEL} dispatch={NO_LANES} brief={ASSEMBLED} />);
    openT400();
    expect(q('[data-testid="detail-brief-copyable"]')).not.toBeNull();
    expect(q('[data-testid="detail-brief-floor"]')).toBeNull();
  });
});
