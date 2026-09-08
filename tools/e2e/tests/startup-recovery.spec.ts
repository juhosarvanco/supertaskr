import { expect, test } from "@playwright/test";
import { boardFixture } from "../fixtures/board";
import {
  applyPick,
  applyStartupFailure,
  computed,
  expectPhase,
  getShell,
  openShell,
  tokenColor,
} from "./shell-harness";

/**
 * T-050 in the SERVED bundle, with the real stylesheet and trusted
 * input: the screen @human was stranded on, once it has been told that
 * startup failed.
 *
 * WHAT THIS SPEC CAN AND CANNOT SEE, stated up front rather than
 * overclaimed (the T-049-s1 limitation, inherited):
 *
 *  - A browser never awaits `listen` or `invoke`, so a served bundle's
 *    startup CANNOT fail on its own. The failure is handed to the shell
 *    through T-041's harness — and specifically through
 *    `applyStartupFailure`, which IS `recordStartupFailure`, the function
 *    the store's own catch calls. So this renders the shipped state, not
 *    a lane-side imitation of it. The rejecting-boundary half is
 *    vitest's (app/test/startup-recovery.test.ts).
 *  - Also because it is a browser, `runPicker` returns before `invoke`
 *    (`if (!isTauri || shell.picking) return;`). A trusted click on
 *    "Open a folder…" therefore reaches the command in the app and
 *    nothing observable here. What this spec proves about that route is
 *    that the control EXISTS, is enabled, is hit-testable and takes a
 *    real click — and that when a pick succeeds the screen leaves.
 *  - "Try again" is different, and it is the sharp one: it calls
 *    `startDocsWatcher`, which a browser CAN run to completion. A real
 *    click on it leaves the failure state. That is the whole T-050
 *    mechanism observed end to end through trusted input — a recorded
 *    failure leaves the latch OPEN, so the retry genuinely re-attempts.
 */

const HOSTILE =
  "<script>window.__supertaskrPwned = true</script><img src=x onerror=\"window.__supertaskrPwned=true\">";

test("a failed startup says so, and carries three ways out", async ({ page }) => {
  await openShell(page);
  await expectPhase(page, "browser", "browser");

  await applyStartupFailure(page, "subscribe", "the event channel refused");
  await expectPhase(page, "browser", "startupFailed");

  const shell = await getShell(page);
  expect(shell.startupFailure).toEqual({
    step: "subscribe",
    message: "the event channel refused",
    attempt: 1,
  });
  expect(shell.starting, "a failed attempt is not a running one").toBe(false);

  // The copy stops claiming the app is waiting, and names which half
  // broke — a refused subscribe means no file change can arrive at all.
  const screen = page.getByTestId("startup-screen");
  await expect(screen).toHaveAttribute("data-startup", "failed");
  await expect(page.getByTestId("startup-message")).toContainText("supertaskr could not start");
  await expect(page.getByTestId("startup-message")).toContainText(
    "the watcher subscription was refused",
  );
  await expect(page.getByTestId("startup-message")).not.toContainText(
    "waiting for the first docs snapshot",
  );
  await expect(page.getByTestId("startup-failure-detail")).toHaveText(
    "the event channel refused",
  );

  // THE DEFECT, as a served-bundle assertion: the screen @human hit
  // carried one control. It now carries four, three of which go
  // somewhere, and every one of them is really clickable.
  const buttons = page.locator("button");
  await expect(buttons).toHaveText([
    "Toggle theme",
    "Try again",
    "Open a folder…",
    "Start an interview",
  ]);
  for (const id of ["startup-retry", "startup-open-folder", "startup-start-interview"]) {
    await expect(page.getByTestId(id), `${id} is on screen`).toBeVisible();
    await expect(page.getByTestId(id), `${id} is pressable`).toBeEnabled();
  }
  await expect(page.getByTestId("startup-shortcut-hint")).toHaveText("⌘O · ⌘N");

  // No rail: the rail is board|map, the panes an OPEN project has.
  await expect(page.getByTestId("pane-rail")).toHaveCount(0);
});

