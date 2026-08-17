// @vitest-environment jsdom
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { GenesisEvent } from "../src/lib/agent-store";
import type { DocsSnapshotPayload } from "../src/lib/docs-model";

/**
 * T-028 — THE DECOMPOSITION CRESCENDO, walked end to end through the REAL
 * App, the REAL shell store, the REAL agent store, the REAL parser and
 * REAL FILES ON A REAL DISK. Only the IPC boundary is mocked, which is
 * this repo's standing headless precedent (T-007's verifier, T-026,
 * T-049, T-027).
 *
 * THE FILES ARE THE POINT, so they are actually written. Every snapshot
 * below is read back off a TEMP PROJECT under `os.tmpdir()` that a
 * scripted planner has just written into — `docs/NORTH_STAR.md`,
 * `docs/ROADMAP.md`, then task files, one turn at a time, exactly as
 * `method/interview/plan-interview.md`'s banking map says. Nothing is
 * hand-assembled in memory, and NOTHING IS EVER WRITTEN INTO THIS REPO'S
 * OWN `docs/tasks/` — the temp root is created per run and removed after.
 *
 * WHAT THIS IS NOT: it is not a spawned CLI. A jsdom suite has no Tauri,
 * therefore no runner and no child process, and this task adds zero Rust.
 * The spawn → agent-writes-docs → watcher half is already proven RUST
 * side by T-025's `writes-docs` fake-agent scenario and its watcher
 * tests. What is proven HERE is the half nothing else can reach: that
 * real bytes landing in a real `docs/tasks/` turn into real cards on the
 * real board, live, inside the interview's own screen.
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

(window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {};
const { default: App } = await import("../src/App");

// ---- the temp project ---------------------------------------------------

const PROJECT = mkdtempSync(join(tmpdir(), "nputer-t028-"));
const DOCS = join(PROJECT, "docs");

/**
 * THE SCRIPTED PLANNER. Each call is one turn's worth of banking: it
 * WRITES the files (real bytes, real disk) and returns nothing. The
 * caller then pushes what the WATCHER would have collected, which is
 * read back off the same disk — so a file this script forgot to write
 * cannot possibly appear on screen.
 */
function plannerWrites(files: { path: string; content: string }[]): void {
  for (const { path, content } of files) {
    const full = join(PROJECT, path);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, content, "utf8");
  }
}

/** What the collector would ship: every file under the temp docs/ tree,
 * READ FROM DISK, in the snapshot shape Rust sends. */
function snapshotFromDisk(seq: number): DocsSnapshotPayload {
  const files: { path: string; content: string }[] = [];
  const walk = (dir: string, prefix: string): void => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full, `${prefix}/${name}`);
      else files.push({ path: `${prefix}/${name}`, content: readFileSync(full, "utf8") });
    }
  };
  walk(DOCS, "docs");
  return { seq, projectDir: PROJECT, generatedAtMs: 1_755_400_000_000 + seq, files };
}

const NORTH_STAR = `# North star

## Vision
A habit tracker that lives where its user already is: the terminal.

## Users
One concrete person: the founder who keeps forgetting.
`;

const ROADMAP = `# Roadmap

## Backbone
- F-01: Log — record a done habit
- F-02: Week view — see the streak

## Milestones
### Milestone 1
- T-001
`;

function taskFile(id: string, title: string, feature: string): { path: string; content: string } {
  return {
    path: `docs/tasks/${id}-${title.toLowerCase().replace(/[^a-z]+/g, "-")}.md`,
    content: [
      "---",
      `id: ${id}`,
      `title: ${JSON.stringify(title)}`,
      `feature: ${feature}`,
      "milestone: 1",
      "priority: 1",
      "size: S",
      "status: planned",
      "blocked_by: []",
      "---",
      "## Acceptance criteria",
      `- WHEN ${title} THE store SHALL say so.`,
    ].join("\n"),
  };
}

// ---- the harness --------------------------------------------------------

let container: HTMLDivElement;
let root: Root;

const q = (selector: string): HTMLElement | null => container.querySelector<HTMLElement>(selector);
const qa = (selector: string): HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>(selector),
];
const screenOf = (): string | null =>
  container.querySelector("main")?.getAttribute("data-screen") ?? null;
