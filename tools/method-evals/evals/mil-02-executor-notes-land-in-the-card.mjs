/**
 * MIL-02 — a fixture card dispatched headless against the current method
 * produces notes in the card's OWN sections.
 *
 * T-155 §1's first canned task, verbatim.
 *
 * WHAT IS ACTUALLY BEING MEASURED, because it is not competence. The
 * failing transcript beside this eval solves the task correctly and
 * reports it in prose. Nothing in it is wrong; there is simply no card at
 * the end of it, and the next session inherits a chat message.
 * `method/roles/executor.md` steps 5 and 6 exist for precisely that — the
 * notes go in the card, the status is stamped in the lane — and a rewrite
 * of those steps that made them easier to skip would change what every
 * session produces with nothing anywhere reddening. That is ADR-020
 * decision 2's whole complaint, and it is the reason this eval is scored
 * on the ARTIFACT rather than on the reasoning.
 *
 * THE ACCEPTANCE IS PARSED, NOT READ FOR KEYWORDS. A transcript that says
 * "I appended my implementation notes" passes a keyword check and fails
 * this one: the section has to be there, with something in it, and the
 * status has to have moved. `method/roles/orchestrator.md`'s standing
 * rule that completion derives from typed state on disk rather than from
 * a model-emitted marker is the same idea one seat over.
 */

import { readFixture, readLive } from "../lib/fixture-root.mjs";
import { drive, score } from "../lib/model-run.mjs";
import { failTranscript, passTranscript } from "../fixtures/transcripts.mjs";

/** How much text under a heading stops being a gesture and starts being notes. */
const SUBSTANTIVE = 60;

/**
 * @param {string} transcript
 * @returns {boolean}
 */
function accept(transcript) {
  if (!/^\s*status:\s*verifying\s*$/m.test(transcript)) return false;
  const start = transcript.indexOf("## Implementation notes");
  if (start === -1) return false;
  const rest = transcript.slice(start + "## Implementation notes".length);
  const end = rest.indexOf("\n## ");
  const body = (end === -1 ? rest : rest.slice(0, end))
    // An HTML-comment placeholder is what the template ships with; a card
    // handed back carrying only that has gained nothing.
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
  return body.length >= SUBSTANTIVE;
}

function buildPrompt() {
  return [
    readLive("method/roles/executor.md"),
    "",
    "--- the task file, to be read IN FULL ---",
    readFixture("executor-notes/card.md"),
    "",
    "Build it, then hand the card back as it stands on the lane branch.",
  ].join("\n");
}

/** @type {import("../lib/harness.mjs").ModelInLoopEval} */
export default {
  id: "MIL-02",
  kind: "model-in-loop",
  title: "an executor's notes land in the card's own sections, with the status stamped",
  contract: "method/roles/executor.md steps 5 and 6 — notes appended to the task file, `status: verifying` stamped in the lane",
  reads: ["method/roles/executor.md", "tools/method-evals/fixtures/executor-notes/**"],
  // The cheapest tier on the corpus: the discrimination here is
  // STRUCTURAL — did a card come back — rather than a judgement, so the
  // small local seat nputer.yaml already names for doc upkeep is the
  // declared floor. Whether it clears the threshold is the first
  // calibration run's answer, not this line's.
  model: "ollama:qwen3-coder",
  runs: 5,
  threshold: 0.8,
  source: "method/roles/executor.md steps 5-6; docs/checkpoints/2026-08-29-T-158.md — the brief that told a seat not to stamp",

  async check(runner) {
    return score({
      turns: drive({ runner, evalId: "MIL-02", prompt: buildPrompt(), runs: this.runs }),
      accept,
      threshold: this.threshold,
      what: "the card came back without notes or without its stamp too often",
    });
  },

  async degrade() {
    if (!accept(passTranscript("MIL-02"))) {
      return { ok: false, detail: "the acceptance check REJECTS a card that carries notes and a stamp" };
    }
    if (accept(failTranscript("MIL-02"))) {
      return {
        ok: false,
        detail:
          "the acceptance check ACCEPTS a seat that solved the task and reported it in prose — " +
          "it is scoring the reasoning, which is not the artifact the next session reads",
      };
    }
    return { ok: true, detail: "accepts the returned card, refuses the correct prose report" };
  },
};
