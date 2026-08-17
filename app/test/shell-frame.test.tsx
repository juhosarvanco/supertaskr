// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { DocsSnapshotPayload } from "../src/lib/docs-model";

/**
 * T-048 — WHICH screens are bounded, and the chain that makes bounding
 * work. The MEASUREMENT (page scrollHeight vs viewport, the pane's own
 * region scrolling) lives where layout is real: `tools/e2e/tests/
 * genesis-screen.spec.ts`, at 800x600 / 1024x768 / 1280x720. jsdom has
 * no layout engine, so this file pins the two things a served-bundle
 * probe cannot cheaply pin instead:
 *
 *   THE SCOPING. The bound belongs to the genesis screen ALONE. Every
 *   other screen here is a scrolling PAGE, and bounding this column
 *   bounds `main` with it — which moves the board (its rail is a
 *   stretch-height sibling, 2202px over the dogfood tree, and a bounded
 *   frame stops the sidebar strip at the fold) and the map (its canvas
 *   is `overflow-hidden`, so at 800x600 a bounded frame clips it to
 *   446/320 with no scrollbar anywhere). Both measured in T-048's notes.
 *   Nothing in the lane asserts the rail's height, so without this test
 *   the scoping could be flattened to an unconditional `h-screen` and
 *   every existing suite would stay green.
 *
 *   THE CHAIN. A bounded box only hands its overflow down if every link
 *   between it and the scroll region can shrink: a flex item's automatic
 *   minimum size is its CONTENT, so one missing `min-h-0` anywhere on
 *   the path restores the old behaviour exactly. That is precisely how
 *   T-041-s3 was falsified — the column was bounded and the page grew
 *   anyway. The walk below fails if ANY link loses it, including the two
 *   links inside T-024's pane, which this task does not own.
 *
 * Real App, real store, real routing; only the IPC boundary is mocked
 * (the T-007/T-026 precedent). One ordered narrative, because the store
 * is a module singleton.
 */

