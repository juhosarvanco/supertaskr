import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import { conventionsText } from "../scripts/docs-scan.mjs";
import {
  CHECK_IDS,
  flipListFindings,
  parseDocsGateRecipe,
  parseRangeRule,
  pipedThroughXargs,
  rangeRuleBullet,
  rangeRuleReport,
} from "../scripts/range-rule.mjs";

/**
 * THE RANGE RULE READER (T-091) — no browser.
 *
 * `docs/CONVENTIONS.md`'s RANGE RULE bullet is the longest paragraph in
 * the file and the most consulted: every integrator and every executor
 * derives a gate trigger through it. Until this spec, NOTHING IN THIS
 * TREE COULD CHECK IT, and that was an artefact of a FENCE rather than of
 * prose — T-083 was `touches: [docs/CONVENTIONS.md]` and a reader has to
 * live here. Its verifier proved the point by writing one on the side:
 * green on the merged file, red on the poisoned one, twelve findings over
 * ten mutants. It was evidence for a ruling and was never committed.
 *
 * The bullet's own ten mutants, measured on T-083's branch, all passed
 * `workflow-parity` 14/14, `cargo test`, `lint:tokens` and the parser
 * suite at exit 0. TEN MUTANTS, ZERO KILLED. This file is the answer.
 *
 * ── HOW TO READ A FAILURE ────────────────────────────────────────────
 * Every test here compares TWO SIDES THAT SHARE NO CONSTANT: `git`
 * computes on one, the parsed bullet is read on the other. A red means
 * they disagree, and the message names both. It does NOT tell you which
 * is wrong — a figure in that bullet is a MEASUREMENT AT A REF, so before
 * editing the document, check that the ref and the spelling the sentence
 * names are the ones you re-derived under. The bullet's own worked case:
 * `git rev-list --first-parent --merges 94ee306..ddcc8bb` returns 30
 * against a published 31, and the published figure is the RIGHT one,
 * because `94ee306` is itself a merge and "from … through" is inclusive.
 * A reader that re-derives with the natural spelling reds on a true
 * number. That pair is a FIXTURE below, not a footnote.
 *
 * ── WHY THE HEAVY DERIVATION IS IN A beforeAll ───────────────────────
 * One pass over the scored range answers every test in this file: 31
 * merges, four printed commands each, under two metrics. Each `test()`
 * below then reads its own slice of that one pass, so a failure names
 * ONE criterion rather than the whole bullet.
 *
 * ── THE DRILL AFFORDANCE ─────────────────────────────────────────────
 * `SUPERTASKR_RANGE_RULE_ROOT` points this reader at another checkout of THIS
 * repository. It exists for the POISON DRILL: the document under test is
 * a tracked file, so a drill mutates it in a detached scratch worktree
 * and never in the lane. The resolved root is printed by the first test.
 */

const DRILL_ROOT = process.env.SUPERTASKR_RANGE_RULE_ROOT;
const ROOT = DRILL_ROOT ?? repoRoot;

/**
 * The document under test.
 *
 * THE ZERO-ARGUMENT SPELLING ON THE DEFAULT PATH IS LOAD-BEARING AND NOT
 * A STYLE CHOICE. `docs-scan.mjs`'s CALL SITE arm recognises
 * `conventionsText()` and is what puts this file in the DOCS GATE's
 * reader census — with the root passed as a variable instead, this spec
 * reads `docs/CONVENTIONS.md`, reds when it changes, and is INVISIBLE to
 * the gate whose whole job is naming the suites a docs edit owes.
 * Measured here: 12 readers with the variable spelling, 13 with this one.
 * Filed as `T-091-s2` — the next reader written the other way will be
 * invisible too, and this workaround is a shape nobody will know to copy.
 */
function conventions(): string {
  return DRILL_ROOT === undefined ? conventionsText() : conventionsText(DRILL_ROOT);
}

type Report = ReturnType<typeof rangeRuleReport>;
let report: Report | undefined;

test.beforeAll(() => {
  // 31 merges x (4 printed commands x 2 metrics) + the identity sweep.
  test.setTimeout(300_000);
  report = rangeRuleReport(ROOT);
});

function derived(): Report {
  if (report === undefined) throw new Error("range-rule: the derivation did not run");
  return report;
}

