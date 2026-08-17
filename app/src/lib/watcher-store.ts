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

/** Mirror of Rust's `PlanProbe` (T-026): what the front door looked for
 * in a folder, and what it found. Booleans only — the checklist's ○/✓
 * marks are measured, and no path the user did not choose is disclosed. */
export interface PlanProbePayload {
  roadmap: boolean;
  tasks: boolean;
  architecture: boolean;
  git: boolean;
}

/** Nothing found — the honest default when no probe rode a payload. */
export const EMPTY_PROBE: PlanProbePayload = {
  roadmap: false,
  tasks: false,
  architecture: false,
  git: false,
};

/** Mirror of Rust's `ProjectStatus` (src-tauri/src/docs_watch.rs). */
export type ProjectStatusPayload =
  | { kind: "noProject" }
  | { kind: "noDocs"; projectDir: string; probe: PlanProbePayload }
  | { kind: "open"; snapshot: DocsSnapshotPayload };

/** Mirror of Rust's `PickOutcome` (src-tauri/src/docs_watch.rs). */
export type PickOutcomePayload =
  | { kind: "cancelled" }
  | { kind: "busy" }
  | { kind: "noDocs"; path: string; probe: PlanProbePayload }
  | { kind: "error"; path: string; message: string }
  | { kind: "picked"; snapshot: DocsSnapshotPayload }
  /** T-026: opened as a genesis project — no plan there yet, the watcher
   * is armed on the root sentinel, and `seq` is the switch's ordering
   * stamp (what makes late emits from the previous project provably
   * stale).
   *
   * T-042 criterion 1: `snapshot` is the folder's CURRENT docs tree when
   * it already has one — "no plan" is a weaker condition than "no docs/",
   * so a lone `docs/ARCHITECTURE.md` or a `docs/decisions/` tree is
   * genesis-eligible and the pane must render what is actually written
   * there. `null` means the folder genuinely has no docs/ yet. Rust
   * always sends the key; it is declared OPTIONAL here for the same
   * reason T-018's `skipped`/`truncated` are — a payload minted before
   * the field existed stays valid, and absent reads as "no tree", never
   * as a claim about one. */
  | {
      kind: "genesis";
      projectDir: string;
      seq: number;
      probe: PlanProbePayload;
      snapshot?: DocsSnapshotPayload | null;
    };

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
 * - "genesis": a folder with no plan is open for an interview (T-026);
 *   the docs model still tracks whatever lands, so the pipeline lighting
 *   up does NOT yank the screen away mid-interview
 * - "open": a project is open; `docs` holds its live model
 */
export type ShellPhase =
  | "loading"
  | "browser"
  | "noProject"
  | "noDocs"
  | "genesis"
  | "open";

/**
 * T-050: which of `startDocsWatcher`'s two awaits broke. Naming the step
 * is the difference between "startup failed" and a sentence the user can
 * act on — and the two are genuinely different situations: a refused
 * SUBSCRIBE leaves no live watcher at all, while a refused SNAPSHOT
 * leaves the subscription up, so the next file change can still bring
 * the app to life on its own.
 */
export type StartupStep = "subscribe" | "snapshot";

/** A startup attempt that did not finish. `message` is a stringified
 * rejection — rendered as a TEXT NODE, never as markup. */
export interface StartupFailure {
  step: StartupStep;
  message: string;
  /** Which attempt this was (1 on the first). Makes "the retry ran and
   * failed again" distinguishable from "the retry never ran". */
  attempt: number;
}

/** A picker choice Rust rejected. message === null means "no docs/ there"
 * — the front door's "No plan in <folder>" card, whose checklist renders
 * from `probe`; otherwise it is a re-arm/dialog error explanation. */
export interface RejectedPick {
  path: string;
  message: string | null;
  probe: PlanProbePayload | null;
}

