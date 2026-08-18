import { expect, test, type Page } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "../preflight";
import type { DocsSnapshotPayload } from "../fixtures/board";
import { ARCHITECTURE_AND_GIT, NOTHING_FOUND, streakMidInterview } from "../fixtures/shell";
import { applyDocs, applyPick, applyStatus, expectPhase, openShell } from "./shell-harness";

/**
 * T-062 — ONE SCROLL MODEL, MEASURED ON EVERY SCREEN, and the assertion
 * that makes the silent failure loud.
 *
 * THE SILENT FAILURE THIS FILE EXISTS FOR. `MapView`'s canvas was
 * `min-h-0 flex-1 overflow-hidden`: a box that can shrink and HIDES what
 * it clips. That cost nothing while the shell was a growing page,
 * because the canvas was never asked to shrink — so bounding the frame
 * would have deleted graph with nothing going red anywhere. Measured
 * under a bound, before the fix, at 800x600: `map-canvas` 446/392 with
 * `overflow-y: hidden`, 54px of graph unreachable, no scrollbar. The app
 * suite could not see it (jsdom has no layout) and this lane had no
 * assertion about the canvas at all. (T-048 recorded 446/320 for the
 * same cell; the pane header has moved since, the mechanism has not.)
 *
 * So the assertion below is deliberately NOT about the map. It is a
 * whole-page sweep: any element that hides content it cannot scroll to
 * reds, on any screen, at any of the three viewports. The canvas was one
 * instance of a class, and pinning the instance would not have caught
 * the next one.
 */

const GENESIS_DIR = "/e2e/streak";

/**
 * The declared window (T-051) plus 800x600 — the size the app opened at
 * when T-048 took the baseline, below today's declared minimum and kept
 * deliberately: it is the geometry every figure in T-048's and T-062's
 * tables is anchored to, and a frame that holds only above its own floor
 * has not been tested at its floor.
 */
const VIEWPORTS = [
  { label: "the declared default", width: 1280, height: 840 },
  { label: "the declared minimum", width: 1024, height: 700 },
  { label: "T-048's 800x600 baseline", width: 800, height: 600 },
] as const;

/**
 * THIS repo's own docs/ tree, graph included — the tallest real board
 * available AND a real architecture graph, which is what makes the
 * canvas measurement mean something. `window-contract.spec.ts` keeps its
 * own `.md`-only walker on purpose: its subject is the board's height,
 * and it wants the map's empty state rather than a real canvas.
 *
 * Reading files is not importing a package (ADR-011 addendum).
 */
function repoDocs(seq: number): DocsSnapshotPayload {
  const walk = (dir: string, prefix: string): { path: string; content: string }[] => {
    const out: { path: string; content: string }[] = [];
    for (const name of readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) out.push(...walk(full, `${prefix}/${name}`));
      else out.push({ path: `${prefix}/${name}`, content: readFileSync(full, "utf8") });
    }
    return out;
  };
  const files = walk(path.join(repoRoot, "docs"), "docs");
  if (files.length < 50) {
    throw new Error(
      `only ${files.length} files under ${repoRoot}/docs — this spec needs the repo's ` +
        "own tree to be taller than the window or its board assertions prove nothing; " +
        "it does not skip.",
    );
  }
  return { seq, projectDir: repoRoot, generatedAtMs: 1_755_400_000_000 + seq, files };
}

/** The same real board plus parser failures supplied through the docs
 * harness. Each malformed file lacks frontmatter, so the shipped parser
 * owns both the failure count and the diagnostic text; the lane only
 * supplies user-controlled bytes. */
function repoDocsWithErrors(seq: number, count = 60): DocsSnapshotPayload {
  const snapshot = repoDocs(seq);
  return {
    ...snapshot,
    files: [
      ...snapshot.files,
      ...Array.from({ length: count }, (_, index) => ({
        path: `docs/tasks/T-${900 + index}-malformed-diagnostic.md`,
        content: "# no frontmatter",
      })),
    ],
  };
}

