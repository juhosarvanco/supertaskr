import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { decide } from "../../../.claude/hooks/lane-fence.mjs";
import { TOKEN_REL_PATH } from "../../../.claude/hooks/gate-token.mjs";
import { repoRoot } from "../preflight";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import { buildLaneFence, writeLaneFence } from "../scripts/lane-fence.mjs";
import { conventionsFiles } from "../scripts/docs-scan.mjs";
import {
  LEDGER_REL_PATH,
  applyLaneLock,
  laneLockPlan,
  laneLockStatus,
  readLedger,
  releaseLaneLock,
} from "../scripts/lane-lock.mjs";

/**
 * THE PHYSICAL FENCE LAYER (T-210) — no browser, no app.
 *
 * The subject is `tools/e2e/scripts/lane-lock.mjs`: out-of-fence TRACKED
 * files in a lane worktree are made read-only, so a write that reaches
 * disk through a shell — the vector `T-025-s4` established a PreToolUse
 * hook cannot parse — fails with `EACCES` from the filesystem instead of
 * passing unseen.
 *
 * ── THIS IS A GUARD, SO THE POSITIVE CONTROLS CARRY THE WEIGHT ───────
 * A layer that refuses everything is indistinguishable from one that
 * works, and this one could stop the project dead in four different
 * places at once. So more than half the bodies here are ALLOWS, each one
 * an act the protocol itself performs: a lane's own card write, a
 * suggestion filed beside it, `T-203`'s verdict-token mint, the dispatch
 * stamp on the integration checkout, and the checkpoint sync of fast
 * path B. Each is asserted AFTER the layer has been proved armed on the
 * same fixture, so an allow can never be a mechanism that failed to arm.
 *
 * ── THE MEASUREMENT THAT MOVED THE CARD IS PINNED HERE ───────────────
 * The card predicted that a checkpoint sync would take an `EACCES` from
 * this layer. At git 2.50.1 it does not — git unlinks and recreates, so
 * it writes straight through a read-only file AND silently restores the
 * write bit. `a checkpoint sync SILENTLY DISARMS…` is that fact as a
 * body: if a future git starts honouring the mode bit, that body reds and
 * tells the project the release step changed from load-bearing-for-
 * re-arming into load-bearing-for-not-failing. A platform fact a design
 * rests on belongs in the suite, not in a paragraph.
 *
 * ── LIFTING A SAFETY GUARD, AS docs/CONVENTIONS.md REQUIRES ──────────
 * Every path any body here names resolves under one `mkdtemp` root. This
 * file chmods a thousand files per fixture and it never chmods one in
 * this repository; the only reads of the live tree are of documents and
 * of `method/`, copied in so the fixture's governing docs are the real
 * ones rather than a second copy of the spellings under test.
 */

/** Every scratch root this file made, removed together at the end. */
const SCRATCH: string[] = [];

test.afterAll(() => {
  // T-178: these roots hold repositories this file COMMITTED into, so the
  // removal is bounded-retried and a removal that still cannot finish is
  // the FIXTURE's finding rather than a red on whichever body ran last.
  for (const dir of SCRATCH.splice(0)) removeGitFixture(dir, "lane-lock scratch");
});

/**
 * A scratch root, its stem DERIVED FROM THE CARD rather than chosen —
 * docs/CONVENTIONS.md's POISON DRILL bullet measured four sessions
 * picking the same literal scratch path and losing each other's files.
 */
function scratchRoot(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "supertaskr-T-210-lane-lock-"));
  SCRATCH.push(dir);
  return dir;
}

// THE FIXTURE'S IDENTITY, IN ONE PLACE AND PASSED TO EVERY COMMITTING
// CALL. A raw `spawnSync("git", …)` that skips these inherits the
// MACHINE's global identity — present on a developer's box, absent on a
// CI runner — so the same body passes here and fails there with
// `Committer identity unknown`. Two merges below did exactly that, and
// it is T-217's class: a fixture reading machine config instead of
// stating what it needs, the same shape as an unpinned default branch.
const IDENT = ["-c", "user.email=t210@example.invalid", "-c", "user.name=T-210 fixture"];

function git(cwd: string, args: string[]): string {
  return execFileSync("git", ["-C", cwd, ...IDENT, ...NO_BACKGROUND_MAINTENANCE, ...args], {
    encoding: "utf8",
  });
}

const ID = "T-910";
const SLUG = "lock-lens";
const SLUG_PATH = "app/src/locklens";
const CARD = `docs/tasks/${ID}-the-card-the-physical-layer-is-measured-on.md`;
const TOUCHES = `touches: [tools/e2e, ${SLUG}]`;

/** In fence by PATH token, in fence by SLUG, and two that are neither. */
const IN_FENCE_PATH = "tools/e2e/tests/fixture.spec.ts";
const IN_FENCE_SLUG = `${SLUG_PATH}/lens.ts`;
const OUT_OF_FENCE = "app/src/main.tsx";
const OUT_OF_FENCE_2 = "method/roles/executor.md";
/**
 * A TRACKED EXECUTABLE, OUT OF FENCE, AND IT IS THE FIXTURE'S ONLY ONE.
 *
 * Without it the clean-tree assertion pins nothing: git records the
 * executable bit and nothing below it, so an absolute `chmod 0444`
 * mutant leaves a tree of 644 files looking identical to the mode-derived
 * lock, and the assertion passes for both. This repository's own two
 * tracked 755 files are `bin/app-dev.mjs` and a `tools/method-evals`
 * runner — neither is copied into this fixture, which is exactly how a
 * body can look like a pin and be one for nobody.
 */
const OUT_OF_FENCE_EXEC = "method/scripts/fixture-exec.sh";
/** What no card may fence — the unfenceable directory, rule 5. */
const UNFENCEABLE = CARD;

interface Fixture {
  root: string;
  repo: string;
  lane: string;
}

function writeFixtureFile(root: string, rel: string, content: string): void {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content, "utf8");
}

