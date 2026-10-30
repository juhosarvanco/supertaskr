#!/usr/bin/env node
/**
 * THE BLESSED GATE-RUNNER (T-202) — the ONLY sanctioned way to run a
 * graded suite in this repository.
 *
 * ── THE CHARTER, WHICH FOUR SEATS REACHED INDEPENDENTLY IN ONE NIGHT ─
 *
 *   AN EXIT CODE IS A SUMMARY, AND A SUMMARY OF NOTHING IS
 *   INDISTINGUISHABLE FROM A SUMMARY OF SUCCESS.
 *
 * Six measured instances put this file here. Every one was re-measured
 * at 146ebb6 before a line of it was written, because a card's own
 * evidence is a figure like any other:
 *
 *  1. ROOT-CWD GREENS. There is no `package.json` at the repository
 *     root; scripts live in tools/e2e/. `npm run lint:docs` from the
 *     root exits **254**. Through `tail -1` the shell reports **0**.
 *     Read as green four consecutive times, with three card commits made
 *     on their strength. Controls both ways, re-run here: `false | tail
 *     -1` -> 0; under `set -o pipefail` -> 1.
 *  2. A RED OVER ZERO BODIES. T-167-s8's mutant broke syntax, so the
 *     suite exited 1 having run NO bodies at all. An exit code calls
 *     that a kill. It is not one — nothing was executed to survive.
 *  3. A GREEN FOR AN UNRELATED REASON. The same lane's other mutant left
 *     a commit non-empty because a bare repo inside the fixture root was
 *     being added as blobs; the arm's precondition could not be killed
 *     from the side it depended on.
 *  4. A CRATE-SCOPE COUNT DESCRIBING ONE TARGET. `cargo test` without
 *     `--no-fail-fast` stops after the first failing target. Re-measured
 *     at 146ebb6 on a four-target scratch crate: fail-fast reported ONE
 *     `test result:` line (2 bodies), `--no-fail-fast` reported FOUR
 *     (7 bodies) — and **both runs exited 101**. The exit code cannot
 *     tell those two apart. That is this file's charter in one reading.
 *  5. A COMPARISON OVER AN EMPTY CORPUS. `diff` of two empty files
 *     exits 0; a dupe scan over nothing reports zero dupes. Re-measured
 *     at 146ebb6. "The failure wore the drill's own costume."
 *  6. A PHANTOM INTERMITTENT. T-112-s4 read a suite exit through a pipe
 *     and nearly shipped an intermittent that did not exist.
 *
 * ── WHAT THIS FILE REFUSES, AND WHY EACH REFUSAL IS A MEASUREMENT ────
 *
 * REFUSAL IS THE POINT. A runner that can only ever report green is this
 * card's own subject wearing this card's costume, so every guard below
 * is exercised by a body in tools/e2e/tests/gate-run.spec.ts that makes
 * it FIRE — the positive control was built before the runner was.
 *
 *   cd            A wrong directory is a REFUSAL, never a different
 *                 answer. Instance 1 is the whole argument: the root cwd
 *                 did not fail, it answered a DIFFERENT QUESTION (npm's
 *                 "no package.json here") and the answer was read as
 *                 this one's. Every entry declares a `sentinel` — a file
 *                 that must exist in the cwd — so the guard proves it is
 *                 in the right tree rather than merely in some tree.
 *   pipe          The graded command is never piped, and CANNOT be:
 *                 spawnSync with an argv ARRAY and `shell: false` has no
 *                 shell to hold a `|`. Output is REDIRECTED to a file,
 *                 `status` is captured, and the file is read AFTERWARDS.
 *                 A registry entry carrying a shell metacharacter is
 *                 refused at validation, naming the argv-array spelling.
 *   zero bodies   A run that executed NOTHING is never success, whatever
 *                 it exited. This is instances 2 and 5, and it is the
 *                 one guard that would have caught them both.
 *   parts != base A count whose parts do not sum to the run's OWN
 *                 baseline is refused rather than reported. Both
 *                 runners print that baseline themselves — cargo's
 *                 `running N tests`, Playwright's `Running N tests using
 *                 M workers` — so this compares a tool against itself
 *                 and needs no landed figure to go stale.
 *   fail-fast     `cargo` is ALWAYS passed `--no-fail-fast`, and the
 *                 TARGET count is reported beside the body count. This
 *                 is instance 4, which is invisible to the exit code.
 *   solo          A timing bench and a full suite must not run beside
 *                 each other; see THE SOLO GUARD below.
 *   verdict field A verdict line missing any required field is refused
 *                 by the parser, so a downstream reader (T-203) can
 *                 never accept a token that says less than it must.
 *
 * ── ONE SPELLING, AND THAT IS THE DOCS GATE'S DOCTRINE EXTENDED ──────
 * T-142-s1: a gate with two invocations grows a mode whose exit means
 * something else, and `lint:docs` is this repository's worked example.
 * So the registry below is the ONE spelling of every graded suite, and
 * docs/CONVENTIONS.md names this command and no other.
 *
 * WHICH IS WHY THE REGISTRY HOLDS BODY-RUNNING SUITES ONLY. The
 * no-body gates (`index --check`, `lint:tokens`, `lint:docs`,
 * `capabilities:check`, `typecheck`, `build`, `audit`) are checks, not
 * graded suites: they have no body count, so admitting them would need
 * an exemption from the zero-body refusal — a second mode whose exit
 * means something else, which is the exact failure T-142-s1 names. They
 * keep their own four-code legends in docs/CONVENTIONS.md.
 *
 * ── THE SOLO GUARD: A LOCK, AND HERE IS THE ARGUMENT ─────────────────
 * T-088-s4's hazard names contention as a cause: this seat's own
 * `cargo test` run beside a verifier's bench produced a `startup_arm`
 * red that cost two attributions. Three shapes were available.
 *   A DECLARED EXCLUSION cannot see another process, so it documents the
 *   hazard without detecting it — which is what docs/STATE.md already
 *   does, and the incident happened anyway.
 *   A CHECK ("is anything else running?") races: the window between
 *   looking and starting is exactly when the other run starts.
 *   A LOCK is what remains, so the runner takes one — and REFUSES
 *   rather than WAITS. Waiting would make a bench's own measurement
 *   depend on how long it waited, which converts a contention red into
 *   a slower green and loses the signal instead of reporting it. A
 *   refusal costs a re-run and keeps the reading honest.
 * The lock is advisory and keyed to the repo root, holds the pid, and is
 * reclaimed when its holder is gone — a crashed run must not wedge the
 * gate. **KEYED ON THE WHOLE ROOT PATH, by a digest of it** (T-202-s1):
 * the key was a SUFFIX of the path and collided for every pair of
 * checkouts agreeing on their last eight bytes, which a lane and its
 * own verifier bench do for every eight-character card id. See
 * `lockPath` for the measurement and for why the FILE does not move.
 *
 * ── THE HONEST RESIDUAL, SAID OUT LOUD ──────────────────────────────
 * A child that PRINTS a plausible summary having run nothing is reported
 * GREEN: a forged `Running 5 tests` / `5 passed` transcript counts as
 * five bodies. The baseline and the parts come from the SAME transcript,
 * so this runner's floor is the reporter's own honesty. That is inherent
 * to counting a tool's self-report rather than its processes; it is not
 * a defect this card can close, and it is written here so the next
 * reader does not take the guard for wider than it is. What the runner
 * DOES close is every case where the tool was honest and the reader
 * was not — which is all six of the measured instances above.
 *
 * ── THE VERDICT IS ALSO LEFT WHERE A LATER PROCESS CAN ASK (T-203) ───
 * The line below is trustworthy to whoever is reading the terminal, and
 * to nobody else — so the same verdicts are written to `.supertaskr/`'s
 * runtime token, keyed by the TREE the suites ran against, and the
 * pre-push guard refuses a push whose token is missing, stale or red.
 * That file's own header carries the argument for the tree hash and for
 * why the token may never be committable. Every verdict is recorded,
 * including RED and REFUSED ones: a writer that saved only the greens
 * would make a red run indistinguishable from a run nobody made, which is
 * this file's charter one layer downstream.
 *
 * ── AND THE TREE IS READ BESIDE THE REF, BEFORE THE SPAWN (T-203-s1) ─
 * The two identifiers used to be read at different times: this file
 * captured `ref` before it spawned the suite, and the token writer read
 * `HEAD^{tree}` when it wrote — after the suite had finished. A commit
 * landing in between minted an entry whose `ref` named the commit the
 * suite graded and whose `tree` named a LATER one, and the push guard's
 * `token-stale` is keyed on the tree, so the refusal built for exactly
 * this could not fire. This repository has one such token on the record
 * (`ref=300d04b` beside `tree=48d50df`, two commits apart, one run), and
 * the e2e leg's own duration band says the window is ordinary rather
 * than rare. So `runSuite` now reads the TREE and the DIRT beside the
 * ref, before anything is spawned, and carries both on the verdict; the
 * writer records them next to what HEAD reached by write time, and a
 * disagreement is refused there. THE SAME LESSON AS THE VERDICT LINE:
 * a figure is worth what the moment it was read at is worth.
 *
 * ── THE COMPANION RULE THIS FILE MAKES THIS REPOSITORY IMMUNE TO ─────
 * Scripts print their own `$?` last; readers trust the printed line and
 * never a wrapper's summary. Measured three times on 2026-08-31 in three
 * different sessions: a background runner reported "exit code 0" while
 * the script's own captured `$?` held 1. THAT HALF IS UPSTREAM'S, not
 * this repository's, and the card says so — it wants a harness repro,
 * not a card here. What this file owns is the local immunity: the
 * verdict line below IS the printed line, it is printed last, and it
 * carries the exit code as DATA rather than as the process's own status.
 *
 * ── AND ONE LEG MAY BE GRADED NARROWER THAN A LEG (T-271) ────────────
 * `e2e --owning <changed path>…` grades the SPEC FILES THAT OWN a
 * change and nothing else. It exists because the e2e leg is ten of the
 * battery's eleven minutes and a lane iterates on one hook and one spec;
 * measured on T-224's fix passes, every seat paid the whole leg for a
 * change whose owning spec runs in seconds.
 *
 * WHICH SEATS, AND THE ANSWER IS ONE (the card's second criterion,
 * amended at @human's question "is it sure that this doesn't make bugs
 * more likely?"): the EXECUTOR'S ITERATIONS. The verifier's one run and
 * the integrator's run on merged main before the push stay the full four
 * legs, because a cross-spec red — the class T-264's executor found four
 * of by running everything — must be found in the lane's own ceremony
 * and not on merged main, where the answer is the revert play. Scoping
 * the iterations keeps the time where suites run most often and loses no
 * run that stands before a verdict or a push.
 *
 * THE SUBSET IS DERIVED, NEVER NAMED. `owningSpecs` reads a STATIC
 * IMPORT GRAPH rooted at the spec files themselves — a spec owns a
 * changed path when it IS that path or reaches it through imports — and
 * for a path under docs/ it reuses THE DOCS GATE'S OWN READER MAP rather
 * than deriving a second one (T-057: a rule with two implementations is
 * two chances to disagree). A SPEC'S NAME IS NEVER CONSULTED: the file
 * `gate-run.spec.ts` owning `gate-run.mjs` is a fact about an import
 * statement here, and matching stems would have been a heuristic that
 * silently misses `helpers.ts`.
 *
 * AND IT REFUSES RATHER THAN GRADING NOTHING. A changed path the
 * derivation cannot place — an app source the e2e lane drives through a
 * browser, a script nothing imports, the Playwright config itself — is
 * exit 2 naming the path, and the full leg is owed. That direction is
 * the whole safety of the feature: the scoped form can only ever be
 * WRONG by running too MUCH.
 *
 * THE SUBSET NEVER MINTS THE PUSH TOKEN. Its verdict word is
 * `SCOPED-GREEN` or `SCOPED-RED`, written to the token under the leg's
 * own key, and `judgeToken` refuses anything that is not exactly GREEN —
 * so a lane that only ever ran scoped legs cannot push, and a scoped run
 * after a full battery POISONS the stale green rather than leaving it
 * standing. The push still owes the integrator's full battery.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { assertConfiguredDispatchGradeAuthority } from "./configured-dispatch-grade.mjs";
import { assertQualifiedIntegrationGradeAuthority } from "./qualified-integration-grade.mjs";
import {
  closeSync,
  existsSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  lstatSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TOKEN_REL_PATH,
  headTree,
  trackedDirt,
  writeToken,
} from "../../../cli/gate-token.mjs";
import { docsGate, docsReaders, sourceCorpus, stripComments, trackedFiles } from "./docs-scan.mjs";
import { loadInstalledRecordTool, requireInstalledRuntimeAssets } from "./records-check.mjs";
import { loadProjectSettings, requireProjectSection, PROJECT_SETTINGS } from "./project-settings.mjs";
import { captureOperationRepository } from "./durable-operation.mjs";
import { operationContent } from "./operation-record.mjs";
import { isMain } from "../../../cli/is-main.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
/** Repo root: tools/e2e/scripts -> tools/e2e -> tools -> root. */
export const repoRoot = path.resolve(here, "..", "..", "..");

