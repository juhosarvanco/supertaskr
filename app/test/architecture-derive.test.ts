import { describe, expect, it } from "vitest";
import {
  parseComponentsFromFiles,
  parseTaskFile,
  type ComponentRecord,
  type TaskRecord,
} from "@nputer/parser/pure";
import {
  deriveArchitecture,
  rollupProvenance,
  rollupStatus,
  UNMAPPED_ID,
  type DerivedArchitecture,
  type DerivedTaskRef,
} from "../src/lib/architecture/derive";
import { parseGraph, type ArchGraph } from "../src/lib/architecture/graph";

// The derivation engine (T-011): every rollup rule, every §4.2 relation
// cell, every drift rule D1–D5, both degraded states, ADR-009 hostile
// keys, and the package.path join. Fixtures go through the REAL parser
// (the T-004 pattern) so these pin frontmatter → derived-model behavior.

// ---------------------------------------------------------------- fixtures

interface ComponentSpec {
  name?: string;
  layer?: string;
  paths: string[];
  dependsOn?: string[];
  touchSlugs?: string[];
  status?: string;
  nonCode?: boolean;
}

function componentFile(id: string, spec: ComponentSpec): { path: string; content: string } {
  const lines = [
    "---",
    `id: ${id}`,
    `name: ${spec.name ?? `${id} component`}`,
    ...(spec.layer !== undefined ? [`layer: ${spec.layer}`] : []),
    "paths:",
    ...spec.paths.map((p) => `  - "${p}"`),
    ...(spec.dependsOn !== undefined ? [`depends_on: [${spec.dependsOn.join(", ")}]`] : []),
    ...(spec.touchSlugs !== undefined ? [`touch_slugs: [${spec.touchSlugs.join(", ")}]`] : []),
    ...(spec.status !== undefined ? [`status: ${spec.status}`] : []),
    ...(spec.nonCode !== undefined ? [`non_code: ${spec.nonCode}`] : []),
    "---",
    `Responsibility of ${id}.`,
  ];
  return {
    path: `docs/architecture/components/${id}-x.md`,
    content: lines.join("\n") + "\n",
  };
}

/** Parse component fixtures through the real parser; assert cleanliness
 * unless the fixture is deliberately dirty (dangling refs etc.). */
function componentsOf(
  specs: [id: string, spec: ComponentSpec][],
  opts: { allowIssues?: boolean } = {},
): ComponentRecord[] {
  const result = parseComponentsFromFiles(specs.map(([id, spec]) => componentFile(id, spec)));
  if (opts.allowIssues !== true) expect(result.issues).toEqual([]);
  return result.components;
}

interface TaskSpec {
  status: string;
  touches?: string[];
  review?: string;
  title?: string;
  extraLines?: string[];
}

let taskCounter = 0;

function taskOf(id: string | undefined, spec: TaskSpec): TaskRecord {
  taskCounter += 1;
  const file = `docs/tasks/${id ?? `T-x${taskCounter}`}-fixture.md`;
  const committed = !["suggested", "parked"].includes(spec.status);
  const lines = [
    "---",
    ...(id !== undefined ? [`id: ${id}`] : []),
    `title: ${spec.title ?? `Task ${id ?? taskCounter}`}`,
    `status: ${spec.status}`,
    ...(committed
      ? ["feature: F-01", "milestone: 1", `priority: ${taskCounter}`, "size: S"]
      : []),
    ...(spec.status === "suggested" ? ["suggested_by: test"] : []),
    ...(spec.touches !== undefined ? [`touches: [${spec.touches.join(", ")}]`] : []),
    ...(spec.review !== undefined ? [`review: ${spec.review}`] : []),
    ...(spec.extraLines ?? []),
    "---",
    "",
  ];
  const result = parseTaskFile(lines.join("\n"), file);
  expect(result.task).toBeDefined();
  return result.task as TaskRecord;
}

interface GraphFileSpec {
  path: string;
  /** Import targets: another file path, or `p:<name>` for a package. */
  imports?: string[];
}