const cards = (): number => qa('[data-testid="task-card"]').length;

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
  expect(handler, "the watcher subscription must be live").toBeDefined();
  return flush(() => handler?.({ payload }));
}

/** Push one runner event down the real `genesis-turn` channel. */
function emitTurn(event: GenesisEvent): Promise<void> {
  const handler = ipc.listeners.get("genesis-turn");
  expect(handler, "the interview subscription must be live").toBeDefined();
  return flush(() => handler?.({ payload: event }));
}

beforeAll(async () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  ipc.outcomes.set("docs_snapshot", { kind: "noProject" });
  ipc.outcomes.set("genesis_status", {
    phase: "idle",
    projectDir: PROJECT,
    turn: 0,
    nativeSessionId: null,
    cliVersion: "2.1.226 (Claude Code)",
    methodVersion: "0.1.5",
    lastError: null,
    lastEventAtMs: null,
  });
  ipc.outcomes.set("genesis_start", { kind: "started", turn: 1 });
  ipc.outcomes.set("genesis_send_turn", { kind: "accepted", turn: 2 });
  await act(async () => {
    root.render(<App />);
  });
});

afterAll(() => {
  act(() => root.unmount());
  container.remove();
  rmSync(PROJECT, { recursive: true, force: true });
});

// ---- the narrative ------------------------------------------------------

