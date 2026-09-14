import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";
import { parse as parseYaml } from "yaml";
import { createHash } from "node:crypto";
import {
  DECLINE_CODES,
  INTEGRATION_SEAT_PATHS,
  LANE_BRANCH_RE,
  MANIFEST_REL_PATH,
  MANIFEST_VERSION,
  READ_TOOL_NAMES,
  ROUTE,
  ROUTE_LANE_LESS,
  ROUTE_SECRET,
  SECRET_READ_CODES,
  SECRET_SET,
  WRITE_TOOL_PATH_FIELDS,
  carveOutFor,
  decide,
  findCheckoutRoot,
  liveLanes,
  matchesEntry,
  readHeadRef,
  touchesLineOf,
  within,
} from "../../../.claude/hooks/lane-fence.mjs";
import * as laneFenceHook from "../../../.claude/hooks/lane-fence.mjs";
import { repoRoot } from "../preflight";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import { conventionsBullet, conventionsFiles, conventionsText, liveTaskCards } from "../scripts/docs-scan.mjs";
import { laneSpellings, normaliseTaskId } from "../scripts/dispatch-brief.mjs";
import {
  MANIFEST_DIR_IGNORE,
  buildLaneFence,
  disjointnessRefusal,
  laneDisjointness,
  laneIdOf,
  writeLaneFence,
} from "../scripts/lane-fence.mjs";

/**
 * THE FENCE AT THE MOMENT OF THE WRITE (T-154) — no browser.
 *
 * Two halves are under test and they are deliberately not the same
 * program: `tools/e2e/scripts/lane-fence.mjs` EXPANDS a card's fence at
 * dispatch through the parser's one implementation, and
 * `.claude/hooks/lane-fence.mjs` READS the result at the write with
 * nothing but node builtins. Everything below drives the real pair over a
 * real git repository built in a temporary directory.
 *
 * ── LIFTING A SAFETY GUARD, AS docs/CONVENTIONS.md REQUIRES ──────────
 * This is a guard, so its discriminating half is by construction a
 * deliberate ALLOW, and the two rules that bullet imposes are obeyed in
 * every allow body here: the lifted arm TERMINATES IN A FIXTURE — every
 * path this file names resolves under one `mkdtemp` root, nothing is
 * written into this repository, and the only reads of the live tree are
 * of documents — and the body ASSERTS THE GUARD'S STATE FIRST, so an
 * allow is never confused with a mechanism that failed to arm. A body
 * that asserts an allow without first proving the same request is
 * refused one fixture over would be satisfied by a hook that always says
 * yes, which is the whole failure a positive control exists to exclude.
 *
 * ── HOW TO READ A FAILURE ────────────────────────────────────────────
 * The two constants the hook cannot avoid holding — where the manifest
 * lives and how a lane branch is spelled — are COMPARED here against
 * their authorities (`lane-fence.mjs`'s exports and
 * docs/CONVENTIONS.md's own lane bullet). A red in those bodies is the
 * two copies disagreeing and names both sides; it does not say which is
 * right.
 */

/** Every scratch root this file made, removed together at the end. */
const SCRATCH: string[] = [];

test.afterAll(() => {
  // T-178: these roots hold repositories this file COMMITTED into, and a
  // commit detaches `git maintenance run --auto` behind it. The removal is
  // bounded-retried, and one that still cannot finish is the FIXTURE's
  // finding rather than a red on whichever body happened to run last.
  for (const dir of SCRATCH.splice(0)) removeGitFixture(dir, "lane-fence scratch");
});

/**
 * A scratch root, its stem DERIVED FROM THE LANE rather than chosen.
 *
 * docs/CONVENTIONS.md's POISON DRILL bullet measured four sessions
 * picking the same literal scratch path and losing each other's files:
 * the scratch directory is SHARED between concurrent sessions even
 * though its uuid makes it look private. `mkdtemp` adds the uniqueness
 * and the card id makes an orphan attributable.
 */
function scratchRoot(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "supertaskr-T-154-lane-fence-"));
  SCRATCH.push(dir);
  return dir;
}

/** git, with an identity so a fixture commit does not depend on the host's. */
function git(cwd: string, args: string[]): string {
  return execFileSync(
    "git",
    [
      "-C",
      cwd,
      "-c",
      "user.email=t154@example.invalid",
      "-c",
      "user.name=T-154 fixture",
      ...NO_BACKGROUND_MAINTENANCE,
      ...args,
    ],
    { encoding: "utf8" },
  );
}

/** The fixture card's id, its slug token, and what that slug reserves. */
const FIXTURE_ID = "T-901";
const FIXTURE_SLUG = "fixture-lens";
const FIXTURE_SLUG_PATH = "app/src/fixture";
const FIXTURE_CARD = `docs/tasks/${FIXTURE_ID}-a-card-the-guard-is-measured-on.md`;
const FIXTURE_TOUCHES = `touches: [tools/e2e, ${FIXTURE_SLUG}]`;

interface Fixture {
  /** The integration checkout — on `main`, holding no fence. */
  repo: string;
  /** The lane worktree — on a `task/T-NNN-…` branch. */
  lane: string;
  /** A detached sibling worktree — a drill checkout, and not a lane. */
  drill: string;
}

function writeFixtureFile(root: string, rel: string, content: string): void {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content, "utf8");
}

/**
 * A whole fixture world: an integration checkout, a lane worktree cut
 * from it, and a detached drill worktree beside them.
 *
 * docs/CONVENTIONS.md IS COPIED IN RATHER THAN FAKED, because
 * `laneSpellings` reads the branch pattern out of its lane bullet and a
 * hand-written stand-in would be a second copy of the very spelling
 * these bodies exist to compare. docs/ROADMAP.md is copied for the same
 * reason one layer down: the parser parses it, and a minimal invention
 * would be testing the invention.
 */
function makeFixture(touchesLine = FIXTURE_TOUCHES): Fixture {
  const root = scratchRoot();
  const repo = path.join(root, "repo");
  mkdirSync(repo, { recursive: true });
  git(repo, ["init", "--initial-branch=main", "--quiet"]);

  // T-290: the conventions are an index AND its chapters, and the set is
  // DERIVED — a list of chapter names here would go stale the day one is
  // added, and the failure would read as this hook's rather than this
  // fixture's.
  for (const rel of [...conventionsFiles(repoRoot), "docs/ROADMAP.md"]) {
    const dest = path.join(repo, rel);
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(path.join(repoRoot, rel), dest);
  }
  writeFixtureFile(
    repo,
    "docs/architecture/components/C-90-fixture-lens.md",
    [
      "---",
      "id: C-90",
      "name: Fixture lens",
      "layer: app",
      "paths:",
      `  - ${FIXTURE_SLUG_PATH}/**`,
      "depends_on: []",
      "decisions: []",
      "status: auto",
      `touch_slugs: [${FIXTURE_SLUG}]`,
      "---",
      "A component that exists so a fence token can be a SLUG rather than a",
      "path, and so the manifest can be shown carrying an expansion the hook",
      "could not have computed for itself.",
      "",
    ].join("\n"),
  );
  writeFixtureFile(
    repo,
    FIXTURE_CARD,
    [
      "---",
      `id: ${FIXTURE_ID}`,
      "title: A card the guard is measured on",
      "feature: F-04",
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
      "The fixture card. Its body deliberately contains a second line",
      "reading like a fence, to prove the extraction is scoped to the",
      "frontmatter:",
      "",
      "touches: [app/src-tauri, docs/STATE.md]",
      "",
    ].join("\n"),
  );
  writeFixtureFile(repo, FIXTURE_SLUG_PATH + "/lens.ts", "export const lens = 1;\n");
  writeFixtureFile(repo, "app/src/main.tsx", "export const main = 1;\n");
  writeFixtureFile(repo, "tools/e2e/tests/fixture.spec.ts", "export const spec = 1;\n");
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "-m", "fixture base", "--quiet"]);

  const lane = path.join(root, `supertaskr-${FIXTURE_ID}`);
  git(repo, ["worktree", "add", "--quiet", "-b", `task/${FIXTURE_ID}-guard-fixture`, lane]);
  const drill = path.join(root, `supertaskr-${FIXTURE_ID}-drill`);
  git(repo, ["worktree", "add", "--quiet", "--detach", drill]);
  return { repo, lane, drill };
}

/** Arm the lane: the dispatch step, run for real against the fixture. */
async function arm(fx: Fixture): Promise<Awaited<ReturnType<typeof buildLaneFence>>> {
  const manifest = await buildLaneFence(FIXTURE_ID, fx.lane, { root: fx.repo, at: "2026-01-01T00:00:00.000Z" });
  writeLaneFence(manifest);
  return manifest;
}

/**
 * A SECOND live lane beside the first — a real sibling, cut and armed
 * the way dispatch cuts one.
 *
 * The lane-less arm reads EVERY live lane, and a fixture with one lane
 * cannot tell "every" from "the first": a hook that stopped at
 * `lanes[0]` would pass every body a single-lane world can write. So the
 * card is committed into the fixture repository (the board is
 * `git ls-files`, so an uncommitted card is not on it), its worktree is
 * cut, and the real writer arms it.
 */
async function addLane(
  fx: Fixture,
  id: string,
  touchesLine: string,
): Promise<{ lane: string; manifest: Awaited<ReturnType<typeof buildLaneFence>> }> {
  const lane = await cutLane(fx, id, touchesLine);
  const manifest = await buildLaneFence(id, lane, { root: fx.repo, at: "2026-01-01T00:00:00.000Z" });
  writeLaneFence(manifest);
  return { lane, manifest };
}

/**
 * The half of `addLane` that CUTS but does not ARM (T-209).
 *
 * A lane exists on disk from the moment its worktree is cut and holds no
 * manifest until `--write-fence` runs, and the intersection has to be
 * measured on both sides of that moment: an OVERLAPPING sibling can no
 * longer be armed once the first lane holds the ground, so a body that
 * needs one has to cut it and then watch the arm be refused. Split out of
 * `addLane` rather than copied, so the two cannot drift in how they build
 * a card.
 */
async function cutLane(fx: Fixture, id: string, touchesLine: string): Promise<string> {
  const card = `docs/tasks/${id}-a-sibling-lane.md`;
  writeFixtureFile(
    fx.repo,
    card,
    [
      "---",
      `id: ${id}`,
      "title: A sibling lane the guard must also see",
      "feature: F-04",
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
    ].join("\n"),
  );
  git(fx.repo, ["add", "-A"]);
  git(fx.repo, ["commit", "-m", `fixture lane ${id}`, "--quiet"]);
  const lane = path.join(path.dirname(fx.lane), `supertaskr-${id}`);
  git(fx.repo, ["worktree", "add", "--quiet", "-b", `task/${id}-sibling`, lane]);
  return lane;
}

/** One PreToolUse request, as the harness shapes it. */
function ask(cwd: string, filePath: string, toolName = "Write"): ReturnType<typeof decide> {
  return decide({ toolName, cwd, toolInput: { file_path: filePath } });
}

/* ────────────────────────────────────────────────────────────────────
 * THE POSITIVE CONTROL — refusal has to be distinguishable from absence
 * ──────────────────────────────────────────────────────────────────── */

test("the SAME write is refused in the lane and allowed in the integration checkout", async () => {
  const fx = makeFixture();
  await arm(fx);

  // The guard's STATE first, both sides, before either verdict is read.
  expect(readHeadRef(fx.lane), "the lane fixture is not on a lane branch").toBe(
    `refs/heads/task/${FIXTURE_ID}-guard-fixture`,
  );
  expect(readHeadRef(fx.repo), "the integration fixture is not on main").toBe("refs/heads/main");
  expect(existsSync(path.join(fx.lane, MANIFEST_REL_PATH)), "the lane was never armed").toBe(true);
  expect(existsSync(path.join(fx.repo, MANIFEST_REL_PATH)), "the control carries a manifest").toBe(
    false,
  );

  const refused = ask(fx.lane, path.join(fx.lane, "app/src/main.tsx"));
  const allowed = ask(fx.repo, path.join(fx.repo, "app/src/main.tsx"));

  expect(refused.verdict, refused.reason).toBe("block");
  expect(refused.code).toBe("outside-the-fence");
  // ONE repository-relative path, two checkouts, two answers. Without
  // this pair an "allow" proves only that nothing was armed.
  expect(allowed.verdict, allowed.reason).toBe("allow");
  expect(allowed.code).toBe("not-a-lane");
});

test("a DETACHED worktree is not a lane, and the drill it stands for is not blocked", async () => {
  const fx = makeFixture();
  await arm(fx);

  expect(readHeadRef(fx.drill), "the drill fixture is not detached").toBeUndefined();
  expect(
    findCheckoutRoot(fx.drill),
    "the drill worktree's own .git pointer was not followed",
  ).toBe(fx.drill);

  const inDrill = ask(fx.drill, path.join(fx.drill, "app/src/main.tsx"));
  expect(inDrill.verdict, inDrill.reason).toBe("allow");
  expect(inDrill.code).toBe("not-judged-detached");
  expect(inDrill.judged, "limit 3 is a DECLINE and must say so").toBe(false);
  // The discriminating half: the same relative path in the LANE is
  // refused, so this allow is a decision and not an inert hook.
  expect(ask(fx.lane, path.join(fx.lane, "app/src/main.tsx")).verdict).toBe("block");
});

test("a directory that is no repository at all is not a lane", () => {
  const outside = scratchRoot();
  expect(findCheckoutRoot(outside), "the scratch root sits inside some repository").toBe(undefined);
  const verdict = decide({
    toolName: "Write",
    cwd: outside,
    toolInput: { file_path: path.join(outside, "anything.txt") },
  });
  expect(verdict.verdict, verdict.reason).toBe("allow");
  expect(verdict.code).toBe("not-a-repository");
});

/* ────────────────────────────────────────────────────────────────────
 * THE FOUR ARMS OF THE MECHANISM
 * ──────────────────────────────────────────────────────────────────── */

test("a lane branch with NO manifest blocks — dispatch skipped its step", () => {
  const fx = makeFixture();
  expect(readHeadRef(fx.lane)).toBe(`refs/heads/task/${FIXTURE_ID}-guard-fixture`);
  expect(existsSync(path.join(fx.lane, MANIFEST_REL_PATH)), "this arm needs an UNARMED lane").toBe(
    false,
  );

  // Not merely "some write": the path INSIDE the fence is refused too,
  // which is what makes this a missing-manifest arm rather than a
  // slower spelling of the outside-the-fence arm.
  const inside = ask(fx.lane, path.join(fx.lane, "tools/e2e/tests/fixture.spec.ts"));
  expect(inside.verdict, inside.reason).toBe("block");
  expect(inside.code).toBe("no-manifest");
  expect(inside.reason).toContain("--write-fence");
});

test("a path inside the manifest is allowed, through a PATH token and through a SLUG", async () => {
  const fx = makeFixture();
  const manifest = await arm(fx);

  // The guard's state: this lane IS armed, and the fence it holds is the
  // EXPANDED one — the slug is gone and the component's paths are there,
  // which is the half the hook could never have computed for itself.
  expect(manifest.paths).toContain("tools/e2e");
  expect(manifest.paths, "the slug did not expand through fence.ts").toContain(FIXTURE_SLUG_PATH);
  expect(manifest.paths).not.toContain(FIXTURE_SLUG);

  const viaPath = ask(fx.lane, path.join(fx.lane, "tools/e2e/tests/fixture.spec.ts"));
  const viaSlug = ask(fx.lane, path.join(fx.lane, `${FIXTURE_SLUG_PATH}/lens.ts`));
  expect(viaPath.verdict, viaPath.reason).toBe("allow");
  expect(viaPath.code).toBe("inside-the-fence");
  expect(viaSlug.verdict, viaSlug.reason).toBe("allow");
  expect(viaSlug.code).toBe("inside-the-fence");
  // Both allows are discriminating: a sibling directory the slug does
  // NOT reserve is refused in the same lane, in the same run.
  expect(ask(fx.lane, path.join(fx.lane, "app/src/main.tsx")).verdict).toBe("block");
});

test("an outside write is refused NAMING the fence, the path and the route", async () => {
  const fx = makeFixture();
  const manifest = await arm(fx);
  const verdict = ask(fx.lane, path.join(fx.lane, "app/src/main.tsx"));

  expect(verdict.verdict).toBe("block");
  expect(verdict.code).toBe("outside-the-fence");
  // The three the criterion names, each asserted on its own.
  expect(verdict.reason, "the fence is not named").toContain(manifest.touchesLine);
  for (const domain of manifest.paths) expect(verdict.reason).toContain(domain);
  expect(verdict.reason, "the path is not named").toContain("app/src/main.tsx");
  expect(verdict.reason, "the route is not named").toContain(ROUTE);
  expect(ROUTE, "the route stopped naming the protocol rule it comes from").toContain(
    "method/lane-protocol.md rule 5",
  );
});

test("docs/tasks is always writable, and the hook takes that set from the parser", async () => {
  const fx = makeFixture();
  const manifest = await arm(fx);

  // The set is CARRIED, never restated: it is the parser's own
  // UNFENCEABLE_PATHS, stamped at dispatch and read here.
  expect(manifest.alwaysWritable).toEqual(["docs/tasks"]);
  expect(manifest.paths, "docs/tasks leaked into the fence itself").not.toContain("docs/tasks");

  const ownCard = ask(fx.lane, path.join(fx.lane, FIXTURE_CARD));
  const otherCard = ask(fx.lane, path.join(fx.lane, "docs/tasks/T-902-a-suggestion.md"));
  expect(ownCard.verdict, ownCard.reason).toBe("allow");
  expect(ownCard.code).toBe("always-writable");
  expect(otherCard.verdict, otherCard.reason).toBe("allow");
  // Discriminating: a docs/ path that is NOT under docs/tasks is refused,
  // so this is a carve-out and not a blanket pass for docs/.
  expect(ask(fx.lane, path.join(fx.lane, "docs/STATE.md")).verdict).toBe("block");
});

test("a card whose touches line moved under the lane blocks with `re-expand`", async () => {
  const fx = makeFixture();
  const manifest = await arm(fx);
  const card = path.join(fx.lane, FIXTURE_CARD);

  // Armed and quiet first: the write is allowed before the card moves.
  expect(ask(fx.lane, path.join(fx.lane, "tools/e2e/x.ts")).verdict).toBe("allow");

  // Widening the fence from inside the lane — the one repair
  // method/lane-protocol.md rule 5 says an executor may never make.
  const widened = readFileSync(card, "utf8").replace(
    FIXTURE_TOUCHES,
    "touches: [tools/e2e, fixture-lens, app/src]",
  );
  expect(widened, "the fixture card no longer carries the line this body edits").not.toBe(
    readFileSync(card, "utf8"),
  );
  writeFileSync(card, widened, "utf8");

  const verdict = ask(fx.lane, path.join(fx.lane, "app/src/main.tsx"));
  expect(verdict.verdict).toBe("block");
  expect(verdict.code).toBe("stale-stamp");
  expect(verdict.reason).toContain("Re-expand the fence");
  expect(verdict.reason).toContain(manifest.touchesLine);
  // AND THE WIDENING BUYS NOTHING: even the paths the card now claims
  // are refused, because the hook stopped trusting the manifest rather
  // than starting to trust the card.
  expect(ask(fx.lane, path.join(fx.lane, "tools/e2e/x.ts")).code).toBe("stale-stamp");
});

