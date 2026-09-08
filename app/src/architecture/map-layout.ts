import { compareComponentIds } from "@supertaskr/parser/pure";
import { UNMAPPED_ID, type DerivedComponentKind } from "@/lib/architecture/derive";

/**
 * The map's deterministic layout (T-012): the design bundle's seven
 * rules ("map behavior" screen) implemented verbatim as pure functions
 * over the declared structure — same graph, same picture. No layout
 * library (plan amendment (a): elkjs is out — rule 3 explicitly rejects
 * crossing minimization because stability beats tidiness).
 *
 * The rules, and where each lives below:
 *  1. Column = longest path from any root along DECLARED edges only —
 *     observed-only (drift) edges never move a node (`assignColumns`).
 *  2. Cycles break at the edge whose target has the lowest component
 *     id, drift-neutral, keep drawing (`breakCycles`; broken edges are
 *     still drawn, they just stop counting for columns).
 *  3. Rows within a column by component id ascending — no crossing
 *     minimization (`assignRows`).
 *  4. Rows are 150px slots; a new component appends to the bottom of
 *     its column and nothing above moves (id order + ids-never-reused
 *     make append-only stability structural; pinned by test).
 *  5. Pins win and are skipped by slot assignment — PRESENT BUT INERT
 *     until T-015: no pins exist in T-012, so the seam is the `pinned`
 *     input set that nothing populates yet.
 *  6. Edges route as orthogonal elbows: 12px stub out, mid-gutter
 *     vertical, 12px stub in; same-column edges bow beside the row
 *     band; no curves (`routeEdge`).
 *  7. Re-index recomputes columns; only a column change moves a node —
 *     everything below is a pure function of structure, so this holds
 *     by construction (`layoutKey` is the structural identity).
 *  8. (Plan extension, settled at planning) the synthetic unmapped node
 *     has only observed edges; its column = max(column of its edge
 *     partners) + 1, bottom-append row; no partners → column 0.
 *
 * Layout never reads hover/overlay/selection — position is structure.
 *
 * T-013 ADDS RULE T1, AND IT IS RULE 4 WITH ONE SLOT MADE TALLER.
 * `expanded` maps a component id to its container's height; a column's
 * rows are then STACKED (`assignYs`) instead of multiplied by a constant
 * slot, so an expanded node pushes the rows BELOW it in its OWN column
 * down by exactly the extra height and nothing else moves. Two
 * properties follow structurally rather than by care, and both are
 * pinned by test: a node's y depends only on the rows ABOVE it in its
 * own column (so expanding anything leaves every row above it and every
 * other column byte-identical), and with `expanded` empty the stack
 * reduces to `SLOT_TOP + row * SLOT_H` — T-012's formula, unchanged.
 */

/** Node geometry (bundle "map" screen, measured). */
export const NODE_W = 192;
export const NODE_H = 66;
/** Column pitch: 192px node + 24px gutter. */
export const COLUMN_PITCH = 216;
/** Row slot height (T0). */
export const SLOT_H = 150;
/** First slot's y offset inside the graph area (hero: rows at 40/190/340). */
export const SLOT_TOP = 40;
/** Elbow stub length off a node edge. */
export const STUB = 12;
/** Drop below a node's bottom edge for back-edge runs (hero: 106→148). */
export const BACK_DROP = 42;

export interface LayoutComponentInput {
  id: string;
  kind: DerivedComponentKind;
}

export interface LayoutEdgeInput {
  from: string;
  to: string;
  /** True when the source declares the dependency (rule 1's edge set). */
  declared: boolean;
}

export interface LayoutNode {
  id: string;
  col: number;
  row: number;
  /** Top-left corner in graph-area coordinates. */
  x: number;
  y: number;
  /** Box height: `NODE_H` collapsed, the container's height expanded
   * (T-013 rule T1). Width never changes — see map-zoom.ts's header. */
  h: number;
}

export interface LayoutEdge {
  from: string;
  to: string;
  /** SVG path data (orthogonal elbows, rule 6). */
  path: string;
  /** Where the hover count chip sits (mid-vertical of the route). */
  labelAnchor: { x: number; y: number };
  /** Rule 2: this edge was cut from the column computation (still drawn). */
  cycleBroken: boolean;
}

export interface MapLayout {
  nodes: ReadonlyMap<string, LayoutNode>;
  edges: LayoutEdge[];
  /** One-hop neighborhood (both directions), self included. */
  neighborhood: ReadonlyMap<string, ReadonlySet<string>>;
  /** Graph-area extents (node boxes; rings/shadows live in CSS space). */
  width: number;
  height: number;
}

