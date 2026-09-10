/**
 * ci-owed.mjs — WHAT THIS PUSH OWES, ANSWERED ON THE RUNNER (T-294).
 *
 * ── THE MEASUREMENT THIS FILE EXISTS FOR ─────────────────────────────
 * A CI run took 34 to 36 minutes: the end-to-end lane 21, cargo 5, the
 * runner's own setup 8. Every push paid all of it, whatever it moved —
 * a records-only push paid 35 minutes to learn that no code suite reads
 * the document it touched. ADR-024 decision 4 ruled the owed set into
 * CI and the whole four suites onto a clock.
 *
 * ── ONE DERIVATION, THREE CALLERS, AND THIS IS THE THIRD ─────────────
 * T-280 made `gate-run.mjs --owed-set --range <base>..<tip>` the one
 * function that answers "what does this range owe": the push guard asks
 * it before it will accept a token, a bench asks it at its tip, and
 * this file asks it on the runner. It is SPAWNED rather than imported,
 * for two reasons that are not the guard's: the acceptance criterion
 * names that spelling, so the runner's log should show the seat the
 * exact command it can re-run at home; and a derivation that crashes
 * inside this program would be this program's failure, while a spawn
 * that exits non-zero is the derivation's, said in its own words.
 *
 * ── WHAT IT ADDS TO THE ANSWER, AND WHY EACH PIECE IS HERE ───────────
 * 1. THE RANGE, from the event. GitHub hands a push its own
 *    `before`, which is the integration branch's tip before this push
 *    landed — exactly THE RANGE RULE's own pair for a reader who has
 *    the merge (docs/CONVENTIONS.md). Every event that cannot produce
 *    such a pair owes the WHOLE BATTERY, named and reasoned.
 * 2. THE SHARDS. Playwright's own unit of parallelism is the spec file
 *    and T-271's owning-spec map already answers in spec files, so the
 *    split is by owning spec and needs no second notion of a test id.
 * 3. THE JOB SWITCHES. One `run-<suite>` per graded suite, read by the
 *    workflow's own `if:` — so a suite the range does not owe is a
 *    SKIPPED JOB rather than a job that starts and decides to do
 *    nothing, which is the difference between eleven minutes and one.
 *
 * ── THE ONLY DIRECTION THIS MAY BE WRONG IN ──────────────────────────
 * Inherited from the derivation it calls, and kept: it may owe too
 * MUCH; it must never owe too little. Every inability here — an
 * unreadable event, a range with no left-hand end, a derivation that
 * refuses — lands on the whole battery with the reason recorded in the
 * output, never on a shorter set.
 */

import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALL_SUITES,
  GRADED_SUITES,
  OWED_SET_FLAG,
  RANGE_FLAG,
  SCOPED_SUITE,
  TREE_FLAG,
  repoRoot,
  scopedSuite,
  specFiles,
  suiteOfPath,
} from "./gate-run.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

/** The program that owns the derivation, as this file spawns it. */
export const GATE_RUN_PATH = path.join(here, "gate-run.mjs");

/** How many runner jobs the end-to-end leg is split across by default. */
export const DEFAULT_SHARD_COUNT = 4;

/** The environment key a workflow may set to move that number. */
export const SHARD_COUNT_ENV = "E2E_SHARD_COUNT";

/** A commit id as the event payload spells it, and the one that is not one. */
const SHA_RE = /^[0-9a-f]{7,64}$/;
const ZERO_SHA_RE = /^0+$/;

/**
 * The package roots BOOT GATE's own trigger lies inside — read as SUITE
 * IDS, because that is the vocabulary `suiteOfPath` answers in and the
 * registry is where those roots are written down once.
 */
export const BOOT_SUITES = Object.freeze(["app", "rust"]);

/** exit codes, in this file's own words. */
export const EXIT = Object.freeze({ OK: 0, REFUSED: 3 });

/**
 * The argv that asks the derivation, exactly as the criterion spells it.
 *
 * WRITTEN AS A FUNCTION AND NOT AS A STRING so that the spelling the
 * runner uses is the spelling a body can read back — a command a spec
 * retypes is a command that can drift from the one that runs.
 *
 * @param {string} range
 * @param {string} [root]
 * @returns {string[]}
 */