function graphOf(
  files: GraphFileSpec[],
  packages: { name: string; path?: string }[] = [],
): ArchGraph {
  const value = {
    schema: 1,
    root: ".",
    languages: ["ts"],
    files: files
      .map(({ path }) => ({ id: `f:${path}`, path, lang: "ts", loc: 1, symbols: [] }))
      .sort((a, b) => (a.path < b.path ? -1 : 1)),
    packages: packages
      .map((pkg) => ({ id: `p:${pkg.name}`, name: pkg.name, ecosystem: "npm", ...(pkg.path !== undefined ? { path: pkg.path } : {}) }))
      .sort((a, b) => (a.id < b.id ? -1 : 1)),
    edges: files
      .flatMap(({ path, imports = [] }) =>
        imports.map((target) => ({
          from: `f:${path}`,
          to: target.startsWith("p:") ? target : `f:${target}`,
          kind: "import",
        })),
      )
      .sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : a.to < b.to ? -1 : 1)),
    unresolved: [],
  };
  const { graph, issues } = parseGraph(JSON.stringify(value));
  expect(issues).toEqual([]);
  expect(graph).toBeDefined();
  return graph as ArchGraph;
}

const edgeOf = (model: DerivedArchitecture, from: string, to: string) =>
  model.edges.find((edge) => edge.from === from && edge.to === to);

// ------------------------------------------------------------- §4.3 rollup

describe("rollupStatus (§4.3, first rule wins)", () => {
  const cases: [statuses: string[], expected: string][] = [
    [[], "planned"],
    [["done"], "done"],
    [["done", "done", "done"], "done"],
    [["rejected", "verifying", "building", "merging", "done"], "rejected"],
    [["verifying", "building", "merging", "done"], "verifying"],
    [["building", "merging", "done"], "building"],
    [["merging", "done"], "merging"],
    [["done", "planned"], "planned"],
    [["planned"], "planned"],
    [["planned", "building"], "building"],
    // suggested/parked never participate:
    [["suggested"], "planned"],
    [["parked"], "planned"],
    [["done", "parked"], "done"],
    [["done", "suggested"], "done"],
    [["rejected", "suggested"], "rejected"],
  ];
  for (const [statuses, expected] of cases) {
    it(`[${statuses.join(", ")}] -> ${expected}`, () => {
      expect(rollupStatus(statuses as Parameters<typeof rollupStatus>[0])).toBe(expected);
    });
  }
});

// -------------------------------------------------------- §4.4 provenance

describe("rollupProvenance (§4.4, weakest done wins)", () => {
  const ref = (status: string, review?: string): DerivedTaskRef => ({
    title: "t",
    status: status as DerivedTaskRef["status"],
    file: "docs/tasks/T-x.md",
    inRollup: true,
    ...(review !== undefined ? { review: review as DerivedTaskRef["review"] } : {}),
  });

  it("no done tasks -> undefined", () => {
    expect(rollupProvenance([])).toBeUndefined();
    expect(rollupProvenance([ref("building", "independent")])).toBeUndefined();
  });

  it("single done keeps its mode", () => {
    expect(rollupProvenance([ref("done", "independent")])).toBe("independent");
    expect(rollupProvenance([ref("done", "same-model")])).toBe("same-model");
    expect(rollupProvenance([ref("done", "self-verified")])).toBe("self-verified");
  });

  it("weakest wins across done tasks", () => {
    expect(rollupProvenance([ref("done", "independent"), ref("done", "same-model")])).toBe(
      "same-model",
    );
    expect(rollupProvenance([ref("done", "same-model"), ref("done", "self-verified")])).toBe(
      "self-verified",
    );
    expect(
      rollupProvenance([
        ref("done", "independent"),
        ref("done", "self-verified"),
        ref("done", "same-model"),
      ]),
    ).toBe("self-verified");
  });

  it("a done task with no review stamp is weakest of all: unreviewed", () => {
    expect(rollupProvenance([ref("done")])).toBe("unreviewed");
    expect(rollupProvenance([ref("done", "independent"), ref("done")])).toBe("unreviewed");
  });

  it("non-done statuses never contribute, even reviewed", () => {
    expect(rollupProvenance([ref("done", "independent"), ref("merging", "self-verified")])).toBe(
      "independent",
    );
  });
});

// ------------------------------------------------- task set + pin + ADR-009

