// @vitest-environment jsdom
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseProjectFromFiles, type FileEntry, type ProjectParseResult } from "@nputer/parser/pure";
import { MapView } from "../src/architecture/MapView";
import { __resetChurnForTests, applyChurnPayload } from "../src/architecture/churn-source";

/**
 * T-013 in the DOM: semantic zoom T1/T2 and the churn overlay.
 *
 *  1. T1 — the node becomes a container of its files grouped by
 *     directory, with the intra-component edges and the stubs to
 *     collapsed neighbours, GROWING DOWN in its own column: the rows
 *     below it move by exactly the extra height and NOTHING ELSE MOVES.
 *  2. T1's render budget — over it the container groups deeper, and past
 *     that it paginates. A defined state, never a frozen canvas.
 *  3. T2 — a file opens the panel on its symbols and resolved edges,
 *     from the container and from the component panel's file list.
 *  4. Churn — the fourth overlay segment: 3px bar, share of the busiest,
 *     raw count at the mark slot, hottest one step darker, declared-only
 *     an em dash, never amber, legend following. And DISABLED, not
 *     broken, when git cannot answer.
 *  5. The utilities all of it uses actually EMIT into the built sheet.
 */

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  __resetChurnForTests();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

// ---- fixtures ---------------------------------------------------------

function componentFile(
  id: string,
  name: string,
  paths: string[],
  dependsOn: string[] = [],
): FileEntry {
  return {
    path: `docs/architecture/components/${id}-x.md`,
    content: [
      "---",
      `id: ${id}`,
      `name: ${JSON.stringify(name)}`,
      "paths:",
      ...paths.map((p) => `  - ${JSON.stringify(p)}`),
      `depends_on: [${dependsOn.join(", ")}]`,
      "status: auto",
      "touch_slugs: []",
      "---",
      `${name} prose.`,
    ].join("\n"),
  };
}

interface GraphFileSpec {
  path: string;
  symbols?: { name: string; kind: string; exported: boolean; range: [number, number] }[];
}

function graphJson(
  files: GraphFileSpec[],
  edges: { from: string; to: string; kind?: string; confidence?: string }[] = [],
): string {
  return JSON.stringify({
    schema: 1,
    root: ".",
    languages: ["ts"],
    files: files.map((file) => ({
      id: `f:${file.path}`,
      path: file.path,
      lang: "ts",
      loc: 9,
      symbols: (file.symbols ?? []).map((symbol) => ({
        id: `s:${file.path}#${symbol.name}`,
        name: symbol.name,
        kind: symbol.kind,
        exported: symbol.exported,
        range: symbol.range,
      })),
    })),
    packages: [],
    edges: edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      kind: edge.kind ?? "import",
      ...(edge.confidence !== undefined ? { confidence: edge.confidence } : {}),
    })),
    unresolved: [],
  });
}

/**
 * FOUR ROWS IN ONE COLUMN AND ONE IN ANOTHER, so "pushes only that
 * column" has something to be false about. `C-01 depends_on C-04` puts
 * C-04 in column 1 (an edge from→to makes the TARGET deeper), leaving
 * column 0 as C-01 · C-02 · C-03 · C-05 by id ascending.
 */
function zoomFixture(): { model: ProjectParseResult; graphContent: string } {
  const model = parseProjectFromFiles([
    componentFile("C-01", "Ay", ["src/a/**"], ["C-04"]),
    componentFile("C-02", "Bee", ["src/b/**"]),
    componentFile("C-03", "Cee", ["src/c/**"]),
    componentFile("C-04", "Dee", ["src/d/**"]),
    componentFile("C-05", "Paper", ["src/nothing/**"]),
  ]);
  const graphContent = graphJson(
    [
      { path: "src/a/a.ts" },
      {
        path: "src/b/one.ts",
        symbols: [
          { name: "inner", kind: "const", exported: false, range: [1, 2] },
          { name: "One", kind: "function", exported: true, range: [5, 9] },
        ],
      },
      {
        path: "src/b/two.ts",
        symbols: [{ name: "Two", kind: "interface", exported: true, range: [1, 3] }],
      },
      { path: "src/b/sub/three.ts" },
      { path: "src/c/c.ts" },
      { path: "src/d/d.ts" },
    ],
    [
      { from: "f:src/b/one.ts", to: "f:src/b/two.ts" },
      { from: "f:src/a/a.ts", to: "f:src/d/d.ts" },
      { from: "f:src/b/one.ts", to: "f:src/c/c.ts" },
      {
        from: "s:src/b/one.ts#One",
        to: "s:src/b/two.ts#Two",
        kind: "call",
        confidence: "resolved",
      },
    ],
  );
  return { model, graphContent };
}

