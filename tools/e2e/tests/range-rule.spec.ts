import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { parseRangeRule, rangeRuleBullet, parseDocsGateRecipe, pipedThroughXargs, flipListFindings } from "../scripts/range-rule.mjs";

// Authored parser examples; historical31-merge corroboration requires the
// explicit selected RECORDS-policy + PRODUCT-history route before activation.
const conventions = () => readFileSync(fileURLToPath(new URL("../fixtures/range-rule-grammar.md", import.meta.url)), "utf8");

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


test("gate-specific flip labels retain an independent positive and relabel control", () => {
  const claims = parseRangeRule(conventions());
  const b = "bbbbbbb" + "b".repeat(33), c = "ccccccc" + "c".repeat(33);
  const derivation = {
    merges: [b, c], flipsAtFlipRef: {
      "BOOT GATE": { flips: [b], perMerge: { [b]: { prescribed: 0, naive: 1 }, [c]: { prescribed: 0, naive: 0 } } },
      "GRAPH REGEN": { flips: [c], perMerge: { [b]: { prescribed: 0, naive: 0 }, [c]: { prescribed: 0, naive: 1 } } },
    },
  } as unknown as Parameters<typeof flipListFindings>[0];
  expect(flipListFindings(derivation, claims)).toEqual([]);
  const relabelled = { ...claims, flipsByGate: { "BOOT GATE": claims.flipsByGate["GRAPH REGEN"]!, "GRAPH REGEN": claims.flipsByGate["BOOT GATE"]! } };
  expect(Object.values(relabelled.flipsByGate).flat().map(row => row.hash).sort()).toEqual(Object.values(claims.flipsByGate).flat().map(row => row.hash).sort());
  expect(flipListFindings(derivation, relabelled).join(" ")).toMatch(/BOOT GATE segment|GRAPH REGEN segment/);
});
