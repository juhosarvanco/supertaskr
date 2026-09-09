import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
// THE WHOLE NAMESPACE, for ONE body: the citation keeper asks whether a
// name the refusal cites is a name this module EXPORTS, and the only way
// to ask that is to hold the export list rather than a chosen subset of
// it (T-238-s1). Every other body imports what it names.
import * as currency from "../scripts/checkout-currency.mjs";
import {
  DEFAULT_INTEGRATION_REF,
  EXIT,
  GUARD_SURFACE,
  HOLDER_CODES,
  HOLDER_REL_PATH,
  HOLDER_STATES,
  REPOSITORY_PROBE_REL_PATH,
  SETTINGS_REL_PATH,
  STALE_CLONE_LIMIT,
  defaultVantage,
  exitFor,
  holderVerdict,
  hookScriptsIn,
  hooksFor,
  identityAlive,
  isHarnessProcess,
  isRecordablePid,
  judge,
  matcherSelects,
  processRow,
  programOf,
  registrationOf,
  removeHolder,
  render,
  sessionCheckout,
  sessionIdentity,
  sweep,
  worktreesOf,
  writeHolder,
} from "../scripts/checkout-currency.mjs";
import { INDEX_CRATE_MANIFEST_REL_PATH } from "../../../.claude/hooks/push-guard.mjs";
import { RUNTIME_DIR_IGNORE } from "../../../.claude/hooks/lane-fence.mjs";
import { repoRoot } from "../preflight";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";

/**
 * THE STALE-CHECKOUT CATCHER (T-216-s1) — no browser.
 *
 * The unit under test is `tools/e2e/scripts/checkout-currency.mjs`. Every
 * body that reaches a VERDICT drives it over real git repositories built
 * in a temporary directory: real worktrees, a real clone, real commits,
 * real `merge-base` queries. Nothing here writes into this repository.
 *
 * ── WHAT THE FIXTURE IS A MODEL OF ───────────────────────────────────
 * T-216's measured instance: a session worktree hundreds of commits
 * behind whose `.claude/settings.json` registered only the
 * `Edit|Write|NotebookEdit` matcher and which carried no
 * `push-guard-hook.mjs` at all. `motivatingFixture` reproduces every
 * property that matters and PROVES it holds rather than assuming it —
 * the stale HEAD is measured to be an ancestor of the tip, measured to
 * be behind it, and measured to predate the commit that registered the
 * `Bash` guard.
 *
 * ── THE TRAP THIS FILE EXISTS TO NOT FALL INTO ───────────────────────
 * The card forbids a catcher resting on reachability, because
 * `git merge-base --is-ancestor <staleHead> main` answers YES for the
 * motivating instance — being an ancestor of the tip is what STALE
 * MEANS. So `the fixture's HEAD IS an ancestor of the tip, and the
 * catcher refuses it anyway` asserts BOTH halves in one body: the naive
 * check is RUN and observed to pass, in the same fixture, in the same
 * breath as the catcher refusing. A body asserting only that an
 * unreachable HEAD is caught is degenerate against this card, and this
 * file contains none.
 *
 * ── LIFTING A SAFETY GUARD, AS docs/CONVENTIONS.md REQUIRES ──────────
 * This is a guard, so its ALLOW arms are the dangerous ones. Both rules
 * are obeyed: every lifted arm TERMINATES IN A FIXTURE (every path
 * resolves under one `mkdtemp` root), and every allow body asserts the
 * guard's STATE first by proving the SAME fixture refuses a stale
 * sibling. An allow asserted without that control is satisfied by a
 * catcher that always says yes.
 */

/** Every scratch root this file made, removed together at the end. */
const SCRATCH: string[] = [];

/**
 * NOTHING IN THIS FILE REGISTERS A WORKTREE IN THE HOST'S LIST ANY MORE
 * (T-238-s1, item 5) — and this paragraph is the keeper of an ABSENCE,
 * which is the only kind of keeper an absence can have.
 *
 * `method/lane-protocol.md` rule 4 names *the host's list of worktrees* a
 * MACHINE-scoped surface in those words. This file borrowed one anyway:
 * `currentVantageCheckout` ran `git -C <this repository> worktree add`
 * and gave the entry back in this hook. The path was DERIVED and the
 * cleanup was correct on every run the verifier made — and it was still
 * a WRITE into a surface every other checkout on this machine reads,
 * which is the hazard rule 4 states rather than a tidiness problem: a
 * sibling lane's sweep sees an entry appear and vanish mid-run and reds
 * about neither card. The fixture is a CLONE now (see
 * `currentVantageCheckout`) — about 30 ms with `--shared`, and invisible
 * to `git worktree list`. `git worktree prune` is not run here either:
 * pruning the host's administration is the same shared write in a tidier
 * costume.
 */
test.afterAll(() => {
  for (const dir of SCRATCH) removeGitFixture(dir, "checkout-currency");
});

// ── the fixture ────────────────────────────────────────────────────────

/** The registration a checkout carried BEFORE the push guard was added. */
const SETTINGS_BEFORE = JSON.stringify(
  {
    hooks: {
      PreToolUse: [
        {
          matcher: "Edit|Write|NotebookEdit",
          hooks: [
            {
              type: "command",
              command: 'node "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/lane-fence-hook.mjs"',
            },
          ],
        },
      ],
    },
  },
  null,
  2,
);

/** The registration the integration branch carries AFTER it was added. */
const SETTINGS_AFTER = JSON.stringify(
  {
    hooks: {
      PreToolUse: [
        {
          matcher: "Edit|Write|NotebookEdit",
          hooks: [
            {
              type: "command",
              command: 'node "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/lane-fence-hook.mjs"',
            },
          ],
        },
        {
          matcher: "Bash",
          hooks: [
            {
              type: "command",
              command: 'node "${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/push-guard-hook.mjs"',
            },
          ],
        },
      ],
    },
  },
  null,
  2,
);

interface Fixture {
  /** The repository whose `main` is current — the VANTAGE. */
  repo: string;
  /** A worktree pinned at the pre-guard commit — the motivating instance. */
  stale: string;
  /** A worktree at the tip — the positive control. */
  current: string;
  /** The commit `stale` sits on. */
  staleHead: string;
  /** The tip of `main`. */
  tip: string;
  /** The commit that registered the `Bash` guard. */
  guardCommit: string;
  /** A worktree behind the tip on files NO guard is made of. */
  behindOnlyChurn: string;
}

/**
 * Build the motivating instance as a real repository.
 *
 * Shape, in order: a pre-guard era (settings with no `Bash` matcher, no
 * `push-guard-hook.mjs` on disk, and no copy of the catcher), then the
 * commit that adds the guard, then further commits so the stale HEAD is
 * genuinely BEHIND rather than merely different.
 *
 * The default branch is pinned with `-b main` on every `git init`: a
 * fixture that inherits the machine's default branch name measures a
 * different repository on a different machine (docs/CONVENTIONS.md).
 */
function motivatingFixture(name: string): Fixture {
  // REAL PATH, NOT THE `mkdtemp` ONE. On macOS `os.tmpdir()` is `/var/…`,
  // a symlink to `/private/var/…`, and `git worktree list` reports the
  // RESOLVED path — so a sweep's answer and a fixture's own idea of where
  // it is would never compare equal. Found by the sweep body.
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), `T-216-s1-${name}-`)));
  SCRATCH.push(root);
  const repo = path.join(root, "repo");
  mkdirSync(repo, { recursive: true });
  const git = (...args: string[]): string =>
    execFileSync("git", ["-C", repo, ...NO_BACKGROUND_MAINTENANCE, ...args], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

  execFileSync("git", ["init", "-q", "-b", "main", repo], { stdio: "pipe" });
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "T-216-s1 fixture");

  // ── the pre-guard era ───────────────────────────────────────────────
  mkdirSync(path.join(repo, ".claude", "hooks"), { recursive: true });
  // EVERY FIXTURE'S COMMITS MUST BE UNIQUE. Two fixtures built in the
  // same second, with the same content, the same messages and the same
  // fixed identity produce IDENTICAL commit SHAs — which silently makes a
  // "different repository" body compare a repository against itself. Found
  // by the body that needs two genuinely unrelated object stores.
  writeFileSync(path.join(repo, "fixture.txt"), `${name}\n`);
  // THE REPOSITORY PROBE — what makes this scratch tree a checkout of
  // "this repository" to `sessionCheckout`. Without it the derived signal
  // correctly declines the fixture, which is the guard working and a
  // fixture that does not model what it claims to.
  mkdirSync(path.dirname(path.join(repo, REPOSITORY_PROBE_REL_PATH)), { recursive: true });
  writeFileSync(path.join(repo, REPOSITORY_PROBE_REL_PATH), '[package]\nname = "supertaskr-index"\n');
  writeFileSync(path.join(repo, SETTINGS_REL_PATH), SETTINGS_BEFORE);
  writeFileSync(path.join(repo, ".claude", "hooks", "lane-fence-hook.mjs"), "// fence hook\n");
  writeFileSync(path.join(repo, "README.md"), "before the guard\n");
  git("add", "-A");
  git("commit", "-qm", "the era before the push guard");
  const staleHead = git("rev-parse", "HEAD");

  for (let i = 0; i < 4; i += 1) {
    writeFileSync(path.join(repo, "README.md"), `unrelated churn ${String(i)}\n`);
    git("add", "-A");
    git("commit", "-qm", `unrelated commit ${String(i)}`);
  }

  // ── the commit that registers the guard ─────────────────────────────
  writeFileSync(path.join(repo, SETTINGS_REL_PATH), SETTINGS_AFTER);
  writeFileSync(path.join(repo, ".claude", "hooks", "push-guard-hook.mjs"), "// push guard\n");
  git("add", "-A");
  git("commit", "-qm", "the push guard lands");
  const guardCommit = git("rev-parse", "HEAD");

  // ── and the sitting that followed it ────────────────────────────────
  // The catcher itself is added here and NOWHERE EARLIER, so the stale
  // checkout carries no copy of it — which is what makes "fires from
  // outside the stale checkout" a measurement rather than a claim.
  mkdirSync(path.join(repo, "tools", "e2e", "scripts"), { recursive: true });
  writeFileSync(
    path.join(repo, "tools", "e2e", "scripts", "checkout-currency.mjs"),
    "// the catcher\n",
  );
  git("add", "-A");
  git("commit", "-qm", "the catcher lands");
  // Commits AFTER the guard landed that move files no guard is made of.
  // A checkout at `afterGuard` is BEHIND the tip and its guard surface
  // IS the tip's — which is what separates this catcher from a raw
  // commit distance.
  const afterGuard = git("rev-parse", "HEAD");
  for (let i = 0; i < 3; i += 1) {
    writeFileSync(path.join(repo, "README.md"), `later churn ${String(i)}\n`);
    git("add", "-A");
    git("commit", "-qm", `later commit ${String(i)}`);
  }
  const tip = git("rev-parse", "HEAD");

  const stale = path.join(root, "stale-session-worktree");
  git("worktree", "add", "-q", "--detach", stale, staleHead);
  const current = path.join(root, "current-worktree");
  git("worktree", "add", "-q", "--detach", current, tip);
  const behindOnlyChurn = path.join(root, "behind-only-churn");
  git("worktree", "add", "-q", "--detach", behindOnlyChurn, afterGuard);

  return { repo, stale, current, staleHead, tip, guardCommit, behindOnlyChurn };
}

/**
 * A stale CLONE: a SEPARATE object store whose own `main` is old.
 *
 * This is the shape the artifact's limit is about — refs that are a copy
 * rather than the thing itself. It is built by cloning and then moving
 * the clone's own `main` back, which is what a checkout that has not
 * fetched in a long time IS.
 */
