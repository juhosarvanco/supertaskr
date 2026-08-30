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
import { expect, test } from "@playwright/test";
import { parse as parseYaml } from "yaml";
import {
  INTEGRATION_SEAT_PATHS,
  LANE_BRANCH_RE,
  MANIFEST_REL_PATH,
  MANIFEST_VERSION,
  ROUTE,
  ROUTE_LANE_LESS,
  WRITE_TOOL_PATH_FIELDS,
  decide,
  findCheckoutRoot,
  liveLanes,
  readHeadRef,
  touchesLineOf,
  within,
} from "../../../.claude/hooks/lane-fence.mjs";
import { repoRoot } from "../preflight";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import { conventionsBullet, conventionsText, liveTaskCards } from "../scripts/docs-scan.mjs";
import { laneSpellings, normaliseTaskId } from "../scripts/dispatch-brief.mjs";
import { MANIFEST_DIR_IGNORE, buildLaneFence, laneIdOf, writeLaneFence } from "../scripts/lane-fence.mjs";

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
  const dir = mkdtempSync(path.join(os.tmpdir(), "nputer-T-154-lane-fence-"));
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

  for (const rel of ["docs/CONVENTIONS.md", "docs/ROADMAP.md"]) {
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

  const lane = path.join(root, `nputer-${FIXTURE_ID}`);
  git(repo, ["worktree", "add", "--quiet", "-b", `task/${FIXTURE_ID}-guard-fixture`, lane]);
  const drill = path.join(root, `nputer-${FIXTURE_ID}-drill`);
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
  const lane = path.join(path.dirname(fx.lane), `nputer-${id}`);
  git(fx.repo, ["worktree", "add", "--quiet", "-b", `task/${id}-sibling`, lane]);
  const manifest = await buildLaneFence(id, lane, { root: fx.repo, at: "2026-01-01T00:00:00.000Z" });
  writeLaneFence(manifest);
  return { lane, manifest };
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
  expect(inDrill.code).toBe("not-a-lane");
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

test("a manifest the hook cannot read is a refusal, never a shrug", async () => {
  const fx = makeFixture();
  await arm(fx);
  const file = path.join(fx.lane, MANIFEST_REL_PATH);

  for (const [label, content] of [
    ["not JSON", "{ this is not json"],
    ["not an object", "[]"],
    ["a version this reader does not know", JSON.stringify({ version: MANIFEST_VERSION + 1 })],
    ["missing a field", JSON.stringify({ version: MANIFEST_VERSION, taskId: FIXTURE_ID })],
    // `excluded` joined the fields this reader requires at T-154-s2: the
    // lane-less arm carves a card's own file out of a fence it does not
    // hold, and it can only do that from a manifest that carries the
    // carve-out. The writer has stamped it since T-154; requiring it is
    // the reader catching up with the schema, not a new demand.
    [
      "missing the excluded field the carve-outs are read from",
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

test("a path outside the lane's own checkout is allowed, and the limit is declared", async () => {
  const fx = makeFixture();
  await arm(fx);
  const elsewhere = path.join(scratchRoot(), "notes.md");

  const verdict = ask(fx.lane, elsewhere);
  expect(verdict.verdict, verdict.reason).toBe("allow");
  expect(verdict.code).toBe("outside-the-checkout");
  // The guard is still armed in the same call — the discriminating half.
  expect(ask(fx.lane, path.join(fx.lane, "app/src/main.tsx")).code).toBe("outside-the-fence");
  // The limit is not merely true, it is WRITTEN where the next reader is.
  const header = readFileSync(path.join(repoRoot, ".claude/hooks/lane-fence.mjs"), "utf8");
  expect(header, "the out-of-checkout limit is no longer declared in the hook's header").toContain(
    "A PATH OUTSIDE THE LANE'S OWN CHECKOUT IS ALLOWED",
  );
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
  expect(readFileSync(path.join(fx.lane, ".nputer/.gitignore"), "utf8")).toBe(MANIFEST_DIR_IGNORE);
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
  expect(MANIFEST_REL_PATH, "the manifest left the runtime directory").toMatch(/^\.nputer\//);

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
  expect(inDrill.code).toBe("not-a-lane");
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
  const seat = path.join(path.dirname(fx.lane), "nputer-review");
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

test("the three carve-outs each free a DIFFERENT write, and the fence still holds around them", async () => {
  // A lane fencing `docs` is what makes this measurable: the domain
  // contains the card, the stamps and this seat's own standing writes,
  // so all three carve-outs and the refusal are one fixture apart.
  const fx = makeFixture("touches: [tools/e2e, docs]");
  const manifest = await arm(fx);
  expect(manifest.paths).toContain("docs");
  expect(manifest.excluded, "the card's own file was not carved out at dispatch").toEqual([
    FIXTURE_CARD,
  ]);
  expect(manifest.alwaysWritable).toEqual(["docs/tasks"]);

  const ownCard = ask(fx.repo, path.join(fx.repo, FIXTURE_CARD));
  expect(ownCard.verdict, ownCard.reason).toBe("allow");
  expect(ownCard.code).toBe("protocol-carve-out");
  expect(ownCard.reason, "the own-file carve-out is not the one named").toContain("own card file");

  const otherCard = ask(fx.repo, path.join(fx.repo, "docs/tasks/T-903-a-suggestion.md"));
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

  // THE DISCRIMINATING HALF: a path under the SAME fenced domain that no
  // carve-out names is refused, in the same run. Without it every line
  // above is satisfied by a hook that stopped enforcing `docs`.
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
  const review = path.join(path.dirname(fx.lane), "nputer-review-stray");
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

  // AND WHAT THE TWO SEATS SHARE, because docs/CONVENTIONS.md now claims
  // it of both: a path outside the writing checkout is unjudged in
  // either. The lane-less side of that sentence had no body until this
  // line, and an undriven arm is a claim nothing checks.
  const elsewhere = path.join(scratchRoot(), "notes.md");
  expect(ask(fx.repo, elsewhere).code, "limit 2 does not hold for the seat with no lane").toBe(
    "outside-the-checkout",
  );
  expect(ask(fx.lane, elsewhere).code).toBe("outside-the-checkout");
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
