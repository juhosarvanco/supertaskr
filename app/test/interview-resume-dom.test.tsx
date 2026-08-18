// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyState, type DocsModelState } from "../src/lib/docs-model";
import type {
  GenesisEvent,
  GenesisStatusPayload,
  TranscriptLinePayload,
} from "../src/lib/agent-store";

/**
 * T-029's DOM states, through the REAL store and the REAL event channel —
 * only the IPC boundary is mocked (T-026/T-049/T-027's precedent).
 *
 * WHAT THIS FILE IS ABOUT, in one line: every state below is a fact that
 * was already known and typed inside the process, and that used to be
 * delivered nowhere a user could see it. The five folds this task
 * absorbed are all that shape, so they are drilled together.
 *
 * The typed shapes are TRANSCRIBED from `app/src-tauri/src/agent/`'s
 * `TurnError`, `StartOutcome`, `KickoffOutcome` and `TranscriptLine`,
 * mirrored in TS by `agent-store.ts`. The fake CLI that produces them for
 * real is a Rust [[bin]] no webview test can spawn, so this is a mirror
 * without a comparison — T-041-s2's open gap, named rather than quietly
 * inherited. The cargo side of every criterion here is
 * `tests/agent_runner.rs`'s restart simulation, which drives the real
 * bytes.
 *
 * NOTHING HERE CAN SPAWN A PROCESS OR CALL A MODEL: `invoke` is mocked at
 * the boundary and answers from a map this file owns.
 */

const ipc = vi.hoisted(() => ({
  invoke: vi.fn(),
  onGenesisTurn: null as null | ((event: { payload: GenesisEvent }) => void),
  outcomes: new Map<string, unknown>(),
  /** `listen` rejects for these channel names (T-027-s2's only door). */
  refuse: new Set<string>(),
}));

const plannerRenderCounts = vi.hoisted(() => new Map<number, number>());

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (command: string, args?: unknown) => {
    ipc.invoke(command, args);
    const outcome = ipc.outcomes.get(command);
    return outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome);
  },
}));
vi.mock("@tauri-apps/api/event", () => ({
  emit: () => Promise.resolve(),
  listen: (name: string, handler: (event: { payload: GenesisEvent }) => void) => {
    if (ipc.refuse.has(name)) return Promise.reject(new Error("event.listen not allowed"));
    if (name === "genesis-turn") ipc.onGenesisTurn = handler;
    return Promise.resolve(() => {});
  },
}));
vi.mock("../src/genesis/interview-model", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/genesis/interview-model")>();
  return {
    ...actual,
    challengeOf: (text: string) => {
      const turn = /^turn (\d+)/.exec(text)?.[1];
      if (turn !== undefined) {
        const number = Number(turn);
        plannerRenderCounts.set(number, (plannerRenderCounts.get(number) ?? 0) + 1);
      }
      return actual.challengeOf(text);
    },
  };
});

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

(window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {};
const { InterviewChat } = await import("../src/genesis/InterviewChat");
const { PlannerTurn } = await import("../src/genesis/interview-turns");
const store = await import("../src/lib/agent-store");
const source = await import("../src/genesis/interview-source");

const PROJECT = "/tmp/nputer-t029-chat";

function docsWith(seq: number, files: Record<string, string> = {}): DocsModelState {
  const effective = new Map(Object.entries(files));
  return { ...emptyState(), seq, projectDir: PROJECT, effective, fileCount: effective.size };
}

function status(patch: Partial<GenesisStatusPayload> = {}): GenesisStatusPayload {
  return {
    phase: "idle",
    projectDir: PROJECT,
    turn: 0,
    nativeSessionId: null,
    cliVersion: "2.1.226 (Claude Code)",
    methodVersion: "0.1.5",
    lastError: null,
    lastEventAtMs: null,
    ...patch,
  };
}

function line(
  turn: number,
  role: "user" | "planner",
  text: string,
  machine = false,
): TranscriptLinePayload {
  return { turn, role, text, atMs: 1_700_000_000_000 + turn, machine };
}

let container: HTMLDivElement;
let root: Root;

const q = (selector: string): HTMLElement | null =>
  container.querySelector<HTMLElement>(selector);
const qa = (selector: string): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>(selector));

