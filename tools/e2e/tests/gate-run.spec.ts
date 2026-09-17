import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
// THE CI SIDE OF THE SAME DERIVATION (T-294). `ci-owed.mjs` is what the
// runner runs: it turns an event into a RANGE, asks this module's own
// `--owed-set` arm about it, and turns the answer into the workflow's
// `if:` switches and its shard matrix. Its pure halves are bodied here
// rather than next door in workflow-parity.spec.ts, because what they
// are ABOUT is this derivation — the workflow's own SHAPE is that file's.
import {
  DEFAULT_SHARD_COUNT,
  SHARD_COUNT_ENV,
  askOwedSet,
  ciPlan,
  outputLines,
  owedSetArgv,
  rangeForEvent,
  BOOT_SUITES,
  shardCountFromEnv,
  shardSpecs,
  specsFromLegDir,
} from "../scripts/ci-owed.mjs";
import {
  ALL_SUITES,
  EXIT,
  GRADED_SUITES,
  OWED_SET_FLAG,
  PACKAGE_ROOTS,
  RANGE_FLAG,
  REQUIRED_VERDICT_FIELDS,
  buildConfigsIn,
  generatedEntries,
  generatedSources,
  packageBuilds,
  SCOPED_SUITE,
  TREE_FLAG,
  VERDICT_TOKEN,
  acquireSolo,
  countBodies,
  countCargo,
  countPlaywright,
  deriveOwed,
  deriveOwning,
  formatVerdict,
  importSpecifiers,
  judge,
  lockPath,
  owedForRange,
  owedSuites,
  owningSpecs,
  packageDependents,
  parseVerdict,
  rangeChanged,
  recordVerdicts,
  resolveImport,
  runSuite,
  scopeVerdict,
  scopedSuite,
  SETTINGS_DIR,
  settingsReaders,
  settingsReadersIn,
  specFiles,
  specReach,
  stripAnsi,
  suiteOfPath,
  validateRegistry,
  validateSuite,
} from "../scripts/gate-run.mjs";
import { conventionsText, docsGate, docsReaders } from "../scripts/docs-scan.mjs";
import {
  GREEN,
  REQUIRED_SUITES,
  SCOPABLE_SUITE,
  TOKEN_REL_PATH,
  TOKEN_VERSION,
  headTree,
  judgeToken,
  readToken,
} from "../../../.claude/hooks/gate-token.mjs";
import { OWED_SET_FLAGS, OWED_SET_PATH } from "../../../.claude/hooks/push-guard.mjs";

/**
 * THE BLESSED GATE-RUNNER'S POSITIVE CONTROL (T-202) — no browser.
 *
 * ── THIS FILE WAS WRITTEN BEFORE THE RUNNER PASSED IT, AND THAT IS THE
 *    WHOLE POINT ────────────────────────────────────────────────────
 * A runner that only ever reports green is this card's own subject
 * wearing this card's costume: "an exit code is a summary, and a summary
 * of nothing is indistinguishable from a summary of success." So the
 * first question this suite asks is not "does the runner pass a passing
 * suite" — it is **CAN THIS RUNNER SAY RED AT ALL**, and §POSITIVE
 * CONTROL answers it by really running a really-failing suite and
 * reading the word RED off the verdict line.
 *
 * ── THE TWO REAL SPAWNS, AND WHY THEY ARE NOT SIMULATED ─────────────
 * §POSITIVE CONTROL and §ZERO BODIES both SPAWN A REAL TEST RUNNER over
 * a real fixture, because the card asks a body to *construct* a
 * zero-body run rather than to parse a stored transcript of one. The
 * syntax-broken mutant in §ZERO BODIES is the measured instance
 * (T-167-s8): the suite exits 1 having executed nothing, and an exit
 * code calls that a kill.
 *
 * The fixture lives in the OS temp dir with a `node_modules` SYMLINK
 * back to tools/e2e — never inside the repository — because
 * tools/e2e/ is not gitignored and a crashed body must not be able to
 * leave an untracked directory in a lane's working tree.
 *
 * ── EVERYTHING ELSE IS A PURE FUNCTION OVER REAL CAPTURED TEXT ──────
 * The cargo transcripts below are not invented. They were captured at
 * 146ebb6 from a four-target scratch crate built to re-measure the
 * card's instance 4, and the two runs they come from EXITED 101 BOTH
 * WAYS — which is the reading that makes this whole file necessary.
 */

// ── REAL CAPTURED TEXT (146ebb6) ─────────────────────────────────────

/** `cargo test -q` — fail-fast. ONE target reported, and it stopped there. */
const CARGO_FAIL_FAST = `
running 2 tests
test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass \`--lib\`
`;

/** `cargo test -q --no-fail-fast` — the SAME crate, the same exit 101. */
const CARGO_NO_FAIL_FAST = `
running 2 tests
test result: FAILED. 1 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

error: test failed, to rerun pass \`--lib\`

running 2 tests
test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

running 3 tests
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

running 0 tests
test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
`;

/** A Playwright list-reporter run, captured at 146ebb6. */
const PLAYWRIGHT_GREEN = `
Running 22 tests using 1 worker

  22 passed (3.5s)
`;

// ── THE INDEPENDENT EXPECTATIONS ─────────────────────────────────────
//
// EVERY LIST BELOW IS TYPED HERE, READ OFF THE CARD, AND THE
// IMPLEMENTATION NEVER SEES IT. The separation is the whole point, and
// it is a CORRECTION: the first version of this file looped over the
// runner's OWN exported lists, so a mutation that DELETED a requirement
// deleted the body that checked it and the suite stayed 31/31 green.
//
// A COMPARISON OVER A CORPUS THAT THE MUTATION ITSELF EMPTIES REPORTS
// AGREEMENT AND MEASURES NOTHING — instance 5 of this card's own
// subject, reproduced inside the artefact built to catch it. The
// verifier found it four times: a required verdict field, a whole graded
// suite, the lock's liveness check and the document's own spelling could
// each be deleted with the suite none the wiser.
//
// THE RULE THAT COMES OUT OF IT, and it is the general one: where a body
// asserts a requirement, the requirement must be stated somewhere the
// implementation does not read. The expectation and the subject may not
// share a source.

/** Criterion 3 — "THE verdict line SHALL carry exit code, body count and
 *  ref" — plus the suite it graded and the verdict it reached, without
 *  which the token names neither its subject nor its conclusion. */
const CRITERION_3_FIELDS = ["bodies", "exit", "ref", "suite", "verdict"] as const;

/** Criterion 1 — "EVERY graded suite in docs/CONVENTIONS.md SHALL be
 *  runnable through exactly one command". These are the four that
 *  document grades: lib/parser, app, app/src-tauri and tools/e2e. */
const CRITERION_1_SUITES = ["app", "e2e", "parser", "rust"] as const;

/** How many times `needle` occurs in `haystack`. EXACTNESS NEEDS A COUNT:
 *  a containment matcher cannot tell one spelling from two, which is
 *  precisely how a competing second spelling survived. */
function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

// ── THE TEMP FIXTURE ─────────────────────────────────────────────────

/** Build a runnable Playwright fixture OUTSIDE the repository. */
function makeFixture(specSource: string): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(path.join(tmpdir(), "t202-gate-run-"));
  symlinkSync(path.join(repoRoot, "tools/e2e/node_modules"), path.join(dir, "node_modules"), "dir");
  writeFileSync(
    path.join(dir, "pw.config.mjs"),
    "export default { testDir: '.', reporter: [['list']], workers: 1, retries: 0 };\n",
  );
  writeFileSync(path.join(dir, "fixture.spec.mjs"), specSource);
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/** The fixture suite entry — the blessed runner pointed at the fixture. */
function fixtureSuite(dir: string) {
  return {
    id: "fixture",
    cwd: dir,
    sentinel: "pw.config.mjs",
    argv: [
      process.execPath,
      path.join(repoRoot, "tools/e2e/node_modules/@playwright/test/cli.js"),
      "test",
      "--config",
      path.join(dir, "pw.config.mjs"),
    ],
    family: "playwright" as const,
    solo: false,
    why: "the positive control's own fixture",
  };
}

// ── §POSITIVE CONTROL ────────────────────────────────────────────────

test("the runner reports RED for a suite that really fails, so it is not a green-only instrument", () => {
  const { dir, cleanup } = makeFixture(
    "import { test, expect } from '@playwright/test';\n" +
      "test('this body is meant to fail', () => { expect(1).toBe(2); });\n" +
      "test('this body is meant to pass', () => { expect(1).toBe(1); });\n",
  );
  try {
    const { verdict } = runSuite(fixtureSuite(dir), { root: dir });
    // THE CONTROL: the word RED, read off the verdict, not inferred.
    expect(verdict.verdict).toBe("RED");
    expect(verdict.reason).toBe("suite-reported-failure");
    // And it is RED for the RIGHT reason: bodies really ran.
    expect(verdict.exit).not.toBe(0);
    expect(verdict.bodies).toBe(2);
  } finally {
    cleanup();
  }
});

test("the runner reports GREEN for a suite that really passes, so RED is a discrimination and not a constant", () => {
  const { dir, cleanup } = makeFixture(
    "import { test, expect } from '@playwright/test';\n" +
      "test('this body passes', () => { expect(1).toBe(1); });\n",
  );
  try {
    const { verdict } = runSuite(fixtureSuite(dir), { root: dir });
    expect(verdict.verdict).toBe("GREEN");
    expect(verdict.exit).toBe(0);
    expect(verdict.bodies).toBe(1);
  } finally {
    cleanup();
  }
});

// ── §ZERO BODIES ─────────────────────────────────────────────────────

test("a syntax-broken mutant makes a real suite exit non-zero over zero bodies and the runner REFUSES it rather than calling it a kill", () => {
  // T-167-s8's measured instance, reconstructed: the mutant breaks
  // SYNTAX, so nothing is collected and nothing executes. The suite
  // exits non-zero. An exit code calls that a kill; it is not one.
  const { dir, cleanup } = makeFixture(
    "import { test, expect } from '@playwright/test';\n" +
      "test('never collected', () => { expect(1).toBe( ;\n",
  );
  try {
    const { verdict } = runSuite(fixtureSuite(dir), { root: dir });
    expect(verdict.exit).not.toBe(0); // the suite really did fail...
    expect(verdict.bodies).toBe(0); // ...over nothing at all.
    expect(verdict.verdict).toBe("REFUSED"); // so it is NOT a red kill.
    expect(verdict.reason).toBe("zero-bodies");
  } finally {
    cleanup();
  }
});

test("a zero-body run that exits ZERO is refused on the same ground as one that exits non-zero, because the defect is the emptiness and not the code", () => {
  // Instance 5 — the vacuous drill check — exits 0. Instance 2 exits 1.
  // The runner must sort them together, which is why `judge` reads the
  // body count BEFORE it reads the status.
  const empty = { bodies: 0, targets: 1, baseline: 0, sums: true, how: "nothing ran" };
  for (const status of [0, 1, 101, 254]) {
    const v = judge({ status, count: empty, ref: "146ebb6", suite: "s" });
    expect(v.verdict).toBe("REFUSED");
    expect(v.reason).toBe("zero-bodies");
  }
});

test("a cargo target that ran nothing and printed ok is counted as zero bodies and REFUSED, because the word is not the count", () => {
  // THIS BODY USED TO EXERCISE NO PRODUCT CODE — it asserted that a
  // string constant declared a hundred lines above contained a
  // substring, which cannot fail except by editing the constant.
  //
  // What is worth measuring is what the RUNNER does with such a target,
  // and it is the sharpest statement of this card: cargo itself prints
  // `test result: ok.` over `running 0 tests`. The parts agree with the
  // baseline — 0 == 0 — so `sums` is TRUE. AGREEMENT OVER NOTHING IS
  // STILL NOTHING, and only the body count separates them.
  const onlyEmpty =
    "\nrunning 0 tests\ntest result: ok. 0 passed; 0 failed; 0 ignored; " +
    "0 measured; 0 filtered out; finished in 0.00s\n";
  const c = countCargo(onlyEmpty);
  expect(c.targets).toBe(1);
  expect(c.bodies).toBe(0);
  expect(c.sums).toBe(true); // it AGREES...
  const v = judge({ status: 0, count: c, ref: "146ebb6", suite: "rust" });
  expect(v.verdict).toBe("REFUSED"); // ...and is refused anyway.
  expect(v.reason).toBe("zero-bodies");
});

// ── §THE VERDICT LINE ────────────────────────────────────────────────

test("the verdict line carries the exit code, the body count and the ref as named fields", () => {
  const line = formatVerdict({
    suite: "rust", exit: 101, bodies: 7, targets: 4,
    ref: "146ebb61f73ca56b30379e28a98ee1b85ecb4f90", verdict: "RED", reason: "suite-reported-failure",
  });
  expect(line.startsWith(`${VERDICT_TOKEN} `)).toBe(true);
  const parsed = parseVerdict(line);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) return;
  expect(parsed.value.exit).toBe("101");
  expect(parsed.value.bodies).toBe("7");
  expect(parsed.value.targets).toBe("4");
  expect(parsed.value.ref).toBe("146ebb61f73ca56b30379e28a98ee1b85ecb4f90");
});

test("the runner requires exactly the five verdict fields the card names, so a requirement cannot be deleted together with its own test", () => {
  // WITHOUT THIS BODY THE NEXT ONE IS VACUOUS. Dropping "bodies" from
  // REQUIRED_VERDICT_FIELDS used to leave the suite 31/31 green: the
  // loop below iterated the very list the mutation had just shortened.
  // Here the expectation comes from the card and the runner cannot
  // shrink to meet it.
  expect([...REQUIRED_VERDICT_FIELDS].sort()).toEqual([...CRITERION_3_FIELDS]);
});

test("a verdict line missing any required field is REFUSED by the parser, naming the field it lacks", () => {
  const full = formatVerdict({
    suite: "e2e", exit: 0, bodies: 332, targets: 1, ref: "146ebb6", verdict: "GREEN", reason: "ok",
  });
  // Delete each required field in turn. Every deletion must be refused,
  // and must NAME the field — a downstream reader (T-203) that accepted
  // a token with no `bodies` would be this card's subject one layer on.
  // THE LOOP DRIVES OFF THE CARD'S LIST, not the runner's: that is what
  // makes deleting a requirement fail here instead of passing quietly.
  for (const field of CRITERION_3_FIELDS) {
    const stripped = full
      .split(" ")
      .filter((tok) => !tok.startsWith(`${field}=`))
      .join(" ");
    const parsed = parseVerdict(stripped);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) continue;
    expect(parsed.missing).toContain(field);
    expect(parsed.reason).toContain(field);
  }
});

test("a line that does not open with the verdict token is refused rather than parsed for whatever it happens to contain", () => {
  const parsed = parseVerdict("all good, exit=0 bodies=999 ref=deadbeef verdict=GREEN");
  expect(parsed.ok).toBe(false);
  if (parsed.ok) return;
  expect(parsed.reason).toContain(VERDICT_TOKEN);
});

test("the verdict line carries the graded command's exit code as data, so no wrapper's summary can contradict it", () => {
  // The companion rule's local half: a background wrapper reported
  // "exit code 0" three times while the script's own $? held 1. The
  // runner's answer is that the code travels IN the line.
  const line = formatVerdict({
    suite: "x", exit: 1, bodies: 3, targets: 1, ref: "146ebb6", verdict: "RED", reason: "suite-reported-failure",
  });
  expect(line).toContain("exit=1");
  expect(line).toContain("verdict=RED");
});

// ── §THE CD GUARD ────────────────────────────────────────────────────

test("a suite pointed at a directory that is not its own is REFUSED, because a wrong directory answers a different question rather than failing", () => {
  // Instance 1: `npm run <gate>` at the repo root did not fail — it
  // answered npm's question ("no package.json here") and exited 254,
  // and 254 read as green through a pipe. The sentinel makes the guard
  // a proof: the directory exists, and is still the wrong one.
  const misdirected = { ...GRADED_SUITES.e2e, cwd: "." };
  const { verdict } = runSuite(misdirected, { root: repoRoot });
  expect(verdict.verdict).toBe("REFUSED");
  expect(verdict.reason).toContain("cd-guard");
  expect(verdict.reason).toContain("playwright.config.ts");
});

test("a suite pointed at a directory that does not exist at all is REFUSED with the path named", () => {
  const nowhere = { ...GRADED_SUITES.rust, cwd: "app/src-tauri-T-202-does-not-exist" };
  const { verdict } = runSuite(nowhere, { root: repoRoot });
  expect(verdict.verdict).toBe("REFUSED");
  expect(verdict.reason).toContain("cd-guard");
  expect(verdict.reason).toContain("does not exist");
});

test("the repository root really has no package.json, which is the precondition that made instance one possible", () => {
  const r = spawnSync("test", ["-f", path.join(repoRoot, "package.json")]);
  expect(r.status).not.toBe(0);
});

// ── §NO PIPE ─────────────────────────────────────────────────────────

test("a registry entry whose argv holds a shell metacharacter is REFUSED, naming the pipe as the reason", () => {
  const piped = { ...GRADED_SUITES.e2e, argv: ["npx", "playwright", "test", "|", "tail", "-1"] };
  const reasons = validateSuite(piped);
  expect(reasons.join(" ")).toContain("shell metacharacter");
  const { verdict } = runSuite(piped, { root: repoRoot });
  expect(verdict.verdict).toBe("REFUSED");
  expect(verdict.reason).toContain("invalid-registry-entry");
});