/**
 * ── A FIXTURE THAT MEASURES THIS LAYER IS NEVER BUILT OUT OF A TREE THE
 *    LAYER HAS ALREADY TOUCHED (T-216-s4) ─────────────────────────────
 *
 * `cpSync` and `copyFileSync` both carry the SOURCE's permission bits,
 * and the tree `makeFixture` copies from is a LANE worktree whenever
 * this suite runs inside one — where every tracked file outside that
 * lane's fence is `-r--r--r--`, by this very layer's doing.
 * `method/roles/executor.md` is one of them, and it is this file's own
 * `OUT_OF_FENCE_2`.
 *
 * SO THE CONTROL WAS DEFEATED BY ITS OWN SUBJECT. `POSITIVE CONTROL —
 * the protocol's own writes all still succeed under the layer` asserts
 * that the fixture's INTEGRATION CHECKOUT copy stays WRITABLE — the
 * assertion that separates *the layer reached the lane* from *the layer
 * reached everything* — and it received `false` for that file in every
 * lane, because the fixture had INHERITED the answer instead of
 * measuring it. Measured at `e648590` in this repository's own lane for
 * `T-216-s4`: `Error: the integration checkout's
 * method/roles/executor.md — Expected: true, Received: false`.
 *
 * Node offers no mode option on either copy call — `COPYFILE_*` covers
 * clone, exclusive and symlink and nothing else — so the write bit is
 * put back by the walk below, on the COPY and never on the source.
 */
function copyIntoFixture(fromAbs: string, toAbs: string): void {
  mkdirSync(path.dirname(toAbs), { recursive: true });
  cpSync(fromAbs, toAbs, { recursive: true });
  unlockTree(toAbs);
}

/**
 * Owner-write back on, every other bit exactly as the copy found it.
 *
 * `| 0o200` rather than a flat `0o644`: git records the executable bit,
 * so a walk that rewrote modes wholesale would dirty the fixture's own
 * tree — which is the failure the `755 -> 555, never 444` assertion in
 * the first body is written against, one layer down.
 */
function unlockTree(abs: string): void {
  const st = lstatSync(abs);
  // A symlink's mode is the LINK's and `chmodSync` would follow it to a
  // target that may be outside the fixture. Nothing here needs one.
  if (st.isSymbolicLink()) return;
  chmodSync(abs, st.mode | 0o200);
  if (st.isDirectory()) for (const name of readdirSync(abs)) unlockTree(path.join(abs, name));
}

function cardText(touchesLine: string): string {
  return [
    "---",
    `id: ${ID}`,
    "title: The card the physical layer is measured on",
    "feature: F-06",
    "milestone: 4",
    "priority: 30",
    "size: M",
    "status: building",
    "blocked_by: []",
    touchesLine,
    "builder:",
    "verifier:",
    "built_by:",
    "verified_by:",
    "review:",
    "---",
    "",
    "A fixture card.",
    "",
  ].join("\n");
}

/**
 * An integration checkout and one lane worktree cut from it.
 *
 * docs/CONVENTIONS.md AND method/ ARE COPIED IN RATHER THAN FAKED,
 * because the fence expansion reads the branch spelling out of the lane
 * bullet and a hand-written stand-in would be a second copy of the very
 * spelling these bodies exist to measure. `method/` also supplies a real,
 * stable OUT-OF-FENCE file to aim a stray write at.
 */
function makeFixture(touchesLine = TOUCHES): Fixture {
  const root = scratchRoot();
  const repo = path.join(root, "repo");
  mkdirSync(repo, { recursive: true });
  git(repo, ["init", "--initial-branch=main", "--quiet"]);

  // T-290: the conventions are an index AND its chapters, derived.
  for (const rel of [...conventionsFiles(repoRoot), "docs/ROADMAP.md", "CLAUDE.md", "AGENTS.md"]) {
    copyIntoFixture(path.join(repoRoot, rel), path.join(repo, rel));
  }
  copyIntoFixture(path.join(repoRoot, "method"), path.join(repo, "method"));
  // THE ARCHITECTURE DOC'S SLUG BLOCK IS RE-DERIVED FROM THIS FIXTURE'S OWN
  // REGISTRY, and the reason is the rule that block is under: the brief
  // compares the doc's PROSE block against each component file's own
  // `touch_slugs:` FIELD and reports a divergence as a finding. This
  // repository's nine-slug block beside a one-component fixture registry is
  // exactly that divergence — the mechanism working, on a disagreement the
  // fixture manufactured.
  const arch = readFileSync(path.join(repoRoot, "docs/ARCHITECTURE.md"), "utf8")
    .split("\n")
    .filter((l) => !/^ {4}[a-z][a-z-]*\s+->\s+C-\d+/.test(l))
    .join("\n");
  writeFixtureFile(repo, "docs/ARCHITECTURE.md", `${arch}\n\n    ${SLUG} -> C-93\n`);
  writeFixtureFile(
    repo,
    "docs/architecture/components/C-93-lock-lens.md",
    [
      "---",
      "id: C-93",
      "name: Lock lens",
      "layer: app",
      "paths:",
      `  - ${SLUG_PATH}/**`,
      "depends_on: []",
      "decisions: []",
      "status: auto",
      `touch_slugs: [${SLUG}]`,
      "---",
      "A component so a fence token can be a SLUG rather than a path.",
      "",
    ].join("\n"),
  );
  writeFixtureFile(repo, CARD, cardText(touchesLine));
  writeFixtureFile(repo, IN_FENCE_SLUG, "export const lens = 1;\n");
  writeFixtureFile(repo, OUT_OF_FENCE, "export const main = 1;\n");
  writeFixtureFile(repo, IN_FENCE_PATH, "export const spec = 1;\n");
  writeFixtureFile(repo, OUT_OF_FENCE_EXEC, "#!/bin/sh\necho fixture\n");
  chmodSync(path.join(repo, OUT_OF_FENCE_EXEC), 0o755);
  git(repo, ["add", "-A"]);
  // "Checkpoint:" IS LOAD-BEARING IN THE SUBJECT: the brief derives a
  // lane's base by finding the newest checkpoint commit on the integration
  // branch (T-182), and refuses to substitute a different commit for it.
  // A fixture whose base commit is called anything else makes `brief.mjs`
  // answer CANNOT RUN rather than exercising the arm under test.
  git(repo, ["commit", "-m", "Checkpoint: fixture base", "--quiet"]);

  const lane = path.join(root, `supertaskr-${ID}`);
  git(repo, ["worktree", "add", "--quiet", "-b", `task/${ID}-physical-layer`, lane]);
  return { root, repo, lane };
}

/** The dispatch step's two writes, run for real against the fixture. */
async function arm(fx: Fixture): Promise<ReturnType<typeof applyLaneLock>> {
  writeLaneFence(await buildLaneFence(ID, fx.lane, { root: fx.repo, at: "2026-01-01T00:00:00.000Z" }));
  return applyLaneLock(fx.lane, { at: "2026-01-01T00:00:00.000Z" });
}

/** Is the owner write bit set on a real file? */
function writable(abs: string): boolean {
  return (lstatSync(abs).mode & 0o200) !== 0;
}

