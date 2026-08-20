// @vitest-environment jsdom
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseProjectFromFiles, type FileEntry, type ProjectParseResult } from "@nputer/parser/pure";
import { MapView } from "../src/architecture/MapView";

/**
 * The map pane's second lens in the DOM (T-034). Five criteria:
 *  1. the lens segmented control, working BOTH directions, session-ephemeral;
 *  2. waves + critical path + blocked/ready + the summary strip;
 *  3. the architecture lens UNCHANGED while the control sits on it;
 *  4. a cycle degrades defined-ly — never a hang, never a crash;
 *  5. hostile titles as text nodes only, plus the standing no-innerHTML gate.
 */

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

// ---- fixtures ---------------------------------------------------------

function taskFile(
  id: string,
  title: string,
  status: string,
  blockedBy: string[] = [],
  extra: string[] = [],
): FileEntry {
  return {
    path: `docs/tasks/${id}-x.md`,
    content: [
      "---",
      `id: ${id}`,
      `title: ${JSON.stringify(title)}`,
      `status: ${status}`,
      `blocked_by: [${blockedBy.join(", ")}]`,
      ...extra,
      "---",
      "## Acceptance criteria",
      "- something",
    ].join("\n"),
  };
}

function componentFile(id: string, name: string): FileEntry {
  return {
    path: `docs/architecture/components/${id}-x.md`,
    content: [
      "---",
      `id: ${id}`,
      `name: ${JSON.stringify(name)}`,
      "paths:",
      `  - "src/${id.toLowerCase()}/**"`,
      "depends_on: []",
      "status: auto",
      "touch_slugs: []",
      "---",
      "Responsibility prose.",
    ].join("\n"),
  };
}

/**
 * The shape of the design's own screen: a done foundation, a chain that
 * is the critical path, an in-flight task something waits on, a task
 * blocked behind an idle one, and a loose ready task.
 */
function lensFixture(): ProjectParseResult {
  return parseProjectFromFiles([
    componentFile("C-01", "Shell"),
    taskFile("T-001", "App shell boots", "done", [], ['review: "independent"']),
    taskFile("T-002", "Task-file parser", "done", ["T-001"], ['review: "self-verified"']),
    taskFile("T-003", "Docs watcher", "planned", ["T-002"]),
    taskFile("T-004", "Story map board", "planned", ["T-003"]),
    taskFile("T-005", "Card detail view", "building", []),
    taskFile("T-006", "Design pass", "planned", ["T-005"]),
    taskFile("T-007", "Opens its own repo", "planned", []),
    taskFile("T-050", "Parked until the world moves", "parked", []),
    taskFile("T-051", "Behind a parked one", "planned", ["T-050"]),
  ]);
}

function renderMap(model: ProjectParseResult, graphContent?: string): void {
  act(() => {
    root.render(
      <MapView
        model={model}
        {...(graphContent !== undefined ? { graphContent } : {})}
        indexing={false}
        indexOutcome={null}
        onRunIndex={() => undefined}
      />,
    );
  });
}

const q = (selector: string): HTMLElement | null =>
  container.querySelector(selector) as HTMLElement | null;
const qa = (selector: string): HTMLElement[] =>
  [...container.querySelectorAll(selector)] as HTMLElement[];
const text = (selector: string): string => q(selector)?.textContent ?? "";

function toTasks(): void {
  act(() => (q("[data-testid=map-lens-tasks]") as HTMLElement).click());
}
function toArchitecture(): void {
  act(() => (q("[data-testid=map-lens-architecture]") as HTMLElement).click());
}

// ---- criterion 1: the lens control ------------------------------------

