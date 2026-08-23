import { invoke } from "@tauri-apps/api/core";
import type { ChurnPathEntry } from "@/lib/architecture/churn";

/**
 * WHERE THE MAP'S CHURN COMES FROM (T-013) — one command, one fold, one
 * closed vocabulary of reasons.
 *
 * The pane owns this rather than the shell store, for the reason C-13
 * owns `interview-source.ts`: it is the map's data, nothing else reads
 * it, and putting it in `watcher-store.ts` would make a pane's overlay a
 * fact about the whole app. The store here is a module singleton with a
 * subscribe/snapshot pair, so `MapView` reads it through
 * `useSyncExternalStore` and never holds a second copy.
 *
 * THE PAYLOAD IS VALIDATED, and that is not ceremony about our own Rust.
 * It is the `graph.ts` stance applied one boundary over: `parseChurn`
 * NEVER throws, keeps whatever validates, and counts whatever does not
 * into `rejected`. A malformed entry — a count that is not a number, a
 * path that is not a string, a `__proto__` key — degrades the overlay's
 * precision and cannot degrade anything else. Every keyed collection is
 * a Map (ADR-009).
 *
 * NOTHING GIT SAYS IS RENDERABLE FROM HERE. The disabled reasons are a
 * closed union of five words; the Rust side has no message field for a
 * git string to ride, so "an error string on the canvas" is unreachable
 * rather than filtered. An unknown reason word — a Rust variant this
 * mirror has not learned — folds to `unreadable`, which renders as the
 * same fixed sentence family, never as the word itself.
 */

/** Why the churn overlay is off. Mirrors Rust's `ChurnDisabled`, plus
 * the two answers only this side can give. */
export type ChurnDisabledReason =
  | "noProject"
  | "gitUnavailable"
  | "notAGitRepo"
  | "noHistory"
  | "gitFailed"
  /** No Tauri runtime: a served browser bundle has no subprocess. */
  | "notTauri"
  /** The command answered with something this mirror cannot read. */
  | "unreadable";

const DISABLED_REASONS: ReadonlySet<string> = new Set([
  "noProject",
  "gitUnavailable",
  "notAGitRepo",
  "noHistory",
  "gitFailed",
]);

/** One fixed sentence per reason — the ONLY text the pane may show
 * about a churn failure. */
export function churnDisabledSentence(reason: ChurnDisabledReason): string {
  switch (reason) {
    case "noProject":
      return "no project open";
    case "gitUnavailable":
      return "git is not available here";
    case "notAGitRepo":
      return "not a git repository";
    case "noHistory":
      return "no commits yet";
    case "gitFailed":
      return "git could not read this history";
    case "notTauri":
      return "churn needs the desktop app";
    case "unreadable":
      return "churn answered in a shape this build cannot read";
  }
}

export type ChurnState =
  | { kind: "loading" }
  | { kind: "disabled"; reason: ChurnDisabledReason }
  | {
      kind: "measured";
      windowDays: number;
      /** Commits git walked in the window — exact (Rust counted them). */
      commits: number;
      entries: ChurnPathEntry[];
      /** A ceiling was reached; the answer is a floor. */
      truncated: boolean;
      /** Entries refused at either boundary (Rust's + this one). */
      rejected: number;
      measuredAtMs: number;
    };

const LOADING: ChurnState = { kind: "loading" };

// --- the untrusted-shape boundary --------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Own-property read (never the prototype chain) — the graph.ts rule. */
const own = (record: Record<string, unknown>, key: string): unknown =>
  Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0;

/**
 * Fold whatever came back into a `ChurnState`. Total: any value at all
 * produces a state, and the worst one is `disabled: unreadable`.
 */
