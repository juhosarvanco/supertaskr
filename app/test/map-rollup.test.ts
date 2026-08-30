import { beforeEach, describe, expect, it } from "vitest";
import { parseComponentsFromFiles, type ComponentRecord } from "@nputer/parser/pure";
import { deriveArchitecture, UNMAPPED_ID } from "../src/lib/architecture/derive";
import {
  componentTarget,
  fileTarget,
  parseDetail,
  parseRollup,
  partialGraph,
  type ArchDetail,
} from "../src/lib/architecture/rollup";
import {
  __resetRollupForTests,
  applyRollupPayload,
  getRollupState,
  loadDetail,
  loadRollup,
  parseDetailOutcome,
  parseRollupOutcome,
  rollupUnavailableSentence,
} from "../src/architecture/rollup-source";
import { findingText } from "../src/architecture/map-visuals";
import { expansionFor, fileDetail, intraEdges } from "../src/architecture/map-zoom";

/**
 * T-140-s1 — THE RESTING PAYLOAD AND THE PULL, from the pane's side.
 *
 * WHAT THESE BODIES ARE FOR. The Rust half is pinned in
 * `crates/nputer-index/src/rollup.rs`, `tests/budget.rs` (the relation)
 * and `src/arch_cmd.rs` (the channel). This file pins the half that lives
 * here: that the pane can FOLD what the channel says, DERIVE a map from
 * it with no file paths anywhere, tell a refusal from an absence, and
 * REBUILD the slice of the graph the user opened well enough that the
 * existing T1/T2 renderers run over it unchanged.
 *
 * THE ONE PROPERTY THAT IS NOT A SHAPE CHECK is the last describe block:
 * the resting model derived from a rollup names no file at all, and the
 * same model after a pull names exactly the files that were pulled. That
 * is the trade this card is, asserted rather than described.
 */

// ------------------------------------------------------------- fixtures

function componentsOf(
  specs: [id: string, paths: string[], deps: string[]][],
): ComponentRecord[] {
  const result = parseComponentsFromFiles(
    specs.map(([id, paths, deps]) => ({
      path: `docs/architecture/components/${id}-x.md`,
      content:
        [
          "---",
          `id: ${id}`,
          `name: ${id} component`,
          "layer: app",
          "paths:",
          ...paths.map((p) => `  - "${p}"`),
          `depends_on: [${deps.join(", ")}]`,
          `touch_slugs: [${id.toLowerCase()}]`,
          "---",
          `Responsibility of ${id}.`,
        ].join("\n") + "\n",
    })),
  );
  expect(result.issues).toEqual([]);
  return result.components;
}

/** A rollup payload in the exact shape `arch_rollup` serializes. */
function rollupPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema: 1,
    components: [
      { id: "C-01", files: 340 },
      { id: "C-02", files: 12 },
      { id: UNMAPPED_ID, files: 3 },
    ],
    edges: [
      { from: "C-01", to: "C-02", relation: "confirmed", declared: true, observed: 27 },
      { from: "C-01", to: UNMAPPED_ID, relation: "undeclared", declared: false, observed: 4 },
      { from: "C-02", to: "C-99", relation: "planned", declared: true, observed: 0 },
    ],
    findings: [
      { rule: "D1", id: "D1:C-01->unmapped", from: "C-01", to: UNMAPPED_ID },
      { rule: "D2", id: "D2:unmapped", component: UNMAPPED_ID, count: 3 },
      { rule: "D4", id: "D4", count: 6 },
      { rule: "D5", id: "D5:C-02->C-99", from: "C-02", to: "C-99" },
    ],
    stats: {
      files: 355,
      symbols: 4021,
      edges: 2110,
      components: 2,
      mapped: 352,
      unmapped: 3,
      truncatedSymbols: false,
    },
    ...overrides,
  };
}

// ------------------------------------------------------------ the boundary