/** What `halfDeliveredGrant` adds to the fence, and the file under it. */
const WIDENED_TOUCHES = `${FIXTURE_TOUCHES.slice(0, -1)}, app/src]`;
const WIDENED_PATH = "app/src";
const NEWLY_GRANTED = "app/src/main.tsx";

/**
 * THE WINDOW'S OTHER HALF, BUILT ONCE (T-228).
 *
 * The body above opens the window by moving the LANE's card. This builds
 * the half `method/roles/executor.md`'s fast path A describes and the
 * one T-228 is filed about: the DISPATCH moved — the integration branch
 * amended and the fence re-expanded — and the lane's own copy of the
 * card has not caught up. **Only in this half does the stale manifest
 * actually CARRY the newly granted path**, so it is the only half where
 * consulting `paths` before comparing the stamp could hand that path
 * over, and the only half where refusing it is a measurement.
 *
 * The disagreement is ASSERTED here rather than left to each body: a
 * setup that silently failed to open the window would satisfy every
 * refusal below for the wrong reason.
 */
async function halfDeliveredGrant(fx: Fixture): Promise<{
  manifest: Awaited<ReturnType<typeof arm>>;
  laneCard: string;
  staleLine: string;
}> {
  const repoCard = path.join(fx.repo, FIXTURE_CARD);
  const laneCard = path.join(fx.lane, FIXTURE_CARD);
  const staleLine = readFileSync(laneCard, "utf8");
  const widened = readFileSync(repoCard, "utf8").replace(FIXTURE_TOUCHES, WIDENED_TOUCHES);
  expect(widened, "the fixture card no longer carries the line this helper edits").not.toBe(
    readFileSync(repoCard, "utf8"),
  );
  writeFileSync(repoCard, widened, "utf8");
  git(fx.repo, ["add", "-A"]);
  git(fx.repo, ["commit", "-m", "widen the fixture card on the integration branch", "--quiet"]);
  const manifest = await arm(fx);

  expect(manifest.paths, "the re-arm did not widen the manifest").toContain(WIDENED_PATH);
  expect(readFileSync(laneCard, "utf8"), "the LANE's card moved, so this is the other half").toBe(
    staleLine,
  );
  expect(touchesLineOf(staleLine), "the window did not open").not.toBe(manifest.touchesLine);
  return { manifest, laneCard, staleLine };
}

test("the UNFENCEABLE directory stays open while the card and the manifest disagree", async () => {
  const fx = makeFixture();
  await arm(fx);
  const neverGranted = path.join(fx.lane, "docs/STATE.md");
  const suggestion = path.join(
    fx.lane,
    `docs/tasks/${FIXTURE_ID}-s1-a-finding-routed-from-inside-the-window.md`,
  );

  // THE GUARD'S STATE FIRST, as docs/CONVENTIONS.md's LIFTING A SAFETY
  // GUARD TO DISCRIMINATE requires of every allow in this file. With a
  // CURRENT stamp the never-granted path is ALREADY refused, so the
  // allows below cannot be a fence that failed to arm — and this is
  // also T-228's third criterion, the ordinary refusal proved unmoved.
  const armed = ask(fx.lane, neverGranted);
  expect(armed.verdict, armed.reason).toBe("block");
  expect(armed.code, "the fence never granted docs/STATE.md").toBe("outside-the-fence");

  const { manifest, laneCard } = await halfDeliveredGrant(fx);

  // THE WINDOW IS OPEN, AND THE SAME PATH SAYS SO BY CHANGING ITS
  // REASON: the stale-stamp arm is now the one answering, not the fence.
  const inWindow = ask(fx.lane, neverGranted);
  expect(inWindow.verdict, inWindow.reason).toBe("block");
  expect(inWindow.code, "the window is not open, so this body proves nothing").toBe("stale-stamp");
  expect(inWindow.reason).toContain(manifest.touchesLine);

  // AND THE ONE DIRECTORY NO CARD MAY FENCE IS STILL OPEN. These are the
  // writes the window used to suspend — a lane's own exit stamp and its
  // notes on the card, and the finding it would route beside it — and
  // `method/lane-protocol.md` rule 5 is why a write here can never be a
  // fence breach: the protocol itself writes to this directory on every
  // card, which is why no card may hold it.
  for (const [what, target] of [
    ["the lane's own card", laneCard],
    ["a finding routed from inside the window", suggestion],
  ] as const) {
    const verdict = ask(fx.lane, target);
    expect(verdict.verdict, `${what}: ${verdict.reason}`).toBe("allow");
    expect(verdict.code, what).toBe("always-writable");
  }
});

test("a HALF-DELIVERED grant is still refused ON THE PATH IT GRANTED", async () => {
  const fx = makeFixture();
  await arm(fx);

  // ARMED AND QUIET FIRST: before the grant moves, the newly granted
  // path is outside the fence — so the refusal below is not a path that
  // was never reachable, and the manifest's own widening is what this
  // body is about.
  expect(ask(fx.lane, path.join(fx.lane, NEWLY_GRANTED)).code).toBe("outside-the-fence");

  const { manifest } = await halfDeliveredGrant(fx);

  // THE MANIFEST NOW CARRIES IT AND THE HOOK STILL WILL NOT HAND IT
  // OVER. An executor writes NEITHER HALF of its own grant
  // (method/roles/executor.md), so a manifest its card does not agree
  // with buys nothing: the stale manifest's `paths` stay untrusted.
  // **THIS IS THE ARM THAT REDS IF THE STALE-STAMP CHECK MOVES TO THE
  // END** — the obvious repair of T-228, which would answer
  // `inside-the-fence` here and quietly delete the two-agreeing-files
  // property `T-211` wrote into the law.
  const granted = ask(fx.lane, path.join(fx.lane, NEWLY_GRANTED));
  expect(granted.verdict, granted.reason).toBe("block");
  expect(granted.code).toBe("stale-stamp");
  expect(granted.reason).toContain("Re-expand the fence");
  expect(manifest.paths, "the manifest stopped granting the path this body is about").toContain(
    WIDENED_PATH,
  );
});

test("a manifest the hook cannot read is a refusal, never a shrug", async () => {
  const fx = makeFixture();
  await arm(fx);
  const file = path.join(fx.lane, MANIFEST_REL_PATH);

  for (const [label, content] of [
    ["not JSON", "{ this is not json"],
    ["not an object", "[]"],
    ["a version this reader does not know", JSON.stringify({ version: MANIFEST_VERSION + 1 })],
    ["missing a field", JSON.stringify({ version: MANIFEST_VERSION, taskId: FIXTURE_ID })],
    // `excluded` joined the fields this reader requires at T-154-s2 for
    // the lane-less arm's own-card carve-out, and since T-219-s3 removed
    // that arm it is a SHAPE check and nothing reads the field: a
    // manifest missing it was written by a writer older than T-154-s2,
    // and a reader that guesses at an unknown shape under-reserves. The
    // writer has stamped it since T-154; requiring it is the reader
    // holding the schema, not a new demand.
    [
      "missing the excluded field this reader requires of a manifest's SHAPE",
      JSON.stringify({
        version: MANIFEST_VERSION,
        taskId: FIXTURE_ID,
        branch: "refs/heads/task/T-901-guard-fixture",
        card: FIXTURE_CARD,
        touchesLine: FIXTURE_TOUCHES,
        paths: ["tools/e2e"],
        alwaysWritable: ["docs/tasks"],
      }),
    ],
  ] as const) {
    writeFileSync(file, content, "utf8");
    const verdict = ask(fx.lane, path.join(fx.lane, "tools/e2e/tests/fixture.spec.ts"));
    expect(verdict.verdict, `${label} was not refused`).toBe("block");
    expect(verdict.code, label).toBe("no-manifest");
  }
});

test("in a lane, a request with no readable path is refused rather than waved through", async () => {
  const fx = makeFixture();
  await arm(fx);

  const blind = decide({ toolName: "Write", cwd: fx.lane, toolInput: {} });
  expect(blind.verdict, blind.reason).toBe("block");
  expect(blind.code).toBe("unreadable-request");

  // THE SPELLINGS ARE NAMED LITERALLY, NOT LOOPED OVER THE CONSTANT
  // UNDER TEST. This body's first draft iterated WRITE_TOOL_PATH_FIELDS,
  // so shrinking that array to one member deleted the array's own check
  // and the drill went green at 25 of 25 — poison shape FIVE, and T-063's
  // "a test parametrised by the constant it checks cannot pin that
  // constant". Both spellings are here because the harness's own hook
  // examples and its tool reference disagree about which one it is.
  for (const field of ["file_path", "path", "notebook_path"] as const) {
    expect([...WRITE_TOOL_PATH_FIELDS], `${field} is no longer a spelling this hook reads`).toContain(
      field,
    );
    expect(blind.reason, `${field} is not named in the refusal`).toContain(field);
    const seen = decide({
      toolName: "Write",
      cwd: fx.lane,
      toolInput: { [field]: "app/src/main.tsx" },
    });
    expect(seen.code, `${field} was not read as the target path`).toBe("outside-the-fence");
  }
  // And outside a lane the same blind request is allowed, so the refusal
  // above costs an integrator nothing.
  expect(decide({ toolName: "Write", cwd: fx.repo, toolInput: {} }).verdict).toBe("allow");
});

test("a path in NO git checkout is not judged, and the narrowed limit is declared", async () => {
  const fx = makeFixture();
  await arm(fx);
  const elsewhere = path.join(scratchRoot(), "notes.md");
  expect(findCheckoutRoot(elsewhere), "the scratch path sits inside some repository").toBe(
    undefined,
  );

  // THE SCRATCHPAD AND /tmp ARE WHAT LIMIT 2 IS FOR, and all that is
  // left of it after T-199: the target sits in no repository, so no
  // manifest's repository-relative domains reach it.
  const verdict = ask(fx.lane, elsewhere);
  expect(verdict.verdict, verdict.reason).toBe("allow");
  expect(verdict.code).toBe("not-a-repository");
  expect(verdict.judged, "a decline that reports itself as a judgement is the T-199 defect").toBe(
    false,
  );
  // The guard is still armed in the same call — the discriminating half.
  expect(ask(fx.lane, path.join(fx.lane, "app/src/main.tsx")).code).toBe("outside-the-fence");
  // The limit is not merely true, it is WRITTEN where the next reader is.
  const header = readFileSync(path.join(repoRoot, ".claude/hooks/lane-fence.mjs"), "utf8");
  expect(header, "the narrowed limit 2 is no longer declared in the hook's header").toContain(
    "A PATH IN NO GIT CHECKOUT AT ALL IS NOT JUDGED",
  );
  expect(
    header,
    "the header still claims the limit T-199 deleted — the sentence that made the guard inert",
  ).not.toContain("A PATH OUTSIDE THE LANE'S OWN CHECKOUT IS ALLOWED");
  expect(header, "the Bash limit the card asks for is not declared").toContain(
    "BASH-MEDIATED WRITES ARE NOT COVERED",
  );
});

/* ────────────────────────────────────────────────────────────────────
 * THE DISPATCH STEP — the writer, and what it refuses
 * ──────────────────────────────────────────────────────────────────── */

test("the manifest is stamped with the card's RAW touches line, taken from the frontmatter", async () => {
  const fx = makeFixture();
  const manifest = await arm(fx);

  expect(manifest.touchesLine).toBe(FIXTURE_TOUCHES);
  expect(manifest.card).toBe(FIXTURE_CARD);
  expect(manifest.branch).toBe(`refs/heads/task/${FIXTURE_ID}-guard-fixture`);
  expect(manifest.version).toBe(MANIFEST_VERSION);
  // The body's decoy: the fixture card repeats a DIFFERENT touches line
  // in its prose, and a whole-file match would have stamped that one.
  expect(readFileSync(path.join(fx.repo, FIXTURE_CARD), "utf8")).toContain(
    "touches: [app/src-tauri, docs/STATE.md]",
  );
  expect(manifest.touchesLine).not.toContain("app/src-tauri");
});

test("the writer REFUSES a fence it could not fully expand, and writes nothing", async () => {
  const fx = makeFixture("touches: [tools/e2e, a-word-that-names-nothing]");
  await expect(buildLaneFence(FIXTURE_ID, fx.lane, { root: fx.repo })).rejects.toThrow(
    /could not resolve/,
  );
  expect(
    existsSync(path.join(fx.lane, MANIFEST_REL_PATH)),
    "a fence that could not be expanded was written anyway",
  ).toBe(false);
  // And the lane is therefore CLOSED rather than open: no manifest on a
  // lane branch is the second arm, so a half-run dispatch fails safe.
  expect(ask(fx.lane, path.join(fx.lane, "tools/e2e/tests/fixture.spec.ts")).code).toBe(
    "no-manifest",
  );
});

test("the writer refuses a worktree that is not this card's lane", async () => {
  const fx = makeFixture();
  await expect(buildLaneFence(FIXTURE_ID, fx.repo, { root: fx.repo })).rejects.toThrow(
    /not a lane branch/,
  );
  await expect(buildLaneFence(FIXTURE_ID, fx.drill, { root: fx.repo })).rejects.toThrow(
    /not a lane branch/,
  );
  expect(existsSync(path.join(fx.repo, MANIFEST_REL_PATH))).toBe(false);
  expect(existsSync(path.join(fx.drill, MANIFEST_REL_PATH))).toBe(false);
});

test("the manifest cannot be committed into the tree everyone else reads", async () => {
  const fx = makeFixture();
  await arm(fx);
  expect(readFileSync(path.join(fx.lane, ".supertaskr/.gitignore"), "utf8")).toBe(MANIFEST_DIR_IGNORE);
  // The property, asked of GIT rather than asserted about the file: a
  // manifest that reached the integration branch would hand every
  // checkout one lane's permanently stale fence, which is the guard's
  // own worst failure.
  expect(existsSync(path.join(fx.lane, MANIFEST_REL_PATH)), "nothing was written").toBe(true);
  expect(git(fx.lane, ["status", "--porcelain"]).trim()).toBe("");
  const ignored = spawnSync("git", ["-C", fx.lane, "check-ignore", "-q", MANIFEST_REL_PATH]);
  expect(ignored.status, "git does not consider the manifest ignored").toBe(0);
});

test("`--write-fence` is a NAMED arm of the brief command, and needs its task", () => {
  const cli = path.join(repoRoot, "tools", "e2e", "scripts", "brief.mjs");
  const run = (args: string[]) =>
    spawnSync(process.execPath, [cli, ...args], { cwd: repoRoot, encoding: "utf8" });

  const noTask = run(["--write-fence", "/nonexistent"]);
  expect(noTask.status, "a fence with no card is a usage error").toBe(2);
  expect(noTask.stderr).toContain("--write-fence needs --task");
  expect(run(["--help"]).stdout).toContain("--write-fence");
});

/* ────────────────────────────────────────────────────────────────────
 * THE COPIES THIS DESIGN COULD NOT AVOID, COMPARED RATHER THAN TRUSTED
 * ──────────────────────────────────────────────────────────────────── */

test("the hook's lane-branch spelling is the one docs/CONVENTIONS.md publishes", () => {
  // UNNESTED ON PURPOSE. `docs-scan.mjs`'s call arm follows ONE hop and
  // says so — `f(g(root))` is named in its own WHAT IT CANNOT SEE — so
  // a nested spelling here would hide this file from the DOCS GATE's
  // reader derivation while it really does read docs/CONVENTIONS.md.
  const conventions = conventionsText(repoRoot);
  const published = laneSpellings(conventions);
  expect(published.branchPattern, "the lane bullet's branch spelling moved").toContain("T-NNN");

  // The two matchers are compared by BEHAVIOUR over samples built from
  // the published pattern, because two regexes can be written differently
  // and mean the same thing — and the samples are built here from the
  // document's own spelling, so a change to it moves them with it.
  const sample = (id: string) =>
    `refs/heads/${published.branchPattern.replace("T-NNN", id).replace("<slug>", "some-slug")}`;
  for (const id of ["T-001", "T-154", "T-9999"]) {
    expect(LANE_BRANCH_RE.test(sample(id)), `${sample(id)} is not read as a lane`).toBe(true);
    expect(published.branchRe.test(sample(id))).toBe(true);
  }
  for (const near of [
    "refs/heads/main",
    "refs/heads/task/T-154",
    "refs/heads/t154-old-spelling",
    "refs/heads/tasks/T-154-plural",
    "refs/heads/feature/task/T-154-nested",
  ]) {
    expect(LANE_BRANCH_RE.test(near), `${near} is read as a lane and is not one`).toBe(false);
    expect(published.branchRe.test(near)).toBe(false);
  }
});

