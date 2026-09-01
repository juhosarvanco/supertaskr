import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  ANNOUNCED_ALLOW_CODES,
  CHECK_ARGV,
  CHECK_DIR_REL_PATH,
  CHECK_EXIT,
  GIT_GLOBAL_OPTS_WITH_VALUE,
  GRAPH_REL_PATH,
  INDEX_CRATE_MANIFEST_REL_PATH,
  NON_PUSHING_FLAGS,
  commandOf,
  decide,
  gitInvocations,
  isPush,
  laneCanRegenerate,
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
import { repoRoot } from "../preflight";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import { conventionsBullet, conventionsText } from "../scripts/docs-scan.mjs";

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
 * The REAL `cargo run -p nputer-index -- index --check`. Two reasons,
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

/** A `cargo` shim: records that it ran, prints `report`, exits `code`. */
function writeCargoShim(root: string, code: number, report: string): string {
  const bin = path.join(root, "bin");
  mkdirSync(bin, { recursive: true });
  const marker = path.join(root, "cargo-was-run.txt");
  writeFileSync(
    path.join(bin, "cargo"),
    `#!/bin/sh\nprintf '%s\\n' "$*" >> ${JSON.stringify(marker)}\n` +
      `cat <<'REPORT'\n${report}\nREPORT\nexit ${code}\n`,
    { mode: 0o755 },
  );
  return marker;
}

/** A report shaped like the real check's STALE render (`check.rs`, `render`). */
const STALE_REPORT =
  "[nputer-index] graph.json is STALE - the committed graph does not match a fresh index of this tree\n" +
  "[nputer-index]   committed:   1143153 bytes · 199 files · 2436 symbols · 2351 edges\n" +
  "[nputer-index]   fresh index: 1143999 bytes · 200 files · 2440 symbols · 2355 edges\n" +
  "[nputer-index]   ~ app/src/lib/agent-store.ts\n" +
  "[nputer-index]\n" +
  "[nputer-index]   regenerate: nputer-index index --root ../..";

/** A report shaped like the real check's CURRENT render. */
const CURRENT_REPORT =
  "[nputer-index] graph.json is CURRENT - ../../docs/architecture/graph.json matches a fresh index " +
  "(1143153 bytes, 199 files, 2436 symbols, 2351 edges)";

interface Fixture {
  root: string;
  marker: string;
  /** A bare repository this fixture's `origin` points at. */
  remote: string;
  /** The local commit that has NOT reached `remote` yet. */
  unpushed: string;
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
 * `nputer: false` builds the same repository WITHOUT the indexer crate,
 * which is the sixth criterion's other side: a checkout that is not this
 * repository's.
 */
function fixture(
  name: string,
  code: number,
  report: string,
  opts: { nputer?: boolean; branch?: string; fence?: string[]; token?: TokenState } = {},
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
  if (opts.nputer !== false) {
    mkdirSync(path.dirname(path.join(root, INDEX_CRATE_MANIFEST_REL_PATH)), { recursive: true });
    writeFileSync(path.join(root, INDEX_CRATE_MANIFEST_REL_PATH), '[package]\nname = "nputer-index"\n');
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
  writeFileSync(path.join(root, ".gitignore"), "bin/\ncargo-was-run.txt\n.nputer/\nremote.git/\n");
  git("add", "-A");
  git("commit", "-qm", "fixture");

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
  writeFileSync(path.join(root, "README.md"), "fixture, second commit\n");
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
  return { root, remote, unpushed, marker: writeCargoShim(root, code, report) };
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
 */
function runWiredHook(fx: Fixture, command: string): { status: number | null; stderr: string } {
  const settings = JSON.parse(
    readFileSync(path.join(repoRoot, ".claude", "settings.json"), "utf8"),
  ) as { hooks: { PreToolUse: { matcher: string; hooks: { command: string }[] }[] } };
  const entry = settings.hooks.PreToolUse.find((h) => new RegExp(`^(${h.matcher})$`).test("Bash"));
  if (entry === undefined) throw new Error("no PreToolUse entry whose matcher matches `Bash`");
  const wired = entry.hooks.map((h) => h.command).join(" && ");
  const out = spawnSync("sh", ["-c", wired], {
    input: JSON.stringify({ tool_name: "Bash", tool_input: { command }, cwd: fx.root }),
    encoding: "utf8",
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: repoRoot,
      PATH: `${path.join(fx.root, "bin")}${path.delimiter}${process.env["PATH"] ?? ""}`,
    },
  });
  return { status: out.status, stderr: String(out.stderr ?? "") };
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
      env: { ...process.env, PATH: `${path.join(fx.root, "bin")}${path.delimiter}${process.env["PATH"] ?? ""}` },
    },
  );
  return { status: out.status, stderr: String(out.stderr ?? "") };
}

