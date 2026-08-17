import { describe, expect, it } from "vitest";
import {
  applyGenesisStatus,
  emptyGenesisState,
  isTurnInFlight,
  reduceGenesisEvent,
  reduceGenesisOutcome,
  type GenesisEvent,
  type GenesisState,
  type GenesisStatusPayload,
} from "../src/lib/agent-store";

/**
 * T-025: the agent store's pure half (the watcher-store pattern —
 * reducers exported and tested, IPC glue left to the thin wrappers).
 *
 * The two properties the runner's contract leans on are pinned here:
 * the seq stale-drop (returns `prev` BY IDENTITY, so React skips the
 * re-render) and the single-flight turn gate.
 */

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
