import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import {
  applySnapshot,
  emptyState,
  type DocsModelState,
  type DocsSnapshotPayload,
} from "./docs-model";

/**
 * Tauri glue around the pure docs-model reducer: subscribes to the Rust
 * watcher, exposes the state to React via subscribe/getState
 * (useSyncExternalStore shape), and echoes every applied snapshot back to
 * Rust as a `model-updated` event so the change -> parsed-model round trip
 * is observable on stdout (how the ≤1s criterion is measured).
 *
 * T-007 adds the shell layer around that model: which project is open
 * (none resolved at launch / a repo without docs/ / a live board), the
 * folder picker flow, and the project-switch reset. The picker never
 * sends a path — `pick_project_folder` is a zero-argument command whose
 * native dialog, validation, and watcher re-arm all live in Rust; this
 * side only receives typed outcomes.
 *
 * Outside Tauri (the vite bundle opened in a plain browser) there is no
 * IPC; in dev builds the store then exposes a window harness instead, so
 * the same bundle's DOM behavior can be driven and verified in a browser —
 * the T-001 verification precedent. The harness does not exist in
 * production builds.
 */

/** Compact summary of an applied snapshot, echoed to Rust for stdout. */
export interface ModelUpdateEcho {
  seq: number;
  appliedAtMs: number;
  generatedAtMs: number;
  taskCount: number;
  featureCount: number;
  issueCount: number;
  taskIds: string[];
  parseFailures: string[];
  /** T-018: collector skips applied with this snapshot (honest total,
   * not the clipped list) and whether the file cap truncated it — the
   * round trip's evidence that the frontend SAW the blind spots. */
  skippedTotal: number;
  truncated: boolean;
}

/** Mirror of Rust's `ProjectStatus` (src-tauri/src/docs_watch.rs). */
export type ProjectStatusPayload =
  | { kind: "noProject" }
  | { kind: "noDocs"; projectDir: string }
  | { kind: "open"; snapshot: DocsSnapshotPayload };

/** Mirror of Rust's `PickOutcome` (src-tauri/src/docs_watch.rs). */
export type PickOutcomePayload =
  | { kind: "cancelled" }
  | { kind: "noDocs"; path: string }
  | { kind: "error"; path: string; message: string }
  | { kind: "picked"; snapshot: DocsSnapshotPayload };

/** Mirror of Rust's `IndexOutcome` (src-tauri/src/index_cmd.rs) —
 * T-012's zero-argument index_repo command. Volatile stats live here,
 * in session state, never in the committed graph (ADR-014). */
export type IndexOutcomePayload =
  | { kind: "noProject" }
  | { kind: "noDocs"; projectDir: string }
  | {
      kind: "indexed";
      changed: boolean;
      files: number;
      symbols: number;
      edges: number;
      truncated: boolean;
      graphBytes: number;
      durationMs: number;
      indexedAtMs: number;
    }
  | { kind: "error"; message: string };

/**
 * Where the shell is, project-wise:
 * - "loading": Tauri runtime, startup status not yet answered
 * - "browser": no Tauri IPC (plain-browser dev; harness may apply payloads)
 * - "noProject": launch resolved no repo and nothing has been picked
 * - "noDocs": launch resolved a repo (resolvedDir) that has no docs/
 * - "open": a project is open; `docs` holds its live model
 */
export type ShellPhase = "loading" | "browser" | "noProject" | "noDocs" | "open";

/** A picker choice Rust rejected. message === null means "no docs/ there";
 * otherwise it is a re-arm/dialog error explanation. */
export interface RejectedPick {
  path: string;
  message: string | null;
}

export interface ShellState {
  phase: ShellPhase;
  /** Launch-resolved project root when phase === "noDocs". */
  resolvedDir: string | null;
  /** Last rejected pick, until dismissed or a pick succeeds. */
  rejectedPick: RejectedPick | null;
  /** Native folder dialog currently open. */
  picking: boolean;
  /** index_repo in flight (T-012; single-flight like `picking`). */
  indexing: boolean;
  /** Last index_repo outcome THIS SESSION (drives the map header hint —
   * rendered from this state, never from the committed file; null until
   * an in-session index runs). Session-ephemeral by design. */
  indexOutcome: IndexOutcomePayload | null;
  /** T-003 docs model of the open project. */
  docs: DocsModelState;
}