test("the writer puts the manifest exactly where the reader opens it, at one version", async () => {
  const fx = makeFixture();
  await arm(fx);

  // BEHAVIOURAL, not an identity. An earlier draft of this body compared
  // two constants the writer IMPORTS from the hook — one fact wearing a
  // cross-check's costume, which no one-sided mutation could red. What
  // is checkable is that the file this writer produced is the file that
  // reader opens, and that the reader accepts its stamped version.
  const onDisk = path.join(fx.lane, MANIFEST_REL_PATH);
  expect(existsSync(onDisk), "the writer wrote somewhere the reader does not look").toBe(true);
  expect(JSON.parse(readFileSync(onDisk, "utf8")).version).toBe(MANIFEST_VERSION);
  expect(ask(fx.lane, path.join(fx.lane, "tools/e2e/x.ts")).code).toBe("inside-the-fence");
  expect(MANIFEST_REL_PATH, "the manifest left the runtime directory").toMatch(/^\.supertaskr\//);

  // AND THE SOURCE PIN THAT MAKES IT ONE FACT: the writer must not hold
  // its own spelling of either constant, it must take the reader's.
  const writer = readFileSync(path.join(repoRoot, "tools/e2e/scripts/lane-fence.mjs"), "utf8");
  expect(writer, "the writer defines a second manifest constant").not.toMatch(
    /^export const MANIFEST_(REL_PATH|VERSION)\b/m,
  );
  expect(writer, "the writer stopped importing the reader's constants").toMatch(
    /MANIFEST_REL_PATH,[\s\S]{0,200}from "\.\.\/\.\.\/\.\.\/\.claude\/hooks\/lane-fence\.mjs"/,
  );
});

test("ONE `touches:` extraction, and it agrees with `yaml` on every live card", () => {
  const cards = liveTaskCards(repoRoot);
  expect(cards.length, "the live board is empty, so this body proves nothing").toBeGreaterThan(20);

  let withTouches = 0;
  for (const card of cards) {
    const line = touchesLineOf(card.content);
    const block = /^---\r?\n([\s\S]*?)\r?\n---\r?$/m.exec(card.content);
    expect(block, `${card.path} has no frontmatter block`).not.toBeNull();
    const front = parseYaml((block as RegExpExecArray)[1] ?? "") as Record<string, unknown>;
    const declared = front["touches"];
    if (declared === undefined) {
      expect(line, `${card.path} has no touches field but the extraction found a line`).toBe(
        undefined,
      );
      continue;
    }
    withTouches += 1;
    expect(line, `${card.path}: the extraction found no touches line`).toBeDefined();
    // The extracted LINE, parsed by the same `yaml` the parser uses,
    // must reproduce the field the whole frontmatter declares — which
    // is what makes one extraction rather than two.
    expect(parseYaml(line as string), `${card.path}: the line and the field disagree`).toEqual({
      touches: declared,
    });
  }
  expect(withTouches, "no live card declares touches, so the agreement is vacuous").toBeGreaterThan(
    20,
  );
});

test("the frontmatter is where a fence lives — a body line is never read as one", () => {
  const body = ["---", "id: T-900", "---", "", "touches: [everything]", ""].join("\n");
  expect(touchesLineOf(body)).toBe(undefined);
  expect(touchesLineOf("no frontmatter here\ntouches: [everything]\n")).toBe(undefined);
  expect(touchesLineOf(["---", "touches: [a, b]", "---", ""].join("\n"))).toBe("touches: [a, b]");
});

test("containment is the path rule, and a name that merely starts the same is not inside", () => {
  expect(within("tools/e2e", "tools/e2e")).toBe(true);
  expect(within("tools/e2e/tests/x.ts", "tools/e2e")).toBe(true);
  expect(within("tools/e2e-extra/x.ts", "tools/e2e")).toBe(false);
  expect(within("tools", "tools/e2e")).toBe(false);
});

/* ────────────────────────────────────────────────────────────────────
 * THE WIRING, AND THE BOOTSTRAP PROPERTY THE WHOLE DESIGN RESTS ON
 * ──────────────────────────────────────────────────────────────────── */

const HOOK_FILES = [".claude/hooks/lane-fence.mjs", ".claude/hooks/lane-fence-hook.mjs"] as const;

test("the hook depends on NOTHING a fresh worktree lacks", () => {
  let specifiers = 0;
  for (const rel of HOOK_FILES) {
    const source = readFileSync(path.join(repoRoot, rel), "utf8");
    const found = [...source.matchAll(/^\s*(?:import|export)[^\n]*?from\s+"([^"]+)"/gm)].map(
      (m) => m[1] as string,
    );
    expect(found.length, `${rel} has no imports at all, so this scan proves nothing`).toBeGreaterThan(
      0,
    );
    specifiers += found.length;
    for (const spec of found) {
      // A node builtin, or the other half of this pair. Anything else —
      // a package, a path into lib/parser/dist, a path into tools/ —
      // makes the guard need an install, and a fresh lane worktree has
      // none: the bootstrap contradiction this card was redesigned to
      // remove would be back.
      expect(
        spec.startsWith("node:") || spec === "./lane-fence.mjs",
        `${rel} imports ${spec}, which a freshly cut worktree may not have`,
      ).toBe(true);
    }
  }
  expect(specifiers, "the scan matched nothing in either file").toBeGreaterThan(2);
});

test("the PreToolUse hook is wired for the file-writing tools, and leaves room for a second source", () => {
  const settings = JSON.parse(readFileSync(path.join(repoRoot, ".claude/settings.json"), "utf8"));
  const pre = settings?.hooks?.PreToolUse;
  // ADR-020 decision 6: the managed tier is a named slot, so the config
  // shape must not preclude a second source. An ARRAY of matchers can
  // gain one; a single object could not.
  expect(Array.isArray(pre), "PreToolUse is not a list a second source could join").toBe(true);
  expect(pre.length).toBeGreaterThan(0);

  const entry = pre.find((e: { matcher?: string }) => (e.matcher ?? "").includes("Write"));
  expect(entry, "no PreToolUse entry matches Write").toBeDefined();
  const matched = String(entry.matcher).split("|");
  for (const tool of ["Edit", "Write"]) {
    expect(matched, `${tool} is not matched, so its writes are unguarded`).toContain(tool);
  }
  const commands = entry.hooks.map((h: { command: string }) => h.command).join(" ");
  expect(commands).toContain(".claude/hooks/lane-fence-hook.mjs");
  expect(existsSync(path.join(repoRoot, ".claude/hooks/lane-fence-hook.mjs"))).toBe(true);
});

test("the runner answers in EXIT CODES — block is 2 with the reason on stderr, allow is a silent 0", async () => {
  const fx = makeFixture();
  await arm(fx);
  const hook = path.join(repoRoot, ".claude/hooks/lane-fence-hook.mjs");
  const call = (cwd: string, filePath: string) =>
    spawnSync(process.execPath, [hook], {
      input: JSON.stringify({
        hook_event_name: "PreToolUse",
        tool_name: "Write",
        cwd,
        tool_input: { file_path: filePath },
      }),
      encoding: "utf8",
    });

  const blocked = call(fx.lane, path.join(fx.lane, "app/src/main.tsx"));
  expect(blocked.status, "an outside write was not refused by exit code").toBe(2);
  expect(blocked.stderr).toContain("LANE FENCE");
  expect(blocked.stdout, "a refusal that prints on stdout depends on being parsed").toBe("");

  const allowed = call(fx.lane, path.join(fx.lane, "tools/e2e/tests/fixture.spec.ts"));
  expect(allowed.status).toBe(0);
  // SILENT ON PURPOSE: an explicit allow verdict would short-circuit the
  // harness's own permission flow. This hook subtracts permission and
  // never grants it.
  expect(allowed.stdout, "the allow arm speaks, and an allow that speaks can grant").toBe("");

  // The control checkout, through the same process boundary.
  const control = call(fx.repo, path.join(fx.repo, "app/src/main.tsx"));
  expect(control.status, control.stderr).toBe(0);
});

test("an unreadable request costs an integrator nothing and buys an executor nothing", async () => {
  const fx = makeFixture();
  await arm(fx);
  const hook = path.join(repoRoot, ".claude/hooks/lane-fence-hook.mjs");
  const garbage = (cwd: string) =>
    spawnSync(process.execPath, [hook], { input: "not json at all", cwd, encoding: "utf8" });

  // In the integration checkout the runner falls back to its own cwd and
  // stands aside; in the lane the same garbage is refused, because there
  // the fallback lands on a lane branch with no readable path.
  expect(garbage(fx.repo).status, garbage(fx.repo).stderr).toBe(0);
  expect(garbage(fx.lane).status).toBe(2);
});

/* ────────────────────────────────────────────────────────────────────
 * THE SEAT WITH NO LANE (T-154-s2, @human's ruling of 2026-08-30)
 *
 * v1 armed on the WRITING session's own branch, so it saw a lane
 * reaching OUT and never a seat with no lane reaching IN — two of the
 * three incidents T-154 cites. Everything below drives the second seat,
 * and every allow in it is a discriminating one: the same fixture, in
 * the same run, refuses a neighbouring write.
 * ──────────────────────────────────────────────────────────────────── */

test("a lane-less seat is refused a path a LIVE lane holds, and that lane may still write it", async () => {
  const fx = makeFixture();
  const manifest = await arm(fx);

  // THE GUARD'S STATE FIRST. The integration fixture is on a branch that
  // is not a lane, it holds no manifest of its own, and the lane beside
  // it is live and armed — so the refusal below cannot be a manifest
  // this checkout read about itself.
  expect(readHeadRef(fx.repo)).toBe("refs/heads/main");
  expect(existsSync(path.join(fx.repo, MANIFEST_REL_PATH))).toBe(false);
  expect(liveLanes(fx.repo).map((l) => l.manifest.taskId)).toEqual([FIXTURE_ID]);

  const held = "tools/e2e/tests/fixture.spec.ts";
  const refused = ask(fx.repo, path.join(fx.repo, held));
  expect(refused.verdict, refused.reason).toBe("block");
  expect(refused.code).toBe("held-by-a-live-lane");
  expect(refused.reason, "the lane is not named").toContain(FIXTURE_ID);
  expect(refused.reason, "the lane's worktree is not named").toContain(fx.lane);
  expect(refused.reason, "the fence is not named").toContain(manifest.touchesLine);
  expect(refused.reason, "the path is not named").toContain(held);
  expect(refused.reason, "the route is not named").toContain(ROUTE_LANE_LESS);

  // THE DISCRIMINATING HALF, BOTH WAYS. The lane whose fence this is may
  // write the same path, and the same seat may write a path no lane
  // holds — so this is a reservation being enforced, not a hook that
  // refuses whatever it is shown.
  expect(ask(fx.lane, path.join(fx.lane, held)).code).toBe("inside-the-fence");
  expect(ask(fx.repo, path.join(fx.repo, "app/src/main.tsx")).code).toBe("not-a-lane");
});

test("EVERY live lane is read, not the first one the walk finds", async () => {
  const fx = makeFixture();
  await arm(fx);
  const second = await addLane(fx, "T-902", "touches: [app/src/main.tsx]");

  const ids = liveLanes(fx.repo).map((l) => l.manifest.taskId).sort();
  expect(ids, "the second lane is invisible to the walk").toEqual([FIXTURE_ID, "T-902"]);
  expect(second.manifest.paths).toEqual(["app/src/main.tsx"]);

  // A path ONLY THE SECOND lane holds. Under a hook that stopped at the
  // first lane this is an allow, and every other body here still passes.
  const refused = ask(fx.repo, path.join(fx.repo, "app/src/main.tsx"));
  expect(refused.verdict, refused.reason).toBe("block");
  expect(refused.code).toBe("held-by-a-live-lane");
  expect(refused.reason, "the refusal names the wrong lane").toContain("T-902");
  // And the first lane is still enforced in the same world.
  expect(ask(fx.repo, path.join(fx.repo, "tools/e2e/x.ts")).reason).toContain(FIXTURE_ID);
});

test("a DETACHED checkout is not judged, so the poison drill may mutate what a lane holds", async () => {
  const fx = makeFixture();
  await arm(fx);
  expect(readHeadRef(fx.drill), "the drill fixture is not detached").toBeUndefined();

  // The drill's whole job is mutating the lane's own files
  // (docs/CONVENTIONS.md, POISON DRILL), so the arm that refuses this
  // path to the integration checkout must not reach a detached tree.
  const inDrill = ask(fx.drill, path.join(fx.drill, "tools/e2e/tests/fixture.spec.ts"));
  expect(inDrill.verdict, inDrill.reason).toBe("allow");
  expect(inDrill.code).toBe("not-judged-detached");
  expect(inDrill.judged, "limit 3 is a DECLINE and must say so").toBe(false);
  expect(inDrill.reason, "the detached limit is not named in the answer").toContain("detached");
  // The discriminating half: the SAME path, the SAME repository, from
  // the checkout that holds a branch — refused.
  expect(ask(fx.repo, path.join(fx.repo, "tools/e2e/tests/fixture.spec.ts")).code).toBe(
    "held-by-a-live-lane",
  );
});

test("the seat with no lane is seen from a LINKED worktree too, and the main checkout can be the lane", async () => {
  const fx = makeFixture();
  await arm(fx);

  // A linked worktree on a branch that is not a lane: the `arch-verify`
  // shape, and a session worktree's. Its own git directory is a POINTER,
  // so the walk has to follow `commondir` to reach the administration at
  // all — from the main checkout that file does not exist and this whole
  // hop is unexercised.
  const seat = path.join(path.dirname(fx.lane), "supertaskr-review");
  git(fx.repo, ["worktree", "add", "--quiet", "-b", "review/T-901-check", seat]);
  expect(readHeadRef(seat)).toBe("refs/heads/review/T-901-check");
  expect(liveLanes(seat).map((l) => l.manifest.taskId), "the walk lost the lane list").toEqual([
    FIXTURE_ID,
  ]);
  const refused = ask(seat, path.join(seat, "tools/e2e/tests/fixture.spec.ts"));
  expect(refused.verdict, refused.reason).toBe("block");
  expect(refused.code).toBe("held-by-a-live-lane");
  // Discriminating in the same tree: a path no lane holds is allowed.
  expect(ask(seat, path.join(seat, "app/src/main.tsx")).verdict).toBe("allow");

  // AND THE MAIN CHECKOUT IS A CANDIDATE LIKE ANY OTHER. Git keeps its
  // HEAD in the common directory rather than under `worktrees/`, so a
  // walk that only read the linked entries would miss an integration
  // checkout parked on a task branch — rare, and exactly the kind of
  // state a guard should not be blind to.
  writeFixtureFile(fx.repo, "docs/tasks/T-905-the-main-checkout-holds-a-lane.md", [
    "---",
    "id: T-905",
    "title: The main checkout holds a lane",
    "feature: F-04",
    "milestone: 4",
    "priority: 30",
    "size: M",
    "status: building",
    "blocked_by: []",
    "touches: [app/src/main.tsx]",
    "builder:",
    "verifier:",
    "built_by:",
    "verified_by:",
    "review:",
    "---",
    "",
  ].join("\n"));
  git(fx.repo, ["add", "-A"]);
  git(fx.repo, ["commit", "-m", "fixture T-905", "--quiet"]);
  git(fx.repo, ["checkout", "--quiet", "-b", "task/T-905-main-as-lane"]);
  writeLaneFence(await buildLaneFence("T-905", fx.repo, { root: fx.repo, at: "2026-01-01T00:00:00.000Z" }));

  expect(liveLanes(seat).map((l) => l.manifest.taskId).sort()).toEqual([FIXTURE_ID, "T-905"]);
  const held = ask(seat, path.join(seat, "app/src/main.tsx"));
  expect(held.verdict, held.reason).toBe("block");
  expect(held.reason).toContain("T-905");
});

test("the carve-outs each free a DIFFERENT write, and the fence still holds around them", async () => {
  // THE FENCE NAMES ITS PIECES, AND SINCE T-219 IT HAS TO. This body
  // used to fence the bare `docs`, because that one domain contains the
  // card, the stamps and this seat's own standing writes — all three
  // carve-outs and the refusal, one fixture apart. `expandFence` now
  // REFUSES a token whose domain CONTAINS `docs/tasks` (containment IS
  // holding), so the widest fence any card may hold reaches those four
  // places by naming them. Every carve-out below is still armed, and
  // the own-file one is armed by the spelling rule 5 prescribes in
  // place of the directory: the card named outright.
  //
  // THE OTHER CARD IS FENCED BY NAME, AND THAT IS NOT A CONTRIVANCE: it
  // is the spelling rule 5 prescribes in the same breath as the refusal
  // ("Name the individual files instead"), and it is the only way left
  // to put a path under `docs/tasks` inside a live lane's reservation —
  // which is what arms the unfenceable-directory carve-out at all.
  const OTHER_CARD = "docs/tasks/T-903-a-suggestion.md";
  const fx = makeFixture(
    `touches: [tools/e2e, ${FIXTURE_CARD}, ${OTHER_CARD}, docs/STATE.md, docs/checkpoints, docs/ROADMAP.md]`,
  );
  const manifest = await arm(fx);
  expect(manifest.paths).toEqual([
    "docs/ROADMAP.md",
    "docs/STATE.md",
    "docs/checkpoints",
    OTHER_CARD,
    "tools/e2e",
  ]);
  expect(manifest.paths, "the fence swallowed the directory no card may hold").not.toContain(
    "docs",
  );
  expect(manifest.excluded, "the card's own file was not carved out at dispatch").toEqual([
    FIXTURE_CARD,
  ]);
  expect(manifest.alwaysWritable).toEqual(["docs/tasks"]);

  // THE OWN-CARD WRITE IS STILL ALLOWED, AND IT NO LONGER TAKES THE
  // CARVE-OUT — a consequence of T-219 that this body is the only thing
  // in the repository positioned to notice, so it is asserted rather
  // than left to be discovered.
  //
  // `carveOutFor` USED TO ANSWER for a lane's own card file in a first
  // arm, and the seat branch consults it only for a path some live
  // lane's manifest RESERVES. A card file is reserved only by a domain
  // that contains `docs/tasks` — the fence T-219 refuses — and
  // `expandFence` moves a card's own file out of `paths` into `excluded`
  // regardless. So after T-219 no manifest could select that arm, and
  // T-219-s3 REMOVED it rather than making it reachable; the write falls
  // through to `not-a-lane` either way, which is why this assertion
  // never redded. It is therefore the permanent PIN on that answer, not
  // a promise about a fix: a re-added own-file arm is what it catches.
  const ownCard = ask(fx.repo, path.join(fx.repo, FIXTURE_CARD));
  expect(ownCard.verdict, ownCard.reason).toBe("allow");
  expect(ownCard.code, "the own-card carve-out arm became reachable again — see T-219-s3").toBe(
    "not-a-lane",
  );

  const otherCard = ask(fx.repo, path.join(fx.repo, OTHER_CARD));
  expect(otherCard.verdict, otherCard.reason).toBe("allow");
  expect(otherCard.code).toBe("protocol-carve-out");
  expect(otherCard.reason, "the unfenceable-directory carve-out is not the one named").toContain(
    "no card may fence it",
  );

  for (const seatPath of ["docs/STATE.md", "docs/checkpoints/2026-01-01-T-901.md"]) {
    const seat = ask(fx.repo, path.join(fx.repo, seatPath));
    expect(seat.verdict, seat.reason).toBe("allow");
    expect(seat.code, seatPath).toBe("protocol-carve-out");
    expect(seat.reason, seatPath).toContain("standing write");
  }

  // THE DISCRIMINATING HALF: a fenced path under docs/ that no carve-out
  // names is refused, in the same run. Without it every line above is
  // satisfied by a hook that stopped enforcing this lane's docs domains
  // altogether. `docs/ROADMAP.md` is now fenced by NAME rather than by
  // sitting inside `docs`, which is the only thing about it that moved.
  const refused = ask(fx.repo, path.join(fx.repo, "docs/ROADMAP.md"));
  expect(refused.verdict, refused.reason).toBe("block");
  expect(refused.code).toBe("held-by-a-live-lane");
  // And inside the lane the carve-outs are NOT the lane's: the fence
  // question and the seat question are different questions.
  expect(ask(fx.lane, path.join(fx.lane, "docs/STATE.md")).code).toBe("inside-the-fence");
});

