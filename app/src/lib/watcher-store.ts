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
}

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

let state: DocsModelState = emptyState();
const listeners = new Set<() => void>();
let started = false;

export function subscribeDocsModel(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getDocsModelState(): DocsModelState {
  return state;
}

export function isTauriRuntime(): boolean {
  return isTauri;
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
  };
}

function apply(payload: DocsSnapshotPayload): void {
  const next = applySnapshot(state, payload);
  if (next === state) return; // stale/duplicate seq: no re-render, no echo
  state = next;
  for (const callback of listeners) callback();
  const echo = buildEcho(next);
  if (isTauri) {
    emit("model-updated", echo).catch((err) => {
      console.error("[nputer] model-updated echo failed", err);
    });
  } else if (import.meta.env.DEV) {
    (window.__nputerEchoes ??= []).push(echo);
  }
}

/**
 * Start the live pipeline once: subscribe to `docs-changed` first, then
 * pull the initial snapshot (the seq guard settles any ordering race
 * between the two). Safe to call repeatedly (StrictMode double-effects).
 */
export async function startDocsWatcher(): Promise<void> {
  if (started) return;
  started = true;

  if (!isTauri) {
    if (import.meta.env.DEV) {
      window.__nputerDocsHarness = { apply, getState: getDocsModelState };
      console.info("[nputer] no Tauri IPC detected — browser dev harness active");
    }
    return;
  }

  await listen<DocsSnapshotPayload>("docs-changed", (event) => apply(event.payload));
  const snapshot = await invoke<DocsSnapshotPayload>("docs_snapshot");
  apply(snapshot);
}
