import { expect, test } from "@playwright/test";
import { ARCHITECTURE_AND_GIT, NOTHING_FOUND, streakFixture } from "../fixtures/shell";
import {
  applyDocs,
  applyPick,
  applyStatus,
  computed,
  expectPhase,
  openShell,
  tokenColor,
} from "./shell-harness";

/**
 * T-041 criterion 3, spec three — THE PROBE T-024 COULD NOT WRITE.
 *
 * T-024's Verification line owed "a served-bundle probe rendering the
 * dry-run fixture" and its verifier measured the reason it could not
 * exist: the pane was mounted nowhere, so its code was absent from the
 * shipped JS entirely. T-037 mounted it (`genesis-pane-slot`,
 * GenesisScreen.tsx). The second half of the blocker was T-026's: phase
 * `genesis` comes only from `reducePickOutcome`, behind the Tauri
 * branch, so no browser could ever get to the screen the pane lives on.
 * T-041's harness closes that half, and this is the probe both tasks
 * were owed.
 *
 * The assertions inside the slot are the PANE's own strings and testids
 * — never the screen's. A screen-level assertion would pass with an
 * empty slot, which is exactly the state T-026 shipped and T-037 fixed.
 */

const GENESIS_DIR = "/e2e/streak";

test("phase genesis renders the interview screen full-bleed", async ({ page }) => {
  await openShell(page);
  await applyStatus(page, {
    kind: "noDocs",
    projectDir: GENESIS_DIR,
    probe: NOTHING_FOUND,
  });
  await expectPhase(page, "noDocs", "empty");

  // What "Start an interview here" resolves to once Rust has armed the
  // root sentinel: no snapshot rides a genesis switch, only the ordering
  // stamp (T-026).
  await applyPick(page, {
    kind: "genesis",
    projectDir: GENESIS_DIR,
    seq: 10,
    probe: NOTHING_FOUND,
  });
  const shell = await expectPhase(page, "genesis", "genesis");
  expect(shell.genesisDir).toBe(GENESIS_DIR);
  expect(shell.rejectedPick, "the front door's card is gone").toBeNull();

  await expect(page.getByTestId("genesis-screen")).toBeVisible();
  await expect(page.getByTestId("genesis-project-dir")).toHaveText(GENESIS_DIR);
  await expect(page.getByTestId("empty-state")).toHaveCount(0);
  // Full-bleed: the rail stays board|map, the panes an OPEN project has.
  await expect(page.getByTestId("pane-rail")).toHaveCount(0);
  // The slot is mounted and the pane is already inside it, rendering its
  // empty state — nothing has been written to docs/ yet.
  const slot = page.getByTestId("genesis-pane-slot");
  await expect(slot.getByTestId("genesis-pane")).toBeVisible();
  await expect(slot.getByTestId("genesis-file-count")).toHaveText("docs/ · 0 files written");
  await expect(slot.getByTestId("genesis-north-star")).toContainText("forming…");
});