/** Did the shim run? */
function checkWasSpawned(fx: Fixture): boolean {
  return existsSync(fx.marker);
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
  expect(stderr).toContain("regenerate: nputer-index index --root ../..");
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
  const fx = fixture("could-not-run", CHECK_EXIT.COULD_NOT_RUN, "[nputer-index] the gate could not run");
  const { status, stderr } = runHook(fx, "git push");
  expect(checkWasSpawned(fx)).toBe(true);
  expect(status, "a check that could not run must never refuse").toBe(0);
  expect(stderr).toContain("THE GRAPH WAS NOT ASKED");
});

test("exit 2 allows the push and is named as `called wrong`, never stale", () => {
  const fx = fixture("usage", CHECK_EXIT.USAGE, "[nputer-index] usage");
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
  const fx = fixture("not-nputer", CHECK_EXIT.STALE, STALE_REPORT, { nputer: false });
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
  expect([...ANNOUNCED_ALLOW_CODES].sort()).toEqual([
    "check-could-not-run",
    "check-inconclusive",
    "landing-gate-cannot-compare",
    "lane-fence-unreadable",
    "no-command-to-read",
  ]);
  // Announced: the check answered a code that is not a verdict.
  const spoke = fixture("announced", CHECK_EXIT.COULD_NOT_RUN, "[nputer-index] no");
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
  expect(staleRun.stderr).toContain("regenerate: nputer-index index --root ../..");

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
  writeFileSync(path.join(root, INDEX_CRATE_MANIFEST_REL_PATH), '[package]\nname = "nputer-index"\n');
  writeFileSync(path.join(root, ".gitignore"), "bin/\ncargo-was-run.txt\n.nputer/\nremote.git/\n");

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
  return { root, remote, unpushed, card, marker: writeCargoShim(root, CHECK_EXIT.CURRENT, CURRENT_REPORT) };
}

/* ───────────── the token's own contract ─────────────────────────── */

test("writeToken makes its own token un-committable in a repository NOBODY armed", () => {
  // THE CARD'S FIRST DECISION, AND THE BODY THAT REPLACES ONE THAT WAS
  // GREEN BY CONSTRUCTION.
  //
  // The first version of this assertion asked `git check-ignore` in
  // `repoRoot` — a LANE WORKTREE, where the dispatcher had already
  // written `.nputer/.gitignore` at arm time. So it passed without
  // `writeToken` doing anything, and no mutant of `gate-token.mjs` could
  // red it. Worse, on a fresh clone the subject and its own negative
  // control BOTH returned 1: a control that degenerates to its subject,
  // which is the one outcome a control exists to exclude. A verifier
  // reproduced `?? .nputer/` and `git add -A` offering the token.
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

  // THE PRECONDITION, ASSERTED: nothing here ignores `.nputer/` yet. This
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
  writeFileSync(path.join(root, INDEX_CRATE_MANIFEST_REL_PATH), '[package]\nname = "nputer-index"\n');
  expect(headTree(root), "the precondition: git names no tree here").toBeUndefined();

  const decision = decide(
    { toolName: "Bash", toolInput: { command: "git push" }, cwd: root },
    () => ({ status: CHECK_EXIT.CURRENT, stdout: CURRENT_REPORT, stderr: "" }),
    () => ({ status: 0, stdout: "", stderr: "" }),
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

test("the guard is wired into .claude/settings.json on the Bash matcher", () => {
  const settings = JSON.parse(
    readFileSync(path.join(repoRoot, ".claude", "settings.json"), "utf8"),
  ) as { hooks: { PreToolUse: { matcher: string; hooks: { command: string }[] }[] } };
  const bash = settings.hooks.PreToolUse.find((h) => h.matcher === "Bash");
  expect(bash, "no Bash matcher: the guard is code nothing calls").toBeDefined();
  expect(bash?.hooks.map((h) => h.command).join(" ")).toContain("push-guard-hook.mjs");
  // The fence hook's own matcher is untouched by this card.
  expect(settings.hooks.PreToolUse.some((h) => h.matcher === "Edit|Write|NotebookEdit")).toBe(true);
});