export function owedSetArgv(range, root = repoRoot) {
  return [GATE_RUN_PATH, OWED_SET_FLAG, RANGE_FLAG, range, TREE_FLAG, root];
}

/**
 * WHICH TWO COMMITS THIS EVENT IS ABOUT — or why it has no pair.
 *
 * A PURE FUNCTION OF THE PAYLOAD, so every branch below is reachable
 * from a body with no runner, no network and no repository.
 *
 * THE PUSH CASE IS THE RANGE RULE'S OWN PAIR. `github.event.before` is
 * the branch's tip BEFORE this push, and the pushed tip is its right
 * end, so the diff is what this push added — the integrator's row of
 * that rule's table. It is not `<merge-base>..<tip>` and not
 * `<main>..HEAD` between divergent tips; the derivation checks the
 * ancestry for itself and refuses if it is ever handed one of those.
 *
 * A BRANCH'S FIRST PUSH REPORTS AN ALL-ZERO `before`, which is not a
 * commit, so it has no left end and owes everything.
 *
 * @param {object} event
 * @param {string} [event.eventName]
 * @param {string} [event.before]
 * @param {string} [event.sha]
 * @param {string} [event.baseSha]  a pull request's base commit
 * @returns {{ range: string } | { whole: string }}
 */
export function rangeForEvent({ eventName, before, sha, baseSha } = {}) {
  const name = String(eventName ?? "");
  const tip = String(sha ?? "");
  if (name === "schedule") {
    return {
      whole:
        "a schedule trigger owes the WHOLE BATTERY by construction — it is the " +
        "nightly net ADR-024 decision 4 put on a clock, and a net that ran a subset " +
        "would be the same subset the pushes already ran",
    };
  }
  if (!SHA_RE.test(tip)) {
    return {
      whole:
        `this run reports its own commit as ${JSON.stringify(tip)}, which is not a ` +
        "commit id, so no range has a right-hand end here",
    };
  }
  if (name === "push") {
    const left = String(before ?? "");
    if (ZERO_SHA_RE.test(left) && left !== "") {
      return {
        whole:
          "this push reports an all-zero `before`, which is how a branch's FIRST " +
          "push spells `there was nothing here` — a range with no left-hand end",
      };
    }
    if (!SHA_RE.test(left)) {
      return {
        whole:
          `this push reports \`before\` as ${JSON.stringify(left)}, which is not a ` +
          "commit id, so the range this push added cannot be spelled",
      };
    }
    return { range: `${left}..${tip}` };
  }
  if (name === "pull_request") {
    const base = String(baseSha ?? "");
    if (!SHA_RE.test(base)) {
      return {
        whole:
          `this pull request reports its base as ${JSON.stringify(base)}, which is ` +
          "not a commit id",
      };
    }
    return { range: `${base}..${tip}` };
  }
  return {
    whole:
      `\`${name}\` is an event this derivation has no pair of commits for — a hand ` +
      "started run names no range, so it owes everything",
  };
}

/**
 * The spec files split across runner jobs, BY OWNING SPEC.
 *
 * ROUND ROBIN OVER THE SORTED LIST, and the flatness is the point: this
 * project has no per-spec DURATION record, so any weighting here would
 * be a guess wearing arithmetic. The sort makes the split a pure
 * function of the set — the same owed set produces the same shards on
 * every runner and in every re-run — and the SHARD COUNT is the lever
 * that is actually measurable, which is why it is an input.
 *
 * A SHARD IS NEVER EMPTY. Fewer specs than shards yields fewer shards,
 * not idle runners holding an empty argument list — and an empty spec
 * list handed to the leg would run ALL of it, which is the safe
 * direction but not the one anybody asked for.
 *
 * @param {string[]} specs  repo-relative spec paths
 * @param {number} count
 * @returns {string[][]}
 */
