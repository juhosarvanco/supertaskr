import { expect, test, type Page } from "@playwright/test";
import { NOTHING_FOUND, streakFixture, streakMidInterview } from "../fixtures/shell";
import {
  applyDocs,
  applyPick,
  computed,
  expectPhase,
  openInterview,
  pushOutcome,
  pushStatus,
  pushTurnEvent,
  sentAnswers,
  tokenColor,
} from "./shell-harness";

/**
 * T-027 — THE INTERVIEW, WALKED END TO END against the real bundle, the
 * real CSS and real trusted input.
 *
 * WHY THIS SHAPE, and it is a deliberate correction the plan applied to
 * the card's own Verification line: the original third leg asked for "a
 * served-bundle probe driving the fake CLI to write real files". No
 * browser can do that — it has no Tauri, therefore no runner, no CLI and
 * no watcher. The spawn -> agent-writes -> watcher half is already proven
 * RUST-side by T-025's `writes-docs` scenario and its two-direction
 * watcher test, and nothing here re-proves it.
 *
 * What a served bundle CAN prove, and what nothing else can: that the
 * shipped stylesheet actually paints the challenge treatment, that the
 * split has the geometry the ruling asked for at real widths, that both
 * scroll regions engage under a real wheel, and that a REAL keypress in
 * a REAL textarea reaches a send with the typed text. Every activation
 * below is trusted input (`page.keyboard`, `page.mouse`, a real click);
 * only STATE is pushed through the harnesses, which is the plan's
 * standing division.
 */

const GENESIS_DIR = "/e2e/streak";

/** Arrive on the interview screen with a status answered — the frame the
 * user actually lands on. */
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

