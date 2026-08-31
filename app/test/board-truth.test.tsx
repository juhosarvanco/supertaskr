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

// ---------------------------------------------------------------------
// T-031: the containment sweep's remaining surfaces, the soft-issue join,
// and the model badge's bound. Same discipline as the T-017 block above —
// jsdom does no layout, so what is pinned here is the CLASS contract plus
// the fact that the whole hostile run really is in the DOM (a containment
// assertion over a fixture that never rendered would pass for the wrong
// reason). The compiled stylesheet defining the rules is probed from
// dist/ at build time; the launch look stays @human's.
// ---------------------------------------------------------------------

/** The T-004-s1 repro generalized to frontmatter FIELDS (T-017-s1). */
const HOSTILE = "H".repeat(10_000);
/** A second one, so the resolved and unresolved blocker chips — two
 * different render paths — each get their own unbroken run. */
const HOSTILE_DANGLING = "U".repeat(10_000);
/** The file path is file-derived text too (the panel's footer prints it,
 * and an id-less ghost's ref line IS it). Kept to 200 rather than 10k
 * because a path is the one field with a real-world ceiling. */
const HOSTILE_PATH = `docs/tasks/T-300-${"P".repeat(200)}.md`;

/** Utilities that would HIDE glyphs. T-017's ruling is that the board
 * tells the whole truth: a hostile field makes a taller surface, never
 * hidden text. The one deliberate exception is the model badge, whose
 * own describe below states why a chip may clip where prose may not. */
const CLAMPING = ["truncate", "text-ellipsis", "overflow-hidden", "whitespace-nowrap", "text-nowrap"];

const expectWraps = (el: Element | null): void => {
  if (el === null) throw new Error("surface not rendered");
  expect(el.classList.contains("break-words")).toBe(true);
  expect(el.classList.contains("min-w-0")).toBe(true);
  for (const clamp of CLAMPING) expect(el.classList.contains(clamp)).toBe(false);
};

const HOSTILE_VERDICT = [
  "",
  "## Verdicts",
  "2026-08-20 — codex (verifier): REJECTED — repro below.",
  "",
  `    ${"R".repeat(2_000)}`,
  "",
].join("\n");

const HOSTILE_MODEL = parseProjectFromFiles([
  { path: "docs/ROADMAP.md", content: ROADMAP },
  {
    path: HOSTILE_PATH,
    content: src(
      [
        ["id", "T-300"],
        ["title", HOSTILE],
        ["feature", "F-01"],
        ["milestone", 1],
        ["priority", 1],
        ["size", "M"],
        ["status", "done"],
        ["blocked_by", `[T-301, ${HOSTILE_DANGLING}]`],
        ["touches", `[${HOSTILE}, "<img src=x onerror=alert(1)>"]`],
        ["built_by", HOSTILE],
        ["verified_by", HOSTILE],
        ["review", "same-model"],
      ],
      HOSTILE_VERDICT,
    ),
  },
  {
    // The RESOLVED half of the blocker pair, and it is deliberately an
    // ORDINARY id. A resolved chip cannot carry a hostile run BY
    // CONSTRUCTION — resolution requires a declared task, and the
    // parser's identity gate refuses any `id` that is not shaped like
    // `T-016`/`T-016-s2` (measured: an id of 10k `H` is an
    // `invalid-field` and the record is withheld). So the unbounded
    // chip is the UNRESOLVED one, and the resolved one gets the same
    // treatment as defense in depth against the day that grammar moves.
    path: "docs/tasks/T-301.md",
    content: src([
      ["id", "T-301"],
      ["title", "the resolvable blocker"],
      ["feature", "F-01"],
      ["milestone", 1],
      ["priority", 2],
      ["status", "planned"],
    ]),
  },
  {
    path: "docs/tasks/T-302-ghost.md",
    content: src([
      ["title", "hostile ghost"],
      ["feature", "F-01"],
      ["status", "suggested"],
      ["suggested_by", HOSTILE],
    ]),
  },
]);

const openHostilePanel = (): void => {
  press(q('[data-testid="task-card"][data-task-id="T-300"] button') as Element);
};

