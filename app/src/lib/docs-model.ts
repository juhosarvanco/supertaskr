import {
  isComponentFilePath,
  isTaskFilePath,
  parseComponentFile,
  parseProjectFromFiles,
  parseRoadmap,
  parseTaskFile,
  type ParseIssue,
  type ProjectParseResult,
} from "@nputer/parser/pure";

/**
 * Pure model state for the docs watcher (T-003). No React, no Tauri, no IO:
 * `applySnapshot(prev, payload) -> next` is the entire behavior, so the
 * acceptance-criteria logic (last-good retention, parse-failure surfacing,
 * stale/duplicate rejection) is unit-testable in isolation. The Tauri glue
 * lives in watcher-store.ts.
 *
 * ADR-009: collections keyed by file-derived strings (paths) are Maps/Sets,
 * never plain object literals.
 */

/** Paths the model derives from, relative to the project dir (POSIX). */
export const ROADMAP_FILE = "docs/ROADMAP.md";

/** The committed reality layer (ADR-014), delivered by the collector's
 * .json rule (T-012). */
export const GRAPH_FILE = "docs/architecture/graph.json";

/** One file as delivered by the Rust side. */
export interface DocsFilePayload {
  path: string;
  content: string;
}

/** Why the collector left a file out of the snapshot (T-018; mirror of
 * Rust's `SkipReason` in docs_watch.rs). Symlinks are deliberately never
 * reported (ADR-010 refusals are not telemetry). */
export type SkipReason = "oversize" | "nonUtf8" | "tooDeep" | "fileCap" | "unreadable";

/** One collector skip: a file (or, for tooDeep/unreadable, a directory)
 * that exists on disk but could not ride the snapshot. */
export interface SkippedFilePayload {
  path: string;
  reason: SkipReason;
}

/** Full-tree snapshot pushed by Rust (initial `docs_snapshot` invoke and
 * every debounced `docs-changed` event use the same shape). The T-018
 * fields are optional so pre-T-018 payload fixtures (and the dev
 * harness) stay valid: absent means "nothing skipped, nothing
 * truncated" — exactly what an older Rust side would have meant. */
export interface DocsSnapshotPayload {
  /** Monotonic ordering stamp from the Rust side; stale payloads are dropped. */
  seq: number;
  projectDir: string;
  generatedAtMs: number;
  files: DocsFilePayload[];
  /** Collector skips, sorted by path, clipped at the Rust report cap. */
  skipped?: SkippedFilePayload[];
  /** Honest skip count even when `skipped` is clipped. */
  skippedTotal?: number;
  /** The 2000-file cap clipped this snapshot. */
  truncated?: boolean;
}

/** A model-input file whose CURRENT content fails to parse. */
export interface ParseFailure {
  path: string;
  /** Issues produced by the failing content (what the badge explains). */
  issues: ParseIssue[];
  /** True when the model still renders this file's last good parse. */
  showingLastGood: boolean;
}

/** A collector skip as the frontend holds it (T-018): the payload entry
 * plus whether the model still renders the path's last good parse.
 * Deliberately NOT folded into `failures` — `ParseIssue` is the parser's
 * closed union and a collector skip is not a parse issue; both feed the
 * same chip family in the UI instead. */
export interface SkippedEntry {
  path: string;
  reason: SkipReason;
  /** True when a model input's last good content still renders (the
   * "skipped must not read as a deletion" guarantee). */
  showingLastGood: boolean;
}

/** Human-readable phrase for a skip reason (chip tooltip + details
 * strip). Falls back to the raw reason string so an unknown value from a
 * newer Rust side degrades honestly instead of erasing information. */
export function skipReasonPhrase(reason: string): string {
  switch (reason) {
    case "oversize":
      return "over 1 MiB";
    case "nonUtf8":
      return "not UTF-8";
    case "tooDeep":
      return "nested too deep";
    case "fileCap":
      return "over the file cap";
    case "unreadable":
      return "unreadable";
    default:
      return reason;
  }
}

export interface DocsModelState {
  /** Seq of the applied payload; 0 = nothing applied yet. */
  seq: number;
  projectDir: string;
  generatedAtMs: number;
  /** Last content per path that parsed cleanly enough to render. */
  lastGood: ReadonlyMap<string, string>;
  /** Model assembled from effective contents (failing files fall back to
   * their last good content — criterion 3's "keep showing the last valid
   * state"). */
  model: ProjectParseResult;
  /** Model-input files whose current on-disk content fails to parse;
   * non-empty drives the parse-error badge. */
  failures: ParseFailure[];
  /** Collector skips from the applied snapshot (T-018); non-empty
   * drives the skipped-files chip beside the parse-error badge. */
  skipped: SkippedEntry[];
  /** Honest skip count even when the reported list was clipped. */
  skippedTotal: number;
  /** The applied snapshot was clipped by the 2000-file cap (T-018);
   * drives the quiet truncation note in the chip strip. */
  truncated: boolean;
  /** How many files rode the applied snapshot (what "showing first N
   * files" can honestly claim when truncated). */
  fileCount: number;
  /**
   * Raw graph.json bytes as delivered, or undefined when the snapshot
   * carries none (index not run / over the collector cap). DELIBERATELY
   * no last-good fallback (T-012 plan §4): ADR-014 forbids hand-editing,
   * so a corrupt graph is an abnormal state whose designed recovery is
   * regeneration — parseGraph degrades it to the index-not-run family
   * and Re-index heals it. Value-stable across snapshots with unchanged
   * bytes (string identity), so downstream derivation memos hit.
   */
  graphContent?: string;
}