test("the whole interview: start, question, answer, challenge, chips, failure, retry", async ({
  page,
}) => {
  await arrive(page);

  // --- the first frame ------------------------------------------------
  const chat = page.getByTestId("interview-chat");
  await expect(chat).toBeVisible();
  // The auto-start's affordance is on screen because nothing has started
  // — the browser has no `genesis_start` to answer, which is exactly the
  // state the explicit way in exists for.
  await expect(page.getByTestId("interview-start")).toBeVisible();
  await expect(page.getByTestId("interview-stage-segment")).toHaveCount(7);

  // --- turn 1 streams in ----------------------------------------------
  await pushTurnEvent(page, { kind: "started", seq: 1, turn: 1 });
  await pushTurnEvent(page, { kind: "textDelta", seq: 2, turn: 1, text: "Who feels the pain " });
  await pushTurnEvent(page, { kind: "activity", seq: 3, turn: 1, label: "Write" });
  // Mid-stream: the pulse dot and the last activity label, and the hint
  // slot advertising the cancel chord.
  await expect(page.getByTestId("interview-streaming")).toContainText("Write");
  await expect(page.getByTestId("interview-hint")).toContainText("to stop");
  await expect(page.getByTestId("interview-input")).toBeDisabled();

  await pushTurnEvent(page, {
    kind: "completed",
    seq: 4,
    turn: 1,
    text: "Who feels the pain first — and what do they do today instead?",
    truncatedRelay: false,
  });
  await expect(page.getByTestId("interview-streaming")).toHaveCount(0);
  await expect(page.getByTestId("interview-turn-current")).toContainText(
    "Who feels the pain first",
  );
  await expect(page.getByTestId("interview-start"), "started: nothing left to start").toHaveCount(
    0,
  );

  // --- a REAL answer, typed with REAL keys ----------------------------
  const box = page.getByTestId("interview-input");
  await expect(box).toBeEnabled();
  await box.click(); // trusted
  await page.keyboard.type("Solo builders running agent CLIs."); // trusted
  // Shift+Enter is a newline, not a send — proven by the value growing.
  await page.keyboard.press("Shift+Enter"); // trusted
  await page.keyboard.type("They keep the plan in their head.");
  expect(await box.inputValue()).toContain("\n");
  expect(await sentAnswers(page), "nothing has been sent yet").toEqual([]);

  await page.keyboard.press("Enter"); // trusted
  // THE PROOF A KEYSTROKE REACHED A COMMAND, not merely a component:
  // `sendGenesisTurn` returns before `invoke` in a browser, so without
  // the ledger a screen that silently dropped every answer would pass.
  expect(await sentAnswers(page)).toEqual([
    "Solo builders running agent CLIs.\nThey keep the plan in their head.",
  ]);
  await expect(page.getByTestId("interview-user-turn")).toContainText("Solo builders");
  await expect(box, "the box is cleared for the next answer").toHaveValue("");

  // --- docs land: the banked chip, from FILE EVIDENCE ------------------
  await applyDocs(page, streakFixture(11, GENESIS_DIR));
  const chip = page.getByTestId("interview-banked").first();
  await expect(chip).toBeVisible();
  await expect(chip).toContainText("docs/");
  // Paths, not the design's section names — T-024's own deviation.
  await expect(chip).toContainText(".md");
  // The stage strip followed the DERIVED stage, not the chips: the
  // streak tree is a finished plan, so every question is behind us.
  await expect(page.getByTestId("interview-stage-readout")).toHaveText(
    "stage 7 of 7 · decomposition",
  );
  expect(
    await page
      .getByTestId("interview-stage-segment")
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-state"))),
  ).toEqual(["done", "done", "done", "done", "done", "done", "done"]);

  // --- the challenge turn, painted by the REAL sheet -------------------
  await pushOutcome(page, { kind: "accepted", turn: 2 });
  await pushTurnEvent(page, { kind: "started", seq: 5, turn: 2 });
  await pushTurnEvent(page, {
    kind: "completed",
    seq: 6,
    turn: 2,
    text: 'pushing back: You said "fast". Compared to what, and measured how?',
    truncatedRelay: false,
  });
  const challenge = page.getByTestId("interview-turn-challenge");
  await expect(challenge).toBeVisible();
  await expect(challenge).toContainText("planner · pushing back");
  await expect(challenge).toContainText('You said "fast". Compared to what');
  await expect(challenge, "the marker is consumed by the label").not.toContainText(
    "pushing back: You said",
  );
  // The values the design specifies, resolved from the SERVED sheet.
  expect(await computed(challenge, "background-color")).toBe(
    await tokenColor(page, "--interview-challenge-bg"),
  );
  expect(await computed(challenge, "border-left-color")).toBe(
    await tokenColor(page, "--chart-4"),
  );
  expect(await computed(challenge, "border-left-width")).toBe("2px");
  // The design's asymmetric radius: square on the ruled edge.
  expect(await computed(challenge, "border-top-left-radius")).toBe("0px");
  expect(await computed(challenge, "border-top-right-radius")).not.toBe("0px");

  // --- a typed failure, and the way out --------------------------------
  // Answer the challenge first, so there IS a stored answer for the turn
  // that fails — a retry with nothing to re-send is a different case.
  await page.getByTestId("interview-input").click(); // trusted
  await page.keyboard.type("Idea to a dispatchable board in 30 minutes."); // trusted
  await page.keyboard.press("Enter"); // trusted
  expect(await sentAnswers(page)).toHaveLength(2);

  await pushOutcome(page, { kind: "accepted", turn: 3 });
  await pushTurnEvent(page, { kind: "started", seq: 7, turn: 3 });
  await pushTurnEvent(page, {
    kind: "failed",
    seq: 8,
    turn: 3,
    error: {
      kind: "exitNonZero",
      code: 1,
      stderrTail: "Failed to authenticate. API Error: 401 OAuth access token has been revoked.",
    },
  });
  const failure = page.getByTestId("interview-failure");
  await expect(failure).toBeVisible();
  await expect(failure).toHaveAttribute("data-error-kind", "exitNonZero");
  // The CLI's own words, relayed rather than classified (T-025's smoke).
  await expect(failure).toContainText("OAuth access token has been revoked");
  // NOTHING BANKED IS LOST — the chip from before the failure is still
  // on screen, which is the criterion's own phrase asserted positively.
  await expect(page.getByTestId("interview-banked").first()).toBeVisible();
  // And the interview is resumable: the input came back.
  await expect(page.getByTestId("interview-input")).toBeEnabled();

  // A real click on the retry: it re-issues the command that produced
  // the failure, with the SAME argument — no backoff, no attempt
  // counter, no retry state machine.
  await page.getByTestId("interview-retry").click(); // trusted
  const sent = await sentAnswers(page);
  expect(sent, "the retry issued a third send").toHaveLength(3);
  expect(sent[2], "…carrying the same stored answer, byte for byte").toBe(sent[1]);
});

