import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";
import { repoRoot } from "../preflight";

/**
 * Workflow parity (T-020 plan §4.7, rebuilt by T-045) — no browser: the
 * dormant .github/workflows/ci.yml cannot execute before the repo's first
 * GitHub push (no remote exists), so THIS spec is its machine validation.
 *
 * These are FACTS ABOUT THE ONE CI JOB: valid YAML, the pinned runner, the
 * commands and their order, the SHA pins, the apt set, the boot step. The
 * rules EVERY workflow file obeys — the GITHUB_TOKEN scope — live next
 * door in workflow-permissions.spec.ts, because they are not about ci.yml
 * (T-045 criterion 3).
 *
 * ── WHAT T-045 CHANGED ───────────────────────────────────────────────
 * The expected commands used to be a sixteen-entry array with a comment
 * saying it mirrored docs/CONVENTIONS.md "Build & test". A mirror agrees
 * with whatever it was last copied from: the workflow and the spec could
 * agree with each other while both drifted from the doc that governs them
 * — and did (the doc listed `npm run typecheck` for tools/e2e, which no
 * CI step ran). The list is now PARSED out of that section, so the doc is
 * the only place a command is written down, and the deliberate
 * divergences are an explicit, argued mapping (CI_SEQUENCE below) rather
 * than an untracked difference. Reword a command in CONVENTIONS and this
 * spec goes red naming both sides — pinned by the fixtures at the end.
 *
 * ── WHAT T-054 CHANGED ───────────────────────────────────────────────
 * 1. `nputer-index index --check` joins CI_SEQUENCE after the cargo
 *    suite. CI had NEVER gated graph currency: ci.yml runs bare `cargo
 *    test`, which skips `#[ignore]`d tests, and `self_graph_is_current`
 *    — the one byte-comparison against the committed graph.json — is
 *    `#[ignore]`d. A stale graph passed green, because the dogfood
 *    fixtures assert against the committed graph and a stale graph
 *    agrees with fixtures that match it. `index --watch` and `arch` are
 *    LOCAL_ONLY: a watcher runs until stopped, and `arch` reports from
 *    the committed graph rather than gating.
 * 2. Two of the four divergences CLOSED — the lint and the boot check
 *    were only CI spelling a documented command a second way, so both
 *    now invoke the documented command (the xvfb wrapper stays real).
 *    What remains are the two ENVIRONMENT differences the doc always
 *    claimed: `npm ci` for app/, and playwright's `--with-deps`.
 * 3. The derivation stopped being SILENT about structure. T-045's
 *    verifier attacked it twenty-four ways; 18 red loudly, 3 are
 *    correctly tolerated, and 3 were invisible (problems=0, steps=17) —
 *    all one shape, a command ARRIVING somewhere `commandBullets` does
 *    not look, because it splits on a newline followed by "- " at
 *    COLUMN 0. Indented bullets and fenced blocks inside "Build & test"
 *    now push a problem naming the structure (structuralProblems).
 */

interface WorkflowStep {
  name?: string;
  uses?: string;
  run?: string;
  "working-directory"?: string;
  env?: Record<string, string>;
  with?: Record<string, unknown>;
}

/** A workflow step's identity for parity purposes: what it runs, where. */
interface Step {
  dir: string | undefined;
  run: string;
}

const stepKey = (s: Step): string => `[${s.dir ?? "(root)"}] ${s.run}`;
const docKey = (dir: string, cmd: string): string => `[${dir}] ${cmd}`;

// ── reading docs/CONVENTIONS.md ────────────────────────────────────────

export function readConventions(): string {
  return readFileSync(path.join(repoRoot, "docs", "CONVENTIONS.md"), "utf8");
}

/**
 * The "Build & test" section, verbatim. THROWS if it is missing or empty:
 * a derivation that silently expects nothing is worse than the array it
 * replaced, so the one input everything else reads is checked first.
 */
