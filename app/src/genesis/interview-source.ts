import { useSyncExternalStore } from "react";
import {
  applyGenesisStatus,
  cancelGenesis,
  emptyGenesisState,
  freshGenesis,
  genesisKickoff,
  getGenesisState,
  isTurnInFlight,
  reduceGenesisEvent,
  reduceGenesisOutcome,
  refreshGenesisTranscript,
  resumeGenesis,
  sendGenesisTurn,
  startGenesis,
  startGenesisListener,
  subscribeGenesis,
  type GenesisEvent,
  type GenesisState,
  type GenesisStatusPayload,
  type KickoffOutcomePayload,
  type SendOutcomePayload,
  type StartOutcomePayload,
  type TranscriptLinePayload,
} from "@/lib/agent-store";
import { flightOf, type FlightReading } from "./crescendo";

/**
 * WHERE THE INTERVIEW'S STATE COMES FROM — one hook, two runtimes, ONE
 * reduction.
 *
 * Under Tauri this is `useSyncExternalStore` over C-14's real store and
 * nothing more; there is no second subscriber on the `genesis-turn`
 * channel, no second fold, and no second stale-drop state. In a served
 * DEV bundle — which has no Tauri, therefore no runner, no CLI and no
 * watcher — a twin store is fed by `window.__supertaskrInterviewHarness`
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
 * THIS MODULE OWNS THE LIVE SESSION'S USER HALVES, and the store
 * deliberately does not: `sendGenesisTurn(text)` passes `text` to
 * `invoke` and records nothing anywhere the webview can read. So the
 * transcript is a JOIN — planner halves from the store, user halves
 * from here.
 *
 * THAT JOIN USED TO END AT THE PROCESS BOUNDARY, and T-029 is where it
 * stops doing so. `refreshGenesisStatus` rebuilds
 * `phase`/`turn`/`nativeSessionId` but never `turns`, and these maps live
 * in module state, so a remount or an app restart mid-interview showed an
 * EMPTY CHAT over a LIVE SESSION. The third source is now
 * `.supertaskr/genesis/transcript.jsonl`, pulled by `rehydrateInterview` and
 * folded by `mergeRehydrated` — live state wins wherever both exist,
 * because a memory of a turn must never overwrite the turn.
 *
 * The cache is LOSABLE BY CHARTER and nothing here pretends otherwise: an
 * empty pull is the ordinary case AND the cache-is-gone case, and neither
 * blocks a resume. `docs/` is the record.
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
    __supertaskrInterviewHarness?: {
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
      /**
       * T-029 (T-027-s2): the refused turn subscription. A browser has no
       * `listen` to refuse, so this is the ONLY door to the state where
       * the plan assembles on the right and the chat stays empty on the
       * left. It sets the SHIPPED field on the shipped state — the same
       * argument `recordStartupFailure` made for T-050's screen.
       */
      listenerFailed: (failed: boolean) => void;
      /** T-029 criteria 1–2: the banked transcript a restart rehydrates
       * from. A served bundle has no `.supertaskr/` to read. */
      rehydrate: (lines: readonly TranscriptLinePayload[]) => void;
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
      window.__supertaskrInterviewHarness = {
        push: (event) => setTwin(reduceGenesisEvent(twinState, event)),
        outcome: (outcome) => setTwin(reduceGenesisOutcome(twinState, outcome)),
        status: (payload) => setTwin(applyGenesisStatus(twinState, payload)),
        get: () => twinState,
        sent: () => [...sendLedger],
        listenerFailed: (failed) => setTwin({ ...twinState, listenerFailed: failed }),
        rehydrate: (lines) => setTwin({ ...twinState, rehydrated: [...lines] }),
      };
      console.info("[supertaskr] no Tauri IPC detected — interview harness active");
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
    console.error("[supertaskr] the interview event subscription was refused", err);
  }
}

// ---- the UI's own half --------------------------------------------------

/** The half of the interview's state the STORE does not hold. */
export interface InterviewUiState {
  /** Answers the user sent that a command accepted, by turn number. */
  userHalves: ReadonlyMap<number, string>;
  /** A send or start is in flight from THIS side, set SYNCHRONOUSLY. */
  busy: boolean;
  /**
   * THE TURN NUMBER OF THE LAST START OR SEND A COMMAND ACCEPTED (T-171),
   * or null when none has been.
   *
   * It is a TYPED OUTCOME's own field, never a guess: `started { turn }`
   * and `accepted { turn }` both carry it, and nothing else writes here.
   *
   * WHY IT IS NOT `userHalves`' HIGHEST KEY, which carries the same number
   * for a send: `userHalves` means "answers the human typed", turn 1 has
   * no such answer (the kickoff is machine-assembled), and giving one
   * field two meanings is how the store and the UI end up disagreeing
   * about whether the interview is live — the split-brain T-027 §1 spent
   * its length arguing against.
   *
   * WHAT IT IS FOR: `flightOf` needs to know WHICH turn a claim of flight
   * is about, so that a claim about a turn that has since settled can be
   * refused. Without it, the gap between an accepted answer and its
   * `started` event is indistinguishable from a stranded flag, and the
   * screen must either flicker after every answer or lie forever.
   */
  awaiting: number | null;
  /** The last non-accepted outcome worth showing, or null. */
  notice: StartOutcomePayload | SendOutcomePayload | null;
}