test("T-024's streak tree renders through the lens, inside the slot", async ({ page }) => {
  await openShell(page);
  await applyPick(page, {
    kind: "genesis",
    projectDir: GENESIS_DIR,
    seq: 10,
    probe: ARCHITECTURE_AND_GIT,
  });
  await expectPhase(page, "genesis", "genesis");

  // docs/ lands under the genesis project — the watcher's own path.
  await applyDocs(page, streakFixture(11, GENESIS_DIR));

  // The phase does NOT move (T-026: the pipeline lighting up must not
  // yank the interview away), and the model underneath it advanced.
  const shell = await expectPhase(page, "genesis", "genesis");
  expect(shell.docs).toMatchObject({ seq: 11, projectDir: GENESIS_DIR, fileCount: 9 });
  expect(shell.docs.failureCount, "the harvested tree parses clean").toBe(0);

  const slot = page.getByTestId("genesis-pane-slot");
  const pane = slot.getByTestId("genesis-pane");
  await expect(pane).toBeVisible();

  // --- the pane's OWN content, all of it scoped inside the slot -------

  // header: the design's overline and the live count
  await expect(pane).toContainText("the project, so far");
  await expect(slot.getByTestId("genesis-file-count")).toHaveText("docs/ · 9 files written");

  // north star: the first Vision sentence and the three chips
  const northStar = slot.getByTestId("genesis-north-star");
  await expect(northStar).toContainText(
    "A habit tracker that lives where its user already is: the terminal.",
  );
  const chips = slot.getByTestId("genesis-chip");
  await expect(chips).toHaveCount(3);
  expect(
    await chips.evaluateAll((els) => els.map((el) => el.getAttribute("data-kind"))),
  ).toEqual(["person", "success", "non-goal"]);
  await expect(chips.first()).toContainText("One concrete user");

  // backbone: four built cards from the parsed ROADMAP, then slots
  const features = slot.getByTestId("genesis-feature");
  await expect(features).toHaveCount(5); // the grid is five across
  expect(
    await features.evaluateAll((els) =>
      els.map((el) => [el.getAttribute("data-kind"), el.textContent]),
    ),
  ).toEqual([
    ["built", "F-01Log"],
    ["built", "F-02Week view"],
    ["built", "F-03Habit management"],
    ["built", "F-04History & stats"],
    ["slot", "F-05—"],
  ]);

  // artifacts: nine rows in banking-map order, every one written
  const artifacts = slot.getByTestId("genesis-artifact");
  await expect(artifacts).toHaveCount(9);
  expect(
    await artifacts.evaluateAll((els) =>
      els.map((el) => [el.getAttribute("data-path"), el.getAttribute("data-status")]),
    ),
  ).toEqual([
    ["docs/STATE.md", "written"],
    ["docs/NORTH_STAR.md", "written"],
    ["docs/decisions/001-stack.md", "written"],
    ["docs/CONVENTIONS.md", "written"],
    ["docs/ROADMAP.md", "written"],
    ["docs/tasks/T-001-store-and-done.md", "written"],
    ["docs/tasks/T-002-week-view.md", "written"],
    ["docs/tasks/T-003-malformed-store-resilience.md", "written"],
    ["docs/ARCHITECTURE.md", "written"],
  ]);

  // the [?] badges, comment-aware: 5 raw markers in NORTH_STAR, one of
  // them inside the skipped-Q4 HTML comment, so the badge reads 4.
  await expect(
    slot.locator('[data-path="docs/NORTH_STAR.md"] [data-testid="genesis-assumption-badge"]'),
  ).toHaveText("4 [?]");
  await expect(
    slot.locator('[data-path="docs/STATE.md"] [data-testid="genesis-assumption-badge"]'),
  ).toHaveText("2 [?]");
  await expect(
    slot.locator('[data-path="docs/ROADMAP.md"] [data-testid="genesis-assumption-badge"]'),
  ).toHaveCount(0);

  // footer: the approximate stage and the banking map's next line
  await expect(slot.getByTestId("genesis-stage")).toHaveText("stage ~8 · decomposition");
  await expect(slot.getByTestId("genesis-next")).toHaveText(
    "Milestone 1 decomposed — the board is live.",
  );
  await expect(pane).toHaveAttribute("data-stage", "8");

  // Never blank, and never the placeholder T-026 shipped: the pane is
  // rendering, not a fallback (T-037's error boundary is silent).
  await expect(slot.getByTestId("genesis-pane-failed")).toHaveCount(0);
  await expect(page.getByTestId("genesis-screen")).not.toContainText("nothing written yet");
});

