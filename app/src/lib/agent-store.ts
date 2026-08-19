import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

/**
 * T-025 (C-14's TS half): typed mirrors of the agent runner's four
 * commands and its one event channel, plus a pure reducer over the event
 * stream.
 *
 * NO UI LIVES HERE. T-027 builds the chat; this file is the store it
 * consumes, in the shape `watcher-store.ts` established: pure reducers
 * exported and unit-tested, thin `invoke` wrappers around them, and a
 * `subscribe`/`getState` pair for `useSyncExternalStore`.
 *
 * The boundary discipline, restated because this is the module the
 * webview talks to: three of the four commands take NO arguments at all,
 * and the fourth takes exactly one datum — the user's own typed answer.
 * No path, no binary, no flag, no adapter selector, and no model name
 * ever crosses from this side. The adapter table lives Rust-side as
 * const data (ADR-012/ADR-017).
 *
 * Model output is DATA: every text field below is untrusted content
 * produced by a model, to be rendered as text nodes and never as markup
 * or a command (ADR-009's discipline; T-027 owns its rendering).
 */

// ---- mirrors of the Rust types -----------------------------------------

/** Mirror of Rust's `TurnError` (src-tauri/src/agent/runner.rs). */
export type TurnErrorPayload =
  | { kind: "spawnFailed"; os: string }
  | { kind: "startTimeout" }
  | { kind: "stall" }
  /** The CLI's own stderr tail — the residual class, after T-029's
   * classification has taken the two failures the stream NAMES. */
  | { kind: "exitNonZero"; code: number | null; stderrTail: string }
  | { kind: "malformedStream"; why: string }
  /** T-029: the CLI could not authenticate, and said so in band. The one
   * action that helps is `claude auth login` (T-082 — it read `claude
   * login` here until then, which the CLI parses as a PROMPT rather than
   * as a command), and the hand-driven fallback works right now with no
   * login at all. */
  | { kind: "authFailed"; status: number | null; message: string }
  /** T-029 (T-025-s1): a tool the planner needed was refused. Named, so
   * the screen can say WHICH instead of showing an exit code. */
  | { kind: "toolDenied"; denials: readonly string[]; terminalReason: string | null }
  /** T-029 (T-039-s3): a session id was refused at either gate. Its own
   * envelope, because "start fresh" is its remedy and is not the remedy
   * for a truncated stream line. */
  | { kind: "rejectedSessionId"; why: string };

/** Mirror of Rust's `RunEvent` — the `genesis-turn` channel's payloads.
 * Every one carries `seq` from one runner-owned counter, so the store
 * stale-drops exactly like docs snapshots do. */
export type GenesisEvent =
  | { kind: "started"; seq: number; turn: number }
  | { kind: "textDelta"; seq: number; turn: number; text: string }
  | { kind: "activity"; seq: number; turn: number; label: string }
  | {
      kind: "completed";
      seq: number;
      turn: number;
      text: string;
      truncatedRelay: boolean;
    }
  | { kind: "failed"; seq: number; turn: number; error: TurnErrorPayload }
  | { kind: "sessionRegistered"; seq: number; nativeSessionId: string };

/** Mirror of Rust's `StartOutcome`. */
export type StartOutcomePayload =
  | { kind: "started"; turn: number }
  | { kind: "busy" }
  | { kind: "noProject" }
  | { kind: "alreadyPlanned"; path: string }
  /** A planner session is already recorded for this project. Start never
   * auto-resumes; the screen renders the choice and `resumeGenesis`
   * takes it. `model` comes through the registry's READ boundary, so
   * `null` also means "recorded, but not a usable name" (T-047-s3). */
  | {
      kind: "resumeAvailable";
      nativeSessionId: string;
      turns: number;
      model: string | null;
    }
  /** Never a dead end — T-029 renders the hand-driven fallback. */
  | { kind: "cliNotFound"; probed: string[] }
  | { kind: "unsupportedVersion"; found: string }
  /** T-029 (T-039-s3): the recorded id is unusable. Routed to "your
   * saved session is unusable — start fresh", which it could not be
   * while it shared `error` with "the registry could not be written". */
  | { kind: "sessionIdRejected"; registryPath: string; why: string }
  /** T-029: asked to resume with nothing recorded to resume from. */
  | { kind: "nothingToResume" }
  | { kind: "error"; message: string };

