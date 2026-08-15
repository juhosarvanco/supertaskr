import { describe, expect, it } from "vitest";
import {
  applySnapshot,
  emptyState,
  skipReasonPhrase,
  type DocsFilePayload,
  type DocsModelState,
  type DocsSnapshotPayload,
  type SkippedFilePayload,
} from "../src/lib/docs-model";

// Pure-reducer tests for the watcher store (T-003). These pin the
// acceptance-criteria logic that cannot be probed from outside the app
// deterministically: last-good retention + badge state (criterion 3) and
// stale/duplicate-payload rejection (frontend half of criterion 2).

const task = (id: string, title: string, status = "building"): string =>
  `---\nid: ${id}\ntitle: ${title}\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: S\nstatus: ${status}\n---\n`;
const ROADMAP = "# R\n\n## Backbone\n- F-01: One — thing\n";
const BROKEN_TASK = "---\nid: T-901\ntitle: Broken\nstatus: [unclosed\n"; // never-closed flow seq -> yaml/frontmatter failure

const payload = (seq: number, files: DocsFilePayload[]): DocsSnapshotPayload => ({
  seq,
  projectDir: "/scratch/project",
  generatedAtMs: 1_700_000_000_000 + seq,
  files,
});

const baseFiles = (): DocsFilePayload[] => [
  { path: "docs/ROADMAP.md", content: ROADMAP },
  { path: "docs/tasks/T-901-alpha.md", content: task("T-901", "Alpha") },
  { path: "docs/tasks/T-902-beta.md", content: task("T-902", "Beta") },
];

const apply = (prev: DocsModelState, seq: number, files: DocsFilePayload[]): DocsModelState =>
  applySnapshot(prev, payload(seq, files));

describe("applySnapshot — basic live reload", () => {
  it("populates the model from the first snapshot", () => {
    const state = apply(emptyState(), 1, baseFiles());
    expect(state.seq).toBe(1);
    expect(state.projectDir).toBe("/scratch/project");
    expect(state.model.tasks.map((t) => t.id)).toEqual(["T-901", "T-902"]);
    expect(state.model.features.map((f) => f.id)).toEqual(["F-01"]);
    expect(state.model.issues).toEqual([]);
    expect(state.failures).toEqual([]);
  });

  it("reflects content changes in the updated model", () => {
    const s1 = apply(emptyState(), 1, baseFiles());
    const files = baseFiles();
    files[1] = { path: "docs/tasks/T-901-alpha.md", content: task("T-901", "Alpha renamed", "verifying") };
    const s2 = apply(s1, 2, files);
    const alpha = s2.model.tasks.find((t) => t.id === "T-901");
    expect(alpha?.title).toBe("Alpha renamed");
    expect(alpha?.status).toBe("verifying");
  });

  it("removes records when their file disappears (deletion is not a failure)", () => {
    const s1 = apply(emptyState(), 1, baseFiles());
    const s2 = apply(s1, 2, baseFiles().slice(0, 2)); // T-902 deleted
    expect(s2.model.tasks.map((t) => t.id)).toEqual(["T-901"]);
    expect(s2.failures).toEqual([]);
    expect(s2.lastGood.has("docs/tasks/T-902-beta.md")).toBe(false);
  });

  it("ignores non-model files without failing them", () => {
    const s1 = apply(emptyState(), 1, [
      ...baseFiles(),
      { path: "docs/STATE.md", content: "# State" },
      { path: "docs/decisions/001-x.md", content: "# ADR" },
    ]);
    expect(s1.model.tasks).toHaveLength(2);
    expect(s1.failures).toEqual([]);
    expect(s1.lastGood.has("docs/STATE.md")).toBe(false);
  });
});