test("the carve-out set this hook holds is the one docs/CONVENTIONS.md publishes", () => {
  // UNNESTED, for the reason the branch-spelling body gives: a nested
  // `f(g(root))` hides this file from the DOCS GATE's reader derivation
  // while it really does read the document.
  const conventions = conventionsText(repoRoot);
  const bullet = String(conventionsBullet(conventions, "THE LANE PROTOCOL"));
  const sentence = /never a lane's to veto — exactly (.*?), no more/.exec(bullet);
  expect(sentence, "the lane bullet no longer publishes this seat's standing writes").not.toBeNull();
  const published = [...((sentence as RegExpExecArray)[1] ?? "").matchAll(/`([^`]+)`/g)].map(
    (m) => m[1] as string,
  );

  // The constant and the page are two copies the design could not avoid
  // — the hook cannot parse a document on every keystroke — so they are
  // COMPARED rather than trusted, exactly as the lane-branch spelling is.
  // A red here names both sides and says which is which, not which is right.
  expect(published, "the hook's carve-outs and the page's have drifted").toEqual([
    ...INTEGRATION_SEAT_PATHS,
  ]);
  expect(INTEGRATION_SEAT_PATHS.length, "the published set is empty, so this proves nothing").toBe(2);
});

/* ────────────────────────────────────────────────────────────────────
 * WHICH ARM ANSWERS A CARD FILE (T-215-s6)
 *
 * `T-219-s3` removed `carveOutFor`'s own-card FIRST arm, because no
 * manifest the parser can produce selects it — and nothing pinned WHICH
 * arm answers a card file afterwards. THE REASON NOTHING DID IS THAT
 * PRESENCE PROVES NOTHING: called directly for a card file against a
 * manifest whose `excluded` names that file, `carveOutFor` returns a
 * carve-out BOTH WAYS — through the removed own-file arm before the
 * removal, through `alwaysWritable` after it — so a body asserting that
 * a carve-out comes back is satisfied by a re-added arm and measures
 * nothing. Only the RETURNED VALUE discriminates, and both halves of it
 * do:
 *
 *   the unfenceable arm answers the domain `docs/tasks` and "no card
 *   may fence it and every card's protocol writes there";
 *   a re-added own-file arm answers the CARD'S OWN PATH and "…'s own
 *   card file, which is outside every fence including its own".
 *
 * THE BODY ABOVE CANNOT SEE IT, WHICH IS WHY THIS PAIR EXISTS. *The
 * carve-outs each free a DIFFERENT write* pins `decide`'s answer for the
 * own card (`not-a-lane`), and the seat branch consults `carveOutFor`
 * only for a path some live lane's manifest RESERVES — a card file is
 * never reserved, so that verdict does not move when the arm comes back.
 * That body is the permanent pin on the VERDICT; this pair is the pin on
 * the ARM.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * The unfenceable arm's own answer, BOTH HALVES AS LITERALS.
 *
 * Not read back from the hook's constants nor from the manifest: a test
 * parametrised by the constant it checks cannot pin that constant
 * (docs/CONVENTIONS.md, A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL,
 * second face). The manifest is asserted to CARRY this domain instead,
 * which is the arming condition rather than the expected value.
 */
const UNFENCEABLE_DOMAIN = "docs/tasks";
const UNFENCEABLE_WHY = "no card may fence it and every card's protocol writes there";

/** `carveOutFor`'s opening line — where the removed arm stood FIRST. */
const CARVE_OUT_ANCHOR = "export function carveOutFor(rel, manifest) {\n";

/**
 * The own-card arm as `T-219-s3` deleted it, byte for byte.
 *
 * TAKEN FROM THE REMOVAL DIFF RATHER THAN WRITTEN TO LOOK SIMILAR, which
 * is docs/CONVENTIONS.md's own rule for a control fixture: an arm
 * somebody re-typed measures that arm and not the one this repository
 * removed. It is an array of source LINES so the template literal inside
 * it stays text here instead of being interpolated by this file.
 */
const OWN_FILE_ARM = [
  "  for (const domain of manifest.excluded) {",
  "    if (within(rel, domain)) {",
  "      return {",
  "        domain,",
  "        why: `it is ${manifest.taskId}'s own card file, which is outside every fence including its own`,",
  "      };",
  "    }",
  "  }",
  "",
].join("\n");

/** How many times `needle` occurs in `haystack` — the plant's own delta. */
function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

/**
 * What is WRONG with the carve-out a CARD FILE came back with — empty
 * when the unfenceable arm answered it, and naming both halves when
 * some other arm did.
 *
 * ONE READER, DRIVEN TWICE: the body below requires it EMPTY against the
 * live hook, and the control requires exactly its two complaints against
 * a copy carrying the re-added arm — so the comparison under control is
 * the comparison under test, one arm apart.
 */
function ownCardCarveComplaints(carve: { domain: string; why: string } | undefined): string[] {
  if (carve === undefined) return ["no carve-out at all — `carveOutFor` answered undefined"];
  const complaints: string[] = [];
  if (carve.domain !== UNFENCEABLE_DOMAIN) {
    complaints.push(
      `the domain is \`${carve.domain}\` and the unfenceable arm's is \`${UNFENCEABLE_DOMAIN}\``,
    );
  }
  if (carve.why !== UNFENCEABLE_WHY) {
    complaints.push(
      `the reason is "${carve.why}" and the unfenceable arm's is "${UNFENCEABLE_WHY}"`,
    );
  }
  return complaints;
}

test("a card file is carved out by the UNFENCEABLE arm, and a carve-out coming back is not that", async () => {
  const fx = makeFixture(`touches: [tools/e2e, ${FIXTURE_CARD}]`);
  const manifest = await arm(fx);

  // THE ANTI-VACUITY HALF, AND IT IS TWO CONDITIONS. A manifest whose
  // `excluded` does not carry the card could not select an own-file arm
  // however present that arm was, and an `alwaysWritable` containing no
  // domain over the card would leave the arm under test nothing to
  // answer through: without both, every assertion below is satisfied by
  // a `carveOutFor` with no arms in it at all.
  expect(
    manifest.excluded,
    "the card's own file was not carved out at dispatch, so no own-file arm could answer",
  ).toEqual([FIXTURE_CARD]);
  expect(
    manifest.alwaysWritable,
    "the manifest does not carry the unfenceable directory, so the arm under test cannot answer",
  ).toContain(UNFENCEABLE_DOMAIN);
  expect(
    within(FIXTURE_CARD, UNFENCEABLE_DOMAIN),
    "the fixture card does not live under the unfenceable directory, so nothing arms the arm",
  ).toBe(true);

  // DIRECTLY, BECAUSE `decide` CANNOT REACH THIS QUESTION: the seat
  // branch consults `carveOutFor` only for a path some live lane's
  // manifest RESERVES, and a card file is never reserved.
  const carve = carveOutFor(FIXTURE_CARD, manifest);
  expect(carve, "a card file gets no carve-out at all").toBeDefined();
  expect(
    ownCardCarveComplaints(carve),
    "a card file was carved out by an arm that is not the unfenceable one",
  ).toEqual([]);
});

test("THE POSITIVE CONTROL: the own-file arm re-added byte-identically answers instead, and the body above reds naming both halves", async () => {
  // KILLED BY: a plant that does not land — the occurrence DELTA is
  // asserted, never the absence of the arm from the live hook, so this
  // control survives the very mutant the body above is measured against
  // and their kill sets stay disjoint. Killed also by a reader that
  // answers from the LIVE hook whatever file it was handed: the copy is
  // imported BY URL and driven through its OWN export.
  //
  // THE ARM IS PLANTED FIRST, WHERE IT STOOD. Its ordering argument is
  // exactly what makes a re-add invisible — every card lives under the
  // unfenceable directory, so an arm placed after `alwaysWritable`
  // answers for nothing — and a control planting it anywhere else would
  // be measuring a mutant this repository never carried.
  const fx = makeFixture(`touches: [tools/e2e, ${FIXTURE_CARD}]`);
  const manifest = await arm(fx);
  const real = hookSourceText();
  const at = real.indexOf(CARVE_OUT_ANCHOR);
  expect(at, "`carveOutFor`'s opening line moved — the plant has no anchor").toBeGreaterThan(-1);
  expect(
    real.indexOf(CARVE_OUT_ANCHOR, at + 1),
    "the anchor is not unique, so where the plant lands is not decided",
  ).toBe(-1);

  const opensAt = at + CARVE_OUT_ANCHOR.length;
  const planted = `${real.slice(0, opensAt)}${OWN_FILE_ARM}${real.slice(opensAt)}`;
  expect(
    occurrences(planted, OWN_FILE_ARM) - occurrences(real, OWN_FILE_ARM),
    "the arm did not land in the copy, so this control proves nothing",
  ).toBe(1);

  const copy = path.join(scratchRoot(), "lane-fence-own-file-arm-re-added.mjs");
  writeFileSync(copy, planted, "utf8");
  const mutant = await import(pathToFileURL(copy).href);
  const carve = mutant.carveOutFor(FIXTURE_CARD, manifest);

  // THE ARM IS GENUINELY SELECTABLE ONCE RE-ADDED, which is the whole
  // reason the body above may not rest on a carve-out coming back.
  expect(carve, "the re-added arm answered nothing, so nothing was measured").toBeDefined();
  expect(carve.domain, "the plant did not take the answer").toBe(FIXTURE_CARD);
  expect(carve.why).toContain("own card file");

  // AND THE BODY ABOVE REDS ON IT, BY NAME: the same reader, the same
  // manifest, one arm apart.
  expect(ownCardCarveComplaints(carve)).toEqual([
    `the domain is \`${FIXTURE_CARD}\` and the unfenceable arm's is \`${UNFENCEABLE_DOMAIN}\``,
    `the reason is "it is ${FIXTURE_ID}'s own card file, which is outside every fence including ` +
      `its own" and the unfenceable arm's is "${UNFENCEABLE_WHY}"`,
  ]);
});

/* ────────────────────────────────────────────────────────────────────
 * THE THIRD COPY — THE LIMITS (T-215-s1)
 *
 * The lane-branch spelling and the carve-out set are each COMPARED
 * against the page above. The LIMITS were the third pair of the same
 * shape and the only one nobody checked: `T-215` rewrote the paragraph
 * from the hook's header BY HAND after `T-199` moved the hook and left
 * the page behind, and a mutant paragraph carrying the exact falsehood
 * that card exists to delete reddened nothing.
 *
 * WHAT IS COMPARED IS THE DECLARED KEYS, NEVER THE PROSE. Both sides
 * are paragraphs, and a body asserting that two paragraphs match reds
 * on every re-wording — a gate this project would learn to ignore.
 * What is greppable on both sides is the NUMBERING and the declining
 * verdict CODES, so those are what travel.
 * ──────────────────────────────────────────────────────────────────── */

/** The hook's own limits block, by the rule the block opens with. */
const HONEST_LIMITS_MARKER = "── THE HONEST LIMITS";
/** The lane bullet's limits paragraph, by the phrase it opens with. */
const LIMITS_PARAGRAPH_MARKER = "**THE LIMITS —";
/** Enough of them to spell any count this header will ever carry. */
const COUNT_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
] as const;

/** The hook's leading block comment — the header, and nothing after it. */
function hookHeader(hookSource: string): string {
  const end = hookSource.indexOf("\n */");
  return end === -1 ? "" : hookSource.slice(0, end);
}

/**
 * The numbers the hook's HONEST LIMITS block gives its own limits, in
 * the order the block gives them.
 *
 * READ OFF THE TEXT rather than off an export, because the header is
 * what a reader of the hook meets and the header is the half that
 * drifts. A continuation line is indented past the number, so only a
 * limit's opening line matches.
 */
function headerLimitNumbers(hookSource: string): number[] {
  const header = hookHeader(hookSource);
  const from = header.indexOf(HONEST_LIMITS_MARKER);
  if (from === -1) return [];
  return [...header.slice(from).matchAll(/^ \* (\d+)\. /gm)].map((m) => Number(m[1]));
}

/** The lane bullet's limits paragraph, whitespace already collapsed. */
function limitsParagraph(bullet: string): string {
  const from = bullet.indexOf(LIMITS_PARAGRAPH_MARKER);
  return from === -1 ? "" : bullet.slice(from);
}

/**
 * The declining codes as the hook's own SOURCE spells them.
 *
 * THE AUTHORITY IS THE EXPORTED FROZEN `DECLINE_CODES`, which this file
 * already imports, and the body below asserts these two agree. This
 * reader exists so the positive control can hand `limitsDrift` a
 * PLANTED file and have the codes come from THAT file — a control whose
 * code list arrives from the live module could never see a rename.
 */
function declineCodesInSource(hookSource: string): string[] {
  const block = /export const DECLINE_CODES = Object\.freeze\(\[([\s\S]*?)\]\)/.exec(hookSource);
  if (block === null) return [];
  return [...String(block[1]).matchAll(/"([^"]+)"/g)].map((m) => String(m[1]));
}

/** The numbers that paragraph publishes, in the order it publishes them. */
function publishedLimitNumbers(bullet: string): number[] {
  return [...limitsParagraph(bullet).matchAll(/\((\d+)\)/g)].map((m) => Number(m[1]));
}

/**
 * Every way the hook's declared limits and the page's published ones
 * have come apart, each naming BOTH sides and neither saying which is
 * right — the treatment the two pairs above already give their own
 * copies.
 *
 * A LIST RATHER THAN AN ASSERTION, so the positive control can run the
 * SAME comparison over a planted header and read what it says. A
 * control decided by different code from its subject decides nothing.
 */
function limitsDrift(hookSource: string, bullet: string): string[] {
  const complaints: string[] = [];
  const declared = headerLimitNumbers(hookSource);
  const published = publishedLimitNumbers(bullet);
  if (declared.length === 0) {
    complaints.push(`the hook declares no numbered limits under ${HONEST_LIMITS_MARKER}`);
  }
  if (published.length === 0) {
    complaints.push(`the lane bullet has no limits paragraph opening ${LIMITS_PARAGRAPH_MARKER}`);
  }
  if (declared.join("/") !== published.join("/")) {
    complaints.push(
      `the header numbers its limits ${declared.join("/")} and the lane bullet publishes ` +
        `${published.join("/")}`,
    );
  }
  const word = /— (\w+), numbered in/.exec(limitsParagraph(bullet))?.[1];
  if (word === undefined) {
    complaints.push("the limits paragraph no longer opens with its count in words");
  } else if (word !== COUNT_WORDS[declared.length]) {
    complaints.push(`the paragraph counts them "${word}" and the header numbers ${declared.length}`);
  }
  // THE BULLET ARRIVES WHITESPACE-COLLAPSED, so a code the document
  // wrapped across two lines reads as two words here and matches
  // nothing. That is the failure this loop is likeliest to meet, so the
  // complaint says so rather than leaving the next reader to find it.
  for (const code of declineCodesInSource(hookSource)) {
    if (!bullet.includes(`\`${code}\``)) {
      complaints.push(
        `the declining code \`${code}\` is not published in the lane bullet — and a code the ` +
          "document wrapped across two lines does not survive the collapse",
      );
    }
  }
  return complaints;
}

/** The hook, read as TEXT — the same read `:542` makes of the same file. */
function hookSourceText(): string {
  return readFileSync(path.join(repoRoot, ".claude/hooks/lane-fence.mjs"), "utf8");
}

/** The lane bullet, UNNESTED for the DOCS GATE's reader derivation. */
function laneBulletText(): string {
  const conventions = conventionsText(repoRoot);
  return String(conventionsBullet(conventions, "THE LANE PROTOCOL"));
}

test("the limits this hook declares are the limits docs/CONVENTIONS.md publishes", () => {
  // UNNESTED ON PURPOSE, for the reason the two bodies above give: a
  // nested `f(g(root))` would hide this file from the DOCS GATE's
  // reader derivation while it really does read the document.
  const bullet = laneBulletText();
  const hookSource = hookSourceText();

  // THE ANTI-VACUITY HALF FIRST. Every complaint below is a NEGATIVE
  // assertion, and a header with no limits or an empty declining set
  // satisfies all of them at once.
  expect(
    headerLimitNumbers(hookSource).length,
    "the hook declares no numbered limits, so this body proves nothing",
  ).toBeGreaterThan(0);
  expect(
    DECLINE_CODES.length,
    "the hook's declining set is empty, so this body proves nothing",
  ).toBeGreaterThan(0);

  // THE AUTHORITY IS THE EXPORTED FROZEN SET, and the text reader that
  // makes the planted control possible is bound to it here rather than
  // trusted. Only ONE of these codes is written inside the HONEST
  // LIMITS block, so grepping the header for them would be checking a
  // different thing from the one the hook can actually return.
  expect(
    declineCodesInSource(hookSource),
    "the source reader and the module's own DECLINE_CODES disagree",
  ).toEqual([...DECLINE_CODES]);

  expect(limitsDrift(hookSource, bullet), "the limits have drifted").toEqual([]);
});