test("no graded suite in the registry can be piped, because every argv is an array of plain words", () => {
  for (const s of Object.values(GRADED_SUITES)) {
    expect(Array.isArray(s.argv)).toBe(true);
    for (const word of s.argv) expect(word).not.toMatch(/[|&;<>()$`\\"'*?\[\]{}~]/);
  }
});

test("the registry as shipped is valid, so the runner never has to choose between refusing itself and running dishonestly", () => {
  expect(validateRegistry()).toEqual([]);
});

test("the registry grades exactly the four suites the card names, so a graded suite cannot fall out of the blessed runner unnoticed", () => {
  // WITHOUT THIS BODY EVERY OTHER REGISTRY CHECK IS VACUOUS. Deleting
  // the whole `app` suite used to leave the suite 31/31 green, because
  // every body that touched the registry ITERATED the registry — and an
  // iteration over an emptied corpus passes by having nothing to check.
  // Criterion 1's first half lives or dies on this comparison.
  expect(Object.keys(GRADED_SUITES).sort()).toEqual([...CRITERION_1_SUITES]);
});

// ── §THE REDIRECT IS ONE FILE DESCRIPTOR ─────────────────────────────

test("the captured output preserves the true interleaving of stdout and stderr, because a record can span both", () => {
  // THIS BODY EXISTS BECAUSE THE DEFECT WAS REAL AND COST A BAND ITS
  // AUTHORITY. The runner first buffered the two streams separately and
  // concatenated them, which puts every stderr line after every stdout
  // line. cargo splits ONE record across both — `Running unittests
  // src/lib.rs` is progress on stderr, `finished in Xs` is the harness on
  // stdout — so health-bands.mjs reported suite/lib-seconds as UNREAD: a
  // band losing its reading because of how a runner captured, not
  // because of anything in the tree.
  const dir = mkdtempSync(path.join(tmpdir(), "t202-interleave-"));
  try {
    // The emitter goes in a FILE, not in `node -e`: an inline script is
    // dense with `;` `(` `'`, and the runner's own metacharacter guard
    // refuses an argv holding any of them. That refusal is correct — it
    // is what §NO PIPE pins — so the fixture obeys it.
    const emitter = path.join(dir, "emit.mjs");
    writeFileSync(
      emitter,
      "process.stderr.write('FIRST-on-stderr\\n');\n" +
        "process.stdout.write('SECOND-on-stdout\\n');\n" +
        "process.stderr.write('THIRD-on-stderr\\n');\n",
    );
    writeFileSync(path.join(dir, "marker"), "");
    const suite = {
      id: "interleave",
      cwd: dir,
      sentinel: "marker",
      argv: [process.execPath, emitter],
      family: "playwright" as const,
      solo: false,
      why: "pins the single-fd redirect",
    };
    const { output } = runSuite(suite, { root: dir });
    // The verdict is REFUSED (this fixture runs no bodies) — which is
    // correct, and beside the point. What is pinned is the ORDER.
    expect(output.indexOf("FIRST-on-stderr")).toBeGreaterThanOrEqual(0);
    expect(output.indexOf("FIRST-on-stderr")).toBeLessThan(output.indexOf("SECOND-on-stdout"));
    expect(output.indexOf("SECOND-on-stdout")).toBeLessThan(output.indexOf("THIRD-on-stderr"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── §CARGO: --no-fail-fast AND THE TARGET COUNT ──────────────────────

test("a cargo suite without --no-fail-fast is REFUSED, because a crate-scope count would then describe one target", () => {
  const failFast = { ...GRADED_SUITES.rust, argv: ["cargo", "test"] };
  expect(validateSuite(failFast).join(" ")).toContain("--no-fail-fast");
  expect(GRADED_SUITES.rust.argv).toContain("--no-fail-fast");
});

test("the same failing crate reports one target fail-fast and four with --no-fail-fast, while the exit code is 101 both ways", () => {
  // Instance 4, re-measured at 146ebb6. This is the card's charter in
  // one reading: the exit code is IDENTICAL across a 2-body answer and
  // a 7-body answer, so it cannot be what a reader trusts.
  const ff = countCargo(CARGO_FAIL_FAST);
  const nff = countCargo(CARGO_NO_FAIL_FAST);
  expect(ff.targets).toBe(1);
  expect(ff.bodies).toBe(2);
  expect(nff.targets).toBe(4);
  expect(nff.bodies).toBe(7);
  // Both transcripts came from runs that exited 101.
  const a = judge({ status: 101, count: ff, ref: "146ebb6", suite: "rust" });
  const b = judge({ status: 101, count: nff, ref: "146ebb6", suite: "rust" });
  expect(a.exit).toBe(b.exit);
  expect(a.bodies).not.toBe(b.bodies);
});

test("the target count travels on the verdict line beside the body count, so a fail-fast truncation is visible in the token", () => {
  const nff = countCargo(CARGO_NO_FAIL_FAST);
  const line = formatVerdict(judge({ status: 101, count: nff, ref: "146ebb6", suite: "rust" }));
  expect(line).toContain("targets=4");
  expect(line).toContain("bodies=7");
});

// ── §PARTS AND BASELINE ──────────────────────────────────────────────

test("a count whose parts do not sum to the run's own baseline is REFUSED rather than reported", () => {
  // The tool's own `running N tests` is the baseline, so this compares
  // a runner against itself and needs no landed figure to go stale.
  const tampered = CARGO_NO_FAIL_FAST.replace("running 3 tests", "running 9 tests");
  const c = countCargo(tampered);
  expect(c.sums).toBe(false);
  const v = judge({ status: 0, count: c, ref: "146ebb6", suite: "rust" });
  expect(v.verdict).toBe("REFUSED");
  expect(v.reason).toBe("parts-do-not-sum-to-baseline");
});

test("a Playwright run whose reporter never printed its opening line has no baseline and is refused rather than trusted", () => {
  const headless = PLAYWRIGHT_GREEN.replace("Running 22 tests using 1 worker", "");
  const c = countPlaywright(headless);
  expect(c.baseline).toBeNull();
  expect(c.sums).toBe(false);
  expect(judge({ status: 0, count: c, ref: "146ebb6", suite: "e2e" }).verdict).toBe("REFUSED");
});

test("a well-formed Playwright transcript counts its bodies against the reporter's own opening line", () => {
  const c = countPlaywright(PLAYWRIGHT_GREEN);
  expect(c.bodies).toBe(22);
  expect(c.baseline).toBe(22);
  expect(c.sums).toBe(true);
  expect(countBodies("playwright", PLAYWRIGHT_GREEN).bodies).toBe(22);
});

// ── §COLOUR MUST NOT MOVE A COUNT ────────────────────────────────────

test("a colour-coded transcript counts identically to a plain one, because a reporter's escapes are not part of its arithmetic", () => {
  // THIS BODY EXISTS BECAUSE THE DEFECT WAS REAL AND THIS RUNNER CAUGHT
  // IT IN ITSELF. Playwright exports FORCE_COLOR to its children, so a
  // nested run's summary arrives as "\u001B[32m  1 passed\u001B[39m".
  // The counter was anchored at ^\s*(\d+) and matched nothing, reporting
  // ZERO BODIES for a run that executed two. Had the runner trusted the
  // exit code it would have said RED and been accidentally right.
  const coloured =
    "\u001B[2mRunning 2 tests using 1 worker\u001B[22m\n\n" +
    "\u001B[31m  1 failed\u001B[39m\n" +
    "\u001B[32m  1 passed\u001B[39m\u001B[2m (2.3s)\u001B[22m\n";
  const c = countPlaywright(coloured);
  expect(c.bodies).toBe(2);
  expect(c.baseline).toBe(2);
  expect(c.sums).toBe(true);
  expect(judge({ status: 1, count: c, ref: "146ebb6", suite: "e2e" }).verdict).toBe("RED");
});

test("stripping escapes leaves ordinary bracketed text alone, so the sanitiser cannot eat a card id", () => {
  // The ESC must be named in the pattern. Dropping it leaves
  // /\[[0-9;]*[A-Za-z]/, which would eat the "[T" of "[T-202]".
  expect(stripAnsi("see [T-202] and [supertaskr-index] at 146ebb6")).toBe(
    "see [T-202] and [supertaskr-index] at 146ebb6",
  );
  expect(stripAnsi("\u001B[32mgreen\u001B[39m")).toBe("green");
});

// ── §THE SOLO GUARD ──────────────────────────────────────────────────

test("a solo suite is REFUSED while another run holds the lock, rather than queued behind it", () => {
  // T-088-s4: a bench beside a suite produced a startup_arm red that
  // cost two attributions. Waiting would turn that contention into a
  // slower green and lose the signal; refusing keeps the reading honest.
  const root = mkdtempSync(path.join(tmpdir(), "t202-solo-"));
  try {
    const first = acquireSolo("rust", root);
    expect(first.ok).toBe(true);
    // A DIFFERENT pid must be refused. Same-pid re-entry is allowed on
    // purpose: one process running two suites in sequence is not
    // contention, and refusing it would make --all unusable.
    const probe = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `import { acquireSolo } from ${JSON.stringify(path.join(repoRoot, "tools/e2e/scripts/gate-run.mjs"))};` +
          `const r = acquireSolo("e2e", ${JSON.stringify(root)});` +
          `process.stdout.write(JSON.stringify({ ok: r.ok, reason: r.reason ?? "" }));`,
      ],
      { encoding: "utf8" },
    );
    const answer = JSON.parse(probe.stdout || "{}");
    expect(answer.ok).toBe(false);
    expect(String(answer.reason)).toContain("REFUSING rather than waiting");
    if (first.ok) first.release();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a lock left behind by a dead process is reclaimed, so a crashed run cannot wedge the gate", () => {
  // THIS BODY USED TO NOT CONSTRUCT WHAT ITS NAME CLAIMS. It acquired,
  // cleanly RELEASED — deleting the file — and re-acquired, so the stale
  // branch was never entered and deleting `pidAlive` from the lock left
  // the suite 31/31 green. A crashed run would then wedge the solo gate
  // for `rust` and `e2e` permanently, and the next lane would read its
  // own refusal as a red it had caused.
  //
  // So the lock is now LEFT BEHIND, by hand, holding a pid that has
  // certainly exited: spawnSync has already reaped the child by the time
  // it returns. (Pid reuse could in principle resurrect it; the window
  // is negligible and the failure direction is a refusal, not a green.)
  const root = mkdtempSync(path.join(tmpdir(), "t202-stale-"));
  try {
    const dead = spawnSync(process.execPath, ["-e", "0"]);
    const deadPid = dead.pid;
    expect(typeof deadPid).toBe("number");
    writeFileSync(
      lockPath(root),
      JSON.stringify({ pid: deadPid, suite: "rust", at: new Date().toISOString() }),
    );
    // The holder is gone, so the gate must open...
    const reclaimed = acquireSolo("e2e", root);
    expect(reclaimed.ok).toBe(true);
    // ...and the lock must now name US, not the corpse.
    const held = JSON.parse(readFileSync(lockPath(root), "utf8"));
    expect(held.pid).toBe(process.pid);
    if (reclaimed.ok) reclaimed.release();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("two checkouts whose paths differ only BEFORE their last eight bytes get DIFFERENT lock keys, so a lane and its own verifier bench are not serialised", () => {
  // T-202-s1. The key was the last sixteen hex characters of the root
  // path — its last EIGHT BYTES — and a suffix cannot tell apart two
  // paths that agree on it. Every card id this method issues is exactly
  // eight characters, so a lane and its bench ended in the same eight
  // bytes and hashed to one key: measured at the base, both roots below
  // produced `542d3232332d7333`, and three seats in one day read the
  // resulting refusal as another checkout's lock.
  //
  // THREE PAIRS, BECAUSE "A FUNCTION OF THE WHOLE PATH" FAILS IN MORE
  // THAN ONE DIRECTION. A SUFFIX key collides on the first pair; a
  // BASENAME key survives that pair and collides on the third; neither
  // reads the whole path, and one arm each is what tells them apart.
  const lane = "/x/supertaskr-T-223-s3";
  const bench = "/x/supertaskr-V-T-223-s3";
  expect(lockPath(lane)).not.toBe(lockPath(bench));
  // ...while ONE root twice is ONE lock, or the guard above stops being
  // a guard. (Symmetric on purpose, and its control is assertion-side:
  // purity is a PRECONDITION of the two bodies above, so every code-side
  // break of it reds them too. The cross-process half is the body below.)
  expect(lockPath(lane)).toBe(lockPath(lane));
  // A parent directory is part of the path as much as a basename is:
  // two checkouts of the same NAME under different parents are two
  // checkouts, and a key reading only the last segment merges them.
  expect(lockPath("/a/supertaskr-T-223-s3")).not.toBe(lockPath("/b/supertaskr-T-223-s3"));
  // AND THE FILE ITSELF DOES NOT MOVE. Nothing at the base asserted the
  // lock's directory or its name shape, so a key change could have
  // carried the file out of tmpdir() — where `acquireSolo` and the
  // stale-reclaim body above both go looking for it — and every body
  // here would still have passed.
  expect(path.dirname(lockPath(lane))).toBe(tmpdir());
  expect(path.basename(lockPath(lane))).toMatch(/^supertaskr-gate-run-[0-9a-f]+\.lock$/);
  // AND THE KEY'S WIDTH IS FIXED, WHICH IS WHY IT IS A DIGEST AND NOT
  // THE PATH'S OWN HEX. The card offered either; the hex of the path
  // makes the basename 21 bytes plus TWICE the root, which passes
  // NAME_MAX (255 on this platform, `getconf NAME_MAX /`) at a root of
  // 118 bytes and throws ENAMETOOLONG out of `acquireSolo`. The longest
  // root reaching lockPath in this suite is 72 bytes, so that form would
  // not have failed here — but 118 bytes of checkout path is an ordinary
  // home directory two projects deep. A sha256's 64 hex characters put
  // the basename at 85 bytes for EVERY root, so the deep root below
  // fits with exactly the room the shallow one has.
  const deep = `/x/${"deep-".repeat(40)}supertaskr-T-223-s3`;
  expect(path.basename(lockPath(deep)).length).toBeLessThan(255);
});

test("one checkout's two runs reach ONE lock file however each was started, so the widened key still serialises a root against itself", () => {
  // The other half of T-202-s1, and the direction the widening could
  // break: a key that reads the whole path must still be a function of
  // the PATH ALONE. Mix in anything per-process — a pid, a nonce, the
  // directory the command was typed in — and the body above still
  // passes while the solo guard quietly OPENS, which is the worse
  // failure, because a lock that never refuses looks exactly like a
  // machine with nothing else running.
  //
  // §THE SOLO GUARD's first body cannot see that: its probe inherits
  // this process's working directory, so a cwd-keyed lock still refuses
  // there. THIS PROBE IS SPAWNED SOMEWHERE ELSE ON PURPOSE, and reports
  // the lock path it computed as well as the answer it got.
  const root = mkdtempSync(path.join(tmpdir(), "t202s1-one-root-"));
  const elsewhere = mkdtempSync(path.join(tmpdir(), "t202s1-elsewhere-"));
  // THE RELEASE IS IN THE `finally`, NOT AFTER THE ASSERTIONS, and this
  // body earned that the hard way: its own poison drills left three
  // locks behind in `tmpdir()` — a failing `expect` throws before a
  // release placed below it ever runs, and the leaked file is in the
  // MACHINE-scoped directory this whole card is about. A stale lock is
  // reclaimed rather than wedging (the body above), so it is litter and
  // not a defect; a card about lock hygiene should not produce it.
  let release = () => {};
  try {
    const held = acquireSolo("rust", root);
    expect(held.ok).toBe(true);
    if (held.ok) release = held.release;
    const probe = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `import { acquireSolo, lockPath } from ${JSON.stringify(path.join(repoRoot, "tools/e2e/scripts/gate-run.mjs"))};` +
          `const r = acquireSolo("e2e", ${JSON.stringify(root)});` +
          // A REFUSED acquire writes nothing, so this clause is dead on
          // the passing path — it exists for the mutants. When a poison
          // drill breaks the key, the probe is GRANTED a lock instead,
          // and a one-line child has no `finally` to give it back.
          `if (r.ok) r.release();` +
          `process.stdout.write(JSON.stringify({ ok: r.ok, lock: lockPath(${JSON.stringify(root)}) }));`,
      ],
      { cwd: elsewhere, encoding: "utf8" },
    );
    const answer = JSON.parse(probe.stdout || "{}");
    expect(answer.lock).toBe(lockPath(root));
    expect(answer.ok).toBe(false);
  } finally {
    release();
    rmSync(root, { recursive: true, force: true });
    rmSync(elsewhere, { recursive: true, force: true });
  }
});

// ── §THE FOUR CODES ──────────────────────────────────────────────────

test("the runner answers in this repository's four gate codes, with REFUSED distinct from both green and red", () => {
  expect(EXIT).toEqual({ GREEN: 0, RED: 1, USAGE: 2, REFUSED: 3 });
});

test("the CLI refuses an unknown suite name at the usage code rather than running nothing and exiting clean", () => {
  const cli = path.join(repoRoot, "tools/e2e/scripts/gate-run.mjs");
  const r = spawnSync(process.execPath, [cli, "no-such-suite-T-202"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  expect(r.status).toBe(EXIT.USAGE);
  expect(`${r.stderr}`).toContain("unknown suite");
});

test("the CLI called with no arguments exits at the usage code, so an empty invocation is never a clean run", () => {
  const cli = path.join(repoRoot, "tools/e2e/scripts/gate-run.mjs");
  const r = spawnSync(process.execPath, [cli], { cwd: repoRoot, encoding: "utf8" });
  expect(r.status).toBe(EXIT.USAGE);
});

test("the CLI lists every graded suite with the directory it must run in", () => {
  const cli = path.join(repoRoot, "tools/e2e/scripts/gate-run.mjs");
  const r = spawnSync(process.execPath, [cli, "--list"], { cwd: repoRoot, encoding: "utf8" });
  expect(r.status).toBe(EXIT.GREEN);
  for (const s of Object.values(GRADED_SUITES)) {
    expect(`${r.stdout}`).toContain(s.id);
    expect(`${r.stdout}`).toContain(s.cwd);
  }
});

// ── §THE DOCUMENT NAMES THE RUNNER IN EXACTLY ONE PLACE ──────────────

test("docs/CONVENTIONS.md names the blessed gate-runner in exactly one place, so one spelling is one spelling and not merely at least one", () => {
  // THE OLD NAME PROMISED EXACTNESS AND THE BODY ASSERTED CONTAINMENT.
  // Removing the command killed it, so it looked strong; ADDING a
  // competing second spelling survived, which is what proves a matcher
  // is containment. `toContain` cannot tell one spelling from two.
  //
  // AND THE NAME MATTERED BEYOND THE ASSERTION: docs/CAPABILITIES.md is
  // GENERATED from these test names, so a body claiming "the one
  // spelling" while measuring "at least one" publishes a sentence this
  // repository does not hold.
  //
  // What is exact here, and true: the RUNNER is named once. Criterion
  // 1's second half — no other suite command anywhere — is knowingly
  // unmet and routed, because workflow-parity.spec.ts derives CI's own
  // steps from the per-package bullets, so this body does not pretend to
  // measure it.
  // THE INDEX AND ITS CHAPTERS AS ONE TEXT (T-290). docs/CONVENTIONS.md
  // is the index over docs/conventions/; `conventionsText` splices the two
  // back into the document this body has always asserted about.
  const text = conventionsText(repoRoot);
  expect(occurrences(text, "gate-run.mjs")).toBe(1);
  expect(occurrences(text, VERDICT_TOKEN)).toBe(1);
});

test("the suites the document offers the runner are exactly the suites the runner grades, so the two cannot drift apart", () => {
  // A third independent source for criterion 1: the DOCUMENT's own list,
  // checked against the card's, so neither the doc nor the registry can
  // move alone.
  const text = conventionsText(repoRoot);
  // `[a-z0-9|]` and not `[a-z|]`: `e2e` carries a digit, and the narrower
  // class silently matched `parser|app|rust|e` — a partial list that
  // would have compared four names against three.
  const offered = text.match(/gate-run\.mjs\s+([a-z0-9|]+)`/);
  expect(offered).not.toBeNull();
  expect((offered?.[1] ?? "").split("|").sort()).toEqual([...CRITERION_1_SUITES]);
});

// ── §THE VERDICT TOKEN (T-203) ───────────────────────────────────────
//
// The verdict LINE above is trustworthy to whoever is reading the
// terminal and to nobody else. These bodies are about the half that a
// later, unrelated process can ask: the token this runner leaves behind,
// and whether it says enough to be worth asking.
//
// WHAT THEY DELIBERATELY DO NOT DO IS RUN THE CLI. `main` writes at this
// repository's OWN root, so a body that drove it would clobber the live
// checkout's token — half-populating it, which fails closed and is safe,
// but costs whoever ran the suite a re-run of the whole battery. So the
// bodies below drive `recordVerdicts`, which is the exact function `main`
// calls and the whole of what it does with a verdict; the single call
// site inside `main` is the one link they do not cover, and it is one
// line. That limit is stated rather than papered over.

/**
 * A throwaway git repository with one commit, for the tree key.
 *
 * `NO_BACKGROUND_MAINTENANCE` is SPREAD at every use site, not merely
 * imported (T-178, and git-fixture.spec.ts's census reds by name when it
 * is not): a `git commit` detaches a maintenance grandchild into the very
 * `.git` this fixture's teardown is about to walk.
 */
function tokenRepo(name: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), `t203-token-${name}-`));
  execFileSync("git", ["init", "-q", "-b", "main", dir], { stdio: "pipe" });
  gitIn(dir, "config", "user.email", "fixture@example.invalid");
  gitIn(dir, "config", "user.name", "T-203 fixture");
  writeFileSync(path.join(dir, "README.md"), "one\n");
  gitIn(dir, "add", "-A");
  gitIn(dir, "commit", "-qm", "one");
  return dir;
}

/** @see tokenRepo */
function gitIn(dir: string, ...args: string[]): void {
  execFileSync("git", ["-C", dir, ...NO_BACKGROUND_MAINTENANCE, ...args], { stdio: "pipe" });
}

/** Teardown that reports a race as the FIXTURE's finding, never as the
 *  body's (T-178). */
function dropRepo(dir: string): void {
  removeGitFixture(dir, "gate-run");
}

/** The token, or a throw naming why there is none. A body that silently
 *  judged `undefined` would be asserting about an absence. */
function tokenOf(repo: string) {
  const read = readToken(repo);
  if (!("token" in read)) throw new Error(`no readable token in ${repo}: ${JSON.stringify(read)}`);
  return read.token;
}

/** One suite's verdict, in the shape `runSuite` produces. */
function entryFor(suite: string, verdict: "GREEN" | "RED") {
  return {
    suite,
    exit: verdict === "GREEN" ? 0 : 1,
    bodies: verdict === "GREEN" ? 3 : 12,
    targets: 1,
    ref: "deadbee",
    verdict,
    reason: verdict === "GREEN" ? "ok" : "suite-reported-failure",
  };
}

test("the suites a push must have measured are exactly the suites this runner grades, so neither can move alone", () => {
  // THE CONSTANT IS HELD IN THE HOOK AND COMPARED HERE, which is the
  // treatment `LANE_BRANCH_RE` and `GRAPH_REL_PATH` already get: the
  // guard may not import this registry (it loads on every Bash call in a
  // session), so the two are pinned to each other by a body instead. Add
  // a graded suite without widening the required set and this reds by
  // name, rather than the guard silently accepting a token that grades
  // one suite fewer than the repository has.
  expect([...REQUIRED_SUITES].sort()).toEqual(Object.keys(GRADED_SUITES).sort());
});

test("a real run's verdict survives the round trip into the token and is judged GREEN against the tree it ran at", () => {
  const { dir, cleanup } = makeFixture(
    "import { test, expect } from '@playwright/test';\n" +
      "test('this body passes', () => { expect(1).toBe(1); });\n",
  );
  const repo = tokenRepo("roundtrip");
  try {
    // A REAL SUITE, REALLY RUN — the verdict is the runner's own, not a
    // literal this body typed, so the token's shape is checked against
    // what `runSuite` actually produces.
    //
    // `root` IS THE TOKEN REPOSITORY AND THE SUITE STILL RUNS IN `dir`
    // (T-203-s1): the fixture's `cwd` is absolute, so `runSuite` resolves
    // it the same either way, while `root` is the checkout whose ref AND
    // TREE the runner reads. Handing it `dir` — a temp directory with no
    // `.git` — made the runner read "git would not say" and the writer
    // read this repository's tree, which is the very split this card
    // closed; the body's own name says "the tree it ran at", and now one
    // checkout answers for both halves of that sentence.
    const { verdict } = runSuite(fixtureSuite(dir), { root: repo });
    expect(verdict.verdict).toBe("GREEN");

    const written = recordVerdicts([verdict], repo);
    expect(written.written, written.message).toBe(true);

    const token = tokenOf(repo);
    expect(token.version).toBe(TOKEN_VERSION);
    expect(token.suites["fixture"]?.bodies).toBe(verdict.bodies);
    expect(token.suites["fixture"]?.exit).toBe(verdict.exit);

    const tree = String(headTree(repo));
    expect(
      judgeToken({ token, tree, required: ["fixture"] }).state,
      "a token written at this tree is fresh at this tree",
    ).toBe("fresh");

    // AND IT STALES WHEN THE TREE MOVES — the same token, one commit
    // later. Without this the body above is satisfied by a judge that
    // says `fresh` to everything.
    writeFileSync(path.join(repo, "README.md"), "two\n");
    gitIn(repo, "add", "-A");
    gitIn(repo, "commit", "-qm", "two");
    expect(judgeToken({ token, tree: String(headTree(repo)), required: ["fixture"] }).state).toBe(
      "stale",
    );
  } finally {
    cleanup();
    dropRepo(repo);
  }
});

test("a RED verdict is recorded rather than dropped, so a red run is never mistaken for a run nobody made", () => {
  // THE WRITER'S OWN CHARTER. A green-only writer would leave a red run
  // looking exactly like an absent one, which is this runner's founding
  // observation ("a summary of nothing is indistinguishable from a
  // summary of success") one layer downstream.
  const repo = tokenRepo("red");
  try {
    recordVerdicts([entryFor("parser", "RED")], repo);
    const token = tokenOf(repo);
    expect(token.suites["parser"]?.verdict).toBe("RED");
    expect(token.suites["parser"]?.bodies).toBe(12);
    const judged = judgeToken({ token, tree: String(headTree(repo)), required: ["parser"] });
    expect(judged.state).toBe("red");
    expect(judged.detail).toContain("parser");
    // The control: the same suite recorded GREEN is judged fresh, so
    // `red` above is a discrimination and not a constant. `GREEN` is the
    // hook's own exported word, so a rename there reds this rather than
    // quietly turning every judgement green.
    recordVerdicts([entryFor("parser", GREEN as "GREEN")], repo);
    expect(
      judgeToken({ token: tokenOf(repo), tree: String(headTree(repo)), required: ["parser"] }).state,
    ).toBe("fresh");
  } finally {
    dropRepo(repo);
  }
});

test("a second run MERGES into the token rather than replacing it, because the battery is run in pieces", () => {
  const repo = tokenRepo("merge");
  try {
    recordVerdicts([entryFor("parser", "GREEN")], repo);
    recordVerdicts([entryFor("rust", "GREEN")], repo);
    const token = tokenOf(repo);
    expect(Object.keys(token.suites).sort()).toEqual(["parser", "rust"]);
    // A seat that ran two of the four has measured two of the four, and
    // the token says so — the guard refuses it as INCOMPLETE rather than
    // this writer pretending otherwise.
    expect(judgeToken({ token, tree: String(headTree(repo)) }).state).toBe("incomplete");
  } finally {
    dropRepo(repo);
  }
});

test("a token written where it cannot be written is said out loud and changes no verdict", () => {
  // The failure is a claim about the FILE, never about the suites. A
  // directory where the token's own path must be a file is the cheapest
  // real instance of that.
  const repo = tokenRepo("unwritable");
  try {
    mkdirSync(path.join(repo, TOKEN_REL_PATH), { recursive: true });
    const out = recordVerdicts([entryFor("parser", "GREEN")], repo);
    expect(out.written).toBe(false);
    expect(out.message).toContain("THE VERDICT TOKEN COULD NOT BE WRITTEN");
    expect(out.message).toContain("this is a claim about the file, not about the suites");
  } finally {
    dropRepo(repo);
  }
});

// ── §THE RUN THAT SPANNED A COMMIT (T-203-s1) ────────────────────────
//
// The two identifiers on a token entry used to be read at DIFFERENT
// MOMENTS: `gate-run.mjs` captured the ref before it spawned the suite,
// and `writeToken` read `HEAD^{tree}` when it wrote — after the suite had
// finished. This repository has one such token on its own record
// (`ref=300d04b` beside `tree=48d50df`, two commits apart, one run), and
// the e2e leg's duration band says the window is the ordinary shape of a
// run beside a working seat rather than a rarity.
//
// THE WINDOW IS CONSTRUCTED HERE RATHER THAN SIMULATED. The fixture's own
// test body commits into the token repository, so the commit really does
// land after `runSuite` has read the tree and before `recordVerdicts`
// writes it — which is the only arrangement that can tell the fixed
// runner from the broken one. A body that merely handed `writeToken` two
// trees would pass against both.

/**
 * One real suite run over a real git repository, with the option of a
 * real commit landing WHILE it runs.
 *
 * The caller owns the repository and must `dropRepo` it; the Playwright
 * fixture directory is cleaned here, because nothing outside needs it.
 *
 * `NO_BACKGROUND_MAINTENANCE` is threaded into the CHILD's git calls too
 * (T-178): the commit that makes this fixture interesting is exactly the
 * command that detaches a maintenance grandchild into the `.git` the
 * teardown is about to walk.
 */
function runOverRepo(
  name: string,
  commitDuringRun: boolean,
): {
  repo: string;
  startedCommit: string;
  startedTree: string;
  reachedTree: string;
  verdict: ReturnType<typeof runSuite>["verdict"];
} {
  const repo = tokenRepo(name);
  const startedCommit = execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const startedTree = String(headTree(repo));
  const during = commitDuringRun
    ? "  writeFileSync(repo + '/DURING.md', 'this landed mid-run\\n');\n" +
      "  execFileSync('git', ['-C', repo, ...maint, 'add', '-A'], { stdio: 'pipe' });\n" +
      "  execFileSync('git', ['-C', repo, ...maint, 'commit', '-qm', 'landed while the suite ran'], { stdio: 'pipe' });\n"
    : "";
  const { dir, cleanup } = makeFixture(
    "import { test, expect } from '@playwright/test';\n" +
      "import { execFileSync } from 'node:child_process';\n" +
      "import { writeFileSync } from 'node:fs';\n" +
      `const repo = ${JSON.stringify(repo)};\n` +
      `const maint = ${JSON.stringify(NO_BACKGROUND_MAINTENANCE)};\n` +
      "test('this body passes, and the commit lands while it does', () => {\n" +
      during +
      "  expect(1).toBe(1);\n" +
      "});\n",
  );
  try {
    // `root` is the REPOSITORY: the fixture's cwd is absolute, so the
    // suite runs in `dir` either way, and `root` is the checkout whose ref
    // and tree the runner reads — which is what a real run's root is.
    const { verdict } = runSuite(fixtureSuite(dir), { root: repo });
    recordVerdicts([verdict], repo);
    return { repo, startedCommit, startedTree, reachedTree: String(headTree(repo)), verdict };
  } finally {
    cleanup();
  }
}

test("a commit landing while a suite runs leaves the token keyed to the tree the suite STARTED at, so the push guard's stale refusal can see it", () => {
  const spanned = runOverRepo("spanned", true);
  const control = runOverRepo("unspanned", false);
  try {
    // THE PRECONDITION, ASSERTED: the fixture really moved HEAD, and it
    // did so while the suite was running. Without this the body below is
    // satisfied by a repository nothing happened in.
    expect(spanned.reachedTree, "the fixture must really have moved HEAD mid-run").not.toBe(
      spanned.startedTree,
    );
    // AND THE RUN WAS GREEN, which is what makes this the dangerous case
    // rather than an academic one: a red run refuses on its own.
    expect(spanned.verdict.verdict).toBe("GREEN");
    expect(spanned.verdict.tree, "the runner reads the tree BEFORE it spawns").toBe(
      spanned.startedTree,
    );

    const token = tokenOf(spanned.repo);
    const entry = token.suites["fixture"];
    expect(entry?.tree, "the token may not claim a tree the suite never saw").toBe(
      spanned.startedTree,
    );
    expect(entry?.tree).not.toBe(spanned.reachedTree);
    expect(entry?.treeAtWrite, "and it records what HEAD had reached by write time").toBe(
      spanned.reachedTree,
    );

    // THE REFUSAL THE DEFECT DEFEATED. Keyed at WRITE time the entry
    // would have carried the tree the push is about to carry and read
    // FRESH — a green for content the suite never graded.
    expect(
      judgeToken({ token, tree: spanned.reachedTree, required: ["fixture"] }).state,
      "a run that spanned a commit is stale against the tree it ended at",
    ).toBe("stale");

    // THE POSITIVE CONTROL, BUILT THE SAME WAY WITH ONE FLAG FLIPPED: the
    // identical fixture WITHOUT the mid-run commit is judged FRESH, so
    // `stale` above is a discrimination and not what this runner says to
    // everything.
    const clean = tokenOf(control.repo);
    expect(clean.suites["fixture"]?.tree).toBe(control.startedTree);
    expect(clean.suites["fixture"]?.treeAtWrite).toBe(control.startedTree);
    expect(
      judgeToken({ token: clean, tree: control.reachedTree, required: ["fixture"] }).state,
    ).toBe("fresh");
  } finally {
    dropRepo(spanned.repo);
    dropRepo(control.repo);
  }
});

test("a run that spanned a commit is refused even after the tree comes BACK, because the entry records both trees rather than a verdict about them", () => {
  // WHY BOTH TREES AND NOT JUST THE GRADED ONE. Recording the tree the
  // suite started at makes `token-stale` fire in the ordinary case — the
  // body above — and that is still not sound: a tree that moves during a
  // run and moves BACK (a reset, a revert, an amend onto the same
  // content) leaves the graded tree equal to HEAD's at push time, and a
  // guard comparing one number against one number has nothing left to
  // see. So the entry carries the tree at WRITE time as well and the
  // disagreement is refused as `token-unkeyed`, whose own words are that
  // the key does not describe what the suites ran against.
  const spanned = runOverRepo("spanned-and-back", true);
  const control = runOverRepo("unspanned-control", false);
  try {
    // THE TREE COMES BACK, by a real reset to the commit the suite
    // started at — not by editing the token.
    gitIn(spanned.repo, "reset", "--hard", "--quiet", spanned.startedCommit);
    expect(String(headTree(spanned.repo)), "the precondition: HEAD's tree is the graded one again")
      .toBe(spanned.startedTree);

    const token = tokenOf(spanned.repo);
    // STALE CANNOT FIRE HERE, and that is the whole reason this body
    // exists: the graded tree IS the tree being pushed.
    expect(token.suites["fixture"]?.tree).toBe(spanned.startedTree);
    const judged = judgeToken({ token, tree: spanned.startedTree, required: ["fixture"] });
    expect(judged.state).toBe("unkeyed");
    expect(judged.code).toBe("token-unkeyed");
    expect(judged.detail).toContain("a commit landed WHILE it ran");
    expect(judged.detail).toContain(spanned.reachedTree);

    // THE POSITIVE CONTROL: the same construction, the same kind of
    // reset, without the mid-run commit — judged FRESH. Without it
    // `unkeyed` above is equally satisfied by a judge that refuses every
    // token it is shown.
    gitIn(control.repo, "reset", "--hard", "--quiet", control.startedCommit);
    expect(
      judgeToken({ token: tokenOf(control.repo), tree: control.startedTree, required: ["fixture"] })
        .state,
    ).toBe("fresh");
  } finally {
    dropRepo(spanned.repo);
    dropRepo(control.repo);
  }
});

test("a token entry written before this field existed is refused rather than read as clean, because an unrecorded moment is not a measurement", () => {
  // THE MIGRATION CASE, DECIDED RATHER THAN LEFT TO CHANCE. A checkout
  // holding a token minted by the previous runner has entries with no
  // `treeAtWrite`, and there are only two things a reader can do with
  // that: assume the run did not span a commit, or refuse. Assuming is
  // the whole defect this card is about, one release earlier, so it
  // refuses — on the same ground as an entry with no `dirty`. The cost
  // is one battery re-run, which a push owes anyway.
  //
  // THE OLD SHAPE IS PRODUCED BY DELETING THE FIELD FROM A REAL TOKEN,
  // never by typing a token literal here: a hand-built fixture would
  // stay green if the writer stopped writing every other field too.
  const repo = tokenRepo("pre-field");
  try {
    recordVerdicts([entryFor("parser", "GREEN")], repo);
    const tree = String(headTree(repo));
    const file = path.join(repo, TOKEN_REL_PATH);
    // THE POSITIVE CONTROL FIRST: as written, this token is FRESH. The
    // refusal below is therefore about the missing field and not about
    // anything else the fixture happens to be.
    expect(judgeToken({ token: tokenOf(repo), tree, required: ["parser"] }).state).toBe("fresh");

    const raw = JSON.parse(readFileSync(file, "utf8"));
    expect(raw.suites.parser.treeAtWrite, "the writer really records it").toBe(tree);
    delete raw.suites.parser.treeAtWrite;
    writeFileSync(file, `${JSON.stringify(raw, null, 2)}\n`);

    const judged = judgeToken({ token: tokenOf(repo), tree, required: ["parser"] });
    expect(judged.state).toBe("unkeyed");
    expect(judged.code).toBe("token-unkeyed");
    expect(judged.detail).toContain("did not record the tree HEAD had reached");
  } finally {
    dropRepo(repo);
  }
});

test("a REFUSED verdict carries the tree and the dirt read BEFORE the spawn, because the card's own specimen was a refusal keyed to a later tree", () => {
  // T-203-s1's verdict, correction 1: `runSuite`'s refuse() closure carries
  // the pre-spawn readings and nothing held it — with `tree, dirty` stripped
  // from the closure every other body stayed green, and the card's own
  // specimen (`exit: -1, bodies: 0, REFUSED, ref=300d04b, tree=48d50df`)
  // came from exactly that path. The cd guard refuses before anything
  // spawns, so the arrangement costs no suite.
  const repo = tokenRepo("refused");
  try {
    const startedTree = String(headTree(repo));
    const suite = { ...fixtureSuite(repo), sentinel: "no-such-sentinel.mjs" };
    const clean = runSuite(suite, { root: repo }).verdict;
    expect(clean.verdict).toBe("REFUSED");
    expect(clean.reason, "the cd guard is what refused, before any spawn").toContain("cd-guard");
    expect(clean.tree, "a refusal still names the tree read before the spawn").toBe(startedTree);
    expect(clean.dirty, "and the dirt read before the spawn").toBe(false);
    // AND THE ENTRY THE WRITER MINTS FROM IT carries the same readings —
    // the shape the card's specimen wore, now keyed to the run's own tree.
    recordVerdicts([clean], repo);
    const entry = tokenOf(repo).suites["fixture"];
    expect(entry?.tree, "the entry is keyed to the tree the refusal read").toBe(startedTree);
    expect(entry?.dirty).toBe(false);
    // THE OTHER ARM: the same refusal over a dirty tree says so.
    writeFileSync(path.join(repo, "README.md"), "two\n");
    const dirty = runSuite(suite, { root: repo }).verdict;
    expect(dirty.verdict).toBe("REFUSED");
    expect(dirty.tree).toBe(startedTree);
    expect(dirty.dirty, "a refusal over a dirty tree carries the dirt").toBe(true);
  } finally {
    dropRepo(repo);
  }
});

test("a tree dirty when the suite STARTS and clean when the token is written keeps its dirt in the entry, so the judgement is unkeyed rather than a clean read", () => {
  // T-203-s1's verdict, correction 2: `writeToken`'s early/late OR
  // (`dirty: v.dirty === true ? true : batchDirty`) is the whole widening
  // and nothing held it — reduced to the late reading alone, every other
  // body stayed green. The one arrangement only the early reading can see:
  // dirt when the run starts, gone by the time the token is written.
  const repo = tokenRepo("dirty-then-clean");
  try {
    writeFileSync(path.join(repo, "README.md"), "two\n");
    const { dir, cleanup } = makeFixture(
      "import { test, expect } from '@playwright/test';\n" +
        "import { execFileSync } from 'node:child_process';\n" +
        `const repo = ${JSON.stringify(repo)};\n` +
        `const maint = ${JSON.stringify(NO_BACKGROUND_MAINTENANCE)};\n` +
        "test('this body passes, and it cleans the tree while it runs', () => {\n" +
        "  execFileSync('git', ['-C', repo, ...maint, 'checkout', '--', 'README.md'], { stdio: 'pipe' });\n" +
        "  expect(1).toBe(1);\n" +
        "});\n",
    );
    try {
      const { verdict } = runSuite(fixtureSuite(dir), { root: repo });
      expect(verdict.verdict).toBe("GREEN");
      expect(verdict.dirty, "the runner read the dirt before the spawn").toBe(true);
      expect(
        execFileSync("git", ["-C", repo, "status", "--porcelain"], { encoding: "utf8" }).trim(),
        "the fixture really cleaned the tree while it ran",
      ).toBe("");
      recordVerdicts([verdict], repo);
      const token = tokenOf(repo);
      expect(token.suites["fixture"]?.dirty, "the entry keeps the dirt the run started with").toBe(true);
      const judged = judgeToken({ token, tree: String(headTree(repo)), required: ["fixture"] });
      expect(judged.state, "a run that started dirty is unkeyed, never read as clean").toBe("unkeyed");
      expect(judged.code).toBe("token-unkeyed");
    } finally {
      cleanup();
    }
  } finally {
    dropRepo(repo);
  }
});

// ── §THE SCOPED READING (T-271) ──────────────────────────────────────
//
// The executor may grade NARROWER than a leg while it iterates: the spec
// files that OWN a changed path, and nothing else. Everything below is a
// positive control for one of two directions.
//
//   THE SUBSET MUST REALLY BE A SUBSET — otherwise the feature saves
//   nothing, and the §POSITIVE CONTROL argument at the top of this file
//   applies unchanged: a scoped run that quietly ran the whole leg would
//   be indistinguishable from one that worked.
//
//   AND IT MUST NEVER BE SHORT. That is the direction that costs
//   something, so every way the derivation can fail to place a path ends
//   at a REFUSAL naming it, and every one of those refusals has a body.
//
// THE EXPECTATIONS BELOW ARE TYPED HERE AND THE IMPLEMENTATION NEVER
// SEES THEM, for the reason the §THE INDEPENDENT EXPECTATIONS block
// gives: a comparison over a corpus the mutation itself empties reports
// agreement and measures nothing.

/** Criterion 3 — the two words a subset verdict may wear, read off the
 *  card. Neither is `GREEN`, which is the whole of why `judgeToken`
 *  refuses one: that function accepts exactly the one string. */
const CRITERION_3_SCOPED_GREEN = "SCOPED-GREEN";
const CRITERION_3_SCOPED_RED = "SCOPED-RED";

/** Criterion 4 — the sentence a refused scoped run must print, so a seat
 *  that meets one is told what to do rather than only what went wrong. */
const CRITERION_4_SENTENCE = "THE FULL e2e LEG IS OWED";

/** The pristine subject: a module whose one exported figure its owning
 *  spec asserts. `41` is the pristine hook; the planted defect moves it. */
const PRISTINE_SUBJECT = "export const ANSWER = 41;\n";

/**
 * A REPOSITORY-SHAPED fixture for the scoped reading.
 *
 * It holds the two directories the derivation walks and THREE files that
 * make the two halves of the claim measurable at once:
 *
 *   scripts/subject.mjs      the changed path.
 *   tests/owner.spec.ts      IMPORTS it, and passes while it is pristine.
 *   tests/subject.spec.ts    SHARES ITS STEM, imports nothing of it, and
 *                            its one body ALWAYS FAILS.
 *
 * That third file is the discriminator this card needs and a name-based
 * derivation could not survive: matching stems would grade it, and it
 * fails, so "derived from imports, never from the name" is a difference
 * a run can see rather than a claim in a comment.
 */
function makeOwningFixture(): { root: string; subject: string; cleanup: () => void } {
  const root = mkdtempSync(path.join(tmpdir(), "t271-owning-"));
  const e2e = path.join(root, "tools", "e2e");
  mkdirSync(path.join(e2e, "tests"), { recursive: true });
  mkdirSync(path.join(e2e, "scripts"), { recursive: true });
  symlinkSync(path.join(repoRoot, "tools/e2e/node_modules"), path.join(e2e, "node_modules"), "dir");
  writeFileSync(
    path.join(e2e, "pw.config.mjs"),
    "export default { testDir: './tests', reporter: [['list']], workers: 1, retries: 0 };\n",
  );
  const subject = path.join(e2e, "scripts", "subject.mjs");
  writeFileSync(subject, PRISTINE_SUBJECT);
  writeFileSync(
    path.join(e2e, "tests", "owner.spec.ts"),
    "import { test, expect } from '@playwright/test';\n" +
      "import { ANSWER } from '../scripts/subject.mjs';\n" +
      "test('the subject answers what its owner expects', () => { expect(ANSWER).toBe(41); });\n",
  );
  writeFileSync(
    path.join(e2e, "tests", "subject.spec.ts"),
    "import { test, expect } from '@playwright/test';\n" +
      "test('the stranger that shares the stem, and always fails', () => { expect(1).toBe(2); });\n",
  );
  return { root, subject, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

/** The fixture's leg — the blessed runner pointed at the fixture's own
 *  tools/e2e, so `scopedSuite` strips the same prefix it strips for real. */
function owningLeg(root: string) {
  return {
    id: "fixture",
    cwd: "tools/e2e",
    sentinel: "pw.config.mjs",
    argv: [
      process.execPath,
      path.join(repoRoot, "tools/e2e/node_modules/@playwright/test/cli.js"),
      "test",
      "--config",
      path.join(root, "tools", "e2e", "pw.config.mjs"),
    ],
    family: "playwright" as const,
    solo: false,
    why: "the scoped reading's own fixture",
  };
}

test("the scoped run is RED on a planted defect in the owning spec's subject and GREEN on the pristine hook", () => {
  // THE CARD'S OWN CRITERION 6, AND IT IS THE §POSITIVE CONTROL ARGUMENT
  // ONE LAYER IN: the first question is not "does a scoped run pass a
  // passing subset" — it is CAN A SCOPED RUN SAY RED AT ALL. Both arms
  // spawn a real runner over the same fixture and the only thing that
  // moves between them is one character of the SUBJECT.
  const { root, subject, cleanup } = makeOwningFixture();
  try {
    const derived = deriveOwning(["tools/e2e/scripts/subject.mjs"], root);
    expect(derived.unplaceable, "the fixture's change is placeable").toEqual([]);
    expect(derived.specs).toEqual(["tools/e2e/tests/owner.spec.ts"]);
    const scope = { specs: derived.specs, changed: derived.changed };

    // THE PRISTINE HOOK.
    const green = scopeVerdict(
      runSuite(scopedSuite(derived.specs, owningLeg(root)), { root }).verdict,
      scope,
    );
    expect(green.verdict).toBe(CRITERION_3_SCOPED_GREEN);
    expect(green.exit, "the graded command's own status, as data").toBe(0);
    expect(green.bodies, "one body, because one spec owns the change").toBe(1);

    // THE PLANTED DEFECT, IN THE SUBJECT — the module the owning spec
    // grades, and not in the spec itself: a defect planted in a body
    // would prove only that a failing body fails.
    writeFileSync(subject, PRISTINE_SUBJECT.replace("41", "42"));
    const red = scopeVerdict(
      runSuite(scopedSuite(derived.specs, owningLeg(root)), { root }).verdict,
      scope,
    );
    expect(red.verdict).toBe(CRITERION_3_SCOPED_RED);
    expect(red.exit, "the suite really failed").not.toBe(0);
    expect(red.bodies, "and it failed having RUN something").toBe(1);

    // AND THE HOOK IS RESTORED AND GREEN AGAIN, so the red above is the
    // defect's and not the fixture's.
    writeFileSync(subject, PRISTINE_SUBJECT);
    expect(
      scopeVerdict(runSuite(scopedSuite(derived.specs, owningLeg(root)), { root }).verdict, scope)
        .verdict,
    ).toBe(CRITERION_3_SCOPED_GREEN);
  } finally {
    cleanup();
  }
});

test("the scoped run grades ONLY the owning spec, and a spec that merely shares the changed file's name is not one", () => {
  // NOT VACUOUS, AND THE FIXTURE IS BUILT SO THAT IT CANNOT BE: the spec
  // the derivation excludes has a body that always fails, so a run that
  // reached it could not report green. The whole leg over the same tree
  // is RED with two bodies; the scoped reading is GREEN with one.
  const { root, cleanup } = makeOwningFixture();
  try {
    const derived = deriveOwning(["tools/e2e/scripts/subject.mjs"], root);
    expect(derived.specs).toEqual(["tools/e2e/tests/owner.spec.ts"]);
    expect(
      derived.specs,
      "the stem-sharing stranger is NOT owed — the graph is what owns, not the name",
    ).not.toContain("tools/e2e/tests/subject.spec.ts");

    const whole = runSuite(owningLeg(root), { root }).verdict;
    expect(whole.verdict, "the whole leg really reaches the stranger").toBe("RED");
    expect(whole.bodies).toBe(2);

    const scoped = runSuite(scopedSuite(derived.specs, owningLeg(root)), { root }).verdict;
    expect(scoped.verdict, "and the subset really does not").toBe("GREEN");
    expect(scoped.bodies).toBe(1);
  } finally {
    cleanup();
  }
});

test("the push guard refuses a scoped verdict as the token, so a lane's subset run can never mint one", () => {
  // THE CARD'S CRITERION 3. The control comes FIRST and it must PASS:
  // four whole-leg greens against this tree ARE a token this guard
  // accepts, so the refusal that follows is a discrimination rather than
  // a constant — and the only thing that changes between them is one
  // suite's verdict WORD.
  const repo = tokenRepo("scoped");
  try {
    const tree = String(headTree(repo));
    for (const s of REQUIRED_SUITES) recordVerdicts([entryFor(s, "GREEN")], repo);
    expect(judgeToken({ token: tokenOf(repo), tree }).state, "the control is a token").toBe("fresh");

    const scoped = scopeVerdict(
      { ...entryFor("e2e", "GREEN"), targets: 1, verdict: "GREEN" as const },
      { specs: ["tools/e2e/tests/gate-run.spec.ts"], changed: ["tools/e2e/scripts/gate-run.mjs"] },
    );
    expect(scoped.verdict, "the word the card names").toBe(CRITERION_3_SCOPED_GREEN);
    recordVerdicts([scoped], repo);
    expect(
      tokenOf(repo).suites["e2e"]?.verdict,
      "the subset run really overwrote the leg's own entry",
    ).toBe(CRITERION_3_SCOPED_GREEN);

    const judged = judgeToken({ token: tokenOf(repo), tree });
    expect(judged.state, "a scoped entry is not GREEN and this token is no longer one").not.toBe(
      "fresh",
    );
    expect(judged.detail).toContain(CRITERION_3_SCOPED_GREEN);
    // AND THE SAME HOLDS FOR THE RED WORD, which is the arm a seat meets
    // when its scoped run actually failed.
    recordVerdicts(
      [
        scopeVerdict(
          { ...entryFor("e2e", "RED"), targets: 1, verdict: "RED" as const },
          { specs: ["tools/e2e/tests/gate-run.spec.ts"], changed: ["tools/e2e/scripts/gate-run.mjs"] },
        ),
      ],
      repo,
    );
    expect(judgeToken({ token: tokenOf(repo), tree }).state).not.toBe("fresh");
    expect(judgeToken({ token: tokenOf(repo), tree }).detail).toContain(CRITERION_3_SCOPED_RED);
  } finally {
    dropRepo(repo);
  }
});

test("a changed path the derivation cannot place REFUSES the scoped run at the usage code, naming the path and saying the full leg is owed", () => {
  // THE CARD'S CRITERION 4, driven through the CLI because that is where
  // a seat meets it. It refuses BEFORE it spawns anything and before it
  // writes a token, which is why this body may drive `main` at all where
  // the §THE VERDICT TOKEN bodies deliberately may not.
  const cli = path.join(repoRoot, "tools/e2e/scripts/gate-run.mjs");
  const unplaceable = "app/src/main.tsx";
  const r = spawnSync(process.execPath, [cli, "e2e", "--owning", unplaceable], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  expect(r.status).toBe(EXIT.USAGE);
  expect(`${r.stderr}`, "the refusal names the path it could not place").toContain(unplaceable);
  expect(`${r.stderr}`, "and says what is owed instead").toContain(CRITERION_4_SENTENCE);
  // NOT VACUOUS: the same runner places this lane's own change without a
  // murmur, so the refusal above is about the PATH and not about the flag.
  expect(deriveOwning([unplaceable]).unplaceable.length).toBe(1);
  expect(deriveOwning(["tools/e2e/scripts/gate-run.mjs"]).unplaceable).toEqual([]);
});

test("the scoped form belongs to the e2e leg alone, and an empty path list is refused rather than graded as nothing", () => {
  const cli = path.join(repoRoot, "tools/e2e/scripts/gate-run.mjs");
  const wrongLeg = spawnSync(process.execPath, [cli, "parser", "--owning", "lib/parser/src/fence.ts"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  expect(wrongLeg.status).toBe(EXIT.USAGE);
  expect(`${wrongLeg.stderr}`).toContain(CRITERION_4_SENTENCE);
  const empty = spawnSync(process.execPath, [cli, "e2e", "--owning"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  expect(empty.status).toBe(EXIT.USAGE);
  expect(`${empty.stderr}`, "a run over nothing grades nothing").toContain("no changed paths");
});

test("the scoped verdict line names the subset beside its body count, and a whole-leg line still carries no scope at all", () => {
  // Criterion 1's last clause — "never the leg's name alone" — as a
  // difference between two rendered lines rather than as a claim.
  const count = countPlaywright(PLAYWRIGHT_GREEN);
  const whole = judge({ status: 0, count, ref: "146ebb6", suite: "e2e" });
  const scoped = scopeVerdict(whole, {
    specs: ["tools/e2e/tests/gate-run.spec.ts"],
    changed: ["tools/e2e/scripts/gate-run.mjs"],
  });
  const wholeLine = formatVerdict(whole);
  const scopedLine = formatVerdict(scoped);
  expect(wholeLine, "a whole leg carries no scope field").not.toContain("scope=");
  expect(scopedLine).toContain("scope=tools/e2e/tests/gate-run.spec.ts");
  expect(scopedLine).toContain(`bodies=${count.bodies}`);
  // AND IT IS STILL A VERDICT LINE: every required field parses, so the
  // scoped form cannot smuggle a token past the parser's own refusal.
  const parsed = parseVerdict(scopedLine);
  expect(parsed.ok).toBe(true);
  if (parsed.ok) {
    for (const f of REQUIRED_VERDICT_FIELDS) expect(parsed.value[f]).toBeTruthy();
    expect(parsed.value["verdict"]).toBe(CRITERION_3_SCOPED_GREEN);
    expect(parsed.value["suite"]).toBe("e2e");
  }
});

test("a docs path is placed by the DOCS GATE's own reader map, composed with the import graph rather than re-derived", () => {
  // The rule, over a graph typed here: a docs path whose reader is a
  // SCRIPT is owned by the spec that imports that script. Nothing in this
  // body touches the tree, so it measures the rule and not the day.
  const reach = {
    "tools/e2e/tests/a.spec.ts": ["tools/e2e/tests/a.spec.ts", "tools/e2e/scripts/reads-docs.mjs"],
    "tools/e2e/tests/b.spec.ts": ["tools/e2e/tests/b.spec.ts"],
  };
  const placed = owningSpecs({
    changed: ["docs/CONVENTIONS.md"],
    reach,
    docsReadersByPath: { "docs/CONVENTIONS.md": ["tools/e2e/scripts/reads-docs.mjs"] },
  });
  expect(placed.specs).toEqual(["tools/e2e/tests/a.spec.ts"]);
  // AND WITHOUT THE MAP THE SAME PATH IS UNPLACEABLE, never silently
  // ungraded: the docs arm is load-bearing, and its absence is a refusal.
  const unmapped = owningSpecs({ changed: ["docs/CONVENTIONS.md"], reach });
  expect(unmapped.specs).toEqual([]);
  expect(unmapped.unplaceable.map((u) => u.path)).toEqual(["docs/CONVENTIONS.md"]);
});

test("the live reader map really places this document, and the subset it owes is smaller than the leg", () => {
  // The integration half of the body above, at this checkout's own ref.
  // docs/CONVENTIONS.md is read by a script (`cli.mjs`) as well as by
  // bodies, so it exercises the composition and not only the direct arm.
  const derived = deriveOwning(["docs/CONVENTIONS.md"]);
  expect(derived.unplaceable).toEqual([]);
  expect(derived.specs).toContain("tools/e2e/tests/docs-input-gate.spec.ts");
  expect(derived.specs).toContain("tools/e2e/tests/cli.spec.ts");
  expect(derived.specs.length, "a subset, and a proper one").toBeLessThan(specFiles().length);
  // This lane's own change, the narrowest case there is.
  const mine = deriveOwning(["tools/e2e/scripts/gate-run.mjs"]);
  expect(mine.specs).toContain("tools/e2e/tests/gate-run.spec.ts");
  expect(mine.specs.length).toBeLessThan(specFiles().length);
});

test("every relative import in this lane's own tree resolves, because a dropped edge would make a subset SHORT", () => {
  expect(specReach().unresolved).toEqual([]);
  // NOT VACUOUS, both ways: a specifier that lands nowhere is reported,
  // and a package specifier is external rather than a hole.
  expect(resolveImport("tools/e2e/tests/x.spec.ts", "./nope-T-271", () => false).kind).toBe(
    "unresolved",
  );
  expect(resolveImport("tools/e2e/tests/x.spec.ts", "@playwright/test", () => false).kind).toBe(
    "external",
  );
  expect(
    resolveImport("tools/e2e/tests/x.spec.ts", "../scripts/y.mjs", (rel) => rel === "tools/e2e/scripts/y.mjs"),
  ).toEqual({ kind: "resolved", rel: "tools/e2e/scripts/y.mjs" });
  // The extensionless TypeScript form this tree writes for `../preflight`.
  expect(
    resolveImport("tools/e2e/tests/x.spec.ts", "../preflight", (rel) => rel === "tools/e2e/preflight.ts"),
  ).toEqual({ kind: "resolved", rel: "tools/e2e/preflight.ts" });
});

// ── THE FRESH RUNNER'S OWN TREE (T-331) ──────────────────────────────
//
// THE BODY ABOVE IS TRUE OF A PREPARED TREE AND WAS READ AS TRUE OF
// EVERY TREE. `specReach().unresolved` is empty here because this
// checkout has run `npm run build` in lib/parser; CI's planning job had
// not, and two specs import `lib/parser/dist/pure.js`, so on the runner
// the same reading named two unresolved edges and the derivation fell
// back to all four suites and all 42 specs — correctly, for a reason
// about the runner rather than about the range.
//
// WHAT IS BUILT HERE is the same tree with exactly those generated
// files WITHHELD, and then with them restored. The two arms are each
// other's control: the first shows the fail-closed answer still fires
// and still names its input, and the second shows that restoring the
// preparation's product — and nothing else — brings the answer back to
// the one this checkout gives, suite for suite and spec for spec.

/** The range the card was written from: the push of one amended card on
 *  2026-09-15, whose planning job answered the whole battery while this
 *  checkout answered three suites and twelve specs. Two commits on
 *  main, named as hashes because "the last push" is a different pair
 *  for every reader and a different one an hour later. */
const T331_RANGE = "e1a0c98d..2cad6497";

/**
 * A tree identical to this checkout except that the named files are
 * ABSENT — mirrored directories along their paths, symlinks for
 * everything else.
 *
 * WHY THIS IS THE FRESH RUNNER AND NOT AN APPROXIMATION OF ONE, for
 * this derivation's purposes: the walk asks `statSync` whether a
 * repo-relative path is a file and `readFileSync` for its bytes, so two
 * trees that answer both questions alike ARE the same tree to it. A
 * fresh checkout differs from this one by exactly the untracked files,
 * and the caller passes the untracked files the walk actually reaches —
 * derived from `git ls-files`, never listed.
 *
 * A directory left empty by the withholding reads the same as a
 * directory that was never created: `statSync` on a path inside either
 * throws, which is the only question asked of it.
 */
function treeWithout(withheld: string[], root: string = repoRoot): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(path.join(tmpdir(), "t331-fresh-"));
  // Every directory that has to be REAL, because something under it is
  // withheld: each withheld file's ancestors, repo-relative.
  const mirrored = new Set<string>();
  for (const file of withheld) {
    const parts = file.split("/");
    for (let i = 1; i < parts.length; i += 1) mirrored.add(parts.slice(0, i).join("/"));
  }
  const withheldSet = new Set(withheld);
  const walk = (rel: string): void => {
    const from = rel === "" ? root : path.join(root, rel);
    for (const entry of readdirSync(from)) {
      const childRel = rel === "" ? entry : `${rel}/${entry}`;
      if (withheldSet.has(childRel)) continue;
      const target = path.join(dir, childRel);
      if (mirrored.has(childRel)) {
        mkdirSync(target, { recursive: true });
        walk(childRel);
      } else {
        symlinkSync(path.join(from, entry), target);
      }
    }
  };
  mkdirSync(path.join(dir, "."), { recursive: true });
  walk("");
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/**
 * Every file the owed-set walk reaches that `git` does not track — the
 * generated inputs a fresh checkout would not carry. Derived by the
 * same reading the derivation itself takes.
 */
function generatedInputsReached(root: string = repoRoot): string[] {
  const { reach } = specReach(root);
  const reached = new Set<string>();
  for (const files of Object.values(reach)) for (const f of files) reached.add(f);
  const tracked = new Set(
    execFileSync("git", ["-C", root, "ls-files", "-z"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    })
      .split("\0")
      .filter((s) => s !== ""),
  );
  return [...reached].filter((f) => !tracked.has(f)).sort();
}

test("a fresh runner's tree answers the WHOLE battery for a range this checkout narrows, and the difference is exactly the generated files the walk reaches", () => {
  // THE INTEGRATION CHECKOUT'S OWN ANSWER, taken through the arm CI
  // spawns and the push guard re-derives — not a re-composition of it.
  const live = owedForRange(T331_RANGE, repoRoot);
  expect("problem" in live, `${T331_RANGE} must be a range this checkout can diff`).toBe(false);
  const here = live as Exclude<typeof live, { problem: string }>;
  expect(here.failClosed, "this checkout derives the range rather than falling back").toBeUndefined();

  // NON-VACUOUS BEFORE IT IS PARITY: a range the derivation answers with
  // the whole battery anyway would make the comparison below true of
  // nothing. This one is the card's own — three suites of four, and a
  // proper subset of the leg.
  expect(here.suites.length, "a proper subset of the battery").toBeLessThan(ALL_SUITES.length);
  expect(here.e2e.whole, "and the leg is narrowed").toBe(false);
  expect(here.e2e.specs.length).toBeGreaterThan(0);
  expect(here.e2e.specs.length, "to fewer specs than the leg has").toBeLessThan(specFiles().length);

  const generated = generatedInputsReached();
  expect(
    generated.length,
    "the walk reaches files a fresh checkout does not carry — an empty set makes both " +
      "arms below the same arm",
  ).toBeGreaterThan(0);

  // THE DOCS READER MAP IS TAKEN ONCE, AND THAT IS NOT A SHORTCUT.
  // `docsReaders` scans `sourceCorpus`, which is `git ls-files` filtered
  // — the TRACKED corpus. A generated file is by construction not in
  // it, so withholding one cannot move this map, and a second scan
  // would be three seconds spent proving that a file git never listed
  // is still not listed.
  const readers = docsReaders(repoRoot);
  const gate = docsGate(here.changed, readers);
  const docsReadersByPath: Record<string, string[]> = {};
  for (const entry of gate.byPath) docsReadersByPath[entry.path] = entry.readers;
  const armAt = (root: string) => {
    const { reach, unresolved } = specReach(root);
    return {
      unresolved,
      owed: deriveOwed({
        changed: here.changed,
        reach,
        unresolved,
        dependents: packageDependents(root),
        docsReadersByPath,
        docsAsked: gate.docsPaths,
      }),
    };
  };

  const fresh = treeWithout(generated);
  try {
    // ARM ONE — THE RUNNER AS IT STOOD. The edges land nowhere, the
    // answer is the whole battery, and it NAMES the input it could not
    // resolve rather than reporting a short set or a bare refusal.
    const before = armAt(fresh.dir);
    expect(
      before.unresolved.length,
      "the withheld files are reached through relative imports, so the walk reports them",
    ).toBeGreaterThan(0);
    expect(before.owed.failClosed ?? "", "criterion 2: the fallback still fires").toContain(
      "the static import graph has an edge it could not land on a file",
    );
    for (const edge of before.unresolved) {
      expect(
        before.owed.failClosed ?? "",
        "criterion 2: and it NAMES the input, so a seat can act on the sentence",
      ).toContain(edge);
    }
    expect(before.owed.suites, "the whole battery, which is the safe direction").toEqual([
      ...ALL_SUITES,
    ]);
    expect(before.owed.e2e, "and the leg whole").toEqual({ whole: true, specs: [] });

    // ARM TWO — THE SAME TREE AFTER THE PREPARATION THE PLANNING JOB NOW
    // RUNS. Restoring the build's product and NOTHING else brings the
    // answer back to this checkout's, which is what makes arm one
    // attributable to the withholding and to nothing about the mirror.
    const prepared = treeWithout([]);
    try {
      const after = armAt(prepared.dir);
      expect(after.unresolved, "every edge lands once the build's product is there").toEqual([]);
      expect(
        after.owed.failClosed,
        "criterion 1: a prepared tree derives the range instead of falling back",
      ).toBeUndefined();
      expect(after.owed.suites, "criterion 1: suite for suite").toEqual(here.suites);
      expect(after.owed.e2e, "criterion 1: and spec for spec").toEqual(here.e2e);
    } finally {
      prepared.cleanup();
    }
  } finally {
    fresh.cleanup();
  }
});

test("the fail-closed sentence is a DISCRIMINATION: one unresolved edge is enough, and a tree with none derives the range", () => {
  // THE POSITIVE CONTROL FOR THE NEGATIVE ASSERTION ABOVE, at the pure
  // rule rather than over a tree — so the two cannot pass together by
  // sharing one mistake. `deriveOwed` is a pure function of its named
  // inputs, and `unresolved` is the only input that differs here.
  const changed = ["tools/e2e/scripts/gate-run.mjs"];
  const { reach } = specReach();

  const clean = deriveOwed({ changed, reach, unresolved: [], dependents: packageDependents() });
  expect(clean.failClosed, "no dropped edge, so the set is derived").toBeUndefined();
  expect(clean.suites.length, "and it is a proper subset").toBeLessThan(ALL_SUITES.length);

  // ONE edge, and the whole answer widens — which is why the planning
  // job's build order could cost every push the battery.
  const one = deriveOwed({
    changed,
    reach,
    unresolved: ["tools/e2e/tests/brief.spec.ts -> ../../../lib/parser/dist/pure.js"],
    dependents: packageDependents(),
  });
  expect(one.suites).toEqual([...ALL_SUITES]);
  expect(one.e2e).toEqual({ whole: true, specs: [] });
  expect(one.failClosed ?? "", "and the input is named, not merely counted").toContain(
    "lib/parser/dist/pure.js",
  );
});

test("a fixture program written as a STRING is not this file's own import list", () => {
  // The failure this scanner was written around, and this file is where
  // it would bite: the bodies above build whole Playwright programs as
  // string literals, and `stripComments` keeps strings on purpose. An
  // unanchored matcher would read a fixture's imports as the spec's and
  // grade a file that does not exist.
  const source =
    'import { EXIT } from "../scripts/gate-run.mjs";\n' +
    "const fixture =\n" +
    "  \"import { test } from '@playwright/test';\\n\" +\n" +
    "  \"import { x } from '../scripts/not-a-real-import.mjs';\\n\";\n";
  expect(importSpecifiers(source)).toEqual(["../scripts/gate-run.mjs"]);
  // The forms this tree really writes, each read whole.
  expect(importSpecifiers('import {\n  a,\n  b,\n} from "./m.mjs";\n')).toEqual(["./m.mjs"]);
  expect(importSpecifiers('import "./side-effect.mjs";\n')).toEqual(["./side-effect.mjs"]);
  expect(importSpecifiers('export { a } from "./re-export.mjs";\n')).toEqual(["./re-export.mjs"]);
  expect(importSpecifiers('import * as ns from "./ns.mjs";\n')).toEqual(["./ns.mjs"]);
  expect(importSpecifiers('// import { z } from "./commented-out.mjs";\n')).toEqual([]);
});

/**
 * ── THE SCOPED ARM AS A SEAT MEETS IT: THE CLI PATH, RUN TO COMPLETION ──
 *
 * Every body above stops short of it. Two drive `runSuite`/`scopeVerdict`
 * by hand; two drive the CLI only into its REFUSALS, which return before
 * anything spawns. Nothing ran the arm's own TAIL — the spawn, the
 * re-wording, THE TOKEN WRITE and the exit code — and a drill proved the
 * gap rather than guessed it: deleting `recordVerdicts([scoped])`,
 * replacing the exit mapping with a constant `EXIT.GREEN`, and deleting
 * the verdict line ALL THREE left this suite green.
 *
 * THE MIDDLE ONE IS THE DANGEROUS ONE. A scoped run reporting exit 0 over
 * a RED subset is a green-only instrument — the defect §POSITIVE CONTROL
 * at the top of this file exists to refuse, one layer in and unguarded.
 * The first one is the laundering hole: without the token write a standing
 * GREEN `e2e` entry outlives a scoped run at a new tree.
 *
 * IT CANNOT BE DRIVEN AT THIS CHECKOUT'S ROOT, WHICH IS WHY NOBODY DID:
 * `--owning` takes the e2e leg's SOLO LOCK — held by the leg running this
 * body — and would write THIS checkout's token. So the fixture is a
 * repository of its own holding a COPY of the runner and its import
 * closure, copied AT RUN TIME so that a mutant planted in the real file
 * travels into it.
 */
const ARM_CLOSURE = [
  "tools/e2e/scripts/gate-run.mjs",
  "tools/e2e/scripts/docs-scan.mjs",
  "tools/e2e/scripts/token-scan.mjs",
  ".claude/hooks/gate-token.mjs",
  ".claude/hooks/lane-fence.mjs",
];

function makeArmFixture(answer: string): { root: string; cleanup: () => void } {
  // REALPATH, AND IT IS LOAD-BEARING: macOS resolves /var/folders to
  // /private/var, and this runner only runs `main` when `import.meta.url`
  // — always a real path — matches `process.argv[1]`. Handed the /var
  // spelling the module loads, does NOTHING, and exits 0 with no output:
  // a silent pass that would make every assertion below vacuous.
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "t271-arm-")));
  mkdirSync(path.join(root, "tools", "e2e", "scripts"), { recursive: true });
  mkdirSync(path.join(root, "tools", "e2e", "tests"), { recursive: true });
  mkdirSync(path.join(root, ".claude", "hooks"), { recursive: true });
  for (const rel of ARM_CLOSURE) {
    writeFileSync(path.join(root, rel), readFileSync(path.join(repoRoot, rel), "utf8"));
  }
  symlinkSync(
    path.join(repoRoot, "tools/e2e/node_modules"),
    path.join(root, "tools/e2e/node_modules"),
    "dir",
  );
  writeFileSync(
    path.join(root, "tools/e2e/playwright.config.ts"),
    'export default { testDir: "./tests", reporter: [["list"]], workers: 1, retries: 0 };\n',
  );
  writeFileSync(
    path.join(root, "tools/e2e/scripts/subject.mjs"),
    `export const ANSWER = ${answer};\n`,
  );
  writeFileSync(
    path.join(root, "tools/e2e/tests/owner.spec.ts"),
    "import { test, expect } from '@playwright/test';\n" +
      "import { ANSWER } from '../scripts/subject.mjs';\n" +
      "test('the subject answers what its owner expects', () => { expect(ANSWER).toBe(41); });\n",
  );
  writeFileSync(
    path.join(root, "tools/e2e/tests/stranger.spec.ts"),
    "import { test, expect } from '@playwright/test';\n" +
      "test('the stranger nothing owns, and it always fails', () => { expect(1).toBe(2); });\n",
  );
  const git = (...args: string[]) =>
    execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { stdio: "pipe" });
  git("init", "-q", "-b", "main");
  git("add", "-A");
  git("-c", "user.email=t271@example.invalid", "-c", "user.name=t271", "commit", "-qm", "base");
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

/** Drive the copied runner's scoped arm and read back everything it owes. */
function runArm(root: string): { status: number | null; line: string; token: string; bodies: number } {
  const r = spawnSync(
    process.execPath,
    [path.join(root, "tools/e2e/scripts/gate-run.mjs"), "e2e", "--owning", "tools/e2e/scripts/subject.mjs"],
    { cwd: root, encoding: "utf8" },
  );
  const line =
    `${r.stdout ?? ""}`
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith(`${VERDICT_TOKEN} `))
      .at(-1) ?? "";
  let token = "";
  let bodies = -1;
  try {
    const parsed = JSON.parse(readFileSync(path.join(root, TOKEN_REL_PATH), "utf8"));
    token = String(parsed?.suites?.["e2e"]?.verdict ?? "");
    bodies = Number(parsed?.suites?.["e2e"]?.bodies ?? -1);
  } catch {
    token = "NO TOKEN WRITTEN";
  }
  return { status: r.status, line, token, bodies };
}

test("the scoped arm's own CLI path prints the subset's verdict, writes it to the token and answers with the subset's own exit code", () => {
  // THE GREEN ARM — a subset that really passes.
  const green = makeArmFixture("41");
  try {
    const g = runArm(green.root);
    expect(g.status, "a passing subset answers at the GREEN code").toBe(EXIT.GREEN);
    expect(g.line, "the arm printed a verdict line at all").not.toBe("");
    expect(g.line).toContain(`verdict=${CRITERION_3_SCOPED_GREEN}`);
    expect(g.line).toContain("scope=tools/e2e/tests/owner.spec.ts");
    expect(g.line, "one body, because one spec owns the change").toContain("bodies=1");
    expect(g.token, "the arm WROTE the subset's verdict into the token").toBe(
      CRITERION_3_SCOPED_GREEN,
    );
    expect(g.bodies, "and recorded the SUBSET's count, never the leg's").toBe(1);
  } finally {
    green.cleanup();
  }

  // THE RED ARM — the same fixture with one character of the SUBJECT moved.
  // A scoped run that answered GREEN here would be a green-only instrument.
  const red = makeArmFixture("42");
  try {
    const r = runArm(red.root);
    expect(r.status, "a RED subset may NEVER answer at the GREEN code").toBe(EXIT.RED);
    expect(r.line).toContain(`verdict=${CRITERION_3_SCOPED_RED}`);
    expect(r.token, "and the token records the red rather than a stale green").toBe(
      CRITERION_3_SCOPED_RED,
    );
  } finally {
    red.cleanup();
  }
});

/** The derivation at a fixture root, with the readings that root's own
 *  tree gives. `owedForRange` is the same composition over a git range;
 *  this is it over a path list, so a body can move ONE file and read the
 *  answer move without writing a commit. */
function deriveOwedIn(root: string, changed: string[]) {
  const { reach, unresolved } = specReach(root);
  return deriveOwed({ changed, reach, unresolved, dependents: packageDependents(root) });
}

/** One task card this repository really tracks, DERIVED — the flat,
 *  non-recursive walk the parser's own census uses. A body naming a card
 *  would be a body that reds when that card lands. */
function trackedCard(): string {
  const card = execFileSync("git", ["-C", repoRoot, "ls-files", "docs/tasks/T-*.md"], {
    encoding: "utf8",
  })
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.endsWith(".md"))
    .sort()[0];
  if (card === undefined) throw new Error("no task card is tracked, and this body is about one");
  return card;
}

// ── §THE OWED SET (T-280) ────────────────────────────────────────────
//
// The scoped reading above answers "which specs own these paths", for a
// path list a SEAT typed. This section is about the whole question, for
// a path list nobody typed: given a RANGE, which of the graded suites
// does it owe, and which spec files does the end-to-end leg owe?
//
// ── WHAT MAKES THESE BODIES DISCRIMINATIONS AND NOT DESCRIPTIONS ────
// The rule is a pure function of named inputs, so every body below moves
// ONE input and reads the answer move with it. A body that only asserted
// today's answer for today's tree would be green under a derivation that
// ignored its inputs entirely — which is exactly the shape "a hand-listed
// set" takes once somebody writes it down.
//
// AND THE DIRECTION THAT COSTS SOMETHING IS SHORT, NEVER LONG. Every way
// the derivation can fail lands on the WHOLE battery, and each of those
// ways has a body that also shows the same call WITHOUT the failure
// deriving a proper subset — because "fails closed" asserted alone is
// satisfied by a function that always answers four.

/** Criterion 2's own word, read off the card. It is ADDITIVE: the five
 *  reasons that existed before it keep their names, and a body below
 *  requires each of them still to be reachable. */
const CRITERION_2_PARTIAL = "token-partial";

test("the package roots the owed set is derived through are the registry's own directories, so no second list of them can exist", () => {
  // THE FIRST WAY THIS FEATURE COULD BE A HAND-LISTED SET IS A MAP OF
  // PACKAGE ROOTS TYPED BESIDE THE REGISTRY. There is none: the map IS
  // the registry, read through each entry's own `cwd`.
  expect(Object.keys(PACKAGE_ROOTS).sort()).toEqual(Object.keys(GRADED_SUITES).sort());
  for (const s of Object.values(GRADED_SUITES)) {
    expect(PACKAGE_ROOTS[s.id], `${s.id}'s root is its own cwd`).toBe(s.cwd);
  }
  expect([...ALL_SUITES]).toEqual(Object.keys(GRADED_SUITES).sort());
  // AND THE SECOND WAY IS THE GUARD HOLDING ITS OWN COPY OF THE NAMES IT
  // ASKS WITH. It may not import this module — it loads on every Bash
  // call in a session — so the two are pinned to each other here, the
  // treatment `REQUIRED_SUITES` already gets four bodies up.
  expect(OWED_SET_FLAGS.ask).toBe(OWED_SET_FLAG);
  expect(OWED_SET_FLAGS.range).toBe(RANGE_FLAG);
  expect(OWED_SET_FLAGS.tree).toBe(TREE_FLAG);
  expect(SCOPABLE_SUITE, "the one leg a token entry may have graded in part").toBe(SCOPED_SUITE);
  expect(OWED_SET_PATH, "the guard asks the runner that owns the rule").toBe(
    path.join(repoRoot, "tools/e2e/scripts/gate-run.mjs"),
  );
});

test("a path is placed by the roots the derivation was GIVEN, so the same path owes different suites under different roots", () => {
  // THE HAND-LISTED-SET REJECTION, MADE MEASURABLE. If the placement
  // were written into the function, moving the roots could not move the
  // answer. It moves.
  const reach = { "tools/e2e/tests/a.spec.ts": ["tools/e2e/tests/a.spec.ts"] };
  const asShipped = deriveOwed({ changed: ["lib/parser/src/x.ts"], reach });
  expect(asShipped.suites).toEqual(["parser"]);
  const relabelled = deriveOwed({
    changed: ["lib/parser/src/x.ts"],
    reach,
    roots: { app: "lib/parser", parser: "nowhere" },
  });
  expect(relabelled.suites, "the roots decide, and nothing else does").toEqual(["app"]);
  // AND THE LONGEST ROOT WINS, which is what keeps a Rust file inside
  // `app/` out of the app suite.
  expect(suiteOfPath("app/src-tauri/src/lib.rs")).toBe("rust");
  expect(suiteOfPath("app/src/main.tsx")).toBe("app");
  expect(suiteOfPath("method/roots.md"), "no root claims it").toBeUndefined();
});

test("a directory whose NAME merely begins with a package root is not INSIDE it, so a sibling fails CLOSED to the whole battery instead of placing under its neighbour", () => {
  // THE BOUNDARY IS A PATH SEGMENT AND NOT A STRING PREFIX, and the body
  // above cannot see the difference: every path it names is either a real
  // child of a root or claimed by no root at all. Drop the `/` from the
  // match and `lib/parser2/` becomes the parser's, `apples/` the app's,
  // `tools/e2e2/` the end-to-end leg's — each of them PLACING a path this
  // derivation is supposed to fail closed on, which turns the whole
  // battery into one leg with nothing said. That is the narrowing
  // direction, so it is the direction this card owes a body.
  //
  // THE CONTROL FIRST, run where the property under test is absent from
  // the question: a real child still places and the longest root still
  // wins. Without these three lines every expectation below is satisfied
  // by a matcher that places NOTHING.
  expect(suiteOfPath("lib/parser/src/x.ts"), "the control: a real child places").toBe("parser");
  expect(suiteOfPath("app/src-tauri/src/lib.rs"), "the control: the longest root wins").toBe(
    "rust",
  );
  expect(suiteOfPath("app/src-tauri"), "the control: a root is its own suite's").toBe("rust");

  // AND NOW THE SIBLINGS, one per root, each of which a prefix match
  // would swallow.
  expect(
    suiteOfPath("lib/parser2/x.ts"),
    "a sibling of lib/parser is not inside lib/parser",
  ).toBeUndefined();
  expect(suiteOfPath("apples/x.ts"), "a sibling of app is not inside app").toBeUndefined();
  expect(
    suiteOfPath("tools/e2e2/x.mjs"),
    "a sibling of tools/e2e is not inside tools/e2e",
  ).toBeUndefined();
  expect(
    suiteOfPath("app/src-tauri-notes/x.md"),
    "a sibling of app/src-tauri belongs to the APP, which does contain it",
  ).toBe("app");

  // THE CONSEQUENCE THAT MAKES THIS A SAFETY PROPERTY AND NOT A NAMING
  // ONE: being unplaceable is what makes a sibling fail CLOSED.
  const sibling = deriveOwed({ changed: ["lib/parser2/x.ts"], reach: {} });
  expect(sibling.suites, "an unplaceable sibling owes the WHOLE battery").toEqual([...ALL_SUITES]);
  expect(sibling.failClosed ?? "", "and the answer says why").toContain("lib/parser2/x.ts");
});

test("planting a reader in a spec GROWS the owed set, over real files and the real graph", () => {
  // THE DATA MUTANT THE CARD ASKS FOR (criterion 5), in its import face.
  // The subject is not the derivation's code — it is the DATA the
  // derivation reads, which is an import statement in a spec file. The
  // pristine hook must NOT own the subject, or the mutant proves nothing.
  const { root, cleanup } = makeOwningFixture();
  try {
    const owner = path.join(root, "tools", "e2e", "tests", "owner.spec.ts");
    const pristine = readFileSync(owner, "utf8");

    // THE HOOK: the reader REMOVED. Nothing in this fixture imports the
    // subject, so the end-to-end leg is owed WHOLE — the honest answer
    // for a path under the leg's root that no spec owns.
    writeFileSync(owner, pristine.replace(/^import \{ ANSWER \}.*\n/m, "").replace("ANSWER", "41"));
    const before = deriveOwedIn(root, ["tools/e2e/scripts/subject.mjs"]);
    expect(before.suites).toEqual(["e2e"]);
    expect(before.e2e.whole, "no spec owns it, so the leg cannot be narrowed").toBe(true);
    expect(before.e2e.specs).toEqual([]);

    // THE MUTANT: the reader planted back. One import statement, and the
    // owed set names the spec that now reads the subject.
    writeFileSync(owner, pristine);
    const after = deriveOwedIn(root, ["tools/e2e/scripts/subject.mjs"]);
    expect(after.suites).toEqual(["e2e"]);
    expect(after.e2e.whole, "a spec owns it now, so the leg narrows").toBe(false);
    expect(after.e2e.specs).toEqual(["tools/e2e/tests/owner.spec.ts"]);
  } finally {
    cleanup();
  }
});

test("adding a doc READ grows the owed set through the DOCS GATE's map, and removing it shrinks the answer back", () => {
  // THE SAME MUTANT IN ITS DOCS FACE, on the data the docs gate hands
  // in. A reader under `lib/parser/` makes a document owe the parser
  // suite; the same document with no reader owes nothing at all — which
  // is the positive empty answer half the wasted batteries were.
  const reach = {
    "tools/e2e/tests/a.spec.ts": ["tools/e2e/tests/a.spec.ts", "tools/e2e/scripts/reads.mjs"],
  };
  const asked = ["docs/GUIDE.md"];
  const unread = deriveOwed({ changed: asked, reach, docsAsked: asked });
  expect(unread.suites, "no code suite reads it — a measurement, not a gap").toEqual([]);
  expect(unread.unplaceable, "and it is PLACED, never fail-closed").toEqual([]);
  expect(unread.failClosed).toBeUndefined();

  const read = deriveOwed({
    changed: asked,
    reach,
    docsAsked: asked,
    docsReadersByPath: { "docs/GUIDE.md": ["lib/parser/src/census.ts"] },
  });
  expect(read.suites, "one reader added, one suite owed").toEqual(["parser"]);

  // AND A SECOND READER, UNDER THE END-TO-END ROOT, ADDS ITS SUITE AND
  // NARROWS IT TO THE SPEC THAT IMPORTS THAT READER.
  const both = deriveOwed({
    changed: asked,
    reach,
    docsAsked: asked,
    docsReadersByPath: {
      "docs/GUIDE.md": ["lib/parser/src/census.ts", "tools/e2e/scripts/reads.mjs"],
    },
  });
  expect(both.suites).toEqual(["e2e", "parser"]);
  expect(both.e2e).toEqual({ whole: false, specs: ["tools/e2e/tests/a.spec.ts"] });
});

test("the live reader map places a real task card, and the set it owes is smaller than the battery", () => {
  // THE INTEGRATION HALF, at this checkout's own ref: a card-only push
  // is the case this card was written about. It must owe LESS than four
  // legs, or the mechanism buys nothing.
  const card = trackedCard();
  const readers = docsReaders(repoRoot);
  const gate = docsGate([card], readers);
  const owed = deriveOwed({
    changed: [card],
    reach: specReach().reach,
    dependents: packageDependents(),
    docsAsked: gate.docsPaths,
    docsReadersByPath: Object.fromEntries(gate.byPath.map((e) => [e.path, e.readers])),
  });
  expect(owed.failClosed, `${card} must be placeable`).toBeUndefined();
  expect(owed.suites.length, "a proper subset of the battery").toBeLessThan(ALL_SUITES.length);
  expect(owed.e2e.whole, "and the end-to-end leg is narrowed").toBe(false);
  expect(owed.e2e.specs.length).toBeGreaterThan(0);
  expect(owed.e2e.specs.length, "to fewer specs than the leg has").toBeLessThan(
    specFiles().length,
  );
});

test("a path the derivation cannot place makes the owed set the WHOLE battery and the answer says why", () => {
  // CRITERION 3, WITH ITS CONTROL FIRST. Without the control, "owes four
  // suites" is satisfied by a function that always answers four.
  const reach = { "tools/e2e/tests/a.spec.ts": ["tools/e2e/tests/a.spec.ts"] };
  const placed = deriveOwed({ changed: ["lib/parser/src/x.ts"], reach });
  expect(placed.suites, "the control really derives a subset").toEqual(["parser"]);
  expect(placed.failClosed).toBeUndefined();

  // A FILE UNDER NO PACKAGE ROOT THAT NO SPEC READS.
  const stray = deriveOwed({ changed: ["lib/parser/src/x.ts", "method/roles/executor.md"], reach });
  expect(stray.suites).toEqual([...ALL_SUITES]);
  expect(stray.e2e.whole).toBe(true);
  expect(stray.failClosed ?? "").toContain("method/roles/executor.md");
  expect(stray.unplaceable.map((u) => u.path)).toEqual(["method/roles/executor.md"]);

  // A READER THE MAP NAMES THAT LIES UNDER NO PACKAGE ROOT — the card's
  // own second case, and the one a package-root arm alone would answer
  // "nothing owed" to.
  const strayReader = deriveOwed({
    changed: ["docs/GUIDE.md"],
    reach,
    docsAsked: ["docs/GUIDE.md"],
    docsReadersByPath: { "docs/GUIDE.md": [".claude/hooks/somewhere.mjs"] },
  });
  expect(strayReader.suites).toEqual([...ALL_SUITES]);
  expect(strayReader.failClosed ?? "").toContain(".claude/hooks/somewhere.mjs");

  // AN IMPORT EDGE THAT WILL NOT RESOLVE, which would make the SPEC half
  // short rather than the suite half wrong.
  const dropped = deriveOwed({
    changed: ["lib/parser/src/x.ts"],
    reach,
    unresolved: ["tools/e2e/tests/a.spec.ts -> ./gone"],
  });
  expect(dropped.suites).toEqual([...ALL_SUITES]);
  expect(dropped.failClosed ?? "").toContain("./gone");

  // AND A DOCS PATH THE GATE WAS NEVER ASKED ABOUT IS AN INABILITY, not
  // the empty answer that an unread document gets: the two look
  // identical in the map and mean opposite things.
  const unasked = deriveOwed({ changed: ["docs/GUIDE.md"], reach });
  expect(unasked.suites).toEqual([...ALL_SUITES]);
  expect(unasked.failClosed ?? "").toContain("never asked");
});

// ── §THE RUNTIME SETTINGS ARM (T-330) ────────────────────────────────
//
// The three arms above place code by its package root, a document by the
// DOCS GATE's reader map, and a spec by the import graph. This project's
// CONFIGURATION is none of those: `method/runtime/` lies under no
// package root, no spec imports a `.yaml`, and the docs gate does not
// look outside `docs/`. So a two-line records change owed four legs, and
// the bodies below are about the arm that places it instead — and about
// the fail-closed answer it must keep for everything it still cannot
// place, which is the half a placement is most easily bought by losing.

test("a runtime settings path is placed by readers DERIVED from the corpus, and the identifier arm is what reaches the files that never spell the path", () => {
  // KILLED BY: a hand-listed consumer set, a literal-only scan (which
  // finds the library that DECLARES the path and misses every file that
  // opens it through the exported constant), and a segment arm that
  // cannot see a `path.join`. The corpus is handed in, so this body moves
  // ONE input at a time and reads the answer move with it.
  const target = `${SETTINGS_DIR}/probe.yaml`;
  const corpus: Record<string, string> = {
    "lib/probe/src/settings.ts": `export const PROBE_TEMPLATE = '${target}';`,
    "tools/e2e/scripts/arm.mjs":
      "import { PROBE_TEMPLATE } from '../../../lib/probe/dist/pure.js';\n" +
      "readFileSync(path.join(root, PROBE_TEMPLATE), 'utf8');\n",
    "tools/e2e/scripts/joiner.mjs": 'writeFileSync(path.join(root, "method", "runtime", "probe.yaml"), text);\n',
    "tools/e2e/scripts/stranger.mjs": "export const ANSWER = 41;\n",
  };
  const map = settingsReadersIn([target], corpus);
  expect(map.asked, "the scan does not report what it was asked").toEqual([target]);
  expect(map.constants[target], "the binding the identifier arm runs on").toEqual(["PROBE_TEMPLATE"]);
  expect(map.byPath[target], "the three readers are the speller, the joiner and the arm").toEqual([
    "lib/probe/src/settings.ts",
    "tools/e2e/scripts/arm.mjs",
    "tools/e2e/scripts/joiner.mjs",
  ]);

  // THE DISCRIMINATION, AND IT IS THE IDENTIFIER ARM'S WHOLE CASE: point
  // the binding at a different file and the arm's own reader is no longer
  // one, while the joiner — which spells the segments itself — still is.
  const moved = settingsReadersIn([target], {
    ...corpus,
    "lib/probe/src/settings.ts": `export const PROBE_TEMPLATE = '${SETTINGS_DIR}/other.yaml';`,
  });
  expect(moved.constants[target], "a binding on another path is still read as this one's").toEqual([]);
  expect(moved.byPath[target], "the identifier arm kept a reader whose constant moved").toEqual([
    "tools/e2e/scripts/joiner.mjs",
  ]);

  // AND THE CONTROL: a file that mentions neither is never a reader, so
  // the answers above are a discrimination and not a corpus listing.
  expect(map.byPath[target], "the stranger was counted").not.toContain("tools/e2e/scripts/stranger.mjs");
});

test("a settings path the scan places nothing for FAILS CLOSED, and so does one nobody asked about, and so does a reader under no package root", () => {
  // THE HALF A PLACEMENT IS BOUGHT BY LOSING. Each case is the whole
  // battery with the reason travelling into the token, and the control is
  // the same path PLACED — without it, "owes four suites" is satisfied by
  // a derivation that always answers four.
  const target = `${SETTINGS_DIR}/probe.yaml`;
  const reach = { "tools/e2e/tests/a.spec.ts": ["tools/e2e/tests/a.spec.ts", "tools/e2e/scripts/reads.mjs"] };
  const placed = deriveOwed({
    changed: [target],
    reach,
    settingsAsked: [target],
    settingsReadersByPath: { [target]: ["tools/e2e/scripts/reads.mjs"] },
  });
  expect(placed.failClosed, "the control really derives a subset").toBeUndefined();
  expect(placed.suites, "the control's own suites").toEqual(["e2e"]);
  expect(placed.e2e, "and the leg narrows to the spec that reaches the reader").toEqual({
    whole: false,
    specs: ["tools/e2e/tests/a.spec.ts"],
  });

  const unasked = deriveOwed({ changed: [target], reach });
  expect(unasked.suites, "a path nobody asked the scan about was placed anyway").toEqual([...ALL_SUITES]);
  expect(unasked.failClosed ?? "", "the reason does not say the question was never put").toContain(
    "never asked",
  );

  const unread = deriveOwed({
    changed: [target],
    reach,
    settingsAsked: [target],
    settingsReadersByPath: { [target]: [] },
  });
  expect(unread.suites, "a configuration file no reader was found for was placed anyway").toEqual([
    ...ALL_SUITES,
  ]);
  expect(unread.failClosed ?? "", "the reason does not name the path").toContain(target);

  const strayReader = deriveOwed({
    changed: [target],
    reach,
    settingsAsked: [target],
    settingsReadersByPath: { [target]: [".claude/hooks/somewhere.mjs"] },
  });
  expect(strayReader.suites, "a reader under no package root was placed anyway").toEqual([...ALL_SUITES]);
  expect(strayReader.failClosed ?? "", "the reason does not name the reader").toContain(
    ".claude/hooks/somewhere.mjs",
  );
});

/** THE RUNTIME TEMPLATE, DERIVED: the PATH the parser library binds its
 *  `RUNTIME_TEMPLATE` constant to, read out of that source rather than
 *  typed here, so a rename moves these bodies with it. The IDENTIFIER is
 *  named because the identifier is what these bodies are about; the path
 *  is the thing a body must never type. */
function runtimeTemplatePath(): string {
  const declared = readFileSync(path.join(repoRoot, "lib/parser/src/process-settings.ts"), "utf8");
  const rel = /export const RUNTIME_TEMPLATE\s*=\s*['"`]([^'"`\n]+)['"`]/.exec(declared)?.[1];
  if (rel === undefined) {
    throw new Error("the parser binds no RUNTIME_TEMPLATE, and these bodies are about that constant");
  }
  expect(rel.startsWith(`${SETTINGS_DIR}/`), "the template moved out of the settings directory").toBe(true);
  return rel;
}

test("the live tree places its own runtime template with the consumers that really read it, and the leg it owes is narrower than the whole leg", () => {
  // THE INTEGRATION HALF at this checkout's own ref. **THE SUBJECT MOVED
  // AT T-344 AND THE MEASUREMENT DID NOT**: the case this body was
  // written about was recording the owner's approved dispatch grant, and
  // that datum has LEFT this file precisely because the cost measured
  // here — four suites for a routine approval — was the wrong price for
  // an operational act. What the template still carries is genuine
  // configuration a code change reads: the model per role and the
  // process profile. So the narrowing is still owed and still worth
  // deriving, and an ordinary approval no longer enters this derivation
  // at all. KILLED BY: a map that answers nothing
  // for the live file (which fails closed and buys nothing), one that
  // misses the parser's settings reader or the arm that opens it, and a
  // narrowing that cannot be narrower than the leg.
  const template = runtimeTemplatePath();
  const map = settingsReaders([template]);
  const readers = map.byPath[template] ?? [];
  expect(readers.length, "the live scan places no reader at all").toBeGreaterThan(0);
  expect(readers, "the parser library's settings reader is not among the consumers").toContain(
    "lib/parser/src/process-settings.ts",
  );
  expect(readers, "nor the arm that reads the dispatch block and the roles").toContain(
    "tools/e2e/scripts/dispatch-brief.mjs",
  );
  const owed = deriveOwed({
    changed: [template],
    reach: specReach().reach,
    dependents: packageDependents(),
    settingsAsked: map.asked,
    settingsReadersByPath: map.byPath,
  });
  expect(owed.failClosed, `${template} must be placeable`).toBeUndefined();
  expect(owed.e2e.whole, "the end-to-end leg is still owed whole").toBe(false);
  expect(owed.e2e.specs.length, "and it is narrowed to fewer specs than the leg has").toBeLessThan(
    specFiles().length,
  );
  expect(owed.byPath[0]?.why.join(" | ") ?? "", "the answer does not say WHY it placed it").toContain(
    "reads this configuration",
  );

  // THE BEFORE, MEASURED RATHER THAN REMEMBERED: the same path through
  // the same derivation with the map withheld is the whole battery, which
  // is what this arm replaced.
  const before = deriveOwed({
    changed: [template],
    reach: specReach().reach,
    dependents: packageDependents(),
  });
  expect(before.suites, "the before-state was not the whole battery").toEqual([...ALL_SUITES]);
  expect(before.e2e.whole, "nor the whole leg").toBe(true);
});

test("the narrowed selection for the runtime template still CARRIES every body that reads the dispatch block, so no configuration check is dropped by narrowing", () => {
  // THE CARD'S FIFTH CRITERION, its "drop no check" half, and the reason
  // this body derives its carriers instead of naming them: a selection
  // that stopped running the body which validates the real configuration
  // would be a narrowing that bought its speed by removing the check.
  //
  // **AND SINCE T-344 THE CARRIERS ARE BODIES ABOUT THE READER RATHER
  // THAN ABOUT A GRANT THIS FILE HOLDS.** The active grant lives in an
  // untracked operational store now, so it has no publication range at
  // all and cannot be what a selection over a tracked path selects for —
  // which is why this body is NOT retargeted at the store. What it still
  // holds is that a change to the template carries every body that reads
  // the block's declaration with it.
  // KILLED BY: a narrowing that drops a carrier, and by a carrier set
  // derived to be empty — which would make the containment vacuous.
  const template = runtimeTemplatePath();
  expect(
    readFileSync(path.join(repoRoot, template), "utf8")
      .split("\n")
      .filter((l) => l === "dispatch:"),
    "the runtime template carries a dispatch block again — the grant left it at T-344, and a " +
      "selection over a tracked path is exactly the cost it left to avoid",
  ).toEqual([]);
  const map = settingsReaders([template]);
  const owed = deriveOwed({
    changed: [template],
    reach: specReach().reach,
    dependents: packageDependents(),
    settingsAsked: map.asked,
    settingsReadersByPath: map.byPath,
  });
  const carriers = specFiles().filter((f) => {
    const text = readFileSync(path.join(repoRoot, f), "utf8");
    return text.includes("dispatchBlock(") && text.includes("RUNTIME_TEMPLATE");
  });
  expect(carriers.length, "no spec reads the dispatch block, so this body is vacuous").toBeGreaterThan(0);
  for (const carrier of carriers) {
    expect(owed.e2e.specs, `${carrier} reads the dispatch block and the narrowing dropped it`).toContain(
      carrier,
    );
  }
  // AND THE NARROWING IS REAL, not a subset that happens to be the leg:
  // some spec is outside it, or "contains the carriers" is free.
  expect(owed.e2e.specs.length, "the narrowing selected the whole leg").toBeLessThan(specFiles().length);
});

test("a file: dependency in a manifest makes one package's change owe another's suite, and the edge is READ rather than asserted", () => {
  // THE PACKAGE ROOTS ALONE WOULD MISS THIS: `lib/parser/` lies under
  // the parser's root and nothing else, yet the app imports the parser
  // through `file:../lib/parser` and its suite really can red.
  const live = packageDependents();
  expect(live["parser"], "this repository's own manifest edge").toContain("app");
  const reach = { "tools/e2e/tests/a.spec.ts": ["tools/e2e/tests/a.spec.ts"] };
  expect(
    deriveOwed({ changed: ["lib/parser/src/x.ts"], reach, dependents: live }).suites,
  ).toEqual(["app", "parser"]);
  // THE CONTROL: the same call with NO edges owes one suite, so the
  // second name above came from the manifest and not from the rule.
  expect(deriveOwed({ changed: ["lib/parser/src/x.ts"], reach, dependents: {} }).suites).toEqual([
    "parser",
  ]);
  // AND THE EDGE IS READ OFF A MANIFEST: a tree with no such dependency
  // has no such edge.
  const bare = mkdtempSync(path.join(tmpdir(), "t280-deps-"));
  try {
    mkdirSync(path.join(bare, "app"), { recursive: true });
    mkdirSync(path.join(bare, "lib", "parser"), { recursive: true });
    writeFileSync(path.join(bare, "app/package.json"), '{"dependencies":{"left-pad":"^1"}}\n');
    writeFileSync(path.join(bare, "lib/parser/package.json"), "{}\n");
    expect(packageDependents(bare)["parser"]).toEqual([]);
    // …and the same tree WITH the specifier has it, so the reader is
    // reading and not defaulting.
    writeFileSync(
      path.join(bare, "app/package.json"),
      '{"dependencies":{"@x/parser":"file:../lib/parser"}}\n',
    );
    expect(packageDependents(bare)["parser"]).toEqual(["app"]);
  } finally {
    rmSync(bare, { recursive: true, force: true });
  }
});


// ── THE GENERATED ENTRY AND ITS OWNING SOURCES (T-335) ────────────────
//
// The edge these bodies are about is the one the section above already
// reaches and cannot use: two specs import `lib/parser/dist/pure.js`,
// `lib/parser/.gitignore` excludes `dist/`, and a range's changed paths
// come from git — so no changed path can ever BE that file and the edge
// contributed a selection exactly never. What is added is the
// relationship between that generated file and the sources that build
// it, READ off the owning package's build configuration.

/** Every spec whose reach lands on a file under the parser's own output
 *  root — DERIVED, because typing the two filenames would make a body
 *  that still passed on the day the import was deleted. */
function parserDistImporters(root: string = repoRoot): string[] {
  const { reach } = specReach(root);
  const builds = packageBuilds(root).byPackage["parser"] ?? [];
  const outs = builds.map((b) => `${b.out}/`);
  return Object.keys(reach)
    .filter((s) => (reach[s] ?? []).some((f) => outs.some((o) => f.startsWith(o))))
    .sort();
}

/**
 * A real two-commit range over THIS repository whose diff is exactly the
 * named paths, built with a temporary index and `commit-tree` so that no
 * branch, no ref, no index and no working file moves. The objects are
 * unreferenced and collectable; `git status` is untouched.
 */
function probeRange(edits: Record<string, string>, root: string = repoRoot): { range: string; base: string; tip: string } {
  const git = (args: string[], env?: Record<string, string>): string =>
    execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], {
      encoding: "utf8",
      stdio: "pipe",
      env: { ...process.env, ...(env ?? {}) },
    }).trim();
  const base = git(["rev-parse", "HEAD"]);
  const index = path.join(mkdtempSync(path.join(tmpdir(), "t335-idx-")), "index");
  try {
    git(["read-tree", base], { GIT_INDEX_FILE: index });
    for (const [rel, body] of Object.entries(edits)) {
      const blob = execFileSync("git", ["-C", root, "hash-object", "-w", "--stdin"], {
        encoding: "utf8",
        input: body,
      }).trim();
      git(["update-index", "--cacheinfo", `100644,${blob},${rel}`], { GIT_INDEX_FILE: index });
    }
    const tree = git(["write-tree"], { GIT_INDEX_FILE: index });
    const tip = git(["commit-tree", tree, "-p", base, "-m", "T-335 probe: a parser source, alone"]);
    return { range: `${base}..${tip}`, base, tip };
  } finally {
    rmSync(path.dirname(index), { recursive: true, force: true });
  }
}

test("a range that moves a parser SOURCE alone selects every spec that reaches the parser's built entry, over the live tree and a real range", () => {
  // CRITERION 1, and the arrangement is the card's own: a real range
  // whose only changed path is a file under `lib/parser/src/`. Before
  // this arm the same range owed `app` and `parser` with the end-to-end
  // leg narrowed to ZERO spec files — the import edge landed on a file
  // git does not track, so nothing could ever select through it.
  const importers = parserDistImporters();
  expect(
    importers.length,
    "NON-VACUOUS FIRST: a tree where nothing imports the parser's build output would make " +
      "every assertion below true of an empty set",
  ).toBeGreaterThan(1);
  // The two the card names, required BY NAME as well as by the derived
  // set — a graph that quietly lost one of the edges would otherwise
  // shrink the set and pass.
  expect(importers).toContain("tools/e2e/tests/brief.spec.ts");
  expect(importers).toContain("tools/e2e/tests/cli.spec.ts");

  const { range } = probeRange({ "lib/parser/src/pure.ts": "export const T335_PROBE = 1;\n" });
  const moved = rangeChanged(range, repoRoot);
  expect(
    "paths" in moved ? moved.paths : [],
    "the range really moves one parser source and nothing else",
  ).toEqual(["lib/parser/src/pure.ts"]);

  const owed = owedForRange(range, repoRoot);
  expect("problem" in owed, "the range is one this checkout can diff").toBe(false);
  const here = owed as Exclude<typeof owed, { problem: string }>;
  expect(here.failClosed, "a prepared tree derives this range rather than falling back").toBeUndefined();
  expect(here.e2e.whole, "and the leg is NARROWED, so the subset below is a real subset").toBe(false);
  for (const spec of importers) {
    expect(
      here.e2e.specs,
      `criterion 1: ${spec} reaches the parser's generated entry, so a parser source selects it`,
    ).toContain(spec);
  }
  // AND IT IS STILL A SUBSET: a repair that owed the whole leg would
  // satisfy the line above and destroy the narrowing T-331 landed.
  expect(here.e2e.specs.length, "a proper subset of the leg").toBeLessThan(specFiles().length);
  expect(here.suites, "the package root and the file: edge still answer too").toEqual([
    "app",
    "e2e",
    "parser",
  ]);

  // THE SELECTION SAYS WHERE IT CAME FROM, and the sentence names the
  // CONFIGURATION rather than a rewritten path.
  const owning = deriveOwning(["lib/parser/src/pure.ts"], repoRoot);
  const via = owning.byPath.flatMap((e) => e.via).join("\n");
  expect(via).toContain("lib/parser/tsconfig.build.json builds lib/parser/dist/ from lib/parser/src/");
});

test("a generated file no build configuration can place makes the owed set the WHOLE battery and the answer NAMES the file", () => {
  // CRITERION 2, as a DISCRIMINATION rather than an assertion: the same
  // reached set, the same tracked corpus, the same range — and the ONE
  // input that differs is whether the parser's emit relationship could
  // be read. The fail-closed answer is what an unreadable relationship
  // must cost, not a placeholder waiting to be optimised away.
  const { reach } = specReach();
  const reached = [...new Set(Object.values(reach).flat())].sort();
  const tracked = new Set(
    execFileSync("git", ["-C", repoRoot, "ls-files", "-z"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    })
      .split("\0")
      .filter((s) => s !== ""),
  );
  const changed = ["lib/parser/src/pure.ts"];
  const real = packageBuilds().byPackage;
  expect(
    real["parser"]?.length,
    "NON-VACUOUS: this checkout really does declare the relationship, so removing it is a change",
  ).toBe(1);

  // THE CONTROL — the relationship readable. Nothing is unplaceable and
  // the changed source stands behind the generated files.
  const readable = generatedEntries({ changed, reached, tracked, builds: real });
  expect(readable.unplaceable, "the control places every generated file in the graph").toEqual([]);
  expect((readable.byPath["lib/parser/src/pure.ts"] ?? []).length).toBeGreaterThan(0);

  // THE ARM — the SAME inputs with the parser's relationship gone.
  const blind = generatedEntries({
    changed,
    reached,
    tracked,
    builds: { ...real, parser: [] },
    notes: { parser: ["lib/parser/tsconfig.build.json could not be read"] },
  });
  expect(
    blind.unplaceable.length,
    "every generated file in the graph is now one this derivation cannot map back",
  ).toBeGreaterThan(0);
  expect(blind.unplaceable.map((u) => u.path)).toContain("lib/parser/dist/pure.js");
  expect(blind.byPath, "and no changed source stands behind anything").toEqual({});

  const owed = deriveOwed({
    changed,
    reach,
    dependents: packageDependents(),
    generatedUnplaceable: blind.unplaceable,
  });
  expect(owed.suites, "criterion 2: the whole battery, which is the safe direction").toEqual([
    ...ALL_SUITES,
  ]);
  expect(owed.e2e, "and the leg whole").toEqual({ whole: true, specs: [] });
  expect(
    owed.failClosed ?? "",
    "criterion 2: and it NAMES the input it could not place, so a seat can act on the sentence",
  ).toContain("lib/parser/dist/pure.js");
  expect(owed.failClosed ?? "").toContain("lib/parser/tsconfig.build.json could not be read");

  // THE OTHER HALF OF THE DISCRIMINATION: the readable relationship over
  // the same range derives the set instead of falling back.
  const derived = deriveOwed({
    changed,
    reach,
    dependents: packageDependents(),
    generatedByPath: readable.byPath,
    generatedVia: readable.via,
    generatedUnplaceable: readable.unplaceable,
  });
  expect(derived.failClosed, "the control derives rather than falls back").toBeUndefined();
  expect(derived.e2e.whole).toBe(false);

  // AND THE SCOPED ARM REFUSES ON THE SAME GROUND, because a subset
  // chosen while a source-to-entry relationship is unreadable is SHORT.
  const refusal = spawnSync(
    process.execPath,
    [path.join(repoRoot, "tools/e2e/scripts/gate-run.mjs"), SCOPED_SUITE, "--owning", "lib/parser/src/pure.ts"],
    { cwd: repoRoot, encoding: "utf8", env: { ...process.env, PATH: "/nonexistent" } },
  );
  expect(
    `${refusal.stderr ?? ""}`,
    "with git unreachable the scoped arm cannot tell a generated file from a tracked one, so it " +
      "refuses on THIS arm rather than grading a subset that would be short",
  ).toContain("GENERATED file this derivation cannot map back to the");
  expect(`${refusal.stderr ?? ""}`).toContain("THE FULL e2e LEG IS OWED");
  expect(refusal.status).toBe(EXIT.USAGE);
});

test("the emit relationship is READ off the owning package's own build configuration, so a package that moves where it builds to moves this derivation with it", () => {
  // "RATHER THAN BY REWRITING A PATH" — the half of the repair a body
  // must hold, because a hardcoded `dist` -> `src` swap would pass every
  // assertion about this checkout and be a second place the truth lives.
  const live = packageBuilds().byPackage["parser"] ?? [];
  expect(live).toEqual([
    { config: "lib/parser/tsconfig.build.json", src: "lib/parser/src", out: "lib/parser/dist" },
  ]);

  const bare = mkdtempSync(path.join(tmpdir(), "t335-builds-"));
  try {
    mkdirSync(path.join(bare, "lib", "parser"), { recursive: true });
    const manifest = (build: string) =>
      writeFileSync(path.join(bare, "lib/parser/package.json"), JSON.stringify({ scripts: { build } }));
    const project = (file: string, body: unknown) =>
      writeFileSync(path.join(bare, "lib/parser", file), JSON.stringify(body));

    // A PACKAGE THAT BUILDS SOMEWHERE ELSE, and the derivation follows.
    manifest("tsc -p tsconfig.build.json");
    project("tsconfig.build.json", { compilerOptions: { rootDir: "lib", outDir: "build" } });
    expect(packageBuilds(bare).byPackage["parser"]).toEqual([
      { config: "lib/parser/tsconfig.build.json", src: "lib/parser/lib", out: "lib/parser/build" },
    ]);

    // THE `extends` CHAIN IS FOLLOWED, because this repository writes the
    // emit options in a file that inherits the rest.
    project("tsconfig.base.json", { compilerOptions: { outDir: "out" } });
    project("tsconfig.build.json", { extends: "./tsconfig.base.json", compilerOptions: { rootDir: "sources" } });
    expect(packageBuilds(bare).byPackage["parser"]).toEqual([
      { config: "lib/parser/tsconfig.build.json", src: "lib/parser/sources", out: "lib/parser/out" },
    ]);

    // A SINGLE `include` DIRECTORY STANDS IN FOR AN UNWRITTEN rootDir,
    // which is what `tsc` itself would infer.
    project("tsconfig.build.json", { compilerOptions: { outDir: "dist" }, include: ["src"] });
    expect(packageBuilds(bare).byPackage["parser"]).toEqual([
      { config: "lib/parser/tsconfig.build.json", src: "lib/parser/src", out: "lib/parser/dist" },
    ]);

    // AND A PACKAGE THAT DECLARES NO EMIT CONTRIBUTES NO RELATIONSHIP —
    // reported, never invented, which is what makes the fail-closed arm
    // above fire on a real inability.
    project("tsconfig.build.json", { compilerOptions: { noEmit: true } });
    const none = packageBuilds(bare);
    expect(none.byPackage["parser"]).toEqual([]);
    expect(none.notes["parser"]?.join("; ")).toContain("declares no outDir");
    manifest("vite build");
    expect(packageBuilds(bare).notes["parser"]?.join("; ")).toContain("runs no TypeScript project");
    expect(buildConfigsIn("tsc && tsc -p tsconfig.test.json && vite build")).toEqual([
      "tsconfig.json",
      "tsconfig.test.json",
    ]);
  } finally {
    rmSync(bare, { recursive: true, force: true });
  }
});

test("a range that moves no source of a built package answers exactly what it answered before the relationship was readable", () => {
  // CRITERION 3. The comparison is the SAME function with and without
  // its new inputs, over the live graph — so a difference anywhere is
  // this arm's doing and nothing else's.
  const { reach, unresolved } = specReach();
  const dependents = packageDependents();
  const answer = (changed: string[], withArm: boolean) => {
    const gen = generatedSources(changed, reach, repoRoot);
    const derived = deriveOwed({
      changed,
      reach,
      dependents,
      unresolved,
      ...(withArm
        ? { generatedByPath: gen.byPath, generatedVia: gen.via, generatedUnplaceable: gen.unplaceable }
        : {}),
    });
    return JSON.stringify({ suites: derived.suites, e2e: derived.e2e, failClosed: derived.failClosed });
  };

  // NOT ONE OF THESE LIES UNDER A BUILT PACKAGE'S SOURCE ROOT, and they
  // span every arm the derivation has: a spec's own subject, an app
  // source, a Rust source, and a document the docs gate places.
  for (const changed of [
    ["tools/e2e/scripts/gate-run.mjs"],
    ["tools/e2e/tests/gate-run.spec.ts"],
    ["app/src/main.tsx"],
    ["app/src-tauri/src/main.rs"],
    ["docs/CONVENTIONS.md"],
  ]) {
    expect(answer(changed, true), `criterion 3: ${changed.join(", ")} is unmoved by this arm`).toBe(
      answer(changed, false),
    );
  }

  // THE POSITIVE CONTROL THE NEGATIVE ASSERTION ABOVE NEEDS: a path that
  // DOES lie under a built package's sources answers differently, so the
  // comparison is a discrimination and not a comparison of two nothings.
  const source = ["lib/parser/src/pure.ts"];
  expect(
    answer(source, true),
    "a parser source is exactly what this arm was added to move",
  ).not.toBe(answer(source, false));
});

test("the range is refused when its left endpoint is not an ancestor of its right, because a two-dot diff between divergent tips lies", () => {
  // THE RANGE RULE, HELD RATHER THAN QUOTED. `git diff A..B` is `git diff
  // A B`, so between two divergent tips the OTHER side's work comes back
  // reversed — the measured lie the rule exists to prevent.
  const { root, cleanup } = makeArmFixture("41");
  try {
    const git = (...args: string[]) =>
      execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], {
        encoding: "utf8",
        stdio: "pipe",
      }).trim();
    const base = git("rev-parse", "HEAD");
    writeFileSync(path.join(root, "tools/e2e/scripts/subject.mjs"), "export const ANSWER = 7;\n");
    git("add", "-A");
    git("-c", "user.email=t280@example.invalid", "-c", "user.name=t280", "commit", "-qm", "one");
    const tip = git("rev-parse", "HEAD");

    // THE CONTROL: an ancestor pair is answered, and it names the path.
    const ok = rangeChanged(`${base}..${tip}`, root);
    expect("problem" in ok ? ok.problem : "").toBe("");
    expect("paths" in ok ? ok.paths : []).toEqual(["tools/e2e/scripts/subject.mjs"]);

    // THE DIVERGENCE: a second commit off the base, and neither tip is
    // the other's ancestor.
    git("checkout", "-q", "-b", "other", base);
    writeFileSync(path.join(root, "tools/e2e/scripts/subject.mjs"), "export const ANSWER = 9;\n");
    git("add", "-A");
    git("-c", "user.email=t280@example.invalid", "-c", "user.name=t280", "commit", "-qm", "two");
    const other = git("rev-parse", "HEAD");
    const bad = rangeChanged(`${other}..${tip}`, root);
    expect("problem" in bad, "a divergent pair must be REFUSED, not answered").toBe(true);
    expect("problem" in bad ? bad.problem : "").toContain("not an ancestor");

    // AND A RANGE THAT IS NOT TWO REVISIONS AT ALL NEVER REACHES git.
    const shell = rangeChanged("HEAD~1..HEAD; rm -rf /", root);
    expect("problem" in shell).toBe(true);
    expect("problem" in shell ? shell.problem : "").toContain("two-dot range");
  } finally {
    cleanup();
  }
});

test("a DELETED path is IN the range's path set, because a removal is a change and an empty path set owes nothing at all", () => {
  // THE LARGEST NARROWING THIS DERIVATION CAN MAKE IS AN EMPTY PATH SET:
  // no path, no owed suite, and a push the guard then asks the token
  // nothing about. A `--diff-filter` that dropped deletions would produce
  // exactly that for a range whose only change is a removal — and
  // removals are ordinary here: a card is deleted, a script is retired, a
  // spec is folded into another. Deleting a task card moves the parser's
  // census; deleting a source file moves what still compiles.
  const { root, cleanup } = makeArmFixture("41");
  try {
    const git = (...args: string[]) =>
      execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], {
        encoding: "utf8",
        stdio: "pipe",
      }).trim();
    const commit = (m: string) => {
      git("add", "-A");
      git("-c", "user.email=t280@example.invalid", "-c", "user.name=t280", "commit", "-qm", m);
    };
    const doomed = path.join(root, "tools/e2e/scripts/doomed.mjs");
    writeFileSync(doomed, "export const GONE = 1;\n");
    commit("plant the file this range will remove");
    const base = git("rev-parse", "HEAD");

    // THE CONTROL, where the arming is absent: the SAME fixture and the
    // same reader over an ADDITION already names its path, so a reader
    // that named nothing at all could not pass this line.
    writeFileSync(path.join(root, "tools/e2e/scripts/added.mjs"), "export const NEW = 2;\n");
    commit("an addition");
    const added = rangeChanged(`${base}..HEAD`, root);
    expect("paths" in added ? added.paths : [], "the control: an addition is named").toEqual([
      "tools/e2e/scripts/added.mjs",
    ]);

    // AND THE DELETION, which is the reading this body exists for.
    const afterAdd = git("rev-parse", "HEAD");
    rmSync(doomed);
    commit("remove it");
    const seen = rangeChanged(`${afterAdd}..HEAD`, root);
    expect(
      "paths" in seen ? seen.paths : [],
      "a removal is a change, and the path set must carry it",
    ).toEqual(["tools/e2e/scripts/doomed.mjs"]);

    // THE CONSEQUENCE: the deleted path still owes the suite whose root
    // contained it, rather than owing nothing.
    const owed = deriveOwed({ changed: "paths" in seen ? seen.paths : [], reach: {} });
    expect(owed.suites, "a deletion under a package root owes that suite").toEqual(["e2e"]);
  } finally {
    cleanup();
  }
});

test("the ASK arm answers the owed set as JSON without running anything, and answers a JSON problem when it cannot", () => {
  // THIS IS THE ARM THE PUSH GUARD SPAWNS, so its answer must be
  // machine-readable in BOTH directions: a refusal a caller had to parse
  // out of English is a caller that fails open by accident.
  const { root, cleanup } = makeArmFixture("41");
  try {
    const git = (...args: string[]) =>
      execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], {
        encoding: "utf8",
        stdio: "pipe",
      }).trim();
    const base = git("rev-parse", "HEAD");
    writeFileSync(path.join(root, "tools/e2e/scripts/subject.mjs"), "export const ANSWER = 41;\n");
    writeFileSync(path.join(root, "tools/e2e/scripts/second.mjs"), "export const OTHER = 1;\n");
    git("add", "-A");
    git("-c", "user.email=t280@example.invalid", "-c", "user.name=t280", "commit", "-qm", "one");
    const tip = git("rev-parse", "HEAD");

    const ask = spawnSync(
      process.execPath,
      [
        path.join(root, "tools/e2e/scripts/gate-run.mjs"),
        OWED_SET_FLAG,
        RANGE_FLAG,
        `${base}..${tip}`,
        TREE_FLAG,
        root,
      ],
      { cwd: root, encoding: "utf8" },
    );
    expect(ask.status, ask.stderr).toBe(EXIT.GREEN);
    const answer = JSON.parse(String(ask.stdout));
    expect(answer.suites).toEqual(["e2e"]);
    expect(answer.changed).toEqual(["tools/e2e/scripts/second.mjs"]);
    expect(answer.e2e.whole, "a script no spec imports cannot narrow the leg").toBe(true);
    // THE INPUTS TRAVEL WITH THE ANSWER, so a set nobody can re-derive
    // never leaves this program.
    expect(answer.inputs.packageRoots).toEqual({ ...PACKAGE_ROOTS });
    expect(answer.inputs.base).toBe(base);
    expect(answer.inputs.tip).toBe(tip);
    expect(answer.inputs.specFiles).toBeGreaterThan(0);
    // AND NOTHING RAN: the ask arm writes no token.
    expect(existsSync(path.join(root, TOKEN_REL_PATH))).toBe(false);

    const bad = spawnSync(
      process.execPath,
      [path.join(root, "tools/e2e/scripts/gate-run.mjs"), OWED_SET_FLAG, RANGE_FLAG, "not-a-range"],
      { cwd: root, encoding: "utf8" },
    );
    expect(bad.status).toBe(EXIT.USAGE);
    expect(JSON.parse(String(bad.stdout)).problem).toContain("two-dot range");
  } finally {
    cleanup();
  }
});

test("the RANGE arm grades the owed set, records the set and its range in the token, and its e2e entry names the specs it graded", () => {
  // THE WHOLE FEATURE, END TO END, AND IT IS NOT VACUOUS: this fixture's
  // `stranger.spec.ts` always fails, so a run that reached the whole leg
  // could not answer green. The subset answers GREEN with one body.
  const { root, cleanup } = makeArmFixture("41");
  try {
    const git = (...args: string[]) =>
      execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], {
        encoding: "utf8",
        stdio: "pipe",
      }).trim();
    const base = git("rev-parse", "HEAD");
    writeFileSync(path.join(root, "tools/e2e/scripts/subject.mjs"), "export const ANSWER = 41;\n");
    writeFileSync(
      path.join(root, "tools/e2e/scripts/subject.mjs"),
      "export const ANSWER = 41; // touched\n",
    );
    git("add", "-A");
    git("-c", "user.email=t280@example.invalid", "-c", "user.name=t280", "commit", "-qm", "one");
    const tip = git("rev-parse", "HEAD");

    const run = spawnSync(
      process.execPath,
      [path.join(root, "tools/e2e/scripts/gate-run.mjs"), RANGE_FLAG, `${base}..${tip}`],
      { cwd: root, encoding: "utf8" },
    );
    expect(run.status, run.stderr).toBe(EXIT.GREEN);
    const line =
      String(run.stdout)
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith(`${VERDICT_TOKEN} `))
        .at(-1) ?? "";
    // THE WORD IS THE LEG'S OWN, not `SCOPED-`: this subset was derived
    // from two commit ids the guard re-derives, so it is mintable.
    expect(line).toContain("verdict=GREEN");
    expect(line).not.toContain(CRITERION_3_SCOPED_GREEN);
    expect(line).toContain("scope=tools/e2e/tests/owner.spec.ts");
    expect(line, "one body, because one spec owns the change").toContain("bodies=1");

    const token = JSON.parse(readFileSync(path.join(root, TOKEN_REL_PATH), "utf8"));
    expect(token.suites["e2e"].verdict).toBe("GREEN");
    expect(token.suites["e2e"].scope).toBe("tools/e2e/tests/owner.spec.ts");
    expect(token.owed.range).toBe(`${base}..${tip}`);
    expect(token.owed.suites).toEqual(["e2e"]);
    expect(token.owed.e2e).toEqual({ whole: false, specs: ["tools/e2e/tests/owner.spec.ts"] });
    expect(token.owed.inputs.packageRoots).toEqual({ ...PACKAGE_ROOTS });

    // THE DISCRIMINATION: the WHOLE leg over the same tree is RED, so the
    // green above is a narrower reading and not a runner that cannot say
    // red.
    const whole = spawnSync(
      process.execPath,
      [path.join(root, "tools/e2e/scripts/gate-run.mjs"), "e2e"],
      { cwd: root, encoding: "utf8" },
    );
    expect(whole.status, "the leg really reaches the stranger").toBe(EXIT.RED);
  } finally {
    cleanup();
  }
});