export function shardSpecs(specs, count) {
  const n = Math.max(1, Math.floor(Number(count)) || 1);
  const sorted = [...specs].sort();
  /** @type {string[][]} */
  const buckets = Array.from({ length: n }, () => []);
  sorted.forEach((spec, i) => {
    /** @type {string[]} */ (buckets[i % n]).push(spec);
  });
  return buckets.filter((b) => b.length > 0);
}

/**
 * The specs a shard hands the leg, spelled from the leg's own directory.
 *
 * THE RELATIVISATION IS `scopedSuite`'S, CALLED. That function already
 * knows where the runner will be standing when it invokes the leg, and
 * a second implementation of "strip the package root" is a second
 * chance to strip the wrong one.
 *
 * @param {string[]} specs
 * @returns {string[]}
 */
export function specsFromLegDir(specs) {
  const leg = GRADED_SUITES[SCOPED_SUITE];
  return scopedSuite(specs, leg).argv.slice(leg.argv.length);
}

/**
 * @typedef {object} CiPlan
 * @property {string} range     the range derived, or "" when there was none
 * @property {boolean} whole    the whole battery is owed
 * @property {string} why       why it is owed whole, or "" when it is derived
 * @property {string[]} suites  the graded suites this run owes, sorted
 * @property {boolean} e2eWhole the end-to-end leg is owed whole
 * @property {boolean} boot     the boot check is owed
 * @property {{ shard: number, shards: number, specs: string }[]} shards
 * @property {number} specCount how many spec files the leg will run
 */

/**
 * THE PLAN, AND IT IS A PURE FUNCTION OF ITS NAMED INPUTS.
 *
 * ── WHY THE BOOT CHECK IS DERIVED FROM THE CHANGED PATHS AND NOT FROM
 * ITS OWN TRIGGER. BOOT GATE fires on `app/src-tauri/**`, `app/src/**`
 * and the two manifests (docs/CONVENTIONS.md). EVERY ONE OF THOSE PATHS
 * LIES UNDER THE APP OR RUST PACKAGE ROOT, so "a changed path this
 * derivation places into the app or rust suite" is a SUPERSET of that
 * trigger, computed from the package roots the derivation already read
 * rather than from a second copy of a rule that lives in a document.
 * The superset is the permitted direction: a change to a README under
 * app/ runs the boot check it did not strictly owe, and no change that
 * owes it is ever missed.
 *
 * AND IT IS THE PATHS, NOT THE SUITES, FOR A MEASURED REASON. Asking
 * "is the app suite owed" looked equivalent and is not: the DOCS GATE's
 * reader map owes the app suite for a change under `docs/tasks/`,
 * because the app's own dogfood bodies parse the live cards. Keyed to
 * the suite, EVERY records-only push dragged in the boot check — and
 * with it the apt prerequisites, the cargo cache and a tauri build, on
 * the one push shape this card exists to bring under five minutes.
 * Measured on a real records-only range (one task card, a5f3e89..fb72014):
 * the suite test says boot, the path test says no boot, and BOOT GATE's
 * own trigger matches nothing in it.
 *
 * @param {object} input
 * @param {{ suites: string[], e2e: { whole: boolean, specs: string[] }, failClosed?: string | undefined } | undefined} input.owed
 *   the derivation's answer, or undefined when the whole battery is owed
 * @param {string[]} [input.changed]  the repo-relative paths the range moved
 * @param {string} [input.range]
 * @param {string} [input.why]     why the whole battery is owed
 * @param {number} [input.shardCount]
 * @param {string[]} [input.allSpecs]  every spec file, for the whole case
 * @returns {CiPlan}
 */