describe("the crescendo, from a scaffold to a board (criteria 1, 2, 3, 5)", () => {
  it("1. the interview opens on the temp project, and the right half is the LENS", async () => {
    ipc.outcomes.set("pick_genesis_folder", {
      kind: "genesis",
      projectDir: PROJECT,
      seq: 1,
      probe: { roadmap: false, tasks: false, architecture: false, git: true },
    });
    const store = await import("../src/lib/watcher-store");
    await flush(() => {
      void store.pickGenesisFolder();
    });
    expect(screenOf()).toBe("genesis");

    // The planner scaffolds and banks Q1 and Q7 — everything except the
    // cards. This is stage 7 on the banking map: a backbone, no tasks.
    plannerWrites([
      { path: "docs/NORTH_STAR.md", content: NORTH_STAR },
      { path: "docs/ROADMAP.md", content: ROADMAP },
    ]);
    await emitSnapshot(snapshotFromDisk(2));

    expect(q('[data-testid="genesis-pane"]'), "the lens is the right half").not.toBeNull();
    expect(q('[data-testid="genesis-board"]'), "and the board is not").toBeNull();
    expect(q('[data-testid="genesis-pane-slot"]')?.getAttribute("data-half")).toBe("lens");
    // The lens is doing its job on the way: the backbone it parsed.
    expect(qa('[data-testid="genesis-feature"][data-kind="built"]')).toHaveLength(2);
  });

  it("2. the elapsed indicator renders WHILE genesis is in progress (criterion 3)", () => {
    const slot = q('[data-testid="interview-elapsed"]');
    expect(slot, "the design's elapsed slot is on screen").not.toBeNull();
    // A clock that started this second, in the design's own phrasing.
    expect(slot?.textContent).toBe("<1 min elapsed");
    // It is beside the stage readout, not instead of it.
    expect(q('[data-testid="interview-stage-readout"]')?.textContent).toContain("stage");
  });

  it("3. the FIRST task file lands and the right half becomes the real board", async () => {
    await emitTurn({ kind: "started", seq: 1, turn: 1 });
    await emitTurn({
      kind: "completed",
      seq: 2,
      turn: 1,
      text: "Milestone 1, decomposed. Three cards.",
      truncatedRelay: false,
    });

    plannerWrites([taskFile("T-001", "Store and done", "F-01")]);
    await emitSnapshot(snapshotFromDisk(3));

    expect(q('[data-testid="genesis-pane-slot"]')?.getAttribute("data-half")).toBe("board");
    expect(q('[data-testid="genesis-board"]'), "the board renderer is up").not.toBeNull();
    expect(q('[data-testid="genesis-pane"]'), "…and the lens has handed over").toBeNull();
    // THE REAL BOARD: a real card, from a real file, with the id the file
    // on disk carries.
    expect(cards()).toBe(1);
    expect(q('[data-testid="task-card"]')?.getAttribute("data-task-id")).toBe("T-001");
    expect(q('[data-testid="genesis-board-count"]')?.textContent).toBe("1 card · 1 task file");
    // The columns are the ROADMAP's own backbone — this is the board
    // component, not a lookalike.
    expect(qa('[data-testid="feature-column"]').length).toBeGreaterThanOrEqual(2);
    // The screen is still the interview: the conversation did not move.
    expect(screenOf()).toBe("genesis");
    expect(q('[data-testid="interview-chat"]')).not.toBeNull();
  });

  it("4. cards RAIN IN as more files land, live, without a remount", async () => {
    plannerWrites([taskFile("T-002", "Week view", "F-02")]);
    await emitSnapshot(snapshotFromDisk(4));
    expect(cards()).toBe(2);

    plannerWrites([taskFile("T-003", "Malformed store resilience", "F-01")]);
    await emitSnapshot(snapshotFromDisk(5));
    expect(cards()).toBe(3);
    expect(
      qa('[data-testid="task-card"]').map((c) => c.getAttribute("data-task-id")).sort(),
    ).toEqual(["T-001", "T-002", "T-003"]);
    expect(q('[data-testid="genesis-board-count"]')?.textContent).toBe("3 cards · 3 task files");
  });

  it("5. the rain is ONE entrance transition, and it is motion-safe gated (criterion 5)", () => {
    const rain = q('[data-testid="genesis-card-rain"]')!;
    // The class is assembled rather than written as a literal: Tailwind's
    // source detection scans test files, so a literal here would MINT the
    // very utility it claims to observe (T-012's scanner-hygiene trap).
    const gated = ["motion", "safe"].join("-") + ":" + ["board", "rain"].join("-");
    expect(rain.className.split(" ")).toContain(gated);
    // …and the UNGATED form appears NOWHERE in the app's own sources,
    // which is what makes the gate a gate rather than a decoration. The
    // rule is exact: every occurrence of the utility's name, anywhere
    // under src/, must be preceded by the variant's colon. Tailwind emits
    // a bare `.board-rain` rule from the `@utility` declaration itself
    // (exactly as it emits a bare `.animate-status-pulse` beside the
    // motion-safe one), so the sheet CANNOT prove this — only the source
    // can, and an ungated use would sail past a reduced-motion setting.
    const ungated = ["board", "rain"].join("-");
    const walkSources = (dir: string, out: string[]): string[] => {
      for (const name of readdirSync(dir).sort()) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walkSources(full, out);
        else if (/\.tsx?$/.test(name)) out.push(full);
      }
      return out;
    };
    for (const file of walkSources(resolve("src"), [])) {
      const lines = readFileSync(file, "utf8").split("\n");
      for (const [index, line] of lines.entries()) {
        let at = line.indexOf(ungated);
        while (at !== -1) {
          expect(
            line[at - 1],
            `${file}:${index + 1} uses the entrance class without the motion gate`,
          ).toBe(":");
          at = line.indexOf(ungated, at + 1);
        }
      }
    }
  });

  it("6. the completion state renders — board ready, elapsed, ONE CTA (criterion 2)", async () => {
    // The closing turn: the planner presents the board and stops. There
    // is no marker in the method for this (see `crescendo.ts`); what the
    // app reads is that the last turn SETTLED with a board on disk.
    await emitTurn({ kind: "started", seq: 3, turn: 2 });
    await emitTurn({
      kind: "completed",
      seq: 4,
      turn: 2,
      text: "That is milestone 1. Three cards, all dispatchable.",
      truncatedRelay: false,
    });

    const panel = q('[data-testid="genesis-complete"]')!;
    expect(panel, "the completion state is on screen").not.toBeNull();
    expect(q('[data-testid="genesis-board"]')?.getAttribute("data-complete")).toBe("true");
    expect(panel.textContent).toContain("The board is ready.");
    expect(q('[data-testid="genesis-complete-detail"]')?.textContent).toContain("3 cards");
    expect(q('[data-testid="genesis-complete-elapsed"]')?.textContent).toBe("<1 min elapsed");
    // The board it is celebrating is still under it — the panel never
    // replaces the thing it announces.
    expect(cards()).toBe(3);

    // ONE CTA, and no dispatch affordance anywhere on the completion
    // state (F-04's fence, asserted rather than remembered).
    const buttons = [...panel.querySelectorAll("button")];
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.getAttribute("data-testid")).toBe("genesis-open-board");
    expect(panel.textContent?.toLowerCase()).not.toContain("dispatch");
    expect(panel.textContent?.toLowerCase()).not.toContain("run task");
    expect(panel.textContent?.toLowerCase()).not.toContain("assign");
  });

  it("7. the CTA lands in the BOARD PANE on the new project, rail restored", async () => {
    await click(q('[data-testid="genesis-open-board"]'));

    // The whole handoff, through the real shell.
    expect(screenOf(), "the board screen").toBe("board");
    expect(q('[data-testid="pane-rail"]'), "the rail is back").not.toBeNull();
    expect(q('[data-testid="genesis-screen"]'), "the interview is over").toBeNull();
    // The SAME cards, now on the board pane, from the same live model.
    expect(cards()).toBe(3);
    expect(q('[data-testid="board"]')).not.toBeNull();
    // The header names the project the interview just planned.
    expect(container.querySelector("header")?.textContent).toContain(PROJECT);

    // NOT ONE COMMAND WAS ISSUED BY THE HANDOFF. The interview's folder
    // was already the watched project, so the CTA is a phase move and
    // nothing else — this is criterion 3's "zero new IPC" measured at the
    // one place a new command would have been tempting.
    const commandsAfter = ipc.invoke.mock.calls.map((call) => call[0] as string);
    expect(commandsAfter.filter((c) => c.includes("open"))).toEqual([]);
    expect(new Set(commandsAfter)).toEqual(
      new Set(["docs_snapshot", "genesis_status", "pick_genesis_folder", "genesis_start"]),
    );
  });
});

