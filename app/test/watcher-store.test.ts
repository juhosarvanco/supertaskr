import { describe, expect, it } from "vitest";
import {
  CONVENTION_HINT,
  EMPTY_PROBE,
  outcomeCarriesSnapshot,
  planChecklist,
  reduceDocs,
  reducePickOutcome,
  resetDocsForProjectSwitch,
  selectScreen,
  switchIsOvertaken,
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
  // T-064 added a third, for the same reason and with the same
  // treatment: `watcherLive` is meaningful only while `startupFailure`
  // is non-null, and every case here describes a healthy startup. Its
  // own behaviour is pinned in test/startup-recovery.test.ts.
  watcherLive: false,
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

  // T-042 criterion 1, at the pure reducer. "No plan" is weaker than "no
  // docs/", so a genesis folder can arrive with a tree already in it.
  it("T-042: a genesis switch CARRYING a tree applies it, and still clears the old project", () => {
    const s = open();
    expect(s.docs.model.tasks.length).toBe(1); // project A's board
    const next = reducePickOutcome(s, {
      kind: "genesis",
      projectDir: "/tmp/sketchpad",
      seq: 42,
      snapshot: payload(42, "/tmp/sketchpad", [
        { path: "docs/ARCHITECTURE.md", content: "# the shape of the thing" },
        { path: "docs/decisions/001-x.md", content: "# 001 - x" },
      ]),
    });
    expect(next.phase).toBe("genesis");
    expect(next.genesisDir).toBe("/tmp/sketchpad");
    // The tree the folder actually holds, applied.
    expect(next.docs.fileCount).toBe(2);
    expect(next.docs.projectDir).toBe("/tmp/sketchpad");
    expect([...next.docs.effective.keys()]).toEqual([
      "docs/ARCHITECTURE.md",
      "docs/decisions/001-x.md",
    ]);
    // ...and NOT project A's, whose board must not linger behind the
    // interview and whose last-good content must never be fallen back to.
    expect(next.docs.model.tasks).toEqual([]);
    expect(next.docs.lastGood.has("docs/tasks/T-901-alpha.md")).toBe(false);
    // The stale-drop watermark lands in exactly the same place as the
    // tree-less branch: Rust stamps the snapshot with the switch's seq.
    expect(next.docs.seq).toBe(42);
    expect(reduceDocs(next.docs, payload(41, "/projects/a", projectAFiles()))).toBe(next.docs);
  });

  it("T-042: an older payload with no snapshot field at all still reads as 'no tree'", () => {
    // The field is optional on the wire for the same reason T-018's
    // skip fields are: a payload minted before it existed stays valid,
    // and absent must read as "no tree", never as a claim about one.
    const s = open();
    const legacy = { kind: "genesis", projectDir: "/tmp/sketchpad", seq: 42 };
    const next = reducePickOutcome(s, legacy as Parameters<typeof reducePickOutcome>[1]);
    expect(next.phase).toBe("genesis");
    expect(next.docs.fileCount).toBe(0);
    expect(next.docs.seq).toBe(42);
  });
});

// ---- T-064 criterion 1: the overtaking emit -----------------------------

/**
 * `arm_genesis` arms the watch BEFORE `apply_genesis_folder` commits, so
 * a `docs-changed` emit for the NEW root can reach this store before the
 * invoke reply. Measured through these very reducers by T-042's verifier
 * on the branch point:
 *
 *     in-order    switch@7 -> fileCount=2 seq=7 phase=genesis
 *     overtaken   emit@8   -> fileCount=3 seq=8
 *                 then switch@7 -> fileCount=0 seq=8 phase=genesis
 *
 * "0 files written" over a docs/ that is not empty — the T-026-s4
 * symptom one layer down.
 */
