import { useSyncExternalStore } from "react";
import {
  applyGenesisStatus,
  cancelGenesis,
  emptyGenesisState,
  getGenesisState,
  isTurnInFlight,
  reduceGenesisEvent,
  reduceGenesisOutcome,
  sendGenesisTurn,
  startGenesis,
  startGenesisListener,
  subscribeGenesis,
  type GenesisEvent,
  type GenesisState,
  type GenesisStatusPayload,
  type SendOutcomePayload,
  type StartOutcomePayload,
} from "@/lib/agent-store";

/**
 * WHERE THE INTERVIEW'S STATE COMES FROM — one hook, two runtimes, ONE
 * reduction.
 *
 * Under Tauri this is `useSyncExternalStore` over C-14's real store and
 * nothing more; there is no second subscriber on the `genesis-turn`
 * channel, no second fold, and no second stale-drop state. In a served
 * DEV bundle — which has no Tauri, therefore no runner, no CLI and no
 * watcher — a twin store is fed by `window.__nputerInterviewHarness`
 * and folded with **the same exported `reduceGenesisEvent`**. That is
 * T-041's `commitPickOutcome` argument in a different shape: there is
 * exactly one reduction spelling in the tree, so a parallel
 * implementation would have to be written on purpose.
 *
 * THE GATE is the shell harness's gate, in the same shape and for the
 * same two reasons: `!isTauri` fences the RUNTIME (a packaged app never
 * runs the block) and `import.meta.env.DEV` fences the BUILD (vite
 * replaces it with `false`, so Rollup drops the block and the name
 * contributes zero bytes to `dist/`). Both halves are proved, and
 * drilled in both directions, in `app/test/interview-harness.test.ts`.
 *
 * THIS MODULE OWNS THE USER'S HALF OF THE TRANSCRIPT, and the store
 * deliberately does not: `sendGenesisTurn(text)` passes `text` to
 * `invoke` and records nothing anywhere the webview can read. So the
 * transcript is a JOIN — planner halves from the store, user halves
 * from here. The consequence, stated rather than discovered: THE USER'S
 * HALF DOES NOT SURVIVE A REMOUNT OR AN APP RESTART.
 * `refreshGenesisStatus` rebuilds `phase`/`turn`/`nativeSessionId` but
 * never `turns`, so a remount mid-interview shows an empty transcript
 * over a live session. That is T-029's rehydration, named here so
 * nobody builds half of it.
 */

const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

// ---- the DEV twin -------------------------------------------------------

let twinState: GenesisState = emptyGenesisState();
const twinListeners = new Set<() => void>();

function setTwin(next: GenesisState): void {
  // The store's own identity guard, kept: `reduceGenesisEvent` returns
  // `prev` BY IDENTITY on a stale or duplicate `seq`, so a replayed
  // event notifies nobody and re-renders nothing.
  if (next === twinState) return;
  twinState = next;
  for (const listener of twinListeners) listener();
}

function subscribeTwin(callback: () => void): () => void {
  twinListeners.add(callback);
  return () => twinListeners.delete(callback);
}

declare global {
  interface Window {
    __nputerInterviewHarness?: {
      /** Push one `genesis-turn` payload through the shipped reducer. */
      push: (event: GenesisEvent) => void;
      /** Push one start/send outcome through the shipped reducer. */
      outcome: (outcome: StartOutcomePayload | SendOutcomePayload) => void;
      /** Push the mount-time catch-up pull `genesis_status` answers. It
       * is what tells the screen an interview has NOT started, which is
       * what the auto-start keys off — so without this door a served
       * bundle could never reach the first frame at all. */
      status: (payload: GenesisStatusPayload) => void;
      /** The twin's current state — the same shape the store answers. */
      get: () => GenesisState;
      /**
       * What the UI ASKED to send, in order. `sendGenesisTurn` returns
       * early on `!isTauri`, so without this a served bundle can prove a
       * keystroke was claimed but never that it reached a command — the
       * cheapest of T-049-s1's three remedies, scoped to this screen.
       */
      sent: () => readonly string[];
    };
  }
}

