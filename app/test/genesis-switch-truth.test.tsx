// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DocsSnapshotPayload } from "../src/lib/docs-model";

/**
 * T-042 at the shell boundary: what a GENESIS SWITCH tells the truth
 * about, driven through the REAL App, the REAL store, the real
 * docs-model and parser, with only the IPC boundary mocked.
 *
 * TWO CLAIMS THAT OUTLIVED THEIR TRUTH, both reproduced here against the
 * unfixed code before they were fixed, and both pinned so they cannot
 * come back.
 *
 * CRITERION 1 — the switch carried no tree. `apply_genesis_folder` gates
 * on "has no PLAN", not "has no docs/", so a folder holding a lone
 * `docs/ARCHITECTURE.md` and a `docs/decisions/` tree is
 * genesis-eligible. For that shape the watcher armed normally and
 * nothing emitted (nothing had CHANGED), so the pane rendered
 * `0 files written` over a docs/ that was not empty — two clicks after
 * the front door truthfully showed `✓ docs/ARCHITECTURE.md`. Measured on
 * the unfixed store, same payload minus the snapshot:
 *
 *   genesis-file-count -> "0 files written"   (both files invisible)
 *
 * CRITERION 3 — the echo. `commitPickOutcome` echoed whenever the docs
 * seq advanced, with the comment "Only a real snapshot advances the docs
 * seq". The genesis case advances it DELIBERATELY (that is how late
 * emits from the previous project are made provably stale) and Rust's
 * counter is global and monotonic, so the guard was ALWAYS true.
 * Measured on the unfixed store, a snapshot-less switch at seq 7 after a
 * real model at seq 3:
 *
 *   model-updated {"seq":7,"generatedAtMs":0,"taskCount":0,…}
 *
 * `generatedAtMs: 0` is the tell — no collection produced that payload.
 * The guard now reads the OUTCOME'S PROVENANCE instead.
 */

const ipc = vi.hoisted(() => ({
  invoke: vi.fn(),
  outcomes: new Map<string, unknown>(),
  listeners: new Map<string, (event: { payload: unknown }) => void>(),
  /** Every `model-updated` payload the store emitted, in order — the
   * round trip's own channel, captured where Rust would receive it. */
  echoes: [] as Record<string, unknown>[],
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (command: string) => {
    ipc.invoke(command);
    return Promise.resolve(ipc.outcomes.get(command));
  },
}));
vi.mock("@tauri-apps/api/event", () => ({
  emit: (name: string, payload: unknown) => {
    if (name === "model-updated") ipc.echoes.push(payload as Record<string, unknown>);
    return Promise.resolve();
  },
  listen: (name: string, handler: (event: { payload: unknown }) => void) => {
    ipc.listeners.set(name, handler);
    return Promise.resolve(() => {});
  },
}));

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const GENESIS_DIR = "/tmp/sketchpad";
const OTHER_DIR = "/projects/previously-open";
/** The verifier's own repro folder: ARCHITECTURE.md + a decisions tree,
 * so `architecture` probes true and `has_plan()` is still false. */
const PROBE = { roadmap: false, tasks: false, architecture: true, git: true };

const ARCHITECTURE = "# Architecture\n\nthe shape of the thing\n";
const DECISION = "# 001 - x\n\nwe chose x\n";
const OTHER_TASK =
  "---\nid: T-901\ntitle: Alpha\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: S\nstatus: building\n---\n";

/** The tree Rust collected at the moment of the switch. */
const existingDocs = (seq: number): DocsSnapshotPayload => ({
  seq,
  projectDir: GENESIS_DIR,
  generatedAtMs: 1_700_000_000_000 + seq,
  files: [
    { path: "docs/ARCHITECTURE.md", content: ARCHITECTURE },
    { path: "docs/decisions/001-x.md", content: DECISION },
  ],
});

let container: HTMLDivElement;
let root: Root;
let App: (typeof import("../src/App"))["default"];

const q = (selector: string): HTMLElement | null =>
  container.querySelector<HTMLElement>(selector);
const screenOf = (): string | null =>
  container.querySelector("main")?.getAttribute("data-screen") ?? null;
const fileCount = (): string =>
  q('[data-testid="genesis-file-count"]')?.textContent ?? "(no count rendered)";
/** Paths of artifact rows the pane shows as actually WRITTEN — the
 * `expected` placeholder rows are the lens's scaffold, not a claim that
 * anything is there. */
const writtenPaths = (): string[] =>
  [...container.querySelectorAll('[data-testid="genesis-artifact"]')]
    .filter((el) => el.getAttribute("data-status") !== "expected")
    .map((el) => el.getAttribute("data-path") ?? "");

