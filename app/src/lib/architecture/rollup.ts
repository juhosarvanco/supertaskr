/**
 * T-140-s1 — the resting payload's boundary, and the pull's.
 *
 * A TypeScript mirror of `nputer-index`'s `rollup::Rollup` and
 * `rollup::Detail` (the shapes `arch_rollup` and `arch_detail` return),
 * plus validating parsers. Same contract as `./graph`'s `parseGraph`:
 * collect-don't-throw, never throw, return whatever validates plus
 * structured issues for everything that does not, and every collection
 * keyed by a payload-derived string is a Map (ADR-009) so keys like
 * `__proto__` stay inert data.
 *
 * **WHY VALIDATE AN IPC REPLY AT ALL.** `graph.json` is repo content and
 * obviously untrusted; this payload comes from the app's own Rust side,
 * which is a weaker reason to distrust it but not a reason to skip the
 * boundary. The pane runs against THREE producers — the real command, the
 * dev harness, and the browser fallback — and a boundary that only the
 * real one satisfies is a boundary that fails in exactly the situations
 * nobody tests. It is also the seam where a Rust-side field rename
 * becomes a named issue instead of `undefined.length`.
 *
 * **WHAT IS NOT HERE.** No status, no provenance, no task join, no
 * component name or layer: ADR-015 keeps intent⨝tasks in TypeScript, and
 * the intent side already reaches the pane as the registry markdown the
 * docs watcher delivers. What this payload carries is the REALITY side —
 * which components the indexer saw, how many files each holds, and which
 * component edges it observed — because that is the side that was linear
 * in file count and had to stop being.
 */

import { parseGraph, type GraphParseResult } from "./graph";

/** Relations the rollup can name — the graph's own closed vocabulary. */
export const ROLLUP_RELATIONS = ["confirmed", "planned", "undeclared"] as const;
export type RollupRelation = (typeof ROLLUP_RELATIONS)[number];

export interface RollupComponent {
  id: string;
  /** How many indexed files this component claims. A COUNT — the list is
   * the pull's, and that is the whole point of the shape. */
  files: number;
}

export interface RollupEdge {
  from: string;
  to: string;
  relation: RollupRelation;
  declared: boolean;
  /** File-level import edges behind this component edge. */
  observed: number;
}

/** D1/D3/D5 travel whole; D2/D4 travel as one tally each with `count`. */
export interface RollupFinding {
  rule: string;
  id: string;
  from?: string;
  to?: string;
  component?: string;
  count?: number;
}

export interface RollupStats {
  files: number;
  symbols: number;
  edges: number;
  components: number;
  mapped: number;
  unmapped: number;
  truncatedSymbols: boolean;
}

export interface ArchRollup {
  schema: 1;
  components: RollupComponent[];
  edges: RollupEdge[];
  findings: RollupFinding[];
  stats: RollupStats;
  /** id -> file count (ADR-009 Map), the lookup the derivation joins on. */
  filesByComponent: ReadonlyMap<string, number>;
}

/** Boundary issues, the `GraphIssue` shape one payload over. */
export type RollupIssue =
  | { kind: "rollup-unreadable"; message: string }
  | { kind: "rollup-entry"; where: string; message: string };

export interface RollupParseResult {
  rollup?: ArchRollup;
  issues: RollupIssue[];
}

/**
 * The pull's answer.
 *
 * **A SLICE OF THE GRAPH, NOT A SUMMARY OF IT** — the populated arms
 * carry the raw rows a consumer would have read out of `graph.json` for
 * that one target, so the pane can REBUILD the slice it is looking at
 * (`partialGraph` below) and run its existing T1/T2 renderers over it.
 * One implementation of "what a file's panel shows", fed from two
 * sources, rather than a second rollup-shaped renderer for every screen.
 *
 * `unknown` IS AN ANSWER. A target the document does not hold means the
 * view is stale (or the click was invented), and the honest reply names
 * it rather than returning an empty list that reads as "that component
 * has no files". The pane must render the two differently.
 */
export type ArchDetail =
  | {
      kind: "component";
      id: string;
      files: string[];
      total: number;
      truncated: boolean;
      /** File→file import edges with both ends inside the component. */
      intra: [string, string][];
      intraTruncated: boolean;
    }
  | { kind: "unmapped"; files: string[]; total: number; truncated: boolean }
  | {
      kind: "file";
      path: string;
      lang: string;
      loc: number;
      hash: string;
      /**
       * The graph rows this answer carries, DELIBERATELY UNVALIDATED
       * HERE. They are validated once, by `parseGraph`, when
       * [`partialGraph`] assembles them into a graph — the same hardened
       * reader the committed file goes through. Validating them a second
       * time in this module would be a second implementation of the
       * graph schema, which is the fork ADR-015 and T-057 both forbid.
       */
      rows: {
        symbols: unknown[];
        /** Every graph edge touching the file or one of its symbols. */
        edges: unknown[];
        /** Package nodes those edges name. */
        packages: unknown[];
        unresolved: unknown[];
        /** Every file those edges name (symbol endpoints attributed to
         * their file), so a target row can be labelled and attributed. */
        neighbours: string[];
      };
    }
  | { kind: "unknown"; target: string };

