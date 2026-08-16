// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { DocsSnapshotPayload } from "../src/lib/docs-model";

/**
 * T-026 end to end through the REAL shell: the real App, the real store,
 * the real docs-model and parser — only the IPC boundary is mocked (the
 * T-007 verifier's precedent, and the closest a headless suite gets to
 * the served bundle). One ordered narrative, because the store is a
 * module singleton and the flow it describes is itself ordered:
 *
 *   front door (no plan here) -> the empty board arrives on its own
 *   -> a rejected pick keeps the project -> Start an interview here
 *   -> the genesis screen -> docs/ lands and the pipeline lights up
 *   -> a cancelled pick changes nothing.
 */

const ipc = vi.hoisted(() => ({
  invoke: vi.fn(),
  outcomes: new Map<string, unknown>(),
  listeners: new Map<string, (event: { payload: unknown }) => void>(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (command: string) => {
    ipc.invoke(command);
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

// The store decides `isTauri` at import time, so the flag goes up before
// the dynamic import below (which is why these are not static imports).
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

/** Push one snapshot down the real `docs-changed` channel. */
function emitSnapshot(payload: DocsSnapshotPayload): Promise<void> {
  const handler = ipc.listeners.get("docs-changed");
  expect(handler).toBeDefined();
  return flush(() => handler?.({ payload }));
}

const ROADMAP = `# Roadmap

## Backbone
1. **F-01 — The point** — prose
`;

beforeAll(async () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  // Launch resolves a repo that has no plan in it — the first-launch
  // genesis entry, and the state T-018-s4 left stale.
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

describe("T-026 genesis entry, end to end through the real shell", () => {
  it("1. the front door names the folder with no plan and offers both ways in", () => {
    expect(screenOf()).toBe("empty");
    expect(q('[data-testid="no-plan-heading"]')?.textContent).toContain(
      `No plan in ${GENESIS_DIR}`,
    );
    expect(q('[data-testid="pick-folder"]')?.textContent).toContain("Open a folder…");
    expect(q('[data-testid="start-interview"]')?.textContent).toContain("Start an interview");
    expect(q('[data-testid="shortcut-hint"]')?.textContent).toBe("⌘O · ⌘N");
    // The probed .git shows as found; the three plan paths do not.
    const rows = [...container.querySelectorAll('[data-testid="plan-checklist"] li')].map(
      (li) => li.textContent ?? "",
    );
    expect(rows.filter((r) => r.includes("✓"))).toHaveLength(1);
    expect(rows[3]).toContain(".git");
    // No board, no rail behind it.
    expect(q('[data-testid="pane-rail"]')).toBeNull();
  });

  it("2. an EMPTY docs/ appearing replaces the stale claim with the empty board (criterion 4)", async () => {
    // This is exactly what the Rust arm-transition emit sends: a snapshot
    // with no files at all. Pre-T-026 it never arrived, and the front
    // door kept saying "no plan here" over a docs/ that existed.
    await emitSnapshot({
      seq: 1,
      projectDir: GENESIS_DIR,
      generatedAtMs: 1,
      files: [],
    });
    expect(screenOf()).toBe("board");
    expect(container.querySelector("main")?.getAttribute("data-task-count")).toBe("0");
    expect(q('[data-testid="no-plan-heading"]')).toBeNull();
    expect(q('[data-testid="pane-rail"]')).not.toBeNull(); // an open project has panes
  });

  it("3. a rejected pick shows the card again without disturbing what is open (criterion 6)", async () => {
    ipc.outcomes.set("pick_project_folder", {
      kind: "noDocs",
      path: "/tmp/elsewhere",
      probe: { ...PROBE, git: false },
    });
    await click(q('[data-testid="open-folder"]'));
    expect(screenOf()).toBe("empty");
    expect(q('[data-testid="no-plan-heading"]')?.textContent).toContain("/tmp/elsewhere");
    // Nothing found there at all, and no Adopt anywhere in v1.
    expect(container.textContent).not.toContain("✓");
    expect(container.textContent?.toLowerCase()).not.toContain("adopt");
    // The project underneath is untouched: keep-current returns to it.
    await click(q('[data-testid="keep-current"]'));
    expect(screenOf()).toBe("board");
  });

  it("4. Start an interview here opens the genesis screen full-bleed (criterion 2)", async () => {
    // Back to the card, then take its offer.
    await click(q('[data-testid="open-folder"]'));
    ipc.outcomes.set("start_genesis_here", {
      kind: "genesis",
      projectDir: GENESIS_DIR,
      seq: 5,
      probe: PROBE,
    });
    await click(q('[data-testid="start-interview-here"]'));

    expect(ipc.invoke).toHaveBeenCalledWith("start_genesis_here");
    expect(screenOf()).toBe("genesis");
    expect(q('[data-testid="genesis-project-dir"]')?.textContent).toBe(GENESIS_DIR);
    // Full-bleed: the rail stays board|map, which are an open project's
    // panes — an interview is not a pane.
    expect(q('[data-testid="pane-rail"]')).toBeNull();
    // The previous project's board does not linger behind the interview.
    // T-037 addendum (2026-08-16): the slot's placeholder line
    // (`genesis-docs-count`) is gone — T-024's lens is mounted there now,
    // so the live count is read off the PANE's own header. Changed, not
    // loosened: this asserts strictly more than the placeholder did,
    // since it can only pass if the pane itself rendered.
    expect(q('[data-testid="genesis-pane"]')).not.toBeNull();
    expect(q('[data-testid="genesis-file-count"]')?.textContent).toContain("0 files written");
  });

  it("5. docs/ landing under the genesis project lights the pipeline in place (criterion 3)", async () => {
    await emitSnapshot({
      seq: 9,
      projectDir: GENESIS_DIR,
      generatedAtMs: 9,
      files: [{ path: "docs/NORTH_STAR.md", content: "# the point" }],
    });
    // The model updated — and the interview screen stayed put.
    expect(screenOf()).toBe("genesis");
    expect(q('[data-testid="genesis-file-count"]')?.textContent).toContain("1 file written");

    await emitSnapshot({
      seq: 10,
      projectDir: GENESIS_DIR,
      generatedAtMs: 10,
      files: [
        { path: "docs/NORTH_STAR.md", content: "# the point" },
        { path: "docs/ROADMAP.md", content: ROADMAP },
      ],
    });
    expect(screenOf()).toBe("genesis");
    expect(q('[data-testid="genesis-file-count"]')?.textContent).toContain("2 files written");
    // The parsed model rode along — and since T-037 mounted the lens the
    // files are now RENDERED, not merely carried: both writes reach the
    // pane's artifact list through the real store and the real screen,
    // no longer "expected" rows.
    expect(container.querySelector("main")?.getAttribute("data-seq")).toBe("10");
    const status = (path: string): string | null =>
      q(`[data-testid="genesis-artifact"][data-path="${path}"]`)?.getAttribute("data-status") ??
      null;
    expect(status("docs/NORTH_STAR.md")).not.toBe("expected");
    expect(status("docs/ROADMAP.md")).not.toBe("expected");
    expect(status("docs/ARCHITECTURE.md")).toBe("expected"); // unwritten, still a row
  });

  it("6. a cancelled picker leaves the genesis project exactly where it was (criterion 6)", async () => {
    ipc.outcomes.set("pick_genesis_folder", { kind: "cancelled" });
    // No front-door button while the genesis screen is up: drive the
    // command the way the front door would.
    const store = await import("../src/lib/watcher-store");
    await flush(() => {
      void store.pickGenesisFolder();
    });
    expect(ipc.invoke).toHaveBeenCalledWith("pick_genesis_folder");
    expect(screenOf()).toBe("genesis");
    expect(q('[data-testid="genesis-file-count"]')?.textContent).toContain("2 files written");
    expect(q('[data-testid="genesis-project-dir"]')?.textContent).toBe(GENESIS_DIR);
  });
});
