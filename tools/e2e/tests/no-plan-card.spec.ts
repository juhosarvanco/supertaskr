import { expect, test } from "@playwright/test";
import { boardFixture } from "../fixtures/board";
import {
  ARCHITECTURE_AND_GIT,
  NOTHING_FOUND,
  type PlanProbePayload,
} from "../fixtures/shell";
import {
  applyPick,
  applyStatus,
  computed,
  expectPhase,
  getShell,
  openShell,
  tokenColor,
} from "./shell-harness";

/**
 * T-041 criterion 3, spec two: the design's "No plan in <folder>" card
 * in the served bundle, with its ○/✓ marks MEASURED from the probe that
 * rode the payload. Two ways in, because the shipped app has two and
 * they are different shell states:
 *
 *   phase `noDocs`   — launch resolved a repo with no plan (first
 *                      launch; `applyProjectStatus`), and
 *   `rejectedPick`   — the user picked one from the dialog and Rust
 *                      refused it (`applyPickOutcome`), which leaves the
 *                      PHASE where it was and only takes the screen.
 *
 * Both were unreachable from a served bundle before T-041's harness.
 */

/** The rows the shell looks for, in the order the design lists them. */
const ROWS = ["docs/ROADMAP.md", "docs/tasks/*.md", "docs/ARCHITECTURE.md", ".git"] as const;

/** What the card's four rows must read for a given probe: the mark is
 * the probe's own boolean, never decoration. */
function expectedMarks(probe: PlanProbePayload): boolean[] {
  return [probe.roadmap, probe.tasks, probe.architecture, probe.git];
}

test("phase noDocs renders the card, and every mark is the probe's own answer", async ({
  page,
}) => {
  await openShell(page);
  await applyStatus(page, {
    kind: "noDocs",
    projectDir: "/e2e/sketchpad",
    probe: ARCHITECTURE_AND_GIT,
  });
  const shell = await expectPhase(page, "noDocs", "empty");
  expect(shell.resolvedDir).toBe("/e2e/sketchpad");
  expect(shell.resolvedProbe).toEqual(ARCHITECTURE_AND_GIT);

  await expect(page.getByTestId("no-plan-heading")).toHaveText("No plan in /e2e/sketchpad");
  await expect(page.getByTestId("empty-state-message")).toContainText("nothing to render yet");

  const rows = page.locator('[data-testid="plan-checklist"] li');
  await expect(rows).toHaveCount(4);
  const marks = expectedMarks(ARCHITECTURE_AND_GIT);
  for (const [i, path] of ROWS.entries()) {
    const row = rows.nth(i);
    await expect(row).toContainText(path);
    // ○ vs ✓ — read off the rendered glyph, per row, against the probe.
    await expect(
      row,
      `${path} must render ${marks[i] ? "✓" : "○"} for this probe`,
    ).toContainText(marks[i]! ? "✓" : "○");
    if (!marks[i]!) await expect(row).not.toContainText("✓");
  }
  // The design gives only the found .git a clause; an unmeasured mark
  // never invents a sentence.
  await expect(rows.nth(3)).toContainText("it is a repo, so the plan can live here");

  // The marks are token-coloured by the real sheet: ✓ rides --review-disc
  // (the provenance-mark family), ○ stays --muted-foreground.
  const glyph = (i: number) => rows.nth(i).locator("span").first();
  expect(await computed(glyph(2), "color")).toBe(await tokenColor(page, "--review-disc"));
  expect(await computed(glyph(0), "color")).toBe(await tokenColor(page, "--muted-foreground"));

  // "Start an interview here" is offered; Adopt is deliberately absent in
  // v1 (fenced to archaeology) and asserted absent, case-insensitively.
  await expect(page.getByTestId("start-interview-here")).toHaveText("Start an interview here");
  const cardText = (await page.getByTestId("empty-state").innerText()).toLowerCase();
  expect(cardText, "the Adopt affordance is fenced out of v1").not.toContain("adopt");
  // Nothing to keep: nothing was open before the launch resolution.
  await expect(page.getByTestId("keep-current")).toHaveCount(0);
});

test("a probe that found nothing renders four ○ and no ✓ anywhere", async ({ page }) => {
  await openShell(page);
  await applyStatus(page, {
    kind: "noDocs",
    projectDir: "/e2e/bare",
    probe: NOTHING_FOUND,
  });
  await expectPhase(page, "noDocs", "empty");

  const checklist = page.getByTestId("plan-checklist");
  await expect(checklist.locator("li")).toHaveCount(4);
  await expect(checklist, "nothing was found, so nothing is ticked").not.toContainText("✓");
  await expect(checklist).not.toContainText("it is a repo");
  const text = await checklist.innerText();
  expect(text.match(/○/g) ?? [], "four looked-for paths, four ○").toHaveLength(4);
});

test("a rejected pick shows the same card over an OPEN project, and keeps it", async ({
  page,
}) => {
  await openShell(page);
  await applyStatus(page, { kind: "open", snapshot: boardFixture(1) });
  await expectPhase(page, "open", "board");

  // Rust refused the folder the user chose from the dialog.
  await applyPick(page, { kind: "noDocs", path: "/e2e/refused", probe: NOTHING_FOUND });

  // THE distinction this harness exists to make visible: the phase is
  // still `open` — the board's project was never touched — while the
  // screen is the front door's card. A selector-only assertion could not
  // tell this apart from a launch that resolved nothing.
  const shell = await expectPhase(page, "open", "empty");
  expect(shell.rejectedPick).toMatchObject({ path: "/e2e/refused", message: null });
  expect(shell.docs, "the open project's model is untouched").toMatchObject({
    projectDir: "/e2e/fixture",
    seq: 1,
    taskCount: 4,
  });

  await expect(page.getByTestId("no-plan-heading")).toHaveText("No plan in /e2e/refused");
  await expect(page.getByTestId("keep-current")).toBeVisible();

  // A REAL trusted click on the escape hatch puts the board back — the
  // shell state it returns to is the one it never left.
  await page.getByTestId("keep-current").click();
  await expectPhase(page, "open", "board");
  await expect(page.getByTestId("task-card")).toHaveCount(3);
  expect((await getShell(page)).rejectedPick).toBeNull();
});

test("a pick that failed for a reason shows the reason, not a checklist", async ({ page }) => {
  await openShell(page);
  await applyStatus(page, { kind: "noProject" });
  await applyPick(page, {
    kind: "error",
    path: "/e2e/vanished",
    message: "not a directory",
  });
  const shell = await expectPhase(page, "noProject", "empty");
  expect(shell.rejectedPick).toMatchObject({
    path: "/e2e/vanished",
    message: "not a directory",
  });

  await expect(page.getByTestId("empty-state-message")).toHaveText(
    "could not open /e2e/vanished: not a directory",
  );
  // No probe rode this outcome, so no checklist is invented for it.
  await expect(page.getByTestId("plan-checklist")).toHaveCount(0);
  await expect(page.getByTestId("no-plan-heading")).toHaveCount(0);
});
