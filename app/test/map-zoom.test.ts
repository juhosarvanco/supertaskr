import { describe, expect, it } from "vitest";
import { parseProjectFromFiles, type FileEntry } from "@supertaskr/parser/pure";
import { deriveArchitecture } from "../src/lib/architecture/derive";
import { parseGraph } from "../src/lib/architecture/graph";
import {
  CONTAINER_BORDER,
  CONTAINER_HEADER_H,
  CONTAINER_PAD,
  expansionFor,
  fileDetail,
  FILE_BUDGET,
  GROUP_BUDGET,
  GROUP_GAP,
  GROUP_LABEL_H,
  intraEdges,
  NOTE_H,
  ROW_GAP,
  ROW_H,
} from "../src/architecture/map-zoom";

// T-013's pure semantic-zoom models: T1's container (grouping, the two
// degraded states, the geometry the layout stacks around) and T2's file
// detail (symbols, resolved edges, the shapes that must not crash it).
//
// EVERY HEIGHT BELOW IS HAND-DERIVED FROM THE CONSTANTS AND WRITTEN AS A
// LITERAL, never recomputed from them: a test parametrised by the
// constant it checks cannot pin that constant (CONVENTIONS, T-063). The
// arithmetic is shown in the comment beside each one so a reader can
// redo it, and the geometry constants are asserted once, on their own.

describe("the container geometry is pinned, not derived", () => {
  it("carries the exact numbers every height below is built from", () => {
    expect([
      CONTAINER_BORDER,
      CONTAINER_PAD,
      CONTAINER_HEADER_H,
      GROUP_LABEL_H,
      ROW_H,
      ROW_GAP,
      GROUP_GAP,
      NOTE_H,
    ]).toEqual([1, 8, 30, 14, 20, 3, 7, 15]);
    expect([FILE_BUDGET, GROUP_BUDGET]).toEqual([48, 24]);
  });
});

describe("T1 · expansionFor — files mode", () => {
  it("groups by directory, keeps every file, and measures its own box", () => {
    const expansion = expansionFor(["a/y.ts", "b/z.ts", "a/x.ts"]);
    expect(expansion.mode).toBe("files");
    expect(expansion.totalFiles).toBe(3);
    expect(expansion.shownFiles).toBe(3);
    expect(expansion.note).toBeUndefined();
    expect(expansion.groups).toEqual([
      { label: "a/", leaves: ["x.ts", "y.ts"], count: 2 },
      { label: "b/", leaves: ["z.ts"], count: 1 },
    ]);
    // 1+8 border+pad, 30 header, group a 14 + 2*(20+3) = 60, gap 7,
    // group b 14 + 1*23 = 37, then 8+1 pad+border  ->  152.
    expect(expansion.height).toBe(152);
  });

  it("places every row centre where the edge layer can aim at it", () => {
    const expansion = expansionFor(["a/x.ts", "a/y.ts", "b/z.ts"]);
    // 1+8+30 = 39 is the body top; +14 label, +3 gap, +10 half-row = 66.
    expect(expansion.rows).toEqual([
      { path: "a/x.ts", y: 66 },
      { path: "a/y.ts", y: 89 },
      { path: "b/z.ts", y: 133 },
    ]);
    // The last row's bottom (133 + 10) plus pad and border IS the box.
    expect(133 + ROW_H / 2 + CONTAINER_PAD + CONTAINER_BORDER).toBe(expansion.height);
  });

  it("a bare filename groups under (root)", () => {
    const expansion = expansionFor(["x.ts"]);
    expect(expansion.groups).toEqual([{ label: "(root)", leaves: ["x.ts"], count: 1 }]);
    // 1+8+30 + (14 + 23) + 8+1 = 85.
    expect(expansion.height).toBe(85);
    expect(expansion.rows).toEqual([{ path: "x.ts", y: 66 }]);
  });

  it("an empty component still opens, and still says why it is empty", () => {
    const expansion = expansionFor([]);
    expect(expansion.mode).toBe("files");
    expect(expansion.groups).toEqual([]);
    expect(expansion.rows).toEqual([]);
    // 1+8+30 + 20 (the "no indexed files" line) + 8+1 = 68.
    expect(expansion.height).toBe(68);
  });

  it("never renders shorter than the collapsed node it replaced", () => {
    // The floor exists so an expansion can never make a node smaller —
    // there is no input that reaches it today (the smallest real box is
    // 68 above), and the clamp is asserted rather than assumed.
    expect(expansionFor([]).height).toBeGreaterThanOrEqual(66);
  });

  it("is exactly at the budget boundary on both sides", () => {
    const at = Array.from({ length: FILE_BUDGET }, (_, i) => `d/f${i}.ts`);
    expect(expansionFor(at).mode).toBe("files");
    expect(expansionFor([...at, "d/one-more.ts"]).mode).not.toBe("files");
  });
});

