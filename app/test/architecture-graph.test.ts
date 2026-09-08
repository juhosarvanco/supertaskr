import { describe, expect, it } from "vitest";
import { parseGraph, type GraphIssue } from "../src/lib/architecture/graph";

// The reality-layer boundary (T-011): graph.json is repo content and
// therefore untrusted. These tests pin collect-don't-throw behavior,
// referential integrity, containment hygiene on package paths, and
// ADR-009 inertness of hostile keys that ride in through JSON.

/** A minimal valid schema-1 graph the tests mutate from. */
function baseGraph(): Record<string, unknown> {
  return {
    schema: 1,
    root: ".",
    languages: ["ts"],
    files: [
      {
        id: "f:app/a.ts",
        path: "app/a.ts",
        lang: "ts",
        hash: "blake3:00",
        loc: 3,
        symbols: [
          { id: "s:app/a.ts#A", name: "A", kind: "function", exported: true, range: [1, 3] },
        ],
      },
      { id: "f:lib/b.ts", path: "lib/b.ts", lang: "ts", loc: 1, symbols: [] },
    ],
    packages: [
      { id: "p:react", name: "react", ecosystem: "npm" },
      { id: "p:@supertaskr/parser", name: "@supertaskr/parser", ecosystem: "npm", path: "lib/parser" },
    ],
    edges: [
      { from: "f:app/a.ts", to: "f:lib/b.ts", kind: "import", symbols: ["b"] },
      { from: "f:app/a.ts", to: "p:react", kind: "import" },
    ],
    unresolved: [{ from: "f:app/a.ts", specifier: "./x.css", reason: "asset" }],
    stats: { files: 2, symbols: 1, edges: 2 },
  };
}

const parse = (value: unknown) => parseGraph(JSON.stringify(value));

describe("parseGraph: happy path", () => {
  it("parses the full shape with zero issues", () => {
    const { graph, issues } = parse(baseGraph());
    expect(issues).toEqual([]);
    expect(graph).toBeDefined();
    expect(graph?.files.map((f) => f.path)).toEqual(["app/a.ts", "lib/b.ts"]);
    expect(graph?.filesById.get("f:app/a.ts")?.loc).toBe(3);
    expect(graph?.packagesById.get("p:@supertaskr/parser")?.path).toBe("lib/parser");
    expect(graph?.edges).toHaveLength(2);
    expect(graph?.unresolved).toEqual([{ from: "f:app/a.ts", specifier: "./x.css", reason: "asset" }]);
    expect(graph?.stats).toEqual({ files: 2, symbols: 1, edges: 2 });
  });

  it("keeps optional fields optional", () => {
    const g = baseGraph();
    delete g.stats;
    const { graph, issues } = parse(g);
    expect(issues).toEqual([]);
    expect(graph?.stats).toBeUndefined();
  });

  it("reads truncation stats through their wire names", () => {
    const g = baseGraph();
    g.stats = { files: 2, truncated_symbols: true, truncated_files: 1, skipped: 3 };
    const { graph } = parse(g);
    expect(graph?.stats).toEqual({ files: 2, truncatedSymbols: true, truncatedFiles: 1, skipped: 3 });
  });
});

describe("parseGraph: unreadable inputs never throw", () => {
  const unreadable: [name: string, text: string][] = [
    ["not JSON", "{nope"],
    ["a JSON string", JSON.stringify("hello")],
    ["a JSON array", "[]"],
    ["null", "null"],
    ["schema 2", JSON.stringify({ ...baseGraph(), schema: 2 })],
    ["schema missing", JSON.stringify({ files: [] })],
    ["schema as string", JSON.stringify({ ...baseGraph(), schema: "1" })],
  ];
  for (const [name, text] of unreadable) {
    it(`${name} -> no graph + graph-unreadable issue`, () => {
      const { graph, issues } = parseGraph(text);
      expect(graph).toBeUndefined();
      expect(issues).toHaveLength(1);
      expect(issues[0]?.kind).toBe("graph-unreadable");
    });
  }

  it("empty input never throws", () => {
    expect(parseGraph("").graph).toBeUndefined();
  });
});