/**
 * The four codes this repository's gates already answer in, so a reader
 * who knows one knows them all (docs/CONVENTIONS.md legends them per
 * gate; `health-bands.mjs` spells the same shape).
 *
 * REFUSED (3) IS NEVER A GREEN RUN AND NEVER A RED ONE. It means the
 * runner declined to produce a verdict — the whole point being that a
 * verdict it could not stand behind is worse than none.
 */
export const EXIT = Object.freeze({ GREEN: 0, RED: 1, USAGE: 2, REFUSED: 3 });

/** The token a verdict line opens with. T-203 consumes it; keep it stable. */
export const VERDICT_TOKEN = "gate-verdict";

/**
 * The fields a verdict line MUST carry. The card names three — exit code,
 * body count, ref — and `suite` and `verdict` join them because a token
 * that cannot say WHICH suite it graded, or what it CONCLUDED, is not a
 * verdict either. `parseVerdict` refuses a line missing any of them.
 */
export const REQUIRED_VERDICT_FIELDS = Object.freeze([
  "suite",
  "exit",
  "bodies",
  "ref",
  "verdict",
]);

/** Anything a shell would treat as syntax. A registry entry holding one
 *  of these is refused: it means somebody wrote a shell string where an
 *  argv array belongs, and `|` in particular is instance 1 and 6. */