/** Mirror of Rust's `KickoffOutcome` — ADR-006's hand-driven mode. */
export type KickoffOutcomePayload =
  | {
      kind: "ready";
      prompt: string;
      projectDir: string;
      kitRoot: string;
      methodVersion: string;
      resuming: boolean;
    }
  | { kind: "noProject" }
  | { kind: "alreadyPlanned"; path: string }
  | { kind: "error"; message: string };

/** Mirror of Rust's `TranscriptLine` — one banked protocol half-turn.
 * LOSABLE BY CHARTER: an empty list is not an error. */
export interface TranscriptLinePayload {
  turn: number;
  /** `"user"` or `"planner"`. */
  role: string;
  text: string;
  atMs: number;
  /**
   * This half-turn was ASSEMBLED BY THE APP — a kickoff, or a resume
   * nudge — not typed by the human. Omitted on the wire when false, so a
   * transcript written by a pre-T-029 build parses with it absent, which
   * is why the type is optional and every read compares against `true`.
   */
  machine?: boolean;
}

/** Mirror of Rust's `SendOutcome`. */
export type SendOutcomePayload =
  | { kind: "accepted"; turn: number }
  | { kind: "busy" }
  | { kind: "noSession" }
  | { kind: "staleProject"; sessionProject: string }
  | { kind: "cliNotFound"; probed: string[] }
  | { kind: "error"; message: string };

/** Mirror of Rust's `CancelOutcome`. */
export type CancelOutcomePayload =
  | { kind: "cancelled"; turn: number }
  | { kind: "idle" };

export type GenesisPhase = "idle" | "running" | "failed";

/** Mirror of Rust's `GenesisStatus` — the mount-time catch-up pull. */
export interface GenesisStatusPayload {
  phase: GenesisPhase;
  projectDir: string | null;
  turn: number;
  nativeSessionId: string | null;
  cliVersion: string | null;
  methodVersion: string;
  lastError: TurnErrorPayload | null;
  lastEventAtMs: number | null;
}

// ---- the state the pane renders ----------------------------------------

/** One turn's live text, as the deltas arrive and after it settles. */
export interface GenesisTurn {
  turn: number;
  /** Accumulated `textDelta` text. Replaced by the canonical `completed`
   * text when the turn lands — the result line is the deterministic
   * record; deltas are a preview of it. */
  text: string;
  /** Tool markers seen this turn, in order, deduped consecutively. */
  activity: string[];
  status: "running" | "completed" | "failed" | "cancelled";
  /** True when the runner stopped relaying deltas at its 1 MiB cap. */
  truncatedRelay: boolean;
  error: TurnErrorPayload | null;
}

export interface GenesisState {
  phase: GenesisPhase;
  /** Highest `seq` applied. Anything at or below it is stale. */
  seq: number;
  turns: GenesisTurn[];
  nativeSessionId: string | null;
  /** A turn is in flight from THIS side (the Rust latch is the real
   * gate — T-021's pattern, mirrored here so the send box can disable). */
  sending: boolean;
  lastError: TurnErrorPayload | null;
  lastEventAtMs: number | null;
  /** Last non-terminal outcome worth showing (busy/noProject/…), or the
   * `resumeAvailable`/`cliNotFound` answers T-029 renders. */
  lastOutcome: StartOutcomePayload | SendOutcomePayload | null;
  methodVersion: string | null;
  cliVersion: string | null;
  projectDir: string | null;
  /**
   * T-029 (T-027-s2): THE TURN CHANNEL IS NOT OPEN.
   *
   * `startGenesisListener` awaits `listen("genesis-turn")`, and
   * `startInterviewSource` wraps that in a try/catch — it must, because
   * an unhandled rejection at the app root is what T-050 spent a task
   * removing. But the whole user-visible response was a `console.error`:
   * the screen rendered normally, the input was enabled, "Start the
   * interview" worked, `genesis_start` reported `started { turn: 1 }`,
   * the planner really ran and really wrote into `docs/`, the RIGHT half
   * showed the files landing — **and the left half stayed empty forever
   * with no explanation.**
   *
   * IT LIVES ON THE STORE, not in the source module, and that placement
   * is the point. A flag private to `interview-source.ts` would let the
   * store and the UI disagree about whether the interview is live, which
   * is the split-brain T-027 §1 spent its length arguing against.
   *
   * The chat renders it as the existing inline-notice treatment.
   */
  listenerFailed: boolean;
  /** Rehydrated planner/user halves from `.nputer/genesis/transcript.jsonl`
   * (T-029 criteria 1–2). Empty is the ordinary case AND the
   * cache-is-gone case: the chat renders banked progress instead. */
  rehydrated: readonly TranscriptLinePayload[];
}

