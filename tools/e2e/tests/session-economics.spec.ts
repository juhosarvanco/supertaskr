import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import {
  EXIT,
  assembleBrief,
  context,
  contractRows,
  fenceOverlaps,
  fieldList,
  render,
  roleText,
  unstampedLines,
} from "../scripts/dispatch-brief.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import {
  DECOMPOSITION_FILE,
  EARS_ANCHOR,
  KNOW,
  SEAT_PHRASE,
  TRY,
  acceptanceCriteria,
  earsKeywords,
  hygieneSection,
  isEars,
  lightestTier,
  optionalSection,
  seatRecs,
  seatVerdict,
} from "../scripts/session-economics.mjs";

/**
 * SESSION ECONOMICS (T-157) — no browser.
 *
 * ADR-020's companion adoption: the dispatch brief carries an advisory
 * recommended-seat line derived from the CARD, and the checkpoint
 * template carries stamped cost lines. This file keeps the first half
 * honest. The second half has no keeper here ON PURPOSE — ADR-019's
 * Records clause forbids any suite, gate or generator from depending on
 * `docs/checkpoints/`'s contents, and a body that read the template to
 * check it would enrol this suite as a reader of that directory. The
 * card's implementation notes say so in the same words; this comment is
 * the copy a reader of the suite will find.
 *
 * ── WHAT EACH KIND OF BODY BUYS ──────────────────────────────────────
 * The pure derivation is driven with FIXTURES, so every branch is
 * reachable including the ones the live tree does not exercise today
 * (a role file that HAS run-hygiene text is the load-bearing one — the
 * method has not written it yet, and a criterion whose only branch is
 * "absent" is a criterion nobody has tested). The CLI bodies drive the
 * real command, because the property that matters most — that nothing
 * about the SESSION reaches the recommendation — is a property of the
 * process and not of a function.
 */

const CLI = path.join(repoRoot, "tools", "e2e", "scripts", "brief.mjs");
const MODULE = path.join(repoRoot, "tools", "e2e", "scripts", "session-economics.mjs");

/** The advisory block, sliced off a rendered brief by its own header. */
function advisory(stdout: string): string {
  const at = stdout.indexOf("ADVISORY — THE RECOMMENDED SEAT");
  expect(at, "the brief printed no advisory block at all").toBeGreaterThan(-1);
  return stdout.slice(at);
}

/* ────────────────────────────────────────────────────────────────────
 * THE IDS THIS SUITE SPAWNS ARE DERIVED, NEVER TYPED (T-163-s4) — AND
 * SINCE T-205-s8, SO IS THE REPOSITORY THEY ARE ASKED OF.
 *
 * `brief.mjs --task <id>` is a DISPATCH question and not a lookup: before
 * it prints a row it compares the named card's fence against every live
 * lane's, and a shared entry is a FINDING, which is exit 1. A card id
 * written into this file therefore hands a fact about somebody else's
 * worktree the power to red this file — and it did, three times on three
 * different colliders. `T-169` held `app-board` against the `T-112` this
 * control used to name; `T-143-s3` held it two days later; and then the
 * lane fixing THIS defect held `tools/e2e` against `T-157`, which is the
 * card the whole suite is about, so the fix could not have gone green in
 * its own lane by repairing the `T-112` half alone.
 *
 * DERIVING THE ID WAS ONLY HALF OF IT (T-205-s8). The lane list the
 * command compares against comes from `git worktree list`, which is
 * MACHINE-SCOPED and belongs to no ref — so the same tree measured 619
 * bodies GREEN at `c08f260` and 2-failed/617-passed at the SAME ref four
 * and a half hours later, nothing committed in between, a peer seat's
 * `task/T-216-s8` worktree the whole difference. Choosing a different id
 * cannot reach that: a live lane no card declares is a finding on EVERY
 * `--task` run whatever id is asked for. Four verifier benches paid a red
 * e2e leg for it in one sitting, each attributed to its own diff.
 *
 * `brief.mjs` IS RIGHT TO REFUSE and that half does not move: "a lane
 * whose fence cannot be read is a fence nobody can be disjoint from" is
 * `T-209`'s guard doing its job. The defect was on THIS side. Neither
 * graded body is about lane disjointness at all — one is about the
 * recommendation being a function of the CARD rather than of the
 * environment, the other about where the advisory line SITS — so neither
 * had any business inheriting a list no ref controls.
 *
 * THE RULE THIS FILE NOW KEEPS, IN THREE PARTS:
 *   1. every invocation whose EXIT is graded names `--root <fixture>`, a
 *      repository this suite BUILDS, so the lane set the answer is a
 *      function of is the suite's own and not the machine's;
 *   2. every such invocation still takes a DERIVED id, computed against
 *      THAT repository's board through the command's own `fenceOverlaps`;
 *   3. every in-process reading of the suite's own subject card stays
 *      `T-157` at the live checkout, because a read of a card is not a
 *      dispatch question and no lane can move it.
 *
 * AND THE REFUSAL KEEPS A KEEPER OF ITS OWN, because a fix that quietly
 * stopped `brief.mjs` refusing would satisfy every `toBe(0)` here: the
 * isolation body below plants an undeclared lane in a checkout that IS
 * the one under test and requires exit 1 carrying the guard's own
 * sentence.
 * ──────────────────────────────────────────────────────────────────── */

