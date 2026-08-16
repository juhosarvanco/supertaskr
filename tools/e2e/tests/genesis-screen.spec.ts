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

  // The pane brings its own ground (bg-sidebar) inside the card frame —
  // the composition the @human screenshot pass is judging.
  expect(await computed(pane, "background-color")).toBe(await tokenColor(page, "--sidebar"));
  expect(await computed(slot, "background-color")).toBe(await tokenColor(page, "--card"));
  expect(await computed(slot, "overflow-x"), "the slot clips to its radius").toBe("hidden");

  // The pane really is INSIDE the slot's box, not merely a descendant in
  // the DOM: the served CSS puts it there.
  const slotBox = (await slot.boundingBox())!;
  const paneBox = (await pane.boundingBox())!;
  expect(slotBox).not.toBeNull();
  expect(paneBox.x).toBeGreaterThanOrEqual(slotBox.x - 1);
  expect(paneBox.y).toBeGreaterThanOrEqual(slotBox.y - 1);
  expect(paneBox.width).toBeLessThanOrEqual(slotBox.width + 1);

  // WHO SCROLLS — the open @human question from T-026/T-037, now
  // MEASURED rather than suspected, which is what a served-bundle probe
  // is for. The pane owns an `overflow-y-auto` region (min-h-0 + flex-1
  // all the way up), but the shell's column is `min-h-screen`, not
  // `h-screen`, so it is unbounded: with the complete tree at the
  // lane's 1280x720 geometry the COLUMN grows past the viewport and the
  // PAGE takes the scroll, while the pane's own region never engages.
  // Recorded as T-041-s1. This assertion is a tripwire on today's
  // truth, not an endorsement of it: bounding the column (h-screen)
  // reds it, and the reconciliation is to flip both halves — page no
  // longer scrolls, pane's region does.
  const scroller = pane.locator("div.overflow-y-auto").first();
  const layout = await scroller.evaluate((el) => ({
    overflowY: getComputedStyle(el).overflowY,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    pageScroll: document.documentElement.scrollHeight,
    viewport: document.documentElement.clientHeight,
    columnMinHeight: getComputedStyle(
      document.querySelector('[data-testid="docs-model"]')!,
    ).minHeight,
  }));
  expect(layout.overflowY, "the pane's scroll region exists").toBe("auto");
  expect(layout.columnMinHeight).toBe(`${layout.viewport}px`);
  expect(
    layout.pageScroll,
    "today the PAGE grows past the viewport with the complete tree (T-041-s1)",
  ).toBeGreaterThan(layout.viewport);
  expect(
    layout.scrollHeight,
    "…so the pane's own region is never asked to scroll (T-041-s1)",
  ).toBe(layout.clientHeight);

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