describe("T-064: a genesis switch that arrives AFTER an emit for the same folder", () => {
  const GENESIS_DIR = "/tmp/sketchpad";
  const genesisFiles = (n: number): DocsFilePayload[] =>
    Array.from({ length: n }, (_, i) => ({
      path: `docs/decisions/00${i + 1}-x.md`,
      content: `# 00${i + 1}`,
    }));

  /** The emit landed first: the model already describes the new folder. */
  const overtaken = (emitSeq: number, files: number): ShellState =>
    shell({ docs: reduceDocs(emptyState(), payload(emitSeq, GENESIS_DIR, genesisFiles(files))) });

  it("the PREDICATE is true only when both halves are", () => {
    const prev = overtaken(8, 3).docs;
    const at = (seq: number, projectDir = GENESIS_DIR) =>
      ({ kind: "genesis", projectDir, seq }) as const;

    expect(switchIsOvertaken(prev, at(7)), "older reading, same folder").toBe(true);
    expect(switchIsOvertaken(prev, at(8)), "equal seq is still not newer").toBe(true);
    expect(switchIsOvertaken(prev, at(9)), "a NEWER switch is not overtaken").toBe(false);
    expect(
      switchIsOvertaken(prev, at(7, "/projects/somewhere-else")),
      "a different folder must still be reset away",
    ).toBe(false);
  });

  it("the snapshot's OWN seq is the reading compared, when one rides", () => {
    const prev = overtaken(8, 3).docs;
    // Rust stamps a carried snapshot with the switch's own seq, so these
    // agree in production; spelling it from the snapshot is what makes
    // the tree-less branch and the tree-bearing branch one rule.
    expect(
      switchIsOvertaken(prev, {
        kind: "genesis",
        projectDir: GENESIS_DIR,
        seq: 9,
        snapshot: payload(7, GENESIS_DIR, genesisFiles(2)),
      }),
    ).toBe(true);
  });

  it("KEEPS the overtaking emit instead of resetting to the empty model", () => {
    const s = overtaken(8, 3);
    expect(s.docs.fileCount).toBe(3);
    const next = reducePickOutcome(s, {
      kind: "genesis",
      projectDir: GENESIS_DIR,
      seq: 7,
      snapshot: payload(7, GENESIS_DIR, genesisFiles(2)),
    });
    // The screen still moves — this is a switch, and the phase is what
    // the switch is FOR.
    expect(next.phase).toBe("genesis");
    expect(next.genesisDir).toBe(GENESIS_DIR);
    // ...but the model is the LATER reading of the same folder, not an
    // empty one, and not the switch's own two-file tree either.
    expect(next.docs.fileCount, "the fresher measurement survives").toBe(3);
    expect(next.docs).toBe(s.docs); // identity: nothing was rebuilt
    expect(next.docs.seq).toBe(8);
  });

  it("the SNAPSHOT-LESS branch is covered too, and stops walking the watermark back", () => {
    // This branch ASSIGNED `outcome.seq`, so an overtaking emit at a
    // higher seq was followed by the watermark going BACKWARDS — a
    // second defect the tree-bearing branch does not have.
    const s = overtaken(8, 3);
    const next = reducePickOutcome(s, {
      kind: "genesis",
      projectDir: GENESIS_DIR,
      seq: 7,
      snapshot: null,
    });
    expect(next.phase).toBe("genesis");
    expect(next.docs.fileCount).toBe(3);
    expect(next.docs.seq, "8, never back to 7").toBe(8);
    // And the watermark still does its job afterwards.
    expect(reduceDocs(next.docs, payload(8, GENESIS_DIR, genesisFiles(1)))).toBe(next.docs);
  });

  it("a genesis switch onto a DIFFERENT folder still clears everything", () => {
    // The conjunct that is not about seq. Without it, an emit from the
    // previously open project at a high seq would be kept as though it
    // described the folder being switched to.
    const s = shell({
      docs: reduceDocs(emptyState(), payload(99, "/projects/a", projectAFiles())),
    });
    expect(s.docs.model.tasks.length).toBe(1);
    const next = reducePickOutcome(s, {
      kind: "genesis",
      projectDir: GENESIS_DIR,
      seq: 7,
      snapshot: null,
    });
    expect(next.docs.model.tasks, "no cross-project ghosts").toEqual([]);
    expect(next.docs.lastGood.size).toBe(0);
    expect(next.docs.fileCount).toBe(0);
    // ...and the watermark only ever goes UP. This branch used to ASSIGN
    // `outcome.seq`, walking it back to 7 — measured here before the
    // `Math.max`. Unreachable in production (Rust's counter is global
    // and monotonic, so a switch always stamps above every prior emit),
    // but a pure reducer cannot see that and must not depend on it.
    expect(next.docs.seq, "the watermark still survives the switch").toBe(99);
  });

  it("re-picking the OPEN folder as a genesis root is not an overtake", () => {
    // Same projectDir, but the switch's seq is NEWER — which is what a
    // real re-pick produces, because the switch stamps itself after the
    // ack. It must apply normally.
    const s = overtaken(8, 3);
    const next = reducePickOutcome(s, {
      kind: "genesis",
      projectDir: GENESIS_DIR,
      seq: 9,
      snapshot: payload(9, GENESIS_DIR, genesisFiles(1)),
    });
    expect(next.docs).not.toBe(s.docs);
    expect(next.docs.fileCount, "the switch's own tree, applied").toBe(1);
    expect(next.docs.seq).toBe(9);
  });
});

