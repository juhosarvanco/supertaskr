// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  COMMAND_ANSWER_BOUND_MS,
  UNANSWERED_COMMAND_MESSAGE,
  applyGenesisStatus,
  emptyGenesisState,
  isTurnInFlight,
  reduceGenesisEvent,
  reduceGenesisCancel,
  reduceGenesisOutcome,
  settledTurn,
  type GenesisEvent,
  type GenesisState,
  type CancelOutcomePayload,
  type GenesisStatusPayload,
  type GenesisTurn,
} from "../src/lib/agent-store";

/**
 * T-025: the agent store's pure half (the watcher-store pattern —
 * reducers exported and tested, IPC glue left to the thin wrappers).
 *
 * The two properties the runner's contract leans on are pinned here:
 * the seq stale-drop (returns `prev` BY IDENTITY, so React skips the
 * re-render) and the single-flight turn gate.
 *
 * T-184 ADDED THE SECOND HALF OF THE FILE AND WITH IT AN ENVIRONMENT.
 * The pure bodies above need no DOM and did not ask for one; the store's
 * own COMMAND path does, because `isTauri` is decided at module load
 * from `window`, and the defects this task closes — an answer that
 * arrives after its turn, and a command that never arrives at all — live
 * in the wrappers rather than in the reducers. So the file runs under
 * jsdom with the IPC boundary mocked and nothing else (T-026/T-049's
 * precedent, and `interview-chat-dom.test.tsx`'s harness shape).
 *
 * THE STATIC IMPORT ABOVE IS DELIBERATELY NOT TAURI. `__TAURI_INTERNALS__`
 * is planted BELOW it, so the module every pure body uses evaluates with
 * `isTauri` false and cannot reach a command by accident. The bodies that
 * need a live command take a SECOND, freshly-evaluated instance through
 * `freshStore()`, which is the only place in this file where an `invoke`
 * can happen.
 */

const ipc = vi.hoisted(() => ({
  invoke: vi.fn(),
  /** The `genesis-turn` handler the store registered. */
  onGenesisTurn: null as null | ((event: { payload: GenesisEvent }) => void),
  outcomes: new Map<string, unknown>(),
  /** Commands that answer with a promise nobody resolves until this
   * file says so — the never-answers case, which is not the same as a
   * rejection, and the LATE-answer case, which is neither. */
  parked: new Set<string>(),
  /** Resolves the most recently parked call, for the late-answer case. */
  release: null as null | ((value: unknown) => void),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (command: string, args?: unknown) => {
    ipc.invoke(command, args);
    if (ipc.parked.has(command)) {
      return new Promise((resolve) => {
        ipc.release = resolve as (value: unknown) => void;
      });
    }
    const outcome = ipc.outcomes.get(command);
    return outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome);
  },
}));
vi.mock("@tauri-apps/api/event", () => ({
  emit: () => Promise.resolve(),
  listen: (name: string, handler: (event: { payload: GenesisEvent }) => void) => {
    if (name === "genesis-turn") ipc.onGenesisTurn = handler;
    return Promise.resolve(() => {});
  },
}));