/**
 * A WRITE THROUGH A SHELL — the vector this whole layer exists for.
 *
 * Deliberately NOT node's `writeFileSync`: the card's subject is the
 * command a PreToolUse hook sees as an opaque string, so the body has to
 * spend one. The redirect is performed by `sh`, not by this process.
 */
function bashWrite(file: string, text: string): { status: number | null; stderr: string } {
  const r = spawnSync("sh", ["-c", `printf %s ${shq(text)} > ${shq(file)}`], { encoding: "utf8" });
  return { status: r.status, stderr: `${r.stderr ?? ""}` };
}

/**
 * SHELL SINGLE-QUOTING, and it is not incidental. `JSON.stringify` was
 * the obvious spelling and it is wrong here: inside double quotes `sh`
 * hands `printf %s` the two characters `\` and `n`, so the fixture wrote
 * a literal backslash where the body expected a newline and the first
 * assertion failed on its own escape rather than on the guard. Single
 * quotes preserve every byte including a real newline.
 */
function shq(s: string): string {
  return `'${s.split("'").join(`'\\''`)}'`;
}

/* ────────────────────────────────────────────────────────────────────
 * THE MAIN ASSERTION, AND ITS POSITIVE CONTROL IN THE SAME BODY
 * ──────────────────────────────────────────────────────────────────── */

test("out-of-fence TRACKED files go read-only and in-fence files stay writable", async () => {
  const fx = makeFixture();
  // BEFORE, so the after is a change this layer made rather than a mode
  // the fixture happened to have. A body that asserted read-only without
  // asserting writable first would be satisfied by a filesystem that had
  // never been touched — and by a fixture builder that had accidentally
  // created its files that way.
  for (const rel of [OUT_OF_FENCE, OUT_OF_FENCE_2, IN_FENCE_PATH, IN_FENCE_SLUG, UNFENCEABLE]) {
    expect(writable(path.join(fx.lane, rel)), `${rel} before the lock`).toBe(true);
  }

  const report = await arm(fx);

  // THE COUNTS CLOSE. The layer's whole claim is about a COMPLEMENT, so a
  // report that lost a file somewhere is a claim about a set it did not
  // partition — and a figure this module prints without a keeper is a
  // figure nobody would notice going wrong.
  expect(report.locked + report.absent + report.skipped + report.failures.length).toBe(
    report.tracked - report.writable,
  );
  expect(report.locked, "the fixture must have something outside the fence").toBeGreaterThan(0);
  expect(report.writable, "and something inside it").toBeGreaterThan(0);

  expect(writable(path.join(fx.lane, OUT_OF_FENCE)), OUT_OF_FENCE).toBe(false);
  expect(writable(path.join(fx.lane, OUT_OF_FENCE_2)), OUT_OF_FENCE_2).toBe(false);
  // THE POSITIVE CONTROL: the fence's own two spellings, one a path token
  // and one a component slug, both still writable.
  expect(writable(path.join(fx.lane, IN_FENCE_PATH)), IN_FENCE_PATH).toBe(true);
  expect(writable(path.join(fx.lane, IN_FENCE_SLUG)), IN_FENCE_SLUG).toBe(true);
  // AND THE DIRECTORY NO CARD MAY FENCE (rule 5). A layer that locked this
  // would stop every lane stamping its own status.
  expect(writable(path.join(fx.lane, UNFENCEABLE)), UNFENCEABLE).toBe(true);

  // NO DIRECTORY IS EVER LOCKED, and three things depend on it: the
  // runtime directory can be created, a worktree can be removed, and a
  // build can write its ignored trees.
  for (const dir of ["", "app", "app/src", "docs", "docs/tasks", "method", "tools/e2e"]) {
    expect(writable(path.join(fx.lane, dir)), `directory ${dir || "<root>"}`).toBe(true);
  }

  // AND THE TREE STAYS CLEAN, WHICH IS NOT COSMETIC. git records the
  // executable bit and nothing below it, so clearing WRITE bits is
  // invisible to it — but only because the lock is computed from the mode
  // it FOUND. An absolute `chmod 0444` would rewrite every tracked
  // EXECUTABLE's mode, dirty the tree, and make T-203's gate-runner see
  // tracked dirt and decline the verdict token — so the push guard would
  // refuse every push, this layer silently disabling the gate that
  // shipped hours before it. That chain is closed by restore fidelity
  // rather than by any argument aimed at it, which is the shape that rots
  // quietly, so it is pinned here rather than trusted.
  // THE EXECUTABLE BIT SURVIVES, which is the half git can see and
  // therefore the half that could dirty the tree. 755 -> 555, never 444.
  expect(lstatSync(path.join(fx.lane, OUT_OF_FENCE_EXEC)).mode & 0o777).toBe(0o555);
  expect(git(fx.lane, ["status", "--porcelain"]), "the armed lane must be clean").toBe("");
});

test("the fixture does NOT inherit the mode bits of the tree it is copied from", () => {
  // THE CONTROL FOR `copyIntoFixture`, AND THE REASON IT EXISTS (T-216-s4).
  // Read that helper's header for the defect; this is the body that keeps
  // the repair honest, and every body in this file rests on it — a fixture
  // that arrived read-only measures the checkout it was cut in rather than
  // the layer under test.
  //
  // THE SOURCE IS MANUFACTURED READ-ONLY HERE RATHER THAN FOUND READ-ONLY,
  // and that is the whole design. The defect's precondition is a property
  // of the CHECKOUT: `method/roles/executor.md` is `444` in an armed lane
  // and `644` in the integration checkout and in the detached worktree a
  // poison drill runs in (docs/CONVENTIONS.md) — so a body that leaned on
  // the ambient tree would let the mutant survive exactly where the drill
  // looks for it.
  const root = scratchRoot();
  const from = path.join(root, "live-tree");
  const to = path.join(root, "fixture-copy");
  const rel = "roles/executor.md";
  mkdirSync(path.join(from, "roles"), { recursive: true });
  writeFileSync(path.join(from, rel), "# Role: executor\n", "utf8");
  chmodSync(path.join(from, rel), 0o444);
  // THE PRECONDITION, ASSERTED: without it a filesystem that ignored the
  // chmod would satisfy everything below for a reason that has nothing to
  // do with the property.
  expect(writable(path.join(from, rel)), "the manufactured source must be read-only").toBe(false);

  copyIntoFixture(from, to);

  expect(writable(path.join(to, rel)), "the copy must not inherit the source's mode").toBe(true);
  // AND THE MODE IS NOT THE CLAIM — THE WRITE IS, through the same shell
  // vector the rest of this file spends.
  const wrote = bashWrite(path.join(to, rel), "# Role: executor, edited\n");
  expect(wrote.status, `writing the fixture's copy; stderr: ${wrote.stderr}`).toBe(0);

  // AND THE SOURCE IS UNTOUCHED. The cheap wrong repair is to chmod the
  // tree being READ, which in a lane is this layer's own arming being
  // undone by a test — so the helper is pinned as one-directional here.
  expect(writable(path.join(from, rel)), "the live tree is never chmodded").toBe(false);
  expect(readFileSync(path.join(from, rel), "utf8"), "nor rewritten").toBe("# Role: executor\n");
});