export interface ShellState {
  phase: ShellPhase;
  /** Launch-resolved project root when phase === "noDocs". */
  resolvedDir: string | null;
  /** What the launch-resolved root was probed for (T-026), when known. */
  resolvedProbe: PlanProbePayload | null;
  /** The genesis project's root when phase === "genesis" (T-026). */
  genesisDir: string | null;
  /** Last rejected pick, until dismissed or a pick succeeds. */
  rejectedPick: RejectedPick | null;
  /** Native folder dialog currently open. */
  picking: boolean;
  /** T-050: a startup attempt is in flight (single-flight like
   * `picking`, and for the same reason — the retry affordance must not
   * stack attempts). */
  starting: boolean;
  /** T-050: why the last startup attempt failed, or null while one is
   * running / after one has succeeded. This is the whole of layer 2:
   * the rejection used to become an unhandled promise and nothing else,
   * so the user was told nothing. */
  startupFailure: StartupFailure | null;
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

/** What criterion (c)'s message points at: the convention layout. Kept
 * verbatim from T-007 — the "No plan in <folder>" card carries it as its
 * footnote, so redesigning the state lost none of what it said. */
export const CONVENTION_HINT =
  "an nputer project keeps its board in docs/tasks/, decisions in docs/decisions/";

/** One row of the "No plan in <folder>" checklist (T-026): a path the
 * front door looked for, and whether it is there. */
export interface PlanChecklistRow {
  path: string;
  found: boolean;
  /** Extra clause the design gives a found row (only .git has one). */
  note?: string;
}

/** The design's checklist, marks measured from the Rust-side probe. The
 * paths are exactly what the shell looks for — the T-007 message's
 * enumeration, now itemized and answered per row. */
export function planChecklist(probe: PlanProbePayload | null): PlanChecklistRow[] {
  const p = probe ?? EMPTY_PROBE;
  return [
    { path: "docs/ROADMAP.md", found: p.roadmap },
    { path: "docs/tasks/*.md", found: p.tasks },
    { path: "docs/ARCHITECTURE.md", found: p.architecture },
    ...(p.git
      ? [{ path: ".git", found: true, note: "it is a repo, so the plan can live here" }]
      : [{ path: ".git", found: false }]),
  ];
}

/**
 * What the front door says about the folder it is looking at.
 * - "noPlan": a folder is named and has no plan — the design's "No plan
 *   in <folder>" card, with the checklist and "Start an interview here".
 * - "message": nothing is named yet (no project open), or a pick failed
 *   for a reason worth spelling out.
 */
export type FrontDoorNotice =
  | { kind: "noPlan"; path: string; probe: PlanProbePayload }
  | { kind: "message"; message: string };

/** Which screen the shell shows. Empty screens carry their notice and
 * whether "keep the current project" is a meaningful escape hatch. */
export type ScreenModel =
  | { screen: "loading" }
  /** T-050: startup rejected and the app is NOT still waiting. The
   * failure rides the screen so the renderer needs no second opinion
   * about what went wrong. */
  | { screen: "startupFailed"; failure: StartupFailure }
  | { screen: "browser" }
  | { screen: "empty"; notice: FrontDoorNotice; canKeepCurrent: boolean }
  /** T-026: a genesis project is open — full-bleed, no rail (the rail
   * stays board|map, which are the panes an OPEN project has). */
  | { screen: "genesis" }
  | { screen: "board" };

export function selectScreen(shell: ShellState): ScreenModel {
  if (shell.rejectedPick !== null) {
    const { path, message, probe } = shell.rejectedPick;
    return {
      screen: "empty",
      notice:
        message === null
          ? { kind: "noPlan", path, probe: probe ?? EMPTY_PROBE }
          : {
              kind: "message",
              message: `could not open ${path || "the chosen folder"}: ${message}`,
            },
      // A genesis project is something to keep, exactly like an open one.
      canKeepCurrent: shell.phase === "open" || shell.phase === "genesis",
    };
  }
  // T-050: a startup that FAILED is not a startup that is still going,
  // and the screen must stop claiming it is waiting. Shown only while
  // nothing is open BY ANY ROUTE — "loading" and "browser" are exactly
  // the two phases a failure can survive into, because every other
  // phase is an ANSWER a completed startup (or a pick) produced. That
  // gate is what makes criterion 3's escape arrive somewhere: a
  // successful pick or interview from this very screen moves the phase
  // and the board/genesis takes over. It sits BELOW the rejected-pick
  // block deliberately — a folder the user just chose and had refused
  // is the more immediate answer, and that screen has its own ways in.
  if (
    shell.startupFailure !== null &&
    (shell.phase === "loading" || shell.phase === "browser")
  ) {
    return { screen: "startupFailed", failure: shell.startupFailure };
  }
  switch (shell.phase) {
    case "loading":
      return { screen: "loading" };
    case "browser":
      return { screen: "browser" };
    case "noProject":
      return {
        screen: "empty",
        notice: { kind: "message", message: `no project open — ${CONVENTION_HINT}` },
        canKeepCurrent: false,
      };
    case "noDocs":
      // The launch-resolved repo has no plan: the same card a rejected
      // pick shows, which is the first-launch genesis entry.
      return {
        screen: "empty",
        notice: {
          kind: "noPlan",
          path: shell.resolvedDir ?? "the resolved folder",
          probe: shell.resolvedProbe ?? EMPTY_PROBE,
        },
        canKeepCurrent: false,
      };
    case "genesis":
      return { screen: "genesis" };
    case "open":
      return { screen: "board" };
  }
}

/**
 * Apply one picker outcome to the shell (T-026, pure and unit-tested —
 * the three picker commands share it). Returns `prev` BY IDENTITY when
 * nothing changed, which is criterion 6 made mechanical: a cancelled
 * dialog and a refused concurrent claim cannot touch the open project,
 * and a rejected choice only adds a notice.
 */
export function reducePickOutcome(
  prev: ShellState,
  outcome: PickOutcomePayload,
): ShellState {
  switch (outcome.kind) {
    case "cancelled":
      return prev; // criterion 6: nothing changed, nothing to show
    case "busy":
      // T-021's Rust latch refused a concurrent pick. This store's own
      // `picking` gate makes it near-unreachable from here; either way,
      // nothing changed.
      return prev;
    case "noDocs":
      return { ...prev, rejectedPick: { path: outcome.path, message: null, probe: outcome.probe } };
    case "error":
      return {
        ...prev,
        rejectedPick: { path: outcome.path, message: outcome.message, probe: null },
      };
    case "picked":
      return {
        ...prev,
        docs: reduceDocs(prev.docs, outcome.snapshot),
        phase: "open",
        genesisDir: null,
        rejectedPick: null,
        resolvedDir: null,
        resolvedProbe: null,
      };
    case "genesis": {
      // The previous project's model is cleared HERE — same-named paths
      // in the new folder must never fall back to another project's
      // content — while `resetDocsForProjectSwitch` KEEPS the seq
      // watermark and the switch's own seq advances it past every
      // pre-switch emit (the T-007 stale-drop invariant).
      const switched = resetDocsForProjectSwitch(prev.docs);
      // T-042 criterion 1: a genesis folder can already HAVE a docs/ (no
      // plan is weaker than no docs/), and when it does the switch
      // carries that tree. Rust stamps the snapshot with the switch's own
      // seq, so applying it advances the watermark to exactly the value
      // the other branch sets by hand — one stamp either way.
      const snapshot = outcome.snapshot ?? null;
      return {
        ...prev,
        docs:
          snapshot === null
            ? { ...switched, seq: outcome.seq }
            : applySnapshot(switched, snapshot),
        phase: "genesis",
        genesisDir: outcome.projectDir,
        rejectedPick: null,
        resolvedDir: null,
        resolvedProbe: null,
      };
    }
  }
}

/**
 * T-042 criterion 3: did a REAL SNAPSHOT produce this outcome's model?
 *
 * The `model-updated` echo exists to report what the frontend PARSED out
 * of a snapshot Rust collected. The guard it used to sit behind —
 * "the docs seq advanced" — reads as provenance and is not: the genesis
 * case deliberately advances the watermark so late emits from the
 * previous project are provably stale, Rust's seq counter is global and
 * monotonic, so a switch seq is ALWAYS greater than the last emit's and
 * the guard was ALWAYS true. A snapshot-less switch echoed
 * `{"seq":7,"generatedAtMs":0,…}` — the zero timestamp being the tell
 * that no collection made it — and the app's own stdout carried a
 * model-update line for a model nothing produced (T-026-s6).
 *
 * Provenance is a property of the OUTCOME, so it is read from the
 * outcome. Exported because a rule this easy to re-break deserves its
 * own name and its own test.
 */
export function outcomeCarriesSnapshot(outcome: PickOutcomePayload): boolean {
  switch (outcome.kind) {
    case "picked":
      return true;
    case "genesis":
      // Exactly the shape that HAS a tree; `?? null` so an older payload
      // without the field reads as "no tree" rather than throwing.
      return (outcome.snapshot ?? null) !== null;
    default:
      return false;
  }
}

/**
 * What `__nputerShellHarness.getShell()` answers (T-041). Deliberately a
 * SUMMARY rather than `ShellState` itself: the harness is read across the
 * browser boundary (`page.evaluate` structured-clones its return value)
 * and `DocsModelState` carries two `ReadonlyMap`s, which do not survive
 * that trip. Every field here is a plain JSON value.
 *
 * `phase` is the point of the whole thing: a spec asserts on the shell's
 * OWN phase, not on a selector that could just as well match a different
 * screen. `screen` rides along so a spec can bind the two together
 * (it is exactly what `App` stamps as `data-screen`).
 */
export interface ShellHarnessSnapshot {
  phase: ShellPhase;
  screen: ScreenModel["screen"];
  resolvedDir: string | null;
  resolvedProbe: PlanProbePayload | null;
  genesisDir: string | null;
  rejectedPick: RejectedPick | null;
  picking: boolean;
  /** T-050: the startup state, so a spec can assert on the shell's own
   * account of it rather than on a selector. */
  starting: boolean;
  startupFailure: StartupFailure | null;
  indexing: boolean;
  docs: {
    seq: number;
    projectDir: string;
    fileCount: number;
    taskCount: number;
    featureCount: number;
    failureCount: number;
  };
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
    /**
     * Dev-only shell harness (T-041) — absent in Tauri and in prod
     * builds, behind the SAME `!isTauri && import.meta.env.DEV` gate as
     * `__nputerDocsHarness` and installed in the same statement, so
     * there is one gate to audit rather than two that could drift.
     *
     * A test surface over the shell's OWN state, never new IPC: both
     * `applyProjectStatus` and `applyPickOutcome` are the very functions
     * the Tauri path calls once a command has answered — `applyPickOutcome`
     * is `commitPickOutcome`, i.e. `runPicker` minus the `invoke`. What
     * this adds is a way to hand the store the payloads Rust would have
     * sent; it adds no way to make Rust send anything, no command, and no
     * grant. In a packaged app the whole block is unreachable (isTauri)
     * and absent from the bundle (DEV).
     */
    __nputerShellHarness?: {
      applyProjectStatus: (status: ProjectStatusPayload) => void;
      applyPickOutcome: (outcome: PickOutcomePayload) => void;
      /** T-050: `recordStartupFailure` itself — what the store's own
       * catch calls when `listen` or `invoke` rejects. Without it the
       * served bundle cannot reach a state the shipped app CAN reach
       * (a browser never awaits either), which is precisely the hole
       * T-041 exists to close. It fakes no IPC: it hands the shell the
       * failure Rust's boundary would have produced, exactly as
       * `applyProjectStatus` hands it the status. */
      applyStartupFailure: (step: StartupStep, reason: unknown) => void;
      getShell: () => ShellHarnessSnapshot;
    };
    /** Dev-only echo capture used by the browser harness. */
    __nputerEchoes?: ModelUpdateEcho[];
  }
}

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