export function emptyGenesisState(): GenesisState {
  return {
    phase: "idle",
    seq: 0,
    turns: [],
    nativeSessionId: null,
    sending: false,
    lastError: null,
    lastEventAtMs: null,
    lastOutcome: null,
    methodVersion: null,
    cliVersion: null,
    projectDir: null,
    listenerFailed: false,
    rehydrated: [],
  };
}

// ---- pure reducers (unit-tested in test/agent-store.test.ts) ------------

function upsertTurn(
  turns: GenesisTurn[],
  turn: number,
  patch: (previous: GenesisTurn) => GenesisTurn,
): GenesisTurn[] {
  const index = turns.findIndex((t) => t.turn === turn);
  const previous: GenesisTurn =
    index >= 0
      ? turns[index]!
      : {
          turn,
          text: "",
          activity: [],
          status: "running",
          truncatedRelay: false,
          error: null,
        };
  const next = patch(previous);
  if (index < 0) return [...turns, next];
  const copy = turns.slice();
  copy[index] = next;
  return copy;
}

/**
 * Apply one `genesis-turn` event. Returns `prev` BY IDENTITY when the
 * event is stale or duplicate, so callers skip re-renders — the same
 * contract `reduceDocs` has, and for the same reason: the Rust seq
 * counter is monotonic, so a late delivery is provably old.
 */
export function reduceGenesisEvent(
  prev: GenesisState,
  event: GenesisEvent,
): GenesisState {
  if (event.seq <= prev.seq) return prev;
  const base: GenesisState = {
    ...prev,
    seq: event.seq,
    lastEventAtMs: Date.now(),
  };
  switch (event.kind) {
    case "started":
      return {
        ...base,
        phase: "running",
        sending: true,
        lastError: null,
        turns: upsertTurn(prev.turns, event.turn, (t) => ({
          ...t,
          status: "running",
          error: null,
        })),
      };
    case "textDelta":
      return {
        ...base,
        turns: upsertTurn(prev.turns, event.turn, (t) => ({
          ...t,
          text: t.text + event.text,
        })),
      };
    case "activity":
      return {
        ...base,
        turns: upsertTurn(prev.turns, event.turn, (t) =>
          t.activity[t.activity.length - 1] === event.label
            ? t
            : { ...t, activity: [...t.activity, event.label] },
        ),
      };
    case "completed":
      return {
        ...base,
        phase: "idle",
        sending: false,
        turns: upsertTurn(prev.turns, event.turn, (t) => ({
          ...t,
          // The `result` line is canonical; the deltas were a preview.
          text: event.text,
          truncatedRelay: event.truncatedRelay,
          status: "completed",
          error: null,
        })),
      };
    case "failed":
      return {
        ...base,
        phase: "failed",
        sending: false,
        lastError: event.error,
        turns: upsertTurn(prev.turns, event.turn, (t) => ({
          ...t,
          status: "failed",
          error: event.error,
        })),
      };
    case "sessionRegistered":
      return { ...base, nativeSessionId: event.nativeSessionId };
  }
}

/** Fold the mount-time status pull into the state (the `docs_snapshot`
 * precedent: a late-mounting pane catches up without replaying events).
 * Never rewinds `seq`, and never invents turn text it did not see. */
