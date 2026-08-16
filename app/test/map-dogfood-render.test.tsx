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
    expect(node("C-05").className).toContain("map-drift-ring");
    expect(node("C-01").className).toContain("map-drift-ring"); // D3, non-code
    expect(node("C-11").className).toContain("map-drift-ring"); // D3, non-code
    // The map pane itself is clean after the §2 amendments, and the
    // genesis pane is clean now that it has code: it is the target of
    // C-05's undeclared edge, never its source.
    expect(node("C-12").className).not.toContain("map-drift-ring");
    expect(node("C-13").className).not.toContain("map-drift-ring");
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

  it("draws the full 28-edge relation table", () => {
    // 23 + C-13's two declared edges (T-024) + the undeclared
    // C-05→C-13 the merge regen surfaced + C-14→C-10, T-025's one
    // declared edge (planned: no TS import can confirm a Rust-side
    // dependency until T-010 extracts Rust) + the undeclared C-05→C-14
    // the T-025 merge regen surfaced, which is why undeclared is 6.
    expect(container.querySelectorAll("[data-testid=map-edge]")).toHaveLength(28);
    expect(
      container.querySelectorAll('[data-testid=map-edge][data-relation="undeclared"]'),
    ).toHaveLength(6);
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
    expect(container.querySelector("[data-testid=map-index-hint]")?.textContent).toBe(
      "committed graph · 89 files",
    );
  });
});