test("THE POSITIVE CONTROL: a planted header reds — one limit gained, one code renamed", () => {
  // KILLED BY: dropping either half of `limitsDrift`, and by a reader
  // that answers from the LIVE hook whatever file it was handed. The
  // planted headers are written to a scratch file and read back through
  // the same `readFileSync` the subject uses, so the comparison under
  // control is the comparison under test — and the ARRANGEMENT differs,
  // which is the whole of what makes it a control (verifier.md 2b).
  //
  // WHAT IS ASSERTED IS THE DELTA THE PLANT ADDS, and every expectation
  // is derived from the same readers rather than typed out here. That is
  // not tidiness: it is what keeps this body's kill set from CONTAINING
  // the subject's. A data mutant on the paragraph must red the subject
  // ALONE, or the subject is a restatement of this one — and a control
  // asserting the WHOLE complaint list would die beside it every time.
  const bullet = laneBulletText();
  const real = hookSourceText();
  const declared = headerLimitNumbers(real);
  const published = publishedLimitNumbers(bullet);
  const pageWord = /— (\w+), numbered in/.exec(limitsParagraph(bullet))?.[1];
  const baseline = limitsDrift(real, bullet);
  const added = (planted: string): string[] =>
    limitsDrift(planted, bullet).filter((c) => !baseline.includes(c));
  const root = scratchRoot();

  // ONE LIMIT GAINED. A further limit is appended to the header's own
  // block, exactly the drift this pair exists to catch: the hook grows
  // a limit and the page does not publish it.
  const headerEnd = real.indexOf("\n */");
  const gained = path.join(root, "lane-fence-one-limit-gained.mjs");
  const next = declared.length + 1;
  writeFileSync(
    gained,
    `${real.slice(0, headerEnd)}\n * ${next}. A LIMIT THE PAGE DOES NOT CARRY.${real.slice(headerEnd)}`,
    "utf8",
  );
  const gainedSource = readFileSync(gained, "utf8");
  expect(headerLimitNumbers(gainedSource), "the plant did not land in the header's own block").toEqual(
    [...declared, next],
  );
  expect(added(gainedSource)).toEqual([
    `the header numbers its limits ${[...declared, next].join("/")} and the lane bullet ` +
      `publishes ${published.join("/")}`,
    `the paragraph counts them "${String(pageWord)}" and the header numbers ${next}`,
  ]);

  // ONE CODE RENAMED, in the fixture's own `DECLINE_CODES`. This is the
  // second half of the pair — a limit the hook gains must not land
  // unpublished, and a code it renames must not land unpublished
  // either. The renamed code is read out of the PLANTED file, which is
  // why the reader above exists: a control taking its code list from
  // the live module could never see a rename.
  const renamedTo = "not-a-code-this-page-carries";
  const [firstCode] = DECLINE_CODES;
  const renamed = path.join(root, "lane-fence-one-code-renamed.mjs");
  writeFileSync(renamed, real.split(String(firstCode)).join(renamedTo), "utf8");
  const renamedSource = readFileSync(renamed, "utf8");
  expect(declineCodesInSource(renamedSource), "the rename did not land in the frozen set").toEqual(
    [...DECLINE_CODES].map((c) => (c === firstCode ? renamedTo : c)),
  );
  expect(added(renamedSource)).toEqual([
    `the declining code \`${renamedTo}\` is not published in the lane bullet — and a code the ` +
      "document wrapped across two lines does not survive the collapse",
  ]);
});

/* ────────────────────────────────────────────────────────────────────
 * THE HEADER AGAINST ITSELF — THE CITATION NOBODY READ (T-215-s2)
 *
 * The pair above compares the hook's numbered block to the PAGE. It
 * never compares the header to ITSELF, and the header cites its own
 * limits in a second place: the `── AN UNJUDGED WRITE SAYS SO` block
 * names each declining code with the limit it comes from.
 *
 * THAT SECOND PLACE DRIFTED AND NOTHING SAW IT. `T-199` renumbered the
 * no-path limit from 5 to 8, fixed the cross-reference at the top of
 * the header and left the decline list saying *"`no-path-to-judge`
 * (limit 5)"* — which is not a declining limit at all, but the
 * advice-to-a-cooperating-harness limit that returns no verdict. A
 * reader chasing a request with no path was sent to a limit about
 * `.claude/settings.json`. MEASURED AT `1886cc7`, THE BASE OF THE LANE
 * THAT FIXED IT: this file ran 60 of 60 GREEN with the wrong number in
 * place, because `headerLimitNumbers` slices from
 * `── THE HONEST LIMITS` and the decline list sits ABOVE that slice.
 *
 * WHY IT IS THIS FILE'S PROBLEM AND NOT PROSE'S: a limit number is the
 * HANDLE a reader looks the limit up by, and this project's own hook
 * publishes three copies of it — the decline list, the numbered block,
 * and the runtime string a refused session actually reads on stderr.
 * Three copies are three chances to disagree (`T-057`), and the two
 * bodies below bind all three to one figure READ FROM THE FILE.
 * ──────────────────────────────────────────────────────────────────── */

/** The decline list's own block, by the rule it opens with. */
const DECLINE_LIST_MARKER = "── AN UNJUDGED WRITE SAYS SO";

/**
 * Each numbered limit of the HONEST LIMITS block WITH ITS TEXT, so a
 * code written inside one can be traced back to that limit's number.
 *
 * The slice runs to the NEXT limit's opening line, which is what makes
 * a continuation line belong to the limit it continues.
 */
function numberedLimitBlocks(hookSource: string): { n: number; text: string }[] {
  const header = hookHeader(hookSource);
  const from = header.indexOf(HONEST_LIMITS_MARKER);
  if (from === -1) return [];
  const block = header.slice(from);
  const opens = [...block.matchAll(/^ \* (\d+)\. /gm)];
  return opens.map((m, i) => {
    const next = opens[i + 1];
    return {
      n: Number(m[1]),
      text: block.slice(m.index, next === undefined ? block.length : next.index),
    };
  });
}

/**
 * The `code` (limit N) citations the DECLINE LIST makes — the half of
 * the header the keeper above cannot see, because it lives between the
 * decline marker and the limits marker.
 */
function declineCitations(hookSource: string): { code: string; n: number }[] {
  const header = hookHeader(hookSource);
  const from = header.indexOf(DECLINE_LIST_MARKER);
  const to = header.indexOf(HONEST_LIMITS_MARKER);
  if (from === -1 || to === -1 || to < from) return [];
  return [...header.slice(from, to).matchAll(/`([a-z-]+)` \(limit (\d+)\)/g)].map((m) => ({
    code: String(m[1]),
    n: Number(m[2]),
  }));
}

/**
 * The limit number each `decline(...)` cites in the sentence the
 * REFUSED SESSION READS. This is the copy with a consumer, so it is the
 * copy whose drift is felt rather than merely filed.
 */