describe("the resting payload's boundary", () => {
  it("folds a well-formed rollup, and keys its lookup by component id", () => {
    const { rollup, issues } = parseRollup(rollupPayload());
    expect(issues).toEqual([]);
    expect(rollup?.components.map((c) => [c.id, c.files])).toEqual([
      ["C-01", 340],
      ["C-02", 12],
      [UNMAPPED_ID, 3],
    ]);
    expect(rollup?.filesByComponent.get("C-01")).toBe(340);
    expect(rollup?.stats.files).toBe(355);
    expect(rollup?.edges[0]?.observed).toBe(27);
  });

  it("refuses a schema it does not understand rather than half-reading it", () => {
    const { rollup, issues } = parseRollup(rollupPayload({ schema: 2 }));
    expect(rollup).toBeUndefined();
    expect(issues[0]?.kind).toBe("rollup-unreadable");
    expect(parseRollup("not an object").rollup).toBeUndefined();
    expect(parseRollup(null).rollup).toBeUndefined();
  });

  it("drops malformed entries by name and keeps the rest (collect-don't-throw)", () => {
    const payload = rollupPayload({
      components: [
        { id: "C-01", files: 3 },
        { id: "C-01", files: 9 }, // duplicate: first wins
        { id: "C-02", files: -1 }, // not a count
        { id: "", files: 1 }, // no id
        { id: "C-03", files: 5 },
      ],
      edges: [
        { from: "C-01", to: "C-03", relation: "sideways", declared: false, observed: 1 },
        { from: "C-01", to: "C-03", relation: "confirmed", declared: true, observed: 2 },
      ],
    });
    const { rollup, issues } = parseRollup(payload);
    expect(rollup?.components.map((c) => c.id)).toEqual(["C-01", "C-03"]);
    expect(rollup?.filesByComponent.get("C-01")).toBe(3);
    expect(rollup?.edges).toHaveLength(1);
    expect(issues.map((i) => i.kind)).toEqual([
      "rollup-entry",
      "rollup-entry",
      "rollup-entry",
      "rollup-entry",
    ]);
  });

  it("a hostile key is inert data (ADR-009: the lookup is a Map)", () => {
    const { rollup } = parseRollup(
      rollupPayload({ components: [{ id: "__proto__", files: 7 }] }),
    );
    expect(rollup?.filesByComponent.get("__proto__")).toBe(7);
    expect(({} as Record<string, unknown>)["files"]).toBeUndefined();
    expect(Object.getPrototypeOf({})).toBe(Object.prototype);
  });
});

// ------------------------------------------------------- the channel's fold

describe("the channel's outcomes", () => {
  beforeEach(() => __resetRollupForTests());

  it("every arm folds to a state, and the worst one is unfoldable", () => {
    expect(parseRollupOutcome({ kind: "noProject" })).toEqual({
      kind: "unavailable",
      reason: "noProject",
    });
    expect(parseRollupOutcome({ kind: "noGraph" })).toEqual({
      kind: "unavailable",
      reason: "noGraph",
    });
    expect(parseRollupOutcome({ kind: "unreadable", message: "bad json" })).toEqual({
      kind: "unavailable",
      reason: "unreadable",
      message: "bad json",
    });
    for (const junk of [null, 42, "ready", { kind: "somethingNew" }, {}]) {
      expect(parseRollupOutcome(junk)).toEqual({ kind: "unavailable", reason: "unfoldable" });
    }
    const ready = parseRollupOutcome(
      { kind: "ready", rollup: rollupPayload(), graphBytes: 1_499_011 },
      12_345,
    );
    expect(ready.kind).toBe("ready");
    if (ready.kind !== "ready") throw new Error("unreachable");
    expect(ready.graphBytes).toBe(1_499_011);
    expect(ready.measuredAtMs).toBe(12_345);
    expect(ready.rollup.stats.files).toBe(355);
  });

  it("a ready arm carrying a rollup this build cannot read is unfoldable, not ready", () => {
    expect(parseRollupOutcome({ kind: "ready", rollup: { schema: 99 } })).toEqual({
      kind: "unavailable",
      reason: "unfoldable",
    });
  });

  it("every unavailable reason has exactly one fixed sentence", () => {
    const reasons = [
      "noProject",
      "noDocs",
      "noGraph",
      "unreadable",
      "notTauri",
      "unfoldable",
    ] as const;
    const sentences = reasons.map((r) => rollupUnavailableSentence(r));
    expect(new Set(sentences).size).toBe(reasons.length);
    for (const sentence of sentences) expect(sentence.length).toBeGreaterThan(0);
  });

  it("the store folds through one spelling and publishes to subscribers", () => {
    expect(getRollupState()).toEqual({ kind: "loading" });
    applyRollupPayload({ kind: "ready", rollup: rollupPayload(), graphBytes: 10 }, 1);
    expect(getRollupState().kind).toBe("ready");
  });

  it("without a Tauri runtime the channel answers notTauri and never overwrites a fold", async () => {
    const first = await loadRollup();
    expect(first).toEqual({ kind: "unavailable", reason: "notTauri" });
    // A state something else already folded must survive the browser
    // branch — the `loadChurn` rule, and the reason a headless body can
    // seed the store at all.
    applyRollupPayload({ kind: "ready", rollup: rollupPayload(), graphBytes: 10 }, 1);
    expect((await loadRollup()).kind).toBe("ready");
    expect((await loadDetail(componentTarget("C-01"))).kind).toBe("unavailable");
  });
});

