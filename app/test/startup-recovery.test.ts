// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * T-050 at the store: the startup latch, and the two ways startup can
 * fail.
 *
 * THE DEFECT, reproduced here before it was fixed and pinned here so it
 * cannot come back. `startDocsWatcher` used to open
 * `if (started) return; started = true;` ABOVE both of its awaits, and
 * nothing reset `started` anywhere. So one rejection from `listen` or
 * `invoke` left the latch closed with `phase` still `"loading"`, and
 * every later call — including one made after the boundary had
 * recovered — returned at the guard without touching IPC at all. That is
 * a permanent strand from a transient failure, and it is what @human
 * hit: "waiting for the first docs snapshot…" with nothing on screen but
 * a theme toggle. Measured against the unfixed code, both cases:
 *
 *   REJECTING listen  -> {"phase":"loading","listenCalls":1,"invokeCalls":0}
 *   ...two more calls -> {"phase":"loading","listenCalls":1,"invokeCalls":0}
 *   REJECTING invoke  -> {"phase":"loading","listenCalls":1,"invokeCalls":1}
 *   ...one more call  -> {"phase":"loading","listenCalls":1,"invokeCalls":1}
 *
 * The fix has to keep the old code's ONE virtue while removing its
 * defect, and the two pull against each other: a latch set before the
 * awaits is StrictMode-safe but unretryable, while a latch set after
 * them is retryable but lets React's double-effect open two
 * subscriptions. Both properties are asserted here — by COUNTING
 * `listen` calls, never by reading outcomes, because the store's
 * downstream identity guards would hide a duplicate subscription behind
 * an identical-looking state.
 */

const ipc = vi.hoisted(() => ({
  listenCalls: 0,
  invokeCalls: 0,
  /** Flip these to make the boundary refuse, and flip them back to make
   * it heal — which is what a transient IPC failure IS. */
  listenRejects: false,
  invokeRejects: false,
  /** The `docs-changed` handler the store registered, so a test can push
   * a snapshot the way the watcher would. */
  onDocsChanged: null as null | ((event: { payload: unknown }) => void),
  status: { kind: "noProject" } as unknown,
  pickOutcome: { kind: "cancelled" } as unknown,
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (command: string) => {
    if (command === "docs_snapshot") {
      ipc.invokeCalls += 1;
      return ipc.invokeRejects
        ? Promise.reject(new Error("docs_snapshot: the command was refused"))
        : Promise.resolve(ipc.status);
    }
    return Promise.resolve(ipc.pickOutcome);
  },
}));
vi.mock("@tauri-apps/api/event", () => ({
  emit: () => Promise.resolve(),
  listen: (_name: string, handler: (event: { payload: unknown }) => void) => {
    ipc.listenCalls += 1;
    if (ipc.listenRejects) return Promise.reject(new Error("listen: the event channel refused"));
    ipc.onDocsChanged = handler;
    return Promise.resolve(() => {});
  },
}));

type StoreModule = typeof import("../src/lib/watcher-store");

const SNAPSHOT = {
  seq: 1,
  projectDir: "/tmp/a-real-project",
  generatedAtMs: 1_700_000_000_000,
  files: [
    {
      path: "docs/tasks/T-901-alpha.md",
      content:
        "---\nid: T-901\ntitle: Alpha\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: S\nstatus: building\n---\n",
    },
  ],
};

/** A FRESH store under a Tauri runtime: `isTauri` and the latch are both
 * module-level, so this is the only honest way to run more than one
 * startup narrative in a file. */
async function freshStore(): Promise<StoreModule> {
  vi.resetModules();
  (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
  ipc.listenCalls = 0;
  ipc.invokeCalls = 0;
  ipc.onDocsChanged = null;
  ipc.listenRejects = false;
  ipc.invokeRejects = false;
  ipc.status = { kind: "noProject" };
  ipc.pickOutcome = { kind: "cancelled" };
  return import("../src/lib/watcher-store");
}

let errors: unknown[][];

beforeEach(() => {
  // The failure path logs; capture it rather than letting it shout
  // through the run, and assert on it in its own test.
  errors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    errors.push(args);
  });
  delete window.__nputerShellHarness;
  delete window.__nputerDocsHarness;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  delete window.__nputerShellHarness;
  delete window.__nputerDocsHarness;
});