describe("component task sets and status", () => {
  it("touches ∩ touch_slugs pulls tasks in; rollup and provenance follow", () => {
    const components = componentsOf([
      ["C-01", { paths: ["a/**"], touchSlugs: ["alpha"] }],
      ["C-02", { paths: ["b/**"], touchSlugs: ["beta", "gamma"] }],
    ]);
    const tasks = [
      taskOf("T-001", { status: "done", touches: ["alpha"], review: "independent" }),
      taskOf("T-002", { status: "building", touches: ["beta"] }),
      taskOf("T-003", { status: "done", touches: ["gamma", "alpha"], review: "same-model" }),
      taskOf("T-004", { status: "done", touches: ["delta"], review: "independent" }),
    ];
    const model = deriveArchitecture({ components, tasks });
    const [c1, c2] = model.components;
    expect(c1?.tasks.map((t) => t.id)).toEqual(["T-003", "T-001"]); // newest first
    expect(c1?.status).toBe("done");
    expect(c1?.provenance).toBe("same-model"); // weakest of T-001/T-003
    expect(c2?.tasks.map((t) => t.id)).toEqual(["T-003", "T-002"]);
    expect(c2?.status).toBe("building");
    expect(c2?.provenance).toBe("same-model"); // T-003 is its only done task
  });

  it("the component: extra field pulls tasks without slug overlap (string and list)", () => {
    const components = componentsOf([["C-08", { paths: ["a/**"], touchSlugs: ["alpha"] }]]);
    const tasks = [
      taskOf("T-010", { status: "building", touches: ["other"], extraLines: ["component: C-08"] }),
      taskOf("T-011", { status: "planned", touches: [], extraLines: ["component: [C-07, C-08]"] }),
      taskOf("T-012", { status: "planned", touches: [], extraLines: ["component: C-09"] }),
    ];
    const model = deriveArchitecture({ components, tasks });
    expect(model.components[0]?.tasks.map((t) => t.id)).toEqual(["T-011", "T-010"]);
    expect(model.components[0]?.status).toBe("building");
  });

  it("suggested and parked tasks are listed but never roll up", () => {
    const components = componentsOf([["C-01", { paths: ["a/**"], touchSlugs: ["alpha"] }]]);
    const tasks = [
      taskOf("T-001", { status: "done", touches: ["alpha"], review: "independent" }),
      taskOf(undefined, { status: "suggested", touches: ["alpha"], title: "a ghost" }),
      taskOf("T-002", { status: "parked", touches: ["alpha"] }),
    ];
    const model = deriveArchitecture({ components, tasks });
    const component = model.components[0];
    expect(component?.tasks).toHaveLength(3);
    expect(component?.tasks.filter((t) => t.inRollup).map((t) => t.id)).toEqual(["T-001"]);
    expect(component?.status).toBe("done"); // ghosts don't drag it to planned
    // id-less suggestion sorts last.
    expect(component?.tasks[2]?.title).toBe("a ghost");
  });

  it("a status pin overrides the rollup; autoStatus stays explainable", () => {
    const components = componentsOf([
      ["C-01", { paths: ["a/**"], touchSlugs: ["alpha"], status: "done" }],
    ]);
    const tasks = [taskOf("T-001", { status: "building", touches: ["alpha"] })];
    const model = deriveArchitecture({ components, tasks });
    expect(model.components[0]?.status).toBe("done");
    expect(model.components[0]?.pinned).toBe(true);
    expect(model.components[0]?.autoStatus).toBe("building");
  });

  it("ADR-009: hostile slugs and component refs stay inert data", () => {
    const components = componentsOf([
      ["C-01", { paths: ["a/**"], touchSlugs: ["__proto__", "constructor"] }],
    ]);
    const tasks = [
      taskOf("T-001", { status: "building", touches: ["__proto__"] }),
      taskOf("T-002", { status: "done", touches: ["constructor"], review: "independent" }),
      taskOf("T-003", { status: "planned", touches: [], extraLines: ["component: __proto__"] }),
    ];
    const model = deriveArchitecture({ components, tasks });
    expect(model.components[0]?.tasks.map((t) => t.id)).toEqual(["T-002", "T-001"]);
    expect(model.components[0]?.status).toBe("building");
    expect(({} as Record<string, unknown>)["alpha"]).toBeUndefined();
  });
});

// ------------------------------------------------ mapping + §4.2 relations