/** Every element that HIDES content it cannot scroll to, deduped by name.
 * A count would be coupled to the graph's component count and would red
 * on an unrelated regen; the NAMES are what say whether a new kind of
 * box started swallowing content. */
async function clippers(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const names = new Set<string>();
    for (const el of Array.from(document.querySelectorAll("*"))) {
      const e = el as HTMLElement;
      if (e.scrollHeight <= e.clientHeight + 1) continue;
      const oy = getComputedStyle(e).overflowY;
      if (oy === "hidden" || oy === "clip") {
        names.add(
          e.getAttribute("data-testid") ??
            `${e.tagName.toLowerCase()}.${(e.className || "").toString().split(" ")[0]}`,
        );
      }
    }
    return [...names].sort();
  });
}

/** page scrollHeight against the viewport — T-048's criterion-4 field. */
async function frame(page: Page): Promise<{ page: number; viewport: number }> {
  return page.evaluate(() => ({
    page: document.documentElement.scrollHeight,
    viewport: document.documentElement.clientHeight,
  }));
}

async function frontDoor(page: Page): Promise<void> {
  await openShell(page);
  await applyStatus(page, { kind: "noProject" });
  await expectPhase(page, "noProject", "empty");
}

async function noPlan(page: Page): Promise<void> {
  await openShell(page);
  await applyStatus(page, {
    kind: "noDocs",
    projectDir: "/e2e/sketchpad",
    probe: ARCHITECTURE_AND_GIT,
  });
  await expectPhase(page, "noDocs", "empty");
}

async function board(page: Page, seq = 1): Promise<void> {
  await openShell(page);
  await applyStatus(page, { kind: "open", snapshot: repoDocs(seq) });
  await expectPhase(page, "open", "board");
  await expect(page.getByTestId("task-card").first()).toBeVisible();
}

async function boardWithErrors(page: Page, seq = 20, count = 60): Promise<void> {
  await openShell(page);
  await applyStatus(page, { kind: "open", snapshot: repoDocsWithErrors(seq, count) });
  await expectPhase(page, "open", "board");
  await expect(page.getByTestId("docs-model")).toHaveAttribute(
    "data-failure-count",
    String(count),
  );
  await expect(page.getByTestId("parse-error-details").locator("li")).toHaveCount(count);
}

async function map(page: Page): Promise<void> {
  await board(page, 2);
  await page.getByTestId("pane-rail-map").click();
  await expect(page.getByTestId("map-view")).toBeVisible();
}

async function genesis(page: Page): Promise<void> {
  await openShell(page);
  await applyPick(page, {
    kind: "genesis",
    projectDir: GENESIS_DIR,
    seq: 10,
    probe: NOTHING_FOUND,
  });
  await applyDocs(page, streakMidInterview(11, GENESIS_DIR));
  await expectPhase(page, "genesis", "genesis");
}

const SCREENS = [
  { name: "front door", open: frontDoor },
  { name: "no-plan card", open: noPlan },
  { name: "board", open: board },
  { name: "board with many errors", open: boardWithErrors },
  { name: "map", open: map },
  { name: "genesis", open: genesis },
] as const;

interface ErrorBoardMeasurement {
  viewport: string;
  page: { scrollHeight: number; clientHeight: number; scrollY: number };
  column: { scrollHeight: number; clientHeight: number };
  details: {
    scrollHeight: number;
    clientHeight: number;
    borderBoxHeight: number;
    overflowY: string;
    finalRowReachable: boolean;
  };
  board: { scrollHeight: number; clientHeight: number };
}

