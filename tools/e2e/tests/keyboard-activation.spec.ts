import { expect, test, type Page } from "@playwright/test";
import { cardTrigger, detailPanel, openBoard } from "./helpers";

/**
 * The latent variant T-005's fix pinned (plan §4.3): Enter/Space on a
 * focused blocker chip fires a TRUSTED click via UA activation — same
 * mid-propagation React flush as a mouse click, but ZERO pointer events.
 * The rejected click-time dismissal shared this bug; the pointerdown
 * decision is immune by construction (no pointer event ever fires). No
 * jsdom test can produce this path.
 */

declare global {
  interface Window {
    __lanePointerdowns?: number;
  }
}

/** Count pointerdown events at the document, capture phase. */
async function armPointerdownCounter(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__lanePointerdowns = 0;
    document.addEventListener(
      "pointerdown",
      () => {
        window.__lanePointerdowns! += 1;
      },
      { capture: true },
    );
  });
}

for (const key of ["Enter", "Space"] as const) {
  test(`real ${key} on a focused blocker chip re-targets without closing`, async ({ page }) => {
    await openBoard(page);
    await cardTrigger(page, "T-101").click();
    const panel = detailPanel(page);
    await expect(panel).toHaveAttribute("data-task-ref", "T-101");

    const chip = page.locator('[data-testid="blocker-link"][data-blocker-id="T-102"]');
    // Programmatic focus is fine — only INPUT must be trusted (plan §3).
    await chip.focus();
    await expect(chip).toBeFocused();

    await armPointerdownCounter(page);
    await page.keyboard.press(key); // trusted UA activation -> trusted click

    // Re-targeted, still open — the rejected wiring closed it here too.
    await expect(panel).toHaveAttribute("data-task-ref", "T-102");
    await expect(panel).toBeVisible();

    // The path's signature: the activation produced NO pointer event.
    const pointerdowns = await page.evaluate(() => window.__lanePointerdowns);
    expect(pointerdowns, `${key} activation must fire zero pointer events`).toBe(0);

    await page.waitForTimeout(250);
    await expect(panel).toHaveAttribute("data-task-ref", "T-102");
  });
}