describe("file→component mapping", () => {
  it("first match by NUMERIC id order wins (C-09 beats C-100)", () => {
    const components = componentsOf(
      [
        ["C-100", { paths: ["src/**"] }],
        ["C-09", { paths: ["src/deep/**"] }],
      ],
      { allowIssues: true }, // parse time already flags the textual src/** ⊃ src/deep/**
    );
    const graph = graphOf([{ path: "src/deep/x.ts" }, { path: "src/top.ts" }]);
    const model = deriveArchitecture({ components, graph, tasks: [] });
    expect(model.components.map((c) => c.id)).toEqual(["C-09", "C-100"]);
    expect(model.fileComponent.get("src/deep/x.ts")).toBe("C-09");
    expect(model.fileComponent.get("src/top.ts")).toBe("C-100");
  });

  it("no match -> unmapped node + D2 grouping every unclaimed file", () => {
    const components = componentsOf([["C-01", { paths: ["src/**"] }]]);
    const graph = graphOf([
      { path: "src/in.ts" },
      { path: "stray/a.ts" },
      { path: "stray/b.ts" },
    ]);
    const model = deriveArchitecture({ components, graph, tasks: [] });
    expect(model.unmappedFiles).toEqual(["stray/a.ts", "stray/b.ts"]);
    expect(model.findings).toEqual([
      { rule: "D2", id: "D2:unmapped", files: ["stray/a.ts", "stray/b.ts"] },
    ]);
    const unmapped = model.components.find((c) => c.id === UNMAPPED_ID);
    expect(unmapped?.kind).toBe("unmapped");
    expect(unmapped?.hasDrift).toBe(true);
    expect(model.components[model.components.length - 1]?.id).toBe(UNMAPPED_ID); // sorts last
  });

  it("D4: a doubly-claimed file keeps first-by-id and reports through the T-008 issue kind", () => {
    const components = componentsOf([
      ["C-01", { paths: ["src/*.ts"] }],
      ["C-02", { paths: ["**/x.ts"] }], // textually disjoint: parse time cannot prove overlap
    ]);
    const graph = graphOf([{ path: "src/x.ts" }, { path: "src/y.ts" }]);
    const model = deriveArchitecture({ components, graph, tasks: [] });
    expect(model.fileComponent.get("src/x.ts")).toBe("C-01");
    expect(model.findings).toEqual([
      // The loser ends up ASSIGNED nothing, so declared_only fires too:
      // D3 is about ownership after first-by-id assignment (§4.1), and
      // the D4 beside it explains exactly why the claim was lost.
      { rule: "D3", id: "D3:C-02", component: "C-02", informational: false },
      { rule: "D4", id: "D4:src/x.ts", path: "src/x.ts", ids: ["C-01", "C-02"] },
    ]);
    expect(model.issues).toEqual([
      {
        kind: "ambiguous-mapping",
        ids: ["C-01", "C-02"],
        files: ["docs/architecture/components/C-01-x.md", "docs/architecture/components/C-02-x.md"],
        patterns: ["src/*.ts", "**/x.ts"],
        message: expect.stringContaining("src/x.ts"),
      },
    ]);
  });

  it("D4 with three claimants emits pairwise issues, winner first", () => {
    const components = componentsOf([
      ["C-01", { paths: ["src/*.ts"] }],
      ["C-02", { paths: ["**/x.ts"] }],
      ["C-03", { paths: ["*.ts"] }],
    ]);
    const graph = graphOf([{ path: "src/x.ts" }]);
    const model = deriveArchitecture({ components, graph, tasks: [] });
    expect(model.findings.map((f) => f.id)).toEqual(["D3:C-02", "D3:C-03", "D4:src/x.ts"]);
    expect(model.findings[2]).toMatchObject({ ids: ["C-01", "C-02", "C-03"] });
    expect(model.issues).toHaveLength(2);
    expect(model.issues.map((issue) => (issue.kind === "ambiguous-mapping" ? issue.ids : []))).toEqual(
      [
        ["C-01", "C-02"],
        ["C-01", "C-03"],
      ],
    );
  });

  it("negations inside paths un-claim (gitignore last-match-wins)", () => {
    const components = componentsOf(
      [
        ["C-01", { paths: ["app/**", "!app/test/**"] }],
        ["C-02", { paths: ["app/test/**"] }],
      ],
      // Parse time flags the textual app/** ⊃ app/test/** overapproximation
      // (negations never participate there — the T-008 honesty pin); the
      // file-level truth computed here shows no actual ambiguity.
      { allowIssues: true },
    );
    const graph = graphOf([{ path: "app/src/a.ts" }, { path: "app/test/b.ts" }]);
    const model = deriveArchitecture({ components, graph, tasks: [] });
    expect(model.fileComponent.get("app/src/a.ts")).toBe("C-01");
    expect(model.fileComponent.get("app/test/b.ts")).toBe("C-02");
    expect(model.findings).toEqual([]); // no ambiguity: C-01 un-claimed the test tree
  });
});

