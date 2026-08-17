import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "../preflight";
import { ARCHITECTURE_AND_GIT, NOTHING_FOUND, streakFixture } from "../fixtures/shell";
import { applyDocs, applyPick, applyStatus, expectPhase, openShell } from "./shell-harness";
import { openBoard } from "./helpers";

/**
 * T-051 — THE WINDOW THE SPLIT FITS IN, measured against the SHIPPED
 * manifest rather than against a number written here.
 *
 * Every viewport below is read out of `app/src-tauri/tauri.conf.json` at
 * run time. Nothing in this file asserts that the window is 1280 wide;
 * it asserts what the window's OWN declared size does to the four
 * screens — so the test cannot pass by agreeing with itself. Change the
 * manifest and these specs re-measure at the new size and either hold or
 * red on the consequence.
 *
 * The two sharpest assertions compare two INDEPENDENT sources:
 *
 *   - the breakpoint at which T-027's lens starts rendering is measured
 *     by walking real widths in a real browser, and the manifest's
 *     `minWidth` must sit at or above it. Drop the minimum below the
 *     breakpoint, or move the breakpoint up to `xl`, and the app can be
 *     dragged into a size where the flagship screen silently loses half
 *     of itself — which is the whole reason this task exists.
 *   - each screen's NATURAL content height is measured by shrinking the
 *     viewport until the layout stops fitting, and the manifest's
 *     `minHeight` must sit above the tallest of them. That one is
 *     content-sensitive on purpose: if a screen grows past the declared
 *     floor, the floor is no longer a floor and the lane says so.
 */

// ---- the shipped manifest, read from disk --------------------------------

interface WindowBlock {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
}

function shippedWindow(): WindowBlock {
  const file = path.join(repoRoot, "app", "src-tauri", "tauri.conf.json");
  const raw = JSON.parse(readFileSync(file, "utf8")) as {
    app?: { windows?: Record<string, unknown>[] };
  };
  const win = raw.app?.windows?.[0];
  if (win === undefined) {
    throw new Error(
      `${file} declares no app.windows[0] — this lane measures the window the ` +
        "app actually opens and cannot answer without one; it does not skip.",
    );
  }
  for (const key of ["width", "height", "minWidth", "minHeight"]) {
    if (typeof win[key] !== "number") {
      throw new Error(
        `${file}'s window block has no numeric \`${key}\`. T-051 declares all ` +
          "four; a window with no floor can be dragged into the sizes " +
          "T-048-s5 measured as unusable.",
      );
    }
  }
  return win as unknown as WindowBlock;
}

const WINDOW = shippedWindow();
const DEFAULT = { width: WINDOW.width, height: WINDOW.height };
const MINIMUM = { width: WINDOW.minWidth, height: WINDOW.minHeight };

const GENESIS_DIR = "/e2e/streak";

/** The interview screen with T-024's streak tree rendered — the screen
 * whose width requirement raised the window. */
async function genesis(page: Page): Promise<void> {
  await openShell(page);
  await applyPick(page, {
    kind: "genesis",
    projectDir: GENESIS_DIR,
    seq: 10,
    probe: NOTHING_FOUND,
  });
  await applyDocs(page, streakFixture(11, GENESIS_DIR));
  await expectPhase(page, "genesis", "genesis");
}

/** T-048's criterion-4 fields: the page against the viewport, and `main`,
 * which is the box that grows when a screen does not fit. */
async function frame(page: Page): Promise<{ page: number; viewport: number; main: number }> {
  return page.evaluate(() => ({
    page: document.documentElement.scrollHeight,
    viewport: document.documentElement.clientHeight,
    main: Math.round(
      (
        document.querySelector('[data-testid="docs-model"]') as HTMLElement
      ).getBoundingClientRect().height,
    ),
  }));
}

/** How much of an element can actually be brought into view, clipped
 * against every scrolling ancestor and the viewport — T-048-s5's own
 * `reach` probe. `40/40` means the whole row is reachable; `1/40` is the
 * failure that suggestion measured. */
async function reach(page: Page, selector: string): Promise<string> {
  return page.evaluate((sel) => {
    const all = document.querySelectorAll(sel);
    const last = all[all.length - 1] as HTMLElement | undefined;
    if (last === undefined) return "absent";
    last.scrollIntoView({ block: "nearest" });
    const r = last.getBoundingClientRect();
    let top = r.top;
    let bottom = r.bottom;
    let node: HTMLElement | null = last.parentElement;
    while (node !== null) {
      if (getComputedStyle(node).overflowY !== "visible") {
        const nr = node.getBoundingClientRect();
        top = Math.max(top, nr.top);
        bottom = Math.min(bottom, nr.bottom);
      }
      node = node.parentElement;
    }
    top = Math.max(top, 0);
    bottom = Math.min(bottom, document.documentElement.clientHeight);
    return `${Math.max(0, Math.round(bottom - top))}/${Math.round(r.height)}`;
  }, selector);
}

