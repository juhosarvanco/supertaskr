// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { matchAccelerator } from "../src/components/shell/accelerators";
import type { DocsSnapshotPayload } from "../src/lib/docs-model";

/**
 * T-049 through the REAL shell: the real App, the real store, the real
 * accelerator table — only the IPC boundary is mocked (T-026's
 * genesis-entry precedent). The defect this file pins is a usability
 * one @human hit while using the app: "command + o and command + n are
 * not working in nputer". They were the right keys; the listener lived
 * inside `EmptyState`, so it unmounted with the front door and the
 * chords reached nothing from the board, the map or the interview.
 *
 * One ordered narrative, because the store is a module singleton and
 * screens follow one another:
 *
 *   front door -> board -> map (incl. a focused text input)
 *   -> genesis (reached BY the chord) -> a picker already in flight
 *   -> the header's two ways in -> exactly one keydown path.
 *
 * Every chord is dispatched from the app's own root element, so it
 * propagates element -> document -> window exactly as a real keypress
 * does: a second handler on EITHER target would show up here.
 */

const ipc = vi.hoisted(() => ({
  invoke: vi.fn(),
  outcomes: new Map<string, unknown>(),
  listeners: new Map<string, (event: { payload: unknown }) => void>(),
  /** When true, the NEXT invoke parks instead of resolving — the native
   * dialog still standing open, which is the state T-021's single-flight
   * guard exists for. */
  holdNext: false,
  release: null as null | ((value: unknown) => void),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (command: string) => {
    ipc.invoke(command);
    if (ipc.holdNext) {
      ipc.holdNext = false;
      return new Promise<unknown>((resolve) => {
        ipc.release = resolve;
      });
    }
    return Promise.resolve(ipc.outcomes.get(command));
  },
}));
vi.mock("@tauri-apps/api/event", () => ({
  emit: () => Promise.resolve(),
  listen: (name: string, handler: (event: { payload: unknown }) => void) => {
    ipc.listeners.set(name, handler);
    return Promise.resolve(() => {});
  },
}));

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/** Every live keydown listener in the app, whichever target it is on.
 * Recorded from BEFORE the first render, so a listener added by a screen
 * that has since unmounted is removed from this list rather than
 * lingering in it. */
interface KeydownPath {
  where: "window" | "document";
  handler: EventListener;
}
const livePaths: KeydownPath[] = [];

function trackKeydownPaths(): () => void {
  const restores: Array<() => void> = [];
  const targets: Array<["window" | "document", EventTarget]> = [
    ["window", window],
    ["document", document],
  ];
  for (const [where, node] of targets) {
    const add = node.addEventListener.bind(node);
    const remove = node.removeEventListener.bind(node);
    node.addEventListener = (type, handler, options) => {
      if (type === "keydown" && typeof handler === "function") {
        livePaths.push({ where, handler: handler as EventListener });
      }
      add(type, handler, options);
    };
    node.removeEventListener = (type, handler, options) => {
      if (type === "keydown" && typeof handler === "function") {
        const at = livePaths.findIndex((p) => p.where === where && p.handler === handler);
        if (at >= 0) livePaths.splice(at, 1);
      }
      remove(type, handler, options);
    };
    restores.push(() => {
      node.addEventListener = add;
      node.removeEventListener = remove;
    });
  }
  return () => {
    for (const restore of restores) restore();
  };
}

