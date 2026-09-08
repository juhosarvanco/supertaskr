/**
 * The lane's ONE shared fixture (T-020 plan §3), authored from the real
 * formats and covering both panes:
 *
 * - backbone features F-01 / F-02 (docs/ROADMAP.md format);
 * - T-101 done (verdict entry, stamps, `blocked_by: [T-102]`) — the
 *   blocker-retarget specs' subject;
 * - T-102 building, touching the fixture component's slug (`e2e-alpha`)
 *   — the map panel's "tasks touching" row;
 * - T-103 planned, bodyless; T-104 parked (the exempt expander's row);
 * - component C-90 whose `paths` globs claim the fixture graph's two
 *   files (T-008 component-file format);
 * - a minimal valid graph.json in the supertaskr-index golden schema.
 */

/**
 * Structural copy of the harness payload shape. SOURCE OF TRUTH:
 * `DocsSnapshotPayload` in app/src/lib/docs-model.ts (T-003 contract —
 * stable; the harness fails loudly on drift). tools/e2e deliberately
 * imports neither package (ADR-011 addendum), so the shape is mirrored
 * here instead of imported.
 */
export interface DocsSnapshotPayload {
  seq: number;
  projectDir: string;
  generatedAtMs: number;
  files: { path: string; content: string }[];
}

const ROADMAP = `# Roadmap

## Backbone
- F-01: Alpha — the fixture's first column
- F-02: Beta — the fixture's second column
`;

const TASK_101 = `---
id: T-101
title: Alpha core
feature: F-01
milestone: 1
priority: 1
size: S
status: done
blocked_by: [T-102]
touches: [app-board]
built_by: "claude-fable-5 @fresh"
verified_by: "claude-fable-5 @fresh"
review: same-model
---

## Acceptance criteria
- WHEN the fixture loads THE board SHALL render this card as done.

## Verdicts

2026-08-16 — claude-fable-5 @fresh: APPROVED — fixture verdict entry.
`;

const TASK_102 = `---
id: T-102
title: Beta wiring
feature: F-02
milestone: 1
priority: 1
size: M
status: building
touches: [e2e-alpha]
---

## Acceptance criteria
- WHILE building THE fixture SHALL give the blocker chip a live target.
`;

const TASK_103 = `---
id: T-103
title: Gamma idea
feature: F-01
milestone: 2
priority: 2
size: S
status: planned
---
`;

const TASK_104 = `---
id: T-104
title: Delta parked
feature: F-01
status: parked
---
`;

const COMPONENT_C90 = `---
id: C-90
name: Alpha engine
layer: app
paths:
  - src/alpha/**
depends_on: []
decisions: []
status: auto
touch_slugs: [e2e-alpha]
---
The fixture's one declared component: its glob claims both graph files,
so the map renders a single mapped node and no unmapped ghost.
`;

/** Minimal valid graph in the schema-1 golden shape (T-009). */
const GRAPH = {
  schema: 1,
  root: ".",
  languages: ["ts"],
  files: [
    {
      id: "f:src/alpha/main.ts",
      path: "src/alpha/main.ts",
      lang: "ts",
      loc: 5,
      symbols: [
        {
          id: "s:src/alpha/main.ts#boot",
          name: "boot",
          kind: "function",
          exported: true,
          range: [1, 5],
        },
      ],
    },
    {
      id: "f:src/alpha/util.ts",
      path: "src/alpha/util.ts",
      lang: "ts",
      loc: 3,
      symbols: [
        {
          id: "s:src/alpha/util.ts#helper",
          name: "helper",
          kind: "function",
          exported: true,
          range: [1, 3],
        },
      ],
    },
  ],
  packages: [],
  edges: [
    {
      from: "f:src/alpha/main.ts",
      to: "f:src/alpha/util.ts",
      kind: "import",
      symbols: ["helper"],
    },
    {
      from: "s:src/alpha/main.ts#boot",
      to: "s:src/alpha/util.ts#helper",
      kind: "call",
      confidence: "resolved",
    },
  ],
  unresolved: [],
  stats: { files: 2, symbols: 2, edges: 2 },
};

/** The shared payload. `seq` is parameterized so a test can apply a
 * follow-up snapshot (seq must strictly increase to apply). */
export function boardFixture(seq = 1): DocsSnapshotPayload {
  return {
    seq,
    projectDir: "/e2e/fixture",
    generatedAtMs: 1_755_300_000_000 + seq,
    files: [
      { path: "docs/ROADMAP.md", content: ROADMAP },
      { path: "docs/tasks/T-101-alpha-core.md", content: TASK_101 },
      { path: "docs/tasks/T-102-beta-wiring.md", content: TASK_102 },
      { path: "docs/tasks/T-103-gamma-idea.md", content: TASK_103 },
      { path: "docs/tasks/T-104-delta-parked.md", content: TASK_104 },
      {
        path: "docs/architecture/components/C-90-alpha-engine.md",
        content: COMPONENT_C90,
      },
      {
        path: "docs/architecture/graph.json",
        content: JSON.stringify(GRAPH, null, 2),
      },
    ],
  };
}
