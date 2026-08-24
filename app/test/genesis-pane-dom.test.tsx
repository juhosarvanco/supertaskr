// @vitest-environment jsdom
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { act, useSyncExternalStore } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GenesisPane } from "../src/genesis/GenesisPane";
import {
  applySnapshot,
  emptyState,
  type DocsFilePayload,
  type DocsModelState,
  type DocsSnapshotPayload,
} from "../src/lib/docs-model";
import { getShellState, startDocsWatcher, subscribeShell } from "../src/lib/watcher-store";

// T-024 criteria 2–5 in the DOM: the design's right pane rendered from
// the derived model only — header count, north-star card + chips,
// backbone grid (built dark cards / dashed forming + slots), artifact
// rows with written ✓ / writing pulse / assumption badges, the
// banking-map footer — plus the degradation criteria: torn files ride
// the last-good machinery with the established parse-chip family,
// hostile content stays React text nodes, the writing pulse is
// motion-safe-gated (static under prefers-reduced-motion), and updates
// arrive through the existing watcher store (driven here via the same
// dev harness the board/map suites use — no shell wiring shipped).

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

// ---- fixtures ----------------------------------------------------------

// jsdom rewrites import.meta.url to the page origin, so anchor on the
// runner's cwd via a relative path instead (vitest runs from app/ —
// vitest.config.ts's home; node resolves relative fs paths against it).
// The map-dogfood-render precedent; genesis-derive.test.ts may use the
// import.meta.url form only because it runs in the node environment.
const FIXTURES = resolve("test/fixtures/genesis");

function walk(dir: string, prefix: string): DocsFilePayload[] {
  const out: DocsFilePayload[] = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, `${prefix}/${name}`));
    else out.push({ path: `${prefix}/${name}`, content: readFileSync(full, "utf8") });
  }
  return out;
}

const fixtureTree = (name: string): DocsFilePayload[] =>
  walk(join(FIXTURES, name, "docs"), "docs");

// Distinct seq range from other suites (vitest isolates files; belt to
// suspenders like watcher-truth's 5000 base).
let nextSeq = 7000;
function payload(
  files: DocsFilePayload[],
  extra: Partial<DocsSnapshotPayload> = {},
): DocsSnapshotPayload {
  nextSeq += 1;
  return { seq: nextSeq, projectDir: "/genesis-dom", generatedAtMs: nextSeq, files, ...extra };
}

function docsState(files: DocsFilePayload[], prev?: DocsModelState): DocsModelState {
  return applySnapshot(prev ?? emptyState(), payload(files));
}

const q = (selector: string): HTMLElement | null =>
  container.querySelector<HTMLElement>(selector);
const qa = (selector: string): HTMLElement[] =>
  [...container.querySelectorAll<HTMLElement>(selector)];

function renderPane(docs: DocsModelState, now?: () => number): void {
  act(() => {
    root.render(<GenesisPane docs={docs} {...(now !== undefined ? { now } : {})} />);
  });
}

const row = (path: string): HTMLElement | null =>
  q(`[data-testid=genesis-artifact][data-path="${path}"]`);

// ---- the design's right pane from the model only -----------------------

