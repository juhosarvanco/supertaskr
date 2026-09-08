// @vitest-environment jsdom
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GenesisScreen } from "../src/components/shell/GenesisScreen";
import {
  applySnapshot,
  emptyState,
  type DocsFilePayload,
  type DocsModelState,
  type DocsSnapshotPayload,
} from "../src/lib/docs-model";

/**
 * T-037 — the join the first slice owed: T-024's lens (C-13) mounted in
 * T-026's marked slot. Both halves shipped tested and neither imported
 * the other, so the pane's code was absent from the shipped JS entirely.
 * This file proves the mount four ways, all headless:
 *
 *   1. the pane renders INSIDE the slot, fed the screen's own `docs`
 *      prop — the watched DocsModelState the placeholder line used to
 *      read — with no new IPC and no polling introduced at the seam;
 *   4. with docs present the pane's OWN content renders (north-star
 *      card, backbone grid, artifact rows) and the placeholder line is
 *      gone; with docs empty its empty state renders, never blank;
 *   5. a throw from inside the REAL pane (no module mocking: a docs
 *      state whose `effective` map explodes on touch) is caught, the
 *      screen survives, and the next snapshot retries;
 *   2. the built bundle carries the pane's own strings — the exact
 *      inverse of the measurement taken at T-026's merge.
 *
 * The end-to-end half of criterion 1 (the pane advancing through the
 * REAL watcher, real store, real parser, real App) lives in
 * genesis-entry.test.tsx steps 4–6, which T-037 redirected onto the
 * pane's own header count.
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
  opened = [];
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

// ---- fixtures (T-024's landed trees; no new ones authored here) --------

// jsdom rewrites import.meta.url to the page origin — anchor on the
// runner's cwd instead, exactly as genesis-pane-dom.test.tsx does.
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

/**
 * T-028 RECONCILE — WHY MOST OF THIS FILE NOW READS `midInterview()`.
 *
 * T-028 makes the right half switch from T-024's lens to the REAL board
 * the moment task files parse, so the streak tree — a FINISHED plan with
 * three task files in it — no longer renders the lens at all. That is the
 * task, not a regression, so the lens's assertions move to the tree they
 * were always really about: the same harvested tree ONE TURN BEFORE
 * decomposition, which is the state a mid-interview genesis is actually
 * in when the lens is on screen.
 *
 * NOTHING IS LOOSENED and nothing is dropped. Every assertion below is
 * the same assertion with its numbers re-derived from the smaller tree
 * (9 files → 6, 9 artifact rows → 7, stage ~8 → ~7), and the full streak
 * tree keeps its own coverage in the T-028 block at the bottom of this
 * file, where it now proves the SWITCH. The subtraction is mechanical —
 * `docs/tasks/` and nothing else — and it is checked rather than assumed:
 * a fixture that stops carrying exactly three task files fails loudly
 * here instead of silently changing what these tests mean.
 */
function midInterview(): DocsFilePayload[] {
  const all = fixtureTree("streak");
  const kept = all.filter((f) => !f.path.startsWith("docs/tasks/"));
  if (all.length - kept.length !== 3) {
    throw new Error(
      `expected exactly 3 files under docs/tasks/ in the streak fixture, found ` +
        `${all.length - kept.length} — the fixture moved; reconcile these ` +
        "numbers rather than loosening them.",
    );
  }
  return kept;
}

// Distinct seq range from the other suites (vitest isolates files; belt
// to suspenders, like genesis-pane-dom's 7000 base).
let nextSeq = 9000;
function payload(files: DocsFilePayload[]): DocsSnapshotPayload {
  nextSeq += 1;
  return { seq: nextSeq, projectDir: "/genesis-mount", generatedAtMs: nextSeq, files };
}

function docsState(files: DocsFilePayload[], prev?: DocsModelState): DocsModelState {
  return applySnapshot(prev ?? emptyState(), payload(files));
}

const q = (selector: string): HTMLElement | null => container.querySelector<HTMLElement>(selector);
const qa = (selector: string): HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>(selector),
];

/** Every CTA press this file records, in order. T-028's handoff is a
 * plain function the shell owns; the screen only passes it through, so
 * what a test can prove here is that it reaches the button and nothing
 * else fires it. */
let opened: number[] = [];

