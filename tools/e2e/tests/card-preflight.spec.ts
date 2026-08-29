import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import {
  CLAIM_CLASSES,
  NOT_A_CLAIM_CLASS,
  componentOwners,
  ownersOf,
  preflight,
  refClaims,
  rulings,
} from "../scripts/card-preflight.mjs";
import { context, render } from "../scripts/dispatch-brief.mjs";

/**
 * THE CARD PREFLIGHT (T-160) — no browser.
 *
 * ── EVERY FIXTURE HERE IS PLANTED, AND THAT IS A RULE RATHER THAN A
 *    PREFERENCE ──────────────────────────────────────────────────────
 * The live board carries real instances of all five claim classes — it
 * is why the card was filed — and asserting against them would pin a
 * board that churns: the founding instance of the uncovered-path shape
 * is on a `done` card whose fence somebody will tidy, and the day they
 * do, a body about the PREFLIGHT reds naming a card nobody touched.
 * Every card below is therefore built into a temporary git repository,
 * the `lane-fence.spec.ts` pattern, and nothing in this file reads a
 * live card.
 *
 * ── docs/CONVENTIONS.md AND THE ROLE FILE ARE COPIED IN, NOT FAKED ───
 * `context()` reads the lane bullet's spellings out of the real
 * document and the role file's own opening line, so a hand-written
 * stand-in would be a second copy of exactly the text these bodies
 * exist to derive against. The parser's built entry is the real one,
 * loaded from this repository by path, for the reason
 * `dispatch-order.mjs`'s header gives.
 *
 * ── THE POSITIVE CONTROLS ARE THE POINT ──────────────────────────────
 * docs/CONVENTIONS.md's A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL
 * applies to a gate in both directions: a preflight that refused
 * everything and a preflight that refused nothing both satisfy a body
 * asserting one side. So the CLEAN TWIN and each planted card are built
 * by the SAME function, one mutation apart, and every red body asserts
 * the twin is green in the same run.
 */

const SCRATCH: string[] = [];

test.afterAll(() => {
  for (const dir of SCRATCH.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A scratch root, stem DERIVED from the lane (docs/CONVENTIONS.md, POISON DRILL). */
function scratchRoot(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "nputer-T-160-card-preflight-"));
  SCRATCH.push(dir);
  return dir;
}

function git(cwd: string, args: string[]): string {
  return execFileSync(
    "git",
    ["-C", cwd, "-c", "user.email=t160@example.invalid", "-c", "user.name=T-160 fixture", ...args],
    { encoding: "utf8" },
  );
}

const FIXTURE_ID = "T-903";
const OTHER_ID = "T-904";
const SLUG = "preflight-lens";
const SLUG_PATH = "app/src/preflight-lens";
const OTHER_SLUG = "preflight-map";
const OTHER_SLUG_PATH = "app/test/preflight-map";
const CARD = `docs/tasks/${FIXTURE_ID}-the-card-the-preflight-is-measured-on.md`;

interface Planted {
  /** Extra lines dropped into the acceptance criteria. */
  criteria?: string[];
  /** Extra lines dropped into the body, outside the criteria. */
  body?: string[];
  /** The frontmatter fence, verbatim. */
  touches?: string;
  /** The frontmatter blocker list, verbatim. */
  blockedBy?: string;
  /** Replaces the whole criteria section, heading included, when given. */
  noCriteria?: boolean;
}

function writeFixtureFile(root: string, rel: string, content: string): void {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content, "utf8");
}

function component(id: string, slug: string, dir: string, name: string): string {
  return [
    "---",
    `id: ${id}`,
    `name: ${name}`,
    "layer: app",
    "paths:",
    `  - ${dir}/**`,
    "depends_on: []",
    "decisions: []",
    "status: auto",
    `touch_slugs: [${slug}]`,
    "---",
    "A component that exists so a fence token can be a slug and a path can",
    "have a declared owner.",
    "",
  ].join("\n");
}