export function ciPlan({
  owed,
  changed = [],
  range = "",
  why = "",
  shardCount = DEFAULT_SHARD_COUNT,
  allSpecs = [],
}) {
  const whole = owed === undefined;
  const suites = whole ? [...ALL_SUITES] : [...owed.suites].sort();
  const e2eOwed = suites.includes(SCOPED_SUITE);
  const e2eWhole = whole || owed.e2e.whole;
  const specs = !e2eOwed ? [] : e2eWhole ? [...allSpecs].sort() : [...owed.e2e.specs].sort();
  const split = specs.length === 0 ? [] : shardSpecs(specs, shardCount);
  // ONE SPECLESS ENTRY WHEN THE LEG IS NOT OWED, never an empty matrix:
  // the job is skipped by its own `if:` and a matrix that expands to
  // nothing is a workflow-level error rather than a skipped job.
  const shards =
    split.length === 0
      ? [{ shard: 1, shards: 1, specs: "" }]
      : split.map((b, i) => ({
          shard: i + 1,
          shards: split.length,
          specs: specsFromLegDir(b).join(" "),
        }));
  return {
    range,
    whole,
    // THE REASON TRAVELS WITH THE ANSWER, from whichever of the two
    // places produced it: this file's own inability to name a range, or
    // the derivation's own fail-closed sentence. A set that is the whole
    // battery without a reason is a set nobody can audit.
    why: whole ? why : (owed?.failClosed ?? ""),
    suites,
    e2eWhole,
    boot: whole || changed.some((p) => BOOT_SUITES.includes(String(suiteOfPath(p)))),
    shards,
    specCount: specs.length,
  };
}

/**
 * The plan as the workflow reads it: one `key=value` per line, with the
 * multi-line values wrapped in GitHub's own heredoc form.
 *
 * A JOB SWITCH PER GRADED SUITE, DERIVED FROM THE REGISTRY — so a fifth
 * graded suite arrives with its own switch and the workflow's author
 * meets a missing `run-<id>` rather than a silently unrun leg.
 *
 * @param {CiPlan} plan
 * @returns {string[]}
 */
export function outputLines(plan) {
  /** @type {string[]} */
  const lines = [];
  /** @param {string} key @param {string} value */
  const put = (key, value) => {
    if (value.includes("\n")) {
      lines.push(`${key}<<CI_OWED_EOF`, value, "CI_OWED_EOF");
    } else {
      lines.push(`${key}=${value}`);
    }
  };
  put("range", plan.range);
  put("whole", String(plan.whole));
  put("why", plan.why.replace(/\s+/g, " ").trim());
  put("suites", plan.suites.join(","));
  for (const id of ALL_SUITES) put(`run-${id}`, String(plan.suites.includes(id)));
  put("run-boot", String(plan.boot));
  put("e2e-whole", String(plan.e2eWhole));
  put("spec-count", String(plan.specCount));
  put("shard-count", String(plan.shards.filter((s) => s.specs !== "").length));
  put("shards", JSON.stringify(plan.shards));
  return lines;
}

/**
 * Ask the derivation, by spawning the program that owns it.
 *
 * IT ALWAYS ANSWERS IN JSON, INCLUDING WHEN IT REFUSES, which is what
 * lets this caller tell "no suite is owed" from "the question could not
 * be asked" without parsing English.
 *
 * @param {string} range
 * @param {string} [root]
 * @param {(argv: string[]) => { status: number | null, stdout: string, stderr: string }} [spawn]
 * @returns {{ owed: Record<string, unknown> } | { problem: string }}
 */
export function askOwedSet(range, root = repoRoot, spawn = undefined) {
  const argv = owedSetArgv(range, root);
  const run =
    spawn ??
    ((a) => {
      const r = spawnSync(process.execPath, a, {
        encoding: "utf8",
        maxBuffer: 32 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      });
      return { status: r.status, stdout: String(r.stdout ?? ""), stderr: String(r.stderr ?? "") };
    });
  const result = run(argv);
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (err) {
    return {
      problem:
        `the derivation's answer is not JSON (${err instanceof Error ? err.message : String(err)}) ` +
        `— it exited ${String(result.status)} and said: ${
          (result.stderr || result.stdout).trim().split("\n")[0] ?? ""
        }`,
    };
  }
  const obj = /** @type {Record<string, unknown>} */ (parsed ?? {});
  if (typeof obj["problem"] === "string") return { problem: String(obj["problem"]) };
  if (!Array.isArray(obj["suites"])) {
    return { problem: "the derivation's answer carries no `suites` array, so it names no set" };
  }
  return { owed: obj };
}

