import { expect, test } from "@playwright/test";
import { cardTrigger, detailPanel, openBoard } from "./helpers";

/**
 * THE regression this lane exists for (T-020 plan §4.2): T-005's
 * rejection, verbatim, under real input. Under a TRUSTED click the
 * browser runs microtask checkpoints between listeners; React's discrete
 * flush lands mid-propagation and detaches the clicked blocker chip, so
 * a click-time dismissal listener reads inside as outside and closes the
 * freshly re-targeted panel. The shipped fix decides on pointerdown
 * (app/src/components/board/panel-dismissal.ts). Synthetic dispatch
 * propagates synchronously and provably cannot catch this class — only
 * this lane can.
 */

declare global {
  interface Element {
    __supertaskrTag?: string;
  }
}

test("a real blocker-chip click re-targets the panel — same node, stays open, board intact", async ({
  page,
}) => {
  await openBoard(page);

  // Real click on T-101's card face -> panel opens on T-101.
  await cardTrigger(page, "T-101").click();
  const panel = detailPanel(page);
  await expect(panel).toHaveAttribute("data-task-ref", "T-101");

  // Tag the panel node (the T-005 verifier's identity trick): a JS
  // property survives re-renders of the SAME DOM node and dies with it.
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="task-detail-panel"]');
    if (el === null) throw new Error("panel vanished before tagging");
    el.__supertaskrTag = "same-node";
  });

  // THE click: a real, trusted click on the resolved T-102 blocker chip.
  await page.locator('[data-testid="blocker-link"][data-blocker-id="T-102"]').click();

  // Panel RE-TARGETS and stays open (the rejected code closed it here).
  await expect(panel).toHaveAttribute("data-task-ref", "T-102");
  await expect(panel).toBeVisible();

  // SAME node: the tag survived the re-target.
  const tag = await page.evaluate(
    () => document.querySelector('[data-testid="task-detail-panel"]')?.__supertaskrTag,
  );
  expect(tag, "the panel must re-target in place, not remount").toBe("same-node");

  // Settled re-check: no delayed dismissal sneaks in after the flush.
  await page.waitForTimeout(250);
  await expect(panel).toHaveAttribute("data-task-ref", "T-102");

  // Board intact: T-101, T-102, T-103 cards (T-104 is the parked row).
  await expect(page.getByTestId("task-card")).toHaveCount(3);
  await expect(page.getByTestId("parked-row")).toBeVisible();
});