describe("the remaining file-derived surfaces contain hostile fields (T-017-s1)", () => {
  it("the ghost's provenance line wraps a 10k-char suggested_by, whole", () => {
    render(<Board model={HOSTILE_MODEL} />);
    const provenance = q('[data-testid="ghost-provenance"]');
    // Positive control FIRST: the surface is really holding the run.
    expect(provenance?.textContent).toBe(`suggested · ${HOSTILE}`);
    expectWraps(provenance);
  });

  it("the panel's h2 title and its id/ref line both wrap", () => {
    render(<Board model={HOSTILE_MODEL} />);
    openHostilePanel();
    const heading = container.querySelector("h2");
    expect(heading?.textContent).toBe(HOSTILE);
    expectWraps(heading);
    // The id case is short by nature; the SAME line prints a file path
    // for an id-less ghost, which is the case that needed the fix.
    expect(q('[data-testid="detail-ref"]')?.textContent).toBe("T-300");

    press(q('[data-testid="ghost-card"] button') as Element);
    expect(panel()?.getAttribute("data-ref-kind")).toBe("file");
    const ref = q('[data-testid="detail-ref"]');
    expect(ref?.textContent).toBe("docs/tasks/T-302-ghost.md");
    expectWraps(ref);
    // …and the panel's own suggested_by row, the ghost line's twin.
    expect(q('[data-testid="detail-suggested-by"]')?.textContent).toContain(HOSTILE);
    expectWraps(q('[data-testid="detail-suggested-by"]'));
  });

  it("both blocker chips, the touches slugs, the stamps and the file footer wrap", () => {
    render(<Board model={HOSTILE_MODEL} />);
    openHostilePanel();

    // The resolved chip is bounded by the parser (see the fixture note):
    // its treatment is unconditional so the class cannot be lost, but
    // the run it must survive lands on its sibling below.
    const resolved = q('[data-testid="blocker-link"]');
    expect(resolved?.getAttribute("data-blocker-id")).toBe("T-301");
    expectWraps(resolved);

    const unresolved = q('[data-testid="blocker-unresolved"]');
    expect(unresolved?.getAttribute("data-blocker-id")).toBe(HOSTILE_DANGLING);
    expect(unresolved?.textContent).toBe(HOSTILE_DANGLING);
    expectWraps(unresolved);

    const touches = [...container.querySelectorAll('[data-testid="detail-touch"]')];
    expect(touches.map((t) => t.textContent)).toEqual([
      HOSTILE,
      "<img src=x onerror=alert(1)>",
    ]);
    for (const touch of touches) expectWraps(touch);

    for (const testid of ["stamp-built-by", "stamp-verified-by"]) {
      const stamp = q(`[data-testid="${testid}"]`);
      expect(stamp?.textContent).toBe(HOSTILE);
      expectWraps(stamp);
    }

    const footer = q('[data-testid="detail-file"]');
    expect(footer?.textContent).toBe(HOSTILE_PATH);
    expectWraps(footer);
  });

  it("hostile field content reaches the DOM as text nodes only", () => {
    render(<Board model={HOSTILE_MODEL} />);
    openHostilePanel();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    // The literal bytes are visible as text — escaped, not swallowed.
    expect(panel()?.textContent).toContain("<img src=x onerror=alert(1)>");
    const slug = [...container.querySelectorAll('[data-testid="detail-touch"]')][1];
    expect(slug?.children.length).toBe(0); // one text node, no elements
  });
});

describe("verdict blocks contain an unbroken run like the notes body (T-017-s2)", () => {
  it("the REJECTED repro's text container scrolls in place instead of widening the panel", () => {
    render(<Board model={HOSTILE_MODEL} />);
    openHostilePanel();

    const block = q('[data-verdict-kind="rejected"]');
    expect(block).not.toBeNull();
    const text = q('[data-testid="detail-verdict-text"]') as HTMLElement;
    // Positive control: the whole 2k run really is inside this block.
    expect(text.textContent).toContain("R".repeat(2_000));
    // The containment the notes body has had since T-017 — same three
    // classes, so the two file-derived surfaces answer the same way.
    expect(text.classList.contains("overflow-x-auto")).toBe(true);
    expect(text.classList.contains("whitespace-pre-wrap")).toBe(true);
    expect(text.classList.contains("font-mono")).toBe(true);
    // SCROLL, not BREAK: a verbatim quotation must not be re-flowed.
    expect(text.classList.contains("break-words")).toBe(false);
  });

  // THE OTHER HALF OF THE PARITY CLAIM IS DELIBERATELY NOT A SECOND BODY
  // HERE. A pin that the notes container still carries `overflow-x-auto`
  // reds under exactly one mutation, and the T-005-s2 disclosure body
  // three describes up — "renders collapsed by default; expanding shows
  // the notes VERBATIM in a mono scroll container" — already asserts that
  // exact class on that exact element. Writing it again is shape six
  // (CONVENTIONS' POISON DRILL bullet): a body that reds under a poison
  // while killing no mutant another body does not already kill. Measured
  // rather than assumed — this lane's drill ran the duplicate and it and
  // the T-005-s2 body redded together on the same mutant and on nothing
  // else. The claim above is "verdicts get what the notes body has"; the
  // notes body's own pin is what holds the other end.
});

