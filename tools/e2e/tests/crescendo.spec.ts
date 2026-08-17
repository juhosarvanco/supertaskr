import { expect, test } from "@playwright/test";
import { NOTHING_FOUND, streakFixture, streakMidInterview } from "../fixtures/shell";
import {
  applyDocs,
  applyPick,
  computed,
  expectPhase,
  getShell,
  openInterview,
  pushStatus,
  pushTurnEvent,
} from "./shell-harness";

/**
 * T-028 — THE DECOMPOSITION CRESCENDO against the real bundle, the real
 * stylesheet and real trusted input.
 *
 * What only a served bundle can prove, and what the jsdom suite cannot:
 * that the shipped CSS actually PAINTS the entrance transition and
 * actually withdraws it under a real `prefers-reduced-motion` setting;
 * that the board half's scroll region engages inside the interview's
 * bounded frame at real widths; and that a REAL CLICK on the completion
 * CTA moves the whole shell — screen, rail and all — with no command
 * issued anywhere.
 *
 * STATE is pushed through the harnesses (the plan's standing division);
 * every ACTIVATION below is trusted input.
 */

const GENESIS_DIR = "/e2e/streak";

async function arrive(page: import("@playwright/test").Page): Promise<void> {
  await openInterview(page);
  await applyPick(page, {
    kind: "genesis",
    projectDir: GENESIS_DIR,
    seq: 10,
    probe: NOTHING_FOUND,
  });
  await expectPhase(page, "genesis", "genesis");
  await pushStatus(page, { projectDir: GENESIS_DIR });
}

test("the lens hands over to the real board when task files land", async ({ page }) => {
  await arrive(page);

  // One turn before decomposition: the lens, and no board anywhere.
  await applyDocs(page, streakMidInterview(11, GENESIS_DIR));
  const slot = page.getByTestId("genesis-pane-slot");
  await expect(slot).toHaveAttribute("data-half", "lens");
  await expect(page.getByTestId("genesis-pane")).toBeVisible();
  await expect(page.getByTestId("genesis-board")).toHaveCount(0);
  await expect(page.getByTestId("task-card")).toHaveCount(0);

  // The cards land. Same tree, plus `docs/tasks/`.
  await applyDocs(page, streakFixture(12, GENESIS_DIR));
  await expect(slot).toHaveAttribute("data-half", "board");
  await expect(page.getByTestId("genesis-board")).toBeVisible();
  await expect(page.getByTestId("genesis-pane"), "the lens handed over").toHaveCount(0);

  // THE REAL BOARD: T-004's cards, T-004's columns, from the files.
  await expect(page.getByTestId("task-card")).toHaveCount(3);
  expect(
    await page.getByTestId("task-card").evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-task-id")).sort(),
    ),
  ).toEqual(["T-001", "T-002", "T-003"]);
  await expect(page.getByTestId("genesis-board-count")).toHaveText("3 cards · 3 task files");
  // And the interview is still the screen: the conversation did not move.
  await expectPhase(page, "genesis", "genesis");
  await expect(page.getByTestId("interview-chat")).toBeVisible();
  // The rail is still absent — an interview is not a pane (T-026).
  await expect(page.getByTestId("pane-rail")).toHaveCount(0);
});

/**
 * CRITERION 5, against the REAL SHEET and a REAL media setting. The jsdom
 * suite can prove the class is on the element; only a browser can prove
 * the browser withdraws the animation.
 */
test("the entrance transition is painted, and reduced motion drops it", async ({ page }) => {
  await arrive(page);
  await applyDocs(page, streakFixture(11, GENESIS_DIR));
  const card = page.getByTestId("task-card").first();
  await expect(card).toBeVisible();

  // Default (no preference): the served sheet gives the card ONE
  // entrance transition, with the token's own duration.
  expect(await computed(card, "animation-name")).toBe("card-rain");
  expect(await computed(card, "animation-duration")).toBe("0.26s");
  expect(await computed(card, "animation-iteration-count"), "an entrance, not a loop").toBe("1");
  // No fill mode, deliberately: `forwards` would leave the final
  // keyframe's transform winning the cascade and kill the card's own
  // hover lift forever.
  expect(await computed(card, "animation-fill-mode")).toBe("none");

  // The same element, the same sheet, with the OS preference set.
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await computed(card, "animation-name"),
    "prefers-reduced-motion must drop the entrance entirely",
  ).toBe("none");
  // The cards are still there — reduced motion removes the transition,
  // never the content.
  await expect(page.getByTestId("task-card")).toHaveCount(3);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(await computed(card, "animation-name")).toBe("card-rain");
});

/**
 * CRITERION 2 — the completion state and the handoff, end to end, with a
 * real click. This is the milestone's closer as a user would walk it.
 */
