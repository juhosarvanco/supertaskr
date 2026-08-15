import { describe, expect, it } from "vitest";
import { deriveArchitecture, type DeriveInputs } from "../src/lib/architecture/derive";
import { parseGraph } from "../src/lib/architecture/graph";
import { searchMap, SEARCH_CAP } from "../src/architecture/map-search";
import { parseComponentFile } from "@nputer/parser/pure";

// Map search (T-012): components + files, one ranked list. Symbol
// search is T-013's.

function comp(id: string, name: string, paths: string[], dependsOn: string[] = []) {
  const yaml = [
    "---",
    `id: ${id}`,
    `name: ${name}`,
    "paths:",
    ...paths.map((p) => `  - ${p}`),
    `depends_on: [${dependsOn.join(", ")}]`,
    "status: auto",
    "touch_slugs: []",
    "---",
    "Prose.",
  ].join("\n");
  const parsed = parseComponentFile(yaml, `docs/architecture/components/${id}-x.md`);
  if (parsed.component === undefined) throw new Error("fixture component failed to parse");
  return parsed.component;
}

function graphOf(files: string[], edges: { from: string; to: string }[] = []) {
  const doc = {
    schema: 1,
    root: ".",
    languages: ["ts"],
    files: files.map((path) => ({ id: `f:${path}`, path, lang: "ts", loc: 1, symbols: [] })),
    packages: [],
    edges: edges.map((e) => ({ from: `f:${e.from}`, to: `f:${e.to}`, kind: "import" })),
    unresolved: [],
  };
  const parsed = parseGraph(JSON.stringify(doc));
  if (parsed.graph === undefined) throw new Error("fixture graph failed to parse");
  return parsed.graph;
}

function derived(inputs: Partial<DeriveInputs>) {
  return deriveArchitecture({ components: [], tasks: [], ...inputs });
}

describe("searchMap", () => {
  const model = derived({
    components: [
      comp("C-05", "App", ["app/src/App.tsx", "app/src/lib/utils.ts"]),
      comp("C-06", "lib-parser", ["lib/parser/**"]),
    ],
    graph: graphOf([
      "app/src/App.tsx",
      "app/src/lib/utils.ts",
      "lib/parser/src/pure.ts",
      "orphan/loose.ts",
    ]),
  });

  it("empty query yields nothing", () => {
    expect(searchMap(model, "")).toEqual([]);
    expect(searchMap(model, "   ")).toEqual([]);
  });

  it("matches components by id and name, case-insensitive", () => {
    const byId = searchMap(model, "c-05");
    expect(byId[0]).toMatchObject({ kind: "component", componentId: "C-05", tag: "component" });
    const byName = searchMap(model, "parser");
    expect(byName[0]).toMatchObject({ kind: "component", componentId: "C-06" });
  });

  it("matches files and points them at their owning component", () => {
    const results = searchMap(model, "utils");
    const file = results.find((r) => r.kind === "file");
    expect(file).toMatchObject({
      text: "app/src/lib/utils.ts",
      componentId: "C-05",
      tag: "C-05",
      warning: false,
    });
  });

  it("tags unmapped files in warning and targets the bucket", () => {
    const results = searchMap(model, "loose");
    expect(results[0]).toMatchObject({
      kind: "file",
      componentId: "unmapped",
      tag: "unmapped",
      warning: true,
    });
  });

  it("components rank before files; earlier matches rank higher", () => {
    const results = searchMap(model, "app");
    expect(results[0]?.kind).toBe("component");
    const fileTexts = results.filter((r) => r.kind === "file").map((r) => r.text);
    expect(fileTexts).toEqual(["app/src/App.tsx", "app/src/lib/utils.ts"]);
  });

  it("caps the list", () => {
    const many = derived({
      graph: graphOf(Array.from({ length: 40 }, (_, i) => `dir/f${String(i).padStart(2, "0")}.ts`)),
    });
    // Inferred mode: every file matches "dir".
    expect(searchMap(many, "dir").length).toBeLessThanOrEqual(SEARCH_CAP);
  });

  it("hostile queries are inert data (no regex, no crash)", () => {
    expect(() => searchMap(model, "(((")).not.toThrow();
    expect(() => searchMap(model, "__proto__")).not.toThrow();
    expect(searchMap(model, "((([").length).toBe(0);
  });
});