for (const id of CHECK_IDS) {
  test(`RANGE RULE — ${id}`, () => {
    const { checks, derivation } = derived();
    const check = checks.find((c) => c.id === id);
    if (check === undefined) {
      throw new Error(
        `range-rule: no check produced for ${id}. CHECK_IDS is the spec's contract with ` +
          "the reader; a name in it that the reader does not answer is a body that " +
          "silently tests nothing.",
      );
    }
    for (const note of check.notes) {
      const line = `${derivation.root} @ ${derivation.head.slice(0, 7)} — ${note}`;
      test.info().annotations.push({ type: "range-rule disclosure", description: line });
      // ANNOTATIONS ARE INVISIBLE IN THE `list` REPORTER, and a disclosure
      // nobody sees is silence with extra steps. Printed as well, once.
      process.stdout.write(`\n  range-rule DISCLOSURE [${id}]: ${line}\n`);
    }
    expect(check.findings, check.findings.join("\n")).toEqual([]);
  });
}

/**
 * SHAPE FIVE's remedy, applied to a reader whose expectations are parsed
 * rather than written: a coverage floor. Without it, deleting an
 * assertion deletes its own failure, and a claim the parser learns to
 * read but nobody compares is an expectation that passes everything.
 */
test("RANGE RULE — every parsed claim is answered by some check", () => {
  const { checks, derivation } = derived();
  const covered = new Set(checks.flatMap((c) => c.claimKeys));
  const parsed = Object.keys(derivation.claims);
  const uncovered = parsed.filter((k) => !covered.has(k));
  expect(
    uncovered,
    `the reader PARSES these claims out of the bullet and no check compares them against ` +
      `git: ${uncovered.join(", ")}. A parsed expectation nobody checks is a figure this ` +
      "reader has read and let stand.",
  ).toEqual([]);
  const unknown = [...covered].filter((k) => !parsed.includes(k));
  expect(
    unknown,
    `these checks claim to answer keys the parser does not produce: ${unknown.join(", ")}`,
  ).toEqual([]);
  expect(parsed.length).toBeGreaterThan(0);
});

/**
 * CRITERION 1's second half, executed rather than asserted about: a parse
 * failure THROWS. An expectation that quietly becomes empty passes
 * everything, and nothing points at it — which is exactly how ten mutants
 * survived ten green suites.
 *
 * Every mutation here is applied IN MEMORY and ONE SIDE ONLY: the
 * document text is poisoned, the producer (`git`) is untouched.
 */
test("RANGE RULE — a parse failure throws instead of yielding an empty expectation", () => {
  const md = conventions();

  // POSITIVE CONTROL. Without it, "it throws" is satisfied equally by a
  // reader that refuses this document and one that refuses every
  // document, and only the first is the property.
  expect(() => parseRangeRule(md)).not.toThrow();

  const bullet = rangeRuleBullet(md);

  // Zero bullets: the paragraph is gone.
  const deleted = md.replace(bullet, "");
  expect(deleted).not.toBe(md);
  expect(() => parseRangeRule(deleted)).toThrow(/expected exactly one/);

  // Two bullets: the phrase has stopped identifying one paragraph, and
  // silently taking the first is how a check ends up asserting against
  // the wrong one.
  const doubled = md.replace(bullet, `${bullet}\n${bullet}`);
  expect(doubled).not.toBe(md);
  expect(() => parseRangeRule(doubled)).toThrow(/expected exactly one/);

  // One sentence retired: the figure is gone and the reader must say so
  // by name rather than expect nothing. The mutation is deliberately NOT
  // the number — a value poison leaves the sentence findable and is what
  // the checks above kill; this one retires the sentence, which is the
  // shape that turns an expectation into nothing at all.
  const claims = parseRangeRule(md);
  const opener = `RE-MEASURED at T-027's merge \`${claims.t027Ref}\``;
  expect(md).toContain(opener);
  const retired = md.replace(opener, `Re-measured at T-027's merge \`${claims.t027Ref}\``);
  expect(retired).not.toBe(md);
  expect(() => parseRangeRule(retired)).toThrow(/no longer states the T-027 measurement/);
});

/**
 * CRITERION 1's first half, executed: THE TWO SIDES SHARE NO CONSTANT.
 *
 * A reader that pinned `**9**` would be green on this tree and would stay
 * green with the document rewritten — indistinguishable, from the
 * outside, from one that reads. So move the DOCUMENT and require the
 * expectation to move with it. Nothing else in this file kills that
 * mutant: every other body is green either way.
 */
test("RANGE RULE — the expectation side is READ from the document, never pinned", () => {
  const md = conventions();
  const before = parseRangeRule(md);

  const from = `**${before.scoredCount}** first-parent merges`;
  const to = `**${before.scoredCount + 1}** first-parent merges`;
  expect(md).toContain(from);
  const moved = md.replace(from, to);
  expect(moved).not.toBe(md);

  const after = parseRangeRule(moved);
  expect(
    after.scoredCount,
    "the reader's expectation did not follow the document, so it is not reading it",
  ).toBe(before.scoredCount + 1);
  expect(after.scoredCount).not.toBe(before.scoredCount);
});

