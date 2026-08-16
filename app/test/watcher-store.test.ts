import { describe, expect, it } from "vitest";
import {
  CONVENTION_HINT,
  EMPTY_PROBE,
  planChecklist,
  reduceDocs,
  reducePickOutcome,
  resetDocsForProjectSwitch,
  selectScreen,
  type PlanProbePayload,
  type ShellState,
} from "../src/lib/watcher-store";
import {
  applySnapshot,
  emptyState,
  type DocsFilePayload,
  type DocsModelState,
  type DocsSnapshotPayload,
} from "../src/lib/docs-model";

// T-007 store-layer tests: the project-switch reset (a new project's
// files must never fall back to a previous project's last-good content;
// late events from the old project must drop as stale) and the screen
// selection behind the friendly empty state.

const task = (id: string, title: string): string =>
  `---\nid: ${id}\ntitle: ${title}\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: S\nstatus: building\n---\n`;
const ROADMAP_A = "# A\n\n## Backbone\n- F-01: Alpha — thing\n";
const ROADMAP_B = "# B\n\n## Backbone\n- F-01: Bravo — other thing\n";
const BROKEN_ROADMAP = "# B\n\nno backbone heading here\n- F-01: not a backbone\n";

const payload = (
  seq: number,
  projectDir: string,
  files: DocsFilePayload[],
): DocsSnapshotPayload => ({
  seq,
  projectDir,
  generatedAtMs: 1_700_000_000_000 + seq,
  files,
});

const projectAFiles = (): DocsFilePayload[] => [
  { path: "docs/ROADMAP.md", content: ROADMAP_A },
  { path: "docs/tasks/T-901-alpha.md", content: task("T-901", "Alpha task") },
];

const openProjectA = (): DocsModelState =>
  reduceDocs(emptyState(), payload(1, "/projects/a", projectAFiles()));

describe("resetDocsForProjectSwitch", () => {
  it("clears model, last-good contents, and failures but keeps the seq watermark", () => {
    const a = openProjectA();
    expect(a.model.tasks.length).toBe(1);
    expect(a.lastGood.size).toBeGreaterThan(0);

    const reset = resetDocsForProjectSwitch(a);
    expect(reset.seq).toBe(a.seq); // watermark survives the switch
    expect(reset.model.tasks).toEqual([]);
    expect(reset.model.features).toEqual([]);
    expect(reset.lastGood.size).toBe(0);
    expect(reset.failures).toEqual([]);
    expect(reset.projectDir).toBe("");
  });

  it("clears T-018 skip/truncation state too — no cross-project ghosts", () => {
    const a = reduceDocs(emptyState(), {
      ...payload(1, "/projects/a", projectAFiles()),
      skipped: [{ path: "docs/tasks/T-901-alpha.md", reason: "oversize" }],
      skippedTotal: 5,
      truncated: true,
    });
    expect(a.skipped.length).toBe(1);
    expect(a.truncated).toBe(true);

    const reset = resetDocsForProjectSwitch(a);
    expect(reset.skipped).toEqual([]);
    expect(reset.skippedTotal).toBe(0);
    expect(reset.truncated).toBe(false);
    expect(reset.fileCount).toBe(0);
  });
});