// The store decides `isTauri` at import time, and the tracker must be in
// place before the App ever mounts — both happen before the import below.
(window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {};
const untrack = trackKeydownPaths();
const { default: App } = await import("../src/App");

const PROJECT_DIR = "/tmp/an-open-project";
const GENESIS_DIR = "/tmp/sketchpad";
const PROBE = { roadmap: false, tasks: false, architecture: false, git: true };

let container: HTMLDivElement;
let root: Root;

const q = (selector: string): HTMLElement | null =>
  container.querySelector<HTMLElement>(selector);
const screenOf = (): string | null =>
  container.querySelector("main")?.getAttribute("data-screen") ?? null;

async function flush(fn: () => void): Promise<void> {
  await act(async () => {
    fn();
  });
}

function click(el: Element | null): Promise<void> {
  expect(el).not.toBeNull();
  return flush(() => {
    (el as Element).dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function emitSnapshot(payload: DocsSnapshotPayload): Promise<void> {
  const handler = ipc.listeners.get("docs-changed");
  expect(handler).toBeDefined();
  return flush(() => handler?.({ payload }));
}

/**
 * Press one chord, from `from` (the app's root element by default) so it
 * propagates the way a real keypress does. Answers how many times
 * `preventDefault` was called on that ONE event — which is the app's
 * count of handlers that claimed the chord, and therefore 1 for an
 * accelerator and 0 for anything the app has not taken.
 */
async function chord(
  key: string,
  init: KeyboardEventInit = { metaKey: true },
  from?: Element | null,
): Promise<number> {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  const prevented = vi.spyOn(event, "preventDefault");
  const target = from ?? container.querySelector("main");
  expect(target, "the app must be on screen to receive a chord").not.toBeNull();
  await flush(() => {
    (target as Element).dispatchEvent(event);
  });
  return prevented.mock.calls.length;
}

/** Both accelerators, from whatever screen is currently up. */
async function expectBothChordsWork(): Promise<void> {
  expect(await chord("o"), "⌘O is claimed by exactly one handler").toBe(1);
  expect(ipc.invoke).toHaveBeenCalledWith("pick_project_folder");
  ipc.invoke.mockClear();

  expect(await chord("n"), "⌘N is claimed by exactly one handler").toBe(1);
  expect(ipc.invoke).toHaveBeenCalledWith("pick_genesis_folder");
  ipc.invoke.mockClear();

  // Ctrl for the platforms without a Command key — unchanged from T-026.
  expect(await chord("o", { ctrlKey: true })).toBe(1);
  expect(ipc.invoke).toHaveBeenCalledWith("pick_project_folder");
  ipc.invoke.mockClear();

  expect(await chord("n", { ctrlKey: true })).toBe(1);
  expect(ipc.invoke).toHaveBeenCalledWith("pick_genesis_folder");
}

beforeAll(async () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  ipc.outcomes.set("docs_snapshot", { kind: "noProject" });
  // Every chord in this file answers "cancelled" unless a test says
  // otherwise: nothing changes, so a chord can be fired anywhere without
  // moving the screen out from under the next assertion.
  ipc.outcomes.set("pick_project_folder", { kind: "cancelled" });
  ipc.outcomes.set("pick_genesis_folder", { kind: "cancelled" });
  await act(async () => {
    root.render(<App />);
  });
});

afterAll(() => {
  act(() => root.unmount());
  container.remove();
  untrack();
});

beforeEach(() => {
  ipc.invoke.mockClear();
});

describe("the chords fire from every screen the app can show (criterion 1)", () => {
  it("1. the front door — T-026's behaviour, unchanged", async () => {
    expect(screenOf()).toBe("empty");
    expect(q('[data-testid="empty-state"]')).not.toBeNull();
    expect(q('[data-testid="shortcut-hint"]')?.textContent).toBe("⌘O · ⌘N");
    await expectBothChordsWork();
  });

  it("2. the board — the screen the chords used to die on", async () => {
    await emitSnapshot({ seq: 1, projectDir: PROJECT_DIR, generatedAtMs: 1, files: [] });
    expect(screenOf()).toBe("board");
    // The front door is GONE — this is exactly the state @human was in,
    // and pre-T-049 the listener had unmounted with it.
    expect(q('[data-testid="empty-state"]')).toBeNull();
    expect(q('[data-testid="pane-rail"]')).not.toBeNull();
    await expectBothChordsWork();
  });

  it("3. the map pane, including while a text input has focus (criterion 6)", async () => {
    await click(q('[data-testid="pane-rail-map"]'));
    expect(container.querySelector("main")?.getAttribute("data-pane")).toBe("map");
    expect(q('[data-testid="map-view"]')).not.toBeNull();
    await expectBothChordsWork();

    // ⌘O / ⌘N are not text-editing keys, so a focused input does not
    // swallow them — the chord is dispatched FROM the map's search field.
    ipc.invoke.mockClear();
    const search = q('[data-testid="map-search"]') as HTMLInputElement | null;
    expect(search, "the map's search field is the app's real text input").not.toBeNull();
    await flush(() => search?.focus());
    expect(document.activeElement).toBe(search);
    expect(await chord("o", { metaKey: true }, search)).toBe(1);
    expect(ipc.invoke).toHaveBeenCalledWith("pick_project_folder");

    // ...and the app claims nothing else from that input: ⌘F is the
    // map's own key and is not ours, plain typing is untouched.
    ipc.invoke.mockClear();
    expect(await chord("a", { metaKey: true }, search), "⌘A is not ours").toBe(0);
    expect(await chord("o", {}, search), "a bare o is typing, not a chord").toBe(0);
    expect(ipc.invoke).not.toHaveBeenCalled();
    await flush(() => search?.blur());
    await click(q('[data-testid="pane-rail-board"]'));
  });

  it("4. the genesis screen — reached BY the chord, then served by it", async () => {
    ipc.outcomes.set("pick_genesis_folder", {
      kind: "genesis",
      projectDir: GENESIS_DIR,
      seq: 5,
      probe: PROBE,
    });
    expect(await chord("n")).toBe(1);
    expect(ipc.invoke).toHaveBeenCalledWith("pick_genesis_folder");
    // One keypress from an open board to an interview — the four-step
    // route (Open folder… -> a docs-less folder -> the No-plan card ->
    // Start an interview here) is no longer the only way in.
    expect(screenOf()).toBe("genesis");
    expect(q('[data-testid="genesis-project-dir"]')?.textContent).toBe(GENESIS_DIR);

    ipc.outcomes.set("pick_genesis_folder", { kind: "cancelled" });
    ipc.invoke.mockClear();
    await expectBothChordsWork();
    // The interview is still standing after all four chords.
    expect(screenOf()).toBe("genesis");
  });
});

describe("a picker already in flight (criterion 3 — T-021's guard, respected)", () => {
  it("stacks no second dialog, and the screen is untouched while it waits", async () => {
    const store = await import("../src/lib/watcher-store");
    expect(screenOf()).toBe("genesis");

    // The native dialog opens and stays open: this invoke never settles
    // until the test releases it.
    ipc.holdNext = true;
    expect(await chord("o")).toBe(1);
    expect(ipc.invoke).toHaveBeenCalledTimes(1);
    expect(store.getShellState().picking, "the picker is in flight").toBe(true);
    const during = store.getShellState();

    // Three more chords while the dialog is up — including the other
    // accelerator, and the ⌘N the header button would also reach.
    expect(await chord("o")).toBe(1);
    expect(await chord("n")).toBe(1);
    expect(await chord("o", { ctrlKey: true })).toBe(1);
    expect(
      ipc.invoke,
      "a chord fired while the picker is in flight must not open a second dialog",
    ).toHaveBeenCalledTimes(1);
    expect(store.getShellState()).toBe(during); // nothing moved, by identity
    expect(screenOf()).toBe("genesis");

    // The dialog is cancelled: the latch clears and the chords work again.
    await flush(() => {
      ipc.release?.({ kind: "cancelled" });
      ipc.release = null;
    });
    expect(store.getShellState().picking).toBe(false);
    expect(screenOf()).toBe("genesis");
    ipc.invoke.mockClear();
    expect(await chord("o")).toBe(1);
    expect(ipc.invoke).toHaveBeenCalledTimes(1);
  });

  it("also refuses the typed busy answer Rust sends when IT is the one holding the latch", async () => {
    const store = await import("../src/lib/watcher-store");
    const before = store.getShellState();
    ipc.outcomes.set("pick_project_folder", { kind: "busy" });
    expect(await chord("o")).toBe(1);
    expect(ipc.invoke).toHaveBeenCalledWith("pick_project_folder");
    // T-021's typed `busy` reduces to `prev` BY IDENTITY — the accelerator
    // path inherits that rather than re-deciding it.
    expect(store.getShellState().rejectedPick).toBe(before.rejectedPick);
    expect(screenOf()).toBe("genesis");
    ipc.outcomes.set("pick_project_folder", { kind: "cancelled" });
  });
});

describe("the header offers both ways in from an open project (criterion 2)", () => {
  it("pairs Open folder… with Start an interview, in that order, both wired", async () => {
    // Back to the board — through the accelerator, since an interview is
    // deliberately NOT yanked onto the board by its own pipeline (T-026).
    ipc.outcomes.set("pick_project_folder", {
      kind: "picked",
      snapshot: { seq: 9, projectDir: PROJECT_DIR, generatedAtMs: 9, files: [] },
    });
    await chord("o");
    ipc.outcomes.set("pick_project_folder", { kind: "cancelled" });
    ipc.invoke.mockClear();
    expect(screenOf()).toBe("board");

    const open = q('[data-testid="open-folder"]');
    const interview = q('[data-testid="header-start-interview"]');
    expect(open).not.toBeNull();
    expect(interview).not.toBeNull();
    expect(open?.textContent).toContain("Open folder…");
    expect(interview?.textContent).toContain("Start an interview");
    // The front door's order, kept: open first, interview second.
    const order = (open as HTMLElement).compareDocumentPosition(interview as Node);
    expect(
      order & Node.DOCUMENT_POSITION_FOLLOWING,
      "Open folder… comes first, as on the front door",
    ).toBeTruthy();

    await click(interview);
    expect(ipc.invoke).toHaveBeenCalledWith("pick_genesis_folder");
    expect(ipc.invoke).toHaveBeenCalledTimes(1);
    ipc.invoke.mockClear();
    await click(open);
    expect(ipc.invoke).toHaveBeenCalledWith("pick_project_folder");
  });

  it("disables both while a dialog is open, like the front door's pair", async () => {
    ipc.holdNext = true;
    await click(q('[data-testid="open-folder"]'));
    expect((q('[data-testid="open-folder"]') as HTMLButtonElement).disabled).toBe(true);
    expect((q('[data-testid="header-start-interview"]') as HTMLButtonElement).disabled).toBe(
      true,
    );
    await flush(() => {
      ipc.release?.({ kind: "cancelled" });
      ipc.release = null;
    });
    expect((q('[data-testid="header-start-interview"]') as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it("is absent from the interview screen and the front door (the board's header only)", async () => {
    ipc.outcomes.set("pick_genesis_folder", {
      kind: "genesis",
      projectDir: GENESIS_DIR,
      seq: 12,
      probe: PROBE,
    });
    await click(q('[data-testid="header-start-interview"]'));
    expect(screenOf()).toBe("genesis");
    expect(q('[data-testid="header-start-interview"]')).toBeNull();
    expect(q('[data-testid="open-folder"]')).toBeNull();
    ipc.outcomes.set("pick_genesis_folder", { kind: "cancelled" });
  });
});

describe("exactly one keydown path handles the chords (criterion 5)", () => {
  /** Call every live keydown listener in the app, one at a time, with
   * `init` — and count how many of them reach `command`. Each call is
   * flushed before the next, so the store's own single-flight latch
   * cannot mask a second handler by being busy when it runs (which is
   * why this is an enumeration and not a count of invokes per press). */
  async function pathsReaching(command: string, init: KeyboardEventInit): Promise<number> {
    let reached = 0;
    for (const path of [...livePaths]) {
      ipc.invoke.mockClear();
      await flush(() => {
        path.handler(
          new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }),
        );
      });
      if (ipc.invoke.mock.calls.some(([c]) => c === command)) reached += 1;
    }
    return reached;
  }

  it("one path reaches each command, out of every keydown listener the app has", async () => {
    // The app has been through every screen by now; whatever is still
    // listening is listening for good.
    expect(livePaths.length, "the app does have keydown listeners to enumerate").toBeGreaterThan(
      0,
    );
    expect(await pathsReaching("pick_project_folder", { key: "o", metaKey: true })).toBe(1);
    expect(await pathsReaching("pick_genesis_folder", { key: "n", metaKey: true })).toBe(1);
    expect(await pathsReaching("pick_project_folder", { key: "o", ctrlKey: true })).toBe(1);
  });

  it("the front door adds none of its own when it is on screen", async () => {
    const before = livePaths.length;
    // Back to an empty state — the component that used to own the
    // listener is mounted again, and must add nothing.
    ipc.outcomes.set("pick_project_folder", {
      kind: "noDocs",
      path: "/tmp/elsewhere",
      probe: PROBE,
    });
    await chord("o");
    expect(screenOf()).toBe("empty");
    expect(q('[data-testid="empty-state"]')).not.toBeNull();
    expect(livePaths.length, "the front door registers no listener of its own").toBe(before);
    expect(await pathsReaching("pick_project_folder", { key: "o", metaKey: true })).toBe(1);
    ipc.outcomes.set("pick_project_folder", { kind: "cancelled" });
  });
});

describe("which chords the app claims, and only those (criterion 6)", () => {
  it("matches ⌘/Ctrl + O and N, in either case, and nothing else", () => {
    const chordOf = (patch: Partial<Parameters<typeof matchAccelerator>[0]>) =>
      matchAccelerator({
        key: "o",
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        ...patch,
      });
    expect(chordOf({ metaKey: true })).toBe("openFolder");
    expect(chordOf({ ctrlKey: true })).toBe("openFolder");
    expect(chordOf({ key: "O", metaKey: true })).toBe("openFolder");
    expect(chordOf({ key: "n", metaKey: true })).toBe("startInterview");
    expect(chordOf({ key: "N", ctrlKey: true })).toBe("startInterview");
    // Everything else is somebody else's key — no preventDefault beyond
    // the two chords already claimed.
    expect(chordOf({})).toBeNull(); // bare o
    expect(chordOf({ key: "p", metaKey: true })).toBeNull();
    expect(chordOf({ key: "f", metaKey: true })).toBeNull(); // the map's own
    expect(chordOf({ metaKey: true, shiftKey: true })).toBeNull();
    expect(chordOf({ metaKey: true, altKey: true })).toBeNull();
    expect(chordOf({ key: "Escape" })).toBeNull();
  });
});