type BriefCtx = ReturnType<typeof context>;

/**
 * Author and committer come from the environment, so a runner with no
 * configured identity can still commit.
 *
 * EVERY CALL CARRIES `NO_BACKGROUND_MAINTENANCE` (T-178): `git commit`
 * otherwise ends by detaching `git maintenance run --auto`, which keeps
 * writing inside this fixture's `.git` for hundreds of milliseconds after
 * the foreground command returned — into the very tree the teardown is
 * about to remove. tools/e2e/tests/git-fixture.ts carries the mechanism.
 */
const FIXTURE_GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: "t205s8",
  GIT_AUTHOR_EMAIL: "t205s8@example.invalid",
  GIT_COMMITTER_NAME: "t205s8",
  GIT_COMMITTER_EMAIL: "t205s8@example.invalid",
};

function fixtureGit(cwd: string, args: string[]): string {
  return execFileSync("git", ["-C", cwd, ...NO_BACKGROUND_MAINTENANCE, ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: FIXTURE_GIT_ENV,
  });
}

interface LaneFixture {
  /** the mkdtemp root, and the whole of what the teardown removes */
  dir: string;
  /** the checkout every GRADED run is asked of — this project's tracked tree, and NO lanes */
  pristine: string;
  /** a SECOND checkout of the same project, which is what a peer seat's copy is */
  peer: string;
  /** where the plant goes: a SIBLING of `peer`, never a path inside it (lane-protocol rule three) */
  peerLane: string;
}

let FIXTURE: LaneFixture | undefined;

/**
 * TWO CHECKOUTS OF THIS PROJECT, BUILT FROM ITS OWN TRACKED TREE.
 *
 * THE FIXTURE IS `git archive HEAD` AND NOT A HAND-BUILT STAND-IN, for
 * the reason tests/brief.spec.ts's sibling fixture gives: every row of
 * the brief is derived from a real project file — CONVENTIONS' lane
 * bullet, the role file's contract table, the card index, the component
 * registry — so a fixture missing them would prove something about a
 * different repository. What it deliberately does NOT inherit is the
 * machine's worktree list: a fresh `git init` knows exactly one worktree,
 * its own, and that is the surface this card is about.
 *
 * IT IS BUILT ONCE PER WORKER and removed in `afterAll`, because the
 * archive-and-commit is ~2s and three bodies want the same answer out of
 * it. `dir` holds both checkouts and the plant, so one removal is the
 * whole teardown.
 */
function laneFixture(): LaneFixture {
  if (FIXTURE !== undefined) return FIXTURE;
  const dir = mkdtempSync(path.join(os.tmpdir(), "t205s8-lanes-"));
  const pristine = path.join(dir, "pristine");
  mkdirSync(pristine);
  const tar = path.join(dir, "tree.tar");
  writeFileSync(
    tar,
    execFileSync("git", ["-C", repoRoot, "archive", "HEAD"], { maxBuffer: 512 * 1024 * 1024 }),
  );
  execFileSync("tar", ["-x", "-f", tar, "-C", pristine]);
  fixtureGit(pristine, ["init", "--initial-branch=main", "--quiet"]);
  fixtureGit(pristine, ["add", "-A"]);
  // TWO `Checkpoint:` commits, because the brief's lane row reads the
  // newest one out of the first-parent log and a fixture with none would
  // fail for a reason that has nothing to do with lanes.
  fixtureGit(pristine, ["commit", "--quiet", "-m", "Checkpoint: fixture base"]);
  fixtureGit(pristine, ["commit", "--quiet", "--allow-empty", "-m", "Checkpoint: fixture tip"]);

  // THE PEER'S COPY — a clone rather than a second archive, because what
  // it has to be is a checkout of THE SAME project on THIS machine, which
  // is exactly what every sibling seat's worktree is. It is cut with no
  // lane in it; the plant is the isolation body's own act, so that body
  // can measure the graded answer on both sides of it.
  const peer = path.join(dir, "peer");
  execFileSync("git", [...NO_BACKGROUND_MAINTENANCE, "clone", "--quiet", pristine, peer], {
    env: FIXTURE_GIT_ENV,
  });
  FIXTURE = { dir, pristine, peer, peerLane: path.join(dir, "peer-lane") };
  return FIXTURE;
}

