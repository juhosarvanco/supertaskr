import { expect, type Locator, type Page } from "@playwright/test";
import type { DocsSnapshotPayload } from "../fixtures/board";
import type {
  PickOutcomePayload,
  ProjectStatusPayload,
  ShellHarnessSnapshot,
  StartupStep,
} from "../fixtures/shell";
import { openApp } from "./helpers";

/**
 * Driving T-041's shell harness from the lane. `window.__nputerShellHarness`
 * exists only on a non-Tauri DEV bundle; synthetic calls are fine for STATE
 * plumbing (plan §3) — only INPUT must be trusted, and every activation in
 * these specs is a real Playwright click or keypress.
 */

declare global {
  interface Window {
    __nputerShellHarness?: {
      applyProjectStatus: (status: ProjectStatusPayload) => void;
      applyPickOutcome: (outcome: PickOutcomePayload) => void;
      applyStartupFailure: (step: StartupStep, reason: unknown) => void;
      getShell: () => ShellHarnessSnapshot;
    };
  }
}

/** Open the dev bundle and wait for BOTH harnesses. Fails loudly naming
 * the cause (criterion 4) — the shell harness is dev-only and non-Tauri,
 * and its absence is the exact condition T-026's verifier hit. */
export async function openShell(page: Page): Promise<void> {
  await openApp(page);
  try {
    await page.waitForFunction(() => window.__nputerShellHarness !== undefined, undefined, {
      timeout: 15_000,
    });
  } catch {
    throw new Error(
      "window.__nputerShellHarness never appeared — the shell harness is " +
        "dev-only and non-Tauri (T-041, watcher-store.ts). Are you serving a " +
        "prod build, or a bundle from before the harness landed? Without it " +
        "the served bundle can only reach phase \"open\".",
    );
  }
}

/** Hand the shell the status Rust's `docs_snapshot` would have answered. */
export async function applyStatus(page: Page, status: ProjectStatusPayload): Promise<void> {
  await page.evaluate((s) => {
    window.__nputerShellHarness!.applyProjectStatus(s);
  }, status);
}

/** Hand the shell the outcome one of the three picker commands would
 * have answered — everything `runPicker` does after `invoke` resolves. */
export async function applyPick(page: Page, outcome: PickOutcomePayload): Promise<void> {
  await page.evaluate((o) => {
    window.__nputerShellHarness!.applyPickOutcome(o);
  }, outcome);
}

/**
 * Hand the shell the startup failure the store's own catch would have
 * recorded (T-050). It calls `recordStartupFailure` itself — the very
 * function `startDocsWatcher` calls when `listen` or `invoke` rejects —
 * so what renders here is the shipped state and not a lane-side copy of
 * it. A served bundle cannot fail at startup on its own (a browser
 * awaits neither), which is the whole reason this door exists.
 */
export async function applyStartupFailure(
  page: Page,
  step: StartupStep,
  reason: string,
): Promise<void> {
  await page.evaluate(
    (f) => {
      window.__nputerShellHarness!.applyStartupFailure(f.step, f.reason);
    },
    { step, reason },
  );
}

/** Push one snapshot through the docs harness — the watcher's own path
 * (`applyDocsPayload`), which is what makes docs LANDING under a genesis
 * project the same event here as in the shipped app. */
export async function applyDocs(page: Page, payload: DocsSnapshotPayload): Promise<void> {
  await page.evaluate((p) => {
    window.__nputerDocsHarness!.apply(p);
  }, payload);
}

export function getShell(page: Page): Promise<ShellHarnessSnapshot> {
  return page.evaluate(() => window.__nputerShellHarness!.getShell());
}

/**
 * Assert the shell is in `phase`, and that the rendered screen agrees.
 * The PHASE is the claim (criterion 2): `data-screen` alone would let a
 * spec pass on a different screen — noProject, noDocs and a rejected
 * pick all render `data-screen="empty"`, and an open project with an
 * undismissed rejection renders "empty" while its phase is "open".
 */
export async function expectPhase(
  page: Page,
  phase: ShellHarnessSnapshot["phase"],
  screen: ShellHarnessSnapshot["screen"],
): Promise<ShellHarnessSnapshot> {
  const shell = await getShell(page);
  expect(shell.phase, `the shell must be in phase ${phase}`).toBe(phase);
  expect(shell.screen, `phase ${phase} selects screen ${screen}`).toBe(screen);
  // The DOM's own stamp must agree with the harness's read — otherwise
  // one of the two is describing a shell nobody is looking at.
  await expect(page.getByTestId("docs-model")).toHaveAttribute("data-screen", screen);
  return shell;
}

/**
 * The computed value of a token, as THIS page resolves it — a probe
 * element carrying `color: var(--name)`, read back through
 * getComputedStyle. Real CSS, not the stylesheet's source text: it
 * proves the served sheet defines the token and the browser resolves it,
 * in the same `rgb(...)` form a real element's computed style reports.
 */
