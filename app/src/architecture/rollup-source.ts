import { invoke } from "@tauri-apps/api/core";
import {
  parseDetail,
  parseRollup,
  type ArchDetail,
  type ArchRollup,
} from "@/lib/architecture/rollup";
import { getShellState, subscribeShell } from "@/lib/watcher-store";

/**
 * WHERE THE MAP'S PICTURE COMES FROM (T-140-s1) — two commands, one
 * fold each, and a generation counter so an answer can never land on the
 * wrong project.
 *
 * **THE SHAPE, AND WHY IT IS NOT THE DOCS WATCHER.** Until this module
 * the pane derived its component picture from `graph.json`, delivered
 * whole over the docs watcher, which meant the pane needed the file list
 * and the file-level import edges to draw fifteen boxes — the part of the
 * payload that is LINEAR IN FILE COUNT. T-140 measured that wall and
 * ruled, at `MAX_FILE_BYTES`'s own definition site, that the graph leaves
 * that pipeline: a broadcast cannot express "detail for what is on
 * screen", and a cap on it only moves a cliff whose driver is linear.
 * `arch_rollup` answers with the component picture — counts, not lists —
 * and `arch_detail` answers for ONE thing the user opened.
 *
 * **THE PANE STILL WORKS WITHOUT IT, AND THAT IS DELIBERATE.** A served
 * browser bundle has no `invoke`, so this store answers `unavailable` and
 * `MapView` falls back to deriving from `graphContent` exactly as before
 * — the same honest degradation `churn-source.ts` makes for `notTauri`.
 * What changes in the real app is which source the RESTING render uses:
 * when the channel has answered, the picture is the rollup's, and the
 * graph's arrival or absence stops deciding whether there is a map.
 *
 * The store is a module singleton with a subscribe/snapshot pair (the
 * `churn-source.ts` pattern), so `MapView` reads it through
 * `useSyncExternalStore` and holds no second copy; and it carries a
 * GENERATION for the T-116 reason, because it is a source that remembers.
 */

/** Why there is no rollup. A closed vocabulary — the pane renders one
 * fixed sentence per reason and never a string from the Rust side,
 * except `unreadable`'s, which the app itself composed. */
export type RollupUnavailableReason =
  | "noProject"
  | "noDocs"
  | "noGraph"
  | "unreadable"
  /** No Tauri runtime: a served browser bundle has no channel. */
  | "notTauri"
  /** The command answered in a shape this build cannot read. */
  | "unfoldable";

export type RollupState =
  | { kind: "loading" }
  | { kind: "unavailable"; reason: RollupUnavailableReason; message?: string }
  | {
      kind: "ready";
      rollup: ArchRollup;
      /** Size of the committed graph this picture was read FROM — a
       * volatile stat, so it lives here and never in the payload
       * (ADR-014), and it is what lets the pane say how many bytes it did
       * NOT have to receive. */
      graphBytes: number;
      measuredAtMs: number;
    };

const LOADING: RollupState = { kind: "loading" };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Own-property read (never the prototype chain) — the graph.ts rule. */
const own = (record: Record<string, unknown>, key: string): unknown =>
  Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/**
 * Fold an `arch_rollup` reply into a state. Total: any value at all
 * produces one, and the worst is `unavailable: unfoldable`.
 */
export function parseRollupOutcome(value: unknown, nowMs = Date.now()): RollupState {
  if (!isRecord(value)) return { kind: "unavailable", reason: "unfoldable" };
  switch (own(value, "kind")) {
    case "noProject":
      return { kind: "unavailable", reason: "noProject" };
    case "noDocs":
      return { kind: "unavailable", reason: "noDocs" };
    case "noGraph":
      return { kind: "unavailable", reason: "noGraph" };
    case "unreadable": {
      const message = own(value, "message");
      return typeof message === "string" && message !== ""
        ? { kind: "unavailable", reason: "unreadable", message }
        : { kind: "unavailable", reason: "unreadable" };
    }
    case "ready": {
      const parsed = parseRollup(own(value, "rollup"));
      if (parsed.rollup === undefined) return { kind: "unavailable", reason: "unfoldable" };
      const graphBytes = own(value, "graphBytes");
      return {
        kind: "ready",
        rollup: parsed.rollup,
        graphBytes: isCount(graphBytes) ? graphBytes : 0,
        measuredAtMs: nowMs,
      };
    }
    default:
      return { kind: "unavailable", reason: "unfoldable" };
  }
}

