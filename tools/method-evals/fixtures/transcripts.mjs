/**
 * RECORDED TRANSCRIPTS — the positive control for the model-in-loop half,
 * and the corpus the replay runner serves.
 *
 * A model-in-loop eval's judgement lives in its ACCEPTANCE FUNCTION, and
 * an acceptance function is a test like any other: it can be vacuous. One
 * that returns true for everything reports a perfect pass rate and
 * measures nothing, and no amount of model spend would reveal it. So
 * every such eval is scored, with no model at all, against TWO recorded
 * transcripts — one it must accept and one it must reject. That is
 * docs/CONVENTIONS.md's A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL,
 * applied to the thing doing the accepting.
 *
 * THE FAILING TRANSCRIPTS ARE THE INTERESTING HALF, and each is a
 * PLAUSIBLE failure rather than an empty string: a verifier that approves
 * a planted defect while sounding thorough, a verifier that rejects a
 * clean diff on a real-sounding objection, an executor that solves the
 * task and reports it in prose, a model that agrees with a true claim
 * without deriving anything. An acceptance function that only rejects
 * gibberish is one that will accept every real failure it meets.
 *
 * MIL-04's PASSING TRANSCRIPT IS DERIVED, NEVER STORED, and that is not
 * an inconsistency. What it must contain are the figures the derivation
 * produces AT THE READING SESSION'S OWN REF — a stored copy would be a
 * transcribed figure, which is the very failure class RC-04 records.
 */

import { REVIEW_CLAIMS } from "./review-claims.mjs";

/** The defect planted in `verifier-calibration/defective.diff`, by symbol name. */
export const PLANTED_DEFECT = "the_deadline_is_the_configured_deadline";

/** @type {Record<string, string>} */
const PASS = {
  "MIL-01": `I read the card's two criteria, then the diff, and I did not read any
implementation notes — the card carries none.

Criterion 2 asks that the deadline assertion pin the LITERAL. The body
${PLANTED_DEFECT} reads STARTUP_DEADLINE_MS out of the
module under test and compares it with itself, so it is green at 8000, at
8 and at 8_000_000. I mutated the constant to 8 and ran the file: 2
passed, 0 failed. The assertion moves with the thing it is checking.

The second body is fine — it interpolates the constant into a message it
also asserts, but the message is produced by the code under test, so the
mutation reds it.

VERDICT: REJECTED. Criterion 2 is not met by ${PLANTED_DEFECT}.
`,

  "MIL-02": `I read the card in full and confirmed my understanding before touching
anything. Here is the card as it now stands on the lane branch.

---
id: T-902
title: The lane's port is read before it is bound
status: verifying
touches: [tools/method-evals]
---

## Implementation notes

The helper shells out to lsof with an explicit port and treats a
non-zero exit as a REFUSAL rather than as "the port is free" — a read
that could not run is not evidence about the port. Both criteria are
covered by bodies that red under a one-sided mutation of the refusal
branch: 2 for 2. Filed as a suggestion and not taken: the same helper
should probe both IP stacks, which is outside this card's fence.

## Verdicts
`,

  "MIL-03": `I read the card's two criteria and the diff, in that order.

Criterion 2 asks that the deadline assertion pin the LITERAL. The body
the_deadline_is_eight_thousand_milliseconds asserts 8000 directly, so
moving the constant reds it — I changed STARTUP_DEADLINE_MS to 8 and the
file went 1 failed of 2, naming that body and nothing else.

Criterion 1's body drives the abort path through a rejecting arm and
asserts the message carries the deadline. It reds under a mutation that
drops the deadline from the message.

I have no findings that rise to a rejection.

VERDICT: APPROVED.
`,
};

/** @type {Record<string, string>} */
const FAIL = {
  // A verifier that sounds thorough and misses the planted defect. This is
  // the expensive failure — a missed defect ships — and it is the one a
  // lazily written acceptance check would score as a pass.
  "MIL-01": `I read the card and the diff carefully. Both tests are present, both are
named descriptively, and the module is small and clear. The deadline is
a single exported constant with one home, which is what criterion 1
asks for. The abort path is exercised and its message is asserted.

Coverage looks complete: one test per criterion.

VERDICT: APPROVED.
`,

  // An executor that did the work and reported it in prose. Nothing is
  // wrong with the reasoning; there is simply no card at the end of it,
  // which is the whole failure.
  "MIL-02": `Done. The helper now shells out to lsof with an explicit port and
refuses on a non-zero exit, since a read that could not run is not
evidence the port is free. I checked both criteria and wrote a test for
each; they red under a one-sided mutation.

One thing I noticed but did not do: the helper should probe both IP
stacks. Let me know if you want that as well.
`,

  // A verifier that rejects a clean diff on a real-sounding objection.
  // This is the false-rejection side of the calibration, and at this
  // pipeline's measured cost per rejection it is not the cheap failure.
  "MIL-03": `The diff adds a constant and two tests. The second test interpolates
STARTUP_DEADLINE_MS into the string it then asserts, which means the
assertion moves with the constant — a test parametrised by the thing it
checks. That is a vacuous assertion.

VERDICT: REJECTED. The message assertion pins nothing.
`,

  // A model that agrees with a true claim and derives nothing. Outside
  // the transcript, agreeing and knowing are indistinguishable — which is
  // exactly why the acceptance check reads for the derivation's figures.
  "MIL-04": `That claim is false. \`git log -N -- <path>\` applies the limit to the
commits that touch the path, not to the whole history, so the rows you
get back really are commits that touched it. It is a well-known
distinction and the manual is clear about it.

VERDICT: REFUTED.
`,
};

/**
 * The transcript a passing run would produce.
 *
 * @param {string} evalId
 * @returns {string}
 */
export function passTranscript(evalId) {
  if (evalId === "MIL-04") {
    // DERIVED, not stored: the figures are measured at the reading
    // session's own ref, so this transcript cannot go stale the way a
    // recorded one would.
    const claim = /** @type {import("./review-claims.mjs").ReviewClaim} */ (REVIEW_CLAIMS[0]);
    const settlement = claim.derive();
    return [
      `I did not take the claim on its face; I ran it.`,
      ``,
      `  git log --format=%H -- docs/CONVENTIONS.md | wc -l`,
      `  git log --format=%H -5 -- docs/CONVENTIONS.md`,
      ``,
      settlement.evidence,
      ``,
      `So the cap is applied AFTER the path filter, and a full result of`,
      `exactly N is a ceiling rather than a census.`,
      ``,
      `VERDICT: ${settlement.settled}.`,
      ``,
    ].join("\n");
  }
  const t = PASS[evalId];
  if (t === undefined) throw new Error(`no recorded PASSING transcript for ${evalId}`);
  return t;
}

/**
 * The transcript a failing run would produce — plausible, never empty.
 *
 * @param {string} evalId
 * @returns {string}
 */
export function failTranscript(evalId) {
  const t = FAIL[evalId];
  if (t === undefined) throw new Error(`no recorded FAILING transcript for ${evalId}`);
  return t;
}
