// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "../src/App";
import type { DocsSnapshotPayload } from "../src/lib/docs-model";

// T-077 (absorbing T-053-s1): A COUNT THAT CANNOT BE EXPANDED.
//
// The status line renders `model.issues.length`; the details strip
// iterated `failures` and `skipped` and nothing else. So every issue
// that withholds no record — the cross-file kinds, every
// `dangling-reference`, every soft issue on a record that still parsed
// — was counted and explained NOWHERE, and the strip did not even
// render. The human read `2 issues` over blank space.
//
// THE PIN HAS TO BE ABOUT THE STRIP, NOT THE COUNT. The count was
// already right before this task: a body asserting `2 issues` passes
// with the hole wide open, which is exactly how the defect survived
// T-053, whose own notes recorded "the app surfaces the new issues
// through the existing count" as a verified premise. Every body below
// asserts against the STRIP, and the first one asserts that the strip
// exists at all on a snapshot where `failures` and `skipped` are both
// empty — the state in which the old render condition is false.
//
// Driven through the real store via the dev harness at DOM level (the
// T-001/T-012/T-018 precedent: App mounts, the harness applies a
// payload, the DOM answers). No hand-built issue objects anywhere in
// this file — the shipped parser owns every message and every kind.

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
// watermark; each payload uses a fresh higher seq. The 7700 base keeps
// clear of other suites' ranges (vitest isolates files, so this is belt
// to suspenders).
let nextSeq = 7700;

function payload(files: { path: string; content: string }[]): DocsSnapshotPayload {
  nextSeq += 1;
  return { seq: nextSeq, projectDir: "/dogfood", generatedAtMs: nextSeq, files };
}

/** A task file that parses with ZERO issues of its own: a `planned`
 * status requires the four placement fields, and `feature` must name a
 * declared backbone id or it dangles. Any residue here would be an
 * issue the fixture did not intend, and these bodies count issues. */
function task(id: string, feature: string, extra = ""): string {
  return `---
id: ${id}
title: Task ${id}
feature: ${feature}
milestone: 1
priority: 1
size: S
status: planned
touches: [app-shell]
${extra}---
## Acceptance criteria
- x
`;
}

/** T-053's own reproduction: one backbone slot spelled two ways, and one
 * task slot spelled two ways. Every file parses; only the SETS are
 * wrong, which is what makes this the fixture criterion 4 asks for. */
const ALIASING_BACKBONE = `# Roadmap

## Backbone
- F-1: One — a
- F-01: One padded — b
`;
const ALIASED_TASKS = [
  { path: "docs/tasks/T-01-a.md", content: task("T-01", "F-1") },
  { path: "docs/tasks/T-001-b.md", content: task("T-001", "F-1", "blocked_by: [T-01]\n") },
];
const CROSS_FILE_ONLY = [
  { path: "docs/ROADMAP.md", content: ALIASING_BACKBONE },
  ...ALIASED_TASKS,
];

const HEALTHY_ROADMAP = `# Roadmap

## Backbone
- F-01: One — a
`;

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

const q = (selector: string): HTMLElement | null =>
  container.querySelector<HTMLElement>(selector);

const strip = (): HTMLElement | null => q("[data-testid=parse-error-details]");
const rows = (): HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>("[data-testid=model-issue-row]"),
];
const countsLine = (): string => q("[data-testid=model-counts]")?.textContent ?? "";
const attr = (name: string): string | null =>
  q("[data-testid=docs-model]")?.getAttribute(name) ?? null;

describe("a cross-file issue can be READ, not just counted (T-077 criterion 4)", () => {
  it("a snapshot whose ONLY problem is cross-file still fills the strip", () => {
    mountAndApply(payload(CROSS_FILE_ONLY));

    // THE PRECONDITION IS HALF THE PIN. Both files parse, so nothing is
    // withheld and nothing was skipped: the strip's pre-T-077 render
    // condition (`failures.length > 0 || skipped.length > 0`) is FALSE
    // here, and the old build showed the human no strip at all.
    expect(attr("data-failure-count"), "no record is withheld").toBe("0");
    expect(attr("data-skipped-count"), "nothing was skipped").toBe("0");
    expect(q("[data-testid=parse-error-badge]"), "and no parse-error chip").toBeNull();

    // The count says two. That much was already true before this task,
    // which is precisely why it cannot be the assertion.
    expect(countsLine()).toContain("2 issues");

    // THE ASSERTION: the count can be EXPANDED. A strip that is absent,
    // or present with no rows in it, reds here.
    const list = strip();
    expect(list, "the details strip renders on a cross-file-only snapshot").not.toBeNull();
    expect(rows().length, "one row per counted issue").toBe(2);
    expect(list!.querySelectorAll("li").length, "and nothing else is in the strip").toBe(2);

    // And the rows carry the parser's own sentences, not a summary.
    const text = list!.textContent ?? "";
    expect(text).toContain("zero-padding aliases one backbone slot");
    expect(text).toContain("zero-padding aliases one task slot");
  });
});

