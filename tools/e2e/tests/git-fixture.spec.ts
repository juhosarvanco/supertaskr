import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import {
  FIXTURE_RM_MAX_WAIT_MS,
  FIXTURE_RM_RETRY,
  NO_BACKGROUND_MAINTENANCE,
  removeGitFixture,
} from "./git-fixture";

/* ────────────────────────────────────────────────────────────────────
 * T-178 — THE FIXTURE TEARDOWN THAT REDDED A GREEN BODY, TWICE.
 *
 * `refShapes()` in brief.spec.ts builds a git checkout under a mkdtemp
 * root and two bodies tear it down in a `finally`. That teardown threw
 * ENOTEMPTY on CI twice — run 33327281402 on `…/local/.git/objects` and
 * run 33333142954, on main's own tip on a DOCS-ONLY commit, on
 * `…/local/.git` — both times AFTER the body's assertions had passed,
 * and both times failing the `e2e lane` step and skipping the boot gate
 * behind it.
 *
 * The mechanism is named in tests/git-fixture.ts' header, with the
 * measurement that produced it. These bodies pin the two halves of the
 * remedy: that git really does detach a writer into the fixture and that
 * the config removes it, and that a teardown which still cannot finish
 * reports itself rather than the body it follows.
 *
 * WHY THE FIRST BODY SHELLS GIT RATHER THAN TRUSTING THE README: the
 * claim "`git commit` spawns a detached maintenance process" is a fact
 * about the installed git, not about this repository, and a fix aimed at
 * a behaviour nobody re-measures is a fix that silently stops applying.
 * If that body's POSITIVE CONTROL ever reds, the honest reading is "this
 * git no longer detaches maintenance from a commit" — which would make
 * the config below unnecessary rather than wrong, and is worth a look.
 * ──────────────────────────────────────────────────────────────────── */

/** A scratch root, stem DERIVED from the card (docs/CONVENTIONS.md, POISON DRILL). */
function scratchRoot(): string {
  return mkdtempSync(path.join(os.tmpdir(), "t178-git-fixture-"));
}

/**
 * The probe repo's git env. Author and committer are supplied so a runner
 * with no configured identity can commit, and the host's own global and
 * system config are taken OUT of the picture — otherwise a developer who
 * happens to set `maintenance.auto=false` in `~/.gitconfig` would see the
 * positive control below fail for a reason that has nothing to do with
 * the fixture.
 */
const PROBE_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: "t178",
  GIT_AUTHOR_EMAIL: "t178@example.invalid",
  GIT_COMMITTER_NAME: "t178",
  GIT_COMMITTER_EMAIL: "t178@example.invalid",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
};

test("a fixture's git commit DETACHES a background maintenance process, and the fixture's own config is what stops it", () => {
  // KILLED BY: dropping NO_BACKGROUND_MAINTENANCE from a fixture's git
  // calls, and equally by spelling it as a knob that does not prevent the
  // SPAWN (`gc.auto=0` lets the detached process start and merely
  // declines to pack, so the race window still opens).
  const root = scratchRoot();
  try {
    const repo = path.join(root, "repo");
    const git = (args: string[], trace: string): string => {
      execFileSync("git", ["-C", repo, ...args], {
        encoding: "utf8",
        env: { ...PROBE_ENV, GIT_TRACE: trace },
      });
      return readFileSync(trace, "utf8");
    };
    execFileSync("git", ["init", "--quiet", "--initial-branch=main", repo], { env: PROBE_ENV });

    // THE POSITIVE CONTROL, AND IT IS THE POINT: without it, "the trace
    // names no maintenance process" is satisfied equally by a working
    // config and by a git that never spawned one.
    writeFileSync(path.join(repo, "a.txt"), "one\n");
    git(["add", "-A"], path.join(root, "add.log"));
    const detachTrace = git(
      ["commit", "--quiet", "-m", "Checkpoint: control"],
      path.join(root, "control.log"),
    );
    expect(
      detachTrace,
      "a plain fixture commit did NOT spawn background maintenance on this git, so the " +
        "rest of this body is asserting the absence of something that was never there",
    ).toContain("maintenance run --auto");
    expect(
      detachTrace,
      "the maintenance process this fixture races is the DETACHED one — a foreground run " +
        "would finish before `git commit` returned and could not outlive the teardown",
    ).toContain("--detach");

    // AND THE ASSERTION. Same repo, same commit, one config apart.
    writeFileSync(path.join(repo, "b.txt"), "two\n");
    git(["add", "-A"], path.join(root, "add2.log"));
    const quietTrace = git(
      [...NO_BACKGROUND_MAINTENANCE, "commit", "--quiet", "-m", "Checkpoint: fixed"],
      path.join(root, "fixed.log"),
    );
    expect(
      quietTrace,
      "the fixture's git config did not stop the spawn, so a detached process is still " +
        "free to write inside the tree the teardown is about to remove",
    ).not.toContain("maintenance run");
  } finally {
    // This body's own probe repo is a git-built fixture like any other, and
    // it takes the same teardown — which is also what keeps this file inside
    // the census below rather than needing an exemption from it.
    removeGitFixture(root, "git-fixture probe");
  }
});