function renderMap(model: ProjectParseResult, graphContent?: string) {
  act(() => {
    root.render(
      <MapView
        model={model}
        {...(graphContent !== undefined ? { graphContent } : {})}
        indexing={false}
        indexOutcome={null}
        onRunIndex={() => {}}
      />,
    );
  });
}

const node = (id: string): HTMLElement => {
  const el = container.querySelector(`[data-testid=map-node][data-component-id="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`node ${id} not rendered`);
  return el;
};

const boxOf = (id: string): HTMLElement => {
  const el = container.querySelector(`[data-component-id="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`box ${id} not rendered`);
  return el;
};

/** Every drawn box's declared position, as the canvas states it. */
function positions(): Map<string, string> {
  const out = new Map<string, string>();
  for (const el of container.querySelectorAll("[data-component-id]")) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.dataset["testid"] === undefined && el.getAttribute("data-testid") === null) continue;
    const kind = el.getAttribute("data-testid");
    if (kind !== "map-node" && kind !== "map-container") continue;
    out.set(el.getAttribute("data-component-id") as string, `${el.style.left}|${el.style.top}`);
  }
  return out;
}

function expandByDoubleClick(id: string): void {
  act(() => {
    node(id).dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  });
}

// ---- 1 · T1 in place ---------------------------------------------------

