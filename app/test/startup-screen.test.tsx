// @vitest-environment jsdom
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// TYPE-ONLY, and that matters: the store decides `isTauri` at module
// load, so a VALUE import here would load it before the line below sets
// `__TAURI_INTERNALS__` and every assertion in this file would be about
// a browser. `import type` is erased and loads nothing. (Measured: a
// value import turned 10 of these 23 tests red with phase "browser".)
import type { StartupFailure } from "../src/lib/watcher-store";

/**
 * T-050 through the REAL shell: the real App, the real store, only the
 * IPC boundary mocked (T-026's and T-049's precedent).
 *
 * ONE ORDERED NARRATIVE, because it is @human's own session:
 *
 *   waiting (the subscription parked)  -> the same screen, FAILED
 *   -> the two picker routes           -> retry -> the board
 *
 * The screenshot that opened this task showed "waiting for the first
 * docs snapshot…" with nothing else on it but "Toggle theme". So the
 * first thing asserted here is the thing that was missing: on that very
 * screen, before anything has failed, there is a way out.
 */

const ipc = vi.hoisted(() => ({
  invoke: vi.fn(),
  /** Resolve or reject the parked `listen` — the subscription standing
   * open, which is the state the screenshot was taken in. */
  releaseListen: null as null | ((value: unknown) => void),
  refuseListen: null as null | ((reason: unknown) => void),
  listenCalls: 0,
  onDocsChanged: null as null | ((event: { payload: unknown }) => void),
  outcomes: new Map<string, unknown>(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (command: string) => {
    ipc.invoke(command);
    const outcome = ipc.outcomes.get(command);
    return outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome);
  },
}));
/**
 * T-027 RECONCILE — THE MOCK IS NOW CHANNEL-AWARE, AND THAT IS A
 * STRENGTHENING RATHER THAN AN ACCOMMODATION.
 *
 * This mock parked EVERY `listen` call on one shared deferred and kept
 * every handler in one shared slot, which was exactly right while the
 * app subscribed to one channel. T-027 calls `startGenesisListener()` at
 * the root (App.tsx), so the app now opens TWO subscriptions —
 * `docs-changed` and `genesis-turn` — and the second call would silently
 * overwrite the first's resolve/reject pair. Every `refuseListen` below
 * would then reject the WRONG channel, the startup screen would never
 * see a failure at all, and seven tests would be asserting against a
 * subscription nobody was waiting on.
 *
 * Naming the channel is what keeps these assertions about
 * `docs-changed`, which is what T-050's criteria are about. It also lets
 * the file assert something it previously could not: `listenCalls` now
 * counts the DOCS subscription specifically instead of counting both.
 */
