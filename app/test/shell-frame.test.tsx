// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { DocsSnapshotPayload } from "../src/lib/docs-model";

/**
 * T-062 — ONE SCROLL MODEL, and the chain that makes bounding work.
 * (T-048 wrote this file to pin the OPPOSITE: which screens were bounded
 * and which were not. T-062 collapsed that fork, so the scoping pin is
 * rewritten to pin the single model instead of the conditional.)
 *
 * The MEASUREMENT — page scrollHeight against the viewport, each
 * screen's own region scrolling — lives where layout is real:
 * `tools/e2e/tests/shell-frame.spec.ts` (every screen, three viewports)
 * and `genesis-screen.spec.ts`. jsdom has no layout engine, so this file
 * pins the three things a served-bundle probe cannot cheaply pin:
 *
 *   THE MODEL. `main` and the column are bounded UNCONDITIONALLY, on
 *   every screen, and neither carries `min-h-screen` any more — a floor
 *   is not a ceiling, and having both models in one shell is the fork
 *   this task closed. Nothing in the lane can tell "bounded because
 *   `h-screen`" from "bounded because this screen's content happens to
 *   fit", so the class itself is asserted here.
 *
 *   WHAT THE BOUND COSTS, pinned so it cannot be silently un-paid. Each
 *   of these was MEASURED going wrong before it was fixed (T-062 notes):
 *   the rail collapsed from the document's height to the fold (4989 to
 *   840/700/600) until it got its own `h-screen`; the board had no
 *   scroll region at all, so the page was its scroll region and the
 *   header went with it; and the map canvas HID what it clipped —
 *   446/392 with `overflow-y: hidden` at 800x600, 54px of graph gone
 *   with no scrollbar and nothing red anywhere.
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

/** The single scroll model, asserted as LITERAL classes on both frame
 * elements. Deliberately not derived from anything the component also
 * derives from: a helper that read the expected class off the element
 * would pass for any class at all (T-063's drill — a test parametrised
 * by the constant it claims to pin, pins nothing). */
function expectBoundedFrame(where: string): void {
  const { main, column } = frame();
  expect(main.classList.contains("h-screen"), `${where}: main is bounded`).toBe(true);
  expect(
    main.classList.contains("min-h-screen"),
    `${where}: a floor is not a ceiling — \`min-h-screen\` is what let the page grow`,
  ).toBe(false);
  expect(column.classList.contains("h-screen"), `${where}: the column is bounded`).toBe(true);
  expect(column.classList.contains("min-h-screen"), `${where}: and only bounded`).toBe(false);
}