describe("the lens segmented control (criterion 1)", () => {
  it("renders exactly two segments, architecture first and active by default", () => {
    renderMap(lensFixture());
    const control = q("[data-testid=map-lens-control]");
    expect(control).not.toBeNull();
    const segments = [...(control as HTMLElement).querySelectorAll("button")];
    expect(segments.map((b) => b.textContent)).toEqual(["architecture", "tasks"]);
    expect(segments[0]?.getAttribute("aria-pressed")).toBe("true");
    expect(segments[1]?.getAttribute("aria-pressed")).toBe("false");
    // The default lens is the pane's original view: no tasks canvas yet.
    expect(q("[data-testid=map-tasks-canvas]")).toBeNull();
    expect(q("[data-testid=map-canvas]")).not.toBeNull();
  });

  it("switches BOTH directions, and the wordmark names the lens", () => {
    renderMap(lensFixture());
    expect(q("h2")?.textContent).toBe("map");

    toTasks();
    expect(q("[data-testid=map-lens-tasks]")?.getAttribute("aria-pressed")).toBe("true");
    expect(q("[data-testid=map-lens-architecture]")?.getAttribute("aria-pressed")).toBe("false");
    expect(q("h2")?.textContent).toBe("map · tasks");
    expect(q("[data-testid=map-tasks-canvas]")).not.toBeNull();
    expect(q("[data-testid=map-canvas]")).toBeNull();

    toArchitecture();
    expect(q("[data-testid=map-lens-architecture]")?.getAttribute("aria-pressed")).toBe("true");
    expect(q("h2")?.textContent).toBe("map");
    expect(q("[data-testid=map-canvas]")).not.toBeNull();
    expect(q("[data-testid=map-tasks-canvas]")).toBeNull();
  });

  it("the tasks lens carries the design's subtitle, counted from the real model", () => {
    renderMap(lensFixture());
    expect(q("[data-testid=map-lens-subtitle]")).toBeNull();
    toTasks();
    expect(text("[data-testid=map-lens-subtitle]")).toBe(
      "what has to happen before what · the same 9 tasks, ordered by dependency instead of story",
    );
  });

  it("lens state is SESSION-EPHEMERAL: a fresh mount is back on architecture", () => {
    renderMap(lensFixture());
    toTasks();
    expect(q("[data-testid=map-tasks-canvas]")).not.toBeNull();
    act(() => root.unmount());
    root = createRoot(container);
    renderMap(lensFixture());
    expect(q("[data-testid=map-lens-architecture]")?.getAttribute("aria-pressed")).toBe("true");
    expect(q("[data-testid=map-tasks-canvas]")).toBeNull();
  });

  it("the control sits inside the panel-exempt header, so using it cannot cost a panel", () => {
    renderMap(lensFixture());
    expect(q("[data-testid=map-lens-control]")?.closest("[data-panel-exempt]")).not.toBeNull();
  });

  it("⌘F is claimed only where there IS a search field — never swallowed on tasks", () => {
    // T-049's lesson, at the first moment this pane has a state with no
    // field: a chord that can do nothing must not be claimed either.
    renderMap(lensFixture());
    const chord = (): boolean => {
      const event = new KeyboardEvent("keydown", {
        key: "f",
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        document.dispatchEvent(event);
      });
      return event.defaultPrevented;
    };
    expect(chord()).toBe(true); // architecture: claimed, focuses the field
    toTasks();
    expect(chord()).toBe(false); // tasks: declined, left completely alone
    toArchitecture();
    expect(chord()).toBe(true); // …and it comes back
  });
});

// ---- criterion 2: waves, critical path, blocked/ready, the strip ------