describe("T1 · the node becomes a container, in place", () => {
  it("renders its files grouped by directory, and the collapsed face is gone", () => {
    const { model, graphContent } = zoomFixture();
    renderMap(model, graphContent);
    expect(container.querySelector("[data-testid=map-container]")).toBeNull();

    expandByDoubleClick("C-02");
    const box = container.querySelector("[data-testid=map-container]") as HTMLElement;
    expect(box).not.toBeNull();
    expect(box.getAttribute("data-component-id")).toBe("C-02");
    expect(box.getAttribute("data-mode")).toBe("files");
    // The T0 face for C-02 is replaced, not stacked under it.
    expect(
      container.querySelector('[data-testid=map-node][data-component-id="C-02"]'),
    ).toBeNull();
    // Grouped by directory, in path order, leaves only.
    expect(
      [...box.querySelectorAll("[data-testid=map-container-group]")].map((el) => el.textContent),
    ).toEqual(["src/b/", "src/b/sub/"]);
    expect(
      [...box.querySelectorAll("[data-testid=map-file]")].map((el) =>
        el.getAttribute("data-file-path"),
      ),
      // Drawn in GROUP order — src/b/ before src/b/sub/ — which is not
      // the flat path sort, and is what "grouped by directory" means.
    ).toEqual(["src/b/one.ts", "src/b/two.ts", "src/b/sub/three.ts"]);
  });

  it("GROWS DOWN IN ITS OWN COLUMN: below moves by the extra height, nothing else moves", () => {
    const { model, graphContent } = zoomFixture();
    renderMap(model, graphContent);
    const before = positions();
    // T-012's slots, hand-derived: SLOT_TOP 40 + row * 150 in column 0,
    // and column 1 starts its own stack at 40.
    expect(before.get("C-01")).toBe("0px|40px");
    expect(before.get("C-02")).toBe("0px|190px");
    expect(before.get("C-03")).toBe("0px|340px");
    expect(before.get("C-05")).toBe("0px|490px");
    expect(before.get("C-04")).toBe("216px|40px");

    expandByDoubleClick("C-02");
    const after = positions();
    const box = container.querySelector("[data-testid=map-container]") as HTMLElement;
    // Three files in two groups: 1+8 + 30 + (14 + 2*23) + 7 + (14 + 23)
    // + 8+1 = 152, so the extra height over a 66px node is 86.
    expect(box.style.height).toBe("152px");
    const delta = 152 - 66;
    expect(delta).toBe(86);

    // ABOVE, and in the OTHER column: byte-identical strings.
    expect(after.get("C-01")).toBe(before.get("C-01"));
    expect(after.get("C-04")).toBe(before.get("C-04"));
    // The expanded node itself does not move either.
    expect(after.get("C-02")).toBe(before.get("C-02"));
    // BELOW, in its own column: down by exactly the extra height.
    expect(after.get("C-03")).toBe(`0px|${340 + delta}px`);
    expect(after.get("C-05")).toBe(`0px|${490 + delta}px`);

    // Collapsing restores the layout exactly — same picture, same bytes.
    act(() => {
      (box.querySelector("[data-testid=map-container-header]") as HTMLElement).dispatchEvent(
        new MouseEvent("dblclick", { bubbles: true }),
      );
    });
    expect(positions()).toEqual(before);
  });

  it("EXPANDING A DIFFERENT COLUMN LEAVES THIS ONE ALONE — the mutant's other side", () => {
    const { model, graphContent } = zoomFixture();
    renderMap(model, graphContent);
    const before = positions();
    expandByDoubleClick("C-04"); // column 1, one file
    const after = positions();
    for (const id of ["C-01", "C-02", "C-03", "C-05"]) {
      expect(after.get(id), `${id} moved when another COLUMN expanded`).toBe(before.get(id));
    }
    expect(after.get("C-04")).toBe(before.get("C-04"));
  });

  it("two expansions in one column stack, and each contributes its own height", () => {
    const { model, graphContent } = zoomFixture();
    renderMap(model, graphContent);
    expandByDoubleClick("C-02"); // 152
    expandByDoubleClick("C-03"); // one file at src/c/ : 1+8+30+(14+23)+8+1 = 85
    const boxes = new Map(
      [...container.querySelectorAll("[data-testid=map-container]")].map((el) => [
        el.getAttribute("data-component-id"),
        (el as HTMLElement).style.height,
      ]),
    );
    expect(boxes.get("C-02")).toBe("152px");
    expect(boxes.get("C-03")).toBe("85px");
    const after = positions();
    expect(after.get("C-01")).toBe("0px|40px");
    expect(after.get("C-02")).toBe("0px|190px");
    expect(after.get("C-03")).toBe(`0px|${340 + 86}px`);
    // C-05 carries BOTH deltas: 86 from C-02 and (85-66)=19 from C-03.
    expect(after.get("C-05")).toBe(`0px|${490 + 86 + 19}px`);
  });

  it("the container renders at exactly the height the layout reserved for it", () => {
    // If these two ever disagree the container overlaps the row below
    // it, which is the failure "grows down in its own column" is about.
    const { model, graphContent } = zoomFixture();
    renderMap(model, graphContent);
    expandByDoubleClick("C-02");
    const box = container.querySelector("[data-testid=map-container]") as HTMLElement;
    const below = boxOf("C-03");
    const boxTop = Number.parseInt(box.style.top, 10);
    const boxHeight = Number.parseInt(box.style.height, 10);
    const belowTop = Number.parseInt(below.style.top, 10);
    expect(belowTop).toBeGreaterThanOrEqual(boxTop + boxHeight);
    // And the gutter is the SAME one a collapsed node gets (150 - 66).
    expect(belowTop - (boxTop + boxHeight)).toBe(84);
  });

  it("draws the intra-component edges, and the stubs to collapsed neighbours stay", () => {
    const { model, graphContent } = zoomFixture();
    renderMap(model, graphContent);
    const edgesBefore = container.querySelectorAll("[data-testid=map-edge]").length;
    expandByDoubleClick("C-02");
    const box = container.querySelector("[data-testid=map-container]") as HTMLElement;
    // one.ts -> two.ts is inside C-02; one.ts -> c.ts leaves it.
    expect(box.getAttribute("data-intra-total")).toBe("1");
    expect(box.getAttribute("data-intra-drawn")).toBe("1");
    expect(container.querySelectorAll("[data-testid=map-container-edge]")).toHaveLength(1);
    // The component-level edges are unchanged in number and now attach
    // to the container's own box — the design's "stubs at the container
    // border".
    expect(container.querySelectorAll("[data-testid=map-edge]").length).toBe(edgesBefore);
  });

  it("a component with no files has nothing to open into, and says nothing false", () => {
    const { model, graphContent } = zoomFixture();
    renderMap(model, graphContent);
    expandByDoubleClick("C-05"); // declared-only
    expect(container.querySelector("[data-testid=map-container]")).toBeNull();
    expect(node("C-05").textContent).toContain("declared · no files yet");
  });

  it("the expand affordance appears on hover and not before", () => {
    const { model, graphContent } = zoomFixture();
    renderMap(model, graphContent);
    expect(container.querySelector("[data-testid=map-expand-hint]")).toBeNull();
    act(() => {
      node("C-02").dispatchEvent(new Event("pointerover", { bubbles: true }));
    });
    expect(container.querySelector("[data-testid=map-expand-hint]")).not.toBeNull();
    // A component with no files never offers one.
    act(() => {
      node("C-05").dispatchEvent(new Event("pointerover", { bubbles: true }));
    });
    expect(container.querySelector("[data-testid=map-expand-hint]")).toBeNull();
  });
});

