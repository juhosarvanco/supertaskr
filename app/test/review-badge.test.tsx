// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseProjectFromFiles, type ProjectParseResult } from "@nputer/parser/pure";
import { ReviewBadge } from "../src/components/board/badges/ReviewBadge";
import { TaskCard } from "../src/components/board/TaskCard";
import type { BoardCard } from "../src/lib/board-model";

// ADR-016: provenance renders as TWO marks — solid disc + check for a
// checked task (independent AND same-model draw the IDENTICAL mark),
// half disc for self-verified. The three-way distinction stays in text
// (hover label), never in the mark. These tests replace T-004's
// three-distinct-marks rendering contract.

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

function renderBadge(mode: "independent" | "same-model" | "self-verified"): HTMLElement {
  act(() => root.render(<ReviewBadge mode={mode} />));
  const badge = container.querySelector('[data-testid="review-badge"]');
  if (!(badge instanceof HTMLElement)) throw new Error("badge did not render");
  return badge;
}

describe("ReviewBadge (ADR-016 two-mark provenance)", () => {
  it("independent and same-model render the identical checked mark", () => {
    const independent = renderBadge("independent");
    expect(independent.dataset.mark).toBe("checked");
    const independentSvg = independent.querySelector("svg")?.innerHTML;

    const sameModel = renderBadge("same-model");
    expect(sameModel.dataset.mark).toBe("checked");
    const sameModelSvg = sameModel.querySelector("svg")?.innerHTML;

    expect(independentSvg).toBeDefined();
    // The mark itself is IDENTICAL — the distinction lives in text only.
    expect(sameModelSvg).toBe(independentSvg);
    // Solid disc + check: a filled circle and a stroked check path.
    expect(independentSvg).toContain("circle");
    expect(independentSvg).toContain("path");
  });

  it("self-verified renders the half disc — never identical to checked", () => {
    const self = renderBadge("self-verified");
    expect(self.dataset.mark).toBe("self");
    const selfSvg = self.querySelector("svg")?.innerHTML;
    const checkedSvg = renderBadge("independent").querySelector("svg")?.innerHTML;
    expect(selfSvg).toBeDefined();
    expect(selfSvg).not.toBe(checkedSvg);
  });

  it("keeps the three-way distinction first-class in TEXT (hover label)", () => {
    const labels = (["independent", "same-model", "self-verified"] as const).map(
      (mode) => renderBadge(mode).getAttribute("title"),
    );
    expect(labels[0]).toContain("independent");
    expect(labels[1]).toContain("same-model");
    expect(labels[2]).toContain("self-verified");
    expect(new Set(labels).size).toBe(3);
  });

  it("draws provenance from its own semantic tokens, not the status palette", () => {
    const badge = renderBadge("independent");
    expect(badge.innerHTML).toContain("var(--review-disc)");
    expect(badge.innerHTML).toContain("var(--review-mark)");
    expect(badge.innerHTML).not.toContain("--status-");
  });
});

/* ────────────────────────────────────────────────────────────────────
 * T-169 — the assignment flag's RENDERING, in the provenance block this
 * file already owns the other half of.
 *
 * It lives here because of a fence, and the fence is worth naming: the
 * board's general DOM file is `board-truth.test.tsx`, which T-169's
 * `touches: [lib-parser, app-board]` does not reach, while this file
 * does and is already the provenance surface's rendering pin. Filed as
 * T-169-s1 rather than moved by a lane that may not move it.
 * ──────────────────────────────────────────────────────────────────── */

const ROADMAP_SRC = ["# R", "", "## Backbone", "- F-01: Method — the convention", ""].join("\n");


describe("the assignment flag on the card face (T-169)", () => {
  const face = (assignment?: BoardCard["assignment"]): HTMLElement => {
    const card: BoardCard = {
      key: "docs/tasks/T-951-x.md",
      id: "T-951",
      title: "Face fixture",
      status: "done",
      visual: { token: "done", pulse: false },
      ...(assignment === undefined ? {} : { assignment }),
      file: "docs/tasks/T-951-x.md",
    };
    act(() => root.render(<TaskCard card={card} onOpen={() => {}} />));
    const li = container.querySelector('[data-testid="task-card"]');
    if (!(li instanceof HTMLElement)) throw new Error("card did not render");
    return li;
  };

  it("counts the flagged pairs for a census, and is ABSENT on a clean card", () => {
    expect(
      face([
        {
          role: "builder",
          assignedField: "builder",
          executedField: "built_by",
          assigned: "claude-opus-5",
          executed: "codex/gpt-5.2 @S3",
        },
      ]).dataset.assignmentViolations,
    ).toBe("1");
    // Absence, never "0" (T-017) — so a census counting attributes counts
    // violations rather than cards.
    expect(face(undefined).dataset.assignmentViolations).toBeUndefined();
  });
});