describe("parseGraph: malformed entries are skipped, the rest kept", () => {
  it("skips files with missing/mismatched identity", () => {
    const g = baseGraph();
    (g.files as unknown[]).push(
      { id: "f:evil.ts", path: "other.ts", lang: "ts" }, // id/path mismatch
      { path: "no-id.ts", lang: "ts" },
      "not an object",
    );
    const { graph, issues } = parse(g);
    expect(graph?.files).toHaveLength(2);
    expect(issues.filter((issue) => issue.kind === "graph-entry")).toHaveLength(3);
  });

  it("first entry wins on duplicate file paths", () => {
    const g = baseGraph();
    (g.files as unknown[]).push({ id: "f:app/a.ts", path: "app/a.ts", lang: "js", loc: 9, symbols: [] });
    const { graph, issues } = parse(g);
    expect(graph?.filesById.get("f:app/a.ts")?.lang).toBe("ts");
    expect(issues.some((issue) => issue.message.includes("duplicate file"))).toBe(true);
  });

  it("skips malformed symbols but keeps the file", () => {
    const g = baseGraph();
    const file = (g.files as Record<string, unknown>[])[0] as Record<string, unknown>;
    file.symbols = [
      { id: "s:app/a.ts#A", name: "A", kind: "function", exported: true, range: [1, 3] },
      { id: "s:app/a.ts#B", name: "B", kind: "function", exported: "yes", range: [1, 2] },
      { id: "s:app/a.ts#C", name: "C", kind: "function", exported: true, range: [1] },
    ];
    const { graph, issues } = parse(g);
    expect(graph?.filesById.get("f:app/a.ts")?.symbols.map((s) => s.name)).toEqual(["A"]);
    expect(issues).toHaveLength(2);
  });

  it("skips packages whose id does not match their name", () => {
    const g = baseGraph();
    (g.packages as unknown[]).push({ id: "p:spoof", name: "other", ecosystem: "npm" });
    const { graph, issues } = parse(g);
    expect(graph?.packagesById.has("p:spoof")).toBe(false);
    expect(issues).toHaveLength(1);
  });

  it("skips edges with unknown kinds", () => {
    const g = baseGraph();
    (g.edges as unknown[]).push({ from: "f:app/a.ts", to: "f:lib/b.ts", kind: "teleport" });
    const { graph, issues } = parse(g);
    expect(graph?.edges).toHaveLength(2);
    expect(issues[0]?.message).toContain("teleport");
  });

  it("missing top-level arrays degrade to empty with an issue each", () => {
    const { graph, issues } = parse({ schema: 1, root: "." });
    expect(graph).toBeDefined();
    expect(graph?.files).toEqual([]);
    expect(graph?.edges).toEqual([]);
    const wheres = issues.map((issue) => (issue as Extract<GraphIssue, { where: string }>).where);
    expect(wheres).toEqual(
      expect.arrayContaining(["languages", "files", "packages", "edges", "unresolved"]),
    );
  });
});

describe("parseGraph: referential integrity", () => {
  it("skips edges whose endpoints do not exist", () => {
    const g = baseGraph();
    (g.edges as unknown[]).push(
      { from: "f:ghost.ts", to: "f:lib/b.ts", kind: "import" },
      { from: "f:app/a.ts", to: "p:ghost", kind: "import" },
      { from: "s:app/a.ts#Ghost", to: "s:app/a.ts#A", kind: "call" },
    );
    const { graph, issues } = parse(g);
    expect(graph?.edges).toHaveLength(2);
    expect(issues.filter((issue) => issue.kind === "graph-reference")).toHaveLength(3);
  });

  it("keeps symbol-level edges whose symbols exist", () => {
    const g = baseGraph();
    (g.files as Record<string, unknown>[])[1] = {
      id: "f:lib/b.ts",
      path: "lib/b.ts",
      lang: "ts",
      loc: 1,
      symbols: [{ id: "s:lib/b.ts#b", name: "b", kind: "const", exported: true, range: [1, 1] }],
    };
    (g.edges as unknown[]).push({
      from: "s:app/a.ts#A",
      to: "s:lib/b.ts#b",
      kind: "call",
      confidence: "resolved",
    });
    const { graph, issues } = parse(g);
    expect(issues).toEqual([]);
    expect(graph?.edges).toHaveLength(3);
  });

  it("skips unresolved entries pointing at unknown files", () => {
    const g = baseGraph();
    (g.unresolved as unknown[]).push({ from: "f:ghost.ts", specifier: "./x", reason: "not_found" });
    const { graph, issues } = parse(g);
    expect(graph?.unresolved).toHaveLength(1);
    expect(issues.filter((issue) => issue.kind === "graph-reference")).toHaveLength(1);
  });
});