describe("each row names the files and the space (T-077 criterion 2)", () => {
  it("reads `space` where the kind carries it and says nothing where it does not", () => {
    mountAndApply(
      payload([
        { path: "docs/ROADMAP.md", content: ALIASING_BACKBONE },
        ...ALIASED_TASKS,
        // A dangling `blocked_by` — an issue with a `file` and NO
        // `space` field. The row must degrade to naming no space at
        // all rather than inferring one from the kind.
        { path: "docs/tasks/T-050-dangler.md", content: task("T-050", "F-1", "blocked_by: [T-404]\n") },
      ]),
    );

    const byKindAndSpace = (kind: string, space: string | null): HTMLElement => {
      const found = rows().filter(
        (row) =>
          row.getAttribute("data-issue-kind") === kind &&
          row.getAttribute("data-issue-space") === space,
      );
      expect(found.length, `exactly one ${space ?? "space-less"} ${kind} row`).toBe(1);
      return found[0]!;
    };

    // THE FEATURE SPACE. Both declarations live in ROADMAP.md, so the
    // issue's `files` is that one path twice by contract; the row names
    // it once.
    const feature = byKindAndSpace("aliased-id", "feature");
    expect(feature.textContent).toContain("feature aliased-id");
    expect(feature.textContent).toContain("docs/ROADMAP.md");

    // THE TASK SPACE — two genuinely different files, and the row names
    // BOTH. A row that named only the first would leave the human
    // hunting for the other half of a pair.
    const taskRow = byKindAndSpace("aliased-id", "task");
    expect(taskRow.textContent).toContain("task aliased-id");
    expect(taskRow.textContent).toContain("docs/tasks/T-001-b.md");
    expect(taskRow.textContent).toContain("docs/tasks/T-01-a.md");

    // THE DEGRADATION, ASSERTED AS AN ABSENCE. `dangling-reference`
    // carries no `space` field today; the field is read where it EXISTS
    // rather than switched on by kind, so this row simply says nothing
    // about space — and the attribute is absent, not the empty string.
    const dangling = byKindAndSpace("dangling-reference", null);
    expect(dangling.hasAttribute("data-issue-space")).toBe(false);
    expect(dangling.textContent).not.toContain("undefined");
    expect(dangling.textContent).toContain("dangling-reference");
    expect(dangling.textContent).toContain("docs/tasks/T-050-dangler.md");
    expect(dangling.textContent).toContain("T-404");
  });
});

describe("the strip does not say the same thing twice (T-077 criterion 1)", () => {
  it("a file that never parsed is reported once — as a failure, not also as an issue", () => {
    mountAndApply(
      payload([
        { path: "docs/ROADMAP.md", content: HEALTHY_ROADMAP },
        { path: "docs/tasks/T-002-broken.md", content: "# no frontmatter" },
      ]),
    );

    // The failing file has no last good parse, so its issues ride the
    // model too — the count and `failures` are about the SAME problem.
    expect(attr("data-failure-count")).toBe("1");
    expect(countsLine()).toContain("1 issues");
    expect(rows().length, "the failure row already explains that file").toBe(0);
    expect(strip()!.querySelectorAll("li").length, "one row, not two").toBe(1);
    expect(strip()!.textContent).toContain(
      "docs/tasks/T-002-broken.md: no frontmatter — file must start with a '---' YAML block",
    );
  });

  it("a roadmap that yields no features is reported once too", () => {
    mountAndApply(
      payload([
        { path: "docs/ROADMAP.md", content: "# Roadmap\n\nnothing here\n" },
        { path: "docs/tasks/T-003-fine.md", content: task("T-003", "F-01") },
      ]),
    );

    expect(attr("data-failure-count")).toBe("1");
    expect(rows().length).toBe(0);
    expect(strip()!.querySelectorAll("li").length).toBe(1);
    expect(strip()!.textContent).toContain("no '## Backbone' section found");
  });

  it("but a healthy file's issue survives a broken file in the same snapshot", () => {
    mountAndApply(
      payload([...CROSS_FILE_ONLY, { path: "docs/tasks/T-002-broken.md", content: "# no frontmatter" }]),
    );

    // OVER-DROPPING IS THE OTHER FAILURE MODE, and it is the one a
    // rule keyed on "any failure exists" would produce. Three counted
    // problems, three rows: one failure row plus the two aliases, whose
    // files are all healthy.
    expect(attr("data-failure-count")).toBe("1");
    expect(countsLine()).toContain("3 issues");
    expect(rows().length).toBe(2);
    expect(strip()!.querySelectorAll("li").length).toBe(3);
  });
});

describe("the new rows wear the strip's containment (T-077 criterion 5)", () => {
  it("a path that looks like markup renders as text, in the strip's own row idiom", () => {
    // The id space is `T-\d+`, but a FILENAME is free-form beyond the
    // `T-` prefix, and the parser's message quotes the path it was
    // handed. This is file-derived text arriving from disk, exactly
    // like every other sentence in this strip.
    const hostile = "docs/tasks/T-01-<img src=x onerror=boom>.md";
    mountAndApply(
      payload([
        { path: "docs/ROADMAP.md", content: HEALTHY_ROADMAP },
        { path: hostile, content: task("T-01", "F-01") },
        { path: "docs/tasks/T-001-b.md", content: task("T-001", "F-01") },
      ]),
    );

    const row = rows()[0]!;
    expect(rows().length).toBe(1);
    expect(row.querySelector("img"), "no markup is parsed out of a path").toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(row.textContent, "the path is named verbatim, as text").toContain(hostile);
    // Same row idiom as the failure and skip rows beside it.
    expect(row.tagName).toBe("LI");
    expect(row.className).toBe("font-mono text-status-rejected-foreground");
    expect(row.parentElement).toBe(strip());
  });
});