describe("the complete tree renders the design's right pane", () => {
  it("header, north star card + chips, backbone, artifact rows, footer", () => {
    renderPane(docsState(fixtureTree("streak")), () => 50_000);

    // Header with the live file count.
    expect(q("[data-testid=genesis-pane]")).not.toBeNull();
    expect(q("[data-testid=genesis-file-count]")?.textContent).toBe(
      "docs/ · 9 files written",
    );

    // North star card: overline, title sentence, the three chips.
    const card = q("[data-testid=genesis-north-star]")!;
    expect(card.textContent).toContain("north star");
    expect(card.textContent).toContain(
      "A habit tracker that lives where its user already is: the terminal.",
    );
    expect(qa("[data-testid=genesis-chip]").map((c) => c.getAttribute("data-kind"))).toEqual([
      "person",
      "success",
      "non-goal",
    ]);
    // Chips carry the design's done-family tokens.
    expect(q("[data-testid=genesis-chip]")?.className).toContain("bg-status-done");

    // Backbone: four built cards + one dashed slot filling the 5-grid.
    const cells = qa("[data-testid=genesis-feature]");
    expect(cells.map((c) => c.getAttribute("data-kind"))).toEqual([
      "built",
      "built",
      "built",
      "built",
      "slot",
    ]);
    expect(cells[0]?.textContent).toContain("F-01");
    expect(cells[0]?.textContent).toContain("Log");
    expect(cells[0]?.className).toContain("bg-column-header");
    expect(cells[4]?.className).toContain("border-dashed");
    expect(cells[4]?.textContent).toContain("F-05");
    expect(cells[4]?.textContent).toContain("—");

    // Artifact rows: all nine written with the ✓ disc.
    const rows = qa("[data-testid=genesis-artifact]");
    expect(rows).toHaveLength(9);
    expect(rows.every((r) => r.getAttribute("data-status") === "written")).toBe(true);
    expect(row("docs/NORTH_STAR.md")?.textContent).toContain("written");
    expect(row("docs/NORTH_STAR.md")?.querySelector("svg circle")).not.toBeNull();

    // Assumption badges where [?] markers live (comment-aware counts).
    const badges = qa("[data-testid=genesis-assumption-badge]");
    expect(badges.map((b) => [b.closest("[data-path]")?.getAttribute("data-path"), b.textContent])).toEqual([
      ["docs/STATE.md", "2 [?]"],
      ["docs/NORTH_STAR.md", "4 [?]"],
      ["docs/CONVENTIONS.md", "1 [?]"],
    ]);

    // Footer: the banking-map line + the tilde-marked approximate stage.
    expect(q("[data-testid=genesis-next]")?.textContent).toBe(
      "Milestone 1 decomposed — the board is live.",
    );
    expect(q("[data-testid=genesis-stage]")?.textContent).toBe("stage ~8 · decomposition");
    expect(q("[data-testid=genesis-pane]")?.getAttribute("data-stage")).toBe("8");

    // No pulse anywhere: nothing is writing on a settled tree.
    expect(qa("[class*=animate-status-pulse]")).toHaveLength(0);
  });

  it("stage-4 tree: expected rows are dashed placeholders, backbone all slots", () => {
    renderPane(docsState(fixtureTree("streak-stage4")), () => 50_000);
    expect(q("[data-testid=genesis-file-count]")?.textContent).toBe(
      "docs/ · 5 files written",
    );
    expect(row("docs/decisions/001-stack.md")?.getAttribute("data-status")).toBe("expected");
    expect(row("docs/decisions/001-stack.md")?.className).toContain("border-dashed");
    expect(row("docs/decisions/001-stack.md")?.textContent).toContain("expected");
    expect(row("docs/tasks/T-*.md")?.getAttribute("data-status")).toBe("expected");
    const cells = qa("[data-testid=genesis-feature]");
    expect(cells).toHaveLength(5);
    expect(cells.every((c) => c.getAttribute("data-kind") === "slot")).toBe(true);
    expect(q("[data-testid=genesis-next]")?.textContent).toBe(
      "Next: stack & why, then the riskiest assumption.",
    );
  });

  it("an empty docs state renders the full scaffold-shaped pane, never blank", () => {
    renderPane(docsState([]), () => 0);
    expect(q("[data-testid=genesis-file-count]")?.textContent).toBe(
      "docs/ · 0 files written",
    );
    expect(qa("[data-testid=genesis-artifact]")).toHaveLength(7);
    expect(
      qa("[data-testid=genesis-artifact]").every(
        (r) => r.getAttribute("data-status") === "expected",
      ),
    ).toBe(true);
    expect(q("[data-testid=genesis-north-star]")?.textContent).toContain("forming…");
    expect(q("[data-testid=genesis-next]")?.textContent).toBe(
      "Next: scaffold, then problem & person.",
    );
    expect(q("[data-testid=genesis-stage]")?.textContent).toBe("stage —");
  });
});

// ---- the writing pulse (motion-safe mechanism, injected clock) ---------

describe("the writing pulse", () => {
  it("a just-changed artifact pulses via the motion-safe mechanism, then settles", () => {
    const first = docsState(fixtureTree("streak"));
    let nowMs = 1_000;
    const clock = (): number => nowMs;
    renderPane(first, clock);
    expect(qa("[class*=animate-status-pulse]")).toHaveLength(0);

    const changed = fixtureTree("streak").map((f) =>
      f.path === "docs/NORTH_STAR.md" ? { ...f, content: `${f.content}\nAnother line.` } : f,
    );
    const second = docsState(changed, first);
    renderPane(second, clock);

    const writing = row("docs/NORTH_STAR.md")!;
    expect(writing.getAttribute("data-status")).toBe("writing");
    expect(writing.textContent).toContain("writing");
    expect(writing.className).toContain("border-status-building-border");
    const dots = qa("[class*=animate-status-pulse]");
    expect(dots).toHaveLength(1); // exactly the one writing dot
    // The pulse is exclusively the motion-safe-prefixed utility (the
    // existing reduced-motion mechanism) on the chart-ramp dot.
    expect(dots[0]?.className).toContain("motion-safe:animate-status-pulse");
    expect(dots[0]?.className).not.toMatch(/(?:^| )animate-status-pulse/);
    expect(dots[0]?.className).toContain("bg-chart-4");

    // Advance the injected clock past the window: a re-render settles the
    // row back to written with no new snapshot.
    nowMs = 10_000;
    renderPane(second, clock);
    expect(row("docs/NORTH_STAR.md")?.getAttribute("data-status")).toBe("written");
    expect(qa("[class*=animate-status-pulse]")).toHaveLength(0);
  });
});