function runtimeCitations(hookSource: string): { code: string; n: number }[] {
  const found: { code: string; n: number }[] = [];
  for (const m of hookSource.matchAll(/\(limit (\d+) in this file's header\)/g)) {
    const opened = hookSource.slice(0, m.index).lastIndexOf("return decline(");
    if (opened === -1) continue;
    const code = /return decline\(\s*"([a-z-]+)"/.exec(hookSource.slice(opened))?.[1];
    if (code !== undefined) found.push({ code, n: Number(m[1]) });
  }
  return found;
}

/**
 * Every way the header's THREE copies of a limit number have come
 * apart, each naming BOTH sides and neither saying which is right — the
 * treatment the three pairs above already give their own copies.
 *
 * A LIST RATHER THAN AN ASSERTION, for the reason `limitsDrift` gives:
 * the positive control runs the SAME comparison over a planted header
 * and reads what it says.
 *
 * THE COVERAGE RESIDUE, DECLARED RATHER THAN DISCOVERED: arm one binds
 * only a code the numbered block SPELLS, and today exactly one of the
 * four does (`no-path-to-judge`, inside limit 8) — the same fact that
 * made `T-215-s1` take `DECLINE_CODES` as its authority instead of
 * grepping the header. So a citation moved on one of the other three
 * passes arm one silently. Closing that means giving the block a
 * greppable handle for every code, which is a change to the hook and a
 * card of its own; it is written down here rather than left for the
 * next reader to measure.
 */
function citationDrift(hookSource: string): string[] {
  const complaints: string[] = [];
  const limits = numberedLimitBlocks(hookSource);
  const cited = declineCitations(hookSource);
  const runtime = runtimeCitations(hookSource);

  // ARM ONE — a code WRITTEN INSIDE a numbered limit must be cited with
  // THAT limit's number.
  for (const { code, n } of cited) {
    const spelled = limits.filter((l) => l.text.includes(code));
    // Not spelled in the block, or spelled twice: there is no ONE limit
    // to trace the citation back to, so there is nothing to compare.
    const home = spelled.length === 1 ? spelled[0] : undefined;
    if (home === undefined) continue;
    if (home.n !== n) {
      complaints.push(
        `the decline list cites \`${code}\` as limit ${n} and the HONEST LIMITS block writes it ` +
          `into limit ${home.n}`,
      );
    }
  }

  // ARM TWO — and the sentence the refused session reads must cite the
  // same limit the decline list does.
  for (const { code, n } of runtime) {
    const listed = cited.find((c) => c.code === code);
    if (listed === undefined) {
      complaints.push(
        `\`${code}\`'s runtime message cites limit ${n} and the decline list cites no limit for it`,
      );
    } else if (listed.n !== n) {
      complaints.push(
        `\`${code}\`'s runtime message cites limit ${n} and the decline list cites limit ${listed.n}`,
      );
    }
  }
  return complaints;
}

test("the limit a decline CITES is the limit the block numbers, and the one the session reads", () => {
  const hookSource = hookSourceText();

  // THE ANTI-VACUITY HALF FIRST, and it is three-sided: every complaint
  // above is a NEGATIVE assertion, so an empty decline list, an empty
  // limits block or a header with no runtime citation satisfies all of
  // them at once. This is the failure the body is likeliest to acquire,
  // because all three readers are slices that a re-worded marker
  // silently empties.
  expect(
    declineCitations(hookSource).length,
    `the header cites no limits under ${DECLINE_LIST_MARKER}, so this body proves nothing`,
  ).toBeGreaterThan(0);
  expect(
    numberedLimitBlocks(hookSource).length,
    "the hook declares no numbered limits, so this body proves nothing",
  ).toBeGreaterThan(0);
  expect(
    runtimeCitations(hookSource).length,
    "no `decline(...)` cites a limit, so arm two proves nothing",
  ).toBeGreaterThan(0);

  // AND THE CITED CODES ARE THE HOOK'S OWN, bound to the exported frozen
  // set rather than trusted — the treatment the keeper above gives its
  // own source reader. A citation naming a code this file cannot return
  // is drift the other direction.
  for (const { code } of declineCitations(hookSource)) {
    expect(
      [...DECLINE_CODES],
      `the decline list cites \`${code}\`, which is not a code this hook can answer with`,
    ).toContain(code);
  }

  expect(citationDrift(hookSource), "the header's limit citations have drifted").toEqual([]);
});

test("THE POSITIVE CONTROL: a planted header reds — the citation moved, and the runtime string moved", () => {
  // KILLED BY: dropping either arm of `citationDrift`, and by a reader
  // that answers from the LIVE hook whatever file it was handed. The
  // planted headers are written to a scratch file and read back through
  // the same `readFileSync` the subject uses, so the comparison under
  // control is the comparison under test — and the ARRANGEMENT differs,
  // which is the whole of what makes it a control (verifier.md 2b).
  //
  // THE FIRST PLANT IS THE DEFECT `T-215-s2` DELETED, replanted: it is
  // the exact byte string this file carried at `1886cc7`, so the body
  // above is shown red under the base header and green under the fixed
  // one, which is the measurement the card asks for.
  const real = hookSourceText();
  const root = scratchRoot();
  const baseline = citationDrift(real);
  const added = (planted: string): string[] =>
    citationDrift(planted).filter((c) => !baseline.includes(c));

  // The figure is READ, never typed: whatever limit the block writes
  // `no-path-to-judge` into is the one the plant moves it away from.
  const spelled = numberedLimitBlocks(real).filter((l) => l.text.includes("no-path-to-judge"));
  expect(
    spelled.length,
    "no ONE numbered limit spells `no-path-to-judge`, so the plant has no anchor",
  ).toBe(1);
  const home = spelled[0] as { n: number; text: string };
  const wrong = home.n === 5 ? 4 : 5;

  // PLANT ONE — THE HEADER'S CITATION MOVES, the block and the runtime
  // string stay. Arm one alone.
  const moved = path.join(root, "lane-fence-citation-moved.mjs");
  writeFileSync(
    moved,
    real.replace(`\`no-path-to-judge\` (limit ${home.n})`, `\`no-path-to-judge\` (limit ${wrong})`),
    "utf8",
  );
  const movedSource = readFileSync(moved, "utf8");
  expect(
    declineCitations(movedSource).find((c) => c.code === "no-path-to-judge")?.n,
    "the plant did not land in the decline list",
  ).toBe(wrong);
  expect(added(movedSource)).toEqual([
    `the decline list cites \`no-path-to-judge\` as limit ${wrong} and the HONEST LIMITS block ` +
      `writes it into limit ${home.n}`,
    `\`no-path-to-judge\`'s runtime message cites limit ${home.n} and the decline list cites ` +
      `limit ${wrong}`,
  ]);

  // PLANT TWO — THE RUNTIME STRING MOVES INSTEAD, header untouched. Arm
  // two ALONE, and this is what keeps the two arms' kill sets from
  // containing one another: arm one cannot see this at all.
  const restrung = path.join(root, "lane-fence-runtime-moved.mjs");
  writeFileSync(
    restrung,
    real.replace(
      `(limit ${home.n} in this file's header)`,
      `(limit ${wrong} in this file's header)`,
    ),
    "utf8",
  );
  const restrungSource = readFileSync(restrung, "utf8");
  expect(
    runtimeCitations(restrungSource).find((c) => c.code === "no-path-to-judge")?.n,
    "the plant did not land in the runtime message",
  ).toBe(wrong);
  expect(added(restrungSource)).toEqual([
    `\`no-path-to-judge\`'s runtime message cites limit ${wrong} and the decline list cites ` +
      `limit ${home.n}`,
  ]);

  // AND THE KEEPER ABOVE IS BLIND TO BOTH — the measurement that says
  // this body is not a restatement of it. `limitsDrift` reads the
  // numbered block and the page; neither plant touches either, so it
  // stays green over both while `citationDrift` reds. That asymmetry is
  // why the defect survived at the base.
  const bullet = laneBulletText();
  expect(limitsDrift(movedSource, bullet), "the keeper above sees the moved citation").toEqual(
    limitsDrift(real, bullet),
  );
  expect(limitsDrift(restrungSource, bullet), "the keeper above sees the moved string").toEqual(
    limitsDrift(real, bullet),
  );
});

test("the merge that CONSUMES a fence is not refused by it", async () => {
  const fx = makeFixture();
  await arm(fx);
  const held = path.join(fx.repo, "tools/e2e/tests/fixture.spec.ts");

  // Refused first, so the allow below is a state change and not a
  // mechanism that never armed.
  expect(ask(fx.repo, held).code).toBe("held-by-a-live-lane");

  // git's own record of a conflicted merge. Resolving one is an Edit
  // into the merging lane's fence BY CONSTRUCTION, so a guard without
  // this criterion forbids the act that ends lanes.
  const gitDir = path.join(fx.repo, ".git");
  writeFileSync(path.join(gitDir, "MERGE_HEAD"), `${"0".repeat(40)}\n`, "utf8");
  const merging = ask(fx.repo, held);
  expect(merging.verdict, merging.reason).toBe("allow");
  expect(merging.code).toBe("mid-integration");
  expect(merging.reason).toContain("MERGE_HEAD");
  rmSync(path.join(gitDir, "MERGE_HEAD"));

  // The revert play is the same shape and rides the same criterion.
  writeFileSync(path.join(gitDir, "REVERT_HEAD"), `${"0".repeat(40)}\n`, "utf8");
  expect(ask(fx.repo, held).code).toBe("mid-integration");
  rmSync(path.join(gitDir, "REVERT_HEAD"));

  // AND IT CLOSES AGAIN. A carve-out that outlived the merge would be a
  // permanently open gate, which is worse than none.
  expect(ask(fx.repo, held).code).toBe("held-by-a-live-lane");
});

test("a lane whose worktree is gone fences nothing, and a stray manifest still locks nobody out", async () => {
  const fx = makeFixture();
  await arm(fx);
  const held = path.join(fx.repo, "tools/e2e/tests/fixture.spec.ts");
  expect(ask(fx.repo, held).code).toBe("held-by-a-live-lane");

  // A STRAY MANIFEST IS READ BY NOBODY — v1's load-bearing property, in
  // the shape the widening could have broken. BOTH non-lane shapes carry
  // one here, and they fail the filter for different reasons: the drill
  // is DETACHED (its HEAD names no branch at all) and the review seat is
  // on a branch that is simply not a lane. A walk that read manifests
  // instead of branches would hand this repository two fences nobody
  // holds — and the second worktree is why "filtered on the branch,
  // never the path" is a measurement here and not a slogan.
  const stray = JSON.parse(readFileSync(path.join(fx.lane, MANIFEST_REL_PATH), "utf8"));
  stray.paths = ["app/src"];
  const review = path.join(path.dirname(fx.lane), "supertaskr-review-stray");
  git(fx.repo, ["worktree", "add", "--quiet", "-b", "review/T-901-stray", review]);
  for (const home of [fx.drill, review]) {
    mkdirSync(path.join(home, path.dirname(MANIFEST_REL_PATH)), { recursive: true });
    writeFileSync(path.join(home, MANIFEST_REL_PATH), JSON.stringify(stray), "utf8");
  }
  expect(readHeadRef(review)).toBe("refs/heads/review/T-901-stray");
  // REALPATH BOTH SIDES, and the reason is a platform fact this project
  // already walks into: git's `gitdir` file records the RESOLVED path,
  // while `mkdtemp` under `os.tmpdir()` hands back the symlinked one
  // (`/var` → `/private/var` here, as `/tmp` → `/private/tmp`, which is
  // where STATE sends every scratch worktree). The VERDICT never compares
  // these strings — it compares repository-relative paths — so this is
  // the fixture's business and not the guard's.
  expect(
    liveLanes(fx.repo).map((l) => realpathSync(l.worktree)),
    "a checkout that is not on a lane branch was read as a lane",
  ).toEqual([realpathSync(fx.lane)]);
  expect(ask(fx.repo, path.join(fx.repo, "app/src/main.tsx")).verdict).toBe("allow");

  // AND A LANE THAT IS GONE STOPS FENCING. `git worktree remove` prunes
  // the administration, but a crash or an `rm -rf` does not — and an
  // entry pointing at a tree nobody is working in must never hold the
  // integration seat out of the repository.
  const admin = path.join(fx.repo, ".git", "worktrees");
  expect(existsSync(admin), "the fixture has no worktree administration to read").toBe(true);
  rmSync(fx.lane, { recursive: true, force: true });
  expect(readdirSync(admin).length, "the administration was pruned, so this proves nothing").toBeGreaterThan(0);
  expect(liveLanes(fx.repo)).toEqual([]);
  const afterward = ask(fx.repo, held);
  expect(afterward.verdict, afterward.reason).toBe("allow");
  expect(afterward.code).toBe("not-a-lane");
});

test("a live lane with no readable manifest reserves nothing here, and is still refused in its own arm", async () => {
  const fx = makeFixture();
  await arm(fx);
  const held = "tools/e2e/tests/fixture.spec.ts";
  expect(ask(fx.repo, path.join(fx.repo, held)).code).toBe("held-by-a-live-lane");

  rmSync(path.join(fx.lane, MANIFEST_REL_PATH));
  // Limit 4: this seat cannot be told to stop, so a fence it cannot read
  // reserves nothing — the refusal belongs to the lane's own first write.
  const third = ask(fx.repo, path.join(fx.repo, held));
  expect(third.verdict, third.reason).toBe("allow");
  expect(third.code).toBe("not-a-lane");
  expect(ask(fx.lane, path.join(fx.lane, held)).code).toBe("no-manifest");
});

test("what the lane-less seat may write, a LANE still may not — the two seats are two rules", async () => {
  const fx = makeFixture();
  await arm(fx);

  // docs/STATE.md is this seat's standing write and is outside the
  // lane's fence, so the same path answers oppositely in the two seats.
  // A hook that fed the seat's carve-outs to the lane arm would widen
  // every fence in the repository by this constant.
  expect(ask(fx.repo, path.join(fx.repo, "docs/STATE.md")).verdict).toBe("allow");
  const inLane = ask(fx.lane, path.join(fx.lane, "docs/STATE.md"));
  expect(inLane.verdict, inLane.reason).toBe("block");
  expect(inLane.code).toBe("outside-the-fence");
  expect(inLane.reason).toContain(ROUTE);

  // AND WHAT THE TWO SEATS SHARE: a path in NO repository is unjudged
  // whoever asks. That is all of limit 2 after T-199 — the WRITER's
  // checkout stopped being the term, so where the asker sits no longer
  // moves this answer at all.
  const elsewhere = path.join(scratchRoot(), "notes.md");
  expect(ask(fx.repo, elsewhere).code, "limit 2 does not hold for the seat with no lane").toBe(
    "not-a-repository",
  );
  expect(ask(fx.lane, elsewhere).code).toBe("not-a-repository");
  // Discriminating: the same seat, a path INSIDE it that a lane holds.
  expect(ask(fx.repo, path.join(fx.repo, "tools/e2e/x.ts")).code).toBe("held-by-a-live-lane");
});

test("the runner carries the lane-less refusal as an exit code too", async () => {
  const fx = makeFixture();
  await arm(fx);
  const hook = path.join(repoRoot, ".claude/hooks/lane-fence-hook.mjs");
  const call = (cwd: string, filePath: string) =>
    spawnSync(process.execPath, [hook], {
      input: JSON.stringify({
        hook_event_name: "PreToolUse",
        tool_name: "Write",
        cwd,
        tool_input: { file_path: filePath },
      }),
      encoding: "utf8",
    });

  const blocked = call(fx.repo, path.join(fx.repo, "tools/e2e/tests/fixture.spec.ts"));
  expect(blocked.status, "the lane-less refusal did not cross the process boundary").toBe(2);
  expect(blocked.stderr).toContain("LANE FENCE");
  expect(blocked.stderr).toContain(FIXTURE_ID);
  expect(blocked.stdout, "a refusal that prints on stdout depends on being parsed").toBe("");

  // The same seat, a path no lane holds: silent, exit 0. An allow that
  // spoke would short-circuit the harness's own permission flow.
  const allowed = call(fx.repo, path.join(fx.repo, "app/src/main.tsx"));
  expect(allowed.status, allowed.stderr).toBe(0);
  expect(allowed.stdout).toBe("");
  expect(allowed.stderr).toBe("");
});

test("a suffixed card id survives every derivation that once truncated it — the id is not the slug's prefix", () => {
  // T-143's class, fourth measured instance (2026-08-29, integrator at
  // the T-153-s5 dispatch): `brief.mjs --task T-153-s5` resolved card
  // T-153, and `--write-fence` stamped T-153's app-shell fence into the
  // s5 lane — and the T-153-s2 lane before it ran its WHOLE arc under
  // its parent's manifest, enforcing a fence nobody dispatched. The
  // board's id vocabulary (tasks/TASK-FORMAT.md) makes suffixed ids
  // real cards, and `task/T-153-s5-clock-...` is ambiguous under the
  // published `task/T-NNN-<slug>` spelling; every reader below must
  // prefer the suffixed reading, because the other one hands back a
  // DIFFERENT card and calls it yours.
  expect(normaliseTaskId("T-153-s5")).toBe("T-153-s5");
  expect(normaliseTaskId("153")).toBe("T-153");
  expect(normaliseTaskId("docs/tasks/T-111-s10-the-drills-own.md")).toBe("T-111-s10");
  expect(normaliseTaskId("docs/tasks/T-153-the-first-ci-run.md")).toBe("T-153");
  const { branchRe } = laneSpellings(conventionsText(repoRoot));
  expect(laneIdOf("refs/heads/task/T-153-s5-clock-restore-guard", branchRe)).toBe("T-153-s5");
  expect(laneIdOf("refs/heads/task/T-153-inotify-sentinels", branchRe)).toBe("T-153");
  // And the armed hook still reads a suffixed branch as a lane at all.
  expect(LANE_BRANCH_RE.test("refs/heads/task/T-153-s5-clock-restore-guard")).toBe(true);
});

/* ────────────────────────────────────────────────────────────────────
 * THE SHAPE THIS PROJECT ACTUALLY DISPATCHES (T-199)
 *
 * Everything above this line drives the guard from a writer sitting IN
 * the checkout it is judging. That is not how this project dispatches,
 * and the difference is the whole card: `method/lane-protocol.md` rule 3
 * REQUIRES a lane worktree to be a SIBLING of the repository, the
 * dispatching seat runs from a checkout NESTED under `.claude/worktrees/`,
 * and a subagent inherits the dispatching session's project root. So the
 * writer's checkout never contained the target, `decide` rooted on the
 * WRITER, and every lane write for seven lanes took an allow written for
 * the scratchpad — never denied, never permitted-with-a-carve, NEVER
 * EVALUATED.
 *
 * A GUARD THAT REFUSES EVERYTHING IS INDISTINGUISHABLE FROM ONE THAT
 * WORKS, so no body below asserts a refusal alone. Each is paired with a
 * write that must still LAND, through the same runner, in the same
 * fixture, in the same run.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * The dispatching seat: a checkout NESTED inside the repository, on a
 * branch that is not a lane.
 *
 * THE NESTING IS THE POINT AND NOT DECORATION. With the seat inside the
 * repository and the lane beside it, `path.relative(seat, lane)` climbs
 * out — which is exactly the condition the deleted limit tested, and
 * exactly why it fired on every ordinary write instead of on an
 * exception. A fixture whose seat sat in `repo` itself could not
 * reproduce the defect at all.
 */
function addDispatchSeat(fx: Fixture): string {
  const seat = path.join(fx.repo, ".claude/worktrees/session");
  git(fx.repo, ["worktree", "add", "--quiet", "-b", "claude/session-fixture", seat]);
  return seat;
}

/** A file's bytes as a digest, or the string `absent`. */
function digest(file: string): string {
  return existsSync(file) ? createHash("sha256").update(readFileSync(file)).digest("hex") : "absent";
}

/**
 * THE HARNESS CONTRACT, PERFORMED RATHER THAN ASSERTED.
 *
 * `.claude/settings.json` wires the runner as a PreToolUse command hook,
 * and `lane-fence-hook.mjs`'s own header states the contract: exit 2
 * refuses the tool call, exit 0 lets it proceed. So this function IS the
 * harness for the width of one write — it runs the real runner as a real
 * subprocess with the real request on stdin, and performs the write ONLY
 * on exit 0.
 *
 * WHY NOT ASSERT `decide`'s RETURN VALUE. Because a decision function
 * that answers `block` while the file still changes on disk is precisely
 * the failure this card is made of, one layer up: for seven lanes this
 * hook answered correctly for every write it was ASKED about and was
 * asked about none of them. `T-167-s8` shipped its push guard proved
 * against a real bare remote in three arms — a real attempt, a real
 * refusal, and the protected thing asserted UNCHANGED — and that shape
 * is the one borrowed here.
 */
function harnessWrite(
  cwd: string,
  filePath: string,
  content: string,
): { status: number | null; stdout: string; stderr: string; wrote: boolean } {
  const hook = path.join(repoRoot, ".claude/hooks/lane-fence-hook.mjs");
  const ran = spawnSync(process.execPath, [hook], {
    input: JSON.stringify({
      hook_event_name: "PreToolUse",
      tool_name: "Write",
      cwd,
      tool_input: { file_path: filePath },
    }),
    encoding: "utf8",
  });
  const wrote = ran.status === 0;
  if (wrote) {
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, "utf8");
  }
  return { status: ran.status, stdout: ran.stdout, stderr: ran.stderr, wrote };
}

test("a lane's OUT-OF-FENCE write is refused in the sibling/nested shape, and the file is UNCHANGED", async () => {
  const fx = makeFixture();
  const manifest = await arm(fx);
  const seat = addDispatchSeat(fx);

  // THE SHAPE FIRST, because the defect was a configuration and not a
  // rule. Assert the fixture really has the geometry that broke the
  // guard, or the refusal below proves nothing about the live world.
  const seatHead = readHeadRef(seat);
  expect(findCheckoutRoot(seat), "the nested seat's own .git pointer was not followed").toBe(seat);
  expect(seatHead).toBe("refs/heads/claude/session-fixture");
  expect(LANE_BRANCH_RE.test(seatHead ?? ""), "the seat is on a lane branch").toBe(false);
  expect(findCheckoutRoot(fx.lane)).toBe(fx.lane);
  expect(
    path.relative(seat, fx.lane).startsWith(".."),
    "the lane is INSIDE the writer's checkout — this fixture cannot reproduce the defect",
  ).toBe(true);
  expect(manifest.paths, "the fixture fence would have allowed the drill anyway").not.toContain(
    "app/src",
  );

  // ARM 1 — A REAL ATTEMPT, from the seat that really dispatches.
  const target = path.join(fx.lane, "app/src/main.tsx");
  const before = digest(target);
  expect(before, "the fixture's protected file is missing").not.toBe("absent");
  const refused = harnessWrite(seat, target, "export const main = 'BREACHED';\n");

  // ARM 2 — A REAL REFUSAL, at the exit code the harness obeys.
  expect(refused.status, `the write was not refused: ${refused.stderr}`).toBe(2);
  expect(refused.stderr).toContain("LANE FENCE");
  expect(refused.stderr).toContain(FIXTURE_ID);
  expect(refused.stderr).toContain("app/src/main.tsx");
  expect(refused.stderr).toContain(ROUTE);
  expect(refused.stdout, "a refusal that prints on stdout depends on being parsed").toBe("");

  // ARM 3 — THE PROTECTED THING, UNCHANGED. Not "the function returned
  // block": the bytes on disk, and the lane's own git status.
  expect(refused.wrote).toBe(false);
  expect(digest(target), "the refusal did not stop the write").toBe(before);
  expect(git(fx.lane, ["status", "--porcelain", "--", "app/src"]).trim()).toBe("");
});

test("THE POSITIVE CONTROL: the same seat's IN-FENCE write is allowed and LANDS", async () => {
  const fx = makeFixture();
  await arm(fx);
  const seat = addDispatchSeat(fx);

  // A GUARD THAT REFUSES EVERYTHING PASSES THE BODY ABOVE. This is the
  // half it cannot pass, and the card names it as the point: a body that
  // only proves in-fence writes succeed passes identically against a
  // hook that judges nothing, and a body that only proves out-of-fence
  // writes fail passes identically against a hook that refuses
  // everything. Both arms, one fixture, one runner, one run.
  const inFence = path.join(fx.lane, "tools/e2e/tests/fixture.spec.ts");
  const was = readFileSync(inFence, "utf8");
  const now = "export const spec = 199;\n";
  expect(now, "the control writes the bytes that were already there").not.toBe(was);

  const allowed = harnessWrite(seat, inFence, now);
  expect(allowed.status, allowed.stderr).toBe(0);
  expect(allowed.stdout, "an allow that speaks on stdout can GRANT").toBe("");
  expect(allowed.stderr, "a JUDGED allow is silent — only a decline speaks").toBe("");
  expect(allowed.wrote).toBe(true);
  expect(readFileSync(inFence, "utf8"), "the allowed write did not reach the disk").toBe(now);

  // The unfenceable directory too: every card's protocol writes there,
  // and a guard that stopped the closing stamp is a guard turned off.
  const card = path.join(fx.lane, "docs/tasks/T-902-a-suggestion-this-lane-files.md");
  const filed = harnessWrite(seat, card, "---\nid: T-902\n---\n");
  expect(filed.status, filed.stderr).toBe(0);
  expect(existsSync(card), "docs/tasks stopped being always-writable").toBe(true);

  // AND THE DISCRIMINATION, same seat and same process boundary: a hook
  // that allowed those two because it judges nothing would allow this.
  const breach = harnessWrite(fx.lane, path.join(fx.lane, "docs/ROADMAP.md"), "BREACHED\n");
  expect(breach.status, "the guard is inert — every write is passing").toBe(2);
  expect(readFileSync(path.join(fx.lane, "docs/ROADMAP.md"), "utf8")).not.toContain("BREACHED");
});

test("the root comes from the TARGET, so the verdict does not move with the writer", async () => {
  const fx = makeFixture();
  await arm(fx);
  const seat = addDispatchSeat(fx);

  // ONE TARGET, SIX WRITER LOCATIONS, ONE ANSWER. This is the defect
  // stated as an invariant: `decide` rooted on `request.cwd`, so the
  // verdict below moved with the writer and answered `outside-the-
  // checkout` from five of these six.
  const outside = path.join(fx.lane, "app/src/main.tsx");
  const inside = path.join(fx.lane, "tools/e2e/tests/fixture.spec.ts");
  for (const from of [fx.lane, seat, fx.repo, fx.drill, scratchRoot(), os.tmpdir()]) {
    const refusal = ask(from, outside);
    expect(refusal.code, `an out-of-fence write asked from ${from}`).toBe("outside-the-fence");
    expect(refusal.judged).toBe(true);
    expect(ask(from, inside).code, `an in-fence write asked from ${from}`).toBe("inside-the-fence");
  }

  // AND A RELATIVE TARGET IS STILL THE WRITER'S TO RESOLVE — the one job
  // `cwd` keeps. Asked from the lane, `app/src/main.tsx` is that lane's
  // file and is refused; asked from the seat it is the seat's own file,
  // which no lane holds.
  expect(ask(fx.lane, "app/src/main.tsx").code).toBe("outside-the-fence");
  expect(ask(seat, "app/src/main.tsx").code).toBe("not-a-lane");
});

test("an unjudged write SAYS SO — a decline is distinguishable from a judged allow", async () => {
  const fx = makeFixture();
  await arm(fx);
  const seat = addDispatchSeat(fx);

  // THE PARTITION IS DECLARED AND EXHAUSTIVE. Every limit in the hook's
  // header ends in an allow, which is how an inert fence produced output
  // byte-identical to a working one across seven lanes.
  const judged = ask(seat, path.join(fx.lane, "tools/e2e/tests/fixture.spec.ts"));
  expect(judged.judged).toBe(true);
  expect(DECLINE_CODES, "a judged verdict is being reported as a decline").not.toContain(
    judged.code,
  );
  const declined = ask(seat, path.join(scratchRoot(), "notes.md"));
  expect(declined.verdict).toBe("allow");
  expect(declined.judged).toBe(false);
  expect(DECLINE_CODES).toContain(declined.code);
  expect(ask(fx.drill, path.join(fx.drill, "app/src/main.tsx")).judged).toBe(false);

  // AT THE RUNNER, THROUGH THE REAL PROCESS BOUNDARY. Without the pair,
  // "the hook printed nothing" is what BOTH a working fence and an inert
  // one look like — the sentence this whole card is made of.
  const hook = path.join(repoRoot, ".claude/hooks/lane-fence-hook.mjs");
  const call = (cwd: string, filePath: string) =>
    spawnSync(process.execPath, [hook], {
      input: JSON.stringify({
        hook_event_name: "PreToolUse",
        tool_name: "Write",
        cwd,
        tool_input: { file_path: filePath },
      }),
      encoding: "utf8",
    });

  const quiet = call(seat, path.join(fx.lane, "tools/e2e/tests/fixture.spec.ts"));
  expect(quiet.status, quiet.stderr).toBe(0);
  expect(quiet.stderr, "a judged allow speaks, so a decline cannot be told from one").toBe("");
  expect(quiet.stdout).toBe("");

  const loud = call(seat, path.join(scratchRoot(), "notes.md"));
  expect(loud.status, "a decline must not change which writes proceed").toBe(0);
  expect(loud.stdout, "a decline on stdout could be parsed as a permission GRANT").toBe("");
  expect(loud.stderr, "the decline is silent — the defect's own signature").toContain(
    "LANE FENCE (not judged)",
  );
  expect(loud.stderr).toContain("not-a-repository");
});

test("the push guard's import list from this module is a contract, and it still holds", () => {
  // `.claude/hooks/push-guard.mjs` takes five symbols from this module
  // rather than re-spelling them (T-057). Git merges a rename on one
  // side and a use on the other perfectly cleanly, and the push guard
  // then breaks at a push instead of here — so the list is asserted by
  // NAME against the live exports.
  const src = readFileSync(path.join(repoRoot, ".claude/hooks/push-guard.mjs"), "utf8");
  const found = /import\s*\{([^}]*)\}\s*from\s*"\.\/lane-fence\.mjs"/.exec(src);
  expect(found, "push-guard.mjs no longer imports from lane-fence.mjs at all").not.toBeNull();
  const imported = (found?.[1] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
  expect(imported.length, "the import list could not be read").toBeGreaterThan(0);
  expect(
    imported,
    "a symbol the push guard depends on has been dropped from its own import list",
  ).toEqual(
    expect.arrayContaining([
      "LANE_BRANCH_RE",
      "findCheckoutRoot",
      "readHeadRef",
      "readManifest",
      "within",
    ]),
  );
  // COMPARED AGAINST THE LIVE MODULE, not against a second copy of the
  // list: a rename here reds by name instead of at somebody's push.
  expect(Object.keys(laneFenceHook)).toEqual(expect.arrayContaining(imported));
});

/* ────────────────────────────────────────────────────────────────────
 * THE INTERSECTION (T-209) — rule 5's law, computed instead of asserted
 *
 * `method/lane-protocol.md` rule 5 has mandated expanded-set lane
 * disjointness since it was bought with a defect, and nothing computed
 * it: every concurrent dispatch was a seat comparing `touches:` STRINGS
 * in its head. The bodies below drive the real writer over real git
 * worktrees, and the FIRST of them is the positive control, because a
 * guard that refuses every dispatch is indistinguishable from one that
 * works (T-199's lesson, and this card's own first criterion).
 * ──────────────────────────────────────────────────────────────────── */

/** Read a lane's manifest off disk, as JSON. */
function manifestOf(lane: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(lane, MANIFEST_REL_PATH), "utf8"));
}

/** Rewrite one field of a lane's manifest, the way a hand-edit would. */
function tamperManifest(lane: string, patch: Record<string, unknown>): void {
  const held = manifestOf(lane);
  writeFileSync(
    path.join(lane, MANIFEST_REL_PATH),
    `${JSON.stringify({ ...held, ...patch }, null, 2)}\n`,
    "utf8",
  );
}