/**
 * @param {Record<string, string | undefined>} env
 * @returns {number}
 */
export function shardCountFromEnv(env) {
  const raw = env[SHARD_COUNT_ENV];
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_SHARD_COUNT;
}

/**
 * @param {Record<string, string | undefined>} env
 * @param {string} [root]
 * @returns {{ plan: CiPlan, said: string[] }}
 */
export function derive(env, root = repoRoot) {
  /** @type {string[]} */
  const said = [];
  const shardCount = shardCountFromEnv(env);
  const chosen = rangeForEvent({
    eventName: env["GITHUB_EVENT_NAME"],
    before: env["CI_PUSH_BEFORE"],
    sha: env["GITHUB_SHA"],
    baseSha: env["CI_PR_BASE_SHA"],
  });
  if ("whole" in chosen) {
    said.push(`THE WHOLE BATTERY IS OWED — ${chosen.whole}`);
    return {
      plan: ciPlan({ owed: undefined, why: chosen.whole, shardCount, allSpecs: specFiles(root) }),
      said,
    };
  }
  said.push(
    `asking the derivation, exactly as a seat would at home:\n  node ${owedSetArgv(
      chosen.range,
      root,
    ).join(" ")}`,
  );
  const answer = askOwedSet(chosen.range, root);
  if ("problem" in answer) {
    const why = `the derivation could not answer for ${chosen.range} — ${answer.problem}`;
    said.push(`THE WHOLE BATTERY IS OWED — ${why}`);
    return {
      plan: ciPlan({ owed: undefined, range: chosen.range, why, shardCount, allSpecs: specFiles(root) }),
      said,
    };
  }
  const owed = /** @type {{ suites: string[], e2e: { whole: boolean, specs: string[] }, failClosed?: string, changed?: string[] }} */ (
    answer.owed
  );
  if (typeof owed.failClosed === "string" && owed.failClosed !== "") {
    said.push(`THE DERIVATION FAILED CLOSED — ${owed.failClosed}`);
  }
  const plan = ciPlan({
    owed,
    changed: Array.isArray(owed.changed) ? owed.changed : [],
    range: chosen.range,
    shardCount,
    allSpecs: specFiles(root),
  });
  said.push(
    `${chosen.range} owes ${plan.suites.join(", ") || "no graded suite"}` +
      (plan.suites.includes(SCOPED_SUITE)
        ? ` (${SCOPED_SUITE} over ${String(plan.specCount)} spec file(s) in ${String(
            plan.shards.filter((s) => s.specs !== "").length,
          )} shard(s))`
        : ""),
  );
  return { plan, said };
}

/**
 * @param {string[]} argv
 * @param {Record<string, string | undefined>} env
 * @returns {number}
 */
function main(argv, env) {
  const root = env["CI_OWED_TREE"] ?? repoRoot;
  const { plan, said } = derive(env, root);
  for (const line of said) process.stderr.write(`ci-owed: ${line}\n`);
  const lines = outputLines(plan);
  const out = env["GITHUB_OUTPUT"];
  if (out === undefined || out === "") {
    process.stdout.write(`${lines.join("\n")}\n`);
    return EXIT.OK;
  }
  try {
    appendFileSync(out, `${lines.join("\n")}\n`);
  } catch (err) {
    process.stderr.write(
      "ci-owed: THE PLAN COULD NOT BE WRITTEN to the job's output file " +
        `(${err instanceof Error ? err.message : String(err)}). Nothing downstream can read ` +
        "which suites are owed, and a run that guessed would be a run that owed too little.\n",
    );
    return EXIT.REFUSED;
  }
  process.stdout.write(`${lines.join("\n")}\n`);
  return EXIT.OK;
}

// `process.exitCode` AND NOT `process.exit()`. A command that ends at
// `process.exit()` drops whatever stdout has not drained — invisible to
// a file and to a TTY, silent to a pipe — and this program's whole
// output is the plan a later step reads. Setting the code lets node
// leave when the writes are done. `brief-flush.spec.ts` keeps that
// class, and it named this file the moment it existed.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2), process.env);
}