function staleClone(fx: Fixture, at: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "T-216-s1-clone-"));
  SCRATCH.push(dir);
  const clone = path.join(dir, "clone");
  execFileSync("git", ["clone", "-q", fx.repo, clone], { stdio: "pipe" });
  // Detach FIRST: git refuses to force a branch that is checked out.
  execFileSync("git", ["-C", clone, "checkout", "-q", "--detach", at], { stdio: "pipe" });
  execFileSync("git", ["-C", clone, "branch", "-f", "main", at], { stdio: "pipe" });
  execFileSync("git", ["-C", clone, "checkout", "-q", "main"], { stdio: "pipe" });
  return clone;
}

/**
 * A CHECKOUT THIS BODY CONTROLS THAT READS **CURRENT** FROM THIS
 * REPOSITORY'S OWN VANTAGE (T-238, absorbing T-230-s6 and T-240).
 *
 * ── THE DEFECT THIS REPLACES ─────────────────────────────────────────
 * Two bodies below used to point the arm at `repoRoot` — the checkout
 * the suite happens to be running in — and assert `verdict: current`.
 * That is an assertion about the RUNNER'S OWN POSITION, and it is FALSE
 * for every lane and every verifier bench cut before a `.claude` commit
 * lands on the integration branch: the arm then answers
 * `guard-surface-behind`, correctly, and the body reds for being right.
 * Measured by T-215's blind verifier on a bench detached six commits
 * behind main — four bodies red across three spec files, on a
 * byte-identical tree — which is `T-240`'s claim that a verifier bench
 * cannot run the e2e leg green at any ref for any diff.
 *
 * ── WHY IT CANNOT BE AN ORDINARY `mkdtemp` REPOSITORY ────────────────
 * The arm's VANTAGE is `defaultVantage()`, which resolves against the
 * catcher's own file and is therefore always `repoRoot`; only the TARGET
 * can be steered. A target reads CURRENT only if the vantage can answer
 * both arms about it — the registration compared against `main`'s own,
 * and the guard-surface commit CONTAINED in the target's HEAD, asked
 * with `git cat-file` IN THE VANTAGE. A freshly `git init`ed directory
 * fails the second by construction: the vantage has never heard of its
 * HEAD.
 *
 * ── AND IT IS A CLONE, NEVER A WORKTREE OF THE HOST (T-238-s1) ───────
 * This ran `git -C <repoRoot> worktree add --no-checkout` and gave the
 * entry back in `afterAll`. Correct on every run, and still a WRITE into
 * `git worktree list` — a surface every checkout on this machine shares
 * and rule 4 names. A `--shared --no-checkout --single-branch` CLONE at
 * the integration ref satisfies both arms for the same reason the
 * worktree did — its HEAD IS `main`'s commit, so the vantage has that
 * object and the guard-surface commit is an ancestor of it — copies no
 * objects at all (measured at about 30 ms and 104 KB against this
 * repository), and appears in nobody's worktree list. The one property
 * it drops is SHARED REFS, which `judge` reports as a figure and no arm
 * here reads.
 *
 * ── AND THE `.claude` IT IS JUDGED ON IS WRITTEN BY THIS BODY ────────
 * Which is the whole point of the move: the settings text comes from
 * `main` itself and the hook files it names are created here, so what
 * the arm reads is a fixture the body composed rather than whatever the
 * runner's own checkout happens to carry today.
 */
function currentVantageCheckout(name: string): string {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), `T-238-current-${name}-`)));
  SCRATCH.push(root);
  const at = path.join(root, "at-integration-ref");
  execFileSync(
    "git",
    [
      "clone",
      "--quiet",
      "--shared",
      "--no-checkout",
      "--single-branch",
      "--branch",
      DEFAULT_INTEGRATION_REF,
      repoRoot,
      at,
    ],
    { stdio: "pipe" },
  );
  const settings = execFileSync(
    "git",
    ["-C", repoRoot, "show", `${DEFAULT_INTEGRATION_REF}:${SETTINGS_REL_PATH}`],
    { encoding: "utf8" },
  );
  mkdirSync(path.dirname(path.join(at, SETTINGS_REL_PATH)), { recursive: true });
  writeFileSync(path.join(at, SETTINGS_REL_PATH), settings);
  const read = registrationOf(settings);
  if (!read.ok) throw new Error(`the integration branch's settings did not parse: ${read.why}`);
  for (const entry of read.entries) {
    for (const script of entry.scripts) {
      mkdirSync(path.dirname(path.join(at, script)), { recursive: true });
      writeFileSync(path.join(at, script), "// present, which is all the presence arm asks\n");
    }
  }
  // THE REPOSITORY PROBE, for the reason `motivatingFixture` writes one:
  // `sessionCheckout`'s DERIVED signal declines a checkout that does not
  // carry it, and `--no-checkout` materialises no files at all. Without
  // this the arm answers UNANSWERED — the guard working, over a fixture
  // that does not model what it claims to.
  mkdirSync(path.dirname(path.join(at, REPOSITORY_PROBE_REL_PATH)), { recursive: true });
  writeFileSync(path.join(at, REPOSITORY_PROBE_REL_PATH), '[package]\nname = "supertaskr-index"\n');
  return at;
}

/** Every finding code a decision carries, in order. */
function codes(d: ReturnType<typeof judge>): string[] {
  return d.findings.map((f) => f.code);
}

// ── the harness simulator, and its own positive control ────────────────

interface Consulted {
  /** The hook command lines the harness would run. */
  selected: string[];
  /** One entry per hook actually SPAWNED, with the status it exited on. */
  spawned: { command: string; status: number | null }[];
}

/**
 * What the harness does with a `Bash` tool call: read the checkout's own
 * `settings.json`, SELECT the `PreToolUse` hooks whose matcher matches
 * the tool name, and RUN them.
 *
 * **THIS IS WHY THE MEASURED INSTANCE IS MECHANICAL AND NOT AN ARGUMENT
 * FROM SILENCE.** "No guard was consulted" is not read off an absence of
 * output — it is the SELECTION being empty, measured by the same
 * function that returns a non-empty selection for a checkout that does
 * register one, and spawned by the same simulator that is proven below
 * to spawn what it selects.
 */
function consult(checkout: string, request: object, toolName = "Bash"): Consulted {
  const settingsPath = path.join(checkout, SETTINGS_REL_PATH);
  const text = existsSync(settingsPath) ? readFileSync(settingsPath, "utf8") : "";
  const selected = hooksFor(text, { toolName });
  const spawned = selected.map((command) => {
    const r = spawnSync("sh", ["-c", command], {
      cwd: checkout,
      env: { ...process.env, CLAUDE_PROJECT_DIR: checkout },
      input: JSON.stringify(request),
      encoding: "utf8",
    });
    return { command, status: r.error === undefined ? r.status : null };
  });
  return { selected, spawned };
}

const PUSH_REQUEST = {
  tool_name: "Bash",
  tool_input: { command: "git push origin HEAD:refs/heads/main" },
};

// ── criterion 1: the measured instance, established mechanically ───────

test("THE SIMULATOR'S OWN POSITIVE CONTROL: a checkout that registers a Bash hook has it RUN, and the marker proves it", () => {
  // KILLED BY: a `consult` that selects but never spawns, and by a
  // `matcherSelects` that stops matching a literal tool name. Without
  // this body the next one is satisfied by a simulator that runs nothing
  // at all, which is exactly the "absence of output" the card forbids.
  const fx = motivatingFixture("simulator-control");
  const marker = path.join(fx.current, "guard-ran.txt");
  const script = path.join(fx.current, "marker-hook.sh");
  writeFileSync(script, `#!/bin/sh\nprintf 'consulted\\n' > ${JSON.stringify(marker)}\n`, {
    mode: 0o755,
  });
  writeFileSync(
    path.join(fx.current, SETTINGS_REL_PATH),
    JSON.stringify({
      hooks: {
        PreToolUse: [
          { matcher: "Bash", hooks: [{ type: "command", command: JSON.stringify(script) }] },
        ],
      },
    }),
  );

  expect(existsSync(marker), "nothing has run yet").toBe(false);
  const ran = consult(fx.current, PUSH_REQUEST);
  expect(ran.selected, "one hook selected for Bash").toHaveLength(1);
  expect(ran.spawned.map((s) => s.status), "and it exited, so it really ran").toEqual([0]);
  expect(existsSync(marker), "the marker the hook itself wrote").toBe(true);
});

test("THE MEASURED INSTANCE: a checkout registering no Bash matcher consults ZERO hooks on a push, and the push still happens", () => {
  // KILLED BY: a `matcherSelects` that treats an unmatched matcher as a
  // wildcard, and by a `hooksFor` that ignores the event name. The body
  // above proves the simulator spawns what it selects, so an empty
  // selection here is a measurement and not a silence.
  const fx = motivatingFixture("measured-instance");

  // The instance's two disk facts, asserted rather than assumed.
  const registration = readFileSync(path.join(fx.stale, SETTINGS_REL_PATH), "utf8");
  expect(registration, "only the fence matcher, as measured on T-216's card").toContain(
    "Edit|Write|NotebookEdit",
  );
  expect(registration, "and no Bash matcher at all").not.toContain('"Bash"');
  expect(
    existsSync(path.join(fx.stale, ".claude", "hooks", "push-guard-hook.mjs")),
    "the guard program is ABSENT from this checkout — the half that cannot announce itself",
  ).toBe(false);

  // The harness's own question, asked mechanically.
  const consulted = consult(fx.stale, PUSH_REQUEST);
  expect(consulted.selected, "NO guard is consulted for a Bash call here").toEqual([]);
  expect(consulted.spawned, "so nothing is spawned to have an opinion about the push").toEqual([]);

  // And the push it would have guarded goes out regardless. A bare
  // repository inside the fixture receives it, so "the push happened" is
  // observed rather than inferred from an exit code.
  const remote = path.join(fx.repo, "..", "remote.git");
  execFileSync("git", ["init", "-q", "-b", "main", "--bare", remote], { stdio: "pipe" });
  const pushed = spawnSync(
    "git",
    ["-C", fx.stale, ...NO_BACKGROUND_MAINTENANCE, "push", "-q", remote, "HEAD:refs/heads/main"],
    { encoding: "utf8" },
  );
  expect(pushed.status, "the ungated push succeeds — nothing was there to stop it").toBe(0);
  const landed = execFileSync("git", ["-C", remote, "rev-parse", "refs/heads/main"], {
    encoding: "utf8",
  }).trim();
  expect(landed, "and it landed").toBe(fx.staleHead);
});

test("ARM B: a registration that looks fully configured but whose hook FILE is absent FAILS OPEN — node starts, exits 1, and 1 is not 2", () => {
  // KILLED BY: nothing in the catcher — this body measures the HARNESS's
  // behaviour, and it is the fact the catcher's second arm exists for.
  // It reproduces the amendment's own measurement in a fixture: one
  // fault, not two, and the failure looks like a configured checkout.
  const fx = motivatingFixture("arm-b-fails-open");
  // The registration is COMPLETE here — this is the tip's own settings.
  writeFileSync(path.join(fx.current, SETTINGS_REL_PATH), SETTINGS_AFTER);
  execFileSync("rm", ["-f", path.join(fx.current, ".claude", "hooks", "push-guard-hook.mjs")]);

  const consulted = consult(fx.current, PUSH_REQUEST);
  expect(consulted.selected, "the harness DOES select a guard — the registration is there").toHaveLength(
    1,
  );
  expect(consulted.spawned, "and it DOES start").toHaveLength(1);
  expect(
    consulted.spawned[0]!.status,
    "node exits 1 on a module it cannot find — and 1 is not the harness's blocking code",
  ).toBe(1);
  expect(
    consulted.spawned[0]!.status,
    "so nothing refuses the push: this arm fails OPEN while looking configured",
  ).not.toBe(2);
});