describe("reduceDocs — same project", () => {
  it("applies payloads exactly like applySnapshot (T-003 behavior preserved)", () => {
    const s1 = reduceDocs(emptyState(), payload(1, "/projects/a", projectAFiles()));
    const direct = applySnapshot(emptyState(), payload(1, "/projects/a", projectAFiles()));
    expect(s1.model).toEqual(direct.model);
    expect(s1.seq).toBe(1);
  });

  it("keeps last-good fallback across payloads of the SAME project", () => {
    const s1 = openProjectA();
    const files = projectAFiles();
    files[0] = { path: "docs/ROADMAP.md", content: BROKEN_ROADMAP };
    const s2 = reduceDocs(s1, payload(2, "/projects/a", files));
    // Same project: the broken roadmap falls back to its last good parse.
    expect(s2.failures.map((f) => f.showingLastGood)).toEqual([true]);
    expect(s2.model.features.map((f) => f.name)).toEqual(["Alpha"]);
  });

  it("drops stale and duplicate payloads by identity", () => {
    const s1 = openProjectA();
    expect(reduceDocs(s1, payload(1, "/projects/a", []))).toBe(s1);
    expect(reduceDocs(s1, payload(0, "/projects/a", []))).toBe(s1);
  });

  it("T-018: a skipped record survives the payload it is missing from", () => {
    const s1 = openProjectA();
    const s2 = reduceDocs(s1, {
      ...payload(2, "/projects/a", projectAFiles().slice(0, 1)),
      skipped: [{ path: "docs/tasks/T-901-alpha.md", reason: "oversize" }],
    });
    // The record still renders from last-good; the skip is surfaced.
    expect(s2.model.tasks.map((t) => t.id)).toEqual(["T-901"]);
    expect(s2.skipped.map((s) => s.showingLastGood)).toEqual([true]);
  });
});

describe("reduceDocs — project switch (T-007)", () => {
  it("resets on a new projectDir: the new project starts from scratch", () => {
    const a = openProjectA();
    const bFiles: DocsFilePayload[] = [
      { path: "docs/ROADMAP.md", content: ROADMAP_B },
      { path: "docs/tasks/T-950-bravo.md", content: task("T-950", "Bravo task") },
    ];
    const b = reduceDocs(a, payload(5, "/projects/b", bFiles));
    expect(b.projectDir).toBe("/projects/b");
    expect(b.model.tasks.map((t) => t.id)).toEqual(["T-950"]);
    expect(b.model.features.map((f) => f.name)).toEqual(["Bravo"]);
    // Nothing of A survives — not even as last-good fallback material.
    expect([...b.lastGood.keys()]).toEqual(["docs/ROADMAP.md", "docs/tasks/T-950-bravo.md"]);
    expect(b.lastGood.get("docs/ROADMAP.md")).toBe(ROADMAP_B);
  });

  it("never substitutes the OLD project's content for a broken file in the NEW project", () => {
    const a = openProjectA();
    const b = reduceDocs(
      a,
      payload(5, "/projects/b", [{ path: "docs/ROADMAP.md", content: BROKEN_ROADMAP }]),
    );
    // Cross-project contamination guard: A's good roadmap must NOT render.
    expect(b.model.features).toEqual([]);
    expect(b.failures.length).toBe(1);
    expect(b.failures[0]?.showingLastGood).toBe(false);
    expect(b.model.tasks).toEqual([]); // A's task is gone too
  });

  it("drops a late event from the previous project as stale (no wipe, no render)", () => {
    const a = openProjectA();
    const b = reduceDocs(
      a,
      payload(5, "/projects/b", [{ path: "docs/ROADMAP.md", content: ROADMAP_B }]),
    );
    // A docs-changed from project A that was in flight during the switch:
    // lower seq, old projectDir. Must return the CURRENT state by
    // identity — not wipe it, not render A's content.
    const late = reduceDocs(b, payload(3, "/projects/a", projectAFiles()));
    expect(late).toBe(b);
  });

  it("applies the very first payload without a reset detour", () => {
    const s1 = reduceDocs(emptyState(), payload(1, "/projects/a", projectAFiles()));
    expect(s1.model.tasks.length).toBe(1);
  });
});

const shell = (patch: Partial<ShellState>): ShellState => ({
  phase: "loading",
  resolvedDir: null,
  resolvedProbe: null,
  genesisDir: null,
  rejectedPick: null,
  picking: false,
  // T-050 added two fields to ShellState; defaulting them here is the
  // ONLY change to this file. Every expectation below keeps its exact
  // expected value: `starting: false, startupFailure: null` is a
  // healthy startup, which is what these cases always described
  // implicitly. The new field's own behaviour is pinned separately in
  // test/startup-recovery.test.ts.
  starting: false,
  startupFailure: null,
  indexing: false,
  indexOutcome: null,
  docs: emptyState(),
  ...patch,
});