vi.mock("@tauri-apps/api/event", () => ({
  emit: () => Promise.resolve(),
  listen: (name: string, handler: (event: { payload: unknown }) => void) => {
    if (name !== "docs-changed") {
      // Not the channel under test. Parked forever and never settled —
      // which is what a subscription that has not come back looks like,
      // and which guarantees it is never the promise `refuseListen`
      // reaches.
      return new Promise(() => {});
    }
    ipc.listenCalls += 1;
    ipc.onDocsChanged = handler;
    return new Promise((resolve, reject) => {
      ipc.releaseListen = resolve;
      ipc.refuseListen = reject;
    });
  },
}));

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The store decides `isTauri` at import time — set before App is loaded.
(window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {};
const { default: App, StartupScreen } = await import("../src/App");
const { STARTUP_DEADLINE_MS, isTauriRuntime } = await import("../src/lib/watcher-store");
expect(isTauriRuntime()).toBe(true);

/**
 * The hostile rejection. Nothing in it may reach the DOM as markup: a
 * script tag, an image with an onerror handler, an HTML comment, control
 * characters (NUL, BEL, ESC), and a 10 000-character run — the last
 * because a message is not length-checked anywhere and a renderer that
 * truncated silently would be lying about what failed.
 */
const HOSTILE =
  "<script>alert('xss')</script>" +
  "<img src=x onerror=alert(1)>" +
  "<!-- swallowed? -->" +
  "\u0000\u0007\u001b[31m" +
  "A".repeat(10_000);

let container: HTMLDivElement;
let root: Root;
let errors: unknown[][];

const q = (selector: string): HTMLElement | null =>
  container.querySelector<HTMLElement>(selector);
const screenOf = (): string | null =>
  container.querySelector("main")?.getAttribute("data-screen") ?? null;
const startupState = (): string | null =>
  q("[data-testid=startup-screen]")?.getAttribute("data-startup") ?? null;

async function flush(fn: () => void | Promise<void>): Promise<void> {
  await act(async () => {
    await fn();
  });
}

async function click(selector: string): Promise<void> {
  const el = q(selector);
  expect(el, `${selector} must be on screen to be clicked`).not.toBeNull();
  await flush(() => {
    el?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

/** One chord, dispatched from the app's own root so it propagates the
 * way a real keypress does. Answers how many handlers claimed it — 1 for
 * an accelerator this app owns (T-049's instrument, reused). */
async function chord(key: string, init: KeyboardEventInit = { metaKey: true }): Promise<number> {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  const prevented = vi.spyOn(event, "preventDefault");
  const target = container.querySelector("main");
  expect(target, "the app must be on screen to receive a chord").not.toBeNull();
  await flush(() => {
    target?.dispatchEvent(event);
  });
  return prevented.mock.calls.length;
}

/** Every control the user can press, by its accessible label. The point
 * of the whole task: this list must never be ["Toggle theme"]. */
const controls = (): string[] =>
  [...container.querySelectorAll("button")].map((b) => b.textContent ?? "");

beforeAll(async () => {
  errors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    errors.push(args);
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  ipc.outcomes.set("pick_project_folder", { kind: "cancelled" });
  ipc.outcomes.set("pick_genesis_folder", { kind: "cancelled" });
  await act(async () => {
    root.render(<App />);
  });
});

afterAll(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
});

beforeEach(() => {
  ipc.invoke.mockClear();
});

describe("1. waiting — the screen from the screenshot, with a way out", () => {
  it("is the loading screen, and startup really is in flight", () => {
    expect(screenOf()).toBe("loading");
    expect(startupState()).toBe("waiting");
    expect(ipc.listenCalls, "the subscription is parked, not settled").toBe(1);
    expect(q("[data-testid=startup-message]")?.textContent).toBe(
      "waiting for the first docs snapshot…",
    );
  });

  it("THE DEFECT: this screen is no longer just a theme toggle", () => {
    // @human's screenshot, as an assertion. Before T-050 this list was
    // exactly ["Toggle theme"] — the header's control and nothing else.
    // Document order: the header comes first, then the screen's own row.
    expect(controls()).toEqual([
      "Toggle theme",
      "trying…",
      "Open a folder…",
      "Start an interview",
    ]);
    expect(q("[data-testid=startup-shortcut-hint]")?.textContent).toBe("⌘O · ⌘N");
    // The retry is disabled while an attempt is genuinely in flight —
    // single-flight, the `picking` pattern.
    expect((q("[data-testid=startup-retry]") as HTMLButtonElement).disabled).toBe(true);
  });

  it("the header's own two ways in are still board-only — this escape is the SCREEN's", () => {
    // T-049 put "Open folder…" / "Start an interview" in the header
    // behind `screen === "board"`, and this task does not widen that
    // gate. So on this screen the affordance exists because the startup
    // screen carries it, not because a header leaked.
    expect(q("[data-testid=open-folder]")).toBeNull();
    expect(q("[data-testid=header-start-interview]")).toBeNull();
  });

  it("T-049's ⌘O still fires from here, claimed by exactly one handler", async () => {
    expect(await chord("o")).toBe(1);
    expect(ipc.invoke).toHaveBeenCalledWith("pick_project_folder");
    ipc.invoke.mockClear();
    expect(await chord("n")).toBe(1);
    expect(ipc.invoke).toHaveBeenCalledWith("pick_genesis_folder");
  });
});

describe("2. failed — the screen stops claiming it is waiting (criterion 3)", () => {
  it("the parked subscription is refused, and the screen says so", async () => {
    await flush(() => {
      ipc.refuseListen?.(new Error(HOSTILE));
      return new Promise((r) => setTimeout(r, 0));
    });

    expect(screenOf()).toBe("startupFailed");
    expect(startupState()).toBe("failed");
    const message = q("[data-testid=startup-message]")?.textContent ?? "";
    expect(message).toContain("nputer could not start");
    expect(message, "and it names which half broke").toContain(
      "the watcher subscription was refused",
    );
    expect(message).not.toContain("waiting for the first docs snapshot");
    // The rejection was caught and recorded, not swallowed.
    expect(errors.map((e) => e[0])).toContain("[nputer] startup failed at");
  });

  it("the escape is still there, and the retry is pressable again", () => {
    expect(controls()).toEqual([
      "Toggle theme",
      "Try again",
      "Open a folder…",
      "Start an interview",
    ]);
    expect((q("[data-testid=startup-retry]") as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("3. the hostile message renders as TEXT NODES only (criterion 2)", () => {
  it("injects nothing: no script, no img, no comment, nothing executed", () => {
    expect(container.querySelector("script"), "no script element anywhere").toBeNull();
    expect(container.querySelector("img"), "nor an img with an onerror").toBeNull();
    const detail = q("[data-testid=startup-failure-detail]");
    expect(detail).not.toBeNull();
    // Every child of the detail element is a TEXT node — that is the
    // claim, and it is structural rather than a string comparison.
    expect([...(detail?.childNodes ?? [])].map((n) => n.nodeType)).toEqual([Node.TEXT_NODE]);
    expect(detail?.querySelectorAll("*").length, "no elements were parsed out of it").toBe(0);
  });

  it("shows it verbatim — the whole 10k of it, control characters included", () => {
    const text = q("[data-testid=startup-failure-detail]")?.textContent ?? "";
    expect(text).toContain("<script>alert('xss')</script>");
    expect(text).toContain("<img src=x onerror=alert(1)>");
    expect(text).toContain("<!-- swallowed? -->");
    expect(text).toContain("\u0000\u0007\u001b[31m");
    expect(text).toContain("A".repeat(10_000));
    // `String(err)` is the store's idiom; the whole rejection is on
    // screen, nothing truncated behind the user's back.
    expect(text.length).toBe(`Error: ${HOSTILE}`.length);
  });
});

describe("4. the escape works (criterion 3)", () => {
  it("the picker route is reachable from the failed screen", async () => {
    await click("[data-testid=startup-open-folder]");
    expect(ipc.invoke).toHaveBeenCalledWith("pick_project_folder");
    ipc.invoke.mockClear();

    await click("[data-testid=startup-start-interview]");
    expect(ipc.invoke).toHaveBeenCalledWith("pick_genesis_folder");
    // Both answered `cancelled`, so nothing moved — the screen is still
    // the one that offers the escape.
    expect(screenOf()).toBe("startupFailed");
  });

  it("RETRY reaches the board — the strand, escaped", async () => {
    // The boundary heals: `listen` will resolve this time, and the
    // status pull answers with a real project.
    ipc.outcomes.set("docs_snapshot", {
      kind: "open",
      snapshot: {
        seq: 1,
        projectDir: "/tmp/recovered",
        generatedAtMs: 1_700_000_000_000,
        files: [
          {
            path: "docs/tasks/T-901-alpha.md",
            content:
              "---\nid: T-901\ntitle: Alpha\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: S\nstatus: building\n---\n",
          },
        ],
      },
    });
    await click("[data-testid=startup-retry]");
    await flush(() => {
      ipc.releaseListen?.(() => {});
      return new Promise((r) => setTimeout(r, 0));
    });

    expect(ipc.listenCalls, "the retry really re-subscribed").toBe(2);
    expect(ipc.invoke).toHaveBeenCalledWith("docs_snapshot");
    expect(screenOf()).toBe("board");
    expect(q("[data-testid=startup-screen]"), "the failure screen is gone").toBeNull();
    expect(q("[data-testid=model-counts]")?.textContent).toContain("1 tasks");
    // And the live pipeline is really live: a watcher push lands.
    await flush(() => {
      ipc.onDocsChanged?.({
        payload: {
          seq: 2,
          projectDir: "/tmp/recovered",
          generatedAtMs: 1_700_000_000_001,
          files: [],
        },
      });
    });
    expect(container.querySelector("main")?.getAttribute("data-seq")).toBe("2");
  });
});

describe("5. the standing no-innerHTML gate, over the whole frontend", () => {
  /**
   * T-019/T-012's hygiene grep, widened from app/src/genesis/ (where
   * genesis-pane-dom.test.tsx keeps it) to ALL of app/src, because T-050
   * puts an arbitrary string from the IPC boundary on screen. The probe
   * above proves TODAY's tree escapes it; this proves no future edit
   * reaches for a raw-HTML sink anywhere the shell can render.
   */
  it("no file under app/src reaches for a raw-HTML sink", () => {
    const scan = (dir: string): string[] => {
      const out: string[] = [];
      for (const name of readdirSync(dir).sort()) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) out.push(...scan(full));
        else if (/\.(ts|tsx)$/.test(name)) out.push(full);
      }
      return out;
    };
    const files = scan(resolve("src"));
    expect(files.length).toBeGreaterThan(20);
    for (const file of files) {
      expect(readFileSync(file, "utf8"), `${file} must not reach for a raw-HTML sink`).not.toMatch(
        /innerHTML|dangerouslySetInnerHTML|insertAdjacentHTML|document\.write/,
      );
    }
  });
});

describe("6. T-063: the DEADLINE case, rendered", () => {
  /**
   * The screen for the failure @human's screenshot actually showed. The
   * narrative above is one long-lived root, so this renders the exported
   * `StartupScreen` on its own — a shape assertion about copy, with no
   * shell state to disturb.
   *
   * Why it is worth a test of its own: "startup failed at deadline" and
   * "was refused" would both be WRONG here. Nothing was refused. The
   * copy has to say that the call has not come back, that it still may,
   * and how long it waited — otherwise the deadline just replaces one
   * unactionable sentence with another.
   */
  let box: HTMLDivElement;
  let boxRoot: Root;

  const render = async (failure: StartupFailure | null, starting = false): Promise<void> => {
    await act(async () => {
      boxRoot.render(
        <StartupScreen
          failure={failure}
          starting={starting}
          picking={false}
          onRetry={() => {}}
          onPick={() => {}}
          onStartInterview={() => {}}
        />,
      );
    });
  };
  const text = (selector: string): string =>
    box.querySelector<HTMLElement>(selector)?.textContent ?? "";

  beforeAll(() => {
    box = document.createElement("div");
    document.body.appendChild(box);
    boxRoot = createRoot(box);
  });
  afterAll(() => {
    act(() => boxRoot.unmount());
    box.remove();
  });

  it("says how long it waited, and that nothing was refused", async () => {
    await render({ step: "deadline", message: "no answer from the docs watcher within 8000 ms", attempt: 2 });

    expect(box.querySelector("[data-testid=startup-screen]")?.getAttribute("data-startup")).toBe(
      "failed",
    );
    const message = text("[data-testid=startup-message]");
    expect(message).toContain("nputer could not start");
    // N, in the copy, derived from the one constant rather than typed
    // twice — a deadline the screen and the store disagree about is a
    // worse bug than the one this card is fixing.
    expect(message).toContain(`${Math.round(STARTUP_DEADLINE_MS / 1000)} seconds`);
    expect(message, "and it does not claim a refusal").not.toContain("was refused");
    expect(message).toContain("may still answer");
    expect(message).not.toContain("waiting for the first docs snapshot");
  });

  it("the heading says TIMED OUT, not 'failed at deadline'", async () => {
    await render({ step: "deadline", message: "…", attempt: 2 });
    expect(text("h3")).toBe("startup timed out · attempt 2");
    // The other two keep T-050's wording exactly.
    await render({ step: "subscribe", message: "…", attempt: 1 });
    expect(text("h3")).toBe("startup failed at subscribe · attempt 1");
    await render({ step: "snapshot", message: "…", attempt: 3 });
    expect(text("h3")).toBe("startup failed at snapshot · attempt 3");
  });

  it("carries the same three ways out as every other failure", async () => {
    await render({ step: "deadline", message: "…", attempt: 1 });
    expect([...box.querySelectorAll("button")].map((b) => b.textContent)).toEqual([
      "Try again",
      "Open a folder…",
      "Start an interview",
    ]);
  });

  it("the WAITING screen is unchanged — a deadline adds no copy before it fires", async () => {
    await render(null, true);
    expect(text("[data-testid=startup-message]")).toBe("waiting for the first docs snapshot…");
    expect(box.querySelector("[data-testid=startup-failure-detail]")).toBeNull();
  });
});