function cardText(planted: Planted): string {
  const criteria = planted.noCriteria
    ? []
    : [
        "## Acceptance criteria",
        "",
        `- THE lens SHALL keep its own file at ${SLUG_PATH}/lens.ts, which exists.`,
        "- THE work SHALL stay inside docs/CONVENTIONS.md, which it cites and does not write.",
        ...(planted.criteria ?? []),
        "",
      ];
  return [
    "---",
    `id: ${FIXTURE_ID}`,
    "title: The card the preflight is measured on",
    "feature: F-04",
    "milestone: 4",
    "priority: 30",
    "size: M",
    "status: planned",
    `blocked_by: ${planted.blockedBy ?? "[]"}`,
    planted.touches ?? `touches: [${SLUG}]`,
    "builder:",
    "verifier:",
    "built_by:",
    "verified_by:",
    "review:",
    "---",
    "",
    "The fixture card. Every claim in the criteria below is true of the",
    "fixture tree unless a body plants otherwise.",
    "",
    ...(planted.body ?? []),
    "",
    ...criteria,
  ].join("\n");
}

interface Fixture {
  repo: string;
  lane: string;
}

/**
 * THE GOVERNING DOCUMENTS AND THE WHOLE OF method/, COPIED IN RATHER
 * THAN INVENTED.
 *
 * `context()` reads the lane spellings out of docs/CONVENTIONS.md's own
 * bullet, the read-first set out of whichever root adapter this
 * repository filled in, and the row set out of the role file's normative
 * table. A hand-written stand-in for any of those would be a second copy
 * of the text these bodies exist to derive against — the reason
 * `lane-fence.spec.ts` copies the same document one card over. method/
 * is small enough to take whole, which also means a file it gains later
 * arrives in the fixture without an edit here.
 */
function seedGoverningDocs(repo: string): void {
  for (const rel of ["docs/CONVENTIONS.md", "docs/ROADMAP.md"]) {
    const dest = path.join(repo, rel);
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(path.join(repoRoot, rel), dest);
  }
  // THE ARCHITECTURE DOC IS COPIED AND ITS SLUG BLOCK RE-DERIVED, and
  // the reason is the very rule that block is under: the brief compares
  // the doc's PROSE block against each component file's own
  // `touch_slugs:` FIELD and reports a divergence as a finding. A
  // fixture registry of two components beside this repository's own
  // nine-slug block is exactly that divergence — the mechanism working,
  // on a disagreement the fixture manufactured. So the block is rewritten
  // from the components this fixture declares.
  const arch = readFileSync(path.join(repoRoot, "docs/ARCHITECTURE.md"), "utf8")
    .split("\n")
    .filter((l) => !/^ {4}[a-z][a-z-]*\s+->\s+C-\d+/.test(l))
    .join("\n");
  writeFixtureFile(
    repo,
    "docs/ARCHITECTURE.md",
    `${arch}\n\n    ${SLUG} -> C-91\n    ${OTHER_SLUG} -> C-92\n`,
  );
  cpSync(path.join(repoRoot, "method"), path.join(repo, "method"), { recursive: true });
  for (const rel of ["CLAUDE.md", "AGENTS.md"]) {
    copyFileSync(path.join(repoRoot, rel), path.join(repo, rel));
  }
}

/**
 * A whole fixture world: an integration checkout carrying two declared
 * components, the card under test and one other live card, plus a lane
 * worktree so the live-lane arm has something real to read.
 */
