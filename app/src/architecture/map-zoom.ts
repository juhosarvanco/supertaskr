import type { ArchGraph, GraphFile } from "@/lib/architecture/graph";
import type { DerivedArchitecture } from "@/lib/architecture/derive";
import { NODE_H, NODE_W } from "./map-layout";

/**
 * SEMANTIC ZOOM, as pure models (T-013). T1 (a component expanded into
 * its files) and T2 (a file's symbols and resolved edges) share this
 * module because they are one idea seen at two magnifications, and
 * because both must be answerable WITHOUT a DOM — the layout needs a
 * container's height before anything renders, and the panel's symbol
 * list is a table a test should be able to read off a value.
 *
 * ────────────────────────────────────────────────────────────────────
 * T1 · WHAT "IN ITS OWN COLUMN" COSTS, AND WHY THE CONTAINER IS 192 WIDE
 *
 * The card's criterion (T-012's amendment (a), which rewrote it) is
 * exact: *"the container grows down within its own column and pushes
 * only that column; siblings do not move"*. The design bundle's T1 card
 * also says the container "grows down AND RIGHT into the lane it already
 * owns", and draws it 420px wide beside 132px nodes — a ratio that at
 * this map's real 192px node is ~611px, i.e. THREE columns of the 216px
 * pitch. Growing right by that much moves the siblings the same sentence
 * forbids, so the width stays `NODE_W` and only the height moves. The
 * file grid the mock draws two-up is a single column here for the same
 * reason. Recorded as a deviation in the card rather than split the
 * difference silently.
 *
 * ────────────────────────────────────────────────────────────────────
 * T1 · THE RENDER BUDGET IS A DEFINED STATE, NOT A LIMIT THAT BITES
 *
 * A component can claim hundreds of files (C-05 claims 54 on this repo
 * today, and a real product repo will not be so polite). Drawing them
 * all inside a 192px column is a canvas that scrolls for a screen and a
 * half per node. Over `FILE_BUDGET` rows the container GROUPS DEEPER —
 * literally: it rolls the directory grouping up one level at a time
 * until the group count fits — and over `GROUP_BUDGET` groups it
 * PAGINATES, showing the first N by path order and naming the
 * remainder. Both states say what they are on the container, and the
 * panel's file section (T-012) still carries the complete list, so
 * nothing becomes unreachable.
 */

// --- container geometry (layout px, pre-scale) --------------------------

/** The container keeps the node's width. See the header. */
export const CONTAINER_W = NODE_W;
/** Header row: id · name · status · collapse. */
export const CONTAINER_HEADER_H = 30;
/** Padding inside the container box, all four sides. */
export const CONTAINER_PAD = 8;
/** The container's own 1px border, inside its border-box. */
export const CONTAINER_BORDER = 1;
/** A directory label line. */
export const GROUP_LABEL_H = 14;
/** One file (or group) row. */
export const ROW_H = 20;
/** Between rows inside a group. */
export const ROW_GAP = 3;
/** Between groups. */
export const GROUP_GAP = 7;
/** The degraded-state note line, when there is one. */
export const NOTE_H = 15;
/** Left gutter the intra-component edge bows are drawn in. */
export const INTRA_GUTTER = 12;
/** Intra-component edges one container will draw. Over it the bows stop
 * being a picture of anything, so the count is stated instead. */
export const INTRA_EDGE_BUDGET = 40;

/** File rows one container will draw before it groups deeper. */
export const FILE_BUDGET = 48;
/** Group rows it will draw before it paginates. */
export const GROUP_BUDGET = 24;

export type ExpansionMode =
  /** Every file, under its own directory label. */
  | "files"
  /** Over the file budget: one row per directory group, rolled up. */
  | "grouped"
  /** Over the group budget too: the first `GROUP_BUDGET` groups only. */
  | "paginated";

/** Where one file row sits inside the container box, so the edge layer
 * can aim at it without measuring the DOM. `y` is the row's CENTRE,
 * relative to the container's own top-left. */
export interface ExpansionRow {
  path: string;
  y: number;
}

export interface ExpansionGroup {
  /** Directory label as drawn (always ends in `/`, or `(root)`). */
  label: string;
  /** Leaf names, in path order — empty in the grouped/paginated modes. */
  leaves: string[];
  /** Files under this group (equals `leaves.length` in `files` mode). */
  count: number;
}