// ---- degradation: torn files, parse chips, hostile content -------------

describe("degradation (criterion 4)", () => {
  it("a torn task file (partial frontmatter) keeps its last-good row and raises the parse chip", () => {
    const first = docsState(fixtureTree("streak"));
    renderPane(first, () => 1_000);
    expect(q("[data-testid=genesis-parse-chip]")).toBeNull();

    const torn = fixtureTree("streak").map((f) =>
      f.path === "docs/tasks/T-001-store-and-done.md"
        ? { ...f, content: "---\nid: T-001\ntitle: Str" } // mid-write: unterminated frontmatter
        : f,
    );
    const second = docsState(torn, first);
    renderPane(second, () => 2_000);

    // The pane neither crashed nor blanked: every row still renders.
    expect(qa("[data-testid=genesis-artifact]")).toHaveLength(9);
    // The torn file's row survives (its effective content is the last
    // good parse, so it reads as writing inside the change window —
    // stale content, honestly presented as in-flux).
    const tornRow = row("docs/tasks/T-001-store-and-done.md")!;
    expect(["writing", "written"]).toContain(tornRow.getAttribute("data-status"));
    // The established chip family reports the failure.
    const chip = q("[data-testid=genesis-parse-chip]")!;
    expect(chip.textContent).toContain("1 parse error");
    expect(chip.textContent).toContain("last valid state");
    expect(chip.className).toContain("bg-status-rejected");
  });

  it("a torn file with no good parse ever still renders a row, chip without last-valid", () => {
    const docs = docsState([
      { path: "docs/tasks/T-900-torn.md", content: "---\nid: T-900\ntitl" },
    ]);
    renderPane(docs, () => 0);
    expect(row("docs/tasks/T-900-torn.md")).not.toBeNull();
    const chip = q("[data-testid=genesis-parse-chip]")!;
    expect(chip.textContent).toContain("1 parse error");
    expect(chip.textContent).not.toContain("last valid state");
  });

  it("collector skips surface in the sibling chip (T-018 family)", () => {
    const docs = applySnapshot(
      emptyState(),
      payload(fixtureTree("streak-stage4"), {
        skipped: [{ path: "docs/huge-transcript.md", reason: "oversize" }],
      }),
    );
    renderPane(docs, () => 0);
    expect(q("[data-testid=genesis-skip-chip]")?.textContent).toContain("1 skipped file");
    expect(q("[data-testid=genesis-skip-chip]")?.getAttribute("title")).toContain("over 1 MiB");
  });

  it("hostile artifact names and headings render as text nodes only", () => {
    const hostileName = "docs/tasks/T-666-<img src=x onerror=alert(1)>.md";
    const docs = docsState([
      {
        path: "docs/NORTH_STAR.md",
        content: `# North star\n\n## Vision\n<img src=x onerror=alert(2)>‮gnp.evil‬ wins. Rest.\n\n## Users\n- <script>alert(3)</script> person.\n`,
      },
      { path: hostileName, content: "---\nid: T-666\ntitle: Hostile\nstatus: planned\n---\n## Acceptance criteria\n- x\n" },
    ]);
    renderPane(docs, () => 0);
    // Nothing injected: no img, no script, anywhere.
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    // The hostile bytes are visible as literal text.
    expect(q("[data-testid=genesis-north-star]")?.textContent).toContain(
      "<img src=x onerror=alert(2)>",
    );
    expect(q("[data-testid=genesis-artifacts]")?.textContent).toContain(
      "T-666-<img src=x onerror=alert(1)>.md",
    );
    expect(qa("[data-testid=genesis-chip]")[0]?.textContent).toContain("<script>");
  });

  it("the no-innerHTML gate covers every file in app/src/genesis/", () => {
    // The T-019/T-012 hygiene grep, made standing for this component:
    // the hostile-content probe above proves TODAY's tree escapes, this
    // proves no future edit reaches for a raw-HTML sink.
    const scan = (dir: string): string[] => {
      const out: string[] = [];
      for (const name of readdirSync(dir).sort()) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) out.push(...scan(full));
        else out.push(full);
      }
      return out;
    };
    const files = scan(resolve("src/genesis"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, `${file} must not reach for a raw-HTML sink`).not.toMatch(
        /innerHTML|dangerouslySetInnerHTML|insertAdjacentHTML|document\.write/,
      );
    }
  });
});

// ---- criterion 3: updates ride the existing watcher pipeline -----------