// ---- criterion 1 + 4: a failed attempt is retryable --------------------

describe("a rejecting listen leaves the app RECOVERABLE (criterion 4)", () => {
  it("records the failure, keeps phase loading, and the SCREEN stops claiming it is waiting", async () => {
    const store = await freshStore();
    ipc.listenRejects = true;

    await store.startDocsWatcher();

    expect(ipc.listenCalls, "the boundary really was reached").toBe(1);
    expect(ipc.invokeCalls, "and the second await never ran").toBe(0);
    const shell = store.getShellState();
    expect(shell.phase).toBe("loading");
    expect(shell.starting).toBe(false);
    expect(shell.startupFailure).toEqual({
      step: "subscribe",
      message: "Error: listen: the event channel refused",
      attempt: 1,
    });
    // The whole of layer 3: the screen SAYS it failed instead of going on
    // claiming it is waiting for a snapshot that is never coming.
    expect(store.selectScreen(shell)).toEqual({
      screen: "startupFailed",
      failure: shell.startupFailure,
    });
  });

  it("a retry genuinely RE-SUBSCRIBES and reaches the board", async () => {
    const store = await freshStore();
    ipc.listenRejects = true;
    await store.startDocsWatcher();
    expect(ipc.listenCalls).toBe(1);

    // The transient failure is over; the boundary would answer now. On
    // the unfixed code this call returned at `if (started) return;` and
    // listenCalls stayed at 1 forever.
    ipc.listenRejects = false;
    ipc.status = { kind: "open", snapshot: SNAPSHOT };
    await store.startDocsWatcher();

    expect(ipc.listenCalls, "the retry really re-subscribed").toBe(2);
    expect(ipc.invokeCalls, "and pulled the status it never got to pull").toBe(1);
    const shell = store.getShellState();
    expect(shell.phase).toBe("open");
    expect(shell.startupFailure, "a successful attempt clears the failure").toBeNull();
    expect(store.selectScreen(shell)).toEqual({ screen: "board" });
    expect(shell.docs.model.tasks.map((t) => t.id)).toEqual(["T-901"]);
  });

  it("the PICKER is an escape too: a successful pick leaves the failure screen", async () => {
    const store = await freshStore();
    ipc.listenRejects = true;
    await store.startDocsWatcher();
    expect(store.selectScreen(store.getShellState()).screen).toBe("startupFailed");

    // Criterion 3's other route, driven through the shipped picker.
    ipc.pickOutcome = { kind: "picked", snapshot: SNAPSHOT };
    await store.pickProjectFolder();

    const shell = store.getShellState();
    expect(shell.phase).toBe("open");
    expect(store.selectScreen(shell), "the escape ARRIVES somewhere").toEqual({
      screen: "board",
    });
  });
});

describe("a rejecting invoke leaves the app RECOVERABLE (criterion 4)", () => {
  it("records the snapshot step, and the subscription that DID succeed is not lost", async () => {
    const store = await freshStore();
    ipc.invokeRejects = true;

    await store.startDocsWatcher();

    expect(ipc.listenCalls).toBe(1);
    expect(ipc.invokeCalls).toBe(1);
    const shell = store.getShellState();
    expect(shell.phase).toBe("loading");
    expect(shell.startupFailure).toEqual({
      step: "snapshot",
      message: "Error: docs_snapshot: the command was refused",
      attempt: 1,
    });
    expect(store.selectScreen(shell).screen).toBe("startupFailed");
    // Worth pinning because it is the honest difference between the two
    // failures: `listen` succeeded, so the watcher is live and a file
    // change can still bring the app up with no retry at all.
    expect(ipc.onDocsChanged, "the subscription survived the failed pull").not.toBeNull();
    ipc.onDocsChanged?.({ payload: SNAPSHOT });
    expect(store.getShellState().phase).toBe("open");
    expect(store.selectScreen(store.getShellState()).screen).toBe("board");
  });

  it("a retry genuinely RE-PULLS and reaches the board", async () => {
    const store = await freshStore();
    ipc.invokeRejects = true;
    await store.startDocsWatcher();
    expect(ipc.invokeCalls).toBe(1);

    ipc.invokeRejects = false;
    ipc.status = { kind: "open", snapshot: SNAPSHOT };
    await store.startDocsWatcher();

    expect(ipc.invokeCalls, "the retry really re-pulled").toBe(2);
    expect(store.getShellState().phase).toBe("open");
    expect(store.selectScreen(store.getShellState())).toEqual({ screen: "board" });
  });

  it("a retry that fails AGAIN says so — the attempt count is the difference", async () => {
    const store = await freshStore();
    ipc.invokeRejects = true;
    await store.startDocsWatcher();
    expect(store.getShellState().startupFailure?.attempt).toBe(1);

    await store.startDocsWatcher();
    expect(ipc.invokeCalls, "the second attempt really ran").toBe(2);
    expect(store.getShellState().startupFailure?.attempt).toBe(2);

    ipc.invokeRejects = false;
    await store.startDocsWatcher();
    expect(store.getShellState().startupFailure).toBeNull();
    expect(store.getShellState().phase).toBe("noProject");
  });
});