/**
 * THE MUTANT THIS CARD NAMES, run as a body rather than described in a
 * note: relabel T-076 from BOOT GATE to GRAPH REGEN — `T-083-s1`'s real,
 * shipped error, which lived in `cb3aa31` until T-083 derived it out.
 *
 * The point is not only that the reader reds. It is that A SET-EQUALITY
 * CHECK OVER ALL THIRTEEN HASHES PASSES STRAIGHT THROUGH IT, and this
 * body proves BOTH halves against the same mutation, so the argument for
 * checking by gate cannot rot into a habit.
 */
test("RANGE RULE — the flip lists are checked BY GATE, and a merged set would miss the relabel", () => {
  const { derivation } = derived();
  const md = conventions();
  const clean = parseRangeRule(md);

  const bootEntries = clean.flipsByGate["BOOT GATE"];
  const graphEntries = clean.flipsByGate["GRAPH REGEN"];
  expect(bootEntries, "the bullet no longer files flips under BOOT GATE").toBeDefined();
  expect(graphEntries, "the bullet no longer files flips under GRAPH REGEN").toBeDefined();

  // The subject is derived from the bullet's OWN correction sentence, not
  // named here: T-083-s1 says which merge `cb3aa31` filed under the wrong
  // gate, and that is the entry this drill moves back to the wrong one.
  const target = bootEntries?.find((e) => clean.misattributedMerge.startsWith(e.hash));
  expect(
    target,
    `the merge T-083-s1 corrects (${clean.misattributedMerge}) is no longer filed under ` +
      "BOOT GATE in the bullet, so this drill has lost its subject",
  ).toBeDefined();

  // ONE SIDE ONLY: move the entry from the BOOT segment to the GRAPH
  // segment in the DOCUMENT. `git` is not touched, and neither is any
  // number — the relabel is the whole mutation.
  const moved = `${target?.task ?? ""} \`${target?.hash ?? ""}\``;
  const withParen = new RegExp(
    `${moved.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( \\(\\d+(?: paths)? against \\d+\\))?`,
  );
  const found = md.match(withParen);
  expect(found, "could not locate the entry to relabel").not.toBeNull();
  const entryText = found?.[0] ?? "";
  const poisoned = md
    .replace(`, ${entryText}`, "")
    .replace("; GRAPH REGEN at ", `; GRAPH REGEN at ${entryText}, `);
  expect(poisoned).not.toBe(md);

  const poisonedClaims = parseRangeRule(poisoned);

  // HALF ONE — the merged set does not move, so a set check sees nothing.
  const flatten = (byGate: Record<string, { hash: string }[]>): string[] =>
    Object.values(byGate)
      .flat()
      .map((e) => e.hash)
      .sort();
  expect(
    flatten(poisonedClaims.flipsByGate),
    "the relabel changed the MERGED hash set, so this drill is no longer the mutant it " +
      "claims to be — the whole point is that a set-equality check cannot see it",
  ).toEqual(flatten(clean.flipsByGate));

  // HALF TWO — checked BY GATE, it reds, and the finding names the gate.
  expect(flipListFindings(derivation, clean)).toEqual([]);
  const findings = flipListFindings(derivation, poisonedClaims);
  expect(findings.length).toBeGreaterThan(0);
  expect(findings.join("\n")).toMatch(/GRAPH REGEN|BOOT GATE/);
});

/**
 * THE NINTH ITEM's own guard, from T-084's integration: a printed recipe
 * whose EXIT CODE the pipeline eats is a corrupt recipe. The check above
 * EXECUTES the DOCS GATE's printed spelling and compares the observed
 * code with the promised one; this body defends the thing that makes that
 * comparison possible — that the printed spelling still has no `xargs`
 * layer to build the forbidden variant FROM (T-090).
 */
test("RANGE RULE — the DOCS GATE's printed spelling still carries no `xargs`", () => {
  const recipe = parseDocsGateRecipe(conventions());
  expect(recipe.gateLine).not.toContain("xargs");
  expect(recipe.treeLine).not.toContain("xargs");
  // POSITIVE CONTROL: the forbidden variant is BUILT from the printed one
  // rather than retyped, so it must be constructible right now, and it
  // must refuse to be built once the printed line grows a pipe of its own.
  expect(pipedThroughXargs(recipe.gateLine)).toContain("xargs");
  expect(() => pipedThroughXargs(`${recipe.gateLine} | xargs true`)).toThrow(/already contains/);
});