describe("the model badge is bounded (T-024-s6)", () => {
  // The stamp is LIVE: it is `built_by` in docs/tasks/T-024-genesis-lens.md,
  // this project's first cross-model build. The PARSE half of the finding
  // is T-030's and is pinned in lib/parser/test/model-session.test.ts;
  // what is pinned here is the DISPLAY half — the chip that had no bound
  // of any kind behind it.
  const COMPOUND =
    "claude-fable-5 @fresh (WIP through ad2716f) + claude-opus-5 @fresh ×2 (completion + rejection-fix sessions)";
  /** No `@` anywhere, so the parser's representative is the whole string:
   * the case the bound actually earns its keep on. */
  const UNSPLITTABLE = "M".repeat(200);

  const badgeModel = parseProjectFromFiles([
    { path: "docs/ROADMAP.md", content: ROADMAP },
    {
      path: "docs/tasks/T-310.md",
      content: task("T-310", [["status", "done"], ["priority", 1], ["built_by", COMPOUND]]),
    },
    {
      path: "docs/tasks/T-311.md",
      content: task("T-311", [["status", "done"], ["priority", 2], ["built_by", UNSPLITTABLE]]),
    },
  ]);

  const badgeFor = (id: string): HTMLElement => {
    const found = q(`[data-testid="task-card"][data-task-id="${id}"] [data-testid="model-badge"]`);
    if (found === null) throw new Error(`no badge on ${id}`);
    return found as HTMLElement;
  };

  it("a live compound stamp shows the parser's representative model and keeps the whole stamp on hover", () => {
    render(<Board model={badgeModel} />);
    const badge = badgeFor("T-310");
    // T-030's fix is the load-bearing half and it is working: the badge
    // reads the LAST token of the model side, not the 59-char prefix.
    expect(badge.textContent).toBe("opus");
    // Nothing is lost — the raw stamp rides the hover title…
    expect(badge.getAttribute("title")).toBe(COMPOUND);
    // …and the panel's provenance row prints it verbatim.
    press(q('[data-testid="task-card"][data-task-id="T-310"] button') as Element);
    expect(q('[data-testid="stamp-built-by"]')?.textContent).toBe(COMPOUND);
  });

  it("a stamp the split cannot help still cannot widen the card", () => {
    render(<Board model={badgeModel} />);
    const badge = badgeFor("T-311");
    // Positive control: the long name really did reach the chip — this
    // is a bound doing its job, not a fixture that failed to render.
    expect(badge.textContent).toBe(UNSPLITTABLE);
    // All three are load-bearing: `truncate` alone cannot shrink a flex
    // item whose automatic minimum is its content, and `max-w-24` alone
    // loses to that same minimum (min beats max).
    expect(badge.classList.contains("truncate")).toBe(true);
    expect(badge.classList.contains("max-w-24")).toBe(true);
    expect(badge.classList.contains("min-w-0")).toBe(true);
  });
});