test("ARM B is REFUSED by the catcher, which an inspection of the registration alone would pass", () => {
  // KILLED BY: a presence check that walks the TARGET's registration
  // rather than the reference's disk, and by dropping the disk check
  // altogether. This is the arm the amendment says survives a
  // registration inspection — so the inspection is RUN here and observed
  // to pass, in the same breath as the catcher refusing.
  const fx = motivatingFixture("arm-b-caught");
  writeFileSync(path.join(fx.current, SETTINGS_REL_PATH), SETTINGS_AFTER);
  execFileSync("rm", ["-f", path.join(fx.current, ".claude", "hooks", "push-guard-hook.mjs")]);

  const inspection = hooksFor(readFileSync(path.join(fx.current, SETTINGS_REL_PATH), "utf8"), {
    toolName: "Bash",
  });
  expect(inspection, "an inspection of the REGISTRATION finds the guard present").toHaveLength(1);

  const d = judge({ vantage: fx.repo, target: fx.current });
  expect(codes(d), "and the catcher refuses anyway, on the file that is not there").toEqual([
    "hook-absent",
  ]);
  expect(
    d.findings[0]!.detail,
    "naming the program, so the reader knows which guard did not run",
  ).toContain("push-guard-hook.mjs");
  expect(d.verdict).toBe("stale");
});

test("the live repository's own registration is the shape the fixture models: a Bash matcher pointing at a hook file that EXISTS", () => {
  // KILLED BY: dropping the Bash matcher from .claude/settings.json, or
  // deleting .claude/hooks/push-guard-hook.mjs. This is the coherence
  // check at the tip — it ties the fixture above to reality, so a
  // fixture that stops modelling this repository reds by name.
  const text = readFileSync(path.join(repoRoot, SETTINGS_REL_PATH), "utf8");
  const selected = hooksFor(text, { toolName: "Bash" });
  expect(selected, "exactly one guard answers a Bash call in this checkout").toHaveLength(1);
  const scripts = hookScriptsIn(selected[0]!);
  expect(scripts, "and it names its program").toContain(".claude/hooks/push-guard-hook.mjs");
  for (const script of scripts) {
    expect(existsSync(path.join(repoRoot, script)), `${script} exists on disk`).toBe(true);
  }
});

// ── criterion 4: not reachability, and refusing the motivating instance ─

