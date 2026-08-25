import { invoke } from "@tauri-apps/api/core";
import type { ChurnPathEntry } from "@/lib/architecture/churn";
import { getShellState, subscribeShell } from "@/lib/watcher-store";

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
 * WHICH REPOSITORY THE CURRENT ANSWER IS ABOUT (T-116). Bumped by the
 * project-switch trigger below, and read by `loadChurn` twice: an answer
 * whose generation has moved is DISCARDED rather than folded, and only
 * the current flight may release the single-flight latch.
 *
 * A `.then` cannot be cancelled, so this is the only thing standing
 * between "the user switched projects while git was still walking A" and
 * A's entries arriving as B's — the same shape `watcher-store.ts` calls
 * `startupToken`, for the same reason.
 */
let generation = 0;

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
    // A browser bundle cannot spawn anything, so it must not OVERWRITE
    // a state something else already folded — only answer the question
    // nobody has answered yet. Under Tauri the branch below always
    // re-measures, so a remount is still a fresh read of the history.
    return Promise.resolve(
      state.kind === "loading" ? set({ kind: "disabled", reason: "notTauri" }) : state,
    );
  }
  // The type argument is NOT decoration. The IPC census in
  // `app/test/crescendo-dom.test.tsx` finds call sites by matching an
  // invoke that carries one, so a bare call would be invisible to the
  // count that guards this boundary. Conforming here is right; that the
  // census can be stepped around by omitting a type argument — and can
  // be FED by a comment, which this comment was measured doing in its
  // first draft — is filed as T-013-s2.
  const measuring = generation;
  inFlight = invoke<unknown>("repo_churn")
    .then((payload) => (measuring === generation ? applyChurnPayload(payload) : state))
    .catch(() =>
      measuring === generation ? set({ kind: "disabled", reason: "gitFailed" }) : state,
    )
    .finally(() => {
      // ONLY THE CURRENT FLIGHT MAY RELEASE THE LATCH. A switch abandons
      // the previous measurement and starts a fresh one immediately, so
      // an abandoned flight settling later must not null out the latch
      // its successor is holding.
      if (measuring === generation) inFlight = null;
    });
  return inFlight;
}

// --- re-measuring when the project changes (T-116) ----------------------

/**
 * THE FOLDER THE CURRENT STATE IS ABOUT — the map's third data source is
 * the only layer of this pane that REMEMBERS, and this is what stops it
 * remembering the wrong repository.
 *
 * Every other layer of the map is a pure function of the docs snapshot
 * and re-derives itself on a switch. Churn is measured once from `.git`,
 * which the docs watcher does not walk, and `MapView` is NOT remounted
 * by a project switch — so before this the module singleton kept the
 * previous repository's entries and `attributeChurn` painted them onto
 * the NEW repository's components. Numbers from one repository on
 * another's nodes, with nothing on screen saying so.
 *
 * WHY THE SHELL STORE IS READ BY IMPORT RATHER THAN ARRIVING AS A PROP.
 * `MapView`'s only production caller is `app/src/App.tsx`, which is
 * C-05's; a new prop would put half of this change outside this pane's
 * fence for a signal the shell already publishes module-globally. So the
 * dependency goes the way the map's other data already goes — C-12 reads
 * C-10, a direction `depends_on` already declares.
 *
 * WHY MODULE SCOPE RATHER THAN A MOUNT EFFECT. The property owed is
 * about the STORE, not about the pane: a switch while the map is closed
 * must still invalidate the answer, or the next mount paints the old
 * repository's numbers for one frame before its own `loadChurn` lands.
 * A mount effect cannot hold that, and a body in
 * `test/map-churn-age.test.tsx` drives the unmounted case for exactly
 * this reason.
 *
 * IT IS NOT A SECOND WAY TO STAMPEDE `repo_churn`: the trigger fires
 * only on a CHANGED folder and goes through `loadChurn`, so it inherits
 * the single-flight latch rather than bypassing it.
 */
let measuredFor: string = getShellState().docs.projectDir;

function onProjectMaybeChanged(): void {
  const projectDir = getShellState().docs.projectDir;
  if (projectDir === measuredFor) return;
  measuredFor = projectDir;
  // NOTHING HAS BEEN ASKED YET, SO THERE IS NOTHING TO RE-ASK. Churn is
  // measured lazily, from the pane's own mount effect — so while the map
  // has never been opened this store holds no answer, no answer is in
  // flight, and there is no previous repository's reading to drop. A
  // re-measure here would spawn `git` for a pane nobody has looked at,
  // on every project open, which is a cost this card does not buy and a
  // second reason to touch `repo_churn` that the criteria forbid. The
  // pane's mount effect measures when it opens, against the new folder.
  if (state.kind === "loading" && inFlight === null) return;
  // Otherwise: abandon whatever was measured or is being measured for the
  // previous folder BEFORE anything can read it. The state goes back to
  // `loading`, which is the honest answer between two repositories.
  generation += 1;
  inFlight = null;
  set(LOADING);
  void loadChurn();
}

subscribeShell(onProjectMaybeChanged);

/** Test-only reset (the store is a module singleton — the
 * `__resetGenesisStoreForTests` convention). */
export function __resetChurnForTests(): void {
  state = LOADING;
  listeners.clear();
  inFlight = null;
  // A reset abandons any flight in progress too, and re-baselines onto
  // whatever project the shell is on NOW — otherwise the first switch
  // after a reset would be measured against a stale folder.
  generation += 1;
  measuredFor = getShellState().docs.projectDir;
}