// ------------------------------------------------------------- the pull

describe("the pull's answers", () => {
  it("a refusal is an ANSWER and never an empty list", () => {
    const folded = parseDetailOutcome({
      kind: "answered",
      detail: { kind: "unknown", target: "c:C-99" },
    });
    expect(folded).toEqual({
      kind: "answered",
      detail: { kind: "unknown", target: "c:C-99" },
    });
    // The distinction this exists for: a component that really has no
    // files answers `component` with an empty list, and the two must not
    // fold to the same thing.
    const empty = parseDetailOutcome({
      kind: "answered",
      detail: { kind: "component", id: "C-04", files: [], total: 0, truncated: false, intra: [] },
    });
    expect(empty).not.toEqual(folded);
    expect(empty.kind === "answered" && empty.detail.kind).toBe("component");
  });

  it("a channel failure and a refusal are different states", () => {
    expect(parseDetailOutcome({ kind: "noGraph" })).toEqual({
      kind: "unavailable",
      reason: "noGraph",
    });
    expect(parseDetailOutcome({ kind: "answered", detail: { kind: "nope" } })).toEqual({
      kind: "unavailable",
      reason: "unfoldable",
    });
  });

  it("a component answer carries its clipped slice and its honest total", () => {
    const { detail } = parseDetail({
      kind: "component",
      id: "C-01",
      files: ["a/x.ts", "a/y.ts"],
      total: 340,
      truncated: true,
      intra: [["a/y.ts", "a/x.ts"]],
      intraTruncated: false,
    });
    expect(detail).toEqual({
      kind: "component",
      id: "C-01",
      files: ["a/x.ts", "a/y.ts"],
      total: 340,
      truncated: true,
      intra: [["a/y.ts", "a/x.ts"]],
      intraTruncated: false,
    });
  });

  it("truncation is derived when the producer forgot to say so", () => {
    const { detail } = parseDetail({
      kind: "component",
      id: "C-01",
      files: ["a/x.ts"],
      total: 9,
      intra: [],
    });
    expect(detail?.kind === "component" && detail.truncated).toBe(true);
  });
});

// ------------------------------------- the slice, and the renderers over it

/** A file answer in the shape `arch_detail` serializes. */
function fileAnswer(path: string, imports: string[], symbols: string[]): ArchDetail {
  return {
    kind: "file",
    path,
    lang: "ts",
    loc: 42,
    hash: `blake3:${"0".repeat(64)}`,
    rows: {
      symbols: symbols.map((name) => ({
        id: `s:${path}#${name}`,
        name,
        kind: "const",
        exported: true,
        range: [1, 2],
      })),
      edges: [
        ...imports.map((to) => ({ from: `f:${path}`, to: `f:${to}`, kind: "import" })),
        // An inbound CALL edge from a file this pane has not pulled: the
        // endpoint is a symbol whose file is unknown here, and it must
        // still survive so the reference count is right.
        { from: "b/other.ts", to: path, kind: "x" }, // malformed on purpose
        {
          from: `s:b/other.ts#caller`,
          to: `s:${path}#${symbols[0] ?? "none"}`,
          kind: "call",
        },
      ],
      packages: [],
      unresolved: [{ from: `f:${path}`, specifier: "./gone", reason: "not_found" }],
      neighbours: [path, ...imports, "b/other.ts"],
    },
  };
}

