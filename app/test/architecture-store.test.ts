import { describe, expect, it } from "vitest";
import {
  applySnapshot,
  emptyState,
  GRAPH_FILE,
  type DocsSnapshotPayload,
} from "../src/lib/docs-model";
import { deriveArchitecture } from "../src/lib/architecture/derive";
import { parseGraph } from "../src/lib/architecture/graph";

// T-012 plan §4: the graph rides the docs pipeline as a RAW passthrough
// (no last-good — ADR-014's designed recovery for a corrupt graph is
// regeneration), and component files join the full model-input
// machinery (last-good + parse chip). Hostile graph content is exercised
// at this integration level (T-011 owns parseGraph's unit surface).

const COMPONENT = `---
id: C-05
name: App
paths:
  - app/**
depends_on: []
status: auto
touch_slugs: [app-shell]
---
The front door.
`;

const COMPONENT_BROKEN = `---
id: C-05
name: [not, a, string]
paths:
---
broken
`;

const TASK = `---
id: T-001
title: A task
status: done
---
`;

function snapshot(seq: number, files: { path: string; content: string }[]): DocsSnapshotPayload {
  return { seq, projectDir: "/p", generatedAtMs: seq, files };
}

const GRAPH = JSON.stringify({
  schema: 1,
  root: ".",
  languages: ["ts"],
  files: [{ id: "f:app/a.ts", path: "app/a.ts", lang: "ts", loc: 1, symbols: [] }],
  packages: [],
  edges: [],
  unresolved: [],
});

describe("graph passthrough", () => {
  it("carries raw graph bytes; absent means undefined", () => {
    const withGraph = applySnapshot(
      emptyState(),
      snapshot(1, [{ path: GRAPH_FILE, content: GRAPH }]),
    );
    expect(withGraph.graphContent).toBe(GRAPH);
    const without = applySnapshot(withGraph, snapshot(2, []));
    expect(without.graphContent).toBeUndefined();
  });

  it("is value-stable across snapshots with unchanged bytes (derivation memos hit)", () => {
    const first = applySnapshot(
      emptyState(),
      snapshot(1, [{ path: GRAPH_FILE, content: GRAPH }]),
    );
    const second = applySnapshot(
      first,
      snapshot(2, [
        { path: GRAPH_FILE, content: GRAPH },
        { path: "docs/tasks/T-001-a.md", content: TASK },
      ]),
    );
    expect(Object.is(second.graphContent, first.graphContent)).toBe(true);
  });

  it("keeps NO last-good for the graph: corrupt bytes pass through and degrade downstream", () => {
    const good = applySnapshot(
      emptyState(),
      snapshot(1, [{ path: GRAPH_FILE, content: GRAPH }]),
    );
    const corrupt = applySnapshot(
      good,
      snapshot(2, [{ path: GRAPH_FILE, content: "{ not json" }]),
    );
    expect(corrupt.graphContent).toBe("{ not json");
    expect(corrupt.failures).toEqual([]); // the parse chip stays a .md concern
    // Downstream: parseGraph degrades, derive lands on index-not-run.
    const parsed = parseGraph(corrupt.graphContent ?? "");
    expect(parsed.graph).toBeUndefined();
    expect(parsed.issues[0]?.kind).toBe("graph-unreadable");
    const derived = deriveArchitecture({ components: [], tasks: [] });
    expect(derived.indexNotRun).toBe(true);
  });
});

describe("component files as model inputs", () => {
  it("parses into model.components through the snapshot path", () => {
    const state = applySnapshot(
      emptyState(),
      snapshot(1, [
        { path: "docs/architecture/components/C-05-app.md", content: COMPONENT },
      ]),
    );
    expect(state.model.components?.map((c) => c.id)).toEqual(["C-05"]);
    expect(state.failures).toEqual([]);
  });

  it("gets the full last-good + parse-chip machinery on a broken save", () => {
    const good = applySnapshot(
      emptyState(),
      snapshot(1, [
        { path: "docs/architecture/components/C-05-app.md", content: COMPONENT },
      ]),
    );
    const broken = applySnapshot(
      good,
      snapshot(2, [
        { path: "docs/architecture/components/C-05-app.md", content: COMPONENT_BROKEN },
      ]),
    );
    // The map keeps rendering the last good record…
    expect(broken.model.components?.map((c) => c.id)).toEqual(["C-05"]);
    expect(broken.model.components?.[0]?.name).toBe("App");
    // …and the failure drives the existing chip.
    expect(broken.failures).toHaveLength(1);
    expect(broken.failures[0]).toMatchObject({
      path: "docs/architecture/components/C-05-app.md",
      showingLastGood: true,
    });
  });

  it("a deleted component file leaves the model (files are the brain)", () => {
    const good = applySnapshot(
      emptyState(),
      snapshot(1, [
        { path: "docs/architecture/components/C-05-app.md", content: COMPONENT },
      ]),
    );
    const gone = applySnapshot(good, snapshot(2, []));
    expect(gone.model.components ?? []).toEqual([]);
  });
});

describe("graph hostility at the integration level", () => {
  const parseAndDerive = (content: string) => {
    const state = applySnapshot(
      emptyState(),
      snapshot(1, [{ path: GRAPH_FILE, content }]),
    );
    const parsed = parseGraph(state.graphContent ?? "");
    return deriveArchitecture({
      components: [],
      tasks: [],
      ...(parsed.graph !== undefined ? { graph: parsed.graph } : {}),
    });
  };

  it("garbage JSON degrades to the empty/index-not-run family, never a crash", () => {
    const derived = parseAndDerive("]]]{{{");
    expect(derived.mode).toBe("empty");
    expect(derived.indexNotRun).toBe(true);
  });

  it("wrong schema degrades identically", () => {
    const derived = parseAndDerive(JSON.stringify({ schema: 99, files: [] }));
    expect(derived.indexNotRun).toBe(true);
  });

  it("__proto__ file ids stay inert data (ADR-009 Maps end to end)", () => {
    const hostile = JSON.stringify({
      schema: 1,
      root: ".",
      languages: ["ts"],
      files: [
        { id: "f:__proto__", path: "__proto__", lang: "ts", loc: 1, symbols: [] },
        { id: "f:constructor", path: "constructor", lang: "ts", loc: 1, symbols: [] },
      ],
      packages: [],
      edges: [
        { from: "f:__proto__", to: "f:constructor", kind: "import" },
      ],
      unresolved: [],
    });
    const derived = parseAndDerive(hostile);
    expect(derived.mode).toBe("no-components"); // inferred pseudo-components
    expect(derived.fileComponent.get("__proto__")).toBeDefined();
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, "polluted")).toBe(false);
  });

  it("a huge-under-cap payload stays a working model", () => {
    const files = Array.from({ length: 2000 }, (_, i) => ({
      id: `f:dir${i % 7}/f${i}.ts`,
      path: `dir${i % 7}/f${i}.ts`,
      lang: "ts",
      loc: 10,
      symbols: [],
    }));
    const huge = JSON.stringify({
      schema: 1,
      root: ".",
      languages: ["ts"],
      files,
      packages: [],
      edges: [],
      unresolved: [],
    });
    expect(huge.length).toBeLessThan(1_048_576); // under the collector cap
    const derived = parseAndDerive(huge);
    expect(derived.fileComponent.size).toBe(2000);
    expect(derived.components.length).toBe(7); // dir:dir0 … dir:dir6
  });
});
