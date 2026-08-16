import { expect, test } from "@playwright/test";
import { cardTrigger, detailPanel, openBoard } from "./helpers";

/**
 * T-017's exemption mechanism under real input (T-020 plan §4.5):
 * `data-panel-exempt` controls (the header's theme toggle, the board's
 * parked-row expander) must not cost an open panel, while a genuine
 * outside press closes AT PRESS — dismissal-at-press is the fix's own
 * contract, asserted between mouse.down() and mouse.up().
 */

test("theme toggle keeps the panel open and actually flips the scheme (both ways)", async ({
  page,
}) => {
  await openBoard(page);
  await cardTrigger(page, "T-101").click();
  const panel = detailPanel(page);
  await expect(panel).toHaveAttribute("data-task-ref", "T-101");

  const panelBg = () =>
    panel.evaluate((el) => getComputedStyle(el).backgroundColor);
  const lightBg = await panelBg();

  // LANE FINDING, pinned (T-020-s1): the plan's "real click 'Toggle
  // theme'" is physically impossible — the open panel (fixed, right-
  // anchored, w-150 = 600px, full height) occludes the right-anchored
  // header controls at EVERY viewport width, so no real pointer can
  // reach them; Playwright's actionability check refuses, which is this
  // lane telling the truth. T-017's header exemption is therefore
  // pointer-unreachable while a panel is open; the parked-row test
  // below carries the real-POINTER exemption proof. If a future change
  // un-occludes the header, this assertion fails loudly and the click
  // below upgrades to a real pointer press.
  const toggle = page.getByRole("button", { name: "Toggle theme" });
  const occluded = await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find(
      (b) => b.textContent === "Toggle theme",
    );
    const box = button?.getBoundingClientRect();
    if (box === undefined) return null;
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    const open = document.querySelector('[data-testid="task-detail-panel"]');
    return open !== null && hit !== null && open.contains(hit);
  });
  expect(occluded, "the open panel occludes the header toggle (T-020-s1)").toBe(true);

  // The one real input that CAN reach it: trusted keyboard activation
  // (focus is programmatic — only INPUT must be trusted; Enter fires a
  // trusted click with zero pointer events, the T-005 keyboard variant).
  await toggle.focus();
  await page.keyboard.press("Enter");

  // Panel STAYS open; the scheme actually flipped (html.dark + computed
  // background differs — both schemes' values asserted, not just the class).
  await expect(panel).toHaveAttribute("data-task-ref", "T-101");
  await expect(page.locator("html")).toHaveClass(/dark/);
  const darkBg = await panelBg();
  expect(darkBg, "dark scheme must resolve a different panel background").not.toBe(lightBg);

  // Flip back: still open, light values restored.
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(panel).toHaveAttribute("data-task-ref", "T-101");
  expect(await panelBg()).toBe(lightBg);
});

test("a genuine outside press closes the panel AT PRESS (asserted between down and up)", async ({
  page,
}) => {
  await openBoard(page);
  await cardTrigger(page, "T-101").click();
  const panel = detailPanel(page);
  await expect(panel).toHaveAttribute("data-task-ref", "T-101");

  // A genuinely outside point: the model-counts line (not a trigger, not
  // exempt, not inside the panel) — verified before pressing.
  const counts = page.getByTestId("model-counts");
  const outside = await counts.evaluate((el: HTMLElement) => {
    const bad =
      el.closest("[data-panel-exempt]") !== null ||
      el.closest("[data-card-trigger]") !== null ||
      el.closest('[data-testid="task-detail-panel"]') !== null;
    return !bad;
  });
  expect(outside, "the chosen press target must be genuinely outside").toBe(true);

  const box = await counts.boundingBox();
  if (box === null) throw new Error("model-counts has no box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // Dismissal-at-PRESS: the panel is gone while the button is still down.
  await expect(panel).toHaveCount(0);
  await page.mouse.up();

  // The paired click is inert; board intact.
  await expect(panel).toHaveCount(0);
  await expect(page.getByTestId("task-card")).toHaveCount(3);
});

test("the parked row's exempt expander keeps the panel open", async ({ page }) => {
  await openBoard(page);
  await cardTrigger(page, "T-101").click();
  const panel = detailPanel(page);
  await expect(panel).toHaveAttribute("data-task-ref", "T-101");

  // Real click on the parked row toggle (data-panel-exempt, T-017).
  await page.getByTestId("parked-row").click();

  await expect(page.getByTestId("parked-list")).toBeVisible();
  await expect(panel).toHaveAttribute("data-task-ref", "T-101");
  await expect(panel).toBeVisible();
});