export function buildAndTestSection(md: string): string {
  const section = md
    .split(/^## /m)
    .find((s) => s.startsWith("Build & test"))
    ?.replace(/^Build & test[^\n]*\n/, "");
  if (section === undefined || section.trim() === "") {
    throw new Error(
      'docs/CONVENTIONS.md has no non-empty "## Build & test" section — the ' +
        "workflow parity spec derives every expected command from it, so a " +
        "renamed or emptied section is a hard failure, never an empty expectation.",
    );
  }
  return section;
}

/**
 * The per-package command bullets of that section: a bullet marked
 * `run from <dir>/:` followed by `·`-separated backticked commands.
 *
 * The rule is the doc's own typography and it is deliberately strict —
 * the command list ends at the first `·` segment that does not open with
 * a backtick, so the tools/e2e bullet's trailing `Exit 0 booted · 1 the
 * boot failed · …` legend is prose, not commands, and a command that
 * loses its backticks disappears from the list (which reds this spec)
 * instead of being guessed at.
 */
export function commandBullets(section: string): { dir: string; commands: string[] }[] {
  const bullets = section
    .split(/\n(?=- )/)
    .map((b) => b.replace(/\s+/g, " ").trim())
    .filter((b) => b.startsWith("- "));
  const out: { dir: string; commands: string[] }[] = [];
  for (const bullet of bullets) {
    const marker = /run from ([A-Za-z0-9._/-]+)\/:/.exec(bullet);
    if (marker === null) continue;
    const commands: string[] = [];
    for (const segment of bullet.slice(marker.index + marker[0].length).split("·")) {
      const trimmed = segment.trim();
      if (!trimmed.startsWith("`")) break;
      const span = /^`([^`]+)`/.exec(trimmed);
      if (span === null) break;
      commands.push(span[1]!);
    }
    out.push({ dir: marker[1]!, commands });
  }
  return out;
}

/**
 * The structures `commandBullets` CANNOT see, named out loud (T-045-s4).
 *
 * The splitter is `\n(?=- )` — a newline followed by "- " at COLUMN 0 —
 * so anything INDENTED is glued to the preceding bullet's chunk and read
 * as that bullet's prose, and a fenced block is just more prose. T-045's
 * verifier measured the consequence: of twenty-four attacks on the
 * derivation, 18 red loudly and 3 are correctly tolerated, but 3 were
 * SILENT — an indented sub-bullet, an indented sub-bullet carrying its
 * own `run from <dir>/:` marker, and a fenced block after a bullet. Each
 * derived `problems=0` with the step list unchanged: the doc grew a
 * command and the lane said nothing. That asymmetry is the dangerous
 * one, because writing NEW commands into that section is exactly how
 * this mechanism is maintained — a command that ARRIVES in an unread
 * shape is the one that stays invisible.
 *
 * This teaches the parser no markdown. It flags the two SHAPES and says
 * what to do, the way a fifth `run from` bullet already does.
 *
 * The rule is the splitter's own, not markdown's: only a leading "- " is
 * a bullet here. `+` and `*` are deliberately NOT flagged — the section
 * legitimately wraps prose onto a line beginning "  + nputer-index crate
 * suite", and a rule that reds on real prose teaches editors to route
 * around it.
 */
export function structuralProblems(section: string): string[] {
  const problems: string[] = [];
  section.split("\n").forEach((line, i) => {
    const where = `docs/CONVENTIONS.md "Build & test" line ${i + 1} (of the section)`;
    if (/^[ \t]+- /.test(line)) {
      problems.push(
        `${where} is an INDENTED BULLET: ${JSON.stringify(line.trim().slice(0, 48))}. ` +
          'The derivation splits on a newline followed by "- " at COLUMN 0, so an ' +
          "indented bullet is glued to the preceding bullet's prose — every command " +
          "on it is INVISIBLE to CI parity, and so is a `run from <dir>/:` marker of " +
          "its own. Unindent it, or fold it into its parent bullet.",
      );
    }
    if (/^[ \t]*```/.test(line)) {
      problems.push(
        `${where} carries a CODE FENCE. The derivation reads \`·\`-separated ` +
          "backticked commands out of bullet prose and never looks inside a fence, " +
          "so commands in one are INVISIBLE to CI parity. Put them in a " +
          "`run from <dir>/:` bullet instead.",
      );
    }
  });
  return problems;
}

/**
 * The section's CI bullet — where a reader goes to learn how CI differs
 * from local. Every disposition that is not "verbatim" has to be written
 * down THERE, not merely somewhere in the doc: a divergence buried in
 * another bullet is one the next editor of ci.yml will not meet.
 */
export function ciBullet(section: string): string {
  const bullet = section
    .split(/\n(?=- )/)
    .map((b) => b.replace(/\s+/g, " ").trim())
    .find((b) => b.startsWith("- CI (.github/workflows/ci.yml)"));
  return bullet ?? "";
}