export function applyGenesisStatus(
  prev: GenesisState,
  status: GenesisStatusPayload,
): GenesisState {
  return {
    ...prev,
    phase: status.phase,
    nativeSessionId: status.nativeSessionId,
    lastError: status.lastError,
    lastEventAtMs: status.lastEventAtMs ?? prev.lastEventAtMs,
    methodVersion: status.methodVersion,
    cliVersion: status.cliVersion,
    projectDir: status.projectDir,
    sending: status.phase === "running",
  };
}

/** Apply a start/send outcome. Only `started`/`accepted` arm the
 * in-flight gate; everything else is a message, and `prev` comes back by
 * identity when there is nothing to say. */
export function reduceGenesisOutcome(
  prev: GenesisState,
  outcome: StartOutcomePayload | SendOutcomePayload,
): GenesisState {
  switch (outcome.kind) {
    case "started":
    case "accepted":
      return { ...prev, sending: true, phase: "running", lastOutcome: null };
    default:
      return { ...prev, lastOutcome: outcome };
  }
}

/** Is a turn currently in flight (the send box's disabled state)? */
export function isTurnInFlight(state: GenesisState): boolean {
  return state.sending || state.phase === "running";
}

// ---- store --------------------------------------------------------------

const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

let state: GenesisState = emptyGenesisState();
const listeners = new Set<() => void>();
let started = false;