const byId = (a: string, b: string): number => compareComponentIds(a, b);

/**
 * Rule 2: iteratively find strongly connected components of the
 * declared-edge graph and cut, within each cycle, every edge whose
 * target is that SCC's lowest component id; repeat until acyclic (an
 * SCC can hide a sub-cycle that survives one round). Deterministic:
 * ids order the cuts, nothing else does.
 * Returns the set of cut edges as "from\u0000to" keys.
 */
export function breakCycles(
  ids: readonly string[],
  declared: readonly LayoutEdgeInput[],
): ReadonlySet<string> {
  const broken = new Set<string>();
  const key = (e: { from: string; to: string }): string => `${e.from}\u0000${e.to}`;

  for (;;) {
    const live = declared.filter((e) => !broken.has(key(e)));
    const sccs = stronglyConnected(ids, live);
    let cut = false;
    for (const scc of sccs) {
      if (scc.size < 2) continue; // self-edges never reach layout (derive drops them)
      const lowest = [...scc].sort(byId)[0] as string;
      for (const e of live) {
        if (e.to === lowest && scc.has(e.from) && scc.has(e.to)) {
          broken.add(key(e));
          cut = true;
        }
      }
    }
    if (!cut) return broken;
  }
}

/** Tarjan's SCC, iterative (file-derived graphs must not overflow the stack). */
function stronglyConnected(
  ids: readonly string[],
  edges: readonly LayoutEdgeInput[],
): Set<string>[] {
  const out = new Map<string, string[]>();
  for (const id of ids) out.set(id, []);
  for (const e of edges) {
    if (out.has(e.from) && out.has(e.to)) out.get(e.from)?.push(e.to);
  }
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const result: Set<string>[] = [];
  let counter = 0;

  for (const start of ids) {
    if (index.has(start)) continue;
    // Explicit DFS frames: [node, childCursor].
    const frames: [string, number][] = [[start, 0]];
    index.set(start, counter);
    low.set(start, counter);
    counter += 1;
    stack.push(start);
    onStack.add(start);
    while (frames.length > 0) {
      const frame = frames[frames.length - 1] as [string, number];
      const [node] = frame;
      const targets = out.get(node) ?? [];
      if (frame[1] < targets.length) {
        const next = targets[frame[1]] as string;
        frame[1] += 1;
        if (!index.has(next)) {
          index.set(next, counter);
          low.set(next, counter);
          counter += 1;
          stack.push(next);
          onStack.add(next);
          frames.push([next, 0]);
        } else if (onStack.has(next)) {
          low.set(node, Math.min(low.get(node) as number, index.get(next) as number));
        }
      } else {
        frames.pop();
        const parent = frames[frames.length - 1];
        if (parent !== undefined) {
          low.set(
            parent[0],
            Math.min(low.get(parent[0]) as number, low.get(node) as number),
          );
        }
        if (low.get(node) === index.get(node)) {
          const scc = new Set<string>();
          for (;;) {
            const popped = stack.pop() as string;
            onStack.delete(popped);
            scc.add(popped);
            if (popped === node) break;
          }
          result.push(scc);
        }
      }
    }
  }
  return result;
}

/**
 * Rules 1 + 8: longest path from any root along declared edges (cycle
 * cuts applied), unmapped placed after its partners.
 */
function assignColumns(
  components: readonly LayoutComponentInput[],
  edges: readonly LayoutEdgeInput[],
): Map<string, number> {
  const real = components.filter((c) => c.kind !== "unmapped").map((c) => c.id);
  const realSet = new Set(real);
  const declared = edges.filter(
    (e) => e.declared && realSet.has(e.from) && realSet.has(e.to),
  );
  const broken = breakCycles(real, declared);
  const live = declared.filter((e) => !broken.has(`${e.from}\u0000${e.to}`));

  // Longest path via Kahn topological order (acyclic after the cuts).
  const col = new Map<string, number>();
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const id of real) {
    col.set(id, 0);
    incoming.set(id, 0);
    outgoing.set(id, []);
  }
  for (const e of live) {
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
    outgoing.get(e.from)?.push(e.to);
  }
  const queue = real.filter((id) => (incoming.get(id) ?? 0) === 0).sort(byId);
  let head = 0;
  while (head < queue.length) {
    const id = queue[head] as string;
    head += 1;
    for (const next of outgoing.get(id) ?? []) {
      const candidate = (col.get(id) as number) + 1;
      if (candidate > (col.get(next) as number)) col.set(next, candidate);
      const remaining = (incoming.get(next) as number) - 1;
      incoming.set(next, remaining);
      if (remaining === 0) queue.push(next);
    }
  }

  // Rule 8: unmapped after everyone it touches (any direction).
  if (components.some((c) => c.kind === "unmapped")) {
    let unmappedCol = 0;
    let hasPartner = false;
    for (const e of edges) {
      const partner =
        e.from === UNMAPPED_ID ? e.to : e.to === UNMAPPED_ID ? e.from : undefined;
      if (partner === undefined || !col.has(partner)) continue;
      hasPartner = true;
      unmappedCol = Math.max(unmappedCol, (col.get(partner) as number) + 1);
    }
    col.set(UNMAPPED_ID, hasPartner ? unmappedCol : 0);
  }
  return col;
}

