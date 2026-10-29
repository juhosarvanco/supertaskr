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

// T-077 MADE THIS FIXTURE MEAN WHAT IT SAYS, and every assertion below
// is unchanged — the fixture was the thing that was wrong. These two
// files were meant to be "a clean board" and were not. The backbone
// bullet was a NUMBERED line, which the documented `- F-NN:` shape does
// not match, so the roadmap parsed ZERO features and legally reported
// nothing (an empty backbone is a valid state, not a failure); and
// `status: building` requires the four placement fields, so the task
// parsed into a RECORD carrying four `missing-field` issues. The board
// read `0 features · 4 issues` throughout this file while "recovery
// clears the chip and the strip" asserted an EMPTY strip — true only
// because a counted issue had nowhere to appear, which is exactly the
// hole T-077 closes. The bullet is now the shape the parser documents
// and the task carries its placement, so the clean state below is clean
// BY PARSE rather than by blindness.
const TASK = `---
id: T-701
title: Survivor task
feature: F-01
milestone: 1
priority: 1
size: S
status: building
touches: [app-shell]
---
## Acceptance criteria
- x
`;

const ROADMAP = `# Roadmap

## Backbone
- F-01: Thing — prose
`;

const BASE_FILES = [
  { path: "docs/ROADMAP.md", content: ROADMAP },
  { path: "docs/tasks/T-701-survivor.md", content: TASK },
];

function mountAndApply(p: DocsSnapshotPayload): void {
  act(() => {
    root.render(<App />);
  });
  const harness = window.__supertaskrDocsHarness;
  expect(harness).toBeDefined();
  act(() => {
    harness?.apply(p);
  });
}

function apply(p: DocsSnapshotPayload): void {
  act(() => {
    window.__supertaskrDocsHarness?.apply(p);
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

  it("a clipped skip report still counts honestly on the chip", () => {
    // Rust caps the reported LIST; skippedTotal stays the true count.
    mountAndApply(
      payload(BASE_FILES, {
        skipped: [
          { path: "docs/notes/big-1.md", reason: "fileCap" },
          { path: "docs/notes/big-2.md", reason: "fileCap" },
        ],
        skippedTotal: 41,
        truncated: true,
      }),
    );
    const badge = q("[data-testid=skipped-files-badge]")!;
    expect(badge.textContent).toContain("41 skipped files");
    expect(badge.getAttribute("title")).toContain("…and 39 more");
  });
});

describe("the quiet truncation note (T-018 criterion 3)", () => {
  it("renders in the chip strip when the cap clipped the snapshot, and only then", () => {
    mountAndApply(payload(BASE_FILES, { truncated: true }));
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

describe("selected private records disclosure and status admission", () => {
  it("shows the private home, rejects foreign snapshot-less statuses, and retains honest unavailable provenance", () => {
    const first = payload(BASE_FILES, { projectDir: "/selected-product" });
    first.records = {
      selectionSequence: first.seq, contextSequence: first.seq, layout: "split",
      recordsDir: "/private/selected-records", associationId: "selected-project",
      rootIncarnation: "1:1", docsIncarnation: "1:2", availability: "available",
      finding: null, contentRevision: `working-tree-observation:${first.seq}`,
    };
    mountAndApply(first);
    expect(container.querySelector('[data-testid="records-home"]')?.textContent).toContain("/private/selected-records");
    const original = window.__supertaskrDocsHarness?.getState();
    act(() => {
      window.__supertaskrShellHarness?.applyProjectStatus({
        kind: "noProject",
        scope: { seq: 999999, projectDir: null, selectionSequence: 0, contextSequence: 0 },
      });
      window.__supertaskrShellHarness?.applyProjectStatus({
        kind: "noDocs", projectDir: "/foreign", probe: { roadmap: false, tasks: false, architecture: false, git: false },
        scope: { seq: 999999, projectDir: "/foreign", selectionSequence: first.seq, contextSequence: first.seq, records: first.records },
      });
    });
    expect(window.__supertaskrDocsHarness?.getState()).toBe(original);
    expect(container.querySelector('[data-testid="records-home"]')).not.toBeNull();
    const unavailable = payload([], { projectDir: first.projectDir });
    unavailable.records = { ...first.records, contextSequence: unavailable.seq, availability: "unavailable", finding: "private root is missing", contentRevision: null };
    apply(unavailable);
    expect(container.querySelector('[data-testid="records-unavailable"]')?.textContent).toContain("private root is missing");
    expect(container.querySelector('[data-testid="records-unavailable"]')?.textContent).toContain("last observed records");
    expect(window.__supertaskrDocsHarness?.getState().contentOrigin?.contextSequence).toBe(first.seq);
    expect(window.__supertaskrDocsHarness?.getState().seq).toBe(unavailable.seq);
  });
});

describe("controller timeout response and healthy recovery", () => {
  it("discloses the failed reading in its committed context and admits healthy status and file-event successors", () => {
    const first = payload(BASE_FILES, { projectDir: "/controller-timeout-product" });
    first.records = {
      selectionSequence: first.seq, contextSequence: first.seq, layout: "split",
      recordsDir: "/private/controller-timeout-records", associationId: "controller-timeout",
      rootIncarnation: "2:1", docsIncarnation: "2:2", availability: "available",
      finding: null, contentRevision: `working-tree-observation:${first.seq}`,
    };
    mountAndApply(first);
    const failed = payload([], { projectDir: first.projectDir });
    failed.records = { ...first.records, availability: "unavailable", finding: "watcher observation unavailable", contentRevision: null };
    const status = (snapshot: DocsSnapshotPayload) => ({
      kind: "open" as const, snapshot,
      scope: {
        seq: snapshot.seq, projectDir: snapshot.projectDir,
        selectionSequence: snapshot.records!.selectionSequence, contextSequence: snapshot.records!.contextSequence,
        records: snapshot.records,
      },
    });
    act(() => window.__supertaskrShellHarness?.applyProjectStatus(status(failed)));
    expect(q('[data-testid="records-unavailable"]')?.textContent).toContain("watcher observation unavailable");
    expect(window.__supertaskrDocsHarness?.getState().seq).toBe(failed.seq);
    expect(window.__supertaskrDocsHarness?.getState().records?.selectionSequence).toBe(first.records.selectionSequence);
    const healthy = payload(BASE_FILES, { projectDir: first.projectDir });
    healthy.records = { ...first.records, contentRevision: `working-tree-observation:${healthy.seq}` };
    act(() => window.__supertaskrShellHarness?.applyProjectStatus(status(healthy)));
    expect(q('[data-testid="records-unavailable"]')).toBeNull();
    expect(window.__supertaskrDocsHarness?.getState().seq).toBe(healthy.seq);
    const changed = payload(BASE_FILES.map(file => ({ ...file, content: file.content.replace("Survivor task", "After controller recovery") })), { projectDir: first.projectDir });
    changed.records = { ...first.records, contentRevision: `working-tree-observation:${changed.seq}` };
    apply(changed);
    expect(window.__supertaskrDocsHarness?.getState().seq).toBe(changed.seq);
    expect(container.textContent).toContain("After controller recovery");
  });
});
