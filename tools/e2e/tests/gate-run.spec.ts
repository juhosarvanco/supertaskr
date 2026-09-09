import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import {
  EXIT,
  GRADED_SUITES,
  REQUIRED_VERDICT_FIELDS,
  VERDICT_TOKEN,
  acquireSolo,
  countBodies,
  countCargo,
  countPlaywright,
  formatVerdict,
  judge,
  lockPath,
  parseVerdict,
  recordVerdicts,
  runSuite,
  stripAnsi,
  validateRegistry,
  validateSuite,
} from "../scripts/gate-run.mjs";
import {
  GREEN,
  REQUIRED_SUITES,
  TOKEN_REL_PATH,
  TOKEN_VERSION,
  headTree,
  judgeToken,
  readToken,
} from "../../../.claude/hooks/gate-token.mjs";

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
  const lane = "/x/nputer-T-223-s3";
  const bench = "/x/nputer-V-T-223-s3";
  expect(lockPath(lane)).not.toBe(lockPath(bench));
  // ...while ONE root twice is ONE lock, or the guard above stops being
  // a guard. (Symmetric on purpose, and its control is assertion-side:
  // purity is a PRECONDITION of the two bodies above, so every code-side
  // break of it reds them too. The cross-process half is the body below.)
  expect(lockPath(lane)).toBe(lockPath(lane));
  // A parent directory is part of the path as much as a basename is:
  // two checkouts of the same NAME under different parents are two
  // checkouts, and a key reading only the last segment merges them.
  expect(lockPath("/a/nputer-T-223-s3")).not.toBe(lockPath("/b/nputer-T-223-s3"));
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
  const deep = `/x/${"deep-".repeat(40)}nputer-T-223-s3`;
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
  const text = readFileSync(path.join(repoRoot, "docs/CONVENTIONS.md"), "utf8");
  expect(occurrences(text, "gate-run.mjs")).toBe(1);
  expect(occurrences(text, VERDICT_TOKEN)).toBe(1);
});

test("the suites the document offers the runner are exactly the suites the runner grades, so the two cannot drift apart", () => {
  // A third independent source for criterion 1: the DOCUMENT's own list,
  // checked against the card's, so neither the doc nor the registry can
  // move alone.
  const text = readFileSync(path.join(repoRoot, "docs/CONVENTIONS.md"), "utf8");
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
