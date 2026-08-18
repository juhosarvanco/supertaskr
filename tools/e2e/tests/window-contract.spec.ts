import { expect, test, type Page } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "../preflight";
import type { DocsSnapshotPayload } from "../fixtures/board";
import { ARCHITECTURE_AND_GIT, NOTHING_FOUND, streakMidInterview } from "../fixtures/shell";
import { applyDocs, applyPick, applyStatus, expectPhase, openShell } from "./shell-harness";
import { openApp, openBoard } from "./helpers";

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

/**
 * THIS repo's own `docs/` tree as one snapshot payload — T-048's board
 * instrument, and the tallest real board available. The lane's own
 * `boardFixture` fits inside the window at every size this spec
 * measures, which would make a reachability claim about the board pass
 * without anything ever scrolling.
 *
 * Reading files is not importing a package: tools/e2e still imports
 * neither app nor parser (ADR-011 addendum), exactly as `streakFixture`
 * reads T-024's tree from where it landed.
 */
function repoBoard(seq: number): DocsSnapshotPayload {
  const walk = (dir: string, prefix: string): { path: string; content: string }[] => {
    const out: { path: string; content: string }[] = [];
    for (const name of readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) out.push(...walk(full, `${prefix}/${name}`));
      else if (name.endsWith(".md")) {
        out.push({ path: `${prefix}/${name}`, content: readFileSync(full, "utf8") });
      }
    }
    return out;
  };
  const files = walk(path.join(repoRoot, "docs"), "docs");
  return { seq, projectDir: repoRoot, generatedAtMs: 1_755_400_000_000 + seq, files };
}

/** The interview screen with T-024's streak tree rendered — the screen
 * whose width requirement raised the window.
 *
 * The tree is `streakMidInterview`, NOT the full `streakFixture`. T-028's
 * crescendo switches the right half from T-024's lens to the real board
 * the moment a task file parses, and the full streak tree is a FINISHED
 * plan — so under it `genesis-artifact` does not exist and every
 * assertion here about the lens's last row measures nothing. The subject
 * of this file is the WINDOW, and the lens is the half whose width
 * requirement raised it, so the lens's own tree is the honest driver.
 * The board half has its own size questions and they are T-028-s2's, not
 * this spec's. (T-051-s6 predicted the collision; T-028-s5 measured it.) */
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
 * below anything sane and read how tall the screen's CONTENT still is.
 *
 * T-062 RECONCILE, AND THIS PROBE WAS ALREADY HALF-BLIND BEFORE IT.
 * The original read `document.documentElement.scrollHeight` — the height
 * the DOCUMENT insists on. That works only for a screen that can push
 * the page open, so it never worked for the interview: genesis was
 * bounded from T-048 onward, and this probe reported **302** for a
 * screen whose content is **1082** tall. The one screen T-051 raised the
 * window FOR was the one screen its floor probe could not see, and the
 * test passed anyway because the four measurable screens were shorter
 * than the floor. T-062 bounds every screen, which would have made all
 * five report the viewport and the whole test vacuous — the same bug,
 * finally loud enough to fix.
 *
 * So it reads the content instead: the column's own height plus, for
 * every scroll region that is actually engaged, how much it is holding
 * back. That is the window height at which nothing would need to
 * scroll. Verified to reproduce the OLD probe exactly on the pre-T-062
 * tree for all four screens it could measure — front door 475, no-plan
 * 663, board 4989, map 620 — and to answer 1082 for the genesis screen,
 * which the old one could not see at all.
 */