let shell: ShellState = {
  phase: isTauri ? "loading" : "browser",
  resolvedDir: null,
  resolvedProbe: null,
  genesisDir: null,
  rejectedPick: null,
  picking: false,
  starting: false,
  startupFailure: null,
  indexing: false,
  indexOutcome: null,
  docs: emptyState(),
};
const listeners = new Set<() => void>();

/**
 * THE STARTUP LATCH (T-050). Holds the attempt that is in flight, or the
 * one that SUCCEEDED; `null` means "nothing is running and nothing has
 * succeeded", i.e. the next call genuinely re-attempts.
 *
 * A promise, rather than the boolean it replaces, because the two
 * properties this must have pull in opposite directions and a boolean
 * set before the awaits can only have one of them:
 *
 *  - RETRYABLE. The old `started = true` sat above both awaits and was
 *    never reset anywhere, so one transient rejection stranded the app
 *    forever — every later call returned at the guard without touching
 *    the boundary. The latch is now released in the failure path, so a
 *    retry really re-subscribes.
 *  - SINGLE-FLIGHT. The old code's one virtue was that a synchronous
 *    latch made React's double-effect harmless. That survives: the
 *    assignment below is synchronous — it happens in the same turn as
 *    the call, before any await inside can resume — so a second call
 *    arriving while the first is still running gets THE SAME promise
 *    and starts no second subscription.
 *
 * Holding the promise (rather than a `"starting" | "started" | "idle"`
 * enum, the other honest shape) buys one thing the enum does not: a
 * concurrent caller can AWAIT the attempt already in progress instead of
 * returning immediately having done nothing. The retry affordance and
 * the tests both want that.
 */