test.afterAll(() => {
  if (FIXTURE === undefined) return;
  // The removal is the FIXTURE's finding when it fails, never the failure
  // of whichever body ran last — those bodies already had their verdict.
  removeGitFixture(FIXTURE.dir, "session-economics lane");
  FIXTURE = undefined;
});

/**
 * A lane id NO card on the board declares, DERIVED rather than typed for
 * the same reason every other id in this file is: a number that later
 * became a real card would turn the plant into a declared lane and the
 * refusal assertion into a tautology that passes by never firing.
 */
function undeclaredId(ctx: BriefCtx): string {
  for (let n = 900; n < 1000; n += 1) {
    const id = `T-${n}`;
    if (!ctx.cards.has(id)) return id;
  }
  throw new Error(
    "session-economics: every id from T-900 to T-999 is a live card, so this suite cannot name a " +
      "lane the board does not declare — which is the input the isolation body is built on.",
  );
}

/**
 * ONE GRADED INVOCATION OF THE REAL COMMAND.
 *
 * `--root` is what names the repository whose lane set the answer is a
 * function of, and it is the whole of this card's fix. The working
 * DIRECTORY stays the live checkout on purpose: the two are different
 * paths here, so a command that started reading the cwd instead would
 * show up as a difference between them rather than passing unnoticed.
 */
function brief(root: string, taskId: string, env: NodeJS.ProcessEnv = process.env) {
  return spawnSync(process.execPath, [CLI, "--root", root, "--task", taskId], {
    cwd: repoRoot,
    encoding: "utf8",
    env,
  });
}

/**
 * Card ids whose fence is disjoint from every live lane's IN THE
 * REPOSITORY THE CONTEXT NAMES, in a stable order — computed through the
 * SAME `fenceOverlaps` the command itself compares with, so the
 * prediction cannot drift from the rule it is predicting.
 *
 * Against the fixture this filter has nothing to remove, and that is the
 * point rather than a reason to delete it: it is the rule the command
 * runs, kept here so a fixture that ever grows a lane is still answered
 * correctly instead of silently handing back a colliding id.
 */
function unfencedIds(ctx: BriefCtx): string[] {
  const lanes: { id: string; entries: string[] }[] = [];
  for (const lane of ctx.lanes) {
    const card = ctx.cards.get(lane.taskId);
    if (card !== undefined) {
      lanes.push({ id: lane.taskId, entries: fieldList(card.fields, "touches") });
    }
  }
  const out: string[] = [];
  for (const [id, card] of ctx.cards) {
    const mine = { id, entries: fieldList(card.fields, "touches") };
    // A card that IS a live lane is already in the comparison the command
    // runs, so it is compared against the OTHER lanes and never itself.
    const clear = lanes.every(
      (l) => l.id === id || fenceOverlaps(mine, l, ctx.slugs, ctx.comps).length === 0,
    );
    if (clear) out.push(id);
  }
  return out.sort();
}

/** Which seat a rendered advisory block recommends — "" if it names none. */
function recommendation(block: string): string {
  const line = block.split("\n").find((l) => l.startsWith("RECOMMENDED SEAT:")) ?? "";
  return Object.values(SEAT_PHRASE).find((p) => line.includes(p)) ?? "";
}

const CONTROLS = new Map<string, { baseId: string; otherId: string }>();

/**
 * TWO CARDS THE REPOSITORY UNDER TEST CANNOT COLLIDE, GETTING DIFFERENT
 * RECOMMENDATIONS — the positive control's two inputs, derived once per
 * repository.
 *
 * Chosen on the RECOMMENDATION and not on the whole block, because the
 * block echoes the card's own path: two distinct ids differ there whatever
 * the derivation does, so a control satisfied by the echoed filename would
 * survive a rule that recommended one seat for everything. The choosing
 * runs IN-PROCESS and the assertion runs on the SUBPROCESS's stdout, so
 * what is asserted is that the command's real output carries the
 * difference the derivation claims — not that the derivation agrees with
 * itself.
 *
 * A derivation gone constant has no such pair, and this says so by name
 * rather than grading a card.
 *
 * THE ARGUMENT IS THE POINT (T-205-s8): the ids are derived against the
 * SAME checkout the graded run will be asked of, so the prediction and
 * the invocation cannot be reading two different boards.
 */
