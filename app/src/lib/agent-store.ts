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

/**
 * T-081: ONE PERMISSION DENIAL, AS THE USER LEARNS OF IT.
 *
 * Mirror of the payload on Rust's `RunEvent::Denied`. Every field is
 * nullable-or-empty on purpose: a denial the app cannot fully describe is
 * not a denial the user should be denied. `toolName` is null when the
 * CLI's line did not name a tool; `message` is empty when it offered no
 * explanation, which is exactly how a denial recovered from the
 * cumulative `result` line arrives — that line carries `tool_input`,
 * never a message.
 *
 * `toolUseId` is the JOIN KEY the runner uses to report one denial once
 * when it arrives on both channels. It is NOT re-joined here: the join
 * has one owner, Rust-side, and a second implementation of a rule is two
 * chances to disagree about it.
 *
 * Model-adjacent DATA, like every other text field in this file —
 * rendered as text nodes, never as markup or a command.
 */
export interface GenesisDenial {
  toolName: string | null;
  toolUseId: string | null;
  message: string;
}

/** Mirror of Rust's `RunEvent` — the `genesis-turn` channel's payloads.
 * Every one carries `seq` from one runner-owned counter, so the store
 * stale-drops exactly like docs snapshots do. */
export type GenesisEvent =
  | { kind: "started"; seq: number; turn: number }
  | { kind: "textDelta"; seq: number; turn: number; text: string }
  | { kind: "activity"; seq: number; turn: number; label: string }
  /** T-081: a tool was refused, and the user hears about it NOW rather
   * than when the turn ends. **This is not a failure event** — the
   * observed 2.1.226 turn carried two denials and still completed, and
   * the denials were roughly forty seconds ahead of the result. */
  | ({ kind: "denied"; seq: number; turn: number } & GenesisDenial)
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

/**
 * Mirror of Rust's `GenesisRecord` — THE FACT THAT AN INTERVIEW WAS
 * RUNNING ON THIS FOLDER, derived from `.nputer/sessions.json` and from
 * nowhere else.
 *
 * Runtime state in the user's own project directory, losable by charter:
 * its absence is an answer ("nothing was ever running here"), never an
 * error. `nativeSessionId` and `model` are `null` also when the recorded
 * value was REFUSED at the registry's read boundary, which is why
 * `sessionIdRejected` is a separate field rather than an inference.
 */
export interface GenesisRecordPayload {
  registryId: string;
  turns: number;
  status: string;
  created: string;
  nativeSessionId: string | null;
  model: string | null;
  sessionIdRejected: string | null;
}

/** Mirror of Rust's `KickoffOutcome` — ADR-006's hand-driven mode. */
export type KickoffOutcomePayload =
  | {
      kind: "ready";
      prompt: string;
      projectDir: string;
      kitRoot: string;
      methodVersion: string;
      resuming: boolean;
      /**
       * T-070: what was already banked in this folder, on the ONE
       * genesis command that resolves no CLI. `null` when no interview
       * was ever running here.
       *
       * OPTIONAL ON THE WIRE ON PURPOSE. Rust always sends the key, but
       * this payload also arrives from a pre-T-070 build's `invoke` in
       * a mixed-version dev tree, and every reader here already treats a
       * missing record and a null one identically — the same discipline
       * `TranscriptLinePayload.machine` uses one field up.
       */
      record?: GenesisRecordPayload | null;
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
  /**
   * T-081: the tools this turn was REFUSED, in the order the user was
   * told about them.
   *
   * Not deduped and not filtered: the real CLI refused `Bash` twice in
   * one observed turn — a compound command whose sub-commands were not
   * all covered, and a `cp` with a glob — so two entries naming one tool
   * is the ordinary case, not a bug. `toolUseId` is what tells them
   * apart, and the runner has already used it to make sure each denial
   * appears here exactly once.
   *
   * **A NON-EMPTY LIST SAYS NOTHING ABOUT HOW THE TURN ENDS.** The turn
   * this shape was transcribed from carried two denials and completed
   * successfully; the planner decomposed the refused command and carried
   * on. Read `status` for the outcome.
   */
  denials: readonly GenesisDenial[];
  status: "running" | "completed" | "failed" | "cancelled";
  /** True when the runner stopped relaying deltas at its 1 MiB cap. */
  truncatedRelay: boolean;
  error: TurnErrorPayload | null;
}

/**
 * T-184: A CLAIM OF FLIGHT THIS STORE REFUSED, and the measurement that
 * outranked it.
 *
 * A refused claim is RECORDED rather than dropped. A silent drop and a
 * claim that never arrived are indistinguishable to the next reader, and
 * this store's whole defect was a state nothing named; the field is
 * non-fatal by construction — nothing renders it and nothing branches on
 * it — so it can only ever add an explanation, never a behaviour.
 */
