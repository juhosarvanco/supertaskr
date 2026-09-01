import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  CARD_FILE_RE,
  INTEGRATION_BRANCH,
  expandTouches,
  judgePaths,
  laneCardIds,
  integrationRefCandidates as hookCandidates,
  touchesTokens,
} from "../../../.claude/hooks/landing-gate.mjs";
import { frontmatterLineOf, touchesLineOf, within } from "../../../.claude/hooks/lane-fence.mjs";
import { GREEN, REQUIRED_SUITES, writeToken } from "../../../.claude/hooks/gate-token.mjs";
import { integrationRefCandidates, laneSpellings } from "../scripts/dispatch-brief.mjs";
import { conventionsText } from "../scripts/docs-scan.mjs";
import { loadParser } from "../scripts/dispatch-order.mjs";
import { repoRoot } from "../preflight";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";

/**
 * THE LANDING GATE (T-212) — nothing out-of-fence may LAND, at either
 * moment it could.
 *
 * ── WHAT THIS FILE MEASURES, AND WHY IT IS NOT A DECISION FUNCTION'S
 *    RETURN VALUE ────────────────────────────────────────────────────
 * `T-167-s8`'s three-arm shape, kept: every refusal body makes a REAL
 * out-of-fence commit, drives a REAL `git push` through the command
 * `.claude/settings.json` actually wires, and asserts the REMOTE REF is
 * UNCHANGED afterwards. A guard proved only by the string its decision
 * function returned is a guard proved against itself.
 *
 * ── THE POSITIVE CONTROL IS THE POINT ────────────────────────────────
 * A guard that refuses every push is indistinguishable from one that
 * works, so the first body is REFUSE-THEN-ALLOW inside ONE fixture on ONE
 * armed lane: the same fence, the same wiring, the same remote, and the
 * only thing that changes between the two halves is what was committed.
 * That shape is `T-209`'s and it has the property its author wanted —
 * the mutant that makes the gate see NO changed path reds the control
 * itself, because the refusal half then allows.
 *
 * ── THE CONSTANTS ARE COMPARED AGAINST THEIR AUTHORITIES ─────────────
 * `INTEGRATION_BRANCH` against docs/CONVENTIONS.md's own lane bullet
 * through `laneSpellings`, the module that owns that fact. The
 * integration-ref candidate list against `dispatch-brief.mjs`'s. The card
 * filename pattern against every live card's frontmatter `id:`. The
 * `touches:` reader's one accepted shape against every live card's line.
 * A constant that drifts reds a body by name instead of going quiet.
 */

/** Every scratch root this file made, removed together at the end. */
const SCRATCH: string[] = [];

test.afterAll(() => {
  for (const dir of SCRATCH) removeGitFixture(dir, "landing-gate");
});

interface Fx {
  root: string;
  remote: string;
  /** `task/T-901-lane` — the lane branch this fixture cuts. */
  lane: string;
  /** …as a full ref. */
  laneRef: string;
  /** The card, repository-relative, as committed on the fixture's main. */
  card: string;
  /** The commit the lane was cut at — the base-at-cut the gate must NOT use. */
  cut: string;
}

interface FxOptions {
  /**
   * The `touches:` line's body, verbatim. `null` writes a card with NO
   * `touches:` line at all — the universal set's dual.
   */
  touches?: string | null;
  cardId?: string;
  /** `false` writes NO card at all — a checkout that is not this board. */
  board?: boolean;
}

function git(root: string, ...args: string[]): string {
  return execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], {
    encoding: "utf8",
  });
}

/** A `cargo` shim answering CURRENT, so the graph arm never gates a body here. */
function writeCargoShim(root: string): void {
  const bin = path.join(root, "bin");
  mkdirSync(bin, { recursive: true });
  writeFileSync(
    path.join(bin, "cargo"),
    "#!/bin/sh\necho '[nputer-index] graph.json is CURRENT'\nexit 0\n",
    { mode: 0o755 },
  );
}

/**
 * A repository this guard recognises, with a real bare remote, a card on
 * `main`, and a lane branch cut from it.
 *
 * THE REMOTE IS A BARE REPOSITORY INSIDE THIS FIXTURE'S OWN mkdtemp ROOT.
 * Nothing leaves the machine and no network is touched; what it buys is
 * that "did the push happen?" has a mechanical answer — a ref either
 * moved or it did not — rather than being inferred from an exit code.
 */