// ---- criterion 4: planning theater, refused ----------------------------

describe("a planner that ends without a parseable board (criterion 4)", () => {
  /**
   * Rendered through `GenesisScreen` directly rather than through `App`,
   * because the narrative above has already moved the singleton shell
   * onto the board and this is a different ending to the same story. The
   * files are still REAL and still in the temp project.
   */
  it("torn task files keep the lens, the parse chips and no celebration", async () => {
    const { GenesisScreen } = await import("../src/components/shell/GenesisScreen");
    const { applySnapshot, emptyState } = await import("../src/lib/docs-model");

    const failed = join(PROJECT, "..", `t028-theater-${process.pid}`);
    mkdirSync(join(failed, "docs", "tasks"), { recursive: true });
    writeFileSync(join(failed, "docs", "NORTH_STAR.md"), NORTH_STAR, "utf8");
    writeFileSync(join(failed, "docs", "ROADMAP.md"), ROADMAP, "utf8");
    // Two files under docs/tasks/ that no parser can establish a record
    // from — the "all parse-failing" half of the criterion.
    writeFileSync(join(failed, "docs", "tasks", "T-001-half.md"), "# T-001\n\nhalf a thought", "utf8");
    writeFileSync(join(failed, "docs", "tasks", "T-002-half.md"), "notes, not frontmatter", "utf8");

    const files: { path: string; content: string }[] = [];
    const walk = (dir: string, prefix: string): void => {
      for (const name of readdirSync(dir).sort()) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full, `${prefix}/${name}`);
        else files.push({ path: `${prefix}/${name}`, content: readFileSync(full, "utf8") });
      }
    };
    walk(join(failed, "docs"), "docs");

    const docs = applySnapshot(emptyState(), {
      seq: 1,
      projectDir: failed,
      generatedAtMs: 1,
      files,
    });
    expect(docs.failures.length, "the parser really did refuse them").toBe(2);

    const theater = document.createElement("div");
    document.body.appendChild(theater);
    const theaterRoot = createRoot(theater);
    act(() => {
      theaterRoot.render(<GenesisScreen projectDir={failed} docs={docs} onOpenBoard={() => {}} />);
    });

    const t = (selector: string): HTMLElement | null =>
      theater.querySelector<HTMLElement>(selector);
    // The view stays in-interview on the honest artifacts state…
    expect(t('[data-testid="genesis-pane-slot"]')?.getAttribute("data-half")).toBe("lens");
    expect(t('[data-testid="genesis-pane"]'), "the lens, not the board").not.toBeNull();
    expect(t('[data-testid="genesis-board"]')).toBeNull();
    expect(t('[data-testid="genesis-complete"]'), "and nothing is celebrated").toBeNull();
    expect(theater.querySelectorAll('[data-testid="task-card"]')).toHaveLength(0);
    // …with the existing parse-chip family reporting why.
    const chip = t('[data-testid="genesis-parse-chip"]');
    expect(chip?.textContent).toContain("2 parse errors");
    // The artifacts state is honest about the files that DO exist: the
    // torn ones are rows on the lens, not absences.
    const rows = [...theater.querySelectorAll('[data-testid="genesis-artifact"]')].map((r) =>
      r.getAttribute("data-path"),
    );
    expect(rows).toContain("docs/tasks/T-001-half.md");
    expect(rows).toContain("docs/tasks/T-002-half.md");

    act(() => theaterRoot.unmount());
    theater.remove();
    rmSync(failed, { recursive: true, force: true });
  });
});

