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
import { parseProjectFromFiles, type ProjectParseResult } from "@nputer/parser/pure";
import { TaskDetailPanel } from "../src/components/board/TaskDetailPanel";

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