// ---- pure helpers (unit-tested in test/watcher-store.test.ts) ----------

/**
 * Reset for a project switch: forget the previous project's model,
 * last-good contents, and failures — same-named paths in the new project
 * must NEVER fall back to another project's content — but KEEP the seq
 * watermark. The Rust seq counter is global and monotonic across
 * switches, so any late delivery from the previous project carries a seq
 * at or below the watermark and drops as stale.
 */
export function resetDocsForProjectSwitch(prev: DocsModelState): DocsModelState {
  return { ...emptyState(), seq: prev.seq };
}

/**
 * Apply one snapshot payload to the docs model, resetting first when the
 * payload comes from a different project root (T-007 switch). Stale or
 * duplicate payloads — including anything from a previously open project —
 * return `prev` by identity, so callers skip re-renders and echoes.
 */
export function reduceDocs(
  prev: DocsModelState,
  payload: DocsSnapshotPayload,
): DocsModelState {
  if (payload.seq <= prev.seq) return prev; // stale/duplicate: identity
  const base =
    prev.seq > 0 && payload.projectDir !== prev.projectDir
      ? resetDocsForProjectSwitch(prev)
      : prev;
  return applySnapshot(base, payload);
}

/** What criterion (c)'s message points at: the convention layout. */
export const CONVENTION_HINT =
  "an nputer project keeps its board in docs/tasks/, decisions in docs/decisions/";

/** Friendly empty-state line naming what was looked for, and where. */
export function noDocsMessage(path: string): string {
  return `no docs/ found in ${path} — ${CONVENTION_HINT}`;
}

/** Which screen the shell shows. Empty screens carry their message and
 * whether "keep the current project" is a meaningful escape hatch. */
export type ScreenModel =
  | { screen: "loading" }
  | { screen: "browser" }
  | { screen: "empty"; message: string; canKeepCurrent: boolean }
  | { screen: "board" };

export function selectScreen(shell: ShellState): ScreenModel {
  if (shell.rejectedPick !== null) {
    const { path, message } = shell.rejectedPick;
    return {
      screen: "empty",
      message:
        message === null
          ? noDocsMessage(path)
          : `could not open ${path || "the chosen folder"}: ${message}`,
      canKeepCurrent: shell.phase === "open",
    };
  }
  switch (shell.phase) {
    case "loading":
      return { screen: "loading" };
    case "browser":
      return { screen: "browser" };
    case "noProject":
      return {
        screen: "empty",
        message: `no project open — ${CONVENTION_HINT}`,
        canKeepCurrent: false,
      };
    case "noDocs":
      return {
        screen: "empty",
        message: noDocsMessage(shell.resolvedDir ?? "the resolved folder"),
        canKeepCurrent: false,
      };
    case "open":
      return { screen: "board" };
  }
}

// ---- store --------------------------------------------------------------

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
    /** Dev-only browser harness (absent in Tauri and in prod builds). */
    __nputerDocsHarness?: {
      apply: (payload: DocsSnapshotPayload) => void;
      getState: () => DocsModelState;
    };
    /** Dev-only echo capture used by the browser harness. */
    __nputerEchoes?: ModelUpdateEcho[];
  }
}

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

let shell: ShellState = {
  phase: isTauri ? "loading" : "browser",
  resolvedDir: null,
  rejectedPick: null,
  picking: false,
  indexing: false,
  indexOutcome: null,
  docs: emptyState(),
};
const listeners = new Set<() => void>();
let started = false;

