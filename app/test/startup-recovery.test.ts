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
  /** T-063: PARK the subscribe instead of answering it. A HANG, which is
   * a different thing from a refusal and was indistinguishable from it
   * on screen — this is the shape @human's screenshot was taken in. */
  listenParks: false,
  /** Release a parked subscribe (resolving it to a real unlisten). */
  releaseListen: null as null | (() => void),
  /** T-063: which subscriptions have been torn down, in call order, and
   * how many are live. COUNTING is the only instrument that can see a
   * stacked subscription — the store's downstream identity guards drop
   * the second reduction of one event, so two handlers on one channel
   * look exactly like one from outside. */
  unlistened: [] as number[],
  liveSubscriptions: 0,
  /** The `docs-changed` handler the store registered, so a test can push
   * a snapshot the way the watcher would. */
  onDocsChanged: null as null | ((event: { payload: unknown }) => void),
  /** T-063: every `emit`, in order. The `startup-failed` ones are the
   * whole of criteria 6 and 7 on this side of the boundary. */
  emits: [] as { name: string; payload: unknown }[],
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
  emit: (name: string, payload: unknown) => {
    ipc.emits.push({ name, payload });
    return Promise.resolve();
  },
  listen: (_name: string, handler: (event: { payload: unknown }) => void) => {
    ipc.listenCalls += 1;
    const id = ipc.listenCalls;
    /** A DISTINCT unlisten per subscription, so tearing one down is
     * distinguishable from tearing down another. The real `listen`
     * resolves to exactly this and the store used to discard it. */
    const subscribe = (): (() => void) => {
      ipc.liveSubscriptions += 1;
      ipc.onDocsChanged = handler;
      let torn = false;
      return () => {
        if (torn) return;
        torn = true;
        ipc.unlistened.push(id);
        ipc.liveSubscriptions -= 1;
      };
    };
    if (ipc.listenRejects) return Promise.reject(new Error("listen: the event channel refused"));
    if (ipc.listenParks) {
      return new Promise<() => void>((resolve) => {
        ipc.releaseListen = () => resolve(subscribe());
      });
    }
    return Promise.resolve(subscribe());
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
  ipc.listenParks = false;
  ipc.releaseListen = null;
  ipc.unlistened = [];
  ipc.liveSubscriptions = 0;
  ipc.emits = [];
  ipc.status = { kind: "noProject" };
  ipc.pickOutcome = { kind: "cancelled" };
  return import("../src/lib/watcher-store");
}

/** Let every already-resolved promise in the chain run. The pick's
 * re-subscribe (criterion 2) is a deliberate `void`, so it is in flight
 * — not awaited — when `pickProjectFolder()` returns. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Every `startup-failed` payload, in order. */
const failureEvents = (): { step: string; message: string; attempt: number }[] =>
  ipc.emits
    .filter((e) => e.name === "startup-failed")
    .map((e) => e.payload as { step: string; message: string; attempt: number });