// ---- criterion 1: StrictMode safety, kept -----------------------------

describe("the latch: single-flight AND retryable (criterion 1)", () => {
  it("StrictMode's double-effect starts exactly ONE subscription", async () => {
    const store = await freshStore();
    // Two synchronous calls, neither awaited — React's double-invoked
    // effect, exactly. The count is the claim: outcomes cannot
    // discriminate here, because a second subscription applying the same
    // snapshot is dropped by `reduceDocs`'s seq guard and looks
    // identical from outside.
    const a = store.startDocsWatcher();
    const b = store.startDocsWatcher();
    expect(b, "a concurrent caller gets the attempt already in flight").toBe(a);
    await Promise.all([a, b]);

    expect(ipc.listenCalls, "exactly one subscription").toBe(1);
    expect(ipc.invokeCalls, "and exactly one status pull").toBe(1);
  });

  it("a second call arriving MID-FLIGHT starts no second subscription, even when the first fails", async () => {
    const store = await freshStore();
    ipc.listenRejects = true;
    // Both calls are made before either can settle.
    const first = store.startDocsWatcher();
    const second = store.startDocsWatcher();
    const third = store.startDocsWatcher();
    expect(second).toBe(first);
    expect(third).toBe(first);
    await Promise.all([first, second, third]);

    expect(ipc.listenCalls, "three calls, one subscription attempt").toBe(1);
    expect(store.getShellState().startupFailure?.attempt).toBe(1);

    // ...and once it HAS failed, the latch is open again: the next call
    // re-attempts for real. Retryable and single-flight, both.
    ipc.listenRejects = false;
    await store.startDocsWatcher();
    expect(ipc.listenCalls).toBe(2);
    expect(store.getShellState().phase).toBe("noProject");
  });

  it("the happy path latches exactly once — later calls are no-ops (criterion 4)", async () => {
    const store = await freshStore();
    await store.startDocsWatcher();
    expect(ipc.listenCalls).toBe(1);
    expect(ipc.invokeCalls).toBe(1);

    // Six more calls, sequential and concurrent, long after success.
    await store.startDocsWatcher();
    await store.startDocsWatcher();
    await Promise.all([
      store.startDocsWatcher(),
      store.startDocsWatcher(),
      store.startDocsWatcher(),
      store.startDocsWatcher(),
    ]);

    expect(ipc.listenCalls, "a succeeded startup never re-subscribes").toBe(1);
    expect(ipc.invokeCalls, "nor re-pulls").toBe(1);
    expect(store.getShellState().phase).toBe("noProject");
  });

  it("`starting` is single-flight state, and it is true only while an attempt runs", async () => {
    const store = await freshStore();
    const seen: boolean[] = [];
    const unsubscribe = store.subscribeShell(() => seen.push(store.getShellState().starting));
    expect(store.getShellState().starting, "nothing has started yet").toBe(false);

    const attempt = store.startDocsWatcher();
    expect(store.getShellState().starting, "synchronously true — before any await resumes").toBe(
      true,
    );
    await attempt;
    expect(store.getShellState().starting).toBe(false);
    unsubscribe();
    expect(seen[0]).toBe(true);
    expect(seen[seen.length - 1]).toBe(false);
  });
});

// ---- criterion 2: surfaced, never swallowed ---------------------------