// ---- T-018-s5: the ORDINARY pick, overtaken the same way ---------------

/**
 * `open_as_project` arms the watch on the new root at the `Rearm`
 * rendezvous BEFORE it commits and stamps — exactly as
 * `apply_genesis_folder` does — so an emit for the picked folder can
 * reach this store ahead of the invoke reply. The `"picked"` branch used
 * to ask nothing about that and hand the reply straight to `reduceDocs`,
 * which applies any payload whose `seq` exceeds the watermark.
 *
 * THE INTERLEAVING BELOW IS THE RUNNER'S OWN, not a hypothetical.
 * `docs_watch::tests::picker_rearms_the_watcher_onto_the_new_root`
 * printed `docs-changed: seq=5` AFTER `project folder picked`, carrying
 * bytes written after the pick returned (T-018-s2; ubuntu-24.04, CI runs
 * 33304351040 and 33566291111). The two stamps Rust sends disagree
 * because they measure different moments: `WatchState::next_seq` draws
 * BEFORE the collect, so the watcher thread — which drew first and
 * walked longest — sends the LOWER seq with the NEWER bytes, while the
 * pick's reply sends a HIGHER seq stamped `generated_at_ms` by a walk
 * that finished EARLIER. Compared by seq alone the reply looks fresh.
 */