/**
 * Start the interview's state source. Called once from `App.tsx`, beside
 * `startDocsWatcher` — an app-shell edit, not a C-14 edit.
 *
 * The branch shape is `runStartup`'s, deliberately: runtime gate first,
 * build gate inside it, early return, and the Tauri path below it
 * untouched by either.
 */
export async function startInterviewSource(): Promise<void> {
  if (!isTauri) {
    if (import.meta.env.DEV) {
      window.__nputerInterviewHarness = {
        push: (event) => setTwin(reduceGenesisEvent(twinState, event)),
        outcome: (outcome) => setTwin(reduceGenesisOutcome(twinState, outcome)),
        status: (payload) => setTwin(applyGenesisStatus(twinState, payload)),
        get: () => twinState,
        sent: () => [...sendLedger],
      };
      console.info("[nputer] no Tauri IPC detected — interview harness active");
    }
    return;
  }
  // NEVER REJECTS, deliberately, and this is the one place it matters:
  // `startGenesisListener` awaits `listen("genesis-turn")`, and a refused
  // subscription would otherwise become an unhandled rejection at the
  // app's root — the shape T-050 spent a whole task removing from
  // `startDocsWatcher`. A refusal is LOUD (the console line below) and
  // recoverable rather than fatal: the interview screen simply shows no
  // turns, and its explicit "Start the interview" affordance is still
  // there, which is exactly why that affordance is not optional.
  try {
    await startGenesisListener();
  } catch (err) {
    console.error("[nputer] the interview event subscription was refused", err);
  }
}

// ---- the UI's own half --------------------------------------------------

/** The half of the interview's state the STORE does not hold. */
export interface InterviewUiState {
  /** Answers the user sent that a command accepted, by turn number. */
  userHalves: ReadonlyMap<number, string>;
  /** A send or start is in flight from THIS side, set SYNCHRONOUSLY. */
  busy: boolean;
  /** The last non-accepted outcome worth showing, or null. */
  notice: StartOutcomePayload | SendOutcomePayload | null;
}

const EMPTY_UI: InterviewUiState = {
  userHalves: new Map(),
  busy: false,
  notice: null,
};

let uiState: InterviewUiState = EMPTY_UI;
const uiListeners = new Set<() => void>();
/** Every text the UI asked to send, in order (the DEV proof channel). */
const sendLedger: string[] = [];
/**
 * Projects an auto-start has already been ATTEMPTED for, keyed by
 * project dir. Set on a TYPED OUTCOME, never before the await, and
 * cleared when the attempt produced no outcome at all — so a rejected
 * `invoke` genuinely re-attempts rather than stranding the screen
 * (T-050's lesson applied preemptively rather than inherited).
 */
const autoStarted = new Set<string>();

function setUi(patch: Partial<InterviewUiState>): void {
  const next = { ...uiState, ...patch };
  uiState = next;
  for (const listener of uiListeners) listener();
}

function subscribeUi(callback: () => void): () => void {
  uiListeners.add(callback);
  return () => uiListeners.delete(callback);
}

function getUi(): InterviewUiState {
  return uiState;
}

function recordUserHalf(turn: number, text: string): void {
  const userHalves = new Map(uiState.userHalves);
  userHalves.set(turn, text);
  setUi({ userHalves });
}

// ---- the source hook ----------------------------------------------------

const subscribeState = isTauri ? subscribeGenesis : subscribeTwin;
const getState = isTauri ? getGenesisState : (): GenesisState => twinState;

/** The store's state (or, in a served DEV bundle, the twin's). */
export function useGenesisState(): GenesisState {
  return useSyncExternalStore(subscribeState, getState, getState);
}

/** The half of the state this module owns. */
export function useInterviewUi(): InterviewUiState {
  return useSyncExternalStore(subscribeUi, getUi, getUi);
}