test("a git fixture teardown that cannot remove its tree names the FIXTURE, and does not fail the body it follows", () => {
  // KILLED BY: letting the removal throw out of the teardown (the defect
  // this card removes), and equally by swallowing it in silence — a
  // teardown that cannot finish is a real finding, and the requirement is
  // that it be attributed to the FIXTURE rather than to whichever body it
  // happened to follow.
  const failures: string[] = [];
  const enotempty = Object.assign(
    new Error("ENOTEMPTY: directory not empty, rmdir '/tmp/t153s9-refshape-XXXX/local/.git'"),
    { code: "ENOTEMPTY" },
  );

  // THE POSITIVE CONTROL FIRST: a removal that works reports nothing and
  // answers null, so "it reported the fixture" below is a property of the
  // FAILURE and not of every call.
  const clean = removeGitFixture("/tmp/t153s9-refshape-XXXX", "refShapes", {
    remove: () => {},
    report: (finding) => failures.push(finding),
  });
  expect(clean, "a teardown that succeeded still announced a finding").toBeNull();
  expect(failures, "a teardown that succeeded still reported").toEqual([]);

  // AND THE FAILING SIDE. It must not throw: this call stands where a
  // body's `finally` stands, and a throw there is what relabelled two
  // green bodies as failures on CI.
  let threw: unknown = null;
  let finding: string | null = null;
  try {
    finding = removeGitFixture("/tmp/t153s9-refshape-XXXX", "refShapes", {
      remove: () => {
        throw enotempty;
      },
      report: (f) => failures.push(f),
    });
  } catch (err) {
    threw = err;
  }
  expect(threw, "the teardown threw, so it would red the body it follows").toBeNull();
  expect(finding, "the teardown failed and produced no finding at all").not.toBeNull();
  expect(failures, "the finding never reached the report channel").toHaveLength(1);

  // SAYS SO BY NAME — the fixture, the tree it could not remove, and the
  // cause, so nobody has to guess which lane it belongs to.
  expect(finding!, "the finding does not name the FIXTURE it belongs to").toContain("refShapes");
  expect(finding!).toContain("/tmp/t153s9-refshape-XXXX");
  expect(finding!).toContain("ENOTEMPTY");
  expect(
    finding!,
    "the finding does not say that the body it follows is not what failed",
  ).toContain("NOT A FAILURE OF THE BODY IT FOLLOWS");
  expect(failures[0]).toBe(finding);
});