function makeFixture(planted: Planted = {}): Fixture {
  const root = scratchRoot();
  const repo = path.join(root, "repo");
  mkdirSync(repo, { recursive: true });
  git(repo, ["init", "--initial-branch=main", "--quiet"]);

  seedGoverningDocs(repo);
  writeFixtureFile(
    repo,
    "docs/architecture/components/C-91-preflight-lens.md",
    component("C-91", SLUG, SLUG_PATH, "Preflight lens"),
  );
  writeFixtureFile(
    repo,
    "docs/architecture/components/C-92-preflight-map.md",
    component("C-92", OTHER_SLUG, OTHER_SLUG_PATH, "Preflight map"),
  );
  writeFixtureFile(repo, CARD, cardText(planted));
  writeFixtureFile(
    repo,
    `docs/tasks/${OTHER_ID}-a-second-live-card.md`,
    [
      "---",
      `id: ${OTHER_ID}`,
      "title: A second live card",
      "feature: F-04",
      "milestone: 4",
      "priority: 40",
      "size: S",
      "status: planned",
      "blocked_by: []",
      `touches: [${OTHER_SLUG}]`,
      "builder:",
      "verifier:",
      "built_by:",
      "verified_by:",
      "review:",
      "---",
      "",
      "A card that exists so the board census is not a census of one.",
      "",
    ].join("\n"),
  );
  writeFixtureFile(repo, `${SLUG_PATH}/lens.ts`, "export const lens = 1;\n");
  writeFixtureFile(repo, `${OTHER_SLUG_PATH}/dogfood.test.ts`, "export const dogfood = 1;\n");
  writeFixtureFile(repo, ".gitignore", "dist/\n");
  git(repo, ["add", "-A"]);
  // THE SUBJECT IS A CHECKPOINT ON PURPOSE: the brief's own lane row
  // reads its base commit off the newest `Checkpoint:` on the
  // integration branch and refuses rather than substituting one, so a
  // fixture without one is a fixture the CLI arm cannot run in.
  git(repo, ["commit", "-m", "Checkpoint: fixture base", "--quiet"]);

  const lane = path.join(root, `nputer-${OTHER_ID}`);
  git(repo, ["worktree", "add", "--quiet", "-b", `task/${OTHER_ID}-a-live-lane`, lane]);
  return { repo, lane };
}

/** Run the preflight for real against a fixture, and hand back its findings. */
async function run(fx: Fixture): Promise<{ findings: string[]; text: string }> {
  const ctx = context({ root: fx.repo, taskId: FIXTURE_ID });
  const report = await preflight(ctx);
  return { findings: report.findings, text: render(report.recs) };
}

/** Every finding, joined, so a body can assert on the SHAPE it named. */
const joined = (findings: string[]): string => findings.join("\n");

/* ────────────────────────────────────────────────────────────────────
 * THE CLEAN TWIN — and it is asserted NON-VACUOUS, not merely green
 * ──────────────────────────────────────────────────────────────────── */

test("the clean twin PASSES, and the run is proved to have looked at something", async () => {
  const fx = makeFixture();
  const { findings, text } = await run(fx);

  expect(findings, `a current card was refused:\n${joined(findings)}`).toEqual([]);
  // A GREEN THAT PROVED NOTHING IS THE FAILURE THIS ASSERTS AGAINST.
  // Every arm has to have produced a line, or "no findings" is what a
  // preflight that never ran also says (poison shape TEN — an empty
  // comparison reports agreement).
  for (const claim of CLAIM_CLASSES) {
    expect(text, `claim class ${claim.key} produced no section`).toContain(`CLAIM CLASS ${claim.key}`);
  }
  expect(text, "the path arm never resolved a path").toMatch(/paths exists: [1-9]/);
  expect(text, "the fence arm never counted a tracked file").toMatch(
    /fence .* reserves tracked files: [1-9]/,
  );
  expect(text, "the fence expansion is empty").toContain(`fence reserves: ${SLUG_PATH}`);
});

/* ────────────────────────────────────────────────────────────────────
 * THE THREE POSITIVE CONTROLS THE CARD NAMES
 * ──────────────────────────────────────────────────────────────────── */

