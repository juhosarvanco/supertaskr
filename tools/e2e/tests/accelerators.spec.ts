import { expect, test, type Page } from "@playwright/test";
import { boardFixture } from "../fixtures/board";
import { ARCHITECTURE_AND_GIT } from "../fixtures/shell";
import { applyPick, applyStatus, expectPhase, openShell } from "./shell-harness";

/**
 * T-049 in the lane: a REAL, trusted ⌘O against the SERVED bundle, from
 * screens the front door never mounts.
 *
 * This is the first task able to write it. T-041's shell harness is what
 * lets a browser reach `noProject`, `genesis` and `open` at all (before
 * it, a served bundle could only ever land on phase "open"), and the bug
 * @human hit — "command + o and command + n are not working" — is by
 * construction invisible on the one screen a browser could previously
 * reach: the listener lived inside `EmptyState` and unmounted with it.
 *
 * WHAT THIS SPEC CAN OBSERVE, stated plainly rather than overclaimed.
 * A served bundle is not Tauri, so `runPicker` returns before `invoke`
 * (there is no IPC to call and no native dialog to open) — a chord
 * cannot be followed through to a command HERE. What it can be followed
 * to is the app's own handler: the accelerator calls `preventDefault()`
 * on exactly the two chords the app claims, so a witness listener
 * registered after the app's own reads `defaultPrevented` and knows
 * whether the app took the keypress. That is precisely the defect's
 * shape — pre-T-049 the board's keypress reached nothing and was never
 * claimed — and the negative controls below (⌘P, ⇧⌘O) prove the witness
 * discriminates rather than reporting `true` for everything. The
 * command wiring is proven against the real store in
 * app/test/accelerators.test.tsx; the trusted-input half is here,
 * because only a real browser can deliver a real chord.
 *
 * ONE ORDERING FACT, load-bearing and worth knowing before reading a
 * failure here: listeners on one target fire in registration order, and
 * the witness is armed after the page has loaded — so it can only read
 * `prevented: true` for a handler that was ALREADY registered by then.
 * An app-scoped accelerator is; a listener that mounts with a screen is
 * not. Restoring T-026's scoping as a probe therefore reds this spec on
 * EVERY screen, the front door included, which is the sharpest available
 * statement of what changed (measured — see the task's notes).
 */

interface ChordRecord {
  key: string;
  meta: boolean;
  ctrl: boolean;
  prevented: boolean;
}

declare global {
  interface Window {
    __t049Chords?: ChordRecord[];
  }
}

/** Watch every keydown the page sees, AFTER the app's own listener — so
 * `defaultPrevented` reports whether the app claimed the chord. */
async function armChordWitness(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__t049Chords = [];
    window.addEventListener("keydown", (event) => {
      window.__t049Chords!.push({
        key: event.key,
        meta: event.metaKey,
        ctrl: event.ctrlKey,
        prevented: event.defaultPrevented,
      });
    });
  });
}

/** Press one real chord and answer what the page saw. Playwright's
 * modifier syntax presses the modifier as its own key first, so the
 * modifier keydowns are dropped and exactly one real chord must remain. */
async function press(page: Page, combo: string): Promise<ChordRecord> {
  await page.evaluate(() => {
    window.__t049Chords = [];
  });
  await page.keyboard.press(combo); // trusted input, the lane's whole point
  const seen = await page.evaluate(() =>
    (window.__t049Chords ?? []).filter((c) => !["Meta", "Control", "Shift", "Alt"].includes(c.key)),
  );
  expect(seen, `the page must receive exactly one ${combo}`).toHaveLength(1);
  return seen[0]!;
}

/** Both accelerators claimed, and nothing else — on whatever screen is up. */
async function expectChordsClaimed(page: Page, where: string): Promise<void> {
  expect((await press(page, "Meta+o")).prevented, `⌘O is claimed on ${where}`).toBe(true);
  expect((await press(page, "Meta+n")).prevented, `⌘N is claimed on ${where}`).toBe(true);
  // The Ctrl equivalents keep working (criterion 1's second clause).
  expect((await press(page, "Control+o")).prevented, `Ctrl+O is claimed on ${where}`).toBe(true);
  expect((await press(page, "Control+n")).prevented, `Ctrl+N is claimed on ${where}`).toBe(true);
  // ...and only those: no new preventDefault beyond the two chords
  // already claimed (criterion 6). These are the discriminating half —
  // without them "prevented: true" could just mean the witness is broken.
  expect((await press(page, "Meta+p")).prevented, `⌘P is not ours on ${where}`).toBe(false);
  expect(
    (await press(page, "Meta+Shift+o")).prevented,
    `⇧⌘O is not ours on ${where}`,
  ).toBe(false);
  expect((await press(page, "o")).prevented, `a bare o is typing on ${where}`).toBe(false);
}