const SHELL_METACHARACTERS = /[|&;<>()$`\\"'*?\[\]{}~\n\r]/;

/**
 * THE REGISTRY — the one spelling of every graded suite.
 *
 * `argv` is an ARRAY, always, because an array cannot hold a pipe.
 * `sentinel` is a file that must exist in `cwd`; it is what makes the cd
 * guard a proof rather than a hope (instance 1 ran in a real directory —
 * just not this one).
 * `solo` marks the suites whose readings are timing-sensitive, per
 * T-088-s4's cargo cache cliff and the e2e lane's own duration band.
 *
 * @typedef {object} Suite
 * @property {string} id
 * @property {string} cwd       Relative to repoRoot; resolved absolute.
 * @property {string} sentinel  Must exist in cwd, or the run is REFUSED.
 * @property {string[]} argv    Never a shell string.
 * @property {"cargo"|"playwright"|"vitest"|"unittest"} family
 * @property {boolean} solo
 * @property {string} why       Why this spelling, in a reader's words.
 */

// `@satisfies` AND NOT `@type`, deliberately: a `@type` annotation would
// make every entry possibly-undefined at the call sites and turn each
// `{...GRADED_SUITES.rust}` into a bag of optional properties, while a
// bare inference widens `family` to `string`. `@satisfies` checks the
// shape AND keeps the literal types the counters switch on.
// Compatibility export for existing pure/source-CI analysis only.
// Configured effect paths bind their own canonical project registry.
export { SOURCE_CI_SUITES as GRADED_SUITES } from "./source-ci-contract.mjs";
import { SOURCE_CI_SUITES as GRADED_SUITES } from "./source-ci-contract.mjs";

// ── VALIDATION: a bad entry is refused before anything runs ───────────

/**
 * Refuse a registry entry that could not be run honestly. Returns the
 * list of reasons; empty means the entry is sound.
 * TAKES `unknown` ON PURPOSE. A validator annotated with the type it is
 * meant to police can only ever be handed well-formed input, which makes
 * it decorative — the shape this file exists to refuse is exactly the
 * one that does not typecheck.
 *
 * @param {unknown} input
 * @returns {string[]}
 */
export function validateSuite(input) {
  /** @type {string[]} */
  const bad = [];
  if (!input || typeof input !== "object") return ["entry is not an object"];
  const s = /** @type {Record<string, unknown>} */ (input);
  for (const f of ["id", "cwd", "sentinel", "family", "why"]) {
    if (typeof s[f] !== "string" || s[f] === "") bad.push(`${f} is missing or empty`);
  }
  if (!Array.isArray(s.argv) || s.argv.length === 0) {
    bad.push("argv must be a non-empty ARRAY — a shell string can hold a pipe");
  } else {
    for (const a of s.argv) {
      if (typeof a !== "string") {
        bad.push(`argv holds a non-string ${JSON.stringify(a)}`);
      } else if (SHELL_METACHARACTERS.test(a)) {
        bad.push(
          `argv element ${JSON.stringify(a)} holds a shell metacharacter — ` +
            "this runner never uses a shell, so write it as separate argv " +
            "elements; a piped graded command is instances 1 and 6",
        );
      }
    }
  }
  if (s.family === "cargo" && Array.isArray(s.argv) && !s.argv.includes("--no-fail-fast")) {
    bad.push(
      "a cargo suite must pass --no-fail-fast, or its count describes " +
        "only the first failing target (instance 4)",
    );
  }
  if (typeof s.solo !== "boolean") bad.push("solo must be a boolean");
  if (!["cargo", "playwright", "vitest", "unittest"].includes(String(s.family))) bad.push("unsupported suite family");
  if (s.family === "unittest" && Array.isArray(s.argv) && !s.argv.some((arg) => arg === "-v" || arg === "--verbose")) {
    bad.push("a unittest suite must explicitly request -v or --verbose so its per-body records can be checked against Ran N tests");
  }
  return bad;
}

/** Validate the whole registry. @param {Readonly<Record<string,Suite>>} [reg] @returns {string[]} */
export function validateRegistry(reg = GRADED_SUITES) {
  const bad = [];
  for (const [key, s] of Object.entries(reg)) {
    if (key !== s.id) bad.push(`${key}: registry key does not match id ${s.id}`);
    for (const r of validateSuite(s)) bad.push(`${key}: ${r}`);
  }
  return bad;
}

// ── COUNTING: parts, baseline, targets ───────────────────────────────

/**
 * Strip ANSI escapes before counting.
 *
 * THIS IS NOT A TIDINESS MEASURE — it was a live defect this runner
 * caught in ITSELF, and the direction it failed in is the argument for
 * the whole file. Playwright exports `FORCE_COLOR` to its children, so
 * the list reporter's summary arrives as `\x1b[32m  1 passed\x1b[39m`.
 * A counter anchored at `^\s*(\d+)` then matches NOTHING and reports
 * ZERO BODIES for a run that executed two.
 *
 * Had the runner trusted the exit code it would have said RED and been
 * accidentally right. Because it counts, it REFUSED — loudly, at the
 * one moment its own parser was wrong. A gate that reports "I could not
 * count this" when its parser breaks is failing closed; the alternative
 * is instance 3, a green for an unrelated reason.
 * @param {string} text
 * @returns {string}
 */
export function stripAnsi(text) {
  // The ESC is spelled \u001B rather than pasted: a raw escape byte is
  // invisible in a source file and in a reviewer's diff, and losing it
  // leaves /\[[0-9;]*[A-Za-z]/, which silently eats ordinary text such
  // as [T-202]. Named, it cannot go missing without failing loudly.
  return String(text ?? "").replace(/\u001B\[[0-9;]*[A-Za-z]/g, "");
}

/**
 * @typedef {object} Count
 * @property {number} bodies    Test bodies the run actually executed.
 * @property {number} targets   Test binaries/targets reported (cargo).
 * @property {number|null} baseline  What the tool ITSELF said it would run.
 * @property {boolean} sums     parts === baseline.
 * @property {string} how       The derivation, in a reader's words.
 * @property {boolean} [reportedFailure] The tool explicitly printed a failed summary.
 */

/**
 * Cargo: one `running N tests` and one `test result:` line PER TARGET.
 * The baseline is the sum of the `running N` lines; the parts are
 * passed + failed + ignored + measured. `filtered out` is deliberately
 * excluded — cargo prints `running N` AFTER filtering, so adding it
 * would compare against a number the run never claimed.
 * @param {string} raw
 * @returns {Count}
 */
export function countCargo(raw) {
  const text = stripAnsi(raw);
  let baseline = 0;
  for (const m of text.matchAll(/^running (\d+) tests?$/gm)) baseline += Number(m[1]);
  let bodies = 0;
  let targets = 0;
  const re =
    /^test result: (?:ok|FAILED)\. (\d+) passed; (\d+) failed; (\d+) ignored; (\d+) measured;/gm;
  for (const m of text.matchAll(re)) {
    targets += 1;
    bodies += Number(m[1]) + Number(m[2]) + Number(m[3]) + Number(m[4]);
  }
  return {
    bodies,
    targets,
    baseline: targets === 0 ? null : baseline,
    sums: targets !== 0 && bodies === baseline,
    how:
      `${targets} 'test result:' line(s), parts summing to ${bodies}, ` +
      `against ${baseline} from the run's own 'running N tests' line(s)`,
  };
}

/**
 * Playwright's list reporter. Baseline is its own opening line; the
 * parts are the summary counters. `did not run` is counted into the
 * parts (it is a body the run accounted for) but NOT into `bodies`
 * (it is a body the run did not execute) — which is the distinction
 * this whole file exists to keep.
 * @param {string} raw
 * @returns {Count}
 */
export function countPlaywright(raw) {
  const text = stripAnsi(raw);
  const base = text.match(/^Running (\d+) tests? using \d+ workers?$/m);
  const baseline = base ? Number(base[1]) : null;
  /** @param {string} word @returns {number} */
  const one = (word) => {
    const m = text.match(new RegExp(`^\\s*(\\d+) ${word}(?:\\s|$|\\()`, "m"));
    return m && m[1] !== undefined ? Number(m[1]) : 0;
  };
  const passed = one("passed");
  const failed = one("failed");
  const flaky = one("flaky");
  const skipped = one("skipped");
  const didNotRun = one("did not run");
  const interrupted = one("interrupted");
  const bodies = passed + failed + flaky + interrupted;
  const parts = bodies + skipped + didNotRun;
  return {
    bodies,
    targets: 1,
    baseline,
    sums: baseline !== null && parts === baseline,
    how:
      `${passed} passed + ${failed} failed + ${flaky} flaky + ` +
      `${interrupted} interrupted = ${bodies} executed; with ${skipped} ` +
      `skipped and ${didNotRun} not run the parts are ${parts}, against ` +
      `${baseline ?? "NO BASELINE"} from the reporter's own opening line`,
  };
}

/**
 * Vitest's summary block. Its `Tests  N passed (M)` carries the parts
 * and the baseline on ONE line, which is why M is the baseline here.
 * @param {string} raw
 * @returns {Count}
 */
export function countVitest(raw) {
  const text = stripAnsi(raw);
  const line = text.match(/^\s*Tests\s+(.+?)\s*\((\d+)\)\s*$/m);
  if (!line) {
    return {
      bodies: 0,
      targets: 0,
      baseline: null,
      sums: false,
      how: "no vitest 'Tests ... (N)' summary line found",
    };
  }
  const baseline = Number(line[2] ?? "0");
  const counters = line[1] ?? "";
  /** @param {string} word @returns {number} */
  const grab = (word) => {
    const m = counters.match(new RegExp(`(\\d+) ${word}`));
    return m && m[1] !== undefined ? Number(m[1]) : 0;
  };
  const passed = grab("passed");
  const failed = grab("failed");
  const skipped = grab("skipped");
  const todo = grab("todo");
  const bodies = passed + failed;
  const parts = bodies + skipped + todo;
  return {
    bodies,
    targets: 1,
    baseline,
    sums: parts === baseline,
    how:
      `${passed} passed + ${failed} failed = ${bodies} executed; with ` +
      `${skipped} skipped and ${todo} todo the parts are ${parts}, ` +
      `against the line's own total of ${baseline}`,
  };
}

/** Verbose unittest provides independent per-test identities and Ran N total.
 * Subtests are indented and do not become extra test-method bodies. A quiet
 * summary alone is insufficient evidence, even when its exit code is zero.
 * @param {string} raw @returns {Count} */
export function countUnittest(raw) {
  const text = stripAnsi(raw), summaries = [...text.matchAll(/^Ran (\d+) tests? in [^\r\n]+$/gm)];
  const baseline = summaries.length === 1 ? Number(summaries[0]?.[1]) : null;
  const boundary = text.search(/^(?:={5,}|-{5,})/m);
  const progress = boundary < 0 ? "" : text.slice(0, boundary);
  const records = [...progress.matchAll(/^\S[^\r\n]*\([^\r\n]+\)(?:[ \t]+\.\.\.[^\r\n]*|[ \t]*)$/gm)];
  let skipped = 0;
  for (let at = 0; at < records.length; at++) {
    const from = records[at]?.index ?? 0, to = records[at + 1]?.index ?? progress.length;
    if (/\.\.\. skipped(?:\s|$)/.test(progress.slice(from, to))) skipped++;
  }
  const tail = summaries.length === 1 ? text.slice((summaries[0]?.index ?? 0) + (summaries[0]?.[0].length ?? 0)) : "";
  const terminals = [...tail.matchAll(/^[ \t]*(OK(?:[ \t]*\([^\r\n]*\))?|FAILED(?:[ \t]*\([^\r\n]*\))?)[ \t]*$/gm)];
  const terminal = terminals.length === 1 ? terminals[0] : undefined;
  return { bodies: records.length - skipped, targets: terminal ? 1 : 0, baseline,
    sums: baseline !== null && Number.isSafeInteger(baseline) && baseline >= 0 && records.length === baseline && terminal !== undefined,
    reportedFailure: terminal?.[1]?.startsWith("FAILED") ?? false,
    how: `${records.length} verbose method record(s), ${skipped} skipped, against ${baseline ?? "NO UNIQUE BASELINE"} from unittest's Ran N summary` };
}

/**
 * @param {"cargo"|"playwright"|"vitest"|"unittest"} family
 * @param {string} text
 * @returns {Count}
 */
export function countBodies(family, text) {
  if (family === "cargo") return countCargo(text);
  if (family === "playwright") return countPlaywright(text);
  if (family === "vitest") return countVitest(text);
  if (family === "unittest") return countUnittest(text);
  throw new Error(`unknown suite family ${JSON.stringify(family)}`);
}

// ── THE VERDICT LINE ─────────────────────────────────────────────────

/**
 * @typedef {object} Verdict
 * @property {string} suite
 * @property {number} exit     The GRADED COMMAND's status — as DATA.
 * @property {number} bodies
 * @property {number} targets
 * @property {string} ref
 * @property {"GREEN"|"RED"|"REFUSED"|"SCOPED-GREEN"|"SCOPED-RED"} verdict
 * @property {string} reason
 * @property {string | undefined} [scope]  The SUBSET this verdict graded,
 *   as the spec files themselves, comma-joined (T-271). Absent on a whole
 *   leg; present means the verdict describes part of one, and the word in
 *   `verdict` says so too so that a reader who has only the word is not
 *   misled.
 * @property {string | undefined} [tree]   HEAD's tree, read BESIDE the ref
 *   and BEFORE the spawn (T-203-s1). `""` means git would not say; absent
 *   means this verdict was built by something that does not read trees,
 *   and the token writer falls back to its own reading for it.
 * @property {boolean | undefined} [dirty] Were tracked files modified when
 *   the run STARTED? OR-ed with the writer's own late reading.
 */

/**
 * Render the one machine-parseable line. It is printed LAST and it
 * carries the graded command's exit code as a FIELD — so a reader never
 * has to infer it from this process's own status, and a wrapper that
 * summarises this process cannot contradict it.
 *
 * `scope=` IS EMITTED BEFORE `reason=` AND ONLY WHEN THERE IS ONE
 * (T-271). Before, because `reason` is the one field whose value may hold
 * spaces and `parseVerdict` splits on whitespace, so anything after it is
 * unreadable to the parser; only when there is one, because a whole-leg
 * verdict that carried an empty `scope=` would make "this graded part of
 * a leg" and "this graded a leg" the same line with a different blank.
 * @param {Verdict} v
 * @returns {string}
 */
export function formatVerdict(v) {
  return (
    `${VERDICT_TOKEN} suite=${v.suite} exit=${v.exit} bodies=${v.bodies} ` +
    `targets=${v.targets} ref=${v.ref} verdict=${v.verdict} ` +
    `${v.scope === undefined || v.scope === "" ? "" : `scope=${v.scope} `}` +
    `reason=${v.reason}`
  );
}

/**
 * Parse a verdict line, REFUSING one that is missing a required field.
 * The refusal is the point: T-203 gates a push on this token, and a
 * token that may silently omit its body count is the card's own subject
 * one layer downstream.
 * @param {string} line
 * @returns {{ ok: true, value: Record<string,string> } | { ok: false, missing: string[], reason: string }}
 */
export function parseVerdict(line) {
  const text = String(line ?? "").trim();
  if (!text.startsWith(`${VERDICT_TOKEN} `)) {
    return {
      ok: false,
      missing: [...REQUIRED_VERDICT_FIELDS],
      reason: `not a verdict line — it does not open with ${VERDICT_TOKEN}`,
    };
  }
  /** @type {Record<string,string>} */
  const fields = {};
  for (const tok of text.slice(VERDICT_TOKEN.length + 1).split(/\s+/)) {
    const eq = tok.indexOf("=");
    if (eq > 0) fields[tok.slice(0, eq)] = tok.slice(eq + 1);
  }
  const missing = REQUIRED_VERDICT_FIELDS.filter(
    (f) => fields[f] === undefined || fields[f] === "",
  );
  if (missing.length > 0) {
    return {
      ok: false,
      missing,
      reason: `verdict line is missing required field(s): ${missing.join(", ")}`,
    };
  }
  return { ok: true, value: fields };
}

/**
 * The judgement, separated from the running so a body can drive it with
 * no suite at all. THIS IS THE FUNCTION THE CARD IS ABOUT.
 *
 * `tree` and `dirty` are OPTIONAL and travel through untouched: nothing
 * here judges them, and a caller with no reading of its own must not have
 * one invented for it (T-203-s1). They are on the verdict so the token
 * writer receives the moment the RUNNER read, not the moment IT runs.
 *
 * @param {{ status: number, count: Count, ref: string, suite: string, tree?: string | undefined, dirty?: boolean | undefined }} r
 * @returns {Verdict}
 */
export function judge({ status, count, ref, suite, tree, dirty }) {
  const base = {
    suite,
    exit: status,
    bodies: count.bodies,
    targets: count.targets,
    ref,
    tree,
    dirty,
  };
  // ZERO BODIES IS NEVER SUCCESS — and it is checked BEFORE the status,
  // deliberately, because instance 2 exited 1 and instance 5 exited 0
  // and the defect is identical in both. Reading the status first would
  // sort them into different bins and hide the shared cause.
  if (count.bodies === 0) {
    return { ...base, verdict: "REFUSED", reason: "zero-bodies" };
  }
  if (!count.sums) {
    return { ...base, verdict: "REFUSED", reason: "parts-do-not-sum-to-baseline" };
  }
  if (status === 0 && count.reportedFailure === true) return { ...base, verdict: "REFUSED", reason: "summary-contradicts-exit" };
  return {
    ...base,
    verdict: status === 0 ? "GREEN" : "RED",
    reason: status === 0 ? "ok" : "suite-reported-failure",
  };
}

// ── THE SOLO LOCK ────────────────────────────────────────────────────

/**
 * The advisory lock path, keyed to the repo root so two checkouts do
 * not block each other.
 *
 * ── THE KEY IS A DIGEST OF THE WHOLE PATH, NEVER A SUFFIX OF IT ──────
 * (T-202-s1.) It used to be `Buffer.from(root).toString("hex")` cut to
 * its last sixteen hex characters — the last EIGHT BYTES of the path —
 * and a suffix cannot tell apart two paths that agree on it. Every card
 * id this method issues is exactly eight characters, so a lane
 * `…/supertaskr-T-223-s3` and its verifier bench `…/supertaskr-V-T-223-s3` end
 * in the same eight bytes and produced the identical key
 * (`542d3232332d7333`). The two seats the method deliberately runs side
 * by side were therefore serialised on every eight-character card, each
 * reading the refusal as another checkout's lock — which the sentence
 * above says cannot happen. Three seats reported it in one day.
 * A digest reads EVERY byte of the path, so no two distinct checkouts
 * share a key, and it is a pure function of the path alone: one
 * checkout's two runs still meet at one file however they were started,
 * which is what makes the guard below a guard at all.
 *
 * A DIGEST AND NOT THE PATH'S OWN FULL HEX, AND THE WIDTH IS THE
 * REASON. Both read every byte, but the hex of the path is 2 bytes wide
 * per byte of root, making this basename `21 + 2 * root.length`. Against
 * NAME_MAX — 255 here, `getconf NAME_MAX /` — that throws ENAMETOOLONG
 * out of `acquireSolo`'s own `writeFileSync` at a root of 118 bytes:
 * `ceil((255 - 21) / 2) + 1`, derived rather than guessed. The longest
 * root that reaches this function in the suite today is 72 bytes (a
 * `mkdtempSync` root under a 48-byte `tmpdir()`, 165 bytes of basename),
 * so the hex form would not have failed HERE — and 118 bytes of
 * checkout path is an ordinary home directory two projects deep, which
 * is a failure waiting for the machine rather than a safe margin. A
 * sha256 is FIXED at 64 hex characters whatever the root, so the
 * basename is 85 bytes for every checkout on every machine — 170 bytes
 * of headroom, and no root length can move it.
 *
 * THE FILE ITSELF DOES NOT MOVE, DELIBERATELY. Its directory
 * (`tmpdir()`), its `supertaskr-gate-run-<key>.lock` name shape, its JSON
 * payload and its lifetime — written at acquire, removed by the holding
 * pid at release, reclaimed when the holder is gone — are unchanged,
 * because two readers depend on them: `acquireSolo` below, and
 * tools/e2e/tests/gate-run.spec.ts's stale-reclaim body, which plants a
 * lock at this path by hand and reads the pid back out of it.
 */
export function lockPath(root = repoRoot) {
  const key = createHash("sha256").update(root, "utf8").digest("hex");
  return path.join(tmpdir(), `supertaskr-gate-run-${key}.lock`);
}

/** Is a pid alive? `kill -0` semantics; EPERM means alive-but-not-ours.
 *  @param {number} pid @returns {boolean} */
function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return Boolean(e) && /** @type {NodeJS.ErrnoException} */ (e).code === "EPERM";
  }
}