export async function tokenColor(page: Page, name: string): Promise<string> {
  return page.evaluate((token) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${token})`;
    document.body.appendChild(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, name);
}

/** One computed style property of a rendered element. */
export function computed(locator: Locator, property: string): Promise<string> {
  return locator.evaluate(
    (el, prop) => getComputedStyle(el).getPropertyValue(prop),
    property,
  );
}

/* ---- T-027: the interview harness ------------------------------------
 *
 * A SECOND dev-gated window property, and therefore a second gate to
 * audit. It exists because a served bundle has no Tauri — hence no
 * runner, no CLI and no watcher — so the ONLY way this lane can walk a
 * scripted interview against the real bundle and the real CSS is to hand
 * the shipped reducers the events Rust would have emitted. The gate is
 * proved and drilled in `app/test/interview-harness.test.ts`; what this
 * module adds is the driving.
 *
 * THE TYPES BELOW ARE A HAND MIRROR, and it is named rather than quietly
 * inherited. The source of truth is `app/src-tauri/src/agent/runner.rs`'s
 * `RunEvent` / `TurnError` / `GenesisStatus`; `app/src/lib/agent-store.ts`
 * mirrors them in TS, and this is the THIRD copy. Nothing compares the
 * three. That is T-041-s2's exact gap, widened by one — the honest
 * closer is a cargo test dumping real emitted JSON into a committed
 * fixture both TS sides read, which needs `app-agent`'s lane.
 */

export type GenesisEventPayload =
  | { kind: "started"; seq: number; turn: number }
  | { kind: "textDelta"; seq: number; turn: number; text: string }
  | { kind: "activity"; seq: number; turn: number; label: string }
  | { kind: "completed"; seq: number; turn: number; text: string; truncatedRelay: boolean }
  | { kind: "failed"; seq: number; turn: number; error: TurnErrorPayload }
  | { kind: "sessionRegistered"; seq: number; nativeSessionId: string };

export type TurnErrorPayload =
  | { kind: "spawnFailed"; os: string }
  | { kind: "startTimeout" }
  | { kind: "stall" }
  | { kind: "exitNonZero"; code: number | null; stderrTail: string }
  | { kind: "malformedStream"; why: string };

export type GenesisOutcomePayload =
  | { kind: "started"; turn: number }
  | { kind: "accepted"; turn: number }
  | { kind: "busy" }
  | { kind: "noProject" }
  | { kind: "noSession" }
  | { kind: "alreadyPlanned"; path: string }
  | { kind: "resumeAvailable"; nativeSessionId: string; turns: number }
  | { kind: "staleProject"; sessionProject: string }
  | { kind: "cliNotFound"; probed: string[] }
  | { kind: "unsupportedVersion"; found: string }
  | { kind: "error"; message: string };

export interface GenesisStatusPayload {
  phase: "idle" | "running" | "failed";
  projectDir: string | null;
  turn: number;
  nativeSessionId: string | null;
  cliVersion: string | null;
  methodVersion: string;
  lastError: TurnErrorPayload | null;
  lastEventAtMs: number | null;
}

declare global {
  interface Window {
    __nputerInterviewHarness?: {
      push: (event: GenesisEventPayload) => void;
      outcome: (outcome: GenesisOutcomePayload) => void;
      status: (payload: GenesisStatusPayload) => void;
      get: () => { phase: string; seq: number; turns: unknown[] };
      sent: () => readonly string[];
    };
  }
}

/** Open the dev bundle and wait for ALL THREE harnesses. Fails loudly
 * naming the cause: the interview harness is dev-only and non-Tauri. */
export async function openInterview(page: Page): Promise<void> {
  await openShell(page);
  try {
    await page.waitForFunction(() => window.__nputerInterviewHarness !== undefined, undefined, {
      timeout: 15_000,
    });
  } catch {
    throw new Error(
      "window.__nputerInterviewHarness never appeared — the interview " +
        "harness is dev-only and non-Tauri (T-027, genesis/interview-source.ts). " +
        "Are you serving a prod build? Without it a browser can only ever " +
        "reach the interview's empty frame.",
    );
  }
}

/** Push one `genesis-turn` payload through the SHIPPED reducer. */
export async function pushTurnEvent(page: Page, event: GenesisEventPayload): Promise<void> {
  await page.evaluate((e) => {
    window.__nputerInterviewHarness!.push(e);
  }, event);
}

/** Push a start/send outcome through the shipped reducer. */
export async function pushOutcome(page: Page, outcome: GenesisOutcomePayload): Promise<void> {
  await page.evaluate((o) => {
    window.__nputerInterviewHarness!.outcome(o);
  }, outcome);
}

/** Hand the screen the mount-time status `genesis_status` would answer. */
export async function pushStatus(
  page: Page,
  patch: Partial<GenesisStatusPayload> = {},
): Promise<void> {
  await page.evaluate((p) => {
    window.__nputerInterviewHarness!.status({
      phase: "idle",
      projectDir: null,
      turn: 0,
      nativeSessionId: null,
      cliVersion: "2.1.226 (Claude Code)",
      methodVersion: "0.1.5",
      lastError: null,
      lastEventAtMs: null,
      ...p,
    });
  }, patch);
}

/** What the UI ASKED to send, in order. `sendGenesisTurn` returns before
 * `invoke` on a non-Tauri runtime, so without this a served bundle can
 * prove a keystroke was claimed but never that it reached a command. */
export function sentAnswers(page: Page): Promise<readonly string[]> {
  return page.evaluate(() => window.__nputerInterviewHarness!.sent());
}
