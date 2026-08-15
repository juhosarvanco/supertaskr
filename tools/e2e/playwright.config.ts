import { defineConfig, devices } from "@playwright/test";
import { appDir, assertLanePreconditions, resolveLanePort } from "./preflight";

/**
 * The real-input E2E lane (T-020): Playwright drives the app's DEV
 * bundle in headless Chromium with TRUSTED input — the event-timing
 * class T-005's rejection proved synthetic dispatch can never reproduce
 * (microtask checkpoints between listeners detach the clicked node
 * mid-propagation; see docs/CONVENTIONS.md, the pointerdown gotcha).
 *
 * Port discipline: the lane always owns its own vite dev server on
 * NPUTER_E2E_PORT (default 14520). resolveLanePort THROWS on 1420 — the
 * human's live app — and reuseExistingServer stays false so the lane
 * never attaches to a server it does not own.
 */

const port = resolveLanePort();
assertLanePreconditions(port);

export default defineConfig({
  testDir: "./tests",
  // retries: 0, always: a retry would mask exactly the trusted-timing
  // flake class this lane exists to catch — a failure must stay loud.
  retries: 0,
  // One worker: every spec drives the same dev server with its own
  // fresh page; serial execution keeps failures attributable.
  workers: 1,
  forbidOnly: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    // T-005's repro geometry — the rejection was observed at 1280x720.
    viewport: { width: 1280, height: 720 },
    trace: "retain-on-failure",
  },
  projects: [
    // Chromium only, v1 (plan §2): the rejection class was OBSERVED in
    // Chromium and the mechanism is per-spec; every extra engine is a
    // fresh flake surface. Adding `webkit` here is the named growth step.
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // CLI flags only — vite.config.ts stays untouched (T-005 verifier
    // precedent). strictPort in the app's config makes a busy port fail
    // loudly instead of silently drifting to another port.
    command: `npm run dev -- --port ${port} --host 127.0.0.1`,
    cwd: appDir,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "pipe",
    timeout: 60_000,
  },
});