function control(root: string): { baseId: string; otherId: string } {
  const cached = CONTROLS.get(root);
  if (cached !== undefined) return cached;
  const ctx = context({ root });
  const ids = unfencedIds(ctx);
  // `seatRecs` reads ctx.card, ctx.root, ctx.slugs, ctx.comps, ctx.ref and
  // ctx.role and nothing else, so one context serves every card below: the
  // same derivation with exactly one input moved.
  const block = (id: string) => render(seatRecs({ ...ctx, taskId: id, card: ctx.cards.get(id) }));
  const baseId = ids[0];
  expect(
    baseId,
    `no card in ${root} has a fence disjoint from every live lane there, so this suite has no ` +
      "input that checkout cannot collide",
  ).toBeDefined();
  const base = recommendation(block(baseId as string));
  const otherId = ids.slice(1).find((id) => recommendation(block(id)) !== base);
  expect(
    otherId,
    `all ${ids.length} cards ${root} leaves unfenced draw the same recommendation ` +
      `(${JSON.stringify(base)}) — nothing here could tell a derivation from a constant`,
  ).toBeDefined();
  const pair = { baseId: baseId as string, otherId: otherId as string };
  CONTROLS.set(root, pair);
  return pair;
}

/**
 * THE FIRST GRADED BODY'S ASSERTIONS, NAMED so the isolation body can run
 * them a second time with an undeclared lane standing on this machine —
 * which is what the card's second criterion asks for in as many words:
 * "with a planted undeclared lane present, the two bodies still pass".
 *
 * @param root the checkout the graded invocations name
 */
function assertSeatFollowsTheCardOnly(root: string): void {
  const { baseId, otherId } = control(root);
  const clean = brief(root, baseId);
  expect(clean.status, clean.stderr ?? "").toBe(0);

  // AND THE RUN SAYS WHICH REPOSITORY IT MEASURED, so "the answer follows
  // --root" is asserted rather than assumed. Without this line a command
  // that ignored the flag and read its own checkout would pass every
  // comparison below on a machine whose lanes all have cards — which is
  // precisely the machine this defect hid on for two days.
  expect(clean.stdout).toContain(`repository: ${root}`);
  expect(clean.stdout).not.toContain(`repository: ${repoRoot}`);

  // EVERY DIAL A SESSION PLAUSIBLY CARRIES, SET TO SOMETHING ABSURD. If
  // the recommendation were read from the environment rather than from
  // the card, one of these would move it — and the failure mode this
  // guards is the one the criterion names in as many words: a row filled
  // "from the assembling session's own dials".
  const loud = brief(root, baseId, {
    ...process.env,
    ANTHROPIC_MODEL: "a-model-that-does-not-exist",
    CLAUDE_MODEL: "another-one",
    SUPERTASKR_MODEL: "a-third",
    MODEL: "a-fourth",
    ANTHROPIC_SMALL_FAST_MODEL: "a-fifth",
    SUPERTASKR_SEAT: "strongest",
  });
  expect(loud.status, loud.stderr ?? "").toBe(0);
  expect(
    advisory(loud.stdout),
    "the advisory block moved under an environment change, so something other than the card is " +
      "feeding it",
  ).toBe(advisory(clean.stdout));

  // POSITIVE CONTROL for the comparison itself: the block is not a
  // constant, so "identical" above is a claim about the environment
  // rather than about a string that could never differ. Two cards, one
  // command, two different blocks — and the two cards are DERIVED (see
  // `control` above), because the id this line used to name was a live
  // card whose fence the board kept colliding.
  const other = brief(root, otherId);
  expect(other.status, other.stderr ?? "").toBe(0);
  expect(advisory(other.stdout)).not.toBe(advisory(clean.stdout));
  // AND THE DIFFERENCE IS IN THE RECOMMENDATION, not merely in the card
  // path the block echoes back — which two distinct ids differ in whatever
  // the derivation does, and which is therefore the half of "not a
  // constant" that is free.
  expect(
    recommendation(advisory(other.stdout)),
    "the two inputs were chosen because the derivation recommends different seats for them, and " +
      "the command printed the same seat for both",
  ).not.toBe(recommendation(advisory(clean.stdout)));

  // And the structural half, because an env read added tomorrow would
  // pass the comparison above on a machine where that variable is unset.
  expect(
    readFileSync(MODULE, "utf8"),
    "the derivation reached for process state — the card is the only input it may have",
  ).not.toContain("process.env");
}

