/**
 * Reality-layer boundary (T-011): a TypeScript mirror of the graph.json
 * schema (map-technical-plan §3.1, as emitted by nputer-index — T-009)
 * plus a validating parser.
 *
 * graph.json is repo content and therefore UNTRUSTED input: it is
 * normally written by the indexer, but nothing stops a hostile or
 * corrupted file from sitting at that path. The contract here is
 * collect-don't-throw (the lib-parser discipline): `parseGraph` never
 * throws, returns whatever validates plus structured issues for
 * everything that doesn't, and every collection keyed by graph-derived
 * strings is a Map (ADR-009) so keys like `__proto__` are inert data.
 *
 * Schema stance: schema 1 is closed. Unknown top-level or entry-level
 * keys are ignored (not preserved — this file is machine-generated,
 * versioned content, not human archaeology; a future schema bumps the
 * number and lands here as `graph-unreadable` until the mirror learns it).
 */

export const GRAPH_PATH = "docs/architecture/graph.json";

/** Edge kinds the derivation understands (schema 1, closed). */
export const GRAPH_EDGE_KINDS = ["import", "call", "type_ref"] as const;
export type GraphEdgeKind = (typeof GRAPH_EDGE_KINDS)[number];

export interface GraphSymbol {
  /** `s:<path>#<name>` (split on the LAST `#` — paths may contain `#`). */
  id: string;
  name: string;
  /** Open vocabulary (T-010 adds Rust kinds); shape-validated only. */
  kind: string;
  exported: boolean;
  /** 1-based inclusive [start, end] lines. */
  range: [number, number];
}

export interface GraphFile {
  /** `f:<path>` — validated to agree with `path`. */
  id: string;
  path: string;
  lang: string;
  hash?: string;
  loc: number;
  symbols: GraphSymbol[];
}

export interface GraphPackage {
  /** `p:<name>` — validated to agree with `name`. */
  id: string;
  name: string;
  ecosystem: string;
  /**
   * Repo-relative directory for `file:`/`link:` dependencies that land
   * inside the root (T-009 plan §6.6) — the seam the derivation joins
   * against component globs. Absolute or `..`-carrying values are
   * refused at this boundary (containment hygiene: a hostile graph must
   * not aim ownership outside the repo).
   */
  path?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: GraphEdgeKind;
  /** Imported names on import edges (`default`, `*`, or source names). */
  symbols?: string[];
  reexport?: boolean;
  /** `resolved` is the only value T-009 emits; kept open for `heuristic`. */
  confidence?: string;
}

export interface GraphUnresolved {
  from: string;
  specifier: string;
  reason: string;
}

/** Content-determined stats; unknown keys are dropped (closed schema). */
export interface GraphStats {
  files?: number;
  symbols?: number;
  edges?: number;
  truncatedSymbols?: boolean;
  truncatedFiles?: number;
  skipped?: number;
}

export interface ArchGraph {
  schema: 1;
  root: string;
  languages: string[];
  files: GraphFile[];
  packages: GraphPackage[];
  edges: GraphEdge[];
  unresolved: GraphUnresolved[];
  stats?: GraphStats;
  /** Lookup maps (ADR-009: Map, keyed by graph-derived ids). */
  filesById: ReadonlyMap<string, GraphFile>;
  packagesById: ReadonlyMap<string, GraphPackage>;
}

/**
 * Structured graph-boundary issues. A separate union from lib-parser's
 * ParseIssue on purpose: those kinds are frontmatter-shaped and the
 * union is closed inside @nputer/parser (out of T-011's boundary);
 * T-012 renders both channels.
 */
export type GraphIssue =
  /** The file is not a usable graph at all (bad JSON, wrong shape/schema). */
  | { kind: "graph-unreadable"; file: string; message: string }
  /** One entry or field was malformed and skipped/defaulted; rest kept. */
  | { kind: "graph-entry"; file: string; where: string; message: string }
  /** An edge/unresolved entry references an id the graph does not define. */
  | { kind: "graph-reference"; file: string; where: string; message: string };