function renderScreen(docs: DocsModelState): void {
  act(() => {
    root.render(
      <GenesisScreen
        projectDir="/tmp/sketchpad"
        docs={docs}
        onOpenBoard={() => opened.push(docs.seq)}
      />,
    );
  });
}

const row = (path: string): HTMLElement | null =>
  q(`[data-testid=genesis-artifact][data-path="${path}"]`);

// ---- criterion 1: the lens is in the slot, on the screen's own state ---

describe("the lens is mounted in the screen's marked slot (criterion 1)", () => {
  it("the pane renders inside genesis-pane-slot, and the placeholder line is gone", () => {
    renderScreen(docsState(midInterview()));

    const slot = q("[data-testid=genesis-pane-slot]");
    expect(slot).not.toBeNull();
    // Not merely "somewhere on the screen" — inside the marked region.
    expect(slot?.querySelector("[data-testid=genesis-pane]")).not.toBeNull();
    // T-026's honest one-line placeholder has been replaced, not joined.
    expect(q("[data-testid=genesis-docs-count]")).toBeNull();
    // The screen's own chrome is untouched around it.
    expect(q("[data-testid=genesis-screen]")).not.toBeNull();
    // T-027 RECONCILE — the chrome around the slot is now the CHAT, and
    // the project's name moved to the app's own header.
    //
    // What this line used to assert is that the screen did not consist
    // of nothing but the pane. T-026's `<h2>Starting a plan in <dir></h2>`
    // was the only other thing on the screen, so the dir was the way to
    // say it; the design's split has no such heading (and its chrome bar
    // reads "supertaskr — new project", which is a WINDOW title this app
    // deliberately does not set). The claim keeps its strength and gains
    // reach: the left half of the split is here, beside the slot, which
    // is more than a heading ever proved.
    //
    // THE DROPPED ASSERTION'S NEW HOME, named rather than lost:
    // `genesis-entry.test.tsx` renders the REAL App and already asserts
    // `genesis-project-dir` reads the genesis dir at two points in the
    // entry flow. Those two lines needed NO edit — the testid moved to
    // App.tsx's header and they kept passing — so the property is now
    // asserted through the whole shell instead of through one screen
    // rendered alone.
    expect(q("[data-testid=interview-chat]")).not.toBeNull();
    expect(q("[data-testid=genesis-project-dir]"), "the dir is the header's now").toBeNull();
  });

  it("the pane reads the same watched state the screen was handed", () => {
    const docs = docsState(midInterview());
    renderScreen(docs);
    // The screen's own attribute and the pane's own header agree, and
    // both agree with the DocsModelState the shell passed in.
    // T-028 RECONCILE: 9 → 6, the three task files subtracted (see
    // `midInterview`). The claim — screen attribute, pane header and the
    // handed-in state all agreeing — is untouched.
    expect(docs.fileCount).toBe(6);
    expect(q("[data-testid=genesis-screen]")?.getAttribute("data-genesis-files")).toBe("6");
    expect(q("[data-testid=genesis-file-count]")?.textContent).toBe("docs/ · 6 files written");

    // A new snapshot on the same prop path moves the pane — the seam
    // carries updates, it does not snapshot once at mount.
    renderScreen(docsState(fixtureTree("streak-stage4")));
    expect(q("[data-testid=genesis-file-count]")?.textContent).toBe("docs/ · 5 files written");
  });

  it("the seam adds no IPC, no polling and no new dependency", () => {
    // Mechanical, and cheap to keep: the mount is one import plus one
    // element. Anything that fetches, listens, or ticks at this seam
    // would be new machinery the criterion forbids.
    const source = readFileSync(resolve("src/components/shell/GenesisScreen.tsx"), "utf8");
    expect(source).toMatch(/import \{ GenesisPane \} from "@\/genesis\/GenesisPane";/);
    expect(source).toMatch(/<GenesisPane docs=\{docs\} \/>/);
    for (const forbidden of [
      "invoke",
      "listen(",
      "fetch(",
      "setInterval",
      "setTimeout",
      "XMLHttpRequest",
      "WebSocket",
      "localStorage",
      "innerHTML",
      "dangerouslySetInnerHTML",
    ]) {
      expect(source, `the genesis seam must not reach for ${forbidden}`).not.toContain(forbidden);
    }
  });
});