/**
 * Take the solo lock, or refuse. Never waits — see THE SOLO GUARD above.
 * @param {string} suiteId
 * @param {string} [root]
 * @returns {{ ok: true, release: () => void } | { ok: false, reason: string }}
 */
export function acquireSolo(suiteId, root = repoRoot) {
  const lp = lockPath(root);
  if (existsSync(lp)) {
    let held = null;
    try {
      held = JSON.parse(readFileSync(lp, "utf8"));
    } catch {
      held = null;
    }
    if (held && Number.isInteger(held.pid) && held.pid !== process.pid && pidAlive(held.pid)) {
      return {
        ok: false,
        reason:
          `the solo lock is held by pid ${held.pid} running suite ` +
          `${held.suite} since ${held.at} — REFUSING rather than waiting, ` +
          "because a reading taken after a wait is a reading of the wait " +
          `(T-088-s4). Re-run ${suiteId} when that run has finished.`,
      };
    }
    // Stale: the holder is gone. A crashed run must not wedge the gate.
  }
  writeFileSync(lp, JSON.stringify({ pid: process.pid, suite: suiteId, at: new Date().toISOString() }));
  return {
    ok: true,
    release: () => {
      try {
        const held = JSON.parse(readFileSync(lp, "utf8"));
        if (held.pid === process.pid) rmSync(lp, { force: true });
      } catch {
        /* someone else's or already gone */
      }
    },
  };
}

// ── RUNNING ──────────────────────────────────────────────────────────

/** The ref the run happened at. A count without one is not a figure. */
export function currentRef(root = repoRoot) {
  const r = spawnSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" });
  return r.status === 0 ? (r.stdout ?? "").trim() : "UNKNOWN-REF";
}

/**
 * The TREE the run happened at, read BESIDE the ref (T-203-s1).
 *
 * IT IS DELIBERATELY THE HOOK'S OWN READER RATHER THAN A SECOND SPELLING
 * of `git rev-parse HEAD^{tree}`. The token is compared against
 * `headTree`'s answer by `push-guard.mjs`, so a competing implementation
 * here could disagree with the guard about what HEAD's tree is — two
 * readers of one fact is the shape this repository keeps paying for.
 *
 * `""` AND NEVER A FABRICATION when git will not say, matching the empty
 * string the writer already stores: a key nobody could read is refused
 * downstream, which is the honest end of "I could not tell".
 */