// ── the CI correspondence: the doc's commands, and how CI runs them ────

type Correspondence =
  /** CI runs this CONVENTIONS command as written, in the same directory. */
  | { kind: "verbatim"; dir: string; cmd: string }
  /** CI runs it differently. The divergence is argued here AND documented
   *  in CONVENTIONS' CI bullet — the derivation checks the second half, so
   *  a divergence cannot live in the test alone. */
  | { kind: "mapped"; dir: string; cmd: string; steps: Step[]; why: string }
  /** A step CI adds that no per-package bullet lists, documented elsewhere
   *  in the same section. */
  | { kind: "ci-only"; step: Step; why: string };

/**
 * Every expected run step, in the order ci.yml runs them (plan §7: token
 * lint → parser → app → cargo test → cargo audit → e2e → xvfb boot).
 * ORDER is a fact about the one CI job, so it lives here; the command
 * STRINGS are read out of CONVENTIONS.
 */
const CI_SEQUENCE: Correspondence[] = [
  {
    kind: "mapped",
    dir: "tools/e2e",
    cmd: "npm run lint:tokens",
    steps: [
      { dir: "tools/e2e", run: "npm run lint:tokens -- --selftest" },
      { dir: "tools/e2e", run: "npm run lint:tokens" },
    ],
    why:
      "NOT a divergence since T-054 (T-045-s1) — CI used to spell this as a " +
      "direct `node scripts/lint-tokens.mjs`, which was the same command " +
      "written a second way. It is still the job's FIRST step, ahead of every " +
      "`npm ci`, because `npm run` needs no installed node_modules (it only " +
      "extends PATH), and still TWO steps, because `--selftest` short-circuits " +
      "the walk. The `--` is load-bearing: npm eats a bare flag after a script " +
      "name (T-046, measured on npm 11.12.1).",
  },
  { kind: "verbatim", dir: "lib/parser", cmd: "npm ci" },
  { kind: "verbatim", dir: "lib/parser", cmd: "npx vitest run" },
  { kind: "verbatim", dir: "lib/parser", cmd: "npx tsc --noEmit" },
  { kind: "verbatim", dir: "lib/parser", cmd: "npm run build" },
  {
    kind: "mapped",
    dir: "app",
    cmd: "npm install",
    steps: [{ dir: "app", run: "npm ci" }],
    why: "DIVERGENCE 1: lockfile-exact installs in CI, everywhere.",
  },
  { kind: "verbatim", dir: "app", cmd: "npm run build" },
  { kind: "verbatim", dir: "app", cmd: "npm test" },
  { kind: "verbatim", dir: "app/src-tauri", cmd: "cargo test" },
  // THE GRAPH-CURRENCY GATE (T-054), placed immediately after the cargo
  // suite: the suite is what builds the crate, and a stale graph is news
  // before the audit spends a minute installing a tool. It is VERBATIM on
  // purpose — the `--root ../..` is part of the documented command, not a
  // CI adaptation, because without it the default root is the current
  // directory and the check reports the graph MISSING and exits 1, which
  // is a FALSE RED that reads exactly like staleness.
  {
    kind: "verbatim",
    dir: "app/src-tauri",
    cmd: "cargo run -p nputer-index -- index --check --root ../..",
  },
  {
    kind: "ci-only",
    step: { dir: "app/src-tauri", run: "cargo install cargo-audit --locked" },
    why:
      "the one-time local dev-tool setup, run per job because a fresh runner " +
      "has no ~/.cargo/bin. A dev tool, never a repo dep (T-009-s3).",
  },
  { kind: "verbatim", dir: "app/src-tauri", cmd: "cargo audit" },
  { kind: "verbatim", dir: "tools/e2e", cmd: "npm ci" },
  { kind: "verbatim", dir: "tools/e2e", cmd: "npm run typecheck" },
  {
    kind: "ci-only",
    step: { dir: "tools/e2e", run: "npx playwright install --with-deps chromium" },
    why:
      "DIVERGENCE 2: the local one-time form is `npx playwright install " +
      "chromium`; `--with-deps` adds the Linux system libs a fresh runner lacks.",
  },
  { kind: "verbatim", dir: "tools/e2e", cmd: "npm test" },
  {
    kind: "mapped",
    dir: "tools/e2e",
    cmd: "npm run boot:check",
    steps: [{ dir: "tools/e2e", run: "xvfb-run -a npm run boot:check" }],
    why:
      "NOT a divergence since T-054 (T-045-s1) — CI used to spell this as " +
      "`xvfb-run -a node tools/e2e/scripts/tauri-boot-check.mjs` from the repo " +
      "root, a second spelling of the documented command. The xvfb WRAPPER is " +
      "real and stays: a headless runner has no display. Both scripts resolve " +
      "the repo root from import.meta.url rather than process.cwd(), so " +
      "invoking them through npm from tools/e2e is behaviourally identical. " +
      "LAST, so the cargo cache warms its build.",
  },
];