test("the challenge treatment survives the theme, in both schemes", async ({ page }) => {
  await arrive(page);
  await pushTurnEvent(page, { kind: "started", seq: 1, turn: 1 });
  await pushTurnEvent(page, {
    kind: "completed",
    seq: 2,
    turn: 1,
    text: "pushing back: give me the number you would be embarrassed to miss.",
    truncatedRelay: false,
  });
  const challenge = page.getByTestId("interview-turn-challenge");
  const light = await computed(challenge, "background-color");
  expect(light).toBe(await tokenColor(page, "--interview-challenge-bg"));

  await page.getByRole("button", { name: "Toggle theme" }).click(); // trusted
  await expect(page.locator("html")).toHaveClass(/dark/);
  const dark = await computed(challenge, "background-color");
  // BOTH tokens really do have a dark value — the whole reason this
  // assertion exists is that the design bundle has NO dark interview
  // screen at all, so these two are family-derived and unchecked by any
  // mockup. @human's dark pass is the only thing that can judge them;
  // what this proves is that they exist and that they MOVE.
  expect(dark, "the challenge paper changes with the scheme").not.toBe(light);
  expect(dark).toBe(await tokenColor(page, "--interview-challenge-bg"));
  expect(
    await computed(
      page.getByTestId("interview-turn-challenge").locator("[data-testid=interview-turn-body]"),
      "color",
    ),
  ).toBe(await tokenColor(page, "--interview-challenge-ink"));
  await page.getByRole("button", { name: "Toggle theme" }).click();
});

/**
 * T-027 — THE SPLIT'S GEOMETRY, MEASURED AT THE BREAKPOINT'S EDGES.
 *
 * The @human ruling is 640px of chat with the lens beside it, and the
 * lens renders at `lg` (1024) and above — which is why 1023 and 1024 are
 * measured rather than assumed.
 *
 * A MEASURED CORRECTION TO THE PLAN'S OWN ARITHMETIC, recorded because a
 * number in a card is evidence to reproduce: the plan computed the lens
 * as W-641 ("at 1440 -> 799, the design's own number"), adding the 1px
 * rule to the 640. The app's box model is BORDER-BOX (Tailwind's
 * preflight), so the rule is INSIDE the 640 and the lens gets W-640 —
 * 800 at 1440, 640 at 1280, 384 at 1024. One pixel wider than forecast
 * at every size, and measured here rather than restated.
 */