const ipc = vi.hoisted(() => ({
  outcomes: new Map<string, unknown>(),
  listeners: new Map<string, (event: { payload: unknown }) => void>(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (command: string) => Promise.resolve(ipc.outcomes.get(command)),
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

// The store decides `isTauri` at import time, so the flag goes up first.
(window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {};
const { default: App } = await import("../src/App");

const GENESIS_DIR = "/tmp/sketchpad";
const PROBE = { roadmap: false, tasks: false, architecture: false, git: true };

let container: HTMLDivElement;
let root: Root;

const q = (selector: string): HTMLElement | null =>
  container.querySelector<HTMLElement>(selector);
const screenOf = (): string | null =>
  container.querySelector("main")?.getAttribute("data-screen") ?? null;

/** The shell's two frame elements: `main` (the row that also holds the
 * rail) and the column every screen renders inside. */
function frame(): { main: HTMLElement; column: HTMLElement } {
  const main = container.querySelector("main");
  expect(main, "the shell's main element").not.toBeNull();
  const column = main!.querySelector<HTMLElement>(":scope > div");
  expect(column, "the shell's content column").not.toBeNull();
  return { main: main as HTMLElement, column: column! };
}

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

const ROADMAP = `# Roadmap

## Backbone
1. **F-01 — The point** — prose
`;

const TASK = `---
id: T-001
title: A task
feature: F-01
milestone: 1
priority: 1
size: S
status: planned
blocked_by: []
touches: [app-shell]
---

## Acceptance criteria
- THE board SHALL render this card.
`;

beforeAll(async () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  ipc.outcomes.set("docs_snapshot", {
    kind: "noDocs",
    projectDir: GENESIS_DIR,
    probe: PROBE,
  });
  await act(async () => {
    root.render(<App />);
  });
});

afterAll(() => {
  act(() => root.unmount());
  container.remove();
});

describe("T-048 the frame holds — and only where it should", () => {
  it("1. the front door is a scrolling page: the column is not bounded", () => {
    expect(screenOf()).toBe("empty");
    const { main, column } = frame();
    expect(column.classList.contains("min-h-screen")).toBe(true);
    expect(column.classList.contains("h-screen")).toBe(false);
    expect(main.classList.contains("min-h-screen")).toBe(true);
  });

  it("2. the board and the map are scrolling pages too, and the rail rides main's floor", async () => {
    ipc.outcomes.set("pick_project_folder", {
      kind: "picked",
      snapshot: {
        seq: 2,
        projectDir: "/tmp/project",
        generatedAtMs: 2,
        files: [
          { path: "docs/ROADMAP.md", content: ROADMAP },
          { path: "docs/tasks/T-001-a-task.md", content: TASK },
        ],
      },
    });
    await click(q('[data-testid="pick-folder"]'));
    expect(screenOf()).toBe("board");

    const board = frame();
    expect(board.column.classList.contains("min-h-screen")).toBe(true);
    expect(board.column.classList.contains("h-screen")).toBe(false);
    // The rail is a sibling of the column inside `main`, stretched by
    // `align-items: stretch` — so `main`'s floor is what makes the
    // sidebar strip run the whole document, not just the first screenful.
    expect(q('[data-testid="pane-rail"]')).not.toBeNull();
    expect(board.main.classList.contains("min-h-screen")).toBe(true);

    await click(q('[data-testid="pane-rail-map"]'));
    expect(container.querySelector("main")?.getAttribute("data-pane")).toBe("map");
    const map = frame();
    expect(map.column.classList.contains("min-h-screen")).toBe(true);
    expect(map.column.classList.contains("h-screen")).toBe(false);
  });

  it("3. the genesis screen bounds its column to the window", async () => {
    // Back out through a folder the app refuses (no plan in it), which
    // is how the card that offers "Start an interview here" appears.
    ipc.outcomes.set("pick_project_folder", {
      kind: "noDocs",
      path: GENESIS_DIR,
      probe: PROBE,
    });
    await click(q('[data-testid="open-folder"]'));
    expect(screenOf()).toBe("empty");

    ipc.outcomes.set("start_genesis_here", {
      kind: "genesis",
      projectDir: GENESIS_DIR,
      seq: 5,
      probe: PROBE,
    });
    await click(q('[data-testid="start-interview-here"]'));
    expect(screenOf()).toBe("genesis");

    const { main, column } = frame();
    expect(column.classList.contains("h-screen"), "the interview's column is bounded").toBe(
      true,
    );
    expect(
      column.classList.contains("min-h-screen"),
      "a floor is not a ceiling — `min-h-screen` is what let the page grow",
    ).toBe(false);
    // `main` keeps its floor: it is the row the rail stretches inside,
    // and on this screen there is no rail to stretch. Bounding it too
    // changes nothing here and breaks the board — measured, T-048.
    expect(main.classList.contains("min-h-screen")).toBe(true);
  });

  it("4. every link from the bounded column to the pane's scroll region can shrink", async () => {
    // Real content, so the chain is walked over the tree the pane
    // actually renders rather than an empty state.
    //
    // T-028 RECONCILE — THE TASK FILE MOVED DOWN, and it had to. T-028
    // switches the right half from the lens to the REAL BOARD the moment
    // a task file parses, so leaving `T-001` in this snapshot would have
    // unmounted the very scroll region this walk is about. The lens's
    // chain is walked over a tree one turn before decomposition; the
    // BOARD's chain is walked below, over the same tree WITH the card in
    // it. Nothing was dropped — the file gained a second chain, which is
    // the only honest response to a screen that now has two right halves.
    await emitSnapshot({
      seq: 6,
      projectDir: GENESIS_DIR,
      generatedAtMs: 6,
      files: [{ path: "docs/ROADMAP.md", content: ROADMAP }],
    });
    expect(screenOf(), "the pipeline lighting up must not yank the interview away").toBe(
      "genesis",
    );

    const { column } = frame();

    /** Walk UP from a scroll region to the bounded column. Every link in
     * between must carry `min-h-0`, or its automatic minimum size (its
     * content) pins it open and the overflow escapes to the page. */
    const chainFrom = (scroller: HTMLElement): string[] => {
      const chain: string[] = [];
      for (let el = scroller; el !== column; el = el.parentElement as HTMLElement) {
        expect(el.parentElement, "the scroll region must descend from the column").not.toBeNull();
        const name =
          el.getAttribute("data-testid") ??
          `${el.tagName.toLowerCase()}.${el.className.split(" ")[0]}`;
        expect(
          el.classList.contains("min-h-0"),
          `${name} must be able to shrink below its content`,
        ).toBe(true);
        chain.push(name);
      }
      return chain;
    };

    // T-027 RECONCILE — THE CHAIN GREW A LINK, AND IT GREW A SECOND
    // CHAIN. T-048's own flags said this test "will go red and should be
    // re-derived, not deleted" the moment the genesis screen was
    // restructured, and this is that moment.
    //
    // The new link is `genesis-split`: the split is a real flex level
    // between the screen and the two halves, so it needs `min-h-0` for
    // exactly the reason every other link does, and it needs a
    // `data-testid` so it has a stable name here. NOTHING WAS LOOSENED —
    // the loop still requires `min-h-0` on every link it walks, and the
    // expected array is still a whole-path equality that reds if a link
    // appears, disappears or is renamed.
    //
    // THE STRENGTHENING: there are TWO scroll regions on this screen
    // now, and a chain that protects one of them protects the frame only
    // half as well. The chat's transcript gets the identical walk.
    const paneScroller = container.querySelector<HTMLElement>(
      '[data-testid="genesis-pane"] .overflow-y-auto',
    );
    expect(paneScroller, "the lens's own scroll region").not.toBeNull();
    expect(chainFrom(paneScroller!)).toEqual([
      "div.flex",
      "genesis-pane",
      "genesis-pane-slot",
      "genesis-split",
      "genesis-screen",
    ]);

    const logScroller = container.querySelector<HTMLElement>('[data-testid="interview-log"]');
    expect(logScroller, "the chat's own scroll region").not.toBeNull();
    expect(
      logScroller!.classList.contains("overflow-y-auto"),
      "the transcript is the thing asked to scroll, not the page",
    ).toBe(true);
    expect(chainFrom(logScroller!)).toEqual([
      "interview-log",
      "interview-chat",
      "genesis-split",
      "genesis-screen",
    ]);

    // T-028 — THE THIRD CHAIN, and the reason the walk is a walk rather
    // than a class assertion: the right half is now TWO renderers, and a
    // frame that holds for the lens proves nothing about the board. One
    // task file lands, the board takes over, and its own scroll region
    // gets the identical walk to the identical column.
    await emitSnapshot({
      seq: 7,
      projectDir: GENESIS_DIR,
      generatedAtMs: 7,
      files: [
        { path: "docs/ROADMAP.md", content: ROADMAP },
        { path: "docs/tasks/T-001-a-task.md", content: TASK },
      ],
    });
    expect(screenOf(), "still the interview — the board is its right half now").toBe("genesis");
    expect(
      container.querySelector('[data-testid="genesis-pane"]'),
      "the lens handed over",
    ).toBeNull();
    const boardScroller = container.querySelector<HTMLElement>(
      '[data-testid="genesis-board"] .overflow-y-auto',
    );
    expect(boardScroller, "the board half's own scroll region").not.toBeNull();
    expect(chainFrom(boardScroller!)).toEqual([
      "div.flex",
      "genesis-board",
      "genesis-pane-slot",
      "genesis-split",
      "genesis-screen",
    ]);
    // And the card really is inside it — the walk is over the tree the
    // board actually rendered, not an empty frame.
    expect(
      boardScroller!.querySelectorAll('[data-testid="task-card"]'),
      "one file, one card",
    ).toHaveLength(1);
  });

});