test("THE POSITIVE CONTROL: a genuinely disjoint pair is ALLOWED, and the overlapping pair beside it is not", async () => {
  // THE GUARD'S STATE IS ASSERTED FIRST, per this file's own rule about
  // lifting a safety guard: an allow proves nothing unless the same
  // machinery is shown refusing one fixture over. Both halves run against
  // the SAME armed lane, so the only thing that moves is the fence.
  const fx = makeFixture("touches: [tools/e2e]");
  await arm(fx);

  // (a) THE REFUSAL — a second lane claiming the same expanded path.
  const overlapping = await cutLane(fx, "T-902", "touches: [tools/e2e]");
  await expect(
    buildLaneFence("T-902", overlapping, { root: fx.repo }),
    "two lanes over one expanded path have to be refused, or the allow below means nothing",
  ).rejects.toThrow(/is not disjoint from every live lane/);
  // A REFUSED DISPATCH LEAVES NO LANE. Removing it is not fixture
  // housekeeping — it is the remedy the refusal names, and leaving the
  // worktree standing would make the allow below answer a different
  // question (an unarmed lane is one this check refuses on its own
  // terms, which is the body two down).
  git(fx.repo, ["worktree", "remove", "--force", overlapping]);

  // (b) THE ALLOW — a third lane over ground nobody holds. Same command,
  // same repository, same live lane; only the fence differs.
  const disjoint = await addLane(fx, "T-903", "touches: [app/src/main.tsx]");
  expect(
    disjoint.manifest.paths,
    "a genuinely disjoint lane must be dispatchable — a guard that refuses everything is not a guard",
  ).toEqual(["app/src/main.tsx"]);
  expect(existsSync(path.join(disjoint.lane, MANIFEST_REL_PATH))).toBe(true);
});

test("a DIRECTORY token and a FILE beneath it are NOT disjoint — the case string equality gets wrong", async () => {
  // THE CARD'S SECOND CONTROL, on a path that EXISTS. The criterion first
  // named a hypothetical `x.mjs` and the dispatch preflight refused this
  // very lane's fence for it as a STALE PATH — so the pin is anchored to
  // the live repository here, and the fixture mirrors it.
  expect(
    existsSync(path.join(repoRoot, ".claude/hooks/lane-fence.mjs")),
    "the control's path must exist in the repository, not be a placeholder",
  ).toBe(true);

  const fx = makeFixture("touches: [.claude]");
  // `.claude` is a BARE WORD, and `expandFence` can only tell a directory
  // from a word that names nothing through the tracked-path oracle — so
  // the file has to be committed before the fence is expanded.
  writeFixtureFile(fx.repo, ".claude/hooks/lane-fence.mjs", "export const hook = 1;\n");
  git(fx.repo, ["add", "-A"]);
  git(fx.repo, ["commit", "-m", "fixture hook", "--quiet"]);
  const held = await arm(fx);
  expect(held.paths, "the directory token must expand to the directory").toEqual([".claude"]);

  const beneath = await cutLane(fx, "T-902", "touches: [.claude/hooks/lane-fence.mjs]");
  let refusal = "";
  try {
    await buildLaneFence("T-902", beneath, { root: fx.repo });
    expect(false, "a file beneath a held directory was reported disjoint").toBe(true);
  } catch (err) {
    refusal = err instanceof Error ? err.message : String(err);
  }
  // `.claude` and `.claude/hooks/lane-fence.mjs` are different strings and
  // sort apart; containment is what sees them.
  expect(refusal).toContain("is not disjoint from every live lane");
  expect(refusal, "the refusal must name the NARROWER domain — what both fences reserve").toContain(
    "shared path .claude/hooks/lane-fence.mjs",
  );
});

test("the refusal NAMES BOTH LANES and the overlapping paths — a refusal that does not is this card", async () => {
  const fx = makeFixture("touches: [tools/e2e]");
  await arm(fx);
  const other = await cutLane(fx, "T-902", "touches: [tools/e2e/tests/fixture.spec.ts]");
  let refusal = "";
  try {
    await buildLaneFence("T-902", other, { root: fx.repo });
  } catch (err) {
    refusal = err instanceof Error ? err.message : String(err);
  }
  expect(refusal, "the card being dispatched").toContain("T-902");
  expect(refusal, "the lane already holding the ground").toContain(FIXTURE_ID);
  expect(refusal, "the branch, so the seat can find the session").toContain(
    `task/${FIXTURE_ID}-guard-fixture`,
  );
  expect(refusal, "the worktree, so the seat can find the tree").toContain(fx.lane);
  expect(refusal, "what each side DECLARED, verbatim").toContain("touches: [tools/e2e]");
  expect(refusal, "the overlapping path itself").toContain(
    "shared path tools/e2e/tests/fixture.spec.ts",
  );
  expect(refusal, "the law it is enforcing, so the refusal is checkable").toContain(
    "method/lane-protocol.md rule 5",
  );
});

test("THE LIVE-LANE SET IS DERIVED FROM DISK AT DECISION TIME — the same call answers differently as the board moves", async () => {
  // THE DEFECT THIS BODY EXISTS FOR IS MEASURED, NOT IMAGINED: a
  // throwaway version of this check written at the integrator seat had
  // the live lane list HARDCODED, and silently excluded every card
  // touching `tools/e2e`. Nothing below passes a lane list, and the ONLY
  // thing that changes between the two calls is the repository's own
  // worktree administration.
  const fx = makeFixture("touches: [tools/e2e]");
  await arm(fx);
  const rival = await cutLane(fx, "T-902", "touches: [tools/e2e]");

  await expect(
    buildLaneFence("T-902", rival, { root: fx.repo }),
    "while the first lane is live the ground is held",
  ).rejects.toThrow(/is not disjoint from every live lane/);

  // The lane goes away. Same arguments, same command, different disk.
  git(fx.repo, ["worktree", "remove", "--force", fx.lane]);
  const now = await buildLaneFence("T-902", rival, { root: fx.repo });
  expect(
    now.paths,
    "a merged lane releases its ground, and the check has to read that rather than remember it",
  ).toEqual(["tools/e2e"]);
});

test("THREE VERDICTS: a live lane whose fence cannot be READ is refused, never reported disjoint", async () => {
  // Rule 5 in as many words: "a fence that answers 'no overlap' when it
  // means 'I do not know' is worse than one that refuses. Three verdicts,
  // never two." The hook's own `liveLanes` SKIPS an unreadable lane —
  // correct at the write, where letting a stale entry lock the
  // integration seat out would be worse — and that skip is the defect at
  // DISPATCH, which is why this module enumerates for itself.
  const fx = makeFixture("touches: [app/src/main.tsx]");
  // A sibling cut but never armed: a lane on disk holding no manifest.
  await cutLane(fx, "T-902", "touches: [tools/e2e]");
  expect(
    liveLanes(fx.repo).map((l) => l.branch),
    "the hook's enumeration drops the unarmed lane — this is the divergence, pinned",
  ).not.toContain("refs/heads/task/T-902-sibling");

  let refusal = "";
  try {
    await buildLaneFence(FIXTURE_ID, fx.lane, { root: fx.repo });
  } catch (err) {
    refusal = err instanceof Error ? err.message : String(err);
  }
  expect(refusal, "an unread fence is not 'disjoint from everything'").toContain("CANNOT COMPARE");
  expect(refusal).toContain("T-902");
  expect(refusal).toContain("no fence manifest");
});

test("a lane whose manifest reserves NO PATH is refused rather than treated as reserving nothing", async () => {
  // The third case the card does not name. A zero-path manifest cannot be
  // WRITTEN by this module — the guard above refuses it — so one found on
  // disk is a hand-edit or a pre-guard artefact, and the honest answer is
  // that the comparison could not be made.
  const fx = makeFixture("touches: [app/src/main.tsx]");
  // The fixture lane is ARMED first: a lane cut and not armed is one
  // this check refuses in its own right, and this body is about a
  // different question.
  await arm(fx);
  const sibling = await addLane(fx, "T-902", "touches: [tools/e2e]");
  tamperManifest(sibling.lane, { paths: [] });

  let refusal = "";
  try {
    await buildLaneFence(FIXTURE_ID, fx.lane, { root: fx.repo });
  } catch (err) {
    refusal = err instanceof Error ? err.message : String(err);
  }
  expect(refusal).toContain("CANNOT COMPARE");
  expect(refusal).toContain("reserves no path at all");
});

test("`alwaysWritable` PARTICIPATES — two lanes judged under different unfenceable sets cannot be compared", async () => {
  // A manifest carries THREE lists and an intersection over one of them
  // headed *complete* is T-194's defect. `alwaysWritable` is the parser's
  // UNFENCEABLE_PATHS frozen at the ref its manifest was stamped at, so a
  // live lane carrying a different one was judged under a different
  // constitution and the comparison between them is not sound.
  const fx = makeFixture("touches: [app/src/main.tsx]");
  // The fixture lane is ARMED first: a lane cut and not armed is one
  // this check refuses in its own right, and this body is about a
  // different question.
  await arm(fx);
  const sibling = await addLane(fx, "T-902", "touches: [tools/e2e]");
  expect(sibling.manifest.alwaysWritable, "the writer stamps the live set").toEqual(["docs/tasks"]);
  tamperManifest(sibling.lane, { alwaysWritable: ["docs/tasks", "docs/rooms"] });

  let refusal = "";
  try {
    await buildLaneFence(FIXTURE_ID, fx.lane, { root: fx.repo });
  } catch (err) {
    refusal = err instanceof Error ? err.message : String(err);
  }
  expect(refusal).toContain("CANNOT COMPARE");
  expect(refusal, "the refusal names both constitutions").toContain("docs/rooms");
  expect(refusal).toContain("unfenceable set moved");
});

test("`excluded` PARTICIPATES — a card's own file is not a collision with the lane that carved it out", async () => {
  // A card's own file is outside every fence including its own, which
  // `expandFence` records in `excluded` and `compareFences` already
  // subtracts. Pinned at THIS call site because the manifest is where the
  // carve-out has to survive a round trip through JSON.
  const fx = makeFixture("touches: [app/src/main.tsx]");
  // The fixture lane is ARMED first: a lane cut and not armed is one
  // this check refuses in its own right, and this body is about a
  // different question.
  await arm(fx);
  // THE SIBLING NAMES ITS OWN CARD, WHICH IS WHAT T-219 LEFT AVAILABLE
  // AND IS ALSO THE STRONGER FIXTURE. It used to fence the bare `docs`
  // and reach its own card by CONTAINMENT; that token is now refused,
  // because a domain containing `docs/tasks` holds every card's file.
  // Naming the card outright exercises the carve-out's exact-file arm —
  // the one `expandFence` actually implements — and `docs/rooms` is
  // beside it only so the fence reserves something, which
  // `buildLaneFence` requires separately. The body's own title moved
  // with the fixture: the lane no longer holds a DIRECTORY, it holds the
  // file it carved out, and the property is the carve-out either way.
  const sibling = await addLane(
    fx,
    "T-902",
    "touches: [docs/rooms, docs/tasks/T-902-a-sibling-lane.md]",
  );
  expect(
    sibling.manifest.excluded,
    "the sibling's own card is carved out of its own fence",
  ).toEqual(["docs/tasks/T-902-a-sibling-lane.md"]);
  expect(
    sibling.manifest.paths,
    "the carve-out swallowed the fence instead of one file",
  ).toEqual(["docs/rooms"]);

  // A third lane fencing exactly that carved-out file is NOT colliding
  // with the lane whose own card it is.
  const third = await addLane(fx, "T-903", "touches: [docs/tasks/T-902-a-sibling-lane.md]");
  expect(
    third.manifest.paths,
    "the file the other lane excluded is ground it does not hold",
  ).toEqual(["docs/tasks/T-902-a-sibling-lane.md"]);
});

test("a card fencing a domain that CONTAINS `docs/tasks` is refused at the arm, naming what it swallowed", async () => {
  // T-219, pinned at the call site the ruling is FOR. `method/lane-protocol.md`
  // rule 5 refuses the directory the protocol writes to on every card, and
  // until T-219 that refusal was EXACT-MATCH on the normalised token — so
  // `docs/tasks` was refused and the bare `docs` beside it was accepted and
  // expanded to a domain containing it. Two fixtures in this very file held
  // that token, which is how the gap survived: the specs pinned the fence a
  // card may not hold.
  //
  // WITHOUT THIS BODY THE ONLY TRACE OF THE RULING WOULD BE THE ABSENCE of
  // those two fixtures, and an absence pins nothing — the next author to
  // want a wide docs fence would write one and find out from a suite that
  // does not say why.
  const fx = makeFixture("touches: [tools/e2e, docs]");
  await expect(buildLaneFence(FIXTURE_ID, fx.lane, { root: fx.repo })).rejects.toThrow(
    /CONTAINS 'docs\/tasks'/,
  );

  // THE CONTROL, and it is the direction that matters: the remedy the rule
  // names in the same breath — "Name the individual files instead" — still
  // arms. A containment test run in BOTH directions would refuse this too,
  // and this fixture is the difference between the two implementations.
  const named = makeFixture(`touches: [tools/e2e, ${FIXTURE_CARD}]`);
  const manifest = await buildLaneFence(FIXTURE_ID, named.lane, { root: named.repo });
  expect(manifest.paths).toEqual(["tools/e2e"]);
  expect(manifest.excluded).toEqual([FIXTURE_CARD]);
});

test("a card with an EMPTY `touches:` is refused rather than dispatched with the widest licence", async () => {
  // The card rules an absent or empty `touches:` the UNIVERSAL SET, so
  // that deleting the declaration is not the bypass and the least careful
  // card does not get the widest licence. The repository answers it one
  // step EARLIER than the intersection and more strictly: such a card is
  // not dispatchable at all. Pinned here so the criterion cannot regress
  // silently into a fence that collides with nothing.
  //
  // WHICH OF TWO REFUSALS THIS BODY READS IS A DESIGN CHOICE AND NOT AN
  // ACCIDENT (T-219, absorbing T-227). `expandFence` now refuses an empty
  // `touches:` too, and it does so with an ISSUE rather than an entry in
  // `Fence.unusable` — that list is documented as raw TOKENS and an empty
  // declaration owns none. Had the refusal gone into `unusable`,
  // `buildLaneFence`'s unresolved-token guard would fire FIRST and this
  // regex would stop matching, so this assertion is load-bearing on that
  // choice: if it ever reds with a message about tokens, the parser put a
  // sentinel where a token belongs.
  const fx = makeFixture("touches: []");
  await expect(buildLaneFence(FIXTURE_ID, fx.lane, { root: fx.repo })).rejects.toThrow(
    /expands to no path at all/,
  );
});

test("a DETACHED worktree holds no fence, however much of the tree it is sitting on", async () => {
  // The enumeration's own positive control, and rule 5 names it: a
  // checkout that is not on a task branch is ALLOWED — the integrator,
  // the coordinating seat, @human's `../supertaskr-app` and every scratch
  // drill. Lane-ness is decided by the BRANCH and never by the path or by
  // the presence of a manifest, so a drill carrying one changes nothing.
  const fx = makeFixture("touches: [tools/e2e]");
  mkdirSync(path.join(fx.drill, path.dirname(MANIFEST_REL_PATH)), { recursive: true });
  writeFileSync(
    path.join(fx.drill, MANIFEST_REL_PATH),
    `${JSON.stringify(
      {
        version: MANIFEST_VERSION,
        taskId: "T-909",
        branch: "refs/heads/task/T-909-not-really",
        card: "docs/tasks/T-909-x.md",
        touchesLine: "touches: [tools/e2e]",
        paths: ["tools/e2e"],
        excluded: [],
        alwaysWritable: ["docs/tasks"],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  const manifest = await buildLaneFence(FIXTURE_ID, fx.lane, { root: fx.repo });
  expect(
    manifest.paths,
    "a detached checkout is not a lane, so the ground is free",
  ).toEqual(["tools/e2e"]);
});

test("THE COMPARISON IS THE PARSER'S — this module holds no second intersection", async () => {
  // T-057: three copies of a containment rule are three chances to
  // compute it differently. The verdict has to come from
  // `compareFences` and from nothing this file re-spelled, so a stub
  // parser is handed provably DISJOINT fences and answers `overlapping`.
  // A local re-derivation would out-vote it and red this body.
  const calls: unknown[][] = [];
  const stub = {
    UNFENCEABLE_PATHS: ["docs/tasks"],
    compareFences: (a: unknown, b: unknown) => {
      calls.push([a, b]);
      return {
        verdict: "overlapping",
        witnesses: [{ left: "left-token", right: "right-token", path: "invented/domain" }],
        unusable: [],
      };
    },
  };
  const fx = makeFixture("touches: [app/src/main.tsx]");
  // The fixture lane is ARMED first: a lane cut and not armed is one
  // this check refuses in its own right, and this body is about a
  // different question.
  await arm(fx);
  const sibling = await addLane(fx, "T-902", "touches: [tools/e2e]");
  const porcelain = git(fx.repo, ["worktree", "list", "--porcelain"]);
  const report = laneDisjointness({
    fence: { tokens: [{ raw: "app/src/main.tsx", paths: ["app/src/main.tsx"] }], paths: ["app/src/main.tsx"], excluded: [] },
    taskId: FIXTURE_ID,
    worktree: fx.lane,
    porcelain,
    spellings: laneSpellings(conventionsText(fx.repo)),
    parser: stub,
    alwaysWritable: ["docs/tasks"],
  });
  expect(calls.length, "the parser's comparison was never asked").toBe(1);
  expect(report.verdict, "the verdict is the parser's, not this file's").toBe("overlapping");
  expect(report.collisions[0]?.witnesses[0]?.path).toBe("invented/domain");
  expect(report.compared.map((c) => c.taskId), "the live lane was the one compared").toEqual([
    "T-902",
  ]);
  expect(sibling.manifest.taskId).toBe("T-902");

  // And the refusal is a pure function of that report.
  const text = disjointnessRefusal(report, FIXTURE_ID, "touches: [app/src/main.tsx]");
  expect(text).toContain("invented/domain");
  expect(text).toContain("T-902");
});

/* ────────────────────────────────────────────────────────────────────
 * THE SECRET READ GUARD (T-249)
 *
 * A SECOND QUESTION ASKED OF A DIFFERENT TOOL, and every body below is
 * written against the asymmetry that makes it not a fence: it screens a
 * READ, it consults no manifest, and it fails OPEN where the lane arm
 * fails closed. The `LIFTING A SAFETY GUARD` rules the header quotes
 * hold here unchanged — the allow bodies assert the guard's state first,
 * and every path named resolves under a fixture root or under a
 * `/Users/somebody/…` stem that exists on no machine. Nothing is read
 * off the real disk, which is the one thing a guard about reading must
 * not do to prove itself.
 * ──────────────────────────────────────────────────────────────────── */

/** One PreToolUse request from a READ tool, as the harness shapes it. */
function askRead(cwd: string, filePath: string, toolName = "Read"): ReturnType<typeof decide> {
  return decide({ toolName, cwd, toolInput: { file_path: filePath } });
}

/** Which entries of the secret set claim a path — the spec's own walk. */
function claimants(cwd: string, target: string): string[] {
  const abs = path.resolve(cwd, target);
  const segments = abs.split(path.sep).filter((s) => s !== "");
  const base = segments[segments.length - 1] ?? "";
  return SECRET_SET.filter((e) => matchesEntry(e, base, segments)).map((e) => e.name);
}

/**
 * The tree's own sources, and the NEAR-MISSES are the whole point.
 *
 * A negative list of unrelated paths would be satisfied by a guard whose
 * entries were all typos. Half of these are one character from an entry:
 * `settings.local.json` does not END in `.local`, `keys.ts` does not end
 * in `.key`, a `.pub` key is not a private one, `docker/` is not
 * `.docker/`, and `environment.ts` is not an env file.
 */
const PLANTED_NEGATIVES = [
  "docs/STATE.md",
  "docs/CONVENTIONS.md",
  ".claude/hooks/lane-fence.mjs",
  ".claude/settings.local.json",
  "app/src/main.tsx",
  "app/src/keys.ts",
  "app/src/environment.ts",
  "lib/parser/src/fence.ts",
  "tools/e2e/tests/lane-fence.spec.ts",
  "docs/id_ed25519.pub",
  "docker/Dockerfile",
] as const;

test("THE POSITIVE CONTROL, PER ENTRY: every entry refuses its OWN sample, and no other entry claims it", async () => {
  const fx = makeFixture();
  await arm(fx);

  // THE ANTI-VACUITY HALF FIRST: an empty set satisfies every loop below
  // at once, and "the guard has no entries" is exactly how this would
  // rot — an entry deleted in a merge leaves a shorter list and no red.
  expect(SECRET_SET.length, "the secret set is empty, so this body proves nothing").toBeGreaterThan(
    0,
  );

  for (const entry of SECRET_SET) {
    // ARM ONE — the sample is claimed by THIS entry and by NO OTHER. An
    // entry whose sample another entry already covers is decoration: it
    // could be deleted and every refusal below would still pass, which
    // is the one failure a per-entry control exists to exclude.
    expect(
      claimants(fx.lane, entry.sample),
      `${entry.name}'s sample is not matched by exactly that entry`,
    ).toEqual([entry.name]);

    // ARM TWO — and the guard's own answer NAMES it, so a session that
    // is refused learns which rule refused it rather than that "a guard"
    // did.
    const refused = askRead(fx.lane, entry.sample);
    expect(refused.verdict, `${entry.name} did not refuse its own sample: ${refused.reason}`).toBe(
      "block",
    );
    expect(refused.code).toBe("secret-read");
    expect(refused.judged, "a refusal reported as unjudged").toBe(true);
    expect(refused.reason, "the refusal does not name the entry that matched").toContain(entry.name);
    expect(refused.reason, "the refusal does not carry the entry's reason for existing").toContain(
      entry.why,
    );
    expect(refused.reason, "the refusal does not carry the route").toContain(ROUTE_SECRET);
  }

  // AND THE SET IS PUBLISHED IN EVERY REFUSAL, so a seat can see what
  // else it will meet without opening the hook.
  const one = askRead(fx.lane, ".env");
  for (const entry of SECRET_SET) expect(one.reason).toContain(entry.name);
});