test("the owed set becomes runnable suites in the registry's own order, with the end-to-end leg scoped only when it is narrowed", () => {
  const narrowed = owedSuites({
    suites: ["e2e", "parser"],
    e2e: { whole: false, specs: ["tools/e2e/tests/a.spec.ts"] },
    byPath: [],
    unplaceable: [],
    generatedUnplaceable: [],
    failClosed: undefined,
  });
  expect(narrowed.map((s) => s.id)).toEqual(["parser", "e2e"]);
  expect(narrowed.at(-1)?.argv.at(-1), "spelled relative to the leg's own cwd").toBe(
    "tests/a.spec.ts",
  );
  // A LEG OWED WHOLE IS THE REGISTRY'S ENTRY UNCHANGED — no empty scope,
  // no argv this runner would then have to interpret.
  const wholeLeg = owedSuites({
    suites: ["e2e"],
    e2e: { whole: true, specs: [] },
    byPath: [],
    unplaceable: [],
    generatedUnplaceable: [],
    failClosed: undefined,
  });
  expect(wholeLeg[0]?.argv).toEqual([...GRADED_SUITES.e2e.argv]);
});

test("a token that does not cover what the range owes is refused as token-partial, and the five earlier reasons keep their names", () => {
  // CRITERION 2 AT THE JUDGE. The control comes FIRST and must PASS: a
  // token carrying exactly the owed set IS accepted, so the refusal that
  // follows is a discrimination and not a constant.
  const repo = tokenRepo("owed");
  try {
    const tree = String(headTree(repo));
    const owed = {
      range: "aaa..bbb",
      suites: ["e2e", "parser"],
      e2e: { whole: false, specs: ["tools/e2e/tests/a.spec.ts"] },
    };
    recordVerdicts(
      [
        { ...entryFor("parser", "GREEN"), targets: 1 },
        { ...entryFor("e2e", "GREEN"), targets: 1, scope: "tools/e2e/tests/a.spec.ts" },
      ],
      repo,
    );
    expect(
      judgeToken({ token: tokenOf(repo), tree, owed }).state,
      "two suites, and the range owes exactly those two",
    ).toBe("fresh");
    // AND THE SAME TOKEN IS INCOMPLETE AGAINST THE WHOLE BATTERY, which
    // is what makes the acceptance above the owed set's doing.
    expect(judgeToken({ token: tokenOf(repo), tree }).code).toBe("token-incomplete");

    // A SUITE THE RANGE OWES THAT NOTHING MEASURED.
    const missing = judgeToken({
      token: tokenOf(repo),
      tree,
      owed: { ...owed, suites: ["e2e", "parser", "rust"] },
    });
    expect(missing.state).toBe("partial");
    expect(missing.code).toBe(CRITERION_2_PARTIAL);
    expect(missing.detail).toContain("rust");
    expect(missing.detail, "and it names the range it is judging").toContain("aaa..bbb");

    // A SPEC FILE THE RANGE OWES THAT THE RECORDED RUN DID NOT GRADE.
    const short = judgeToken({
      token: tokenOf(repo),
      tree,
      owed: {
        ...owed,
        e2e: { whole: false, specs: ["tools/e2e/tests/a.spec.ts", "tools/e2e/tests/b.spec.ts"] },
      },
    });
    expect(short.code).toBe(CRITERION_2_PARTIAL);
    expect(short.detail).toContain("tools/e2e/tests/b.spec.ts");

    // AND A LEG OWED WHOLE IS NOT COVERED BY A SUBSET RUN.
    expect(
      judgeToken({ token: tokenOf(repo), tree, owed: { ...owed, e2e: { whole: true, specs: [] } } })
        .code,
    ).toBe(CRITERION_2_PARTIAL);

    // AN ENTRY WITH NO SCOPE GRADED THE WHOLE LEG AND COVERS ANY SUBSET,
    // which is what makes this arm additive rather than a new demand on
    // every token that already exists.
    recordVerdicts([{ ...entryFor("e2e", "GREEN"), targets: 1 }], repo);
    expect(
      judgeToken({
        token: tokenOf(repo),
        tree,
        owed: { ...owed, e2e: { whole: true, specs: [] } },
      }).state,
    ).toBe("fresh");

    // THE FIVE EARLIER REASONS ARE UNRENAMED AND STILL REACHABLE WITH AN
    // OWED SET IN HAND — additive, in the card's own word.
    recordVerdicts([{ ...entryFor("parser", "RED"), targets: 1 }], repo);
    expect(judgeToken({ token: tokenOf(repo), tree, owed }).code).toBe("token-red");
    expect(judgeToken({ token: tokenOf(repo), tree: "0".repeat(40), owed }).code).toBe(
      "token-stale",
    );
    expect(judgeToken({ problem: "none", tree, owed }).code).toBe("token-missing");
  } finally {
    dropRepo(repo);
  }
});


