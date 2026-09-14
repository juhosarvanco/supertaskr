import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  ACTIVE_RUN_STATUSES,
  ANNOUNCED_ALLOW_CODES,
  ANNOUNCED_RED_CONCLUSIONS,
  BATTERY_SECONDS,
  CHEAP_CHECKS_EXIT,
  CHECK_ARGV,
  CHECK_DIR_REL_PATH,
  CHECK_EXIT,
  CI_WORKFLOW_REL_PATH,
  COMPLETED_RUN_STATUS,
  E2E_SPECS_AT_MEASURE,
  E2E_SPEC_SECONDS,
  FAILED_CONCLUSION,
  GH_BIN,
  GH_EXIT,
  GH_MEASURED_MS,
  GH_TIMEOUT_MS,
  GIT_GLOBAL_OPTS_WITH_VALUE,
  GRAPH_REL_PATH,
  HEAD_REFSPEC_WORDS,
  INDEX_CRATE_MANIFEST_REL_PATH,
  LEG_SECONDS,
  NON_PUSHING_FLAGS,
  NON_VERDICT_CONCLUSIONS,
  OVER_RUN_NAME_LIMIT,
  PUSH_ALL_BRANCHES_FLAGS,
  PUSH_OPTS_WITH_VALUE,
  PUSH_REPOSITORY_OPT,
  PUSH_UNRESOLVING_FLAGS,
  RUN_LIST_JSON_FIELDS,
  RUN_LIST_REQUIRED_FIELDS,
  RUN_VIEW_JSON_FIELDS,
  UNGRADED_VERDICT,
  UNRESOLVABLE_TOKEN_RE,
  classifyGhFailure,
  commandOf,
  decide,
  elapsedSince,
  failingStep,
  ghRunListArgv,
  ghRunViewArgv,
  gitInvocations,
  gradedSpecs,
  isPush,
  laneCanRegenerate,
  newestVerdictRun,
  overRun,
  overRunNotice,
  owedCost,
  parseRunJobs,
  parseRunList,
  pathsSince,
  pushCwds,
  pushRange,
  pushTargetBranch,
  reachesPackage,
  repointedBy,
  runOwedSet,
  runStartedAt,
  segments,
  stepWorkingDirectory,
} from "../../../.claude/hooks/push-guard.mjs";
import {
  MANIFEST_REL_PATH,
  MANIFEST_VERSION,
  RUNTIME_DIR_IGNORE,
} from "../../../.claude/hooks/lane-fence.mjs";
import {
  GREEN,
  REQUIRED_SUITES,
  RUNTIME_DIR,
  TOKEN_REL_PATH,
  headTree,
  writeToken,
} from "../../../.claude/hooks/gate-token.mjs";
// T-314 — THE OTHER GUARD, AND THE ARM THAT INSTALLS IT. Imported rather
// than spawned wherever a body is about a decision; the bodies about a
// PUSH drive the real hook through a real `git push` instead, because the
// property there is what reaches a remote and not what a function
// returned.
import {
  HOOK_DIR_REL_PATH,
  HOOK_FILE_NAME,
  TREE_OWNER,
  decidePrePush,
  parseUpdates,
  updateShape,
} from "../../../.claude/hooks/pre-push-guard.mjs";
import {
  GIT_HOOK_NAMES,
  HOOKS_PATH_KEY,
  WORKTREE_CONFIG_KEY,
  hookInstallPlan,
  hookStatus,
  installHook,
} from "../../../.claude/hooks/hook-install.mjs";
import { holderVerdict, processRow, writeHolder } from "../scripts/checkout-currency.mjs";
import { repoRoot } from "../preflight";
import { fakeHarness, underHarness } from "./fake-harness";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import { conventionsBullet, conventionsFiles, conventionsText } from "../scripts/docs-scan.mjs";
// T-305 — THE VERDICT WORD IS ASKED OF THE PROGRAM THAT WRITES IT. This
// spec holds `UNGRADED_VERDICT`'s pin, and a pin against a literal in
// this file would be a pin against itself; `judge` is the function the
// runner reaches that word through. The import edge is real and is
// declared: a change to the runner now owes this spec too, which is the
// honest reading of a body that asserts against the runner's behaviour.
import { judge } from "../scripts/gate-run.mjs";

/**
 * THE PUSH ASKS THE GRAPH MECHANICALLY (T-167-s8) — no browser.
 *
 * The unit under test is `.claude/hooks/push-guard.mjs` and its runner.
 * Everything that reaches a VERDICT below is driven over a git repository
 * built in a temporary directory, with a FAKE `cargo` first on PATH — so
 * both directions of the positive control this card's seventh criterion
 * asks for are produced deliberately, and neither of them requires making
 * this repository's own graph stale.
 *
 * ── WHY THE FIXTURE CARRIES A FAKE CARGO INSTEAD OF A STUBBED FUNCTION
 * `decide` takes an injectable check-runner, and stubbing it would be
 * easier and would prove less. The property that matters is that the
 * guard READS AN EXIT CODE off a real process — the whole prohibition
 * this card was promoted with is that the guard must take its verdict
 * from `index --check` rather than compute one — so the bodies that
 * matter run the REAL runner as a subprocess and let it resolve, spawn
 * and read a real `cargo` off a real PATH. The shim writes a marker file
 * when it runs, which is how the bodies below can assert the check was
 * NOT spawned as well as that it was.
 *
 * ── LIFTING A SAFETY GUARD, AS docs/CONVENTIONS.md REQUIRES ──────────
 * This is a guard, so most of its arms are deliberate ALLOWs, and the
 * bullet's two rules are obeyed: every lifted arm TERMINATES IN A
 * FIXTURE — every path named here resolves under one `mkdtemp` root and
 * nothing is written into this repository — and every allow body
 * ASSERTS THE GUARD'S STATE FIRST by proving that the SAME fixture
 * refuses when the shim says STALE. An allow asserted without that
 * control is satisfied by a hook that always says yes, which is the
 * failure a positive control exists to exclude.
 *
 * ── WHAT THIS FILE DELIBERATELY DOES NOT RUN ─────────────────────────
 * The REAL `cargo run -p supertaskr-index -- index --check`. Two reasons,
 * both cost-shaped and both stated so the next editor does not "fix"
 * the omission. It would make this suite's verdict a function of the
 * repository's GRAPH CURRENCY, so an unrelated stale graph would red a
 * body about a hook; and on a cold checkout it would compile the crate
 * inside the playwright run. The constants that would otherwise need
 * that run are pinned against the live tree instead — the graph is
 * asserted to EXIST at `GRAPH_REL_PATH`, and the crate manifest at
 * `INDEX_CRATE_MANIFEST_REL_PATH` — so a path that moves still reds a
 * body by name.
 */

/** Every scratch root this file made, removed together at the end. */
const SCRATCH: string[] = [];

test.afterAll(() => {
  for (const dir of SCRATCH) removeGitFixture(dir, "push-guard");
});

/**
 * A `cargo` shim: records that it ran AND WHERE, prints `report`, exits
 * `code`.
 *
 * THE `$PWD` LINE IS T-216's WHOLE MEASUREMENT. That card's first
 * criterion asks for the check *"demonstrably run against a DIFFERENT
 * checkout than the one being pushed"*, and `existsSync(marker)` cannot
 * answer it — one shim on one PATH answers for every checkout that
 * reaches it. `runCheck` spawns cargo with `cwd` set to
 * `<root>/app/src-tauri`, so the shim's own `$PWD` names the root the
 * guard chose, mechanically and without the guard being asked.
 */
function writeCargoShim(root: string, code: number, report: string): string {
  const bin = path.join(root, "bin");
  mkdirSync(bin, { recursive: true });
  const marker = path.join(root, "cargo-was-run.txt");
  writeFileSync(
    path.join(bin, "cargo"),
    `#!/bin/sh\nprintf 'cwd=%s\\nargv=%s\\n' "$PWD" "$*" >> ${JSON.stringify(marker)}\n` +
      `cat <<'REPORT'\n${report}\nREPORT\nexit ${code}\n`,
    { mode: 0o755 },
  );
  return marker;
}

/* ═════════════ T-237 — THE CI SHIM, AND WHY IT IS NOT OPTIONAL ══════
 *
 * EVERY FIXTURE IN THIS FILE CARRIES A `gh` SHIM, including the ones
 * written before this card existed, and that is a correctness
 * requirement rather than tidiness. Measured on 2026-09-02: inside a
 * fixture of the shape below — a local BARE `origin` — the real `gh`
 * exits 1 with *"none of the git remotes … point to a known GitHub
 * host"*. So a body that reached the real binary would be GREEN on a
 * developer's machine, EXIT 4 (unauthenticated) on a CI runner, and
 * would need the `actions: read` scope that `workflow-permissions.spec.ts`
 * reds on — its EXCEPTIONS table is empty. The shim is first on the
 * fixture's own PATH, exactly as `writeCargoShim`'s is, so nothing here
 * touches the network in either direction.
 */

/** One `gh` answer: what the shim prints and what it exits. */
interface GhAnswer {
  code?: number;
  stdout?: string;
  stderr?: string;
}

/** What a fixture's `gh` shim answers, per subcommand. */
interface GhPlan {
  list?: GhAnswer;
  /**
   * T-237-s2: answer `run list` DIFFERENTLY PER `--branch`.
   *
   * The whole of T-237-s6 is that this arm asked about the wrong branch,
   * and a shim that answers the same thing whatever it is asked cannot
   * tell a right answer from a wrong one. A branch named here wins over
   * `list`, which stays the answer for every branch not named.
   */
  listByBranch?: Record<string, GhAnswer>;
  view?: GhAnswer;
}

/**
 * A `gh` shim: records EACH ARGUMENT ON ITS OWN LINE, then answers.
 *
 * The per-argument record is this card's *"argv arrays and no shell"*
 * criterion made mechanical. `"$*"` would flatten the list and prove
 * nothing; `for a in "$@"` preserves the boundaries, so a body can drive
 * a branch name carrying `;`, `$`, `&` and a backtick and read back that
 * it arrived as ONE argument with nothing executed.
 *
 * IT ALSO READS THE `--branch` VALUE THE SAME WAY (T-237-s2) — by walking
 * `"$@"` rather than by indexing, so the shim stays correct whatever
 * order `ghRunListArgv` puts its options in.
 */
function writeGhShim(root: string, plan: GhPlan): string {
  const bin = path.join(root, "bin");
  mkdirSync(bin, { recursive: true });
  const marker = path.join(root, "gh-was-run.txt");
  const answer = (out: GhAnswer | undefined) =>
    `cat <<'GHOUT'\n${out?.stdout ?? ""}\nGHOUT\n` +
    `cat >&2 <<'GHERR'\n${out?.stderr ?? ""}\nGHERR\n` +
    `exit ${String(out?.code ?? 0)}\n`;
  const arm = (sub: string, out: GhAnswer | undefined) =>
    `if [ "$2" = ${JSON.stringify(sub)} ]; then\n${answer(out)}fi\n`;
  const branchArms = Object.entries(plan.listByBranch ?? {})
    .map(
      ([branch, out]) =>
        `if [ "$2" = "list" ] && [ "$ghbranch" = ${JSON.stringify(branch)} ]; then\n` +
        `${answer(out)}fi\n`,
    )
    .join("");
  writeFileSync(
    path.join(bin, "gh"),
    "#!/bin/sh\n" +
      `for a in "$@"; do printf 'arg=%s\\n' "$a" >> ${JSON.stringify(marker)}; done\n` +
      `printf 'end\\n' >> ${JSON.stringify(marker)}\n` +
      'ghbranch=""\nghprev=""\n' +
      'for a in "$@"; do if [ "$ghprev" = "--branch" ]; then ghbranch="$a"; fi; ghprev="$a"; done\n' +
      branchArms +
      arm("list", plan.list ?? { stdout: "[]" }) +
      arm("view", plan.view) +
      "printf 'this shim was called with something it does not model\\n' >&2\nexit 99\n",
    { mode: 0o755 },
  );
  return marker;
}

/** The arguments the shim was handed, one invocation per inner array. */
function ghCalls(fx: { ghMarker: string }): string[][] {
  if (!existsSync(fx.ghMarker)) return [];
  const calls: string[][] = [];
  let current: string[] = [];
  for (const line of readFileSync(fx.ghMarker, "utf8").split("\n")) {
    if (line === "end") {
      calls.push(current);
      current = [];
    } else if (line.startsWith("arg=")) current.push(line.slice("arg=".length));
  }
  return calls;
}

/** One `gh run list` row, with only what a body wants to move overridden. */
function runRow(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    conclusion: "success",
    createdAt: "2026-09-01T12:00:00Z",
    databaseId: 4242,
    displayTitle: "a run this fixture invented",
    headSha: "0".repeat(40),
    startedAt: "2026-09-01T12:00:05Z",
    status: COMPLETED_RUN_STATUS,
    url: "https://example.invalid/actions/runs/4242",
    ...over,
  };
}

/**
 * A `gh run view --json jobs` answer whose failing step is `step`.
 *
 * `conclusion` DEFAULTS TO `failure` AND IS A PARAMETER (T-237-s2): a
 * job and a step carry the same vocabulary a run does, so a `timed_out`
 * run's job is modelled by moving one argument rather than by a second
 * copy of this shape.
 *
 * The shape is the REAL one, read off this repository's own run
 * 33575869087 on 2026-09-02: `{ jobs: [ { name, conclusion, steps: [ {
 * name, conclusion } ] } ] }`. A passing step precedes the failing one
 * so a body can tell "the first failing step" from "the first step".
 */
function jobsWithFailingStep(step: string, conclusion: string = FAILED_CONCLUSION): string {
  return JSON.stringify({
    jobs: [
      {
        name: "linux",
        conclusion,
        steps: [
          { name: "Set up job", conclusion: "success" },
          { name: step, conclusion },
        ],
      },
    ],
  });
}

/**
 * The WORKFLOW a fixture plants, so the step→package map is DERIVED from
 * the pushed checkout rather than typed by this spec.
 *
 * Its two working directories are this repository's own, and a body
 * pins the same derivation against the REAL `.github/workflows/ci.yml`
 * so a fixture that drifted from the article could not stay green alone.
 */
const FIXTURE_WORKFLOW =
  "name: ci\n" +
  "on:\n  push:\n    branches: [main]\n" +
  "concurrency:\n  group: ci-${{ github.ref }}\n  cancel-in-progress: true\n" +
  "jobs:\n" +
  "  linux:\n" +
  "    runs-on: ubuntu-24.04\n" +
  "    steps:\n" +
  "      - name: Set up job\n" +
  "        run: 'true'\n" +
  "      - name: e2e lane\n" +
  "        working-directory: tools/e2e\n" +
  "        run: npm test\n" +
  "      - name: app suite\n" +
  "        working-directory: app\n" +
  "        run: npm test\n";

/** A report shaped like the real check's STALE render (`check.rs`, `render`). */
const STALE_REPORT =
  "[supertaskr-index] graph.json is STALE - the committed graph does not match a fresh index of this tree\n" +
  "[supertaskr-index]   committed:   1143153 bytes · 199 files · 2436 symbols · 2351 edges\n" +
  "[supertaskr-index]   fresh index: 1143999 bytes · 200 files · 2440 symbols · 2355 edges\n" +
  "[supertaskr-index]   ~ app/src/lib/agent-store.ts\n" +
  "[supertaskr-index]\n" +
  "[supertaskr-index]   regenerate: supertaskr-index index --root ../..";

/** A report shaped like the real check's CURRENT render. */
const CURRENT_REPORT =
  "[supertaskr-index] graph.json is CURRENT - ../../docs/architecture/graph.json matches a fresh index " +
  "(1143153 bytes, 199 files, 2436 symbols, 2351 edges)";

interface Fixture {
  root: string;
  marker: string;
  /** A bare repository this fixture's `origin` points at. */
  remote: string;
  /** The local commit that has NOT reached `remote` yet. */
  unpushed: string;
  /** The commit BEFORE it — what a CI run in this fixture measured (T-237). */
  base: string;
  /** Where the `gh` shim records the arguments it was handed (T-237). */
  ghMarker: string;
  /**
   * Whether this fixture's runners must build a PATH with NO `gh` on it
   * at all — the third criterion's "absent" half. It cannot be done by
   * omitting the shim, because this machine has a real `gh` (measured:
   * /opt/homebrew/bin/gh) and every other machine might.
   */
  ghAbsent: boolean;
}

/**
 * THE PATH A RUNNER GIVES A FIXTURE.
 *
 * Ordinarily the fixture's own `bin/` first and the real environment
 * behind it, which is what every body before T-237 had. For the
 * `ghAbsent` half it is the fixture's `bin/` plus a directory holding
 * NOTHING BUT A LINK TO THE REAL `git` — because the arms under test
 * still shell out to git, and dropping the environment's PATH wholesale
 * would make "gh is absent" indistinguishable from "git is absent too".
 */
function fixturePath(fx: Fixture): string {
  const bin = path.join(fx.root, "bin");
  return fx.ghAbsent
    ? [bin, path.join(fx.root, "gitonly")].join(path.delimiter)
    : [bin, process.env["PATH"] ?? ""].join(path.delimiter);
}

/** The real `git`, found the way an execvp would find it. */
function realGit(): string {
  for (const dir of (process.env["PATH"] ?? "").split(path.delimiter)) {
    if (dir !== "" && existsSync(path.join(dir, "git"))) return path.join(dir, "git");
  }
  throw new Error("no `git` on PATH — this suite cannot build its fixtures");
}

/**
 * THE TOKEN STATE A FIXTURE IS BORN IN (T-203).
 *
 * `fresh` is the DEFAULT and every pre-T-203 body in this file depends on
 * it. That is not a convenience: the token arm fails closed, so a fixture
 * with no token refuses BEFORE the graph is ever asked, and every body
 * about the graph would then be measuring the token arm while reading as
 * though it measured the graph. A fixture models a repository whose
 * battery has been run; the bodies below opt into the other four states
 * deliberately, one each.
 */
type TokenState = "fresh" | "missing" | "stale" | "red" | "partial";

/** A tree hash no repository has, for the STALE case. */
const FOREIGN_TREE = "0".repeat(40);

/**
 * A `gh` that answers "no runs for that branch", for the `decide` bodies
 * that reach the CI arm without a fixture PATH to shim (T-237).
 *
 * NOT AN OPTIONAL TIDINESS. `decide`'s default runner spawns the real
 * `gh`, and this machine has one — so a body that omitted this would
 * make a network call from the suite, and would answer differently on a
 * developer's machine and on a CI runner.
 */
const NO_RUNS = (): { status: number; stdout: string; stderr: string } => ({
  status: GH_EXIT.OK,
  stdout: "[]",
  stderr: "",
});

/** One suite's entry, as the runner would have written it. */
function suiteVerdict(suite: string, verdict: string, ref: string) {
  return {
    suite,
    exit: verdict === GREEN ? 0 : 1,
    bodies: 7,
    targets: 1,
    verdict,
    reason: verdict === GREEN ? "ok" : "suite-reported-failure",
    ref,
  };
}

/** Put `state`'s token into a fixture that has just finished committing. */
function plantToken(root: string, state: TokenState): void {
  if (state === "missing") return;
  const ref = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const suites = state === "partial" ? REQUIRED_SUITES.slice(0, 1) : REQUIRED_SUITES;
  const verdicts = suites.map((s) =>
    suiteVerdict(s, state === "red" && s === REQUIRED_SUITES[REQUIRED_SUITES.length - 1] ? "RED" : GREEN, ref),
  );
  writeToken(root, verdicts, state === "stale" ? { tree: FOREIGN_TREE } : {});
}

/**
 * A git repository that looks enough like this one for the guard to
 * recognise it, with a `cargo` on its own PATH answering `code`.
 *
 * `supertaskr: false` builds the same repository WITHOUT the indexer crate,
 * which is the sixth criterion's other side: a checkout that is not this
 * repository's.
 */
function fixture(
  name: string,
  code: number,
  report: string,
  opts: {
    supertaskr?: boolean;
    branch?: string;
    fence?: string[];
    token?: TokenState;
    /** T-237: what this fixture's `gh` shim answers. Default: no runs. */
    ci?: GhPlan;
    /** T-237: build a PATH with no `gh` on it at all. */
    ghAbsent?: boolean;
    /** T-237: the path the SECOND commit changes — what the push carries. */
    change?: string;
    /**
     * T-305: files written into the FIRST commit, path -> content.
     *
     * The owed set is derived from the tree the push carries, so a body
     * that needs the end-to-end leg NARROWED rather than whole needs a
     * spec file in this fixture for the change to be owned BY — the
     * import graph is read off the tree, and a tree with no specs in it
     * can only answer *the whole battery* or *not this suite at all*.
     */
    seed?: Record<string, string>;
  } = {},
): Fixture {
  const root = mkdtempSync(path.join(os.tmpdir(), `T-167-s8-${name}-`));
  SCRATCH.push(root);
  const git = (...args: string[]): void => {
    execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { stdio: "pipe" });
  };
  execFileSync("git", ["init", "-q", "-b", "main", root], { stdio: "pipe" });
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "T-167-s8 fixture");

  mkdirSync(path.join(root, CHECK_DIR_REL_PATH), { recursive: true });
  if (opts.supertaskr !== false) {
    mkdirSync(path.dirname(path.join(root, INDEX_CRATE_MANIFEST_REL_PATH)), { recursive: true });
    writeFileSync(path.join(root, INDEX_CRATE_MANIFEST_REL_PATH), '[package]\nname = "supertaskr-index"\n');
  }
  writeFileSync(path.join(root, "README.md"), "fixture\n");
  // THE FIXTURE MUST BE ABLE TO BE CLEAN. `dirtyTree` shells a real
  // `git status --porcelain` in this repository, and the shim, its marker
  // and the fence manifest are all born untracked — so without this the
  // "clean tree" control below is dirty and the body that separates the
  // two sentences can never fail.
  // `remote.git/` is ignored because it lives INSIDE this root. A BARE
  // repository has no `.git` directory, so git does not recognise it as a
  // nested repository at all and `git add -A` stages ITS ORDINARY FILES —
  // HEAD, config, description, the hook samples — as blobs at mode
  // 100644, not as a gitlink at 160000. That silently makes the second
  // commit non-empty for a reason that has nothing to do with the file it
  // is supposed to carry. A poison drill found it by SURVIVING: the
  // mutant that reverted the second commit's content left the commit
  // intact anyway, so the arm's precondition could not be killed from the
  // side it actually depends on.
  // T-237: the workflow is committed in the FIRST commit, so the paths a
  // push carries are exactly the second commit's and a body can count
  // them. `gh-was-run.txt` and `gitonly/` join the ignore list for the
  // reason the two above are on it — the "clean tree" control must be
  // able to be clean.
  mkdirSync(path.join(root, path.dirname(CI_WORKFLOW_REL_PATH)), { recursive: true });
  writeFileSync(path.join(root, CI_WORKFLOW_REL_PATH), FIXTURE_WORKFLOW);
  writeFileSync(
    path.join(root, ".gitignore"),
    "bin/\ncargo-was-run.txt\ngh-was-run.txt\ngitonly/\n.supertaskr/\nremote.git/\n",
  );
  for (const [rel, content] of Object.entries(opts.seed ?? {})) {
    mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    writeFileSync(path.join(root, rel), content);
  }
  git("add", "-A");
  git("commit", "-qm", "fixture");
  const base = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();

  // A REAL REMOTE, so a push can be observed to have happened or not
  // happened rather than inferred from an exit code. The bare repository
  // sits inside this fixture's own mkdtemp root; nothing leaves the
  // machine and no network is touched.
  const remote = path.join(root, "remote.git");
  execFileSync("git", ["init", "-q", "-b", "main", "--bare", remote], { stdio: "pipe" });
  git("remote", "add", "origin", remote);
  git("push", "-q", "origin", "HEAD:refs/heads/main");
  // The commit the guarded push WOULD carry. It is deliberately made
  // after the initial push, so the remote is one commit behind and
  // "did the push happen?" has a mechanical answer.
  const changed = opts.change ?? "README.md";
  mkdirSync(path.join(root, path.dirname(changed)), { recursive: true });
  writeFileSync(path.join(root, changed), "fixture, second commit\n");
  git("add", "-A");
  git("commit", "-qm", "the commit a guarded push would carry");
  const unpushed = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();

  if (opts.branch !== undefined) git("checkout", "-q", "-b", opts.branch);
  if (opts.fence !== undefined) {
    mkdirSync(path.join(root, path.dirname(MANIFEST_REL_PATH)), { recursive: true });
    writeFileSync(
      path.join(root, MANIFEST_REL_PATH),
      JSON.stringify({
        version: MANIFEST_VERSION,
        taskId: "T-901",
        branch: `refs/heads/${opts.branch ?? "main"}`,
        card: "docs/tasks/T-901-fixture.md",
        touchesLine: `touches: [${opts.fence.join(", ")}]`,
        paths: opts.fence,
        excluded: [],
        alwaysWritable: ["docs/tasks"],
      }),
    );
  }
  // AFTER the last commit, deliberately: the token is keyed by HEAD's
  // TREE, so a token planted before the second commit would be stale in
  // every fixture and the default would silently stop being `fresh`.
  plantToken(root, opts.token ?? "fresh");
  const gitonly = path.join(root, "gitonly");
  mkdirSync(gitonly, { recursive: true });
  symlinkSync(realGit(), path.join(gitonly, "git"));
  return {
    root,
    remote,
    unpushed,
    base,
    marker: writeCargoShim(root, code, report),
    // ABSENT MEANS BOTH HALVES, and the first draft had only the second.
    // A narrowed PATH is not enough while the fixture's own `bin/` is on
    // it carrying a shim: the probe found that shim and the body read
    // its exit 99 as a `gh` that answered. So the absent fixture writes
    // NO shim, and the marker path it names is one nothing will create —
    // which is what makes `ghCalls` empty a measurement rather than a
    // tautology.
    ghMarker:
      opts.ghAbsent === true
        ? path.join(root, "gh-was-run.txt")
        : writeGhShim(root, opts.ci ?? {}),
    ghAbsent: opts.ghAbsent === true,
  };
}

/** What `origin` actually holds for `main` right now. */
function remoteTip(fx: Fixture): string {
  return execFileSync("git", ["-C", fx.remote, "rev-parse", "refs/heads/main"], {
    encoding: "utf8",
  }).trim();
}

/**
 * THE HOOK COMMAND `.claude/settings.json` ACTUALLY WIRES, run the way
 * the harness runs it.
 *
 * NOT a path this file typed. The body below reads the `Bash` matcher's
 * own command string out of the committed settings, expands it through a
 * real shell with `CLAUDE_PROJECT_DIR` set exactly as the harness sets
 * it, and feeds it a real `PreToolUse` payload. That closes the gap
 * between *"the decision module refuses"* and *"the thing settings.json
 * invokes refuses"* — two different claims, and only the second one is
 * the guard.
 *
 * `cwd` IS THE SEAT'S OWN DIRECTORY and defaults to the fixture's root.
 * T-237-s2 drives it at a LANE WORKTREE instead, which is the whole of
 * that residual: the checkout a seat pushes FROM and the branch a push
 * lands ON are different facts, and until that card this arm read the
 * first where it meant the second.
 */
function runWiredHook(
  fx: Fixture,
  command: string,
  cwd: string = fx.root,
): { status: number | null; stderr: string } {
  const settings = JSON.parse(
    readFileSync(path.join(repoRoot, ".claude", "settings.json"), "utf8"),
  ) as { hooks: { PreToolUse: { matcher: string; hooks: { command: string }[] }[] } };
  const entry = settings.hooks.PreToolUse.find((h) => new RegExp(`^(${h.matcher})$`).test("Bash"));
  if (entry === undefined) throw new Error("no PreToolUse entry whose matcher matches `Bash`");
  const wired = entry.hooks.map((h) => h.command).join(" && ");
  const out = spawnSync("sh", ["-c", wired], {
    input: JSON.stringify({ tool_name: "Bash", tool_input: { command }, cwd }),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: repoRoot, PATH: fixturePath(fx) },
  });
  return { status: out.status, stderr: String(out.stderr ?? "") };
}

/**
 * A figure this suite MEASURED, said out loud where CI can read it.
 *
 * @see the disclosure precedent in brief-flush.spec.ts, brief.spec.ts and
 *   range-rule.spec.ts — annotation for the report, stdout for the log.
 */
function disclose(label: string, line: string): void {
  test.info().annotations.push({ type: label, description: line });
  process.stdout.write(`\n  ${label}: ${line}\n`);
}

/**
 * Drive a push THROUGH the guard the way a cooperating harness would:
 * consult the wired hook, and run the command only if it did not refuse.
 *
 * This is the harness contract in three lines — exit 2 blocks, anything
 * else proceeds — and it is written here rather than assumed because the
 * property under test is what REACHES THE REMOTE, not what an exit code
 * was.
 */
function pushThroughGuard(fx: Fixture): { refused: boolean; pushed: boolean } {
  const decision = runWiredHook(fx, "git push origin HEAD:refs/heads/main");
  if (decision.status === 2) return { refused: true, pushed: false };
  execFileSync("git", ["-C", fx.root, ...NO_BACKGROUND_MAINTENANCE, "push", "-q", "origin", "HEAD:refs/heads/main"], {
    stdio: "pipe",
  });
  return { refused: false, pushed: true };
}

/** Run the REAL hook runner as a subprocess, with the fixture's PATH. */
function runHook(fx: Fixture, command: string): { status: number | null; stderr: string } {
  const out = spawnSync(
    process.execPath,
    [path.join(repoRoot, ".claude", "hooks", "push-guard-hook.mjs")],
    {
      input: JSON.stringify({
        tool_name: "Bash",
        tool_input: { command },
        cwd: fx.root,
      }),
      encoding: "utf8",
      env: { ...process.env, PATH: fixturePath(fx) },
    },
  );
  return { status: out.status, stderr: String(out.stderr ?? "") };
}

/** Did the shim run? */
function checkWasSpawned(fx: Fixture): boolean {
  return existsSync(fx.marker);
}

/**
 * WHICH directories did the check run in? (T-216)
 *
 * Real paths, because macOS resolves `/var` to `/private/var` and a
 * shell's `$PWD` and node's `mkdtemp` disagree about which spelling to
 * use — a body comparing the two literally is red for a reason that has
 * nothing to do with the guard.
 */
function checkRanIn(fx: Fixture): string[] {
  if (!existsSync(fx.marker)) return [];
  return readFileSync(fx.marker, "utf8")
    .split("\n")
    .filter((l) => l.startsWith("cwd="))
    .map((l) => l.slice("cwd=".length));
}