describe("the rejection is surfaced, not swallowed (criterion 2)", () => {
  it("startDocsWatcher RESOLVES on failure — the failure is state, not an unhandled promise", async () => {
    const store = await freshStore();
    ipc.listenRejects = true;
    const unhandled: unknown[] = [];
    const onUnhandled = (event: Event): void => {
      unhandled.push(event);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", onUnhandled);

    // The App's call site is `void startDocsWatcher()`, with nothing to
    // catch a rejection. That is only safe because the callee never
    // rejects — asserted here rather than assumed.
    await expect(store.startDocsWatcher()).resolves.toBeUndefined();
    await new Promise((resolve) => setTimeout(resolve, 10));

    window.removeEventListener("unhandledrejection", onUnhandled);
    expect(unhandled, "a swallowed rejection is what layer 2 WAS").toEqual([]);
    expect(store.getShellState().startupFailure).not.toBeNull();
  });

  it("logs the failure with the reason as an ARGUMENT, never interpolated into the line", async () => {
    const store = await freshStore();
    ipc.invokeRejects = true;
    await store.startDocsWatcher();

    expect(errors.length).toBe(1);
    const [line, step, reason] = errors[0] ?? [];
    expect(line).toBe("[nputer] startup failed at");
    expect(step).toBe("snapshot");
    expect(reason).toBeInstanceOf(Error);
    // The store's existing discipline: nothing from the boundary shapes
    // the log line itself.
    expect(String(line)).not.toContain("refused");
  });
});

// ---- criterion 3 (pure half): which screen a failure selects ----------

describe("selectScreen over a startup failure", () => {
  const base = (store: StoreModule) => store.getShellState();

  it("shows the failure only while nothing is open by any route", async () => {
    const store = await freshStore();
    ipc.listenRejects = true;
    await store.startDocsWatcher();
    const failed = base(store);
    expect(failed.startupFailure).not.toBeNull();

    expect(store.selectScreen(failed).screen).toBe("startupFailed");
    expect(store.selectScreen({ ...failed, phase: "browser" }).screen).toBe("startupFailed");
    // Every phase below is an ANSWER something produced, so the failure
    // is no longer the most important thing on screen.
    expect(store.selectScreen({ ...failed, phase: "open" }).screen).toBe("board");
    expect(store.selectScreen({ ...failed, phase: "genesis" }).screen).toBe("genesis");
    expect(store.selectScreen({ ...failed, phase: "noProject" }).screen).toBe("empty");
    expect(store.selectScreen({ ...failed, phase: "noDocs" }).screen).toBe("empty");
  });

  it("a folder the user just chose and had refused still wins the screen", async () => {
    const store = await freshStore();
    ipc.listenRejects = true;
    await store.startDocsWatcher();
    const withPick = {
      ...base(store),
      rejectedPick: { path: "/tmp/nope", message: null, probe: null },
    };
    // The front door carries its own two ways in, so nothing is lost by
    // showing the more immediate answer.
    expect(store.selectScreen(withPick).screen).toBe("empty");
  });

  it("no failure means no change at all: the loading screen is still the loading screen", async () => {
    const store = await freshStore();
    expect(store.selectScreen({ ...base(store), phase: "loading" })).toEqual({
      screen: "loading",
    });
  });
});

// ---- the dev harness door (T-041's surface, T-050's state) ------------

describe("the shell harness can reach the failure the shipped app reaches", () => {
  it("applyStartupFailure IS the store's own recorder, and a retry clears it", async () => {
    vi.resetModules();
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
    ipc.listenCalls = 0;
    ipc.invokeCalls = 0;
    const store: StoreModule = await import("../src/lib/watcher-store");
    await store.startDocsWatcher();

    const harness = window.__nputerShellHarness;
    expect(harness).toBeDefined();
    harness?.applyStartupFailure("subscribe", "the event channel refused");

    // It moved the ONE live shell, through the store's public read.
    expect(store.getShellState().startupFailure).toEqual({
      step: "subscribe",
      message: "the event channel refused",
      attempt: 1,
    });
    expect(harness?.getShell()).toMatchObject({
      phase: "browser",
      screen: "startupFailed",
      starting: false,
      startupFailure: { step: "subscribe" },
    });

    // What the lane's retry button does, from the same entry point.
    await store.startDocsWatcher();
    expect(harness?.getShell()).toMatchObject({ screen: "browser", startupFailure: null });
    expect(ipc.listenCalls, "a browser never touches IPC either way").toBe(0);
  });
});