export interface Expansion {
  mode: ExpansionMode;
  groups: ExpansionGroup[];
  totalFiles: number;
  /** Files actually drawn (grouped modes draw none individually). */
  shownFiles: number;
  /** Groups the pagination left out. */
  hiddenGroups: number;
  /** Directory segments the grouping kept (`files` mode keeps all). */
  depth: number;
  /** Box height in layout px — what the layout stacks around. */
  height: number;
  /** Row centres for the drawn files (empty in the grouped modes). */
  rows: ExpansionRow[];
  /** The degraded state, in one sentence; absent when there is none. */
  note?: string;
}

const byPath = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** `(root)` for a bare filename; otherwise the directory with a slash. */
function labelFor(segments: readonly string[]): string {
  return segments.length === 0 ? "(root)" : `${segments.join("/")}/`;
}

function leafOf(path: string): string {
  const slash = path.lastIndexOf("/");
  return slash === -1 ? path : path.slice(slash + 1);
}

function dirSegments(path: string): string[] {
  const parts = path.split("/");
  parts.pop();
  return parts;
}

/** Group paths at `depth` directory segments. Deterministic: keys sort
 * by path bytes, members keep the input's own (path-sorted) order. */
function groupAt(paths: readonly string[], depth: number): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const path of paths) {
    const key = labelFor(dirSegments(path).slice(0, depth));
    const bucket = groups.get(key);
    if (bucket === undefined) groups.set(key, [path]);
    else bucket.push(path);
  }
  return new Map([...groups.entries()].sort(([a], [b]) => byPath(a, b)));
}

/**
 * The container model for one component's file list. Pure and total:
 * an empty list is a legal (and rendered) expansion, so a declared-only
 * component can still be opened and still says why it is empty.
 */
export function expansionFor(files: readonly string[]): Expansion {
  const paths = [...files].sort(byPath);
  const total = paths.length;

  let fullDepth = 0;
  for (const path of paths) fullDepth = Math.max(fullDepth, dirSegments(path).length);

  if (total <= FILE_BUDGET) {
    const members = [...groupAt(paths, fullDepth).entries()];
    const groups = members.map(([label, files]) => ({
      label,
      leaves: files.map(leafOf),
      count: files.length,
    }));
    // Row centres, from the same stack `heightOf` sums. Computed here
    // rather than measured in the DOM: the edge layer must be able to
    // aim before anything is laid out, and jsdom has no layout at all.
    const rows: ExpansionRow[] = [];
    let y = CONTAINER_BORDER + CONTAINER_PAD + CONTAINER_HEADER_H;
    members.forEach(([, files], index) => {
      if (index > 0) y += GROUP_GAP;
      y += GROUP_LABEL_H;
      files.forEach((path) => {
        y += ROW_GAP;
        rows.push({ path, y: y + ROW_H / 2 });
        y += ROW_H;
      });
    });
    return {
      mode: "files",
      groups,
      rows,
      totalFiles: total,
      shownFiles: total,
      hiddenGroups: 0,
      depth: fullDepth,
      height: heightOf("files", groups, false),
    };
  }

  // Over budget: group deeper (coarser) until the groups fit — but the
  // roll-up FLOORS AT ONE SEGMENT, and that floor is what makes the
  // other degraded state reachable. Depth 0 puts every path under
  // `(root)`, so an unfloored loop always terminates at exactly one
  // group and PAGINATION becomes unreachable code — a defined state
  // that can never happen is not a defined state. Stopping at the top
  // level also keeps the only grouping a reader can act on.
  let depth = fullDepth;
  let grouped = groupAt(paths, depth);
  while (grouped.size > GROUP_BUDGET && depth > 1) {
    depth -= 1;
    grouped = groupAt(paths, depth);
  }

  const all = [...grouped.entries()].map(([label, members]) => ({
    label,
    leaves: [] as string[],
    count: members.length,
  }));
  const paginated = all.length > GROUP_BUDGET;
  const groups = paginated ? all.slice(0, GROUP_BUDGET) : all;
  const hiddenGroups = all.length - groups.length;
  const mode: ExpansionMode = paginated ? "paginated" : "grouped";
  const note = paginated
    ? `${total} files · ${groups.length} of ${all.length} directories · the panel has the rest`
    : `${total} files over the ${FILE_BUDGET}-row budget · grouped by directory`;

  return {
    mode,
    groups,
    rows: [],
    totalFiles: total,
    shownFiles: 0,
    hiddenGroups,
    depth,
    height: heightOf(mode, groups, true),
    note,
  };
}