/**
 * THE SECOND GRADED BODY'S ASSERTIONS, named for the same reason — and
 * what they assert is a fact about the COMMAND's output shape, which is
 * why the reads that go with them stay on the live checkout's `T-157`.
 *
 * @param root the checkout the graded invocation names
 */
function assertAdvisoryIsNotAContractRow(root: string): void {
  const run = brief(root, control(root).baseId);
  expect(run.status, run.stderr ?? "").toBe(0);
  expect(run.stdout.indexOf("ROW 13")).toBeLessThan(run.stdout.indexOf("ADVISORY —"));
  expect(advisory(run.stdout)).toContain("NOT one of the rows above");
}

/** A signal set that answers KNOW on every arm — the fixture the others move. */
const ALL_KNOWN = {
  size: "S",
  lightest: "S",
  fence: [{ entry: "tools/e2e", kind: "path", paths: ["tools/e2e"] }],
  criteria: ["WHEN a brief is assembled THE row SHALL derive from the card"],
  keywords: ["THE", "WHEN", "WHILE", "IF", "WHERE"],
};

test("the recommended seat is a function of the CARD, and an environment full of model dials does not move it", () => {
  // ASKED OF A CHECKOUT THIS SUITE BUILT (T-205-s8). The property is
  // about the card and the environment; the live machine's worktree list
  // is neither, and while this body inherited it a colleague opening a
  // lane could red the body without touching the tree.
  assertSeatFollowsTheCardOnly(laneFixture().pristine);
});

test("every one of the three signals reads its own input, and every one of them is decisive once the other two split", () => {
  expect(seatVerdict(ALL_KNOWN).verdict).toBe(KNOW);
  const PROSE = ["the board should feel fast"];
  const SLUG = [{ entry: "app-board", kind: "slug", paths: ["app/src/board", "app/src/model"] }];
  const arm = (v: ReturnType<typeof seatVerdict>, id: string) =>
    v.signals.find((s) => s.id === id)?.verdict;

  // FIRST, THAT EACH SIGNAL ANSWERS ITS OWN INPUT. Each of these is a
  // MUTATED INPUT rather than a mutated assertion: the fixture describes
  // a different card and the rule ships untouched.
  expect(arm(seatVerdict({ ...ALL_KNOWN, size: "L" }), "size")).toBe(TRY);
  expect(arm(seatVerdict({ ...ALL_KNOWN, fence: SLUG }), "fence")).toBe(TRY);
  expect(arm(seatVerdict({ ...ALL_KNOWN, criteria: PROSE }), "criteria")).toBe(TRY);

  // AND THEN THAT EACH ONE DECIDES. A single flip cannot move a majority
  // of three, so "this signal matters" is shown where it is actually
  // shown: hold the other two SPLIT, and flip the one under test. Three
  // pairs, one per signal, and each pair differs in exactly one input.
  expect(seatVerdict({ ...ALL_KNOWN, criteria: PROSE }).verdict).toBe(KNOW);
  expect(seatVerdict({ ...ALL_KNOWN, criteria: PROSE, size: "L" }).verdict).toBe(TRY);
  expect(seatVerdict({ ...ALL_KNOWN, criteria: PROSE, fence: SLUG }).verdict).toBe(TRY);
  expect(seatVerdict({ ...ALL_KNOWN, size: "L" }).verdict).toBe(KNOW);
  expect(seatVerdict({ ...ALL_KNOWN, size: "L", criteria: PROSE }).verdict).toBe(TRY);

  // KNOW NEEDS A MAJORITY, AND THE TIE GOES TO TRY. On three signals the
  // tie is unreachable, so what is pinned is the direction that survives
  // a fourth signal being added: more TRY than KNOW is TRY, and an equal
  // count is never KNOW.
  const two = seatVerdict({ ...ALL_KNOWN, size: "M", criteria: PROSE });
  expect(two.tries).toBe(2);
  expect(two.verdict).toBe(TRY);

  // An EMPTY card is the worst case, and its emptiness reads as TRY on
  // both arms rather than as an accidental KNOW through a zero-length
  // "every criterion passed".
  const empty = seatVerdict({ ...ALL_KNOWN, fence: [], criteria: [] });
  expect(empty.signals.filter((s) => s.verdict === KNOW).length).toBe(1);
  expect(empty.verdict).toBe(TRY);
});