async function flush(fn: () => void | Promise<void>): Promise<void> {
  await act(async () => {
    await fn();
  });
}

function render(docs: DocsModelState = docsWith(0)): void {
  act(() => {
    root.render(<InterviewChat projectDir={PROJECT} docs={docs} />);
  });
}

async function emit(...events: GenesisEvent[]): Promise<void> {
  await flush(() => {
    for (const payload of events) ipc.onGenesisTurn?.({ payload });
  });
}

async function click(selector: string): Promise<void> {
  await flush(() => {
    q(selector)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

/** Open the turn channel and let the mount-time status land. */
async function withStatus(patch: Partial<GenesisStatusPayload> = {}): Promise<void> {
  ipc.outcomes.set("genesis_status", status(patch));
  await flush(() => store.startGenesisListener());
}

/** The commands the frontend actually issued, in order. */
const issued = (): string[] => ipc.invoke.mock.calls.map((call) => call[0] as string);

beforeEach(() => {
  ipc.invoke.mockClear();
  ipc.outcomes.clear();
  ipc.refuse.clear();
  ipc.onGenesisTurn = null;
  store.__resetGenesisStoreForTests();
  source.__resetInterviewSourceForTests();
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

// ---- THE LEADING EDGE: an expired login ---------------------------------

describe("an expired CLI login is a diagnosis, not a dead end", () => {
  /**
   * THE DEFECT THIS CLOSES, measured on the merged tree before the fix:
   * the real CLI exits 1, so the turn typed as `exitNonZero`, and the
   * screen read "the planner exited with code 1" over an escaped one-line
   * blob of the CLI's own words — with **Try again** underneath, which
   * fails identically forever because nothing about the login changed
   * between the two presses.
   *
   * (The architect's trace predicted the detail would be EMPTY. It is
   * not: `runner.rs`'s diagnostic ring takes in-band lines as well as
   * stderr, so the 401 text did arrive. The bytes were delivered; the
   * MEANING and the ACTION were not.)
   */
  beforeEach(async () => {
    await withStatus();
    render();
    await flush(() => Promise.resolve());
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      {
        kind: "failed",
        seq: 2,
        turn: 1,
        error: {
          kind: "authFailed",
          status: 401,
          message: "Failed to authenticate. API Error: 401 OAuth access token has been revoked.",
        },
      },
    );
  });

  it("names the login, names the command, and says the fallback needs neither", () => {
    const block = q("[data-testid=interview-failure]")!;
    expect(block.getAttribute("data-error-kind")).toBe("authFailed");
    expect(block.textContent).toContain("your CLI's login has expired");
    expect(q("[data-testid=interview-failure-command]")?.textContent).toBe("claude login");
    expect(q("[data-testid=interview-failure-action]")?.textContent).toContain(
      "needs no login at all",
    );
    // The CLI's own words still ride — they are evidence, and dropping
    // them would trade one silence for another.
    expect(q("[data-testid=interview-failure-detail]")?.textContent).toContain("401");
  });

  it("TAKES THE RETRY AWAY, because Try again is the one thing that cannot work", () => {
    expect(q("[data-testid=interview-retry]"), "no retry over a deterministic failure").toBeNull();
    expect(q("[data-testid=interview-failure]")?.getAttribute("data-retryable")).toBe("false");
    // …and the route that DOES work is right there.
    expect(q("[data-testid=interview-hand-driven]")).not.toBeNull();
  });

  it("routes straight to the hand-driven mode, with a prompt from the same assembler", async () => {
    ipc.outcomes.set("genesis_kickoff", {
      kind: "ready",
      prompt: "You are the planner. KIT ROOT: /tmp/nputer-t029-chat/.nputer/genesis/kit …",
      projectDir: PROJECT,
      kitRoot: "/tmp/nputer-t029-chat/.nputer/genesis/kit",
      methodVersion: "0.1.5",
      resuming: false,
    });
    await click("[data-testid=interview-hand-driven]");
    expect(issued()).toContain("genesis_kickoff");
    const block = q("[data-testid=interview-hand-driven-block]")!;
    expect(block.getAttribute("data-kind")).toBe("ready");
    expect(q("[data-testid=interview-kickoff]")?.textContent).toContain("KIT ROOT");
    expect(q("[data-testid=interview-kickoff-cwd]")?.textContent).toBe(PROJECT);
    expect(block.textContent).toContain("Run this in any agent CLI in your terminal");
  });
});

/** THE DISCRIMINATING HALF, in its own block because it needs a chat that
 * has NOT already failed on auth. A tool denial is the SAME exit-1 +
 * `is_error` shape and must not read as an auth failure — and it KEEPS
 * its retry, because a denial is not deterministic across turns: the
 * planner may reach for something narrower next time. */
describe("a denied tool is a different diagnosis from the same exit code", () => {
  it("names the tools by name, and stays retryable", async () => {
    await withStatus();
    render();
    await flush(() => Promise.resolve());
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      {
        kind: "failed",
        seq: 2,
        turn: 1,
        error: { kind: "toolDenied", denials: ["Bash", "WebFetch"], terminalReason: "refusal" },
      },
    );
    const block = q("[data-testid=interview-failure]")!;
    expect(block.getAttribute("data-error-kind")).toBe("toolDenied");
    expect(block.textContent).toContain("refused a tool it needed");
    expect(q("[data-testid=interview-failure-action]")?.textContent).toContain("Bash and WebFetch");
    expect(q("[data-testid=interview-retry]"), "a denial may not repeat").not.toBeNull();
    expect(q("[data-testid=interview-failure-command]"), "no login to run").toBeNull();
  });
});

// ---- criterion 1: the conversation is where you left it -----------------

describe("reopening a project mid-interview (criteria 1-3)", () => {
  it("offers resume with the recorded turn count and the model, and takes it", async () => {
    ipc.outcomes.set("genesis_start", {
      kind: "resumeAvailable",
      nativeSessionId: "e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77",
      turns: 4,
      model: "claude-opus-5",
    });
    ipc.outcomes.set("genesis_resume", { kind: "started", turn: 5 });
    await withStatus();
    render();
    await flush(() => Promise.resolve());

    const offer = q("[data-testid=interview-resume-offer]")!;
    expect(offer.getAttribute("data-turns")).toBe("4");
    expect(offer.textContent).toContain("4 turns");
    expect(offer.textContent).toContain("claude-opus-5");
    // The auto-start's own "nothing has happened yet" block must not sit
    // under an offer that says otherwise.
    expect(q("[data-testid=interview-not-started]")).toBeNull();

    await click("[data-testid=interview-resume]");
    expect(issued()).toContain("genesis_resume");
    // NO ARGUMENT CROSSES: the id is read Rust-side out of the registry.
    const call = ipc.invoke.mock.calls.find((c) => c[0] === "genesis_resume")!;
    expect(call[1]).toBeUndefined();
  });

  it("renders the model honestly when the READ boundary refused it (T-047-s3)", async () => {
    ipc.outcomes.set("genesis_start", {
      kind: "resumeAvailable",
      nativeSessionId: "e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77",
      turns: 1,
      // `null` is what a ~1 MiB model, a terminal escape or a homoglyph
      // all become at `SessionEntry::display_model` — refused, never
      // coerced, and never echoed back into the DOM.
      model: null,
    });
    await withStatus();
    render();
    await flush(() => Promise.resolve());
    const offer = q("[data-testid=interview-resume-offer]")!;
    expect(offer.textContent).toContain("model not recorded");
    // THE ASYMMETRY: a refused model costs the NAME, never the resume.
    expect(q("[data-testid=interview-resume]")).not.toBeNull();
    expect(offer.textContent).toContain("1 turn");
  });

  it("an unusable saved id gets its own affordance, and it is not a retry (T-039-s3)", async () => {
    ipc.outcomes.set("genesis_start", {
      kind: "sessionIdRejected",
      registryPath: ".nputer/sessions.json",
      why: "refusing to resume session 'S1': it begins with '-'.",
    });
    ipc.outcomes.set("genesis_fresh", { kind: "started", turn: 1 });
    await withStatus();
    render();
    await flush(() => Promise.resolve());

    const block = q("[data-testid=interview-session-unusable]")!;
    expect(block.textContent).toContain("your saved session is unusable");
    expect(q("[data-testid=interview-session-unusable-why]")?.textContent).toContain(
      "begins with '-'",
    );
    expect(block.textContent).toContain(".nputer/sessions.json");
    // It never reads as the generic error toast it used to share an
    // envelope with.
    expect(q("[data-testid=interview-notice]")).toBeNull();
    expect(q("[data-testid=interview-resume]"), "there is nothing to resume").toBeNull();

    await click("[data-testid=interview-fresh]");
    expect(issued()).toContain("genesis_fresh");
  });
});

// ---- criteria 1-2: the rehydration --------------------------------------

describe("the transcript survives a restart, and its loss costs only scrollback", () => {
  it("invokes only the live turn across live and rehydrated streams", async () => {
    await withStatus({ phase: "running", turn: 7 });
    render();
    await emit(
      ...Array.from({ length: 6 }, (_, index) => [
        { kind: "started" as const, seq: index * 2 + 1, turn: index + 1 },
        {
          kind: "completed" as const,
          seq: index * 2 + 2,
          turn: index + 1,
          text: `turn ${index + 1}`,
          truncatedRelay: false,
        },
      ]).flat(),
      { kind: "started", seq: 13, turn: 7 },
    );
    plannerRenderCounts.clear();
    await emit({ kind: "textDelta", seq: 14, turn: 7, text: "turn 7" });
    expect(
      Array.from({ length: 7 }, (_, index) => plannerRenderCounts.get(index + 1) ?? 0),
      "a live delta invokes only its own turn",
    ).toEqual([0, 0, 0, 0, 0, 0, 1]);

    plannerRenderCounts.clear();
    await flush(() => render(docsWith(2, {
      "docs/NORTH_STAR.md": "## Vision\n\nA thing.\n\n## Users\n\nSomeone.\n",
    })));
    expect(
      Array.from({ length: 7 }, (_, index) => plannerRenderCounts.get(index + 1) ?? 0),
      "a docs-stage change invokes only the current footer",
    ).toEqual([0, 0, 0, 0, 0, 0, 1]);

    for (const event of [
      { kind: "activity" as const, seq: 15, turn: 7, label: "Write" },
      {
        kind: "completed" as const,
        seq: 16,
        turn: 7,
        text: "turn 7 complete",
        truncatedRelay: true,
      },
      {
        kind: "failed" as const,
        seq: 17,
        turn: 7,
        error: { kind: "startTimeout" as const },
      },
    ]) {
      plannerRenderCounts.clear();
      await emit(event);
      expect(plannerRenderCounts.get(7), `${event.kind} changes visible turn state`).toBe(1);
    }

    plannerRenderCounts.clear();
    await emit({ kind: "started", seq: 18, turn: 8 });
    expect(plannerRenderCounts.get(7), "the old current turn becomes history once").toBe(1);

    act(() => root.unmount());
    container.remove();
    store.__resetGenesisStoreForTests();
    source.__resetInterviewSourceForTests();
    ipc.invoke.mockClear();
    ipc.outcomes.clear();
    ipc.onGenesisTurn = null;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    ipc.outcomes.set(
      "genesis_transcript",
      Array.from({ length: 6 }, (_, index) =>
        line(index + 1, "planner", `turn ${index + 1}`),
      ),
    );
    await withStatus({ phase: "running", turn: 7 });
    render();
    await flush(() => Promise.resolve());
    await emit({ kind: "started", seq: 13, turn: 7 });
    plannerRenderCounts.clear();
    await emit({ kind: "textDelta", seq: 14, turn: 7, text: "turn 7" });
    expect(
      Array.from({ length: 7 }, (_, index) => plannerRenderCounts.get(index + 1) ?? 0),
      "a rehydrated delta invokes only its own turn",
    ).toEqual([0, 0, 0, 0, 0, 0, 1]);

    act(() => root.unmount());
    container.remove();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    const planner = {
      turn: 1,
      text: "turn 1",
      activity: [],
      status: "completed" as const,
      truncatedRelay: false,
      error: null,
    };
    const firstRetry = () => {};
    const firstHandDriven = () => {};
    act(() => root.render(
      <PlannerTurn
        turn={1}
        planner={planner}
        current={false}
        approxStage={null}
        onRetry={firstRetry}
        onHandDriven={firstHandDriven}
      />,
    ));
    plannerRenderCounts.clear();
    const secondRetry = () => {};
    act(() => root.render(
      <PlannerTurn
        turn={1}
        planner={planner}
        current={false}
        approxStage={null}
        onRetry={secondRetry}
        onHandDriven={firstHandDriven}
      />,
    ));
    expect(plannerRenderCounts.get(1), "a changed retry callback renders").toBe(1);
    plannerRenderCounts.clear();
    act(() => root.render(
      <PlannerTurn
        turn={1}
        planner={planner}
        current={false}
        approxStage={null}
        onRetry={secondRetry}
        onHandDriven={() => {}}
      />,
    ));
    expect(plannerRenderCounts.get(1), "a changed hand-driven callback renders").toBe(1);
  });

  it("rehydrates both halves of the conversation from the banked cache", async () => {
    ipc.outcomes.set("genesis_transcript", [
      line(1, "user", "You are the planner. KIT ROOT: /tmp/… stage 0 scaffold first.", true),
      line(1, "planner", "Who is this for, and what do they do today instead?"),
      line(2, "user", "Solo founders with abandoned vibe-coded repos."),
      line(2, "planner", "What is observable when it works?"),
    ]);
    ipc.outcomes.set("genesis_start", { kind: "started", turn: 3 });
    await withStatus({ phase: "idle", turn: 2, nativeSessionId: "abc" });
    render();
    await flush(() => Promise.resolve());

    expect(issued()).toContain("genesis_transcript");
    const bodies = qa("[data-testid=interview-turn-body]").map((el) => el.textContent);
    expect(bodies).toEqual([
      "Who is this for, and what do they do today instead?",
      "What is observable when it works?",
    ]);
    expect(qa("[data-testid=interview-user-turn]").map((el) => el.textContent)).toEqual([
      "youSolo founders with abandoned vibe-coded repos.",
    ]);

    // THE APP-ASSEMBLED HALF IS DROPPED, on the typed flag rather than by
    // reading it. The kickoff is the user half of the protocol and the
    // human did not type it; drawing it in their own bubble would be the
    // chat claiming they said it.
    expect(container.textContent).not.toContain("KIT ROOT");

    // A rehydrated turn is COMPLETED, never running: it is on disk, so it
    // finished, and a pulse dot over a turn nothing is generating would
    // be the screen claiming work is happening.
    expect(qa("[data-testid=interview-planner-turn]").map((el) => el.dataset.status)).toEqual([
      "completed",
      "completed",
    ]);
    expect(q("[data-testid=interview-streaming]")).toBeNull();
  });

  it("LIVE STATE WINS: a turn streaming right now is never overwritten by its copy on disk", async () => {
    ipc.outcomes.set("genesis_transcript", [line(1, "planner", "the stale copy on disk")]);
    ipc.outcomes.set("genesis_start", { kind: "started", turn: 1 });
    await withStatus();
    render();
    await flush(() => Promise.resolve());
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      { kind: "textDelta", seq: 2, turn: 1, text: "the live turn, mid-stream" },
    );
    const turns = qa("[data-testid=interview-planner-turn]");
    expect(turns).toHaveLength(1);
    expect(turns[0]!.dataset.status).toBe("running");
    expect(turns[0]!.textContent).toContain("the live turn, mid-stream");
    expect(container.textContent).not.toContain("the stale copy on disk");
  });

  it("a lost or unreadable cache renders no history and blocks nothing (criterion 2)", async () => {
    // Every loss lands the same empty answer: the file is gone, the file
    // is garbage, or the boundary refused outright.
    for (const answer of [[], undefined, new Error("no such file")]) {
      store.__resetGenesisStoreForTests();
      source.__resetInterviewSourceForTests();
      ipc.invoke.mockClear();
      ipc.outcomes.set("genesis_transcript", answer);
      ipc.outcomes.set("genesis_start", {
        kind: "resumeAvailable",
        nativeSessionId: "abc-123",
        turns: 3,
        model: "claude-opus-5",
      });
      await withStatus();
      render();
      await flush(() => Promise.resolve());

      expect(qa("[data-testid=interview-planner-turn]"), `${answer}`).toHaveLength(0);
      // …and the resume — which reads the REGISTRY and `docs/`, neither
      // of which is this file — still stands, with the banked progress
      // named in its place.
      const offer = q("[data-testid=interview-resume-offer]")!;
      expect(offer, `${answer}`).not.toBeNull();
      expect(offer.textContent).toContain("3 turns");
      expect(offer.textContent).toContain("docs/");
      act(() => root.unmount());
      container.remove();
      container = document.createElement("div");
      document.body.appendChild(container);
      act(() => {
        root = createRoot(container);
      });
    }
  });
});

// ---- T-027-s2: the channel that is not open ------------------------------

describe("a refused turn subscription says so instead of staying empty forever", () => {
  /**
   * THE DEFECT, exactly: `startInterviewSource` wraps `listen` in a
   * try/catch — it must, because an unhandled rejection at the app root is
   * what T-050 spent a task removing — and the whole user-visible response
   * was a `console.error`. The screen rendered normally, the input was
   * enabled, "Start the interview" worked, `genesis_start` reported
   * `started { turn: 1 }`, the planner really ran and really wrote into
   * `docs/`, the RIGHT half showed the files landing, and the LEFT half
   * stayed empty forever with no explanation.
   */
  async function refuseTheChannel(): Promise<unknown> {
    ipc.refuse.add("genesis-turn");
    ipc.outcomes.set("genesis_status", status());
    let caught: unknown = null;
    await flush(async () => {
      await store.startGenesisListener().catch((err) => {
        caught = err;
      });
    });
    return caught;
  }

  it("puts the fact on the STORE — not in a flag private to the source module", async () => {
    const caught = await refuseTheChannel();
    // BOTH halves. The flag is what the chat renders; the rethrow is what
    // keeps `startInterviewSource`'s console.error, which is still the
    // thing that stops an unhandled rejection reaching the app root.
    expect(caught).toBeInstanceOf(Error);
    expect(store.getGenesisState().listenerFailed).toBe(true);
    // The latch is released, so a later call genuinely re-tries rather
    // than returning early over a channel that was never opened.
    ipc.refuse.clear();
    await flush(() => store.startGenesisListener());
    expect(store.getGenesisState().listenerFailed).toBe(false);
  });

  it("renders the inline notice, and offers the route that needs no channel", async () => {
    await refuseTheChannel();
    render();
    await flush(() => Promise.resolve());
    const notice = q("[data-testid=interview-listener-failed]")!;
    expect(notice.textContent).toContain("not receiving");
    expect(notice.textContent).toContain("The plan still assembles beside this");
    expect(q("[data-testid=interview-listener-hand-driven]")).not.toBeNull();
  });

  it("REFUSES TO AUTO-START over a dead channel, while the explicit way in still works", async () => {
    await refuseTheChannel();
    // THE STATUS MUST LAND ANYWAY, and this line is load-bearing: the
    // auto-start keys off `methodVersion !== null`, which only
    // `applyGenesisStatus` sets. Without this the refused `listen` also
    // skips the status pull, `statusKnown` stays false, and the
    // assertion below would pass for a reason that has nothing to do
    // with the listener — a vacuous green. Found by poisoning the guard
    // and watching this test stay green.
    await flush(async () => {
      await store.refreshGenesisStatus();
    });
    expect(store.getGenesisState().methodVersion, "the auto-start's gate is open").not.toBeNull();
    ipc.outcomes.set("genesis_start", { kind: "started", turn: 1 });
    ipc.invoke.mockClear();
    render();
    await flush(() => Promise.resolve());

    // Spawning a planner that really writes into `docs/` while this half
    // can never show a word of it is the defect made worse by doing it
    // without being asked.
    expect(issued()).not.toContain("genesis_start");
    // …but the user may still force it, which is exactly why that
    // affordance was never optional.
    await click("[data-testid=interview-start]");
    expect(issued()).toContain("genesis_start");
  });
});

// ---- criterion 4: the hand-driven MODE ----------------------------------

describe("no CLI is a mode, not an apology (criterion 4)", () => {
  it("hands over the assembled kickoff, the cwd, and the resume variant when docs are banked", async () => {
    ipc.outcomes.set("genesis_start", {
      kind: "cliNotFound",
      probed: ["login shell `command -v claude`", "PATH"],
    });
    ipc.outcomes.set("genesis_kickoff", {
      kind: "ready",
      prompt:
        "You are the planner. KIT ROOT: /tmp/nputer-t029-chat/.nputer/genesis/kit - PROJECT DIRECTORY: /tmp/nputer-t029-chat. Apply the RESUME RULE …",
      projectDir: PROJECT,
      kitRoot: "/tmp/nputer-t029-chat/.nputer/genesis/kit",
      methodVersion: "0.1.5",
      resuming: true,
    });
    await withStatus();
    render();
    await flush(() => Promise.resolve());

    expect(q("[data-testid=interview-cli-missing]")).not.toBeNull();
    await click("[data-testid=interview-cli-hand-driven]");

    const block = q("[data-testid=interview-hand-driven-block]")!;
    expect(block.getAttribute("data-resuming")).toBe("true");
    expect(block.textContent).toContain("Run this in any agent CLI in your terminal");
    expect(block.textContent).toContain("picks up from what is already banked");
    expect(q("[data-testid=interview-kickoff]")?.textContent).toContain("RESUME RULE");

    // NO CLIPBOARD GRANT. The block is selectable text; a copy button
    // would be a webview capability added for a convenience, which is
    // exactly what ADR-012 refuses.
    expect(block.querySelector("[data-testid=interview-kickoff-copy]")).toBeNull();
  });

  it("renders a typed non-ready kickoff as itself rather than as a blank block", async () => {
    ipc.outcomes.set("genesis_start", { kind: "cliNotFound", probed: ["PATH"] });
    ipc.outcomes.set("genesis_kickoff", {
      kind: "alreadyPlanned",
      path: "/tmp/nputer-t029-chat",
    });
    await withStatus();
    render();
    await flush(() => Promise.resolve());
    await click("[data-testid=interview-cli-hand-driven]");
    const block = q("[data-testid=interview-hand-driven-block]")!;
    expect(block.getAttribute("data-kind")).toBe("alreadyPlanned");
    expect(block.textContent).toContain("already holds a plan");
    expect(q("[data-testid=interview-kickoff]")).toBeNull();
  });

  it("renders the prompt as TEXT, whatever the assembler put in it (ADR-009)", async () => {
    // A project path is user-controlled and lands inside the prompt.
    ipc.outcomes.set("genesis_start", { kind: "cliNotFound", probed: ["PATH"] });
    ipc.outcomes.set("genesis_kickoff", {
      kind: "ready",
      prompt: '<img src=x onerror="alert(1)"> <script>alert(2)</script>',
      projectDir: '/tmp/<svg onload="alert(3)">',
      kitRoot: "/tmp/kit",
      methodVersion: "0.1.5",
      resuming: false,
    });
    await withStatus();
    render();
    await flush(() => Promise.resolve());
    await click("[data-testid=interview-cli-hand-driven]");

    const pre = q("[data-testid=interview-kickoff]")!;
    expect(pre.textContent).toContain("<script>alert(2)</script>");
    expect(pre.querySelector("script"), "no element was constructed").toBeNull();
    expect(pre.querySelector("img")).toBeNull();
    expect(container.querySelector("svg[onload]")).toBeNull();
    expect(q("[data-testid=interview-kickoff-cwd]")?.textContent).toContain("<svg");
  });
});