describe("T1 · the keyboard, and the collision T-012 left open", () => {
  const press = (el: HTMLElement, key: string): void => {
    act(() => {
      el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    });
  };

  it("→ expands a collapsed expandable node, and walks the edge once it is open", () => {
    const { model, graphContent } = zoomFixture();
    renderMap(model, graphContent);
    press(node("C-02"), "ArrowRight");
    expect(container.querySelector("[data-testid=map-container]")).not.toBeNull();
    // Open: → is the edge walk again. C-02 -> C-03 is the observed edge.
    const header = container.querySelector("[data-testid=map-container-header]") as HTMLElement;
    press(header, "ArrowRight");
    expect(document.activeElement).toBe(node("C-03"));
  });

  it("← collapses an open node, and Esc collapses without closing anything else", () => {
    const { model, graphContent } = zoomFixture();
    renderMap(model, graphContent);
    press(node("C-02"), "ArrowRight");
    press(container.querySelector("[data-testid=map-container-header]") as HTMLElement, "ArrowLeft");
    expect(container.querySelector("[data-testid=map-container]")).toBeNull();

    press(node("C-02"), "ArrowRight");
    press(container.querySelector("[data-testid=map-container-header]") as HTMLElement, "Escape");
    expect(container.querySelector("[data-testid=map-container]")).toBeNull();
  });

  it("→ on a node with no files still walks the edge — no key silently does nothing", () => {
    // C-07 declares a dependency and matches no indexed file, so there
    // is nothing to expand into and the walk must still happen.
    const model = parseProjectFromFiles([
      componentFile("C-06", "Target", ["src/t/**"]),
      componentFile("C-07", "Paperish", ["src/none/**"], ["C-06"]),
    ]);
    renderMap(model, graphJson([{ path: "src/t/t.ts" }]));
    press(node("C-07"), "ArrowRight");
    expect(container.querySelector("[data-testid=map-container]")).toBeNull();
    expect(document.activeElement).toBe(node("C-06"));
  });
});

// ---- 2 · the render budget --------------------------------------------