describe("component edges (§4.2 relation table)", () => {
  const components = () =>
    componentsOf([
      ["C-01", { paths: ["a/**"], dependsOn: ["C-02", "C-03"] }],
      ["C-02", { paths: ["b/**"] }],
      ["C-03", { paths: ["c/**"] }],
    ]);

  it("declared ∧ observed -> confirmed, with the file edges behind it", () => {
    const graph = graphOf([
      { path: "a/one.ts", imports: ["b/x.ts"] },
      { path: "a/two.ts", imports: ["b/x.ts"] },
      { path: "b/x.ts" },
    ]);
    const model = deriveArchitecture({ components: components(), graph, tasks: [] });
    const edge = edgeOf(model, "C-01", "C-02");
    expect(edge?.relation).toBe("confirmed");
    expect(edge?.declared).toBe(true);
    expect(edge?.observedCount).toBe(2);
    expect(edge?.fileEdges).toEqual([
      { from: "a/one.ts", to: "b/x.ts" },
      { from: "a/two.ts", to: "b/x.ts" },
    ]);
  });

  it("declared ∧ ¬observed -> planned", () => {
    const graph = graphOf([{ path: "a/one.ts" }, { path: "c/z.ts" }]);
    const model = deriveArchitecture({ components: components(), graph, tasks: [] });
    const edge = edgeOf(model, "C-01", "C-03");
    expect(edge?.relation).toBe("planned");
    expect(edge?.observedCount).toBe(0);
    expect(edge?.fileEdges).toEqual([]);
  });

  it("¬declared ∧ observed -> undeclared drift + D1 with files and a stable id", () => {
    const graph = graphOf([
      { path: "b/x.ts", imports: ["c/z.ts"] },
      { path: "c/z.ts" },
    ]);
    const model = deriveArchitecture({ components: components(), graph, tasks: [] });
    const edge = edgeOf(model, "C-02", "C-03");
    expect(edge?.relation).toBe("undeclared");
    expect(edge?.declared).toBe(false);
    expect(model.findings).toContainEqual({
      rule: "D1",
      id: "D1:C-02->C-03",
      from: "C-02",
      to: "C-03",
      fileEdges: [{ from: "b/x.ts", to: "c/z.ts" }],
    });
    const c2 = model.components.find((c) => c.id === "C-02");
    expect(c2?.hasDrift).toBe(true); // source of a D1
    expect(model.components.find((c) => c.id === "C-03")?.hasDrift).toBe(false);
  });

  it("imports within one component make no edge", () => {
    const graph = graphOf([
      { path: "a/one.ts", imports: ["a/two.ts"] },
      { path: "a/two.ts" },
    ]);
    const model = deriveArchitecture({ components: components(), graph, tasks: [] });
    expect(model.edges.filter((e) => e.observedCount > 0)).toEqual([]);
  });

  it("edges to and from unmapped files are always undeclared, never D1", () => {
    const graph = graphOf([
      { path: "a/one.ts", imports: ["stray/s.ts"] },
      { path: "stray/s.ts", imports: ["b/x.ts"] },
      { path: "b/x.ts" },
      { path: "c/z.ts" }, // keeps C-03 matched so no D3 muddies the assertion
    ]);
    const model = deriveArchitecture({ components: components(), graph, tasks: [] });
    expect(edgeOf(model, "C-01", UNMAPPED_ID)?.relation).toBe("undeclared");
    expect(edgeOf(model, UNMAPPED_ID, "C-02")?.relation).toBe("undeclared");
    // The finding channel for unmapped territory is D2, not D1.
    expect(model.findings.map((f) => f.rule)).toEqual(["D2"]);
  });
});