test("a writer that RENAMES is NOT blocked — the coverage edge, pinned so the prose cannot drift back", async () => {
  // THE PROSE PROMISED THE OPPOSITE ONCE. An earlier draft of rule 5's
  // block listed "the in-place edit" among what this layer covers, four
  // sentences before its own limits paragraph corrected it — the exact
  // failure that rule's "a guard described as total is worse than no
  // guard" names. This body is why that cannot come back quietly.
  //
  // IT PINS THE MECHANISM, NOT ONE TOOL'S FLAG SPELLING. `sed -i` is the
  // canonical instance and its measured figures live in the header and in
  // rule 5, with the platform named — but BSD `sed` needs `-i ''` and GNU
  // `sed` needs bare `-i`, and this suite runs on both. A body that
  // encoded one spelling would measure the runner. `mv` IS the mechanism
  // `sed -i` uses internally, and it is one program on both.
  const fx = makeFixture();
  await arm(fx);
  const target = path.join(fx.lane, OUT_OF_FENCE);

  // ARMED FIRST, ASSERTED FIRST — and this is the POSITIVE CONTROL for
  // the whole body: without it, the successes below would only be saying
  // nothing was locked.
  expect(writable(target)).toBe(false);
  const refused = bashWrite(target, "opened for writing\n");
  expect(refused.status, "an OPEN for writing must still be refused").not.toBe(0);

  // THE EDGE: create a new file and rename it over the locked target. The
  // rename is authorised by the PARENT DIRECTORY, which this layer
  // deliberately leaves writable, so it succeeds.
  const replacement = path.join(fx.lane, "tools/e2e/replacement-T-210.txt");
  writeFileSync(replacement, "renamed over the lock\n", "utf8");
  const mv = spawnSync("mv", ["-f", replacement, target], { encoding: "utf8" });
  expect(mv.status, `mv over a locked file; stderr: ${mv.stderr}`).toBe(0);
  expect(readFileSync(target, "utf8"), "the locked file WAS replaced").toBe(
    "renamed over the lock\n",
  );

  // AND WHY, rather than merely that: make the PARENT DIRECTORY read-only
  // and the same rename is refused. That is what identifies the directory
  // as the authority — and it is the reason this layer must never lock
  // one, since a locked directory breaks `git worktree remove` and the
  // runtime directory both.
  const dir = path.dirname(target);
  const second = path.join(fx.lane, "tools/e2e/second-T-210.txt");
  writeFileSync(second, "blocked by the directory\n", "utf8");
  chmodSync(dir, 0o555);
  try {
    const blocked = spawnSync("mv", ["-f", second, target], { encoding: "utf8" });
    expect(blocked.status, "a read-only PARENT refuses the rename").not.toBe(0);
    expect(readFileSync(target, "utf8")).toBe("renamed over the lock\n");
  } finally {
    // Restored unconditionally, or the fixture teardown cannot remove the
    // tree — the same property this layer relies on for event 4.
    chmodSync(dir, 0o755);
  }
});

test("a BASH write outside the fence fails with EACCES — the case the hook provably cannot decide", async () => {
  const fx = makeFixture();
  const target = path.join(fx.lane, OUT_OF_FENCE);

  // THE SAME COMMAND FIRST, UNARMED. Without this the body proves only
  // that `sh` can fail, and a refusal is indistinguishable from a fixture
  // that never had a writable file.
  expect(bashWrite(target, "before-the-lock\n").status, "the unarmed shell write").toBe(0);
  expect(readFileSync(target, "utf8")).toBe("before-the-lock\n");

  await arm(fx);

  const refused = bashWrite(target, "STRAY WRITE\n");
  expect(refused.status, `sh should have been refused; stderr: ${refused.stderr}`).not.toBe(0);
  expect(refused.stderr).toMatch(/[Pp]ermission denied/);
  expect(readFileSync(target, "utf8"), "the file must be unchanged").toBe("before-the-lock\n");

  // THE ERRNO BY NAME, because "non-zero" is not the card's criterion.
  let code = "";
  try {
    writeFileSync(target, "also refused\n", "utf8");
  } catch (err) {
    code = (err as NodeJS.ErrnoException).code ?? "";
  }
  expect(code, "the acceptance criterion names EACCES").toBe("EACCES");

  // A SECOND VECTOR, so the property is the FILE's and not one shell's.
  const cp = spawnSync("cp", [path.join(fx.lane, IN_FENCE_PATH), target], { encoding: "utf8" });
  expect(cp.status, `cp over a locked file; stderr: ${cp.stderr}`).not.toBe(0);
  expect(readFileSync(target, "utf8")).toBe("before-the-lock\n");

  // AND THE IN-FENCE TWIN OF THE SAME SHELL COMMAND STILL SUCCEEDS. The
  // pair is what separates a working layer from one that refuses
  // everything, and only the two together say so.
  const allowed = bashWrite(path.join(fx.lane, IN_FENCE_PATH), "export const spec = 2;\n");
  expect(allowed.status, `the in-fence shell write; stderr: ${allowed.stderr}`).toBe(0);
});

/* ────────────────────────────────────────────────────────────────────
 * THE PROTOCOL'S OWN ACTS — the controls that carry the weight
 * ──────────────────────────────────────────────────────────────────── */

