import { expect, test } from "@playwright/test";
import { detailPanel, openBoard } from "./helpers";

/**
 * T-012's trusted-order concern under real input (T-020 plan §4.6): the
 * map reuses the T-005 panel primitive, so its node presses and
 * panel-task rows ride the same pointerdown dismissal contract. Rail ->
 * map pane; component node -> selection + MapPanel (the node press is
 * `data-card-trigger`-exempt: it switches, never dismisses); the
 * touching-task row -> the REAL TaskDetailPanel, which stays open.
 */

test("map pane: node opens MapPanel; touching-task row re-targets to the real TaskDetailPanel", async ({
  page,
}) => {
  await openBoard(page);

  // Real click on the rail's map item -> map pane.
  await page.getByTestId("pane-rail-map").click();
  await expect(page.getByTestId("docs-model")).toHaveAttribute("data-pane", "map");
  await expect(page.getByTestId("map-view")).toBeVisible();

  // Real click on component node C-90 -> selection + MapPanel.
  const node = page.locator('[data-testid="map-node"][data-component-id="C-90"]');
  await node.click();
  await expect(node).toHaveAttribute("aria-pressed", "true");
  const mapPanel = page.getByTestId("map-panel");
  await expect(mapPanel).toBeVisible();
  await expect(mapPanel).toHaveAttribute("data-component-id", "C-90");

  // The node press is exempt (data-card-trigger): pressing a node while
  // the panel is open must never dismiss it — asserted at press time.
  const box = await node.boundingBox();
  if (box === null) throw new Error("map node has no box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(mapPanel).toBeVisible();
  await page.mouse.up();
  await expect(mapPanel).toHaveAttribute("data-component-id", "C-90");

  // Real click on the touching-task row (T-102 touches e2e-alpha, the
  // fixture component's slug) -> the REAL TaskDetailPanel opens.
  await page.locator('[data-testid="map-panel-task"][data-task-ref="T-102"]').click();
  const taskPanel = detailPanel(page);
  await expect(taskPanel).toHaveAttribute("data-task-ref", "T-102");
  await expect(taskPanel).toBeVisible();

  // ...and STAYS open (settled re-check), still on the map pane.
  await page.waitForTimeout(250);
  await expect(taskPanel).toHaveAttribute("data-task-ref", "T-102");
  await expect(page.getByTestId("docs-model")).toHaveAttribute("data-pane", "map");
});