/**
 * CONVENTIONS commands that are deliberately NOT CI steps. Listed so the
 * doc's list is fully accounted for — an unlisted command is a hole, and
 * a silently-dropped one is the hole this task exists to close. Asserted
 * ABSENT from the workflow below, not merely omitted here.
 */
const LOCAL_ONLY: { dir: string; cmd: string; why: string }[] = [
  {
    dir: "app",
    cmd: "npm run tauri dev",
    why: "opens a real window; the xvfb boot step covers the dev path in CI.",
  },
  {
    dir: "app",
    cmd: "npm run tauri build",
    why: "packages a bundle — minutes of work no gate reads (T-046-s3).",
  },
  {
    dir: "app/src-tauri",
    cmd: "cargo run -p nputer-index -- index --watch --root ../..",
    why:
      "a watcher: it blocks until stopped, so a CI step invoking it would hang " +
      "until the job timeout. `index --check` is the one-shot form and IS a " +
      "step (T-054).",
  },
  {
    dir: "app/src-tauri",
    cmd: "cargo run -p nputer-index -- arch --root ../..",
    why:
      "a REPORTER, not a gate: it reads the COMMITTED graph and always exits 0 " +
      "(ADR-014). Its gating form is `arch drift --fail-on <sev>`, deliberately " +
      "unwired while the registry carries live undeclared edges — wiring it " +
      "would red CI on drift the architect is holding open on purpose (T-054).",
  },
];

/**
 * Run steps that are infrastructure, not CONVENTIONS commands: the job
 * has to exist before it can invoke anything. Enumerated so that "every
 * run step is either derived from the doc or argued here" can be a real
 * assertion — otherwise a step could be smuggled into ci.yml unread.
 */
const INFRASTRUCTURE_STEPS: { match: RegExp; why: string }[] = [
  { match: /^sudo apt-get update/, why: "the Tauri v2 Linux prerequisites + xvfb." },
  { match: /^rustc --version/, why: "records the runner's preinstalled toolchain." },
];

/** The doc's own command list, flattened. */
function docCommandMap(section: string): Map<string, { dir: string; cmd: string }> {
  const map = new Map<string, { dir: string; cmd: string }>();
  for (const { dir, commands } of commandBullets(section)) {
    for (const cmd of commands) map.set(docKey(dir, cmd), { dir, cmd });
  }
  return map;
}

/** The four per-package bullets the section must carry, in order. */
const DOC_DIRS = ["lib/parser", "app", "app/src-tauri", "tools/e2e"];

/**
 * The expected workflow steps, DERIVED from docs/CONVENTIONS.md, plus
 * every reason the derivation could not be trusted. `problems` empty is
 * the assertion; each entry names the side that moved and what to do.
 */