test("POSITIVE CONTROL — the protocol's own writes all still succeed under the layer", async () => {
  const fx = makeFixture();
  await arm(fx);
  // ARMED FIRST, ASSERTED FIRST. Every allow below is only meaningful
  // because this refusal holds on the same tree at the same moment.
  expect(bashWrite(path.join(fx.lane, OUT_OF_FENCE), "x\n").status).not.toBe(0);

  // 1. THE LANE'S OWN CARD — its status stamp and its implementation
  //    notes. Under `docs/tasks`, which no card may fence.
  const own = bashWrite(path.join(fx.lane, UNFENCEABLE), cardText(TOUCHES));
  expect(own.status, `the lane's own card; stderr: ${own.stderr}`).toBe(0);

  // 2. A FINDING FILED BESIDE IT — a fresh file in the same directory,
  //    which is the other half of what routing means (roles/executor.md).
  const suggestion = path.join(fx.lane, "docs/tasks/T-911-a-finding-this-lane-routed.md");
  const filed = bashWrite(suggestion, "---\nid: T-911\n---\n");
  expect(filed.status, `a routed finding; stderr: ${filed.stderr}`).toBe(0);
  expect(existsSync(suggestion)).toBe(true);

  // 3. T-203's VERDICT-TOKEN MINT. `.supertaskr/` is the runtime directory and
  //    is ignored by its own `.gitignore`, so no path under it is ever in
  //    the tracked corpus this layer chmods — by CONSTRUCTION rather than
  //    by an exception list. If this ever fails, nobody can mint a token
  //    and the push guard refuses every push in the repository.
  const token = path.join(fx.lane, TOKEN_REL_PATH);
  const minted = bashWrite(token, '{"version":1}\n');
  expect(minted.status, `the gate token mint; stderr: ${minted.stderr}`).toBe(0);
  expect(existsSync(token)).toBe(true);
  // And the manifest's own directory is still writable, which is what
  // lets a re-expansion land at all.
  expect(writable(path.join(fx.lane, ".supertaskr"))).toBe(true);

  // 4. THE DISPATCH STAMP, which is written on the INTEGRATION BRANCH
  //    before a lane exists (lane-protocol.md, "Why the branch carries the
  //    dispatch stamp"). The integration checkout is not a lane and this
  //    layer must never have reached it.
  for (const rel of [CARD, OUT_OF_FENCE, OUT_OF_FENCE_2, IN_FENCE_PATH]) {
    expect(writable(path.join(fx.repo, rel)), `the integration checkout's ${rel}`).toBe(true);
  }
  const stamp = bashWrite(path.join(fx.repo, CARD), cardText(TOUCHES).replace("building", "done"));
  expect(stamp.status, `the dispatch stamp; stderr: ${stamp.stderr}`).toBe(0);
});

