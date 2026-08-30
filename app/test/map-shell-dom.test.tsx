// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "../src/App";
import { PaneRail } from "../src/components/shell/PaneRail";
import type { DocsSnapshotPayload } from "../src/lib/docs-model";

// The pane switcher (T-012 §3): the rail renders only when a project is
// open, board | map are its only items, the board pane's behavior is
// byte-compatible, and the switch is driven through the SAME store the
// real app uses (the T-001 browser-harness precedent — App mounts, the
// dev harness applies a payload, the DOM answers).

declare global {
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

// The watcher-store is a module singleton with a monotonic seq
// watermark; each payload in this file uses a fresh higher seq.
let nextSeq = 1000;

function payload(
  files: { path: string; content: string }[],
  extra: Partial<DocsSnapshotPayload> = {},
): DocsSnapshotPayload {
  nextSeq += 1;
  return { seq: nextSeq, projectDir: "/dogfood", generatedAtMs: nextSeq, files, ...extra };
}

const TASK = `---
id: T-001
title: One task
status: building
---
## Acceptance criteria
- x
`;

const ROADMAP = `# Roadmap

## Backbone
1. **F-01 — Thing** — prose
`;

function openProject(): void {
  act(() => {
    root.render(<App />);
  });
  const harness = window.__nputerDocsHarness;
  expect(harness).toBeDefined();
  act(() => {
    harness?.apply(
      payload([
        { path: "docs/ROADMAP.md", content: ROADMAP },
        { path: "docs/tasks/T-001-one.md", content: TASK },
      ]),
    );
  });
}

describe("PaneRail (unit)", () => {
  it("renders exactly board | map with the v0.1 tag; active carries aria-current", () => {
    act(() => {
      root.render(<PaneRail active="map" onSelect={() => {}} />);
    });
    const rail = container.querySelector("[data-testid=pane-rail]") as HTMLElement;
    const items = rail.querySelectorAll("button");
    expect([...items].map((b) => b.textContent)).toEqual(["board", "map"]);
    expect(
      rail.querySelector("[data-testid=pane-rail-map]")?.getAttribute("aria-current"),
    ).toBe("page");
    expect(
      rail.querySelector("[data-testid=pane-rail-board]")?.getAttribute("aria-current"),
    ).toBeNull();
    expect(rail.textContent).toContain("v0.1");
  });
});

describe("the switcher through the real store", () => {
  it("no rail before a project opens; rail + board pane after", () => {
    act(() => {
      root.render(<App />);
    });
    // Browser screen (no Tauri IPC), full-bleed — no rail.
    expect(container.querySelector("[data-testid=pane-rail]")).toBeNull();
    openProject();
    const main = container.querySelector("[data-testid=docs-model]") as HTMLElement;
    expect(main.getAttribute("data-screen")).toBe("board");
    expect(main.getAttribute("data-pane")).toBe("board");
    expect(container.querySelector("[data-testid=pane-rail]")).not.toBeNull();
    expect(container.querySelector("[data-testid=model-counts]")).not.toBeNull();
    expect(container.querySelector("[data-testid=map-view]")).toBeNull();
  });

  it("board ↔ map switches panes; the header survives byte-compatible", () => {
    openProject();
    const main = container.querySelector("[data-testid=docs-model]") as HTMLElement;
    const headerButtons = [...container.querySelectorAll("header button")].map(
      (b) => b.textContent,
    );
    expect(headerButtons).toContain("Toggle theme");

    act(() =>
      (container.querySelector("[data-testid=pane-rail-map]") as HTMLElement).click(),
    );
    expect(main.getAttribute("data-pane")).toBe("map");
    expect(container.querySelector("[data-testid=map-view]")).not.toBeNull();
    expect(container.querySelector("[data-testid=model-counts]")).toBeNull();
    // The map renders the docs-fed model live: T-001's building task
    // has no component registry here, so the pane shows the degraded
    // empty family — never blank.
    expect(container.querySelector("[data-testid=map-degraded]")).not.toBeNull();
    // Global header is untouched chrome in both panes.
    expect(
      [...container.querySelectorAll("header button")].map((b) => b.textContent),
    ).toEqual(headerButtons);

    act(() =>
      (container.querySelector("[data-testid=pane-rail-board]") as HTMLElement).click(),
    );
    expect(main.getAttribute("data-pane")).toBe("board");
    expect(container.querySelector("[data-testid=map-view]")).toBeNull();
    expect(container.querySelector("[data-testid=model-counts]")).not.toBeNull();
  });

  it("a docs push while the map is open feeds it live (components + graph through the store)", () => {
    openProject();
    act(() =>
      (container.querySelector("[data-testid=pane-rail-map]") as HTMLElement).click(),
    );
    const component = [
      "---",
      "id: C-01",
      "name: Solo",
      "paths:",
      "  - src/**",
      "depends_on: []",
      "status: auto",
      "touch_slugs: []",
      "---",
      "Prose.",
    ].join("\n");
    const graph = JSON.stringify({
      schema: 1,
      root: ".",
      languages: ["ts"],
      files: [{ id: "f:src/a.ts", path: "src/a.ts", lang: "ts", loc: 1, symbols: [] }],
      packages: [],
      edges: [],
      unresolved: [],
    });
    act(() => {
      window.__nputerDocsHarness?.apply(
        payload([
          { path: "docs/ROADMAP.md", content: ROADMAP },
          { path: "docs/tasks/T-001-one.md", content: TASK },
          { path: "docs/architecture/components/C-01-solo.md", content: component },
          { path: "docs/architecture/graph.json", content: graph },
        ]),
      );
    });
    expect(container.querySelector("[data-testid=map-degraded]")).toBeNull(); // full mode now
    expect(container.querySelector('[data-component-id="C-01"]')).not.toBeNull();
  });

  // ---- RETIRED at T-140-s4: "an oversize graph skip reaches the map
  // THROUGH THE SHELL — banner up, button withdrawn"
  //
  // It was T-140's verdict correction 2, and the finding behind it is
  // worth keeping even though the body is not: the verifier's mutant
  // made App.tsx's `graphSkip` lookup never match and the whole suite
  // stayed GREEN, because every other oversize body drove `MapView`
  // directly. This body existed to pin the SHELL's one wiring line.
  //
  // Both ends of that line are gone. `is_collected_docs_path` no longer
  // admits the graph, its eligibility gate runs before its size gate, so
  // no `SkipReason` row for `docs/architecture/graph.json` can be
  // produced; App.tsx's lookup and `MapView`'s `graphSkip` prop are
  // retired with the `map-too-large` banner they fed (@human's ruling,
  // 2026-08-30). Kept as an assertion it would have had to be re-aimed
  // at a payload only this test could construct — a skip row the
  // collector cannot emit — which asserts the harness, not the app.
  //
  // THE LESSON IT TAUGHT IS STILL PAID FOR, one wiring line over: the
  // body above ("a docs push while the map is open feeds it live") drives
  // the real App through the same harness with a real graph, so the
  // `graphContent` spread — the ONLY App→MapView graph wiring left, and
  // the browser fallback's supply line — still dies at the shell level if
  // somebody cuts it.
});