let startup: Promise<void> | null = null;
/** Attempts made this session — the failure card's honest count. */
let startupAttempts = 0;

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

/**
 * The dev harness's read side (T-041): the live shell, flattened to
 * plain JSON. `screen` comes from the real `selectScreen`, not from a
 * second opinion about what the phase means.
 */
function shellHarnessSnapshot(): ShellHarnessSnapshot {
  return {
    phase: shell.phase,
    screen: selectScreen(shell).screen,
    resolvedDir: shell.resolvedDir,
    resolvedProbe: shell.resolvedProbe,
    genesisDir: shell.genesisDir,
    rejectedPick: shell.rejectedPick,
    picking: shell.picking,
    starting: shell.starting,
    startupFailure: shell.startupFailure,
    indexing: shell.indexing,
    docs: {
      seq: shell.docs.seq,
      projectDir: shell.docs.projectDir,
      fileCount: shell.docs.fileCount,
      taskCount: shell.docs.model.tasks.length,
      featureCount: shell.docs.model.features.length,
      failureCount: shell.docs.failures.length,
    },
  };
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
  //
  // T-026: nor does it yank a GENESIS project onto the board. The model
  // updates underneath (that IS the pipeline lighting up — criteria 3
  // and 4), while the screen stays where the interview is; the front
  // door's stale "no docs/ found" claim is what an emit replaces.
  setShell({ docs: next, phase: shell.phase === "genesis" ? "genesis" : "open" });
  sendEcho(next);
}