test("the git fixture teardown's removal is BOUNDED, and the bound is the one written beside it", () => {
  // KILLED BY: an unbounded wait, and by dropping the retry back to
  // Node's default of none. The literals are written HERE rather than
  // imported: a body parametrised by the constant it checks cannot pin
  // that constant (docs/CONVENTIONS.md, A NEGATIVE ASSERTION NEEDS A
  // POSITIVE CONTROL, its T-063 sibling).
  const seen: Array<Parameters<typeof rmSync>[1]> = [];
  const answer = removeGitFixture("/tmp/t153s9-refshape-YYYY", "refShapes", {
    remove: (_dir, options) => {
      seen.push(options);
    },
    report: () => {},
  });
  expect(answer).toBeNull();
  expect(seen, "the teardown did not call its remover exactly once").toHaveLength(1);

  const options = seen[0] as { recursive?: boolean; force?: boolean; maxRetries?: number; retryDelay?: number };
  expect(options.recursive, "a scratch ROOT is a tree, so the removal is recursive").toBe(true);
  expect(options.force, "an already-absent tree is not a finding").toBe(true);
  expect(options.maxRetries, "the retry count moved without this pin moving").toBe(5);
  expect(options.retryDelay, "the retry delay moved without this pin moving").toBe(50);

  // AND THE BOUND ITSELF, because "it retries" without a ceiling is how a
  // rare race becomes a slow suite. Node backs off by `i * retryDelay`,
  // so five retries at 50ms is 50+100+150+200+250.
  expect(FIXTURE_RM_MAX_WAIT_MS, "the stated worst-case wait no longer matches the bound").toBe(750);
  expect(FIXTURE_RM_RETRY.maxRetries).toBe(5);
  expect(FIXTURE_RM_RETRY.retryDelay).toBe(50);
});

/**
 * THE CLASS, as a predicate over a spec's SOURCE: a file that commits into a
 * repository it builds and later removes a directory. That pair is what
 * carries this defect — the commit detaches the writer, and the removal is
 * what races it.
 */
function commitsIntoAFixtureItRemoves(source: string): boolean {
  return /"commit"/.test(source) && /\brmSync\(|\bremoveGitFixture\(/.test(source);
}

test("every spec that commits into a fixture it removes carries the protection, and the census saying so is DERIVED", () => {
  // KILLED BY: dropping the config or the teardown from any spec in the
  // class, and by a NEW spec joining the class without either. This is
  // docs/CONVENTIONS.md's A FIX NAMES ITS CLASS AND ITS SWEEP turned into a
  // standing check: T-178's sweep found two siblings of the reported site,
  // and a sweep run once is a sweep that goes stale the next time somebody
  // writes a git fixture.
  const dir = path.join(repoRoot, "tools", "e2e", "tests");
  const specs = readdirSync(dir)
    .filter((f) => f.endsWith(".spec.ts"))
    .map((file) => ({ file, source: readFileSync(path.join(dir, file), "utf8") }));

  // THE DETECTOR IS SHOWN CAPABLE OF BOTH ANSWERS before its census is
  // spent on anything (the POISON DRILL's proof clause: a search that finds
  // nothing is also what a broken search looks like).
  expect(
    commitsIntoAFixtureItRemoves('git(repo, ["commit", "-m", "x"]);\nrmSync(dir);'),
    "the detector does not recognise the shape it exists to find",
  ).toBe(true);
  expect(
    commitsIntoAFixtureItRemoves('await page.goto("/");\nexpect(1).toBe(1);'),
    "the detector answers yes to a spec that neither commits nor removes",
  ).toBe(false);

  const inClass = specs.filter((s) => commitsIntoAFixtureItRemoves(s.source));
  expect(
    inClass.length,
    "the census is EMPTY, so every assertion below is vacuous — the walk found no " +
      "spec that commits into a fixture it removes, which cannot be true while " +
      "brief.spec.ts, card-preflight.spec.ts and lane-fence.spec.ts are in this tree",
  ).toBeGreaterThanOrEqual(3);
  expect(specs.length, "the walk read no specs at all").toBeGreaterThan(inClass.length);

  // THE USE SITE, NEVER THE IMPORT — and this sentence is here because the
  // first draft of this body checked for the bare NAMES and its own poison
  // drill SURVIVED: deleting `...NO_BACKGROUND_MAINTENANCE` from a sibling's
  // git helper left the import line behind, and an import satisfies a
  // substring check while protecting nothing. A spread and a call cannot be
  // spelled by an unused import.
  for (const { file, source } of inClass) {
    expect(
      source,
      `${file} commits into a fixture it removes and does not SPREAD ` +
        `NO_BACKGROUND_MAINTENANCE into its git calls, so its commits detach a ` +
        `writer into the tree its teardown is about to walk (T-178)`,
    ).toContain("...NO_BACKGROUND_MAINTENANCE");
    expect(
      source,
      `${file} commits into a fixture it removes and never CALLS ` +
        `removeGitFixture, so a removal that cannot finish will red whichever body ` +
        `it happens to follow instead of reporting itself (T-178)`,
    ).toContain("removeGitFixture(");
  }
});