describe("T1 · the render budget is a defined degraded state on the canvas", () => {
  function bigFixture(files: string[], paths: string[] = ["src/**"]) {
    const model = parseProjectFromFiles([componentFile("C-01", "Big", paths)]);
    return {
      model,
      graphContent: graphJson(files.map((path) => ({ path }))),
    };
  }

  it("over the file budget it GROUPS DEEPER instead of drawing 200 rows", () => {
    const files = Array.from({ length: 200 }, (_, i) => `src/deep/f${i}.ts`);
    const { model, graphContent } = bigFixture(files);
    renderMap(model, graphContent);
    expandByDoubleClick("C-01");
    const box = container.querySelector("[data-testid=map-container]") as HTMLElement;
    expect(box.getAttribute("data-mode")).toBe("grouped");
    expect(container.querySelectorAll("[data-testid=map-file]")).toHaveLength(0);
    expect(container.querySelectorAll("[data-testid=map-container-group]")).toHaveLength(1);
    expect(container.querySelector("[data-testid=map-container-note]")?.textContent).toBe(
      "200 files over the 48-row budget · grouped by directory",
    );
    // A canvas, not a scroll of a screen and a half.
    expect(Number.parseInt(box.style.height, 10)).toBeLessThan(120);
  });

  it("past the group budget it PAGINATES, and names what it left out", () => {
    const files: string[] = [];
    for (let dir = 0; dir < 30; dir += 1) {
      files.push(`t${String(dir).padStart(2, "0")}/a.ts`, `t${String(dir).padStart(2, "0")}/b.ts`);
    }
    const { model, graphContent } = bigFixture(files, ["t*/**"]);
    renderMap(model, graphContent);
    expandByDoubleClick("C-01");
    const box = container.querySelector("[data-testid=map-container]") as HTMLElement;
    expect(box.getAttribute("data-mode")).toBe("paginated");
    expect(container.querySelectorAll("[data-testid=map-container-group]")).toHaveLength(24);
    expect(container.querySelector("[data-testid=map-container-note]")?.textContent).toBe(
      "60 files · 24 of 30 directories · the panel has the rest",
    );
  });

  it("the rest stays reachable: the panel's file list is complete", () => {
    const files = Array.from({ length: 200 }, (_, i) => `src/deep/f${i}.ts`);
    const { model, graphContent } = bigFixture(files);
    renderMap(model, graphContent);
    expandByDoubleClick("C-01");
    act(() => {
      (container.querySelector("[data-testid=map-container-header]") as HTMLElement).click();
    });
    const panel = container.querySelector("[data-testid=map-panel]") as HTMLElement;
    expect(panel.querySelectorAll("[data-testid=map-panel-file]")).toHaveLength(200);
  });
});

// ---- 3 · T2 ------------------------------------------------------------

describe("T2 · a file selected lists its symbols and resolved edges, in the panel", () => {
  it("opens from a container row and shows both sections", () => {
    const { model, graphContent } = zoomFixture();
    renderMap(model, graphContent);
    expandByDoubleClick("C-02");
    act(() => {
      (
        container.querySelector('[data-testid=map-file][data-file-path="src/b/one.ts"]') as HTMLElement
      ).click();
    });
    const panel = container.querySelector("[data-testid=map-file-panel]") as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.getAttribute("data-file-path")).toBe("src/b/one.ts");
    // Symbols in line order, with visibility in the gutter.
    const symbols = [...panel.querySelectorAll("[data-testid=map-file-symbol]")].map(
      (el) => el.textContent,
    );
    expect(symbols).toHaveLength(2);
    expect(symbols[0]).toContain("inner");
    expect(symbols[0]).toContain("const");
    expect(symbols[1]).toContain("One");
    expect(symbols[1]).toContain("pub");
    // Resolved edges, imports first, with the component each resolves to.
    const edges = [...panel.querySelectorAll("[data-testid=map-file-edge]")].map((el) => ({
      kind: el.getAttribute("data-edge-kind"),
      text: el.textContent,
    }));
    expect(edges.map((edge) => edge.kind)).toEqual(["import", "import", "call"]);
    expect(edges[0]?.text).toContain("c.ts");
    expect(edges[0]?.text).toContain("C-03");
    expect(edges[2]?.text).toContain("Two");
  });

  it("NO CANVAS SYMBOLS IN V1 — the symbol names appear in the panel and nowhere else", () => {
    const { model, graphContent } = zoomFixture();
    renderMap(model, graphContent);
    expandByDoubleClick("C-02");
    const canvas = container.querySelector("[data-testid=map-canvas]") as HTMLElement;
    expect(canvas.textContent).not.toContain("inner");
    act(() => {
      (
        container.querySelector('[data-testid=map-file][data-file-path="src/b/one.ts"]') as HTMLElement
      ).click();
    });
    expect(
      (container.querySelector("[data-testid=map-canvas]") as HTMLElement).textContent,
    ).not.toContain("inner");
    expect(
      (container.querySelector("[data-testid=map-file-panel]") as HTMLElement).textContent,
    ).toContain("inner");
  });

  it("opens from the component panel's file list too, and can walk back up", () => {
    const { model, graphContent } = zoomFixture();
    renderMap(model, graphContent);
    act(() => node("C-02").click());
    act(() => {
      (
        container.querySelector(
          '[data-testid=map-panel-file][data-file-path="src/b/two.ts"]',
        ) as HTMLElement
      ).click();
    });
    const panel = container.querySelector("[data-testid=map-file-panel]") as HTMLElement;
    expect(panel.getAttribute("data-file-path")).toBe("src/b/two.ts");
    // The one incoming resolved call edge is counted as a reference.
    expect(panel.querySelector("[data-testid=map-file-symbol]")?.textContent).toContain("1 ref");
    // Back up to the component.
    act(() => {
      (panel.querySelector("[data-testid=map-file-panel-component]") as HTMLElement).click();
    });
    expect(container.querySelector("[data-testid=map-file-panel]")).toBeNull();
    expect(
      container.querySelector("[data-testid=map-panel]")?.getAttribute("data-component-id"),
    ).toBe("C-02");
  });

  it("a file with no symbols gets a placeholder, never an error", () => {
    const { model, graphContent } = zoomFixture();
    renderMap(model, graphContent);
    expandByDoubleClick("C-02");
    act(() => {
      (
        container.querySelector(
          '[data-testid=map-file][data-file-path="src/b/sub/three.ts"]',
        ) as HTMLElement
      ).click();
    });
    const panel = container.querySelector("[data-testid=map-file-panel]") as HTMLElement;
    expect(panel.textContent).toContain("no symbols declared");
    expect(panel.textContent).toContain("every specifier resolved");
  });
});