test("the fixture's HEAD IS an ancestor of the integration tip, and IS behind it — the motivating instance's own properties, measured", () => {
  // KILLED BY: a fixture whose stale worktree is not an ancestor (a
  // divergent branch), which would silently turn every body below into
  // the degenerate "an unreachable HEAD is caught" the card forbids.
  const fx = motivatingFixture("properties");
  // READ OFF THE WORKTREE ITSELF, never off the variable that built it —
  // the subject of this body is the checkout the other bodies judge, and
  // a fixture whose stale worktree quietly moved to the tip would leave
  // every one of them asserting the degenerate case the card forbids.
  const head = execFileSync("git", ["-C", fx.stale, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const ancestor = spawnSync("git", ["-C", fx.repo, "merge-base", "--is-ancestor", head, fx.tip], {
    encoding: "utf8",
  });
  expect(ancestor.status, "the stale HEAD IS an ancestor of the tip — as 4ec229c was of main").toBe(
    0,
  );
  // DERIVED HERE, NEVER TYPED: a distance measured against anything that
  // moves is stale before it is read (this card's own fourth criterion).
  const behind = Number(
    execFileSync("git", ["-C", fx.repo, "rev-list", "--count", `${head}..${fx.tip}`], {
      encoding: "utf8",
    }).trim(),
  );
  expect(behind, "and it is genuinely behind").toBeGreaterThan(0);
  const containsGuard = spawnSync(
    "git",
    ["-C", fx.repo, "merge-base", "--is-ancestor", fx.guardCommit, head],
    { encoding: "utf8" },
  );
  expect(containsGuard.status, "and it predates the commit that registered the guard").toBe(1);
});

test("A REACHABILITY TEST PASSES THE MOTIVATING INSTANCE AND THE CATCHER REFUSES IT — both measured in one fixture", () => {
  // KILLED BY: any catcher that answers on `is-ancestor <head> <tip>`.
  // This is the card's fourth criterion in one body: the naive check is
  // RUN, observed to say FINE, and the catcher is observed to refuse the
  // same checkout in the same breath.
  const fx = motivatingFixture("not-reachability");

  const naive = spawnSync(
    "git",
    ["-C", fx.repo, "merge-base", "--is-ancestor", fx.staleHead, fx.tip],
    { encoding: "utf8" },
  );
  expect(naive.status, 'the reachability question answers "fine" for this checkout').toBe(0);

  const d = judge({ vantage: fx.repo, target: fx.stale, integrationRef: DEFAULT_INTEGRATION_REF });
  expect(d.verdict, "and the catcher refuses it anyway").toBe("stale");
  expect(codes(d), "naming every reason, not only one").toEqual(
    expect.arrayContaining(["registration-missing", "hook-absent", "guard-surface-behind"]),
  );
  expect(exitFor(d), "exit 1 — the catcher HAS a verdict").toBe(EXIT.FOUND);

  const behind = d.findings.find((f) => f.code === "guard-surface-behind");
  expect(behind?.detail, "and it says which commit the HEAD does not contain").toContain(
    fx.guardCommit,
  );
  expect(
    behind?.detail,
    "and says in the finding itself that reachability is not the question",
  ).toContain("NOT the reachability question");
});

test("the catcher is not a commit COUNT either: a checkout behind only on files no guard is made of is CURRENT", () => {
  // KILLED BY: replacing the guard-surface containment with a
  // `rev-list --count > 0` refusal — which would red every lane in
  // flight and teach the project to ignore this tool. This is the
  // positive control for the arm the body above exercises: the SAME
  // fixture, the SAME vantage, a checkout that is behind and allowed.
  const fx = motivatingFixture("behind-but-current");
  const target = fx.behindOnlyChurn;
  const head = execFileSync("git", ["-C", target, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const behind = Number(
    execFileSync("git", ["-C", fx.repo, "rev-list", "--count", `${head}..${fx.tip}`], {
      encoding: "utf8",
    }).trim(),
  );
  expect(behind, "this checkout IS behind the tip").toBeGreaterThan(0);

  const d = judge({ vantage: fx.repo, target, integrationRef: DEFAULT_INTEGRATION_REF });
  expect(
    codes(d),
    "and is refused for nothing — its guard surface is the tip's guard surface",
  ).toEqual([]);
  expect(d.verdict).toBe("current");
  expect(exitFor(d), "exit 0").toBe(EXIT.CLEAN);
  expect(d.figures["commitsBehind"], "the distance is REPORTED, it is just not the verdict").toBe(
    behind,
  );
});

// ── criterion 2: it fires from OUTSIDE, with no cooperation ────────────

test("THE CATCHER FIRES FROM OUTSIDE: the judged checkout carries no copy of it, no hooks, and is not written to", () => {
  // KILLED BY: a catcher that reads its reference values from the target
  // (swap `vantage` for `target` in either arm), and by one that needs a
  // program present in the target to answer.
  const fx = motivatingFixture("from-outside");
  expect(
    existsSync(path.join(fx.stale, "tools", "e2e", "scripts", "checkout-currency.mjs")),
    "the judged checkout does not carry the catcher",
  ).toBe(false);
  expect(
    existsSync(path.join(fx.stale, ".claude", "hooks", "push-guard-hook.mjs")),
    "nor the guard it is being judged for",
  ).toBe(false);

  const before = execFileSync("git", ["-C", fx.stale, "status", "--porcelain"], {
    encoding: "utf8",
  });
  const d = judge({ vantage: fx.repo, target: fx.stale });
  expect(d.verdict, "and it is judged all the same").toBe("stale");
  const after = execFileSync("git", ["-C", fx.stale, "status", "--porcelain"], {
    encoding: "utf8",
  });
  expect(after, "with nothing installed into it and nothing written").toBe(before);
});

test("a checkout with NO settings.json at all is refused, naming every hook the integration branch registers", () => {
  // KILLED BY: an arm that iterates the TARGET's registration instead of
  // the REFERENCE's — which reports nothing missing when nothing is
  // registered, the exact shape of the defect this card is about.
  const fx = motivatingFixture("no-settings");
  execFileSync("rm", ["-rf", path.join(fx.stale, ".claude")]);
  const d = judge({ vantage: fx.repo, target: fx.stale });
  expect(codes(d)).toContain("settings-absent");
  expect(
    d.findings.filter((f) => f.code === "hook-absent").length,
    "both reference hooks are reported absent",
  ).toBe(2);
});

test("THE POSITIVE CONTROL: a checkout at the tip is CURRENT, in the same fixture that refuses its stale sibling", () => {
  // KILLED BY: a catcher that refuses everything — which every body
  // above would be satisfied by. This is what separates a refusal from
  // an absence (docs/CONVENTIONS.md, A NEGATIVE ASSERTION NEEDS A
  // POSITIVE CONTROL).
  const fx = motivatingFixture("positive-control");
  const stale = judge({ vantage: fx.repo, target: fx.stale });
  expect(stale.verdict, "the same fixture refuses its stale worktree").toBe("stale");

  const d = judge({ vantage: fx.repo, target: fx.current });
  expect(codes(d), "and allows the one at the tip, with no finding at all").toEqual([]);
  expect(d.unanswered, "and no unanswered question either").toEqual([]);
  expect(d.verdict).toBe("current");
  expect(exitFor(d)).toBe(EXIT.CLEAN);
});

// ── criterion 3: the stale-clone limit, stated AND demonstrated ────────

test("the stale-clone limit is stated in the ARTIFACT, and printed on every run whatever the verdict", () => {
  // KILLED BY: deleting the limit from the render, or from the exported
  // constant. The card requires the limit in the artifact rather than
  // only on the card, and a comment is not assertable — so it is a
  // constant the render is required to carry.
  expect(STALE_CLONE_LIMIT).toContain("worktree");
  expect(STALE_CLONE_LIMIT).toContain("clone");
  expect(STALE_CLONE_LIMIT).toContain("refs");
  const fx = motivatingFixture("limit-printed");
  for (const target of [fx.current, fx.stale]) {
    const lines = render(judge({ vantage: fx.repo, target })).join("\n");
    expect(lines, `the limit is printed for ${path.basename(target)} too`).toContain(
      STALE_CLONE_LIMIT,
    );
  }
});

test("THE LIMIT DEMONSTRATED: the same stale content answers CURRENT from a stale clone and STALE from a sharing vantage", () => {
  // KILLED BY: a catcher that resolves the integration ref anywhere but
  // the vantage. The PAIR is the demonstration — one target content, two
  // vantages, two answers — and it is what turns the stale-clone
  // paragraph from prose into a measurement.
  const fx = motivatingFixture("clone-limit");
  const clone = staleClone(fx, fx.staleHead);
  expect(
    execFileSync("git", ["-C", clone, "rev-parse", "main"], { encoding: "utf8" }).trim(),
    "the clone's own `main` is the stale commit",
  ).toBe(fx.staleHead);

  const fromClone = judge({ vantage: clone, target: clone });
  expect(fromClone.verdict, "asked from the stale side, everything looks fine").toBe("current");

  const fromRepo = judge({ vantage: fx.repo, target: fx.stale });
  expect(fromRepo.verdict, "the same content, asked from a vantage that shares refs").toBe("stale");
  expect(fromRepo.figures["sharedRefs"], "and the run says the refs were shared").toBe(true);
});

test("THE REFERENCE COMES FROM THE VANTAGE, PROVEN AGAINST A TARGET WHOSE OWN `main` DISAGREES", () => {
  // KILLED BY: reading the reference registration from the TARGET instead
  // of the vantage — a swap every other body in this file SURVIVES,
  // because a stale WORKTREE shares refs and answers `main` identically
  // from either side. A poison drill found exactly that hole: the fixture
  // that models the motivating instance cannot separate these two reads.
  // A stale CLONE can, and that is the whole reason this body exists.
  const fx = motivatingFixture("reference-side");
  const clone = staleClone(fx, fx.staleHead);
  expect(
    execFileSync("git", ["-C", clone, "show", `main:${SETTINGS_REL_PATH}`], { encoding: "utf8" }),
    "asked on the TARGET's own refs, `main` hands back the pre-guard registration",
  ).toContain("Edit|Write|NotebookEdit");
  expect(
    execFileSync("git", ["-C", clone, "show", `main:${SETTINGS_REL_PATH}`], { encoding: "utf8" }),
    "and no Bash matcher — so a reference read from that side sees no gap at all",
  ).not.toContain('"Bash"');

  const d = judge({ vantage: fx.repo, target: clone });
  expect(
    codes(d),
    "the catcher reads its reference from the VANTAGE, so both registration arms still fire",
  ).toEqual(expect.arrayContaining(["registration-missing", "hook-absent"]));
});

test("THE THIRD VERDICT: a vantage that cannot see the judged HEAD answers UNKNOWN, never CURRENT", () => {
  // KILLED BY: rounding `unanswered` down to `current` (two verdicts
  // instead of three), and by an arm that reports shared refs without
  // measuring the common dir. A catcher that answers "fine" when it
  // means "I could not ask" is worse than one that refuses.
  const fx = motivatingFixture("unshared");
  const stranger = motivatingFixture("unshared-stranger");
  const d = judge({ vantage: stranger.repo, target: fx.current });

  expect(d.figures["sharedRefs"], "different object stores, and the run says so").toBe(false);
  expect(
    d.unanswered.map((f) => f.code),
    "the guard-surface question could not be asked from this side at all",
  ).toContain("target-head-not-in-vantage");
  expect(d.verdict, "so the answer is UNKNOWN").toBe("unknown");
  expect(exitFor(d), "exit 3 — the catcher could not finish, which is not a pass").toBe(
    EXIT.CANNOT_RUN,
  );
  expect(render(d).join("\n"), "and the render names the shape out loud").toContain(
    "do NOT share a git object store",
  );
});

// ── the parsing surface, and its own controls ──────────────────────────

test("a matcher selects by the harness's own rule: a regex over the tool name, an empty matcher is a wildcard, an uncompilable one selects nothing", () => {
  // KILLED BY: substring matching (which makes "Edit" select "EditFile"
  // but also lets a broken regex through as a wildcard), and by treating
  // a throw as `true`.
  expect(matcherSelects("Bash", "Bash")).toBe(true);
  expect(matcherSelects("Edit|Write|NotebookEdit", "Bash")).toBe(false);
  expect(matcherSelects("Edit|Write|NotebookEdit", "Write")).toBe(true);
  expect(matcherSelects("", "Bash"), "an empty matcher is the harness's wildcard").toBe(true);
  expect(matcherSelects("*", "Bash"), "and so is a bare star").toBe(true);
  expect(matcherSelects("(", "Bash"), "an uncompilable matcher selects NOTHING, never all").toBe(
    false,
  );
});

test("a registration is read out of settings.json with its event, its matcher and the program it names", () => {
  // KILLED BY: dropping the event from the entry (which would let a
  // PostToolUse registration satisfy a PreToolUse requirement), and by a
  // script extractor that misses the CLAUDE_PROJECT_DIR interpolation.
  const read = registrationOf(SETTINGS_AFTER);
  expect(read.ok).toBe(true);
  if (!read.ok) return;
  expect(read.entries).toHaveLength(2);
  expect(read.entries.map((e) => e.event)).toEqual(["PreToolUse", "PreToolUse"]);
  expect(read.entries.map((e) => e.matcher)).toEqual(["Edit|Write|NotebookEdit", "Bash"]);
  expect(read.entries[1]!.scripts).toEqual([".claude/hooks/push-guard-hook.mjs"]);
  expect(hookScriptsIn("node /somewhere/else.mjs"), "no interpolation, no claim").toEqual([]);

  const broken = registrationOf("{ not json");
  expect(broken.ok, "a settings file that does not parse is a refusal, never an empty allow").toBe(
    false,
  );
});

test("the guard surface is `.claude`, and it is the surface the arm actually walks", () => {
  // KILLED BY: widening GUARD_SURFACE without moving the arm, or the
  // reverse. A constant nothing reads is a claim with no keeper.
  expect(GUARD_SURFACE).toEqual([".claude"]);
  const fx = motivatingFixture("surface");
  const d = judge({ vantage: fx.repo, target: fx.stale });
  expect(d.figures["guardSurfaceCommit"], "the arm found the newest `.claude` commit").toBe(
    fx.guardCommit,
  );
});

// ── the CLI ────────────────────────────────────────────────────────────

const CLI = path.join(repoRoot, "tools", "e2e", "scripts", "checkout-currency.mjs");

function runCli(args: string[]): { status: number | null; out: string; err: string } {
  const r = spawnSync("node", [CLI, ...args], { encoding: "utf8" });
  return { status: r.status, out: r.stdout ?? "", err: r.stderr ?? "" };
}

test("the CLI answers in the house's four codes: 0 current, 1 a verdict, 2 called wrong", () => {
  // KILLED BY: re-typing any of the four numbers, and by an exit code
  // that does not track the verdict. The EXIT object is the single
  // authority; this body checks the CLI actually reaches it.
  const fx = motivatingFixture("cli");
  expect(runCli(["--nonsense"]).status, "called wrong").toBe(EXIT.USAGE);
  expect(runCli(["--checkout"]).status, "a flag with no value is called wrong too").toBe(EXIT.USAGE);

  const stale = runCli(["--vantage", fx.repo, "--checkout", fx.stale]);
  expect(stale.status, "the catcher HAS a verdict").toBe(EXIT.FOUND);
  expect(stale.err, "and says it where a failing gate is read").toContain("STALE");
  expect(stale.err, "carrying the limit").toContain("STALE-CLONE LIMIT");

  const current = runCli(["--vantage", fx.repo, "--checkout", fx.current]);
  expect(current.status, "and the positive control still passes through the CLI").toBe(EXIT.CLEAN);
  expect(current.out).toContain("CURRENT");
});

test("the CLI's default VANTAGE is this file's own checkout, never the current directory", () => {
  // KILLED BY: `defaultVantage()` resolving `process.cwd()`. That is the
  // whole construction: a vantage taken from the shell's directory is
  // frequently the stale side, which is the defect this card is about.
  expect(defaultVantage()).toBe(repoRoot);
  const fx = motivatingFixture("default-vantage");
  const r = spawnSync("node", [CLI, "--checkout", fx.stale], {
    cwd: fx.stale,
    encoding: "utf8",
  });
  expect(r.stderr + r.stdout, "the run names the vantage it used").toContain(repoRoot);
});

// ── criterion 5: the catcher is WIRED, not merely present ──────────────

const BRIEF = path.join(repoRoot, "tools", "e2e", "scripts", "brief.mjs");

/**
 * A card that is live on this board, used only to reach the arm that
 * reports findings — `--preflight` refuses an id with no card BEFORE the
 * findings summary, which is the body above's subject rather than this
 * one's. It is this card's own id, so a lane that renames it reds here
 * with a message that says which file moved.
 */
const LIVE_CARD = "T-216-s1";

/**
 * Drive the real arming step.
 *
 * `projectDir` sets `CLAUDE_PROJECT_DIR`; **passing `undefined` UNSETS
 * it, which is PRODUCTION'S OWN ENVIRONMENT** — the variable is exported
 * to hook commands and not to Bash tool calls, so a seat typing the
 * arming step at its shell has no such variable. `cwd` defaults to this
 * repository because that is where the ritual is run from; a body that
 * needs the other production signal moves it.
 */
function runBrief(
  args: string[],
  projectDir?: string,
  cwd: string = repoRoot,
): { status: number | null; out: string; err: string } {
  const env = { ...process.env };
  if (projectDir === undefined) delete env["CLAUDE_PROJECT_DIR"];
  else env["CLAUDE_PROJECT_DIR"] = projectDir;
  const r = spawnSync(process.execPath, [BRIEF, ...args], { cwd, env, encoding: "utf8" });
  return { status: r.status, out: r.stdout ?? "", err: r.stderr ?? "" };
}

test("THE CATCHER IS WIRED: the dispatch ritual's arming step INVOKES it, and a stale session checkout reaches the seat cutting the lane", () => {
  // KILLED BY: removing the `judgeCheckout()` call from brief.mjs while
  // checkout-currency.mjs stays exactly where it is. That is the card's
  // fifth criterion in one sentence — a correct catcher that nothing
  // calls satisfies every other criterion on this card, and a blind
  // attack set found exactly that before any of this existed.
  const fx = motivatingFixture("wired");
  const run = runBrief(["--task", "T-999", "--preflight"], fx.stale);

  expect(run.out, "the arming step emits the catcher's own block").toContain(
    "THE SESSION'S OWN CHECKOUT",
  );
  expect(run.out, "with its verdict about the checkout the harness loaded settings from").toContain(
    "verdict: stale",
  );
  expect(run.out, "naming the checkout it judged").toContain(fx.stale);
  expect(run.out, "and the vantage it judged from, which is NOT that checkout").toContain(repoRoot);

  // AND IT RUNS BEFORE THE CARD IS EVEN LOOKED UP. `T-999` names no live
  // card, so this invocation ends at "called wrong" — and the seat has
  // still been told. A guard that speaks only on the happy path is one
  // nobody hears at the moment it matters.
  expect(run.status, "the invocation still ends the way it would have").toBe(EXIT.USAGE);
});

test("A STALE SESSION CHECKOUT IS A FINDING: the arming step reports it where a dispatch's refusals are read", () => {
  // KILLED BY: dropping `sessionFindings` from brief.mjs's findings list —
  // which would leave the block printed and the dispatch passing quietly,
  // the exact half-measure that makes a guard decorative.
  const fx = motivatingFixture("wired-finding");
  const run = runBrief(["--task", LIVE_CARD, "--preflight"], fx.stale);
  expect(run.err, "the finding reaches the summary a dispatcher reads").toContain(
    "the checkout this session was started in is STALE",
  );
  expect(run.err, "naming the arm that caught it").toContain("hook-absent");
});

test("THE WIRING'S POSITIVE CONTROL: the same arming step says CURRENT for a current checkout, and adds no finding", () => {
  // KILLED BY: a wiring that reports STALE unconditionally, which every
  // assertion in the body above would be satisfied by.
  //
  // T-238: THE SUBJECT IS A FIXTURE THIS BODY BUILT, NOT `repoRoot`.
  // This read `repoRoot` and was therefore an assertion about how far
  // the RUNNER'S OWN checkout had fallen behind — green in a lane cut
  // after the newest `.claude` commit and red in one cut before it, on
  // a byte-identical tree. `currentVantageCheckout` composes a checkout
  // that is current BY CONSTRUCTION, so this body now measures the
  // wiring instead of the machine. T-238-s1 made that fixture a CLONE
  // rather than a worktree of this repository; what it is a checkout OF
  // is invisible to every assertion below, which is the point.
  const current = currentVantageCheckout("wiring-control");
  const run = runBrief(["--task", "T-999", "--preflight"], current);
  expect(run.out).toContain("THE SESSION'S OWN CHECKOUT");
  expect(run.out, "the fixture is current against the integration branch").toContain(
    "verdict: current",
  );
  expect(run.out, "and it is the checkout this body composed that was judged").toContain(current);
  expect(run.err, "so nothing is reported as stale").not.toContain(
    "the checkout this session was started in is STALE",
  );
});

test("PRODUCTION'S OWN ENVIRONMENT: with CLAUDE_PROJECT_DIR UNSET, a stale session checkout IS caught at arm time", () => {
  // KILLED BY: reading the session checkout from CLAUDE_PROJECT_DIR
  // alone — which is what the first build did, and what it was REJECTED
  // for. That variable is exported to hook commands and NOT to Bash tool
  // calls, so the arming step a seat actually types has no such variable;
  // the previous build took its "nothing declared" branch every time and
  // the only path to a STALE verdict was reachable from a fixture.
  //
  // THIS BODY'S ENVIRONMENT IS THE PRODUCTION ONE, not a fixture's: the
  // variable is unset, and the only signal is where the command is run
  // FROM. That is exactly what a seat has.
  const fx = motivatingFixture("production-env");
  const run = runBrief(["--task", "T-999", "--preflight"], undefined, fx.stale);

  expect(run.out, "the arm reached a verdict with nothing declared").toContain("verdict: stale");
  expect(run.out, "about the checkout the command was run from").toContain(fx.stale);
  expect(run.out, "and says which signal it derived it from, never claiming it was declared").toContain(
    "derived",
  );

  // AND THE SAME ENVIRONMENT REACHES THE FINDINGS SUMMARY. `T-999` names
  // no live card, so the invocation above ends at "called wrong" before
  // that summary is printed — which is a property of THAT arm and not of
  // this one. A live card carries the same derivation all the way to the
  // place a dispatcher reads refusals. `--root` names the repository the
  // brief is ABOUT; the cwd is where the seat is SITTING, and the
  // catcher must use the second — conflating them is what once reported
  // a scratch fixture as a stale session checkout.
  const live = runBrief(["--task", LIVE_CARD, "--preflight", "--root", repoRoot], undefined, fx.stale);
  expect(live.err, "with nothing declared, it is a FINDING and the dispatch does not pass quietly").toContain(
    "the checkout this session was started in is STALE",
  );
});

test("a DECLARED checkout still wins over the derived one — the two signals have an order, and it is said", () => {
  // KILLED BY: dropping the CLAUDE_PROJECT_DIR branch, or by letting the
  // derived signal override it. Where the harness DID export the
  // variable it is authoritative, and the render must not call it
  // "derived" — a reader has to be able to tell an authoritative answer
  // from an inferred one.
  const fx = motivatingFixture("declared-wins");
  const run = runBrief(["--task", "T-999", "--preflight"], fx.stale, repoRoot);
  expect(run.out).toContain("verdict: stale");
  expect(run.out, "the declared checkout is the one judged, not the cwd").toContain(fx.stale);
  expect(run.out, "and the source is named as declared").toContain("declared");
});

test("UNANSWERED is reserved for the case that genuinely has no signal — outside this repository altogether", () => {
  // KILLED BY: widening the unanswered branch back to "no
  // CLAUDE_PROJECT_DIR", which is production and would certify the gap
  // this card was rejected for. The branch must survive for the case it
  // is true of, and this body pins that case to one that is NOT
  // production: a working directory in no checkout of this repository.
  const outside = mkdtempSync(path.join(os.tmpdir(), "T-216-s1-outside-"));
  SCRATCH.push(outside);
  const run = runBrief(["--task", "T-999", "--preflight"], undefined, outside);
  expect(run.out, "the arm still speaks").toContain("THE SESSION'S OWN CHECKOUT");
  expect(run.out, "and says there was no signal to derive one from").toContain("UNANSWERED");
  expect(run.err, "charging nobody with being stale").not.toContain(
    "the checkout this session was started in is STALE",
  );
  expect(run.out, "while the sweep, which needs no signal at all, still ran").toContain(
    "EVERY CHECKOUT OF THIS REPOSITORY ON THIS MACHINE",
  );
});

test("THE SWEEP NEEDS NOTHING DECLARED: it names a stale checkout no environment variable and no cwd could have pointed at", () => {
  // KILLED BY: a sweep that judges only the resolved target, and by one
  // that reads its checkout list from anywhere but git's own worktree
  // administration. This is the half that cannot be defeated by a wrong
  // signal — the session's checkout is in the list by construction.
  const fx = motivatingFixture("sweep");
  const results = sweep({ vantage: fx.repo });
  const seen = new Map(results.map((r) => [r.checkout, r.decision.verdict]));

  expect(seen.get(fx.stale), "the stale worktree, named without being pointed at").toBe("stale");
  expect(seen.get(fx.current), "and the current one is NOT — the sweep discriminates").toBe(
    "current",
  );
  expect(seen.get(fx.behindOnlyChurn), "nor is one behind on files no guard is made of").toBe(
    "current",
  );
  expect(
    results.length,
    "every worktree of the repository is in the answer, not a subset",
  ).toBe(worktreesOf(fx.repo).length);
});

test("THE SWEEP AT ARM TIME: the arming step RUNS it, and names every checkout git reports", () => {
  // KILLED BY: running the sweep only when the target resolution failed.
  // This is the hole the derived signal leaves and the reason the sweep
  // exists: a seat typing the arming step in the CURRENT checkout while
  // its session lives in a stale worktree is the motivating instance's
  // own shape, and the target arm alone answers "fine" for it.
  //
  // T-238: THE SEAT IS SITTING IN A FIXTURE THIS BODY BUILT. The `cwd`
  // used to be `repoRoot`, so `verdict: current` was an assertion about
  // the runner's own position and reddened in every lane and every
  // verifier bench cut before a `.claude` commit landed. The derived
  // signal is still the production one — nothing is DECLARED here — and
  // what changed is only which checkout the seat is sitting in.
  //
  // T-238-s1: AND THAT FIXTURE IS A CLONE RATHER THAN A WORKTREE OF THE
  // HOST, so this body no longer writes `git worktree list`. What it
  // gave up with the worktree is the assertion that the sweep names a
  // checkout REGISTERED SECONDS AGO — an assertion that cost a write
  // into a machine-scoped surface to make. The property it was buying
  // is unmoved and is asserted where it costs nothing: THE SWEEP NEEDS
  // NOTHING DECLARED above builds every checkout it then counts, over a
  // scratch repository, and pins the count exactly.
  const current = currentVantageCheckout("sweep-at-arm-time");
  const run = runBrief(["--task", "T-999", "--preflight"], undefined, current);
  expect(run.out, "the checkout being typed in is current").toContain("verdict: current");
  expect(run.out, "and it was derived from the cwd, not declared").toContain("derived");
  expect(run.out, "and the sweep ran anyway").toContain(
    "EVERY CHECKOUT OF THIS REPOSITORY ON THIS MACHINE",
  );
  // THE SWEEP IS READ OFF GIT'S OWN ADMINISTRATION AND THE MECHANISM IS
  // WHAT IS ASSERTED, never a machine's contents: the vantage's own
  // checkout is in `git worktree list` BY CONSTRUCTION — git always
  // reports the checkout it is asked from — and nothing pointed the
  // sweep at it. The fixture the seat is sitting in is deliberately NOT
  // expected here: it is a clone, so it is in no worktree list at all,
  // and the sweep judging the machine while the seat sits outside it is
  // exactly the hole the sweep exists to cover.
  const listed = worktreesOf(repoRoot);
  expect(listed.length, "git always reports at least the checkout we are in").toBeGreaterThanOrEqual(1);
  expect(
    listed.map((w) => w.path),
    "the vantage's own checkout is in git's own list, with nothing declaring it",
  ).toContain(repoRoot);
  expect(run.out, "and the sweep names it").toContain(repoRoot);
  expect(
    listed.map((w) => w.path),
    "while the fixture the seat sits in is a CLONE, and writes no entry into that list",
  ).not.toContain(current);
});

test("the repository probe is ONE fact checked twice — the catcher and the push guard ask with the same path", () => {
  // KILLED BY: either constant moving without the other. A second copy of
  // a fact is two facts unless something compares them; this is the
  // comparison.
  expect(REPOSITORY_PROBE_REL_PATH).toBe(INDEX_CRATE_MANIFEST_REL_PATH);
  expect(existsSync(path.join(repoRoot, REPOSITORY_PROBE_REL_PATH)), "and it is a real path").toBe(
    true,
  );
});

test("sessionCheckout derives the WORKTREE ROOT, never the raw working directory, and never outside this repository", () => {
  // KILLED BY: returning `cwd` itself (which the verdict explicitly did
  // not want and the code refuses), and by dropping the
  // repository probe so any git checkout on the machine qualifies.
  const nested = path.join(repoRoot, "tools", "e2e", "scripts");
  const derived = sessionCheckout({}, nested);
  expect(derived?.path, "a deep cwd resolves to the worktree ROOT").toBe(repoRoot);
  expect(derived?.source).toBe("derived");

  const declared = sessionCheckout({ CLAUDE_PROJECT_DIR: repoRoot }, nested);
  expect(declared?.source, "and a declared one is not called derived").toBe("declared");

  const outside = mkdtempSync(path.join(os.tmpdir(), "T-216-s1-nonrepo-"));
  SCRATCH.push(outside);
  execFileSync("git", ["init", "-q", "-b", "main", outside], { stdio: "pipe" });
  expect(
    sessionCheckout({}, outside),
    "a git checkout that is not THIS repository yields no target at all",
  ).toBeUndefined();
});

test("the arm is scoped to the steps that CUT a session: a brief that arms nothing does not run it", () => {
  // KILLED BY: emitting the block on every invocation, which would make
  // the body above pass for a reason that has nothing to do with arming
  // a lane. `--state` reads; `--preflight` and `--write-fence` arm.
  const run = runBrief(["--state"], repoRoot);
  expect(run.out.length, "the command still did its work").toBeGreaterThan(0);
  expect(run.out, "and did not run the arm-time catcher").not.toContain(
    "THE SESSION'S OWN CHECKOUT",
  );
});

test("the exported EXIT object is the single authority — the npm script re-types no number", () => {
  // KILLED BY: putting a code in package.json, or a second EXIT
  // declaration in the module. The rule the docs gate already lives
  // under (T-078/T-080), applied to this command.
  const pkg = JSON.parse(
    readFileSync(path.join(repoRoot, "tools", "e2e", "package.json"), "utf8"),
  ) as { scripts: Record<string, string> };
  const script = pkg.scripts["session:check"];
  expect(script, "the catcher is a NAMED command").toBeDefined();
  expect(script).toContain("scripts/checkout-currency.mjs");
  expect(script, "no re-typed exit code").not.toMatch(/\d/);
  expect(script, "no shell chaining that could rewrite the status").not.toMatch(/[|;&]|\bexit\b/);

  const source = readFileSync(CLI, "utf8");
  const decls = [...source.matchAll(/Object\.freeze\(\{[^}]*CLEAN[^}]*\}\)/g)];
  expect(decls.length, "exactly one EXIT declaration").toBe(1);
  for (const name of ["CLEAN: 0", "FOUND: 1", "USAGE: 2", "CANNOT_RUN: 3"]) {
    expect(decls[0]![0], `EXIT names ${name}`).toContain(name);
  }
  expect(source, "no numeric literal reaches process.exit").not.toMatch(/process\.exit\(\s*\d/);
});

/* ════════ THE HOLDER OF THE INTEGRATION CHECKOUT (T-238) ════════════
 *
 * `method/lane-protocol.md` rule 4 rules ONE holder at a time and says
 * the holder is DECLARED at dispatch and never inferred. Nothing on disk
 * recorded who, so on 2026-09-01 two sessions held the integration
 * checkout at once — one mid-battery and then mid-checkpoint, the other
 * reading — and the only thing that noticed was a seat running `ps`.
 *
 * ── EVERY BODY HERE INJECTS THE IDENTITY OR THE PROCESS TABLE ────────
 * The derivation is a fact about ONE harness, and the machine that runs
 * this suite is not guaranteed to be running under it — CI is not. A
 * body resting on the real ancestry would be green on a developer's
 * laptop and vacuous on the runner, which is the shape
 * `THE SWEEP AT ARM TIME` above was just repaired for. So the ancestry
 * is SYNTHETIC where the subject is the walk, and the identity is
 * INJECTED where the subject is the state machine. Exactly one body
 * spends the real process table, and it spends it on the two facts a
 * fixture cannot fake: a pid that genuinely does not exist, and one that
 * genuinely does.
 */

interface PsRow {
  pid: number;
  ppid: number;
  startedAt: string;
  command: string;
}

/** A process table this body wrote, read the way `processRow` reads one. */
function chain(rows: PsRow[]): (pid: number) => PsRow | undefined {
  const byPid = new Map(rows.map((r) => [r.pid, r]));
  return (pid: number) => byPid.get(pid);
}

/** The harness binary's real spelling on the machine this was measured on. */
const HARNESS_CMD =
  "/Users/ujju/Library/Application Support/Claude/claude-code/2.1.255/claude.app/Contents/MacOS/claude " +
  "--output-format stream-json --verbose --model claude-fable-5-1";

/** The per-session launcher above it, whose ARGUMENTS name the same directory. */
const LAUNCHER_CMD =
  "/Applications/Claude.app/Contents/Helpers/disclaimer -- " +
  "/Users/ujju/Library/Application Support/Claude/claude-code/2.1.255/claude.app/Contents/MacOS/claude " +
  "--output-format stream-json";

/** The application root: ONE per application instance, shared by every session in it. */
const APP_ROOT_CMD = "/Applications/Claude.app/Contents/MacOS/Claude";

/**
 * The measured ancestry of 2026-09-02, as a table: a tool shell under a
 * per-call shell under the harness, under the launcher, under the shared
 * application root.
 */
function measuredChain(leafDepth: number): { rows: PsRow[]; leaf: number; harness: number } {
  const rows: PsRow[] = [
    { pid: 2295, ppid: 1, startedAt: "Tue Sep 1 23:19:07 2026", command: APP_ROOT_CMD },
    { pid: 65004, ppid: 2295, startedAt: "Tue Sep 1 23:52:34 2026", command: LAUNCHER_CMD },
    { pid: 65005, ppid: 65004, startedAt: "Tue Sep 1 23:52:34 2026", command: HARNESS_CMD },
  ];
  let parent = 65005;
  for (let i = 0; i < leafDepth; i += 1) {
    const pid = 44000 + i;
    rows.push({
      pid,
      ppid: parent,
      startedAt: "Wed Sep 2 06:38:41 2026",
      command: i === leafDepth - 1 ? "node /x/tools/e2e/scripts/brief.mjs --take-seat" : "/bin/zsh",
    });
    parent = pid;
  }
  return { rows, leaf: parent, harness: 65005 };
}

/** A minimal integration checkout: a real repository on the integration ref. */
function seatFixture(name: string): string {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), `T-238-seat-${name}-`)));
  SCRATCH.push(root);
  const repo = path.join(root, "repo");
  mkdirSync(repo, { recursive: true });
  execFileSync("git", ["init", "-q", "-b", DEFAULT_INTEGRATION_REF, repo], { stdio: "pipe" });
  const git = (...args: string[]): void => {
    execFileSync("git", ["-C", repo, ...NO_BACKGROUND_MAINTENANCE, ...args], { stdio: "pipe" });
  };
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "T-238 fixture");
  writeFileSync(path.join(repo, "fixture.txt"), `${name}\n`);
  git("add", "-A");
  git("commit", "-qm", "the seat fixture's one commit");
  return repo;
}

