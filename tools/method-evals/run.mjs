#!/usr/bin/env node
/**
 * THE METHOD EVAL SUITE (T-155, ADR-020 decision 2).
 *
 * THE ONE SPELLING, run from the repo ROOT:
 *
 *   node tools/method-evals/run.mjs                       # the model-free set
 *   node tools/method-evals/run.mjs --set model-in-loop
 *   node tools/method-evals/run.mjs --set all
 *   node tools/method-evals/run.mjs --selftest            # the positive control
 *   node tools/method-evals/run.mjs --list                # the corpus and its prices
 *   node tools/method-evals/run.mjs --bump                # the version-bump obligation
 *
 * WHY IT EXISTS. The method files — roles, lane protocol, docs protocol,
 * brief assembly — are byte-pinned into the genesis kit and never TESTED
 * FOR EFFECT. A rewrite of `executor.md` or a model swap changes what
 * sessions produce, and nothing reds. Derive the standing gates from
 * docs/CONVENTIONS.md and a `method/**`-only diff matches none of them:
 * GRAPH REGEN wants code suffixes outside docs/, BOOT GATE wants `app/**`
 * or a manifest, the DOCS GATE wants a path under `docs/`. This suite is
 * the gate that fires there.
 *
 * ZERO DEPENDENCIES, DELIBERATELY, AND NOT AS A STYLE NOTE. It runs
 * against a BARE CHECKOUT with no `node_modules` anywhere — the property
 * that lets the token lint be CI's first step ahead of every `npm ci`
 * (docs/CONVENTIONS.md's CI bullet says why). A suite that needs an
 * install before it can speak is a suite that stays silent on the day the
 * install is what broke.
 *
 * EXIT CODES — the house contract, the same four `index --check`,
 * `boot:check`, `lint:tokens`, the DOCS GATE and `brief.mjs` use, owned
 * by the frozen object in `lib/exit.mjs` and imported rather than
 * re-typed:
 *   0  the set ran and every eval passed.
 *   1  the set RAN and FOUND something: an eval failed, or a model-in-loop
 *      pass rate fell under its declared threshold.
 *   2  called wrong: an unknown flag, an unknown set.
 *   3  the suite COULD NOT RUN — no model runner for a model-in-loop set,
 *      a fixture root that would not materialize, an eval module that
 *      threw. This run is not a claim about the method at all.
 *
 * Execution lives in this wrapper and NOT in the modules beside it, so
 * importing the harness is side-effect-free — the `lint-tokens` shape,
 * for the reason that file gives.
 */

import { EXIT } from "./lib/exit.mjs";
import { isModelInLoop, loadEvals, RUNNER_ENV, runSet, SETS } from "./lib/harness.mjs";

const USAGE = [
  "usage: node tools/method-evals/run.mjs [--set model-free|model-in-loop|all]",
  "                                       [--selftest] [--list] [--bump] [--verbose]",
  `  --set          which cost tier to run; default model-free.`,
  `  --selftest     run every eval's POSITIVE CONTROL instead of its check:`,
  `                 degrade the contract on a copy and require the eval to`,
  `                 detect it. Needs no model and no ${RUNNER_ENV}.`,
  "  --list         print the corpus with each eval's contract, model and price.",
  "  --bump         the method version bump's FOURTH obligation: run both sets",
  "                 and print the block that belongs in the bump's commit message.",
].join("\n");