describe("the package.path join (T-009 §6.6 seam, consumed here)", () => {
  it("declared dep + file:-dep package edge -> confirmed component edge", () => {
    const components = componentsOf([
      ["C-05", { paths: ["app/**"], dependsOn: ["C-06"] }],
      ["C-06", { paths: ["lib/parser/**"] }],
    ]);
    const graph = graphOf(
      [{ path: "app/model.ts", imports: ["p:@nputer/parser"] }, { path: "lib/parser/src/index.ts" }],
      [{ name: "@nputer/parser", path: "lib/parser" }],
    );
    const model = deriveArchitecture({ components, graph, tasks: [] });
    const edge = edgeOf(model, "C-05", "C-06");
    expect(edge?.relation).toBe("confirmed"); // NOT planned: the seam is consumed
    expect(edge?.fileEdges).toEqual([
      { from: "app/model.ts", to: "lib/parser", package: "p:@nputer/parser" },
    ]);
  });

  it("undeclared package-join edges are drift like any other observed edge", () => {
    const components = componentsOf([
      ["C-05", { paths: ["app/**"] }],
      ["C-06", { paths: ["lib/parser/**"] }],
    ]);
    const graph = graphOf(
      [{ path: "app/model.ts", imports: ["p:@nputer/parser"] }, { path: "lib/parser/src/index.ts" }],
      [{ name: "@nputer/parser", path: "lib/parser" }],
    );
    const model = deriveArchitecture({ components, graph, tasks: [] });
    expect(edgeOf(model, "C-05", "C-06")?.relation).toBe("undeclared");
    expect(model.findings.map((f) => f.id)).toContain("D1:C-05->C-06");
  });

  it("packages without a repo path stay external: no component edge", () => {
    const components = componentsOf([["C-05", { paths: ["app/**"] }]]);
    const graph = graphOf(
      [{ path: "app/model.ts", imports: ["p:react"] }],
      [{ name: "react" }],
    );
    const model = deriveArchitecture({ components, graph, tasks: [] });
    expect(model.edges).toEqual([]);
  });

  it("a package path inside the component itself makes no self edge", () => {
    const components = componentsOf([["C-05", { paths: ["app/**"] }]]);
    const graph = graphOf(
      [{ path: "app/model.ts", imports: ["p:selfdep"] }],
      [{ name: "selfdep", path: "app/vendored" }],
    );
    const model = deriveArchitecture({ components, graph, tasks: [] });
    expect(model.edges).toEqual([]);
  });

  it("a package path no component owns is unclaimed territory: D2 + unmapped edge", () => {
    const components = componentsOf([["C-05", { paths: ["app/**"] }]]);
    const graph = graphOf(
      [{ path: "app/model.ts", imports: ["p:@nputer/parser"] }],
      [{ name: "@nputer/parser", path: "lib/parser" }],
    );
    const model = deriveArchitecture({ components, graph, tasks: [] });
    const edge = edgeOf(model, "C-05", UNMAPPED_ID);
    expect(edge?.relation).toBe("undeclared");
    expect(edge?.fileEdges).toEqual([
      { from: "app/model.ts", to: "lib/parser", package: "p:@nputer/parser" },
    ]);
    expect(model.findings).toEqual([
      { rule: "D2", id: "D2:unmapped", files: ["lib/parser"] },
    ]);
    expect(model.components.find((c) => c.id === UNMAPPED_ID)).toBeDefined();
  });
});

// ------------------------------------------------------------ D3 + D5 rules