test("the pane is laid out and painted by the real sheet, inside the slot", async ({ page }) => {
  await openShell(page);
  await applyPick(page, {
    kind: "genesis",
    projectDir: GENESIS_DIR,
    seq: 10,
    probe: NOTHING_FOUND,
  });
  await applyDocs(page, streakFixture(11, GENESIS_DIR));
  await expectPhase(page, "genesis", "genesis");

  const slot = page.getByTestId("genesis-pane-slot");
  const pane = slot.getByTestId("genesis-pane");

  // T-027 RECONCILE — THE SLOT LOST ITS CARD FRAME, DELIBERATELY.
  // T-037 framed the pane in `rounded-lg border bg-card shadow-card`
  // while the screen was still a placeholder, and its own @human item 1
  // flagged that frame as a box the design never draws. The design's
  // split is FLUSH: a 640px chat with the 1px rule on ITS edge, and a
  // plain `flex:1` right half with no border, no radius and no ground of
  // its own. So the slot is now transparent and the pane's own ground is
  // what paints — which is what the assertion below says, and it is
  // strictly more specific than "the slot is --card" ever was.
  expect(await computed(pane, "background-color")).toBe(await tokenColor(page, "--sidebar"));
  expect(
    await computed(slot, "background-color"),
    "the slot paints nothing of its own; the pane brings its ground",
  ).toBe("rgba(0, 0, 0, 0)");
  expect(await computed(slot, "border-left-width"), "no frame between the halves").toBe("0px");
  expect(await computed(slot, "border-top-left-radius"), "and no radius").toBe("0px");
  // The rule that IS there belongs to the chat side, exactly as the
  // design draws it.
  expect(
    await computed(page.getByTestId("interview-chat"), "border-right-width"),
  ).toBe("1px");

  // The pane really is INSIDE the slot's box, not merely a descendant in
  // the DOM: the served CSS puts it there.
  const slotBox = (await slot.boundingBox())!;
  const paneBox = (await pane.boundingBox())!;
  expect(slotBox).not.toBeNull();
  expect(paneBox.x).toBeGreaterThanOrEqual(slotBox.x - 1);
  expect(paneBox.y).toBeGreaterThanOrEqual(slotBox.y - 1);
  expect(paneBox.width).toBeLessThanOrEqual(slotBox.width + 1);

  // WHO SCROLLS — the open @human question from T-026/T-037, MEASURED
  // rather than suspected, which is what a served-bundle probe is for.
  // T-041 pinned the wrong answer here as a deliberate tripwire: the
  // pane owned an `overflow-y-auto` region while the shell's column was
  // `min-h-screen` — a floor, never a ceiling — so the column grew, the
  // PAGE took the scroll, and the pane's own region sat at
  // scrollHeight === clientHeight and never engaged.
  //
  // T-048 fixed it and this block now asserts the FIXED behaviour: the
  // genesis column is bounded (`h-screen`, scoped to that screen) and
  // the genesis section carries `min-h-0`, which is the link that lets a
  // flex item shrink below its content and hand the overflow to the
  // pane. Both halves are needed: T-048 re-derived T-041-s3 by doing it
  // — bounding the column ALONE leaves page 1110 vs a 720 viewport and
  // the region still 796/796. The three-viewport sweep below is the
  // regression coverage; what is asserted here is the same claim at the
  // lane's own 1280x720 geometry, where T-041 recorded 1110/720.
  const scroller = pane.locator("div.overflow-y-auto").first();
  const layout = await scroller.evaluate((el) => ({
    overflowY: getComputedStyle(el).overflowY,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    pageScroll: document.documentElement.scrollHeight,
    viewport: document.documentElement.clientHeight,
    // The COLUMN is what carries the bound — `[data-testid="docs-model"]`
    // is `main`, one level up, and it keeps `min-h-screen` so that every
    // other screen stays a scrolling page (T-048).
    columnHeight: (
      document.querySelector('[data-testid="docs-model"] > div') as HTMLElement
    ).getBoundingClientRect().height,
  }));
  expect(layout.overflowY, "the pane's scroll region exists").toBe("auto");
  expect(
    layout.columnHeight,
    "the genesis column is bounded to the window (T-048)",
  ).toBe(layout.viewport);
  expect(
    layout.pageScroll,
    "the frame HOLDS: the page never grows past the viewport (T-048)",
  ).toBe(layout.viewport);
  expect(
    layout.scrollHeight,
    "…and the pane's own region takes the scroll instead (T-048)",
  ).toBeGreaterThan(layout.clientHeight);

  // The written ✓ disc paints the provenance token in both schemes.
  const disc = slot.locator('[data-path="docs/ROADMAP.md"] svg circle').first();
  expect(await computed(disc, "fill")).toBe(await tokenColor(page, "--review-disc"));
  const lightGround = await computed(pane, "background-color");
  await page.getByRole("button", { name: "Toggle theme" }).click(); // trusted click
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(await computed(pane, "background-color")).not.toBe(lightGround);
  expect(await computed(pane, "background-color")).toBe(await tokenColor(page, "--sidebar"));
  expect(await computed(disc, "fill")).toBe(await tokenColor(page, "--review-disc"));
  await page.getByRole("button", { name: "Toggle theme" }).click();
});