test("completion: the board is ready, and one CTA lands in the board pane", async ({ page }) => {
  await arrive(page);
  await applyDocs(page, streakFixture(11, GENESIS_DIR));

  // A board on disk is NOT a finished interview: nothing has been said.
  await expect(page.getByTestId("genesis-complete")).toHaveCount(0);
  await expect(page.getByTestId("genesis-board")).toHaveAttribute("data-complete", "false");

  // A turn opens…
  await pushTurnEvent(page, { kind: "started", seq: 1, turn: 1 });
  await expect(
    page.getByTestId("genesis-complete"),
    "a turn in flight is not a closing turn",
  ).toHaveCount(0);

  // …and lands. Now the run has closed over a parseable board.
  await pushTurnEvent(page, {
    kind: "completed",
    seq: 2,
    turn: 1,
    text: "That is milestone 1 — three cards, all dispatchable.",
    truncatedRelay: false,
  });
  const panel = page.getByTestId("genesis-complete");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("The board is ready.");
  await expect(page.getByTestId("genesis-complete-detail")).toContainText("3 cards");
  // The elapsed time, from the local clock, in the design's phrasing.
  await expect(page.getByTestId("genesis-complete-elapsed")).toHaveText(/elapsed$/);
  await expect(page.getByTestId("interview-elapsed")).toHaveText(/elapsed$/);
  // ONE CTA, and no dispatch affordance (F-04's fence).
  await expect(panel.locator("button")).toHaveCount(1);
  await expect(panel).not.toContainText(/dispatch/i);

  // THE HANDOFF, with a real click.
  await page.getByTestId("genesis-open-board").click(); // trusted
  await expectPhase(page, "open", "board");
  await expect(page.getByTestId("pane-rail"), "the rail is restored").toBeVisible();
  await expect(page.getByTestId("genesis-screen"), "the interview is over").toHaveCount(0);
  // The same project, the same cards — nothing was re-opened or re-read.
  const shell = await getShell(page);
  expect(shell.docs.projectDir).toBe(GENESIS_DIR);
  expect(shell.genesisDir).toBeNull();
  await expect(page.getByTestId("board")).toBeVisible();
  await expect(page.getByTestId("task-card")).toHaveCount(3);
});

/**
 * CRITERION 4 — planning theater, refused, in the real bundle. Two files
 * under `docs/tasks/` that no parser can establish a record from.
 */
test("a planner that ends without a parseable board is never celebrated", async ({ page }) => {
  await arrive(page);
  const tree = streakMidInterview(11, GENESIS_DIR);
  await applyDocs(page, {
    ...tree,
    files: [
      ...tree.files,
      { path: "docs/tasks/T-001-half.md", content: "# T-001\n\nhalf a thought" },
      { path: "docs/tasks/T-002-half.md", content: "notes, not frontmatter" },
    ],
  });
  await pushTurnEvent(page, { kind: "started", seq: 1, turn: 1 });
  await pushTurnEvent(page, {
    kind: "completed",
    seq: 2,
    turn: 1,
    text: "There is your board.",
    truncatedRelay: false,
  });

  // The view stays in-interview on the honest artifacts state…
  await expect(page.getByTestId("genesis-pane-slot")).toHaveAttribute("data-half", "lens");
  await expect(page.getByTestId("genesis-pane")).toBeVisible();
  await expect(page.getByTestId("genesis-board")).toHaveCount(0);
  await expect(page.getByTestId("genesis-complete")).toHaveCount(0);
  await expect(page.getByTestId("task-card")).toHaveCount(0);
  // …with the existing parse-chip family saying why.
  await expect(page.getByTestId("genesis-parse-chip")).toContainText("2 parse errors");
  // And the torn files are ROWS on the lens — present, not vanished.
  await expect(
    page.locator('[data-testid="genesis-artifact"][data-path="docs/tasks/T-001-half.md"]'),
  ).toBeVisible();
});

/**
 * T-048's claim for the OTHER right half. The frame must hold and the
 * board's own region must be the thing asked to scroll — the same
 * assertion `interview.spec.ts` makes for the lens.
 */
test("the frame holds with the board in the right half, at 1024x768 and 1280x720", async ({
  page,
}) => {
  await arrive(page);
  await applyDocs(page, streakFixture(11, GENESIS_DIR));
  await expect(page.getByTestId("genesis-board")).toBeVisible();

  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    const at = `${viewport.width}x${viewport.height}`;
    const layout = await page
      .getByTestId("genesis-board")
      .locator("div.overflow-y-auto")
      .first()
      .evaluate((el) => ({
        overflowY: getComputedStyle(el).overflowY,
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
    expect(layout.overflowY, `the board's own region exists at ${at}`).toBe("auto");
    // The region is BOUNDED — it cannot be taller than the window, which
    // is the property that makes it the thing that scrolls rather than
    // the page. (Whether it OVERFLOWS depends on how many cards a run
    // produced; three streak cards do not fill 768px, and asserting
    // overflow here would be asserting the fixture's height.)
    expect(layout.clientHeight, `and it is inside the frame at ${at}`).toBeLessThan(
      viewport.height,
    );
  }
});