describe("D3 declared_only and D5 dangling depends_on", () => {
  it("D3: globs matching no indexed file flag the component", () => {
    const components = componentsOf([
      ["C-01", { paths: ["src/**"] }],
      ["C-02", { paths: ["ghost/**"] }],
    ]);
    const graph = graphOf([{ path: "src/a.ts" }]);
    const model = deriveArchitecture({ components, graph, tasks: [] });
    expect(model.findings).toEqual([
      { rule: "D3", id: "D3:C-02", component: "C-02", informational: false },
    ]);
    const c2 = model.components.find((c) => c.id === "C-02");
    expect(c2?.declaredOnly).toBe(true);
    expect(c2?.hasDrift).toBe(true);
    expect(c2?.nonCode).toBe(false);
  });

  it("D3 on a non_code component is INFORMATIONAL: still reported, no longer drift (T-033)", () => {
    // THE POSITIVE CONTROL IS C-02, IN THIS SAME BODY: two components
    // whose globs both match nothing, differing ONLY in the opt-in flag.
    // Without that pair, "C-03 has no ring" would be satisfied equally by
    // a derivation that had stopped emitting D3 altogether. (The globs are
    // spelled differently on purpose — two identical `paths` sets are a
    // parse-time `ambiguous-mapping` issue, which would be a second
    // reason for the body to move.)
    const components = componentsOf([
      ["C-01", { paths: ["src/**"] }],
      ["C-02", { paths: ["ghost/**"] }],
      ["C-03", { paths: ["phantom/**"], nonCode: true }],
    ]);
    const graph = graphOf([{ path: "src/a.ts" }]);
    const model = deriveArchitecture({ components, graph, tasks: [] });

    // BOTH findings are still emitted — the downgrade is not a deletion.
    expect(model.findings).toEqual([
      { rule: "D3", id: "D3:C-02", component: "C-02", informational: false },
      { rule: "D3", id: "D3:C-03", component: "C-03", informational: true },
    ]);

    const c2 = model.components.find((c) => c.id === "C-02");
    const c3 = model.components.find((c) => c.id === "C-03");
    // declaredOnly is a FACT about the file list and stays true for both.
    expect(c2?.declaredOnly).toBe(true);
    expect(c3?.declaredOnly).toBe(true);
    // hasDrift is the CLAIM, and only the un-flagged one makes it.
    expect(c2?.hasDrift).toBe(true);
    expect(c3?.hasDrift).toBe(false);
    expect(c3?.nonCode).toBe(true);
  });

  it("non_code NEVER comes from an empty file list — it is read off the record only", () => {
    // The C-15 property at derivation level: two components with no
    // indexed files, neither flagged, and the derivation must not decide
    // for either of them.
    const components = componentsOf([
      ["C-01", { paths: ["src/**"] }],
      ["C-02", { paths: ["ghost/**"] }],
      ["C-03", { paths: ["also-ghost/**"] }],
    ]);
    const graph = graphOf([{ path: "src/a.ts" }]);
    const model = deriveArchitecture({ components, graph, tasks: [] });
    for (const id of ["C-02", "C-03"]) {
      const c = model.components.find((x) => x.id === id);
      expect(c?.nonCode, id).toBe(false);
      expect(c?.hasDrift, id).toBe(true);
    }
    expect(model.findings.every((f) => f.rule === "D3" && !f.informational)).toBe(true);
  });

  it("D5: dangling depends_on draws a placeholder and a planned edge, never dropped", () => {
    const components = componentsOf(
      [["C-01", { paths: ["src/**"], dependsOn: ["C-99"] }]],
      { allowIssues: true }, // the parser flags the dangling ref at parse time too
    );
    const graph = graphOf([{ path: "src/a.ts" }]);
    const model = deriveArchitecture({ components, graph, tasks: [] });
    expect(model.findings).toEqual([{ rule: "D5", id: "D5:C-01->C-99", from: "C-01", to: "C-99" }]);
    const placeholder = model.components.find((c) => c.id === "C-99");
    expect(placeholder?.kind).toBe("placeholder");
    expect(edgeOf(model, "C-01", "C-99")?.relation).toBe("planned");
    expect(model.components.find((c) => c.id === "C-01")?.hasDrift).toBe(true);
  });

  it("ADR-009: a dangling id of __proto__ stays an inert placeholder", () => {
    const components = componentsOf(
      [["C-01", { paths: ["src/**"], dependsOn: ["__proto__"] }]],
      { allowIssues: true },
    );
    const model = deriveArchitecture({ components, tasks: [] });
    expect(model.findings).toEqual([
      { rule: "D5", id: "D5:C-01->__proto__", from: "C-01", to: "__proto__" },
    ]);
    const placeholder = model.components.find((c) => c.id === "__proto__");
    expect(placeholder?.kind).toBe("placeholder");
    expect(({} as Record<string, unknown>)["kind"]).toBeUndefined(); // nothing inherited
  });

  it("hostile depends_on naming the literal synthetic id cannot launder drift", () => {
    const components = componentsOf(
      [["C-01", { paths: ["src/**"], dependsOn: ["unmapped"] }]],
      { allowIssues: true },
    );
    const graph = graphOf([{ path: "src/a.ts", imports: ["stray/s.ts"] }, { path: "stray/s.ts" }]);
    const model = deriveArchitecture({ components, graph, tasks: [] });
    const edge = edgeOf(model, "C-01", UNMAPPED_ID);
    // Observed edge into unmapped territory stays undeclared (§4.2 "always")
    // even though a depends_on names the literal string "unmapped".
    expect(edge?.relation).toBe("undeclared");
    expect(model.findings.map((f) => f.rule).sort()).toEqual(["D2", "D5"]);
  });
});

// ------------------------------------------------------------ degraded modes