test("the EARS patterns are READ from the method, and a step that moved is a throw rather than an empty pattern set", () => {
  const md = readFileSync(path.join(repoRoot, DECOMPOSITION_FILE), "utf8");
  const keywords = earsKeywords(md);
  expect(keywords).toEqual(["THE", "WHEN", "WHILE", "IF", "WHERE"]);

  // THE FAILURE THAT MATTERS IS THE SILENT ONE. An empty keyword set
  // would call every acceptance criterion on the board malformed and
  // answer TRY for all of them — a confident wrong line, which is worse
  // than a crash. Both routes to it are refused by name.
  expect(() => earsKeywords(md.replace(EARS_ANCHOR, "some other notation"))).toThrow(
    /no longer names/,
  );
  const anchorOnly = md.split(/\r?\n/).filter((l) => !/^\s*- [^:]+:\s+[A-Z][A-Z]/.test(l)).join("\n");
  expect(() => earsKeywords(anchorOnly)).toThrow(/carries no/);
});

test("a criterion that opens with an EARS keyword and never says SHALL is not EARS-shaped", () => {
  const keywords = ["THE", "WHEN", "WHILE", "IF", "WHERE"];
  expect(isEars("WHEN a brief is assembled THE row SHALL derive from the card", keywords)).toBe(true);
  expect(isEars("**WHEN** a brief is assembled THE row SHALL derive", keywords)).toBe(true);

  // THE LIVE CASE, and it was found by running this on the card that
  // asked for it: T-157's own third criterion opens with IF and never
  // reaches SHALL. Both halves are required precisely so that a sentence
  // about a condition does not pass as a requirement.
  expect(
    isEars("IF the hygiene text and the brief row disagree THEN the method text is the authority", keywords),
  ).toBe(false);
  expect(isEars("the system SHALL be fast", keywords)).toBe(false);
  expect(isEars("make the board nicer", keywords)).toBe(false);
});

test("the card's acceptance criteria are read where they exist, and their absence is a reading rather than a crash", () => {
  const ctx = context({ taskId: "T-157" });
  const card = ctx.card;
  expect(card, "T-157 is the card this suite is about and it is not on the board").toBeDefined();
  const text = readFileSync(path.join(repoRoot, card!.file), "utf8");
  expect(acceptanceCriteria(text).length).toBeGreaterThan(0);

  // A CARD WITH NO CRITERIA SECTION IS AN ORDINARY READING. dispatch-
  // brief.mjs's own `section()` throws on a missing heading, which is
  // right for a contract table and wrong for a card — a crash there
  // would take the whole brief down over a card that is merely
  // underwritten, and the signal exists to REPORT that card.
  expect(optionalSection("# a card with nothing in it\n", "## Acceptance criteria")).toBeNull();
  expect(acceptanceCriteria("# a card with nothing in it\n")).toEqual([]);
});

test("the method text is the authority: the line quotes a role file's run-hygiene section, and says so plainly when there is none", () => {
  // THE BRANCH THE TREE DOES NOT EXERCISE TODAY, DRIVEN ANYWAY. The
  // per-seat hygiene text is method work that rides the next bump, so
  // the "present" arm has no live input — and a criterion whose only
  // tested branch is "absent" is a criterion nobody has tested.
  const withText = [
    "# Role: executor",
    "",
    "## Run hygiene",
    "",
    "Model and effort are set at session start and never switched",
    "mid-lane: the cache is the economics.",
    "",
    "## The report",
    "",
    "Something else entirely.",
  ].join("\n");
  const found = hygieneSection(withText);
  expect(found).not.toBeNull();
  expect(found!.heading).toBe("Run hygiene");
  expect(found!.body).toContain("never switched mid-lane");
  expect(found!.body, "the section bled into the heading after it").not.toContain("entirely");

  expect(hygieneSection("# Role: executor\n\n## The report\n\nnothing about running.\n")).toBeNull();

  // AND THE LIVE READING, DISCLOSED RATHER THAN ASSERTED. Which arm the
  // real role file takes today is a fact about the method at this ref
  // and will flip when the hygiene text lands, so what is pinned is that
  // the block SAYS which arm it took — never which arm that is.
  const ctx = context({ taskId: "T-157" });
  const block = render(seatRecs(ctx));
  const live = hygieneSection(roleText("executor", repoRoot));
  expect(block).toContain(live === null ? "no run-hygiene section in" : "THE METHOD TEXT IS THE AUTHORITY");
});

