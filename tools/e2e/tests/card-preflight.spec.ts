import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
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
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import {
  CLAIM_CLASSES,
  cardClaims,
  checkClaim,
  collapse,
  dischargedBy,
  frontmatterScalars,
  NOT_A_CLAIM_CLASS,
  componentOwners,
  MIN_QUOTE_CHARS,
  ownersOf,
  pathOracle,
  preflight,
  refClaims,
  rulings,
  unmarkedQuotes,
  unseenMarkers,
  unwrapScalar,
} from "../scripts/card-preflight.mjs";
import { DATED_INSTANCES, NEAR_MISS, T203_CASE, TRUE_CLAIM } from "../fixtures/card-claims";
import { context, render } from "../scripts/dispatch-brief.mjs";
import { buildLaneFence, writeLaneFence } from "../scripts/lane-fence.mjs";

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
  // T-178: these roots hold repositories this file COMMITTED into, and a
  // commit detaches `git maintenance run --auto` behind it. The removal is
  // bounded-retried, and one that still cannot finish is the FIXTURE's
  // finding rather than a red on whichever body happened to run last.
  for (const dir of SCRATCH.splice(0)) removeGitFixture(dir, "card-preflight scratch");
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
    [
      "-C",
      cwd,
      "-c",
      "user.email=t160@example.invalid",
      "-c",
      "user.name=T-160 fixture",
      ...NO_BACKGROUND_MAINTENANCE,
      ...args,
    ],
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
  /**
   * The frontmatter `title:` value, verbatim — the scope T-230-s3 opened.
   * A card's title is a scalar FIELD, so a body plants one here and not
   * through `body`.
   */
  title?: string;
  /** The frontmatter fence, verbatim. */
  touches?: string;
  /** The frontmatter blocker list, verbatim. */
  blockedBy?: string;
  /** Replaces the whole criteria section, heading included, when given. */
  noCriteria?: boolean;
  /**
   * Extra tracked files, written before the fixture's own commit. The
   * source a CARD CLAIM marker names has to BE a tracked file at HEAD,
   * so a body that plants a marker plants its source with it.
   */
  files?: { rel: string; content: string }[];
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
    `title: ${planted.title ?? "The card the preflight is measured on"}`,
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
  for (const f of planted.files ?? []) writeFixtureFile(repo, f.rel, f.content);
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

test("a missing path INSIDE the card's own fence is a creation target, not a refusal", async () => {
  // THE CLAUSE THIS PINS WAS FOUND BY THE DRILL AND NOT BY THE PINS.
  // The criterion reads "every repository path the card names EXISTS, or
  // is explicitly a creation target", and the mutant that makes a
  // creation target refuse was killed by nothing — poison shape SEVEN,
  // a mutant no body kills because the mutant set came from the pins
  // rather than from the criteria. This is the body it was missing.
  const inside = await run(
    makeFixture({
      criteria: [`- THE work SHALL create ${SLUG_PATH}/arrives-here.ts, which does not exist yet.`],
    }),
  );
  expect(inside.findings, `a creation target was refused:\n${joined(inside.findings)}`).toEqual([]);
  expect(inside.text).toContain("creation target");
  expect(inside.text).toContain("arrives-here.ts");

  // THE DISCRIMINATING HALF, ONE TOKEN AWAY: the same absent file under a
  // directory the fence does NOT reserve cannot be created by this lane
  // either, so it is a stale claim and refuses. Without this pair, "a
  // creation target is not refused" is satisfied by a preflight that
  // refuses no absent path at all.
  const outside = await run(
    makeFixture({
      criteria: [
        `- THE work SHALL create ${OTHER_SLUG_PATH}/arrives-here.ts, which does not exist yet.`,
      ],
    }),
  );
  expect(joined(outside.findings)).toContain("STALE PATH");
  expect(joined(outside.findings)).toContain("arrives-here.ts");
});

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
    expect(CLAIM_CLASSES.length, "the claim-class table lost a member").toBe(6);
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
    // AND THE `quotes` OMISSIONS ARE PINNED AS LITERALS (T-230-s3). The
    // loop above is PARAMETRISED BY THE VERY STRING IT CHECKS, so it
    // passes for any value the table holds — the empty one included —
    // which is docs/CONVENTIONS.md's A TEST PARAMETRISED BY THE CONSTANT
    // IT CHECKS CANNOT PIN THAT CONSTANT, exactly. A disclosure that can
    // go silent without a red is not a disclosure, so the four clauses
    // this arm's blind spots rest on are asserted against literals here
    // and the loop keeps the cardinality.
    expect(text, "the frontmatter DIRECTION stopped being disclosed").toContain(
      "a MARKER is taken from the BODY's prose alone",
    );
    expect(text, "the frontmatter SCALAR scope stopped being disclosed").toContain(
      "frontmatter's SCALAR values ARE scanned for unmarked quoted runs",
    );
    expect(text, "the floor's own omission stopped being disclosed").toContain(
      "shorter than the floor is COUNTED and not listed",
    );
    // THE HARD WRAP IS A LIMIT THIS CARD DID NOT REPAIR, and stating it
    // is what keeps the two unmarked counts from reading as a closed
    // census: the needle class stops at a newline, so a run spanning the
    // repository's own seventy-column wrap is invisible to both halves.
    expect(text, "the hard-wrap omission stopped being disclosed").toContain(
      "SPANS this repository's hard wrap is read by NEITHER half",
    );
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