describe("degraded: no graph (index not run)", () => {
  it("declared components only; every declared edge planned; statuses still roll", () => {
    const components = componentsOf([
      ["C-01", { paths: ["a/**"], dependsOn: ["C-02"], touchSlugs: ["alpha"] }],
      ["C-02", { paths: ["b/**"] }],
    ]);
    const tasks = [taskOf("T-001", { status: "verifying", touches: ["alpha"] })];
    const model = deriveArchitecture({ components, tasks });
    expect(model.mode).toBe("no-graph");
    expect(model.indexNotRun).toBe(true);
    expect(model.inferred).toBe(false);
    expect(model.components.map((c) => c.id)).toEqual(["C-01", "C-02"]);
    expect(model.edges).toEqual([
      {
        from: "C-01",
        to: "C-02",
        relation: "planned",
        declared: true,
        observedCount: 0,
        fileEdges: [],
      },
    ]);
    expect(model.components[0]?.status).toBe("verifying"); // tasks need no graph
    expect(model.components[0]?.files).toEqual([]);
    // No reality layer: no D1–D4, and no component is judged declared-only.
    expect(model.findings).toEqual([]);
    expect(model.components[0]?.declaredOnly).toBe(false);
  });

  it("D5 still fires without a graph (it is intent-only)", () => {
    const components = componentsOf(
      [["C-01", { paths: ["a/**"], dependsOn: ["C-77"] }]],
      { allowIssues: true },
    );
    const model = deriveArchitecture({ components, tasks: [] });
    expect(model.findings).toEqual([{ rule: "D5", id: "D5:C-01->C-77", from: "C-01", to: "C-77" }]);
  });
});

describe("degraded: no components (inferred pseudo-components)", () => {
  it("groups by top-level directory, flagged inferred, observed relations, zero findings", () => {
    const graph = graphOf(
      [
        { path: "app/src/a.ts", imports: ["lib/x.ts", "p:@nputer/parser", "p:react"] },
        { path: "app/src/b.ts", imports: ["app/src/a.ts"] },
        { path: "lib/x.ts" },
        { path: "lib/parser/y.ts" },
        { path: "rootfile.ts" },
      ],
      [{ name: "@nputer/parser", path: "lib/parser" }, { name: "react" }],
    );
    const model = deriveArchitecture({ components: [], graph, tasks: [] });
    expect(model.mode).toBe("no-components");
    expect(model.inferred).toBe(true);
    expect(model.indexNotRun).toBe(false);
    expect(model.components.map((c) => [c.id, c.kind, c.name])).toEqual([
      ["dir:.", "inferred", "(repo root)"],
      ["dir:app", "inferred", "app/"],
      ["dir:lib", "inferred", "lib/"],
    ]);
    expect(model.components[1]?.files).toEqual(["app/src/a.ts", "app/src/b.ts"]);
    // One edge app->lib carrying both the file import and the package join.
    expect(model.edges).toEqual([
      {
        from: "dir:app",
        to: "dir:lib",
        relation: "observed",
        declared: false,
        observedCount: 2,
        fileEdges: [
          { from: "app/src/a.ts", to: "lib/parser", package: "p:@nputer/parser" },
          { from: "app/src/a.ts", to: "lib/x.ts" },
        ],
      },
    ]);
    expect(model.findings).toEqual([]); // no intent layer -> nothing to drift from
    expect(model.unmappedFiles).toEqual([]);
    expect(model.components.every((c) => c.status === "planned")).toBe(true);
  });

  it("ADR-009: hostile top-level directory names stay inert Map keys", () => {
    const graph = graphOf([
      { path: "__proto__/evil.ts" },
      { path: "constructor/x.ts", imports: ["__proto__/evil.ts"] },
    ]);
    const model = deriveArchitecture({ components: [], graph, tasks: [] });
    expect(model.components.map((c) => c.id)).toEqual(["dir:__proto__", "dir:constructor"]);
    expect(model.fileComponent.get("__proto__/evil.ts")).toBe("dir:__proto__");
    expect(edgeOf(model, "dir:constructor", "dir:__proto__")?.relation).toBe("observed");
    expect(({} as Record<string, unknown>)["evil"]).toBeUndefined();
    expect(Object.getPrototypeOf({})).toBe(Object.prototype); // unpolluted
  });
});

describe("degraded: both layers absent", () => {
  it("yields the empty model, never a crash", () => {
    const model = deriveArchitecture({ components: [], tasks: [] });
    expect(model.mode).toBe("empty");
    expect(model.indexNotRun).toBe(true);
    expect(model.components).toEqual([]);
    expect(model.edges).toEqual([]);
    expect(model.findings).toEqual([]);
    expect(model.unmappedFiles).toEqual([]);
    expect(model.issues).toEqual([]);
  });

  it("tasks alone change nothing (they need a component to land on)", () => {
    const model = deriveArchitecture({
      components: [],
      tasks: [taskOf("T-001", { status: "building", touches: ["alpha"] })],
    });
    expect(model.mode).toBe("empty");
    expect(model.components).toEqual([]);
  });
});