/**
 * The container's height in layout px, from the SAME constants the
 * renderer lays out with (MapContainer imports them rather than
 * restating them, so the two cannot drift). Structure mirrored exactly:
 * an outer border-box of `CONTAINER_BORDER` + `CONTAINER_PAD`, a header
 * row, then a flex column whose children are the groups (each its own
 * flex column) and, when there is one, the degraded-state note.
 */
function heightOf(
  mode: ExpansionMode,
  groups: readonly ExpansionGroup[],
  hasNote: boolean,
): number {
  const children: number[] = [];
  // The "no indexed files" line — a container is never empty of words.
  if (groups.length === 0) children.push(ROW_H);
  for (const group of groups) {
    children.push(
      mode === "files"
        ? GROUP_LABEL_H + group.leaves.length * (ROW_H + ROW_GAP)
        : ROW_H,
    );
  }
  if (hasNote) children.push(NOTE_H);
  const body =
    children.reduce((total, height) => total + height, 0) +
    Math.max(0, children.length - 1) * GROUP_GAP;
  const total =
    CONTAINER_BORDER * 2 + CONTAINER_PAD * 2 + CONTAINER_HEADER_H + body;
  // An expanded node is never SMALLER than the collapsed one it replaced.
  return Math.max(NODE_H, total);
}

// ────────────────────────────────────────────────────────────────────
// T2 · a file's symbols and resolved edges — IN THE PANEL, never on the
// canvas (plan §1.2: canvas symbol nodes would double the graph and
// stop it being a map).
// ────────────────────────────────────────────────────────────────────

/** T-009 emits `resolved` and nothing else; an absent field is treated
 * as resolved, an explicit `heuristic` is not shown (plan §11: the UI
 * never draws heuristic edges). */
function isResolved(confidence: string | undefined): boolean {
  return confidence === undefined || confidence === "resolved";
}

export interface SymbolRow {
  name: string;
  kind: string;
  exported: boolean;
  /** Resolved edges pointing AT this symbol, from anywhere in the graph. */
  refs: number;
  /** 1-based inclusive line range, as the graph records it. */
  range: [number, number];
}

export interface EdgeRow {
  /** `import` | `call` | `type_ref`. */
  kind: string;
  /** What is drawn in the row: a symbol name, or a module leaf. */
  label: string;
  /** The full target for a hover title (path, or `p:name`). */
  target: string;
  /** The component that owns the target, when one does. */
  component?: string;
}

export interface FileDetail {
  path: string;
  /** Owning component per §4.1, or the synthetic unmapped id. */
  component?: string;
  /** Every component whose globs claim it — >1 is the D4 finding. */
  claimedBy: string[];
  /** True when the graph has no such file (deleted, or never indexed). */
  missing: boolean;
  lang?: string;
  loc: number;
  symbols: SymbolRow[];
  /** The file's own resolved outgoing edges, imports first. */
  edges: EdgeRow[];
  /** Specifiers the resolver could not place (graph `unresolved`). */
  unresolved: string[];
  /** The graph carries no symbols for this file (budget truncation). */
  symbolsTruncated: boolean;
}

const EDGE_ORDER: Record<string, number> = { import: 0, type_ref: 1, call: 2 };

/** Split `s:<path>#<name>` on the LAST `#` — paths may contain one. */
function symbolName(id: string): string {
  const hash = id.lastIndexOf("#");
  return hash === -1 ? id : id.slice(hash + 1);
}

function packageLeaf(id: string): string {
  return id.startsWith("p:") ? id.slice(2) : id;
}

/**
 * Everything the panel shows about one file. Total: an unknown path, an
 * absent graph and a file the indexer truncated all return a value, and
 * every empty section renders a placeholder rather than an error
 * (the T-005 rule the map panel already obeys).
 */
