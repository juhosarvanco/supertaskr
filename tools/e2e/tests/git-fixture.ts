import { rmSync } from "node:fs";
import { test } from "@playwright/test";

/**
 * SHARED DISCIPLINE FOR THE SUITE'S GIT-BUILT SCRATCH FIXTURES (T-178).
 *
 * ── THE MECHANISM, DERIVED RATHER THAN ASSUMED ───────────────────────
 * `git commit` ends by calling git's own `run_auto_maintenance()`, which
 * spawns `git maintenance run --auto --quiet --detach`. **`--detach`
 * daemonizes**: the foreground `git commit` reaps the intermediate and
 * returns while the GRANDCHILD keeps running inside the fixture's
 * `.git`. Measured on this repository's own tree (1025 tracked files,
 * 1171 loose objects in the fixture) with `GIT_TRACE`:
 *
 *   git commit returned after                      73ms
 *   .git/gc.pid appeared                          +108ms
 *   .git/objects/pack/tmp_pack_A3Upb4 appeared    +207ms
 *   .git/objects/pack/pack-<sha>.{pack,idx,rev}   +529ms
 *   .git/objects/info/commit-graph.lock, packs    +596ms
 *   .git/objects/info/commit-graph               +627ms
 *   last live maintenance/gc process observed      562ms after t0
 *
 * So a background git process outlived the foreground command by ~490ms
 * and wrote into exactly two directories: the fixture's `.git` and its
 * `.git/objects`. Those are the two paths CI's two ENOTEMPTY reds named
 * (`…/local/.git/objects` in run 33327281402, `…/local/.git` in run
 * 33333142954) — `rmdir` on a directory a detached `git gc` refilled
 * between the walk's `readdir` and its `rmdir`.
 *
 * The same race has a second face, seen while reproducing this: a
 * foreground `git clone` of the fixture died with `fatal: hardlink
 * different from source at '…/detached/.git/objects/pack/tmp_pack_…'`,
 * which is the clone reading `objects/pack` while the detached child
 * rewrote it. One mechanism, two symptoms.
 *
 * ── WHY BOTH HALVES BELOW, AND NOT EITHER ────────────────────────────
 * `NO_BACKGROUND_MAINTENANCE` removes the CAUSE: with it, git spawns
 * nothing to race (traced — see git-fixture.spec.ts, which carries the
 * positive control). `removeGitFixture` covers what a fixture cannot
 * prove it knows: that no FUTURE git will detach something new. A
 * teardown is not the place to learn that, so the removal retries within
 * a stated bound and, if it still cannot finish, says so AS THE FIXTURE
 * rather than as a failure of the body it happens to follow.
 */

/**
 * Git config that stops a fixture's `git commit` from detaching a
 * background maintenance process into the tree the suite is about to
 * remove. Spread it into every `git` invocation that builds or writes a
 * scratch repository, BEFORE the subcommand — `git -C <dir> -c … <cmd>`.
 *
 * `maintenance.auto=false` is the knob that prevents the SPAWN:
 * `run_auto_maintenance()` reads it first and returns without starting a
 * process. `gc.auto=0` is the weaker neighbour and deliberately not used
 * here — it lets the detached process start and merely declines to pack,
 * so a race window still opens.
 */
export const NO_BACKGROUND_MAINTENANCE: readonly string[] = ["-c", "maintenance.auto=false"];

/**
 * THE BOUND, AND THE REASON, TOGETHER — because a retry with neither is
 * how a rare race becomes a slow suite.
 *
 * Node's `rmSync` does not retry by default, and `force: true` suppresses
 * only MISSING paths; `ENOTEMPTY` on `rmdir` is not a missing path, which
 * is why the un-retried call could fail at all. `maxRetries`/`retryDelay`
 * are Node's own remedy for this class. The delay is CUMULATIVE and grows
 * per attempt (attempt `i` waits `i * retryDelay`), so 5 retries at 50ms
 * is a worst case of 50+100+150+200+250 = 750ms, paid ONLY on a directory
 * that failed to go, and never on a healthy teardown. It is set against a
 * window measured at ~490ms above.
 */
export const FIXTURE_RM_RETRY = { maxRetries: 5, retryDelay: 50 } as const;

/** The worst-case wait the bound above buys, in ms: sum of i*retryDelay. */
export const FIXTURE_RM_MAX_WAIT_MS =
  ((FIXTURE_RM_RETRY.maxRetries * (FIXTURE_RM_RETRY.maxRetries + 1)) / 2) *
  FIXTURE_RM_RETRY.retryDelay;

/** The removal call itself, injectable so the attribution can be driven. */
export type FixtureRemove = (dir: string, options: Parameters<typeof rmSync>[1]) => void;

/** Where a teardown finding goes, injectable for the same reason. */
export type FixtureReport = (finding: string) => void;

export interface FixtureTeardownHooks {
  remove?: FixtureRemove;
  report?: FixtureReport;
}

/** The default channel: the run's log, plus an annotation when inside a test. */
function defaultReport(finding: string): void {
  console.warn(finding);
  try {
    test.info().annotations.push({ type: "fixture-teardown", description: finding });
  } catch {
    // Outside a running test (a worker-level hook, or a direct call) there
    // is no annotation to attach to. The warning above is the finding.
  }
}

/**
 * Remove a scratch tree built by shelling `git`, WITHOUT letting the
 * removal red the body it follows.
 *
 * A teardown runs after the assertions have already had their verdict, so
 * a throw out of it relabels somebody else's green as a failure of
 * whatever body happened to be nearest — which is precisely how this
 * defect reached main twice on commits that touched no code. The finding
 * is real and is not swallowed silently: it is printed, named for the
 * FIXTURE, and returned to the caller. What it is not is a failure of the
 * test.
 *
 * @param dir     the scratch root to remove
 * @param fixture the fixture's own NAME, for the finding to be attributed to
 * @returns the finding when the tree could not be removed, else `null`
 */
export function removeGitFixture(
  dir: string,
  fixture: string,
  hooks: FixtureTeardownHooks = {},
): string | null {
  const remove = hooks.remove ?? ((target, options) => rmSync(target, options));
  const report = hooks.report ?? defaultReport;
  try {
    remove(dir, { recursive: true, force: true, ...FIXTURE_RM_RETRY });
    return null;
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    const finding =
      `${fixture} FIXTURE TEARDOWN could not remove ${dir} within ` +
      `${FIXTURE_RM_MAX_WAIT_MS}ms of bounded retries: ${cause}. ` +
      `THIS IS THE FIXTURE'S FINDING, NOT A FAILURE OF THE BODY IT FOLLOWS — ` +
      `that body's assertions already had their verdict. The tree is left in ` +
      `place; see tools/e2e/tests/git-fixture.ts for the mechanism (T-178).`;
    report(finding);
    return finding;
  }
}