export function deriveExpectedSteps(md: string): { steps: Step[]; problems: string[] } {
  const section = buildAndTestSection(md);
  const ci = ciBullet(section);
  const doc = docCommandMap(section);
  const problems: string[] = [];
  if (ci === "") {
    problems.push(
      'docs/CONVENTIONS.md "Build & test" has no `- CI (.github/workflows/' +
        "ci.yml)` bullet — that bullet is where every divergence between the " +
        "documented commands and the workflow has to be written down.",
    );
  }

  // 0. The parse is not vacuous. Four bullets, in order, each with
  //    commands — a restructured section must fail loudly here rather
  //    than quietly derive an empty expectation every workflow satisfies.
  //    FIRST the shapes the parse cannot see at all (T-045-s4): those
  //    three attacks were the only silent ones, and silence is worse
  //    than a wrong expectation because nothing points at it.
  problems.push(...structuralProblems(section));
  const dirs = commandBullets(section).map((b) => b.dir);
  if (JSON.stringify(dirs) !== JSON.stringify(DOC_DIRS)) {
    problems.push(
      `docs/CONVENTIONS.md "Build & test" no longer carries exactly the four ` +
        `\`run from <dir>/:\` command bullets ${JSON.stringify(DOC_DIRS)} — found ` +
        `${JSON.stringify(dirs)}. The derivation reads those bullets; a fifth ` +
        `package or a renamed one is a deliberate update to this spec.`,
    );
  }
  for (const { dir, commands } of commandBullets(section)) {
    if (commands.length === 0) {
      problems.push(
        `docs/CONVENTIONS.md "Build & test" lists no commands for [${dir}] — the ` +
          "list ends at the first `·` segment that does not open with a backtick, " +
          "so a command that lost its backticks is invisible to CI parity.",
      );
    }
  }

  // 1. Every command the doc lists is accounted for, and every command
  //    this spec accounts for is still in the doc. Both directions: the
  //    first catches a NEW command CI never runs, the second catches a
  //    REWORDED or DELETED one CI still runs (T-045 criterion 2).
  const claimed = new Map<string, string>();
  for (const entry of CI_SEQUENCE) {
    if (entry.kind !== "ci-only") claimed.set(docKey(entry.dir, entry.cmd), entry.kind);
  }
  for (const entry of LOCAL_ONLY) claimed.set(docKey(entry.dir, entry.cmd), "local-only");
  for (const key of doc.keys()) {
    if (!claimed.has(key)) {
      problems.push(
        `docs/CONVENTIONS.md "Build & test" lists ${key}, which this spec has no ` +
          "entry for — add it to CI_SEQUENCE (verbatim or mapped, with the " +
          "workflow step) or to LOCAL_ONLY with the reason CI does not run it.",
      );
    }
  }
  for (const key of claimed.keys()) {
    if (!doc.has(key)) {
      problems.push(
        `this spec expects ${key}, which docs/CONVENTIONS.md "Build & test" no ` +
          "longer lists — the doc is the source of truth: a reworded or removed " +
          "command means the workflow and this spec both need the same edit.",
      );
    }
  }

  // 2. Every disposition that is not "verbatim" is documented in the DOC's
  //    CI bullet, not only argued here. A mapping this file knows about and
  //    CONVENTIONS does not is exactly the untracked difference criterion 1
  //    forbids — and the CI bullet is the one place its reader will look.
  for (const entry of CI_SEQUENCE) {
    if (entry.kind === "verbatim") continue;
    const steps = entry.kind === "mapped" ? entry.steps : [entry.step];
    for (const step of steps) {
      if (!ci.includes(`\`${step.run}\``)) {
        problems.push(
          `the workflow runs \`${step.run}\` but docs/CONVENTIONS.md "Build & ` +
            'test" never mentions it — an untracked divergence. Document it in ' +
            "the CI bullet (which enumerates them) so both sides say the same thing.",
        );
      }
    }
  }
  //    Same rule for the commands CI deliberately skips: a reader of the CI
  //    bullet must be able to see that they are skipped on purpose.
  for (const entry of LOCAL_ONLY) {
    if (!ci.includes(`\`${entry.cmd}\``)) {
      problems.push(
        `this spec says CI deliberately does not run \`${entry.cmd}\` (${entry.why}) ` +
          'but docs/CONVENTIONS.md\'s CI bullet does not say so — an omission a ' +
          "reader cannot tell from a mistake.",
      );
    }
  }

  // 3. The expected steps, with every verbatim command taken from the
  //    DOC's own text rather than restated here.
  const steps: Step[] = [];
  for (const entry of CI_SEQUENCE) {
    if (entry.kind === "ci-only") {
      steps.push(entry.step);
      continue;
    }
    const fromDoc = doc.get(docKey(entry.dir, entry.cmd));
    if (fromDoc === undefined) continue; // already reported above
    if (entry.kind === "verbatim") steps.push({ dir: fromDoc.dir, run: fromDoc.cmd });
    else steps.push(...entry.steps);
  }
  return { steps, problems };
}

/** Commands CONVENTIONS lists that must NOT appear as workflow steps. */
function localOnlySteps(): Step[] {
  return LOCAL_ONLY.map((e) => ({ dir: e.dir, run: e.cmd }));
}

// ── reading .github/workflows/ci.yml ───────────────────────────────────

