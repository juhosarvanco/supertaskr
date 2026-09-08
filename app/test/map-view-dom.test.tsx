// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseProjectFromFiles, type FileEntry, type ProjectParseResult } from "@supertaskr/parser/pure";
import { centerViewport, indexHint, MapView, relativeTime } from "../src/architecture/MapView";
import { UNANSWERED_INDEX_MESSAGE, type IndexOutcomePayload } from "../src/lib/watcher-store";
import { deriveArchitecture } from "../src/lib/architecture/derive";
import { parseGraph } from "../src/lib/architecture/graph";

// The map pane in the DOM (T-012 plan §8): the sixteen states as
// rendered, ring composition, pulse only on the dot, the panel with the
// CONVENTIONS trusted event order (pointerdown decides, then the click
// activates), Esc layering, search select+center math, overlays,
// degraded banners, hostile content.

declare global {
  // React 19's act() opt-in.
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
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
  options: {
    paths?: string[];
    dependsOn?: string[];
    status?: string;
    layer?: string;
    slugs?: string[];
    decisions?: string[];
  } = {},
): FileEntry {
  const lines = [
    "---",
    `id: ${id}`,
    `name: ${JSON.stringify(name)}`,
    ...(options.layer !== undefined ? [`layer: ${options.layer}`] : []),
    "paths:",
    ...(options.paths ?? [`src/${id.toLowerCase()}/**`]).map((p) => `  - ${JSON.stringify(p)}`),
    `depends_on: [${(options.dependsOn ?? []).join(", ")}]`,
    ...(options.decisions !== undefined ? [`decisions: [${options.decisions.join(", ")}]`] : []),
    `status: ${options.status ?? "auto"}`,
    `touch_slugs: [${(options.slugs ?? []).join(", ")}]`,
    "---",
    `${name} responsibility prose.`,
  ];
  return {
    path: `docs/architecture/components/${id}-x.md`,
    content: lines.join("\n"),
  };
}

function taskFile(
  id: string,
  title: string,
  status: string,
  touches: string[],
  review?: string,
): FileEntry {
  const lines = [
    "---",
    `id: ${id}`,
    `title: ${JSON.stringify(title)}`,
    `status: ${status}`,
    ...(review !== undefined ? [`review: ${review}`] : []),
    `touches: [${touches.join(", ")}]`,
    "---",
    "## Acceptance criteria",
    "- something",
  ];
  return { path: `docs/tasks/${id}-x.md`, content: lines.join("\n") };
}

function graphJson(
  files: string[],
  edges: { from: string; to: string }[] = [],
): string {
  return JSON.stringify({
    schema: 1,
    root: ".",
    languages: ["ts"],
    files: files.map((path) => ({ id: `f:${path}`, path, lang: "ts", loc: 1, symbols: [] })),
    packages: [],
    edges: edges.map((e) => ({ from: `f:${e.from}`, to: `f:${e.to}`, kind: "import" })),
    unresolved: [],
  });
}

function project(files: FileEntry[]): ProjectParseResult {
  return parseProjectFromFiles(files);
}

/** The all-states fixture: six statuses, provenance, drift, ghosts. */
function statesFixture(): { model: ProjectParseResult; graphContent: string } {
  const model = project([
    componentFile("C-01", "Planned one", { paths: ["src/a/**"] }),
    componentFile("C-02", "Building one", { paths: ["src/b/**"], slugs: ["b"] }),
    componentFile("C-03", "Verifying one", { paths: ["src/c/**"], slugs: ["c"] }),
    componentFile("C-04", "Rejected one", { paths: ["src/d/**"], slugs: ["d"] }),
    componentFile("C-05", "Done one", { paths: ["src/e/**"], slugs: ["e"], layer: "ui" }),
    componentFile("C-06", "Merging one", { paths: ["src/f/**"], slugs: ["f"] }),
    componentFile("C-07", "Paper only", { paths: ["src/nothing/**"] }),
    componentFile("C-08", "Pinned done", { paths: ["src/g/**"], status: "done" }),
    componentFile("C-09", "Self checked", { paths: ["src/h/**"], slugs: ["h"] }),
    componentFile("C-10", "Drifting done", { paths: ["src/i/**"], slugs: ["i"] }),
    taskFile("T-002", "b", "building", ["b"]),
    taskFile("T-003", "c", "verifying", ["c"]),
    taskFile("T-004", "d", "rejected", ["d"]),
    taskFile("T-005", "e", "done", ["e"], "independent"),
    taskFile("T-006", "f", "merging", ["f"]),
    taskFile("T-008", "h", "done", ["h"], "self-verified"),
    taskFile("T-009", "i", "done", ["i"], "independent"),
  ]);
  const graphContent = graphJson(
    [
      "src/a/a.ts",
      "src/b/b.ts",
      "src/c/c.ts",
      "src/d/d.ts",
      "src/e/e.ts",
      "src/f/f.ts",
      "src/g/g.ts",
      "src/h/h.ts",
      "src/i/i.ts",
      "src/loose/orphan.ts",
    ],
    [
      // Undeclared: C-10 → C-02 (drift on a done component) and
      // C-02 → C-03 (drift on a building component).
      { from: "src/i/i.ts", to: "src/b/b.ts" },
      { from: "src/b/b.ts", to: "src/c/c.ts" },
    ],
  );
  return { model, graphContent };
}

