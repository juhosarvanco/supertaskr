// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseProjectFromFiles, type FileEntry, type ProjectParseResult } from "@supertaskr/parser/pure";
import { MapView } from "../src/architecture/MapView";
import {
  __resetChurnForTests,
  applyChurnPayload,
  getChurnState,
  loadChurn,
  subscribeChurn,
  type ChurnState,
} from "../src/architecture/churn-source";
import { startDocsWatcher } from "../src/lib/watcher-store";

/**
 * T-116 — THE MAP'S CHURN SHOWS ITS AGE AND RE-MEASURES ON A SWITCH.
 *
 * Two properties, and they fail in opposite directions. The AGE is a
 * number the payload has carried since T-013 and the pane rendered
 * nowhere, so a reader could not tell a measurement taken this second
 * from one taken before lunch. The ATTRIBUTION is worse than silent: the
 * churn store is a module singleton and `MapView` is not remounted by a
 * project switch, so the previous repository's entries stayed in it and
 * were painted onto the NEW repository's components.
 *
 * WHAT THIS FILE PINS THAT NO OTHER DOES, body by body — the shape-six
 * question asked rather than assumed:
 *
 *  · the switch clears what the CANVAS attributes (the pane mounted);
 *  · the switch clears the STORE with no pane mounted at all, so the
 *    trigger cannot be a mount effect in disguise — that is the mutant
 *    the DOM body above cannot kill;
 *  · a switch RE-MEASURES, and a measurement already out for the old
 *    repository cannot land on the new one;
 *  · the age is RENDERED TEXT (asserting `measuredAtMs` reached the
 *    store pins nothing — it already did, and three fixtures already
 *    say so);
 *  · `measuredAtMs === 0` renders NO age, with the positive control
 *    built from the same producer (CONVENTIONS: a negative assertion
 *    needs a positive control);
 *  · single-flight is UNCHANGED — which no body in this repository
 *    asserted before this one.
 *
 * THE CLOCK IS FIXED, NEVER READ. `relativeTime` takes `nowMs`, and the
 * render passes `Date.now()`; a body that let the real clock in would be
 * a race with its own expectation. `Date.now` is stubbed for the file.
 */