/** The `model-updated` round trip (T-003): every applied snapshot is
 * echoed back to Rust for stdout, or captured by the dev harness. */
function sendEcho(next: DocsModelState): void {
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
      setShell({
        phase: "noDocs",
        resolvedDir: status.projectDir,
        resolvedProbe: status.probe,
      });
      break;
    case "noProject":
      setShell({ phase: "noProject" });
      break;
  }
}

/**
 * Record a startup attempt that did not finish (T-050). THE one place a
 * rejection becomes shell state — the store's own catch calls it, and so
 * does the dev harness, so what the lane renders is what the app
 * renders and not a second copy of it.
 */
function recordStartupFailure(step: StartupStep, reason: unknown): void {
  // THE INVARIANT, held here rather than only in the catch below: a
  // recorded failure ALWAYS means the latch is open, so the retry the
  // screen offers is never a no-op. Released BEFORE the notify, because
  // a subscriber woken by it may call `startDocsWatcher` synchronously.
  // Starting a fresh attempt in that window is safe: the catch releases
  // by IDENTITY, so a late rejection cannot unlatch the newer attempt.
  startup = null;
  setShell({
    starting: false,
    // `String(reason)` is the store's existing idiom for a rejected
    // boundary call (runPicker, runIndexRepo). It is put on screen as a
    // text node; nothing from it is ever interpreted as markup.
    startupFailure: { step, message: String(reason), attempt: startupAttempts },
  });
  // The message is an ARGUMENT, never interpolated into the line — the
  // same discipline as the `model-updated` echo's error log, and the
  // webview console is as far as it goes (no stdout path from here).
  console.error("[nputer] startup failed at", step, reason);
}