test("a planted STALE PATH reds, and the same card without it is green", async () => {
  const planted = await run(
    makeFixture({
      criteria: [`- THE work SHALL edit docs/architecture/gone-at-dispatch.md, which does not exist.`],
    }),
  );
  expect(joined(planted.findings)).toContain("STALE PATH");
  expect(joined(planted.findings)).toContain("docs/architecture/gone-at-dispatch.md");
  // The discriminating half, in the same run: the twin one mutation away
  // is green, so the red is the plant and not the machinery.
  expect((await run(makeFixture())).findings).toEqual([]);
});

test("a planted STALE FIGURE reds — the deriver is re-run, not the marker looked for", async () => {
  // A `card:board` stamp whose number the tree does not produce. The
  // fixture board carries two live cards, so a stamped `board planned`
  // of nine is a figure this checkout can refute by RE-DERIVING it.
  const stale = "board planned: 9  <- @ 0000000 ; card:board";
  const planted = await run(makeFixture({ body: [stale] }));
  expect(joined(planted.findings)).toContain("STALE");
  expect(joined(planted.findings)).toContain("board planned: 9");

  // AND THE MARKER ALONE IS NOT ENOUGH IN EITHER DIRECTION. The same
  // line with the number the tree DOES produce is accepted, which is
  // what makes this a re-derivation rather than an adjacency lint.
  const sound = await run(makeFixture({ body: ["board planned: 2  <- @ 0000000 ; card:board"] }));
  expect(
    joined(sound.findings),
    `a figure the deriver reproduces was refused:\n${joined(sound.findings)}`,
  ).not.toContain("board planned");
});

test("a planted UNCOVERED CRITERION PATH reds, and only when a component owns it", async () => {
  // The T-127-s1 shape: the criteria name a file that EXISTS and that
  // another slug reserves, while the card's own fence does not carry
  // that slug.
  const planted = await run(
    makeFixture({
      criteria: [`- THE work SHALL reconcile ${OTHER_SLUG_PATH}/dogfood.test.ts, a fixture it moves.`],
    }),
  );
  expect(joined(planted.findings)).toContain("UNCOVERED CRITERION PATH");
  expect(joined(planted.findings)).toContain(OTHER_SLUG);

  // THE OTHER HALF OF THE RULE, AND IT IS WHAT KEEPS THE ARM HONEST: a
  // criteria path under NO component is a citation, and citing it is
  // not a fence claim. The clean twin already names docs/CONVENTIONS.md
  // in its criteria and does not fence it — and stays green.
  const twin = await run(makeFixture());
  expect(twin.findings).toEqual([]);
  expect(twin.text, "the citation was not even reported").toContain("docs/CONVENTIONS.md");

  // And naming the owning slug in the fence discharges it BY BEING
  // CORRECT rather than by being ruled, which is the repair the finding
  // asks for.
  const fenced = await run(
    makeFixture({
      touches: `touches: [${SLUG}, ${OTHER_SLUG}]`,
      criteria: [`- THE work SHALL reconcile ${OTHER_SLUG_PATH}/dogfood.test.ts, a fixture it moves.`],
    }),
  );
  expect(joined(fenced.findings)).not.toContain("UNCOVERED CRITERION PATH");
});

/* ────────────────────────────────────────────────────────────────────
 * THE OTHER CLAIM CLASSES THE CRITERIA NAME
 * ──────────────────────────────────────────────────────────────────── */

test("a DEAD fence entry reds — an entry true at writing that reserves nothing now", async () => {
  const fx = makeFixture({ touches: `touches: [${SLUG}, docs/architecture/decisions]` });
  const { findings } = await run(fx);
  expect(joined(findings)).toContain("DEAD FENCE ENTRY");
  expect(joined(findings)).toContain("docs/architecture/decisions");
  expect((await run(makeFixture())).findings).toEqual([]);
});

