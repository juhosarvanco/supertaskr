// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { DocsSnapshotPayload } from "../src/lib/docs-model";

/**
 * T-037 criterion 5, the shell half: a throw inside the mounted lens
 * must not take the APP down — not just the screen component.
 *
 * genesis-mount.test.tsx proves the boundary against the REAL pane
 * (a docs state whose `effective` map explodes on touch, so nothing is
 * stubbed) at screen level. That probe cannot reach this level: the
 * store builds every DocsModelState itself from the IPC payload, so a
 * hostile state cannot be pushed through the real pipeline. Here the
 * pane module is replaced by a switchable stand-in instead, and the
 * question asked is the one the criterion asks — the app is driven to
 * the genesis screen through the real App, the real store, the real
 * docs-model and parser (only the IPC boundary mocked, the T-007/T-026
 * precedent), the pane is made to throw, and the shell is checked for
 * still being there. The stand-in delegates to the real pane whenever
 * the switch is off, so the recovery leg is the genuine component.
 */

const probe = vi.hoisted(() => ({ throwOnRender: false }));

vi.mock("../src/genesis/GenesisPane", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/genesis/GenesisPane")>();
  return {
    GenesisPane: (props: React.ComponentProps<typeof actual.GenesisPane>) => {
      if (probe.throwOnRender) throw new Error("T-037 PROBE: the pane threw while rendering");
      return <actual.GenesisPane {...props} />;
    },
  };
});

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

// The store decides `isTauri` at import time (genesis-entry's note).
(window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {};
const { default: App } = await import("../src/App");
const store = await import("../src/lib/watcher-store");

const GENESIS_DIR = "/tmp/sketchpad";
const PROBE = { roadmap: false, tasks: false, architecture: false, git: true };

let container: HTMLDivElement;
let root: Root;

const q = (selector: string): HTMLElement | null => container.querySelector<HTMLElement>(selector);
const screenOf = (): string | null =>
  container.querySelector("main")?.getAttribute("data-screen") ?? null;

async function flush(fn: () => void): Promise<void> {
  await act(async () => {
    fn();
  });
}

function emitSnapshot(payload: DocsSnapshotPayload): Promise<void> {
  const handler = ipc.listeners.get("docs-changed");
  expect(handler).toBeDefined();
  return flush(() => handler?.({ payload }));
}

const file = (n: number): DocsSnapshotPayload["files"] =>
  [
    { path: "docs/NORTH_STAR.md", content: "# North star\n\n## Vision\nA point.\n" },
    { path: "docs/ROADMAP.md", content: "# Roadmap\n\n## Backbone\n- F-01: Log — a thing\n" },
  ].slice(0, n);

beforeAll(async () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  ipc.outcomes.set("docs_snapshot", { kind: "noDocs", projectDir: GENESIS_DIR, probe: PROBE });
  ipc.outcomes.set("start_genesis_here", {
    kind: "genesis",
    projectDir: GENESIS_DIR,
    seq: 1,
    probe: PROBE,
  });
  await act(async () => {
    root.render(<App />);
  });
  // Front door -> the interview, the way the card's button does it.
  await flush(() => {
    void store.startGenesisHere();
  });
});

afterAll(() => {
  probe.throwOnRender = false;
  act(() => root.unmount());
  container.remove();
});

describe("a throwing lens does not take the app down (T-037 criterion 5)", () => {
  it("1. the real pane renders on the genesis screen first", async () => {
    expect(screenOf()).toBe("genesis");
    await emitSnapshot({ seq: 20, projectDir: GENESIS_DIR, generatedAtMs: 20, files: file(1) });
    expect(q('[data-testid="genesis-pane"]')).not.toBeNull();
    expect(q('[data-testid="genesis-file-count"]')?.textContent).toContain("1 file written");
  });

  it("2. the pane throws: the app is still standing, on the same screen", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    probe.throwOnRender = true;
    await emitSnapshot({ seq: 21, projectDir: GENESIS_DIR, generatedAtMs: 21, files: file(2) });

    // The shell: still mounted, still the genesis screen, still chrome.
    expect(container.querySelector("main")).not.toBeNull();
    expect(screenOf()).toBe("genesis");
    expect(container.querySelector("h1")?.textContent).toBe("nputer");
    expect(container.textContent).toContain("Starting a plan in");
    expect(q('[data-testid="genesis-screen"]')).not.toBeNull();
    // The store kept running underneath — the snapshot was applied.
    expect(container.querySelector("main")?.getAttribute("data-seq")).toBe("21");

    // Only the pane's subtree went; what replaces it says what happened
    // and refuses to imply data loss.
    expect(q('[data-testid="genesis-pane"]')).toBeNull();
    const failed = q('[data-testid="genesis-pane-failed"]')!;
    expect(failed.textContent).toContain("the view of docs/ stopped rendering");
    expect(failed.textContent).toContain("Nothing was written and nothing was lost");
    expect(logged).toHaveBeenCalledWith(
      "[nputer] the genesis pane failed to render",
      expect.anything(),
    );
    logged.mockRestore();
  });

  it("3. the next snapshot retries, and the real pane comes back", async () => {
    probe.throwOnRender = false;
    await emitSnapshot({ seq: 22, projectDir: GENESIS_DIR, generatedAtMs: 22, files: file(2) });
    expect(screenOf()).toBe("genesis");
    expect(q('[data-testid="genesis-pane-failed"]')).toBeNull();
    expect(q('[data-testid="genesis-pane"]')).not.toBeNull();
    expect(q('[data-testid="genesis-file-count"]')?.textContent).toContain("2 files written");
    // The real component, not the stand-in's shell: its derived content
    // is there (the ROADMAP's feature reached the backbone grid).
    const built = [...container.querySelectorAll('[data-testid="genesis-feature"]')].filter(
      (cell) => cell.getAttribute("data-kind") === "built",
    );
    expect(built).toHaveLength(1);
    expect(built[0]?.textContent).toContain("F-01");
  });
});