test("the layer ARMS LANES AND NOTHING ELSE — the integration checkout and a detached tree are refused", async () => {
  const fx = makeFixture();
  const drill = path.join(fx.root, `supertaskr-${ID}-drill`);
  git(fx.repo, ["worktree", "add", "--quiet", "--detach", drill]);
  // The lane is armed with a real manifest so the control at the end of
  // this body is the lane arm SUCCEEDING and not a second missing-manifest
  // refusal wearing the same shape.
  writeLaneFence(await buildLaneFence(ID, fx.lane, { root: fx.repo, at: "2026-01-01T00:00:00.000Z" }));

  for (const [what, where] of [
    ["the integration checkout", fx.repo],
    ["a detached scratch tree", drill],
  ] as const) {
    let message = "";
    try {
      applyLaneLock(where);
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    expect(message, `${what} was not refused`).toContain("not a lane branch");
    expect(writable(path.join(where, OUT_OF_FENCE)), `${what} must be untouched`).toBe(true);
  }

  // THE POSITIVE CONTROL FOR THE REFUSAL ITSELF: the same call against a
  // real lane, in the same fixture, succeeds. Otherwise a `laneAt` that
  // threw unconditionally would satisfy both assertions above.
  const armed = applyLaneLock(fx.lane, { at: "2026-01-01T00:00:00.000Z" });
  expect(armed.locked).toBeGreaterThan(0);
});

/* ────────────────────────────────────────────────────────────────────
 * THE CHECKPOINT SYNC — the defect the card was filed to fix
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Land somebody else's work on `main` and CHECKPOINT it, the way fast
 * path B's sync target is produced. The file it writes is out of this
 * lane's fence by construction — that is what makes a sync necessary.
 */
function landAndCheckpoint(fx: Fixture, content: string): string {
  writeFixtureFile(fx.repo, OUT_OF_FENCE, content);
  git(fx.repo, ["add", "-A"]);
  git(fx.repo, ["commit", "-m", "Merge T-909: the blocker lands", "--quiet"]);
  writeFixtureFile(fx.repo, "docs/checkpoints/2026-09-01-record.md", "# the record\n");
  git(fx.repo, ["add", "-A"]);
  git(fx.repo, ["commit", "-m", "Checkpoint: T-909 closed", "--quiet"]);
  return git(fx.repo, ["rev-parse", "HEAD"]).trim();
}

test("THE CHECKPOINT SYNC SUCCEEDS with the layer active — drop, merge, re-arm from the POST-widening manifest", async () => {
  const fx = makeFixture();
  await arm(fx);
  // ARMED, AND SAID SO BEFORE THE SYNC. Without this the merge below
  // would prove only that git merges.
  expect(writable(path.join(fx.lane, OUT_OF_FENCE)), "armed before the sync").toBe(false);

  // THE LANE HAS BEEN BUILDING — an in-fence write and its commit, both
  // under the armed layer. It also makes the sync a real MERGE rather than
  // a fast-forward, which is the shape fast path B actually meets.
  const built = bashWrite(path.join(fx.lane, IN_FENCE_PATH), "export const spec = 2;\n");
  expect(built.status, `the lane's in-fence work; stderr: ${built.stderr}`).toBe(0);
  git(fx.lane, ["commit", "-am", "T-910: in-fence work", "--quiet"]);

  const checkpoint = landAndCheckpoint(fx, "export const main = 2; // landed by the other lane\n");

  // ── EVENT 3: DROP ENTIRELY, for the duration of a merge the protocol
  //    itself performs. Not a narrowing and not an exception list.
  const dropped = releaseLaneLock(fx.lane);
  expect(dropped.problem, "the release should not have refused").toBeUndefined();
  expect(dropped.restored).toBeGreaterThan(0);
  expect(writable(path.join(fx.lane, OUT_OF_FENCE)), "the layer is off for the sync").toBe(true);
  expect(existsSync(path.join(fx.lane, LEDGER_REL_PATH)), "the ledger goes with it").toBe(false);

  // ── THE SYNC ITSELF, exactly as fast path B prescribes: the CHECKPOINT
  //    commit, never the merge commit, merged into the lane's own branch.
  const merge = spawnSync(
    "git",
    ["-C", fx.lane, ...IDENT, ...NO_BACKGROUND_MAINTENANCE, "merge", "--no-edit", checkpoint],
    { encoding: "utf8" },
  );
  expect(merge.status, `the sync failed: ${merge.stderr}`).toBe(0);

  // THE MERGE COMMIT EXISTS — the card's own criterion, asserted against
  // git rather than against the command's exit code. TWO PARENTS is what
  // makes it a merge: a fast-forward would leave one, and this lane has
  // its own commits, so a one-parent HEAD here would mean the sync had
  // silently become something else.
  const head = git(fx.lane, ["rev-parse", "HEAD"]).trim();
  const parents = git(fx.lane, ["rev-list", "--parents", "-n", "1", head]).trim().split(/\s+/);
  expect(parents.length, `HEAD ${head} is not a merge commit`).toBe(3);
  expect(parents).toContain(checkpoint);
  expect(readFileSync(path.join(fx.lane, OUT_OF_FENCE), "utf8")).toContain("landed by the other lane");

  // ── EVENT 3's SECOND HALF: re-arm from the POST-widening manifest once
  //    the merge commit exists. The fence has moved on `main` too, so the
  //    re-expansion is the dispatch step performed again (fast path A).
  writeFixtureFile(fx.repo, CARD, cardText(`${TOUCHES.slice(0, -1)}, ${OUT_OF_FENCE}]`));
  git(fx.repo, ["add", "-A"]);
  git(fx.repo, ["commit", "-m", "widen T-910", "--quiet"]);
  await arm(fx);

  // THE NEWLY GRANTED PATH IS WRITABLE AND A NEVER-GRANTED ONE IS NOT.
  // That PAIR is the positive control (T-211): only the two together
  // separate a grant from a layer that stopped refusing.
  expect(writable(path.join(fx.lane, OUT_OF_FENCE)), "newly granted").toBe(true);
  expect(writable(path.join(fx.lane, OUT_OF_FENCE_2)), "never granted").toBe(false);
  expect(writable(path.join(fx.lane, IN_FENCE_PATH)), "already held").toBe(true);
});

test("a checkpoint sync SILENTLY DISARMS the layer when the drop is skipped — measured, not assumed", async () => {
  // THE CARD PREDICTED AN `EACCES` HERE AND MEASUREMENT MOVED IT. At git
  // 2.50.1 a merge unlinks and recreates, so it writes THROUGH a
  // read-only tracked file and leaves it at the umask default. The
  // self-violation is real and worse than predicted: not a loud refusal
  // but a guard that a routine protocol act removes with no error, no
  // output and nothing in `git status`.
  //
  // THIS BODY IS THE PLATFORM PIN. If a future git honours the mode bit
  // it reds, and the project learns that the release step has changed
  // from load-bearing-for-re-arming into load-bearing-for-not-failing.
  const fx = makeFixture();
  await arm(fx);
  expect(writable(path.join(fx.lane, OUT_OF_FENCE))).toBe(false);
  const untouched = path.join(fx.lane, OUT_OF_FENCE_2);
  expect(writable(untouched)).toBe(false);

  // THE SAME OPERATION THE BODY ABOVE PERFORMS, MINUS THE RELEASE — same
  // lane commit, same checkpoint target, same merge. One step removed, so
  // what changes is attributable to that step.
  writeFileSync(path.join(fx.lane, IN_FENCE_PATH), "export const spec = 2;\n", "utf8");
  git(fx.lane, ["commit", "-am", "T-910: in-fence work", "--quiet"]);
  const checkpoint = landAndCheckpoint(fx, "export const main = 3;\n");
  const merge = spawnSync(
    "git",
    ["-C", fx.lane, ...IDENT, ...NO_BACKGROUND_MAINTENANCE, "merge", "--no-edit", checkpoint],
    { encoding: "utf8" },
  );
  expect(merge.status, `git took an EACCES from the lock: ${merge.stderr}`).toBe(0);
  expect(merge.stderr, "and it said nothing about permissions").not.toMatch(/[Pp]ermission/);

  // THE DISARM, NAMED: the file the merge rewrote is writable again, and
  // a locked file the merge did not touch is not. One merge, two files,
  // one bit of difference — which is what makes this the merge's doing.
  expect(writable(path.join(fx.lane, OUT_OF_FENCE)), "the file the merge rewrote").toBe(true);
  expect(writable(untouched), "a locked file the merge did not touch").toBe(false);

  // AND THE DISARM IS ASKABLE, which is the only reason it is survivable.
  const drifted = laneLockStatus(fx.lane);
  expect(drifted.drift).toContain(OUT_OF_FENCE);
  expect(drifted.lockedNow).toBeGreaterThan(0);

  // RE-ARMING CLOSES IT. The pair again: a state, a remedy, and the same
  // question asked twice.
  applyLaneLock(fx.lane, { at: "2026-01-01T00:00:00.000Z" });
  const rearmed = laneLockStatus(fx.lane);
  expect(rearmed.drift, "re-arming leaves no drift").toEqual([]);
  expect(rearmed.stray).toEqual([]);
  expect(writable(path.join(fx.lane, OUT_OF_FENCE))).toBe(false);
});

/* ────────────────────────────────────────────────────────────────────
 * EVENT 4 — cleanup IS worktree removal
 * ──────────────────────────────────────────────────────────────────── */

test("WORKTREE REMOVAL leaves no read-only residue, and a dirty tree refuses for DIRTINESS not for mode bits", async () => {
  const fx = makeFixture();
  await arm(fx);
  expect(writable(path.join(fx.lane, OUT_OF_FENCE)), "armed before removal").toBe(false);

  // A CLEAN LOCKED TREE REMOVES. Unlink is authorised by the parent
  // DIRECTORY, and this layer never locks one — which is why event 4 needs
  // no sweep at all.
  const clean = spawnSync("git", ["-C", fx.repo, "worktree", "remove", fx.lane], {
    encoding: "utf8",
  });
  expect(clean.status, `removing a clean locked worktree: ${clean.stderr}`).toBe(0);
  expect(existsSync(fx.lane), "no residue").toBe(false);

  // THE DIRTY CASE THE CARD OWES A CONTROL FOR. A plain `remove` refuses —
  // and the control is that it refuses IDENTICALLY without the layer, so
  // the refusal is git's ordinary dirtiness rule and not this card's doing.
  const dirty = makeFixture();
  await arm(dirty);
  writeFileSync(path.join(dirty.lane, "untracked-T-210.txt"), "dirt\n", "utf8");
  const refusedLocked = spawnSync("git", ["-C", dirty.repo, "worktree", "remove", dirty.lane], {
    encoding: "utf8",
  });

  const control = makeFixture();
  writeFileSync(path.join(control.lane, "untracked-T-210.txt"), "dirt\n", "utf8");
  const refusedPlain = spawnSync(
    "git",
    ["-C", control.repo, "worktree", "remove", control.lane],
    { encoding: "utf8" },
  );

  expect(refusedLocked.status, "the locked dirty tree").toBe(refusedPlain.status);
  expect(refusedLocked.stderr).toContain("contains modified or untracked files");
  expect(refusedPlain.stderr, "the UNLOCKED dirty tree refuses for the same reason").toContain(
    "contains modified or untracked files",
  );
  expect(refusedLocked.stderr, "and never for a permission").not.toMatch(/[Pp]ermission/);

  // `--force` IS THE PRESCRIBED MOVE AND IT WORKS THROUGH THE LOCK.
  const forced = spawnSync(
    "git",
    ["-C", dirty.repo, "worktree", "remove", "--force", dirty.lane],
    { encoding: "utf8" },
  );
  expect(forced.status, `forced removal of a dirty locked worktree: ${forced.stderr}`).toBe(0);
  expect(existsSync(dirty.lane), "no residue").toBe(false);
});

/* ────────────────────────────────────────────────────────────────────
 * THE NEIGHBOUR (T-228), AND AGREEMENT WITH THE HOOK
 * ──────────────────────────────────────────────────────────────────── */

test("the unfenceable directory is NEVER locked — including inside T-228's stale-stamp window", async () => {
  const fx = makeFixture();
  await arm(fx);

  // OPEN THE WINDOW: the lane's own copy of the card carries a `touches:`
  // line the manifest was not stamped from. That is the half-performed
  // widening T-211 describes and T-228 measured.
  writeFileSync(path.join(fx.lane, CARD), cardText(`${TOUCHES.slice(0, -1)}, ${OUT_OF_FENCE}]`), "utf8");

  // THE WINDOW IS OPEN — asserted, not assumed, because this body's claim
  // is about what THIS layer does in a state the hook is already refusing.
  //
  // THE PROBE IS THE NEWLY-GRANTED PATH AND NOT THE CARD, DELIBERATELY.
  // The obvious probe is the card itself, and it would couple this body to
  // exactly the behaviour `T-228` is filed to CHANGE: that card's first
  // criterion is that a write to the unfenceable directory be ALLOWED in
  // this state, so a body asserting `stale-stamp` on the card would red the
  // day T-228 lands, on an unrelated lane, for no defect. The newly granted
  // path is the half T-228 preserves BY NAME — *"the half-performed grant
  // SHALL STILL BE REFUSED on the newly granted path"* — so it says the
  // window is open and goes on saying it afterwards.
  const blocked = decide({
    toolName: "Write",
    cwd: fx.lane,
    toolInput: { file_path: path.join(fx.lane, OUT_OF_FENCE) },
  });
  expect(blocked.verdict, "T-228's window must actually be open here").toBe("block");
  // ONE RESIDUAL COUPLING, NAMED FOR WHOEVER TAKES T-228. The VERDICT
  // above survives that card by its own second criterion, which preserves
  // refusal on the newly granted path by name. The CODE is a weaker
  // guarantee: an implementation that reordered the checks correctly but
  // RENAMED this code would red this body, with nothing here explaining
  // why. It is asserted anyway — a block for the wrong reason is not the
  // state this body claims to have set up — but if you are reading this
  // from inside T-228, the fix is to update this string, not to delete
  // the assertion.
  expect(blocked.code).toBe("stale-stamp");

  // AND THE PHYSICAL LAYER STILL ALLOWS THE CARD. This layer never held
  // the trap: it declined to add a SECOND, physical copy of it, so a
  // lane stuck in the window always had somewhere to file the finding
  // that explains why it is stuck.
  // **THE TWO LAYERS NOW AGREE HERE, AND THEY DID NOT WHEN THIS BODY
  // WAS WRITTEN** (T-228): the sentence removed from this comment said
  // the hook refuses the Write tool on this very file, which was true
  // and is the defect T-228 landed to repair — `decide` answers
  // `alwaysWritable` BEFORE it compares the stamp. The hook side of
  // that agreement is asserted where it belongs, in
  // `lane-fence.spec.ts`'s *"the UNFENCEABLE directory stays open while
  // the card and the manifest disagree"*, and deliberately NOT
  // duplicated here: a second copy would put this body in that one's
  // kill set and leave neither uniquely responsible (docs/CONVENTIONS.md,
  // POISON DRILL shape SIX).
  expect(writable(path.join(fx.lane, CARD)), "the lane's own card").toBe(true);
  const filed = bashWrite(
    path.join(fx.lane, "docs/tasks/T-912-routed-from-inside-the-window.md"),
    "---\nid: T-912\n---\n",
  );
  expect(filed.status, `a finding routed inside the window; stderr: ${filed.stderr}`).toBe(0);

  // AND THE WINDOW CHANGES NOTHING ELSE: the out-of-fence file is still
  // locked, so the layer is not merely permissive here.
  expect(writable(path.join(fx.lane, OUT_OF_FENCE))).toBe(false);

  // RE-ARMING INSIDE THE WINDOW DOES NOT WIDEN ANYTHING. The manifest is
  // the only input, and the lane's own card is not one — a lane that
  // edited its `touches:` and re-ran this would otherwise have widened
  // its own physical fence from inside the lane it fences (rule 5).
  applyLaneLock(fx.lane, { at: "2026-01-01T00:00:00.000Z" });
  expect(writable(path.join(fx.lane, OUT_OF_FENCE)), "still refused after a re-arm").toBe(false);
});

test("the physical verdict agrees with the hook's own decide(), path by path", async () => {
  const fx = makeFixture();
  await arm(fx);

  // TWO IMPLEMENTATIONS OF ONE RULE, PUT SIDE BY SIDE ON REAL PATHS. The
  // containment predicate is shared (`within`), the TRAVERSAL is not — the
  // hook walks `alwaysWritable` then `paths` inside `decide()`, this layer
  // walks them in `fenceAllows`. Swapping either order, or dropping either
  // list, reds this body by name.
  const tracked = git(fx.lane, ["ls-files"]).split("\n").filter(Boolean);
  const disagreements: string[] = [];
  let allowed = 0;
  let blocked = 0;
  for (const rel of tracked) {
    const abs = path.join(fx.lane, rel);
    if (!existsSync(abs)) continue;
    const hook = decide({ toolName: "Write", cwd: fx.lane, toolInput: { file_path: abs } });
    const physicallyWritable = writable(abs);
    if (hook.verdict === "allow") allowed += 1;
    else blocked += 1;
    if ((hook.verdict === "allow") !== physicallyWritable) {
      disagreements.push(`${rel}: hook says ${hook.verdict}, disk says ${physicallyWritable ? "writable" : "read-only"}`);
    }
  }
  expect(disagreements, "the two layers must not disagree about any tracked path").toEqual([]);
  // NEITHER COUNT MAY BE ZERO, or the agreement above is an agreement
  // about nothing — the vacuous-assertion shape this repository has
  // already killed once.
  expect(allowed, "no path was allowed, so the comparison spanned one verdict").toBeGreaterThan(0);
  expect(blocked, "no path was blocked, so the comparison spanned one verdict").toBeGreaterThan(0);
});

/* ────────────────────────────────────────────────────────────────────
 * THE LEDGER, AND THE WIRING
 * ──────────────────────────────────────────────────────────────────── */

test("the ledger records the mode it FOUND, so a release restores bits rather than guessing them", async () => {
  const fx = makeFixture();
  // AN EXECUTABLE OUT-OF-FENCE FILE, because `u+w` would restore 644 to a
  // 755 file and nothing in this repository would ever have noticed:
  // every tracked file here is 644 but two.
  const script = "method/scripts/a-tracked-executable.sh";
  writeFixtureFile(fx.repo, script, "#!/bin/sh\necho hi\n");
  chmodSync(path.join(fx.repo, script), 0o755);
  git(fx.repo, ["add", "-A"]);
  git(fx.repo, ["commit", "-m", "a tracked executable", "--quiet"]);
  git(fx.lane, ["merge", "--no-edit", "main"]);
  expect(lstatSync(path.join(fx.lane, script)).mode & 0o777).toBe(0o755);

  await arm(fx);
  expect(lstatSync(path.join(fx.lane, script)).mode & 0o777, "locked, exec bit kept").toBe(0o555);

  const led = readLedger(fx.lane);
  expect("problem" in led ? led.problem : "").toBe("");
  const entry = "ledger" in led ? led.ledger.locked.find((e) => e.path === script) : undefined;
  expect(entry?.mode, "the ledger carries the mode it found").toBe("755");

  releaseLaneLock(fx.lane);
  expect(lstatSync(path.join(fx.lane, script)).mode & 0o777, "restored exactly").toBe(0o755);
  expect(lstatSync(path.join(fx.lane, OUT_OF_FENCE)).mode & 0o777).toBe(0o644);
});

test("the DISPATCH STEP arms it — `brief.mjs --write-fence` is the one event, and a widening is the same event again", async () => {
  const fx = makeFixture();
  // T-238, absorbing T-230-s6 and T-240: `CLAUDE_PROJECT_DIR` POINTS
  // OUTSIDE EVERY CHECKOUT OF THIS REPOSITORY, and that is what makes
  // this body's exit code a fact about the DISPATCH STEP.
  //
  // `--write-fence` also runs T-216-s1's stale-checkout catcher, whose
  // subject is the checkout the SESSION was started in. Run from a lane
  // that is the lane — and the moment a `.claude` commit lands on the
  // integration branch while this lane is open, the catcher answers
  // `guard-surface-behind`, CORRECTLY, contributes a finding, and this
  // body reads exit 1 where it asserts 0. Measured by T-215's blind
  // verifier on a bench six commits behind main: this body among four,
  // across three spec files, on a byte-identical tree. The state a
  // non-repository directory puts that arm in is UNANSWERED, which
  // `checkout-currency.spec.ts` pins as speaking and charging nobody —
  // so the catcher's own discrimination stays measured where its
  // subject is, and the physical fence layer is measured here.
  const outside = mkdtempSync(path.join(os.tmpdir(), "T-238-no-session-"));
  SCRATCH.push(outside);
  const cli = (args: string[]) =>
    spawnSync(process.execPath, [path.join(repoRoot, "tools/e2e/scripts/brief.mjs"), ...args], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, CLAUDE_PROJECT_DIR: outside },
    });

  const first = cli(["--task", ID, "--write-fence", fx.lane, "--root", fx.repo]);
  expect(first.status, `${first.stdout}\n${first.stderr}`).toBe(0);
  expect(first.stdout).toContain("THE PHYSICAL LAYER, ARMED FROM THAT MANIFEST");
  expect(writable(path.join(fx.lane, OUT_OF_FENCE)), "the dispatch step armed it").toBe(false);
  expect(writable(path.join(fx.lane, IN_FENCE_PATH)), "and left the fence alone").toBe(true);

  // EVENT 2 IS EVENT 1 AGAIN. A widening re-runs this same command (T-211
  // fast path A: "the dispatch step performed again, never a different
  // act"), and the re-baseline hands the granted path its write bit back
  // in the same motion — a lane that had to be told separately would meet
  // a physical refusal on a path the hook had already granted.
  writeFixtureFile(fx.repo, CARD, cardText(`${TOUCHES.slice(0, -1)}, ${OUT_OF_FENCE}]`));
  git(fx.repo, ["add", "-A"]);
  git(fx.repo, ["commit", "-m", "widen T-910", "--quiet"]);
  const again = cli(["--task", ID, "--write-fence", fx.lane, "--root", fx.repo]);
  expect(again.status, `${again.stdout}\n${again.stderr}`).toBe(0);
  expect(writable(path.join(fx.lane, OUT_OF_FENCE)), "granted").toBe(true);
  expect(writable(path.join(fx.lane, OUT_OF_FENCE_2)), "never granted").toBe(false);
  expect(laneLockStatus(fx.lane).stray, "no in-fence file left locked behind").toEqual([]);
});