export function currentTree(root = repoRoot) {
  return headTree(root) ?? "";
}

/**
 * Run one graded suite and return its verdict.
 *
 * THE CD GUARD, THE REDIRECT AND THE CAPTURE ARE THE THREE THINGS THIS
 * FUNCTION IS FOR. It does not pipe; it redirects to a file, captures
 * `status`, and reads the file afterwards.
 *
 * @param {Suite} suite
 * @param {{ root?: string, env?: Record<string,string>, solo?: boolean }} [opts]
 * @returns {{ verdict: Verdict, output: string, outputPath: string }}
 */
export function runSuite(suite, opts = {}) {
  const root = opts.root ?? repoRoot;
  // THE THREE READINGS THAT MUST SHARE ONE MOMENT, AND THE MOMENT IS
  // BEFORE THE SPAWN (T-203-s1). The ref was always read here; the tree
  // and the dirt used to be read by the token writer, after the suite had
  // finished, so a commit landing during a long leg gave one entry two
  // identifiers from two different trees.
  const ref = currentRef(root);
  const tree = currentTree(root);
  const dirty = trackedDirt(root);
  /** @param {string} reason @returns {{ verdict: Verdict, output: string, outputPath: string }} */
  const refuse = (reason) => ({
    verdict: {
      suite: suite.id, exit: -1, bodies: 0, targets: 0, ref, tree, dirty,
      verdict: /** @type {const} */ ("REFUSED"), reason,
    },
    output: "",
    outputPath: "",
  });

  const bad = validateSuite(suite);
  if (bad.length > 0) return refuse(`invalid-registry-entry: ${bad.join("; ")}`);

  // THE CD GUARD. `cd <abs> || exit N` in a script file; here, the same
  // proposition as a refusal — and stronger, because the sentinel proves
  // it is the RIGHT directory rather than merely an existing one.
  const cwd = path.resolve(root, suite.cwd);
  if (!existsSync(cwd)) return refuse(`cd-guard: ${cwd} does not exist`);
  if (!existsSync(path.join(cwd, suite.sentinel))) {
    return refuse(
      `cd-guard: ${cwd} has no ${suite.sentinel} — this is not the ` +
        `${suite.id} suite's directory, and running here would answer a ` +
        "different question (instance 1)",
    );
  }

  let release = () => {};
  if (suite.solo && opts.solo !== false) {
    const lock = acquireSolo(suite.id, root);
    if (!lock.ok) return refuse(`solo-lock: ${lock.reason}`);
    release = lock.release;
  }

  // `validateSuite` already refused an empty argv, but the checker cannot
  // see that and a silent `undefined` command is exactly the class this
  // file exists for — so the impossible case is a refusal, not a cast.
  const command = suite.argv[0];
  if (command === undefined) return refuse("invalid-registry-entry: argv is empty");

  const dir = mkdtempSync(path.join(tmpdir(), `gate-run-${suite.id}-`));
  const outputPath = path.join(dir, "output.txt");
  const fd = openSync(outputPath, "w");
  try {
    // A TRUE REDIRECT — `> file 2>&1`, expressed as ONE file descriptor
    // handed to the child for BOTH streams. No shell, so no pipeline; and
    // no buffering through this process either.
    //
    // THE SINGLE FD IS NOT A DETAIL, AND THIS RUNNER GOT IT WRONG FIRST.
    // Buffering the two streams separately and concatenating them
    // (`stdout + stderr`) LOSES THE INTERLEAVING, and cargo splits one
    // record across both: `Running unittests src/lib.rs` is cargo's own
    // progress on stderr, its `finished in Xs` is the harness on stdout.
    // Concatenated, the marker and its number land in different halves of
    // the file, and `health-bands.mjs` reported `suite/lib-seconds` as
    // UNREAD — a band losing its authority because of how a runner
    // captured, not because of anything in the tree. Measured at 4531223;
    // after the fix the same run reads 0 unread bands where it read 1.
    const r = spawnSync(command, suite.argv.slice(1), {
      cwd,
      env: { ...process.env, ...(opts.env ?? {}) },
      stdio: ["ignore", fd, fd],
    });
    closeSync(fd);
    if (r.error) {
      return { ...refuse(`could-not-run: ${r.error.message}`), outputPath };
    }
    // CAPTURE FIRST, READ AFTERWARDS — in that order, always.
    const status = r.status ?? -1;
    const readBack = readFileSync(outputPath, "utf8");
    const count = countBodies(suite.family, readBack);
    return {
      verdict: judge({ status, count, ref, tree, dirty, suite: suite.id }),
      output: readBack,
      outputPath,
    };
  } finally {
    try {
      closeSync(fd);
    } catch {
      /* already closed on the success path */
    }
    release();
  }
}

import {
  OWNING_FLAG, RANGE_FLAG, OWED_SET_FLAG, TREE_FLAG, scopedSuite, SCOPED_SUITE, SPEC_DIR, SPEC_SUFFIX, importSpecifiers, resolveImport, specFiles, specReach, normaliseChanged, owningSpecs, deriveOwning, SETTINGS_DIR, underSettings, settingsSiteRe, settingsReadersIn, settingsReaders, PACKAGE_ROOTS, ALL_SUITES, suiteOfPath, packageDependents, BUILD_SCRIPT, buildConfigsIn, resolveTsconfig, soleIncludeDir, packageBuilds, generatedEntries, generatedSources, deriveOwed, RANGE_RE, rangeChanged, owedForRange
} from "./source-suite-derivation.mjs";
export {
  OWNING_FLAG, RANGE_FLAG, OWED_SET_FLAG, TREE_FLAG, scopedSuite, SCOPED_SUITE, SPEC_DIR, SPEC_SUFFIX, importSpecifiers, resolveImport, specFiles, specReach, normaliseChanged, owningSpecs, deriveOwning, SETTINGS_DIR, underSettings, settingsSiteRe, settingsReadersIn, settingsReaders, PACKAGE_ROOTS, ALL_SUITES, suiteOfPath, packageDependents, BUILD_SCRIPT, buildConfigsIn, resolveTsconfig, soleIncludeDir, packageBuilds, generatedEntries, generatedSources, deriveOwed, RANGE_RE, rangeChanged, owedForRange
} from "./source-suite-derivation.mjs";
/** @typedef {import("./source-suite-derivation.mjs").OwningDerivation} OwningDerivation */
/** @typedef {import("./source-suite-derivation.mjs").OwedDerivation} OwedDerivation */

/** The word a scoped verdict wears, so no reader has only the leg's name.
 *  It is deliberately NOT `GREEN`: `judgeToken` accepts exactly that one
 *  string, so this prefix is what makes a subset unable to mint a token. */
export const SCOPED_PREFIX = "SCOPED-";

/**
 * Re-word a whole-leg verdict as the subset reading it actually is.
 *
 * A REFUSAL STAYS A REFUSAL. `REFUSED` already means "no verdict this
 * runner would stand behind", and prefixing it would invent a fifth word
 * for a thing that is not a grade at all.
 *
 * @param {Verdict} v
 * @param {{ specs: string[], changed: string[] }} scope
 * @returns {Verdict}
 */
export function scopeVerdict(v, scope) {
  const word =
    v.verdict === "GREEN" || v.verdict === "RED"
      ? /** @type {"SCOPED-GREEN"|"SCOPED-RED"} */ (`${SCOPED_PREFIX}${v.verdict}`)
      : v.verdict;
  return {
    ...v,
    verdict: word,
    scope: scope.specs.join(","),
    reason:
      v.verdict === "GREEN" || v.verdict === "RED"
        ? `${v.reason} over ${scope.specs.length} owning spec(s) for ` +
          `${scope.changed.length} changed path(s) — NOT the leg, and not a token`
        : v.reason,
  };
}

/**
 * The owed set as runnable suites, in the registry's own order.
 *
 * The end-to-end leg arrives SCOPED to its owed spec files unless the
 * derivation owes it whole. It is NOT re-worded by `scopeVerdict`: that
 * word exists to make a HAND-TYPED subset unmintable, and this subset is
 * derived from a range the guard re-derives for itself.
 *
 * @param {OwedDerivation} owed
 * @returns {Suite[]}
 */
export function owedSuites(owed, registry = /** @type {Readonly<Record<string,Suite>>} */ (GRADED_SUITES)) {
  /** @type {Suite[]} */
  const out = [];
  for (const id of Object.keys(registry)) {
    if (!owed.suites.includes(id)) continue;
    const entry = registry[id];
    if (entry === undefined) continue;
    if (id === SCOPED_SUITE && !owed.e2e.whole && owed.e2e.specs.length > 0) {
      out.push(scopedSuite(owed.e2e.specs, entry));
    } else {
      out.push(entry);
    }
  }
  return out;
}

// ── THE TOKEN ────────────────────────────────────────────────────────