// ── THE CI SIDE: EVENT -> RANGE -> PLAN -> SHARDS (T-294) ────────────

test("the argv the runner sends is the criterion's own spelling, built once", () => {
  // THE COMMAND IN THE RUNNER'S LOG AND THE COMMAND A SEAT RE-RUNS AT
  // HOME ARE ONE DERIVATION. `ci-owed.mjs` spawns this module rather
  // than importing it precisely so the log carries a line somebody can
  // paste, and the flags come off this module's own constants — a
  // retyped `--owed-set` is a second spelling waiting to drift.
  const argv = owedSetArgv("BASE..TIP", "/some/tree");
  expect(argv[0]).toMatch(/(^|\/)gate-run\.mjs$/);
  expect(argv.slice(1)).toEqual([OWED_SET_FLAG, RANGE_FLAG, "BASE..TIP", TREE_FLAG, "/some/tree"]);
});

test("every event either names THE RANGE RULE's own pair or owes the whole battery, with the reason", () => {
  const A = "a".repeat(40);
  const B = "b".repeat(40);

  // A PUSH IS THE INTEGRATOR'S ROW OF THE RANGE RULE'S TABLE. GitHub's
  // `before` is the branch's tip BEFORE this push, so `before..sha` is
  // what the push ADDED — never `<merge-base>..<tip>`, never
  // `<main>..HEAD` between divergent tips.
  expect(rangeForEvent({ eventName: "push", before: A, sha: B })).toEqual({ range: `${A}..${B}` });

  // A PULL REQUEST'S BASE IS AN ANCESTOR OF THE MERGE REF GitHub builds.
  expect(rangeForEvent({ eventName: "pull_request", baseSha: A, sha: B })).toEqual({
    range: `${A}..${B}`,
  });

  // EVERY OTHER ANSWER IS THE WHOLE BATTERY, AND CARRIES ITS REASON.
  // This is the derivation's own fail-closed direction, inherited: it
  // may be wrong by owing too MUCH and never by owing too little.
  const wholes: [Record<string, string>, RegExp][] = [
    [{ eventName: "schedule", sha: B }, /nightly net/],
    [{ eventName: "push", before: "0".repeat(40), sha: B }, /all-zero `before`/],
    [{ eventName: "push", before: "not-a-sha", sha: B }, /not a commit id/],
    [{ eventName: "push", before: A, sha: "" }, /not a commit id/],
    [{ eventName: "pull_request", baseSha: "", sha: B }, /not a commit id/],
    [{ eventName: "workflow_dispatch", sha: B }, /no pair of commits/],
    [{ eventName: "release", sha: B }, /no pair of commits/],
  ];
  for (const [event, why] of wholes) {
    const answer = rangeForEvent(event);
    expect("whole" in answer, `${JSON.stringify(event)} owes the whole battery`).toBe(true);
    expect("whole" in answer ? answer.whole : "", JSON.stringify(event)).toMatch(why);
  }

  // AND THE EMPTY CALL IS NOT A RANGE EITHER — the shape a missing
  // environment produces, which is the one an `if:` would silently read
  // as "nothing owed".
  expect("whole" in rangeForEvent()).toBe(true);
  expect("whole" in rangeForEvent({})).toBe(true);
});