test("a card the board's schedule does not draw is REFUSED, naming its status", async () => {
  // A `suggested` finding is not a dispatch candidate, so the parser's
  // order carries no ruling for it — and this command takes both the
  // fence and the blocker verdict from that ruling. It refuses rather
  // than reporting the other four classes as though they were the whole
  // answer, which is the house split between "I found something" and "I
  // could not tell you".
  const fx = makeFixture();
  writeFixtureFile(
    fx.repo,
    CARD,
    cardText({}).replace("status: planned", "status: suggested"),
  );
  git(fx.repo, ["add", "-A"]);
  git(fx.repo, ["commit", "-m", "Checkpoint: the card is a suggestion now", "--quiet"]);

  const ctx = context({ root: fx.repo, taskId: FIXTURE_ID });
  await expect(preflight(ctx)).rejects.toThrow(/"suggested"/);
  // THE DISCRIMINATING HALF: the same card as a dispatch candidate is
  // preflighted normally, so this refusal is about the status and not
  // about the fixture.
  expect((await run(makeFixture())).findings).toEqual([]);
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

/* ────────────────────────────────────────────────────────────────────
 * T-160's VERDICT — the two assigned-correction pins (2 and 3)
 * ──────────────────────────────────────────────────────────────────── */

test("a failed preflight GATES the fence write — no manifest for a card whose claims fell", async () => {
  // Correction 2: the ordering used to be PRINT order only, and the
  // verifier measured arm five writing a manifest for a card with four
  // findings one screen up. The manifest is the step that makes the
  // lane real, so the write is now conditional, and this body is what
  // makes dropping that condition a red rather than a regression.
  const fx = makeFixture({
    criteria: ["- THE work SHALL edit docs/architecture/gone-at-dispatch.md, which does not exist."],
  });
  const lane = path.join(fx.repo, "..", "gate-lane");
  git(fx.repo, ["worktree", "add", "--quiet", "-b", `task/${FIXTURE_ID}-gate-drill`, lane]);
  const refused = cli(
    ["--task", FIXTURE_ID, "--preflight", "--write-fence", lane, "--root", fx.repo],
    fx.repo,
  );
  expect(refused.status, String(refused.stderr)).toBe(1);
  expect(String(refused.stdout)).toContain("fence: NOT WRITTEN");
  expect(
    existsSync(path.join(lane, ".nputer", "lane-fence.json")),
    "the manifest must not exist after a refused preflight",
  ).toBe(false);

  // The clean twin: a card whose claims hold gets its manifest in the
  // same invocation shape.
  const ok = makeFixture();
  // THE FIXTURE'S OTHER LANE IS ARMED FIRST (T-209). `makeFixture` cuts a
  // second live lane so the board census is not a census of one, and it
  // left that lane with no manifest — which no real dispatch does and no
  // lane can survive, since the armed hook refuses EVERY write in a lane
  // branch that holds no manifest. `--write-fence` now intersects against
  // every live lane and answers CANNOT COMPARE for one whose fence it
  // cannot read, so an unarmed sibling made this clean twin unwritable.
  // Arming it is the fixture becoming faithful, not the guard being
  // worked around: the two fences (`preflight-lens`, `preflight-map`)
  // are genuinely disjoint, which is what lets the write below succeed.
  writeLaneFence(await buildLaneFence(OTHER_ID, ok.lane, { root: ok.repo }));
  const okLane = path.join(ok.repo, "..", "gate-lane-ok");
  git(ok.repo, ["worktree", "add", "--quiet", "-b", `task/${FIXTURE_ID}-gate-ok`, okLane]);
  const written = cli(
    ["--task", FIXTURE_ID, "--preflight", "--write-fence", okLane, "--root", ok.repo],
    ok.repo,
  );
  expect(written.status, String(written.stderr)).toBe(0);
  expect(existsSync(path.join(okLane, ".nputer", "lane-fence.json"))).toBe(true);
});

test("a ruling discharges at a token boundary — suffixes and .map twins stay refused", () => {
  // Correction 3: a bare substring over-discharged (a ruling naming
  // `event-names.ts.map` discharged the finding about `event-names.ts`;
  // `T-153` inside `T-153-s5` is the same trap on ids). The boundary:
  // word characters, hyphen, slash, and a dot-followed-by-word all
  // EXTEND the token; a sentence-ending period does not.
  const rule = (text: string) => [{ line: 1, date: "2026-08-30", text }];
  const subject = "app/src/lib/event-names.ts";
  expect(dischargedBy(rule(`PREFLIGHT RULING (2026-08-30): ${subject} is carried.`), subject),
    "the exact subject, sentence period after, discharges").toBeDefined();
  expect(dischargedBy(rule(`PREFLIGHT RULING (2026-08-30): ${subject}.map is carried.`), subject),
    "the .map twin must NOT discharge the .ts finding").toBeUndefined();
  expect(dischargedBy(rule("PREFLIGHT RULING (2026-08-30): T-153-s5 is carried."), "T-153"),
    "a suffixed id must not discharge its parent's finding").toBeUndefined();
  expect(dischargedBy(rule(`PREFLIGHT RULING (2026-08-30): ${subject}, because reasons.`), subject),
    "trailing punctuation that does not extend the token still discharges").toBeDefined();
});

/* ────────────────────────────────────────────────────────────────────
 * CLAIM CLASS SIX — THE CARD'S SENTENCES (T-230)
 *
 * The preflight validated a card's STRUCTURE and nothing validated its
 * ASSERTIONS: three of the four cards dispatched on 2026-09-01 carried
 * a false claim about this repository and all four preflights ran
 * GREEN. What is added is one opt-in marker — a quoted string plus the
 * tracked file the card names as its source — and the split the card's
 * second criterion demands: CHECKED-AND-HELD and NOT-CHECKABLE are
 * different facts and are never one count.
 *
 * EVERY BODY BELOW CARRIES ITS TWIN. A checker that refuses everything
 * and a checker that refuses nothing both satisfy a one-sided body, so
 * each plant is asserted beside the same fixture one mutation away.
 * ──────────────────────────────────────────────────────────────────── */

/** The instance T-230's table gives that card id, or a loud failure. */
function instance(cardId: string) {
  const found = DATED_INSTANCES.find((i) => i.card === cardId);
  if (found === undefined) throw new Error(`no dated instance for ${cardId}`);
  return found;
}

/** A fixture carrying one marked claim and the file that claim names. */
function markedFixture(marker: string, files: { rel: string; content: string }[]) {
  return makeFixture({ body: [marker], files });
}

test("a TRUE marked claim PASSES, and the three counts are printed apart", async () => {
  // THE POSITIVE CONTROL THE THIRD CRITERION ASKS FOR BY NAME, and the
  // body a checker "made to report everything unverifiable" has to fail:
  // a validator that flags every card is indistinguishable from one that
  // works, so the HELD count is asserted NON-ZERO and the other two at
  // zero. Turn the classifier into one that reports everything and all
  // three assertions move at once.
  const fx = markedFixture(TRUE_CLAIM.marker, [
    { rel: TRUE_CLAIM.source, content: TRUE_CLAIM.sourceText },
  ]);
  const { findings, text } = await run(fx);

  expect(findings, `a TRUE quoted claim was refused:\n${joined(findings)}`).toEqual([]);
  expect(text).toContain("CHECKED and HELD: 1");
  expect(text).toContain("CHECKED and FALSE: 0");
  expect(text).toContain("NOT CHECKABLE: 0");
  expect(text).toContain(`CHECKED and HELD line`);
  expect(text).toContain(TRUE_CLAIM.quote);

  // AND THE QUOTE SPANS A HARD WRAP IN THE SOURCE, which is how every
  // quotation from a document in this repository is written. A matcher
  // that compared raw bytes would refuse it, so this is the collapse
  // rule asserted through the whole arm rather than only in its unit.
  expect(TRUE_CLAIM.sourceText, "the fixture stopped spanning a wrap").not.toContain(
    TRUE_CLAIM.quote,
  );
  expect(collapse(TRUE_CLAIM.sourceText)).toContain(TRUE_CLAIM.quote);
});

test("T-211's instance: the flag the frozen list does not carry is CAUGHT", async () => {
  const i = instance("T-211");
  const files = [{ rel: i.source, content: i.sourceText }];
  const caught = await run(markedFixture(i.marker, files));
  expect(joined(caught.findings)).toContain("QUOTED CLAIM NOT IN FILE");
  expect(joined(caught.findings)).toContain(i.needle);
  expect(joined(caught.findings)).toContain(i.source);

  // THE DISCRIMINATING HALF IS IN THE SAME FILE: a flag the frozen list
  // DOES carry is held, so the arm reads the list rather than refusing
  // every flag anybody quotes.
  const real = await run(
    markedFixture("CARD CLAIM (tools/e2e/scripts/brief.mjs): `--preflight`", files),
  );
  expect(real.findings, `a true flag claim was refused:\n${joined(real.findings)}`).toEqual([]);
  expect(real.text).toContain("CHECKED and HELD: 1");
});

test("T-203's instance is a CASE POLICY, and all three of its readings are pinned", async () => {
  // THE DISPATCH NOTE WAS WRONG AND THE CORRECTION IS WHAT THIS BODY
  // CARRIES. The card was dispatched saying the quote is absent from the
  // governing document; it is there, in capitals, so a case-sensitive
  // search reads zero and a folded one reads one. That makes the
  // instance a policy question and this body states the policy: match
  // AS WRITTEN, and name the folded answer in the detail so the author
  // can tell a discrepancy from a disagreement about capitals.
  const i = instance("T-203");

  // ARM ONE — the document that genuinely does not carry it. This is the
  // instance as the card describes it, and it refuses without a case
  // hint, so the hint discriminates rather than decorating every miss.
  const absent = await run(markedFixture(i.marker, [{ rel: i.source, content: i.sourceText }]));
  expect(joined(absent.findings)).toContain("QUOTED CLAIM NOT IN FILE");
  expect(joined(absent.findings)).toContain(i.needle);
  expect(joined(absent.findings)).not.toContain("case-insensitive search DOES find it");

  // ARM TWO — the document as it stands, saying it in its own capitals.
  // A folded matcher calls this HELD; this one refuses and says exactly
  // why, which is the whole difference between a guard and a mood.
  const cased = await run(
    markedFixture(T203_CASE.marker, [{ rel: T203_CASE.source, content: T203_CASE.sourceText }]),
  );
  expect(joined(cased.findings)).toContain("QUOTED CLAIM NOT IN FILE");
  expect(joined(cased.findings)).toContain("case-insensitive search DOES find it");
  expect(T203_CASE.sourceText, "the fixture stopped carrying the shouted form").toContain(
    T203_CASE.asWritten,
  );

  // ARM THREE — the card quoting the document's OWN capitals HOLDS. The
  // policy has to have a green side, or "match as written" is
  // indistinguishable from "refuse every quote from this file".
  const asWritten = await run(
    markedFixture(T203_CASE.markerAsWritten, [
      { rel: T203_CASE.source, content: T203_CASE.sourceText },
    ]),
  );
  expect(
    asWritten.findings,
    `the document's own sentence was refused:\n${joined(asWritten.findings)}`,
  ).toEqual([]);
  expect(asWritten.text).toContain("CHECKED and HELD: 1");
});

test("T-210's instance is REPORTED, never merged into what was checked", async () => {
  // THE CARD RULES THIS CLASS OUT BY NAME: a claim about a platform's
  // behaviour is not mechanically checkable, and the honest answer is to
  // route it to the verifier's phase-1 ground truth rather than pretend
  // a scanner can settle it. So the measurement is the DISPOSITION: it
  // is counted, it is listed, it refuses nothing, and it never appears
  // as something the preflight checked.
  const i = instance("T-210");
  expect(i.marker, "the platform instance acquired a marker it cannot have").toBe("");
  const { findings, text } = await run(makeFixture({ body: [i.prose] }));

  expect(findings, `an unmarkable assertion refused a dispatch:\n${joined(findings)}`).toEqual([]);
  expect(text).toContain("quoted and NOT marked, naming no source at all: 1");
  expect(text).toContain("NOT CHECKED, no source named");
  expect(text).toContain(i.needle);
  // THE CENSUS HALF OF THE SECOND CRITERION: it is not counted as
  // checked, and the two are never one number.
  expect(text).toContain("marked claims: 0");
  expect(text).toContain("CHECKED and HELD: 0");
  expect(text).toContain("phase-one ground truth");

  // THE DISCRIMINATOR: the same sentence in a paragraph that names a
  // file lands in the OTHER unchecked class, so the split is a reading
  // of the paragraph rather than a label on every quote.
  const beside = await run(
    makeFixture({ body: [`${i.prose} See docs/GOVERNING.md.`], files: [
      { rel: "docs/GOVERNING.md", content: TRUE_CLAIM.sourceText },
    ] }),
  );
  expect(beside.text).toContain("quoted and NOT marked, beside a path this card names: 1");
  expect(beside.text).toContain("quoted and NOT marked, naming no source at all: 0");
});

test("the near miss: a TRUE quote under the WRONG file name is a finding", async () => {
  // The fifth criterion, and the whole of what separates a file-scoped
  // check from a substring search over the tree: the string IS in the
  // repository, in a file the fixture also plants, and the marker names
  // a different one. A tree-wide search passes this card.
  const files = [
    { rel: NEAR_MISS.holder, content: NEAR_MISS.holderText },
    { rel: NEAR_MISS.named, content: NEAR_MISS.namedText },
  ];
  expect(collapse(NEAR_MISS.holderText), "the holder stopped holding it").toContain(
    NEAR_MISS.quote,
  );
  expect(collapse(NEAR_MISS.namedText), "the named file gained the quote").not.toContain(
    NEAR_MISS.quote,
  );

  const wrong = await run(markedFixture(NEAR_MISS.marker, files));
  expect(joined(wrong.findings)).toContain("QUOTED CLAIM NOT IN FILE");
  expect(joined(wrong.findings)).toContain(NEAR_MISS.named);
  expect(joined(wrong.findings)).toContain("near miss");

  // ONE TOKEN AWAY: the same quote, the file that really holds it, and
  // the card passes. Without this half the body is satisfied by a
  // checker that refuses every quoted claim there is.
  const right = await run(markedFixture(NEAR_MISS.correctMarker, files));
  expect(right.findings, `the correctly sourced twin was refused:\n${joined(right.findings)}`)
    .toEqual([]);
  expect(right.text).toContain("CHECKED and HELD: 1");
});

test("a marker nobody can evaluate refuses AND counts NOT CHECKABLE, never HELD", async () => {
  // A MARKER IS A REQUEST FOR A CHECK. One that names no tracked file,
  // or carries no quoted string, is a request nobody could answer — so
  // it is counted apart from what was checked (the second criterion) and
  // refuses as well, because the alternative is a card that asked to be
  // checked, was not, and reads as though it had been.
  const noSource = await run(markedFixture('CARD CLAIM (docs/NEVER-EXISTED.md): "anything"', []));
  expect(joined(noSource.findings)).toContain("UNCHECKABLE CARD CLAIM");
  expect(noSource.text).toContain("NOT CHECKABLE: 1");
  expect(noSource.text).toContain("CHECKED and HELD: 0");

  const noQuote = await run(
    markedFixture("CARD CLAIM (docs/GOVERNING.md): it says the thing about pipes", [
      { rel: "docs/GOVERNING.md", content: TRUE_CLAIM.sourceText },
    ]),
  );
  expect(joined(noQuote.findings)).toContain("UNCHECKABLE CARD CLAIM");
  expect(joined(noQuote.findings)).toContain("no quoted string");
  expect(noQuote.text).toContain("NOT CHECKABLE: 1");

  // A DIRECTORY IS ITS OWN ANSWER rather than a missing file, because
  // the repair is different: name the file inside it.
  const dir = await run(markedFixture('CARD CLAIM (docs/tasks): "anything"', []));
  expect(joined(dir.findings)).toContain("directory");

  // AND THE TWIN: a marker that CAN be evaluated is not in this class at
  // all, so the three counts discriminate rather than label.
  const fine = await run(
    markedFixture(TRUE_CLAIM.marker, [{ rel: TRUE_CLAIM.source, content: TRUE_CLAIM.sourceText }]),
  );
  expect(fine.text).toContain("NOT CHECKABLE: 0");
});

test("a marker-shaped line the prose reader cannot see is REPORTED, never a claim", async () => {
  // THE SILENT-FORMATTING HOLE, CLOSED IN THE ONLY DIRECTION IT CAN BE.
  // A ruling written as an indented line is invisible to its reader and
  // the author cannot tell (T-160's verdict, correction 4). The same
  // shape here would be worse, because documentation ABOUT this marker
  // is written in exactly the blocks the prose reader blanks — so an
  // unseen marker is REPORTED rather than promoted to a claim.
  const quoted = await run(
    makeFixture({
      body: [
        "The form is one plain body line:",
        "",
        '    CARD CLAIM (docs/NEVER-EXISTED.md): "an example, not a claim"',
      ],
    }),
  );
  expect(quoted.findings, `an example became a claim:\n${joined(quoted.findings)}`).toEqual([]);
  expect(quoted.text).toContain("marker-shaped line the prose reader does not see");
  expect(quoted.text).toContain("marked claims: 0");

  // THE DISCRIMINATING HALF: the same marker unindented IS a claim, and
  // this one names a file that does not exist, so it refuses. Without
  // it, "an indented marker is not a claim" is satisfied by a reader
  // that sees no markers at all.
  const live = await run(
    makeFixture({ body: ['CARD CLAIM (docs/NEVER-EXISTED.md): "an example, not a claim"'] }),
  );
  expect(joined(live.findings)).toContain("UNCHECKABLE CARD CLAIM");
  expect(unseenMarkers("---\nid: x\n---\n\nCARD CLAIM (a/b): \"c\"\n")).toEqual([]);
});

test("a quoted-claim finding is dischargeable by a dated ruling naming its quote", async () => {
  // The refusal rides the rails the other five classes already have: a
  // discrepancy is corrected, or ruled acceptable ON the card, dated,
  // naming the finding's own subject.
  const i = instance("T-203");
  const files = [{ rel: i.source, content: i.sourceText }];
  const ruled = await run(
    makeFixture({
      files,
      body: [
        i.marker,
        "",
        `PREFLIGHT RULING (2026-09-01): "${i.needle}" is quoted from the version this card was`,
        "written against; carried deliberately.",
      ],
    }),
  );
  expect(ruled.findings, `\n${joined(ruled.findings)}`).toEqual([]);
  expect(ruled.text).toContain("RULED (2026-09-01)");

  // AND A RULING NAMING A DIFFERENT QUOTE DISCHARGES NOTHING, which is
  // what keeps the ruling from becoming an amnesty for the class.
  const other = await run(
    makeFixture({
      files,
      body: [i.marker, "", "PREFLIGHT RULING (2026-09-01): something else entirely is carried."],
    }),
  );
  expect(other.findings.length, `\n${joined(other.findings)}`).toBe(1);
  expect(other.text).toContain("discharges nothing at this ref");
});

/* ────────────────────────────────────────────────────────────────────
 * THE PURE HALVES OF CLASS SIX, DRIVEN DIRECTLY
 * ──────────────────────────────────────────────────────────────────── */

test("the marker is read through a bullet and emphasis, and the FIRST quoted run is the needle", () => {
  const card = [
    "---",
    "id: T-903",
    "---",
    "",
    'CARD CLAIM (docs/A.md): "the plain form"',
    '- CARD CLAIM (docs/B.md): "through a bullet"',
    '**CARD CLAIM (`docs/C.md`): "through emphasis, with a backticked source"**',
    'CARD CLAIM (docs/D.md): the flag `--first` is spelled "second here"',
    "",
  ].join("\n");
  const found = cardClaims(card);
  expect(found.map((c) => c.source)).toEqual(["docs/A.md", "docs/B.md", "docs/C.md", "docs/D.md"]);
  expect(found.map((c) => c.quote)).toEqual([
    "the plain form",
    "through a bullet",
    "through emphasis, with a backticked source",
    "--first",
  ]);
});

test("the file check collapses the wrap on both sides and keeps the capitals", () => {
  const root = scratchRoot();
  git(root, ["init", "--initial-branch=main", "--quiet"]);
  writeFixtureFile(root, "docs/GOVERNING.md", TRUE_CLAIM.sourceText);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-m", "Checkpoint: one document", "--quiet"]);
  const oracle = pathOracle(root);
  const claim = (quote: string, source = "docs/GOVERNING.md") => ({
    line: 1,
    source,
    quote,
    payload: quote,
  });

  // ACROSS THE WRAP: the sentence is two lines in the file and one in
  // the card, and it HOLDS.
  expect(checkClaim(root, oracle, claim(TRUE_CLAIM.quote)).state).toBe("held");
  // THE SAME SENTENCE SHOUTED IS A DISCREPANCY, and the detail says so
  // rather than leaving the author to search.
  const shouted = checkClaim(root, oracle, claim(TRUE_CLAIM.quote.toUpperCase()));
  expect(shouted.state).toBe("false");
  expect(shouted.detail).toContain("case-insensitive");
  // AND A SENTENCE NOTHING IN THE FILE SAYS IS FALSE WITHOUT THE CASE
  // HINT, so the hint discriminates rather than decorating every miss.
  const absent = checkClaim(root, oracle, claim("a sentence this document never carried"));
  expect(absent.state).toBe("false");
  expect(absent.detail).not.toContain("case-insensitive");
  expect(checkClaim(root, oracle, claim("x", "docs/GONE.md")).state).toBe("untracked");
  expect(checkClaim(root, oracle, claim("x", "docs")).state).toBe("directory");
  expect(checkClaim(root, oracle, claim("")).state).toBe("unreadable");
});

test("the unmarked report is paragraph-scoped, and a marker's own needle is not in it", () => {
  const root = scratchRoot();
  git(root, ["init", "--initial-branch=main", "--quiet"]);
  writeFixtureFile(root, "docs/GOVERNING.md", "anything\n");
  git(root, ["add", "-A"]);
  git(root, ["commit", "-m", "Checkpoint: one document", "--quiet"]);
  const oracle = pathOracle(root);
  const card = [
    "---",
    "id: T-903",
    "---",
    "",
    'The rule is "quoted across the wrap" and it lives in',
    "docs/GOVERNING.md, two lines below the heading.",
    "",
    'A paragraph that names no file at all, quoting "a platform behaviour".',
    "",
    'CARD CLAIM (docs/GOVERNING.md): "a marked needle"',
    "",
    'Short ones like "abc" are below the floor and are not assertions.',
    "",
  ].join("\n");
  const loose = unmarkedQuotes(card, oracle);
  const listed = loose.filter((q) => !q.belowFloor);
  expect(listed.map((q) => q.text)).toEqual(["quoted across the wrap", "a platform behaviour"]);
  // THE WRAP IS THE WHOLE REASON THE PARAGRAPH IS THE UNIT: the quote is
  // on one line and the path it is about is on the next.
  expect(listed.map((q) => q.nearPath)).toEqual([true, false]);
  // AND THE SHORT RUN IS RETURNED, FLAGGED, RATHER THAN DROPPED
  // (T-230-s3). It stays out of the listing — the floor is what keeps
  // initials and punctuation samples from swamping it — but it is in the
  // set, which is what lets the report carry a number for it.
  const short = loose.filter((q) => q.belowFloor);
  expect(short.map((q) => q.text)).toEqual(["abc"]);
  expect("abc".length, "the fixture stopped sitting below the floor").toBeLessThan(
    MIN_QUOTE_CHARS,
  );
  // EVERY RUN IN THIS CARD IS IN THE BODY, so `field` discriminates
  // rather than being constant: the frontmatter body below moves it.
  expect(loose.every((q) => q.field === "")).toBe(true);
});

/* ────────────────────────────────────────────────────────────────────
 * THE FRONTMATTER SCOPE (T-230-s3)
 *
 * Every reader in this class took `cardBody(cardText)`, which strips the
 * frontmatter — so a card's TITLE was the one place none of them looked,
 * and one of the arm's own founding instances states its claim there.
 * The three bodies below pin the three halves of the repair: the values
 * are read with YAML's own quoting off, a quoted assertion in a field is
 * COUNTED and LISTED, and a marker written into a field is a SIGHTING
 * and never a claim.
 * ──────────────────────────────────────────────────────────────────── */

test("a frontmatter scalar is read with YAML's own quoting off, and a real pair is not eaten", () => {
  // THE WRAPPER IS SYNTAX AND THE INNER PAIR IS AN ASSERTION, and the
  // whole scope turns on telling them apart: measured over the live
  // board at f5bad14 the raw reading finds a hundred and thirty-one
  // wrappers among its hits, and every one of them is a quotation mark
  // nobody wrote as a quotation.
  expect(unwrapScalar('"a wrapped scalar"')).toBe("a wrapped scalar");
  expect(unwrapScalar("'a wrapped scalar'")).toBe("a wrapped scalar");
  // THE DISCRIMINATING HALF: a value that merely begins and ends with a
  // quote is two runs, not a wrapper, and stripping it would silently
  // fuse two assertions into one.
  expect(unwrapScalar('"the first" and "the second"')).toBe('"the first" and "the second"');
  expect(unwrapScalar("a title that quotes \"one run\" mid-sentence")).toBe(
    'a title that quotes "one run" mid-sentence',
  );

  const card = [
    "---",
    "id: T-903",
    'title: the design "already says it" and docs/CONVENTIONS.md carries it',
    'suggested_by: "verifier at the second criterion"',
    "touches: [preflight-lens]",
    "builder:",
    "---",
    "",
    "body",
    "",
  ].join("\n");
  const scalars = frontmatterScalars(card);
  // THE LIST VALUE IS NOT A SCALAR AND THE EMPTY FIELD IS NOT A
  // SENTENCE: a fence entry is the fence arm's claim, and an unfilled
  // field asserts nothing.
  expect(scalars.map((s) => s.key)).toEqual(["id", "title", "suggested_by"]);
  // THE LINE IS INTO THE CARD FILE, so a finding can name where it is.
  expect(scalars.map((s) => s.line)).toEqual([2, 3, 4]);
  expect(scalars[2]?.value).toBe("verifier at the second criterion");
});

test("a quoted assertion in the card's TITLE is COUNTED and LISTED, naming its field", async () => {
  // THE FOUNDING INSTANCE, RELOCATED TO A FIXTURE. The card's own
  // reproduction is a title carrying a quoted assertion beside the
  // governing document it is about; before this scope existed all three
  // readers returned nothing and the author was told nothing.
  const fx = makeFixture({
    title: 'the design "already fails the checkpoint sync" and docs/CONVENTIONS.md says so',
  });
  const { findings, text } = await run(fx);

  // IT REPORTS AND NEVER REFUSES — the same disposition every unmarked
  // quote has, because nobody asked for this check.
  expect(findings, `a title assertion refused a dispatch:\n${joined(findings)}`).toEqual([]);
  expect(text).toContain("quoted and NOT marked, beside a path this card names: 1");
  expect(text).toContain("NOT CHECKED, a path is named nearby, frontmatter title, line");
  expect(text).toContain("already fails the checkpoint sync");
  // AND IT IS NEVER COUNTED AS CHECKED. The census split is the whole
  // point of the class: what was looked at and what was not are two
  // numbers and never one.
  expect(text).toContain("marked claims: 0");
  expect(text).toContain("CHECKED and HELD: 0");

  // THE TWIN, ONE FIELD AWAY: the default title carries no quoted run,
  // and both counts go to zero. Without this half the body is satisfied
  // by a reader that reports every card's title unconditionally.
  const plain = await run(makeFixture());
  expect(plain.text).toContain("quoted and NOT marked, beside a path this card names: 0");
  expect(plain.text).not.toContain("frontmatter title, line");

  // THE SECOND DISCRIMINATOR: the same assertion in a title that names
  // no path lands in the OTHER unchecked class, so the field is read as
  // its own unit rather than joined to the whole frontmatter block —
  // where `touches:` would make every title sit beside a path.
  const alone = await run(makeFixture({ title: 'a title quoting "already fails" and no file' }));
  expect(alone.text).toContain("quoted and NOT marked, naming no source at all: 1");
  expect(alone.text).toContain("NOT CHECKED, no source named, frontmatter title, line");
});

test("a marker written into a frontmatter field is a SIGHTING, never a claim", async () => {
  // A FRONTMATTER KEY IS A FIELD WITH ITS OWN OWNER, which is why
  // `cardBody` strips the block at all — so a marker written there is a
  // request in the wrong place. It gets the disposition an unseen marker
  // already has: reported, so the author is told, and never promoted to
  // something that refuses.
  const marked = await run(
    makeFixture({ title: `'CARD CLAIM (docs/NEVER-EXISTED.md): "a needle in a field"'` }),
  );
  expect(marked.findings, `a frontmatter marker refused:\n${joined(marked.findings)}`).toEqual([]);
  expect(marked.text).toContain("marker-shaped line the prose reader does not see, line 3");
  expect(marked.text).toContain("marked claims: 0");

  // THE DISCRIMINATING HALF, one line of the card away: the SAME marker
  // as a plain body line IS a claim, and this one names a file that does
  // not exist, so it refuses. Without it, "a frontmatter marker is only
  // a sighting" is satisfied by a reader that sees no markers anywhere.
  const inBody = await run(
    makeFixture({ body: ['CARD CLAIM (docs/NEVER-EXISTED.md): "a needle in a field"'] }),
  );
  expect(joined(inBody.findings)).toContain("UNCHECKABLE CARD CLAIM");
  expect(inBody.text).toContain("NOT CHECKABLE: 1");

  // AND THE CLEAN TWIN REPORTS NO SIGHTING AT ALL, so the line above is
  // a reading of this card rather than a header printed on every run.
  const plain = await run(makeFixture());
  expect(plain.text).not.toContain("marker-shaped line the prose reader does not see");
});

test("a quoted run below the floor is COUNTED, and it is still not listed", async () => {
  // THE CLASS'S OWN REPORT SAYS THE UNMARKED ONES ARE COUNTED AND
  // LISTED, and a run dropped for being short made that sentence false —
  // the author could not tell a card with no short runs from a card
  // whose short runs were discarded. The floor still decides the
  // LISTING; what it may not decide any more is the census.
  const short = await run(makeFixture({ body: ['Initials like "ab" are not assertions.'] }));
  expect(short.text).toContain("below the quote floor: 1");
  // AND IT IS NOT PROMOTED INTO EITHER LISTED SET, which is the half
  // that would make the floor pointless.
  expect(short.text).toContain("quoted and NOT marked, beside a path this card names: 0");
  expect(short.text).toContain("quoted and NOT marked, naming no source at all: 0");
  expect(short.findings, `a short run refused a dispatch:\n${joined(short.findings)}`).toEqual([]);

  // THE TWIN, ONE CHARACTER LONGER: the same sentence with a run AT the
  // floor is listed and the floor count falls back to zero. A body that
  // asserted only the count is satisfied by a counter wired to the
  // wrong set.
  const atFloor = await run(makeFixture({ body: ['Initials like "abcd" are not assertions.'] }));
  expect(atFloor.text).toContain("below the quote floor: 0");
  expect(atFloor.text).toContain("quoted and NOT marked, naming no source at all: 1");
  expect(atFloor.text).toContain('NOT CHECKED, no source named, line');
  expect("ab".length).toBeLessThan(MIN_QUOTE_CHARS);
  expect("abcd".length).toBeGreaterThanOrEqual(MIN_QUOTE_CHARS);
});

test("the NOT CHECKABLE record ESCAPES the source the card wrote, as its finding already does", async () => {
  // THE VALUE IS A STRING THE CARD WROTE and the record line
  // interpolated it bare, so a source carrying spaces ran into the
  // sentence around it and the reader could not see where it ended. The
  // finding beside it was already escaped; this is the record catching
  // up with it.
  const spaced = await run(markedFixture('CARD CLAIM (docs/two words.md): "anything at all"', []));
  expect(spaced.text).toContain('NOT CHECKABLE line');
  expect(spaced.text).toContain('source "docs/two words.md"');
  // THE BARE FORM IS WHAT THIS BODY REFUSES, and naming it is what makes
  // the assertion above discriminate: with the escape removed the record
  // reads `source docs/two words.md` and this line finds it.
  expect(spaced.text).not.toContain("source docs/two words.md ");
  expect(joined(spaced.findings)).toContain("UNCHECKABLE CARD CLAIM");

  // THE TWIN: a marker that CAN be evaluated prints no record at all, so
  // the escape is a property of this line rather than of every line.
  const fine = await run(
    markedFixture(TRUE_CLAIM.marker, [{ rel: TRUE_CLAIM.source, content: TRUE_CLAIM.sourceText }]),
  );
  expect(fine.text).not.toContain("NOT CHECKABLE line");
});
