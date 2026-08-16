import { expect, test } from "@playwright/test";
import { boardFixture } from "../fixtures/board";
import { applyStatus, computed, expectPhase, openShell, tokenColor } from "./shell-harness";

/**
 * T-041 criterion 3, spec one: the design's two-button front door, in
 * the SERVED bundle with the real stylesheet — the probe T-026's
 * Verification line owed and its verifier ruled unwritable. `noProject`
 * is produced only by `applyProjectStatus`, which lived behind the Tauri
 * branch until T-041's harness; a browser could reach phase "open" and
 * nothing else, so this screen had never been rendered by a real
 * browser at all.
 *
 * The assertions are on the PHASE (criterion 2) plus what the phase
 * renders, because `data-screen="empty"` is shared by three different
 * shell states and would happily pass on the wrong one.
 */

test("phase noProject renders both ways in, with the accelerators named", async ({ page }) => {
  await openShell(page);

  // The bundle starts in "browser" — nothing has been applied.
  await expectPhase(page, "browser", "browser");

  await applyStatus(page, { kind: "noProject" });
  await expectPhase(page, "noProject", "empty");

  const pick = page.getByTestId("pick-folder");
  const interview = page.getByTestId("start-interview");
  await expect(pick).toHaveText("Open a folder…");
  await expect(interview).toHaveText("Start an interview");
  await expect(page.getByTestId("shortcut-hint")).toHaveText("⌘O · ⌘N");

  // The design's row: two buttons side by side, the hint after them.
  const pickBox = await pick.boundingBox();
  const interviewBox = await interview.boundingBox();
  expect(pickBox).not.toBeNull();
  expect(interviewBox).not.toBeNull();
  // `items-center` aligns the centres; the outline button's 1px border
  // makes its box a pixel taller, so centres are the honest comparison.
  const centre = (b: { y: number; height: number }) => b.y + b.height / 2;
  expect(centre(pickBox!), "the two ways in sit on one row").toBeCloseTo(
    centre(interviewBox!),
    1,
  );
  expect(interviewBox!.x, "Open a folder… comes first").toBeGreaterThan(pickBox!.x);

  // No rail: the rail is board|map, which are the panes an OPEN project
  // has. A front door is not a pane.
  await expect(page.getByTestId("pane-rail")).toHaveCount(0);

  // The plain "no project open" message, not the No-plan card — nothing
  // has named a folder yet, so there is nothing to run a checklist over.
  await expect(page.getByTestId("empty-state-message")).toContainText("no project open");
  await expect(page.getByTestId("plan-checklist")).toHaveCount(0);
});

test("the front door is styled by the real sheet, in both schemes", async ({ page }) => {
  await openShell(page);
  await applyStatus(page, { kind: "noProject" });
  await expectPhase(page, "noProject", "empty");

  const pick = page.getByTestId("pick-folder");
  const interview = page.getByTestId("start-interview");

  // The ink pill really carries --primary (bg-primary), and the quiet
  // control really carries --input as a border. Compared against the
  // page's OWN resolution of each token, so this is the served
  // stylesheet answering, not a hard-coded hex.
  expect(await computed(pick, "background-color")).toBe(await tokenColor(page, "--primary"));
  expect(await computed(pick, "color")).toBe(await tokenColor(page, "--primary-foreground"));
  expect(await computed(interview, "border-top-color")).toBe(await tokenColor(page, "--input"));
  expect(
    await computed(interview, "border-top-width"),
    "the outline button's border is real, not a class that never compiled",
  ).toBe("1px");

  // The hint is the design's mono 11px muted line.
  const hint = page.getByTestId("shortcut-hint");
  expect(await computed(hint, "color")).toBe(await tokenColor(page, "--muted-foreground"));
  expect(await computed(hint, "font-family")).toContain("Geist Mono");

  // Dark: the same elements re-resolve to the dark token values — a
  // scheme flip is a token swap, and both sides are measured here rather
  // than assumed from the light one.
  const lightFill = await computed(pick, "background-color");
  await page.getByRole("button", { name: "Toggle theme" }).click(); // trusted click
  await expect(page.locator("html")).toHaveClass(/dark/);
  const darkFill = await computed(pick, "background-color");
  expect(darkFill, "the ink pill inverts in dark").not.toBe(lightFill);
  expect(darkFill).toBe(await tokenColor(page, "--primary"));
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("phase open leaves the front door for the board, rail and all", async ({ page }) => {
  await openShell(page);
  await applyStatus(page, { kind: "noProject" });
  await expectPhase(page, "noProject", "empty");

  // The launch status the shipped app answers for a folder WITH a plan.
  await applyStatus(page, { kind: "open", snapshot: boardFixture(1) });
  const shell = await expectPhase(page, "open", "board");
  expect(shell.docs).toMatchObject({ projectDir: "/e2e/fixture", seq: 1, taskCount: 4 });

  await expect(page.getByTestId("empty-state")).toHaveCount(0);
  await expect(page.getByTestId("pane-rail")).toBeVisible();
  await expect(page.getByTestId("task-card")).toHaveCount(3);
  await expect(page.getByTestId("model-counts")).toContainText("4 tasks · 2 features");
});