export function subscribeShell(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getShellState(): ShellState {
  return shell;
}

export function isTauriRuntime(): boolean {
  return isTauri;
}

function setShell(patch: Partial<ShellState>): void {
  shell = { ...shell, ...patch };
  for (const callback of listeners) callback();
}

function buildEcho(next: DocsModelState): ModelUpdateEcho {
  return {
    seq: next.seq,
    appliedAtMs: Date.now(),
    generatedAtMs: next.generatedAtMs,
    taskCount: next.model.tasks.length,
    featureCount: next.model.features.length,
    issueCount: next.model.issues.length,
    taskIds: next.model.tasks.map((t) => t.id ?? "(suggested)"),
    parseFailures: next.failures.map((f) => f.path),
    skippedTotal: next.skippedTotal,
    truncated: next.truncated,
  };
}

function applyDocsPayload(payload: DocsSnapshotPayload): void {
  const next = reduceDocs(shell.docs, payload);
  if (next === shell.docs) return; // stale/duplicate: no re-render, no echo
  // A snapshot only ever describes an open project; deliberately does NOT
  // clear rejectedPick — a background update must not yank the empty
  // state away while the user is deciding what to do about a bad pick.
  setShell({ docs: next, phase: "open" });
  const echo = buildEcho(next);
  if (isTauri) {
    emit("model-updated", echo).catch((err) => {
      console.error("[nputer] model-updated echo failed", err);
    });
  } else if (import.meta.env.DEV) {
    (window.__nputerEchoes ??= []).push(echo);
  }
}

function applyProjectStatus(status: ProjectStatusPayload): void {
  switch (status.kind) {
    case "open":
      applyDocsPayload(status.snapshot);
      break;
    case "noDocs":
      setShell({ phase: "noDocs", resolvedDir: status.projectDir });
      break;
    case "noProject":
      setShell({ phase: "noProject" });
      break;
  }
}

/**
 * Start the live pipeline once: subscribe to `docs-changed` first, then
 * pull the startup status (the seq guard settles any ordering race
 * between the two). Safe to call repeatedly (StrictMode double-effects).
 */
export async function startDocsWatcher(): Promise<void> {
  if (started) return;
  started = true;

  if (!isTauri) {
    if (import.meta.env.DEV) {
      window.__nputerDocsHarness = {
        apply: applyDocsPayload,
        getState: () => shell.docs,
      };
      console.info("[nputer] no Tauri IPC detected — browser dev harness active");
    }
    return;
  }

  await listen<DocsSnapshotPayload>("docs-changed", (event) => applyDocsPayload(event.payload));
  const status = await invoke<ProjectStatusPayload>("docs_snapshot");
  applyProjectStatus(status);
}

/**
 * Open the native folder picker (T-007). Zero arguments cross the IPC
 * boundary; Rust owns the dialog, validation, and watcher re-arm. A
 * rejected pick surfaces as the empty state's message and never touches
 * the open project's model or watch.
 */
export async function pickProjectFolder(): Promise<void> {
  if (!isTauri || shell.picking) return;
  setShell({ picking: true });
  try {
    const outcome = await invoke<PickOutcomePayload>("pick_project_folder");
    switch (outcome.kind) {
      case "cancelled":
        break; // no change, criterion b's cancel path
      case "noDocs":
        setShell({ rejectedPick: { path: outcome.path, message: null } });
        break;
      case "error":
        setShell({ rejectedPick: { path: outcome.path, message: outcome.message } });
        break;
      case "picked":
        applyDocsPayload(outcome.snapshot);
        setShell({ rejectedPick: null, resolvedDir: null, phase: "open" });
        break;
    }
  } catch (err) {
    setShell({ rejectedPick: { path: "", message: String(err) } });
  } finally {
    setShell({ picking: false });
  }
}

/** Dismiss a rejected pick and return to whatever was open before. */
export function keepCurrentProject(): void {
  if (shell.rejectedPick !== null) setShell({ rejectedPick: null });
}

/**
 * Run the indexer over the open project (T-012). Zero arguments cross
 * the IPC boundary; Rust owns root resolution, containment, and the
 * atomic graph write. Single-flight (the `picking` pattern) — a raced
 * double-run would be benign anyway (byte-determinism + atomic writes,
 * T-009's concurrent-writers note), but the button should not stack
 * runs. The refreshed graph arrives on its own as a `docs-changed`
 * snapshot; an unchanged tree produces no snapshot at all (the pinned
 * loop-termination brake), which is why the outcome — not the file —
 * feeds the header hint.
 */
export async function runIndexRepo(): Promise<void> {
  if (!isTauri || shell.indexing) return;
  setShell({ indexing: true });
  try {
    const outcome = await invoke<IndexOutcomePayload>("index_repo");
    setShell({ indexOutcome: outcome });
  } catch (err) {
    setShell({ indexOutcome: { kind: "error", message: String(err) } });
  } finally {
    setShell({ indexing: false });
  }
}