const PROBE = { roadmap: false, tasks: false, architecture: false, git: true };

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

  it("a RE-ENTRANT call, from inside the store's own notify, starts no second subscription", async () => {
    // The sharpest form of criterion 1's concurrent case, and the one
    // that was genuinely broken until it was measured: `runStartup`'s
    // first act is a synchronous `setShell({ starting: true })`, which
    // NOTIFIES. A subscriber woken there that calls `startDocsWatcher`
    // back is "a second call arriving while the first is still in
    // flight" — but it arrives BEFORE the latch has been assigned if the
    // latch is taken from `runStartup(...)`'s return value. It opened a
    // second subscription (`listen` called twice). The latch is now
    // closed before the attempt runs, so this holds at one.
    const store = await freshStore();
    let reentered = 0;
    const unsubscribe = store.subscribeShell(() => {
      if (reentered === 0 && store.getShellState().starting) {
        reentered += 1;
        void store.startDocsWatcher();
      }
    });

    await store.startDocsWatcher();

    expect(reentered, "the re-entrant call really was made").toBe(1);
    expect(ipc.listenCalls, "one subscription, not two").toBe(1);
    expect(ipc.invokeCalls, "and one status pull").toBe(1);
    unsubscribe();
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

// ---- T-063 criterion 1: the unlisten handle is HELD -------------------

describe("the store holds the unlisten handle (criterion 1)", () => {
  /**
   * THE PREREQUISITE FOR THE OTHER TWO HALVES OF T-063. `await listen(…)`
   * resolves to an unlisten function and the store used to discard it, so
   * a retry could only ADD a subscription. It is invisible from outside:
   * a second handler reduces the same event a second time, and
   * `reduceDocs`'s seq guard returns `prev` by identity, so the state
   * looks identical either way. Only counting can see it — which is why
   * every assertion here is a count and none of them is an outcome.
   */
  it("a retry after a refused SNAPSHOT REPLACES the live subscription instead of stacking on it", async () => {
    const store = await freshStore();
    ipc.invokeRejects = true;
    await store.startDocsWatcher();

    // The asymmetry T-050 pinned as a FACT: `listen` resolved, so the
    // subscription is live even though startup failed.
    expect(ipc.listenCalls).toBe(1);
    expect(ipc.liveSubscriptions, "the subscription survived the failed pull").toBe(1);
    expect(ipc.unlistened, "nothing has been torn down yet").toEqual([]);

    ipc.invokeRejects = false;
    ipc.status = { kind: "open", snapshot: SNAPSHOT };
    await store.startDocsWatcher();

    expect(ipc.listenCalls, "the retry really re-subscribed").toBe(2);
    expect(ipc.unlistened, "and subscription #1 was torn DOWN, not left running").toEqual([1]);
    expect(ipc.liveSubscriptions, "one channel, one handler").toBe(1);
    expect(store.getShellState().phase).toBe("open");
  });

  it("four retries after four refused snapshots still leave exactly one subscription", async () => {
    const store = await freshStore();
    ipc.invokeRejects = true;
    await store.startDocsWatcher();
    await store.startDocsWatcher();
    await store.startDocsWatcher();
    await store.startDocsWatcher();

    expect(ipc.listenCalls, "four attempts really reached the boundary").toBe(4);
    // Each new subscription tore down its predecessor, in order.
    expect(ipc.unlistened).toEqual([1, 2, 3]);
    expect(ipc.liveSubscriptions, "never two, however many times it is retried").toBe(1);
  });

  it("a refused re-subscribe does not tear down the subscription that still works", async () => {
    // The other direction, and it is deliberate: attempt 1 succeeded at
    // `listen` and failed at `invoke`; attempt 2's `listen` is refused.
    // Tearing #1 down would turn a live watcher into no watcher in the
    // name of retrying, which is strictly worse than doing nothing.
    const store = await freshStore();
    ipc.invokeRejects = true;
    await store.startDocsWatcher();
    expect(ipc.liveSubscriptions).toBe(1);

    ipc.listenRejects = true;
    await store.startDocsWatcher();

    expect(ipc.unlistened, "#1 is untouched").toEqual([]);
    expect(ipc.liveSubscriptions, "still live — a file change can still land").toBe(1);
    expect(store.getShellState().startupFailure?.step).toBe("subscribe");
  });
});

// ---- T-063 criteria 3 + 5: a HANG is not a REJECTION ------------------

describe("a startup that HANGS is distinguishable from one that REJECTED (criterion 3)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("THE SCREENSHOT: before the deadline the copy is TRUE and 'Try again' is a no-op BY CONSTRUCTION", async () => {
    const store = await freshStore();
    vi.useFakeTimers();
    ipc.listenParks = true;

    const first = store.startDocsWatcher();
    expect(store.getShellState().starting, "still genuinely waiting").toBe(true);
    expect(store.getShellState().startupFailure).toBeNull();
    expect(store.selectScreen(store.getShellState()).screen).toBe("loading");

    // What @human pressed. The latch correctly hands back the attempt in
    // flight — right, because it is what stops React's double-effect
    // opening two subscriptions — so nothing happens, and the screen goes
    // on saying it is waiting, which it IS.
    expect(store.startDocsWatcher(), "the same promise, not a new attempt").toBe(first);
    expect(ipc.listenCalls, "no second subscribe — this is the no-op").toBe(1);
  });

  it("after N ms it becomes a DEADLINE failure, and the retry is real", async () => {
    const store = await freshStore();
    vi.useFakeTimers();
    ipc.listenParks = true;

    const first = store.startDocsWatcher();
    await vi.advanceTimersByTimeAsync(store.STARTUP_DEADLINE_MS - 1);
    expect(store.getShellState().startupFailure, "not one millisecond early").toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    await first;

    expect(store.getShellState().startupFailure).toEqual({
      step: "deadline",
      message: `no answer from the docs watcher within ${store.STARTUP_DEADLINE_MS} ms`,
      attempt: 1,
    });
    expect(store.getShellState().starting, "so the button is pressable again").toBe(false);
    expect(store.selectScreen(store.getShellState()).screen).toBe("startupFailed");

    // The latch is open: this press really re-subscribes.
    ipc.listenParks = false;
    ipc.status = { kind: "open", snapshot: SNAPSHOT };
    await store.startDocsWatcher();
    expect(ipc.listenCalls, "the retry did what its label says").toBe(2);
    expect(store.getShellState().phase).toBe("open");
    expect(store.getShellState().startupFailure).toBeNull();
  });

  it("a raced-out attempt is STILL RUNNING and leaks no second subscription (criterion 5)", async () => {
    const store = await freshStore();
    vi.useFakeTimers();
    ipc.listenParks = true;

    const first = store.startDocsWatcher();
    await vi.advanceTimersByTimeAsync(store.STARTUP_DEADLINE_MS);
    await first;
    expect(store.getShellState().startupFailure?.step).toBe("deadline");
    const releaseGhost = ipc.releaseListen;
    expect(releaseGhost, "attempt #1's subscribe really is still parked").not.toBeNull();

    // The user presses Try again, and THIS one answers.
    ipc.listenParks = false;
    ipc.status = { kind: "open", snapshot: SNAPSHOT };
    await store.startDocsWatcher();
    expect(ipc.listenCalls).toBe(2);
    expect(ipc.liveSubscriptions).toBe(1);

    // ...and only NOW does attempt #1's subscribe finally come back. It
    // was never cancelled — nothing here can cancel a boundary call — so
    // the only question is what it does with the handle it is holding.
    releaseGhost?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(ipc.unlistened, "the ghost tore its own subscription down").toEqual([1]);
    expect(ipc.liveSubscriptions, "one live subscription, not two").toBe(1);
    expect(store.getShellState().phase, "and the ghost wrote no shell state").toBe("open");
  });

  it("a raced-out attempt that answers with NOBODY behind it heals the app instead", async () => {
    // The same ghost, with no retry pressed. It is still the current
    // attempt, so it is not a ghost at all: the deadline was pessimistic
    // and the app comes up underneath the failure screen. Recorded here
    // because it is the reason a measured N is allowed to be wrong.
    const store = await freshStore();
    vi.useFakeTimers();
    ipc.listenParks = true;
    ipc.status = { kind: "open", snapshot: SNAPSHOT };

    const first = store.startDocsWatcher();
    await vi.advanceTimersByTimeAsync(store.STARTUP_DEADLINE_MS);
    await first;
    expect(store.selectScreen(store.getShellState()).screen).toBe("startupFailed");

    ipc.releaseListen?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(store.getShellState().phase).toBe("open");
    expect(store.getShellState().startupFailure, "the pessimism retracts itself").toBeNull();
    expect(store.selectScreen(store.getShellState())).toEqual({ screen: "board" });
    expect(ipc.liveSubscriptions).toBe(1);
  });

  it("a deadline that is later REFUSED reports the refusal, on the same attempt number", async () => {
    const store = await freshStore();
    vi.useFakeTimers();
    ipc.listenParks = true;

    const first = store.startDocsWatcher();
    ipc.invokeRejects = true;
    await vi.advanceTimersByTimeAsync(store.STARTUP_DEADLINE_MS);
    await first;
    expect(store.getShellState().startupFailure?.step).toBe("deadline");

    ipc.releaseListen?.();
    await vi.advanceTimersByTimeAsync(0);

    const failure = store.getShellState().startupFailure;
    expect(failure?.step, "the more specific truth replaces the vaguer one").toBe("snapshot");
    expect(failure?.attempt, "and it is still ONE attempt, not two").toBe(1);
  });

  it("N is the MEASURED figure, not whatever a later edit leaves behind", async () => {
    /**
     * FOUND BY THE POISON DRILL, and it is the reason this test exists:
     * every other deadline test advances the clock BY `STARTUP_DEADLINE_MS`,
     * so raising the constant to 8 000 000 left all of them green while
     * the deadline in the shipped app would effectively never fire. A
     * test parametrised by the constant cannot pin the constant.
     *
     * The measurement and its margin live in `STARTUP_DEADLINE_MS`'s own
     * header (worst measured window 72 ms; worst padded upper bound
     * 778 ms; both on this machine, 2026-08-18, five launches). Moving
     * the number means re-measuring and rewriting that header in the same
     * edit — which is what this assertion is for.
     */
    const store = await freshStore();
    expect(store.STARTUP_DEADLINE_MS).toBe(8_000);
    // The two bounds the criterion actually argues about, kept as a
    // second guard that survives a deliberate re-measurement: well clear
    // of the worst padded bound, and well short of the point where the
    // affordance arrives after the user has given up.
    expect(store.STARTUP_DEADLINE_MS, "too short shows a failure that is not one").toBeGreaterThan(
      778 * 2,
    );
    expect(store.STARTUP_DEADLINE_MS, "too long arrives after the user has quit").toBeLessThanOrEqual(
      30_000,
    );
  });

  it("a startup that answers normally arms no failure and leaves no timer behind", async () => {
    const store = await freshStore();
    vi.useFakeTimers();
    await store.startDocsWatcher();
    expect(store.getShellState().phase).toBe("noProject");
    // If the deadline were not cleared, this would record a failure over
    // a startup that succeeded — the loudest possible false positive.
    await vi.advanceTimersByTimeAsync(store.STARTUP_DEADLINE_MS * 3);
    expect(store.getShellState().startupFailure).toBeNull();
    expect(failureEvents(), "and nothing was logged about a healthy start").toEqual([]);
  });
});