test("a real ⌘O / ⌘N is claimed from every screen, front door or not", async ({ page }) => {
  await openShell(page);
  await armChordWitness(page);

  // The sanity check first: the modifier keys really arrive as modifiers,
  // so a later `prevented: false` means "not claimed", never "not sent".
  const first = await press(page, "Meta+o");
  expect(first.key.toLowerCase(), "the page sees the o").toBe("o");
  expect(first.meta, "and sees it as a Command chord").toBe(true);
  // ...and it is ALREADY claimed, on the bare "browser" screen, before a
  // single project state has been applied: the accelerator belongs to the
  // app, not to whichever screen happens to be up.
  await expectPhase(page, "browser", "browser");
  expect(first.prevented, "the app claims ⌘O before any screen exists").toBe(true);

  // 1. The front door — T-026's screen, unchanged behaviour.
  await applyStatus(page, { kind: "noProject" });
  await expectPhase(page, "noProject", "empty");
  await expect(page.getByTestId("shortcut-hint")).toHaveText("⌘O · ⌘N");
  await expectChordsClaimed(page, "the front door");

  // 2. The board — the screen @human was on. The front door is NOT
  //    mounted here, which is exactly why the chords used to die.
  await applyStatus(page, { kind: "open", snapshot: boardFixture(1) });
  await expectPhase(page, "open", "board");
  await expect(page.getByTestId("empty-state")).toHaveCount(0);
  await expect(page.getByTestId("task-card").first()).toBeVisible();
  await expectChordsClaimed(page, "the board");

  // 3. The interview — the other screen with no front door behind it.
  await applyPick(page, {
    kind: "genesis",
    projectDir: "/e2e/sketchpad",
    seq: 2,
    probe: ARCHITECTURE_AND_GIT,
  });
  await expectPhase(page, "genesis", "genesis");
  await expect(page.getByTestId("empty-state")).toHaveCount(0);
  await expectChordsClaimed(page, "the interview");

  // Nothing the chords did moved the shell: a browser has no picker to
  // open, and the app did not invent one.
  const shell = await expectPhase(page, "genesis", "genesis");
  expect(shell.picking, "no picker is in flight in a browser").toBe(false);
  expect(shell.genesisDir).toBe("/e2e/sketchpad");
});

test("the chord survives a screen it did not start on (board -> map -> board)", async ({
  page,
}) => {
  await openShell(page);
  await armChordWitness(page);
  await applyStatus(page, { kind: "open", snapshot: boardFixture(1) });
  await expectPhase(page, "open", "board");

  // The map is a pane, not a phase — and it has its own ⌘F key, which is
  // the nearest thing this app has to a second accelerator owner.
  await page.getByTestId("pane-rail-map").click(); // trusted click
  await expect(page.getByTestId("map-view")).toBeVisible();
  expect((await press(page, "Meta+o")).prevented, "⌘O is claimed on the map").toBe(true);
  expect((await press(page, "Meta+n")).prevented, "⌘N is claimed on the map").toBe(true);

  // With the map's search field focused — a real text input, real focus.
  // ⌘O and ⌘N are not text-editing keys, so they keep working (criterion
  // 6), while the map's own ⌘F stays the map's.
  const search = page.getByTestId("map-search");
  await search.click(); // trusted click, real focus
  await expect(search).toBeFocused();
  await page.keyboard.type("C-05"); // real typing, unaffected
  await expect(search).toHaveValue("C-05");
  expect((await press(page, "Meta+o")).prevented, "⌘O works from a focused input").toBe(true);
  await expect(search, "and the chord typed nothing into it").toHaveValue("C-05");

  await page.getByTestId("pane-rail-board").click();
  await expect(page.getByTestId("map-view")).toHaveCount(0);
  expect((await press(page, "Meta+o")).prevented, "⌘O is claimed back on the board").toBe(true);
});