// ---- 4 · churn ---------------------------------------------------------

/** A measured payload for the zoom fixture: C-02 busiest, C-01 cooler,
 * C-03 untouched, C-05 declared-only. */
function measuredChurn() {
  return {
    kind: "measured",
    windowDays: 30,
    commits: 42,
    truncated: false,
    rejected: 0,
    measuredAtMs: 1_700_000_000_000,
    paths: [
      { path: "src/b/one.ts", commits: 30, lastCommitMs: 1_699_999_000_000 },
      { path: "src/b/two.ts", commits: 10, lastCommitMs: 1_699_000_000_000 },
      { path: "src/a/a.ts", commits: 10, lastCommitMs: 1_698_000_000_000 },
      { path: "src/d/d.ts", commits: 5, lastCommitMs: 1_698_000_000_000 },
      // Claimed by no component — churn that must be REPORTED in the
      // footer rather than folded into somebody's bar.
      { path: "README.md", commits: 5, lastCommitMs: 1_698_000_000_000 },
    ],
  };
}

const segment = (mode: string): HTMLButtonElement => {
  const el = container.querySelector(`[data-testid=map-overlay-${mode}]`);
  if (!(el instanceof HTMLButtonElement)) throw new Error(`no ${mode} segment`);
  return el;
};

describe("the churn overlay joins the control", () => {
  it("is the fourth segment, and is DISABLED — not absent — when git cannot answer", () => {
    const { model, graphContent } = zoomFixture();
    // jsdom has no Tauri runtime, so `loadChurn` answers `notTauri`.
    renderMap(model, graphContent);
    expect(
      [...container.querySelectorAll("[data-testid=map-overlay-control] button")].map(
        (el) => el.textContent,
      ),
    ).toEqual(["status", "provenance", "drift", "churn"]);
    const churn = segment("churn");
    expect(churn.disabled).toBe(true);
    expect(churn.getAttribute("title")).toBe("churn is off — churn needs the desktop app");
    // Clicking a disabled control changes nothing.
    act(() => churn.click());
    expect(
      container.querySelector("[data-testid=map-view]")?.getAttribute("data-overlay"),
    ).toBe("status");
    // And nothing git-shaped reaches the canvas.
    expect(container.textContent).not.toContain("fatal");
    expect(container.textContent).not.toContain("not a git repository");
  });

  it("says which reason it is, from the closed vocabulary and nothing else", () => {
    const { model, graphContent } = zoomFixture();
    act(() => {
      applyChurnPayload({ kind: "disabled", reason: "notAGitRepo" });
    });
    renderMap(model, graphContent);
    expect(segment("churn").getAttribute("title")).toBe(
      "churn is off — not a git repository",
    );
    expect(segment("churn").disabled).toBe(true);
  });

  it("draws the bar, the share, the raw count and the darker peak", () => {
    const { model, graphContent } = zoomFixture();
    act(() => {
      applyChurnPayload(measuredChurn());
    });
    renderMap(model, graphContent);
    expect(segment("churn").disabled).toBe(false);
    act(() => segment("churn").click());
    expect(
      container.querySelector("[data-testid=map-view]")?.getAttribute("data-overlay"),
    ).toBe("churn");

    // C-02 is busiest at 40 edits; C-01 at 10 is a quarter of it.
    const bar = (id: string): HTMLElement =>
      boxOf(id).querySelector("[data-testid=map-churn-bar]") as HTMLElement;
    expect(bar("C-02").style.width).toBe("100%");
    expect(bar("C-01").style.width).toBe("25%");
    // The 3px height, from the token scale (0.75 * 4px).
    expect(bar("C-02").className).toContain("h-0.75");
    // The single hottest is one step darker, and only it.
    expect(bar("C-02").getAttribute("data-hottest")).toBe("true");
    expect(bar("C-01").getAttribute("data-hottest")).toBeNull();
    expect(bar("C-02").className).toContain("bg-secondary-foreground");
    expect(bar("C-01").className).toContain("bg-muted-foreground");
    // The raw count sits at the mark slot.
    const count = (id: string): string | null | undefined =>
      boxOf(id).querySelector("[data-testid=map-churn-count]")?.textContent;
    expect(count("C-02")).toBe("40");
    expect(count("C-01")).toBe("10");
    // Declared-only shows an em dash and no bar at all.
    expect(count("C-05")).toBe("—");
    expect(boxOf("C-05").querySelector("[data-testid=map-churn-bar]")).toBeNull();
    // A component that exists and has not moved reads zero, not a dash.
    expect(count("C-03")).toBe("0");
    expect(boxOf("C-03").querySelector("[data-testid=map-churn-bar]")).toBeNull();
  });

  it("is NEVER amber, and carries no churn ink in any other overlay", () => {
    const { model, graphContent } = zoomFixture();
    act(() => {
      applyChurnPayload(measuredChurn());
    });
    renderMap(model, graphContent);
    act(() => segment("churn").click());
    for (const el of container.querySelectorAll(
      "[data-testid=map-churn-bar], [data-testid=map-churn-count]",
    )) {
      expect(el.className).not.toContain("warning");
      expect(el.className).not.toContain("status-");
    }
    // Leave churn and every trace of it goes with it.
    act(() => segment("drift").click());
    expect(container.querySelector("[data-testid=map-churn-bar]")).toBeNull();
    expect(container.querySelector("[data-testid=map-churn-count]")).toBeNull();
  });

  it("the legend follows, and states the window and what was walked", () => {
    const { model, graphContent } = zoomFixture();
    act(() => {
      applyChurnPayload(measuredChurn());
    });
    renderMap(model, graphContent);
    const legend = container.querySelector("[data-testid=map-legend]") as HTMLElement;
    expect(legend.textContent).toContain("legend · status");
    act(() => segment("churn").click());
    expect(legend.textContent).toContain("legend · churn");
    expect(legend.textContent).toContain("hottest");
    expect(container.querySelector("[data-testid=map-churn-footer]")?.textContent).toBe(
      "30d · 42 commits · 40 edits in the busiest component · 5 outside every component",
    );
    // The drift footer is not showing at the same time.
    expect(container.querySelector("[data-testid=map-drift-footer]")).toBeNull();
  });

  it("an expanded container carries its churn too, on the same rules", () => {
    const { model, graphContent } = zoomFixture();
    act(() => {
      applyChurnPayload(measuredChurn());
    });
    renderMap(model, graphContent);
    act(() => segment("churn").click());
    expandByDoubleClick("C-02");
    const box = container.querySelector("[data-testid=map-container]") as HTMLElement;
    expect(box.querySelector("[data-testid=map-churn-count]")?.textContent).toBe("40");
    expect(
      (box.querySelector("[data-testid=map-churn-bar]") as HTMLElement).style.width,
    ).toBe("100%");
  });

  it("the panel's churn section is real, and names its window", () => {
    const { model, graphContent } = zoomFixture();
    act(() => {
      applyChurnPayload(measuredChurn());
    });
    renderMap(model, graphContent);
    act(() => node("C-02").click());
    const panel = container.querySelector("[data-testid=map-panel]") as HTMLElement;
    expect(panel.textContent).toContain("churn · 30d");
    expect(panel.querySelector("[data-testid=map-panel-churn]")?.textContent).toContain(
      "40 edits across 2 files",
    );
  });

  it("the DRIFT RING SURVIVES the churn overlay — a finding is never hidden by a mode", () => {
    // The bundle's churn screen draws no rings; T-012's ratified
    // amendment (b) makes drift core rendering in EVERY mode, and a
    // drifting component that looks clean is the failure that matters.
    const { model, graphContent } = zoomFixture();
    act(() => {
      applyChurnPayload(measuredChurn());
    });
    renderMap(model, graphContent);
    // C-02 imports C-03 without declaring it: a D1 on C-02.
    expect(node("C-02").className).toContain("map-drift-ring");
    act(() => segment("churn").click());
    expect(node("C-02").className).toContain("map-drift-ring");
    // The SLOT, though, is churn's: the drift chip steps aside.
    expect(node("C-02").querySelector("[data-testid=map-drift-count]")).toBeNull();
    expect(node("C-02").querySelector("[data-testid=map-churn-count]")?.textContent).toBe("40");
  });
});