export interface StaleFlightClaim {
  /** The turn the refused claim was about. */
  turn: number;
  /** That turn's own status at the moment of refusal — the runner's
   * measurement, which is what outranked the claim. */
  status: GenesisTurn["status"];
  /** Which arming site refused it: a command's own answer, or the
   * mount-time status pull. */
  from: "outcome" | "status";
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
  /**
   * T-184: the last claim of flight this store REFUSED, or null. Never
   * read by the screen — it exists so a refusal is a named event in the
   * state rather than a silent nothing.
   */
  staleFlightClaim: StaleFlightClaim | null;
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
    staleFlightClaim: null,
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
          denials: [],
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
    case "denied":
      // APPEND, never replace, and never touch `status`: a denial is a
      // thing that HAPPENED to the turn, not a verdict on it. The runner
      // has already joined the two channels, so what arrives here is one
      // denial one time.
      return {
        ...base,
        turns: upsertTurn(prev.turns, event.turn, (t) => ({
          ...t,
          denials: [
            ...t.denials,
            {
              toolName: event.toolName,
              toolUseId: event.toolUseId,
              message: event.message,
            },
          ],
        })),
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

// ---- the sequence guard (T-184) -----------------------------------------

/**
 * THE TURN A CLAIM OF FLIGHT IS ABOUT, WHEN THAT TURN HAS ALREADY
 * SETTLED — otherwise null (T-184).
 *
 * THE DEFECT, STATED EXACTLY. Two sites below ARM flight: a command's
 * own `started`/`accepted` answer, and the mount-time status pull. Both
 * name the turn they are about — `started { turn }`, `accepted { turn }`
 * and `GenesisStatus.turn` are typed fields, not guesses — and neither
 * used to look at it. So an answer that resolves AFTER its turn's own
 * events, or a status pull assembled before the turn landed, puts the
 * store into a flight nothing can take it out of: the events that would
 * clear it have already been applied, and `reduceGenesisEvent` drops
 * anything at or below the seq watermark. It is not theoretical — it
 * stranded T-171's first DOM fixture, which is how it was found.
 *
 * THE TOKEN IS THE ONE THE SCREEN ALREADY TRUSTS, and deliberately not a
 * second one. `flightOf` (`src/genesis/crescendo.ts`, T-171) refuses a
 * claim by looking up the turn it names and asking whether the runner's
 * own per-turn `status` has moved off `running`. This is that same
 * inference, moved from the render side to the ARMING side, over the
 * same field of the same record. A seq counter would have been a second
 * source of truth for one question, which is T-057's rule; a turn number
 * alone would not have been enough, because a turn number says WHICH
 * turn and not whether it is still live.
 *
 * WHY A SETTLED TURN AND NOT MERELY A KNOWN ONE. A claim about a turn
 * that is still `running` is exactly right and must arm — that is the
 * ordinary case, and the window between an accepted answer and its
 * `started` event is a real one the screen has a name for (`unlanded`).
 * An UNKNOWN turn must arm too: no evidence is not contrary evidence,
 * and refusing there would break every first turn, whose answer
 * routinely beats its own `started` event off a runner thread.
 *
 * Pure: no clock, no store read, no IO.
 */
export function settledTurn(
  turns: readonly GenesisTurn[],
  turn: number,
): GenesisTurn | null {
  const landed = turns.find((t) => t.turn === turn);
  return landed !== undefined && landed.status !== "running" ? landed : null;
}

/** Fold the mount-time status pull into the state (the `docs_snapshot`
 * precedent: a late-mounting pane catches up without replaying events).
 * Never rewinds `seq`, and never invents turn text it did not see.
 *
 * T-184: THE ARMING HALF OF THE PULL IS GUARDED AND THE REST IS NOT, and
 * the asymmetry is the point. A status that says `idle` or `failed`
 * DISARMS, and a disarming claim needs no evidence — it can only ever
 * release a screen, never strand one, so it is applied unconditionally
 * exactly as before. A status that says `running` over a turn this store
 * has already watched settle is refused, and the phase and the send gate
 * are left where the turn's own events put them. Nothing else in the
 * fold moves: the session id, the version strings and the project dir
 * are catch-up data, not a claim about flight, and widening the guard
 * onto them would be a different change with a different risk. */
export function applyGenesisStatus(
  prev: GenesisState,
  status: GenesisStatusPayload,
): GenesisState {
  const outlived =
    status.phase === "running" ? settledTurn(prev.turns, status.turn) : null;
  return {
    ...prev,
    phase: outlived ? prev.phase : status.phase,
    nativeSessionId: status.nativeSessionId,
    lastError: status.lastError,
    lastEventAtMs: status.lastEventAtMs ?? prev.lastEventAtMs,
    methodVersion: status.methodVersion,
    cliVersion: status.cliVersion,
    projectDir: status.projectDir,
    sending: outlived ? prev.sending : status.phase === "running",
    staleFlightClaim: outlived
      ? { turn: outlived.turn, status: outlived.status, from: "status" }
      : prev.staleFlightClaim,
  };
}

/** Apply a start/send outcome. Only `started`/`accepted` arm the
 * in-flight gate; everything else is a message, and `prev` comes back by
 * identity when there is nothing to say.
 *
 * T-184: AND AN ARMING ANSWER IS CHECKED AGAINST ITS OWN TURN FIRST.
 * `await invoke(…)` gives no ordering guarantee against the event
 * channel, so `accepted { turn: 3 }` can land after turn 3 has already
 * completed. Such an answer is refused and RECORDED on
 * `staleFlightClaim` rather than dropped — it is not an error, nothing
 * renders it, and `lastOutcome` is deliberately left alone: a refused
 * `accepted` is not a notice the user needs, and writing one would put
 * "accepted" in the screen's notice slot, which reads as a failure
 * report for a turn that succeeded. */
export function reduceGenesisOutcome(
  prev: GenesisState,
  outcome: StartOutcomePayload | SendOutcomePayload,
): GenesisState {
  switch (outcome.kind) {
    case "started":
    case "accepted": {
      const outlived = settledTurn(prev.turns, outcome.turn);
      if (outlived) {
        return {
          ...prev,
          staleFlightClaim: {
            turn: outlived.turn,
            status: outlived.status,
            from: "outcome",
          },
        };
      }
      return { ...prev, sending: true, phase: "running", lastOutcome: null };
    }
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

// ---- the liveness bound (T-184) -----------------------------------------

/**
 * HOW LONG A FLIGHT-ARMING COMMAND MAY GO WITHOUT ANSWERING AT ALL,
 * before this side stops waiting and answers for it. Milliseconds.
 *
 * WHY THIS EXISTS. A rejected `invoke` is already handled — every
 * wrapper below catches it. A promise that NEVER SETTLES is not: the
 * `await` never returns, so no outcome is ever folded, and
 * `sendAnswer`'s `finally` in `src/genesis/interview-source.ts` never
 * releases the synchronous latch it took before the call. `flightOf`
 * then reads `latched` forever and says a turn is in flight — correctly,
 * because nothing on the render side can know better. T-171 named that
 * case at `flightOf`'s own site and routed it here, to `app-agent`,
 * which is where the command lives. THE FIX FOR A COMMAND THAT NEVER
 * ANSWERS IS A BOUND, NOT A GUARD: there is no stale evidence to weigh,
 * only an absence, and the only honest repair is to stop waiting.
 *
 * WHERE THE NUMBER COMES FROM, so it is derived rather than picked.
 * These commands do not wait for the turn — the runner spawns it on a
 * thread and answers as soon as it is accepted. The one bounded blocking
 * step inside a command's own body is the login-shell CLI probe, which
 * `genesis_start`'s doc comment in `src-tauri/src/lib.rs` names and
 * which `AgentConfig`'s `probe_timeout` in `src-tauri/src/agent/
 * runner.rs` sets to ten seconds; everything else is in-memory state or
 * local filesystem work. Thirty seconds is three times that one bounded
 * step, and it is also the runner's own longest single deadline
 * (`start_timeout`) — so this side never gives up before the Rust side
 * has had its full budget for anything it bounds. A healthy command
 * answers in milliseconds and never comes near it.
 *
 * IT IS DELIBERATELY GENEROUS. The failure it converts is INFINITE, so
 * the cost of being too slow is one waiting user and the cost of being
 * too fast is a spurious refusal of a command that was going to succeed.
 */
export const COMMAND_ANSWER_BOUND_MS = 30_000;

/** The message a bounded command answers with. One spelling, so the two
 * outcome types cannot drift apart about what happened. */
export const UNANSWERED_COMMAND_MESSAGE =
  "The app did not answer within 30 seconds. Nothing was lost — the " +
  "interview is still where it was, and you can try again.";

/** The answer this side gives on behalf of a command that did not.
 * `error` is a member of BOTH outcome unions, so one shape serves the
 * start-like commands and the send. */
function unansweredCommand(): { kind: "error"; message: string } {
  return { kind: "error", message: UNANSWERED_COMMAND_MESSAGE };
}

/**
 * Run one command under {@link COMMAND_ANSWER_BOUND_MS}, answering with
 * `onUnanswered()` if it does not answer first.
 *
 * A REJECTION IS NOT AN ABSENCE and passes straight through, so every
 * caller's existing `catch` keeps its exact meaning. The timer is
 * cleared on every exit — answered, unanswered or thrown — because a
 * dangling thirty-second timer per command would hold a process open and
 * make the bound observable in a way it should not be.
 *
 * `boundMs` is a parameter so a body can drive it; it is NOT how the
 * shipped call sites spell it, and the constant above is pinned by its
 * own literal (T-063: a test parametrised by the constant it checks
 * cannot pin that constant).
 */
export async function withAnswerBound<T>(
  run: () => Promise<T>,
  onUnanswered: () => T,
  boundMs: number = COMMAND_ANSWER_BOUND_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      run(),
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(onUnanswered()), boundMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** Zero arguments cross the boundary: Rust assembles the kickoff from the
 * compiled-in method snapshot and the open project. */
export async function startGenesis(): Promise<StartOutcomePayload | null> {
  if (!isTauri || isTurnInFlight(state)) return null;
  try {
    const outcome = await withAnswerBound<StartOutcomePayload>(
      () => invoke<StartOutcomePayload>("genesis_start"),
      unansweredCommand,
    );
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
    const outcome = await withAnswerBound<SendOutcomePayload>(
      () => invoke<SendOutcomePayload>("genesis_send_turn", { text }),
      unansweredCommand,
    );
    setState(reduceGenesisOutcome(state, outcome));
    return outcome;
  } catch (err) {
    const outcome: SendOutcomePayload = { kind: "error", message: String(err) };
    setState(reduceGenesisOutcome(state, outcome));
    return outcome;
  }
}

/**
 * Apply a cancel outcome (T-184, carrying T-183's half).
 *
 * THE DEFECT THIS CLOSES: `idle` used to do NOTHING. The chord the footer
 * advertises — *"⌘. to stop"* — was pressed on @human's walk against a
 * store that had nothing to cancel, got `idle` back, and left every flag
 * exactly where it was. A chord that silently does nothing is the failure
 * family T-171 was written against.
 *
 * WHY `idle` MUST DISARM, and it is the same decision as the arming
 * guard above rather than a second one. `idle` is the runner saying it
 * has no turn running. That is the runner's own measurement, which is
 * the token the screen already trusts — so a store still claiming flight
 * against it is stale by exactly the inference `flightOf` makes on the
 * render side. Making the store agree with the runner settles both
 * halves of this card with one rule.
 *
 * AND IT MUST SETTLE THE TURNS TOO, not only the flags. `flightOf` reads
 * `turn.status === "running"` BEFORE it reads any flag, so a store that
 * cleared `sending`/`phase` and left a turn stuck at `running` would
 * still show the footer claiming a turn nobody is running. Clearing the
 * flags alone would have looked like a fix and changed nothing on screen.
 *
 * IDENTITY WHEN THERE IS NOTHING TO DO, which is what makes the cancel
 * path safe to press twice: the second press finds no running turn and
 * no claim, returns `prev` unchanged, and `setState` skips the
 * re-render. The same contract `reduceGenesisEvent` has.
 */
export function reduceGenesisCancel(
  prev: GenesisState,
  outcome: CancelOutcomePayload,
): GenesisState {
  const settled = prev.turns.map((t) =>
    t.status === "running" && (outcome.kind === "idle" || t.turn === outcome.turn)
      ? { ...t, status: "cancelled" as const }
      : t,
  );
  const turnsMoved = settled.some((t, i) => t !== prev.turns[i]);
  if (!turnsMoved && !prev.sending && prev.phase === "idle") return prev;
  return {
    ...prev,
    sending: false,
    phase: "idle",
    turns: turnsMoved ? settled : prev.turns,
  };
}

/** Kill the current turn's process group. The NATIVE session survives:
 * the kill is of the turn, not the conversation.
 *
 * NOT BOUNDED, unlike the flight-arming commands above, and the reason is
 * at the site: nothing latches behind this call — the screen invokes it
 * fire-and-forget — so a command that never answers holds nothing, and
 * the claim it would have cleared is one a real `started` armed and the
 * runner's own start and stall deadlines still answer for. A bound here
 * would also have to invent an outcome `CancelOutcome` does not have.
 *
 * THE WATERMARK GUARD ON `idle` IS THE ARMING GUARD, MIRRORED. An `idle`
 * answer is a fact about the moment it was ASKED, and this promise can
 * resolve after a new turn has started — in which case obeying it would
 * cancel a turn that really is running, which is this card's own defect
 * with the sign flipped. So the disarm applies only when no event has
 * landed since the ask; when one has, the events are the newer truth and
 * they are left standing. */
export async function cancelGenesis(): Promise<CancelOutcomePayload | null> {
  if (!isTauri) return null;
  const askedAt = state.seq;
  try {
    const outcome = await invoke<CancelOutcomePayload>("genesis_cancel");
    if (outcome.kind === "cancelled" || state.seq === askedAt) {
      setState(reduceGenesisCancel(state, outcome));
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
    const outcome = await withAnswerBound<StartOutcomePayload>(
      run,
      unansweredCommand,
    );
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
