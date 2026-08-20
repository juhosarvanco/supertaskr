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

/**
 * One details-strip row for an issue the model COUNTS but no failure row
 * explains (T-077). See `modelIssueRows`.
 */
export interface ModelIssueRow {
  /** React list key: the issue's kind plus the ids and files it names,
   * with a repeat counter appended only when a snapshot really does
   * carry two issues agreeing on all three (two `missing-field`s on one
   * file differ in `field` alone, which is not part of the key). */
  key: string;
  /** The parser's own discriminator, verbatim. */
  kind: string;
  /** Which id space, for the kinds that carry one; ABSENT otherwise —
   * absence is the honest answer, never a guess (see `issueSpace`). */
  space?: string;
  /** The distinct files the issue names, in issue order. */
  files: string[];
  /** The parser's own sentence about the issue. */
  message: string;
}

/**
 * The distinct files an issue names.
 *
 * READ THE FIELD, NEVER THE KIND (T-077). `ParseIssue` carries paths in
 * two shapes — `files: string[]` on the cross-file kinds and `file:
 * string` on the per-file ones — and the union has grown members in both
 * shapes more than once. Switching on `kind` here would mean a kind
 * added tomorrow renders with no files at all until somebody remembers
 * this function; reading the field means it renders correctly the day it
 * lands. Deliberately NOT index-aligned with `ids`: this is what a row
 * says out loud, and the feature `aliased-id` names `docs/ROADMAP.md`
 * twice by contract.
 */
export function issueFiles(issue: ParseIssue): string[] {
  const carrier = issue as { files?: unknown; file?: unknown };
  const named: string[] = [];
  if (Array.isArray(carrier.files)) {
    for (const entry of carrier.files) if (typeof entry === "string") named.push(entry);
  } else if (typeof carrier.file === "string") {
    named.push(carrier.file);
  }
  return [...new Set(named)];
}

/**
 * The ids an issue names, for keying. Same field-not-kind discipline as
 * `issueFiles`: `ids: string[]` on the set-level kinds, `id: string` on
 * the ones about a single id, absent on the rest.
 */
export function issueIds(issue: ParseIssue): string[] {
  const carrier = issue as { ids?: unknown; id?: unknown };
  if (Array.isArray(carrier.ids)) {
    return carrier.ids.filter((entry): entry is string => typeof entry === "string");
  }
  return typeof carrier.id === "string" ? [carrier.id] : [];
}

/**
 * Which id space an issue is about, or undefined when it does not say.
 *
 * THE FIELD IS PRESENT ON SOME KINDS AND NOT OTHERS, AND THAT SET MOVES:
 * `aliased-id` gained `space` at T-053 and `duplicate-id` at T-076,
 * while `dependency-cycle`, `ambiguous-mapping` and `dangling-reference`
 * still carry none. So this reads the FIELD rather than listing the
 * kinds that have it — a list would be wrong the next time the parser
 * grows a kind, in the silent direction (a real space rendered as
 * nothing). Where it is absent the row says nothing about space rather
 * than inferring one from the kind: `dependency-cycle` is task-shaped
 * TODAY, and inferring that is exactly the prose-reading T-053 ruled out.
 */
export function issueSpace(issue: ParseIssue): string | undefined {
  const value = (issue as { space?: unknown }).space;
  return typeof value === "string" ? value : undefined;
}

/**
 * The strip rows the model's issue COUNT owes and `failures` does not
 * pay (T-077, absorbing T-053-s1).
 *
 * `failures` carries one entry per model-input file whose CURRENT
 * content cannot establish a record, and the strip renders one row per
 * entry — a statement about a FILE. Every other issue the parser
 * produces (`aliased-id`, `duplicate-id`, `dependency-cycle`,
 * `ambiguous-mapping`, every `dangling-reference`, and every soft issue
 * on a record that still parsed) is counted in `model.issues` and
 * explained nowhere: the status line ticks from `0 issues` to `2
 * issues` over an empty strip, which reads as a bug in the app rather
 * than a fact about the docs.
 *
 * REPRESENTED IS A STATEMENT ABOUT FILES, NOT ABOUT SENTENCES, because
 * that is what a failure row is. An issue is dropped when it names at
 * least one file and EVERY file it names already has a failure row —
 * so a file that never parsed is reported once, not twice (its issues
 * are in `model.issues` too, because `effective` carries the failing
 * content when there is no last good), while a cross-file issue
 * straddling one broken and one healthy file still gets its own row.
 * Deliberately not a message comparison: prose is never the
 * discriminator in this union.
 *
 * Pure and derived — no store state, no memo, no ordering of its own:
 * rows come back in `model.issues` order, which is the parser's
 * documented layer order (task → roadmap → component → cross-reference).
 */
export function modelIssueRows(
  issues: readonly ParseIssue[],
  failures: readonly ParseFailure[],
): ModelIssueRow[] {
  // ADR-009: a collection keyed by file-derived strings is a Set.
  const failed = new Set(failures.map((failure) => failure.path));
  const seen = new Map<string, number>();
  const rows: ModelIssueRow[] = [];
  for (const issue of issues) {
    const files = issueFiles(issue);
    if (files.length > 0 && files.every((file) => failed.has(file))) continue;
    const base = [issue.kind, ...issueIds(issue), ...files].join(" ");
    const seenBefore = seen.get(base) ?? 0;
    seen.set(base, seenBefore + 1);
    const row: ModelIssueRow = {
      key: seenBefore === 0 ? base : `${base} #${seenBefore}`,
      kind: issue.kind,
      files,
      message: issue.message,
    };
    const space = issueSpace(issue);
    if (space !== undefined) row.space = space;
    rows.push(row);
  }
  return rows;
}

export interface DocsModelState {
  /** Seq of the applied payload; 0 = nothing applied yet. */
  seq: number;
  projectDir: string;
  generatedAtMs: number;
  /** Last content per path that parsed cleanly enough to render. */
  lastGood: ReadonlyMap<string, string>;
  /**
   * Effective content per delivered path — what the app treats as the
   * file's current renderable text (T-024): model inputs carry their
   * last-good fallback exactly as fed to `parseProjectFromFiles`;
   * every other snapshot file (NORTH_STAR, STATE, decisions, …)
   * carries its raw delivered content, which applySnapshot previously
   * discarded. The graph stays out (its own `graphContent` contract).
   * ADDITIVE EXPOSURE ONLY: nothing downstream of the existing fields
   * changes — the map handed to the parser is this same map, and the
   * parser filters by path, so the parsed model is byte-identical.
   * Consumed by the genesis lens (C-13), which derives purely from it.
   */
  effective: ReadonlyMap<string, string>;
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
    effective: new Map(),
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
    if (!isModelInput(path)) {
      // Not parsed, but rendered by the genesis lens (T-024): retain the
      // delivered text so `effective` carries every docs file's content.
      effective.set(path, content);
      continue;
    }
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
    effective,
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
