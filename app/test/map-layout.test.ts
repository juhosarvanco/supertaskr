import { describe, expect, it } from "vitest";
import {
  breakCycles,
  COLUMN_PITCH,
  layoutKey,
  layoutMap,
  NODE_H,
  NODE_W,
  SLOT_H,
  SLOT_TOP,
  type LayoutComponentInput,
  type LayoutEdgeInput,
} from "../src/architecture/map-layout";

// The seven-rule layout (T-012 plan §5): deterministic, declared-edges-
// only columns, id-ordered rows, append-only stability, elbow routing.
// The registry-growth attack is answered in-suite: adding a component
// must leave every prior position byte-identical.

const c = (id: string, kind: LayoutComponentInput["kind"] = "declared"): LayoutComponentInput => ({
  id,
  kind,
});
const declared = (from: string, to: string): LayoutEdgeInput => ({ from, to, declared: true });
const observed = (from: string, to: string): LayoutEdgeInput => ({ from, to, declared: false });

describe("determinism (rule 7's precondition)", () => {
  it("same input twice yields deep-equal output", () => {
    const components = [c("C-01"), c("C-02"), c("C-03"), c("unmapped", "unmapped")];
    const edges = [
      declared("C-01", "C-02"),
      declared("C-02", "C-03"),
      observed("C-03", "unmapped"),
    ];
    const a = layoutMap(components, edges);
    const b = layoutMap(components, edges);
    expect([...a.nodes.entries()]).toEqual([...b.nodes.entries()]);
    expect(a.edges).toEqual(b.edges);
    expect(a.width).toBe(b.width);
    expect(a.height).toBe(b.height);
  });

  it("input order does not matter", () => {
    const components = [c("C-01"), c("C-02"), c("C-03")];
    const edges = [declared("C-01", "C-02"), declared("C-02", "C-03")];
    const a = layoutMap(components, edges);
    const b = layoutMap([...components].reverse(), [...edges].reverse());
    expect([...a.nodes.entries()].sort()).toEqual([...b.nodes.entries()].sort());
    expect(a.edges).toEqual(b.edges);
  });
});

describe("rule 1: columns = longest path along declared edges only", () => {
  it("chains layer left to right", () => {
    const { nodes } = layoutMap(
      [c("C-01"), c("C-02"), c("C-03")],
      [declared("C-01", "C-02"), declared("C-02", "C-03")],
    );
    expect(nodes.get("C-01")?.col).toBe(0);
    expect(nodes.get("C-02")?.col).toBe(1);
    expect(nodes.get("C-03")?.col).toBe(2);
  });

  it("diamonds take the longest path, not the shortest", () => {
    const { nodes } = layoutMap(
      [c("C-01"), c("C-02"), c("C-03")],
      [declared("C-01", "C-02"), declared("C-01", "C-03"), declared("C-03", "C-02")],
    );
    // C-02 is reachable directly (1) and via C-03 (2): longest wins.
    expect(nodes.get("C-02")?.col).toBe(2);
    expect(nodes.get("C-03")?.col).toBe(1);
  });

  it("multiple roots each start at column 0", () => {
    const { nodes } = layoutMap(
      [c("C-01"), c("C-02"), c("C-03"), c("C-04")],
      [declared("C-01", "C-02"), declared("C-03", "C-04")],
    );
    expect(nodes.get("C-01")?.col).toBe(0);
    expect(nodes.get("C-03")?.col).toBe(0);
    expect(nodes.get("C-02")?.col).toBe(1);
    expect(nodes.get("C-04")?.col).toBe(1);
  });

  it("observed-only (drift) edges never move a node", () => {
    const withObserved = layoutMap(
      [c("C-01"), c("C-02")],
      [observed("C-01", "C-02")],
    );
    expect(withObserved.nodes.get("C-01")?.col).toBe(0);
    expect(withObserved.nodes.get("C-02")?.col).toBe(0);
    // The observed edge is still drawn.
    expect(withObserved.edges).toHaveLength(1);
  });

  it("isolated components sit in column 0", () => {
    const { nodes } = layoutMap([c("C-07")], []);
    expect(nodes.get("C-07")).toMatchObject({ col: 0, row: 0, x: 0, y: SLOT_TOP });
  });
});