/**
 * The natural height of whatever is on screen: shrink the viewport far
 * below anything sane and read what the document still insists on. A
 * screen that fits reports its content height; one that stretches
 * reports the same number at every size.
 */
async function naturalHeight(page: Page, width: number): Promise<number> {
  await page.setViewportSize({ width, height: 200 });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  return h;
}

// ---- criterion 1: the default renders BOTH halves ------------------------

test("the default window renders both halves of T-027's split", async ({ page }) => {
  await genesis(page);
  await page.setViewportSize(DEFAULT);

  const chat = page.getByTestId("interview-chat");
  const slot = page.getByTestId("genesis-pane-slot");
  await expect(slot, "the lens renders at the size the app opens").toBeVisible();

  const chatBox = (await chat.boundingBox())!;
  const slotBox = (await slot.boundingBox())!;
  expect(Math.round(chatBox.width), "the chat is the ruling's 640").toBe(640);

  // THE ARITHMETIC, re-measured rather than restated. T-027's plan read
  // the lens as W-641 by adding the 1px rule to the 640; the app is
  // border-box, so the rule is INSIDE the chat's own 640 and the lens
  // gets W-640. The two boxes therefore ABUT — a gap here would mean the
  // rule had moved out of the 640 and the arithmetic below is wrong.
  expect(Math.round(slotBox.x - (chatBox.x + chatBox.width)), "the halves abut").toBe(0);
  expect(Math.round(slotBox.width), "the lens takes the rest of the window").toBe(
    DEFAULT.width - 640,
  );

  // Criterion 1's floor: the lens gets no less than the 639px T-027's
  // plan calls the design's geometry. 640 + 639 = 1279 is the width that
  // delivers it — one pixel BELOW the card's 640 + 1 + 639, because the
  // card counts the rule twice.
  expect(Math.round(slotBox.width), "the lens clears the design's 639").toBeGreaterThanOrEqual(
    639,
  );

  // And the frame still holds at the new size (T-048's claim).
  const f = await frame(page);
  expect(f.viewport, "the viewport really is the declared height").toBe(DEFAULT.height);
  expect(f.page, "the page does not grow past the window").toBe(f.viewport);
  expect(await reach(page, '[data-testid="genesis-artifact"]')).toBe("40/40");
});

// ---- criterion 2: the minimum keeps the split rendering ------------------

test("the declared minWidth sits at or above the lens's measured breakpoint", async ({
  page,
}) => {
  await genesis(page);
  const slot = page.getByTestId("genesis-pane-slot");

  // Walk real widths and find where the lens actually starts. Nothing
  // here reads Tailwind's `lg`, the source, or the built CSS: the
  // breakpoint is whatever the SERVED bundle does.
  let breakpoint = -1;
  for (let width = MINIMUM.width; width >= 800; width -= 1) {
    await page.setViewportSize({ width, height: MINIMUM.height });
    if (!(await slot.isVisible())) break;
    breakpoint = width;
  }
  expect(
    breakpoint,
    "the lens must render somewhere at or below the declared minimum",
  ).toBeGreaterThan(0);
  expect(
    MINIMUM.width,
    `the lens starts rendering at ${breakpoint}px; a minWidth below that lets ` +
      "the window be dragged into a size where the flagship screen silently " +
      "drops half of itself (T-051 criterion 2)",
  ).toBeGreaterThanOrEqual(breakpoint);

  // One below the breakpoint the lens is gone — the fact the minimum exists to
  // fence, asserted so it cannot quietly stop being true.
  await page.setViewportSize({ width: breakpoint - 1, height: MINIMUM.height });
  await expect(slot, "…and one pixel below it, the lens is not rendered").toBeHidden();

  // At the declared minimum itself both halves are real boxes.
  await page.setViewportSize(MINIMUM);
  await expect(slot).toBeVisible();
  expect(Math.round((await page.getByTestId("interview-chat").boundingBox())!.width)).toBe(640);
  expect(Math.round((await slot.boundingBox())!.width)).toBe(MINIMUM.width - 640);
});