/**
 * Is a turn in flight? The store's own flag OR this module's synchronous
 * latch.
 *
 * BOTH are needed and neither is sufficient, which is worth stating
 * because it is not obvious: `sendGenesisTurn` sets `sending` only after
 * `invoke` RESOLVES, so between the keypress and the answer the store
 * still reads "idle" — and a burst of ⏎ presses would each pass the
 * store's guard and each reach a command. The synchronous latch below
 * closes exactly that window. The `disabled` attribute is not the guard
 * either: a keydown can be delivered between state updates, so the ⏎
 * handler re-checks this function before calling.
 */
export function interviewBusy(genesis: GenesisState, ui: InterviewUiState): boolean {
  return ui.busy || isTurnInFlight(genesis);
}

/**
 * Send the user's answer. Single-flight, synchronously latched, always
 * released.
 *
 * The user half is recorded ONLY when a command answers `accepted` —
 * `busy` / `noSession` / `staleProject` / `cliNotFound` / `error` record
 * nothing and render as an inline notice instead.
 */
export async function sendAnswer(text: string): Promise<SendOutcomePayload | null> {
  if (uiState.busy) return null;
  sendLedger.push(text);
  setUi({ busy: true, notice: null });
  try {
    const outcome = await sendGenesisTurn(text);
    if (outcome === null) {
      // No command answered at all. Under Tauri that is the store's own
      // in-flight guard and nothing was sent. In a served DEV bundle
      // there is no Rust to answer, so the harness owns the transcript
      // and the attempt is recorded at the turn it was aimed at — the
      // one place the two runtimes differ, and it exists only because
      // the browser has no command to accept or refuse.
      if (!isTauri && import.meta.env.DEV) {
        recordUserHalf(nextTurnNumber(), text);
      }
      return null;
    }
    if (outcome.kind === "accepted") recordUserHalf(outcome.turn, text);
    else setUi({ notice: outcome });
    return outcome;
  } finally {
    setUi({ busy: false });
  }
}

/** The turn a fresh answer is aimed at: one past the highest turn seen. */
function nextTurnNumber(): number {
  const turns = getState().turns;
  let highest = 0;
  for (const turn of turns) if (turn.turn > highest) highest = turn.turn;
  return highest + 1;
}

/**
 * Start turn 1. Used by both the auto-start and the explicit affordance,
 * so the two cannot drift.
 *
 * `force` distinguishes them: the auto-start refuses a project it has
 * already attempted, the button never does — that is what keeps the
 * auto-start a convenience and the button load-bearing.
 */
export async function startInterview(
  projectDir: string,
  options: { force?: boolean } = {},
): Promise<StartOutcomePayload | null> {
  if (uiState.busy) return null;
  if (!options.force && autoStarted.has(projectDir)) return null;
  setUi({ busy: true, notice: null });
  try {
    const outcome = await startGenesis();
    if (outcome === null) return null;
    // A TYPED outcome — including a failure — is an attempt that
    // happened. Anything else leaves the latch open for a retry.
    autoStarted.add(projectDir);
    if (outcome.kind !== "started") setUi({ notice: outcome });
    return outcome;
  } finally {
    setUi({ busy: false });
  }
}

/** Retry the command that produced a failure, with the same argument. */
export async function retryTurn(
  projectDir: string,
  turn: number,
): Promise<StartOutcomePayload | SendOutcomePayload | null> {
  if (turn <= 1) return startInterview(projectDir, { force: true });
  const stored = uiState.userHalves.get(turn);
  if (stored === undefined) return null;
  return sendAnswer(stored);
}

/** Stop the turn in flight. The NATIVE session survives — the kill is of
 * the turn, not the conversation. */
export function cancelTurn(): void {
  void cancelGenesis();
}

/** Test-only reset (this module is a singleton, like the store). */
export function __resetInterviewSourceForTests(): void {
  twinState = emptyGenesisState();
  twinListeners.clear();
  uiState = EMPTY_UI;
  uiListeners.clear();
  sendLedger.length = 0;
  autoStarted.clear();
}