describe("parseGraph: containment on package paths", () => {
  const bad: [name: string, path: unknown][] = [
    ["absolute", "/etc/passwd"],
    ["parent escape", "../outside"],
    ["embedded escape", "lib/../../outside"],
    ["backslashes", "lib\\parser"],
    ["empty", ""],
    ["non-string", 42],
  ];
  for (const [name, path] of bad) {
    it(`${name} package path is dropped with an issue`, () => {
      const g = baseGraph();
      (g.packages as Record<string, unknown>[])[1] = {
        id: "p:@supertaskr/parser",
        name: "@supertaskr/parser",
        ecosystem: "npm",
        path,
      };
      const { graph, issues } = parse(g);
      expect(graph?.packagesById.get("p:@supertaskr/parser")?.path).toBeUndefined();
      expect(issues.some((issue) => issue.message.includes("containment"))).toBe(true);
    });
  }
});

describe("parseGraph: ADR-009 hostile keys are inert", () => {
  it("a file named __proto__ is an inert Map key", () => {
    const g = baseGraph();
    (g.files as unknown[]).push({ id: "f:__proto__", path: "__proto__", lang: "ts", loc: 0, symbols: [] });
    const { graph, issues } = parse(g);
    expect(issues).toEqual([]);
    expect(graph?.filesById.get("f:__proto__")?.path).toBe("__proto__");
    // Nothing leaked onto prototypes anywhere.
    expect(Object.getPrototypeOf({})).toBe(Object.prototype);
    expect(({} as Record<string, unknown>)["lang"]).toBeUndefined();
    expect(({} as Record<string, unknown>)["path"]).toBeUndefined();
  });

  it("hostile package names (constructor, __proto__) stay data", () => {
    const g = baseGraph();
    (g.packages as unknown[]).push(
      { id: "p:constructor", name: "constructor", ecosystem: "npm" },
      { id: "p:__proto__", name: "__proto__", ecosystem: "npm", path: "lib/parser" },
    );
    const { graph, issues } = parse(g);
    expect(issues).toEqual([]);
    expect(graph?.packagesById.get("p:constructor")?.name).toBe("constructor");
    expect(graph?.packagesById.get("p:__proto__")?.path).toBe("lib/parser");
    expect(graph?.packagesById.size).toBe(4);
    expect(new Map().constructor).toBe(Map); // prototypes unpolluted
  });

  it("a hostile stats object cannot smuggle keys", () => {
    const g = baseGraph();
    // Built via JSON.parse: a literal `__proto__:` key would set the
    // prototype instead of an own property and never reach the wire.
    g.stats = JSON.parse('{"files":1,"__proto__":{"polluted":true},"evil":"x"}');
    const { graph } = parse(g);
    expect(graph?.stats).toEqual({ files: 1 });
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
  });

  it("__proto__ as a top-level graph key is ignored, not inherited", () => {
    const text = `{"schema":1,"root":".","languages":[],"files":[],"packages":[],"edges":[],"unresolved":[],"__proto__":{"files":"spoof"}}`;
    const { graph } = parseGraph(text);
    expect(graph?.files).toEqual([]);
  });
});