// ---- criterion 4: the pane's own content, and its empty state ----------

describe("the pane's own content renders through the screen (criterion 4)", () => {
  it("docs present: north-star card, backbone grid and artifact rows, not a placeholder", () => {
    renderScreen(docsState(midInterview()));

    // North-star card with its parsed title sentence and chips.
    const card = q("[data-testid=genesis-north-star]")!;
    expect(card.textContent).toContain(
      "A habit tracker that lives where its user already is: the terminal.",
    );
    expect(qa("[data-testid=genesis-chip]").map((c) => c.getAttribute("data-kind"))).toEqual([
      "person",
      "success",
      "non-goal",
    ]);

    // Backbone grid: the ROADMAP's four features as built cards, then a
    // dashed slot filling the five-across design grid.
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

    // Artifact rows, with the ✓ disc on the written ones.
    //
    // T-028 RECONCILE: 9 rows → 7, and the "every row is written" line
    // becomes a per-row list. Both moves come from the same subtraction:
    // three written task rows leave, and the banking map's `docs/tasks/
    // T-*.md` PLACEHOLDER row takes their place — which is the honest
    // shape of a tree one turn before decomposition, and a strictly more
    // specific assertion than the boolean it replaces.
    const rows = qa("[data-testid=genesis-artifact]");
    expect(rows.map((r) => [r.getAttribute("data-path"), r.getAttribute("data-status")])).toEqual([
      ["docs/STATE.md", "written"],
      ["docs/NORTH_STAR.md", "written"],
      ["docs/decisions/001-stack.md", "written"],
      ["docs/CONVENTIONS.md", "written"],
      ["docs/ROADMAP.md", "written"],
      ["docs/tasks/T-*.md", "expected"],
      ["docs/ARCHITECTURE.md", "written"],
    ]);
    expect(row("docs/NORTH_STAR.md")?.querySelector("svg circle")).not.toBeNull();

    // And the footer the banking map drives. T-028 RECONCILE: stage ~8 →
    // ~7, because decomposition has not happened on this tree — and the
    // next line is now the design's own crescendo sentence, which is a
    // pleasing coincidence rather than a new assertion.
    expect(q("[data-testid=genesis-next]")?.textContent).toBe(
      "Next: decomposition — cards rain into the board.",
    );
    expect(q("[data-testid=genesis-stage]")?.textContent).toBe("stage ~7 · first slice");
  });

  it("a mid-interview tree renders its expected rows as placeholders, not as absence", () => {
    renderScreen(docsState(fixtureTree("streak-stage4")));
    expect(q("[data-testid=genesis-file-count]")?.textContent).toBe("docs/ · 5 files written");
    expect(row("docs/decisions/001-stack.md")?.getAttribute("data-status")).toBe("expected");
    expect(qa("[data-testid=genesis-feature]").every((c) => c.getAttribute("data-kind") === "slot")).toBe(
      true,
    );
  });

  it("docs empty: the pane's empty state renders — no crash, and never blank", () => {
    renderScreen(docsState([]));
    const slot = q("[data-testid=genesis-pane-slot]")!;
    expect(slot.querySelector("[data-testid=genesis-pane]")).not.toBeNull();
    expect(q("[data-testid=genesis-file-count]")?.textContent).toBe("docs/ · 0 files written");
    // The scaffold is the invitation: seven expected rows, a forming
    // north star, no stage yet — a shape, not an empty box.
    expect(qa("[data-testid=genesis-artifact]")).toHaveLength(7);
    expect(q("[data-testid=genesis-north-star]")?.textContent).toContain("forming…");
    expect(q("[data-testid=genesis-stage]")?.textContent).toBe("stage —");
    expect((slot.textContent ?? "").trim().length).toBeGreaterThan(0);
    // The failure fallback is NOT what an empty tree gets.
    expect(q("[data-testid=genesis-pane-failed]")).toBeNull();
  });
});

// ---- criterion 5: a throw inside the REAL pane, no module mocking ------

