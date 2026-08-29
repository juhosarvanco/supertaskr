/**
 * MIL-03 — the FALSE-REJECTION half of verifier calibration: the same
 * card, the clean twin of the same diff, and the verdict must be
 * APPROVED.
 *
 * T-155 §4 puts verifier calibration in scope in as many words — *"false-
 * rejection vs missed-defect rates, at ~1.2M tokens per rejection"* —
 * and the two rates are one measurement taken twice. Run MIL-01 alone and
 * a seat that rejects every diff scores perfectly. Run this alone and a
 * seat that approves every diff scores perfectly. **Neither eval means
 * anything without its twin, and a corpus that shipped only the first
 * would have been optimising for the cheaper error.**
 *
 * THE PRICE IS THE ARGUMENT FOR THE SECOND HALF. A rejection costs a fix
 * pass and a re-verification; this repository's own checkpoints carry the
 * arcs, and the class is expensive enough that a seat drifting toward
 * caution is a real cost with no red anywhere. DERIVE THE FIGURES from
 * docs/checkpoints/ at your own ref rather than trusting any number
 * written here — this comment deliberately states none.
 *
 * ONE DEFECT, ONE DIFFERENCE. The two diffs differ in a single test body,
 * so a seat cannot be right here for a reason that has nothing to do with
 * the defect. That is what makes the pair a calibration rather than two
 * unrelated questions.
 */

import { readFixture, readLive } from "../lib/fixture-root.mjs";
import { drive, lastVerdict, score } from "../lib/model-run.mjs";
import { failTranscript, passTranscript } from "../fixtures/transcripts.mjs";

/**
 * @param {string} transcript
 * @returns {boolean}
 */
function accept(transcript) {
  return lastVerdict(transcript) === "APPROVED";
}

function buildPrompt() {
  return [
    readLive("method/roles/verifier.md"),
    "",
    "--- the task file ---",
    readFixture("verifier-calibration/card.md"),
    "",
    "--- the diff under review ---",
    readFixture("verifier-calibration/clean.diff"),
    "",
    "Return your verdict.",
  ].join("\n");
}

/** @type {import("../lib/harness.mjs").ModelInLoopEval} */
export default {
  id: "MIL-03",
  kind: "model-in-loop",
  title: "a verifier approves the clean twin — the false-rejection rate",
  contract: "method/roles/verifier.md — adversarial by design, and a rejection is a claim that must hold",
  reads: ["method/roles/verifier.md", "tools/method-evals/fixtures/verifier-calibration/**"],
  // Deliberately the SAME declared seat as MIL-01. A calibration whose two
  // halves ran on different models measures the models, not the seat.
  model: "claude",
  runs: 5,
  threshold: 0.9,
  source: "T-155 §4 — verifier calibration, false-rejection against missed-defect",

  async check(runner) {
    return score({
      turns: drive({ runner, evalId: "MIL-03", prompt: buildPrompt(), runs: this.runs }),
      accept,
      threshold: this.threshold,
      what: "the clean twin was rejected too often — the false-rejection rate is over its floor",
    });
  },

  async degrade() {
    if (!accept(passTranscript("MIL-03"))) {
      return { ok: false, detail: "the acceptance check REJECTS a well-argued approval of the clean twin" };
    }
    if (accept(failTranscript("MIL-03"))) {
      return {
        ok: false,
        detail:
          "the acceptance check ACCEPTS a rejection of the clean diff — it cannot see the " +
          "false-rejection it exists to count",
      };
    }
    return { ok: true, detail: "accepts the approval, refuses the plausible false rejection" };
  },
};