test("a DANGLING REF stamp reds, and a ref this checkout holds does not", async () => {
  const fx = makeFixture({
    body: ["The figure was measured @ deadbee1234 and has not been re-derived since."],
  });
  const { findings } = await run(fx);
  expect(joined(findings)).toContain("DANGLING REF");
  expect(joined(findings)).toContain("deadbee1234");

  // The positive control the other way: the fixture's own HEAD, stamped
  // in the same shape, resolves — so the arm is discriminating rather
  // than refusing every hex run it meets.
  const live = makeFixture();
  const head = git(live.repo, ["rev-parse", "HEAD"]).trim();
  writeFixtureFile(
    live.repo,
    CARD,
    cardText({ body: [`The figure was measured @ ${head.slice(0, 12)} and still resolves.`] }),
  );
  const ok = await run(live);
  expect(joined(ok.findings), "a resolvable stamp was refused").not.toContain("DANGLING REF");
  expect(ok.text).toContain("resolves");
});

test("a blocked_by entry with no live card reds, and the parser's own ruling is reported", async () => {
  const fx = makeFixture({ blockedBy: "[T-799]" });
  const { findings, text } = await run(fx);
  expect(joined(findings)).toContain("BLOCKER WITH NO CARD");
  expect(joined(findings)).toContain("T-799");
  // The ruling is the PARSER's, reported rather than re-derived — the
  // sentence comes back with the state.
  expect(text).toMatch(/the parser rules this card: \w/);
});

test("a stated blocking reason about a LIVE LANE is read against the lane list", async () => {
  // The lane the fixture cuts is on the OTHER card, so a claim about
  // that lane holds; a claim about a lane nobody is on does not. One
  // fixture, two claims, opposite verdicts — which is what makes this a
  // reading of the lane list rather than a refusal of the phrase.
  const held = await run(
    makeFixture({ body: [`The fence is HELD by ${OTHER_ID}'s live lane, so this waits.`] }),
  );
  expect(
    joined(held.findings),
    "a claim the lane list supports was refused",
  ).not.toContain("STATED REASON NO LONGER HOLDS");

  const gone = await run(
    makeFixture({ body: ["The fence is HELD by T-798's live lane, so this waits."] }),
  );
  expect(joined(gone.findings)).toContain("STATED REASON NO LONGER HOLDS");
  expect(joined(gone.findings)).toContain("T-798");
});

/* ────────────────────────────────────────────────────────────────────
 * THE RULING — the other half of the refusal, and its own limit
 * ──────────────────────────────────────────────────────────────────── */

test("a dated ruling discharges the finding that NAMES its subject, and no other", async () => {
  const planted: Planted = {
    criteria: [
      "- THE work SHALL edit docs/architecture/gone-at-dispatch.md, which does not exist.",
      "- THE work SHALL also edit docs/architecture/also-gone.md, which does not either.",
    ],
  };
  const before = await run(makeFixture(planted));
  expect(before.findings.length, "the plant did not raise two findings").toBe(2);

  const after = await run(
    makeFixture({
      ...planted,
      body: [
        "PREFLIGHT RULING (2026-08-30): docs/architecture/gone-at-dispatch.md is a creation target",
        "the fence reaches by another name; carried deliberately.",
      ],
    }),
  );
  // ONE discharged, ONE still standing. A ruling that discharged the
  // class would leave none, and a ruling that bound to nothing would
  // leave two — both are indistinguishable from "no ruling" without
  // this pair.
  expect(after.findings.length, `\n${joined(after.findings)}`).toBe(1);
  expect(joined(after.findings)).toContain("also-gone.md");
  expect(joined(after.findings)).not.toContain("gone-at-dispatch.md");
  // AND THE DISCHARGE IS PRINTED. A suppression nobody can see is a
  // guard that permits.
  expect(after.text).toContain("RULED (2026-08-30)");
  expect(after.text).toContain("gone-at-dispatch.md");
});