function renderMap(
  model: ProjectParseResult,
  graphContent?: string,
  extra: Partial<Parameters<typeof MapView>[0]> = {},
) {
  act(() => {
    root.render(
      <MapView
        model={model}
        {...(graphContent !== undefined ? { graphContent } : {})}
        indexing={false}
        indexOutcome={null}
        onRunIndex={() => {}}
        {...extra}
      />,
    );
  });
}

const node = (id: string): HTMLElement => {
  const el = container.querySelector(`[data-component-id="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`node ${id} not rendered`);
  return el;
};

// ---- the sixteen states as rendered -----------------------------------

describe("node states in the DOM", () => {
  it("renders every declared component with its status fill; ghosts and paper get theirs", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent);
    expect(node("C-01").className).toContain("bg-status-planned");
    expect(node("C-02").className).toContain("bg-status-building");
    expect(node("C-03").className).toContain("bg-status-verifying");
    expect(node("C-04").className).toContain("bg-status-rejected");
    expect(node("C-05").className).toContain("bg-status-done");
    expect(node("C-06").className).toContain("bg-status-merging");
    // Declared-only: outline only.
    expect(node("C-07").className).toContain("bg-transparent");
    expect(node("C-07").textContent).toContain("declared · no files yet");
    // The unmapped bucket exists (orphan.ts) and reads provisional.
    expect(node("unmapped").className).toContain("bg-map-unmapped");
    expect(node("unmapped").textContent).toContain("1 file no component claims");
  });

  it("drift ring composes on building AND done — status is a fill, drift is a stroke", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent);
    expect(node("C-10").className).toContain("bg-status-done");
    expect(node("C-10").className).toContain("map-drift-ring");
    expect(node("C-10").querySelector("[data-testid=map-drift-count]")?.textContent).toBe(
      "drift 1",
    );
    expect(node("C-02").className).toContain("bg-status-building");
    expect(node("C-02").className).toContain("map-drift-ring");
    // Clean components carry no ring.
    expect(node("C-05").className).not.toContain("map-drift-ring");
  });

  it("the pulse exists ONLY on the 5px dot, motion-safe gated", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent);
    // The class name is assembled so Tailwind's source scanner never
    // sees a bare (ungated) candidate in this file — only real sources
    // may mint utilities, and theirs are motion-safe-prefixed.
    const pulse = "animate-status" + "-pulse";
    const animated = [...container.querySelectorAll("*")].filter((el) =>
      el.getAttribute("class")?.includes(pulse),
    );
    expect(animated).toHaveLength(2); // verifying + merging dots, nothing else
    for (const el of animated) {
      expect(el.getAttribute("data-testid")).toBe("map-status-dot");
      expect(el.getAttribute("class")).toContain(`motion-safe:${pulse}`);
    }
    // The word rides beside the dot for pulsing statuses…
    expect(node("C-03").textContent).toContain("verifying");
    // …and on the meta line for building.
    expect(node("C-02").textContent).toContain("building");
  });

  it("provenance marks: checked disc, self half-disc; pin is a word", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent);
    expect(
      node("C-05").querySelector("[data-testid=map-provenance]")?.getAttribute("data-mark"),
    ).toBe("checked");
    expect(
      node("C-09").querySelector("[data-testid=map-provenance]")?.getAttribute("data-mark"),
    ).toBe("self");
    expect(node("C-08").getAttribute("data-pinned")).toBe("true");
    expect(node("C-08").textContent).toContain("pin");
  });

  it("hover lights the neighborhood and dims the rest to 32%", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent);
    // C-10 → C-02 observed edge makes them neighbors; C-05 is not.
    act(() => {
      node("C-10").dispatchEvent(new Event("pointerover", { bubbles: true }));
    });
    expect(node("C-10").className).toContain("shadow-map-hover-strong");
    expect(node("C-02").className).not.toContain("opacity-32");
    expect(node("C-05").className).toContain("opacity-32");
  });

  it("click selects (ink border, panel opens); focus wears the ring", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent);
    act(() => node("C-05").click());
    expect(node("C-05").className).toContain("map-node-selected");
    expect(container.querySelector("[data-testid=map-panel]")).not.toBeNull();
    act(() => node("C-01").focus());
    expect(node("C-01").className).toContain("shadow-map-focus");
  });
});

describe("the turn to teal", () => {
  it("wipes once on a building→done transition; first render exempt", () => {
    const files = (status: string) => [
      componentFile("C-02", "Turning", { paths: ["src/b/**"], slugs: ["b"] }),
      taskFile("T-002", "b", status, ["b"]),
    ];
    const graphContent = graphJson(["src/b/b.ts"]);
    renderMap(project(files("building")), graphContent);
    expect(container.querySelector("[data-testid=map-teal-wipe]")).toBeNull();
    renderMap(project(files("done")), graphContent);
    const wipe = container.querySelector("[data-testid=map-teal-wipe]");
    expect(wipe).not.toBeNull();
    // The overlay carries the PREVIOUS fill, is invisible at rest
    // (scale-x-0) and only ever moves under motion-safe.
    expect(wipe?.className).toContain("bg-status-building");
    expect(wipe?.className).toContain("scale-x-0");
    expect(wipe?.className).toContain("motion-safe:animate-map-teal-wipe");
    // A fresh mount straight at done shows no wipe (first render exempt).
    act(() => root.unmount());
    container.remove();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    renderMap(project(files("done")), graphContent);
    expect(container.querySelector("[data-testid=map-teal-wipe]")).toBeNull();
  });
});

describe("panel behavior (T-005 primitive pattern, trusted event order)", () => {
  function openPanel(): void {
    act(() => node("C-05").click());
    expect(container.querySelector("[data-testid=map-panel]")).not.toBeNull();
  }

  it("§6.3 sections render with placeholders, never errors", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent);
    openPanel();
    const panel = container.querySelector("[data-testid=map-panel]") as HTMLElement;
    expect(panel.textContent).toContain("responsibility");
    expect(panel.textContent).toContain("Done one responsibility prose.");
    expect(panel.textContent).toContain("no drift findings"); // placeholder
    expect(panel.textContent).toContain("dependencies");
    expect(panel.textContent).toContain("tasks touching this component");
    expect(panel.textContent).toContain("decisions");
    expect(panel.textContent).toContain("no linked decisions"); // placeholder
    expect(panel.textContent).toContain("files");
    // T-013 replaced T-012's "churn arrives with T-013" placeholder with
    // the real section. In jsdom there is no Tauri runtime, so the churn
    // read is DISABLED for the `notTauri` reason and the section renders
    // that reason's ONE fixed sentence — which is also the disabled path
    // this criterion cares about, exercised here for free.
    expect(panel.textContent).toContain("churn is off");
    expect(panel.querySelector("[data-testid=map-panel-status]")?.textContent).toBe("done");
  });

  it("unmapped and pinned variants use the same panel with applicable sections", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent);
    act(() => node("unmapped").click());
    const bucket = container.querySelector("[data-testid=map-panel]") as HTMLElement;
    expect(bucket.textContent).toContain("no component claims");
    expect(bucket.textContent).toContain("orphan.ts");
    expect(bucket.querySelector("[data-testid=map-panel-drift-chip]")?.textContent).toContain(
      "1 drift finding",
    );
    act(() => node("C-08").click());
    const pinned = container.querySelector("[data-testid=map-panel]") as HTMLElement;
    expect(pinned.querySelector("[data-testid=map-panel-pin-note]")?.textContent).toContain(
      "status pinned by the architect",
    );
  });

  it("a task row re-targets to the REAL TaskDetailPanel under the trusted order", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent);
    openPanel();
    const row = container.querySelector("[data-testid=map-panel-task]") as HTMLElement;
    expect(row.getAttribute("data-task-ref")).toBe("T-005");
    // TRUSTED ORDER: the pointerdown reaches the document-level
    // dismissal listener FIRST (it must not close — the row is a
    // data-card-trigger), then the click activates the re-target.
    act(() => {
      row.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    expect(container.querySelector("[data-testid=map-panel]")).not.toBeNull();
    act(() => row.click());
    expect(container.querySelector("[data-testid=map-panel]")).toBeNull();
    const taskPanel = container.querySelector("[data-testid=task-detail-panel]");
    expect(taskPanel).not.toBeNull();
    expect(taskPanel?.getAttribute("data-task-ref")).toBe("T-005");
  });

  it("pressing another node switches the panel (card-trigger exemption); the canvas closes it", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent);
    openPanel();
    // Pointerdown on another node must NOT close (its click re-targets).
    act(() => {
      node("C-02").dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    expect(container.querySelector("[data-testid=map-panel]")).not.toBeNull();
    act(() => node("C-02").click());
    expect(
      container.querySelector("[data-testid=map-panel]")?.getAttribute("data-component-id"),
    ).toBe("C-02");
    // Pointerdown on the bare canvas (outside, no exemption) closes.
    const canvas = container.querySelector("[data-testid=map-canvas]") as HTMLElement;
    act(() => {
      canvas.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    expect(container.querySelector("[data-testid=map-panel]")).toBeNull();
  });

  it("pane chrome is panel-exempt: switching overlays never costs the panel", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent);
    openPanel();
    const driftButton = container.querySelector("[data-testid=map-overlay-drift]") as HTMLElement;
    act(() => {
      driftButton.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    act(() => driftButton.click());
    expect(container.querySelector("[data-testid=map-panel]")).not.toBeNull();
    expect(container.querySelector("[data-testid=map-view]")?.getAttribute("data-overlay")).toBe(
      "drift",
    );
  });

  it("Esc layering: the search popover closes itself first, then Esc closes panel + selection", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent);
    openPanel();
    const search = container.querySelector("[data-testid=map-search]") as HTMLInputElement;
    act(() => {
      search.focus();
      search.dispatchEvent(new Event("focus", { bubbles: true }));
    });
    act(() => {
      root.render; // noop — keep act boundaries tight
    });
    // Type a query so the popover is open.
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(search, "one");
      search.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(container.querySelector("[data-testid=map-search-results]")).not.toBeNull();
    // Escape ON the input: popover closes, panel survives (stopPropagation).
    act(() => {
      search.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
      );
    });
    expect(container.querySelector("[data-testid=map-search-results]")).toBeNull();
    expect(container.querySelector("[data-testid=map-panel]")).not.toBeNull();
    // Escape at the document level: the primitive closes panel + selection.
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(container.querySelector("[data-testid=map-panel]")).toBeNull();
    expect(container.querySelector('[data-testid=map-node][aria-pressed="true"]')).toBeNull();
  });
});

describe("search select + center", () => {
  it("centerViewport math: the node never moves, the viewport does", () => {
    // T-013 gave the layout node a HEIGHT (a container is taller than a
    // node), so centring uses the box's own half-height. At NODE_H = 66
    // that is the 33 this body already asserted.
    expect(centerViewport({ x: 216, y: 190, h: 66 }, 800, 600, 1)).toEqual({
      x: 400 - 312,
      y: 300 - 223,
    });
    expect(centerViewport({ x: 0, y: 40, h: 66 }, 800, 600, 2)).toEqual({
      x: 400 - 192,
      y: 300 - 146,
    });
    // And an expanded container centres on ITS middle, not on 33px.
    expect(centerViewport({ x: 0, y: 40, h: 260 }, 800, 600, 1)).toEqual({
      x: 400 - 96,
      y: 300 - 170,
    });
  });

  it("Enter on the first result selects and centers via the transform", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent);
    const search = container.querySelector("[data-testid=map-search]") as HTMLInputElement;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(search, "Merging");
      search.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => {
      search.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      );
    });
    expect(
      container.querySelector("[data-testid=map-panel]")?.getAttribute("data-component-id"),
    ).toBe("C-06");
    const transform = (
      container.querySelector("[data-testid=map-transform]") as HTMLElement
    ).style.transform;
    // jsdom containers measure 0×0, so the centered viewport is exactly
    // -(node center) — the math is what's pinned here.
    expect(transform).toContain("translate(");
    expect(transform).not.toBe("translate(0px, 0px) scale(1)");
  });
});

describe("overlays", () => {
  it("provenance: every declared node wears mark-or-ring; edges mute", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent);
    act(() =>
      (container.querySelector("[data-testid=map-overlay-provenance]") as HTMLElement).click(),
    );
    const declared = container.querySelectorAll('[data-kind="declared"]');
    const marks = container.querySelectorAll("[data-testid=map-provenance]");
    expect(marks.length).toBe(declared.length);
    const edgeStrokes = [...container.querySelectorAll("[data-testid=map-edge] path")]
      .filter((p) => p.getAttribute("stroke") !== "transparent")
      .map((p) => p.getAttribute("stroke"));
    expect(new Set(edgeStrokes)).toEqual(new Set(["var(--map-edge-muted)"]));
    // Drift is core rendering — the rings survive every overlay.
    expect(node("C-10").className).toContain("map-drift-ring");
  });

  it("drift: clean dims to 40%, counts go bare, the bucket promotes, the footer sums", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent);
    act(() => (container.querySelector("[data-testid=map-overlay-drift]") as HTMLElement).click());
    expect(node("C-05").className).toContain("opacity-40");
    expect(node("C-10").className).not.toContain("opacity-40");
    expect(node("C-10").querySelector("[data-testid=map-drift-count]")?.textContent).toBe("1");
    expect(node("unmapped").className).toContain("border-warning");
    expect(
      container.querySelector("[data-testid=map-drift-footer]")?.textContent,
    ).toContain("findings across");
  });
});

describe("degraded states (never blank, never an error)", () => {
  it("no graph: declared-only nodes + index-not-run line + a working Run index button", () => {
    const onRunIndex = vi.fn();
    const model = project([componentFile("C-01", "Solo", {})]);
    renderMap(model, undefined, { onRunIndex });
    const banner = container.querySelector("[data-testid=map-degraded]");
    expect(banner?.getAttribute("data-mode")).toBe("no-graph");
    expect(banner?.textContent).toContain("index not run");
    act(() => (container.querySelector("[data-testid=map-run-index]") as HTMLElement).click());
    expect(onRunIndex).toHaveBeenCalledOnce();
    // No-graph mode renders T-011's declared-only MODEL as delivered:
    // every component planned-filled (the mock's "declared components
    // only, every edge planned" — the outline-only treatment belongs to
    // full mode's declaredOnly flag).
    expect(node("C-01").className).toContain("bg-status-planned");
  });

  it("an unreadable graph degrades to the same family and names regeneration", () => {
    const model = project([componentFile("C-01", "Solo", {})]);
    renderMap(model, "{ definitely not json");
    const banner = container.querySelector("[data-testid=map-degraded]");
    expect(banner?.textContent).toContain("graph.json is unreadable");
    expect(banner?.textContent).toContain("regenerates");
  });

  // T-140-s4 — WHAT T-140's "too large to map" BODY BECOMES, RATHER THAN
  // WHAT IT WAS.
  //
  // It asserted a PAIR: the same absent graph with and without a
  // `graphSkip: "oversize"` prop, so that neither a pane that never says
  // "index not run" nor one that never says anything else could satisfy
  // it. The prop is retired with the banner (@human, 2026-08-30) and the
  // state is unreachable — a graph the collector never carries is a graph
  // it never skips — so the pair collapses to its control arm, and THAT
  // is what is asserted here: the one sentence and the one button are
  // right again for every absent graph, with no exception to carve out.
  //
  // Asserting the banner's ABSENCE is deliberate and is the half that can
  // still fail: a re-introduced `map-too-large` under any condition reds
  // here, so the retirement is pinned rather than merely performed.
  it("an absent graph says index not run and offers the button, with no oversize exception left", () => {
    const onRunIndex = vi.fn();
    const model = project([componentFile("C-01", "Solo", {})]);

    renderMap(model, undefined, { onRunIndex });
    const banner = container.querySelector("[data-testid=map-degraded]");
    expect(banner?.getAttribute("data-mode")).toBe("no-graph");
    expect(banner?.textContent).toContain("index not run");
    expect(banner?.textContent).not.toContain("too large to map");
    expect(container.querySelector("[data-testid=map-too-large]")).toBe(null);
    // The remedy is offered, because re-indexing is now the remedy for
    // every absent graph this pane can see.
    expect(container.querySelector("[data-testid=map-run-index]")).not.toBe(null);
    expect(onRunIndex).not.toHaveBeenCalled();
    expect(container.querySelector("[data-testid=map-index-hint]")?.textContent).toBe(
      "index not run",
    );
  });

  it("no components: inferred pseudo-components draw dashed with ~", () => {
    renderMap(project([]), graphJson(["src/x/a.ts", "lib/y.ts"]));
    const banner = container.querySelector("[data-testid=map-degraded]");
    expect(banner?.getAttribute("data-mode")).toBe("no-components");
    expect(banner?.textContent).toContain("no architecture declared");
    expect(banner?.textContent).toContain("docs/architecture/components/");
    const inferred = container.querySelectorAll('[data-kind="inferred"]');
    expect(inferred.length).toBe(2);
    expect(inferred[0]?.textContent).toContain("~");
  });

  it("empty: both lines, nothing to draw, still not an error", () => {
    renderMap(project([]));
    const banner = container.querySelector("[data-testid=map-degraded]");
    expect(banner?.getAttribute("data-mode")).toBe("empty");
    expect(banner?.textContent).toContain("no architecture declared");
    expect(banner?.textContent).toContain("index not run");
    expect(container.textContent).toContain("nothing to draw yet");
  });
});

describe("the header hint (volatile stats from the outcome, never the file)", () => {
  it("relativeTime + indexHint cover the states", () => {
    expect(relativeTime(1000, 2000)).toBe("just now");
    expect(relativeTime(0, 90_000)).toBe("1m ago");
    expect(relativeTime(0, 3 * 3_600_000)).toBe("3h ago");
    expect(relativeTime(0, 2 * 86_400_000)).toBe("2d ago");

    const { model, graphContent } = statesFixture();
    const parsed = parseGraph(graphContent);
    const derived = deriveArchitecture({
      components: model.components ?? [],
      tasks: model.tasks,
      ...(parsed.graph !== undefined ? { graph: parsed.graph } : {}),
    });
    expect(indexHint(null, derived, 0)).toBe("committed graph · 10 files");
    expect(
      indexHint(
        {
          kind: "indexed",
          changed: true,
          files: 12,
          symbols: 3,
          edges: 4,
          truncated: false,
          graphBytes: 1000,
          durationMs: 5,
          indexedAtMs: 0,
        },
        derived,
        30_000,
      ),
    ).toBe("indexed just now · 12 files");
    // T-140-s4 — the `· over the snapshot cap` arm is RETIRED with
    // `COLLECTOR_CAP_BYTES`, and this is the assertion that keeps it
    // retired rather than merely deleted: a graph FAR past the old 1 MiB
    // constant now reads exactly like any other, because there is no
    // snapshot cap on the graph for it to be over. Left as a deletion,
    // nothing in this suite would have noticed the arm coming back.
    expect(
      indexHint(
        {
          kind: "indexed",
          changed: true,
          files: 12,
          symbols: 3,
          edges: 4,
          truncated: false,
          graphBytes: 2_000_000,
          durationMs: 5,
          indexedAtMs: 0,
        },
        derived,
        0,
      ),
    ).toBe("indexed just now · 12 files");
    const noGraph = deriveArchitecture({ components: model.components ?? [], tasks: [] });
    expect(indexHint(null, noGraph, 0)).toBe("index not run");
  });

  it("indexing renders the calm chip and disables the button", () => {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent, { indexing: true });
    expect(container.querySelector("[data-testid=map-index-hint]")?.textContent).toBe("indexing…");
    expect(
      (container.querySelector("[data-testid=map-reindex]") as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});

// ---- T-200: an ABSENCE is not a FAILURE, as RENDERED -------------------

describe("the index hint tells an ABSENCE from a REFUSAL", () => {
  // `IndexOutcomePayload`'s `error` arm carries both, and the two payloads
  // are IDENTICAL IN SHAPE — same `kind`, same one `message` field. So
  // every assertion here is on the RENDERED text and none on the payload:
  // a body that asserted the payload would pass whichever sentence reached
  // the screen, which is precisely how the defect survived T-192's suite.
  //
  // The old body this block replaces asserted
  // `toContain("index failed")` against the refusal fixture alone; that
  // assertion survives below as an exact-equality positive control, and
  // the card's point is that it passed identically before and after the
  // sentence became wrong for the OTHER state.

  const REFUSAL = "docs/architecture is a symlink";

  function renderHint(outcome: IndexOutcomePayload): HTMLElement {
    const { model, graphContent } = statesFixture();
    renderMap(model, graphContent, { indexOutcome: outcome });
    const el = container.querySelector("[data-testid=map-index-hint]");
    if (!(el instanceof HTMLElement)) throw new Error("the index hint did not render");
    return el;
  }

  it("an ABSENCE does not claim the index failed, and says what is true instead", () => {
    // CONSTRUCTED THE WAY THE PRODUCER BUILDS IT (CONVENTIONS: a positive
    // control is built the way the producer builds it, never written to
    // look similar): `runIndexRepo`'s bound resolves exactly this payload,
    // so a reword of the constant moves this fixture with the code rather
    // than leaving a stale look-alike literal behind.
    const hint = renderHint({ kind: "error", message: UNANSWERED_INDEX_MESSAGE });
    const text = hint.textContent ?? "";

    // The defect in one line: the bound is not a failure and must not be
    // announced as one.
    expect(text).not.toContain("index failed");
    expect(text.toLowerCase()).not.toContain("fail");

    // …and the chip is not merely blank-and-harmless. Pinned by its
    // LITERAL, because a body parametrised by the constant it checks
    // cannot pin that constant (T-063, and the sibling trap
    // `startup-recovery.test.ts` names one field over).
    expect(text).toBe("no answer yet · re-index is safe");

    // THE RETRACTION IS NOT HOVER-ONLY ANY MORE. The span is
    // `max-w-70 truncate`, so the visible line has to be true where it is
    // cut; the whole sentence stays reachable in the tooltip rather than
    // being the only place the correction lives.
    expect(hint.getAttribute("title")).toBe(UNANSWERED_INDEX_MESSAGE);
  });

  it("a genuine REFUSAL still reads as a failure — the positive control", () => {
    // Without this the body above is satisfied by a repair that stopped
    // saying "failed" about ANYTHING, which would flatten the two cases
    // into one in the other direction.
    const hint = renderHint({ kind: "error", message: REFUSAL });
    expect(hint.textContent).toBe(`index failed: ${REFUSAL}`);
    expect(hint.getAttribute("title")).toBe(REFUSAL);
  });

  it("THE TWO STATES DO NOT RENDER THE SAME SENTENCE", () => {
    // The body this card is about. Each assertion above pins ONE literal,
    // and a repair that rendered both states identically would pass either
    // of them alone exactly as happily as it passes both — this project's
    // most-repeated defect class. Rendered one after the other, into the
    // same root, they must differ and each must carry the half the other
    // does not.
    const absence = renderHint({ kind: "error", message: UNANSWERED_INDEX_MESSAGE }).textContent;
    const refusal = renderHint({ kind: "error", message: REFUSAL }).textContent;

    expect(absence).not.toBe(refusal);
    expect(refusal).toContain("index failed");
    expect(absence).not.toContain("index failed");
  });

  it("a refusal that merely SOUNDS like the bound still reads as a failure", () => {
    // The discriminator is IDENTITY against `UNANSWERED_INDEX_MESSAGE`,
    // not a substring sniff — and this is the body that says so. A
    // `message.includes("did not answer")` repair passes all three bodies
    // above and quietly swallows this one, rendering a real refusal as a
    // calm absence: the same defect pointing the other way.
    const nearMiss = "index_repo: the indexer did not answer — the command was refused";
    expect(nearMiss).not.toBe(UNANSWERED_INDEX_MESSAGE);
    expect(renderHint({ kind: "error", message: nearMiss }).textContent).toBe(
      `index failed: ${nearMiss}`,
    );
  });
});

describe("hostile content stays text", () => {
  it("component names with markup, RTL overrides, and 10k chars render as text nodes only", () => {
    const hostileName = "<img src=x onerror=alert(1)>‮gnp.evil‬" + "A".repeat(10_000);
    const model = project([
      componentFile("C-01", hostileName, { paths: ["src/a/**"] }),
    ]);
    renderMap(model, graphJson(["src/a/a.ts"]));
    expect(container.querySelector("img")).toBeNull();
    expect(node("C-01").textContent).toContain("<img src=x onerror=alert(1)>");
    // The panel renders it as text too.
    act(() => node("C-01").click());
    expect(container.querySelector("img")).toBeNull();
    const panel = container.querySelector("[data-testid=map-panel]") as HTMLElement;
    expect(panel.textContent).toContain("<img src=x onerror=alert(1)>");
  });
});
