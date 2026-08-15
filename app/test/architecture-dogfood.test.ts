import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseProjectFromFiles, type FileEntry } from "@nputer/parser/pure";
import { deriveArchitecture, UNMAPPED_ID } from "../src/lib/architecture/derive";
import { GRAPH_PATH, parseGraph } from "../src/lib/architecture/graph";

// THE DOGFOOD CHECK (T-011 acceptance criterion 4): run the derivation on
// THIS repo — the live component registry, the committed graph.json, the
// live task model — and assert the actual findings. This test is the
// current drift truth of the nputer repo, reviewed and pinned; plan §10
// wants the repo driven to zero drift before launch, and this is the
// ratchet that makes each finding a deliberate architect decision
// (T-008-s2 predicted the C-08/C-09 → C-05 pair; the derivation found
// two more, both from the app/test/** umbrella).
//
// Maintenance contract: these expectations change ONLY when the committed
// graph is regenerated (integrator, at TS-touching merges — T-009-s1) or
// the registry/architecture changes (architect). Task-status churn cannot
// move them: drift is intent ⨝ reality, and status/provenance values are
// deliberately NOT asserted here (they live in the unit tables; the live
// values are recorded in T-011's implementation notes).
//
// RECONCILED AT THE T-011 MERGE (2026-08-15, integrator — third
// exercise of the T-009-s1 practice): the regenerated 59-file graph
// includes both this task's own files and T-017's. app/test/** maps to
// C-05 (then 21 files); D2 carried FOUR unclaimed files (the engine
// trio + verdicts.ts) and the unmapped node drew four undeclared
// edges. Those pins were honest current truth, not targets: T-012's
// dispatch carried the registry amendment decision (T-011-s1) meant to
// drain D2 back to empty.
//
// RECONCILED AT T-012's §2 REGISTRY AMENDMENTS (2026-08-15, executor
// claude-fable-5 @T-012, same commit as the amendments — deltas
// enumerated in T-012's implementation notes): C-12 gains depends_on
// C-05+C-09 and claims the engine in place (paths +
// app/src/lib/architecture/** — T-011-s1 option a, decided at
// dispatch); C-05 gains depends_on C-12 and paths
// app/src/components/shell/** + app/src/lib/verdicts.ts. Against the
// same committed 59-file graph: D2 drains to empty (engine trio → C-12,
// verdicts.ts → C-05), D3:C-12 drains (C-12 now has files), the four
// unmapped edges leave the table, C-05→C-12 materializes CONFIRMED
// (the 4 architecture tests' 6 file edges), C-12→C-06 flips planned →
// confirmed (derive.ts → @nputer/parser now counts as C-12's), and the
// verdicts.ts consumers fold into the existing D1s: C-08→C-05 3→4
// (board-model), C-09→C-05 1→2 (TaskDetailPanel). The four remaining
// D1s are launch data (real drift the map exists to show), not
// blemishes; the T-012 code this branch adds is NOT in the committed
// graph until the integrator's merge regen (T-009-s1), which this
// fixture meets again there.
//
// RECONCILED AT THE T-012 MERGE (2026-08-15, integrator — fourth
// exercise of the T-009-s1 practice): the regenerated 75-file graph
// (59→75: eight map-pane sources + PaneRail + seven test suites) now
// contains the map's own code, so the §2 amendments meet reality.
// Deltas, each verified by independent re-derivation before this edit:
// mapping C-05 22→30 (the new tests + the rail), C-12 3→11 (the map
// joins its engine); D2 STAYS EMPTY and the unmapped node stays gone —
// the amended registry claimed everything this branch added. Findings:
// only D1:C-05→C-06 moves, 5→8 file edges (map-dogfood-render,
// map-search, map-view-dom import @nputer/parser under the app/test/**
// umbrella); the other three D1s and D3 C-01/C-07/C-11 are byte-
// unchanged. Relation table: same 23 rows, tally 9/4/10 → 12/4/7 —
// C-12's declared edges to C-05 (4: utils + button), C-09 (4:
// panel-dismissal, task-detail, TaskDetailPanel) and C-10 (1:
// watcher-store) flip planned → CONFIRMED now that its code is
// indexed; C-12→C-06 grows 1→4 (MapPanel/MapView/map-layout join
// derive.ts on the parser); C-05→C-12 6→20 (the map test suites);
// C-05→C-10 5→8 (three new tests consume docs-model). C-12→C-07 and
// C-12→C-11 honestly remain planned: no TS import can confirm a Rust
// crate or a token file. Changed, never loosened.

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function docsFiles(): FileEntry[] {
  const entries: FileEntry[] = [];
  for (const name of readdirSync(join(ROOT, "docs/tasks"))) {
    if (name.endsWith(".md")) entries.push({ path: `docs/tasks/${name}`, content: read(`docs/tasks/${name}`) });
  }
  for (const name of readdirSync(join(ROOT, "docs/architecture/components"))) {
    if (name.endsWith(".md")) {
      entries.push({
        path: `docs/architecture/components/${name}`,
        content: read(`docs/architecture/components/${name}`),
      });
    }
  }
  entries.push({ path: "docs/ROADMAP.md", content: read("docs/ROADMAP.md") });
  return entries;
}