declare global {
  // React 19's act() opt-in.
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const TAURI = "__TAURI_INTERNALS__";

/** A hand-driven `repo_churn`: the promise is parked until a test
 * releases it, which is the only way to observe a project switch landing
 * WHILE a measurement for the previous repository is still out. */
const ipc = vi.hoisted(() => ({
  churnCalls: 0,
  release: [] as ((payload: unknown) => void)[],
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (command: string) => {
    if (command === "repo_churn") {
      ipc.churnCalls += 1;
      return new Promise((resolve) => {
        ipc.release.push(resolve);
      });
    }
    return Promise.resolve({ kind: "noProject" });
  },
}));
vi.mock("@tauri-apps/api/event", () => ({
  emit: () => Promise.resolve(),
  listen: () => Promise.resolve(() => {}),
}));

/** Fixed "now". Every expected string below is stated against THIS. */
const NOW = 1_700_000_600_000;

let container: HTMLDivElement;
let root: Root;
let seq = 0;
let docsHarness: NonNullable<typeof window.__supertaskrDocsHarness>;

beforeEach(async () => {
  vi.spyOn(Date, "now").mockReturnValue(NOW);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  ipc.churnCalls = 0;
  ipc.release = [];
  // The browser branch of `runStartup` installs the docs harness, which
  // is the shipped `applyDocsPayload` by reference — so a switch driven
  // here runs the shell's OWN reducer and not an imitation of it.
  await startDocsWatcher();
  const harness = window.__supertaskrDocsHarness;
  if (harness === undefined) {
    throw new Error("no __supertaskrDocsHarness: the browser DEV gate did not install it");
  }
  docsHarness = harness;
  // Reset AFTER the shell exists, so the churn store's idea of which
  // project it is measuring starts equal to the shell's.
  __resetChurnForTests();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete (window as unknown as Record<string, unknown>)[TAURI];
  vi.restoreAllMocks();
});

// ---- fixtures ---------------------------------------------------------

function componentFile(id: string, name: string, paths: string[]): FileEntry {
  return {
    path: `docs/architecture/components/${id}-x.md`,
    content: [
      "---",
      `id: ${id}`,
      `name: ${JSON.stringify(name)}`,
      "paths:",
      ...paths.map((p) => `  - ${JSON.stringify(p)}`),
      "depends_on: []",
      "status: auto",
      "touch_slugs: []",
      "---",
      "prose.",
    ].join("\n"),
  };
}

function graphJson(paths: string[]): string {
  return JSON.stringify({
    schema: 1,
    root: ".",
    languages: ["ts"],
    files: paths.map((path) => ({ id: `f:${path}`, path, lang: "ts", loc: 1, symbols: [] })),
    packages: [],
    edges: [],
    unresolved: [],
  });
}

/** Two components with one indexed file each, so an entry can be
 * attributed to exactly one of them and a stale attribution is visible
 * as a NUMBER on a named node. */
function fixture(): { model: ProjectParseResult; graphContent: string } {
  const model = parseProjectFromFiles([
    componentFile("C-01", "Ay", ["src/a/**"]),
    componentFile("C-02", "Bee", ["src/b/**"]),
  ]);
  return { model, graphContent: graphJson(["src/a/a.ts", "src/b/b.ts"]) };
}

/** A measured payload, shaped exactly as Rust sends one. `hot` is what
 * C-02 ends up attributed, which is what a stale read paints onto the
 * next repository's C-02. */
function measuredPayload(options: { measuredAtMs: number; hot: number }): unknown {
  return {
    kind: "measured",
    windowDays: 30,
    commits: 42,
    truncated: false,
    rejected: 0,
    measuredAtMs: options.measuredAtMs,
    paths: [
      { path: "src/b/b.ts", commits: options.hot, lastCommitMs: 0 },
      { path: "src/a/a.ts", commits: 3, lastCommitMs: 0 },
    ],
  };
}

function renderMap(): void {
  const { model, graphContent } = fixture();
  act(() => {
    root.render(
      <MapView
        model={model}
        graphContent={graphContent}
        indexing={false}
        indexOutcome={null}
        onRunIndex={() => {}}
      />,
    );
  });
}

/** Move the shell onto a project. The FIRST call opens one; a later call
 * with a different folder is the switch this card is about. */
function openProject(projectDir: string): void {
  seq += 1;
  act(() => {
    docsHarness.apply({ seq, projectDir, generatedAtMs: 0, files: [] });
  });
}

const segment = (mode: string): HTMLButtonElement => {
  const el = container.querySelector(`[data-testid=map-overlay-${mode}]`);
  if (!(el instanceof HTMLButtonElement)) throw new Error(`no ${mode} segment`);
  return el;
};

/** What the canvas says C-02's churn is — the attribution, as a reader
 * sees it. */
const attributedCount = (id: string): string | null =>
  container.querySelector(`[data-component-id="${id}"] [data-testid=map-churn-count]`)
    ?.textContent ?? null;

const ageText = (): string | null =>
  container.querySelector("[data-testid=map-churn-age]")?.textContent ?? null;

// ---- 1 · the attribution, on the canvas --------------------------------

describe("a project switch stops the previous repository's numbers being painted", () => {
  it("the canvas attributes A's entries while A is open, and NONE of them once B is", () => {
    openProject("/repos/A");
    act(() => {
      applyChurnPayload(measuredPayload({ measuredAtMs: NOW - 5 * 60_000, hot: 40 }));
    });
    renderMap();
    act(() => segment("churn").click());

    // THE POSITIVE CONTROL: A's number really is on A's node, so the
    // absence below is a switch clearing it rather than a fixture that
    // never attributed anything.
    expect(attributedCount("C-02")).toBe("40");
    expect(getChurnState().kind).toBe("measured");

    openProject("/repos/B");

    // Not A's entries — not under a new name, and not for one paint.
    expect(getChurnState().kind).not.toBe("measured");
    expect(attributedCount("C-02")).toBeNull();
    expect(container.querySelector("[data-testid=map-churn-bar]")).toBeNull();
    // And the overlay says why rather than showing an empty churn view.
    expect(segment("churn").disabled).toBe(true);
  });
});

// ---- 2 · the same property with NO pane mounted ------------------------

describe("the store forgets on a switch even with no pane mounted", () => {
  it("passes through loading and never hands a subscriber A's entries under B", () => {
    openProject("/repos/A");
    act(() => {
      applyChurnPayload(measuredPayload({ measuredAtMs: NOW - 5 * 60_000, hot: 40 }));
    });
    expect(getChurnState().kind).toBe("measured");

    // Nothing is rendered in this body ON PURPOSE. A trigger armed from
    // `MapView`'s mount effect would pass body 1 and fail here, which is
    // the mutant body 1 cannot kill.
    const seen: ChurnState["kind"][] = [];
    const unsubscribe = subscribeChurn(() => seen.push(getChurnState().kind));
    openProject("/repos/B");
    unsubscribe();

    expect(seen[0], "the FIRST thing a subscriber sees after a switch").toBe("loading");
    expect(seen).not.toContain("measured");
    expect(getChurnState().kind).not.toBe("measured");
  });
});

// ---- 3 · it re-measures, and a stale flight cannot land ----------------

describe("a switch re-measures, and the previous repository's flight is abandoned", () => {
  it("asks git again for the new project", async () => {
    (window as unknown as Record<string, unknown>)[TAURI] = {};
    openProject("/repos/A");
    void loadChurn();
    expect(ipc.churnCalls, "one measurement for A").toBe(1);
    act(() => {
      ipc.release[0]?.(measuredPayload({ measuredAtMs: NOW - 5 * 60_000, hot: 40 }));
    });
    await act(async () => {});
    expect(getChurnState().kind).toBe("measured");

    openProject("/repos/B");
    expect(ipc.churnCalls, "and a second one for B, without being asked twice").toBe(2);
  });

  it("a measurement still OUT for A cannot fold onto B", async () => {
    (window as unknown as Record<string, unknown>)[TAURI] = {};
    openProject("/repos/A");
    void loadChurn();
    expect(ipc.churnCalls).toBe(1);

    // The switch lands while A's `repo_churn` is still outstanding.
    openProject("/repos/B");
    expect(ipc.churnCalls, "B is measured rather than waited for").toBe(2);
    // Only now does A's answer come back.
    act(() => {
      ipc.release[0]?.(measuredPayload({ measuredAtMs: NOW - 5 * 60_000, hot: 40 }));
    });
    await act(async () => {});

    expect(getChurnState().kind, "A's answer must not become B's state").not.toBe("measured");

    // AND THE ABANDONED FLIGHT MUST NOT RELEASE THE LATCH ITS SUCCESSOR
    // HOLDS. B's measurement is still out, so a further ask is still
    // single-flighted onto it — a third `git` here would mean A's late
    // settle unlocked the door behind it.
    void loadChurn();
    expect(ipc.churnCalls, "A's late settle must not free B's latch").toBe(2);
  });

  it("asks git NOTHING when the map has never been opened — there is no answer to replace", () => {
    (window as unknown as Record<string, unknown>)[TAURI] = {};
    // No `loadChurn`, no render: churn has never been measured on this
    // run, so a switch has nothing stale to drop. Re-measuring here would
    // spawn a subprocess for a pane nobody has looked at, on every
    // project open.
    openProject("/repos/A");
    openProject("/repos/B");
    expect(ipc.churnCalls, "no git for a pane that was never opened").toBe(0);
    expect(getChurnState().kind).toBe("loading");

    // And the laziness is not forgetfulness: the pane's own mount effect
    // still measures, and it measures the CURRENT folder.
    renderMap();
    expect(ipc.churnCalls, "the mount effect measures, once").toBe(1);
  });
});

// ---- 4 · the age, as rendered text -------------------------------------

describe("the churn footer says how old the number is", () => {
  it("renders the age the payload already carried, through the index hint's own relativeTime", () => {
    act(() => {
      applyChurnPayload(measuredPayload({ measuredAtMs: NOW - 5 * 60_000, hot: 40 }));
    });
    renderMap();
    act(() => segment("churn").click());
    expect(ageText()).toBe("measured 5m ago");
  });

  it("uses the SAME vocabulary as the index hint, down to 'just now'", () => {
    act(() => {
      applyChurnPayload(measuredPayload({ measuredAtMs: NOW - 30_000, hot: 40 }));
    });
    renderMap();
    act(() => segment("churn").click());
    expect(ageText()).toBe("measured just now");
  });
});

// ---- 5 · the zero branch ------------------------------------------------

describe("a measuredAtMs of 0 renders NO age rather than one computed from the epoch", () => {
  it("shows nothing where the same payload with a real timestamp shows an age", () => {
    // POSITIVE CONTROL FIRST, built by the same producer and differing in
    // exactly one field — so "absent" below means refused, never that the
    // fixture could not have rendered one.
    act(() => {
      applyChurnPayload(measuredPayload({ measuredAtMs: NOW - 3 * 3_600_000, hot: 40 }));
    });
    renderMap();
    act(() => segment("churn").click());
    expect(ageText()).toBe("measured 3h ago");

    act(() => {
      applyChurnPayload(measuredPayload({ measuredAtMs: 0, hot: 40 }));
    });
    act(() => segment("churn").click());

    expect(getChurnState().kind, "still a measured overlay — only the age is unknown").toBe(
      "measured",
    );
    expect(container.querySelector("[data-testid=map-churn-footer]")).not.toBeNull();
    expect(ageText(), "no age at all — never 1970, never 'just now'").toBeNull();
  });
});

// ---- 6 · what must NOT have changed -------------------------------------

describe("single-flight and the browser refusal are untouched by the new trigger", () => {
  it("a second loadChurn while one is out returns the SAME promise and spawns no second git", () => {
    (window as unknown as Record<string, unknown>)[TAURI] = {};
    const first = loadChurn();
    const second = loadChurn();
    expect(second).toBe(first);
    expect(ipc.churnCalls).toBe(1);
  });

  it("the browser bundle still refuses to OVERWRITE a state something else folded", async () => {
    act(() => {
      applyChurnPayload(measuredPayload({ measuredAtMs: NOW - 5 * 60_000, hot: 40 }));
    });
    // No Tauri runtime here: `loadChurn` may answer the unanswered
    // question and nothing else.
    await loadChurn();
    expect(getChurnState().kind).toBe("measured");
    expect(ipc.churnCalls, "and it spawned nothing").toBe(0);
  });
});