/** Tauri v2 Linux prerequisites the apt step must install. */
const APT_PACKAGES = [
  "libwebkit2gtk-4.1-dev",
  "build-essential",
  "libxdo-dev",
  "libssl-dev",
  "libayatana-appindicator3-dev",
  "librsvg2-dev",
  "xvfb",
];

function loadWorkflow(): { raw: string; doc: Record<string, unknown>; steps: WorkflowStep[] } {
  const file = path.join(repoRoot, ".github", "workflows", "ci.yml");
  const raw = readFileSync(file, "utf8");
  const doc = parse(raw) as Record<string, unknown>;
  const jobs = doc.jobs as Record<string, { steps: WorkflowStep[] }>;
  const jobNames = Object.keys(jobs);
  expect(jobNames, "one ubuntu job (plan §7)").toEqual(["linux"]);
  return { raw, doc, steps: jobs.linux!.steps };
}

function runSteps(steps: WorkflowStep[]): Step[] {
  return steps
    .filter((s) => s.run !== undefined)
    .map((s) => ({ dir: s["working-directory"], run: s.run! }));
}

// ── the tests ──────────────────────────────────────────────────────────

test("ci.yml is valid YAML with the one pinned ubuntu job", () => {
  const { doc, steps } = loadWorkflow();

  // `on:` parses as YAML true — normalize.
  const on = (doc.on ?? doc[true as unknown as string]) as Record<string, unknown>;
  expect(Object.keys(on).sort()).toEqual(["pull_request", "push", "workflow_dispatch"]);
  expect((on.push as { branches: string[] }).branches).toEqual(["main"]);

  const concurrency = doc.concurrency as { group: string; "cancel-in-progress": boolean };
  expect(concurrency.group).toContain("${{ github.ref }}");
  expect(concurrency["cancel-in-progress"]).toBe(true);

  const job = (doc.jobs as Record<string, Record<string, unknown>>).linux!;
  expect(job["runs-on"], "pinned runner, not -latest").toBe("ubuntu-24.04");
  expect(job["timeout-minutes"]).toBe(45);
  expect(steps.length).toBeGreaterThan(0);
});

test("the expected commands derive cleanly from docs/CONVENTIONS.md", () => {
  const { steps, problems } = deriveExpectedSteps(readConventions());
  expect(
    problems,
    "the workflow's expected commands are PARSED out of docs/CONVENTIONS.md " +
      '"Build & test" — these are the ways the doc and this spec disagree',
  ).toEqual([]);
  // A floor on the derivation itself: NINETEEN documented commands today
  // (T-054 added three nputer-index ones), fifteen of them CI commands —
  // three of those via a mapping, one of which expands to two steps —
  // plus two CI-only steps, so eighteen expected steps.
  expect(steps.length, "derived step count").toBeGreaterThanOrEqual(18);
});

test("every CONVENTIONS command is a step, verbatim and in CI order", () => {
  const { steps: expected } = deriveExpectedSteps(readConventions());
  const actual = runSteps(loadWorkflow().steps);

  // Every derived command appears verbatim as its own step...
  for (const want of expected) {
    const found = actual.some((s) => s.dir === want.dir && s.run === want.run);
    expect.soft(found, `missing verbatim step: ${stepKey(want)}`).toBe(true);
  }

  // ...and in order: filtering the workflow's run steps to the expected
  // set must reproduce the expected sequence exactly.
  const filtered = actual.filter((s) => expected.some((w) => w.dir === s.dir && w.run === s.run));
  expect(filtered).toEqual(expected);
});

test("the workflow runs nothing beyond the derived commands and its infrastructure", () => {
  const { steps: expected } = deriveExpectedSteps(readConventions());
  const actual = runSteps(loadWorkflow().steps);

  const unaccounted = actual.filter(
    (s) =>
      !expected.some((w) => w.dir === s.dir && w.run === s.run) &&
      !INFRASTRUCTURE_STEPS.some((i) => i.match.test(s.run)),
  );
  expect(
    unaccounted.map(stepKey),
    "ci.yml is a THIN INVOKER of the CONVENTIONS commands — a step that is " +
      "neither derived from the doc nor listed as infrastructure is a command " +
      "nobody documented",
  ).toEqual([]);

  // The commands CONVENTIONS lists that CI deliberately does not run must
  // actually be absent — LOCAL_ONLY is a claim, so it gets checked.
  const smuggled = localOnlySteps().filter((w) =>
    actual.some((s) => s.dir === w.dir && s.run === w.run),
  );
  expect(
    smuggled.map(stepKey),
    "these are listed as local-only in this spec but the workflow runs them",
  ).toEqual([]);
});