describe("T-062 the frame holds EVERYWHERE — one scroll model", () => {
  it("1. the front door is bounded, and its card owns a scroll region", () => {
    expect(screenOf()).toBe("empty");
    expectBoundedFrame("front door");

    // A bounded frame makes a centred card that outgrows it UNREACHABLE
    // unless the screen itself scrolls — the no-plan card is 663px tall
    // at 800x600 against a 600px window (T-048-s4, re-measured at T-062).
    const card = q('[data-testid="empty-state"]');
    expect(card, "the front door's section").not.toBeNull();
    expect(card!.classList.contains("overflow-y-auto"), "it scrolls").toBe(true);
    expect(card!.classList.contains("min-h-0"), "and it can shrink to do so").toBe(true);
    expect(card!.classList.contains("flex-1")).toBe(true);
  });

  it("2. the board is bounded, owns a scroll region, and the rail carries its OWN h-screen", async () => {
    ipc.outcomes.set("pick_project_folder", {
      kind: "picked",
      snapshot: {
        seq: 2,
        projectDir: "/tmp/project",
        generatedAtMs: 2,
        files: [
          { path: "docs/ROADMAP.md", content: ROADMAP },
          { path: "docs/tasks/T-001-a-task.md", content: TASK },
          {
            path: "docs/tasks/T-002-broken.md",
            content: "# no frontmatter — a real parser failure",
          },
        ],
      },
    });
    await click(q('[data-testid="pick-folder"]'));
    expect(screenOf()).toBe("board");
    expectBoundedFrame("board");

    // THE BOARD'S OWN SCROLL REGION — the whole point of bounding it.
    // Before T-062 the PAGE was the board's scroll region, so reaching
    // the last card took the header, the project path, the parse chips
    // and the theme toggle off-screen with it.
    const scroller = q('[data-testid="board-scroll"]');
    expect(scroller, "the board's scroll region").not.toBeNull();
    expect(scroller!.classList.contains("overflow-y-auto")).toBe(true);
    expect(scroller!.classList.contains("min-h-0")).toBe(true);
    expect(scroller!.classList.contains("flex-1")).toBe(true);
    expect(
      scroller!.querySelectorAll('[data-testid="task-card"]').length,
      "and the board really is inside it",
    ).toBe(1);

    // T-066: diagnostics stay a sibling of the board so a short error
    // remains visible while the board moves, but the sibling must own the
    // overflow generated by a hostile project tree. The browser lane pins
    // the 192px geometry; jsdom pins the token class and ownership on a
    // REAL parser failure rather than on a hand-built element.
    const details = q('[data-testid="parse-error-details"]');
    expect(details, "the malformed task produces the real details list").not.toBeNull();
    expect(details!.textContent).toContain(
      "docs/tasks/T-002-broken.md: no frontmatter — file must start with a '---' YAML block",
    );
    expect(details!.classList.contains("max-h-48"), "the token-backed 192px ceiling").toBe(true);
    expect(details!.classList.contains("overflow-y-auto"), "the details own their overflow").toBe(
      true,
    );
    expect(scroller!.contains(details!), "the details stay outside board-scroll").toBe(false);
    expect(details!.parentElement, "details and board are siblings").toBe(
      scroller!.parentElement,
    );

    // THE RAIL. It is a stretch-height sibling of the column, so it used
    // to inherit the DOCUMENT's height (4989px over this repo's own
    // docs/ tree). Under the bound it would collapse to the fold by
    // inheritance — right answer, wrong reason. Its own `h-screen` is
    // what makes the strip the window by construction, and this is the
    // only assertion anywhere that says so.
    const rail = q('[data-testid="pane-rail"]');
    expect(rail, "the rail renders on the board").not.toBeNull();
    expect(rail!.classList.contains("h-screen"), "the rail survives the bound").toBe(true);

    await click(q('[data-testid="pane-rail-map"]'));
    expect(container.querySelector("main")?.getAttribute("data-pane")).toBe("map");
    expectBoundedFrame("map");

    // THE TRAP T-048 MEASURED AND THIS TASK PAID. `overflow-hidden` on a
    // `min-h-0 flex-1` box does not merely fail to scroll — it DELETES
    // what it clips: 446/392 at 800x600 under a bound, 54px of graph
    // gone with no scrollbar anywhere. jsdom cannot see the geometry, so
    // it pins the class; `tools/e2e/tests/shell-frame.spec.ts` measures
    // the consequence where layout is real.
    const canvas = q('[data-testid="map-canvas"]');
    expect(canvas, "the map canvas").not.toBeNull();
    expect(canvas!.classList.contains("overflow-auto"), "the canvas scrolls").toBe(true);
    expect(
      canvas!.classList.contains("overflow-hidden"),
      "it must never go back to hiding what it clips",
    ).toBe(false);
  });

  it("3. the genesis screen is bounded by the same rule, not by a special case", async () => {
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

    // T-048 bounded THIS screen and only this one. The interview's
    // geometry is byte-identical before and after T-062 at all three
    // viewports (T-062's table) — what changed is that it is no longer
    // the exception. `main` is bounded here too, which T-048 measured as
    // costless on this screen and which is now what every screen does.
    expectBoundedFrame("genesis");
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