test("THE PLANTED NEGATIVE: the tree's own sources read freely, and the near-misses stay readable", async () => {
  const fx = makeFixture();
  await arm(fx);

  // THE DISCRIMINATING HALF FIRST, in this same body and this same
  // fixture: without it, a guard that allowed EVERYTHING would pass
  // every assertion below.
  const refused = askRead(fx.lane, ".env");
  expect(refused.verdict, "the guard allows a `.env`, so the allows below prove nothing").toBe(
    "block",
  );

  expect(PLANTED_NEGATIVES.length).toBeGreaterThan(0);
  for (const rel of PLANTED_NEGATIVES) {
    const allowed = askRead(fx.lane, rel);
    expect(allowed.verdict, `${rel} is refused as a secret: ${allowed.reason}`).toBe("allow");
    expect(allowed.code, `${rel} was allowed without being classified`).toBe("not-a-secret");
    expect(allowed.judged, `${rel} was allowed without a judgement`).toBe(true);
    expect(claimants(fx.lane, rel), `${rel} is claimed by an entry`).toEqual([]);
  }
});

test("A FENCE WIDENS WRITES AND NEVER SECRETS — the same path is written inside the fence and refused to a read", async () => {
  const fx = makeFixture();
  const manifest = await arm(fx);

  // THE GUARD'S STATE FIRST, and here it is the FENCE's state that has
  // to be proved: `tools/e2e` is a domain this card really holds, so the
  // secret below is genuinely INSIDE the fence and the refusal cannot be
  // the ordinary out-of-fence one wearing a new code.
  const secret = "tools/e2e/.env";
  expect(manifest.paths, "the fixture card does not hold tools/e2e").toContain("tools/e2e");
  expect(
    manifest.paths.some((d: string) => within(secret, d)),
    "the planted secret is not inside this card's fence, so the body proves nothing",
  ).toBe(true);

  // THE WRITE IS ALLOWED — the fence really does name this path.
  const written = ask(fx.lane, path.join(fx.lane, secret));
  expect(written.verdict, written.reason).toBe("allow");
  expect(written.code).toBe("inside-the-fence");

  // AND THE READ OF THE VERY SAME PATH IS REFUSED. Not by an arm that
  // consults the manifest and overrides it — by a branch taken before
  // any manifest is opened, which is why `touches:` has no reach here.
  const read = askRead(fx.lane, path.join(fx.lane, secret));
  expect(read.verdict, "a card's own fence opened a secret").toBe("block");
  expect(read.code).toBe("secret-read");
  expect(read.reason).toContain("env-file");
});

test("READS ARE SCREENED AND NOT FENCED — a lane reads OUTSIDE its own fence, and still may not write there", async () => {
  const fx = makeFixture();
  const manifest = await arm(fx);

  const outside = "app/src/main.tsx";
  expect(
    manifest.paths.some((d: string) => within(outside, d)),
    "the path is inside the fence, so this body measures nothing",
  ).toBe(false);

  // THE WRITE IS REFUSED — the fence is armed and holds.
  const written = ask(fx.lane, path.join(fx.lane, outside));
  expect(written.verdict, "the fence is not armed, so the read below proves nothing").toBe("block");
  expect(written.code).toBe("outside-the-fence");

  // THE READ IS ALLOWED. A read guard that inherited the fence would
  // refuse here, and a lane that cannot read outside its own `touches:`
  // cannot read docs/STATE.md — which is step one of every role file.
  const read = askRead(fx.lane, path.join(fx.lane, outside));
  expect(read.verdict, "the read guard has become a second fence").toBe("allow");
  expect(read.code).toBe("not-a-secret");
  expect(askRead(fx.lane, path.join(fx.lane, "docs/STATE.md")).verdict).toBe("allow");
});

test("IT FAILS OPEN ON CLASSIFICATION, and every allow it cannot justify SAYS SO", async () => {
  const fx = makeFixture();
  await arm(fx);
  const nul = String.fromCharCode(0);

  // THE THREE UNCLASSIFIABLE SHAPES, each planted rather than described.
  const shapes: { what: string; request: Parameters<typeof decide>[0]; names?: string }[] = [
    {
      what: "no path field at all",
      request: { toolName: "Read", cwd: fx.lane, toolInput: {} },
    },
    {
      what: "a target that resolves to a filesystem root",
      request: { toolName: "Read", cwd: fx.lane, toolInput: { file_path: "/" } },
      names: "/",
    },
    {
      what: "a target carrying a NUL, which truncates a path rather than naming one",
      request: { toolName: "Read", cwd: fx.lane, toolInput: { file_path: `a${nul}b/.env` } },
      names: "b/.env",
    },
  ];

  // THE DISCRIMINATING HALF: the same tool, the same fixture, a path the
  // guard CAN classify — without it, "everything is allowed" passes.
  expect(askRead(fx.lane, ".env").verdict, "the guard refuses nothing at all").toBe("block");

  for (const shape of shapes) {
    const answer = decide(shape.request);
    expect(answer.verdict, `${shape.what} was refused, and this guard fails OPEN`).toBe("allow");
    expect(answer.code, `${shape.what} was not reported as unclassified`).toBe(
      "secret-unclassified",
    );
    // LOGGED, NOT SILENT: `judged: false` is the runner's whole trigger
    // for printing, so an allow that claims to be judged is an allow
    // nobody will ever see.
    expect(answer.judged, `${shape.what} was allowed SILENTLY`).toBe(false);
    expect(answer.reason, "the log line does not give the reason").toContain("could not classify");
    if (shape.names !== undefined) {
      expect(answer.reason, "the log line does not name the path").toContain(shape.names);
    }
  }

  // AND A LANE DOES NOT REVERSE IT. `noTargetVerdict` refuses a pathless
  // WRITE inside a lane (limit 8) and that is right for a write; a read
  // taking the same arm would turn the fail-open rule inside out at the
  // one seat this guard exists to protect.
  const pathless = decide({ toolName: "Read", cwd: fx.lane, toolInput: {} });
  const pathlessWrite = decide({ toolName: "Write", cwd: fx.lane, toolInput: {} });
  expect(pathlessWrite.verdict, "a pathless WRITE in a lane is no longer refused").toBe("block");
  expect(pathless.verdict, "a pathless READ took the write arm and failed closed").toBe("allow");
});

test("the runner carries the secret refusal as an exit code, and the fail-open allow as a log line", async () => {
  const fx = makeFixture();
  await arm(fx);
  const hook = path.join(repoRoot, ".claude/hooks/lane-fence-hook.mjs");
  const call = (cwd: string, filePath: string | undefined) =>
    spawnSync(process.execPath, [hook], {
      input: JSON.stringify({
        hook_event_name: "PreToolUse",
        tool_name: "Read",
        cwd,
        tool_input: filePath === undefined ? {} : { file_path: filePath },
      }),
      encoding: "utf8",
    });

  const refused = call(fx.lane, path.join(fx.lane, ".env"));
  expect(refused.status, "a secret read was not refused by exit code").toBe(2);
  expect(refused.stderr).toContain("SECRET READ");
  expect(refused.stderr, "the refusal does not name the entry").toContain("env-file");
  expect(refused.stdout, "a refusal that prints on stdout depends on being parsed").toBe("");

  // THE ORDINARY READ IS SILENT, which is what makes the log line below
  // mean something: without this pair, "the hook printed nothing" is
  // what a working guard and an absent one both look like (T-199).
  const ordinary = call(fx.lane, path.join(fx.lane, "docs/STATE.md"));
  expect(ordinary.status, ordinary.stderr).toBe(0);
  expect(ordinary.stderr, "an ordinary read speaks, so a fail-open cannot be told from one").toBe(
    "",
  );

  const failedOpen = call(fx.lane, undefined);
  expect(failedOpen.status, "a fail-open must not change which reads proceed").toBe(0);
  expect(failedOpen.stdout, "a log line on stdout could be parsed as a permission GRANT").toBe("");
  expect(failedOpen.stderr).toContain("LANE FENCE (not judged)");
  expect(failedOpen.stderr).toContain("secret-unclassified");
});

/** Every ignore file this tree TRACKS, by the tree's own list. */
function trackedIgnoreFiles(): string[] {
  return execFileSync("git", ["-C", repoRoot, "ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter((f) => /(^|\/)_?\.?(git|supertaskr)ignore$/.test(f));
}

/**
 * The words that make an ignore pattern SECRET-BEARING.
 *
 * DECLARED HERE AND NOT DERIVED, because there is nothing to derive it
 * from: it is a reading of what a pattern means, and a reading is what a
 * body like this is for. `local` earns its place — vite's `*.local` is
 * the file a front-end project keeps its live keys in, and it is the one
 * pattern this tree actually contributes.
 */
const SECRET_BEARING_WORDS = [
  "env",
  "secret",
  "credential",
  "key",
  "token",
  "password",
  "pem",
  "keychain",
  "local",
  "netrc",
  "npmrc",
] as const;

/** A concrete path a gitignore-style pattern would match. */
function sampleForPattern(pattern: string): string {
  const bare = pattern.replace(/^!/, "").replace(/^\//, "").replace(/\/$/, "");
  return bare.replace(/\*/g, "x");
}

test("the secret set covers every secret-bearing pattern the tree's OWN ignore files name", () => {
  const files = trackedIgnoreFiles();
  // ANTI-VACUITY ON THE SCAN, not on its yield: this tree names ONE
  // secret-bearing pattern today, so a body asserting "many" would be
  // false — what must never be true is that the scan read nothing.
  expect(files.length, "no ignore file was found, so this body scanned nothing").toBeGreaterThan(2);

  const derived: { file: string; pattern: string }[] = [];
  for (const file of files) {
    const text = readFileSync(path.join(repoRoot, file), "utf8");
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      // A comment, a blank, or a NEGATION — `!x` un-ignores and so names
      // nothing the tree is hiding.
      if (line === "" || line.startsWith("#") || line.startsWith("!")) continue;
      if (SECRET_BEARING_WORDS.some((w) => line.toLowerCase().includes(w))) {
        derived.push({ file, pattern: line });
      }
    }
  }

  // THE LOOP BINDS ON SOMETHING. Measured at T-249's base `828621f5`:
  // exactly one — `*.local` in app/.gitignore. A future ignore file that
  // gains `.env` lands here and the hook's list is what reds.
  expect(
    derived.length,
    "the tree's ignore files name no secret-bearing pattern, so the coverage loop is vacuous",
  ).toBeGreaterThan(0);

  for (const { file, pattern } of derived) {
    const sample = sampleForPattern(pattern);
    expect(
      claimants(repoRoot, sample),
      `${file} ignores ${pattern} and no entry in the secret set covers ${sample}`,
    ).not.toEqual([]);
  }

  // AND THE ENTRY THAT CAME FROM THE TREE SAYS SO, so a reader of the
  // hook can tell a derived entry from an invented one.
  const cited = SECRET_SET.filter((e) => e.derivedFrom !== undefined);
  expect(cited.length, "no entry records the ignore file it was derived from").toBeGreaterThan(0);
  for (const entry of cited) {
    expect(files.some((f) => String(entry.derivedFrom).includes(path.basename(f)))).toBe(true);
  }
});

test("the read guard answers with its OWN code set, and the write fence's four are untouched", async () => {
  const fx = makeFixture();
  await arm(fx);

  expect(SECRET_READ_CODES.length).toBeGreaterThan(0);
  // THE TWO SETS ARE DISJOINT. `DECLINE_CODES` is the four codes
  // docs/CONVENTIONS.md publishes entry for entry as the WRITE fence's
  // limits; a read-guard code smuggled into it would be a false claim
  // about those limits, and the keeper body above would then require the
  // page to publish it.
  for (const code of SECRET_READ_CODES) {
    expect(DECLINE_CODES, `${code} has been added to the write fence's limit codes`).not.toContain(
      code,
    );
  }

  // EVERY ANSWER A READ CAN GET IS ONE OF THREE, and the partition is
  // driven rather than asserted: a refusal, a classified allow, a
  // fail-open.
  const answers = [
    askRead(fx.lane, ".env"),
    askRead(fx.lane, "docs/STATE.md"),
    decide({ toolName: "Read", cwd: fx.lane, toolInput: {} }),
  ];
  expect(answers.map((a) => a.code)).toEqual([
    "secret-read",
    "not-a-secret",
    "secret-unclassified",
  ]);
  expect(answers.map((a) => a.judged)).toEqual([true, true, false]);
  // A judged read allow is NOT a decline, so the runner stays silent on
  // it — the property the body two sections up rests on.
  expect(DECLINE_CODES).not.toContain("not-a-secret");
});

/** The tools `.claude/settings.json` actually routes to this hook. */
function routedTools(): string[] {
  const settings = JSON.parse(readFileSync(path.join(repoRoot, ".claude/settings.json"), "utf8"));
  const entries: { matcher?: string; hooks?: { command?: string }[] }[] =
    settings?.hooks?.PreToolUse ?? [];
  const routed: string[] = [];
  for (const entry of entries) {
    const commands = (entry.hooks ?? []).map((h) => h.command ?? "").join(" ");
    if (!commands.includes(".claude/hooks/lane-fence-hook.mjs")) continue;
    for (const tool of String(entry.matcher ?? "").split("|")) {
      if (tool !== "") routed.push(tool);
    }
  }
  return routed;
}

test("the secret read guard is UNARMED at the harness until settings.json names a read tool, and this body is the record of which", async () => {
  const fx = makeFixture();
  await arm(fx);
  const routed = routedTools();
  expect(routed.length, "no tool is routed to this hook at all").toBeGreaterThan(0);
  const armed = routed.filter((t) => (READ_TOOL_NAMES as readonly string[]).includes(t));

  // THE GUARD'S OWN ANSWER DOES NOT DEPEND ON THE WIRING, and this half
  // runs in both worlds — the decision is a property of `decide`, and
  // only whether anything ASKS it is a property of the registration.
  expect(askRead(fx.lane, ".env").code).toBe("secret-read");

  if (armed.length === 0) {
    // TODAY. The matcher is `Edit|Write|NotebookEdit`, so no read event
    // reaches the hook and the guard is advice to `decide`'s callers
    // alone. A guard believed wider than it is is worse than no guard,
    // so the HOOK ITSELF carries the sentence — a reader of the hook
    // meets the same fact as a reader of this file.
    expect(
      hookSourceText(),
      "the guard is unarmed and the hook does not say so",
    ).toContain("IT IS UNARMED AT THE HARNESS UNTIL");
  } else {
    // ONCE WIRED, the refusal has to survive the real process boundary —
    // the same arm the write fence's own runner body drives.
    const refused = spawnSync(process.execPath, [path.join(repoRoot, ".claude/hooks/lane-fence-hook.mjs")], {
      input: JSON.stringify({
        hook_event_name: "PreToolUse",
        tool_name: armed[0],
        cwd: fx.lane,
        tool_input: { file_path: path.join(fx.lane, ".env") },
      }),
      encoding: "utf8",
    });
    expect(refused.status, "a read tool is wired and a secret read was not refused").toBe(2);
    expect(refused.stderr).toContain("SECRET READ");
  }
});