function liveModel() {
  const project = parseProjectFromFiles(docsFiles());
  const graphResult = parseGraph(read(GRAPH_PATH));
  const derived = deriveArchitecture({
    components: project.components ?? [],
    ...(graphResult.graph !== undefined ? { graph: graphResult.graph } : {}),
    tasks: project.tasks,
  });
  return { project, graphResult, derived };
}

const PARSER_PKG = "p:@nputer/parser";
const LIB_PARSER = "lib/parser";

describe("dogfood: the nputer repo through its own derivation engine", () => {
  const { project, graphResult, derived } = liveModel();

  it("both input layers parse clean (the smoke-test discipline)", () => {
    expect(project.issues).toEqual([]);
    expect(graphResult.issues).toEqual([]);
    expect(graphResult.graph).toBeDefined();
  });

  it("the live registry is the nine known components", () => {
    expect((project.components ?? []).map((c) => c.id)).toEqual([
      "C-01",
      "C-05",
      "C-06",
      "C-07",
      "C-08",
      "C-09",
      "C-10",
      "C-11",
      "C-12",
    ]);
    expect(derived.mode).toBe("full");
    expect(derived.components.filter((c) => c.kind === "declared")).toHaveLength(9);
    expect(derived.components.filter((c) => c.kind === "placeholder")).toHaveLength(0);
  });

  it("all 75 files map — zero unclaimed territory after the §2 amendments", () => {
    expect(derived.fileComponent.size).toBe(75);
    expect(derived.unmappedFiles).toEqual([]);
    expect(derived.components.find((c) => c.id === UNMAPPED_ID)).toBeUndefined();
    const counts = new Map<string, number>();
    for (const id of derived.fileComponent.values()) counts.set(id, (counts.get(id) ?? 0) + 1);
    expect([...counts.entries()].sort()).toEqual([
      ["C-05", 30],
      ["C-06", 19],
      ["C-08", 10],
      ["C-09", 3],
      ["C-10", 2],
      ["C-12", 11],
    ]);
    // The map pane joined its engine at the T-012 merge regen
    // (T-011-s1 option a keeps the trio in place under lib/).
    expect(derived.components.find((c) => c.id === "C-12")?.files).toEqual([
      "app/src/architecture/MapEdge.tsx",
      "app/src/architecture/MapNode.tsx",
      "app/src/architecture/MapPanel.tsx",
      "app/src/architecture/MapProvenanceMark.tsx",
      "app/src/architecture/MapView.tsx",
      "app/src/architecture/map-layout.ts",
      "app/src/architecture/map-search.ts",
      "app/src/architecture/map-visuals.ts",
      "app/src/lib/architecture/derive.ts",
      "app/src/lib/architecture/glob.ts",
      "app/src/lib/architecture/graph.ts",
    ]);
  });

  it("no file-level ambiguity: the umbrella really is non-overlapping", () => {
    expect(derived.issues).toEqual([]);
  });

  it("THE FINDINGS: four undeclared dependencies, three declared-only components, no unclaimed territory", () => {
    expect(derived.findings).toEqual([
      {
        rule: "D1",
        id: "D1:C-05->C-06",
        from: "C-05",
        to: "C-06",
        fileEdges: [
          { from: "app/test/architecture-derive.test.ts", to: LIB_PARSER, package: PARSER_PKG },
          { from: "app/test/architecture-dogfood.test.ts", to: LIB_PARSER, package: PARSER_PKG },
          { from: "app/test/board-truth.test.tsx", to: LIB_PARSER, package: PARSER_PKG },
          { from: "app/test/map-dogfood-render.test.tsx", to: LIB_PARSER, package: PARSER_PKG },
          { from: "app/test/map-search.test.ts", to: LIB_PARSER, package: PARSER_PKG },
          { from: "app/test/map-view-dom.test.tsx", to: LIB_PARSER, package: PARSER_PKG },
          { from: "app/test/select-board.test.ts", to: LIB_PARSER, package: PARSER_PKG },
          { from: "app/test/select-task-detail.test.ts", to: LIB_PARSER, package: PARSER_PKG },
        ],
      },
      {
        rule: "D1",
        id: "D1:C-05->C-09",
        from: "C-05",
        to: "C-09",
        fileEdges: [
          { from: "app/test/detail-presentation.test.ts", to: "app/src/lib/task-detail.ts" },
          { from: "app/test/panel-dismissal.test.ts", to: "app/src/components/board/panel-dismissal.ts" },
          { from: "app/test/select-task-detail.test.ts", to: "app/src/lib/task-detail.ts" },
        ],
      },
      {
        rule: "D1",
        id: "D1:C-08->C-05",
        from: "C-08",
        to: "C-05",
        fileEdges: [
          { from: "app/src/components/board/TaskCard.tsx", to: "app/src/lib/utils.ts" },
          { from: "app/src/components/board/badges/ModelBadge.tsx", to: "app/src/lib/utils.ts" },
          { from: "app/src/components/board/badges/SizeBadge.tsx", to: "app/src/lib/utils.ts" },
          { from: "app/src/lib/board-model.ts", to: "app/src/lib/verdicts.ts" },
        ],
      },
      {
        rule: "D1",
        id: "D1:C-09->C-05",
        from: "C-09",
        to: "C-05",
        fileEdges: [
          { from: "app/src/components/board/TaskDetailPanel.tsx", to: "app/src/lib/utils.ts" },
          { from: "app/src/components/board/TaskDetailPanel.tsx", to: "app/src/lib/verdicts.ts" },
        ],
      },
      { rule: "D3", id: "D3:C-01", component: "C-01" },
      { rule: "D3", id: "D3:C-07", component: "C-07" },
      { rule: "D3", id: "D3:C-11", component: "C-11" },
    ]);
  });

  it("the full relation table: 12 confirmed, 4 undeclared, 7 planned", () => {
    expect(derived.edges.map((e) => [e.from, e.to, e.relation, e.observedCount])).toEqual([
      ["C-05", "C-01", "planned", 0],
      ["C-05", "C-06", "undeclared", 8],
      ["C-05", "C-08", "confirmed", 4],
      ["C-05", "C-09", "undeclared", 3],
      ["C-05", "C-10", "confirmed", 8],
      ["C-05", "C-11", "planned", 0],
      ["C-05", "C-12", "confirmed", 20],
      ["C-06", "C-01", "planned", 0],
      ["C-08", "C-05", "undeclared", 4],
      ["C-08", "C-06", "confirmed", 4],
      ["C-08", "C-09", "confirmed", 6],
      ["C-08", "C-11", "planned", 0],
      ["C-09", "C-05", "undeclared", 2],
      ["C-09", "C-06", "confirmed", 2],
      ["C-09", "C-08", "confirmed", 3],
      ["C-09", "C-11", "planned", 0],
      ["C-10", "C-06", "confirmed", 1],
      ["C-12", "C-05", "confirmed", 4],
      ["C-12", "C-06", "confirmed", 4],
      ["C-12", "C-07", "planned", 0],
      ["C-12", "C-09", "confirmed", 4],
      ["C-12", "C-10", "confirmed", 1],
      ["C-12", "C-11", "planned", 0],
    ]);
  });

  it("the T-009 package.path seam is consumed: C-0x→C-06 edges are real, never absent", () => {
    // Declared consumers of @nputer/parser resolve to CONFIRMED edges
    // through the package join (this closes the seam note in T-009 §6.6:
    // the file:-dep edge must not render as planned-forever, and must
    // never be silently absent).
    const c08 = derived.edges.find((e) => e.from === "C-08" && e.to === "C-06");
    expect(c08?.relation).toBe("confirmed");
    expect(c08?.fileEdges).toEqual([
      { from: "app/src/components/board/Board.tsx", to: LIB_PARSER, package: PARSER_PKG },
      { from: "app/src/components/board/badges/ReviewBadge.tsx", to: LIB_PARSER, package: PARSER_PKG },
      { from: "app/src/components/board/badges/SizeBadge.tsx", to: LIB_PARSER, package: PARSER_PKG },
      { from: "app/src/lib/board-model.ts", to: LIB_PARSER, package: PARSER_PKG },
    ]);
    const c09 = derived.edges.find((e) => e.from === "C-09" && e.to === "C-06");
    expect(c09?.relation).toBe("confirmed");
    expect(c09?.fileEdges).toEqual([
      { from: "app/src/components/board/TaskDetailPanel.tsx", to: LIB_PARSER, package: PARSER_PKG },
      { from: "app/src/lib/task-detail.ts", to: LIB_PARSER, package: PARSER_PKG },
    ]);
    const c10 = derived.edges.find((e) => e.from === "C-10" && e.to === "C-06");
    expect(c10?.relation).toBe("confirmed");
    expect(c10?.fileEdges).toEqual([
      { from: "app/src/lib/docs-model.ts", to: LIB_PARSER, package: PARSER_PKG },
    ]);
    // The undeclared fourth consumer is C-05 (test files) — drift, not absence.
    expect(derived.edges.find((e) => e.from === "C-05" && e.to === "C-06")?.relation).toBe(
      "undeclared",
    );
  });

  it("drift flags land on the right nodes", () => {
    const drift = derived.components.filter((c) => c.hasDrift).map((c) => c.id);
    // D1 sources: C-05, C-08, C-09; D3: C-01, C-07, C-11.
    expect(drift).toEqual(["C-01", "C-05", "C-07", "C-08", "C-09", "C-11"]);
    const declaredOnly = derived.components.filter((c) => c.declaredOnly).map((c) => c.id);
    expect(declaredOnly).toEqual(["C-01", "C-07", "C-11"]);
  });

  it("stable rollup structure (values live in the unit tables, not here)", () => {
    const byId = new Map(derived.components.map((c) => [c.id, c]));
    // C-01 dogfoods the pin feature: pinned done, no task slug maps to it.
    expect(byId.get("C-01")?.pinned).toBe(true);
    expect(byId.get("C-01")?.status).toBe("done");
    expect(byId.get("C-01")?.tasks).toEqual([]);
    // Task membership that cannot churn: done tasks keep their touches.
    const taskIds = (id: string): (string | undefined)[] =>
      (byId.get(id)?.tasks ?? []).map((t) => t.id);
    expect(taskIds("C-06")).toContain("T-002");
    expect(taskIds("C-06")).toContain("T-008");
    expect(taskIds("C-07")).toContain("T-009");
    expect(taskIds("C-12")).toContain("T-011");
    // Every component resolves to a real status; pins are where declared.
    for (const component of derived.components) {
      expect(["planned", "building", "verifying", "rejected", "done", "merging"]).toContain(
        component.status,
      );
    }
    expect(derived.components.filter((c) => c.pinned).map((c) => c.id)).toEqual(["C-01"]);
  });
});
