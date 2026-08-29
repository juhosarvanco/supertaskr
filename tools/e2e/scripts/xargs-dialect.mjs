/**
 * THE `xargs` DIALECT, PROBED AT RUN TIME (T-153-s6).
 *
 * `xargs` is not one utility. Two dialects ship on the two platforms this
 * repository runs on, and they differ in the two ways that matter to a
 * gate whose exit code is its whole product:
 *
 *   - ON EMPTY INPUT. BSD `xargs` never invokes the utility, so the
 *     pipeline exits 0 — the utility's own empty-list refusal is
 *     unreachable through the pipe. GNU `xargs` invokes it once with no
 *     arguments (its `--no-run-if-empty` is what buys BSD's behaviour),
 *     so the refusal FIRES and the pipeline reports it.
 *   - ON A NONZERO UTILITY EXIT. BSD collapses every one to 1; GNU maps
 *     1–125 to 123.
 *
 * WHY THIS IS A PROBE AND NOT A `process.platform` SWITCH. The question
 * a spec needs answered is what the `xargs` ON THIS PATH does, and that
 * is not a property of the operating system: a mac with GNU findutils
 * installed, a linux image built on busybox, and a runner whose PATH is
 * ordered differently are all cases where the platform name is the wrong
 * answer to the right question. Both properties are OBSERVED here — the
 * empty-input arm with a marker the utility prints, so "did it run" is
 * read rather than inferred — and the dialect is whichever row of
 * `XARGS_DIALECTS` matches BOTH observations.
 *
 * AND A THIRD DIALECT REDS RATHER THAN PASSES. A probe that matches no
 * row reports `unknown`, which every caller is required to treat as a
 * failure: the alternative is a machine whose behaviour nobody measured
 * silently taking whichever branch was written first. That is the same
 * defect this module exists to repair — CI runs 33259394002 and
 * 33260414204, where a demonstration written against BSD met GNU.
 *
 * Nothing here reads the repository, and that is deliberate: this module
 * resolves no path under `docs/`, so it is not a DOCS GATE reader and
 * does not move that census (docs/CONVENTIONS.md, DOCS GATE bullet).
 */

import { spawnSync } from "node:child_process";

/**
 * The dialects this project has MET, as the observables that tell them
 * apart rather than as platform names. A row is added here only with a
 * measurement, and adding one obliges the DOCS GATE bullet's exit-code
 * matrix to grow its column — `range-rule.mjs`'s
 * `docs-gate-recipe-exit-codes` check compares the two sets and reds
 * when they disagree, in either direction.
 *
 * @type {Readonly<Record<string, Readonly<{ runsUtilityOnEmptyInput: boolean, nonzeroBecomes: number }>>>}
 */
export const XARGS_DIALECTS = Object.freeze({
  bsd: Object.freeze({ runsUtilityOnEmptyInput: false, nonzeroBecomes: 1 }),
  gnu: Object.freeze({ runsUtilityOnEmptyInput: true, nonzeroBecomes: 123 }),
});

/**
 * The exit code the probe's utility produces. Deliberately neither 1 nor
 * 123: it is a value both dialects REWRITE, so an `xargs` that passed a
 * status through unchanged would match no row instead of accidentally
 * matching one.
 */
const PROBE_EXIT = 7;

/** The marker the empty-input probe's utility prints if it is invoked at
 *  all. Read off stdout, so the answer is observed and not inferred. */
const MARKER = "XARGS-RAN";

/**
 * @typedef {object} XargsProbe
 * @property {"bsd" | "gnu" | "unknown" | "absent"} name   the matching row of `XARGS_DIALECTS`, or why there is none
 * @property {boolean} present                             is there an `xargs` on this PATH at all
 * @property {boolean} runsUtilityOnEmptyInput             observed with a printed marker
 * @property {number} nonzeroBecomes                       observed: what a utility exit of 7 arrives as
 * @property {string} evidence                             one line, for a disclosure the reader can check
 */

/** @param {string} script @returns {{ status: number, out: string }} */
function sh(script) {
  const run = spawnSync("/bin/sh", ["-c", script], { encoding: "utf8" });
  return { status: run.status === null ? -1 : run.status, out: `${run.stdout ?? ""}${run.stderr ?? ""}` };
}

/** @type {XargsProbe | undefined} */
let cached;

/**
 * Probe the `xargs` on this PATH, once per process.
 *
 * @returns {XargsProbe}
 */
export function probeXargs() {
  if (cached !== undefined) return cached;

  const which = sh("command -v xargs");
  if (which.status !== 0) {
    cached = {
      name: "absent",
      present: false,
      runsUtilityOnEmptyInput: false,
      nonzeroBecomes: -1,
      evidence: "`command -v xargs` found no xargs on this PATH",
    };
    return cached;
  }
  const where = which.out.trim().split("\n")[0] ?? "xargs";

  // ARM ONE — does an EMPTY input invoke the utility? The utility prints
  // a marker; the marker's presence on stdout is the observation.
  const empty = sh(`printf '' | xargs /bin/sh -c 'printf ${MARKER}'`);
  const runsUtilityOnEmptyInput = empty.out.includes(MARKER);

  // ARM TWO — what does a NONZERO utility exit arrive as? One line of
  // input, so the utility runs on both dialects and only the mapping is
  // under test.
  const mapped = sh(`printf 'x\\n' | xargs /bin/sh -c 'exit ${PROBE_EXIT}'`);
  const nonzeroBecomes = mapped.status;

  const match = Object.entries(XARGS_DIALECTS).find(
    ([, d]) =>
      d.runsUtilityOnEmptyInput === runsUtilityOnEmptyInput && d.nonzeroBecomes === nonzeroBecomes,
  );

  cached = {
    name: match === undefined ? "unknown" : /** @type {"bsd" | "gnu"} */ (match[0]),
    present: true,
    runsUtilityOnEmptyInput,
    nonzeroBecomes,
    evidence:
      `xargs at ${where}: empty input ${runsUtilityOnEmptyInput ? "RUNS" : "does NOT run"} ` +
      `the utility; a utility exit of ${PROBE_EXIT} arrives as ${nonzeroBecomes}` +
      (match === undefined
        ? ` — which matches NO row of XARGS_DIALECTS (${Object.keys(XARGS_DIALECTS).join(", ")})`
        : ` — the ${match[0]} row`),
  };
  return cached;
}

/**
 * The two-sided pin, as a function rather than as a habit: the dialects
 * must DISAGREE about the observable a caller is branching on, or the
 * branch is decoration. A caller asserts this against its own expectation
 * table so that collapsing the two branches into one reds here rather
 * than passing everywhere.
 *
 * @param {(d: Readonly<{ runsUtilityOnEmptyInput: boolean, nonzeroBecomes: number }>) => unknown} of
 * @returns {boolean}
 */
export function dialectsDiverge(of) {
  const values = Object.values(XARGS_DIALECTS).map(of);
  return new Set(values.map((v) => JSON.stringify(v))).size === values.length;
}