test("every `uses:` is pinned by a full 40-hex commit SHA", () => {
  const { steps } = loadWorkflow();
  const uses = steps.filter((s) => s.uses !== undefined).map((s) => s.uses!);
  expect(uses.length).toBeGreaterThanOrEqual(3); // checkout, setup-node, cache x2
  for (const ref of uses) {
    expect(ref, `unpinned action: ${ref}`).toMatch(/^[\w./-]+@[0-9a-f]{40}$/);
  }
});

test("the xvfb boot step runs the documented boot check with the webkit workaround", () => {
  const { steps } = loadWorkflow();
  const boot = steps.find((s) => s.run?.includes("boot:check"));
  expect(boot, "boot step present").toBeDefined();
  // T-054: the wrapper is real, what it wraps is the documented command.
  expect(boot!.run).toBe("xvfb-run -a npm run boot:check");
  expect(boot!["working-directory"], "npm resolves the script from tools/e2e").toBe("tools/e2e");
  expect(boot!.env?.WEBKIT_DISABLE_DMABUF_RENDERER).toBe("1");
  // LAST step — the cargo cache from the test step warms its build.
  expect(steps[steps.length - 1]).toBe(boot);
});

test("the apt step installs the Tauri v2 webkit2gtk set + xvfb", () => {
  const { steps } = loadWorkflow();
  const apt = steps.find((s) => s.run?.includes("apt-get install"));
  expect(apt, "apt step present").toBeDefined();
  for (const pkg of APT_PACKAGES) {
    expect(apt!.run, `apt step must install ${pkg}`).toContain(pkg);
  }
});

// ── fixtures: the derivation actually binds (T-045 criterion 2) ────────
//
// A mutation drill run once by an executor proves an assertion fired that
// night. These are the same drills kept: synthetic CONVENTIONS texts fed
// to the real derivation, re-proven on every lane run. None of them writes
// to the doc — each one mutates a copy in memory.

test("FIXTURE: rewording a command in CONVENTIONS reds the lane, naming both sides", () => {
  const md = readConventions();
  const reworded = md.replace(
    "`npx vitest run` (suite)",
    "`npx vitest run --reporter=dot` (suite)",
  );
  expect(reworded, "the fixture must actually change the doc").not.toBe(md);

  const { steps, problems } = deriveExpectedSteps(reworded);
  const said = problems.join("\n");
  expect(said, "the NEW wording is unaccounted for").toContain(
    "lists [lib/parser] npx vitest run --reporter=dot, which this spec has no entry for",
  );
  expect(said, "the OLD wording is no longer in the doc").toContain(
    "this spec expects [lib/parser] npx vitest run, which docs/CONVENTIONS.md",
  );
  // And the derived expectation drops the stale command rather than
  // quietly keeping it — the mirror's exact failure mode.
  expect(steps.some((s) => s.run === "npx vitest run")).toBe(false);
});

test("FIXTURE: deleting a command from CONVENTIONS reds the lane", () => {
  const md = readConventions();
  const shortened = md.replace("· `npm run typecheck` ", "");
  expect(shortened, "the fixture must actually change the doc").not.toBe(md);

  const { problems } = deriveExpectedSteps(shortened);
  expect(problems.join("\n")).toContain("this spec expects [tools/e2e] npm run typecheck");
});

test("FIXTURE: an undocumented divergence reds the lane", () => {
  const md = readConventions();
  const undocumented = md.replace(
    "`npx playwright install\n  --with-deps chromium`",
    "the browser install",
  );
  expect(undocumented, "the fixture must actually change the doc").not.toBe(md);

  const { problems } = deriveExpectedSteps(undocumented);
  expect(problems.join("\n")).toContain(
    "the workflow runs `npx playwright install --with-deps chromium` but " +
      'docs/CONVENTIONS.md "Build & test" never mentions it',
  );
});