/** One fixed sentence per reason — the ONLY text the pane may show about
 * a channel that could not answer. `unreadable` is the one arm that has a
 * message to add, and that message is the app's own. */
export function rollupUnavailableSentence(reason: RollupUnavailableReason): string {
  switch (reason) {
    case "noProject":
      return "no project open";
    case "noDocs":
      return "this folder has no docs/ directory";
    case "noGraph":
      return "index not run";
    case "unreadable":
      return "the committed graph could not be read";
    case "notTauri":
      return "the map channel needs the desktop app";
    case "unfoldable":
      return "the map channel answered in a shape this build cannot read";
  }
}

// --- the detail pull's own fold -----------------------------------------

export type DetailState =
  | { kind: "loading" }
  | { kind: "unavailable"; reason: RollupUnavailableReason }
  | { kind: "answered"; detail: ArchDetail };

/** Fold an `arch_detail` reply. The Rust `Answered` wrapper is unwrapped
 * here: a refusal (`detail.kind === "unknown"`) is an ANSWER and must not
 * be folded into `unavailable`, because the two have different remedies —
 * one is "your view is stale", the other "there is nothing to ask". */
export function parseDetailOutcome(value: unknown): DetailState {
  if (!isRecord(value)) return { kind: "unavailable", reason: "unfoldable" };
  switch (own(value, "kind")) {
    case "noProject":
      return { kind: "unavailable", reason: "noProject" };
    case "noDocs":
      return { kind: "unavailable", reason: "noDocs" };
    case "noGraph":
      return { kind: "unavailable", reason: "noGraph" };
    case "unreadable":
      return { kind: "unavailable", reason: "unreadable" };
    case "answered": {
      const parsed = parseDetail(own(value, "detail"));
      return parsed.detail === undefined
        ? { kind: "unavailable", reason: "unfoldable" }
        : { kind: "answered", detail: parsed.detail };
    }
    default:
      return { kind: "unavailable", reason: "unfoldable" };
  }
}

// --- the module store ---------------------------------------------------

let state: RollupState = LOADING;
const listeners = new Set<() => void>();

function set(next: RollupState): RollupState {
  state = next;
  for (const listener of listeners) listener();
  return state;
}