test("the advisory line is NOT a contract row — it is printed outside the row set and derives none of it", () => {
  const ctx = context({ taskId: "T-157" });
  const rows = contractRows(ctx.roleMd);

  // The contract table carries no row for this line, and the brief's own
  // row assembly does not emit it. A fourteenth row invented by this
  // command would be exactly the second row set dispatch-brief.mjs reads
  // the table to avoid — and it reports a deriver with no row as a
  // finding, which is the mechanism this body confirms is untouched.
  expect(rows.some((r) => /seat|model|econom/i.test(r.label))).toBe(false);
  expect(render(assembleBrief(context({ taskId: "T-157" })).recs)).not.toContain("ADVISORY —");

  // …and the command prints it anyway, after the rows. THE SPAWN TAKES A
  // DERIVED ID AND A FIXTURE CHECKOUT while the reads above stay on
  // T-157: this line grades an EXIT, and an exit from `--task` is a
  // dispatch verdict about a whole repository — every live lane's fence
  // included. What it asserts — where the line sits and what it says
  // about itself — is a fact about the command and not about the board,
  // so the board it is asked of is the suite's own (T-205-s8).
  assertAdvisoryIsNotAContractRow(laneFixture().pristine);
});

test("an undeclared lane in another checkout cannot move the graded runs, and in the checkout under test it is still refused", () => {
  const fx = laneFixture();

  /* ──────────────────────────────────────────────────────────────────
   * THE ISOLATION THIS CARD ASKS FOR, MEASURED ON BOTH SIDES OF THE ACT.
   *
   * The reading that red four benches was not "an undeclared lane exists
   * somewhere" — it was "the run inherited the lane list of whatever
   * checkout it happened to be started in". So the demonstration is an
   * ORDERING: the graded answer is taken, a lane no card declares is cut
   * in a second checkout of this project on this machine, and the graded
   * answer is taken again and required to be the same bytes.
   *
   * The one sibling this body will not create is a lane in the live
   * checkout itself — that worktree list is shared with every other seat
   * on this machine, and cutting into it to prove a point is the defect
   * rather than the test of it. That case is covered from the other side
   * below, where the checkout UNDER TEST is the one holding the plant and
   * the refusal is required.
   * ────────────────────────────────────────────────────────────────── */
  const { baseId } = control(fx.pristine);
  const before = brief(fx.pristine, baseId);
  expect(before.status, before.stderr ?? "").toBe(0);

  // THE PLANT. Its branch is spelled from the project's OWN published
  // lane pattern rather than typed, so a project that respells lanes gets
  // a plant that is still a lane; its id is derived to be one no card
  // declares, which is what makes it undeclared.
  const board = context({ root: fx.pristine });
  const plantedId = undeclaredId(board);
  const branch = board.spellings.branchPattern
    .replace("T-NNN", plantedId)
    .replace("<slug>", "a-lane-no-card-declares");
  fixtureGit(fx.peer, ["worktree", "add", "--quiet", "-b", branch, fx.peerLane, "HEAD"]);

  // PRE-CONDITION, ASSERTED RATHER THAN ASSUMED: the plant really is a
  // LANE in the checkout that holds it, and really is undeclared. Without
  // both, everything below passes by never having planted anything.
  const peerCtx = context({ root: fx.peer });
  expect(
    peerCtx.lanes.map((l) => l.taskId),
    "the plant did not register as a lane, so this body is proving nothing",
  ).toContain(plantedId);
  expect(peerCtx.cards.has(plantedId)).toBe(false);
  expect(
    context({ root: fx.pristine }).lanes,
    "the graded checkout grew a lane, so its answer is no longer the suite's to control",
  ).toEqual([]);

  // AND THE GRADED ANSWER IS UNMOVED — exit and advisory both. At the
  // base this comparison was unavailable: the run had no way to name a
  // repository, so the lane above would have been in its answer.
  const after = brief(fx.pristine, baseId);
  expect(after.status, after.stderr ?? "").toBe(0);
  expect(
    advisory(after.stdout),
    "a lane cut in another checkout moved the graded answer, which is the whole defect",
  ).toBe(advisory(before.stdout));

  // THE REFUSAL, EXERCISED SOMEWHERE THAT MEANS TO EXERCISE IT (the
  // card's third criterion). `brief.mjs` is CORRECT to answer 1 for a
  // lane whose fence it cannot read — T-209 — and this is the body that
  // would red if the fix had bought its greens by weakening that. It
  // grades the same command, the same flag and the same plant, and the
  // ONLY difference from the run above is which checkout is named.
  const refused = brief(fx.peer, baseId);
  expect(
    refused.status,
    `the checkout under test holds ${plantedId} on ${branch} and no card declares it, and the ` +
      "assembler answered anyway",
  ).toBe(EXIT.FOUND);
  expect(refused.stderr).toContain(plantedId);
  expect(refused.stderr).toContain("a fence nobody can be disjoint from");

  // AND THE TWO GRADED BODIES, RUN AGAIN WITH THAT LANE STANDING. This is
  // the card's second criterion literally: the same assertions, the same
  // helpers those bodies call, with an undeclared lane live on this
  // machine the whole time.
  assertSeatFollowsTheCardOnly(fx.pristine);
  assertAdvisoryIsNotAContractRow(fx.pristine);
});