// ---- T-063 criterion 2: the pick re-arms the WEBVIEW too --------------

describe("a successful pick after a refused SUBSCRIBE re-runs startup (criterion 2)", () => {
  /**
   * THE BOARD THAT IS A PHOTOGRAPH. T-050 put "Open a folder…" and
   * "Start an interview" on the failure screen and they WORK —
   * `pick_project_folder` re-arms the Rust watcher and answers a
   * snapshot, so a real project appears. But the webview never
   * subscribed, so nothing that happens on disk afterwards has anywhere
   * to land. STATE ranks this first among the older set precisely
   * because it looks fine.
   */
  it("the board is LIVE afterwards, not a photograph", async () => {
    const store = await freshStore();
    ipc.listenRejects = true;
    await store.startDocsWatcher();
    expect(ipc.listenCalls).toBe(1);
    expect(ipc.liveSubscriptions, "no subscription at all — that is the defect").toBe(0);
    expect(store.getShellState().startupFailure?.step).toBe("subscribe");

    // The boundary has healed by the time the user takes the escape.
    ipc.listenRejects = false;
    ipc.pickOutcome = { kind: "picked", snapshot: { ...SNAPSHOT, seq: 9 } };
    ipc.status = { kind: "open", snapshot: { ...SNAPSHOT, seq: 12, files: [] } };
    await store.pickProjectFolder();
    await settle();

    expect(ipc.listenCalls, "the pick re-armed the WEBVIEW too").toBe(2);
    expect(ipc.liveSubscriptions).toBe(1);
    // The proof that matters is not the count: a file change now lands.
    ipc.onDocsChanged?.({ payload: { ...SNAPSHOT, seq: 30, files: [] } });
    expect(store.getShellState().docs.seq, "the watcher reaches the board again").toBe(30);
  });

  it("the re-subscribe does not FIGHT the pick's own snapshot — a STALE pull drops by identity", async () => {
    const store = await freshStore();
    ipc.listenRejects = true;
    await store.startDocsWatcher();
    ipc.listenRejects = false;

    // The interleaving: the pick lands seq 9, and the re-run's status
    // pull answers with something OLDER. The seq guard settles it, the
    // same way it settles the subscribe-then-pull race today.
    ipc.pickOutcome = { kind: "picked", snapshot: { ...SNAPSHOT, seq: 9 } };
    ipc.status = { kind: "open", snapshot: { ...SNAPSHOT, seq: 4, files: [] } };
    await store.pickProjectFolder();
    await settle();

    const docs = store.getShellState().docs;
    expect({
      listenCalls: ipc.listenCalls,
      invokeCalls: ipc.invokeCalls,
      seq: docs.seq,
      taskIds: docs.model.tasks.map((t) => t.id),
      echoes: ipc.emits.filter((e) => e.name === "model-updated").length,
    }).toEqual({
      listenCalls: 2,
      invokeCalls: 1,
      seq: 9,
      taskIds: ["T-901"],
      echoes: 1,
    });
  });

  it("...and a NEWER pull applies, exactly like any other snapshot", async () => {
    const store = await freshStore();
    ipc.listenRejects = true;
    await store.startDocsWatcher();
    ipc.listenRejects = false;

    ipc.pickOutcome = { kind: "picked", snapshot: { ...SNAPSHOT, seq: 9 } };
    ipc.status = { kind: "open", snapshot: { ...SNAPSHOT, seq: 12, files: [] } };
    await store.pickProjectFolder();
    await settle();

    expect(store.getShellState().docs.seq).toBe(12);
    expect(store.getShellState().docs.fileCount).toBe(0);
    expect(ipc.emits.filter((e) => e.name === "model-updated"), "two real snapshots, two echoes").toHaveLength(2);
  });

  it("a pick after a refused SNAPSHOT does NOT re-run startup — that half was already self-healing", async () => {
    // The asymmetry, enforced rather than described: `listen` resolved,
    // so the subscription is live and re-running would buy nothing but a
    // second subscribe to tear down.
    const store = await freshStore();
    ipc.invokeRejects = true;
    await store.startDocsWatcher();
    expect(store.getShellState().startupFailure?.step).toBe("snapshot");

    ipc.invokeRejects = false;
    ipc.pickOutcome = { kind: "picked", snapshot: { ...SNAPSHOT, seq: 9 } };
    await store.pickProjectFolder();
    await settle();

    expect(ipc.listenCalls, "nothing to re-arm").toBe(1);
    expect(ipc.liveSubscriptions).toBe(1);
    expect(store.getShellState().phase).toBe("open");
  });

  it("a cancelled pick re-runs nothing — the gate is a SUCCESSFUL pick", async () => {
    const store = await freshStore();
    ipc.listenRejects = true;
    await store.startDocsWatcher();
    ipc.listenRejects = false;

    ipc.pickOutcome = { kind: "cancelled" };
    await store.pickProjectFolder();
    await settle();
    expect(ipc.listenCalls).toBe(1);

    // Nor does a REFUSED choice: nothing was re-armed Rust-side either.
    ipc.pickOutcome = { kind: "noDocs", path: "/tmp/nope", probe: PROBE };
    await store.pickProjectFolder();
    await settle();
    expect(ipc.listenCalls).toBe(1);
    expect(store.getShellState().startupFailure?.step, "still the same failure").toBe("subscribe");
  });

  it("a GENESIS pick re-subscribes too — and the status pull must not yank the interview away", async () => {
    /**
     * THE HAZARD THIS CRITERION CREATES, caught by reproducing it rather
     * than by reading. `apply_genesis_folder` sets Rust's project dir to
     * the interview's folder, and a genesis folder legitimately has NO
     * `docs/` yet — so the re-run's `docs_snapshot` answers `noDocs`
     * about the very folder the user is interviewing in. Applying that
     * would drop them on the front door's "No plan in <folder>" card
     * mid-interview: a criterion meant to stop a silent failure would
     * have introduced a loud one.
     *
     * An interview needs the live watcher MORE than the board does — the
     * banked chips are a docs-snapshot diff, so a dead subscription
     * means an interview that never banks anything.
     */
    const store = await freshStore();
    ipc.listenRejects = true;
    await store.startDocsWatcher();
    ipc.listenRejects = false;

    ipc.pickOutcome = { kind: "genesis", projectDir: "/tmp/sketchpad", seq: 5, probe: PROBE };
    ipc.status = { kind: "noDocs", projectDir: "/tmp/sketchpad", probe: PROBE };
    await store.pickGenesisFolder();
    await settle();

    expect(ipc.listenCalls, "the interview gets a live watcher").toBe(2);
    expect(ipc.liveSubscriptions).toBe(1);
    expect(store.getShellState().phase, "and it is still the interview on screen").toBe("genesis");
    expect(store.selectScreen(store.getShellState())).toEqual({ screen: "genesis" });
    expect(store.getShellState().genesisDir).toBe("/tmp/sketchpad");
  });

  it("the interview's own docs, when they DO land, still reach it", async () => {
    // The guard above must not become a wall: an `open` status is the one
    // arm that still applies, because `applyDocsPayload` has kept the
    // genesis phase since T-026 and that rule is unchanged.
    const store = await freshStore();
    ipc.listenRejects = true;
    await store.startDocsWatcher();
    ipc.listenRejects = false;

    ipc.pickOutcome = { kind: "genesis", projectDir: "/tmp/sketchpad", seq: 5, probe: PROBE };
    ipc.status = {
      kind: "open",
      snapshot: { ...SNAPSHOT, seq: 11, projectDir: "/tmp/sketchpad" },
    };
    await store.pickGenesisFolder();
    await settle();

    expect(store.getShellState().phase).toBe("genesis");
    expect(store.getShellState().docs.seq).toBe(11);
    expect(store.getShellState().docs.model.tasks.map((t) => t.id)).toEqual(["T-901"]);
  });
});