test("an UNDATED ruling is not a ruling, and a ruling that binds to nothing is reported", async () => {
  const undated = await run(
    makeFixture({
      criteria: ["- THE work SHALL edit docs/architecture/gone-at-dispatch.md, which does not exist."],
      body: ["PREFLIGHT RULING: docs/architecture/gone-at-dispatch.md is fine, honestly."],
    }),
  );
  expect(undated.findings.length, "an undated sentence discharged a finding").toBe(1);
  expect(rulings(`---\nid: x\n---\n\nPREFLIGHT RULING: no date here\n`)).toEqual([]);
  expect(
    rulings(`---\nid: x\n---\n\nPREFLIGHT RULING (2026-08-30): dated\n`).map((r) => r.date),
  ).toEqual(["2026-08-30"]);

  const inert = await run(
    makeFixture({ body: ["PREFLIGHT RULING (2026-08-30): nothing this ref disagrees with."] }),
  );
  expect(inert.findings).toEqual([]);
  expect(inert.text).toContain("discharges nothing at this ref");
});

/* ────────────────────────────────────────────────────────────────────
 * THE HONEST-OMISSION RULE, WHICH IS A CRITERION AND NOT A HEADER
 * ──────────────────────────────────────────────────────────────────── */

test("every run prints which claim classes it checked and which it cannot", async () => {
  // Asserted on a CLEAN card as well as a refused one, because the
  // failure this criterion exists against is a green run that reads as
  // coverage.
  for (const fx of [
    makeFixture(),
    makeFixture({ criteria: ["- THE work SHALL edit docs/architecture/gone-at-dispatch.md."] }),
  ]) {
    const { text } = await run(fx);
    expect(text).toContain("WHAT THIS PREFLIGHT CHECKED AND WHAT IT CANNOT");
    // THE STRINGS ARE NAMED LITERALLY WHERE THE CLASS IS NAMED
    // LITERALLY, and derived from the constant only for the per-class
    // rows — a body that looped the constant for EVERYTHING could not
    // tell an empty constant from a printed table (T-063, poison shape
    // FIVE). So the cardinality is pinned here, off the constant.
    expect(CLAIM_CLASSES.length, "the claim-class table lost a member").toBe(5);
    expect(NOT_A_CLAIM_CLASS.length, "the not-a-claim-class list lost a member").toBe(4);
    for (const c of CLAIM_CLASSES) {
      expect(text, `${c.key} did not print what it checks`).toContain(c.checks);
      expect(text, `${c.key} did not print what it refuses`).toContain(c.refuses);
      expect(text, `${c.key} did not print what it cannot see`).toContain(c.cannot);
    }
    for (const line of NOT_A_CLAIM_CLASS) expect(text).toContain(line);
    // DESIRABILITY IS RULED OUT BY NAME. The card's third criterion
    // says the tool judges none, and a reader has to be able to see it.
    expect(text).toContain("whether the work is still WANTED");
  }
});

test("a card with no acceptance-criteria section SAYS SO rather than reporting a clean class", async () => {
  const { text, findings } = await run(
    makeFixture({
      noCriteria: true,
      body: ["It names docs/architecture/gone-at-dispatch.md and has no criteria to bind it."],
    }),
  );
  expect(text).toContain("no acceptance-criteria heading");
  // AND THE PATH IS STILL REPORTED, at body scope, rather than dropped:
  // an absent section narrows what can refuse and never what is looked
  // at.
  expect(text).toContain("absent, body scope");
  expect(text).toContain("gone-at-dispatch.md");
  expect(findings).toEqual([]);
});

/* ────────────────────────────────────────────────────────────────────
 * THE PURE HALVES, DRIVEN DIRECTLY
 * ──────────────────────────────────────────────────────────────────── */

test("the ref arm reads the published stamp form and not every hex-shaped word", () => {
  const card = [
    "---",
    "id: T-903",
    "---",
    "",
    "Measured @ abc1234 and again @ `deadbeef`.",
    "The port is 1420abc, the id is 903321552aa936a72c4220677f9286d2 and the",
    "literal is 0b10110001100 — none of those is a commit claim.",
    "",
  ].join("\n");
  expect(refClaims(card).map((r) => r.hash)).toEqual(["abc1234", "deadbeef"]);
});