describe("soft issues reach the affected card (T-019-s1)", () => {
  // The gap T-019 left: a flagged record still renders, so a task whose
  // blocked_by dangles looked identical to a clean one and the only
  // surface that moved was a number in the header. These are the same
  // facts one level closer to where the eye already is.
  const ISSUE_MODEL = parseProjectFromFiles([
    { path: "docs/ROADMAP.md", content: ROADMAP },
    {
      path: "docs/tasks/T-320.md",
      content: task("T-320", [["priority", 1], ["blocked_by", "[T-999, T-01]"]]),
    },
    {
      path: "docs/tasks/T-321.md",
      content: task("T-321", [["priority", 2], ["feature", "F-99"]]),
    },
    { path: "docs/tasks/T-322.md", content: task("T-322", [["priority", 3]]) },
  ]);

  const markOn = (id: string): Element | null =>
    q(`[data-testid="task-card"][data-task-id="${id}"] [data-testid="card-issue-mark"]`);

  it("the flagged card wears a mark carrying its own messages; the clean card beside it wears none", () => {
    render(<Board model={ISSUE_MODEL} />);
    // Two dangling blocked_by entries on one file = two messages.
    const flagged = markOn("T-320");
    expect(flagged?.getAttribute("data-issue-count")).toBe("2");
    expect(flagged?.getAttribute("title")).toContain("T-999");
    expect(flagged?.getAttribute("title")).toContain("T-01");
    // The off-backbone feature is a different KIND on a different file
    // and lands on ITS card, not on the first one.
    const offBackbone = markOn("T-321");
    expect(offBackbone?.getAttribute("data-issue-count")).toBe("1");
    expect(offBackbone?.getAttribute("title")).toContain("F-99");
    // The discriminating half: same board, same render, no mark.
    expect(markOn("T-322")).toBeNull();
  });

  it("the panel lists the parser's own sentences VERBATIM, and a clean card grows no section", () => {
    render(<Board model={ISSUE_MODEL} />);
    press(q('[data-testid="task-card"][data-task-id="T-320"] button') as Element);
    const rows = [...container.querySelectorAll('[data-testid="detail-issue"]')];
    expect(rows.map((r) => r.textContent)).toEqual(
      ISSUE_MODEL.issues
        .filter((i) => "file" in i && i.file === "docs/tasks/T-320.md")
        .map((i) => i.message),
    );
    // Verbatim means verbatim: the parser's whole sentence, not a
    // summary, and the containment the rest of this panel wears.
    expect(rows[0]?.textContent).toBe(
      "docs/tasks/T-320.md: blocked_by names 'T-999' but no task in the model declares it (reference preserved on the record)",
    );
    expectWraps(rows[0] ?? null);

    press(q('[data-testid="task-card"][data-task-id="T-322"] button') as Element);
    expect(panel()?.getAttribute("data-task-ref")).toBe("T-322");
    expect(q('[data-testid="detail-issues"]')).toBeNull();
  });

  it("the mark rides the id row, so density and the below-slice variant cannot drop it", () => {
    // The meta row is conditional and sheds the model badge past 40
    // cards; a disclosure that disappears when the board gets busy is
    // not a disclosure. Below-slice cards have no meta row at all.
    const belowSlice = parseProjectFromFiles([
      { path: "docs/ROADMAP.md", content: ROADMAP },
      {
        path: "docs/tasks/T-330.md",
        content: task("T-330", [["milestone", 2], ["blocked_by", "[T-999]"]]),
      },
      { path: "docs/tasks/T-331.md", content: task("T-331", [["milestone", 1]]) },
    ]);
    render(<Board model={belowSlice} />);
    const card = q('[data-testid="task-card"][data-task-id="T-330"]');
    expect(card?.getAttribute("data-below-slice")).toBe("true");
    expect(card?.querySelector('[data-testid="card-issue-mark"]')).not.toBeNull();
    // Positive control in the same body: the mark is not simply painted
    // on every card of this fixture.
    expect(markOn("T-331")).toBeNull();
  });

  it("the header's aggregate count is UNCHANGED — the card join adds a surface, never a filter", async () => {
    render(<App />);
    await act(async () => {});
    const harness = window.__nputerDocsHarness;
    if (harness === undefined) throw new Error("dev harness missing");
    const files = [
      { path: "docs/ROADMAP.md", content: ROADMAP },
      { path: "docs/tasks/T-320.md", content: task("T-320", [["priority", 1], ["blocked_by", "[T-999, T-01]"]]) },
      { path: "docs/tasks/T-321.md", content: task("T-321", [["priority", 2], ["feature", "F-99"]]) },
      { path: "docs/tasks/T-322.md", content: task("T-322", [["priority", 3]]) },
    ];
    // A seq ABOVE the one the exemption test above applied: the store
    // is a module singleton across this file and drops a snapshot that
    // is not newer, so seq 1 would silently leave the previous board up.
    act(() => {
      harness.apply({ seq: 42, projectDir: "/proj", generatedAtMs: Date.now(), files });
    });
    expect(q('[data-testid="docs-model"]')?.getAttribute("data-screen")).toBe("board");

    // The board is live and the marks are on it…
    expect(markOn("T-320")).not.toBeNull();
    // …and the header still counts the WHOLE model, including the
    // cross-file kinds this join deliberately does not touch.
    expect(q('[data-testid="model-counts"]')?.textContent).toContain(
      `${ISSUE_MODEL.issues.length} issues`,
    );
    expect(ISSUE_MODEL.issues.length).toBe(3);
  });
});

