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
import {
  closeSync,
  existsSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readdirSync,
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
} from "../../../.claude/hooks/gate-token.mjs";
import { docsGate, docsReaders, sourceCorpus, stripComments, trackedFiles } from "./docs-scan.mjs";

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
 * @property {"cargo"|"playwright"|"vitest"} family
 * @property {boolean} solo
 * @property {string} why       Why this spelling, in a reader's words.
 */

// `@satisfies` AND NOT `@type`, deliberately: a `@type` annotation would
// make every entry possibly-undefined at the call sites and turn each
// `{...GRADED_SUITES.rust}` into a bag of optional properties, while a
// bare inference widens `family` to `string`. `@satisfies` checks the
// shape AND keeps the literal types the counters switch on.
/** @satisfies {Readonly<Record<string, Suite>>} */
export const GRADED_SUITES = Object.freeze({
  parser: {
    id: "parser",
    cwd: "lib/parser",
    sentinel: "package.json",
    argv: ["npx", "vitest", "run"],
    family: "vitest",
    solo: false,
    why: "C-06's suite; its smoke test parses this repo's live docs/ tree.",
  },
  app: {
    id: "app",
    cwd: "app",
    sentinel: "package.json",
    argv: ["npm", "test"],
    family: "vitest",
    solo: false,
    why: "C-05's model-store unit tests (T-003).",
  },
  rust: {
    id: "rust",
    cwd: "app/src-tauri",
    sentinel: "Cargo.toml",
    argv: ["cargo", "test", "--no-fail-fast"],
    family: "cargo",
    solo: true,
    why:
      "Both workspace crates via default-members. --no-fail-fast is NOT " +
      "optional here: without it a crate-scope count silently describes " +
      "one target (instance 4, and the exit code is 101 either way). " +
      "solo: T-088-s4's cache cliff reds startup_arm under contention.",
  },
  e2e: {
    id: "e2e",
    cwd: "tools/e2e",
    sentinel: "playwright.config.ts",
    argv: ["npx", "playwright", "test"],
    family: "playwright",
    solo: true,
    why:
      "The real-input lane; workers 1, retries 0, no skips. solo: its " +
      "wall time is a health band (suite/e2e-seconds), so a run beside " +
      "another is a reading of the contention, not of the suite.",
  },
});

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
  return bad;
}

/** Validate the whole registry. @returns {string[]} */
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

/**
 * @param {"cargo"|"playwright"|"vitest"} family
 * @param {string} text
 * @returns {Count}
 */