describe("the slice of the graph the pane assembled", () => {
  it("is empty when nothing has been pulled", () => {
    expect(partialGraph([])).toBeUndefined();
  });

  it("rebuilds one file's neighbourhood well enough for the T2 panel", () => {
    const answer = fileAnswer("a/x.ts", ["a/dep.ts"], ["thing"]);
    const result = partialGraph([answer]);
    expect(result?.graph).toBeDefined();
    const graph = result?.graph;
    if (graph === undefined) throw new Error("unreachable");
    expect(graph.filesById.get("f:a/x.ts")?.loc).toBe(42);
    expect(graph.filesById.get("f:a/x.ts")?.symbols.map((s) => s.name)).toEqual(["thing"]);
    // A neighbour is a STUB — present so its edges survive referential
    // integrity, and never claiming a loc it does not know.
    expect(graph.filesById.get("f:a/dep.ts")?.loc).toBe(0);

    const derived = deriveArchitecture({
      components: componentsOf([["C-01", ["a/**"], []]]),
      graph,
      tasks: [],
    });
    const detail = fileDetail("a/x.ts", derived, graph);
    expect(detail.missing).toBe(false);
    expect(detail.loc).toBe(42);
    expect(detail.symbols.map((s) => s.name)).toEqual(["thing"]);
    expect(detail.symbols[0]?.refs).toBe(1); // the inbound call survived
    expect(detail.edges.map((e) => e.kind)).toContain("import");
    expect(detail.unresolved).toEqual(["./gone"]);
  });

  it("a component answer rebuilds its rows and its internal edges (T1)", () => {
    const answer: ArchDetail = {
      kind: "component",
      id: "C-01",
      files: ["a/x.ts", "a/y.ts", "a/z.ts"],
      total: 3,
      truncated: false,
      intra: [["a/y.ts", "a/x.ts"]],
      intraTruncated: false,
    };
    const graph = partialGraph([answer])?.graph;
    if (graph === undefined) throw new Error("unreachable");
    const derived = deriveArchitecture({
      components: componentsOf([["C-01", ["a/**"], []]]),
      graph,
      tasks: [],
    });
    expect(intraEdges("C-01", derived, graph)).toEqual([{ from: "a/y.ts", to: "a/x.ts" }]);
    expect(expansionFor(["a/x.ts", "a/y.ts", "a/z.ts"]).height).toBeGreaterThan(0);
  });
});

// --------------------------------------------- the trade, asserted