export function subscribeRollup(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRollupState(): RollupState {
  return state;
}

/** Fold a payload into the store. Exported because it is the ONE fold
 * spelling in this tree — `loadRollup` calls it and so does every test,
 * so a parallel reduction would have to be written on purpose. */
export function applyRollupPayload(value: unknown, nowMs = Date.now()): RollupState {
  return set(parseRollupOutcome(value, nowMs));
}

/** Lazy rather than a module const, for `churn-source.ts`'s reason: the
 * value cannot change inside a real app, and reading it at call time is
 * what lets a headless body drive both branches without reloading. */
function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let inFlight: Promise<RollupState> | null = null;

/**
 * WHICH PROJECT THE CURRENT ANSWER IS ABOUT (the T-116 mechanism). An
 * answer whose generation has moved is DISCARDED rather than folded, and
 * only the current flight may release the single-flight latch. It also
 * keys the detail cache below, so a switch cannot serve one project's
 * file list for another's component.
 */
let generation = 0;

/**
 * Ask for the picture. Single-flight: a second call while one is out
 * returns the same promise. A rejected invoke is an unavailable channel,
 * not an exception, and the rejection's text is dropped rather than
 * shown.
 */
export function loadRollup(): Promise<RollupState> {
  if (inFlight !== null) return inFlight;
  if (!hasTauriRuntime()) {
    // A browser bundle has no channel, so it must not OVERWRITE a state
    // something else already folded — only answer the question nobody
    // has answered yet (the `loadChurn` rule, for the same reason).
    return Promise.resolve(
      state.kind === "loading" ? set({ kind: "unavailable", reason: "notTauri" }) : state,
    );
  }
  const measuring = generation;
  // The type argument is NOT decoration: the IPC census in
  // `app/test/crescendo-dom.test.tsx` finds call sites by matching an
  // invoke that carries one, so a bare call would be invisible to the
  // count that guards this boundary (T-013's note, still true).
  inFlight = invoke<unknown>("arch_rollup")
    .then((payload) => (measuring === generation ? applyRollupPayload(payload) : state))
    .catch(() =>
      measuring === generation ? set({ kind: "unavailable", reason: "unreadable" }) : state,
    )
    .finally(() => {
      if (measuring === generation) inFlight = null;
    });
  return inFlight;
}

// --- the pull ------------------------------------------------------------

/**
 * Answers already fetched, keyed by target, THIS generation.
 *
 * A cache and not a memo: the same component is opened, closed and
 * reopened constantly, and every reopen would otherwise re-read and
 * re-join the whole graph Rust-side. It is dropped wholesale on a project
 * switch by the generation bump below — a detail answer is about a
 * project, and serving one project's file list under another's component
 * id is the exact defect T-116 fixed for churn.
 */
let detailCache = new Map<string, ArchDetail>();
const detailInFlight = new Map<string, Promise<DetailState>>();

/** What the cache already holds for `target`, or undefined. Synchronous —
 * the pane renders from this and asks only when it is a miss. */
export function cachedDetail(target: string): ArchDetail | undefined {
  return detailCache.get(target);
}

/**
 * Pull file-level detail for ONE named target (`c:<id>` or `f:<path>` —
 * `componentTarget`/`fileTarget` spell them).
 *
 * Single-flight PER TARGET: two components opened at once are two
 * requests, but one component clicked twice is one.
 */
export function loadDetail(target: string): Promise<DetailState> {
  const cached = detailCache.get(target);
  if (cached !== undefined) return Promise.resolve({ kind: "answered", detail: cached });
  const pending = detailInFlight.get(target);
  if (pending !== undefined) return pending;
  if (!hasTauriRuntime()) {
    return Promise.resolve({ kind: "unavailable", reason: "notTauri" });
  }
  const measuring = generation;
  const flight = invoke<unknown>("arch_detail", { target })
    .then((payload) => {
      const folded = parseDetailOutcome(payload);
      // A stale generation's answer is DROPPED rather than cached: it is
      // about the previous project.
      if (measuring === generation && folded.kind === "answered") {
        detailCache.set(target, folded.detail);
      }
      return folded;
    })
    .catch((): DetailState => ({ kind: "unavailable", reason: "unreadable" }))
    .finally(() => {
      detailInFlight.delete(target);
    });
  detailInFlight.set(target, flight);
  return flight;
}

// --- forgetting on a project switch (T-116's mechanism) ------------------

/**
 * THE FOLDER THE CURRENT ANSWER IS ABOUT. Same argument as
 * `churn-source.ts`'s, and the same shape: the map's sources that
 * REMEMBER must say when they measured and be told when to forget, and
 * `MapView` is not remounted by a project switch. Module scope rather
 * than a mount effect because the property is about the STORE — a switch
 * while the map is closed must still invalidate the answer, or the next
 * mount paints the previous project's component counts for one frame.
 */
let measuredFor: string = getShellState().docs.projectDir;

function onProjectMaybeChanged(): void {
  const projectDir = getShellState().docs.projectDir;
  if (projectDir === measuredFor) return;
  measuredFor = projectDir;
  // The detail cache is dropped UNCONDITIONALLY, even when nothing has
  // been asked yet: it is cheap, and the one thing worse than an empty
  // cache is a populated one belonging to another project.
  generation += 1;
  detailCache = new Map();
  detailInFlight.clear();
  // Nothing has been asked yet, so there is nothing to re-ask — the
  // pane's mount effect measures when it opens, against the new folder
  // (the `loadChurn` rule; a re-read here would cost a graph parse for a
  // pane nobody has looked at).
  if (state.kind === "loading" && inFlight === null) return;
  inFlight = null;
  set(LOADING);
  void loadRollup();
}

subscribeShell(onProjectMaybeChanged);

/** Test-only reset (the module-singleton convention). */
export function __resetRollupForTests(): void {
  state = LOADING;
  listeners.clear();
  inFlight = null;
  generation += 1;
  detailCache = new Map();
  detailInFlight.clear();
  measuredFor = getShellState().docs.projectDir;
}