export interface DetailParseResult {
  detail?: ArchDetail;
  issues: RollupIssue[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/** Own-property read over untrusted JSON — never the prototype chain
 * (the `graph.ts` discipline; `hasOwnProperty` is called THROUGH
 * Object.prototype so a crafted key cannot shadow it). */
const own = (record: Record<string, unknown>, key: string): unknown =>
  Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;

/**
 * Parse one `arch_rollup` reply. Never throws.
 *
 * The target is the payload VALUE (already JSON), not a string: this
 * arrives over `invoke`, which parses for us.
 */
export function parseRollup(value: unknown): RollupParseResult {
  const issues: RollupIssue[] = [];
  const unreadable = (message: string): RollupParseResult => ({
    issues: [...issues, { kind: "rollup-unreadable", message }],
  });
  if (!isRecord(value)) return unreadable("root is not an object");
  if (own(value, "schema") !== 1) {
    return unreadable(
      `unsupported schema ${JSON.stringify(own(value, "schema"))} (this reader understands schema 1)`,
    );
  }

  const entry = (where: string, message: string): void => {
    issues.push({ kind: "rollup-entry", where, message });
  };
  const rawArray = (key: string): unknown[] => {
    const raw = own(value, key);
    if (Array.isArray(raw)) return raw;
    entry(key, "missing or not an array; treated as empty");
    return [];
  };

  const filesByComponent = new Map<string, number>();
  const components: RollupComponent[] = [];
  rawArray("components").forEach((raw, index) => {
    const where = `components[${index}]`;
    if (!isRecord(raw)) return entry(where, "not an object; skipped");
    const id = own(raw, "id");
    const files = own(raw, "files");
    if (!isString(id) || id === "") return entry(where, "id must be a non-empty string; skipped");
    if (!isCount(files)) return entry(`${where}.files`, "not a non-negative count; skipped");
    if (filesByComponent.has(id)) {
      return entry(where, `duplicate component ${JSON.stringify(id)}; first entry wins`);
    }
    filesByComponent.set(id, files);
    components.push({ id, files });
  });

  const edges: RollupEdge[] = [];
  rawArray("edges").forEach((raw, index) => {
    const where = `edges[${index}]`;
    if (!isRecord(raw)) return entry(where, "not an object; skipped");
    const from = own(raw, "from");
    const to = own(raw, "to");
    const relation = own(raw, "relation");
    const declared = own(raw, "declared");
    const observed = own(raw, "observed");
    if (!isString(from) || !isString(to)) return entry(where, "from/to must be strings; skipped");
    if (!isString(relation) || !(ROLLUP_RELATIONS as readonly string[]).includes(relation)) {
      return entry(where, `unknown relation ${JSON.stringify(relation)}; skipped`);
    }
    if (typeof declared !== "boolean") return entry(`${where}.declared`, "not a boolean; skipped");
    if (!isCount(observed)) return entry(`${where}.observed`, "not a non-negative count; skipped");
    edges.push({ from, to, relation: relation as RollupRelation, declared, observed });
  });

  const findings: RollupFinding[] = [];
  rawArray("findings").forEach((raw, index) => {
    const where = `findings[${index}]`;
    if (!isRecord(raw)) return entry(where, "not an object; skipped");
    const rule = own(raw, "rule");
    const id = own(raw, "id");
    if (!isString(rule) || !isString(id)) return entry(where, "rule/id must be strings; skipped");
    const finding: RollupFinding = { rule, id };
    const from = own(raw, "from");
    const to = own(raw, "to");
    const component = own(raw, "component");
    const count = own(raw, "count");
    if (isString(from)) finding.from = from;
    if (isString(to)) finding.to = to;
    if (isString(component)) finding.component = component;
    if (isCount(count)) finding.count = count;
    findings.push(finding);
  });

  // Stats: known members only, static keys — a hostile stats object stays
  // inert (the `parseGraph` stance).
  const statsRaw = own(value, "stats");
  const stats: RollupStats = {
    files: 0,
    symbols: 0,
    edges: 0,
    components: 0,
    mapped: 0,
    unmapped: 0,
    truncatedSymbols: false,
  };
  if (!isRecord(statsRaw)) {
    entry("stats", "missing or not an object; every total defaulted to 0");
  } else {
    for (const key of ["files", "symbols", "edges", "components", "mapped", "unmapped"] as const) {
      const raw = own(statsRaw, key);
      if (isCount(raw)) stats[key] = raw;
      else entry(`stats.${key}`, "not a non-negative count; defaulted to 0");
    }
    if (own(statsRaw, "truncatedSymbols") === true) stats.truncatedSymbols = true;
  }

  return {
    rollup: { schema: 1, components, edges, findings, stats, filesByComponent },
    issues,
  };
}

const stringList = (value: unknown, where: string, issues: RollupIssue[]): string[] => {
  if (!Array.isArray(value)) {
    issues.push({ kind: "rollup-entry", where, message: "not an array; treated as empty" });
    return [];
  }
  const out: string[] = [];
  value.forEach((item, index) => {
    if (isString(item)) out.push(item);
    else issues.push({ kind: "rollup-entry", where: `${where}[${index}]`, message: "not a string; skipped" });
  });
  return out;
};

/** Raw rows kept as-is for `partialGraph` to validate. A non-array is an
 * empty one, named — the row-level checks belong to `parseGraph`. */
const rawRows = (value: unknown, where: string, issues: RollupIssue[]): unknown[] => {
  if (Array.isArray(value)) return value;
  issues.push({ kind: "rollup-entry", where, message: "not an array; treated as empty" });
  return [];
};

/** `[from, to]` pairs — the component answer's internal import edges. */
const pairList = (value: unknown, where: string, issues: RollupIssue[]): [string, string][] => {
  if (!Array.isArray(value)) {
    issues.push({ kind: "rollup-entry", where, message: "not an array; treated as empty" });
    return [];
  }
  const out: [string, string][] = [];
  value.forEach((item, index) => {
    if (Array.isArray(item) && item.length === 2 && isString(item[0]) && isString(item[1])) {
      out.push([item[0], item[1]]);
    } else {
      issues.push({
        kind: "rollup-entry",
        where: `${where}[${index}]`,
        message: "not a [from, to] pair of strings; skipped",
      });
    }
  });
  return out;
};

/** Parse one `arch_detail` reply. Never throws. */
export function parseDetail(value: unknown): DetailParseResult {
  const issues: RollupIssue[] = [];
  const unreadable = (message: string): DetailParseResult => ({
    issues: [...issues, { kind: "rollup-unreadable", message }],
  });
  if (!isRecord(value)) return unreadable("root is not an object");
  const kind = own(value, "kind");
  if (!isString(kind)) return unreadable("kind is missing or not a string");

  if (kind === "unknown") {
    const target = own(value, "target");
    return { detail: { kind: "unknown", target: isString(target) ? target : "" }, issues };
  }
  if (kind === "component" || kind === "unmapped") {
    const files = stringList(own(value, "files"), "files", issues);
    const totalRaw = own(value, "total");
    const total = isCount(totalRaw) ? totalRaw : files.length;
    if (!isCount(totalRaw)) {
      issues.push({
        kind: "rollup-entry",
        where: "total",
        message: "not a count; defaulted to the delivered length",
      });
    }
    const truncated = own(value, "truncated") === true || files.length < total;
    if (kind === "unmapped") return { detail: { kind: "unmapped", files, total, truncated }, issues };
    const id = own(value, "id");
    if (!isString(id)) return unreadable("component detail carries no id");
    return {
      detail: {
        kind: "component",
        id,
        files,
        total,
        truncated,
        intra: pairList(own(value, "intra"), "intra", issues),
        intraTruncated: own(value, "intraTruncated") === true,
      },
      issues,
    };
  }
  if (kind === "file") {
    const path = own(value, "path");
    if (!isString(path)) return unreadable("file detail carries no path");
    const lang = own(value, "lang");
    const loc = own(value, "loc");
    const hash = own(value, "hash");
    return {
      detail: {
        kind: "file",
        path,
        lang: isString(lang) ? lang : "",
        loc: isCount(loc) ? loc : 0,
        hash: isString(hash) ? hash : "",
        rows: {
          symbols: rawRows(own(value, "symbols"), "symbols", issues),
          edges: rawRows(own(value, "edges"), "edges", issues),
          packages: rawRows(own(value, "packages"), "packages", issues),
          unresolved: rawRows(own(value, "unresolved"), "unresolved", issues),
          neighbours: stringList(own(value, "neighbours"), "neighbours", issues),
        },
      },
      issues,
    };
  }
  return unreadable(`unknown detail kind ${JSON.stringify(kind)}`);
}

/**
 * T-140-s1 — ASSEMBLE THE SLICE OF THE GRAPH THE USER IS LOOKING AT.
 *
 * Takes whatever detail answers the pane has pulled and builds ONE
 * `ArchGraph` out of them, through `parseGraph` — the same hardened,
 * collect-don't-throw reader the committed file goes through. That is the
 * point of doing it this way: the pane's T1 and T2 renderers
 * (`expansionFor`, `intraEdges`, `fileDetail`, `searchMap`) then run
 * UNCHANGED over a partial graph, and there is exactly one implementation
 * of "what a file's panel shows" rather than a second, rollup-shaped one.
 *
 * **THE STUBS, AND WHY THEY ARE HONEST.** An edge the answer carries may
 * name a file this pane has not pulled, or a SYMBOL in one. `parseGraph`
 * refuses edges whose endpoints it cannot find — correctly, for a
 * committed document — so every named endpoint gets a stub entry here:
 * a file with `loc: 0` and no symbols of its own, and a symbol with an
 * empty kind. A stub is not a claim: nothing renders `loc` or `kind` for
 * a neighbour, and the alternative is silently dropping the edges that
 * are the whole reason the answer was pulled. What a stub must never do
 * is out-rank a real entry, so a pulled file always overwrites one.
 */
export function partialGraph(
  details: Iterable<ArchDetail>,
  // T-140-s1 verifier, correction 1: when the rollup says the emitter
  // dropped symbols, the sliced graph must SAY so — otherwise the
  // oversize mode (the exact mode this module exists for) renders "no
  // symbols declared" for every truncated file and the truncation note
  // never fires. The rollup carries stats.truncatedSymbols; this is its
  // first reader.
  truncatedSymbols = false,
): GraphParseResult | undefined {
  const files = new Map<string, Record<string, unknown>>();
  const stubSymbols = new Map<string, Map<string, Record<string, unknown>>>();
  const packages = new Map<string, unknown>();
  const edges: unknown[] = [];
  const unresolved: unknown[] = [];
  let any = false;

  const stubFile = (path: string): void => {
    if (files.has(path)) return;
    files.set(path, { id: `f:${path}`, path, lang: "", loc: 0, symbols: [] });
  };

  for (const detail of details) {
    if (detail.kind === "component" || detail.kind === "unmapped") {
      any = true;
      for (const path of detail.files) stubFile(path);
      if (detail.kind === "component") {
        for (const [from, to] of detail.intra) {
          stubFile(from);
          stubFile(to);
          edges.push({ from: `f:${from}`, to: `f:${to}`, kind: "import" });
        }
      }
      continue;
    }
    if (detail.kind !== "file") continue;
    any = true;
    // A pulled file always wins over a stub: it carries the real lang,
    // loc, hash and symbols.
    files.set(detail.path, {
      id: `f:${detail.path}`,
      path: detail.path,
      lang: detail.lang,
      loc: detail.loc,
      hash: detail.hash,
      symbols: detail.rows.symbols,
    });
    for (const path of detail.rows.neighbours) stubFile(path);
    for (const raw of detail.rows.packages) {
      if (isRecord(raw)) {
        const id = own(raw, "id");
        if (isString(id)) packages.set(id, raw);
      }
    }
    for (const raw of detail.rows.edges) {
      edges.push(raw);
      if (!isRecord(raw)) continue;
      // Symbol endpoints on files this pane has not pulled: stub the
      // symbol so the edge survives referential integrity. Split on the
      // LAST `#` — paths may contain one (the graph.rs id grammar).
      for (const key of ["from", "to"] as const) {
        const id = own(raw, key);
        if (!isString(id) || !id.startsWith("s:")) continue;
        const body = id.slice(2);
        const hash = body.lastIndexOf("#");
        if (hash === -1) continue;
        const path = body.slice(0, hash);
        const name = body.slice(hash + 1);
        if (path === detail.path) continue; // its real symbols are above
        stubFile(path);
        let bucket = stubSymbols.get(path);
        if (bucket === undefined) {
          bucket = new Map();
          stubSymbols.set(path, bucket);
        }
        bucket.set(id, { id, name, kind: "", exported: false, range: [0, 0] });
      }
    }
    for (const raw of detail.rows.unresolved) unresolved.push(raw);
  }
  if (!any) return undefined;

  for (const [path, bucket] of stubSymbols) {
    const entry = files.get(path);
    if (entry === undefined) continue;
    const existing = Array.isArray(entry.symbols) ? entry.symbols : [];
    if (existing.length > 0) continue; // a real file's own symbols stand
    entry.symbols = [...bucket.values()];
  }

  return parseGraph(
    JSON.stringify({
      schema: 1,
      root: ".",
      languages: [],
      files: [...files.values()],
      packages: [...packages.values()],
      edges,
      unresolved,
      ...(truncatedSymbols ? { stats: { truncated_symbols: true } } : {}),
    }),
    "the map channel",
  );
}

/** The pull's target grammar, spelled ONCE so the pane and the crate
 * cannot drift on it. A key, never a path (see `arch_cmd.rs`). */
export const componentTarget = (id: string): string => `c:${id}`;
export const fileTarget = (path: string): string => `f:${path}`;