describe("a throwing pane cannot take the screen down (criterion 5)", () => {
  /** A DocsModelState whose `effective` map explodes on any touch. The
   * pane reads it first thing (observeDocsChange → deriveGenesis), so the
   * REAL pane throws during render — no module mock, no injected stub. */
  function hostileState(from: DocsModelState): DocsModelState {
    const boom = new Proxy(new Map<string, string>(), {
      get() {
        throw new Error("T-037 PROBE: the pane threw while rendering");
      },
    });
    return { ...from, effective: boom as ReadonlyMap<string, string> };
  }

  it("the screen survives with an honest fallback, and the next snapshot retries", () => {
    // React reports a caught error through console.error; silence it and
    // assert the boundary's own log line at the same time.
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    const good = docsState(midInterview());
    renderScreen(good);
    expect(q("[data-testid=genesis-pane]")).not.toBeNull();

    // The pane throws on the next snapshot.
    renderScreen(hostileState(docsState(midInterview(), good)));

    // The app is still standing: the screen, the OTHER HALF OF THE SPLIT
    // and the slot all render — only the pane's subtree was replaced.
    //
    // T-027 RECONCILE, and this one is STRICTLY STRONGER than the line
    // it replaces. The heading it used to check was a sibling of the
    // slot with nothing in it; the chat is a live component with its own
    // subscription, its own state and its own input. Asserting IT
    // survives the pane's throw is the real claim — the blast radius of
    // a crash in the right half is the right half — and it is a claim
    // the old assertion could not make because the conversation did not
    // exist yet. (The project dir's own home is the app header; see the
    // note in criterion 1's test above.)
    expect(q("[data-testid=genesis-screen]")).not.toBeNull();
    expect(q("[data-testid=interview-chat]"), "the conversation is untouched").not.toBeNull();
    expect(q("[data-testid=interview-input]"), "and still answerable").not.toBeNull();
    expect(q("[data-testid=genesis-pane-slot]")).not.toBeNull();
    expect(q("[data-testid=genesis-pane]")).toBeNull();

    // What the user sees instead: a line that says the view broke and
    // says plainly that nothing was written or lost (the screen reads).
    const failed = q("[data-testid=genesis-pane-failed]")!;
    expect(failed.textContent).toContain("the view of docs/ stopped rendering");
    expect(failed.textContent).toContain("Nothing was written and nothing was lost");
    expect(logged).toHaveBeenCalledWith(
      "[supertaskr] the genesis pane failed to render",
      expect.anything(),
    );

    // And it does not latch: the next snapshot the watcher delivers gets
    // a fresh attempt, so one torn moment cannot brick the interview.
    renderScreen(docsState(fixtureTree("streak-stage4")));
    expect(q("[data-testid=genesis-pane-failed]")).toBeNull();
    expect(q("[data-testid=genesis-file-count]")?.textContent).toBe("docs/ · 5 files written");
  });

  it("the guard is inert on the healthy path", () => {
    renderScreen(docsState(midInterview()));
    expect(q("[data-testid=genesis-pane-failed]")).toBeNull();
    expect(q("[data-testid=genesis-file-count]")?.textContent).toBe("docs/ · 6 files written");
  });

  /**
   * T-028 — THE DEFECT THIS PROBE FOUND, kept where it was found.
   *
   * T-028 makes the screen CHOOSE a renderer, and that choice reads the
   * docs tree from the screen's own render body — which is OUTSIDE the
   * boundary below. A tree hostile enough to throw on `effective` would
   * therefore have thrown one level too high and taken the whole React
   * tree with it, interview included: the exact failure the boundary
   * exists to prevent, reintroduced by the code deciding what to put
   * inside it. Found by running this file's existing Proxy against the
   * new screen, not by reading the diff.
   *
   * The fix degrades to the LENS (`showsBoard` catches), so the boundary
   * gets its usual chance and the fallback renders. What this test adds
   * beyond the one above is the ORDER: the tree that throws here has task
   * files in it, so an unguarded screen would have taken the board route
   * and died before the boundary was ever reached.
   */
  it("a tree that throws while the SCREEN is choosing a renderer is still caught", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const good = docsState(fixtureTree("streak"));
    renderScreen(good);
    // The full streak tree parses three tasks, so the board half is the
    // one on screen — this is the route the hostile state will take.
    expect(q("[data-testid=genesis-board]"), "the board half is up").not.toBeNull();

    renderScreen(hostileState(docsState(fixtureTree("streak"), good)));

    expect(q("[data-testid=genesis-screen]"), "the app is still standing").not.toBeNull();
    expect(q("[data-testid=interview-chat]"), "the conversation is untouched").not.toBeNull();
    expect(q("[data-testid=genesis-pane-failed]")).not.toBeNull();
    expect(q("[data-testid=genesis-board]"), "and the board half stood down").toBeNull();
    expect(logged).toHaveBeenCalled();
  });
});