/**
 * One startup attempt: subscribe to `docs-changed` first, then pull the
 * startup status (the seq guard settles any ordering race between the
 * two — that order is deliberate and unchanged). Rejects if either
 * await does, having first recorded WHICH one and why; the latch above
 * turns that rejection into a retryable state rather than an unhandled
 * promise.
 */
async function runStartup(): Promise<void> {
  startupAttempts += 1;
  // A fresh attempt: the previous failure is no longer the current
  // truth, so the screen goes back to waiting while this one runs.
  setShell({ starting: true, startupFailure: null });

  if (!isTauri) {
    if (import.meta.env.DEV) {
      window.__nputerDocsHarness = {
        apply: applyDocsPayload,
        getState: () => shell.docs,
      };
      // T-041: the same gate, the same statement — a served DEV bundle
      // can reach every shell phase the shipped app reaches, because it
      // is handed the payloads Rust would have sent and runs the shell's
      // own reducers on them. Nothing here is new IPC and nothing here
      // exists in a packaged app: `isTauri` fences the runtime and
      // `import.meta.env.DEV` fences the build (vite replaces it with
      // `false` for `npm run build`, so Rollup drops the whole block —
      // asserted against the built bundle in test/shell-harness.test.ts).
      window.__nputerShellHarness = {
        applyProjectStatus,
        applyPickOutcome: commitPickOutcome,
        applyStartupFailure: recordStartupFailure,
        getShell: shellHarnessSnapshot,
      };
      console.info("[nputer] no Tauri IPC detected — browser dev harness active");
    }
    setShell({ starting: false });
    return;
  }

  try {
    await listen<DocsSnapshotPayload>("docs-changed", (event) => applyDocsPayload(event.payload));
  } catch (err) {
    recordStartupFailure("subscribe", err);
    throw err;
  }
  try {
    const status = await invoke<ProjectStatusPayload>("docs_snapshot");
    setShell({ starting: false });
    applyProjectStatus(status);
  } catch (err) {
    recordStartupFailure("snapshot", err);
    throw err;
  }
}

/**
 * Start the live pipeline. Idempotent while an attempt is in flight or
 * has succeeded (StrictMode double-effects, and the retry affordance),
 * and genuinely re-attempts once one has FAILED — see the `startup`
 * latch above for why it is a promise.
 *
 * NEVER REJECTS, by contract: a failed attempt is recorded in shell
 * state and rendered, so no caller can leave an unhandled rejection
 * behind. That is layer 2 of T-050 fixed at the callee, which is the
 * only place that knows WHICH await broke.
 */