describe("the tasks lens renders dependency waves (criterion 2)", () => {
  it("draws one card per board task, in waves derived from blocked_by", () => {
    renderMap(lensFixture());
    toTasks();
    const cards = qa("[data-testid=map-tasks-card]");
    // Parked is not drawn; the other eight are.
    expect(cards.map((c) => c.getAttribute("data-task-id")).sort()).toEqual([
      "T-001",
      "T-002",
      "T-003",
      "T-004",
      "T-005",
      "T-006",
      "T-007",
      "T-051",
    ]);
    const left = (id: string): string =>
      (q(`[data-task-id="${id}"]`) as HTMLElement).style.left;
    expect(left("T-001")).toBe("0px"); // wave 0
    expect(left("T-002")).toBe("300px"); // wave 1
    expect(left("T-003")).toBe("600px"); // wave 2
    expect(left("T-004")).toBe("900px"); // wave 3
    // Wave labels, one per populated wave, the design's wording on 0.
    expect(qa("[data-testid=map-tasks-wave-label]").map((l) => l.textContent)).toEqual([
      "wave 0 · foundation",
      "wave 1",
      "wave 2",
      "wave 3",
    ]);
  });

  it("the critical path takes the terracotta stroke and the hot arrowhead", () => {
    renderMap(lensFixture());
    toTasks();
    const critical = qa("[data-testid=map-tasks-edge][data-critical]");
    expect(critical.map((e) => e.getAttribute("data-edge"))).toEqual([
      "T-001->T-002",
      "T-002->T-003",
      "T-003->T-004",
    ]);
    for (const edge of critical) {
      expect(edge.getAttribute("stroke")).toBe("var(--status-rejected-meta)");
      expect(edge.getAttribute("stroke-width")).toBe("2");
      expect(edge.getAttribute("marker-end")).toBe("url(#task-arrow-critical)");
    }
    // Every other edge is the quiet dependency stroke.
    const plain = qa("[data-testid=map-tasks-edge]:not([data-critical])");
    expect(plain.length).toBeGreaterThan(0);
    for (const edge of plain) {
      expect(edge.getAttribute("stroke")).toBe("var(--map-edge-planned)");
      expect(edge.getAttribute("stroke-width")).toBe("1.25");
      expect(edge.getAttribute("marker-end")).toBe("url(#task-arrow-plain)");
    }
  });

  it("blocked and ready are DIFFERENT cards, both grey-family", () => {
    renderMap(lensFixture());
    toTasks();
    const blocked = q('[data-task-id="T-051"]') as HTMLElement;
    const ready = q('[data-task-id="T-007"]') as HTMLElement;
    expect(blocked.getAttribute("data-schedule")).toBe("blocked");
    expect(ready.getAttribute("data-schedule")).toBe("ready");
    expect(blocked.className).toContain("bg-map-unmapped");
    expect(blocked.className).toContain("border-dashed");
    expect(blocked.className).toContain("border-status-rejected-meta");
    expect(ready.className).toContain("bg-status-planned");
    expect(ready.className).not.toContain("border-dashed");
    expect(blocked.querySelector("[data-testid=map-tasks-word]")?.textContent).toBe("blocked");
    expect(ready.querySelector("[data-testid=map-tasks-word]")?.textContent).toBe("ready");
  });

  it("a task behind IN-FLIGHT work says what it waits on", () => {
    renderMap(lensFixture());
    toTasks();
    const waiting = q('[data-task-id="T-006"]') as HTMLElement;
    expect(waiting.getAttribute("data-schedule")).toBe("waits");
    expect(waiting.querySelector("[data-testid=map-tasks-word]")?.textContent).toBe(
      "waits on T-005",
    );
  });

  it("done cards carry the ADR-016 mark and no word; in-flight cards pulse on the dot", () => {
    renderMap(lensFixture());
    toTasks();
    const done = q('[data-task-id="T-001"]') as HTMLElement;
    expect(done.querySelector("[data-testid=map-tasks-word]")).toBeNull();
    expect(done.querySelector("[data-testid=map-tasks-review]")?.getAttribute("data-mark")).toBe(
      "checked",
    );
    expect(
      (q('[data-task-id="T-002"]') as HTMLElement).querySelector(
        "[data-testid=map-tasks-review]",
      )?.getAttribute("data-mark"),
    ).toBe("self");
    const building = q('[data-task-id="T-005"]') as HTMLElement;
    expect(building.querySelector("[data-testid=map-tasks-word]")?.textContent).toBe("building");
    // The lens's only ambient motion, and only on the dot — gated
    // motion-safe exactly like the board's and the architecture lens's.
    expect(qa("[data-testid=map-tasks-dot]")).toHaveLength(0); // no verifying/merging here
  });

  it("the summary strip carries all three cells", () => {
    renderMap(lensFixture());
    toTasks();
    expect(q("[data-testid=map-tasks-summary]")).not.toBeNull();
    expect(text("[data-testid=map-tasks-critical-path]")).toBe(
      "T-001 → T-002 → T-003 → T-004 · 2 of 4 still to land",
    );
    expect(text("[data-testid=map-tasks-worst-blocker]")).toBe(
      "T-003 Docs watcher · planned, holds 1",
    );
    // Hand-derived: T-003 (its only blocker is done) and T-007 (none) —
    // T-004 is behind idle T-003, T-006 behind in-flight T-005, T-051
    // behind a parked task, and T-005 has already started.
    expect(text("[data-testid=map-tasks-ready-now]")).toBe("2 tasks, no unmet deps");
    // The worst-blocker cell rides the terracotta family's title ink.
    expect(q("[data-testid=map-tasks-worst-blocker]")?.className).toContain(
      "text-status-rejected-title",
    );
  });

  it("the legend names the four states plus the provenance of the edges", () => {
    renderMap(lensFixture());
    toTasks();
    const legend = q("[data-testid=map-tasks-legend]") as HTMLElement;
    const legendText = legend.textContent ?? "";
    for (const entry of ["critical path", "depends on", "blocked", "ready"]) {
      expect(legendText, entry).toContain(entry);
    }
    expect(legendText).toContain("edges come from the task files · nothing here is hand-drawn");
    expect(legend.getAttribute("data-panel-exempt")).not.toBeNull();
  });

  it("a card opens the SAME detail panel the board opens, under the trusted order", () => {
    renderMap(lensFixture());
    toTasks();
    const card = q('[data-task-id="T-004"]') as HTMLElement;
    expect(card.getAttribute("data-card-trigger")).not.toBeNull();
    act(() => {
      card.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    act(() => card.click());
    const panel = q("[data-testid=task-detail-panel]");
    expect(panel).not.toBeNull();
    expect(panel?.getAttribute("data-task-ref")).toBe("T-004");
  });

  it("cards are real buttons with a roving tabindex — exactly one tab stop", () => {
    renderMap(lensFixture());
    toTasks();
    const cards = qa("[data-testid=map-tasks-card]");
    expect(cards.every((c) => c.tagName === "BUTTON")).toBe(true);
    expect(cards.filter((c) => c.getAttribute("tabindex") === "0")).toHaveLength(1);
  });

  it("says so plainly when there is nothing to order", () => {
    renderMap(parseProjectFromFiles([componentFile("C-01", "Shell")]));
    toTasks();
    expect(q("[data-testid=map-tasks-transform]")).toBeNull();
    expect(text("[data-testid=map-tasks-canvas]")).toContain("no tasks to order yet");
    expect(text("[data-testid=map-tasks-critical-path]")).toBe("no dependency chain yet");
    expect(text("[data-testid=map-tasks-worst-blocker]")).toBe("nothing is holding anything up");
    expect(text("[data-testid=map-tasks-ready-now]")).toBe("0 tasks, no unmet deps");
  });
});

// ---- criterion 3: the architecture lens is unchanged ------------------

describe("the architecture lens is unchanged while the control sits on it (criterion 3)", () => {
  const graph = JSON.stringify({
    schema: 1,
    root: ".",
    languages: ["ts"],
    files: [{ id: "f:src/c-01/a.ts", path: "src/c-01/a.ts", lang: "ts", loc: 1, symbols: [] }],
    packages: [],
    edges: [],
    unresolved: [],
  });

  it("every architecture region survives a lens round trip BYTE-IDENTICALLY", () => {
    renderMap(lensFixture(), graph);
    // The regions the criterion is about: the canvas (nodes + edges),
    // the legend, and the header's architecture chrome. The indexed-at
    // hint is deliberately out — it reads Date.now().
    const regions = [
      "[data-testid=map-canvas]",
      "[data-testid=map-legend]",
      "[data-testid=map-overlay-control]",
      "[data-testid=map-search]",
      "[data-testid=map-reindex]",
    ];
    const before = regions.map((selector) => (q(selector) as HTMLElement).outerHTML);
    toTasks();
    toArchitecture();
    const after = regions.map((selector) => (q(selector) as HTMLElement).outerHTML);
    regions.forEach((selector, index) => {
      expect(after[index], selector).toBe(before[index]);
    });
  });

  it("the ONLY thing the header gains is the control itself", () => {
    renderMap(lensFixture(), graph);
    const header = q("[data-panel-exempt]") as HTMLElement;
    const control = q("[data-testid=map-lens-control]") as HTMLElement;
    const withControl = header.outerHTML;
    control.remove();
    const without = header.outerHTML;
    // Removing the control leaves a header with no other trace of T-034.
    expect(without).not.toContain("map-lens");
    expect(withControl.length).toBeGreaterThan(without.length);
    expect(without).toContain("map-search");
    expect(without).toContain("map-overlay-control");
  });

  it("architecture chrome that does not apply to tasks is ABSENT there, not disabled", () => {
    renderMap(lensFixture(), graph);
    for (const id of ["map-search", "map-overlay-control", "map-reindex", "map-legend"]) {
      expect(q(`[data-testid=${id}]`), id).not.toBeNull();
    }
    toTasks();
    for (const id of ["map-search", "map-overlay-control", "map-reindex", "map-legend"]) {
      expect(q(`[data-testid=${id}]`), id).toBeNull();
    }
    expect(qa("[data-testid=map-node]")).toHaveLength(0);
  });

  it("the overlay control still drives the architecture lens after a round trip", () => {
    renderMap(lensFixture(), graph);
    act(() => (q("[data-testid=map-overlay-drift]") as HTMLElement).click());
    expect(q("[data-testid=map-view]")?.getAttribute("data-overlay")).toBe("drift");
    toTasks();
    toArchitecture();
    expect(q("[data-testid=map-view]")?.getAttribute("data-overlay")).toBe("drift");
  });
});

// ---- criterion 4: cycles ---------------------------------------------

describe("a dependency cycle degrades defined-ly (criterion 4)", () => {
  it("cycle members share one wave, every edge is still drawn, and the pane renders", () => {
    const model = parseProjectFromFiles([
      taskFile("T-001", "Ping", "planned", ["T-002"]),
      taskFile("T-002", "Pong", "planned", ["T-001"]),
      taskFile("T-003", "Downstream", "planned", ["T-002"]),
    ]);
    renderMap(model);
    toTasks();
    const ping = q('[data-task-id="T-001"]') as HTMLElement;
    const pong = q('[data-task-id="T-002"]') as HTMLElement;
    expect(ping.style.left).toBe(pong.style.left); // one wave
    expect(ping.getAttribute("data-in-cycle")).toBe("true");
    expect(pong.getAttribute("data-in-cycle")).toBe("true");
    expect((q('[data-task-id="T-003"]') as HTMLElement).getAttribute("data-in-cycle")).toBeNull();
    // Both cycle edges are drawn, flagged, and dashed — never dropped.
    const tangled = qa("[data-testid=map-tasks-edge][data-tangled]");
    expect(tangled.map((e) => e.getAttribute("data-edge")).sort()).toEqual([
      "T-001->T-002",
      "T-002->T-001",
    ]);
    for (const edge of tangled) expect(edge.getAttribute("stroke-dasharray")).toBe("5 4");
    // …and the pane says so rather than pretending the order is sound.
    expect(text("[data-testid=map-tasks-cycle-note]")).toContain("cycle");
  });

  it("a 60-task ring renders instead of hanging", () => {
    const files: FileEntry[] = [];
    for (let i = 0; i < 60; i += 1) {
      const id = `T-${String(i).padStart(3, "0")}`;
      const prev = `T-${String((i + 59) % 60).padStart(3, "0")}`;
      files.push(taskFile(id, `Ring ${i}`, "planned", [prev]));
    }
    const started = Date.now();
    renderMap(parseProjectFromFiles(files));
    toTasks();
    expect(qa("[data-testid=map-tasks-card]")).toHaveLength(60);
    expect(qa("[data-testid=map-tasks-card][data-in-cycle]")).toHaveLength(60);
    expect(qa("[data-testid=map-tasks-wave-label]")).toHaveLength(1);
    expect(Date.now() - started).toBeLessThan(10_000);
  });
});

// ---- criterion 5: hostile content + the standing gate -----------------

describe("hostile task content stays TEXT (criterion 5)", () => {
  it("markup, control characters, bidi overrides and 10k runs render as text nodes", () => {
    const hostile =
      "<script>alert(1)</script><img src=x onerror=alert(2)>‮gnp.evil‬" +
      // C0 controls built at runtime: the VALUE must carry them, the
      // SOURCE must stay plain text (a control byte in a source file
      // makes grep treat it as binary — see the NUL gate below).
      String.fromCharCode(7, 1, 27) +
      "A".repeat(10_000);
    const model = parseProjectFromFiles([
      taskFile("T-001", hostile, "planned", []),
      taskFile("T-002", "Behind it", "planned", ["T-001"]),
    ]);
    renderMap(model);
    toTasks();
    // Nothing injected, anywhere in the pane.
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    const card = q('[data-task-id="T-001"]') as HTMLElement;
    // The bytes are visible, and they are a TEXT node — not markup.
    expect(card.textContent).toContain("<script>alert(1)</script>");
    expect(card.textContent).toContain("A".repeat(200));
    const title = [...card.querySelectorAll("span")].find(
      (s) => s.childNodes.length === 1 && s.firstChild?.nodeType === 3,
    );
    expect(title).toBeDefined();
    expect(card.querySelectorAll("*").length).toBeLessThan(12); // no injected tree
    // The aria-label carries it as an attribute, never as parsed markup.
    expect(card.getAttribute("aria-label")).toContain("<script>");
  });

  it("a hostile id survives the same way, in the id slot and the edge keys", () => {
    const model = parseProjectFromFiles([
      taskFile("T-001", "Root", "planned", []),
      taskFile("T-002", "Child", "planned", ["<img src=x>", "__proto__", "T-001"]),
    ]);
    renderMap(model);
    toTasks();
    expect(container.querySelector("img")).toBeNull();
    // The unresolvable entries make it blocked, and only the real edge draws.
    expect((q('[data-task-id="T-002"]') as HTMLElement).getAttribute("data-schedule")).toBe(
      "blocked",
    );
    expect(qa("[data-testid=map-tasks-edge]").map((e) => e.getAttribute("data-edge"))).toEqual([
      "T-001->T-002",
    ]);
  });

  it("the no-innerHTML gate covers EVERY file in app/src/architecture/", () => {
    // T-019/T-012's hygiene grep, made standing for the whole pane —
    // extended here to the lens files. The probe above proves today's
    // tree escapes; this proves no future edit reaches for a raw-HTML
    // sink in the pane that renders file content.
    const scan = (dir: string): string[] => {
      const out: string[] = [];
      for (const name of readdirSync(dir).sort()) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) out.push(...scan(full));
        else out.push(full);
      }
      return out;
    };
    const files = scan(resolve("src/architecture"));
    expect(files.length).toBeGreaterThan(0);
    // The lens's own files must be in the scanned set, by name — a gate
    // that silently stops covering them is no gate.
    const names = files.map((f) => f.slice(f.lastIndexOf("/") + 1));
    for (const lensFile of ["TasksLens.tsx", "task-waves.ts", "map-lens.ts", "MapView.tsx"]) {
      expect(names, lensFile).toContain(lensFile);
    }
    for (const file of files) {
      expect(readFileSync(file, "utf8"), `${file} must not reach for a raw-HTML sink`).not.toMatch(
        /innerHTML|dangerouslySetInnerHTML|insertAdjacentHTML|document\.write/,
      );
    }
  });

  it("no source file in the pane carries a literal C0 control character", () => {
    // THIS IS WHAT MAKES THE GATE ABOVE TRUSTWORTHY, and it was found
    // the hard way inside this very task. A control character written
    // straight into a string literal — instead of the six-character
    // escape map-layout.ts uses for two of its three separators —
    // compiles, bundles and tests green, but makes file(1) call the
    // source "data".
    // CORRECTED 2026-08-20 (T-074, measured at `e83ee1d`). This comment
    // carried T-034-s5's superseded diagnosis — "grep(1) treats it as
    // BINARY [so] every grep-based gate in this repo then silently stops
    // seeing that file: the raw-HTML gate above, `lint:tokens`, the CI
    // greps" — and all three claims are false. NO GATE HERE IS BLINDED:
    // the raw-HTML gate above reads `readFileSync(file, "utf8")`, where
    // a C0 byte is an ordinary codepoint and the regex is unaffected;
    // `lint:tokens`' P5 CONTROL scan reads RAW BYTES over every tracked
    // text file and is the gate that REDS on one (T-058); and ci.yml
    // contains ZERO greps.
    // WHAT IS BLINDED IS THE SEARCHER, AND ONLY BY U+0000. Swept over
    // the whole range this check rejects, on a real copy of this
    // directory's map-layout.ts: with a NUL planted, ripgrep drops the
    // file from a directory search entirely (exit 1 when it is the only
    // match) and /usr/bin/grep prints "Binary file ... matches" with the
    // line suppressed (-I exits 1 with nothing). EVERY OTHER byte this
    // check rejects — U+0001-U+0008, U+000B, U+000C, U+000E-U+001F,
    // U+007F — is printed normally by both at exit 0, even though
    // file --mime already calls the source charset=binary.
    // The two incidents below split on exactly that line, which is how
    // the old wording came to generalise wrongly: T-012 shipped one byte
    // in map-layout.ts's `layoutKey` (a literal U+0003 beside two
    // correct escapes) and no searcher missed it; T-034 shipped two in
    // task-waves.ts before this test existed, and both of those were
    // U+0000 — the pair that really did hide a file. Now escapes.
    const scan = (dir: string): string[] => {
      const out: string[] = [];
      for (const name of readdirSync(dir).sort()) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) out.push(...scan(full));
        else out.push(full);
      }
      return out;
    };
    // utf8 is the only overload the deliberately-minimal node shim
    // declares; a C0 byte decodes to the same codepoint, so reading as
    // text is the byte test. Tab, LF and CR are the legal three.
    const legal = new Set([9, 10, 13]);
    for (const file of scan(resolve("src/architecture"))) {
      const offenders: string[] = [];
      const text = readFileSync(file, "utf8");
      for (let i = 0; i < text.length; i += 1) {
        const code = text.charCodeAt(i);
        if ((code < 32 && !legal.has(code)) || code === 127) {
          offenders.push(`U+${code.toString(16).padStart(4, "0")} at offset ${i}`);
        }
      }
      expect(offenders, `${file} carries literal control characters`).toEqual([]);
    }
  });
});