const EMPTY_UI: InterviewUiState = {
  userHalves: new Map(),
  busy: false,
  awaiting: null,
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
 * Is a turn in flight, and WHY (T-171) — the screen's one reading, joined
 * from the two states that hold the evidence.
 *
 * THE FLAGS ARE STILL BOTH READ and neither is sufficient, which was true
 * before this task and is still true: `sendGenesisTurn` sets `sending`
 * only after `invoke` RESOLVES, so between the keypress and the answer
 * the store still reads "idle" — and a burst of ⏎ presses would each pass
 * the store's guard and each reach a command. The synchronous latch
 * closes exactly that window. The `disabled` attribute is not the guard
 * either: a keydown can be delivered between state updates, so the ⏎
 * handler re-checks `interviewBusy` before calling.
 *
 * WHAT CHANGED IS WHO HAS THE LAST WORD. This used to BE
 * `ui.busy || isTurnInFlight(genesis)` — a disjunction of three flags in
 * which the store's `phase` could outlive the turn it described and
 * nothing could contradict it. `flightOf` takes the same three flags and
 * puts the runner's own per-turn `status` in front of them, so a claim
 * about a turn that has landed and settled is refused. The full argument,
 * with the walk it was measured on, is on `flightOf`.
 */
export function interviewFlight(
  genesis: GenesisState,
  ui: InterviewUiState,
): FlightReading {
  return flightOf(genesis.turns, ui.busy, ui.awaiting, isTurnInFlight(genesis));
}

/** IS A TURN IN FLIGHT — the FACT, for everything that makes a claim
 * about the world: the hint slot, the completion reading, the ending.
 * `BoardCrescendo` reads it too, so the board pane's completion panel and
 * the chat's cannot disagree about whether the interview is over. */
export function interviewBusy(genesis: GenesisState, ui: InterviewUiState): boolean {
  return interviewFlight(genesis, ui).inFlight;
}

/**
 * WILL THE SEND PATH ACCEPT AN ANSWER — the MACHINERY, and a different
 * question from `interviewBusy` above (T-171).
 *
 * This is the OLD `interviewBusy` disjunction, kept verbatim and for
 * exactly one purpose: the `disabled` attributes and the focus-return
 * effect. Those must agree with the guard that will actually answer, and
 * that guard is `sendGenesisTurn`'s own `isTurnInFlight` — so a control
 * enabled against a store that is going to refuse is a button that eats
 * the answer, which is the same class of lie as the footer's, with the
 * arrow reversed.
 *
 * SPLITTING THE TWO IS THE FIX'S REAL CONTENT. One boolean used to answer
 * both — "is a turn running" and "will a send be taken" — and conflating
 * them is why a stranded `phase` could take the footer, every affordance
 * and the completion state down together. They agree in every healthy
 * state and disagree in exactly one: a claim of flight the turn evidence
 * has outlived, where the honest screen says the interview is complete
 * AND says the session is not taking another turn. Both are true.
 */
export function interviewLocked(genesis: GenesisState, ui: InterviewUiState): boolean {
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
    if (outcome.kind === "accepted") {
      recordUserHalf(outcome.turn, text);
      // T-171: the turn this send is about, from the outcome's own typed
      // field. Set BEFORE the `finally` releases the latch, so there is no
      // frame in which nothing claims the pending turn.
      setUi({ awaiting: outcome.turn });
    } else setUi({ notice: outcome });
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
    else setUi({ awaiting: outcome.turn });
    return outcome;
  } finally {
    setUi({ busy: false });
  }
}

/**
 * T-029 criterion 1: take the resume the registry offered.
 *
 * Shares `startInterview`'s latch and its `autoStarted` bookkeeping, so
 * the auto-start cannot fire on top of a resume the user just took.
 */
export async function resumeInterview(
  projectDir: string,
): Promise<StartOutcomePayload | null> {
  return takeStart(projectDir, resumeGenesis);
}

/** T-029 criterion 3: continue with a fresh session — degraded, never
 * dead. The banked docs are the record; only the conversation restarts. */
export async function freshInterview(
  projectDir: string,
): Promise<StartOutcomePayload | null> {
  return takeStart(projectDir, freshGenesis);
}