test("the failure card is styled by the real sheet, in both schemes", async ({ page }) => {
  await openShell(page);
  await applyStartupFailure(page, "snapshot", "docs_snapshot: the command was refused");
  await expectPhase(page, "browser", "startupFailed");

  // The rejected-status family the parse-error strip already uses —
  // resolved by the served stylesheet, compared against the page's OWN
  // resolution of each token rather than a hard-coded hex.
  const detail = page.getByTestId("startup-failure-detail");
  expect(await computed(detail, "color")).toBe(
    await tokenColor(page, "--status-rejected-fg"),
  );
  expect(await computed(detail, "font-family")).toContain("Geist Mono");

  // The retry is the ink pill on a FAILED screen (the front door's
  // primary look); the two escapes beside it stay the quiet outline.
  const retry = page.getByTestId("startup-retry");
  expect(await computed(retry, "background-color")).toBe(await tokenColor(page, "--primary"));
  expect(await computed(page.getByTestId("startup-open-folder"), "border-top-width")).toBe("1px");

  const lightFill = await computed(retry, "background-color");
  await page.getByRole("button", { name: "Toggle theme" }).click(); // trusted
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(await computed(retry, "background-color"), "the ink pill inverts in dark").not.toBe(
    lightFill,
  );
  expect(await computed(retry, "background-color")).toBe(await tokenColor(page, "--primary"));
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("a hostile rejection message is text, in a real browser", async ({ page }) => {
  const dialogs: string[] = [];
  page.on("dialog", async (d) => {
    dialogs.push(d.message());
    await d.dismiss();
  });
  await openShell(page);
  const scriptsBefore = await page.locator("script").count();

  await applyStartupFailure(page, "snapshot", HOSTILE);
  await expectPhase(page, "browser", "startupFailed");

  // Verbatim, as text — the browser's own parser never saw it as markup.
  await expect(page.getByTestId("startup-failure-detail")).toHaveText(HOSTILE);
  expect(await page.locator("script").count(), "no script element was parsed out of it").toBe(
    scriptsBefore,
  );
  expect(await page.locator("img").count()).toBe(0);
  expect(
    await page.evaluate(() => (window as unknown as Record<string, unknown>).__supertaskrPwned),
    "nothing from the message executed",
  ).toBeUndefined();
  expect(dialogs).toEqual([]);
  // Structural, not a string comparison: the element's only child is a
  // text node (nodeType 3 — `Node` is a browser global, and this half of
  // the assertion runs in node).
  expect(
    await page
      .getByTestId("startup-failure-detail")
      .evaluate((el) => [...el.childNodes].map((n) => n.nodeType)),
  ).toEqual([3]);
});

test("the escape works: a real click on Try again leaves the failure state", async ({ page }) => {
  await openShell(page);
  await applyStartupFailure(page, "subscribe", "the event channel refused");
  await expectPhase(page, "browser", "startupFailed");

  // TRUSTED input, the whole point of this lane. In a browser
  // `startDocsWatcher` runs to completion, so the retry succeeds and the
  // failure clears — which is only possible because recording a failure
  // RELEASES the latch. On the pre-T-050 code the latch was set once,
  // before the awaits, and never reset: this click would have done
  // nothing at all, forever.
  await page.getByTestId("startup-retry").click();
  await expectPhase(page, "browser", "browser");
  expect((await getShell(page)).startupFailure).toBeNull();
  await expect(page.getByTestId("startup-screen")).toHaveCount(0);

  // Fail it again and take the OTHER route out: the picker's own
  // outcome, applied through the shipped reducer, lands on the board.
  await applyStartupFailure(page, "snapshot", "docs_snapshot: refused");
  await expectPhase(page, "browser", "startupFailed");
  await page.getByTestId("startup-open-folder").click(); // trusted; see header
  await applyPick(page, { kind: "picked", snapshot: boardFixture(1) });
  await expectPhase(page, "open", "board");
  await expect(page.getByTestId("startup-screen")).toHaveCount(0);
  await expect(page.getByTestId("task-card")).toHaveCount(3);
});
