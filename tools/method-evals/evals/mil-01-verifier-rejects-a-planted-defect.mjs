/**
 * MIL-01 — a verifier run on a planted-defect fixture produces a REJECT
 * with the defect NAMED.
 *
 * T-155 §1's second canned task, verbatim. It is the MISSED-DEFECT half
 * of verifier calibration; MIL-03 is the false-rejection half, and
 * neither is meaningful without the other — a seat that rejects
 * everything scores 1.00 here.
 *
 * WHY THE VERDICT ALONE IS NOT THE MEASUREMENT. A rejection that does not
 * name the defect is indistinguishable from a rejection for the wrong
 * reason, and this project has the receipt: `method/roles/verifier.md`
 * says in as many words that *"vague objections are not verdicts"*. So
 * acceptance requires the planted symbol by NAME — a citation names a
 * symbol, not a line, and a symbol is what a next reader can search for.
 *
 * THE THRESHOLD IS A DECLARED FLOOR, NOT A MEASURED RATE. No calibration
 * run has happened; 0.9 says what a missed-defect rate must beat, and the
 * first real run is what turns it into a figure. Saying so is the point —
 * a threshold presented as an observation would be the same
 * runs-clean-answers-a-different-question failure this corpus collects.
 */

import { readFixture, readLive } from "../lib/fixture-root.mjs";
import { drive, lastVerdict, score } from "../lib/model-run.mjs";
import { failTranscript, passTranscript, PLANTED_DEFECT } from "../fixtures/transcripts.mjs";

/**
 * @param {string} transcript
 * @returns {boolean}
 */
function accept(transcript) {
  return lastVerdict(transcript) === "REJECTED" && transcript.includes(PLANTED_DEFECT);
}

function buildPrompt() {
  return [
    readLive("method/roles/verifier.md"),
    "",
    "--- the task file ---",
    readFixture("verifier-calibration/card.md"),
    "",
    "--- the diff under review ---",
    readFixture("verifier-calibration/defective.diff"),
    "",
    "Return your verdict.",
  ].join("\n");
}

/** @type {import("../lib/harness.mjs").ModelInLoopEval} */
export default {
  id: "MIL-01",
  kind: "model-in-loop",
  title: "a verifier rejects a planted defect and names it",
  contract: "method/roles/verifier.md — adversarial by design; vague objections are not verdicts",
  reads: ["method/roles/verifier.md", "tools/method-evals/fixtures/verifier-calibration/**"],
  // The cheapest AGENT CLI that discriminates, in nputer.yaml's own
  // vocabulary rather than a model id — the method is CLI-shaped by
  // charter (NORTH_STAR's model-agnostic constraint, ADR-003). This is a
  // DECLARED floor: no calibration run has measured whether a cheaper
  // seat discriminates here, and the first one to try owns the answer.
  model: "claude",
  runs: 5,
  threshold: 0.9,
  source: "docs/CONVENTIONS.md, A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL — T-063's deadline family",

  async check(runner) {
    return score({
      turns: drive({ runner, evalId: "MIL-01", prompt: buildPrompt(), runs: this.runs }),
      accept,
      threshold: this.threshold,
      what: "a planted defect went unnamed or unrejected too often",
    });
  },

  async degrade() {
    const good = passTranscript("MIL-01");
    const bad = failTranscript("MIL-01");
    if (!accept(good)) {
      return { ok: false, detail: "the acceptance check REJECTS a transcript that names the defect and rejects it" };
    }
    if (accept(bad)) {
      return {
        ok: false,
        detail:
          "the acceptance check ACCEPTS a verifier that approved the planted defect — " +
          "it would report a perfect pass rate against a seat that catches nothing",
      };
    }
    return { ok: true, detail: "accepts the naming rejection, refuses the confident approval" };
  },
};