// ---- T-063 criteria 6 + 7: the failure reaches the LOG ----------------

describe("the failure reaches the LOG (criteria 6 and 7)", () => {
  /**
   * THE DEFECT WITH A REAL USER REPORT BEHIND IT. `recordStartupFailure`
   * ended at a `console.error`, and a WKWebView console never reaches
   * the Tauri process's stdout — so on 2026-08-16 @human hit a startup
   * dead end, sent a screenshot AND their log, and the log was healthy
   * through seq 22 because the one thing that broke could not write to
   * it. The Rust half of this proof (each payload becoming one sanitised
   * line) is `startup_failed_line`'s tests in `app/src-tauri/src/lib.rs`.
   */
  it("emits `startup-failed` carrying step, message and attempt", async () => {
    const store = await freshStore();
    ipc.listenRejects = true;
    await store.startDocsWatcher();

    // The event NAME is a literal here on purpose: it is one half of a
    // cross-language pin, and the other half is `STARTUP_FAILED_EVENT` in
    // `app/src-tauri/src/lib.rs`. Renaming one must red the other.
    expect(ipc.emits.map((e) => e.name)).toEqual(["startup-failed"]);
    expect(failureEvents()).toEqual([
      {
        step: "subscribe",
        message: "Error: listen: the event channel refused",
        attempt: 1,
      },
    ]);
    // And it is the same object the screen renders — one account of the
    // failure, not two that can disagree.
    expect(failureEvents()[0]).toEqual(store.getShellState().startupFailure);
  });

  it("FOUR 'Try again' presses produce FOUR events with four attempt numbers", async () => {
    const store = await freshStore();
    ipc.listenRejects = true;

    await store.startDocsWatcher();
    await store.startDocsWatcher();
    await store.startDocsWatcher();
    await store.startDocsWatcher();

    expect(ipc.listenCalls, "four presses really reached the boundary").toBe(4);
    expect(failureEvents().map((f) => f.attempt), "the evidence a diagnosis needs").toEqual([
      1, 2, 3, 4,
    ]);
    expect(failureEvents().map((f) => f.step)).toEqual([
      "subscribe",
      "subscribe",
      "subscribe",
      "subscribe",
    ]);
  });

  it("logs a DEADLINE too — the failure that previously looked like patience", async () => {
    const store = await freshStore();
    vi.useFakeTimers();
    try {
      ipc.listenParks = true;
      const first = store.startDocsWatcher();
      await vi.advanceTimersByTimeAsync(store.STARTUP_DEADLINE_MS);
      await first;
      expect(failureEvents()).toEqual([
        {
          step: "deadline",
          message: `no answer from the docs watcher within ${store.STARTUP_DEADLINE_MS} ms`,
          attempt: 1,
        },
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("passes the message through UNTOUCHED — sanitising is the log sink's job, not this side's", async () => {
    // The two sinks handle the same string differently BY DESIGN: the DOM
    // renders it as a text node (T-050), and Rust escapes and caps it for
    // a terminal. Truncating here would lose what the DOM is entitled to
    // show; escaping here would put backslashes on screen.
    const store = await freshStore();
    ipc.invokeRejects = true;
    await store.startDocsWatcher();
    const emitted = failureEvents()[0];
    expect(emitted?.message).toBe("Error: docs_snapshot: the command was refused");
    expect(emitted?.message).toBe(store.getShellState().startupFailure?.message);
  });

  it("a BROWSER emits nothing — there is no process on the other end to log to", async () => {
    vi.resetModules();
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
    ipc.emits = [];
    const store: StoreModule = await import("../src/lib/watcher-store");
    await store.startDocsWatcher();
    window.__nputerShellHarness?.applyStartupFailure("subscribe", "refused");
    expect(store.getShellState().startupFailure?.step).toBe("subscribe");
    expect(ipc.emits, "no IPC in a browser, in either direction").toEqual([]);
  });
});