/**
 * T-048 — the frame holds at every window size.
 *
 * The regression coverage for the fix, and the one spec in this lane
 * that leaves 1280x720. The three viewports are the ones T-041's probe
 * measured, and 800x600 is the one that matters most: it is the app's
 * OWN configured window (app/src-tauri/tauri.conf.json), where the page
 * used to run to 1172px against a 600px viewport — you scrolled the
 * header and the interview heading off-screen to reach the artifact
 * list, and the pane's `overflow-y-auto` region never engaged at any
 * size. Measured before/after at all three; the tables are in T-048's
 * notes.
 *
 * This fails on the whole CLASS, not just on a reverted class name: it
 * reads the page's own scrollHeight, so anything that makes the genesis
 * screen grow past the window again reds it, whatever the cause.
 */
test("the frame holds and the pane scrolls at 800x600, 1024x768 and 1280x720", async ({
  page,
}) => {
  await openShell(page);
  await applyPick(page, {
    kind: "genesis",
    projectDir: GENESIS_DIR,
    seq: 10,
    probe: NOTHING_FOUND,
  });
  await applyDocs(page, streakFixture(11, GENESIS_DIR));
  await expectPhase(page, "genesis", "genesis");

  const slot = page.getByTestId("genesis-pane-slot");
  const scroller = slot.getByTestId("genesis-pane").locator("div.overflow-y-auto").first();

  // T-027 RECONCILE — 800x600 MOVES, AND ONLY 800x600.
  //
  // The lens renders at `lg` (1024px) and above; below it the split
  // degrades to the chat alone, because 640 of chat leaves the lens 159px
  // at 800 and a 159px lens is not a lens. So at 800x600 — the app's OWN
  // configured window — `genesis-pane-slot` is `display: none` and it has
  // no scroll region to measure. The FRAME half of T-048's claim still
  // holds there and is still asserted, by the loop below; the PANE half
  // moves to the two sizes where a pane exists.
  //
  // The 800x600 case is not dropped, it is RE-HOMED and widened:
  // `interview.spec.ts` measures the frame at FOUR viewports (800x600,
  // 1024x768, 1280x720, 1440x900), asserts the chat's own region scrolls
  // at every one, and asserts the lens's region scrolls wherever the lens
  // renders. Nothing that was measured here stopped being measured.
  const slotVisible = async (): Promise<boolean> => slot.isVisible();
  expect(await slotVisible(), "the lens is up at the lane's 1280x720").toBe(true);

  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    const at = `${viewport.width}x${viewport.height}`;
    const layout = await scroller.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      pageScroll: document.documentElement.scrollHeight,
      viewport: document.documentElement.clientHeight,
      columnHeight: (
        document.querySelector('[data-testid="docs-model"] > div') as HTMLElement
      ).getBoundingClientRect().height,
    }));
    expect(layout.viewport, `the viewport really is ${at}`).toBe(viewport.height);
    expect(layout.columnHeight, `the column is bounded to the window at ${at}`).toBe(
      viewport.height,
    );
    expect(layout.pageScroll, `the page does not grow past the window at ${at}`).toBe(
      viewport.height,
    );
    expect(
      layout.scrollHeight,
      `the pane's own region is the one asked to scroll at ${at}`,
    ).toBeGreaterThan(layout.clientHeight);
  }

  // 800x600, where the lens is deliberately absent: the FRAME must still
  // hold. This is the size the whole of T-048 was about, so it keeps an
  // assertion here rather than only in the new spec.
  await page.setViewportSize({ width: 800, height: 600 });
  expect(await slotVisible(), "the lens is not rendered at 800x600 (T-027)").toBe(false);
  const narrow = await page.evaluate(() => ({
    pageScroll: document.documentElement.scrollHeight,
    viewport: document.documentElement.clientHeight,
    columnHeight: (
      document.querySelector('[data-testid="docs-model"] > div') as HTMLElement
    ).getBoundingClientRect().height,
  }));
  expect(narrow.viewport).toBe(600);
  expect(narrow.columnHeight, "the column is still bounded at 800x600").toBe(600);
  expect(narrow.pageScroll, "and the page still does not grow past it").toBe(600);

  // And the same claim as BEHAVIOUR, with the trusted input this lane
  // exists for: a real wheel over the pane scrolls the PANE, the page
  // does not move, and the last artifact row — the one that used to sit
  // below the fold — is reachable.
  await page.setViewportSize({ width: 1280, height: 720 });
  const box = (await scroller.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 2000);
  await expect
    .poll(() => scroller.evaluate((el) => el.scrollTop), {
      message: "the wheel must scroll the pane's own region",
    })
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollY), "the page never moves").toBe(0);
  await expect(slot.getByTestId("genesis-artifact").last()).toBeInViewport();
});