test("the recommendation names a seat strength and never a model, because this project passes no --model", () => {
  const ctx = context({ taskId: "T-157" });
  const block = render(seatRecs(ctx));
  const seatLine = block
    .split("\n")
    .filter((l) => l.startsWith("RECOMMENDED SEAT:"));
  expect(seatLine.length).toBe(1);

  // ADR-003: the operator's own CLI default IS the model, and the
  // `model@session` question (D5) is deliberately held. A tool that
  // printed a vendor's name would answer it.
  //
  // ASSERTED OVER THE WHOLE VOCABULARY, NOT OVER TODAY'S BRANCH. The
  // first version of this body read the rendered line for a live card
  // and stopped there — and a drill mutant that put a model name in the
  // TRY phrase SURVIVED it, because the card it read is a KNOW card and
  // the other branch never rendered. A rule about every recommendation
  // has to be checked against every recommendation.
  const vendors = /\b(opus|sonnet|haiku|gpt|gemini|llama|mistral|codex)\b/i;
  const phrases = Object.values(SEAT_PHRASE);
  expect(phrases.length).toBeGreaterThan(1);
  for (const phrase of phrases) expect(phrase).not.toMatch(vendors);
  expect(seatLine[0]).not.toMatch(vendors);
  // …and the rendered line really does come out of that vocabulary,
  // whichever arm this card takes today — so the check above is about
  // the line a reader gets and not only about two unused constants.
  expect(phrases.some((p) => (seatLine[0] ?? "").includes(p))).toBe(true);

  // POSITIVE CONTROL for the detector, so "no vendor name" is a claim
  // about the line rather than about a regex that matches nothing.
  expect("RECOMMENDED SEAT: use opus for this one").toMatch(vendors);

  // The card's own field is the authority, and the block says so on the
  // run — whichever branch the field takes.
  expect(block).toMatch(/the card's builder: (is EMPTY|.+ — AUTHORITATIVE)/);
});

test("every line of the advisory block carries its provenance, and the detector is not vacuous here either", () => {
  const rendered = render(seatRecs(context({ taskId: "T-157" })));
  expect(rendered.length).toBeGreaterThan(0);
  expect(
    unstampedLines(rendered),
    "a figure left the advisory block with no ref — the provenance floor is the whole reason " +
      "this block is built as records rather than as strings",
  ).toEqual([]);

  // The floor is only worth its line if the detector can still see. Strip
  // every stamp and require it to name each line it took one from.
  const stamped = rendered.split("\n").filter((l) => l.includes("  <- ")).length;
  expect(stamped).toBeGreaterThan(5);
  const stripped = rendered.split("\n").map((l) => l.replace(/ {2}<- .*$/, "")).join("\n");
  expect(unstampedLines(stripped).length).toBe(stamped);
});

test("the lightest ceremony tier is read off the table's first row rather than typed into the tool", () => {
  const md = readFileSync(path.join(repoRoot, "method", "tasks", "TASK-FORMAT.md"), "utf8");
  expect(lightestTier(md)).toBe("S");

  // A RENAMED TIER IS FOLLOWED, NOT OVERRULED — which is the point of
  // reading it. The mutant moves the DOCUMENT and leaves the tool alone,
  // and the tool answers the document.
  expect(lightestTier(md.replace("| S, diff outside shipped code |", "| XS, diff outside shipped code |"))).toBe(
    "XS",
  );
});
