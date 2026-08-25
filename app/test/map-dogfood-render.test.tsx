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
  it("renders all twelve declared components in full mode PLUS an unmapped bucket, no banner", () => {
    // Ten since T-024 declared C-13 (genesis pane); ELEVEN since T-025
    // declared C-14 (agent runner). See the reconciliation blocks in
    // architecture-dogfood.test.ts for both enumerated deltas.
    // TWELVE since T-088 declared C-15 (dispatch), and this one arrives
    // WITHOUT a regen: docs/ is .nputerignored, so a component .md moves
    // no indexed file and the hint below still reads 126. C-15 renders
    // as a declared-only face — zero files match either declared glob —
    // which is the C-07 treatment three bodies down, on a component that
    // has no code at all rather than code the indexer cannot see.
    // 12 → 13 AT THE T-110 MERGE REGEN, and the thirteenth node is NOT a
    // component: it is the unmapped bucket, holding the single file
    // `app/src-tauri/tests/dispatch_lanes.rs`. This map has rendered
    // "no unmapped bucket" since the §2 amendments and stops doing so
    // here. The declared count is still TWELVE — no component was
    // declared by this merge — so the two halves of this body now
    // disagree on purpose, and the title says so.
    // Both assertions were derived from the live derivation before this
    // suite was run; the second one INVERTS rather than moving a number,
    // which no count check can see.
    expect(container.querySelectorAll("[data-testid=map-node]")).toHaveLength(13);
    expect(container.querySelector('[data-component-id="unmapped"]')).not.toBeNull();
    expect(container.querySelector("[data-testid=map-degraded]")).toBeNull();
  });

  it("C-01 dogfoods the pin: pinned done, the word on the face", () => {
    const c01 = node("C-01");
    expect(c01.getAttribute("data-status")).toBe("done");
    expect(c01.getAttribute("data-pinned")).toBe("true");
    expect(c01.className).toContain("bg-status-done");
    expect(c01.textContent).toContain("pin");
  });

  it("C-07 is a REAL face at last: thirty-two Rust files match its globs", () => {
    // THE ASSERTION THAT INVERTS AT THE T-010 MERGE REGEN (2026-08-25),
    // and the one this whole card exists to invert. This body read
    // "C-07 is declared-only: zero TS files match its globs" from T-012
    // to T-096 — true, and true for a reason the title said out loud:
    // the indexer collected TS/JS only, so the crate that WRITES the
    // graph was the one component the graph could not see. Nothing was
    // written to close it. `Lang::for_extension("rs")` now answers, the
    // 32 files that were always on disk enter the index, and every one
    // of the three assertions below is the negation of the one it
    // replaced. Its D3 finding and its drift ring go with them.
    const c07 = node("C-07");
    expect(c07.className).not.toContain("border-map-declared-only-border");
    expect(c07.textContent).not.toContain("declared · no files yet");
    expect(c07.textContent).toContain("32 files");
    // The D3 ring is gone with the finding that drew it — the visible
    // half of architecture-dogfood's declaredOnly list losing C-07.
    expect(c07.className).not.toContain("map-drift-ring");
    expect(c07.getAttribute("data-drift")).toBeNull();
    // The status word is derived LIVE rather than pinned, on the C-12
    // body's rule below: T-010's own card is what rolls C-07 up, so
    // pinning a literal here would red on the pipeline moving the card
    // rather than on the map being wrong.
    const model = parseProjectFromFiles(liveFiles());
    const status = deriveArchitecture({
      components: model.components ?? [],
      tasks: model.tasks,
    }).components.find((c) => c.id === "C-07")?.status;
    expect(status).toBeDefined();
    expect(c07.getAttribute("data-status")).toBe(status);
    expect(c07.className).toContain(`bg-status-${status}`);
  });

  it("the reconciled findings light the right faces (D1 sources + D3 rings)", () => {
    // D1 sources: C-05 (×4: →C-06, →C-09, →C-13 since the T-024 merge
    // regen, and →C-14 since the T-025 one), C-08, C-09. D3: C-01,
    // C-07, C-11 — C-13's D3 cleared when the indexer first saw
    // app/src/genesis/, C-14's when it first saw agent-store.ts.
    // 4 → 5 at the T-010 merge regen: C-05 gains a FIFTH D1 finding,
    // →C-07, because index_cmd.rs (C-05's by the §5 settlement) calls
    // into the indexer crate's lib.rs and neither end was visible before.
    // A drift COUNT moves when the NUMBER of a component's D1 findings
    // moves — the T-028 lesson — and this merge is the first time that
    // number moves for C-05 since the T-025 regen. C-08, C-09 and C-13
    // hold: no Rust file is claimed by any of them, and C-13's four
    // findings are all TS-to-TS. Derived from the live derivation before
    // the suite was run.
    expect(node("C-05").querySelector("[data-testid=map-drift-count]")?.textContent).toBe(
      "drift 5",
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

  it("draws the full 35-edge relation table", () => {
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
    // 32 → 33 at T-088, and the trap runs the OTHER WAY this time: the
    // row count moves and the undeclared tally does NOT. C-15's single
    // declared edge (→C-10) lands PLANNED, so planned goes 9 → 10 while
    // confirmed and undeclared hold — a component declared before it has
    // code can only ever add planned rows. Both numbers were derived
    // from the live derivation before the suite ran, because a red on
    // the first assertion hides the second either way round.
    // 33 → 34 at the T-010 merge regen, and BOTH numbers move this time —
    // the trap in this body running the ordinary way round after T-088
    // ran it backwards. The one new row is C-05→C-07 (undeclared, the
    // eleventh), so undeclared goes 10 → 11. A THIRD number moves that
    // neither assertion here can see and architecture-dogfood's relation
    // table does: C-14→C-10 flips planned → confirmed on Rust file edges,
    // so planned goes 10 → 9 and confirmed 13 → 14 with the ROW COUNT
    // moving only by the C-05→C-07 row. 14 + 11 + 9 = 34. Both numbers
    // were derived from the live derivation before the suite ran.
    // 34 → 35 at the T-123 merge regen, and BOTH numbers move again: the
    // one new row is C-10→C-14 (undeclared, the twelfth), so undeclared
    // goes 11 → 12 while confirmed holds at 14 and planned at 9.
    // 14 + 12 + 9 = 35. Both derived from the live derivation before the
    // suite ran, because a red on the first hides the second either way.
    // WHAT THIS ROW IS, and neither number here can see it: it closes this
    // repository's FIRST COMPONENT CYCLE against the already-CONFIRMED
    // C-14→C-10 above. A THIRD thing moves that this body also cannot
    // see — C-10 gains its first drift ring — and architecture-dogfood's
    // drift assertion is where that is pinned. Said here rather than left
    // silent, so a reader of this body knows what it is NOT asserting.
    expect(container.querySelectorAll("[data-testid=map-edge]")).toHaveLength(35);
    expect(
      container.querySelectorAll('[data-testid=map-edge][data-relation="undeclared"]'),
    ).toHaveLength(12);
  });

  it("opens the C-05 panel on its real findings", () => {
    act(() => node("C-05").click());
    const panel = container.querySelector("[data-testid=map-panel]") as HTMLElement;
    // 4 → 5 at the T-010 merge regen, with the fifth sentence asserted
    // below rather than only counted, on the same rule the C-14 comment
    // states: a renumbered chip must never be able to pass on a
    // different finding.
    expect(panel.querySelector("[data-testid=map-panel-drift-chip]")?.textContent).toContain(
      "5 drift findings",
    );
    expect(panel.textContent).toContain("C-05 imports C-06 without declaring the dependency.");
    expect(panel.textContent).toContain("C-05 imports C-09 without declaring the dependency.");
    expect(panel.textContent).toContain("C-05 imports C-13 without declaring the dependency.");
    // The fourth, since the T-025 merge regen: C-05's own suite reaching
    // the agent runner's store. Asserted by its rendered sentence, not
    // just counted, so the renumbering above can never pass on a
    // different finding.
    expect(panel.textContent).toContain("C-05 imports C-14 without declaring the dependency.");
    // The fifth, since the T-010 merge regen: the shell's own index
    // command reaching the indexer crate. Both ends are Rust, so this
    // sentence could not be rendered by any graph before this one.
    expect(panel.textContent).toContain("C-05 imports C-07 without declaring the dependency.");
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
    // 117 → 117 at the T-076 merge regen (2026-08-19): ZERO files join or
    // leave — `index --check` reports `files +0 -0 ~13`, and all thirteen
    // are modifications inside lib/parser/**, which is C-06. The hint does
    // not move because no NODE moves. Like the T-051, T-053, T-029 and
    // T-057 entries and unlike T-027's and T-028's, the node and edge
    // pictures do NOT move either: the fourteen added edges are three
    // file-level import pairs that already existed (their `symbols` lists
    // grew) plus eleven symbol-level calls with BOTH ends in C-06, and an
    // edge inside one component can create no component pair. The 32
    // rendered component edges, ten undeclared relations and every drift
    // count above stay byte-identical. Architecture-dogfood records the
    // full 117 files / 989→995 symbols / 1508→1518 edges delta.
    // 117 → 118 at the T-073 merge regen (2026-08-19): exactly ONE file
    // joins — app/test/node-builtins-write.d.ts, the ambient declaration
    // file T-073 split out of node-builtins.d.ts. `index --check` reports
    // `files +1 -0 ~2` with SYMBOLS AND EDGES UNMOVED (995 / 1518), which
    // is a first for this ledger: a file joins the index and contributes
    // no symbol, so no NODE and no EDGE moves and the hint is the only
    // assertion here that changes. C-05 is the claimant (app/test/** is
    // its glob alone), so the eleven rendered nodes, the 32 rendered
    // component edges, the ten undeclared relations and every drift count
    // above stay byte-identical. Architecture-dogfood records the full
    // 117→118 files / 995 symbols / 1518 edges delta.
    // 118 → 119 at the T-077 merge regen (2026-08-20): one file joins,
    // app/test/cross-file-rows.test.tsx, and unlike T-073's entry it DOES
    // carry symbols — 996 → 1018 (+22) and 1539 edges (+19). C-05 is again
    // the claimant, so the eleven rendered nodes and the ten undeclared
    // relations still hold. What moves besides this hint is THREE
    // assertions in architecture-dogfood, not one: fileComponent.size
    // 118 → 119, C-05's per-component tally 55 → 56 in that same body,
    // and C-05→C-10's observedCount 33 → 34 in another. vitest surfaces
    // them one at a time, so a green run after fixing the first proves
    // nothing about the rest.
    // 119 → 126 at the T-013 merge regen (2026-08-23): SEVEN files join
    // — MapContainer.tsx, churn-source.ts, map-zoom.ts under
    // app/src/architecture/**, churn.ts under app/src/lib/architecture/**,
    // and map-churn.test.ts, map-t1-t2-dom.test.tsx, map-zoom.test.ts
    // under app/test/**. Symbols 1023 → 1116, edges 1550 → 1698, and
    // `files +7 -0 ~8`. THE BRANCH'S FORECAST OF THOSE ABSOLUTES WAS
    // STALE (it read 1018 → 1111 and 1539 → 1687, measured against a base
    // two regens old); the +7 file delta survived and the symbol/edge
    // absolutes did not, so the whole set was re-derived here.
    // The eleven nodes and the 32-row relation table STILL HOLD — every
    // new edge lands on a pair that already had a row.
    // What moves besides this hint is FIVE assertions across THREE bodies
    // in architecture-dogfood, not four: fileComponent.size 119 → 126;
    // the per-component tally C-05 56 → 59 and C-12 14 → 18 in that same
    // body; C-12's FILE LIST 14 → 18 entries, a THIRD assertion in that
    // body which the forecast missed because the tally hides it; three
    // new C-05→C-06 fileEdges; and three observedCounts — C-05→C-06
    // 10 → 13, C-05→C-12 22 → 32, C-12→C-05 6 → 7. THE THIRD OF THOSE IS
    // NOT THE ROW ITS POSITION SUGGESTS: C-05→C-14 also reads 6, so a
    // value read off the failure diff by position corrupts two rows.
    // Key on (from, to, relation), never on the printed order.
    // 126 → 126 at T-088 (2026-08-24), and this is the FIRST entry in
    // this ledger written from a LANE rather than at a merge regen —
    // because T-088's trigger is the other one. Declaring C-15 changes
    // the REGISTRY and cannot change the graph: `.nputerignore` excludes
    // docs/, so a component .md is not an indexed file, and
    // `index --check --root ../..` is exit 0 with C-15 on disk. So the
    // node count above moves 11 → 12 and the edge count 32 → 33 while
    // this hint does not move at all — the exact inverse of T-073's
    // entry, where a file joined the index and moved ONLY this hint.
    // 126 → 172 at the T-010 merge regen (2026-08-25) — the largest jump
    // this hint has ever taken, +46, and the ONLY entry in this ledger
    // where not one of the joining files is new on disk. The walk learned
    // a LANGUAGE: `Lang::for_extension("rs")` answers, so every `.rs`
    // under app/src-tauri/ enters the index at once, `languages` goes
    // ["ts"] → ["rust","ts"], and the committed graph goes 648 886 →
    // 890 866 bytes / 1126 → 1874 symbols / 1712 → 1842 edges. Unlike
    // T-073's and T-088's entries, EVERYTHING moves with it: the node
    // count holds at 12 (no component is declared here) but the relation
    // table gains a row and flips a relation, C-05's drift chip goes 4 →
    // 5, C-07 stops being a declared-only face, and architecture-dogfood
    // records the full per-component delta. Derived from the regenerated
    // graph before the suite was run.
    // 172 → 178 at the T-110 merge regen (2026-08-25): five files under
    // C-15's two declared globs plus one under nobody's. The graph goes
    // 895 891 → 918 406 bytes / 1889 → 1951 symbols / 1849 → 1878 edges.
    // WHAT MOVES WITH IT AND WHAT DOES NOT, derived rather than assumed:
    // the node count above goes 12 → 13 (the unmapped bucket, not a
    // component) while the RELATION TABLE does not move at all — 35
    // edges, 14/12/9, byte-identical — because every edge C-15's four
    // Rust files carry is internal to C-15 or lands on a cargo package.
    // C-05's drift chip holds at 5 and no ring lights or clears on any
    // rendered face. That combination is new in this ledger: a merge
    // that adds six indexed files, moves this hint, adds a NODE, and
    // leaves every edge and every drift count untouched.
    expect(container.querySelector("[data-testid=map-index-hint]")?.textContent).toBe(
      "committed graph · 178 files",
    );
  });
});