/** The path a `$PWD` would print for `p`. @see checkRanIn */
function real(p: string): string {
  try {
    return realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

/* ───────────── the constants, compared against their authorities ─────── */

test("the four exit codes are docs/CONVENTIONS.md's, not this hook's", () => {
  const bullet = conventionsBullet(conventionsText(), "app/src-tauri (C-05 Rust half");
  expect(bullet, "no app/src-tauri bullet in docs/CONVENTIONS.md").toBeDefined();
  const legend = /exit (\d) current, (\d) STALE, (\d) usage, (\d) the gate could not run/.exec(
    String(bullet),
  );
  expect(legend, "the Rust bullet no longer legends index --check's four codes").not.toBeNull();
  const [, current, stale, usage, couldNotRun] = legend as RegExpExecArray;
  expect({
    CURRENT: Number(current),
    STALE: Number(stale),
    USAGE: Number(usage),
    COULD_NOT_RUN: Number(couldNotRun),
  }).toEqual({ ...CHECK_EXIT });
});

test("the check this guard runs is the command docs/CONVENTIONS.md publishes", () => {
  // ── ANCHORED, NOT SUBSTRING — poison shape EIGHT in its PREFIX form ──
  // This body used to assert `expect(bullet).toContain('cargo ' + argv)`,
  // and a substring search over the doc PASSES FOR EVERY PROPER PREFIX of
  // the published command. Three mutants of the `--root`/cwd mechanism
  // survived it, and two of them would have refused EVERY push in this
  // repository while the third would have allowed every push for ever:
  //
  //     --root ..        `… --check --root ..`   is a prefix of `… ../..`
  //     --root  (bare)   `… --check --root`      is a prefix of it too
  //     CHECK_DIR_REL_PATH -> "docs"             was asserted by nothing
  //
  // A guard misconfigured either way produces silence or universal
  // refusal, and neither is distinguishable from success by looking at
  // the guard — which is this card's own thesis one layer up. So the
  // command is matched as a WHOLE ELEMENT of the bullet's command list,
  // and the working directory is READ OUT of the bullet rather than
  // merely existing somewhere in the tree.
  const bullet = String(conventionsBullet(conventionsText(), "app/src-tauri (C-05 Rust half"));
  // Collapse the hard wrap first: every governing document here is
  // wrapped at ~70 columns, so a phrase match is a search for a line
  // break nobody chose (docs/CONVENTIONS.md, A CITATION NAMES A SYMBOL).
  const collapsed = bullet.replace(/\s+/g, " ");

  const published = [...collapsed.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  expect(published.length, "the bullet publishes no backticked commands").toBeGreaterThan(0);
  // `toContain` over an ARRAY is exact element equality — a prefix is not
  // an element, which is the whole repair.
  expect(published, `no EXACT published command equals the one this guard runs`).toContain(
    `cargo ${CHECK_ARGV.join(" ")}`,
  );

  // The directory is the bullet's own `run from <dir>/:` marker.
  const runFrom = /run from ([^\s:]+)\/:/.exec(collapsed);
  expect(runFrom, "the bullet no longer carries a `run from <dir>/:` marker").not.toBeNull();
  expect(CHECK_DIR_REL_PATH).toBe((runFrom as RegExpExecArray)[1]);
  // And that directory is the cargo workspace the command resolves `-p`
  // against — a second, independent way for `docs` to die.
  expect(existsSync(path.join(repoRoot, CHECK_DIR_REL_PATH, "Cargo.toml"))).toBe(true);

  // The `--root` is the false-red the bullet warns about at length, and
  // its VALUE is what the two surviving mutants moved.
  expect(CHECK_ARGV).toContain("--root");
  expect(CHECK_ARGV[CHECK_ARGV.indexOf("--root") + 1]).toBe("../..");
});

test("the paths this guard holds resolve in this repository's own tree", () => {
  expect(existsSync(path.join(repoRoot, GRAPH_REL_PATH))).toBe(true);
  expect(existsSync(path.join(repoRoot, INDEX_CRATE_MANIFEST_REL_PATH))).toBe(true);
  expect(existsSync(path.join(repoRoot, CHECK_DIR_REL_PATH))).toBe(true);
});

/* ─────────────────────── the command classifier ──────────────────────── */

test("a push is recognised through git's global options and its separators", () => {
  for (const command of [
    "git push",
    "git push origin main",
    "git -C /somewhere/else push",
    "git --no-pager push --force-with-lease",
    "git -c user.name=x push",
    "npm test && git push",
    "git add -A; git commit -m x; git push",
    "git\tpush",
  ]) {
    expect(isPush(command), command).toBe(true);
  }
});

test("a command that pushes nothing is not guarded", () => {
  for (const command of [
    "git status",
    "git commit -m 'Checkpoint: x'",
    "git push --dry-run",
    "git push -n",
    "git push --help",
    "git log --oneline -3",
    "ls -la",
    "git fetch origin",
  ]) {
    expect(isPush(command), command).toBe(false);
  }
});

test("the subcommand scanner steps over exactly the options that take a value", () => {
  for (const opt of GIT_GLOBAL_OPTS_WITH_VALUE) {
    const found = gitInvocations(`git ${opt} VALUE push origin main`);
    expect(found.map((f) => f.subcommand), `${opt} was not stepped over`).toEqual(["push"]);
  }
  // An `--opt=value` spelling carries its value, so it is ONE token.
  expect(gitInvocations("git --git-dir=/x push").map((f) => f.subcommand)).toEqual(["push"]);
  expect(NON_PUSHING_FLAGS.length).toBeGreaterThan(0);
});

test("a request with no readable command is read as such and never as a push", () => {
  expect(commandOf(undefined)).toBeUndefined();
  expect(commandOf({ command: "" })).toBeUndefined();
  expect(commandOf({ command: "git push" })).toBe("git push");
  const d = decide({ toolName: "Bash", toolInput: {} }, () => {
    throw new Error("the check must not be reached for an unreadable request");
  });
  expect(d.verdict).toBe("allow");
  expect(d.code).toBe("no-command-to-read");
});

/* ──────── THE POSITIVE CONTROL, BOTH DIRECTIONS, OVER A FIXTURE ──────── */

test("a STALE graph refuses the push and quotes the check's own regenerate line", () => {
  const fx = fixture("stale", CHECK_EXIT.STALE, STALE_REPORT);
  const { status, stderr } = runHook(fx, "git push origin main");

  expect(checkWasSpawned(fx), "the guard never asked the graph").toBe(true);
  expect(status, "a stale graph must refuse: exit 2 is the blocking mechanism").toBe(2);
  expect(stderr).toContain("PUSH REFUSED");
  // VERBATIM: the check's own regenerate line, which this guard never spells.
  expect(stderr).toContain("regenerate: supertaskr-index index --root ../..");
  expect(stderr).toContain("graph.json is STALE");
  expect(stderr).toContain("~ app/src/lib/agent-store.ts");
  // No hatch, and the refusal says so.
  expect(stderr).toContain("no override flag");
});

test("a CURRENT graph pushes, in the same fixture that refuses when it is stale", () => {
  const fx = fixture("current", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const { status, stderr } = runHook(fx, "git push origin main");

  expect(checkWasSpawned(fx), "an allow that never asked is not an allow").toBe(true);
  expect(status, "a current graph must pass").toBe(0);
  expect(stderr).toBe("");
});

test("the guard reads the exit code and not the report's words", () => {
  // The report SAYS stale; the exit code says current. The verdict is the
  // exit code's, which is the prohibition this card was promoted with.
  const fx = fixture("exit-over-words", CHECK_EXIT.CURRENT, STALE_REPORT);
  expect(runHook(fx, "git push").status).toBe(0);

  // And the converse: the report says current, the exit says stale.
  const fy = fixture("words-over-exit", CHECK_EXIT.STALE, CURRENT_REPORT);
  expect(runHook(fy, "git push").status).toBe(2);
});

/* ──────── could-not-run is not staleness (the third criterion) ───────── */

test("exit 3 allows the push and says the graph was not asked", () => {
  const fx = fixture("could-not-run", CHECK_EXIT.COULD_NOT_RUN, "[supertaskr-index] the gate could not run");
  const { status, stderr } = runHook(fx, "git push");
  expect(checkWasSpawned(fx)).toBe(true);
  expect(status, "a check that could not run must never refuse").toBe(0);
  expect(stderr).toContain("THE GRAPH WAS NOT ASKED");
});

test("exit 2 allows the push and is named as `called wrong`, never stale", () => {
  const fx = fixture("usage", CHECK_EXIT.USAGE, "[supertaskr-index] usage");
  const { status, stderr } = runHook(fx, "git push");
  expect(status).toBe(0);
  expect(stderr).toContain("called wrong");
});

test("no cargo at all allows the push rather than refusing every toolchain-less machine", () => {
  const fx = fixture("no-cargo", CHECK_EXIT.STALE, STALE_REPORT);
  // The same fixture whose shim refuses — but with the shim off PATH.
  const out = spawnSync(
    process.execPath,
    [path.join(repoRoot, ".claude", "hooks", "push-guard-hook.mjs")],
    {
      input: JSON.stringify({ tool_name: "Bash", tool_input: { command: "git push" }, cwd: fx.root }),
      encoding: "utf8",
      env: { ...process.env, PATH: path.join(fx.root, "empty-bin") },
    },
  );
  expect(checkWasSpawned(fx), "the shim must not have been reachable").toBe(false);
  expect(out.status, "an absent toolchain must not refuse a push").toBe(0);
  expect(String(out.stderr)).toContain("THE GRAPH WAS NOT ASKED");
});

test("an unreadable request stands aside", () => {
  const fx = fixture("garbage-stdin", CHECK_EXIT.STALE, STALE_REPORT);
  const out = spawnSync(
    process.execPath,
    [path.join(repoRoot, ".claude", "hooks", "push-guard-hook.mjs")],
    { input: "}{ not json", encoding: "utf8", env: { ...process.env } },
  );
  expect(out.status).toBe(0);
  expect(checkWasSpawned(fx)).toBe(false);
});

/* ────────── the sixth criterion: where the guard does not fire ───────── */

test("a checkout without the indexer crate is not judged, and is not asked", () => {
  const fx = fixture("not-supertaskr", CHECK_EXIT.STALE, STALE_REPORT, { supertaskr: false });
  const { status, stderr } = runHook(fx, "git push");
  expect(status, "the guard must not fire outside this repository's checkouts").toBe(0);
  expect(checkWasSpawned(fx), "a second and a half was spent on somebody else's repository").toBe(
    false,
  );
  // An ORDINARY allow is silent — somebody else's repository is not news.
  expect(stderr).toBe("");
  // The reason is still stated, and names what it looked for.
  const d = decide({ toolName: "Bash", toolInput: { command: "git push" }, cwd: fx.root }, () => {
    throw new Error("the check must not be reached outside this repository");
  });
  expect(d.code).toBe("not-this-repository");
  expect(d.reason).toContain(INDEX_CRATE_MANIFEST_REL_PATH);
});

test("*is this our repository* answered by a probe that COULD NOT LOOK is announced, never a silent allow", () => {
  // T-238-s1, taking T-216-s8's ATTRIBUTION. This arm asked `existsSync`,
  // which answers FALSE for EMFILE and EACCES exactly as it does for
  // ENOENT — so under the descriptor pressure of concurrent suites a push
  // INSIDE this repository took the silent `not-this-repository` allow,
  // and every arm below it (the holder, the landing gate, the token, the
  // graph) went unasked while the run read as an ordinary pass. That is
  // an inability wearing a verdict's clothes, which is the one shape
  // every arm in this file refuses.
  //
  // EACCES IS PRODUCED RATHER THAN SIMULATED: the directory holding the
  // manifest is made unreadable, so `statSync` on a file that IS there
  // fails for a reason that is not absence.
  //
  // KILLED BY: going back to `existsSync`, or treating every errno as an
  // absence — either puts the silent allow back.
  const fx = fixture("probe-unreadable", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const dir = path.dirname(path.join(fx.root, INDEX_CRATE_MANIFEST_REL_PATH));
  const ask = () =>
    decide(
      { toolName: "Bash", toolInput: { command: "git push" }, cwd: fx.root },
      () => ({ status: CHECK_EXIT.CURRENT, stdout: CURRENT_REPORT, stderr: "" }),
      () => ({ status: CHEAP_CHECKS_EXIT.CLEAN, stdout: "", stderr: "" }),
      NO_RUNS,
    );

  chmodSync(dir, 0o000);
  try {
    // THE PRECONDITION, ASSERTED RATHER THAN ASSUMED. A suite run as ROOT
    // reads straight through a 000 directory, so every assertion below
    // would red for a reason that has nothing to do with the guard —
    // which is this card's own subject, a body measuring the machine. It
    // is asserted rather than skipped because this suite carries no
    // skips; the message is what makes the red attribute itself.
    let denied = false;
    try {
      readFileSync(path.join(fx.root, INDEX_CRATE_MANIFEST_REL_PATH), "utf8");
    } catch {
      denied = true;
    }
    expect(
      denied,
      "the precondition: this user cannot read through a 000 directory. A suite run as ROOT can, " +
        "and then this body is about the user rather than about the probe",
    ).toBe(true);
    const blind = ask();
    expect(blind.code, `an unreadable probe is not "not ours" — ${said(blind)}`).not.toBe(
      "not-this-repository",
    );
    expect(
      (blind.notices ?? []).join("\n"),
      `and the inability is ANNOUNCED — ${said(blind)}`,
    ).toContain("WAS NOT ESTABLISHED");
    expect((blind.notices ?? []).join("\n"), "with the errno, so the next red attributes itself").toContain(
      "EACCES",
    );
  } finally {
    chmodSync(dir, 0o755);
  }

  // THE POSITIVE CONTROL, TWO WAYS ROUND. With the manifest READABLE the
  // arm says nothing at all; with it genuinely ABSENT the arm takes the
  // silent allow it is supposed to take. So the announcement above is
  // about the errno and not about this arm having become noisy.
  const readable = ask();
  expect((readable.notices ?? []).join("\n"), `a readable probe is silent — ${said(readable)}`).not.toContain(
    "WAS NOT ESTABLISHED",
  );
  rmSync(path.join(fx.root, INDEX_CRATE_MANIFEST_REL_PATH));
  const absent = ask();
  expect(absent.code, `a genuinely absent manifest still allows silently — ${said(absent)}`).toBe(
    "not-this-repository",
  );
  expect((absent.notices ?? []).join("\n")).not.toContain("WAS NOT ESTABLISHED");
});

test("an allow that left the graph unverified is announced; an ordinary one is silent", () => {
  // The announced set is the guard's, and every member of it is an ALLOW
  // reached with the graph unasked or unanswered.
  // `landing-gate-cannot-compare` joined this set with T-212, and it
  // belongs to it for the same reason as the other four: it is an ALLOW
  // reached with a question UNANSWERED. Its siblings on that arm —
  // `landing-gate-no-board`, `landing-gate-no-integration-ref`,
  // `landing-gate-no-remote` — are deliberately NOT here: they are allows
  // reached because the gate had no question to ask in that checkout at
  // all, which is this file's own `not-this-repository` shape and is
  // silent. The body below drives both halves of that split.
  // T-203 ADDED TWO THINGS THIS GUARD SAYS OUT LOUD AND NEITHER IS HERE,
  // which is a claim about what this list IS rather than an omission. It
  // is a FILTER on a returned Decision's own code; the cheap checks'
  // `could not run` and the token arm's `no tree to key against` are
  // NOTICES, printed whatever the verdict is, so a row here would be a
  // row nothing consults. Two bodies further down drive them and require
  // their sentences, which is the property a row here would only have
  // described.
  // T-216 ADDED ONE AND T-216-s8 TOOK IT BACK OUT, WHICH IS THIS LIST'S
  // MEMBERSHIP TEST DOING ITS JOB RATHER THAN A ROW BEING LOST.
  // `push-repository-unresolved` was an ALLOW reached with the FIRST
  // question unanswered — which repository — so every other question went
  // unasked with it, and it was the loudest thing this guard said. That
  // is exactly why it stopped being an allow: a `PreToolUse` hook's
  // stdout at exit 0 is not shown to the seat, the notice reached nobody,
  // and an ungraded tree went to origin (T-216-s8). It now BLOCKS, and a
  // block's reason is printed whatever this list holds — so a row here
  // would be a row nothing consults, which is the same argument T-203's
  // two announcements and T-237's five sentences are kept out on.
  // `push-repository-unresolved-outside` is the same inability in a
  // checkout that is not this repository's; it is STILL an allow and
  // still silent, for `not-this-repository`'s reason: outside our own
  // checkouts the guard has nothing to say. The two bodies at the end of
  // this file drive both halves of that split, one refusing and one mute.
  expect([...ANNOUNCED_ALLOW_CODES].sort()).toEqual([
    "check-could-not-run",
    "check-inconclusive",
    "landing-gate-cannot-compare",
    "lane-fence-unreadable",
    "no-command-to-read",
  ]);
  // AND THE ROW IS ABSENT BECAUSE THE CODE IS A BLOCK, not because the
  // code is gone: an assertion that only counted rows would be satisfied
  // by deleting the arm outright (shape five).
  expect(ANNOUNCED_ALLOW_CODES).not.toContain("push-repository-unresolved");
  // Announced: the check answered a code that is not a verdict.
  const spoke = fixture("announced", CHECK_EXIT.COULD_NOT_RUN, "[supertaskr-index] no");
  expect(runHook(spoke, "git push").stderr).not.toBe("");
  // Silent: the check answered CURRENT. The control is that the same
  // fixture shape speaks when the answer is inconclusive.
  const quiet = fixture("silent", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  expect(runHook(quiet, "git push").stderr).toBe("");
});

test("a command that is not a push costs nothing at all", () => {
  const fx = fixture("not-a-push", CHECK_EXIT.STALE, STALE_REPORT);
  expect(runHook(fx, "git status --porcelain").status).toBe(0);
  expect(checkWasSpawned(fx), "the check ran for a command that pushes nothing").toBe(false);
  // The control: the SAME fixture refuses a real push.
  expect(runHook(fx, "git push").status).toBe(2);
});

test("a lane whose fence cannot reach the graph is not refused, and one that can is", () => {
  // DERIVED, not assumed (the sixth criterion): the manifest already
  // carries the expanded fence, so the question is containment.
  expect(laneCanRegenerate({ paths: [".claude", "tools/e2e"] } as never)).toBe(false);
  expect(laneCanRegenerate({ paths: ["docs/architecture"] } as never)).toBe(true);
  expect(laneCanRegenerate({ paths: [GRAPH_REL_PATH] } as never)).toBe(true);

  const cannot = fixture("lane-cannot", CHECK_EXIT.STALE, STALE_REPORT, {
    branch: "task/T-901-a-lane-that-cannot-regen",
    fence: [".claude", "tools/e2e"],
  });
  const cannotRun = runHook(cannot, "git push");
  expect(cannotRun.status, "a lane with no legal remedy must not be refused").toBe(0);
  expect(checkWasSpawned(cannot)).toBe(false);
  expect(cannotRun.stderr).toBe("");

  // THE CONTROL: the same fixture shape whose fence DOES reach the graph
  // is asked, and refused.
  const can = fixture("lane-can", CHECK_EXIT.STALE, STALE_REPORT, {
    branch: "task/T-902-a-lane-that-can-regen",
    fence: ["docs/architecture"],
  });
  const canRun = runHook(can, "git push");
  expect(checkWasSpawned(can), "a lane that CAN regenerate must be asked").toBe(true);
  expect(canRun.status, "a lane that can regenerate is refused like anyone else").toBe(2);
});

test("a lane branch with no readable manifest allows rather than refusing", () => {
  const fx = fixture("lane-no-manifest", CHECK_EXIT.STALE, STALE_REPORT, {
    branch: "task/T-903-no-manifest",
  });
  const { status, stderr } = runHook(fx, "git push");
  expect(status).toBe(0);
  expect(checkWasSpawned(fx)).toBe(false);
  expect(stderr).toContain("lane branch");
});

/* ─────────────────── the refusal names its remedy ────────────────────── */

test("a dirty tree gets the stash sentence and a clean one does not", () => {
  const dirty = fixture("dirty", CHECK_EXIT.STALE, STALE_REPORT);
  writeFileSync(path.join(dirty.root, "uncommitted.txt"), "x\n");
  expect(runHook(dirty, "git push").stderr).toContain("git stash");

  const clean = fixture("clean", CHECK_EXIT.STALE, STALE_REPORT);
  const cleanRun = runHook(clean, "git push");
  expect(cleanRun.status, "the control: both are refusals").toBe(2);
  expect(cleanRun.stderr).not.toContain("git stash");
});

/* ─── THE GUARD FIRES: measured on the REMOTE, not on an exit code ──── */

/**
 * THE THREE ARMS ARE ONE EXPERIMENT AND MUST BE READ TOGETHER.
 *
 * Every other body in this file asserts what the guard DECIDED. These
 * three assert what a stale commit DID — whether it reached a remote —
 * because that is the event this card exists to prevent, and because a
 * guard's characteristic defect is indistinguishable from success when
 * you only ever look at the guard (method/tasks/TASK-FORMAT.md, the
 * guard-class paragraph).
 *
 * Arm 1 is the DEFECT REPRODUCED: with the guard not consulted, a stale
 * graph reaches the remote. Without this arm the other two are satisfied
 * by a fixture that could never push in the first place.
 */
test("WITHOUT the guard, a stale graph reaches the remote — the defect, reproduced", () => {
  const fx = fixture("fires-control-unguarded", CHECK_EXIT.STALE, STALE_REPORT);
  expect(remoteTip(fx), "the remote must start one commit behind").not.toBe(fx.unpushed);

  // The guard is simply not consulted — the pre-guard world.
  execFileSync(
    "git",
    ["-C", fx.root, ...NO_BACKGROUND_MAINTENANCE, "push", "-q", "origin", "HEAD:refs/heads/main"],
    { stdio: "pipe" },
  );

  expect(remoteTip(fx), "unguarded, the stale commit lands — this is the red").toBe(fx.unpushed);
});

test("WITH the guard, the same stale graph never reaches the remote", () => {
  const fx = fixture("fires-control-guarded", CHECK_EXIT.STALE, STALE_REPORT);
  const before = remoteTip(fx);
  expect(before, "the remote must start one commit behind").not.toBe(fx.unpushed);

  const { refused, pushed } = pushThroughGuard(fx);

  expect(checkWasSpawned(fx), "the guard must have actually asked the graph").toBe(true);
  expect(refused, "the wired hook must refuse").toBe(true);
  expect(pushed).toBe(false);
  expect(remoteTip(fx), "the stale commit must NOT have landed").toBe(before);
  expect(remoteTip(fx)).not.toBe(fx.unpushed);
});

test("WITH the guard, a current graph still reaches the remote", () => {
  // The third arm is what stops the second from being satisfied by a
  // guard that refuses everything.
  const fx = fixture("fires-control-current", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  expect(remoteTip(fx)).not.toBe(fx.unpushed);

  const { refused, pushed } = pushThroughGuard(fx);

  expect(checkWasSpawned(fx)).toBe(true);
  expect(refused, "a current graph must not be refused").toBe(false);
  expect(pushed).toBe(true);
  expect(remoteTip(fx), "the ordinary push must land").toBe(fx.unpushed);
});

test("the refusal travels through the WIRED command, not through a path this spec typed", () => {
  // `runWiredHook` resolves the command out of the committed settings and
  // runs it through a real shell with the harness's own environment
  // variable. If the settings entry stopped pointing at a working guard,
  // this reds while every `decide`-level body in this file stayed green.
  const stale = fixture("wired-stale", CHECK_EXIT.STALE, STALE_REPORT);
  const staleRun = runWiredHook(stale, "git push origin main");
  expect(staleRun.status, "the wired command must refuse with exit 2").toBe(2);
  expect(staleRun.stderr).toContain("regenerate: supertaskr-index index --root ../..");

  const current = fixture("wired-current", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  expect(runWiredHook(current, "git push origin main").status).toBe(0);
});

/* ═══════════════ T-203 — THE VERDICT TOKEN AND THE CHEAP CHECKS ═════
 *
 * Everything above this line is T-167-s8's graph arm and T-212's landing
 * arm. Below it is the third arm: a push may not carry a claim nothing
 * measured.
 *
 * ── THE ONE PLACE THIS FILE'S FAIL-OPEN DOCTRINE IS INVERTED ─────────
 * Every allow above is a guard standing aside because it could not
 * answer. The token arm REFUSES on an absence, so the positive control
 * matters more here than anywhere else in this file: a guard that refuses
 * everything is indistinguishable from one that works, and the fixture's
 * default token state exists so that every body below has one.
 */

/** `--root`-shaped fixture carrying a real board the cheap checks read. */
interface BoardFixture extends Fixture {
  /** The card the fixture planted, for a body to name in its assertion. */
  card: string;
}

/**
 * A fixture whose `docs/` tree is a real board, so the cheap checks have
 * something to find — or, in the control, provably nothing.
 *
 * `record` builds the SECOND measured instance: `docs/STATE.md` committed
 * first, a checkpoint record committed AFTER it. The commit dates are set
 * EXPLICITLY, and that is load-bearing rather than tidy — git's committer
 * timestamps have one-second granularity, so two commits made in the same
 * second TIE, and `staleStateRecords` passes a tie by design. A fixture
 * that relied on wall-clock ordering would fail to build its own defect
 * on a fast machine and the body would go green over nothing.
 */
function boardFixture(
  name: string,
  opts: { blocker?: string; record?: boolean; token?: TokenState } = {},
): BoardFixture {
  const root = mkdtempSync(path.join(os.tmpdir(), `T-203-${name}-`));
  SCRATCH.push(root);
  let clock = 0;
  const git = (...args: string[]): void => {
    clock += 60;
    const at = `2026-09-01T00:${String(clock / 60).padStart(2, "0")}:00Z`;
    execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], {
      stdio: "pipe",
      env: { ...process.env, GIT_AUTHOR_DATE: at, GIT_COMMITTER_DATE: at },
    });
  };
  execFileSync("git", ["init", "-q", "-b", "main", root], { stdio: "pipe" });
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "T-203 fixture");
  mkdirSync(path.join(root, CHECK_DIR_REL_PATH), { recursive: true });
  mkdirSync(path.dirname(path.join(root, INDEX_CRATE_MANIFEST_REL_PATH)), { recursive: true });
  writeFileSync(path.join(root, INDEX_CRATE_MANIFEST_REL_PATH), '[package]\nname = "supertaskr-index"\n');
  writeFileSync(
    path.join(root, ".gitignore"),
    "bin/\ncargo-was-run.txt\ngh-was-run.txt\ngitonly/\n.supertaskr/\nremote.git/\n",
  );

  mkdirSync(path.join(root, "docs/tasks"), { recursive: true });
  const card = "docs/tasks/T-901-a-well-formed-card.md";
  writeFileSync(
    path.join(root, card),
    "---\nid: T-901\ntitle: a well-formed card\nfeature: F-01\nmilestone: 1\n" +
      `priority: 1\nsize: S\nstatus: planned\nblocked_by: [${opts.blocker ?? ""}]\n` +
      "touches: [tools/e2e]\n---\n\nbody\n",
  );
  mkdirSync(path.join(root, "docs/checkpoints"), { recursive: true });
  writeFileSync(path.join(root, "docs/STATE.md"), "# State\n");
  git("add", "-A");
  git("commit", "-qm", "the board");

  const remote = path.join(root, "remote.git");
  execFileSync("git", ["init", "-q", "-b", "main", "--bare", remote], { stdio: "pipe" });
  git("remote", "add", "origin", remote);
  git("push", "-q", "origin", "HEAD:refs/heads/main");

  // The unpushed commit. When `record` is set it IS the defect: a
  // checkpoint record landing without STATE being regenerated beside it.
  if (opts.record === true) {
    writeFileSync(path.join(root, "docs/checkpoints/2026-09-01-record.md"), "# Record\n");
  } else {
    writeFileSync(path.join(root, "README.md"), "second commit\n");
  }
  git("add", "-A");
  git("commit", "-qm", "the commit a guarded push would carry");
  const unpushed = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();

  plantToken(root, opts.token ?? "fresh");
  const gitonly = path.join(root, "gitonly");
  mkdirSync(gitonly, { recursive: true });
  symlinkSync(realGit(), path.join(gitonly, "git"));
  return {
    root,
    remote,
    unpushed,
    // A board fixture has no separate base to compare a CI run against —
    // nothing here drives the reach sentence, so it names its own first
    // commit rather than inventing a second meaning for the field.
    base: execFileSync("git", ["-C", root, "rev-parse", "HEAD~1"], { encoding: "utf8" }).trim(),
    card,
    marker: writeCargoShim(root, CHECK_EXIT.CURRENT, CURRENT_REPORT),
    // T-237: a board fixture reaches the CI arm exactly as any other
    // does, so it gets the same shim — never the machine's real `gh`.
    ghMarker: writeGhShim(root, {}),
    ghAbsent: false,
  };
}

/* ───────────── the token's own contract ─────────────────────────── */

test("writeToken makes its own token un-committable in a repository NOBODY armed", () => {
  // THE CARD'S FIRST DECISION, AND THE BODY THAT REPLACES ONE THAT WAS
  // GREEN BY CONSTRUCTION.
  //
  // The first version of this assertion asked `git check-ignore` in
  // `repoRoot` — a LANE WORKTREE, where the dispatcher had already
  // written `.supertaskr/.gitignore` at arm time. So it passed without
  // `writeToken` doing anything, and no mutant of `gate-token.mjs` could
  // red it. Worse, on a fresh clone the subject and its own negative
  // control BOTH returned 1: a control that degenerates to its subject,
  // which is the one outcome a control exists to exclude. A verifier
  // reproduced `?? .supertaskr/` and `git add -A` offering the token.
  //
  // So the question is now asked in a repository this suite builds and
  // nobody arms, and it is asked of the three things that actually
  // matter: what `check-ignore` says, what `git status` shows, and what
  // `git add -A` would stage.
  const root = mkdtempSync(path.join(os.tmpdir(), "T-203-unarmed-"));
  SCRATCH.push(root);
  execFileSync("git", ["init", "-q", "-b", "main", root], { stdio: "pipe" });
  writeFileSync(path.join(root, "tracked.txt"), "tracked\n");
  execFileSync("git", ["-C", root, "-c", "user.email=f@e.invalid", "-c", "user.name=f",
    ...NO_BACKGROUND_MAINTENANCE, "add", "-A"], { stdio: "pipe" });
  execFileSync("git", ["-C", root, "-c", "user.email=f@e.invalid", "-c", "user.name=f",
    ...NO_BACKGROUND_MAINTENANCE, "commit", "-qm", "one"], { stdio: "pipe" });

  // THE PRECONDITION, ASSERTED: nothing here ignores `.supertaskr/` yet. This
  // is what makes the assertions below a measurement of `writeToken`
  // rather than of whoever built the fixture.
  expect(
    spawnSync("git", ["-C", root, "check-ignore", "-q", TOKEN_REL_PATH]).status,
    "the fixture already ignores the token, so this body cannot see writeToken do it",
  ).not.toBe(0);

  writeToken(root, [suiteVerdict("parser", GREEN, "deadbee")]);

  expect(
    spawnSync("git", ["-C", root, "check-ignore", "-q", TOKEN_REL_PATH]).status,
    `${TOKEN_REL_PATH} is not ignored — a committable token can be stale-but-matching`,
  ).toBe(0);
  // The control, in the same call shape and IN THE SAME REPOSITORY: a
  // tracked path answers non-zero. On the tree that shipped the defect
  // this line and the one above both answered 1.
  expect(spawnSync("git", ["-C", root, "check-ignore", "-q", "tracked.txt"]).status).not.toBe(0);

  // AND THE TWO COMMANDS A SEAT ACTUALLY RUNS, because `check-ignore`
  // answers about a path and these answer about the repository.
  const status = execFileSync("git", ["-C", root, "status", "--porcelain"], { encoding: "utf8" });
  expect(status, "the token shows up as untracked — `git add -A` would take it").not.toContain(
    RUNTIME_DIR,
  );
  const staged = execFileSync("git", ["-C", root, "add", "-A", "--dry-run"], { encoding: "utf8" });
  expect(staged, "`git add -A` offers to commit the verdict token").not.toContain(RUNTIME_DIR);
});

test("the ignore file the TOKEN writer leaves on disk is the one imported ignore string", () => {
  // T-057, and this file's own footnote about re-exports dressed up as
  // cross-checks: there is no second constant to compare against, so what
  // is checked is the ROUND TRIP through this writer onto disk.
  //
  // THE NAME SAYS `TOKEN WRITER` BECAUSE THAT IS ALL THIS BODY DRIVES.
  // An earlier spelling claimed "the fence writer and the token writer
  // both use it" while exercising one of them — a name outrunning its
  // body, which is how a reader comes to believe a property has a keeper
  // it does not have. The FENCE writer's half of the same round trip is
  // covered in `lane-fence.spec.ts`, which reads its written file back
  // and compares it to `MANIFEST_DIR_IGNORE` — the alias for this very
  // constant. The property is covered across two specs, and neither body
  // claims the other's half.
  const root = mkdtempSync(path.join(os.tmpdir(), "T-203-one-home-"));
  SCRATCH.push(root);
  execFileSync("git", ["init", "-q", "-b", "main", root], { stdio: "pipe" });
  const { ignoreFile } = writeToken(root, [suiteVerdict("parser", GREEN, "deadbee")]);
  expect(readFileSync(ignoreFile, "utf8")).toBe(RUNTIME_DIR_IGNORE);
  expect(RUNTIME_DIR_IGNORE, "an ignore file that does not ignore everything").toContain("*");
});

test("an ignore file already on disk is left alone, so an armed lane is never clobbered", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "T-203-armed-"));
  SCRATCH.push(root);
  mkdirSync(path.join(root, RUNTIME_DIR), { recursive: true });
  const ignoreFile = path.join(root, RUNTIME_DIR, ".gitignore");
  writeFileSync(ignoreFile, "# a dispatcher wrote this\n*\n");
  writeToken(root, [suiteVerdict("parser", GREEN, "deadbee")]);
  expect(readFileSync(ignoreFile, "utf8")).toBe("# a dispatcher wrote this\n*\n");
  // The control: the same call into a directory with NO ignore file
  // writes one, so "left alone" is a discrimination and not inaction.
  const bare = mkdtempSync(path.join(os.tmpdir(), "T-203-bare-"));
  SCRATCH.push(bare);
  writeToken(bare, [suiteVerdict("parser", GREEN, "deadbee")]);
  expect(readFileSync(path.join(bare, RUNTIME_DIR, ".gitignore"), "utf8")).toBe(RUNTIME_DIR_IGNORE);
});

test("a missing token refuses the push and names the one command that fixes it", () => {
  const fx = fixture("token-missing", CHECK_EXIT.CURRENT, CURRENT_REPORT, { token: "missing" });
  expect(existsSync(path.join(fx.root, TOKEN_REL_PATH))).toBe(false);

  const run = runHook(fx, "git push");
  expect(run.status).toBe(2);
  expect(run.stderr).toContain("nothing has been measured in this checkout");
  expect(run.stderr).toContain("node tools/e2e/scripts/gate-run.mjs --all");
  // AND THE GRAPH WAS NEVER ASKED. The token arm runs first, so a push
  // that is going to be refused does not spend a second and a half
  // compiling a crate to be told something else.
  expect(checkWasSpawned(fx), "the expensive check must not have run").toBe(false);
});

test("a token whose tree is not HEAD's refuses as STALE, naming both trees", () => {
  const fx = fixture("token-stale", CHECK_EXIT.CURRENT, CURRENT_REPORT, { token: "stale" });
  const run = runHook(fx, "git push");
  expect(run.status).toBe(2);
  expect(run.stderr).toContain("STALE against HEAD's tree");
  expect(run.stderr).toContain(FOREIGN_TREE);
  expect(run.stderr).toContain(String(headTree(fx.root)));
});

test("a token recording a red suite refuses, and says which suite", () => {
  const fx = fixture("token-red", CHECK_EXIT.CURRENT, CURRENT_REPORT, { token: "red" });
  const run = runHook(fx, "git push");
  expect(run.status).toBe(2);
  expect(run.stderr).toContain("records a suite that RAN AND FAILED");
  expect(run.stderr).toContain(String(REQUIRED_SUITES[REQUIRED_SUITES.length - 1]));
});

test("a token that graded some of the battery is refused as INCOMPLETE", () => {
  // A partial token is not a lie — it says exactly what it measured. It
  // is the READER that would lie by accepting it as "the gates are
  // green", which is this card's title in one sentence.
  const fx = fixture("token-partial", CHECK_EXIT.CURRENT, CURRENT_REPORT, { token: "partial" });
  const run = runHook(fx, "git push");
  expect(run.status).toBe(2);
  expect(run.stderr).toContain("graded suites");
  for (const suite of REQUIRED_SUITES.slice(1)) expect(run.stderr).toContain(suite);
});

test("a suite the runner DECLINED to grade refuses as unmeasured, not as red", () => {
  // THE TOOLCHAIN CASE, DECIDED AND WRITTEN DOWN. With no `cargo`,
  // gate-run records `rust` REFUSED; that push is genuinely unmeasured
  // and is refused. What it must not say is that the suite FAILED —
  // that would send a seat to debug a run that never happened.
  const fx = fixture("token-unmeasured", CHECK_EXIT.CURRENT, CURRENT_REPORT, { token: "missing" });
  const ref = execFileSync("git", ["-C", fx.root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  writeToken(
    fx.root,
    REQUIRED_SUITES.map((s) =>
      s === "rust"
        ? { suite: s, exit: -1, bodies: 0, targets: 0, verdict: "REFUSED",
            reason: "could-not-run: spawnSync cargo ENOENT", ref }
        : suiteVerdict(s, GREEN, ref),
    ),
  );
  const run = runHook(fx, "git push");
  expect(run.status, "an ungraded suite must still refuse — nothing measured it").toBe(2);
  expect(run.stderr).toContain("DECLINED TO GRADE");
  expect(run.stderr).toContain("could-not-run");
  expect(run.stderr, "an ungraded suite must not be reported as a failure").not.toContain(
    "RAN AND FAILED",
  );

  // THE CONTROL, in the same fixture shape: a suite that really did run
  // and fail says the opposite thing. Without it, "not red" is satisfied
  // by a guard that never says red at all.
  const failed = fixture("token-really-red", CHECK_EXIT.CURRENT, CURRENT_REPORT, { token: "red" });
  const failedRun = runHook(failed, "git push");
  expect(failedRun.status).toBe(2);
  expect(failedRun.stderr).toContain("RAN AND FAILED");
  expect(failedRun.stderr).not.toContain("DECLINED TO GRADE");
});

test("a battery run over uncommitted work does not certify the tree it is keyed to", () => {
  // C-7. The suites execute against the WORKING TREE; the token is keyed
  // to HEAD^{tree}. Run dirty, discard the dirt, push — and a green token
  // would certify content no commit carries. The dirt is recorded at
  // write time, so the key's claim has something standing behind it.
  const fx = fixture("token-dirty", CHECK_EXIT.CURRENT, CURRENT_REPORT, { token: "missing" });
  writeFileSync(path.join(fx.root, "README.md"), "uncommitted edit the suites would have seen\n");
  const ref = execFileSync("git", ["-C", fx.root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  writeToken(fx.root, REQUIRED_SUITES.map((s) => suiteVerdict(s, GREEN, ref)));

  const run = runHook(fx, "git push");
  expect(run.status, "a battery run over uncommitted work must not certify HEAD's tree").toBe(2);
  expect(run.stderr).toContain("does not describe what its suites ran against");

  // THE CONTROL: discard the dirt and re-run the battery, and the same
  // fixture pushes. This is also the remedy the refusal names.
  execFileSync("git", ["-C", fx.root, ...NO_BACKGROUND_MAINTENANCE, "checkout", "--", "README.md"], {
    stdio: "pipe",
  });
  writeToken(fx.root, REQUIRED_SUITES.map((s) => suiteVerdict(s, GREEN, ref)));
  expect(runHook(fx, "git push").status, "a clean re-run must be accepted").toBe(0);
});

test("an UNTRACKED file is not counted as dirt, because a scratch note is not a measurement problem", () => {
  // THE BOUND ON THE CHECK ABOVE, and the residual is stated rather than
  // implied: an untracked file does not change HEAD^{tree} either, and
  // counting it would refuse a push over a stray note — which is how a
  // guard gets turned off. What this does NOT see is an untracked NEW
  // TEST FILE, which can change what a suite executes without moving the
  // key. Narrow, named, and it self-corrects the moment it is added.
  const fx = fixture("token-untracked", CHECK_EXIT.CURRENT, CURRENT_REPORT, { token: "missing" });
  writeFileSync(path.join(fx.root, "scratch-note.txt"), "a note, untracked\n");
  const ref = execFileSync("git", ["-C", fx.root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  writeToken(fx.root, REQUIRED_SUITES.map((s) => suiteVerdict(s, GREEN, ref)));
  expect(runHook(fx, "git push").status, fx.root).toBe(0);
});

test("an amend that changes only the message keeps the token; one that changes a file does not", () => {
  // THE CARD'S SECOND DECISION, MEASURED IN BOTH DIRECTIONS. The tree
  // hash names the CONTENT the suites graded, so a reworded commit is
  // still that content and a rewritten file is not.
  const fx = fixture("token-amend", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const git = (...args: string[]): void => {
    execFileSync("git", ["-C", fx.root, ...NO_BACKGROUND_MAINTENANCE, ...args], { stdio: "pipe" });
  };
  const treeBefore = headTree(fx.root);

  git("commit", "-q", "--amend", "-m", "the same tree under a different message");
  expect(headTree(fx.root), "an amended message must not move the tree").toBe(treeBefore);
  expect(runHook(fx, "git push").status, "the token still describes this content").toBe(0);

  writeFileSync(path.join(fx.root, "README.md"), "amended content\n");
  git("add", "-A");
  git("commit", "-q", "--amend", "-m", "a different tree");
  expect(headTree(fx.root)).not.toBe(treeBefore);
  const after = runHook(fx, "git push");
  expect(after.status, "a changed file must stale the token").toBe(2);
  expect(after.stderr).toContain("STALE against HEAD's tree");
});

/* ───────────── the cheap checks, on their own measured instances ──── */

test("an unresolvable blocked_by refuses the push — the first measured instance", () => {
  const fx = boardFixture("cheap-blocker", { blocker: "T-999" });
  const run = runHook(fx, "git push");
  expect(run.status).toBe(2);
  expect(run.stderr).toContain("dangling-blocker");
  expect(run.stderr).toContain("T-999");
  expect(run.stderr).toContain(fx.card);
});

test("a record newer than STATE refuses the push — the second measured instance", () => {
  const fx = boardFixture("cheap-record", { record: true });
  const run = runHook(fx, "git push");
  expect(run.status).toBe(2);
  expect(run.stderr).toContain("state-stale");
  expect(run.stderr).toContain("2026-09-01-record.md");
});

test("a coherent board is not refused — the cheap checks' positive control", () => {
  // THE CONTROL THE TWO BODIES ABOVE ARE WORTHLESS WITHOUT. Same builder,
  // same guard, no planted defect: the push is allowed. Without this,
  // both refusals are satisfied by a checker that refuses every board.
  const fx = boardFixture("cheap-clean");
  const run = runHook(fx, "git push");
  expect(run.status, run.stderr).toBe(0);
  expect(run.stderr).not.toContain("push-checks");
});

test("the cheap checks run even where the guard would otherwise allow and return", () => {
  // "UNCONDITIONALLY" IS A CLAIM ABOUT CONTROL FLOW. A lane whose fence
  // cannot reach the graph is an ALLOW that returns before the check —
  // so if the cheap checks sat below it they would not run for the seats
  // that take it, which is most lanes. This body puts the fixture on a
  // lane branch with a fence that cannot reach the graph AND a dangling
  // blocker, and requires the refusal.
  const fx = boardFixture("cheap-under-lane-allow", { blocker: "T-999" });
  execFileSync("git", ["-C", fx.root, "checkout", "-q", "-b", "task/T-901-lane"], { stdio: "pipe" });
  mkdirSync(path.join(fx.root, path.dirname(MANIFEST_REL_PATH)), { recursive: true });
  writeFileSync(
    path.join(fx.root, MANIFEST_REL_PATH),
    JSON.stringify({
      version: MANIFEST_VERSION,
      taskId: "T-901",
      branch: "refs/heads/task/T-901-lane",
      card: "docs/tasks/T-901-a-well-formed-card.md",
      touchesLine: "touches: [tools/e2e]",
      paths: ["tools/e2e"],
      excluded: [],
      alwaysWritable: ["docs/tasks"],
    }),
  );
  const run = runHook(fx, "git push");
  expect(run.status, "the lane's cannot-regenerate allow must not have eaten the cheap checks").toBe(2);
  expect(run.stderr).toContain("dangling-blocker");
});

test("cheap checks that could not run are announced, and allow", () => {
  // The other half of the four-code reading: 3 is an inability, never a
  // finding, and collapsing them would refuse every push in a checkout
  // where the script is absent.
  const fx = fixture("cheap-cannot-run", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const cannotRun = (): { status: null; stdout: string; stderr: string; problem: string } => ({
    status: null,
    stdout: "",
    stderr: "",
    problem: "the checker is not present in this checkout",
  });
  const decision = decide(
    { toolName: "Bash", toolInput: { command: "git push" }, cwd: fx.root },
    () => ({ status: CHECK_EXIT.CURRENT, stdout: CURRENT_REPORT, stderr: "" }),
    cannotRun,
    NO_RUNS,
  );
  expect(decision.verdict).toBe("allow");
  expect(decision.notices?.join("\n")).toContain("THE CHEAP CHECKS WERE NOT RUN");
  // The control: the SAME fixture refuses when the checker FINDS one.
  const found = decide(
    { toolName: "Bash", toolInput: { command: "git push" }, cwd: fx.root },
    () => ({ status: CHECK_EXIT.CURRENT, stdout: CURRENT_REPORT, stderr: "" }),
    () => ({ status: 1, stdout: "", stderr: "  [dangling-blocker] planted" }),
  );
  expect(found.verdict).toBe("block");
  expect(found.code).toBe("cheap-checks-found");
});

test("a checkout whose HEAD tree git will not name is announced, and allowed", () => {
  // THE ONE PLACE THE TOKEN ARM FAILS OPEN. A missing token is an answer
  // — nothing was measured — and refuses. A missing KEY is an inability:
  // there is no tree to compare a token against, so there is nothing to
  // be strict about. A repository with no commit at all is that case, and
  // it is announced rather than silent.
  const root = mkdtempSync(path.join(os.tmpdir(), "T-203-unborn-"));
  SCRATCH.push(root);
  execFileSync("git", ["init", "-q", "-b", "main", root], { stdio: "pipe" });
  mkdirSync(path.dirname(path.join(root, INDEX_CRATE_MANIFEST_REL_PATH)), { recursive: true });
  writeFileSync(path.join(root, INDEX_CRATE_MANIFEST_REL_PATH), '[package]\nname = "supertaskr-index"\n');
  expect(headTree(root), "the precondition: git names no tree here").toBeUndefined();

  const decision = decide(
    { toolName: "Bash", toolInput: { command: "git push" }, cwd: root },
    () => ({ status: CHECK_EXIT.CURRENT, stdout: CURRENT_REPORT, stderr: "" }),
    () => ({ status: 0, stdout: "", stderr: "" }),
    NO_RUNS,
  );
  expect(decision.verdict).toBe("allow");
  expect(decision.notices?.join("\n")).toContain("THE VERDICT TOKEN WAS NOT CHECKED");
  // The control: give the same checkout a commit and no token, and the
  // arm refuses — so the allow above is the missing KEY and not a token
  // arm that never fires.
  execFileSync("git", ["-C", root, "-c", "user.email=f@e.invalid", "-c", "user.name=f",
    ...NO_BACKGROUND_MAINTENANCE, "commit", "-q", "--allow-empty", "-m", "one"], { stdio: "pipe" });
  expect(headTree(root)).toBeDefined();
  const after = decide(
    { toolName: "Bash", toolInput: { command: "git push" }, cwd: root },
    () => ({ status: CHECK_EXIT.CURRENT, stdout: CURRENT_REPORT, stderr: "" }),
    () => ({ status: 0, stdout: "", stderr: "" }),
  );
  expect(after.verdict).toBe("block");
  expect(after.code).toBe("token-missing");
});

/* ─── THE TOKEN ARM FIRES: measured on the REMOTE, not on an exit code ─
 *
 * T-167-s8's three-arm shape, repeated for this card's own guard, and
 * repeated rather than reused because the property is different: what a
 * STALE TOKEN did, not what a stale graph did.
 */

test("WITHOUT the guard, a stale token reaches the remote — the defect, reproduced", () => {
  const fx = fixture("token-fires-unguarded", CHECK_EXIT.CURRENT, CURRENT_REPORT, { token: "stale" });
  expect(remoteTip(fx), "the remote must start one commit behind").not.toBe(fx.unpushed);

  execFileSync(
    "git",
    ["-C", fx.root, ...NO_BACKGROUND_MAINTENANCE, "push", "-q", "origin", "HEAD:refs/heads/main"],
    { stdio: "pipe" },
  );

  expect(remoteTip(fx), "unguarded, the unmeasured commit lands — this is the red").toBe(fx.unpushed);
});

test("WITH the guard, the same stale token never reaches the remote", () => {
  const fx = fixture("token-fires-guarded", CHECK_EXIT.CURRENT, CURRENT_REPORT, { token: "stale" });
  const before = remoteTip(fx);
  expect(before).not.toBe(fx.unpushed);

  const { refused, pushed } = pushThroughGuard(fx);

  expect(refused, "the wired hook must refuse").toBe(true);
  expect(pushed).toBe(false);
  expect(remoteTip(fx), "the unmeasured commit must NOT have landed").toBe(before);
  expect(remoteTip(fx)).not.toBe(fx.unpushed);
});

test("WITH the guard, a fresh green token still reaches the remote — the positive control", () => {
  // THE ARM THIS CARD SAYS MATTERS MORE THAN THE OTHER TWO. A guard that
  // refuses everything satisfies both bodies above, and this is the only
  // body that can tell them apart. Same builder, same wired hook, same
  // remote — the one difference is a token that is present, complete,
  // keyed to HEAD's own tree and green.
  const fx = fixture("token-fires-clean", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  expect(remoteTip(fx)).not.toBe(fx.unpushed);

  const { refused, pushed } = pushThroughGuard(fx);

  expect(refused, "a fresh green token must not be refused").toBe(false);
  expect(pushed).toBe(true);
  expect(remoteTip(fx), "the measured push must land").toBe(fx.unpushed);
});

/* ═══════════ T-216 — THE TREE THE PUSH ACTUALLY CARRIES ═════════════
 *
 * Everything above judges `findCheckoutRoot(request.cwd)` and is right to,
 * because every fixture above pushes the checkout its request names. This
 * section is about the shape where those two come apart: a lane worktree,
 * a real `cd <lane> && git push`, and a `request.cwd` that is the
 * DISPATCHING checkout — which is what this project's dispatch actually
 * hands a lane session.
 *
 * ── THE POSITIVE CONTROL CARRIES MORE WEIGHT THAN THE REFUSAL ────────
 * The defect here is symmetric, and that is what makes it dangerous: the
 * old rooting could say GREEN over a lane nothing measured AND RED over a
 * lane that was fully measured. So a body that only proves the refusal
 * proves nothing — a guard that refused every lane push would pass it.
 * Both directions are driven below, and the second one is measured ON THE
 * REMOTE, because "a legitimate push still passes" is a claim about what
 * landed and not about an exit code.
 *
 * ── MEASURED AGAINST THE UNFIXED CODE BEFORE THE FIX ─────────────────
 * These bodies were run against `push-guard.mjs` as it stood at the base
 * ref, and the ledger is stamped on the card. Six of the seven checks red
 * there, including both halves of the positive control. The one that does
 * NOT discriminate on its exit code alone is the unresolved arm — the old
 * guard allowed that push too, by judging the dispatcher — which is why
 * that body requires the SENTENCE and not just the code.
 */

interface LaneFixture extends Fixture {
  /** The linked worktree, on a lane branch — the tree the push carries. */
  lane: string;
  /** The lane's own commit, which exists in no other checkout. */
  laneTip: string;
}

/**
 * A dispatching checkout AND a sibling lane worktree with its own commit.
 *
 * THE LANE'S OWN COMMIT IS LOAD-BEARING. T-203's token is keyed to
 * `HEAD^{tree}`, so if the lane sat at the dispatcher's commit the two
 * checkouts would share a tree and "the token is fresh HERE" would be
 * satisfied by the wrong checkout's key. One commit in the lane makes the
 * two trees genuinely different, so a token that verifies is a token that
 * verifies THIS tree.
 *
 * Identity and branch are PINNED on every call — `init -b main` and
 * `-c user.*` — because `init.defaultBranch` and the global identity are
 * MACHINE config, absent on CI, and a fixture that inherits them is green
 * locally and red in the one place that matters.
 */
function laneFixture(
  name: string,
  opts: { dispatcher?: TokenState; lane?: TokenState; fence?: string[] } = {},
): LaneFixture {
  const base = fixture(name, CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    token: opts.dispatcher ?? "fresh",
  });
  const lane = `${base.root}-lane`;
  SCRATCH.push(lane);
  const git = (dir: string, ...args: string[]): void => {
    execFileSync(
      "git",
      ["-C", dir, ...NO_BACKGROUND_MAINTENANCE, "-c", "user.email=fixture@example.invalid",
        "-c", "user.name=T-216 fixture", ...args],
      { stdio: "pipe" },
    );
  };
  git(base.root, "worktree", "add", "-q", "-b", "task/T-901-a-real-lane", lane);
  writeFileSync(path.join(lane, "lane-work.txt"), "the lane's own work\n");
  git(lane, "add", "-A");
  git(lane, "commit", "-qm", "the commit this lane's push would carry");
  const laneTip = execFileSync("git", ["-C", lane, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();

  if (opts.fence !== undefined) {
    mkdirSync(path.join(lane, path.dirname(MANIFEST_REL_PATH)), { recursive: true });
    writeFileSync(
      path.join(lane, MANIFEST_REL_PATH),
      JSON.stringify({
        version: MANIFEST_VERSION,
        taskId: "T-901",
        branch: "refs/heads/task/T-901-a-real-lane",
        card: "docs/tasks/T-901-fixture.md",
        touchesLine: `touches: [${opts.fence.join(", ")}]`,
        paths: opts.fence,
        excluded: [],
        alwaysWritable: ["docs/tasks"],
      }),
    );
  }
  plantToken(lane, opts.lane ?? "fresh");
  return { ...base, lane, laneTip };
}

/** Drive the real runner with `request.cwd` at the DISPATCHING checkout. */
function runHookFromDispatcher(
  fx: LaneFixture,
  command: string,
): { status: number | null; stderr: string } {
  const out = spawnSync(
    process.execPath,
    [path.join(repoRoot, ".claude", "hooks", "push-guard-hook.mjs")],
    {
      input: JSON.stringify({ tool_name: "Bash", tool_input: { command }, cwd: fx.root }),
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${path.join(fx.root, "bin")}${path.delimiter}${process.env["PATH"] ?? ""}`,
      },
    },
  );
  return { status: out.status, stderr: String(out.stderr ?? "") };
}

test("a `cd <lane> && git push` runs the check in the LANE, not in the dispatching checkout", () => {
  // THIS CARD'S FIRST CRITERION, MEASURED RATHER THAN ARGUED: a real lane
  // worktree, a real `cd <lane> && git push`, and the check's own `$PWD`
  // naming which checkout it was asked in. Both tokens are fresh so the
  // flow reaches the graph arm at all, and the lane's fence reaches
  // `docs/architecture` so `lane-cannot-regenerate` does not allow first.
  const fx = laneFixture("t216-which-tree", { fence: ["docs/architecture"] });
  const run = runHookFromDispatcher(fx, `cd ${fx.lane} && git push origin HEAD:refs/heads/main`);

  expect(checkWasSpawned(fx), "the guard never asked the graph at all").toBe(true);
  const ran = checkRanIn(fx);
  expect(ran, `the check ran nowhere the shim could see: ${run.stderr}`).not.toEqual([]);
  for (const dir of ran) {
    expect(dir, "the check was run in a checkout the push does not carry").toBe(
      path.join(real(fx.lane), CHECK_DIR_REL_PATH),
    );
  }
  // And the divergence is SAID, because every sentence the guard prints
  // now describes a directory the reading seat is not sitting in.
  expect(run.stderr).toContain("THIS PUSH IS JUDGED IN");
  expect(run.stderr).toContain(fx.lane);

  // THE DISCRIMINATING HALF, in the SAME fixture with the SAME shim on
  // the SAME PATH: a bare push from the same seat runs the check in the
  // DISPATCHING checkout. So the check's directory is a function of the
  // COMMAND and not of the fixture — which is what "run against a
  // different checkout than the one being pushed" has to mean to be a
  // measurement rather than a coincidence.
  runHookFromDispatcher(fx, "git push origin HEAD:refs/heads/main");
  expect(checkRanIn(fx), "the two commands must not have been judged in one tree").toContain(
    path.join(real(fx.root), CHECK_DIR_REL_PATH),
  );
});

test("the two checkouts a lane push straddles answer DIFFERENTLY — the defect, reproduced", () => {
  // THE DEFECT, MADE PERMANENT RATHER THAN REMEMBERED. The old rooting
  // cannot be shipped beside the new one, so what this body pins is the
  // condition that made it a defect: one repository, two checkouts, two
  // DIFFERENT verdicts, and a seat whose `request.cwd` is the first while
  // its command pushes the second. The old code returned the FIRST answer
  // for the SECOND command; that is the whole card in one body.
  const fx = laneFixture("t216-defect", { dispatcher: "fresh", lane: "missing" });
  const headOf = (dir: string): string =>
    execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();

  // THE PRECONDITION, ASSERTED: without genuinely different trees the two
  // verdicts below could agree for reasons that have nothing to do with
  // rooting, and this body would be green over nothing.
  expect(headOf(fx.root), "the two checkouts share a HEAD").not.toBe(headOf(fx.lane));
  expect(headTree(fx.root), "the two checkouts share a tree").not.toBe(headTree(fx.lane));

  // Pushing the DISPATCHER: judged there, and allowed.
  const atDispatcher = runHookFromDispatcher(fx, "git push origin HEAD:refs/heads/main");
  expect(atDispatcher.status, "the dispatcher's own battery is green").toBe(0);

  // The SAME seat, the SAME `request.cwd`, a command that pushes the
  // LANE: judged there, and refused. Two answers, one seat.
  const atLane = runHookFromDispatcher(fx, `cd ${fx.lane} && git push origin HEAD:refs/heads/main`);
  expect(atLane.status, "the lane's own battery never ran").toBe(2);
  expect(atLane.stderr).toContain(fx.lane);
});

test("a lane whose OWN battery never ran is refused, though the dispatcher's is green", () => {
  // THE GREEN-OVER-UNMEASURED DIRECTION. Under the old rooting this push
  // was ALLOWED: the dispatcher's token is fresh, and the dispatcher is
  // what the guard looked at. The commits leaving the machine were the
  // lane's, and nothing had measured them.
  const fx = laneFixture("t216-green-over-unmeasured", { dispatcher: "fresh", lane: "missing" });
  expect(existsSync(path.join(fx.root, TOKEN_REL_PATH)), "the dispatcher IS measured").toBe(true);
  expect(existsSync(path.join(fx.lane, TOKEN_REL_PATH)), "the lane is NOT").toBe(false);

  const run = runHookFromDispatcher(fx, `cd ${fx.lane} && git push origin HEAD:refs/heads/main`);
  expect(run.status, "a push nothing measured must be refused").toBe(2);
  expect(run.stderr).toContain("nothing has been measured in this checkout");
  // "This checkout" is now a directory the seat is not in, so it is named.
  expect(run.stderr).toContain(fx.lane);
});

test("WITH the fixed rooting, a fully measured lane push still reaches the remote", () => {
  // THE POSITIVE CONTROL, AND THE ARM THAT MATTERS MOST HERE. The other
  // direction of the same defect: under the old rooting this push was
  // REFUSED — for the dispatcher's missing token, a fact about a tree the
  // push does not carry — and a lane that had run its whole battery could
  // not push. A guard that refuses every lane push satisfies the body
  // above and fails this one, which is the only reason that body means
  // anything.
  const fx = laneFixture("t216-legitimate", { dispatcher: "missing", lane: "fresh" });
  const before = execFileSync("git", ["-C", fx.remote, "rev-parse", "refs/heads/main"], {
    encoding: "utf8",
  }).trim();
  expect(before, "the remote must start behind the lane's own commit").not.toBe(fx.laneTip);

  const run = runHookFromDispatcher(fx, `cd ${fx.lane} && git push origin HEAD:refs/heads/main`);
  expect(run.status, `a measured lane must not be refused: ${run.stderr}`).toBe(0);

  // MEASURED ON THE REMOTE, not on the exit code: the harness contract is
  // that anything but 2 proceeds, so the push is then actually made.
  execFileSync(
    "git",
    ["-C", fx.lane, ...NO_BACKGROUND_MAINTENANCE, "push", "-q", "origin", "HEAD:refs/heads/main"],
    { stdio: "pipe" },
  );
  const after = execFileSync("git", ["-C", fx.remote, "rev-parse", "refs/heads/main"], {
    encoding: "utf8",
  }).trim();
  expect(after, "the legitimate push must land").toBe(fx.laneTip);
});

test("a `git -C <lane> push` is judged in the lane too, and it is the spelling the refusal names", () => {
  // The other construct that DETERMINES the repository, and the one the
  // unresolved arm sends a seat to. Same fixture shape, same divergence,
  // no `cd` involved at all.
  const fx = laneFixture("t216-dash-c", { dispatcher: "fresh", lane: "missing" });
  const run = runHookFromDispatcher(fx, `git -C ${fx.lane} push origin HEAD:refs/heads/main`);
  expect(run.status, "the lane's own absent token must decide this push").toBe(2);
  expect(run.stderr).toContain(fx.lane);

  // THE CONTROL: the same fixture, pushing the DISPATCHER, is allowed —
  // so the refusal above is about which tree, not about the fixture.
  const bare = runHookFromDispatcher(fx, "git push origin HEAD:refs/heads/main");
  expect(bare.status, "the dispatcher's own push is measured and must pass").toBe(0);
  expect(bare.stderr, "a push of one's own checkout announces no divergence").toBe("");
});

test("a spelling this guard cannot read judges NOTHING, and says so", () => {
  // THE THIRD CRITERION, applied to the guard beside T-199's. Where the
  // repository is not determined by the text, the guard does not fall
  // back to the writer's cwd — that fallback IS the defect.
  //
  // T-216 SHIPPED THIS AS AN ALLOW AND T-216-s8 MADE IT A REFUSAL, and
  // the sentence this body used to carry is the one that had to go: *"it
  // does not refuse either, because not knowing which repository a push
  // acts on is this guard's own inability"*. True of an inability ABOUT A
  // KNOWN TREE, which is what every other arm's allow is; false here,
  // where the unanswered question is WHICH TREE and no other arm can be
  // asked at all. The measured cost of the old reading is on T-216-s8's
  // card: a `;` instead of an `&&`, exit 0, and a tree no battery had
  // graded on origin — because a `PreToolUse` hook's stdout at exit 0 is
  // not shown to the seat, so the loudest notice in this file reached
  // nobody.
  const fx = laneFixture("t216-unresolved", { dispatcher: "fresh", lane: "missing" });
  const run = runHookFromDispatcher(fx, 'cd "$LANE" && git push origin HEAD:refs/heads/main');
  expect(run.status, "an unreadable spelling is refused, not narrated at exit 0").toBe(2);
  expect(run.stderr).toContain("PUSH REFUSED");
  expect(run.stderr, "and it says what went unjudged, not merely that it refused").toContain(
    "ALL UNVERIFIED",
  );
  expect(run.stderr, "the refusal must name the spelling that restores the guard").toContain(
    "git -C",
  );
  expect(checkWasSpawned(fx), "nothing may be judged, including the graph").toBe(false);

  // THE CONTROL THIS BODY IS WORTHLESS WITHOUT, and it is no longer the
  // EXIT CODE — both halves refuse now, so a guard that refused every
  // push would pass on the code alone. What discriminates is WHICH
  // REFUSAL: the same fixture, spelled so the guard can read it, is
  // refused by an ARM — here the lane's own missing verdict token — and
  // says nothing about an unidentifiable repository.
  const readable = runHookFromDispatcher(
    fx,
    `cd ${fx.lane} && git push origin HEAD:refs/heads/main`,
  );
  expect(readable.status, "the same push, spelled readably, is judged and refused").toBe(2);
  expect(
    readable.stderr,
    "the readable spelling must be refused by an ARM, never by the unresolved check",
  ).not.toContain("could not identify the repository");
  expect(readable.stderr, "and the arm that refuses it is a measurement of the lane").toContain(
    fx.lane,
  );
});

test("an unresolvable push outside this repository's checkouts is silent", () => {
  // THE SIXTH CRITERION SURVIVES THE NEW ARM. A seat that is not in one
  // of this repository's checkouts gets no narration, for
  // `not-this-repository`'s reason: we have nothing to say there, and a
  // notice on every unrelated push is a notice nobody reads.
  const outside = fixture("t216-outside", CHECK_EXIT.CURRENT, CURRENT_REPORT, { supertaskr: false });
  const d = decide({ toolName: "Bash", toolInput: { command: 'cd "$X" && git push' }, cwd: outside.root }, () => {
    throw new Error("the check must not be reached for an unresolved push");
  });
  expect(d.verdict).toBe("allow");
  expect(d.code).toBe("push-repository-unresolved-outside");
  expect(ANNOUNCED_ALLOW_CODES).not.toContain(d.code);

  // THE CONTROL: the same unreadable command from a seat that IS in one
  // of this repository's checkouts speaks. Without it, "silent" is
  // satisfied by an arm that never says anything at all. Since T-216-s8
  // it speaks by REFUSING, which makes this control stronger rather than
  // different: the two halves now differ by a verdict and not only by a
  // sentence, so an arm that lost its voice cannot pass either half.
  const inside = fixture("t216-inside", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const spoke = decide({ toolName: "Bash", toolInput: { command: 'cd "$X" && git push' }, cwd: inside.root }, () => {
    throw new Error("the check must not be reached for an unresolved push");
  });
  expect(spoke.verdict, "inside this repository the same inability REFUSES").toBe("block");
  expect(spoke.code).toBe("push-repository-unresolved");
  expect(
    ANNOUNCED_ALLOW_CODES,
    "and a block belongs to no allow list — the runner prints its reason regardless",
  ).not.toContain(spoke.code);
});

test("`;` and `||` after a `cd` are not `&&`, and the guard judges nothing there", () => {
  // THE SEPARATOR RULE, ON ITS OWN. A poison drill put this body here: a
  // mutant that accepted ANY separator between a `cd` and the push was
  // killed only by the resolver's table, whose kill set was CONTAINED by
  // the `-C` mutant's — so the rule had no body that could tell those two
  // failures apart. This one is aimed at the site the property lives on
  // and driven end to end through the real runner.
  //
  // The rule is the shell's, not a preference: under `&&`, IF THE PUSH
  // RUNS THEN THE `cd` SUCCEEDED. Under `;` a failed `cd` leaves the push
  // in the directory it started in, and under `||` the `cd` may not have
  // run at all — so in both the working directory is not determined by
  // the text, and following it would reintroduce this card's own defect.
  //
  // T-216-s8 TOOK THE EXIT CODE AWAY FROM THIS BODY AS A DISCRIMINATOR,
  // which is worth saying because it looks like a weakening and is not.
  // Both halves refuse now — the `&&` half by an ARM that measured the
  // lane, the `;`/`||` halves by the unresolved check that measured
  // nothing — so what this body reads is the SENTENCE, and a guard that
  // refused every push indiscriminately fails it in both directions.
  const fx = laneFixture("t216-separator", { dispatcher: "fresh", lane: "missing" });
  const push = "git push origin HEAD:refs/heads/main";
  const UNPLACEABLE = "could not identify the repository";

  const and = runHookFromDispatcher(fx, `cd ${fx.lane} && ${push}`);
  expect(and.status, "`&&` determines the directory, so the lane is judged").toBe(2);
  expect(and.stderr, "and it is judged by an arm, not declined as unplaceable").not.toContain(
    UNPLACEABLE,
  );
  expect(and.stderr, "the arm that refuses it names the lane it measured").toContain(fx.lane);

  for (const sep of [";", "||"]) {
    const run = runHookFromDispatcher(fx, `cd ${fx.lane} ${sep} ${push}`);
    expect(run.status, `\`${sep}\` must not be read as \`&&\``).toBe(2);
    expect(run.stderr, `\`${sep}\` was judged rather than declined`).toContain(UNPLACEABLE);
    expect(run.stderr, `\`${sep}\` declined without saying nothing was judged`).toContain(
      "ALL UNVERIFIED",
    );
  }
});

/* ══ T-216-s8 — THE LINE THAT REACHED ORIGIN, AND THE REFUSAL IT OWES ══
 *
 * THE DEFECT WAS NOT A MISSING CHECK. Every arm above was present and
 * correct on 2026-09-02 at 10:53Z when a seat pushed a tree whose verdict
 * token had been minted against a DIFFERENT tree. Probed afterwards, the
 * bare `git push origin main` was refused as STALE at exit 2 — the guard
 * working exactly as designed — while the line the seat had actually run,
 * `cd <checkout>; git push origin main 2>&1 | grep …`, exited 0.
 *
 * ONE CHARACTER APART, AND THE `;` IS NOT THE BUG EITHER. Declining to
 * read past a `;` is right and stays right: under `;` a failed `cd`
 * leaves the push in the directory it started in, so the text does not
 * determine the tree. What was wrong was the VERDICT on that inability —
 * an ALLOW carrying a notice, printed at exit 0, which is a channel a
 * `PreToolUse` hook's seat is never shown. The loudest sentence in the
 * file reached nobody and an ungraded tree reached origin.
 *
 * SO THE SPELLING DID NOT DEFEAT THE TOKEN ARM; IT ROUTED AROUND IT. The
 * one arm in this file that fails closed on an ABSENCE is the token's,
 * and this line never reached it: it made the REPOSITORY unreadable
 * rather than the token stale, and every arm below the first question is
 * indexed by the answer to that question.
 */

test("the `cd <checkout>; git push` line that reached origin is REFUSED, naming the separator and the `git -C` remedy", () => {
  // THE FINDING'S OWN LINE, in a fixture that would otherwise ALLOW: the
  // graph is CURRENT, the token is fresh, the board is quiet and the seat
  // sits in the very checkout the `cd` names. Nothing here is refusable
  // except the spelling, which is what makes the refusal attributable.
  const fx = fixture("t216-s8-the-line", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const tail = 'git push origin main 2>&1 | grep -E "REFUSED|To github"';

  const ran = runHook(fx, `cd ${fx.root}; ${tail}`);
  expect(ran.status, "exit 2 is the documented refusal; exit 0 is what reached origin").toBe(2);
  expect(ran.stderr).toContain("PUSH REFUSED");
  expect(ran.stderr, "the refusal names the separator it could not read past").toContain(
    "a `cd` reaches this push through a separator that is not `&&`",
  );
  expect(ran.stderr, "and carries the remedy the notice already spelled, in full").toContain(
    "git -C <the checkout being pushed> push",
  );
  expect(ran.stderr, "and says what went unjudged rather than only that it refused").toContain(
    "ALL UNVERIFIED",
  );
  expect(checkWasSpawned(fx), "nothing was judged, and the graph was not asked").toBe(false);

  // THE POSITIVE CONTROL, ONE CHARACTER AWAY, IN THE SAME FIXTURE. `;`
  // becomes `&&` and the identical line — same `2>&1`, same pipe, same
  // `grep` — is placed, judged by every arm, and ALLOWED. A guard that
  // had simply learned to refuse pushes, or to refuse this fixture, or to
  // refuse anything carrying a pipe, fails here.
  //
  // IT IS NOT SILENT, AND THE REASON IS A SEPARATE FINDING RATHER THAN
  // THIS BODY BEING LOOSE. The refspec reader takes the push segment's
  // last operand, and `segments` splits on `&`, so `… origin main 2>&1`
  // ends the segment at `2>` and the CI arm declares doubt about a
  // refspec that is a REDIRECTION. That is T-237-s2's arm answering
  // exactly as designed on an input nobody modelled — it is announced and
  // allowed, never a refusal — and moving it is a different card's
  // verdict to move (routed as T-216-s10). So what this control asserts is
  // that no arm REFUSED and that the unplaceable check in particular did
  // not fire, which is the property T-216-s8 is about.
  const allowed = runHook(fx, `cd ${fx.root} && ${tail}`);
  expect(allowed.status, "the same line, one separator different, is judged and allowed").toBe(0);
  expect(allowed.stderr, "and nothing refused it").not.toContain("PUSH REFUSED");
  expect(allowed.stderr, "least of all the check this card added").not.toContain(
    "could not identify the repository",
  );
  expect(checkWasSpawned(fx), "judged means the graph really was asked").toBe(true);
});

/* ───────────── the resolver's own contract, as a table ─────────────── */

test("the working directory at the push is read only where the text determines it", () => {
  const here = repoRoot;
  const up = path.dirname(here);
  // RESOLVED: each of these has exactly one working directory the shell
  // can reach, and it is written in the command.
  for (const [command, want] of [
    ["git push", here],
    ["npm test && git push", here],
    ["git add -A; git commit -m x; git push", here],
    [`git -C ${up} push`, up],
    [`cd ${up} && git push`, up],
    [`cd ${up} && cd ${here} && git push`, here],
    // git's own chaining rule: a later relative `-C` resolves against
    // the earlier one, and an absolute one replaces it.
    [`git -C ${up} -C ${path.basename(here)} push`, here],
    // Two pushes agreeing about where they run is one answer.
    [`cd ${up} && git push origin a && git push origin b`, up],
  ] as const) {
    const got = pushCwds(command, here);
    expect(got, `${command} was not resolved: ${JSON.stringify(got)}`).toEqual({ dirs: [want] });
  }

  // UNRESOLVED: each of these is a working directory only a running shell
  // knows. `pushCwds` returns no verdict of its own — it says WHY it
  // declined and `decide` decides. Since T-216-s8 that decision is a
  // REFUSAL inside this repository's checkouts and still a silent allow
  // outside them, and both are driven by their own bodies below.
  for (const command of [
    `cd ${up} ; git push`, //          `;` runs the push even if the cd failed
    `cd ${up} || git push`, //         the cd may not have run at all
    `cd ${up} && ls || git push`, //   the push is reached BY the cd failing
    'cd "$LANE" && git push', //       a value only a shell knows
    "cd ~/x && git push",
    "cd $(pwd) && git push",
    "cd && git push", //               the shell's $HOME
    "cd - && git push", //             a directory only the shell remembers
    `pushd ${up} && git push`,
    `echo cd ${up} && git push`, //    a `cd` this scanner cannot read
    "git --git-dir=/x push",
    "git --work-tree=/x push",
    "GIT_DIR=/x git push",
    "cd /no-such-directory-T-216 && git push",
    `cd ${up} && git push origin a && cd ${here} && git push origin b`,
  ]) {
    const got = pushCwds(command, here);
    expect("unresolved" in got, `${command} was resolved to ${JSON.stringify(got)}`).toBe(true);
    expect(
      "unresolved" in got ? got.unresolved : "",
      `${command} declined without saying why`,
    ).not.toBe("");
  }
});

test("the separator scan is the one gitInvocations always used", () => {
  // T-057: `segments` replaced `gitInvocations`'s own inline split, and
  // the claim made in its header is that the SEGMENTATION is unchanged
  // and only the separators are newly kept. That claim is checked here
  // against the old expression written out literally, so a widened or
  // narrowed splitter reds by name instead of quietly changing which
  // commands are seen as pushes.
  for (const command of [
    "git push",
    "npm test && git push",
    "git add -A; git commit -m x; git push",
    "a | b || c && d & e\nf",
    "cd /tmp && git push origin main",
    "",
  ]) {
    const wasSplitAs = command
      .split(/[\n;|&]+/)
      .map((s) => s.trim().split(/\s+/).filter((t) => t !== ""));
    expect(segments(command).map((s) => s.tokens), command).toEqual(wasSplitAs);
  }
  // And the separators really are kept, which is the only thing that is new.
  expect(segments("a && b || c ; d").map((s) => s.sep)).toEqual(["", "&&", "||", ";"]);
});

test("`-C` is followed and the options that re-point a repository are not", () => {
  const here = repoRoot;
  expect(repointedBy(here, [])).toEqual({ dir: here });
  expect(repointedBy(here, ["-C", path.dirname(here)])).toEqual({ dir: path.dirname(here) });
  // A `-c` carries a VALUE and must be stepped over, not read as a path.
  expect(repointedBy(here, ["-c", "user.name=x"])).toEqual({ dir: here });
  expect(repointedBy(here, ["--no-pager"])).toEqual({ dir: here });
  for (const globals of [
    ["--git-dir", "/x"],
    ["--git-dir=/x"],
    ["--work-tree", "/x"],
    ["--namespace", "x"],
    ["-C", "$LANE"],
    ["-C"],
  ]) {
    expect("unresolved" in repointedBy(here, globals), JSON.stringify(globals)).toBe(true);
  }
  // The line between reading and guessing is a constant, and it is drawn
  // over VALUES rather than over shapes.
  for (const t of ['"$X"', "~/x", "$(pwd)", "a*b", "`x`", "a'b'", "{a,b}"]) {
    expect(UNRESOLVABLE_TOKEN_RE.test(t), t).toBe(true);
  }
  expect(UNRESOLVABLE_TOKEN_RE.test("/Users/x/Projects/supertaskr-T-216")).toBe(false);
  expect(UNRESOLVABLE_TOKEN_RE.test("../supertaskr-T-216")).toBe(false);
});

test("the guard is wired into .claude/settings.json on the Bash matcher", () => {
  const settings = JSON.parse(
    readFileSync(path.join(repoRoot, ".claude", "settings.json"), "utf8"),
  ) as { hooks: { PreToolUse: { matcher: string; hooks: { command: string }[] }[] } };
  const bash = settings.hooks.PreToolUse.find((h) => h.matcher === "Bash");
  expect(bash, "no Bash matcher: the guard is code nothing calls").toBeDefined();
  expect(bash?.hooks.map((h) => h.command).join(" ")).toContain("push-guard-hook.mjs");
  // The fence hook's own matcher is untouched by this card — READ AS A
  // SET, not as a literal: T-249's merge (83712ed) added `Read` to it,
  // and the literal this body pinned until the wave checkpoint of
  // 2026-09-08 redded the whole lane for a change this guard never made.
  // The three write tools must still be routed; what else is, is the
  // fence hook's own business (lane-fence.spec.ts reads that list).
  const fence = settings.hooks.PreToolUse.find((h) => h.matcher.split("|").includes("Write"));
  expect(fence, "no matcher routes Write: the fence hook is code nothing calls").toBeDefined();
  for (const tool of ["Edit", "Write", "NotebookEdit"]) {
    expect(fence?.matcher.split("|"), tool).toContain(tool);
  }
});

/* ═══════════ T-237 — THE RUN THAT IS ALREADY RUNNING ════════════════
 *
 * Everything above this line asks questions about THIS MACHINE — the
 * graph, the board, the fence, the token. Below it is the first arm that
 * asks the one machine that is not this one, and the two facts it asks
 * for have deliberately different shapes: a run still going REFUSES,
 * because a push cancels it; a run that already failed ANNOUNCES,
 * because pushing over a red is how a red gets fixed.
 *
 * ── NOT ONE OF THESE BODIES REACHES THE REAL `gh` ────────────────────
 * Every fixture carries a `gh` shim on its own `bin/`, ahead of whatever
 * the machine has, and the "absent" half is built by narrowing PATH to
 * directories this file created rather than by deleting a shim. The
 * reason is measured rather than stylistic: inside a fixture whose
 * `origin` is a local bare repository the real `gh` exits 1 with *"none
 * of the git remotes … point to a known GitHub host"*, so a body that
 * reached it would be green here, exit 4 on a CI runner, and would want
 * an `actions: read` scope that `workflow-permissions.spec.ts` reds on.
 *
 * ── AND EVERY ALLOW HERE ASSERTS THE GUARD'S STATE FIRST ─────────────
 * docs/CONVENTIONS.md's LIFTING A SAFETY GUARD bullet, obeyed the way
 * the bodies above obey it: each `allow` below is paired with the SAME
 * fixture shape refusing, so an arm that never fires cannot pass.
 */

/** Re-arm a fixture's `gh` shim once facts about the fixture are known. */
function armGh(fx: Fixture, plan: GhPlan): void {
  writeGhShim(fx.root, plan);
}

/** `gh run list` answering exactly these rows. */
function listOf(rows: Record<string, unknown>[]): { stdout: string } {
  return { stdout: JSON.stringify(rows) };
}

test("the two commands this arm runs are the ones docs/CONVENTIONS.md publishes", () => {
  // THE AUTHORITY IS THE DOCUMENT, not this file — the treatment
  // `CHECK_ARGV` gets against the Rust bullet, applied to the bullet
  // that already told every seat to read CI by hand.
  const bullet = String(conventionsBullet(conventionsText(), "AND THEN READ IT"));
  const published = [...bullet.replace(/\s+/g, " ").matchAll(/`([^`]+)`/g)].map((m) => String(m[1]));
  expect(published.length, "the bullet publishes no backticked commands").toBeGreaterThan(0);
  const subcommands = published
    .filter((c) => c.startsWith(`${GH_BIN} `))
    .map((c) => c.split(/\s+/).slice(1, 3).join(" "));
  expect(subcommands, "the bullet no longer names `gh run list`").toContain("run list");
  expect(subcommands, "the bullet no longer names `gh run view`").toContain("run view");

  // And this guard runs those two, with the branch and the id as
  // ELEMENTS rather than as text spliced into a command.
  expect(ghRunListArgv("main").slice(0, 2)).toEqual(["run", "list"]);
  expect(ghRunListArgv("main")).toContain("main");
  expect(ghRunViewArgv("4242").slice(0, 3)).toEqual(["run", "view", "4242"]);
  expect(ghRunListArgv("main")).toContain("--json");
  expect(ghRunViewArgv("4242")).toContain("--json");

  // The field split this arm's strictness is spent on: every REQUIRED
  // field is asked for, and the required set is the small one.
  for (const field of RUN_LIST_REQUIRED_FIELDS) {
    expect(RUN_LIST_JSON_FIELDS, `${field} is required but never asked for`).toContain(field);
  }
  expect([...RUN_LIST_REQUIRED_FIELDS].sort()).toEqual(["conclusion", "databaseId", "status"]);

  // MEASURED AGAINST THE REAL `gh` ON 2026-09-02, and pinned because the
  // obvious code gets both wrong: `run list` publishes NO `jobs` field —
  // a failing step is only readable through `run view` — and `updatedAt`
  // is not a clock, so it is not asked for at all.
  expect(RUN_LIST_JSON_FIELDS, "`gh run list --json` has no `jobs`").not.toContain("jobs");
  expect(RUN_VIEW_JSON_FIELDS).toContain("jobs");
  expect(RUN_LIST_JSON_FIELDS, "`updatedAt` moves while a run is still running").not.toContain(
    "updatedAt",
  );
  expect(RUN_LIST_JSON_FIELDS).toContain("startedAt");
});

test("a failing step's package is READ out of the workflow, in this repository and in a fixture", () => {
  // The map from "which step failed" to "which package it was testing"
  // is the repository's own `working-directory:`, never a table typed
  // here — NEVER TYPE A PATH YOU CAN DERIVE, and a step renamed in
  // ci.yml then moves both sides at once.
  const real = readFileSync(path.join(repoRoot, CI_WORKFLOW_REL_PATH), "utf8");
  for (const [step, dir] of [
    ["e2e lane", "tools/e2e"],
    ["app suite", "app"],
    ["parser build", "lib/parser"],
    ["cargo suite (both workspace crates; incl. the T-018 sentinel live tests)", "app/src-tauri"],
  ] as const) {
    expect(stepWorkingDirectory(real, step), `${step} no longer maps to ${dir}`).toBe(dir);
    expect(existsSync(path.join(repoRoot, dir)), `${dir} is not in this tree`).toBe(true);
  }
  // A step that runs at the repository root has no working directory,
  // and a step nobody wrote down has none either — DIFFERENT sentences
  // in the guard, and the same `undefined` here.
  expect(
    stepWorkingDirectory(real, "Linux prerequisites (Tauri v2 webkit2gtk set + xvfb)"),
  ).toBeUndefined();
  expect(stepWorkingDirectory(real, "a step this workflow never had")).toBeUndefined();
  expect(stepWorkingDirectory(real, "")).toBeUndefined();
  // The fixture's own workflow answers the same way, so a fixture that
  // drifted from the article could not stay green by itself.
  expect(stepWorkingDirectory(FIXTURE_WORKFLOW, "e2e lane")).toBe("tools/e2e");
  expect(stepWorkingDirectory(FIXTURE_WORKFLOW, "Set up job")).toBeUndefined();

  // And the containment test the sentence rests on.
  expect(reachesPackage(["tools/e2e/tests/x.ts"], "tools/e2e")).toBe(true);
  expect(reachesPackage(["tools/e2e"], "tools/e2e")).toBe(true);
  expect(reachesPackage(["tools/e2e-other/x"], "tools/e2e")).toBe(false);
  expect(reachesPackage(["README.md"], "tools/e2e")).toBe(false);
  expect(reachesPackage([], "tools/e2e")).toBe(false);
  // No working directory means the repository root, which every push reaches.
  expect(reachesPackage(["README.md"], undefined)).toBe(true);
});

test("a run still in flight is ANNOUNCED and the push LANDS — the refusal is retired with the cancellation it was about", () => {
  // ── WHAT MOVED, AND WHY THIS BODY SAYS THE OPPOSITE OF WHAT IT DID ──
  // Until T-294 this body pinned a REFUSAL, and the refusal was right:
  // `.github/workflows/ci.yml` keyed its concurrency group on
  // `github.ref`, so a push landed in the running run's own group and
  // cancelled it — four times on 2026-09-01, with main red for five
  // hours behind it. The price was that a seat waited out a 35-minute
  // run before it could push at all.
  //
  // THE GROUP IS THE COMMIT NOW, so two pushes hold two groups and
  // neither cancels the other. The premise is gone, and this body pins
  // what replaced it: the push is ALLOWED, the live run is NAMED, and
  // the sentence says out loud that it is not being cancelled.
  const live = [runRow({ status: "in_progress", conclusion: "", databaseId: 7001 })];
  const guarded = fixture("ci-live-guarded", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ci: { list: listOf(live) },
  });
  expect(remoteTip(guarded), "the remote must start one commit behind").not.toBe(guarded.unpushed);
  const { refused, pushed } = pushThroughGuard(guarded);
  expect(refused, "a live run no longer refuses the push").toBe(false);
  expect(pushed).toBe(true);
  expect(remoteTip(guarded), "the push lands, and the running run keeps running").toBe(
    guarded.unpushed,
  );

  const { status, stderr } = runWiredHook(guarded, "git push origin main");
  expect(status, "an announcement, at exit 0").toBe(0);
  expect(stderr, "never a refusal").not.toContain("PUSH REFUSED");
  expect(stderr, "the sentence must name the run").toContain("7001");
  expect(stderr, "and say plainly what does NOT happen to it").toContain("DOES NOT CANCEL IT");
  expect(stderr, "the run is still watchable").toContain(`${GH_BIN} run watch 7001`);
  expect(stderr, "the elapsed time is real, and is not `an unreadable time`").toMatch(
    /running for \d+[smh]/,
  );

  // AND THE PREMISE IS READ OFF THE WORKFLOW, not asserted here. If CI
  // ever went back to cancelling by REF, this sentence would be a lie
  // and this body is where that is caught.
  const workflow = readFileSync(path.join(repoRoot, CI_WORKFLOW_REL_PATH), "utf8");
  expect(workflow, "the concurrency group is the COMMIT").toContain("${{ github.sha }}");
  expect(workflow, "and never the ref, which is what made pushes cancel").not.toContain(
    "group: ci-${{ github.ref }}",
  );

  // THE POSITIVE CONTROL, from the other side: the announcement is
  // caused by the LIVE run and is not something this guard says on every
  // push. Same builder, same wired hook, same run id — the one
  // difference is a `completed` status with a verdict behind it.
  const quiet = fixture("ci-live-control", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ci: {
      list: listOf([
        runRow({ status: COMPLETED_RUN_STATUS, conclusion: "success", databaseId: 7001 }),
      ]),
    },
  });
  expect(runWiredHook(quiet, "git push origin main").stderr, "a green CI is silent").toBe("");
});

test("the same push lands once that run is completed — the positive control", () => {
  // THE ARM THAT TELLS A WORKING GUARD FROM ONE THAT REFUSES EVERYTHING.
  // Same builder, same wired hook, same remote, same run id: the ONE
  // difference is a `status` of `completed` with a verdict behind it.
  const fx = fixture("ci-completed", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ci: {
      list: listOf([
        runRow({ status: COMPLETED_RUN_STATUS, conclusion: "success", databaseId: 7001 }),
      ]),
    },
  });
  expect(remoteTip(fx)).not.toBe(fx.unpushed);
  const { refused, pushed } = pushThroughGuard(fx);
  expect(refused, "a completed run must not refuse the push").toBe(false);
  expect(pushed).toBe(true);
  expect(remoteTip(fx), "the ordinary push must land").toBe(fx.unpushed);
  // And a green CI is SILENT: this file's rule that an ordinary allow
  // says nothing.
  expect(runWiredHook(fx, "git push origin main").stderr).toBe("");
});

test("the acknowledgement is RETIRED, and no environment variable moves this guard's CI arm", () => {
  // ── WHY THIS BODY IS A PROHIBITION NOW ───────────────────────────
  // `SUPERTASKR_CANCEL_CI=<run id>` existed to clear the in-flight
  // refusal by naming the run the push was about to cancel. It cleared
  // one refusal and could not outlive it, because the value had to EQUAL
  // a live run's id. With the refusal retired there is nothing to
  // acknowledge — and a variable that clears a refusal nothing raises is
  // a hatch waiting for the next refusal to be attached to it, which is
  // exactly how an override flag is born in a file that ships none.
  //
  // So the property is now the ABSENCE, and it is pinned two ways: the
  // guard behaves identically with the variable set, and the name is
  // BOUND nowhere in the hook's source.
  const ACK = "SUPERTASKR" + "_CANCEL_CI";
  const live = listOf([runRow({ status: "queued", conclusion: "", databaseId: 7002 })]);
  const fx = fixture("ci-ack", CHECK_EXIT.CURRENT, CURRENT_REPORT, { ci: { list: live } });

  // The control FIRST: with nothing named, a live run is announced and
  // the push is allowed.
  const plain = runWiredHook(fx, "git push origin main");
  expect(plain.status, "a live run allows the push").toBe(0);
  expect(plain.stderr).toContain("DOES NOT CANCEL IT");

  // ...and naming a run changes NOTHING — not the exit, not the sentence.
  const named = runWiredHook(fx, `${ACK}=7002 git push origin main`);
  expect(named.status, "the variable moves no verdict").toBe(plain.status);
  expect(named.stderr, "and it moves no sentence either").toBe(plain.stderr);
  expect(named.stderr, "there is no cancellation left to acknowledge").not.toContain("CANCEL IT —");

  // AND THE NAME IS BOUND NOWHERE IN THE HOOK. It survives in the
  // header's retirement record and in the marker at the constant's old
  // site, because a reader searching for it is owed the reason — but
  // nothing READS it, so the hatch cannot be re-opened by accident.
  const source = readFileSync(path.join(repoRoot, ".claude", "hooks", "push-guard.mjs"), "utf8");
  const code = source
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .join("\n");
  expect(code, "no line of code names the retired acknowledgement").not.toContain(ACK);
  expect(source, "and the reason is still where a reader will look for it").toContain(ACK);
});

test("a red CI is ANNOUNCED with its failing step, and is never a refusal", () => {
  // The second fact: this one may not refuse, because pushing over a red
  // is the ordinary way a red gets fixed.
  const fx = fixture("ci-red", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  armGh(fx, {
    list: listOf([runRow({ conclusion: FAILED_CONCLUSION, databaseId: 7100, headSha: fx.base })]),
    view: { stdout: jobsWithFailingStep("e2e lane") },
  });
  const { status, stderr } = runWiredHook(fx, "git push origin main");
  expect(status, "a red CI must NOT refuse the push").toBe(0);
  expect(stderr).toContain("CI IS RED UNDER THIS PUSH");
  expect(stderr, "the run id").toContain("7100");
  expect(stderr, "the failing step, and not merely the job").toContain("e2e lane");
  expect(stderr, "the step's package, read out of the workflow").toContain("tools/e2e/");
  expect(stderr).toContain("THIS IS NOT A REFUSAL");
  expect(stderr).toContain(`${GH_BIN} run view 7100 --log-failed`);
  // This fixture's push changes README.md, which is not under tools/e2e.
  expect(stderr).toContain("does NOT change anything under it");

  // THE DISCRIMINATION: the same run, the same failing step, and a push
  // that DOES reach that step's package. Without this the sentence is
  // satisfied by a guard that always says one of the two.
  const fixing = fixture("ci-red-fix", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    change: "tools/e2e/tests/a-new-body.spec.ts",
  });
  armGh(fixing, {
    list: listOf([
      runRow({ conclusion: FAILED_CONCLUSION, databaseId: 7100, headSha: fixing.base }),
    ]),
    view: { stdout: jobsWithFailingStep("e2e lane") },
  });
  const fixRun = runWiredHook(fixing, "git push origin main");
  expect(fixRun.status).toBe(0);
  expect(fixRun.stderr).toContain("DOES change anything under it");
  expect(fixRun.stderr).toContain("you are pushing a fix");

  // And where the run's own commit is not in this checkout, the reach is
  // declared unknown rather than answered — a guard that said "no"
  // because it could not look would be telling the seat something false
  // about its own tree.
  const foreign = fixture("ci-red-foreign", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  armGh(foreign, {
    list: listOf([
      runRow({ conclusion: FAILED_CONCLUSION, databaseId: 7100, headSha: "9".repeat(40) }),
    ]),
    view: { stdout: jobsWithFailingStep("e2e lane") },
  });
  expect(runWiredHook(foreign, "git push origin main").stderr).toContain("is UNKNOWN");

  // AND A `headSha` THAT IS NOT A COMMIT ID NEVER REACHES `git`.
  // FOUND BY THIS CARD'S SECURITY SWEEP RATHER THAN BY A FAILURE, and it
  // is not a quoting bug: there is no shell anywhere in this arm, and an
  // argv array does nothing to stop `git`'s OWN parser reading a leading
  // `-` as an option. This is the single value the arm takes off the
  // wire and hands to a second binary, so it is shape-checked first.
  const hostile = fixture("ci-red-hostile-sha", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const planted = path.join(hostile.root, "written-by-a-flag.txt");
  armGh(hostile, {
    list: listOf([
      runRow({ conclusion: FAILED_CONCLUSION, databaseId: 7100, headSha: `--output=${planted}` }),
    ]),
    view: { stdout: jobsWithFailingStep("e2e lane") },
  });
  const hostileRun = runWiredHook(hostile, "git push origin main");
  expect(hostileRun.status, "still an announcement, never a refusal").toBe(0);
  expect(hostileRun.stderr).toContain("where a commit id was expected");
  expect(existsSync(planted), "`git` was never handed that as a revision").toBe(false);

  // The bound, and THE POSITIVE CONTROL that it is a bound rather than a
  // refusal of everything: a real commit id still answers.
  expect("problem" in pathsSince(hostile.root, `--output=${planted}`)).toBe(true);
  expect("problem" in pathsSince(hostile.root, "HEAD")).toBe(true);
  expect("problem" in pathsSince(hostile.root, "")).toBe(true);
  const real = pathsSince(fx.root, fx.base);
  expect("paths" in real, "a genuine sha is not caught by the shape check").toBe(true);
  expect("paths" in real ? real.paths : []).toEqual(["README.md"]);
});

test("the newest COMPLETED run is not the question — cancellations are skipped and counted", () => {
  // `cancel-in-progress: true` is what makes this arm's obvious version
  // wrong: a batch of rapid pushes leaves COMPLETED runs that concluded
  // nothing, and this card's own instance sat behind a stack of them.
  const workflow = readFileSync(path.join(repoRoot, CI_WORKFLOW_REL_PATH), "utf8");
  expect(workflow, "if CI stopped cancelling, this whole body's premise moved").toContain(
    "cancel-in-progress: true",
  );
  expect(NON_VERDICT_CONCLUSIONS).toContain("cancelled");
  expect(NON_VERDICT_CONCLUSIONS, "a running run has concluded nothing").toContain("");

  const runs = [
    runRow({ status: COMPLETED_RUN_STATUS, conclusion: "cancelled", databaseId: 3 }),
    runRow({ status: COMPLETED_RUN_STATUS, conclusion: "cancelled", databaseId: 2 }),
    runRow({ status: COMPLETED_RUN_STATUS, conclusion: FAILED_CONCLUSION, databaseId: 1 }),
  ];
  const parsed = parseRunList(JSON.stringify(runs));
  expect("runs" in parsed).toBe(true);
  const found = newestVerdictRun("runs" in parsed ? parsed.runs : []);
  expect(found?.run.id, "the two cancellations are not the verdict").toBe("1");
  expect(found?.skipped, "and the count of them is the batching rule's footprint").toBe(2);

  const fx = fixture("ci-cancelled-stack", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  armGh(fx, {
    list: listOf(runs.map((r) => (r["databaseId"] === 1 ? { ...r, headSha: fx.base } : r))),
    view: { stdout: jobsWithFailingStep("app suite") },
  });
  const { status, stderr } = runWiredHook(fx, "git push origin main");
  expect(status, "an announcement, still").toBe(0);
  expect(stderr).toContain("CI IS RED UNDER THIS PUSH");
  expect(stderr).toContain("2 newer run(s) reached NO verdict");
  expect(stderr, "the failing step's package, for a different step").toContain("app/");

  // THE CONTROL, from the other side: a `success` in front of an older
  // failure is the verdict, and it is silent.
  const green = fixture("ci-green-over-red", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  armGh(green, {
    list: listOf([
      runRow({ status: COMPLETED_RUN_STATUS, conclusion: "success", databaseId: 5 }),
      runRow({ status: COMPLETED_RUN_STATUS, conclusion: FAILED_CONCLUSION, databaseId: 4 }),
    ]),
  });
  expect(runWiredHook(green, "git push origin main").stderr).toBe("");
});

test("`gh` absent announces that CI was not asked and allows — reachable is the control", () => {
  const absent = fixture("ci-gh-absent", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ghAbsent: true,
    ci: { list: listOf([runRow({ status: "in_progress", conclusion: "", databaseId: 7200 })]) },
  });
  // THE PRECONDITION, ASSERTED RATHER THAN ASSUMED: under that PATH there
  // really is no `gh`. This machine has one at /opt/homebrew/bin/gh, so
  // "the shim is missing" is not the same claim as "gh is absent".
  //
  // PROBED FROM INSIDE A CHILD, because `spawnSync`'s own `options.env`
  // does NOT steer executable resolution in the CALLING process: POSIX
  // resolution is `execvp`, which reads the PARENT's environment. The
  // first draft of this line probed from here and found the machine's
  // real `gh` through a PATH that never names it — a green precondition
  // about the wrong process. The hook under test is itself a child, so
  // its own `process.env.PATH` is the narrowed one and the spawns it
  // makes obey it; this probe reproduces exactly that arrangement.
  const probe = spawnSync(
    process.execPath,
    [
      "-e",
      "const{spawnSync}=require('node:child_process');" +
        "const r=spawnSync(process.argv[1],['--version']);" +
        "process.stdout.write(`${String(r.error&&r.error.code)}|${String(r.status)}`);",
      GH_BIN,
    ],
    { env: { PATH: fixturePath(absent) }, encoding: "utf8" },
  );
  expect(
    String(probe.stdout),
    "off PATH is ENOENT with a null status — never 127, which needs a shell",
  ).toBe("ENOENT|null");

  const shadowed = runHook(absent, "git push origin main");
  expect(shadowed.status, "an unaskable CI must not refuse a push").toBe(0);
  expect(shadowed.stderr).toContain("CI WAS NOT ASKED (absent)");
  expect(ghCalls(absent), "nothing was asked").toEqual([]);

  // THE DISCRIMINATION THE CARD ASKS FOR: the SAME fixture shape with
  // `gh` reachable, answering the same run, refuses. So the announcement
  // above is a statement about `gh` and not a constant.
  const reachable = fixture("ci-gh-reachable", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ci: { list: listOf([runRow({ status: "in_progress", conclusion: "", databaseId: 7200 })]) },
  });
  const asked = runHook(reachable, "git push origin main");
  // THE CONTROL IS THE SENTENCE, NOT THE EXIT (T-294). Both halves allow
  // the push now — an unaskable CI always did, and a live run does since
  // the refusal was retired — so what tells a reachable `gh` from an
  // absent one is WHICH sentence arrives: the run, named, against `CI
  // WAS NOT ASKED`.
  expect(asked.status, "reachable, the same run allows too").toBe(0);
  expect(asked.stderr).not.toContain("CI WAS NOT ASKED");
  expect(asked.stderr, "reachable, the live run is named").toContain("7200");
  expect(ghCalls(reachable).length, "and it was actually asked").toBeGreaterThan(0);
});

test("`gh` refusing is announced in its own words, and an unrecognised exit says whose bug it may be", () => {
  const unauth = fixture("ci-gh-unauth", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ci: {
      list: {
        code: GH_EXIT.UNAUTHENTICATED,
        stderr: "gh: To get started with GitHub CLI, please run: gh auth login",
      },
    },
  });
  const unauthRun = runHook(unauth, "git push origin main");
  expect(unauthRun.status, "unauthenticated is an inability, never a verdict").toBe(0);
  expect(unauthRun.stderr).toContain("CI WAS NOT ASKED (unauthenticated)");
  expect(unauthRun.stderr, "gh's own words, quoted").toContain("gh auth login");

  const noRemote = fixture("ci-gh-no-remote", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ci: {
      list: {
        code: GH_EXIT.GENERIC,
        stderr:
          "none of the git remotes configured for this repository point to a known GitHub host",
      },
    },
  });
  const noRemoteRun = runHook(noRemote, "git push origin main");
  expect(noRemoteRun.status).toBe(0);
  expect(noRemoteRun.stderr).toContain("CI WAS NOT ASKED (no-github-remote)");

  // EXIT 1 IS OVERLOADED, so an exit 1 this guard cannot place is
  // DISCLOSED as unrecognised — because that bucket is where a mistake in
  // the arguments this guard itself sent would otherwise hide, wearing
  // the costume of somebody else's network.
  const odd = fixture("ci-gh-odd", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ci: { list: { code: GH_EXIT.GENERIC, stderr: 'unknown JSON field: "jobs"' } },
  });
  const oddRun = runHook(odd, "git push origin main");
  expect(oddRun.status, "still an allow").toBe(0);
  expect(oddRun.stderr).toContain("CI WAS NOT ASKED (unrecognised)");
  expect(oddRun.stderr).toContain("MAY BE THIS GUARD'S OWN MISTAKE");
  expect(oddRun.stderr, "and the exact command it sent, to run by hand").toContain(
    `${GH_BIN} ${ghRunListArgv("main").join(" ")}`,
  );

  // The classifier under all four, driven over the results it reads.
  expect(classifyGhFailure({ status: null, stdout: "", stderr: "", spawnError: "ENOENT" }).kind).toBe(
    "absent",
  );
  expect(
    classifyGhFailure({ status: null, stdout: "", stderr: "", spawnError: "ETIMEDOUT" }).kind,
  ).toBe("did-not-answer");
  expect(classifyGhFailure({ status: GH_EXIT.UNAUTHENTICATED, stdout: "", stderr: "" }).kind).toBe(
    "unauthenticated",
  );
  expect(classifyGhFailure({ status: 1, stdout: "", stderr: "no git remotes found" }).kind).toBe(
    "no-github-remote",
  );
  expect(classifyGhFailure({ status: 1, stdout: "", stderr: "HTTP 404" }).kind).toBe("unrecognised");
});

test("an answer this guard cannot READ refuses, and a well-formed one does not", () => {
  // THE ONE PLACE THIS ARM FAILS CLOSED. `gh` that could not run allows;
  // `gh` that ANSWERED with a shape this guard would have to guess at
  // refuses, because the guess is `probably nothing is in flight`.
  const object = fixture("ci-shape-object", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ci: { list: { stdout: '{"runs":[]}' } },
  });
  const objectRun = runHook(object, "git push origin main");
  expect(objectRun.status).toBe(2);
  expect(objectRun.stderr).toContain("cannot read the answer");

  const missing = fixture("ci-shape-missing", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ci: { list: { stdout: '[{"conclusion":"","databaseId":1}]' } },
  });
  expect(runHook(missing, "git push origin main").status, "a missing `status` refuses").toBe(2);

  const garbage = fixture("ci-shape-garbage", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ci: { list: { stdout: "not json at all" } },
  });
  expect(runHook(garbage, "git push origin main").status).toBe(2);

  // THE POSITIVE CONTROL: the same fixture shape, well formed, is not
  // refused — so the three refusals above are about the SHAPE and not
  // about this arm refusing whatever it is handed.
  const good = fixture("ci-shape-good", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ci: { list: listOf([runRow()]) },
  });
  expect(runHook(good, "git push origin main").status).toBe(0);

  // The parser under them, one shape per line.
  expect("problem" in parseRunList("[]")).toBe(false);
  expect("problem" in parseRunList("{}")).toBe(true);
  expect("problem" in parseRunList("[3]")).toBe(true);
  expect("problem" in parseRunList('[{"status":"completed","conclusion":"success"}]')).toBe(true);
  expect("problem" in parseRunList('[{"status":1,"conclusion":"","databaseId":1}]')).toBe(true);
  // The optional fields are optional, and their absence is not a refusal.
  const bare = parseRunList('[{"status":"completed","conclusion":"success","databaseId":9}]');
  expect("runs" in bare).toBe(true);
  expect("runs" in bare ? bare.runs[0]?.headSha : "unset").toBe("");

  expect("problem" in parseRunJobs('{"jobs":[]}')).toBe(false);
  expect("problem" in parseRunJobs("[]")).toBe(true);
  expect("problem" in parseRunJobs('{"jobs":3}')).toBe(true);
  expect("problem" in parseRunJobs('{"jobs":[{"name":"linux","conclusion":"failure"}]}')).toBe(true);
  const jobs = parseRunJobs(jobsWithFailingStep("e2e lane"));
  expect("jobs" in jobs).toBe(true);
  expect(failingStep("jobs" in jobs ? jobs.jobs : [])).toEqual({ job: "linux", name: "e2e lane" });
  // A job that failed while naming no failing step yields the JOB, so
  // the seat still hears something.
  const stepless = parseRunJobs('{"jobs":[{"name":"linux","conclusion":"failure","steps":[]}]}');
  expect(failingStep("jobs" in stepless ? stepless.jobs : [])).toEqual({ job: "linux", name: "" });
  const clean = parseRunJobs('{"jobs":[{"name":"linux","conclusion":"success","steps":[]}]}');
  expect(failingStep("jobs" in clean ? clean.jobs : [])).toBeUndefined();
});

test("a running run's EMPTY conclusion is read, never rejected as an unreadable shape", () => {
  // MEASURED ON THE REAL `gh`, 2026-09-02: a run in progress answers
  // `"conclusion": ""`. A shape guard demanding a non-empty string would
  // refuse every live run as unreadable — the arm's fail-closed exception
  // eating the arm's whole subject, and passing every body that only ever
  // checked that a live run refuses.
  const parsed = parseRunList(JSON.stringify([runRow({ status: "in_progress", conclusion: "" })]));
  expect("runs" in parsed, "an empty conclusion is a conclusion").toBe(true);

  const fx = fixture("ci-empty-conclusion", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ci: { list: listOf([runRow({ status: "in_progress", conclusion: "", databaseId: 7300 })]) },
  });
  const { status, stderr } = runHook(fx, "git push origin main");
  expect(status, "a live run allows the push since T-294").toBe(0);
  // THE DISCRIMINATION, UNCHANGED BY THE RETIREMENT: it is read as a
  // LIVE RUN and never as a shape this guard cannot parse. What moved is
  // the verdict the reading reaches, not the reading.
  expect(stderr).toContain("DOES NOT CANCEL IT");
  expect(stderr).toContain("7300");
  expect(stderr).not.toContain("cannot read the answer");
});

test("a status this guard does not recognise is disclosed, and does not refuse", () => {
  expect([...ACTIVE_RUN_STATUSES].sort()).toEqual([
    "in_progress",
    "pending",
    "queued",
    "requested",
    "waiting",
  ]);
  expect(COMPLETED_RUN_STATUS).toBe("completed");

  const fx = fixture("ci-odd-status", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ci: { list: listOf([runRow({ status: "inconceivable", conclusion: "" })]) },
  });
  const { status, stderr } = runHook(fx, "git push origin main");
  expect(status, "an unknown status is this guard's ignorance, not a verdict").toBe(0);
  expect(stderr).toContain("CI'S NEWEST RUN WAS NOT JUDGED");
  expect(stderr, "and it is not read as a run in flight").not.toContain("DOES NOT CANCEL IT");

  // THE CONTROL: a status it DOES recognise, in the same fixture shape.
  // Both allow the push since T-294, so the discriminator is the
  // SENTENCE and no longer the exit code — which is the whole reason
  // this control is spelled out rather than left to the code.
  const known = fixture("ci-known-status", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ci: { list: listOf([runRow({ status: "queued", conclusion: "" })]) },
  });
  const recognised = runHook(known, "git push origin main");
  expect(recognised.status, "a recognised live status allows the push too").toBe(0);
  expect(recognised.stderr, "but it is named as running, not as unjudgeable").toContain(
    "DOES NOT CANCEL IT",
  );
  expect(recognised.stderr).not.toContain("CI'S NEWEST RUN WAS NOT JUDGED");
});

test("the branch reaches `gh` as ONE argument, through no shell", () => {
  // A git ref may legally carry `;`, `$`, `&`, `(`, `)` and a backtick —
  // verified by this fixture existing at all — so a branch name spliced
  // into a command string would be a command-injection surface fed by
  // `git checkout -b`. The shim records each argument on its own line,
  // which is the only way to tell an argv array from a joined string.
  const branch = "ci;echo$(id)&x";
  const fx = fixture("ci-argv", CHECK_EXIT.CURRENT, CURRENT_REPORT, { branch });
  const head = execFileSync("git", ["-C", fx.root, "symbolic-ref", "HEAD"], {
    encoding: "utf8",
  }).trim();
  expect(head, "the precondition: git accepted the ref").toBe(`refs/heads/${branch}`);

  // A PUSH WITH NO REFSPEC, so the branch reaches `gh` off HEAD — which
  // is where a name like this one can come from at all. T-237-s2 changed
  // which SPELLINGS route a name here and changed nothing about the
  // property: whatever the branch, it is an ELEMENT of an argv array.
  runHook(fx, "git push");
  const calls = ghCalls(fx);
  expect(calls.length, "the arm must have asked").toBeGreaterThan(0);
  expect(calls[0], "argv, element for element").toEqual(ghRunListArgv(branch));
  expect(calls[0], "the branch survived as ONE argument, unexpanded").toContain(branch);
  // A shell would have split on `;` and substituted `$(id)`; nothing did.
  expect(calls[0]?.some((a) => a.includes("uid="))).toBe(false);
  expect(existsSync(path.join(fx.root, "x")), "nothing was executed").toBe(false);

  // AND THE OTHER ROUTE IS CLOSED RATHER THAN GUARDED (T-237-s2). A
  // branch name can now reach `gh` off a REFSPEC as well as off HEAD, and
  // the answer is that a hostile one cannot: `UNRESOLVABLE_TOKEN_RE`
  // reads it as a value only a shell knows, the arm declines to ask, and
  // `gh` is handed nothing. One fewer place a ref name travels, rather
  // than one more place it has to be handled safely.
  //
  // THE NAME ABOVE CANNOT EVEN BE SPELLED AS ONE, which is worth saying:
  // `segments` reads its `;` and `&` as COMMAND SEPARATORS, so
  // `git push origin ci;echo$(id)&x` is a push to `ci` followed by other
  // commands — and the quoted spelling that would keep it whole is
  // unresolvable by the same rule. So this half drives a hostile name
  // that carries no separator.
  const hostile = "ci$(id)x";
  expect(UNRESOLVABLE_TOKEN_RE.test(hostile), "the precondition for the sentence below").toBe(true);
  expect(segments(`git push origin ${hostile}`).length, "and it is ONE segment").toBe(1);
  const spelled = fixture("ci-argv-refspec", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const declined = runWiredHook(spelled, `git push origin ${hostile}`);
  expect(declined.status, "an inability is announced and allowed, never refused").toBe(0);
  expect(declined.stderr).toContain("CI WAS NOT ASKED");
  expect(declined.stderr).toContain("only a shell knows");
  expect(ghCalls(spelled), "and `gh` was never asked anything").toEqual([]);
  expect(existsSync(path.join(spelled.root, "x")), "nothing was executed there either").toBe(false);
  // The quoted form the shell would need is unresolvable too, so there is
  // no spelling of this name that reaches the network.
  expect("unresolved" in pushTargetBranch(`git push origin "${branch}"`)).toBe(true);
});

test("CI is not asked for a push the LOCAL arms already refused", () => {
  // The ordering claim, measured rather than asserted in a comment: a
  // push refused for an unmeasured tree spends no network round trip,
  // and the seat is told the local problem it can actually fix.
  const refused = fixture("ci-order-refused", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    token: "missing",
    ci: { list: listOf([runRow({ status: "in_progress", conclusion: "" })]) },
  });
  const run = runHook(refused, "git push origin main");
  expect(run.status).toBe(2);
  expect(run.stderr, "the local arm answers first").toContain("A push is a claim that the gates");
  expect(ghCalls(refused), "and nothing was asked of the remote").toEqual([]);

  // THE CONTROL: the same fixture with a fresh token REACHES the arm.
  // Since T-294 reaching it is not visible in the exit code — a live run
  // allows — so the observable is the round trip itself and the sentence
  // it produces.
  const reached = fixture("ci-order-reached", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    ci: { list: listOf([runRow({ status: "in_progress", conclusion: "" })]) },
  });
  const arm = runHook(reached, "git push origin main");
  expect(arm.status, "the local arms pass, and the CI arm allows").toBe(0);
  expect(arm.stderr, "and the arm was reached — it said what is in flight").toContain(
    "DOES NOT CANCEL IT",
  );
  expect(ghCalls(reached).length).toBeGreaterThan(0);

  // And a command that is not a push asks nothing at all.
  const quiet = fixture("ci-order-not-a-push", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  expect(runHook(quiet, "git status --porcelain").status).toBe(0);
  expect(ghCalls(quiet)).toEqual([]);
});

test("the elapsed time comes from the run's own start, and `updatedAt` is not it", () => {
  // MEASURED: run 33577276465 read `updatedAt` 00:55:14 while it was
  // still genuinely running at 01:02:13Z. A time derived from it is wrong
  // by minutes and stays perfectly plausible, which is the kind of figure
  // nobody checks.
  const started = runRow({ startedAt: "2026-09-01T12:00:05Z", createdAt: "2026-09-01T12:00:00Z" });
  const parsed = parseRunList(JSON.stringify([started]));
  expect("runs" in parsed).toBe(true);
  const run = "runs" in parsed ? parsed.runs[0] : undefined;
  expect(runStartedAt(run as never)).toBe("2026-09-01T12:00:05Z");
  // Absent, it falls back to when the run was created — never to nothing.
  const noStart = parseRunList(JSON.stringify([runRow({ startedAt: undefined })]));
  expect(runStartedAt(("runs" in noStart ? noStart.runs[0] : undefined) as never)).toBe(
    "2026-09-01T12:00:00Z",
  );

  expect(elapsedSince("2026-09-01T12:00:00Z", Date.parse("2026-09-01T12:00:42Z"))).toBe("42s");
  expect(elapsedSince("2026-09-01T12:00:00Z", Date.parse("2026-09-01T12:04:12Z"))).toBe("4m 12s");
  expect(elapsedSince("2026-09-01T12:00:00Z", Date.parse("2026-09-01T14:30:00Z"))).toBe("2h 30m");
  // An unreadable timestamp costs a phrase and never a verdict.
  expect(elapsedSince("", Date.now())).toBe("an unreadable time");
});

/* ══════ THE HOLDER OF THE INTEGRATION CHECKOUT (T-238) ══════════════
 *
 * `method/lane-protocol.md` rule 4 rules ONE holder at a time and says
 * the holder is DECLARED at dispatch and never inferred. Nothing on disk
 * recorded who, so on 2026-09-01 two sessions held the integration
 * checkout at once — one running the four-suite battery and then writing
 * its checkpoint, the other reading. Either one's commit would have
 * STALED THE OTHER'S T-203 TOKEN at the moment it was minted, which is
 * this file's own token arm being corrupted from outside.
 *
 * ── THE HARNESS IS A FIXTURE, AND IT HAS TO BE ───────────────────────
 * The identity is the nearest ancestor that IS the harness. A body
 * resting on the real ancestry would derive one on a developer's laptop
 * and NONE on a CI runner, so the refusal it is written for would be
 * unreachable exactly where nobody is watching. `harnessLink` is a
 * SYMLINK TO NODE NAMED `claude` — the derivation's first arm reads the
 * program's basename — so every body below composes its own session, on
 * any machine, with no production flag and no environment override that
 * could later be used to silence the guard.
 */

/**
 * A stand-in harness: a symlink to this node, named the way the real one
 * is. **THE LINK ITSELF IS `./fake-harness`'s SINCE T-314-s6** — this
 * file wrote its own copy of those four lines, card-preflight.spec.ts
 * wrote another, and a recipe in two places is two chances to disagree
 * (T-057). What stays here is this file's own scratch bookkeeping.
 */
function harnessLink(name: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), `T-238-harness-${name}-`));
  SCRATCH.push(dir);
  return fakeHarness(dir);
}