export function subscribeGenesis(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getGenesisState(): GenesisState {
  return state;
}

function setState(next: GenesisState): void {
  if (next === state) return;
  state = next;
  for (const callback of listeners) callback();
}

/**
 * Subscribe to `genesis-turn` and pull the current status once. Safe to
 * call repeatedly (StrictMode double-effects); the seq guard settles any
 * ordering race between the subscription and the pull.
 *
 * A REFUSED SUBSCRIPTION BECOMES STATE, then rethrows (T-029, T-027-s2).
 * Both halves matter: the flag is what the chat renders, and the rethrow
 * keeps `startInterviewSource`'s existing `console.error` — the caller's
 * catch is still the thing that stops an unhandled rejection reaching the
 * app root, which is not this function's job to take over.
 *
 * The latch is RELEASED on failure, so a later call genuinely re-tries
 * instead of returning early over a channel that was never opened —
 * T-050's stranding lesson, applied to this door.
 */
export async function startGenesisListener(): Promise<void> {
  if (started || !isTauri) return;
  started = true;
  try {
    await listen<GenesisEvent>("genesis-turn", (event) => {
      setState(reduceGenesisEvent(state, event.payload));
    });
  } catch (err) {
    started = false;
    setState({ ...state, listenerFailed: true });
    throw err;
  }
  if (state.listenerFailed) setState({ ...state, listenerFailed: false });
  await refreshGenesisStatus();
}

/** Zero arguments cross the boundary: Rust assembles the kickoff from the
 * compiled-in method snapshot and the open project. */
export async function startGenesis(): Promise<StartOutcomePayload | null> {
  if (!isTauri || isTurnInFlight(state)) return null;
  try {
    const outcome = await invoke<StartOutcomePayload>("genesis_start");
    setState(reduceGenesisOutcome(state, outcome));
    return outcome;
  } catch (err) {
    const outcome: StartOutcomePayload = { kind: "error", message: String(err) };
    setState(reduceGenesisOutcome(state, outcome));
    return outcome;
  }
}

/** The user's own typed answer — the only datum this side ever sends. It
 * is passed as data and lands on the child's stdin; it is never part of a
 * command line. */
export async function sendGenesisTurn(
  text: string,
): Promise<SendOutcomePayload | null> {
  if (!isTauri || isTurnInFlight(state)) return null;
  try {
    const outcome = await invoke<SendOutcomePayload>("genesis_send_turn", {
      text,
    });
    setState(reduceGenesisOutcome(state, outcome));
    return outcome;
  } catch (err) {
    const outcome: SendOutcomePayload = { kind: "error", message: String(err) };
    setState(reduceGenesisOutcome(state, outcome));
    return outcome;
  }
}

/** Kill the current turn's process group. The NATIVE session survives:
 * the kill is of the turn, not the conversation. */
export async function cancelGenesis(): Promise<CancelOutcomePayload | null> {
  if (!isTauri) return null;
  try {
    const outcome = await invoke<CancelOutcomePayload>("genesis_cancel");
    if (outcome.kind === "cancelled") {
      setState({
        ...state,
        sending: false,
        phase: "idle",
        turns: state.turns.map((t) =>
          t.turn === outcome.turn && t.status === "running"
            ? { ...t, status: "cancelled" }
            : t,
        ),
      });
    }
    return outcome;
  } catch {
    return null;
  }
}

/**
 * T-029 criterion 1: respawn the RECORDED native session. Zero arguments
 * — the id lives in `.nputer/sessions.json` and is read Rust-side through
 * its own gate, so no session id crosses the boundary in either
 * direction. Same shape as `startGenesis`, deliberately: the two are one
 * choice on the same screen and their outcomes are the same type.
 */
export async function resumeGenesis(): Promise<StartOutcomePayload | null> {
  return startLike(() => invoke<StartOutcomePayload>("genesis_resume"));
}

/** T-029 criterion 3: continue with a fresh session — degraded, never
 * dead. The recorded session is marked abandoned Rust-side and the new
 * kickoff carries the method's resume rule. */
export async function freshGenesis(): Promise<StartOutcomePayload | null> {
  return startLike(() => invoke<StartOutcomePayload>("genesis_fresh"));
}

/**
 * The guard + fold both start-like commands share.
 *
 * IT TAKES A THUNK RATHER THAN A COMMAND NAME, and that is a deliberate
 * concession to a GATE rather than a style preference: passing the name
 * as a variable would hide both commands from the frontend command scan
 * in `crescendo-dom.test.tsx`, which greps for a command name spelled
 * out at an invoke call site. `runPicker`'s three are already invisible
 * to it for exactly that reason and have to be asserted Rust-side
 * instead. Spelling the names at the call sites above keeps the scan
 * able to see an eleventh command appear.
 */
async function startLike(
  run: () => Promise<StartOutcomePayload>,
): Promise<StartOutcomePayload | null> {
  if (!isTauri || isTurnInFlight(state)) return null;
  try {
    const outcome = await run();
    setState(reduceGenesisOutcome(state, outcome));
    return outcome;
  } catch (err) {
    const outcome: StartOutcomePayload = { kind: "error", message: String(err) };
    setState(reduceGenesisOutcome(state, outcome));
    return outcome;
  }
}

/**
 * T-029 criteria 1–2: pull the banked transcript and fold it into the
 * state the chat renders.
 *
 * LOSABLE BY CHARTER, and this is where that is honoured: a refused
 * invoke, a missing file and a file of pure garbage all land the same
 * empty list, and none of them is an error. The chat renders
 * banked-progress from `docs/` in its place, which is the only source
 * that was ever project truth.
 */
export async function refreshGenesisTranscript(): Promise<
  readonly TranscriptLinePayload[]
> {
  if (!isTauri) return [];
  try {
    const lines = await invoke<TranscriptLinePayload[]>("genesis_transcript");
    // The boundary answered with something that is not a list. Same
    // discipline as every other outcome in this file: what comes back
    // over IPC is checked before it becomes state, so a command that
    // answers `undefined` degrades to "no history" rather than to a
    // TypeError inside a render.
    const safe = Array.isArray(lines) ? lines : [];
    setState({ ...state, rehydrated: safe });
    return safe;
  } catch {
    return [];
  }
}

/** T-029 criterion 4: the hand-driven mode's assembled kickoff. Not
 * stored — it is read once, when the fallback renders, and it is a
 * prompt rather than interview state. */
export async function genesisKickoff(): Promise<KickoffOutcomePayload | null> {
  if (!isTauri) return null;
  try {
    return await invoke<KickoffOutcomePayload>("genesis_kickoff");
  } catch (err) {
    return { kind: "error", message: String(err) };
  }
}

export async function refreshGenesisStatus(): Promise<GenesisStatusPayload | null> {
  if (!isTauri) return null;
  try {
    const status = await invoke<GenesisStatusPayload>("genesis_status");
    setState(applyGenesisStatus(state, status));
    return status;
  } catch {
    return null;
  }
}

/** Test-only reset (the store is a module singleton). */
export function __resetGenesisStoreForTests(): void {
  state = emptyGenesisState();
  listeners.clear();
  started = false;
}