describe("selectScreen + notices (T-007 empty states, T-026 front door)", () => {
  it("maps loading and browser phases to their screens", () => {
    expect(selectScreen(shell({ phase: "loading" }))).toEqual({ screen: "loading" });
    expect(selectScreen(shell({ phase: "browser" }))).toEqual({ screen: "browser" });
  });

  it("shows the empty screen when no project resolved at launch", () => {
    const s = selectScreen(shell({ phase: "noProject" }));
    expect(s).toEqual({
      screen: "empty",
      notice: { kind: "message", message: `no project open — ${CONVENTION_HINT}` },
      canKeepCurrent: false,
    });
  });

  it("shows the no-plan card naming the launch-resolved repo that lacks docs/", () => {
    // T-026: the same card a rejected pick shows — the first-launch
    // genesis entry, with the probe's marks riding along.
    const probe: PlanProbePayload = { ...EMPTY_PROBE, git: true };
    const s = selectScreen(
      shell({ phase: "noDocs", resolvedDir: "/repos/docless", resolvedProbe: probe }),
    );
    expect(s).toEqual({
      screen: "empty",
      notice: { kind: "noPlan", path: "/repos/docless", probe },
      canKeepCurrent: false,
    });
  });

  it("shows the board when a project is open", () => {
    expect(selectScreen(shell({ phase: "open" }))).toEqual({ screen: "board" });
  });

  it("shows the genesis screen when a folder is open for an interview (T-026)", () => {
    expect(selectScreen(shell({ phase: "genesis", genesisDir: "/tmp/sketchpad" }))).toEqual({
      screen: "genesis",
    });
  });

  it("a rejected pick overlays the open board, names the path, and offers keep-current", () => {
    const s = selectScreen(
      shell({
        phase: "open",
        rejectedPick: { path: "/tmp/not-a-project", message: null, probe: EMPTY_PROBE },
      }),
    );
    expect(s).toEqual({
      screen: "empty",
      notice: { kind: "noPlan", path: "/tmp/not-a-project", probe: EMPTY_PROBE },
      canKeepCurrent: true,
    });
  });

  it("a rejected pick over a genesis project can still keep it (T-026)", () => {
    const s = selectScreen(
      shell({
        phase: "genesis",
        genesisDir: "/tmp/sketchpad",
        rejectedPick: { path: "/tmp/x", message: null, probe: EMPTY_PROBE },
      }),
    );
    expect(s.screen).toBe("empty");
    if (s.screen === "empty") expect(s.canKeepCurrent).toBe(true);
  });

  it("a rejected pick with no open project cannot offer keep-current", () => {
    const s = selectScreen(
      shell({
        phase: "noProject",
        rejectedPick: { path: "/tmp/x", message: null, probe: EMPTY_PROBE },
      }),
    );
    expect(s.screen).toBe("empty");
    if (s.screen === "empty") expect(s.canKeepCurrent).toBe(false);
  });

  it("a pick error surfaces its explanation", () => {
    const s = selectScreen(
      shell({
        phase: "open",
        rejectedPick: { path: "/gone", message: "watcher re-arm timed out", probe: null },
      }),
    );
    expect(s.screen).toBe("empty");
    if (s.screen === "empty") {
      expect(s.notice).toEqual({
        kind: "message",
        message: "could not open /gone: watcher re-arm timed out",
      });
    }
  });
});