test("the shard split is deterministic, covers every spec exactly once, and never emits an empty shard", () => {
  const specs = ["e", "a", "d", "b", "c"];
  const three = shardSpecs(specs, 3);
  expect(three, "round robin over the SORTED list, so the split is a function of the set").toEqual([
    ["a", "d"],
    ["b", "e"],
    ["c"],
  ]);
  // THE SAME SET GIVES THE SAME SPLIT, whatever order it arrives in —
  // which is what makes a re-run of one shard mean the same thing.
  expect(shardSpecs([...specs].reverse(), 3)).toEqual(three);

  // A PARTITION: every spec once, none invented, none dropped.
  expect(three.flat().sort()).toEqual([...specs].sort());

  // FEWER SPECS THAN SHARDS YIELDS FEWER SHARDS, never an idle runner
  // holding an empty argument list — `npm test --` with no paths runs
  // the WHOLE leg, which is the safe direction and not the asked one.
  expect(shardSpecs(["only"], 4)).toEqual([["only"]]);
  expect(shardSpecs([], 4)).toEqual([]);
  for (const bad of [0, -3, Number.NaN]) {
    expect(shardSpecs(["a", "b"], bad), `${String(bad)} shards is one shard`).toEqual([["a", "b"]]);
  }

  // AND THE PATHS ARE SPELLED FROM THE LEG'S OWN DIRECTORY, by the same
  // function that scopes a lane's reading — never by a second strip.
  expect(specsFromLegDir([`${GRADED_SUITES.e2e.cwd}/tests/x.spec.ts`])).toEqual([
    "tests/x.spec.ts",
  ]);
});