function fixture(name: string, opts: FxOptions = {}): Fx {
  const id = opts.cardId ?? "T-901";
  const root = mkdtempSync(path.join(os.tmpdir(), `T-212-${name}-`));
  SCRATCH.push(root);
  execFileSync("git", ["init", "-q", "-b", "main", root], { stdio: "pipe" });
  git(root, "config", "user.email", "fixture@example.invalid");
  git(root, "config", "user.name", "T-212 fixture");

  // What makes this checkout THIS repository's, per push-guard.mjs's own
  // sixth-criterion marker.
  mkdirSync(path.join(root, "app/src-tauri/crates/nputer-index"), { recursive: true });
  writeFileSync(
    path.join(root, "app/src-tauri/crates/nputer-index/Cargo.toml"),
    '[package]\nname = "nputer-index"\n',
  );
  // `remote.git/` is ignored because it lives INSIDE this root, and a BARE
  // repository has no `.git` directory — so without this line `git add -A`
  // stages its ordinary files as blobs and every commit is non-empty for a
  // reason that has nothing to do with the file under test. Measured in
  // push-guard.spec.ts's own fixture, by a poison drill that SURVIVED.
  writeFileSync(path.join(root, ".gitignore"), "bin/\n.nputer/\nremote.git/\n");

  const card = `docs/tasks/${id}-a-fixture-card.md`;
  if (opts.board !== false) {
    mkdirSync(path.join(root, "docs/tasks"), { recursive: true });
    writeCard(root, card, id, opts.touches === undefined ? "[tools/e2e]" : opts.touches);
    // A SECOND, UNRELATED CARD, so "this board carries cards" and "this
    // board carries THIS lane's card" are separable states. Without it,
    // deleting the lane's card empties the board and the two collapse.
    writeCard(root, "docs/tasks/T-900-another-card.md", "T-900", "[method/]");
  }
  for (const rel of ["tools/e2e/kept.txt", ".claude/kept.txt", "docs/ARCHITECTURE.md"]) {
    mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    writeFileSync(path.join(root, rel), "at the cut\n");
  }
  git(root, "add", "-A");
  git(root, "commit", "-qm", "the fixture, on main");

  const remote = path.join(root, "remote.git");
  execFileSync("git", ["init", "-q", "--bare", remote], { stdio: "pipe" });
  git(root, "remote", "add", "origin", remote);
  git(root, "push", "-q", "origin", "refs/heads/main:refs/heads/main");
  // A remote-tracking ref, which is the ONLY thing that can answer "which
  // commits would this push add" for the merge arm.
  git(root, "fetch", "-q", "origin");

  const lane = `task/${id}-lane`;
  const cut = git(root, "rev-parse", "HEAD").trim();
  git(root, "checkout", "-q", "-b", lane);
  git(root, "push", "-q", "origin", `refs/heads/${lane}:refs/heads/${lane}`);
  writeCargoShim(root);
  return { root, remote, lane, laneRef: `refs/heads/${lane}`, card, cut };
}

/**
 * Write a card whose frontmatter `id:` and filename agree, as every live
 * card's does — AND whose placement fields are present, as every live
 * non-suggested card's are.
 *
 * The placement set arrived at T-203 and was not decoration: the pre-push
 * cheap checks read the whole board, and these cards carried `status:
 * building` with none of the four fields `lib/parser/src/task.ts` requires
 * of any status but `suggested` and `parked`. They were cards the parser
 * would refuse, standing in for cards it would not, and the new check
 * found them on its first run against this file.
 */
function writeCard(root: string, rel: string, id: string, touches: string | null): void {
  mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
  writeFileSync(
    path.join(root, rel),
    `---\nid: ${id}\ntitle: a fixture card\nfeature: F-01\nmilestone: 1\n` +
      `priority: 1\nsize: S\nstatus: building\n` +
      (touches === null ? "" : `touches: ${touches}\n`) +
      `---\n\nA card the landing gate reads.\n`,
  );
}

function commit(fx: Fx, files: Record<string, string>, message: string): string {
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(path.join(fx.root, path.dirname(rel)), { recursive: true });
    writeFileSync(path.join(fx.root, rel), content);
  }
  git(fx.root, "add", "-A");
  git(fx.root, "commit", "-qm", message);
  return git(fx.root, "rev-parse", "HEAD").trim();
}

/** What `origin` actually holds for `ref` right now, or `undefined`. */
function remoteRef(fx: Fx, ref: string): string | undefined {
  const out = spawnSync("git", ["-C", fx.remote, "rev-parse", "--verify", "--quiet", ref], {
    encoding: "utf8",
  });
  const value = String(out.stdout ?? "").trim();
  return out.status === 0 && value !== "" ? value : undefined;
}

/**
 * THE HOOK COMMAND `.claude/settings.json` ACTUALLY WIRES, run the way the
 * harness runs it — not a path this file typed. That closes the gap
 * between "the decision module refuses" and "the thing settings.json
 * invokes refuses", which are two different claims and only the second is
 * the guard.
 */
/**
 * SAY THAT THE GATES WERE RUN AGAINST THIS EXACT TREE (T-203).
 *
 * The same hook now carries a THIRD arm: a push whose verdict token is
 * missing or stale is refused before this file's own arm is ever reached.
 * That is not a change to the landing gate — it is a new precondition on
 * every push in this repository, and a fixture that did not express it
 * would be measuring the token arm while reading as though it measured
 * this one.
 *
 * It is written HERE rather than at fixture-build time on purpose: a body
 * commits and then pushes, and the token is keyed by HEAD's TREE, so one
 * planted before those commits would be stale by the time it mattered.
 * Refreshing it at the push is also the honest model of the workflow the
 * guard prescribes — run the battery LAST, then push.
 */
function gatesWereRun(root: string): void {
  writeToken(
    root,
    REQUIRED_SUITES.map((suite) => ({
      suite,
      exit: 0,
      bodies: 7,
      targets: 1,
      verdict: GREEN,
      reason: "ok",
      ref: git(root, "rev-parse", "HEAD").trim(),
    })),
  );
}