describe("applySnapshot — stale/duplicate rejection (criterion 2, frontend half)", () => {
  it("returns the identical state object for a duplicate seq", () => {
    const s1 = apply(emptyState(), 1, baseFiles());
    const dup = apply(s1, 1, baseFiles());
    expect(dup).toBe(s1); // identity, so the store skips render + echo
  });

  it("returns the identical state object for an out-of-order older seq", () => {
    const s1 = apply(emptyState(), 1, baseFiles());
    const s2 = apply(s1, 3, baseFiles());
    const stale = apply(s2, 2, []);
    expect(stale).toBe(s2);
  });
});

describe("applySnapshot — parse failures keep last valid state (criterion 3)", () => {
  it("keeps the last good record and flags the failing file", () => {
    const s1 = apply(emptyState(), 1, baseFiles());
    const files = baseFiles();
    files[1] = { path: "docs/tasks/T-901-alpha.md", content: BROKEN_TASK };
    const s2 = apply(s1, 2, files);

    // Model unchanged for that file: last valid state still rendered.
    const alpha = s2.model.tasks.find((t) => t.id === "T-901");
    expect(alpha?.title).toBe("Alpha");
    expect(s2.model.tasks).toHaveLength(2);
    // No issues leak into the model from the broken content.
    expect(s2.model.issues).toEqual([]);
    // The failure is surfaced for the badge, with the real issues attached.
    expect(s2.failures).toHaveLength(1);
    expect(s2.failures[0]).toMatchObject({
      path: "docs/tasks/T-901-alpha.md",
      showingLastGood: true,
    });
    expect(s2.failures[0]?.issues.length).toBeGreaterThan(0);
  });

  it("clears the failure and applies the new content once the file is fixed", () => {
    const s1 = apply(emptyState(), 1, baseFiles());
    const broken = baseFiles();
    broken[1] = { path: "docs/tasks/T-901-alpha.md", content: BROKEN_TASK };
    const s2 = apply(s1, 2, broken);
    const fixed = baseFiles();
    fixed[1] = { path: "docs/tasks/T-901-alpha.md", content: task("T-901", "Alpha fixed") };
    const s3 = apply(s2, 3, fixed);

    expect(s3.failures).toEqual([]);
    expect(s3.model.tasks.find((t) => t.id === "T-901")?.title).toBe("Alpha fixed");
  });

  it("a file that never parsed cleanly is flagged without a stand-in record", () => {
    const files = [...baseFiles(), { path: "docs/tasks/T-903-new.md", content: BROKEN_TASK }];
    const s1 = apply(emptyState(), 1, files);

    expect(s1.model.tasks.map((t) => t.id)).toEqual(["T-901", "T-902"]);
    expect(s1.failures).toHaveLength(1);
    expect(s1.failures[0]).toMatchObject({
      path: "docs/tasks/T-903-new.md",
      showingLastGood: false,
    });
    // Its issues DO surface in the model (nothing valid to show instead).
    expect(s1.model.issues.length).toBeGreaterThan(0);
  });

  it("soft issues on a parsable record are not failures — flagging, not hiding", () => {
    const files = baseFiles();
    // Missing size: record still returned, issue attached, no badge.
    files[1] = {
      path: "docs/tasks/T-901-alpha.md",
      content: "---\nid: T-901\ntitle: Alpha\nfeature: F-01\nmilestone: 1\npriority: 1\nstatus: building\n---\n",
    };
    const s1 = apply(emptyState(), 1, files);
    expect(s1.model.tasks.map((t) => t.id)).toEqual(["T-901", "T-902"]);
    expect(s1.model.issues.some((i) => i.kind === "missing-field")).toBe(true);
    expect(s1.failures).toEqual([]);
  });

  it("a broken roadmap keeps the last good backbone and is flagged", () => {
    const s1 = apply(emptyState(), 1, baseFiles());
    const files = baseFiles();
    files[0] = { path: "docs/ROADMAP.md", content: "# R\n\nno backbone heading here\n" };
    const s2 = apply(s1, 2, files);

    expect(s2.model.features.map((f) => f.id)).toEqual(["F-01"]); // last good kept
    expect(s2.failures).toHaveLength(1);
    expect(s2.failures[0]).toMatchObject({ path: "docs/ROADMAP.md", showingLastGood: true });
  });

  it("a deleted-then-recreated-broken file has no last good to fall back on", () => {
    const s1 = apply(emptyState(), 1, baseFiles());
    const s2 = apply(s1, 2, baseFiles().slice(0, 2)); // T-902 deleted -> memory dropped
    const files = [...baseFiles().slice(0, 2), { path: "docs/tasks/T-902-beta.md", content: BROKEN_TASK }];
    const s3 = apply(s2, 3, files);

    expect(s3.model.tasks.map((t) => t.id)).toEqual(["T-901"]);
    expect(s3.failures[0]).toMatchObject({
      path: "docs/tasks/T-902-beta.md",
      showingLastGood: false,
    });
  });
});