/** An identity in the shape `holderVerdict` takes when the caller supplies one. */
function injected(pid: number, startedAt: string) {
  return { ok: true as const, identity: { pid, startedAt, program: "/x/claude" } };
}

test("the session identity is the NEAREST harness ancestor, at whatever depth the caller sits", () => {
  // KILLED BY: a fixed hop count, and by a walk that keeps climbing past
  // the first match. THE DEPTH IS NOT A CONSTANT AT THE TWO CALL SITES:
  // the arming steps run under `zsh -> claude` and the push guard runs
  // as a hook under `node -> claude` with no shell at all, and measured
  // on Mac.lan on 2026-09-02 the same session answered at 2 hops from a
  // tool shell and 3 under `npm exec`. A derivation keyed on depth
  // refuses the very session that took the seat.
  for (const depth of [1, 2, 3, 6]) {
    const { rows, leaf, harness } = measuredChain(depth);
    const got = sessionIdentity({ pid: leaf, readProcess: chain(rows) });
    expect(got.ok, `depth ${depth}: ${got.ok ? "" : got.why}`).toBe(true);
    if (!got.ok) continue;
    expect(got.identity.pid, `depth ${depth} finds the harness`).toBe(harness);
    expect(got.identity.startedAt).toBe("Tue Sep 1 23:52:34 2026");
    expect(got.hops, "and the depth is an OUTPUT, never an input").toBe(depth);
  }
});

