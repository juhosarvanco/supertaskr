import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

/**
 * The lane's own credential (T-020 plan §4.1), first: the harness is
 * reachable, and the lane's input is TRUSTED — `isTrusted: true` on a
 * real lane click and a real lane keypress. This guards the lane against
 * ever quietly degrading to synthetic dispatch: a future refactor that
 * swaps real input for `dispatchEvent` fails HERE, not silently — and a
 * synthetic event provably cannot reproduce the T-005 rejection class
 * (microtask checkpoints between listeners only happen for trusted
 * dispatch; see docs/CONVENTIONS.md).
 */

interface TrustRecord {
  click: boolean | undefined;
  key: boolean | undefined;
}

declare global {
  interface Window {
    __laneTrust?: TrustRecord;
  }
}

test("harness present; one lane click and one lane keypress are trusted", async ({ page }) => {
  // openApp fails loudly naming the cause when the harness is absent
  // ("dev-only, non-Tauri; are you serving a prod build?").
  await openApp(page);

  // Capture-phase recorders, installed before any lane input.
  await page.evaluate(() => {
    window.__laneTrust = { click: undefined, key: undefined };
    document.addEventListener(
      "click",
      (event) => {
        window.__laneTrust!.click = event.isTrusted;
      },
      { capture: true },
    );
    document.addEventListener(
      "keydown",
      (event) => {
        window.__laneTrust!.key = event.isTrusted;
      },
      { capture: true },
    );
  });

  await page.mouse.click(640, 360); // one lane click
  await page.keyboard.press("a"); // one lane keypress

  const trust = await page.evaluate(() => window.__laneTrust);
  expect(trust?.click, "a lane click must arrive with isTrusted: true").toBe(true);
  expect(trust?.key, "a lane keypress must arrive with isTrusted: true").toBe(true);
});