test("ownership comes from the slug map, and a path under no component has no owner", () => {
  const comps = [
    { id: "C-91", file: "x", slugs: [SLUG], paths: [`${SLUG_PATH}/**`] },
    { id: "C-92", file: "y", slugs: [OTHER_SLUG], paths: [`${OTHER_SLUG_PATH}/**`] },
  ];
  const owners = componentOwners(
    new Map([
      [SLUG, ["C-91"]],
      [OTHER_SLUG, ["C-92"]],
    ]),
    comps,
  );
  expect(ownersOf(owners, `${OTHER_SLUG_PATH}/dogfood.test.ts`)).toEqual([OTHER_SLUG]);
  expect(ownersOf(owners, `${SLUG_PATH}/lens.ts`)).toEqual([SLUG]);
  expect(ownersOf(owners, "docs/CONVENTIONS.md"), "a document acquired an owner").toEqual([]);
  // Containment, not a prefix match — the rule the guard itself applies.
  expect(ownersOf(owners, `${SLUG_PATH}-extra/lens.ts`)).toEqual([]);
});

/* ────────────────────────────────────────────────────────────────────
 * THE ARM, THROUGH THE PROCESS BOUNDARY — the house exit contract
 * ──────────────────────────────────────────────────────────────────── */

const CLI = path.join(repoRoot, "tools", "e2e", "scripts", "brief.mjs");

function cli(args: string[], cwd = repoRoot): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" });
}

test("`--preflight` is a NAMED arm of the brief command and needs its task", () => {
  const noTask = cli(["--preflight"]);
  expect(noTask.status, "a preflight with no card is a usage error").toBe(2);
  expect(String(noTask.stderr)).toContain("--preflight needs --task");
  expect(String(cli(["--help"]).stdout)).toContain("--preflight");
});

test("a discrepancy answers ONE and a preflight that could not run answers THREE", async () => {
  const fx = makeFixture({
    criteria: ["- THE work SHALL edit docs/architecture/gone-at-dispatch.md, which does not exist."],
  });
  const red = cli(["--task", FIXTURE_ID, "--preflight", "--root", fx.repo], fx.repo);
  expect(red.status, String(red.stderr)).toBe(1);
  expect(String(red.stderr)).toContain("STALE PATH");
  // EVERY CLAIM IS NAMED IN THE REFUSAL, which is the shape
  // `--write-fence` already keeps: a refusal that does not say what it
  // refused on is a refusal nobody can act on.
  expect(String(red.stdout)).toContain("WHAT THIS PREFLIGHT CHECKED AND WHAT IT CANNOT");

  const green = cli(["--task", FIXTURE_ID, "--preflight", "--root", makeFixture().repo]);
  expect(green.status, String(green.stderr)).toBe(0);

  // COULD-NOT-RUN IS A DIFFERENT NUMBER FROM FOUND-SOMETHING, and this
  // is the half that keeps a silent pass impossible: a checkout with no
  // card at all is a usage error, and a checkout the derivation throws
  // in is THREE. The board here has the card and no `main` for the
  // integration read, so `context` refuses by name.
  const broken = scratchRoot();
  git(broken, ["init", "--initial-branch=trunk", "--quiet"]);
  seedGoverningDocs(broken);
  writeFixtureFile(broken, CARD, cardText({}));
  git(broken, ["add", "-A"]);
  git(broken, ["commit", "-m", "Checkpoint: no main here", "--quiet"]);
  const cannot = cli(["--task", FIXTURE_ID, "--preflight", "--root", broken]);
  expect(cannot.status, String(cannot.stderr)).toBe(3);
  expect(String(cannot.stderr)).toContain("COULD NOT RUN");
});