test("the shared application root is never the identity, and neither is the launcher that names the harness in its own arguments", () => {
  // KILLED BY: matching case-insensitively (the application root differs
  // from the harness binary only in case), and by testing the WHOLE
  // command line instead of the program (the launcher's arguments name
  // the harness's own directory). Two live harness processes were
  // measured on this machine at 2026-09-02 — 3414 and 65005 — and BOTH
  // descend from application root 2295: a walk that climbed one hop too
  // far would hand two concurrent sessions ONE identity, and this guard
  // could then never fire.
  expect(isHarnessProcess(HARNESS_CMD), "the harness binary is the harness").toBe(true);
  expect(isHarnessProcess(APP_ROOT_CMD), "the shared application root is not").toBe(false);
  expect(isHarnessProcess(LAUNCHER_CMD), "nor is the launcher above it").toBe(false);
  expect(
    programOf(HARNESS_CMD),
    "and the program is read whole, spaces in the path included",
  ).toBe(
    "/Users/ujju/Library/Application Support/Claude/claude-code/2.1.255/claude.app/Contents/MacOS/claude",
  );
  // THE POSITIVE CONTROL FOR THE CASE RULE, in the same breath: the two
  // differ by exactly one character's case, so a matcher that answered
  // the same for both would be caught here rather than in production.
  expect(path.basename(programOf(APP_ROOT_CMD)).toLowerCase()).toBe(
    path.basename(programOf(HARNESS_CMD)),
  );
});

test("a chain with no harness in it answers NOTHING, naming what it walked, and never guesses a seat", () => {
  // KILLED BY: falling back to the topmost ancestor, which is stable and
  // NOT distinguishable — the failure this whole derivation is shaped
  // around. Three verdicts, never two: the callers ANNOUNCE an
  // unanswered question and refuse on none.
  const rows: PsRow[] = [
    { pid: 10, ppid: 1, startedAt: "Tue Sep 1 10:00:00 2026", command: "/sbin/launchd" },
    { pid: 11, ppid: 10, startedAt: "Tue Sep 1 10:00:01 2026", command: "/bin/zsh" },
    { pid: 12, ppid: 11, startedAt: "Tue Sep 1 10:00:02 2026", command: "node /x/brief.mjs" },
  ];
  const got = sessionIdentity({ pid: 12, readProcess: chain(rows) });
  expect(got.ok).toBe(false);
  if (got.ok) return;
  expect(got.why, "it names the processes it walked").toContain("launchd");
  expect(got.why, "and says the derivation is about one harness").toContain("harness");

  // ── THE CI RUNNER, WHICH IS THE MACHINE THIS IS TRUE OF (T-237-s8) ──
  // Not a hypothetical ancestry: a GitHub runner's job runs `node` under
  // `bash` under `Runner`, and on 2026-09-02 that difference reddened
  // main through a body that armed the guard from the real process tree.
  // It is DRIVEN THROUGH THE INJECTED READER rather than through the
  // machine this suite happens to run on, which is that incident's own
  // standing lesson — a body that measured the host would be vacuous
  // here and green everywhere.
  const runner: PsRow[] = [
    { pid: 1, ppid: 0, startedAt: "Tue Sep 1 09:00:00 2026", command: "/sbin/init" },
    { pid: 300, ppid: 1, startedAt: "Tue Sep 1 09:00:01 2026", command: "/home/runner/Runner.Listener run" },
    { pid: 301, ppid: 300, startedAt: "Tue Sep 1 09:00:02 2026", command: "/bin/bash -e /home/runner/work/_temp/x.sh" },
    { pid: 302, ppid: 301, startedAt: "Tue Sep 1 09:00:03 2026", command: "node /w/tools/e2e/scripts/brief.mjs" },
  ];
  const onRunner = sessionIdentity({ pid: 302, readProcess: chain(runner) });
  expect(onRunner.ok, "a runner's chain carries no harness, so nothing is claimed").toBe(false);
  if (!onRunner.ok) {
    expect(onRunner.why, "and it names what it walked, runner and all").toContain("Runner.Listener");
    expect(onRunner.why, "saying the runner is where this is the ordinary answer").toContain(
      "CI RUNNER",
    );
  }

  // THE POSITIVE CONTROL, IN THIS BODY: the same reader, one row
  // different — a harness in the chain — and the derivation answers.
  // Without it every assertion above is satisfied by a `sessionIdentity`
  // that answers `ok: false` for everything, which is the shape a
  // never-firing guard has.
  const derivable: PsRow[] = [
    ...runner.slice(0, 2),
    { pid: 301, ppid: 300, startedAt: "Tue Sep 1 09:00:02 2026", command: HARNESS_CMD },
    { pid: 302, ppid: 301, startedAt: "Tue Sep 1 09:00:03 2026", command: "node /w/tools/e2e/scripts/brief.mjs" },
  ];
  const local = sessionIdentity({ pid: 302, readProcess: chain(derivable) });
  expect(local.ok, "the SAME walk over an ancestry that has one does derive").toBe(true);
  if (local.ok) expect(local.identity.pid, "and it is the harness, not the runner").toBe(301);
});

test("the identity's refusal cites only names this module really exports, so a citation cannot dangle", () => {
  // T-238-s1, ITEM 1. The refusal read *"see HARNESS_ARGV0_BASENAME"* and
  // no such symbol has ever existed here: a reader who followed the one
  // pointer a user-facing refusal offers found nothing. A citation is
  // cheap to write and free to rot, so this body makes it MECHANICAL —
  // every SHOUTED_SNAKE token in the sentence must be a name this module
  // exports.
  //
  // KILLED BY: citing any name the module does not export, which is
  // exactly the state this repairs.
  const rows: PsRow[] = [
    { pid: 20, ppid: 1, startedAt: "Tue Sep 1 10:00:00 2026", command: "/sbin/launchd" },
    { pid: 21, ppid: 20, startedAt: "Tue Sep 1 10:00:01 2026", command: "node /x/brief.mjs" },
  ];
  const got = sessionIdentity({ pid: 21, readProcess: chain(rows) });
  expect(got.ok).toBe(false);
  if (got.ok) return;

  // The needle is a SHAPE — a run of capitals carrying an underscore —
  // so ordinary shouted prose (NOTHING, ONE) is not a citation and a
  // renamed constant is. `\b` on both ends keeps a name out of a longer
  // token.
  const cited = [...got.why.matchAll(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g)].map((m) => m[0]);
  expect(cited.length, "the refusal cites at least one symbol, or this body proves nothing").toBeGreaterThan(0);
  const exported = Object.keys(currency);
  for (const name of cited) {
    expect(exported, `the refusal cites ${name}, and this module exports it`).toContain(name);
  }

  // THE SEARCH IS SHOWN CAPABLE OF FAILING BEFORE ITS ZERO IS WRITTEN
  // DOWN (docs/CONVENTIONS.md's proof clause): the same extractor over
  // the sentence AS IT STOOD finds the dangling name, and the same
  // membership test rejects it. Without this half, an extractor that
  // matched nothing would pass the loop above vacuously.
  const asItStood =
    "The identity derivation is a fact about ONE harness — see HARNESS_ARGV0_BASENAME — and it " +
    "answers NOTHING rather than guessing.";
  const before = [...asItStood.matchAll(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g)].map((m) => m[0]);
  expect(before, "the extractor finds the citation that used to be here").toContain(
    "HARNESS_ARGV0_BASENAME",
  );
  expect(exported, "and that name is exported by nothing, which is the defect").not.toContain(
    "HARNESS_ARGV0_BASENAME",
  );
  expect(
    readFileSync(CLI, "utf8"),
    "nor does the file mention it anywhere else",
  ).not.toContain("HARNESS_ARGV0_BASENAME");
  // AND THE DERIVATION'S OWN HEADER IS CITED, not only a constant: the
  // refusal points at the section above `sessionIdentity`, which is the
  // function it is the refusal of.
  expect(got.why, "the refusal names where the derivation is stated").toContain(
    "this file's holder section",
  );
  expect(got.why, "and names the function that section is about").toContain("sessionIdentity");
});