test("the split is 640 + the lens at >=1024, and the chat alone below it", async ({ page }) => {
  await arrive(page);
  // T-028 RECONCILE: the tree one turn before decomposition, so the LENS
  // is what the geometry below is measured against. The full tree renders
  // the board in the same slot — same box, same rule, same widths — and
  // `crescendo.spec.ts` measures that half.
  await applyDocs(page, streakMidInterview(11, GENESIS_DIR));

  const chat = page.getByTestId("interview-chat");
  const slot = page.getByTestId("genesis-pane-slot");

  for (const width of [1440, 1280, 1024]) {
    await page.setViewportSize({ width, height: 800 });
    const at = `${width}px`;
    await expect(slot, `the lens renders at ${at}`).toBeVisible();
    const chatBox = (await chat.boundingBox())!;
    const slotBox = (await slot.boundingBox())!;
    expect(Math.round(chatBox.width), `the chat is the design's 640 at ${at}`).toBe(640);
    // The rule belongs to the chat's own edge; the lens has no border.
    expect(await computed(chat, "border-right-width")).toBe("1px");
    expect(await computed(slot, "border-left-width")).toBe("0px");
    expect(Math.round(slotBox.width), `the lens takes the rest at ${at}`).toBe(width - 640);
    // Flush: no gap element and no card frame between the halves. The
    // rule lives inside the chat's own 640 (border-box), so the two
    // boxes ABUT rather than sitting a pixel apart.
    expect(Math.round(slotBox.x - (chatBox.x + chatBox.width))).toBe(0);
  }

  // 1023 is the other side of the same line.
  await page.setViewportSize({ width: 1023, height: 800 });
  await expect(slot, "below lg the lens is not rendered").toBeHidden();
  await expect(chat, "…and the chat takes the frame").toBeVisible();
  expect(Math.round((await chat.boundingBox())!.width)).toBe(640);

  // And at the app's OWN configured window the chat is narrower than 640
  // but entirely usable — the consequence flagged to @human, asserted so
  // it cannot regress into something worse without saying so.
  await page.setViewportSize({ width: 800, height: 600 });
  await expect(slot).toBeHidden();
  await expect(chat).toBeVisible();
  await expect(page.getByTestId("interview-input")).toBeVisible();
  await expect(page.getByTestId("interview-log")).toBeVisible();
  // The chat CENTRES at its 640 rather than stretching: a 640px column
  // is what the conversation was designed for, and letting it run to
  // 800 would give the one screen that is all prose the longest measure
  // in the app. 80px of ground each side.
  const alone = (await chat.boundingBox())!;
  expect(Math.round(alone.width)).toBe(640);
  expect(Math.round(alone.x), "centred, not left-aligned").toBe(80);
});

/**
 * T-048's claim, re-run for a screen that now has TWO scroll regions.
 * The page must never grow past the window at any of the four sizes, and
 * each region must be the one asked to scroll.
 */