// ---- the tokens actually exist (the enforcement mechanism's whole point)

describe("every utility the lens uses EMITS into the built CSS", () => {
  /**
   * An unmapped Tailwind utility is silently DEAD here (index.css
   * disables the default scales), so "it compiles" proves nothing about
   * whether the lens is painted. This reads `app/dist/`, which
   * `npm run build` writes and .gitignore keeps out of the tree — the
   * house order builds before testing (CONVENTIONS § Build & test), and
   * a missing build FAILS LOUDLY rather than skipping.
   *
   * Class names are ASSEMBLED at runtime, never written as literals:
   * Tailwind v4's automatic source detection scans test files, so a
   * literal utility string in here would MINT the very utility it
   * claims to observe (T-012's recorded scanner-hygiene trap).
   */
  const util = (...parts: string[]): string => parts.join("-");
  const s = (...parts: string[]): string => parts.join(".");

  const UTILITIES = [
    // the lens control
    util("bg", "secondary"),
    util("bg", "primary"),
    util("text", "primary", "foreground"),
    util("text", "secondary", "foreground"),
    util("rounded", "chip"),
    util("p", s("0", "75")),
    util("gap", s("1", "5")),
    util("px", s("2", "75")),
    util("py", s("1", "25")),
    // the summary strip
    util("py", s("3", "25")),
    util("w", "75"),
    util("w", s("57", "5")),
    util("bg", "hairline"),
    util("text", "status", "rejected", "title"),
    // the terracotta family + the two card grounds
    util("border", "status", "rejected", "meta"),
    util("text", "status", "rejected", "foreground"),
    util("bg", "map", "unmapped"),
    util("bg", "status", "planned"),
    util("border", "status", "planned", "border"),
    util("text", "status", "planned", "title"),
    util("text", "map", "declared", "only", "foreground"),
    // the card face
    util("px", s("2", "75")),
    util("py", s("2", "25")),
    util("gap", s("0", "75")),
    util("text", "map", "name"),
    util("text", "map", "meta"),
    util("text", "map", "id"),
    util("tracking", "overline"),
    util("border", "2"),
    util("border", "solid"),
    util("shadow", "map", "node"),
    // the legend
    util("gap", s("5", "5")),
    util("pb", s("5", "5")),
    util("pt", s("3", "5")),
    util("size", s("3", "5")),
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

  it("the build is newer than the lens sources it is evidence about", () => {
    const { newest } = builtCss();
    for (const rel of [
      "src/architecture/TasksLens.tsx",
      "src/architecture/task-waves.ts",
      "src/architecture/MapView.tsx",
    ]) {
      expect(newest, `dist/ predates ${rel} — rebuild before trusting this probe`).toBeGreaterThanOrEqual(
        statSync(resolve(rel)).mtimeMs,
      );
    }
  });

  it("emits a rule for every one of them", () => {
    const { css } = builtCss();
    const dead: string[] = [];
    for (const name of UTILITIES) {
      // Tailwind escapes `.` inside a class name as `\.` in the selector.
      const selector = "." + name.replace(/\./g, "\\.");
      if (!css.includes(selector)) dead.push(name);
    }
    // Assert on the SHORT list, never on the 40 KB haystack.
    expect(dead).toEqual([]);
  });

  it("the pane's only ambient motion stays motion-safe gated", () => {
    const { css } = builtCss();
    const gate = ["motion", "safe"].join("-") + "\\:" + ["animate", "status", "pulse"].join("-");
    expect(css.includes("." + gate)).toBe(true);
  });
});