/** Rules 3 + 4: rows per column — components by id ascending, the
 * synthetic unmapped node always bottom-appended. (Rule 5's pin skip
 * would filter pinned ids out of slot assignment here; no pins exist
 * until T-015.) */
function assignRows(
  components: readonly LayoutComponentInput[],
  col: ReadonlyMap<string, number>,
): Map<string, number> {
  const byColumn = new Map<number, string[]>();
  for (const c of components) {
    const column = col.get(c.id);
    if (column === undefined) continue;
    const bucket = byColumn.get(column);
    if (bucket === undefined) byColumn.set(column, [c.id]);
    else bucket.push(c.id);
  }
  const row = new Map<string, number>();
  for (const ids of byColumn.values()) {
    const ordered = [
      ...ids.filter((id) => id !== UNMAPPED_ID).sort(byId),
      ...ids.filter((id) => id === UNMAPPED_ID),
    ];
    ordered.forEach((id, i) => row.set(id, i));
  }
  return row;
}

/**
 * Rules 3 + 4 + T1: y per node by STACKING its column. A row's slot is
 * `SLOT_H` when the node is collapsed and `container + (SLOT_H -
 * NODE_H)` when it is expanded — the same gutter under a taller box —
 * so the extra height lands entirely on the rows below it, in this
 * column only. With `expanded` empty this returns `SLOT_TOP + row *
 * SLOT_H` for every node, which is T-012's formula.
 */
function assignYs(
  components: readonly LayoutComponentInput[],
  col: ReadonlyMap<string, number>,
  row: ReadonlyMap<string, number>,
  heights: ReadonlyMap<string, number>,
): Map<string, number> {
  const byColumn = new Map<number, string[]>();
  for (const c of components) {
    const column = col.get(c.id);
    if (column === undefined || row.get(c.id) === undefined) continue;
    const bucket = byColumn.get(column);
    if (bucket === undefined) byColumn.set(column, [c.id]);
    else bucket.push(c.id);
  }
  const ys = new Map<string, number>();
  for (const ids of byColumn.values()) {
    const ordered = [...ids].sort((a, b) => (row.get(a) as number) - (row.get(b) as number));
    let y = SLOT_TOP;
    for (const id of ordered) {
      ys.set(id, y);
      y += (heights.get(id) ?? NODE_H) + (SLOT_H - NODE_H);
    }
  }
  return ys;
}

/** Rule 6: orthogonal elbow routing. */
function routeEdge(src: LayoutNode, dst: LayoutNode): Pick<LayoutEdge, "path" | "labelAnchor"> {
  const sy = src.y + src.h / 2;
  const ty = dst.y + dst.h / 2;

  if (dst.col > src.col) {
    // Forward: out of the source's right edge, into the target's left.
    const sx = src.x + NODE_W;
    const tx = dst.x;
    if (sy === ty) {
      return { path: `M${sx} ${sy} H${tx}`, labelAnchor: { x: (sx + tx) / 2, y: sy } };
    }
    const midX = sx + STUB;
    return {
      path: `M${sx} ${sy} H${midX} V${ty} H${tx}`,
      labelAnchor: { x: midX, y: (sy + ty) / 2 },
    };
  }

  if (dst.col === src.col) {
    // Same column: bow beside the column at stub distance — orthogonal,
    // clear of every node box in the column (they end at x + NODE_W).
    const x = src.x + NODE_W;
    const bowX = x + STUB;
    return {
      path: `M${x} ${sy} H${bowX} V${ty} H${x}`,
      labelAnchor: { x: bowX, y: (sy + ty) / 2 },
    };
  }

  // Backward: out of the source's bottom center, run below its band,
  // across to the target's center column, then into the target's top
  // (target below the run) or bottom (target above it) — the hero's
  // C-01→C-05 back edge pattern.
  const sx = src.x + NODE_W / 2;
  const startY = src.y + src.h;
  const runY = startY + BACK_DROP;
  const tx = dst.x + NODE_W / 2;
  const targetEdgeY = dst.y >= runY ? dst.y : dst.y + dst.h;
  return {
    path: `M${sx} ${startY} V${runY} H${tx} V${targetEdgeY}`,
    labelAnchor: { x: tx, y: (runY + targetEdgeY) / 2 },
  };
}

