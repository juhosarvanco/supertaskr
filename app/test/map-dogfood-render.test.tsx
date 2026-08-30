// @vitest-environment jsdom
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseProjectFromFiles, type FileEntry } from "@nputer/parser/pure";
import { edgeKey } from "../src/architecture/MapEdge";
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
  it("renders all fifteen declared components in full mode, and the bucket is GONE again", () => {
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
    // 13 → 13 AT T-033, AND THE COUNT HOLDING IS A COINCIDENCE THIS BODY
    // MUST NOT REST ON: the unmapped bucket LEAVES (C-15 claims
    // `tests/dispatch_lanes.rs`) and C-16 shared primitives ARRIVES, so
    // one node is swapped for another and 13 stays 13. The two assertions
    // below are what actually move — the bucket must be absent and C-16
    // must be present — and they are asserted by IDENTITY rather than by
    // the total for exactly this reason.
    // 13 → 14 AT T-139 (2026-08-26, merge `aed77b6`), AND THIS TIME THE
    // TOTAL MOVES BECAUSE THE BUCKET COMES BACK. No declared component is
    // added or removed — the thirteen are the same thirteen — and the
    // fourteenth node is the unmapped bucket the derivation synthesises
    // for `app/src-tauri/tests/graph_budget_bench.rs`. The identity
    // assertion below is what says WHICH node arrived; had this body
    // rested on the total it could not have told a fourteenth component
    // from a bucket, which is the reason the comment above gives.
    // 14 → 13 AT T-141 (2026-08-26), AND THE BUCKET LEAVES FOR THE SECOND
    // TIME IN THIS LEDGER — the first was T-033's swap, where the total
    // held at 13 because C-16 arrived in the same breath. This time the
    // total MOVES, because nothing arrives with it: C-05 declares
    // `app/src-tauri/tests/graph_budget_bench.rs` and the derivation stops
    // synthesising a node for it. The identity assertion below is again
    // what carries the meaning — it now asserts the bucket is ABSENT, and
    // it INVERTS rather than moving a number, which no count check can
    // see. Both halves of this body agree again: thirteen nodes, thirteen
    // declared components, and the title says THAT.
    // **THE MAP IS ONE OF ONLY TWO PLACES THIS SHOWED UP.** `cargo test`
    // was 518/0/4 exit 0 with the bucket present and 518/0/4 exit 0 with
    // it gone; `arch drift` exits 0 without `--fail-on`. A React render
    // test is this repository's tripwire for unclaimed Rust territory.
    // 13 → 15 AT T-127-s6 (2026-08-29), AND THE TOTAL MOVES WITH NO FILE
    // ADDED, NO FILE DELETED AND NO IMPORT SEVERED — the first entry in
    // this ledger where it moves for a pure re-partition. C-17 Board model
    // and C-18 Board root are EXTRACTED from C-08 and C-09 to break
    // `C-08 -> C-09 -> C-08`, the registry's last declared cycle and the
    // reason `arch cycles --root ../..` exited 1 by design: three paths
    // change owner and `derived.fileComponent.size` is unchanged at 189.
    // The identity assertions below carry the meaning as always — the
    // bucket must still be ABSENT, and a re-partition that stranded a file
    // would show up THERE rather than in this total, which is the
    // distinction T-139 and T-141 taught this body.
    expect(container.querySelectorAll("[data-testid=map-node]")).toHaveLength(15);
    expect(container.querySelector('[data-component-id="unmapped"]')).toBeNull();
    expect(container.querySelector('[data-component-id="C-16"]')).not.toBeNull();
    // The two new nodes asserted by IDENTITY, for the same reason C-16 is:
    // "fifteen nodes" must not be reachable by a synthesised bucket
    // standing in for a component the extraction failed to declare.
    expect(container.querySelector('[data-component-id="C-17"]')).not.toBeNull();
    expect(container.querySelector('[data-component-id="C-18"]')).not.toBeNull();
    expect(container.querySelector("[data-testid=map-degraded]")).toBeNull();
  });

  it("C-01 dogfoods the pin: pinned done, the word on the face", () => {
    const c01 = node("C-01");
    expect(c01.getAttribute("data-status")).toBe("done");
    expect(c01.getAttribute("data-pinned")).toBe("true");
    expect(c01.className).toContain("bg-status-done");
    expect(c01.textContent).toContain("pin");
  });

  it("C-07 is a REAL face at last: thirty-six Rust files match its globs", () => {
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
    // 32 → 33 at the T-129 merge regen (2026-08-25) — the first file this
    // component has gained ON DISK since it joined the mapping, and so
    // the first move of this figure that is not a change of language.
    // `crates/nputer-index/tests/depth.rs` is the integration target that
    // pins every bounded traversal. Two figures move together here and in
    // architecture-dogfood's C-07 tally row, and NOTHING else does:
    // derived from `arch` over the regenerated graph before the suite was
    // run. **THE TITLE MOVED WITH THE DIGIT**, because a body whose name
    // carries a count is a count in two places (T-126's precedent).
    // 33 → 34 at the T-127 merge regen (2026-08-25), the second file this
    // component has gained on disk and the same shape as T-129's:
    // `crates/nputer-index/src/arch/cycles.rs`, the registry cycle gate.
    // Derived from `arch` over the regenerated graph before the suite was
    // run, and the title moved with the digit again.
    // 34 → 35 at the T-135 Half A merge regen (2026-08-26), the third file
    // this component has gained on disk and the same shape once more:
    // `crates/nputer-index/src/arch/blast.rs`, the derived-dependents
    // report. Derived from `arch` over the regenerated graph before the
    // suite was run, and the title moved with the digit a third time.
    // THIS LINE IS ONE OF THE THREE `T-135-s3` DOES NOT NAME. That card
    // forecast this merge's graph commit reddening this file over the
    // `C-05 -> C-15` D1 alone; this figure and the header hint below move
    // for a different reason — a new indexed file — and under no repair
    // that card offers.
    // 35 → 36 at the T-139 merge regen (2026-08-26), the FOURTH file this
    // component has gained on disk and the same shape a fourth time:
    // `crates/nputer-index/tests/budget.rs`, the degradation-path suite.
    // Its sibling `app/src-tauri/tests/graph_budget_bench.rs` lands in the
    // BUCKET rather than here, which is why this row moves by one while
    // the merge added two indexed files. Derived from `arch` over the
    // regenerated graph before the suite was run.
    expect(c07.textContent).toContain("36 files");
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
    // T-033 EMPTIES THIS BODY OF EVERY COUNT IT USED TO CARRY. C-05, C-08,
    // C-09 and C-13 stop being D1 sources — declared, or extracted onto
    // C-16 — so the chip is ABSENT rather than zero, which is a stronger
    // statement than "drift 0" and the one the renderer actually makes.
    // C-05 LEAVES THIS LOOP AT THE T-135 HALF A MERGE REGEN (2026-08-26)
    // and is asserted positively below instead. The `mod` fix makes
    // `lib.rs -> dispatch/mod.rs` an edge, C-05 does not declare C-15, so
    // C-05 is a D1 source again — by the same mechanism it left by at
    // T-033, running the other way. The loop keeps its other three
    // members, which is what stops this edit from reading as "the
    // renderer stopped drawing chips": three absent, two present.
    for (const id of ["C-08", "C-09", "C-13"]) {
      expect(node(id).querySelector("[data-testid=map-drift-count]"), id).toBeNull();
      expect(node(id).className, id).not.toContain("map-drift-ring");
    }
    // THE POSITIVE CONTROL, and the two rings on this map: C-10, on the
    // cycle T-125 owns, and C-05 since the T-135 Half A merge. Without
    // these the assertions above would pass equally against a renderer
    // that had stopped drawing chips.
    expect(node("C-10").querySelector("[data-testid=map-drift-count]")?.textContent).toBe(
      "drift 1",
    );
    expect(node("C-10").className).toContain("map-drift-ring");
    // C-05's ring is the VISIBLE half of the D1 this merge reveals; the
    // findings array in architecture-dogfood.test.ts is the derived half,
    // and both are asserted because a ring drawn without a finding and a
    // finding drawn without a ring are different defects.
    expect(node("C-05").querySelector("[data-testid=map-drift-count]")?.textContent).toBe(
      "drift 1",
    );
    expect(node("C-05").className).toContain("map-drift-ring");
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
    // AND THE TWO D3 RINGS INVERT — the second half of the card. C-01 and
    // C-11 carried `map-drift-ring` from T-012 to here, on findings that
    // could never clear; `non_code: true` makes those findings
    // informational, so the ring goes out while the FINDING REMAINS (it
    // is still in architecture-dogfood's findings array, and still
    // rendered in the panel). A ring that went out because the finding
    // vanished would be a different change, which is why both files
    // assert their half.
    expect(node("C-01").className).not.toContain("map-drift-ring");
    expect(node("C-11").className).not.toContain("map-drift-ring");
    expect(node("C-01").getAttribute("data-drift")).toBeNull();
    expect(node("C-11").getAttribute("data-drift")).toBeNull();
    // and the face stops promising files that are never coming
    expect(node("C-01").textContent).not.toContain("no files yet");
    expect(node("C-11").textContent).toContain("not indexed by design");
    // The map pane itself is clean after the §2 amendments.
    expect(node("C-12").className).not.toContain("map-drift-ring");
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

  it("draws the full 45-edge relation table, with TWO undeclared rows left — the bucket’s two are gone", () => {
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
    // 35 → 36 AT T-033, and the row count moving by ONE hides a nine-row
    // churn underneath it: five `-> C-16` rows arrive and four leave
    // (C-08→C-05, C-09→C-05, C-13→C-05 lose their file edges to C-16 and
    // stop existing; C-12→C-05 was dropped from the registry once the
    // extraction took its last observed edge). The SECOND assertion is
    // where the card actually lands — 12 undeclared rows become ONE.
    // 36 → 37 AT THE T-135 HALF A MERGE REGEN (2026-08-26), and BOTH
    // numbers move together for the first time since T-010: the one new
    // row is C-05→C-15, undeclared, so undeclared goes 1 → 2 while
    // confirmed holds at 26 and planned at 9. 26 + 2 + 9 = 37. It is the
    // only cross-component pair among the 27 `mod` edges this merge adds,
    // and it is REVEALED rather than created — the dependency has been
    // real since T-126 and no `mod` declaration produced an edge until
    // now. The checkpoint did not declare it (ruling thirteen's parent
    // test says FILE, not repair); it is routed to `T-126-s3` item 4.
    // 37 → 39 at the T-139 merge regen (2026-08-26, merge `aed77b6`), and
    // both numbers move again — undeclared 2 → 4 while confirmed holds at
    // 26 and planned at 9. 26 + 4 + 9 = 39. **BOTH NEW ROWS LEAVE THE SAME
    // NODE AND THAT NODE IS NOT A COMPONENT**: the unmapped bucket, holding
    // `app/src-tauri/tests/graph_budget_bench.rs`, which imports
    // `nputer_index` (C-07) and `docs_watch` (C-10). So ONE unclaimed file
    // draws TWO undeclared rows, and declaring it retires both at once.
    // Unlike C-05→C-15 above, this pair is CREATED by the merge and not
    // revealed by it — `arch drift` read `unmapped=0` at the parent — and
    // the checkpoint still did not declare it, because choosing between
    // C-07 and C-10 for a harness that imports both is a registry decision
    // and a checkpoint takes no dispositions. Routed, with the reasoning,
    // in this merge's STATE entry.
    // 39 → 37 AT T-141 (2026-08-26), AND BOTH NUMBERS MOVE DOWNWARD FOR THE
    // FIRST TIME IN THIS LEDGER — undeclared 4 → 2 while confirmed holds at
    // 26 and planned at 9. 26 + 2 + 9 = 37. The routed decision above was
    // taken: C-05 declares the harness, so the two bucket rows retire and
    // their observed edges FOLD into `C-05 → C-07` and `C-05 → C-10`, which
    // were already confirmed. Nothing is drawn in their place, which is
    // exactly what makes C-05 the owner. **THE OTHER TWO CANDIDATES WERE
    // MEASURED AND EACH DRAWS A ROW**: claiming it in C-07 leaves 38 with a
    // new undeclared `C-07 → C-10`, and in C-10 leaves 38 with a new
    // undeclared `C-10 → C-07` — each writing an inverted dependency onto
    // this map, since C-07 is a standalone crate the app depends on and
    // C-10 is a watcher that does not read the indexer. Both numbers here
    // were derived from `arch` at `2a922ce` with the claim applied, before
    // the suite was re-run, because a red on the first hides the second.
    // 37 → 45 AT T-127-s6 (2026-08-29), AND THE UNDECLARED COUNT DOES NOT
    // MOVE, which is the whole shape of the change stated on this map:
    // eleven confirmed rows arrive and three leave (33 + 2 + 10 = 45),
    // every one of the eleven a RENAMED or RE-ATTRIBUTED edge rather than a
    // new import. The row that leaves and matters is `C-08 → C-09`, half of
    // `C-08 -> C-09 -> C-08`; `C-09 → C-08` is still drawn, which is what
    // makes this a broken cycle and not a hidden one. Derived from `arch`'s
    // own edge listing at the edited registry before the suite was re-run,
    // because a red on this count hides the two assertions below it.
    expect(container.querySelectorAll("[data-testid=map-edge]")).toHaveLength(45);
    const undeclared = container.querySelectorAll(
      '[data-testid=map-edge][data-relation="undeclared"]',
    );
    expect(undeclared).toHaveLength(2);
    // asserted by IDENTITY, not only by count: "two undeclared edges" must
    // not be reachable by some other row surviving in their place — and
    // that guard is what says the two that LEFT are the bucket's two,
    // rather than any two rows leaving and the count coming out right.
    expect([...undeclared].map((e) => e.getAttribute("data-edge"))).toEqual([
      edgeKey({ from: "C-05", to: "C-15" }),
      edgeKey({ from: "C-10", to: "C-14" }),
    ]);
  });

  it("the C-05 panel reports ONE row again — the one the graph could not see — and C-10's still does", () => {
    // T-033 INVERTS THIS BODY WHOLE. It carried five "C-05 imports X
    // without declaring the dependency." sentences and a "5 drift
    // findings" chip; every one of those five is now DECLARED, so the
    // chip is absent and no such sentence can be rendered for C-05 at
    // all. Absence is asserted by the sentence STEM rather than by the
    // chip alone — a chip that merely stopped rendering would pass a
    // count check while the findings were still there.
    // AND THE T-135 HALF A MERGE REGEN (2026-08-26) INVERTS IT BACK, BY
    // ONE ROW AND FOR A REASON WORTH READING. The five sentences T-033
    // cleared were all declarations catching up with reality. This one is
    // the opposite: the reality was always there and the GRAPH could not
    // see it, because a Rust `mod` declaration produced no edge until this
    // merge. So the panel reports again — one sentence, not five — and the
    // honest reading is not "C-05 regressed" but "C-05 was never clean;
    // the map could not draw what it could not see." That is the single
    // best piece of evidence T-135 has, and it is rendered here.
    act(() => node("C-05").click());
    const c05Panel = container.querySelector("[data-testid=map-panel]") as HTMLElement;
    expect(c05Panel.querySelector("[data-testid=map-panel-drift-chip]")?.textContent).toContain(
      "1 drift finding",
    );
    expect(c05Panel.textContent).toContain(
      "C-05 imports C-15 without declaring the dependency.",
    );
    // the panel itself is still rendering — the grid is the control that
    // says this is a one-row finding list and not a broken panel
    expect(c05Panel.querySelector("[data-testid=map-panel-dependencies]")).not.toBeNull();
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    // THE POSITIVE CONTROL, in the same body so the two cannot drift
    // apart: C-10 still reports the one row this card deliberately left,
    // by its rendered sentence and not only by a count.
    act(() => node("C-10").click());
    const c10Panel = container.querySelector("[data-testid=map-panel]") as HTMLElement;
    expect(c10Panel.querySelector("[data-testid=map-panel-drift-chip]")?.textContent).toContain(
      "1 drift finding",
    );
    expect(c10Panel.textContent).toContain(
      "C-10 imports C-14 without declaring the dependency.",
    );
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    // AND THE INFORMATIONAL D3 IS STILL EXPLAINED WHERE A HUMAN READS IT
    // — the downgrade moves the ring, never the explanation.
    act(() => node("C-11").click());
    const c11Panel = container.querySelector("[data-testid=map-panel]") as HTMLElement;
    expect(c11Panel.querySelector("[data-testid=map-panel-drift-chip]")).toBeNull();
    expect(c11Panel.textContent).toContain("declares no code the indexer walks");
    expect(c11Panel.textContent).toContain("non_code: true in its component file");
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
    // 178 → 179 at the T-116 merge regen (2026-08-25): ONE file,
    // app/test/map-churn-age.test.tsx. The graph goes 925 217 → 933 486
    // bytes / 1968 → 1987 symbols / 1886 → 1903 edges. WHAT MOVES WITH IT:
    // four observedCounts in architecture-dogfood (C-05→C-06, C-05→C-10,
    // C-05→C-12, C-12→C-10) and nothing else — the node count holds at 13,
    // the relation table stays 36 rows at 26/1/9 with no row added,
    // removed or flipped, and no ring lights or clears. Derived from the
    // regenerated graph before the suite was run.
    // 179 → 178 at the T-126 merge regen (2026-08-25), and it is the FIRST
    // time this hint has ever moved DOWN: T-126 declares `pub mod
    // dispatch;` in `lib.rs` and deletes the `#[path]` shim that was the
    // module's only route to a compiler, so one file LEAVES the index and
    // none joins (`files +0 -1 ~2`). The graph goes 933 486 → 933 931
    // bytes / 1987 → 1990 symbols, and EDGES DO NOT MOVE AT ALL: 1903
    // before and 1903 after. That last figure is the interesting one and
    // it is `T-126-s4` — `lib.rs` now genuinely depends on C-15 and the
    // indexer records `use` imports only, so a `mod` declaration plus a
    // path expression produces no edge. WHAT MOVES WITH IT: C-15's file
    // list and count in architecture-dogfood and this hint; the node
    // count holds at 13, the relation table is unmoved, and no ring
    // lights or clears. Derived from the regenerated graph and `arch`
    // before the suite was run.
    // 178 → 179 at the T-129 merge regen (2026-08-25): ONE file,
    // `app/src-tauri/crates/nputer-index/tests/depth.rs`. The graph goes
    // 933 931 → 939 161 bytes / 1990 → 2004 symbols / 1903 → 1907 edges.
    // WHAT MOVES WITH IT: `fileComponent.size` and the C-07 tally row in
    // architecture-dogfood (32 → 33) and this hint — and NOTHING ELSE.
    // The node count holds at 13, the relation table stays 36 rows at
    // 26/1/9, findings hold at 3 and no ring lights or clears, because
    // every one of the seven new edges has BOTH endpoints inside C-07.
    // That is the reading to keep: a merge can add four component-level
    // edges to the graph and move no component relation at all. Derived
    // from the regenerated graph and `arch` before the suite was run.
    // 179 → 180 at the T-127 merge regen (2026-08-25): ONE file,
    // `app/src-tauri/crates/nputer-index/src/arch/cycles.rs`. The graph
    // goes 939 161 → 944 590 bytes / 2004 → 2018 symbols / 1907 → 1911
    // edges, and `index --check` printed `files +1 -0 ~4` naming EXACTLY
    // this merge's five code paths, one for one. WHAT MOVES WITH IT:
    // `fileComponent.size` and the C-07 tally row in
    // architecture-dogfood (33 → 34) and this hint — and NOTHING ELSE,
    // for the same reason as T-129's entry above: all four new edges are
    // `import` (zero `call`, zero `type_ref`), three have both endpoints
    // inside C-07 and the fourth lands on `p:cargo:std`, so the node
    // count holds at 13, the relation table stays 36 rows at 26/1/9,
    // findings hold at 3 and no ring lights or clears. Derived from the
    // regenerated graph and `arch` before the suite was run.
    // 180 → 181 at the T-135 Half A merge regen (2026-08-26): ONE file,
    // `app/src-tauri/crates/nputer-index/src/arch/blast.rs`. The graph
    // goes 944 590 → 955 710 bytes / 2018 → 2038 symbols / 1911 → 1943
    // edges, and `index --check` printed `files +1 -0 ~8` naming EXACTLY
    // this merge's nine `.rs` paths, one for one. **AND THIS ENTRY BREAKS
    // THE PATTERN THE LAST TWO SET**: +32 edges, not +4, because 27 of
    // them are the `mod` fix on files that already existed, and one of
    // those 27 is CROSS-COMPONENT. So unlike T-127's and T-129's entries,
    // everything that "nothing else moves" promised does move — the
    // relation table goes 36 → 37 at 26/2/9, findings 3 → 4, and C-05
    // lights a ring. The node count still holds at 13. Derived from the
    // regenerated graph and `arch` before the suite was run.
    // 181 → 183 at the T-134 merge regen (2026-08-26): TWO files,
    // `lib/parser/src/fence.ts` and `lib/parser/test/fence.test.ts`. The
    // graph goes 955 710 → 970 961 bytes / 2038 → 2064 symbols / 1943 →
    // 1986 edges, and `index --check` printed `files +2 -0 ~2` naming
    // EXACTLY this merge's four `.ts` paths, one for one. THIS ENTRY
    // RETURNS TO T-127's SHAPE rather than T-135's: all 43 new edges are
    // C-06-internal or land on a `p:` package node, so the node count
    // holds at 13, the relation table stays 37 rows, findings hold at 4
    // and no ring lights or clears — `arch` moves `files` and
    // `mapped` and nothing else. Derived from the regenerated graph and
    // `arch` before the suite was re-run.
    // 183 → 185 at the T-139 merge regen (2026-08-26, merge `aed77b6`):
    // TWO files, `app/src-tauri/crates/nputer-index/tests/budget.rs` and
    // `app/src-tauri/tests/graph_budget_bench.rs`. The graph goes
    // 989 181 → 997 202 bytes / 2101 → 2124 symbols / 2033 → 2039 edges,
    // and `index --check` printed `files +2 -0 ~4` — the FOURTH modified
    // path it names, `app/test/architecture-dogfood.test.ts`, is MAIN's
    // (`6dc5757`) and not this lane's, and it costs zero bytes because
    // only its `loc` moved and 1974 and 1979 are the same width. **SO THIS
    // ENTRY BREAKS T-134's SHAPE IN THE ONE WAY NO EARLIER ENTRY DID**:
    // the second new file lands under no component's globs, so the node
    // count moves 13 → 14, the relation table 37 → 39 at 26/4/9 and
    // findings 4 → 5 with a D2. Derived from the regenerated graph and
    // `arch` before the suite was re-run.
    expect(container.querySelector("[data-testid=map-index-hint]")?.textContent).toBe(
      // 185 -> 189 at the T-137 merge regen (2026-08-27, c22f0ac) - the four
      // lib-parser files of the schedule extraction, all mapped, so unlike
      // the entry above this one moves the count WITHOUT moving findings.
      // 189 -> 190 at the T-167 merge regen (2026-08-30) - skills.rs under
      // C-14, mapped, findings unmoved.
      // Derived from arch after the regen, not from the failure output.
      "committed graph · 190 files",
    );
  });
});