async function naturalHeight(page: Page, width: number): Promise<number> {
  await page.setViewportSize({ width, height: 200 });
  return page.evaluate(() => {
    const column = document.querySelector('[data-testid="docs-model"] > div');
    let height = column === null ? 0 : (column as HTMLElement).getBoundingClientRect().height;
    for (const el of Array.from(document.querySelectorAll("*"))) {
      const e = el as HTMLElement;
      const overflowY = getComputedStyle(e).overflowY;
      if ((overflowY === "auto" || overflowY === "scroll") && e.scrollHeight > e.clientHeight) {
        height += e.scrollHeight - e.clientHeight;
      }
    }
    return Math.round(height);
  });
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

/**
 * T-048-s5's collapse floor: below roughly this much window height the
 * genesis pane's scroll region fell to 44px and its last artifact row
 * could not be brought into view at all. A region shorter than this is
 * a region nobody can work in, whatever its scrollbar says.
 *
 * Its VALUE is pinned separately below, and the pin's worth is stated
 * exactly rather than overclaimed. An assertion parametrised by a
 * constant cannot pin that constant (T-063's drill: every deadline test
 * passed with the constant raised 1000x, because they all derived from
 * it), so the loop below could be satisfied for ever by lowering this
 * number. There is no independent runtime source for it — T-048-s5's
 * ~250px is a historical measurement, not something the app reports —
 * so `expect(REGION_FLOOR).toBe(250)` does NOT make it independently
 * derived. What it buys is that moving the constant takes a SECOND,
 * VISIBLE edit to a line that says the number out loud, instead of one
 * silent character. Measured, T-062's drill B: moving both together goes
 * green (the poison), moving the constant alone reds the pin.
 */
const REGION_FLOOR = 250;

/**
 * At `size`: the TIGHTEST layout scroll region this screen actually
 * needs, named — `null` when nothing has to scroll at all.
 *
 * FORM CONTROLS ARE EXCLUDED, and that exclusion is measured rather than
 * tidy-minded: a `<textarea>` scrolls its own value and reports
 * `scrollHeight > clientHeight` from its very first line, so the
 * interview's message box answers 42px on a perfectly healthy 1024x700
 * screen — one pixel off T-048-s5's genuine 44px collapse, and a false
 * alarm that reads exactly like the real thing. The question here is
 * whether the LAYOUT left a usable box, not whether a text field is
 * scrollable.
 */
async function tightestRegion(
  page: Page,
  size: { width: number; height: number },
): Promise<{ name: string; height: number } | null> {
  await page.setViewportSize(size);
  return page.evaluate(() => {
    let tightest: { name: string; height: number } | null = null;
    for (const el of Array.from(document.querySelectorAll("*"))) {
      const e = el as HTMLElement;
      if (["TEXTAREA", "INPUT", "SELECT"].includes(e.tagName)) continue;
      const overflowY = getComputedStyle(e).overflowY;
      if ((overflowY === "auto" || overflowY === "scroll") && e.scrollHeight > e.clientHeight) {
        if (tightest === null || e.clientHeight < tightest.height) {
          tightest = {
            name:
              e.getAttribute("data-testid") ??
              `${e.tagName.toLowerCase()}.${(e.className || "").toString().split(" ")[0]}`,
            height: e.clientHeight,
          };
        }
      }
    }
    return tightest;
  });
}

/**
 * T-062 RECONCILE — WHAT THE FLOOR HAS TO PROTECT CHANGED, so the claim
 * changed with it rather than being deleted or loosened.
 *
 * This test used to assert `minHeight >= the tallest screen's natural
 * content`, i.e. that every screen FITS. That was the right claim under
 * T-048's shell, where a screen that did not fit pushed the page open
 * and took the app's own header off-screen with it. Under T-062 there is
 * one scroll model: a screen taller than the window is normal and
 * correct, because it owns a scroll region and its chrome stays put. The
 * genesis screen is the worked example — 1082px of content in a 700px
 * minimum window, fully reachable, and T-051's own criterion-3 loop
 * already proves the last artifact row reaches 40/40 there.
 *
 * So the floor no longer protects "fits". It protects what T-048-s5
 * actually measured: that the region left over is big enough to use.
 */
test("the declared minHeight leaves every screen a workable scroll region", async ({
  page,
}) => {
  // The natural content height of every screen the shell renders —
  // recorded because it is the number a later reader will want, and
  // because a probe that reports it can no longer report the viewport
  // back to itself. The board is now included: under one scroll model
  // it is no longer a special case, it is the tallest case.
  const natural: Record<string, number> = {};
  const region: Record<string, { name: string; height: number } | null> = {};

  await genesis(page);
  natural.genesis = await naturalHeight(page, MINIMUM.width);
  region.genesis = await tightestRegion(page, MINIMUM);

  await openShell(page);
  await applyStatus(page, { kind: "noProject" });
  await expectPhase(page, "noProject", "empty");
  natural["front door"] = await naturalHeight(page, MINIMUM.width);
  region["front door"] = await tightestRegion(page, MINIMUM);

  await openShell(page);
  await applyStatus(page, {
    kind: "noDocs",
    projectDir: "/e2e/sketchpad",
    probe: ARCHITECTURE_AND_GIT,
  });
  await expectPhase(page, "noDocs", "empty");
  natural["no-plan card"] = await naturalHeight(page, MINIMUM.width);
  region["no-plan card"] = await tightestRegion(page, MINIMUM);

  await openBoard(page);
  await page.getByTestId("pane-rail-map").click();
  await expect(page.getByTestId("map-view")).toBeVisible();
  natural.map = await naturalHeight(page, MINIMUM.width);
  region.map = await tightestRegion(page, MINIMUM);

  expect(Object.keys(natural), "four screens were measured").toHaveLength(4);
  // The probe reports CONTENT, so it must not report the window back:
  // every screen bounded to 200px would read 200, which is exactly the
  // vacuum T-062 would have created had this been left alone.
  for (const [name, height] of Object.entries(natural)) {
    expect(height, `${name}: the natural-height probe is measuring content, not the window`).
      toBeGreaterThan(200);
  }

  for (const [screen, tightest] of Object.entries(region)) {
    if (tightest === null) continue; // the screen fits; nothing to work in
    expect(
      tightest.height,
      `${screen}: at the declared ${MINIMUM.width}x${MINIMUM.height} minimum its tightest ` +
        `scroll region (\`${tightest.name}\`) is only ${tightest.height}px tall ` +
        `(natural heights: ${JSON.stringify(natural)}). T-048-s5 measured this collapsing ` +
        "to 44px, where the last row could not be brought into view at all.",
    ).toBeGreaterThanOrEqual(REGION_FLOOR);
  }

  // REGION_FLOOR's own value, said out loud, so that satisfying the loop
  // above by moving its threshold takes a second and visible edit here
  // (see the constant's comment — this is not independence, and it does
  // not pretend to be).
  expect(REGION_FLOOR, "T-048-s5's measured ~250px collapse floor").toBe(250);
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

    // board — T-062 RECONCILE. This block used to require the PAGE to be
    // more than twice the window, because the board was a scrolling page
    // by design. Under one scroll model the page IS the window on every
    // screen, so the same guard moved one level in: it is now the
    // board's own scroll region that has to be taller than the window,
    // which is the thing that was ever actually being claimed. The rail
    // assertion moved with it — it used to say "the rail runs the whole
    // page", which was true of a 4989px document; the rail carries its
    // own `h-screen` now and IS the window.
    //
    // Driven with THIS REPO'S OWN docs/ tree rather than the lane's
    // fixture, because the lane's fixture fits inside the window at both
    // sizes and "the last card is reachable" would then be true without
    // anything scrolling — a pass that measures nothing. T-048's
    // criterion-4 row used the repo tree for exactly this reason: it is
    // the tallest real board available. The guard below says so out loud.
    await openApp(page);
    await page.evaluate((payload) => {
      window.__nputerDocsHarness!.apply(payload);
    }, repoBoard(1));
    await expect(page.getByTestId("docs-model")).toHaveAttribute("data-screen", "board");
    await page.setViewportSize(size);
    f = await frame(page);
    expect(f.page, "board: the page does not grow past the window").toBe(f.viewport);
    const boardRegion = await page.getByTestId("board-scroll").evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(
      boardRegion.scrollHeight,
      "board: the repo's own tree really is taller than the window (else this proves nothing)",
    ).toBeGreaterThan(size.height * 2);
    const rail = (await page.getByTestId("pane-rail").boundingBox())!;
    expect(Math.round(rail.height), "board: the rail is the window, top to bottom").toBe(
      size.height,
    );
    const card = await reach(page, '[data-testid="task-card"]');
    expect(card.split("/")[0], "board: the last card is fully reachable").toBe(
      card.split("/")[1],
    );

    // map — T-062 RECONCILE. The canvas used to be `overflow: hidden`
    // (T-048-s2), so this asked that nothing be clipped OUT of it, which
    // was the only protection available against a box that deletes what
    // it hides. It is `overflow-auto` now, so the claim is the stronger
    // one: whatever the canvas cannot show, it hands to a scrollbar.
    await page.getByTestId("pane-rail-map").click();
    await expect(page.getByTestId("map-view")).toBeVisible();
    await page.setViewportSize(size);
    f = await frame(page);
    expect(f.page, "map: the page does not grow past the window").toBe(f.viewport);
    const canvas = await page.locator(".map-canvas-grid").evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      overflowY: getComputedStyle(el).overflowY,
    }));
    expect(
      canvas.overflowY,
      "map: the canvas hands its overflow to a scrollbar rather than hiding it " +
        `(${canvas.scrollHeight} of content in ${canvas.clientHeight})`,
    ).toBe("auto");
    await expect(page.locator('[data-testid="map-node"]').first()).toBeVisible();
  });
}
