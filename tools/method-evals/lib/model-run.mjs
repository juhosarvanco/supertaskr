/**
 * DRIVING A MODEL-IN-LOOP EVAL — one implementation, shared by all of them.
 *
 * THE RUNNER CONTRACT, deliberately the smallest thing that can be
 * satisfied by an agent CLI the user already has (NORTH_STAR's hard
 * constraint: *"any agent CLI that reads files can hold any role"*, and
 * ADR-003's shell-out architecture — this suite never calls a model API):
 *
 *   invocation   <program> <eval-id>
 *   stdin        the prompt
 *   stdout       the session transcript, as text
 *   stderr       free, except that a line matching `tokens: <n>` is READ
 *                and summed into this run's cost
 *   exit 0       a turn happened; anything else means the runner could
 *                not run, which is a CANNOT_RUN for the whole set and
 *                never a failing eval
 *
 * TOKENS ARE COUNTED BECAUSE THE CARD MADE THEM A DESIGN INPUT. A suite
 * whose price is unknown is a suite that gets run once. The count is
 * whatever the runner reports and is never inferred: an unreported cost
 * is printed as unknown, not as zero.
 *
 * A PASS RATE, NEVER A PASS. A model-in-loop eval samples a
 * nondeterministic process, so one green is not a measurement and one red
 * is not a regression. Every verdict here is a rate over `runs` attempts
 * against a declared threshold — and the threshold's own provenance is
 * the eval's business to state.
 */

import { spawnSync } from "node:child_process";
import { repoRoot } from "./fixture-root.mjs";

/**
 * @typedef {object} Turns
 * @property {string[]} transcripts
 * @property {number | null} tokens   summed across runs; null if unreported
 * @property {string} program         the runner, echoed so a replayed run is
 *                                    never mistaken for a model run
 */

/**
 * @param {object} spec
 * @param {import("./harness.mjs").ModelRunner} spec.runner
 * @param {string} spec.evalId
 * @param {string} spec.prompt
 * @param {number} spec.runs
 * @returns {Turns}
 */
export function drive({ runner, evalId, prompt, runs }) {
  /** @type {string[]} */
  const transcripts = [];
  let tokens = 0;
  let reported = false;

  for (let i = 0; i < runs; i += 1) {
    const run = spawnSync(runner.program, [evalId], {
      input: prompt,
      encoding: "utf8",
      cwd: repoRoot,
      shell: false,
      maxBuffer: 32 * 1024 * 1024,
    });
    if (run.error !== undefined && run.error !== null) {
      throw new Error(`the model runner ${runner.program} would not start: ${run.error.message}`);
    }
    if (run.status !== 0) {
      throw new Error(
        `the model runner ${runner.program} exited ${run.status} on run ${i + 1} of ${runs} ` +
          `for ${evalId} — this run is not a claim about the method. stderr: ` +
          `${(run.stderr ?? "").trim().slice(0, 240)}`,
      );
    }
    transcripts.push(run.stdout ?? "");
    const meter = /^tokens:\s*(\d+)\s*$/m.exec(run.stderr ?? "");
    if (meter !== null) {
      reported = true;
      tokens += Number(meter[1]);
    }
  }
  return { transcripts, tokens: reported ? tokens : null, program: runner.program };
}

/**
 * THE VERDICT IS THE LAST ONE STATED. A transcript reasons out loud, so
 * both words appear in the ones worth reading — "this is not APPROVED
 * because…" is a rejection, and a grep for either word calls it whatever
 * it happened to type first. Reading the LAST occurrence is the rule the
 * role file's own shape implies: a verdict is what a seat ENDS with.
 *
 * @param {string} transcript
 * @returns {"APPROVED" | "REJECTED" | null}
 */
export function lastVerdict(transcript) {
  const hits = [...transcript.matchAll(/\b(APPROVED|REJECTED)\b/g)];
  const last = hits[hits.length - 1];
  return last === undefined ? null : /** @type {"APPROVED" | "REJECTED"} */ (last[1]);
}

/**
 * Score a set of transcripts against a declared threshold.
 *
 * @param {object} spec
 * @param {Turns} spec.turns
 * @param {(transcript: string) => boolean} spec.accept
 * @param {number} spec.threshold
 * @param {string} spec.what   what a passing transcript would have shown
 * @returns {import("./harness.mjs").EvalResult}
 */
export function score({ turns, accept, threshold, what }) {
  const passes = turns.transcripts.filter(accept).length;
  const rate = passes / turns.transcripts.length;
  const price =
    turns.tokens === null
      ? "tokens UNREPORTED by the runner"
      : `${turns.tokens} tokens over ${turns.transcripts.length} runs ` +
        `(${Math.round(turns.tokens / turns.transcripts.length)}/run)`;
  const line = `${passes}/${turns.transcripts.length} = ${rate.toFixed(2)} against ${threshold}; ${price}; runner ${turns.program}`;
  if (rate < threshold) {
    return { ok: false, detail: `${what}: ${line}`, lines: [] };
  }
  return { ok: true, detail: line };
}