export function parseChurnPayload(value: unknown): ChurnState {
  if (!isRecord(value)) return { kind: "disabled", reason: "unreadable" };
  const kind = own(value, "kind");
  if (kind === "disabled") {
    const reason = own(value, "reason");
    return {
      kind: "disabled",
      reason:
        typeof reason === "string" && DISABLED_REASONS.has(reason)
          ? (reason as ChurnDisabledReason)
          : "unreadable",
    };
  }
  if (kind !== "measured") return { kind: "disabled", reason: "unreadable" };

  const windowDays = own(value, "windowDays");
  const commits = own(value, "commits");
  const measuredAtMs = own(value, "measuredAtMs");
  const rawRejected = own(value, "rejected");
  const rawPaths = own(value, "paths");
  if (!isCount(windowDays) || windowDays === 0 || !isCount(commits)) {
    return { kind: "disabled", reason: "unreadable" };
  }

  const entries: ChurnPathEntry[] = [];
  // Deduplicate by path: a repeated key would double-count silently,
  // and first-wins matches the graph reader's duplicate rule.
  const seen = new Set<string>();
  let rejected = isCount(rawRejected) ? rawRejected : 0;
  if (Array.isArray(rawPaths)) {
    for (const raw of rawPaths) {
      if (!isRecord(raw)) {
        rejected += 1;
        continue;
      }
      const path = own(raw, "path");
      const pathCommits = own(raw, "commits");
      const lastCommitMs = own(raw, "lastCommitMs");
      if (typeof path !== "string" || path === "" || !isCount(pathCommits) || pathCommits === 0) {
        rejected += 1;
        continue;
      }
      if (seen.has(path)) {
        rejected += 1;
        continue;
      }
      seen.add(path);
      entries.push({
        path,
        commits: pathCommits,
        lastCommitMs: isCount(lastCommitMs) ? lastCommitMs : 0,
      });
    }
  } else if (rawPaths !== undefined) {
    return { kind: "disabled", reason: "unreadable" };
  }

  return {
    kind: "measured",
    windowDays,
    commits,
    entries,
    truncated: own(value, "truncated") === true,
    rejected,
    measuredAtMs: isCount(measuredAtMs) ? measuredAtMs : 0,
  };
}

// --- the module store ---------------------------------------------------

let state: ChurnState = LOADING;
const listeners = new Set<() => void>();

function set(next: ChurnState): ChurnState {
  state = next;
  for (const listener of listeners) listener();
  return state;
}

export function subscribeChurn(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getChurnState(): ChurnState {
  return state;
}

/** Fold a payload into the store. Exported because it is the ONE fold
 * spelling in this tree: `loadChurn` calls it and so does every test, so
 * a parallel reduction would have to be written on purpose (the T-041
 * argument, in the shape `interview-source.ts` uses). */
export function applyChurnPayload(value: unknown): ChurnState {
  return set(parseChurnPayload(value));
}

/**
 * The runtime check is LAZY rather than a module const (which is what
 * `watcher-store.ts` uses): the value cannot change inside a real app,
 * and reading it at call time is what lets a headless body drive both
 * branches without reloading the module.
 */
function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let inFlight: Promise<ChurnState> | null = null;

/**
 * Ask for churn. Single-flight (the `picking`/`indexing` pattern): a
 * second call while one is out returns the same promise rather than
 * spawning a second `git`. A rejected invoke is a disabled overlay, not
 * an exception — and the rejection's text is deliberately dropped rather
 * than shown.
 */
export function loadChurn(): Promise<ChurnState> {
  if (inFlight !== null) return inFlight;
  if (!hasTauriRuntime()) {
    return Promise.resolve(set({ kind: "disabled", reason: "notTauri" }));
  }
  // The type argument is NOT decoration. The IPC census in
  // `app/test/crescendo-dom.test.tsx` finds call sites by matching an
  // invoke that carries one, so a bare call would be invisible to the
  // count that guards this boundary. Conforming here is right; that the
  // census can be stepped around by omitting a type argument — and can
  // be FED by a comment, which this comment was measured doing in its
  // first draft — is filed as T-013-s2.
  inFlight = invoke<unknown>("repo_churn")
    .then((payload) => applyChurnPayload(payload))
    .catch(() => set({ kind: "disabled", reason: "gitFailed" }))
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Test-only reset (the store is a module singleton — the
 * `__resetGenesisStoreForTests` convention). */
export function __resetChurnForTests(): void {
  state = LOADING;
  listeners.clear();
  inFlight = null;
}
