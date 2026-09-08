/**
 * THE HARNESS — loading, running and reporting the eval corpus.
 *
 * An eval is a MODULE with a default export shaped like the type below.
 * Nothing here knows what any eval checks; every eval owns its own
 * contract, its own degradation and its own reason for existing.
 *
 * THE TWO SETS ARE NOT TWO STYLES, THEY ARE TWO COSTS (ADR-020 decision
 * 2, T-155 §2):
 *
 *   MODEL-FREE      deterministic, seconds, no tokens. Runs on every
 *                   `method/**` change. A single failure is a failure —
 *                   there is nothing to average over.
 *   MODEL-IN-LOOP   nondeterministic and token-expensive. Runs at a
 *                   method version bump and on schedule, never
 *                   per-commit. Its verdict is a PASS RATE against a
 *                   declared threshold over `runs` attempts, because a
 *                   single sample of a nondeterministic process is not a
 *                   measurement.
 *
 * TOKEN ECONOMICS ARE A DESIGN INPUT AND NOT AN AFTERTHOUGHT (T-155's own
 * §"Token economics"). Every model-in-loop eval declares the CHEAPEST
 * model that DISCRIMINATES — never "the session default", which is a
 * price nobody chose — and the runner records tokens per run from the
 * adapter's own report. An eval suite nobody can afford to run is a
 * ritual with extra steps.
 *
 * @typedef {object} EvalResult
 * @property {boolean} ok
 * @property {string} detail   one line, said plainly; the reader acts on this
 * @property {string[]} [lines] bounded extra output, printed only under --verbose
 *
 * @typedef {object} ModelFreeEval
 * @property {string} id
 * @property {"model-free"} kind
 * @property {string} title
 * @property {string} contract   the method sentence this eval holds
 * @property {string[]} reads    every path it depends on, for the trigger
 * @property {() => Promise<EvalResult>} check
 * @property {() => Promise<EvalResult>} degrade  the POSITIVE CONTROL: break
 *   the contract on a copy and require the check to fail. `ok: true` means
 *   the degradation was correctly DETECTED.
 *
 * @typedef {object} ModelInLoopEval
 * @property {string} id
 * @property {"model-in-loop"} kind
 * @property {string} title
 * @property {string} contract
 * @property {string[]} reads
 * @property {string} model      the cheapest model that discriminates
 * @property {number} runs       samples per verdict
 * @property {number} threshold  pass rate required, 0..1
 * @property {string} source     the record this fixture was derived from
 * @property {(runner: ModelRunner) => Promise<EvalResult>} check
 * @property {() => Promise<EvalResult>} degrade  the acceptance function is
 *   run against RECORDED transcripts — one that must pass, one that must
 *   fail — so a vacuous acceptance check is caught with no model at all.
 *
 * @typedef {ModelFreeEval | ModelInLoopEval} Eval
 *
 * @typedef {object} ModelRunner
 * @property {string} program  the executable a model-in-loop eval shells out to
 */

import { readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { EXIT } from "./exit.mjs";
import { suiteDir } from "./fixture-root.mjs";

/** The environment variable that names a model runner. Absent = the set cannot run. */
export const RUNNER_ENV = "SUPERTASKR_EVAL_RUNNER";

export const SETS = Object.freeze(["model-free", "model-in-loop", "all"]);

/**
 * Load every eval module. A module that throws while loading is a suite
 * that CANNOT RUN, never a suite with a failing eval — the codes exist to
 * keep those apart.
 *
 * @returns {Promise<Eval[]>}
 */
export async function loadEvals() {
  const dir = path.join(suiteDir, "evals");
  const files = readdirSync(dir).filter((f) => f.endsWith(".mjs")).sort();
  /** @type {Eval[]} */
  const evals = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(dir, file)).href);
    const spec = mod.default;
    if (spec === undefined || typeof spec.id !== "string") {
      throw new Error(`evals/${file} has no default export shaped like an eval`);
    }
    evals.push(spec);
  }
  const ids = evals.map((e) => e.id);
  const dupe = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dupe !== undefined) throw new Error(`two evals share the id ${dupe}`);
  return evals;
}

/**
 * Resolve the model runner, or say why there is none.
 *
 * THIS IS THE THIRD ACCEPTANCE CRITERION'S WHOLE MECHANISM. A model-in-loop
 * set with no runner does not pass, does not skip and does not print a
 * reassuring dot: it exits 3 and names the variable it wanted. Silence
 * wearing a clean gate's costume is the outcome the house codes exist to
 * remove.
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ runner: ModelRunner } | { reason: string }}
 */
