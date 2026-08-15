import { expect, type Page } from "@playwright/test";
import { boardFixture, type DocsSnapshotPayload } from "../fixtures/board";

/** The dev harness surface the lane drives (watcher-store.ts installs it
 * on non-Tauri DEV bundles only). Synthetic `apply` is fine for STATE
 * plumbing — only INPUT must be trusted (plan §3). */
declare global {
  interface Window {
    __nputerDocsHarness?: {
      apply: (payload: DocsSnapshotPayload) => void;
    };
  }
}

/**
 * Open the dev bundle and wait for the harness. Fails loudly, naming the
 * cause, when the harness never appears (criterion 4): the harness is
 * dev-only and non-Tauri — a prod build or a Tauri runtime never has it.
 */
export async function openApp(page: Page): Promise<void> {
  await page.goto("/");
  try {
    await page.waitForFunction(() => window.__nputerDocsHarness !== undefined, undefined, {
      timeout: 15_000,
    });
  } catch {
    throw new Error(
      "window.__nputerDocsHarness never appeared — the harness is dev-only " +
        "and non-Tauri; are you serving a prod build (or a Tauri runtime) " +
        "instead of `npm run dev`?",
    );
  }
}

/** Apply the shared fixture through the harness and wait for the board. */
export async function openBoard(page: Page, seq = 1): Promise<void> {
  await openApp(page);
  await page.evaluate((payload) => {
    window.__nputerDocsHarness!.apply(payload);
  }, boardFixture(seq));
  await expect(page.getByTestId("docs-model")).toHaveAttribute("data-screen", "board");
  await expect(page.locator('[data-testid="task-card"][data-task-id="T-101"]')).toBeVisible();
}

/** The open task-detail panel (T-005's aside). */
export function detailPanel(page: Page) {
  return page.getByTestId("task-detail-panel");
}

/** A board card's face button (the `data-card-trigger` inside the li). */
export function cardTrigger(page: Page, taskId: string) {
  return page.locator(
    `[data-testid="task-card"][data-task-id="${taskId}"] [data-card-trigger]`,
  );
}