(window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {};

/** The store, re-evaluated so its module-level `isTauri` reads the
 * planted runtime. A fresh instance per body, because the store is a
 * module singleton and a leaked claim of flight would be exactly the bug
 * under test wearing a disguise. */
async function freshStore(): Promise<typeof import("../src/lib/agent-store")> {
  ipc.invoke.mockClear();
  ipc.outcomes.clear();
  ipc.parked.clear();
  ipc.onGenesisTurn = null;
  ipc.release = null;
  vi.resetModules();
  return import("../src/lib/agent-store");
}

const IDLE_STATUS: GenesisStatusPayload = {
  phase: "idle",
  projectDir: "/repo",
  turn: 0,
  nativeSessionId: null,
  cliVersion: "2.1.226 (Claude Code)",
  methodVersion: "0.1.5",
  lastError: null,
  lastEventAtMs: null,
};

afterEach(() => {
  vi.useRealTimers();
});

function ev(event: GenesisEvent): GenesisEvent {
  return event;
}

function play(events: GenesisEvent[], from: GenesisState = emptyGenesisState()): GenesisState {
  return events.reduce(reduceGenesisEvent, from);
}

describe("reduceGenesisEvent — one turn's life", () => {
  it("started arms the in-flight gate and opens the turn", () => {
    const state = play([ev({ kind: "started", seq: 1, turn: 1 })]);
    expect(state.phase).toBe("running");
    expect(state.sending).toBe(true);
    expect(isTurnInFlight(state)).toBe(true);
    expect(state.turns).toHaveLength(1);
    expect(state.turns[0]).toMatchObject({ turn: 1, text: "", status: "running" });
  });

  it("deltas accumulate in order, and the result line replaces them as canonical", () => {
    const state = play([
      ev({ kind: "started", seq: 1, turn: 1 }),
      ev({ kind: "textDelta", seq: 2, turn: 1, text: "Hel" }),
      ev({ kind: "textDelta", seq: 3, turn: 1, text: "lo, " }),
      ev({ kind: "textDelta", seq: 4, turn: 1, text: "founder" }),
    ]);
    expect(state.turns[0]?.text).toBe("Hel" + "lo, " + "founder");

    // The `completed` text is the CLI's own result line — deterministic,
    // and what the transcript stored. The deltas were a preview of it.
    const done = reduceGenesisEvent(
      state,
      ev({ kind: "completed", seq: 5, turn: 1, text: "Hello, founder.", truncatedRelay: false }),
    );
    expect(done.turns[0]?.text).toBe("Hello, founder.");
    expect(done.turns[0]?.status).toBe("completed");
    expect(done.phase).toBe("idle");
    expect(isTurnInFlight(done)).toBe(false);
  });

  it("activity markers dedupe consecutively but keep a real sequence", () => {
    const state = play([
      ev({ kind: "started", seq: 1, turn: 1 }),
      ev({ kind: "activity", seq: 2, turn: 1, label: "Write" }),
      ev({ kind: "activity", seq: 3, turn: 1, label: "Write" }),
      ev({ kind: "activity", seq: 4, turn: 1, label: "Bash" }),
      ev({ kind: "activity", seq: 5, turn: 1, label: "Write" }),
    ]);
    expect(state.turns[0]?.activity).toEqual(["Write", "Bash", "Write"]);
  });

  it("a failure records the typed error on the turn AND on the state", () => {
    const state = play([
      ev({ kind: "started", seq: 1, turn: 1 }),
      ev({
        kind: "failed",
        seq: 2,
        turn: 1,
        error: { kind: "exitNonZero", code: 3, stderrTail: "credentials expired" },
      }),
    ]);
    expect(state.phase).toBe("failed");
    expect(state.sending).toBe(false);
    expect(state.turns[0]?.status).toBe("failed");
    expect(state.lastError).toEqual({
      kind: "exitNonZero",
      code: 3,
      stderrTail: "credentials expired",
    });
    // The session is not lost: a failed turn leaves it resumable, and the
    // store keeps whatever native id it had.
    expect(state.nativeSessionId).toBeNull();
  });

  it("sessionRegistered captures the native id the resume flag needs", () => {
    const state = play([
      ev({ kind: "started", seq: 1, turn: 1 }),
      ev({ kind: "sessionRegistered", seq: 2, nativeSessionId: "abc-123" }),
    ]);
    expect(state.nativeSessionId).toBe("abc-123");
  });

  /**
   * T-081. The runner announces a denial the moment the CLI does, and
   * the store's job is to keep it on the turn it happened in — WITHOUT
   * turning that turn into a failure, which is the whole shape of the
   * observed 2.1.226 run: two denials, then a clean completion.
   */
  it("denials land on the turn as they arrive and never make it a failure", () => {
    const state = play([
      ev({ kind: "started", seq: 1, turn: 1 }),
      ev({ kind: "textDelta", seq: 2, turn: 1, text: "Let me scaffold" }),
      ev({
        kind: "denied",
        seq: 3,
        turn: 1,
        toolName: "Bash",
        toolUseId: "toolu_01FAHQKCKFrBLrmVtRiuLT9L",
        message: "This Bash command contains multiple operations.",
      }),
      ev({
        kind: "denied",
        seq: 4,
        turn: 1,
        toolName: "Bash",
        toolUseId: "toolu_0173K9Q72m797nLBonDtrc3R",
        message: "Glob patterns are not allowed in write operations.",
      }),
    ]);
    // TWO entries naming ONE tool, because that is what really happened.
    // A store that deduped on the name would show one refusal here.
    expect(state.turns[0]?.denials.map((d) => d.toolName)).toEqual(["Bash", "Bash"]);
    expect(state.turns[0]?.denials.map((d) => d.toolUseId)).toEqual([
      "toolu_01FAHQKCKFrBLrmVtRiuLT9L",
      "toolu_0173K9Q72m797nLBonDtrc3R",
    ]);
    expect(state.turns[0]?.denials[1]?.message).toBe(
      "Glob patterns are not allowed in write operations.",
    );
    // Mid-turn, and nothing about the turn has gone wrong.
    expect(state.turns[0]?.status).toBe("running");
    expect(state.phase).toBe("running");
    expect(state.lastError).toBeNull();

    // …and the completion does not wipe them: the refusals happened, and
    // the turn succeeded anyway.
    const done = reduceGenesisEvent(
      state,
      ev({ kind: "completed", seq: 5, turn: 1, text: "Stage 0 done", truncatedRelay: false }),
    );
    expect(done.turns[0]?.denials).toHaveLength(2);
    expect(done.turns[0]?.status).toBe("completed");
    expect(done.phase).toBe("idle");
    expect(done.lastError).toBeNull();
  });

  /** T-081 criterion 6, at the store: a denial the app cannot fully
   * describe is still a denial the user gets to see. */
  it("a denial with no tool name and no message is still kept", () => {
    const state = play([
      ev({ kind: "started", seq: 1, turn: 1 }),
      ev({ kind: "denied", seq: 2, turn: 1, toolName: null, toolUseId: null, message: "" }),
    ]);
    expect(state.turns[0]?.denials).toEqual([{ toolName: null, toolUseId: null, message: "" }]);
  });

  it("truncatedRelay rides the completed event so the pane can say so", () => {
    const state = play([
      ev({ kind: "started", seq: 1, turn: 1 }),
      ev({ kind: "completed", seq: 2, turn: 1, text: "…", truncatedRelay: true }),
    ]);
    expect(state.turns[0]?.truncatedRelay).toBe(true);
  });

  it("a multi-turn exchange keeps every turn, in order", () => {
    const state = play([
      ev({ kind: "started", seq: 1, turn: 1 }),
      ev({ kind: "completed", seq: 2, turn: 1, text: "one", truncatedRelay: false }),
      ev({ kind: "started", seq: 3, turn: 2 }),
      ev({ kind: "textDelta", seq: 4, turn: 2, text: "two" }),
    ]);
    expect(state.turns.map((t) => t.turn)).toEqual([1, 2]);
    expect(state.turns[0]?.status).toBe("completed");
    expect(state.turns[1]?.status).toBe("running");

    const previous = state.turns[0];
    const streamed = reduceGenesisEvent(
      state,
      ev({ kind: "textDelta", seq: 5, turn: 2, text: " again" }),
    );
    expect(Object.is(streamed.turns[0], previous)).toBe(true);
  });
});

describe("reduceGenesisEvent — the seq stale-drop", () => {
  it("a stale or duplicate event returns prev BY IDENTITY", () => {
    const state = play([
      ev({ kind: "started", seq: 5, turn: 1 }),
      ev({ kind: "textDelta", seq: 6, turn: 1, text: "live" }),
    ]);
    // Exactly the watcher-store contract: identity, so no re-render.
    expect(reduceGenesisEvent(state, ev({ kind: "textDelta", seq: 6, turn: 1, text: "dup" }))).toBe(
      state,
    );
    expect(reduceGenesisEvent(state, ev({ kind: "textDelta", seq: 2, turn: 1, text: "old" }))).toBe(
      state,
    );
    expect(state.turns[0]?.text).toBe("live");
  });

  it("REPLAY of a whole turn's events changes nothing after the fact", () => {
    const script: GenesisEvent[] = [
      { kind: "started", seq: 1, turn: 1 },
      { kind: "textDelta", seq: 2, turn: 1, text: "a" },
      { kind: "activity", seq: 3, turn: 1, label: "Write" },
      { kind: "completed", seq: 4, turn: 1, text: "a", truncatedRelay: false },
    ];
    const once = play(script);
    const twice = play(script, once);
    expect(twice).toBe(once);
    expect(twice.turns).toHaveLength(1);
    expect(twice.turns[0]?.activity).toEqual(["Write"]);
  });

  it("out-of-order delivery never rewinds the watermark", () => {
    const state = play([
      ev({ kind: "started", seq: 1, turn: 1 }),
      ev({ kind: "textDelta", seq: 4, turn: 1, text: "d" }),
      ev({ kind: "textDelta", seq: 2, turn: 1, text: "b" }),
      ev({ kind: "textDelta", seq: 3, turn: 1, text: "c" }),
      ev({ kind: "textDelta", seq: 5, turn: 1, text: "e" }),
    ]);
    expect(state.seq).toBe(5);
    expect(state.turns[0]?.text).toBe("de");
  });
});

describe("single-flight and outcomes", () => {
  it("started/accepted arm the gate; everything else is a message", () => {
    const idle = emptyGenesisState();
    expect(isTurnInFlight(idle)).toBe(false);

    const armed = reduceGenesisOutcome(idle, { kind: "started", turn: 1 });
    expect(isTurnInFlight(armed)).toBe(true);
    expect(armed.lastOutcome).toBeNull();

    const accepted = reduceGenesisOutcome(idle, { kind: "accepted", turn: 2 });
    expect(isTurnInFlight(accepted)).toBe(true);

    const busy = reduceGenesisOutcome(idle, { kind: "busy" });
    expect(isTurnInFlight(busy)).toBe(false);
    expect(busy.lastOutcome).toEqual({ kind: "busy" });
  });

  it("the refusals T-029 renders survive as typed data, not strings", () => {
    const notFound = reduceGenesisOutcome(emptyGenesisState(), {
      kind: "cliNotFound",
      probed: ["login shell `command -v claude`"],
    });
    expect(notFound.lastOutcome).toEqual({
      kind: "cliNotFound",
      probed: ["login shell `command -v claude`"],
    });

    const resume = reduceGenesisOutcome(emptyGenesisState(), {
      kind: "resumeAvailable",
      nativeSessionId: "abc",
      turns: 4,
      // T-047-s3: through the registry's READ boundary. `null` means both
      // "no model recorded" and "recorded, but not a usable name".
      model: "claude-opus-5",
    });
    expect(resume.lastOutcome).toMatchObject({ kind: "resumeAvailable", turns: 4 });

    const planned = reduceGenesisOutcome(emptyGenesisState(), {
      kind: "alreadyPlanned",
      path: "/repo",
    });
    expect(planned.lastOutcome).toEqual({ kind: "alreadyPlanned", path: "/repo" });
  });
});

describe("applyGenesisStatus — the mount-time catch-up pull", () => {
  const status: GenesisStatusPayload = {
    phase: "running",
    projectDir: "/repo",
    turn: 3,
    nativeSessionId: "abc-123",
    cliVersion: "2.1.226 (Claude Code)",
    methodVersion: "0.1.5",
    lastError: null,
    lastEventAtMs: 1_700_000_000_000,
  };

  it("a late-mounting pane learns where the interview is", () => {
    const state = applyGenesisStatus(emptyGenesisState(), status);
    expect(state.phase).toBe("running");
    expect(state.sending).toBe(true);
    expect(state.nativeSessionId).toBe("abc-123");
    expect(state.methodVersion).toBe("0.1.5");
    expect(state.cliVersion).toBe("2.1.226 (Claude Code)");
    expect(state.projectDir).toBe("/repo");
    expect(state.lastEventAtMs).toBe(1_700_000_000_000);
  });

  it("the pull never rewinds the seq watermark or invents turn text", () => {
    const live = play([
      ev({ kind: "started", seq: 9, turn: 3 }),
      ev({ kind: "textDelta", seq: 10, turn: 3, text: "live text" }),
    ]);
    const after = applyGenesisStatus(live, status);
    expect(after.seq).toBe(10);
    expect(after.turns[0]?.text).toBe("live text");
    // An event that arrived before the pull still cannot be re-applied.
    expect(reduceGenesisEvent(after, ev({ kind: "textDelta", seq: 10, turn: 3, text: "x" }))).toBe(
      after,
    );
  });

  it("an idle status clears the in-flight gate", () => {
    const state = applyGenesisStatus(emptyGenesisState(), { ...status, phase: "idle" });
    expect(state.sending).toBe(false);
    expect(isTurnInFlight(state)).toBe(false);
  });
});

/**
 * T-184 — THE SEQUENCE GUARD.
 *
 * The defect: both arming sites set `sending`/`phase` from an answer that
 * NAMES A TURN, without ever looking at what that turn has since done. So
 * an answer resolving after its own turn's events, or a status pull
 * assembled before the turn landed, re-arms a flight nothing can clear —
 * the events that would clear it are already below the seq watermark.
 *
 * Every body here builds the out-of-order arrival rather than describing
 * it, and every refusal is set against a POSITIVE CONTROL built from the
 * same state with ONE field changed: without that, a guard that refused
 * everything would pass the whole section.
 */
describe("the sequence guard: an answer is checked against its own turn (T-184)", () => {
  /** The same turn, at whatever status the caller wants, with flight
   * DISARMED — so any arming seen afterwards is the outcome's doing. */
  function disarmedAt(turn: number, status: GenesisTurn["status"]): GenesisState {
    const base = play([ev({ kind: "started", seq: 1, turn })]);
    return {
      ...base,
      phase: "idle",
      sending: false,
      turns: base.turns.map((t) => ({ ...t, status })),
    };
  }

  it("A LATE ANSWER FOR A TURN THAT ALREADY LANDED DOES NOT ARM FLIGHT", () => {
    // CONSTRUCTED, not described: the turn's own events land first and
    // the command's answer resolves after them, which is the ordering
    // `await invoke(…)` gives no guarantee against.
    const settled = play([
      ev({ kind: "started", seq: 1, turn: 1 }),
      ev({ kind: "completed", seq: 2, turn: 1, text: "Stage 0 done", truncatedRelay: false }),
    ]);
    expect(isTurnInFlight(settled), "the turn really did land").toBe(false);

    // POSITIVE CONTROL — the same answer, the same store, ONE field
    // different: the turn is still running. It arms. So the refusal below
    // is about the turn's status and not about the answer being refused
    // on principle.
    const control = reduceGenesisOutcome(disarmedAt(1, "running"), {
      kind: "accepted",
      turn: 1,
    });
    expect(isTurnInFlight(control), "an answer for a LIVE turn must still arm").toBe(true);

    const late = reduceGenesisOutcome(settled, { kind: "accepted", turn: 1 });
    expect(isTurnInFlight(late)).toBe(false);
    expect(late.phase).toBe("idle");
    expect(late.sending).toBe(false);
    // REFUSED AND NAMED. A silent drop and a claim that never arrived look
    // identical to the next reader, and this store's whole defect was a
    // state nothing named.
    expect(late.staleFlightClaim).toEqual({ turn: 1, status: "completed", from: "outcome" });
    // …and it is not smuggled into the screen's notice slot: "accepted"
    // rendered as a notice would read as a failure report for a turn that
    // succeeded.
    expect(late.lastOutcome).toBeNull();
  });

  it("THE GUARD KEYS ON THE TURN'S OWN STATUS — the token the screen already trusts", () => {
    // Four states, byte-identical but for `turns[0].status`. If the
    // arming decision follows that one field, the guard is reading the
    // runner's own per-turn measurement — the same field `flightOf` puts
    // in front of the flags — and not a second source of truth.
    for (const status of ["completed", "failed", "cancelled"] as const) {
      const after = reduceGenesisOutcome(disarmedAt(4, status), { kind: "started", turn: 4 });
      expect(isTurnInFlight(after), `a ${status} turn must not be re-armed`).toBe(false);
      expect(after.staleFlightClaim).toEqual({ turn: 4, status, from: "outcome" });
    }
    // The one value that is not a settlement, from the same construction.
    const live = reduceGenesisOutcome(disarmedAt(4, "running"), { kind: "started", turn: 4 });
    expect(isTurnInFlight(live)).toBe(true);
    expect(live.staleFlightClaim).toBeNull();

    // AN UNKNOWN TURN ARMS TOO, and this is the half a too-eager guard
    // would break: no evidence is not contrary evidence, and turn 1's
    // answer routinely beats its own `started` event off a runner thread.
    const unknown = reduceGenesisOutcome(disarmedAt(4, "completed"), {
      kind: "started",
      turn: 5,
    });
    expect(isTurnInFlight(unknown)).toBe(true);
    expect(unknown.staleFlightClaim).toBeNull();

    // The predicate itself, at the same three-way boundary.
    expect(settledTurn(disarmedAt(4, "running").turns, 4)).toBeNull();
    expect(settledTurn(disarmedAt(4, "completed").turns, 5)).toBeNull();
    expect(settledTurn(disarmedAt(4, "completed").turns, 4)).toMatchObject({
      turn: 4,
      status: "completed",
    });
  });

  it("A STALE STATUS PULL CANNOT RE-ARM A TURN THAT LANDED", () => {
    const settled = play([
      ev({ kind: "started", seq: 1, turn: 1 }),
      ev({ kind: "completed", seq: 2, turn: 1, text: "done", truncatedRelay: false }),
    ]);
    const running: GenesisStatusPayload = { ...IDLE_STATUS, phase: "running", turn: 1 };

    // POSITIVE CONTROL — the identical pull naming a turn this store has
    // no settled evidence for still arms, so the pull's whole purpose (a
    // pane that mounted after the turn started) is intact.
    const caughtUp = applyGenesisStatus(settled, { ...running, turn: 2 });
    expect(isTurnInFlight(caughtUp), "a pull about an unsettled turn must arm").toBe(true);

    const stale = applyGenesisStatus(settled, running);
    expect(isTurnInFlight(stale)).toBe(false);
    expect(stale.phase).toBe("idle");
    expect(stale.sending).toBe(false);
    expect(stale.staleFlightClaim).toEqual({ turn: 1, status: "completed", from: "status" });
    // The rest of the catch-up fold is NOT guarded and still lands: the
    // guard is about a claim of flight, not about the pull.
    expect(stale.cliVersion).toBe("2.1.226 (Claude Code)");
    expect(stale.projectDir).toBe("/repo");
  });

  it("a DISARMING status needs no evidence and is applied exactly as before", () => {
    // The asymmetry is deliberate: `idle`/`failed` can only ever release a
    // screen, never strand one, so guarding them would buy nothing and
    // could keep a stranded claim alive.
    const armed = play([ev({ kind: "started", seq: 1, turn: 1 })]);
    expect(isTurnInFlight(armed)).toBe(true);
    const idled = applyGenesisStatus(armed, { ...IDLE_STATUS, phase: "idle", turn: 1 });
    expect(isTurnInFlight(idled)).toBe(false);
    expect(idled.staleFlightClaim).toBeNull();

    const settled = play([
      ev({ kind: "started", seq: 1, turn: 1 }),
      ev({ kind: "completed", seq: 2, turn: 1, text: "done", truncatedRelay: false }),
    ]);
    const failed = applyGenesisStatus(settled, { ...IDLE_STATUS, phase: "failed", turn: 1 });
    expect(failed.phase).toBe("failed");
    expect(failed.staleFlightClaim).toBeNull();
  });
});

/**
 * T-184 — THE LIVENESS BOUND.
 *
 * A DIFFERENT DEFECT FROM THE GUARD ABOVE, and the difference decides the
 * shape of the fix. A late answer is stale EVIDENCE and can be weighed
 * against the turn it names. A command that never answers is an ABSENCE:
 * there is nothing to weigh, the `await` simply never returns, and the
 * synchronous latch the caller took before the call is never released. The
 * only honest repair is to stop waiting, so this half is a bound rather
 * than a guard.
 *
 * These bodies drive the REAL command wrappers, because the wrappers are
 * where the defect lives — a bound proven only on its own helper would be
 * a proof about a function nobody had wired up.
 */
describe("the liveness bound: a command that never answers is answered for (T-184)", () => {
  it("the bound is longer than the one Rust-side wait a command can contain", () => {
    // THE NUMBER'S REASON, MADE CHECKABLE rather than only written down.
    // `genesis_start`'s doc comment names the login-shell probe as the one
    // bounded blocking step inside a command's own body; the runner sets
    // that bound. If it ever grows past this side's, a user meets a
    // spurious refusal — and this line says so first.
    const runner = readFileSync(resolve("src-tauri/src/agent/runner.rs"), "utf8");
    const probe = /probe_timeout:\s*Duration::from_secs\((\d+)\)/.exec(runner);
    expect(probe, "probe_timeout must be findable in runner.rs").not.toBeNull();
    // The search's own control: a regex that matched the wrong thing, or a
    // field that moved, fails HERE rather than passing quietly below.
    expect(Number(probe![1]) * 1000).toBe(10_000);
    expect(COMMAND_ANSWER_BOUND_MS).toBeGreaterThan(Number(probe![1]) * 1000);
    // …and pinned by its own literal too, because a body parametrised by
    // the constant it checks cannot pin that constant (T-063).
    expect(COMMAND_ANSWER_BOUND_MS).toBe(30_000);

    // THE SAME TRAP, ONE FIELD OVER. Every other body in this file
    // compares against `UNANSWERED_COMMAND_MESSAGE` rather than against
    // its text, so none of them can notice the text changing — and the
    // text is the half a user reads. Pinned by its literal, and pinned
    // AGAINST the number beside it, which is the drift that actually
    // happens: a bound moves and the sentence quoting it does not.
    expect(UNANSWERED_COMMAND_MESSAGE).toContain(
      `within ${COMMAND_ANSWER_BOUND_MS / 1000} seconds`,
    );
    expect(UNANSWERED_COMMAND_MESSAGE).toContain("within 30 seconds");
    expect(UNANSWERED_COMMAND_MESSAGE).toContain("Nothing was lost");
  });

  it("A SEND THAT NEVER ANSWERS SETTLES ANYWAY, and leaves nothing claiming flight", async () => {
    const store = await freshStore();
    ipc.outcomes.set("genesis_status", IDLE_STATUS);
    await store.startGenesisListener();
    // The command is PARKED: its promise is never resolved and never
    // rejected. That is the case a `catch` cannot reach.
    ipc.parked.add("genesis_send_turn");

    vi.useFakeTimers();
    const pending = store.sendGenesisTurn("my answer");

    // POSITIVE CONTROL — one millisecond short of the bound, nothing has
    // answered. Without this the body would pass over a bound of zero, or
    // over a mock that quietly resolved.
    await vi.advanceTimersByTimeAsync(store.COMMAND_ANSWER_BOUND_MS - 1);
    expect(
      await Promise.race([pending, Promise.resolve("STILL PENDING" as const)]),
      "the bound must not have fired yet",
    ).toBe("STILL PENDING");

    await vi.advanceTimersByTimeAsync(1);
    const outcome = await pending;
    expect(outcome).toEqual({
      kind: "error",
      message: store.UNANSWERED_COMMAND_MESSAGE,
    });
    // THE STORE IS NOT LEFT CLAIMING FLIGHT. This is the criterion in one
    // line: the promise settled, so the caller's `finally` runs and the
    // latch is released; and the answer is not an arming one, so nothing
    // here claims a turn either.
    expect(store.isTurnInFlight(store.getGenesisState())).toBe(false);
    expect(store.getGenesisState().lastOutcome).toMatchObject({ kind: "error" });
    vi.useRealTimers();
  });

  it("a start that never answers settles on the same bound", async () => {
    const store = await freshStore();
    ipc.outcomes.set("genesis_status", IDLE_STATUS);
    await store.startGenesisListener();
    ipc.parked.add("genesis_start");

    vi.useFakeTimers();
    const pending = store.startGenesis();
    await vi.advanceTimersByTimeAsync(store.COMMAND_ANSWER_BOUND_MS);
    expect(await pending).toEqual({
      kind: "error",
      message: store.UNANSWERED_COMMAND_MESSAGE,
    });
    expect(store.isTurnInFlight(store.getGenesisState())).toBe(false);
    vi.useRealTimers();
  });

  it("a HEALTHY command is untouched: it answers on its own, with no clock involved", async () => {
    const store = await freshStore();
    ipc.outcomes.set("genesis_status", IDLE_STATUS);
    await store.startGenesisListener();
    ipc.outcomes.set("genesis_send_turn", { kind: "accepted", turn: 1 });

    // Fake timers are installed and NEVER advanced. If the answer below
    // came from the bound rather than from the command, it could not
    // arrive at all — which is what makes this the bound's discriminator
    // rather than a restatement of the send test.
    vi.useFakeTimers();
    const outcome = await store.sendGenesisTurn("a real answer");
    expect(outcome).toEqual({ kind: "accepted", turn: 1 });
    expect(store.isTurnInFlight(store.getGenesisState())).toBe(true);
    vi.useRealTimers();
  });

  it("THE BOUND'S TIMER IS CLEARED ON EVERY EXIT — the claim the site makes, held", async () => {
    // WHY THIS BODY EXISTS. The bound's own site claims the timer is
    // cleared on every exit, and until this body nothing could red that
    // claim: `Promise.race` has already settled by then, so a surviving
    // timer changes no OUTCOME and every other body here passes either
    // way. A guard whose failure looks exactly like success is this
    // card's own subject, pointed at the card.
    //
    // The count is asserted as a DELTA against the moment before the
    // call, never against zero, so the body measures this bound's timer
    // rather than the runner's ambient state.

    // EXIT ONE — the command answers.
    {
      const store = await freshStore();
      ipc.outcomes.set("genesis_status", IDLE_STATUS);
      await store.startGenesisListener();
      vi.useFakeTimers();
      const before = vi.getTimerCount();

      // POSITIVE CONTROL, and it is what makes the assertion below mean
      // anything: the bound really does ARM a timer. Without it, a bound
      // that never set one would satisfy "no timer is left behind".
      ipc.parked.add("genesis_send_turn");
      const pending = store.sendGenesisTurn("held open");
      await Promise.resolve();
      expect(vi.getTimerCount(), "the bound must really arm a timer").toBe(before + 1);

      ipc.release!({ kind: "accepted", turn: 1 });
      expect(await pending).toEqual({ kind: "accepted", turn: 1 });
      expect(vi.getTimerCount(), "an answered command leaves no timer behind").toBe(before);
      vi.useRealTimers();
    }

    // EXIT TWO — the command throws. A rejection leaves through the same
    // `finally`, and it is the exit a `try`/`catch` around the race would
    // have missed.
    {
      const store = await freshStore();
      ipc.outcomes.set("genesis_status", IDLE_STATUS);
      await store.startGenesisListener();
      vi.useFakeTimers();
      const before = vi.getTimerCount();

      ipc.outcomes.set("genesis_start", new Error("the boundary said no"));
      expect(await store.startGenesis()).toMatchObject({ kind: "error" });
      expect(vi.getTimerCount(), "a rejected command leaves no timer behind").toBe(before);
      vi.useRealTimers();
    }
  });

  it("a REJECTION is an answer and still passes through as one", async () => {
    // An absence and a refusal are different things, and the bound must
    // not turn the second into the first — every caller's existing
    // `catch` keeps its exact meaning.
    const store = await freshStore();
    ipc.outcomes.set("genesis_status", IDLE_STATUS);
    await store.startGenesisListener();
    ipc.outcomes.set("genesis_start", new Error("the boundary said no"));

    const outcome = await store.startGenesis();
    expect(outcome).toMatchObject({ kind: "error" });
    expect((outcome as { message: string }).message).toContain("the boundary said no");
    expect((outcome as { message: string }).message).not.toBe(store.UNANSWERED_COMMAND_MESSAGE);
  });
});

/**
 * T-184 — THE PAIR, END TO END THROUGH THE REAL STORE.
 *
 * `strandTheClaim()` in `interview-chat-dom.test.tsx` (T-171) reproduced
 * this defect by pulling a `running` status over a turn that had already
 * completed, and asserted that the SCREEN refused the resulting claim —
 * rendering `data-flight="stranded"`. That body's own precondition is
 * what this task removes: the store can no longer produce the claim by
 * that route.
 *
 * This is the same walk, driven against the store instead of the screen,
 * and inside this card's fence: real event channel, real status pull, real
 * module singleton, only the IPC boundary mocked. What it pins is the
 * store-side half of the pair — that the state `flightOf` reads as
 * `stranded` is never reached. `stranded` is returned only from inside
 * `flightOf`'s `claimed` branch, and `claimed` IS `isTurnInFlight`, so a
 * false reading here makes that branch unreachable for this walk.
 */
describe("the pair, end to end: the walk that stranded T-171's fixture (T-184)", () => {
  /** Turn 1 started and landed, through the real `genesis-turn` channel. */
  async function walkedToTheEnd(
    store: typeof import("../src/lib/agent-store"),
  ): Promise<void> {
    ipc.outcomes.set("genesis_status", IDLE_STATUS);
    await store.startGenesisListener();
    expect(ipc.onGenesisTurn, "the store must really have subscribed").not.toBeNull();
    ipc.onGenesisTurn!({ payload: { kind: "started", seq: 1, turn: 1 } });
    ipc.onGenesisTurn!({
      payload: {
        kind: "completed",
        seq: 2,
        turn: 1,
        text: "Genesis is committed. Here is the board for your review.",
        truncatedRelay: false,
      },
    });
  }

  it("THE STALE PULL NO LONGER STRANDS THE STORE, and the screen's bad state is unreachable", async () => {
    const store = await freshStore();
    await walkedToTheEnd(store);
    expect(store.getGenesisState().turns[0]?.status, "the turn landed").toBe("completed");
    expect(store.isTurnInFlight(store.getGenesisState())).toBe(false);

    // The stale answer, arriving exactly as it did on the walk.
    ipc.outcomes.set("genesis_status", { ...IDLE_STATUS, phase: "running", turn: 1 });
    await store.refreshGenesisStatus();

    // The store REFUSED it. `flightOf(turns, latched, awaiting, claimed)`
    // reaches `stranded` only when `claimed` is true, and `claimed` is
    // this reading — so with a settled turn on record and no claim, the
    // screen cannot enter the state T-171 had to teach it to leave.
    expect(store.isTurnInFlight(store.getGenesisState())).toBe(false);
    expect(store.getGenesisState().phase).toBe("idle");
    expect(store.getGenesisState().staleFlightClaim).toEqual({
      turn: 1,
      status: "completed",
      from: "status",
    });
  });

  it("POSITIVE CONTROL: the same walk, the same pull, a turn still in play — and it arms", async () => {
    // Same store, same channel, same command: only the turn the pull names
    // is one this store has no settled evidence for. Without this the body
    // above is satisfied by a status pull that stopped working.
    const store = await freshStore();
    await walkedToTheEnd(store);
    ipc.outcomes.set("genesis_status", { ...IDLE_STATUS, phase: "running", turn: 2 });
    await store.refreshGenesisStatus();
    expect(store.isTurnInFlight(store.getGenesisState())).toBe(true);
    expect(store.getGenesisState().phase).toBe("running");
    expect(store.getGenesisState().staleFlightClaim).toBeNull();
  });
});

/**
 * T-184, CARRYING T-183's HALF — THE STORE REFUSING TO DISARM.
 *
 * The other direction of the same surface. Above, the store arms a claim
 * the turn evidence contradicts; here, it holds a claim the RUNNER
 * contradicts. `cancelGenesis` used to do nothing at all when the runner
 * answered `{kind:"idle"}`, so the escape the footer advertises was
 * pressed on the walk against a store with nothing to cancel and left
 * every flag where it was.
 *
 * The fold's own argument is that one decision settles both halves: the
 * runner's measurement outranks the store's flag, whichever way the
 * disagreement points. These bodies are what makes that checkable.
 */
describe("cancel: an idle runner disarms the store it contradicts (T-184 absorbing T-183)", () => {
  const IDLE: CancelOutcomePayload = { kind: "idle" };

  it("AN IDLE ANSWER CLEARS THE CLAIM THE STORE WAS STILL HOLDING", () => {
    // The stranded shape, built from real events: a turn opened and its
    // terminal event never came.
    const stranded = play([ev({ kind: "started", seq: 1, turn: 1 })]);

    // POSITIVE CONTROL, and the criterion asks for it by name: the claim
    // must actually be SET first, or "nothing is claiming flight
    // afterwards" is satisfied by there having been nothing there.
    expect(isTurnInFlight(stranded), "the claim must be set before the cancel").toBe(true);
    expect(stranded.turns[0]?.status).toBe("running");

    const after = reduceGenesisCancel(stranded, IDLE);
    expect(isTurnInFlight(after)).toBe(false);
    expect(after.sending).toBe(false);
    expect(after.phase).toBe("idle");
    // AND THE TURN TOO, not only the flags. `flightOf` reads the turn's
    // status BEFORE any flag, so a store that cleared the flags and left
    // this at "running" would still have the footer claiming a turn.
    expect(after.turns[0]?.status).toBe("cancelled");
  });

  it("THE CANCEL PATH IS SAFE TO INVOKE TWICE — the second press is identity", () => {
    const stranded = play([ev({ kind: "started", seq: 1, turn: 1 })]);
    const once = reduceGenesisCancel(stranded, IDLE);
    const twice = reduceGenesisCancel(once, IDLE);
    // BY IDENTITY, not by deep equality: a user who pressed a chord that
    // appeared to do nothing presses it again, and the second press must
    // not even re-render.
    expect(twice).toBe(once);
    expect(isTurnInFlight(twice)).toBe(false);
    expect(twice.turns[0]?.status).toBe("cancelled");

    // …and it is identity from a genuinely idle store as well.
    const idle = emptyGenesisState();
    expect(reduceGenesisCancel(idle, IDLE)).toBe(idle);
  });

  it("a REAL cancellation still settles ONLY the turn it names", () => {
    // The pre-existing behaviour, kept: `cancelled` carries a turn and
    // acts on that turn. Only `idle`, which carries none, reaches wider —
    // because only `idle` is a statement about every turn at once.
    //
    // THE FIXTURE NEEDS TWO TURNS THE WIDENING COULD REACH, and the first
    // draft of this body had one. Turn 1 was `completed` there, so a
    // `cancelled` that settled EVERY running turn could not touch it and
    // the body passed under exactly the mutant it exists to catch. It is
    // the stranded shape from this card's own defect that supplies the
    // second: a turn whose terminal event never arrived, still `running`,
    // while a later turn is live.
    const twoRunning = play([
      ev({ kind: "started", seq: 1, turn: 1 }),
      ev({ kind: "started", seq: 2, turn: 2 }),
    ]);
    expect(twoRunning.turns.map((t) => t.status)).toEqual(["running", "running"]);

    const after = reduceGenesisCancel(twoRunning, { kind: "cancelled", turn: 2 });
    expect(after.turns[1]?.status).toBe("cancelled");
    // …and the turn the runner said nothing about is left alone. A store
    // that settled it here would be inventing a claim from an outcome
    // that does not carry one.
    expect(after.turns[0]?.status).toBe("running");

    // `idle`, from the same fixture, DOES reach both — the distinction
    // this body exists to draw, asserted rather than described.
    const idled = reduceGenesisCancel(twoRunning, IDLE);
    expect(idled.turns.map((t) => t.status)).toEqual(["cancelled", "cancelled"]);

    // A `cancelled` naming a turn that is no longer running settles
    // nothing; identity once there is no claim left to clear either.
    const settled = reduceGenesisCancel(idled, { kind: "cancelled", turn: 2 });
    expect(settled).toBe(idled);
  });

  it("THROUGH THE REAL STORE: the chord clears what the walk left set", async () => {
    const store = await freshStore();
    ipc.outcomes.set("genesis_status", IDLE_STATUS);
    await store.startGenesisListener();
    ipc.onGenesisTurn!({ payload: { kind: "started", seq: 1, turn: 1 } });
    expect(
      store.isTurnInFlight(store.getGenesisState()),
      "the fixture must really reproduce the held claim",
    ).toBe(true);

    ipc.outcomes.set("genesis_cancel", { kind: "idle" });
    expect(await store.cancelGenesis()).toEqual({ kind: "idle" });
    expect(store.isTurnInFlight(store.getGenesisState())).toBe(false);
    expect(store.getGenesisState().turns[0]?.status).toBe("cancelled");

    // Pressed again, as a user who saw nothing happen would.
    const before = store.getGenesisState();
    expect(await store.cancelGenesis()).toEqual({ kind: "idle" });
    expect(store.getGenesisState()).toBe(before);
  });

  it("A STALE IDLE IS REFUSED: an answer events have overtaken cannot cancel a live turn", async () => {
    // The arming guard mirrored. An `idle` is a fact about the moment it
    // was ASKED; obeying one that resolves after a new turn has started
    // would cancel a turn that really is running — this card's own defect
    // with the sign reversed.
    const store = await freshStore();
    ipc.outcomes.set("genesis_status", IDLE_STATUS);
    await store.startGenesisListener();
    ipc.onGenesisTurn!({ payload: { kind: "started", seq: 1, turn: 1 } });

    // The cancel is asked and PARKED, a NEW turn starts while it is in
    // flight, and only THEN does the cancel answer — the late answer
    // itself, constructed rather than stood in for.
    ipc.parked.add("genesis_cancel");
    const pending = store.cancelGenesis();
    await Promise.resolve();
    ipc.onGenesisTurn!({ payload: { kind: "started", seq: 2, turn: 2 } });
    expect(ipc.release, "the cancel must really be parked").not.toBeNull();
    ipc.release!({ kind: "idle" });
    expect(await pending).toEqual({ kind: "idle" });

    // Turn 2 really is running, so the stale idle is refused.
    expect(store.getGenesisState().turns[1]?.status).toBe("running");
    expect(store.isTurnInFlight(store.getGenesisState())).toBe(true);
  });
});