test("the plan runs the suites the range owes, and the whole battery when it owes one", () => {
  const owed = {
    suites: ["e2e", "parser"],
    e2e: { whole: false, specs: [`${GRADED_SUITES.e2e.cwd}/tests/b.spec.ts`, `${GRADED_SUITES.e2e.cwd}/tests/a.spec.ts`] },
  };
  const plan = ciPlan({ owed, range: "A..B", shardCount: 2 });
  expect(plan.suites).toEqual(["e2e", "parser"]);
  expect(plan.e2eWhole).toBe(false);
  expect(plan.specCount).toBe(2);
  expect(plan.shards).toEqual([
    { shard: 1, shards: 2, specs: "tests/a.spec.ts" },
    { shard: 2, shards: 2, specs: "tests/b.spec.ts" },
  ]);

  // THE BOOT CHECK IS DERIVED FROM THE CHANGED PATHS, and it is a
  // SUPERSET of BOOT GATE's own trigger by construction: every path that
  // trigger names lies under the app or rust package root, so a changed
  // path this derivation places into either suite covers all of them.
  // Wrong in the permitted direction, never in the other.
  expect(plan.boot, "no changed path lies under app/ or app/src-tauri/").toBe(false);
  for (const p of [
    "app/src/App.tsx",
    "app/src-tauri/src/lib.rs",
    "app/package.json",
    "app/src-tauri/Cargo.toml",
  ]) {
    expect(ciPlan({ owed, changed: [p] }).boot, `${p} owes the boot check`).toBe(true);
  }

  // AND THE PATHS, NOT THE SUITES — the case a suite-keyed test calls
  // equivalent and is not. The DOCS GATE's reader map owes the APP suite
  // for a change under docs/tasks/, because the app's dogfood bodies
  // parse the live cards; keyed to the suite, EVERY records-only push
  // dragged in the apt prerequisites, the cargo cache and a tauri build.
  expect(
    ciPlan({ owed: { ...owed, suites: ["app", "parser"] }, changed: ["docs/tasks/T-1-x.md"] }).boot,
    "a records-only push owes the app suite and NOT the boot check",
  ).toBe(false);
  expect(BOOT_SUITES.every((id) => ALL_SUITES.includes(id))).toBe(true);
  for (const id of BOOT_SUITES) {
    const dir = PACKAGE_ROOTS[id];
    expect(suiteOfPath(`${String(dir)}/x`), `${String(dir)} places into ${id}`).toBe(id);
  }

  // THE WHOLE BATTERY: every graded suite, and the leg's WHOLE spec set
  // sharded — a nightly that ran a subset would be the same subset the
  // pushes already ran.
  const all = ciPlan({
    owed: undefined,
    why: "a schedule trigger",
    shardCount: 3,
    allSpecs: specFiles(),
  });
  expect(all.suites).toEqual([...ALL_SUITES]);
  expect(all.whole).toBe(true);
  expect(all.e2eWhole).toBe(true);
  expect(all.boot).toBe(true);
  expect(all.why).toContain("a schedule trigger");
  expect(all.specCount, "every spec in the tree").toBe(specFiles().length);
  expect(all.shards.length).toBe(3);
  expect(
    all.shards.flatMap((sh) => sh.specs.split(" ")).sort(),
    "the whole leg, partitioned across the shards",
  ).toEqual(specsFromLegDir(specFiles()).sort());

  // A LEG THAT IS NOT OWED STILL EMITS ONE ENTRY, so the matrix expands
  // to something — the job's own `if:` is what skips it, and a matrix
  // that expands to nothing is a workflow-level error.
  const noLeg = ciPlan({ owed: { suites: ["parser"], e2e: { whole: false, specs: [] } } });
  expect(noLeg.shards).toEqual([{ shard: 1, shards: 1, specs: "" }]);
  expect(noLeg.specCount).toBe(0);

  // AND A FAIL-CLOSED DERIVATION CARRIES ITS REASON INTO THE PLAN.
  const closed = ciPlan({
    owed: { suites: [...ALL_SUITES], e2e: { whole: true, specs: [] }, failClosed: "it cannot place x" },
    allSpecs: specFiles(),
  });
  expect(closed.why).toBe("it cannot place x");
});