describe("T1 · the render budget is a DEFINED degraded state", () => {
  it("groups deeper when the files are over budget", () => {
    const files = Array.from({ length: 60 }, (_, i) => `app/src/a/f${i}.ts`);
    const expansion = expansionFor(files);
    expect(expansion.mode).toBe("grouped");
    expect(expansion.totalFiles).toBe(60);
    expect(expansion.shownFiles).toBe(0);
    expect(expansion.hiddenGroups).toBe(0);
    expect(expansion.groups).toEqual([{ label: "app/src/a/", leaves: [], count: 60 }]);
    expect(expansion.note).toBe("60 files over the 48-row budget · grouped by directory");
    // 1+8+30 + (20 row + 7 gap + 15 note) + 8+1 = 90.
    expect(expansion.height).toBe(90);
  });

  it("rolls the grouping up one level at a time until the groups fit", () => {
    // 50 files across 25 leaf directories under one parent: at full
    // depth that is 25 groups (over the 24 budget), one level up it is 1.
    const files: string[] = [];
    for (let dir = 0; dir < 25; dir += 1) {
      files.push(`top/d${dir}/a.ts`, `top/d${dir}/b.ts`);
    }
    const expansion = expansionFor(files);
    expect(expansion.mode).toBe("grouped");
    expect(expansion.depth).toBe(1);
    expect(expansion.groups).toEqual([{ label: "top/", leaves: [], count: 50 }]);
  });

  it("PAGINATES when even the top level does not fit, and says what it left out", () => {
    // 30 top-level directories: the roll-up floors at one segment (see
    // expansionFor), so this is the state that cannot be grouped away.
    const files: string[] = [];
    for (let dir = 0; dir < 30; dir += 1) {
      files.push(`t${String(dir).padStart(2, "0")}/a.ts`, `t${String(dir).padStart(2, "0")}/b.ts`);
    }
    const expansion = expansionFor(files);
    expect(expansion.mode).toBe("paginated");
    expect(expansion.depth).toBe(1);
    expect(expansion.groups).toHaveLength(GROUP_BUDGET);
    expect(expansion.hiddenGroups).toBe(6);
    expect(expansion.groups[0]?.label).toBe("t00/");
    expect(expansion.groups[23]?.label).toBe("t23/");
    expect(expansion.note).toBe("60 files · 24 of 30 directories · the panel has the rest");
    // 1+8+30 + (24*20 + 15 note + 24*7 gaps) + 8+1 = 711.
    expect(expansion.height).toBe(711);
  });

  it("is deterministic: the same file set in any order is the same container", () => {
    const files = ["b/z.ts", "a/x.ts", "a/y.ts", "c/w.ts"];
    const shuffled = ["c/w.ts", "a/y.ts", "b/z.ts", "a/x.ts"];
    expect(expansionFor(shuffled)).toEqual(expansionFor(files));
  });
});

// ---- T2 ---------------------------------------------------------------

function componentFile(id: string, name: string, paths: string[], dependsOn: string[] = []): FileEntry {
  return {
    path: `docs/architecture/components/${id}-x.md`,
    content: [
      "---",
      `id: ${id}`,
      `name: ${JSON.stringify(name)}`,
      "paths:",
      ...paths.map((p) => `  - ${JSON.stringify(p)}`),
      `depends_on: [${dependsOn.join(", ")}]`,
      "status: auto",
      "touch_slugs: []",
      "---",
      "prose.",
    ].join("\n"),
  };
}

const GRAPH = JSON.stringify({
  schema: 1,
  root: ".",
  languages: ["ts"],
  files: [
    {
      id: "f:src/a/one.ts",
      path: "src/a/one.ts",
      lang: "ts",
      loc: 40,
      symbols: [
        { id: "s:src/a/one.ts#Alpha", name: "Alpha", kind: "function", exported: true, range: [10, 20] },
        { id: "s:src/a/one.ts#helper", name: "helper", kind: "const", exported: false, range: [3, 4] },
      ],
    },
    {
      id: "f:src/a/two.ts",
      path: "src/a/two.ts",
      lang: "ts",
      loc: 12,
      symbols: [
        { id: "s:src/a/two.ts#Beta", name: "Beta", kind: "interface", exported: true, range: [1, 2] },
      ],
    },
    {
      id: "f:src/b/three.ts",
      path: "src/b/three.ts",
      lang: "ts",
      loc: 7,
      // `x` is DECLARED on purpose. Without it the heuristic edge below
      // names a symbol the graph does not define, `parseGraph` drops the
      // edge for referential integrity, and the "a heuristic edge is not
      // evidence" assertion below becomes vacuous — it would pass
      // against a reader that counts heuristics, because there would be
      // no heuristic to count. The drill caught exactly that.
      symbols: [{ id: "s:src/b/three.ts#x", name: "x", kind: "function", exported: false, range: [1, 1] }],
    },
  ],
  packages: [{ id: "p:react", name: "react", ecosystem: "npm" }],
  edges: [
    { from: "f:src/a/one.ts", to: "f:src/a/two.ts", kind: "import", symbols: ["Beta"] },
    { from: "f:src/a/one.ts", to: "f:src/b/three.ts", kind: "import" },
    { from: "f:src/a/one.ts", to: "p:react", kind: "import" },
    { from: "s:src/a/one.ts#Alpha", to: "s:src/a/two.ts#Beta", kind: "type_ref", confidence: "resolved" },
    { from: "f:src/b/three.ts", to: "f:src/a/one.ts", kind: "import" },
    { from: "s:src/b/three.ts#x", to: "s:src/a/one.ts#Alpha", kind: "call", confidence: "heuristic" },
  ],
  unresolved: [{ from: "f:src/a/one.ts", specifier: "./missing", reason: "not_found" }],
});

