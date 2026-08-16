import { expect, test } from "@playwright/test";
import { cardTrigger, detailPanel, openBoard } from "./helpers";

/**
 * Real-key panel semantics (T-020 plan §4.4) — the checks T-005's
 * environment could never inject (its pane delivered NO key events to
 * the page; both passes said so): a real Escape closes the panel AND
 * returns focus to the opener trigger; real Enter/Space on a focused
 * card trigger opens it (UA activation under trusted timing).
 */

test("real Escape closes the panel and focus returns to the opener trigger", async ({ page }) => {
  await openBoard(page);
  const opener = cardTrigger(page, "T-101");
  await opener.click();
  const panel = detailPanel(page);
  await expect(panel).toHaveAttribute("data-task-ref", "T-101");
  // The panel parks focus on itself on open (T-005 behavior).
  await expect(panel).toBeFocused();

  await page.keyboard.press("Escape");

  await expect(panel).toHaveCount(0);
  // document.activeElement is the opener trigger again.
  const active = await page.evaluate(() => {
    const el = document.activeElement;
    if (!(el instanceof Element)) return null;
    return {
      isTrigger: el.hasAttribute("data-card-trigger"),
      taskId: el.closest('[data-testid="task-card"]')?.getAttribute("data-task-id") ?? null,
    };
  });
  expect(active, "focus must return to the opener card trigger").toEqual({
    isTrigger: true,
    taskId: "T-101",
  });
});

for (const key of ["Enter", "Space"] as const) {
  test(`real ${key} on a focused card trigger opens its panel`, async ({ page }) => {
    await openBoard(page);
    const trigger = cardTrigger(page, "T-101");
    await trigger.focus();
    await expect(trigger).toBeFocused();

    await page.keyboard.press(key); // trusted UA activation

    const panel = detailPanel(page);
    await expect(panel).toHaveAttribute("data-task-ref", "T-101");
    await expect(panel).toBeVisible();
  });
}