test("the job switches the workflow reads are one per graded suite, and every one is emitted", () => {
  // THE SILENT-SKIP FAILURE, FROM THIS SIDE. GitHub reads an `if:` over
  // an output that was never written as the EMPTY STRING, which is never
  // `'true'` — so a suite whose switch this program forgets to emit is a
  // suite that never runs again, on every push, silently. The keys are
  // DERIVED from the registry so a fifth suite arrives with its own.
  const plan = ciPlan({ owed: { suites: ["parser"], e2e: { whole: false, specs: [] } }, range: "A..B" });
  const lines = outputLines(plan);
  const keys = lines.filter((l) => !l.startsWith("CI_OWED_EOF")).map((l) => l.split(/[=<]/)[0]);
  for (const id of ALL_SUITES) {
    expect(keys, `a switch for the graded suite ${id}`).toContain(`run-${id}`);
  }
  expect(lines).toContain("run-parser=true");
  expect(lines).toContain("run-e2e=false");
  expect(lines).toContain("range=A..B");
  expect(lines).toContain("shard-count=0");

  // A REASON IS ONE LINE, ALWAYS. GitHub's `key=value` output form ends
  // at a newline, so a multi-line reason spliced in raw would truncate
  // the plan — and everything after it would be read as more keys.
  const wordy = ciPlan({
    owed: undefined,
    why: "line one\nline two\n  and three",
    allSpecs: specFiles(),
  });
  const why = outputLines(wordy).find((l) => l.startsWith("why="));
  expect(why, "the reason is emitted").toBeDefined();
  expect(String(why)).toBe("why=line one line two and three");
  expect(outputLines(wordy).every((l) => !l.includes("\n"))).toBe(true);
});

