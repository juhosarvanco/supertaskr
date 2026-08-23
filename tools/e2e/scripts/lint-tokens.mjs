#!/usr/bin/env node
/**
 * Unconditional command wrapper for CI's first gate. Keep execution here,
 * outside token-scan.mjs, so importing the scanner is side-effect-free.
 *
 * Do not replace this with an `import.meta.url === process.argv[1]` guard:
 * symlinked checkouts and wrapper scripts can make those paths disagree and
 * silently turn the first CI gate into exit 0 without scanning anything.
 *
 * ── THE THIRD EXIT CODE (T-080) ──────────────────────────────────────
 * 0 clean · 1 the gate ran and FOUND something · 3 the gate COULD NOT
 * RUN. The catch is deliberately total: any throw out of the scanner
 * means the scan did not complete — git absent or this not being a
 * repository, a TOKEN root unreadable, a file vanishing between the
 * listing and the read, a lexer invariant broken — and a run that did
 * not complete is not a claim about the tree. Before T-080 every one of
 * those exited 1, the code a real violation already used, in the step CI
 * runs FIRST against a bare checkout.
 *
 * This is a catch, never a rescue: exit 3 still fails the CI step, and
 * `process.exit(EXIT.FOUND)` inside lintTree/selftest is not
 * interceptable by it, so a genuine hit cannot be relabelled here.
 */
import { EXIT, lintTree, selftest } from "./token-scan.mjs";

try {
  if (process.argv.includes("--selftest")) selftest();
  else lintTree();
} catch (err) {
  console.error(`lint-tokens: GATE COULD NOT RUN — ${/** @type {{ message?: string }} */ (err)?.message ?? String(err)}`);
  console.error(
    `lint-tokens: exit ${EXIT.CANNOT_RUN} means the gate did not finish scanning; ` +
      `it is NOT a claim about the tree (exit ${EXIT.FOUND} is).`,
  );
  process.exit(EXIT.CANNOT_RUN);
}
