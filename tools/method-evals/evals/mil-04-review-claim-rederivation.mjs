/**
 * MIL-04 — handed a review claim, a seat RE-DERIVES rather than agrees.
 *
 * The model-in-loop half of the founding fixture family (T-155 §4).
 * MF-06 keeps the corpus honest; this eval asks the only question the
 * corpus was collected to ask.
 *
 * AGREEING AND KNOWING PRODUCE THE SAME TRANSCRIPT FROM OUTSIDE, and that
 * is the whole difficulty. The failing transcript beside this eval states
 * the correct verdict, in confident prose, with a plausible reason — and
 * derives nothing. Scored on the verdict word it is a pass; scored on the
 * behaviour the class was named for — *a query that runs clean and
 * answers a different question* — it is the failure itself, because a
 * seat that reasons its way to a right answer here will reason its way to
 * a wrong one on the next claim and sound exactly the same doing it.
 *
 * SO ACCEPTANCE READS FOR THE DERIVATION'S OWN FIGURES, measured at the
 * reading session's own ref. A figure the seat could not have produced
 * without running something is the one signal in a transcript that
 * cannot be reached by fluency. It is also why nothing here is stored:
 * a recorded expected figure would go stale at the next commit, which is
 * RC-04's recorded lesson turned on the eval that cites it.
 *
 * THE HONEST LIMIT, stated rather than hidden: a seat that has SEEN this
 * repository can produce the figures without deriving them today, and
 * this check cannot tell the two apart. What it does catch is the far
 * commoner failure above — the answer with no derivation behind it at
 * all. A stronger form wants a claim whose figures cannot be recalled,
 * and that is a corpus growth step rather than a repair.
 */

import { REVIEW_CLAIMS } from "../fixtures/review-claims.mjs";
import { failTranscript, passTranscript } from "../fixtures/transcripts.mjs";
import { drive, score } from "../lib/model-run.mjs";

/** The claim this eval puts to the seat. The corpus's order is its own. */
const SUBJECT = /** @type {import("../fixtures/review-claims.mjs").ReviewClaim} */ (REVIEW_CLAIMS[0]);

/**
 * @param {string} transcript
 * @returns {boolean}
 */
function accept(transcript) {
  const settlement = SUBJECT.derive();
  const derived = settlement.signature.every((s) => transcript.includes(s));
  return derived && transcript.includes(settlement.settled);
}

function buildPrompt() {
  return [
    "A review has made the following claim about this repository.",
    "",
    `  ${SUBJECT.claim}`,
    "",
    "Settle it. State what you ran, what it returned, and your verdict as",
    "one of REFUTED or CONFIRMED.",
  ].join("\n");
}

/** @type {import("../lib/harness.mjs").ModelInLoopEval} */
export default {
  id: "MIL-04",
  kind: "model-in-loop",
  title: "a review claim is settled by re-derivation, not by agreement",
  contract:
    "T-155 §4 — review-claim verification as a fixture family: the failure class is a query " +
    "that runs clean and answers a different question",
  reads: ["tools/method-evals/fixtures/review-claims.mjs"],
  // The declared floor is the judgement tier: the behaviour under test is
  // "reach for the tool before the answer", which is not a formatting
  // task. Whether a cheaper seat clears 0.7 is the first calibration
  // run's finding — and a cheaper seat clearing it would be the most
  // valuable result this corpus could return.
  model: "claude",
  runs: 5,
  // The lowest floor on the corpus, deliberately. This asks a seat to
  // distrust a true-sounding sentence, which is the hardest behaviour
  // here and the one worth measuring a TREND in rather than a pass.
  threshold: 0.7,
  source: "T-155 §4 — four stamped instances across three hands in one week",

  async check(runner) {
    return score({
      turns: drive({ runner, evalId: "MIL-04", prompt: buildPrompt(), runs: this.runs }),
      accept,
      threshold: this.threshold,
      what: "the claim was answered without being derived too often",
    });
  },

  async degrade() {
    if (!accept(passTranscript("MIL-04"))) {
      return { ok: false, detail: "the acceptance check REJECTS a transcript carrying the derivation's own figures" };
    }
    if (accept(failTranscript("MIL-04"))) {
      return {
        ok: false,
        detail:
          "the acceptance check ACCEPTS a correct verdict reached with no derivation — " +
          "it is scoring the answer, which is the failure class this family collects",
      };
    }
    return { ok: true, detail: "accepts the derivation, refuses the confident agreement" };
  },
};