/** @param {string[]} argv @param {NodeJS.ProcessEnv} env */
async function main(argv, env) {
  /** @type {"model-free" | "model-in-loop" | "all"} */
  let set = "model-free";
  let selftest = false;
  let list = false;
  let bump = false;
  let verbose = false;

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--selftest") selftest = true;
    else if (a === "--list") list = true;
    else if (a === "--bump") bump = true;
    else if (a === "--verbose") verbose = true;
    else if (a === "--set") {
      const value = argv[i + 1];
      i += 1;
      if (value === undefined || !SETS.includes(value)) {
        console.error(`method-evals: --set wants one of ${SETS.join(", ")}, got ${String(value)}`);
        console.error(USAGE);
        return EXIT.USAGE;
      }
      set = /** @type {"model-free" | "model-in-loop" | "all"} */ (value);
    } else {
      console.error(`method-evals: unknown argument ${a}`);
      console.error(USAGE);
      return EXIT.USAGE;
    }
  }

  /** @type {import("./lib/harness.mjs").Eval[]} */
  let evals;
  try {
    evals = await loadEvals();
  } catch (cause) {
    console.error("method-evals: THE SUITE COULD NOT RUN — an eval module would not load.");
    console.error(`  ${cause instanceof Error ? cause.message : String(cause)}`);
    console.error("  This run is not a claim about the method text.");
    return EXIT.CANNOT_RUN;
  }

  if (list) {
    console.log(`method-evals: ${evals.length} eval(s)`);
    for (const e of evals) {
      const price = isModelInLoop(e)
        ? `${e.model}, ${e.runs} runs, pass rate >= ${e.threshold}`
        : "deterministic, no tokens";
      console.log(`  ${e.id}  [${e.kind}]  ${e.title}`);
      console.log(`        price:    ${price}`);
      console.log(`        contract: ${e.contract}`);
      if (isModelInLoop(e)) console.log(`        source:   ${e.source}`);
    }
    console.log("");
    console.log(
      "  Every model-in-loop `model:` and threshold above is a DECLARED FLOOR, not a",
    );
    console.log(
      "  measured rate — no calibration run has happened. The first real run is what",
    );
    console.log("  turns either into a figure; until then, quoting one as an observation");
    console.log("  is the failure class this corpus was collected from.");
    return EXIT.CLEAN;
  }

  if (bump) {
    // THE FOURTH OBLIGATION (T-155 §3). A method version bump is a
    // three-file commit (docs/CONVENTIONS.md's first gotcha names the
    // three, the third of them Rust). It now also owes a RECORDED eval
    // run, and this arm prints the block to paste into that commit's own
    // message — the bump's result travels with the bump, not in a chat.
    const free = await runSet({ evals, set: "model-free", selftest: false, verbose, env, out: log, err: warn });
    const loop = await runSet({ evals, set: "model-in-loop", selftest: false, verbose, env, out: log, err: warn });
    const runner = env[RUNNER_ENV];
    console.log("");
    console.log("--- paste into the bump commit message ---");
    console.log(`Method evals: model-free exit ${free}, model-in-loop exit ${loop}.`);
    console.log(
      `Corpus: ${evals.filter((e) => !isModelInLoop(e)).length} model-free, ` +
        `${evals.filter(isModelInLoop).length} model-in-loop.`,
    );
    console.log(`Runner: ${runner === undefined || runner.trim() === "" ? "NONE" : runner.trim()}`);
    if (loop === EXIT.CANNOT_RUN) {
      console.log("THE MODEL-IN-LOOP SET DID NOT RUN, so this bump is NOT gated on it.");
      console.log("Say that in the commit rather than omitting the line: a bump whose");
      console.log("eval result is absent and one whose eval was skipped read the same.");
    }
    console.log("Pass rates and token spend are in the run above, at this ref. Do not");
    console.log("transcribe them from an earlier run — that is the corpus's own RC-04.");
    console.log("--- end ---");
    // A bump is green only if BOTH sets are. `3` outranks `1` here on
    // purpose: "I could not tell you" is worse news than "I found it".
    if (free === EXIT.CANNOT_RUN || loop === EXIT.CANNOT_RUN) return EXIT.CANNOT_RUN;
    return free === EXIT.CLEAN && loop === EXIT.CLEAN ? EXIT.CLEAN : EXIT.FOUND;
  }

  return await runSet({ evals, set, selftest, verbose, env, out: log, err: warn });
}

/** @param {string} s */
function log(s) {
  console.log(s);
}
/** @param {string} s */
function warn(s) {
  console.error(s);
}

process.exitCode = await main(process.argv.slice(2), process.env);
