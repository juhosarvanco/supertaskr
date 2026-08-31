import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
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
  parseVerdict,
  runSuite,
  stripAnsi,
  validateRegistry,
  validateSuite,
} from "../scripts/gate-run.mjs";

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

test("cargo's own doc-test target proves a zero-body run can print the word ok, which is why the count and never the word is read", () => {
  // The last target of the real transcript is `running 0 tests` ->
  // `test result: ok.` A green over nothing, printed by cargo itself.
  expect(CARGO_NO_FAIL_FAST).toContain("running 0 tests");
  expect(CARGO_NO_FAIL_FAST).toContain("test result: ok. 0 passed");
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

test("a verdict line missing any required field is REFUSED by the parser, naming the field it lacks", () => {
  const full = formatVerdict({
    suite: "e2e", exit: 0, bodies: 332, targets: 1, ref: "146ebb6", verdict: "GREEN", reason: "ok",
  });
  // Delete each required field in turn. Every deletion must be refused,
  // and must NAME the field — a downstream reader (T-203) that accepted
  // a token with no `bodies` would be this card's subject one layer on.
  for (const field of REQUIRED_VERDICT_FIELDS) {
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
  expect(stripAnsi("see [T-202] and [nputer-index] at 146ebb6")).toBe(
    "see [T-202] and [nputer-index] at 146ebb6",
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
  const root = mkdtempSync(path.join(tmpdir(), "t202-stale-"));
  try {
    const first = acquireSolo("rust", root);
    expect(first.ok).toBe(true);
    if (first.ok) first.release();
    const second = acquireSolo("rust", root);
    expect(second.ok).toBe(true);
    if (second.ok) second.release();
  } finally {
    rmSync(root, { recursive: true, force: true });
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

// ── §THE DOCUMENT NAMES THIS COMMAND AND NO OTHER SPELLING ───────────

test("docs/CONVENTIONS.md names the blessed gate-runner as the one spelling for running a graded suite", () => {
  // The document is the other half of criterion 1: a runner nothing
  // points at is a second spelling, not a single one.
  const text = readFileSync(path.join(repoRoot, "docs/CONVENTIONS.md"), "utf8");
  expect(text).toContain("gate-run.mjs");
  expect(text).toContain(VERDICT_TOKEN);
});