// ---- criterion 3: zero new IPC, zero telemetry, measured ----------------

describe("zero new IPC and zero telemetry, counted rather than claimed", () => {
  /** Every `invoke<T>("name")` call site in the shipped frontend. */
  function frontendCommands(): string[] {
    const found = new Set<string>();
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir).sort()) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.tsx?$/.test(name)) {
          for (const m of readFileSync(full, "utf8").matchAll(/invoke<[^>]*>\("([a-z_]+)"/g)) {
            found.add(m[1]!);
          }
        }
      }
    };
    walk(resolve("src"));
    return [...found].sort();
  }

  it("the frontend reaches exactly the nine commands it reached before", () => {
    // The whole set, spelled out: a tenth would fail this line by name,
    // and so would a rename. `pick_project_folder` / `pick_genesis_folder`
    // / `start_genesis_here` go through one call site with a variable, so
    // they are asserted against the Rust handler below instead.
    expect(frontendCommands()).toEqual([
      "docs_snapshot",
      "genesis_cancel",
      "genesis_send_turn",
      "genesis_start",
      "genesis_status",
      "index_repo",
    ]);
  });

  it("Rust exposes exactly nine commands, and T-028 added none", () => {
    const lib = readFileSync(resolve("src-tauri/src/lib.rs"), "utf8");
    const handler = /invoke_handler\(tauri::generate_handler!\[([\s\S]*?)\]\)/.exec(lib);
    expect(handler, "the handler list must be findable").not.toBeNull();
    const names = handler![1]!
      .split("\n")
      .map((line) => line.replace(/\/\/.*$/, "").trim().replace(/,$/, ""))
      .filter((line) => line.length > 0);
    expect(names.sort()).toEqual([
      "docs_snapshot",
      "genesis_cancel",
      "genesis_send_turn",
      "genesis_start",
      "genesis_status",
      "index_repo",
      "pick_genesis_folder",
      "pick_project_folder",
      "start_genesis_here",
    ]);
  });

  it("nothing in the crescendo can reach a network, a disk or a device store", () => {
    // The elapsed clock is the one thing on this screen that could have
    // become telemetry, and it is a number in a module with no way out.
    const SINKS = [
      "fetch(",
      "XMLHttpRequest",
      "WebSocket",
      "sendBeacon",
      "localStorage",
      "sessionStorage",
      "indexedDB",
      "writeTextFile",
      "writeFile",
      "mkdir",
      "EventSource",
    ];
    const dir = resolve("src/genesis");
    for (const name of readdirSync(dir).sort()) {
      const text = readFileSync(join(dir, name), "utf8");
      for (const sink of SINKS) {
        expect(text.includes(sink), `${name} must not reach for ${sink}`).toBe(false);
      }
    }
  });

  it("and the interview screen's own files carry no raw-markup sink (ADR-009)", () => {
    const dir = resolve("src/genesis");
    for (const name of readdirSync(dir).sort()) {
      const text = readFileSync(join(dir, name), "utf8");
      expect(text).not.toContain("innerHTML");
      expect(text).not.toContain("dangerouslySetInnerHTML");
    }
  });
});