function fixture() {
  const model = parseProjectFromFiles([
    componentFile("C-01", "Ay", ["src/a/**"]),
    componentFile("C-02", "Bee", ["src/b/**"]),
  ]);
  const parsed = parseGraph(GRAPH);
  const derived = deriveArchitecture({
    components: model.components ?? [],
    tasks: model.tasks,
    ...(parsed.graph !== undefined ? { graph: parsed.graph } : {}),
  });
  return { derived, graph: parsed.graph };
}

describe("T2 · fileDetail", () => {
  it("lists symbols in line order with their resolved reference counts", () => {
    const { derived, graph } = fixture();
    const detail = fileDetail("src/a/two.ts", derived, graph);
    expect(detail.missing).toBe(false);
    expect(detail.component).toBe("C-01");
    expect(detail.lang).toBe("ts");
    expect(detail.loc).toBe(12);
    expect(detail.symbols).toEqual([
      { name: "Beta", kind: "interface", exported: true, refs: 1, range: [1, 2] },
    ]);
  });

  it("counts only RESOLVED references — a heuristic edge is not evidence", () => {
    const { derived, graph } = fixture();
    // POSITIVE CONTROL FIRST (CONVENTIONS: a negative assertion needs
    // one). "Not counted" must be distinguishable from "not there": the
    // heuristic edge has to have SURVIVED the graph reader before its
    // absence from the count means anything.
    const heuristic = (graph?.edges ?? []).filter(
      (edge) => edge.to === "s:src/a/one.ts#Alpha" && edge.confidence === "heuristic",
    );
    expect(heuristic, "the fixture's heuristic edge must reach the graph").toHaveLength(1);

    const detail = fileDetail("src/a/one.ts", derived, graph);
    const alpha = detail.symbols.find((symbol) => symbol.name === "Alpha");
    // The only edge pointing at Alpha is that one.
    expect(alpha?.refs).toBe(0);
    // Line order, not name order: helper is declared at line 3.
    expect(detail.symbols.map((symbol) => symbol.name)).toEqual(["helper", "Alpha"]);
    expect(detail.symbols.map((symbol) => symbol.exported)).toEqual([false, true]);
  });

  it("lists the file's resolved edges, imports first, with the component each resolves to", () => {
    const { derived, graph } = fixture();
    const detail = fileDetail("src/a/one.ts", derived, graph);
    expect(
      detail.edges.map((edge) => [edge.kind, edge.label, edge.component ?? "—"]),
    ).toEqual([
      // imports, by label; the heuristic call edge is absent entirely.
      ["import", "react", "—"],
      ["import", "three.ts", "C-02"],
      ["import", "two.ts", "—"], // same component: no cross-component tag
      ["type_ref", "Beta", "—"],
    ]);
    expect(detail.unresolved).toEqual(["./missing"]);
  });

  it("a path the graph does not know is MISSING, never a crash", () => {
    const { derived, graph } = fixture();
    const detail = fileDetail("src/a/gone.ts", derived, graph);
    expect(detail.missing).toBe(true);
    expect(detail.symbols).toEqual([]);
    expect(detail.edges).toEqual([]);
    // And with no graph at all.
    expect(fileDetail("src/a/one.ts", derived, undefined).missing).toBe(true);
  });

  it("reports every component that claims a file — the D4 finding, in the panel", () => {
    const model = parseProjectFromFiles([
      componentFile("C-01", "Ay", ["src/**"]),
      componentFile("C-02", "Bee", ["src/a/**"]),
    ]);
    const parsed = parseGraph(GRAPH);
    const derived = deriveArchitecture({
      components: model.components ?? [],
      tasks: model.tasks,
      ...(parsed.graph !== undefined ? { graph: parsed.graph } : {}),
    });
    const detail = fileDetail("src/a/one.ts", derived, parsed.graph);
    expect(detail.claimedBy).toEqual(["C-01", "C-02"]);
    expect(detail.component).toBe("C-01"); // first by id order wins
  });
});

describe("T1 · intra-component edges", () => {
  it("keeps only the file edges with BOTH ends inside the component", () => {
    const { derived, graph } = fixture();
    expect(intraEdges("C-01", derived, graph)).toEqual([
      { from: "src/a/one.ts", to: "src/a/two.ts" },
    ]);
    // C-02 has one file, so its only edges leave it.
    expect(intraEdges("C-02", derived, graph)).toEqual([]);
    expect(intraEdges("C-01", derived, undefined)).toEqual([]);
  });
});
