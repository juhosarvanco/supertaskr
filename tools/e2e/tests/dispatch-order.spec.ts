import { spawnSync } from "node:child_process";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import { conventionsText } from "../scripts/docs-scan.mjs";
import { render, unstampedLines } from "../scripts/dispatch-brief.mjs";
import {
  PARSER_DIST,
  boardFiles,
  dispatchContext,
  dispatchReport,
  knownPathOracle,
  lanesFrom,
  loadParser,
} from "../scripts/dispatch-order.mjs";

/**
 * THE DISPATCH COMMAND (T-137) — no browser.
 *
 * `brief.mjs --task` briefs ONE card. Nothing answered *"what is
 * dispatchable, in what order, given the live lanes"* for a session with
 * a terminal, which @human named a core feature of the product — and the
 * cost of that gap is on the record: the architect hand-rolled a fence
 * expansion an hour before this card was dispatched and reported two
 * overlapping cards disjoint, because the correct expansion was
 * unreachable from a shell.
 *
 * ── WHAT THESE BODIES ARE, AND ARE NOT ──────────────────────────────
 * The SCHEDULE rules are pinned in `lib/parser/test/task-waves.test.ts`
 * and the LANE rules in `lib/parser/test/lanes.test.ts`, both against
 * inline fixtures. Re-asserting them here would be a second copy of a
 * pin. These bodies are about the three things only the COMMAND can be
 * wrong about: its provenance, its lane list, and the fact that it
 * writes nothing.
 *
 * Every body names the PRODUCER mutant that kills it.
 */

const CLI = path.join(repoRoot, "tools", "e2e", "scripts", "brief.mjs");

/**
 * A worktree listing in git's own porcelain shape. THE POINT IS THE
 * SECOND AND THIRD ENTRIES — a detached worktree at a lane-shaped path,
 * and a detached one named after a card. Both existed on this repository
 * while T-133 was built, and a path filter counts them as lanes holding
 * fences nobody holds.
 */
const PORCELAIN_FIXTURE = [
  "worktree /Users/x/nputer",
  "HEAD 1111111111111111111111111111111111111111",
  "branch refs/heads/main",
  "",
  "worktree /Users/x/nputer-T-901",
  "HEAD 2222222222222222222222222222222222222222",
  "branch refs/heads/task/T-901-a-real-lane",
  "",
  "worktree /Users/x/nputer-T-902",
  "HEAD 3333333333333333333333333333333333333333",
  "detached",
  "",
  "worktree /Users/x/nputer-T-901-verify",
  "HEAD 2222222222222222222222222222222222222222",
  "detached",
  "",
].join("\n");

test("the lane list is filtered on the BRANCH, never the path", () => {
  // KILLED BY: filtering worktree entries on the PATH — the mutant that
  // turns three detached scratch checkouts into three lanes holding
  // fences nobody holds. `T-111-s5` measured that exact shape on this
  // repository: nine entries, three lanes, and a path filter would have
  // said six.
  const lanes = lanesFrom(PORCELAIN_FIXTURE, conventionsText());
  expect(lanes.map((l) => l.taskId)).toEqual(["T-901"]);
  expect(lanes[0]?.branch).toBe("refs/heads/task/T-901-a-real-lane");
  expect(lanes[0]?.worktree).toBe("/Users/x/nputer-T-901");
});

test("and the live repository AGREES with git worktree list, entry for entry", () => {
  // KILLED BY: any drift between the command's derivation and git's own
  // answer. This is a LIVE fact and is re-derived here rather than
  // quoted: the two sides share no constant.
  const porcelain = spawnSync("git", ["-C", repoRoot, "worktree", "list", "--porcelain"], {
    encoding: "utf8",
  });
  expect(porcelain.status).toBe(0);
  const derived = lanesFrom(porcelain.stdout, conventionsText()).map((l) => l.branch).sort();
  const byHand = porcelain.stdout
    .split(/\r?\n/)
    .filter((l) => l.startsWith("branch refs/heads/task/"))
    .map((l) => l.slice("branch ".length).trim())
    .sort();
  expect(derived).toEqual(byHand);
});