test("liveness is the pid AND its start time, so a recycled pid is a dead holder", () => {
  // KILLED BY: comparing the pid alone. A pid is recycled by the kernel;
  // a pid and its start time are not, and the start-time string is one
  // this project wrote itself so nothing here parses a date.
  const live = processRow(process.pid);
  expect(live, "this process is in the process table").toBeDefined();
  const startedAt = live?.startedAt ?? "";
  expect(
    identityAlive({ pid: process.pid, startedAt, program: "" }),
    "the running process, with the start time it really has",
  ).toBe(true);
  expect(
    identityAlive({ pid: process.pid, startedAt: "Mon Jan 1 00:00:00 2001", program: "" }),
    "the SAME pid with a different start time is a recycled pid, which is a dead holder",
  ).toBe(false);
});

test("0 and -1 are refused as holder pids at the write and at the read, because both answer ALIVE to kill(2)", () => {
  // THE DEMONSTRATION FIRST, because the rule reads as pedantry without
  // it: `process.kill(pid, 0)` is the obvious liveness probe and it
  // SUCCEEDS for 0 (the process group) and for -1 (every process), so a
  // record carrying either would read as a live holder for ever and lock
  // the checkout against every session including the one that wrote it.
  for (const pid of [0, -1]) {
    let threw = false;
    try {
      process.kill(pid, 0);
    } catch {
      threw = true;
    }
    expect(threw, `kill(${pid}, 0) succeeds, which is why this file does not use it`).toBe(false);
    expect(isRecordablePid(pid), `${pid} is not a recordable pid`).toBe(false);
  }
  expect(isRecordablePid(1), "a real pid is").toBe(true);
  expect(isRecordablePid(1.5), "and a non-integer is not").toBe(false);

  const repo = seatFixture("pid-refusal");
  expect(() => writeHolder(repo, { pid: 0, startedAt: "x", program: "" })).toThrow(/not a process/);
  expect(existsSync(path.join(repo, HOLDER_REL_PATH)), "and nothing was written").toBe(false);

  // AND THE READ REFUSES ONE PLANTED BY HAND, so the guard does not rest
  // on one platform's `ps` being careful about those two numbers.
  writeHolder(repo, { pid: 1, startedAt: "Tue Sep 1 00:00:00 2026", program: "" });
  const file = path.join(repo, HOLDER_REL_PATH);
  const planted = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
  (planted["identity"] as Record<string, unknown>)["pid"] = 0;
  writeFileSync(file, JSON.stringify(planted));
  const d = holderVerdict({ root: repo, identity: injected(999, "x") });
  expect(d.state, "an unreadable record is announced, never stepped over as vacant").toBe("unknown");
  expect(d.code).toBe("holder-unreadable");
});

test("the holder record is un-committable by construction, in a repository nobody armed", () => {
  // KILLED BY: writing the record without arming the directory. The
  // fourth acceptance criterion, and it is measured the way `T-203`'s
  // own regression was found: in a repository where NOTHING ran the
  // dispatcher's arming step, because that is the integration checkout's
  // actual state and it is where the token was once committable.
  const repo = seatFixture("uncommittable");
  const before = execFileSync("git", ["-C", repo, "status", "--porcelain"], { encoding: "utf8" });
  expect(before.trim(), "the fixture starts clean, so the control is not degenerate").toBe("");

  const written = writeHolder(repo, { pid: 4242, startedAt: "Tue Sep 1 00:00:00 2026", program: "" });
  expect(existsSync(written.file)).toBe(true);
  const after = execFileSync("git", ["-C", repo, "status", "--porcelain"], { encoding: "utf8" });
  expect(after.trim(), "and git cannot see it, so `git add -A` cannot offer it").toBe("");

  // ONE IGNORE STRING, NOT A THIRD COPY: the file on disk is the string
  // the fence manifest and the verdict token are made un-committable by,
  // imported from its one home.
  expect(readFileSync(written.ignoreFile, "utf8")).toBe(RUNTIME_DIR_IGNORE);
  // THE CONTROL THAT KEEPS THIS FROM BEING VACUOUS: a file beside it
  // that is NOT under the runtime directory IS seen by the same command.
  writeFileSync(path.join(repo, "not-ignored.txt"), "x\n");
  const control = execFileSync("git", ["-C", repo, "status", "--porcelain"], { encoding: "utf8" });
  expect(control, "the same status command does see an ordinary new file").toContain(
    "not-ignored.txt",
  );
});

test("every holder state is reachable in one fixture, and a live OTHER session is the only one that refuses", () => {
  // KILLED BY: any branch collapsing into another — most dangerously
  // `held` into `mine` (which passes the second seat straight through)
  // and `unknown` into `vacant` (which steps over a record it could not
  // read). Six states, one fixture, each reached by changing one thing.
  const repo = seatFixture("states");
  const me = injected(500, "Tue Sep 1 23:52:34 2026");
  const table = chain([
    { pid: 500, ppid: 1, startedAt: "Tue Sep 1 23:52:34 2026", command: HARNESS_CMD },
    { pid: 600, ppid: 1, startedAt: "Tue Sep 1 23:29:18 2026", command: HARNESS_CMD },
  ]);
  const ask = () => holderVerdict({ root: repo, identity: me, readProcess: table });

  expect(ask().state, "no record at all").toBe("vacant");

  writeHolder(repo, me.identity);
  expect(ask().state, "the record names this session").toBe("mine");

  writeHolder(repo, { pid: 600, startedAt: "Tue Sep 1 23:29:18 2026", program: "/x/claude" });
  const held = ask();
  expect(held.state, "the record names a DIFFERENT session that is running").toBe("held");
  expect(held.code).toBe("holder-live-elsewhere");
  expect(held.detail, "and the refusal carries the remedy").toContain("--take-seat");

  writeHolder(repo, { pid: 700, startedAt: "Tue Sep 1 20:00:00 2026", program: "/x/claude" });
  expect(ask().state, "a pid the table does not carry is a session that has gone").toBe("dead");

  writeFileSync(path.join(repo, HOLDER_REL_PATH), "{ not json");
  expect(ask().state, "a record that will not parse is an inability, not a pass").toBe("unknown");

  removeHolder(repo);
  execFileSync("git", ["-C", repo, "checkout", "-q", "-b", "task/T-999-a-lane"], { stdio: "pipe" });
  const lane = ask();
  expect(lane.state, "a lane does not hold a seat").toBe("not-integration");
  expect(lane.code, "and it is the LANE's code, not the branchless one").toBe(
    HOLDER_CODES.NOT_INTEGRATION,
  );
  expect(lane.detail, "and the arm SAYS so rather than skipping silently").toContain(
    "not the integration checkout",
  );

  expect(
    HOLDER_STATES.slice().sort(),
    "and the frozen list is exactly the states the branches produce",
  ).toEqual(["dead", "held", "mine", "not-integration", "unknown", "vacant"]);
});

test("a DETACHED checkout holds no seat, and it is its own answer rather than the lane's silence", () => {
  // T-238-s1, ITEM 4. `isIntegrationCheckout` decides by the checked-out
  // REF, so a detached checkout sitting at the integration branch's own
  // TIP is not that checkout — and every arm passed over it in the same
  // silence a lane gets, which is correct for a lane (rule 4: a lane
  // holds no seat, and a line on every lane push is noise) and wrong
  // here: a seat working detached in the integration tree takes no seat,
  // is refused by nothing, and appears nowhere.
  //
  // KILLED BY: collapsing the two codes back into one — which is the
  // state this repairs, and which the LANE half below would still pass.
  const repo = seatFixture("detached");
  const me = injected(500, "Tue Sep 1 23:52:34 2026");
  const onBranch = holderVerdict({ root: repo, identity: me });
  expect(onBranch.state, "the precondition: on its branch this fixture IS the seat").toBe("vacant");

  const tip = execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  execFileSync("git", ["-C", repo, "checkout", "--quiet", "--detach", tip], { stdio: "pipe" });
  expect(
    execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    "and detaching moved NOTHING but the ref: same commit, same tree",
  ).toBe(tip);

  const d = holderVerdict({ root: repo, identity: me });
  expect(d.state, "a detached checkout is not the integration checkout").toBe("not-integration");
  expect(d.code, "and it says which kind of not-integration it is").toBe(HOLDER_CODES.NO_BRANCH);
  expect(d.detail, "naming the condition").toContain("NO BRANCH");
  expect(d.detail, "and the consequence a seat needs to hear").toContain("UNRECORDED");
  expect(d.figures["headRef"], "with the ref it read, which is none").toBe(null);

  // AND THE TWO CODES ARE NOT INTERCHANGEABLE, which is the whole of the
  // repair: a LANE reaches the other one, in this same fixture, one
  // checkout apart. Without this half a single code would satisfy every
  // assertion above.
  execFileSync("git", ["-C", repo, "checkout", "--quiet", "-b", "task/T-999-a-lane"], {
    stdio: "pipe",
  });
  expect(holderVerdict({ root: repo, identity: me }).code, "a lane's is the other code").toBe(
    HOLDER_CODES.NOT_INTEGRATION,
  );
  expect(
    Object.values(HOLDER_CODES).filter((c) => c === HOLDER_CODES.NO_BRANCH).length,
    "and the frozen list carries it exactly once",
  ).toBe(1);
});

test("the record's own probe tells ENOENT from every other errno, so a file that IS there is never read as a vacant seat", () => {
  // T-238-s1, taking T-216-s8's ATTRIBUTION. `readHolder` opened with
  // `existsSync`, which answers FALSE for EMFILE and EACCES exactly as it
  // does for ENOENT — so under the descriptor pressure of several
  // concurrent suites a record that WAS there read as `{ absent: true }`,
  // `holderVerdict` answered VACANT, and the guard's silent allow became
  // a verdict about a seat nobody had asked about. That is the one shape
  // this project's guards may not have.
  //
  // KILLED BY: going back to `existsSync`, or by treating every errno as
  // an absence.
  const repo = seatFixture("errno");
  const me = injected(500, "Tue Sep 1 23:52:34 2026");

  // ENOENT, WHICH IS THE ONLY ABSENCE: no record at all.
  expect(holderVerdict({ root: repo, identity: me }).state, "genuinely absent is VACANT").toBe(
    "vacant",
  );

  // AND A REAL RECORD THAT CANNOT BE OPENED. `chmod 000` produces EACCES
  // on the OPEN, which is the errno class the incident is about; the
  // record is BUILT the way the producer builds it, so nothing here is a
  // file that merely looks similar.
  writeHolder(repo, { pid: 4242, startedAt: "Tue Sep 1 00:00:00 2026", program: "/x/claude" });
  const file = path.join(repo, HOLDER_REL_PATH);
  chmodSync(file, 0o000);
  try {
    const denied = holderVerdict({ root: repo, identity: me });
    expect(denied.state, "a record it could not READ is an inability, never a vacancy").toBe(
      "unknown",
    );
    expect(denied.code).toBe(HOLDER_CODES.UNREADABLE);
    expect(denied.detail, "and the errno is in the sentence, so the next reader attributes it").toContain(
      "EACCES",
    );
    expect(denied.figures["holderFile"], "the figure says a file was found, not that none was").toBe(
      true,
    );
  } finally {
    chmodSync(file, 0o644);
  }

  // THE POSITIVE CONTROL: the SAME file, the SAME reader, mode restored —
  // so the refusal above was about the open and not about the record.
  const readable = holderVerdict({ root: repo, identity: me });
  expect(readable.state, "the same bytes readable again are an ordinary dead holder").toBe("dead");
});

