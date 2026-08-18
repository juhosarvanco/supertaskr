// @vitest-environment jsdom
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseProjectFromFiles, type FileEntry } from "@nputer/parser/pure";
import { MapView } from "../src/architecture/MapView";
import { deriveArchitecture } from "../src/lib/architecture/derive";
import { GRAPH_FILE } from "../src/lib/docs-model";

// THE DOGFOOD HERO (T-012 plan §8): the live docs/ tree + the committed
// graph render the map of the nputer repo itself. Expectations follow
// the reconciled dogfood fixture (architecture-dogfood.test.ts) and its
// maintenance contract: they change only when the committed graph
// regenerates or the registry changes.

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom rewrites import.meta.url to the page origin, so anchor on the
// runner's cwd via a relative path instead (vitest runs from app/ —
// vitest.config.ts's home; node resolves relative fs paths against it).
const ROOT = resolve("..");
const read = (p: string): string => readFileSync(join(ROOT, p), "utf8");

function liveFiles(): FileEntry[] {
  const entries: FileEntry[] = [];
  for (const name of readdirSync(join(ROOT, "docs/tasks"))) {
    if (name.endsWith(".md")) {
      entries.push({ path: `docs/tasks/${name}`, content: read(`docs/tasks/${name}`) });
    }
  }
  for (const name of readdirSync(join(ROOT, "docs/architecture/components"))) {
    if (name.endsWith(".md")) {
      entries.push({
        path: `docs/architecture/components/${name}`,
        content: read(`docs/architecture/components/${name}`),
      });
    }
  }
  entries.push({ path: "docs/ROADMAP.md", content: read("docs/ROADMAP.md") });
  return entries;
}

let container: HTMLDivElement;
let root: Root;

beforeAll(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  const model = parseProjectFromFiles(liveFiles());
  act(() => {
    root.render(
      <MapView
        model={model}
        graphContent={read(GRAPH_FILE)}
        indexing={false}
        indexOutcome={null}
        onRunIndex={() => {}}
      />,
    );
  });
});

afterAll(() => {
  act(() => root.unmount());
  container.remove();
});