/**
 * The full layout. Pure and total: unknown edge endpoints are skipped
 * (never a crash — a hostile model must not take the pane down).
 */
export function layoutMap(
  components: readonly LayoutComponentInput[],
  edges: readonly LayoutEdgeInput[],
  /** T-013 rule T1: id → container height for the expanded nodes.
   * Absent (or empty) is exactly T-012's layout. */
  expanded: ReadonlyMap<string, number> = new Map(),
): MapLayout {
  const col = assignColumns(components, edges);
  const row = assignRows(components, col);
  const ys = assignYs(components, col, row, expanded);

  const nodes = new Map<string, LayoutNode>();
  for (const c of components) {
    const column = col.get(c.id);
    const r = row.get(c.id);
    const y = ys.get(c.id);
    if (column === undefined || r === undefined || y === undefined) continue;
    nodes.set(c.id, {
      id: c.id,
      col: column,
      row: r,
      x: column * COLUMN_PITCH,
      y,
      h: expanded.get(c.id) ?? NODE_H,
    });
  }

  const realIds = new Set(components.filter((c) => c.kind !== "unmapped").map((c) => c.id));
  const declared = edges.filter((e) => e.declared && realIds.has(e.from) && realIds.has(e.to));
  const broken = breakCycles([...realIds], declared);

  const laidEdges: LayoutEdge[] = [];
  const sortedEdges = [...edges].sort((a, b) => byId(a.from, b.from) || byId(a.to, b.to));
  for (const e of sortedEdges) {
    const src = nodes.get(e.from);
    const dst = nodes.get(e.to);
    if (src === undefined || dst === undefined) continue;
    laidEdges.push({
      from: e.from,
      to: e.to,
      ...routeEdge(src, dst),
      cycleBroken: broken.has(`${e.from}\u0000${e.to}`),
    });
  }

  const neighborhood = new Map<string, Set<string>>();
  for (const id of nodes.keys()) neighborhood.set(id, new Set([id]));
  for (const e of laidEdges) {
    neighborhood.get(e.from)?.add(e.to);
    neighborhood.get(e.to)?.add(e.from);
  }

  let width = 0;
  let height = 0;
  for (const n of nodes.values()) {
    width = Math.max(width, n.x + NODE_W);
    height = Math.max(height, n.y + n.h);
  }

  return { nodes, edges: laidEdges, neighborhood, width, height };
}

/**
 * Structural identity for memoization: layout depends on the component
 * set (id + kind) and edge topology (from/to/declared) ONLY. Status
 * flips, provenance, drift counts, hover, overlay, selection — none of
 * them appear here, so none of them can move a node (rule 7's spirit;
 * pinned by test: same key ⇒ layoutMap not re-run ⇒ same positions,
 * and even across a re-run, positions are a pure function of this key).
 *
 * T-013 adds the EXPANSION to the key, and it belongs here rather than
 * beside it: an expanded container is a structural change (a slot got
 * taller), so it must invalidate the cache the way a new component does
 * -- and it must appear here for the same reason status must not.
 */
export function layoutKey(
  components: readonly LayoutComponentInput[],
  edges: readonly LayoutEdgeInput[],
  expanded: ReadonlyMap<string, number> = new Map(),
): string {
  const c = components.map((x) => `${x.id}\u0001${x.kind}`).sort().join("\u0002");
  const e = edges
    .map((x) => `${x.from}\u0001${x.to}\u0001${x.declared ? 1 : 0}`)
    .sort()
    .join("\u0002");
  const x = [...expanded.entries()]
    .map(([id, height]) => `${id}\u0001${height}`)
    .sort()
    .join("\u0002");
  return `${c}\u0003${e}\u0003${x}`;
}