test("the DEAD holder is proved with a pid that genuinely does not exist, and the live one with a pid that does", () => {
  // THE ONE BODY THAT SPENDS THE REAL PROCESS TABLE, on the two facts a
  // fixture cannot fake. The dead pid is REAPED rather than invented: a
  // process that ran and exited leaves a pid the kernel really has
  // finished with, where a large number can be rejected by `ps` for
  // being large and prove nothing about a dead process.
  const reaped = spawnSync("sh", ["-c", "exit 0"]);
  const deadPid = reaped.pid;
  expect(typeof deadPid, "the reaped child had a pid").toBe("number");
  expect(processRow(deadPid as number), "and it is gone from the table").toBeUndefined();

  const repo = seatFixture("real-liveness");
  const me = injected(500, "Tue Sep 1 23:52:34 2026");

  writeHolder(repo, { pid: deadPid as number, startedAt: "Tue Sep 1 00:00:00 2026", program: "" });
  const dead = holderVerdict({ root: repo, identity: me });
  expect(dead.state, "a genuinely dead holder frees the seat").toBe("dead");
  expect(dead.detail, "and the takeover names whose record it was").toContain(String(deadPid));

  const live = processRow(process.pid);
  writeHolder(repo, { pid: process.pid, startedAt: live?.startedAt ?? "", program: "" });
  const held = holderVerdict({ root: repo, identity: me });
  expect(held.state, "and a genuinely live one holds it").toBe("held");
});

/**
 * A checkout `brief.mjs` will run in — the governing documents and the
 * whole of `method/`, copied rather than invented.
 *
 * `context()` reads the lane spellings out of docs/CONVENTIONS.md's own
 * bullet, the read-first set out of the root adapter, and the row set out
 * of the role file's normative table, so a `--release-seat` body needs
 * those on disk. They are COPIED for the reason `card-preflight.spec.ts`
 * copies the same set one card over: a hand-written stand-in is a second
 * copy of the text these commands exist to derive against.
 *
 * It is an ORDINARY repository on the integration branch and NOT a
 * worktree of this one — a seat fixture writes and deletes a holder
 * record, which is the one file the host's own seat is decided by.
 */
function briefSeatFixture(name: string): string {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), `T-238-s1-seat-${name}-`)));
  SCRATCH.push(root);
  const repo = path.join(root, "repo");
  mkdirSync(repo, { recursive: true });
  execFileSync("git", ["init", "-q", "-b", DEFAULT_INTEGRATION_REF, repo], { stdio: "pipe" });
  for (const rel of ["docs/CONVENTIONS.md", "docs/ARCHITECTURE.md", "docs/ROADMAP.md"]) {
    mkdirSync(path.dirname(path.join(repo, rel)), { recursive: true });
    execFileSync("cp", [path.join(repoRoot, rel), path.join(repo, rel)], { stdio: "pipe" });
  }
  for (const rel of ["CLAUDE.md", "AGENTS.md"]) {
    execFileSync("cp", [path.join(repoRoot, rel), path.join(repo, rel)], { stdio: "pipe" });
  }
  cpSync(path.join(repoRoot, "method"), path.join(repo, "method"), { recursive: true });
  execFileSync(
    "git",
    ["-C", repo, ...NO_BACKGROUND_MAINTENANCE, "-c", "user.email=fixture@example.invalid",
      "-c", "user.name=T-238-s1 fixture", "add", "-A"],
    { stdio: "pipe" },
  );
  execFileSync(
    "git",
    ["-C", repo, ...NO_BACKGROUND_MAINTENANCE, "-c", "user.email=fixture@example.invalid",
      "-c", "user.name=T-238-s1 fixture", "commit", "-qm", "Checkpoint: fixture base"],
    { stdio: "pipe" },
  );
  return repo;
}

test("`--release-seat` REFUSES a record it could not read, and removes nothing", () => {
  // T-238-s1, ITEM 2. The arm removed the file and printed *"THE SEAT —
  // RELEASED. The next session to arm this checkout takes it unopposed"*.
  // Neither half was true: nothing had established the seat was free, and
  // the one piece of evidence about whose it was is what got deleted. The
  // branch that was supposed to catch this tested
  // `figures.holderAlive === true`, which is set only once the record has
  // PARSED — so the unreadable case walked straight past it.
  //
  // KILLED BY: dropping the new branch, which puts the record back on the
  // release path; and by refusing WITHOUT leaving the file, which is the
  // same harm with a better sentence.
  const repo = briefSeatFixture("release-unreadable");
  const file = path.join(repo, HOLDER_REL_PATH);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, "{ not json");

  const run = runBrief(["--release-seat", "--root", repo], undefined, repo);
  expect(run.status, "a finding, not a clean release").toBe(EXIT.FOUND);
  expect(run.out, "and it says the seat was NOT released").toContain("THE SEAT — NOT RELEASED");
  expect(run.out, "never the sentence it used to print").not.toContain("THE SEAT — RELEASED");
  expect(run.err, "the refusal reaches the summary a seat reads").toContain(
    "refused an unreadable",
  );
  expect(run.err, "with the reason, so it is actionable").toContain("did not parse");
  expect(existsSync(file), "AND THE RECORD IS STILL THERE — the point of the refusal").toBe(true);

  // THE POSITIVE CONTROL, in the same fixture: a record this reader CAN
  // read, naming a session that is gone, IS released — so the refusal
  // above is about the shape and not about this arm having stopped
  // working. Without it, an arm that refused everything would pass.
  writeFileSync(
    file,
    `${JSON.stringify(
      {
        version: 1,
        identity: { pid: 999999, startedAt: "Tue Sep 1 00:00:00 2026", program: "/x/claude" },
        checkout: repo,
        takenAt: "2026-09-01T00:00:00Z",
        host: "fixture",
      },
      null,
      2,
    )}\n`,
  );
  const released = runBrief(["--release-seat", "--root", repo], undefined, repo);
  expect(released.status, "a readable record releases cleanly").toBe(EXIT.CLEAN);
  expect(released.out).toContain("THE SEAT — RELEASED");
  expect(existsSync(file), "and that one is gone").toBe(false);
});

test("the identity derivation is named in the artifact's own header, with the harness it is a fact about", () => {
  // The card's third criterion: ONE function, with the harness named in
  // the file's own header. NARROW HAYSTACK AND AN ANCHOR, per the shape
  // eight remedy — the section heading is asserted UNIQUE first, and the
  // needles are looked for only between it and the end of that comment.
  const source = readFileSync(
    path.join(repoRoot, "tools", "e2e", "scripts", "checkout-currency.mjs"),
    "utf8",
  );
  const anchor = "THE HOLDER OF THE INTEGRATION CHECKOUT (T-238)";
  expect(source.split(anchor).length - 1, "the section heading is unique").toBe(1);
  const from = source.indexOf(anchor);
  // COLLAPSED, AND THAT IS NOT TIDINESS. docs/CONVENTIONS.md's third
  // cause of a false miss is A HARD WRAP ACROSS THE PHRASE: this file is
  // wrapped at about 76 columns, so a two-word needle is a search for a
  // line break somebody else chose, and the wrap point moves with every
  // reflow. Written raw, this body failed on exactly that — over the
  // phrase naming the harness, which is the one thing it exists to find.
  const section = source
    .slice(from, source.indexOf("*/", from))
    .replace(/^\s*\*\s?/gm, "")
    .replace(/\s+/g, " ");
  expect(section, "the harness is NAMED, not implied").toContain("CLAUDE CODE");
  expect(section, "and the one function is named").toContain("sessionIdentity");
  expect(section, "with the measurement that it is stable across tool calls").toContain("STABLE");
  expect(section, "and distinguishable between concurrent sessions").toContain("DISTINGUISHABLE");
  expect(section, "and that a subagent shares its session's harness").toContain("SUBAGENT");

  // ── T-238-s1, ITEM 3: THE PREMISE IS THE MEASUREMENT ────────────────
  // The header opened *"A Bash tool call carries no session id"*, and
  // that was false as measured: `CLAUDE_CODE_SESSION_ID` and `CLAUDE_PID`
  // ARE exported to a tool shell and only `CLAUDE_PROJECT_DIR` is not.
  // The section must carry the measurement AND the reasons the ancestry
  // is still the instrument, because a header that merely dropped the
  // wrong sentence would leave the choice of instrument unargued.
  expect(section, "the variables that ARE exported are named").toContain("CLAUDE_CODE_SESSION_ID");
  expect(section, "including the one that names the very process this walks to").toContain(
    "CLAUDE_PID",
  );
  expect(section, "and the one that is not, which is the half that was right").toContain(
    "CLAUDE_PROJECT_DIR",
  );
  expect(section, "the reading carries the date it was taken at").toContain("2026-09-09");
  expect(section, "and the ancestry is argued rather than assumed").toContain(
    "THE ANCESTRY IS STILL THE INSTRUMENT",
  );
  // AND THE FALSE PREMISE IS NOT ASSERTED ANY MORE — which is a narrower
  // claim than ABSENT, and deliberately so: the header QUOTES the old
  // sentence in order to retract it, and a body demanding the words be
  // gone would push the next editor into deleting the record of the
  // mistake. So the phrase must occur EXACTLY ONCE and that occurrence
  // must sit inside the retraction (shape eight's remedy: narrow the
  // haystack to the sentence, anchor on something that is not the
  // needle).
  const premise = "carries no session id";
  expect(section.split(premise).length - 1, "the premise appears exactly once").toBe(1);
  const around = section.slice(
    Math.max(0, section.indexOf(premise) - 200),
    section.indexOf(premise) + 200,
  );
  expect(around, "and it is quoted only to be retracted").toContain("FALSE AS MEASURED");
  // THE ANCHOR IS SHOWN CAPABLE OF FAILING: the same window test over the
  // sentence as it STOOD — the premise with no retraction near it — does
  // not find the anchor, so the assertion above is a measurement rather
  // than a needle that matches anything it is pointed at.
  expect(
    "A Bash tool call carries no session id — it is a short-lived shell, and CLAUDE_PROJECT_DIR " +
      "is not exported to it either",
    "the text this replaced carried the premise and no retraction",
  ).not.toContain("FALSE AS MEASURED");

  // ── T-237-s8: THE LIMITS' HOME IS HERE, AND THE CONSUMER POINTS ─────
  // The runner is the ONE machine where nothing derives at all, and the
  // pointer in `push-guard.mjs` promised limits this list did not carry.
  // One home, one pointer, and a body that reads both files so the pair
  // cannot drift back apart.
  expect(section, "the runner is named where the limits live").toContain("CI RUNNER");
  expect(section, "with the ancestry that makes it so").toContain("node <- bash <- Runner");
  expect(section, "and what the callers do there").toContain("ANNOUNCE AND ALLOW");
  expect(section, "and the detached checkout, which is the same kind of limit").toContain(
    "A DETACHED CHECKOUT HOLDS NO SEAT",
  );

  const consumer = readFileSync(
    path.join(repoRoot, ".claude", "hooks", "push-guard.mjs"),
    "utf8",
  );
  const pointerAnchor = "THE LIMITS ARE THE IDENTITY'S AND THEY ARE STATED WHERE IT IS DERIVED";
  expect(consumer.split(pointerAnchor).length - 1, "the pointer is unique in the consumer").toBe(1);
  const pointer = consumer
    .slice(consumer.indexOf(pointerAnchor), consumer.indexOf("*/", consumer.indexOf(pointerAnchor)))
    .replace(/^\s*\*\s?/gm, "")
    .replace(/\s+/g, " ");
  expect(pointer, "the consumer points at the file that owns them").toContain(
    "checkout-currency.mjs",
  );
  expect(pointer, "names the runner as one of the limits it is pointing AT").toContain("CI RUNNER");
  expect(
    pointer,
    "and does NOT restate the ancestry, which is the drift this repairs",
  ).not.toContain("bash");
  expect(
    pointer,
    "while what THIS arm does there stays here, because that is the consumer's own fact",
  ).toContain("ALLOWS");
});
