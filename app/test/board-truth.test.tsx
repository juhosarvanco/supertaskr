// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseProjectFromFiles, type ProjectParseResult } from "@nputer/parser/pure";
import { Board } from "../src/components/board/Board";
import App from "../src/App";

// T-017 DOM behavior — the board tells the whole truth. jsdom cannot do
// layout (no scrollWidth), so the overflow criterion pins the CLASS
// contract here (break-words on every title span) while the served
// bundle's compiled CSS proves the utility exists — the tokens-only
// gotcha makes unmapped utilities silently dead, so both halves matter.
// Panel/parked/exemption behavior is real react-dom against real
// components; the trusted-order pointerdown race itself stays pinned in
// panel-dismissal.test.ts (synthetic events cannot reproduce it).

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PATHOLOGICAL = "B".repeat(200); // unbroken — no whitespace anywhere

const ROADMAP = [
  "# R",
  "",
  "## Backbone",
  "- F-01: Method — the convention",
  "",
].join("\n");

const TWICE_REJECTED = [
  "",
  "## Verdicts",
  "2026-08-12 — codex (verifier): REJECTED",
  "",
  "repro: file order.",
  "",
  "2026-08-13 — codex (verifier): REJECTED — still file order.",
  "",
].join("\n");

const NOTES = "line one\n  indented `code`\nline three";
const NOTES_BODY = `\n## Implementation notes\n${NOTES}\n`;

type Field = [key: string, value: string | number];

const src = (fields: Field[], body = ""): string =>
  `---\n${fields.map(([k, v]) => `${k}: ${v}`).join("\n")}\n---\n${body}`;

const task = (id: string, extras: Field[] = [], body = ""): string => {
  const fields = new Map<string, string | number>([
    ["id", id],
    ["title", `${id} title`],
    ["feature", "F-01"],
    ["milestone", 1],
    ["priority", 1],
    ["size", "M"],
    ["status", "planned"],
  ]);
  for (const [key, value] of extras) fields.set(key, value);
  return src([...fields.entries()], body);
};

/** The whole-truth fixture: every T-017 population in one column. */
const FILES: Array<{ path: string; content: string }> = [
  { path: "docs/ROADMAP.md", content: ROADMAP },
  {
    path: "docs/tasks/T-101.md",
    content: task("T-101", [["title", PATHOLOGICAL], ["status", "building"], ["priority", 1]], TWICE_REJECTED),
  },
  {
    path: "docs/tasks/T-102.md",
    content: task("T-102", [["status", "rejected"], ["priority", 2]], TWICE_REJECTED),
  },
  {
    path: "docs/tasks/T-103.md",
    content: task("T-103", [["status", "rejected"], ["priority", 3]]),
  },
  {
    path: "docs/tasks/T-104.md",
    content: task("T-104", [["title", PATHOLOGICAL], ["milestone", 2], ["priority", 4]]),
  },
  {
    path: "docs/tasks/T-105.md",
    content: task("T-105", [["status", "building"], ["priority", 5]], NOTES_BODY),
  },
  {
    path: "docs/tasks/T-106.md",
    content: task("T-106", [["status", "building"], ["priority", 6]], NOTES_BODY),
  },
  {
    path: "docs/tasks/T-100-s1-ghost.md",
    // T-019: a suggestion's entire content is its context paragraph (the
    // preamble before any heading) — the ghost panel variant renders it.
    content: src(
      [
        ["title", PATHOLOGICAL],
        ["feature", "F-01"],
        ["status", "suggested"],
        ["suggested_by", "verifier"],
      ],
      `\nGhost context: one paragraph, kept verbatim.\nSecond line ${PATHOLOGICAL}\n`,
    ),
  },
  {
    path: "docs/tasks/T-140-parked.md",
    content: src([["id", "T-140"], ["title", "Parked idea"], ["feature", "F-01"], ["status", "parked"]]),
  },
  {
    path: "docs/tasks/T-141-parked.md",
    content: src([["id", "T-141"], ["title", PATHOLOGICAL], ["feature", "F-01"], ["status", "parked"]]),
  },
];

const model: ProjectParseResult = parseProjectFromFiles(FILES);

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

function render(element: React.ReactElement): void {
  act(() => root.render(element));
}

/** A full press the way real input delivers it: pointerdown, then click.
 * (Order only — the trusted mid-propagation flush race is NOT
 * reproducible synthetically; panel-dismissal.test.ts pins that.) */