describe("rule 2: cycles break at the edge whose target has the lowest id", () => {
  it("a two-cycle cuts the edge into the lower id and keeps drawing", () => {
    const components = [c("C-05"), c("C-12")];
    const edges = [declared("C-05", "C-12"), declared("C-12", "C-05")];
    const { nodes, edges: laid } = layoutMap(components, edges);
    expect(nodes.get("C-05")?.col).toBe(0);
    expect(nodes.get("C-12")?.col).toBe(1);
    const back = laid.find((e) => e.from === "C-12" && e.to === "C-05");
    expect(back?.cycleBroken).toBe(true);
    const forward = laid.find((e) => e.from === "C-05" && e.to === "C-12");
    expect(forward?.cycleBroken).toBe(false);
    expect(laid).toHaveLength(2); // both edges drawn — a cycle is a finding, not a crash
  });

  it("a nested sub-cycle not through the lowest node still resolves (iterative rounds)", () => {
    // C-01↔C-02 and C-02↔C-03: round 1 cuts C-02→C-01 (SCC lowest C-01),
    // the surviving C-02↔C-03 cycle cuts C-03→C-02 in round 2.
    const edges = [
      declared("C-01", "C-02"),
      declared("C-02", "C-01"),
      declared("C-02", "C-03"),
      declared("C-03", "C-02"),
    ];
    const broken = breakCycles(["C-01", "C-02", "C-03"], edges);
    expect(broken.size).toBe(2);
    const { nodes, edges: laid } = layoutMap(
      [c("C-01"), c("C-02"), c("C-03")],
      edges,
    );
    expect(nodes.get("C-01")?.col).toBe(0);
    expect(nodes.get("C-02")?.col).toBe(1);
    expect(nodes.get("C-03")?.col).toBe(2);
    const cut = laid.filter((e) => e.cycleBroken).map((e) => `${e.from}->${e.to}`);
    expect(cut.sort()).toEqual(["C-02->C-01", "C-03->C-02"]);
    expect(laid).toHaveLength(4); // every edge still drawn
  });
});

describe("rules 3 + 4: id-ordered rows, append-only stability", () => {
  it("rows within a column order by component id, numeric-aware", () => {
    const { nodes } = layoutMap(
      [c("C-100"), c("C-99"), c("C-02")],
      [],
    );
    expect(nodes.get("C-02")?.row).toBe(0);
    expect(nodes.get("C-99")?.row).toBe(1);
    expect(nodes.get("C-100")?.row).toBe(2);
  });

  it("THE REGISTRY-GROWTH ATTACK: adding a component moves nothing that exists", () => {
    const components = [c("C-01"), c("C-02"), c("C-03"), c("C-05")];
    const edges = [
      declared("C-01", "C-02"),
      declared("C-02", "C-03"),
      declared("C-01", "C-05"),
    ];
    const before = layoutMap(components, edges);
    // A NEW component (ids are assigned once, never reused — so new ids
    // are always higher) appends to its column's bottom.
    const after = layoutMap(
      [...components, c("C-12")],
      [...edges, declared("C-01", "C-12")],
    );
    for (const [id, node] of before.nodes) {
      expect(after.nodes.get(id)).toMatchObject({ x: node.x, y: node.y, col: node.col, row: node.row });
    }
    // The newcomer landed below its column peers (column 1 holds C-02
    // row 0, C-05 row 1 — C-12 appends at row 2).
    const newcomer = after.nodes.get("C-12");
    expect(newcomer?.col).toBe(1);
    expect(newcomer?.row).toBe(2);
  });

  it("slot arithmetic: x = col·216, y = 40 + row·150", () => {
    const { nodes } = layoutMap(
      [c("C-01"), c("C-02"), c("C-03")],
      [declared("C-01", "C-02"), declared("C-01", "C-03")],
    );
    expect(nodes.get("C-01")).toMatchObject({ x: 0, y: SLOT_TOP });
    expect(nodes.get("C-02")).toMatchObject({ x: COLUMN_PITCH, y: SLOT_TOP });
    expect(nodes.get("C-03")).toMatchObject({ x: COLUMN_PITCH, y: SLOT_TOP + SLOT_H });
  });

  it("T1: an expanded container pushes its OWN column's sibling — in a NON-ZERO column too", () => {
    // The column-0-only mutant of `assignYs` (apply the expansion height
    // only when `column === 0`) survives the whole DOM suite, because the
    // DOM fixture's SECOND column holds exactly one node — "pushes only
    // that column" is exercised in column 0 alone. Here C-02 and C-03 are
    // BOTH in column 1 (rows 0 and 1, from the same C-01 → C-02, C-03
    // edges as the slot test above), so expanding C-02 MUST push C-03 down
    // by exactly the extra height; a stack that reads the height only in
    // column 0 leaves C-03 where it was.
    const components = [c("C-01"), c("C-02"), c("C-03")];
    const edges = [declared("C-01", "C-02"), declared("C-01", "C-03")];
    const EXTRA = 90; // a container height that is NOT NODE_H
    const before = layoutMap(components, edges);
    const after = layoutMap(components, edges, new Map([["C-02", NODE_H + EXTRA]]));

    // C-02 above C-03, both in the non-zero column — the shape the DOM
    // fixture never had.
    expect(after.nodes.get("C-02")).toMatchObject({ col: 1, row: 0 });
    expect(after.nodes.get("C-03")).toMatchObject({ col: 1, row: 1 });

    // The sibling BELOW, in the SAME non-zero column, moves down by
    // exactly the extra height. EXTRA is a fixed positive number, so the
    // mutant's non-move reds against a concrete value rather than passing
    // vacuously (a negative assertion needs a positive control).
    expect(after.nodes.get("C-03")?.y).toBe((before.nodes.get("C-03")?.y ?? 0) + EXTRA);

    // The container reserves the expanded height; column 0 and the
    // expanded node itself do not move.
    expect(after.nodes.get("C-02")?.h).toBe(NODE_H + EXTRA);
    expect(after.nodes.get("C-01")?.y).toBe(before.nodes.get("C-01")?.y);
    expect(after.nodes.get("C-02")?.y).toBe(before.nodes.get("C-02")?.y);
  });
});