export function resolveRunner(env) {
  const program = env[RUNNER_ENV];
  if (program === undefined || program.trim() === "") {
    return {
      reason:
        `${RUNNER_ENV} is unset, so no model-in-loop eval can be attempted. ` +
        "Set it to an executable that takes a prompt on stdin and writes the " +
        "session transcript to stdout. This run is NOT a claim about the method.",
    };
  }
  return { runner: { program: program.trim() } };
}

/** @param {Eval} e @returns {e is ModelInLoopEval} */
export const isModelInLoop = (e) => e.kind === "model-in-loop";

/**
 * Run one set.
 *
 * @param {object} opts
 * @param {Eval[]} opts.evals
 * @param {"model-free" | "model-in-loop" | "all"} opts.set
 * @param {boolean} opts.selftest  run each eval's POSITIVE CONTROL instead of its check
 * @param {boolean} opts.verbose
 * @param {NodeJS.ProcessEnv} opts.env
 * @param {(s: string) => void} opts.out
 * @param {(s: string) => void} opts.err
 * @returns {Promise<0 | 1 | 2 | 3>}
 */
export async function runSet({ evals, set, selftest, verbose, env, out, err }) {
  const chosen = evals.filter(
    (e) => set === "all" || (set === "model-in-loop" ? isModelInLoop(e) : !isModelInLoop(e)),
  );
  if (chosen.length === 0) {
    err(`method-evals: the ${set} set is EMPTY — an empty set is not a green one.`);
    return EXIT.CANNOT_RUN;
  }

  // The runner is resolved ONCE, before anything runs, so "no runner" is
  // reported as a property of the run and not as N identical failures.
  /** @type {ModelRunner | null} */
  let runner = null;
  if (!selftest && chosen.some(isModelInLoop)) {
    const resolved = resolveRunner(env);
    if ("reason" in resolved) {
      err("method-evals: THE MODEL-IN-LOOP SET COULD NOT RUN.");
      err(`  ${resolved.reason}`);
      for (const e of chosen.filter(isModelInLoop)) {
        err(`  not attempted: ${e.id} (${e.model}, ${e.runs} runs, threshold ${e.threshold})`);
      }
      return EXIT.CANNOT_RUN;
    }
    runner = resolved.runner;
  }

  /** @type {{ id: string; detail: string; lines: string[] }[]} */
  const failures = [];
  /** @type {string[]} */
  const dots = [];
  let cannotRun = 0;

  for (const e of chosen) {
    /** @type {EvalResult} */
    let result;
    try {
      result = selftest
        ? await e.degrade()
        : isModelInLoop(e)
          ? await e.check(/** @type {ModelRunner} */ (runner))
          : await e.check();
    } catch (cause) {
      cannotRun += 1;
      const why = cause instanceof Error ? cause.message : String(cause);
      failures.push({ id: e.id, detail: `COULD NOT RUN — ${why}`, lines: [] });
      dots.push("E");
      continue;
    }
    dots.push(result.ok ? "." : "F");
    if (!result.ok) failures.push({ id: e.id, detail: result.detail, lines: result.lines ?? [] });
    else if (verbose) out(`  ${e.id}  ${result.detail}`);
  }

  // Quiet by default: one dot line and the failures. Bounded logs are a
  // design input here, not a nicety — this suite is meant to be run often
  // and read fast.
  out(`${dots.join("")}  ${chosen.length} ${set} eval(s)${selftest ? ", POSITIVE CONTROL" : ""}`);

  if (cannotRun > 0) {
    err(`method-evals: ${cannotRun} eval(s) COULD NOT RUN — this run is not a claim about the method.`);
    for (const f of failures) err(`  ${f.id}: ${f.detail}`);
    return EXIT.CANNOT_RUN;
  }
  if (failures.length > 0) {
    err(`method-evals: ${failures.length} of ${chosen.length} FAILED.`);
    for (const f of failures) {
      err(`  ${f.id}: ${f.detail}`);
      for (const line of f.lines) err(`      ${line}`);
    }
    if (selftest) {
      err(
        "  A POSITIVE-CONTROL failure means an eval did NOT detect its own degradation: " +
          "the eval passes whatever the method text says, which is a vacuous check and " +
          "a worse finding than a red.",
      );
    }
    return EXIT.FOUND;
  }
  return EXIT.CLEAN;
}