export function emptyState(): DocsModelState {
  return {
    seq: 0,
    projectDir: "",
    generatedAtMs: 0,
    lastGood: new Map(),
    model: { tasks: [], features: [], issues: [] },
    failures: [],
    skipped: [],
    skippedTotal: 0,
    truncated: false,
    fileCount: 0,
  };
}

/**
 * Hard-failure predicate per model input. Returns the failing content's
 * issues, or undefined when the content is renderable.
 *
 * - Task file: fails when no TaskRecord can be established (the parser's
 *   identity gate) — soft issues on a returned record are NOT a failure;
 *   the parser's job is flagging, not hiding.
 * - Component file (T-012; the map's intent layer): same identity gate —
 *   fails when no ComponentRecord can be established, so a mid-edit
 *   save keeps the last good record on the map (parse chip machinery).
 * - Roadmap: fails when it yields zero features AND at least one issue
 *   (e.g. mid-edit save with the Backbone heading missing). A genuinely
 *   empty backbone (no issues) is a valid state, not a failure.
 * - Anything else is not a model input and cannot fail.
 */
function failingIssues(path: string, content: string): ParseIssue[] | undefined {
  if (isTaskFilePath(path)) {
    const result = parseTaskFile(content, path);
    return result.task === undefined ? result.issues : undefined;
  }
  if (isComponentFilePath(path)) {
    const result = parseComponentFile(content, path);
    return result.component === undefined ? result.issues : undefined;
  }
  if (path === ROADMAP_FILE) {
    const result = parseRoadmap(content, path);
    return result.features.length === 0 && result.issues.length > 0 ? result.issues : undefined;
  }
  return undefined;
}

/** Model-input predicate: files that flow through last-good + failure
 * machinery into the parsed model. The graph is NOT one (see
 * `graphContent` — raw passthrough, no fallback). */
function isModelInput(path: string): boolean {
  return isTaskFilePath(path) || isComponentFilePath(path) || path === ROADMAP_FILE;
}

/**
 * Apply one snapshot. Returns `prev` (same reference) when the payload is
 * stale or a duplicate (seq <= applied seq) — callers use the identity to
 * skip re-renders and echoes, which is the frontend half of the
 * no-duplicate-events guarantee.
 */
export function applySnapshot(prev: DocsModelState, payload: DocsSnapshotPayload): DocsModelState {
  if (payload.seq <= prev.seq) return prev;

  const lastGood = new Map(prev.lastGood);
  const effective = new Map<string, string>();
  const failures: ParseFailure[] = [];
  const present = new Set<string>();
  let graphContent: string | undefined;

  for (const { path, content } of payload.files) {
    present.add(path);
    if (path === GRAPH_FILE) {
      graphContent = content; // raw passthrough — no last-good by design
      continue;
    }
    if (!isModelInput(path)) continue;
    const issues = failingIssues(path, content);
    if (issues === undefined) {
      lastGood.set(path, content);
      effective.set(path, content);
      continue;
    }
    const good = lastGood.get(path);
    if (good !== undefined) {
      // Criterion 3: render the last valid state, badge the failure.
      effective.set(path, good);
      failures.push({ path, issues, showingLastGood: true });
    } else {
      // Never had a good parse: let its issues surface in the model.
      effective.set(path, content);
      failures.push({ path, issues, showingLastGood: false });
    }
  }

  // Collector skips (T-018): the file EXISTS but could not ride the
  // snapshot — the opposite of a deletion, and it must not read as one.
  // A skipped model input with a last good parse keeps rendering it
  // (the parse-failure machinery's guarantee, extended to skips); the
  // graph deliberately gets no such fallback (T-012 plan §4 — corrupt or
  // missing graph degrades to the index-not-run family, Re-index heals).
  const skipped: SkippedEntry[] = [];
  for (const { path, reason } of payload.skipped ?? []) {
    present.add(path); // exists on disk: exempt from the deletion sweep
    const good = isModelInput(path) ? lastGood.get(path) : undefined;
    if (good !== undefined) {
      effective.set(path, good);
      skipped.push({ path, reason, showingLastGood: true });
    } else {
      skipped.push({ path, reason, showingLastGood: false });
    }
  }

  // Deleted files: forget them; their records leave the model. Deletion is
  // not a parse failure — the file is gone, the model follows the files.
  for (const path of lastGood.keys()) {
    if (!present.has(path)) lastGood.delete(path);
  }

  const next: DocsModelState = {
    seq: payload.seq,
    projectDir: payload.projectDir,
    generatedAtMs: payload.generatedAtMs,
    lastGood,
    model: parseProjectFromFiles(effective),
    failures,
    skipped,
    skippedTotal: payload.skippedTotal ?? skipped.length,
    truncated: payload.truncated ?? false,
    fileCount: payload.files.length,
  };
  if (graphContent !== undefined) next.graphContent = graphContent;
  return next;
}