describe("rule 6: elbow routing", () => {
  it("same-row forward edges run straight (hero: M192 73 H216)", () => {
    const { edges } = layoutMap(
      [c("C-01"), c("C-02")],
      [declared("C-01", "C-02")],
    );
    expect(edges[0]?.path).toBe(`M${NODE_W} ${SLOT_TOP + NODE_H / 2} H${COLUMN_PITCH}`);
    expect(edges[0]?.path).toBe("M192 73 H216");
    expect(edges[0]?.labelAnchor).toEqual({ x: (192 + 216) / 2, y: 73 });
  });

  it("cross-row forward edges stub 12px into a mid-gutter vertical", () => {
    const { edges } = layoutMap(
      [c("C-01"), c("C-02"), c("C-03")],
      [declared("C-01", "C-02"), declared("C-01", "C-03")],
    );
    const crossing = edges.find((e) => e.to === "C-03");
    // Source right edge 192, stub to 204 (mid-gutter), down to row 1
    // center 223, into the target's left edge 216.
    expect(crossing?.path).toBe("M192 73 H204 V223 H216");
    expect(crossing?.labelAnchor).toEqual({ x: 204, y: (73 + 223) / 2 });
  });

  it("backward edges exit the bottom center and enter the target's top (the hero's C-01→C-05 shape)", () => {
    // Recreate the hero geometry: source at col 2 row 0, target col 1
    // row 1, and the back edge OBSERVED — exactly the hero's drift back
    // edge (declared edges feed rule 1, so a declared target can never
    // sit behind its source outside a cycle).
    const { edges } = layoutMap(
      [c("C-01"), c("C-02"), c("C-03"), c("C-04")],
      [
        declared("C-01", "C-02"), // C-02 col 1 row 0
        declared("C-01", "C-04"), // C-04 col 1 row 1
        declared("C-02", "C-03"), // C-03 col 2 row 0
        observed("C-03", "C-04"), // the back edge: col 2 → col 1
      ],
    );
    const back = edges.find((e) => e.from === "C-03" && e.to === "C-04");
    // Source bottom center (432+96, 40+66) → V 42 below → H to target
    // center column (216+96) → V into the target's top (y 190).
    expect(back?.path).toBe("M528 106 V148 H312 V190");
    expect(back?.cycleBroken).toBe(false); // a plain back edge is not a cycle cut
  });

  it("same-column edges bow beside the column band", () => {
    const { edges } = layoutMap(
      [c("C-01"), c("C-02"), c("C-03")],
      [
        declared("C-01", "C-02"),
        declared("C-01", "C-03"), // C-02 row 0, C-03 row 1 in col 1
        observed("C-03", "C-02"), // same-column observed edge
      ],
    );
    // C-03 (col 1 row 1) → C-02 (col 1 row 0): bows beside the column.
    const bow = edges.find((e) => e.from === "C-03" && e.to === "C-02");
    // Right edge x 408, bow at 420, from row-1 center 223 to row-0 center 73.
    expect(bow?.path).toBe("M408 223 H420 V73 H408");
    expect(bow?.labelAnchor).toEqual({ x: 420, y: (223 + 73) / 2 });
  });

  it("backward edges to a target above the run enter its bottom", () => {
    // C-03 (col 1 row 1) → C-01 (col 0 row 0): the run sits below the
    // source; the target is above it, so the edge rises into its bottom.
    const { edges } = layoutMap(
      [c("C-01"), c("C-02"), c("C-03")],
      [
        declared("C-01", "C-02"),
        declared("C-01", "C-03"),
        declared("C-03", "C-01"), // cycle C-01↔C-03 — cut but still drawn
      ],
    );
    const back = edges.find((e) => e.from === "C-03" && e.to === "C-01");
    expect(back?.cycleBroken).toBe(true);
    // Bottom center (216+96, 190+66) → V 298 → H 96 → up into y 106.
    expect(back?.path).toBe("M312 256 V298 H96 V106");
  });

  it("hostile edges to unknown ids are skipped, never a crash", () => {
    const { edges } = layoutMap([c("C-01")], [declared("C-01", "__proto__")]);
    expect(edges).toEqual([]);
  });
});