/**
 * Leave these verdicts where a later, unrelated process can ask (T-203).
 *
 * EVERY VERDICT IS RECORDED, INCLUDING THE BAD ONES. A writer that saved
 * only GREEN runs would make a red run indistinguishable from a run
 * nobody made, which is this file's own charter one layer downstream —
 * and the push guard can only say WHICH of those two it is refusing if
 * the red is on the record.
 *
 * A TOKEN THAT CANNOT BE WRITTEN NEVER CHANGES A VERDICT. The suites'
 * answer is the suites', and nothing about a file may move it; the
 * failure is said out loud instead, because the guard downstream will
 * then refuse for want of a token and the seat should meet the reason
 * here rather than there.
 *
 * EACH VERDICT CARRIES ITS OWN TREE AND THE WRITER USES IT (T-203-s1).
 * This function passes no `opts.tree`, on purpose: the verdicts in one
 * batch were graded at whatever HEAD held when EACH suite started, and
 * `--all` spans tens of minutes, so one tree for the batch would be the
 * same mistake as one tree for the write.
 *
 * AND THE OWED SET IS RECORDED BESIDE THEM WHEN THERE IS ONE (T-280).
 * It is evidence rather than a requirement — the guard derives its own
 * from the range it is judging — but a token that said which suites ran
 * without saying which were OWED would leave a reader unable to tell a
 * complete narrow run from an abandoned wide one.
 *
 * @param {Verdict[]} verdicts
 * @param {string} [root]
 * @param {import("../../../cli/gate-token.mjs").OwedRecord} [owed]
 * @param {import("../../../cli/gate-token.mjs").GateContext} [context]
 * @returns {{ written: boolean, message: string }}
 */
export function recordVerdicts(verdicts, root = repoRoot, owed = undefined, context = undefined) {
  try {
    const { path: tokenFile } = writeToken(root, verdicts, { ...(owed === undefined ? {} : { owed }), ...(context === undefined ? {} : { context }) });
    const message = `gate-run: verdict token written to ${tokenFile}\n`;
    process.stderr.write(message);
    return { written: true, message };
  } catch (err) {
    const message =
      `gate-run: THE VERDICT TOKEN COULD NOT BE WRITTEN to ${TOKEN_REL_PATH} ` +
      `(${err instanceof Error ? err.message : String(err)}). The verdicts still stand — this is ` +
      "a claim about the file, not about the suites — but nothing downstream can read them, so a " +
      "push will be refused for want of a token.\n";
    process.stderr.write(message);
    return { written: false, message };
  }
}

/** @typedef {{root:string,productRevision:string,policyRevision:string,registry:Readonly<Record<string,Suite>>,context:import("../../../cli/gate-token.mjs").GateContext,settings:any}} GateConfiguration */
/** Original repository facts are private constructor state, never a mutable
 * property a caller can replace on the public configuration datum.
 * @type {WeakMap<GateConfiguration,string>} */
const gateOrigins = new WeakMap();
/** @type {WeakMap<GateConfiguration,any>} */
const gateTools = new WeakMap();
/** @type {WeakMap<GateConfiguration,GateConfiguration>} */
const gateParents = new WeakMap();
/** @typedef {{version:1,productRoot:string,policyRevision:string,configurationDigest:string,toolManifestDigest:string,required:readonly string[],registryDigest:string,suites:readonly Suite[],digest:string}} ConfiguredGatePolicy */
/** The public metadata cannot be passed back as an authentic policy handle.
 * @type {WeakMap<ConfiguredGatePolicy,GateConfiguration>} */
const gatePolicies = new WeakMap();
/** @param {any} value @returns {string} */
function gateDigest(value) { return `sha256:${createHash("sha256").update(operationContent(value)).digest("hex")}`; }
/** @param {string} value */
function gateOutputDigest(value) { return createHash("sha256").update(value, "utf8").digest("hex"); }
/** @template T @param {T} value @returns {T} */
function frozenGateData(value) {
  const copy = structuredClone(value);
  /** @param {any} item */
  function freeze(item) { if (item && typeof item === "object") { Object.values(item).forEach(freeze); Object.freeze(item); } }
  freeze(copy); return copy;
}
/** @param {string} code @param {string} detail @returns {never} */
function configuredFinding(code, detail) { throw Object.assign(new Error(detail), { code }); }
/** @param {GateConfiguration} configuration */
function assertConfiguredGateOrigin(configuration) {
  const original = gateOrigins.get(configuration);
  try {
    if (original === undefined || operationContent(captureOperationRepository(configuration.root, configuration.productRevision, { forEffect: false })) !== original) throw new Error("original PRODUCT root/Git directory/common directory/object store identity differs");
  } catch (error) {
    configuredFinding("gate-product-origin-changed", `The original PRODUCT repository is unavailable or replaced: ${error instanceof Error ? error.message : String(error)}`);
  }
  requireInstalledRuntimeAssets(gateTools.get(configuration), ["tools/e2e/scripts/gate-run.mjs", "cli/gate-token.mjs"]);
  const parent = gateParents.get(configuration);
  if (parent) assertConfiguredGateOrigin(parent);
}
/** Read-only canonical selection; historical pushed revisions need not be HEAD.
 * @param {{productRoot:string,productRevision:string,tool?:any}} options @returns {GateConfiguration} */
export function loadConfiguredGateConfiguration(options) {
  if (!options || Object.keys(options).some((key) => !["productRoot", "productRevision", "tool"].includes(key))) configuredFinding("gate-configuration-request", "Only PRODUCT root/revision and constructor TOOL context are accepted");
  const tool = options.tool ?? loadInstalledRecordTool();
  requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/gate-run.mjs", "tools/e2e/scripts/configured-dispatch-grade.mjs", "tools/e2e/scripts/source-suite-derivation.mjs", "tools/e2e/scripts/gate-policy.mjs", "tools/e2e/scripts/source-ci-contract.mjs", "tools/e2e/scripts/durable-operation.mjs", "cli/gate-token.mjs", "cli/is-main.mjs"]);
  const original = captureOperationRepository(options.productRoot, options.productRevision, { forEffect: false });
  const loaded = loadProjectSettings({ productRoot: options.productRoot, productRevision: options.productRevision, tool });
  if (loaded.status !== "ready") configuredFinding(loaded.code, loaded.diagnostics.join("; "));
  const required = requireProjectSection(loaded, "suites");
  if (required.status !== "configured") configuredFinding("gate-suites-unconfigured", required.diagnostics.join("; "));
  const registry = /** @type {Readonly<Record<string,Suite>>} */ (Object.fromEntries(loaded.settings.suites.map((suite) => [suite.id, suite])));
  const problems = validateRegistry(registry);
  if (problems.length) configuredFinding("gate-suite-unsupported", problems.join("; "));
  const configuration = Object.freeze({ root: loaded.provenance.productRoot, productRevision: options.productRevision, policyRevision: options.productRevision, settings: loaded.settings,
    registry: Object.freeze(registry), context: Object.freeze({ configurationDigest: loaded.provenance.configDigest,
      toolManifestDigest: tool.manifestDigest, required: Object.freeze(Object.keys(registry).sort()) }) });
  gateOrigins.set(configuration, operationContent(original));
  gateTools.set(configuration, tool);
  assertConfiguredGateOrigin(configuration);
  return configuration;
}
/** Detached metadata is correspondence, not proof of machine execution.
 * @param {GateConfiguration} configuration @returns {ConfiguredGatePolicy} */
function configuredGatePolicyMetadata(configuration) {
  const suites = configuration.context.required.map(id => /** @type {Suite} */ (configuration.registry[id]));
  const data = { version: /** @type {const} */ (1), productRoot: configuration.root, policyRevision: configuration.policyRevision,
    configurationDigest: configuration.context.configurationDigest, toolManifestDigest: configuration.context.toolManifestDigest,
    required: configuration.context.required, registryDigest: gateDigest(suites), suites };
  return frozenGateData({ ...data, digest: gateDigest(data) });
}
/** Backend-only original policy capture. No wire or per-run policy override.
 * Coordinator HEAD may advance: only this exact committed policy is retained.
 * @param {{productRoot:string,productRevision:string,tool?:any}} options */
export function captureConfiguredGatePolicy(options) {
  const configuration = loadConfiguredGateConfiguration(options), policy = configuredGatePolicyMetadata(configuration);
  gatePolicies.set(policy, configuration); return policy;
}
/** @param {{productRoot:string,productRevision:string,tool?:any,policy?:ConfiguredGatePolicy}} options */
function configuredCandidate(options) {
  if (options?.policy === undefined) return loadConfiguredGateConfiguration(options);
  if (Object.keys(options).some(key => !["productRoot", "productRevision", "policy"].includes(key))) configuredFinding("gate-policy-request", "Original policy already binds TOOL; only the candidate root/revision are request data");
  const parent = gatePolicies.get(options.policy);
  if (!parent) configuredFinding("gate-policy-unrecognized", "Original policy must be captured by the installed backend constructor");
  assertConfiguredGateOrigin(parent);
  const original = captureOperationRepository(options.productRoot, options.productRevision, { forEffect: false });
  const ancestor = spawnSync("git", ["--no-replace-objects", "-C", original.root, "merge-base", "--is-ancestor", parent.productRevision, options.productRevision], { stdio: ["ignore", "pipe", "pipe"] });
  if (ancestor.status !== 0 || ancestor.error) configuredFinding("gate-policy-ancestry", "Candidate must descend from the original committed PRODUCT policy");
  const configuration = Object.freeze({ root: original.root, productRevision: options.productRevision, policyRevision: parent.productRevision,
    registry: parent.registry, settings: parent.settings, context: Object.freeze({ ...parent.context, policyRevision: parent.productRevision, policyDigest: options.policy.digest }) });
  gateOrigins.set(configuration, operationContent(original)); gateTools.set(configuration, gateTools.get(parent)); gateParents.set(configuration, parent);
  assertConfiguredGateOrigin(configuration); return configuration;
}
/** Physical containment is checked before a command or sentinel is used.
 * @param {string} root @param {Suite} suite */
