// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "../src/App";
import type { DocsSnapshotPayload } from "../src/lib/docs-model";

// T-018 DOM half: the watcher's blind spots are VISIBLE. A collector
// skip renders in the parse-error chip family (sibling chip + details
// strip) while the skipped record keeps its last valid state on the
// board; the 2000-file cap renders as the quiet truncation note in the
// shell's chip strip (the map's "symbols truncated" pattern). Driven
// through the real store via the dev harness (the T-001/T-012
// same-bundle precedent — App mounts, the harness applies a payload,
// the DOM answers).

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

// The watcher-store is a module singleton with a monotonic seq
// watermark; each payload in this file uses a fresh higher seq. The
// 5000 base keeps clear of other suites' ranges (vitest isolates files,
// so this is belt to suspenders).
let nextSeq = 5000;

function payload(
  files: { path: string; content: string }[],
  extra: Partial<DocsSnapshotPayload> = {},
): DocsSnapshotPayload {
  nextSeq += 1;
  return { seq: nextSeq, projectDir: "/dogfood", generatedAtMs: nextSeq, files, ...extra };
}

const TASK = `---
id: T-701
title: Survivor task
status: building
---
## Acceptance criteria
- x
`;

const ROADMAP = `# Roadmap

## Backbone
1. **F-01 — Thing** — prose
`;

const BASE_FILES = [
  { path: "docs/ROADMAP.md", content: ROADMAP },
  { path: "docs/tasks/T-701-survivor.md", content: TASK },
];

function mountAndApply(p: DocsSnapshotPayload): void {
  act(() => {
    root.render(<App />);
  });
  const harness = window.__nputerDocsHarness;
  expect(harness).toBeDefined();
  act(() => {
    harness?.apply(p);
  });
}

function apply(p: DocsSnapshotPayload): void {
  act(() => {
    window.__nputerDocsHarness?.apply(p);
  });
}

const q = (selector: string): HTMLElement | null =>
  container.querySelector<HTMLElement>(selector);

describe("skipped files in the chip family (T-018 criterion 2)", () => {
  it("a skipped record keeps its card and gains chip + details line — never a phantom deletion", () => {
    mountAndApply(payload(BASE_FILES));
    // Clean board: no chips, no note.
    expect(q("[data-testid=skipped-files-badge]")).toBeNull();
    expect(q("[data-testid=parse-error-badge]")).toBeNull();
    expect(q("[data-testid=docs-truncation-note]")).toBeNull();
    expect(container.textContent).toContain("Survivor task");

    // The task file crosses a collector line: absent from files,
    // present in the skip report.
    apply(
      payload([BASE_FILES[0]!], {
        skipped: [{ path: "docs/tasks/T-701-survivor.md", reason: "oversize" }],
      }),
    );

    const main = q("[data-testid=docs-model]")!;
    expect(main.getAttribute("data-skipped-count")).toBe("1");
    // The record still renders — last valid state, not a deletion.
    expect(container.textContent).toContain("Survivor task");
    // The chip: same family as the parse-error badge, its own truth.
    const badge = q("[data-testid=skipped-files-badge]")!;
    expect(badge.textContent).toContain("1 skipped file");
    expect(badge.textContent).toContain("last valid state");
    expect(badge.getAttribute("title")).toContain(
      "docs/tasks/T-701-survivor.md: skipped — over 1 MiB",
    );
    // The details strip lists it with the reason phrase.
    const details = q("[data-testid=parse-error-details]")!;
    expect(details.textContent).toContain(
      "docs/tasks/T-701-survivor.md: skipped — over 1 MiB (showing last valid state)",
    );
    // No parse-error chip: a skip is not a parse failure.
    expect(q("[data-testid=parse-error-badge]")).toBeNull();
  });

  it("recovery clears the chip and the strip", () => {
    mountAndApply(payload(BASE_FILES));
    apply(
      payload([BASE_FILES[0]!], {
        skipped: [{ path: "docs/tasks/T-701-survivor.md", reason: "nonUtf8" }],
      }),
    );
    expect(q("[data-testid=skipped-files-badge]")).not.toBeNull();
    apply(payload(BASE_FILES));
    expect(q("[data-testid=skipped-files-badge]")).toBeNull();
    expect(q("[data-testid=parse-error-details]")).toBeNull();
    expect(container.textContent).toContain("Survivor task");
  });

  it("a never-good skip is surfaced without inventing a record", () => {
    mountAndApply(
      payload(BASE_FILES, {
        skipped: [{ path: "docs/tasks/T-702-huge.md", reason: "oversize" }],
      }),
    );
    const badge = q("[data-testid=skipped-files-badge]")!;
    expect(badge.textContent).toContain("1 skipped file");
    // No last-good to show, so the suffix stays off the chip.
    expect(badge.textContent).not.toContain("last valid state");
    // The details strip names the path; the BOARD invents no record.
    expect(q("[data-testid=docs-model]")!.getAttribute("data-task-count")).toBe("1");
    expect(q("[data-testid=parse-error-details]")!.textContent).toContain(
      "docs/tasks/T-702-huge.md: skipped — over 1 MiB",
    );
  });
});

describe("the quiet truncation note (T-018 criterion 3)", () => {
  it("renders in the chip strip when the cap clipped the snapshot, and only then", () => {
    mountAndApply(payload(BASE_FILES, { truncated: true, skippedTotal: 12 }));
    const note = q("[data-testid=docs-truncation-note]")!;
    expect(note.textContent).toBe(`docs truncated · showing first ${BASE_FILES.length} files`);
    // Quiet: muted note in the header strip, not a chip.
    expect(note.className).toContain("text-muted-foreground");
    expect(note.closest("[data-panel-exempt]")).not.toBeNull();
    expect(q("[data-testid=docs-model]")!.getAttribute("data-truncated")).toBe("true");

    apply(payload(BASE_FILES));
    expect(q("[data-testid=docs-truncation-note]")).toBeNull();
    expect(q("[data-testid=docs-model]")!.getAttribute("data-truncated")).toBe("false");
  });
});