describe("T-018-s5: an ordinary pick whose reply arrives AFTER an emit for the same folder", () => {
  const DIR = "/projects/a";
  // The clock, spelled apart from the seq on purpose: these fixtures are
  // the one place the two stamps must be free to disagree, which the
  // file-wide `payload` helper (generatedAtMs = base + seq) cannot show.
  const EMIT_FINISHED = 1_700_000_000_900;
  const REPLY_FINISHED = 1_700_000_000_500;
  const read = (
    seq: number,
    generatedAtMs: number,
    files: number,
    projectDir = DIR,
  ): DocsSnapshotPayload => ({
    seq,
    projectDir,
    generatedAtMs,
    files: Array.from({ length: files }, (_, i) => ({
      path: `docs/decisions/00${i + 1}-x.md`,
      content: `# 00${i + 1}`,
    })),
  });

  /** The emit landed first: the model already holds the LATER reading. */
  const overtaken = (): ShellState =>
    shell({
      phase: "open",
      docs: reduceDocs(emptyState(), read(5, EMIT_FINISHED, 3)),
    });

  it("the PREDICATE reads a `picked` reply's OWN snapshot, both conjuncts", () => {
    const prev = overtaken().docs;
    const at = (seq: number, generatedAtMs: number, projectDir = DIR) =>
      ({ kind: "picked", snapshot: read(seq, generatedAtMs, 2, projectDir) }) as const;

    expect(
      switchIsOvertaken(prev, at(6, REPLY_FINISHED)),
      "higher seq, OLDER read, same folder — the whole defect",
    ).toBe(true);
    expect(switchIsOvertaken(prev, at(4, EMIT_FINISHED + 1)), "a lower seq is stale").toBe(true);
    expect(switchIsOvertaken(prev, at(5, EMIT_FINISHED + 1)), "an equal seq is not newer").toBe(
      true,
    );
    expect(
      switchIsOvertaken(prev, at(6, EMIT_FINISHED + 1)),
      "a genuinely newer reply is NOT overtaken",
    ).toBe(false);
    expect(
      switchIsOvertaken(prev, at(6, REPLY_FINISHED, "/projects/somewhere-else")),
      "a different folder must still be reset away, however old its read",
    ).toBe(false);
  });

  it("KEEPS the overtaking emit's tree and does not advance the watermark past it", () => {
    const s = overtaken();
    expect(s.docs.fileCount, "the emit's three-file reading is what the store holds").toBe(3);

    const next = reducePickOutcome(s, {
      kind: "picked",
      snapshot: read(6, REPLY_FINISHED, 2),
    });

    // The screen still moves — this is a switch, and the phase is what
    // the switch is FOR.
    expect(next.phase).toBe("open");
    expect(next.genesisDir).toBeNull();
    // ...but the model is the LATER reading of the same folder, kept by
    // identity (which is also what suppresses the duplicate echo), and
    // the watermark stays on the emit that carried it rather than
    // jumping past it.
    expect(next.docs, "identity: nothing was rebuilt").toBe(s.docs);
    expect(next.docs.fileCount, "the fresher measurement survives").toBe(3);
    expect(next.docs.seq, "5, never forward to the reply's 6").toBe(5);
    // And the watermark still does its job afterwards, in both
    // directions: the stale drop holds, and the next emit lands.
    expect(reduceDocs(next.docs, read(5, EMIT_FINISHED + 10, 1))).toBe(next.docs);
    expect(reduceDocs(next.docs, read(7, EMIT_FINISHED + 10, 1)).fileCount).toBe(1);
  });

  it("a re-pick of the OPEN folder whose read landed in the SAME millisecond still applies", () => {
    // The boundary the `<` on the clock is strict for. Two collections
    // that finish inside one tick are not ordered by the clock at all,
    // so the seq stamp decides and the reply applies — a fixture (or a
    // fast machine reading a small tree twice) must not be read as an
    // overtake.
    const s = overtaken();
    const next = reducePickOutcome(s, {
      kind: "picked",
      snapshot: read(6, EMIT_FINISHED, 1),
    });
    expect(next.docs, "not an identity return").not.toBe(s.docs);
    expect(next.docs.fileCount, "the reply's own tree, applied").toBe(1);
    expect(next.docs.seq).toBe(6);
  });

  it("a pick onto a DIFFERENT folder is never an overtake, however old its read", () => {
    // The conjunct that is not about the stamps. Without it, an emit
    // from the previously open project would be kept as though it
    // described the folder being picked — the cross-project ghost the
    // T-007 reset exists to prevent.
    const s = overtaken();
    const next = reducePickOutcome(s, {
      kind: "picked",
      snapshot: read(6, REPLY_FINISHED, 1, "/projects/elsewhere"),
    });
    expect(next.phase).toBe("open");
    expect(next.docs.projectDir, "the folder that was picked").toBe("/projects/elsewhere");
    expect(next.docs.fileCount, "its own tree, applied").toBe(1);
    expect([...next.docs.effective.keys()], "no cross-project ghosts").toEqual([
      "docs/decisions/001-x.md",
    ]);
  });
});

// T-042 criterion 3: the echo's guard, as a named predicate. It used to
// be "the docs seq advanced", which a genesis switch ALWAYS satisfies
// (it advances the watermark on purpose, and Rust's counter is global
// and monotonic) — so the app echoed models nothing had generated.
describe("outcomeCarriesSnapshot — provenance, not the seq", () => {
  const snapshot = payload(9, "/projects/planned", projectAFiles());

  it("is true for exactly the two outcomes a collection produced", () => {
    expect(outcomeCarriesSnapshot({ kind: "picked", snapshot })).toBe(true);
    expect(
      outcomeCarriesSnapshot({
        kind: "genesis",
        projectDir: "/tmp/sketchpad",
        seq: 42,
        snapshot,
      }),
    ).toBe(true);
  });

  it("is false for every outcome no collection produced", () => {
    const cases: Parameters<typeof outcomeCarriesSnapshot>[0][] = [
      { kind: "cancelled" },
      { kind: "busy" },
      { kind: "noDocs", path: "/tmp/elsewhere", probe: EMPTY_PROBE },
      { kind: "error", path: "/tmp/gone", message: "that folder is no longer there" },
      // The one that used to slip through, and its legacy spelling.
      { kind: "genesis", projectDir: "/tmp/sketchpad", seq: 42, snapshot: null },
      { kind: "genesis", projectDir: "/tmp/sketchpad", seq: 42 },
    ];
    for (const outcome of cases) {
      expect(outcomeCarriesSnapshot(outcome), `${outcome.kind} carries no tree`).toBe(false);
    }
  });
});
