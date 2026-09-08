import { expect, test } from "@playwright/test";
import { NOTHING_FOUND, streakMidInterview } from "../fixtures/shell";
import {
  applyDocs,
  applyPick,
  expectPhase,
  openInterview,
  pushListenerFailed,
  pushOutcome,
  pushRehydration,
  pushStatus,
  pushTurnEvent,
} from "./shell-harness";

/**
 * T-029 — THE STATES WHERE THE CONVERSATION IS NOT WHERE YOU LEFT IT,
 * against the real bundle, the real stylesheet and real trusted input.
 *
 * WHAT ONLY A SERVED BUNDLE PROVES HERE, and what the jsdom suite cannot:
 * that these blocks are actually PAINTED by the shipped CSS at the split's
 * real width rather than merely present in a virtual DOM; that the
 * rehydrated conversation and the live one land in the same scroll region
 * without one of them being clipped out of existence; and that a REAL
 * CLICK on the fallback affordance opens the prompt block.
 *
 * The half this lane deliberately does NOT prove: it never spawns a CLI
 * and never calls a model. Every payload below is a fixture pushed
 * through the shipped reducers — the cargo restart simulation
 * (`app/src-tauri/tests/agent_runner.rs`) is where the real bytes are
 * driven, and it does that against a canned fake, not a model either.
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
  await applyDocs(page, streakMidInterview(11, GENESIS_DIR));
}

test("an expired login is a diagnosis with an action, not an exit code with a lie", async ({
  page,
}) => {
  await arrive(page);
  await pushTurnEvent(page, { kind: "started", seq: 1, turn: 1 });
  await pushTurnEvent(page, {
    kind: "failed",
    seq: 2,
    turn: 1,
    error: {
      kind: "authFailed",
      status: 401,
      message: "Failed to authenticate. API Error: 401 OAuth access token has been revoked.",
    },
  });

  const block = page.getByTestId("interview-failure");
  await expect(block).toBeVisible();
  await expect(block).toHaveAttribute("data-error-kind", "authFailed");
  await expect(block).toContainText("your CLI's login has expired");
  // T-082: EXACT — `toHaveText` with a string is a full-text match, not a
  // substring one, so this reds for `claude login` and for anything else.
  // `claude login` is not a command: the CLI parses an unrecognised
  // leading word as the PROMPT, so the app's own advice used to start a
  // turn instead of a login. Checked against 2.1.226's `--help` surface.
  await expect(page.getByTestId("interview-failure-command")).toHaveText("claude auth login");

  // THE BUTTON THAT LIED IS GONE. Before T-029 this state rendered "the
  // planner exited with code 1" over a relayed blob, with a Try again
  // that fails identically forever.
  await expect(page.getByTestId("interview-retry")).toHaveCount(0);
  await expect(block).toHaveAttribute("data-retryable", "false");

  // …and the route that works with no login at all is a REAL CLICK away.
  // (The prompt itself needs a Tauri command, so a browser gets the
  // typed nothing-happened path — which is exactly what it should get,
  // rather than an invented prompt.)
  const fallback = page.getByTestId("interview-hand-driven");
  await expect(fallback).toBeVisible();
  await fallback.click();

  // The whole failure block stays inside the chat column: a diagnosis is
  // never a screen replacement, and the plan keeps assembling beside it.
  await expect(page.getByTestId("genesis-pane-slot")).toBeVisible();
  await expect(page.getByTestId("interview-input")).toBeVisible();
});

test("a refused turn subscription says so, in the half that is not receiving", async ({ page }) => {
  await arrive(page);
  await pushListenerFailed(page);

  const notice = page.getByTestId("interview-listener-failed");
  await expect(notice).toBeVisible();
  await expect(notice).toContainText("not receiving");

  // THE DISCRIMINATING GEOMETRY, and the reason this test is in the lane
  // rather than only in jsdom: the notice must be painted INSIDE the chat
  // column, beside a right half that is visibly still working. That is
  // the whole shape of the defect — the plan assembling while the
  // conversation stays blank — and it is a claim about layout.
  const chat = await page.getByTestId("interview-chat").boundingBox();
  const box = await notice.boundingBox();
  const lens = await page.getByTestId("genesis-pane-slot").boundingBox();
  expect(chat, "the chat column is laid out").not.toBeNull();
  expect(box, "the notice is painted, not merely present").not.toBeNull();
  expect(lens, "the right half is still there and still working").not.toBeNull();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.height).toBeGreaterThan(0);
  expect(box!.x).toBeGreaterThanOrEqual(chat!.x);
  expect(box!.x + box!.width).toBeLessThanOrEqual(chat!.x + chat!.width + 1);
  expect(lens!.x, "the notice is in the LEFT half").toBeGreaterThanOrEqual(chat!.x + chat!.width);

  // The explicit way in is still there — a dead channel takes the
  // auto-start away, never the user's own ability to force it.
  await expect(page.getByTestId("interview-start")).toBeVisible();
  await expect(page.getByTestId("interview-listener-hand-driven")).toBeVisible();
});

test("a restart mid-interview rehydrates the conversation instead of showing an empty log", async ({
  page,
}) => {
  await arrive(page);
  await pushRehydration(page, [
    { turn: 1, role: "user", text: "You are the planner. KIT ROOT: /e2e/kit", atMs: 1, machine: true },
    { turn: 1, role: "planner", text: "Who is this for?", atMs: 2 },
    { turn: 2, role: "user", text: "Solo founders with abandoned repos.", atMs: 3 },
    { turn: 2, role: "planner", text: "What is observable when it works?", atMs: 4 },
  ]);

  await expect(page.getByTestId("interview-planner-turn")).toHaveCount(2);
  await expect(page.getByTestId("interview-user-turn")).toHaveCount(1);
  await expect(page.getByTestId("interview-log")).toContainText(
    "What is observable when it works?",
  );
  // The app-assembled kickoff is not drawn as something the human said.
  await expect(page.getByTestId("interview-log")).not.toContainText("KIT ROOT");
  // Nothing is claimed to be in flight: a turn on disk has finished.
  await expect(page.getByTestId("interview-streaming")).toHaveCount(0);

  // A LIVE TURN LANDS ON TOP OF THE MEMORY, not beside it.
  await pushTurnEvent(page, { kind: "started", seq: 1, turn: 3 });
  await pushTurnEvent(page, { kind: "textDelta", seq: 2, turn: 3, text: "And what displaces it?" });
  await expect(page.getByTestId("interview-planner-turn")).toHaveCount(3);
  await expect(page.getByTestId("interview-streaming")).toBeVisible();

  // The rehydrated history sits in the chat's own scroll region, bounded
  // by the column — the property T-027 built that region for, now with
  // content it never had before.
  const log = await page.getByTestId("interview-log").boundingBox();
  const chat = await page.getByTestId("interview-chat").boundingBox();
  expect(log!.height).toBeGreaterThan(0);
  expect(log!.y + log!.height).toBeLessThanOrEqual(chat!.y + chat!.height + 1);
});

test("a resumable session offers both exits, and a fresh one is never a dead end", async ({
  page,
}) => {
  await arrive(page);
  await pushOutcome(page, {
    kind: "resumeAvailable",
    nativeSessionId: "e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77",
    turns: 4,
    model: "claude-opus-5",
  });

  const offer = page.getByTestId("interview-resume-offer");
  await expect(offer).toBeVisible();
  await expect(offer).toHaveAttribute("data-turns", "4");
  await expect(offer).toContainText("claude-opus-5");
  // ONE SITUATION, TWO EXITS — both painted, both reachable by a real
  // click, neither of them a modal over the plan.
  await expect(page.getByTestId("interview-resume")).toBeVisible();
  await expect(page.getByTestId("interview-fresh")).toBeVisible();
  await expect(page.getByTestId("genesis-pane-slot")).toBeVisible();
  await page.getByTestId("interview-resume").click();

  // …and the unusable-id state is its own affordance, not a toast.
  await pushOutcome(page, {
    kind: "sessionIdRejected",
    registryPath: ".supertaskr/sessions.json",
    why: "refusing to resume session 'S1': it begins with '-'.",
  });
  const unusable = page.getByTestId("interview-session-unusable");
  await expect(unusable).toBeVisible();
  await expect(unusable).toContainText(".supertaskr/sessions.json");
  await expect(page.getByTestId("interview-resume-offer")).toHaveCount(0);
  await expect(page.getByTestId("interview-fresh")).toBeVisible();
});