test("the plan is a pure function of the manifest — no clock, no filesystem, no git", () => {
  // THE SEAM THE BODIES ABOVE ALL REST ON, driven with no repository at
  // all so a disagreement about the RULE is separable from a disagreement
  // about a tree.
  const manifest = { paths: ["tools/e2e", "app/src/locklens"], alwaysWritable: ["docs/tasks"] };
  const plan = laneLockPlan(
    [
      "tools/e2e/scripts/x.mjs",
      "tools/e2e",
      "app/src/locklens/lens.ts",
      "app/src/main.tsx",
      "docs/tasks/T-910-x.md",
      "docs/STATE.md",
      // CONTAINMENT, NOT PREFIX MATCHING: rule 5's own trap. `tools/e2e2`
      // is not inside `tools/e2e` however the strings sort.
      "tools/e2e2/other.mjs",
      "app/src/locklenses/other.ts",
    ],
    manifest,
  );
  expect(plan.writable).toEqual([
    "tools/e2e/scripts/x.mjs",
    "tools/e2e",
    "app/src/locklens/lens.ts",
    "docs/tasks/T-910-x.md",
  ]);
  expect(plan.lock).toEqual([
    "app/src/main.tsx",
    "docs/STATE.md",
    "tools/e2e2/other.mjs",
    "app/src/locklenses/other.ts",
  ]);
});