// ---- 5 · the utilities exist -------------------------------------------

describe("every utility T-013 adds EMITS into the built CSS", () => {
  /**
   * An unmapped Tailwind utility is silently DEAD here (index.css
   * disables the default scales), so "it compiles" proves nothing about
   * whether the churn bar is painted. Reads `app/dist/`, which
   * `npm run build` writes: the house order builds before testing, and
   * a missing build FAILS LOUDLY rather than skipping.
   *
   * Class names are ASSEMBLED at runtime, never written as literals:
   * Tailwind v4 scans test files, so a literal here would MINT the very
   * utility it claims to observe (T-012's scanner-hygiene trap).
   */
  const util = (...parts: string[]): string => parts.join("-");
  const s = (...parts: string[]): string => parts.join(".");

  const UTILITIES = [
    // the churn bar and its two inks
    util("h", s("0", "75")),
    util("bg", "muted", "foreground"),
    util("bg", "secondary", "foreground"),
    util("w", s("5", "5")),
    // the T1 container
    util("bg", "map", "group"),
    util("rounded", "xl"),
    util("px", s("1", "25")),
    util("border", "map", "node", "border", "selected"),
    util("bottom", s("1", "5")),
    util("right", "2"),
    // the disabled churn segment
    util("opacity", "45"),
    util("cursor", "not", "allowed"),
    // the T2 panel
    util("w", "8"),
    util("underline", "offset", "2"),
    util("decoration", "hairline"),
    util("py", s("1", "25")),
  ];

  function builtCss(): { css: string; newest: number } {
    const dir = resolve("dist/assets");
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      throw new Error(
        `no build output at ${dir} — run \`npm run build\` in app/ first. This ` +
          "assertion is about the SHIPPED stylesheet and cannot be answered " +
          "without one; it does not skip.",
      );
    }
    const files = names.filter((n) => n.endsWith(".css")).map((n) => join(dir, n));
    expect(files.length).toBeGreaterThan(0);
    return {
      css: files.map((f) => readFileSync(f, "utf8")).join("\n"),
      newest: Math.max(...files.map((f) => statSync(f).mtimeMs)),
    };
  }

  it("the build is newer than the sources it is evidence about", () => {
    const { newest } = builtCss();
    for (const rel of [
      "src/architecture/MapContainer.tsx",
      "src/architecture/MapNode.tsx",
      "src/architecture/MapPanel.tsx",
      "src/architecture/MapView.tsx",
    ]) {
      expect(
        newest,
        `dist/ predates ${rel} — rebuild before trusting this probe`,
      ).toBeGreaterThanOrEqual(statSync(resolve(rel)).mtimeMs);
    }
  });

  it("emits a rule for every one of them", () => {
    const { css } = builtCss();
    const dead: string[] = [];
    for (const name of UTILITIES) {
      const selector = "." + name.replace(/\./g, "\\.");
      if (!css.includes(selector)) dead.push(name);
    }
    expect(dead).toEqual([]);
  });
});
