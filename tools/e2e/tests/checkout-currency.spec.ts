import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  DEFAULT_INTEGRATION_REF,
  EXIT,
  GUARD_SURFACE,
  SETTINGS_REL_PATH,
  STALE_CLONE_LIMIT,
  defaultVantage,
  exitFor,
  hookScriptsIn,
  hooksFor,
  judge,
  matcherSelects,
  registrationOf,
  render,
} from "../scripts/checkout-currency.mjs";
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
  const root = mkdtempSync(path.join(os.tmpdir(), `T-216-s1-${name}-`));
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
  const ancestor = spawnSync(
    "git",
    ["-C", fx.repo, "merge-base", "--is-ancestor", fx.staleHead, fx.tip],
    { encoding: "utf8" },
  );
  expect(ancestor.status, "the stale HEAD IS an ancestor of the tip — as 4ec229c was of main").toBe(
    0,
  );
  const behind = Number(
    execFileSync("git", ["-C", fx.repo, "rev-list", "--count", `${fx.staleHead}..${fx.tip}`], {
      encoding: "utf8",
    }).trim(),
  );
  expect(behind, "and it is genuinely behind").toBeGreaterThan(0);
  const containsGuard = spawnSync(
    "git",
    ["-C", fx.repo, "merge-base", "--is-ancestor", fx.guardCommit, fx.staleHead],
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