const node = (id: string): HTMLElement => {
  const el = container.querySelector(`[data-component-id="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`node ${id} not rendered`);
  return el;
};

describe("the nputer repo on its own map", () => {
  it("renders all eleven declared components in full mode, no unmapped bucket, no banner", () => {
    // Ten since T-024 declared C-13 (genesis pane); ELEVEN since T-025
    // declared C-14 (agent runner). See the reconciliation blocks in
    // architecture-dogfood.test.ts for both enumerated deltas.
    expect(container.querySelectorAll("[data-testid=map-node]")).toHaveLength(11);
    expect(container.querySelector('[data-component-id="unmapped"]')).toBeNull();
    expect(container.querySelector("[data-testid=map-degraded]")).toBeNull();
  });

  it("C-01 dogfoods the pin: pinned done, the word on the face", () => {
    const c01 = node("C-01");
    expect(c01.getAttribute("data-status")).toBe("done");
    expect(c01.getAttribute("data-pinned")).toBe("true");
    expect(c01.className).toContain("bg-status-done");
    expect(c01.textContent).toContain("pin");
  });

  it("C-07 is declared-only: zero TS files match its globs", () => {
    const c07 = node("C-07");
    expect(c07.className).toContain("bg-transparent");
    expect(c07.className).toContain("border-map-declared-only-border");
    expect(c07.textContent).toContain("declared · no files yet");
  });

  it("the reconciled findings light the right faces (D1 sources + D3 rings)", () => {
    // D1 sources: C-05 (×4: →C-06, →C-09, →C-13 since the T-024 merge
    // regen, and →C-14 since the T-025 one), C-08, C-09. D3: C-01,
    // C-07, C-11 — C-13's D3 cleared when the indexer first saw
    // app/src/genesis/, C-14's when it first saw agent-store.ts.
    expect(node("C-05").querySelector("[data-testid=map-drift-count]")?.textContent).toBe(
      "drift 4",
    );
    expect(node("C-08").querySelector("[data-testid=map-drift-count]")?.textContent).toBe(
      "drift 1",
    );
    expect(node("C-09").querySelector("[data-testid=map-drift-count]")?.textContent).toBe(
      "drift 1",
    );
    // NEW at the T-027 merge regen: C-13 is a D1 SOURCE for the first
    // time (→C-05 via components/ui/button.tsx, →C-14 via
    // agent-store.ts), so it gains a count of its own beside the three
    // above. C-05 STAYS at 4 — its two grown findings grew their file-edge
    // lists, not their number.
    // 2 → 4 at the T-028 merge regen, and THIS ONE THE FORECAST MISSED —
    // recorded rather than quietly fixed. C-13 gains two whole D1
    // findings (→C-06, →C-08), and a drift COUNT moves when the number of
    // findings moves, not when their file-edge lists grow. T-051's and
    // T-053's regens both added edges whose heads were packages, so no
    // finding was created and every drift count held; that made "the
    // drift rings do not move" feel like a property when it was a
    // coincidence of those two merges. C-05 still stays at 4 for the
    // original reason — its grown findings grew their lists, not their
    // number — which is exactly why the two behave differently here.
    // T-029 merge regen: EVERY drift count above holds, and the reason is
    // the T-028 lesson used rather than the coincidence it replaced. A
    // count moves when the NUMBER of a component's D1 findings moves. This
    // merge creates no finding — it adds one indexed file whose three
    // cross-component edges all land on pairs that already had one
    // (C-05→C-10, C-05→C-13, C-05→C-14), so two fileEdges LISTS grow and
    // no ring does. Derived by re-running the live derivation and diffing
    // against this fixture BEFORE anything was run, not by reading counts.
    expect(node("C-13").querySelector("[data-testid=map-drift-count]")?.textContent).toBe(
      "drift 4",
    );
    expect(node("C-05").className).toContain("map-drift-ring");
    expect(node("C-01").className).toContain("map-drift-ring"); // D3, non-code
    expect(node("C-11").className).toContain("map-drift-ring"); // D3, non-code
    // The map pane itself is clean after the §2 amendments.
    expect(node("C-12").className).not.toContain("map-drift-ring");
    // THE ASSERTION THAT INVERTS at the T-027 merge regen, and the one no
    // count check can see: the genesis pane was clean while it was only
    // the TARGET of C-05's undeclared edge. T-027 gives it outgoing
    // undeclared edges of its own, so the ring lights.
    expect(node("C-13").className).toContain("map-drift-ring");
  });

  it("C-12 renders its LIVE rollup — this task, on its own map (churn-proof)", () => {
    // The dogfood fixture's maintenance contract: task-status churn
    // must never move these pins — T-012 itself flips building →
    // verifying → done as it moves through the pipeline. Assert the
    // face matches the live derivation instead of pinning a value.
    const model = parseProjectFromFiles(liveFiles());
    const derived = deriveArchitecture({
      components: model.components ?? [],
      tasks: model.tasks,
    });
    const status = derived.components.find((c) => c.id === "C-12")?.status;
    expect(status).toBeDefined();
    expect(node("C-12").getAttribute("data-status")).toBe(status);
    expect(node("C-12").className).toContain(`bg-status-${status}`);
  });

  it("draws the full 32-edge relation table", () => {
    // 23 + C-13's two declared edges (T-024) + the undeclared
    // C-05→C-13 the merge regen surfaced + C-14→C-10, T-025's one
    // declared edge (planned: no TS import can confirm a Rust-side
    // dependency until T-010 extracts Rust) + the undeclared C-05→C-14
    // the T-025 merge regen surfaced, which is why undeclared was 6.
    // 28 → 30 at the T-027 merge regen, and BOTH new rows leave C-13:
    // C-13→C-14 (forecast — every new genesis module reads the store)
    // and C-13→C-05 (NOT forecast — both new chat components import the
    // shared components/ui/button.tsx). So undeclared goes 6 → 8, and
    // that second count is a separate assertion from the first: the row
    // count going right does not make the relation tally right.
    // 30 → 32 at the T-028 merge regen, and BOTH new rows leave C-13
    // again: C-13→C-06 (crescendo.ts imports the parser — the switch
    // counts task RECORDS) and C-13→C-08 (BoardCrescendo.tsx mounts the
    // real Board, read-only). So undeclared goes 8 → 10, and this is the
    // second-assertion-in-the-same-body trap for the third merge running
    // — both numbers were derived from the indexed added-file list before
    // the suite ran, because a red on the first hides the second.
    // T-029 merge regen: 32 and 10 both HOLD. The trap in this body is
    // unchanged (two assertions, one it()), so both were forecast rather
    // than read off a red: a row is created only by a component PAIR that
    // had none, and every new edge here lands on an existing pair.
    expect(container.querySelectorAll("[data-testid=map-edge]")).toHaveLength(32);
    expect(
      container.querySelectorAll('[data-testid=map-edge][data-relation="undeclared"]'),
    ).toHaveLength(10);
  });

  it("opens the C-05 panel on its real findings", () => {
    act(() => node("C-05").click());
    const panel = container.querySelector("[data-testid=map-panel]") as HTMLElement;
    expect(panel.querySelector("[data-testid=map-panel-drift-chip]")?.textContent).toContain(
      "4 drift findings",
    );
    expect(panel.textContent).toContain("C-05 imports C-06 without declaring the dependency.");
    expect(panel.textContent).toContain("C-05 imports C-09 without declaring the dependency.");
    expect(panel.textContent).toContain("C-05 imports C-13 without declaring the dependency.");
    // The fourth, since the T-025 merge regen: C-05's own suite reaching
    // the agent runner's store. Asserted by its rendered sentence, not
    // just counted, so the renumbering above can never pass on a
    // different finding.
    expect(panel.textContent).toContain("C-05 imports C-14 without declaring the dependency.");
    // The dependency grid shows the observed-only rows in warning ink
    // and the header hint counts the committed graph.
    expect(panel.querySelector("[data-testid=map-panel-dependencies]")).not.toBeNull();
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
  });

  it("the header hint reads the committed graph's scale", () => {
    // 59 → 75 at the T-012 merge regen (T-009-s1): the map's own nine
    // sources and seven test suites joined the committed graph.
    // 75 → 76 at the T-018 merge regen: the watcher-truth suite joined.
    // 76 → 78 at the T-019 merge regen (2026-08-16): validate.ts and
    // validate.test.ts joined C-06 — see architecture-dogfood's dated
    // reconciliation for the full delta enumeration.
    // 78 → 82 at the T-024 merge regen (2026-08-16): the genesis pane's
    // two sources and its two suites joined.
    // 82 → 84 at the T-026 merge regen (2026-08-16): GenesisScreen.tsx
    // (the shell's SLOT for that pane) and the genesis-entry suite.
    // 84 → 86 at the T-037 merge regen (2026-08-16): the two suites that
    // pin the actual MOUNT — genesis-mount and genesis-pane-boundary.
    // 86 → 88 at the T-025 merge regen (2026-08-16): the agent runner's
    // TS half — agent-store.ts (C-14's) and its suite (C-05's). The
    // runner's five .rs files are NOT in this count: languages is still
    // ["ts"] until T-010, so the map under-reports C-14 by design.
    // 88 → 89 at the T-041 merge regen (2026-08-16): one file —
    // app/test/shell-harness.test.ts. The merge's other five new .ts
    // files live under tools/, which .nputerignore excludes, so a lane
    // that grew by ten specs adds exactly one node to the map.
    // 89 → 90 at the T-048 merge regen (2026-08-16): one file —
    // app/test/shell-frame.test.tsx. T-048's two SOURCE edits (App.tsx,
    // GenesisScreen.tsx) are class-string changes: they move those
    // files' hash and loc and add no node, which is what a layout fix
    // should look like on the map.
    // 90 → 92 at the T-049 merge regen (2026-08-16): two files —
    // app/src/components/shell/accelerators.ts and its suite
    // app/test/accelerators.test.tsx. The third new file,
    // tools/e2e/tests/accelerators.spec.ts, lives under tools/ and is
    // .nputerignored, so the lane's real trusted-chord test is invisible
    // here exactly as T-041's ten were.
    // 92 → 94 at the T-050 merge regen (2026-08-17): two files —
    // app/test/startup-recovery.test.ts and app/test/startup-screen.
    // test.tsx. The third new file, tools/e2e/tests/startup-recovery.
    // spec.ts, is .nputerignored under tools/ like every lane spec
    // before it. T-050's two SOURCE edits (App.tsx, watcher-store.ts)
    // add no node: they move those files' hash, loc and symbol counts,
    // and they RETIRE four intra-file edges — the work moved out of
    // startDocsWatcher into the extracted runStartup, so the latch's
    // own outgoing calls and type_refs went with it.
    // 94 → 99 at the T-034 merge regen (2026-08-17): FIVE files, the
    // largest single jump this log records. Three are C-12's own —
    // app/src/architecture/TasksLens.tsx, map-lens.ts and task-waves.ts
    // — and two are C-05's under the app/test/** umbrella,
    // map-task-waves.test.ts and map-tasks-lens-dom.test.tsx. T-034's
    // two SOURCE edits to existing files add no node: MapView.tsx gains
    // the lens control, and map-layout.ts changes by ONE BYTE (a literal
    // U+0003 replaced by its escape — behaviour-identical, hash-visible).
    // The node and edge counts above are deliberately UNCHANGED: 19 new
    // import edges, and every one lands on a component pair the
    // 28-row table already carries, so the picture gains detail and no
    // shape.
    // 99 → 100 at the T-042 merge regen (2026-08-17): ONE file,
    // app/test/genesis-switch-truth.test.tsx, under C-05's app/test/**
    // umbrella. T-042's SOURCE edits add no node — GenesisPane.tsx moves
    // by a comment only (criterion 4's ratification header) and
    // watcher-store.ts gains one exported symbol. The node and edge
    // counts above are again UNCHANGED: the single new cross-component
    // import edge lands on C-05→C-10, a pair the 28-row table already
    // carries. A fourth file moves hash without moving anything else —
    // app/test/startup-screen.test.tsx, the architect-instructed
    // control-byte repair (raw NUL+BEL+ESC → escapes), the same shape as
    // map-layout.ts's one-byte correction two entries above.
    // 100 → 107 at the T-027 merge regen (2026-08-17), the largest single
    // jump this hint has taken: four new C-13 modules under
    // app/src/genesis/** and three new suites under C-05's app/test/**
    // umbrella. Unlike the four merges above, the edge and node picture
    // DOES move here — the relation table goes 28 → 30 and C-13 lights a
    // drift ring — so the two assertions above move with this one.
    // 107 → 109 at the T-053 merge regen (2026-08-17): TWO files, and
    // for the first time in this log neither belongs to C-05 or C-13 —
    // lib/parser/src/id-slot.ts and lib/parser/test/id-slot.test.ts,
    // both C-06's. This is the OPPOSITE of the T-027 entry above: the
    // node and edge pictures do NOT move. All ten new edges are
    // C-06-INTERNAL by construction (three src imports of id-slot.ts,
    // the suite's two imports, four call edges into aliasedIdSlots /
    // idSlotKey, and one type_ref ParseIssue → IdSpace), so no
    // component PAIR is created or grown: the 30-edge table, the 8
    // undeclared and every drift count above stay byte-identical. A
    // lift that keeps its blast radius inside one component is what
    // that looks like on the map.
    // 109 → 110 at the T-051 merge regen (2026-08-17): ONE file, C-05's
    // app/test/window-manifest.test.ts. The branch added TWO .ts files and
    // the hint moves by ONE — tools/e2e/tests/window-contract.spec.ts is
    // under .nputerignored `tools/` and never enters the index. Like the
    // T-053 entry above and unlike T-027's, the node and edge pictures do
    // NOT move: all three new edges are file→package (node:fs, node:path,
    // vitest), and an edge whose head is a package can create no component
    // pair, so the relation table, the undeclared count and every drift
    // ring above stay byte-identical.
    // 110 → 114 at the T-028 merge regen (2026-08-17): FOUR files —
    // crescendo.ts and BoardCrescendo.tsx to C-13, crescendo.test.ts and
    // crescendo-dom.test.tsx to C-05. The branch added FIVE .ts/.tsx
    // files and the hint moves by FOUR: tools/e2e/tests/crescendo.spec.ts
    // is under .nputerignored `tools/`. Unlike T-051's and T-053's
    // entries, the node and edge pictures DO move here — the new edges
    // reach real component heads rather than packages, so the relation
    // table gains two rows and four observedCounts climb.
    // 114 → 115 at the T-029 merge regen (2026-08-18): ONE file,
    // app/test/interview-resume-dom.test.tsx, under C-05's app/test/**
    // umbrella. The merge changed ELEVEN indexed .ts/.tsx files and only
    // this one is NEW; the other ten are modifications, which move hash,
    // loc and symbols and add no node. Its sibling
    // tools/e2e/tests/resume-fallback.spec.ts is .nputerignored under
    // `tools/`, so a lane that grew by four specs adds nothing here.
    // Like T-051's and T-053's entries and unlike T-027's and T-028's,
    // the node and edge pictures do NOT move: all the new cross-component
    // edges land on pairs the 32-row table already carries.
    // 115 → 117 at the T-055 merge regen (2026-08-18):
    // lib/parser/src/inert-spans.ts and its suite join C-06. All new
    // non-package edges stay inside C-06, so the 32 rendered component
    // edges, ten undeclared relations and every drift count above remain
    // unchanged. Architecture-dogfood records the full 117/982/1502 delta.
    expect(container.querySelector("[data-testid=map-index-hint]")?.textContent).toBe(
      "committed graph · 117 files",
    );
  });
});