// ---- the board root's dispatch threading (T-112-s1, closing T-112-s4) ---
//
// **THE MUTANT T-112's DRILL COULD NOT KILL.** Deleting the two lines that
// thread `dispatch` and `brief` out of `Board.tsx` into the drawer left
// `npm test` from app/ GREEN — 49 files, exit 0 — because
// `C-18-board-root.md` declares `Board.tsx` and no `app/test/**` path at
// all, and every other board test file belongs to C-08 or C-09, so
// importing `Board` from one of them would be an undeclared component
// edge (the defect `arch drift` caught at T-169). T-112-s4 carries the
// measurement and reads the cause as a REGISTRY gap.
//
// **THIS FILE IS WHERE THE PIN GOES WITHOUT TOUCHING THE REGISTRY.** It is
// C-05's, it has imported `Board` since T-017, and the C-05 → C-18 edge is
// already declared in `C-05-app.md`'s `depends_on`. So the pin adds no
// import, no edge and no registry line — which is why `T-112-s1` could
// build it from inside `[app-shell, app-dispatch, app-board]` while a
// `[app-board]` lane still cannot. T-112-s4's first criterion — C-18
// declaring a test path of its own, or the registry saying why it does not
// — is UNTOUCHED by this and stays that card's.
//
// **THE PROPS ARE WRITTEN AS STRUCTURAL LITERALS, NEVER IMPORTED.**
// `DispatchReading` lives in `board-model.ts` and `BriefOutcomeView` in
// `task-detail.ts`, both C-17, which C-05 does NOT declare — importing
// either for a type would buy exactly the undeclared edge this section
// exists to avoid. TypeScript checks them against `Board`'s own prop types
// contextually, which is the same guarantee without the edge.
describe("the board root threads the dispatch channel into the drawer (T-112-s1)", () => {
  const DISPATCH_MODEL = parseProjectFromFiles([
    { path: "docs/ROADMAP.md", content: ROADMAP },
    { path: "docs/tasks/T-400.md", content: task("T-400", [["priority", 1]]) },
  ]);

  /** A scanned repository holding no lane — the ordinary quiet state, and
   * the one that leaves T-400 dispatchable.
   *
   * **NO BODY IN THIS SUITE CAN TELL EITHER FIELD FROM ITS OPPOSITE, AND
   * THE ONE THAT LOOKS LOAD-BEARING IS THE DANGEROUS ONE.** Both are
   * required by `DispatchReading` since T-185. `truncated: true`, and a
   * populated `notLanes`, are each fully green — build 0, `npm test` 0,
   * 1113 passed, measured both ways. `truncated` is not inert in the
   * MODEL (`selectDispositions` reads it as `scanIsFloor` and the floor
   * sentence does reach the output); it is unasserted HERE. `false` is
   * right because it names the quiet state this constant is for, never
   * because a body would catch `true`.
   *
   * **THE ASYMMETRY IS IN WHAT HAPPENS WHEN A FIELD GOES MISSING, AND IT
   * RUNS OPPOSITE TO THE ONE ABOVE.** Drop `notLanes` and BOTH gates red
   * — `tsc`, and two bodies below on `.length` of `undefined`. Drop
   * `truncated` and ONLY `tsc` reds: a missing boolean is falsy, so it
   * degrades silently into the `false` branch and the suite stays at
   * 1113. **That is the silent floor T-185 exists to remove, reproduced
   * in miniature inside the fixture that card repairs** — so if a later
   * change ever puts this constant out of `tsc`'s sight, `truncated` is
   * the field that will lie quietly and `notLanes` is the one that will
   * shout.
   *
   * **AND `as const` HERE LEANS ON A `readonly` IT DOES NOT NAME.** The
   * assertion gives `notLanes` the type `readonly []`, assignable only
   * because `board-model.ts` declares the field `readonly
   * NotLaneHold[]`. Narrow that to a mutable `NotLaneHold[]` and this
   * literal reds — *"the type `readonly []` is `readonly` and cannot be
   * assigned to the mutable type"* — with nothing here hinting why. */
  const NO_LANES = {
    kind: "joined",
    rows: new Map(),
    notLanes: [],
    truncated: false,
  } as const;

  /** One assembled brief, with a line whose text nothing else in this file
   * produces, so the assertion below proves the brief's VALUE arrived and
   * not merely that some brief did. */
  const ASSEMBLED = {
    kind: "assembled",
    brief: {
      role: "executor",
      roleFile: "method/roles/executor.md",
      taskId: "T-400",
      cardPath: "docs/tasks/T-400.md",
      rows: [
        {
          number: 1,
          carries: "Role",
          assembledFrom: "roles/<role>.md",
          ifAbsent: "the session guesses which seat it is in",
          lines: [
            {
              label: "one line",
              text: "you build exactly one task, then you end",
              provenance: { kind: "tree", source: "method/roles/executor.md" },
            },
          ],
          residual: null,
        },
      ],
      marker: null,
    },
  } as const;

  it("a card opened with both props renders the drawer's copyable brief, and neither prop alone will do", () => {
    render(<Board model={DISPATCH_MODEL} dispatch={NO_LANES} brief={ASSEMBLED} />);
    press(q('[data-testid="task-card"][data-task-id="T-400"] button') as Element);

    // The block exists…
    const block = q('[data-testid="detail-brief"]');
    expect(block, "the drawer's dispatch block did not render").not.toBeNull();
    // …as the COPYABLE arm, which is the arm that needs BOTH props: with
    // `dispatch` threaded and `brief` dropped, `selectBriefPanel` answers
    // `unavailable` instead and this line reds.
    const copyable = q('[data-testid="detail-brief-copyable"]');
    expect(copyable, "the brief prop did not reach selectBriefPanel").not.toBeNull();
    expect(copyable?.getAttribute("data-task-id")).toBe("T-400");
    // The VALUE travelled, not just the shape: this sentence is in the
    // fixture brief and nowhere else in the rendered tree.
    expect(copyable?.textContent).toContain("you build exactly one task, then you end");
    expect(copyable?.textContent).toContain("method/roles/executor.md");
    expect(q('[data-testid="detail-brief-copy"]')).not.toBeNull();
  });

  it("with the props absent the block does not render at all — the state before this card, kept honest", () => {
    // THE POSITIVE CONTROL FOR THE BODY ABOVE, and the behaviour
    // `TaskDetailPanel`'s own header promises: absent means the app has no
    // lane channel, and a section that says nothing on every open is a
    // section nobody reads. Without this half, "the block rendered" is
    // satisfied by a block that renders unconditionally.
    render(<Board model={DISPATCH_MODEL} />);
    press(q('[data-testid="task-card"][data-task-id="T-400"] button') as Element);
    expect(panel(), "the drawer itself must still open").not.toBeNull();
    expect(q('[data-testid="detail-brief"]')).toBeNull();
  });

  it("the dispatch prop alone renders the block, and it is the UNAVAILABLE arm rather than a brief", () => {
    // The third arm, and it is what separates the two threading lines
    // from each other: `dispatch` decides whether the block exists at all
    // and `brief` decides which arm it takes. A pin that only asserted
    // "the block appeared" would survive the `brief` line being deleted.
    render(<Board model={DISPATCH_MODEL} dispatch={NO_LANES} />);
    press(q('[data-testid="task-card"][data-task-id="T-400"] button') as Element);
    expect(q('[data-testid="detail-brief"]')).not.toBeNull();
    expect(q('[data-testid="detail-brief-copyable"]')).toBeNull();
    expect(q('[data-testid="detail-brief-unavailable"]')?.textContent).toContain(
      "the assembler has not answered for this card yet",
    );
  });
});