test("THE PROVENANCE FLOOR: every rendered line ends in a stamp", async () => {
  // KILLED BY: emitting any figure through an unstamped channel. T-133
  // built this floor and was REJECTED once for stamping reads of a
  // mutable ref as tree facts; this command's whole lane half is such a
  // read, so the floor is re-driven here rather than assumed.
  const ctx = await dispatchContext({ porcelain: PORCELAIN_FIXTURE });
  const rendered = render(dispatchReport(ctx));
  expect(unstampedLines(rendered)).toEqual([]);
  expect(rendered.split("\n").length).toBeGreaterThan(10);
});

test("the WORKTREE LIST is a LIVE fact and never carries a commit", async () => {
  // KILLED BY: stamping the lane lines with `tree(...)`. That is exactly
  // the three lines T-133 was rejected for. A worktree list is a read of
  // a mutable environment: re-read it and it changes while the ref it
  // would have been stamped at does not.
  const ctx = await dispatchContext({
    porcelain: PORCELAIN_FIXTURE,
    at: "1999-01-01T00:00:00.000Z",
    host: "a-test-host",
  });
  const rendered = render(dispatchReport(ctx));
  const laneLines = rendered
    .split("\n")
    .filter((l) => l.includes("refs/heads/task/T-901-a-real-lane"));
  expect(laneLines.length).toBeGreaterThan(0);
  for (const line of laneLines) {
    expect(line).toContain("<- read 1999-01-01T00:00:00.000Z on a-test-host ;");
    expect(line).not.toMatch(/<- @ [0-9a-f]{7,}/);
  }
  // THE POSITIVE CONTROL, without which "no line carries a commit" would
  // also pass a renderer that stamped nothing: a BOARD figure is a
  // function of the tree and carries the ref.
  const headLine = rendered.split("\n").find((l) => l.startsWith("HEAD in full:"));
  expect(headLine).toMatch(/<- @ [0-9a-f]{12} ; git rev-parse HEAD$/);
});

test("the oracle carries DIRECTORY PREFIXES, which is the half that closes the gap", () => {
  // KILLED BY: passing `git ls-files` straight through. That listing
  // names FILES, so `docs` never appears in it and a bare `docs` token
  // resolves to nothing — which is `T-111`'s 113 disagreeing pairs, an
  // ORACLE GAP that only a caller with a repository can close.
  const known = knownPathOracle();
  expect(known.has("docs")).toBe(true);
  expect(known.has("docs/tasks")).toBe(true);
  expect(known.has("docs/CONVENTIONS.md")).toBe(true);
  // The negative side is the whole point: `ci` is a live `touches:` token
  // on this board and there is nothing at the repository root called it.
  expect(known.has("ci")).toBe(false);
});

test("the board is read with REPOSITORY-RELATIVE paths, so a card's own file can be carved out", () => {
  // KILLED BY: switching to `parseProject(root)`, whose filesystem layer
  // stamps each card's `file` with an ABSOLUTE path. `expandFence` carves
  // a card's own file out of its own fence by comparing that field
  // against relative domains, so an absolute one silently skips the
  // carve-out — and a card holding a directory would collide with itself.
  const files = boardFiles();
  expect(files.length).toBeGreaterThan(10);
  for (const f of files) expect(path.isAbsolute(f.path)).toBe(false);
  expect(files.some((f) => f.path === "docs/ROADMAP.md")).toBe(true);
  expect(files.some((f) => f.path.startsWith("docs/architecture/components/"))).toBe(true);
  expect(files.every((f) => f.path.startsWith("docs/"))).toBe(true);
});

test("...AND THE CONTEXT ACTUALLY USES IT — this body exists because a mutant survived", async () => {
  // KILLED BY: swapping `parseProjectFromFiles(boardFiles(root))` back to
  // `parseProject(root)` inside `dispatchContext`.
  //
  // THE BODY ABOVE DID NOT KILL THAT MUTANT. It tests the HELPER and not
  // the CALL SITE, so arm A17 of this card's poison drill changed the
  // behaviour and the whole suite stayed at exit 0, 204 passed. A drill
  // that is entirely red is not evidence that the thing the card is for
  // is pinned (T-111's rejection, in one sentence) — and this is the arm
  // that proved it here rather than in a verdict.
  const ctx = await dispatchContext({ porcelain: PORCELAIN_FIXTURE });
  const rulings = ctx.order.all as { card: { file: string } }[];
  const files = rulings.map((r) => r.card.file);
  expect(files.length).toBeGreaterThan(10);
  for (const f of files) expect(path.isAbsolute(f), f).toBe(false);
  // The visible symptom, pinned at the surface a reader sees: a card's
  // path reaches the report through its provenance, and an absolute one
  // makes every stamped line a function of WHICH CHECKOUT ran rather than
  // of the tree.
  const rendered = render(dispatchReport(ctx));
  expect(rendered).toContain("; docs/tasks/");
  expect(rendered).not.toContain(`; ${repoRoot}/docs/tasks/`);
});