test("the declared minHeight sits above every fitting screen's natural content", async ({
  page,
}) => {
  // The natural height of each screen that CLAIMS to fit the window. The
  // board is deliberately absent: it is a scrolling page by design
  // (T-048 kept `min-h-screen` on `main` for every screen but genesis),
  // so its content height is unbounded and says nothing about a floor.
  const natural: Record<string, number> = {};

  await genesis(page);
  natural.genesis = await naturalHeight(page, MINIMUM.width);

  await openShell(page);
  await applyStatus(page, { kind: "noProject" });
  await expectPhase(page, "noProject", "empty");
  natural["front door"] = await naturalHeight(page, MINIMUM.width);

  await openShell(page);
  await applyStatus(page, {
    kind: "noDocs",
    projectDir: "/e2e/sketchpad",
    probe: ARCHITECTURE_AND_GIT,
  });
  await expectPhase(page, "noDocs", "empty");
  natural["no-plan card"] = await naturalHeight(page, MINIMUM.width);

  await openBoard(page);
  await page.getByTestId("pane-rail-map").click();
  await expect(page.getByTestId("map-view")).toBeVisible();
  natural.map = await naturalHeight(page, MINIMUM.width);

  const tallest = Object.entries(natural).sort((a, b) => b[1] - a[1])[0];
  expect(
    MINIMUM.height,
    `the tallest screen that must fit is the ${tallest[0]} at ${tallest[1]}px ` +
      `(all of them: ${JSON.stringify(natural)}). A minHeight below that puts a ` +
      "screen's own overflow back inside the window's legal range.",
  ).toBeGreaterThanOrEqual(tallest[1]);

  // And far above T-048-s5's floor, where the genesis pane's scroll
  // region collapsed and its last row could not be brought into view.
  expect(MINIMUM.height, "well above T-048-s5's ~250px collapse floor").toBeGreaterThan(500);
});

// ---- criterion 3: the four screens, measured at the minimum --------------

/**
 * T-048's criterion-4 table, re-run at the declared minimum and at the
 * declared default. Every screen the app can be on: the genesis screen
 * whose width raised the window, the board, the map and the front door —
 * plus the "No plan in <folder>" card, which is the fifth thing the
 * shell renders and the one with a known overflow (T-048-s4).
 */
for (const [label, size] of [
  ["the declared minimum", MINIMUM],
  ["the declared default", DEFAULT],
] as const) {
  test(`every screen is usable at ${label} (${size.width}x${size.height})`, async ({ page }) => {
    // genesis — both halves render, the frame holds, the last artifact
    // row is reachable inside the lens's own scroll region.
    await genesis(page);
    await page.setViewportSize(size);
    let f = await frame(page);
    expect(f.viewport).toBe(size.height);
    expect(f.page, "genesis: the page does not grow past the window").toBe(f.viewport);
    await expect(page.getByTestId("genesis-pane-slot")).toBeVisible();
    await expect(page.getByTestId("interview-input")).toBeVisible();
    expect(await reach(page, '[data-testid="genesis-artifact"]'), "genesis: last row").toBe(
      "40/40",
    );

    // front door — both ways in on screen and the card inside the frame.
    await openShell(page);
    await applyStatus(page, { kind: "noProject" });
    await expectPhase(page, "noProject", "empty");
    await page.setViewportSize(size);
    f = await frame(page);
    expect(f.page, "front door: the page does not grow past the window").toBe(f.viewport);
    await expect(page.getByTestId("pick-folder")).toBeInViewport();
    await expect(page.getByTestId("start-interview")).toBeInViewport();

    // the no-plan card — the four checklist rows readable, and the page
    // no longer overflowing. T-048-s4 measured 663 against a 600px
    // viewport at the app's OLD window; the card is 663 tall at every
    // width, so the declared floor is what takes it out of range.
    await openShell(page);
    await applyStatus(page, {
      kind: "noDocs",
      projectDir: "/e2e/sketchpad",
      probe: ARCHITECTURE_AND_GIT,
    });
    await expectPhase(page, "noDocs", "empty");
    await page.setViewportSize(size);
    f = await frame(page);
    expect(f.page, "no-plan card: T-048-s4's overflow is out of range").toBe(f.viewport);
    await expect(page.locator('[data-testid="plan-checklist"] li')).toHaveCount(4);
    await expect(page.getByTestId("plan-checklist")).toBeInViewport();

    // board — a scrolling page BY DESIGN, so the claim is not that it
    // fits but that it stays reachable: the rail runs the full height of
    // the document and the last card can be scrolled to in full.
    await openBoard(page);
    await page.setViewportSize(size);
    f = await frame(page);
    const rail = (await page.getByTestId("pane-rail").boundingBox())!;
    expect(Math.round(rail.height), "board: the rail runs the whole page").toBe(f.main);
    const card = await reach(page, '[data-testid="task-card"]');
    expect(card.split("/")[0], "board: the last card is fully reachable").toBe(
      card.split("/")[1],
    );

    // map — the canvas is `overflow: hidden` (T-048-s2), so the claim
    // here is that nothing is clipped: its scrollHeight equals its
    // clientHeight and the graph is whole.
    await page.getByTestId("pane-rail-map").click();
    await expect(page.getByTestId("map-view")).toBeVisible();
    await page.setViewportSize(size);
    f = await frame(page);
    expect(f.page, "map: the page does not grow past the window").toBe(f.viewport);
    const canvas = await page.locator(".map-canvas-grid").evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(
      canvas.scrollHeight,
      "map: nothing is clipped out of the canvas (T-048-s2's failure mode)",
    ).toBe(canvas.clientHeight);
    await expect(page.locator('[data-testid="map-node"]').first()).toBeVisible();
  });
}