const CURRENCY_MODULE = path.join(repoRoot, "tools", "e2e", "scripts", "checkout-currency.mjs");

/**
 * THE ONE PROPERTY THE STAND-IN HAS TO HAVE, ASKED OF THE DERIVATION
 * ITSELF (T-314-s6).
 *
 * Everything below that runs a verb under `harnessLink` rests on one
 * claim: a process started through that symlink is what `sessionIdentity`
 * calls the nearest harness ancestor. **AND NOTHING LOCAL REDS WHEN THAT
 * STOPS BEING TRUE** — on a developer's machine the real harness is an
 * ancestor two levels up, so a stand-in the derivation no longer accepts
 * is simply walked past, every body stays green, and the red arrives on
 * the runner, which is the exact failure this card exists to repair. One
 * level up, the same shape.
 *
 * So the claim is asked HERE, of the production derivation, from INSIDE
 * the stand-in. The walk includes the process it starts from, so a link
 * the derivation accepts answers with the stand-in's OWN pid; a link it
 * does not climbs past it to whatever else is up there — a different pid
 * on this machine, and nothing at all on a runner. Both are red, and
 * both are red LOCALLY, which is the point.
 */
test("a process started through the stand-in link IS the nearest harness ancestor, asked of the real derivation", () => {
  const script =
    `import(${JSON.stringify(`file://${CURRENCY_MODULE}`)}).then((m)=>{` +
    `const me=m.sessionIdentity();` +
    `process.stdout.write(JSON.stringify({ok:me.ok,pid:me.ok?me.identity.pid:0,` +
    `why:me.ok?"":me.why,mine:process.pid}));});`;
  const run = spawnSync(harnessLink("is-a-harness"), ["-e", script], { encoding: "utf8" });
  const said = String(run.stdout ?? "");
  if (said === "") throw new Error(`the stand-in produced nothing: ${String(run.stderr)}`);
  const got = JSON.parse(said) as { ok: boolean; pid: number; why: string; mine: number };
  expect(got.ok, got.why).toBe(true);
  expect(got.pid, "and it is the stand-in ITSELF, not something further up this machine").toBe(
    got.mine,
  );
});