describe("the resting model names no file, and a pull names exactly one thing's", () => {
  const components = componentsOf([
    ["C-01", ["a/**"], ["C-02"]],
    ["C-02", ["b/**"], []],
  ]);

  it("derives the whole map from counts, with every file list empty", () => {
    const { rollup } = parseRollup(rollupPayload());
    if (rollup === undefined) throw new Error("unreachable");
    const derived = deriveArchitecture({ components, rollup, tasks: [] });

    // THE MAP IS THERE: every node, every edge, every finding.
    expect(derived.mode).toBe("full");
    expect(derived.indexNotRun).toBe(false);
    expect(derived.components.map((c) => c.id)).toEqual(["C-01", "C-02", "C-99", UNMAPPED_ID]);
    expect(derived.edges.map((e) => [e.from, e.to, e.relation, e.observedCount])).toEqual([
      ["C-01", "C-02", "confirmed", 27],
      ["C-01", UNMAPPED_ID, "undeclared", 4],
      ["C-02", "C-99", "planned", 0],
    ]);
    expect(derived.findings.map((f) => f.id)).toEqual([
      "D1:C-01->unmapped",
      "D2:unmapped",
      "D4",
      "D5:C-02->C-99",
    ]);
    // The dangling depends_on still draws its placeholder node.
    expect(derived.components.find((c) => c.id === "C-99")?.kind).toBe("placeholder");

    // AND THE COUNTS ARE EXACT.
    expect(derived.components.find((c) => c.id === "C-01")?.fileCount).toBe(340);
    expect(derived.components.find((c) => c.id === UNMAPPED_ID)?.fileCount).toBe(3);
    expect(derived.indexedFileCount).toBe(355);
    expect(derived.unmappedCount).toBe(3);

    // AND NOT ONE FILE PATH TRAVELLED.
    expect(derived.components.every((c) => c.files.length === 0)).toBe(true);
    expect(derived.fileComponent.size).toBe(0);
    expect(derived.unmappedFiles).toEqual([]);
  });

  it("a count is never rendered as a stated zero when the list is absent", () => {
    const { rollup } = parseRollup(rollupPayload());
    if (rollup === undefined) throw new Error("unreachable");
    const derived = deriveArchitecture({ components, rollup, tasks: [] });
    const d2 = derived.findings.find((f) => f.rule === "D2");
    const d4 = derived.findings.find((f) => f.rule === "D4");
    if (d2 === undefined || d4 === undefined) throw new Error("unreachable");
    // The FACT survives with its real number...
    expect(findingText(d2).sentence).toBe("3 files claimed by no component.");
    expect(findingText(d4).sentence).toBe("6 paths claimed by more than one component.");
    // ...and the evidence line is ABSENT rather than an empty or wrong one.
    expect(findingText(d2).evidence).toBeUndefined();
    expect(findingText(d4).evidence).toBeUndefined();
    // Control: with the list present, both halves render as they always did.
    expect(
      findingText({ rule: "D2", id: "D2:unmapped", files: ["a/x.ts", "a/y.ts"], count: 2 })
        .evidence,
    ).toBe("x.ts · y.ts");
  });

  it("the status and provenance join stays TypeScript's (ADR-015), rollup or not", () => {
    const { rollup } = parseRollup(rollupPayload());
    if (rollup === undefined) throw new Error("unreachable");
    const withPinned: ComponentRecord[] = componentsOf([
      ["C-01", ["a/**"], ["C-02"]],
      ["C-02", ["b/**"], []],
    ]).map((c, index) => (index === 0 ? { ...c, status: "done" as const } : c));
    const derived = deriveArchitecture({ components: withPinned, rollup, tasks: [] });
    const c1 = derived.components.find((c) => c.id === "C-01");
    expect(c1?.pinned).toBe(true);
    expect(c1?.status).toBe("done");
    expect(c1?.autoStatus).toBe("planned"); // no tasks: the rollup said nothing about it
    // And the component RECORD is carried, so the panel's prose is there.
    expect(c1?.record?.name).toBe("C-01 component");
  });

  it("a declared component the indexer saw no file for is declaredOnly, from the count alone", () => {
    const { rollup } = parseRollup(
      rollupPayload({
        components: [
          { id: "C-01", files: 340 },
          { id: "C-02", files: 0 },
        ],
        findings: [{ rule: "D3", id: "D3:C-02", component: "C-02" }],
        stats: { files: 340, symbols: 1, edges: 1, components: 2, mapped: 340, unmapped: 0 },
      }),
    );
    if (rollup === undefined) throw new Error("unreachable");
    const derived = deriveArchitecture({ components, rollup, tasks: [] });
    expect(derived.components.find((c) => c.id === "C-02")?.declaredOnly).toBe(true);
    expect(derived.components.find((c) => c.id === "C-01")?.declaredOnly).toBe(false);
    // No unclaimed territory: no synthetic node, and no D2.
    expect(derived.components.some((c) => c.kind === "unmapped")).toBe(false);
    expect(derived.findings.map((f) => f.rule)).toEqual(["D3"]);
  });

  it("the target grammar is spelled once and is a key, not a path", () => {
    expect(componentTarget("C-01")).toBe("c:C-01");
    expect(fileTarget("app/src/main.ts")).toBe("f:app/src/main.ts");
  });
});