test("the frame holds and BOTH regions scroll at 800x600 / 1024x768 / 1280x720 / 1440x900", async ({
  page,
}) => {
  await arrive(page);
  // T-028 RECONCILE: the lens's tree, because the loop below asserts the
  // LENS's own scroll region. The board half's region gets the identical
  // assertion in `crescendo.spec.ts`.
  await applyDocs(page, streakMidInterview(11, GENESIS_DIR));
  // Enough transcript that the chat's own region has something to scroll.
  for (let turn = 1; turn <= 8; turn += 1) {
    await pushTurnEvent(page, { kind: "started", seq: turn * 2 - 1, turn });
    await pushTurnEvent(page, {
      kind: "completed",
      seq: turn * 2,
      turn,
      text:
        `Question ${turn}: ` +
        "what must be true about the machine this runs on, and what would you " +
        "give up to keep it true? ".repeat(3),
      truncatedRelay: false,
    });
  }

  const log = page.getByTestId("interview-log");
  for (const viewport of [
    { width: 800, height: 600 },
    { width: 1024, height: 768 },
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    const at = `${viewport.width}x${viewport.height}`;
    const layout = await log.evaluate((el) => ({
      overflowY: getComputedStyle(el).overflowY,
      scrollHeight: el.scrollHeight,
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
    expect(layout.overflowY, `the chat's region exists at ${at}`).toBe("auto");
    expect(
      layout.scrollHeight,
      `the chat's own region is the one asked to scroll at ${at}`,
    ).toBeGreaterThan(layout.clientHeight);

    // The lens's region, where the lens renders at all.
    //
    // T-027-s5 CAME TRUE, and it is reconciled here rather than nudged.
    // s5 filed this exact assertion for having ZERO PIXELS OF MARGIN
    // under its `toBeGreaterThan` — and T-028's own reconcile (the lens
    // now renders the tree one turn before decomposition, three artifact
    // rows shorter) tipped it: at 1440x900 the measurement is 780 against
    // a 780 region, EXACTLY equal. The old line was measuring the
    // FIXTURE's height and calling it the frame.
    //
    // So the claim is split into the two things it was conflating. The
    // region is BOUNDED at every size — that is T-048's property, it
    // holds whatever the content is, and it fails loudly if the frame
    // ever stops holding. And it SCROLLS wherever the content genuinely
    // exceeds it, which the shorter viewports still exercise.
    if (viewport.width >= 1024) {
      const pane = page.getByTestId("genesis-pane-slot").locator("div.overflow-y-auto").first();
      const paneLayout = await pane.evaluate((el) => ({
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        overflowY: getComputedStyle(el).overflowY,
      }));
      expect(paneLayout.overflowY, `the lens's region exists at ${at}`).toBe("auto");
      expect(
        paneLayout.clientHeight,
        `the lens's region is bounded inside the window at ${at}`,
      ).toBeLessThan(viewport.height);
      if (viewport.height <= 768) {
        expect(
          paneLayout.scrollHeight,
          `the lens's own region is the one asked to scroll at ${at}`,
        ).toBeGreaterThan(paneLayout.clientHeight);
      }
    }
  }

  // The same claim as BEHAVIOUR, with the trusted input this lane exists
  // for: a real wheel over the transcript scrolls the TRANSCRIPT.
  await page.setViewportSize({ width: 1280, height: 720 });
  const box = (await log.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -2000); // up, away from the sticky bottom
  await expect
    .poll(() => log.evaluate((el) => el.scrollTop), {
      message: "the wheel must scroll the chat's own region",
    })
    .toBeLessThan(50);
  expect(await page.evaluate(() => window.scrollY), "the page never moves").toBe(0);
});

/**
 * The four screens T-027 must NOT have moved. T-027 restructured the
 * genesis screen; this re-runs T-048's criterion-4 table so
 * "byte-identical elsewhere" is measured rather than assumed.
 *
 * T-062 RECONCILE — THE CLAIM CHANGED BECAUSE THE SHELL DID, and the
 * assertions were STRENGTHENED rather than inverted. Each of the three
 * reads below used to require `false`: that was T-048's deliberate
 * scoping, where the interview was the ONE bounded screen and everything
 * else was a growing page. T-062 closed that fork — one scroll model,
 * bounded, on every screen — so the same three reads have to be `true`
 * now. A bare `false` → `true` flip would leave a test that no longer
 * says anything, so each screen is additionally asked for the thing the
 * bound MAKES NECESSARY: its own scroll region. A bounded screen that
 * owns no scroll region is content nobody can reach, which is the exact
 * failure T-062 exists to prevent, and it is a state this loop would
 * otherwise pass straight through.
 */
test("the other screens follow the shell's one scroll model", async ({ page }) => {
  await openInterview(page);

  // 1. the front door
  await expectPhase(page, "browser", "browser");
  await applyDocs(page, { seq: 1, projectDir: "/e2e/p", generatedAtMs: 1, files: [] });

  /** The shell's content column, and whether it is bounded. */
  const bounded = (page: Page): Promise<boolean> =>
    page.evaluate(() =>
      (
        document.querySelector('[data-testid="docs-model"] > div') as HTMLElement
      ).classList.contains("h-screen"),
    );

  /** Does `testId` actually hand its overflow to a scrollbar? Read off
   * COMPUTED style, so it holds whatever the class is spelled. */
  const scrolls = (page: Page, testId: string): Promise<string> =>
    page.evaluate((id) => {
      const el = document.querySelector(`[data-testid="${id}"]`);
      if (el === null) return "absent";
      return getComputedStyle(el as HTMLElement).overflowY;
    }, testId);

  for (const viewport of [
    { width: 800, height: 600 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    const at = `${viewport.width}x${viewport.height}`;

    await page.evaluate(() => {
      window.__supertaskrShellHarness!.applyProjectStatus({ kind: "noProject" });
    });
    await expect(page.getByTestId("empty-state")).toBeVisible();
    expect(await bounded(page), `the front door is bounded at ${at}`).toBe(true);
    expect(await scrolls(page, "empty-state"), `…and owns its scroll region at ${at}`).toBe(
      "auto",
    );

    // 2. the no-plan card — the tallest thing the front door renders
    // (663px at every width, T-048-s4), so it is the one that has to be
    // reachable inside the frame rather than below it.
    await page.evaluate(() => {
      window.__supertaskrShellHarness!.applyPickOutcome({
        kind: "noDocs",
        path: "/e2e/no-plan",
        probe: { roadmap: false, tasks: false, architecture: false, git: true },
      });
    });
    await expect(page.getByTestId("no-plan-heading")).toBeVisible();
    expect(await scrolls(page, "empty-state"), `the no-plan card scrolls at ${at}`).toBe("auto");

    // 3. the board
    await page.evaluate((s) => {
      window.__supertaskrShellHarness!.applyPickOutcome({ kind: "picked", snapshot: s });
    }, streakFixture(20, "/e2e/board"));
    await expectPhase(page, "open", "board");
    await expect(page.getByTestId("pane-rail")).toBeVisible();
    expect(await bounded(page), `the board is bounded at ${at}`).toBe(true);
    expect(await scrolls(page, "board-scroll"), `…and owns its scroll region at ${at}`).toBe(
      "auto",
    );

    // 4. the map
    await page.getByTestId("pane-rail-map").click(); // trusted
    await expect(page.getByTestId("map-view")).toBeVisible();
    expect(await bounded(page), `the map is bounded at ${at}`).toBe(true);
    expect(await scrolls(page, "map-canvas"), `…and the canvas scrolls at ${at}`).toBe("auto");
    await page.getByTestId("pane-rail-board").click(); // trusted
  }
});

/**
 * The interview screen's OWN keys, with real keypresses. The chord half
 * lives in `accelerators.spec.ts`; what this adds is that a real Enter
 * in a real textarea is NOT an accelerator — it never reaches the window
 * table — and that the two chords the app claims everywhere still work
 * from here.
 */
test("Enter is input-local, and the window chords still fire from the interview", async ({
  page,
}) => {
  await arrive(page);
  await pushTurnEvent(page, { kind: "started", seq: 1, turn: 1 });
  await pushTurnEvent(page, {
    kind: "completed",
    seq: 2,
    turn: 1,
    text: "Who feels the pain first?",
    truncatedRelay: false,
  });

  await page.getByTestId("interview-input").click(); // trusted
  await page.keyboard.type("an answer"); // trusted
  await page.keyboard.press("Enter"); // trusted
  expect(await sentAnswers(page)).toEqual(["an answer"]);

  // THE TRIPWIRE, INVERTED (T-028 criterion 6, folding T-027-s1).
  //
  // This line used to read `not.toBeFocused()`, with a compensating
  // `.click()` under it — an honest record of a real defect: the send
  // disables the box, the HTML spec blurs a disabled element, and nothing
  // gave the focus back. On a seven-question conversation that meant
  // reaching for the mouse between every answer.
  //
  // The click is DELETED rather than moved, and that deletion is the
  // assertion: everything below types with the keyboard alone, so a
  // regression cannot be papered over by a spec that quietly clicks first.
  // The box still disables in flight (T-027's criterion 4 is unchanged);
  // what is new is that the focus comes back when the turn leaves it.
  await expect(page.getByTestId("interview-input")).toBeFocused();

  // A bare period types a period — it is not the cancel chord, and the
  // accelerator table's modifier requirement is the whole reason a
  // target-blind listener is safe here. It lands in the box WITHOUT a
  // click, which is criterion 6 asserted as behaviour rather than as
  // state: a keyboard-driven user never reaches for the pointer.
  await page.keyboard.type("."); // trusted
  expect(await page.getByTestId("interview-input").inputValue()).toBe(".");

  // ⌘. is claimed here and reaches `cancelGenesis`, which returns early
  // in a browser — so what a served bundle can prove is that the chord
  // is SWALLOWED here (the app took it) and the screen survives.
  const prevented = await page.evaluate(() => {
    const event = new KeyboardEvent("keydown", {
      key: ".",
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.querySelector("main")!.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented, "the interview claims ⌘.").toBe(true);
  await expect(page.getByTestId("interview-chat"), "and is still standing").toBeVisible();
});