/** What the seat looks like when the guarded push is made. */
type Seat = "vacant" | "mine" | "other-live" | "dead" | "unreadable";

/**
 * Run the WIRED hook as a child of a stand-in harness, with the seat put
 * into one named state FIRST — by the harness itself, so a `mine` record
 * carries the very identity the hook then derives.
 */
function pushUnderHarness(
  fx: Fixture,
  seat: Seat,
  opts: { root?: string; deadPid?: number } = {},
): { status: number | null; stderr: string; harnessPid: number } {
  const settings = JSON.parse(
    readFileSync(path.join(repoRoot, ".claude", "settings.json"), "utf8"),
  ) as { hooks: { PreToolUse: { matcher: string; hooks: { command: string }[] }[] } };
  const entry = settings.hooks.PreToolUse.find((h) => new RegExp(`^(${h.matcher})$`).test("Bash"));
  if (entry === undefined) throw new Error("no PreToolUse entry whose matcher matches `Bash`");
  const wired = entry.hooks.map((h) => h.command).join(" && ");
  const root = opts.root ?? fx.root;
  const script =
    `const {spawnSync}=require("node:child_process");` +
    `const {writeFileSync}=require("node:fs");` +
    `const path=require("node:path");` +
    `import(${JSON.stringify(`file://${CURRENCY_MODULE}`)}).then((m)=>{` +
    `const root=${JSON.stringify(root)};` +
    `const seat=${JSON.stringify(seat)};` +
    `if(seat==="mine"){const me=m.sessionIdentity();if(!me.ok)throw new Error(me.why);` +
    `m.writeHolder(root,me.identity);}` +
    `if(seat==="other-live"){const row=m.processRow(${String(process.pid)});` +
    `m.writeHolder(root,{pid:${String(process.pid)},startedAt:row.startedAt,program:"/x/claude"});}` +
    `if(seat==="dead"){m.writeHolder(root,{pid:${String(opts.deadPid ?? 0)},` +
    `startedAt:"Tue Sep 1 00:00:00 2026",program:"/x/claude"});}` +
    `if(seat==="unreadable"){m.writeHolder(root,{pid:1,startedAt:"x",program:""});` +
    `writeFileSync(path.join(root,m.HOLDER_REL_PATH),"{ not json");}` +
    `const r=spawnSync("sh",["-c",${JSON.stringify(wired)}],{` +
    `input:JSON.stringify({tool_name:"Bash",tool_input:{command:"git push origin HEAD:refs/heads/main"},cwd:root}),` +
    `encoding:"utf8"});` +
    `process.stdout.write(JSON.stringify({status:r.status,stderr:String(r.stderr??""),harnessPid:process.pid}));` +
    `});`;
  const outer = spawnSync(harnessLink(`${fx.root.slice(-6)}-${seat}`), ["-e", script], {
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: repoRoot, PATH: fixturePath(fx) },
  });
  const text = String(outer.stdout ?? "");
  if (text === "") throw new Error(`the stand-in harness produced nothing: ${String(outer.stderr)}`);
  return JSON.parse(text) as { status: number | null; stderr: string; harnessPid: number };
}

