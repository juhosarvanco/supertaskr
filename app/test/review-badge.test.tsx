// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ReviewBadge } from "../src/components/board/badges/ReviewBadge";

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