function runWiredHook(fx: Fx, command: string): { status: number | null; stderr: string } {
  gatesWereRun(fx.root);
  const settings = JSON.parse(
    readFileSync(path.join(repoRoot, ".claude", "settings.json"), "utf8"),
  ) as { hooks: { PreToolUse: { matcher: string; hooks: { command: string }[] }[] } };
  const entry = settings.hooks.PreToolUse.find((h) => new RegExp(`^(${h.matcher})$`).test("Bash"));
  if (entry === undefined) throw new Error("no PreToolUse entry whose matcher matches `Bash`");
  const out = spawnSync("sh", ["-c", entry.hooks.map((h) => h.command).join(" && ")], {
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
 * The property under test is WHAT REACHES THE REMOTE, never what an exit
 * code was.
 */
function pushThroughGuard(fx: Fx, ref: string): { refused: boolean; stderr: string } {
  const command = `git push origin HEAD:${ref}`;
  const decision = runWiredHook(fx, command);
  if (decision.status === 2) return { refused: true, stderr: decision.stderr };
  git(fx.root, "push", "-q", "origin", `HEAD:${ref}`);
  return { refused: false, stderr: decision.stderr };
}

/* ───────────── the constants, compared against their authorities ─────── */

test("the integration branch this gate reads is docs/CONVENTIONS.md's, not this hook's", () => {
  const published = laneSpellings(conventionsText()).integrationBranch;
  expect(
    INTEGRATION_BRANCH,
    "landing-gate.mjs holds an integration branch the lane bullet does not publish",
  ).toBe(published);
});

test("the integration-ref candidates are dispatch-brief's, spelling for spelling", () => {
  // T-153-s9's measurement: which spelling resolves is a LIVE fact that
  // differs between a push runner and a `pull_request` one. A fourth
  // candidate added to the owning module must red this body rather than
  // leave the hook one spelling short.
  expect(hookCandidates("main")).toEqual(integrationRefCandidates("main"));
  expect(hookCandidates("trunk")).toEqual(integrationRefCandidates("trunk"));
});

test("locating a card by its FILENAME agrees with its frontmatter id, over the whole board", () => {
  const dir = path.join(repoRoot, "docs", "tasks");
  let cards = 0;
  const disagreed: string[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md")) continue;
    cards += 1;
    const text = readFileSync(path.join(dir, name), "utf8");
    const declared = (frontmatterLineOf(text, "id") ?? "").replace(/^id:/, "").trim();
    const named = CARD_FILE_RE.exec(`docs/tasks/${name}`)?.[1];
    if (declared !== named) disagreed.push(`${name}: id=${declared} filename=${String(named)}`);
  }
  expect(cards, "no cards under docs/tasks/ — this body measured nothing").toBeGreaterThan(200);
  expect(disagreed, "a card's filename no longer carries its id, so this gate would fence the wrong card").toEqual([]);
});

test("every live card's `touches:` line is the one shape this gate reads", () => {
  const dir = path.join(repoRoot, "docs", "tasks");
  let declared = 0;
  const unreadable: string[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md")) continue;
    const line = touchesLineOf(readFileSync(path.join(dir, name), "utf8"));
    if (line === undefined) continue;
    declared += 1;
    if ("problem" in touchesTokens(line)) unreadable.push(`${name}: ${line}`);
  }
  expect(declared, "no card declares a `touches:` line").toBeGreaterThan(100);
  // The day a card is written as a block sequence this reds, and the
  // reader is extended DELIBERATELY rather than guessing at the shape.
  expect(unreadable, "a live card's `touches:` is not the flow sequence this gate reads").toEqual([]);
});

test("`touchesLineOf` is `frontmatterLineOf` bound to one field, over every live card", () => {
  const dir = path.join(repoRoot, "docs", "tasks");
  const disagreed: string[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md")) continue;
    const text = readFileSync(path.join(dir, name), "utf8");
    if (touchesLineOf(text) !== frontmatterLineOf(text, "touches")) disagreed.push(name);
  }
  expect(disagreed, "the two frontmatter readers disagree — a second implementation grew").toEqual([]);
});

/* ───────────── the containment rule, imported and not re-derived ─────── */

test("containment is `within`'s, including the case string equality gets wrong", () => {
  const fence = { paths: [".claude"], excluded: [], unusable: [], unfenceable: ["docs/tasks"] };
  // T-209's second control, on a path that EXISTS rather than a
  // placeholder: a DIRECTORY domain against a FILE beneath it.
  const judged = judgePaths(
    [".claude/hooks/lane-fence.mjs", ".claude", ".claudeX/other.mjs", "docs/tasks/T-901-x.md"],
    fence,
  );
  expect(judged.inside).toEqual([".claude/hooks/lane-fence.mjs", ".claude", "docs/tasks/T-901-x.md"]);
  // `.claudeX` shares a string prefix with `.claude` and is NOT inside it.
  expect(judged.outside).toEqual([".claudeX/other.mjs"]);
  for (const rel of judged.inside.filter((p) => !p.startsWith("docs/tasks"))) {
    expect(within(rel, ".claude"), `${rel} disagrees with the imported \`within\``).toBe(true);
  }
});

test("the expansion is the parser's own `expandFence`, answer for answer", async () => {
  const parser = (await loadParser()) as {
    expandFence: (
      task: { touches: string[]; id?: string; file?: string },
      components: unknown[],
    ) => { paths: string[]; excluded: string[]; unusable: string[] };
    UNFENCEABLE_PATHS: readonly string[];
  };
  const cases: string[][] = [
    [".claude", "tools/e2e"],
    ["app-shell"],
    ["docs/architecture/components/", "method/"],
    ["docs/tasks"],
    ["tools/e2e/tests/landing-gate.spec.ts"],
    ["ci"],
    ["app/src/**"],
  ];
  for (const touches of cases) {
    const file = "docs/tasks/T-901-a-fixture-card.md";
    const mine = expandTouches({ touches, id: "T-901", file });
    expect("fence" in mine, `the expander refused ${touches.join(", ")}`).toBe(true);
    const theirs = parser.expandFence({ touches, id: "T-901", file }, []);
    const fence = (mine as { fence: { paths: string[]; excluded: string[]; unusable: string[]; unfenceable: string[] } }).fence;
    expect(fence.paths, `paths differ for ${touches.join(", ")}`).toEqual(theirs.paths);
    expect(fence.excluded, `excluded differ for ${touches.join(", ")}`).toEqual(theirs.excluded);
    expect(fence.unusable, `unusable differ for ${touches.join(", ")}`).toEqual(theirs.unusable);
    expect(fence.unfenceable).toEqual([...parser.UNFENCEABLE_PATHS]);
  }
});

test("a lane branch's card id takes the SUFFIX when the branch carries one", () => {
  // `LANE_BRANCH_RE` captures `(\d+)` only, so reading the id off its
  // capture answers T-153 for an s5 lane — the defect `normaliseTaskId`'s
  // own comment records from the T-153-s5 dispatch, where `--write-fence`
  // stamped the PARENT's fence into the child's lane.
  expect(laneCardIds("refs/heads/task/T-163-s4-lane")).toEqual(["T-163-s4", "T-163"]);
  expect(laneCardIds("refs/heads/task/T-212-lane")).toEqual(["T-212"]);
  expect(laneCardIds("refs/heads/main")).toEqual([]);
});

/* ───────────── the push moment, end to end against a real remote ─────── */

test("THE POSITIVE CONTROL: one armed lane, refused then allowed, remote asserted both ways", () => {
  const fx = fixture("positive-control");
  const before = remoteRef(fx, fx.laneRef);
  expect(before, "the fixture never pushed its lane branch").toBeDefined();

  // ARM ONE — a REAL out-of-fence commit and a REAL push attempt.
  commit(fx, { "docs/ARCHITECTURE.md": "a lane wrote outside its fence\n" }, "outside the fence");
  const refusal = pushThroughGuard(fx, fx.laneRef);
  expect(refusal.refused, "an out-of-fence lane push was not refused").toBe(true);
  expect(refusal.stderr).toContain("docs/ARCHITECTURE.md");
  // ARM THREE — the remote ref is UNCHANGED. Not an exit code: the ref.
  expect(remoteRef(fx, fx.laneRef), "the refused push reached the remote anyway").toBe(before);

  // THE CONTROL, in the SAME body against the SAME armed lane: put the
  // out-of-fence path back and commit inside the fence instead. An allow
  // here cannot be a mechanism that failed to arm — the mechanism just
  // refused, two statements up.
  commit(
    fx,
    { "docs/ARCHITECTURE.md": "at the cut\n", "tools/e2e/added.txt": "inside the fence\n" },
    "back inside the fence",
  );
  const allowed = pushThroughGuard(fx, fx.laneRef);
  expect(allowed.refused, `an in-fence lane push was refused: ${allowed.stderr}`).toBe(false);
  expect(remoteRef(fx, fx.laneRef), "the allowed push did not reach the remote").not.toBe(before);
});

test("the refusal names EVERY out-of-fence path, not the first one", () => {
  const fx = fixture("names-every-path");
  commit(
    fx,
    {
      "docs/ARCHITECTURE.md": "one\n",
      "docs/ROADMAP.md": "two\n",
      "method/lane-protocol.md": "three\n",
      "tools/e2e/fine.txt": "inside\n",
    },
    "three outside, one inside",
  );
  const refusal = pushThroughGuard(fx, fx.laneRef);
  expect(refusal.refused).toBe(true);
  for (const named of ["docs/ARCHITECTURE.md", "docs/ROADMAP.md", "method/lane-protocol.md"]) {
    expect(refusal.stderr, `the refusal did not name ${named}`).toContain(named);
  }
  expect(refusal.stderr).toContain("3 committed path(s) are outside");
  // A refusal that names a path it did not refuse sends the seat guessing
  // just as surely as one that names none.
  expect(refusal.stderr).not.toContain("tools/e2e/fine.txt");
});

test("a NON-lane push is unaffected by this arm", () => {
  const fx = fixture("non-lane");
  git(fx.root, "checkout", "-q", "-b", "scratch/not-a-lane");
  commit(fx, { "docs/ARCHITECTURE.md": "a seat holding no lane\n" }, "outside every fence");
  const push = pushThroughGuard(fx, "refs/heads/scratch/not-a-lane");
  expect(push.refused, `a non-lane push was refused: ${push.stderr}`).toBe(false);
  expect(remoteRef(fx, "refs/heads/scratch/not-a-lane")).toBeDefined();
  expect(push.stderr).not.toContain("LANDING GATE");
});

test("a checkpoint sync is not charged with main's own paths — the diff is merge-base-to-tip", () => {
  const fx = fixture("checkpoint-sync");
  // MAIN moves, in a path outside the lane's fence — an ordinary
  // integration, and none of this lane's business.
  git(fx.root, "checkout", "-q", "main");
  commit(fx, { "docs/ARCHITECTURE.md": "main's own work\n" }, "main moves on");
  git(fx.root, "push", "-q", "origin", "refs/heads/main:refs/heads/main");
  git(fx.root, "checkout", "-q", fx.lane);
  // T-211's fast path B: the lane syncs, then works inside its fence.
  git(fx.root, "merge", "-q", "--no-edit", "main");
  commit(fx, { "tools/e2e/after-sync.txt": "inside the fence\n" }, "work after the sync");

  // THE MEASUREMENT THAT MAKES THIS BODY DECISIVE rather than tautological:
  // under base-at-cut-to-tip the same tree DOES carry main's path, and
  // under merge-base-to-tip it does not.
  const atCut = git(fx.root, "diff", "--name-only", `${fx.cut}..HEAD`).split("\n");
  const mergeBase = git(fx.root, "merge-base", "main", "HEAD").trim();
  const fromBase = git(fx.root, "diff", "--name-only", `${mergeBase}..HEAD`).split("\n");
  expect(atCut, "the fixture did not reproduce the range the gate must not use").toContain(
    "docs/ARCHITECTURE.md",
  );
  expect(fromBase).not.toContain("docs/ARCHITECTURE.md");

  const push = pushThroughGuard(fx, fx.laneRef);
  expect(push.refused, `a synced lane was charged with main's paths: ${push.stderr}`).toBe(false);
});

test("a lane that has NOT synced is not charged with main's paths either", () => {
  // THE OTHER HALF, AND THE ONE A POISON DRILL FOUND MISSING. The body
  // above syncs, and after a sync `main` and `merge-base(main, HEAD)` are
  // THE SAME COMMIT — so it cannot tell the prescribed range from the
  // two-dot `main..HEAD` that looks like a refinement of it. Unsynced,
  // they differ, and they differ in the direction that manufactures a
  // refusal: `main..HEAD` reports main's own new file as CHANGED, because
  // this branch does not have it.
  const fx = fixture("unsynced");
  git(fx.root, "checkout", "-q", "main");
  commit(fx, { "docs/ARCHITECTURE.md": "main's own work, never merged down\n" }, "main moves on");
  git(fx.root, "push", "-q", "origin", "refs/heads/main:refs/heads/main");
  git(fx.root, "checkout", "-q", fx.lane);
  commit(fx, { "tools/e2e/unsynced.txt": "inside the fence\n" }, "work without syncing");

  // The precondition, measured rather than assumed: the two ranges really
  // do disagree on this tree, and only one of them is the lane's work.
  const twoDot = git(fx.root, "diff", "--name-only", "main..HEAD").split("\n");
  const mergeBase = git(fx.root, "merge-base", "main", "HEAD").trim();
  const prescribed = git(fx.root, "diff", "--name-only", `${mergeBase}..HEAD`).split("\n");
  expect(twoDot, "the fixture did not reproduce the range the gate must not use").toContain(
    "docs/ARCHITECTURE.md",
  );
  expect(prescribed).not.toContain("docs/ARCHITECTURE.md");
  expect(prescribed).toContain("tools/e2e/unsynced.txt");

  const push = pushThroughGuard(fx, fx.laneRef);
  expect(push.refused, `an unsynced lane was charged with main's paths: ${push.stderr}`).toBe(false);
});

test("a card with an ABSENT `touches:` has its push refused WHOLE", () => {
  const fx = fixture("absent-touches", { touches: null });
  const before = remoteRef(fx, fx.laneRef);
  commit(fx, { "tools/e2e/inside-any-normal-fence.txt": "even this\n" }, "a commit");
  const refusal = pushThroughGuard(fx, fx.laneRef);
  expect(refusal.refused, "a card declaring no fence got the widest licence").toBe(true);
  expect(refusal.stderr).toContain("universal set's DUAL");
  expect(remoteRef(fx, fx.laneRef)).toBe(before);
});

test("a card with an EMPTY `touches:` has its push refused WHOLE", () => {
  const fx = fixture("empty-touches", { touches: "[]" });
  const before = remoteRef(fx, fx.laneRef);
  commit(fx, { "tools/e2e/inside-any-normal-fence.txt": "even this\n" }, "a commit");
  const refusal = pushThroughGuard(fx, fx.laneRef);
  expect(refusal.refused, "an empty fence got the widest licence").toBe(true);
  expect(remoteRef(fx, fx.laneRef)).toBe(before);
});

/* ───────────── the fence comes from MAIN, and from nowhere else ──────── */

test("a manifest edited INSIDE the lane does not widen this gate", () => {
  const fx = fixture("manifest-widening");
  const before = remoteRef(fx, fx.laneRef);
  // The shape the gate must be immune to: a lane rewriting the answer the
  // dispatcher left in its own worktree. `.nputer/` is gitignored, so this
  // is exactly the file the write-time hook reads.
  mkdirSync(path.join(fx.root, ".nputer"), { recursive: true });
  writeFileSync(
    path.join(fx.root, ".nputer/lane-fence.json"),
    JSON.stringify({
      version: 1,
      taskId: "T-901",
      branch: fx.laneRef,
      card: fx.card,
      touchesLine: "touches: [tools/e2e, docs, method]",
      paths: ["tools/e2e", "docs", "method"],
      excluded: [],
      alwaysWritable: ["docs/tasks"],
    }),
  );
  commit(fx, { "docs/ARCHITECTURE.md": "claimed by a hand-widened manifest\n" }, "outside");
  const refusal = pushThroughGuard(fx, fx.laneRef);
  expect(refusal.refused, "a hand-edited manifest widened the landing gate").toBe(true);
  expect(refusal.stderr).toContain("docs/ARCHITECTURE.md");
  // …and the fence it reports is the CARD's, not the manifest's.
  expect(refusal.stderr).toContain("touches: [tools/e2e]");
  expect(remoteRef(fx, fx.laneRef)).toBe(before);
});

test("a lane editing its OWN card's `touches:` does not widen this gate either", () => {
  const fx = fixture("card-widening");
  const before = remoteRef(fx, fx.laneRef);
  // The lane amends its own card IN THE LANE — a commit it is entitled to
  // make, since a card is outside every fence including its own — and
  // widens the declaration while it is there.
  writeCard(fx.root, fx.card, "T-901", "[tools/e2e, docs]");
  commit(fx, { "docs/ARCHITECTURE.md": "licensed by the lane's own card\n" }, "widen, then write");
  const refusal = pushThroughGuard(fx, fx.laneRef);
  expect(refusal.refused, "a lane widened its own gate by editing its own card").toBe(true);
  expect(refusal.stderr).toContain("docs/ARCHITECTURE.md");
  expect(refusal.stderr).toContain("touches: [tools/e2e]");
  // THE CARD WRITE ITSELF IS ADMITTED, as a protocol write. A gate that
  // refused it would make an executor's own implementation notes a fence
  // breach (lane-protocol rule 5).
  expect(refusal.stderr, "the lane's own card was refused as an out-of-fence path").not.toContain(
    `    ${fx.card}`,
  );
  expect(remoteRef(fx, fx.laneRef)).toBe(before);
});

test("a lane whose card is not on the integration branch is refused, never widely allowed", () => {
  const fx = fixture("no-card-on-main", { cardId: "T-902" });
  const before = remoteRef(fx, fx.laneRef);
  // MAIN's tree is the tree that matters, so the card goes from there.
  // The board still carries T-900, which is what keeps this the "no card
  // for THIS lane" state rather than the "no board at all" one.
  git(fx.root, "checkout", "-q", "main");
  git(fx.root, "rm", "-q", fx.card);
  git(fx.root, "commit", "-qm", "the card is gone from main");
  git(fx.root, "checkout", "-q", fx.lane);
  commit(fx, { "tools/e2e/anything.txt": "anything at all\n" }, "a commit");
  const refusal = pushThroughGuard(fx, fx.laneRef);
  expect(refusal.refused, "a lane with no card on main pushed anyway").toBe(true);
  expect(refusal.stderr).toContain("carries no card named for T-902");
  expect(remoteRef(fx, fx.laneRef)).toBe(before);
});

test("THE DISCLOSED LIMIT, MEASURED: a lane moves local `main` with `update-ref` and this gate follows it", () => {
  // THE TWO BODIES ABOVE PROVE WHAT A LANE'S COMMITS CANNOT DO; THIS ONE
  // PROVES WHAT A LANE'S REF WRITES CAN (T-223). `integrationRefCandidates`
  // resolves the LOCAL branch first, so the fence this gate enforces is
  // whatever the card says at whatever commit local `main` names — and
  // moving a local ref writes no commit, which is exactly why the header's
  // old claim ("a ref the lane cannot move") was false. The property the
  // gate actually rests on is narrower and true: no COMMIT the lane makes
  // moves that ref.
  //
  // Nothing here is a proposal to close the hole — it takes a deliberate
  // plumbing command and the same seat could `--no-verify` past the hook
  // entirely. The body exists so the limit is MEASURED rather than argued,
  // and so it reds if a future change ever makes the gate immune by
  // accident and leaves the header claiming a weakness it no longer has.
  const fx = fixture("local-ref-rewrite");
  const before = remoteRef(fx, fx.laneRef);
  const narrow = git(fx.root, "rev-parse", "main").trim();

  // The WIDER card, committed on a branch of its own. Committing it here
  // rather than on the lane is what makes the ref write the only act under
  // test: at this moment `main` still declares `[tools/e2e]`.
  // The token is a FILE and not the bare `docs`, deliberately: measured
  // here, `expandFence` answers `docs` UNUSABLE (it would swallow the
  // unfenceable `docs/tasks`), and a fence carrying an unusable token
  // reaches this gate's announced cannot-compare — which allows the push
  // for a reason that has nothing to do with the ref this body moved.
  git(fx.root, "checkout", "-q", "-b", "widened", "main");
  writeCard(fx.root, fx.card, "T-901", "[tools/e2e, docs/ARCHITECTURE.md]");
  const wide = commit(fx, {}, "a card that fences docs/ARCHITECTURE.md as well");
  git(fx.root, "checkout", "-q", fx.lane);

  // ARM ONE — an ordinary refusal, with `main` where the dispatcher left
  // it. Without this the allow below could be a gate that never armed.
  commit(fx, { "docs/ARCHITECTURE.md": "outside the fence main declares\n" }, "outside");
  const laneTip = git(fx.root, "rev-parse", "HEAD").trim();
  const refusal = pushThroughGuard(fx, fx.laneRef);
  expect(refusal.refused, "the fixture did not reproduce an ordinary refusal").toBe(true);
  expect(refusal.stderr).toContain("docs/ARCHITECTURE.md");
  expect(refusal.stderr, "the refusal read a fence that is not main's").toContain("touches: [tools/e2e]");
  expect(remoteRef(fx, fx.laneRef)).toBe(before);

  // THE ASYMMETRY, EXECUTED RATHER THAN QUOTED. `main` is checked out in a
  // SECOND worktree, which is the state a real lane is in and the state
  // that arms the porcelain's guard: `git branch -f` refuses, `git
  // update-ref` does not. A fixture on one worktree would measure neither.
  const wtRoot = mkdtempSync(path.join(os.tmpdir(), "T-223-main-worktree-"));
  SCRATCH.push(wtRoot);
  git(fx.root, "worktree", "add", "--quiet", path.join(wtRoot, "main"), "main");
  const porcelain = spawnSync(
    "git",
    ["-C", fx.root, ...NO_BACKGROUND_MAINTENANCE, "branch", "-f", "main", wide],
    { encoding: "utf8" },
  );
  expect(porcelain.status, "`git branch -f` moved a branch checked out in another worktree").not.toBe(0);
  expect(String(porcelain.stderr), "the refusal was not the checked-out-elsewhere guard").toContain(
    "used by worktree",
  );
  expect(git(fx.root, "rev-parse", "main").trim(), "the refused porcelain moved main anyway").toBe(narrow);

  // …and the plumbing that carries no such guard.
  git(fx.root, "update-ref", "refs/heads/main", wide);
  expect(git(fx.root, "rev-parse", "main").trim(), "`git update-ref` did not move main").toBe(wide);

  // ARM TWO — the SAME lane commit, pushed again. Nothing about the lane
  // changed between the two attempts, which is the assertion that makes
  // this a measurement of the ref and not of anything else.
  expect(git(fx.root, "rev-parse", "HEAD").trim(), "the lane moved between the two attempts").toBe(
    laneTip,
  );
  const followed = pushThroughGuard(fx, fx.laneRef);
  expect(
    followed.refused,
    `the gate did not follow the moved ref, so this limit no longer exists and the header ` +
      `claims a weakness it does not have: ${followed.stderr}`,
  ).toBe(false);
  // AND IT ENFORCED THE WIDENED FENCE RATHER THAN FAILING TO JUDGE IT. An
  // announced cannot-compare would allow the same push for a completely
  // different reason, and reading that as "the fence moved" is the mistake
  // this assertion exists to refuse.
  expect(followed.stderr, "the allow was a cannot-compare, not an enforced widened fence").not.toContain(
    "DID NOT JUDGE",
  );
  expect(remoteRef(fx, fx.laneRef), "the followed push did not reach the remote").not.toBe(before);
});

/* ───────────── the third verdict: cannot compare, said out loud ──────── */

test("an unresolvable token makes the gate say it did NOT judge, and never that it looked", () => {
  const fx = fixture("cannot-compare", { touches: "[app-shell, tools/e2e]" });
  const before = remoteRef(fx, fx.laneRef);

  // THE PAIR IS THE POINT. Inside the RESOLVED domain the gate still
  // decides, so an announcement is not a mechanism that stopped working.
  commit(fx, { "tools/e2e/inside.txt": "resolved domain\n" }, "inside the resolved half");
  const decided = pushThroughGuard(fx, fx.laneRef);
  expect(decided.refused).toBe(false);
  expect(decided.stderr, "a fully-judged push announced a cannot-compare").not.toContain(
    "DID NOT JUDGE",
  );
  expect(remoteRef(fx, fx.laneRef)).not.toBe(before);

  // Outside it, the honest answer is that no overlap was PROVED and none
  // could be ruled out — rule 5's third verdict, announced rather than
  // spelled as either of the other two.
  commit(fx, { "docs/ARCHITECTURE.md": "outside the resolved half\n" }, "outside the resolved half");
  const announced = pushThroughGuard(fx, fx.laneRef);
  expect(announced.refused).toBe(false);
  expect(announced.stderr).toContain("DID NOT JUDGE");
  expect(announced.stderr).toContain("app-shell");
  expect(announced.stderr).toContain("docs/ARCHITECTURE.md");
  expect(announced.stderr).toContain("UNJUDGED");
});

test("a checkout that carries no board is SILENT, not announced — the gate has no question there", () => {
  // THE SPLIT THIS BODY PINS. An allow reached because the gate could not
  // ANSWER is announced; an allow reached because there was no question in
  // this checkout at all is ordinary and silent — `push-guard.mjs`'s own
  // `not-this-repository` shape. Collapsing them would put a paragraph on
  // every push made from a fixture or a clone, which is how a guard gets
  // turned off; and refusing them would refuse every lane branch in a
  // repository that is not this board.
  const fx = fixture("no-board", { board: false });
  commit(fx, { "docs/ARCHITECTURE.md": "anywhere at all\n" }, "a commit with no card behind it");
  const push = pushThroughGuard(fx, fx.laneRef);
  expect(push.refused, `a lane in a boardless checkout was refused: ${push.stderr}`).toBe(false);
  // The pre-existing `lane-fence-unreadable` arm still speaks here — this
  // fixture has no manifest — so the assertion is about THIS gate's own
  // vocabulary and not about silence in general.
  for (const said of ["LANDING GATE", "DID NOT JUDGE", "UNJUDGED", "outside", "fence ("]) {
    expect(push.stderr, `a boardless checkout was told about the landing gate (${said})`).not.toContain(
      said,
    );
  }

  // THE CONTROL: the SAME commit under a board that DOES carry cards but
  // none for this lane is a DISPATCH ERROR and is refused — which is what
  // stops the boardless allow from being a bypass a lane can reach by
  // naming a branch no card answers to.
  const named = fixture("board-without-this-card", { cardId: "T-903" });
  git(named.root, "checkout", "-q", "-b", "task/T-999-a-branch-no-card-answers-to");
  commit(named, { "docs/ARCHITECTURE.md": "anywhere at all\n" }, "a commit");
  const refusal = pushThroughGuard(named, "refs/heads/task/T-999-a-branch-no-card-answers-to");
  expect(refusal.refused, "a lane branch no card answers to pushed anyway").toBe(true);
  expect(refusal.stderr).toContain("carries no card named for T-999");
});

/* ───────────── the merge moment ─────────────────────────────────────── */

test("THE MERGE MOMENT: a merge carrying an out-of-fence path is refused, then a clean one lands", () => {
  const fx = fixture("merge-arm");
  commit(fx, { "docs/ARCHITECTURE.md": "the lane wrote outside its fence\n" }, "outside");
  git(fx.root, "checkout", "-q", "main");
  const mainBefore = remoteRef(fx, "refs/heads/main");
  git(fx.root, "merge", "-q", "--no-ff", "--no-edit", fx.lane);

  const refusal = pushThroughGuard(fx, "refs/heads/main");
  expect(refusal.refused, "a merge carrying an out-of-fence path landed on main").toBe(true);
  expect(refusal.stderr).toContain("docs/ARCHITECTURE.md");
  expect(refusal.stderr).toContain("merge commit(s)");
  expect(remoteRef(fx, "refs/heads/main"), "the refused merge push reached the remote").toBe(
    mainBefore,
  );

  // THE CONTROL, same fixture, same remote: undo the bad merge, fix the
  // lane, merge again. An allow here cannot be a mechanism that failed to
  // arm — it just refused.
  git(fx.root, "reset", "-q", "--hard", String(mainBefore));
  git(fx.root, "checkout", "-q", fx.lane);
  commit(
    fx,
    { "docs/ARCHITECTURE.md": "at the cut\n", "tools/e2e/fixed.txt": "inside\n" },
    "back inside the fence",
  );
  git(fx.root, "checkout", "-q", "main");
  git(fx.root, "merge", "-q", "--no-ff", "--no-edit", fx.lane);
  const allowed = pushThroughGuard(fx, "refs/heads/main");
  expect(allowed.refused, `a clean merge was refused: ${allowed.stderr}`).toBe(false);
  expect(remoteRef(fx, "refs/heads/main")).not.toBe(mainBefore);
});

test("the merge's fence is read from its FIRST parent, so a widened card in the merge does not widen it", () => {
  const fx = fixture("merge-first-parent");
  // The lane widens its own card AND writes outside the narrow fence. The
  // merge commit's own tree, and its second parent's, both carry the wide
  // declaration; only the FIRST parent carries the narrow one.
  writeCard(fx.root, fx.card, "T-901", "[tools/e2e, docs]");
  commit(fx, { "docs/ARCHITECTURE.md": "licensed by the merged card\n" }, "widen, then write");
  git(fx.root, "checkout", "-q", "main");
  const mainBefore = remoteRef(fx, "refs/heads/main");
  git(fx.root, "merge", "-q", "--no-ff", "--no-edit", fx.lane);
  // The precondition, asserted rather than assumed: the merge really does
  // carry the wide card.
  expect(git(fx.root, "show", "HEAD:" + fx.card)).toContain("touches: [tools/e2e, docs]");
  expect(git(fx.root, "show", "HEAD^1:" + fx.card)).toContain("touches: [tools/e2e]");

  const refusal = pushThroughGuard(fx, "refs/heads/main");
  expect(refusal.refused, "the merge was judged against the card the lane merged in").toBe(true);
  expect(refusal.stderr).toContain("docs/ARCHITECTURE.md");
  expect(refusal.stderr).toContain("read from first parent");
  expect(remoteRef(fx, "refs/heads/main")).toBe(mainBefore);
});

test("a merge whose lane branch is gone is announced as unjudged, never allowed silently", () => {
  const fx = fixture("merge-lane-deleted");
  commit(fx, { "docs/ARCHITECTURE.md": "outside\n" }, "outside");
  git(fx.root, "checkout", "-q", "main");
  const mainBefore = remoteRef(fx, "refs/heads/main");
  git(fx.root, "merge", "-q", "--no-ff", "--no-edit", fx.lane);
  git(fx.root, "branch", "-q", "-D", fx.lane);

  const push = pushThroughGuard(fx, "refs/heads/main");
  expect(push.refused, "a merge this gate could not identify was refused rather than announced").toBe(
    false,
  );
  expect(push.stderr).toContain("DID NOT JUDGE");
  expect(push.stderr).toContain("lane branch(es) point at its second parent");
  expect(remoteRef(fx, "refs/heads/main")).not.toBe(mainBefore);
});