describe("updates ride the existing store (no polling, no new IPC)", () => {
  it("harness-applied snapshots flow store → pane exactly like board/map", async () => {
    // The same dev-harness pattern the board/map suites use: the REAL
    // watcher-store applies payloads; the pane subscribes like any pane
    // T-026 will mount. No shell wiring ships — this wrapper is the
    // test-side mount point. The other suites reach the harness by
    // rendering <App />, whose effect starts the pipeline; the pane is
    // standalone (App.tsx is T-026's to touch), so the store's own
    // public entry point starts it instead — the same code path, minus
    // the shell.
    function LiveGenesis() {
      const shell = useSyncExternalStore(subscribeShell, getShellState);
      return <GenesisPane docs={shell.docs} now={() => 0} />;
    }
    await act(async () => {
      await startDocsWatcher();
      root.render(<LiveGenesis />);
    });
    const harness = window.__nputerDocsHarness;
    expect(harness).toBeDefined();

    act(() => {
      harness?.apply(payload(fixtureTree("streak-stage4")));
    });
    expect(q("[data-testid=genesis-file-count]")?.textContent).toBe(
      "docs/ · 5 files written",
    );
    expect(q("[data-testid=genesis-pane]")?.getAttribute("data-stage")).toBe("4");

    // The next write lands (001-stack.md appears): the pane advances with
    // no polling — one push, one re-render.
    act(() => {
      harness?.apply(
        payload([
          ...fixtureTree("streak-stage4"),
          { path: "docs/decisions/001-stack.md", content: "# ADR-001: Rust\n\nDecision.\n" },
        ]),
      );
    });
    expect(q("[data-testid=genesis-file-count]")?.textContent).toBe(
      "docs/ · 6 files written",
    );
    expect(row("docs/decisions/001-stack.md")?.getAttribute("data-status")).not.toBe("expected");
    expect(q("[data-testid=genesis-pane]")?.getAttribute("data-stage")).toBe("5");
  });
});

// ---- T-031 (T-024-s4): the pane's one unbounded text surface -----------

describe("the north-star title contains a mid-write vision", () => {
  // Every other text surface here is bounded — chips clip at CHIP_CLIP on
  // a word boundary, artifact rows and backbone names carry `truncate`.
  // This one is not, and `firstSentence` returns the WHOLE collapsed blob
  // when the vision holds no `.`, `!` or `?` — which a NORTH_STAR.md
  // caught mid-write routinely does, since the terminator arrives after
  // the prose. Rendering that state live is what this pane is FOR.
  const UNBROKEN = "V".repeat(10_000);

  const visionState = (vision: string): DocsModelState =>
    docsState([
      {
        path: "docs/NORTH_STAR.md",
        content: `# North star\n\n## Vision\n${vision}\n`,
      },
    ]);

  it("an unterminated 10k-char vision renders WHOLE, wrapped, with nothing clipped", () => {
    renderPane(visionState(UNBROKEN), () => 0);
    const title = q("[data-testid=genesis-north-star-title]");
    // Positive control first: firstSentence really did hand the whole
    // blob through, so this is containment and not an empty fixture.
    expect(title?.textContent).toBe(UNBROKEN);
    expect(title?.children.length).toBe(0); // one text node

    // T-017's treatment, not a third policy.
    expect(title?.classList.contains("break-words")).toBe(true);
    expect(title?.classList.contains("min-w-0")).toBe(true);
    // …and DELIBERATELY not clipped: the design's hero line is one
    // sentence, and a clipped hero reads worse than a wrapped one.
    for (const clamp of ["truncate", "text-ellipsis", "overflow-hidden", "whitespace-nowrap"]) {
      expect(title?.classList.contains(clamp)).toBe(false);
    }
    // The flex ancestor the utility needs to actually constrain.
    expect(q("[data-testid=genesis-north-star]")?.classList.contains("min-w-0")).toBe(true);
  });

  it("an ordinary terminated vision wears the same containment (the utility is unconditional)", () => {
    renderPane(visionState("A habit tracker that lives in the terminal. More prose."), () => 0);
    const title = q("[data-testid=genesis-north-star-title]");
    expect(title?.textContent).toBe("A habit tracker that lives in the terminal.");
    expect(title?.classList.contains("break-words")).toBe(true);
  });

  it("the surfaces that ARE bounded stay bounded — this changes one of them, not all", () => {
    // The discriminating half: `truncate` is still the answer for the
    // backbone names and artifact rows, so this is a targeted exception
    // rather than a policy change across the pane.
    renderPane(docsState(fixtureTree("streak")), () => 50_000);
    const built = qa("[data-testid=genesis-feature]")[0];
    expect(built?.querySelector(".truncate")).not.toBeNull();
  });
});