test("the shard count comes from the workflow's own env, and a nonsense value is the default", () => {
  expect(shardCountFromEnv({})).toBe(DEFAULT_SHARD_COUNT);
  expect(shardCountFromEnv({ [SHARD_COUNT_ENV]: "6" })).toBe(6);
  for (const bad of ["0", "-2", "two", "", "2.5"]) {
    expect(shardCountFromEnv({ [SHARD_COUNT_ENV]: bad }), bad).toBe(DEFAULT_SHARD_COUNT);
  }
});

test("a derivation that FAILED CLOSED arms the boot check too, because a path nobody could place is a path nobody can clear the app of", () => {
  // ── THE INVARIANT, AND THE ONE LEG THAT IS OUTSIDE IT ──────────────
  // `ci-owed.mjs`'s own header states the rule: every inability lands on
  // MORE work, never on less. The graded suites obey it — a path the
  // derivation cannot place makes `suites` the whole battery and
  // `e2e.whole` true, and the reason travels into `why`. THE BOOT SWITCH
  // IS DECIDED BY A SECOND RULE, `changed.some(...)` over the package
  // roots, and an unplaceable path lies under no package root BY
  // DEFINITION — so the very input that owes everything is the input
  // that second rule answers `false` for.
  //
  // MEASURED, at the base of this body: a push whose only changed path
  // is the workflow file derives `suites` app,e2e,parser,rust with
  // `e2e-whole` true and `run-boot` FALSE, where the same push before
  // the job graph existed ran the boot step unconditionally.
  const unplaceable = ".github/workflows/ci.yml";
  expect(suiteOfPath(unplaceable), "it lies under no package root").toBe(undefined);

  const closed = ciPlan({
    owed: {
      suites: [...ALL_SUITES],
      e2e: { whole: true, specs: [] },
      failClosed: `the derivation cannot place ${unplaceable}`,
    },
    changed: [unplaceable],
    allSpecs: specFiles(),
  });
  expect(closed.suites, "the whole battery, which is what failing closed means").toEqual([
    ...ALL_SUITES,
  ]);
  expect(closed.e2eWhole, "and the leg whole with it").toBe(true);
  expect(
    closed.boot,
    "and the boot check with it — a fail-closed answer may owe too much and never too little",
  ).toBe(true);

  // THE CONTROL, and the arming is the fail-closed sentence and nothing
  // else: the SAME shape without it, over a changed path outside app/
  // and app/src-tauri/, still owes no boot check. So this body cannot be
  // satisfied by making the switch unconditional.
  const derived = ciPlan({
    owed: { suites: ["e2e"], e2e: { whole: false, specs: [] } },
    changed: ["tools/e2e/tests/x.spec.ts"],
    allSpecs: specFiles(),
  });
  expect(
    derived.boot,
    "a DERIVED answer over a path under neither boot root owes no boot check",
  ).toBe(false);
});

test("the seam between the derivation and the plan refuses every answer that is not a set", () => {
  // ── WHERE A FAIL-CLOSED PROPERTY DIES ─────────────────────────────
  // The derivation fails closed in its own process and says so in its
  // own words; this file reads that across a SPAWN and a JSON parse.
  // Every shape that is not a set has to arrive here as a `problem`,
  // because `derive` turns a problem into THE WHOLE BATTERY and turns
  // anything it accepts into the plan. A caller that read "no suites"
  // out of a crash would owe NOTHING on the push that owed everything.
  const range = `${"a".repeat(40)}..${"b".repeat(40)}`;
  /** @param stdout what the spawned derivation printed */
  const answering = (stdout: string, status: number | null = 0, stderr = "") =>
    () => ({ status, stdout, stderr });

  const good = askOwedSet(
    range,
    repoRoot,
    answering(JSON.stringify({ suites: ["parser"], e2e: { whole: false, specs: [] } })),
  );
  expect("owed" in good, "a well-formed set is the one shape that becomes a plan").toBe(true);

  const notASet: [string, Parameters<typeof askOwedSet>[2]][] = [
    ["a derivation that printed nothing at all", answering("")],
    ["a derivation that printed prose", answering("cannot place x\n", 2)],
    ["a derivation that answered a problem", answering(JSON.stringify({ problem: "refused" }))],
    ["an answer carrying no `suites` at all", answering(JSON.stringify({ e2e: { whole: true } }))],
    ["an answer whose `suites` is not an array", answering(JSON.stringify({ suites: "parser" }))],
    ["a spawn that never ran", answering("", null, "spawn ENOENT")],
    ["an answer that is JSON but not an object", answering("null")],
  ];
  for (const [name, spawn] of notASet) {
    const answer = askOwedSet(range, repoRoot, spawn);
    expect("problem" in answer, `${name} must arrive as a problem`).toBe(true);
  }

  // AND THE ARGV THIS SEAM SENDS IS THE ONE THE CRITERION SPELLS — read
  // off the call rather than off the function that builds it, so a seam
  // that assembled its own command would red here.
  let sent: string[] = [];
  askOwedSet(range, repoRoot, (a) => {
    sent = a;
    return { status: 0, stdout: JSON.stringify({ suites: [] }), stderr: "" };
  });
  expect(sent).toEqual(owedSetArgv(range, repoRoot));
});