describe("applySnapshot — hostile inputs (ADR-009)", () => {
  it("__proto__/constructor path names stay inert map keys", () => {
    const files = [
      ...baseFiles(),
      { path: "docs/tasks/T-903-__proto__.md", content: task("T-903", "Proto") },
      { path: "__proto__", content: "x" },
      { path: "constructor", content: "y" },
    ];
    const s1 = apply(emptyState(), 1, files);
    expect(s1.model.tasks.map((t) => t.id)).toEqual(["T-901", "T-902", "T-903"]);
    expect(Object.prototype).not.toHaveProperty("polluted");
    expect(({} as Record<string, unknown>)["x"]).toBeUndefined();
  });
});

// ---- T-018: collector skips must not read as deletions ------------------

const applyWith = (
  prev: DocsModelState,
  seq: number,
  files: DocsFilePayload[],
  extra: Partial<DocsSnapshotPayload>,
): DocsModelState => applySnapshot(prev, { ...payload(seq, files), ...extra });

describe("applySnapshot — collector skips (T-018)", () => {
  it("a skipped model input keeps its last good record on the board", () => {
    const s1 = apply(emptyState(), 1, baseFiles());
    // T-901 crosses the 1 MiB line: the file leaves `files`, the skip
    // report says why — the record must NOT vanish like a deletion.
    const s2 = applyWith(s1, 2, baseFiles().slice(0, 1).concat(baseFiles()[2]!), {
      skipped: [{ path: "docs/tasks/T-901-alpha.md", reason: "oversize" }],
    });
    expect(s2.model.tasks.map((t) => t.id)).toEqual(["T-901", "T-902"]);
    expect(s2.model.tasks.find((t) => t.id === "T-901")?.title).toBe("Alpha");
    expect(s2.skipped).toEqual([
      { path: "docs/tasks/T-901-alpha.md", reason: "oversize", showingLastGood: true },
    ]);
    expect(s2.lastGood.has("docs/tasks/T-901-alpha.md")).toBe(true);
    // Not a parse failure — the chip family renders skips separately.
    expect(s2.failures).toEqual([]);
  });

  it("a genuinely deleted file still deletes (skip vs deletion contrast)", () => {
    const s1 = apply(emptyState(), 1, baseFiles());
    const s2 = apply(s1, 2, baseFiles().slice(0, 2)); // gone AND not skipped
    expect(s2.model.tasks.map((t) => t.id)).toEqual(["T-901"]);
    expect(s2.skipped).toEqual([]);
  });

  it("recovery: the file returning readable clears the skip and re-renders fresh content", () => {
    const s1 = apply(emptyState(), 1, baseFiles());
    const s2 = applyWith(s1, 2, baseFiles().slice(0, 2), {
      skipped: [{ path: "docs/tasks/T-902-beta.md", reason: "nonUtf8" }],
    });
    expect(s2.model.tasks.map((t) => t.id)).toEqual(["T-901", "T-902"]);
    const fixed = baseFiles();
    fixed[2] = { path: "docs/tasks/T-902-beta.md", content: task("T-902", "Beta fixed") };
    const s3 = apply(s2, 3, fixed);
    expect(s3.skipped).toEqual([]);
    expect(s3.model.tasks.find((t) => t.id === "T-902")?.title).toBe("Beta fixed");
  });

  it("a never-good skipped path is surfaced without a stand-in record", () => {
    const s1 = applyWith(emptyState(), 1, baseFiles(), {
      skipped: [{ path: "docs/tasks/T-904-huge.md", reason: "oversize" }],
    });
    expect(s1.model.tasks.map((t) => t.id)).toEqual(["T-901", "T-902"]);
    expect(s1.skipped).toEqual([
      { path: "docs/tasks/T-904-huge.md", reason: "oversize", showingLastGood: false },
    ]);
  });

  it("a skipped non-model file is surfaced but never enters the model machinery", () => {
    const s1 = applyWith(emptyState(), 1, baseFiles(), {
      skipped: [{ path: "docs/design/huge-mock.md", reason: "oversize" }],
    });
    expect(s1.skipped[0]).toEqual({
      path: "docs/design/huge-mock.md",
      reason: "oversize",
      showingLastGood: false,
    });
    expect(s1.lastGood.has("docs/design/huge-mock.md")).toBe(false);
  });

  it("a skipped graph gets no last-good fallback (T-012 §4) but is surfaced", () => {
    const withGraph = [
      ...baseFiles(),
      { path: "docs/architecture/graph.json", content: '{"schema":1}' },
    ];
    const s1 = apply(emptyState(), 1, withGraph);
    expect(s1.graphContent).toBe('{"schema":1}');
    const s2 = applyWith(s1, 2, baseFiles(), {
      skipped: [{ path: "docs/architecture/graph.json", reason: "oversize" }],
    });
    // Honest degradation: the map falls to its graph-absent state...
    expect(s2.graphContent).toBeUndefined();
    // ...and the chip family says why.
    expect(s2.skipped).toEqual([
      { path: "docs/architecture/graph.json", reason: "oversize", showingLastGood: false },
    ]);
  });

  it("truncation flag, honest total, and file count land in state", () => {
    const s1 = applyWith(emptyState(), 1, baseFiles(), {
      skipped: [{ path: "docs/tasks/T-999-tail.md", reason: "fileCap" }],
      skippedTotal: 41,
      truncated: true,
    });
    expect(s1.truncated).toBe(true);
    expect(s1.skippedTotal).toBe(41); // clipped list, honest count
    expect(s1.skipped).toHaveLength(1);
    expect(s1.fileCount).toBe(baseFiles().length);
  });

  it("pre-T-018 payloads (no skip fields) behave exactly as before", () => {
    const s1 = apply(emptyState(), 1, baseFiles());
    expect(s1.skipped).toEqual([]);
    expect(s1.skippedTotal).toBe(0);
    expect(s1.truncated).toBe(false);
    expect(s1.fileCount).toBe(3);
  });

  it("hostile skip paths stay inert map keys (ADR-009)", () => {
    const hostile: SkippedFilePayload[] = [
      { path: "__proto__", reason: "oversize" },
      { path: "constructor", reason: "nonUtf8" },
    ];
    const s1 = applyWith(emptyState(), 1, baseFiles(), { skipped: hostile });
    expect(s1.skipped).toHaveLength(2);
    expect(Object.prototype).not.toHaveProperty("polluted");
  });
});

describe("skipReasonPhrase", () => {
  it("maps every reason to plain words and falls back to the raw value", () => {
    expect(skipReasonPhrase("oversize")).toBe("over 1 MiB");
    expect(skipReasonPhrase("nonUtf8")).toBe("not UTF-8");
    expect(skipReasonPhrase("tooDeep")).toBe("nested too deep");
    expect(skipReasonPhrase("fileCap")).toBe("over the file cap");
    expect(skipReasonPhrase("unreadable")).toBe("unreadable");
    // A newer Rust side's unknown reason degrades honestly, not to "".
    expect(skipReasonPhrase("quantumFoam")).toBe("quantumFoam");
  });
});