async function takeStart(
  projectDir: string,
  command: () => Promise<StartOutcomePayload | null>,
): Promise<StartOutcomePayload | null> {
  if (uiState.busy) return null;
  setUi({ busy: true, notice: null });
  try {
    const outcome = await command();
    if (outcome === null) return null;
    autoStarted.add(projectDir);
    if (outcome.kind !== "started") setUi({ notice: outcome });
    else {
      setUi({ awaiting: outcome.turn });
      void refreshGenesisTranscript();
    }
    return outcome;
  } finally {
    setUi({ busy: false });
  }
}

/**
 * T-029 criteria 1–2: pull the banked transcript into the store.
 *
 * Called on arrival rather than at app startup: this module is loaded
 * before a project is necessarily open, and `genesis_transcript` reads
 * the OPEN project. Asking early would ask about nothing.
 */
export async function rehydrateInterview(): Promise<void> {
  await refreshGenesisTranscript();
}

/** T-029 criterion 4: the hand-driven mode's assembled prompt. */
export async function loadKickoff(): Promise<KickoffOutcomePayload | null> {
  return genesisKickoff();
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

// ---- the local genesis clock (T-028, criteria 2 and 3) ------------------

/**
 * THE ELAPSED CLOCK IS DISPLAY-ONLY, EPHEMERAL, AND LOCAL. It exists in
 * this module and nowhere else: nothing writes it to disk, nothing sends
 * it anywhere, no command carries it, and no file records it. That is the
 * NORTH_STAR non-goal ("no telemetry home-phoning") held as a
 * construction rather than as a promise — there is simply no channel out
 * of this module for the number to take.
 *
 * THE ORIGIN, and its re-base rule, stated because a timer that lies
 * about what it measures is worse than no timer:
 *
 *   The origin is WHEN THIS APP SESSION FIRST PUT THE INTERVIEW ON SCREEN
 *   FOR THIS PROJECT — not when the planner process started, and not when
 *   the genesis folder was first opened on some earlier day.
 *
 *   So: an app RESTART re-bases the clock to zero, and a genesis resumed
 *   tomorrow reads the time since the app was reopened. That is a real
 *   limitation and it is deliberate — the only durable origin available
 *   would be a timestamp in `.supertaskr/`, which is state this task is
 *   fenced out of writing (ADR-017: the app renders what lands, the
 *   planner writes), and `genesis_status` carries `lastEventAtMs` but no
 *   first-event stamp. A REMOUNT inside one session does NOT re-base,
 *   because the origin lives here rather than in a component. A switch to
 *   a DIFFERENT genesis project DOES re-base, because the elapsed time of
 *   one interview is not a fact about another.
 *
 * The tick is one shared interval for however many subscribers there are,
 * started on the first subscribe and cleared on the last — the label's
 * granularity is a minute, so the interval is display refresh and not
 * polling: nothing is fetched, nothing is asked, no boundary is touched.
 */
export const ELAPSED_TICK_MS = 15_000;

let clockProject: string | null = null;
let clockStartedAtMs: number | null = null;
let clockNowMs = 0;
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | null = null;

function notifyClock(): void {
  for (const listener of clockListeners) listener();
}

/**
 * Start (or re-base) the clock for `projectDir`. Idempotent for the same
 * project: the FIRST stamp wins, so a remount keeps the original origin
 * and only a different project moves it.
 */
export function startGenesisClock(projectDir: string, atMs: number): void {
  if (clockStartedAtMs !== null && clockProject === projectDir) return;
  clockProject = projectDir;
  clockStartedAtMs = atMs;
  clockNowMs = atMs;
  notifyClock();
}

function subscribeClock(callback: () => void): () => void {
  clockListeners.add(callback);
  if (clockTimer === null) {
    clockTimer = setInterval(() => {
      clockNowMs = Date.now();
      notifyClock();
    }, ELAPSED_TICK_MS);
  }
  return () => {
    clockListeners.delete(callback);
    if (clockListeners.size === 0 && clockTimer !== null) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

/** Milliseconds since the origin, or `null` when no clock has started.
 * Stable between ticks, which is what `useSyncExternalStore` requires. */
function getElapsedMs(): number | null {
  if (clockStartedAtMs === null) return null;
  return Math.max(clockNowMs - clockStartedAtMs, 0);
}

/** The elapsed slot's source. `null` until a clock starts. */
export function useGenesisElapsedMs(): number | null {
  return useSyncExternalStore(subscribeClock, getElapsedMs, getElapsedMs);
}

/** Test-only reset (this module is a singleton, like the store). */
export function __resetInterviewSourceForTests(): void {
  twinState = emptyGenesisState();
  twinListeners.clear();
  uiState = EMPTY_UI;
  uiListeners.clear();
  sendLedger.length = 0;
  autoStarted.clear();
  clockProject = null;
  clockStartedAtMs = null;
  clockNowMs = 0;
  clockListeners.clear();
  if (clockTimer !== null) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
}