export function countBodies(family, text) {
  if (family === "cargo") return countCargo(text);
  if (family === "playwright") return countPlaywright(text);
  if (family === "vitest") return countVitest(text);
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

// ── THE OWNING-SPEC DERIVATION (T-271) ───────────────────────────────
//
// EVERY FUNCTION IN THIS SECTION IS A FUNCTION OF ITS ARGUMENTS AND THE
// TREE, AND THE PURE ONE IS SEPARATED FROM THE READING ON PURPOSE.
// `owningSpecs` takes the graph and the reader map as DATA — no disk, no
// git, no clock — so a body can drive it over a fixture graph, and so
// that the next card to want a DIFFERENT set of changed paths (T-280
// wants the ones a diff names) supplies them without touching the rule.
// `specFiles` and `specReach` are the readings that feed it.

/** Playwright's `testDir` for this lane's suite, and what makes a file a
 *  spec in it. The directory is flat — every body lives directly in it —
 *  which is why the walk below is one `readdirSync`. */
export const SPEC_DIR = "tools/e2e/tests";
export const SPEC_SUFFIX = ".spec.ts";

/**
 * The extensions a specifier may be missing, in the order a resolver
 * tries them. `""` FIRST because most of this tree writes the extension
 * out (`../scripts/gate-run.mjs`), and the extensionless TypeScript form
 * (`../preflight`, `./git-fixture`) is what the rest is for.
 */
const IMPORT_EXTENSIONS = Object.freeze([
  "",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".mjs",
  ".cjs",
  ".js",
  ".jsx",
]);

/**
 * Every STATIC import specifier in one source text, in source order.
 *
 * ── A LINE SCANNER AND NOT ONE REGEX, AND THE REASON IS THIS CORPUS ──
 * A spec file in this lane writes whole fixture programs as STRING
 * LITERALS, and those strings contain the word `import` followed by a
 * quoted specifier. `stripComments` keeps strings (deliberately — a docs
 * site inside one is still a site), so a regex that matched `import …
 * from "…"` anywhere would read a fixture's imports as this file's. Real
 * import statements begin a LINE; a quoted one is preceded by its own
 * quote. So the scanner is anchored at the start of a line, and the
 * continuation rule below is what lets it still read the multi-line
 * braced form this tree uses everywhere.
 *
 * DYNAMIC `import()` IS OUT OF SCOPE AND SAID SO. It is a call, not a
 * statement, and its argument need not be a literal; the corpus has none
 * today (`grep` for `import(` over tools/e2e and .claude/hooks finds
 * nothing), and if one arrives the edge is simply absent — which the
 * refusal at the other end turns into "the full leg is owed" rather than
 * into a short subset.
 *
 * @param {string} source
 * @returns {string[]}
 */
export function importSpecifiers(source) {
  const lines = stripComments(String(source ?? "")).split("\n");
  /** @type {string[]} */
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (!/^[ \t]*(?:import|export)\b/.test(line)) continue;
    // THE CONTINUATION: keep appending lines until the statement can be
    // decided. A braced list spans lines; a terminated statement never
    // does. The cap is a guard against a file that opens a brace and
    // never closes it — a scanner that ran to EOF would report the whole
    // file's next specifier as this statement's.
    let stmt = line;
    let j = i;
    while (
      j + 1 < lines.length &&
      stmt.length < 4000 &&
      !/;\s*$/.test(stmt) &&
      !/\bfrom\s*(["'])[^"'\n]+\1/.test(stmt)
    ) {
      j += 1;
      stmt += `\n${lines[j] ?? ""}`;
    }
    i = j;
    const named = stmt.match(/\bfrom\s*(["'])([^"'\n]+)\1/);
    if (named?.[2] !== undefined) {
      out.push(named[2]);
      continue;
    }
    // The side-effect form, `import "…";`, which carries no `from`.
    const bare = stmt.match(/^[ \t]*import\s*(["'])([^"'\n]+)\1/);
    if (bare?.[2] !== undefined) out.push(bare[2]);
  }
  return out;
}

/**
 * @typedef {object} ResolvedImport
 * @property {"resolved"|"external"|"unresolved"} kind
 * @property {string | undefined} [rel] repo-relative POSIX path, when resolved.
 */

/**
 * Resolve one specifier against the file that wrote it.
 *
 * A BARE SPECIFIER IS `external` AND NOT AN ERROR: `@playwright/test`
 * and `node:fs` are somebody else's tree and no change in this repository
 * moves them. A RELATIVE specifier that resolves to no file is
 * `unresolved` and is REPORTED — a dropped edge makes the subset SHORT,
 * which is the one direction this feature may not fail in, so the caller
 * turns it into a refusal rather than into a smaller graph.
 *
 * @param {string} fromRel   the importing file, repo-relative, POSIX
 * @param {string} spec      the specifier exactly as written
 * @param {(rel: string) => boolean} isFile  does this repo-relative path exist as a file?
 * @returns {ResolvedImport}
 */
export function resolveImport(fromRel, spec, isFile) {
  if (!spec.startsWith(".")) return { kind: "external" };
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec));
  // A CLIMB THAT LEAVES THE REPOSITORY is external, not unresolved: there
  // is nothing here to grade and nothing here that could have moved it.
  if (base === ".." || base.startsWith("../")) return { kind: "external" };
  /** @type {string[]} */
  const candidates = [];
  for (const ext of IMPORT_EXTENSIONS) candidates.push(`${base}${ext}`);
  // NodeNext's `.js` for a `.ts` source — the spelling TypeScript asks
  // for when a module resolves at runtime and is authored in TS.
  const swapped = base.replace(/\.(m|c)?js$/, (_m, p1) => `.${p1 ?? ""}ts`);
  if (swapped !== base) candidates.push(swapped, `${swapped}x`);
  for (const ext of IMPORT_EXTENSIONS) candidates.push(`${base}/index${ext}`);
  for (const c of candidates) {
    if (c !== "" && isFile(c)) return { kind: "resolved", rel: c };
  }
  return { kind: "unresolved" };
}

/**
 * The spec files this lane grades, repo-relative and sorted.
 * @param {string} [root]
 * @returns {string[]}
 */
export function specFiles(root = repoRoot) {
  const dir = path.join(root, SPEC_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(SPEC_SUFFIX))
    .map((n) => `${SPEC_DIR}/${n}`)
    .sort();
}

/**
 * @typedef {object} SpecReach
 * @property {Record<string, string[]>} reach  spec -> every repo file it
 *   reads through static imports, ITSELF INCLUDED. Sorted.
 * @property {string[]} unresolved  `<file> -> <specifier>` for every
 *   relative import this walk could not land on a file.
 */

/**
 * Walk the static import graph out from each spec.
 *
 * ITSELF INCLUDED, deliberately: "which spec owns tests/gate-run.spec.ts"
 * has an answer, and it is that file. Treating the roots as outside their
 * own reach would have made a spec the only kind of file that cannot own
 * a change to itself.
 *
 * @param {string} [root]
 * @param {string[]} [specs]
 * @returns {SpecReach}
 */
export function specReach(root = repoRoot, specs = specFiles(root)) {
  /** @param {string} rel @returns {boolean} */
  const isFile = (rel) => {
    try {
      return statSync(path.join(root, rel)).isFile();
    } catch {
      return false;
    }
  };
  /** @type {Record<string, string[]>} */
  const reach = {};
  /** @type {Set<string>} */
  const unresolved = new Set();
  /** @type {Map<string, string[]>} */
  const edges = new Map();
  /** @param {string} rel @returns {string[]} */
  const importsOf = (rel) => {
    const cached = edges.get(rel);
    if (cached !== undefined) return cached;
    /** @type {string[]} */
    const out = [];
    let src = "";
    try {
      src = readFileSync(path.join(root, rel), "utf8");
    } catch {
      edges.set(rel, out);
      return out;
    }
    for (const spec of importSpecifiers(src)) {
      const r = resolveImport(rel, spec, isFile);
      if (r.kind === "resolved" && r.rel !== undefined) out.push(r.rel);
      else if (r.kind === "unresolved") unresolved.add(`${rel} -> ${spec}`);
    }
    edges.set(rel, out);
    return out;
  };
  for (const spec of specs) {
    /** @type {Set<string>} */
    const seen = new Set([spec]);
    const queue = [spec];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur === undefined) break;
      for (const next of importsOf(cur)) {
        if (seen.has(next)) continue;
        seen.add(next);
        queue.push(next);
      }
    }
    reach[spec] = [...seen].sort();
  }
  return { reach, unresolved: [...unresolved].sort() };
}

/**
 * Normalise one changed path as a caller may have typed it: a `./`
 * prefix, a trailing slash, a Windows separator, an absolute path inside
 * this checkout. Anything that still escapes the repository is returned
 * unchanged and will be UNPLACEABLE, which is the honest end.
 * @param {string} raw
 * @param {string} [root]
 * @returns {string}
 */
export function normaliseChanged(raw, root = repoRoot) {
  let p = String(raw ?? "").trim().split(path.sep).join("/");
  if (p.startsWith(`${root.split(path.sep).join("/")}/`)) {
    p = p.slice(root.split(path.sep).join("/").length + 1);
  }
  p = p.replace(/^\.\//, "").replace(/\/+$/, "");
  return path.posix.normalize(p);
}

/**
 * @typedef {object} OwningDerivation
 * @property {string[]} specs        the subset to grade, sorted.
 * @property {{ path: string, specs: string[], via: string[] }[]} byPath
 * @property {{ path: string, why: string }[]} unplaceable
 */

/**
 * THE RULE, AND IT IS A PURE FUNCTION OF ITS THREE NAMED INPUTS.
 *
 * A spec OWNS a changed path when the path IS that spec, when the spec
 * reaches the path through static imports, or — for a path under docs/ —
 * when the DOCS GATE'S OWN reader map says some file reads it and this
 * spec is that file or reaches it. The docs arm composes with the import
 * arm rather than duplicating it: `docs/CONVENTIONS.md` is read by
 * `tools/e2e/scripts/cli.mjs`, which is not a spec, and the spec that
 * owns THAT is the one that imports it.
 *
 * NOTHING HERE READS A SPEC'S NAME. `gate-run.spec.ts` owning
 * `gate-run.mjs` is a fact about an import statement, and the two files
 * agreeing on a stem is a coincidence this rule must not lean on:
 * `helpers.ts` and `git-fixture.ts` are owned by a dozen specs that share
 * no stem with them at all.
 *
 * @param {object} input
 * @param {string[]} input.changed  repo-relative paths the lane changed
 * @param {Record<string, string[]>} input.reach  from `specReach`
 * @param {Record<string, string[]>} [input.docsReadersByPath]  docs path ->
 *   the repo-relative files the DOCS GATE's reader map says read it
 * @param {Record<string, string[]>} [input.settingsReadersByPath]  runtime
 *   settings path -> the repo-relative files that read it (T-330). It
 *   composes with the import arm the same way the docs map does, and for
 *   the same reason: the file that opens the runtime template is a
 *   SCRIPT, and the spec that owns that is the one importing it.
 * @param {Record<string, string[]>} [input.generatedByPath]  changed source
 *   path -> the GENERATED files a spec may reach on its behalf, from
 *   `generatedEntries` (T-335). This arm does not compose through a
 *   reader the way the two above do, and the asymmetry is the point: the
 *   spec's edge already lands on the generated file, so what was missing
 *   was never a reader but the fact that a changed SOURCE stands behind
 *   that file. Nothing here rewrites a path — the standing-behind is the
 *   owning package's own build configuration, read once by the caller.
 * @param {Record<string, string>} [input.generatedVia]  generated file ->
 *   the sentence naming the configuration that produces it, so a
 *   selection can say which declaration it came from.
 * @returns {OwningDerivation}
 */
export function owningSpecs({
  changed,
  reach,
  docsReadersByPath = {},
  settingsReadersByPath = {},
  generatedByPath = {},
  generatedVia = {},
}) {
  const specs = Object.keys(reach).sort();
  /** @type {Set<string>} */
  const owed = new Set();
  /** @type {{ path: string, specs: string[], via: string[] }[]} */
  const byPath = [];
  /** @type {{ path: string, why: string }[]} */
  const unplaceable = [];
  for (const p of changed) {
    /** @type {Map<string, string>} */
    const hits = new Map();
    for (const s of specs) {
      if (s === p) hits.set(s, "the changed path IS this spec");
      else if ((reach[s] ?? []).includes(p)) hits.set(s, "imports it, directly or transitively");
    }
    for (const reader of docsReadersByPath[p] ?? []) {
      for (const s of specs) {
        if (hits.has(s)) continue;
        if (s === reader) hits.set(s, `is the docs-walk body that reads ${p}`);
        else if ((reach[s] ?? []).includes(reader)) {
          hits.set(s, `imports ${reader}, which the docs gate says reads ${p}`);
        }
      }
    }
    for (const reader of settingsReadersByPath[p] ?? []) {
      for (const s of specs) {
        if (hits.has(s)) continue;
        if (s === reader) hits.set(s, `is the body that reads the configuration at ${p}`);
        else if ((reach[s] ?? []).includes(reader)) {
          hits.set(s, `imports ${reader}, which reads the configuration at ${p}`);
        }
      }
    }
    for (const generated of generatedByPath[p] ?? []) {
      for (const s of specs) {
        if (hits.has(s)) continue;
        if (!(reach[s] ?? []).includes(generated)) continue;
        hits.set(
          s,
          `imports ${generated}, and ${generatedVia[generated] ?? "its owning package builds that from this path's source root"}`,
        );
      }
    }
    if (hits.size === 0) {
      unplaceable.push({
        path: p,
        why: p.startsWith("docs/")
          ? "the docs gate's reader map names no spec in this lane for it"
          : underSettings(p)
            ? "the runtime settings reader map names no spec in this lane for it"
            : "no spec in this lane reaches it through a static import, and it is not a spec",
      });
      continue;
    }
    const owning = [...hits.keys()].sort();
    for (const s of owning) owed.add(s);
    byPath.push({ path: p, specs: owning, via: owning.map((s) => `${s} — ${hits.get(s)}`) });
  }
  return { specs: [...owed].sort(), byPath, unplaceable };
}

/**
 * The derivation as the CLI runs it: the readings taken, then the rule.
 * Kept separate from `owningSpecs` so the rule stays testable with no
 * tree at all, and so this function is the ONE place a reading happens.
 *
 * THE DOCS SCAN IS PAID FOR ONLY WHEN A DOCS PATH MOVED. It walks the
 * whole source corpus; a lane changing one script should not pay for it.
 *
 * @param {string[]} rawChanged
 * @param {string} [root]
 * @returns {OwningDerivation & { changed: string[], unresolved: string[], generatedUnplaceable: { path: string, why: string }[] }}
 */
export function deriveOwning(rawChanged, root = repoRoot) {
  const changed = rawChanged.map((p) => normaliseChanged(p, root));
  const { reach, unresolved } = specReach(root);
  /** @type {Record<string, string[]>} */
  const docsReadersByPath = {};
  if (changed.some((p) => p === "docs" || p.startsWith("docs/"))) {
    const gate = docsGate(changed, docsReaders(root));
    for (const entry of gate.byPath) docsReadersByPath[entry.path] = entry.readers;
  }
  /** @type {Record<string, string[]>} */
  const settingsReadersByPath = {};
  const settingsPaths = changed.filter((p) => underSettings(p));
  if (settingsPaths.length > 0) {
    Object.assign(settingsReadersByPath, settingsReaders(settingsPaths, root).byPath);
  }
  const generated = generatedSources(changed, reach, root);
  return {
    changed,
    unresolved,
    // T-335: reported rather than refused HERE, because this function is
    // the rule's reader and `mainOwning` is the arm that owes a refusal.
    generatedUnplaceable: generated.unplaceable,
    ...owningSpecs({
      changed,
      reach,
      docsReadersByPath,
      settingsReadersByPath,
      generatedByPath: generated.byPath,
      generatedVia: generated.via,
    }),
  };
}

/**
 * The subset as a runnable suite: the leg's own entry with the spec files
 * appended to its argv, spelled relative to the leg's own cwd because
 * that is where the runner will be standing.
 * @param {string[]} specs  repo-relative spec paths
 * @param {Suite} [leg]
 * @returns {Suite}
 */
export function scopedSuite(specs, leg = GRADED_SUITES.e2e) {
  const cwd = `${leg.cwd}/`;
  return {
    ...leg,
    argv: [...leg.argv, ...specs.map((s) => (s.startsWith(cwd) ? s.slice(cwd.length) : s))],
  };
}

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

// ── THE RUNTIME SETTINGS THIS PROJECT IS CONFIGURED BY (T-330) ───────
//
// `method/runtime/` holds the runtime template and the schema beside it:
// the file that says which model each role is dispatched on, which
// process profile this project runs, and — since T-319 — whether an
// owner's dispatch grant is recorded. It is CONFIGURATION: not code, and
// not a document. It lies under no package root, no spec reaches it
// through a static import, and the DOCS GATE's reader map does not cover
// it because it is not under `docs/`. All three arms of the derivation
// below answer "I cannot place this", so the whole battery is owed for a
// two-line records change — the conservative answer for an unplaceable
// input, and NOT a finding that every body reads the file. Measured at
// T-330: recording the owner's approved dispatch grant, forty lines of
// configuration, owed four legs.
//
// THE CONSUMERS ARE DERIVED FROM THE TREE AND NEVER LISTED. A file reads
// a runtime settings path when its comment-stripped source SPELLS that
// path — as one literal, or as the segments a `path.join` is given — or
// when it names an identifier some speller BINDS to exactly that path.
// THE SECOND ARM IS NOT AN EXTRA: the path this project's arm actually
// opens is `RUNTIME_TEMPLATE`, exported by the parser library's settings
// reader, so a literal-only scan finds the library and misses every one
// of the arm's own readers and every body that drives them. Both arms
// are TEXTUAL and deliberately generous — this derivation may be wrong
// by owing too MUCH and must never be wrong by owing too little, so a
// file that merely mentions the name counts as a reader.
//
// AND A SETTINGS PATH NOTHING READS IS UNPLACEABLE, which is where this
// arm is deliberately less confident than the docs arm beside it. There,
// "no code suite reads this document" is a POSITIVE answer over a map
// derived from the whole source corpus. Here, a configuration file this
// scan finds no reader for is a file whose consumers the scan did not
// find: the arms are textual, and a reader that computed its path some
// third way would look exactly like a file nobody reads. So it falls
// through to the whole battery, naming the path it could not place.

/** The directory this project's runtime configuration lives in. */
export const SETTINGS_DIR = "method/runtime";

/**
 * Is this repo-relative path one of the runtime settings files?
 * @param {string} rel
 * @returns {boolean}
 */
export function underSettings(rel) {
  return rel === SETTINGS_DIR || rel.startsWith(`${SETTINGS_DIR}/`);
}

/**
 * THE SITE FORM of one settings path: its segments in order, with the
 * quotes, commas, dots and slashes a source file may put between them,
 * so that `"method/runtime/x.yaml"` and `path.join(root, "method",
 * "runtime", "x.yaml")` are ONE pattern rather than two rules that can
 * disagree. Every segment is escaped — a `.` in a filename is a dot and
 * not a wildcard.
 * @param {string} rel
 * @returns {RegExp}
 */
export function settingsSiteRe(rel) {
  const parts = rel.split("/").map((seg) => seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(parts.join("[\"'`\\s,./]+"));
}

/** A `const NAME = "literal"` binding, in either dialect this tree writes
 *  (`export const` in TS/JS, `static NAME: &str` in Rust is matched by the
 *  same shape once `static` is allowed as the keyword). */
const SETTINGS_BINDING_RE =
  /\b(?:pub\s+)?(?:export\s+)?(?:const|let|var|static)\s+([A-Za-z_$][\w$]*)\s*(?::[^=\n]*)?=\s*["'`]([^"'`\n]+)["'`]/g;

/**
 * @typedef {object} SettingsReaderMap
 * @property {string[]} asked  every settings path this map was ASKED
 *   about. A path missing from it was never put to the scan, and an
 *   empty reader list for it would be an unasked question in an answer's
 *   costume — the same distinction the DOCS GATE's map draws.
 * @property {Record<string, string[]>} byPath  settings path -> the
 *   repo-relative source files that read it, sorted.
 * @property {Record<string, string[]>} constants  settings path -> the
 *   identifiers a speller binds to it, sorted. Reported rather than kept
 *   private so that an answer can be checked against the tree.
 */

/**
 * THE RULE, AND IT IS A PURE FUNCTION OF THE CORPUS IT IS GIVEN.
 *
 * @param {string[]} paths  the settings paths to place, repo-relative
 * @param {Record<string, string>} corpus  source file -> its
 *   comment-stripped text. Comments are stripped because a rule that
 *   counted a mention in prose would make every file that TALKS about
 *   the template a reader of it.
 * @returns {SettingsReaderMap}
 */
export function settingsReadersIn(paths, corpus) {
  const files = Object.keys(corpus).sort();
  /** @type {Record<string, string[]>} */
  const byPath = {};
  /** @type {Record<string, string[]>} */
  const constants = {};
  for (const rel of paths) {
    const site = settingsSiteRe(rel);
    const spellers = files.filter((f) => site.test(corpus[f] ?? ""));
    /** @type {Set<string>} */
    const names = new Set();
    for (const f of spellers) {
      for (const m of (corpus[f] ?? "").matchAll(SETTINGS_BINDING_RE)) {
        if (m[2] === rel && m[1] !== undefined) names.add(m[1]);
      }
    }
    /** @type {Set<string>} */
    const readers = new Set(spellers);
    for (const name of names) {
      const named = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      for (const f of files) if (named.test(corpus[f] ?? "")) readers.add(f);
    }
    byPath[rel] = [...readers].sort();
    constants[rel] = [...names].sort();
  }
  return { asked: [...new Set(paths)].sort(), byPath, constants };
}

/**
 * The rule as the CLI runs it: the reading taken, then the rule. Kept
 * separate so the rule stays testable with no tree at all, and so this
 * function is the ONE place a reading happens.
 *
 * THE WALK IS PAID FOR ONLY WHEN A SETTINGS PATH MOVED, which is why
 * every caller guards it — it reads the whole source corpus, and a lane
 * changing one script should not pay for it.
 *
 * @param {string[]} paths
 * @param {string} [root]
 * @returns {SettingsReaderMap}
 */
export function settingsReaders(paths, root = repoRoot) {
  /** @type {Record<string, string>} */
  const corpus = {};
  for (const rel of sourceCorpus(root)) {
    try {
      corpus[rel] = stripComments(readFileSync(path.join(root, rel), "utf8"));
    } catch {
      // A TRACKED FILE THIS WALK CANNOT READ CONTRIBUTES NO EDGE and is
      // not an error: a path deleted in the working tree is still tracked.
      corpus[rel] = "";
    }
  }
  return settingsReadersIn(paths, corpus);
}

// ── THE OWED SET (T-280) ─────────────────────────────────────────────
//
// ── WHAT THIS IS, AND HOW IT DIFFERS FROM `--owning` ABOVE ───────────
// `--owning` takes a path list a SEAT typed and answers one question:
// which spec files own it. It is the executor's iteration form, its
// verdict wears `SCOPED-` so it can never mint a push token, and it
// grades the end-to-end leg and nothing else.
//
// THIS derives its own path list FROM A RANGE — the push range, or a
// bench's `base..tip` — and answers the whole question: which of the
// GRADED SUITES that range owes, and for the end-to-end leg, which SPEC
// FILES. Nothing about the set is typed by anybody, which is what makes
// a verdict over it mintable: the push guard re-derives the same set
// from the same range with this same function and requires the token to
// cover it.
//
// ── FIVE ARMS, COMPOSED, AND NOT ONE OF THEM IS A LIST ───────────────
//   THE PACKAGE ROOTS come off the registry's own `cwd` fields
//     (`PACKAGE_ROOTS`), so adding a graded suite moves this derivation
//     with it and a hand-kept copy cannot drift from the runner.
//   THE IMPORT GRAPH is T-271's, unchanged and CALLED rather than
//     re-implemented: `owningSpecs` over `specReach`.
//   THE DOCS GATE'S READER MAP is `docs-scan.mjs`'s, likewise called.
//     A docs path's readers are FILES; each file is placed through the
//     package roots, which is how a document read by the parser's census
//     owes the parser suite without anybody writing that down.
//   THE RUNTIME SETTINGS READER MAP is `settingsReaders` below, added by
//     T-330 for the one input none of the three above can place: this
//     project's own configuration. Its readers are FILES too, and are
//     placed through the same package roots.
//   THE GENERATED-ENTRY RELATIONSHIP is `generatedSources` below, added
//     by T-335 for the edge the import arm reaches and no changed path
//     can ever be: a spec imports a package's BUILT entry, and git does
//     not track it. It is read off the owning package's own build
//     configuration, so it is a DECLARATION rather than a rewritten
//     path, and a generated file no configuration places is named and
//     fails closed.
//
// ── AND THE `file:` EDGE, WHICH THE PACKAGE ROOTS ALONE WOULD MISS ───
// `app/package.json` depends on the parser at `file:../lib/parser`, so a
// change under `lib/parser/` can red the APP suite while lying under the
// parser's root alone. The edge is READ from the manifests
// (`packageDependents`) rather than asserted here, and closed
// transitively, so a second `file:` dependency added tomorrow is carried
// by this function on the day it lands.
//
// ── FAIL CLOSED, AND THE ONLY DIRECTION THIS MAY BE WRONG IN ─────────
// A path under no package root that no spec reaches and that the docs
// gate cannot place makes the owed set THE WHOLE BATTERY, and the reason
// travels with it into the token. So does an unresolvable import edge,
// which would make the spec subset SHORT. This derivation can be wrong
// by owing too MUCH; it must never be wrong by owing too little.
//
// A DOCS PATH NOTHING READS IS PLACED, NOT UNPLACEABLE, and that is the
// one asymmetry against `--owning` worth stating. There, the question is
// "which spec owns this" and "none" is an inability. Here the question is
// "what does this range owe" and the docs gate answering "no code suite
// reads it" is a POSITIVE answer over a map derived from the whole source
// corpus — it is the instrument the DOCS GATE itself is made of. Half
// the batteries this card was written about were pushes of exactly those
// paths.

/**
 * The package root each graded suite owns, DERIVED from the registry's
 * own `cwd` and never written down a second time.
 * @type {Readonly<Record<string, string>>}
 */
export const PACKAGE_ROOTS = Object.freeze(
  Object.fromEntries(Object.values(GRADED_SUITES).map((s) => [s.id, s.cwd])),
);

/** Every graded suite, which is what "the whole battery" means here. */
export const ALL_SUITES = Object.freeze(Object.keys(GRADED_SUITES).sort());

/**
 * The suite whose package root contains this path — the LONGEST one,
 * because `app/src-tauri` lies inside `app` and a Rust file is the rust
 * suite's, not the app suite's.
 * @param {string} rel
 * @param {Readonly<Record<string, string>>} [roots]
 * @returns {string | undefined}
 */
export function suiteOfPath(rel, roots = PACKAGE_ROOTS) {
  /** @type {string | undefined} */
  let best;
  for (const [id, dir] of Object.entries(roots)) {
    if (rel !== dir && !rel.startsWith(`${dir}/`)) continue;
    if (best === undefined || dir.length > (roots[best] ?? "").length) best = id;
  }
  return best;
}

/**
 * suite -> every suite whose package DEPENDS on it, read off the
 * manifests' `file:` specifiers and closed transitively.
 *
 * A MANIFEST THIS CANNOT READ CONTRIBUTES NO EDGE AND IS NOT AN ERROR:
 * `app/src-tauri` is a Cargo workspace with no `package.json`, and both
 * its crates lie under one root, so there is no cross-root edge for this
 * function to find there.
 *
 * @param {string} [root]
 * @param {Readonly<Record<string, string>>} [roots]
 * @returns {Record<string, string[]>}
 */
export function packageDependents(root = repoRoot, roots = PACKAGE_ROOTS) {
  /** @type {Record<string, Set<string>>} */
  const out = {};
  for (const id of Object.keys(roots)) out[id] = new Set();
  for (const [id, dir] of Object.entries(roots)) {
    /** @type {unknown} */
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(path.join(root, dir, "package.json"), "utf8"));
    } catch {
      continue;
    }
    const obj = /** @type {Record<string, unknown>} */ (pkg ?? {});
    /** @type {Record<string, unknown>} */
    const deps = {
      .../** @type {Record<string, unknown>} */ (obj["dependencies"] ?? {}),
      .../** @type {Record<string, unknown>} */ (obj["devDependencies"] ?? {}),
    };
    for (const spec of Object.values(deps)) {
      if (typeof spec !== "string" || !spec.startsWith("file:")) continue;
      const target = path.posix.normalize(path.posix.join(dir, spec.slice("file:".length)));
      for (const [otherId, otherDir] of Object.entries(roots)) {
        if (otherDir === target && otherId !== id) {
          /** @type {Set<string>} */ (out[otherId]).add(id);
        }
      }
    }
  }
  // TRANSITIVE CLOSURE. One edge exists today; a chain of two would make
  // a single-hop reading silently short, and the fixed point is cheap.
  for (let moved = true; moved; ) {
    moved = false;
    for (const id of Object.keys(out)) {
      const here = /** @type {Set<string>} */ (out[id]);
      for (const dep of [...here]) {
        for (const further of out[dep] ?? new Set()) {
          if (further !== id && !here.has(further)) {
            here.add(further);
            moved = true;
          }
        }
      }
    }
  }
  return Object.fromEntries(Object.entries(out).map(([id, s]) => [id, [...s].sort()]));
}

// ── THE GENERATED ENTRY AND ITS OWNING SOURCES (T-335) ────────────────
//
// ── THE DEAD EDGE THIS ARM EXISTS FOR ────────────────────────────────
// Two specs import `lib/parser/dist/pure.js`, an edge T-317 added, and
// `lib/parser/.gitignore` excludes `dist/`. The walk above REACHES that
// file and every generated file it imports, so the graph is not missing
// the edge — it is missing the only thing that could ever use it. A
// range's changed paths come from `git diff --name-only`, and git does
// not name a file it does not track, so no changed path can ever BE one
// of those generated files. The edge could contribute a selection
// exactly never: measured at `f54e409f` with the parser built, a range
// whose only changed path was `lib/parser/src/pure.ts` owed `app` and
// `parser` with the end-to-end leg narrowed to ZERO spec files, and
// neither importer was among them. Until T-331 narrowed the leg the
// whole battery ran anyway and this cost nothing.
//
// ── WHAT IS READ, AND WHY IT IS NOT A REWRITTEN PATH ─────────────────
// The relationship between `lib/parser/dist/pure.js` and the sources
// that produce it is DECLARED, by the package that owns both: its own
// manifest's `build` script names a TypeScript project, and that project
// names `rootDir` and `outDir`. So this arm reads the owning package's
// build configuration — the `extends` chain included, because this
// repository writes the emit options in a second file that inherits the
// first — and spells neither `dist` nor `src` itself. A package that
// moves where it builds to moves this derivation with it on the day it
// lands, and a package that builds some other way contributes no
// relationship rather than a wrong one.
//
// ── THE COUPLING IS THE PACKAGE'S, NOT ONE FILE'S ────────────────────
// `rootDir` -> `outDir` is a DIRECTORY relationship and this arm keeps
// it one: any source under the root couples to every generated file
// under the output root that the import graph reaches. Mapping
// `dist/pure.js` back to `src/pure.ts` alone would be more precise and
// would be wrong in the one direction this derivation may not be wrong
// in — `src/index.ts` is an entry nothing in this lane imports, a
// re-export moves an emit its own filename does not name, and a
// per-file map would answer "no spec" for a source change that really
// can move a spec's subject.
//
// ── AND WHERE THE RELATIONSHIP CANNOT BE READ ────────────────────────
// A generated file in the graph that no package's build configuration
// places is reported BY NAME and the caller turns it into the whole
// battery — the same shape, and the same reason, as an import edge that
// lands nowhere. That is not a placeholder waiting to be optimised
// away: an unreadable relationship means this derivation cannot say
// which sources move that file, and the only honest answer to "which
// suites does this range owe" is then all of them.
//
// ── WHY THE T-330 SETTINGS CONSUMER MAP DOES NOT CARRY THIS ──────────
// `settingsReadersIn` above answers "which files READ this path", over a
// textual corpus, by path spellings and the identifiers bound to them.
// This arm answers "which sources PRODUCE this path", and the answer is
// not textual at all: no source under `lib/parser/src/` mentions
// `lib/parser/dist/pure.js`, and the file that does mention it is the
// spec doing the importing — the consumer, not the producer. Pointed at
// a generated entry the settings scan would return its IMPORTERS, which
// this derivation already has from the import graph, and never the
// sources. The two are different relations over the same tree, so they
// are two arms rather than one abstraction.

/** The manifest script whose command declares how a package is built. */
export const BUILD_SCRIPT = "build";

/**
 * Every TypeScript project a build script runs, in the order it runs
 * them. A bare `tsc` contributes `tsconfig.json`, which is the file it
 * would read; `-p`/`--project` names another.
 *
 * THE SPLIT IS ON THE SHELL'S OWN SEPARATORS because this repository
 * writes `tsc && tsc -p tsconfig.test.json && vite build`, and a scanner
 * that read that as one command would hand the second project's flags to
 * the first. A segment with no `tsc` in it contributes nothing — a
 * bundler's output is not a relationship this function can read, and
 * saying so is what makes the fail-closed arm below fire honestly.
 *
 * @param {unknown} script
 * @returns {string[]}
 */
export function buildConfigsIn(script) {
  /** @type {string[]} */
  const out = [];
  for (const part of String(script ?? "").split(/&&|\|\||;/)) {
    const words = part.trim().split(/\s+/).filter((w) => w !== "");
    const at = words.findIndex((w) => w === "tsc" || w.endsWith("/tsc"));
    if (at < 0) continue;
    let file = "tsconfig.json";
    const rest = words.slice(at + 1);
    for (let i = 0; i < rest.length; i += 1) {
      const w = rest[i] ?? "";
      if ((w === "-p" || w === "--project") && rest[i + 1] !== undefined) {
        file = /** @type {string} */ (rest[i + 1]);
        break;
      }
      const inline = /^--project=(.+)$/.exec(w);
      if (inline?.[1] !== undefined) {
        file = inline[1];
        break;
      }
    }
    if (!out.includes(file)) out.push(file);
  }
  return out;
}

/**
 * @typedef {object} TsconfigReading
 * @property {Record<string, unknown>} compilerOptions  merged along the
 *   `extends` chain, nearest file winning.
 * @property {unknown} include  the nearest `include` found, likewise.
 * @property {string | undefined} [problem]  why nothing could be read.
 */

/**
 * One TypeScript project, with its `extends` chain closed.
 *
 * TOLERANT OF THE DIALECT tsconfig IS ACTUALLY WRITTEN IN: comments and
 * a trailing comma are legal there and fatal to `JSON.parse`, and a
 * derivation that refused this repository's own configuration would fail
 * closed for a reason about punctuation. A BARE `extends` SPECIFIER
 * (a package, not a relative path) is left unfollowed and is not an
 * error on its own — what matters is whether an emit relationship comes
 * out at the end, and the caller says so if none does.
 *
 * @param {string} root
 * @param {string} dir   the directory `file` is spelled relative to, repo-relative
 * @param {string} file
 * @param {Set<string>} [seen]
 * @returns {TsconfigReading}
 */
export function resolveTsconfig(root, dir, file, seen = new Set()) {
  const withJson = file.endsWith(".json") ? file : `${file}.json`;
  const rel = path.posix.normalize(path.posix.join(dir, withJson));
  if (seen.has(rel)) {
    return { compilerOptions: {}, include: undefined, problem: `${rel} extends itself` };
  }
  seen.add(rel);
  let raw = "";
  try {
    raw = readFileSync(path.join(root, rel), "utf8");
  } catch {
    return { compilerOptions: {}, include: undefined, problem: `${rel} could not be read` };
  }
  /** @type {unknown} */
  let doc;
  try {
    doc = JSON.parse(stripComments(raw).replace(/,(\s*[}\]])/g, "$1"));
  } catch (err) {
    return {
      compilerOptions: {},
      include: undefined,
      problem: `${rel} is not readable as JSON (${err instanceof Error ? err.message : String(err)})`,
    };
  }
  const obj = /** @type {Record<string, unknown>} */ (doc ?? {});
  /** @type {TsconfigReading} */
  let inherited = { compilerOptions: {}, include: undefined };
  const ext = obj["extends"];
  if (typeof ext === "string" && ext.startsWith(".")) {
    inherited = resolveTsconfig(root, path.posix.dirname(rel), ext, seen);
  }
  const own = /** @type {Record<string, unknown>} */ (obj["compilerOptions"] ?? {});
  return {
    compilerOptions: { ...inherited.compilerOptions, ...own },
    include: obj["include"] ?? inherited.include,
  };
}

/**
 * The ONE directory an `include` names, when it names one directory.
 * `["src"]` is this repository's shape and stands in for an unwritten
 * `rootDir`, which `tsc` would infer the same way. Anything with a glob,
 * an extension or a second entry is not a source root and is refused
 * rather than guessed at.
 * @param {unknown} include
 * @returns {string | undefined}
 */
export function soleIncludeDir(include) {
  if (!Array.isArray(include) || include.length !== 1) return undefined;
  const only = include[0];
  if (typeof only !== "string" || only === "") return undefined;
  if (/[*?[\]]/.test(only) || /\.[A-Za-z]+$/.test(only)) return undefined;
  return only;
}

/**
 * @typedef {object} PackageBuild
 * @property {string} config  the TypeScript project, repo-relative
 * @property {string} src     its source root, repo-relative, no trailing slash
 * @property {string} out     its output root, repo-relative, no trailing slash
 */

/**
 * suite -> every emit relationship its package's own build declares,
 * read off the manifests and the projects they name.
 *
 * A PACKAGE THAT DECLARES NONE IS NOT AN ERROR HERE and the reason is
 * recorded rather than thrown: `tools/e2e` has no build at all, and
 * `app`'s two projects are `noEmit` because a bundler writes its output.
 * Neither is a problem until something in the import graph turns out to
 * be generated by one of them, and that is the question the rule below
 * asks — so this function REPORTS what it could not read and refuses
 * nothing.
 *
 * @param {string} [root]
 * @param {Readonly<Record<string, string>>} [roots]
 * @returns {{ byPackage: Record<string, PackageBuild[]>, notes: Record<string, string[]> }}
 */
export function packageBuilds(root = repoRoot, roots = PACKAGE_ROOTS) {
  /** @type {Record<string, PackageBuild[]>} */
  const byPackage = {};
  /** @type {Record<string, string[]>} */
  const notes = {};
  for (const [id, dir] of Object.entries(roots)) {
    byPackage[id] = [];
    notes[id] = [];
    /** @type {unknown} */
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(path.join(root, dir, "package.json"), "utf8"));
    } catch {
      notes[id].push(`${dir}/package.json could not be read as a manifest`);
      continue;
    }
    const scripts = /** @type {Record<string, unknown>} */ (
      /** @type {Record<string, unknown>} */ (pkg ?? {})["scripts"] ?? {}
    );
    const script = scripts[BUILD_SCRIPT];
    if (typeof script !== "string") {
      notes[id].push(`${dir}/package.json declares no ${BUILD_SCRIPT} script`);
      continue;
    }
    const configs = buildConfigsIn(script);
    if (configs.length === 0) {
      notes[id].push(
        `the ${BUILD_SCRIPT} script of ${dir} runs no TypeScript project, so this derivation ` +
          "cannot read where it emits",
      );
      continue;
    }
    for (const file of configs) {
      const reading = resolveTsconfig(root, dir, file);
      const rel = path.posix.normalize(path.posix.join(dir, file.endsWith(".json") ? file : `${file}.json`));
      if (reading.problem !== undefined) {
        notes[id].push(reading.problem);
        continue;
      }
      const co = reading.compilerOptions;
      const outDir = typeof co["outDir"] === "string" ? co["outDir"] : undefined;
      if (outDir === undefined) {
        notes[id].push(`${rel} declares no outDir, so it emits nothing this arm can place`);
        continue;
      }
      const srcDir = typeof co["rootDir"] === "string" ? co["rootDir"] : soleIncludeDir(reading.include);
      if (srcDir === undefined) {
        notes[id].push(`${rel} declares neither a rootDir nor a single include directory`);
        continue;
      }
      byPackage[id].push({
        config: rel,
        src: path.posix.normalize(path.posix.join(dir, srcDir)).replace(/\/+$/, ""),
        out: path.posix.normalize(path.posix.join(dir, outDir)).replace(/\/+$/, ""),
      });
    }
  }
  return { byPackage, notes };
}

/**
 * @typedef {object} GeneratedPlacement
 * @property {Record<string, string[]>} byPath  changed path -> the generated
 *   files a spec may reach on its behalf, sorted.
 * @property {Record<string, string>} via  generated file -> the sentence
 *   naming the configuration that produces it and the sources it is
 *   produced from, so a selection can say where it came from.
 * @property {Record<string, string[]>} byPackage  suite -> the generated
 *   files the import graph reaches under that package's output roots.
 * @property {{ path: string, why: string }[]} unplaceable  every generated
 *   file in the graph no build configuration maps back onto sources.
 */

/**
 * THE RULE, AND IT IS A PURE FUNCTION OF ITS NAMED INPUTS.
 *
 * A file in the import graph is GENERATED when git does not track it:
 * that is the property that makes the edge dead, and it is the same
 * reading `treeWithout`'s fixture in this lane's spec derives a fresh
 * runner from. A generated file is PLACED when some package's build
 * configuration says it lies under that package's output root; the
 * sources it couples to are that configuration's source root.
 *
 * @param {object} input
 * @param {string[]} input.changed   repo-relative paths the range moved
 * @param {string[]} input.reached   every file the spec walk reaches
 * @param {Set<string> | undefined} input.tracked  every path git tracks,
 *   or `undefined` when that reading itself failed
 * @param {Record<string, PackageBuild[]>} input.builds  from `packageBuilds`
 * @param {Record<string, string[]>} [input.notes]  from `packageBuilds`
 * @param {Readonly<Record<string, string>>} [input.roots]  the package roots a
 *   generated file nothing places is reported against
 * @returns {GeneratedPlacement}
 */
export function generatedEntries({ changed, reached, tracked, builds, notes = {}, roots = PACKAGE_ROOTS }) {
  /** @type {Record<string, string[]>} */
  const byPackage = {};
  /** @type {Record<string, string>} */
  const via = {};
  /** @type {{ path: string, why: string }[]} */
  const unplaceable = [];
  for (const id of Object.keys(builds)) byPackage[id] = [];
  if (tracked === undefined) {
    return {
      byPath: {},
      via,
      byPackage,
      unplaceable: [
        {
          path: ".",
          why:
            "git would not list the tracked corpus, so this derivation cannot tell which files " +
            "in the import graph are generated and therefore unreachable by any changed path",
        },
      ],
    };
  }
  for (const file of reached) {
    /** @type {{ id: string, build: PackageBuild } | undefined} */
    let placed;
    for (const [id, entries] of Object.entries(builds)) {
      for (const build of entries) {
        if (file !== build.out && !file.startsWith(`${build.out}/`)) continue;
        if (placed === undefined || build.out.length > placed.build.out.length) placed = { id, build };
      }
    }
    if (placed !== undefined) {
      /** @type {string[]} */ (byPackage[placed.id]).push(file);
      via[file] =
        `${placed.build.config} builds ${placed.build.out}/ from ${placed.build.src}/`;
      continue;
    }
    if (tracked.has(file)) continue;
    const ownerId = suiteOfPath(file, roots);
    const reason =
      ownerId === undefined
        ? "it lies under no graded package root, so there is no manifest here to read a build from"
        : (notes[ownerId] ?? []).join("; ") ||
          `${ownerId}'s build declares no output root that contains it`;
    unplaceable.push({
      path: file,
      why:
        "git does not track it, so no changed path can ever be it, and no package's build " +
        `configuration says which sources produce it — ${reason}`,
    });
  }
  /** @type {Record<string, string[]>} */
  const byPath = {};
  for (const p of changed) {
    /** @type {Set<string>} */
    const hits = new Set();
    for (const [id, entries] of Object.entries(builds)) {
      for (const build of entries) {
        if (p !== build.src && !p.startsWith(`${build.src}/`)) continue;
        for (const g of byPackage[id] ?? []) hits.add(g);
      }
    }
    if (hits.size > 0) byPath[p] = [...hits].sort();
  }
  return {
    byPath,
    via,
    byPackage: Object.fromEntries(Object.entries(byPackage).map(([id, f]) => [id, f.sort()])),
    unplaceable,
  };
}

/**
 * The rule as the CLI runs it: the readings taken, then the rule. Kept
 * separate so the rule stays testable with no tree at all, and so this
 * function is the ONE place a reading happens.
 *
 * THIS ONE IS PAID FOR ON EVERY DERIVATION, unlike the docs and settings
 * scans beside it, and deliberately: its fail-closed arm is a fact about
 * the GRAPH rather than about the range, exactly as `unresolved` is, so
 * a range that moved nothing near a package's sources must still answer
 * for a generated file nothing can place. It costs one `git ls-files`
 * and a manifest and project read per graded package — no corpus walk.
 *
 * @param {string[]} changed
 * @param {Record<string, string[]>} reach  from `specReach`
 * @param {string} [root]
 * @param {Readonly<Record<string, string>>} [roots]
 * @returns {GeneratedPlacement & { builds: Record<string, PackageBuild[]> }}
 */
export function generatedSources(changed, reach, root = repoRoot, roots = PACKAGE_ROOTS) {
  /** @type {Set<string>} */
  const reached = new Set();
  for (const files of Object.values(reach)) for (const f of files) reached.add(f);
  /** @type {Set<string> | undefined} */
  let tracked;
  try {
    tracked = new Set(trackedFiles(root));
  } catch {
    tracked = undefined;
  }
  const { byPackage: builds, notes } = packageBuilds(root, roots);
  return {
    ...generatedEntries({ changed, reached: [...reached].sort(), tracked, builds, notes, roots }),
    builds,
  };
}

/**
 * @typedef {object} OwedDerivation
 * @property {string[]} suites   the graded suites this range owes, sorted.
 * @property {{ whole: boolean, specs: string[] }} e2e  the end-to-end
 *   leg's own scope: `whole` when the leg is owed by a path the import
 *   graph cannot narrow, otherwise exactly the spec files owed.
 * @property {{ path: string, suites: string[], specs: string[], why: string[] }[]} byPath
 * @property {{ path: string, why: string }[]} unplaceable
 * @property {{ path: string, why: string }[]} generatedUnplaceable  every
 *   GENERATED file in the import graph that no package's build
 *   configuration maps back onto sources (T-335). It is a fact about the
 *   graph rather than about the range, exactly as `unresolved` is.
 * @property {string | undefined} failClosed  the sentence that says WHY
 *   the whole battery is owed, or `undefined` when the set is derived.
 */

/**
 * THE RULE, AND IT IS A PURE FUNCTION OF ITS NAMED INPUTS.
 *
 * @param {object} input
 * @param {string[]} input.changed  repo-relative paths the range moved
 * @param {Record<string, string[]>} input.reach  from `specReach`
 * @param {Readonly<Record<string, string>>} [input.roots]
 * @param {Record<string, string[]>} [input.dependents]  from `packageDependents`
 * @param {Record<string, string[]>} [input.docsReadersByPath]  docs path ->
 *   the repo-relative files the DOCS GATE's reader map says read it
 * @param {string[]} [input.docsAsked]  every docs path the gate was ASKED
 *   about. A docs path missing from this list was never put to the map,
 *   and an empty reader list for it would be an unasked question wearing
 *   an answer's costume.
 * @param {Record<string, string[]>} [input.settingsReadersByPath]  runtime
 *   settings path -> the repo-relative files that read it, from
 *   `settingsReaders` (T-330)
 * @param {string[]} [input.settingsAsked]  every settings path that scan
 *   was ASKED about, and the same distinction `docsAsked` draws: an
 *   unasked question is not an answer.
 * @param {Record<string, string[]>} [input.generatedByPath]  changed source
 *   path -> the generated files a spec may reach on its behalf, from
 *   `generatedEntries` (T-335)
 * @param {Record<string, string>} [input.generatedVia]  generated file ->
 *   the configuration sentence that produces it
 * @param {{ path: string, why: string }[]} [input.generatedUnplaceable]  the
 *   generated files in the graph that no build configuration places
 * @param {string[]} [input.unresolved]  from `specReach`
 * @returns {OwedDerivation}
 */
export function deriveOwed({
  changed,
  reach,
  roots = PACKAGE_ROOTS,
  dependents = {},
  docsReadersByPath = {},
  docsAsked = [],
  settingsReadersByPath = {},
  settingsAsked = [],
  generatedByPath = {},
  generatedVia = {},
  generatedUnplaceable = [],
  unresolved = [],
}) {
  const asked = new Set(docsAsked);
  const askedSettings = new Set(settingsAsked);
  // T-271's rule, CALLED. Its `unplaceable` is deliberately not read:
  // this function's placement question is wider than that one's, and the
  // header above states the case where the two answers differ.
  const owning = owningSpecs({
    changed,
    reach,
    docsReadersByPath,
    settingsReadersByPath,
    generatedByPath,
    generatedVia,
  });
  const specsFor = new Map(owning.byPath.map((e) => [e.path, e.specs]));
  /** @type {Set<string>} */
  const suites = new Set();
  /** @type {Set<string>} */
  const specs = new Set();
  let whole = false;
  /** @type {{ path: string, suites: string[], specs: string[], why: string[] }[]} */
  const byPath = [];
  /** @type {{ path: string, why: string }[]} */
  const unplaceable = [];

  for (const p of changed) {
    /** @type {Set<string>} */
    const mine = new Set();
    /** @type {string[]} */
    const why = [];
    const ownedSpecs = specsFor.get(p) ?? [];
    let placed = false;
    /** @param {string} id @param {string} because */
    const owe = (id, because) => {
      mine.add(id);
      why.push(`${id} — ${because}`);
      for (const d of dependents[id] ?? []) {
        mine.add(d);
        why.push(`${d} — its package depends on ${id}'s through a file: specifier`);
      }
    };

    const pkg = suiteOfPath(p, roots);
    if (pkg !== undefined) {
      placed = true;
      owe(pkg, `lies under the ${roots[pkg]}/ package root, which that suite grades`);
    }
    if (ownedSpecs.length > 0) {
      placed = true;
      owe(SCOPED_SUITE, `${ownedSpecs.length} spec file(s) own it over the static import graph`);
      for (const s of ownedSpecs) specs.add(s);
    }
    if (p === "docs" || p.startsWith("docs/")) {
      if (!asked.has(p)) {
        unplaceable.push({
          path: p,
          why:
            "the DOCS GATE's reader map was never asked about it, and an unasked question is " +
            "not an answer",
        });
        continue;
      }
      const readers = docsReadersByPath[p] ?? [];
      if (readers.length === 0) {
        placed = true;
        why.push(
          "no suite — the DOCS GATE's own reader map says no code suite reads this document",
        );
      }
      let mapped = true;
      for (const r of readers) {
        const rs = suiteOfPath(r, roots);
        if (rs === undefined) {
          unplaceable.push({
            path: p,
            why:
              `the DOCS GATE says ${r} reads it, and that reader lies under no package root — ` +
              "so this derivation cannot say which suite would run it",
          });
          mapped = false;
          break;
        }
        placed = true;
        owe(rs, `the DOCS GATE says ${r} reads it, and ${r} lies under ${roots[rs]}/`);
      }
      if (!mapped) continue;
    }
    if (underSettings(p)) {
      if (!askedSettings.has(p)) {
        unplaceable.push({
          path: p,
          why:
            "the runtime settings reader map was never asked about it, and an unasked question " +
            "is not an answer",
        });
        continue;
      }
      const readers = settingsReadersByPath[p] ?? [];
      if (readers.length === 0) {
        unplaceable.push({
          path: p,
          why:
            "no tracked source file in this tree reads it, and a configuration file whose readers " +
            "this scan did not find is not a configuration file nobody reads",
        });
        continue;
      }
      let mapped = true;
      for (const r of readers) {
        const rs = suiteOfPath(r, roots);
        if (rs === undefined) {
          unplaceable.push({
            path: p,
            why:
              `${r} reads this configuration, and that reader lies under no package root — so ` +
              "this derivation cannot say which suite would run it",
          });
          mapped = false;
          break;
        }
        placed = true;
        owe(rs, `${r} reads this configuration, and ${r} lies under ${roots[rs]}/`);
      }
      if (!mapped) continue;
    }
    if (!placed) {
      unplaceable.push({
        path: p,
        why:
          "it lies under no package root, no spec reaches it through a static import, and it is " +
          "not a document the DOCS GATE maps",
      });
      continue;
    }
    // THE END-TO-END LEG IS OWED WHOLE WHENEVER IT IS OWED BY A PATH THE
    // IMPORT GRAPH NAMED NO SPEC FOR — `tools/e2e/package.json`, say, or
    // a script nothing imports. A subset chosen for a path no spec owns
    // would be a subset chosen for a different path.
    if (mine.has(SCOPED_SUITE) && ownedSpecs.length === 0) whole = true;
    for (const id of mine) suites.add(id);
    byPath.push({ path: p, suites: [...mine].sort(), specs: ownedSpecs, why });
  }

  /** @type {string | undefined} */
  let failClosed;
  if (unresolved.length > 0) {
    failClosed =
      "the static import graph has an edge it could not land on a file, so any spec subset would " +
      `be SHORT: ${unresolved.join("; ")}`;
  } else if (generatedUnplaceable.length > 0) {
    // T-335. THE SAME SHAPE AS THE EDGE ABOVE, AND FOR THE SAME REASON.
    // A generated file in the graph that no build configuration maps
    // back onto sources is an edge that lands on a file nothing can ever
    // change, so every spec reaching it is unreachable from any source
    // change and any subset would be SHORT — in a way the walk cannot
    // report, because the edge resolved perfectly well.
    failClosed =
      "the static import graph reaches a GENERATED file this derivation cannot map back to the " +
      "sources that build it, and no changed path can ever be that file, so a change under " +
      `those sources would select no spec: ${generatedUnplaceable
        .map((u) => `${u.path} (${u.why})`)
        .join("; ")}`;
  } else if (unplaceable.length > 0) {
    failClosed = `the derivation cannot place ${unplaceable
      .map((u) => `${u.path} (${u.why})`)
      .join("; ")}`;
  }
  if (failClosed !== undefined) {
    return {
      suites: [...ALL_SUITES],
      e2e: { whole: true, specs: [] },
      byPath,
      unplaceable,
      generatedUnplaceable,
      failClosed,
    };
  }
  return {
    suites: [...suites].sort(),
    e2e: { whole, specs: whole ? [] : [...specs].sort() },
    byPath,
    unplaceable,
    generatedUnplaceable,
    failClosed,
  };
}

/** The two-dot form this derivation takes, and the characters a revision
 *  may be spelled with. A range is handed to `git`, so it is validated
 *  before it goes anywhere near one. */
export const RANGE_RE = /^([0-9A-Za-z._/@^~-]{1,200})\.\.([0-9A-Za-z._/@^~-]{1,200})$/;

/**
 * The paths a range moved, with THE RANGE RULE's own pair enforced.
 *
 * TWO DOTS, AND THE LEFT ENDPOINT MUST BE AN ANCESTOR OF THE RIGHT.
 * docs/CONVENTIONS.md's RANGE RULE bans `<merge-base>..<tip>` and bans
 * `<main>..HEAD` between two DIVERGENT tips — `git diff A..B` is `git
 * diff A B`, so main's own newer work comes back reversed, and a
 * docs-only lane reads as having rewritten a crate. Both callers this
 * function has are the shape the rule permits: a push's upstream is an
 * ancestor of what is being pushed, and a lane's base is an ancestor of
 * its tip. So the ancestry is CHECKED rather than assumed, and a
 * divergence is a refusal instead of a wrong answer.
 *
 * @param {string} range
 * @param {string} [root]
 * @returns {{ paths: string[], base: string, tip: string } | { problem: string }}
 */
export function rangeChanged(range, root = repoRoot) {
  const m = RANGE_RE.exec(String(range ?? "").trim());
  if (m === null) {
    return {
      problem:
        `${JSON.stringify(range)} is not a two-dot range of two plain revisions — this ` +
        "derivation takes <base>..<tip> and hands both to git",
    };
  }
  const base = /** @type {string} */ (m[1]);
  const tip = /** @type {string} */ (m[2]);
  const ancestor = spawnSync("git", ["-C", root, "merge-base", "--is-ancestor", base, tip], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (ancestor.status !== 0) {
    return {
      problem:
        `${base} is not an ancestor of ${tip} in ${root} (git exited ` +
        `${String(ancestor.status)}), and a two-dot diff between divergent tips returns the ` +
        "OTHER side's work in reverse — docs/CONVENTIONS.md, THE RANGE RULE",
    };
  }
  const out = spawnSync("git", ["-C", root, "diff", "--name-only", base, tip, "--"], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (out.status !== 0) {
    return {
      problem: `git would not diff ${range} in ${root} (${
        String(out.stderr ?? "").trim().split("\n")[0] || `exit ${String(out.status)}`
      })`,
    };
  }
  return {
    base,
    tip,
    paths: String(out.stdout ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== ""),
  };
}

/**
 * The derivation as a caller runs it: the readings taken, then the rule,
 * then the INPUTS said out loud so the token can carry them.
 *
 * THE DOCS SCAN IS PAID FOR ONLY WHEN A DOCS PATH MOVED, exactly as in
 * `deriveOwning`: it walks the whole source corpus, and a range that
 * moved one script should not pay for it.
 *
 * @param {string} range
 * @param {string} [root]
 * @returns {(OwedDerivation & { range: string, changed: string[], inputs: Record<string, unknown> }) | { problem: string }}
 */
export function owedForRange(range, root = repoRoot) {
  const diff = rangeChanged(range, root);
  if ("problem" in diff) return diff;
  const changed = diff.paths.map((p) => normaliseChanged(p, root));
  const { reach, unresolved } = specReach(root);
  const dependents = packageDependents(root);
  /** @type {Record<string, string[]>} */
  const docsReadersByPath = {};
  /** @type {string[]} */
  let docsAsked = [];
  let readerCount = 0;
  if (changed.some((p) => p === "docs" || p.startsWith("docs/"))) {
    const readers = docsReaders(root);
    readerCount = readers.length;
    const gate = docsGate(changed, readers);
    docsAsked = gate.docsPaths;
    for (const entry of gate.byPath) docsReadersByPath[entry.path] = entry.readers;
  }
  /** @type {Record<string, string[]>} */
  const settingsReadersByPath = {};
  /** @type {string[]} */
  let settingsAsked = [];
  const settingsPaths = changed.filter((p) => underSettings(p));
  if (settingsPaths.length > 0) {
    const map = settingsReaders(settingsPaths, root);
    settingsAsked = map.asked;
    Object.assign(settingsReadersByPath, map.byPath);
  }
  // T-335. UNCONDITIONAL, unlike the two scans above: its fail-closed arm
  // is a fact about the graph rather than about the range, so a range
  // that moved nothing near a package's sources must still answer for a
  // generated file in the graph that nothing can place.
  const generated = generatedSources(changed, reach, root);
  const derived = deriveOwed({
    changed,
    reach,
    dependents,
    docsReadersByPath,
    docsAsked,
    settingsReadersByPath,
    settingsAsked,
    generatedByPath: generated.byPath,
    generatedVia: generated.via,
    generatedUnplaceable: generated.unplaceable,
    unresolved,
  });
  return {
    ...derived,
    range,
    changed,
    // THE INPUTS THE DERIVATION READ, so the token records not only the
    // answer but what it was computed over — a set nobody can re-derive
    // is a set nobody can check.
    inputs: {
      base: diff.base,
      tip: diff.tip,
      root,
      packageRoots: { ...PACKAGE_ROOTS },
      packageDependents: dependents,
      specFiles: Object.keys(reach).length,
      unresolvedImports: unresolved,
      docsReaderMapConsulted: docsAsked.length > 0,
      docsReaders: readerCount,
      docsReadersByPath,
      settingsReaderMapConsulted: settingsAsked.length > 0,
      settingsReadersByPath,
      packageBuilds: generated.builds,
      generatedEntriesReached: generated.byPackage,
      generatedByPath: generated.byPath,
      generatedUnplaceable: generated.unplaceable,
    },
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
export function owedSuites(owed) {
  const registry = /** @type {Record<string, Suite>} */ (GRADED_SUITES);
  /** @type {Suite[]} */
  const out = [];
  for (const id of Object.keys(GRADED_SUITES)) {
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
 * @param {import("../../../.claude/hooks/gate-token.mjs").OwedRecord} [owed]
 * @returns {{ written: boolean, message: string }}
 */
export function recordVerdicts(verdicts, root = repoRoot, owed = undefined) {
  try {
    const { path: tokenFile } = writeToken(root, verdicts, owed === undefined ? {} : { owed });
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

// ── CLI ──────────────────────────────────────────────────────────────

/** The one suite whose scoped form exists, and the flag that asks for it. */
export const OWNING_FLAG = "--owning";
export const SCOPED_SUITE = "e2e";

/** The range form (T-280) and the flag that asks only for its answer. */
export const RANGE_FLAG = "--range";
export const OWED_SET_FLAG = "--owed-set";

/**
 * The tree the DERIVATION reads, for a caller judging a checkout that is
 * not the one this module was loaded from — the push guard's case.
 *
 * `--tree` AND DELIBERATELY NOT `--root`, WHICH IS THIS REPOSITORY'S
 * USUAL SPELLING. `--root` means "the project root the target OPERATES
 * ON"; the `supertaskr` front hands it, and `cli.spec.ts` pins the two
 * directions to each other. This runner does not operate on the tree
 * this flag names — it reads the derivation's inputs there and still
 * runs every suite from the registry's own directories — so `--root`
 * would promise a relocation that does not happen, and would falsify
 * that pin for a flag the front cannot hand. Measured rather than
 * guessed: the first spelling was `--root`, and the battery redded that
 * body by name.
 */
export const TREE_FLAG = "--tree";

const USAGE = `gate-run.mjs — the one sanctioned way to run a graded suite (T-202)

  node tools/e2e/scripts/gate-run.mjs <suite>...   run the named suites
  node tools/e2e/scripts/gate-run.mjs --list       the registry
  node tools/e2e/scripts/gate-run.mjs --all        every graded suite
  node tools/e2e/scripts/gate-run.mjs ${SCOPED_SUITE} ${OWNING_FLAG} <changed path>...
                                                  the EXECUTOR's scoped
      reading: only the spec files that OWN those paths (T-271). The
      verifier's one run and the integrator's run before the push stay
      the full four legs, and this form's ${SCOPED_PREFIX}* verdict cannot
      mint the push token. A path the derivation cannot place is exit 2.
  node tools/e2e/scripts/gate-run.mjs ${RANGE_FLAG} <base>..<tip>
                                                  the OWED SET (T-280):
      the suites that range's own paths owe, with the end-to-end leg
      narrowed to the spec files they own. A path the derivation cannot
      place makes the owed set the whole battery, and the token says why.
  node tools/e2e/scripts/gate-run.mjs ${OWED_SET_FLAG} ${RANGE_FLAG} <base>..<tip> [${TREE_FLAG} <dir>]
                                                  the same derivation as
      JSON, running NOTHING. This is what the push guard asks, so that
      the set it requires and the set a run grades are ONE function.

suites: ${Object.keys(GRADED_SUITES).join(", ")}

Every run also writes its verdicts to ${TOKEN_REL_PATH}, keyed by the tree
they ran against; the pre-push guard reads that token (T-203).

exit: 0 every suite GREEN · 1 a suite is RED · 2 called wrong ·
      3 REFUSED — no verdict this runner would stand behind`;

/**
 * The scoped arm (T-271): `e2e --owning <changed path>…`.
 *
 * IT REFUSES BEFORE IT SPAWNS, always. Every way this can be wrong —
 * the wrong leg, an empty path list, an unresolvable import edge, a path
 * nothing owns, a derivation that came back with no spec — ends at exit
 * 2 with the reason and the sentence THE FULL LEG IS OWED, because the
 * only failure this feature may not have is grading a subset that is
 * short. It can be wrong by running too much; it must never be wrong by
 * running too little.
 *
 * @param {string[]} argv
 * @returns {number}
 */
function mainOwning(argv) {
  const at = argv.indexOf(OWNING_FLAG);
  const names = argv.slice(0, at);
  const changed = argv.slice(at + 1).filter((a) => a !== "");
  /** @param {string} why @returns {number} */
  const refuse = (why) => {
    process.stderr.write(
      `gate-run: REFUSING the scoped reading — ${why}. THE FULL ${SCOPED_SUITE} LEG IS OWED: ` +
        `run this command again with no ${OWNING_FLAG}.\n`,
    );
    return EXIT.USAGE;
  };
  if (names.length !== 1 || names[0] !== SCOPED_SUITE) {
    return refuse(
      `${OWNING_FLAG} is the ${SCOPED_SUITE} leg's form and only its own — it was given ` +
        `${names.length === 0 ? "no suite" : names.join(", ")}`,
    );
  }
  if (changed.length === 0) {
    return refuse(`${OWNING_FLAG} was given no changed paths, and a run over nothing grades nothing`);
  }
  const derived = deriveOwning(changed);
  if (derived.unresolved.length > 0) {
    return refuse(
      "the static import graph has an edge it could not land on a file, so the subset would be " +
        `SHORT: ${derived.unresolved.join("; ")}`,
    );
  }
  if (derived.generatedUnplaceable.length > 0) {
    return refuse(
      "the static import graph reaches a GENERATED file this derivation cannot map back to the " +
        "sources that build it, so a source change would select no spec and the subset would be " +
        `SHORT: ${derived.generatedUnplaceable.map((u) => `${u.path} (${u.why})`).join("; ")}`,
    );
  }
  if (derived.unplaceable.length > 0) {
    return refuse(
      `the derivation cannot place ${derived.unplaceable
        .map((u) => `${u.path} (${u.why})`)
        .join("; ")}`,
    );
  }
  if (derived.specs.length === 0) {
    return refuse("the derivation named no spec at all, and this runner never grades nothing");
  }
  for (const entry of derived.byPath) {
    process.stderr.write(`gate-run: ${entry.path} is owned by\n  ${entry.via.join("\n  ")}\n`);
  }
  const { verdict, outputPath } = runSuite(scopedSuite(derived.specs));
  const scoped = scopeVerdict(verdict, { specs: derived.specs, changed: derived.changed });
  if (outputPath) process.stderr.write(`gate-run: ${SCOPED_SUITE} output at ${outputPath}\n`);
  recordVerdicts([scoped]);
  process.stdout.write(`${formatVerdict(scoped)}\n`);
  if (scoped.verdict === "REFUSED") return EXIT.REFUSED;
  return scoped.verdict === `${SCOPED_PREFIX}GREEN` ? EXIT.GREEN : EXIT.RED;
}

/**
 * The value of a `--flag <value>` pair, or undefined.
 * @param {string[]} argv @param {string} flag @returns {string | undefined}
 */
function flagValue(argv, flag) {
  const at = argv.indexOf(flag);
  if (at < 0) return undefined;
  const next = argv[at + 1];
  return next === undefined || next.startsWith("--") ? undefined : next;
}

/**
 * The ASK arm (T-280): derive the owed set and print it as JSON, running
 * nothing at all.
 *
 * THE PUSH GUARD IS THIS ARM'S CALLER, and that is why it exists as a
 * separate spelling rather than as a flag on a run. The guard may not
 * import this module — it loads on every Bash call in a session and this
 * file walks a corpus — so it asks the same question by spawning the
 * program that owns the answer, exactly as it asks the graph and the
 * cheap checks. One function, two callers, no second copy of the rule.
 *
 * IT ALWAYS PRINTS JSON, INCLUDING WHEN IT REFUSES. A caller that had to
 * parse a refusal out of English would be a caller that fails open by
 * accident; `{ "problem": … }` at exit 2 is a machine-readable inability.
 *
 * @param {string[]} argv
 * @returns {number}
 */
function mainOwedSet(argv) {
  const range = flagValue(argv, RANGE_FLAG);
  const root = flagValue(argv, TREE_FLAG) ?? repoRoot;
  if (range === undefined) {
    process.stdout.write(
      `${JSON.stringify({ problem: `${OWED_SET_FLAG} needs ${RANGE_FLAG} <base>..<tip>` })}\n`,
    );
    return EXIT.USAGE;
  }
  const owed = owedForRange(range, root);
  process.stdout.write(`${JSON.stringify(owed, null, 2)}\n`);
  return "problem" in owed ? EXIT.USAGE : EXIT.GREEN;
}

/**
 * The RANGE arm (T-280): grade exactly the set the range owes.
 *
 * ── WHY THIS VERDICT IS MINTABLE AND `--owning`'S IS NOT ─────────────
 * The subset here is not a seat's opinion about what changed; it is a
 * function of two commit ids, and the push guard recomputes it from the
 * same two before it accepts anything. So the end-to-end leg's verdict
 * keeps the word it earned — GREEN or RED — and carries `scope=` naming
 * the spec files it graded, which is what the guard's coverage check
 * reads. A hand-typed `--owning` list has no such second reader, which
 * is exactly why it wears `SCOPED-` and can mint nothing.
 *
 * A REFUSAL IS NOT A NARROWER RUN. Every way the derivation can fail
 * lands on the whole battery with the reason recorded, never on a
 * shorter set — so this arm's failure mode is a longer run.
 *
 * @param {string[]} argv
 * @returns {number}
 */
function mainRange(argv) {
  const range = flagValue(argv, RANGE_FLAG);
  if (range === undefined) {
    process.stderr.write(`gate-run: ${RANGE_FLAG} needs a <base>..<tip> argument\n${USAGE}\n`);
    return EXIT.USAGE;
  }
  const owed = owedForRange(range);
  if ("problem" in owed) {
    process.stderr.write(
      `gate-run: the owed set for ${range} could not be derived — ${owed.problem}. ` +
        "NOTHING WAS GRADED: run the whole battery with --all.\n",
    );
    return EXIT.USAGE;
  }
  if (owed.failClosed !== undefined) {
    process.stderr.write(
      `gate-run: THE WHOLE BATTERY IS OWED — ${owed.failClosed}\n`,
    );
  }
  for (const entry of owed.byPath) {
    process.stderr.write(`gate-run: ${entry.path} owes\n  ${entry.why.join("\n  ")}\n`);
  }
  process.stderr.write(
    `gate-run: ${range} moved ${owed.changed.length} path(s) and owes ` +
      `${owed.suites.join(", ")}${
        owed.e2e.whole || owed.e2e.specs.length === 0
          ? ""
          : ` (${SCOPED_SUITE} over ${owed.e2e.specs.length} spec file(s))`
      }\n`,
  );
  /** @type {Verdict[]} */
  const verdicts = [];
  for (const suite of owedSuites(owed)) {
    const { verdict, outputPath } = runSuite(suite);
    verdicts.push(
      suite.id === SCOPED_SUITE && !owed.e2e.whole && owed.e2e.specs.length > 0
        ? { ...verdict, scope: owed.e2e.specs.join(",") }
        : verdict,
    );
    if (outputPath) process.stderr.write(`gate-run: ${suite.id} output at ${outputPath}\n`);
  }
  recordVerdicts(verdicts, repoRoot, {
    range,
    suites: owed.suites,
    e2e: owed.e2e,
    ...(owed.failClosed === undefined ? {} : { failClosed: owed.failClosed }),
    inputs: owed.inputs,
  });
  for (const v of verdicts) process.stdout.write(`${formatVerdict(v)}\n`);
  if (verdicts.some((v) => v.verdict === "REFUSED")) return EXIT.REFUSED;
  if (verdicts.some((v) => v.verdict === "RED")) return EXIT.RED;
  return EXIT.GREEN;
}

/** @param {string[]} argv @returns {number} */
function main(argv) {
  const bad = validateRegistry();
  if (bad.length > 0) {
    process.stderr.write(`gate-run: the registry itself is invalid:\n  ${bad.join("\n  ")}\n`);
    return EXIT.REFUSED;
  }
  if (argv.length === 0 || argv.includes("--help")) {
    process.stdout.write(`${USAGE}\n`);
    return argv.length === 0 ? EXIT.USAGE : EXIT.GREEN;
  }
  if (argv.includes("--list")) {
    for (const s of Object.values(GRADED_SUITES)) {
      process.stdout.write(
        `${s.id.padEnd(8)} ${s.cwd.padEnd(14)} ${s.argv.join(" ")}${s.solo ? "  [solo]" : ""}\n`,
      );
    }
    return EXIT.GREEN;
  }
  if (argv.includes(OWED_SET_FLAG)) return mainOwedSet(argv);
  if (argv.includes(RANGE_FLAG)) return mainRange(argv);
  if (argv.includes(OWNING_FLAG)) return mainOwning(argv);
  /** @type {string[]} */
  const names = argv.includes("--all") ? Object.keys(GRADED_SUITES) : argv;
  const registry = /** @type {Record<string, Suite>} */ (GRADED_SUITES);
  const unknown = names.filter((n) => registry[n] === undefined);
  if (unknown.length > 0) {
    process.stderr.write(`gate-run: unknown suite(s): ${unknown.join(", ")}\n${USAGE}\n`);
    return EXIT.USAGE;
  }
  /** @type {Verdict[]} */
  const verdicts = [];
  for (const n of names) {
    const entry = registry[n];
    if (entry === undefined) continue; // unreachable: filtered above
    const { verdict, outputPath } = runSuite(entry);
    verdicts.push(verdict);
    if (outputPath) process.stderr.write(`gate-run: ${n} output at ${outputPath}\n`);
  }
  recordVerdicts(verdicts);
  // THE VERDICT LINES ARE PRINTED LAST, so the last thing a reader sees
  // is the thing they should trust.
  for (const v of verdicts) process.stdout.write(`${formatVerdict(v)}\n`);
  if (verdicts.some((v) => v.verdict === "REFUSED")) return EXIT.REFUSED;
  if (verdicts.some((v) => v.verdict === "RED")) return EXIT.RED;
  return EXIT.GREEN;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