describe("planChecklist (T-026 criterion 1: the looked-for paths, answered)", () => {
  it("lists every looked-for path, in the design's order, unfound by default", () => {
    expect(planChecklist(EMPTY_PROBE).map((r) => [r.path, r.found])).toEqual([
      ["docs/ROADMAP.md", false],
      ["docs/tasks/*.md", false],
      ["docs/ARCHITECTURE.md", false],
      [".git", false],
    ]);
    // The convention hint's other half survives the redesign as the
    // card's footnote, so docs/decisions/ is still named on this screen.
    expect(CONVENTION_HINT).toContain("docs/tasks/");
    expect(CONVENTION_HINT).toContain("docs/decisions/");
  });

  it("marks found paths from the probe, and only .git carries the design's note", () => {
    const rows = planChecklist({ roadmap: false, tasks: true, architecture: true, git: true });
    expect(rows.map((r) => r.found)).toEqual([false, true, true, true]);
    expect(rows[3]?.note).toBe("it is a repo, so the plan can live here");
    expect(rows.filter((r) => r.note !== undefined)).toHaveLength(1);
    // A .git that is NOT there claims nothing.
    expect(planChecklist(EMPTY_PROBE)[3]?.note).toBeUndefined();
  });

  it("an absent probe claims nothing found rather than inventing marks", () => {
    expect(planChecklist(null).every((r) => !r.found)).toBe(true);
  });
});

describe("reducePickOutcome (T-026: one pipeline for all three pickers)", () => {
  const open = (): ShellState =>
    shell({ phase: "open", docs: openProjectA(), resolvedDir: null });

  it("criterion 6: a cancelled dialog changes nothing, by identity", () => {
    const s = open();
    expect(reducePickOutcome(s, { kind: "cancelled" })).toBe(s);
  });

  it("criterion 6: a refused concurrent claim (busy) changes nothing, by identity", () => {
    const s = open();
    expect(reducePickOutcome(s, { kind: "busy" })).toBe(s);
  });

  it("criterion 6: a rejected folder only adds the notice — the project stays open", () => {
    const s = open();
    const next = reducePickOutcome(s, {
      kind: "noDocs",
      path: "/tmp/sketchpad",
      probe: { ...EMPTY_PROBE, git: true },
    });
    expect(next.phase).toBe("open");
    expect(next.docs).toBe(s.docs); // model untouched, not even re-derived
    expect(next.rejectedPick).toEqual({
      path: "/tmp/sketchpad",
      message: null,
      probe: { ...EMPTY_PROBE, git: true },
    });
  });

  it("criterion 6: a validation error leaves the project and its model alone", () => {
    const s = open();
    const next = reducePickOutcome(s, {
      kind: "error",
      path: "/tmp/gone",
      message: "that folder is no longer there",
    });
    expect(next.phase).toBe("open");
    expect(next.docs).toBe(s.docs);
    expect(next.rejectedPick?.message).toBe("that folder is no longer there");
  });

  it("criterion 2: a genesis outcome switches screens and clears the old model", () => {
    const s = open();
    expect(s.docs.model.tasks.length).toBe(1);
    const next = reducePickOutcome(s, {
      kind: "genesis",
      projectDir: "/tmp/sketchpad",
      seq: 42,
      probe: EMPTY_PROBE,
    });
    expect(next.phase).toBe("genesis");
    expect(next.genesisDir).toBe("/tmp/sketchpad");
    expect(next.rejectedPick).toBeNull();
    // The previous project's board must not linger behind the interview.
    expect(next.docs.model.tasks).toEqual([]);
    expect(next.docs.lastGood.size).toBe(0);
    // ...and the watermark advances past every pre-switch emit, so a
    // late docs-changed from the old project drops as stale.
    expect(next.docs.seq).toBe(42);
    expect(reduceDocs(next.docs, payload(41, "/projects/a", projectAFiles()))).toBe(next.docs);
  });

  it("criterion 5: opening a planned folder from the genesis flow lands on the board", () => {
    const s = shell({ phase: "genesis", genesisDir: "/tmp/sketchpad" });
    const next = reducePickOutcome(s, {
      kind: "picked",
      snapshot: payload(9, "/projects/planned", projectAFiles()),
    });
    expect(next.phase).toBe("open");
    expect(next.genesisDir).toBeNull();
    expect(next.docs.model.tasks.map((t) => t.id)).toEqual(["T-901"]);
  });
});