export function startDocsWatcher(): Promise<void> {
  const inFlight = startup;
  if (inFlight !== null) return inFlight;
  // THE LATCH CLOSES BEFORE THE ATTEMPT RUNS, and that order is the
  // whole guard. `runStartup`'s first act is a synchronous
  // `setShell({ starting: true })`, which NOTIFIES — so if the latch
  // were assigned from `runStartup(...)`'s return value, a subscriber
  // woken by that notify and calling back in would read a still-null
  // latch and open a SECOND subscription (measured: `listen` called
  // twice). So `attempt` is a placeholder resolved when the real work
  // settles, latched first, and the work chained onto it in the same
  // synchronous turn. A second call arriving at any point while this
  // one is in flight — re-entrant or not — gets THIS promise back.
  let finish!: () => void;
  const attempt = new Promise<void>((resolve) => {
    finish = resolve;
  });
  startup = attempt;
  void runStartup()
    .catch(() => {
      // `runStartup` already recorded which await broke and why (the
      // shell state the screen renders). All that is left here is the
      // latch, released so the NEXT call genuinely re-attempts —
      // guarded by identity so a late rejection can never unlatch a
      // newer attempt.
      if (startup === attempt) startup = null;
    })
    .finally(finish);
  return attempt;
}

/**
 * Open the native folder picker (T-007). Zero arguments cross the IPC
 * boundary; Rust owns the dialog, validation, and watcher re-arm. A
 * rejected pick surfaces as the empty state's message and never touches
 * the open project's model or watch.
 */
export async function pickProjectFolder(): Promise<void> {
  await runPicker("pick_project_folder");
}

/**
 * T-026: "Start an interview" (⌘N) — the genesis variant of the picker.
 * Zero arguments again: Rust opens the dialog, validates the choice, and
 * decides what it MEANS (a folder with no plan opens for genesis; one
 * that already has a plan opens as the normal project it is — there is
 * no overwrite path in this app).
 */
export async function pickGenesisFolder(): Promise<void> {
  await runPicker("pick_genesis_folder");
}

/**
 * T-026: "Start an interview here" — genesis in the folder the front door
 * is already naming, with no dialog. Still zero arguments: Rust knows
 * which folder that is (the user's own last dialog choice, or the open
 * project), so the path never crosses the boundary in either direction.
 */
export async function startGenesisHere(): Promise<void> {
  await runPicker("start_genesis_here");
}

/**
 * The one picker pipeline behind all three commands: single-flight
 * webview-side (the Rust latch is the real gate — T-021), invoke, then
 * the pure `reducePickOutcome`. A snapshot that lands this way is echoed
 * exactly like a watcher push (T-003's round-trip contract) — and only a
 * snapshot is: a genesis switch onto a folder with no docs/ yet carries
 * no tree, so there is nothing for it to report and it echoes nothing.
 * One onto a folder that DOES have a docs/ carries that tree and echoes
 * it like any other snapshot (T-042 criterion 3; the echo is emitted by
 * `commitPickOutcome`, which is this function minus the `invoke`).
 */
async function runPicker(command: string): Promise<void> {
  if (!isTauri || shell.picking) return;
  setShell({ picking: true });
  try {
    commitPickOutcome(await invoke<PickOutcomePayload>(command));
  } catch (err) {
    setShell({ rejectedPick: { path: "", message: String(err), probe: null } });
  } finally {
    setShell({ picking: false });
  }
}

/**
 * Apply one picker outcome to the LIVE shell: the pure reducer, then the
 * notify and echo the store owes. Split out of `runPicker` (T-041) so the
 * dev harness can drive the same code the real picker drives — everything
 * after `invoke` answers, and nothing before it. A harness with its own
 * copy of this would prove nothing about the shipped shell.
 */
function commitPickOutcome(outcome: PickOutcomePayload): void {
  const before = shell;
  const next = reducePickOutcome(before, outcome);
  if (next === before) return;
  shell = next;
  for (const callback of listeners) callback();
  // T-042 criterion 3: the echo reports what the frontend parsed out of a
  // snapshot, so it fires for a payload A REAL SNAPSHOT PRODUCED — read
  // from the outcome's own provenance, never from the seq. The seq guard
  // that used to stand here was always true for a switch (see
  // `outcomeCarriesSnapshot`), so the app's stdout carried model-update
  // lines with `generatedAtMs: 0` for models nothing had generated. The
  // identity check stays: a stale or duplicate snapshot reduces to `prev`
  // by identity and must not echo twice.
  if (next.docs !== before.docs && outcomeCarriesSnapshot(outcome)) {
    sendEcho(next.docs);
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