async function measureErrorBoard(page: Page, label: string): Promise<ErrorBoardMeasurement> {
  return page.evaluate((viewport) => {
    const main = document.querySelector<HTMLElement>('[data-testid="docs-model"]')!;
    const column = main.querySelector<HTMLElement>(":scope > div")!;
    const details = document.querySelector<HTMLElement>('[data-testid="parse-error-details"]')!;
    const board = document.querySelector<HTMLElement>('[data-testid="board-scroll"]')!;
    details.scrollTop = details.scrollHeight;
    const detailsBox = details.getBoundingClientRect();
    const finalBox = details.lastElementChild!.getBoundingClientRect();
    return {
      viewport,
      page: {
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        scrollY: window.scrollY,
      },
      column: { scrollHeight: column.scrollHeight, clientHeight: column.clientHeight },
      details: {
        scrollHeight: details.scrollHeight,
        clientHeight: details.clientHeight,
        borderBoxHeight: detailsBox.height,
        overflowY: getComputedStyle(details).overflowY,
        finalRowReachable:
          finalBox.top >= detailsBox.top - 1 && finalBox.bottom <= detailsBox.bottom + 1,
      },
      board: { scrollHeight: board.scrollHeight, clientHeight: board.clientHeight },
    };
  }, label);
}

// ---- one scroll model, every screen, every viewport ----------------------

for (const vp of VIEWPORTS) {
  test(`the frame holds on every screen at ${vp.label} (${vp.width}x${vp.height})`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    for (const screen of SCREENS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await screen.open(page);

      const f = await frame(page);
      expect(f.viewport, `${screen.name}: the viewport is the one asked for`).toBe(vp.height);
      // ONE SCROLL MODEL. Before T-062 the board read 4989/840 here and
      // the no-plan card 663/600; the genesis screen alone read 840/840.
      expect(
        f.page,
        `${screen.name}: the page is the window — it never grows and never scrolls`,
      ).toBe(f.viewport);

      // NOTHING HIDES CONTENT IT CANNOT SCROLL TO. The map's node cards
      // clip their own text on purpose and are the ONLY known member of
      // this set (T-048 recorded the same eleven buttons); anything else
      // appearing here is a box that started swallowing content, which
      // is precisely how bounding the frame would have deleted 54px of
      // graph with every suite green.
      expect(
        await clippers(page),
        `${screen.name}: a box is hiding content with no way to scroll to it`,
      ).toEqual(screen.name === "map" ? ["map-node"] : []);
    }
  });
}

test("the error strip owns a ceiling while every diagnostic and the board remain reachable", async ({
  page,
}) => {
  test.setTimeout(120_000);

  // The small state is deliberately measured before the pathological
  // one: `overflow-y-auto` must not manufacture overflow below the cap.
  await page.setViewportSize({ width: 1280, height: 840 });
  await boardWithErrors(page, 30, 1);
  const short = await measureErrorBoard(page, "one error at 1280x840");
  expect(short.details.clientHeight, "one error stays below the 192px ceiling").toBeLessThan(192);
  expect(short.details.scrollHeight, "one error remains at natural height").toBe(
    short.details.clientHeight,
  );

  const measurements: ErrorBoardMeasurement[] = [];
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await boardWithErrors(page, 40 + vp.height);
    measurements.push(await measureErrorBoard(page, `${vp.width}x${vp.height}`));
  }
  console.info("T-066 error-board measurements", JSON.stringify(measurements));

  for (const measurement of measurements) {
    expect(
      measurement.page.scrollHeight,
      `${measurement.viewport}: the document equals the viewport`,
    ).toBe(measurement.page.clientHeight);
    expect(measurement.page.scrollY, `${measurement.viewport}: details never move the page`).toBe(
      0,
    );
    expect(
      measurement.column.scrollHeight,
      `${measurement.viewport}: the bounded column does not overflow`,
    ).toBe(measurement.column.clientHeight);
    expect(
      measurement.details.borderBoxHeight,
      `${measurement.viewport}: max-h-48 caps the border box at its 192px token`,
    ).toBe(192);
    expect(
      measurement.details.clientHeight,
      `${measurement.viewport}: the scrollport stays within the token ceiling`,
    ).toBeLessThanOrEqual(192);
    expect(measurement.details.overflowY, `${measurement.viewport}: details own vertical scroll`).toBe(
      "auto",
    );
    expect(
      measurement.details.scrollHeight,
      `${measurement.viewport}: all sixty rows remain in the details region`,
    ).toBeGreaterThan(measurement.details.clientHeight);
    expect(
      measurement.details.finalRowReachable,
      `${measurement.viewport}: the final diagnostic is fully reachable`,
    ).toBe(true);
    expect(
      measurement.board.clientHeight,
      `${measurement.viewport}: the board keeps the standing region floor`,
    ).toBeGreaterThanOrEqual(250);
    expect(
      measurement.board.scrollHeight,
      `${measurement.viewport}: the normal repository board still scrolls independently`,
    ).toBeGreaterThan(measurement.board.clientHeight * 2);
  }

  const boardScroller = page.getByTestId("board-scroll");
  await boardScroller.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  expect(await page.evaluate(() => window.scrollY), "board scrolling leaves the page fixed").toBe(0);
  await expect(page.locator("header h1"), "the wordmark stays visible").toBeInViewport();
  await expect(page.getByTestId("pane-rail"), "the pane rail stays visible").toBeInViewport();
});