test("FIXTURE: a restructured section fails loudly, never with an empty expectation", () => {
  const md = readConventions();

  // The section renamed away entirely.
  expect(() =>
    deriveExpectedSteps(md.replace("## Build & test", "## Building and testing")),
  ).toThrow(/no non-empty "## Build & test" section/);

  // The bullets still there, but no longer marked `run from <dir>/:`.
  // (`\s+`, not a literal space: one of the four markers wraps across a
  // line in the raw file, which is why the parser normalizes first.)
  const unmarked = md.replace(/run from\s+([A-Za-z0-9._/-]+)\/:/g, "run in $1 like so —");
  const { steps, problems } = deriveExpectedSteps(unmarked);
  expect(problems.join("\n")).toContain("no longer carries exactly the four");
  // Every command the spec claims is now missing from the doc —
  // NINETEEN complaints, not silence — and nothing derived from a doc
  // command survives into the expectation.
  expect(problems.filter((p) => p.startsWith("this spec expects")).length).toBe(19);
  expect(steps.map(stepKey)).toEqual([
    "[app/src-tauri] cargo install cargo-audit --locked",
    "[tools/e2e] npx playwright install --with-deps chromium",
  ]);
});

// ── fixtures: the SILENT structures now speak (T-045-s4, taken at T-054) ─
//
// T-045's verifier attacked the derivation twenty-four ways. Eighteen red
// loudly, three are correctly tolerated, and THREE were invisible — each
// one a real command arriving in a shape `commandBullets` does not look
// at, each reporting `problems=0` with the step list unchanged. These
// three fixtures are those three attacks, kept. Each asserts BOTH halves:
// the command really is invisible (the derived steps do not move), and
// the lane now says so by NAME.

/** Splice an attack in just after the app/src-tauri bullet. */
const AUDIT_BULLET = "- AUDIT GATE POLICY";
const spliceIntoBuildAndTest = (md: string, attack: string): string =>
  md.replace(AUDIT_BULLET, attack + AUDIT_BULLET);

test("FIXTURE: an indented sub-bullet is named, not silently swallowed", () => {
  const md = readConventions();
  const attacked = spliceIntoBuildAndTest(md, "  - `cargo clippy -- -D warnings` (indented)\n");
  expect(attacked, "the fixture must actually change the doc").not.toBe(md);

  const before = deriveExpectedSteps(md);
  const after = deriveExpectedSteps(attacked);

  // The invisibility itself, pinned: the doc grew a command and the
  // expectation did not move by one step. THAT is why silence was wrong.
  expect(after.steps.map(stepKey), "the smuggled command is genuinely unread").toEqual(
    before.steps.map(stepKey),
  );
  expect(after.problems.join("\n")).toContain("is an INDENTED BULLET");
  expect(after.problems.join("\n")).toContain("cargo clippy -- -D warnings");
});

test("FIXTURE: an indented sub-bullet with its OWN `run from` marker is named", () => {
  const md = readConventions();
  const attacked = spliceIntoBuildAndTest(
    md,
    "  - extras (T-054 fixture), run from tools/extra/: `npm run smuggled`\n",
  );
  expect(attacked, "the fixture must actually change the doc").not.toBe(md);

  const before = deriveExpectedSteps(md);
  const after = deriveExpectedSteps(attacked);

  expect(after.steps.map(stepKey), "the smuggled bullet is genuinely unread").toEqual(
    before.steps.map(stepKey),
  );
  // The nastiest of the three: a whole PACKAGE bullet arrives and the
  // four-bullet guard cannot see it either, so the loudest check in the
  // derivation stays quiet. Assert that quiet, so this fixture cannot
  // pass for the wrong reason.
  expect(
    after.problems.filter((p) => p.includes("no longer carries exactly the four")),
    "the four-bullet guard is blind to an indented marker — that is the point",
  ).toEqual([]);
  expect(after.problems.join("\n")).toContain("is an INDENTED BULLET");
  expect(after.problems.join("\n")).toContain("run from <dir>/:` marker of its own");
});

test("FIXTURE: a fenced block after a bullet is named, not read as prose", () => {
  const md = readConventions();
  const attacked = spliceIntoBuildAndTest(md, "  ```\n  cargo clippy -- -D warnings\n  ```\n");
  expect(attacked, "the fixture must actually change the doc").not.toBe(md);

  const before = deriveExpectedSteps(md);
  const after = deriveExpectedSteps(attacked);

  expect(after.steps.map(stepKey), "the fenced command is genuinely unread").toEqual(
    before.steps.map(stepKey),
  );
  const fenceProblems = after.problems.filter((p) => p.includes("carries a CODE FENCE"));
  expect(fenceProblems.length, "both fence lines are flagged").toBe(2);
  expect(fenceProblems[0]).toContain("never looks inside a fence");
});