// ---- criterion 2: the pane is in the SHIPPED bundle --------------------

describe("the built bundle carries the lens (criterion 2)", () => {
  /**
   * The inverse of the measurement taken at T-026's merge, where these
   * exact strings were ABSENT from dist because nothing imported the
   * pane and Rollup dropped it.
   *
   * This reads `app/dist/`, which `npm run build` writes and .gitignore
   * keeps out of the tree — so it is a build-output assertion by design.
   * It FAILS LOUDLY when dist is missing rather than skipping: a probe
   * that quietly passes on an absent build is worse than no probe (this
   * repo has been bitten twice by suites that did not actually run). The
   * house order already builds before testing — CONVENTIONS § Build &
   * test, and ci.yml runs `npm run build` then `npm test`.
   */
  const DIST_ASSETS = resolve("dist/assets");
  /** The files whose relationship this claim is about; a bundle older
   * than any of them is stale evidence, not evidence. */
  const SOURCES = [
    "src/components/shell/GenesisScreen.tsx",
    "src/genesis/GenesisPane.tsx",
    "src/genesis/genesis-derive.ts",
    // T-028: the other half of what this slot can render. A bundle older
    // than the crescendo is stale evidence about the crescendo.
    "src/genesis/BoardCrescendo.tsx",
    "src/genesis/crescendo.ts",
  ];

  function bundles(): string[] {
    let names: string[];
    try {
      names = readdirSync(DIST_ASSETS);
    } catch {
      throw new Error(
        `no build output at ${DIST_ASSETS} — run \`npm run build\` in app/ first. ` +
          "This assertion is about the SHIPPED bundle (T-037 criterion 2) and cannot " +
          "be answered without one; it does not skip.",
      );
    }
    const js = names.filter((n) => n.endsWith(".js")).map((n) => join(DIST_ASSETS, n));
    if (js.length === 0) throw new Error(`no .js assets under ${DIST_ASSETS} — run npm run build`);
    return js;
  }

  it("is not stale: the build is at least as new as the mount and the lens", () => {
    const newestBundle = Math.max(...bundles().map((f) => statSync(f).mtimeMs));
    for (const rel of SOURCES) {
      const source = statSync(resolve(rel)).mtimeMs;
      expect(
        newestBundle,
        `dist/ predates ${rel} — rebuild (npm run build) before trusting the bundle grep`,
      ).toBeGreaterThanOrEqual(source);
    }
  });

  it("carries the pane's own strings, which were absent before the mount", () => {
    const js = bundles()
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");
    // Assert on booleans, never on the 430 KB haystack: a failing
    // toContain against the bundle prints the whole bundle.
    const has = (needle: string): boolean => js.includes(needle);

    // The criterion's two named probes, plus siblings from every region
    // of the pane, so a partial inclusion cannot pass as a whole one.
    for (const probe of [
      "the project, so far",
      "genesis-artifact",
      "genesis-north-star",
      "genesis-backbone",
      "genesis-file-count",
      "genesis-assumption-badge",
      "grows as you answer",
      "plain markdown, in your repo",
    ]) {
      expect(has(probe), `"${probe}" must reach the shipped bundle`).toBe(true);
    }
    // T-028: and the OTHER renderer the slot can carry. Same argument,
    // same failure mode — a crescendo nothing imports would be absent
    // from the shipped JS and this file is where that was caught before.
    for (const probe of [
      "the board, so far",
      "genesis-card-rain",
      "genesis-complete",
      "genesis-open-board",
      "The board is ready.",
      "board-rain",
    ]) {
      expect(has(probe), `"${probe}" must reach the shipped bundle`).toBe(true);
    }
    // The screen's own strings are still there — the mount replaced the
    // placeholder line, not the screen.
    expect(has("genesis-pane-slot"), "the slot survives the mount").toBe(true);
    expect(has("genesis-screen"), "the screen survives the mount").toBe(true);
    // And the placeholder line itself is gone from the shipped JS.
    expect(has("nothing written yet"), "the placeholder line is retired").toBe(false);
  });
});