describe("rule 8: the unmapped bucket", () => {
  it("sits one column after its furthest partner (edges in either direction)", () => {
    const components = [c("C-01"), c("C-02"), c("C-06"), c("unmapped", "unmapped")];
    const edges = [
      declared("C-01", "C-02"),
      declared("C-02", "C-06"), // C-06 col 2
      observed("C-01", "unmapped"),
      observed("unmapped", "C-06"), // partner C-06 col 2 → unmapped col 3
    ];
    const { nodes } = layoutMap(components, edges);
    expect(nodes.get("unmapped")?.col).toBe(3);
  });

  it("with no partners it sits in column 0", () => {
    const { nodes } = layoutMap([c("C-01"), c("unmapped", "unmapped")], []);
    expect(nodes.get("unmapped")?.col).toBe(0);
  });

  it("bottom-appends below every component in its column", () => {
    const components = [c("C-01"), c("C-02"), c("C-09"), c("unmapped", "unmapped")];
    const edges = [
      declared("C-01", "C-02"),
      declared("C-01", "C-09"),
      observed("C-01", "unmapped"), // partner col 0 → unmapped col 1, with C-02 + C-09
    ];
    const { nodes } = layoutMap(components, edges);
    expect(nodes.get("unmapped")?.col).toBe(1);
    expect(nodes.get("unmapped")?.row).toBe(2); // after C-02 (0) and C-09 (1)
  });

  it("its placement never moves real components", () => {
    const base = layoutMap(
      [c("C-01"), c("C-02")],
      [declared("C-01", "C-02")],
    );
    const withBucket = layoutMap(
      [c("C-01"), c("C-02"), c("unmapped", "unmapped")],
      [declared("C-01", "C-02"), observed("C-02", "unmapped")],
    );
    for (const [id, node] of base.nodes) {
      expect(withBucket.nodes.get(id)).toMatchObject({ x: node.x, y: node.y });
    }
  });
});

describe("neighborhood sets (one hop, both directions)", () => {
  it("includes self plus every edge partner regardless of direction", () => {
    const { neighborhood } = layoutMap(
      [c("C-01"), c("C-02"), c("C-03"), c("C-04")],
      [declared("C-01", "C-02"), observed("C-03", "C-01")],
    );
    expect([...(neighborhood.get("C-01") ?? [])].sort()).toEqual(["C-01", "C-02", "C-03"]);
    expect([...(neighborhood.get("C-04") ?? [])].sort()).toEqual(["C-04"]);
  });
});

describe("layoutKey: the structural identity", () => {
  it("is blind to everything that must not move a node", () => {
    const components = [c("C-01"), c("C-02")];
    const edges = [declared("C-01", "C-02")];
    // Same structure → same key (status/provenance/drift are not inputs
    // at all — the type makes them unrepresentable here).
    expect(layoutKey(components, edges)).toBe(layoutKey([c("C-02"), c("C-01")], edges));
  });

  it("changes when the declared topology changes", () => {
    const components = [c("C-01"), c("C-02")];
    expect(layoutKey(components, [declared("C-01", "C-02")])).not.toBe(
      layoutKey(components, [observed("C-01", "C-02")]),
    );
    expect(layoutKey(components, [])).not.toBe(
      layoutKey([...components, c("C-03")], []),
    );
  });

  it("separator-proofs hostile ids (no cross-field collisions)", () => {
    expect(layoutKey([c("C-1declared")], [])).not.toBe(layoutKey([c("C-1"), c("declared")], []));
  });
});