function configuredSuitePath(root, suite) {
  const cwd = realpathSync(path.resolve(root, suite.cwd)), relative = path.relative(root, cwd);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative) || !lstatSync(cwd).isDirectory()) configuredFinding("gate-cwd-escape", `${suite.id}: cwd is outside the selected PRODUCT`);
  const file = path.join(cwd, suite.sentinel), state = lstatSync(file);
  if (!state.isFile() || state.isSymbolicLink() || realpathSync(file) !== file) configuredFinding("gate-sentinel-kind", `${suite.id}: sentinel is not one plain PRODUCT file`);
}
/** Same derivation, explicit configured membership. Unsupported discovery and
 * ambiguous ownership conservatively require the entire configured battery.
 * @param {GateConfiguration} configuration @param {string} range */
export function configuredOwedForRange(configuration, range) {
  assertConfiguredGateOrigin(configuration);
  const raw = rangeChanged(range, configuration.root);
  if ("problem" in raw) return raw;
  const resolved = spawnSync("git", ["-C", configuration.root, "rev-parse", "--verify", "--end-of-options", `${raw.tip}^{commit}`], { encoding: "utf8" });
  if (resolved.status !== 0 || resolved.stdout.trim() !== configuration.productRevision) return { problem: "the range tip differs from the exact PRODUCT configuration revision" };
  assertConfiguredGateOrigin(configuration);
  if (raw.paths.some((file) => file.trim() !== file || /[\r\n]/.test(file))) {
    return { range, changed: raw.paths, suites: [...configuration.context.required], e2e: { whole: true, specs: [] },
      byPath: [], unplaceable: [], generatedUnplaceable: [], failClosed: "this path spelling has no qualified narrow discovery adapter",
      inputs: { base: raw.base, tip: raw.tip, root: configuration.root, completeConfiguredRegistry: [...configuration.context.required] } };
  }
  const derived = owedForRange(range, configuration.root, configuration.registry);
  if ("problem" in derived) return derived;
  const roots = Object.values(configuration.registry).map((suite) => suite.cwd);
  const unsupportedScope = Object.values(configuration.registry).some((suite) =>
    suite.family === "playwright" && (suite.id !== SCOPED_SUITE || suite.cwd !== "tools/e2e") ||
    suite.id === SCOPED_SUITE && suite.family !== "playwright");
  const why = derived.changed.includes(PROJECT_SETTINGS) ? "project settings changed; every configured suite is owed" :
    roots.some((cwd, at) => roots.indexOf(cwd) !== at) ? "several suites share a cwd; their ownership cannot safely be narrowed" :
    unsupportedScope ? "this Playwright layout has no qualified scoped discovery adapter" :
    derived.suites.some((id) => configuration.registry[id] === undefined) ? "a discovery adapter named a suite outside the configured registry" :
    derived.changed.some((file) => file.trim() !== file || /[\r\n]/.test(file)) ? "this path spelling has no qualified narrow discovery adapter" : undefined;
  assertConfiguredGateOrigin(configuration);
  return why === undefined ? derived : { ...derived, suites: [...configuration.context.required], e2e: { whole: true, specs: [] }, failClosed: why };
}
/** Constructor-bound effect API. Requests cannot replace commands, roots,
 * membership, policy or TOOL metadata. The optional second argument is an
 * opaque retained-source authority, redeemed only by its fixed backend.
 * @param {{productRoot:string,productRevision:string,tool?:any,policy?:ConfiguredGatePolicy}} options
 * @param {object|undefined} [executionAuthority] */