// ---- the canvas, at the small viewport, in the criterion's own terms -----

test("the map canvas SCROLLS rather than clips when the frame shrinks it", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await map(page);

  const canvas = await page.locator(".map-canvas-grid").evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    overflowY: getComputedStyle(el).overflowY,
    scrollable: el.scrollHeight > el.clientHeight,
  }));

  // The premise, asserted rather than assumed: at this viewport the
  // canvas really IS shrunk below its content. Without this the two
  // assertions below would pass on a canvas that never had to scroll —
  // which is exactly the state that hid the defect for two tasks.
  expect(
    canvas.scrollHeight,
    "the frame really does shrink the canvas below its content at 800x600 " +
      `(measured 446 over 392 when this was written; got ${canvas.scrollHeight} over ` +
      `${canvas.clientHeight}). If these are equal the graph got smaller and this ` +
      "test proves nothing — make the fixture taller, do not loosen the assertion.",
  ).toBeGreaterThan(canvas.clientHeight);

  expect(
    canvas.overflowY,
    "the canvas hands the overflow to a scrollbar instead of deleting it",
  ).toBe("auto");

  // And the bottom of the graph is genuinely reachable: scroll the
  // canvas itself and the page must not move with it.
  const reached = await page.locator(".map-canvas-grid").evaluate((el) => {
    el.scrollTop = el.scrollHeight;
    return { scrollTop: el.scrollTop, pageY: window.scrollY };
  });
  expect(reached.scrollTop, "the last pixel of the graph can be brought into view").toBe(
    canvas.scrollHeight - canvas.clientHeight,
  );
  expect(reached.pageY, "and the page did not move to get there").toBe(0);
});

// ---- what the user actually feels: the chrome stops scrolling away -------

test("the board scrolls inside its own region and the app chrome stays put", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 700 });
  await board(page);

  const scroller = page.getByTestId("board-scroll");
  const region = await scroller.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  }));
  expect(
    region.scrollHeight,
    "the repo's own tree really is taller than the window (else this proves nothing)",
  ).toBeGreaterThan(region.clientHeight * 2);

  // THE RAIL. A stretch-height sibling of the column, it used to run the
  // whole document — 4989px over this tree — and the bound would have
  // stopped the strip and its right border at the fold. It carries its
  // own `h-screen` now, so it is the window.
  const rail = (await page.getByTestId("pane-rail").boundingBox())!;
  expect(Math.round(rail.height), "the rail is the window, top to bottom").toBe(700);

  // A REAL wheel over the board, with this lane's trusted input.
  const wordmark = page.locator("header h1");
  await expect(wordmark).toBeInViewport();
  await page.mouse.move(600, 400);
  await page.mouse.wheel(0, 3000);
  await expect
    .poll(async () => scroller.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);

  expect(
    await page.evaluate(() => window.scrollY),
    "the PAGE did not scroll — the board did",
  ).toBe(0);
  await expect(wordmark, "the wordmark is still on screen").toBeInViewport();
  await expect(
    page.getByTestId("pane-rail"),
    "and so is the rail, border and all",
  ).toBeInViewport();
});