export interface GraphParseResult {
  /** Absent when the input was not a usable graph (see issues). */
  graph?: ArchGraph;
  issues: GraphIssue[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** Read an own property from untrusted JSON (never the prototype chain).
 * hasOwnProperty is called through Object.prototype, so a crafted
 * `hasOwnProperty` key in the JSON cannot shadow it (ADR-009 discipline;
 * Object.hasOwn needs the ES2022 lib this app does not target). */
const own = (record: Record<string, unknown>, key: string): unknown =>
  Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;

const stringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every(isString) ? [...value] : undefined;

/** Repo-relative POSIX path sanity for package `path` (containment). */
function isRepoRelativePath(path: string): boolean {
  if (path === "" || path.startsWith("/") || path.includes("\\")) return false;
  const segments = path.split("/");
  return segments.every((segment) => segment !== "" && segment !== "..");
}

/**
 * Parse graph.json content. Never throws; hostile content degrades to
 * issues. `file` names the source in issues (defaults to GRAPH_PATH).
 */
export function parseGraph(text: string, file: string = GRAPH_PATH): GraphParseResult {
  const issues: GraphIssue[] = [];
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { issues: [{ kind: "graph-unreadable", file, message: `not valid JSON: ${message}` }] };
  }
  return parseGraphValue(value, file, issues);
}

function parseGraphValue(value: unknown, file: string, issues: GraphIssue[]): GraphParseResult {
  if (!isRecord(value)) {
    issues.push({ kind: "graph-unreadable", file, message: "root is not an object" });
    return { issues };
  }
  const schema = own(value, "schema");
  if (schema !== 1) {
    issues.push({
      kind: "graph-unreadable",
      file,
      message: `unsupported schema ${JSON.stringify(schema)} (this reader understands schema 1)`,
    });
    return { issues };
  }

  const entry = (where: string, message: string): void => {
    issues.push({ kind: "graph-entry", file, where, message });
  };
  const reference = (where: string, message: string): void => {
    issues.push({ kind: "graph-reference", file, where, message });
  };

  const root = isString(own(value, "root")) ? (own(value, "root") as string) : ".";
  if (!isString(own(value, "root"))) entry("root", "missing or non-string; defaulted to '.'");
  else if (root !== ".") entry("root", `expected "." but found ${JSON.stringify(root)}`);

  const languages = stringArray(own(value, "languages")) ?? [];
  if (stringArray(own(value, "languages")) === undefined) {
    entry("languages", "missing or not an array of strings; defaulted to []");
  }

  const rawArray = (key: string): unknown[] => {
    const raw = own(value, key);
    if (Array.isArray(raw)) return raw;
    entry(key, "missing or not an array; treated as empty");
    return [];
  };

  // Files (ADR-009: keyed lookups are Maps; ids/paths are file content).
  const filesById = new Map<string, GraphFile>();
  const filesByPath = new Map<string, GraphFile>();
  const symbolIds = new Set<string>();
  const files: GraphFile[] = [];
  rawArray("files").forEach((raw, index) => {
    const where = `files[${index}]`;
    if (!isRecord(raw)) {
      entry(where, "not an object; skipped");
      return;
    }
    const id = own(raw, "id");
    const path = own(raw, "path");
    const lang = own(raw, "lang");
    if (!isString(id) || !isString(path) || !isString(lang)) {
      entry(where, "id/path/lang must be strings; skipped");
      return;
    }
    if (id !== `f:${path}`) {
      entry(where, `id ${JSON.stringify(id)} does not match path ${JSON.stringify(path)}; skipped`);
      return;
    }
    if (filesById.has(id) || filesByPath.has(path)) {
      entry(where, `duplicate file ${JSON.stringify(path)}; first entry wins`);
      return;
    }
    const locRaw = own(raw, "loc");
    const loc = isFiniteNumber(locRaw) && locRaw >= 0 ? locRaw : 0;
    if (!(isFiniteNumber(locRaw) && locRaw >= 0) && locRaw !== undefined) {
      entry(`${where}.loc`, "not a non-negative number; defaulted to 0");
    }
    const hashRaw = own(raw, "hash");
    const hash = isString(hashRaw) ? hashRaw : undefined;
    if (hashRaw !== undefined && hash === undefined) {
      entry(`${where}.hash`, "not a string; dropped");
    }
    const symbols: GraphSymbol[] = [];
    const symbolsRaw = own(raw, "symbols");
    if (symbolsRaw !== undefined && !Array.isArray(symbolsRaw)) {
      entry(`${where}.symbols`, "not an array; treated as empty");
    } else if (Array.isArray(symbolsRaw)) {
      symbolsRaw.forEach((symbolRaw, symbolIndex) => {
        const symbolWhere = `${where}.symbols[${symbolIndex}]`;
        if (!isRecord(symbolRaw)) {
          entry(symbolWhere, "not an object; skipped");
          return;
        }
        const sid = own(symbolRaw, "id");
        const name = own(symbolRaw, "name");
        const kind = own(symbolRaw, "kind");
        const exported = own(symbolRaw, "exported");
        const range = own(symbolRaw, "range");
        const rangeOk =
          Array.isArray(range) &&
          range.length === 2 &&
          isFiniteNumber(range[0]) &&
          isFiniteNumber(range[1]);
        if (!isString(sid) || !isString(name) || !isString(kind) || typeof exported !== "boolean" || !rangeOk) {
          entry(symbolWhere, "id/name/kind/exported/range malformed; skipped");
          return;
        }
        if (symbolIds.has(sid)) {
          entry(symbolWhere, `duplicate symbol id ${JSON.stringify(sid)}; first wins`);
          return;
        }
        symbolIds.add(sid);
        symbols.push({
          id: sid,
          name,
          kind,
          exported,
          range: [range[0] as number, range[1] as number],
        });
      });
    }
    const fileEntry: GraphFile = { id, path, lang, loc, symbols };
    if (hash !== undefined) fileEntry.hash = hash;
    filesById.set(id, fileEntry);
    filesByPath.set(path, fileEntry);
    files.push(fileEntry);
  });

  // Packages.
  const packagesById = new Map<string, GraphPackage>();
  const packages: GraphPackage[] = [];
  rawArray("packages").forEach((raw, index) => {
    const where = `packages[${index}]`;
    if (!isRecord(raw)) {
      entry(where, "not an object; skipped");
      return;
    }
    const id = own(raw, "id");
    const name = own(raw, "name");
    const ecosystem = own(raw, "ecosystem");
    if (!isString(id) || !isString(name) || !isString(ecosystem)) {
      entry(where, "id/name/ecosystem must be strings; skipped");
      return;
    }
    if (id !== `p:${name}`) {
      entry(where, `id ${JSON.stringify(id)} does not match name ${JSON.stringify(name)}; skipped`);
      return;
    }
    if (packagesById.has(id)) {
      entry(where, `duplicate package ${JSON.stringify(id)}; first entry wins`);
      return;
    }
    const pathRaw = own(raw, "path");
    let path: string | undefined;
    if (pathRaw !== undefined) {
      if (isString(pathRaw) && isRepoRelativePath(pathRaw)) {
        path = pathRaw;
      } else {
        entry(`${where}.path`, "not a repo-relative path; dropped (containment)");
      }
    }
    const packageEntry: GraphPackage = { id, name, ecosystem };
    if (path !== undefined) packageEntry.path = path;
    packagesById.set(id, packageEntry);
    packages.push(packageEntry);
  });

  // Edges. Referential integrity: f:/p: endpoints must exist; s: endpoints
  // must name a parsed symbol. Dangling edges are skipped (they cannot be
  // located anywhere) with a graph-reference issue — never silently.
  const endpointExists = (id: string): boolean => {
    if (id.startsWith("f:")) return filesById.has(id);
    if (id.startsWith("p:")) return packagesById.has(id);
    if (id.startsWith("s:")) return symbolIds.has(id);
    return false;
  };
  const edges: GraphEdge[] = [];
  rawArray("edges").forEach((raw, index) => {
    const where = `edges[${index}]`;
    if (!isRecord(raw)) {
      entry(where, "not an object; skipped");
      return;
    }
    const from = own(raw, "from");
    const to = own(raw, "to");
    const kind = own(raw, "kind");
    if (!isString(from) || !isString(to) || !isString(kind)) {
      entry(where, "from/to/kind must be strings; skipped");
      return;
    }
    if (!(GRAPH_EDGE_KINDS as readonly string[]).includes(kind)) {
      entry(where, `unknown edge kind ${JSON.stringify(kind)}; skipped`);
      return;
    }
    if (!endpointExists(from)) {
      reference(`${where}.from`, `unknown id ${JSON.stringify(from)}; edge skipped`);
      return;
    }
    if (!endpointExists(to)) {
      reference(`${where}.to`, `unknown id ${JSON.stringify(to)}; edge skipped`);
      return;
    }
    const edge: GraphEdge = { from, to, kind: kind as GraphEdgeKind };
    const symbols = own(raw, "symbols");
    if (symbols !== undefined) {
      const parsed = stringArray(symbols);
      if (parsed === undefined) entry(`${where}.symbols`, "not an array of strings; dropped");
      else edge.symbols = parsed;
    }
    const reexport = own(raw, "reexport");
    if (reexport !== undefined) {
      if (typeof reexport === "boolean") edge.reexport = reexport;
      else entry(`${where}.reexport`, "not a boolean; dropped");
    }
    const confidence = own(raw, "confidence");
    if (confidence !== undefined) {
      if (isString(confidence)) edge.confidence = confidence;
      else entry(`${where}.confidence`, "not a string; dropped");
    }
    edges.push(edge);
  });

  // Unresolved specifiers.
  const unresolved: GraphUnresolved[] = [];
  rawArray("unresolved").forEach((raw, index) => {
    const where = `unresolved[${index}]`;
    if (!isRecord(raw)) {
      entry(where, "not an object; skipped");
      return;
    }
    const from = own(raw, "from");
    const specifier = own(raw, "specifier");
    const reason = own(raw, "reason");
    if (!isString(from) || !isString(specifier) || !isString(reason)) {
      entry(where, "from/specifier/reason must be strings; skipped");
      return;
    }
    if (!filesById.has(from)) {
      reference(`${where}.from`, `unknown file id ${JSON.stringify(from)}; entry skipped`);
      return;
    }
    unresolved.push({ from, specifier, reason });
  });

  // Stats: known numeric/boolean fields only; static keys (never copied
  // verbatim from the input — a hostile stats object stays inert).
  let stats: GraphStats | undefined;
  const statsRaw = own(value, "stats");
  if (statsRaw !== undefined) {
    if (!isRecord(statsRaw)) {
      entry("stats", "not an object; dropped");
    } else {
      stats = {};
      const filesCount = own(statsRaw, "files");
      const symbolsCount = own(statsRaw, "symbols");
      const edgesCount = own(statsRaw, "edges");
      const truncatedSymbols = own(statsRaw, "truncated_symbols");
      const truncatedFiles = own(statsRaw, "truncated_files");
      const skipped = own(statsRaw, "skipped");
      if (isFiniteNumber(filesCount)) stats.files = filesCount;
      if (isFiniteNumber(symbolsCount)) stats.symbols = symbolsCount;
      if (isFiniteNumber(edgesCount)) stats.edges = edgesCount;
      if (truncatedSymbols === true) stats.truncatedSymbols = true;
      if (isFiniteNumber(truncatedFiles)) stats.truncatedFiles = truncatedFiles;
      if (isFiniteNumber(skipped)) stats.skipped = skipped;
    }
  }

  const graph: ArchGraph = {
    schema: 1,
    root,
    languages,
    files,
    packages,
    edges,
    unresolved,
    filesById,
    packagesById,
  };
  if (stats !== undefined) graph.stats = stats;
  return { graph, issues };
}
