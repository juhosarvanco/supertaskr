/**
 * THE HOUSE EXIT CODES, owned beside the suite that produces them.
 *
 * The same four `index --check`, `boot:check`, `lint:tokens`, the DOCS
 * GATE and `brief.mjs` already use (docs/CONVENTIONS.md, "Build & test").
 * They are frozen here and IMPORTED rather than re-typed, which is the
 * shape token-scan.mjs's own `EXIT` object established: a number written
 * twice is two chances to disagree.
 *
 * The distinction the codes exist to keep is between 1 and 3. **1 is a
 * claim about the method text. 3 is a claim about this command**, and a
 * run that could not read its question is never an answer about the
 * tree — which is T-155's third acceptance criterion in one sentence:
 * a skipped gate is news, never silence.
 *
 * 2 is `usage`, the meaning `index --check` gives it, so that adding a
 * flag later renumbers nothing a checkpoint has quoted.
 */
export const EXIT = Object.freeze({
  /** The set ran and every eval in it passed. */
  CLEAN: 0,
  /** The set RAN and FOUND something: an eval failed, or a pass rate fell
   *  under its declared threshold. Read the message. */
  FOUND: 1,
  /** Called wrong: an unknown flag, an unknown set, no set asked for. */
  USAGE: 2,
  /** The suite COULD NOT RUN, so this run is not a claim about the method
   *  at all — no model runner for a model-in-loop set, a fixture root that
   *  would not materialize, an eval module that threw while loading. */
  CANNOT_RUN: 3,
});

/** @typedef {0 | 1 | 2 | 3} HouseExit */