export function createConfiguredGateRunner(options, executionAuthority) {
  const configuration = configuredCandidate(options);
  const { root, productRevision, registry, context } = configuration;
  const policy = gateParents.get(configuration), metadata = configuredGatePolicyMetadata(policy ?? configuration);
  const treeRead = spawnSync("git", ["--no-replace-objects", "-C", root, "rev-parse", "--verify", `${productRevision}^{tree}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const candidateTree = treeRead.status === 0 ? treeRead.stdout.replace(/\n$/, "") : "";
  // Untracked nonignored source/test inputs can affect an actual suite too.
  // Legacy runs retain trackedDirt semantics; this is the original-policy route.
  function candidateHasChanges() {
    const status = spawnSync("git", ["--no-replace-objects", "-C", root, "status", "--porcelain=v1", "-z", "--untracked-files=all"], { stdio: ["ignore", "pipe", "pipe"] });
    if (status.status !== 0 || status.error) configuredFinding("gate-candidate-status-unavailable", "The candidate's full nonignored Git status is unavailable");
    return status.stdout.length > 0;
  }
  function assertCandidate() {
    if (/** @type {any} */ (executionAuthority)?.kind === "planned-integration-grade") assertQualifiedIntegrationGradeAuthority(/** @type {object} */ (executionAuthority), {productRoot:root,commit:productRevision,tree:candidateTree,policy:metadata});
    else if (executionAuthority !== undefined) assertConfiguredDispatchGradeAuthority(executionAuthority, {productRoot:root,commit:productRevision,tree:candidateTree,policy:metadata});
    assertConfiguredGateOrigin(configuration);
    if (currentRef(root) !== productRevision || currentTree(root) !== candidateTree || !candidateTree) configuredFinding("gate-product-context-changed", "The selected candidate HEAD/tree is unavailable or changed before grading");
    if (policy && candidateHasChanges()) configuredFinding("gate-candidate-dirty", "Original-policy grading requires the exact clean candidate before and after each suite");
  }
  function assertAfterSuite() { if (policy) assertCandidate(); else assertConfiguredGateOrigin(configuration); }
  /** @param {Suite} definition @param {{verdict:Verdict,output:string}} result */
  function capture(definition, result) {
    const output = result.output, transcript = `${output}${output.endsWith("\n") || !output ? "" : "\n"}${formatVerdict(result.verdict)}\n`;
    return { definition, definitionDigest: gateDigest(definition), verdict: result.verdict, output, outputDigest: gateOutputDigest(output), transcript, transcriptDigest: gateOutputDigest(transcript) };
  }
  /** @param {ReturnType<typeof capture>[]} captures @param {readonly string[]} selected @param {boolean} whole */
  function evidence(captures, selected, whole) {
    return frozenGateData({ version: 1, policy: metadata, context, candidate: { productRoot: root, commit: productRevision, tree: candidateTree },
      required: context.required, selected, whole, suites: captures,
      complete: whole && selected.length === context.required.length && context.required.every(id => selected.includes(id)) &&
        captures.length === selected.length && captures.every(row => row.verdict.verdict === "GREEN" && row.verdict.ref === productRevision && row.verdict.tree === candidateTree && row.verdict.dirty === false) &&
        currentRef(root) === productRevision && currentTree(root) === candidateTree && !(policy ? candidateHasChanges() : trackedDirt(root)) });
  }
  /** @param {readonly string[]} names @param {ReturnType<typeof configuredOwedForRange>} [owed] */
  function run(names, owed) {
    if (!names.length || new Set(names).size !== names.length || names.some((id) => registry[id] === undefined)) configuredFinding("gate-suite-selection", `unknown suite(s), duplicate or empty selection in the committed registry: ${names.join(", ")}`);
    if (owed !== undefined && "problem" in owed) configuredFinding("gate-range-unavailable", owed.problem);
    /** @type {Verdict[]} */ const verdicts = [];
    /** @type {ReturnType<typeof capture>[]} */ const captures = [];
    for (const name of names) {
      assertCandidate();
      const suite = /** @type {Suite} */ (registry[name]);
      try { configuredSuitePath(root, suite); }
      catch (error) {
        const verdict = /** @type {Verdict} */ ({ suite: name, exit: -1, bodies: 0, targets: 0, ref: currentRef(root), tree: currentTree(root), dirty: trackedDirt(root), verdict: "REFUSED", reason: `configured-path: ${error instanceof Error ? error.message : String(error)}` });
        verdicts.push(verdict); captures.push(capture(suite, { verdict, output: "" }));
        continue;
      }
      const selected = owed !== undefined && name === SCOPED_SUITE && !owed.e2e.whole && owed.e2e.specs.length ? scopedSuite(owed.e2e.specs, suite) : suite;
      const result = runSuite(selected, { root });
      assertAfterSuite();
      const verdict = owed !== undefined && name === SCOPED_SUITE && !owed.e2e.whole && owed.e2e.specs.length ? { ...result.verdict, scope: owed.e2e.specs.join(",") } : result.verdict;
      verdicts.push(verdict); captures.push(capture(selected, { ...result, verdict }));
      if (result.outputPath) process.stderr.write(`gate-run: ${name} output at ${result.outputPath}\n`);
    }
    assertAfterSuite();
    // Retained-source capture does not widen the worker's original ignored
    // output policy by writing a token. Its actual result leaves via stdout.
    const recorded = executionAuthority === undefined ? recordVerdicts(verdicts, root, owed === undefined ? undefined : { range: owed.range, suites: owed.suites, e2e: owed.e2e, inputs: owed.inputs, ...(owed.failClosed === undefined ? {} : { failClosed: owed.failClosed }) }, context) : {written:false};
    return { code: executionAuthority === undefined && !recorded.written || verdicts.some((v) => v.verdict === "REFUSED") ? EXIT.REFUSED : verdicts.some((v) => v.verdict === "RED") ? EXIT.RED : EXIT.GREEN,
      verdicts, configuration: context, tokenWritten: recorded.written,
      capture: evidence(captures, names, owed === undefined || owed.e2e.whole || !names.includes(SCOPED_SUITE)) };
  }
  /** The existing source-layout scoped adapter is retained explicitly. Other
   * layouts still run whole suites and cannot claim a narrower qualification.
   * @param {string} suiteId @param {string[]} changed */
  function owning(suiteId, changed) {
    if (executionAuthority !== undefined) configuredFinding("gate-retained-scope-unsupported", "Retained grading captures whole original suites only");
    assertConfiguredGateOrigin(configuration);
    const suite = registry[suiteId];
    if (!suite || suite.family !== "playwright") configuredFinding("gate-usage", `The scoped form needs its Playwright leg; THE FULL ${SCOPED_SUITE} LEG IS OWED`);
    if (suite.id !== SCOPED_SUITE || suite.cwd !== "tools/e2e") configuredFinding("gate-scoped-unadapted", "This configured suite has no qualified scoped discovery adapter; run the whole configured suite");
    if (!changed.length) configuredFinding("gate-usage", `no changed paths were named; THE FULL ${SCOPED_SUITE} LEG IS OWED`);
    if (changed.some((file) => file.trim() !== file)) configuredFinding("gate-usage", "Exact changed-path spellings are required");
    const roots = Object.fromEntries(Object.values(registry).map((entry) => [entry.id, entry.cwd]));
    const plan = deriveOwning(changed, root, roots);
    if (plan.generatedUnplaceable.length) configuredFinding("gate-usage", `The import graph reaches a GENERATED file this derivation cannot map back to the sources: ${plan.generatedUnplaceable.map((item) => item.path).join(", ")}; THE FULL ${SCOPED_SUITE} LEG IS OWED`);
    if (plan.unresolved.length || plan.unplaceable.length || !plan.specs.length) configuredFinding("gate-usage", `The scoped reader cannot place ${plan.unplaceable.map((item) => item.path).join(", ") || changed.join(", ")}; ${plan.unresolved.join(", ")}; THE FULL ${SCOPED_SUITE} LEG IS OWED`);
    assertCandidate();
    configuredSuitePath(root, suite);
    const selected = scopedSuite(plan.specs, suite), result = runSuite(selected, { root }), verdict = scopeVerdict(result.verdict, { specs: plan.specs, changed: plan.changed });
    assertAfterSuite();
    const recorded = recordVerdicts([verdict], root, undefined, context);
    return { code: !recorded.written || verdict.verdict === "REFUSED" ? EXIT.REFUSED : verdict.verdict === `${SCOPED_PREFIX}RED` ? EXIT.RED : EXIT.GREEN, verdicts: [verdict], configuration: context, tokenWritten: recorded.written,
      capture: evidence([capture(selected, { ...result, verdict })], [suiteId], false) };
  }
  /** Canonical correspondence aggregation only. The integration effect owner
   * must separately prove each row came from its actual owned launch/artifact.
   * No claim about process ancestry follows from accepting serialized rows.
   * @param {readonly any[]} parts */
  function aggregate(parts) {
    assertCandidate();
    if(!Array.isArray(parts)||!parts.length||parts.length>context.required.length) configuredFinding("gate-capture-set", "No finite original suite capture set supplied");
    /** @type {ReturnType<typeof capture>[]} */ const rows=[];
    /** @type {string[]} */ const names=[];
    for(const part of parts){
      if(!part||typeof part!=="object"||Object.keys(part).sort().join(",")!=="candidate,complete,context,policy,required,selected,suites,version,whole"||part.version!==1||operationContent(part.policy)!==operationContent(metadata)||operationContent(part.context)!==operationContent(context)||
        operationContent(part.candidate)!==operationContent({productRoot:root,commit:productRevision,tree:candidateTree})||
        operationContent(part.required)!==operationContent(context.required)||part.whole!==true||!Array.isArray(part.selected)||!Array.isArray(part.suites)||
        part.selected.length!==part.suites.length||!part.selected.length) configuredFinding("gate-capture-context", "Captured suite context differs from the original policy/candidate");
      for(const [at,row] of part.suites.entries()){
        const id=part.selected[at],definition=registry[id];
        if(typeof id!=="string"||!definition||names.includes(id)||!row||typeof row!=="object"||operationContent(row.definition)!==operationContent(definition)) configuredFinding("gate-capture-membership", "Missing, duplicate or changed original suite definition");
        if(typeof row.output!=="string"||Buffer.byteLength(row.output)>32*1024*1024) configuredFinding("gate-capture-output", "Captured output is unavailable or exceeds the supported bound");
        const actual=judge({suite:id,status:row.verdict?.exit,count:countBodies(definition.family,row.output),ref:productRevision,tree:candidateTree,dirty:false});
        if(operationContent(capture(definition,{verdict:actual,output:row.output}))!==operationContent(row)) configuredFinding("gate-capture-output", "Captured reporter output/verdict/digests disagree");
        rows.push(row);names.push(id);
      }
      const expected=part.selected.length===context.required.length&&new Set(part.selected).size===context.required.length&&
        context.required.every(id=>part.selected.includes(id))&&part.suites.every((/** @type {any} */ row)=>row.verdict.verdict==="GREEN");
      if(part.complete!==expected) configuredFinding("gate-capture-completeness", "A subset or failed capture was relabeled complete");
    }
    if(names.length!==context.required.length||!context.required.every(id=>names.includes(id))) configuredFinding("gate-capture-membership", "Every required original suite must occur once");
    const ordered=context.required.map(id=>/** @type {ReturnType<typeof capture>} */(rows.find(row=>row.definition.id===id)));
    assertAfterSuite();return evidence(ordered,context.required,true);
  }
  return Object.freeze({ configuration, run, owning, aggregate,
    /** @param {string} range */ owed: (range) => configuredOwedForRange(configuration, range) });
}

// ── CLI ──────────────────────────────────────────────────────────────

/** Configured project CLI; source CI calls its separate read-only entry.
 * @param {string[]} argv @returns {number} */
export function main(argv) {
  const usage = "gate-run.mjs --root <PRODUCT> [--at <exact revision>] <configured-suite>...|--all|--list\n  --range <base>..<tip> [--owed-set] grades/reads the configured owed set\n  <suite> --owning <paths>... is an explicitly scoped reading where supported";
  if (argv.includes("--help") || argv.length === 0) { process.stdout.write(usage + "\n"); return argv.length ? 0 : 2; }
  try {
    let root = process.cwd(), revision, range;
    const rest = [...argv];
    for (const flag of ["--root", "--at", "--range"]) {
      const at = rest.indexOf(flag);
      if (at < 0) continue;
      if (rest.lastIndexOf(flag) !== at || rest[at + 1] === undefined || rest[at + 1]?.startsWith("--")) configuredFinding("gate-usage", `${flag} requires exactly one value`);
      const value = rest[at + 1]; rest.splice(at, 2);
      if (flag === "--root") root = /** @type {string} */ (value); else if (flag === "--at") revision = value; else range = value;
    }
    if (rest.some((arg) => arg.startsWith("--") && !["--all", "--list", "--owed-set", "--owning"].includes(arg))) configuredFinding("gate-usage", "Unknown gate option");
    const productRevision = revision ?? currentRef(root);
    const runner = createConfiguredGateRunner({ productRoot: root, productRevision }), configuration = runner.configuration;
    if (rest.includes("--owed-set")) {
      if (!range || rest.length !== 1) configuredFinding("gate-usage", "--owed-set requires --range and no suite selection");
      const owed = configuredOwedForRange(configuration, range);
      process.stdout.write(JSON.stringify(owed) + "\n"); return "problem" in owed ? 3 : 0;
    }
    if (rest.includes("--list")) {
      if (rest.length !== 1 || range) configuredFinding("gate-usage", "--list takes no suite selection or range");
      for (const suite of Object.values(configuration.registry)) process.stdout.write(`${suite.id} ${suite.cwd} ${suite.argv.join(" ")}${suite.solo ? " [solo]" : ""}\n`);
      return 0;
    }
    if (rest.includes("--owning")) {
      if (rest.indexOf("--owning") !== 1 || range) configuredFinding("gate-usage", "Use <suite> --owning <changed paths> without a range");
      const result = runner.owning(/** @type {string} */ (rest[0]), rest.slice(2));
      for (const verdict of result.verdicts) process.stdout.write(formatVerdict(verdict) + "\n"); return result.code;
    }
    if (range) {
      if (rest.length) configuredFinding("gate-usage", "--range takes no independent suite selection");
      const owed = runner.owed(range);
      if ("problem" in owed) configuredFinding("gate-range-unavailable", owed.problem);
      if (!owed.suites.length) { process.stdout.write("gate-run: this range owes no product suites; nothing graded and no token written\n"); return 0; }
      const result = runner.run(owed.suites, owed); for (const verdict of result.verdicts) process.stdout.write(formatVerdict(verdict) + "\n"); return result.code;
    }
    if (rest.includes("--all") && rest.length !== 1) configuredFinding("gate-usage", "--all takes no independent suite selection");
    const result = runner.run(rest[0] === "--all" ? configuration.context.required : rest);
    for (const verdict of result.verdicts) process.stdout.write(formatVerdict(verdict) + "\n");
    return result.code;
  } catch (error) {
    const finding = /** @type {any} */ (error);
    process.stderr.write(`gate-run: CANNOT RUN ${finding?.code ?? "gate-unavailable"}: ${error instanceof Error ? error.message : String(error)}\n`);
    return finding?.code === "gate-usage" || finding?.code === "gate-suite-selection" ? 2 : 3;
  }
}

if (isMain(import.meta)) {
  process.exit(main(process.argv.slice(2)));
}
