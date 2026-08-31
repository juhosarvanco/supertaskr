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
 * gate.
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
 */

import { spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
 * @property {"GREEN"|"RED"|"REFUSED"} verdict
 * @property {string} reason
 */

/**
 * Render the one machine-parseable line. It is printed LAST and it
 * carries the graded command's exit code as a FIELD — so a reader never
 * has to infer it from this process's own status, and a wrapper that
 * summarises this process cannot contradict it.
 * @param {Verdict} v
 * @returns {string}
 */
export function formatVerdict(v) {
  return (
    `${VERDICT_TOKEN} suite=${v.suite} exit=${v.exit} bodies=${v.bodies} ` +
    `targets=${v.targets} ref=${v.ref} verdict=${v.verdict} reason=${v.reason}`
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
 * @param {{ status: number, count: Count, ref: string, suite: string }} r
 * @returns {Verdict}
 */
export function judge({ status, count, ref, suite }) {
  const base = { suite, exit: status, bodies: count.bodies, targets: count.targets, ref };
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

/** The advisory lock path, keyed to the repo root so two checkouts do
 *  not block each other. */
export function lockPath(root = repoRoot) {
  const key = Buffer.from(root).toString("hex").slice(-16);
  return path.join(tmpdir(), `nputer-gate-run-${key}.lock`);
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
  const ref = currentRef(root);
  /** @param {string} reason @returns {{ verdict: Verdict, output: string, outputPath: string }} */
  const refuse = (reason) => ({
    verdict: {
      suite: suite.id, exit: -1, bodies: 0, targets: 0, ref,
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
    return { verdict: judge({ status, count, ref, suite: suite.id }), output: readBack, outputPath };
  } finally {
    try {
      closeSync(fd);
    } catch {
      /* already closed on the success path */
    }
    release();
  }
}

// ── CLI ──────────────────────────────────────────────────────────────

const USAGE = `gate-run.mjs — the one sanctioned way to run a graded suite (T-202)

  node tools/e2e/scripts/gate-run.mjs <suite>...   run the named suites
  node tools/e2e/scripts/gate-run.mjs --list       the registry
  node tools/e2e/scripts/gate-run.mjs --all        every graded suite

suites: ${Object.keys(GRADED_SUITES).join(", ")}

exit: 0 every suite GREEN · 1 a suite is RED · 2 called wrong ·
      3 REFUSED — no verdict this runner would stand behind`;

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