function press(el: Element): void {
  act(() => {
    el.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

const q = (selector: string): Element | null => container.querySelector(selector);

const panel = (): Element | null => q('[data-testid="task-detail-panel"]');

/** The rendered text-leaf span holding `text` (title spans have no
 * children), for class assertions. */
function leafSpan(text: string): HTMLElement {
  const span = [...container.querySelectorAll("span")].find(
    (s) => s.textContent === text && s.children.length === 0,
  );
  if (span === undefined) throw new Error("span not found");
  return span;
}

describe("title overflow containment (T-004-s1)", () => {
  it("real cards, below-slice cards, ghosts, and parked entries all break pathological titles", () => {
    render(<Board model={model} />);
    // Expand parked so its entries render too.
    press(q('[data-testid="parked-row"]') as Element);

    // T-101 real card + T-104 below-slice + ghost + T-141 parked entry
    // all render the unbroken 200-char title; every rendering span must
    // carry break-words (overflow-wrap) so nothing bleeds across columns.
    const spans = [...container.querySelectorAll("span")].filter(
      (s) => s.textContent === PATHOLOGICAL && s.children.length === 0,
    );
    expect(spans.length).toBe(4);
    for (const span of spans) {
      expect(span.classList.contains("break-words")).toBe(true);
      expect(span.classList.contains("min-w-0")).toBe(true);
    }
  });

  it("ordinary titles wear the same containment (the utility is unconditional)", () => {
    render(<Board model={model} />);
    expect(leafSpan("T-102 title").classList.contains("break-words")).toBe(true);
  });
});

describe("a padding-aliased backbone is disclosed AT the column (T-097)", () => {
  // The ruling at selectBoard refuses to merge `F-1` into `F-01`, so
  // this marker is the only thing standing between a reader and two
  // plausible-looking columns that are one backbone slot. It has to
  // reach the DOM — an advisory issue in the issue list is three panes
  // away and is not the same claim.
  const ALIASED = parseProjectFromFiles([
    {
      path: "docs/ROADMAP.md",
      content: ["# R", "", "## Backbone", "- F-1: One — a", "- F-01: One padded — b", ""].join(
        "\n",
      ),
    },
    {
      path: "docs/tasks/T-201.md",
      content: src([
        ["id", "T-201"],
        ["title", "T-201 title"],
        ["feature", "F-1"],
        ["status", "planned"],
      ]),
    },
    {
      path: "docs/tasks/T-202.md",
      content: src([
        ["id", "T-202"],
        ["title", "T-202 title"],
        ["feature", "F-01"],
        ["status", "planned"],
      ]),
    },
  ]);

  const columnFor = (featureId: string): Element => {
    const found = q(`[data-testid="feature-column"][data-feature-id="${featureId}"]`);
    if (found === null) throw new Error(`no column ${featureId}`);
    return found;
  };

  it("both headers name the other spelling, and each column still holds only its exact-string task", () => {
    render(<Board model={ALIASED} />);
    const unpadded = columnFor("F-1");
    const padded = columnFor("F-01");

    // The disclosure, in the header, on BOTH columns.
    expect(
      unpadded.querySelector('[data-testid="column-alias"]')?.getAttribute("data-aliased-with"),
    ).toBe("F-01");
    expect(
      padded.querySelector('[data-testid="column-alias"]')?.getAttribute("data-aliased-with"),
    ).toBe("F-1");
    expect(unpadded.querySelector("header")?.textContent).toContain("F-01");
    expect(padded.querySelector("header")?.textContent).toContain("F-1");

    // …and the split it is disclosing is really there: the ruling did
    // not quietly move a card while the marker was being added.
    expect(
      [...unpadded.querySelectorAll("[data-task-id]")].map((c) => c.getAttribute("data-task-id")),
    ).toEqual(["T-201"]);
    expect(
      [...padded.querySelectorAll("[data-task-id]")].map((c) => c.getAttribute("data-task-id")),
    ).toEqual(["T-202"]);
  });

  it("an unaliased backbone grows no marker anywhere on the board", () => {
    render(<Board model={model} />);
    expect(q('[data-testid="column-alias"]')).toBeNull();
  });
});

describe("rejected ×N on the card face (T-006-s3)", () => {
  it("a rejected card with two REJECTED verdicts says `rejected ×2`", () => {
    render(<Board model={model} />);
    const card = q('[data-testid="task-card"][data-task-id="T-102"]');
    expect(card?.getAttribute("data-rejected-count")).toBe("2");
    expect(card?.textContent).toContain("rejected ×2");
  });

  it("a rejected card with zero verdicts shows the bare word — absence, not ×0", () => {
    render(<Board model={model} />);
    const card = q('[data-testid="task-card"][data-task-id="T-103"]');
    expect(card?.getAttribute("data-rejected-count")).toBeNull();
    expect(card?.textContent).toContain("rejected");
    expect(card?.textContent).not.toContain("×");
  });

  it("a building card keeps its scar count as model truth but the face shows its status word", () => {
    render(<Board model={model} />);
    const card = q('[data-testid="task-card"][data-task-id="T-101"]');
    expect(card?.getAttribute("data-rejected-count")).toBe("2");
    expect(card?.textContent).toContain("building");
    expect(card?.textContent).not.toContain("×");
  });
});

describe("parked rows expand and open the panel (T-005-s1)", () => {
  it("the row shows the count, expands in place, and lists entries id-first", () => {
    render(<Board model={model} />);
    const toggle = q('[data-testid="parked-row"]') as HTMLElement;
    expect(toggle.textContent).toContain("2 parked");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(q('[data-testid="parked-list"]')).toBeNull();

    press(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const entries = [...container.querySelectorAll('[data-testid="parked-task"]')];
    expect(entries.map((e) => e.getAttribute("data-task-id"))).toEqual(["T-140", "T-141"]);
    expect(entries[0]?.textContent).toContain("Parked idea");

    press(toggle);
    expect(q('[data-testid="parked-list"]')).toBeNull();
  });

  it("clicking a parked entry opens the existing detail panel via its cardRef (id kind)", () => {
    render(<Board model={model} />);
    press(q('[data-testid="parked-row"]') as Element);
    press(q('[data-testid="parked-task"][data-task-id="T-140"]') as Element);
    expect(panel()).not.toBeNull();
    expect(panel()?.getAttribute("data-ref-kind")).toBe("id");
    expect(panel()?.getAttribute("data-task-ref")).toBe("T-140");
    expect(panel()?.textContent).toContain("Parked idea");
    expect(panel()?.textContent).toContain("parked");
  });

  it("expanding the parked row while the panel is open keeps the panel (data-panel-exempt on the toggle)", () => {
    render(<Board model={model} />);
    press(q('[data-testid="task-card"][data-task-id="T-102"] button') as Element);
    expect(panel()).not.toBeNull();

    const toggle = q('[data-testid="parked-row"]') as HTMLElement;
    expect(toggle.hasAttribute("data-panel-exempt")).toBe(true);
    press(toggle);
    expect(panel()).not.toBeNull(); // still open
    expect(q('[data-testid="parked-list"]')).not.toBeNull(); // and expanded

    // The entries are card triggers: clicking one SWITCHES the panel.
    press(q('[data-testid="parked-task"][data-task-id="T-141"]') as Element);
    expect(panel()?.getAttribute("data-task-ref")).toBe("T-141");
  });
});

describe("implementation-notes disclosure in the panel (T-005-s2)", () => {
  it("renders collapsed by default; expanding shows the notes VERBATIM in a mono scroll container", () => {
    render(<Board model={model} />);
    press(q('[data-testid="task-card"][data-task-id="T-105"] button') as Element);

    const section = q('[data-testid="detail-notes"]');
    expect(section).not.toBeNull();
    expect(section?.getAttribute("data-expanded")).toBe("false");
    expect(q('[data-testid="detail-notes-text"]')).toBeNull();

    const toggle = q('[data-testid="detail-notes-toggle"]') as HTMLElement;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    press(toggle);

    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const text = q('[data-testid="detail-notes-text"]') as HTMLElement;
    // VERBATIM: indentation, backticks, line breaks — exactly the file.
    expect(text.textContent).toBe(NOTES);
    // Mono + whitespace-preserving like the verdict blocks, and a
    // horizontal scroll container so preformatted runs stay contained.
    expect(text.classList.contains("font-mono")).toBe(true);
    expect(text.classList.contains("whitespace-pre-wrap")).toBe(true);
    expect(text.classList.contains("overflow-x-auto")).toBe(true);
    // Expanding the notes keeps the panel, obviously — the toggle is
    // INSIDE the panel, which the dismissal wiring already contains.
    expect(panel()).not.toBeNull();
  });

  it("re-targeting the panel collapses the next task's notes again", () => {
    render(<Board model={model} />);
    press(q('[data-testid="task-card"][data-task-id="T-105"] button') as Element);
    press(q('[data-testid="detail-notes-toggle"]') as Element);
    expect(q('[data-testid="detail-notes-text"]')).not.toBeNull();

    press(q('[data-testid="task-card"][data-task-id="T-106"] button') as Element);
    expect(panel()?.getAttribute("data-task-ref")).toBe("T-106");
    expect(q('[data-testid="detail-notes"]')?.getAttribute("data-expanded")).toBe("false");
    expect(q('[data-testid="detail-notes-text"]')).toBeNull();
  });

  it("a task without notes renders the section visibly empty — no disclosure, no error", () => {
    render(<Board model={model} />);
    press(q('[data-testid="task-card"][data-task-id="T-102"] button') as Element);
    const section = q('[data-testid="detail-notes"]');
    expect(section).not.toBeNull();
    expect(section?.querySelector('[data-testid="detail-empty"]')).not.toBeNull();
    expect(q('[data-testid="detail-notes-toggle"]')).toBeNull();
  });
});

describe("ghost panel context (T-019, absorbing T-002-s2)", () => {
  it("opening a suggestion renders its context paragraph — the panel is no longer empty", () => {
    render(<Board model={model} />);
    press(q('[data-testid="ghost-card"] button') as Element);
    expect(panel()).not.toBeNull();
    expect(panel()?.getAttribute("data-ref-kind")).toBe("file"); // id-less ghost opens by file

    const section = q('[data-testid="detail-context"]');
    expect(section).not.toBeNull();
    const text = q('[data-testid="detail-context-text"]') as HTMLElement;
    // VERBATIM, line breaks preserved by the whitespace class contract.
    expect(text.textContent).toBe(
      `Ghost context: one paragraph, kept verbatim.\nSecond line ${PATHOLOGICAL}`,
    );
    expect(text.classList.contains("whitespace-pre-wrap")).toBe(true);
    // T-004-s1 containment: the unbroken run must not widen the panel.
    expect(text.classList.contains("break-words")).toBe(true);
    expect(text.classList.contains("min-w-0")).toBe(true);
  });

  it("the context section is the ghost variant's — a non-suggested panel does not grow one", () => {
    render(<Board model={model} />);
    press(q('[data-testid="task-card"][data-task-id="T-102"] button') as Element);
    expect(panel()).not.toBeNull();
    expect(q('[data-testid="detail-context"]')).toBeNull();
  });

  it("a body-less suggestion shows the context section visibly empty, never an error", () => {
    const files = FILES.map((f) =>
      f.path === "docs/tasks/T-100-s1-ghost.md"
        ? {
            path: f.path,
            content: src([
              ["title", "Bare ghost"],
              ["feature", "F-01"],
              ["status", "suggested"],
              ["suggested_by", "verifier"],
            ]),
          }
        : f,
    );
    render(<Board model={parseProjectFromFiles(files)} />);
    press(q('[data-testid="ghost-card"] button') as Element);
    const section = q('[data-testid="detail-context"]');
    expect(section).not.toBeNull();
    expect(section?.querySelector('[data-testid="detail-empty"]')).not.toBeNull();
    expect(q('[data-testid="detail-context-text"]')).toBeNull();
  });
});

describe("header controls do not dismiss the panel (T-005-s3, full App)", () => {
  it("pressing the theme toggle while the panel is open keeps the panel; bare chrome still closes it", async () => {
    render(<App />);
    // Outside Tauri the store exposes the DEV browser harness; drive the
    // same snapshot the fixture model came from through the real store.
    await act(async () => {});
    const harness = window.__nputerDocsHarness;
    if (harness === undefined) throw new Error("dev harness missing");
    act(() => {
      harness.apply({
        seq: 1,
        projectDir: "/proj",
        generatedAtMs: Date.now(),
        files: FILES.map(({ path, content }) => ({ path, content })),
      });
    });
    expect(q('[data-testid="docs-model"]')?.getAttribute("data-screen")).toBe("board");

    press(q('[data-testid="task-card"][data-task-id="T-102"] button') as Element);
    expect(panel()).not.toBeNull();

    const toggle = [...container.querySelectorAll("button")].find(
      (b) => b.textContent === "Toggle theme",
    );
    if (toggle === undefined) throw new Error("theme toggle missing");
    expect(toggle.closest("[data-panel-exempt]")).not.toBeNull();
    press(toggle);
    expect(panel()).not.toBeNull(); // the T-005-s3 surprise, fixed

    // Bare chrome (the wordmark) is NOT exempt: outside press closes.
    const wordmark = [...container.querySelectorAll("h1")].find(
      (h) => h.textContent === "nputer",
    );
    if (wordmark === undefined) throw new Error("wordmark missing");
    press(wordmark);
    expect(panel()).toBeNull();
  });
});