test("a push from a checkout ANOTHER LIVE SESSION holds is refused, and the same push goes through once the seat is this session's", () => {
  // THE SECOND ACCEPTANCE CRITERION, both halves, in ONE fixture and one
  // process's identity apart. The refusal's holder is this test worker —
  // a process that is genuinely running and is genuinely NOT the session
  // the hook derives — and the control writes the record from inside the
  // stand-in harness, so it carries the very identity the hook then
  // derives for itself.
  const fx = fixture("holder-refuses", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const held = pushUnderHarness(fx, "other-live");
  expect(held.status, "exit 2 is the documented refusal").toBe(2);
  expect(held.stderr).toContain("PUSH REFUSED");
  expect(held.stderr, "naming the holder").toContain("HELD BY ANOTHER LIVE SESSION");
  expect(held.stderr, "and its pid, checked by pid AND start time").toContain(String(process.pid));

  const mine = pushUnderHarness(fx, "mine");
  expect(mine.status, "the control: the seat is this session's and the push proceeds").toBe(0);
  expect(mine.stderr, "and an ordinary allow says nothing at all").toBe("");
});

test("a DEAD holder is announced and the push proceeds; an UNCLAIMED seat is silent", () => {
  // The third and fourth of the arm's four dispositions. A dead holder's
  // refusal retires itself with the process, so the guard says so and
  // steps over it; a checkout NOBODY has claimed is not a collision, and
  // a line on every push until the project adopts `--take-seat` is the
  // noise this file refuses under `not-this-repository`.
  const reaped = spawnSync("sh", ["-c", "exit 0"]);
  const fx = fixture("holder-dead", CHECK_EXIT.CURRENT, CURRENT_REPORT);

  const vacant = pushUnderHarness(fx, "vacant");
  expect(vacant.status, "an unclaimed seat allows").toBe(0);
  expect(vacant.stderr, "and says nothing").toBe("");

  const dead = pushUnderHarness(fx, "dead", { deadPid: reaped.pid as number });
  expect(dead.status, "a dead holder allows too").toBe(0);
  expect(dead.stderr, "but it is ANNOUNCED, with the remedy").toContain(
    "THE INTEGRATION SEAT'S RECORDED HOLDER IS GONE",
  );
  expect(dead.stderr).toContain("--take-seat");
});

test("a holder record this guard cannot READ is announced and allowed, never refused", () => {
  // THE INABILITY, WHICH IS THE HALF A GUARD GETS WRONG. Every arm in
  // this file but the token allows when it cannot answer, and an
  // unreadable record is precisely that: it is not a vacant seat and it
  // is not a collision, it is a question nobody could ask. The control
  // is the body above, where the SAME fixture shape refuses on a record
  // that reads.
  const fx = fixture("holder-unreadable", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const run = pushUnderHarness(fx, "unreadable");
  expect(run.status, "allowed").toBe(0);
  expect(run.stderr).toContain("WHO HOLDS THIS CHECKOUT WAS NOT ESTABLISHED");
  expect(run.stderr, "and it does not claim the seat is anybody's").toContain(
    "nothing here has said this seat is yours",
  );
});

/**
 * `decide` with every runner ARMED BY THIS FILE (T-238-s2).
 *
 * ── THE BODY BELOW WAS GREEN HERE AND RED ON THE RUNNER ─────────────
 * The holder arm's answer depends on the CALLING PROCESS'S ANCESTRY —
 * the nearest ancestor that is the harness — and a Playwright worker on a
 * GitHub runner has none (`node ← bash ← Runner`). So a body that armed
 * the arm through the REAL process tree measured this machine rather than
 * the guard: green twenty-for-twenty here, and on 2026-09-02 it reddened
 * main from the one place nobody was watching.
 *
 * THE REPAIR IS A SEAM, NOT A DERIVATION. `decide` takes its holder
 * runner as a parameter for exactly the reason it takes `check`, `cheap`
 * and `gh`, and this helper supplies all four — so the state under test
 * is composed here and the body discriminates on every machine. It is a
 * parameter and never an environment override: nothing outside this
 * process can reach it, so it can never be used to silence the guard.
 *
 * ── AND THE PROCESS TABLE IS A SEAM TOO (T-238-s1) ──────────────────
 * `identity` composes THIS SESSION; `readProcess` composes the table the
 * RECORD's liveness is judged against. A body that supplied only the
 * first still borrowed the machine for the second — it wrote a record
 * naming `process.pid` with `processRow(process.pid)?.startedAt ?? ""`,
 * so a `ps` that came back slow or empty under load left `startedAt`
 * empty, the record failed its own shape check, and the arm answered
 * about the machine. Both halves are composed now: the record names a
 * process the body invented and the table says it is running, so nothing
 * in the seat arm depends on what else is on this host.
 *
 * @param identity what this session's identity DERIVES to, or why it does not.
 * @param readProcess the process table the RECORD's liveness is read from.
 */
function decideWithSeat(
  cwd: string,
  command: string,
  identity: { ok: true; identity: { pid: number; startedAt: string; program: string } } | { ok: false; why: string },
  readProcess?: (pid: number) => PsRow | undefined,
) {
  return decide(
    { toolName: "Bash", toolInput: { command }, cwd },
    () => ({ status: CHECK_EXIT.CURRENT, stdout: CURRENT_REPORT, stderr: "" }),
    () => ({ status: CHEAP_CHECKS_EXIT.CLEAN, stdout: "", stderr: "" }),
    NO_RUNS,
    (options) =>
      holderVerdict({ ...options, identity, ...(readProcess === undefined ? {} : { readProcess }) }),
  );
}

/** One row of the process table, in the shape `processRow` returns. */
interface PsRow {
  pid: number;
  ppid: number;
  startedAt: string;
  command: string;
}

/** A process table a body wrote, read the way `processRow` reads one. */
function table(rows: PsRow[]): (pid: number) => PsRow | undefined {
  const byPid = new Map(rows.map((r) => [r.pid, r]));
  return (pid: number) => byPid.get(pid);
}

/**
 * WHAT THE ARM ACTUALLY ANSWERED, for an assertion's own message
 * (T-238-s1, taking T-216-s8's ATTRIBUTION).
 *
 * The body below reds only inside a full suite run on a loaded machine,
 * and its recorded failure was an OR over `verdict` and the notices —
 * which names WHICH assertion fell and nothing about WHY. Enumerating the
 * arm's reachable states by hand afterwards is how four cards were spent
 * on it. The `code` and the notices are exactly what separate a SILENT
 * allow (`not-a-repository`, `not-this-repository`, `holder-vacant`,
 * `holder-head-names-no-branch`) from a speaking one, so they go INTO the
 * message: the next red attributes itself in the line that reports it.
 */
function said(d: ReturnType<typeof decide>): string {
  return `verdict=${d.verdict} code=${d.code} notices=${JSON.stringify(d.notices ?? [])}`;
}

test("a lane holds no seat, so a holder record in one refuses nothing", () => {
  // THE FIFTH ACCEPTANCE CRITERION, from the direction that could do
  // harm: a guard that read a stray record in a LANE would refuse every
  // lane push on this machine. The record planted here is the SAME one
  // that refuses on the integration branch two bodies up — only the
  // checked-out ref differs.
  //
  // ── T-238-s1: THIS BODY USED TO MEASURE THE MACHINE ────────────────
  // It reds only inside the FULL e2e run and only on a loaded host —
  // measured that way by four lanes (T-225-s14, T-229-s11, T-219-s4,
  // T-216-s8) and never alone — and its failure was the control's OR,
  // which reports nothing about WHY. Two changes, in the order T-216-s8's
  // attribution asks for. FIRST, IT ATTRIBUTES: `said` puts the arm's
  // `code` and its notices into every message, so the next red names the
  // silent allow it came through instead of leaving the next seat to
  // enumerate the states by hand. SECOND, IT STOPS DEPENDING ON THE HOST:
  // the record used to name `process.pid` with
  // `processRow(process.pid)?.startedAt ?? ""` — a `ps` read that comes
  // back empty under load makes the record fail its own shape check —
  // and the session it is compared against read `processRow(process.ppid)`
  // the same way. Both are COMPOSED now, table and all, so the only
  // things left in this body's path are the fixture's own files.
  const fx = fixture("holder-lane", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    branch: "task/T-901-holder-lane",
    fence: ["docs"],
  });
  const HOLDER_PID = 90_501;
  const OTHER_PID = 90_502;
  const rows: PsRow[] = [
    { pid: HOLDER_PID, ppid: 1, startedAt: "Tue Sep 1 23:29:18 2026", command: "/x/claude" },
    { pid: OTHER_PID, ppid: 1, startedAt: "Tue Sep 1 23:52:34 2026", command: "/x/claude" },
  ];
  const ps = table(rows);
  const record = { pid: HOLDER_PID, startedAt: "Tue Sep 1 23:29:18 2026", program: "/x/claude" };
  writeHolder(fx.root, record);
  // A SESSION THAT IS NOT THE HOLDER, composed here rather than borrowed
  // from this machine's ancestry: an identity the table says is alive and
  // is not the record's.
  const someoneElse = {
    ok: true as const,
    identity: { pid: OTHER_PID, startedAt: "Tue Sep 1 23:52:34 2026", program: "/x/claude" },
  };
  const d = decideWithSeat(fx.root, "git push", someoneElse, ps);
  expect(d.verdict, `a lane does not hold a seat — ${said(d)}`).toBe("allow");
  expect(d.code, `and the refusal code never appears — ${said(d)}`).not.toBe(
    "holder-live-elsewhere",
  );
  expect(
    (d.notices ?? []).join("\n"),
    `nor is anything said about a seat — ${said(d)}`,
  ).not.toContain("SEAT");

  // THE POSITIVE CONTROL: the very same record, in the very same shape,
  // and the very same composed session — on the integration branch, which
  // is the one place a seat exists.
  const onMain = fixture("holder-lane-control", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  writeHolder(onMain.root, record);
  const control = decideWithSeat(onMain.root, "git push", someoneElse, ps);
  expect(
    control.verdict === "block" || (control.notices ?? []).join("").includes("SEAT"),
    `the same record on the integration branch is not ignored — ${said(control)}`,
  ).toBe(true);
  expect(control.code, `and it is the collision, named — ${said(control)}`).toBe(
    "holder-live-elsewhere",
  );
});

test("a session whose own identity will not derive is ANNOUNCED and allowed — the runner's case", () => {
  // T-238-s2, AND IT IS THE CASE THAT REDDENED MAIN. On a CI runner this
  // hook's whole ancestry is `node ← bash ← Runner`, the identity derives
  // to nothing, and the arm cannot tell the recorded holder from this
  // session. It ANNOUNCES and ALLOWS — the disclosed fail-open shape the
  // CI arm already uses for an unreachable `gh` — because an inability is
  // not a verdict, and a runner never holds this project's seat.
  const fx = fixture("holder-underivable", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const live = processRow(process.pid);
  const record = { pid: process.pid, startedAt: live?.startedAt ?? "", program: "/x/claude" };
  writeHolder(fx.root, record);

  const blind = decideWithSeat(fx.root, "git push", {
    ok: false,
    why: "no harness ancestor: node <- bash <- Runner",
  });
  expect(blind.verdict, "an inability may not become a verdict").toBe("allow");
  expect(blind.code, "and the refusal is not reached").not.toBe("holder-live-elsewhere");
  const said = (blind.notices ?? []).join("\n");
  expect(said, "but it is ANNOUNCED, never silent").toContain(
    "WHO HOLDS THIS CHECKOUT WAS NOT ESTABLISHED",
  );
  expect(said, "naming the case, so a reader on a runner is not left guessing").toContain(
    "CI runner",
  );
  expect(said, "and quoting the derivation's own reason").toContain("no harness ancestor");

  // THE POSITIVE CONTROL, one argument away: the SAME record, the SAME
  // checkout, and a session whose identity DOES derive and is not the
  // holder's. Without it every assertion above is satisfied by an arm
  // that never refuses anything.
  const seeing = decideWithSeat(fx.root, "git push", {
    ok: true,
    identity: {
      pid: process.ppid,
      startedAt: processRow(process.ppid)?.startedAt ?? "",
      program: "/x/claude",
    },
  });
  expect(seeing.verdict, "the derivable case refuses a live OTHER holder").toBe("block");
  expect(seeing.code).toBe("holder-live-elsewhere");
  expect(seeing.reason).toContain("HELD BY ANOTHER LIVE SESSION");
});

test("a push from a DETACHED checkout is ANNOUNCED as holding no seat, where it used to be silent", () => {
  // T-238-s1, ITEM 4. `holderVerdict` decides "the integration checkout"
  // by the checked-out REF, so a DETACHED tree — a verifier bench, a
  // poison drill, the human's app checkout, and a seat that detached in
  // the integration tree itself — answers `not-integration` and was
  // passed over in the same silence a LANE gets. For a lane that silence
  // is correct and deliberate (rule 4: a lane holds no seat, and a line
  // on every lane push is the noise this file refuses). For a detached
  // checkout nobody had ever been told: the seat is taken by nothing and
  // refused by nothing, and a seat working there is unrecorded.
  //
  // KILLED BY: collapsing the two `not-integration` codes back into one,
  // which puts the detached case back in the lane's silence — and the
  // LANE half below would still pass, which is why both are here.
  const fx = fixture("holder-detached", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const tip = execFileSync("git", ["-C", fx.root, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  execFileSync("git", ["-C", fx.root, "checkout", "--quiet", "--detach", tip], { stdio: "pipe" });
  const mine = {
    ok: true as const,
    identity: { pid: 90_601, startedAt: "Tue Sep 1 23:52:34 2026", program: "/x/claude" },
  };
  const d = decideWithSeat(fx.root, "git push", mine);
  expect(d.verdict, `a detached checkout is not refused — ${said(d)}`).toBe("allow");
  const notices = (d.notices ?? []).join("\n");
  expect(notices, `but it is SAID — ${said(d)}`).toContain("NAMES NO BRANCH, SO IT HOLDS NO SEAT");
  expect(notices, "with the consequence a seat needs to hear").toContain("UNRECORDED");
  expect(notices, "and the way back into being seen").toContain("--take-seat");

  // THE CONTROL, TWICE, because this notice's whole risk is becoming
  // noise. A LANE reaches the other `not-integration` code and says
  // NOTHING; the integration branch itself says nothing either when the
  // seat is unclaimed. One fixture, three refs.
  execFileSync("git", ["-C", fx.root, "checkout", "--quiet", "-b", "task/T-901-detach-control"], {
    stdio: "pipe",
  });
  const lane = decideWithSeat(fx.root, "git push", mine);
  expect(lane.verdict, `a lane still allows — ${said(lane)}`).toBe("allow");
  expect((lane.notices ?? []).join("\n"), `and still silently — ${said(lane)}`).not.toContain(
    "SEAT",
  );

  execFileSync("git", ["-C", fx.root, "checkout", "--quiet", "main"], { stdio: "pipe" });
  const onMain = decideWithSeat(fx.root, "git push", mine);
  expect(onMain.verdict, `an unclaimed integration checkout allows — ${said(onMain)}`).toBe("allow");
  expect(
    (onMain.notices ?? []).join("\n"),
    `and stays silent, which is the declared limit — ${said(onMain)}`,
  ).not.toContain("SEAT");
});

test("WITH the holder arm, a push from a checkout another session holds never reaches the remote", () => {
  // WHAT REACHES THE REMOTE, not what an exit code was — the property
  // this file measures for every other arm it has.
  const fx = fixture("holder-remote", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const before = remoteTip(fx);
  const refused = pushUnderHarness(fx, "other-live");
  expect(refused.status).toBe(2);
  expect(remoteTip(fx), "the remote never moved").toBe(before);

  const allowed = pushUnderHarness(fx, "mine");
  expect(allowed.status).toBe(0);
  execFileSync(
    "git",
    ["-C", fx.root, ...NO_BACKGROUND_MAINTENANCE, "push", "-q", "origin", "HEAD:refs/heads/main"],
    { stdio: "pipe" },
  );
  expect(remoteTip(fx), "and the control's push does reach it").toBe(fx.unpushed);
});

/* ════════ T-237-s2 — THE THREE RESIDUALS OF T-237, IN ONE LANE ══════
 *
 * Each of the three was found by a seat reading T-237's own build rather
 * than by a failure, and each is the same shape: an arm that is CORRECT
 * about the case it was written for and SILENT about the cases beside it.
 *
 *   THE CONCLUSION — `failure` was the whole announced set, so a run that
 *     TIMED OUT reached the seat as "not read". A hung suite is a suite
 *     that did not pass.
 *   THE BOUND — 15 s was picked in a lane and never measured against
 *     anything. It is now measured, and the measurement is exported so a
 *     body can hold the ratio rather than the sentence.
 *   THE BRANCH — the arm asked about the branch the CHECKOUT is on, so a
 *     refspec push from a lane was asked about the lane. The guard was
 *     strictest exactly where the seat was safest.
 *
 * Every body below drives the WIRED hook, and every allow is paired with
 * the same fixture shape refusing or speaking — docs/CONVENTIONS.md's
 * LIFTING A SAFETY GUARD bullet, kept the way the bodies above keep it.
 */

/** `gh run view --json jobs` for a run that produced no jobs at all. */
const NO_JOBS = JSON.stringify({ jobs: [] });

test("a run that timed out, failed to start or waits on a human is announced as the red it is", () => {
  // THE RESIDUAL, MEASURED. Before T-237-s2 each of these three reached
  // the seat as `CI'S LAST VERDICT WAS NOT READ` — honest, and thin
  // enough that the seat still owed a `gh run view` by hand, which is
  // the manual step this whole arm exists to remove.
  const cases = [
    {
      conclusion: "timed_out",
      // A TIMED-OUT RUN'S JOB CARRIES THE SAME WORD, so the failing step
      // is nameable and the announcement is the FULL one — run id,
      // failing step, and whether this push reaches that step's package.
      view: jobsWithFailingStep("e2e lane", "timed_out"),
      names: "tools/e2e/",
      id: 8201,
    },
    {
      conclusion: "startup_failure",
      // A RUNNER THAT NEVER STARTED HAS NO JOBS, so the step is
      // unnameable and the guard SAYS SO rather than inventing one.
      view: NO_JOBS,
      names: "the failing step cannot be named from here",
      id: 8202,
    },
    {
      conclusion: "action_required",
      view: NO_JOBS,
      names: "the failing step cannot be named from here",
      id: 8203,
    },
  ];

  for (const c of cases) {
    expect(ANNOUNCED_RED_CONCLUSIONS, `${c.conclusion} is not announced`).toContain(c.conclusion);
    const fx = fixture(`s2-${c.conclusion}`, CHECK_EXIT.CURRENT, CURRENT_REPORT);
    armGh(fx, {
      list: listOf([runRow({ conclusion: c.conclusion, databaseId: c.id, headSha: fx.base })]),
      view: { stdout: c.view },
    });
    const { status, stderr } = runWiredHook(fx, "git push origin main");
    expect(status, `a ${c.conclusion} run must ANNOUNCE and never refuse`).toBe(0);
    expect(stderr, "the same headline `failure` earns").toContain("CI IS RED UNDER THIS PUSH");
    expect(stderr, "the run id").toContain(String(c.id));
    expect(stderr, "AND THE CONCLUSION NAMED — four reds mean four things").toContain(
      `\`${c.conclusion}\``,
    );
    expect(stderr, "the announcement's own second half").toContain(c.names);
    expect(stderr, "and it is not the thin catch-all any more").not.toContain(
      "CI'S LAST VERDICT WAS NOT READ",
    );
    expect(stderr).toContain("THIS IS NOT A REFUSAL");

    // THE CONTROL, IN THE SAME FIXTURE SHAPE: `success` is SILENT. An
    // arm that announced everything would satisfy every line above.
    const green = fixture(`s2-${c.conclusion}-control`, CHECK_EXIT.CURRENT, CURRENT_REPORT);
    armGh(green, {
      list: listOf([runRow({ conclusion: "success", databaseId: c.id, headSha: green.base })]),
      view: { stdout: c.view },
    });
    const control = runWiredHook(green, "git push origin main");
    expect(control.status, "the green control must push").toBe(0);
    expect(control.stderr, "and an ordinary allow says NOTHING").toBe("");
  }

  // AND THE FLOOR THE WIDENING RESTS ON: a conclusion on NEITHER list is
  // still heard, as the catch-all that names it and hands over the CLI.
  const odd = fixture("s2-unknown-conclusion", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  armGh(odd, { list: listOf([runRow({ conclusion: "neutral", databaseId: 8204 })]) });
  const unknown = runWiredHook(odd, "git push origin main");
  expect(unknown.status).toBe(0);
  expect(unknown.stderr).toContain("CI'S LAST VERDICT WAS NOT READ");
  expect(unknown.stderr).toContain("`neutral`");
  for (const c of ANNOUNCED_RED_CONCLUSIONS) {
    expect(unknown.stderr, "and it names the set it read, not one word of it").toContain(`\`${c}\``);
  }
});

test("`cancelled` stays OUT of the announced set, and the reason is recorded beside the constant", () => {
  // THIS CARD'S SECOND CRITERION, AND IT IS TWO CLAIMS. The first is
  // about the set.
  expect(ANNOUNCED_RED_CONCLUSIONS, "a cancellation is not a verdict about a tree").not.toContain(
    "cancelled",
  );
  for (const c of ANNOUNCED_RED_CONCLUSIONS) {
    expect(
      NON_VERDICT_CONCLUSIONS,
      `${c} is both skipped on the way to a verdict and announced as one`,
    ).not.toContain(c);
  }

  // The second is about WHERE the reason lives, because a reason kept
  // anywhere but beside the constant is a reason the next editor widening
  // this list will not meet.
  const source = readFileSync(path.join(repoRoot, ".claude", "hooks", "push-guard.mjs"), "utf8");
  const at = source.indexOf("export const ANNOUNCED_RED_CONCLUSIONS");
  expect(at, "the announced set is no longer declared under that name").toBeGreaterThan(0);
  const doc = source.slice(0, at).slice(source.slice(0, at).lastIndexOf("/**"));
  expect(doc, "the constant carries no docblock").toContain("*/");
  expect(doc, "the docblock beside the constant does not mention `cancelled`").toContain(
    "cancelled",
  );
  expect(doc, "nor the workflow setting that makes it this guard's own footprint").toContain(
    "cancel-in-progress",
  );
  expect(doc, "nor the word for what a cancelled run actually is").toContain("superseded");

  // AND MECHANICALLY: a stack of cancellations reaches no announcement.
  const quiet = fixture("s2-cancelled-only", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  armGh(quiet, {
    list: listOf([
      runRow({ conclusion: "cancelled", databaseId: 8301 }),
      runRow({ conclusion: "cancelled", databaseId: 8300 }),
    ]),
  });
  const silent = runWiredHook(quiet, "git push origin main");
  expect(silent.status).toBe(0);
  expect(silent.stderr, "the guard's own footprint is never announced back at the seat").toBe("");

  // THE CONTROL: the same fixture shape, one conclusion moved, speaks.
  const loud = fixture("s2-cancelled-control", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  armGh(loud, {
    list: listOf([
      runRow({ conclusion: "timed_out", databaseId: 8302, headSha: loud.base }),
      runRow({ conclusion: "cancelled", databaseId: 8300 }),
    ]),
    view: { stdout: NO_JOBS },
  });
  expect(runWiredHook(loud, "git push origin main").stderr).toContain("CI IS RED UNDER THIS PUSH");
});

test("the `gh` bound is a ratio over a MEASUREMENT, and the measurement is said where CI can read it", () => {
  // THE ABSORBED T-237-s4. The bound was picked in a lane; these are the
  // numbers it is now kept for, re-derivable by hand from the command the
  // constant names.
  expect(GH_MEASURED_MS.runList.samples, "one sample is an anecdote").toBeGreaterThanOrEqual(5);
  expect(GH_MEASURED_MS.runView.samples).toBeGreaterThanOrEqual(5);
  expect(
    GH_MEASURED_MS.at,
    "a LIVE figure carries the time and host it was read at, never a commit",
  ).toMatch(/\d{4}-\d{2}-\d{2}/);
  expect(GH_MEASURED_MS.runList.slowestMs).toBeGreaterThanOrEqual(GH_MEASURED_MS.runList.medianMs);
  expect(GH_MEASURED_MS.runView.slowestMs).toBeGreaterThanOrEqual(GH_MEASURED_MS.runView.medianMs);

  const slowest = Math.max(GH_MEASURED_MS.runList.slowestMs, GH_MEASURED_MS.runView.slowestMs);
  const ratio = GH_TIMEOUT_MS / slowest;
  disclose(
    "T-237-s2 gh bound",
    `${String(GH_TIMEOUT_MS)}ms over a slowest measured call of ${String(slowest)}ms = ` +
      `${ratio.toFixed(1)}x (${GH_MEASURED_MS.at})`,
  );
  // FIVE TIMES IS THE FLOOR AND THE ARGUMENT IS ASYMMETRIC: a bound set
  // near the median turns ordinary network variance into a push that
  // silently stopped asking CI, and a guard that goes quiet leaves
  // nothing behind to notice. Too high costs bounded, visible wall time.
  expect(
    ratio,
    "the bound has been moved down toward the measurement — re-read GH_TIMEOUT_MS's own header",
  ).toBeGreaterThanOrEqual(5);

  // AND THE FIGURE CI CAN ACTUALLY READ: the guard's own spawn-and-read,
  // with no network in it. The real call cannot be timed on a runner —
  // this file is a PreToolUse hook and never runs there, and `ci.yml`
  // grants `contents: read` only, so `gh run list` is refused for want of
  // `actions: read`. This floor runs everywhere and bounds the half this
  // file controls.
  const fx = fixture("s2-gh-floor", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const argv = ghRunListArgv("main");
  const samples: number[] = [];
  for (let i = 0; i < 5; i += 1) {
    const started = Date.now();
    // `runGh`'s OWN SPAWN SHAPE, reproduced rather than called: `runGh`
    // inherits this process's PATH by design, and the fixture's shim has
    // to be first or the body would reach the real binary — which is the
    // rejection this whole file's shim exists to avoid.
    const out = spawnSync(GH_BIN, argv, {
      cwd: fx.root,
      encoding: "utf8",
      env: { ...process.env, PATH: fixturePath(fx) },
    });
    samples.push(Date.now() - started);
    expect(out.status, "the shim must answer, or this is not a measurement").toBe(0);
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const median = Number(sorted[Math.floor(sorted.length / 2)]);
  const slowestFloor = Math.max(...samples);
  disclose(
    "T-237-s2 gh floor (the HARNESS's figure, never `gh`'s)",
    `${String(samples.length)} shim calls on ${process.platform} node ${process.version}: ` +
      `${samples.join("/")}ms, median ${String(median)}ms, slowest ${String(slowestFloor)}ms ` +
      `against a ${String(GH_TIMEOUT_MS)}ms bound`,
  );
  // THE MEDIAN AND NOT THE MAXIMUM: the first spawn on a cold runner pays
  // for a page cache nothing else does, and a body that reds on that
  // measures the machine's mood. The claim is about the ORDER OF
  // MAGNITUDE between this file's own overhead and the bound it sets.
  expect(
    median * 10,
    "the bound is not ten times this machine's own spawn-and-read floor",
  ).toBeLessThan(GH_TIMEOUT_MS);
});

test("an ordinary push pays ONE round trip, and only a red pays the second", () => {
  // THE OTHER HALF OF T-237-s4: *the two calls SHALL be issued in one
  // round trip where the API allows, or the header SHALL say why not*.
  // They are already one for every push that is not looking at a red —
  // `run list` answers both of this arm's questions off one response.
  const green = fixture("s2-trips-green", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  armGh(green, { list: listOf([runRow({ databaseId: 8400 })]) });
  expect(runWiredHook(green, "git push origin main").status).toBe(0);
  expect(ghCalls(green).length, "a push over a green CI asks once").toBe(1);
  expect(ghCalls(green)[0]?.slice(0, 2)).toEqual(["run", "list"]);

  const red = fixture("s2-trips-red", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  armGh(red, {
    list: listOf([
      runRow({ conclusion: FAILED_CONCLUSION, databaseId: 8401, headSha: red.base }),
    ]),
    view: { stdout: jobsWithFailingStep("e2e lane") },
  });
  expect(runWiredHook(red, "git push origin main").status).toBe(0);
  expect(ghCalls(red).length, "a push over a RED asks twice, to name the step").toBe(2);
  expect(ghCalls(red)[1]?.slice(0, 2)).toEqual(["run", "view"]);

  // AND WHY THE SECOND CANNOT BE FOLDED IN — a property of `gh` and not a
  // choice here: `run list --json` publishes no `jobs` at all, so a
  // failing step is reachable only through `run view`. This is the pin
  // the header's argument rests on, asserted where that argument is made.
  expect(RUN_LIST_JSON_FIELDS, "`gh run list --json` has no `jobs`").not.toContain("jobs");
  expect(RUN_VIEW_JSON_FIELDS, "which is why there is a second call at all").toContain("jobs");
});

test("the branch a push LANDS on is read off the refspec, and doubt is declared", () => {
  // THE ABSORBED T-237-s6, at the reader under it. Every row is a
  // spelling git itself resolves without consulting anything but the
  // command line — which is the line this file draws everywhere between
  // reading and guessing.
  for (const [command, branch] of [
    ["git push origin main", "main"],
    ["git push origin HEAD:refs/heads/main", "main"],
    ["git push origin HEAD:main", "main"],
    ["git push origin main:refs/heads/other", "other"],
    ["git push origin +main", "main"],
    ["git push -u origin task/T-901-a-real-lane", "task/T-901-a-real-lane"],
    ["git push -o ci.skip origin main", "main"],
    ["git push --force-with-lease origin release", "release"],
    ["git -C /somewhere push origin HEAD:refs/heads/main", "main"],
    ["cd /somewhere && git push origin HEAD:refs/heads/main", "main"],
  ] as const) {
    const read = pushTargetBranch(command);
    expect("branch" in read ? read.branch : `NOT READ: ${JSON.stringify(read)}`, command).toBe(
      branch,
    );
  }

  // NO REFSPEC, OR `HEAD` — the target is HEAD's own branch, which is
  // what this arm used unconditionally and is still right about.
  for (const command of ["git push", "git push origin", "git push origin HEAD", "git push -u origin @"]) {
    expect("fallback" in pushTargetBranch(command), command).toBe(true);
  }
  for (const word of HEAD_REFSPEC_WORDS) {
    expect("fallback" in pushTargetBranch(`git push origin ${word}`), word).toBe(true);
  }

  // AND EVERYTHING THIS CANNOT READ TO ONE BRANCH IS DECLARED, never
  // approximated — the treatment `pushCwds` gives a `cd "$LANE"`.
  for (const command of [
    "git push origin $BRANCH",
    'git push origin "main"',
    "git push origin :main",
    "git push origin main:",
    "git push origin tag v1.0",
    "git push origin refs/tags/v1.0",
  ]) {
    expect("unresolved" in pushTargetBranch(command), command).toBe(true);
  }
  // A DELETION LANDS ON NO BRANCH, so it is unresolved and this arm asks
  // nothing — and the base REFUSING such a push on HEAD's live run was a
  // false refusal this card removes.
  for (const flag of PUSH_UNRESOLVING_FLAGS) {
    expect("unresolved" in pushTargetBranch(`git push ${flag} origin main`), flag).toBe(true);
  }
  expect(PUSH_UNRESOLVING_FLAGS, "`--all` pushes HEAD's branch, so it is answerable").not.toContain(
    "--all",
  );
  expect(PUSH_UNRESOLVING_FLAGS).not.toContain("--mirror");
  // AND A FLAG THAT PUSHES EVERY BRANCH PUSHES HEAD'S, so the target is
  // HEAD's own and the rest are disclosed — the several-targets rule, on
  // a set the line does not spell.
  for (const flag of PUSH_ALL_BRANCHES_FLAGS) {
    const read = pushTargetBranch(`git push ${flag} origin`);
    expect("fallback" in read, flag).toBe(true);
    expect("fallback" in read ? read.others.join(" ") : "", flag).toContain(flag);
  }

  // SEVERAL TARGETS ARE NOT A DOUBT — every name is a real target, so
  // asking about the first can only produce a TRUE refusal, and the rest
  // are DISCLOSED. An earlier spelling called this unresolved and thereby
  // let a live run through, which is weaker than the pre-card guard.
  const many = pushTargetBranch("git push origin main dev");
  expect("branch" in many ? many.branch : "NOT READ").toBe("main");
  expect("branch" in many ? many.others : []).toEqual(["dev"]);
  const mixed = pushTargetBranch("git push origin main && git push");
  expect("branch" in mixed ? mixed.others : []).toContain("HEAD");
  // The options that take a SEPARATE value are stepped over, so their
  // value is never mistaken for a refspec — `GIT_GLOBAL_OPTS_WITH_VALUE`
  // one level down, and the same failure if it is missed.
  for (const opt of PUSH_OPTS_WITH_VALUE) {
    const read = pushTargetBranch(`git push ${opt} some-value origin main`);
    expect("branch" in read ? read.branch : `NOT READ: ${JSON.stringify(read)}`, opt).toBe("main");
  }
});

test("a refspec push from a LANE checkout is judged on the branch it lands on, and is ANNOUNCED there", () => {
  // THE DEFECT T-237-s6 MEASURED, AND ITS FIX, IN ONE FIXTURE. A lane
  // worktree pushing `HEAD:refs/heads/main` used to be asked about
  // `task/T-901-a-real-lane` — a branch with no runs — so it went out in
  // SILENCE while the identical push from a `main` checkout was judged.
  //
  // WHAT T-294 MOVED IS THE OBSERVABLE, NEVER THE PROPERTY. The live run
  // is announced rather than refused, so this body reads the SENTENCE
  // and the branch `gh` was actually asked about; the defect it closes —
  // asking about the wrong branch — is caught by exactly the same two
  // assertions it always was.
  const live = listOf([runRow({ status: "in_progress", conclusion: "", databaseId: 9001 })]);
  const fx = laneFixture("s2-refspec-lane", { fence: ["docs/architecture"] });
  armGh(fx, { listByBranch: { main: live }, list: { stdout: "[]" } });

  const branchOf = (fixture: Fixture): string[] =>
    ghCalls(fixture)
      .filter((call) => call.includes("--branch"))
      .map((call) => String(call[call.indexOf("--branch") + 1]));

  const before = remoteTip(fx);
  const judged = runWiredHook(fx, "git push origin HEAD:refs/heads/main", fx.lane);
  expect(judged.status, "a live run on the branch this push LANDS on allows it").toBe(0);
  expect(judged.stderr, "never a refusal").not.toContain("PUSH REFUSED");
  expect(judged.stderr, "the run that keeps running").toContain("9001");
  expect(judged.stderr, "named for the branch the push lands on").toContain("`main`");
  expect(branchOf(fx), "the remote was asked about the branch the push lands on").toContain("main");
  expect(
    branchOf(fx),
    "and never about the lane's own branch, which is the defect this closes",
  ).not.toContain("task/T-901-a-real-lane");

  // AND THE HOOK REACHED NO REMOTE OF ITS OWN — this runs the guard, not
  // the push, which is the arrangement every arm in this file measures.
  expect(remoteTip(fx), "the guard moved nothing").toBe(before);
  expect(remoteTip(fx)).not.toBe(fx.laneTip);

  // THE DISCRIMINATING CONTROL: the SAME lane, the SAME command, the SAME
  // wired hook — and the live run moved onto the LANE's branch instead.
  // Under the old rooting this was the refusing case and the one above
  // was the silent one, so a guard that merely refused everything, or
  // that still read HEAD, fails exactly here.
  const control = laneFixture("s2-refspec-control", { fence: ["docs/architecture"] });
  armGh(control, {
    listByBranch: { "task/T-901-a-real-lane": live },
    list: { stdout: "[]" },
  });
  const allowed = runWiredHook(control, "git push origin HEAD:refs/heads/main", control.lane);
  expect(
    allowed.status,
    `a run on the LANE's branch says nothing about a push landing on main: ${allowed.stderr}`,
  ).toBe(0);
  expect(allowed.stderr, "and it is not announced as one either").not.toContain("would CANCEL it");
  expect(branchOf(control)).toContain("main");
  expect(branchOf(control)).not.toContain("task/T-901-a-real-lane");

  // AND THE SPELLING WITH NO REFSPEC STILL FALLS BACK TO HEAD, which is
  // the half of the old behaviour that was right: from this lane, a bare
  // push is asked about the lane's own branch and IS refused by that same
  // live run.
  const bare = laneFixture("s2-refspec-bare", { fence: ["docs/architecture"] });
  armGh(bare, { listByBranch: { "task/T-901-a-real-lane": live }, list: { stdout: "[]" } });
  const fellBack = runWiredHook(bare, "git push", bare.lane);
  expect(fellBack.status, "a live run allows the push since T-294").toBe(0);
  expect(
    fellBack.stderr,
    "no refspec means HEAD's branch, and that run is named as live",
  ).toContain("`task/T-901-a-real-lane`");
  expect(fellBack.stderr).toContain("DOES NOT CANCEL IT");
  expect(branchOf(bare)).toEqual(["task/T-901-a-real-lane"]);
});

test("a lane pushing `HEAD:refs/heads/main` is STILL not the integration checkout (T-238's fifth criterion)", () => {
  // THE SHARPEST HAZARD IN T-237-s2, PINNED. `decide` computes ONE
  // `headRef` and hands it to five arms — `onLane`, the holder arm, both
  // landing gates and the CI arm. The branch fix therefore adds a SECOND
  // value, read off the refspec and consumed by the CI arm ALONE. Had it
  // redefined `headRef` instead, a lane pushing `HEAD:refs/heads/main`
  // would look like the integration checkout to the holder arm and
  // T-238's fifth criterion would invert: a lane does not hold a seat.
  const fx = laneFixture("s2-holder-refspec", { fence: ["docs/architecture"] });

  // A LIVE OTHER HOLDER'S RECORD, IN THE LANE, and the push whose refspec
  // names the integration branch. `pushUnderHarness` drives exactly that
  // command through the wired hook.
  const inLane = pushUnderHarness(fx, "other-live", { root: fx.lane });
  expect(
    inLane.status,
    `a lane holds no seat, whatever branch its push lands on: ${inLane.stderr}`,
  ).toBe(0);
  expect(inLane.stderr, "the holder refusal must not have fired").not.toContain(
    "HELD BY ANOTHER LIVE SESSION",
  );
  expect(inLane.stderr, "and nothing about a seat is said in a lane at all").not.toContain("SEAT");

  // THE CONTROL: the identical record and the identical command, in the
  // INTEGRATION checkout — where the seat exists and the refusal fires.
  // Without it the assertions above are satisfied by a holder arm that
  // never fires anywhere.
  const onMain = pushUnderHarness(fx, "other-live");
  expect(onMain.status, "the same record on the integration branch refuses").toBe(2);
  expect(onMain.stderr).toContain("HELD BY ANOTHER LIVE SESSION");
});

test("`--all` and `--mirror` are JUDGED against a live run — they push HEAD's branch too", () => {
  // THE FIX PASS. A verifier measured this against the base: from a
  // `main` checkout with one `in_progress` run on `main`, both spellings
  // were JUDGED at 763548c and went UNASKED at that card's first tip —
  // a live run let through UNSEEN where the pre-card guard had seen it,
  // which is this file's own disqualifying test. The first spelling put
  // both flags on the "unresolved" list beside `--delete`, and
  // `ciVerdict` returns from there without asking `gh` anything.
  //
  // SINCE T-294 THE JUDGEMENT IS A SENTENCE RATHER THAN A REFUSAL, so
  // what this body reads is that the arm ASKED and NAMED the run — the
  // property the defect actually broke.
  //
  // Both flags push a set that CONTAINS HEAD's own branch — that is what
  // they mean — so HEAD's is a REAL target and a refusal keyed to it can
  // only be TRUE.
  const live = listOf([runRow({ status: "in_progress", conclusion: "", databaseId: 9301 })]);
  for (const command of ["git push --mirror origin", "git push origin --all"]) {
    const fx = fixture(`s2-fix-${command.includes("mirror") ? "mirror" : "all"}`, CHECK_EXIT.CURRENT, CURRENT_REPORT);
    armGh(fx, { listByBranch: { main: live }, list: { stdout: "[]" } });
    const before = remoteTip(fx);
    const { status, stderr } = runWiredHook(fx, command);
    expect(status, `${command} is allowed while a run for its branch is live`).toBe(0);
    expect(stderr, "never a refusal").not.toContain("PUSH REFUSED");
    expect(stderr, "naming the run that keeps running").toContain("9301");
    expect(stderr, "and the branch it asked about").toContain("`main`");
    expect(stderr, "and saying plainly that it is not cancelled").toContain("DOES NOT CANCEL IT");
    // AND THE SET IT DID NOT ASK ABOUT IS DISCLOSED, because HEAD's is
    // one target of many here and the arm asks about one.
    expect(stderr, "the branches this line does not name are said").toContain("CI WAS ASKED ABOUT");
    expect(remoteTip(fx), "and nothing reached the remote").toBe(before);
  }

  // THE CONTROL, in the same fixture shape: the same two spellings with
  // the run COMPLETED, so the sentence above is keyed to the RUN'S
  // STATUS and not to the flag. Both allow, so the control is on the
  // sentence — which is the whole shape of every control in this file
  // since the refusal was retired.
  for (const command of ["git push --mirror origin", "git push origin --all"]) {
    const fx = fixture(`s2-fix-control-${command.includes("mirror") ? "mirror" : "all"}`, CHECK_EXIT.CURRENT, CURRENT_REPORT);
    armGh(fx, {
      listByBranch: {
        main: listOf([runRow({ status: COMPLETED_RUN_STATUS, conclusion: "success", databaseId: 9301 })]),
      },
      list: { stdout: "[]" },
    });
    const control = runWiredHook(fx, command);
    expect(control.status, `${command} over a green CI must push`).toBe(0);
    expect(
      control.stderr,
      `${command} over a green CI says nothing about a run in flight`,
    ).not.toContain("DOES NOT CANCEL IT");
  }

  // AND THE OTHER HALF OF THE SPLIT: a DELETION still asks nothing, and
  // that is the case the base got WRONG — it refused a push that lands on
  // no branch at all.
  const del = fixture("s2-fix-delete", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  armGh(del, { listByBranch: { main: live }, list: { stdout: "[]" } });
  const deleted = runWiredHook(del, "git push --delete origin some-old-branch");
  expect(deleted.status, "a deletion lands on no branch, so there is nothing to refuse").toBe(0);
  expect(deleted.stderr).toContain("CI WAS NOT ASKED");
  expect(ghCalls(del), "and no round trip was spent").toEqual([]);
});

/* ════════ T-237-s9 — THE REFSPEC READER'S TWO FILED RESIDUES ════════
 *
 * T-237-s2's verifier rejected its three residuals on ONE defect and
 * recorded these two beside it as findings that do NOT block. The fix
 * pass DECLARED them in `pushTargetBranch`'s limits block rather than
 * repairing them, because a fix pass that widens its own diff is one a
 * verifier has to judge twice — so the declaration and the repair are one
 * card apart by design, and the block loses both entries here as it gains
 * them.
 */

test("`--repo` does not move the positional grammar, and the reader is measured against git's own parser", () => {
  // RESIDUE ONE, AND IT WAS NOT TRUE OF `git`. The declared limit read:
  // `--repo=<value>` supplies the repository, so `git push --repo=origin
  // HEAD:main` loses its only refspec to a scanner that drops a
  // positional anyway. THE REPAIR THIS CARD CAME TO MAKE WOULD HAVE MADE
  // THE GUARD WORSE — with every positional read as a refspec, `git push
  // --repo=x origin main` reads its target as `origin`, and CI is asked
  // about a branch of that name while `main` goes unasked.
  //
  // SO THE BODY MEASURES GIT INSTEAD OF ASSERTING THE CARD. git takes the
  // FIRST POSITIONAL as the repository whatever `--repo` says, which is
  // observable without a network: point the positional at something that
  // is not a repository and git says so, in a fixture whose `--repo`
  // value names a remote that works.
  //
  // KILLED BY: making the scanner treat every positional as a refspec
  // under `--repo` — the "repair" — which flips the last two assertions.
  const fx = fixture("s9-repo-grammar", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const git = (...args: string[]) =>
    spawnSync("git", ["-C", fx.root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8" });
  expect(
    git("remote").stdout,
    "the precondition: this fixture has a remote called origin",
  ).toContain("origin");

  const positionalWins = git("push", `${PUSH_REPOSITORY_OPT}=origin`, "./not-a-repository", "main", "--dry-run");
  expect(
    String(positionalWins.stderr),
    "git reads the POSITIONAL as the repository even with --repo given",
  ).toContain("does not appear to be a git repository");
  expect(String(positionalWins.stderr)).toContain("not-a-repository");

  // AND THE OTHER DIRECTION, so the reading above is not one error
  // message doing all the work: a BROKEN `--repo` beside a WORKING
  // positional pushes anyway.
  const optionIgnored = git("push", `${PUSH_REPOSITORY_OPT}=no-such-remote`, "origin", "main", "--dry-run");
  expect(
    optionIgnored.status,
    `a working positional wins over a broken --repo: ${String(optionIgnored.stderr)}`,
  ).toBe(0);

  // THE READER AGREES WITH THAT PARSER, which is the whole claim: the
  // first positional is dropped, `--repo` or not.
  expect(
    "fallback" in pushTargetBranch("git push --repo=origin HEAD:main"),
    "so `HEAD:main` is a REPOSITORY here, not a target this guard should name",
  ).toBe(true);
  const withRepo = pushTargetBranch("git push --repo=x origin main");
  expect(
    "branch" in withRepo && withRepo.branch,
    "and the refspec after the positional repository is still the target",
  ).toBe("main");

  // ONE FACT, CHECKED TWICE: the option takes a SEPARATE value, so the
  // scanner steps over it and never reads it as a positional.
  expect(PUSH_OPTS_WITH_VALUE, "the option takes a separate value").toContain(PUSH_REPOSITORY_OPT);
  expect(
    "branch" in pushTargetBranch("git push --repo some-remote origin main")
      ? (pushTargetBranch("git push --repo some-remote origin main") as { branch: string }).branch
      : "NOT READ",
    "so the separate-value spelling reads the same target",
  ).toBe("main");
});

test("a destination that would read as an OPTION never reaches `gh`, and the push is allowed", () => {
  // RESIDUE TWO, AND THE BODY THE CARD ASKS FOR: drive `HEAD:--version`
  // through the WIRED hook and read the shim's own record of every
  // argument. `git push origin HEAD:--version` was read as a branch named
  // `--version` and `ghRunListArgv` placed it in the argv array where
  // `gh`'s own parser reads it as an option. Bounded — no shell, nothing
  // executed, `gh` answers non-zero and that becomes an announced allow —
  // and still the class `pathsSince` shape-checks `headSha` against one
  // arm over, which is the reason this is repaired rather than tolerated.
  //
  // KILLED BY: removing `readsAsOption`, which puts the value back in the
  // argv array — and `ghCalls` is what makes that visible, since the exit
  // code is 0 either way.
  const fx = fixture("s9-option-like-target", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  const run = runWiredHook(fx, "git push origin HEAD:--version");
  expect(run.status, "an inability is announced and allowed, never refused").toBe(0);
  expect(run.stderr, "and it says the question went unasked").toContain("CI WAS NOT ASKED");
  expect(run.stderr, "naming the shape it refused to hand over").toContain(
    "will not hand a value beginning with `-`",
  );
  expect(ghCalls(fx), "AND `gh` WAS NEVER ASKED ANYTHING — the shim's own record").toEqual([]);

  // THE SAME THROUGH `refs/heads/`, because the name is what matters and
  // not the spelling that carried it.
  const spelled = fixture("s9-option-like-refs", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  expect(runWiredHook(spelled, "git push origin HEAD:refs/heads/--version").status).toBe(0);
  expect(ghCalls(spelled), "the fully spelled ref is refused to the reader too").toEqual([]);

  // THE POSITIVE CONTROL: the same fixture, the same hook, a destination
  // that is an ordinary branch name — `gh` IS asked, with the branch as
  // one element of the argv array. Without it, a guard that had simply
  // stopped asking `gh` anything would pass every assertion above.
  const ok = fixture("s9-option-like-control", CHECK_EXIT.CURRENT, CURRENT_REPORT);
  expect(runWiredHook(ok, "git push origin HEAD:main").status).toBe(0);
  const calls = ghCalls(ok);
  expect(calls.length, "the ordinary destination is asked about").toBeGreaterThan(0);
  expect(calls[0], "argv, element for element").toEqual(ghRunListArgv("main"));

  // AND THE READER ITSELF, so the property is pinned where it lives and
  // not only through the process boundary.
  const read = pushTargetBranch("git push origin HEAD:--version");
  expect("unresolved" in read, "the reader declines rather than naming a branch").toBe(true);
  const ordinary = pushTargetBranch("git push origin HEAD:main");
  expect("branch" in ordinary && ordinary.branch, "and still reads an ordinary one").toBe("main");
});

/* ───────────── T-280: the push owes the set its RANGE owes ────────── */
//
// Everything above this line requires the WHOLE battery, and still does:
// none of those fixtures names an upstream, so no range is derivable in
// them, so the guard falls back to all four suites exactly as it did
// before this arm existed. THAT IS THE FALLBACK BEING EXERCISED BY
// NINETY-ODD BODIES rather than by an assertion, and it is why they are
// all still green.
//
// The bodies below arm an upstream, which is what makes a push range
// exist, and then move ONE thing at a time: what the range touches, and
// what the token measured.

/** Give a fixture the upstream a push range is derived from.
 *
 *  WRITTEN EXPLICITLY RATHER THAN LEFT TO A PUSH'S SIDE EFFECT: whether
 *  `git push <remote> <refspec>` also moves the remote-tracking ref is a
 *  fact about a git version, and a body whose subject silently stopped
 *  being reachable would go quiet rather than red. */
function armUpstream(fx: Fixture, at: string): void {
  const git = (...args: string[]): void => {
    execFileSync("git", ["-C", fx.root, ...NO_BACKGROUND_MAINTENANCE, ...args], { stdio: "pipe" });
  };
  git("update-ref", "refs/remotes/origin/main", at);
  git("config", "branch.main.remote", "origin");
  git("config", "branch.main.merge", "refs/heads/main");
}

/** A token recording exactly these suites GREEN at this checkout's HEAD. */
function plantSuites(root: string, suites: string[], scope?: string): void {
  const ref = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  writeToken(
    root,
    suites.map((s) =>
      s === "e2e" && scope !== undefined
        ? { ...suiteVerdict(s, GREEN, ref), scope }
        : suiteVerdict(s, GREEN, ref),
    ),
  );
}

/** The guard's own decision for a fixture, with the expensive arms shimmed. */
function decideFor(fx: Fixture) {
  return decide(
    { toolName: "Bash", toolInput: { command: "git push" }, cwd: fx.root },
    () => ({ status: CHECK_EXIT.CURRENT, stdout: CURRENT_REPORT, stderr: "" }),
    () => ({ status: 0, stdout: "", stderr: "" }),
    NO_RUNS,
  );
}

test("a push whose range moves one package's source owes only that package's suite, and a token recording only it is ACCEPTED", () => {
  // THE CARD'S WHOLE POINT, AT THE GUARD. Half the batteries this card
  // was written about were pushes that owed almost nothing, and the rule
  // that cost them was the guard demanding four suites regardless.
  const fx = fixture("owed-narrow", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    token: "missing",
    change: "lib/parser/src/x.ts",
  });
  armUpstream(fx, fx.base);

  // THE DERIVATION THE GUARD WILL MAKE, ASKED HERE TOO, so the body says
  // what it is relying on rather than only what it concluded.
  const range = pushRange(fx.root);
  expect("range" in range ? range.range : "").toContain(fx.base);
  const owed = "range" in range ? runOwedSet(fx.root, range.range) : { problem: "no range" };
  expect("owed" in owed ? owed.owed.suites : []).toEqual(["parser"]);

  plantSuites(fx.root, ["parser"]);
  const narrow = decideFor(fx);
  expect(narrow.verdict, `a token covering the owed set must pass: ${narrow.reason}`).toBe("allow");

  // THE CONTROL, AND IT IS THE SAME TOKEN IN THE SAME TREE: strip the
  // upstream, and there is no range to derive, so the whole battery is
  // required and this token is INCOMPLETE. Without this line, "allow"
  // above is satisfied by a guard whose token arm stopped firing.
  execFileSync(
    "git",
    [
      "-C",
      fx.root,
      ...NO_BACKGROUND_MAINTENANCE,
      "config",
      "--unset",
      "branch.main.remote",
    ],
    { stdio: "pipe" },
  );
  const wide = decideFor(fx);
  expect(wide.verdict, "no upstream is no range, and no range is the whole battery").toBe("block");
  expect(wide.code).toBe("token-incomplete");
  expect(wide.reason).toContain("COULD NOT BE DERIVED");
});

test("a token that does not cover the owed set refuses as token-partial, naming the suite the range owes and nothing measured", () => {
  const fx = fixture("owed-partial", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    token: "missing",
    change: "lib/parser/src/x.ts",
  });
  armUpstream(fx, fx.base);

  // A token measuring a suite this range does NOT owe, and missing the
  // one it does. It is not a lie — it says exactly what it measured —
  // and it is the READER that would lie by accepting it.
  plantSuites(fx.root, ["rust"]);
  const refused = decideFor(fx);
  expect(refused.verdict).toBe("block");
  expect(refused.code).toBe("token-partial");
  expect(refused.reason).toContain("parser");
  expect(refused.reason, "the refusal names the range it judged").toContain(fx.base);
  expect(refused.reason, "and the one command that clears it").toContain("--range");

  // THE DISCRIMINATION: adding the owed suite to the same token clears
  // the same push. Nothing else moves.
  plantSuites(fx.root, ["parser", "rust"]);
  expect(decideFor(fx).verdict).toBe("allow");
});

test("the five token reasons that existed before this arm are all still reachable, none renamed", () => {
  // ADDITIVE, IN THE CARD'S OWN WORD, ASSERTED RATHER THAN ASSUMED. Each
  // of these is a fixture whose only difference is the token's state.
  const codes = [
    ["token-missing", "missing"],
    ["token-stale", "stale"],
    ["token-red", "red"],
    ["token-incomplete", "partial"],
  ] as const;
  for (const [code, state] of codes) {
    const fx = fixture(`still-${state}`, CHECK_EXIT.CURRENT, CURRENT_REPORT, { token: state });
    const d = decideFor(fx);
    expect(d.verdict, `${state} must still refuse`).toBe("block");
    expect(d.code, `${state} must still be called ${code}`).toBe(code);
  }
  // The fifth: a suite the runner DECLINED to grade.
  const fx = fixture("still-unmeasured", CHECK_EXIT.CURRENT, CURRENT_REPORT, { token: "missing" });
  const ref = execFileSync("git", ["-C", fx.root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  writeToken(
    fx.root,
    REQUIRED_SUITES.map((s) =>
      s === "rust"
        ? {
            suite: s,
            exit: -1,
            bodies: 0,
            targets: 0,
            verdict: "REFUSED",
            reason: "could-not-run: spawnSync cargo ENOENT",
            ref,
          }
        : suiteVerdict(s, GREEN, ref),
    ),
  );
  expect(decideFor(fx).code).toBe("token-unmeasured");
});

test("every way the owed set cannot be derived lands on the WHOLE battery, and none of them narrows a push", () => {
  // CRITERION 3 AT THE ASKING BOUNDARY. The derivation fails closed
  // inside the runner; this is the other half — the guard failing closed
  // when it cannot ask at all.
  const fx = fixture("owed-closed", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    token: "missing",
    change: "lib/parser/src/x.ts",
  });
  armUpstream(fx, fx.base);
  plantSuites(fx.root, ["parser"]);
  expect(decideFor(fx).verdict, "the control: the narrow token really passes").toBe("allow");

  // A RANGE THAT IS NOT TWO REVISIONS NEVER REACHES git.
  expect("problem" in runOwedSet(fx.root, "HEAD; rm -rf /")).toBe(true);
  // A RUNNER THAT ANSWERS SOMETHING THIS CANNOT READ.
  const notJson = runOwedSet(fx.root, "0000000000000000000000000000000000000000..HEAD");
  expect("problem" in notJson, "an unresolvable base is a problem, never a set").toBe(true);
  // AND A BRANCH WITH NO UPSTREAM, which is every lane in this project.
  const lane = fixture("owed-lane", CHECK_EXIT.CURRENT, CURRENT_REPORT, { token: "missing" });
  expect("problem" in pushRange(lane.root)).toBe(true);
  plantSuites(lane.root, ["parser"]);
  const laneDecision = decideFor(lane);
  expect(laneDecision.verdict, "a lane owes the battery, exactly as before").toBe("block");
  expect(laneDecision.code).toBe("token-incomplete");
});

test("a token whose end-to-end entry graded PART of the leg is refused even when no owed set could be derived, because a scoped GREEN is not a whole leg", () => {
  // THE FALLBACK'S OTHER AXIS, AND THE ONE THIS ARM ADDED.
  //
  // Before this card a plain GREEN `e2e` entry could only have come from
  // a WHOLE leg: the one form that graded a subset wore `SCOPED-GREEN`,
  // which this guard refuses as a token. `--range` now mints a plain
  // GREEN for a NARROWED leg and records what it graded in `scope`, so
  // "four suites GREEN at this tree" no longer implies "the battery
  // ran". The suite axis and the spec axis are two separate claims, and
  // a fallback that checks only the first accepts a leg that ran in
  // part.
  //
  // THE ARMING IS THE ABSENCE OF A RANGE, which is the case the header
  // above says ninety-odd bodies exercise — every one of them with an
  // unscoped token, so none of them can see this.
  const lane = fixture("owed-scope-fallback", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    token: "missing",
  });
  expect("problem" in pushRange(lane.root), "the arming: no range is derivable here").toBe(true);

  // THE CONTROL, WHERE THE PROPERTY UNDER TEST IS ABSENT: the same four
  // suites with NO scope really did grade whole legs, and that push must
  // still pass. Without this line the expectation below is satisfied by
  // a guard that refuses everything.
  plantSuites(lane.root, [...REQUIRED_SUITES]);
  expect(
    decideFor(lane).verdict,
    "the control: a genuine whole four-leg battery still passes",
  ).toBe("allow");

  // AND NOW THE SAME TOKEN, THE SAME TREE, ONE LEG GRADED IN PART.
  plantSuites(lane.root, [...REQUIRED_SUITES], "tools/e2e/tests/cli.spec.ts");
  const decision = decideFor(lane);
  expect(decision.verdict, "a leg graded in part is not the battery").toBe("block");
  expect(decision.code).toBe("token-partial");
  expect(decision.reason, "and the refusal says which leg was short").toContain("e2e");
});

/* ═════════════ T-305 — THE OVER-RUN, SAID OUT LOUD ══════════════════
 *
 * The other direction from T-280. That arm refuses a token that graded
 * LESS than the pushed range owed; a token that graded MORE was silent,
 * and silence is what let four whole batteries run for ranges that owed
 * two spec files in one evening. Every body below plants a token and
 * reads what `decide` said about it — the card's own "seen on a planted
 * token" — and each one carries the control that would catch a guard
 * which had simply started talking on every push.
 */

/** The opener the arm's notice is identified by, in one place. */
const OVER_RUN_OPENER = "THIS PUSH GRADED MORE THAN ITS RANGE OWED";

/** The over-run notice out of a decision, or undefined for silence. */
function overRunLine(d: { notices?: string[] }): string | undefined {
  return (d.notices ?? []).find((n) => n.startsWith(OVER_RUN_OPENER));
}

/**
 * One suite entry in the shape `writeToken` leaves on disk, for the
 * bodies that drive the arm DIRECTLY rather than through a fixture.
 *
 * Written out rather than hand-built at each site because the fields
 * this arm reads — `tree`, `verdict`, `scope` — are three of eleven, and
 * a literal missing one of the other eight is a body that fails to
 * compile for a reason that has nothing to do with what it is asking.
 */
function tokenEntry(
  suite: string,
  tree: string,
  opts: { verdict?: string; scope?: string } = {},
) {
  return {
    ...suiteVerdict(suite, opts.verdict ?? GREEN, "ref"),
    tree,
    treeAtWrite: tree,
    dirty: false,
    at: "2026-09-10T00:00:00.000Z",
    ...(opts.scope === undefined ? {} : { scope: opts.scope }),
  };
}

test("a whole battery for a range that owes ONE suite is allowed, and every leg beyond the set is named with the minutes the owed set would have taken", () => {
  const fx = fixture("over-run-suites", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    token: "missing",
    change: "lib/parser/src/x.ts",
  });
  armUpstream(fx, fx.base);

  // THE DERIVATION THIS BODY RELIES ON, ASKED HERE TOO — the T-280
  // bodies' habit: say what the range owes rather than only what the
  // notice concluded about it.
  const range = pushRange(fx.root);
  const owed = "range" in range ? runOwedSet(fx.root, range.range) : { problem: "no range" };
  expect("owed" in owed ? owed.owed.suites : []).toEqual(["parser"]);

  // THE CONTROL FIRST, because the assertion below is about a SENTENCE
  // and a guard that printed it on every push would satisfy the
  // assertion and fail the card. A token covering exactly the owed set
  // is allowed and says nothing.
  plantSuites(fx.root, ["parser"]);
  const inside = decideFor(fx);
  expect(inside.verdict, "the owed set exactly: allowed").toBe("allow");
  expect(overRunLine(inside), "a run that stayed inside the set is SILENT").toBeUndefined();

  // AND NOW THE HABIT THE CARD IS ABOUT: the same tree, the same range,
  // four whole legs.
  plantSuites(fx.root, [...REQUIRED_SUITES]);
  const over = decideFor(fx);
  expect(over.verdict, "an over-run is never a refusal").toBe("allow");
  const notice = String(overRunLine(over));
  expect(notice, "the notice must reach the seat at all").toContain(OVER_RUN_OPENER);
  for (const leg of ["app", "e2e", "rust"]) {
    expect(notice, `${leg} ran and this range does not owe it`).toContain(leg);
  }
  expect(notice, "the leg the range DOES owe is not an over-run").toMatch(
    /whole leg\(s\) this range does not owe: app, e2e, rust/,
  );
  // THE MINUTES THE OWED SET WOULD HAVE TAKEN — the criterion's own
  // clause. The parser leg alone is 20 seconds by the table, which is
  // 0.3 of a minute; the four legs beyond it are 640, which is 10.7.
  expect(notice).toContain("THIS RANGE OWES parser, about 0.3 minute(s)");
  expect(notice).toContain("about 10.7 minute(s)");
  expect(notice, "and the command that would have run the narrow set").toContain(
    `gate-run.mjs --range ${"range" in range ? range.range : ""}`,
  );

  // AND IT REACHES THE SEAT THROUGH THE REAL RUNNER, at exit 0. This
  // file's own ANNOUNCED_ALLOW_CODES header records that a passing
  // hook's stdout is not shown; notices go to STDERR and are written
  // before the verdict, so this is the half that decides whether the
  // sentence is read by anybody.
  const wired = runHook(fx, "git push origin HEAD:refs/heads/main");
  expect(wired.status, "an over-run is allowed by the real runner too").toBe(0);
  expect(wired.stderr, "and the notice is on stderr, where a seat sees it").toContain(
    OVER_RUN_OPENER,
  );
  disclose("over-run-notice", notice.split("\n")[0] ?? "");
});

test("the SPEC axis: a whole browser leg where the range owed spec files is named as the whole leg, and a scope carrying specs the range does not owe names those", () => {
  // A FIXTURE WITH A SPEC IN IT, so the owed set can be NARROWED rather
  // than whole — the shape every push this card was written about had.
  const fx = fixture("over-run-specs", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    token: "missing",
    seed: {
      "tools/e2e/tests/other.spec.ts": 'import { helper } from "./helpers";\n',
      "tools/e2e/tests/helpers.ts": "export const helper = 1;\n",
    },
    change: "tools/e2e/tests/helpers.ts",
  });
  armUpstream(fx, fx.base);
  const range = pushRange(fx.root);
  const owed = "range" in range ? runOwedSet(fx.root, range.range) : { problem: "no range" };
  expect("owed" in owed ? owed.owed.suites : []).toEqual(["e2e"]);
  expect("owed" in owed ? owed.owed.e2e.specs : []).toEqual(["tools/e2e/tests/other.spec.ts"]);
  expect("owed" in owed ? owed.owed.e2e.whole : true, "the leg is owed in PART here").toBe(false);

  // THE CONTROL: the leg graded over exactly the spec files the range
  // owes. Nothing exceeded, nothing said.
  plantSuites(fx.root, ["e2e"], "tools/e2e/tests/other.spec.ts");
  const exact = decideFor(fx);
  expect(exact.verdict).toBe("allow");
  expect(overRunLine(exact), "the owed specs exactly: SILENT").toBeUndefined();

  // AXIS ONE: the leg ran WHOLE. An entry with no `scope` graded the
  // whole leg — that is the field's meaning in gate-token.mjs — so the
  // notice names the WHOLE LEG rather than pretending to know which
  // files it ran.
  plantSuites(fx.root, ["e2e"]);
  const whole = decideFor(fx);
  expect(whole.verdict, "still allowed").toBe("allow");
  expect(String(overRunLine(whole))).toContain("e2e ran WHOLE where this range owes 1 spec file(s)");

  // AXIS TWO: a narrowed run that still carried a file the range does
  // not owe. The owed file is covered — so T-280's arm is satisfied and
  // the push passes — and the extra one is named.
  plantSuites(
    fx.root,
    ["e2e"],
    "tools/e2e/tests/other.spec.ts,tools/e2e/tests/unrelated.spec.ts",
  );
  const extra = decideFor(fx);
  expect(extra.verdict, "covering the owed set and more is not a refusal").toBe("allow");
  const notice = String(overRunLine(extra));
  expect(notice).toContain("e2e graded 1 spec file(s) this range does not owe");
  expect(notice).toContain("tools/e2e/tests/unrelated.spec.ts");
  expect(notice, "the spec the range DOES owe is not named as an over-run").not.toContain(
    "does not owe: tools/e2e/tests/other.spec.ts",
  );
});

test("what an over-run is NOT: a leg graded against an EARLIER tree, and a leg the runner DECLINED to grade", () => {
  const fx = fixture("over-run-not", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    token: "missing",
    change: "lib/parser/src/x.ts",
  });
  armUpstream(fx, fx.base);
  const ref = execFileSync("git", ["-C", fx.root, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const tree = String(headTree(fx.root));

  // THE POSITIVE CONTROL FOR BOTH: the same two legs, graded at THIS
  // tree with a verdict the runner stands behind, ARE an over-run. Both
  // negatives below are about a filter, and a filter that had stopped
  // matching would pass them silently without this line.
  writeToken(fx.root, [suiteVerdict("parser", GREEN, ref), suiteVerdict("rust", GREEN, ref)]);
  expect(String(overRunLine(decideFor(fx))), "the control: rust really is an over-run").toContain(
    "rust",
  );

  // NOT AN OVER-RUN, ONE: an entry keyed to a tree that is not HEAD's.
  // `writeToken` MERGES entries across runs, so a leg graded before the
  // last commit is still in the token — and minutes paid for a tree this
  // push does not carry were not paid for this push. `judgeToken` never
  // looks: it reads staleness only over the suites it REQUIRES, and this
  // one is not one of them.
  writeToken(fx.root, [
    suiteVerdict("parser", GREEN, ref),
    { ...suiteVerdict("rust", GREEN, ref), tree: FOREIGN_TREE },
  ]);
  const earlier = decideFor(fx);
  expect(earlier.verdict, "and it is still an ordinary allow").toBe("allow");
  expect(overRunLine(earlier), "a leg graded at another tree is another push's minute").toBeUndefined();

  // NOT AN OVER-RUN, TWO: a leg the runner DECLINED to grade. REFUSED
  // means no toolchain, zero bodies, a count that would not sum — a leg
  // that did not run cost nobody a minute, and naming it would tell a
  // seat it paid for something it never got.
  writeToken(fx.root, [
    suiteVerdict("parser", GREEN, ref),
    {
      suite: "rust",
      exit: -1,
      bodies: 0,
      targets: 0,
      verdict: UNGRADED_VERDICT,
      reason: "could-not-run: spawnSync cargo ENOENT",
      ref,
      tree,
    },
  ]);
  const declined = decideFor(fx);
  expect(declined.verdict, "an ungraded leg the range does not owe is not a refusal either").toBe(
    "allow",
  );
  expect(overRunLine(declined), "a leg that never ran is not an over-run").toBeUndefined();

  // AND THE WORD IS THE RUNNER'S, ASKED OF THE RUNNER. `judge` is the
  // function that writes it; a rename there reds this line rather than
  // turning the filter above into one that matches nothing.
  expect(
    judge({
      status: 0,
      count: { bodies: 0, targets: 1, baseline: 0, sums: true, how: "this body's own count" },
      ref,
      suite: "rust",
    }).verdict,
  ).toBe(UNGRADED_VERDICT);
});

test("the cost table is docs/CONVENTIONS.md's own two figures, and the notice's minutes are its arithmetic", () => {
  // THE AUTHORITY IS THE DOCUMENT, not this file — the treatment
  // CHECK_ARGV gets against the Rust bullet. Both figures live in one
  // bullet, so one read answers both.
  const bullet = String(conventionsBullet(conventionsText(), "THE BLESSED GATE-RUNNER (T-202):"));
  expect(bullet, "the browser leg's own published figure").toContain(
    "ten of the battery's eleven minutes",
  );
  expect(bullet, "and what the document says the other three cost").toContain(
    "other three legs are seconds each",
  );

  // The arithmetic this table IS: ten minutes of the eleven for the
  // browser leg, the residual sixty seconds split three ways.
  expect(BATTERY_SECONDS).toBe(11 * 60);
  expect(LEG_SECONDS.e2e).toBe(10 * 60);
  expect(Object.values(LEG_SECONDS).reduce((a, b) => a + b, 0)).toBe(BATTERY_SECONDS);
  const others = Object.entries(LEG_SECONDS).filter(([id]) => id !== "e2e");
  expect(others.length, "the residual is split over the other three").toBe(3);
  for (const [id, seconds] of others) {
    expect(seconds, `${id} is priced in seconds, as the document says`).toBe(
      (BATTERY_SECONDS - LEG_SECONDS.e2e) / 3,
    );
  }
  // Every graded suite the runner has is priced, or the notice's figure
  // silently under-reports the habit it is about.
  for (const suite of REQUIRED_SUITES) {
    expect(Object.keys(LEG_SECONDS), `${suite} has no figure in the cost table`).toContain(suite);
  }
  // The per-spec figure is the whole leg divided by the stamped count,
  // and the divisor is here to be re-divided rather than guessed at.
  expect(E2E_SPEC_SECONDS).toBe(LEG_SECONDS.e2e / E2E_SPECS_AT_MEASURE);
  disclose(
    "cost-table",
    `battery ${BATTERY_SECONDS}s, browser leg ${LEG_SECONDS.e2e}s over ` +
      `${E2E_SPECS_AT_MEASURE} spec files at the stamp = ${E2E_SPEC_SECONDS}s each; this tree ` +
      `carries ${readdirSync(path.join(repoRoot, "tools", "e2e", "tests")).filter((f) => f.endsWith(".spec.ts")).length} spec files`,
  );

  // A NARROWED LEG IS PRICED BY ITS SCOPE AND NEVER ABOVE THE WHOLE ONE
  // — no subset of a leg costs more than the leg, however many files a
  // scope names.
  const owed = {
    range: "a..b",
    suites: ["e2e"],
    e2e: { whole: false, specs: ["one.spec.ts", "two.spec.ts"] },
  };
  expect(owedCost(owed).seconds).toBe(2 * E2E_SPEC_SECONDS);
  expect(
    owedCost({ ...owed, e2e: { whole: false, specs: Array.from({ length: 500 }, (_, i) => `s${i}`) } })
      .seconds,
    "a scope wider than the leg is still the leg",
  ).toBe(LEG_SECONDS.e2e);
  expect(owedCost({ ...owed, e2e: { whole: true, specs: [] } }).seconds).toBe(LEG_SECONDS.e2e);
  // And an entry with no scope graded the whole leg — the reader that
  // decides which of those two prices applies.
  expect(gradedSpecs(tokenEntry("e2e", "t"))).toBeUndefined();
  expect(gradedSpecs(tokenEntry("e2e", "t", { scope: "" }))).toBeUndefined();
  expect(gradedSpecs(tokenEntry("e2e", "t", { scope: "a.ts, b.ts" }))).toEqual(["a.ts", "b.ts"]);
});

test("a leg this table cannot price is disclosed as a FLOOR, never counted as nothing", () => {
  // THE GRADED REGISTRY CAN GROW A SUITE, and a table that priced a new
  // one at zero would make every sentence this arm prints quietly too
  // small — in the one direction that flatters the habit the arm exists
  // to name. So it is carried out as a list and said.
  const owed = {
    range: "a..b",
    suites: ["parser", "wasm"],
    e2e: { whole: false, specs: [] },
  };
  const cost = owedCost(owed);
  expect(cost.seconds, "the legs it CAN price are still priced").toBe(LEG_SECONDS.parser);
  expect(cost.unpriced).toEqual(["wasm"]);

  const tree = "t".repeat(40);
  const token = {
    version: 1,
    writtenAt: "2026-09-10T00:00:00.000Z",
    writtenFrom: "the directory this body never writes in",
    suites: { parser: tokenEntry("parser", tree), wasm: tokenEntry("wasm", tree) },
  };
  const over = overRun(token, owed, tree);
  expect(over, "the control: `parser` is owed, so only `wasm` could be over-run").toBeUndefined();

  // And with `wasm` off the owed set it IS an over-run — priced at
  // nothing, and the notice says the figure is a floor rather than
  // reporting zero minutes as though it were a measurement.
  const narrow = { ...owed, suites: ["parser"] };
  const notice = String(overRunNotice(token, narrow, tree));
  expect(notice).toContain("wasm");
  expect(notice, "the over-run's own figure is disclosed as a floor").toContain("FLOOR");
  expect(overRun(token, narrow, tree)?.unpriced).toEqual(["wasm"]);
  expect(overRun(token, narrow, tree)?.seconds, "an unpriced leg adds nothing to it").toBe(0);

  // A range that owes NOTHING AT ALL is the other end of the same
  // sentence, and it is the shape half the batteries this card was
  // written about had: a records-only push, four legs, nothing owed.
  const nothing = { range: "a..b", suites: [], e2e: { whole: false, specs: [] } };
  expect(owedCost(nothing).seconds).toBe(0);
  expect(String(overRunNotice(token, nothing, tree))).toContain(
    "THIS RANGE OWED NO GRADED SUITE AT ALL",
  );

  // AND A LONG LIST IS COUNTED BEFORE IT IS SAMPLED. The count is the
  // truth and the names are the sample, in that order in the sentence,
  // so a truncated list can never be read as the whole one.
  const many = Array.from({ length: OVER_RUN_NAME_LIMIT + 3 }, (_, i) => `extra${i}.spec.ts`);
  const wide = {
    ...token,
    suites: { e2e: tokenEntry("e2e", tree, { scope: ["owed.spec.ts", ...many].join(",") }) },
  };
  const owedOne = {
    range: "a..b",
    suites: ["e2e"],
    e2e: { whole: false, specs: ["owed.spec.ts"] },
  };
  const sampled = String(overRunNotice(wide, owedOne, tree));
  expect(sampled).toContain(`e2e graded ${many.length} spec file(s) this range does not owe`);
  expect(sampled, "the ones it did not spell are counted").toContain("and 3 more");
  expect(sampled, "and the sample really does stop at the limit").not.toContain(
    String(many[many.length - 1]),
  );
});

/* ── T-305, THE BENCH'S TWO ASSIGNED CORRECTIONS ──────────────────────
 *
 * Both are MINUTES, and minutes are this criterion's second half. The
 * bodies above pin the figure on ONE of the notice's three shapes — the
 * suite axis, where whole legs the range does not owe are named — and
 * the arm carries two more arithmetics that nothing reads back: the
 * WHOLE browser leg run where the range owed a subset, and a leg beyond
 * the set that ran NARROWED. Each is argued in the arm's own prose, each
 * moves the printed number by an order of magnitude when it is wrong,
 * and each survived every body on this bench.
 */

test("the whole browser leg's over-run minutes are the leg LESS the subset the range owed, and the owed figure is that subset's own", () => {
  // THE SHAPE THE CARD WAS MEASURED ON: a range that owes spec files
  // rather than legs, and a battery that ran the leg whole anyway.
  const fx = fixture("over-run-whole-minutes", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    token: "missing",
    seed: {
      "tools/e2e/tests/other.spec.ts": 'import { helper } from "./helpers";\n',
      "tools/e2e/tests/helpers.ts": "export const helper = 1;\n",
    },
    change: "tools/e2e/tests/helpers.ts",
  });
  armUpstream(fx, fx.base);
  const range = pushRange(fx.root);
  const owed = "range" in range ? runOwedSet(fx.root, range.range) : { problem: "no range" };
  expect("owed" in owed ? owed.owed.e2e.specs.length : 0, "the range owes ONE spec file").toBe(1);
  expect("owed" in owed ? owed.owed.e2e.whole : true, "and owes the leg in PART").toBe(false);

  plantSuites(fx.root, ["e2e"]);
  const notice = String(overRunLine(decideFor(fx)));

  // BOTH FIGURES ARE TYPED HERE AND NEITHER IS COMPUTED BY THE ARM.
  // One spec file at the table's per-spec figure is fifteen seconds, a
  // quarter of a minute; the whole leg is ten minutes; what the over-run
  // cost is the difference, 585 seconds. The three candidate answers a
  // wrong arithmetic would print — the whole leg at 10.0, the subset at
  // 0.3, nothing at 0.0 — are all distinct from 9.8 and from each other,
  // which is what makes this an assertion rather than a coincidence.
  expect(notice, "the minutes the owed set would have taken").toContain(
    "THIS RANGE OWES e2e over 1 spec file(s), about 0.3 minute(s)",
  );
  expect(notice, "the whole leg LESS the subset this range owed").toContain(
    "Those legs are about 9.8 minute(s)",
  );
  expect(notice, "and never the whole leg charged entire").not.toContain(
    "Those legs are about 10.0 minute(s)",
  );
});

test("a leg beyond the owed set that ran NARROWED is priced by the scope it records, never by the leg it did not run", () => {
  const fx = fixture("over-run-scoped-price", CHECK_EXIT.CURRENT, CURRENT_REPORT, {
    token: "missing",
    change: "lib/parser/src/x.ts",
  });
  armUpstream(fx, fx.base);
  const range = pushRange(fx.root);
  const owed = "range" in range ? runOwedSet(fx.root, range.range) : { problem: "no range" };
  expect("owed" in owed ? owed.owed.suites : []).toEqual(["parser"]);

  // THE CONTROL, AND IT IS THE SAME LEG BEYOND THE SAME SET: run WHOLE,
  // it costs the whole leg. Without this line the assertion below is
  // satisfied by an arm that had stopped pricing legs at all.
  plantSuites(fx.root, ["parser", "e2e"]);
  const whole = String(overRunLine(decideFor(fx)));
  expect(whole, "a WHOLE browser leg beyond the set costs the leg").toContain(
    "Those legs are about 10.0 minute(s)",
  );

  // AND NARROWED: the same leg, the same range, a scope naming two spec
  // files. Two at the table's per-spec figure is thirty seconds, half a
  // minute — and charging the leg would tell a seat it spent twenty
  // times what it spent, on the one line the seat is meant to act on.
  plantSuites(fx.root, ["parser", "e2e"], "tools/e2e/tests/a.spec.ts,tools/e2e/tests/b.spec.ts");
  const scoped = String(overRunLine(decideFor(fx)));
  expect(scoped, "priced by the scope the entry records").toContain(
    "Those legs are about 0.5 minute(s)",
  );
  expect(scoped, "and never by the leg it did not run").not.toContain(
    "Those legs are about 10.0 minute(s)",
  );
});

/* ════════════════════════════════════════════════════════════════════
 * T-314 — THE PUSH GIT ITSELF JUDGES.
 *
 * Everything above this line is about `.claude/hooks/push-guard.mjs`, a
 * hook ONE harness registers on ONE tool call, judging a command string a
 * session typed and keying its token to HEAD. The bodies below are about
 * `.claude/hooks/pre-push`, which git runs at every push in every harness
 * and none, judging each proposed update on the two objects git itself
 * hands it.
 *
 * ── THE FIXTURE POINTS GIT AT THIS REPOSITORY'S OWN HOOK ────────────
 * `core.hooksPath` in a scratch repository is set to `repoRoot`'s
 * `.claude/hooks`, which is `runWiredHook`'s treatment one mechanism
 * over: the code under test is THIS checkout's committed copy and the
 * tree under test is a fixture. So a push below is a real `git push`,
 * through a real hook, against a real bare remote inside one `mkdtemp`
 * root — and "did it reach the remote" has a mechanical answer rather
 * than an inferred one (the amendment of 2026-09-13, requirement 4).
 *
 * ── AND EVERY ALLOW CARRIES ITS POSITIVE CONTROL ────────────────────
 * docs/CONVENTIONS.md's rule, which this file already obeys above: an
 * allow asserted without a control is satisfied by a hook that always
 * says yes, so every body that measures a push REACHING the remote also
 * measures the same fixture refusing one.
 * ════════════════════════════════════════════════════════════════════ */

/** This repository's own tracked hooks directory — derived, never typed. */
const HOOK_DIR = path.join(repoRoot, ".claude", "hooks");

/** The hook file git executes. */
const HOOK_FILE = path.join(HOOK_DIR, HOOK_FILE_NAME);

/**
 * A fixture whose git runs THIS repository's pre-push hook.
 *
 * THE EXECUTABLE BIT IS ASSERTED RATHER THAN SET. Setting it would be
 * this suite writing into the repository, which the header above forbids;
 * and the body that asserts the COMMITTED mode is what makes it true in
 * every checkout. A checkout where it is false is a checkout whose guard
 * does not run, and a body that quietly repaired it would hide exactly
 * that.
 */
function guardedFixture(
  name: string,
  opts: Parameters<typeof fixture>[3] = {},
): Fixture {
  expect(
    existsSync(HOOK_FILE),
    `${HOOK_FILE_NAME} is not in this checkout, so nothing below is measuring a guard`,
  ).toBe(true);
  expect(
    (statSync(HOOK_FILE).mode & 0o111) !== 0,
    `${HOOK_FILE} is not executable in this working tree — git cannot run it, and the bodies ` +
      "below would be measuring a checkout whose guard is absent rather than the guard",
  ).toBe(true);
  const fx = fixture(name, CHECK_EXIT.CURRENT, CURRENT_REPORT, opts);
  execFileSync("git", ["-C", fx.root, "config", "--local", HOOKS_PATH_KEY, HOOK_DIR], {
    stdio: "pipe",
  });
  return fx;
}

/** A real `git push` from a fixture, with the fixture's own PATH. */
function realPush(fx: Fixture, ...args: string[]): { status: number | null; stderr: string } {
  const out = spawnSync("git", ["-C", fx.root, ...NO_BACKGROUND_MAINTENANCE, "push", ...args], {
    encoding: "utf8",
    env: { ...process.env, PATH: fixturePath(fx) },
  });
  return { status: out.status, stderr: String(out.stderr ?? "") };
}

/** What `origin` holds for `ref` right now, or `(absent)`. */
function remoteRef(fx: Fixture, ref: string): string {
  const out = spawnSync("git", ["-C", fx.remote, "rev-parse", "--verify", "--quiet", ref], {
    encoding: "utf8",
  });
  return out.status === 0 ? String(out.stdout).trim() : "(absent)";
}

/** A commit id in the fixture. */
function rev(fx: Fixture, spec: string): string {
  return execFileSync("git", ["-C", fx.root, "rev-parse", spec], { encoding: "utf8" }).trim();
}

/**
 * A token recording EXACTLY these suites GREEN against `tree`.
 *
 * IT REPLACES RATHER THAN MERGES, which `writeToken` deliberately does
 * not: a body that plants a four-suite token and then plants a one-suite
 * one is otherwise measuring the union of the two, and the difference
 * between `token-stale` (an entry exists and names another tree) and
 * `token-partial` (no entry at all) is exactly what the union hides.
 */
function plantAtTree(root: string, tree: string, suites: readonly string[] = REQUIRED_SUITES): void {
  const ref = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  rmSync(path.join(root, TOKEN_REL_PATH), { force: true });
  writeToken(
    root,
    suites.map((s) => ({ ...suiteVerdict(s, GREEN, ref), tree })),
    { tree, treeAtWrite: tree, dirty: false },
  );
}

test("the hook file is committed EXECUTABLE, which is the only thing that makes git run it", () => {
  // KILLED BY: a hook committed at 100644. Git silently declines to run a
  // hook it cannot execute — no error, no refusal, no line anywhere — so
  // the mode is not a detail of this file: it IS whether the guard
  // exists. The amendment of 2026-09-13 puts it at 100755 and says the
  // mode is recorded through git's own index rather than assumed from
  // whatever a checkout happens to carry, which is what this body reads.
  const staged = execFileSync(
    "git",
    ["-C", repoRoot, "ls-files", "-s", `${HOOK_DIR_REL_PATH}/${HOOK_FILE_NAME}`],
    { encoding: "utf8" },
  ).trim();
  expect(staged, "the hook is not tracked at all").not.toBe("");
  expect(staged.startsWith("100755 "), `the committed mode is not 100755: ${staged}`).toBe(true);

  // THE POSITIVE CONTROL IS THE DIRECTORY IT SITS IN: its neighbours are
  // ordinary files at 100644, so "100755" above is a fact about this file
  // and not about how this repository stores everything.
  const neighbours = execFileSync("git", ["-C", repoRoot, "ls-files", "-s", HOOK_DIR_REL_PATH], {
    encoding: "utf8",
  })
    .split("\n")
    .filter((l) => l.trim() !== "" && !l.endsWith(`${HOOK_DIR_REL_PATH}/${HOOK_FILE_NAME}`));
  expect(neighbours.length, "the hook has no neighbours, so this control proves nothing").toBeGreaterThan(2);
  expect(
    neighbours.filter((l) => !l.startsWith("100644 ")),
    "these neighbours are executable too, so the mode above is not this file's own property",
  ).toEqual([]);
  disclose("hook-mode", `${staged.split("\t")[0] ?? ""}, beside ${String(neighbours.length)} file(s) at 100644`);
});

test("WITHOUT the hook an ungraded push reaches the remote; WITH it the same push never does", () => {
  // THE DEFECT AND ITS CLOSURE IN ONE FIXTURE, through REAL pushes. The
  // first half is the state this card was written about: under a harness
  // that registers no `PreToolUse` hook, nothing at all judges a push.
  // The second half is the same repository, the same command, the same
  // ungraded tree — refused by git itself.
  const fx = guardedFixture("actual-push", { token: "missing" });
  execFileSync("git", ["-C", fx.root, "config", "--local", "--unset", HOOKS_PATH_KEY], { stdio: "pipe" });

  const unguarded = realPush(fx, "origin", "HEAD:refs/heads/main");
  expect(unguarded.status, `an unguarded push should have gone: ${unguarded.stderr}`).toBe(0);
  expect(remoteRef(fx, "refs/heads/main"), "the defect, reproduced: an ungraded tree reached the remote").toBe(
    rev(fx, "HEAD"),
  );

  // A THIRD COMMIT, so there is something left to refuse, and the hook.
  writeFileSync(path.join(fx.root, "README.md"), "a third commit\n");
  execFileSync("git", ["-C", fx.root, ...NO_BACKGROUND_MAINTENANCE, "add", "-A"], { stdio: "pipe" });
  execFileSync("git", ["-C", fx.root, ...NO_BACKGROUND_MAINTENANCE, "commit", "-qm", "third"], { stdio: "pipe" });
  execFileSync("git", ["-C", fx.root, "config", "--local", HOOKS_PATH_KEY, HOOK_DIR], { stdio: "pipe" });
  const before = remoteRef(fx, "refs/heads/main");

  const guarded = realPush(fx, "origin", "HEAD:refs/heads/main");
  expect(guarded.status, "a guarded ungraded push must not exit 0").not.toBe(0);
  expect(guarded.stderr).toContain("PUSH REFUSED");
  expect(guarded.stderr).toContain("token-missing");
  expect(remoteRef(fx, "refs/heads/main"), "and the remote never moved").toBe(before);

  // AND THE DECLARED BYPASS IS DECLARED RATHER THAN PRETENDED AWAY: the
  // same push with `--no-verify` lands, which is what docs/CONVENTIONS.md
  // records as closed by procedure in v1.
  const bypassed = realPush(fx, "--no-verify", "origin", "HEAD:refs/heads/main");
  expect(bypassed.status, "`--no-verify` skips every pre-push hook, by git's design").toBe(0);
  expect(remoteRef(fx, "refs/heads/main"), "which is the accepted procedural limitation").toBe(rev(fx, "HEAD"));
});

test("each proposed update is read from standard input, and a line this hook cannot split is refused rather than guessed at", () => {
  // KILLED BY: a reader that takes the first three fields and invents the
  // fourth, and by one that drops a line it cannot parse.
  const good = parseUpdates(
    "refs/heads/main aaa refs/heads/main bbb\n\nrefs/heads/x ccc refs/heads/x ddd\n",
  );
  expect("updates" in good && good.updates.length, "two lines, one blank").toBe(2);
  expect("updates" in good ? good.updates[1]?.remoteOid : "").toBe("ddd");
  expect("updates" in parseUpdates(""), "no lines at all is not an error").toBe(true);

  const short = parseUpdates("refs/heads/main aaa refs/heads/main\n");
  expect("problem" in short, "a three-field line must not be read as an update").toBe(true);
  expect("problem" in short ? short.problem : "").toContain("4");

  // AND THE RUNNER TURNS THAT INTO A REFUSAL, not into an allow: a push
  // this hook could not read is a push nothing about it was judged.
  const fx = guardedFixture("unreadable-input");
  const decision = decidePrePush({ cwd: fx.root, stdin: "one two three\n" });
  expect(decision.verdict).toBe("block");
  expect(decision.code).toBe("update-input-unreadable");

  // THE CONTROL: the same fixture, a WELL-FORMED input, is not refused
  // for this reason — so the refusal above is about the input's shape.
  const wellFormed = decidePrePush({
    cwd: fx.root,
    stdin: `HEAD ${rev(fx, "HEAD")} refs/heads/main ${fx.base}\n`,
  });
  expect(wellFormed.code, "a readable input reaches the arms that judge it").not.toBe(
    "update-input-unreadable",
  );
});

test("a pushed commit that differs from HEAD is judged on ITS OWN tree, and HEAD's token does not cover it", () => {
  // THE CARD'S THIRD PROPERTY. `push-guard.mjs` keys its token arm to
  // `headTree(root)`, so a push of anything but HEAD was judged against
  // content it does not carry — in the safe direction only by accident.
  const fx = guardedFixture("not-head");
  const headTreeNow = headTree(fx.root) ?? "";
  const earlierTree = execFileSync("git", ["-C", fx.root, "rev-parse", "HEAD~1^{tree}"], {
    encoding: "utf8",
  }).trim();
  expect(earlierTree, "the two commits must carry different trees or this proves nothing").not.toBe(
    headTreeNow,
  );

  // THE POSITIVE CONTROL FIRST, IN THE SAME FIXTURE: HEAD's own push,
  // with HEAD's own token, goes.
  const ok = realPush(fx, "origin", "HEAD:refs/heads/main");
  expect(ok.status, `HEAD's push with HEAD's token: ${ok.stderr}`).toBe(0);

  const refused = realPush(fx, "origin", "HEAD~1:refs/heads/side");
  expect(refused.status, "the same token must not certify a different tree").not.toBe(0);
  expect(refused.stderr).toContain("token-stale");
  expect(refused.stderr, "the refusal names the tree it actually compared").toContain(earlierTree);
  expect(
    refused.stderr,
    "and it says whose tree that is — `judgeToken`'s sentences name HEAD by default, and HEAD " +
      "is not what this push carries",
  ).toContain(TREE_OWNER);
  expect(remoteRef(fx, "refs/heads/side"), "and the branch was never created").toBe("(absent)");
});

test("the range is the update's own remote OLD OBJECT, not the local tracking ref — which can be a lie", () => {
  // THE DISCRIMINATOR, AND IT IS THE WHOLE REASON A GIT HOOK BEATS A
  // COMMAND SCANNER. `pushRange` derives `@{upstream}..HEAD` from this
  // checkout's own administration; git hands the hook what the REMOTE
  // actually holds. A tracking ref that is ahead of the remote — a
  // failed push, a fetch from a rewound remote, a hand `update-ref` —
  // makes the first answer an EMPTY range, which owes nothing at all.
  const fx = guardedFixture("old-object", { token: "missing" });
  const head = rev(fx, "HEAD");
  execFileSync("git", ["-C", fx.root, "update-ref", "refs/remotes/origin/main", head], { stdio: "pipe" });
  execFileSync("git", ["-C", fx.root, "config", "branch.main.remote", "origin"], { stdio: "pipe" });
  execFileSync("git", ["-C", fx.root, "config", "branch.main.merge", "refs/heads/main"], { stdio: "pipe" });

  const byTrackingRef = pushRange(fx.root);
  expect("range" in byTrackingRef ? byTrackingRef.range : "", "the tracking ref claims there is nothing to add").toBe(
    `${head}..${head}`,
  );
  expect(remoteRef(fx, "refs/heads/main"), "while the remote is really still one commit behind").toBe(fx.base);

  const refused = realPush(fx, "origin", "HEAD:refs/heads/main");
  expect(refused.status).not.toBe(0);
  expect(
    refused.stderr,
    "the hook's range runs from what the REMOTE holds to what the push carries",
  ).toContain(`${fx.base}..${head}`);
  expect(
    refused.stderr,
    "and never from the tracking ref, whose range is empty and owes nothing",
  ).not.toContain(`${head}..${head}`);
  disclose("range-source", `remote old object ${fx.base.slice(0, 12)}, tracking ref ${head.slice(0, 12)}`);
});

test("several proposed updates, one unqualified: the WHOLE push is refused and the qualified one is named", () => {
  // GIT HAS ONE EXIT CODE FOR THE WHOLE INVOCATION, so a seat reading a
  // refusal about one branch would otherwise believe the other landed.
  const fx = guardedFixture("several-updates");
  execFileSync("git", ["-C", fx.root, "branch", "keeper"], { stdio: "pipe" });
  execFileSync("git", ["-C", fx.root, "branch", "stray", "HEAD~1"], { stdio: "pipe" });

  // THE CONTROL: `keeper` ALONE is qualified — same fixture, same token.
  const alone = realPush(fx, "origin", "keeper:refs/heads/keeper");
  expect(alone.status, `keeper alone should go: ${alone.stderr}`).toBe(0);
  expect(remoteRef(fx, "refs/heads/keeper")).toBe(rev(fx, "keeper"));

  const both = realPush(fx, "origin", "keeper:refs/heads/keeper-two", "stray:refs/heads/stray");
  expect(both.status, "one unqualified update refuses the invocation").not.toBe(0);
  expect(both.stderr).toContain("WHOLE PUSH IS REFUSED");
  expect(both.stderr, "the qualified update is named, so nobody infers that it landed").toContain(
    "refs/heads/keeper-two",
  );
  expect(remoteRef(fx, "refs/heads/keeper-two"), "and it did not").toBe("(absent)");
  expect(remoteRef(fx, "refs/heads/stray")).toBe("(absent)");
});

test("an unsupported update shape is refused BY NAME — a deletion, and a ref that is not a branch", () => {
  // AN UNSUPPORTED SHAPE IS THE ONE INABILITY THIS GUARD REFUSES ON, and
  // the direction is argued in the module: a shape it was never given a
  // rule for is a push asking for the rule to be optional, while an
  // inability of its OWN falls back to the whole battery.
  const fx = guardedFixture("shapes");
  const head = rev(fx, "HEAD");
  execFileSync("git", ["-C", fx.root, ...NO_BACKGROUND_MAINTENANCE, "push", "-q", "--no-verify", "origin", "HEAD~1:refs/heads/doomed"], { stdio: "pipe" });
  execFileSync("git", ["-C", fx.root, "tag", "v0"], { stdio: "pipe" });

  const deletion = realPush(fx, "origin", "--delete", "refs/heads/doomed");
  expect(deletion.status).not.toBe(0);
  expect(deletion.stderr).toContain("update-shape-unsupported");
  expect(deletion.stderr, "and it says WHICH shape").toContain("DELETION");
  expect(remoteRef(fx, "refs/heads/doomed"), "the branch still stands").not.toBe("(absent)");

  const tag = realPush(fx, "origin", "refs/tags/v0");
  expect(tag.status).not.toBe(0);
  expect(tag.stderr).toContain("update-shape-unsupported");
  expect(remoteRef(fx, "refs/tags/v0")).toBe("(absent)");

  // AND THE SHAPE READER ITSELF, both directions, on the objects rather
  // than through a push: a branch update is supported and the two above
  // are named.
  expect(
    updateShape({ localRef: "HEAD", localOid: head, remoteRef: "refs/heads/main", remoteOid: fx.base, line: "" }),
  ).toEqual({ branch: "main" });
  expect(
    "unsupported" in
      updateShape({ localRef: "HEAD", localOid: "0".repeat(40), remoteRef: "refs/heads/x", remoteOid: head, line: "" }),
  ).toBe(true);
  expect(
    "unsupported" in
      updateShape({ localRef: "v0", localOid: head, remoteRef: "refs/tags/v0", remoteOid: "0".repeat(40), line: "" }),
  ).toBe(true);
});

test("the token must match the PUSHED tree in ADDITION to covering the owed set, never instead of it", () => {
  // THE SECOND CRITERION, IN ITS TWO HALVES AND WITH THE THIRD BINDING
  // THE CARD SAYS IS PRESERVED: a token minted for a DIFFERENT tree is
  // refused; a token minted for the PUSHED tree whose measured set does
  // not cover what the range owes is refused too; and a token that is
  // right on both axes is still refused when it was minted over a tree
  // that moved while it ran.
  const fx = guardedFixture("additional-binding", { token: "missing", change: "lib/parser/src/x.ts" });
  const head = rev(fx, "HEAD");
  const tree = headTree(fx.root) ?? "";
  execFileSync("git", ["-C", fx.root, "update-ref", "refs/remotes/origin/main", fx.base], { stdio: "pipe" });

  const owed = runOwedSet(fx.root, `${fx.base}..${head}`);
  expect("owed" in owed ? owed.owed.suites : [], "this range owes one package's suite").toEqual(["parser"]);

  // (a) A DIFFERENT TREE. Every suite green, the whole battery, and the
  // key names content this push does not carry.
  plantAtTree(fx.root, FOREIGN_TREE);
  const other = realPush(fx, "origin", "HEAD:refs/heads/main");
  expect(other.status).not.toBe(0);
  expect(other.stderr).toContain("token-stale");

  // (b) THE PUSHED TREE, AND A SET THAT DOES NOT COVER THE RANGE. The
  // key is right and the measurement is not the one this push owes.
  plantAtTree(fx.root, tree, ["rust"]);
  const partial = realPush(fx, "origin", "HEAD:refs/heads/main");
  expect(partial.status).not.toBe(0);
  expect(partial.stderr).toContain("token-partial");
  expect(partial.stderr, "naming the suite the range owes and the token never measured").toContain("parser");

  // (c) THE PUSHED TREE, THE OWED SET, AND A TREE THAT MOVED WHILE IT
  // RAN — the check this card says is PRESERVED rather than replaced.
  const ref = rev(fx, "HEAD");
  rmSync(path.join(fx.root, TOKEN_REL_PATH), { force: true });
  writeToken(fx.root, [{ ...suiteVerdict("parser", GREEN, ref), tree }], {
    tree,
    treeAtWrite: FOREIGN_TREE,
    dirty: false,
  });
  const unkeyed = realPush(fx, "origin", "HEAD:refs/heads/main");
  expect(unkeyed.status).not.toBe(0);
  expect(unkeyed.stderr).toContain("token-unkeyed");

  // THE POSITIVE CONTROL, LAST AND IN THE SAME FIXTURE: right tree,
  // right set, clean key — and the push goes.
  plantAtTree(fx.root, tree, ["parser"]);
  const ok = realPush(fx, "origin", "HEAD:refs/heads/main");
  expect(ok.status, `the qualified push should go: ${ok.stderr}`).toBe(0);
  expect(remoteRef(fx, "refs/heads/main")).toBe(head);
});

test("the Claude PreToolUse guard is untouched, and the two nets are wired to two different mechanisms", () => {
  // THE FOURTH CRITERION. The whole of this file above is the evidence
  // that the older guard still behaves; what nothing else states is that
  // the two nets are REGISTERED differently — one in this repository's
  // settings, one in git's own configuration key — so neither can be
  // retired by whatever retires the other.
  const settings = JSON.parse(readFileSync(path.join(repoRoot, ".claude", "settings.json"), "utf8")) as {
    hooks: { PreToolUse: { matcher: string; hooks: { command: string }[] }[] };
  };
  const bash = settings.hooks.PreToolUse.find((h) => new RegExp(`^(${h.matcher})$`).test("Bash"));
  expect(bash, "the Bash matcher is gone, so the second net is gone").toBeDefined();
  expect(
    bash?.hooks.map((h) => h.command).join(" "),
    "and it still points at the guard this card left alone",
  ).toContain("push-guard-hook.mjs");
  expect(
    JSON.stringify(settings),
    "the pre-push hook is NOT registered here — git's core.hooksPath is its mechanism, and a " +
      "settings entry would make it one harness's after all",
  ).not.toContain(HOOK_FILE_NAME);

  // AND THE OLDER GUARD STILL REFUSES WHAT IT ALWAYS REFUSED, through
  // the wired command, in a fixture whose pre-push hook is not installed
  // — so this is the `PreToolUse` net alone.
  const fx = fixture("second-net", CHECK_EXIT.STALE, STALE_REPORT);
  const run = runWiredHook(fx, "git push origin HEAD:refs/heads/main");
  expect(run.status, "the PreToolUse guard's own refusal").toBe(2);
  expect(run.stderr, "and it is that guard's own sentence, unchanged by this card").toContain(
    "`index --check` exited 1 — the committed graph is STALE",
  );
});

test("standard input this hook could not READ is refused by name, and is NOT git's own empty input", () => {
  // KILLED BY: handing an unreadable standard input over as the empty
  // string, which is what `pre-push-hook.mjs` did while its own header
  // said it refused. Git runs a pre-push hook with EMPTY input when every
  // ref is already up to date — an allow — so the two meanings shared one
  // string and the allow won both. This body is the pair, one respect
  // apart.
  const fx = guardedFixture("unread-input");
  const unread = decidePrePush({ cwd: fx.root, stdin: "", stdinReadable: false });
  expect(unread.verdict, "a push whose contents this guard never learned is not an allow").toBe("block");
  expect(unread.code).toBe("update-input-unread");
  expect(unread.reason).toContain("NOTHING ABOUT THIS PUSH COULD BE JUDGED");

  // THE CONTROL: the same empty string, READ.
  const empty = decidePrePush({ cwd: fx.root, stdin: "", stdinReadable: true });
  expect(empty.verdict, "git's own empty input is every ref already up to date").toBe("allow");
  expect(empty.code).toBe("no-updates-proposed");

  // AND THE DEFAULT IS THE READ ONE, so no caller that omits the flag
  // changed meaning when it was added.
  expect(decidePrePush({ cwd: fx.root, stdin: "" }).code).toBe("no-updates-proposed");
});

test("docs/CONVENTIONS.md records the accepted bypass, the public check and T-310 — the fifth criterion, pinned", () => {
  // KILLED BY: a DATA mutant. This criterion's whole property lives in
  // PROSE, and prose no body reads is deletable tomorrow over a green
  // suite — which is why the three other CONVENTIONS bullets this file
  // depends on are pinned above. This one was not, and every clause below
  // is one the card names in its own words.
  const bullet = String(
    conventionsBullet(conventionsText(), "THE PUSH IS JUDGED BY GIT ITSELF SINCE T-314"),
  );
  expect(bullet.length, "an empty bullet would satisfy every assertion below").toBeGreaterThan(500);

  // (i) THE LIMITATION, ITS DATE, AND BOTH SPELLINGS OF THE BYPASS.
  expect(bullet, "the v1 procedural limitation is not recorded").toContain("CLOSED BY PROCEDURE");
  expect(bullet, "the owner's acceptance is not dated").toContain("2026-09-12");
  expect(bullet, "`--no-verify` is not named as the bypass").toContain("--no-verify");
  expect(bullet, "a push from a checkout the hook was never installed in is the other bypass").toContain(
    "never installed",
  );

  // (ii) WHAT STILL CHECKS, WHICH IS NOT THIS HOOK AND NOT THIS MACHINE.
  expect(bullet, "the runner's owed set is not recorded as the public check").toContain(
    "THE RUNNER'S OWED SET ON THE PUSHED RANGE REMAINS THE PUBLIC CHECK",
  );

  // (iii) WHAT WOULD CLOSE IT, AND WHOSE CARD THAT IS.
  expect(bullet, "the separate proposals are not named").toContain("T-310");
  expect(bullet, "and what they are is not said").toContain("A PROTECTED RECEIVING GATE");
});

test("a hook git cannot EXECUTE is UNGUARDED with the path pointed straight at it — the state git answers by SKIPPING", () => {
  // KILLED BY: dropping `hookStatus`'s executable check. Git IGNORES a
  // non-executable hook under `core.hooksPath` — it prints a hint and the
  // push SUCCEEDS — so this is the one unguarded state that is
  // indistinguishable from a guarded one by reading the configuration,
  // and the verb that reports it is the only thing that can say so. The
  // body above that names this property asserts it in a fixture whose
  // hooks path is UNSET, where the unset path is what answers.
  const fx = installFixture("unexecutable");
  const hook = path.join(fx.root, HOOK_DIR_REL_PATH, HOOK_FILE_NAME);
  expect(installHook({ root: fx.root }).state).toBe("installed");
  expect(hookStatus(fx.root).guarded, "the control: pointed at it AND able to run it").toBe(true);

  // ONE RESPECT APART — the same path, the same file, the mode gone.
  chmodSync(hook, 0o644);
  const lost = hookStatus(fx.root);
  expect(lost.guarded, "a hook git cannot execute guards nothing").toBe(false);
  expect(lost.detail).toContain("UNGUARDED");
  expect(lost.detail, "and it says WHICH of the three conditions failed").toContain("not executable");
  expect(
    String(lost.configured),
    "while the configuration still points straight at this checkout's own directory",
  ).toContain(HOOK_DIR_REL_PATH);

  // AND BACK, so the difference above is the mode and nothing else.
  chmodSync(hook, 0o755);
  expect(hookStatus(fx.root).guarded).toBe(true);
});

/* ───────────── the installer, and the seat verbs that call it ──────── */

/** A scratch repository whose `.claude/hooks` carries the real hook file. */
function installFixture(
  name: string,
  opts: { mode?: number; worktree?: boolean; worktreeConfig?: boolean } = {},
): { root: string; git: (...args: string[]) => string; sibling?: string } {
  const root = mkdtempSync(path.join(os.tmpdir(), `T-314-install-${name}-`));
  SCRATCH.push(root);
  const git = (...args: string[]): string =>
    execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], {
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
  execFileSync("git", ["init", "-q", "-b", "main", root], { stdio: "pipe" });
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "T-314 fixture");
  mkdirSync(path.join(root, HOOK_DIR_REL_PATH), { recursive: true });
  copyFileSync(HOOK_FILE, path.join(root, HOOK_DIR_REL_PATH, HOOK_FILE_NAME));
  chmodSync(path.join(root, HOOK_DIR_REL_PATH, HOOK_FILE_NAME), opts.mode ?? 0o755);
  writeFileSync(path.join(root, "README.md"), "install fixture\n");
  git("add", "-A");
  git("commit", "-qm", "fixture");
  /** @type {string | undefined} */
  let sibling: string | undefined;
  if (opts.worktree === true) {
    sibling = path.join(root, "..", `${path.basename(root)}-lane`);
    git("worktree", "add", "-q", "-b", "task/T-901-a-lane", sibling, "HEAD");
    SCRATCH.push(sibling);
  }
  if (opts.worktreeConfig === true) git("config", "--local", WORKTREE_CONFIG_KEY, "true");
  return { root, git, ...(sibling === undefined ? {} : { sibling }) };
}

/** `core.hooksPath` as git reports it, or `(unset)`. */
function configuredHooksPath(root: string): string {
  const out = spawnSync("git", ["-C", root, "config", "--show-scope", "--get", HOOKS_PATH_KEY], {
    encoding: "utf8",
  });
  return out.status === 0 ? String(out.stdout).trim() : "(unset)";
}

test("the installer points git at the tracked hooks directory only when the key is unset or already ours", () => {
  // KILLED BY: an installer that overwrites a hooks path somebody else
  // configured, and by one that re-installs over its own work as though
  // it had not run.
  const fx = installFixture("unset");
  expect(hookStatus(fx.root).guarded, "the fixture starts unguarded, so the control is not degenerate").toBe(false);
  const first = installHook({ root: fx.root });
  expect(first.state).toBe("installed");
  expect(first.scope).toBe("local");
  expect(hookStatus(fx.root).guarded).toBe(true);
  expect(configuredHooksPath(fx.root)).toContain(HOOK_DIR_REL_PATH);

  // ALREADY OURS IS NOT AN INSTALL and does not write again.
  const again = installHook({ root: fx.root });
  expect(again.state).toBe("already-installed");

  // AND A PATH THAT IS NOT OURS IS REFUSED BY NAME, with nothing changed.
  const other = installFixture("elsewhere");
  const elsewhere = path.join(other.root, "their-hooks");
  mkdirSync(elsewhere);
  other.git("config", "--local", HOOKS_PATH_KEY, elsewhere);
  const before = configuredHooksPath(other.root);
  const refused = installHook({ root: other.root });
  expect(refused.state).toBe("refused");
  expect(refused.code).toBe("hooks-path-elsewhere");
  expect(refused.detail, "the refusal names the value it left alone").toContain("their-hooks");
  expect(configuredHooksPath(other.root), "and nothing was written").toBe(before);
  expect(hookStatus(other.root).guarded).toBe(false);
  expect(hookStatus(other.root).detail).toContain("UNGUARDED");
});

test("a hook already live in the checkout's own hooks directory is refused BY NAME, and a linked worktree's is the COMMON one", () => {
  // THE AMENDMENT OF 2026-09-13 ON HOOK-INSTALLATION SCOPE, and the
  // defect it names: `hooks` is not on git's per-worktree path list, so a
  // linked worktree's live hooks are the repository's SHARED ones.
  // Pointing `core.hooksPath` elsewhere would deactivate every one of
  // them in silence.
  const fx = installFixture("occupied", { worktree: true, worktreeConfig: true });
  const common = fx.git("rev-parse", "--git-common-dir");
  writeFileSync(path.join(path.resolve(fx.root, common), "hooks", "pre-commit"), "#!/bin/sh\nexit 0\n");

  const sibling = fx.sibling as string;
  const fromLinked = installHook({ root: sibling });
  expect(fromLinked.state, "asked from the LINKED worktree, whose own git directory holds no hooks").toBe(
    "refused",
  );
  expect(fromLinked.code).toBe("active-hooks-present");
  expect(fromLinked.detail, "and it names the hook it would have deactivated").toContain("pre-commit");
  expect(configuredHooksPath(sibling), "nothing was configured").toBe("(unset)");

  // THE POSITIVE CONTROL: the same fixture with that hook gone installs.
  rmSync(path.join(path.resolve(fx.root, common), "hooks", "pre-commit"));
  expect(installHook({ root: sibling }).state, "so the refusal above was about the hook").toBe("installed");

  // AND A GIT-HOOK NAME IN THE TRACKED DIRECTORY IS THE SAME HARM FROM
  // THE OTHER SIDE: pointing the path there makes every such name live.
  const foreign = installFixture("foreign");
  const name = GIT_HOOK_NAMES.find((n) => n !== HOOK_FILE_NAME) as string;
  writeFileSync(path.join(foreign.root, HOOK_DIR_REL_PATH, name), "#!/bin/sh\nexit 0\n");
  const refused = installHook({ root: foreign.root });
  expect(refused.state).toBe("refused");
  expect(refused.code).toBe("foreign-hook-names");
  expect(refused.detail).toContain(name);
  expect(configuredHooksPath(foreign.root)).toBe("(unset)");
});

test("installing preserves a sibling worktree's effective routing, and a SHARED configuration change is refused by name until it is authorized", () => {
  // THE OTHER HALF OF THE SCOPE AMENDMENT. `core.hooksPath` at LOCAL
  // scope is read by every worktree of the repository, so in a repository
  // with lanes live it is not this checkout's key to set.
  const scoped = installFixture("scoped", { worktree: true, worktreeConfig: true });
  const sibling = scoped.sibling as string;
  const siblingBefore = configuredHooksPath(sibling);
  const installed = installHook({ root: scoped.root });
  expect(installed.state).toBe("installed");
  expect(installed.scope, "written where this worktree alone reads it").toBe("worktree");
  expect(hookStatus(scoped.root).guarded).toBe(true);
  expect(configuredHooksPath(sibling), "the sibling's effective configuration is unchanged").toBe(siblingBefore);
  expect(hookStatus(sibling).guarded, "and it is still routed exactly as it was").toBe(false);

  // AND WITHOUT THE PER-WORKTREE FILE THERE IS NO SAFE SCOPE, so the
  // installer refuses and NAMES the setting rather than turning it on.
  const shared = installFixture("shared", { worktree: true });
  const refused = installHook({ root: shared.root });
  expect(refused.state).toBe("refused");
  expect(refused.code).toBe("shared-config-change-needed");
  expect(refused.detail, "the refusal names the shared switch").toContain(WORKTREE_CONFIG_KEY);
  expect(configuredHooksPath(shared.root)).toBe("(unset)");
  expect(
    spawnSync("git", ["-C", shared.root, "config", "--get", WORKTREE_CONFIG_KEY], { encoding: "utf8" }).status,
    "and it did not turn it on behind the caller's back",
  ).not.toBe(0);

  // THE POSITIVE CONTROL IS THE AUTHORIZATION: the same fixture, the same
  // repository, with the caller saying the change was authorized.
  const authorized = installHook({ root: shared.root, authorizeSharedConfig: true });
  expect(authorized.state).toBe("installed");
  expect(authorized.scope).toBe("worktree");
  expect(configuredHooksPath(shared.root)).toContain("worktree");
});

test("the arm sets an executable mode the checkout lost, and it stages nothing to do it", () => {
  // THE AMENDMENT'S SECOND REQUIREMENT. `git update-index --chmod=+x`
  // would STAGE something, and an arm that stages can carry a seat's
  // unrelated work into a commit it never meant to make.
  const fx = installFixture("mode", { mode: 0o644 });
  writeFileSync(path.join(fx.root, "staged.txt"), "content a seat staged and has not committed\n");
  fx.git("add", "staged.txt");
  const stagedBefore = fx.git("diff", "--cached", "--name-only");
  expect(stagedBefore, "the fixture must really have something staged").toBe("staged.txt");
  expect(
    hookStatus(fx.root).detail,
    "this fixture is UNGUARDED because nothing is configured yet — the MODE's own branch is the " +
      "body above, which points the path straight at the file first",
  ).toContain("UNGUARDED");

  const done = installHook({ root: fx.root });
  expect(done.state).toBe("installed");
  expect(done.modeSet, "the arm says it set the mode").toBe(true);
  expect((statSync(path.join(fx.root, HOOK_DIR_REL_PATH, HOOK_FILE_NAME)).mode & 0o111) !== 0).toBe(true);
  expect(hookStatus(fx.root).guarded).toBe(true);
  expect(fx.git("diff", "--cached", "--name-only"), "and it staged nothing of its own").toBe(stagedBefore);
});

test("the PLAN writes nothing at all, which is what makes every refusal above leave a checkout untouched", () => {
  // KILLED BY: a planner that configures as a side effect of deciding.
  // The split is what lets the seat verb refuse BEFORE it records a
  // holder — the amendment's ordering, and the difference between a
  // checkout that is unguarded and one everything downstream believes is
  // guarded.
  const fx = installFixture("plan");
  const plan = hookInstallPlan({ root: fx.root });
  expect(plan.action).toBe("install");
  expect(configuredHooksPath(fx.root), "deciding is not doing").toBe("(unset)");
  expect(hookStatus(fx.root).guarded).toBe(false);

  // AND AN ABSENT HOOK FILE IS REPORTED, NEVER REFUSED: a checkout older
  // than this card has nothing to install, and a seat that could not be
  // taken there is a seat nobody could use to update it.
  const bare = installFixture("bare");
  rmSync(path.join(bare.root, HOOK_DIR_REL_PATH, HOOK_FILE_NAME));
  const nothing = installHook({ root: bare.root });
  expect(nothing.state).toBe("unguarded");
  expect(nothing.code).toBe("hook-file-absent");
  expect(hookStatus(bare.root).detail).toContain("UNGUARDED");
});

/**
 * A repository `brief.mjs` will derive a context in — the governing
 * documents and the method text, copied from this checkout so nothing
 * here is a second copy of a document that can drift.
 *
 * ONLY THE SEVEN DOCUMENTS AND `method/`. `docs/tasks/` is fourteen
 * megabytes at this ref and none of it is read by the seat arm, so a
 * fixture that copied `docs/` whole would spend a second per body
 * proving nothing.
 */
function seatFixture(name: string, opts: { lane?: boolean; hook?: boolean } = {}): {
  root: string;
  git: (...args: string[]) => string;
} {
  const root = mkdtempSync(path.join(os.tmpdir(), `T-314-seat-${name}-`));
  SCRATCH.push(root);
  const git = (...args: string[]): string =>
    execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], {
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
  execFileSync("git", ["init", "-q", "-b", "main", root], { stdio: "pipe" });
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "T-314 fixture");
  mkdirSync(path.join(root, "docs", "tasks"), { recursive: true });
  for (const doc of readdirSync(path.join(repoRoot, "docs")).filter((f) => f.endsWith(".md"))) {
    copyFileSync(path.join(repoRoot, "docs", doc), path.join(root, "docs", doc));
  }
  // AND THE CHAPTERS THE CONVENTIONS INDEX POINTS AT (T-290). The walk
  // above is FLAT, so it takes the index and leaves the rules behind, and
  // every verb that reads a rule then refuses by name. The set is
  // DERIVED, so a chapter added later travels without an edit here.
  for (const rel of conventionsFiles(repoRoot)) {
    const dest = path.join(root, rel);
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(path.join(repoRoot, rel), dest);
  }
  cpSync(path.join(repoRoot, "method"), path.join(root, "method"), { recursive: true });
  mkdirSync(path.join(root, HOOK_DIR_REL_PATH), { recursive: true });
  if (opts.hook !== false) {
    copyFileSync(HOOK_FILE, path.join(root, HOOK_DIR_REL_PATH, HOOK_FILE_NAME));
    chmodSync(path.join(root, HOOK_DIR_REL_PATH, HOOK_FILE_NAME), 0o755);
  }
  writeFileSync(path.join(root, "README.md"), "seat fixture\n");
  git("add", "-A");
  git("commit", "-qm", "fixture");
  if (opts.lane === true) git("checkout", "-q", "-b", "task/T-901-a-lane");
  return { root, git };
}

/**
 * A DIRECTORY IN NO CHECKOUT OF THIS REPOSITORY, pointed at by the seat
 * verbs below — the shape card-preflight.spec.ts already gives its own
 * CLI calls. The seat arm does not run the stale-checkout catcher (only
 * `--preflight`, `--write-fence`, `--dispatch-lane` and `--merge` arm
 * it), so this buys determinism rather than a disarmed guard: what the
 * verb answers stops depending on where the suite happened to be
 * started and on how far behind that checkout is.
 */
const NO_SESSION_CHECKOUT = mkdtempSync(path.join(os.tmpdir(), "T-314-s6-no-session-"));
SCRATCH.push(NO_SESSION_CHECKOUT);

/**
 * `brief.mjs`, run against a fixture — UNDER A STAND-IN HARNESS, and
 * that is the whole of T-314-s6.
 *
 * This helper used to spawn the verb straight from the test process.
 * Every seat verb first derives the acting session by walking the
 * process table upward for a harness-shaped ancestor, which a local test
 * process always has and a CI runner never does, so the two bodies
 * beneath this line asserted exit 0 and exit 1 here and met exit 3 —
 * COULD NOT RUN — on the runner: main red at 8d26c8c5, CI run
 * 34772159066, e2e shard 2. The stand-in harness is the same fixture
 * `pushUnderHarness` above and card-preflight.spec.ts's own seat bodies
 * already run under, and it composes the ancestor on ANY machine, so
 * these bodies now measure the arm rather than the tree they ran in.
 */
function seatVerb(root: string, ...args: string[]): { status: number | null; out: string; err: string } {
  const run = underHarness(harnessLink(`seat-${path.basename(root)}`), {
    cli: path.join(repoRoot, "tools", "e2e", "scripts", "brief.mjs"),
    args: [...args, "--root", root],
    cwd: repoRoot,
    projectDir: NO_SESSION_CHECKOUT,
    maxBuffer: 64 * 1024 * 1024,
  });
  return { status: run.status, out: String(run.out ?? ""), err: String(run.err ?? "") };
}

test("`--take-seat` installs the guard and announces it, and BOTH seat verbs report a checkout without the hook as UNGUARDED", () => {
  // THE THIRD CRITERION, AT THE ARM. The seat is the one moment a session
  // declares it is acting in an integration checkout, so it is the moment
  // to install the guard and the moment a missing one is worth a line.
  const fx = seatFixture("takes");
  const take = seatVerb(fx.root, "--take-seat");
  expect(take.status, `${take.out}\n${take.err}`).toBe(0);
  expect(take.out).toContain("THE SEAT — TAKEN");
  expect(take.out, "it says the guard was installed, and at which scope").toContain("the pre-push guard: installed");
  expect(take.out).toContain("THE PUSH GUARD GIT ITSELF RUNS");
  expect(hookStatus(fx.root).guarded, "and the checkout really is guarded afterwards").toBe(true);

  // AND THE UNGUARDED REPORT, FROM BOTH VERBS, in a checkout that carries
  // no hook at all — which is every checkout older than this card.
  const bare = seatFixture("bare", { hook: false });
  const bareTake = seatVerb(bare.root, "--take-seat");
  expect(bareTake.status, "an absent hook is reported, never a refusal — or the seat is unobtainable").toBe(0);
  expect(bareTake.out).toContain("UNGUARDED");
  expect(bareTake.out).toContain("THE SEAT — TAKEN");
  expect(configuredHooksPath(bare.root), "and nothing was configured to point at a hook that is not there").toBe(
    "(unset)",
  );
  const bareRelease = seatVerb(bare.root, "--release-seat");
  expect(bareRelease.status, `${bareRelease.out}\n${bareRelease.err}`).toBe(0);
  expect(bareRelease.out, "the other verb says it too").toContain("UNGUARDED");
  expect(bareRelease.out).toContain("THE SEAT — RELEASED");
});

test("`--take-seat` records NO seat when the guard cannot be installed, and leaves the configuration and the index alone", () => {
  // THE AMENDMENT'S ORDERING, MEASURED: the install is performed BEFORE
  // the holder record is written, so a refusal leaves a checkout that is
  // plainly unguarded rather than one everything downstream believes is
  // guarded because a seat was recorded in it.
  const fx = seatFixture("refuses");
  const theirs = path.join(fx.root, "their-hooks");
  mkdirSync(theirs);
  fx.git("config", "--local", HOOKS_PATH_KEY, theirs);
  writeFileSync(path.join(fx.root, "staged.txt"), "staged, and not this arm's to touch\n");
  fx.git("add", "staged.txt");
  const stagedBefore = fx.git("diff", "--cached", "--name-only");

  const take = seatVerb(fx.root, "--take-seat");
  expect(take.status, "a refusal is a FINDING, never a clean run").toBe(1);
  expect(take.out).toContain("THE SEAT — NOT TAKEN");
  expect(take.err, "and the finding names the reason by its code's own sentence").toContain(
    "the pre-push guard could not be installed",
  );
  expect(existsSync(path.join(fx.root, ".supertaskr", "holder.json")), "no holder record was written").toBe(false);
  expect(configuredHooksPath(fx.root), "and the hooks path they configured is untouched").toContain("their-hooks");
  expect(fx.git("diff", "--cached", "--name-only"), "and so is the index").toBe(stagedBefore);

  // THE POSITIVE CONTROL: the same fixture with their hooks path removed
  // takes the seat, so the refusal above is about the path and not about
  // this fixture being unable to take a seat at all.
  fx.git("config", "--local", "--unset", HOOKS_PATH_KEY);
  const second = seatVerb(fx.root, "--take-seat");
  expect(second.status, `${second.out}\n${second.err}`).toBe(0);
  expect(existsSync(path.join(fx.root, ".supertaskr", "holder.json"))).toBe(true);
});

test("a seat acquisition that fails for a reason of its own configures nothing", () => {
  // THE THIRD CRITERION'S THIRD CLAUSE. A lane holds no seat, so both
  // verbs refuse there — and the guard must not be installed on the way
  // past, because an arm that acts before its own precondition is an arm
  // whose refusals are decorative.
  const fx = seatFixture("lane", { lane: true });
  const take = seatVerb(fx.root, "--take-seat");
  expect(take.status, "a lane is not the integration checkout").toBe(1);
  expect(take.out).toContain("nothing was taken and nothing was released");
  expect(configuredHooksPath(fx.root), "and nothing was configured").toBe("(unset)");
  expect(existsSync(path.join(fx.root, ".supertaskr", "holder.json"))).toBe(false);
});