export function fileDetail(
  path: string,
  derived: DerivedArchitecture,
  graph: ArchGraph | undefined,
): FileDetail {
  const claimedBy: string[] = [];
  for (const finding of derived.findings) {
    if (finding.rule === "D4" && finding.path === path) claimedBy.push(...finding.ids);
  }
  const component = derived.fileComponent.get(path);
  const base: FileDetail = {
    path,
    claimedBy,
    missing: true,
    loc: 0,
    symbols: [],
    edges: [],
    unresolved: [],
    symbolsTruncated: false,
  };
  if (component !== undefined) base.component = component;

  const file: GraphFile | undefined = graph?.filesById.get(`f:${path}`);
  if (graph === undefined || file === undefined) return base;

  // Incoming resolved references, counted once over the whole edge list.
  const refs = new Map<string, number>();
  for (const edge of graph.edges) {
    if (edge.kind === "import") continue;
    if (!isResolved(edge.confidence)) continue;
    if (!edge.to.startsWith("s:")) continue;
    refs.set(edge.to, (refs.get(edge.to) ?? 0) + 1);
  }

  const symbols: SymbolRow[] = file.symbols
    .map((symbol) => ({
      name: symbol.name,
      kind: symbol.kind,
      exported: symbol.exported,
      refs: refs.get(symbol.id) ?? 0,
      range: symbol.range,
    }))
    .sort((a, b) => a.range[0] - b.range[0] || byPath(a.name, b.name));

  const fromIds = new Set<string>([file.id, ...file.symbols.map((symbol) => symbol.id)]);
  const seen = new Set<string>();
  const edges: EdgeRow[] = [];
  for (const edge of graph.edges) {
    if (!fromIds.has(edge.from)) continue;
    if (!isResolved(edge.confidence)) continue;
    const key = `${edge.kind} ${edge.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    let label: string;
    let owner: string | undefined;
    if (edge.to.startsWith("f:")) {
      const target = graph.filesById.get(edge.to);
      if (target === undefined) continue;
      label = leafOf(target.path);
      owner = derived.fileComponent.get(target.path);
    } else if (edge.to.startsWith("p:")) {
      const pkg = graph.packagesById.get(edge.to);
      if (pkg === undefined) continue;
      label = pkg.name;
      owner = pkg.path === undefined ? undefined : derived.fileComponent.get(pkg.path);
    } else {
      label = symbolName(edge.to);
      const hash = edge.to.lastIndexOf("#");
      owner = hash === -1 ? undefined : derived.fileComponent.get(edge.to.slice(2, hash));
    }
    const row: EdgeRow = { kind: edge.kind, label, target: packageLeaf(edge.to) };
    if (owner !== undefined && owner !== component) row.component = owner;
    edges.push(row);
  }
  edges.sort(
    (a, b) =>
      (EDGE_ORDER[a.kind] ?? 9) - (EDGE_ORDER[b.kind] ?? 9) ||
      byPath(a.label, b.label) ||
      byPath(a.target, b.target),
  );

  const unresolved = graph.unresolved
    .filter((entry) => entry.from === file.id)
    .map((entry) => entry.specifier)
    .sort(byPath);

  const detail: FileDetail = {
    ...base,
    missing: false,
    loc: file.loc,
    symbols,
    edges,
    unresolved,
    symbolsTruncated: file.symbols.length === 0 && graph.stats?.truncatedSymbols === true,
  };
  detail.lang = file.lang;
  return detail;
}

/**
 * The file→file import edges with BOTH ends inside one component — the
 * criterion's "intra-component edges". Deduped, deterministic, and
 * derived from the SAME `fileComponent` mapping the panel and the churn
 * attribution use, so the three can never disagree about who owns a
 * file. Self-edges are impossible here (the graph has none) and are
 * dropped anyway rather than drawn as a loop.
 */
export function intraEdges(
  componentId: string,
  derived: DerivedArchitecture,
  graph: ArchGraph | undefined,
): { from: string; to: string }[] {
  if (graph === undefined) return [];
  const out: { from: string; to: string }[] = [];
  const seen = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.kind !== "import") continue;
    if (!edge.from.startsWith("f:") || !edge.to.startsWith("f:")) continue;
    const from = graph.filesById.get(edge.from)?.path;
    const to = graph.filesById.get(edge.to)?.path;
    if (from === undefined || to === undefined || from === to) continue;
    if (derived.fileComponent.get(from) !== componentId) continue;
    if (derived.fileComponent.get(to) !== componentId) continue;
    const key = `${from}\u0000${to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ from, to });
  }
  return out.sort((a, b) => byPath(a.from, b.from) || byPath(a.to, b.to));
}
