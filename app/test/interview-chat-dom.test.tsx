// @vitest-environment jsdom
import { act, Profiler } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyState, type DocsModelState } from "../src/lib/docs-model";
import type { GenesisEvent, GenesisStatusPayload } from "../src/lib/agent-store";

/**
 * T-027's DOM states, through the REAL store and the REAL event channel
 * - only the IPC boundary is mocked (T-026/T-049's precedent).
 *
 * The fixture runs under a TAURI runtime deliberately: that is the path
 * the shipped app takes, so events arrive through `listen("genesis-turn")`
 * and answers leave through `invoke`, exactly as on a user's machine.
 * Nothing here can spawn a process - `invoke` is mocked at the boundary
 * and this task adds no Rust at all.
 *
 * The typed event and failure shapes below are TRANSCRIBED from
 * `app/src-tauri/src/agent/runner.rs`'s `RunEvent` and `TurnError` (the
 * source of truth), mirrored in TS by `app/src/lib/agent-store.ts`. The
 * fake CLI that produces them for real is a Rust [[bin]] driven by
 * cargo, which no webview test can spawn - so this is a mirror without a
 * comparison. That is T-041-s2's open gap, widened by one more mirror
 * and named here rather than quietly inherited.
 */

const ipc = vi.hoisted(() => ({
  invoke: vi.fn(),
  /** The `genesis-turn` handler the store registered. */
  onGenesisTurn: null as null | ((event: { payload: GenesisEvent }) => void),
  outcomes: new Map<string, unknown>(),
  release: null as null | ((value: unknown) => void),
  parked: new Set<string>(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (command: string, args?: unknown) => {
    ipc.invoke(command, args);
    if (ipc.parked.has(command)) {
      return new Promise((resolve) => {
        ipc.release = resolve;
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

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Both modules decide `isTauri` at load - set the flag before importing.
(window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {};
const { InterviewChat } = await import("../src/genesis/InterviewChat");
const store = await import("../src/lib/agent-store");
const source = await import("../src/genesis/interview-source");

/**
 * THE HOSTILE PAYLOAD. Nothing in it may reach the DOM as markup or as
 * an attribute: a script tag, an image with an onerror handler, an HTML
 * comment, an RTL override (which reverses how a path READS without
 * changing what it IS), the three C0 control bytes, and a 10 000
 * character run - the last because a turn is length-checked nowhere and
 * a renderer that truncated silently would be lying about what the
 * planner said.
 *
 * WRITTEN AS ESCAPES, NEVER AS RAW BYTES, and this file is swept with
 * `file(1)` before it is committed. A source file carrying a raw NUL is
 * classified `data` and goes invisible to ugrep (exit 1, no output at
 * all), to ripgrep used recursively (silent, exit 0) and to
 * /usr/bin/grep's line output - i.e. to the tooling this repo is audited
 * with. `git grep` is the one searcher that is never blinded.
 */
const HOSTILE =
  "<script>alert('xss')</script>" +
  "<img src=x onerror=alert(1)>" +
  "<!-- swallowed? -->" +
  "\u202E" +
  "\u0000\u0007\u001b[31m" +
  "A".repeat(10_000);

const RTL = "\u202E";
const C0 = "\u0000\u0007\u001b";

const PROJECT = "/tmp/sketchpad";

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

/** Push events down the REAL `genesis-turn` channel the store owns. */
async function emit(...events: GenesisEvent[]): Promise<void> {
  await flush(() => {
    for (const payload of events) ipc.onGenesisTurn?.({ payload });
  });
}

async function type(text: string): Promise<void> {
  const box = q("[data-testid=interview-input]") as HTMLTextAreaElement;
  await flush(() => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!;
    setter.call(box, text);
    box.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function press(key: string, init: KeyboardEventInit = {}): Promise<void> {
  const box = q("[data-testid=interview-input]")!;
  await flush(() => {
    box.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
    );
  });
}

async function click(selector: string): Promise<void> {
  await flush(() => {
    q(selector)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

beforeEach(() => {
  ipc.invoke.mockClear();
  ipc.outcomes.clear();
  ipc.parked.clear();
  ipc.release = null;
  ipc.onGenesisTurn = null;
  store.__resetGenesisStoreForTests();
  source.__resetInterviewSourceForTests();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** Start the listener with a status answered, so the auto-start's
 * precondition - that a status was actually OBSERVED - is met. */
async function withStatus(patch: Partial<GenesisStatusPayload> = {}): Promise<void> {
  ipc.outcomes.set("genesis_status", status(patch));
  await flush(() => source.startInterviewSource());
}

// ---- the first frame ----------------------------------------------------

describe("the first frame (criterion 1)", () => {
  it("auto-starts once a status has been observed, and still offers the explicit way in", async () => {
    // Parked, so the screen is held in the frame the user actually sees
    // first: the command has gone out and nothing has come back.
    ipc.parked.add("genesis_start");
    await withStatus();
    render();
    await flush(() => Promise.resolve());

    // The @human ruling: the user already clicked "Start an interview"
    // to get here, so re-asking is the four-step problem T-049 fixed one
    // screen over.
    expect(ipc.invoke).toHaveBeenCalledWith("genesis_start", undefined);
    // ...and the affordance is a CONVENIENCE, never load-bearing: for as
    // long as nothing has actually started, the explicit way in is on
    // screen beside it.
    expect(q("[data-testid=interview-start]")).not.toBeNull();

    // Once a turn really is running there is nothing left to start, so
    // the button goes rather than sitting there lying.
    await flush(() => {
      ipc.release?.({ kind: "started", turn: 1 });
      ipc.release = null;
    });
    expect(q("[data-testid=interview-start]")).toBeNull();
  });

  it("does NOT auto-start before a status has answered - a spawn is never fired on a guess", async () => {
    ipc.outcomes.set("genesis_status", new Error("the boundary refused"));
    await flush(() => source.startInterviewSource());
    render();
    await flush(() => Promise.resolve());
    expect(
      ipc.invoke.mock.calls.filter(([c]) => c === "genesis_start"),
      "nothing was spawned",
    ).toHaveLength(0);
    // And the explicit way in is present, which is what makes that safe.
    expect(q("[data-testid=interview-start]")).not.toBeNull();
  });

  it("the explicit button still works after an auto-start the latch refuses to repeat", async () => {
    // The auto-start ran and came back with a TYPED outcome that is not
    // a start, so the screen is still idle - and the per-project latch
    // will refuse a second AUTOMATIC attempt. That is what stops a
    // failing boundary from being hammered on every render...
    ipc.outcomes.set("genesis_start", { kind: "busy" });
    await withStatus();
    render();
    await flush(() => Promise.resolve());
    expect(
      ipc.invoke.mock.calls.filter(([c]) => c === "genesis_start"),
      "the auto-start does not loop",
    ).toHaveLength(1);

    // ...and this is why the explicit affordance is not optional: it
    // forces, so the latch can never strand the user.
    ipc.invoke.mockClear();
    ipc.outcomes.set("genesis_start", { kind: "started", turn: 1 });
    await click("[data-testid=interview-start]");
    expect(ipc.invoke).toHaveBeenCalledWith("genesis_start", undefined);
  });
});

// ---- question, history ---------------------------------------------------

describe("one current question, history quieter above (criterion 1)", () => {
  beforeEach(async () => {
    await withStatus();
    render();
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      {
        kind: "completed",
        seq: 2,
        turn: 1,
        text: "Who feels the pain first?",
        truncatedRelay: false,
      },
      { kind: "started", seq: 3, turn: 2 },
      {
        kind: "completed",
        seq: 4,
        turn: 2,
        text: "What must be true about the machine this runs on?",
        truncatedRelay: false,
      },
    );
  });

  it("renders exactly ONE current question, and it is the last turn", () => {
    const current = qa("[data-testid=interview-turn-current]");
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent).toContain("What must be true about the machine");
    const history = qa("[data-testid=interview-turn-history]");
    expect(history).toHaveLength(1);
    expect(history[0]?.textContent).toContain("Who feels the pain first?");
  });

  it("gives the current question the design's prominence and history the quieter ink", () => {
    const current = q("[data-testid=interview-turn-current] [data-testid=interview-turn-body]")!;
    // 17px / weight 500 / -0.01em - all exact token steps.
    expect(current.className).toContain("text-xl");
    expect(current.className).toContain("font-medium");
    expect(current.className).toContain("tracking-title");
    expect(current.className).toContain("text-foreground");

    const history = q("[data-testid=interview-turn-history] [data-testid=interview-turn-body]")!;
    expect(history.className).toContain("text-base");
    expect(history.className).toContain("text-secondary-foreground");
    expect(history.className, "history is never the prominent step").not.toContain("text-xl");
  });

  it("only the current question carries the footer", () => {
    expect(qa("[data-testid=interview-question-footer]")).toHaveLength(1);
  });

  it("the stage strip renders seven segments and follows the DERIVED stage", async () => {
    // Stage 1 comes from the file tree (NORTH_STAR has its Vision and
    // Users sections), never from the chips and never from the turns.
    await flush(() =>
      render(
        docsWith(2, {
          "docs/NORTH_STAR.md": "## Vision\n\nA thing.\n\n## Users\n\nSomeone.\n",
        }),
      ),
    );
    const segments = qa("[data-testid=interview-stage-segment]");
    expect(segments).toHaveLength(7);
    expect(segments.map((s) => s.getAttribute("data-state"))).toEqual([
      "current",
      "future",
      "future",
      "future",
      "future",
      "future",
      "future",
    ]);
    expect(q("[data-testid=interview-stage-readout]")?.textContent).toBe(
      "stage 1 of 7 " + String.fromCharCode(0x00b7) + " problem & person",
    );
  });
});

// ---- the challenge treatment ---------------------------------------------

describe("the challenge treatment (criterion 2)", () => {
  async function turnWith(text: string): Promise<void> {
    await withStatus();
    render();
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      { kind: "completed", seq: 2, turn: 1, text, truncatedRelay: false },
    );
  }

  it("renders the pushing-back block with the design's rule, paper and label", async () => {
    await turnWith('pushing back: You said "fast". Compared to what?');
    const block = q("[data-testid=interview-turn-challenge]")!;
    expect(block).not.toBeNull();
    // The 2px terracotta rule and the warm paper, both as TOKENS.
    expect(block.className).toContain("border-l-2");
    expect(block.className).toContain("border-chart-4");
    expect(block.className).toContain("bg-interview-challenge");
    // The design's asymmetric radius: square on the ruled edge.
    expect(block.className).toContain("rounded-r-lg");
    expect(block.textContent).toContain("planner");
    expect(block.textContent).toContain("pushing back");
    // The marker is CONSUMED - the label carries the semantics.
    expect(block.textContent).toContain('You said "fast". Compared to what?');
    expect(block.textContent, "the marker is not shown twice").not.toContain("pushing back:");
    expect(
      q("[data-testid=interview-turn-challenge] [data-testid=interview-turn-body]")!.className,
    ).toContain("text-interview-challenge-ink");
  });

  it("a turn WITHOUT the marker renders as an ordinary turn", async () => {
    await turnWith('You said "fast". Compared to what?');
    expect(q("[data-testid=interview-turn-challenge]")).toBeNull();
    expect(q("[data-testid=interview-turn-current]")).not.toBeNull();
    expect(q("[data-testid=interview-planner-turn]")?.getAttribute("data-challenge")).toBe(
      "false",
    );
  });

  it("the challenge carries the footer, so the count is never lost to the treatment", async () => {
    await turnWith("pushing back: really?");
    expect(
      q("[data-testid=interview-turn-challenge] [data-testid=interview-question-footer]"),
    ).not.toBeNull();
  });
});

// ---- banked chips --------------------------------------------------------

describe("banked chips come from the docs tree (criterion 3)", () => {
  it("a file landing after the turn chips against it, showing the PATH", async () => {
    await withStatus();
    render(docsWith(1, { "docs/STATE.md": "scaffold" }));
    await emit({ kind: "started", seq: 1, turn: 1 });
    await flush(() => {
      render(docsWith(2, { "docs/STATE.md": "scaffold", "docs/NORTH_STAR.md": "vision" }));
    });

    const chip = q("[data-testid=interview-banked]")!;
    expect(chip).not.toBeNull();
    // PATHS, not the design's section names: a section-level claim is
    // not file evidence, and T-024 made the identical call already.
    expect(chip.textContent).toContain("docs/NORTH_STAR.md");
    expect(chip.querySelector("svg circle")?.getAttribute("fill")).toBe("var(--review-disc)");
  });

  it("a turn whose activity labels name docs paths produces ZERO chips", async () => {
    await withStatus();
    render(docsWith(1, { "docs/STATE.md": "scaffold" }));
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      { kind: "activity", seq: 2, turn: 1, label: "Write(docs/NORTH_STAR.md)" },
      {
        kind: "completed",
        seq: 3,
        turn: 1,
        text: "I have written docs/NORTH_STAR.md and docs/ROADMAP.md.",
        truncatedRelay: false,
      },
    );
    // Same tree, a later seq: the disk says nothing changed.
    await flush(() => render(docsWith(2, { "docs/STATE.md": "scaffold" })));
    expect(qa("[data-testid=interview-banked]"), "model output banks nothing").toHaveLength(0);
  });

  it("nothing chips before the interview has started", async () => {
    await withStatus();
    render(docsWith(1, { "docs/STATE.md": "a" }));
    await flush(() => render(docsWith(2, { "docs/STATE.md": "b", "docs/NORTH_STAR.md": "n" })));
    expect(qa("[data-testid=interview-banked]")).toHaveLength(0);
  });
});

// ---- what a quiet snapshot costs (T-072 criterion 3) --------------------

describe("a quiet snapshot costs nothing (T-072 criterion 3)", () => {
  /**
   * THE PIN T-057-s2 ASKED FOR, COUNTED RATHER THAN ARGUED.
   *
   * `<Profiler>` calls `onRender` once per COMMIT that includes its
   * subtree, so a state update React BAILS OUT of is invisible to this
   * counter — which is exactly the property being pinned. A new `docs`
   * prop always costs ONE commit, because the element really did change;
   * the question is whether the banking effect then schedules a SECOND
   * one for a value nothing displays.
   *
   * WHY IT IS A DELTA AND NOT AN ABSOLUTE. The mount settles a status
   * pull, an auto-start and a transcript pull, all of them async, and
   * counting from zero would pin those instead. The two deltas are taken
   * after the same settle, one snapshot apart, so everything but the
   * snapshot is held.
   *
   * THE BANKING ARM IS THE POSITIVE CONTROL, and it is not optional: on
   * its own, `quiet: 1` is satisfied just as well by a counter that
   * cannot move at all, by a chat that stopped observing docs, and by a
   * `Profiler` that was never wired up.
   */
  it("a quiet snapshot costs the conversation NO extra render, a banking one costs exactly one", async () => {
    let commits = 0;
    const show = async (docs: DocsModelState): Promise<void> => {
      await act(async () => {
        root.render(
          <Profiler
            id="interview-chat"
            onRender={() => {
              commits += 1;
            }}
          >
            <InterviewChat projectDir={PROJECT} docs={docs} />
          </Profiler>,
        );
      });
    };

    ipc.outcomes.set("genesis_start", { kind: "started", turn: 1 });
    await withStatus();
    await show(docsWith(1, { "docs/STATE.md": "scaffold" }));
    await emit({ kind: "started", seq: 1, turn: 1 });
    // Settle every async answer the mount set going, so the two deltas
    // below differ by the snapshot and by nothing else.
    await flush(() => Promise.resolve());
    await flush(() => Promise.resolve());

    // A QUIET SNAPSHOT — the ordinary case. The watcher's seq advances
    // over a tree in which no docs artifact moved.
    const beforeQuiet = commits;
    await show(docsWith(2, { "docs/STATE.md": "scaffold" }));
    const quiet = commits - beforeQuiet;

    // A BANKING SNAPSHOT — same shape, one file written, one chip.
    const beforeBanking = commits;
    await show(docsWith(3, { "docs/STATE.md": "scaffold", "docs/NORTH_STAR.md": "v" }));
    const banking = commits - beforeBanking;

    expect({ quiet, banking }).toEqual({ quiet: 1, banking: 2 });
    // …and the second commit really was the chip arriving, not noise.
    expect(q("[data-testid=interview-banked]")?.textContent).toContain("docs/NORTH_STAR.md");
  });
});

// ---- the input row -------------------------------------------------------

describe("the input row (criterion 4)", () => {
  beforeEach(async () => {
    await withStatus();
    render();
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      { kind: "completed", seq: 2, turn: 1, text: "Q1?", truncatedRelay: false },
    );
    ipc.invoke.mockClear();
  });

  it("carries the design's placeholder verbatim, and the send hint", () => {
    const box = q("[data-testid=interview-input]") as HTMLTextAreaElement;
    expect(box.getAttribute("placeholder")).toBe(
      'Answer, or say "skip" and I' + String.fromCharCode(39) + "ll mark it an assumption" +
        String.fromCharCode(0x2026),
    );
    expect(q("[data-testid=interview-hint]")?.textContent).toBe(
      String.fromCharCode(0x23ce) + " send " + String.fromCharCode(0x00b7) + " " +
        String.fromCharCode(0x21e7) + String.fromCharCode(0x23ce) + " newline",
    );
  });

  it("Enter sends and Shift+Enter does not", async () => {
    ipc.outcomes.set("genesis_send_turn", { kind: "accepted", turn: 2 });
    await type("Solo builders running agent CLIs.");
    await press("Enter", { shiftKey: true });
    expect(ipc.invoke, "shift-enter is a newline, not a send").not.toHaveBeenCalled();
    await press("Enter");
    expect(ipc.invoke).toHaveBeenCalledWith("genesis_send_turn", {
      text: "Solo builders running agent CLIs.",
    });
  });

  it("the skip convention is TYPED - the app sends the word and nothing else", async () => {
    ipc.outcomes.set("genesis_send_turn", { kind: "accepted", turn: 2 });
    await type("skip");
    await press("Enter");
    // No Skip button and no rewriting: method/roles/planner.md step 2
    // says the planner does the rest.
    expect(ipc.invoke).toHaveBeenCalledWith("genesis_send_turn", { text: "skip" });
    expect(q("[data-testid=interview-skip]"), "no button types a word for you").toBeNull();
  });

  it("an empty or whitespace-only send is a no-op", async () => {
    await type("   ");
    await press("Enter");
    expect(ipc.invoke).not.toHaveBeenCalled();
  });

  it("the accepted answer renders right-aligned, and turn 1 gets no bubble", async () => {
    ipc.outcomes.set("genesis_send_turn", { kind: "accepted", turn: 2 });
    await type("my answer");
    await press("Enter");
    await flush(() => Promise.resolve());
    const bubble = q("[data-testid=interview-user-turn]")!;
    expect(bubble.className).toContain("items-end");
    expect(bubble.textContent).toContain("my answer");
    expect(
      qa("[data-testid=interview-user-turn]"),
      "turn 1's user half is the kickoff, which no command exposes",
    ).toHaveLength(1);
  });

  it("a REFUSED send records no bubble and says what happened", async () => {
    ipc.outcomes.set("genesis_send_turn", { kind: "busy" });
    await type("my answer");
    await press("Enter");
    await flush(() => Promise.resolve());
    expect(qa("[data-testid=interview-user-turn]")).toHaveLength(0);
    expect(q("[data-testid=interview-notice]")?.getAttribute("data-outcome-kind")).toBe("busy");
  });

  /**
   * SINGLE-FLIGHT, DRILLED THE WAY T-049's C3 DID IT: a parked `invoke`,
   * then a burst of Enter presses.
   *
   * The store's own `sending` flag cannot carry this alone, and that is
   * the point - `sendGenesisTurn` sets it only after `invoke` RESOLVES,
   * so between the keypress and the answer the store still reads idle
   * and every press in the burst would pass its guard. The synchronous
   * latch in interview-source.ts is what bounds it. The `disabled`
   * attribute is not the guard either: a keydown can be delivered
   * between state updates, which is exactly what this burst simulates.
   */
  it("an Enter burst against a parked invoke yields EXACTLY ONE command", async () => {
    ipc.parked.add("genesis_send_turn");
    await type("the only answer that should be sent");
    const before = store.getGenesisState();

    await flush(() => {
      const box = q("[data-testid=interview-input]")!;
      for (let i = 0; i < 6; i += 1) {
        box.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
        );
      }
    });

    const sends = ipc.invoke.mock.calls.filter(([c]) => c === "genesis_send_turn");
    expect(sends, "six presses, one command").toHaveLength(1);
    expect(store.getGenesisState(), "and the state is unchanged BY IDENTITY").toBe(before);

    // Released and the turn completed, the next send works - the latch
    // is a gate, not a wall. The turn must actually LAND first: an
    // accepted send leaves a turn in flight, and the store's own
    // `isTurnInFlight` refuses a second answer until it completes, which
    // is the layer the synchronous latch sits on top of rather than
    // replaces.
    await flush(() => {
      ipc.release?.({ kind: "accepted", turn: 2 });
      ipc.release = null;
    });
    ipc.parked.clear();
    await emit({ kind: "completed", seq: 3, turn: 2, text: "Q2?", truncatedRelay: false });
    ipc.outcomes.set("genesis_send_turn", { kind: "accepted", turn: 3 });
    await type("a second answer");
    await press("Enter");
    expect(ipc.invoke.mock.calls.filter(([c]) => c === "genesis_send_turn")).toHaveLength(2);
  });

  it("disables the box and the button in flight, and advertises the stop chord", async () => {
    await emit({ kind: "started", seq: 3, turn: 2 });
    expect((q("[data-testid=interview-input]") as HTMLTextAreaElement).disabled).toBe(true);
    expect((q("[data-testid=interview-bank]") as HTMLButtonElement).disabled).toBe(true);
    // A text swap in a slot the design already has, not a new control.
    expect(q("[data-testid=interview-hint]")?.textContent).toContain("to stop");
  });
});

// ---- failure, retry, resumability ----------------------------------------

describe("a failed turn is calm, inline and never a dead end (criterion 5)", () => {
  async function failWith(error: GenesisEvent & { kind: "failed" }): Promise<void> {
    await withStatus();
    render(docsWith(1, { "docs/STATE.md": "a" }));
    await emit({ kind: "started", seq: 1, turn: 1 });
    await flush(() => render(docsWith(2, { "docs/STATE.md": "a", "docs/NORTH_STAR.md": "n" })));
    await emit(error);
  }

  it("shows the typed variant, its own words and a retry - with no modal anywhere", async () => {
    await failWith({
      kind: "failed",
      seq: 2,
      turn: 1,
      error: { kind: "exitNonZero", code: 1, stderrTail: "API Error: 401 OAuth token revoked." },
    });
    const block = q("[data-testid=interview-failure]")!;
    expect(block.getAttribute("data-error-kind")).toBe("exitNonZero");
    expect(block.textContent).toContain("the planner exited with code 1");
    expect(block.textContent).toContain("API Error: 401 OAuth token revoked.");
    expect(q("[data-testid=interview-retry]")).not.toBeNull();
    expect(container.querySelector("dialog"), "never a modal").toBeNull();
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it("NOTHING BANKED IS LOST - chips emitted before the failure survive it", async () => {
    await failWith({ kind: "failed", seq: 2, turn: 1, error: { kind: "stall" } });
    // A POSITIVE assertion, because "no lost banked docs" is the
    // criterion's own phrase and the absence of a crash is not evidence.
    expect(q("[data-testid=interview-banked]")?.textContent).toContain("docs/NORTH_STAR.md");
  });

  it("the interview stays RESUMABLE: the input re-enables and the retry re-issues", async () => {
    await failWith({ kind: "failed", seq: 2, turn: 1, error: { kind: "startTimeout" } });
    expect((q("[data-testid=interview-input]") as HTMLTextAreaElement).disabled).toBe(false);

    ipc.invoke.mockClear();
    ipc.outcomes.set("genesis_start", { kind: "started", turn: 1 });
    await click("[data-testid=interview-retry]");
    // Turn 1's retry is `genesis_start`, with the same (zero) arguments.
    expect(ipc.invoke).toHaveBeenCalledWith("genesis_start", undefined);
  });

  it("a turn N>=2 retry re-sends the SAME stored answer", async () => {
    await withStatus();
    render();
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      { kind: "completed", seq: 2, turn: 1, text: "Q1?", truncatedRelay: false },
    );
    ipc.outcomes.set("genesis_send_turn", { kind: "accepted", turn: 2 });
    await type("the stored answer");
    await press("Enter");
    await flush(() => Promise.resolve());
    await emit({ kind: "failed", seq: 3, turn: 2, error: { kind: "stall" } });

    ipc.invoke.mockClear();
    await click("[data-testid=interview-retry]");
    expect(ipc.invoke).toHaveBeenCalledWith("genesis_send_turn", { text: "the stored answer" });
  });
});

// ---- a refusal is news, and it is not a failure (T-101) ------------------

/**
 * THE MEASURED TURN, TRANSCRIBED RATHER THAN INVENTED.
 *
 * Both entries are copied field-for-field out of
 * `docs/research/captures/real-planner-turn-2026-08-19.jsonl` — the
 * `system`/`permission_denied` lines 17 and 19 of one authenticated
 * planner turn against CLI 2.1.226. That turn's `result` (line 27) reads
 * `is_error: false`, `terminal_reason: "completed"`, exit 0, and lists
 * BOTH of these `tool_use_id`s under `permission_denials`. So the shape
 * these bodies drive is not a synthetic worst case: it is what the real
 * CLI did, and it is simultaneously the two-refusals-of-one-tool case
 * and the refusals-on-a-turn-that-completes case.
 *
 * The capture is PRETTY-PRINTED JSON, one object per line with spaces
 * after its colons, so a compact-JSON grep over it finds nothing; these
 * literals were produced by parsing it, not by eyeballing it.
 */
const REFUSED_COMPOUND = {
  toolName: "Bash",
  toolUseId: "toolu_01FAHQKCKFrBLrmVtRiuLT9L",
  message:
    "This Bash command contains multiple operations. The following part requires approval: KIT=.nputer/genesis/kit && mkdir -p docs/decisions docs/tasks docs/rooms && cp \"$KIT\"/docs-templates/*.md docs/ && cp \"$KIT\"/adapters/CLAUDE.md \"$KIT\"/adapters/AGENTS.md . && cp \"$KIT\"/runtime/nputer.yaml .nputer/nputer.yaml && printf '.nputer/\\n' && git init -q 2>&1; git status --short; find . -path ./.git -prune -o -type f -print",
} as const;

const REFUSED_GLOB = {
  toolName: "Bash",
  toolUseId: "toolu_0173K9Q72m797nLBonDtrc3R",
  message:
    "Glob patterns are not allowed in write operations. Please specify an exact file path.",
} as const;

describe("a refusal is visible when it happens, and it is not a failure (T-101)", () => {
  const ids = (): (string | null)[] =>
    qa("[data-testid=interview-denial]").map((row) =>
      row.getAttribute("data-tool-use-id"),
    );

  it("THE MEASURED TURN: two refusals of the SAME tool both appear, in order, and the turn still reads COMPLETED", async () => {
    await withStatus();
    render();
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      { kind: "denied", seq: 2, turn: 1, ...REFUSED_COMPOUND },
      { kind: "denied", seq: 3, turn: 1, ...REFUSED_GLOB },
      {
        kind: "completed",
        seq: 4,
        turn: 1,
        text: "Scaffolded the docs tree with explicit paths instead.",
        truncatedRelay: false,
      },
    );

    // TWO ROWS, NOT ONE. A renderer that deduped by tool name would show
    // a single `Bash` here and drop a refusal the CLI actually reported.
    const rows = qa("[data-testid=interview-denial]");
    expect(rows, "one row per refusal, never per tool").toHaveLength(2);
    for (const row of rows) expect(row.textContent).toContain("Bash");

    // `toolUseId` is what tells them apart, and the ORDER is the order
    // the user was told — the two `Denied` events are EMITTED in their
    // own classification arm rather than buffered like a delta, so their
    // relative order is the CLI's own (T-081-s5 / T-092).
    expect(ids()).toEqual([
      "toolu_01FAHQKCKFrBLrmVtRiuLT9L",
      "toolu_0173K9Q72m797nLBonDtrc3R",
    ]);
    expect(rows[0]!.textContent).toContain("contains multiple operations");
    expect(rows[1]!.textContent).toContain("Glob patterns are not allowed");

    // ...AND THE TURN COMPLETED. Both facts in one body, because that is
    // the case the capture recorded and the pair is what makes "a denial
    // is not a failure" a measurement rather than a claim.
    const turn = q("[data-testid=interview-planner-turn]")!;
    expect(turn.getAttribute("data-status")).toBe("completed");
    expect(turn.textContent).toContain("Scaffolded the docs tree");
    expect(q("[data-testid=interview-failure]"), "never the failure treatment").toBeNull();
    expect(q("[data-testid=interview-streaming]"), "and the turn really has ended").toBeNull();
    // The rows survived the landing they were not part of.
    expect(q("[data-testid=interview-denials]")!.getAttribute("data-count")).toBe("2");
  });

  it("the refusal is on screen WHILE the turn runs, and no later render drops it", async () => {
    await withStatus();
    render();
    await emit({ kind: "started", seq: 1, turn: 1 });
    await emit({ kind: "denied", seq: 2, turn: 1, ...REFUSED_GLOB });

    // AT ARRIVAL — and the pulse dot beside it is the proof this is
    // mid-turn rather than the turn's ending being rendered. Before
    // T-101 nothing rendered this field at all, so the user learned of a
    // refusal only when the turn ended, which on the measured run was
    // roughly forty seconds later.
    expect(q("[data-testid=interview-streaming]"), "the turn is still running").not.toBeNull();
    expect(q("[data-testid=interview-denial]")?.textContent).toContain(
      "Glob patterns are not allowed",
    );

    // A WITNESS THAT IS EMITTED, NOT BUFFERED (T-092, absorbing
    // T-081-s5): `activity` is emitted inside its own classification arm,
    // so it can date the refusal above; a `textDelta` rides `pending` in
    // the runner and therefore dates nothing.
    await emit({ kind: "activity", seq: 3, turn: 1, label: "Write(docs/NORTH_STAR.md)" });
    expect(q("[data-testid=interview-streaming]")!.textContent).toContain(
      "Write(docs/NORTH_STAR.md)",
    );
    // Presence FIRST, then text: a mutant that drops the notice once an
    // activity marker arrives (the arrival-only bug) reds crisply here —
    // "expected null not to be null" — rather than throwing on a
    // `toContain` over an undefined. This is the render the "survives a
    // later render" criterion names, and an arrival-only body asserting
    // only before this activity would pass the very mutant that reds it.
    const afterActivity = q("[data-testid=interview-denial]");
    expect(afterActivity, "the furniture moved and the refusal did not").not.toBeNull();
    expect(afterActivity!.textContent).toContain("Glob patterns are not allowed");

    // ...and after a subsequent delta, which is the render the criterion
    // names. One refusal is still exactly one row.
    await emit({ kind: "textDelta", seq: 4, turn: 1, text: "carrying on without it" });
    expect(q("[data-testid=interview-turn-body]")!.textContent).toContain(
      "carrying on without it",
    );
    expect(qa("[data-testid=interview-denial]")).toHaveLength(1);
    expect(ids()).toEqual(["toolu_0173K9Q72m797nLBonDtrc3R"]);
  });

  it("a refusal with no tool name or no message still reads, and prints neither \"undefined\" nor \"null\"", async () => {
    await withStatus();
    render();
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      // Row 0 is the doubly-degenerate case, row 2 the blank-message one
      // — which is exactly how a refusal recovered from the cumulative
      // `result` line arrives, since that line carries `tool_input` and
      // never a message. ROW 1 IS THE POSITIVE CONTROL between them: a
      // fully-populated denial, so "a tool" and "the CLI gave no reason"
      // are demonstrably the FALLBACKS and not what this renderer prints
      // for everything. Its three tool names are deliberately distinct,
      // which keeps this body silent about deduplication — that is the
      // measured turn's body to own, one case up.
      { kind: "denied", seq: 2, turn: 1, toolName: null, toolUseId: null, message: "" },
      {
        kind: "denied",
        seq: 3,
        turn: 1,
        toolName: "Bash",
        toolUseId: "toolu_named",
        message: "Glob patterns are not allowed in write operations.",
      },
      {
        kind: "denied",
        seq: 4,
        turn: 1,
        toolName: "WebFetch",
        toolUseId: null,
        message: "   ",
      },
      // Landed, so this body says nothing about liveness either.
      { kind: "completed", seq: 5, turn: 1, text: "Q?", truncatedRelay: false },
    );

    const rows = qa("[data-testid=interview-denial]");
    expect(rows).toHaveLength(3);
    // SOMETHING A HUMAN CAN READ in each case — asserted positively,
    // because "no 'null' on screen" is equally satisfied by rendering
    // nothing at all.
    expect(rows[0]!.textContent).toBe("refused: a tool — the CLI gave no reason");
    expect(rows[1]!.textContent).toBe(
      "refused: Bash — Glob patterns are not allowed in write operations.",
    );
    expect(rows[2]!.textContent).toBe("refused: WebFetch — the CLI gave no reason");

    // THE ASSERTION THE CARD NAMES, over the whole rendered subtree and
    // its ATTRIBUTES, not only its text: a missing `toolUseId` becomes an
    // empty attribute rather than the four letters of its absence.
    const notice = q("[data-testid=interview-denials]")!;
    expect(notice.outerHTML).not.toContain("undefined");
    expect(notice.outerHTML).not.toContain("null");
    expect(ids()).toEqual(["", "toolu_named", ""]);
  });

  it("a turn that DIES of a refusal states it ONCE — and only THAT block takes the notice away", async () => {
    await withStatus();
    render();
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      { kind: "denied", seq: 2, turn: 1, ...REFUSED_COMPOUND },
      { kind: "denied", seq: 3, turn: 1, ...REFUSED_GLOB },
    );
    // NO MID-TURN READING IS TAKEN HERE ON PURPOSE. That the notice is
    // on screen while the turn runs is the body above's whole property,
    // and re-asserting it here would make one liveness-gating mutant
    // kill both bodies and leave neither isolating anything. The
    // positive control this body's negative needs is turn 2 below.
    await emit({
      kind: "failed",
      seq: 4,
      turn: 1,
      error: {
        kind: "toolDenied",
        denials: ["Bash", "Bash"],
        terminalReason: "error_during_execution",
      },
    });

    // The terminal block IS this refusal, named as the turn's cause of
    // death. Two surfaces for one event is what T-081's criterion 4
    // forbids on the runner's side; it forbids it here too.
    const dead = q("[data-testid=interview-planner-turn][data-turn='1']")!;
    expect(
      dead.querySelector("[data-testid=interview-failure]")!.getAttribute("data-error-kind"),
    ).toBe("toolDenied");
    expect(dead.textContent).toContain("the planner was refused a tool it needed");
    expect(
      dead.querySelector("[data-testid=interview-denials]"),
      "the same refusal is not also a second, quieter event",
    ).toBeNull();

    // THE POSITIVE CONTROL, on its own turn and in the same body because
    // the negative above is worthless without it: a rule that dropped the
    // notice on ANY failure would satisfy that assertion equally, and
    // would lose the refusal on every turn that dies of something else. A
    // stall says nothing about refusals, so the notice stands beside it.
    await emit(
      { kind: "started", seq: 5, turn: 2 },
      { kind: "denied", seq: 6, turn: 2, ...REFUSED_GLOB },
      { kind: "failed", seq: 7, turn: 2, error: { kind: "stall" } },
    );
    const stalled = q("[data-testid=interview-planner-turn][data-turn='2']")!;
    expect(
      stalled.querySelector("[data-testid=interview-failure]")!.getAttribute("data-error-kind"),
    ).toBe("stall");
    expect(stalled.textContent).toContain("the planner stopped mid-answer");
    expect(
      stalled.querySelector("[data-testid=interview-denial]")?.textContent,
    ).toContain("Glob patterns are not allowed");
    // ...and turn 1 did not gain one back on turn 2's account.
    expect(dead.querySelector("[data-testid=interview-denials]")).toBeNull();
  });
});

// ---- the CLI-missing fallback --------------------------------------------

describe("no CLI is a route, never a dead end (criterion 6)", () => {
  it("names the typed probed binaries and the project path, and offers the hand-driven route", async () => {
    ipc.outcomes.set("genesis_start", { kind: "cliNotFound", probed: ["claude"] });
    await withStatus();
    render();
    await flush(() => Promise.resolve());

    const card = q("[data-testid=interview-cli-missing]")!;
    expect(card).not.toBeNull();
    expect(q("[data-testid=interview-cli-probed]")?.textContent).toBe("claude");
    expect(q("[data-testid=interview-cli-project]")?.textContent).toBe(PROJECT);
    expect(card.textContent).toContain("hand-drivable");

    // The card does not SHOW the kickoff until it is asked for — a wall
    // of prompt text over a recoverable failure would be the screen
    // deciding the user has given up. T-029 puts it behind the button
    // below, and `interview-chat-handdriven.test.tsx` drives that route.
    expect(card.textContent).not.toContain("KIT ROOT");
    expect(card.textContent).not.toContain("roles/planner.md");
    // …but the route EXISTS now, which is criterion 4's whole point: a
    // missing CLI is a mode, not an apology.
    expect(q("[data-testid=interview-cli-hand-driven]")).not.toBeNull();
  });

  it("renders every other typed outcome as an inline notice carrying its own fields", async () => {
    ipc.outcomes.set("genesis_start", { kind: "staleProject", sessionProject: "/elsewhere" });
    await withStatus();
    render();
    await flush(() => Promise.resolve());
    const notice = q("[data-testid=interview-notice]")!;
    expect(notice.getAttribute("data-outcome-kind")).toBe("staleProject");
    expect(notice.textContent).toContain("/elsewhere");
  });
});

// ---- hostile content -----------------------------------------------------

describe("hostile model output renders as text nodes only (criterion 7)", () => {
  it("injects nothing through turn text, activity labels, refusal notices, stderr tails or chip paths", async () => {
    await withStatus();
    render(docsWith(1, {}));
    await emit({ kind: "started", seq: 1, turn: 1 });
    // EVERY string channel this screen renders, hostile at once.
    await flush(() => {
      render(docsWith(2, { ["docs/" + HOSTILE.slice(0, 76) + ".md"]: "x" }));
    });
    await emit(
      { kind: "activity", seq: 2, turn: 1, label: HOSTILE },
      // T-101's channel: the CLI's own refusal text, plus the two fields
      // that reach the DOM as an ATTRIBUTE rather than as a text node.
      // `exitNonZero` below is deliberately not `toolDenied`, so the
      // notice is still mounted when the sweep runs.
      {
        kind: "denied",
        seq: 3,
        turn: 1,
        toolName: HOSTILE,
        toolUseId: HOSTILE,
        message: HOSTILE,
      },
      { kind: "textDelta", seq: 4, turn: 1, text: HOSTILE },
      {
        kind: "failed",
        seq: 5,
        turn: 1,
        error: { kind: "exitNonZero", code: 1, stderrTail: HOSTILE },
      },
    );
    // The refusal channel is really on screen for the sweep below to
    // see, and BOTH its halves carry the bytes — `refused: <name> —
    // <the CLI's own words>` is two independent strings, so counting
    // rather than merely containing is what stops a renderer that
    // mangles one of them from passing on the strength of the other.
    // (Measured: a mutant stripping angle brackets from the message
    // alone left a `toContain` here GREEN across the whole suite.)
    const refusal = q("[data-testid=interview-denial]")!;
    expect(
      (refusal.textContent!.match(/<script>alert\('xss'\)<\/script>/g) ?? []).length,
      "the refused tool's NAME and the CLI's own WORDS both reach the DOM intact",
    ).toBe(2);

    // Nothing injected, anywhere on the screen.
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    // Nor a comment NODE - one would prove markup had been parsed.
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_COMMENT);
    expect(walker.nextNode(), "no comment node was ever created").toBeNull();
    // And no event-handler attribute reached any element at all.
    for (const el of Array.from(container.querySelectorAll("*"))) {
      for (const attr of Array.from(el.attributes)) {
        expect(attr.name.startsWith("on"), attr.name + " on <" + el.tagName + ">").toBe(false);
      }
    }

    // The bytes ARE on screen, as text - control characters and the RTL
    // override included, unmangled.
    const text = container.textContent ?? "";
    expect(text).toContain("<script>alert('xss')</script>");
    expect(text).toContain("<img src=x onerror=alert(1)>");
    expect(text).toContain("<!-- swallowed? -->");
    expect(text.includes(RTL), "the RTL override survives as data").toBe(true);
    expect(text.includes(C0), "the three C0 bytes survive as data").toBe(true);
  });

  it("renders a 10 000-character turn whole rather than truncating it silently", async () => {
    await withStatus();
    render();
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      { kind: "completed", seq: 2, turn: 1, text: HOSTILE, truncatedRelay: false },
    );
    const body = q("[data-testid=interview-turn-body]")!;
    expect(body.textContent?.length).toBeGreaterThanOrEqual(10_000);
    expect(body.textContent).toContain("A".repeat(10_000));
  });

  it("renders markdown as the literal bytes the planner sent (the no-markdown fence)", async () => {
    await withStatus();
    render();
    const markdown = "**bold** and [a link](http://x) and\n```\nfenced\n```";
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      { kind: "completed", seq: 2, turn: 1, text: markdown, truncatedRelay: false },
    );
    const body = q("[data-testid=interview-turn-body]")!;
    expect(body.textContent).toBe(markdown);
    expect(body.querySelector("strong"), "no bold").toBeNull();
    expect(body.querySelector("a"), "no link").toBeNull();
    expect(body.querySelector("code"), "no code block").toBeNull();
  });

  it("keeps model-keyed collections off plain objects (ADR-009)", async () => {
    // Chips are keyed by PATH - a string the app did not author - so the
    // chip store is a Map and its payload an array, never an object
    // literal. Driven rather than read off the source: a `__proto__`
    // path renders as a path and pollutes nothing.
    await withStatus();
    render(docsWith(1, {}));
    await emit({ kind: "started", seq: 1, turn: 1 });
    await flush(() => {
      render(docsWith(2, { "docs/__proto__.md": "x", "docs/constructor.md": "y" }));
    });
    expect(q("[data-testid=interview-banked]")?.textContent).toContain("docs/__proto__.md");
    expect(({} as Record<string, unknown>)["polluted"], "no prototype was touched").toBe(
      undefined,
    );
    expect(Object.prototype.hasOwnProperty.call({}, "docs/__proto__.md")).toBe(false);
  });
});

// ---- reduced motion ------------------------------------------------------

describe("motion has a static equivalent (criterion 8)", () => {
  it("the streaming dot is motion-safe, and nothing animates unconditionally", async () => {
    await withStatus();
    render();
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      { kind: "textDelta", seq: 2, turn: 1, text: "thinking" },
    );
    const dot = q("[data-testid=interview-streaming] span[aria-hidden=true]")!;
    expect(dot.className).toContain("motion-safe:animate-status-pulse");
    // The existing mechanism, unchanged - T-024's exact form. A bare
    // `animate-status-pulse` anywhere would ignore the OS setting.
    for (const el of qa("*")) {
      expect(
        /(^|\s)animate-status-pulse/.test(el.className ?? ""),
        "no unconditional pulse",
      ).toBe(false);
    }
  });

  it("the dot and the activity line go when the turn lands", async () => {
    await withStatus();
    render();
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      { kind: "activity", seq: 2, turn: 1, label: "Write" },
    );
    expect(q("[data-testid=interview-streaming]")?.textContent).toContain("Write");
    await emit({ kind: "completed", seq: 3, turn: 1, text: "done", truncatedRelay: false });
    expect(q("[data-testid=interview-streaming]")).toBeNull();
  });

  it("a relay that hit its cap says so, without claiming the turn was cut", async () => {
    await withStatus();
    render();
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      { kind: "completed", seq: 2, turn: 1, text: "the whole answer", truncatedRelay: true },
    );
    expect(q("[data-testid=interview-truncated]")?.textContent).toContain("1 MiB cap");
  });
});

// ---- the answer box keeps the keyboard (criterion 6, folding T-027-s1) ---

/**
 * THE DEFECT: `disabled` blurs a focused element (HTML spec), and nothing
 * gave the focus back — so answering seven questions in a row meant
 * reaching for the mouse seven times, on the one screen whose whole
 * premise is a conversation.
 *
 * WHAT JSDOM CANNOT DO, measured rather than assumed, because it is the
 * difference between these tests and vacuous ones: **jsdom does not
 * implement the disable→blur rule at all**. A textarea focused here stays
 * `document.activeElement` after `disabled = true`, so a test that merely
 * typed, pressed ⏎ and asserted "still focused" would pass against the
 * BROKEN code and prove nothing. So the browser's blur is performed
 * EXPLICITLY below (`box.blur()`, marked at each site), which puts jsdom
 * in the state a real browser reaches on its own — and the real thing,
 * with real trusted keys and a real browser, is asserted in the lane
 * (`tools/e2e/tests/interview.spec.ts`, where T-027's `not.toBeFocused()`
 * tripwire is INVERTED and its compensating re-click deleted).
 */
describe("the answer box takes the focus back (criterion 6)", () => {
  const boxOf = (): HTMLTextAreaElement =>
    q("[data-testid=interview-input]") as HTMLTextAreaElement;

  /**
   * The state a real browser reaches when the focused answer box is
   * disabled: focus falls back to `document.body`.
   *
   * MEASURED, because jsdom offers no straight road to it: `blur()` on a
   * DISABLED element is refused (it is no longer a focusable area) and
   * `document.body.focus()` is a no-op. Focusing a throwaway element and
   * removing it is the one route that lands on `BODY`, which is the exact
   * end state under test — and reaching it deliberately is what keeps
   * these assertions from passing against the broken code.
   */
  const dropFocusToBody = async (): Promise<void> => {
    await flush(() => {
      const sink = document.createElement("input");
      container.appendChild(sink);
      sink.focus();
      sink.remove();
    });
    expect(document.activeElement, "the browser's disable-blur, simulated").toBe(document.body);
  };

  beforeEach(async () => {
    await withStatus();
    render();
    await emit(
      { kind: "started", seq: 1, turn: 1 },
      { kind: "completed", seq: 2, turn: 1, text: "Q1?", truncatedRelay: false },
    );
    ipc.invoke.mockClear();
  });

  it("a turn sent from the box gives the box its focus back when the turn lands", async () => {
    ipc.parked.add("genesis_send_turn");
    boxOf().focus();
    expect(document.activeElement, "the user is typing in the box").toBe(boxOf());
    await type("Solo builders running agent CLIs.");
    await press("Enter");

    // In flight: the box is disabled and — in a real browser — blurred,
    // with the focus falling back to the document body. jsdom refuses
    // `blur()` on a disabled element (it is no longer a focusable area),
    // so the fallback is performed directly, which is the state a browser
    // arrives at on its own.
    expect(boxOf().disabled, "the box still disables in flight (T-027 c4)").toBe(true);
    await dropFocusToBody();
    expect(document.activeElement, "the send blurred the box").not.toBe(boxOf());

    // The turn lands.
    await flush(() => {
      ipc.release?.({ kind: "accepted", turn: 2 });
      ipc.release = null;
    });
    ipc.parked.clear();
    await emit({ kind: "completed", seq: 3, turn: 2, text: "Q2?", truncatedRelay: false });

    expect(boxOf().disabled, "the box is answerable again").toBe(false);
    expect(document.activeElement, "…and the keyboard is back in it").toBe(boxOf());
  });

  it("focus moved elsewhere DURING the turn is not stolen back", async () => {
    // Anything else in the app the user might have tabbed to.
    const elsewhere = document.createElement("button");
    elsewhere.setAttribute("data-testid", "somewhere-else");
    container.appendChild(elsewhere);

    ipc.parked.add("genesis_send_turn");
    boxOf().focus();
    await type("an answer");
    await press("Enter");
    await dropFocusToBody(); // the browser's own disable→blur
    await flush(() => {
      elsewhere.focus(); // …and then the user goes somewhere else
    });
    expect(document.activeElement).toBe(elsewhere);

    await flush(() => {
      ipc.release?.({ kind: "accepted", turn: 2 });
      ipc.release = null;
    });
    ipc.parked.clear();
    await emit({ kind: "completed", seq: 3, turn: 2, text: "Q2?", truncatedRelay: false });

    expect(
      document.activeElement,
      "the focus the user moved is theirs; the box must not yank it back",
    ).toBe(elsewhere);
    expect(document.activeElement).not.toBe(boxOf());
    elsewhere.remove();
  });

  it("a send from the BANK BUTTON leaves the focus on the button", async () => {
    ipc.parked.add("genesis_send_turn");
    await type("an answer");
    const bank = q("[data-testid=interview-bank]") as HTMLButtonElement;
    // A real click focuses the control it hits; a synthetic MouseEvent
    // does not, so the focus is placed the way the browser would.
    bank.focus();
    expect(document.activeElement).toBe(bank);
    await click("[data-testid=interview-bank]");

    await dropFocusToBody(); // in flight the button disables too, and blurs
    await flush(() => {
      ipc.release?.({ kind: "accepted", turn: 2 });
      ipc.release = null;
    });
    ipc.parked.clear();
    await emit({ kind: "completed", seq: 3, turn: 2, text: "Q2?", truncatedRelay: false });

    expect(
      document.activeElement,
      "the box was never focused, so there is nothing to give back",
    ).not.toBe(boxOf());
  });

  it("an empty send arms nothing — the box does not grab focus off a no-op", async () => {
    const elsewhere = document.createElement("button");
    container.appendChild(elsewhere);
    elsewhere.focus();
    await type("   ");
    await press("Enter");
    await flush(() => Promise.resolve());
    expect(ipc.invoke, "nothing was sent").not.toHaveBeenCalled();
    expect(document.activeElement, "…so nothing moved").toBe(elsewhere);
    elsewhere.remove();
  });
});