test("the parser is loaded from ONE place and a missing build REFUSES loudly", async () => {
  // KILLED BY: catching the import failure and falling back to a local
  // re-spelling of the schedule or the fence. A fourth spelling of the
  // fence rule is the defect this card removes; a command that cannot
  // reach the one implementation has no answer to give and says so.
  expect(PARSER_DIST.endsWith(path.join("lib", "parser", "dist", "index.js"))).toBe(true);
  await expect(loadParser(path.join(repoRoot, "lib", "parser", "dist", "no-such-entry.js")))
    .rejects.toThrow(/ADR-011 build order/);
  // POSITIVE CONTROL: the real entry loads and carries BOTH halves.
  const parser = await loadParser();
  expect(typeof parser["selectTaskSchedule"]).toBe("function");
  expect(typeof parser["readDispatchOrder"]).toBe("function");
  expect(typeof parser["expandFence"]).toBe("function");
});

test("--dispatch runs on the live repository, exits 0, and WRITES NOTHING", () => {
  // KILLED BY: any write. The card's criterion is explicit — the terminal
  // consumer SHALL write nothing — and an answer that edits the board it
  // is reporting on is not a report.
  const statusBefore = spawnSync("git", ["-C", repoRoot, "status", "--porcelain"], {
    encoding: "utf8",
  });
  const headBefore = spawnSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], { encoding: "utf8" });

  const run = spawnSync(process.execPath, [CLI, "--dispatch"], { cwd: repoRoot, encoding: "utf8" });
  expect(run.status, run.stderr).toBe(0);
  expect(run.stdout).toContain("WHAT IS DISPATCHABLE, IN WHAT ORDER, GIVEN THE LIVE LANES");
  expect(run.stdout).toContain("STARTABLE NOW");
  expect(run.stdout).toContain("UNBLOCKED BUT FENCED");
  expect(run.stdout).toContain("BLOCKED — the unmet blocker is named");
  expect(run.stdout).toContain("critical path:");
  expect(run.stdout).toContain("worst blocker:");
  expect(unstampedLines(run.stdout.trimEnd())).toEqual([]);

  const statusAfter = spawnSync("git", ["-C", repoRoot, "status", "--porcelain"], {
    encoding: "utf8",
  });
  const headAfter = spawnSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], { encoding: "utf8" });
  expect(statusAfter.stdout).toBe(statusBefore.stdout);
  expect(headAfter.stdout).toBe(headBefore.stdout);
});

test("--dispatch is a NAMED arm: an empty request is still a usage error", () => {
  // KILLED BY: making `--dispatch` the default when nothing is asked for.
  // An empty request is not a clean run; it is a question this command
  // was never asked, and the three arms compose rather than substitute.
  const empty = spawnSync(process.execPath, [CLI], { cwd: repoRoot, encoding: "utf8" });
  expect(empty.status).toBe(2);
  expect(empty.stderr).toContain("--dispatch");
  const help = spawnSync(process.execPath, [CLI, "--help"], { cwd: repoRoot, encoding: "utf8" });
  expect(help.status).toBe(0);
  expect(help.stdout).toContain("--dispatch");
});

test("the STARTABLE set is exactly the ready set minus what the live lanes hold", async () => {
  // KILLED BY: dropping either term. This is the card's own equation
  // checked against the live board rather than a fixture: the two sides
  // are computed from different fields — `blocked_by` on the left, the
  // worktree list on the right — and the arithmetic has to close.
  const ctx = await dispatchContext({});
  const o = ctx.order;
  const readyIds = new Set(o.schedule.readyNow);
  const ruled = [...o.startable, ...o.fenced, ...o.unfenceable];
  expect(ruled.map((r) => r.id).sort()).toEqual([...readyIds].sort());
  for (const r of o.startable) expect(r.holds).toEqual([]);
  for (const r of o.fenced) expect(r.holds.length).toBeGreaterThan(0);
  for (const r of o.startable) expect(r.reason).not.toBe("");
});