async function flush(fn: () => void | Promise<void>): Promise<void> {
  await act(async () => {
    await fn();
  });
}

/**
 * A FRESH App over a FRESH store. The store is a module singleton (the
 * startup latch and `isTauri` both live at module scope), so each
 * narrative below gets its own module instance rather than inheriting
 * the previous one's watermark.
 */
async function mountFreshApp(status: unknown): Promise<void> {
  vi.resetModules();
  ipc.invoke.mockClear();
  ipc.outcomes.clear();
  ipc.listeners.clear();
  ipc.echoes.length = 0;
  ipc.outcomes.set("docs_snapshot", status);
  (window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {};
  ({ default: App } = await import("../src/App"));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<App />);
  });
}

/**
 * Answer whichever genesis command the screen in front of us reaches
 * with this outcome, and start the interview by a REAL CLICK on the
 * screen's own button — never by calling into the store. Both routes are
 * zero-argument commands and both land in the same reducer, which is why
 * the same outcome answers either.
 */
async function startInterview(outcome: unknown): Promise<void> {
  ipc.outcomes.set("start_genesis_here", outcome); // the No plan card
  ipc.outcomes.set("pick_genesis_folder", outcome); // the header / front door
  const button =
    q('[data-testid="start-interview-here"]') ??
    q('[data-testid="header-start-interview"]') ??
    q('[data-testid="start-interview"]');
  expect(button, "some screen offers the interview").not.toBeNull();
  await flush(() => {
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

beforeEach(() => {
  ipc.echoes.length = 0;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  vi.restoreAllMocks();
});

// ---- criterion 1 -------------------------------------------------------

describe("criterion 1: a genesis switch onto a folder that already has docs/", () => {
  it("renders the tree that is actually there, from the switch itself", async () => {
    // Launch resolves the folder the verifier used: docs/ with files but
    // no plan, so the front door offers the interview.
    await mountFreshApp({ kind: "noDocs", projectDir: GENESIS_DIR, probe: PROBE });
    expect(screenOf()).toBe("empty");
    // The card is truthful about ARCHITECTURE.md before the click — which
    // is what made the pane's silence afterwards a contradiction.
    expect(container.textContent).toContain("docs/ARCHITECTURE.md");

    await startInterview({
      kind: "genesis",
      projectDir: GENESIS_DIR,
      seq: 7,
      probe: PROBE,
      snapshot: existingDocs(7),
    });

    expect(screenOf()).toBe("genesis");
    // THE FIX, at the surface that made the false claim: the pane's own
    // live count, read off the rendered pane rather than off the store.
    expect(fileCount()).toContain("2 files written");
    // ...and the files are RENDERED, not merely counted.
    expect(writtenPaths()).toContain("docs/ARCHITECTURE.md");
    expect(writtenPaths()).toContain("docs/decisions/001-x.md");
    expect(container.textContent).not.toContain("nothing written yet");
  });

  it("still says 0 when the folder REALLY has no docs/ — the count is measured, not assumed", async () => {
    // The failing→passing pin's other end, and the whole point of
    // measuring: a docs-less switch carries `snapshot: null` and the
    // pane's 0 is then a fact rather than a default. This is exactly the
    // payload the unfixed store produced for BOTH folder shapes.
    await mountFreshApp({ kind: "noDocs", projectDir: GENESIS_DIR, probe: PROBE });
    await startInterview({
      kind: "genesis",
      projectDir: GENESIS_DIR,
      seq: 7,
      probe: PROBE,
      snapshot: null,
    });

    expect(screenOf()).toBe("genesis");
    expect(fileCount()).toContain("0 files written");
    // Every row the lens draws is a PLACEHOLDER for what the interview
    // will write; nothing is claimed written.
    expect(writtenPaths()).toEqual([]);
  });

  it("clears the previous project and keeps the stale-drop watermark", async () => {
    // The T-007 invariant a carried snapshot must not weaken: the
    // previous project's model goes, and a late emit from it drops.
    await mountFreshApp({
      kind: "open",
      snapshot: {
        seq: 3,
        projectDir: OTHER_DIR,
        generatedAtMs: 1_700_000_000_003,
        files: [{ path: "docs/tasks/T-901-alpha.md", content: OTHER_TASK }],
      },
    });
    expect(screenOf()).toBe("board");
    expect(container.textContent).toContain("T-901");

    await startInterview({
      kind: "genesis",
      projectDir: GENESIS_DIR,
      seq: 7,
      probe: PROBE,
      snapshot: existingDocs(7),
    });
    expect(screenOf()).toBe("genesis");
    expect(fileCount()).toContain("2 files written");
    // The previous project's task is gone, not merely hidden.
    expect(container.textContent).not.toContain("T-901");

    // A late emit from the OLD project, at a seq below the switch's:
    // dropped, so the interview is not yanked back to another folder.
    const handler = ipc.listeners.get("docs-changed");
    expect(handler).toBeDefined();
    await flush(() =>
      handler?.({
        payload: {
          seq: 5,
          projectDir: OTHER_DIR,
          generatedAtMs: 1_700_000_000_005,
          files: [{ path: "docs/tasks/T-901-alpha.md", content: OTHER_TASK }],
        },
      }),
    );
    expect(screenOf()).toBe("genesis");
    expect(fileCount()).toContain("2 files written");
    expect(container.textContent).not.toContain("T-901");
  });
});

// ---- criterion 3 -------------------------------------------------------

describe("criterion 3: the model-updated echo reads provenance, not the seq", () => {
  it("a snapshot-less switch emits NO echo — the generatedAtMs: 0 tell is gone", async () => {
    await mountFreshApp({
      kind: "open",
      snapshot: {
        seq: 3,
        projectDir: OTHER_DIR,
        generatedAtMs: 1_700_000_000_003,
        files: [{ path: "docs/tasks/T-901-alpha.md", content: OTHER_TASK }],
      },
    });
    // The startup snapshot is a REAL one and echoes, exactly as before —
    // the baseline this test measures the switch against.
    expect(ipc.echoes.length).toBe(1);
    expect(ipc.echoes[0]?.seq).toBe(3);
    expect(ipc.echoes[0]?.generatedAtMs).toBe(1_700_000_000_003);
    ipc.echoes.length = 0;

    await startInterview({
      kind: "genesis",
      projectDir: GENESIS_DIR,
      seq: 7,
      probe: PROBE,
      snapshot: null,
    });

    // The switch DID advance the watermark (that is the T-007
    // stale-drop invariant, unchanged) — and echoed nothing, because no
    // snapshot produced the state it advanced to.
    expect(screenOf()).toBe("genesis");
    expect(ipc.echoes, "a model nothing generated is not reported").toEqual([]);
    // Stated as the tell itself, so a regression names its own symptom.
    expect(ipc.echoes.some((echo) => echo.generatedAtMs === 0)).toBe(false);
  });

  it("a switch that DOES carry a snapshot echoes it, with the real timestamp", async () => {
    await mountFreshApp({ kind: "noDocs", projectDir: GENESIS_DIR, probe: PROBE });
    expect(ipc.echoes).toEqual([]); // noDocs is not a snapshot either

    await startInterview({
      kind: "genesis",
      projectDir: GENESIS_DIR,
      seq: 7,
      probe: PROBE,
      snapshot: existingDocs(7),
    });

    expect(ipc.echoes.length, "exactly one echo, for exactly one snapshot").toBe(1);
    const echo = ipc.echoes[0] ?? {};
    expect(echo.seq).toBe(7);
    // The tell, inverted: a real collection stamped this one.
    expect(echo.generatedAtMs).toBe(1_700_000_000_007);
    expect(echo.taskCount).toBe(0); // ARCHITECTURE.md and a decision, no tasks
    expect(echo.parseFailures).toEqual([]);
  });

  it("an ordinary pick still echoes — the guard was narrowed, not just tightened", async () => {
    await mountFreshApp({ kind: "noProject" });
    expect(ipc.echoes).toEqual([]);

    ipc.outcomes.set("pick_project_folder", {
      kind: "picked",
      snapshot: {
        seq: 4,
        projectDir: OTHER_DIR,
        generatedAtMs: 1_700_000_000_004,
        files: [{ path: "docs/tasks/T-901-alpha.md", content: OTHER_TASK }],
      },
    });
    const button = q('[data-testid="pick-folder"]');
    expect(button).not.toBeNull();
    await flush(() => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(screenOf()).toBe("board");
    expect(ipc.echoes.length).toBe(1);
    expect(ipc.echoes[0]?.seq).toBe(4);
    expect(ipc.echoes[0]?.taskCount).toBe(1);
  });

  it("a cancelled pick and a refused folder echo nothing at all", async () => {
    await mountFreshApp({ kind: "noProject" });
    ipc.echoes.length = 0;

    for (const outcome of [
      { kind: "cancelled" },
      { kind: "busy" },
      { kind: "noDocs", path: "/tmp/elsewhere", probe: PROBE },
      { kind: "error", path: "/tmp/gone", message: "that folder is no longer there" },
    ]) {
      ipc.outcomes.set("pick_project_folder", outcome);
      const button = q('[data-testid="pick-folder"]');
      if (button !== null) {
        await flush(() => {
          button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });
      }
      expect(ipc.echoes, `${outcome.kind} produced no model`).toEqual([]);
    }
  });
});
